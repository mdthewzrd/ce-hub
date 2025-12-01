#!/usr/bin/env python3
"""
LC Frontside D3 Extended 1 Scanner - Manually Split
Sophisticated 3-day pattern recognition for late-close continuation plays
"""
import pandas as pd
import requests
import numpy as np
import aiohttp
import asyncio
from datetime import datetime, timedelta
import warnings
warnings.filterwarnings("ignore")

# Configuration
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"
DATE = datetime.today().strftime('%Y-%m-%d')

def calculate_indicators(df):
    """Calculate all technical indicators needed for LC D3 Extended 1 pattern"""
    # Sort by ticker and date
    df = df.sort_values(['ticker', 'date'])

    # Basic price calculations
    df['pdc'] = df.groupby('ticker')['c'].shift(1)
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = (df['h'] - df['pdc']).abs()
    df['low_pdc'] = (df['l'] - df['pdc']).abs()
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(14).mean())

    # Shift values for multi-day analysis
    for i in range(1, 4):
        df[f'h{i}'] = df.groupby('ticker')['h'].shift(i)
        df[f'l{i}'] = df.groupby('ticker')['l'].shift(i)
        df[f'c{i}'] = df.groupby('ticker')['c'].shift(i)
        df[f'o{i}'] = df.groupby('ticker')['o'].shift(i)
        df[f'v{i}'] = df.groupby('ticker')['v'].shift(i)

    # High percentage change calculations
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1
    df['high_pct_chg1'] = df.groupby('ticker')['high_pct_chg'].shift(1)

    # ATR normalized metrics
    df['high_chg_atr'] = (df['h'] - df['o']) / df['atr']
    df['high_chg_atr1'] = ((df['h1'] - df['o1']) / df['atr']).shift(1)
    df['gap_atr1'] = ((df['o1'] - df['c2']) / df['atr']).shift(1)

    # EMAs
    for period in [9, 20, 50]:
        df[f'ema{period}'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=period).mean())
        df[f'dist_h_{period}ema'] = df['h'] - df[f'ema{period}']
        df[f'dist_h_{period}ema_atr'] = df[f'dist_h_{period}ema'] / df['atr']
        df[f'dist_h_{period}ema_atr1'] = df.groupby('ticker')[f'dist_h_{period}ema_atr'].shift(1)

    # Volume and dollar volume
    df['dol_v'] = df['c'] * df['v']
    df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)
    df['v_ua'] = df['v']  # Unadjusted volume
    df['v_ua1'] = df.groupby('ticker')['v_ua'].shift(1)
    df['c_ua'] = df['c']  # Unadjusted close

    # Rolling highs and distance calculations
    df['lowest_low_20'] = df.groupby('ticker')['l'].transform(lambda x: x.rolling(20).min())
    df['h_dist_to_lowest_low_20_pct'] = (df['h'] / df['lowest_low_20']) - 1
    df['highest_high_20'] = df.groupby('ticker')['h'].transform(lambda x: x.rolling(20).max())
    df['h_dist_to_highest_high_20_2_atr'] = (df['h'] - df.groupby('ticker')['highest_high_20'].shift(2)) / df['atr']

    return df

def lc_frontside_d3_extended_1_scan(df):
    """
    LC Frontside D3 Extended 1 Pattern Logic
    Sophisticated 3-day ascending high pattern with momentum and trend confirmation
    """

    # Calculate all indicators
    df = calculate_indicators(df)

    # LC Frontside D3 Extended 1 Pattern
    pattern = (
        # 3-day ascending highs and lows
        (df['h'] >= df['h1']) &
        (df['h1'] >= df['h2']) &
        (df['l'] >= df['l1']) &
        (df['l1'] >= df['l2']) &

        # Price tier-based high percentage change requirements
        (
            ((df['high_pct_chg1'] >= 0.3) & (df['high_pct_chg'] >= 0.3) & (df['c_ua'] >= 5) & (df['c_ua'] < 15) & (df['h_dist_to_lowest_low_20_pct'] >= 2.5)) |
            ((df['high_pct_chg1'] >= 0.2) & (df['high_pct_chg'] >= 0.2) & (df['c_ua'] >= 15) & (df['c_ua'] < 25) & (df['h_dist_to_lowest_low_20_pct'] >= 2)) |
            ((df['high_pct_chg1'] >= 0.1) & (df['high_pct_chg'] >= 0.1) & (df['c_ua'] >= 25) & (df['c_ua'] < 50) & (df['h_dist_to_lowest_low_20_pct'] >= 1.5)) |
            ((df['high_pct_chg1'] >= 0.07) & (df['high_pct_chg'] >= 0.07) & (df['c_ua'] >= 50) & (df['c_ua'] < 90) & (df['h_dist_to_lowest_low_20_pct'] >= 1)) |
            ((df['high_pct_chg1'] >= 0.05) & (df['high_pct_chg'] >= 0.05) & (df['c_ua'] >= 90) & (df['h_dist_to_lowest_low_20_pct'] >= 0.75))
        ) &

        # Yesterday's momentum and positioning
        (df['high_chg_atr1'] >= 0.7) &
        (df['c1'] >= df['o1']) &
        (df['dist_h_9ema_atr1'] >= 1.5) &
        (df['dist_h_20ema_atr1'] >= 2) &

        # Today's momentum and positioning
        (df['high_chg_atr'] >= 1) &
        (df['c'] >= df['o']) &
        (df['dist_h_9ema_atr'] >= 1.5) &
        (df['dist_h_20ema_atr'] >= 2) &

        # Volume and liquidity filters
        (df['v_ua'] >= 10000000) &
        (df['dol_v'] >= 500000000) &
        (df['v_ua1'] >= 10000000) &
        (df['dol_v1'] >= 100000000) &
        (df['c_ua'] >= 5) &

        # Momentum continuation filter
        ((df['high_chg_atr'] >= 1) | (df['high_chg_atr1'] >= 1)) &

        # Distance from 20-day high filter
        (df['h_dist_to_highest_high_20_2_atr'] >= 2.5) &

        # New high and trend alignment
        (df['h'] >= df['highest_high_20']) &
        (df['ema9'] >= df['ema20']) &
        (df['ema20'] >= df['ema50'])
    )

    # Filter for matching patterns
    results = df[pattern].copy()

    if len(results) > 0:
        results['scanner_type'] = 'LC_Frontside_D3_Extended_1'
        results['signal_strength'] = 'High'
        results['pattern_description'] = '3-day ascending momentum with new highs'

        # Add key metrics for analysis
        results['momentum_score'] = (results['high_chg_atr'] + results['high_chg_atr1']) / 2
        results['trend_alignment'] = ((results['ema9'] >= results['ema20']) &
                                    (results['ema20'] >= results['ema50'])).astype(int)

        return results[['date', 'ticker', 'c', 'h', 'l', 'o', 'v',
                       'scanner_type', 'signal_strength', 'pattern_description',
                       'momentum_score', 'trend_alignment', 'high_chg_atr',
                       'high_pct_chg', 'dist_h_9ema_atr', 'dol_v']]
    else:
        # Return empty DataFrame with the expected columns
        return pd.DataFrame(columns=['date', 'ticker', 'c', 'h', 'l', 'o', 'v',
                                   'scanner_type', 'signal_strength', 'pattern_description',
                                   'momentum_score', 'trend_alignment', 'high_chg_atr',
                                   'high_pct_chg', 'dist_h_9ema_atr', 'dol_v'])

async def fetch_daily_data(session, date):
    """Fetch daily stock data from Polygon API"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}"
    params = {'adjusted': 'true', 'apiKey': API_KEY}

    try:
        async with session.get(url, params=params) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(date)
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    return df
    except Exception as e:
        print(f"Error fetching data for {date}: {e}")

    return pd.DataFrame()

async def run_scanner():
    """Main scanner execution function"""
    print("🚀 Starting LC Frontside D3 Extended 1 Scanner...")
    print(f"📅 Scanning date: {DATE}")

    # Calculate date range (need historical data for patterns)
    end_date = datetime.strptime(DATE, '%Y-%m-%d')
    start_date = end_date - timedelta(days=30)

    # Generate date range
    date_range = pd.date_range(start=start_date, end=end_date, freq='D')
    date_strings = [d.strftime('%Y-%m-%d') for d in date_range]

    all_data = []

    async with aiohttp.ClientSession() as session:
        print(f"📊 Fetching data for {len(date_strings)} days...")

        for date_str in date_strings[-10:]:  # Get last 10 days for testing
            df = await fetch_daily_data(session, date_str)
            if not df.empty:
                all_data.append(df)
                print(f"✅ Fetched {len(df)} stocks for {date_str}")

    if not all_data:
        print("❌ No data fetched")
        return

    # Combine all data
    combined_df = pd.concat(all_data, ignore_index=True)
    print(f"📈 Total records: {len(combined_df)}")

    # Apply basic filters
    filtered_df = combined_df[
        (combined_df['c'] >= 5) &  # Price >= $5
        (combined_df['v'] >= 1000000) &  # Volume >= 1M
        (combined_df['c'] * combined_df['v'] >= 50000000)  # Dollar volume >= $50M
    ]

    print(f"🔍 After basic filters: {len(filtered_df)} records")

    # Run the scanner
    results = lc_frontside_d3_extended_1_scan(filtered_df)

    if len(results) > 0:
        print(f"\n🎯 SCANNER RESULTS - {len(results)} matches found:")
        print("=" * 80)

        for _, row in results.iterrows():
            print(f"{row['ticker']} {row['date'].strftime('%Y-%m-%d')} | "
                  f"Price: ${row['c']:.2f} | High Chg ATR: {row['high_chg_atr']:.2f} | "
                  f"Signal: {row['signal_strength']}")

        # Save results
        results.to_csv(f"lc_d3_extended_1_results_{DATE.replace('-', '')}.csv", index=False)
        print(f"\n💾 Results saved to: lc_d3_extended_1_results_{DATE.replace('-', '')}.csv")

    else:
        print("\n📊 No matches found for LC Frontside D3 Extended 1 pattern")

if __name__ == "__main__":
    asyncio.run(run_scanner())