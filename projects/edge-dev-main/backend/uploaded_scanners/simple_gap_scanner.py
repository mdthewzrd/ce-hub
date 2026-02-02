"""
Simple Gap Scanner - Standalone Script
Tests the scan_ez upload and run functionality
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta

# Configuration
API_KEY = 'Fm7brz4s23eSocDErnL68cE7wspz2K1I'
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
        df['ticker'] = ticker
        return df
    except Exception as e:
        print(f"Error fetching {ticker}: {e}")
        return None

def scan_gaps(df, gap_threshold=0.03):
    """Find stocks with gap up > threshold"""
    if df is None or len(df) < 2:
        return []

    df = df.sort_values('Date').copy()
    df['prev_close'] = df['c'].shift(1)
    df['gap_pct'] = (df['o'] - df['prev_close']) / df['prev_close']

    # Filter for significant gaps
    signals = df[df['gap_pct'] > gap_threshold].copy()

    results = []
    for _, row in signals.iterrows():
        results.append({
            'ticker': row['ticker'],
            'date': row['Date'].strftime('%Y-%m-%d'),
            'gap': round(row['gap_pct'], 4),
            'open': round(row['o'], 2),
            'prev_close': round(row['prev_close'], 2),
            'volume': row['v']
        })

    return results

def main(start_date, end_date):
    """Main scan function"""
    print(f"🔍 Scanning from {start_date} to {end_date}")

    all_results = []

    for ticker in SYMBOLS:
        print(f"   Scanning {ticker}...")
        df = fetch_daily_data(ticker, start_date, end_date)

        if df is not None:
            results = scan_gaps(df, gap_threshold=0.02)
            all_results.extend(results)

    print(f"✅ Found {len(all_results)} gap signals")
    return all_results

if __name__ == "__main__":
    # Default to last 30 days
    end_date = datetime.now()
    start_date = end_date - timedelta(days=30)

    results = main(
        start_date.strftime('%Y-%m-%d'),
        end_date.strftime('%Y-%m-%d')
    )

    print(f"\n📊 Results: {len(results)} signals found")
    for r in results[:5]:  # Show first 5
        print(f"   {r['ticker']}: {r['date']} - {r['gap']*100:.1f}% gap")
