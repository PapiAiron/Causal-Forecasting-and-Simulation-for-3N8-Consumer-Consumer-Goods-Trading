import pandas as pd
import numpy as np

# Date range from Jan 1, 2024 to today
date_range = pd.date_range(start="2024-01-01", end=pd.Timestamp.today(), freq="D")

# Dummy dataset generation
np.random.seed(42)
outlet = "JPC"

# Random SKUs (multiples of 168)
sku_values = [0, 168, 336, 504, 672, 840, 1176, 1344, 1680, 2016, 2352]

# Price per SKU unit (based on ratio from sample: 190 per SKU unit)
price_per_unit = 190

data = []
for d in date_range:
    sku = np.random.choice(sku_values, p=[0.3,0.05,0.05,0.05,0.05,0.1,0.1,0.1,0.1,0.05,0.05])
    value = sku * price_per_unit if sku > 0 else 0
    data.append([d.strftime("%-m/%-d/%y"), outlet, sku if sku > 0 else "", f"{value:,.2f}" if value > 0 else 0])

# Create DataFrame
df = pd.DataFrame(data, columns=["Date", "OUTLET", "SKU", "Value"])

import caas_jupyter_tools
caas_jupyter_tools.display_dataframe_to_user("Dummy Sales Dataset (2024–Present)", df)
