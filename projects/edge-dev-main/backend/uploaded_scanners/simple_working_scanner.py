"""
Simple Working Scanner for Scan EZ
Demonstrates the expected pattern for returning results
"""

import pandas as pd
import requests

# Use the injected API_KEY and BASE_URL from the execution environment
# API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
# BASE_URL = 'https://api.polygon.io'

# Test universe of popular stocks
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']

def fetch_data(ticker, start_date, end_date):
    """Fetch daily bars"""
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
    params = {'apiKey': API_KEY, 'adjusted': 'true'}

    try:
        response = requests.get(url, params=params, timeout=10)
        if response.status_code == 200:
            data = response.json().get('results', [])
            if data:
                df = pd.DataFrame(data)
                df['Date'] = pd.to_datetime(df['t'], unit='ms')
                return df
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
    return None

def scan(start_date, end_date):
    """
    Main scan function - finds gap patterns

    This is the function that will be called by the execution system.
    Returns a list of result dictionaries.
    """
    print(f"🔍 Scanning from {start_date} to {end_date}")

    results = []

    for ticker in SYMBOLS:
        df = fetch_data(ticker, start_date, end_date)

        if df is not None and len(df) > 1:
            df = df.sort_values('Date')
            df['prev_close'] = df['c'].shift(1)
            df['gap_pct'] = ((df['o'] - df['prev_close']) / df['prev_close']) * 100

            # Find gap ups > 2%
            signals = df[df['gap_pct'] > 2.0]

            for _, row in signals.iterrows():
                results.append({
                    'ticker': ticker,
                    'date': row['Date'].strftime('%Y-%m-%d'),
                    'gap': round(row['gap_pct'] / 100, 4),
                    'open': round(row['o'], 2),
                    'close': round(row['c'], 2),
                    'volume': int(row['v']),
                    'pm_vol': int(row['v'] * 0.8),
                    'score': round(row['gap_pct'], 1)
                })

    print(f"✅ Found {len(results)} signals")
    return results

# Main execution
if __name__ == "__main__":
    # This will be set by the execution environment
    # START_DATE and END_DATE are injected
    results = scan(START_DATE, END_DATE)
