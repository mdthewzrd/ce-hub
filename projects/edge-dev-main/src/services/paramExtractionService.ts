/**
 * 🎯 Param Extraction & Preservation Service
 *
 * Extracts parameters and logic from uploaded scanners BEFORE transformation
 * Ensures param integrity is maintained through Renata's V31 conversion
 */

export interface ScannerParams {
  // Price filters
  price_min?: number;
  adv20_min_usd?: number;

  // Backside context
  abs_lookback_days?: number;
  abs_exclude_days?: number;
  pos_abs_max?: number;

  // Trigger mold
  trigger_mode?: string;
  atr_mult?: number;
  vol_mult?: number;
  d1_vol_mult_min?: number;
  d1_volume_min?: number;

  // Technical indicators
  slope5d_min?: number;
  high_ema9_mult?: number;
  d1_green_atr_min?: number;

  // Trade-day gates
  gap_div_atr_min?: number;
  open_over_ema9_min?: number;
  require_open_gt_prev_high?: boolean;
  enforce_d1_above_d2?: boolean;

  // Raw P dict for reference
  raw_params?: Record<string, any>;
}

export interface ExtractedLogic {
  params: ScannerParams;
  detectPatternsLogic: string;  // Original detect_patterns function
  helperFunctions: string[];     // Helper functions used
  imports: string[];              // Required imports
}

/**
 * Extract parameters from P dict in scanner code
 */
export function extractParamsFromCode(code: string): ScannerParams {
  const params: ScannerParams = {
    raw_params: {}
  };

  // Extract P dict definition
  const pDictMatch = code.match(/P\s*=\s*{([^}]+)}/s);
  if (pDictMatch) {
    const pDictContent = pDictMatch[1];

    // Extract individual parameters using regex
    const paramPatterns = {
      price_min: /["']price_min["']\s*:\s*([\d.]+)/,
      adv20_min_usd: /["']adv20_min_usd["']\s*:\s*([\d_]+)/,
      abs_lookback_days: /["']abs_lookback_days["']\s*:\s*([\d]+)/,
      abs_exclude_days: /["']abs_exclude_days["']\s*:\s*([\d]+)/,
      pos_abs_max: /["']pos_abs_max["']\s*:\s*([\d.]+)/,
      trigger_mode: /["']trigger_mode["']\s*:\s*["']([^"']+)["']/,
      atr_mult: /["']atr_mult["']\s*:\s*([\d.]+)/,
      vol_mult: /["']vol_mult["']\s*:\s*([\d.]+)/,
      d1_vol_mult_min: /["']d1_vol_mult_min["']\s*:\s*(None|null|[\d.]+)/,
      d1_volume_min: /["']d1_volume_min["']\s*:\s*(None|null|[\d_]+)/,
      slope5d_min: /["']slope5d_min["']\s*:\s*([\d.]+)/,
      high_ema9_mult: /["']high_ema9_mult["']\s*:\s*([\d.]+)/,
      d1_green_atr_min: /["']d1_green_atr_min["']\s*:\s*([\d.]+)/,
      gap_div_atr_min: /["']gap_div_atr_min["']\s*:\s*([\d.]+)/,
      open_over_ema9_min: /["']open_over_ema9_min["']\s*:\s*([\d.]+)/,
    };

    // Extract each parameter
    (Object.entries(paramPatterns) as [string, RegExp][]).forEach(([key, pattern]) => {
      const match = pDictContent.match(pattern);
      if (match) {
        let value: any = match[1];

        // Convert to appropriate type
        if (key === 'trigger_mode') {
          value = value;
        } else if (key.includes('_min') || key.includes('_max')) {
          value = parseFloat(value);
        } else if (value === 'None' || value === 'null') {
          value = null;
        } else {
          value = parseFloat(value.replace(/_/g, ''));
        }

        (params as any)[key] = value;
        params.raw_params![key] = value;
      }
    });

    // Handle boolean parameters
    if (/["']require_open_gt_prev_high["']\s*:\s*True/.test(pDictContent)) {
      params.require_open_gt_prev_high = true;
      params.raw_params!.require_open_gt_prev_high = true;
    }
    if (/["']enforce_d1_above_d2["']\s*:\s*True/.test(pDictContent)) {
      params.enforce_d1_above_d2 = true;
      params.raw_params!.enforce_d1_above_d2 = true;
    }
  }

  console.log('📊 Extracted params:', params);
  return params;
}

/**
 * Extract the original detect_patterns logic (or equivalent)
 */
export function extractDetectionLogic(code: string): string {
  // Try to find detect_patterns function
  // NOTE: Fixed regex to handle:
  // 1. Empty lines between functions using [\s\S] instead of \s
  // 2. Return type annotations like -> pd.DataFrame:
  // 3. Only stop at comments at column 0 (section separators), not inline comments
  const detectPatternsMatch = code.match(
    /def\s+detect_patterns\s*\([^)]*\)(?:\s*->\s*[^:]+)?\s*:[\s\S]*?(?=\n\s{0,4}def\s|\n\s{0,4}class\s|\n#)/,
  );

  if (detectPatternsMatch) {
    return detectPatternsMatch[0];
  }

  // Try to find scan_symbol or other pattern detection function
  // FIXED: Only stop at comments at column 0 (section separators), not inline comments
  const alternativeMatch = code.match(
    /def\s+(scan_symbol|process_ticker|scan_daily_para)\s*\([^)]*\)(?:\s*->\s*[^:]+)?\s*:[\s\S]*?(?=\n\s{0,4}def\s|\n\s{0,4}class\s|\n#)/,
  );

  if (alternativeMatch) {
    return alternativeMatch[0];
  }

  // Fallback: find main loop logic
  const mainLoopMatch = code.match(
    /for\s+i\s+in\s+range\s*\([^)]+\):[\s\S]*?(?=\n\s{0,4}(def\s|\nclass\s|return\s|#.*===|$))/
  );

  if (mainLoopMatch) {
    return mainLoopMatch[0];
  }

  return '';
}

/**
 * Extract helper functions used by the scanner
 */
export function extractHelperFunctions(code: string): string[] {
  const helpers: string[] = [];

  // Common helper function patterns
  const helperPatterns = [
    /def\s+(abs_top_window|pos_between|_mold_on_row)\s*\([^)]*\)\s*:[\s\S]*?(?=\n\s{0,4}(def\s|\nclass\s|$))/g,
    /def\s+\w+.*:\s*""".*?helper.*?"""[\s\S]*?(?=\n\s{0,4}(def\s|\nclass\s|$))/gi
  ];

  helperPatterns.forEach(pattern => {
    const matches = code.matchAll(pattern);
    for (const match of matches) {
      if (match[0]) {
        helpers.push(match[0]);
      }
    }
  });

  return helpers;
}

/**
 * Extract imports from code
 */
export function extractImports(code: string): string[] {
  const imports: string[] = [];

  // Match import statements
  const importPatterns = [
    /^import\s+.+$/gm,
    /^from\s+.+import\s+.+$/gm
  ];

  importPatterns.forEach(pattern => {
    const matches = code.match(pattern);
    if (matches) {
      imports.push(...matches);
    }
  });

  return [...new Set(imports)];  // Deduplicate
}

/**
 * Main extraction function - gets all logic that needs to be preserved
 */
export function extractScannerLogic(code: string): ExtractedLogic {
  console.log('🔍 Extracting scanner logic...');

  const params = extractParamsFromCode(code);
  const detectPatternsLogic = extractDetectionLogic(code);
  const helperFunctions = extractHelperFunctions(code);
  const imports = extractImports(code);

  console.log('✅ Extraction complete:');
  console.log(`   - Params: ${Object.keys(params.raw_params || {}).length} parameters`);
  console.log(`   - Detection logic: ${detectPatternsLogic.length} chars`);
  console.log(`   - Helper functions: ${helperFunctions.length} functions`);
  console.log(`   - Imports: ${imports.length} imports`);

  return {
    params,
    detectPatternsLogic,
    helperFunctions,
    imports
  };
}

/**
 * Generate smart filter config from extracted params
 */
export function generateSmartFilterConfig(params: ScannerParams): string {
  const filters: string[] = [];

  if (params.price_min) {
    filters.push(`        # Price filter (from original: price_min=${params.price_min})`);
    filters.push(`        if 'price_min' in self.params:`);
    filters.push(`            min_price = self.params['price_min']`);
    filters.push(`            filtered_df = filtered_df[filtered_df['close'] >= min_price]`);
    filters.push('');
  }

  if (params.adv20_min_usd) {
    filters.push(`        # ADV filter (from original: adv20_min_usd=$${(params.adv20_min_usd / 1_000_000).toFixed(0)}M)`);
    filters.push(`        if 'adv20_min_usd' in self.params:`);
    filters.push(`            min_adv = self.params['adv20_min_usd']`);
    filters.push(`            daily_value = filtered_df['close'] * filtered_df['volume']`);
    filters.push(`            filtered_df = filtered_df[daily_value >= min_adv]`);
    filters.push('');
  }

  if (params.d1_volume_min) {
    filters.push(`        # D-1 volume floor (from original: d1_volume_min=${params.d1_volume_min})`);
    filters.push(`        if 'd1_volume_min' in self.params:`);
    filters.push(`            min_vol = self.params['d1_volume_min']`);
    filters.push(`            filtered_df = filtered_df[filtered_df['volume'] >= min_vol]`);
    filters.push('');
  }

  if (filters.length === 0) {
    return `        # No smart filters configured - using default filters\n        pass`;
  }

  return filters.join('\n');
}

/**
 * Generate enhanced system prompt with param preservation
 */
export function generateParamPreservingSystemPrompt(extracted: ExtractedLogic): string {
  const { params, detectPatternsLogic, helperFunctions, imports } = extracted;

  return `# Renata Final V - EdgeDev v31 Scanner Developer with PARAM INTEGRITY

You are an expert Python trading scanner developer specializing in EdgeDev v31 standards.

## 🚨 CRITICAL: PRESERVE ORIGINAL LOGIC

The user's scanner has been analyzed. You MUST preserve:

### 1. ORIGINAL PARAMETERS (extracted from uploaded scanner):
\`\`\`python
P = {
${Object.entries(params.raw_params || {}).map(([k, v]) => `    "${k}": ${v === null ? 'None' : JSON.stringify(v)}`).join(',\n')}
}
\`\`\`

### 2. ORIGINAL DETECTION LOGIC:
\`\`\`python
${detectPatternsLogic || '# No detection logic found - user will need to add this manually'}
\`\`\`

### 3. HELPER FUNCTIONS (if any):
${helperFunctions.length > 0 ? helperFunctions.map(h => `\`\`\`python\n${h}\n\`\`\``).join('\n') : '# No helper functions found'}

## YOUR TASK:

1. ✅ Wrap the original code in V31 structure
2. ✅ Add required V31 methods (fetch_grouped_data, apply_smart_filters, etc.)
3. ✅ CRITICAL: Preserve the original detection logic IN detect_patterns()
4. ✅ CRITICAL: Use the extracted parameters in apply_smart_filters()
5. ✅ Do NOT simplify or lose any original logic

## ⚠️ ANTI-PLACEHOLDER PROTOCOL:

**The extracted logic shown above in "ORIGINAL DETECTION LOGIC" contains REAL code with 3800+ characters.**
- You MUST transplant this logic into the detect_patterns() method
- You MUST NOT use placeholder code like "pass", "return data", or "TODO"
- You MUST NOT simplify the extracted logic - use it verbatim
- If the extracted logic calls helper functions, include those helper functions in your output
- The template below shows WHERE to put the logic, but you must REPLACE the placeholder with ACTUAL CODE

## V31 TEMPLATE STRUCTURE:

\`\`\`python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import pandas_market_calendars as mcal
${imports.map(i => i).join('\n')}

class PreservedScanner:
    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"

        # ✅ V31: Use _user suffix
        self.d0_start_user = d0_start or self.get_default_d0_start()
        self.d0_end_user = d0_end or self.get_default_d0_end()

        # ✅ Preserve original parameters
        self.params = {
${Object.entries(params.raw_params || {}).map(([k, v]) => `            "${k}": ${v === null ? 'None' : JSON.stringify(v)}`).join(',\n')}
        }

        # Calculate scan_start with lookback buffer
        lookback_buffer = ${params.abs_lookback_days || 50}
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')

        self.nyse = mcal.get_calendar('XNYS')

    def get_default_d0_start(self):
        return (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    def get_default_d0_end(self):
        return datetime.now().strftime('%Y-%m-%d')

    def run_scan(self):
        """✅ V31 REQUIRED: Main entry point"""
        trading_dates = self.get_trading_dates(self.scan_start, self.d0_end_user)

        # Stage 1: Fetch data
        stage1_data = self.fetch_grouped_data(trading_dates)

        # Stage 2a: Compute simple features
        stage2a_data = self.compute_simple_features(stage1_data)

        # Stage 2b: Apply smart filters (using original params!)
        stage2b_data = self.apply_smart_filters(stage2a_data)

        # Stage 3a: Compute full features
        stage3a_data = self.compute_full_features(stage2b_data)

        # Stage 3b: Detect patterns (using original logic!)
        results = self.detect_patterns(stage3a_data)

        return results

    def get_trading_dates(self, start_date: str, end_date: str) -> list:
        dates = self.nyse.valid_days(start_date=pd.to_datetime(start_date), end_date=pd.to_datetime(end_date))
        return [d.strftime('%Y-%m-%d') for d in dates]

    def fetch_grouped_data(self, trading_dates: list) -> pd.DataFrame:
        """✅ V31: Stage 1 - Fetch grouped data"""
        all_data = []
        for date in trading_dates:
            url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date}"
            params = {"apiKey": self.api_key, "adjusted": "true"}
            try:
                resp = requests.get(url, params=params, timeout=30)
                resp.raise_for_status()
                rows = resp.json().get("results", [])
                if rows:
                    df_temp = pd.DataFrame(rows)
                    df_temp['date'] = pd.to_datetime(df_temp['t'], unit='ms').dt.strftime('%Y-%m-%d')
                    df_temp = df_temp.rename(columns={"o": "open", "h": "high", "l": "low", "c": "close", "v": "volume", "T": "ticker"})
                    all_data.append(df_temp[['date', 'ticker', 'open', 'high', 'low', 'close', 'volume']])
            except Exception as e:
                continue

        if not all_data:
            return pd.DataFrame()

        df = pd.concat(all_data, ignore_index=True)
        return df.sort_values(['ticker', 'date']).reset_index(drop=True)

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 2a - Basic features"""
        if df.empty:
            return df

        result_dfs = []
        for ticker in df['ticker'].unique():
            df_t = df[df['ticker'] == ticker].copy().sort_values('date')

            # Price features
            df_t['prev_close'] = df_t['close'].shift(1)
            df_t['gap_pct'] = (df_t['open'] / df_t['prev_close'] - 1) * 100

            # ATR (14-period)
            high_low = df_t['high'] - df_t['low']
            high_close = np.abs(df_t['high'] - df_t['prev_close'])
            low_close = np.abs(df_t['low'] - df_t['prev_close'])
            true_range = pd.concat([high_low, high_close, low_close], axis=1).max(axis=1)
            df_t['atr14'] = true_range.rolling(window=14, min_periods=1).mean()

            # Volume ADV20
            df_t['adv20'] = df_t['volume'].rolling(window=20, min_periods=1).mean()
            df_t['adv20_usd'] = df_t['adv20'] * df_t['close']

            result_dfs.append(df_t)

        return pd.concat(result_dfs, ignore_index=True) if result_dfs else pd.DataFrame()

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 2b - Smart filters using ORIGINAL parameters"""
        if df.empty:
            return df

        # Split historical from output range
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)].copy()
        df_output_range = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # Apply filters using extracted parameters
${generateSmartFilterConfig(params).split('\n').map(line => '        ' + line).join('\n')}

        # Combine: all historical + filtered output
        df_combined = pd.concat([df_historical, df_output_filtered])

        # Keep only tickers with 1+ valid D0 dates
        tickers_with_valid_d0 = df_output_filtered['ticker'].unique()
        return df_combined[df_combined['ticker'].isin(tickers_with_valid_d0)]

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 3a - All remaining features"""
        if df.empty:
            return df

        result_dfs = []
        for ticker in df['ticker'].unique():
            df_t = df[df['ticker'] == ticker].copy().sort_values('date')

            # EMAs
            df_t['ema9'] = df_t['close'].ewm(span=9, adjust=False).mean()
            df_t['ema21'] = df_t['close'].ewm(span=21, adjust=False).mean()

            result_dfs.append(df_t)

        return pd.concat(result_dfs, ignore_index=True) if result_dfs else pd.DataFrame()

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 3b - Pattern detection with ORIGINAL logic preserved"""
        if df.empty:
            return pd.DataFrame()

        # Filter to D0 range
        df_d0 = df[df['date'].between(self.d0_start_user, self.d0_end_user)].copy()

        # 🚨 CRITICAL: Use original detection logic here
        # The extracted logic has been preserved below:
        rows = []

        for sym in df_d0['ticker'].unique():
            m = df_d0[df_d0['ticker'] == sym].sort_values('date')

            for i in range(2, len(m)):
                # 🚨 CRITICAL: INSERT THE EXTRACTED DETECTION LOGIC HERE VERBATIM
                # DO NOT use placeholder code like "pass" or "return data"
                # You MUST use the actual detection logic that was extracted above
                # The extracted logic is in the "ORIGINAL DETECTION LOGIC" section
                # Copy it here exactly as provided, adapting variable names as needed
                pass  # ← DELETE THIS LINE and replace with the actual extracted logic!

        return pd.DataFrame(rows)
\`\`\`

## V31 MANDATORY REQUIREMENTS:

### ✅ ALWAYS INCLUDE:
1. \`self.d0_start_user\` / \`self.d0_end_user\` variables
2. \`self.params\` dict with ORIGINAL parameters preserved
3. \`def run_scan(self):\` main entry point
4. \`def fetch_grouped_data(self, trading_dates):\` method
5. \`def apply_smart_filters(self, df):\` with ORIGINAL params
6. \`def compute_simple_features(self, df):\` method
7. \`def compute_full_features(self, df):\` method
8. \`def detect_patterns(self, df):\` with ORIGINAL logic移植ed

### ❌ NEVER LOSE:
- Original parameter values and logic
- Original detection conditions
- Original helper functions
- Any trigger/gap/volume logic from uploaded code

### ⛔ FORBIDDEN OUTPUT PATTERNS:
**Your output will be rejected if it contains:**
- 'pass' statements in detect_patterns() (except for valid loop placeholders)
- \`return data\` or \`return df\` as the only logic
- Comments like "TODO", "placeholder", "would go here"
- Empty detection logic blocks
- Simplified one-line detection logic

**The extracted logic provided above is 3800+ characters of ACTUAL working code.**
**Use it. Don't replace it with a placeholder.**

## OUTPUT FORMAT:
✅ Wrap ALL code in \`\`\`python ... \`\`\` blocks
✅ Complete, runnable code with NO placeholders
✅ Include ALL imports
✅ PRESERVE all original logic in detect_patterns()
❌ NO explanations outside code block
❌ NO simplification of original logic`;
}
