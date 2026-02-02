# Chart Data Backend API - Root Cause Analysis

## Summary
The issue is in the `get_trading_date_range()` function at line 1811 in `/backend/main.py`. Daily charts are given a +5 day buffer that extends beyond the LC pattern date, while intraday charts correctly end on the LC date.

## File Locations

### Primary Files
1. **Main API Server**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
   - Chart endpoint: Line 1950 (`@app.get("/api/chart/{ticker}")`)
   - Date range calculation: Line 1811 (`get_trading_date_range()`)
   - Polygon data fetching: Line 1827 (`fetch_polygon_data()`)

2. **Market Calendar Module**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/market_calendar.py`
   - Trading day validation: Line 137 (`validate_chart_data_for_trading_days()`)
   - Holiday detection: Line 40 (`is_market_holiday()`)

---

## Root Cause: The Divergence Point

### The Problem Code (main.py, lines 1811-1826)

```python
def get_trading_date_range(target_date_str: str, days_back: int, timeframe: str):
    """Calculate the proper date range for chart data ending on target date"""
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")

    if timeframe == 'day':
        # For daily charts, go back more days to account for weekends/holidays
        start_date = target_date - timedelta(days=days_back * 2)
        end_date = target_date + timedelta(days=5)  # ❌ BUFFER FOR WEEKENDS
    else:
        # For intraday charts, ensure we end precisely on target date
        # Go back enough days to get the requested number of trading days
        start_date = target_date - timedelta(days=days_back + 10)
        end_date = target_date  # ✅ ENDS ON TARGET DATE

    return start_date, end_date
```

### Why This Causes the Issue

**For Daily Charts (timeframe='day'):**
- LC Date: 2025-02-18
- `end_date = 2025-02-18 + 5 days = 2025-02-23`
- Polygon fetches: 2025-02-23 as the end date
- This goes beyond the LC pattern date!
- Results: Daily bars for 2025-02-19, 2025-02-20, 2025-02-21, 2025-02-24 (etc.)

**For Intraday Charts (timeframe='5min' or 'hour'):**
- LC Date: 2025-02-18
- `end_date = 2025-02-18` (no buffer added)
- Polygon fetches: Up to 2025-02-18
- Results: Data correctly ends on LC date (2025-02-18)

---

## Data Flow Analysis

### Chart API Request
```
GET /api/chart/AAPL?timeframe=day&lc_date=2025-02-18&day_offset=0
```

### Processing Flow (main.py lines 1950-2030)

1. **Line 1967-1969**: Parse LC date
   ```python
   lc_datetime = datetime.strptime(lc_date, "%Y-%m-%d")
   target_date = lc_datetime + timedelta(days=day_offset)
   target_date_str = target_date.strftime("%Y-%m-%d")
   ```

2. **Lines 1979-1984**: Determine days_back based on timeframe
   ```python
   if timeframe == '5min':
       days_back = 2
   elif timeframe == 'hour':
       days_back = 15
   elif timeframe == 'day':
       days_back = 45  # ← Gets passed to get_trading_date_range()
   ```

3. **Line 1989**: Fetch from Polygon
   ```python
   bars = await fetch_polygon_data(ticker, timeframe, days_back, target_date_str)
   ```

### Inside fetch_polygon_data() (main.py lines 1827-1887)

4. **Line 1829**: Calculate date range with the problematic function
   ```python
   start_date, end_date = get_trading_date_range(target_date, days_back, timeframe)
   ```

5. **Lines 1850-1851**: Build Polygon API URL
   ```python
   url = f"{POLYGON_BASE_URL}/v2/aggs/ticker/{ticker}/range/{multiplier}/{timespan}/{start_str}/{end_str}"
   ```

6. **Lines 1862-1880**: Filter intraday data to end on target date
   ```python
   if timeframe != 'day':
       target_timestamp = datetime.strptime(target_date, "%Y-%m-%d")
       target_end = target_timestamp.replace(hour=23, minute=59, second=59)
       
       filtered_bars = []
       for bar in bars:
           bar_time = datetime.fromtimestamp(bar['t'] / 1000)
           if bar_time.date() <= target_timestamp.date():  # ✅ FILTERS TO TARGET DATE
               filtered_bars.append(bar)
   ```
   
   **Note**: This filtering `if timeframe != 'day':` means daily charts do NOT get this filtering!

### Back in get_chart_data() (main.py lines 2010-2020)

7. **Lines 2015-2017**: Convert to chart format (includes dates beyond LC)
   ```python
   chart_data = {
       'x': [datetime.fromtimestamp(bar['t'] / 1000).isoformat() for bar in bars],
       'open': [bar['o'] for bar in bars],
       # ... etc
   }
   ```

8. **Lines 2020-2023**: Apply market calendar filtering
   ```python
   original_count = len(chart_data['x'])
   chart_data = validate_chart_data_for_trading_days(chart_data)
   filtered_count = len(chart_data['x'])
   ```
   
   **Important**: This only filters OUT weekends/holidays. It does NOT filter dates after the LC date!
   - 2025-02-19 = Wednesday (trading day) ✓ Keeps it
   - 2025-02-20 = Thursday (trading day) ✓ Keeps it
   - 2025-02-21 = Friday (trading day) ✓ Keeps it
   - 2025-02-24 = Monday (trading day) ✓ Keeps it

---

## The Complete Issue Chain

### Current Behavior (Broken for Daily)

```
Input: lc_date=2025-02-18, timeframe='day'
  ↓
days_back = 45
  ↓
get_trading_date_range() creates:
  start_date = 2025-01-04 (45 * 2 = 90 days back)
  end_date = 2025-02-23 (2025-02-18 + 5 days) ❌ OVERSHOOTS
  ↓
Polygon API fetches data for 2025-01-04 to 2025-02-23
  ↓
fetch_polygon_data() - NO FILTERING for daily charts! ❌
  (The `if timeframe != 'day':` excludes daily charts)
  ↓
Returns all bars including 2025-02-19, 2025-02-20, 2025-02-21, 2025-02-24
  ↓
validate_chart_data_for_trading_days() filters out weekends/holidays only
  (Doesn't know about LC date limitation)
  ↓
Returns bars extending to 2025-02-24 or beyond ❌
```

### Correct Behavior (Working for Intraday)

```
Input: lc_date=2025-02-18, timeframe='5min'
  ↓
days_back = 2
  ↓
get_trading_date_range() creates:
  start_date = 2025-02-06
  end_date = 2025-02-18 ✓ (NO BUFFER ADDED)
  ↓
Polygon API fetches data for 2025-02-06 to 2025-02-18
  ↓
fetch_polygon_data() FILTERS for intraday:
  if timeframe != 'day':  ✓ YES, filters!
    Filter bars to date <= 2025-02-18 only
  ↓
Returns bars ending on 2025-02-18 ✓
  ↓
validate_chart_data_for_trading_days() - just a safety check
  ↓
Returns bars ending on 2025-02-18 ✓
```

---

## Required Fixes

### Fix #1: Remove the +5 day buffer for daily charts (Primary Fix)

**Location**: `main.py`, line 1821

```python
# Current (BROKEN):
if timeframe == 'day':
    start_date = target_date - timedelta(days=days_back * 2)
    end_date = target_date + timedelta(days=5)  # ❌ Removes this buffer

# Fixed:
if timeframe == 'day':
    start_date = target_date - timedelta(days=days_back * 2)
    end_date = target_date  # ✓ End on target date, same as intraday
```

### Fix #2: Apply LC date filtering to daily charts (Defensive Fix)

**Location**: `main.py`, lines 1862-1880

```python
# Current (BROKEN):
if timeframe != 'day':
    # Only filters intraday data
    filtered_bars = []
    for bar in bars:
        bar_time = datetime.fromtimestamp(bar['t'] / 1000)
        if bar_time.date() <= target_timestamp.date():
            filtered_bars.append(bar)

# Fixed - Apply to ALL timeframes:
if timeframe in ['5min', 'hour', 'day']:  # Changed from 'if timeframe != 'day':'
    # Filters ALL timeframe data
    filtered_bars = []
    for bar in bars:
        bar_time = datetime.fromtimestamp(bar['t'] / 1000)
        if bar_time.date() <= target_timestamp.date():
            filtered_bars.append(bar)
```

Or simpler approach:

```python
# Always filter to target date, regardless of timeframe
filtered_bars = []
for bar in bars:
    bar_time = datetime.fromtimestamp(bar['t'] / 1000)
    if bar_time.date() <= target_timestamp.date():
        filtered_bars.append(bar)
bars = filtered_bars[-1000:] if filtered_bars else []
```

---

## Related Code References

### validate_chart_data_for_trading_days() (market_calendar.py, lines 137-168)

This function filters out weekends/holidays but does NOT filter dates after the LC pattern date:

```python
def validate_chart_data_for_trading_days(chart_data: dict) -> dict:
    """Filter chart data to only include trading days"""
    if not chart_data or 'x' not in chart_data:
        return chart_data

    timestamps = chart_data['x']
    if not timestamps:
        return chart_data

    # Find indices of trading days
    valid_indices = []
    for i, timestamp in enumerate(timestamps):
        try:
            if isinstance(timestamp, str) and 'T' in timestamp:
                date_part = timestamp.split('T')[0]
            else:
                date_part = str(timestamp)[:10]

            if is_trading_day(date_part):  # Only checks if weekend/holiday
                valid_indices.append(i)
        except:
            continue

    # Filter all arrays using valid indices
    filtered_data = {}
    for key, values in chart_data.items():
        if isinstance(values, list) and len(values) == len(timestamps):
            filtered_data[key] = [values[i] for i in valid_indices]
        else:
            filtered_data[key] = values

    return filtered_data
```

This is working as designed - it's not responsible for LC date filtering.

---

## Summary of Changes Needed

| Issue | Location | Current | Fixed | Impact |
|-------|----------|---------|-------|--------|
| Daily charts extend beyond LC date | `get_trading_date_range()` line 1821 | `end_date = target_date + timedelta(days=5)` | `end_date = target_date` | HIGH |
| Daily charts don't filter to LC date | `fetch_polygon_data()` line 1862 | `if timeframe != 'day':` | Apply filter to ALL timeframes | HIGH |
| No LC date validation in market calendar | `validate_chart_data_for_trading_days()` | No LC date parameter | Add optional target_date parameter | MEDIUM |

---

## Testing the Fix

### Test Case 1: Daily Chart for LC Date 2025-02-18

```bash
curl "http://localhost:8000/api/chart/AAPL?timeframe=day&lc_date=2025-02-18&day_offset=0"
```

Expected after fix:
- Last data point should be: 2025-02-18 (not 2025-02-21 or 2025-02-24)
- Should NOT include bars for 2025-02-19, 2025-02-20, 2025-02-21, 2025-02-24

### Test Case 2: 5min Chart for LC Date 2025-02-18

```bash
curl "http://localhost:8000/api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0"
```

Expected (currently working):
- Last data point should be: 2025-02-18
- Should NOT include bars from 2025-02-19 or later

### Test Case 3: Hour Chart for LC Date 2025-02-18

```bash
curl "http://localhost:8000/api/chart/AAPL?timeframe=hour&lc_date=2025-02-18&day_offset=0"
```

Expected (currently working):
- Last data point should be: 2025-02-18
- Should NOT include bars from 2025-02-19 or later
