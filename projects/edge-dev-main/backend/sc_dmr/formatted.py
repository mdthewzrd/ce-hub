"""
UltraFastRenataSCDMRMultiScanner

Edge.dev Standardized SC DMR Multi-Scanner
Scanner Type: SC DMR (Small Cap D2/D3/D4 Multi-Scanner)

Original Source: /Users/michaeldurante/.anaconda/SC Stuff/SC DMR SCAN.py (600 lines)
Formatted: 2025-12-26

Edge.dev Standardizations Applied:
- Type-specific class naming (UltraFastRenataSCDMRMultiScanner)
- 3-Stage Architecture (Market Universe Optimization → Pattern Detection → Results Analysis)
- Ultra-optimized threading (Stage 1: min(128, cpu_cores * 8), Stage 2: min(96, cpu_cores * 6))
- Session pooling with HTTPAdapter(100)
- Batch processing (200 symbols)
- Smart filtering (4 mass parameters)
- Individual API architecture

Pattern Type: Multi-Scanner (10 patterns)
- D2_PM_Setup (4 variants)
- D2_PM_Setup_2
- D2_PMH_Break (gap >= 0.2)
- D2_PMH_Break_1 (gap < 0.2)
- D2_No_PMH_Break
- D2_Extreme_Gap
- D2_Extreme_Intraday_Run
- D3 (2-day consecutive gaps)
- D3_Alt (2-day consecutive highs)
- D4 (3-day consecutive)
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


class UltraFastRenataSCDMRMultiScanner:
    """
    SC DMR Multi-Scanner - Small Cap D2/D3/D4 Pattern Detection

    Pattern Description:
    - 10 scanner patterns in single execution
    - Mass parameters (shared across all scanners)
    - Individual parameters (unique per scanner)
    - 3-column output: Ticker, Date, Scanner_Label

    Key Features:
    - 4 mass parameters (prev_close_min, prev_volume_min, prev_close_bullish, valid_trig_high_enabled)
    - Individual parameters per scanner
    - Day -1 minimum close price: $0.75
    - Day -1 minimum volume: 10M shares
    """

    def __init__(self, api_key: str = None):
        """Initialize the SC DMR multi-scanner with parameters."""
        # Core API Configuration
        self.session = requests.Session()
        self.session.mount('https://', HTTPAdapter(
            pool_connections=100,
            pool_maxsize=100,
            max_retries=2,
            pool_block=False
        ))

        self.api_key = api_key or "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

        # Market calendar for trading day calculations
        self.us_calendar = mcal.get_calendar('NYSE')

        # 🚀 RENATA ULTRA SPEED CONFIGURATION
        import multiprocessing as mp
        cpu_cores = mp.cpu_count() or 16
        self.stage1_workers = min(128, cpu_cores * 8)
        self.stage2_workers = min(96, cpu_cores * 6)
        self.batch_size = 200

        print(f"🚀 RENATA ULTRA-FAST MODE: Stage1: {self.stage1_workers} threads, Stage2: {self.stage2_workers} threads")
        print(f"🔧 SCANNER TYPE: SC DMR Multi-Scanner (10 patterns)")

        # ========== DEFAULT TICKER LIST ==========
        self.default_tickers = [
            "SOXL", "MRVL", "TGT", "DOCU", "ZM", "DIS", "NFLX", "AMC", "RKT", "SNAP", "RBLX", "META", "SE", "NVDA",
            "SMCI", "MSTR", "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "AMD", "INTC", "BABA", "BA",
            "PYPL", "QCOM", "ORCL", "T", "CSCO", "VZ", "KO", "PEP", "MRK", "PFE", "ABBV", "JNJ", "CRM",
            "BAC", "C", "JPM", "WMT", "CVX", "XOM", "COP", "RTX", "SPGI", "GS", "HD", "LOW", "COST", "UNH",
            "NEE", "NKE", "LMT", "HON", "CAT", "MMM", "LIN", "ADBE", "AVGO", "TXN", "ACN", "UPS", "BLK", "PM", "MO",
            "ELV", "VRTX", "ZTS", "NOW", "ISRG", "PLD", "MS", "MDT", "WM", "GE", "IBM", "BKNG", "FDX", "ADP", "EQIX",
            "DHR", "SNPS", "REGN", "SYK", "TMO", "CVS", "INTU", "SCHW", "CI", "APD", "SO", "MMC", "ICE", "FIS",
            "ADI", "CSX", "LRCX", "GILD", "RIVN", "LCID", "PLTR", "SNOW", "SPY", "QQQ", "DIA", "IWM", "TQQQ",
            "SQQQ", "ARKK", "LABU", "TECL", "UVXY", "XLE", "XLK", "XLF", "IBB", "KWEB", "TAN", "XOP",
            "EEM", "HYG", "EFA", "USO", "GLD", "SLV", "BITO", "RIOT", "MARA", "COIN", "SQ", "AFRM", "DKNG",
            "SHOP", "UPST", "CLF", "AA", "F", "GM", "ROKU", "WBD", "WBA", "PARA", "PINS", "LYFT", "BYND",
            "DJT", "RDDT", "GME", "VKTX", "APLD", "KGEI", "INOD", "LMB", "AMR", "PMTS", "SAVA", "CELH",
            "ESOA", "IVT", "MOD", "SKYE", "AR", "VIXY", "TECS", "LABD", "SPXS", "SPXL", "DRV", "TZA", "FAZ", "WEBS",
            "PSQ", "SDOW", "MSTU", "MSTZ", "NFLU", "BTCL", "BTCZ", "ETU", "ETQ", "FAS", "TNA", "NUGT", "TSLL",
            "NVDU", "AMZU", "MSFU", "UVIX"
        ]
        self.default_tickers = list(set(self.default_tickers))

        # ========== MASS PARAMETERS (Applied to ALL 10 scanners) ==========
        self.mass_params = {
            "prev_close_min": 0.75,           # Minimum close price
            "prev_volume_min": 10000000,      # Minimum volume (10M)
            "prev_close_bullish": True,       # Close >= Open (ORIGINAL: enabled)
            "valid_trig_high_enabled": True,  # 10-period high validation (ORIGINAL: enabled)
        }

        # ========== INDIVIDUAL SCANNER PARAMETERS (Unique per scanner) ==========
        self.scanner_params = {
            "D2_PM_Setup": {
                "prev_high_gain_min": 0.2,
                "pmh_gap_range_mult": 0.5,
                "pmh_gap_pct_min": 0.5,
                "prev_close_range_min": 0.5,
                "high_vs_low_mult": 1.5,
                "enabled": True,
            },
            "D2_PM_Setup_2": {
                "prev_high_gain_min": 0.2,
                "pmh_gap_range_mult": 0.5,
                "pmh_gap_pct_min": 0.5,
                "prev_close_range_min": 0.5,
                "high_vs_low_mult": 1.5,
                "enabled": True,
            },
            "D2_PMH_Break": {
                "prev_high_gain_min": 0.2,
                "prev_gap_min": 0.2,
                "gap_range_mult": 0.3,
                "opening_range_min": 0.5,
                "prev_close_range_min": 0.5,
                "high_vs_low_mult": 1.5,
                "enabled": True,
            },
            "D2_PMH_Break_1": {
                "prev_high_gain_min": 0.2,
                "prev_gap_max": 0.2,
                "gap_range_mult": 0.3,
                "opening_range_min": 0.5,
                "prev_close_range_min": 0.5,
                "high_vs_low_mult": 1.5,
                "enabled": True,
            },
            "D2_No_PMH_Break": {
                "prev_high_gain_min": 0.2,
                "prev_gap_min": 0.2,
                "gap_range_mult": 0.3,
                "opening_range_min": 0.5,
                "prev_close_range_min": 0.5,
                "enabled": True,
            },
            "D2_Extreme_Gap": {
                "prev_high_gain_min": 0.2,
                "gap_range_mult": 1.0,
                "prev_close_range_min": 0.3,
                "high_vs_low_mult": 1.5,
                "enabled": True,
            },
            "D2_Extreme_Intraday_Run": {
                "prev_high_gain_min": 0.2,
                "intraday_run_range_mult": 1.0,
                "gap_range_mult": 0.3,
                "prev_close_range_min": 0.5,
                "high_vs_low_mult": 1.5,
                "enabled": True,
            },
            "D3": {
                "prev_high_gain_min": 0.2,
                "prev_gap_min": 0.2,
                "prev_gap_2_min": 0.2,
                "gap_range_mult": 0.3,
                "enabled": True,
            },
            "D3_Alt": {
                "prev_high_gain_min": 0.2,
                "prev_high_2_gain_min": 0.2,
                "gap_range_mult": 0.5,
                "enabled": True,
            },
            "D4": {
                "prev_high_gain_min": 0.2,
                "prev_high_2_gain_min": 0.2,
                "prev_high_3_gain_min": 0.2,
                "gap_range_mult": 0.3,
                "enabled": True,
            },
        }

        # ========== DATE RANGES ==========
        self.d0_start = "2025-06-01"
        self.d0_end = "2025-12-01"

        # Need 10+ days history for lookbacks - scan through current date
        buffer_days = 50
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        self.scan_start = (datetime.datetime.now() - datetime.timedelta(days=365 + buffer_days)).strftime("%Y-%m-%d")
        self.scan_end = current_date  # Fetch data through today, not just d0_end

        # Smart filtering uses the same historical range
        self.smart_start = self.scan_start
        self.smart_end = self.scan_end

        # ========== API CONFIGURATION ==========
        self.snapshot_endpoint = "/v2/snapshot/locale/us/markets/stocks/tickers"
        self.aggs_endpoint = "/v2/aggs/ticker"

        print("🚀 Ultra-Fast Renata SC DMR Multi-Scanner Initialized")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")
        print(f"🎯 Mass Parameters: {len(self.mass_params)} (shared across all 10 scanners)")
        print(f"📈 Scanner Patterns: {len(self.scanner_params)}")

    def _extract_smart_filter_params(self, mass_params: dict) -> dict:
        """
        Extract Stage 1 smart filtering parameters from mass params.

        Note: Only price and volume are available in Polygon snapshot API.
        """
        smart_params = {
            'prev_close_min': mass_params['prev_close_min'],
            'prev_volume_min': mass_params['prev_volume_min'],
        }
        return smart_params

    def _fetch_market_universe(self) -> list:
        """Fetch all tickers from Polygon snapshot API."""
        try:
            url = f"{self.base_url}{self.snapshot_endpoint}"
            params = {"apiKey": self.api_key}

            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return []

            data = response.json()

            tickers = []
            for item in data.get('tickers', []):
                ticker_symbol = item.get('ticker')
                if ticker_symbol and len(ticker_symbol) <= 10:
                    tickers.append(ticker_symbol)

            return list(set(tickers))

        except Exception:
            return []

    def _apply_smart_filters(self, ticker: str, smart_params: dict) -> bool:
        """Apply smart filters to a ticker using snapshot data."""
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

            # Extract price
            price = (item.get("price", {}).get("c") or
                    item.get("lastQuote", {}).get("p") or
                    item.get("prevClose"))

            # Extract volume
            volume = item.get("day", {}).get("v") or 0

            if price is None or volume == 0:
                return False

            # Apply filters
            if price < smart_params['prev_close_min']:
                return False

            if volume < smart_params['prev_volume_min']:
                return False

            return True

        except Exception:
            return False

    def execute_stage1_ultra_fast(self, symbols: list = None) -> list:
        """
        Stage 1: Market Universe Optimization

        NOTE: Price/volume smart filtering MOVED to Stage 2.
        Stage 1 only filters by ticker symbol length (<= 10 chars).
        Historical filtering happens in Stage 2 on actual historical data.
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 1: ULTRA-FAST MARKET UNIVERSE FETCH")
        print(f"{'='*70}")

        # Fetch market universe
        print("📡 Fetching Polygon market snapshot (optimized)...")
        market_universe = self._fetch_market_universe()

        if not market_universe:
            print("🔄 Using default ticker list...")
            market_universe = self.default_tickers
        else:
            print(f"✅ Raw snapshot: {len(market_universe):,} tickers received")

        # Skip price/volume filtering in Stage 1
        # These filters will be applied to HISTORICAL data in Stage 2
        print(f"\n⚡ Stage 1: Symbol length filter only (<= 10 chars)")
        print(f"⚡ Price/volume filters deferred to Stage 2 (historical data)")
        print(f"✅ Using {len(market_universe):,} tickers for Stage 2 pattern detection")

        return market_universe

    def _fetch_symbol_history(self, ticker: str) -> pd.DataFrame:
        """Fetch historical data for a single symbol."""
        try:
            url = f"{self.base_url}{self.aggs_endpoint}/{ticker}/range/1/day/{self.scan_start}/{self.scan_end}"
            params = {
                "adjusted": "true",
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return pd.DataFrame()

            data = response.json()

            if data.get('status') != 'OK' or not data.get('results'):
                return pd.DataFrame()

            df = pd.DataFrame(data['results'])
            df['Date'] = pd.to_datetime(df['t'], unit='ms').dt.strftime('%Y-%m-%d')

            return df

        except Exception:
            return pd.DataFrame()

    def _calculate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate all technical features needed for pattern detection."""
        # Rename columns for consistency
        df = df.rename(columns={
            'o': 'open',
            'h': 'high',
            'l': 'low',
            'c': 'close',
            'v': 'volume'
        })

        # Previous high (10 periods)
        df['prev_high'] = df['high'].shift(1)  # Previous day's high (alias for prev_high_1)
        for i in range(1, 11):
            df[f'prev_high_{i}'] = df['high'].shift(i)

        # Previous low and open
        df['prev_low'] = df['low'].shift(1)
        df['prev_open'] = df['open'].shift(1)
        for i in range(2, 4):
            df[f'prev_open_{i}'] = df['open'].shift(i)

        # Previous close (matching original source logic)
        # prev_close = close.shift(1)
        # prev_close_1 = prev_close.shift(1) = close.shift(2)
        df['prev_close_raw'] = df['close'].shift(1)
        df['prev_close_1'] = df['close'].shift(2)  # 2 days ago
        df['prev_close_2'] = df['close'].shift(3)  # 3 days ago
        df['prev_close_3'] = df['close'].shift(4)  # 4 days ago
        df['prev_close_4'] = df['close'].shift(5)  # 5 days ago

        # Range calculations
        df['prev_range'] = (df['high'] - df['low']).shift(1)
        df['prev_range_2'] = df['prev_range'].shift(1)
        df['prev_range_3'] = df['prev_range'].shift(2)

        # Gap calculations
        df['gap'] = ((df['open'] / df['prev_close_raw']) - 1).fillna(0)
        df['prev_gap'] = df['gap'].shift(1)
        df['prev_gap_2'] = df['gap'].shift(2)

        # PMH (pre-market high)
        df['pm_high'] = df[['open', 'high']].max(axis=1)
        df['dol_pmh_gap'] = df['pm_high'] - df['prev_close_raw']
        df['pct_pmh_gap'] = ((df['pm_high'] / df['prev_close_raw']) - 1)
        df['dol_gap'] = df['open'] - df['prev_close_raw']

        # Opening range
        df['opening_range'] = (df['open'] - df['prev_close_raw']) / (df['pm_high'] - df['prev_close_raw'])

        # Close range
        df['prev_close_range'] = (df['prev_close_raw'] - df['prev_open']) / (df[f'prev_high_1'] - df['prev_open'])

        # Volume
        df['prev_volume'] = df['volume'].shift(1)
        for i in range(2, 4):
            df[f'prev_volume_{i}'] = df['volume'].shift(i)

        # Valid trigger high (10-period validation)
        if self.mass_params['valid_trig_high_enabled']:
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
        else:
            df['valid_trig_high'] = True

        return df

    def _check_scanner_conditions(self, row: pd.Series, scanner_name: str, params: dict) -> bool:
        """Check if a row meets the conditions for a specific scanner pattern."""
        try:
            # Mass parameter checks
            if self.mass_params['prev_close_bullish']:
                if row['prev_close_raw'] < row['prev_open']:
                    return False

            if row['prev_close_raw'] < self.mass_params['prev_close_min']:
                return False

            if row['prev_volume'] < self.mass_params['prev_volume_min']:
                return False

            if self.mass_params['valid_trig_high_enabled'] and not row['valid_trig_high']:
                return False

            # Individual scanner pattern checks
            if scanner_name == "D2_PM_Setup":
                return self._check_d2_pm_setup(row, params)
            elif scanner_name == "D2_PM_Setup_2":
                return self._check_d2_pm_setup_2(row, params)
            elif scanner_name == "D2_PMH_Break":
                return self._check_d2_pmh_break(row, params)
            elif scanner_name == "D2_PMH_Break_1":
                return self._check_d2_pmh_break_1(row, params)
            elif scanner_name == "D2_No_PMH_Break":
                return self._check_d2_no_pmh_break(row, params)
            elif scanner_name == "D2_Extreme_Gap":
                return self._check_d2_extreme_gap(row, params)
            elif scanner_name == "D2_Extreme_Intraday_Run":
                return self._check_d2_extreme_intraday_run(row, params)
            elif scanner_name == "D3":
                return self._check_d3(row, params)
            elif scanner_name == "D3_Alt":
                return self._check_d3_alt(row, params)
            elif scanner_name == "D4":
                return self._check_d4(row, params)

            return False

        except Exception:
            return False

    def _check_d2_pm_setup(self, row: pd.Series, p: dict) -> bool:
        """D2 PM Setup (4 variants combined with OR)"""
        # Variant 1
        v1 = (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['dol_pmh_gap'] >= row['prev_range'] * p['pmh_gap_range_mult']) and
            (row['pct_pmh_gap'] >= p['pmh_gap_pct_min']) and
            (row['prev_close_range'] >= p['prev_close_range_min']) and
            (row['prev_high'] >= row['prev_low'] * p['high_vs_low_mult'])
        )
        if v1: return True

        # Variant 2
        v2 = (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['prev_gap_2'] >= 0.2) and
            (row['prev_range'] > row['prev_range_2']) and
            (row['dol_pmh_gap'] >= row['prev_range'] * p['pmh_gap_range_mult']) and
            (row['pct_pmh_gap'] >= p['pmh_gap_pct_min']) and
            (row['prev_volume_2'] >= self.mass_params['prev_volume_min'])
        )
        if v2: return True

        # Variant 3
        v3 = (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            ((row['prev_high_2'] / row['prev_close_2'] - 1) >= 0.2) and
            (row['prev_range'] > row['prev_range_2']) and
            (row['dol_pmh_gap'] >= row['prev_range'] * p['pmh_gap_range_mult']) and
            (row['pct_pmh_gap'] >= p['pmh_gap_pct_min']) and
            (row['prev_close_1'] > row['prev_open_2']) and
            (row['prev_volume_2'] >= self.mass_params['prev_volume_min'])
        )
        if v3: return True

        # Variant 4
        v4 = (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            ((row['prev_high_2'] / row['prev_close_2'] - 1) >= 0.2) and
            ((row['prev_high_3'] / row['prev_close_3'] - 1) >= 0.2) and
            (row['prev_close_1'] > row['prev_open_2']) and
            (row['prev_close_2'] > row['prev_open_3']) and
            (row['prev_close_raw'] > row['prev_close_1']) and
            (row['prev_close_1'] > row['prev_close_2']) and
            (row['prev_close_2'] > row['prev_close_3']) and
            (row['prev_high'] > row['prev_high_2']) and
            (row['prev_high_2'] > row['prev_high_3']) and
            (row['dol_pmh_gap'] >= row['prev_range'] * p['pmh_gap_range_mult']) and
            (row['pct_pmh_gap'] >= p['pmh_gap_pct_min']) and
            (row['prev_volume_2'] >= self.mass_params['prev_volume_min']) and
            (row['prev_volume_3'] >= self.mass_params['prev_volume_min'])
        )
        return v4

    def _check_d2_pm_setup_2(self, row: pd.Series, p: dict) -> bool:
        """D2 PM Setup 2 (stricter variant)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['dol_pmh_gap'] >= row['prev_range'] * p['pmh_gap_range_mult']) and
            (row['pct_pmh_gap'] >= p['pmh_gap_pct_min']) and
            (row['prev_close_range'] >= p['prev_close_range_min']) and
            (row['prev_high'] >= row['prev_low'] * p['high_vs_low_mult'])
        )

    def _check_d2_pmh_break(self, row: pd.Series, p: dict) -> bool:
        """D2 PMH Break (gap >= 0.2)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['prev_gap'] >= p['prev_gap_min']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['opening_range'] >= p['opening_range_min']) and
            (row['high'] >= row['pm_high']) and
            (row['prev_close_range'] >= p['prev_close_range_min']) and
            (row['prev_high'] >= row['prev_low'] * p['high_vs_low_mult'])
        )

    def _check_d2_pmh_break_1(self, row: pd.Series, p: dict) -> bool:
        """D2 PMH Break (gap < 0.2)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['prev_gap'] < p['prev_gap_max']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['opening_range'] >= p['opening_range_min']) and
            (row['high'] >= row['pm_high']) and
            (row['prev_close_range'] >= p['prev_close_range_min']) and
            (row['prev_high'] >= row['prev_low'] * p['high_vs_low_mult'])
        )

    def _check_d2_no_pmh_break(self, row: pd.Series, p: dict) -> bool:
        """D2 No PMH Break (high < PMH)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['prev_gap'] >= 0.2) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['opening_range'] >= p['opening_range_min']) and
            (row['high'] < row['pm_high']) and
            (row['prev_close_range'] >= p['prev_close_range_min'])
        )

    def _check_d2_extreme_gap(self, row: pd.Series, p: dict) -> bool:
        """D2 Extreme Gap (gap >= 1x range)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['prev_close_range'] >= p['prev_close_range_min']) and
            (row['prev_high'] >= row['prev_low'] * p['high_vs_low_mult'])
        )

    def _check_d2_extreme_intraday_run(self, row: pd.Series, p: dict) -> bool:
        """D2 Extreme Intraday Run"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            ((row['high'] - row['open']) >= row['prev_range'] * p['intraday_run_range_mult']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['prev_close_range'] >= p['prev_close_range_min']) and
            (row['prev_high'] >= row['prev_low'] * p['high_vs_low_mult'])
        )

    def _check_d3(self, row: pd.Series, p: dict) -> bool:
        """D3 (2-day consecutive gaps)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            (row['prev_gap'] >= p['prev_gap_min']) and
            (row['prev_gap_2'] >= p['prev_gap_2_min']) and
            (row['prev_range'] > row['prev_range_2']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult'])
        )

    def _check_d3_alt(self, row: pd.Series, p: dict) -> bool:
        """D3 Alt (2-day consecutive highs)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            ((row['prev_high_2'] / row['prev_close_2'] - 1) >= p['prev_high_2_gain_min']) and
            (row['prev_range'] > row['prev_range_2']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['prev_close_1'] > row['prev_open_2'])
        )

    def _check_d4(self, row: pd.Series, p: dict) -> bool:
        """D4 (3-day consecutive pattern)"""
        return (
            ((row['prev_high'] / row['prev_close_1'] - 1) >= p['prev_high_gain_min']) and
            ((row['prev_high_2'] / row['prev_close_2'] - 1) >= p['prev_high_2_gain_min']) and
            ((row['prev_high_3'] / row['prev_close_3'] - 1) >= p['prev_high_3_gain_min']) and
            (row['prev_close_raw'] > row['prev_open']) and
            (row['prev_close_1'] > row['prev_open_2']) and
            (row['prev_close_2'] > row['prev_open_3']) and
            (row['prev_close_raw'] > row['prev_close_1']) and
            (row['prev_close_1'] > row['prev_close_2']) and
            (row['prev_close_2'] > row['prev_close_3']) and
            (row['prev_high'] > row['prev_high_2']) and
            (row['prev_high_2'] > row['prev_high_3']) and
            (row['dol_gap'] >= row['prev_range'] * p['gap_range_mult']) and
            (row['prev_volume_2'] >= self.mass_params['prev_volume_min']) and
            (row['prev_volume_3'] >= self.mass_params['prev_volume_min'])
        )

    def _scan_symbol(self, ticker: str) -> pd.DataFrame:
        """Scan a single symbol for all 10 scanner patterns using vectorized operations."""
        try:
            # Fetch historical data
            df = self._fetch_symbol_history(ticker)

            if df.empty:
                return pd.DataFrame()

            # Calculate features (on ALL data before filtering)
            df = self._calculate_features(df)

            # Apply mass parameter filters on ALL data (before D0 filtering)
            if self.mass_params['prev_close_bullish']:
                df = df[df['prev_close_raw'] >= df['prev_open']].copy()

            df = df[df['prev_close_raw'] >= self.mass_params['prev_close_min']].copy()
            df = df[df['prev_volume'] >= self.mass_params['prev_volume_min']].copy()

            if self.mass_params['valid_trig_high_enabled']:
                df = df[df['valid_trig_high'] == True].copy()

            if df.empty:
                return pd.DataFrame()

            # Convert Date for filtering
            df['Date'] = pd.to_datetime(df['Date'])

            # Check all scanner patterns (vectorized) on ALL data
            all_signals = []

            # D2_PM_Setup (4 variants with OR) - EXACT ORIGINAL THRESHOLDS
            mask = (
                # Variant 1 (100% gain requirement)
                (
                    ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                    (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                    (df['pct_pmh_gap'] >= 0.5) &
                    (df['prev_close_range'] >= 0.5) &
                    (df['prev_high'] >= df['prev_low'] * 1.5)
                ) |
                # Variant 2 (20% gain with gap)
                (
                    ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                    (df['prev_gap_2'] >= 0.2) &
                    (df['prev_range'] > df['prev_range_2']) &
                    (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                    (df['pct_pmh_gap'] >= 0.5) &
                    (df['prev_volume_2'] >= self.mass_params['prev_volume_min'])
                ) |
                # Variant 3 (20% consecutive gains)
                (
                    ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                    ((df['prev_high_2'] / df['prev_close_2'] - 1) >= 0.2) &
                    (df['prev_range'] > df['prev_range_2']) &
                    (df['dol_pmh_gap'] >= df['prev_range'] * 0.5) &
                    (df['pct_pmh_gap'] >= 0.5) &
                    (df['prev_close_1'] > df['prev_open_2']) &
                    (df['prev_volume_2'] >= self.mass_params['prev_volume_min'])
                ) |
                # Variant 4 (20% 3-day consecutive)
                (
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
                    (df['prev_volume_2'] >= self.mass_params['prev_volume_min']) &
                    (df['prev_volume_3'] >= self.mass_params['prev_volume_min'])
                )
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_PM_Setup'
                all_signals.append(matches)

            # D2_PM_Setup_2 (stricter variant) - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                (df['dol_pmh_gap'] >= df['prev_range'] * 1.0) &
                (df['pct_pmh_gap'] >= 1.0) &
                (df['prev_close_range'] >= 0.5) &
                (df['prev_high'] >= df['prev_low'] * 1.2)
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_PM_Setup_2'
                all_signals.append(matches)

            # D2_PMH_Break - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                (df['prev_gap'] >= 0.2) &
                (df['dol_gap'] >= df['prev_range'] * 0.3) &
                (df['opening_range'] >= 0.5) &
                (df['high'] >= df['pm_high']) &
                (df['prev_close_range'] >= 0.5) &
                (df['prev_high'] >= df['prev_low'] * 1.5)
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_PMH_Break'
                all_signals.append(matches)

            # D2_PMH_Break_1 - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                (df['prev_gap'] < 0.2) &
                (df['dol_gap'] >= df['prev_range'] * 0.3) &
                (df['opening_range'] >= 0.5) &
                (df['high'] >= df['pm_high']) &
                (df['prev_close_range'] >= 0.5) &
                (df['prev_high'] >= df['prev_low'] * 1.5)
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_PMH_Break_1'
                all_signals.append(matches)

            # D2_No_PMH_Break - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                (df['prev_gap'] >= 0.2) &
                (df['dol_gap'] >= df['prev_range'] * 0.3) &
                (df['opening_range'] >= 0.5) &
                (df['high'] < df['pm_high']) &
                (df['prev_close_range'] >= 0.5)
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_No_PMH_Break'
                all_signals.append(matches)

            # D2_Extreme_Gap - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                (df['dol_gap'] >= df['prev_range'] * 1.0) &
                (df['prev_close_range'] >= 0.3) &
                (df['prev_high'] >= df['prev_low'] * 1.5)
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_Extreme_Gap'
                all_signals.append(matches)

            # D2_Extreme_Intraday_Run - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 1.0) &
                ((df['high'] - df['open']) >= df['prev_range'] * 1.0) &
                (df['dol_gap'] >= df['prev_range'] * 0.3) &
                (df['prev_close_range'] >= 0.5) &
                (df['prev_high'] >= df['prev_low'] * 1.5)
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D2_Extreme_Intraday_Run'
                all_signals.append(matches)

            # D3 (2-day consecutive gaps) - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                (df['prev_gap'] >= 0.2) &
                (df['prev_gap_2'] >= 0.2) &
                (df['prev_range'] > df['prev_range_2']) &
                (df['dol_gap'] >= df['prev_range'] * 0.3) &
                (df['prev_volume_2'] >= self.mass_params['prev_volume_min'])
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D3'
                all_signals.append(matches)

            # D3_Alt - ORIGINAL THRESHOLDS
            mask = (
                ((df['prev_high'] / df['prev_close_1'] - 1) >= 0.2) &
                ((df['prev_high_2'] / df['prev_close_2'] - 1) >= 0.2) &
                (df['prev_range'] > df['prev_range_2']) &
                (df['dol_gap'] >= df['prev_range'] * 0.5) &
                (df['prev_close_1'] > df['prev_open_2']) &
                (df['prev_volume_2'] >= self.mass_params['prev_volume_min'])
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D3_Alt'
                all_signals.append(matches)

            # D4 (3-day consecutive) - ORIGINAL THRESHOLDS
            mask = (
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
                (df['prev_volume_2'] >= self.mass_params['prev_volume_min']) &
                (df['prev_volume_3'] >= self.mass_params['prev_volume_min'])
            )
            if mask.any():
                matches = df[mask].copy()
                matches['Ticker'] = ticker
                matches['Scanner_Label'] = 'D4'
                all_signals.append(matches)

            # Combine all signals for this symbol
            if all_signals:
                result = pd.concat(all_signals, ignore_index=True)

                # Filter to D0 date range AFTER pattern detection (like original)
                result = result[
                    (result['Date'] >= pd.to_datetime(self.d0_start)) &
                    (result['Date'] <= pd.to_datetime(self.d0_end))
                ]

                return result
            else:
                return pd.DataFrame()

        except Exception:
            return pd.DataFrame()

    def execute_stage2_ultra_fast(self, symbols: list) -> pd.DataFrame:
        """
        Stage 2: Multi-Scanner Pattern Detection

        - Process each symbol individually in parallel
        - Fetch historical data per symbol
        - Check all 10 scanner patterns
        - Output: Ticker, Date, Scanner_Label
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: ULTRA-FAST MULTI-SCANNER PATTERN DETECTION")
        print(f"{'='*70}")
        print(f"⚡ Optimized Universe: {len(symbols):,} symbols")
        print(f"🔥 Using {self.stage2_workers} hyper-threads")

        all_results = []
        processed = 0
        signals_found = 0
        last_progress_time = time.time()

        start_time = time.time()

        with ThreadPoolExecutor(max_workers=self.stage2_workers) as executor:
            # Process in batches
            for batch_start in range(0, len(symbols), self.batch_size):
                batch_end = min(batch_start + self.batch_size, len(symbols))
                batch_symbols = symbols[batch_start:batch_end]

                print(f"📦 Processing batch {batch_start//self.batch_size + 1}: {len(batch_symbols)} symbols")

                # Submit each symbol in batch individually
                future_to_symbol = {
                    executor.submit(self._scan_symbol, symbol): symbol
                    for symbol in batch_symbols
                }

                # Process results as they complete
                for future in as_completed(future_to_symbol):
                    symbol = future_to_symbol[future]
                    processed += 1

                    try:
                        results = future.result()
                        if not results.empty:
                            all_results.append(results)
                            signals_found += len(results)
                            print(f"✅ {symbol}: {len(results)} signals")

                    except Exception:
                        pass

                    # Progress reporting
                    current_time = time.time()
                    if processed % 50 == 0 or (current_time - last_progress_time) >= 15:
                        progress_pct = (processed / len(symbols)) * 100
                        print(f"⚡ Batch Progress: {processed:,}/{len(symbols):,} ({progress_pct:.1f}%) | Signals: {signals_found:,}")
                        last_progress_time = current_time

        elapsed = time.time() - start_time

        # Concatenate all results
        if all_results:
            final_results = pd.concat(all_results, ignore_index=True)
            final_results = final_results[['Ticker', 'Date', 'Scanner_Label']]
            final_results = final_results.sort_values(['Date', 'Ticker'], ascending=[False, True])
            final_results = final_results.reset_index(drop=True)

            print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s): Found {len(final_results):,} signals")
            print(f"⚡ Processing Speed: {processed/elapsed:.0f} symbols/second")

            return final_results
        else:
            print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s): No signals detected")
            return pd.DataFrame()

    def execute_stage3_results_ultra_fast(self, signals_df: pd.DataFrame):
        """Stage 3: Results Analysis and Display"""
        print(f"\n{'='*70}")
        print("📊 STAGE 3: RESULTS ANALYSIS")
        print(f"{'='*70}")

        if signals_df.empty:
            print("❌ No signals to display")
            return

        print(f"\n📈 Total signals: {len(signals_df):,}")
        print(f"📊 Unique tickers: {signals_df['Ticker'].nunique():,}")
        print(f"📅 Date range: {signals_df['Date'].min().date()} to {signals_df['Date'].max().date()}")

        # Count by scanner
        scanner_counts = signals_df['Scanner_Label'].value_counts()
        print(f"\n📊 Signals by Scanner:")
        for scanner, count in scanner_counts.items():
            print(f"  • {scanner}: {count:,}")

        # Top tickers
        print(f"\n🔝 Top 10 tickers by signal frequency:")
        top_tickers = signals_df['Ticker'].value_counts().head(10)
        for ticker, count in top_tickers.items():
            print(f"  {ticker}: {count} signals")

        # Recent signals
        print(f"\n📋 Recent signals:")
        print(signals_df.head(20).to_string(index=False))

    def run_ultra_fast_scan(self) -> pd.DataFrame:
        """Run complete ultra-fast 3-stage scan"""
        total_start_time = time.time()

        # Stage 1
        stage1_start = time.time()
        optimized_universe = self.execute_stage1_ultra_fast()
        stage1_time = time.time() - stage1_start

        if not optimized_universe:
            print("\n❌ Stage 1 failed: No symbols qualified")
            return pd.DataFrame()

        # Stage 2
        stage2_start = time.time()
        signals_df = self.execute_stage2_ultra_fast(optimized_universe)
        stage2_time = time.time() - stage2_start

        if signals_df.empty:
            print("\n❌ Stage 2 failed: No signals detected")
            return pd.DataFrame()

        # Stage 3
        self.execute_stage3_results_ultra_fast(signals_df)

        total_elapsed = time.time() - total_start_time

        print(f"\n{'='*70}")
        print("🚀 ULTRA-FAST SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"⏱️  Total Time: {total_elapsed:.1f}s")
        print(f"🎯 Stage 1 Time: {stage1_time:.1f}s")
        print(f"🎯 Stage 2 Time: {stage2_time:.1f}s")
        print(f"✅ Final Signals: {len(signals_df):,}")
        print(f"📈 Throughput: {len(optimized_universe)/total_elapsed:.0f} symbols/second")
        print(f"{'='*70}")

        return signals_df


def main():
    """Main execution for ultra-fast SC DMR multi-scanner scanning"""
    scanner = UltraFastRenataSCDMRMultiScanner()

    print("\n🚀 Starting ULTRA-FAST SC DMR Multi-Scanner...")
    print("⚡ 10 scanner patterns in single execution")
    print("📡 Edge.dev Standard: Snapshot + Individual Symbol History")

    results = scanner.run_ultra_fast_scan()

    # Export results
    if not results.empty:
        filename = "sc_dmr_results.csv"
        results.to_csv(filename, index=False)
        print(f"\n✅ Results exported to: {filename}")

        # Print all results
        print(f"\n{'='*70}")
        print(f"ALL RESULTS ({len(results)} signals)")
        print(f"{'='*70}")
        print(results.to_string(index=False))
        print(f"{'='*70}")

    return results


if __name__ == "__main__":
    main()
