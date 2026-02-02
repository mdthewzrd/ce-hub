# RENATA AI SYSTEM - COMPLETE SPECIFICATION

## Vision

Renata is an AI agent that transforms ideas or messy code into production-ready scanners that follow the Edge Dev system architecture. It learns from template examples but creates NEW code following those patterns.

---

## NON-NEGOTIABLE REQUIREMENTS

### 1. Architecture - 3-Stage Grouped Endpoint

**EVERY scanner must use this architecture:**

```python
class ScannerName:
    def __init__(self):
        # STAGE 1: Fetch grouped data
        self.stage1_workers = 5  # Parallel fetching

        # STAGE 2: Smart filters
        # Reduces dataset by 99%

        # STAGE 3: Pattern detection
        self.stage3_workers = 10  # Parallel processing

    def run_scan(self):
        # Stage 1: Fetch all data for all tickers
        stage1_data = self.fetch_grouped_data()

        # Stage 2: Apply smart filters
        stage2_data = self.apply_smart_filters(stage1_data)

        # Stage 3: Detect patterns
        stage3_results = self.detect_patterns(stage2_data)

        return stage3_results
```

**Why**: Single API call per trading day (not per ticker). 456 calls vs 12,000+ calls.

**NEVER**: Per-ticker loops, serial processing, snapshot+aggregates architecture

---

### 2. Parallel Workers - MANDATORY

**STAGE 1 - Data Fetching:**
```python
from concurrent.futures import ThreadPoolExecutor, as_completed

with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
    future_to_date = {
        executor.submit(self._fetch_grouped_day, date_str): date_str
        for date_str in trading_dates
    }

    for future in as_completed(future_to_date):
        # Process results...
```

**STAGE 3 - Pattern Detection:**
```python
with ThreadPoolExecutor(max_workers=self.stage3_workers) as executor:
    future_to_ticker = {
        executor.submit(self._process_ticker, ticker): ticker
        for ticker in unique_tickers
    }

    for future in as_completed(future_to_ticker):
        # Process results...
```

**Why**: 5-10x performance improvement. Full market scans in ~2 minutes vs 20+ minutes.

**Configuration:**
- `stage1_workers = 5` (data fetching)
- `stage3_workers = 10` (pattern detection)

---

### 3. Full Market Scanning

**EVERY scanner must:**
- Scan ALL tickers in the market (not a subset)
- Use Polygon grouped endpoint (not ticker-specific endpoints)
- Handle dynamic universe of stocks (no hardcoded lists)

```python
def fetch_grouped_data(self):
    """
    Fetch ALL tickers that traded each day.
    NOT a predefined list - let the market tell us what exists.
    """
    for date in trading_dates:
        # Single API call returns ALL tickers for this date
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date}"
        response = self.session.get(url, params={'apiKey': self.api_key})

        # Returns ALL tickers that traded this day
        # We discover the market, don't assume it
```

**Why**: New IPOs, delisted stocks, changing market composition.

**NEVER**: Hardcoded ticker lists, subset scanning, static universes

---

### 4. Polygon API Integration

**REQUIRED Endpoint:**
```python
# GROUPED ENDPOINT (required)
url = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{date}"
params = {'apiKey': self.api_key, 'adjust': 'true'}

# Response includes ALL tickers for this date
{
  "results": [
    {"T": "AAPL", "v": 50000000, "o": 150.25, "c": 152.30, ...},
    {"T": "TSLA", "v": 80000000, "o": 220.10, "c": 225.50, ...},
    ... # ALL tickers
  ]
}
```

**API Key Management:**
```python
def __init__(self, api_key: str = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"):
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
```

**Rate Limiting:**
- Built-in retry logic
- Connection pooling
- Respect Polygon limits (5 requests/minute for free tier)

---

### 5. Parameter Integrity - SHA-256 System

**ALL parameters must:**
- Live in `self.params` dict
- Use exact parameter names from pattern library
- Maintain SHA-256 hash integrity
- Include type, range, and description

```python
class ScannerName:
    def __init__(self):
        # REQUIRED: All parameters in self.params
        self.params = {
            # ATR multiplier
            "atr_mult": 4,

            # Volume multiplier
            "vol_mult": 2.0,

            # Slope minimums
            "slope3d_min": 10,
            "slope5d_min": 20,
            "slope15d_min": 50,

            # ... all parameters
        }

    def scan(self):
        # REQUIRED: Access parameters via self.params
        if df['atr'] >= (df['ATR'] * self.params['atr_mult']):
            # Pattern matched!
```

**Parameter Format:**
```python
self.params = {
    "parameter_name": value,  # Simple, not nested
}

# NEVER:
self.params = {
    "atr": {"mult": 4, "min": 3.0}  # NO nested objects
}
```

**Why**: Consistency, validation, parameter extraction, optimization.

---

### 6. Code Structure Standards

**REQUIRED Imports:**
```python
import pandas as pd
import numpy as np
import requests
import time
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed
import pandas_market_calendars as mcal
from typing import List, Dict, Optional
```

**REQUIRED Class Structure:**
```python
class ScannerName:
    """
    Scanner description
    ====================

    What it detects
    Architecture used
    Performance characteristics
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner with date range"""
        # Configuration
        # Parameters
        # Workers

    def run_scan(self):
        """Main execution method"""
        # Stage 1
        # Stage 2
        # Stage 3

    def _fetch_grouped_day(self, date_str: str):
        """Fetch all tickers for a single day"""

    def _apply_smart_filters(self, df: pd.DataFrame):
        """Reduce dataset by 99%"""

    def detect_patterns(self, df: pd.DataFrame):
        """Apply pattern detection logic"""
```

**REQUIRED Documentation:**
- Class docstring explaining scanner
- Method docstrings for each stage
- Inline comments for complex logic
- Performance metrics in docstring

---

### 7. Data Processing Standards

**Column Naming (Polygon → Internal):**
```python
# REQUIRED: Standardize column names
df = df.rename(columns={
    'T': 'ticker',      # Ticker symbol
    'v': 'volume',      # Volume
    'o': 'open',        # Open price
    'c': 'close',       # Close price
    'h': 'high',        # High price
    'l': 'low',         # Low price
    't': 'timestamp',   # Unix timestamp
    'vw': 'vwap'        # Volume weighted average price
})
```

**Data Type Handling:**
```python
# REQUIRED: Convert dates
df['date'] = pd.to_datetime(df['timestamp'], unit='ms').dt.strftime('%Y-%m-%d')

# REQUIRED: Handle missing values
df = df.dropna(subset=['close', 'volume'])

# REQUIRED: Sort for time-series operations
df = df.sort_values(['ticker', 'date']).reset_index(drop=True)
```

---

### 8. Performance Requirements

**Target Performance:**
- Full market scan: ~2 minutes
- Single ticker: <1 second
- Memory usage: <2GB
- API calls: 456 (one per trading day)

**Optimization Techniques:**
```python
# 1. Vectorized operations (no loops)
df['atr'] = df['true_range'].rolling(14).mean()

# 2. Boolean indexing (not iterrows)
filtered = df[
    (df['volume'] >= df['vol_avg'] * 2) &
    (df['atr'] >= 3.0)
]

# 3. GroupBy operations (not ticker loops)
for ticker, group in df.groupby('ticker'):
    # Process each ticker
```

**Performance Profiling:**
```python
import time

start = time.time()
# ... code ...
elapsed = time.time() - start
print(f"⚡ Stage completed in {elapsed:.2f}s")
```

---

### 9. Error Handling

**REQUIRED Error Handling:**
```python
try:
    data = future.result()
    if data is None or data.empty:
        failed += 1
except Exception as e:
    print(f"❌ Error processing {date}: {e}")
    failed += 1
```

**REQUIRED Logging:**
```python
print(f"🚀 Starting scan...")
print(f"📊 Processing {len(df)} rows...")
print(f"✅ Found {len(results)} signals")
```

---

### 10. Testing & Validation

**REQUIRED Output Format:**
```python
results = [
    {
        'ticker': 'AAPL',
        'date': '2024-12-20',
        'close': 195.50,
        'volume': 50000000,
        'confidence': 0.95,
        # ... scanner-specific fields
    },
    # ... more results
]
```

**REQUIRED Validation:**
- Compare outputs against known results
- Test with different date ranges
- Verify parameter integrity
- Check performance benchmarks

---

## TEMPLATE LIBRARY USAGE

### Templates Are EXAMPLES, Not Templates

**What Templates Provide:**
1. ✅ Examples of correct architecture
2. ✅ Reference implementations
3. ✅ Parameter naming conventions
4. ✅ Performance optimization patterns
5. ✅ Code structure standards

**What Templates Should NOT Be:**
1. ❌ Copy-pasted directly
2. ❌ Modified slightly for new scanners
3. ❌ Used as a crutch

**How Renata Should Use Templates:**

```python
# Renata's internal process when generating code:

1. ANALYZE user input (idea or code)

2. RETRIEVE relevant template examples:
   - "User wants momentum scanner → Get A+ Para example"
   - "User wants gap scanner → Get Backside B example"
   - "User wants reversal scanner → Get LC D2 example"

3. EXTRACT patterns from templates:
   - "A+ Para uses 3-stage architecture → I should too"
   - "Backside B has 5 parallel workers → I should too"
   - "LC D2 uses smart filters → I should too"

4. SYNTHESIZE new code:
   - Apply architecture patterns
   - Use parallel processing patterns
   - Follow parameter conventions
   - Match code structure

5. VALIDATE against requirements:
   - 3-stage architecture? YES
   - Parallel workers? YES
   - Full market scan? YES
   - Parameter integrity? YES
```

---

## FEW-SHOT LEARNING EXAMPLES

### Example 1: Transforming Per-Ticker Scanner

**BEFORE (User's Code):**
```python
# User uploads this - terrible per-ticker loop
tickers = ['AAPL', 'TSLA', 'NVDA', ...]  # Hardcoded list!

for ticker in tickers:
    url = f"https://api.polygon.io/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
    response = requests.get(url)
    # Process one ticker
```

**RENATA LEARNS FROM TEMPLATES:**
```
Template A+ Para shows:
- Uses grouped endpoint, not per-ticker
- Has 5 parallel workers
- Scans full market

Template Backside B shows:
- Same architecture pattern
- Same parallel worker pattern

PATTERN EXTRACTED:
"Always use grouped endpoint with parallel workers for full market scanning"
```

**AFTER (Renata's Output):**
```python
# Renata generates this - follows the pattern
class TransformedScanner:
    def __init__(self):
        self.stage1_workers = 5  # From template pattern

    def run_scan(self):
        with ThreadPoolExecutor(max_workers=self.stage1_workers) as executor:
            future_to_date = {
                executor.submit(self._fetch_grouped_day, date): date
                for date in trading_dates
            }
            # Full market scan, not hardcoded list!
```

### Example 2: Building from Idea

**USER IDEA:**
"I want a scanner that finds stocks with sudden volume spikes followed by price consolidation"

**RENATA'S PROCESS:**
```
1. UNDERSTAND requirements:
   - Volume spike detection
   - Price consolidation pattern
   - Momentum indicators

2. RETRIEVE relevant templates:
   - A+ Para (momentum detection)
   - Backside B (volume patterns)

3. EXTRACT patterns:
   - A+ Para: Uses volume avg, 3-stage architecture
   - Backside B: Uses volume expansion detection
   - Both: Parallel workers, grouped endpoint

4. SYNTHESIZE new scanner:
   - 3-stage architecture (from both)
   - Volume spike detection (adapted from Backside B)
   - Consolidation pattern (new logic)
   - Parallel workers (from both)
   - Full market scan (from both)
```

**RENATA'S OUTPUT:**
```python
class VolumeSpikeConsolidationScanner:
    """
    Detects volume spikes followed by price consolidation

    Architecture: 3-Stage Grouped Endpoint
    Performance: ~2 minutes full market scan
    """

    def __init__(self):
        # From template patterns
        self.stage1_workers = 5
        self.stage3_workers = 10

        # New parameters for this scanner
        self.params = {
            "volume_spike_mult": 3.0,  # Volume 3x average
            "consolidation_days": 5,   # 5 day consolidation
            "consolidation_range_pct": 2.0,  # 2% range
        }

    def _fetch_grouped_day(self, date_str):
        # From template pattern - grouped endpoint
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
        # ...

    def detect_patterns(self, df):
        # New logic, but follows structure patterns
        df['vol_avg'] = df.groupby('ticker')['volume'].transform(
            lambda x: x.rolling(20).mean()
        )
        df['volume_spike'] = df['volume'] >= (df['vol_avg'] * self.params['volume_spike_mult'])

        # Consolidation detection
        # ...
```

---

## PROMPT ENGINEERING STRATEGY

### System Prompt (Always Included)

```
You are Renata, an expert scanner architect for the Edge Dev trading system.

NON-NEGOTIABLE REQUIREMENTS:
1. 3-Stage Grouped Endpoint Architecture
   - Stage 1: Fetch grouped data (5 parallel workers)
   - Stage 2: Smart filters (reduce by 99%)
   - Stage 3: Pattern detection (10 parallel workers)

2. Full Market Scanning
   - Use Polygon grouped endpoint
   - Scan ALL tickers (no hardcoded lists)
   - Discover market dynamically

3. Parallel Workers
   - Stage 1: 5 workers for data fetching
   - Stage 3: 10 workers for pattern detection
   - Use ThreadPoolExecutor

4. Parameter Integrity
   - All parameters in self.params dict
   - Use exact parameter names
   - No nested objects

5. Polygon API Integration
   - API key: Fm7brz4s23eSocDErnL68cE7wspz2K1I
   - Grouped endpoint: /v2/aggs/grouped/locale/us/market/stocks/{date}
   - Connection pooling for performance

6. Code Structure Standards
   - Required imports (pandas, numpy, requests, concurrent.futures)
   - Class-based structure
   - Comprehensive docstrings
   - Performance logging

7. Performance Requirements
   - Full market scan: ~2 minutes
   - API calls: 456 (one per trading day)
   - Memory usage: <2GB

LEARN FROM THE FOLLOWING TEMPLATE EXAMPLES:
[Insert relevant template examples here]

TRANSFORMATION PRINCIPLES:
- Maintain user's intent/logic
- Transform to 3-stage architecture
- Add parallel workers
- Use grouped endpoint
- Preserve parameter names
- Follow code structure standards

NEVER:
- Use per-ticker loops
- Use hardcoded ticker lists
- Skip parallel workers
- Violate 3-stage architecture
- Compromise parameter integrity
```

### Dynamic Prompt Context

**When formatting uploaded code:**
```
USER CODE:
[uploaded code]

ANALYSIS:
- Current architecture: [detected]
- Missing components: [identified]
- Transformation needed: [listed]

RELEVANT TEMPLATE EXAMPLES:
1. A+ Para Scanner [show key patterns]
2. Backside B Scanner [show key patterns]

Transform the user's code following the non-negotiable requirements and template patterns.
```

**When building from scratch:**
```
USER IDEA:
[user's description]

REQUIREMENTS ANALYSIS:
- Pattern type: [detected]
- Indicators needed: [identified]
- Parameters needed: [extracted]

RELEVANT TEMPLATE EXAMPLES:
1. Similar momentum scanner: A+ Para [show patterns]
2. Similar volume scanner: Backside B [show patterns]

Build a new scanner following the non-negotiable requirements and adapting patterns from templates.
```

---

## VALIDATION FRAMEWORK

### Pre-Generation Validation
- [ ] User intent understood
- [ ] Architecture requirements identified
- [ ] Template examples retrieved
- [ ] Parameters identified

### Post-Generation Validation
- [ ] 3-stage architecture used
- [ ] Parallel workers implemented
- [ ] Full market scan capability
- [ ] Parameter integrity maintained
- [ ] Polygon API integrated correctly
- [ ] Code structure standards followed
- [ ] Performance requirements met

### Execution Validation (Optional)
- [ ] Execute generated scanner
- [ ] Compare outputs to expected
- [ ] Performance benchmark
- [ ] Signal accuracy validation

---

## IMPLEMENTATION PLAN

### Phase 1: System Specification ✅
- [x] Define all non-negotiable requirements
- [x] Document architecture patterns
- [x] Create template usage guidelines

### Phase 2: Prompt Engineering
- [ ] Build system prompt with all requirements
- [ ] Create few-shot examples from templates
- [ ] Implement dynamic context injection

### Phase 3: Template Integration
- [ ] Build template retrieval system
- [ ] Extract patterns from templates
- [ ] Create few-shot learning examples

### Phase 4: Validation System
- [ ] Pre-generation validation
- [ ] Post-generation validation
- [ ] Execution validation

### Phase 5: Testing
- [ ] Test formatting uploaded code
- [ ] Test building from ideas
- [ ] Test new scanner types
- [ ] Validate against requirements

---

## SUCCESS METRICS

**Formatting Uploaded Code:**
- ✅ 100% architecture compliance
- ✅ 100% parallel worker usage
- ✅ 100% full market scan capability
- ✅ 100% parameter integrity
- ✅ <10% performance degradation vs original

**Building from Scratch:**
- ✅ 100% architecture compliance
- ✅ Reasonable parameter choices
- ✅ Executable code
- ✅ Follows all non-negotiables

**New Scanner Types:**
- ✅ Can create scanners we've never seen
- ✅ Follows all patterns correctly
- ✅ Maintains Edge Dev standards
- ✅ Produces accurate signals

---

**Status**: Specification Complete
**Date**: 2025-12-29
**Purpose**: Define Renata's true architecture and requirements
