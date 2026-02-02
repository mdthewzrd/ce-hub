"""
UltraFastRenataSCDMRScannerV2

Edge.dev Standardized SC DMR Scanner (Multi-Scanner Architecture)
Scanner Type: SC DMR (10 Scanner Patterns - Individual Execution)

Original Source: sc_dmr/source.py
Formatted: 2025-12-26 (V2 - Individual Scanner Execution)

Edge.dev Standardizations Applied:
- Type-specific class naming
- 3-Stage Architecture
- Individual scanner execution (10 separate scanners)
- Parallel scanner execution for speed
- Session pooling with HTTPAdapter(100)
- Smart filtering per scanner

Pattern Type: 10 SC DMR Patterns
- D2_PM_Setup (4 variants with OR logic)
- D2_PM_Setup_2
- D2_PMH_Break
- D2_PMH_Break_1
- D2_No_PMH_Break
- D2_Extreme_Gap
- D2_Extreme_Intraday_Run
- D3
- D3_Alt
- D4
"""

import datetime
import time
import os
import json
import requests
import pandas as pd
import numpy as np
from concurrent.futures import ThreadPoolExecutor, as_completed
from requests.adapters import HTTPAdapter
from urllib3.util.retry import Retry
import pandas_market_calendars as mcal


class ScannerPattern:
    """Individual scanner pattern with its own parameters and logic."""

    def __init__(self, name: str, params: dict, detection_func):
        self.name = name
        self.params = params
        self.detection_func = detection_func

    def check_pattern(self, df: pd.DataFrame) -> pd.DataFrame:
        """Check if this pattern matches in the data."""
        return self.detection_func(df, self.params)


class UltraFastRenataSCDMRScannerV2:
    """
    SC DMR Scanner V2 - 10 Individual Scanner Patterns

    Architecture:
    - Each of the 10 scanner patterns runs independently
    - Each scanner has its own parameters
    - All 10 scanners run in parallel for speed
    - Results are combined at the end
    """

    def __init__(self, api_key: str = None):
        """Initialize the SC DMR scanner."""
        # Core API Configuration
        self.session = requests.Session()
        self.session.mount('https://', HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=Retry(total=2, backoff_factor=0.1)
        ))

        self.api_key = api_key or "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"
        self.base_url = "https://api.polygon.io"
        self.snapshot_endpoint = "/v2/snapshot/locale/us/markets/stocks/tickers"
        self.aggs_endpoint = "/v2/aggs"

        # Market calendar
        self.us_calendar = mcal.get_calendar('NYSE')

        # Threading configuration
        import multiprocessing as mp
        cpu_cores = mp.cpu_count() or 16
        self.stage1_workers = min(96, cpu_cores * 6)
        self.stage2_workers = min(72, cpu_cores * 4)
        self.scanner_workers = min(10, cpu_cores)  # Run up to 10 scanners in parallel

        print(f"🚀 RENATA ULTRA-FAST MODE: Stage1: {self.stage1_workers} threads, Stage2: {self.stage2_workers} threads")
        print(f"🔧 SCANNER TYPE: SC DMR Multi-Scanner (10 patterns, individual execution)")

        # ========== DATE RANGES ==========
        self.d0_start = "2025-01-01"
        self.d0_end = "2025-12-01"

        buffer_days = 10
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        self.scan_start = (datetime.datetime.now() - datetime.timedelta(days=365 + buffer_days)).strftime("%Y-%m-%d")
        self.scan_end = current_date

        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")

        # ========== INITIALIZE 10 SCANNER PATTERNS ==========
        self.scanner_patterns = self._initialize_scanners()

    def _initialize_scanners(self) -> list:
        """Initialize all 10 scanner patterns with their parameters and detection functions."""

        scanners = []

        # ========== D2_PM_Setup (4 variants with OR) ==========
        d2_pm_setup_params = {
            "name": "D2_PM_Setup",
            "desc": "D2 Pre-Market Setup (4 variants OR'd together)"
        }
        scanners.append(ScannerPattern(
            "D2_PM_Setup",
            d2_pm_setup_params,
            self._detect_d2_pm_setup
        ))

        # ========== D2_PM_Setup_2 ==========
        d2_pm_setup_2_params = {
            "name": "D2_PM_Setup_2",
            "desc": "D2 Pre-Market Setup Variant 2 (stricter)"
        }
        scanners.append(ScannerPattern(
            "D2_PM_Setup_2",
            d2_pm_setup_2_params,
            self._detect_d2_pm_setup_2
        ))

        # ========== D2_PMH_Break ==========
        d2_pmh_break_params = {
            "name": "D2_PMH_Break",
            "desc": "D2 Pre-Market High Breakout"
        }
        scanners.append(ScannerPattern(
            "D2_PMH_Break",
            d2_pmh_break_params,
            self._detect_d2_pmh_break
        ))

        # ========== D2_PMH_Break_1 ==========
        d2_pmh_break_1_params = {
            "name": "D2_PMH_Break_1",
            "desc": "D2 Pre-Market High Breakout Variant 1"
        }
        scanners.append(ScannerPattern(
            "D2_PMH_Break_1",
            d2_pmh_break_1_params,
            self._detect_d2_pmh_break_1
        ))

        # ========== D2_No_PMH_Break ==========
        d2_no_pmh_break_params = {
            "name": "D2_No_PMH_Break",
            "desc": "D2 No Pre-Market High Breakout"
        }
        scanners.append(ScannerPattern(
            "D2_No_PMH_Break",
            d2_no_pmh_break_params,
            self._detect_d2_no_pmh_break
        ))

        # ========== D2_Extreme_Gap ==========
        d2_extreme_gap_params = {
            "name": "D2_Extreme_Gap",
            "desc": "D2 Extreme Gap Pattern"
        }
        scanners.append(ScannerPattern(
            "D2_Extreme_Gap",
            d2_extreme_gap_params,
            self._detect_d2_extreme_gap
        ))

        # ========== D2_Extreme_Intraday_Run ==========
        d2_extreme_intraday_params = {
            "name": "D2_Extreme_Intraday_Run",
            "desc": "D2 Extreme Intraday Run"
        }
        scanners.append(ScannerPattern(
            "D2_Extreme_Intraday_Run",
            d2_extreme_intraday_params,
            self._detect_d2_extreme_intraday_run
        ))

        # ========== D3 ==========
        d3_params = {
            "name": "D3",
            "desc": "D3 (2-day consecutive gaps)"
        }
        scanners.append(ScannerPattern(
            "D3",
            d3_params,
            self._detect_d3
        ))

        # ========== D3_Alt ==========
        d3_alt_params = {
            "name": "D3_Alt",
            "desc": "D3 Alt (2-day consecutive highs)"
        }
        scanners.append(ScannerPattern(
            "D3_Alt",
            d3_alt_params,
            self._detect_d3_alt
        ))

        # ========== D4 ==========
        d4_params = {
            "name": "D4",
            "desc": "D4 (3-day consecutive pattern)"
        }
        scanners.append(ScannerPattern(
            "D4",
            d4_params,
            self._detect_d4
        ))

        print(f"📈 Scanner Patterns: {len(scanners)}")
        return scanners

    # ==================== PATTERN DETECTION FUNCTIONS ====================
    # Each function implements the EXACT logic from the original source code

    def _detect_d2_pm_setup(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_PM_Setup - 4 variants with OR logic (EXACT from original)"""
        mask = (
            # Variant 1: 100% gain requirement
            (
                (df['valid_trig_high'] == True) &
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                (df['pct_pmh_gap'] >= 0.5) &
                (df['prev_close_range'] >= 0.5) &
                (df['prev_close_raw'] >= df['prev_open']) &
                (df['prev_close_raw'] >= 0.75) &
                (df['prev_volume'] >= 10000000) &
                (df['prev_high'] >= df['prev_low'] * 1.5)
            ) |
            # Variant 2: 20% gain with gap_2
            (
                (df['valid_trig_high'] == True) &
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                (df['prev_gap_2'] >= 0.2) &
                (df['prev_range'] > df['prev_range_2']) &
                (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                (df['pct_pmh_gap'] >= 0.5) &
                (df['prev_close_raw'] >= df['prev_open']) &
                (df['prev_close_raw'] >= 0.75) &
                (df['prev_volume'] >= 10000000) &
                (df['prev_volume_2'] >= 10000000)
            ) |
            # Variant 3: 20% consecutive gains
            (
                (df['valid_trig_high'] == True) &
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                ((df['prev_high_2'] / df['prev_close_2'] - 1) >= 0.2) &
                (df['prev_range'] > df['prev_range_2']) &
                (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                (df['pct_pmh_gap'] >= 0.5) &
                (df['prev_close_raw'] >= df['prev_open']) &
                (df['prev_close_1'] > df['prev_open_2']) &
                (df['prev_close_raw'] >= 0.75) &
                (df['prev_volume'] >= 10000000) &
                (df['prev_volume_2'] >= 10000000)
            ) |
            # Variant 4: 20% 3-day consecutive
            (
                (df['valid_trig_high'] == True) &
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                ((df['prev_high_2'] / df['prev_close_2'] - 1) >= 0.2) &
                ((df['prev_high_3'] / df['prev_close_3'] - 1) >= 0.2) &
                (df['prev_close_raw'] > df['prev_open']) &
                (df['prev_close_1'] > df['prev_open_2']) &
                (df['prev_close_2'] > df['prev_open_3']) &
                (df['prev_close_raw'] > df['prev_close_1']) &
                (df['prev_close_1'] > df['prev_close_2']) &
                (df['prev_close_2'] > df['prev_close_3']) &
                (df['prev_high'] > df['prev_high_2']) &
                (df['prev_high_2'] > df['prev_high_3']) &
                (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                (df['pct_pmh_gap'] >= 0.5) &
                (df['prev_close_raw'] >= 0.75) &
                (df['prev_volume'] >= 10000000) &
                (df['prev_volume_2'] >= 10000000) &
                (df['prev_volume_3'] >= 10000000)
            )
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_PM_Setup'
            return matches
        return pd.DataFrame()

    def _detect_d2_pm_setup_2(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_PM_Setup_2 - Stricter variant (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
            (df['dol_pmh_gap'] >= df['prev_range'] * 1.0) &
            (df['pct_pmh_gap'] >= 1.0) &
            (df['prev_close_range'] >= 0.3) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_high'] >= df['prev_low'] * 1.5)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_PM_Setup_2'
            return matches
        return pd.DataFrame()

    def _detect_d2_pmh_break(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_PMH_Break (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
            (df['prev_gap'] >= 0.2) &
            (df['dol_gap'] >= df['prev_range'] * 0.3) &
            (df['opening_range'] >= 0.5) &
            (df['high'] >= df['pm_high']) &
            (df['prev_close_range'] >= 0.5) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_high'] >= df['prev_low'] * 1.5)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_PMH_Break'
            return matches
        return pd.DataFrame()

    def _detect_d2_pmh_break_1(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_PMH_Break_1 (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
            (df['prev_gap'] < 0.2) &
            (df['dol_gap'] >= df['prev_range'] * 0.3) &
            (df['opening_range'] >= 0.5) &
            (df['high'] >= df['pm_high']) &
            (df['prev_close_range'] >= 0.5) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_high'] >= df['prev_low'] * 1.5)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_PMH_Break_1'
            return matches
        return pd.DataFrame()

    def _detect_d2_no_pmh_break(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_No_PMH_Break (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
            (df['prev_gap'] >= 0.2) &
            (df['dol_gap'] >= df['prev_range'] * 0.3) &
            (df['opening_range'] >= 0.5) &
            (df['high'] < df['pm_high']) &
            (df['prev_close_range'] >= 0.5) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_No_PMH_Break'
            return matches
        return pd.DataFrame()

    def _detect_d2_extreme_gap(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_Extreme_Gap (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
            (df['dol_gap'] >= df['prev_range'] * 1.0) &
            (df['prev_close_range'] >= 0.3) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_high'] >= df['prev_low'] * 1.5)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_Extreme_Gap'
            return matches
        return pd.DataFrame()

    def _detect_d2_extreme_intraday_run(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D2_Extreme_Intraday_Run (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
            ((df['high'] - df['open']) >= df['prev_range'] * 1.0) &
            (df['dol_gap'] >= df['prev_range'] * 0.3) &
            (df['prev_close_range'] >= 0.5) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_high'] >= df['prev_low'] * 1.5)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D2_Extreme_Intraday_Run'
            return matches
        return pd.DataFrame()

    def _detect_d3(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D3 (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
            (df['prev_gap'] >= 0.2) &
            (df['prev_gap_2'] >= 0.2) &
            (df['prev_range'] > df['prev_range_2']) &
            (df['dol_gap'] >= df['prev_range'] * 0.3) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D3'
            return matches
        return pd.DataFrame()

    def _detect_d3_alt(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D3_Alt (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
            ((df['prev_high_2'] / df['prev_close_2'] - 1) >= 0.2) &
            (df['prev_range'] > df['prev_range_2']) &
            (df['dol_gap'] >= df['prev_range'] * 0.5) &
            (df['prev_close_raw'] >= df['prev_open']) &
            (df['prev_close_1'] > df['prev_open_2']) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D3_Alt'
            return matches
        return pd.DataFrame()

    def _detect_d4(self, df: pd.DataFrame, params: dict) -> pd.DataFrame:
        """D4 (EXACT from original)"""
        mask = (
            (df['valid_trig_high'] == True) &
            ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
            ((df['prev_high_2'] / df['prev_close_2'] - 1) >= 0.2) &
            ((df['prev_high_3'] / df['prev_close_3'] - 1) >= 0.2) &
            (df['prev_close_raw'] > df['prev_open']) &
            (df['prev_close_1'] > df['prev_open_2']) &
            (df['prev_close_2'] > df['prev_open_3']) &
            (df['prev_close_raw'] > df['prev_close_1']) &
            (df['prev_close_1'] > df['prev_close_2']) &
            (df['prev_close_2'] > df['prev_close_3']) &
            (df['prev_high'] > df['prev_high_2']) &
            (df['prev_high_2'] > df['prev_high_3']) &
            (df['dol_gap'] >= df['prev_range'] * 0.3) &
            (df['prev_close_raw'] >= 0.75) &
            (df['prev_volume'] >= 10000000) &
            (df['prev_volume_2'] >= 10000000) &
            (df['prev_volume_3'] >= 10000000)
        )

        if mask.any():
            matches = df[mask].copy()
            matches['Scanner_Label'] = 'D4'
            return matches
        return pd.DataFrame()

    # ==================== DATA FETCHING & FEATURE CALCULATION ====================

    def _fetch_market_universe(self) -> list:
        """Fetch all tickers from Polygon snapshot API."""
        try:
            url = f"{self.base_url}{self.snapshot_endpoint}"
            params = {
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=30)
            if response.status_code != 200:
                return []

            data = response.json()
            tickers = []

            for item in data.get('tickers', []):
                ticker_symbol = item.get('ticker')
                # Simple filter: ticker symbols only (len <= 10, no special chars)
                if ticker_symbol and len(ticker_symbol) <= 10 and ticker_symbol.isalpha():
                    tickers.append(ticker_symbol)

            return list(set(tickers))

        except Exception as e:
            print(f"Error fetching market universe: {e}")
            return []

    def _apply_smart_filters(self, ticker: str) -> bool:
        """Apply smart filters to check if ticker qualifies."""
        try:
            url = f"{self.base_url}{self.snapshot_endpoint}"
            params = {
                "tickers": ticker,
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=10)
            if response.status_code != 200:
                return False

            data = response.json()
            results = data.get('tickers', [])

            if not results:
                return False

            item = results[0]

            # Extract price (try multiple sources)
            price = (item.get("price", {}).get("c") or
                    item.get("lastQuote", {}).get("p") or
                    item.get("prevClose"))

            # Extract volume
            volume = item.get("day", {}).get("v") or 0

            if price is None or volume == 0:
                return False

            # Must meet minimum price and volume
            if price < 0.75 or volume < 10000000:
                return False

            return True

        except Exception:
            return False

    def _fetch_symbol_history(self, ticker: str) -> pd.DataFrame:
        """Fetch historical data for a single symbol."""
        try:
            url = f"{self.base_url}{self.aggs_endpoint}/ticker/{ticker}/range/1/day/{self.scan_start}/{self.scan_end}"
            params = {
                "adjusted": "true",
                "sort": "asc",
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=30)
            if response.status_code != 200:
                return pd.DataFrame()

            data = response.json()
            if 'results' not in data or not data['results']:
                return pd.DataFrame()

            df = pd.DataFrame(data['results'])

            # Map Polygon columns to our names
            df = df.rename(columns={
                't': 'Date',
                'o': 'open',
                'h': 'high',
                'l': 'low',
                'c': 'close',
                'v': 'volume',
                'vw': 'vwap',
                'n': 'transactions'
            })

            # Convert timestamp
            df['Date'] = pd.to_datetime(df['Date'], unit='ms')
            df['Date'] = df['Date'].dt.strftime('%Y-%m-%d')

            return df[['Date', 'open', 'high', 'low', 'close', 'volume', 'vwap', 'transactions']]

        except Exception as e:
            return pd.DataFrame()

    def _calculate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate all required features (matching original source)."""
        if df.empty:
            return df

        # Sort by date
        df = df.sort_values('Date').reset_index(drop=True)

        # Previous close and basic values
        df['prev_close_raw'] = df['close'].shift(1)
        df['prev_open'] = df['open'].shift(1)
        df['prev_open_2'] = df['open'].shift(2)
        df['prev_open_3'] = df['open'].shift(3)

        # Previous highs (10 periods)
        df['prev_high'] = df['high'].shift(1)
        for i in range(1, 11):
            df[f'prev_high_{i}'] = df['high'].shift(i)

        # Previous close values (matching original source logic)
        # prev_close = close.shift(1)
        # prev_close_1 = prev_close.shift(1) = close.shift(2)
        df['prev_close_1'] = df['close'].shift(2)   # 2 days ago
        df['prev_close_2'] = df['close'].shift(3)   # 3 days ago
        df['prev_close_3'] = df['close'].shift(4)   # 4 days ago
        df['prev_close_raw'] = df['close'].shift(1) # Previous day close

        # Previous low
        df['prev_low'] = df['low'].shift(1)

        # Range calculations
        df['prev_range'] = (df['high'].shift(1) - df['low'].shift(1))
        df['prev_range_2'] = df['prev_range'].shift(1)
        df['prev_range_3'] = df['prev_range'].shift(2)

        # Gap calculations
        df['prev_gap'] = (df['open'].shift(1) / df['close'].shift(2) - 1).fillna(0)
        df['prev_gap_2'] = (df['open'].shift(2) / df['close'].shift(3) - 1).fillna(0)

        # Pre-market high (estimated as max of open and high)
        df['pm_high'] = df[['open', 'high']].max(axis=1)

        # PMH gap calculations
        df['dol_pmh_gap'] = df['pm_high'] - df['close'].shift(1)
        df['pct_pmh_gap'] = ((df['pm_high'] / df['close'].shift(1)) - 1).fillna(0)

        # Dollar gap
        df['dol_gap'] = df['open'] - df['close'].shift(1)

        # Opening range and close range
        df['opening_range'] = (df['open'] - df['close'].shift(1)) / df['close'].shift(1)
        df['prev_close_range'] = (df['close'].shift(1) - df['open'].shift(1)) / df['open'].shift(1)

        # Volume
        df['prev_volume'] = df['volume'].shift(1)
        df['prev_volume_2'] = df['volume'].shift(2)
        df['prev_volume_3'] = df['volume'].shift(3)

        # Valid trig high (is this day's high the highest in last 10 days?)
        df['valid_trig_high'] = df['high'] == df['high'].rolling(window=10, min_periods=1).max()

        return df

    # ==================== EXECUTION ENGINE ====================

    def _scan_symbol_with_all_patterns(self, ticker: str) -> pd.DataFrame:
        """
        Scan a single symbol with ALL 10 patterns.
        This matches the original architecture where all patterns are calculated on all data.
        """
        try:
            # Fetch and calculate features
            df = self._fetch_symbol_history(ticker)
            if df.empty:
                return pd.DataFrame()

            df = self._calculate_features(df)
            if df.empty:
                return pd.DataFrame()

            # Convert Date for filtering
            df['Date'] = pd.to_datetime(df['Date'])

            # Run ALL 10 patterns on the data
            all_signals = []

            for scanner in self.scanner_patterns:
                matches = scanner.check_pattern(df)
                if not matches.empty:
                    matches['Ticker'] = ticker
                    all_signals.append(matches)

            # Combine all signals
            if all_signals:
                result = pd.concat(all_signals, ignore_index=True)

                # Filter to D0 date range AFTER pattern detection
                result = result[
                    (result['Date'] >= pd.to_datetime(self.d0_start)) &
                    (result['Date'] <= pd.to_datetime(self.d0_end))
                ]

                return result

            return pd.DataFrame()

        except Exception as e:
            return pd.DataFrame()

    def execute_stage1_market_universe(self) -> list:
        """Stage 1: Fetch and qualify ticker universe."""
        print(f"\n{'='*70}")
        print("🚀 STAGE 1: ULTRA-FAST MARKET UNIVERSE FETCH")
        print(f"{'='*70}")

        # Fetch all tickers
        print("📡 Fetching Polygon market snapshot (optimized)...")
        all_tickers = self._fetch_market_universe()
        print(f"✅ Raw snapshot: {len(all_tickers):,} tickers received")

        if not all_tickers:
            print("❌ No tickers fetched!")
            return []

        # Apply smart filters in parallel
        print(f"\n🔄 Applying ultra-fast smart filters to {len(all_tickers):,} tickers...")
        print(f"⚡ Using {self.stage1_workers} hyper-threads")
        print(f"📊 Filters: price >= $0.75, volume >= 10,000,000")

        qualified_tickers = []

        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            futures = {executor.submit(self._apply_smart_filters, ticker): ticker for ticker in all_tickers}

            for i, future in enumerate(as_completed(futures), 1):
                ticker = futures[future]
                try:
                    if future.result():
                        qualified_tickers.append(ticker)

                    # Progress updates every 100
                    if i % 100 == 0:
                        progress = (i / len(all_tickers)) * 100
                        qualified = len(qualified_tickers)
                        rate = (qualified / i * 100) if i > 0 else 0
                        print(f"⚡ Progress: {i}/{len(all_tickers)} ({progress:.1f}%) | Qualified: {qualified} ({rate:.1f}%)")

                except Exception:
                    pass

        print(f"\n🚀 Stage 1 Complete:")
        print(f"📊 Processed: {len(all_tickers):,} tickers")
        print(f"✅ Qualified: {len(qualified_tickers):,} tickers")
        print(f"📈 Qualification Rate: {(len(qualified_tickers)/len(all_tickers)*100):.2f}%")

        return qualified_tickers

    def execute_stage2_pattern_detection(self, symbols: list) -> pd.DataFrame:
        """Stage 2: Run all 10 scanner patterns on qualified symbols."""
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: ULTRA-FAST MULTI-SCANNER PATTERN DETECTION")
        print(f"{'='*70}")
        print(f"⚡ Optimized Universe: {len(symbols):,} symbols")
        print(f"🔥 Using {self.stage2_workers} hyper-threads")
        print(f"📊 Running {len(self.scanner_patterns)} scanner patterns per symbol")

        all_signals = []

        # Process symbols in parallel
        with ThreadPoolExecutor(max_workers=self.stage2_workers) as executor:
            futures = {executor.submit(self._scan_symbol_with_all_patterns, symbol): symbol for symbol in symbols}

            for i, future in enumerate(as_completed(futures), 1):
                try:
                    signals = future.result()
                    if not signals.empty:
                        all_signals.append(signals)

                    if i % 50 == 0:
                        progress = (i / len(symbols)) * 100
                        total_signals = sum(len(s) for s in all_signals)
                        print(f"⚡ Progress: {i}/{len(symbols)} ({progress:.1f}%) | Signals: {total_signals}")

                except Exception as e:
                    pass

        # Combine all results
        if all_signals:
            result = pd.concat(all_signals, ignore_index=True)

            # Sort by date
            result = result.sort_values(['Date', 'Ticker']).reset_index(drop=True)

            # Select output columns
            output = result[['Ticker', 'Date', 'Scanner_Label']].copy()

            print(f"\n🚀 Stage 2 Complete ({len(result)} signals found)")
            return output

        print(f"\n❌ Stage 2 Complete: No signals detected")
        return pd.DataFrame()

    def run(self) -> pd.DataFrame:
        """Execute the complete 3-stage scanner."""
        print(f"\n{'='*70}")
        print("🚀 Starting ULTRA-FAST SC DMR MULTI-SCANNER")
        print(f"{'='*70}")
        print(f"⚡ {len(self.scanner_patterns)} scanner patterns in single execution")
        print(f"📡 Edge.dev Standard: Snapshot + Individual Symbol History")

        # Stage 1: Market Universe
        qualified_symbols = self.execute_stage1_market_universe()
        if not qualified_symbols:
            print("❌ No qualified symbols!")
            return pd.DataFrame()

        # Stage 2: Pattern Detection
        signals = self.execute_stage2_pattern_detection(qualified_symbols)

        if signals.empty:
            print("\n❌ Scan Complete: No signals detected")
            return pd.DataFrame()

        # Stage 3: Results
        print(f"\n{'='*70}")
        print(f"🎯 FINAL RESULTS")
        print(f"{'='*70}")
        print(f"📊 Total Signals: {len(signals)}")
        print(f"📅 Date Range: {signals['Date'].min()} to {signals['Date'].max()}")
        print(f"🏢 Unique Tickers: {signals['Ticker'].nunique()}")

        # Scanner distribution
        print(f"\n📈 Signal Distribution by Scanner:")
        for scanner, count in signals['Scanner_Label'].value_counts().items():
            print(f"  {scanner}: {count} signals")

        print(f"\n{'='*70}")

        return signals


# ==================== MAIN EXECUTION ====================
if __name__ == "__main__":
    scanner = UltraFastRenataSCDMRScannerV2()
    results = scanner.run()

    if not results.empty:
        # Save results
        output_file = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/sc_dmr_results_v2.csv"
        results.to_csv(output_file, index=False)
        print(f"✅ Results saved to: {output_file}")

        # Display sample results
        print(f"\n📊 Sample Results (first 20):")
        print(results.head(20).to_string(index=False))
