"""
Simple Scanner Template for Scan EZ
Use this as a starting point for your scanners
"""

import pandas as pd
import requests

# Test universe - add your symbols here
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']

def scan(start_date, end_date):
    """
    Main scan function

    Args:
        start_date: Start date (YYYY-MM-DD) - injected by system
        end_date: End date (YYYY-MM-DD) - injected by system

    Returns:
        List of result dictionaries with keys: ticker, date, gap, etc.
    """
    print(f"🔍 Scanning from {start_date} to {end_date}")

    # API_KEY and BASE_URL are injected by the system
    url = f"{BASE_URL}/v2/aggs/ticker/{{ticker}}/range/1/day/{start_date}/{end_date}"
    params = {'apiKey': API_KEY, 'adjusted': 'true'}

    results = []

    for ticker in SYMBOLS:
        try:
            response = requests.get(url.replace('{ticker}', ticker), params=params, timeout=10)
            if response.status_code == 200:
                data = response.json().get('results', [])
                if data:
                    df = pd.DataFrame(data)
                    df['Date'] = pd.to_datetime(df['t'], unit='ms')

                    # Calculate your indicators here
                    df['prev_close'] = df['c'].shift(1)
                    df['gap_pct'] = ((df['o'] - df['prev_close']) / df['prev_close']) * 100

                    # Find your signals here
                    signals = df[df['gap_pct'] > 2.0]  # Gap > 2%

                    for _, row in signals.iterrows():
                        results.append({
                            'ticker': ticker,
                            'date': row['Date'].strftime('%Y-%m-%d'),
                            'gap': round(row['gap_pct'] / 100, 4),  # As decimal
                            'open': round(row['o'], 2),
                            'close': round(row['c'], 2),
                            'volume': int(row['v']),
                            'score': round(row['gap_pct'], 1)
                        })
        except Exception as e:
            print(f"Error scanning {ticker}: {e}")

    print(f"✅ Found {len(results)} signals")
    return results

# Main execution
if __name__ == "__main__":
    # START_DATE and END_DATE are injected by the system
    results = scan(START_DATE, END_DATE)
