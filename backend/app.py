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

# Path to saved model (joblib dict with keys: model, scaler, feature_columns, feature_importance)
MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "sales_forecast_model.pkl")
SAVED_MODEL = None
if os.path.exists(MODEL_PATH):
    try:
        SAVED_MODEL = joblib.load(MODEL_PATH)
        if isinstance(SAVED_MODEL, dict):
            fc = SAVED_MODEL.get("feature_columns", []) or []
            SAVED_MODEL["feature_columns"] = list(dict.fromkeys(fc))
    except Exception:
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


# Build continuous daily aggregated series from historical rows (aggregates by date)
def create_daily_series(df):
    ser = df.groupby("ds")["y"].sum()
    ser.index = pd.to_datetime(ser.index)
    full_idx = pd.date_range(start=ser.index.min(), end=ser.index.max(), freq="D")
    ser = ser.reindex(full_idx, fill_value=0)
    ser.index.name = "date"
    ser = ser.rename("y")
    return ser


# Produce future engineered features for the next `days` days using history (lags, rolling)
def build_future_features_from_history(df, days=30):
    df = df.copy()
    df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
    df = df.dropna(subset=["ds"]).sort_values("ds")
    if df.empty:
        # build fallback continuous dates from today
        last_date = pd.Timestamp.today().normalize()
        future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=days, freq="D")
        future_df = pd.DataFrame({"ds": future_dates})
        # add simple time features
        future_df["year"] = future_df["ds"].dt.year
        future_df["month"] = future_df["ds"].dt.month
        future_df["day"] = future_df["ds"].dt.day
        future_df["day_of_week"] = future_df["ds"].dt.dayofweek
        future_df["is_weekend"] = (future_df["day_of_week"] >= 5).astype(int)
        return future_df

    hist = create_daily_series(df)
    last_date = hist.index.max()
    future_dates = pd.date_range(start=last_date + pd.Timedelta(days=1), periods=days, freq="D")
    combined_idx = hist.index.append(future_dates)
    combined = pd.DataFrame(index=combined_idx)
    combined["y"] = 0.0
    combined.loc[hist.index, "y"] = hist.values
    combined["sales_lag_1"] = combined["y"].shift(1)
    combined["sales_lag_7"] = combined["y"].shift(7)
    combined["sales_lag_30"] = combined["y"].shift(30)
    combined["sales_rolling_7"] = combined["y"].rolling(window=7, min_periods=1).mean()
    combined["sales_rolling_30"] = combined["y"].rolling(window=30, min_periods=1).mean()
    combined["sales_rolling_std_7"] = combined["y"].rolling(window=7, min_periods=1).std().fillna(0.0)

    future_df = combined.loc[future_dates].reset_index().rename(columns={"index": "ds"})
    # time features
    future_df["year"] = future_df["ds"].dt.year
    future_df["month"] = future_df["ds"].dt.month
    future_df["day"] = future_df["ds"].dt.day
    future_df["day_of_week"] = future_df["ds"].dt.dayofweek
    future_df["is_weekend"] = (future_df["day_of_week"] >= 5).astype(int)
    future_df["month_sin"] = np.sin(2 * np.pi * future_df["month"] / 12)
    future_df["month_cos"] = np.cos(2 * np.pi * future_df["month"] / 12)
    future_df["day_sin"] = np.sin(2 * np.pi * future_df["day_of_week"] / 7)
    future_df["day_cos"] = np.cos(2 * np.pi * future_df["day_of_week"] / 7)

    # numeric means from historical df to fill other numeric features (e.g. price, promo)
    for col in df.columns:
        if col not in ("ds", "y") and pd.api.types.is_numeric_dtype(df[col]):
            future_df[col] = df[col].dropna().mean()

    return future_df


def prepare_features_for_model(input_df, feature_columns, scaler):
    if feature_columns is None:
        feature_columns = []
    # sanitize features & dedupe
    reserved = {"ds", "date", "y"}
    seen = set()
    clean_features = []
    for f in feature_columns:
        if not isinstance(f, str):
            continue
        if f in reserved:
            continue
        if f in seen:
            continue
        seen.add(f)
        clean_features.append(f)
    feature_columns = clean_features

    X = pd.DataFrame(index=input_df.index)
    for feat in feature_columns:
        if feat in input_df.columns:
            X[feat] = pd.to_numeric(input_df[feat], errors="coerce")
        else:
            X[feat] = 0.0
    if not X.empty:
        X = X.fillna(X.mean(axis=0))
    # scale if scaler provided
    if scaler is not None and hasattr(scaler, "transform"):
        try:
            X_scaled = scaler.transform(X)
        except Exception:
            X_scaled = X.values
    else:
        X_scaled = X.values
    return X, X_scaled


@app.route("/forecast", methods=["POST"])
def forecast():
    try:
        if SAVED_MODEL is None:
            return jsonify({"error": "Saved model not found. Place sales_forecast_model.pkl under backend/model/"}), 400

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        
        # Get forecast period from request (default 30 days)
        forecast_days = int(request.form.get("days", 30))
        # Limit to reasonable range: 30 days to 2 years
        forecast_days = max(30, min(forecast_days, 730))
        
        try:
            df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        except Exception:
            return jsonify({"error": "Invalid CSV format"}), 400

        # normalize colnames and strip rows that are header repeats or empty
        df.columns = [c.strip() for c in df.columns]
        df_lc = df.copy()
        df_lc.columns = [c.lower().strip() for c in df.columns]

        # remove rows that are repeated header
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = df[second_col].astype(str).str.strip().str.upper().isin(["OUTLET"]) | df.iloc[:, 0].astype(str).str.strip().str.upper().isin(["DATE"])
            df = df.loc[~mask_header]

        df = df.reset_index(drop=True)

        # detect date column name
        date_col = None
        for cand in ["date", "Date", "DATE", "ds"]:
            if cand in df.columns:
                date_col = cand
                break
        if date_col is None:
            date_col = detect_date_column(df_lc)
            if date_col is None:
                return jsonify({"error": "CSV missing date column"}), 400

        # normalize to lower column names
        df.columns = [c.lower().strip() for c in df.columns]
        if date_col.lower().strip() != "ds":
            df.rename(columns={date_col.lower().strip(): "ds"}, inplace=True)

        # parse sku and value robustly
        df["sku"] = parse_num_series(df.get("sku"), index=df.index)
        df["value"] = parse_num_series(df.get("value"), index=df.index)

        # drop rows where both sku and value are null/zero and date is missing
        df["ds_parsed"] = pd.to_datetime(df["ds"], errors="coerce")
        keep_mask = (~df["ds_parsed"].isna()) & ((df["sku"].notna() & (df["sku"] != 0)) | (df["value"].notna() & (df["value"] != 0)))
        if keep_mask.sum() == 0:
            keep_mask = (~df["ds_parsed"].isna())
        df = df.loc[keep_mask].copy()

        if df.empty:
            return jsonify({"error": "No usable rows after cleaning CSV"}), 400

        # remove duplicate rows
        cols_for_dup = [c for c in ["ds", "outlet", "sku", "value"] if c in df.columns]
        if cols_for_dup:
            df = df.drop_duplicates(subset=cols_for_dup, keep="first")

        # set ds normalized
        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df = df.dropna(subset=["ds"]).sort_values("ds").reset_index(drop=True)

        # aggregate by date
        agg_dict = {}
        if "sku" in df.columns:
            agg_dict["sku"] = "sum"
        if "value" in df.columns:
            agg_dict["value"] = "sum"
        numeric_cols = [c for c in df.columns if c not in ("ds", "outlet", "sku", "value") and pd.api.types.is_numeric_dtype(df[c])]
        for c in numeric_cols:
            agg_dict[c] = "mean"
        if not agg_dict:
            return jsonify({"error": "No numeric columns to aggregate for model input"}), 400

        df_agg = df.groupby("ds").agg(agg_dict).reset_index()
        if "sku" in df_agg.columns and df_agg["sku"].sum() > 0:
            df_agg["y"] = df_agg["sku"]
        else:
            df_agg["y"] = df_agg.get("value", pd.Series(0.0))

        # STORE HISTORICAL DATA
        historical_dates = df_agg["ds"].dt.strftime("%Y-%m-%d").tolist()
        historical_values = df_agg["y"].tolist()

        # Build future engineered features with custom forecast days
        future_feats = build_future_features_from_history(
            df_agg.rename(columns={"ds": "ds", "y": "y"}), 
            days=forecast_days
        )

        # load model artifacts
        model_obj = SAVED_MODEL.get("model") if isinstance(SAVED_MODEL, dict) else SAVED_MODEL
        scaler = SAVED_MODEL.get("scaler") if isinstance(SAVED_MODEL, dict) else None
        feature_columns = SAVED_MODEL.get("feature_columns", []) if isinstance(SAVED_MODEL, dict) else []
        feature_importance = SAVED_MODEL.get("feature_importance", None) if isinstance(SAVED_MODEL, dict) else None

        # apply causal overrides if provided
        causal_str = request.form.get("causal", None)
        scenarios = {}
        if causal_str:
            try:
                causal = json.loads(causal_str)
                for k, v in causal.items():
                    if isinstance(v, list):
                        scenarios[k] = {"feature": k, "values": v}
                    else:
                        try:
                            scenarios[k] = {"feature": k, "values": [float(v)] * len(future_feats)}
                        except Exception:
                            scenarios[k] = {"feature": k, "values": [0.0] * len(future_feats)}
            except Exception:
                pass

        # Prepare model features and predict
        X_base_df = future_feats.copy()
        X_prepared, X_scaled = prepare_features_for_model(X_base_df, feature_columns, scaler)

        try:
            base_pred = model_obj.predict(X_scaled)
        except Exception:
            base_pred = model_obj.predict(X_prepared)

        scenario_results = {"base": np.asarray(base_pred).astype(float).tolist()}

        for scen_key, scen in scenarios.items():
            Xs = X_base_df.copy()
            feat_name = scen["feature"]
            vals = scen["values"]
            if feat_name in Xs.columns:
                if len(vals) >= len(Xs):
                    Xs[feat_name] = vals[: len(Xs)]
                else:
                    Xs[feat_name] = (vals + [vals[-1]] * len(Xs))[: len(Xs)]
            else:
                Xs[feat_name] = (vals + [vals[-1] if vals else 0.0] * len(Xs))[: len(Xs)]
            Xp, Xscl = prepare_features_for_model(Xs, feature_columns, scaler)
            try:
                pred = model_obj.predict(Xscl)
            except Exception:
                pred = model_obj.predict(Xp)
            scenario_results[scen_key] = np.asarray(pred).astype(float).tolist()

        # build graph payload with unique series keys - COMBINE HISTORICAL AND FORECAST
        forecast_dates = [d.strftime("%Y-%m-%d") for d in pd.to_datetime(X_base_df["ds"]).tolist()]
        combined_dates = historical_dates + forecast_dates
        
        # Create combined series with actual + predicted
        combined_actual = historical_values + [None] * len(forecast_dates)
        combined_base = [None] * len(historical_dates) + scenario_results["base"]
        
        graph_series = {}
        graph_series["actual"] = combined_actual
        graph_series["base"] = combined_base
        
        for k, v in scenario_results.items():
            if k == "base":
                continue
            key = str(k)
            if key in graph_series:
                i = 1
                while f"{key}_{i}" in graph_series:
                    i += 1
                key = f"{key}_{i}"
            # Pad scenarios with None for historical period
            graph_series[key] = [None] * len(historical_dates) + v

        # decisions (compare avg)
        decisions = []
        base_avg = float(np.mean(scenario_results["base"])) if len(scenario_results["base"]) else 0.0
        for k, preds in scenario_results.items():
            if k == "base":
                continue
            avg = float(np.mean(preds)) if len(preds) else 0.0
            pct = ((avg - base_avg) / base_avg) * 100 if base_avg != 0 else 0.0
            advice = "No action."
            if pct >= 5:
                advice = f"Increase investment in '{k}' (predicted +{pct:.1f}%)."
            elif pct <= -5:
                advice = f"Reduce emphasis on '{k}' (predicted {pct:.1f}%)."
            decisions.append({"scenario": k, "avg_change_pct": pct, "advice": advice})

        # feature importance safe conversion
        fi = None
        if feature_importance is not None:
            try:
                if isinstance(feature_importance, (list, dict)):
                    fi = feature_importance
                else:
                    fi = pd.DataFrame(feature_importance).to_dict(orient="records")
            except Exception:
                fi = None

        forecast_list = []
        for d, p in zip(forecast_dates, scenario_results["base"]):
            forecast_list.append({"ds": format_mdy(d), "pred": max(0.0, float(p)), "pred_lower": None, "pred_upper": None})

        return jsonify({
            "model_used": "saved_model",
            "forecast": forecast_list,
            "graph": {"dates": combined_dates, "series": graph_series},
            "scenario_results": scenario_results,
            "decisions": decisions,
            "feature_importance": fi,
            "monthly_total": float(np.nansum([max(0.0, float(x)) for x in scenario_results["base"]])),
            "forecast_days": forecast_days,
            "metrics": {}
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


@app.route("/causal-analysis", methods=["POST"])
def causal_analysis():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        file = request.files["file"]
        try:
            df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        except Exception:
            return jsonify({"error": "Invalid CSV format"}), 400

        df.columns = [c.strip() for c in df.columns]
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = df[second_col].astype(str).str.strip().str.upper().isin(["OUTLET"]) | df.iloc[:, 0].astype(str).str.strip().str.upper().isin(["DATE"])
            df = df.loc[~mask_header]
        df = df.reset_index(drop=True)
        df.columns = [c.lower().strip() for c in df.columns]

        date_col = None
        for cand in ["date", "ds"]:
            if cand in df.columns:
                date_col = cand
                break
        if date_col is None:
            date_col = detect_date_column(df)
            if date_col is None:
                return jsonify({"error": "CSV missing date column"}), 400
        if date_col != "ds":
            df.rename(columns={date_col: "ds"}, inplace=True)

        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["sku"] = parse_num_series(df.get("sku"), index=df.index)
        df["value"] = parse_num_series(df.get("value"), index=df.index)
        with np.errstate(divide="ignore", invalid="ignore"):
            df["price"] = df["value"] / df["sku"].replace({0: np.nan})
        df["price"] = df["price"].fillna(0.0)

        df = df.dropna(subset=["ds"]).reset_index(drop=True)

        agg_cols = {}
        if "sku" in df.columns:
            agg_cols["sku"] = "sum"
        if "value" in df.columns:
            agg_cols["value"] = "sum"
        numeric_cols = [c for c in df.columns if c not in ("ds", "outlet") and pd.api.types.is_numeric_dtype(df[c])]
        for c in numeric_cols:
            if c not in agg_cols:
                agg_cols[c] = "mean"
        if not agg_cols:
            return jsonify({"causal_factors": [], "seasonal_data": [], "daily_data": []})

        df_agg = df.groupby("ds").agg(agg_cols).reset_index()
        if "sku" in df_agg.columns and df_agg["sku"].sum() > 0:
            df_agg["y"] = df_agg["sku"]
        else:
            df_agg["y"] = df_agg.get("value", 0.0)

        # DAILY DATA for visualization
        daily_data = []
        df_agg_sorted = df_agg.sort_values("ds")
        for _, row in df_agg_sorted.iterrows():
            daily_data.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "value": float(row["y"])
            })

        causal_factors = []
        for col in df_agg.columns:
            if col in ("ds", "y"):
                continue
            try:
                if pd.api.types.is_numeric_dtype(df_agg[col]):
                    corr = abs(pd.to_numeric(df_agg[col], errors="coerce").corr(pd.to_numeric(df_agg["y"], errors="coerce")))
                    if not pd.isna(corr):
                        causal_factors.append({"factor": col, "correlation": float(corr)})
                else:
                    if col == "outlet":
                        codes = pd.factorize(df_agg[col].astype(str).fillna("NA"))[0]
                        corr = abs(pd.Series(codes).corr(pd.to_numeric(df_agg["y"], errors="coerce")))
                        if not pd.isna(corr):
                            causal_factors.append({"factor": col, "correlation": float(corr)})
            except Exception:
                continue

        causal_factors = sorted(causal_factors, key=lambda x: x["correlation"], reverse=True)

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
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)