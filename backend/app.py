from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
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
        return pd.to_numeric(
            s.astype(str).str.replace(r'[,\£\$]', '', regex=True)
             .str.replace(r'\s+', '', regex=True)
             .str.strip(), errors='coerce'
        )
    return pd.to_numeric(
        pd.Series(s, index=index).astype(str)
         .str.replace(r'[,\£\$]', '', regex=True)
         .str.replace(r'\s+', '', regex=True)
         .str.strip(), errors='coerce'
    )


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


def clean_outliers(df, column='y'):
    """Remove extreme outliers using IQR method"""
    if df.empty or column not in df.columns:
        return df
    
    original_count = len(df)
    Q1 = df[column].quantile(0.25)
    Q3 = df[column].quantile(0.75)
    IQR = Q3 - Q1
    lower_bound = Q1 - 1.5 * IQR
    upper_bound = Q3 + 1.5 * IQR
    df = df[(df[column] >= lower_bound) & (df[column] <= upper_bound)]
    
    removed = original_count - len(df)
    if removed > 0:
        print(f"Removed {removed} outliers ({removed/original_count*100:.1f}%)")
    
    return df


def fill_missing_dates(df, date_col='ds', value_col='y'):
    """Fill missing dates with interpolated values"""
    if df.empty:
        return df
    
    date_range = pd.date_range(start=df[date_col].min(), end=df[date_col].max(), freq='D')
    df_complete = df.set_index(date_col).reindex(date_range)
    df_complete[value_col] = df_complete[value_col].interpolate(method='linear', limit_direction='both')
    df_complete[value_col] = df_complete[value_col].fillna(method='ffill').fillna(method='bfill')
    df_complete = df_complete.reset_index()
    df_complete.columns = [date_col, value_col]
    
    filled = len(date_range) - len(df)
    if filled > 0:
        print(f"Filled {filled} missing dates ({len(df)} to {len(date_range)} days)")
    
    return df_complete


def smooth_series(series, window=7):
    """Apply moving average smoothing"""
    return series.rolling(window=window, center=True, min_periods=1).mean()


def format_mdy(ts):
    try:
        ts = pd.to_datetime(ts)
        return f"{ts.month}/{ts.day}/{ts.year}"
    except Exception:
        return None


@app.route("/forecast", methods=["POST"])
def forecast():
    try:
        if SAVED_MODEL is None:
            print("WARNING: No pre-trained model found, using fresh Prophet model")

        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        forecast_days = int(request.form.get("days", 30))
        forecast_days = max(30, min(forecast_days, 730))
        
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        df.columns = [c.strip() for c in df.columns]

        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        date_col_original = None
        for cand in ["Date", "date", "DATE", "ds"]:
            if cand in df.columns:
                date_col_original = cand
                break
        
        if date_col_original is None:
            date_col_original = detect_date_column(df)
        
        if date_col_original is None:
            return jsonify({"error": "No date column found"}), 400

        df.columns = [c.lower().strip() for c in df.columns]
        date_col_lower = date_col_original.lower().strip()
        if date_col_lower in df.columns and date_col_lower != "ds":
            df.rename(columns={date_col_lower: "ds"}, inplace=True)

        if "ds" not in df.columns:
            return jsonify({"error": f"Failed to create 'ds' column"}), 400

        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["sku"] = parse_num_series(df.get("sku"), index=df.index)
        df["value"] = parse_num_series(df.get("value"), index=df.index)

        keep_mask = (~df["ds"].isna()) & (
            (df["sku"].notna() & (df["sku"] > 0)) | 
            (df["value"].notna() & (df["value"] > 0))
        )
        if keep_mask.sum() == 0:
            keep_mask = (~df["ds"].isna())
        
        df = df.loc[keep_mask].copy()
        
        if df.empty:
            return jsonify({"error": "No valid data after cleaning"}), 400

        cols_for_dup = [c for c in ["ds", "outlet", "sku", "value"] if c in df.columns]
        if cols_for_dup:
            df = df.drop_duplicates(subset=cols_for_dup, keep="first")

        df = df.sort_values("ds").reset_index(drop=True)

        agg_dict = {}
        if "sku" in df.columns:
            agg_dict["sku"] = "sum"
        if "value" in df.columns:
            agg_dict["value"] = "sum"
        
        if not agg_dict:
            return jsonify({"error": "No numeric columns to aggregate"}), 400

        df_agg = df.groupby("ds").agg(agg_dict).reset_index()
        
        if "sku" in df_agg.columns and df_agg["sku"].sum() > 0:
            df_agg["y"] = df_agg["sku"]
        else:
            df_agg["y"] = df_agg.get("value", 0)

        prophet_df = df_agg[["ds", "y"]].copy()
        
        print(f"\nDATA PROCESSING PIPELINE")
        print(f"Raw data: {len(prophet_df)} points | Range: {prophet_df['ds'].min().date()} to {prophet_df['ds'].max().date()}")
        print(f"Mean: {prophet_df['y'].mean():.0f} | Std: {prophet_df['y'].std():.0f}")
        
        prophet_df = clean_outliers(prophet_df, column='y')
        
        if len(prophet_df) < 10:
            return jsonify({"error": f"Insufficient data after outlier removal. Need at least 10 points, got {len(prophet_df)}"}), 400
        
        prophet_df = fill_missing_dates(prophet_df, date_col='ds', value_col='y')
        prophet_df['y'] = smooth_series(prophet_df['y'], window=3)
        
        print(f"Final training data: {len(prophet_df)} points\n")

        from prophet import Prophet
        
        prophet_model = Prophet(
            seasonality_mode='additive',
            changepoint_prior_scale=0.05,
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=0.80,
            seasonality_prior_scale=2.0,
            changepoint_range=0.8
        )
                
        prophet_model.add_seasonality(name='monthly', period=30.5, fourier_order=2)
        
        print("Training Prophet model...")
        prophet_model.fit(prophet_df)
        print("Model trained successfully!\n")

        future = prophet_model.make_future_dataframe(periods=forecast_days, freq='D')
        forecast_result = prophet_model.predict(future)
        
        hist_mean = prophet_df['y'].mean()
        hist_std = prophet_df['y'].std()
        reasonable_upper = hist_mean + 1.5 * hist_std
        reasonable_lower = max(0, hist_mean - 1.5 * hist_std)
        
        forecast_result['yhat'] = forecast_result['yhat'].clip(lower=reasonable_lower, upper=reasonable_upper)
        forecast_result['yhat_lower'] = forecast_result['yhat_lower'].clip(lower=0, upper=reasonable_upper)
        forecast_result['yhat_upper'] = forecast_result['yhat_upper'].clip(lower=0, upper=reasonable_upper)
        
        forecast_result['yhat'] = smooth_series(forecast_result['yhat'], window=3)
        forecast_result['yhat_lower'] = smooth_series(forecast_result['yhat_lower'], window=3)
        forecast_result['yhat_upper'] = smooth_series(forecast_result['yhat_upper'], window=3)

        future_forecast = forecast_result[forecast_result['ds'] > prophet_df['ds'].max()].copy()

        original_hist = df_agg[["ds", "y"]].copy()
        historical_dates = original_hist['ds'].dt.strftime("%Y-%m-%d").tolist()
        historical_values = original_hist['y'].tolist()
        forecast_dates = future_forecast['ds'].dt.strftime("%Y-%m-%d").tolist()
        
        forecast_values = [float(v) if pd.notna(v) else hist_mean for v in future_forecast['yhat'].tolist()]
        forecast_lower = [float(v) if pd.notna(v) else reasonable_lower for v in future_forecast['yhat_lower'].tolist()]
        forecast_upper = [float(v) if pd.notna(v) else reasonable_upper for v in future_forecast['yhat_upper'].tolist()]
        
        combined_dates = historical_dates + forecast_dates
        combined_actual = historical_values + [None] * len(forecast_dates)
        combined_baseline = [None] * len(historical_dates) + forecast_values
        combined_predicted = [None] * len(historical_dates) + forecast_values
        combined_lower = [None] * len(historical_dates) + forecast_lower
        combined_upper = [None] * len(historical_dates) + forecast_upper

        graph_series = {
            "actual": combined_actual,
            "baseline": combined_baseline,
            "base": combined_predicted,
            "predicted": combined_predicted,
            "lower_bound": combined_lower,
            "upper_bound": combined_upper
        }

        forecast_list = []
        for _, row in future_forecast.iterrows():
            yhat_val = float(row['yhat']) if pd.notna(row['yhat']) else hist_mean
            lower_val = float(row['yhat_lower']) if pd.notna(row['yhat_lower']) else reasonable_lower
            upper_val = float(row['yhat_upper']) if pd.notna(row['yhat_upper']) else reasonable_upper
            
            forecast_list.append({
                "ds": format_mdy(row['ds']),
                "pred": yhat_val,
                "pred_lower": lower_val,
                "pred_upper": upper_val
            })

        hist_forecast = forecast_result[forecast_result['ds'] <= prophet_df['ds'].max()].copy()
        hist_forecast = hist_forecast.merge(prophet_df, on='ds', how='left')
        valid_data = hist_forecast.dropna(subset=['y', 'yhat'])
        
        if len(valid_data) > 0:
            mae = float(np.mean(np.abs(valid_data['y'] - valid_data['yhat'])))
            rmse = float(np.sqrt(np.mean((valid_data['y'] - valid_data['yhat'])**2)))
            mape_vals = np.abs((valid_data['y'] - valid_data['yhat']) / valid_data['y'])
            mape = float(np.mean(mape_vals[np.isfinite(mape_vals)]) * 100) if np.any(np.isfinite(mape_vals)) else 0.0
        else:
            mae, rmse, mape = 0.0, 0.0, 0.0

        metrics = {"mae": mae, "rmse": rmse, "mape": mape}

        return jsonify({
            "model_used": "prophet",
            "forecast": forecast_list,
            "graph": {"dates": combined_dates, "series": graph_series},
            "scenario_results": {"base": forecast_values},
            "decisions": [],
            "feature_importance": None,
            "monthly_total": float(sum(forecast_values)),
            "forecast_days": forecast_days,
            "metrics": metrics
        })

    except Exception as e:
        import traceback
        print(f"\nERROR IN FORECAST")
        print(f"{e}")
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
        
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        df.columns = [c.lower().strip() for c in df.columns]

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

        daily_data = []
        for _, row in df_agg.sort_values("ds").iterrows():
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
            except:
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
        import traceback
        print(f"Causal analysis error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400


@app.route("/simulate", methods=["POST"])
def simulate():
    """
    Industry-standard continuous review inventory simulation with periodic replenishment.
    Implements (Q, r) policy: Order quantity Q when inventory position reaches reorder point r.
    """
    try:
        data = request.json or {}

        def safe_int(x, default=0):
            if x is None:
                return int(default)
            try:
                if isinstance(x, str):
                    x = x.replace(",", "").strip()
                return int(float(x))
            except Exception:
                return int(default)

        def safe_float(x, default=0.0):
            if x is None:
                return float(default)
            try:
                if isinstance(x, str):
                    x = x.replace(",", "").strip()
                return float(x)
            except Exception:
                return float(default)

        # Extract user inputs
        replenishment_qty = safe_int(data.get("stock", 1000))  # Daily replenishment quantity
        lead_time = max(1, safe_int(data.get("lead_time", 1)))
        days = min(365, max(1, safe_int(data.get("days", 30))))
        scenario = (data.get("scenario") or "normal").lower()
        base_demand = safe_float(data.get("demand", 500.0))

        # Scenario multipliers
        scenario_multiplier = {
            "normal": 1.0, 
            "promo": 1.3, 
            "holiday": 1.5, 
            "economic_downturn": 0.8
        }.get(scenario, 1.0)

        # Calculate average daily demand
        avg_daily_demand = int(round(base_demand * scenario_multiplier))
        
        # Calculate safety stock (industry standard: 1.65 * std_dev * sqrt(lead_time))
        # Assuming std_dev is 20% of average demand (typical in retail)
        demand_std_dev = avg_daily_demand * 0.2
        safety_stock = int(1.65 * demand_std_dev * np.sqrt(lead_time))
        
        # Calculate reorder point: lead time demand + safety stock
        reorder_point = (avg_daily_demand * lead_time) + safety_stock
        
        # Starting inventory: Enough to cover initial period
        initial_stock = replenishment_qty * lead_time
        
        print(f"\nINVENTORY SIMULATION - CONTINUOUS REVIEW (Q, r) POLICY")
        print(f"=" * 60)
        print(f"Simulation Period: {days} days")
        print(f"Lead Time: {lead_time} days")
        print(f"Scenario: {scenario.upper()} (multiplier: {scenario_multiplier}x)")
        print(f"\nDEMAND PARAMETERS:")
        print(f"  Base Daily Demand: {base_demand:.0f} units")
        print(f"  Scenario Adjusted Demand: {avg_daily_demand} units/day")
        print(f"  Demand Std Dev: {demand_std_dev:.0f} units")
        print(f"\nINVENTORY POLICY:")
        print(f"  Replenishment Quantity (Q): {replenishment_qty} units")
        print(f"  Reorder Point (r): {reorder_point:.0f} units")
        print(f"  Safety Stock: {safety_stock} units")
        print(f"  Initial Stock: {initial_stock} units")
        print(f"=" * 60 + "\n")

        # Initialize simulation variables
        current_stock = initial_stock
        inventory_position = initial_stock  # Stock on hand + on order
        daily_results = []
        
        # Tracking metrics
        total_demand = 0
        total_served = 0
        total_shortages = 0
        total_replenishments = 0
        peak_stock = initial_stock
        min_stock = initial_stock
        stockout_days = 0
        
        # Order tracking (day: quantity arriving)
        pending_orders = {}

        for day in range(days):
            # Step 1: Receive any pending orders (lead time elapsed)
            if day in pending_orders:
                received_qty = pending_orders[day]
                current_stock += received_qty
                total_replenishments += received_qty
                del pending_orders[day]
                print(f"Day {day + 1}: Received order of {received_qty} units")
            
            # Step 2: Generate daily demand with variability
            # Add random variation (±20% of avg demand) for realism
            demand_variation = np.random.normal(0, demand_std_dev)
            demand_today = max(0, int(round(avg_daily_demand + demand_variation)))
            total_demand += demand_today
            
            # Step 3: Fulfill demand from current stock
            if current_stock >= demand_today:
                current_stock -= demand_today
                inventory_position -= demand_today
                served = demand_today
                shortage = 0
            else:
                served = current_stock
                shortage = demand_today - current_stock
                total_shortages += shortage
                inventory_position -= current_stock
                current_stock = 0
                stockout_days += 1
            
            total_served += served
            
            # Step 4: Check if we need to reorder (continuous review)
            if inventory_position <= reorder_point and (day + lead_time) not in pending_orders:
                # Place order that will arrive after lead time
                arrival_day = day + lead_time
                if arrival_day < days:
                    pending_orders[arrival_day] = replenishment_qty
                    inventory_position += replenishment_qty
                    print(f"Day {day + 1}: Placed order for {replenishment_qty} units (arrives Day {arrival_day + 1})")
            
            # Track peak and minimum stock levels
            if day == 0:
                peak_stock = current_stock
                min_stock = current_stock
            else:
                peak_stock = max(peak_stock, current_stock)
                min_stock = min(min_stock, current_stock)
            
            # Record daily results
            daily_results.append({
                "day": day,
                "demand": demand_today,
                "stock": current_stock,
                "unmet": shortage,
                "inventory_position": inventory_position
            })

        # Calculate final metrics
        final_stock = current_stock
        service_level = total_served / total_demand if total_demand > 0 else 1.0
        fill_rate = service_level
        stockout_rate = stockout_days / days
        shortage_rate = total_shortages / total_demand if total_demand > 0 else 0.0
        avg_inventory = sum(d['stock'] for d in daily_results) / len(daily_results)
        inventory_turnover = total_served / avg_inventory if avg_inventory > 0 else 0

        print(f"\nSIMULATION RESULTS")
        print(f"=" * 60)
        print(f"DEMAND METRICS:")
        print(f"  Total Demand: {total_demand:,} units")
        print(f"  Demand Served: {total_served:,} units")
        print(f"  Total Shortages: {total_shortages:,} units")
        print(f"\nINVENTORY METRICS:")
        print(f"  Final Stock: {final_stock:,} units")
        print(f"  Average Inventory: {avg_inventory:.0f} units")
        print(f"  Peak Stock: {peak_stock:,} units")
        print(f"  Minimum Stock: {min_stock:,} units")
        print(f"  Total Replenishments: {total_replenishments:,} units")
        print(f"\nPERFORMANCE METRICS:")
        print(f"  Service Level: {service_level*100:.1f}%")
        print(f"  Fill Rate: {fill_rate*100:.1f}%")
        print(f"  Stockout Days: {stockout_days}/{days} ({stockout_rate*100:.1f}%)")
        print(f"  Inventory Turnover: {inventory_turnover:.2f}x")
        print(f"=" * 60 + "\n")

        # Generate decision based on industry KPIs
        decision, decision_type = generate_inventory_decision(
            service_level, fill_rate, shortage_rate, stockout_rate, 
            avg_inventory, replenishment_qty, avg_daily_demand, scenario
        )

        return jsonify({
            "title": "Inventory Simulation - Continuous Review Policy",
            "scenario": scenario,
            "params": {
                "replenishment_qty": replenishment_qty,
                "reorder_point": int(reorder_point),
                "safety_stock": safety_stock,
                "lead_time": lead_time,
                "days": days,
                "avg_daily_demand": avg_daily_demand
            },
            "final_inventory": {
                "stock": final_stock,
                "shortages": total_shortages,
                "service_level": round(service_level, 4),
                "fill_rate": round(fill_rate, 4)
            },
            "metrics": {
                "total_demand": total_demand,
                "total_served": total_served,
                "total_unmet": total_shortages,
                "peak_stock": peak_stock,
                "min_stock": min_stock,
                "avg_inventory": int(avg_inventory),
                "total_replenishments": total_replenishments,
                "stockout_days": stockout_days,
                "inventory_turnover": round(inventory_turnover, 2)
            },
            "history": daily_results,
            "decision": decision,
            "decisionType": decision_type
        })

    except Exception as e:
        import traceback
        print(f"Simulation error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400


def generate_inventory_decision(service_level, fill_rate, shortage_rate, stockout_rate, 
                                avg_inventory, replenishment_qty, avg_demand, scenario):
    """
    Generate inventory management decision based on industry-standard KPIs
    """
    # Industry benchmarks
    TARGET_SERVICE_LEVEL = 0.95  # 95% is industry standard
    TARGET_FILL_RATE = 0.95
    ACCEPTABLE_STOCKOUT_RATE = 0.05  # 5% of days
    
    # Critical issues (service level < 90%)
    if service_level < 0.90:
        return (
            "CRITICAL: Service level below 90%. IMMEDIATE ACTION REQUIRED:\n"
            f"• Increase replenishment quantity from {replenishment_qty} to {int(replenishment_qty * 1.5)} units\n"
            "• Consider reducing lead time through supplier negotiations\n"
            "• Implement expedited shipping for urgent orders",
            "critical"
        )
    
    # High stockout rate
    if stockout_rate > 0.15:
        return (
            f"CRITICAL: Stockouts occurring {stockout_rate*100:.1f}% of days. ACTIONS:\n"
            f"• Raise reorder point by {int(avg_demand * 2)} units\n"
            f"• Increase safety stock to cover demand variability\n"
            "• Review demand forecasting accuracy",
            "critical"
        )
    
    # Warning: Below target service level
    if service_level < TARGET_SERVICE_LEVEL:
        improvement_needed = int((TARGET_SERVICE_LEVEL - service_level) * avg_demand * 30)
        return (
            f"WARNING: Service level at {service_level*100:.1f}% (target: 95%). RECOMMENDATIONS:\n"
            f"• Increase replenishment quantity by {int(replenishment_qty * 0.2)} units\n"
            f"• Add approximately {improvement_needed} units to safety stock\n"
            "• Monitor for next 2 weeks and adjust",
            "warning"
        )
    
    # Warning: Moderate stockout rate
    if stockout_rate > ACCEPTABLE_STOCKOUT_RATE:
        return (
            f"WARNING: Stockouts on {stockout_rate*100:.1f}% of days (target: <5%). ACTIONS:\n"
            f"• Review and increase reorder point\n"
            f"• Consider more frequent smaller replenishments\n"
            "• Analyze demand patterns for better forecasting",
            "warning"
        )
    
    # Info: High inventory levels (excess carrying costs)
    if avg_inventory > avg_demand * 15:
        return (
            f"NOTICE: Average inventory at {int(avg_inventory)} units is high (15+ days of demand). OPTIMIZATION:\n"
            f"• Consider reducing replenishment quantity to {int(replenishment_qty * 0.8)} units\n"
            "• This will reduce carrying costs while maintaining service levels\n"
            "• Review demand forecast accuracy",
            "info"
        )
    
    # Success: Meeting all targets
    if service_level >= TARGET_SERVICE_LEVEL and stockout_rate <= ACCEPTABLE_STOCKOUT_RATE:
        if scenario == "promo":
            return (
                f"EXCELLENT: Promotion handled successfully with {service_level*100:.1f}% service level!\n"
                f"• Replenishment strategy effective for demand surge\n"
                f"• Stockouts minimal at {stockout_rate*100:.1f}% of days\n"
                "• Current policy is optimal for promotional periods",
                "success"
            )
        elif scenario == "holiday":
            return (
                f"OUTSTANDING: Holiday demand managed with {service_level*100:.1f}% service level!\n"
                f"• Inventory policy successfully handled 50% demand increase\n"
                f"• Only {stockout_rate*100:.1f}% stockout rate during peak season\n"
                "• Maintain current replenishment parameters",
                "success"
            )
        else:
            return (
                f"OPTIMAL: Inventory performance exceeds industry standards!\n"
                f"• Service Level: {service_level*100:.1f}% (target: 95%)\n"
                f"• Stockout Rate: {stockout_rate*100:.1f}% (target: <5%)\n"
                f"• Current replenishment policy of {replenishment_qty} units is well-calibrated",
                "success"
            )
    
    # Default: Good performance
    return (
        f"GOOD: Inventory system performing adequately.\n"
        f"• Service Level: {service_level*100:.1f}%\n"
        f"• Continue monitoring key metrics\n"
        "• Minor adjustments may optimize performance",
        "success"
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)