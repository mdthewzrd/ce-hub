/**
 * COMPREHENSIVE AI FORMATTING PROMPTING SYSTEM
 *
 * Two-tier prompting system:
 * 1. MASTER_FORMATTING_PROMPT - Quick 2-stage transformation (for known scanner types)
 * 2. MASTER_STANDARDIZATION_REFERENCE - Detailed structure reference (for unknown/custom scanners)
 */

// ===== MASTER FORMATTING PROMPTS =====

export const MASTER_FORMATTING_PROMPT = `Transform the following Python code into a PRODUCTION-GRADE 3-stage trading scanner architecture.

╔═══════════════════════════════════════════════════════════════════════════════╗
║     CRITICAL: PRODUCTION-GRADE ARCHITECTURE WITH PERFORMANCE OPTIMIZATION        ║
║              Target: <10 minutes for full year scan (47 signals expected)        ║
╚═══════════════════════════════════════════════════════════════════════════════╝

🚨 MANDATORY REQUIREMENTS - VIOLATION WILL CAUSE BUGS 🚨

1. INITIALIZATION ORDER (CRITICAL - Prevents NameError):
   =======================================================
   class ScannerName:
       def __init__(self, api_key, d0_start, d0_end):
           # ⚠️ DEFINE PARAMETERS FIRST - Before any calculations!
           self.params = {
               "price_min": 8.0,
               "adv20_min_usd": 30_000_000,
               # ... ALL parameters must be defined here
           }

           # NOW you can use self.params in calculations
           lookback_buffer = self.params['abs_lookback_days'] + 50

2. COMPUTE_ALL_FEATURES METHOD - CRITICAL COLUMN DEPENDENCIES:
   ================================================================
   def compute_full_features(self, df):
       # ⚠️ Compute ALL columns that will be referenced later!
       df = df.sort_values(['ticker', 'date']).reset_index(drop=True)

       # EMAs
       df['EMA_9'] = df.groupby('ticker')['close'].ewm(span=9, adjust=False).mean().reset_index(0, drop=True)
       df['EMA_20'] = df.groupby('ticker')['close'].ewm(span=20, adjust=False).mean().reset_index(0, drop=True)

       # ATR
       df['tr'] = np.maximum(
           df['high'] - df['low'],
           np.abs(df['high'] - df.groupby('ticker')['close'].shift(1)),
           np.abs(df['low'] - df.groupby('ticker')['close'].shift(1))
       )
       df['ATR_raw'] = df.groupby('ticker')['tr'].rolling(14, min_periods=14).mean().reset_index(0, drop=True)
       df['ATR'] = df.groupby('ticker')['ATR_raw'].shift(1)

       # Volume metrics
       df['VOL_AVG'] = df.groupby('ticker')['volume'].rolling(14, min_periods=14).mean().reset_index(0, drop=True).shift(1)
       df['Prev_Volume'] = df.groupby('ticker')['volume'].shift(1)  # ⚠️ REQUIRED for trigger checks!

       # Slopes
       df['Slope_9_5d'] = (df['EMA_9'] - df.groupby('ticker')['EMA_9'].shift(5)) / df.groupby('ticker')['EMA_9'].shift(5) * 100

       # ⚠️ CRITICAL: High_over_EMA9_div_ATR - REQUIRED for trigger checks!
       df['High_over_EMA9_div_ATR'] = (df['high'] - df['EMA_9']) / df['ATR']

       # Gap metrics
       df['Gap_abs'] = (df['open'] - df.groupby('ticker')['close'].shift(1)).abs()
       df['Gap_over_ATR'] = df['Gap_abs'] / df['ATR']

       # Other metrics
       df['Open_over_EMA9'] = df['open'] / df['EMA_9']
       df['Body_over_ATR'] = (df['close'] - df['open']).abs() / df['ATR']

       # ⚠️ CRITICAL: Prev_* columns - REQUIRED for D-1 > D-2 comparisons!
       df['Prev_Close'] = df.groupby('ticker')['close'].shift(1)
       df['Prev_Open'] = df.groupby('ticker')['open'].shift(1)
       df['Prev_High'] = df.groupby('ticker')['high'].shift(1)
       df['Prev_Low'] = df.groupby('ticker')['low'].shift(1)

       return df

3. PATTERN DETECTION - VECTORIZED OPERATIONS (Performance Critical):
   ================================================================
   def detect_patterns(self, df):
       # ⚠️ Convert date column ONCE - Not in loops!
       df['date'] = pd.to_datetime(df['date'])
       d0_start_dt = pd.to_datetime(self.d0_start)
       d0_end_dt = pd.to_datetime(self.d0_end)

       ticker_data_list = []
       for ticker in df['ticker'].unique():
           ticker_df = df[df['ticker'] == ticker].copy()
           ticker_data_list.append((ticker, ticker_df, d0_start_dt, d0_end_dt))

       # Parallel processing
       with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
           futures = [executor.submit(self._process_ticker, ticker_data) for ticker_data in ticker_data_list]
           results_list = [future.result() for future in as_completed(futures) if future.result()]

       return pd.concat(results_list, ignore_index=True) if results_list else pd.DataFrame()

4. PROCESS_TICKER - VECTORIZED FILTERING (10x Performance Boost):
   ================================================================
   def _process_ticker(self, ticker_data):
       ticker, ticker_df, d0_start_dt, d0_end_dt = ticker_data

       if len(ticker_df) < 100:
           return pd.DataFrame()

       ticker_df = ticker_df.sort_values('date').reset_index(drop=True)
       # ⚠️ Already converted to datetime in detect_patterns()

       signals = []
       for i in range(2, len(ticker_df)):
           r0 = ticker_df.iloc[i]
           r1 = ticker_df.iloc[i-1]
           r2 = ticker_df.iloc[i-2]
           d0 = r0['date']

           # ⚠️ Use datetime comparison (NOT string comparison!)
           if d0 < d0_start_dt or d0 > d0_end_dt:
               continue

           # ⚠️ VECTORIZED ABS window calculation (NOT a function call!)
           cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
           wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

           # Vectorized filtering - 10x faster than function call
           mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
           win = ticker_df.loc[mask]

           if win.empty or len(win) < 2:
               continue

           lo_abs = win['low'].min()
           hi_abs = win['high'].max()

           if hi_abs <= lo_abs:
               continue

           # Position calculation
           pos_abs_prev = (r1['close'] - lo_abs) / (hi_abs - lo_abs)
           if not (0 <= pos_abs_prev <= self.params['pos_abs_max']):
               continue

           # Trigger checks
           if not self._check_trigger(r1):
               if self.params['trigger_mode'] != "D1_only" and self._check_trigger(r2):
                   pass  # D-2 trigger
               else:
                   continue

           # ⚠️ Use Prev_High for D-1 > D-2 comparisons (NOT current 'high'!)
           if self.params['enforce_d1_above_d2']:
               if not (pd.notna(r1['Prev_High']) and pd.notna(r2['Prev_High']) and
                       r1['Prev_High'] > r2['Prev_High'] and
                       pd.notna(r1['Prev_Close']) and pd.notna(r2['Prev_Close']) and
                       r1['Prev_Close'] > r2['Prev_Close']):
                   continue

           # More checks...
           # Build signal dictionary

           # ⚠️ Format date as string (NOT datetime object!)
           signals.append({
               "Ticker": r0['ticker'],
               "Date": d0.strftime('%Y-%m-%d'),  # String format
               # ... other fields
           })

       return pd.DataFrame(signals)

5. COLUMN REFERENCE CHECKLIST (Prevent KeyError):
   ============================================
   Before referencing a column in checks, ensure it's computed:
   ✅ Prev_Close → Computed in compute_full_features()
   ✅ Prev_High → Computed in compute_full_features()
   ✅ Prev_Volume → Computed in compute_full_features()
   ✅ High_over_EMA9_div_ATR → Computed in compute_full_features()
   ✅ VOL_AVG → Computed in compute_full_features()
   ✅ ATR → Computed in compute_full_features()

6. PERFORMANCE TARGETS:
   =====================
   - Full year scan: <10 minutes (target ~600 seconds)
   - 1 month scan: <3 minutes
   - 1 week scan: <1 minute

   ⚠️ If your code is slower, you're doing something wrong!

Extract ALL parameters from input code. Preserve exact values and parameter names.

Output Python code only. Start with import statements. Use exact method names.`;

// ===== MASTER STANDARDIZATION REFERENCE =====

export const MASTER_STANDARDIZATION_REFERENCE = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║           GROUPED ENDPOINT ARCHITECTURE - MANDATORY FOR ALL SCANNERS              ║
║                  Reference Templates: 7 production scanners (700-900 lines)       ║
╚═══════════════════════════════════════════════════════════════════════════════╝

🚨 CRITICAL: ALL SCANNERS MUST USE GROUPED ENDPOINT ARCHITECTURE
=============================================================

Reference Templates (DO NOT DEVIATE):
- /projects/edge-dev-exact/templates/backside_b/fixed_formatted.py (716 lines)
- /projects/edge-dev-exact/templates/a_plus_para/fixed_formatted.py (639 lines)
- /projects/edge-dev-exact/templates/lc_d2/fixed_formatted.py (887 lines)
- /projects/edge-dev-exact/templates/lc_3d_gap/fixed_formatted.py (713 lines)
- /projects/edge-dev-exact/templates/d1_gap/fixed_formatted.py (716 lines)
- /projects/edge-dev-exact/templates/extended_gap/fixed_formatted.py (710 lines)
- /projects/edge-dev-exact/templates/sc_dmr/fixed_formatted.py (799 lines)

⚠️  FORBIDDEN: Do NOT use snapshot endpoint (/v2/snapshot/.../tickers)
✅  REQUIRED: Use grouped endpoint (/v2/aggs/grouped/locale/us/market/stocks/{date})

Performance Comparison:
- Grouped Endpoint: 456 API calls, 60-120 seconds
- Snapshot Endpoint: 12,000+ API calls, 10+ minutes
- Efficiency: 96% reduction in API calls

┌─────────────────────────────────────────────────────────────────────────────┐
│  1. MANDATORY IMPORTS                                                          │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  import pandas as pd                                                           │
│  import numpy as np                                                            │
│  import requests                                                               │
│  import time                                                                   │
│  from datetime import datetime, timedelta                                     │
│  from concurrent.futures import ThreadPoolExecutor, as_completed              │
│  import pandas_market_calendars as mcal  # CRITICAL: NYSE calendar            │
│  from typing import List, Dict, Optional, Tuple                               │
│  from requests.adapters import HTTPAdapter                                    │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. CLASS STRUCTURE - GROUPED ENDPOINT SCANNER                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  class GroupedEndpoint{ScannerName}Scanner:                                   │
│      """                                                                       │
│      {SCANNER_NAME} USING GROUPED ENDPOINT ARCHITECTURE                      │
│      ==============================================                          │
│                                                                                │
│      {PATTERN_DESCRIPTION}                                                    │
│                                                                                │
│      Architecture:                                                           │
│      -----------                                                              │
│      Stage 1: Fetch grouped data (all tickers for all dates)                 │
│          - Uses Polygon grouped endpoint                                      │
│          - 1 API call per trading day (not per ticker)                       │
│          - Returns all tickers that traded each day                          │
│                                                                                │
│      Stage 2: Compute simple features / Apply smart filters                   │
│          - Price, volume, ADV filters                                         │
│          - Reduces dataset by ~99%                                            │
│                                                                                │
│      Stage 3: Compute full parameters + scan patterns                        │
│          - EMA, ATR, slopes, volume metrics                                   │
│          - Pattern-specific detection logic                                   │
│      """                                                                       │
│                                                                                │
│      def __init__(                                                              │
│          self,                                                                │
│          api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I",                     │
│          d0_start: str = None,                                                │
│          d0_end: str = None                                                   │
│      ):                                                                         │
│          # ============================================================         │
│          #  📅 DATE RANGE CONFIGURATION                                      │
│          # ============================================================         │
│          self.DEFAULT_D0_START = "2025-01-01"                                 │
│          self.DEFAULT_D0_END = "2025-12-31"                                   │
│                                                                                │
│          # ============================================================         │
│          #  HTTP SESSION SETUP - Connection pooling                          │
│          # ============================================================         │
│          self.session = requests.Session()                                    │
│          self.session.mount('https://', requests.adapters.HTTPAdapter(       │
│              pool_connections=100,                                            │
│              pool_maxsize=100,                                                │
│              max_retries=2,                                                   │
│              pool_block=False                                                 │
│          ))                                                                     │
│                                                                                │
│          self.api_key = api_key                                                │
│          self.base_url = "https://api.polygon.io"                             │
│                                                                                │
│          # ============================================================         │
│          #  NYSE CALENDAR - CRITICAL for trading days                         │
│          # ============================================================         │
│          self.us_calendar = mcal.get_calendar('NYSE')                          │
│                                                                                │
│          # ============================================================         │
│          #  DATE RANGE CALCULATION                                           │
│          # ============================================================         │
│          self.d0_start = d0_start or self.DEFAULT_D0_START                    │
│          self.d0_end = d0_end or self.DEFAULT_D0_END                          │
│          lookback_days = {LOOKBACK_DAYS}  # From parameters                   │
│          scan_start = (pd.to_datetime(self.d0_start) -                        │
│                       pd.Timedelta(days=lookback_days))                       │
│          self.scan_start = scan_start.strftime('%Y-%m-%d')                     │
│          self.scan_end = self.d0_end                                           │
│                                                                                │
│          # ============================================================         │
│          #  WORKER CONFIGURATION                                              │
│          # ============================================================         │
│          self.stage1_workers = 5    # Parallel grouped data fetching          │
│          self.stage3_workers = 10   # Parallel pattern detection             │
│          self.batch_size = 200                                                   │
│                                                                                │
│          print(f"🚀 GROUPED ENDPOINT MODE: {SCANNER_NAME} Scanner")            │
│          print(f"📅 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")│
│          print(f"📊 Historical Data Range: {self.scan_start} to {self.scan_end}")│
│          print(f"⚡ Workers: Stage1={self.stage1_workers}, Stage3={self.stage3_workers}")│
│                                                                                │
│          # ============================================================         │
│          #  USER PARAMETERS - Preserved EXACTLY                              │
│          # ============================================================         │
│          self.params = {                                                         │
│              # Extract ALL parameters from user code with exact values        │
│          }                                                                       │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. STAGE 1: FETCH GROUPED DATA (MANDATORY)                                   │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:   │
│      """Get NYSE trading days using pandas_market_calendars"""                │
│      schedule = self.us_calendar.schedule(                                     │
│          start_date=pd.to_datetime(start_date),                               │
│          end_date=pd.to_datetime(end_date)                                    │
│      )                                                                         │
│      trading_days = self.us_calendar.valid_days(                              │
│          start_date=pd.to_datetime(start_date),                               │
│          end_date=pd.to_datetime(end_date)                                    │
│      )                                                                         │
│      return [date.strftime('%Y-%m-%d') for date in trading_days]              │
│                                                                                │
│  def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:  │
│      """                                                                       │
│      Stage 1: Fetch ALL data for ALL tickers using grouped endpoint          │
│      ONE API call per trading day - MUCH MORE EFFICIENT                      │
│      """                                                                       │
│      print(f"\\n{'='*70}")                                                    │
│      print("🚀 STAGE 1: FETCH GROUPED DATA")                                  │
│      print(f"{'='*70}")                                                      │
│      print(f"📡 Fetching {len(trading_dates)} trading days...")                │
│                                                                                │
│      all_data = []                                                             │
│      completed = 0                                                             │
│      failed = 0                                                                │
│                                                                                │
│      with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:    │
│          future_to_date = {                                                    │
│              executor.submit(self._fetch_grouped_day, date): date             │
│              for date in trading_dates                                         │
│          }                                                                      │
│                                                                                │
│          for future in as_completed(future_to_date):                          │
│              date_str = future_to_date[future]                                │
│              completed += 1                                                     │
│                                                                                │
│              try:                                                              │
│                  data = future.result()                                        │
│                  if data is not None and not data.empty:                       │
│                      all_data.append(data)                                     │
│                  else:                                                         │
│                      failed += 1                                               │
│                                                                                │
│                  if completed % 100 == 0:                                      │
│                      print(f"⚡ Progress: {completed}/{len(trading_dates)}")  │
│                                                                                │
│              except Exception as e:                                            │
│                  failed += 1                                                    │
│                  print(f"⚠️  Error fetching {date_str}: {e}")                 │
│                                                                                │
│      if all_data:                                                              │
│          return pd.concat(all_data)                                            │
│      return pd.DataFrame()                                                     │
│                                                                                │
│  def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:       │
│      """Fetch all tickers for ONE trading day"""                              │
│      url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"│
│      params = {                                                                │
│          'adjusted': 'false',                                                  │
│          'apiKey': self.api_key                                                │
│      }                                                                         │
│                                                                                │
│      try:                                                                      │
│          response = self.session.get(url, params=params, timeout=30)          │
│          response.raise_for_status()                                            │
│                                                                                │
│          data = response.json()                                                │
│          if 'results' not in data or not data['results']:                     │
│              return None                                                       │
│                                                                                │
│          results = data['results']                                             │
│          df = pd.DataFrame(results)                                            │
│          return df                                                             │
│                                                                                │
│      except Exception as e:                                                    │
│          print(f"⚠️  Error for {date_str}: {e}")                             │
│          return None                                                           │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘
│                                                                                │
│          print(f"🚀 Standardized Scanner Initialized")                         │
│          print(f"📅 Signal Range: {self.d0_start} to {self.d0_end}")            │
│          print(f"📊 Historical Range: {self.scan_start} to {self.scan_end}")    │
│                                                                                │
│      # ======================================================================== │
│      #  STAGE 1: MARKET UNIVERSE OPTIMIZATION                                   │
│      # ======================================================================== │
│                                                                                │
│      def execute_stage1_market_universe_optimization(self) -> list:          │
│          """                                                                   │
│          Stage 1: Fetch and filter ALL market tickers                        │
│                                                                                │
│          Returns:                                                               │
│              List of qualified ticker symbols (strings)                       │
│          """                                                                   │
│          import requests                                                      │
│          from datetime import datetime                                          │
│          from concurrent.futures import ThreadPoolExecutor, as_completed     │
│          import time                                                            │
│                                                                                │
│          print(f"\\n{'='*70}")                                                │
│          print("🚀 STAGE 1: MARKET UNIVERSE OPTIMIZATION")                       │
│          print(f"{'='*70}")                                                │
│                                                                                │
│          # Step 1: Fetch ALL tickers from Polygon                             │
│          all_tickers = self._fetch_all_market_tickers()                       │
│          print(f"📡 Fetched {len(all_tickers)} total tickers from market")    │
│                                                                                │
│          # Step 2: Apply smart filters to reduce dataset                      │
│          qualified_tickers = self._apply_smart_filters(all_tickers)          │
│          print(f"✅ Qualified universe: {len(qualified_tickers)} symbols "        │
│                f"({len(qualified_tickers)/len(all_tickers)*100}% of market)") │
│                                                                                │
│          return qualified_tickers                                               │
│                                                                                │
│      def _fetch_all_market_tickers(self) -> list:                             │
│          """Fetch ALL tickers from Polygon snapshot endpoint"""               │
│          try:                                                                │
│              # Polygon snapshot endpoint - ALL tickers in ONE call          │
│              url = f"{self.base_url}/v3/snapshot/locale/us/markets/stocks/tickers" │
│              params = {                                                        │
│                  'apiKey': self.api_key                                       │
│              }                                                                  │
│                                                                                │
│              response = self.session.get(url, params=params, timeout=30)     │
│              response.raise_for_status()                                      │
│                                                                                │
│              data = response.json()                                            │
│              return data.get('results', [])                                  │
│                                                                                │
│          except Exception as e:                                               │
│              print(f"❌ Error fetching market tickers: {e}")                   │
│              # Fallback to predefined list if API fails                        │
│              return self._get_fallback_ticker_universe()                      │
│                                                                                │
│      def _apply_smart_filters(self, tickers: list) -> list:                  │
│          """Apply intelligent pre-filters to reduce dataset by ~99%"""       │
│          qualified = []                                                       │
│                                                                                │
│          for ticker in tickers:                                              │
│              try:                                                            │
│                  # Get latest price data for filtering                       │
│                  url = f"{self.base_url}/v2/aggs/ticker/{ticker}/prev"     │
│                  params = {'apiKey': self.api_key}                            │
│                  response = self.session.get(url, params=params, timeout=10) │
│                                                                                  │
│                  if response.status_code != 200:                             │
│                      continue                                                 │
│                                                                                  │
│                  data = response.json()                                       │
│                  if not data or 'results' not in data or len(data['results']) == 0: │
│                      continue                                                 │
│                                                                                  │
│                  prev_candle = data['results'][0]                             │
│                  prev_close = prev_candle.get('c', 0)                         │
│                  volume = prev_candle.get('v', 0)                             │
│                                                                                  │
│                  # Apply standard filters                                      │
│                  if prev_close >= 8.0:  # Price minimum                      │
│                      qualified.append(ticker)                                │
│                                                                                  │
│              except Exception:                                               │
│                  continue  # Skip problematic tickers                       │
│                                                                                  │
│          return qualified                                                      │
│                                                                                │
│      # ======================================================================== │
│      #  STAGE 2: DATA ENRICHMENT                                                │
│      # ======================================================================== │
│                                                                                │
│      def execute_stage2_data_enrichment(self, qualified_tickers: list) -> dict: │
│          """                                                                   │
│          Stage 2: Fetch and enrich data for qualified symbols                 │
│                                                                                │
│          Args:                                                                 │
│              qualified_tickers: List of ticker symbols to process           │
│                                                                                │
│          Returns:                                                               │
│              Dictionary mapping ticker → enriched DataFrame                   │
│          """                                                                   │
│          import pandas as pd                                                   │
│          from concurrent.futures import ThreadPoolExecutor, as_completed     │
│          import time                                                            │
│                                                                                │
│          print(f"\\n{'='*70}")                                                │
│          print("🚀 STAGE 2: DATA ENRICHMENT")                                  │
│          print(f"{'='*70}")                                                │
│          print(f"📊 Enriching {len(qualified_tickers)} qualified symbols...")   │
│                                                                                │
│          enriched_data = {}                                                     │
│          completed = 0                                                         │
│                                                                                │
│          with ThreadPoolExecutor(max_workers=self.stage2_workers) as executor: │
│              future_to_ticker = {                                               │
│                  executor.submit(self._fetch_and_enrich_ticker, ticker): ticker │
│                  for ticker in qualified_tickers                               │
│              }                                                                   │
│                                                                                │
│              for future in as_completed(future_to_ticker):                   │
│                  ticker = future_to_ticker[future]                              │
│                  completed += 1                                               │
│                                                                                │
│                  try:                                                        │
│                      df = future.result()                                    │
│                      if df is not None and not df.empty:                     │
│                          enriched_data[ticker] = df                           │
│                  except Exception as e:                                       │
│                      print(f"⚠️  Failed to enrich {ticker}: {e}")             │
│                                                                                │
│                  if completed % 50 == 0:                                    │
│                      print(f"⚡ Progress: {completed}/{len(qualified_tickers)}") │
│                                                                                │
│          print(f"✅ Enriched {len(enriched_data)} symbols successfully")      │
│          return enriched_data                                                   │
│                                                                                │
│      def _fetch_and_enrich_ticker(self, ticker: str):                          │
│          """Fetch and enrich data for a single ticker"""                        │
│          import pandas as pd                                                   │
│          import time                                                            │
│                                                                                │
│          try:                                                                │
│              # Fetch daily bars                                                │
│              url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range"           │
│              params = {                                                        │
│                  'apiKey': self.api_key,                                       │
│                  'adjusted': 'false',                                          │
│                  'sort': 'asc',                                                │
│                  'limit': 5000                                                 │
│              }                                                                  │
│                                                                                │
│              response = self.session.get(url, params=params, timeout=30)     │
│              response.raise_for_status()                                      │
│                                                                                │
│              data = response.json()                                            │
│              if not data or 'results' not in data:                            │
│                  return None                                                   │
│                                                                                │
│              df = pd.DataFrame(data['results'])                               │
│              if df.empty:                                                      │
│                  return None                                                   │
│                                                                                │
│              # Parse dates                                                   │
│              df['timestamp'] = pd.to_datetime(df['t'])                         │
│              df.set_index('timestamp', inplace=True)                          │
│                                                                                │
│              # Compute technical indicators                                   │
│              df = self._compute_indicators(df)                               │
│                                                                                │
│              return df                                                        │
│                                                                                │
│          except Exception as e:                                               │
│              print(f"Error fetching {ticker}: {e}")                           │
│              return None                                                       │
│                                                                                │
│      def _compute_indicators(self, df: pd.DataFrame) -> pd.DataFrame:         │
│          """Compute all required technical indicators"""                      │
│          import pandas as pd                                                   │
│          import numpy as np                                                    │
│                                                                                │
│          # Moving averages                                                   │
│          df['ema9'] = df['c'].ewm(span=9, adjust=False).mean()               │
│          df['ema20'] = df['c'].ewm(span=20, adjust=False).mean()             │
│          df['sma50'] = df['c'].rolling(window=50).mean()                     │
│                                                                                │
│          # ATR (Average True Range)                                          │
│          df['high_low'] = df['h'] - df['l']                                   │
│          df['atr'] = df['high_low'].rolling(window=14).mean()                 │
│                                                                                │
│          # Volume metrics                                                   │
│          df['adv20'] = df['v'].rolling(window=20).mean()                     │
│                                                                                │
│          # Price changes                                                    │
│          df['pct_change'] = df['c'].pct_change()                              │
│                                                                                │
│          return df                                                            │
│                                                                                │
│      # ======================================================================== │
│      #  STAGE 3: PATTERN DETECTION                                              │
│      # ======================================================================== │
│                                                                                │
│      def execute_stage3_pattern_detection(self, enriched_data: dict) -> list: │
│          """                                                                   │
│          Stage 3: Execute user's pattern logic on enriched data              │
│                                                                                │
│          Args:                                                                 │
│              enriched_data: Dictionary of ticker → DataFrame               │
│                                                                                │
│          Returns:                                                               │
│              List of signal dictionaries with full details                    │
│          """                                                                   │
│          import pandas as pd                                                   │
│          from concurrent.futures import ThreadPoolExecutor, as_completed     │
│                                                                                │
│          print(f"\\n{'='*70}")                                                │
│          print("🚀 STAGE 3: PATTERN DETECTION")                               │
│          print(f"{'='*70}")                                                │
│          print(f"🔍 Scanning {len(enriched_data)} enriched symbols...")        │
│                                                                                │
│          all_signals = []                                                      │
│          completed = 0                                                         │
│                                                                                │
│          with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor: │
│              future_to_ticker = {                                               │
│                  executor.submit(self._scan_symbol_pattern, ticker, df):     │
│                  for ticker, df in enriched_data.items()                     │
│              }                                                                   │
│                                                                                │
│              for future in as_completed(future_to_ticker):                   │
│                  completed += 1                                               │
│                                                                                  │
│                  try:                                                        │
│                      signals = future.result()                                 │
│                      if signals:                                              │
│                          all_signals.extend(signals)                         │
│                  except Exception as e:                                       │
│                      pass  # Continue scanning other symbols                │
│                                                                                  │
│                  if completed % 20 == 0:                                    │
│                      print(f"⚡ Progress: {completed}/{len(enriched_data)} " │
│                            f"signals found: {len(all_signals)}")           │
│                                                                                │
│          print(f"✅ Pattern detection complete: {len(all_signals)} signals")  │
│          return all_signals                                                    │
│                                                                                │
│      def _scan_symbol_pattern(self, ticker: str, df: pd.DataFrame) -> list:   │
│          """                                                                   │
│          Execute user's original pattern logic on enriched data              │
│                                                                                │
│          This is where the user's strategy gets applied to the market       │
│          """                                                                   │
│          import pandas as pd                                                   │
│          import numpy as np                                                    │
│          from datetime import datetime                                          │
│                                                                                │
│          signals = []                                                         │
│                                                                                │
│          # Filter to user's date range (D0)                                 │
│          d0_start = pd.to_datetime(self.d0_start)                             │
│          d0_end = pd.to_datetime(self.d0_end)                                 │
│          df = df[(df.index >= d0_start) & (df.index <= d0_end)]                │
│                                                                                │
│          # ==================================================================== │
│          #  USER'S PATTERN LOGIC GOES HERE                                 │
│          # ==================================================================== │
│          # Transform their original logic to work with enriched data        │
│          # Use self.params dictionary for all parameter values             │
│          # ==================================================================== │
│                                                                                │
│          for idx, row in df.iterrows():                                      │
│              try:                                                            │
│                  # Check user's pattern conditions                          │
│                  if self._check_pattern_conditions(row):                     │
│                      signals.append({                                        │
│                          'symbol': ticker,                                 │
│                          'date': idx.strftime('%Y-%m-%d'),               │
│                          'price': row['c'],                                 │
│                          'volume': row['v'],                               │
│                          # Add all relevant details                             │
│                          'params': self.params.copy()                       │
│                      })                                                       │
│              except Exception as e:                                           │
│                  continue  # Skip problematic rows                         │
│                                                                                │
│          return signals                                                         │
│                                                                                │
│      def _check_pattern_conditions(self, row) -> bool:                       │
│          """                                                                   │
│          Check if row matches user's pattern conditions                     │
│          Override this method with user's specific logic                     │
│          """                                                                   │
│          # Default implementation - override in subclass                     │
│          return True                                                            │
│                                                                                │
│      # ======================================================================== │
│      #  MAIN EXECUTION METHOD                                                  │
│      # ======================================================================== │
│                                                                                │
│      def run_formatted_scan(self) -> list:                                    │
│          """                                                                   │
│          Main execution method - runs all 3 stages and returns results       │
│                                                                                │
│          Returns:                                                               │
│              List of signal dictionaries                                      │
│          """                                                                   │
│          import time                                                            │
│                                                                                │
│          start_time = time.time()                                             │
│                                                                                │
│          # Stage 1: Get qualified universe                                   │
│          qualified_tickers = self.execute_stage1_market_universe_optimization() │
│                                                                                │
│          if not qualified_tickers:                                            │
│              print("❌ No qualified tickers found")                           │
│              return []                                                        │
│                                                                                │
│          # Stage 2: Enrich data                                               │
│          enriched_data = self.execute_stage2_data_enrichment(qualified_tickers) │
│                                                                                │
│          if not enriched_data:                                                │
│              print("❌ No enriched data available")                          │
│              return []                                                        │
│                                                                                │
│          # Stage 3: Pattern detection                                        │
│          signals = self.execute_stage3_pattern_detection(enriched_data)      │
│                                                                                │
│          elapsed = time.time() - start_time                                   │
│          print(f"\\n🎉 Scan complete in {elapsed}s: {len(signals)} signals") │
│                                                                                │
│          return signals                                                        │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  2. REQUIRED IMPORTS BLOCK                                                    │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  # MUST appear at the top of EVERY scanner file:                            │
│                                                                                │
│  import pandas as pd                                                           │
│  import numpy as np                                                            │
│  import requests                                                               │
│  import time                                                                   │
│  from datetime import datetime, timedelta                                   │
│  from concurrent.futures import ThreadPoolExecutor, as_completed             │
│  import multiprocessing as mp                                                 │
│  from typing import List, Dict, Optional, Tuple, Any                         │
│  from requests.adapters import HTTPAdapter                                   │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  3. PARAMETER BLOCK STRUCTURE                                                  │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  # Extract user's parameters and preserve EXACTLY:                           │
│                                                                                │
│  self.params = {                                                              │
│      # ALL numeric parameters preserve decimal precision:                     │
│      "price_min": 8.0,                                                       │
│      "adv_min_usd": 30_000_000,                                             │
│      "lookback_days": 1000,                                                 │
│                                                                                │
│      # Boolean parameters use True/False (not strings):                       │
│      "require_volume_confirm": True,                                         │
│      "enforce_filters": False,                                              │
│                                                                                │
│      # String parameters use quotes:                                        │
│      "trigger_mode": "D1_or_D2",                                            │
│  }                                                                           │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  4. ERROR HANDLING PATTERN                                                      │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  # Wrap all API calls in try-except:                                        │
│                                                                                │
│  try:                                                                       │
│      response = self.session.get(url, params=params, timeout=30)          │
│      response.raise_for_status()                                            │
│  except requests.exceptions.RequestException as e:                         │
│      print(f"⚠️  API Error for {ticker}: {e}")                            │
│      return None  # or continue to next symbol                             │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  5. PERFORMANCE BEST PRACTICES                                                │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  ✅ DO:                                                                      │
│  - Use ThreadPoolExecutor for parallel processing                         │
│  - Set timeout on all requests (10-30 seconds)                            │
│  - Process in batches (100-200 symbols per batch)                         │
│  - Print progress updates every 50-100 symbols                            │
│  - Continue on individual symbol failures (fail gracefully)              │
│                                                                                │
│  ❌ DON'T:                                                                  │
│  - Process symbols sequentially (too slow)                                │
│  - Wait indefinitely for API responses (add timeouts)                     │
│  - Fail entire scan if one symbol errors                                  │
│  - Print progress for every symbol (too much output)                      │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────────────────┐
│  6. OUTPUT FORMAT                                                              │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                                │
│  # Return signals in standard format:                                       │
│                                                                                │
│  signals = [                                                                 │
│      {                                                                         │
│          'symbol': 'AAPL',                                                   │
│          'date': '2025-01-15',                                             │
│          'price': 175.23,                                                   │
│          'volume': 45_000_000,                                             │
│          'indicator1': 0.95,    # EMA9 value                             │
│          'indicator2': 'triggered',  # Pattern status                      │
│          # Add all relevant computed values                                 │
│      }                                                                         │
│  ]                                                                          │
│                                                                                │
└─────────────────────────────────────────────────────────────────────────────┘

╔═══════════════════════════════════════════════════════════════════════════════╗
║  TRANSFORMATION CHECKLIST                                                          ║
╠═══════════════════════════════════════════════════════════════════════════════╣
║                                                                                ║
║  When transforming user code, ENSURE:                                        ║
║                                                                                ║
║  ☑  Extract ALL parameters from user's code (preserving exact values)       ║
║  ☑  Transform hardcoded SYMBOLS list into market universe fetch            ║
║  ☑  Wrap sequential logic in parallel execution pattern                    ║
║  ☑  Add proper error handling with continue statements                       ║
║  ☑  Add progress indicators for user experience                           ║
║  ☑  Use HTTP session pooling for API efficiency                            ║
║  ☑  Filter results to user's requested date range (D0)                      ║
║  ☑  Return results in standard dictionary format                            ║
║                                                                                ║
╚═══════════════════════════════════════════════════════════════════════════════╝
`;

// ===== PROMPT GENERATION SERVICE =====

export class PromptGenerator {
  /**
   * Generate formatting prompt with code context
   *
   * Uses quick MASTER_FORMATTING_PROMPT for known scanner types
   * For unknown types or when detailed guidance needed, use generateDetailedPrompt()
   */
  static generateFormattingPrompt(code: string, filename: string): string {
    let prompt = '';

    // Add the master prompt
    prompt += MASTER_FORMATTING_PROMPT;

    // Add filename context
    prompt += `\n\n## FILE CONTEXT\n`;
    prompt += `Filename: ${filename}\n`;
    prompt += `Code Length: ${code.length} characters\n`;
    prompt += `Lines: ${code.split('\n').length}\n`;

    // Extract parameters from code
    const params = this.extractParameters(code);
    if (params.length > 0) {
      prompt += `\n## DETECTED PARAMETERS (${params.length})\n`;
      params.forEach(p => {
        prompt += `- ${p.name}: ${p.value}\n`;
      });
      prompt += `\nEnsure ALL ${params.length} parameters are preserved with EXACT values.\n`;
    }

    // CRITICAL: Include the actual code to format!
    prompt += `\n## ORIGINAL CODE TO TRANSFORM\n`;
    prompt += code;

    return prompt;
  }

  /**
   * Generate detailed formatting prompt with full standardization reference
   *
   * Use this for:
   * - Unknown/custom scanner types
   * - Complex code that doesn't match templates
   * - When AI needs more explicit structure guidance
   */
  static generateDetailedPrompt(code: string, filename: string, scannerType: string = 'Unknown'): string {
    let prompt = '';

    // Add the comprehensive standardization reference
    prompt += MASTER_STANDARDIZATION_REFERENCE;

    // Add filename context
    prompt += `\n\n## FILE CONTEXT\n`;
    prompt += `Filename: ${filename}\n`;
    prompt += `Code Length: ${code.length} characters\n`;
    prompt += `Lines: ${code.split('\n').length}\n`;
    prompt += `Scanner Type: ${scannerType}\n`;

    // Extract parameters from code
    const params = this.extractParameters(code);
    if (params.length > 0) {
      prompt += `\n## DETECTED PARAMETERS (${params.length})\n`;
      params.forEach(p => {
        prompt += `- ${p.name}: ${p.value}\n`;
      });
      prompt += `\n✅ MANDATORY: ALL ${params.length} parameters MUST be preserved with EXACT values.\n`;
      prompt += `Add them to self.params dictionary in __init__ method.\n`;
    }

    // Extract symbol list if present
    const symbolsMatch = code.match(/SYMBOLS\s*=\s*\[([^\]]+)\]/);
    if (symbolsMatch) {
      const symbolsList = symbolsMatch[1].split(',').map(s => s.trim().replace(/['"]/g, '')).slice(0, 5);
      prompt += `\n## DETECTED SYMBOLS\n`;
      prompt += `Original code has ${symbolsMatch[1].split(',').length} hardcoded symbols.\n`;
      prompt += `⚠️  CRITICAL: Replace hardcoded SYMBOLS with market universe fetch.\n`;
      prompt += `Use execute_stage1_market_universe_optimization() method from template.\n`;
    }

    // CRITICAL: Include the actual code to format!
    prompt += `\n## ORIGINAL CODE TO TRANSFORM\n`;
    prompt += code;

    // Add transformation instructions
    prompt += `\n\n## CRITICAL TRANSFORMATION INSTRUCTIONS\n`;
    prompt += `1. Follow the STANDARDIZED_SCANNER structure above EXACTLY\n`;
    prompt += `2. Extract user's pattern logic and place in _scan_symbol_pattern() method\n`;
    prompt += `3. Preserve ALL parameters with EXACT values in self.params dictionary\n`;
    prompt += `4. Replace hardcoded SYMBOLS list with market universe fetch (Stage 1)\n`;
    prompt += `5. Add proper error handling with try-except blocks\n`;
    prompt += `6. Add progress indicators (print statements every 50-100 symbols)\n`;
    prompt += `7. Return results in standard signal dictionary format\n`;
    prompt += `8. Add type hints to all method signatures\n`;
    prompt += `9. Include docstrings for all methods\n`;
    prompt += `10. Test that output matches: List[Dict] with symbol, date, price keys\n`;

    // 🎯 CRITICAL: Add column naming requirements to prevent pandas errors
    prompt += `\n\n## 🚨 CRITICAL: COLUMN NAMING AND PANDAS SYNTAX RULES\n`;
    prompt += `STAGE 1 DATA FETCHING (fetch_all_grouped_data method):\n`;
    prompt += `\`\`\`\n`;
    prompt += `# ✅ CORRECT: Rename Polygon API columns IMMEDIATELY after fetching\n`;
    prompt += `df = pd.DataFrame(data['results'])\n`;
    prompt += `df['date'] = pd.to_datetime(date_str)\n`;
    prompt += `df = df.rename(columns={\n`;
    prompt += `    'T': 'ticker',\n`;
    prompt += `    'o': 'open',\n`;
    prompt += `    'h': 'high',\n`;
    prompt += `    'l': 'low',\n`;
    prompt += `    'c': 'close',\n`;
    prompt += `    'v': 'volume',\n`;
    prompt += `    'vw': 'vwap',\n`;
    prompt += `    't': 'timestamp'\n`;
    prompt += `})\n`;
    prompt += `return df[['ticker', 'date', 'open', 'high', 'low', 'close', 'volume']]\n`;
    prompt += `\`\`\`\n`;
    prompt += `\n`;
    prompt += `STAGE 2 FEATURE COMPUTATION (compute_simple_features method):\n`;
    prompt += `\`\`\`\n`;
    prompt += `# ✅ CORRECT: Use renamed columns with .transform() method\n`;
    prompt += `df = df.sort_values(['ticker', 'date'])\n`;
    prompt += `df['ADV20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(\n`;
    prompt += `    lambda x: x.rolling(window=20, min_periods=20).mean()\n`;
    prompt += `)\n`;
    prompt += `\`\`\`\n`;
    prompt += `\n`;
    prompt += `# ❌ WRONG: Do NOT use Polygon column names ('T', 'c', 'v')\n`;
    prompt += `# ❌ WRONG: Do NOT use .reset_index() which causes duplicate labels error\n`;
    prompt += `# ❌ WRONG: Do NOT use .mean() directly without .transform()\n`;
    prompt += `# ❌ WRONG: Do NOT use .groupby().transform(lambda x: x.max(axis=1)) - causes KeyError!\n`;
    prompt += `# ❌ WRONG: Do NOT use axis parameter in transform lambda for Series operations\n`;
    prompt += `\n`;
    prompt += `MANDATORY: All column names must be renamed (ticker, close, volume, etc.) BEFORE any computations!\n`;
    prompt += `This prevents: "ValueError: cannot reindex on an axis with duplicate labels"\n`;
    prompt += `\n`;
    prompt += `For computing True Range (max of multiple columns):\n`;
    prompt += `  ✅ CORRECT: df['TR'] = df[['high_low', 'high_prev_close', 'low_prev_close']].max(axis=1)\n`;
    prompt += `  ❌ WRONG: df['TR'] = df.groupby('ticker')[[...]].transform(lambda x: x.max(axis=1))\n`;

    // Add execute method template with proper stage reporting
    prompt += `\n\n## 📊 EXECUTE METHOD TEMPLATE (Follow This Exact Structure)\n`;
    prompt += `\`\`\`python\n`;
    prompt += `def execute(self) -> pd.DataFrame:\n`;
    prompt += `    """\n`;
    prompt += `    Main execution pipeline - orchestrates all 3 stages\n`;
    prompt += `    """\n`;
    prompt += `    print(f"\\n{'=' \* 70}")\n`;
    prompt += `    print("🚀 {SCANNER_NAME} SCANNER - GROUPED ENDPOINT ARCHITECTURE")\n`;
    prompt += `    print(f"{'=' \* 70}")\n`;
    prompt += `    print(f"📅 Signal Range: {self.d0_start} to {self.d0_end}")\n`;
    prompt += `    print(f"📊 Historical Range: {self.scan_start} to {self.scan_end}")\n`;
    prompt += `\n`;
    prompt += `    # Get trading dates\n`;
    prompt += `    trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)\n`;
    prompt += `    print(f"📅 Trading days: {len(trading_dates)}")\n`;
    prompt += `\n`;
    prompt += `    # Stage 1: Fetch grouped data\n`;
    prompt += `    print(f"\\n{'=' \* 70}")\n`;
    prompt += `    print("🚀 STAGE 1: FETCH GROUPED DATA")\n`;
    prompt += `    print(f"{'=' \* 70}")\n`;
    prompt += `    df = self.fetch_all_grouped_data(trading_dates)\n`;
    prompt += `\n`;
    prompt += `    if df.empty:\n`;
    prompt += `        print("❌ No data available!")\n`;
    prompt += `        return pd.DataFrame()\n`;
    prompt += `\n`;
    prompt += `    print(f"✅ Fetched {len(df)} data points")\n`;
    prompt += `\n`;
    prompt += `    # Stage 2: Compute simple features + apply smart filters\n`;
    prompt += `    print(f"\\n{'=' \* 70}")\n`;
    prompt += `    print("🚀 STAGE 2: COMPUTE FEATURES + APPLY FILTERS")\n`;
    prompt += `    print(f"{'=' \* 70}")\n`;
    prompt += `    df = self.compute_simple_features(df)\n`;
    prompt += `    df = self.apply_smart_filters(df)\n`;
    prompt += `\n`;
    prompt += `    if df.empty:\n`;
    prompt += `        print("❌ No rows passed smart filters!")\n`;
    prompt += `        return pd.DataFrame()\n`;
    prompt += `\n`;
    prompt += `    print(f"✅ Filtered to {len(df)} qualified rows")\n`;
    prompt += `\n`;
    prompt += `    # Stage 3: Compute full features + detect patterns\n`;
    prompt += `    print(f"\\n{'=' \* 70}")\n`;
    prompt += `    print("🚀 STAGE 3: COMPUTE FULL FEATURES + SCAN PATTERNS")\n`;
    prompt += `    print(f"{'=' \* 70}")\n`;
    prompt += `    df = self.compute_full_features(df)\n`;
    prompt += `    signals = self.detect_patterns(df)\n`;
    prompt += `\n`;
    prompt += `    if signals.empty:\n`;
    prompt += `        print("❌ No signals found!")\n`;
    prompt += `        return pd.DataFrame()\n`;
    prompt += `\n`;
    prompt += `    # Filter to D0 range\n`;
    prompt += `    signals = signals[\n`;
    prompt += `        (signals['Date'] >= self.d0_start) &\n`;
    prompt += `        (signals['Date'] <= self.d0_end)\n`;
    prompt += `    ]\n`;
    prompt += `\n`;
    prompt += `    # Sort by date (chronological order)\n`;
    prompt += `    signals = signals.sort_values('Date').reset_index(drop=True)\n`;
    prompt += `\n`;
    prompt += `    print(f"\\n{'=' \* 70}")\n`;
    prompt += `    print(f"✅ SCAN COMPLETE")\n`;
    prompt += `    print(f"{'=' \* 70}")\n`;
    prompt += `    print(f"📊 Final signals (D0 range): {len(signals):,}")\n`;
    prompt += `    print(f"📊 Unique tickers: {signals['Ticker'].nunique():,}")\n`;
    prompt += `\n`;
    prompt += `    # Print all results\n`;
    prompt += `    if len(signals) > 0:\n`;
    prompt += `        print(f"\\n{'=' \* 70}")\n`;
    prompt += `        print("📊 SIGNALS FOUND:")\n`;
    prompt += `        print(f"{'=' \* 70}")\n`;
    prompt += `        for idx, row in signals.iterrows():\n`;
    prompt += `            print(f"  {row['Ticker']} | {row['Date']} | Close: $\{row['Close']} | Volume: {row['Volume']}")\n`;
    prompt += `\n`;
    prompt += `    return signals\n`;
    prompt += `\`\`\`\n`;

    // Add explicit True Range computation example to prevent the axis error
    prompt += `\n\n## 🎯 TRUE RANGE COMPUTATION EXAMPLE (Stage 3)\n`;
    prompt += `\`\`\`python\n`;
    prompt += `def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:\n`;
    prompt += `    """\n`;
    prompt += `    Compute all features for pattern detection\n`;
    prompt += `    """\n`;
    prompt += `    print(f"📈 Computing full features for {len(df):,} rows...")\n`;
    prompt += `\n`;
    prompt += `    # Compute True Range and ATR\n`;
    prompt += `    df['high_low'] = df['high'] - df['low']\n`;
    prompt += `    df['high_prev_close'] = (df['high'] - df['close'].shift(1)).abs()\n`;
    prompt += `    df['low_prev_close'] = (df['low'] - df['close'].shift(1)).abs()\n`;
    prompt += `\n`;
    prompt += `    # ✅ CORRECT: Direct max computation across columns\n`;
    prompt += `    df['TR'] = df[['high_low', 'high_prev_close', 'low_prev_close']].max(axis=1)\n`;
    prompt += `\n`;
    prompt += `    # Then compute ATR using groupby().transform()\n`;
    prompt += `    df['ATR_raw'] = df.groupby('ticker')['TR'].transform(\n`;
    prompt += `        lambda x: x.rolling(14, min_periods=14).mean()\n`;
    prompt += `    )\n`;
    prompt += `    df['ATR'] = df.groupby('ticker')['ATR_raw'].shift(1)\n`;
    prompt += `\n`;
    prompt += `    # ... rest of features\n`;
    prompt += `    return df\n`;
    prompt += `\`\`\`\n`;

    // CRITICAL: Add explicit completeness requirement
    prompt += `\n\n## 🎯 CRITICAL COMPLETENESS REQUIREMENTS\n`;
    prompt += `✅ MANDATORY: Generate a COMPLETE implementation with ALL methods:\n`;
    prompt += `   - __init__(): Full initialization with all parameters (MUST include worker info print)\n`;
    prompt += `   - get_trading_dates(): Get valid trading days using NYSE calendar\n`;
    prompt += `   - fetch_all_grouped_data(): Fetch ALL data using grouped endpoint (MUST show stage header)\n`;
    prompt += `   - _fetch_grouped_day(): Fetch one day's data (MUST use grouped endpoint URL)\n`;
    prompt += `   - compute_simple_features(): Compute basic features (price, volume, ADV)\n`;
    prompt += `   - apply_smart_filters(): Apply price/volume filters\n`;
    prompt += `   - compute_full_features(): Compute EMA, ATR, slopes\n`;
    prompt += `   - detect_patterns(): Scan for specific patterns\n`;
    prompt += `   - execute(): Main orchestration (MUST follow template above with stage headers)\n`;
    prompt += `   - run_and_save(): Execute and save to CSV\n`;
    prompt += `   - if __name__ == "__main__": CLI entry point with argparse\n`;
    prompt += `\n⚠️  CRITICAL PRINT FORMATTING REQUIREMENTS:\n`;
    prompt += `   ✅ __init__ MUST print: "🚀 GROUPED ENDPOINT MODE: {Scanner} Scanner"\n`;
    prompt += `   ✅ __init__ MUST print: "📅 Signal Output Range (D0): {start} to {end}"\n`;
    prompt += `   ✅ __init__ MUST print: "📊 Historical Data Range: {scan_start} to {scan_end}"\n`;
    prompt += `   ✅ __init__ MUST print: "⚡ Workers: Stage1={N}, Stage3={M}"\n`;
    prompt += `   ✅ execute() MUST print: "🚀 STAGE 1: FETCH GROUPED DATA" with separator lines\n`;
    prompt += `   ✅ execute() MUST print: "🚀 STAGE 2: COMPUTE FEATURES + APPLY FILTERS" with separator\n`;
    prompt += `   ✅ execute() MUST print: "🚀 STAGE 3: COMPUTE FULL FEATURES + SCAN PATTERNS" with separator\n`;
    prompt += `   ✅ execute() MUST print: "✅ SCAN COMPLETE" with final signal count\n`;
    prompt += `   ✅ Use separator lines: print(f"\\n{'='*70}") before each major stage\n`;
    prompt += `\n⚠️  DO NOT truncate or omit any methods!\n`;
    prompt += `⚠️  DO NOT use "..." or "# implementation omitted" placeholders!\n`;
    prompt += `⚠️  EVERY method must have COMPLETE implementation!\n`;
    prompt += `✅ Expected output: ~700-800 lines of complete Python code\n`;
    prompt += `✅ Reference implementation: /projects/edge-dev-exact/templates/backside_b/fixed_formatted.py (716 lines)\n`;

    return prompt;
  }

  /**
   * Extract parameters from code
   */
  static extractParameters(code: string): Array<{name: string, value: any}> {
    const params: Array<{name: string, value: any}> = [];

    // Find P configuration block
    const pConfigMatch = code.match(/P\s*=\s*\{([^}]+)\}/);
    if (pConfigMatch) {
      const pConfigText = pConfigMatch[1];
      const paramLines = pConfigText.split('\n').filter(line => line.includes(':'));

      for (const line of paramLines) {
        const match = line.match(/"([^"]+)"\s*:\s*([^,}]+)/);
        if (match) {
          const value = match[2].trim();
          let parsedValue: string | number | boolean = value;

          if (value.includes('.') || !isNaN(parseFloat(value))) {
            parsedValue = parseFloat(value);
          } else if (value === 'True' || value === 'False' || value === 'true' || value === 'false') {
            parsedValue = value === 'True' || value === 'true';
          } else if (value.includes('"')) {
            parsedValue = value.replace(/"/g, '');
          }

          params.push({ name: match[1], value: parsedValue });
        }
      }
    }

    return params;
  }
}
