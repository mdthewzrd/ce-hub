"""
LC D2 Scanner - Quick Test Version
==================================

This is a simplified test version to verify the conversion is working correctly.
Tests with just a few recent days to ensure patterns match your expectations.

Run this first to verify before using the full optimized version.
"""

import pandas as pd
import requests
import time
import numpy as np
import pandas_market_calendars as mcal
import aiohttp
import asyncio
from concurrent.futures import ThreadPoolExecutor, ProcessPoolExecutor
from tabulate import tabulate
from datetime import datetime, timedelta
import logging
import warnings

# Suppress warnings
warnings.filterwarnings("ignore")

# Configuration
nyse = mcal.get_calendar('NYSE')
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

# Set up logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

async def fetch_daily_data(session, date, adj):
    """Fetch daily stock data with basic pre-filtering"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"

    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data and data['results']:
                    df = pd.DataFrame(data['results'])

                    # Basic pre-filtering to reduce noise
                    df['dollar_volume'] = df['c'] * df['v']
                    df['close_range'] = (df['c'] - df['l']) / (df['h'] - df['l'])

                    # Apply minimal filters (more lenient than production)
                    filtered_df = df[
                        (df['v'] >= 1_000_000) &     # 1M+ volume
                        (df['c'] >= 2.0) &           # $2+ price
                        (df['dollar_volume'] >= 5_000_000) & # $5M+ dollar volume
                        (df['c'] > df['o'])          # Green day
                    ].copy()

                    if not filtered_df.empty:
                        filtered_df['date'] = pd.to_datetime(filtered_df['t'], unit='ms').dt.date
                        filtered_df.rename(columns={'T': 'ticker'}, inplace=True)

                        print(f"Date {date}: {len(df)} total -> {len(filtered_df)} after pre-filter")
                        return filtered_df

            return pd.DataFrame()

    except Exception as e:
        logger.error(f"Error fetching {date}: {e}")
        return pd.DataFrame()

def calculate_basic_indicators(df):
    """Calculate essential technical indicators for LC pattern detection"""
    if df.empty:
        return df

    # Sort by ticker and date
    df = df.sort_values(by=['ticker', 'date'])

    # Previous day close and ATR calculation
    df['pdc'] = df.groupby('ticker')['c'].shift(1)
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = (df['h'] - df['pdc']).abs()
    df['low_pdc'] = (df['l'] - df['pdc']).abs()
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(window=14).mean())
    df['atr'] = df.groupby('ticker')['atr'].shift(1)  # Use previous ATR

    # Key shifted values
    df['h1'] = df.groupby('ticker')['h'].shift(1)
    df['c1'] = df.groupby('ticker')['c'].shift(1)
    df['o1'] = df.groupby('ticker')['o'].shift(1)
    df['l1'] = df.groupby('ticker')['l'].shift(1)
    df['v1'] = df.groupby('ticker')['v'].shift(1)

    # Dollar volume
    df['dol_v'] = df['c'] * df['v']
    df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)

    # Gap and range metrics
    df['gap_pct'] = (df['o'] / df['pdc']) - 1
    df['close_range'] = (df['c'] - df['l']) / (df['h'] - df['l'])
    df['close_range1'] = df.groupby('ticker')['close_range'].shift(1)

    # High change metrics
    df['high_chg'] = df['h'] - df['o']
    df['high_chg_atr'] = df['high_chg'] / df['atr']
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1

    # EMAs (key ones only)
    df['ema9'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=9).mean())
    df['ema20'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=20).mean())
    df['ema50'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=50).mean())

    # Distance from EMAs
    df['dist_h_9ema_atr'] = (df['h'] - df['ema9']) / df['atr']
    df['dist_h_20ema_atr'] = (df['h'] - df['ema20']) / df['atr']

    # Rolling highs
    df['highest_high_20'] = df.groupby('ticker')['h'].transform(lambda x: x.rolling(20, min_periods=1).max())

    return df

def detect_lc_patterns(df):
    """Simplified LC pattern detection for testing"""
    if df.empty:
        return df

    # Remove rows without sufficient data
    df = df.dropna(subset=['atr', 'c1', 'h1', 'ema9', 'ema20'])

    if df.empty:
        return df

    # LC Frontside D2 Extended Pattern (main pattern)
    df['lc_frontside_d2_extended'] = (
        (df['h'] >= df['h1']) &  # Higher high than yesterday
        (df['l'] >= df['l1']) &  # Higher low than yesterday
        (
            # Price-dependent percentage requirements
            ((df['high_pct_chg'] >= 0.5) & (df['c'] >= 5) & (df['c'] < 15)) |
            ((df['high_pct_chg'] >= 0.3) & (df['c'] >= 15) & (df['c'] < 25)) |
            ((df['high_pct_chg'] >= 0.2) & (df['c'] >= 25) & (df['c'] < 50)) |
            ((df['high_pct_chg'] >= 0.15) & (df['c'] >= 50) & (df['c'] < 90)) |
            ((df['high_pct_chg'] >= 0.1) & (df['c'] >= 90))
        ) &
        (df['high_chg_atr'] >= 1.5) &    # Strong ATR expansion
        (df['c'] >= df['o']) &           # Green day
        (df['dist_h_9ema_atr'] >= 2) &   # Distance from 9 EMA
        (df['dist_h_20ema_atr'] >= 3) &  # Distance from 20 EMA
        (df['v'] >= 10_000_000) &        # 10M+ volume
        (df['dol_v'] >= 500_000_000) &   # 500M+ dollar volume
        (df['c'] >= 5) &                 # $5+ price
        (df['h'] >= df['highest_high_20']) & # New 20-day high
        (df['ema9'] >= df['ema20']) &    # 9 EMA above 20 EMA
        (df['ema20'] >= df['ema50'])     # 20 EMA above 50 EMA
    ).astype(int)

    # Filter to only rows with LC patterns
    lc_results = df[df['lc_frontside_d2_extended'] == 1].copy()

    return lc_results

async def run_test_scan():
    """Run a quick test scan on recent days"""

    # Test with last 5 trading days
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=10)  # Go back 10 days to ensure we get 5 trading days

    # Get trading days
    trading_days = nyse.valid_days(start_date=start_date, end_date=end_date)
    test_dates = [date.strftime('%Y-%m-%d') for date in trading_days[-5:]]  # Last 5 trading days

    print(f"🧪 Testing LC D2 scanner on dates: {test_dates}")

    # Fetch data for test dates
    all_adj_data = []
    all_unadj_data = []

    async with aiohttp.ClientSession() as session:
        # Fetch adjusted data
        print("Fetching adjusted data...")
        adj_tasks = [fetch_daily_data(session, date, "true") for date in test_dates]
        adj_results = await asyncio.gather(*adj_tasks, return_exceptions=True)

        for result in adj_results:
            if isinstance(result, pd.DataFrame) and not result.empty:
                all_adj_data.append(result)

        # Fetch unadjusted data
        print("Fetching unadjusted data...")
        unadj_tasks = [fetch_daily_data(session, date, "false") for date in test_dates]
        unadj_results = await asyncio.gather(*unadj_tasks, return_exceptions=True)

        for result in unadj_results:
            if isinstance(result, pd.DataFrame) and not result.empty:
                # Add _ua suffix to unadjusted columns
                result = result.rename(columns={
                    col: col + '_ua' if col not in ['date', 'ticker'] else col
                    for col in result.columns
                })
                all_unadj_data.append(result)

    if not all_adj_data or not all_unadj_data:
        print("❌ No data fetched - check API key or network connection")
        return

    # Combine data
    df_adj = pd.concat(all_adj_data, ignore_index=True)
    df_unadj = pd.concat(all_unadj_data, ignore_index=True)

    print(f"✅ Fetched {len(df_adj)} adjusted and {len(df_unadj)} unadjusted records")

    # Merge adjusted and unadjusted
    df_combined = pd.merge(df_adj, df_unadj, on=['date', 'ticker'], how='inner')
    print(f"✅ Combined to {len(df_combined)} total records")

    # Calculate indicators
    print("📊 Calculating technical indicators...")
    df_with_indicators = calculate_basic_indicators(df_combined)

    # Apply LC pattern detection
    print("🔍 Detecting LC patterns...")
    lc_results = detect_lc_patterns(df_with_indicators)

    # Display results
    if not lc_results.empty:
        print(f"\n🎯 Found {len(lc_results)} LC Frontside D2 Extended patterns!")

        # Show results
        display_cols = ['date', 'ticker', 'c', 'c_ua', 'v', 'v_ua', 'high_pct_chg', 'high_chg_atr', 'gap_pct']
        results_display = lc_results[display_cols].round(3)

        print("\n📈 LC PATTERN RESULTS:")
        print("="*80)
        print(tabulate(results_display, headers=results_display.columns, tablefmt='grid', floatfmt='.3f'))

        # Save results
        output_file = f"lc_test_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        lc_results.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")

        # Show pattern summary
        print(f"\n📊 PATTERN SUMMARY:")
        print(f"Total patterns found: {len(lc_results)}")
        print(f"Unique tickers: {lc_results['ticker'].nunique()}")
        print(f"Date range: {lc_results['date'].min()} to {lc_results['date'].max()}")
        print(f"Avg volume: {lc_results['v'].mean():,.0f}")
        print(f"Avg price: ${lc_results['c'].mean():.2f}")

    else:
        print("❌ No LC patterns found in test data")
        print("This could be normal if there were no strong patterns in recent days.")
        print("Try running the full scanner on a longer date range.")

def main():
    """Main test function"""
    start_time = time.time()

    print("🚀 Starting LC D2 Scanner Test")
    print("="*50)

    try:
        asyncio.run(run_test_scan())

        execution_time = time.time() - start_time
        print(f"\n⚡ Test completed in {execution_time:.1f} seconds")
        print("\n✅ If you see results above, the conversion is working!")
        print("Now you can run the full optimized version: lc_d2_scan_optimized.py")

    except KeyboardInterrupt:
        print("\n❌ Test interrupted by user")
    except Exception as e:
        print(f"\n❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()