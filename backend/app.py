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
# Allow requests from your Firebase hosting domain
CORS(app, origins=[
    "https://causalforecastingandsimulation.web.app",
    "https://causalforecastingandsimulation.firebaseapp.com",
    "http://localhost:3000",
    "http://localhost:5173",
    "https://your-frontend-name.onrender.com"  # ⭐ ADD YOUR FRONTEND URL
], supports_credentials=True)

MODEL_PATH = os.path.join(os.path.dirname(__file__), "model", "prophet_sales_forecast.pkl")
SAVED_MODEL = None
if os.path.exists(MODEL_PATH):
    try:
        SAVED_MODEL = joblib.load(MODEL_PATH)
        print("✓ Pre-trained model loaded successfully")
    except Exception as e:
        print(f"Error loading model: {e}")
        SAVED_MODEL = None

# SKU Metadata with sizes
SKU_METADATA = {
    # Mountain Dew
    'MD8': {'brand': 'Mountain Dew', 'size': '8oz', 'category': 'Soda'},
    'MD12': {'brand': 'Mountain Dew', 'size': '12oz', 'category': 'Soda'},
    'MD290': {'brand': 'Mountain Dew', 'size': '290ml', 'category': 'Soda'},
    'MD750': {'brand': 'Mountain Dew', 'size': '750ml', 'category': 'Soda'},
    'MD1L': {'brand': 'Mountain Dew', 'size': '1L', 'category': 'Soda'},
    'MD1.25': {'brand': 'Mountain Dew', 'size': '1.25L', 'category': 'Soda'},
    'MD1.5': {'brand': 'Mountain Dew', 'size': '1.5L', 'category': 'Soda'},
    'MD1.5/6': {'brand': 'Mountain Dew', 'size': '1.5L', 'category': 'Soda'},
    
    # Pepsi
    'P8': {'brand': 'Pepsi', 'size': '8oz', 'category': 'Soda'},
    'P290': {'brand': 'Pepsi', 'size': '290ml', 'category': 'Soda'},
    'P750': {'brand': 'Pepsi', 'size': '750ml', 'category': 'Soda'},
    'P1L': {'brand': 'Pepsi', 'size': '1L', 'category': 'Soda'},
    'P1.25': {'brand': 'Pepsi', 'size': '1.25L', 'category': 'Soda'},
    'P1.5': {'brand': 'Pepsi', 'size': '1.5L', 'category': 'Soda'},
    'P1.5/6': {'brand': 'Pepsi', 'size': '1.5L', 'category': 'Soda'},
    
    # 7Up
    'S7': {'brand': '7Up', 'size': '7oz', 'category': 'Soda'},
    'SS8': {'brand': '7Up', 'size': '8oz', 'category': 'Soda'},
    'SS290': {'brand': '7Up', 'size': '290ml', 'category': 'Soda'},
    'SEV290': {'brand': 'Seven', 'size': '290ml', 'category': 'Soda'},
    'S1.25': {'brand': '7Up', 'size': '1.25L', 'category': 'Soda'},
    'S1.5': {'brand': '7Up', 'size': '1.5L', 'category': 'Soda'},
    
    # Gatorade
    'GBB350': {'brand': 'Gatorade', 'size': '350ml', 'category': 'Sports Drink'},
    'GBB500': {'brand': 'Gatorade', 'size': '500ml', 'category': 'Sports Drink'},
    'GTF350': {'brand': 'Gatorade', 'size': '350ml', 'category': 'Sports Drink'},
    'GR500': {'brand': 'Gatorade', 'size': '500ml', 'category': 'Sports Drink'},
    'GO500': {'brand': 'Gatorade', 'size': '500ml', 'category': 'Sports Drink'},
    'GB900': {'brand': 'Gatorade', 'size': '900ml', 'category': 'Sports Drink'},
    'GBB8': {'brand': 'Gatorade', 'size': '8oz', 'category': 'Sports Drink'},
    'GBB237': {'brand': 'Gatorade', 'size': '237ml', 'category': 'Sports Drink'},
    
    # Milkis
    'MILKIS': {'brand': 'Milkis', 'size': '250ml', 'category': 'Milk Drink'},
    'MILKIS500': {'brand': 'Milkis', 'size': '500ml', 'category': 'Milk Drink'},
    
    # Tropicana
    'TRO8': {'brand': 'Tropicana', 'size': '8oz', 'category': 'Juice'},
    
    # Premier Water
    'PW350': {'brand': 'Premier Water', 'size': '350ml', 'category': 'Water'},
    'PW500': {'brand': 'Premier Water', 'size': '500ml', 'category': 'Water'},
    'PW1L': {'brand': 'Premier Water', 'size': '1L', 'category': 'Water'}
}

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
    Handles PER-CASE sales data
    """
    print("Processing WIDE format (Date-Outlet-SKUs) - PER CASE")
    
    # SKU to case quantity mapping
    CASE_QUANTITIES = {
        # Mountain Dew
        'MD8': 24, 'MD12': 24, 'MD290': 24, 'MD750': 12, 'MD1L': 12, 
        'MD1.25': 12, 'MD1.5': 12, 'MD1.5/6': 6,
        # Pepsi
        'P8': 24, 'P290': 24, 'P750': 12, 'P1L': 12, 
        'P1.25': 12, 'P1.5': 12, 'P1.5/6': 6,
        # 7Up
        'S7': 24, 'SS8': 24, 'SS290': 24, 'SEV290': 24, 
        'S1.25': 12, 'S1.5': 12,
        # Gatorade
        'GBB350': 24, 'GBB500': 24, 'GTF350': 24, 'GR500': 24, 
        'GO500': 24, 'GB900': 12, 'GBB8': 24, 'GBB237': 24,
        # Milkis
        'MILKIS': 30, 'MILKIS500': 20,
        # Tropicana
        'TRO8': 24,
        # Premier Water
        'PW350': 24, 'PW500': 24, 'PW1L': 12
    }
    
    # Case pricing data (in Philippine Pesos)
    CASE_PRICES = {
        # Mountain Dew
        'MD8': 380, 'MD12': 480, 'MD290': 380, 'MD750': 540, 'MD1L': 650,
        'MD1.25': 720, 'MD1.5': 840, 'MD1.5/6': 420,
        # Pepsi
        'P8': 380, 'P290': 380, 'P750': 540, 'P1L': 650,
        'P1.25': 720, 'P1.5': 840, 'P1.5/6': 420,
        # 7Up
        'S7': 350, 'SS8': 380, 'SS290': 380, 'SEV290': 380,
        'S1.25': 720, 'S1.5': 840,
        # Gatorade
        'GBB350': 780, 'GBB500': 980, 'GTF350': 780, 'GR500': 980,
        'GO500': 980, 'GB900': 780, 'GBB8': 480, 'GBB237': 550,
        # Milkis
        'MILKIS': 900, 'MILKIS500': 1200,
        # Tropicana
        'TRO8': 420,
        # Premier Water
        'PW350': 130, 'PW500': 150, 'PW1L': 170
    }
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
    
    # Convert cases to units and calculate revenue
    print(f"Converting {len(sku_cols)} SKU columns from cases to units and revenue...")

    # Initialize columns with proper numeric types
    df['total_units'] = 0.0
    df['total_revenue'] = 0.0

    for col in sku_cols:
        cases = parse_num_series(df[col])
        
        # Get case quantity and price for this SKU
        case_qty = CASE_QUANTITIES.get(col.strip(), 1)
        case_price = CASE_PRICES.get(col.strip(), 0)
        
        # Convert cases to units - ensure numeric
        units = cases.fillna(0) * case_qty
        df[f'{col}_units'] = units.astype(float)
        
        # Calculate revenue (cases × case price) - ensure numeric
        revenue = cases.fillna(0) * case_price
        df[f'{col}_revenue'] = revenue.astype(float)
        
        # Add to totals - use .add() to avoid type errors
        df['total_units'] = df['total_units'].add(units, fill_value=0)
        df['total_revenue'] = df['total_revenue'].add(revenue, fill_value=0)
        
        if cases.sum() > 0:
            print(f"  ✓ {col}: {cases.sum():.0f} cases × {case_qty} units = {units.sum():.0f} units | Revenue: ₱{revenue.sum():,.2f}")

    # Ensure totals are numeric
    df['total_units'] = pd.to_numeric(df['total_units'], errors='coerce').fillna(0)
    df['total_revenue'] = pd.to_numeric(df['total_revenue'], errors='coerce').fillna(0)

    print(f"\n{'='*60}")
    print(f"CONVERSION SUMMARY")
    print(f"{'='*60}")

    # Calculate total cases processed safely
    total_cases = 0
    for col in sku_cols:
        col_cases = parse_num_series(df[col]).sum()
        total_cases += col_cases

    print(f"Total Cases Processed: {total_cases:,.0f}")
    print(f"Total Units: {df['total_units'].sum():,.0f}")
    print(f"Total Revenue: ₱{df['total_revenue'].sum():,.2f}")
    print(f"{'='*60}\n")
    
    # Group by date - now with both units and revenue
    result = df.groupby(date_col).agg({
        'total_units': 'sum',
        'total_revenue': 'sum'
    }).reset_index()
    result.columns = ['ds', 'y', 'revenue']

    print(f"✓ Converted wide format: {len(result)} daily observations")
    print(f"✓ Total units (all SKUs combined): {result['y'].sum():,.0f}")
    print(f"✓ Total revenue: ₱{result['revenue'].sum():,.2f}")
    return result


def process_standard_format(df):
    """
    Process standard format (Date, SKU/Value columns)
    """
    print("Processing STANDARD format (assuming per-unit data)")
    
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

        # Calculate revenue metrics
        if 'revenue' in prophet_df.columns:
            # Ensure revenue column is numeric
            prophet_df['revenue'] = pd.to_numeric(prophet_df['revenue'], errors='coerce').fillna(0)
            
            total_revenue = float(prophet_df['revenue'].sum())
            avg_daily_revenue = float(prophet_df['revenue'].mean())
            
            # Project revenue for forecast period
            forecast_revenue = []
            if total_revenue > 0 and prophet_df['y'].sum() > 0:
                avg_price_per_unit = total_revenue / prophet_df['y'].sum()
                for _, row in future_forecast.iterrows():
                    forecast_revenue.append(float(row['yhat']) * avg_price_per_unit)
            else:
                forecast_revenue = [0] * len(forecast_values)
        else:
            total_revenue = 0
            avg_daily_revenue = 0
            forecast_revenue = [0] * len(forecast_values)

        # Update the return jsonify to include revenue data
        return jsonify({
            "model_used": "prophet_optimized",
            "forecast": forecast_list,
            "graph": {"dates": combined_dates, "series": graph_series},
            "scenario_results": {"base": forecast_values},
            "decisions": [],
            "feature_importance": None,
            "monthly_total": float(sum(forecast_values)),
            "monthly_revenue": sum(forecast_revenue),  # NEW
            "forecast_days": forecast_days,
            "metrics": {
                **final_metrics,
                "total_revenue": total_revenue,  # NEW
                "avg_daily_revenue": avg_daily_revenue,  # NEW
                "avg_price_per_unit": total_revenue / prophet_df['y'].sum() if prophet_df['y'].sum() > 0 else 0  # NEW
            },
            "evaluation": evaluation_results,
            "insights": insights,
            "model_params": model_params,
            "revenue_forecast": forecast_revenue  # NEW
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

@app.route("/decision-support", methods=["POST"])
def decision_support():
    """
    Enhanced decision support using Gemini AI for insights
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean data
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)
        
        prophet_df = detect_format_and_process(df)
        
        # Calculate comprehensive metrics
        total_sales = prophet_df['y'].sum()
        avg_daily = prophet_df['y'].mean()
        std_dev = prophet_df['y'].std()
        cv = std_dev / avg_daily if avg_daily > 0 else 0
        
        # Trend analysis
        first_half = prophet_df.iloc[:len(prophet_df)//2]['y'].mean()
        second_half = prophet_df.iloc[len(prophet_df)//2:]['y'].mean()
        trend = ((second_half - first_half) / first_half * 100) if first_half > 0 else 0
        
        # Seasonal analysis
        prophet_df['month'] = prophet_df['ds'].dt.month
        monthly_avg = prophet_df.groupby('month')['y'].mean().to_dict()
        peak_month = max(monthly_avg, key=monthly_avg.get)
        low_month = min(monthly_avg, key=monthly_avg.get)
        
        # Store analysis (if available)
        store_metrics = {}
        if 'OUTLET' in df.columns or 'outlet' in df.columns:
            outlet_col = 'OUTLET' if 'OUTLET' in df.columns else 'outlet'
            for col in df.columns[2:]:
                df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
            df['total'] = df.iloc[:, 2:].sum(axis=1)
            store_totals = df.groupby(outlet_col)['total'].sum().sort_values(ascending=False)
            store_metrics = {
                "top_store": store_totals.index[0] if len(store_totals) > 0 else "N/A",
                "top_store_sales": float(store_totals.iloc[0]) if len(store_totals) > 0 else 0,
                "total_stores": len(store_totals),
                "store_distribution": store_totals.head(5).to_dict()
            }
        
        # Prepare prompt for Gemini
        prompt = f"""You are a beverage business analyst. Give me clear, simple decision based on this data.

Sales Overview:
- Total Sales: {int(total_sales):,} units
- Daily Average: {int(avg_daily):,} units
- Sales Stability: {"Stable" if cv < 0.3 else "Variable" if cv < 0.5 else "Very unpredictable"}
- Trend: {"Growing" if trend > 0 else "Declining"} by {abs(trend):.1f}%
- Period: {prophet_df['ds'].min().date()} to {prophet_df['ds'].max().date()}

Seasonal Patterns:
- Best Month: {calendar.month_abbr[peak_month]} with {int(monthly_avg[peak_month]):,} units average
- Slowest Month: {calendar.month_abbr[low_month]} with {int(monthly_avg[low_month]):,} units average

{"Store Performance:" if store_metrics else ""}
{f"- Top Store: {store_metrics.get('top_store', 'N/A')} with {int(store_metrics.get('top_store_sales', 0)):,} units" if store_metrics else ""}
{f"- Total Stores: {store_metrics.get('total_stores', 0)}" if store_metrics else ""}

Give me a simple report with these sections. Use plain language.

1. Where to expand
Tell me which stores or areas to grow. Be specific about which stores need more product or support.

2. How to manage inventory
When to stock more, when to stock less. Give me the months and amounts.

3. What could go wrong
Tell me the risks. When might we run out of stock? Which stores are struggling?

4. Top 5 things to do now
List 5 specific actions to take this month. Make them practical and clear.

5. Which stores need attention
Which stores should we focus on and why? Which ones need help?

Keep it short and clear. No fancy formatting or business jargon. Prevent using ** in the output or extras"""

        # Call Gemini API
        headers = {"Content-Type": "application/json"}
        payload = {
            "contents": [{
                "parts": [{"text": prompt}]
            }],
            "generationConfig": {
                "temperature": 0.7,
                "maxOutputTokens": 3072,
                "topP": 0.95,
                "topK": 40
            }
        }

        url_with_key = f"{GEMINI_API_URL}?key={GEMINI_API_KEY}"
        resp = requests.post(url_with_key, headers=headers, json=payload, timeout=30)
        
        if resp.status_code != 200:
            # Fallback to rule-based insights
            insights = generate_fallback_insights(total_sales, avg_daily, trend, cv, monthly_avg, store_metrics)
            return jsonify({
                "insights": insights,
                "metrics": {
                    "total_sales": int(total_sales),
                    "avg_daily": int(avg_daily),
                    "trend": round(trend, 2),
                    "volatility": round(cv, 3),
                    "peak_month": calendar.month_abbr[peak_month],
                    "store_metrics": store_metrics
                },
                "generated_by": "Rule-based System (Gemini unavailable)"
            })
        
        result = resp.json()
        generated_text = result.get('candidates', [{}])[0].get('content', {}).get('parts', [{}])[0].get('text', '')
        
        return jsonify({
            "insights": generated_text,
            "metrics": {
                "total_sales": int(total_sales),
                "avg_daily": int(avg_daily),
                "trend": round(trend, 2),
                "volatility": round(cv, 3),
                "peak_month": calendar.month_abbr[peak_month],
                "store_metrics": store_metrics
            },
            "generated_by": "Gemini 2.5 Flash"
        })

    except Exception as e:
        import traceback
        print(f"Decision support error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400
    


def generate_fallback_insights(total_sales, avg_daily, trend, cv, monthly_avg, store_metrics):
    """Generate rule-based insights when Gemini is unavailable"""
    peak_month = max(monthly_avg, key=monthly_avg.get)
    low_month = min(monthly_avg, key=monthly_avg.get)
    
    insights = f"""# DECISION SUPPORT REPORT

## 1. EXPANSION RECOMMENDATIONS
"""
    
    if trend > 10:
        insights += f"- ✅ **Strong growth trend (+{trend:.1f}%)** - Excellent time for expansion\n"
        insights += "- Prioritize high-performing stores for increased capacity\n"
        insights += "- Consider opening new distribution centers in underserved areas\n"
    elif trend > 0:
        insights += f"- ✅ Moderate growth (+{trend:.1f}%) - Selective expansion recommended\n"
        insights += "- Focus on optimizing existing operations before major expansion\n"
    else:
        insights += f"- ⚠️ Declining trend ({trend:.1f}%) - Hold expansion, focus on retention\n"
        insights += "- Investigate causes of decline before new investments\n"
    
    if store_metrics:
        insights += f"\n- Top store ({store_metrics.get('top_store', 'N/A')}) accounts for significant volume\n"
        insights += f"- {store_metrics.get('total_stores', 0)} total stores - diversification {'needed' if store_metrics.get('total_stores', 0) < 10 else 'adequate'}\n"
    
    insights += f"""

## 2. STOCKING STRATEGY
- **Peak Season ({calendar.month_abbr[peak_month]})**: Increase stock by 40-50%
- **Low Season ({calendar.month_abbr[low_month]})**: Reduce stock by 20-30%
- Average daily requirement: {int(avg_daily):,} units
- Safety stock: {int(avg_daily * 7):,} units (7-day buffer)
"""
    
    if cv > 0.5:
        insights += "- ⚠️ High volatility detected - maintain higher safety stock\n"
    elif cv > 0.3:
        insights += "- Moderate volatility - standard safety stock adequate\n"
    else:
        insights += "- Low volatility - can optimize for lower carrying costs\n"
    
    insights += f"""

## 3. RISK ASSESSMENT
"""
    if cv > 0.5:
        insights += "- 🔴 HIGH RISK: Demand volatility above 50%\n"
        insights += "- Implement dynamic reorder points\n"
    
    if trend < -5:
        insights += "- 🔴 CRITICAL: Sales declining, investigate immediately\n"
    
    insights += f"- Monitor stock levels closely during {calendar.month_abbr[peak_month]}\n"
    insights += f"- Potential overstock risk in {calendar.month_abbr[low_month]}\n"
    
    insights += """

## 4. ACTIONABLE INSIGHTS

### Immediate Actions (Next 30 Days):
1. Review inventory levels for upcoming peak season
2. Contact underperforming stores to understand challenges
3. Optimize delivery routes for top-performing stores
4. Implement demand forecasting automation
5. Set up stockout alerts for critical SKUs

### Short-term (3-6 Months):
- Negotiate better rates with high-volume stores
- Expand product range based on seasonal patterns
- Implement promotional campaigns during low seasons

### Long-term (6-12 Months):
- Consider warehouse expansion if growth continues
- Invest in predictive analytics
- Develop strategic partnerships with top stores

## 5. STORE PRIORITIZATION
"""
    
    if store_metrics and store_metrics.get('store_distribution'):
        insights += "**High Priority (Investment Focus):**\n"
        for store, sales in list(store_metrics['store_distribution'].items())[:2]:
            insights += f"- {store}: {int(sales):,} units (top performer)\n"
    
    insights += "\n**Medium Priority (Growth Potential):**\n"
    insights += "- Stores with 5-10% month-over-month growth\n"
    insights += "- New stores (< 6 months) showing promise\n"
    
    insights += "\n**Attention Needed:**\n"
    insights += "- Stores with declining orders\n"
    insights += "- Stores with erratic ordering patterns\n"
    
    return insights

@app.route("/store-demand-causes", methods=["POST"])
def store_demand_causes():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean data
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        # Process data
        prophet_df = detect_format_and_process(df)
        
        # Find date and outlet columns from original df
        date_col = None
        outlet_col = None
        for col in df.columns:
            if col.lower().strip() in ['date', 'datetime', 'ds', 'day']:
                date_col = col
            elif 'outlet' in col.lower():
                outlet_col = col
        
        if not outlet_col or not date_col:
            return jsonify({"causes": []})
        
        # Parse dates
        df[date_col] = pd.to_datetime(df[date_col], errors='coerce')
        df = df.dropna(subset=[date_col])
        
        # Calculate total sales per store
        sku_cols = [col for col in df.columns if col not in [date_col, outlet_col]]
        for col in sku_cols:
            df[col] = parse_num_series(df[col])
        df['total'] = df[sku_cols].sum(axis=1)
        
        # Analyze each store
        store_causes = []
        for store in df[outlet_col].unique():
            store_data = df[df[outlet_col] == store].copy()
            store_data = store_data.sort_values(date_col)
            
            if len(store_data) < 7:
                continue
            
            # Calculate trends
            recent_avg = store_data.tail(7)['total'].mean()
            overall_avg = store_data['total'].mean()
            
            # Detect patterns
            cause = ""
            status = "normal"
            
            if recent_avg < overall_avg * 0.3:
                cause = "🔴 Significantly reduced ordering (possible stock issues or closing)"
                status = "critical"
            elif recent_avg < overall_avg * 0.6:
                cause = "⚠️ Decreased ordering (may need follow-up)"
                status = "warning"
            elif recent_avg > overall_avg * 1.5:
                cause = "📈 Increased ordering (high demand or promotion)"
                status = "good"
            elif store_data['total'].std() > overall_avg * 0.8:
                cause = "📊 Highly variable ordering pattern"
                status = "variable"
            else:
                cause = "✅ Stable ordering pattern"
                status = "stable"
            
            # Check for stopped ordering
            days_since_last_order = (df[date_col].max() - store_data[date_col].max()).days
            if days_since_last_order > 14:
                cause = f"❌ Stopped ordering ({days_since_last_order} days ago)"
                status = "stopped"
            
            store_causes.append({
                "store": str(store),
                "cause": cause,
                "status": status,
                "recent_avg": float(recent_avg),
                "overall_avg": float(overall_avg),
                "days_since_last_order": int(days_since_last_order),
                "total_orders": int(len(store_data))
            })
        
        # Sort by status priority
        priority = {"stopped": 0, "critical": 1, "warning": 2, "variable": 3, "good": 4, "stable": 5}
        store_causes.sort(key=lambda x: priority.get(x['status'], 99))
        
        return jsonify({"causes": store_causes})

    except Exception as e:
        import traceback
        print(f"Store demand causes error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400
    
@app.route("/store-analytics", methods=["POST"])
def store_analytics():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean duplicate headers
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                          (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        # Fill numeric columns
        for col in df.columns[2:]:
            df[col] = pd.to_numeric(df[col], errors='coerce').fillna(0)
        
        # Total demand per store
        df['total'] = df.iloc[:, 2:].sum(axis=1)
        store_totals = df.groupby('OUTLET')['total'].sum().sort_values(ascending=False)
        
        # Days with highest demand per store
        store_days = df.groupby(['OUTLET', 'DATE'])['total'].sum().reset_index()
        top_days = store_days.groupby('OUTLET').apply(lambda x: x.sort_values('total', ascending=False).head(3).to_dict(orient='records')).to_dict()
        
        # Top stores
        top_stores = store_totals.head(5).to_dict()

        return jsonify({
            "top_buyers": [{"name": k, "sales": v} for k, v in top_stores.items()],
            "store_demand_patterns": top_days,
            "insights": "Store demand causes can be analyzed using causal analysis endpoint"
        })

    except Exception as e:
        import traceback
        print(f"Store analytics error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400


@app.route("/causal-analysis-extended", methods=["POST"])
def causal_analysis_extended():
    try:
        response = causal_analysis()  # reuse existing function
        data = response.get_json()
        
        # Additional store-level causes (simplified example)
        data['store_demand_causes'] = [
            {"store": "RO8", "reason": "Promotion last week"},
            {"store": "PUDOL", "reason": "Stopped ordering due to low stock"}
        ]
        return jsonify(data)
    except Exception as e:
        return jsonify({"error": str(e)}), 400



import requests
import json

GEMINI_API_KEY = "AIzaSyDls9Ny2ciONGXc-QC5QI1o77eXtaWGydE"
GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"

@app.route("/category-analysis", methods=["POST"])
def category_analysis():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean duplicate headers
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        # Identify SKU columns (everything except DATE and OUTLET)
        date_col = None
        outlet_col = None
        
        for col in df.columns:
            if col.lower().strip() in ['date', 'datetime', 'ds', 'day']:
                date_col = col
            elif 'outlet' in col.lower():
                outlet_col = col
        
        sku_cols = [col for col in df.columns if col not in [date_col, outlet_col]]
        
        # ENHANCED: Calculate per-SKU metrics with bottle size
        sku_details = []
        brands = {}
        bottle_sizes = {}
        categories = {}
        
        total_cases = 0
        total_units = 0
        total_revenue = 0
        top_sku = None
        max_units = 0
        
        for sku in sku_cols:
            # Convert to numeric (cases)
            df[sku] = parse_num_series(df[sku])
            cases = df[sku].sum()
            
            if cases <= 0:
                continue
            
            # Get SKU metadata
            sku_info = SKU_METADATA.get(sku.strip(), {
                'brand': 'Unknown',
                'size': 'N/A',
                'category': 'Other'
            })
            
            # Get case quantity and price
            case_qty = {
                'MD8': 24, 'MD12': 24, 'MD290': 24, 'MD750': 12, 'MD1L': 12, 
                'MD1.25': 12, 'MD1.5': 12, 'MD1.5/6': 6,
                'P8': 24, 'P290': 24, 'P750': 12, 'P1L': 12, 
                'P1.25': 12, 'P1.5': 12, 'P1.5/6': 6,
                'S7': 24, 'SS8': 24, 'SS290': 24, 'SEV290': 24, 
                'S1.25': 12, 'S1.5': 12,
                'GBB350': 24, 'GBB500': 24, 'GTF350': 24, 'GR500': 24, 
                'GO500': 24, 'GB900': 12, 'GBB8': 24, 'GBB237': 24,
                'MILKIS': 30, 'MILKIS500': 20,
                'TRO8': 24,
                'PW350': 24, 'PW500': 24, 'PW1L': 12
            }.get(sku.strip(), 1)
            
            case_price = {
                'MD8': 380, 'MD12': 480, 'MD290': 380, 'MD750': 540, 'MD1L': 650,
                'MD1.25': 720, 'MD1.5': 840, 'MD1.5/6': 420,
                'P8': 380, 'P290': 380, 'P750': 540, 'P1L': 650,
                'P1.25': 720, 'P1.5': 840, 'P1.5/6': 420,
                'S7': 350, 'SS8': 380, 'SS290': 380, 'SEV290': 380,
                'S1.25': 720, 'S1.5': 840,
                'GBB350': 780, 'GBB500': 980, 'GTF350': 780, 'GR500': 980,
                'GO500': 980, 'GB900': 780, 'GBB8': 480, 'GBB237': 550,
                'MILKIS': 900, 'MILKIS500': 1200,
                'TRO8': 420,
                'PW350': 130, 'PW500': 150, 'PW1L': 170
            }.get(sku.strip(), 0)
            
            # Calculate units and revenue
            units = cases * case_qty
            revenue = cases * case_price
            
            # Track totals
            total_cases += cases
            total_units += units
            total_revenue += revenue
            
            # Track top SKU
            if units > max_units:
                max_units = units
                top_sku = {
                    'sku': sku,
                    'brand': sku_info['brand'],
                    'bottle_size': sku_info['size'],
                    'cases': float(cases),
                    'units': float(units),
                    'revenue': float(revenue)
                }
            
            # Add to SKU details
            sku_details.append({
                'sku': sku,
                'brand': sku_info['brand'],
                'bottle_size': sku_info['size'],  # ⭐ NEW
                'category': sku_info['category'],
                'cases': float(cases),
                'units': float(units),
                'revenue': float(revenue)
            })
            
            # Aggregate by brand
            brands[sku_info['brand']] = brands.get(sku_info['brand'], 0) + units
            
            # Aggregate by bottle size
            bottle_sizes[sku_info['size']] = bottle_sizes.get(sku_info['size'], 0) + units
            
            # Aggregate by category
            categories[sku_info['category']] = categories.get(sku_info['category'], 0) + units
        
        # Sort and format results
        sorted_brands = sorted([{'brand': k, 'sales': float(v)} for k, v in brands.items()], 
                              key=lambda x: x['sales'], reverse=True)
        
        sorted_bottle_sizes = sorted([{'size': k, 'sales': float(v)} for k, v in bottle_sizes.items()], 
                                     key=lambda x: x['sales'], reverse=True)
        
        sorted_categories = sorted([{'category': k, 'sales': float(v)} for k, v in categories.items()], 
                                   key=lambda x: x['sales'], reverse=True)
        
        sorted_sku_details = sorted(sku_details, key=lambda x: x['units'], reverse=True)
        
        return jsonify({
            "brands": sorted_brands,
            "bottle_sizes": sorted_bottle_sizes,
            "categories": sorted_categories,
            "sku_details": sorted_sku_details,
            "total_skus": len(sku_cols),
            "total_cases": float(total_cases),
            "total_units": float(total_units),
            "total_revenue": float(total_revenue),
            "top_sku": top_sku  # ⭐ Make sure this is included
        })

    except Exception as e:
        import traceback
        print(f"Category analysis error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400

@app.route("/causal-factors-report", methods=["POST"])
def causal_factors_report():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean data
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        prophet_df = detect_format_and_process(df)
        
        if prophet_df.empty:
            return jsonify({"factors": []})

        # Analyze external factors
        prophet_df['month'] = prophet_df['ds'].dt.month
        prophet_df['day_of_week'] = prophet_df['ds'].dt.dayofweek
        prophet_df['is_weekend'] = prophet_df['day_of_week'].isin([5, 6])
        
        # Calculate correlations
        avg_sales = prophet_df['y'].mean()
        
        factors = []
        
        # Weekend effect
        weekend_sales = prophet_df[prophet_df['is_weekend']]['y'].mean()
        weekend_impact = ((weekend_sales - avg_sales) / avg_sales * 100) if avg_sales > 0 else 0
        factors.append({
            "factor": "Weekend Effect",
            "impact": round(float(weekend_impact), 2)
        })
        
        # Monthly seasonality
        monthly_avg = prophet_df.groupby('month')['y'].mean()
        peak_month = monthly_avg.idxmax()
        peak_impact = ((monthly_avg.max() - avg_sales) / avg_sales * 100) if avg_sales > 0 else 0
        factors.append({
            "factor": f"Peak Season ({calendar.month_abbr[peak_month]})",
            "impact": round(float(peak_impact), 2)
        })
        
        # Trend analysis
        first_half = prophet_df.iloc[:len(prophet_df)//2]['y'].mean()
        second_half = prophet_df.iloc[len(prophet_df)//2:]['y'].mean()
        trend_impact = ((second_half - first_half) / first_half * 100) if first_half > 0 else 0
        factors.append({
            "factor": "Overall Trend",
            "impact": round(float(trend_impact), 2)
        })

        return jsonify({
            "factors": factors,
            "insights": "External factors analysis based on historical patterns"
        })

    except Exception as e:
        import traceback
        print(f"Causal factors report error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400
    

@app.route("/full-reports", methods=["POST"])
def full_reports():
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean data
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        prophet_df = detect_format_and_process(df)
        
        if prophet_df.empty:
            return jsonify({"monthly": [], "weekly": [], "yearly": []})

        # Monthly reports
        prophet_df['year_month'] = prophet_df['ds'].dt.to_period('M')
        monthly = prophet_df.groupby('year_month')['y'].sum().reset_index()
        monthly['month'] = monthly['year_month'].astype(str)
        monthly_data = monthly[['month', 'y']].rename(columns={'y': 'total_sales'}).to_dict('records')

        # Weekly reports
        prophet_df['year_week'] = prophet_df['ds'].dt.to_period('W')
        weekly = prophet_df.groupby('year_week')['y'].sum().reset_index()
        weekly['week'] = weekly['year_week'].astype(str)
        weekly_data = weekly[['week', 'y']].rename(columns={'y': 'total_sales'}).to_dict('records')

        # Yearly reports
        prophet_df['year'] = prophet_df['ds'].dt.year
        yearly = prophet_df.groupby('year')['y'].sum().reset_index()
        yearly_data = yearly.rename(columns={'y': 'total_sales'}).to_dict('records')

        return jsonify({
            "monthly": monthly_data,
            "weekly": weekly_data[:10],  # Last 10 weeks
            "yearly": yearly_data
        })

    except Exception as e:
        import traceback
        print(f"Full reports error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400

        
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

@app.route("/sku-info", methods=["GET"])
def sku_info():
    """Return SKU case quantity information"""
    CASE_QUANTITIES = {
        'MD8': 24, 'MD12': 24, 'MD290': 24, 'MD750': 12, 'MD1L': 12, 
        'MD1.25': 12, 'MD1.5': 12, 'MD1.5/6': 6,
        'P8': 24, 'P290': 24, 'P750': 12, 'P1L': 12, 
        'P1.25': 12, 'P1.5': 12, 'P1.5/6': 6,
        'S7': 24, 'SS8': 24, 'SS290': 24, 'SEV290': 24, 
        'S1.25': 12, 'S1.5': 12,
        'GBB350': 24, 'GBB500': 24, 'GTF350': 24, 'GR500': 24, 
        'GO500': 24, 'GB900': 12, 'GBB8': 24, 'GBB237': 24,
        'MILKIS': 30, 'MILKIS500': 20,
        'TRO8': 24,
        'PW350': 24, 'PW500': 24, 'PW1L': 12
    }
    return jsonify({"sku_case_quantities": CASE_QUANTITIES})

@app.route("/sales-query", methods=["POST"])
def sales_query():
    """
    Query exact sales for specific date ranges
    Supports: specific date, week, month, year, or custom range
    """
    try:
        if "file" not in request.files:
            return jsonify({"error": "No file uploaded"}), 400

        file = request.files["file"]
        query_type = request.form.get("query_type", "date")  # date, week, month, year, custom
        query_value = request.form.get("query_value", "")  # e.g., "2023-03-15", "2023-03", "2023"
        start_date = request.form.get("start_date", "")  # for custom range
        end_date = request.form.get("end_date", "")  # for custom range
        
        # Load and process data
        df = pd.read_csv(file, dtype=str, keep_default_na=False, na_values=[''])
        
        # Clean duplicate headers
        if df.shape[1] >= 2:
            second_col = df.columns[1]
            mask_header = (df[second_col].astype(str).str.strip().str.upper() == "OUTLET") | \
                         (df.iloc[:, 0].astype(str).str.strip().str.upper() == "DATE")
            df = df.loc[~mask_header].reset_index(drop=True)

        prophet_df = detect_format_and_process(df)
        
        if prophet_df.empty:
            return jsonify({"error": "No valid data after processing"}), 400

        # Parse dates
        prophet_df['date'] = pd.to_datetime(prophet_df['ds'])
        prophet_df['year'] = prophet_df['date'].dt.year
        prophet_df['month'] = prophet_df['date'].dt.month
        prophet_df['week'] = prophet_df['date'].dt.isocalendar().week
        prophet_df['day_of_week'] = prophet_df['date'].dt.day_name()
        
        result = {}
        
        if query_type == "date":
            # Specific date query
            query_date = pd.to_datetime(query_value)
            matched = prophet_df[prophet_df['date'] == query_date]
            
            if len(matched) > 0:
                result = {
                    "query_type": "Specific Date",
                    "query_value": query_value,
                    "total_sales": int(matched['y'].sum()),
                    "date": query_value,
                    "day_of_week": matched.iloc[0]['day_of_week'],
                    "found": True
                }
            else:
                result = {
                    "query_type": "Specific Date",
                    "query_value": query_value,
                    "found": False,
                    "message": "No sales data found for this date"
                }
        
        elif query_type == "week":
            # Week query (format: "2023-W10")
            year, week = query_value.split('-W')
            year = int(year)
            week = int(week)
            
            matched = prophet_df[(prophet_df['year'] == year) & (prophet_df['week'] == week)]
            
            if len(matched) > 0:
                result = {
                    "query_type": "Week",
                    "query_value": query_value,
                    "total_sales": int(matched['y'].sum()),
                    "average_daily": int(matched['y'].mean()),
                    "days_count": len(matched),
                    "date_range": f"{matched['date'].min().date()} to {matched['date'].max().date()}",
                    "daily_breakdown": matched[['date', 'y']].rename(columns={'y': 'sales'}).to_dict('records'),
                    "found": True
                }
            else:
                result = {"query_type": "Week", "query_value": query_value, "found": False}
        
        elif query_type == "month":
            # Month query (format: "2023-03")
            year, month = query_value.split('-')
            year = int(year)
            month = int(month)
            
            matched = prophet_df[(prophet_df['year'] == year) & (prophet_df['month'] == month)]
            
            if len(matched) > 0:
                # Weekly breakdown
                weekly = matched.groupby('week')['y'].sum().to_dict()
                
                result = {
                    "query_type": "Month",
                    "query_value": query_value,
                    "month_name": calendar.month_name[month],
                    "total_sales": int(matched['y'].sum()),
                    "average_daily": int(matched['y'].mean()),
                    "days_count": len(matched),
                    "peak_day": {
                        "date": str(matched.loc[matched['y'].idxmax()]['date'].date()),
                        "sales": int(matched['y'].max())
                    },
                    "lowest_day": {
                        "date": str(matched.loc[matched['y'].idxmin()]['date'].date()),
                        "sales": int(matched['y'].min())
                    },
                    "weekly_breakdown": {f"Week {k}": int(v) for k, v in weekly.items()},
                    "daily_breakdown": matched[['date', 'y']].rename(columns={'y': 'sales'}).to_dict('records'),
                    "found": True
                }
            else:
                result = {"query_type": "Month", "query_value": query_value, "found": False}
        
        elif query_type == "year":
            # Year query (format: "2023")
            year = int(query_value)
            matched = prophet_df[prophet_df['year'] == year]
            
            if len(matched) > 0:
                # Monthly breakdown
                monthly = matched.groupby('month')['y'].sum().to_dict()
                
                result = {
                    "query_type": "Year",
                    "query_value": query_value,
                    "total_sales": int(matched['y'].sum()),
                    "average_daily": int(matched['y'].mean()),
                    "days_count": len(matched),
                    "peak_month": {
                        "month": calendar.month_name[matched.groupby('month')['y'].sum().idxmax()],
                        "sales": int(matched.groupby('month')['y'].sum().max())
                    },
                    "monthly_breakdown": {calendar.month_abbr[k]: int(v) for k, v in monthly.items()},
                    "found": True
                }
            else:
                result = {"query_type": "Year", "query_value": query_value, "found": False}
        
        elif query_type == "custom":
            # Custom date range
            start = pd.to_datetime(start_date)
            end = pd.to_datetime(end_date)
            
            matched = prophet_df[(prophet_df['date'] >= start) & (prophet_df['date'] <= end)]
            
            if len(matched) > 0:
                result = {
                    "query_type": "Custom Range",
                    "start_date": start_date,
                    "end_date": end_date,
                    "total_sales": int(matched['y'].sum()),
                    "average_daily": int(matched['y'].mean()),
                    "days_count": len(matched),
                    "peak_day": {
                        "date": str(matched.loc[matched['y'].idxmax()]['date'].date()),
                        "sales": int(matched['y'].max())
                    },
                    "daily_breakdown": matched[['date', 'y']].rename(columns={'y': 'sales'}).to_dict('records'),
                    "found": True
                }
            else:
                result = {"query_type": "Custom Range", "found": False}
        
        return jsonify(result)

    except Exception as e:
        import traceback
        print(f"Sales query error: {e}")
        print(traceback.format_exc())
        return jsonify({"error": str(e)}), 400
    
@app.route("/sku-pricing", methods=["GET"])
def sku_pricing():
    """Return complete SKU information including prices"""
    sku_data = []
    for sku, qty in CASE_QUANTITIES.items():
        sku_data.append({
            "sku": sku,
            "case_qty": qty,
            "case_price": CASE_PRICES.get(sku, 0),
            "price_per_unit": CASE_PRICES.get(sku, 0) / qty if qty > 0 else 0
        })
    
    return jsonify({
        "sku_info": sku_data,
        "total_skus": len(sku_data),
        "price_range": {
            "min_case_price": min(CASE_PRICES.values()),
            "max_case_price": max(CASE_PRICES.values()),
            "avg_case_price": sum(CASE_PRICES.values()) / len(CASE_PRICES)
        }
    })


if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=False, ssl_context='adhoc')