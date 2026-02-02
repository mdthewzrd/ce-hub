/**
 * COMPREHENSIVE SCANNER TEMPLATE KNOWLEDGE BASE
 *
 * This file contains the complete reference knowledge for all scanner types.
 * Renata uses this to understand the exact structure and requirements for each scanner.
 */

export const SCANNER_TEMPLATES = {
  /**
   * BACKSIDE B SCANNER
   * ===================
   * Pattern: Parabolic breakdown signals
   * Reference: /projects/edge-dev-exact/templates/backside_b/fixed_formatted.py (716 lines)
   */
  backside_b: {
    name: "Backside B",
    pattern: "BACKSIDE PARABOLIC BREAKDOWN",
    class_name: "GroupedEndpointBacksideBScanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/backside_b/fixed_formatted.py",
    line_count: 716,
    architecture: "grouped_endpoint",
    description: `Identifies stocks in parabolic uptrends showing breakdown signals:
- Price >= $8 minimum
- ADV20 >= $30M daily value
- Volume >= 0.9x average (heavy volume)
- True Range >= 0.9x ATR (expanded range)
- 5-day EMA9 slope >= 3% (strong momentum)
- High >= 1.05x EMA9 (extended above average)
- Gap-up >= 0.75 ATR
- D1/D2 trigger logic`,
    key_parameters: {
      price_min: 8.0,
      adv20_min_usd: 30_000_000,
      abs_lookback_days: 1000,
      abs_exclude_days: 10,
      pos_abs_max: 0.75,
      trigger_mode: "D1_or_D2",
      atr_mult: 0.9,
      vol_mult: 0.9,
      d1_volume_min: 15_000_000,
      slope5d_min: 3.0,
      high_ema9_mult: 1.05,
      gap_div_atr_min: 0.75,
      open_over_ema9_min: 0.9,
      d1_green_atr_min: 0.30,
      require_open_gt_prev_high: true,
      enforce_d1_above_d2: true,
    },
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "_fetch_grouped_day",
      "compute_simple_features",
      "apply_smart_filters",
      "compute_full_features",
      "mold_check",
      "abs_window_analysis",
      "pos_between",
      "process_ticker_3",
      "detect_patterns",
      "execute",
      "run_and_save"
    ],
    lookback_days: 1050, // 1000 for ABS window + 50 buffer
    api_calls_per_day: 1, // Grouped endpoint efficiency
  },

  /**
   * A+ PARABOLIC SCANNER
   * ====================
   * Pattern: Parabolic uptrend continuation
   * Reference: /projects/edge-dev-exact/templates/a_plus_para/fixed_formatted.py (639 lines)
   */
  a_plus_para: {
    name: "A+ Para",
    pattern: "A+ DAILY PARABOLIC",
    class_name: "GroupedEndpointAPlusScanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/a_plus_para/fixed_formatted.py",
    line_count: 639,
    architecture: "grouped_endpoint",
    description: `Identifies stocks in strong parabolic uptrends:
- Price >= $8 minimum
- ADV20 >= $30M daily value
- Volume requirements
- EMA alignment checks
- Strong momentum indicators`,
    key_parameters: {
      price_min: 8.0,
      adv20_min_usd: 30_000_000,
      // Additional A+ specific parameters
    },
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "_fetch_grouped_day",
      "compute_simple_features",
      "apply_smart_filters",
      "compute_full_features",
      "detect_patterns",
      "execute",
      "run_and_save"
    ],
    lookback_days: 400,
    api_calls_per_day: 1,
  },

  /**
   * LC D2 MULTI-SCANNER
   * ===================
   * Pattern: 12 different D2/D3/D4 patterns for large caps
   * Reference: /projects/edge-dev-exact/templates/lc_d2/fixed_formatted.py (887 lines)
   */
  lc_d2: {
    name: "LC D2",
    pattern: "LARGE CAP D2/D3/D4 MULTI-PATTERN",
    class_name: "GroupedEndpointLCD2Scanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_d2/fixed_formatted.py",
    line_count: 887,
    architecture: "grouped_endpoint",
    description: `Multi-pattern detection for large cap stocks (12 patterns):
- lc_frontside_d3_extended_1: D3 with EMA alignment
- lc_backside_d3_extended_1: D3 without EMA alignment
- lc_frontside_d3_extended_2: D3 relaxed gap
- lc_backside_d3_extended_2: D3 high_chg ratio
- lc_frontside_d4_para: D4 EMA distance streak
- lc_backside_d4_para: D4 variant
- lc_frontside_d3_uptrend: D3 strong uptrend
- lc_backside_d3: D3 backside
- lc_frontside_d2_uptrend: D2 uptrend with close >= 0.7
- lc_frontside_d2: Basic D2
- lc_backside_d2: D2 backside
- lc_fbo: First breakout`,
    key_parameters: {
      // LC D2 specific parameters
    },
    pattern_count: 12,
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "_fetch_grouped_day",
      "compute_simple_features",
      "compute_full_features",
      "scan_lc_frontside_d3_extended_1",
      "scan_lc_backside_d3_extended_1",
      // ... all 12 pattern methods
      "execute",
      "run_and_save"
    ],
    lookback_days: 400,
    api_calls_per_day: 1,
  },

  /**
   * LC 3D GAP SCANNER
   * ==================
   * Pattern: 3-day gap patterns
   * Reference: /projects/edge-dev-exact/templates/lc_3d_gap/fixed_formatted.py (713 lines)
   */
  lc_3d_gap: {
    name: "LC 3D Gap",
    pattern: "LARGE CAP 3-DAY GAP",
    class_name: "GroupedEndpointLC3DGapScanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/lc_3d_gap/fixed_formatted.py",
    line_count: 713,
    architecture: "grouped_endpoint",
    description: "3-day gap pattern detection for large cap stocks",
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "compute_simple_features",
      "apply_smart_filters",
      "detect_3d_gap_patterns",
      "execute",
      "run_and_save"
    ],
    lookback_days: 400,
    api_calls_per_day: 1,
  },

  /**
   * D1 GAP SCANNER
   * ==============
   * Pattern: D1 gap signals
   * Reference: /projects/edge-dev-exact/templates/d1_gap/fixed_formatted.py (716 lines)
   */
  d1_gap: {
    name: "D1 Gap",
    pattern: "D1 GAP SIGNALS",
    class_name: "GroupedEndpointD1GapScanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/d1_gap/fixed_formatted.py",
    line_count: 716,
    architecture: "grouped_endpoint",
    description: "D1 gap pattern detection",
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "compute_simple_features",
      "detect_d1_gap_patterns",
      "execute",
      "run_and_save"
    ],
    lookback_days: 400,
    api_calls_per_day: 1,
  },

  /**
   * EXTENDED GAP SCANNER
   * ===================
   * Pattern: Extended gap analysis
   * Reference: /projects/edge-dev-exact/templates/extended_gap/fixed_formatted.py (710 lines)
   */
  extended_gap: {
    name: "Extended Gap",
    pattern: "EXTENDED GAP ANALYSIS",
    class_name: "GroupedEndpointExtendedGapScanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/extended_gap/fixed_formatted.py",
    line_count: 710,
    architecture: "grouped_endpoint",
    description: "Extended gap pattern detection with multi-day analysis",
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "compute_simple_features",
      "detect_extended_gap_patterns",
      "execute",
      "run_and_save"
    ],
    lookback_days: 400,
    api_calls_per_day: 1,
  },

  /**
   * SC DMR SCANNER
   * ==============
   * Pattern: Specialized pattern detection
   * Reference: /projects/edge-dev-exact/templates/sc_dmr/fixed_formatted.py (799 lines)
   */
  sc_dmr: {
    name: "SC DMR",
    pattern: "SPECIALIZED PATTERN",
    class_name: "GroupedEndpointSCDMRScanner",
    file_path: "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-exact/templates/sc_dmr/fixed_formatted.py",
    line_count: 799,
    architecture: "grouped_endpoint",
    description: "Specialized pattern detection for specific market conditions",
    required_methods: [
      "get_trading_dates",
      "fetch_all_grouped_data",
      "compute_simple_features",
      "detect_sc_dmr_patterns",
      "execute",
      "run_and_save"
    ],
    lookback_days: 400,
    api_calls_per_day: 1,
  },
};

/**
 * GROUPED ENDPOINT ARCHITECTURE - UNIVERSAL PATTERN
 *
 * ALL scanner templates follow this exact architecture:
 */
export const GROUPED_ENDPOINT_ARCHITECTURE = `
╔═══════════════════════════════════════════════════════════════════════════════╗
║              GROUPED ENDPOINT ARCHITECTURE - UNIVERSAL STANDARD                   ║
║                    ALL SCANNERS MUST FOLLOW THIS EXACT STRUCTURE                  ║
╚═══════════════════════════════════════════════════════════════════════════════╝

CRITICAL ARCHITECTURE REQUIREMENTS:
====================================

1. API STRATEGY: GROUPED ENDPOINT (NOT SNAPSHOT)
   - Endpoint: /v2/aggs/grouped/locale/us/market/stocks/{date}
   - ONE API call per trading day (not per ticker)
   - Returns ALL tickers that traded that day
   - Efficiency: 456 calls vs 12,000+ calls (96% reduction)

2. REQUIRED IMPORTS:
   \`\`\`python
   import pandas as pd
   import numpy as np
   import requests
   import time
   from datetime import datetime, timedelta
   from concurrent.futures import ThreadPoolExecutor, as_completed
   import pandas_market_calendars as mcal  # CRITICAL: For NYSE calendar
   from typing import List, Dict, Optional, Tuple
   from requests.adapters import HTTPAdapter
   \`\`\`

3. CLASS STRUCTURE:
   \`\`\`python
   class GroupedEndpoint{ScannerName}Scanner:
       def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
           # HTTP Session with connection pooling
           self.session = requests.Session()
           self.session.mount('https://', HTTPAdapter(
               pool_connections=100,
               pool_maxsize=100,
               max_retries=2,
               pool_block=False
           ))

           # NYSE Calendar for trading days
           self.us_calendar = mcal.get_calendar('NYSE')

           # Date ranges
           self.d0_start = d0_start or "2025-01-01"
           self.d0_end = d0_end or "2025-12-31"
           self.scan_start = (calculate based on lookback)
           self.scan_end = self.d0_end

           # Workers
           self.stage1_workers = 5  # Parallel grouped data fetching
           self.stage3_workers = 10  # Parallel pattern detection
           self.batch_size = 200
   \`\`\`

4. THREE-STAGE ARCHITECTURE:

   STAGE 1: FETCH GROUPED DATA
   ==========================
   def get_trading_dates(self, start_date: str, end_date: str) -> List[str]:
       """Get NYSE trading days using pandas_market_calendars"""
       schedule = self.us_calendar.schedule(start_date, end_date)
       trading_days = self.us_calendar.valid_days(start_date, end_date)
       return [date.strftime('%Y-%m-%d') for date in trading_days]

   def fetch_all_grouped_data(self, trading_dates: List[str]) -> pd.DataFrame:
       """
       Stage 1: Fetch ALL data for ALL tickers using grouped endpoint
       One API call per trading day - MUCH MORE EFFICIENT
       """
       with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
           future_to_date = {
               executor.submit(self._fetch_grouped_day, date): date
               for date in trading_dates
           }
           all_data = []
           for future in as_completed(future_to_date):
               data = future.result()
               if data is not None:
                   all_data.append(data)
       return pd.concat(all_data)

   def _fetch_grouped_day(self, date_str: str) -> Optional[pd.DataFrame]:
       """Fetch all tickers for ONE trading day"""
       url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
       params = {
           'adjusted': 'false',
           'apiKey': self.api_key
       }
       response = self.session.get(url, params=params, timeout=30)
       response.raise_for_status()

       data = response.json()
       if 'results' not in data:
           return None

       results = data['results']
       df = pd.DataFrame(results)
       return df

   STAGE 2: COMPUTE SIMPLE FEATURES / APPLY SMART FILTERS
   =====================================================
   def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
       """Compute basic features for filtering"""
       # Previous close
       df['prev_close'] = df.groupby('T')['c'].shift(1)

       # Daily dollar value
       df['daily_dollar_value'] = df['c'] * df['v']

       # ADV20 (approximate with available data)
       df['adv20'] = df.groupby('T')['v'].transform(
           lambda x: x.rolling(20, min_periods=1).mean()
       )
       df['adv20_usd'] = df['adv20'] * df['c']

       return df

   def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
       """Apply filters to reduce dataset by ~99%"""
       # Filter by price
       df = df[df['c'] >= self.params['price_min']]

       # Filter by ADV
       df = df[df['adv20_usd'] >= self.params['adv20_min_usd']]

       # Filter by volume
       df = df[df['v'] >= (df['adv20'] * self.params['vol_mult'])]

       return df

   STAGE 3: COMPUTE FULL FEATURES + SCAN PATTERNS
   =============================================
   def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
       """Compute all technical indicators"""
       # EMA9
       df['EMA9'] = df.groupby('T')['c'].transform(
           lambda x: x.ewm(span=9, adjust=False).mean()
       )

       # ATR (Average True Range)
       df['prev_high'] = df.groupby('T')['h'].shift(1)
       df['prev_low'] = df.groupby('T')['l'].shift(1)
       df['prev_close'] = df.groupby('T')['c'].shift(1)

       df['true_range'] = np.maximum(
           df['h'] - df['l'],
           np.maximum(
               abs(df['h'] - df['prev_close']),
               abs(df['l'] - df['prev_close'])
           )
       )
       df['ATR'] = df.groupby('T')['true_range'].transform(
           lambda x: x.ewm(span=14, adjust=False).mean()
       )

       # Additional indicators as needed...
       return df

   def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
       """Scan for specific patterns"""
       signals = []

       for ticker in df['T'].unique():
           ticker_df = df[df['T'] == ticker].copy()

           # Apply pattern logic
           for idx, row in ticker_df.iterrows():
               if self._check_pattern(ticker_df, idx):
                   signals.append({
                       'symbol': ticker,
                       'date': row['t'],
                       'close': row['c'],
                       # Add all relevant fields
                   })

       return pd.DataFrame(signals)

   def execute(self) -> pd.DataFrame:
       """Main orchestration - calls all 3 stages"""
       # Stage 1
       trading_dates = self.get_trading_dates(self.scan_start, self.scan_end)
       all_data = self.fetch_all_grouped_data(trading_dates)

       # Stage 2
       simple_features = self.compute_simple_features(all_data)
       filtered_data = self.apply_smart_filters(simple_features)

       # Stage 3
       full_features = self.compute_full_features(filtered_data)
       signals = self.detect_patterns(full_features)

       # Filter to D0 range
       signals = signals[
           (signals['date'] >= self.d0_start) &
           (signals['date'] <= self.d0_end)
       ]

       return signals

   def run_and_save(self, output_path: str = "results.csv"):
       """Execute and save results"""
       results = self.execute()
       results.to_csv(output_path, index=False)
       return results

5. COMMAND LINE INTERFACE:
   ==========================
   if __name__ == "__main__":
       import sys

       d0_start = sys.argv[1] if len(sys.argv) > 1 else None
       d0_end = sys.argv[2] if len(sys.argv) > 2 else None

       scanner = GroupedEndpoint{ScannerName}Scanner(
           d0_start=d0_start,
           d0_end=d0_end
       )

       results = scanner.run_and_save()

PERFORMANCE METRICS:
===================
- API Calls: 456 (one per trading day) vs 12,000+ (per ticker)
- Execution Time: 60-120 seconds vs 10+ minutes
- Efficiency: 96% reduction in API calls
- Accuracy: 100% - no false negatives

EXPECTED OUTPUT SIZE:
====================
- Average: 700-800 lines of complete Python code
- Minimum: 600 lines
- Maximum: 900 lines (for complex multi-scanners like LC D2)

COMMON MISTAKES TO AVOID:
=========================
❌ DO NOT use /v2/snapshot/locale/us/markets/stocks/tickers endpoint
   This is 10x slower (5000+ API calls vs 456)

❌ DO NOT skip pandas_market_calendars
   You need accurate NYSE trading days

❌ DO NOT use individual ticker fetching
   Always use grouped endpoint for Stage 1

❌ DO NOT omit connection pooling
   HTTPAdapter is required for performance

✅ ALWAYS use grouped endpoint architecture
✅ ALWAYS include pandas_market_calendars
✅ ALWAYS implement all 3 stages completely
✅ ALWAYS support command-line date arguments
✅ ALWAYS return 700+ lines of complete code
`;

/**
 * Extract template knowledge by scanner type
 */
export function getTemplateKnowledge(scannerType: string) {
  return SCANNER_TEMPLATES[scannerType as keyof typeof SCANNER_TEMPLATES];
}

/**
 * Get all template file paths for reference
 */
export function getAllTemplatePaths(): string[] {
  return Object.values(SCANNER_TEMPLATES).map(t => t.file_path);
}

/**
 * Detect scanner type from code patterns
 */
export function detectScannerType(code: string): string | null {
  if (code.includes('Backside B') || code.includes('backside') || code.includes('BACKSIDE')) {
    return 'backside_b';
  }
  if (code.includes('A+ Para') || code.includes('A_plus') || code.includes('parabolic')) {
    return 'a_plus_para';
  }
  if (code.includes('LC D2') || code.includes('lc_d2') || code.includes('lc_frontside_d2')) {
    return 'lc_d2';
  }
  if (code.includes('LC 3D') || code.includes('lc_3d') || code.includes('3d_gap')) {
    return 'lc_3d_gap';
  }
  if (code.includes('D1 Gap') || code.includes('d1_gap')) {
    return 'd1_gap';
  }
  if (code.includes('Extended Gap') || code.includes('extended_gap')) {
    return 'extended_gap';
  }
  if (code.includes('SC DMR') || code.includes('sc_dmr')) {
    return 'sc_dmr';
  }
  return null;
}

export default {
  SCANNER_TEMPLATES,
  GROUPED_ENDPOINT_ARCHITECTURE,
  getTemplateKnowledge,
  getAllTemplatePaths,
  detectScannerType,
};
