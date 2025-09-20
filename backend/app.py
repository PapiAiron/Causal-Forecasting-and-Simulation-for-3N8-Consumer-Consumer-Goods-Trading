from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
from prophet import Prophet
import numpy as np
import simpy
from sklearn.metrics import mean_absolute_error, mean_squared_error
import json

app = Flask(__name__)
CORS(app)


# --------- Helper: Metrics ----------
def calculate_metrics(y_true, y_pred):
    try:
        mae = mean_absolute_error(y_true, y_pred)
        rmse = mean_squared_error(y_true, y_pred, squared=False)
        mape = np.mean(np.abs((y_true - y_pred) / np.maximum(y_true, 1e-9))) * 100
        return {"mae": mae, "rmse": rmse, "mape": mape}
    except Exception:
        return {}


# --------- Forecast Route (Prophet Only) ----------
@app.route("/forecast", methods=["POST"])
def forecast():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        
        # Optional causal JSON string (e.g. {"promo":[0,1,...],"holiday":[0,...]})
        causal_str = request.form.get("causal", None)
        causal = None
        if causal_str:
            try:
                causal = json.loads(causal_str)
            except Exception:
                causal = None

        # Load CSV
        try:
            df = pd.read_csv(file)
        except Exception:
            return jsonify({"error": "Invalid CSV format"}), 400

        # Normalize column names
        df.columns = [c.lower().strip() for c in df.columns]
        if "date" in df.columns:
            df.rename(columns={"date": "ds"}, inplace=True)
        if "sales (₱)" in df.columns:
            df.rename(columns={"sales (₱)": "y"}, inplace=True)
        elif "sales" in df.columns:
            df.rename(columns={"sales": "y"}, inplace=True)

        if "ds" not in df.columns or "y" not in df.columns:
            return jsonify({"error": "CSV must contain 'date' and 'sales' columns (case-insensitive)"}), 400

        df["ds"] = pd.to_datetime(df["ds"], errors="coerce")
        df["y"] = pd.to_numeric(df["y"], errors="coerce")
        df = df.dropna(subset=["ds", "y"]).sort_values("ds").reset_index(drop=True)

        # Handle regressors if available
        regressors = []
        for reg in ("promo", "holiday", "marketing", "price"):
            if reg in df.columns:
                df[reg] = pd.to_numeric(df[reg], errors="coerce").fillna(0)
                regressors.append(reg)

        # Prophet Model
        model = Prophet(
            yearly_seasonality=True,
            weekly_seasonality=True,
            daily_seasonality=False,
            interval_width=0.8
        )
        
        for r in regressors:
            model.add_regressor(r)
            
        model.fit(df)

        future = model.make_future_dataframe(periods=30, freq="D")
        for r in regressors:
            future[r] = 0

        # Apply causal factors if provided
        if causal and regressors:
            for r in regressors:
                if r in causal:
                    vals = causal[r]
                    if isinstance(vals, (int, float, str)):
                        try:
                            v = float(vals)
                            future.loc[:, r] = v
                        except Exception:
                            pass
                    elif isinstance(vals, list):
                        vals_numeric = []
                        for item in vals:
                            try:
                                vals_numeric.append(float(item))
                            except Exception:
                                vals_numeric.append(0.0)
                        vals_numeric = (vals_numeric + [0.0]*30)[:30]
                        future.loc[future.index[-30:], r] = vals_numeric

        forecast = model.predict(future)
        tail_forecast = forecast[["ds", "yhat", "yhat_lower", "yhat_upper"]].tail(30).reset_index(drop=True)

        # Calculate metrics on training data
        try:
            preds_train = model.predict(df)["yhat"]
            metrics = calculate_metrics(df["y"].values, preds_train.values)
        except Exception:
            metrics = {}

        # Format forecast data
        def row_to_dict(r):
            return {
                "ds": pd.to_datetime(r["ds"]).strftime("%Y-%m-%d"),
                "yhat": float(r.get("yhat", np.nan)) if not pd.isna(r.get("yhat", np.nan)) else None,
                "yhat_lower": float(r.get("yhat_lower", np.nan)) if "yhat_lower" in r and not pd.isna(r.get("yhat_lower", np.nan)) else None,
                "yhat_upper": float(r.get("yhat_upper", np.nan)) if "yhat_upper" in r and not pd.isna(r.get("yhat_upper", np.nan)) else None,
            }

        forecast_json = [row_to_dict(r) for _, r in tail_forecast.reset_index(drop=True).iterrows()]
        monthly_total = float(np.nansum([f.get("yhat", 0) or 0 for f in forecast_json]))

        # Historical data for analysis
        historical_data = []
        for _, row in df.iterrows():
            historical_data.append({
                "ds": pd.to_datetime(row["ds"]).strftime("%Y-%m-%d"),
                "y": float(row["y"]) if not pd.isna(row["y"]) else None
            })

        return jsonify({
            "forecast": forecast_json, 
            "metrics": metrics, 
            "monthly_total": monthly_total,
            "historical": historical_data,
            "regressors": regressors
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


# --------- Analysis Route for Overview ----------
@app.route("/analysis", methods=["GET"])
def analysis():
    try:
        # Mock KPI data - in real implementation, this would come from database
        kpi_data = {
            "forecast_accuracy": 92.5,
            "inventory_turnover": 6.8,
            "on_time_delivery": 98.2,
            "stockout_rate": 1.5
        }
        
        # Mock inventory data
        inventory_data = [
            {"product": "Product A", "current": 1200, "optimal": 1000, "status": "high"},
            {"product": "Product B", "current": 450, "optimal": 500, "status": "low"},
            {"product": "Product C", "current": 800, "optimal": 800, "status": "good"},
            {"product": "Product D", "current": 50, "optimal": 200, "status": "critical"}
        ]
        
        return jsonify({
            "kpis": kpi_data,
            "inventory": inventory_data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# --------- Causal Analysis Route ----------
@app.route("/causal-analysis", methods=["POST"])
def causal_analysis():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        
        try:
            df = pd.read_csv(file)
        except Exception:
            return jsonify({"error": "Invalid CSV format"}), 400

        # Normalize column names
        df.columns = [c.lower().strip() for c in df.columns]
        
        # Calculate correlations for causal factors
        causal_factors = []
        correlation_columns = ["price", "marketing", "promo", "holiday", "weather", "competitor"]
        
        for col in correlation_columns:
            if col in df.columns:
                try:
                    # Calculate correlation with sales/y column
                    sales_col = "y" if "y" in df.columns else "sales"
                    if sales_col in df.columns:
                        corr = abs(df[col].corr(df[sales_col]))
                        causal_factors.append({
                            "factor": col.replace("_", " ").title(),
                            "correlation": corr if not pd.isna(corr) else 0
                        })
                except:
                    pass
        
        # If no correlations found, return mock data
        if not causal_factors:
            causal_factors = [
                {"factor": "Price Changes", "correlation": 0.85},
                {"factor": "Marketing Spend", "correlation": 0.72},
                {"factor": "Competitor Activity", "correlation": 0.68},
                {"factor": "Weather Conditions", "correlation": 0.45},
                {"factor": "Economic Index", "correlation": 0.38},
                {"factor": "Social Media", "correlation": 0.25}
            ]
        
        # Mock seasonal data
        seasonal_data = [
            {"month": "Jan", "seasonalFactor": 1.2, "promotionImpact": 0.1, "actualDemand": 150},
            {"month": "Feb", "seasonalFactor": 1.1, "promotionImpact": 0.05, "actualDemand": 140},
            {"month": "Mar", "seasonalFactor": 1.3, "promotionImpact": 0.2, "actualDemand": 180},
            {"month": "Apr", "seasonalFactor": 1.5, "promotionImpact": 0.15, "actualDemand": 200},
            {"month": "May", "seasonalFactor": 1.6, "promotionImpact": 0.3, "actualDemand": 240},
            {"month": "Jun", "seasonalFactor": 1.4, "promotionImpact": 0.25, "actualDemand": 220}
        ]
        
        return jsonify({
            "causal_factors": causal_factors,
            "seasonal_data": seasonal_data
        })
        
    except Exception as e:
        return jsonify({"error": str(e)}), 400


# --------- Simulation Route ----------
@app.route("/simulate", methods=["POST"])
def simulate():
    try:
        data = request.json or {}
        forecast_values = data.get("forecast")
        stock = int(data.get("stock", 1000))
        lead_time = int(data.get("lead_time", 2))
        days = int(data.get("days", 30))
        scenario = data.get("scenario", "baseline")
        user_demand = data.get("demand")

        # Scenario multipliers
        scenario_multipliers = {
            "baseline": 1.0,
            "promotion": 1.3,
            "seasonal": 1.5,
            "disruption": 0.7
        }
        
        multiplier = scenario_multipliers.get(scenario, 1.0)

        # Generate demand forecast
        if user_demand is not None:
            avg_demand = float(user_demand) * multiplier
            demand_forecast = [
                int(max(0, np.round(np.random.normal(avg_demand, 0.1 * avg_demand))))
                for _ in range(days)
            ]
        elif forecast_values and isinstance(forecast_values, list):
            demand_forecast = [max(0, int(float(v) * multiplier)) for v in forecast_values[:days]]
        else:
            demand_mean = 500 * multiplier
            demand_forecast = [int(np.round(np.random.normal(demand_mean, 0.1*demand_mean))) for _ in range(days)]

        # Run simulation
        env = simpy.Environment()
        inventory = {"stock": stock, "shortages": 0, "orders": [], "history": []}

        def supply_chain(env, inventory, forecast):
            for day, demand in enumerate(forecast):
                if inventory["stock"] >= demand:
                    inventory["stock"] -= demand
                    unmet = 0
                else:
                    unmet = demand - inventory["stock"]
                    inventory["shortages"] += unmet
                    inventory["stock"] = 0

                reorder_point = int(0.8 * np.mean(forecast))
                order_up_to = reorder_point + 500
                pending = any(o["arrival"] > env.now for o in inventory["orders"])
                if (inventory["stock"] <= reorder_point) and not pending:
                    order_qty = order_up_to - inventory["stock"]
                    arrival_day = env.now + lead_time
                    inventory["orders"].append({"qty": order_qty, "arrival": arrival_day})

                for order in list(inventory["orders"]):
                    if order["arrival"] <= env.now:
                        inventory["stock"] += order["qty"]
                        inventory["orders"].remove(order)

                inventory["history"].append({
                    "day": int(env.now),
                    "stock": int(inventory["stock"]),
                    "demand": int(demand),
                    "unmet": int(unmet),
                    "pending_orders": len(inventory["orders"])
                })

                yield env.timeout(1)

        env.process(supply_chain(env, inventory, demand_forecast))
        env.run(until=days)

        total_demand = sum(h["demand"] for h in inventory["history"])
        served = total_demand - inventory["shortages"]
        service_level = served / total_demand if total_demand > 0 else 1.0

        return jsonify({
            "scenario": scenario,
            "final_inventory": {
                "stock": inventory["stock"],
                "shortages": inventory["shortages"],
                "service_level": round(service_level, 4),
            },
            "history": inventory["history"],
            "scenario_impact": {
                "demand": int(multiplier * 100),
                "cost": int((2 - multiplier) * 100),
                "efficiency": int(service_level * 100)
            }
        })

    except Exception as e:
        return jsonify({"error": str(e)}), 400


if __name__ == "__main__":
    app.run(debug=True, port=5000)