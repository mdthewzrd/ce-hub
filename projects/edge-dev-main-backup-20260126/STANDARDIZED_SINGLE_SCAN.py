"""
═══════════════════════════════════════════════════════════════════════════════
STANDARDIZED SINGLE-SCAN SCANNER TEMPLATE
═══════════════════════════════════════════════════════════════════════════════

EdgeDev 3-Stage Architecture - SINGLE-SCAN Structure

This template matches the EXACT structure of your working Backside B scanner.
Only the pattern detection logic in process_ticker_3() changes.

USAGE:
    python your_scanner.py                    # Uses default dates
    python your_scanner.py 2024-01-01 2024-12-31  # Custom date range

FETCHES: ALL tickers from NYSE + NASDAQ + ETFs (~12,000+ tickers)
API KEY: Hardcoded (no need to specify)
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional, Tuple


class SingleScanScanner:
    """
    Standardized Single-Scan Scanner Template

    Structure: Uses process_ticker_3() for individual ticker processing
    Best for: Complex per-ticker logic, single pattern detection

    This matches your Backside B template EXACTLY - only pattern logic changes.
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",  # YOUR HARDCODED KEY
        d0_start: str = None,
        d0_end: str = None
    ):
        """
        Initialize scanner with your API key and date range
        """
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
        #   python your_scanner.py 2024-01-01 2024-12-31
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
        # Adjust lookback_buffer based on your pattern's needs
        lookback_buffer = 1050  # CHANGE THIS based on your pattern
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5   # Parallel fetching of grouped data
        self.stage3_workers = 10  # Parallel processing of pattern detection

        print(f"🚀 GROUPED ENDPOINT MODE: Single-Scan Scanner")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # ==================== CUSTOMIZE YOUR PARAMETERS HERE ====================
        self.params = {
            # Smart filter parameters (Stage 2)
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,  # $30M daily value
            "price_range_min": 0.50,
            "volume_min": 1_000_000,

            # Your custom pattern parameters go here
            # Example:
            # "gap_min": 0.03,
            # "volume_surge_mult": 1.5,
        }
        # =======================================================================

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

        THIS FETCHES:
        - ALL NYSE stocks
        - ALL NASDAQ stocks
        - ALL ETFs
        (~12,000+ tickers automatically)
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
        """
        Fetch ALL tickers that traded on a specific date

        This is where the magic happens - ONE API call returns ALL tickers!
        """
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

    # ==================== STAGE 2: SMART FILTERS ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute simple features needed for smart filtering

        Only computes basic features to identify which D0 dates are worth checking.
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
            (df_output_range['price_range'] >= self.params['price_range_min']) &
            (df_output_range['volume'] >= self.params['volume_min'])
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

        ⚠️  Rule #5 Compliance: Compute ALL features BEFORE dropna()

        Add your custom features here based on what your pattern needs.
        """
        print(f"\n📊 Computing full features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # ==================== BASIC FEATURES ====================

        # Previous close
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['prev_close_2'] = df.groupby('ticker')['close'].shift(2)

        # Previous high/low
        df['prev_high'] = df.groupby('ticker')['high'].shift(1)
        df['prev_low'] = df.groupby('ticker')['low'].shift(1)

        # Gap
        df['gap'] = (df['open'] / df['prev_close']) - 1

        # Range
        df['range'] = df['high'] - df['low']
        df['prev_range'] = df.groupby('ticker')['range'].shift(1)

        # Volume features
        df['VOL_AVG'] = df.groupby('ticker')['volume'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )

        # ==================== ADD YOUR CUSTOM FEATURES HERE ====================
        # Examples:
        #
        # # EMA features
        # for period in [8, 21, 34, 55]:
        #     df[f'EMA_{period}'] = df.groupby('ticker')['close'].transform(
        #         lambda x: x.ewm(span=period, adjust=False).mean()
        #     )
        #
        # # ATR (True Range)
        # df['TR'] = np.maximum(
        #     df['high'] - df['low'],
        #     np.maximum(
        #         abs(df['high'] - df['prev_close']),
        #         abs(df['low'] - df['prev_close'])
        #     )
        # )
        # df['ATR'] = df.groupby('ticker')['TR'].transform(
        #     lambda x: x.rolling(window=14, min_periods=14).mean()
        # )
        #
        # # Slope (momentum)
        # df['Slope_5d'] = df.groupby('ticker')['close'].transform(
        #     lambda x: ((x - x.shift(5)) / x.shift(5)) * 100
        # )
        # =======================================================================

        print(f"   ✅ Computed {len(df.columns)} features")

        return df

    def process_ticker_3(self, ticker_data: tuple) -> list:
        """
        ═════════════════════════════════════════════════════════════════════════
        🎯 YOUR PATTERN DETECTION LOGIC GOES HERE
        ═════════════════════════════════════════════════════════════════════════

        This is where you insert your custom pattern detection logic.
        Everything else stays the same - only this method changes.

        Args:
            ticker_data: (ticker, ticker_df, d0_start, d0_end)

        Returns:
            List of signal dictionaries

        Example Structure:
        """
        ticker, ticker_df, d0_start, d0_end = ticker_data

        signals = []

        try:
            ticker_df = ticker_df.sort_values('date').reset_index(drop=True)

            if len(ticker_df) < 100:
                return signals

            # Convert dates
            ticker_df['date'] = pd.to_datetime(ticker_df['date'])
            d0_start_dt = pd.to_datetime(d0_start)
            d0_end_dt = pd.to_datetime(d0_end)

            # ==================== YOUR PATTERN LOGIC HERE ====================
            # Example: Detect gap up patterns with volume surge

            for i in range(2, len(ticker_df)):
                row = ticker_df.iloc[i]
                d0 = row['date']

                # Skip if not in D0 range
                if d0 < d0_start_dt or d0 > d0_end_dt:
                    continue

                # Check for required features
                if pd.isna(row['gap']) or pd.isna(row['VOL_AVG']):
                    continue

                # YOUR PATTERN RULES HERE
                # Example: Gap up >= 3% with volume >= 1.5x average
                if row['gap'] >= 0.03 and row['volume'] >= row['VOL_AVG'] * 1.5:
                    signals.append({
                        'Ticker': ticker,
                        'Date': d0,
                        'Close': row['close'],
                        'Volume': row['volume'],
                        'Gap': row['gap'],
                    })

            # ==================================================================

        except Exception as e:
            pass  # Skip this ticker on error

        return signals

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 3: Apply pattern detection - PARALLEL PROCESSING

        Uses process_ticker_3() for per-ticker pattern detection.
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
        Main execution pipeline - matches your Backside B template EXACTLY
        """
        print(f"\n{'='*70}")
        print("🚀 SINGLE-SCAN SCANNER - GROUPED ENDPOINT ARCHITECTURE")
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

    def run_and_save(self, output_path: str = "single_scan_results.csv"):
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
    print("🚀 SINGLE-SCAN SCANNER - GROUPED ENDPOINT")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python single_scan_template.py                    # Uses default dates")
    print("   python single_scan_template.py 2024-01-01 2024-12-31  # Custom dates")
    print("\n   Examples:")
    print("   python single_scan_template.py 2024-01-01 2024-12-01")
    print("   python single_scan_template.py 2024-06-01 2025-01-01")
    print("   python single_scan_template.py  # Uses defaults")
    print("\n   Date format: YYYY-MM-DD")
    print("\n   FETCHES: All NYSE + NASDAQ + ETFs (~12,000+ tickers)")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    if d0_start:
        print(f"📅 Start Date: {d0_start}")
    if d0_end:
        print(f"📅 End Date: {d0_end}")

    scanner = SingleScanScanner(
        d0_start=d0_start,
        d0_end=d0_end
    )

    results = scanner.run_and_save()

    print(f"\n✅ Done!")
