"""
Quick test to check PSLV in December 2025
"""

import pandas as pd
import requests
from datetime import datetime, timedelta

api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"

# Fetch December 2025 data from grouped endpoint
dates = [
    "2025-12-01", "2025-12-02", "2025-12-03", "2025-12-04", "2025-12-05",
    "2025-12-08", "2025-12-09", "2025-12-10", "2025-12-11", "2025-12-12",
    "2025-12-15", "2025-12-16", "2025-12-17", "2025-12-18", "2025-12-19",
    "2025-12-22", "2025-12-23", "2025-12-24", "2025-12-26", "2025-12-29",
    "2025-12-30"
]

all_data = []
for date in dates:
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
                'date': date
            })
        if parsed:
            all_data.append(pd.DataFrame(parsed))

df = pd.concat(all_data, ignore_index=True)

# Check PSLV in December 2025
pslv_dec = df[df['ticker'] == 'PSLV'].sort_values('date')

print(f"PSLV in December 2025 ({len(pslv_dec)} trading days):")
print(pslv_dec[['date', 'close', 'volume']])

# Check Stage 2 filters
pslv_pass_close = pslv_dec[pslv_dec['close'] >= 20.0]
pslv_pass_both = pslv_pass_close[pslv_pass_close['volume'] >= 7_000_000]

print(f"\nAfter close >= $20: {len(pslv_pass_close)} days")
print(f"After volume >= 7M: {len(pslv_pass_both)} days")

if len(pslv_pass_both) > 0:
    print("\n✓ PSLV PASSES Stage 2 filters for these dates:")
    print(pslv_pass_both[['date', 'close', 'volume']])
else:
    print("\n✗ PSLV FAILS Stage 2 filters")
