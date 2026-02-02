"""
RENATA FORMATTED BACKSIDE B SCANNER - Complete 2-Stage Process
================================================================

Implementation of Renata's complete multi-stage architecture for backside B scanning.

STAGE 1: Market Universe Optimization
- Fetch Polygon's complete market universe (12,000+ tickers)
- Apply smart temporal filtering with corrected parameters
- Use the specific thresholds from the original scanner
- Date range: D0 range 2025-01-01 to 2025-11-01, fetch range 2023-08-01 to 2025-11-01

STAGE 2: Pattern Detection
- Run the original backside pattern detection on the optimized universe
- 100% preserve the exact logic from the original backside para b copy.py
- Same parameters: adv20_min_usd=30_000_000, d1_volume_min=15_000_000, etc.

STAGE 3: Results Analysis
- Display results in the clean format (Ticker/Date)
- Apply date filtering for 2025-01-01 to 2025-11-01
- Performance metrics and signal statistics

Key improvements:
1. CORRECT parameter magnitudes (30_000_000 not 30, 15_000_000 not 15)
2. Smart temporal filtering that examines volume spikes, ATR ratios, EMA slopes
3. 100% preserved original pattern detection logic
4. Proper date ranges: fetch from 2023-08-01 for historical calculations
5. Same clean output format (Ticker and Date only)
"""

import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import multiprocessing as mp

class RenataFormattedBacksideBScanner:
    """
    Renata's complete 2-stage formatting process for backside B scanning
    """

    def __init__(self):
        # Core API Configuration
        self.session = requests.Session()
        self.api_key = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        self.base_url = "https://api.polygon.io"
        self.max_workers = mp.cpu_count() or 16

        # === EXACT ORIGINAL BACKSIDE PARAMETERS ===
        self.params = {
            # Hard liquidity / price
            "price_min": 8.0,
            "adv20_min_usd": 30_000_000,  # $30 MILLION daily value (CORRECT!)

            # Backside context (absolute window)
            "abs_lookback_days": 1000,
            "abs_exclude_days": 10,
            "pos_abs_max": 0.75,

            # Trigger mold (evaluated on D-1 or D-2)
            "trigger_mode": "D1_or_D2",
            "atr_mult": 0.9,
            "vol_mult": 0.9,
            "d1_vol_mult_min": None,
            "d1_volume_min": 15_000_000,   # 15 MILLION shares (CORRECT!)

            "slope5d_min": 3.0,
            "high_ema9_mult": 1.05,

            # Trade-day (D0) gates
            "gap_div_atr_min": 0.75,
            "open_over_ema9_min": 0.9,
            "d1_green_atr_min": 0.30,
            "require_open_gt_prev_high": True,

            # Relative requirement
            "enforce_d1_above_d2": True,
        }

        # D0 Range: The actual signal dates we want to find
        self.d0_start = "2025-01-01"
        self.d0_end = "2025-11-01"

        # Fetch Range: Historical data needed for calculations
        self.scan_start = "2023-08-01"  # ~500 days before D0 start for absolute window
        self.scan_end = self.d0_end

        # Smart filtering uses the same historical range
        self.smart_start = self.scan_start
        self.smart_end = self.scan_end

        print("Renata Formatted Backside B Scanner Initialized")
        print(f"Parameters: adv20_min_usd=${self.params['adv20_min_usd']:,}, d1_volume_min={self.params['d1_volume_min']:,} shares")

    # ==================== STAGE 1: MARKET UNIVERSE OPTIMIZATION ====================

    def fetch_polygon_market_universe(self) -> list:
        """Fetch Polygon's complete market universe"""
        print(f"\n{'='*70}")
        print("STAGE 1: POLYGON MARKET UNIVERSE FETCH + SMART TEMPORAL FILTERING")
        print(f"{'='*70}")
        print(f"Fetching complete market universe...")

        try:
            # Try Polygon's full market snapshot endpoint
            print("  Using Polygon full market snapshot endpoint...")
            url = f"{self.base_url}/v2/snapshot/locale/us/markets/stocks/tickers"
            params = {
                "apiKey": self.api_key,
                "include_otc": "false"  # Major exchanges only
            }

            response = self.session.get(url, params=params, timeout=30)
            response.raise_for_status()

            data = response.json()
            tickers = data.get('tickers', [])

            print(f"    Raw snapshot: {len(tickers)} tickers")

            all_tickers = []
            for ticker in tickers:
                ticker_symbol = ticker.get('ticker')
                if not ticker_symbol or len(ticker_symbol) > 10 or ticker_symbol.startswith(('^', '$')):
                    continue
                all_tickers.append(ticker_symbol)

            # Remove duplicates
            all_tickers = list(set(all_tickers))
            print(f"    Filtered universe: {len(all_tickers)} tickers")

            if len(all_tickers) < 8000:
                print(f"    ⚠️  Only {len(all_tickers)} tickers found. Using fallback universe...")
                return self._get_fallback_universe()

            return all_tickers

        except Exception as e:
            print(f"    Error fetching market universe: {e}")
            return self._get_fallback_universe()

    def _get_fallback_universe(self) -> list:
        """Comprehensive fallback universe covering major exchanges"""
        print("Using comprehensive fallback universe...")

        return [
            # Mega Cap
            'AAPL','MSFT','GOOGL','GOOG','AMZN','NVDA','META','TSLA','BRK.B','JNJ','V','WMT','XOM','PG','JPM',
            'MA','HD','CVX','PYPL','UNH','CRM','DIS','ADBE','NFLX','INTC','CSCO','PFE','KO','T','CMCSA','VZ',
            'NKE','ABT','TMO','ABBV','MRK','DHR','MCD','BAC','WFC','LIN','ACN','TXN','NEE','AVGO','COST','ORCL',

            # Tech & Growth
            'AMD','TGT','SBUX','IBM','ISRG','CI','LMT','GS','QCOM','DE','HON','CAT','GE','MMM','MDT','SYY','EMR','GD',
            'MS','BLK','SPGI','CB','AMT','SLB','COP','EOG','HAL','KMI','SCHW','FIS','ADI','CSX','LRCX','GILD','BKNG','FDX','ADP',

            # High Growth
            'MSTR','SMCI','PLTR','SNOW','CRWD','OKTA','ZS','NOW','TEAM','DDOG','FIVV','CLOUD','SQ','SHOP','ZM','ROKU',
            'SNAP','MDB','APPN','ZI','CRNC','AYX','CVLT','ESTC','GWRE','NEWR','UPST','AFRM','DKNG','COIN','MARA','RIOT',
            'RBLX','ZNGA','BILI','PDD','JD','BIDU','NTES','BABA','TME','BEKE','ZIM','FUTU',

            # Healthcare
            'UNH','PFE','ABBV','TMO','ABT','MRK','DHR','BMY','AMGN','GILD','REGN','MDT','ISRG','BIIB','VRTX','LLY',
            'ELV','GSK','SNY','NVS','AZN','SGEN','ALNY','MRNA','BNTX','IDXX','ILMN','DNA','BEAM','SRPT','CRSP','EDIT',

            # Industrial & Energy
            'CAT','DE','BA','GE','HON','MMM','UPS','RTX','LMT','GD','NOC','TXT','ROST','FAST','URI','CARR','ETN','TT',
            'ITW','PH','PHM','XOM','CVX','COP','PSX','VLO','MPC','OXY','EOG','SLB','HAL','BKR','DVN','MRO','HES','APA',
            'EQT','SWN','KMI','WMB','NOV','FCX','VALE','NUE','STLD','CLF','X','AA','DD','DOW',

            # Financial
            'JPM','BAC','WFC','GS','MS','BLK','AXP','COF','AIG','SCHW','TROW','ICE','CME','MMC','STT','PNC','TFC','DFS',
            'C','CFG','KEY','HBAN','RF','FITB','ZION','NYCB','MTB','UBS','NTRS','SYF','BOKF','WAL','WTFC','AFL','TRV','CINF',
            'ALLY','USB','PNC','COF','DFS','BAC','WFC','JPM','GS','MS','C','MU','RF',

            # Consumer & Retail
            'WMT','COST','HD','LOW','TGT','MCD','NKE','SBUX','KO','PEP','PG','CL','KMB','K','DIS','CMCSA','NFLX','TJX',
            'KR','SYY','GIS','MDLZ','K','CL','HSY','CAG','CPB','KHC','HRL','SJM','ADM','CTVA','CTAS','STZ','NOW',

            # ETFs
            'SPY','QQQ','IWM','VTI','VOO','GLD','SLV','TLT','HYG','LQD','XLE','XLF','XLK','XLV','XLI','XLP','XLU',
            'XLRE','XLC','XLB','IVV','VUG','VTV','VIG','VYM','VYMI','VWO','VO','VBK','VOT','VFH','VCR','VHT','VGT','VBR',
            'VTIP','VTW','VPU','VCT','VFM','VEA','VCE','FTW','SOXL','SOXS','TECL','TECS','FNGU','FNGD','NVDL','NVDX','TSLQ',
            'TSLL','TSLR','TSLT','BULL','BEAR','SPXL','SPXS','SPXU','UPRO','SDOW','SDS','SQQQ','TZA','UVXY','VXX','VIXY',

            # Additional High Volume Stocks
            'FIS','ADI','CSX','LRCX','GILD','BKNG','FDX','ADP','WBA','TJX','MDLZ','GIS','KMB','CAG','CPB','KHC','HRL','SJM',
            'ADM','CTVA','CTAS','STZ','NOW','PLD','MS','MDT','WM','BKNG','FDX','ADP','EQIX','DHR','SNPS','REGN','SYK','TMO','CVS',
            'INTU','SCHW','CI','APD','SO','MMC','ICE','BIDU','NTDOY','SONY','TM','HMC','NSANY','VLKAF','BMWYY','BAMXF','AMC','GME',
            'RIVN','LCID','NIO','XPENG','LI','SPOT','U','LYFT','UBER','SNAP','ROKU','ZM','CHWY','PTON','SHOP','SQ','COIN','HOOD',

            # China & International
            'BABA','JD','PDD','BIDU','NTES','TME','NIO','XPENG','LI','BILI','TSLA','TSLR','TSLL','EDU','BABX','FRO','FTRE','ESTC',
            'TLRY','CHAU','MRK','DLO','INTC','CRNC','ETHU','SOLT','BMNR','XPEV','CWK','VSAT','HSY','CRVO','WRD','COUR','RKT','YETI',
            'CLF','KSS','ETSY','YYAI','AI','BABA','SOC','YINN','LI','REPL','SBET','USAR','TNXP','MLGO','TIGR','BEAM','SOUN','SNPS',
            'METC','EL','CONL','RDDT','ZETA','ETHD','OSCR','PCT','APA','CNQ','COP','EOG','EQNR','MTDR','PR','USO','XOM','DV','SAIL',
            'CRSP','HUT','IREN','AFRM','ORCL','EWY','BNTX','DXYZ','GME','NNE','OKLO','BITO','BITU','ACAD','AMD','KULR','NVDL','NVDX',

            # Leveraged & Volatility
            'FSLR','PSX','RUN','ADNT','AES','ALGM','DAN','LEU','MBLY','MNSO','NXT','PBF','QUBT','RGTI','RRC','SEDG','SONO','ST','TRIP',
            'VYX','ETH','ETHA','ETHE','EVH','FETH','FROG','LYFT','TTD','AS','WWW','BGC','VRNS','TEVA','EXAS','AAON','ANET','ATI','GSK',
            'ODD','GRAL','CERT','FAZ','FNGD','NVD','PLTD','PSQ','QID','RWM','SDOW','SDS','SH','SOXS','SPDN','SPXS','SPXU','SRTY',

            # Energy & Commodities
            'BOIL','SMCI','SMCX','UNG','PGY','RXRX','HTHT','KWEB','PENN','TDOC','TME','BEKE','ZIM','FUTU','GRRR','DXC','KALV','SCO',
            'MT','ALLY','STX','TEM','QRVO','GFI','HMY','ATEC','DHT','CTRA','DVN','KITT','LCID'
        ]

    def apply_smart_temporal_filters(self, ticker: str, start_date: str, end_date: str) -> bool:
        """
        Smart temporal filtering - identify tickers with backside B trigger potential
        Uses CORRECTED parameters and reasonable thresholds
        """
        try:
            # Fetch data for the ticker
            url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start_date}/{end_date}"
            params = {
                "apiKey": self.api_key,
                "adjusted": "true",
                "sort": "asc",
                "limit": 50000
            }

            response = self.session.get(url, params=params, timeout=10)
            response.raise_for_status()

            data = response.json().get("results", [])
            if not data or len(data) < 60:  # Need at least 60 days for meaningful analysis
                return False

            df = pd.DataFrame(data)
            df['close'] = df['c']
            df['high'] = df['h']
            df['low'] = df['l']
            df['open'] = df['o']
            df['volume'] = df['v']
            df['date'] = pd.to_datetime(df["t"], unit="ms")

            # Data quality check
            if df.isnull().sum().sum() > len(df) * len(df.columns) * 0.1:  # 10% threshold
                return False

            # Calculate key metrics
            df['adv20'] = (df['close'] * df['volume']).rolling(20, min_periods=10).mean().shift(1)

            # Basic qualification - meet minimum criteria
            qualified_days = df[
                (df['close'] >= self.params['price_min']) &
                (df['volume'] >= 1_000_000) &  # 1M shares minimum
                (df['adv20'] >= self.params['adv20_min_usd'] * 0.3)  # 30% of target ADV
            ]

            if len(qualified_days) < 5:  # Need consistent qualification
                return False

            # Look for backside trigger indicators
            trigger_score = 0

            # 1. Volume spike analysis (using corrected parameter thresholds)
            df['prev_volume'] = df['volume'].shift(1)
            df['vol_avg'] = df['volume'].rolling(14, min_periods=10).mean().shift(1)
            df['vol_mult'] = df['volume'] / df['vol_avg']
            df['vol_mult'] = df['vol_mult'].replace([np.inf, -np.inf], np.nan).fillna(1.0)

            # Check for significant volume spikes
            volume_spikes = df[df['vol_mult'] >= self.params['vol_mult']]
            if len(volume_spikes) > 0:
                trigger_score += 1

            # 2. ATR-based price movement (using corrected atr_mult)
            df['hi_lo'] = df['high'] - df['low']
            df['prev_close'] = df['close'].shift(1)
            df['hi_prev'] = (df['high'] - df['prev_close']).abs()
            df['lo_prev'] = (df['low'] - df['prev_close']).abs()
            df['true_range'] = pd.concat([df['hi_lo'], df['hi_prev'], df['lo_prev']], axis=1).max(axis=1)
            df['atr_rolling'] = df['true_range'].rolling(14, min_periods=10).mean().shift(1)

            if df['atr_rolling'].max() > 0:
                df['atr_ratio'] = df['true_range'] / df['atr_rolling'].replace(0, np.nan)
                atr_days = df[df['atr_ratio'] >= self.params['atr_mult']]
                if len(atr_days) > 0:
                    trigger_score += 1

            # 3. EMA slope analysis (using corrected slope5d_min)
            df['ema_9'] = df['close'].ewm(span=9, adjust=False).mean()
            if len(df) >= 10:
                df['slope_5d'] = (df['ema_9'] - df['ema_9'].shift(5)) / df['ema_9'].shift(5) * 100
                df['slope_5d'] = df['slope_5d'].replace([np.inf, -np.inf], np.nan)
                positive_slopes = df[df['slope_5d'] >= self.params['slope5d_min']]
                if len(positive_slopes) > 0:
                    trigger_score += 1

            # 4. Price level relative to EMA (using corrected high_ema9_mult)
            if df['atr_rolling'].max() > 0:
                df['high_ema9_diff'] = df['high'] - df['ema_9']
                df['high_ema9_ratio'] = df['high_ema9_diff'] / df['atr_rolling'].replace(0, np.nan)
                ema_days = df[df['high_ema9_ratio'] >= self.params['high_ema9_mult']]
                if len(ema_days) > 0:
                    trigger_score += 1

            # 5. Green day strength (using corrected d1_green_atr_min)
            df['body'] = df['close'] - df['open']
            df['body_atr'] = df['body'] / df['atr_rolling'].replace(0, np.nan)
            df['body_atr'] = df['body_atr'].replace([np.inf, -np.inf], np.nan)
            green_days = df[df['body_atr'] >= self.params['d1_green_atr_min']]
            if len(green_days) > 0:
                trigger_score += 1

            # Need at least 2 out of 5 indicators to qualify
            qualifies = trigger_score >= 2

            if qualifies:
                print(f"    ✅ {ticker}: QUALIFIED (score:{trigger_score}/5)")

            return qualifies

        except Exception as e:
            # If we can't get data, exclude the ticker
            return False

    def execute_stage1_market_universe_optimization(self) -> list:
        """Stage 1: Market Universe Optimization"""
        start_time = time.time()

        # Fetch complete market universe
        market_universe = self.fetch_polygon_market_universe()

        print(f"\nApplying smart temporal filters to {len(market_universe)} tickers...")

        qualified_tickers = []
        processed = 0
        qualified_count = 0

        with ThreadPoolExecutor(max_workers=self.max_workers) as executor:
            future_to_ticker = {
                executor.submit(self.apply_smart_temporal_filters, ticker, self.smart_start, self.smart_end): ticker
                for ticker in market_universe
            }

            for future in as_completed(future_to_ticker):
                ticker = future_to_ticker[future]
                processed += 1

                try:
                    qualifies = future.result()
                    if qualifies:
                        qualified_tickers.append(ticker)
                        qualified_count += 1

                    if processed % 100 == 0:
                        qualify_rate = (qualified_count / processed) * 100
                        print(f"  Progress: {processed}/{len(market_universe)} ({processed/len(market_universe)*100:.1f}%) | "
                              f"Qualified: {qualified_count} ({qualify_rate:.1f}%)")

                except Exception:
                    pass

        final_rate = (qualified_count / processed) * 100 if processed > 0 else 0
        print(f"  Final: Processed {processed} tickers | Qualified: {qualified_count} ({final_rate:.1f}%)")

        elapsed = time.time() - start_time
        print(f"\nStage 1 Complete ({elapsed:.1f}s):")
        print(f"  Total Market Universe: {len(market_universe)} tickers")
        print(f"  After Smart Filters: {len(qualified_tickers)} tickers")
        if len(market_universe) > 0:
            reduction = ((len(market_universe) - len(qualified_tickers)) / len(market_universe)) * 100
            print(f"  Reduction: {reduction:.1f}%")

        return qualified_tickers

    # ==================== STAGE 2: ORIGINAL PATTERN DETECTION ====================

    def fetch_daily_data(self, ticker: str, start: str, end: str) -> pd.DataFrame:
        """Original fetch function exactly as in backside para b copy.py"""
        url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
        r = self.session.get(url, params={"apiKey": self.api_key, "adjusted": "true", "sort":"asc", "limit":50000})
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
        """Original metrics function exactly as in backside para b copy.py"""
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
        """Original abs_top_window function exactly as in backside para b copy.py"""
        if df.empty:
            return (np.nan, np.nan)
        cutoff = d0 - pd.Timedelta(days=exclude_days)
        wstart = cutoff - pd.Timedelta(days=lookback_days)
        win = df[(df.index > wstart) & (df.index <= cutoff)]
        if win.empty:
            return (np.nan, np.nan)
        return float(win["Low"].min()), float(win["High"].max())

    def pos_between(self, val, lo, hi):
        """Original pos_between function exactly as in backside para b copy.py"""
        if any(pd.isna(t) for t in (val, lo, hi)) or hi <= lo:
            return np.nan
        return max(0.0, min(1.0, float((val - lo) / (hi - lo))))

    def _mold_on_row(self, rx: pd.Series) -> bool:
        """Original _mold_on_row function exactly as in backside para b copy.py"""
        if pd.isna(rx.get("Prev_Close")) or pd.isna(rx.get("ADV20_$")):
            return False
        if rx["Prev_Close"] < self.params["price_min"] or rx["ADV20_$"] < self.params["adv20_min_usd"]:
            return False
        vol_avg = rx["VOL_AVG"]
        if pd.isna(vol_avg) or vol_avg <= 0:
            return False
        vol_sig = max(rx["Volume"]/vol_avg, rx["Prev_Volume"]/vol_avg)
        checks = [
            (rx["TR"] / rx["ATR"]) >= self.params["atr_mult"],
            vol_sig >= self.params["vol_mult"],
            rx["Slope_9_5d"] >= self.params["slope5d_min"],
            rx["High_over_EMA9_div_ATR"] >= self.params["high_ema9_mult"],
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
            lo_abs, hi_abs = self.abs_top_window(m, d0, self.params["abs_lookback_days"], self.params["abs_exclude_days"])
            pos_abs_prev = self.pos_between(r1["Close"], lo_abs, hi_abs)
            if not (pd.notna(pos_abs_prev) and pos_abs_prev <= self.params["pos_abs_max"]):
                continue

            # Choose trigger
            trigger_ok = False; trig_row = None; trig_tag = "-"
            if self.params["trigger_mode"] == "D1_only":
                if self._mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
            else:
                if self._mold_on_row(r1): trigger_ok, trig_row, trig_tag = True, r1, "D-1"
                elif self._mold_on_row(r2): trigger_ok, trig_row, trig_tag = True, r2, "D-2"
            if not trigger_ok:
                continue

            # D-1 must be green
            if not (pd.notna(r1["Body_over_ATR"]) and r1["Body_over_ATR"] >= self.params["d1_green_atr_min"]):
                continue

            # Absolute D-1 volume floor (shares)
            if self.params["d1_volume_min"] is not None:
                if not (pd.notna(r1["Volume"]) and r1["Volume"] >= self.params["d1_volume_min"]):
                    continue

            # Optional relative D-1 vol multiple
            if self.params["d1_vol_mult_min"] is not None:
                if not (pd.notna(r1["VOL_AVG"]) and r1["VOL_AVG"] > 0 and (r1["Volume"]/r1["VOL_AVG"]) >= self.params["d1_vol_mult_min"]):
                    continue

            # D-1 > D-2 highs & close
            if self.params["enforce_d1_above_d2"]:
                if not (pd.notna(r1["High"]) and pd.notna(r2["High"]) and r1["High"] > r2["High"]
                        and pd.notna(r1["Close"]) and pd.notna(r2["Close"]) and r1["Close"] > r2["Close"]):
                    continue

            # D0 gates
            if pd.isna(r0["Gap_over_ATR"]) or r0["Gap_over_ATR"] < self.params["gap_div_atr_min"]:
                continue
            if self.params["require_open_gt_prev_high"] and not (r0["Open"] > r1["Prev_High"]):
                continue
            if pd.isna(r0["Open_over_EMA9"]) or r0["Open_over_EMA9"] < self.params["open_over_ema9_min"]:
                continue

            # Add result (Ticker and Date only as requested)
            rows.append({
                "Ticker": sym,
                "Date": d0.strftime("%Y-%m-%d"),
            })

        return pd.DataFrame(rows)

    def execute_stage2_pattern_detection(self, optimized_universe: list) -> pd.DataFrame:
        """Stage 2: Original backside pattern detection"""
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
                        if processed % 50 == 0:  # Only print every 50 for "no signals" to reduce noise
                            print(f"- {symbol}: No signals")

                except Exception as e:
                    print(f"✗ {symbol}: Error")

                if processed % 20 == 0:
                    print(f"Progress: {processed}/{len(optimized_universe)} symbols processed | Signals: {signals_found}")

        elapsed = time.time() - start_time

        if all_results:
            final_results = pd.concat(all_results, ignore_index=True)

            # Convert date column for proper filtering
            final_results['Date'] = pd.to_datetime(final_results['Date'])

            # Apply date filtering for D0 range
            if self.d0_start:
                final_results = final_results[final_results["Date"] >= pd.to_datetime(self.d0_start)]
            if self.d0_end:
                final_results = final_results[final_results["Date"] <= pd.to_datetime(self.d0_end)]

            final_results = final_results.sort_values(["Date", "Ticker"], ascending=[False, True])

            print(f"\nStage 2 Complete ({elapsed:.1f}s): Found {len(final_results)} backside signals")

            return final_results
        else:
            print(f"\nStage 2 Complete ({elapsed:.1f}s): No backside signals found")
            return pd.DataFrame()

    # ==================== STAGE 3: RESULTS ANALYSIS ====================

    def execute_stage3_results_analysis(self, signals_df: pd.DataFrame, stage1_universe_size: int, stage2_time: float):
        """Stage 3: Results analysis and performance metrics"""
        print(f"\n{'='*70}")
        print("STAGE 3: RESULTS ANALYSIS & PERFORMANCE METRICS")
        print(f"{'='*70}")

        if signals_df.empty:
            print("No signals to analyze")
            return

        # Display results in clean format (Ticker/Date only)
        pd.set_option("display.max_columns", None)
        pd.set_option("display.width", 0)
        pd.set_option("display.max_rows", 500)

        print(f"\nBACKSIDE PARA B SIGNALS - CLEAN OUTPUT")
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

        print(f"\nOPTIMIZATION EFFICIENCY:")
        print(f"  Stage 1 Universe Size: {stage1_universe_size} symbols")
        print(f"  Stage 2 Universe Size: {len(signals_df['Ticker'].unique())} symbols (produced signals)")
        print(f"  Processing Time: {stage2_time:.1f}s")

        # Signal Statistics by month
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

    def run_renata_formatted_scan(self):
        """Execute Renata's complete 2-stage formatting process"""
        print(f"RENATA FORMATTED BACKSIDE B SCANNER - COMPLETE 2-STAGE PROCESS")
        print(f"=============================================")
        print(f"Implementing Renata's multi-stage architecture with CORRECTED parameters")
        print(f"Signal Range: {self.d0_start} to {self.d0_end}")
        print(f"Data Fetch Range: {self.scan_start} to {self.scan_end}")
        print(f"Parameters: adv20_min_usd=${self.params['adv20_min_usd']:,}, d1_volume_min={self.params['d1_volume_min']:,}")

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
        print(f"RENATA FORMATTED SCAN COMPLETE")
        print(f"{'='*70}")
        print(f"Total Execution Time: {total_elapsed:.1f}s")
        print(f"Final Signals: {len(signals_df)}")
        print(f"Process: Market Universe → Smart Filters → Pattern Detection → Clean Results")

        return signals_df


def main():
    """Main execution function"""
    scanner = RenataFormattedBacksideBScanner()

    print(f"Starting Renata Formatted Backside B Scanner...")
    print(f"Complete 2-stage process with CORRECTED parameters")
    print(f"Signal Range: {scanner.d0_start} to {scanner.d0_end}")
    print(f"Data Fetch Range: {scanner.scan_start} to {scanner.scan_end}")

    # Execute the complete scan
    results = scanner.run_renata_formatted_scan()

    return results


if __name__ == "__main__":
    main()