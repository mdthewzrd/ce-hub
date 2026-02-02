"""
Working Test Scanner - Sets Global Results Variable
"""

import asyncio
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta

# Required date variables
START_DATE = "2024-01-01"
END_DATE = "2024-12-31"

# Configuration
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = 'https://api.polygon.io'
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA', 'META']

# Global results variable
results = []

async def fetch_daily_data(ticker, start_date, end_date):
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

async def main():
    """Main async function - populates global results"""
    global results

    print(f"🔍 Scanning from {START_DATE} to {END_DATE}")

    for ticker in SYMBOLS:
        df = await fetch_daily_data(ticker, START_DATE, END_DATE)

        if df is not None and len(df) > 1:
            df = df.sort_index()
            df['prev_close'] = df['c'].shift(1)
            df['gap_pct'] = ((df['o'] - df['prev_close']) / df['prev_close']) * 100

            signals = df[df['gap_pct'] > 1.0]

            for date, row in signals.iterrows():
                results.append({
                    'ticker': ticker,
                    'date': date.strftime('%Y-%m-%d'),
                    'gap': round(row['gap_pct'] / 100, 4),
                    'open': round(row['o'], 2),
                    'close': round(row['c'], 2),
                    'volume': int(row['v']),
                    'pm_vol': int(row['v']),
                    'score': round(row['gap_pct'], 1)
                })

    print(f"✅ Found {len(results)} signals")

if __name__ == "__main__":
    asyncio.run(main())
