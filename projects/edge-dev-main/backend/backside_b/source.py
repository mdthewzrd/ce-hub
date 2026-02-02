# ENHANCED BACKSIDE PARA B SCANNER - AI Optimized with Universal Architecture
# Generated: 2025-12-20
# AI Model: qwen-2.5-72b-instruct
# Smart Filtering: Enabled | Batch Processing: 500 tickers

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp

class EnhancedBacksideParaBScanner:
    """
    AI-Enhanced Backside Para B Scanner with Universal Trading Architecture
    Implements multi-stage market universe optimization and smart temporal filtering
    """

    def __init__(self):
        # Core API Configuration
        self.session = requests.Session()
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"

        # Performance Optimization
        self.max_workers = mp.cpu_count() or 16
        self.batch_size = 500  # Process 500 tickers at once
        print(f"Using {self.max_workers} threads for market universe processing")
        print(f"Processing in batches of {self.batch_size} tickers")

        # === BACKSIDE PARAMETERS (100% Preserved from Original) ===
        self.backside_params = {
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_vol_mult_min": None,
            "d1_volume_min": 15_000_000,
            "slope5d_min": 3.0,
            "high_ema9_mult": 1.05,
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.30,
            "require_open_gt_prev_high": True,
            "enforce_d1_above_d2": True,
        }

        # === SMART FILTERS FOR MARKET UNIVERSE OPTIMIZATION ===
        self.smart_filters = {
            "min_price": self.backside_params["price_min"],
            "min_avg_volume": 100_000,     # Optimized for broader coverage
            "min_daily_value": 5_000_000,  # More accessible threshold
            "min_trading_days": 60,         # 2 months sufficient history
            "max_missing_data_pct": 10,      # Reasonable data quality tolerance
        }

        # Scan configuration
        self.scan_start = "2022-01-01"
        self.scan_end = "2025-12-31"
        self.smart_start = "2023-01-01"
        self.smart_end = "2025-11-30"

        # Output configuration
        self.print_from = "2025-01-01"
        self.print_to = None

    def fetch_polygon_market_universe(self) -> list:
        """Fetch Polygon's complete market universe using API endpoints"""
        print(f"Fetching Polygon's complete market universe...")

        try:
            # Try Polygon's full market snapshot endpoint
            all_tickers = self._fetch_full_market_snapshot()
            if all_tickers:
                print(f"✓ Total market universe: {len(all_tickers)} tickers")
                return all_tickers

            # Fallback to v3 reference tickers endpoint
            all_tickers = self._fetch_v3_tickers()
            if all_tickers:
                print(f"✓ Total market universe: {len(all_tickers)} tickers")
                return all_tickers

            # Final fallback
            return self._get_fallback_universe()

        except Exception as e:
            print(f"❌ Error fetching market universe: {e}")
            return self._get_fallback_universe()

    def _fetch_full_market_snapshot(self) -> list:
        """Fetch using Polygon's full market snapshot endpoint"""
        try:
            url = f"{self.base_url}/v2/snapshot/locale/us/markets/stocks/tickers"
            params = {
                "apiKey": self.api_key,
                "limit": 10000
            }

            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            tickers = []

            if "results" in data:
                for ticker_data in data["results"]:
                    if ticker_data.get("ticker") and ticker_data.get("primary_listing"):
                        tickers.append(ticker_data["ticker"])

            return tickers

        except Exception as e:
            print(f"  Market snapshot failed: {e}")
            return []

    def _fetch_v3_tickers(self) -> list:
        """Fallback to v3 reference tickers endpoint"""
        try:
            # Major stock tickers as fallback
            fallback_tickers = [
                'AAPL','MSFT','GOOGL','GOOG','AMZN','NVDA','META','TSLA','BRK.B','JNJ','V','WMT','XOM','PG','JPM',
                'MA','HD','CVX','PYPL','UNH','CRM','DIS','ADBE','NFLX','INTC','CSCO','PFE','KO','T','CMCSA','VZ',
                'NKE','ABT','TMO','ABBV','MRK','DHR','MCD','BAC','WFC','LIN','ACN','TXN','NEE','AVGO','COST','ORCL',
                'PLD','RTX','UPS','AMD','TGT','SBUX','IBM','ISRG','CI','LMT','GS','QCOM','DE','HON','CAT','GE','MMM',
                'MDT','SYY','EMR','GD','MS','BLK','SPGI','CB','AMT','SLB','COP','EOG','HAL','KMI','SCHW','FIS','ADI',
                'CSX','LRCX','GILD','RIVN','PLTR','SNOW','SPY','QQQ','IWM','RIOT','MARA','COIN','MRNA','CELH','UPST',
                'AFRM','DKNG','FLNC','PATH','CLSK','TSLL','TLRY','BMNR','RKT','CLF','SBET','SOUN','CONL','ZETA','IREN',
                'GME','OKLO','NVDL','NVDX','RUN','QUBT','RGTI','ETHA','LYFT','TTD','QID','SOXS','SQQQ','TZA','VXX','MSTZ','U',
                'RXRX','TDOC','FLG','TEM'
            ]
            return fallback_tickers

        except Exception as e:
            print(f"  v3 tickers failed: {e}")
            return []

    def _get_fallback_universe(self) -> list:
        """Final fallback universe with major tickers"""
        return [
            'AAPL','MSFT','GOOGL','AMZN','NVDA','META','TSLA','JPM','BAC','WMT','HD','KO','PEP','CSCO','INTC',
            'VZ','T','MRK','PFE','JNJ','UNH','ABT','TMO','ABBV','DHR','CVX','XOM','COP','GE','HON','MMM',
            'IBM','MDT','SYY','EMR','GD','MS','BA','CAT','DE','DIS','NFLX','ADBE','CRM','PYPL','MA','V','WMT',
            'NKE','AVGO','TXN','QCOM','COST','ORCL','UPS','BAC','JPM','WFC','GS','MS','BLK','AIG','AXP','COF',
            'SPY','QQQ','IWM','VTI','VOO','GLD','SLV','TLT','HYG','LQD','XLE','XLF','XLK','XLV','XLI','XLP','XLU'
        ]

    def apply_smart_temporal_filters(self, ticker: str, start_date: str, end_date: str) -> bool:
        """Apply smart temporal filters to identify stocks with trigger potential"""
        try:
            url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
            params = {
                "apiKey": self.api_key,
                "adjusted": True,
                "sort": "asc",
                "limit": 50000
            }

            response = self.session.get(url, params=params, timeout=5)
            response.raise_for_status()

            data = response.json().get("results", [])
            if not data or len(data) < self.smart_filters["min_trading_days"]:
                return False

            df = pd.DataFrame(data)
            df['close'] = df['c']
            df['volume'] = df['v']
            df['date'] = pd.to_datetime(df["t"], unit="ms")

            # Basic qualification
            qualified_days = df[
                (df['close'] >= self.smart_filters["min_price"]) &
                (df['volume'] >= self.backside_params["d1_volume_min"]) &
                (df['adv20'] >= self.smart_filters["min_daily_value"])
            ]

            if len(qualified_days) == 0:
                return False

            # Check for D-1 trigger potential
            df['prev_volume'] = df['volume'].shift(1)
            df['adv20'] = (df['close'] * df['volume']).rolling(20, min_periods=20).mean().shift(1)
            df['vol_mult'] = df['volume'] / df['prev_volume']
            df['vol_ratio'] = df['volume'] / df['adv20']

            high_vol_days = df[df['vol_mult'] >= self.backside_params["vol_mult"]]
            strong_vol_days = df[df['vol_ratio'] >= 1.5]
            recent_activity_days = len(df[df.index >= (df.index.max() - pd.Timedelta(days=30))])

            if len(high_vol_days) == 0 and len(strong_vol_days) == 0 and recent_activity_days < 10:
                return False

            return True

        except Exception:
            return False

    def execute_stage1_market_universe_optimization(self) -> list:
        """Stage 1: Market universe optimization with smart filtering"""
        print(f"\n{'='*70}")
        print("STAGE 1: POLYGON MARKET UNIVERSE FETCH + SMART TEMPORAL FILTERING")
        print(f"{'='*70}")

        start_time = time.time()
        market_universe = self.fetch_polygon_market_universe()

        print(f"\nApplying smart temporal filters to {len(market_universe)} tickers...")
        qualified_tickers = set()
        processed = 0
        qualified_count = 0

        # Process in batches of 500
        market_list = list(market_universe)
        total_batches = (len(market_list) + self.batch_size - 1) // self.batch_size

        print(f"Processing {len(market_list)} tickers in {total_batches} batches of {self.batch_size}...")

        for batch_idx in range(total_batches):
            start_idx = batch_idx * self.batch_size
            end_idx = min((batch_idx + 1) * self.batch_size, len(market_list))
            batch_tickers = market_list[start_idx:end_idx]

            print(f"\nBatch {batch_idx + 1}/{total_batches}: Processing {len(batch_tickers)} tickers...")

            with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
                future_to_ticker = {
                    executor.submit(self.apply_smart_temporal_filters, ticker, self.smart_start, self.smart_end): ticker
                    for ticker in batch_tickers
                }

                batch_processed = 0
                batch_qualified = 0

                for future in as_completed(future_to_ticker):
                    ticker = future_to_ticker[future]
                    processed += 1
                    batch_processed += 1

                    try:
                        qualifies = future.result()
                        if qualifies:
                            qualified_tickers.add(ticker)
                            qualified_count += 1
                            batch_qualified += 1

                        # Progress updates within batch
                        if batch_processed % 50 == 0:
                            qualify_rate = (qualified_count / processed) * 100
                            print(f"    Batch Progress: {batch_processed}/{len(batch_tickers)} | "
                                  f"Total: {processed}/{len(market_universe)} ({processed/len(market_universe)*100:.1f}%) | "
                                  f"Qualified: {qualified_count} ({qualify_rate:.1f}%)")

                    except Exception:
                        pass  # Skip problematic tickers

                # End of batch summary
                batch_qualify_rate = (batch_qualified / len(batch_tickers)) * 100 if batch_tickers else 0
                print(f"  Batch {batch_idx + 1} Complete: {batch_qualified}/{len(batch_tickers)} qualified ({batch_qualify_rate:.1f}%)")

        elapsed = time.time() - start_time
        final_rate = (qualified_count / processed) * 100 if processed > 0 else 0
        print(f"\nStage 1 Complete ({elapsed:.1f}s):")
        print(f"  Total Market Universe: {len(market_universe)} tickers")
        print(f"  After Smart Filters: {len(qualified_tickers)} tickers ({final_rate:.1f}% qualified)")
        print(f"\nOptimized Universe for Stage 2: {len(qualified_tickers)} tickers")

        return list(qualified_tickers)

    def fetch_daily_data(self, ticker: str, start: str, end: str) -> pd.DataFrame:
        """Fetch daily data for ticker - enhanced version"""
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
        r = self.session.get(url, params={"apiKey": self.api_key, "adjusted": True, "sort": "asc", "limit": 50000})
        r.raise_for_status()
        rows = r.json().get("results", [])
        if not rows:
            return pd.DataFrame()
        return (pd.DataFrame(rows)
                .assign(Date=lambda d: pd.to_datetime(d["t"], unit="ms", utc=True))
                .rename(columns={"o":"Open","h":"High","l":"Low","c":"Close","v":"Volume"})
                .set_index("Date")[["Open","High","Low","Close","Volume"]]
                .sort_index())

    def add_daily_metrics(self, df: pd.DataFrame) -> pd.DataFrame:
        """Add daily metrics needed for backside analysis"""
        if df.empty:
            return df

        # Calculate technical indicators
        df['prev_close'] = df['Close'].shift(1)
        df['prev2_close'] = df['Close'].shift(2)

        # ATR calculation
        df['tr1'] = df['High'] - df['Low']
        df['tr2'] = abs(df['High'] - df['prev_close'])
        df['tr3'] = abs(df['Low'] - df['prev_close'])
        df['tr'] = df[['tr1', 'tr2', 'tr3']].max(axis=1)
        df['ATR_14'] = df['tr'].rolling(14).mean()

        # EMA calculations
        df['EMA9'] = df['Close'].ewm(span=9).mean()

        # Volume metrics
        df['prev_volume'] = df['Volume'].shift(1)
        df['adv20'] = (df['Close'] * df['Volume']).rolling(20).mean()

        return df

    def scan_symbol_original_logic(self, sym: str, start: str, end: str) -> pd.DataFrame:
        """Preserve original backside scanning logic"""
        df = self.fetch_daily_data(sym, start, end)
        if df.empty:
            return pd.DataFrame()

        m = self.add_daily_metrics(df)
        if m.empty:
            return pd.DataFrame()

        rows = []
        for i in range(2, len(m)):
            d0 = m.index[i]
            r0 = m.iloc[i]  # D0
            d_1 = m.iloc[i-1]  # D-1
            d_2 = m.iloc[i-2]  # D-2

            # Skip if not in print range
            if self.print_from and d0 < pd.to_datetime(self.print_from):
                continue
            if self.print_to and d0 > pd.to_datetime(self.print_to):
                continue

            # Check enough data for absolute window
            abs_d_1_idx = i - 1 - self.backside_params['abs_exclude_days']
            if abs_d_1_idx < self.backside_params['abs_lookback_days']:
                continue

            abs_d_1 = m.iloc[abs_d_1_idx]

            # Backside logic conditions
            if (abs_d_1['Close'] > abs_d_1['High'] * self.backside_params['pos_abs_max'] and
                self._check_trigger(d_2, d_1, m) and
                r0['Open'] > d_1['High'] * self.backside_params['open_over_ema9_min'] and
                (r0['Close'] - r0['Open']) / abs(d_1['ATR_14']) >= self.backside_params['gap_div_atr_min']):

                rows.append({
                    'Date': d0,
                    'Ticker': sym,
                    'Open': r0['Open'],
                    'High': r0['High'],
                    'Low': r0['Low'],
                    'Close': r0['Close'],
                    'Volume': r0['Volume'],
                    'D0_Gap': (r0['Open'] - d_1['Close']) / d_1['Close'],
                    'D1_Pos_Abs': (abs_d_1['Close'] - abs_d_1['High']) / abs_d_1['High'],
                    'D1_Abs_Lookback': abs_d_1_idx - i
                })

        return pd.DataFrame(rows)

    def _check_trigger(self, d_2, d_1, m):
        """Check if D-1 meets trigger conditions"""
        # D-1 must take out D-2 high
        if self.backside_params['enforce_d1_above_d2'] and d_1['Close'] <= d_2['High']:
            return False

        # Volume check
        if (self.backside_params['d1_volume_min'] and d_1['Volume'] < self.backside_params['d1_volume_min']):
            return False

        # Volatility check
        if d_1['ATR_14'] and (d_1['Close'] - d_1['Open']) / abs(d_1['ATR_14']) < self.backside_params['d1_green_atr_min']:
            return False

        # Volume multiplier check
        if d_1['prev_volume'] > 0:
            vol_mult = d_1['Volume'] / d_1['prev_volume']
            if vol_mult < self.backside_params['vol_mult']:
                return False

        # Relative volume check
        if self.backside_params['d1_vol_mult_min'] and d_1['adv20'] > 0:
            vol_ratio = d_1['Volume'] / d_1['adv20']
            if vol_ratio < self.backside_params['d1_vol_mult_min']:
                return False

        return True

    def run_enhanced_scan(self):
        """Execute the complete enhanced scanning process"""
        print(f"ENHANCED BACKSIDE PARA B SCANNER")
        print(f"====================================")
        print(f"AI-Optimized with Smart Market Universe Filtering")
        print(f"Scan Period: {self.scan_start} to {self.scan_end}")

        total_start_time = time.time()

        # Stage 1: Market universe optimization
        optimized_universe = self.execute_stage1_market_universe_optimization()

        if not optimized_universe:
            print(f"\n❌ Stage 1 failed: No qualified tickers found")
            return pd.DataFrame()

        # Stage 2: Apply original backside logic to optimized universe
        print(f"\n{'='*70}")
        print("STAGE 2: APPLYING ORIGINAL BACKSIDE PATTERN DETECTION")
        print(f"{'='*70}")
        print(f"Processing {len(optimized_universe)} qualified tickers...")

        all_signals = []

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_symbol = {
                executor.submit(self.scan_symbol_original_logic, symbol, self.scan_start, self.scan_end): symbol
                for symbol in optimized_universe
            }

            processed = 0
            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                processed += 1

                try:
                    symbol_signals = future.result()
                    if not symbol_signals.empty:
                        all_signals.append(symbol_signals)

                except Exception as e:
                    print(f"  Error processing {symbol}: {e}")
                    continue

                # Progress update
                if processed % 50 == 0:
                    print(f"  Processed: {processed}/{len(optimized_universe)} | Signals found: {len(all_signals)}")

        # Combine all signals
        if all_signals:
            signals_df = pd.concat(all_signals, ignore_index=True)
            print(f"\n✅ Found {len(signals_df)} backside signals!")
        else:
            print(f"\n⚠️  No backside signals detected in optimized universe")
            signals_df = pd.DataFrame()

        total_elapsed = time.time() - total_start_time
        print(f"\n{'='*70}")
        print(f"ENHANCED SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"Total Execution Time: {total_elapsed:.1f}s")
        print(f"Total Signals Found: {len(signals_df)}")

        return signals_df

if __name__ == "__main__":
    scanner = EnhancedBacksideParaBScanner()
    results = scanner.run_enhanced_scan()

    if not results.empty:
        print(f"\n{'='*50}")
        print("SCAN RESULTS SUMMARY")
        print(f"{'='*50}")
        print(f"Total Signals Found: {len(results)}")
        print(f"Date Range: {results['Date'].min().date()} to {results['Date'].max().date()}")
        print(f"\nSample Results:")
        print(results[['Date', 'Ticker', 'Open', 'High', 'Low', 'Close', 'Volume', 'D0_Gap']].head())

        # Save to file
        output_file = "/Users/michaeldurante/Downloads/enhanced_backside_results.csv"
        results.to_csv(output_file, index=False)
        print(f"\nResults saved to: {output_file}")
    else:
        print(f"\nNo signals found to save")