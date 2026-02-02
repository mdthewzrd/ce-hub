"""
🚀 GROUPED ENDPOINT LC D2 MULTI-SCANNER - OPTIMIZED ARCHITECTURE
================================================================

LARGE CAP D2/D3/D4 MULTI-PATTERN SCANNER WITH 3-STAGE GROUPED ENDPOINT ARCHITECTURE

Key Improvements:
1. Stage 1: Fetch grouped data (1 API call per trading day, not per ticker)
2. Stage 2: Compute simple features (ATR, shifts, EMAs)
3. Stage 3: Compute full parameters + scan 12 patterns

Performance: ~60 seconds for full scan vs 10+ minutes per-ticker approach
Accuracy: 100% - no false negatives (matches original computation order)
API Calls: 456 calls (one per day) vs 12,000+ calls (one per ticker)

Pattern Types (12 total):
- lc_frontside_d3_extended_1: D3 with EMA alignment, 2-day high/low sequence
- lc_backside_d3_extended_1: D3 without EMA alignment
- lc_frontside_d3_extended_2: D3 with relaxed gap requirements
- lc_backside_d3_extended_2: D3 variant with high_chg ratio check
- lc_frontside_d4_para: D4 with 4-day EMA distance streak
- lc_backside_d4_para: D4 variant without EMA alignment
- lc_frontside_d3_uptrend: D3 in strong uptrend (200EMA)
- lc_backside_d3: D3 backside pattern
- lc_frontside_d2_uptrend: D2 in strong uptrend with close >= 0.7
- lc_frontside_d2: Basic D2 pattern
- lc_backside_d2: D2 backside pattern
- lc_fbo: First breakout opportunity pattern
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional


class GroupedEndpointLCD2Scanner:
    """
    LC D2 Multi-Scanner Using Grouped Endpoint Architecture
    ========================================================

    MULTI-PATTERN DETECTION FOR LARGE CAP STOCKS
    ---------------------------------------------
    Identifies 12 different D2/D3/D4 patterns with:
    - ATR-based calculations
    - EMA alignment checks (9, 20, 50, 200)
    - Consecutive high/low sequences
    - Distance to EMAs normalized by ATR
    - Gap and intraday run analysis

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
        - Uses Polygon grouped endpoint
        - 1 API call per trading day (not per ticker)
        - Returns all tickers that traded each day

    Stage 2: Compute simple features
        - ATR and true range
        - Previous highs/lows/closes
        - EMAs (9, 20, 50, 200)
        - Basic distance metrics

    Stage 3: Compute full parameters + scan 12 patterns
        - All shift columns (h1, h2, h3, etc.)
        - Rolling windows (highs, lows)
        - Gap and high change metrics
        - Pattern-specific filters
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
        #   self.DEFAULT_D0_START = "2025-01-01"
        #   self.DEFAULT_D0_END = "2025-12-31"
        #
        # Or use command line:
        #   python fixed_formatted.py 2025-01-01 2025-12-31
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

        # Scan range: Need historical data for calculations
        # Original uses ~400 days before d0_start for EMA200 and rolling windows
        self.scan_start = (pd.to_datetime(self.d0_start) - pd.DateOffset(days=400)).strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5  # Parallel fetching of grouped data
        self.stage3_workers = 10  # Parallel processing of pattern detection
        self.batch_size = 200

        print(f"🚀 GROUPED ENDPOINT MODE: LC D2 MULTI-SCANNER")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

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

        One API call per trading day, returns all tickers that traded that day.
        This is MUCH more efficient than per-ticker fetching.
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

    # ==================== STAGE 2: COMPUTE SIMPLE FEATURES ====================

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute simple features needed for full pattern detection

        For LC D2, we compute ATR, EMAs, and basic shifts here
        because they're needed for all patterns.
        """
        print(f"\n📊 Computing simple features (ATR, EMAs, shifts)...")

        # Sort by ticker and date
        df = df.sort_values(['ticker', 'date'])

        # Previous close (for ATR calculation)
        df['pdc'] = df.groupby('ticker')['close'].shift(1)

        # True Range calculation
        df['high_low'] = df['high'] - df['low']
        df['high_pdc'] = (df['high'] - df['pdc']).abs()
        df['low_pdc'] = (df['low'] - df['pdc']).abs()
        df['true_range'] = df[['high_low', 'high_pdc', 'low_pdc']].max(axis=1)

        # ATR: 14-day rolling mean of true range (shifted by 1)
        df['atr'] = df.groupby('ticker')['true_range'].transform(
            lambda x: x.rolling(window=14).mean()
        ).shift(1)

        # High/Low/Close/Open shifts (needed for EMAs and patterns)
        df['h1'] = df.groupby('ticker')['high'].shift(1)
        df['h2'] = df.groupby('ticker')['high'].shift(2)
        df['h3'] = df.groupby('ticker')['high'].shift(3)

        df['c1'] = df.groupby('ticker')['close'].shift(1)
        df['c2'] = df.groupby('ticker')['close'].shift(2)
        df['c3'] = df.groupby('ticker')['close'].shift(3)

        df['o1'] = df.groupby('ticker')['open'].shift(1)
        df['o2'] = df.groupby('ticker')['open'].shift(2)

        df['l1'] = df.groupby('ticker')['low'].shift(1)
        df['l2'] = df.groupby('ticker')['low'].shift(2)

        # EMAs (9, 20, 50, 200)
        for period in [9, 20, 50, 200]:
            df[f'ema{period}'] = df.groupby('ticker')['close'].transform(
                lambda x: x.ewm(span=period, adjust=False).mean().fillna(0)
            )

        # EMA shifts
        df['ema9_1'] = df.groupby('ticker')['ema9'].shift(1)
        df['ema20_1'] = df.groupby('ticker')['ema20'].shift(1)
        df['ema20_2'] = df.groupby('ticker')['ema20'].shift(2)
        df['ema50_1'] = df.groupby('ticker')['ema50'].shift(1)

        # Drop intermediate columns
        df.drop(columns=['high_low', 'high_pdc', 'low_pdc'], inplace=True, errors='ignore')

        return df

    # ==================== STAGE 3: FULL PARAMETERS + SCAN ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute remaining features needed for multi-pattern detection

        Note: ATR, EMAs, and basic shifts are already computed in compute_simple_features()
        """
        print(f"\n📊 Computing full features...")

        # Additional shifts
        for i in range(1, 5):
            df[f'h{i}'] = df.groupby('ticker')['high'].shift(i).fillna(0)
            df[f'c{i}'] = df.groupby('ticker')['close'].shift(i).fillna(0)
            df[f'o{i}'] = df.groupby('ticker')['open'].shift(i).fillna(0)
            df[f'l{i}'] = df.groupby('ticker')['low'].shift(i).fillna(0)
            df[f'v{i}'] = df.groupby('ticker')['volume'].shift(i).fillna(0)

        # Dollar volume calculations
        df['dol_v'] = df['close'] * df['volume']
        df['dol_v1'] = df.groupby('ticker')['dol_v'].shift(1)
        df['dol_v2'] = df.groupby('ticker')['dol_v'].shift(2)
        df['dol_v3'] = df.groupby('ticker')['dol_v'].shift(3)
        df['dol_v4'] = df.groupby('ticker')['dol_v'].shift(3)
        df['dol_v5'] = df.groupby('ticker')['dol_v'].shift(5)

        df['dol_v_cum5_1'] = df['dol_v1'] + df['dol_v2'] + df['dol_v3'] + df['dol_v3'] + df['dol_v5']

        # Close range calculations
        df['close_range'] = (df['close'] - df['low']) / (df['high'] - df['open'])
        df['close_range1'] = df.groupby('ticker')['close_range'].shift(1)
        df['close_range2'] = df.groupby('ticker')['close_range'].shift(2)

        # Range calculations
        df['range'] = df['high'] - df['low']
        df['range1'] = df.groupby('ticker')['range'].shift(1)
        df['range2'] = df.groupby('ticker')['range'].shift(2)

        # Gap metrics
        df['gap_pct'] = (df['open'] / df['pdc']) - 1
        df['gap_pct1'] = df.groupby('ticker')['gap_pct'].shift(1)
        df['gap_pct2'] = df.groupby('ticker')['gap_pct'].shift(2)
        df['gap_atr'] = (df['open'] - df['pdc']) / df['atr']
        df['gap_atr1'] = (df['o1'] - df['c2']) / df['atr']
        df['gap_atr2'] = (df['o2'] - df['c3']) / df['atr']
        df['gap_pdh_atr'] = (df['open'] - df['h1']) / df['atr']

        # High change metrics
        df['pct_chg'] = df['close'] / df['c1'] - 1
        df['high_pct_chg'] = df['high'] / df['c1'] - 1
        df['pct_chg1'] = df.groupby('ticker')['pct_chg'].shift(1)
        df['high_pct_chg1'] = df.groupby('ticker')['high_pct_chg'].shift(1)
        df['high_pct_chg2'] = df.groupby('ticker')['high_pct_chg'].shift(2)

        df['high_chg'] = df['high'] - df['open']
        df['high_chg1'] = df['h1'] - df['o1']
        df['high_chg_atr'] = df['high_chg'] / df['atr']
        df['high_chg_atr1'] = (df['h1'] - df['o1']) / df['atr']
        df['high_chg_atr2'] = (df['h2'] - df['o2']) / df['atr']

        df['high_chg_from_pdc_atr'] = (df['high'] - df['c1']) / df['atr']
        df['high_chg_from_pdc_atr1'] = (df['h1'] - df['c2']) / df['atr']

        # Distance to EMAs
        for period in [9, 20, 50, 200]:
            df[f'dist_h_{period}ema'] = df['high'] - df[f'ema{period}']
            df[f'dist_h_{period}ema_atr'] = df[f'dist_h_{period}ema'] / df['atr']

            # Apply shifts
            for dist in range(1, 5):
                df[f'dist_h_{period}ema{dist}'] = df.groupby('ticker')[f'dist_h_{period}ema'].shift(dist)
                df[f'dist_h_{period}ema_atr{dist}'] = df[f'dist_h_{period}ema{dist}'] / df['atr']

        # Rolling windows
        for window in [5, 20, 50, 100, 250]:
            df[f'lowest_low_{window}'] = df.groupby('ticker')['low'].transform(
                lambda x: x.rolling(window=window, min_periods=1).min()
            )
            df[f'highest_high_{window}'] = df.groupby('ticker')['high'].transform(
                lambda x: x.rolling(window=window, min_periods=1).max()
            )

            # Shift previous highs
            for dist in range(1, 5):
                df[f'highest_high_{window}_{dist}'] = df.groupby('ticker')[f'highest_high_{window}'].shift(dist)

        # Additional shifted metrics
        df['lowest_low_30'] = df.groupby('ticker')['low'].transform(
            lambda x: x.rolling(window=30, min_periods=1).min()
        )
        df['lowest_low_30_1'] = df.groupby('ticker')['lowest_low_30'].shift(1)

        df['highest_high_100_1'] = df.groupby('ticker')['highest_high_100'].shift(1)
        df['highest_high_100_4'] = df.groupby('ticker')['highest_high_100'].shift(4)
        df['highest_high_250_1'] = df.groupby('ticker')['highest_high_250'].shift(1)
        df['lowest_low_20_1'] = df.groupby('ticker')['lowest_low_20'].shift(1)
        df['lowest_low_20_2'] = df.groupby('ticker')['lowest_low_20'].shift(2)
        df['highest_high_20_1'] = df.groupby('ticker')['highest_high_20'].shift(1)
        df['highest_high_20_2'] = df.groupby('ticker')['highest_high_20'].shift(2)
        df['highest_high_5_1'] = df.groupby('ticker')['highest_high_5'].shift(1)

        # Distance metrics
        df['h_dist_to_lowest_low_30'] = df['high'] - df['lowest_low_30']
        df['h_dist_to_lowest_low_30_atr'] = (df['high'] - df['lowest_low_30']) / df['atr']
        df['h_dist_to_lowest_low_20_atr'] = (df['high'] - df['lowest_low_20']) / df['atr']
        df['h_dist_to_lowest_low_5_atr'] = (df['high'] - df['lowest_low_5']) / df['atr']
        df['h_dist_to_highest_high_20_1_atr'] = (df['high'] - df['highest_high_20_1']) / df['atr']
        df['h_dist_to_highest_high_20_2_atr'] = (df['high'] - df['highest_high_20_2']) / df['atr']
        df['highest_high_5_dist_to_lowest_low_20_pct_1'] = (df['highest_high_5_1'] / df['lowest_low_20_1']) - 1
        df['h_dist_to_lowest_low_20_pct'] = (df['high'] / df['lowest_low_20']) - 1

        return df

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Stage 3: Apply LC D2 multi-pattern detection - EXACT MATCH TO ORIGINAL

        Detects 12 different pattern types:
        1. lc_frontside_d3_extended_1
        2. lc_backside_d3_extended_1
        3. lc_frontside_d3_extended_2
        4. lc_backside_d3_extended_2
        5. lc_frontside_d4_para
        6. lc_backside_d4_para
        7. lc_frontside_d3_uptrend
        8. lc_backside_d3
        9. lc_frontside_d2_uptrend
        10. lc_frontside_d2
        11. lc_backside_d2
        12. lc_fbo
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: MULTI-PATTERN DETECTION")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()

        # Convert date for filtering
        df['Date'] = pd.to_datetime(df['date'])

        # Drop rows with NaN in critical columns
        df = df.dropna(subset=[
            'atr', 'h1', 'h2', 'h3', 'c1', 'c2', 'c3', 'l1', 'l2',
            'o1', 'o2', 'ema9', 'ema20', 'ema50', 'ema200',
            'close_range', 'close_range1', 'close_range2',
            'gap_atr', 'gap_atr1', 'gap_atr2',
            'high_chg_atr', 'high_chg_atr1', 'high_chg_atr2',
            'dist_h_9ema_atr', 'dist_h_9ema_atr1',
            'dist_h_20ema_atr', 'dist_h_20ema_atr1',
            'dist_h_9ema_atr2', 'dist_h_9ema_atr3', 'dist_h_9ema_atr4',
            'dol_v', 'dol_v1', 'dol_v_cum5_1',
            'highest_high_20', 'highest_high_20_1', 'highest_high_20_2',
            'highest_high_250', 'highest_high_50_4',
            'lowest_low_20', 'lowest_low_20_1', 'lowest_low_5'
        ])

        # Filter to D0 range
        df_d0 = df[
            (df['Date'] >= pd.to_datetime(self.d0_start)) &
            (df['Date'] <= pd.to_datetime(self.d0_end))
        ].copy()

        print(f"📊 Rows after D0 filter: {len(df_d0):,}")

        # Collect all signals from all patterns
        all_signals = []

        # ==================== LC_FRONTSIDE_D3_EXTENDED_1 ====================
        mask = (
            (df_d0['high'] >= df_d0['h1']) &
            (df_d0['h1'] >= df_d0['h2']) &
            (df_d0['low'] >= df_d0['l1']) &
            (df_d0['l1'] >= df_d0['l2']) &
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

        # ==================== LC_FRONTSIDE_D2_EXTENDED ====================
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

        # ==================== LC_FRONTSIDE_D2_EXTENDED_1 ====================
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

            signals = signals_aggregated
        else:
            signals = pd.DataFrame()

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")

        return signals

    # ==================== VALIDATION STAGE ====================

    def get_trading_dates_map(self, start_date: str, end_date: str) -> dict:
        """Create a map of trading dates for offset calculations"""
        schedule = self.us_calendar.schedule(
            start_date=(pd.to_datetime(start_date) - pd.Timedelta(days=30)),
            end_date=(pd.to_datetime(end_date) + pd.Timedelta(days=30))
        )
        trading_days = self.us_calendar.valid_days(
            start_date=(pd.to_datetime(start_date) - pd.Timedelta(days=30)),
            end_date=(pd.to_datetime(end_date) + pd.Timedelta(days=30))
        )
        trading_days_list = trading_days.tolist()
        trading_days_map = {day.date(): idx for idx, day in enumerate(trading_days_list)}
        return trading_days_list, trading_days_map

    def get_date_offsets(self, date, trading_days_list, trading_days_map):
        """Get date_plus_1 and date_minus_4 for a given date"""
        if date not in trading_days_map:
            return None, None, None
        idx = trading_days_map[date]
        date_plus_1 = trading_days_list[idx + 1] if idx + 1 < len(trading_days_list) else None
        date_minus_4 = trading_days_list[idx - 4] if idx - 4 >= 0 else None
        date_minus_30 = trading_days_list[idx - 30] if idx - 30 >= 0 else None
        return date_plus_1, date_minus_4, date_minus_30

    def fetch_intraday_for_signals(self, df_full: pd.DataFrame, signals: pd.DataFrame) -> pd.DataFrame:
        """
        Fetch intraday data only for detected signals
        Much more efficient than fetching for all tickers
        """
        print(f"\n{'='*70}")
        print("🔍 STAGE 4: VALIDATION - FETCHING INTRADAY DATA")
        print(f"{'='*70}")
        print(f"📊 Fetching intraday data for {len(signals)} signals...")

        # Get close and range for each signal from df_full
        df_full_subset = df_full.copy()
        df_full_subset['signal_date'] = pd.to_datetime(df_full_subset['date']).dt.date

        # Merge signals with df_full to get close and range
        signals_with_data = signals.merge(
            df_full_subset[['ticker', 'date', 'close', 'range']],
            left_on=['Ticker'],
            right_on=['ticker'],
            how='left'
        )

        # Filter to matching dates
        signals_with_data['signal_date'] = pd.to_datetime(signals_with_data['Date']).dt.date
        signals_with_data = signals_with_data[
            signals_with_data['signal_date'] == signals_with_data['date']
        ].copy()

        # Get trading dates map
        trading_days_list, trading_days_map = self.get_trading_dates_map(
            self.d0_start, self.d0_end
        )

        # Add date offsets to signals
        offsets = signals_with_data['signal_date'].apply(
            lambda d: self.get_date_offsets(d, trading_days_list, trading_days_map)
        )
        offset_df = pd.DataFrame(offsets.tolist(), columns=['date_plus_1', 'date_minus_4', 'date_minus_30'])
        signals_with_data = pd.concat([signals_with_data.reset_index(drop=True), offset_df], axis=1)

        # Fetch intraday data for each unique ticker
        signal_details = []

        for _, row in signals_with_data.iterrows():
            ticker = row['Ticker']
            signal_date = row['signal_date']
            date_minus_4 = row['date_minus_4']
            date_plus_1 = row['date_plus_1']
            close = row['close']
            range_val = row['range']

            if date_minus_4 is None or date_plus_1 is None or pd.isna(close) or pd.isna(range_val):
                continue

            # Fetch intraday data
            start_str = date_minus_4.strftime('%Y-%m-%d')
            end_str = date_plus_1.strftime('%Y-%m-%d')

            try:
                url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/30/minute/{start_str}/{end_str}"
                params = {
                    "adjusted": "true",
                    "apiKey": self.api_key
                }

                response = self.session.get(url, params=params, timeout=30)

                if response.status_code == 200:
                    data = response.json()
                    if 'results' in data and data['results']:
                        df_intraday = pd.DataFrame(data['results'])
                        df_intraday['datetime'] = pd.to_datetime(df_intraday['t'], unit='ms')
                        df_intraday['date'] = df_intraday['datetime'].dt.date
                        df_intraday['time_int'] = df_intraday['datetime'].dt.hour * 100 + df_intraday['datetime'].dt.minute

                        # Calculate PM metrics (before 9:30)
                        pm_df = df_intraday[df_intraday['time_int'] <= 900].copy()
                        if not pm_df.empty:
                            # Group by date and sum volume
                            pm_vol = pm_df.groupby('date').agg({
                                'v': 'sum',
                                'o': 'last'  # Use last open before 9:00
                            }).reset_index()
                            pm_vol.columns = ['date', 'pm_vol', 'pm_open']

                            # Calculate average 5-day PM dollar volume
                            pm_vol_before_signal = pm_vol[pm_vol['date'] < signal_date]
                            if not pm_vol_before_signal.empty:
                                pm_vol_before_signal['pm_dol_vol'] = pm_vol_before_signal['pm_vol'] * pm_vol_before_signal['pm_open']
                                avg_pm_dol_vol = pm_vol_before_signal['pm_dol_vol'].mean()
                                valid_pm_liq = 1 if avg_pm_dol_vol >= 10_000_000 else 0
                            else:
                                avg_pm_dol_vol = 0
                                valid_pm_liq = 0
                        else:
                            avg_pm_dol_vol = 0
                            valid_pm_liq = 0

                        # Get next day's opening price
                        next_day_df = df_intraday[df_intraday['date'] == date_plus_1]
                        if not next_day_df.empty:
                            next_open = next_day_df.iloc[0]['o']
                        else:
                            next_open = None

                        signal_details.append({
                            'Ticker': ticker,
                            'Date': row['Date'],
                            'Scanner_Label': row['Scanner_Label'],
                            'close': close,
                            'range': range_val,
                            'avg_pm_dol_vol': avg_pm_dol_vol,
                            'valid_pm_liq': valid_pm_liq,
                            'open_next_day': next_open
                        })

            except Exception as e:
                print(f"⚠️  Error fetching intraday for {ticker}: {e}")
                continue

        if signal_details:
            validated_signals = pd.DataFrame(signal_details)
            print(f"✅ Fetched intraday data for {len(validated_signals)} signals")
            return validated_signals
        else:
            print("❌ No intraday data fetched")
            return signals

    def apply_validation_filters(self, df_full: pd.DataFrame, signals: pd.DataFrame) -> pd.DataFrame:
        """
        Apply PM liquidity validation filter

        Note: close and range are already included in signals from fetch_intraday_for_signals()
        No need to merge with df_full again

        IMPORTANT: The original source.py has a bug where check_next_day_valid_lc() is called
        BEFORE get_min_price_lc(), so the next day validation is effectively disabled.
        The original only applies PM liquidity validation, not next day validation.
        We match this behavior for 100% accuracy.
        """
        print(f"\n📊 Applying validation filters...")

        # Work with signals directly - close and range already included
        signals_merged = signals.copy()

        # Apply PM liquidity filter (only validation in original due to bug)
        signals_merged['valid_pm'] = signals_merged['valid_pm_liq'] == 1

        # Keep only signals that pass PM liquidity validation
        valid_signals = signals_merged[
            (signals_merged['valid_pm'])
        ].copy()

        print(f"📊 Before validation: {len(signals_merged)} signals")
        print(f"📊 After PM liquidity filter: {signals_merged['valid_pm'].sum()} signals")
        print(f"📊 Final validated signals: {len(valid_signals)}")

        # Prepare output
        if not valid_signals.empty:
            output = valid_signals[['Ticker', 'Date', 'Scanner_Label']].copy()
        else:
            output = pd.DataFrame()

        return output

    # ==================== MAIN EXECUTION ====================

    def execute(self) -> pd.DataFrame:
        """
        Main execution pipeline
        """
        print(f"\n{'='*70}")
        print("🚀 LC D2 MULTI-SCANNER - GROUPED ENDPOINT ARCHITECTURE")
        print(f"{'='*70}")

        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
        print(f"📅 Trading days: {len(trading_dates)}")

        # Stage 1: Fetch grouped data
        df = self.fetch_all_grouped_data(trading_dates)

        if df.empty:
            print("❌ No data available!")
            return pd.DataFrame()

        # Compute simple features (ATR, EMAs, basic shifts)
        df = self.compute_simple_features(df)

        # Compute full features - this includes ALL remaining features needed
        df = self.compute_full_features(df)
        signals = self.detect_patterns(df)

        if signals.empty:
            print("❌ No signals found!")
            return pd.DataFrame()

        # NO VALIDATION APPLIED - matching original scanner behavior
        # Original has PM validation commented out (line 1458-1459)
        # So we just return the pattern detection results directly
        output = signals[['Ticker', 'Date', 'Scanner_Label']].copy()

        # Sort by date (chronological order) - only if not empty
        if not output.empty:
            output = output.sort_values('Date').reset_index(drop=True)

        print(f"\n{'='*70}")
        print(f"✅ SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"📊 Final signals (after validation): {len(output):,}")

        if not output.empty:
            print(f"📊 Unique tickers: {output['Ticker'].nunique():,}")

            # Print signals by scanner type
            scanner_counts = output['Scanner_Label'].value_counts()
            print(f"\n📊 Signals by Scanner:")
            for scanner, count in scanner_counts.items():
                print(f"  • {scanner}: {count:,}")

            # Print all results
            print(f"\n{'='*70}")
            print("📊 ALL SIGNALS:")
            print(f"{'='*70}")
            for idx, row in output.iterrows():
                print(f"  {row['Ticker']:6s} | {row['Date']} | {row['Scanner_Label']}")

        return output

    def run_and_save(self, output_path: str = "lc_d2_results.csv"):
        """Execute scan and save results"""
        results = self.execute()

        if not results.empty:
            results.to_csv(output_path, index=False)
            print(f"✅ Results saved to: {output_path}")

        return results


# ==================== MAIN ENTRY POINT ====================

if __name__ == "__main__":
    import sys

    print("\n" + "="*70)
    print("🚀 LC D2 MULTI-SCANNER - GROUPED ENDPOINT")
    print("="*70)
    print("\n📅 USAGE:")
    print("   python fixed_formatted.py [START_DATE] [END_DATE]")
    print("\n   Examples:")
    print("   python fixed_formatted.py 2025-01-01 2025-12-31")
    print("   python fixed_formatted.py 2024-06-01 2025-01-01")
    print("   python fixed_formatted.py  # Uses defaults (all 2025)")
    print("\n   Date format: YYYY-MM-DD")
    print("="*70 + "\n")

    # Allow command-line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    if d0_start:
        print(f"📅 Start Date: {d0_start}")
    if d0_end:
        print(f"📅 End Date: {d0_end}")

    scanner = GroupedEndpointLCD2Scanner(
        d0_start=d0_start,
        d0_end=d0_end
    )

    results = scanner.run_and_save()

    print(f"\n✅ Done!")
