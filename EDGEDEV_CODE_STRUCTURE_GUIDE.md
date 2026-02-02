# EdgeDev Code Structure Guide
**How to Write Scanner Code - Methodology & Patterns**

**Purpose**: Teach the PATTERNS of writing good scanner code, regardless of specific pattern type.

**Research Date**: 2026-01-29
**Status**: COMPLETE - Code Structure Methodology

---

## Table of Contents

1. [The Scanner Development Framework](#the-scanner-development-framework)
2. [Expressing a Mold in Code](#expressing-a-mold-in-code)
3. [Code Structure Patterns](#code-structure-patterns)
4. [Parameter System Design](#parameter-system-design)
5. [Data Flow Architecture](#data-flow-architecture)
6. [Validation Patterns](#validation-patterns)
7. [Anti-Patterns to Avoid](#anti-patterns-to-avoid)
8. [Code Templates](#code-templates)

---

## The Scanner Development Framework

### The Process (From Idea to Working Scanner)

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        SCANNER DEVELOPMENT LIFECYCLE                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DESCRIBE THE MOLD (Plain English)                                 │
│     "Stock runs up for 5-10 days, gaps up 3%+, holds high, fades"     │
│                          │                                              │
│                          ▼                                              │
│  2. IDENTIFY A+ EXAMPLES (Real Trades)                                │
│     • NVDA Jan 8, 2025: 4.2% gap, held 0.3% range, closed down      │
│     • TSLA Dec 3, 2024: 3.8% gap, held tight, faded 2.1%            │
│     • AAPL Nov 15, 2024: 5.1% gap, perfect fade                     │
│                          │                                              │
│                          ▼                                              │
│  3. EXTRACT PARAMETERS FROM A+ (Quantify the Mold)                  │
│     From NVDA Jan 8:                                                 │
│     • gap_percent = 4.2%     → min_gap = 3.5%                        │
│     • hold_range = 0.3%     → max_hold = 0.5%                        │
│     • fade_amount = -1.8%   → min_fade = -1.0%                       │
│     • volume_ratio = 2.1x    → min_vol_ratio = 2.0                     │
│                          │                                              │
│                          ▼                                              │
│  4. CHOOSE CODE STRUCTURE (Based on complexity)                     │
│     Simple?  → Standalone script                                     │
│     Medium?  → Function-based                                         │
│     Complex? → Class-based (V31)                                       │
│                          │                                              │
│                          ▼                                              │
│  5. IMPLEMENT THE MOLD (Write code)                                  │
│     • Data fetching                                                   │
│     • Feature calculation                                            │
│     • Pattern detection                                             │
│     • Result filtering                                               │
│                          │                                              │
│                          ▼                                              │
│  6. VALIDATE WITH A+ (Ground truth test)                            │
│     • Run scanner on dates around A+ examples                       │
│     • NVDA Jan 8 MUST appear in results                             │
│     • Visual spot-check on random results                           │
│                          │                                              │
│                          ▼                                              │
│  7. DEBUG WITH PARAMETER CHECKING (See what failed)                │
│     • Why didn't AAPL trigger?                                     │
│     • Check each parameter value on that date                       │
│     • Adjust thresholds if needed                                   │
│                          │                                              │
│                          ▼                                              │
│  8. EXPAND TO HISTORICAL (Full date range)                          │
│     • Run on 1-2 years of data                                       │
│     • Verify edge potential                                         │
│     • Save working scanner                                          │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Expressing a Mold in Code

### What is a "Mold"?

A **mold** is the pattern shape you're looking for. It's the visual/technical criteria that define "this is a setup."

### Example: Gap-and-Fade Mold

**Plain English Description:**
```
I want stocks that:
1. Have been running up for 5-10 days (uptrend)
2. Gap up at least 3% on D0
3. Open near the high and hold it (within 0.5% range)
4. Close weak (below open)
5. Had high volume on the gap
```

### Step 1: Break Down the Mold into Testable Conditions

```python
# Condition 1: Uptrend (5-10 days)
# How to test: Check if recent closes are higher than older closes

# Condition 2: Gap up >= 3%
# How to test: (open - prev_close) / prev_close >= 0.03

# Condition 3: Hold the high (within 0.5%)
# How to test: (high - open) / open <= 0.005

# Condition 4: Close weak
# How to test: close < open

# Condition 5: High volume
# How to test: volume >= avg_volume * 2
```

### Step 2: Calculate Parameters from A+ Example

```python
# A+ Example: NVDA on Jan 8, 2025
example = {
    'date': '2025-01-08',
    'gap_pct': 4.2,      # 4.2% gap
    'hold_range': 0.3,  # Held within 0.3% of high
    'close_change': -1.8,  # Closed down 1.8%
    'volume_ratio': 2.1  # 2.1x average volume
}

# Convert to scanner parameters with tolerance
params = {
    'min_gap': 3.5,          # 4.2 * 0.9 (10% tolerance)
    'max_hold_range': 0.5,  # 0.3 * 1.1 (10% tolerance)
    'require_close_down': True,
    'min_volume_ratio': 2.0  # 2.1 * 0.95
}
```

### Step 3: Implement the Mold in Code

```python
def detect_gap_and_fade(df, params):
    """
    Detect gap-and-fade mold.

    Returns: DataFrame with boolean 'is_setup' column
    """
    # Calculate required features
    df['gap_pct'] = (df['open'] - df['close'].shift(1)) / df['close'].shift(1)
    df['hold_range'] = (df['high'] - df['open']) / df['open']
    df['close_down'] = df['close'] < df['open']
    df['avg_volume'] = df['volume'].rolling(20).mean()
    df['volume_ratio'] = df['volume'] / df['avg_volume']

    # Uptrend condition (5-10 day lookback)
    df['is_uptrend'] = (
        df['close'] > df['close'].shift(5) &  # Higher than 5 days ago
        df['close'] > df['close'].shift(10)  # Higher than 10 days ago
    )

    # Apply the mold
    df['is_setup'] = (
        (df['gap_pct'] >= params['min_gap']) &
        (df['hold_range'] <= params['max_hold_range']) &
        (df['close_down'] == True) &
        (df['volume_ratio'] >= params['min_volume_ratio']) &
        (df['is_uptrend'] == True)
    )

    return df
```

### Key Principle: Each Condition is Independent

```python
# ✅ CORRECT: Each condition tested separately
condition1 = df['gap_pct'] >= params['min_gap']
condition2 = df['hold_range'] <= params['max_hold_range']
condition3 = df['close'] < df['open']
condition4 = df['volume_ratio'] >= params['min_volume_ratio']
condition5 = df['is_uptrend']

all_conditions = condition1 & condition2 & condition3 & condition4 & condition5

# ❌ WRONG: Nested conditions make debugging impossible
if df['gap_pct'] >= params['min_gap']:
    if df['hold_range'] <= params['max_hold_range']:
        if df['close'] < df['open']:
            # Can't debug which condition failed
            pass
```

**Why This Matters**: When debugging, you want to see:
- Condition 1: ✓ PASSED
- Condition 2: ✗ FAILED (hold_range was 0.6%, max is 0.5%)
- Condition 3: ✓ PASSED
- ...

---

## Code Structure Patterns

### Pattern 1: Standalone Script (Simple Patterns)

**When to Use**: Testing ideas, simple patterns, quick validation

```python
import pandas as pd
import requests

API_KEY = "your_key"
BASE_URL = "https://api.polygon.io"

# Configuration
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'NVDA']
START_DATE = "2024-01-01"
END_DATE = "2024-12-31"

# Parameters
PARAMS = {
    'min_gap': 0.03,
    'min_volume': 10_000_000
}

def fetch_data(symbol, start, end):
    """Fetch OHLC data for a symbol."""
    url = f"{BASE_URL}/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}"
    resp = requests.get(url, params={'apiKey': API_KEY})
    data = resp.json().get('results', [])
    return pd.DataFrame(data)

def scan_symbol(symbol, start, end, params):
    """Scan one symbol for the pattern."""
    df = fetch_data(symbol, start, end)

    # Calculate features
    df['gap'] = (df['o'] - df['c'].shift(1)) / df['c'].shift(1)

    # Apply conditions
    setups = df[df['gap'] >= params['min_gap']]

    # Format results
    results = []
    for idx, row in setups.iterrows():
        results.append({
            'symbol': symbol,
            'date': row['t'],
            'gap': row['gap']
        })

    return results

# Main execution
if __name__ == '__main__':
    all_results = []
    for symbol in SYMBOLS:
        results = scan_symbol(symbol, START_DATE, END_DATE, PARAMS)
        all_results.extend(results)

    print(f"Found {len(all_results)} setups")
```

**Pros**: Simple, fast to write
**Cons**: Not scalable, hard to maintain

---

### Pattern 2: Function-Based (Medium Complexity)

**When to Use**: Multiple patterns, reusable code

```python
import pandas as pd
import requests
from typing import List, Dict

class ScannerConfig:
    """Configuration for scanner parameters."""
    min_gap: float = 0.03
    min_volume: int = 10_000_000
    min_price: float = 10.0

def fetch_data(symbols: List[str], start: str, end: str) -> pd.DataFrame:
    """Fetch data for multiple symbols."""
    all_data = []
    for symbol in symbols:
        # Fetch logic here
        pass
    return pd.concat(all_data)

def calculate_features(df: pd.DataFrame) -> pd.DataFrame:
    """Calculate all required features."""
    df['gap'] = (df['open'] - df['close'].shift(1)) / df['close'].shift(1)
    df['volume_avg'] = df['volume'].rolling(20).mean()
    df['volume_ratio'] = df['volume'] / df['volume_avg']
    return df

def detect_pattern(df: pd.DataFrame, config: ScannerConfig) -> pd.DataFrame:
    """Detect the pattern."""
    setups = df[
        (df['gap'] >= config.min_gap) &
        (df['volume'] >= config.min_volume) &
        (df['close'] >= config.min_price)
    ]
    return setups

def run_scan(symbols: List[str], start: str, end: str, config: ScannerConfig) -> List[Dict]:
    """Main scan execution."""
    df = fetch_data(symbols, start, end)
    df = calculate_features(df)
    setups = detect_pattern(df, config)
    return setups.to_dict('records')
```

**Pros**: Modular, testable, reusable
**Cons**: More boilerplate

---

### Pattern 3: Class-Based V31 (Production)

**When to Use**: Complex patterns, high performance requirements

```python
import pandas as pd
import requests
from concurrent.futures import ThreadPoolExecutor
import pandas_market_calendars as mcal

class TradingScanner:
    """
    Production scanner using V31 architecture.

    5-Stage Pipeline:
    1. Fetch grouped data
    2a. Compute simple features
    2b. Apply smart filters
    3a. Compute full features
    3b. Detect patterns
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        """Initialize scanner."""
        # Configuration
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"
        self.session = requests.Session()

        # Date range
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end

        # Calculate historical buffer
        lookback = self.params.get('abs_lookback_days', 1000) + 50
        scan_start = pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)
        self.scan_start = scan_start.strftime('%Y-%m-%d')

        # Parameters
        self.params = {
            'price_min': 8.0,
            'adv20_min_usd': 30_000_000,
            # ... pattern-specific params
        }

        # Workers
        self.stage1_workers = 5
        self.stage3_workers = 10

    def run_scan(self) -> List[Dict]:
        """Execute the 5-stage pipeline."""
        # Stage 1: Fetch
        stage1_data = self.fetch_grouped_data()

        # Stage 2a: Simple features
        stage2a_data = self.compute_simple_features(stage1_data)

        # Stage 2b: Smart filters
        stage2b_data = self.apply_smart_filters(stage2a_data)

        # Stage 3a: Full features
        stage3a_data = self.compute_full_features(stage2b_data)

        # Stage 3b: Detect
        results = self.detect_patterns(stage3a_data)

        return results

    def fetch_grouped_data(self) -> pd.DataFrame:
        """Stage 1: Fetch all tickers for all dates."""
        # Implementation here
        pass

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2a: Compute cheap features."""
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(20, min_periods=20).mean()
        )
        return df

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 2b: Filter D0, preserve historical."""
        # Separate historical from D0
        df_historical = df[~df['date'].between(self.d0_start_user, self.d0_end_user)]
        df_output = df[df['date'].between(self.d0_start_user, self.d0_end_user)]

        # Filter only D0
        df_filtered = df_output[
            (df_output['prev_close'] >= self.params['price_min']) &
            (df_output['adv20'] >= self.params['adv20_min_usd'])
        ]

        # Recombine
        return pd.concat([df_historical, df_filtered])

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Stage 3a: Compute expensive features."""
        # EMA, ATR, slopes, etc.
        pass

    def detect_patterns(self, df: pd.DataFrame) -> List[Dict]:
        """Stage 3b: Pattern detection logic."""
        # Pattern-specific detection
        pass
```

**Pros**: Fast, scalable, maintainable
**Cons**: More complex, higher learning curve

---

## Parameter System Design

### Pattern 1: Flat Dictionary (Simple)

```python
params = {
    'min_gap': 0.03,
    'max_hold_range': 0.005,
    'min_volume': 10_000_000,
    'min_price': 10.0
}

# Usage: df['gap'] >= params['min_gap']
```

### Pattern 2: Grouped by Category (Better)

```python
params = {
    # Price filters
    'price_min': 10.0,
    'gap_min': 0.03,
    'hold_range_max': 0.005,

    # Volume filters
    'volume_min': 10_000_000,
    'volume_ratio_min': 2.0,
    'adv20_min_usd': 30_000_000,

    # Trend filters
    'require_uptrend': True,
    'require_d1_green': True,

    # Significance filters
    'level_pos_abs_min': 0.85,
    'is_pivot_high': True
}
```

**Benefits**:
- Easy to find related parameters
- Simple to document
- Clear what each group controls

### Pattern 3: Parameter Objects (Advanced)

```python
from dataclasses import dataclass
from typing import Optional

@dataclass
class ScannerParams:
    """Type-safe parameter configuration."""

    # Price parameters
    price_min: float = 10.0
    gap_min: float = 0.03
    hold_range_max: float = 0.005

    # Volume parameters
    volume_min: int = 10_000_000
    volume_ratio_min: float = 2.0

    # Toggle parameters
    require_uptrend: bool = True
    require_d1_green: bool = True

    def validate(self) -> List[str]:
        """Validate parameters for consistency."""
        errors = []
        if self.gap_min < 0:
            errors.append("gap_min must be positive")
        if self.price_min < 1:
            errors.append("price_min too low")
        return errors

# Usage
params = ScannerParams(
    price_min=10.0,
    gap_min=0.03
)

if errors := params.validate():
    print(f"Invalid parameters: {errors}")
```

**Benefits**:
- Type safety
- Validation built-in
- IDE autocomplete
- Self-documenting

---

## Data Flow Architecture

### The Golden Rule: Separate Historical from D0

```python
# ❌ WRONG: Loses historical data
df_filtered = df[df['date'] >= d0_start]
df_filtered['atr'] = df_filtered['atr'].rolling(14).mean()  # WRONG! Lost history

# ✅ CORRECT: Preserve historical data
df_historical = df[df['date'] < d0_start]  # Keep for context
df_d0 = df[df['date'] >= d0_start]

# Calculate on full dataset, then filter
df['atr'] = df['atr'].rolling(14).mean()

# Filter D0 for output, keep historical for computation
df_output = df_d0[
    (df_d0['gap'] >= params['min_gap']) &
    (df_d0['volume'] >= params['volume_min'])
]
```

### Why This Matters

Many indicators need historical data:
- **ATR**: Needs 14+ periods
- **EMA**: Needs period length
- **Slope**: Needs window length
- **Position in range**: Needs 1000-day window

If you filter before calculating, you get WRONG results.

---

## Validation Patterns

### Pattern 1: A+ Example Validation

```python
def validate_with_a_plus_examples(scanner, a_plus_examples, params):
    """
    Validate that scanner finds A+ examples.

    Args:
        scanner: Scanner function
        a_plus_examples: List of {'symbol': 'NVDA', 'date': '2025-01-08'}
        params: Scanner parameters

    Returns:
        Validation results
    """
    results = []

    for example in a_plus_examples:
        # Run scanner around that date
        start = (pd.to_datetime(example['date']) - timedelta(days=5)).strftime('%Y-%m-%d')
        end = (pd.to_datetime(example['date']) + timedelta(days=5)).strftime('%Y-%m-%d')

        setups = scanner(example['symbol'], start, end, params)

        # Check if A+ example is found
        found = any(
            s['date'] == example['date'] and
            s['symbol'] == example['symbol']
            for s in setups
        )

        results.append({
            'example': example,
            'found': found
        })

    return results
```

### Pattern 2: Parameter Debugging

```python
def debug_parameters_on_date(symbol, date, params):
    """
    Show what each parameter value is on a specific date.

    Useful for understanding why a setup didn't trigger.
    """
    df = fetch_data(symbol, date, date)

    # Calculate all parameters
    gap_pct = (df['open'] / df['close'].shift(1) - 1).iloc[0]
    hold_range = (df['high'] - df['open']) / df['open'].iloc[0]
    close_down = df['close'].iloc[0] < df['open'].iloc[0]
    volume_ratio = df['volume'].iloc[0] / df['volume'].rolling(20).mean().iloc[0]

    # Check each condition
    print(f"{symbol} on {date}:")
    print(f"  gap_pct: {gap_pct:.4f} >= {params['min_gap']:.4f} ? {gap_pct >= params['min_gap']}")
    print(f"  hold_range: {hold_range:.4f} <= {params['max_hold_range']:.4f} ? {hold_range <= params['max_hold_range']}")
    print(f"  close_down: {close_down} (required: True)")
    print(f"  volume_ratio: {volume_ratio:.2f} >= {params['min_volume_ratio']:.2f} ? {volume_ratio >= params['min_volume_ratio']}")
```

**Output**:
```
NVDA on 2025-01-08:
  gap_pct: 0.0420 >= 0.0300 ? True
  hold_range: 0.0030 <= 0.0050 ? True
  close_down: True (required: True)
  volume_ratio: 2.10 >= 2.00 ? True

✓ ALL CONDITIONS PASSED
```

---

## Anti-Patterns to Avoid

### Anti-Pattern 1: Nested Conditions

```python
# ❌ WRONG: Hard to debug
if gap >= params['min_gap']:
    if volume >= params['min_volume']:
        if close < open:
            if is_uptrend:
                return True

# ✅ CORRECT: Flat conditions
all_passed = (
    (gap >= params['min_gap']) and
    (volume >= params['min_volume']) and
    (close < open) and
    is_uptrend
)
return all_passed
```

### Anti-Pattern 2: Magic Numbers

```python
# ❌ WRONG: What is 0.03? What is 10000000?
if gap >= 0.03 and volume >= 10000000:
    pass

# ✅ CORRECT: Named parameters
GAP_MIN = 0.03
VOLUME_MIN = 10_000_000

if gap >= GAP_MIN and volume >= VOLUME_MIN:
    pass
```

### Anti-Pattern 3: Forward-Looking Bias

```python
# ❌ WRONG: Uses future data in calculation
df['future_return'] = df['close'].shift(-2)  # Peeks into future
df['signal'] = df['future_return'] > 0  # Impossible to know in real-time

# ✅ CORRECT: Only use current and past data
df['signal'] = (
    df['gap'] >= params['min_gap']  # Known at open
)  # All data from current or past
```

### Anti-Pattern 4: Not Grouping by Ticker

```python
# ❌ WRONG: Calculates across all tickers together
df['adv20'] = (df['close'] * df['volume']).rolling(20).mean()
# Problem: AAPL's volume affects MSFT's average

# ✅ CORRECT: Per-ticker calculation
df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
    lambda x: x.rolling(20, min_periods=20).mean()
)
```

---

## Code Templates

### Template 1: Simple Mean Reversion Scanner

```python
import pandas as pd
import requests
from typing import List, Dict

API_KEY = "your_key"
BASE_URL = "https://api.polygon.io"

class MeanReversionScanner:
    """Base template for mean reversion scanners."""

    def __init__(self, params: Dict):
        self.params = params
        self.session = requests.Session()

    def fetch_data(self, symbols: List[str], start: str, end: str) -> pd.DataFrame:
        """Fetch data for symbols."""
        all_data = []
        for symbol in symbols:
            url = f"{BASE_URL}/v2/aggs/ticker/{symbol}/range/1/day/{start}/{end}"
            resp = self.session.get(url, params={'apiKey': API_KEY})
            data = resp.json().get('results', [])
            if data:
                df = pd.DataFrame(data)
                df['symbol'] = symbol
                all_data.append(df)
        return pd.concat(all_data, ignore_index=True)

    def calculate_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """Calculate features. Override in subclass."""
        df['gap'] = (df['o'] - df['c'].shift(1)) / df['c'].shift(1)
        df['volume_avg'] = df.groupby('symbol')['v'].transform(
            lambda x: x.rolling(20).mean()
        )
        return df

    def detect_setup(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect setup. Override in subclass."""
        raise NotImplementedError("Subclass must implement detect_setup")

    def scan(self, symbols: List[str], start: str, end: str) -> List[Dict]:
        """Run the scan."""
        df = self.fetch_data(symbols, start, end)
        df = self.calculate_features(df)
        setups = self.detect_setup(df)
        return setups.to_dict('records')


class GapAndFadeScanner(MeanReversionScanner):
    """Concrete implementation: Gap and fade setup."""

    def detect_setup(self, df: pd.DataFrame) -> pd.DataFrame:
        """Detect gap-and-fade pattern."""
        return df[
            (df['gap'] >= self.params.get('min_gap', 0.03)) &
            (df['volume'] >= self.params.get('min_volume', 10_000_000)) &
            (df['c'] < df['o'])  # Close down (weak close)
        ]


# Usage
scanner = GapAndFadeScanner(params={
    'min_gap': 0.03,
    'min_volume': 10_000_000
})

results = scanner.scan(
    symbols=['AAPL', 'MSFT', 'TSLA'],
    start='2024-01-01',
    end='2024-12-31'
)
```

---

## Summary: The Methodology

### When Building ANY Scanner:

1. **Start with the Mold**: What does the setup look like?
2. **Find A+ Examples**: Real trades that represent the mold
3. **Extract Parameters**: Quantify what makes those trades work
4. **Choose Structure**: Simple, Function, or Class-based
5. **Implement**: Write the code
6. **Validate**: Check against A+ examples
7. **Debug**: Use parameter checking to fix issues
8. **Expand**: Run on historical data

### Key Principles:

1. **Flat Conditions**: Never nest if-statements
2. **Named Parameters**: No magic numbers
3. **Per-Ticker Operations**: Always group by ticker
4. **Preserve Historical**: Keep historical data for calculations
5. **Validate Continuously**: Always check against A+ examples
6. **Debug Visually**: Look at charts to verify

---

**Document Status**: COMPLETE
**Version**: 1.0
**Last Updated**: 2026-01-29
