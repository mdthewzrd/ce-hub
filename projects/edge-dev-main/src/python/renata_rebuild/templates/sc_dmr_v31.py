"""
🚀 GROUPED ENDPOINT SC DMR MULTI-SCANNER - V31 STANDARD
===========================================================

SMALL CAP D2/D3/D4 MULTI-PATTERN SCANNER WITH 3-STAGE GROUPED ENDPOINT ARCHITECTURE

V31 STRUCTURE COMPLIANT:
- d0_start_user/d0_end_user for date handling
- run_scan() main entry point
- fetch_grouped_data() (NOT fetch_all)
- apply_smart_filters() for D0 validation
- compute_simple_features() for basic filters
- compute_full_features() for all indicators
- detect_patterns() with vectorized masks

Pattern Types (10 total):
- D2_PM_Setup: 4 variants with different gap/gain requirements
- D2_PM_Setup_2: Stricter variant
- D2_PMH_Break: Gap >= 0.2
- D2_PMH_Break_1: Gap < 0.2
- D2_No_PMH_Break: High below pre-market high
- D2_Extreme_Gap: Gap >= 1x previous range
- D2_Extreme_Intraday_Run: Intraday run >= 1x previous range
- D3: 2-day consecutive gaps >= 0.2
- D3_Alt: 2-day consecutive high gains >= 0.2
- D4: 3-day consecutive pattern (gains, gaps, highs)
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional


class GroupedEndpointSCDMRScanner:
    """
    SC DMR Multi-Scanner - V31 STRUCTURE COMPLIANT
    =================================================

    MULTI-PATTERN DETECTION FOR SMALL CAP STOCKS
    ----------------------------------------------

    Architecture (V31):
    ---------------
    Stage 1: fetch_grouped_data()
        - Polygon grouped endpoint
        - 1 API call per trading day (not per ticker)
        - Returns all tickers that traded each day

    Stage 2a: compute_simple_features()
        - prev_close, prev_volume, prev_open
        - prev_high, prev_high_2 ... prev_high_10 (for valid_trig_high)
        - pm_high estimate

    Stage 2b: apply_smart_filters()
        - Separate historical from output range
        - Apply filters ONLY to D0 range
        - Keep ALL historical data for calculations
        - Only keep tickers with 1+ passing D0 dates

    Stage 3a: compute_full_features()
        - All remaining shift columns
        - Gaps, ranges, ratios

    Stage 3b: detect_patterns()
        - Vectorized boolean masks (NO groupby loops)
        - 10 patterns detected in single pass
        - Results aggregated by ticker+date
    """

    def __init__(
        self,
        api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",
        d0_start: str = None,
        d0_end: str = None
    ):
        # ============================================================
        # ✅ V31: Store user's D0 range separately
        # ============================================================
        self.DEFAULT_D0_START = "2025-01-01"
        self.DEFAULT_D0_END = "2025-12-31"

        # ✅ CRITICAL: Use _user suffix for user-provided dates
        self.d0_start_user = d0_start or self.DEFAULT_D0_START
        self.d0_end_user = d0_end or self.DEFAULT_D0_END

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

        # ============================================================
        # ✅ V31: Calculate scan_start (historical data range)
        # ============================================================
        # Need: ~50 days for rolling windows (prev_high_10, etc.)
        lookback_buffer = 50
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_end = self.d0_end_user

        # Worker configuration
        self.stage1_workers = 5
        self.stage3_workers = 10

        print(f"🚀 GROUPED ENDPOINT MODE: SC DMR MULTI-SCANNER (V31)")
        print(f"📅 Signal Output Range (D0): {self.d0_start_user} to {self.d0_end_user}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.d0_end}")

        # === SCANNER PARAMETERS ===
        self.params = {
            # Mass parameters (smart filters)
            "prev_close_min": 0.75,
            "prev_volume_min": 10_000_000,

            # Valid trigger high parameters
            "valid_trig_high_enabled": True,

            # D2_PM_Setup parameters
            "d2_pm_setup_gain_min": 0.2,
            "d2_pm_setup_dol_pmh_gap_vs_range_min": 0.5,
            "d2_pm_setup_pct_pmh_gap_min": 0.5,
            "d2_pm_setup_prev_close_range_min": 0.5,
            "d2_pm_setup_strict_gain_min": 1.0,

            # D2_PMH_Break parameters
            "d2_pmh_break_gain_min": 1.0,
            "d2_pmh_break_gap_min": 0.2,
            "d2_pmh_break_dol_gap_vs_range_min": 0.3,
            "d2_pmh_break_opening_range_min": 0.5,

            # D2_Extreme parameters
            "d2_extreme_dol_gap_vs_range_min": 1.0,
            "d2_extreme_intraday_run_vs_range_min": 1.0,
            "d2_extreme_prev_close_range_min": 0.3,

            # D3/D4 parameters
            "d3_gain_min": 0.2,
            "d3_gap_min": 0.2,
            "d4_gain_min": 0.2,
        }

    # ==================== V31: run_scan() MAIN ENTRY POINT ====================

    def run_scan(self):
        """
        ✅ V31 REQUIRED: Main entry point that calls all stages in order
        """
        print(f"\n{'='*70}")
        print("🚀 SC DMR MULTI-SCANNER - V31 STRUCTURE")
        print(f"{'='*70}")

        start_time = time.time()

        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.d0_end)
        print(f"📅 Trading days to fetch: {len(trading_dates)}")

        # Stage 1: Fetch grouped data
        print(f"\n{'='*70}")
        print("📥 STAGE 1: FETCH GROUPED DATA")
        print(f"{'='*70}")
        stage1_data = self.fetch_grouped_data(trading_dates)

        if stage1_data.empty:
            print("❌ No data fetched from API")
            return []

        # Stage 2a: Compute simple features
        print(f"\n{'='*70}")
        print("📊 STAGE 2a: COMPUTE SIMPLE FEATURES")
        print(f"{'='*70}")
        stage2a_data = self.compute_simple_features(stage1_data)

        # Stage 2b: Apply smart filters
        print(f"\n{'='*70}")
        print("🔍 STAGE 2b: APPLY SMART FILTERS (V31)")
        print(f"{'='*70}")
        stage2b_data = self.apply_smart_filters(stage2a_data)

        if stage2b_data.empty:
            print("❌ No data after smart filters")
            return []

        # Stage 3a: Compute full features
        print(f"\n{'='*70}")
        print("⚙️  STAGE 3a: COMPUTE FULL FEATURES")
        print(f"{'='*70}")
        stage3a_data = self.compute_full_features(stage2b_data)

        # Stage 3b: Detect patterns
        print(f"\n{'='*70}")
        print("🎯 STAGE 3b: DETECT PATTERNS (VECTORIZED)")
        print(f"{'='*70}")
        results = self.detect_patterns(stage3a_data)

        elapsed = time.time() - start_time
        print(f"\n{'='*70}")
        print(f"✅ TOTAL SCAN TIME: {elapsed:.2f}s")
        print(f"{'='*70}\n")

        return results

    # ==================== STAGE 1: FETCH GROUPED DATA ====================

    def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
        """Get all valid NYSE trading days (skips weekends/holidays)"""
        schedule = self.us_calendar.schedule(
            start_date=pd.to_datetime(start_date),
            end_date=pd.to_datetime(end_date)
        )
        trading_days = self.us_calendar.valid_days(
            start_date=pd.to_datetime(start_date),
            end_date=pd.to_datetime(end_date)
        )
        return [date.strftime('%Y-%m-%d') for date in trading_days]

    def fetch_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
        """
        ✅ V31: Stage 1 - Fetch grouped data (NOT fetch_all)

        One API call per trading day, returns all tickers that traded that day.
        """
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

                    # Progress updates
                    if completed % 50 == 0:
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
        df = pd.concat(all_data, ignore_index=True)
        df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

        print(f"🚀 Stage 1 Complete ({elapsed:.1f}s):")
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

    # ==================== STAGE 2a: COMPUTE SIMPLE FEATURES ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ✅ V31: Stage 2a - ONLY compute features needed for smart filtering

        For SC DMR: prev_close, prev_volume, prev_open, prev_high_X (for valid_trig_high)
        """
        print(f"📊 Computing simple features...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # Previous close (for price filter)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # Previous volume (for volume filter)
        df['prev_volume'] = df.groupby('ticker')['volume'].shift(1)

        # Previous open (for bullish candle filter)
        df['prev_open'] = df.groupby('ticker')['open'].shift(1)

        # Previous highs (needed for valid_trig_high calculation)
        # This is a MASSIVE filter - only ~5% of rows pass this
        df['prev_high'] = df.groupby('ticker')['high'].shift(1)
        df['prev_high_2'] = df.groupby('ticker')['high'].shift(2)
        df['prev_high_3'] = df.groupby('ticker')['high'].shift(3)
        df['prev_high_4'] = df.groupby('ticker')['high'].shift(4)
        df['prev_high_5'] = df.groupby('ticker')['high'].shift(5)
        df['prev_high_6'] = df.groupby('ticker')['high'].shift(6)
        df['prev_high_7'] = df.groupby('ticker')['high'].shift(7)
        df['prev_high_8'] = df.groupby('ticker')['high'].shift(8)
        df['prev_high_9'] = df.groupby('ticker')['high'].shift(9)
        df['prev_high_10'] = df.groupby('ticker')['high'].shift(10)

        # Valid trigger high: prev_high >= all 9 previous highs
        df['valid_trig_high'] = (
            (df['prev_high'] >= df['prev_high_2']) &
            (df['prev_high'] >= df['prev_high_3']) &
            (df['prev_high'] >= df['prev_high_4']) &
            (df['prev_high'] >= df['prev_high_5']) &
            (df['prev_high'] >= df['prev_high_6']) &
            (df['prev_high'] >= df['prev_high_7']) &
            (df['prev_high'] >= df['prev_high_8']) &
            (df['prev_high'] >= df['prev_high_9']) &
            (df['prev_high'] >= df['prev_high_10'])
        )

        # Pre-market high estimate (max of open and high)
        df['pm_high'] = df[['open', 'high']].max(axis=1)

        print(f"   ✅ Computed simple features")

        return df

    # ==================== STAGE 2b: APPLY SMART FILTERS ====================

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ✅ V31: Stage 2b - Smart filters on D0 range only

        CRITICAL ARCHITECTURE REQUIREMENT:
        This method validates WHICH D0 DATES to check, not which tickers to keep.

        Key Requirements:
        1. Keep ALL historical data for calculations
        2. Use smart filters to identify D0 dates in output range worth checking
        3. Separate historical data from signal output range
        4. Apply filters ONLY to signal output range (not historical)
        5. Combine back together for Stage 3
        """
        print(f"📊 Input rows: {len(df):,}")
        print(f"📊 Signal output range: {self.d0_start_user} to {self.d0_end_user}")

        # Remove rows with NaN in critical columns
        df = df.dropna(subset=['prev_close', 'prev_volume', 'valid_trig_high'])

        # ============================================================
        # ✅ V31: Separate historical from signal output range
        # ============================================================
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        print(f"📊 Historical rows (kept for calculations): {len(df_historical):,}")
        print(f"📊 Signal output range D0 dates: {len(df_output_range):,}")

        # ============================================================
        # ✅ V31: Apply filters ONLY to output range
        # ============================================================
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= self.params['prev_close_min']) &
            (df_output_range['prev_volume'] >= self.params['prev_volume_min']) &
            (df_output_range['valid_trig_high'] == True)
        ].copy()

        print(f"📊 D0 dates passing smart filters: {len(df_output_filtered):,}")

        # ============================================================
        # ✅ V31: Combine: all historical + filtered D0 dates
        # ============================================================
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # ============================================================
        # ✅ V31: Only keep tickers with 1+ passing D0 dates
        # ============================================================
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        print(f"📊 After filtering to tickers with 1+ passing D0 dates: {len(df_combined):,} rows")
        print(f"📊 Unique tickers: {df_combined['ticker'].nunique():,}")

        return df_combined

    # ==================== STAGE 3a: COMPUTE FULL FEATURES ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ✅ V31: Stage 3a - Compute all remaining features needed for patterns
        """
        print(f"📊 Computing full features...")

        # Previous low
        df['prev_low'] = df.groupby('ticker')['low'].shift(1)

        # Previous opens
        df['prev_open_2'] = df.groupby('ticker')['open'].shift(2)
        df['prev_open_3'] = df.groupby('ticker')['open'].shift(3)

        # Ranges
        df['range'] = df['high'] - df['low']
        df['prev_range'] = df.groupby('ticker')['range'].shift(1)
        df['prev_range_2'] = df.groupby('ticker')['range'].shift(2)

        # Gaps
        df['dol_gap'] = df['open'] - df['prev_close']
        df['dol_pmh_gap'] = df['pm_high'] - df['prev_close']
        df['pct_pmh_gap'] = (df['pm_high'] / df['prev_close']) - 1
        df['gap'] = (df['open'] / df['prev_close']) - 1
        df['prev_gap'] = df.groupby('ticker')['gap'].shift(1)
        df['prev_gap_2'] = df.groupby('ticker')['gap'].shift(2)

        # Opening range and close range
        df['opening_range'] = (df['open'] - df['prev_close']) / (df['pm_high'] - df['prev_close'])
        df['close_range'] = (df['close'] - df['open']) / (df['high'] - df['open'])
        df['prev_close_range'] = df.groupby('ticker')['close_range'].shift(1)
        df['prev_close_range_2'] = df.groupby('ticker')['close_range'].shift(2)

        # Previous close values
        df['prev_close_1'] = df.groupby('ticker')['prev_close'].shift(1)
        df['prev_close_2'] = df.groupby('ticker')['prev_close'].shift(2)
        df['prev_close_3'] = df.groupby('ticker')['prev_close'].shift(3)

        # Previous volumes
        df['prev_volume_2'] = df.groupby('ticker')['volume'].shift(2)
        df['prev_volume_3'] = df.groupby('ticker')['volume'].shift(3)

        print(f"   ✅ Computed full features")

        return df

    # ==================== STAGE 3b: DETECT PATTERNS ====================

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        ✅ V31: Stage 3b - Vectorized multi-pattern detection

        NO groupby loops - use boolean masks for speed
        """
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()

        # Convert date for filtering
        df['Date'] = pd.to_datetime(df['date'])

        # Drop rows with NaN in critical columns
        df = df.dropna(subset=[
            'valid_trig_high', 'prev_high', 'prev_close_1', 'prev_close',
            'prev_volume', 'prev_open', 'prev_low', 'prev_range',
            'dol_gap', 'dol_pmh_gap', 'pct_pmh_gap', 'gap', 'prev_gap', 'prev_gap_2',
            'opening_range', 'close_range', 'prev_close_range', 'prev_close_range_2',
            'pm_high', 'high', 'open'
        ])

        # Filter to D0 range and ensure valid_trig_high
        df_d0 = df[
            (df['Date'] >= pd.to_datetime(self.d0_start_user)) &
            (df['Date'] <= pd.to_datetime(self.d0_end_user)) &
            (df['valid_trig_high'] == True)
        ].copy()

        print(f"📊 Rows after D0 filter and valid_trig_high: {len(df_d0):,}")

        # Collect all signals from all patterns
        all_signals = []

        # ==================== D2_PM_SETUP (4 VARIANTS) ====================
        # Variant 1: gain >= 1.0 (100%)
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

        # Variant 2: gain >= 0.2, prev_gap_2 >= 0.2
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

        # Variant 3: 2-day gains >= 0.2
        mask = (
            ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 0.2) &
            ((df_d0['prev_high_2'] / df_d0['prev_close_2'] - 1) >= 0.2) &
            (df_d0['prev_range'] > df_d0['prev_range_2']) &
            (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 0.5) &
            (df_d0['pct_pmh_gap'] >= 0.5) &
            (df_d0['prev_close'] >= df_d0['prev_open']) &
            (df_d0['prev_close_1'] > df_d0['prev_open_2']) &
            (df_d0['prev_close'] >= 0.75) &
            (df_d0['prev_volume'] >= 10_000_000) &
            (df_d0['prev_volume_2'] >= 10_000_000)
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'D2_PM_Setup'
            all_signals.append(signals)

        # Variant 4: 3-day gains + 3-day volume
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
            (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 0.5) &
            (df_d0['pct_pmh_gap'] >= 0.5) &
            (df_d0['prev_close'] >= 0.75) &
            (df_d0['prev_volume'] >= 10_000_000) &
            (df_d0['prev_volume_2'] >= 10_000_000) &
            (df_d0['prev_volume_3'] >= 10_000_000)
        )
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'D2_PM_Setup'
            all_signals.append(signals)

        # ==================== D2_PM_SETUP_2 ====================
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

        # ==================== D2_PMH_BREAK ====================
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

        # ==================== D2_PMH_BREAK_1 ====================
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

        # ==================== D2_NO_PMH_BREAK ====================
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

        # ==================== D2_EXTREME_GAP ====================
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

        # ==================== D2_EXTREME_INTRADAY_RUN ====================
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

        # ==================== D3 ====================
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

        # ==================== D3_ALT ====================
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

        # ==================== D4 ====================
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

        # Combine all signals and aggregate by ticker+date
        if all_signals:
            signals = pd.concat(all_signals, ignore_index=True)

            # Aggregate by ticker+date: combine multiple patterns into comma-separated list
            signals_aggregated = signals.groupby(['ticker', 'Date'])['Scanner_Label'].apply(lambda x: ', '.join(sorted(set(x)))).reset_index()
            signals_aggregated.columns = ['Ticker', 'Date', 'Scanner_Label']

            print(f"\n📊 Unique ticker+date combinations: {len(signals_aggregated):,}")
            print(f"📊 Total pattern matches (including duplicates): {len(signals):,}")

            signals = signals_aggregated
        else:
            signals = pd.DataFrame()

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")

        return signals


# ==================== MAIN ENTRY POINT ====================

if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 SC DMR MULTI-SCANNER - V31 STRUCTURE")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python sc_dmr_v31.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python sc_dmr_v31.py 2024-01-01 2024-12-31")
    print("   python sc_dmr_v31.py 2024-06-01 2025-01-01")
    print("   python sc_dmr_v31.py  # Uses defaults")
    print("\n   Date format: YYYY-MM-DD")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    if d0_start:
        print(f"📅 Start Date: {d0_start}")
    if d0_end:
        print(f"📅 End Date: {d0_end}")

    scanner = GroupedEndpointSCDMRScanner(
        d0_start=d0_start,
        d0_end=d0_end
    )

    results = scanner.run_scan()

    if not results.empty:
        print(f"\n{'='*70}")
        print(f"✅ SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"📊 Final signals (D0 range): {len(results):,}")
        print(f"📊 Unique tickers: {results['Ticker'].nunique():,}")

        # Print signals by scanner type
        scanner_counts = results['Scanner_Label'].value_counts()
        print(f"\n📊 Signals by Scanner:")
        for scanner, count in scanner_counts.items():
            print(f"  • {scanner}: {count:,}")

        # Print all results
        print(f"\n{'='*70}")
        print("📊 ALL SIGNALS:")
        print(f"{'='*70}")
        for idx, row in results.iterrows():
            print(f"  {row['Ticker']:6s} | {row['Date']} | {row['Scanner_Label']}")

    print(f"\n✅ Done!")
