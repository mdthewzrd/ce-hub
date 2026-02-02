"""
LC D2 Scanner - CORRECTED Version with Exact Pattern Logic
=========================================================

This version includes ALL the missing calculations that were causing
the original patterns to not be detected properly.

Key fixes:
- Added all missing field calculations
- Exact pattern logic from original code
- Proper unadjusted vs adjusted data handling
- All required shifted variables
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
    """Fetch daily stock data without pre-filtering to match original behavior"""
    url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"

    try:
        async with session.get(url) as response:
            if response.status == 200:
                data = await response.json()
                if 'results' in data and data['results']:
                    df = pd.DataFrame(data['results'])
                    df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                    df.rename(columns={'T': 'ticker'}, inplace=True)
                    print(f"Date {date}: {len(df)} stocks fetched")
                    return df
            return pd.DataFrame()
    except Exception as e:
        logger.error(f"Error fetching {date}: {e}")
        return pd.DataFrame()

def compute_indicators_complete(df):
    """
    Complete technical indicator calculation matching the original code exactly.
    This includes ALL the missing calculations that caused pattern detection to fail.
    """
    if df.empty:
        return df

    print(f"Computing indicators for {len(df)} records...")

    # Sort by ticker and date for proper time series calculations
    df = df.sort_values(by=['ticker', 'date'])

    # Basic ATR calculation
    df['pdc'] = df.groupby('ticker')['c'].shift(1)
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = (df['h'] - df['pdc']).abs()
    df['low_pdc'] = (df['l'] - df['pdc']).abs()
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(window=14).mean())
    df['atr'] = df.groupby('ticker')['atr'].shift(1)  # Use previous ATR

    # Day range
    df['d1_range'] = abs(df['h'] - df['l'])

    # Key shifted values (1-5 periods back)
    for i in range(1, 6):
        df[f'h{i}'] = df.groupby('ticker')['h'].shift(i)
        df[f'c{i}'] = df.groupby('ticker')['c'].shift(i)
        df[f'o{i}'] = df.groupby('ticker')['o'].shift(i)
        df[f'l{i}'] = df.groupby('ticker')['l'].shift(i)
        df[f'v{i}'] = df.groupby('ticker')['v'].shift(i)

    # Dollar volume calculations and shifts
    df['dol_v'] = df['c'] * df['v']
    for i in range(1, 6):
        df[f'dol_v{i}'] = df.groupby('ticker')['dol_v'].shift(i)

    # CRITICAL MISSING CALCULATION: 5-day cumulative dollar volume
    df['dol_v_cum5_1'] = df['dol_v1'] + df['dol_v2'] + df['dol_v3'] + df['dol_v4'] + df['dol_v5']

    # Close range calculations
    df['close_range'] = (df['c'] - df['l']) / (df['h'] - df['l'])
    df['close_range1'] = df.groupby('ticker')['close_range'].shift(1)
    df['close_range2'] = df.groupby('ticker')['close_range'].shift(2)

    # Gap metrics
    df['gap_pct'] = (df['o'] / df['pdc']) - 1
    df['gap_atr'] = ((df['o'] - df['pdc']) / df['atr'])
    df['gap_atr1'] = df.groupby('ticker')['gap_atr'].shift(1)

    # High change metrics
    df['high_chg'] = df['h'] - df['o']
    df['high_chg_atr'] = df['high_chg'] / df['atr']
    df['high_chg_atr1'] = df.groupby('ticker')['high_chg_atr'].shift(1)

    # Percentage change metrics
    df['pct_chg'] = (df['c'] / df['c1']) - 1
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1
    df['high_pct_chg1'] = df.groupby('ticker')['high_pct_chg'].shift(1)

    # EMAs for all required periods
    for period in [9, 20, 50, 200]:
        df[f'ema{period}'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=period, adjust=False).mean())

        # Distance from EMAs (both high and low distances)
        df[f'dist_h_{period}ema'] = df['h'] - df[f'ema{period}']
        df[f'dist_h_{period}ema_atr'] = df[f'dist_h_{period}ema'] / df['atr']
        df[f'dist_l_{period}ema'] = df['l'] - df[f'ema{period}']
        df[f'dist_l_{period}ema_atr'] = df[f'dist_l_{period}ema'] / df['atr']

        # Shifted EMA distances
        for shift in range(1, 5):
            df[f'dist_h_{period}ema_atr{shift}'] = df.groupby('ticker')[f'dist_h_{period}ema_atr'].shift(shift)

    # Rolling highs and lows for required periods
    for window in [5, 20, 50, 100, 250]:
        df[f'lowest_low_{window}'] = df.groupby('ticker')['l'].transform(
            lambda x: x.rolling(window=window, min_periods=1).min()
        )
        df[f'highest_high_{window}'] = df.groupby('ticker')['h'].transform(
            lambda x: x.rolling(window=window, min_periods=1).max()
        )

        # Shifted versions of highs and lows
        for shift in range(1, 5):
            df[f'highest_high_{window}_{shift}'] = df.groupby('ticker')[f'highest_high_{window}'].shift(shift)
            df[f'lowest_low_{window}_{shift}'] = df.groupby('ticker')[f'lowest_low_{window}'].shift(shift)

    # CRITICAL MISSING CALCULATIONS for LC patterns:

    # 1. Distance from high to lowest low (percentage)
    df['h_dist_to_lowest_low_20_pct'] = (df['h'] / df['lowest_low_20']) - 1

    # 2. Highest high 5 distance to lowest low 20 (previous day)
    df['highest_high_5_dist_to_lowest_low_20_pct_1'] = (df['highest_high_5_1'] / df['lowest_low_20_1']) - 1

    # 3. Distance from high to previous highest highs (ATR normalized)
    df['h_dist_to_highest_high_20_1_atr'] = (df['h'] - df['highest_high_20_1']) / df['atr']
    df['h_dist_to_highest_high_20_2_atr'] = (df['h'] - df['highest_high_20_2']) / df['atr']

    # Add unadjusted shifted variables for patterns
    if 'v_ua' in df.columns:
        df['v_ua1'] = df.groupby('ticker')['v_ua'].shift(1)
    if 'c_ua' in df.columns:
        df['c_ua1'] = df.groupby('ticker')['c_ua'].shift(1)

    # Drop intermediate columns
    columns_to_drop = ['high_low', 'high_pdc', 'low_pdc']
    df.drop(columns=columns_to_drop, inplace=True, errors='ignore')

    print(f"Indicators computed successfully for {len(df)} records")
    return df

def apply_exact_lc_patterns(df):
    """
    Apply the EXACT LC patterns from the original code.
    These are the 3 patterns that filter_lc_rows looks for:
    1. lc_frontside_d3_extended_1
    2. lc_frontside_d2_extended
    3. lc_frontside_d2_extended_1
    """
    if df.empty:
        return df

    print("Applying exact LC pattern detection...")

    # Remove rows without sufficient data for pattern detection
    required_cols = ['atr', 'c1', 'h1', 'ema9', 'ema20', 'ema50']
    df = df.dropna(subset=required_cols)

    if df.empty:
        print("No data left after removing NaN values")
        return df

    # Pattern 1: LC Frontside D3 Extended 1 (lines 460-501 in original)
    df['lc_frontside_d3_extended_1'] = (
        (df['h'] >= df['h1']) &
        (df['h1'] >= df.get('h2', df['h1'])) &
        (df['l'] >= df['l1']) &
        (df['l1'] >= df.get('l2', df['l1'])) &
        (
            ((df.get('high_pct_chg1', 0) >= 0.3) & (df['high_pct_chg'] >= 0.3) & (df.get('c_ua', df['c']) >= 5) & (df.get('c_ua', df['c']) < 15) & (df.get('h_dist_to_lowest_low_20_pct', 0) >= 2.5)) |
            ((df.get('high_pct_chg1', 0) >= 0.2) & (df['high_pct_chg'] >= 0.2) & (df.get('c_ua', df['c']) >= 15) & (df.get('c_ua', df['c']) < 25) & (df.get('h_dist_to_lowest_low_20_pct', 0) >= 2)) |
            ((df.get('high_pct_chg1', 0) >= 0.1) & (df['high_pct_chg'] >= 0.1) & (df.get('c_ua', df['c']) >= 25) & (df.get('c_ua', df['c']) < 50) & (df.get('h_dist_to_lowest_low_20_pct', 0) >= 1.5)) |
            ((df.get('high_pct_chg1', 0) >= 0.07) & (df['high_pct_chg'] >= 0.07) & (df.get('c_ua', df['c']) >= 50) & (df.get('c_ua', df['c']) < 90) & (df.get('h_dist_to_lowest_low_20_pct', 0) >= 1)) |
            ((df.get('high_pct_chg1', 0) >= 0.05) & (df['high_pct_chg'] >= 0.05) & (df.get('c_ua', df['c']) >= 90) & (df.get('h_dist_to_lowest_low_20_pct', 0) >= 0.75))
        ) &
        (df.get('high_chg_atr1', 0) >= 0.7) &
        (df.get('c1', 0) >= df.get('o1', 0)) &
        (df.get('dist_h_9ema_atr1', 0) >= 1.5) &
        (df.get('dist_h_20ema_atr1', 0) >= 2) &
        (df['high_chg_atr'] >= 1) &
        (df['c'] >= df['o']) &
        (df.get('dist_h_9ema_atr', 0) >= 1.5) &
        (df.get('dist_h_20ema_atr', 0) >= 2) &
        (df.get('v_ua', df['v']) >= 10_000_000) &
        (df['dol_v'] >= 500_000_000) &
        (df.get('v_ua1', 0) >= 10_000_000) &
        (df.get('dol_v1', 0) >= 100_000_000) &
        (df.get('c_ua', df['c']) >= 5) &
        ((df['high_chg_atr'] >= 1) | (df.get('high_chg_atr1', 0) >= 1)) &
        (df.get('h_dist_to_highest_high_20_2_atr', 0) >= 2.5) &
        (df['h'] >= df.get('highest_high_20', df['h'])) &
        (df['ema9'] >= df['ema20']) &
        (df['ema20'] >= df['ema50'])
    ).astype(int)

    # Pattern 2: LC Frontside D2 Extended (lines 503-536 in original)
    df['lc_frontside_d2_extended'] = (
        (df['h'] >= df['h1']) &
        (df['l'] >= df['l1']) &
        (
            ((df['high_pct_chg'] >= 0.5) & (df.get('c_ua', df['c']) >= 5) & (df.get('c_ua', df['c']) < 15) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 2.5)) |
            ((df['high_pct_chg'] >= 0.3) & (df.get('c_ua', df['c']) >= 15) & (df.get('c_ua', df['c']) < 25) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 2)) |
            ((df['high_pct_chg'] >= 0.2) & (df.get('c_ua', df['c']) >= 25) & (df.get('c_ua', df['c']) < 50) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 1.5)) |
            ((df['high_pct_chg'] >= 0.15) & (df.get('c_ua', df['c']) >= 50) & (df.get('c_ua', df['c']) < 90) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 1)) |
            ((df['high_pct_chg'] >= 0.1) & (df.get('c_ua', df['c']) >= 90) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 0.75))
        ) &
        (df['high_chg_atr'] >= 1.5) &
        (df['c'] >= df['o']) &
        (df.get('dist_h_9ema_atr', 0) >= 2) &
        (df.get('dist_h_20ema_atr', 0) >= 3) &
        (df.get('v_ua', df['v']) >= 10_000_000) &
        (df['dol_v'] >= 500_000_000) &
        (df.get('c_ua', df['c']) >= 5) &
        (df.get('dist_l_9ema_atr', 0) >= 1) &
        (df.get('h_dist_to_highest_high_20_1_atr', 0) >= 1) &
        (df.get('dol_v_cum5_1', 0) >= 500_000_000) &
        (df['h'] >= df.get('highest_high_20', df['h'])) &
        (df['ema9'] >= df['ema20']) &
        (df['ema20'] >= df['ema50'])
    ).astype(int)

    # Pattern 3: LC Frontside D2 Extended 1 (lines 539-572 in original)
    df['lc_frontside_d2_extended_1'] = (
        (df['h'] >= df['h1']) &
        (df['l'] >= df['l1']) &
        (
            ((df['high_pct_chg'] >= 1.0) & (df.get('c_ua', df['c']) >= 5) & (df.get('c_ua', df['c']) < 15) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 2.5)) |
            ((df['high_pct_chg'] >= 0.5) & (df.get('c_ua', df['c']) >= 15) & (df.get('c_ua', df['c']) < 25) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 2)) |
            ((df['high_pct_chg'] >= 0.3) & (df.get('c_ua', df['c']) >= 25) & (df.get('c_ua', df['c']) < 50) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 1.5)) |
            ((df['high_pct_chg'] >= 0.2) & (df.get('c_ua', df['c']) >= 50) & (df.get('c_ua', df['c']) < 90) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 1)) |
            ((df['high_pct_chg'] >= 0.15) & (df.get('c_ua', df['c']) >= 90) & (df.get('highest_high_5_dist_to_lowest_low_20_pct_1', 0) >= 0.75))
        ) &
        (df['high_chg_atr'] >= 1.5) &
        (df['c'] >= df['o']) &
        (df.get('dist_h_9ema_atr', 0) >= 2) &
        (df.get('dist_h_20ema_atr', 0) >= 3) &
        (df.get('v_ua', df['v']) >= 10_000_000) &
        (df['dol_v'] >= 500_000_000) &
        (df.get('c_ua', df['c']) >= 5) &
        (df.get('h_dist_to_highest_high_20_1_atr', 0) >= 1) &
        (df.get('dol_v_cum5_1', 0) >= 500_000_000) &
        (df['h'] >= df.get('highest_high_20', df['h'])) &
        (df['ema9'] >= df['ema20']) &
        (df['ema20'] >= df['ema50'])
    ).astype(int)

    # Apply the exact filter from filter_lc_rows function
    lc_results = df[
        (df['lc_frontside_d3_extended_1'] == 1) |
        (df['lc_frontside_d2_extended'] == 1) |
        (df['lc_frontside_d2_extended_1'] == 1)
    ].copy()

    pattern_counts = {
        'lc_frontside_d3_extended_1': (df['lc_frontside_d3_extended_1'] == 1).sum(),
        'lc_frontside_d2_extended': (df['lc_frontside_d2_extended'] == 1).sum(),
        'lc_frontside_d2_extended_1': (df['lc_frontside_d2_extended_1'] == 1).sum()
    }

    print(f"Pattern Detection Results:")
    for pattern, count in pattern_counts.items():
        print(f"  {pattern}: {count} matches")
    print(f"Total LC patterns found: {len(lc_results)}")

    return lc_results

async def run_corrected_scan():
    """Run the corrected LC D2 scan with exact pattern logic"""

    # Test with a longer period to catch patterns
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=30)  # Go back 30 days

    # Get trading days
    trading_days = nyse.valid_days(start_date=start_date, end_date=end_date)
    test_dates = [date.strftime('%Y-%m-%d') for date in trading_days[-10:]]  # Last 10 trading days

    print(f"🔍 Running corrected LC D2 scanner on dates: {test_dates}")

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

    # Calculate ALL indicators (including missing ones)
    print("📊 Calculating complete technical indicators...")
    df_with_indicators = compute_indicators_complete(df_combined)

    # Apply exact LC pattern detection
    print("🎯 Applying exact LC pattern detection...")
    lc_results = apply_exact_lc_patterns(df_with_indicators)

    # Display results
    if not lc_results.empty:
        print(f"\n🎉 Found {len(lc_results)} LC patterns!")

        # Show key columns
        display_cols = ['date', 'ticker', 'c', 'c_ua', 'v', 'v_ua', 'high_pct_chg', 'high_chg_atr',
                       'lc_frontside_d3_extended_1', 'lc_frontside_d2_extended', 'lc_frontside_d2_extended_1']
        available_cols = [col for col in display_cols if col in lc_results.columns]
        results_display = lc_results[available_cols].round(3)

        print("\n📈 LC PATTERN RESULTS:")
        print("="*100)
        print(tabulate(results_display, headers=results_display.columns, tablefmt='grid', floatfmt='.3f'))

        # Save results
        output_file = f"lc_corrected_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        lc_results.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")

        # Show pattern summary
        print(f"\n📊 PATTERN SUMMARY:")
        print(f"Total patterns found: {len(lc_results)}")
        print(f"Unique tickers: {lc_results['ticker'].nunique()}")
        print(f"Date range: {lc_results['date'].min()} to {lc_results['date'].max()}")
        if 'v' in lc_results.columns:
            print(f"Avg volume: {lc_results['v'].mean():,.0f}")
        print(f"Avg price: ${lc_results['c'].mean():.2f}")

        # Show which patterns triggered
        pattern_summary = {}
        if 'lc_frontside_d3_extended_1' in lc_results.columns:
            pattern_summary['D3 Extended'] = (lc_results['lc_frontside_d3_extended_1'] == 1).sum()
        if 'lc_frontside_d2_extended' in lc_results.columns:
            pattern_summary['D2 Extended'] = (lc_results['lc_frontside_d2_extended'] == 1).sum()
        if 'lc_frontside_d2_extended_1' in lc_results.columns:
            pattern_summary['D2 Extended v1'] = (lc_results['lc_frontside_d2_extended_1'] == 1).sum()

        print(f"\nPattern breakdown:")
        for pattern, count in pattern_summary.items():
            print(f"  {pattern}: {count}")

    else:
        print("❌ No LC patterns found")
        print("This might indicate:")
        print("1. No strong patterns in recent market conditions")
        print("2. Missing data fields still causing issues")
        print("3. Market has been bearish recently")

def main():
    """Main corrected test function"""
    start_time = time.time()

    print("🚀 Starting LC D2 Scanner - CORRECTED Version")
    print("="*60)
    print("This version includes ALL missing calculations and exact pattern logic")

    try:
        asyncio.run(run_corrected_scan())

        execution_time = time.time() - start_time
        print(f"\n⚡ Corrected scan completed in {execution_time:.1f} seconds")

        if execution_time < 60:
            print("✅ If you see patterns above, the correction worked!")
            print("📝 The key was adding missing field calculations like:")
            print("   - h_dist_to_lowest_low_20_pct")
            print("   - highest_high_5_dist_to_lowest_low_20_pct_1")
            print("   - h_dist_to_highest_high_20_1_atr")
            print("   - dol_v_cum5_1")

    except KeyboardInterrupt:
        print("\n❌ Scan interrupted by user")
    except Exception as e:
        print(f"\n❌ Scan failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()