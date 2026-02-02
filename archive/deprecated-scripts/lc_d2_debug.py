"""
LC D2 Scanner - DEBUG Version
============================

This version will show us exactly what's causing the NaN issues
and help identify missing calculations.
"""

import pandas as pd
import aiohttp
import asyncio
import numpy as np
import pandas_market_calendars as mcal
from datetime import datetime, timedelta

# Configuration
nyse = mcal.get_calendar('NYSE')
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

async def fetch_debug_data(session, date, adj):
    """Fetch data for debugging"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"

    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data and data['results']:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    return df
            return pd.DataFrame()
    except Exception as e:
        print(f"Error fetching {date}: {e}")
        return pd.DataFrame()

def debug_indicators(df):
    """Calculate indicators with debugging info"""
    print(f"Starting with {len(df)} records")

    # Sort by ticker and date
    df = df.sort_values(by=['ticker', 'date'])

    # Basic calculations first
    df['pdc'] = df.groupby('ticker')['c'].shift(1)
    print(f"After pdc calculation: {df['pdc'].isna().sum()} NaN values in pdc")

    # ATR calculation
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = (df['h'] - df['pdc']).abs()
    df['low_pdc'] = (df['l'] - df['pdc']).abs()
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(window=14).mean())
    df['atr'] = df.groupby('ticker')['atr'].shift(1)
    print(f"After ATR calculation: {df['atr'].isna().sum()} NaN values in atr")

    # Basic shifts
    df['h1'] = df.groupby('ticker')['h'].shift(1)
    df['c1'] = df.groupby('ticker')['c'].shift(1)
    df['o1'] = df.groupby('ticker')['o'].shift(1)
    df['l1'] = df.groupby('ticker')['l'].shift(1)

    # EMAs
    df['ema9'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=9, adjust=False).mean())
    df['ema20'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=20, adjust=False).mean())
    df['ema50'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=50, adjust=False).mean())
    print(f"After EMA calculation: ema9 NaN: {df['ema9'].isna().sum()}, ema20 NaN: {df['ema20'].isna().sum()}, ema50 NaN: {df['ema50'].isna().sum()}")

    # High percentage change
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1
    print(f"After high_pct_chg calculation: {df['high_pct_chg'].isna().sum()} NaN values")

    # High change ATR
    df['high_chg'] = df['h'] - df['o']
    df['high_chg_atr'] = df['high_chg'] / df['atr']
    print(f"After high_chg_atr calculation: {df['high_chg_atr'].isna().sum()} NaN values")

    # Dollar volume
    df['dol_v'] = df['c'] * df['v']

    # Check required columns
    required_cols = ['atr', 'c1', 'h1', 'ema9', 'ema20', 'ema50']
    print(f"\nChecking required columns for NaN values:")
    for col in required_cols:
        if col in df.columns:
            nan_count = df[col].isna().sum()
            print(f"  {col}: {nan_count} NaN values ({nan_count/len(df)*100:.1f}%)")
        else:
            print(f"  {col}: MISSING COLUMN")

    # Remove NaN from required columns
    before_dropna = len(df)
    df_clean = df.dropna(subset=required_cols)
    after_dropna = len(df_clean)
    print(f"\nRows before dropna: {before_dropna}")
    print(f"Rows after dropna: {after_dropna}")
    print(f"Rows dropped: {before_dropna - after_dropna}")

    if after_dropna > 0:
        print(f"Data looks good! Testing simple pattern on {after_dropna} clean rows...")

        # Test a simple pattern that should find some results
        simple_pattern = (
            (df_clean['high_pct_chg'] >= 0.1) &  # 10%+ high move
            (df_clean['c'] >= df_clean['o']) &   # Green day
            (df_clean['v'] >= 1_000_000) &       # 1M+ volume
            (df_clean['c'] >= 5)                 # $5+ price
        )

        simple_matches = simple_pattern.sum()
        print(f"Simple pattern matches: {simple_matches}")

        if simple_matches > 0:
            sample_results = df_clean[simple_pattern].head(5)
            print("\nSample results:")
            print(sample_results[['date', 'ticker', 'c', 'h', 'o', 'v', 'high_pct_chg']].to_string())

    return df_clean

async def run_debug():
    """Run debug scan"""

    # Test with just 2 recent days to start small
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=5)

    trading_days = nyse.valid_days(start_date=start_date, end_date=end_date)
    test_dates = [date.strftime('%Y-%m-%d') for date in trading_days[-2:]]  # Just 2 days

    print(f"🐛 DEBUG: Testing with dates: {test_dates}")

    # Fetch only adjusted data for simplicity
    all_data = []

    async with aiohttp.ClientSession() as session:
        print("Fetching adjusted data...")
        tasks = [fetch_debug_data(session, date, "true") for date in test_dates]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, pd.DataFrame) and not result.empty:
                all_data.append(result)

    if not all_data:
        print("❌ No data fetched")
        return

    df = pd.concat(all_data, ignore_index=True)
    print(f"✅ Fetched {len(df)} total records")

    # Debug the indicator calculations
    debug_indicators(df)

def main():
    print("🐛 LC D2 Scanner - DEBUG MODE")
    print("="*40)

    try:
        asyncio.run(run_debug())
    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()