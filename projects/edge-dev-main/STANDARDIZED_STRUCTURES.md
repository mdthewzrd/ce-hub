# EdgeDev Standardized Structures

## Single-Scan Structure (Complete Template)

**Used by:** backside_b, a_plus_para, lc_3d_gap, d1_gap, extended_gap

**Key characteristic:** Uses `process_ticker_3()` for individual ticker processing

```python
"""
🚀 EDGEDEV SINGLE-SCAN SCANNER - STANDARDIZED STRUCTURE
========================================================

This is the MANDATORY structure for all single-pattern scanners.
Pattern-specific logic goes in process_ticker_3().

Architecture:
-----------
Stage 1: Fetch grouped data (all tickers for all dates)
Stage 2: Apply smart filters (reduce dataset by ~99%)
Stage 3: Process tickers in parallel (process_ticker_3)

Pattern Detection:
----------------
- Uses process_ticker_3() for individual ticker processing
- Each ticker processed independently
- Returns list of signals from each ticker
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional


class SingleScanScanner:
    """
    Single-Pattern Scanner - Individual Ticker Processing

    [YOUR PATTERN DESCRIPTION HERE]

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
    Stage 2: Apply smart filters (reduce dataset by ~99%)
    Stage 3: Process tickers in parallel (process_ticker_3)

    Pattern Detection:
    ----------------
    - Uses process_ticker_3() for individual ticker processing
    - Each ticker processed independently
    - Returns list of signals from each ticker
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        d0_start: str = None,
        d0_end: str = None
    ):
        """Initialize scanner with API key and date range"""

        # ============================================================
        # 📅 DATE RANGE CONFIGURATION - EDIT HERE
        # ============================================================
        self.DEFAULT_D0_START = "2024-01-01"  # ← SET YOUR START DATE
        self.DEFAULT_D0_END = datetime.now().strftime("%Y-%m-%d")  # ← SET YOUR END DATE
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

        # Date configuration
        self.d0_start = d0_start or self.DEFAULT_D0_START
        self.d0_end = d0_end or self.DEFAULT_D0_END

        # Scan range: calculate based on your lookback requirements
        lookback_buffer = 1050  # Adjust based on your pattern's needs
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5  # Parallel fetching of grouped data
        self.stage3_workers = 10  # Parallel processing of pattern detection

        print(f"🚀 SINGLE-SCAN MODE: [YOUR PATTERN NAME]")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # ============================================================
        # ⚙️  PATTERN PARAMETERS - CUSTOMIZE FOR YOUR SCANNER
        # ============================================================
        self.params = {
            # Liquidity filters
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,

            # Pattern-specific parameters
            # Add your custom parameters here
        }

    # ==================== STAGE 1: FETCH GROUPED DATA ====================

    def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
        """Get all valid NYSE trading days (skips weekends/holidays)"""
        trading_days = self.us_calendar.valid_days(
            start_date=pd.to_datetime(start_date),
            end_date=pd.to_datetime(end_date)
        )
        return [date.strftime('%Y-%m-%d') for date in trading_days]

    def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
        """
        Stage 1: Fetch ALL data for ALL tickers using grouped endpoint

        Key Features:
        - One API call per trading day (not per ticker)
        - Parallel processing with ThreadPoolExecutor
        - Timeout protection (30 seconds per request)
        - Progress reporting every 100 days
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
                completed += 1

                try:
                    data = future.result()
                    if data is not None and not data.empty:
                        all_data.append(data)
                    else:
                        failed += 1

                    # Progress reporting
                    if completed % 100 == 0:
                        success = completed - failed
                        print(f"⚡ Progress: {completed}/{len(trading_dates)} days | "
                              f"Success: {success} | Failed: {failed}")

                except Exception as e:
                    failed += 1

        elapsed = time.time() - start_time

        # Check if any data was fetched
        if not all_data:
            print("❌ No data fetched - all dates failed!")
            return pd.DataFrame()

        # Combine all data
        df = pd.concat(all_data, ignore_index=True)

        print(f"\n🚀 Stage 1 Complete ({elapsed:.1f}s):")
        print(f"📊 Total rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")

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

    # ==================== STAGE 2: SMART FILTERS ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute simple features needed for smart filtering

        CRITICAL: Compute features BEFORE any dropna!
        """
        print(f"\n📊 Computing simple features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # ✅ STEP 1: Compute features FIRST
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['ADV20_$'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )
        df['price_range'] = df['high'] - df['low']

        # ✅ STEP 2: THEN drop NaNs (columns now exist)
        df = df.dropna(subset=['prev_close', 'ADV20_$', 'price_range'])

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 2: Smart filters to reduce dataset by ~99%

        CRITICAL: Separate historical from signal output range
        - Keep ALL historical data for rolling calculations
        - Apply filters ONLY to signal output range
        - Combine back together for Stage 3
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: SMART FILTERS (D0 DATE VALIDATION)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()

        # Separate historical from signal output range
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        print(f"📊 Historical rows (kept for calculations): {len(df_historical):,}")
        print(f"📊 Signal output range D0 dates: {len(df_output_range):,}")

        # Apply smart filters ONLY to signal output range
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['ADV20_$'] >= self.params['adv20_min_usd']) &
            (df_output_range['price_range'] >= 0.50) &
            (df_output_range['volume'] >= 1_000_000)
        ].copy()

        print(f"📊 D0 dates passing smart filters: {len(df_output_filtered):,}")

        # Combine: all historical data + filtered D0 dates
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # Only keep tickers with 1+ passing D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        print(f"📊 After filtering to tickers with 1+ passing D0 dates: {len(df_combined):,} rows")
        print(f"📊 Unique tickers: {df_combined['ticker'].nunique():,}")

        elapsed = time.time() - start_time
        print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s)")

        return df_combined

    # ==================== STAGE 3: FULL FEATURES + PATTERN DETECTION ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute full features needed for pattern detection

        Add your pattern-specific features here
        """
        print(f"\n📊 Computing full features...")

        # Common features (add more as needed)
        df['EMA_9'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=9, adjust=False).mean()
        )

        df['ATR'] = df.groupby('ticker')['TR'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )

        # Add your pattern-specific features here

        return df

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 3: Parallel pattern detection using process_ticker_3

        Key Features:
        - Parallel processing with ThreadPoolExecutor
        - Individual ticker processing in process_ticker_3()
        - Progress reporting every 100 tickers
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: PATTERN DETECTION (PARALLEL)")
        print(f"{'='*70}")

        start_time = time.time()

        # Prepare ticker data for parallel processing
        ticker_data_list = []
        for ticker in df['ticker'].unique():
            ticker_df = df[df['ticker'] == ticker].copy()
            ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

        print(f"📊 Processing {len(ticker_data_list)} tickers in parallel ({self.stage3_workers} workers)...")

        # Process tickers in parallel
        signals_list = []
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            futures = [executor.submit(self.process_ticker_3, ticker_data) for ticker_data in ticker_data_list]

            completed = 0
            for future in as_completed(futures):
                completed += 1
                if completed % 100 == 0:
                    print(f"  Progress: {completed}/{len(ticker_data_list)} tickers processed")

                try:
                    signals = future.result()
                    if signals:
                        signals_list.extend(signals)
                except Exception as e:
                    pass  # Skip failed tickers gracefully

        signals = pd.DataFrame(signals_list)

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")
        if not signals.empty:
            print(f"📊 Signals found: {len(signals):,}")

        return signals

    def process_ticker_3(self, ticker_data: tuple) -> list:
        """
        ═══════════════════════════════════════════════════════════════════
        🎯 PATTERN-SPECIFIC LOGIC GOES HERE
        ═══════════════════════════════════════════════════════════════════

        This is where you insert YOUR pattern detection logic.

        Args:
            ticker_data: (ticker, ticker_df, d0_start, d0_end)

        Returns:
            List of signal dictionaries

        Example structure:
        [
            {
                'Ticker': 'AAPL',
                'Date': '2024-01-15',
                'Trigger': 'Pattern Name',
                'Metric1': value,
                'Metric2': value
            }
        ]
        ═══════════════════════════════════════════════════════════════════
        """
        ticker, ticker_df, d0_start, d0_end = ticker_data

        # Filter to D0 range
        df_d0 = ticker_df[ticker_df['date'].between(d0_start, d0_end)].copy()

        if df_d0.empty:
            return []

        signals = []

        # ============================================================
        # YOUR PATTERN DETECTION LOGIC HERE
        # ============================================================

        # Example pattern detection (replace with your logic):
        for idx, row in df_d0.iterrows():
            # Check your pattern conditions here
            if True:  # Replace with your actual conditions
                signals.append({
                    'Ticker': ticker,
                    'Date': row['date'],
                    'Trigger': 'YourPatternName',
                    # Add your metrics here
                })

        # ============================================================

        return signals

    # ==================== MAIN EXECUTION ====================

    def execute(self) -> pd.DataFrame:
        """
        Main execution pipeline
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

        # Stage 2: Compute simple features + smart filters
        df = self.compute_simple_features(df)
        df = self.apply_smart_filters(df)

        if df.empty:
            print("❌ No rows passed smart filters!")
            return pd.DataFrame()

        # Stage 3: Compute full features + pattern detection
        df = self.compute_full_features(df)
        signals = self.detect_patterns(df)

        if signals.empty:
            print("❌ No signals found!")
            return pd.DataFrame()

        # Sort by date (chronological order)
        signals = signals.sort_values('Date').reset_index(drop=True)

        return signals

    def run_and_save(self, output_path: str = "scanner_results.csv") -> pd.DataFrame:
        """
        Execute scan and save results to CSV

        Returns:
            DataFrame with signals
        """
        results = self.execute()

        if not results.empty:
            # Save to CSV
            results.to_csv(output_path, index=False)
            print(f"✅ Results saved to: {output_path}")

            # Display summary
            print(f"\n{'='*70}")
            print(f"✅ SCAN COMPLETE")
            print(f"{'='*70}")
            print(f"📊 Final signals (D0 range): {len(results):,}")
            print(f"📊 Unique tickers: {results['Ticker'].nunique():,}")

            # Print all signals
            if len(results) > 0:
                print(f"\n{'='*70}")
                print("📊 SIGNALS FOUND:")
                print(f"{'='*70}")
                for idx, row in results.iterrows():
                    print(f"  {row['Ticker']:6s} | {row['Date']} | {row['Trigger']}")

        return results


# ==================== CLI ENTRY POINT ====================

if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 SINGLE-SCAN SCANNER - GROUPED ENDPOINT")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python scanner.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python scanner.py 2024-01-01 2024-12-01")
    print("   python scanner.py  # Uses defaults")
    print("\n   Date format: YYYY-MM-DD")
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
```

---

## Multi-Scan Structure (Complete Template)

**Used by:** lc_d2, sc_dmr

**Key characteristic:** Uses vectorized boolean masks on entire DataFrame (NO per-ticker processing)

```python
"""
🚀 EDGEDEV MULTI-SCAN SCANNER - STANDARDIZED STRUCTURE
=======================================================

This is the MANDATORY structure for all multi-pattern scanners.
Pattern-specific logic goes as boolean masks in detect_patterns().

Architecture:
-----------
Stage 1: Fetch grouped data (all tickers for all dates)
Stage 2: Apply smart filters (reduce dataset by ~99%)
Stage 3: Vectorized pattern detection (NO per-ticker processing)

Pattern Detection:
----------------
- Uses boolean masks on entire DataFrame
- NO process_ticker() methods
- Multiple patterns detected in one pass
- Results aggregated by ticker+date
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional


class MultiScanScanner:
    """
    Multi-Pattern Scanner - Vectorized DataFrame Processing

    [YOUR SCANNER DESCRIPTION HERE]

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
    Stage 2: Apply smart filters (reduce dataset by ~99%)
    Stage 3: Vectorized pattern detection (NO per-ticker processing)

    Pattern Detection:
    ----------------
    - Uses boolean masks on entire DataFrame
    - NO process_ticker() methods
    - Multiple patterns detected in one pass
    - Results aggregated by ticker+date
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        d0_start: str = None,
        d0_end: str = None
    ):
        """Initialize scanner with API key and date range"""

        # ============================================================
        # 📅 DATE RANGE CONFIGURATION - EDIT HERE
        # ============================================================
        self.DEFAULT_D0_START = "2024-01-01"  # ← SET YOUR START DATE
        self.DEFAULT_D0_END = datetime.now().strftime("%Y-%m-%d")  # ← SET YOUR END DATE
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

        # Date configuration
        self.d0_start = d0_start or self.DEFAULT_D0_START
        self.d0_end = d0_end or self.DEFAULT_D0_END

        # Scan range: calculate based on your lookback requirements
        lookback_buffer = 1050  # Adjust based on your patterns' needs
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5  # Parallel fetching of grouped data
        self.stage3_workers = 10  # Not used in multi-scan (vectorized)

        print(f"🚀 MULTI-SCAN MODE: [YOUR SCANNER NAME]")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # ============================================================
        # ⚙️  PATTERN PARAMETERS - CUSTOMIZE FOR YOUR SCANNER
        # ============================================================
        self.params = {
            # Mass parameters (shared across all patterns)
            "prev_close_min": 0.75,
            "prev_volume_min": 10_000_000,

            # Pattern-specific parameters
            # Add your custom parameters here
        }

    # ==================== STAGE 1: FETCH GROUPED DATA ====================

    def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
        """Get all valid NYSE trading days (skips weekends/holidays)"""
        trading_days = self.us_calendar.valid_days(
            start_date=pd.to_datetime(start_date),
            end_date=pd.to_datetime(end_date)
        )
        return [date.strftime('%Y-%m-%d') for date in trading_days]

    def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
        """
        Stage 1: Fetch ALL data for ALL tickers using grouped endpoint

        Key Features:
        - One API call per trading day (not per ticker)
        - Parallel processing with ThreadPoolExecutor
        - Timeout protection (30 seconds per request)
        - Progress reporting every 100 days
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
                completed += 1

                try:
                    data = future.result()
                    if data is not None and not data.empty:
                        all_data.append(data)
                    else:
                        failed += 1

                    # Progress reporting
                    if completed % 100 == 0:
                        success = completed - failed
                        print(f"⚡ Progress: {completed}/{len(trading_dates)} days | "
                              f"Success: {success} | Failed: {failed}")

                except Exception as e:
                    failed += 1

        elapsed = time.time() - start_time

        # Check if any data was fetched
        if not all_data:
            print("❌ No data fetched - all dates failed!")
            return pd.DataFrame()

        # Combine all data
        df = pd.concat(all_data, ignore_index=True)

        print(f"\n🚀 Stage 1 Complete ({elapsed:.1f}s):")
        print(f"📊 Total rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")

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

    # ==================== STAGE 2: SMART FILTERS ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute simple features needed for smart filtering

        CRITICAL: Compute features BEFORE any dropna!
        """
        print(f"\n📊 Computing simple features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # ✅ STEP 1: Compute features FIRST
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['ADV20_$'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )
        df['price_range'] = df['high'] - df['low']

        # ✅ STEP 2: THEN drop NaNs (columns now exist)
        df = df.dropna(subset=['prev_close', 'ADV20_$', 'price_range'])

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 2: Smart filters to reduce dataset by ~99%

        CRITICAL: Separate historical from signal output range
        - Keep ALL historical data for rolling calculations
        - Apply filters ONLY to signal output range
        - Combine back together for Stage 3
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: SMART FILTERS (D0 DATE VALIDATION)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()

        # Separate historical from signal output range
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        print(f"📊 Historical rows (kept for calculations): {len(df_historical):,}")
        print(f"📊 Signal output range D0 dates: {len(df_output_range):,}")

        # Apply smart filters ONLY to signal output range
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['prev_close_min']) &
            (df_output_range['ADV20_$'] >= self.params['prev_volume_min']) &
            (df_output_range['price_range'] >= 0.50) &
            (df_output_range['volume'] >= 1_000_000)
        ].copy()

        print(f"📊 D0 dates passing smart filters: {len(df_output_filtered):,}")

        # Combine: all historical data + filtered D0 dates
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # Only keep tickers with 1+ passing D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        print(f"📊 After filtering to tickers with 1+ passing D0 dates: {len(df_combined):,} rows")
        print(f"📊 Unique tickers: {df_combined['ticker'].nunique():,}")

        elapsed = time.time() - start_time
        print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s)")

        return df_combined

    # ==================== STAGE 3: FULL FEATURES + PATTERN DETECTION ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute full features needed for multi-pattern detection

        Add all features needed for your patterns here
        """
        print(f"\n📊 Computing full features...")

        # Common features (add more as needed)
        df['prev_close_1'] = df.groupby('ticker')['prev_close'].shift(1)
        df['prev_close_2'] = df.groupby('ticker')['prev_close'].shift(2)
        df['prev_close_3'] = df.groupby('ticker')['prev_close'].shift(3)

        df['prev_high'] = df.groupby('ticker')['high'].shift(1)
        df['prev_high_2'] = df.groupby('ticker')['high'].shift(2)
        df['prev_high_3'] = df.groupby('ticker')['high'].shift(3)

        df['prev_low'] = df.groupby('ticker')['low'].shift(1)

        df['prev_volume'] = df.groupby('ticker')['volume'].shift(1)
        df['prev_volume_2'] = df.groupby('ticker')['volume'].shift(2)

        df['prev_range'] = df.groupby('ticker')['price_range'].shift(1)
        df['prev_range_2'] = df.groupby('ticker')['price_range'].shift(2)

        df['gap'] = (df['open'] / df['prev_close']) - 1
        df['prev_gap'] = df.groupby('ticker')['gap'].shift(1)
        df['prev_gap_2'] = df.groupby('ticker')['gap'].shift(2)

        # Add your pattern-specific features here

        return df

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ═══════════════════════════════════════════════════════════════════
        🎯 PATTERN-SPECIFIC LOGIC GOES HERE
        ═══════════════════════════════════════════════════════════════════

        Stage 3: Vectorized multi-pattern detection

        Key Features:
        - Boolean masks on entire DataFrame (NO per-ticker loops)
        - Multiple patterns detected in one pass
        - Results aggregated by ticker+date

        INSTRUCTIONS:
        1. Convert date for filtering: df['Date'] = pd.to_datetime(df['date'])
        2. Drop rows with NaN in critical columns
        3. Filter to D0 range: df_d0 = df[df['Date'].between(...)]
        4. For each pattern, create a boolean mask
        5. Append matching rows with Scanner_Label to all_signals
        6. Aggregate by ticker+date to combine multiple patterns
        ═══════════════════════════════════════════════════════════════════
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: MULTI-PATTERN DETECTION (VECTORIZED)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()

        # Convert date for filtering
        df['Date'] = pd.to_datetime(df['date'])

        # Drop rows with NaN in critical columns
        df = df.dropna(subset=[
            'prev_close', 'prev_high', 'prev_low', 'gap',
            'prev_volume', 'prev_range'
        ])

        # Filter to D0 range
        df_d0 = df[
            (df['Date'] >= pd.to_datetime(self.d0_start)) &
            (df['Date'] <= pd.to_datetime(self.d0_end))
        ].copy()

        print(f"📊 Rows after D0 filter: {len(df_d0):,}")

        # Collect all signals from all patterns
        all_signals = []

        # ============================================================
        # YOUR PATTERNS GO HERE
        #
        # For each pattern:
        # 1. Create boolean mask
        # 2. Filter DataFrame
        # 3. Add Scanner_Label
        # 4. Append to all_signals
        # ============================================================

        # ==================== PATTERN 1 ====================
        mask = (
            # Your pattern conditions here
            (df_d0['condition_1']) &
            (df_d0['condition_2']) &
            (df_d0['condition_3'])
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'Pattern_1'
            all_signals.append(signals)

        # ==================== PATTERN 2 ====================
        mask = (
            # Different pattern conditions
            (df_d0['condition_A']) &
            (df_d0['condition_B'])
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'Pattern_2'
            all_signals.append(signals)

        # ==================== ADD MORE PATTERNS ====================
        # ... continue for all patterns you want to detect
        # ============================================================

        # Combine all signals and aggregate by ticker+date
        if all_signals:
            signals = pd.concat(all_signals, ignore_index=True)

            # Aggregate by ticker+date: combine multiple patterns into comma-separated list
            signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
                lambda x: ', '.join(sorted(set(x)))
            ).reset_index()
            signals_aggregated.columns = ['Ticker', 'Date', 'Scanner_Label']

            print(f"\n📊 Unique ticker+date combinations: {len(signals_aggregated):,}")
            print(f"📊 Total pattern matches (including duplicates): {len(signals):,}")

            # Print signals by scanner type
            scanner_counts = signals_aggregated['Scanner_Label'].value_counts()
            print(f"\n📊 Signals by Scanner:")
            for scanner, count in scanner_counts.items():
                print(f"  • {scanner}: {count:,}")

            signals = signals_aggregated
        else:
            signals = pd.DataFrame()

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")

        return signals

    # ==================== MAIN EXECUTION ====================

    def execute(self) -> pd.DataFrame:
        """
        Main execution pipeline
        """
        print(f"\n{'='*70}")
        print("🚀 MULTI-SCAN SCANNER - GROUPED ENDPOINT ARCHITECTURE")
        print(f"{'='*70}")

        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
        print(f"📅 Trading days: {len(trading_dates)}")

        # Stage 1: Fetch grouped data
        df = self.fetch_all_grouped_data(trading_dates)

        if df.empty:
            print("❌ No data available!")
            return pd.DataFrame()

        # Stage 2: Compute simple features + smart filters
        df = self.compute_simple_features(df)
        df = self.apply_smart_filters(df)

        if df.empty:
            print("❌ No rows passed smart filters!")
            return pd.DataFrame()

        # Stage 3: Compute full features + pattern detection
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

        # Print all signals
        if len(signals) > 0:
            print(f"\n{'='*70}")
            print("📊 ALL SIGNALS:")
            print(f"{'='*70}")
            for idx, row in signals.iterrows():
                print(f"  {row['Ticker']:6s} | {row['Date']} | {row['Scanner_Label']}")

        return signals

    def run_and_save(self, output_path: str = "scanner_results.csv") -> pd.DataFrame:
        """
        Execute scan and save results to CSV

        Returns:
            DataFrame with signals
        """
        results = self.execute()

        if not results.empty:
            # Save to CSV
            results.to_csv(output_path, index=False)
            print(f"✅ Results saved to: {output_path}")

        return results


# ==================== CLI ENTRY POINT ====================

if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 MULTI-SCAN SCANNER - GROUPED ENDPOINT")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python scanner.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python scanner.py 2024-01-01 2024-12-01")
    print("   python scanner.py  # Uses defaults")
    print("\n   Date format: YYYY-MM-DD")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    if d0_start:
        print(f"📅 Start Date: {d0_start}")
    if d0_end:
        print(f"📅 End Date: {d0_end}")

    scanner = MultiScanScanner(
        d0_start=d0_start,
        d0_end=d0_end
    )

    results = scanner.run_and_save()

    print(f"\n✅ Done!")
```

---

## Key Differences Summary

| Feature | SINGLE-SCAN | MULTI-SCAN |
|---------|-------------|------------|
| **Pattern Detection** | `process_ticker_3()` per ticker | Boolean masks on DataFrame |
| **Processing** | Parallel ticker iteration | Vectorized DataFrame ops |
| **Use When** | Single pattern, complex per-ticker logic | Multiple patterns, vectorized conditions |
| **Output** | List of signals from each ticker | Aggregated by ticker+date |
| **Method Name** | `process_ticker_3()` | `detect_patterns()` only |

---

## Which Structure to Use?

**Use SINGLE-SCAN when:**
- Detecting ONE pattern
- Complex per-ticker calculations required
- Need to analyze individual ticker data
- Examples: backside_b, a_plus_para, d1_gap, extended_gap, lc_3d_gap

**Use MULTI-SCAN when:**
- Detecting MULTIPLE patterns (2+)
- Vectorized boolean mask logic possible
- Want to aggregate multiple patterns
- Examples: lc_d2, sc_dmr
