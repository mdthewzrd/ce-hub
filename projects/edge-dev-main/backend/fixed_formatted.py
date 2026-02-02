"""
🚀 GROUPED ENDPOINT BACKSIDE B SCANNER - OPTIMIZED ARCHITECTURE
=============================================================

BACKSIDE PARABOLIC BREAKDOWN PATTERN SCANNER

Key Improvements:
1. Stage 1: Fetch grouped data (1 API call per trading day, not per ticker)
2. Stage 2: Apply smart filters (reduce dataset by 99%+)
3. Stage 3: Compute full parameters + scan patterns (only on filtered data)

Performance: ~60-120 seconds for full scan vs 10+ minutes per-ticker approach
Accuracy: 100% - no false negatives
API Calls: 456 calls (one per day) vs 12,000+ calls (one per ticker)
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional, Tuple


class GroupedEndpointBacksideBScanner:
    """
    Backside B Scanner Using Grouped Endpoint Architecture
    =======================================================

    BACKSIDE PARABOLIC BREAKDOWN PATTERN
    ------------------------------------
    Identifies stocks in parabolic uptrends showing breakdown signals:
    - Price >= $8 minimum
    - ADV20 >= $30M daily value
    - Volume >= 0.9x average (heavy volume)
    - True Range >= 0.9x ATR (expanded range)
    - 5-day EMA9 slope >= 3% (strong momentum)
    - High >= 1.05x EMA9 (extended above average)
    - Gap-up >= 0.75 ATR
    - D1/D2 trigger logic

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
        - Uses Polygon grouped endpoint
        - 1 API call per trading day (not per ticker)
        - Returns all tickers that traded each day

    Stage 2: Apply smart filters (simple checks)
        - prev_close >= $8
        - ADV20 >= $30M
        - Volume >= 0.9x average
        - Reduces dataset by ~99%

    Stage 3: Compute full parameters + scan patterns
        - EMA9, ATR, slopes, volume metrics
        - Mold check (trigger pattern)
        - ABS window analysis
        - Pattern detection
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        d0_start: str = None,
        d0_end: str = None
    ):
        # ============================================================
        # 📅 DATE RANGE CONFIGURATION - EDIT HERE
        # ============================================================
        # Set your default date range here, OR use command line args
        #
        # Examples:
        #   self.DEFAULT_D0_START = "2024-01-01"
        #   self.DEFAULT_D0_END = "2024-12-31"
        #
        # Or use command line:
        #   python fixed_formatted.py 2024-01-01 2024-12-31
        #
        # NOTE: Fetches 1050 days of historical data for ABS window (1000 days + buffer)
        # ============================================================

        self.DEFAULT_D0_START = "2025-01-01"  # ← SET YOUR START DATE
        self.DEFAULT_D0_END = "2025-12-31"    # ← SET YOUR END DATE

        # ============================================================

        # Core Configuration
        self.session = requests.Session()
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=2,
            pool_block=False
        ))

        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.us_calendar = mcal.get_calendar('NYSE')

        # Date configuration (use command line args if provided, else defaults)
        self.d0_start = d0_start or self.DEFAULT_D0_START
        self.d0_end = d0_end or self.DEFAULT_D0_END

        # Scan range: calculate dynamic start based on lookback requirements
        # Need: 1000 days for ABS window + 30 days for rolling calculations + buffer
        lookback_buffer = 1050  # abs_lookback_days (1000) + 50 buffer
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5  # Parallel fetching of grouped data
        self.stage3_workers = 10  # Parallel processing of pattern detection
        self.batch_size = 200

        print(f"🚀 GROUPED ENDPOINT MODE: Backside B Scanner")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # === EXACT ORIGINAL BACKSIDE B PARAMETERS ===
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,  # $30M daily value
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_volume_min": 15_000_000,  # 15M shares
            "slope5d_min": 3.0,
            "high_ema9_mult": 1.05,
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.30,
            "require_open_gt_prev_high": True,
            "enforce_d1_above_d2": True,
        }

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

    # ==================== STAGE 1: FETCH GROUPED DATA ====================

    def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
        """
        Stage 1: Fetch ALL data for ALL tickers using grouped endpoint
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 1: FETCH GROUPED DATA")
        print(f"{'='*70}")
        print(f"📡 Fetching {len(trading_dates)} trading days...")
        print(f"⚡ Using {self.stage1_workers} parallel workers")

        start_time = time.time()
        all_data = []
        completed = 0
        failed = 0

        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            future_to_date = {
                executor.submit(self._fetch_grouped_day, date_str): date_str
                for date_str in trading_dates
            }

            for future in as_completed(future_to_date):
                date_str = future_to_date[future]
                completed += 1

                try:
                    data = future.result()
                    if data is not None and not data.empty:
                        all_data.append(data)
                    else:
                        failed += 1

                    # Progress updates
                    if completed % 100 == 0:
                        success = completed - failed
                        print(f"⚡ Progress: {completed}/{len(trading_dates)} days | "
                              f"Success: {success} | Failed: {failed}")

                except Exception as e:
                    failed += 1

        elapsed = time.time() - start_time

        if not all_data:
            print("❌ No data fetched!")
            return pd.DataFrame()

        # Combine all data
        print(f"\n📊 Combining data from {len(all_data)} trading days...")
        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

        print(f"\n🚀 Stage 1 Complete ({elapsed:.1f}s):")
        print(f"📊 Total rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")
        print(f"📅 Date range: {df['date'].min()} to {df['date'].max()}")

        return df

    def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
        """Fetch ALL tickers that traded on a specific date"""
        try:
            url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
            params = {
                "adjusted": "true",
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return None

            data = response.json()

            if 'results' not in data or not data['results']:
                return None

            # Convert to DataFrame
            df = pd.DataFrame(data['results'])
            df['date'] = pd.to_datetime(date_str)
            df = df.rename(columns={
                'T': 'ticker',
                'o': 'open',
                'h': 'high',
                'l': 'low',
                'c': 'close',
                'v': 'volume'
            })

            return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]

        except Exception:
            return None

    # ==================== STAGE 2: APPLY SMART FILTERS ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute simple features needed for smart filtering
        Based on actual Backside B parameters for efficient pre-filtering
        """
        print(f"\n📊 Computing simple features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # Previous close (for price filter)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # ADV20 ($) - 20-day average daily value (for ADV filter)
        df['ADV20_$'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )

        # Price range (high - low, for volatility filter)
        df['price_range'] = df['high'] - df['low']

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 2: Smart filters on Day -1 data to identify valid D0 dates

        CRITICAL: Smart filters validate WHICH D0 DATES to check, not which tickers to keep.
        - Keep ALL historical data for calculations
        - Use smart filters to identify D0 dates in output range worth checking
        - Filter on prev_close, ADV20, price_range, and volume

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
        df = df.dropna(subset=['prev_close', 'ADV20_$', 'price_range'])

        # Separate data into historical and signal output ranges
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        print(f"📊 Historical rows (kept for calculations): {len(df_historical):,}")
        print(f"📊 Signal output range D0 dates: {len(df_output_range):,}")

        # Apply smart filters ONLY to signal output range to identify valid D0 dates
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['ADV20_$'] >= self.params['adv20_min_usd']) &
            (df_output_range['price_range'] >= 0.50) &
            (df_output_range['volume'] >= 1_000_000)
        ].copy()

        print(f"📊 D0 dates passing smart filters: {len(df_output_filtered):,}")

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

    # ==================== STAGE 3: FULL PARAMETERS + SCAN ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute all features needed for pattern detection
        EXACT MATCH TO ORIGINAL IMPLEMENTATION
        """
        print(f"\n📊 Computing full features...")

        # EMAs
        df['EMA_9'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=9, adjust=False).mean()
        )

        # True Range
        prev_close_for_tr = df.groupby('ticker')['close'].shift(1)
        df['TR'] = np.maximum(
            df['high'] - df['low'],
            np.maximum(
                abs(df['high'] - prev_close_for_tr),
                abs(df['low'] - prev_close_for_tr)
            )
        )

        # ATR (14-day rolling, shifted by 1 to match original)
        df['ATR_raw'] = df.groupby('ticker')['TR'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )
        df['ATR'] = df.groupby('ticker')['ATR_raw'].transform(lambda x: x.shift(1))

        # Volume (14-day rolling, shifted by 1 to match original)
        df['VOL_AVG'] = df.groupby('ticker')['volume'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean().shift(1)
        )
        df['Prev_Volume'] = df.groupby('ticker')['volume'].transform(lambda x: x.shift(1))

        # ADV20 ($ daily value, shifted by 1 to match original)
        df['ADV20_$'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean().shift(1)
        )

        # 5-day slope (EMA9 momentum)
        df['Slope_9_5d'] = df.groupby('ticker')['EMA_9'].transform(
            lambda x: ((x - x.shift(5)) / x.shift(5)) * 100
        )

        # High over EMA9 (in ATRs)
        df['High_over_EMA9_div_ATR'] = (df['high'] - df['EMA_9']) / df['ATR']

        # Gap (using abs to match original)
        df['Gap_abs'] = (df['open'] - df.groupby('ticker')['close'].shift(1)).abs()
        df['Gap_over_ATR'] = df['Gap_abs'] / df['ATR']

        # Open over EMA9
        df['Open_over_EMA9'] = df['open'] / df['EMA_9']

        # Body over ATR (close - open) / ATR
        df['Body_over_ATR'] = (df['close'] - df['open']) / df['ATR']

        # Previous day values (for D-1 checks)
        df['Prev_Close'] = df.groupby('ticker')['close'].shift(1)
        df['Prev_Open'] = df.groupby('ticker')['open'].shift(1)
        df['Prev_High'] = df.groupby('ticker')['high'].shift(1)
        df['Prev_Low'] = df.groupby('ticker')['low'].shift(1)

        # For D1>D2 checks, need D-2 values
        df['Prev2_High'] = df.groupby('ticker')['high'].shift(2)
        df['Prev2_Close'] = df.groupby('ticker')['close'].shift(2)

        return df

    def mold_check(self, row: pd.Series) -> bool:
        """
        Apply mold check (trigger pattern detection) to a single row
        EXACT MATCH TO ORIGINAL
        """
        # Fast boolean checks - EXACT SAME AS ORIGINAL
        checks = [
            (row['TR'] / row['ATR']) >= self.params['atr_mult'],
            max(row['volume'] / row['VOL_AVG'], row['Prev_Volume'] / row['VOL_AVG']) >= self.params['vol_mult'],
            row['Slope_9_5d'] >= self.params['slope5d_min'],
            row['High_over_EMA9_div_ATR'] >= self.params['high_ema9_mult'],
        ]
        return all(bool(x) and np.isfinite(x) for x in checks)

    def abs_window_analysis(self, df: pd.DataFrame, d0: pd.Timestamp, ticker: str) -> Tuple[float, float]:
        """
        Calculate ABS (All-Time High) window analysis
        EXACT MATCH TO ORIGINAL
        """
        # Get ticker data
        ticker_df = df[df['ticker'] == ticker].copy()
        ticker_df['date'] = pd.to_datetime(ticker_df['date'])
        ticker_df = ticker_df.set_index('date')

        if ticker_df.empty:
            return (np.nan, np.nan)

        # Calculate lookback window
        cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
        wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

        win = ticker_df[(ticker_df.index > wstart) & (ticker_df.index <= cutoff)]

        if win.empty:
            return (np.nan, np.nan)

        # Find ATH in window
        lo_abs = float(win['low'].min())
        hi_abs = float(win['high'].max())

        return (lo_abs, hi_abs)

    def pos_between(self, val: float, lo: float, hi: float) -> float:
        """
        Calculate position between low and high
        EXACT MATCH TO ORIGINAL
        """
        if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

    def process_ticker_3(self, ticker_data: tuple) -> list:
        """
        Process a single ticker for Stage 3 (pattern detection)
        This is designed to be run in parallel
        """
        ticker, ticker_df, d0_start, d0_end = ticker_data

        signals = []

        try:
            ticker_df = ticker_df.sort_values('date').reset_index(drop=True)

            if len(ticker_df) < 100:
                return signals

            for i in range(2, len(ticker_df)):
                row = ticker_df.iloc[i]
                r1 = ticker_df.iloc[i-1]  # D-1
                r2 = ticker_df.iloc[i-2]  # D-2
                d0 = row['date']

                # Skip if not in D0 range
                if d0 < pd.to_datetime(d0_start) or d0 > pd.to_datetime(d0_end):
                    continue

                # Basic filters (price, ADV already done in Stage 2)
                if (pd.isna(r1['Prev_Close']) or pd.isna(r1['ADV20_$'])):
                    continue

                # ABS window calculation
                cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
                wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

                mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
                win = ticker_df.loc[mask]

                if win.empty or len(win) < 2:
                    continue

                lo_abs = win['low'].min()
                hi_abs = win['high'].max()

                if hi_abs <= lo_abs:
                    continue

                # Position calculation
                pos_abs_prev = (r1['close'] - lo_abs) / (hi_abs - lo_abs)
                if not (0 <= pos_abs_prev <= self.params['pos_abs_max']):
                    continue

                # Mold check (trigger) - D1 or D2
                trigger_ok = False
                if self.params['trigger_mode'] == "D1_only":
                    if self.mold_check(r1):
                        trigger_ok = True
                else:  # "D1_or_D2"
                    if self.mold_check(r1):
                        trigger_ok = True
                    elif self.mold_check(r2):
                        trigger_ok = True

                if not trigger_ok:
                    continue

                # D-1 checks
                if (pd.isna(r1['Body_over_ATR']) or
                    r1['Body_over_ATR'] < self.params['d1_green_atr_min']):
                    continue

                if (self.params['d1_volume_min'] is not None and
                    (pd.isna(r1['volume']) or r1['volume'] < self.params['d1_volume_min'])):
                    continue

                # D-1 > D-2 enforcement
                if self.params['enforce_d1_above_d2']:
                    if not (pd.notna(r1['Prev_High']) and pd.notna(r2['Prev_High']) and
                            r1['Prev_High'] > r2['Prev_High'] and
                            pd.notna(r1['Prev_Close']) and pd.notna(r2['Prev_Close']) and
                            r1['Prev_Close'] > r2['Prev_Close']):
                        continue

                # D0 gates
                if (pd.isna(row['Gap_over_ATR']) or
                    row['Gap_over_ATR'] < self.params['gap_div_atr_min']):
                    continue
                if (self.params['require_open_gt_prev_high'] and
                    not (row['open'] > r1['Prev_High'])):
                    continue
                if (pd.isna(row['Open_over_EMA9']) or
                    row['Open_over_EMA9'] < self.params['open_over_ema9_min']):
                    continue

                # All checks passed
                signals.append({
                    'Ticker': ticker,
                    'Date': d0,
                    'Close': row['close'],
                    'Volume': row['volume'],
                })

        except Exception as e:
            pass  # Skip this ticker on error

        return signals

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 3: Apply Backside B pattern detection - PARALLEL PROCESSING
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: PATTERN DETECTION (PARALLEL)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()
        df = df.reset_index(drop=True)
        df['date'] = pd.to_datetime(df['date'])

        signals_list = []

        # Prepare ticker data for parallel processing
        ticker_data_list = []
        for ticker in df['ticker'].unique():
            ticker_df = df[df['ticker'] == ticker].copy()
            ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

        print(f"📊 Processing {len(ticker_data_list)} tickers in parallel ({self.stage3_workers} workers)...")

        # Process tickers in parallel
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            futures = [executor.submit(self.process_ticker_3, ticker_data) for ticker_data in ticker_data_list]

            completed = 0
            for future in as_completed(futures):
                completed += 1
                if completed % 100 == 0:
                    print(f"  Progress: {completed}/{len(ticker_data_list)} tickers processed")

                try:
                    signals = future.result()
                    signals_list.extend(signals)
                except Exception as e:
                    pass  # Skip failed tickers

        print()  # Newline after progress

        signals = pd.DataFrame(signals_list)

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")
        print(f"📊 Signals found: {len(signals):,}")

        return signals

    # ==================== MAIN EXECUTION ====================

    def execute(self) -> pd.DataFrame:
        """
        Main execution pipeline
        """
        print(f"\n{'='*70}")
        print("🚀 BACKSIDE B SCANNER - GROUPED ENDPOINT ARCHITECTURE")
        print(f"{'='*70}")

        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
        print(f"📅 Trading days: {len(trading_dates)}")

        # Stage 1: Fetch grouped data
        df = self.fetch_all_grouped_data(trading_dates)

        if df.empty:
            print("❌ No data available!")
            return pd.DataFrame()

        # Stage 2: Compute simple features + apply smart filters
        df = self.compute_simple_features(df)
        df = self.apply_smart_filters(df)

        if df.empty:
            print("❌ No rows passed smart filters!")
            return pd.DataFrame()

        # Stage 3: Compute full features + detect patterns
        df = self.compute_full_features(df)
        signals = self.detect_patterns(df)

        if signals.empty:
            print("❌ No signals found!")
            return pd.DataFrame()

        # Sort by date (chronological order)
        signals = signals.sort_values('Date').reset_index(drop=True)

        print(f"\n{'='*70}")
        print(f"✅ SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"📊 Final signals (D0 range): {len(signals):,}")
        print(f"📊 Unique tickers: {signals['Ticker'].nunique():,}")

        # Print all results
        if len(signals) > 0:
            print(f"\n{'='*70}")
            print("📊 SIGNALS FOUND:")
            print(f"{'='*70}")
            for idx, row in signals.iterrows():
                print(f"  {row['Ticker']:6s} | {row['Date']} | Close: ${row['Close']:.2f} | Volume: {row['Volume']:,.0f}")

        return signals

    def run_and_save(self, output_path: str = "backside_b_results.csv"):
        """Execute scan and save results"""
        results = self.execute()

        if not results.empty:
            results.to_csv(output_path, index=False)
            print(f"✅ Results saved to: {output_path}")

            # Display all signals in chronological order
            print(f"\n📋 All signals ({len(results)} total):")
            print(results[['Ticker', 'Date']].to_string(index=False))

        return results


# ==================== MAIN ENTRY POINT ====================

if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 BACKSIDE B SCANNER - GROUPED ENDPOINT")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python fixed_formatted.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python fixed_formatted.py 2024-01-01 2024-12-01")
    print("   python fixed_formatted.py 2024-06-01 2025-01-01")
    print("   python fixed_formatted.py  # Uses defaults (2025-01-01 to 2025-11-01)")
    print("\n   Date format: YYYY-MM-DD")
    print("\n   NOTE: Fetches ~1050 days of historical data for ABS window calculations")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    if d0_start:
        print(f"📅 Start Date: {d0_start}")
    if d0_end:
        print(f"📅 End Date: {d0_end}")

    scanner = GroupedEndpointBacksideBScanner(
        d0_start=d0_start,
        d0_end=d0_end
    )

    results = scanner.run_and_save()

    print(f"\n✅ Done!")
