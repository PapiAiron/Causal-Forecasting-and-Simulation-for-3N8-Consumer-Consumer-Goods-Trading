from flask import Flask, request, jsonify
from flask_cors import CORS
import pandas as pd
import numpy as np
import joblib
import calendar
import os
from prophet import Prophet
from prophet.diagnostics import cross_validation, performance_metrics
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score

app = Flask(__name__)
CORS(app)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "prophet_sales_forecast.pkl")
SAVED_MODEL = None
if os.path.exists(MODEL_PATH):
    try:
        SAVED_MODEL = joblib.load(MODEL_PATH)
        print("✓ Pre-trained model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")
        SAVED_MODEL = None


def parse_num_series(s, index=None):
    """Parse numeric series from various formats"""
    if s is None:
        return pd.Series(dtype=float, index=index)
    if isinstance(s, pd.Series):
        return pd.to_numeric(
            s.astype(str).str.replace(r'[,\£\$₱€¥₩]', '', regex=True)
             .str.replace(r'\s+', '', regex=True)
             .str.strip(), errors='coerce'
        )
    return pd.to_numeric(
        pd.Series(s, index=index).astype(str)
         .str.replace(r'[,\£\$₱€¥₩]', '', regex=True)
         .str.replace(r'\s+', '', regex=True)
         .str.strip(), errors='coerce'
    )


def detect_date_column(df):
    """Auto-detect date column from DataFrame"""
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


def detect_format_and_process(df):
    """
    Detect CSV format and process accordingly
    Handles: Standard format and Wide format (Date-Outlet-SKUs)
    """
    # Clean column names
    df.columns = [str(c).strip() for c in df.columns]
    col_lower = [c.lower() for c in df.columns]
    
    # Check for wide format
    has_outlet = any('outlet' in c for c in col_lower)
    has_multiple_cols = len(df.columns) > 5
    
    if has_outlet and has_multiple_cols:
        # Wide format processing
        return process_wide_format(df)
    else:
        # Standard format processing
        return process_standard_format(df)


def process_wide_format(df):
    """
    Convert wide format (Date, Outlet, SKU1, SKU2, ...) to (ds, y)
    """
    print("Processing WIDE format (Date-Outlet-SKUs)")
    
    # Find date column
    date_col = None
    for col in df.columns:
        if col.lower().strip() in ['date', 'datetime', 'ds', 'day']:
            date_col = col
            break
    
    if date_col is None:
        date_col = detect_date_column(df)
    
    if date_col is None:
        raise ValueError("No date column found")
    
    # Find outlet column
    outlet_col = None
    for col in df.columns:
        if 'outlet' in col.lower():
            outlet_col = col
            break
    
    # Identify SKU columns
    non_sku_cols = [date_col]
    if outlet_col:
        non_sku_cols.append(outlet_col)
    
    sku_cols = [col for col in df.columns if col not in non_sku_cols]
    
    # Parse date
    df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
    df = df.dropna(subset=[date_col])
    
    # Convert SKU columns to numeric and sum
    for col in sku_cols:
        df[col] = parse_num_series(df[col])
    
    df['total'] = df[sku_cols].sum(axis=1)
    
    # Group by date
    result = df.groupby(date_col)['total'].sum().reset_index()
    result.columns = ['ds', 'y']
    
    print(f"✓ Converted wide format: {len(result)} daily observations")
    return result


def process_standard_format(df):
    """
    Process standard format (Date, SKU/Value columns)
    """
    print("Processing STANDARD format")
    
    # Normalize column names
    df.columns = [c.lower().strip() for c in df.columns]
    
    # Find date column
    date_col = None
    for cand in ["date", "ds", "datetime", "day", "timestamp"]:
        if cand in df.columns:
            date_col = cand
            break
    
    if date_col is None:
        date_col = detect_date_column(df)
    
    if date_col is None:
        raise ValueError("No date column found")
    
    # Rename to 'ds'
    if date_col != 'ds':
        df.rename(columns={date_col: 'ds'}, inplace=True)
    
    # Parse dates
    df['ds'] = pd.to_datetime(df['ds'], errors='coerce')
    df = df.dropna(subset=['ds'])
    
    # Find value columns
    value_cols = []
    for col in ['sku', 'value', 'sales', 'quantity', 'demand', 'revenue']:
        if col in df.columns:
            value_cols.append(col)
    
    if not value_cols:
        # Try all numeric columns
        for col in df.columns:
            if col != 'ds':
                parsed = parse_num_series(df[col])
                if parsed.sum() > 0:
                    value_cols.append(col)
                    break
    
    if not value_cols:
        raise ValueError("No value column found")
    
    # Aggregate
    df['y'] = 0
    for col in value_cols:
        df['y'] += parse_num_series(df[col])
    
    # Group by date
    result = df.groupby('ds')['y'].sum().reset_index()
    
    print(f"✓ Processed standard format: {len(result)} daily observations")
    return result


def calculate_metrics(y_true, y_pred):
    """
    Calculate comprehensive evaluation metrics
    """
    mask = ~(np.isnan(y_true) | np.isnan(y_pred))
    y_true_clean = np.array(y_true)[mask]
    y_pred_clean = np.array(y_pred)[mask]
    
    if len(y_true_clean) == 0:
        return {'mae': 0, 'rmse': 0, 'mape': 0, 'r2': 0, 'accuracy': 0, 'bias': 0}
    
    mae = mean_absolute_error(y_true_clean, y_pred_clean)
    rmse = np.sqrt(mean_squared_error(y_true_clean, y_pred_clean))
    
    mape_values = np.abs((y_true_clean - y_pred_clean) / y_true_clean)
    mape = np.mean(mape_values[np.isfinite(mape_values)]) * 100
    
    r2 = r2_score(y_true_clean, y_pred_clean)
    accuracy = max(0, 100 - mape)
    bias = np.mean(y_pred_clean - y_true_clean) / np.mean(y_true_clean) * 100
    
    return {
        'mae': round(float(mae), 2),
        'rmse': round(float(rmse), 2),
        'mape': round(float(mape), 2),
        'r2': round(float(r2), 4),
        'accuracy': round(float(accuracy), 2),
        'bias': round(float(bias), 2)
    }


def get_optimized_prophet_params(df, target_col='y'):
    """
    Determine optimal Prophet parameters based on data characteristics
    """
    data_std = df[target_col].std()
    data_mean = df[target_col].mean()
    cv = data_std / data_mean if data_mean > 0 else 0
    
    print(f"\n{'='*60}")
    print(f"DATA ANALYSIS FOR PARAMETER OPTIMIZATION")
    print(f"{'='*60}")
    print(f"Mean: {data_mean:.2f}")
    print(f"Std Dev: {data_std:.2f}")
    print(f"Coefficient of Variation: {cv:.2%}")
    
    if cv > 0.5:
        print("→ High volatility detected: Using flexible parameters")
        params = {
            'seasonality_mode': 'multiplicative',
            'changepoint_prior_scale': 0.5,
            'seasonality_prior_scale': 10.0,
            'changepoint_range': 0.9,
            'yearly_seasonality': True,
            'weekly_seasonality': True,
            'daily_seasonality': False,
            'interval_width': 0.95
        }
    elif cv > 0.3:
        print("→ Moderate volatility: Using balanced parameters")
        params = {
            'seasonality_mode': 'multiplicative',
            'changepoint_prior_scale': 0.3,
            'seasonality_prior_scale': 5.0,
            'changepoint_range': 0.85,
            'yearly_seasonality': True,
            'weekly_seasonality': True,
            'daily_seasonality': False,
            'interval_width': 0.90
        }
    else:
        print("→ Low volatility: Using conservative parameters")
        params = {
            'seasonality_mode': 'additive',
            'changepoint_prior_scale': 0.1,
            'seasonality_prior_scale': 2.0,
            'changepoint_range': 0.8,
            'yearly_seasonality': True,
            'weekly_seasonality': True,
            'daily_seasonality': False,
            'interval_width': 0.85
        }
    
    print(f"{'='*60}\n")
    return params


def evaluate_model_performance(prophet_df, model, forecast_result):
    """
    Comprehensive model evaluation with multiple metrics
    """
    print(f"\n{'='*60}")
    print("MODEL PERFORMANCE EVALUATION")
    print(f"{'='*60}")
    
    hist_forecast = forecast_result[forecast_result['ds'] <= prophet_df['ds'].max()].copy()
    hist_forecast = hist_forecast.merge(prophet_df, on='ds', how='left')
    valid_data = hist_forecast.dropna(subset=['y', 'yhat'])
    
    evaluation_results = {}
    
    if len(valid_data) > 10:
        in_sample_metrics = calculate_metrics(
            valid_data['y'].values,
            valid_data['yhat'].values
        )
        
        print("\nIN-SAMPLE METRICS (Historical Fit):")
        print(f"  MAE:      {in_sample_metrics['mae']:>10,.2f} units")
        print(f"  RMSE:     {in_sample_metrics['rmse']:>10,.2f} units")
        print(f"  MAPE:     {in_sample_metrics['mape']:>10.2f}%")
        print(f"  Accuracy: {in_sample_metrics['accuracy']:>10.2f}%")
        print(f"  R²:       {in_sample_metrics['r2']:>10.4f}")
        print(f"  Bias:     {in_sample_metrics['bias']:>+10.2f}%")
        
        print("\nPERFORMANCE ASSESSMENT:")
        if in_sample_metrics['accuracy'] >= 90:
            print("  ✓ EXCELLENT - Model fits historical data very well")
        elif in_sample_metrics['accuracy'] >= 80:
            print("  ✓ GOOD - Model is reliable for forecasting")
        elif in_sample_metrics['accuracy'] >= 70:
            print("  ⚠ FAIR - Model may need tuning")
        else:
            print("  ✗ POOR - Consider data preprocessing or different parameters")
        
        if abs(in_sample_metrics['bias']) < 5:
            print("  ✓ Unbiased forecasts")
        elif in_sample_metrics['bias'] > 5:
            print(f"  ⚠ Over-forecasting by {in_sample_metrics['bias']:.1f}%")
        else:
            print(f"  ⚠ Under-forecasting by {abs(in_sample_metrics['bias']):.1f}%")
        
        evaluation_results['in_sample'] = in_sample_metrics
        
        # Cross-validation
        if len(prophet_df) >= 90:
            try:
                print("\nPerforming cross-validation...")
                df_cv = cross_validation(
                    model,
                    initial='60 days',
                    period='15 days',
                    horizon='30 days',
                    parallel=None
                )
                
                cv_metrics = calculate_metrics(df_cv['y'].values, df_cv['yhat'].values)
                
                print("\nCROSS-VALIDATION METRICS (Out-of-sample):")
                print(f"  MAE:      {cv_metrics['mae']:>10,.2f} units")
                print(f"  RMSE:     {cv_metrics['rmse']:>10,.2f} units")
                print(f"  MAPE:     {cv_metrics['mape']:>10.2f}%")
                print(f"  Accuracy: {cv_metrics['accuracy']:>10.2f}%")
                print(f"  R²:       {cv_metrics['r2']:>10.4f}")
                
                accuracy_drop = in_sample_metrics['accuracy'] - cv_metrics['accuracy']
                print(f"\nOVERFITTING CHECK:")
                print(f"  Accuracy drop: {accuracy_drop:+.2f}%")
                if accuracy_drop < 5:
                    print("  ✓ No overfitting detected")
                elif accuracy_drop < 10:
                    print("  ⚠ Slight overfitting")
                else:
                    print("  ✗ Significant overfitting - model may not generalize well")
                
                print(f"{'='*60}\n")
                
                evaluation_results['cross_validation'] = cv_metrics
                evaluation_results['overfitting_check'] = {
                    'accuracy_drop': round(float(accuracy_drop), 2),
                    'status': 'good' if accuracy_drop < 5 else 'warning' if accuracy_drop < 10 else 'poor'
                }
            except Exception as e:
                print(f"  Cross-validation skipped: {e}")
        else:
            print(f"\n  Note: Not enough data for cross-validation (need 90+ days, have {len(prophet_df)})")
            print(f"{'='*60}\n")
    
    return evaluation_results if evaluation_results else {'in_sample': {'mae': 0, 'rmse': 0, 'mape': 0, 'r2': 0, 'accuracy': 0}}


def format_mdy(ts):
    """Format timestamp to M/D/Y format"""
    try:
        ts = pd.to_datetime(ts)
        return f"{ts.month}/{ts.day}/{ts.year}"
    except Exception:
        return None


@app.route("/forecast", methods=["POST"])
def forecast():
    """
    Enhanced forecast endpoint with automatic model evaluation and optimization
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        forecast_days = int(request.form.get("days", 30))
        forecast_days = max(30, min(forecast_days, 730))
        
        # Load and clean data
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Remove duplicate header rows
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        # Detect format and process
        prophet_df = detect_format_and_process(df)
        
        if prophet_df.empty:
            return jsonify({"error": "No valid data after cleaning"}), 400

        # Remove duplicates and sort
        prophet_df = prophet_df.drop_duplicates(subset=['ds'], keep='first')
        prophet_df = prophet_df.sort_values('ds').reset_index(drop=True)
        
        # Data quality checks
        print(f"\n{'='*60}")
        print("DATA QUALITY REPORT")
        print(f"{'='*60}")
        print(f"Total records: {len(prophet_df)}")
        print(f"Date range: {prophet_df['ds'].min().date()} to {prophet_df['ds'].max().date()}")
        print(f"Time span: {(prophet_df['ds'].max() - prophet_df['ds'].min()).days} days")
        print(f"\nTarget Variable Statistics:")
        print(f"  Mean:     {prophet_df['y'].mean():>10.2f}")
        print(f"  Median:   {prophet_df['y'].median():>10.2f}")
        print(f"  Std Dev:  {prophet_df['y'].std():>10.2f}")
        print(f"  Min:      {prophet_df['y'].min():>10.2f}")
        print(f"  Max:      {prophet_df['y'].max():>10.2f}")
        print(f"  Zeros:    {(prophet_df['y'] == 0).sum()} ({(prophet_df['y'] == 0).sum()/len(prophet_df)*100:.1f}%)")
        print(f"{'='*60}\n")
        
        # Check for minimum data requirements
        if len(prophet_df) < 30:
            return jsonify({
                "error": f"Insufficient data for forecasting. Need at least 30 days, got {len(prophet_df)}"
            }), 400

        # Get optimized parameters
        model_params = get_optimized_prophet_params(prophet_df)

        # Train Prophet model
        print("Training Prophet model with optimized parameters...")
        prophet_model = Prophet(**model_params)
        prophet_model.add_seasonality(name='monthly', period=30.5, fourier_order=5)
        prophet_model.fit(prophet_df)
        print("✓ Model training complete\n")

        # Generate forecast
        future = prophet_model.make_future_dataframe(periods=forecast_days, freq='D')
        forecast_result = prophet_model.predict(future)
        
        # Apply bounds
        forecast_result['yhat'] = forecast_result['yhat'].clip(lower=0)
        forecast_result['yhat_lower'] = forecast_result['yhat_lower'].clip(lower=0)
        forecast_result['yhat_upper'] = forecast_result['yhat_upper'].clip(lower=0)

        # Evaluate model performance
        evaluation_results = evaluate_model_performance(prophet_df, prophet_model, forecast_result)

        # Extract future forecast
        future_forecast = forecast_result[forecast_result['ds'] > prophet_df['ds'].max()].copy()

        # Prepare response data
        historical_dates = prophet_df['ds'].dt.strftime("%Y-%m-%d").tolist()
        historical_values = prophet_df['y'].tolist()
        forecast_dates = future_forecast['ds'].dt.strftime("%Y-%m-%d").tolist()
        
        forecast_values = [float(v) if pd.notna(v) else 0 for v in future_forecast['yhat'].tolist()]
        forecast_lower = [float(v) if pd.notna(v) else 0 for v in future_forecast['yhat_lower'].tolist()]
        forecast_upper = [float(v) if pd.notna(v) else 0 for v in future_forecast['yhat_upper'].tolist()]
        
        combined_dates = historical_dates + forecast_dates
        combined_actual = historical_values + [None] * len(forecast_dates)
        combined_predicted = [None] * len(historical_dates) + forecast_values
        combined_lower = [None] * len(historical_dates) + forecast_lower
        combined_upper = [None] * len(historical_dates) + forecast_upper

        graph_series = {
            "actual": combined_actual,
            "baseline": combined_predicted,
            "base": combined_predicted,
            "predicted": combined_predicted,
            "lower_bound": combined_lower,
            "upper_bound": combined_upper
        }

        # Format forecast list
        forecast_list = []
        for _, row in future_forecast.iterrows():
            forecast_list.append({
                "ds": format_mdy(row['ds']),
                "pred": max(0.0, float(row['yhat'])),
                "pred_lower": max(0.0, float(row['yhat_lower'])),
                "pred_upper": max(0.0, float(row['yhat_upper']))
            })

        # Generate insights
        insights = generate_forecast_insights(
            evaluation_results,
            prophet_df,
            future_forecast,
            forecast_days
        )

        # Final metrics
        final_metrics = evaluation_results.get('in_sample', {})
        
        print(f"\n{'='*60}")
        print("FORECAST GENERATION COMPLETE")
        print(f"{'='*60}")
        print(f"✓ Generated {forecast_days}-day forecast")
        print(f"✓ Model accuracy: {final_metrics.get('accuracy', 0):.2f}%")
        print(f"✓ Total forecast demand: {sum(forecast_values):,.0f} units")
        print(f"{'='*60}\n")

        return jsonify({
            "model_used": "prophet_optimized",
            "forecast": forecast_list,
            "graph": {"dates": combined_dates, "series": graph_series},
            "scenario_results": {"base": forecast_values},
            "decisions": [],
            "feature_importance": None,
            "monthly_total": float(sum(forecast_values)),
            "forecast_days": forecast_days,
            "metrics": final_metrics,
            "evaluation": evaluation_results,
            "insights": insights,
            "model_params": model_params
        })

    except Exception as e:
        import traceback
        print(f"\n{'='*60}")
        print("ERROR IN FORECAST")
        print(f"{'='*60}")
        print(f"{e}")
        print(traceback.format_exc())
        print(f"{'='*60}\n")
        return jsonify({"error": str(e)}), 400


def generate_forecast_insights(evaluation_results, historical_df, future_forecast, forecast_days):
    """
    Generate actionable insights from forecast evaluation
    """
    insights = []
    
    metrics = evaluation_results.get('in_sample', {})
    accuracy = metrics.get('accuracy', 0)
    bias = metrics.get('bias', 0)
    
    # Performance insight
    if accuracy >= 90:
        insights.append({
            "type": "success",
            "title": "Excellent Model Performance",
            "message": f"Model achieved {accuracy:.1f}% accuracy on historical data. Forecasts are highly reliable."
        })
    elif accuracy >= 80:
        insights.append({
            "type": "info",
            "title": "Good Model Performance",
            "message": f"Model achieved {accuracy:.1f}% accuracy. Forecasts are reliable for planning purposes."
        })
    elif accuracy >= 70:
        insights.append({
            "type": "warning",
            "title": "Fair Model Performance",
            "message": f"Model achieved {accuracy:.1f}% accuracy. Consider reviewing data quality or adding more historical data."
        })
    else:
        insights.append({
            "type": "error",
            "title": "Low Model Accuracy",
            "message": f"Model accuracy is {accuracy:.1f}%. Review data quality, outliers, or consider alternative forecasting methods."
        })
    
    # Bias insight
    if abs(bias) > 10:
        if bias > 0:
            insights.append({
                "type": "warning",
                "title": "Over-forecasting Detected",
                "message": f"Model tends to over-predict by {bias:.1f}%. Consider adjusting safety stock calculations accordingly."
            })
        else:
            insights.append({
                "type": "warning",
                "title": "Under-forecasting Detected",
                "message": f"Model tends to under-predict by {abs(bias):.1f}%. Increase buffer inventory to avoid stockouts."
            })
    
    # Trend insight
    hist_mean = historical_df['y'].mean()
    forecast_mean = future_forecast['yhat'].mean()
    trend_change = ((forecast_mean - hist_mean) / hist_mean) * 100
    
    if abs(trend_change) > 20:
        if trend_change > 0:
            insights.append({
                "type": "info",
                "title": "Increasing Demand Trend",
                "message": f"Forecast indicates {trend_change:.1f}% increase in demand. Consider increasing inventory levels and supplier capacity."
            })
        else:
            insights.append({
                "type": "info",
                "title": "Decreasing Demand Trend",
                "message": f"Forecast indicates {abs(trend_change):.1f}% decrease in demand. Optimize inventory to reduce carrying costs."
            })
    
    # Overfitting check
    if 'cross_validation' in evaluation_results:
        cv_metrics = evaluation_results['cross_validation']
        cv_accuracy = cv_metrics.get('accuracy', 0)
        if accuracy - cv_accuracy > 10:
            insights.append({
                "type": "warning",
                "title": "Potential Overfitting",
                "message": f"Model performs significantly better on training data ({accuracy:.1f}%) than validation data ({cv_accuracy:.1f}%). Use forecasts cautiously."
            })
    
    return insights


@app.route("/causal-analysis", methods=["POST"])
def causal_analysis():
    """Causal analysis endpoint"""
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400
        
        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean and process
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        prophet_df = detect_format_and_process(df)
        
        if prophet_df.empty:
            return jsonify({"causal_factors": [], "seasonal_data": [], "daily_data": []})

        # Daily data
        daily_data = []
        for _, row in prophet_df.sort_values("ds").iterrows():
            daily_data.append({
                "date": row["ds"].strftime("%Y-%m-%d"),
                "value": float(row["y"])
            })

        # Seasonal data
        seasonal = []
        prophet_df["month"] = prophet_df["ds"].dt.month
        mg = prophet_df.groupby("month")["y"].agg(["mean", "sum"]).reset_index()
        overall_mean = prophet_df["y"].mean() if not prophet_df["y"].empty else 0
        
        for _, row in mg.iterrows():
            month = calendar.month_abbr[int(row["month"])]
            seasonal.append({
                "month": month,
                "seasonalFactor": float(row["mean"] / overall_mean) if overall_mean else 0.0,
                "actualDemand": float(row["sum"])
            })

        return jsonify({
            "causal_factors": [],
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
    """Inventory simulation endpoint"""
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

        replenishment_qty = safe_int(data.get("stock", 1000))
        lead_time = max(1, safe_int(data.get("lead_time", 1)))
        days = min(365, max(1, safe_int(data.get("days", 30))))
        scenario = (data.get("scenario") or "normal").lower()
        base_demand = safe_float(data.get("demand", 500.0))

        scenario_multiplier = {
            "normal": 1.0, 
            "promo": 1.3, 
            "holiday": 1.5, 
            "economic_downturn": 0.8
        }.get(scenario, 1.0)

        avg_daily_demand = int(round(base_demand * scenario_multiplier))
        demand_std_dev = avg_daily_demand * 0.2
        safety_stock = int(1.65 * demand_std_dev * np.sqrt(lead_time))
        reorder_point = (avg_daily_demand * lead_time) + safety_stock
        initial_stock = replenishment_qty * lead_time
        
        current_stock = initial_stock
        inventory_position = initial_stock
        daily_results = []
        
        total_demand = 0
        total_served = 0
        total_shortages = 0
        total_replenishments = 0
        peak_stock = initial_stock
        min_stock = initial_stock
        stockout_days = 0
        
        pending_orders = {}

        for day in range(days):
            if day in pending_orders:
                received_qty = pending_orders[day]
                current_stock += received_qty
                total_replenishments += received_qty
                del pending_orders[day]
            
            demand_variation = np.random.normal(0, demand_std_dev)
            demand_today = max(0, int(round(avg_daily_demand + demand_variation)))
            total_demand += demand_today
            
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
            
            if inventory_position <= reorder_point and (day + lead_time) not in pending_orders:
                arrival_day = day + lead_time
                if arrival_day < days:
                    pending_orders[arrival_day] = replenishment_qty
                    inventory_position += replenishment_qty
            
            peak_stock = max(peak_stock, current_stock)
            min_stock = min(min_stock, current_stock)
            
            daily_results.append({
                "day": day,
                "demand": demand_today,
                "stock": current_stock,
                "unmet": shortage,
                "inventory_position": inventory_position
            })

        final_stock = current_stock
        service_level = total_served / total_demand if total_demand > 0 else 1.0
        fill_rate = service_level
        stockout_rate = stockout_days / days
        shortage_rate = total_shortages / total_demand if total_demand > 0 else 0.0
        avg_inventory = sum(d['stock'] for d in daily_results) / len(daily_results)
        inventory_turnover = total_served / avg_inventory if avg_inventory > 0 else 0

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
    """Generate inventory management decision based on KPIs"""
    TARGET_SERVICE_LEVEL = 0.95
    ACCEPTABLE_STOCKOUT_RATE = 0.05
    
    if service_level < 0.90:
        return (
            "CRITICAL: Service level below 90%. IMMEDIATE ACTION REQUIRED:\n"
            f"• Increase replenishment quantity from {replenishment_qty} to {int(replenishment_qty * 1.5)} units\n"
            "• Consider reducing lead time through supplier negotiations\n"
            "• Implement expedited shipping for urgent orders",
            "critical"
        )
    
    if stockout_rate > 0.15:
        return (
            f"CRITICAL: Stockouts occurring {stockout_rate*100:.1f}% of days. ACTIONS:\n"
            f"• Raise reorder point by {int(avg_demand * 2)} units\n"
            "• Increase safety stock to cover demand variability\n"
            "• Review demand forecasting accuracy",
            "critical"
        )
    
    if service_level < TARGET_SERVICE_LEVEL:
        improvement_needed = int((TARGET_SERVICE_LEVEL - service_level) * avg_demand * 30)
        return (
            f"WARNING: Service level at {service_level*100:.1f}% (target: 95%). RECOMMENDATIONS:\n"
            f"• Increase replenishment quantity by {int(replenishment_qty * 0.2)} units\n"
            f"• Add approximately {improvement_needed} units to safety stock\n"
            "• Monitor for next 2 weeks and adjust",
            "warning"
        )
    
    if stockout_rate > ACCEPTABLE_STOCKOUT_RATE:
        return (
            f"WARNING: Stockouts on {stockout_rate*100:.1f}% of days (target: <5%). ACTIONS:\n"
            "• Review and increase reorder point\n"
            "• Consider more frequent smaller replenishments\n"
            "• Analyze demand patterns for better forecasting",
            "warning"
        )
    
    if avg_inventory > avg_demand * 15:
        return (
            f"NOTICE: Average inventory at {int(avg_inventory)} units is high (15+ days of demand). OPTIMIZATION:\n"
            f"• Consider reducing replenishment quantity to {int(replenishment_qty * 0.8)} units\n"
            "• This will reduce carrying costs while maintaining service levels\n"
            "• Review demand forecast accuracy",
            "info"
        )
    
    if service_level >= TARGET_SERVICE_LEVEL and stockout_rate <= ACCEPTABLE_STOCKOUT_RATE:
        return (
            f"OPTIMAL: Inventory performance exceeds industry standards!\n"
            f"• Service Level: {service_level*100:.1f}% (target: 95%)\n"
            f"• Stockout Rate: {stockout_rate*100:.1f}% (target: <5%)\n"
            f"• Current replenishment policy of {replenishment_qty} units is well-calibrated",
            "success"
        )
    
    return (
        f"GOOD: Inventory system performing adequately.\n"
        f"• Service Level: {service_level*100:.1f}%\n"
        "• Continue monitoring key metrics\n"
        "• Minor adjustments may optimize performance",
        "success"
    )


if __name__ == "__main__":
    app.run(debug=True, port=5000)