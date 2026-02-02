/**
 * RENATA PROMPT ENGINEERING SERVICE
 * ================================
 *
 * Builds rich prompts with:
 * 1. All non-negotiable system requirements
 * 2. Relevant template examples as few-shot learning
 * 3. Dynamic context based on user input
 * 4. Architecture patterns and code structure guides
 *
 * This teaches Renata HOW to build code, not just WHAT to build.
 */

import { SCANNER_PATTERNS } from './scannerPatternLibrary';
import { getTemplateCode } from './templateCodeService';
import { detectScannerType } from './patternDetectionService';

export interface PromptContext {
  task: 'format' | 'build_from_scratch' | 'modify';
  userInput: string;
  detectedType?: string;
  requirements: string[];
  relevantExamples: TemplateExample[];
  userIntent?: string;
}

interface TemplateExample {
  scannerType: string;
  description: string;
  keyPatterns: string[];
  codeSnippet: string;
  parameters: Record<string, any>;
}

/**
 * Build comprehensive system prompt with all requirements
 */
export function buildSystemPrompt(): string {
  return `You are Renata, an expert scanner architect for the Edge Dev trading system.

=============================================================================
NON-NEGOTIABLE REQUIREMENTS - MUST FOLLOW EXACTLY
=============================================================================

1. ARCHITECTURE - 3-Stage Grouped Endpoint (MANDATORY)
   EVERY scanner must use this architecture:

   class ScannerName:
       def __init__(self):
           self.stage1_workers = 5  # Parallel fetching
           self.stage3_workers = 10  # Parallel processing

       def run_scan(self):
           # Stage 1: Fetch grouped data (all tickers for all dates)
           stage1_data = self.fetch_grouped_data()

           # Stage 2a: Compute SIMPLE features (prev_close, ADV20, price_range ONLY)
           stage2a_data = self.compute_simple_features(stage1_data)

           # Stage 2b: Apply smart filters (reduce dataset by 99%)
           stage2_data = self.apply_smart_filters(stage2a_data)

           # Stage 3a: Compute FULL features (EMA, ATR, slopes, etc.)
           stage3a_data = self.compute_full_features(stage2_data)

           # Stage 3b: Detect patterns
           stage3_results = self.detect_patterns(stage3a_data)

           return stage3_results

   ⚠️ CRITICAL: Stage 2 computes SIMPLE features only (for efficient filtering)
   ⚠️ CRITICAL: Stage 3 computes FULL features (for pattern detection)
   ⚠️ CRITICAL: Do NOT compute all features in Stage 2 (wastes resources)

   WHY: Single API call per trading day (not per ticker). 456 calls vs 12,000+.
   NEVER: Per-ticker loops, serial processing, snapshot+aggregates architecture


2. PARALLEL WORKERS - MANDATORY

   STAGE 1 - Data Fetching:
   from concurrent.futures import ThreadPoolExecutor, as_completed

   with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
       future_to_date = {
           executor.submit(self._fetch_grouped_day, date_str): date_str
           for date_str in trading_dates
       }

       for future in as_completed(future_to_date):
           data = future.result()
           # Process results...

   STAGE 3 - Pattern Detection:
   with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
       future_to_ticker = {
           executor.submit(self._process_ticker, ticker): ticker
           for ticker in unique_tickers
       }

       for future in as_completed(future_to_ticker):
           results = future.result()
           # Collect results...

   WHY: 5-10x performance improvement. ~2 minutes vs 20+ minutes.
   Configuration: stage1_workers=5, stage3_workers=10


3. FULL MARKET SCANNING - MANDATORY

   EVERY scanner must:
   - Scan ALL tickers in the market (not a subset)
   - Use Polygon grouped endpoint (not ticker-specific endpoints)
   - Handle dynamic universe of stocks (no hardcoded lists)

   def fetch_grouped_data(self):
       for date in trading_dates:
           # Single API call returns ALL tickers for this date
           url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date}"
           response = self.session.get(url, params={'apiKey': self.api_key})
           # Returns ALL tickers that traded this day

   WHY: New IPOs, delisted stocks, changing market composition.
   NEVER: Hardcoded ticker lists, subset scanning, static universes


4. POLYGON API INTEGRATION - MANDATORY

   REQUIRED Endpoint:
   url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}"
   params = {'apiKey': 'Fm7brz4s23eSocDErnL68cE7wspz2K1I', 'adjust': 'true'}

   API Key Management:
   self.api_key = api_key
   self.base_url = "https://api.polygon.io"

   # Connection pooling for performance
   self.session = requests.Session()
   self.session.mount('https://', requests.adapters.HTTPAdapter(
       pool_connections=100,
       pool_maxsize=100,
       max_retries=2,
       pool_block=False
   ))


5. PARAMETER INTEGRITY - MANDATORY

   ALL parameters must:
   - Live in self.params dict
   - Use exact parameter names (no generic names)
   - Maintain flat structure (no nested objects)

   self.params = {
       "atr_mult": 4,           # Specific name
       "vol_mult": 2.0,         # Specific name
       "slope3d_min": 10,       # Specific name
   }

   NEVER:
   self.params = {
       "price_min": 8.0,        # Generic - WRONG
       "atr": {"mult": 4},      # Nested - WRONG
   }


6. CODE STRUCTURE STANDARDS - MANDATORY

   REQUIRED Imports:
   import pandas as pd
   import numpy as np
   import requests
   import time
   from datetime import datetime, timedelta
   from concurrent.futures import ThreadPoolExecutor, as_completed
   import pandas_market_calendars as mcal
   from typing import List, Dict, Optional

   REQUIRED Class Structure:
   class ScannerName:
       """Scanner description with architecture and performance"""

       def __init__(self, api_key: str, d0_start: str, d0_end: str):
           """Initialize scanner with date range"""

       def run_scan(self):
           """Main execution method"""

       def _fetch_grouped_day(self, date_str: str):
           """Fetch all tickers for a single day"""

       def _apply_smart_filters(self, df: pd.DataFrame):
           """Reduce dataset by 99%"""

       def detect_patterns(self, df: pd.DataFrame):
           """Apply pattern detection logic"""


7. PERFORMANCE REQUIREMENTS

   Target Performance:
   - Full market scan: ~2 minutes
   - Single ticker: <1 second
   - Memory usage: <2GB
   - API calls: 456 (one per trading day)

   Optimization Techniques:
   - Vectorized operations (no loops): df['atr'] = df['tr'].rolling(14).mean()
   - Boolean indexing (not iterrows): filtered = df[df['volume'] > threshold]
   - GroupBy operations (not ticker loops): for ticker, group in df.groupby('ticker')


8. DATA PROCESSING STANDARDS

   REQUIRED Column Naming (Polygon → Internal):
   df = df.rename(columns={
       'T': 'ticker',
       'v': 'volume',
       'o': 'open',
       'c': 'close',
       'h': 'high',
       'l': 'low',
       't': 'timestamp',
   })

   REQUIRED Data Type Handling:
   df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.strftime('%Y-%m-%d')
   df = df.dropna(subset=['close', 'volume'])
   df = df.sort_values(['ticker', 'date']).reset_index(drop=True)


9. ERROR HANDLING & LOGGING

   REQUIRED Error Handling:
   try:
       data = future.result()
       if data is None or data.empty:
           failed += 1
   except Exception as e:
       print(f"❌ Error processing {date}: {e}")
       failed += 1

   REQUIRED Logging:
   print(f"🚀 Starting scan...")
   print(f"📊 Processing {len(df)} rows...")
   print(f"✅ Found {len(results)} signals")


10. OUTPUT FORMAT

    REQUIRED Output Format:
    results = [
        {
            'ticker': 'AAPL',
            'date': '2024-12-20',
            'close': 195.50,
            'volume': 50000000,
            'confidence': 0.95,
        },
        # ... more results
    ]

=============================================================================
11. HISTORICAL DATA REQUIREMENTS - CRITICAL
=============================================================================

⚠️ CRITICAL: Many scanners require historical data BEYOND the signal date range

Scanners Requiring Historical Data:
- Backside B (abs_lookback_days: 1000)
- LC D2/D3 (lookback windows)
- LC Frontside D2/D3 (historical calculations)
- Any scanner with "lookback" or "abs" parameters

REQUIRED Implementation:

def __init__(self, api_key: str, d0_start: str, d0_end: str):
    """Initialize scanner with date range and historical data calculation"""

    # Signal output range (what user wants to see)
    self.d0_start = d0_start
    self.d0_end = d0_end

    # ⚠️ CRITICAL: Calculate historical data range for pattern detection
    # Look for parameters ending in "_lookback_days" or "abs_"
    if 'abs_lookback_days' in self.params:
        lookback_buffer = self.params['abs_lookback_days'] + 50  # Add buffer
    elif any('lookback' in k for k in self.params.keys()):
        lookback_buffer = max([v for k, v in self.params.items() if 'lookback' in k]) + 50
    else:
        lookback_buffer = 0

    # Calculate scan_start to include historical data
    if lookback_buffer > 0:
        from datetime import timedelta
        scan_start_dt = pd.to_datetime(self.d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        print(f"📊 Signal Output Range (D0): {self.d0_start} to {self.d0_end}")
        print(f"📊 Historical Data Range: {self.scan_start} to {self.d0_end}")
    else:
        self.scan_start = self.d0_start

    self.scan_end = self.d0_end

    # Fetch historical data for pattern detection
    self.trading_dates = nyse.schedule(start_date=self.scan_start, end_date=self.scan_end)

WHY:
- Pattern detection requires historical calculations (rolling averages, ABS windows, etc.)
- Lookback parameters define how much history is needed
- Without historical data, pattern detection FAILS SILENTLY (returns 0 signals)

EXAMPLE (Backside B):
  User wants: d0_start="2025-01-02", d0_end="2025-01-02"
  Parameter: abs_lookback_days=1000
  Calculation: scan_start = 2025-01-02 - 1050 days = 2022-02-17
  Data fetched: 2022-02-17 to 2025-01-02 (722 trading days)
  Signal output: Only 2025-01-02 (1 day)

NEVER:
- Use d0_start/d0_end directly for data fetching (misses historical data)
- Skip lookback_buffer calculation (breaks pattern detection)
- Assume 1 day of data is enough (lookback requirements exist for a reason)


=============================================================================
TRANSFORMATION PRINCIPLES
=============================================================================

MAINTAIN:
- User's intent and logic
- Pattern detection ideas
- Parameter concepts

TRANSFORM:
- Architecture → 3-stage grouped endpoint
- Data fetching → Polygon grouped endpoint (with historical range calculation)
- Processing → Parallel workers
- Structure → Code standards

PRESERVE:
- Parameter names (make them specific, not generic)
- Core pattern logic
- User's trading ideas
- ⚠️ Lookback/historical requirements (CRITICAL for pattern detection)

=============================================================================
`;
}

/**
 * Build few-shot learning examples from templates
 */
export function buildFewShotExamples(detectedType?: string): string {
  let examples = `FEW-SHOT LEARNING EXAMPLES
========================================
These examples show how to apply the non-negotiable requirements.
Learn the PATTERNS, don't copy the code directly.
========================================

`;

  // OPTIMIZED: Only show ONE relevant example to reduce prompt size
  // If no type detected, default to backside_b (most common)
  const typesToShow = detectedType
    ? [detectedType]
    : ['backside_b_para'];  // Only ONE example, not three!

  for (const type of typesToShow) {
    const template = getTemplateCode(type);
    const pattern = SCANNER_PATTERNS[type];

    if (template && pattern) {
      examples += `
EXAMPLE: ${pattern.description}
========================================

SCANNER TYPE: ${type}
ARCHITECTURE: 3-Stage Grouped Endpoint

CRITICAL PATTERNS TO LEARN:
${pattern.requiredFeatures.slice(0, 8).map(f => `  ✓ ${f}`).join('\n')}

ESSENTIAL CODE EXAMPLES (Optimized):
========================================
${extractEssentialExamples(template)}
========================================

`;
    }
  }

  return examples;
}

/**
 * Extract key patterns AND code examples from template
 */
function extractKeyPatterns(templateCode: string): string {
  const patterns: string[] = [];

  // Extract class name
  const classMatch = templateCode.match(/class\s+(\w+):/);
  if (classMatch) {
    patterns.push(`  Class: ${classMatch[1]}`);
  }

  // Extract worker configuration
  const workerMatch = templateCode.match(/self\.stage1_workers\s*=\s*(\d+)/);
  if (workerMatch) {
    patterns.push(`  Stage 1 workers: ${workerMatch[1]}`);
  }

  const worker3Match = templateCode.match(/self\.stage3_workers\s*=\s*(\d+)/);
  if (worker3Match) {
    patterns.push(`  Stage 3 workers: ${worker3Match[1]}`);
  }

  // Check for ThreadPoolExecutor
  if (templateCode.includes('ThreadPoolExecutor')) {
    patterns.push(`  Parallel processing: Yes (ThreadPoolExecutor)`);
  }

  // Check for grouped endpoint
  if (templateCode.includes('grouped/locale/us/market/stocks')) {
    patterns.push(`  API endpoint: Grouped (full market)`);
  }

  return patterns.join('\n');
}

/**
 * Extract ACTUAL code examples from template
 * This shows the AI the REAL implementation, not just metadata
 */
function extractCodeExamples(templateCode: string): string {
  const examples: string[] = [];

  // Extract the main data fetching method (might have different names)
  const fetchMethodPatterns = [
    /def fetch_all_grouped_data\(self[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n    def|\nclass|\Z)/,
    /def fetch_grouped_data\(self[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n    def|\nclass|\Z)/,
    /def run_scan\(self[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n    def|\nclass|\Z)/
  ];

  for (const pattern of fetchMethodPatterns) {
    const match = templateCode.match(pattern);
    if (match) {
      examples.push(`
EXAMPLE - Main Data Fetching Method:
${match[0].trim()}
`);
      break;
    }
  }

  // Extract the _fetch_grouped_day method (Polygon API call)
  const fetchDayMatch = templateCode.match(/def _fetch_grouped_day\(self[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n    def|\nclass|\Z)/);
  if (fetchDayMatch) {
    examples.push(`
EXAMPLE - Fetch Single Day with Polygon API:
${fetchDayMatch[0].trim()}
`);
  }

  // Extract ThreadPoolExecutor usage (Stage 1)
  const stage1ExecutorMatch = templateCode.match(/with ThreadPoolExecutor\(max_workers=self\.stage1_workers\)[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n\n|\n    def|\nclass|\Z)/);
  if (stage1ExecutorMatch) {
    examples.push(`
EXAMPLE - Stage 1 Parallel Workers (Data Fetching):
${stage1ExecutorMatch[0].trim()}
`);
  }

  // Extract smart filters method (Stage 2)
  const filtersMatch = templateCode.match(/def apply_smart_filters\(self[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n    def|\nclass|\Z)/);
  if (filtersMatch) {
    examples.push(`
EXAMPLE - Stage 2 Smart Filters:
${filtersMatch[0].trim()}
`);
  }

  // Extract pattern detection method (Stage 3)
  const patternsMatch = templateCode.match(/def detect_patterns\(self[\s\S]*?\n(?:[ \t][\s\S]*?\n)*?(?=\n    def|\nclass|\Z)/);
  if (patternsMatch) {
    examples.push(`
EXAMPLE - Stage 3 Pattern Detection:
${patternsMatch[0].trim()}
`);
  }

  // Extract parameter initialization
  const paramsMatch = templateCode.match(/self\.params\s*=\s*\{[^}]+\}/);
  if (paramsMatch) {
    examples.push(`
EXAMPLE - Parameter Structure:
self.params = ${paramsMatch[0].replace('self.params = ', '').trim()}
`);
  }

  return examples.join('\n');
}

/**
 * OPTIMIZED: Extract only essential code patterns (reduces prompt size by ~70%)
 * This is critical for preventing AI timeouts with large code
 */
function extractEssentialExamples(templateCode: string): string {
  const examples: string[] = [];

  // 1. Extract ONLY the grouped endpoint URL pattern (critical!)
  const urlMatch = templateCode.match(/url\s*=\s*f["'].*?\/v2\/aggs\/grouped\/locale\/us\/market\/stocks\/.*?["']/);
  if (urlMatch) {
    examples.push(`
1. POLYGON GROUPED ENDPOINT (Required):
   ${urlMatch[0]}
   → Use this pattern: /v2/aggs/grouped/locale/us/market/stocks/{date}
   → Gets ALL tickers in ONE call (not per-ticker loops)
`);
  }

  // 2. Extract ONLY the parallel workers setup (critical!)
  const workersMatch = templateCode.match(/self\.stage1_workers\s*=\s*\d+/);
  if (workersMatch) {
    examples.push(`
2. PARALLEL WORKERS (Required):
   ${workersMatch[0]}
   → Stage 1: 5 workers for data fetching
   → Stage 3: 10 workers for pattern detection
`);
  }

  // 2.5. Extract historical data calculation (CRITICAL for lookback scanners!)
  const lookbackMatch = templateCode.match(/lookback_buffer\s*=\s*.*?;/);
  const scanStartMatch = templateCode.match(/scan_start_dt\s*=\s*pd\.to_datetime\(self\.d0_start\)\s*-\s*pd\.Timedelta\(days\s*=\s*lookback_buffer\)/);

  if (lookbackMatch && scanStartMatch) {
    examples.push(`
2.5. ⚠️ HISTORICAL DATA RANGE CALCULATION (CRITICAL):
   ${lookbackMatch[0]}
   ${scanStartMatch[0]}
   → Calculates scan_start by subtracting lookback_buffer from d0_start
   → Ensures sufficient historical data for pattern detection
   → REQUIRED for scanners with abs_lookback_days or other lookback parameters
   → Without this: Pattern detection FAILS SILENTLY (returns 0 signals)
`);
  }

  // 3. Extract parameter structure (critical!)
  const paramsMatch = templateCode.match(/self\.params\s*=\s*\{[^}]{10,500}\}/);
  if (paramsMatch) {
    // Clean up and format
    const params = paramsMatch[0].replace(/\s+/g, ' ').substring(0, 200) + '...';
    examples.push(`
3. PARAMETER STRUCTURE (Required):
   ${params}
   → All parameters in flat self.params dict
   → No nested objects
`);
  }

  // 4. Show the 3-stage pattern (brief)
  examples.push(`
4. 3-STAGE ARCHITECTURE PATTERN:
   Stage 1: fetch_all_grouped_data() → Uses grouped endpoint
   Stage 2a: compute_simple_features() → Compute prev_close, ADV20, price_range ONLY
   Stage 2b: apply_smart_filters() → Filter D0 dates, keep historical for passing tickers
   Stage 3a: compute_full_features() → Compute ALL indicators (EMA, ATR, slopes, etc.)
   Stage 3b: detect_patterns() → Pattern detection with parallel workers

   ⚠️ CRITICAL: Stage 2 computes SIMPLE features only (for filtering)
   ⚠️ CRITICAL: Stage 3 computes FULL features (for pattern detection)
   ⚠️ CRITICAL: Do NOT compute all features in Stage 2 (wastes resources)
`);

  // 5. Extract key method signatures and patterns (not full implementations)
  const simpleFeaturesSig = templateCode.match(/def compute_simple_features\(self/);
  const smartFiltersSig = templateCode.match(/def apply_smart_filters\(self/);
  const fullFeaturesSig = templateCode.match(/def compute_full_features\(self/);

  if (simpleFeaturesSig || smartFiltersSig || fullFeaturesSig) {
    examples.push(`
5. ⚠️ STAGE 2/3 SEPARATION PATTERN (CRITICAL):
   def compute_simple_features(self, df):  # Stage 2a - SIMPLE features only
       → prev_close, ADV20_$, price_range (3 metrics only)
       → Purpose: Efficient pre-filtering

   def apply_smart_filters(self, df):  # Stage 2b - Filter D0 dates
       → Separate: historical vs D0 output range
       → Filter: ONLY D0 dates (not historical)
       → Keep: tickers with 1+ passing D0 dates
       → Return: historical + filtered D0 for Stage 3

   def compute_full_features(self, df):  # Stage 3a - FULL features
       → EMA, ATR, slopes, volume metrics, etc.
       → Purpose: Pattern detection calculations
       → Only on filtered data (efficient!)

   def detect_patterns(self, df):  # Stage 3b - Pattern detection
       → Apply pattern logic with parallel workers
       → Return signals

   ⚠️ CRITICAL: Do NOT compute EMA/ATR/slopes in Stage 2!
   ⚠️ CRITICAL: Stage 2 is for FILTERING, not pattern detection!
`);
  }

  // 6. Extract vectorized filtering pattern (CRITICAL for performance!)
  const vectorizedFilterMatch = templateCode.match(/mask\s*=\s*\(ticker_df\[['"]date['"]\]\s*>\s*wstart\)\s*&\s*\(ticker_df\[['"]date['"]\]\s*<=\s*cutoff\)/);
  const absWindowMatch = templateCode.match(/cutoff\s*=\s*d0\s*-\s*pd\.Timedelta\(days\s*=\s*self\.params\[['"]abs_exclude_days['"]\]\)/);

  if (vectorizedFilterMatch && absWindowMatch) {
    examples.push(`
6. ⚠️ VECTORIZED FILTERING PATTERN (CRITICAL - 10x faster!):
   # ABS window calculation - DO NOT use function call in loop!
   cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
   wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

   # Vectorized filtering - 10x faster than function call
   mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
   win = ticker_df.loc[mask]

   ⚠️ CRITICAL: This is 10x faster than calling a function!
   ⚠️ CRITICAL: NO repeated pd.to_datetime() conversions!
   ⚠️ CRITICAL: Convert dates ONCE before loop, then use vectorized filtering!
   ⚠️ PERFORMANCE: 7,427x fewer datetime conversions!
`);
  } else if (absWindowMatch) {
    // At least show the window calculation if vectorized pattern not found
    examples.push(`
6. ⚠️ ABS WINDOW CALCULATION (CRITICAL):
   # Calculate cutoff and window start
   cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
   wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

   ⚠️ Then use VECTORIZED filtering: mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
   ⚠️ CRITICAL: NOT: win = df[(pd.to_datetime(df['date']) > wstart) & (pd.to_datetime(df['date']) < cutoff)]
   ⚠️ The second approach is 10x SLOWER (converts entire column TWICE per row!)
`);
  }

  return examples.join('\n');
}

/**
 * Build task-specific prompt
 */
export function buildTaskPrompt(context: PromptContext): string {
  let prompt = '';

  switch (context.task) {
    case 'format':
      prompt = buildFormatPrompt(context);
      break;
    case 'build_from_scratch':
      prompt = buildFromScratchPrompt(context);
      break;
    case 'modify':
      prompt = buildModifyPrompt(context);
      break;
  }

  return prompt;
}

/**
 * Build prompt for formatting uploaded code
 */
function buildFormatPrompt(context: PromptContext): string {
  return `
TASK: FORMAT UPLOADED CODE
============================

USER CODE:
==========
${context.userInput}
==========

ANALYSIS:
=========
1. Current Architecture: ${detectArchitecture(context.userInput)}
2. Missing Components: ${identifyMissingComponents(context.userInput)}
3. Transformation Needed: ${listTransformations(context.userInput)}

RELEVANT TEMPLATE EXAMPLES:
============================
${buildRelevantExamples(context.detectedType)}

INSTRUCTIONS:
=============
1. PRESERVE user's intent and pattern logic
2. TRANSFORM to 3-stage grouped endpoint architecture
3. ADD parallel workers (stage1=5, stage3=10)
4. USE Polygon grouped endpoint for full market scan
5. STANDARDIZE parameter names (be specific, not generic)
6. FOLLOW all code structure standards
7. MAINTAIN parameter integrity (flat dict in self.params)

OUTPUT:
======
Provide the complete, formatted scanner code that:
- Uses 3-stage grouped endpoint architecture
- Has parallel workers (stage1=5, stage3=10)
- Scans full market (no hardcoded ticker lists)
- Has all parameters in self.params dict
- Follows all code structure standards
- Preserves user's original pattern logic

`;
}

/**
 * Build prompt for building from scratch
 */
function buildFromScratchPrompt(context: PromptContext): string {
  return `
TASK: BUILD SCANNER FROM SCRATCH
=================================

USER IDEA/DESCRIPTION:
======================
${context.userInput}
======================

REQUIREMENTS ANALYSIS:
======================
${analyzeRequirements(context.userInput)}
======================

RELEVANT TEMPLATE EXAMPLES:
============================
${buildRelevantExamples(context.detectedType)}
======================

INSTRUCTIONS:
=============
1. UNDERSTAND user's requirements
2. DESIGN scanner following 3-stage architecture
3. IMPLEMENT using grouped endpoint + parallel workers
4. DEFINE specific parameters (no generic names)
5. FOLLOW all code structure standards
6. INCLUDE comprehensive docstrings
7. OPTIMIZE for performance (<2 min full market scan)

OUTPUT:
======
Provide complete scanner code that:
- Uses 3-stage grouped endpoint architecture
- Has parallel workers (stage1=5, stage3=10)
- Scans full market dynamically
- Has specific, well-named parameters
- Follows all code structure standards
- Implements user's requirements accurately

`;
}

/**
 * Build prompt for modifying existing scanner
 */
function buildModifyPrompt(context: PromptContext): string {
  return `
TASK: MODIFY EXISTING SCANNER
==============================

EXISTING CODE:
==============
${context.userInput}
==============

MODIFICATION REQUEST:
=====================
${context.userIntent || 'See user input above'}
=====================

INSTRUCTIONS:
=============
1. UNDERSTAND current implementation
2. APPLY modification while maintaining:
   - 3-stage architecture
   - Parallel workers
   - Full market scanning
   - Parameter integrity
   - Code structure standards
3. PRESERVE all non-negotiable requirements
4. OPTIMIZE for performance

OUTPUT:
======
Provide modified scanner code that:
- Maintains all non-negotiable requirements
- Implements requested modifications
- Follows all code structure standards
- Preserves performance characteristics

`;
}

/**
 * Build relevant examples based on context
 */
function buildRelevantExamples(detectedType?: string): string {
  if (!detectedType) {
    return 'No specific scanner type detected. Apply general patterns from all examples.';
  }

  const pattern = SCANNER_PATTERNS[detectedType];
  if (!pattern) {
    return `Unknown scanner type: ${detectedType}`;
  }

  return `
Similar Scanner: ${pattern.description}
Architecture: ${pattern.architecture}
Key Features: ${pattern.requiredFeatures.join(', ')}
Parameters: ${Object.keys(pattern.parameters).length} total
Learn from this example's structure and patterns.
`;
}

/**
 * Detect architecture from user code
 */
function detectArchitecture(code: string): string {
  if (code.includes('ThreadPoolExecutor')) {
    if (code.includes('grouped/locale/us')) {
      return '3-Stage Grouped Endpoint (CORRECT)';
    } else {
      return 'Parallel Processing but Wrong Endpoint';
    }
  } else if (code.includes('for ticker in')) {
    return 'Per-Ticker Loop (INEFFICIENT)';
  } else {
    return 'Unknown Architecture';
  }
}

/**
 * Identify missing components
 */
function identifyMissingComponents(code: string): string {
  const missing: string[] = [];

  if (!code.includes('ThreadPoolExecutor')) {
    missing.push('Parallel workers');
  }
  if (!code.includes('grouped/locale/us')) {
    missing.push('Grouped endpoint');
  }
  if (!code.includes('self.params')) {
    missing.push('Parameter dict');
  }
  if (!code.includes('fetch_grouped') && !code.includes('_fetch_grouped_day')) {
    missing.push('3-stage architecture');
  }

  return missing.length > 0
    ? missing.join(', ')
    : 'None (architecture complete)';
}

/**
 * List needed transformations
 */
function listTransformations(code: string): string {
  const transformations: string[] = [];

  if (!code.includes('grouped/locale/us')) {
    transformations.push('Convert to grouped endpoint');
  }
  if (!code.includes('ThreadPoolExecutor')) {
    transformations.push('Add parallel workers');
  }
  if (!code.includes('self.params')) {
    transformations.push('Add parameter dict');
  }
  if (code.includes('for ticker in')) {
    transformations.push('Remove per-ticker loops');
  }

  return transformations.length > 0
    ? transformations.join(', ')
    : 'No transformations needed';
}

/**
 * Analyze requirements from user description
 */
function analyzeRequirements(description: string): string {
  const requirements: string[] = [];
  const desc = description.toLowerCase();

  // Pattern type
  if (desc.includes('momentum') || desc.includes('trend')) {
    requirements.push('Pattern Type: Momentum/Trend');
  } else if (desc.includes('reversal') || desc.includes('bottom')) {
    requirements.push('Pattern Type: Reversal');
  } else if (desc.includes('gap') || desc.includes('jump')) {
    requirements.push('Pattern Type: Gap');
  } else if (desc.includes('breakout') || desc.includes('resistance')) {
    requirements.push('Pattern Type: Breakout');
  } else {
    requirements.push('Pattern Type: To be determined');
  }

  // Indicators
  const indicators: string[] = [];
  if (desc.includes('volume') || desc.includes('vol')) {
    indicators.push('Volume');
  }
  if (desc.includes('atr') || desc.includes('average true range')) {
    indicators.push('ATR');
  }
  if (desc.includes('ema') || desc.includes('sma') || desc.includes('ma')) {
    indicators.push('Moving Averages');
  }
  if (desc.includes('rsi') || desc.includes('stochastic')) {
    indicators.push('Oscillators');
  }

  if (indicators.length > 0) {
    requirements.push(`Indicators: ${indicators.join(', ')}`);
  }

  return requirements.join('\n');
}

/**
 * Build complete prompt for AI
 */
export function buildCompletePrompt(context: PromptContext): string {
  return `
${buildSystemPrompt()}

${buildFewShotExamples(context.detectedType)}

${buildTaskPrompt(context)}

Remember: Learn PATTERNS from examples, don't copy code. Apply the non-negotiable
requirements to create NEW code that follows the Edge Dev standards.
`;
}

/**
 * FORMAT CODE WITH UPDATED PROMPTS (Including Vectorized Filtering)
 * ================================================================
 *
 * This function formats user code using prompts that include the critical
 * vectorized filtering pattern for 10x performance improvement.
 */
export async function formatCodeWithPrompts(
  message: string,
  context: any = {}
): Promise<{
  code: string;
  scannerType: string;
  patterns: string[];
}> {
  // Extract code from message
  const codeMatch = message.match(/```python\n([\s\S]+?)\n```/);
  const userCode = codeMatch ? codeMatch[1] : message;

  // Detect scanner type from code
  const detection = detectScannerType(userCode);
  const detectedType = detection.scannerType || 'unknown';

  console.log(`📝 Formatting code detected as: ${detectedType}`);

  // Build comprehensive prompt with vectorized filtering examples
  const prompt = `
You are an expert Python code formatter specializing in trading scanner optimization.

FORMAT THE FOLLOWING CODE to match the 3-stage grouped endpoint architecture with vectorized filtering:

User Code to Format:
\`\`\`python
${userCode}
\`\`\`

CRITICAL REQUIREMENTS:
1. Use 3-stage grouped endpoint architecture (Stage 1: fetch grouped data, Stage 2a: simple features, Stage 2b: smart filters, Stage 3a: full features, Stage 3b: pattern detection)
2. Add parallel workers (stage1_workers=5, stage3_workers=10)
3. Use Polygon grouped endpoint for full market scan: /v2/aggs/grouped/locale/us/market/stocks/{date}
4. **CRITICAL**: Use VECTORIZED filtering for 10x performance improvement
5. Preserve all parameters and logic exactly

⚠️ VECTORIZED FILTERING PATTERN (CRITICAL - 10x faster!):
\`\`\`python
# ABS window calculation - DO NOT use function call in loop!
cutoff = d0 - pd.Timedelta(days=self.params['abs_exclude_days'])
wstart = cutoff - pd.Timedelta(days=self.params['abs_lookback_days'])

# Vectorized filtering - 10x faster than function call
mask = (ticker_df['date'] > wstart) & (ticker_df['date'] <= cutoff)
win = ticker_df.loc[mask]
\`\`\`

⚠️ CRITICAL: This is 10x faster than calling a function!
⚠️ CRITICAL: NO repeated pd.to_datetime() conversions!
⚠️ CRITICAL: Convert dates ONCE before loop, then use vectorized filtering!
⚠️ PERFORMANCE: 7,427x fewer datetime conversions!

Return ONLY the formatted Python code (no explanations, no markdown blocks).
`;

  // Call AI API to format the code
  try {
    // Use OpenRouter API for code formatting
    const openrouterApiKey = process.env.OPENROUTER_API_KEY;
    if (!openrouterApiKey) {
      throw new Error('OpenRouter API key not configured');
    }

    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${openrouterApiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
      },
      body: JSON.stringify({
        model: 'anthropic/claude-sonnet-4',
        messages: [
          {
            role: 'system',
            content: 'You are an expert Python code formatter. Return ONLY formatted code, no explanations.'
          },
          {
            role: 'user',
            content: prompt
          }
        ],
        temperature: 0.1,
        max_tokens: 8000
      })
    });

    if (!response.ok) {
      throw new Error(`AI API error: ${response.status} ${response.statusText}`);
    }

    const result = await response.json();
    const formattedCode = result.choices[0].message.content;

    // Clean up the response (remove markdown code blocks if present)
    let cleanCode = formattedCode;
    const codeBlockMatch = formattedCode.match(/```python\n([\s\S]+?)\n```/);
    if (codeBlockMatch) {
      cleanCode = codeBlockMatch[1];
    }

    // Check if vectorized filtering pattern is present
    const patterns = [];
    if (cleanCode.includes('mask = (ticker_df[\'date\'] > wstart)') ||
        cleanCode.includes('mask = (ticker_df["date"] > wstart)')) {
      patterns.push('vectorized-filtering');
    }
    if (cleanCode.includes('stage1_workers') || cleanCode.includes('stage3_workers')) {
      patterns.push('parallel-workers');
    }
    if (cleanCode.includes('compute_simple_features') && cleanCode.includes('compute_full_features')) {
      patterns.push('3-stage-architecture');
    }
    if (cleanCode.includes('/v2/aggs/grouped/locale/us/market/stocks/')) {
      patterns.push('grouped-endpoint');
    }

    console.log(`✅ Code formatted with patterns: ${patterns.join(', ')}`);

    return {
      code: cleanCode,
      scannerType: detectedType,
      patterns
    };

  } catch (error) {
    console.error('❌ Error formatting code:', error);
    throw error;
  }
}
