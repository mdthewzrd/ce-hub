"""
Working Test Scanner for Scan EZ
Prints results in the format expected by the parser
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta

# Configuration
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'  # Working key from the system
BASE_URL = 'https://api.polygon.io'

# Test universe of popular stocks
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META', 'AMD', 'NFLX', 'INTC']

def fetch_daily_data(ticker, start_date, end_date):
    """Fetch daily bars from Polygon.io"""
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
    params = {'apiKey': API_KEY, 'adjusted': 'true', 'sort': 'asc'}

    try:
        response = requests.get(url, params=params, timeout=10)
        response.raise_for_status()
        data = response.json().get('results', [])

        if not data:
            return None

        df = pd.DataFrame(data)
        df['Date'] = pd.to_datetime(df['t'], unit='ms')
        df.set_index('Date', inplace=True)
        return df
    except Exception as e:
        return None

def scan_and_print_results(start_date, end_date):
    """Scan and print results in the expected format"""
    print(f"🔍 Scanning from {start_date} to {end_date}")

    # Print header in the expected format
    print("=" * 80)
    print(f"{'Ticker':<8} {'Date':<12} {'Gap %':<10} {'Open':<10} {'Volume':<15}")
    print("=" * 80)

    found_any = False

    for ticker in SYMBOLS:
        df = fetch_daily_data(ticker, start_date, end_date)

        if df is not None and len(df) > 1:
            df = df.sort_index()
            df['prev_close'] = df['c'].shift(1)
            df['gap_pct'] = ((df['o'] - df['prev_close']) / df['prev_close']) * 100

            # Filter for gap ups > 1%
            signals = df[df['gap_pct'] > 1.0]

            for date, row in signals.iterrows():
                found_any = True
                date_str = date.strftime('%Y-%m-%d')
                gap_val = round(row['gap_pct'], 2)
                open_val = round(row['o'], 2)
                vol_val = int(row['v'])

                print(f"{ticker:<8} {date_str:<12} {gap_val:<10.2f} {open_val:<10.2f} {vol_val:<15,}")

    print("=" * 80)

    if not found_any:
        print("No gap signals found in the specified date range")

    return []

if __name__ == "__main__":
    # Default to last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    scan_and_print_results(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )
