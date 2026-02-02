"""
UltraFastRenataLC3DGapScanner

Edge.dev Standardized LC 3D Gap Scanner
Scanner Type: LC 3D Gap (Large Cap 3-Day EMA Gap Pattern)

Original Source: /Users/michaeldurante/.anaconda/working code/LC 3d Gap/scan.py (236 lines)
Formatted: 2025-12-26

Edge.dev Standardizations Applied:
- Type-specific class naming (UltraFastRenataLC3DGapScanner)
- 3-Stage Architecture (Market Universe Optimization → Pattern Detection → Results Analysis)
- Ultra-optimized threading (Stage 1: min(128, cpu_cores * 8), Stage 2: min(96, cpu_cores * 6))
- Session pooling with HTTPAdapter(100)
- Batch processing (200 symbols)
- Smart filtering (8 parameters)
- Individual API architecture

Pattern Type: Large Cap 3-Day EMA Gap
- Multi-day EMA distance averaging (14-day, 7-day, 3-day lookbacks)
- Swing high detection (day -5 to -65)
- ATR14 period
- Day 0 gap rules
- 15 parameters total
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


class UltraFastRenataLC3DGapScanner:
    """
    LC 3D Gap Scanner - Large Cap 3-Day EMA Gap Pattern

    Pattern Description:
    - Multi-day EMA distance averaging (14-day, 7-day, 3-day lookbacks)
    - Progressive EMA10 and EMA30 distance requirements
    - Swing high breakout (day -1 high above swing highs from -5 to -65)
    - Day 0 gap confirmation

    Key Features:
    - ATR14 period
    - 15 parameters total
    - Day -1 minimum close price: $20
    - Day -1 minimum volume: 7M shares
    """

    def __init__(self, api_key: str = None):
        """Initialize the LC 3D Gap scanner with parameters."""
        # Core API Configuration
        self.session = requests.Session()
        self.session.mount('https://', requests.adapters.HTTPAdapter(
            pool_connections=100,  # Max connection pool
            pool_maxsize=100,      # Max connections in pool
            max_retries=2,          # Fast retry
            pool_block=False
        ))

        self.api_key = api_key or "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

        # Market calendar for trading day calculations
        self.us_calendar = mcal.get_calendar('NYSE')

        # 🚀 RENATA ULTRA SPEED CONFIGURATION
        # I/O-bound tasks can handle more threads than CPU cores
        import multiprocessing as mp
        cpu_cores = mp.cpu_count() or 16
        self.stage1_workers = min(128, cpu_cores * 8)  # 8x CPU cores for Stage 1
        self.stage2_workers = min(96, cpu_cores * 6)    # 6x CPU cores for Stage 2
        self.batch_size = 200                           # Process in chunks

        print(f"🚀 RENATA ULTRA-FAST MODE: Stage1: {self.stage1_workers} threads, Stage2: {self.stage2_workers} threads")
        print(f"🔧 SCANNER TYPE: LC 3D GAP (Large Cap 3-Day EMA Gap)")

        # ========== DEFAULT TICKER LIST (from original code) ==========
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
        self.default_tickers = list(set(self.default_tickers))  # Remove duplicates

        # ========== PARAMETERS (15 total) ==========
        self.params = {
            # Multi-day EMA10 averaging
            "day_14_avg_ema10_min": 0.25,           # Day -14 Avg EMA 10 >= 0.25x ATR
            "day_14_avg_ema30_min": 0.5,            # Day -14 Avg EMA 30 >= 0.5x ATR
            "day_7_avg_ema10_min": 0.25,            # Day -7 Avg EMA 10 >= 0.25x ATR
            "day_7_avg_ema30_min": 0.75,            # Day -7 Avg EMA 30 >= 0.75x ATR
            "day_3_avg_ema10_min": 0.5,             # Day -3 Avg EMA 10 >= 0.5x ATR
            "day_3_avg_ema30_min": 1.0,             # Day -3 Avg EMA 30 >= 1.0x ATR

            # Day -2 EMA positioning
            "day_2_ema10_distance_min": 1.0,        # Day -2 EMA 10 Distance >= 1.0x ATR
            "day_2_ema30_distance_min": 2.0,        # Day -2 EMA 30 Distance >= 2.0x ATR

            # Day -1 metrics
            "day_1_ema10_distance_min": 1.5,        # Day -1 EMA 10 Distance >= 1.5x ATR
            "day_1_ema30_distance_min": 3.0,        # Day -1 EMA 30 Distance >= 3.0x ATR
            "day_1_vol_min": 7_000_000,             # Day -1 Volume >= 7M
            "day_1_close_min": 20.0,                # Day -1 Close >= $20

            # Swing high breakout
            "day_1_high_vs_swing_high_min": 1.0,    # Day -1 High >= 1x ATR above Swing High (-5 to -65)

            # Day 0 gap rules
            "day_0_gap_min": 0.5,                   # Day 0 Gap >= 0.5x ATR
            "day_0_open_minus_d1_high_min": 0.1,    # Day 0 Open - Day -1 High >= 0.1x ATR
        }

        # ========== DATE RANGES ==========
        # D0 Range: Signal output range (2024-2025)
        self.d0_start = "2024-01-01"
        self.d0_end = datetime.datetime.now().strftime("%Y-%m-%d")

        # Fetch Range: Historical data needed for calculations
        # Need 65+ days for swing high + EMA30
        buffer_days = 100
        self.scan_start = (datetime.datetime.now() - datetime.timedelta(days=730 + buffer_days)).strftime("%Y-%m-%d")
        self.scan_end = self.d0_end

        # Smart filtering uses the same historical range
        self.smart_start = self.scan_start
        self.smart_end = self.scan_end

        # ========== ATR CONFIGURATION ==========
        self.atr_period = 14  # 14-day ATR period

        # ========== API CONFIGURATION ==========
        self.api_base = "https://api.polygon.io"
        self.snapshot_endpoint = "/v2/snapshot/locale/us/markets/stocks/tickers"
        self.aggs_endpoint = "/v2/aggs/ticker"

        print("🚀 Ultra-Fast Renata LC 3D Gap Scanner Initialized")
        print(f"📅 Signal Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Data Range (for swing high + EMA30): {self.scan_start} to {self.scan_end}")
        print(f"Parameters: {len(self.params)} total, Smart Filters: 2 (price >= $20, volume >= 7M)")
        print(f"⚙️  ATR Period: {self.atr_period} days")

    def _extract_smart_filter_params(self, params: dict) -> dict:
        """
        Extract Stage 1 smart filtering parameters (2 parameters).

        Note: Only price and volume are available in Polygon snapshot API.
        EMA, ATR, gap, and other metrics require historical data (Stage 2).
        """
        smart_params = {
            'day_1_close_min': params['day_1_close_min'],              # $20
            'day_1_vol_min': params['day_1_vol_min'],                  # 7M
        }
        return smart_params

    def execute_stage1_ultra_fast(self, symbols: list = None) -> list:
        """
        Stage 1: Market Universe Optimization

        Smart filtering using 2 key parameters (price, volume) to reduce Stage 2 load.
        - Fetch all tickers from Polygon snapshot API
        - Apply price and volume filters
        - Use default ticker list if symbols not provided
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
            print(f"✅ Filtered universe: {len(market_universe):,} unique tickers")

        # Apply smart filters
        smart_params = self._extract_smart_filter_params(self.params)

        print(f"\n🔄 Applying ultra-fast smart filters to {len(market_universe):,} tickers...")
        print(f"⚡ Using {self.stage1_workers} hyper-threads")

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

    def _fetch_market_universe(self) -> list:
        """Fetch all tickers from Polygon snapshot API."""
        try:
            url = f"{self.api_base}{self.snapshot_endpoint}"
            params = {
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return []

            data = response.json()
            tickers = data.get('tickers', [])

            valid_tickers = []
            for ticker in tickers:
                ticker_symbol = ticker.get('ticker')
                if ticker_symbol and len(ticker_symbol) <= 10:
                    valid_tickers.append(ticker_symbol)

            return list(set(valid_tickers))

        except Exception as e:
            return []

    def _apply_smart_filters(self, ticker: str, smart_params: dict) -> bool:
        """Apply smart filters (price and volume) to a single ticker."""
        try:
            url = f"{self.api_base}{self.snapshot_endpoint}"
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
            if price < smart_params['day_1_close_min']:
                return False

            if volume < smart_params['day_1_vol_min']:
                return False

            return True

        except Exception:
            return False

    def execute_stage2_ultra_fast(self, symbols: list) -> pd.DataFrame:
        """
        Stage 2: Pattern Detection

        Full 15-parameter LC 3D Gap pattern detection.
        - Processes each symbol individually in parallel
        - ThreadPoolExecutor with self.stage2_workers workers
        - Polygon aggregates API
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 2: ULTRA-FAST PATTERN DETECTION (LC 3D GAP)")
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
                    executor.submit(self._scan_symbol_lc3d, symbol): symbol
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
                            print(f"✅ {symbol}: {len(results)} LC 3D Gap signals")
                        else:
                            pass

                    except Exception:
                        pass  # Fast fail

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

            # Apply date filters
            final_results['Date'] = pd.to_datetime(final_results['Date'])
            final_results = final_results[(final_results["Date"] >= pd.to_datetime(self.d0_start)) &
                                        (final_results["Date"] <= pd.to_datetime(self.d0_end))]
            final_results = final_results.sort_values(["Date", "Ticker"], ascending=[False, True])

            print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s): Found {len(final_results)} LC 3D Gap signals")
            print(f"⚡ Processing Speed: {processed/elapsed:.0f} symbols/second")

            return final_results
        else:
            print(f"\n🚀 Stage 2 Complete ({elapsed:.1f}s): No LC 3D Gap signals found")
            return pd.DataFrame()

    def _scan_symbol_lc3d(self, ticker: str) -> pd.DataFrame:
        """Scan a single symbol for LC 3D Gap pattern."""
        try:
            # Fetch historical data
            url = f"{self.api_base}{self.aggs_endpoint}/{ticker}/range/1/day/{self.scan_start}/{self.scan_end}"
            params = {
                "adjusted": "true",
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=30)

            if response.status_code != 200:
                return pd.DataFrame()

            data = response.json().get("results", [])

            if len(data) < 66:  # Need 65 days buffer + current day
                return pd.DataFrame()

            # Convert to DataFrame
            df = pd.DataFrame(data)
            df['Date'] = pd.to_datetime(df['t'], unit='ms').dt.strftime('%Y-%m-%d')

            # Calculate ATR14
            df['TR'] = np.maximum(
                df['h'] - df['l'],
                np.maximum(
                    abs(df['h'] - df['c'].shift(1)),
                    abs(df['l'] - df['c'].shift(1))
                )
            )
            df['ATR'] = df['TR'].rolling(window=self.atr_period, min_periods=self.atr_period).mean()

            # Calculate EMA10 and EMA30
            df['EMA10'] = df['c'].ewm(span=10, adjust=False).mean()
            df['EMA30'] = df['c'].ewm(span=30, adjust=False).mean()

            results = []

            # Scan through all valid days
            for i in range(66, len(df)):
                data_slice = df.iloc[i-66:i].copy()
                r_1 = df.iloc[i-1]  # Day -1
                r0 = df.iloc[i]     # Day 0

                # ATR check
                if pd.isna(r_1['ATR']) or r_1['ATR'] == 0:
                    continue

                atr_day_1 = r_1['ATR']

                # ========== ALL 15 CONDITIONS ==========

                # Day -14 AVG EMA DISTANCE
                day_14_avg_ema10 = self._calculate_avg_ema_distance(df[:i], 14, 10, atr_day_1)
                day_14_avg_ema30 = self._calculate_avg_ema_distance(df[:i], 14, 30, atr_day_1)
                if day_14_avg_ema10 < self.params['day_14_avg_ema10_min']:
                    continue
                if day_14_avg_ema30 < self.params['day_14_avg_ema30_min']:
                    continue

                # Day -7 AVG EMA DISTANCE
                day_7_avg_ema10 = self._calculate_avg_ema_distance(df[:i], 7, 10, atr_day_1)
                day_7_avg_ema30 = self._calculate_avg_ema_distance(df[:i], 7, 30, atr_day_1)
                if day_7_avg_ema10 < self.params['day_7_avg_ema10_min']:
                    continue
                if day_7_avg_ema30 < self.params['day_7_avg_ema30_min']:
                    continue

                # Day -3 AVG EMA DISTANCE
                day_3_avg_ema10 = self._calculate_avg_ema_distance(df[:i], 3, 10, atr_day_1)
                day_3_avg_ema30 = self._calculate_avg_ema_distance(df[:i], 3, 30, atr_day_1)
                if day_3_avg_ema10 < self.params['day_3_avg_ema10_min']:
                    continue
                if day_3_avg_ema30 < self.params['day_3_avg_ema30_min']:
                    continue

                # Day -2 EMA DISTANCE
                r_2 = df.iloc[i-2]
                day_2_ema10_distance = (r_2['h'] - r_2['EMA10']) / atr_day_1
                day_2_ema30_distance = (r_2['h'] - r_2['EMA30']) / atr_day_1
                if day_2_ema10_distance < self.params['day_2_ema10_distance_min']:
                    continue
                if day_2_ema30_distance < self.params['day_2_ema30_distance_min']:
                    continue

                # Day -1 METRICS
                day_1_ema10_distance = (r_1['h'] - r_1['EMA10']) / atr_day_1
                day_1_ema30_distance = (r_1['h'] - r_1['EMA30']) / atr_day_1
                if day_1_ema10_distance < self.params['day_1_ema10_distance_min']:
                    continue
                if day_1_ema30_distance < self.params['day_1_ema30_distance_min']:
                    continue
                if r_1['v'] < self.params['day_1_vol_min']:
                    continue
                if r_1['c'] < self.params['day_1_close_min']:
                    continue

                # SWING HIGH BREAKOUT
                swing_high_data = df.iloc[i-66:i-1]
                swing_highs = []
                for j in range(1, len(swing_high_data) - 1):
                    prev_high = swing_high_data.iloc[j-1]['h']
                    curr_high = swing_high_data.iloc[j]['h']
                    next_high = swing_high_data.iloc[j+1]['h']
                    if curr_high > prev_high and curr_high > next_high:
                        swing_highs.append(curr_high)

                if not swing_highs:
                    continue

                highest_swing_high = max(swing_highs)
                day_1_high_vs_swing = (r_1['h'] - highest_swing_high) / atr_day_1
                if day_1_high_vs_swing < self.params['day_1_high_vs_swing_high_min']:
                    continue

                # Day 0 GAP RULES
                day_0_gap = (r0['o'] - r_1['c']) / atr_day_1
                if day_0_gap < self.params['day_0_gap_min']:
                    continue

                day_0_open_minus_d1_high = (r0['o'] - r_1['h']) / atr_day_1
                if day_0_open_minus_d1_high < self.params['day_0_open_minus_d1_high_min']:
                    continue

                # ========== ALL CONDITIONS PASSED ==========
                results.append({
                    'Date': r0['Date'],
                    'Ticker': ticker,
                    'Open': r0['o'],
                    'High': r0['h'],
                    'Low': r0['l'],
                    'Close': r0['c'],
                    'Volume': r0['v'],
                    'ATR': atr_day_1,
                    'Day_14_Avg_EMA10': day_14_avg_ema10,
                    'Day_14_Avg_EMA30': day_14_avg_ema30,
                    'Day_7_Avg_EMA10': day_7_avg_ema10,
                    'Day_7_Avg_EMA30': day_7_avg_ema30,
                    'Day_3_Avg_EMA10': day_3_avg_ema10,
                    'Day_3_Avg_EMA30': day_3_avg_ema30,
                    'Day_2_EMA10_Dist': day_2_ema10_distance,
                    'Day_2_EMA30_Dist': day_2_ema30_distance,
                    'Day_1_EMA10_Dist': day_1_ema10_distance,
                    'Day_1_EMA30_Dist': day_1_ema30_distance,
                    'Day_1_High_vs_Swing': day_1_high_vs_swing,
                    'Day_0_Gap': day_0_gap,
                    'Day_0_Open_Minus_D1_High': day_0_open_minus_d1_high,
                })

            return pd.DataFrame(results)

        except Exception:
            return pd.DataFrame()

    def _calculate_avg_ema_distance_multiple(self, data: pd.DataFrame, period: int, ema_period: int, atr: float) -> float:
        """
        Calculate average EMA distance as multiple of ATR over N days.

        Args:
            data: DataFrame with historical data
            period: Number of days to average
            ema_period: EMA period (10 or 30)
            atr: ATR value for normalization

        Returns:
            Average EMA distance as multiple of ATR
        """
        distances = []

        for i in range(period):
            idx = -(i + 1)
            if abs(idx) >= len(data):
                continue

            high = data.iloc[idx]['h']

            # Calculate EMA using data up to day - (i + 1)
            ema_data = data.iloc[:-(i + 1)]
            if len(ema_data) < ema_period:
                continue

            ema = ema_data['c'].ewm(span=ema_period, adjust=False).mean().iloc[-1]
            distance_multiple = (high - ema) / atr
            distances.append(distance_multiple)

        return sum(distances) / len(distances) if distances else 0.0

    def _calculate_avg_ema_distance(self, data: pd.DataFrame, period: int, ema_period: int, atr: float) -> float:
        """Wrapper for average EMA distance calculation."""
        return self._calculate_avg_ema_distance_multiple(data, period, ema_period, atr)

    def execute_stage3_results_ultra_fast(self, results_df: pd.DataFrame, save_results: bool = True) -> dict:
        """
        Stage 3: Results Analysis and Display

        Display and save results.
        """
        print(f"\n{'='*70}")
        print("🚀 STAGE 3: RESULTS ANALYSIS")
        print(f"{'='*70}")

        if results_df.empty:
            print("❌ No signals detected.\n")
            return {
                'total_signals': 0,
                'date_range': f"{self.d0_start} to {self.d0_end}",
                'scanner_type': 'LC_3D_GAP'
            }

        print(f"\n✅ Total Signals: {len(results_df)}")
        print(f"📅 Date Range: {results_df['Date'].min()} to {results_df['Date'].max()}")
        print(f"🎯 Unique Tickers: {results_df['Ticker'].nunique()}")
        print(f"\n📊 Top 20 Signals:")
        print(results_df[['Date', 'Ticker', 'Close', 'Day_0_Gap', 'Day_1_EMA30_Dist']].head(20).to_string(index=False))

        if save_results:
            output_dir = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_3d_gap"
            os.makedirs(output_dir, exist_ok=True)

            # Save results
            output_file = os.path.join(output_dir, "lc_3d_gap_results.csv")
            results_df.to_csv(output_file, index=False)
            print(f"\n💾 Results saved to: {output_file}")

        return {
            'total_signals': len(results_df),
            'date_range': f"{results_df['Date'].min()} to {results_df['Date'].max()}",
            'unique_tickers': results_df['Ticker'].nunique(),
            'scanner_type': 'LC_3D_GAP'
        }

    def run_ultra_fast_scan(self) -> pd.DataFrame:
        """
        Run complete ultra-fast 3-stage scan.

        Returns:
            DataFrame with detected signals
        """
        total_start_time = time.time()

        # Stage 1: Ultra-fast Market Universe Optimization
        stage1_start = time.time()
        optimized_universe = self.execute_stage1_ultra_fast()
        stage1_time = time.time() - stage1_start

        if not optimized_universe:
            print("\n❌ Stage 1 failed: No symbols qualified")
            return pd.DataFrame()

        # Stage 2: Ultra-fast Pattern Detection
        stage2_start = time.time()
        signals_df = self.execute_stage2_ultra_fast(optimized_universe)
        stage2_time = time.time() - stage2_start

        if signals_df.empty:
            print("\n❌ Stage 2 failed: No LC 3D Gap signals detected")
            return pd.DataFrame()

        # Stage 3: Results
        self.execute_stage3_results_ultra_fast(signals_df)

        total_elapsed = time.time() - total_start_time

        print(f"\n{'='*70}")
        print("🚀 ULTRA-FAST SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"⏱️  Total Time: {total_elapsed:.1f}s")
        print(f"🎯 Stage 1 Time: {stage1_time:.1f}s")
        print(f"🎯 Stage 2 Time: {stage2_time:.1f}s")
        print(f"✅ Final Signals: {len(signals_df)}")
        print(f"📈 Throughput: {len(optimized_universe)/total_elapsed:.0f} symbols/second")
        print(f"{'='*70}")

        return signals_df


def main():
    """
    Main execution for ultra-fast LC 3D Gap scanning
    """
    scanner = UltraFastRenataLC3DGapScanner()

    print("\n🚀 Starting ULTRA-FAST LC 3D Gap Scanner...")
    print("⚡ Maximum parallel processing + full market universe")

    # Execute the ultra-fast complete scan
    results = scanner.run_ultra_fast_scan()

    # Print all results
    if not results.empty:
        print(f"\n{'='*80}")
        print(f"ALL RESULTS ({len(results)} signals)")
        print(f"{'='*80}")
        for _, row in results.iterrows():
            print(f"{row['Ticker']}, {row['Date']}")

    return results


# ========== MAIN EXECUTION ==========
if __name__ == "__main__":
    main()
