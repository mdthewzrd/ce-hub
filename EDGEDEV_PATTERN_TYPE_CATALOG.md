# EdgeDev Pattern Type Catalog
**Comprehensive Guide to Different Trading Pattern Approaches**

**Purpose**: Document ALL pattern types used in EdgeDev, not just Backside B variants.

**Research Date**: 2026-01-29
**Status**: COMPLETE - Pattern Diversity Analysis

---

## Table of Contents

1. [Pattern Type Matrix](#pattern-type-matrix)
2. [Multi-Day Momentum (DMR)](#1-multi-day-momentum-dmr)
3. [Fade Breakout (FBO)](#2-fade-breakout-fbo)
4. [Extension Gaps](#3-extension-gaps)
5. [Parabolic Extensions (Daily Para)](#4-parabolic-extensions-daily-para)
6. [Frontside Extensions (FRD)](#5-frontside-extensions-frd)
7. [3-Day Trigger (LC 3 Day)](#6-3-day-trigger-lc-3-day)
8. [Code Structure Comparison](#code-structure-comparison)
9. [Parameter System Patterns](#parameter-system-patterns)
10. [When to Use Which Pattern](#when-to-use-which-pattern)

---

## Pattern Type Matrix

| Pattern Type | Direction | Time Horizon | Core Logic | Complexity |
|--------------|----------|--------------|-------------|------------|
| **DMR** | Long | Multi-day (D2-D4) | Trigger high → continuation | High |
| **FBO** | Short | 1-2 days | Gap into resistance → fade | High |
| **Extension Gap** | Long | Daily | Extended move → gap continuation | Medium |
| **Daily Para** | Long | Daily | Parabolic extension → continuation | Medium |
| **FRD EXT Gap** | Long | Daily | Frontside extension + gap | Medium |
| **LC 3d Gap** | Long | Daily | 3-day gap setup | Low |
| **Backside B** | Short | Daily | Gap up → hold high → fade | Medium |

**Key Insight**: Each pattern type targets a DIFFERENT market condition and behavior.

---

## 1. Multi-Day Momentum (DMR)

**File**: `SC DMR SCAN.py`

### What It Is
Multi-day setup where a strong trigger high is followed by continuation patterns over 2-4 days.

### Core Logic
```
D-10 to D-2: Strong uptrend, forming a "trigger high"
D-1: Consolidation or pause
D0: Gap open + continuation trigger
```

### Key Parameters
```python
# Trigger high validation
valid_trig_high = (
    prev_high >= prev_high_2 and
    prev_high >= prev_high_3 and
    ...
    prev_high >= prev_high_10  # Highest in last 10 periods
)

# Pre-market gap
dol_pmh_gap >= prev_range * 0.5
pct_pmh_gap >= 0.5  # 0.5% gap in pre-market

# D0 continuation
gap >= 0.2  # At least 0.2% gap
dol_gap >= prev_range * 0.3
```

### Setup Variants
1. **D2 PM Setup**: Parabolic move + pre-market gap
2. **D2 PMH Break**: Gap + trade through pre-market high
3. **D2 No PMH Break**: Gap + don't trade PMH
4. **D2 Extreme Gap**: Massive gap (>1x range)
5. **D3**: Two days of strong moves
6. **D4**: Three days of strong moves

### When to Use
- **Market Condition**: Strong momentum markets
- **Stock Type**: High beta, high volatility
- **Volatility**: Expansion periods
- **Timeframe**: Bull markets, strong uptrends

### What Makes It Unique
- **Multi-day persistence**: Not just a 1-day setup
- **Trigger high validation**: Must be THE high in a window
- **Pre-market analysis**: Uses PM data for confirmation

### Code Structure
```python
# Step 1: Calculate valid trigger high
df['valid_trig_high'] = (
    df['prev_high'] >= df['prev_high_2'] &  # Highest of last 10
    df['prev_high'] >= df['prev_high_3'] &
    ...
    df['prev_high'] >= df['prev_high_10']
)

# Step 2: Calculate pre-market gap
df['dol_pmh_gap'] = df['pm_high'] - df['prev_close']
df['pct_pmh_gap'] = df['pm_high'] / df['prev_close'] - 1

# Step 3: Pattern-specific conditions
df['d2_pm_setup'] = (
    df['valid_trig_high'] &
    (df['prev_high'] / df['prev_close_1'] - 1) >= 1 &  # Doubled
    df['dol_pmh_gap'] >= df['prev_range'] * 0.5 &
    df['prev_close_range'] >= 0.5 &  # Strong D-1
    df['prev_close'] >= df['prev_open']  # Green D-1
)
```

---

## 2. Fade Breakout (FBO)

**File**: `daily fbo/mold 1 scan.py`

### What It Is
Fades a gap-up INTO resistance. The logic is: stock gaps up toward a significant high, then fades.

### Core Logic
```
Historical (1000 days): Find significant high
Between (level date → D0): Pullback required
D0: Gap UP toward level → Touch/fade → Short signal
```

### Key Parameters
```python
# Level selection
lookback_days_for_level = 1000  # Look back 1000 days
sig_require_pivot = True  # Level must be pivot high
sig_level_pos_abs_min = 0.85  # In top 15% of range
sig_prom_atr_min = 1.5  # Prominence vs valleys

# D0 gap conditions
gap_min_pct = 2.0  # Must gap at least 2%
touch_tol_pct = 1.0  # Within 1% of level counts

# Pullback between
min_low_pullback_min_pct = 10.0  # Must pull back 10% from level
```

### Significance Metrics
```python
# Where is level in absolute range?
LevelPosAbs = (level - abs_low) / (abs_top - abs_low)

# What % of absolute high?
LevelPctOfTop = level / abs_top

# Is this a real pivot high?
IsPivotHigh = level is higher than surrounding highs

# How prominent vs local valleys?
LevelPivotProm_ATR = (level - local_valley) / ATR
```

### When to Use
- **Market Condition**: Choppy, range-bound markets
- **Stock Type: Names hitting resistance
- **Volatility**: Low to medium
- **Timeframe**: Any, but best in ranging markets

### What Makes It Unique
- **Historical level validation**: Uses 1000-day lookback
- **Pivot detection**: Level must be technically significant
- **Pullback requirement**: Must pull away from level first
- **Direction**: SHORT (unlike most others)

### Code Structure
```python
# Step 1: Find significant high
def pick_level_date(m, d0, p):
    # Look back 1000 days
    prior = m[(m.index >= d0 - timedelta(days=1000)) & (m.index < d0)]

    # Find pivot highs
    pivots = _pivot_high_dates(prior, left=3, right=3)

    # Prefer pivot, fallback to max
    if pivots:
        return last_occurrence_of_max(prior.loc[pivots]["High"])

# Step 2: Validate significance
sig = significance_metrics(m, level_date, d0, p)
# Returns: LevelPosAbs, IsPivotHigh, LevelPivotProm_ATR, etc.

# Step 3: Check D0 gap toward level
gap_pct = (open - prev_close) / prev_close * 100
touch_pct = (open - level) / level * 100  # How close to level?
```

---

## 3. Extension Gaps

**File**: `LC 3d Gap/scan.py`

### What It Is
Gaps that occur AFTER an extended move (not reversal gaps, continuation gaps).

### Core Logic
```
D-65 to D-5: Extended uptrend (measured by EMA distance)
D-2: Strong push higher
D-1: New high (swing high)
D0: Gap open → continuation
```

### Key Parameters
```python
# EMA distance (as multiple of ATR)
day_14_avg_ema_10 >= 0.25  # Extended over 14 days
day_7_avg_ema_10 >= 0.25   # Extended over 7 days
day_3_avg_ema_10 >= 0.5    # Recently extended

# D-1 strength
day_1_ema_distance_10 >= 1.5  # High is 1.5x ATR above EMA
day_1_ema_distance_30 >= 3.0  # High is 3x ATR above EMA

# Gap requirements
day_0_gap >= 0.5 * ATR  # Gap at least half ATR
```

### Swing High Detection
```python
def calculate_swing_high(data, start_offset, end_offset):
    """
    Find highest high that is surrounded by lower highs.

    A swing high is a local maximum.
    """
    swing_highs = []

    for i in range(1, len(range_data) - 1):
        if (curr_high > prev_high and
            curr_high > next_high):
            swing_highs.append(curr_high)

    return max(swing_highs)
```

### When to Use
- **Market Condition**: Trending markets with extended moves
- **Stock Type**: Momentum names
- **Volatility**: Medium to high
- **Timeframe**: Bull markets

### What Makes It Unique
- **Extension detection**: Measures how extended stock already is
- **Multi-timeframe EMA**: Uses both 10 and 30 period EMAs
- **Swing high validation**: Recent high must be "real"
- **Gap continuation**: Gap is AFTER extension, not the start

---

## 4. Parabolic Extensions (Daily Para)

**File**: `Daily Para/other half a+ scan.py`

### What It Is
Parabolic move detection - stocks that are accelerating upward.

### Core Logic
```
D-50 to D-1: Accelerating uptrend
D-1: Strong green candle
D0: Gap open + continuation
```

### Key Parameters
```python
# Slope requirements (measured in %)
slope3d_min = 10    # 3-day slope >= 10%
slope5d_min = 20    # 5-day slope >= 20%
slope15d_min = 40   # 15-day slope >= 40%

# Custom 50-day slope
slope50d = (ema9[-4] - ema9[-50]) / ema9[-50] * 100

# Gap requirements
gap_div_atr_min = 0.5  # Gap >= 0.5x ATR

# Position within range
upper_70_range >= 65  # Close in upper 70% of D-1 range
```

### Metrics
```python
# Slope = EMA change over time
Slope_9_3d = (ema9 - ema9.shift(3)) / ema9.shift(3) * 100

# 50-day slope (custom window)
Slope_9_4to50d = (ema9.shift(4) - ema9.shift(50)) / ema9.shift(50) * 100

# Gap vs ATR
gap_div_atr = gap / (0.5 * atr)

# Close position in range
upper_70_range = (close - low) / (high - low) * 100
```

### When to Use
- **Market Condition**: Meme stocks, speculative frenzies
- **Stock Type**: High beta, small caps
- **Volatility**: High
- **Timeframe**: Speculative periods

### What Makes It Unique
- **Acceleration focus**: Measures rate of change, not just level
- **Multiple slope windows**: 3d, 5d, 15d, 50d
- **Upper range requirement**: Stock must close strong
- **Parabolic detection**: Finds accelerating moves

---

## 5. Frontside Extensions (FRD)

**File**: `FRD EXT Gap/scan.py`

### What It Is
"Frontside" means the FIRST extended move before a consolidation or reversal.

### Core Logic
```
Historical: Stock in downtrend or consolidation
Recent: Frontside breakout begins
D0: Gap confirms frontside extension
```

### Key Concept
- **Frontside** = First leg up after downtrend/consolidation
- **Backside** = Parabolic extension after already extended
- **FRD** = Frontside detection

### Key Parameters
```python
# EMA distance thresholds
high_to_ema9_div_atr >= 1.75   # Breaking out
high_to_ema30_div_atr >= 4.0    # Clear of long-term MA

# % change vs ATR
pct_change_7d_div_atr >= 2     # 7-day move >= 2x ATR
pct_change_14d_div_atr >= 3.5  # 14-day move >= 3.5x ATR

# Gap requirements
gap_div_atr >= 2  # Gap >= 2x ATR (very large gap)

# Close position
upper_70_range >= 65  # Strong close
```

### When to Use
- **Market Condition**: Reversal from downtrend
- **Stock Type**: Value names breaking out
- **Volatility**: Low to medium (then increases)
- **Timeframe**: Bottoming process

### What Makes It Unique
- **Reversal detection**: Finds first leg up, not continuation
- **Large gap requirement**: Gap must be >= 2x ATR
- **Multiple timeframes**: 7d, 14d momentum validation
- **EMA break**: Clear of long-term moving averages

---

## 6. 3-Day Trigger (LC 3 Day)

**File**: `LC 3 Day Trig/scan.py` (referenced)

### What It Is
Simple 3-day pattern setup with gap trigger.

### Core Logic
```
D-3: Setup begins
D-2: Continued setup
D-1: Preparation
D0: Gap triggers entry
```

### When to Use
- **Market Condition**: Any
- **Complexity**: Simple pattern for quick testing
- **Learning**: Good for understanding basics

---

## Code Structure Comparison

### Pattern A: Multi-Pattern Scanner (DMR-style)

```python
# Structure: Single pass, multiple pattern flags
for i, row in df.iterrows():
    df['d2_pm_setup'] = condition_set_1
    df['d2_pmh_break'] = condition_set_2
    df['d3'] = condition_set_3
    df['d4'] = condition_set_4

# Output: One row per ticker per day, multiple True/False flags
```

**Pros**: Efficient single pass
**Cons**: Complex logic, harder to debug

### Pattern B: Single Pattern Per File

```python
# Structure: One pattern, simple logic
for symbol in symbols:
    if condition_met:
        results.append({
            'ticker': symbol,
            'date': date,
            'setup_type': 'FBO'
        })

# Output: List of setups found
```

**Pros**: Simple, easy to debug
**Cons**: Inefficient for multiple patterns

### Pattern C: Class-Based (V31)

```python
class TradingScanner:
    def run_scan(self):
        stage1 = self.fetch_data()
        stage2a = self.compute_simple_features(stage1)
        stage2b = self.apply_filters(stage2a)
        stage3a = self.compute_full_features(stage2b)
        results = self.detect_patterns(stage3a)
        return results
```

**Pros**: Modular, testable, fast
**Cons**: More boilerplate

---

## Parameter System Patterns

### Pattern 1: Threshold-Based (Most Common)

```python
params = {
    'gap_min': 0.5,           # Gap >= 0.5%
    'volume_min': 10_000_000,  # Volume >= 10M
    'atr_mult': 2.0           # Distance >= 2x ATR
}

# Usage: if gap >= params['gap_min']
```

### Pattern 2: Range-Based

```python
params = {
    'level_pos_abs_min': 0.85,     # In top 15%
    'level_pos_abs_max': 0.95,     # But not top 5%
    'pivot_percentile_min': 0.85    # Top 15% of pivots
}

# Usage: if params['min'] <= value <= params['max']
```

### Pattern 3: Multi-Condition

```python
params = {
    'require_prev_green': True,
    'require_pm_h_high': True,
    'require_volume_confirm': False
}

# Usage: All required conditions must be True
```

---

## When to Use Which Pattern

| Market Condition | Use Pattern | Rationale |
|------------------|-------------|------------|
| Strong momentum, breaking out | DMR | Ride the trend |
| Resistance holds, choppy | FBO | Fade failed breakouts |
| Extended move continues | Extension Gap | Parabolic continuation |
| Acceleration phase | Daily Para | Catch the rocket |
| Bottoming, reversal | FRD EXT Gap | First leg up |
| Simple setup test | LC 3d | Quick validation |

---

## Key Takeaways for AI Agent Development

1. **NOT ONE PATTERN TYPE**: Backside B is just one of MANY
2. **DIFFERENT LOGIC**: Each pattern type has fundamentally different detection logic
3. **DIFFERENT PARAMETERS**: Each uses different metrics and thresholds
4. **DIFFERENT MARKET CONDITIONS**: Each targets different market behavior
5. **CODE STRUCTURE VARIETY**: Simple scripts, class-based, multi-pattern

### AI Agent Must Be Able To:

1. **Identify pattern type** from user description
2. **Choose appropriate code structure** for that pattern
3. **Generate correct parameters** for that pattern type
4. **Validate against A+ examples** of THAT pattern type
5. **Debug using pattern-specific logic**

---

**Document Status**: COMPLETE
**Version**: 1.0
**Last Updated**: 2026-01-29
