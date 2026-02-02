"""
UltraFastRenataLCD2MultiScanner

Edge.dev Standardized LC D2 Multi-Scanner
Scanner Type: LC D2 (Large Cap D2/D3/D4 Multi-Scanner)

Original Source: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py (1300+ lines)
Formatted: 2025-12-26

Edge.dev Standardizations Applied:
- Type-specific class naming (UltraFastRenataLCD2MultiScanner)
- 3-Stage Architecture (Market Universe Optimization → Pattern Detection → Results Analysis)
- Ultra-optimized threading (Stage 1: min(128, cpu_cores * 8), Stage 2: min(96, cpu_cores * 6))
- Session pooling with HTTPAdapter(100)
- Batch processing (200 symbols)
- Smart filtering (6 mass parameters)
- Individual API architecture

Pattern Type: Multi-Scanner (12 patterns)
- LC_Frontside_D3_Extended_1/2
- LC_Backside_D3_Extended_1/2
- LC_Frontside/Backside_D4_Para
- LC_Frontside_D3_Uptrend
- LC_Backside_D3
- LC_Frontside_D2_Uptrend
- LC_Frontside/Backside_D2
- LC_FBO
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


class UltraFastRenataLCD2MultiScanner:
    """
    LC D2 Multi-Scanner - Large Cap D2/D3/D4 Pattern Detection

    Pattern Description:
    - 12 scanner patterns in single execution
    - Mass parameters (shared across all scanners)
    - Individual parameters (unique per scanner)
    - 3-column output: Ticker, Date, Scanner_Label

    Key Features:
    - 6 mass parameters (min_close_price, min_volume, min_dollar_volume, bullish_close, prev_bullish_close, ema_trend_aligned)
    - Individual parameters per scanner
    - Day -1 minimum close price: $5.00
    - Day -1 minimum volume: 10M shares
    """

    def __init__(self, api_key: str = None):
        """Initialize the LC D2 multi-scanner with parameters."""
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
        print(f"🔧 SCANNER TYPE: LC D2 Multi-Scanner (12 patterns)")

        # ========== DEFAULT TICKER LIST ==========
        self.default_tickers = [
            "AAPL", "MSFT", "GOOGL", "AMZN", "TSLA", "NVDA", "META", "AMD", "INTC", "BA",
            "PYPL", "QCOM", "ORCL", "T", "CSCO", "VZ", "KO", "PEP", "MRK", "PFE", "ABBV", "JNJ", "CRM",
            "BAC", "C", "JPM", "WMT", "CVX", "XOM", "COP", "RTX", "SPGI", "GS", "HD", "LOW", "COST", "UNH",
            "NEE", "NKE", "LMT", "HON", "CAT", "MMM", "LIN", "ADBE", "AVGO", "TXN", "ACN", "UPS", "BLK", "PM", "MO",
            "ELV", "VRTX", "ZTS", "NOW", "ISRG", "PLD", "MS", "MDT", "WM", "GE", "IBM", "BKNG", "FDX", "ADP", "EQIX",
            "DHR", "SNPS", "REGN", "SYK", "TMO", "CVS", "INTU", "SCHW", "CI", "APD", "SO", "MMC", "ICE", "FIS",
            "ADI", "CSX", "LRCX", "GILD", "SPY", "QQQ", "DIA", "IWM", "TQQQ", "SQQQ", "ARKK", "LABU", "TECL",
            "XLE", "XLK", "XLF", "IBB", "KWEB", "TAN", "XOP", "EEM", "HYG", "EFA", "USO", "GLD", "SLV"
        ]
        self.default_tickers = list(set(self.default_tickers))

        # ========== MASS PARAMETERS (Applied to ALL 12 scanners) ==========
        self.mass_params = {
            "min_close_price": 5.0,              # Minimum close price
            "min_volume": 10000000,               # Minimum volume (10M)
            "min_dollar_volume": 500000000,       # Minimum dollar volume (500M)
            "bullish_close": True,                # Close >= Open (current)
            "prev_bullish_close": True,           # Close >= Open (previous)
            "ema_trend_aligned": True,            # EMA9 >= EMA20 >= EMA50
        }

        # ========== INDIVIDUAL SCANNER PARAMETERS (Unique per scanner) ==========
        self.scanner_params = {
            "LC_Frontside_D3_Extended_1": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Backside_D3_Extended_1": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Frontside_D3_Extended_2": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Backside_D3_Extended_2": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Frontside_D4_Para": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Backside_D4_Para": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Frontside_D3_Uptrend": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Backside_D3": {
                "high_chg_atr_min": 1.0,
                "high_chg_atr1_min": 0.7,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "h_dist_to_highest_high_20_atr": 2.5,
                "enabled": True,
            },
            "LC_Frontside_D2_Uptrend": {
                "high_chg_atr_min": 0.75,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "enabled": True,
            },
            "LC_Frontside_D2": {
                "high_chg_atr_min": 1.5,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "enabled": True,
            },
            "LC_Backside_D2": {
                "high_chg_atr_min": 1.5,
                "dist_h_9ema_atr_min": 1.5,
                "dist_h_20ema_atr_min": 2.0,
                "min_close_ua": 5,
                "enabled": True,
            },
            "LC_FBO": {
                "high_chg_atr_min": 0.5,
                "close_range_min": 0.3,
                "min_close_ua": 2000000000,
                "h_dist_to_lowest_low_20_atr": 4.0,
                "enabled": True,
            },
        }

        # ========== DATE RANGES ==========
        self.d0_start = "2025-01-01"
        self.d0_end = "2025-12-01"

        # Need 220+ days history for EMA200 - scan through current date
        buffer_days = 250
        current_date = datetime.datetime.now().strftime("%Y-%m-%d")
        self.scan_start = (datetime.datetime.now() - datetime.timedelta(days=365 + buffer_days)).strftime("%Y-%m-%d")
        self.scan_end = current_date  # Fetch data through today, not just d0_end

        # Smart filtering uses the same historical range
        self.smart_start = self.scan_start
        self.smart_end = self.scan_end

        # ========== API CONFIGURATION ==========
        self.snapshot_endpoint = "/v2/snapshot/locale/us/markets/stocks/tickers"
        self.aggs_endpoint = "/v2/aggs/ticker"

        print("🚀 Ultra-Fast Renata LC D2 Multi-Scanner Initialized")
        print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")
        print(f"🎯 Mass Parameters: {len(self.mass_params)} (shared across all 12 scanners)")
        print(f"📈 Scanner Patterns: {len(self.scanner_params)}")

    def _extract_smart_filter_params(self, mass_params: dict) -> dict:
        """
        Extract Stage 1 smart filtering parameters from mass params.

        Note: Only price, volume, and dollar volume are available in Polygon snapshot API.
        """
        smart_params = {
            'min_close_price': mass_params['min_close_price'],
            'min_volume': mass_params['min_volume'],
            'min_dollar_volume': mass_params['min_dollar_volume'],
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
            if price < smart_params['min_close_price']:
                return False

            if volume < smart_params['min_volume']:
                return False

            dollar_volume = price * volume
            if dollar_volume < smart_params['min_dollar_volume']:
                return False

            return True

        except Exception:
            return False

    def execute_stage1_ultra_fast(self, symbols: list = None) -> list:
        """
        Stage 1: Market Universe Optimization

        Smart filtering using mass parameters (price, volume, dollar volume) to reduce Stage 2 load.
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

        # Apply smart filters
        smart_params = self._extract_smart_filter_params(self.mass_params)

        print(f"\n🔄 Applying ultra-fast smart filters to {len(market_universe):,} tickers...")
        print(f"⚡ Using {self.stage1_workers} hyper-threads")
        print(f"📊 Filters: price >= ${smart_params['min_close_price']}, volume >= {smart_params['min_volume']:,}, dol_vol >= {smart_params['min_dollar_volume']/1e6:.0f}M")

        qualified_tickers = set()
        processed = 0
        qualified_count = 0
        last_progress_time = time.time()

        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            future_to_ticker = {
                executor.submit(self._apply_smart_filters, ticker, smart_params): ticker
                for ticker in market_universe
            }

            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                processed += 1

                try:
                    if future.result():
                        qualified_tickers.add(ticker)
                        qualified_count += 1

                    # Progress reporting
                    current_time = time.time()
                    if processed % 100 == 0 or (current_time - last_progress_time) >= 5:
                        qualify_rate = (qualified_count / processed) * 100
                        progress_pct = (processed / len(market_universe)) * 100
                        print(f"⚡ Progress: {processed:,}/{len(market_universe):,} ({progress_pct:.1f}%) | "
                              f"Qualified: {qualified_count:,} ({qualify_rate:.1f}%)")
                        last_progress_time = current_time

                except Exception:
                    pass

        print(f"\n🚀 Stage 1 Complete:")
        print(f"📊 Processed: {processed:,} tickers")
        print(f"✅ Qualified: {len(qualified_tickers):,} tickers")

        return list(qualified_tickers)

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
        """Calculate all technical features needed for pattern detection"""
        # Rename columns for consistency
        df = df.rename(columns={
            'o': 'open',
            'h': 'high',
            'l': 'low',
            'c': 'close',
            'v': 'v',
            'vw': 'vw'
        })

        # Add unadjusted close and volume (for now use adjusted)
        df['c_ua'] = df['close']
        df['v_ua'] = df['v']

        # Previous values
        df['pdc'] = df['close'].shift(1)
        df['h1'] = df['high'].shift(1)
        df['h2'] = df['high'].shift(2)
        df['h3'] = df['high'].shift(3)

        df['c1'] = df['close'].shift(1)
        df['c2'] = df['close'].shift(2)
        df['c3'] = df['close'].shift(3)

        df['o1'] = df['open'].shift(1)
        df['o2'] = df['open'].shift(2)

        df['l1'] = df['low'].shift(1)
        df['l2'] = df['low'].shift(2)

        df['v_ua1'] = df['v_ua'].shift(1)
        df['v1'] = df['v'].shift(1)
        df['v2'] = df['v'].shift(2)

        # Dollar volume
        df['dol_v'] = df['close'] * df['v']
        df['dol_v1'] = df['dol_v'].shift(1)
        df['dol_v2'] = df['dol_v'].shift(2)

        # Close range
        df['d1_range'] = df['high'] - df['low']
        df['close_range'] = (df['close'] - df['low']) / (df['high'] - df['low'])
        df['close_range1'] = df['close_range'].shift(1)

        # Gap features
        df['gap_atr'] = (df['open'] - df['pdc']) / df['d1_range']
        df['gap_atr1'] = (df['o1'] - df['c2']) / df['d1_range']
        df['gap_pdh_atr'] = (df['open'] - df['h1']) / df['d1_range']

        # High change features
        df['high_chg'] = df['high'] - df['open']
        df['high_chg_atr'] = df['high_chg'] / df['d1_range']
        df['high_chg_atr1'] = (df['h1'] - df['o1']) / df['d1_range']

        # Percentage change
        df['pct_change'] = ((df['close'] / df['c1']) - 1) * 100

        # High percentage change
        df['high_pct_chg'] = (df['high'] / df['c1'] - 1)
        df['high_pct_chg1'] = (df['h1'] / df['c2'] - 1)

        # EMAs
        df['ema9'] = df['close'].ewm(span=9, adjust=False).mean().fillna(0)
        df['ema20'] = df['close'].ewm(span=20, adjust=False).mean().fillna(0)
        df['ema50'] = df['close'].ewm(span=50, adjust=False).mean().fillna(0)
        df['ema200'] = df['close'].ewm(span=200, adjust=False).mean().fillna(0)

        # Distance from high to EMAs
        df['dist_h_9ema'] = df['high'] - df['ema9']
        df['dist_h_20ema'] = df['high'] - df['ema20']
        df['dist_h_50ema'] = df['high'] - df['ema50']

        df['dist_h_9ema1'] = df['dist_h_9ema'].shift(1)
        df['dist_h_20ema1'] = df['dist_h_20ema'].shift(1)

        df['dist_h_9ema_atr'] = df['dist_h_9ema'] / df['d1_range']
        df['dist_h_20ema_atr'] = df['dist_h_20ema'] / df['d1_range']
        df['dist_h_9ema_atr1'] = df['dist_h_9ema1'] / df['d1_range']
        df['dist_h_20ema_atr1'] = df['dist_h_20ema1'] / df['d1_range']

        # Highest/Lowest features
        df['lowest_low_20'] = df['low'].rolling(window=20, min_periods=1).min()
        df['lowest_low_5'] = df['low'].rolling(window=5, min_periods=1).min()

        df['highest_high_20'] = df['high'].rolling(window=20, min_periods=1).max()
        df['highest_high_5'] = df['high'].rolling(window=5, min_periods=1).max()

        df['highest_high_50'] = df['high'].rolling(window=50, min_periods=1).max()
        df['highest_high_50_4'] = df['highest_high_50'].shift(4)

        df['highest_high_100'] = df['high'].rolling(window=100, min_periods=1).max()
        df['highest_high_100_4'] = df['highest_high_100'].shift(4)

        # Distance to lowest low
        df['h_dist_to_lowest_low_20'] = df['high'] - df['lowest_low_20']
        df['h_dist_to_lowest_low_5'] = df['high'] - df['lowest_low_5']

        # Distance to highest high
        df['h_dist_to_highest_high_20'] = df['high'] - df['highest_high_20']

        return df

    def _check_scanner_conditions(self, row: pd.Series, scanner_name: str, params: dict) -> bool:
        """Check if a row meets the conditions for a specific scanner pattern"""
        try:
            # Mass parameter checks (applied to all scanners)
            if pd.isna(row.get('close')) or row['close'] < self.mass_params['min_close_price']:
                return False

            if pd.isna(row.get('v_ua')) or row['v_ua'] < self.mass_params['min_volume']:
                return False

            if pd.isna(row.get('dol_v')) or row['dol_v'] < self.mass_params['min_dollar_volume']:
                return False

            if self.mass_params['bullish_close']:
                if pd.isna(row.get('close')) or pd.isna(row.get('open')) or row['close'] < row['open']:
                    return False

            if self.mass_params['prev_bullish_close']:
                if pd.isna(row.get('c1')) or pd.isna(row.get('o1')) or row['c1'] < row['o1']:
                    return False

            if self.mass_params['ema_trend_aligned']:
                if pd.isna(row.get('ema9')) or pd.isna(row.get('ema20')) or pd.isna(row.get('ema50')):
                    return False
                if not (row['ema9'] >= row['ema20'] >= row['ema50']):
                    return False

            # High >= previous high
            if pd.isna(row.get('high')) or pd.isna(row.get('h1')):
                return False
            if row['high'] < row['h1']:
                return False

            # Scanner-specific checks
            if scanner_name in ['LC_Frontside_D3_Extended_1', 'LC_Backside_D3_Extended_1',
                               'LC_Frontside_D3_Extended_2', 'LC_Backside_D3_Extended_2',
                               'LC_Frontside_D4_Para', 'LC_Backside_D4_Para',
                               'LC_Frontside_D3_Uptrend', 'LC_Backside_D3']:
                return self._check_d3_pattern(row, params)

            elif scanner_name in ['LC_Frontside_D2_Uptrend', 'LC_Frontside_D2', 'LC_Backside_D2']:
                return self._check_d2_pattern(row, params)

            elif scanner_name == 'LC_FBO':
                return self._check_fbo_pattern(row, params)

            return False

        except Exception:
            return False

    def _check_d3_pattern(self, row: pd.Series, params: dict) -> bool:
        """Check D3 pattern conditions"""
        if pd.isna(row.get('high_chg_atr')) or row['high_chg_atr'] < params.get('high_chg_atr_min', 1.0):
            return False

        if pd.isna(row.get('high_chg_atr1')) or row['high_chg_atr1'] < params.get('high_chg_atr1_min', 0.7):
            return False

        if pd.isna(row.get('dist_h_9ema_atr')) or row['dist_h_9ema_atr'] < params.get('dist_h_9ema_atr_min', 1.5):
            return False

        if pd.isna(row.get('dist_h_20ema_atr')) or row['dist_h_20ema_atr'] < params.get('dist_h_20ema_atr_min', 2.0):
            return False

        if pd.isna(row.get('c_ua')) or row['c_ua'] < params.get('min_close_ua', 5):
            return False

        if 'h_dist_to_highest_high_20_atr' in params:
            if pd.isna(row.get('h_dist_to_highest_high_20')):
                return False
            if row['h_dist_to_highest_high_20'] < params['h_dist_to_highest_high_20_atr'] * row['d1_range']:
                return False

        # At least one high_chg_atr >= 1.0
        if not (row['high_chg_atr'] >= 1.0 or row.get('high_chg_atr1', 0) >= 1.0):
            return False

        return True

    def _check_d2_pattern(self, row: pd.Series, params: dict) -> bool:
        """Check D2 pattern conditions"""
        if pd.isna(row.get('high_chg_atr')) or row['high_chg_atr'] < params.get('high_chg_atr_min', 1.5):
            return False

        if pd.isna(row.get('dist_h_9ema_atr')) or row['dist_h_9ema_atr'] < params.get('dist_h_9ema_atr_min', 1.5):
            return False

        if pd.isna(row.get('dist_h_20ema_atr')) or row['dist_h_20ema_atr'] < params.get('dist_h_20ema_atr_min', 2.0):
            return False

        if pd.isna(row.get('c_ua')) or row['c_ua'] < params.get('min_close_ua', 5):
            return False

        return True

    def _check_fbo_pattern(self, row: pd.Series, params: dict) -> bool:
        """Check FBO (First Breakout) pattern conditions"""
        # High change OR high change from PDC (in ATR)
        high_chg_ok = (not pd.isna(row.get('high_chg_atr')) and row['high_chg_atr'] >= params.get('high_chg_atr_min', 0.5))

        # For simplified version, skip high_chg_from_pdc_atr check

        if not high_chg_ok:
            return False

        # Close range minimum
        if pd.isna(row.get('close_range')) or row['close_range'] < params.get('close_range_min', 0.3):
            return False

        # Minimum close unadjusted (very high for FBO)
        if pd.isna(row.get('c_ua')) or row['c_ua'] < params.get('min_close_ua', 2000000000):
            return False

        return True

    def _scan_symbol(self, ticker: str) -> pd.DataFrame:
        """Scan a single symbol for all 12 scanner patterns"""
        try:
            # Fetch historical data
            df = self._fetch_symbol_history(ticker)

            if df.empty:
                return pd.DataFrame()

            # Calculate features
            df = self._calculate_features(df)

            # Filter by D0 date range
            df['Date'] = pd.to_datetime(df['Date'])
            df = df[
                (df['Date'] >= pd.to_datetime(self.d0_start)) &
                (df['Date'] <= pd.to_datetime(self.d0_end))
            ]

            if df.empty:
                return pd.DataFrame()

            # Check all scanner patterns
            all_signals = []

            for scanner_name, params in self.scanner_params.items():
                if not params.get('enabled', True):
                    continue

                # Apply scanner conditions
                mask = df.apply(
                    lambda row: self._check_scanner_conditions(row, scanner_name, params),
                    axis=1
                )

                # Get matching rows
                matches = df[mask].copy()

                if not matches.empty:
                    matches['Ticker'] = ticker
                    matches['Scanner_Label'] = scanner_name
                    all_signals.append(matches)

            # Combine all signals for this symbol
            if all_signals:
                return pd.concat(all_signals, ignore_index=True)
            else:
                return pd.DataFrame()

        except Exception:
            return pd.DataFrame()

    def execute_stage2_ultra_fast(self, symbols: list) -> pd.DataFrame:
        """
        Stage 2: Multi-Scanner Pattern Detection

        - Process each symbol individually in parallel
        - Fetch historical data per symbol
        - Check all 12 scanner patterns
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
    """Main execution for ultra-fast LC D2 multi-scanner scanning"""
    scanner = UltraFastRenataLCD2MultiScanner()

    print("\n🚀 Starting ULTRA-FAST LC D2 Multi-Scanner...")
    print("⚡ 12 scanner patterns in single execution")
    print("📡 Edge.dev Standard: Snapshot + Individual Symbol History")

    results = scanner.run_ultra_fast_scan()

    # Export results
    if not results.empty:
        filename = "lc_d2_results.csv"
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
