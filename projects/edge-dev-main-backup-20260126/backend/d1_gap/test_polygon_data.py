"""
Test Polygon data availability for D1 Gap scanner dates
"""
import pandas as pd
import requests

API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Test a volatile stock that might have gaps
test_tickers = ['GME', 'AMC', 'RIOT', 'MARA', 'COIN', 'NVDA', 'TSLA']

# Test different dates in early 2025
test_dates = [
    "2025-01-15",
    "2025-02-15",
    "2025-03-15",
    "2025-04-15",
    "2025-05-15",
    "2025-06-15",
    "2025-07-15",
]

print("="*70)
print("TESTING POLYGON DATA AVAILABILITY")
print("="*70)

for ticker in test_tickers[:3]:  # Test first 3
    print(f"\n📊 Testing {ticker}...")

    # Test daily data
    for date_str in test_dates[:3]:  # Test first 3 dates
        # Fetch daily data around that date
        url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/2025-01-01/2025-07-31"
        params = {
            "apiKey": API_KEY,
            "adjusted": "true",
            "sort": "asc",
            "limit": 50000
        }

        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json().get("results", [])
            if data:
                df = pd.DataFrame(data)
                df['Date'] = pd.to_datetime(df['t'], unit='ms', utc=True)
                df['Date'] = df['Date'].dt.date

                # Check for this specific date
                target_date = pd.to_datetime(date_str).date()
                date_data = df[df['Date'] == target_date]

                if not date_data.empty:
                    row = date_data.iloc[0]
                    gap_pct = (row['o'] - row['c']) / row['c'] * 100 if row['c'] > 0 else 0

                    print(f"  ✅ {date_str}: Open={row['o']:.2f}, Close={row['c']:.2f}, Gap={gap_pct:.1f}%")
                else:
                    print(f"  ❌ {date_str}: No data (might be weekend/holiday)")
            else:
                print(f"  ❌ {date_str}: No data returned")
        else:
            print(f"  ❌ API Error: {response.status_code}")

    # Test pre-market data for a specific date
    print(f"\n📈 Testing PRE-MARKET data for {ticker}...")

    test_pm_dates = ["2025-03-15", "2025-05-15", "2025-07-15"]
    for date_str in test_pm_dates:
        url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/minute/{date_str}/{date_str}"
        params = {
            "apiKey": API_KEY,
            "adjusted": "false",
            "sort": "asc",
            "limit": 50000
        }

        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json().get("results", [])
            if data:
                df = pd.DataFrame(data)
                df['time'] = pd.to_datetime(df['t'], unit='ms', utc=True)
                df['time_et'] = df['time'].dt.tz_convert('America/New_York')

                # Pre-market: 04:00 to 09:30 ET
                premarket = df[(df['time_et'].dt.hour >= 4) & (df['time_et'].dt.hour < 9) |
                              ((df['time_et'].dt.hour == 9) & (df['time_et'].dt.minute < 30))]

                if not premarket.empty:
                    pm_high = premarket['h'].max()
                    pm_vol = premarket['v'].sum()
                    print(f"  ✅ {date_str}: PM_High={pm_high:.2f}, PM_Vol={pm_vol:,}")
                else:
                    print(f"  ❌ {date_str}: No pre-market data")
            else:
                print(f"  ❌ {date_str}: No intraday data")
        else:
            print(f"  ❌ {date_str}: API Error {response.status_code}")

print("\n" + "="*70)
print("TEST COMPLETE")
print("="*70)
