"""
Working Test Scanner for Scan EZ
Properly formatted with required variables
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta

# Required date variables for LC D2 execution
START_DATE = "2024-01-01"
END_DATE = "2024-12-31"

# Configuration
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = 'https://api.polygon.io'

# Test universe
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']

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

def scan_gaps(start_date, end_date):
    """Scan for gap patterns"""
    print(f"🔍 Scanning from {start_date} to {end_date}")

    results = []

    for ticker in SYMBOLS:
        df = fetch_daily_data(ticker, start_date, end_date)

        if df is not None and len(df) > 1:
            df = df.sort_index()
            df['prev_close'] = df['c'].shift(1)
            df['gap_pct'] = ((df['o'] - df['prev_close']) / df['prev_close']) * 100

            # Find gaps > 2%
            signals = df[df['gap_pct'] > 2.0]

            for date, row in signals.iterrows():
                results.append({
                    'ticker': ticker,
                    'date': date.strftime('%Y-%m-%d'),
                    'gap': round(row['gap_pct'] / 100, 4),  # Convert to decimal
                    'open': round(row['o'], 2),
                    'close': round(row['c'], 2),
                    'volume': int(row['v']),
                    'pm_vol': int(row['v'] * 0.8),  # Estimate pre-market volume
                    'score': round(row['gap_pct'], 1)
                })

    return results

# Main execution
if __name__ == "__main__":
    results = scan_gaps(START_DATE, END_DATE)
    print(f"✅ Found {len(results)} signals")
