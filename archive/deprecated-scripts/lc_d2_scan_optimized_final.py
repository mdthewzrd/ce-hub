"""
LC D2 Scanner - OPTIMIZED FINAL Version
=======================================

This version builds on the working scanner with maximum performance optimizations:
- Max threading with optimal concurrency limits
- Enhanced pre-filtering to reduce dataset size before main calculations
- Intelligent volume and price filtering in first pass
- Full ticker universe scanning with Polygon API
- Production-ready performance monitoring

Features:
- 3-stage filtering: Basic → Volume/Price → Full LC Pattern
- Concurrent processing with rate limiting
- Memory-efficient data handling
- Progress tracking and performance metrics
"""

import pandas as pd
import aiohttp
import asyncio
import numpy as np
import pandas_market_calendars as mcal
from datetime import datetime, timedelta
from tabulate import tabulate
import time
import concurrent.futures
from typing import List, Dict, Optional
import warnings

# Suppress warnings for cleaner output
warnings.filterwarnings("ignore")

# Configuration
nyse = mcal.get_calendar('NYSE')
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
MAX_CONCURRENT = 8  # Optimized for Polygon API limits
CHUNK_SIZE = 50  # Process data in chunks for memory efficiency

class LCOptimizedScanner:
    def __init__(self):
        self.results = []
        self.performance_metrics = {}
        self.total_processed = 0
        self.filtered_counts = {'stage1': 0, 'stage2': 0, 'stage3': 0}

    async def fetch_daily_data_optimized(self, session, date, adj, semaphore):
        """Fetch daily data with enhanced pre-filtering"""
        async with semaphore:
            url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}?adjusted={adj}&apiKey={API_KEY}"

            try:
                async with session.get(url) as response:
                    if response.status == 200:
                        data = await response.json()
                        if 'results' in data and data['results']:
                            df = pd.DataFrame(data['results'])

                            # STAGE 1: Basic filtering (most aggressive to reduce dataset quickly)
                            df_basic = self.apply_basic_filters(df, date)
                            self.filtered_counts['stage1'] += len(df_basic)

                            if not df_basic.empty:
                                df_basic['date'] = pd.to_datetime(df_basic['t'], unit='ms').dt.date
                                df_basic.rename(columns={'T': 'ticker'}, inplace=True)
                                print(f"✅ {date}: {len(df)} total → {len(df_basic)} after basic filter")
                                return df_basic

                        return pd.DataFrame()
                    else:
                        print(f"❌ {date}: API error {response.status}")
                        return pd.DataFrame()

            except Exception as e:
                print(f"❌ {date}: {e}")
                return pd.DataFrame()

    def apply_basic_filters(self, df: pd.DataFrame, date: str) -> pd.DataFrame:
        """Stage 1: Aggressive basic filtering to reduce dataset size immediately"""
        if df.empty:
            return df

        # Calculate basic metrics for filtering
        df['dollar_volume'] = df['c'] * df['v']
        df['daily_range'] = df['h'] - df['l']
        df['close_position'] = (df['c'] - df['l']) / (df['h'] - df['l'])

        # BASIC FILTERS (minimal filtering to preserve data for analysis)
        filtered = df[
            (df['v'] >= 500_000) &            # Minimum 500K volume (very lenient)
            (df['c'] >= 1.0) &                # Minimum $1 price
            (df['dollar_volume'] >= 1_000_000) &  # Minimum $1M dollar volume
            (df['daily_range'] > 0)           # Must have some range
        ].copy()

        return filtered

    def apply_volume_price_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2: Enhanced volume and price filtering using historical context"""
        if df.empty:
            return df

        # Sort for proper time series calculations
        df = df.sort_values(by=['ticker', 'date'])

        # Calculate previous day values for filtering
        df['c1'] = df.groupby('ticker')['c'].shift(1)
        df['v1'] = df.groupby('ticker')['v'].shift(1)
        df['h1'] = df.groupby('ticker')['h'].shift(1)
        df['l1'] = df.groupby('ticker')['l'].shift(1)
        df['dol_v1'] = df.groupby('ticker')['dollar_volume'].shift(1)

        # Calculate volume averages (5, 10, 20 day)
        df['v_avg5'] = df.groupby('ticker')['v'].transform(lambda x: x.rolling(5, min_periods=1).mean())
        df['v_avg10'] = df.groupby('ticker')['v'].transform(lambda x: x.rolling(10, min_periods=1).mean())
        df['v_avg20'] = df.groupby('ticker')['v'].transform(lambda x: x.rolling(20, min_periods=1).mean())

        # Volume surge detection
        df['v_surge_5'] = df['v'] / df['v_avg5']
        df['v_surge_20'] = df['v'] / df['v_avg20']

        # Price movement filters
        df['price_change'] = (df['c'] / df['c1']) - 1
        df['high_change'] = (df['h'] / df['c1']) - 1

        # STAGE 2 FILTERS: Minimal filtering to preserve analysis period size
        filtered = df[
            # Very lenient volume criteria
            (df['v'] >= 1_000_000) &                  # 1M+ absolute volume only
            # Very lenient price criteria
            (df['c'] >= 2.0) &                        # $2+ price minimum
            (df['price_change'] >= -0.05) &           # Allow small red days (up to -5%)
            (df['dollar_volume'] >= 10_000_000)       # $10M+ dollar volume
        ].copy()

        self.filtered_counts['stage2'] += len(filtered)
        return filtered

    def compute_full_indicators(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all technical indicators for remaining candidates"""
        if df.empty:
            return df

        print(f"Computing full indicators for {len(df)} records...")

        # Sort by ticker and date for proper time series
        df = df.sort_values(by=['ticker', 'date'])

        # ATR calculation (14-period)
        df['pdc'] = df.groupby('ticker')['c'].shift(1)
        df['high_low'] = df['h'] - df['l']
        df['high_pdc'] = (df['h'] - df['pdc']).abs()
        df['low_pdc'] = (df['l'] - df['pdc']).abs()
        df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)
        df['atr'] = df.groupby('ticker')['true_range'].transform(lambda x: x.rolling(window=14).mean())
        df['atr'] = df.groupby('ticker')['atr'].shift(1)  # Use previous ATR

        # High change metrics
        df['high_chg'] = df['h'] - df['o']
        df['high_chg_atr'] = df['high_chg'] / df['atr']
        df['high_pct_chg'] = (df['h'] / df['c1']) - 1

        # EMAs
        df['ema9'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=9, adjust=False).mean())
        df['ema20'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=20, adjust=False).mean())
        df['ema50'] = df.groupby('ticker')['c'].transform(lambda x: x.ewm(span=50, adjust=False).mean())

        # Distance from EMAs in ATR units
        df['dist_h_9ema_atr'] = (df['h'] - df['ema9']) / df['atr']
        df['dist_h_20ema_atr'] = (df['h'] - df['ema20']) / df['atr']

        # Rolling highs for breakout detection
        df['highest_high_20'] = df.groupby('ticker')['h'].transform(lambda x: x.rolling(20, min_periods=1).max())

        print(f"✅ Full indicators computed")
        return df

    def detect_lc_patterns_final(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3: Final LC pattern detection with complete criteria"""
        if df.empty:
            return df

        # Remove rows without sufficient historical data
        required_cols = ['atr', 'c1', 'h1', 'ema9', 'ema20', 'ema50']
        df_clean = df.dropna(subset=required_cols)

        if df_clean.empty:
            return df_clean

        print(f"Final LC pattern detection on {len(df_clean)} clean records...")

        # LC Frontside D2 Pattern (balanced criteria matching working version)
        df_clean['lc_optimized'] = (
            # Core pattern requirements
            (df_clean['h'] >= df_clean['h1']) &           # Higher high than yesterday
            (df_clean['l'] >= df_clean['l1']) &           # Higher low than yesterday
            (df_clean['c'] >= df_clean['o']) &            # Green day

            # Simplified percentage requirements (matching working version)
            (df_clean['high_pct_chg'] >= 0.15) &          # 15%+ high move from prev close

            # Technical strength requirements (slightly relaxed)
            (df_clean['high_chg_atr'] >= 1.0) &           # Strong ATR expansion (relaxed from 1.2)
            (df_clean['dist_h_9ema_atr'] >= 1.5) &        # Distance from 9 EMA
            (df_clean['dist_h_20ema_atr'] >= 2.0) &       # Distance from 20 EMA

            # Volume and liquidity requirements (matching working version with unadjusted data)
            (df_clean.get('v_ua', df_clean['v']) >= 5_000_000) &  # 5M+ volume (unadjusted preferred)
            (df_clean['dollar_volume'] >= 100_000_000) &  # $100M+ dollar volume
            (df_clean.get('c_ua', df_clean['c']) >= 3) &  # $3+ price (unadjusted preferred)

            # Breakout and trend requirements
            (df_clean['h'] >= df_clean['highest_high_20']) &  # New 20-day high
            (df_clean['ema9'] >= df_clean['ema20']) &     # 9 EMA above 20 EMA
            (df_clean['ema20'] >= df_clean['ema50'])      # 20 EMA above 50 EMA
        ).astype(int)

        # Filter to pattern matches
        lc_results = df_clean[df_clean['lc_optimized'] == 1].copy()
        self.filtered_counts['stage3'] += len(lc_results)

        print(f"✅ Found {len(lc_results)} LC pattern matches")
        return lc_results

    async def run_optimized_scan(self, analysis_days: int = 5, historical_days: int = 100):
        """Run the complete optimized scan with 3-stage filtering"""
        start_time = time.time()

        # Calculate date ranges
        end_date = datetime.now().date()
        start_date = end_date - timedelta(days=historical_days + 10)

        # Get trading days
        trading_days = nyse.valid_days(start_date=start_date, end_date=end_date)
        all_dates = [date.strftime('%Y-%m-%d') for date in trading_days]

        # Split into historical context and analysis periods
        analysis_dates = all_dates[-analysis_days:]
        historical_dates = all_dates[:-analysis_days]

        print(f"🚀 LC D2 OPTIMIZED SCANNER")
        print(f"=" * 50)
        print(f"📊 Loading {len(historical_dates)} historical + {len(analysis_dates)} analysis days")
        print(f"📅 Analysis period: {analysis_dates[0]} to {analysis_dates[-1]}")
        print(f"⚡ Max concurrent requests: {MAX_CONCURRENT}")

        # Create semaphore for rate limiting
        semaphore = asyncio.Semaphore(MAX_CONCURRENT)

        # PHASE 1: Fetch all data with basic filtering
        print(f"\n🔍 PHASE 1: Fetching data with basic filtering...")
        fetch_start = time.time()

        all_data_adj = []
        all_data_unadj = []

        async with aiohttp.ClientSession(timeout=aiohttp.ClientTimeout(total=30)) as session:
            # Fetch adjusted data
            print("Fetching adjusted data...")
            tasks = [self.fetch_daily_data_optimized(session, date, "true", semaphore) for date in all_dates]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, pd.DataFrame) and not result.empty:
                    all_data_adj.append(result)

            # Fetch unadjusted data
            print("Fetching unadjusted data...")
            tasks = [self.fetch_daily_data_optimized(session, date, "false", semaphore) for date in all_dates]
            results = await asyncio.gather(*tasks, return_exceptions=True)

            for result in results:
                if isinstance(result, pd.DataFrame) and not result.empty:
                    # Add _ua suffix
                    result = result.rename(columns={
                        col: col + '_ua' if col not in ['date', 'ticker'] else col
                        for col in result.columns
                    })
                    all_data_unadj.append(result)

        fetch_time = time.time() - fetch_start
        self.performance_metrics['fetch_time'] = fetch_time

        if not all_data_adj or not all_data_unadj:
            print("❌ No data fetched")
            return

        # Combine data
        df_adj = pd.concat(all_data_adj, ignore_index=True)
        df_unadj = pd.concat(all_data_unadj, ignore_index=True)

        print(f"✅ Phase 1 complete: {len(df_adj)} adj + {len(df_unadj)} unadj records")
        print(f"⏱️  Fetch time: {fetch_time:.1f}s")

        # PHASE 2: Enhanced volume/price filtering
        print(f"\n🔍 PHASE 2: Enhanced volume/price filtering...")
        filter_start = time.time()

        # Merge adjusted and unadjusted data
        df_combined = pd.merge(df_adj, df_unadj, on=['date', 'ticker'], how='inner')
        print(f"✅ Combined: {len(df_combined)} records")

        # Apply volume/price filters with historical context
        df_filtered = self.apply_volume_price_filters(df_combined)

        filter_time = time.time() - filter_start
        self.performance_metrics['filter_time'] = filter_time

        print(f"✅ Phase 2 complete: {len(df_filtered)} records passed volume/price filters")
        print(f"⏱️  Filter time: {filter_time:.1f}s")

        if df_filtered.empty:
            print("❌ No records passed volume/price filtering")
            return

        # PHASE 3: Full indicator calculation and LC pattern detection
        print(f"\n🔍 PHASE 3: Full technical analysis...")
        analysis_start = time.time()

        # Compute full indicators
        df_with_indicators = self.compute_full_indicators(df_filtered)

        # Filter to analysis period for pattern detection
        analysis_start_date = pd.to_datetime(analysis_dates[0]).date()
        analysis_end_date = pd.to_datetime(analysis_dates[-1]).date()

        df_analysis = df_with_indicators[
            (df_with_indicators['date'] >= analysis_start_date) &
            (df_with_indicators['date'] <= analysis_end_date)
        ].copy()

        print(f"📈 Analyzing {len(df_analysis)} records in target period")

        # Apply final LC pattern detection
        lc_results = self.detect_lc_patterns_final(df_analysis)

        analysis_time = time.time() - analysis_start
        self.performance_metrics['analysis_time'] = analysis_time

        # RESULTS
        total_time = time.time() - start_time
        self.performance_metrics['total_time'] = total_time

        print(f"\n🎯 SCAN COMPLETE!")
        print(f"=" * 60)

        if not lc_results.empty:
            print(f"🎉 SUCCESS! Found {len(lc_results)} LC patterns!")

            # Performance summary
            print(f"\n⚡ PERFORMANCE METRICS:")
            print(f"📊 Total execution time: {total_time:.1f}s")
            print(f"🔍 Data fetch time: {fetch_time:.1f}s")
            print(f"🚀 Filtering time: {filter_time:.1f}s")
            print(f"📈 Analysis time: {analysis_time:.1f}s")
            print(f"📋 Records processed: {len(df_combined):,}")
            print(f"🎯 Filtering efficiency: Stage1({self.filtered_counts['stage1']:,}) → Stage2({self.filtered_counts['stage2']:,}) → Stage3({self.filtered_counts['stage3']:,})")

            # Show results
            display_cols = ['date', 'ticker', 'c', 'c_ua', 'v', 'v_ua', 'high_pct_chg', 'high_chg_atr', 'dollar_volume']
            available_cols = [col for col in display_cols if col in lc_results.columns]
            results_display = lc_results[available_cols].round(3)

            print(f"\n📈 LC PATTERN RESULTS:")
            print("=" * 100)
            print(tabulate(results_display, headers=results_display.columns, tablefmt='grid', floatfmt='.3f'))

            # Save results
            output_file = f"lc_optimized_results_{datetime.now().strftime('%Y%m%d_%H%M%S')}.csv"
            lc_results.to_csv(output_file, index=False)
            print(f"\n💾 Results saved to: {output_file}")

            # Summary statistics
            print(f"\n📊 SUMMARY STATISTICS:")
            print(f"✅ LC patterns found: {len(lc_results)}")
            print(f"📅 Date range: {lc_results['date'].min()} to {lc_results['date'].max()}")
            print(f"🏢 Unique tickers: {lc_results['ticker'].nunique()}")
            print(f"💰 Avg price: ${lc_results['c'].mean():.2f}")
            print(f"📊 Avg volume: {lc_results['v'].mean():,.0f}")
            print(f"📈 Avg high % change: {lc_results['high_pct_chg'].mean()*100:.1f}%")
            print(f"💵 Avg dollar volume: ${lc_results['dollar_volume'].mean():,.0f}")

            if 'v_surge_20' in lc_results.columns:
                print(f"🚀 Avg volume surge (20d): {lc_results['v_surge_20'].mean():.1f}x")

        else:
            print("❌ No LC patterns found in analysis period")
            print("This could indicate:")
            print("• Market conditions not favorable for LC patterns")
            print("• Filters too aggressive for current market")
            print("• Need to adjust criteria or expand date range")

            # Still show performance metrics
            print(f"\n⚡ PERFORMANCE METRICS:")
            print(f"📊 Total execution time: {total_time:.1f}s")
            print(f"📋 Records processed: {len(df_combined):,}")
            print(f"🎯 Filtering efficiency: Stage1({self.filtered_counts['stage1']:,}) → Stage2({self.filtered_counts['stage2']:,}) → Stage3({self.filtered_counts['stage3']:,})")

def main():
    """Main execution function"""
    print("🚀 LC D2 Scanner - OPTIMIZED FINAL VERSION")
    print("=" * 60)
    print("🎯 3-Stage Filtering: Basic → Volume/Price → Full LC Pattern")
    print("⚡ Max Threading + Enhanced Pre-filtering")
    print("📊 Full Ticker Universe Scanning")

    scanner = LCOptimizedScanner()

    try:
        asyncio.run(scanner.run_optimized_scan())

    except KeyboardInterrupt:
        print("\n❌ Scan interrupted by user")
    except Exception as e:
        print(f"\n❌ Scan failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    main()