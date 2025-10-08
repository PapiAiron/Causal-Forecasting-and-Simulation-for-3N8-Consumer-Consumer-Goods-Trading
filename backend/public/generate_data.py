import pandas as pd
import numpy as np
from datetime import timedelta

# --- 1. Define Constants and Outlet Groups ---

# Extracted unique outlet names from your data
OUTLET_NAMES = [
    'JPC', 'J&E', 'SDO', 'GG CRUZ', 'WILGO MART', 'WILGO JOE', 'BAQALA',
    'MELZON', 'BC STORE', '108 DAILY MART', 'RO8', 'ENS', 'PUDOL',
    "TOG'S PLACE", 'HENRY AND HOLLAND', 'RDD PARES', 'TOP GRACE',
    'NINETY NINE', 'SUPRICE', 'LUCY VALDECANTOS', 'ESPERANZA', 'DJ STORE',
    'MANAY', 'ANGELAS', 'REYGET', 'MAYETH', 'ROMEL & MELODY', 'ROWENA CRUZ',
    'PCJW', 'ALPHA', 'GREAT VALLEY', 'MARIA EUREKA', 'AEM AGAP', 'EHP',
    'ROSALINA CONDE', 'ALEX SARI SARI', 'BIBOT STORE', 'ANMACOR',
    'SL GUARDIA', 'ANNICA', 'CONSOLE', 'DING & BETTY', 'ZAYDELYN',
    'JONA STORE', 'M ANTE STORE', 'JAPS AND JONA', 'GVJ', 'LUCENA',
    "EL RAP'S", 'ANICA & MAICA', 'THOR THONGS', 'SANTA MARIA INT',
    'BRIELLA STORE', 'M ANTE', 'RONA', 'PEDRIGAL', 'JTJ', 'GPRK', 'BEVERAGE'
]

# Estimated Unit Price (Value / SKU for JPC: 159,600 / 840 = 190)
UNIT_PRICE = 190.0

# Define time range for 2 years
START_DATE = pd.to_datetime('2025-09-01')
END_DATE = START_DATE + timedelta(days=730)  # Two full years (Sept 2025 - Aug 2027)
DATE_RANGE = pd.date_range(START_DATE, END_DATE, freq='D')

# Categorize outlets to simulate different sales volumes
HIGH_VOLUME_OUTLETS = ['JPC', 'J&E', 'SDO', 'GG CRUZ', 'PCJW', 'JAPS AND JONA']
MEDIUM_VOLUME_OUTLETS = [o for o in OUTLET_NAMES if 'STORE' in o or 'MART' in o or 'VALDECANTOS' in o or 'CRUZ' in o]
LOW_VOLUME_OUTLETS = [o for o in OUTLET_NAMES if o not in HIGH_VOLUME_OUTLETS and o not in MEDIUM_VOLUME_OUTLETS]

# --- 2. Data Generation Function ---

def generate_outlet_data(outlet_name, date_range):
    data = []

    if outlet_name in HIGH_VOLUME_OUTLETS:
        # High volume: High frequency, large SKUs (multiples of ~168)
        sku_options = [168, 336, 504, 672, 840, 1176, 1344, 1680, 2016, 2352]
        prob_sale = 0.6  # 60% chance of a sale on a given day
        placeholders_per_month = 5 # Add extra zero/blank lines

    elif outlet_name in MEDIUM_VOLUME_OUTLETS:
        # Medium volume: Moderate frequency, moderate SKUs (10 to 100)
        sku_options = [10, 20, 30, 40, 50, 70, 100]
        prob_sale = 0.4
        placeholders_per_month = 8

    else:
        # Low volume: Lower frequency, small SKUs (1 to 15)
        sku_options = [1, 2, 3, 4, 5, 10, 15]
        prob_sale = 0.2
        placeholders_per_month = 12

    for date in date_range:
        # Generate sale data for the day
        if np.random.rand() < prob_sale:
            sku = np.random.choice(sku_options)
            value = sku * UNIT_PRICE
            data.append({
                'Date': date.strftime('%#m/%#d/%Y'),
                'OUTLET': outlet_name,
                'SKU': f'{sku}',
                'Value': f'{value:,.2f}'
            })
        else:
            # Simulate a non-sale day with an entry like '9/2/2025,WILGO MART,,0'
            data.append({
                'Date': date.strftime('%#m/%#d/%Y'),
                'OUTLET': outlet_name,
                'SKU': '',
                'Value': '0'
            })

    # Add extra placeholder rows at the end to match your original structure
    for _ in range(placeholders_per_month * 24): # 2 years * placeholders per month
         data.append({'Date': '', 'OUTLET': outlet_name, 'SKU': '', 'Value': '0'})

    return pd.DataFrame(data)

# --- 3. Generate and Format Final Dataset ---

all_data = []
for outlet in OUTLET_NAMES:
    df_outlet = generate_outlet_data(outlet, DATE_RANGE)
    all_data.append(df_outlet)

df_final = pd.concat(all_data, ignore_index=True)

# Post-processing formatting
def format_sku(sku):
    # Ensures empty SKU cells for zero value entries
    return '' if pd.isna(sku) or float(sku) == 0 else str(int(float(sku)))

def format_value(value_str):
    try:
        # Remove commas, convert to float
        value = float(value_str.replace(',', ''))
        if value == 0.0:
            return '0'
        # Format with commas and two decimal places
        return f'{value:,.2f}'
    except ValueError:
        return value_str

df_final['SKU'] = df_final['SKU'].replace('', 0).astype(float).round(0).apply(format_sku)
df_final['Value'] = df_final['Value'].apply(format_value)
df_final['Date'] = df_final['Date'].str.replace('/2025', '/25', regex=False) # Example of minor date adjustment

# Calculate the Total Row
total_sku = df_final['SKU'].replace('', 0).astype(float).sum()
total_value = df_final['Value'].replace('', '0').apply(lambda x: float(x.replace(',', '').replace('.00', ''))).sum()

total_row = pd.DataFrame([{
    'Date': '',
    'OUTLET': 'TOTAL PHYS',
    'SKU': f'{total_sku:,.0f}',
    'Value': f'{total_value:,.2f}'
}])

# Add initial header lines from your sample
initial_rows = pd.DataFrame([
    {'Date': 'Date', 'OUTLET': 'OUTLET', 'SKU': 'SKU', 'Value': 'Value'},
    {'Date': '', 'OUTLET': 'OUTLET', 'SKU': 'MD290', 'Value': ''}
])

# Combine all parts
df_output = pd.concat([initial_rows, df_final, total_row], ignore_index=True)

# Final step: Save to CSV
# The output file will be named 'dummy_sales_data_2_years.csv' in the same directory as the script.
df_output.to_csv('dummy_sales_data_2_years.csv', index=False, header=False)

print("✅ Dummy data generation complete!")
print("File saved as 'dummy_sales_data_2_years.csv'.")
print(f"Total rows generated (including headers/totals): {len(df_output):,}")