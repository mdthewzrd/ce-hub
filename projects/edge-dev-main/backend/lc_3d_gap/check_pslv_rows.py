"""
Check how much data PSLV has going back to 2023-12-27
"""

import requests
import pandas as pd

api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

# Fetch PSLV data from 2023-12-27 onwards
url = f"https://api.polygon.io/v2/aggs/ticker/PSLV/range/1/day/2023-12-27/2025-12-31"
params = {
    "adjusted": "true",
    "apiKey": api_key
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json().get('results', [])
    if data:
        df = pd.DataFrame(data)
        df['date'] = pd.to_datetime(df['t'], unit='ms').dt.strftime('%Y-%m-%d')
        df = df[['date', 'o', 'h', 'l', 'c', 'v']]
        df = df.rename(columns={'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'})

        print(f"PSLV total rows from 2023-12-27 to 2025-12-31: {len(df)}")
        print(f"Date range: {df['date'].min()} to {df['date'].max()}")

        # Check if it has at least 93 rows
        if len(df) >= 93:
            print(f"✓ PSLV has enough data for LC 3D Gap (need >= 93, have {len(df)})")

            # Show first few rows to see when data starts
            print(f"\nFirst 5 rows:")
            print(df.head(5))

            # Show last few rows
            print(f"\nLast 5 rows:")
            print(df.tail(5))
        else:
            print(f"✗ PSLV doesn't have enough data (need >= 93, have {len(df)})")
            print(f"Minimum data requirement: 93 rows (65 for swing high + 28 for day -14 EMA)")
    else:
        print("No data found")
else:
    print(f"Error: {response.status_code}")
