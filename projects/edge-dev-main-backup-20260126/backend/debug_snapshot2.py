"""
Debug Polygon snapshot endpoint - check ticker fields
"""

import requests
from requests.adapters import HTTPAdapter

API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
SNAPSHOT_ENDPOINT = "/v2/snapshot/locale/us/markets/stocks/tickers"

print("="*80)
print("DEBUGGING POLYGON SNAPSHOT - TICKER FIELDS")
print("="*80)

session = requests.Session()
session.mount('https://', HTTPAdapter(pool_connections=100, pool_maxsize=100))

url = f"{BASE_URL}{SNAPSHOT_ENDPOINT}"
params = {"apiKey": API_KEY}

response = session.get(url, params=params, timeout=30)

if response.status_code == 200:
    data = response.json()
    tickers = data.get('tickers', [])

    print(f"\nTotal tickers: {len(tickers):,}")
    print(f"\nFirst 5 tickers with all fields:")

    for i, t in enumerate(tickers[:5]):
        print(f"\n--- Ticker {i+1} ---")
        print(f"Ticker: {t.get('ticker')}")
        print(f"Name: {t.get('name')}")
        print(f"Type: {t.get('type')}")
        print(f"Market: {t.get('market')}")
        print(f"Locale: {t.get('locale')}")
        print(f"Currency: {t.get('currency_name')}")
        print(f"Active: {t.get('active')}")
        print(f"All keys: {list(t.keys())}")

    # Check type distribution
    print(f"\n--- Type Distribution ---")
    type_counts = {}
    for t in tickers:
        t_type = t.get('type', 'unknown')
        type_counts[t_type] = type_counts.get(t_type, 0) + 1

    for t_type, count in sorted(type_counts.items(), key=lambda x: x[1], reverse=True):
        print(f"  {t_type}: {count:,}")

    # Check what LC 3D Gap does
    print(f"\n--- LC 3D Gap Filtering ---")
    valid_tickers = []
    for ticker in tickers:
        ticker_symbol = ticker.get('ticker')
        if ticker_symbol and len(ticker_symbol) <= 10:
            valid_tickers.append(ticker_symbol)

    print(f"Filtered by len(ticker) <= 10: {len(valid_tickers):,}")
    print(f"Sample: {valid_tickers[:10]}")

print("="*80)
