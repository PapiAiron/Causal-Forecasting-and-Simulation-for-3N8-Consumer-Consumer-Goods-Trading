from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import json
import calendar
import os

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "prophet_sales_forecast.pkl")
SAVED_MODEL = None
if os.path.exists(MODEL_PATH):
    try:
        SAVED_MODEL = joblib.load(MODEL_PATH)
    except Exception as e:
        print(f"Error loading model: {e}")
        SAVED_MODEL = None


def parse_num_series(s, index=None):
    if s is None:
        return pd.Series(dtype=float, index=index)
    if isinstance(s, pd.Series):
        return pd.to_numeric(s.astype(str).str.replace(r'[,\£\$]', '', regex=True).str.replace(r'\s+', '', regex=True).str.strip(), errors='coerce')
    return pd.to_numeric(pd.Series(s, index=index).astype(str).str.replace(r'[,\£\$]', '', regex=True).str.replace(r'\s+', '', regex=True).str.strip(), errors='coerce')


def detect_date_column(df):
    best_col, best_score = None, -1
    for col in df.columns:
        sample = df[col].dropna().astype(str).head(200)
        if sample.empty:
            continue
        score = pd.to_datetime(sample, errors='coerce').notna().sum()
        if score > best_score:
            best_score = score
            best_col = col
    return best_col


def format_mdy(ts):
    try:
        ts = pd.to_datetime(ts)
        return f"{ts.month}/{ts.day}/{ts.year}"
    except Exception:
        return None


def clean_outliers_and_fill_gaps(df):
    """
    Remove outliers using IQR method and fill gaps with interpolation
    """
    # Calculate outlier bounds
    Q1 = df['y'].quantile(0.25)
    Q3 = df['y'].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    
    print(f"\nData cleaning:")
    print(f"  Original data points: {len(df)}")
    print(f"  Outlier bounds: {lower_bound:.0f} to {upper_bound:.0f}")
    
    # Identify outliers
    outliers_mask = (df['y'] < lower_bound) | (df['y'] > upper_bound)
    num_outliers = outliers_mask.sum()
    print(f"  Outliers detected: {num_outliers} ({num_outliers/len(df)*100:.1f}%)")
    
    # Cap outliers instead of removing them (more conservative)
    df_clean = df.copy()
    df_clean.loc[df_clean['y'] > upper_bound, 'y'] = upper_bound
    df_clean.loc[df_clean['y'] < lower_bound, 'y'] = lower_bound
    
    # Create complete date range
    date_range = pd.date_range(start=df_clean['ds'].min(), end=df_clean['ds'].max(), freq='D')
    df_complete = pd.DataFrame({'ds': date_range})
    
    # Merge with cleaned data
    df_complete = df_complete.merge(df_clean, on='ds', how='left')
    
    # Fill missing values with linear interpolation
    df_complete['y'] = df_complete['y'].interpolate(method='linear', limit_direction='both')
    
    # If still NaN (at edges), use forward/backward fill
    df_complete['y'] = df_complete['y'].fillna(method='ffill').fillna(method='bfill')
    
    # Ensure no negatives
    df_complete['y'] = df_complete['y'].clip(lower=0)
    
    print(f"  Final clean data points: {len(df_complete)}")
    print(f"  Date range: {df_complete['ds'].min()} to {df_complete['ds'].max()}")
    
    return df_complete


@app.route("/forecast", methods=["POST"])
def forecast():
    try:
        if SAVED_MODEL is None:
            return jsonify({"error": "Model not found. Train the model first."}), 400

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        forecast_days = int(request.form.get("days", 30))
        forecast_days = max(30, min(forecast_days, 730))
        
        # Load CSV
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        df.columns = [c.strip() for c in df.columns]

        # Remove header repeat rows
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        # Detect date column BEFORE lowercasing
        date_col_original = None
        for cand in ["Date", "date", "DATE", "ds"]:
            if cand in df.columns:
                date_col_original = cand
                break
        
        if date_col_original is None:
            date_col_original = detect_date_column(df)
        
        if date_col_original is None:
            return jsonify({"error": "No date column found"}), 400

        # Lowercase all columns
        df.columns = [c.lower().strip() for c in df.columns]
        
        # Rename date column to 'ds'
        date_col_lower = date_col_original.lower().strip()
        if date_col_lower in df.columns and date_col_lower != "ds":
            df.rename(columns={date_col_lower: "ds"}, inplace=True)

        if "ds" not in df.columns:
            return jsonify({"error": f"Failed to create 'ds' column. Columns: {list(df.columns)}"}), 400

        # Parse columns
        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["sku"] = parse_num_series(df.get("sku"), index=df.index)
        df["value"] = parse_num_series(df.get("value"), index=df.index)

        # Clean data
        keep_mask = (~df["ds"].isna()) & ((df["sku"].notna() & (df["sku"] > 0)) | (df["value"].notna() & (df["value"] > 0)))
        if keep_mask.sum() == 0:
            keep_mask = (~df["ds"].isna())
        
        df = df.loc[keep_mask].copy()
        
        if df.empty:
            return jsonify({"error": "No valid data after cleaning"}), 400

        # Remove duplicates
        cols_for_dup = [c for c in ["ds", "outlet", "sku", "value"] if c in df.columns]
        if cols_for_dup:
            df = df.drop_duplicates(subset=cols_for_dup, keep="first")

        df = df.sort_values("ds").reset_index(drop=True)

        # Aggregate by date
        agg_dict = {}
        if "sku" in df.columns:
            agg_dict["sku"] = "sum"
        if "value" in df.columns:
            agg_dict["value"] = "sum"
        
        if not agg_dict:
            return jsonify({"error": "No numeric columns to aggregate"}), 400

        df_agg = df.groupby("ds").agg(agg_dict).reset_index()
        
        # Set target variable
        if "sku" in df_agg.columns and df_agg["sku"].sum() > 0:
            df_agg["y"] = df_agg["sku"]
        else:
            df_agg["y"] = df_agg.get("value", 0)

        # Prepare Prophet format
        prophet_df = df_agg[["ds", "y"]].copy()

        # Clean outliers and fill gaps - THIS IS THE KEY FIX
        prophet_df_clean = clean_outliers_and_fill_gaps(prophet_df)

        # Store ALL historical data (including cleaned)
        historical_dates = prophet_df_clean["ds"].dt.strftime("%Y-%m-%d").tolist()
        historical_values = prophet_df_clean["y"].tolist()

        # Generate forecast using Prophet
        from prophet import Prophet
        
        prophet_model = Prophet(
            seasonality_mode='multiplicative',
            changepoint_prior_scale=0.5,
            seasonality_prior_scale=10.0,
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=0.95
        )
        
        prophet_model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
        
        print(f"\nTraining Prophet model on {len(prophet_df_clean)} data points...")
        prophet_model.fit(prophet_df_clean)

        # Make predictions
        future = prophet_model.make_future_dataframe(periods=forecast_days, freq='D')
        forecast = prophet_model.predict(future)
        
        # Clip negative predictions
        forecast['yhat'] = forecast['yhat'].clip(lower=0)
        forecast['yhat_lower'] = forecast['yhat_lower'].clip(lower=0)
        forecast['yhat_upper'] = forecast['yhat_upper'].clip(lower=0)

        # Get future predictions only
        future_forecast = forecast[forecast['ds'] > prophet_df_clean['ds'].max()].copy()

        # Build response
        forecast_dates = future_forecast['ds'].dt.strftime("%Y-%m-%d").tolist()
        combined_dates = historical_dates + forecast_dates

        combined_actual = historical_values + [None] * len(forecast_dates)
        combined_base = [None] * len(historical_dates) + future_forecast['yhat'].tolist()
        combined_lower = [None] * len(historical_dates) + future_forecast['yhat_lower'].tolist()
        combined_upper = [None] * len(historical_dates) + future_forecast['yhat_upper'].tolist()

        graph_series = {
            "actual": combined_actual,
            "base": combined_base,
            "lower_bound": combined_lower,
            "upper_bound": combined_upper
        }

        forecast_list = []
        for idx, row in future_forecast.iterrows():
            forecast_list.append({
                "ds": format_mdy(row['ds']),
                "pred": max(0.0, float(row['yhat'])),
                "pred_lower": max(0.0, float(row['yhat_lower'])),
                "pred_upper": max(0.0, float(row['yhat_upper']))
            })

        # Calculate metrics on historical fit
        hist_forecast = forecast[forecast['ds'] <= prophet_df_clean['ds'].max()].copy()
        hist_forecast = hist_forecast.merge(prophet_df_clean, on='ds', how='left')
        valid_data = hist_forecast.dropna(subset=['y', 'yhat'])
        
        if len(valid_data) > 0:
            mae = float(np.mean(np.abs(valid_data['y'] - valid_data['yhat'])))
            rmse = float(np.sqrt(np.mean((valid_data['y'] - valid_data['yhat'])**2)))
            mape = float(np.mean(np.abs((valid_data['y'] - valid_data['yhat']) / valid_data['y'])) * 100)
        else:
            mae, rmse, mape = 0.0, 0.0, 0.0

        metrics = {
            "mae": mae,
            "rmse": rmse,
            "mape": mape
        }

        print(f"\nForecast complete:")
        print(f"  MAE: {mae:.2f}")
        print(f"  RMSE: {rmse:.2f}")
        print(f"  MAPE: {mape:.2f}%")

        return jsonify({
            "model_used": "prophet",
            "forecast": forecast_list,
            "graph": {"dates": combined_dates, "series": graph_series},
            "scenario_results": {"base": future_forecast['yhat'].tolist()},
            "decisions": [],
            "feature_importance": None,
            "monthly_total": float(future_forecast['yhat'].sum()),
            "forecast_days": forecast_days,
            "metrics": metrics
        })

    except Exception as e:
        import traceback
        print(f"Error in /forecast: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400


@app.route("/causal-analysis", methods=["POST"])
def causal_analysis():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        df.columns = [c.strip() for c in df.columns]
        
        # Remove header repeats
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        df.columns = [c.lower().strip() for c in df.columns]

        # Find date column
        date_col = None
        for cand in ["date", "ds"]:
            if cand in df.columns:
                date_col = cand
                break
        
        if date_col is None:
            date_col = detect_date_column(df)
        
        if date_col is None:
            return jsonify({"error": "No date column found"}), 400
        
        if date_col != "ds":
            df.rename(columns={date_col: "ds"}, inplace=True)

        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["sku"] = parse_num_series(df.get("sku"), index=df.index)
        df["value"] = parse_num_series(df.get("value"), index=df.index)
        
        df = df.dropna(subset=["ds"]).reset_index(drop=True)

        # Aggregate
        agg_cols = {}
        if "sku" in df.columns:
            agg_cols["sku"] = "sum"
        if "value" in df.columns:
            agg_cols["value"] = "sum"
        
        if not agg_cols:
            return jsonify({"causal_factors": [], "seasonal_data": [], "daily_data": []})

        df_agg = df.groupby("ds").agg(agg_cols).reset_index()
        
        if "sku" in df_agg.columns and df_agg["sku"].sum() > 0:
            df_agg["y"] = df_agg["sku"]
        else:
            df_agg["y"] = df_agg.get("value", 0.0)

        # Daily data
        daily_data = []
        for _, row in df_agg.sort_values("ds").iterrows():
            daily_data.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "value": float(row["y"])
            })

        # Causal factors (correlations)
        causal_factors = []
        for col in df_agg.columns:
            if col in ("ds", "y"):
                continue
            try:
                if pd.api.types.is_numeric_dtype(df_agg[col]):
                    corr = abs(pd.to_numeric(df_agg[col], errors="coerce").corr(pd.to_numeric(df_agg["y"], errors="coerce")))
                    if not pd.isna(corr):
                        causal_factors.append({"factor": col, "correlation": float(corr)})
            except:
                continue

        causal_factors = sorted(causal_factors, key=lambda x: x["correlation"], reverse=True)

        # Seasonal data
        seasonal = []
        df_agg["month"] = df_agg["ds"].dt.month
        mg = df_agg.groupby("month")["y"].agg(["mean", "sum"]).reset_index()
        overall_mean = df_agg["y"].mean() if not df_agg["y"].empty else 0
        
        for _, row in mg.iterrows():
            month = calendar.month_abbr[int(row["month"])]
            seasonal.append({
                "month": month,
                "seasonalFactor": float(row["mean"] / overall_mean) if overall_mean else 0.0,
                "actualDemand": float(row["sum"])
            })

        return jsonify({
            "causal_factors": causal_factors,
            "seasonal_data": seasonal,
            "daily_data": daily_data
        })

    except Exception as e:
        import traceback
        print(f"Error in /causal-analysis: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)