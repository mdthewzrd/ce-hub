"""
Comprehensive Polygon API test to investigate intraday data availability
Testing different endpoints and approaches
"""
import pandas as pd
import requests
from datetime import datetime

API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Test tickers and dates
test_ticker = "GME"
test_dates = [
    "2025-01-15",
    "2025-02-15",
    "2025-03-15",
    "2025-04-15",
    "2025-05-15",
]

print("="*80)
print("COMPREHENSIVE POLYGON API TEST FOR INTRADAY DATA")
print("="*80)

for date_str in test_dates:
    print(f"\n{'='*80}")
    print(f"Testing {test_ticker} on {date_str}")
    print(f"{'='*80}")

    # TEST 1: 1-minute bars (unadjusted) - ORIGINAL APPROACH
    print(f"\n1️⃣  1-MINUTE BARS (UNADJUSTED)")
    url = f"{BASE_URL}/v2/aggs/ticker/{test_ticker}/range/1/minute/{date_str}/{date_str}"
    params = {
        "apiKey": API_KEY,
        "adjusted": "false",
        "sort": "asc",
        "limit": 50000
    }

    response = requests.get(url, params=params, timeout=10)
    print(f"   URL: {url}")
    print(f"   Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])
        print(f"   Results count: {len(results)}")

        if results:
            df = pd.DataFrame(results)
            df['time'] = pd.to_datetime(df['t'], unit='ms', utc=True)
            df['time_et'] = df['time'].dt.tz_convert('America/New_York')

            first_time = df['time_et'].min()
            last_time = df['time_et'].max()
            print(f"   Time range: {first_time} to {last_time}")

            # Pre-market: 4:00 AM - 9:30 AM ET
            premarket = df[(df['time_et'].dt.hour >= 4) & (df['time_et'].dt.hour < 9) |
                          ((df['time_et'].dt.hour == 9) & (df['time_et'].dt.minute < 30))]

            if not premarket.empty:
                pm_high = premarket['h'].max()
                pm_vol = premarket['v'].sum()
                print(f"   ✅ Pre-market: PM_High={pm_high:.2f}, PM_Vol={pm_vol:,}")
            else:
                print(f"   ❌ No pre-market data found")
        else:
            print(f"   ❌ No data returned")
    else:
        print(f"   ❌ Error: {response.text[:200]}")

    # TEST 2: 1-minute bars (ADJUSTED) - TRY WITH ADJUSTED
    print(f"\n2️⃣  1-MINUTE BARS (ADJUSTED)")
    url = f"{BASE_URL}/v2/aggs/ticker/{test_ticker}/range/1/minute/{date_str}/{date_str}"
    params = {
        "apiKey": API_KEY,
        "adjusted": "true",
        "sort": "asc",
        "limit": 50000
    }

    response = requests.get(url, params=params, timeout=10)
    print(f"   Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])
        print(f"   Results count: {len(results)}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")

    # TEST 3: 5-minute bars - TRY DIFFERENT TIMESPAN
    print(f"\n3️⃣  5-MINUTE BARS (UNADJUSTED)")
    url = f"{BASE_URL}/v2/aggs/ticker/{test_ticker}/range/5/minute/{date_str}/{date_str}"
    params = {
        "apiKey": API_KEY,
        "adjusted": "false",
        "sort": "asc",
        "limit": 50000
    }

    response = requests.get(url, params=params, timeout=10)
    print(f"   Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])
        print(f"   Results count: {len(results)}")

        if results:
            df = pd.DataFrame(results)
            df['time'] = pd.to_datetime(df['t'], unit='ms', utc=True)
            df['time_et'] = df['time'].dt.tz_convert('America/New_York')
            first_time = df['time_et'].min()
            last_time = df['time_et'].max()
            print(f"   Time range: {first_time} to {last_time}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")

    # TEST 4: Try multi-day range (week) to see if data exists
    print(f"\n4️⃣  MULTI-DAY RANGE (WEEK)")
    # Calculate week range
    dt = datetime.strptime(date_str, "%Y-%m-%d")
    from datetime import timedelta
    week_start = (dt - timedelta(days=dt.weekday())).strftime("%Y-%m-%d")
    week_end = (dt + timedelta(days=6)).strftime("%Y-%m-%d")

    url = f"{BASE_URL}/v2/aggs/ticker/{test_ticker}/range/1/minute/{week_start}/{week_end}"
    params = {
        "apiKey": API_KEY,
        "adjusted": "false",
        "sort": "asc",
        "limit": 50000
    }

    response = requests.get(url, params=params, timeout=10)
    print(f"   Week: {week_start} to {week_end}")
    print(f"   Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])
        print(f"   Results count: {len(results)}")

        if results:
            df = pd.DataFrame(results)
            df['time'] = pd.to_datetime(df['t'], unit='ms', utc=True)
            df['time_et'] = df['time'].dt.tz_convert('America/New_York')
            df['date'] = df['time_et'].dt.date

            # Filter for the specific date
            target_date = pd.to_datetime(date_str).date()
            date_data = df[df['date'] == target_date]

            if not date_data.empty:
                print(f"   ✅ Found {len(date_data)} bars for {date_str}")
            else:
                print(f"   ❌ No bars for {date_str}")
    else:
        print(f"   ❌ Error: {response.text[:200]}")

    # TEST 5: Try /ticks/ endpoint (trade-by-trade data)
    print(f"\n5️⃣  TICKS ENDPOINT (TRADE-BY-TRADE)")
    url = f"{BASE_URL}/v3/ticks/stocks/trades/{test_ticker}/{date_str}"
    params = {
        "apiKey": API_KEY,
        "limit": 50000,
        "sort": "asc"
    }

    response = requests.get(url, params=params, timeout=10)
    print(f"   Status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        results = data.get("results", [])
        print(f"   Results count: {len(results)}")

        if results:
            print(f"   ✅ Trade ticks available")
        else:
            print(f"   ❌ No trade data")
    else:
        print(f"   ❌ Error: {response.text[:200]}")

print("\n" + "="*80)
print("TEST COMPLETE")
print("="*80)
print("\n📊 SUMMARY: Check which tests returned data for early 2025 dates")
print("If TEST 1 works, the issue is in our formatted scanner's implementation")
print("If only TEST 4 works, we need to use week-based queries")
print("If TEST 5 works, we should use trade ticks instead of aggregates")
