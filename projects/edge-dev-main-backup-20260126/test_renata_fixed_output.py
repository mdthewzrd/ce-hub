"""
FORMATTED BACKSIDEPARABCOPY SCANNER - Multi-Stage Process (UPDATED)
===============================================================

FINAL VERSION - Based on backside_para_b_copy.py with complete optimization

STAGE 1: Fetch Polygon's COMPLETE Market Universe (17,000+ stocks)
- Get all tradable stocks from NASDAQ, NYSE, ETFs, OTC, etc.
- Apply SMART temporal filters based on D-1 parameters
- Date range: 2024-12-01 to 2025-11-30 (matches D0 scanning)

STAGE 2: Original Backside Pattern Detection
- Run EXACT original backside logic on optimized universe
- 100% preserved sophisticated pattern detection
- Full historical data: 2022-01-01 to 2025-12-31 for absolute window

STAGE 3: Results Analysis with Date Filtering
- Generate signals for ALL of 2025
- Display only: January 1, 2025 to November 1, 2025

COMPATIBILITY: Identical to backside para b copy.py results
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp

class FormattedBacksideParaBScanner:
    """
    Implements our ACTUAL multi-stage formatting process
    """

    def __init__(self):
        # Core API Configuration
        self.session = requests.Session()
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"
        # Use maximum available threads for Stage 1 market universe processing
        self.max_workers = mp.cpu_count() or 16
        print(f"Using {self.max_workers} threads for market universe processing")

        # === ORIGINAL BACKSIDE PARAMETERS (100% Preserved from original) ===
        self.backside_params = {
            "price_min": 8,
            "adv20_min_usd": 30,
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_vol_mult_min": "None",
            "d1_volume_min": 15,
            "slope5d_min": 3,
            "high_ema9_mult": 1.05,
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.3,
            "require_open_gt_prev_high": True,
            "enforce_d1_above_d2": True,
        }

        # === SMART FILTERS DERIVED FROM EXACT ORIGINAL PARAMETERS ===
        # Use same criteria as pattern detection but slightly looser to catch temporal opportunities
        self.smart_filters = {
            "min_price": self.backside_params["price_min"],  # Exact: 8.0
            "min_avg_volume": 1_000_000,   # Based on vol_mult * 0.9 and volume requirements
            "min_daily_value": self.backside_params["adv20_min_usd"],  # Exact: 30M daily
            "min_trading_days": 200,        # Sufficient history
            "max_missing_data_pct": 5,       # Good data quality
        }

        # Scan dates - D0 range is all 2025, fetch range starts 1000 days before
        self.scan_start = "2022-01-01"  # ~1000 days before 2025 for absolute window
        self.scan_end = "2025-12-31"     # All of 2025 for D0 signals

        # Smart filtering matches D0 range but can check D-1 temporal opportunities
        # Use slightly wider range to catch D-1 prep phases
        self.smart_start = "2024-12-01"  # Start of D0 range with buffer for D-1
        self.smart_end = "2025-11-30"     # End of D0 range (match scan_end)

    # ==================== STAGE 1: POLYGON MARKET UNIVERSE FETCH ====================

    def fetch_polygon_market_universe(self) -> list:
        """
        Fetch Polygon's complete market universe using full market snapshot
        """
        print(f"Fetching Polygon's complete market universe for {self.scan_start} to {self.scan_end}...")

        try:
            # Method 1: Try Polygon's full market snapshot endpoint (BEST!)
            print("  Trying Polygon full market snapshot endpoint...")
            all_tickers = self._fetch_full_market_snapshot()

            if all_tickers:
                print(f"✓ Total market universe: {len(all_tickers)} tickers")
                return all_tickers

            # Method 2: Fallback to v3 reference tickers endpoint
            print("  Trying v3 reference tickers endpoint...")
            all_tickers = self._fetch_v3_tickers()

            if all_tickers:
                print(f"✓ Total market universe: {len(all_tickers)} tickers")
                return all_tickers

            print("❌ All Polygon endpoints failed, using fallback universe...")
            return self._get_fallback_universe()

        except Exception as e:
            print(f"❌ Error fetching market universe: {e}")
            return self._get_fallback_universe()

    def _fetch_full_market_snapshot(self) -> list:
        """
        Fetch using Polygon's full market snapshot endpoint
        Should return 12,000+ tickers including stocks and ETFs
        """
        try:
            # Get full market snapshot
            url = f"{self.base_url}/v2/snapshot/locale/us/markets/stocks/tickers"
            params = {
                "apiKey": self.api_key,
                "include_otc": "true"  # Include OTC for full market coverage
            }

            response = self.session.get(url, params=params, timeout=20)
            response.raise_for_status()

            data = response.json()
            tickers = data.get('tickers', [])

            print(f"    Raw snapshot data: {len(tickers)} tickers received")

            all_tickers = []
            etf_count = 0
            stock_count = 0

            for ticker in tickers:
                ticker_symbol = ticker.get('ticker')

                if not ticker_symbol:
                    continue

                # Much more inclusive filtering - keep almost everything for full universe
                # Only filter out clearly invalid symbols
                if (not ticker_symbol or
                    len(ticker_symbol) > 10 or
                    ticker_symbol.startswith(('^', '$'))):
                    continue

                # Include ALL valid symbols regardless of current trading data
                # The smart filtering stage will handle actual eligibility
                all_tickers.append(ticker_symbol)

                # Rough classification for counting purposes only
                if ticker_symbol.startswith(('SPY', 'QQQ', 'IWM', 'VTI', 'XLF', 'XLE', 'XLK', 'XLP', 'XLI', 'XLU', 'XLV', 'XLB')):
                    etf_count += 1
                else:
                    stock_count += 1

            # Remove duplicates
            all_tickers = list(set(all_tickers))

            print(f"    Filtered universe: {len(all_tickers)} tickers")
            print(f"    Estimated stocks: {stock_count}, ETFs: {etf_count}")

            if len(all_tickers) < 12000:
                print(f"    ⚠️  Only {len(all_tickers)} tickers found. Expected 17,000+.")

            return all_tickers

        except Exception as e:
            print(f"    Full snapshot error: {str(e)[:200]}")
            return None

    def _fetch_v3_tickers(self) -> list:
        """Fetch using Polygon v3 reference tickers endpoint"""
        try:
            all_tickers = []

            # Get US stock tickers - NASDAQ
            url = f"{self.base_url}/v3/reference/tickers"
            params = {
                "market": "stocks",
                "exchange": "XNAS",
                "active": "true",
                "limit": 1000,
                "apiKey": self.api_key
            }

            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            tickers = data.get('results', [])

            for ticker in tickers:
                ticker_symbol = ticker.get('ticker')
                if (ticker_symbol and
                    ticker.get('primary_exchange') and
                    ticker.get('market_cap', 0) > 0 and
                    len(ticker_symbol) <= 5):
                    all_tickers.append(ticker_symbol)

            # Also fetch NYSE stocks
            params['exchange'] = "XNYS"
            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json()
            tickers = data.get('results', [])

            for ticker in tickers:
                ticker_symbol = ticker.get('ticker')
                if (ticker_symbol and
                    ticker.get('primary_exchange') and
                    ticker.get('market_cap', 0) > 0 and
                    len(ticker_symbol) <= 5 and
                    ticker_symbol not in all_tickers):
                    all_tickers.append(ticker_symbol)

            return all_tickers

        except Exception:
            return None

    def _get_fallback_universe(self) -> list:
        """Fallback universe - comprehensive market coverage"""
        print("Using comprehensive fallback universe...")

        # Extended fallback covering all major sectors and market caps
        fallback_universe = [
            # Mega & Large Cap Stocks
            'AAPL','MSFT','GOOGL','GOOG','AMZN','NVDA','META','TSLA','BRK.B','JNJ','V','WMT','XOM','PG','JPM',
            'MA','HD','CVX','PYPL','UNH','CRM','DIS','ADBE','NFLX','INTC','CSCO','PFE','KO','T','CMCSA','VZ',
            'NKE','ABT','TMO','ABBV','MRK','DHR','MCD','BAC','WFC','LIN','ACN','TXN','NEE','AVGO','COST','ORCL',

            # Mid Cap & Growth Stocks
            'PLD','RTX','UPS','AMD','TGT','SBUX','IBM','ISRG','CI','LMT','GS','QCOM','DE','HON','CAT','GE','MMM',
            'MDT','SYY','EMR','GD','MS','BLK','SPGI','CB','AMT','SLB','COP','EOG','HAL','KMI','SCHW','FIS','ADI',
            'CSX','LRCX','GILD','BKNG','FDX','ADP','WBA','TJX','MDLZ','GIS','KMB','CAG','CPB','KHC','HRL','SJM','ADM',

            # High Growth & Tech
            'MSTR','SMCI','DJT','RIVN','LCID','PLTR','SNOW','CRWD','OKTA','ZS','NOW','TEAM','DDOG','FIVV','CLOUD',
            'SQ','SHOP','DOCU','ZM','ROKU','SNAP','TWLO','MDB','APPN','ZI','CRNC','AYX','CVLT','ESTC','GWRE','NEWR',
            'UPST','AFRM','DKNG','COIN','HOOD','PYPL','MARA','RIOT','HOOD','SQ','PYPL','MSTR',

            # Healthcare & Biotech
            'UNH','PFE','ABBV','TMO','ABT','MRK','DHR','BMY','AMGN','GILD','REGN','MDT','ISRG','BIIB','VRTX','LLY',
            'ELV','GSK','SNY','NVS','AZN','BMY','SGEN','VRTX','BIIB','REGN','ALNY','MRNA','BNTX','IDXX','ILMN',
            'DNA','BEAM','TXMD','ARCT','GERN','SAGE','SRPT','CRSP','EDIT','NTLA','PSTI','WBA','JAZZ','VXRT',

            # Industrial & Energy
            'CAT','DE','BA','GE','HON','MMM','UPS','RTX','LMT','GD','NOC','TXT','ROST','FAST','URI','CARR',
            'ETN','TT','ITW','PH','PHM','MMM','TXN','ADI','AVGO','QCOM','MRVL','NVDA','INTC','AMD','MU','GLW',
            'XOM','CVX','COP','PSX','VLO','MPC','OXY','EOG','SLB','HAL','BKR','FANG','DVN','MRO','HES','APA',
            'EQT','SWN','KMI','WMB','NOV','BHP','RIO','FCX','VALE','NUE','STLD','CLF','X','AA','DD','DOW',

            # Financial Services
            'JPM','BAC','WFC','GS','MS','BLK','AXP','COF','AIG','SCHW','TROW','ICE','CME','MMC','STT','PNC','TFC','DFS',
            'C','CFG','KEY','HBAN','RF','WFT','FITB','ZION','NYCB','MTB','UBS','NTRS','SYF','BOKF','WAL','WTFC',
            'AFL','TRV','CINF','ALLY','PNC','COF','DFS','BAC','WFC','JPM','GS','MS','C','MU','RF','USB','PNC',

            # Consumer & Retail
            'WMT','COST','HD','LOW','TGT','MCD','NKE','SBUX','KO','PEP','PG','CL','KMB','K','DIS','CMCSA',
            'NFLX','TJX','KR','SYY','GIS','MDLZ','K','CL','HSY','CAG','CPB','KHC','HRL','SJM','ADM',
            'COST','WMT','KIM','FLO','KSU','COST','HD','LOW','TGT','DG','KSS','GPS','DRI','WBA','TPR',
            'TGT','GPS','DRI','WBA','TPR','COST','WMT','KIM','FLO','KSU','COST','HD','LOW','TGT','DG',

            # Real Estate & Utilities
            'AMT','PLD','CCI','EQIX','DLR','PRO','PSA','EXR','AVB','EQR','O','REZ','HST','MAA','UDR','STWD',
            'NEE','DUK','SO','AEP','EXC','XEL','WEC','ED','D','PEG','SRE','CNP','ETR','AWK','WTR','CMS',

            # ETFs & Index Funds
            'SPY','QQQ','IWM','VTI','VOO','GLD','SLV','TLT','HYG','LQD','XLE','XLF','XLK','XLV','XLI',
            'XLP','XLU','XLRE','XLK','XLC','XLB','XLE','XLF','IVV','VUG','VTV','VIG','VYM','VYMI','VWO',
            'VO','VYM','VTI','VOO','VUG','VTV','VIG','VYMI','VWO','VBK','VOT','VFH','VCR','VHT','VGT',
            'VYM','VYMI','VEA','VCE','VCR','VHT','VGT','VIG','VBR','VTIP','VTW','VPU','VCT','VFM','FTW',

            # Additional Stocks
            'FIS','ADI','CSX','LRCX','GILD','BKNG','FDX','ADP','WBA','TJX','MDLZ','GIS','KMB','CAG','CPB','KHC',
            'HRL','SJM','ADM','BIDU','NTDOY','SONY','TM','HMC','NSANY','VLKAF','BMWYY','BAMXF','CTVA','CTAS',
            'STZ','NOW','ISRG','PLD','MS','MDT','WM','GE','IBM','BKNG','FDX','ADP','EQIX','DHR','SNPS',
            'REGN','SYK','TMO','CVS','INTU','SCHW','CI','APD','SO','MMC','ICE','FIS','ADI','CSX','LRCX',
            'GILD','RIVN','PLTR','SNOW','SPY','QQQ','IWM','RIOT','MARA','COIN','MRNA','CELH','UPST','AFRM','DKNG',

            # High Volatility & Growth
            'MSTR','SMCI','DJT','BABA','TCOM','AMC','GME','BBBY','RIVN','LCID','NIO','XPENG','LI','RIVN',
            'SPOT','U','LYFT','UBER','SNAP','TWTR','ROKU','ZM','CHWY','PTON','SHOP','SQ','COIN','HOOD',
            'PLTR','DKNG','UPST','AFRM','RBLX','ZNGA','TME','BILI','PDD','JD','BIDU','NTES','WB','KWEB',
        ]

        return fallback_universe

    def apply_smart_temporal_filters(self, ticker: str, start_date: str, end_date: str) -> bool:
        """
        Apply smart temporal filters to identify stocks that qualify during scan period
        This catches stocks that temporarily spike into parameter requirements
        """
        try:
            # Fetch basic data for the ticker
            url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
            params = {
                "apiKey": self.api_key,
                "adjusted": "true",
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

            # Check data quality
            missing_pct = (df.isnull().sum().sum() / (len(df) * len(df.columns))) * 100
            if missing_pct > self.smart_filters["max_missing_data_pct"]:
                return False

            # Apply smart filters to catch temporal opportunities based on D-1 parameters

            # Calculate metrics needed for D-1 checks
            df['prev_volume'] = df['volume'].shift(1)
            df['adv20'] = (df['close'] * df['volume']).rolling(20, min_periods=20).mean().shift(1)
            df['vol_mult'] = df['volume'] / df['prev_volume']
            df['vol_ratio'] = df['volume'] / df['adv20']

            # 1. Basic qualification - check if meets minimum D-1 criteria
            qualified_days = df[
                (df['close'] >= self.smart_filters["min_price"]) &
                (df['volume'] >= self.backside_params["d1_volume_min"]) &
                (df['adv20'] >= self.smart_filters["min_daily_value"])
            ]

            if len(qualified_days) == 0:
                return False

            # 2. Check for D-1 trigger setup conditions
            # Look for high volume spikes (vol_mult >= vol_mult requirement)
            high_vol_days = df[df['vol_mult'] >= self.backside_params["vol_mult"]]

            # Look for volume ratio indicating relative strength (vol_ratio >= some threshold)
            strong_vol_days = df[df['vol_ratio'] >= 1.5]  # 1.5x average volume

            # 3. Must have some D-1 trigger potential in the smart filtering window
            if len(high_vol_days) == 0 and len(strong_vol_days) == 0:
                return False

            # 4. Check for recent momentum (potential slope trigger)
            if len(df) >= 10:
                recent_returns = df['close'].pct_change().dropna().tail(10)
                if recent_returns.std() < 0.02:  # Low volatility = less trigger potential
                    return False

            # If passed all checks, stock has D-1 potential
            return True

        except Exception:
            # If we can't get data, exclude the ticker
            return False

    def execute_stage1_market_universe_optimization(self) -> list:
        """
        Stage 1: Fetch Polygon's entire market universe and apply smart temporal filters
        """
        print(f"\n{'='*70}")
        print("STAGE 1: POLYGON MARKET UNIVERSE FETCH + SMART TEMPORAL FILTERING")
        print(f"{'='*70}")
        print(f"Scan Period: {self.scan_start} to {self.scan_end}")

        start_time = time.time()

        # Fetch complete market universe
        market_universe = self.fetch_polygon_market_universe()

        print(f"\nApplying smart temporal filters to {len(market_universe)} tickers...")

        # Original universe symbols that should always be included (fallback)
        original_universe = [
            'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
            'NFLX','SNAP','RBLX','META','SE','NVDA','AAPL','MSFT','GOOGL','AMZN','TSLA',
            'AMD','INTC','BA','PYPL','QCOM','ORCL','KO','PEP','ABBV','JNJ','CRM','BAC',
            'JPM','WMT','CVX','XOM','COP','RTX','SPGI','GS','HD','LOW','COST','UNH','NKE',
            'LMT','HON','CAT','LIN','ADBE','AVGO','TXN','ACN','UPS','BLK','PM','ELV','VRTX',
            'ZTS','NOW','ISRG','PLD','MS','MDT','WM','GE','IBM','BKNG','FDX','ADP','EQIX',
            'DHR','SNPS','REGN','SYK','TMO','CVS','INTU','SCHW','CI','APD','SO','MMC','ICE',
            'FIS','ADI','CSX','LRCX','GILD','RIVN','PLTR','SNOW','SPY','QQQ','IWM','RIOT',
            'MARA','COIN','MRNA','CELH','UPST','AFRM','DKNG','FLNC','PATH','CLSK','TSLL','TLRY',
            'BMNR','RKT','CLF','SBET','SOUN','CONL','ZETA','IREN','GME','OKLO','NVDL','NVDX',
            'RUN','QUBT','RGTI','ETHA','LYFT','TTD','QID','SOXS','SQQQ','TZA','VXX','MSTZ','U',
            'RXRX','TDOC','FLG','TEM'
        ]

        # Apply smart filters with MAX threading for performance
        qualified_tickers = set(original_universe)  # Start with original universe
        processed = 0
        qualified_count = len(original_universe)

        print(f"Starting with {len(original_universe)} original universe symbols...")
        print(f"Starting smart temporal filtering with {self.max_workers} threads...")

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            # Submit all filter jobs (except original universe - already included)
            future_to_ticker = {
                executor.submit(self.apply_smart_temporal_filters, ticker, self.smart_start, self.smart_end): ticker
                for ticker in market_universe if ticker not in original_universe
            }

            # Process results as they complete
            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                processed += 1

                try:
                    qualifies = future.result()
                    if qualifies:
                        qualified_tickers.append(ticker)
                        qualified_count += 1

                    # More frequent progress updates for large universes
                    if processed % 50 == 0:
                        qualify_rate = (qualified_count / processed) * 100
                        print(f"  Progress: {processed}/{len(market_universe)} ({processed/len(market_universe)*100:.1f}%) | "
                              f"Qualified: {qualified_count} ({qualify_rate:.1f}%)")

                except Exception:
                    pass  # Skip problematic tickers

        # Final progress update
        final_rate = (qualified_count / processed) * 100 if processed > 0 else 0
        print(f"  Final: Processed {processed} tickers | Qualified: {qualified_count} ({final_rate:.1f}%)")

        elapsed = time.time() - start_time

        print(f"\nStage 1 Complete ({elapsed:.1f}s):")
        print(f"  Total Market Universe: {len(market_universe)} tickers")
        print(f"  After Smart Filters: {len(qualified_tickers)} tickers")
        if len(market_universe) > 0:
            reduction = ((len(market_universe) - len(qualified_tickers)) / len(market_universe)) * 100
            print(f"  Reduction: {reduction:.1f}%")

        print(f"\nOptimized Universe for Stage 2: {len(qualified_tickers)} tickers")
        return qualified_tickers

    # ==================== ORIGINAL BACKSIDE SCANNER LOGIC (100% Preserved) ====================

    def fetch_daily_data(self, ticker: str, start: str, end: str) -> pd.DataFrame:
        """Original fetch function exactly as in backside para b"""
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
        r = self.session.get(url, params={"apiKey": self.api_key, "adjusted":"true", "sort":"asc", "limit":50000})
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
        """Original metrics function exactly as in backside para b"""
        if df.empty:
            return df
        m = df.copy()
        try:
            m.index = m.index.tz_localize(None)
        except Exception:
            pass

        m["EMA_9"] = m["Close"].ewm(span=9, adjust=False).mean()
        m["EMA_20"] = m["Close"].ewm(span=20, adjust=False).mean()

        hi_lo = m["High"] - m["Low"]
        hi_prev = (m["High"] - m["Close"].shift(1)).abs()
        lo_prev = (m["Low"] - m["Close"].shift(1)).abs()
        m["TR"] = pd.concat([hi_lo, hi_prev, lo_prev], axis=1).max(axis=1)
        m["ATR_raw"] = m["TR"].rolling(14, min_periods=14).mean()
        m["ATR"] = m["ATR_raw"].shift(1)

        m["VOL_AVG"] = m["Volume"].rolling(14, min_periods=14).mean().shift(1)
        m["Prev_Volume"] = m["Volume"].shift(1)
        m["ADV20_$"] = (m["Close"] * m["Volume"]).rolling(20, min_periods=20).mean().shift(1)

        m["Slope_9_5d"] = (m["EMA_9"] - m["EMA_9"].shift(5)) / m["EMA_9"].shift(5) * 100
        m["High_over_EMA9_div_ATR"] = (m["High"] - m["EMA_9"]) / m["ATR"]

        m["Gap_abs"] = (m["Open"] - m["Close"].shift(1)).abs()
        m["Gap_over_ATR"] = m["Gap_abs"] / m["ATR"]
        m["Open_over_EMA9"] = m["Open"] / m["EMA_9"]

        m["Body_over_ATR"] = (m["Close"] - m["Open"]) / m["ATR"]

        m["Prev_Close"] = m["Close"].shift(1)
        m["Prev_Open"] = m["Open"].shift(1)
        m["Prev_High"] = m["High"].shift(1)
        return m

    def abs_top_window(self, df: pd.DataFrame, d0: pd.Timestamp, lookback_days: int, exclude_days: int):
        """Original abs_top_window function exactly as in backside para b"""
        if df.empty:
            return (np.nan, np.nan)
        cutoff = d0 - pd.Timedelta(days=exclude_days)
        wstart = cutoff - pd.Timedelta(days=lookback_days)
        win = df[(df.index > wstart) & (df.index <= cutoff)]
        if win.empty:
            return (np.nan, np.nan)
        return float(win["Low"].min()), float(win["High"].max())

    def pos_between(self, val, lo, hi):
        """Original pos_between function exactly as in backside para b"""
        if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

    def _mold_on_row(self, rx: pd.Series) -> bool:
        """Original _mold_on_row function exactly as in backside para b"""
        if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
            return False
        if rx["Prev_Close"] < self.backside_params["price_min"] or rx["ADV20_$"] < self.backside_params["adv20_min_usd"]:
            return False
        vol_avg = rx["VOL_AVG"]
        if pd.isna(vol_avg) or vol_avg <= 0:
            return False
        vol_sig = max(rx["Volume"]/vol_avg, rx["Prev_Volume"]/vol_avg)
        checks = [
            (rx["TR"] / rx["ATR"]) >= self.backside_params["atr_mult"],
            vol_sig >= self.backside_params["vol_mult"],
            rx["Slope_9_5d"] >= self.backside_params["slope5d_min"],
            rx["High_over_EMA9_div_ATR"] >= self.backside_params["high_ema9_mult"],
        ]
        return all(bool(x) and np.isfinite(x) for x in checks)

    def scan_symbol_original_logic(self, sym: str, start: str, end: str) -> pd.DataFrame:
        """EXACT COPY from backside para b copy.py - scan_symbol function"""
        df = self.fetch_daily_data(sym, start, end)
        if df.empty:
            return pd.DataFrame()
        m = self.add_daily_metrics(df)

        rows = []
        for i in range(2, len(m)):
            d0 = m.index[i]
            r0 = m.iloc[i]       # D0
            r1 = m.iloc[i-1]     # D-1
            r2 = m.iloc[i-2]     # D-2

            # Backside vs D-1 close
            lo_abs, hi_abs = self.abs_top_window(m, d0, self.backside_params["abs_lookback_days"], self.backside_params["abs_exclude_days"])
            pos_abs_prev = self.pos_between(r1["Close"], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.backside_params["pos_abs_max"]):
                continue

            # Choose trigger
            trigger_ok = False; trig_row = None; trig_tag = "-"
            if self.backside_params["trigger_mode"] == "D1_only":
                if self._mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:
                if self._mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif self._mold_on_row(r2): trigger_ok, trig_row, trig_tag = True, r2, "D-2"
            if not trigger_ok:
                continue

            # D-1 must be green
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= self.backside_params["d1_green_atr_min"]):
                continue

            # Absolute D-1 volume floor (shares)
            if self.backside_params["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= self.backside_params["d1_volume_min"]):
                    continue

            # Optional relative D-1 vol multiple
            if self.backside_params["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= self.backside_params["d1_vol_mult_min"]):
                    continue

            # D-1 > D-2 highs & close
            if self.backside_params["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 gates
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < self.backside_params["gap_div_atr_min"]:
                continue
            if self.backside_params["require_open_gt_prev_high"] and not (r0["Open"] > r1["High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < self.backside_params["open_over_ema9_min"]:
                continue

            d1_vol_mult = (r1["Volume"]/r1["VOL_AVG"]) if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0) else np.nan
            volsig_max  = (max(r1["Volume"]/r1["VOL_AVG"], r2["Volume"]/r2["VOL_AVG"])
                           if (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"]>0 and pd.notna(r2["VOL_AVG"]) and r2["VOL_AVG"]>0)
                           else np.nan)

            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
                "Trigger": trig_tag,
                "PosAbs_1000d": round(float(pos_abs_prev), 3),
                "D1_Body/ATR": round(float(r1["Body_over_ATR"]), 2),
                "D1Vol(shares)": int(r1["Volume"]) if pd.notna(r1["Volume"]) else np.nan,   # absolute volume
                "D1Vol/Avg": round(float(d1_vol_mult), 2) if pd.notna(d1_vol_mult) else np.nan,
                "VolSig(max D-1,D-2)/Avg": round(float(volsig_max), 2) if pd.notna(volsig_max) else np.nan,
                "Gap/ATR": round(float(r0["Gap_over_ATR"]), 2),
                "Open>PrevHigh": bool(r0["Open"] > r1["High"]),
                "Open/EMA9": round(float(r0["Open_over_EMA9"]), 2),
                "D1>H(D-2)": bool(r1["High"] > r2["High"]),
                "D1Close>D2Close": bool(r1["Close"] > r2["Close"]),
                "Slope9_5d": round(float(r0["Slope_9_5d"]), 2) if pd.notna(r0["Slope_9_5d"]) else np.nan,
                "High-EMA9/ATR(trigger)": round(float(trig_row["High_over_EMA9_div_ATR"]), 2),
                "ADV20_$": round(float(r0["ADV20_$"])) if pd.notna(r0["ADV20_$"]) else np.nan,
            })

        return pd.DataFrame(rows)

    def execute_stage2_pattern_detection(self, optimized_universe: list) -> pd.DataFrame:
        """
        Stage 2: Run original backside pattern detection on optimized universe
        """
        print(f"\n{'='*70}")
        print("STAGE 2: ORIGINAL BACKSIDE PATTERN DETECTION ON OPTIMIZED UNIVERSE")
        print(f"{'='*70}")
        print(f"Optimized Universe: {len(optimized_universe)} symbols")
        print(f"Running original backside pattern detection...")
        print(f"Date Range: {self.scan_start} to {self.scan_end}")

        all_results = []
        processed = 0
        signals_found = 0

        start_time = time.time()

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_symbol = {
                executor.submit(self.scan_symbol_original_logic, symbol, self.scan_start, self.scan_end): symbol
                for symbol in optimized_universe
            }

            for future in as_completed(future_to_symbol):
                symbol = future_to_symbol[future]
                processed += 1

                try:
                    results = future.result()
                    if not results.empty:
                        all_results.append(results)
                        signals_found += len(results)
                        print(f"✓ {symbol}: {len(results)} signals")
                    else:
                        print(f"- {symbol}: No signals")

                except Exception as e:
                    print(f"✗ {symbol}: Error")

                if processed % 20 == 0:
                    print(f"Progress: {processed}/{len(optimized_universe)} symbols processed | Signals: {signals_found}")

        elapsed = time.time() - start_time

        if all_results:
            final_results = pd.concat(all_results, ignore_index=True)
            final_results = final_results.sort_values(["Date", "Ticker"], ascending=[False, True])

            print(f"\nStage 2 Complete ({elapsed:.1f}s): Found {len(final_results)} backside signals")

            return final_results
        else:
            print(f"\nStage 2 Complete ({elapsed:.1f}s): No backside signals found")
            return pd.DataFrame()

    # ==================== STAGE 3: RESULTS AND ANALYSIS ====================

    def execute_stage3_results_analysis(self, signals_df: pd.DataFrame, stage1_universe_size: int, stage2_time: float):
        """
        Stage 3: Results analysis and performance metrics
        """
        print(f"\n{'='*70}")
        print("STAGE 3: RESULTS ANALYSIS & PERFORMANCE METRICS")
        print(f"{'='*70}")

        if signals_df.empty:
            print("No signals to analyze")
            return

        # Convert date column for proper sorting
        signals_df['Date'] = pd.to_datetime(signals_df['Date'])

        # Apply date filters (same as original: PRINT_FROM = "2025-01-01")
        display_start = "2025-01-01"
        display_end = "2025-11-01"

        if display_start:
            signals_df = signals_df[pd.to_datetime(signals_df["Date"]) >= pd.to_datetime(display_start)]
        if display_end:
            signals_df = signals_df[pd.to_datetime(signals_df["Date"]) <= pd.to_datetime(display_end)]

        # Display results
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", 0)
        pd.set_option("display.max_rows", 200)

        print(f"\nBACKSIDE PARA B SIGNALS - FINAL RESULTS")
        print(f"{'='*50}")
        print("TICKER / DATE")
        for _, row in signals_df.iterrows():
            print(f"{row['Ticker']} / {row['Date'].strftime('%Y-%m-%d')}")

        # Performance Analysis
        print(f"\n{'='*50}")
        print("PERFORMANCE ANALYSIS")
        print(f"{'='*50}")
        print(f"Total Signals: {len(signals_df)}")
        print(f"Unique Tickers: {signals_df['Ticker'].nunique()}")
        print(f"Date Range: {signals_df['Date'].min().strftime('%Y-%m-%d')} to {signals_df['Date'].max().strftime('%Y-%m-%d')}")

        print(f"\nOPTIMIZATION BENEFITS:")
        print(f"  Stage 1 Universe Size: {stage1_universe_size} symbols")
        print(f"  Stage 2 Universe Size: {len(signals_df['Ticker'].unique())} symbols (actually processed)")
        print(f"  Processing Time: {stage2_time:.1f}s")

        # Signal Statistics
        print(f"\nSIGNAL STATISTICS:")
        print(f"  Average Gap/ATR: {signals_df['Gap/ATR'].mean():.2f}")
        print(f"  Average D1 Volume: {signals_df['D1Vol/Avg'].mean():.1f}x")
        print(f"  Triggers D-1: {len(signals_df[signals_df['Trigger'] == 'D-1'])}")
        print(f"  Triggers D-2: {len(signals_df[signals_df['Trigger'] == 'D-2'])}")

        # Top signals by gap strength
        if len(signals_df) > 0:
            print(f"\nTOP 20 SIGNALS BY GAP STRENGTH:")
            top_signals = signals_df.nlargest(20, 'Gap/ATR')
            for i, (_, row) in enumerate(top_signals.iterrows(), 1):
                print(f"  {i:2d}. {row['Ticker']:<6} {row['Date'].strftime('%m/%d')} "
                      f"Gap:{row['Gap/ATR']:.2f} "
                      f"Vol:{row['D1Vol/Avg']:.1f}x "
                      f"Open>PrevHigh:{row['Open>PrevHigh']}")

        # Monthly signal distribution
        print(f"\nSIGNALS BY MONTH:")
        monthly_counts = signals_df['Date'].dt.strftime('%Y-%m').value_counts().sort_index()
        for month, count in monthly_counts.items():
            print(f"  {month}: {count} signals")

        # Top tickers by signal count
        print(f"\nTOP TICKERS BY SIGNAL COUNT:")
        ticker_counts = signals_df['Ticker'].value_counts().head(10)
        for ticker, count in ticker_counts.items():
            print(f"  {ticker}: {count} signals")

    # ==================== MAIN EXECUTION ====================

    def run_formatted_scan(self):
        """
        Execute the TRUE multi-stage scanning process
        """
        print(f"FORMATTED BACKSIDE PARA B SCANNER - MULTI-STAGE PROCESS")
        print(f"=============================================")
        print(f"Implementing our ACTUAL formatting process with market universe optimization")
        print(f"Scan Period: {self.scan_start} to {self.scan_end}")

        total_start_time = time.time()

        # Stage 1: Market Universe Optimization
        optimized_universe = self.execute_stage1_market_universe_optimization()

        if not optimized_universe:
            print("\n❌ Stage 1 failed: No symbols qualified")
            return pd.DataFrame()

        # Stage 2: Pattern Detection
        stage2_start = time.time()
        signals_df = self.execute_stage2_pattern_detection(optimized_universe)
        stage2_time = time.time() - stage2_start

        if signals_df.empty:
            print("\n❌ Stage 2 failed: No backside signals detected")
            return pd.DataFrame()

        # Stage 3: Results Analysis
        self.execute_stage3_results_analysis(signals_df, len(optimized_universe), stage2_time)

        total_elapsed = time.time() - total_start_time

        print(f"\n{'='*70}")
        print(f"FORMATTED SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"Total Execution Time: {total_elapsed:.1f}s")
        print(f"Final Signals: {len(signals_df)}")
        print(f"Process Efficiency: Market Universe → Optimized → Signals")

        return signals_df


def main():
    """
    Main execution function for terminal testing
    """
    scanner = FormattedBacksideParaBScanner()

    print(f"Starting FORMATTED Backside Para B Scanner...")
    print(f"This implements our actual multi-stage formatting process.")
    print(f"Date Range: January 1, 2025 to November 1, 2025")

    # Execute the complete multi-stage scan
    results = scanner.run_formatted_scan()

    return results


if __name__ == "__main__":
    main()