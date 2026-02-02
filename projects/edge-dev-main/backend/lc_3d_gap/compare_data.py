"""
Compare grouped endpoint vs individual ticker endpoint for PSLV
"""

import requests
import pandas as pd
from datetime import datetime, timedelta

api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

# Fetch PSLV data for 2025-12-24 (Day -1) using individual endpoint
date = "2025-12-24"
url = f"https://api.polygon.io/v2/aggs/ticker/PSLV/range/1/day/2025-12-01/2025-12-31"
params = {
    "adjusted": "true",
    "apiKey": api_key
}

response = requests.get(url, params=params)
if response.status_code == 200:
    data = response.json().get('results', [])
    if data:
        df_individual = pd.DataFrame(data)
        df_individual['date'] = pd.to_datetime(df_individual['t'], unit='ms').dt.strftime('%Y-%m-%d')
        df_individual = df_individual[['date', 'o', 'h', 'l', 'c', 'v']]
        df_individual = df_individual.rename(columns={'o': 'open', 'h': 'high', 'l': 'low', 'c': 'close', 'v': 'volume'})

        print("PSLV Individual Endpoint Data (2025-12-01 to 2025-12-31):")
        print(df_individual.tail(10))
        print(f"\nPSLV close on 2025-12-24: ${df_individual[df_individual['date'] == '2025-12-24']['close'].values[0]:.2f}")
    else:
        print("No data from individual endpoint")
else:
    print(f"Error: {response.status_code}")

# Fetch PSLV data for 2025-12-24 using grouped endpoint
url_grouped = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/2025-12-24"
params_grouped = {
    "apiKey": api_key,
    "adjustment": "split",
}

response_grouped = requests.get(url_grouped, params=params_grouped)
if response_grouped.status_code == 200:
    data = response_grouped.json().get('results', [])
    pslv_row = next((r for r in data if r.get('T') == 'PSLV'), None)
    if pslv_row:
        print(f"\nPSLV Grouped Endpoint Data (2025-12-24):")
        print(f"  Open: ${pslv_row.get('o'):.2f}")
        print(f"  High: ${pslv_row.get('h'):.2f}")
        print(f"  Low: ${pslv_row.get('l'):.2f}")
        print(f"  Close: ${pslv_row.get('c'):.2f}")
        print(f"  Volume: {pslv_row.get('v'):,.0f}")
    else:
        print("\nPSLV not found in grouped endpoint for 2025-12-24")
else:
    print(f"Error: {response_grouped.status_code}")

print("\n💡 NOTE: If prices differ significantly, there may be a data issue or")
print("   the grouped endpoint uses different adjustment than individual endpoints.")
