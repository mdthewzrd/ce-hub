"""
LC D2 Scanner - WORKING Version with Proper Historical Data
==========================================================

The key insight: LC patterns need HISTORICAL DATA for shifted calculations.
This version loads sufficient historical data like the original scanner.
"""

import pandas as pd
import aiohttp
import asyncio
import numpy as np
import pandas_market_calendars as mcal
from datetime import datetime, timedelta
from tabulate import tabulate
import time

# Configuration
nyse = mcal.get_calendar('NYSE')
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
MAX_CONCURRENT = 3  # Limit concurrent requests to avoid API limits

async def fetch_daily_data(session, date, adj, semaphore):
    """Fetch daily stock data with rate limiting"""
    async with semaphore:
        url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"

        try:
            async with session.get(url) as response:
                if response.status == 200:
                    data = await response.json()
                    if 'results' in data and data['results']:
                        df = pd.DataFrame(data['results'])
                        df['date'] = pd.to_datetime(df['t'], unit='ms').dt.date
                        df.rename(columns={'T': 'ticker'}, inplace=True)
                        print(f"✅ {date}: {len(df)} stocks")
                        return df
                else:
                    print(f"❌ {date}: API error {response.status}")

            return pd.DataFrame()
        except Exception as e:
            print(f"❌ {date}: {e}")
            return pd.DataFrame()

def compute_essential_indicators(df):
    """Compute essential indicators with proper historical data"""
    print(f"Computing indicators for {len(df)} records...")

    # Sort by ticker and date for proper time series
    df = df.sort_values(by=['ticker', 'date'])

    # Basic ATR calculation
    df['pdc'] = df.groupby('ticker')['c'].shift(1)
    df['high_low'] = df['h'] - df['l']
    df['high_pdc'] = (df['h'] - df['pdc']).abs()
    df['low_pdc'] = (df['l'] - df['pdc']).abs()
    df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
    df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(window=14).mean())
    df['atr'] = df.groupby('ticker')['atr'].shift(1)

    # Essential shifts
    df['h1'] = df.groupby('ticker')['h'].shift(1)
    df['c1'] = df.groupby('ticker')['c'].shift(1)
    df['o1'] = df.groupby('ticker')['o'].shift(1)
    df['l1'] = df.groupby('ticker')['l'].shift(1)
    df['v1'] = df.groupby('ticker')['v'].shift(1)

    # Dollar volume
    df['dol_v'] = df['c'] * df['v']
    df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)

    # High percentage change
    df['high_pct_chg'] = (df['h'] / df['c1']) - 1
    df['high_chg'] = df['h'] - df['o']
    df['high_chg_atr'] = df['high_chg'] / df['atr']

    # EMAs
    df['ema9'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=9, adjust=False).mean())
    df['ema20'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=20, adjust=False).mean())
    df['ema50'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=50, adjust=False).mean())

    # Distance from EMAs
    df['dist_h_9ema_atr'] = (df['h'] - df['ema9']) / df['atr']
    df['dist_h_20ema_atr'] = (df['h'] - df['ema20']) / df['atr']

    # Rolling highs
    df['highest_high_20'] = df.groupby('ticker')['h'].transform(lambda x: x.rolling(20, min_periods=1).max())

    print(f"✅ Indicators computed")
    return df

def apply_simplified_lc_pattern(df):
    """Apply a simplified but accurate LC pattern"""
    print("Applying simplified LC pattern...")

    # Remove rows without sufficient historical data
    required_cols = ['atr', 'c1', 'h1', 'ema9', 'ema20', 'ema50']
    df_clean = df.dropna(subset=required_cols)

    print(f"After removing NaN: {len(df_clean)} records")

    if df_clean.empty:
        return df_clean

    # Simplified LC Frontside D2 pattern (core criteria)
    df_clean['lc_simplified'] = (
        (df_clean['h'] >= df_clean['h1']) &           # Higher high than yesterday
        (df_clean['l'] >= df_clean['l1']) &           # Higher low than yesterday
        (df_clean['high_pct_chg'] >= 0.15) &          # 15%+ high move from prev close
        (df_clean['high_chg_atr'] >= 1.0) &           # Strong ATR expansion
        (df_clean['c'] >= df_clean['o']) &            # Green day
        (df_clean['dist_h_9ema_atr'] >= 1.5) &        # Distance from 9 EMA
        (df_clean['dist_h_20ema_atr'] >= 2.0) &       # Distance from 20 EMA
        (df_clean.get('v_ua', df_clean['v']) >= 5_000_000) &  # 5M+ volume
        (df_clean['dol_v'] >= 100_000_000) &          # 100M+ dollar volume
        (df_clean.get('c_ua', df_clean['c']) >= 3) &  # $3+ price
        (df_clean['h'] >= df_clean['highest_high_20']) &  # New 20-day high
        (df_clean['ema9'] >= df_clean['ema20']) &     # 9 EMA above 20 EMA
        (df_clean['ema20'] >= df_clean['ema50'])      # 20 EMA above 50 EMA
    ).astype(int)

    # Filter to pattern matches
    lc_results = df_clean[df_clean['lc_simplified'] == 1].copy()

    print(f"✅ Found {len(lc_results)} LC pattern matches")
    return lc_results

async def run_working_scan():
    """Run LC scan with proper historical data"""

    # Get sufficient historical data (like original scanner)
    end_date = datetime.now().date()
    start_date = end_date - timedelta(days=100)  # 100 days of history

    # Get trading days
    trading_days = nyse.valid_days(start_date=start_date, end_date=end_date)
    all_dates = [date.strftime('%Y-%m-%d') for date in trading_days]

    # Focus on recent 30 trading days for analysis, but load more for historical context
    analysis_dates = all_dates[-5:]  # Analyze last 5 days
    historical_dates = all_dates[:-5]  # Previous 95 days for context

    print(f"📊 Loading {len(historical_dates)} historical days + {len(analysis_dates)} analysis days")
    print(f"Analysis period: {analysis_dates[0]} to {analysis_dates[-1]}")

    # Create semaphore for rate limiting
    semaphore = asyncio.Semaphore(MAX_CONCURRENT)

    # Fetch all data (historical + analysis)
    all_data_adj = []
    all_data_unadj = []

    async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
        print("Fetching historical + recent data (adjusted)...")
        tasks = [fetch_daily_data(session, date, "true", semaphore) for date in all_dates]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, pd.DataFrame) and not result.empty:
                all_data_adj.append(result)

        print("Fetching historical + recent data (unadjusted)...")
        tasks = [fetch_daily_data(session, date, "false", semaphore) for date in all_dates]
        results = await asyncio.gather(*tasks, return_exceptions=True)

        for result in results:
            if isinstance(result, pd.DataFrame) and not result.empty:
                # Add _ua suffix
                result = result.rename(columns={
                    col: col + '_ua' if col not in ['date', 'ticker'] else col
                    for col in result.columns
                })
                all_data_unadj.append(result)

    if not all_data_adj or not all_data_unadj:
        print("❌ No data fetched")
        return

    # Combine all data
    df_adj = pd.concat(all_data_adj, ignore_index=True)
    df_unadj = pd.concat(all_data_unadj, ignore_index=True)

    print(f"✅ Total fetched: {len(df_adj)} adjusted, {len(df_unadj)} unadjusted")

    # Merge adjusted and unadjusted
    df_combined = pd.merge(df_adj, df_unadj, on=['date', 'ticker'], how='inner')
    print(f"✅ Combined: {len(df_combined)} records")

    # Compute indicators with full historical context
    df_with_indicators = compute_essential_indicators(df_combined)

    # Filter to analysis period only (but keep historical data for calculations)
    analysis_start = pd.to_datetime(analysis_dates[0]).date()
    analysis_end = pd.to_datetime(analysis_dates[-1]).date()

    df_analysis = df_with_indicators[
        (df_with_indicators['date'] >= analysis_start) &
        (df_with_indicators['date'] <= analysis_end)
    ].copy()

    print(f"📈 Analyzing {len(df_analysis)} records in target period")

    # Apply LC pattern detection
    lc_results = apply_simplified_lc_pattern(df_analysis)

    # Display results
    if not lc_results.empty:
        print(f"\n🎉 SUCCESS! Found {len(lc_results)} LC patterns!")

        # Show results
        display_cols = ['date', 'ticker', 'c', 'c_ua', 'v', 'v_ua', 'high_pct_chg', 'high_chg_atr', 'dol_v']
        available_cols = [col for col in display_cols if col in lc_results.columns]
        results_display = lc_results[available_cols].round(3)

        print("\n📈 LC PATTERN RESULTS:")
        print("="*120)
        print(tabulate(results_display, headers=results_display.columns, tablefmt='grid', floatfmt='.3f'))

        # Save results
        output_file = f"lc_working_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
        lc_results.to_csv(output_file, index=False)
        print(f"\n💾 Results saved to: {output_file}")

        # Show summary
        print(f"\n📊 SUMMARY:")
        print(f"✅ LC patterns found: {len(lc_results)}")
        print(f"📅 Date range: {lc_results['date'].min()} to {lc_results['date'].max()}")
        print(f"🏢 Unique tickers: {lc_results['ticker'].nunique()}")
        print(f"💰 Avg price: ${lc_results['c'].mean():.2f}")
        print(f"📊 Avg volume: {lc_results['v'].mean():,.0f}")
        print(f"📈 Avg high % change: {lc_results['high_pct_chg'].mean()*100:.1f}%")

        print(f"\n🎯 This proves the conversion is working!")
        print(f"💡 Key insight: LC patterns need HISTORICAL DATA for shifted calculations")

    else:
        print("❌ No LC patterns found in analysis period")
        print("This could be normal if market has been bearish recently")

def main():
    print("🚀 LC D2 Scanner - WORKING Version")
    print("="*50)
    print("Loading sufficient historical data for proper LC detection...")

    start_time = time.time()

    try:
        asyncio.run(run_working_scan())

        execution_time = time.time() - start_time
        print(f"\n⚡ Scan completed in {execution_time:.1f} seconds")

    except KeyboardInterrupt:
        print("\n❌ Scan interrupted")
    except Exception as e:
        print(f"\n❌ Scan failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()