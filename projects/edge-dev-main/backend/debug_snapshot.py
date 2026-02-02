"""
Debug Polygon snapshot endpoint
"""

import requests
from requests.adapters import HTTPAdapter

API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
SNAPSHOT_ENDPOINT = "/v2/snapshot/locale/us/markets/stocks/tickers"

print("="*80)
print("DEBUGGING POLYGON SNAPSHOT ENDPOINT")
print("="*80)

# Test with session (like the scanners do)
print("\n[Test 1] Using session with HTTPAdapter...")
session = requests.Session()
session.mount('https://', HTTPAdapter(
    pool_connections=100,
    pool_maxsize=100,
    max_retries=2,
    pool_block=False
))

url = f"{BASE_URL}{SNAPSHOT_ENDPOINT}"
print(f"URL: {url}")

params = {"apiKey": API_KEY}
print(f"Params: apiKey={API_KEY[:20]}...")

try:
    response = session.get(url, params=params, timeout=30)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Response keys: {data.keys()}")
        print(f"Status: {data.get('status')}")

        tickers = data.get('tickers', [])
        print(f"Ticker count: {len(tickers):,}")

        # Filter for common stocks
        cs_tickers = [t for t in tickers if t.get('type') == 'CS' and not t.get('ticker', '').endswith('-WK')]
        print(f"Common stocks (CS): {len(cs_tickers):,}")

        print(f"\nSample tickers:")
        for t in cs_tickers[:10]:
            print(f"  - {t.get('ticker')}: {t.get('name', 'N/A')[:50]}")
    else:
        print(f"Error response: {response.text[:500]}")

except Exception as e:
    print(f"Exception: {e}")

print("\n" + "="*80)
