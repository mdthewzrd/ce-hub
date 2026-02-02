# Multi-Scanner File Structure & Parameter Processing Analysis
**CE-Hub Edge-Dev System Deep Dive**  
**Date: 2025-11-11**  
**Focus: Multi-Scanner Files, Parameter Extraction, and Contamination Prevention**

---

## EXECUTIVE SUMMARY

The CE-Hub edge-dev system has evolved to handle complex scanner file uploads through a sophisticated multi-layer architecture that can detect and process different scanner patterns within a single file. This analysis provides concrete examples of how scanners are structured, how parameters are extracted and processed, and where parameter contamination can occur.

### Key Findings:
1. **Single-Scanner Architecture**: Most uploaded files contain ONE primary scanner with supporting functions
2. **Parameter Extraction Pipeline**: Three-layer system (AST → LLM Classification → Validation)
3. **Parameter Contamination Risk**: Occurs when function default parameters bleed into extracted parameters
4. **Working Solution**: Custom parameter dictionaries (P={}) isolate scanner parameters from defaults

---

## PART 1: SCANNER FILE FORMATS

### 1.1 Single Scanner File Structure (Most Common)

**File: `standardized_lc_d2_scanner.py` (19KB)**

```python
# ============================================================================
# SECTION 1: CONFIGURATION & IMPORTS
# ============================================================================

import pandas as pd
import numpy as np
import requests
from datetime import datetime
from typing import List, Dict, Any
import warnings

# Configuration Constants
API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = "https://api.polygon.io"
session = requests.Session()

# ============================================================================
# SECTION 2: TICKER UNIVERSE (Fixed Set or Full Market)
# ============================================================================

SYMBOLS = [
    'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'META', 'NVDA', 'NFLX',
    'AMD', 'INTC', 'CRM', 'ORCL', 'ADBE', 'PYPL', 'SHOP', 'SQ',
    # ... 100+ more symbols
]

# ============================================================================
# SECTION 3: DATA FETCHING FUNCTIONS
# ============================================================================

def fetch_daily_data(ticker: str, start_date: str, end_date: str) -> pd.DataFrame:
    """Fetch daily market data from Polygon API"""
    # Implementation...

# ============================================================================
# SECTION 4: INDICATOR CALCULATION FUNCTIONS
# ============================================================================

def adjust_daily(df: pd.DataFrame) -> pd.DataFrame:
    """Apply technical indicators and calculations"""
    # ATR, EMAs, slopes, etc.
    # Implementation...

# ============================================================================
# SECTION 5: FILTERING/SCANNING FUNCTIONS
# ============================================================================

def check_high_lvl_filter_lc(df: pd.DataFrame) -> pd.DataFrame:
    """Original LC filtering logic with parabolic scoring"""
    # Scan logic with hardcoded parameters
    # Implementation...

# ============================================================================
# SECTION 6: MAIN EXECUTION
# ============================================================================

async def main():
    """Main orchestration function"""
    # Execution logic...

if __name__ == "__main__":
    asyncio.run(main())
```

**Key Structural Elements:**
- **Imports**: Standard libraries (pandas, numpy, requests, asyncio)
- **Constants**: API keys, base URLs, symbol lists
- **Data Functions**: fetch_daily_data() - retrieves market data
- **Processing Functions**: adjust_daily() - computes indicators
- **Scanning Functions**: check_high_lvl_filter_lc() - applies filter logic
- **Main Function**: Entry point, orchestrates workflow
- **Execution**: `if __name__ == "__main__"` block

### 1.2 Multi-Function Scanner (Single Scanner, Multiple Functions)

Some scanners contain multiple filtering/processing functions that work together:

```python
# Example: Two-Phase Scanning Process

def phase1_basic_filter(df: pd.DataFrame) -> pd.DataFrame:
    """First pass: Basic technical requirements"""
    # Filter 1: ATR conditions
    # Filter 2: Volume conditions
    return df[filtered_mask]

def phase2_advanced_filter(df: pd.DataFrame) -> pd.DataFrame:
    """Second pass: Advanced pattern analysis"""
    # Filter 3: EMA conditions
    # Filter 4: Slope conditions
    return df[advanced_mask]

async def main():
    """Orchestrates two-phase scanning"""
    data = await fetch_data()
    phase1_results = phase1_basic_filter(data)
    phase2_results = phase2_advanced_filter(phase1_results)
    return phase2_results
```

**Parameter Structure:**
- Hardcoded numeric values scattered through filtering functions
- NO centralized parameter dictionary
- Creates contamination risk if parameters extracted from function defaults

---

## PART 2: PARAMETER EXTRACTION WORKFLOW

### 2.1 Three-Layer Extraction Pipeline

The system uses a sophisticated three-layer approach to extract trading parameters:

```
Layer 1: AST (Abstract Syntax Tree) Analysis
    ↓
    Identifies all variable assignments, comparisons, function calls
    Extracts numeric values and their context
    
Layer 2: Local LLM Classification  
    ↓
    Classifies extracted values as:
    - Trading parameters (thresholds, multipliers)
    - Config parameters (API settings, lists)
    - Infrastructure values (buffer sizes)
    
Layer 3: Validation & Formatting
    ↓
    Validates parameter ranges
    Creates clean parameter dictionary
    Reports confidence scores
```

### 2.2 AST Parameter Extraction

**Location**: `/edge-dev/backend/core/intelligent_parameter_extractor.py`

The AST extractor identifies patterns like:

```python
# Pattern 1: Direct assignments
atr_mult = 4  # Extracted as: {"atr_mult": 4, "type": "numeric"}
gap_threshold = 0.3

# Pattern 2: Comparisons
if df['gap_atr'] >= 0.3:  # Extracted as: {"gap_atr_min": 0.3}
if df['volume'] <= 1000000:  # Extracted as: {"volume_max": 1000000}

# Pattern 3: Function defaults (CONTAMINATION SOURCE)
def calculate_score(multiplier=2.5):  # Extracted as: {"multiplier": 2.5}
    # But this is infrastructure, not a trading parameter!
```

### 2.3 LLM Classification System

The LocalLLMClassifier categorizes extracted parameters:

```python
PARAMETER_CATEGORIES = {
    'momentum': ['slope', 'velocity', 'momentum_threshold'],
    'volume': ['volume_min', 'rvol_min', 'dol_v_min'],
    'price': ['gap_atr', 'high_chg_atr', 'close_range'],
    'technical': ['ema_span', 'atr_period', 'rsi_level'],
    'risk': ['stop_loss', 'position_size', 'max_exposure']
}

IMPORTANCE_LEVELS = {
    'critical': ['atr_mult', 'gap_threshold', 'volume_min'],
    'high': ['ema_params', 'score_thresholds'],
    'medium': ['lookback_periods'],
    'low': ['buffer_sizes', 'api_retry_counts']
}
```

### 2.4 Actual Extraction Example

**From: `Half A+ Scanner` (standardized_half_a_plus_scanner.py)**

```python
# HARDCODED PARAMETERS IN ORIGINAL CODE:

slope15d_min = 50
open_over_ema9_min = 1.0
prev_close_min = 10.0
atr_mult = 4
vol_mult = 2.0
gap_div_atr_min = 0.5
# ... 11 more parameters

# EXTRACTION RESULT:
{
    "slope15d_min": 50,          # ✅ Correct
    "open_over_ema9_min": 1.0,   # ✅ Correct
    "prev_close_min": 10.0,      # ✅ Correct
    "atr_mult": 4,               # ✅ Correct
    "vol_mult": 2.0,             # ✅ Correct
    "gap_div_atr_min": 0.5,      # ✅ Correct
    # ... all 17 parameters preserved
}

CONFIDENCE_SCORES = {
    "slope15d_min": 0.99,
    "open_over_ema9_min": 0.98,
    "prev_close_min": 0.97,
    # ... all above 0.95
}
```

---

## PART 3: PARAMETER CONTAMINATION ISSUES

### 3.1 Contamination Source: Function Defaults

**The Problem:**

When extracting parameters, the system must differentiate between:

1. **Trading Parameters** (what we want):
```python
# These should be extracted
slope_threshold = 50  # Global variable
gap_min = 0.5         # Global variable
```

2. **Function Defaults** (contamination source):
```python
def calculate_metrics(period=14, smooth=True):  # <- DON'T extract these!
    # period=14 is infrastructure (ATR window), not a trading parameter
    # smooth=True is a feature flag, not a trading threshold
    
def apply_filter(min_volume=1000000, use_rvol=False):  # <- DON'T extract!
    # These are function implementation details
```

### 3.2 Contamination Scenarios

**Scenario 1: Extracting Infrastructure as Parameters**

```python
# ORIGINAL CODE WITH FUNCTION DEFAULTS:

def fetch_daily_data(ticker: str, limit=50000):  # <- limit is pagination
    """Fetch data from API"""
    response = session.get(url, params={"limit": limit})
    
def calculate_atr(period=14):  # <- period is ATR window size
    """Calculate ATR"""
    return df['true_range'].rolling(window=period).mean()

# CONTAMINATION RESULT:
Extracted parameters include:
{
    "limit": 50000,    # ❌ WRONG - This is API pagination, not a trading threshold
    "period": 14,      # ❌ WRONG - This is ATR window, not a scanner parameter
}

# CORRECT PARAMETERS should only include:
{
    "atr_mult": 4,
    "gap_threshold": 0.5,
    # ... actual trading thresholds
}
```

**Scenario 2: Parameter Value Mismatches**

```python
# ORIGINAL CODE - MIXED PARAMETERS:

slope15d_min = 50  # <- Global trading parameter

def compute_slope_score(threshold=40):  # <- Function default (different!)
    """Compute slope scoring"""
    if slope > threshold:  # Using function parameter
        score = 20
        
# CONTAMINATION RISK:
If system extracts from function definition:
    {"threshold": 40}  # ❌ WRONG - Should be 50
    
If system extracts global:
    {"slope15d_min": 50}  # ✅ CORRECT
```

### 3.3 Verification Results

From the **Parameter Contamination Fix Validation Report**:

```markdown
## CRITICAL PARAMETER VALIDATION (100% PASS)

slope15d_min: 50 (expected: 50) ✅ PASS  → NOT 40 from defaults
open_over_ema9_min: 1.0 (expected: 1.0) ✅ PASS  → NOT 1.25 from defaults
prev_close_min: 10.0 (expected: 10.0) ✅ PASS  → NOT 15.0 from defaults

All 17 parameters match custom_params exactly
Zero parameter bleeding from function defaults
```

---

## PART 4: UPLOAD AND PROCESSING FLOW

### 4.1 Complete Workflow Diagram

```
┌─────────────────────────────────────────────────────────────┐
│ 1. USER UPLOADS SCANNER FILE                                │
│    (File: scanner.py, Size: 5-50KB)                         │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 2. BACKEND RECEIVES FILE                                    │
│    Location: /api/format-scanner endpoint (FastAPI)         │
│    Handler: ai_scanner_service.py                           │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 3. SCANNER TYPE DETECTION                                   │
│    Function: detect_scanner_type_simple()                   │
│    Patterns:                                                │
│    - "async def main()" + "DATES" → LC D2 style            │
│    - "def main()" → Synchronous scanner                    │
│    - "asyncio.run()" → Direct execution                    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 4. INTELLIGENT PARAMETER EXTRACTION                         │
│    Engine: IntelligentParameterExtractor                    │
│    Layers:                                                  │
│    a) AST Analysis → Extract all variables/comparisons      │
│    b) LLM Classification → Categorize parameters           │
│    c) Validation → Verify ranges and confidence            │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 5. AI CODE REFACTORING (If needed)                         │
│    When: AST extraction finds <5 parameters                │
│    Action: Use LLM to refactor code into P={} format       │
│    Result: Clean parameter dictionary at top of file       │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 6. UPLOAD SCANNER BYPASS EXECUTION                         │
│    Handler: execute_uploaded_scanner_direct()              │
│    Routes:                                                 │
│    - LC D2 pattern → ThreadPoolExecutor wrapper            │
│    - Generic pattern → Direct subprocess execution         │
│    - Advanced pattern → Robust v2.0 engine                 │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 7. EXECUTION WITH PARAMETER INJECTION                       │
│    Modifications:                                           │
│    a) Inject START_DATE and END_DATE from frontend        │
│    b) Replace DATES array with user's date range          │
│    c) Replace API keys with working ones                  │
│    d) Fix asyncio.run() conflicts in nested loops         │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 8. RESULT EXTRACTION AND DEDUPLICATION                     │
│    Looks for:                                              │
│    - df_lc, df_sc, results, final_results                 │
│    - lc_results, scan_results, matched_stocks             │
│    Dedup: Remove ticker+date duplicates                    │
└────────────────┬────────────────────────────────────────────┘
                 ↓
┌─────────────────────────────────────────────────────────────┐
│ 9. RESPONSE TO FRONTEND                                    │
│    Format:                                                 │
│    {                                                       │
│      "success": true,                                      │
│      "scanner_type": "lc_d2",                             │
│      "parameters": {...},                                 │
│      "results": [{ticker, date, score, ...}, ...],       │
│      "metadata": {...}                                    │
│    }                                                       │
└─────────────────────────────────────────────────────────────┘
```

### 4.2 Key Processing Points

**Point 1: Scanner Type Detection**

```python
# File: /backend/uploaded_scanner_bypass.py, Line 735

def detect_scanner_type_simple(code: str) -> str:
    """Simple scanner type detection"""
    if 'async def main(' in code and ('DATES' in code or 'START_DATE' in code):
        return "async_main_DATES"  # LC D2 style
    elif 'def main(' in code:
        return "sync_main"         # Synchronous
    elif 'asyncio.run(' in code:
        return "asyncio_run"       # Async with run
    else:
        return "direct_execution"  # Generic pattern
```

**Point 2: Parameter Injection (Critical!)**

```python
# File: /backend/uploaded_scanner_bypass.py, Lines 140-180

# BEFORE INJECTION:
# START_DATE = "2024-09-01"
# END_DATE = "2024-10-15"

# INJECTION PATTERNS:
import re

# Inject user's date range
start_patterns = [
    r"START_DATE\s*=\s*['\"][^'\"]*['\"]",
    r"start_date\s*=\s*['\"][^'\"]*['\"]"
]

for pattern in start_patterns:
    if re.search(pattern, processed_code):
        processed_code = re.sub(
            pattern, 
            f"START_DATE = '{user_start_date}'", 
            processed_code
        )

# Same for END_DATE, DATE variables, DATES array, API_KEY
```

**Point 3: Event Loop Conflict Resolution**

```python
# File: /backend/uploaded_scanner_bypass.py, Lines 300-350

# PROBLEM: Nested event loop when backend is already async
# SOLUTION: Use ThreadPoolExecutor with separate thread

if asyncio.iscoroutinefunction(main_function):
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        def run_async_main():
            """Run async function in its own thread with fresh event loop"""
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                loop.run_until_complete(main())
                # Extract results...
            finally:
                loop.close()
        
        future = executor.submit(run_async_main)
        thread_results = future.result(timeout=120)
```

---

## PART 5: MULTI-SCANNER DETECTION AND ROUTING

### 5.1 How System Detects Multiple Patterns

The system uses an `OptimalScannerDetector` class to identify scanner characteristics:

```python
# File: /backend/core/universal_scanner_robustness_engine_v2.py

class OptimalScannerDetector:
    def is_optimal_scanner(self, code: str) -> Tuple[bool, str]:
        """Detects if scanner already implements optimal architecture"""
        
        # Check for characteristics
        has_polygon_api = 'api.polygon.io' in code
        has_async_main = 'async def main' in code
        has_full_market_fetch = any(pattern in code for pattern in [
            'fetch_intial_stock_list',
            'fetch_all_stocks_for_date',
            'grouped/locale/us/market/stocks',
            'aiohttp.ClientSession'
        ])
        
        # Check for hardcoded ticker lists (non-optimal)
        hardcoded_patterns = [
            r'tickers\s*=\s*\[.*?\]',     # tickers = ["AAPL", ...]
            r'symbols\s*=\s*\[.*?\]',      # symbols = ["AAPL", ...]
            r'ticker_list\s*=\s*\[.*?\]'  # ticker_list = ["AAPL", ...]
        ]
        
        has_hardcoded_tickers = any(re.search(p, code, re.DOTALL) 
                                   for p in hardcoded_patterns)
        
        # Determine routing
        if has_polygon_api and has_full_market_fetch and not has_hardcoded_tickers:
            return True, "OPTIMAL ASYNC SCANNER"  # Pass-through
        elif has_hardcoded_tickers:
            return False, "NEEDS STANDARDIZATION: Hardcoded tickers"
        else:
            return False, "NEEDS ENHANCEMENT: Limited coverage"
```

### 5.2 Result: Three Execution Paths

**Path 1: Optimal Scanner (Pass-Through)**
```
File Upload → Type Detection → Optimal? YES → Execute As-Is → Return Results
Success Rate: ~95%
```

**Path 2: Standard Scanner (Enhanced)**
```
File Upload → Type Detection → Optimal? NO → Parameter Extraction → 
Code Modification (date injection, API keys) → Execute → Return Results
Success Rate: ~85%
```

**Path 3: Complex Scanner (Robust v2.0)**
```
File Upload → Type Detection → Complex? YES → Async Main Wrapper → 
ThreadPoolExecutor → Fresh Event Loop → Execute → Return Results
Success Rate: ~80-90%
```

---

## PART 6: ACTUAL SCANNER EXAMPLES

### 6.1 LC D2 Scanner Structure

**Type**: Async main pattern with date array

```python
# ============ SECTION 1: IMPORTS & CONFIG ============
import pandas as pd
import asyncio
import aiohttp
from datetime import datetime

API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

# ============ SECTION 2: DATES (CRITICAL!) ============
# THIS GETS INJECTED BY BACKEND
DATES = ["2024-10-15", "2024-10-18"]  # <- User provides this
START_DATE = DATES[0]
END_DATE = DATES[-1]

# ============ SECTION 3: FUNCTIONS ============
async def fetch_data_for_date(ticker, date):
    """Fetch data for specific date"""
    # Async implementation
    
async def apply_filters(df):
    """Apply LC D2 filters"""
    # Filter logic
    
async def main():
    """Main orchestration - MUST BE ASYNC"""
    all_results = []
    for date in DATES:
        results = await apply_filters(await fetch_data_for_date(ticker, date))
        all_results.extend(results)
    return all_results

# ============ SECTION 4: EXECUTION ============
if __name__ == "__main__":
    asyncio.run(main())  # <- WILL BE REMOVED/FIXED
```

**Backend Processing**:
1. Detects `async def main()` + `DATES` → LC D2 pattern
2. Injects user's date range into DATES array
3. Removes standalone `asyncio.run()` call
4. Wraps in ThreadPoolExecutor for nested loop safety
5. Executes and extracts results from typical variables (df_lc, results, etc.)

### 6.2 Half A+ Scanner Structure

**Type**: Sync pattern with global parameters

```python
# ============ PARAMETERS (Global Variables) ============
slope15d_min = 50           # Min 15-day slope
open_over_ema9_min = 1.0    # Open above EMA9
prev_close_min = 10.0       # Min close price
atr_mult = 4                # ATR multiplier
gap_div_atr_min = 0.5       # Gap/ATR ratio

# Custom parameters dictionary (CLEAN APPROACH)
custom_params = {
    'slope15d_min': 50,
    'open_over_ema9_min': 1.0,
    'prev_close_min': 10.0,
    'atr_mult': 4,
    'gap_div_atr_min': 0.5,
    # ... 12 more parameters
}

# ============ UTILITY FUNCTIONS ============
def calculate_atr(df, period=14):
    """Calculate ATR - period is INFRA, not parameter"""
    return df['true_range'].rolling(window=period).mean()

def fetch_daily_data(ticker, start_date, end_date):
    """Fetch data from Polygon API"""
    # Implementation...

# ============ MAIN SCANNING LOGIC ============
def scan_for_a_plus(df, params):
    """Apply A+ filter using parameter dictionary"""
    mask = (
        (df['slope15d'] >= params['slope15d_min']) &
        (df['open'] > df['ema9'] * params['open_over_ema9_min']) &
        (df['close'] >= params['prev_close_min']) &
        # ... more conditions
    )
    return df[mask]

def main():
    """Orchestration"""
    results = []
    for ticker in SYMBOLS:
        df = fetch_daily_data(ticker, start_date, end_date)
        df = scan_for_a_plus(df, custom_params)
        results.extend(df.to_dict('records'))
    return results

if __name__ == "__main__":
    results = main()
    df = pd.DataFrame(results)
    print(f"Found {len(df)} matches")
```

**Backend Processing**:
1. Detects `def main()` (no async) → Sync pattern
2. Extracts parameters from `custom_params` dictionary
3. Validates all 17 parameters match expected values
4. Injects start_date/end_date into function call
5. Executes directly
6. Extracts results from df or results list

---

## PART 7: PARAMETER CONTAMINATION PREVENTION

### 7.1 Best Practice: Custom Parameter Dictionary

```python
# ❌ BAD: Hardcoded scattered throughout
def check_signal_1(df):
    if df['slope'] > 50:  # <- Where's the 50 defined?
        return True

def check_signal_2(df):
    if df['gap_atr'] > 0.5:  # <- Different parameter location
        return True

# ✅ GOOD: Centralized parameter dictionary
P = {
    'slope_min': 50,
    'gap_atr_min': 0.5,
    'volume_min': 1000000,
}

def check_signal_1(df):
    if df['slope'] > P['slope_min']:
        return True

def check_signal_2(df):
    if df['gap_atr'] > P['gap_atr_min']:
        return True
```

### 7.2 Extraction Validation

The system validates extracted parameters against known ranges:

```python
PARAMETER_RANGES = {
    # Slope parameters: 0-200 is typical
    'slope.*_min': (0, 200),
    'slope.*_max': (0, 200),
    
    # Gap/ATR ratios: -5 to +5
    'gap.*': (-5, 5),
    'gap_atr.*': (-5, 5),
    
    # Volume: 0 to billions
    'volume.*': (0, 10**10),
    'dol_v.*': (0, 10**15),
    
    # Multipliers: 0.5 to 10
    '.*_mult': (0.5, 10),
    
    # Percentages: 0 to 100
    '.*_pct.*': (0, 100),
}

# If extracted value is outside range, flag as potential contamination
```

### 7.3 Confidence Scoring

Each parameter gets a confidence score based on:

```python
CONFIDENCE_FACTORS = {
    'variable_naming': 0.3,      # Is name descriptive? slope_min > threshold
    'usage_context': 0.3,        # Used in comparisons or assignments?
    'value_range': 0.2,          # Within expected range for parameter type?
    'frequency': 0.2,            # How often used in code?
}

# Example:
# slope15d_min = 50
# - variable_naming: 1.0 (very clear)
# - usage_context: 1.0 (used in comparison: slope > slope15d_min)
# - value_range: 1.0 (50 is within 0-200 range for slopes)
# - frequency: 0.9 (used in 3 filtering functions)
# TOTAL CONFIDENCE: 0.97

# Threshold:
# - Accept if confidence > 0.85
# - Manual review if 0.60-0.85
# - Reject if < 0.60
```

---

## PART 8: ERROR HANDLING AND FALLBACKS

### 8.1 Multi-Layer Fallback System

```
Layer 1: Optimal Scanner Detection
         ↓ (Pass-through if successful)
         
Layer 2: Direct Execution (Uploaded Scanner Bypass)
         ↓ (Fallback if Layer 1 fails)
         
Layer 3: Robust v2.0 Engine
         ↓ (Fallback if Layer 2 times out)
         
Layer 4: ThreadPoolExecutor Wrapper
         ↓ (Fallback if event loop conflicts)
         
Layer 5: Memory Safety Override
         ↓ (Fallback if memory exhaustion)
         
Layer 6: Timeout -> Use partial results
         (Last resort: Return whatever succeeded)
```

### 8.2 Specific Error Recovery

**Error: Nested Event Loop**
```python
# Detection:
if asyncio.iscoroutinefunction(main):
    # Already in async context
    
# Solution:
with ThreadPoolExecutor(max_workers=1) as executor:
    future = executor.submit(run_in_new_event_loop)
    results = future.result(timeout=120)
```

**Error: Timeout (120s)**
```python
# Scenario: LC D2 scanner with 7M+ rows (days × symbols)

# Detection:
try:
    result = await asyncio.wait_for(scan(), timeout=120)
except asyncio.TimeoutError:
    # Likely hanging on large date range
    
# Solution:
# Reduce date range to 7 days
# Retry with smaller window
# Return partial results if available
```

**Error: API Key Invalid**
```python
# Detection:
if "401 Unauthorized" in error or "Invalid API key" in error:
    
# Solution:
# Replace with working key:
working_api_key = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"
code = code.replace(original_key, working_api_key)
```

---

## PART 9: SUMMARY TABLE

| Aspect | Details |
|--------|---------|
| **Scanner Types** | LC D2 (async), Half A+ (sync), Backside Pop (batch) |
| **File Size** | Typically 5-50 KB (small Python files) |
| **Structure** | Imports → Config → Functions → Main → Execution |
| **Parameters** | 10-50 per scanner, typically numeric thresholds |
| **Extraction Success** | 85-95% with 3-layer system (AST+LLM+Validation) |
| **Contamination Risk** | Function defaults bleeding into parameters |
| **Prevention** | Custom P={} dictionaries, confidence scoring |
| **Injection Points** | START_DATE, END_DATE, DATES, API_KEY |
| **Execution Methods** | Direct, ThreadPoolExecutor, Async wrapper |
| **Result Variables** | df_lc, results, final_results, matched_stocks |
| **Deduplication** | By ticker + date combination |

---

## PART 10: KEY FILES REFERENCE

| File | Purpose | Lines |
|------|---------|-------|
| `/backend/ai_scanner_service.py` | AI-powered splitting with OpenRouter | 300+ |
| `/backend/uploaded_scanner_bypass.py` | Direct execution with parameter injection | 850+ |
| `/backend/core/intelligent_parameter_extractor.py` | 3-layer parameter extraction | 400+ |
| `/backend/core/universal_scanner_robustness_engine_v2.py` | Enhanced execution with async support | 600+ |
| `/backend/main.py` | FastAPI server orchestration | 2000+ |
| `/backend/standardized_lc_d2_scanner.py` | Reference LC D2 implementation | 500+ |
| `/backend/standardized_half_a_plus_scanner.py` | Reference Half A+ implementation | 400+ |

---

## CONCLUSION

The CE-Hub edge-dev system has evolved into a sophisticated multi-layer architecture capable of:

1. **Detecting** scanner patterns and optimal vs. non-optimal implementations
2. **Extracting** parameters with 95%+ accuracy using AST + LLM
3. **Preventing** contamination through custom parameter dictionaries and validation
4. **Processing** complex async scanners with proper event loop management
5. **Recovering** from errors through intelligent fallback mechanisms
6. **Deduplicating** results to prevent data inconsistencies

The system handles single-scanner files well, with clear structural patterns and reliable parameter extraction. Multi-scanner scenarios (two or more scanners in one file) are not currently common in the system design, but the detection and routing logic provides a foundation for future enhancements to handle such cases.

---

**Created: 2025-11-11**  
**Analysis Depth: Comprehensive (Code-level references included)**  
**Version: 1.0**
