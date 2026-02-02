"""
Check if PSLV makes it through Stage 2 filters
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import pandas_market_calendars as mcal

api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

# Get trading days
us_calendar = mcal.get_calendar('NYSE')
start_date = pd.to_datetime("2025-12-01") - pd.Timedelta(days=705)
end_date = pd.to_datetime("2025-12-31")

schedule = us_calendar.schedule(start_date=start_date, end_date=end_date)
trading_days = us_calendar.valid_days(start_date=start_date, end_date=end_date)
trading_days_list = [date.strftime('%Y-%m-%d') for date in trading_days]

print(f"Fetching {len(trading_days_list)} trading days...")

# Fetch data
all_data = []
for date in trading_days_list[:10]:  # Just check first 10 days
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}"
    params = {
        "apiKey": api_key,
        "adjustment": "split",
    }
    response = requests.get(url, params=params, timeout=30)
    if response.status_code == 200:
        data = response.json().get('results', [])
        parsed = []
        for r in data:
            parsed.append({
                'ticker': r.get('T'),
                'close': r.get('c'),
                'volume': r.get('v'),
            })
        if parsed:
            df = pd.DataFrame(parsed)
            all_data.append(df)

df = pd.concat(all_data, ignore_index=True)
print(f"\nTotal rows fetched: {len(df):,}")

# Check if PSLV exists
pslv_rows = df[df['ticker'] == 'PSLV']
print(f"\nPSLV rows found: {len(pslv_rows)}")

if len(pslv_rows) > 0:
    print(f"PSLV sample data:")
    print(pslv_rows.head(10))

    # Check Stage 2 filters
    print(f"\nChecking Stage 2 filters...")

    # Create prev_close and prev_volume (simulating the shift)
    # For simplicity, just check current values

    # Filter 1: Close >= $20
    filter1 = pslv_rows[pslv_rows['close'] >= 20.0]
    print(f"  After close >= $20: {len(filter1)} rows")

    # Filter 2: Volume >= 7M
    filter2 = filter1[filter1['volume'] >= 7_000_000]
    print(f"  After volume >= 7M: {len(filter2)} rows")

    print(f"\nPSLV would pass Stage 2: {len(filter2) > 0}")

# Check other tickers that might pass
print(f"\nChecking other tickers...")
close_filter = df[df['close'] >= 20.0]
volume_filter = close_filter[close_filter['volume'] >= 7_000_000]
print(f"Tickers passing Stage 2 in first 10 days: {volume_filter['ticker'].nunique()}")
