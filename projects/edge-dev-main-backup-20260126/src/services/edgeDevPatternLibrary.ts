/**
 * EdgeDev Pattern Template Library
 * =================================
 *
 * EXTRACTED FROM PROVEN WORKING SCANNERS
 * -----------------------------------------
 * This library contains the exact pattern detection logic from your working template files.
 * Renata MUST use these templates for structure while allowing creative parameter combinations.
 *
 * ARCHITECTURE PRINCIPLES (Non-Negotiable):
 * ----------------------------------------
 * 1. **3-Stage Architecture**: Stage 1 (fetch) → Stage 2 (smart filters) → Stage 3 (pattern detection)
 * 2. **Rule #5 Compliance**: Features MUST be computed BEFORE dropna()
 * 3. **Grouped Endpoint**: Use Polygon grouped endpoint (1 API call per day, not per ticker)
 * 4. **Class-Based**: All scanners must be classes with __init__, methods
 * 5. **Thread Pools**: Use ThreadPoolExecutor for parallel processing
 *
 * CREATIVITY ALLOWED IN:
 * ----------------------
 * - Pattern parameter combinations (thresholds, multipliers)
 * - Filter combinations
 * - New pattern variations based on these templates
 */

// ============================================================
// SECTION 1: STRUCTURAL TEMPLATES (The Foundation)
// ============================================================

/**
 * TWO STRUCTURAL ARCHITECTURES FOR EDGEDEV SCANNERS
 *
 * These are the ONLY two valid structures for EdgeDev scanners.
 * All pattern logic plugs into ONE of these two structures.
 */

export const STRUCTURAL_TEMPLATES = {

  // ==========================================
  // SINGLE-SCAN STRUCTURE (COMPLETE TEMPLATE)
  // ==========================================
  // Used by: backside_b, a_plus_para, d1_gap, extended_gap, lc_3d_gap
  //
  // Key Characteristic: Uses process_ticker_3() for individual ticker processing
  // Each ticker processed independently with pattern detection logic
  // Parallel processing with ThreadPoolExecutor over tickers
  //
  // FEATURES:
  // - API KEY HARDCODED: Fm7brz4s23eSocDErnL68cE7wspz2K1I
  // - Fetches ALL tickers automatically (NYSE + NASDAQ + ETFs)
  // - No ticker list required
  // - Exact match to Backside B template structure
  //
  singleScanStructure: `
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
        print(f"\\n{'='*70}")
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
        print(f"\\n📊 Combining data from {len(all_data)} trading days...")
        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

        print(f"\\n🚀 Stage 1 Complete ({elapsed:.1f}s):")
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
        print(f"\\n📊 Computing simple features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # Previous close (for price filter)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # ADV20 (USD) - 20-day average daily value (for ADV filter)
        df['ADV20_USD'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )

        # Price range (high - low, for volatility filter)
        df['price_range'] = df['high'] - df['low']

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 2: Smart filters on Day -1 data to identify valid D0 dates

        CRITICAL: Smart filters validate WHICH D0 DATES to check, not which tickers to keep.
        """
        print(f"\\n{'='*70}")
        print("🚀 STAGE 2: SMART FILTERS (D0 DATE VALIDATION)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")

        start_time = time.time()

        # Remove rows with NaN in critical columns
        df = df.dropna(subset=['prev_close', 'ADV20_USD', 'price_range'])

        # Separate data into historical and signal output ranges
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        # Apply smart filters ONLY to signal output range
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['ADV20_USD'] >= self.params['adv20_min_usd']) &
            (df_output_range['price_range'] >= self.params['price_range_min']) &
            (df_output_range['volume'] >= self.params['volume_min'])
        ].copy()

        # Combine: all historical data + filtered D0 dates
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # Only keep tickers with 1+ valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        elapsed = time.time() - start_time
        print(f"\\n🚀 Stage 2 Complete ({elapsed:.1f}s):")

        return df_combined

    # ==================== STAGE 3: FULL PARAMETERS + SCAN ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute all features needed for pattern detection

        ⚠️  Rule #5 Compliance: Compute ALL features BEFORE dropna()
        """
        print(f"\\n📊 Computing full features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # Basic features
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['prev_close_2'] = df.groupby('ticker')['close'].shift(2)
        df['prev_high'] = df.groupby('ticker')['high'].shift(1)
        df['gap'] = (df['open'] / df['prev_close']) - 1
        df['range'] = df['high'] - df['low']

        # Volume features
        df['VOL_AVG'] = df.groupby('ticker')['volume'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )

        print(f"   ✅ Computed {len(df.columns)} features")
        return df

    def process_ticker_3(self, ticker_data: tuple) -> list:
        """
        ═════════════════════════════════════════════════════════════════════════
        🎯 YOUR PATTERN DETECTION LOGIC GOES HERE
        ═════════════════════════════════════════════════════════════════════════

        This is where you insert your custom pattern detection logic.
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
            for i in range(2, len(ticker_df)):
                row = ticker_df.iloc[i]
                d0 = row['date']

                if d0 < d0_start_dt or d0 > d0_end_dt:
                    continue

                if pd.isna(row['gap']) or pd.isna(row['VOL_AVG']):
                    continue

                # YOUR PATTERN RULES HERE
                if row['gap'] >= 0.03 and row['volume'] >= row['VOL_AVG'] * 1.5:
                    signals.append({
                        'Ticker': ticker,
                        'Date': d0,
                        'Close': row['close'],
                        'Volume': row['volume'],
                    })
            # ==================================================================

        except Exception as e:
            pass

        return signals

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3: Apply pattern detection - PARALLEL PROCESSING"""
        print(f"\\n{'='*70}")
        print("🚀 STAGE 3: PATTERN DETECTION (PARALLEL)")
        print(f"{'='*70}")

        start_time = time.time()
        df = df.reset_index(drop=True)
        df['date'] = pd.to_datetime(df['date'])

        signals_list = []

        # ✅ V31 PERFORMANCE FIX: Use groupby to pre-slice data ONCE (O(n) vs O(n×m))
        ticker_data_list = []
        for ticker, ticker_df in df.groupby('ticker'):
            ticker_data_list.append((ticker, ticker_df.copy(), self.d0_start, self.d0_end))

        print(f"📊 Processing {len(ticker_data_list)} tickers in parallel ({self.stage3_workers} workers)...")

        # Process tickers in parallel
        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            futures = [executor.submit(self._process_ticker_optimized_pre_sliced, ticker_data) for ticker_data in ticker_data_list]

            completed = 0
            for future in as_completed(futures):
                completed += 1
                if completed % 100 == 0:
                    print(f"  Progress: {completed}/{len(ticker_data_list)} tickers processed")

                try:
                    signals = future.result()
                    signals_list.extend(signals)
                except Exception as e:
                    pass

        signals = pd.DataFrame(signals_list)
        elapsed = time.time() - start_time
        print(f"\\n🚀 Stage 3 Complete ({elapsed:.1f}s):")

        return signals
  `,

  // ==========================================
  // MULTI-SCAN STRUCTURE (COMPLETE TEMPLATE)
  // ==========================================
  // Used by: lc_d2, sc_dmr
  //
  // Key Characteristic: Uses vectorized boolean masks on entire DataFrame
  // NO process_ticker() methods
  // Multiple patterns detected in one pass
  // Results aggregated by grouping (ticker+date)
  //
  // FEATURES:
  // - API KEY HARDCODED: Fm7brz4s23eSocDErnL68cE7wspz2K1I
  // - Fetches ALL tickers automatically (NYSE + NASDAQ + ETFs)
  // - No ticker list required
  // - Exact match to LC D2 template structure
  //
  multiScanStructure: `
"""
═══════════════════════════════════════════════════════════════════════════════
STANDARDIZED MULTI-SCAN SCANNER TEMPLATE
═══════════════════════════════════════════════════════════════════════════════

EdgeDev 3-Stage Architecture - MULTI-SCAN Structure

This template matches the EXACT structure of your LC D2 multi-scanner.
Uses vectorized boolean masks for multiple pattern detection.

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


class MultiScanScanner:
    """
    Standardized Multi-Scan Scanner Template

    Structure: Uses vectorized boolean masks on entire DataFrame
    Best for: Multiple pattern detection, vectorized logic, pattern aggregation

    This matches your LC D2 template EXACTLY - only pattern masks change.
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",  # YOUR HARDCODED KEY
        d0_start: str = None,
        d0_end: str = None
    ):
        """Initialize scanner with your API key and date range"""

        self.DEFAULT_D0_START = "2025-01-01"
        self.DEFAULT_D0_END = "2025-12-31"

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

        # Scan range
        lookback_buffer = 1050
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5

        print(f"🚀 GROUPED ENDPOINT MODE: Multi-Scan Scanner")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")

        # Parameters
        self.params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            "price_range_min": 0.50,
            "volume_min": 1_000_000,
        }

    def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
        """Get all valid trading days"""
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
        """Stage 1: Fetch ALL data for ALL tickers using grouped endpoint"""
        print(f"\\n{'='*70}")
        print("🚀 STAGE 1: FETCH GROUPED DATA")
        print(f"{'='*70}")

        start_time = time.time()
        all_data = []

        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            futures = [executor.submit(self._fetch_grouped_day, date_str) for date_str in trading_dates]

            for future in as_completed(futures):
                data = future.result()
                if data is not None and not data.empty:
                    all_data.append(data)

        if not all_data:
            return pd.DataFrame()

        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

        elapsed = time.time() - start_time
        print(f"\\n🚀 Stage 1 Complete ({elapsed:.1f}s):")
        print(f"📊 Total rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")

        return df

    def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
        """Fetch ALL tickers that traded on a specific date"""
        try:
            url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
            params = {"adjusted": "true", "apiKey": self.api_key}

            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return None

            data = response.json()

            if 'results' not in data or not data['results']:
                return None

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
        """Compute simple features needed for smart filtering"""
        df = df.sort_values(['ticker', 'date'])
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['ADV20_USD'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )
        df['price_range'] = df['high'] - df['low']

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2: Smart filters"""
        print(f"\\n{'='*70}")
        print("🚀 STAGE 2: SMART FILTERS")
        print(f"{'='*70}")

        df = df.dropna(subset=['prev_close', 'ADV20_USD', 'price_range'])

        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['price_min']) &
            (df_output_range['ADV20_USD'] >= self.params['adv20_min_usd']) &
            (df_output_range['price_range'] >= self.params['price_range_min']) &
            (df_output_range['volume'] >= self.params['volume_min'])
        ].copy()

        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        return df_combined

    # ==================== STAGE 3: FULL PARAMETERS + SCAN ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all features needed for pattern detection"""
        print(f"\\n📊 Computing full features...")

        df = df.sort_values(['ticker', 'date'])

        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['prev_close_2'] = df.groupby('ticker')['close'].shift(2)
        df['prev_high'] = df.groupby('ticker')['high'].shift(1)
        df['gap'] = (df['open'] / df['prev_close']) - 1
        df['VOL_AVG'] = df.groupby('ticker')['volume'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )

        print(f"   ✅ Computed {len(df.columns)} features")
        return df

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 3: Multi-pattern detection using VECTORIZED BOOLEAN MASKS

        NO per-ticker loops - pure vectorized operations.
        """
        print(f"\\n{'='*70}")
        print("🚀 STAGE 3: PATTERN DETECTION (MULTI-SCAN VECTORIZED)")
        print(f"{'='*70}")

        start_time = time.time()

        df['Date'] = pd.to_datetime(df['date'])
        df_d0 = df[df['Date'].between(pd.to_datetime(self.d0_start), pd.to_datetime(self.d0_end))].copy()

        if df_d0.empty:
            return pd.DataFrame()

        df_d0 = df_d0.dropna(subset=['prev_close', 'gap', 'VOL_AVG'])

        all_signals = []

        # ==================== PATTERN 1: GAP UP WITH VOLUME ====================
        mask = (
            (df_d0['gap'] >= 0.03) &
            (df_d0['volume'] >= df_d0['VOL_AVG'] * 1.5)
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'Gap_Up_Volume'
            all_signals.append(signals)

        # ==================== ADD MORE PATTERNS HERE ====================
        # Copy the pattern block above and modify conditions
        # ====================================================================

        if not all_signals:
            return pd.DataFrame()

        signals = pd.concat(all_signals, ignore_index=True)

        # Aggregate by ticker+date
        signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
            lambda x: ', '.join(sorted(set(x)))
        ).reset_index()

        elapsed = time.time() - start_time
        print(f"\\n🚀 Stage 3 Complete ({elapsed:.1f}s):")

        return signals_aggregated
`
};

// ============================================================
// SECTION 2: ARCHITECTURE PRINCIPLES (Non-Negotiable)
// ============================================================

export const EDGEDEV_ARCHITECTURE = {
  // ========================================
  // CLASS STRUCTURE TEMPLATE (MUST FOLLOW)
  // ========================================
  classTemplate: `
class GroupedEndpointScannerName:
    """
    Scanner Description

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
    Stage 2: Apply smart filters (reduce dataset by ~99%)
    Stage 3: Compute full parameters + scan patterns
    """

    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
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
        self.scan_start = (pd.to_datetime(self.d0_start) - pd.Timedelta(days=LOOKBACK_DAYS)).strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5
        self.stage3_workers = 10

        # Parameters (customizable per pattern)
        self.params = { ... }

    # ==================== STAGE 1: FETCH GROUPED DATA ====================

    def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
        """Stage 1: Fetch ALL data for ALL tickers using grouped endpoint"""
        # Implementation uses ThreadPoolExecutor + grouped endpoint
        pass

    # ==================== STAGE 2: SMART FILTERS ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute simple features needed for smart filtering"""
        # CRITICAL: Compute features BEFORE any dropna!
        df = df.sort_values(['ticker', 'date'])

        # Previous close (for price filter)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # ADV20 (USD daily value)
        df['ADV20_USD'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(window=20, min_periods=20).mean()
        )

        # Price range
        df['price_range'] = df['high'] - df['low']

        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2: Smart filters on Day -1 data"""
        # Separate historical and output ranges
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)].copy()
        df_output_range = df[df['date'].between(self.d0_start, self.d0_end)].copy()

        # Apply filters ONLY to output range
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= FILTER_MIN) &
            (df_output_range['ADV20_USD'] >= FILTER_MIN)
        ].copy()

        # Combine: all historical + filtered D0 dates
        df_combined = pd.concat([df_historical, df_output_filtered])

        # Only keep tickers with 1+ valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        return df_combined

    # ==================== STAGE 3: PATTERN DETECTION ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute all features needed for pattern detection"""
        # EMAs
        df['EMA_9'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=9, adjust=False).mean()
        )

        # True Range
        prev_close = df.groupby('ticker')['close'].shift(1)
        df['TR'] = np.maximum(
            df['high'] - df['low'],
            np.maximum(
                abs(df['high'] - prev_close),
                abs(df['low'] - prev_close)
            )
        )

        # ATR (14-day, shifted by 1)
        df['ATR_raw'] = df.groupby('ticker')['TR'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )
        df['ATR'] = df.groupby('ticker')['ATR_raw'].transform(lambda x: x.shift(1))

        return df

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3: Apply pattern detection"""
        # Pattern-specific logic here
        pass

    def execute(self) -> pd.DataFrame:
        """Main execution pipeline"""
        trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)

        # Stage 1
        df = self.fetch_all_grouped_data(trading_dates)

        # Stage 2
        df = self.compute_simple_features(df)
        df = self.apply_smart_filters(df)

        # Stage 3
        df = self.compute_full_features(df)
        signals = self.detect_patterns(df)

        return signals
`,

  // ========================================
  // CRITICAL IMPORTS (MUST INCLUDE)
  // ========================================
  requiredImports: [
    'import pandas as pd',
    'import numpy as np',
    'import requests',
    'import time',
    'from datetime import datetime, timedelta',
    'from concurrent.futures import ThreadPoolExecutor, as_completed',
    'import pandas_market_calendars as mcal',
    'from typing import List, Dict, Optional, Tuple'
  ],

  // ========================================
  // REQUIRED METHODS (MUST IMPLEMENT)
  // ========================================
  requiredMethods: [
    'def __init__(self, api_key, d0_start, d0_end)',
    'def get_trading_dates(self, start_date, end_date)',
    'def fetch_all_grouped_data(self, trading_dates)',
    'def compute_simple_features(self, df)',
    'def apply_smart_filters(self, df)',
    'def compute_full_features(self, df)',
    'def detect_patterns(self, df)',
    'def execute(self)'
  ]
};

// ============================================================
// SECTION 2: PATTERN DETECTION TEMPLATES (Exact Logic)
// ============================================================

export const PATTERN_TEMPLATES = {

  // ========================================
  // BACKSIDE B PATTERN (Parabolic Breakdown)
  // ========================================
  backside_b: {
    name: "Backside B Parabolic Breakdown",
    description: "Identifies parabolic uptrends showing breakdown signals",

    parameters: {
      price_min: 8.0,
      adv20_min_usd: 30_000_000,
      abs_lookback_days: 1000,
      abs_exclude_days: 10,
      pos_abs_max: 0.75,
      trigger_mode: "D1_or_D2",
      atr_mult: 0.9,
      vol_mult: 0.9,
      d1_volume_min: 15_000_000,
      slope5d_min: 3.0,
      high_ema9_mult: 1.05,
      gap_div_atr_min: 0.75,
      open_over_ema9_min: 0.9,
      d1_green_atr_min: 0.30,
      require_open_gt_prev_high: true,
      enforce_d1_above_d2: true,
    },

    detectionLogic: `
def _process_ticker_optimized_pre_sliced(self, ticker_data: tuple) -> list:
    \"\"\"Process single ticker with pre-sliced data - V31 OPTIMIZED\"\"\"
    ticker, ticker_df, d0_start, d0_end = ticker_data
    signals = []

    # Filter to output range
    output_mask = ticker_df['date'].between(d0_start, d0_end)
    df_output = ticker_df[output_mask].copy()

    if len(df_output) == 0 or len(ticker_df) < 100:
        return signals

    for idx in df_output.index:
        if idx < 2:
            continue

        r0 = ticker_df.iloc[idx]      # D0 (trade day)
        r1 = ticker_df.iloc[idx-1]    # D-1
        r2 = ticker_df.iloc[idx-2]    # D-2

        # ✅ V30 CRITICAL FIX: Check D0 open > D-2's high via r1['prev_high']
        if self.params.get('require_open_gt_prev_high', True):
            if not (r0['open'] > r1['prev_high']):
                continue

        # D-1 volume floor
        d1_volume_min = self.params.get('d1_volume_min', 15_000_000)
        if r1['volume'] < d1_volume_min:
            continue

        # D-1 > D-2 checks
        if self.params.get('enforce_d1_above_d2', True):
            if not (r1['high'] > r2['high'] and r1['close'] > r2['close']):
                continue

        # D0 gap check
        gap_up = (r0['open'] - r1['close']) / r1['atr']
        if gap_up < self.params['gap_div_atr_min']:
            continue

        # D0 open above EMA9
        if r0['open'] < r0['ema9'] * self.params['open_over_ema9_min']:
            continue

        # Mold check on D-1 or D-2
        trigger_pass = False
        for trigger_row in [r1, r2]:
            if (trigger_row['tr'] / trigger_row['atr'] >= self.params['atr_mult'] and
                trigger_row['volume'] / trigger_row['vol_avg'] >= self.params['vol_mult'] and
                trigger_row['slope5d'] >= self.params['slope5d_min'] and
                trigger_row['high'] >= trigger_row['ema9'] * self.params['high_ema9_mult']):
                trigger_pass = True
                break

        if not trigger_pass:
            continue

        # ABS window check
        abs_start = max(0, idx - 1050)
        abs_end = max(0, idx - 10)
        if abs_end - abs_start < 100:
            continue

        abs_window = ticker_df.iloc[abs_start:abs_end]
        lo_abs = abs_window['low'].min()
        hi_abs = abs_window['high'].max()

        if hi_abs <= lo_abs:
            continue

        pos_abs = (r1['close'] - lo_abs) / (hi_abs - lo_abs)

        if not (0 <= pos_abs <= self.params['pos_abs_max']):
            continue

        # All checks passed - signal found
        signals.append({
            'ticker': ticker,
            'date': r0['date'],
            'close': r0['close'],
            'volume': r0['volume'],
            'open': r0['open'],
            'high': r0['high'],
            'low': r0['low'],
            'gap_pct': gap_up * 100,
            'pos_abs': pos_abs,
            'open_gt_prev_high': bool(r0['open'] > r1['prev_high']),
        })

    return signals
`
  },

  // ========================================
  // LC D2 MULTI-PATTERN (12 patterns)
  // ========================================
  lc_d2: {
    name: "LC D2 Multi-Scanner",
    description: "12 different D2/D3/D4 patterns for large cap stocks",

    patterns: [
      "lc_frontside_d3_extended_1",
      "lc_frontside_d2_extended",
      "lc_frontside_d2_extended_1",
    ],

    parameters: {
      // EMA parameters
      ema9_period: 9,
      ema20_period: 20,
      ema50_period: 50,
      ema200_period: 200,

      // ATR parameters
      atr_period: 14,

      // Volume filters
      volume_min: 10_000_000,
      dol_v_min: 500_000_000,
      dol_v_cum5_min: 500_000_000,

      // Price filters
      close_min: 5,

      // Distance filters (ATR-normalized)
      dist_h_9ema_atr_min: 1.5,
      dist_h_20ema_atr_min: 2,
      high_chg_atr_min: 1,
      high_chg_atr1_min: 0.7,
    },

    detectionLogic: `
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Multi-pattern detection with vectorized filters"""

    # Filter to D0 range
    df['Date'] = pd.to_datetime(df['date'])
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(self.d0_start)) &
        (df['Date'] <= pd.to_datetime(self.d0_end))
    ].copy()

    all_signals = []

    # LC_FRONTSIDE_D3_EXTENDED_1
    mask = (
        (df_d0['high'] >= df_d0['h1']) &
        (df_d0['h1'] >= df_d0['h2']) &
        (df_d0['low'] >= df_d0['l1']) &
        (df_d0['l1'] >= df_d0['l2']) &

        # Price-tiered filters
        (
            ((df_d0['high_pct_chg1'] >= 0.3) & (df_d0['high_pct_chg'] >= 0.3) & (df_d0['close'] >= 5) & (df_d0['close'] < 15) & (df_d0['h_dist_to_lowest_low_20_pct'] >= 2.5)) |
            ((df_d0['high_pct_chg1'] >= 0.2) & (df_d0['high_pct_chg'] >= 0.2) & (df_d0['close'] >= 15) & (df_d0['close'] < 25) & (df_d0['h_dist_to_lowest_low_20_pct'] >= 2)) |
            ((df_d0['high_pct_chg1'] >= 0.1) & (df_d0['high_pct_chg'] >= 0.1) & (df_d0['close'] >= 25) & (df_d0['close'] < 50) & (df_d0['h_dist_to_lowest_low_20_pct'] >= 1.5)) |
            ((df_d0['high_pct_chg1'] >= 0.07) & (df_d0['high_pct_chg'] >= 0.07) & (df_d0['close'] >= 50) & (df_d0['close'] < 90) & (df_d0['h_dist_to_lowest_low_20_pct'] >= 1)) |
            ((df_d0['high_pct_chg1'] >= 0.05) & (df_d0['high_pct_chg'] >= 0.05) & (df_d0['close'] >= 90) & (df_d0['h_dist_to_lowest_low_20_pct'] >= 0.75))
        ) &
        (df_d0['high_chg_atr1'] >= 0.7) &
        (df_d0['c1'] >= df_d0['o1']) &
        (df_d0['dist_h_9ema_atr1'] >= 1.5) &
        (df_d0['dist_h_20ema_atr1'] >= 2) &
        (df_d0['high_chg_atr'] >= 1) &
        (df_d0['close'] >= df_d0['open']) &
        (df_d0['dist_h_9ema_atr'] >= 1.5) &
        (df_d0['dist_h_20ema_atr'] >= 2) &
        (df_d0['volume'] >= 10_000_000) &
        (df_d0['dol_v'] >= 500_000_000) &
        (df_d0['dol_v1'] >= 10_000_000) &
        (df_d0['dol_v1'] >= 100_000_000) &
        (df_d0['close'] >= 5) &
        ((df_d0['high_chg_atr'] >= 1) | (df_d0['high_chg_atr1'] >= 1)) &
        (df_d0['h_dist_to_highest_high_20_2_atr'] >= 2.5) &
        (df_d0['high'] >= df_d0['highest_high_20']) &
        (df_d0['ema9'] >= df_d0['ema20']) &
        (df_d0['ema20'] >= df_d0['ema50'])
    )

    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'lc_frontside_d3_extended_1'
        all_signals.append(signals)

    # LC_FRONTSIDE_D2_EXTENDED
    mask = (
        (df_d0['high'] >= df_d0['h1']) &
        (df_d0['low'] >= df_d0['l1']) &
        (
            ((df_d0['high_pct_chg'] >= 0.5) & (df_d0['close'] >= 5) & (df_d0['close'] < 15) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 2.5)) |
            ((df_d0['high_pct_chg'] >= 0.3) & (df_d0['close'] >= 15) & (df_d0['close'] < 25) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 2)) |
            ((df_d0['high_pct_chg'] >= 0.2) & (df_d0['close'] >= 25) & (df_d0['close'] < 50) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 1.5)) |
            ((df_d0['high_pct_chg'] >= 0.15) & (df_d0['close'] >= 50) & (df_d0['close'] < 90) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 1)) |
            ((df_d0['high_pct_chg'] >= 0.1) & (df_d0['close'] >= 90) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 0.75))
        ) &
        (df_d0['high_chg_atr'] >= 1.5) &
        (df_d0['close'] >= df_d0['open']) &
        (df_d0['dist_h_9ema_atr'] >= 2) &
        (df_d0['dist_h_20ema_atr'] >= 3) &
        (df_d0['volume'] >= 10_000_000) &
        (df_d0['dol_v'] >= 500_000_000) &
        (df_d0['close'] >= 5) &
        (df_d0['h_dist_to_highest_high_20_1_atr'] >= 1) &
        (df_d0['dol_v_cum5_1'] >= 500_000_000) &
        (df_d0['high'] >= df_d0['highest_high_20']) &
        (df_d0['ema9'] >= df_d0['ema20']) &
        (df_d0['ema20'] >= df_d0['ema50'])
    )

    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'lc_frontside_d2_extended'
        all_signals.append(signals)

    # LC_FRONTSIDE_D2_EXTENDED_1
    mask = (
        (df_d0['high'] >= df_d0['h1']) &
        (df_d0['low'] >= df_d0['l1']) &
        (
            ((df_d0['high_pct_chg'] >= 1) & (df_d0['close'] >= 5) & (df_d0['close'] < 15) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 2.5)) |
            ((df_d0['high_pct_chg'] >= 0.5) & (df_d0['close'] >= 15) & (df_d0['close'] < 25) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 2)) |
            ((df_d0['high_pct_chg'] >= 0.3) & (df_d0['close'] >= 25) & (df_d0['close'] < 50) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 1.5)) |
            ((df_d0['high_pct_chg'] >= 0.2) & (df_d0['close'] >= 50) & (df_d0['close'] < 90) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 1)) |
            ((df_d0['high_pct_chg'] >= 0.15) & (df_d0['close'] >= 90) & (df_d0['highest_high_5_dist_to_lowest_low_20_pct_1'] >= 0.75))
        ) &
        (df_d0['high_chg_atr'] >= 1.5) &
        (df_d0['close'] >= df_d0['open']) &
        (df_d0['dist_h_9ema_atr'] >= 2) &
        (df_d0['dist_h_20ema_atr'] >= 3) &
        (df_d0['volume'] >= 10_000_000) &
        (df_d0['dol_v'] >= 500_000_000) &
        (df_d0['close'] >= 5) &
        (df_d0['h_dist_to_highest_high_20_1_atr'] >= 1) &
        (df_d0['dol_v_cum5_1'] >= 500_000_000) &
        (df_d0['high'] >= df_d0['highest_high_20']) &
        (df_d0['ema9'] >= df_d0['ema20']) &
        (df_d0['ema20'] >= df_d0['ema50'])
    )

    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'lc_frontside_d2_extended_1'
        all_signals.append(signals)

    # Aggregate by ticker+date
    if all_signals:
        signals = pd.concat(all_signals, ignore_index=True)
        signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
            lambda x: ', '.join(sorted(set(x)))
        ).reset_index()

        return signals_aggregated

    return pd.DataFrame()
`
  },

  // ========================================
  // SC DMR MULTI-PATTERN (10 patterns)
  // ========================================
  sc_dmr: {
    name: "SC DMR Multi-Scanner",
    description: "10 different D2/D3/D4 patterns for small cap stocks",

    patterns: [
      "D2_PM_Setup",
      "D2_PM_Setup_2",
      "D2_PMH_Break",
      "D2_PMH_Break_1",
      "D2_No_PMH_Break",
      "D2_Extreme_Gap",
      "D2_Extreme_Intraday_Run",
      "D3",
      "D3_Alt",
      "D4",
    ],

    parameters: {
      // Mass parameters
      prev_close_min: 0.75,
      prev_volume_min: 10_000_000,

      // Valid trigger high parameters
      valid_trig_high_enabled: true,

      // D2_PM_Setup parameters
      d2_pm_setup_gain_min: 0.2,
      d2_pm_setup_dol_pmh_gap_vs_range_min: 0.5,
      d2_pm_setup_pct_pmh_gap_min: 0.5,
      d2_pm_setup_prev_close_range_min: 0.5,
      d2_pm_setup_strict_gain_min: 1.0,

      // D2_PMH_Break parameters
      d2_pmh_break_gain_min: 1.0,
      d2_pmh_break_gap_min: 0.2,
      d2_pmh_break_dol_gap_vs_range_min: 0.3,
      d2_pmh_break_opening_range_min: 0.5,

      // D2_Extreme parameters
      d2_extreme_dol_gap_vs_range_min: 1.0,
      d2_extreme_intraday_run_vs_range_min: 1.0,
      d2_extreme_prev_close_range_min: 0.3,

      // D3/D4 parameters
      d3_gain_min: 0.2,
      d3_gap_min: 0.2,
      d4_gain_min: 0.2,
    },

    detectionLogic: `
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Multi-pattern detection with vectorized filters"""

    df['Date'] = pd.to_datetime(df['date'])

    # Filter to D0 range and ensure valid_trig_high
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(self.d0_start)) &
        (df['Date'] <= pd.to_datetime(self.d0_end)) &
        (df['valid_trig_high'] == True)
    ].copy()

    all_signals = []

    # D2_PM_SETUP (VARIANT 1: gain >= 1.0)
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 0.5) &
        (df_d0['pct_pmh_gap'] >= 0.5) &
        (df_d0['prev_close_range'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup'
        all_signals.append(signals)

    # D2_PM_SETUP (VARIANT 2: gain >= 0.2, prev_gap_2 >= 0.2)
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 0.2) &
        (df_d0['prev_gap_2'] >= 0.2) &
        (df_d0['prev_range'] > df_d0['prev_range_2']) &
        (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 0.5) &
        (df_d0['pct_pmh_gap'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_volume_2'] >= 10_000_000)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup'
        all_signals.append(signals)

    # D2_PM_SETUP_2 (stricter variant)
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 1.0) &
        (df_d0['pct_pmh_gap'] >= 1.0) &
        (df_d0['prev_close_range'] >= 0.3) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup_2'
        all_signals.append(signals)

    # D2_PMH_BREAK
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        (df_d0['gap'] >= 0.2) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.3) &
        (df_d0['opening_range'] >= 0.5) &
        (df_d0['high'] >= df_d0['pm_high']) &
        (df_d0['prev_close_range'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PMH_Break'
        all_signals.append(signals)

    # D2_PMH_BREAK_1 (gap < 0.2 variant)
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        (df_d0['gap'] < 0.2) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.3) &
        (df_d0['opening_range'] >= 0.5) &
        (df_d0['high'] >= df_d0['pm_high']) &
        (df_d0['prev_close_range'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PMH_Break_1'
        all_signals.append(signals)

    # D2_NO_PMH_BREAK
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        (df_d0['gap'] >= 0.2) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.3) &
        (df_d0['opening_range'] >= 0.5) &
        (df_d0['high'] < df_d0['pm_high']) &
        (df_d0['prev_close_range'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_No_PMH_Break'
        all_signals.append(signals)

    # D2_EXTREME_GAP
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 1.0) &
        (df_d0['prev_close_range'] >= 0.3) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_Extreme_Gap'
        all_signals.append(signals)

    # D2_EXTREME_INTRADAY_RUN
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &
        ((df_d0['high'] - df_d0['open']) >= df_d0['prev_range'] * 1.0) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.3) &
        (df_d0['prev_close_range'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_Extreme_Intraday_Run'
        all_signals.append(signals)

    # D3
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 0.2) &
        (df_d0['prev_gap'] >= 0.2) &
        (df_d0['prev_gap_2'] >= 0.2) &
        (df_d0['prev_range'] > df_d0['prev_range_2']) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.3) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_volume_2'] >= 10_000_000)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D3'
        all_signals.append(signals)

    # D3_ALT
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 0.2) &
        ((df_d0['prev_high_2'] / df_d0['prev_close_2'] - 1) >= 0.2) &
        (df_d0['prev_range'] > df_d0['prev_range_2']) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close_1'] > df_d0['prev_open_2']) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_volume_2'] >= 10_000_000)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D3_Alt'
        all_signals.append(signals)

    # D4
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 0.2) &
        ((df_d0['prev_high_2'] / df_d0['prev_close_2'] - 1) >= 0.2) &
        ((df_d0['prev_high_3'] / df_d0['prev_close_3'] - 1) >= 0.2) &
        (df_d0['prev_close'] > df_d0['prev_open']) &
        (df_d0['prev_close_1'] > df_d0['prev_open_2']) &
        (df_d0['prev_close_2'] > df_d0['prev_open_3']) &
        (df_d0['prev_close'] > df_d0['prev_close_1']) &
        (df_d0['prev_close_1'] > df_d0['prev_close_2']) &
        (df_d0['prev_close_2'] > df_d0['prev_close_3']) &
        (df_d0['prev_high'] > df_d0['prev_high_2']) &
        (df_d0['prev_high_2'] > df_d0['prev_high_3']) &
        (df_d0['dol_gap'] >= df_d0['prev_range'] * 0.3) &
        (df_d0['prev_close'] >= 0.75) &
        (df_d0['prev_volume'] >= 10_000_000) &
        (df_d0['prev_volume_2'] >= 10_000_000) &
        (df_d0['prev_volume_3'] >= 10_000_000)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D4'
        all_signals.append(signals)

    # Aggregate by ticker+date
    if all_signals:
        signals = pd.concat(all_signals, ignore_index=True)
        signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(
            lambda x: ', '.join(sorted(set(x)))
        ).reset_index()
        signals_aggregated.columns = ['Ticker', 'Date', 'Scanner_Label']

        return signals_aggregated

    return pd.DataFrame()
`
  },

  // ========================================
  // A+ PARA PATTERN (Parabolic Uptrend)
  // ========================================
  a_plus_para: {
    name: "A+ Para Parabolic",
    description: "Identifies parabolic uptrends with extended momentum",

    parameters: {
      atr_mult: 4,
      vol_mult: 2.0,
      slope3d_min: 10,
      slope5d_min: 20,
      slope15d_min: 50,
      high_ema9_mult: 4,
      high_ema20_mult: 5,
      atr_pct_change_min: 5,
      atr_abs_min: 3.0,
      prev_close_min: 10.0,
      prev_gain_pct_min: 0.25,
    },

    detectionLogic: `
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """A+ Para pattern detection"""

    # Convert date for filtering
    df['Date'] = pd.to_datetime(df['date'])

    # Drop rows with NaN
    df = df.dropna(subset=['TR', 'ATR', 'volume', 'VOL_AVG', 'slope3d', 'slope5d'])

    # Apply all pattern filters
    mask = (
        # D0 CONDITIONS
        (df['TR'] >= (df['ATR'] * self.params['atr_mult'])) &
        (df['volume'] >= (df['VOL_AVG'] * self.params['vol_mult'])) &
        (df['Prev_Volume'] >= (df['VOL_AVG'] * self.params['vol_mult'])) &

        (df['slope3d'] >= self.params['slope3d_min']) &
        (df['slope5d'] >= self.params['slope5d_min']) &
        (df['slope15d'] >= self.params['slope15d_min']) &

        (df['high_over_ema9_div_atr'] >= self.params['high_ema9_mult']) &
        (df['high_over_ema20_div_atr'] >= self.params['high_ema20_mult']) &

        # D-1 CONDITIONS
        (df['ATR'] >= self.params['atr_abs_min']) &
        (df['prev_close'] >= self.params['prev_close_min']) &
        (df['prev_gain_pct'] >= self.params['prev_gain_pct_min']) &

        # GAP-UP RULE
        (df['open'] > df['prev_high'])
    )

    signals = df[mask].copy()
    return signals
`
  },

  // ========================================
  // LC 3D GAP PATTERN (Multi-Day EMA Gap)
  // ========================================
  lc_3d_gap: {
    name: "LC 3D Gap",
    description: "Multi-day EMA gap patterns with progressive expansion",

    parameters: {
      day_14_avg_ema10_min: 0.25,
      day_14_avg_ema30_min: 0.5,
      day_7_avg_ema10_min: 0.25,
      day_7_avg_ema30_min: 0.75,
      day_3_avg_ema10_min: 0.5,
      day_3_avg_ema30_min: 1.0,
      day_2_ema10_distance_min: 1.0,
      day_2_ema30_distance_min: 2.0,
      day_1_ema10_distance_min: 1.5,
      day_1_ema30_distance_min: 3.0,
      day_1_vol_min: 7_000_000,
      day_1_close_min: 20.0,
      day_0_gap_min: 0.5,
    },

    detectionLogic: `
def calculate_avg_ema_distance_multiple(self, highs, ema, atr, lookback):
    """Calculate average EMA distance over lookback period"""
    distances = []
    for i in range(min(lookback, len(highs))):
        pos = -(i + 1)  # From end (most recent)
        high = highs.iloc[pos]
        ema_val = ema.iloc[pos]
        distance_multiple = (high - ema_val) / atr
        distances.append(distance_multiple)
    return sum(distances) / len(distances) if distances else 0.0

def process_ticker_3(self, ticker_data: tuple) -> list:
    """Process LC 3D Gap pattern"""
    ticker, ticker_df, d0_start, d0_end = ticker_data
    signals = []

    for i in range(93, len(ticker_df)):
        r0 = ticker_df.iloc[i]  # D0
        r_1 = ticker_df.iloc[i-1]  # D-1
        atr_day_1 = r_1['ATR']

        # Day -14 averages (14 days ending at day -15)
        ema10_slice_14 = ticker_df['EMA_10'].iloc[i-28:i-14]
        day_14_avg_ema10 = self.calculate_avg_ema_distance_multiple(
            ticker_df['high'].iloc[i-28:i-14], ema10_slice_14, atr_day_1, 14
        )

        # Day -7 averages
        ema10_slice_7 = ticker_df['EMA_10'].iloc[i-21:i-14]
        day_7_avg_ema10 = self.calculate_avg_ema_distance_multiple(
            ticker_df['high'].iloc[i-21:i-14], ema10_slice_7, atr_day_1, 7
        )

        # Day -3 averages
        ema10_slice_3 = ticker_df['EMA_10'].iloc[i-17:i-14]
        day_3_avg_ema10 = self.calculate_avg_ema_distance_multiple(
            ticker_df['high'].iloc[i-17:i-14], ema10_slice_3, atr_day_1, 3
        )

        # Progressive EMA distance check
        if (
            day_14_avg_ema10 >= self.params['day_14_avg_ema10_min'] and
            day_7_avg_ema10 >= self.params['day_7_avg_ema10_min'] and
            day_3_avg_ema10 >= self.params['day_3_avg_ema10_min'] and

            # Day -2 distances
            ((r_1['high'] - r_1['EMA_10']) / atr_day_1) >= self.params['day_2_ema10_distance_min'] and

            # Day 0 gap
            r0['Day_0_Gap'] >= self.params['day_0_gap_min']
        ):
            signals.append({ticker, r0['date'], r0['close'], r0['volume']})

    return signals
`
  },

  // ========================================
  // D1 GAP PATTERN (Pre-Market Gap)
  // ========================================
  d1_gap: {
    name: "D1 Gap",
    description: "Pre-market gap with intraday confirmation",

    parameters: {
      price_min: 0.75,
      gap_pct_min: 0.5,
      open_over_prev_high_pct_min: 0.3,
      ema200_max_pct: 0.8,
      pm_high_pct_min: 0.5,
      pm_vol_min: 5_000_000,
    },

    detectionLogic: `
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """Stage 3a: Daily pattern detection"""
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(self.d0_start)) &
        (df['Date'] <= pd.to_datetime(self.d0_end))
    ].copy()

    # EMA200 filter: close <= 80% of EMA200
    mask = (
        (df_d0['Close_over_EMA200_Pct'] <= self.params['ema200_max_pct']) &
        (df_d0['Gap_Pct'] >= self.params['gap_pct_min']) &
        (df_d0['Open_over_Prev_High_Pct'] >= self.params['open_over_prev_high_pct_min'])
    )

    candidates = df_d0[mask].copy()

    # Stage 3b: Pre-market minute data check (ONLY for candidates)
    signals_list = []
    for candidate in candidates:
        pm_data = self.fetch_premarket_data(candidate['ticker'], candidate['date'])

        if pm_data and (
            pm_data['pm_high_pct'] >= self.params['pm_high_pct_min'] and
            pm_data['pm_vol'] >= self.params['pm_vol_min']
        ):
            signals_list.append(candidate)

    return pd.DataFrame(signals_list)
`
  },

  // ========================================
  // EXTENDED GAP PATTERN
  // ========================================
  extended_gap: {
    name: "Extended Gap",
    description: "Extended gap patterns with range expansion",

    parameters: {
      day_minus_1_vol_min: 20_000_000,
      breakout_extension_min: 1.0,
      d1_high_to_ema10_div_atr_min: 1.0,
      d1_high_to_ema30_div_atr_min: 1.0,
      d1_low_to_pmh_vs_atr_min: 1.0,
      pmh_pct_min: 5.0,
      d1_change_pct_min: 2.0,
      d0_open_above_d1_high: true,
      range_d1h_d2l_min: 1.5,
      range_d1h_d3l_min: 3.0,
      range_d1h_d8l_min: 5.0,
      range_d1h_d15l_min: 6.0,
    },

    detectionLogic: `
def process_ticker_3(self, ticker_data: tuple) -> list:
    """Process Extended Gap pattern"""
    ticker, ticker_df, d0_start, d0_end = ticker_data
    signals = []

    for i in range(19, len(ticker_df)):
        r0 = ticker_df.iloc[i]  # D0
        r_1 = ticker_df.iloc[i-1]  # D-1

        # Breakout extension
        breakout_extension = (r_1['D1_High'] - r_1['High_14d']) / r_1['ATR']

        # EMA positioning
        d1h_ema10_div_atr = (r_1['D1_High'] - r_1['EMA_10']) / r_1['ATR']
        d1h_ema30_div_atr = (r_1['D1_High'] - r_1['EMA_30']) / r_1['ATR']

        # Range expansion
        range_d1h_d2l = (r_1['D1_High'] - r0['Low_2']) / r_1['ATR']
        range_d1h_d3l = (r_1['D1_High'] - r0['Low_3']) / r_1['ATR']

        if (
            breakout_extension >= self.params['breakout_extension_min'] and
            d1h_ema10_div_atr >= self.params['d1_high_to_ema10_div_atr_min'] and
            d1h_ema30_div_atr >= self.params['d1_high_to_ema30_div_atr_min'] and
            range_d1h_d2l >= self.params['range_d1h_d2l_min'] and
            range_d1h_d3l >= self.params['range_d1h_d3l_min'] and
            r_1['D1_Change_Pct'] >= self.params['d1_change_pct_min'] and
            r0['PMH_Pct'] >= self.params['pmh_pct_min'] and
            r0['open'] >= r_1['D1_High']
        ):
            signals.append({ticker, r0['date'], r0['close'], r0['volume']})

    return signals
`
  }
};

// ============================================================
// SECTION 3: RULE #5 COMPLIANCE (CRITICAL)
// ============================================================

export const RULE_5_COMPLIANCE = {
  name: "Rule #5: Feature Computation Order",
  description: "CRITICAL: Features MUST be computed BEFORE dropna()",

  correctPattern: `
def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
    # ✅ CORRECT ORDER

    # Step 1: Compute ALL features FIRST
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['ADV20_USD'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
        lambda x: x.rolling(window=20, min_periods=20).mean()
    )
    df['price_range'] = df['high'] - df['low']

    # Step 2: THEN drop NaNs
    df = df.dropna(subset=['prev_close', 'ADV20_USD', 'price_range'])

    return df
`,

  incorrectPattern: `
def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
    # ❌ WRONG ORDER - Causes KeyError!

    # Step 1: dropna TOO EARLY
    df = df.dropna(subset=['prev_close', 'ADV20_USD', 'price_range'])

    # Step 2: Then compute features (WRONG - data already lost!)
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['ADV20_USD'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(...)
    df['price_range'] = df['high'] - df['low']

    return df
`
};

// ============================================================
// SECTION 4: VALIDATION CHECKLIST
// ============================================================

export const VALIDATION_CHECKLIST = {
  structure: [
    "Has class definition",
    "Has __init__ method with api_key, d0_start, d0_end parameters",
    "Stores api_key, d0_start, d0_end in self",
    "Has self.params dictionary",
    "Has all required methods",
    "Uses ThreadPoolExecutor for parallel processing",
    "Uses grouped endpoint API (not per-ticker)",
  ],

  rule5: [
    "Features computed BEFORE dropna()",
    "prev_close computed with shift(1)",
    "ADV20 computed BEFORE dropna",
    "price_range computed BEFORE dropna",
    "dropna() called LAST in apply_smart_filters",
  ],

  logic: [
    "Uses groupby + transform for rolling calculations",
    "Shift operations correct (shift(1), shift(2), etc.)",
    "EMAs computed with ewm().mean()",
    "ATR computed on True Range then rolled",
    "Proper ticker-based grouping",
  ]
};

// ============================================================
// SECTION 5: PARAMETER TEMPLATE SYSTEM
// ============================================================

export const PARAMETER_TEMPLATES = {
  // ========================================
  // TWO-TIER ARCHITECTURE
  // ========================================
  twoTier: {
    description: "Mass parameters (shared) + Individual parameters (pattern-specific)",

    massParameters: {
      // API Configuration
      api_key: "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
      base_url: "https://api.polygon.io",

      // Date Configuration
      d0_start: "2025-01-01",
      d0_end: "2025-12-31",
      scan_start: "2022-01-01",  // Calculated from d0_start - lookback

      // Worker Configuration
      stage1_workers: 5,
      stage3_workers: 10,
    },

    individualParameters: {
      // Backside B specific
      backside_b: {
        price_min: 8.0,
        adv20_min_usd: 30_000_000,
        pos_abs_max: 0.75,
      },

      // LC D2 specific
      lc_d2: {
        high_pct_chg_min: 0.3,
        close_min: 5,
        volume_min: 10_000_000,
      },

      // A+ Para specific
      a_plus_para: {
        slope3d_min: 10,
        slope5d_min: 20,
        atr_abs_min: 3.0,
      }
    }
  }
};

// ============================================================
// EXPORT COMPLETE LIBRARY
// ============================================================

export const EDGEDEV_PATTERN_LIBRARY = {
  architecture: EDGEDEV_ARCHITECTURE,
  patterns: PATTERN_TEMPLATES,
  rule5: RULE_5_COMPLIANCE,
  validation: VALIDATION_CHECKLIST,
  parameters: PARAMETER_TEMPLATES,
};
