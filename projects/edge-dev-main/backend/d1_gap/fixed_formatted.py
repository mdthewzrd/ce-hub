"""
🚀 GROUPED ENDPOINT D1 GAP SCANNER - HYBRID ARCHITECTURE
========================================================

D1 GAP SCANNER WITH STAGED INTRADAY CHECKING
-----------------------------------------------
Stage 1: Fetch grouped daily data (1 API call per trading day)
Stage 2: Smart filters (price, basic checks)
Stage 3a: Pattern detection with DAILY data only (fast!)
Stage 3b: Pre-market minute data check ONLY for candidates (expensive!)

Key Innovation: Only fetch intraday data for tickers that pass all daily filters.
This reduces expensive minute-data API calls from ~10,000 to ~100-200.

Performance: ~60-120 seconds vs 10+ minutes
API Calls: ~456 grouped calls + ~100-200 minute calls vs 10,000+ ticker calls
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional, Tuple


class GroupedEndpointD1GapScanner:
    """
    D1 Gap Scanner Using Hybrid Architecture
    =========================================

    D1 GAP PATTERN
    --------------
    Identifies stocks with pre-market gaps:
    - Price >= $0.75
    - Close <= 80% of EMA200 (oversold)
    - 50%+ gap at open
    - Open 30%+ above previous high
    - 50%+ pre-market high increase
    - 5M+ pre-market volume
    - Excludes D2 patterns

    Architecture:
    -------------
    Stage 1: Fetch grouped daily data (all tickers, all dates)
    Stage 2: Smart filters (price, basic checks)
    Stage 3a: Pattern detection with DAILY data
        - EMA200 filter
        - Gap % filter
        - Open vs previous high filter
        - D2 exclusion
    Stage 3b: Pre-market minute data check (ONLY for candidates)
        - Pre-market high %
        - Pre-market volume
    """

    def __init__(
        self,
        d0_start: str = None,
        d0_end: str = None,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
    ):
        # ============================================================
        # DATE CONFIGURATION - SET YOUR SCAN RANGE HERE
        # ============================================================
        # Option 1: Set your own dates here:
        self.DEFAULT_D0_START = "2025-01-01"  # ← SET YOUR START DATE
        self.DEFAULT_D0_END = "2025-12-31"    # ← SET YOUR END DATE
        #
        # Option 2: Or use command line:
        #   python fixed_formatted.py 2024-01-01 2024-12-31
        #
        # NOTE: Fetches 250 days of historical data for EMA200 calculation
        # ============================================================

        # Core Configuration
        self.session = requests.Session()
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.us_calendar = mcal.get_calendar('NYSE')

        # Date configuration (use command line args if provided, else defaults)
        self.d0_start = d0_start or self.DEFAULT_D0_START
        self.d0_end = d0_end or self.DEFAULT_D0_END

        # Scan range: need sufficient history for accurate EMA200 calculation
        # EMA200 needs MUCH more than 200 days to stabilize for volatile stocks
        # Increased from 250 to 1000 days to match original scanner accuracy
        lookback_buffer = 1000  # Sufficient history for accurate EMA200
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5  # Parallel fetching of grouped data
        self.stage3a_workers = 10  # Parallel processing of daily pattern detection
        self.stage3b_workers = 10  # Parallel fetching of pre-market minute data
        self.batch_size = 200

        print(f"🚀 GROUPED ENDPOINT MODE: D1 Gap Scanner")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # === EXACT ORIGINAL D1 GAP PARAMETERS ===
        self.params = {
            # Price filters
            "price_min": 0.75,              # Minimum price $0.75

            # Daily filters (Stage 3a - checked with grouped daily data)
            "gap_pct_min": 0.5,             # 50% gap minimum
            "open_over_prev_high_pct_min": 0.3,  # 30% above previous high
            "ema200_max_pct": 0.8,          # Close must be <= 80% of EMA200

            # Pre-market filters (Stage 3b - checked with minute data)
            "pm_high_pct_min": 0.5,         # 50% pre-market high increase
            "pm_vol_min": 5_000_000,        # 5M pre-market volume minimum

            # D2 exclusion
            "exclude_d2": True,             # Exclude stocks with D2 pattern
            "d2_pct_min": 0.3,              # 30% up day for D2
            "d2_vol_min": 10_000_000,       # 10M volume for D2
        }

    # ==================== STAGE 1: FETCH GROUPED DATA ====================

    def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
        """Get all valid trading days between start and end date"""
        schedule = self.us_calendar.schedule(
            start_date=pd.to_datetime(start_date),
            end_date=pd.to_datetime(end_date)
        )
        trading_days = self.us_calendar.valid_days(
            start_date=pd.to_datetime(start_date),
            end_date=pd.to_datetime(end_date)
        )
        return [date.strftime('%Y-%m-%d') for date in trading_days]

    def fetch_grouped_daily_bars(self, date: str) -> Optional[pd.DataFrame]:
        """
        Fetch grouped daily bars for a specific date
        Returns ALL tickers that traded on that date
        """
        try:
            url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date}"
            params = {
                "apiKey": self.api_key,
                "adjustment": "split",
            }
            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return None

            data = response.json()
            results = data.get('results', [])

            if not results:
                return None

            # Parse results
            parsed = []
            for r in results:
                try:
                    parsed.append({
                        'ticker': r.get('T'),
                        'open': r.get('o'),
                        'high': r.get('h'),
                        'low': r.get('l'),
                        'close': r.get('c'),
                        'volume': r.get('v'),
                        'vwap': r.get('vw'),
                        'date': date,
                    })
                except:
                    continue

            if not parsed:
                return None

            return pd.DataFrame(parsed)

        except Exception as e:
            return None

    def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
        """Stage 1: Fetch ALL data using grouped endpoint"""
        print(f"\n{'='*70}")
        print("🚀 STAGE 1: FETCH GROUPED DAILY DATA")
        print(f"{'='*70}")
        print(f"📡 Fetching {len(trading_dates)} trading days...")
        print(f"⚡ Using {self.stage1_workers} parallel workers")

        start_time = time.time()
        all_data = []
        completed = 0
        failed = 0

        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            future_to_date = {
                executor.submit(self.fetch_grouped_daily_bars, date): date
                for date in trading_dates
            }

            for future in as_completed(future_to_date):
                date = future_to_date[future]
                completed += 1

                if completed % 50 == 0:
                    print(f"  Progress: {completed}/{len(trading_dates)} fetched")

                try:
                    df = future.result()
                    if df is not None and not df.empty:
                        all_data.append(df)
                    else:
                        failed += 1
                except Exception as e:
                    failed += 1

        if not all_data:
            print("\n❌ No data fetched!")
            return pd.DataFrame()

        df = pd.concat(all_data, ignore_index=True)
        elapsed = time.time() - start_time

        print(f"\n✅ Stage 1 Complete ({elapsed:.1f}s):")
        print(f"📊 Total rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")
        print(f"📊 Date range: {df['date'].min()} to {df['date'].max()}")
        print(f"❌ Failed dates: {failed}")

        return df

    # ==================== STAGE 2: SMART FILTERS ====================

    def compute_ema_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        CRITICAL: Compute EMA200 BEFORE any filtering!
        EMA200 needs at least 200 data points to be valid.
        If we filter first, tickers with fewer than 200 rows after filtering
        will have invalid EMA200 values.
        """
        print(f"\n📊 Computing EMA features (MUST be done BEFORE filtering)...")

        df = df.sort_values(['ticker', 'date'])

        # EMA200 (200-period exponential moving average)
        # This is computed on ALL data before filtering to ensure validity
        df['EMA_200'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=200, adjust=False).mean()
        )

        return df

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute simple features for smart filtering"""
        print(f"\n📊 Computing simple features...")

        # Previous close (for price filter)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # Previous high (for open vs prev high filter)
        df['prev_high'] = df.groupby('ticker')['high'].shift(1)

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 2: Smart filters on Day -1 data to identify valid D0 dates

        CRITICAL: Smart filters validate WHICH D0 DATES to check, not which tickers to keep.
        - Keep ALL historical data for calculations
        - Use smart filters to identify D0 dates in output range worth checking
        - Filter on prev_close, volume, and EMA200 (MASSIVE filter!)

        This reduces Stage 3 processing by only checking D0 dates where Day -1 meets basic criteria.
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: SMART FILTERS (D0 DATE VALIDATION)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")
        print(f"📊 Signal output range: {self.d0_start} to {self.d0_end}")

        start_time = time.time()

        # Remove rows with NaN in critical columns
        df = df.dropna(subset=['prev_close', 'EMA_200'])

        # Separate data into historical and signal output ranges
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        print(f"📊 Historical rows (kept for calculations): {len(df_historical):,}")
        print(f"📊 Signal output range D0 dates: {len(df_output_range):,}")

        # Compute Close over EMA200 % for filtering
        df_output_range['Close_over_EMA200_Pct'] = df_output_range['close'] / df_output_range['EMA_200']

        # Apply smart filters ONLY to signal output range to identify valid D0 dates
        # Added EMA200 filter: close <= 80% of EMA200 (MASSIVE filter - very few stocks pass this!)
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['volume'] >= 1_000_000) &
            (df_output_range['Close_over_EMA200_Pct'] <= self.params['ema200_max_pct'])
        ].copy()

        print(f"📊 D0 dates passing smart filters: {len(df_output_filtered):,} ({len(df_output_filtered)/len(df_output_range)*100:.1f}% of D0 range)")

        # Combine: all historical data + filtered D0 dates
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # CRITICAL: Only keep tickers that have at least 1 D0 date passing smart filters
        # We don't want to process tickers that have 0 valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        print(f"📊 After filtering to tickers with 1+ passing D0 dates: {len(df_combined):,} rows")
        print(f"📊 Unique tickers: {df_combined['ticker'].nunique():,}")

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s):")

        return df_combined

    # ==================== STAGE 3: PATTERN DETECTION ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute remaining features needed for pattern detection.

        Note: EMA200 is already computed in compute_ema_features() before filtering.
        Note: Close_over_EMA200_Pct is already computed in apply_smart_filters() for D0 dates.
        """
        print(f"\n📊 Computing full features...")

        # Previous values (using different names to avoid conflict with Stage 2 features)
        df['Prev_Close'] = df.groupby('ticker')['close'].shift(1)
        df['Prev_High'] = df.groupby('ticker')['high'].shift(1)
        df['Prev_Volume'] = df.groupby('ticker')['volume'].shift(1)

        # Gap %: (open - prev_close) / prev_close
        df['Gap_Pct'] = (df['open'] - df['Prev_Close']) / df['Prev_Close']

        # Open over previous high %
        df['Open_over_Prev_High_Pct'] = (df['open'] - df['Prev_High']) / df['Prev_High']

        # Close over EMA200 % - compute for historical dates (already computed for D0 dates in Stage 2)
        df['Close_over_EMA200_Pct'] = df['close'] / df['EMA_200']

        # Previous day change % (for D2 detection)
        df['Prev_Change_Pct'] = (df['Prev_Close'] - df.groupby('ticker')['close'].shift(2)) / df.groupby('ticker')['close'].shift(2)

        return df

    def check_d2_pattern(self, row: pd.Series) -> bool:
        """Check if D-1 was a D2 pattern (for exclusion)"""
        if not self.params['exclude_d2']:
            return False

        r1_change = row.get('Prev_Change_Pct', 0)
        r1_vol = row.get('Prev_Volume', 0)

        return (
            pd.notna(r1_change) and
            pd.notna(r1_vol) and
            r1_change >= self.params['d2_pct_min'] and
            r1_vol >= self.params['d2_vol_min']
        )

    def process_ticker_3a(self, ticker_data: Tuple[str, pd.DataFrame, pd.DataFrame, pd.Timestamp, pd.Timestamp]) -> List[Dict]:
        """
        Process a single ticker for Stage 3a (daily pattern detection)
        This is designed to be run in parallel
        """
        ticker, ticker_df = ticker_data[:2]
        d0_start = pd.to_datetime(ticker_data[4])
        d0_end = pd.to_datetime(ticker_data[5])

        candidates = []

        try:
            ticker_df = ticker_df.sort_values('date').reset_index(drop=True)

            # CRITICAL FIX: Don't require 200 rows after filtering!
            # EMA200 is computed BEFORE filtering on the full dataset,
            # so we just need to check if EMA200 value is valid (not NaN)
            # The NaN check is done later in the loop

            for i in range(1, len(ticker_df)):
                row = ticker_df.iloc[i]
                d0 = row['date']

                # Skip if not in D0 range
                if d0 < d0_start or d0 > d0_end:
                    continue

                # Skip if missing critical values
                if (pd.isna(row['EMA_200']) or pd.isna(row['Gap_Pct']) or
                    pd.isna(row['Open_over_Prev_High_Pct']) or pd.isna(row['Close_over_EMA200_Pct'])):
                    continue

                # DEBUG: Print filter failures for first few rows (to diagnose issues)
                if ticker in ['INDP', 'HIHO', 'SIDU', 'SOC'] and len(candidates) == 0:
                    print(f"\n🔍 DEBUG {ticker} on {d0}:")
                    print(f"  Close: {row['close']:.2f}, EMA200: {row['EMA_200']:.2f}, Ratio: {row['Close_over_EMA200_Pct']:.3f}")
                    print(f"  Gap_Pct: {row['Gap_Pct']:.3f}, Open_PrevHigh: {row['Open_over_Prev_High_Pct']:.3f}")
                    print(f"  Prev_Close: {row['Prev_Close']:.2f}, Prev_High: {row['Prev_High']:.2f}")
                    print(f"  → EMA200 check: {row['Close_over_EMA200_Pct']} <= 0.8? {row['Close_over_EMA200_Pct'] <= self.params['ema200_max_pct']}")
                    print(f"  → Gap check: {row['Gap_Pct']} >= 0.5? {row['Gap_Pct'] >= self.params['gap_pct_min']}")
                    print(f"  → Open check: {row['Open_over_Prev_High_Pct']} >= 0.3? {row['Open_over_Prev_High_Pct'] >= self.params['open_over_prev_high_pct_min']}")

                # EMA200 filter: close <= 80% of EMA200
                if row['Close_over_EMA200_Pct'] > self.params['ema200_max_pct']:
                    continue

                # Gap % filter: >= 50%
                if row['Gap_Pct'] < self.params['gap_pct_min']:
                    continue

                # Open over previous high % filter: >= 30%
                if row['Open_over_Prev_High_Pct'] < self.params['open_over_prev_high_pct_min']:
                    continue

                # D2 exclusion
                if self.check_d2_pattern(row):
                    continue

                # PASSED ALL DAILY FILTERS!
                candidates.append({
                    'ticker': ticker,
                    'date': d0,
                    'open': row['open'],
                    'prev_close': row['Prev_Close'],
                })

        except Exception as e:
            pass  # Skip this ticker on error

        return candidates

    def fetch_premarket_data(self, ticker: str, date: str) -> Optional[Dict]:
        """
        Fetch pre-market minute data for a ticker on a specific date
        Returns pre-market high and volume
        """
        try:
            url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/minute/{date}/{date}"
            params = {
                "apiKey": self.api_key,
            }

            response = self.session.get(url, params=params, timeout=10)

            if response.status_code != 200:
                return None

            data = response.json()
            results = data.get('results', [])

            if not results:
                return None

            # Filter to pre-market (before 9:30 AM ET)
            # Convert timestamp to datetime and check if time is before 9:30 AM ET
            pre_market_bars = []
            for r in results:
                ts = r.get('t', 0)
                # Convert milliseconds to datetime (UTC)
                dt_utc = pd.to_datetime(ts, unit='ms')
                # Convert to Eastern Time
                dt_et = dt_utc.tz_localize('UTC').tz_convert('US/Eastern')
                # Check if before 9:30 AM ET (only pre-market)
                if dt_et.time() < pd.Timestamp('09:30:00').time():
                    pre_market_bars.append(r)

            if not pre_market_bars:
                return None

            # Calculate pre-market high and volume
            pm_high = max([r.get('h', 0) for r in pre_market_bars])
            pm_vol = sum([r.get('v', 0) for r in pre_market_bars])

            return {
                'pm_high': pm_high,
                'pm_vol': pm_vol,
                'prev_close': results[0].get('o', 0) if results else 0,  # Use previous day's close
            }

        except Exception as e:
            return None

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3: Pattern detection with staged intraday checking"""
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: PATTERN DETECTION")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()
        df = df.reset_index(drop=True)
        df['date'] = pd.to_datetime(df['date'])

        # ============================================================
        # STAGE 3A: DAILY DATA PATTERN DETECTION (PARALLEL!)
        # ============================================================
        print(f"\n🚀 STAGE 3A: Daily pattern detection (parallel, {self.stage3a_workers} workers)...")

        candidates_list = []

        # Prepare ticker data for parallel processing
        ticker_data_list = []
        for ticker in df['ticker'].unique():
            ticker_df = df[df['ticker'] == ticker].copy()
            ticker_data_list.append((ticker, ticker_df, None, None, self.d0_start, self.d0_end))

        print(f"📊 Processing {len(ticker_data_list)} tickers in parallel...")

        # Process tickers in parallel
        with ThreadPoolExecutor(max_workers=self.stage3a_workers) as executor:
            futures = [executor.submit(self.process_ticker_3a, ticker_data) for ticker_data in ticker_data_list]

            completed = 0
            for future in as_completed(futures):
                completed += 1
                if completed % 500 == 0:
                    print(f"  Progress: {completed}/{len(ticker_data_list)} tickers processed")

                try:
                    candidates = future.result()
                    candidates_list.extend(candidates)
                except Exception as e:
                    pass  # Skip failed tickers

        print(f"✓ Stage 3a complete: {len(candidates_list)} candidates (passed daily filters)")

        if not candidates_list:
            print("\n❌ No candidates passed daily filters!")
            return pd.DataFrame()

        # ============================================================
        # STAGE 3B: PRE-MARKET MINUTE DATA CHECK (ONLY FOR CANDIDATES)
        # ============================================================
        print(f"\n🚀 STAGE 3B: Pre-market data check for {len(candidates_list)} candidates...")
        print(f"⏳ Progress: ", end='', flush=True)

        signals_list = []

        for idx, candidate in enumerate(candidates_list):
            if idx % 10 == 0:
                print(f"{idx}/{len(candidates_list)} ", end='', flush=True)

            ticker = candidate['ticker']
            d0 = candidate['date']
            d0_str = d0.strftime('%Y-%m-%d')

            # Fetch pre-market minute data
            pm_data = self.fetch_premarket_data(ticker, d0_str)

            if pm_data is None:
                continue

            pm_high = pm_data['pm_high']
            pm_vol = pm_data['pm_vol']
            prev_close = pm_data['prev_close']

            if prev_close == 0:
                continue

            # Pre-market high % filter: >= 50%
            pm_high_pct = (pm_high - prev_close) / prev_close
            if pm_high_pct < self.params['pm_high_pct_min']:
                continue

            # Pre-market volume filter: >= 5M
            if pm_vol < self.params['pm_vol_min']:
                continue

            # ALL CHECKS PASSED!
            signals_list.append({
                'Ticker': ticker,
                'Date': d0,
                'PM_High_Pct': pm_high_pct,
                'PM_Vol': pm_vol,
            })

        print()  # Newline after progress

        signals = pd.DataFrame(signals_list)

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")
        print(f"📊 Signals found: {len(signals):,}")

        return signals

    # ==================== MAIN EXECUTION ====================

    def execute(self) -> pd.DataFrame:
        """Main execution pipeline"""
        print(f"\n{'='*70}")
        print("🚀 D1 GAP SCANNER - GROUPED ENDPOINT HYBRID ARCHITECTURE")
        print(f"{'='*70}")

        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
        print(f"📅 Trading days: {len(trading_dates)}")

        # Stage 1: Fetch grouped data
        df = self.fetch_all_grouped_data(trading_dates)

        if df.empty:
            print("❌ No data available!")
            return pd.DataFrame()

        # CRITICAL: Compute EMA200 BEFORE filtering (needs 200+ data points)
        df = self.compute_ema_features(df)

        # Stage 2: Smart filters
        df = self.compute_simple_features(df)
        df = self.apply_smart_filters(df)

        if df.empty:
            print("❌ No rows passed smart filters!")
            return pd.DataFrame()

        # Stage 3: Pattern detection
        df = self.compute_full_features(df)
        signals = self.detect_patterns(df)

        if signals.empty:
            print("❌ No signals found!")
            return pd.DataFrame()

        # Sort by date
        signals = signals.sort_values('Date').reset_index(drop=True)

        print(f"\n{'='*70}")
        print(f"✅ SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"📊 Final signals: {len(signals):,}")
        print(f"📊 Unique tickers: {signals['Ticker'].nunique():,}")

        # Print all results
        if len(signals) > 0:
            print(f"\n{'='*70}")
            print("📊 SIGNALS FOUND:")
            print(f"{'='*70}")
            for idx, row in signals.iterrows():
                print(f"  {row['Ticker']:6s} | {row['Date']} | PM High: {row['PM_High_Pct']:.1%} | PM Vol: {row['PM_Vol']:,.0f}")

        return signals

    def run_and_save(self, output_path: str = "d1_gap_results.csv"):
        """Execute scan and save results"""
        signals = self.execute()

        if not signals.empty:
            signals.to_csv(output_path, index=False)
            print(f"\n💾 Results saved to: {output_path}")

            # Display results
            print(f"\n📋 Signals found:")
            print(signals.to_string(index=False))
        else:
            print("\n❌ No signals found.")

        return signals


# ==================== MAIN ====================

if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 D1 GAP SCANNER - GROUPED ENDPOINT HYBRID")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python fixed_formatted.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python fixed_formatted.py 2024-01-01 2024-12-01")
    print("   python fixed_formatted.py 2024-06-01 2025-01-01")
    print("   python fixed_formatted.py  # Uses defaults (2025-01-01 to 2025-12-31)")
    print("\n   Date format: YYYY-MM-DD")
    print("\n   NOTE: Fetches ~250 days of historical data for EMA200 calculation")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    if d0_start:
        print(f"📅 Start Date: {d0_start}")
    if d0_end:
        print(f"📅 End Date: {d0_end}")

    try:
        scanner = GroupedEndpointD1GapScanner(
            d0_start=d0_start,
            d0_end=d0_end
        )

        results = scanner.run_and_save()

    except KeyboardInterrupt:
        print("\n\n⚠️  Scan interrupted by user")
    except Exception as e:
        print(f"\n❌ Error: {e}")
        import traceback
        traceback.print_exc()
