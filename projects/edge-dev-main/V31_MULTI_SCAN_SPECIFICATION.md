# 🔀 MULTI-SCAN V31 SPECIFICATION
## For Scanners with Multiple Pattern Types (SC DMR, etc.)

**Use alongside V31_QUICK_REFERENCE.md**

---

## 🎯 WHAT IS A MULTI-SCAN?

A multi-scan detects **multiple pattern types** in a single execution:
- **Single-scan**: Detects ONE pattern (e.g., Backside B)
- **Multi-scan**: Detects 10+ patterns (e.g., D2_PM_Setup, D2_PMH_Break, D3, D4)

**Example SC DMR Patterns:**
1. D2_PM_Setup (4 variants)
2. D2_PM_Setup_2
3. D2_PMH_Break
4. D2_PMH_Break_1
5. D2_No_PMH_Break
6. D2_Extreme_Gap
7. D2_Extreme_Intraday_Run
8. D3
9. D3_Alt
10. D4

---

## 📋 MULTI-SCAN VS SINGLE-SCAN

| Aspect | Single-Scan | Multi-Scan |
|--------|-------------|------------|
| **Patterns** | 1 pattern | 10+ patterns |
| **Output** | Signal dict list | Signal dict list + `Scanner_Label` |
| **Parameters** | One set of params | Multiple sets (mass + pattern-specific) |
| **Detection** | One set of conditions | Multiple mask conditions |
| **Class Name** | `BacksideBScanner` | `GroupedEndpointSCDMRScanner` |

---

## 🏗️ CLASS STRUCTURE

```python
class MultiPatternScanner:
    """
    Multi-pattern scanner using v31 architecture

    Detects 10+ pattern types:
    - D2_PM_Setup (4 variants)
    - D2_PM_Setup_2
    - D2_PMH_Break
    - D2_PMH_Break_1
    - D2_No_PMH_Break
    - D2_Extreme_Gap
    - D2_Extreme_Intraday_Run
    - D3
    - D3_Alt
    - D4
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # Same as single-scan
        self.d0_start_user = d0_start
        self.d0_end_user = d0_end
        lookback_buffer = 1000 + 50
        scan_start_dt = pd.to_datetime(d0_start) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')
        self.d0_end = self.d0_end

        # Multi-scan: MASS parameters (shared by all patterns)
        self.params = {
            "prev_close_min": 0.75,
            "prev_volume_min": 10_000_000,
            "valid_trig_high_enabled": True,

            # D2_PM_Setup parameters
            "d2_pm_setup_gain_min": 0.2,
            "d2_pm_setup_dol_pmh_gap_vs_range_min": 0.5,
            "d2_pm_setup_pct_pmh_gap_min": 0.5,
            "d2_pm_setup_strict_gain_min": 1.0,

            # D2_PMH_Break parameters
            "d2_pmh_break_gain_min": 1.0,
            "d2_pmh_break_gap_min": 0.2,
            "d2_pmh_break_dol_gap_vs_range_min": 0.3,
            "d2_pmh_break_opening_range_min": 0.5,

            # D2_Extreme parameters
            "d2_extreme_dol_gap_vs_range_min": 1.0,
            "d2_extreme_intraday_run_vs_range_min": 1.0,
            "d2_extreme_prev_close_range_min": 0.3,

            # D3/D4 parameters
            "d3_gain_min": 0.2,
            "d3_gap_min": 0.2,
            "d4_gain_min": 0.2,
        }

    # Same 5-stage pipeline as single-scan
    def run_scan(self): ...

    def fetch_grouped_data(self): ...
    def compute_simple_features(self, df): ...
    def apply_smart_filters(self, df): ...
    def compute_full_features(self, df): ...

    # ✅ KEY DIFFERENCE: detect_patterns() handles multiple pattern types
    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """Apply multi-pattern detection"""
```

---

## 🎯 PATTERN DETECTION STRUCTURE

### **Multi-Pattern Detection Template**

```python
def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
    """
    Stage 3: Apply multi-pattern detection

    Detects 10 different pattern types:
    1. D2_PM_Setup (4 variants)
    2. D2_PM_Setup_2
    3. D2_PMH_Break
    4. D2_PMH_Break_1
    5. D2_No_PMH_Break
    6. D2_Extreme_Gap
    7. D2_Extreme_Intraday_Run
    8. D3
    9. D3_Alt
    10. D4
    """
    # Filter to D0 range
    df['Date'] = pd.to_datetime(df['date'])
    df_d0 = df[
        (df['Date'] >= pd.to_datetime(self.d0_start)) &
        (df['Date'] <= pd.to_datetime(self.d0_end))
    ].copy()

    # Collect all signals from all patterns
    all_signals = []

    # ==================== PATTERN 1: D2_PM_Setup (variant 1) ====================
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 1.0) &  # 100% gain
        (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * self.params['d2_pm_setup_dol_pmh_gap_vs_range_min']) &
        (df_d0['pct_pmh_gap'] >= self.params['d2_pm_setup_pct_pmh_gap_min']) &
        (df_d0['prev_close_range'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= self.params['prev_close_min']) &
        (df_d0['prev_volume'] >= self.params['prev_volume_min']) &
        (df_d0['prev_high'] >= df_d0['prev_low'] * 1.5)
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup'
        all_signals.append(signals)

    # ==================== PATTERN 2: D2_PM_Setup (variant 2) ====================
    mask = (
        ((df_d0['prev_high'] / df_d0['prev_close_1'] - 1) >= 0.2) &  # 20% gain
        (df_d0['prev_gap_2'] >= 0.2) &
        (df_d0['prev_range'] > df_d0['prev_range_2']) &
        (df_d0['dol_pmh_gap'] >= df_d0['prev_range'] * 0.5) &
        (df_d0['pct_pmh_gap'] >= 0.5) &
        (df_d0['prev_close'] >= df_d0['prev_open']) &
        (df_d0['prev_close'] >= self.params['prev_close_min']) &
        (df_d0['prev_volume'] >= self.params['prev_volume_min']) &
        (df_d0['prev_volume_2'] >= self.params['prev_volume_min'])
    )
    signals = df_d0[mask].copy()
    if not signals.empty:
        signals['Scanner_Label'] = 'D2_PM_Setup'
        all_signals.append(signals)

    # ==================== PATTERN 3: D2_PM_Setup (variant 3) ====================
    # ... repeat for all 10 patterns ...

    # ==================== COMBINE ALL SIGNALS ====================
    if all_signals:
        return pd.concat(all_signals, ignore_index=True)
    else:
        return pd.DataFrame()
```

---

## 🔑 KEY REQUIREMENTS FOR MULTI-SCANS

### **1. Scanner_Label Column**

Every signal MUST have `Scanner_Label` to identify which pattern matched:

```python
signals = df_d0[mask].copy()
if not signals.empty:
    signals['Scanner_Label'] = 'D2_PM_Setup'  # ← CRITICAL
    all_signals.append(signals)
```

### **2. Pattern-Specific Parameters**

Each pattern type has its own parameter set:

```python
self.params = {
    # Mass parameters (shared)
    "prev_close_min": 0.75,
    "prev_volume_min": 10_000_000,

    # D2_PM_Setup specific
    "d2_pm_setup_gain_min": 0.2,
    "d2_pm_setup_dol_pmh_gap_vs_range_min": 0.5,

    # D2_PMH_Break specific
    "d2_pmh_break_gain_min": 1.0,
    "d2_pmh_break_gap_min": 0.2,

    # ... etc
}

# Use in detection:
mask = (
    (df_d0['gain'] >= self.params['d2_pm_setup_gain_min']) &
    (df_d0['gap'] >= self.params['d2_pmh_break_gap_min']) &
    ...
)
```

### **3. Feature Computation**

Multi-scans need MORE features than single-scans:

```python
def compute_full_features(self, df: pd.DataFrame):
    """Compute remaining features for multi-pattern detection"""

    # Previous highs (needed for valid_trig_high)
    df['prev_high'] = df.groupby('ticker')['high'].shift(1)
    df['prev_high_2'] = df.groupby('ticker')['high'].shift(2)
    # ... up to prev_high_10

    # Valid trigger high
    df['valid_trig_high'] = (
        (df['prev_high'] >= df['prev_high_2']) &
        (df['prev_high'] >= df['prev_high_3']) &
        # ... compare to all 9 previous highs
    )

    # Pre-market high estimate
    df['pm_high'] = df[['open', 'high']].max(axis=1)

    # Ranges
    df['range'] = df['high'] - df['low']
    df['prev_range'] = df.groupby('ticker')['range'].shift(1)
    df['prev_range_2'] = df.groupby('ticker')['range'].shift(2)

    # Gaps
    df['dol_gap'] = df['open'] - df['prev_close']
    df['dol_pmh_gap'] = df['pm_high'] - df['prev_close']
    df['pct_pmh_gap'] = (df['pm_high'] / df['prev_close']) - 1
    df['gap'] = (df['open'] / df['prev_close']) - 1
    df['prev_gap'] = df.groupby('ticker')['gap'].shift(1)
    df['prev_gap_2'] = df.groupby('ticker')['gap'].shift(2)

    # Opening range and close range
    df['opening_range'] = (df['open'] - df['prev_close']) / (df['pm_high'] - df['prev_close'])
    df['close_range'] = (df['close'] - df['open']) / (df['high'] - df['open'])

    # Previous values (multiple shifts)
    df['prev_close_1'] = df.groupby('ticker')['prev_close'].shift(1)
    df['prev_close_2'] = df.groupby('ticker')['prev_close'].shift(2)
    df['prev_close_3'] = df.groupby('ticker')['prev_close'].shift(3)

    # Previous volumes
    df['prev_volume_2'] = df.groupby('ticker')['volume'].shift(2)
    df['prev_volume_3'] = df.groupby('ticker')['volume'].shift(3)

    return df
```

### **4. Common Features Across Patterns**

Many patterns share the same base conditions:

```python
# Common mass filters (applied to ALL patterns)
mass_filter = (
    (df_d0['prev_close'] >= self.params['prev_close_min']) &
    (df_d0['prev_volume'] >= self.params['prev_volume_min']) &
    (df_d0['valid_trig_high'] == True)  # If enabled
)

# Apply mass filter + pattern-specific conditions
mask = mass_filter & (
    (df_d0['gain'] >= self.params['d2_pm_setup_gain_min']) &
    (df_d0['gap'] >= 0.5)
)
```

---

## 📊 MULTI-SCAN PARAMETER STRUCTURE

### **Parameter Categories**

```python
self.params = {
    # === MASS PARAMETERS (shared across all patterns) ===
    "prev_close_min": 0.75,
    "prev_volume_min": 10_000_000,
    "valid_trig_high_enabled": True,

    # === D2_PM_SETUP PARAMETERS ===
    "d2_pm_setup_gain_min": 0.2,
    "d2_pm_setup_dol_pmh_gap_vs_range_min": 0.5,
    "d2_pm_setup_pct_pmh_gap_min": 0.5,
    "d2_pm_setup_prev_close_range_min": 0.5,
    "d2_pm_setup_strict_gain_min": 1.0,

    # === D2_PMH_BREAK PARAMETERS ===
    "d2_pmh_break_gain_min": 1.0,
    "d2_pmh_break_gap_min": 0.2,
    "d2_pmh_break_dol_gap_vs_range_min": 0.3,
    "d2_pmh_break_opening_range_min": 0.5,

    # === D2_EXTREME PARAMETERS ===
    "d2_extreme_dol_gap_vs_range_min": 1.0,
    "d2_extreme_intraday_run_vs_range_min": 1.0,
    "d2_extreme_prev_close_range_min": 0.3,

    # === D3/D4 PARAMETERS ===
    "d3_gain_min": 0.2,
    "d3_gap_min": 0.2,
    "d4_gain_min": 0.2,
}
```

---

## 🎨 OUTPUT FORMAT

### **Multi-Scan Output Columns**

Each signal should have:

```python
{
    "ticker": "AAPL",
    "date": "2024-01-15",
    "Scanner_Label": "D2_PM_Setup",  # ← Pattern identifier
    # ... pattern-specific metrics ...
    "gain": 0.85,
    "gap": 0.12,
    "prev_high": 95.50,
    # ... etc
}
```

---

## ✅ MULTI-SCAN VALIDATION CHECKLIST

In addition to V31_QUICK_REFERENCE.md checklist, verify:

- [ ] `detect_patterns()` handles multiple pattern types
- [ ] Each pattern adds `Scanner_Label` column
- [ ] Parameters organized into mass + pattern-specific
- [ ] All features computed BEFORE pattern detection
- [ ] Pattern-specific conditions use `self.params['pattern_name_param']`
- [ ] Multiple pattern variants can have same `Scanner_Label`
- [ ] Returns concatenated DataFrame with all signals

---

## 🔄 TRANSFORMATION FROM STANDALONE TO V31 MULTI-SCAN

### **Original Multi-Scan Structure**

```python
# Multiple scan functions
def scan_d2_pm_setup(df): ...
def scan_d2_pmh_break(df): ...
def scan_d3(df): ...
# ... 10 different functions

# Main execution
results = []
results.append(scan_d2_pm_setup(df))
results.append(scan_d2_pmh_break(df))
results.append(scan_d3(df))
# ... call all 10

all_signals = pd.concat(results)
```

### **V31 Multi-Scan Structure**

```python
class GroupedEndpointSCDMRScanner:
    def detect_patterns(self, df):
        """All 10 patterns in one method"""

        all_signals = []

        # Pattern 1
        mask = (condition_1a) & (condition_1b) & ...
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'D2_PM_Setup'
            all_signals.append(signals)

        # Pattern 2
        mask = (condition_2a) & (condition_2b) & ...
        signals = df_d0[mask].copy()
        if not signals.empty:
            signals['Scanner_Label'] = 'D2_PM_Setup'
            all_signals.append(signals)

        # ... repeat for all 10 patterns

        return pd.concat(all_signals, ignore_index=True)
```

---

**Made from V31_GOLD_STANDARD_SPECIFICATION.md**
