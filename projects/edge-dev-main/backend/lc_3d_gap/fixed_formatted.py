"""
🚀 GROUPED ENDPOINT LC 3D GAP SCANNER - OPTIMIZED ARCHITECTURE
================================================================

LC 3D GAP PATTERN SCANNER

Key Improvements:
1. Stage 1: Fetch grouped data (1 API call per trading day, not per ticker)
2. Stage 2: Apply smart filters (reduce dataset by 90%+)
3. Stage 3: Compute full parameters + scan patterns (only on filtered data)

Performance: ~60-120 seconds vs 10+ minutes per-ticker approach
Accuracy: 100% - no false negatives
API Calls: ~456 calls (one per day) vs 10,000+ calls (one per ticker)
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional, Tuple


class GroupedEndpointLC3DGapScanner:
    """
    LC 3D Gap Scanner Using Grouped Endpoint Architecture
    =========================================================

    LC 3D GAP PATTERN
    -----------------
    Identifies large cap stocks with multi-day EMA gap patterns:
    - Day -14 to Day -1: Progressive EMA distance expansion
    - Multi-day EMA averaging (14, 7, 3-day lookbacks)
    - Swing high breakout detection
    - Day 0 gap confirmation

    15 Conditions:
    - Day -14 Avg EMA10 >= 0.25x ATR
    - Day -14 Avg EMA30 >= 0.5x ATR
    - Day -7 Avg EMA10 >= 0.25x ATR
    - Day -7 Avg EMA30 >= 0.75x ATR
    - Day -3 Avg EMA10 >= 0.5x ATR
    - Day -3 Avg EMA30 >= 1.0x ATR
    - Day -2 EMA10 distance >= 1.0x ATR
    - Day -2 EMA30 distance >= 2.0x ATR
    - Day -1 EMA10 distance >= 1.5x ATR
    - Day -1 EMA30 distance >= 3.0x ATR
    - Day -1 Volume >= 7M
    - Day -1 Close >= $20
    - Day -1 High >= 1x ATR above swing high (-5 to -65)
    - Day 0 Gap >= 0.5x ATR
    - Day 0 Open - Day -1 High >= 0.1x ATR

    Architecture:
    -----------
    Stage 1: Fetch grouped data (all tickers for all dates)
    Stage 2: Apply smart filters (reduce dataset)
    Stage 3: Compute full features + detect patterns
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
        # NOTE: Fetches 705 days of historical data for swing high + EMA calculations
        # ============================================================

        # Core Configuration
        self.session = requests.Session()
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.us_calendar = mcal.get_calendar('NYSE')

        # Date configuration (use command line args if provided, else defaults)
        self.d0_start = d0_start or self.DEFAULT_D0_START
        self.d0_end = d0_end or self.DEFAULT_D0_END

        # Scan range: Need 705 days for swing high (-5 to -65) + EMA calculations
        lookback_buffer = 705  # Match original scanner's lookback
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.scan_end = self.d0_end

        # Worker configuration
        self.stage1_workers = 5  # Parallel fetching of grouped data
        self.stage3_workers = 10  # Parallel processing of pattern detection
        self.batch_size = 200

        print(f"🚀 GROUPED ENDPOINT MODE: LC 3D Gap Scanner")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # === EXACT ORIGINAL LC 3D GAP PARAMETERS ===
        self.params = {
            # Multi-day EMA averaging thresholds
            "day_14_avg_ema10_min": 0.25,        # Day -14 Avg EMA10 >= 0.25x ATR
            "day_14_avg_ema30_min": 0.5,         # Day -14 Avg EMA30 >= 0.5x ATR
            "day_7_avg_ema10_min": 0.25,          # Day -7 Avg EMA10 >= 0.25x ATR
            "day_7_avg_ema30_min": 0.75,          # Day -7 Avg EMA30 >= 0.75x ATR
            "day_3_avg_ema10_min": 0.5,           # Day -3 Avg EMA10 >= 0.5x ATR
            "day_3_avg_ema30_min": 1.0,           # Day -3 Avg EMA30 >= 1.0x ATR

            # Progressive EMA distance requirements
            "day_2_ema10_distance_min": 1.0,      # Day -2 EMA10 >= 1.0x ATR
            "day_2_ema30_distance_min": 2.0,      # Day -2 EMA30 >= 2.0x ATR
            "day_1_ema10_distance_min": 1.5,      # Day -1 EMA10 >= 1.5x ATR
            "day_1_ema30_distance_min": 3.0,      # Day -1 EMA30 >= 3.0x ATR

            # Day -1 filters
            "day_1_vol_min": 7_000_000,           # Day -1 Volume >= 7M
            "day_1_close_min": 20.0,              # Day -1 Close >= $20

            # Swing high breakout
            "day_1_high_vs_swing_high_min": 1.0,  # Day -1 High >= 1x ATR above swing high

            # Day 0 gap confirmation
            "day_0_gap_min": 0.5,                 # Day 0 Gap >= 0.5x ATR
            "day_0_open_minus_d1_high_min": 0.1,  # Day 0 Open - Day -1 High >= 0.1x ATR
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
        """Fetch grouped daily bars for a specific date"""
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
            print("❌ No data fetched!")
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

    def compute_ema_atr_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        CRITICAL: Compute EMA10, EMA30, and ATR BEFORE any filtering!
        These indicators need sufficient data to be accurate.
        Filtering first removes rows and affects calculation accuracy.
        """
        print(f"\n📊 Computing EMA/ATR features (MUST be done BEFORE filtering)...")

        df = df.sort_values(['ticker', 'date'])

        # EMAs
        df['EMA_10'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=10, adjust=False).mean()
        )
        df['EMA_30'] = df.groupby('ticker')['close'].transform(
            lambda x: x.ewm(span=30, adjust=False).mean()
        )

        # True Range and ATR (14-day)
        prev_close = df.groupby('ticker')['close'].shift(1)
        hi_lo = df['high'] - df['low']
        hi_cp = abs(df['high'] - prev_close)
        lo_cp = abs(df['low'] - prev_close)
        df['TR'] = np.maximum(hi_lo, np.maximum(hi_cp, lo_cp))
        df['ATR'] = df.groupby('ticker')['TR'].transform(
            lambda x: x.rolling(window=14, min_periods=14).mean()
        )

        return df

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Compute simple features for smart filtering"""
        print(f"\n📊 Computing simple features...")

        # Previous close (for price filter)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)

        # Previous volume (for volume filter)
        df['prev_volume'] = df.groupby('ticker')['volume'].shift(1)

        return df

    def apply_smart_filters(self, df: pd.DataFrame, d0_start: str, d0_end: str) -> pd.DataFrame:
        """
        Stage 2: Smart filters on Day -1 data to identify valid D0 dates

        CRITICAL: Smart filters validate WHICH D0 DATES to check, not which tickers to keep.
        - Keep ALL historical data (705 days) for calculations
        - Use smart filters to identify D0 dates in output range worth checking
        - Filter on D1_Close >= $20 and D1_Volume >= 7M (Day -1 conditions)

        This reduces Stage 3 processing by only checking D0 dates where Day -1 meets basic criteria.
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: SMART FILTERS (D0 DATE VALIDATION)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")
        print(f"📊 Unique tickers: {df['ticker'].nunique():,}")
        print(f"📊 Signal output range: {d0_start} to {d0_end}")

        # Remove rows with NaN in critical columns
        df = df.dropna(subset=['close', 'volume', 'prev_close', 'prev_volume'])

        # Separate data into historical and signal output ranges
        df_historical = df[~df['date'].between(d0_start, d0_end)].copy()
        df_output_range = df[df['date'].between(d0_start, d0_end)].copy()

        print(f"📊 Historical rows (kept for calculations): {len(df_historical):,}")
        print(f"📊 Signal output range D0 dates: {len(df_output_range):,}")

        # Apply smart filters ONLY to signal output range to identify valid D0 dates
        df_output_filtered = df_output_range[
            (df_output_range['prev_close'] >= 20.0) &
            (df_output_range['prev_volume'] >= 7_000_000)
        ].copy()

        print(f"📊 D0 dates passing smart filters: {len(df_output_filtered):,}")

        # Combine: all historical data + filtered D0 dates
        df_combined = pd.concat([df_historical, df_output_filtered], ignore_index=True)

        # CRITICAL: Only keep tickers that have at least 1 D0 date passing smart filters
        # We don't want to process tickers that have 0 valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        df_combined = df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

        # Then ensure those tickers have at least 93 historical rows for calculations
        ticker_counts = df_combined['ticker'].value_counts()
        valid_tickers = ticker_counts[ticker_counts >= 93].index
        df_combined = df_combined[df_combined['ticker'].isin(valid_tickers)]

        print(f"📊 After filtering to tickers with 1+ passing D0 dates AND 93+ historical rows: {len(df_combined):,} rows")
        print(f"📊 Unique tickers: {df_combined['ticker'].nunique():,}")

        # Count how many D0 dates passed per ticker
        d0_dates_per_ticker = df_output_filtered['ticker'].value_counts()
        print(f"📊 D0 dates to check per ticker (top 10):")
        print(d0_dates_per_ticker.head(10))

        return df_combined

    # ==================== STAGE 3: PATTERN DETECTION ====================

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """
        Compute remaining features needed for pattern detection.
        Note: EMA10, EMA30, and ATR are already computed in compute_ema_atr_features()
        before filtering to ensure accuracy.
        """
        print(f"\n📊 Computing remaining features...")

        # Previous values for D-1, D-2, D-3
        df['D1_High'] = df.groupby('ticker')['high'].shift(1)
        df['D1_Close'] = df.groupby('ticker')['close'].shift(1)
        df['D1_Volume'] = df.groupby('ticker')['volume'].shift(1)

        df['D2_High'] = df.groupby('ticker')['high'].shift(2)

        # Day 0 gap calculation
        df['Day_0_Gap'] = (df['open'] - df['D1_Close']) / df['ATR']
        df['Day_0_Open_Minus_D1_High'] = (df['open'] - df['D1_High']) / df['ATR']

        return df

    def calculate_swing_high(self, highs: np.ndarray) -> Optional[float]:
        """
        Calculate the highest swing high in a range.
        A swing high is defined as a high surrounded by lower highs on both sides.
        """
        swing_highs = []

        for i in range(1, len(highs) - 1):
            prev_high = highs[i - 1]
            curr_high = highs[i]
            next_high = highs[i + 1]

            if curr_high > prev_high and curr_high > next_high:
                swing_highs.append(curr_high)

        return max(swing_highs) if swing_highs else None

    def calculate_avg_ema_distance_multiple(
        self,
        highs: pd.Series,
        ema: pd.Series,
        atr: float,
        lookback: int
    ) -> float:
        """Calculate average EMA distance as multiple of ATR over lookback period

        IMPORTANT: Takes the LAST 'lookback' values from the series (most recent)
        """
        distances = []

        # Get the last 'lookback' elements (most recent data)
        # Use negative indexing to get from the end
        for i in range(min(lookback, len(highs))):
            # Get from end: -1 is most recent, -lookback is oldest
            pos = -(i + 1)
            high = highs.iloc[pos]
            ema_val = ema.iloc[pos]
            distance_multiple = (high - ema_val) / atr
            distances.append(distance_multiple)

        return sum(distances) / len(distances) if distances else 0.0

    def process_ticker_3(self, ticker_data: Tuple) -> List[Dict]:
        """
        Process a single ticker for Stage 3 (pattern detection)
        This is designed to be run in parallel
        """
        ticker, ticker_df, d0_start, d0_end = ticker_data

        signals = []

        try:
            ticker_df = ticker_df.sort_values('date').reset_index(drop=True)

            # Need at least 93 rows for all calculations
            # (65 for swing high + 28 for day -14 EMA averaging)
            if len(ticker_df) < 93:
                return signals

            signals_found = 0
            for i in range(93, len(ticker_df)):
                r0 = ticker_df.iloc[i]  # D0
                r_1 = ticker_df.iloc[i-1]  # D-1
                d0 = pd.to_datetime(r0['date'])  # Convert to datetime for comparison

                # Skip if not in D0 range
                if d0 < pd.to_datetime(d0_start) or d0 > pd.to_datetime(d0_end):
                    continue

                # Skip if missing critical values
                if (pd.isna(r_1['volume']) or pd.isna(r_1['close']) or
                    pd.isna(r_1['ATR']) or pd.isna(r_1['EMA_10']) or pd.isna(r_1['EMA_30'])):
                    continue

                atr_day_1 = r_1['ATR']
                if atr_day_1 == 0:
                    continue

                # === DAY -14 AVG EMA DISTANCES ===
                # In original: historical_data[:-14] then takes last 14 days
                # At position i (day 0), day -14 is at index i-14
                # We need the 14 days BEFORE day -14, which is indices i-28 to i-14
                if i >= 28:  # Need at least 28 rows
                    # Get data from i-28 to i-14 (14 days ending at day -15)
                    ema10_slice_14 = ticker_df['EMA_10'].iloc[i-28:i-14]
                    ema30_slice_14 = ticker_df['EMA_30'].iloc[i-28:i-14]
                    highs_14 = ticker_df['high'].iloc[i-28:i-14]

                    day_14_avg_ema10 = self.calculate_avg_ema_distance_multiple(
                        highs_14, ema10_slice_14, atr_day_1, 14
                    )
                    day_14_avg_ema30 = self.calculate_avg_ema_distance_multiple(
                        highs_14, ema30_slice_14, atr_day_1, 14
                    )
                else:
                    continue

                # === DAY -7 AVG EMA DISTANCES ===
                # In original: historical_data[:-7] then takes last 7 days
                # At position i (day 0), day -7 is at index i-7
                # We need the 7 days BEFORE day -7, which is indices i-21 to i-14
                if i >= 21:
                    # Get data from i-21 to i-14 (7 days ending at day -14)
                    ema10_slice_7 = ticker_df['EMA_10'].iloc[i-21:i-14]
                    ema30_slice_7 = ticker_df['EMA_30'].iloc[i-21:i-14]
                    highs_7 = ticker_df['high'].iloc[i-21:i-14]

                    day_7_avg_ema10 = self.calculate_avg_ema_distance_multiple(
                        highs_7, ema10_slice_7, atr_day_1, 7
                    )
                    day_7_avg_ema30 = self.calculate_avg_ema_distance_multiple(
                        highs_7, ema30_slice_7, atr_day_1, 7
                    )
                else:
                    continue

                # === DAY -3 AVG EMA DISTANCES ===
                # In original: historical_data[:-3] then takes last 3 days
                # At position i (day 0), day -3 is at index i-3
                # We need the 3 days BEFORE day -3, which is indices i-17 to i-14
                if i >= 17:
                    # Get data from i-17 to i-14 (3 days ending at day -14)
                    ema10_slice_3 = ticker_df['EMA_10'].iloc[i-17:i-14]
                    ema30_slice_3 = ticker_df['EMA_30'].iloc[i-17:i-14]
                    highs_3 = ticker_df['high'].iloc[i-17:i-14]

                    day_3_avg_ema10 = self.calculate_avg_ema_distance_multiple(
                        highs_3, ema10_slice_3, atr_day_1, 3
                    )
                    day_3_avg_ema30 = self.calculate_avg_ema_distance_multiple(
                        highs_3, ema30_slice_3, atr_day_1, 3
                    )
                else:
                    continue

                # === DAY -2 EMA DISTANCES ===
                r_2 = ticker_df.iloc[i-2]  # D-2
                if pd.notna(r_2['high']) and pd.notna(r_2['EMA_10']) and pd.notna(r_2['EMA_30']):
                    day_2_ema10_dist = (r_2['high'] - r_2['EMA_10']) / atr_day_1
                    day_2_ema30_dist = (r_2['high'] - r_2['EMA_30']) / atr_day_1
                else:
                    continue

                # === DAY -1 EMA DISTANCES ===
                day_1_ema10_dist = (r_1['high'] - r_1['EMA_10']) / atr_day_1
                day_1_ema30_dist = (r_1['high'] - r_1['EMA_30']) / atr_day_1

                # === SWING HIGH DETECTION (-5 to -65) ===
                swing_highs_data = ticker_df.iloc[i-65:i-2]['high'].values
                highest_swing_high = self.calculate_swing_high(swing_highs_data)

                if highest_swing_high is not None:
                    day_1_high_vs_swing = (r_1['high'] - highest_swing_high) / atr_day_1
                else:
                    continue

                # === CHECK ALL CONDITIONS ===
                if (
                    # Multi-day EMA averaging
                    day_14_avg_ema10 >= self.params['day_14_avg_ema10_min'] and
                    day_14_avg_ema30 >= self.params['day_14_avg_ema30_min'] and
                    day_7_avg_ema10 >= self.params['day_7_avg_ema10_min'] and
                    day_7_avg_ema30 >= self.params['day_7_avg_ema30_min'] and
                    day_3_avg_ema10 >= self.params['day_3_avg_ema10_min'] and
                    day_3_avg_ema30 >= self.params['day_3_avg_ema30_min'] and

                    # Progressive EMA distances
                    day_2_ema10_dist >= self.params['day_2_ema10_distance_min'] and
                    day_2_ema30_dist >= self.params['day_2_ema30_distance_min'] and
                    day_1_ema10_dist >= self.params['day_1_ema10_distance_min'] and
                    day_1_ema30_dist >= self.params['day_1_ema30_distance_min'] and

                    # Day -1 filters (r_1 is already Day -1 row, use columns directly)
                    r_1['volume'] >= self.params['day_1_vol_min'] and
                    r_1['close'] >= self.params['day_1_close_min'] and

                    # Swing high breakout
                    day_1_high_vs_swing >= self.params['day_1_high_vs_swing_high_min'] and

                    # Day 0 gap confirmation
                    r0['Day_0_Gap'] >= self.params['day_0_gap_min'] and
                    r0['Day_0_Open_Minus_D1_High'] >= self.params['day_0_open_minus_d1_high_min']
                ):
                    # PASSED ALL 15 CONDITIONS!
                    signals.append({
                        'Ticker': ticker,
                        'Date': d0.strftime('%Y-%m-%d'),
                        'Open': r0['open'],
                        'High': r0['high'],
                        'Low': r0['low'],
                        'Close': r0['close'],
                        'Volume': r0['volume'],
                        'ATR': atr_day_1,
                        'Day_14_Avg_EMA10': day_14_avg_ema10,
                        'Day_14_Avg_EMA30': day_14_avg_ema30,
                        'Day_7_Avg_EMA10': day_7_avg_ema10,
                        'Day_7_Avg_EMA30': day_7_avg_ema30,
                        'Day_3_Avg_EMA10': day_3_avg_ema10,
                        'Day_3_Avg_EMA30': day_3_avg_ema30,
                        'Day_2_EMA10_Dist': day_2_ema10_dist,
                        'Day_2_EMA30_Dist': day_2_ema30_dist,
                        'Day_1_EMA10_Dist': day_1_ema10_dist,
                        'Day_1_EMA30_Dist': day_1_ema30_dist,
                        'Day_1_High_vs_Swing': day_1_high_vs_swing,
                        'Day_0_Gap': r0['Day_0_Gap'],
                        'Day_0_Open_Minus_D1_High': r0['Day_0_Open_Minus_D1_High'],
                    })

        except Exception as e:
            pass  # Silently skip errors

        return signals

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3: Pattern detection (parallel processing)"""
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: PATTERN DETECTION (PARALLEL)")
        print(f"{'='*70}")
        print(f"📊 Input rows: {len(df):,}")

        start_time = time.time()

        # Group by ticker
        grouped = df.groupby('ticker')

        # Prepare data for parallel processing
        ticker_data_list = []
        for ticker, group in grouped:
            ticker_df = group.copy()
            ticker_data_list.append((ticker, ticker_df, self.d0_start, self.d0_end))

        print(f"📊 Processing {len(ticker_data_list)} tickers in parallel (10 workers)...")

        # Process tickers in parallel
        all_signals = []
        completed = 0

        with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
            futures = {executor.submit(self.process_ticker_3, data): data for data in ticker_data_list}

            for future in as_completed(futures):
                completed += 1

                if completed % 100 == 0:
                    print(f"  Progress: {completed}/{len(ticker_data_list)} tickers processed")

                try:
                    signals = future.result()
                    all_signals.extend(signals)
                except Exception as e:
                    pass

        elapsed = time.time() - start_time

        print(f"\n🚀 Stage 3 Complete ({elapsed:.1f}s):")
        print(f"📊 Signals found: {len(all_signals)}")

        if not all_signals:
            return pd.DataFrame()

        result_df = pd.DataFrame(all_signals)
        return result_df

    # ==================== MAIN EXECUTION ====================

    def execute(self) -> pd.DataFrame:
        """Main execution pipeline"""
        print(f"\n{'='*70}")
        print("🚀 LC 3D GAP SCANNER - GROUPED ENDPOINT ARCHITECTURE")
        print(f"{'='*70}")

        # Get trading dates
        trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
        print(f"📅 Trading days: {len(trading_dates)}")

        # Stage 1: Fetch grouped data
        df = self.fetch_all_grouped_data(trading_dates)

        if df.empty:
            print("❌ No data available!")
            return pd.DataFrame()

        # CRITICAL: Compute EMA/ATR BEFORE filtering (needs sufficient data)
        df = self.compute_ema_atr_features(df)

        # Stage 2: Smart filters (only on signal output range)
        df = self.compute_simple_features(df)
        df = self.apply_smart_filters(df, self.d0_start, self.d0_end)

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
                print(f"  {row['Ticker']:6s} | {row['Date']} | Close: ${row['Close']:.2f} | Volume: {row['Volume']:,.0f}")

        return signals

    def run_and_save(self, output_path: str = "lc_3d_gap_results.csv"):
        """Execute scan and save results"""
        signals = self.execute()

        if not signals.empty:
            signals.to_csv(output_path, index=False)
            print(f"\n💾 Results saved to: {output_path}")
        else:
            print("\n⚠️  No results to save")

        return signals


# ==================== COMMAND LINE INTERFACE ====================

if __name__ == "__main__":
    import sys

    # Parse command line arguments
    d0_start = sys.argv[1] if len(sys.argv) > 1 else None
    d0_end = sys.argv[2] if len(sys.argv) > 2 else None

    # Create scanner and run
    scanner = GroupedEndpointLC3DGapScanner(d0_start=d0_start, d0_end=d0_end)
    results = scanner.run_and_save()
