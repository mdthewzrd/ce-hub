# Chart API Date Filter Fix - Implementation Guide

## Issue Summary

Daily charts extend beyond the LC pattern date while intraday charts correctly end on it.

**Root Causes**:
1. Daily charts get a +5 day buffer in `get_trading_date_range()`
2. Daily charts skip the LC date filtering that intraday charts apply

**Impact**: Daily charts show trading activity AFTER the LC pattern date, defeating their purpose

---

## Fix #1: Remove +5 Day Buffer from Daily Charts (PRIMARY FIX)

### File: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
### Lines: 1811-1826

### Current Code (BROKEN)
```python
def get_trading_date_range(target_date_str: str, days_back: int, timeframe: str):
    """Calculate the proper date range for chart data ending on target date"""
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")

    if timeframe == 'day':
        # For daily charts, go back more days to account for weekends/holidays
        start_date = target_date - timedelta(days=days_back * 2)
        end_date = target_date + timedelta(days=5)  # ❌ PROBLEM: 5-day buffer overshoots
    else:
        # For intraday charts, ensure we end precisely on target date
        # Go back enough days to get the requested number of trading days
        start_date = target_date - timedelta(days=days_back + 10)  # Buffer for weekends/holidays
        end_date = target_date

    return start_date, end_date
```

### Fixed Code
```python
def get_trading_date_range(target_date_str: str, days_back: int, timeframe: str):
    """Calculate the proper date range for chart data ending on target date"""
    target_date = datetime.strptime(target_date_str, "%Y-%m-%d")

    if timeframe == 'day':
        # For daily charts, go back more days to account for weekends/holidays
        start_date = target_date - timedelta(days=days_back * 2)
        end_date = target_date  # ✓ FIXED: End on target date, no overshoot
    else:
        # For intraday charts, ensure we end precisely on target date
        # Go back enough days to get the requested number of trading days
        start_date = target_date - timedelta(days=days_back + 10)  # Buffer for weekends/holidays
        end_date = target_date

    return start_date, end_date
```

### Change Summary
- Line 1821: Remove `+ timedelta(days=5)` from `end_date`
- Changed from: `end_date = target_date + timedelta(days=5)`
- Changed to: `end_date = target_date`

---

## Fix #2: Apply LC Date Filtering to Daily Charts (DEFENSIVE FIX)

### File: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
### Lines: 1862-1880

### Current Code (BROKEN)
```python
        # For intraday data, filter to end precisely on target date
        if timeframe != 'day':  # ❌ PROBLEM: Skips filtering for daily charts
            target_timestamp = datetime.strptime(target_date, "%Y-%m-%d")
            target_end = target_timestamp.replace(hour=23, minute=59, second=59)

            filtered_bars = []
            for bar in bars:
                bar_time = datetime.fromtimestamp(bar['t'] / 1000)
                if bar_time.date() <= target_timestamp.date():
                    filtered_bars.append(bar)

            bars = filtered_bars[-1000:] if filtered_bars else []  # Keep last 1000 points max
            logger.info(f"🎯 Filtered to {len(bars)} bars ending on {target_date}")
```

### Fixed Code - Option A: Extend condition to all timeframes
```python
        # Filter all data (intraday AND daily) to end precisely on target date
        if timeframe in ['5min', 'hour', 'day']:  # ✓ FIXED: Include 'day'
            target_timestamp = datetime.strptime(target_date, "%Y-%m-%d")
            target_end = target_timestamp.replace(hour=23, minute=59, second=59)

            filtered_bars = []
            for bar in bars:
                bar_time = datetime.fromtimestamp(bar['t'] / 1000)
                if bar_time.date() <= target_timestamp.date():
                    filtered_bars.append(bar)

            bars = filtered_bars[-1000:] if filtered_bars else []  # Keep last 1000 points max
            logger.info(f"🎯 Filtered to {len(bars)} bars ending on {target_date}")
```

### Fixed Code - Option B: Always apply filter (simpler)
```python
        # Always filter data to end precisely on target date
        target_timestamp = datetime.strptime(target_date, "%Y-%m-%d")
        target_end = target_timestamp.replace(hour=23, minute=59, second=59)

        filtered_bars = []
        for bar in bars:
            bar_time = datetime.fromtimestamp(bar['t'] / 1000)
            if bar_time.date() <= target_timestamp.date():
                filtered_bars.append(bar)

        bars = filtered_bars[-1000:] if filtered_bars else []  # Keep last 1000 points max
        logger.info(f"🎯 Filtered to {len(bars)} bars ending on {target_date}")
```

### Change Summary

**Option A** (more explicit):
- Line 1862: Change condition from `if timeframe != 'day':` to `if timeframe in ['5min', 'hour', 'day']:`

**Option B** (simpler):
- Line 1862: Delete the `if timeframe != 'day':` condition entirely
- Unindent the filter code to always execute

**Recommendation**: Use Option B as it's simpler and avoids future issues with new timeframes.

---

## Implementation Steps

### Step 1: Backup the file
```bash
cp /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/main.py \
   /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/main.py.backup
```

### Step 2: Apply Fix #1 (Remove +5 day buffer)
Edit line 1821 in `main.py`:
- Find: `end_date = target_date + timedelta(days=5)`
- Replace: `end_date = target_date`

### Step 3: Apply Fix #2 (Apply filtering to daily charts)
Edit lines 1862-1880 in `main.py`:

Either option A (extend condition):
- Find: `if timeframe != 'day':`
- Replace: `if timeframe in ['5min', 'hour', 'day']:`

Or option B (remove condition):
- Delete line 1862: `if timeframe != 'day':`
- Unindent all code inside the block by 4 spaces

### Step 4: Test the fixes
```bash
# Test daily chart
curl -s "http://localhost:8000/api/chart/AAPL?timeframe=day&lc_date=2025-02-18&day_offset=0" | jq '.chartData.x[-1]'

# Test 5min chart (should still work)
curl -s "http://localhost:8000/api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0" | jq '.chartData.x[-1]'

# Test hour chart (should still work)
curl -s "http://localhost:8000/api/chart/AAPL?timeframe=hour&lc_date=2025-02-18&day_offset=0" | jq '.chartData.x[-1]'
```

All three should end with data from 2025-02-18.

---

## Expected Behavior After Fix

### Daily Chart (Fixed)
```
Request:  GET /api/chart/AAPL?timeframe=day&lc_date=2025-02-18&day_offset=0
Response: chartData.x = [..., 2025-02-14, 2025-02-18]  ✓ Ends on LC date
```

### 5min Chart (Already working)
```
Request:  GET /api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0
Response: chartData.x = [..., 2025-02-18T16:00:00]  ✓ Ends on LC date
```

### Hour Chart (Already working)
```
Request:  GET /api/chart/AAPL?timeframe=hour&lc_date=2025-02-18&day_offset=0
Response: chartData.x = [..., 2025-02-18T16:00:00]  ✓ Ends on LC date
```

---

## Validation Checklist

After applying the fixes:

- [ ] Daily chart for 2025-02-18 ends on 2025-02-18
- [ ] Daily chart does NOT include 2025-02-19, 2025-02-20, 2025-02-21, or 2025-02-24
- [ ] 5min chart still works and ends on 2025-02-18
- [ ] Hour chart still works and ends on 2025-02-18
- [ ] Chart data contains the correct number of bars
- [ ] No API errors or exceptions
- [ ] Market calendar filtering still removes weekends/holidays correctly
- [ ] API response time is not negatively impacted

---

## Rollback Plan

If something breaks after applying the fixes:

```bash
# Restore from backup
cp /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/main.py.backup \
   /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend/main.py

# Restart the backend
# (Kill the FastAPI process and restart)
```

---

## Related Code Context

### Why intraday charts work correctly

They already have this filter (lines 1862-1880):
```python
if timeframe != 'day':
    # Filter to target date - THIS WORKS FOR 5min AND hour
```

### Why market_calendar filtering isn't enough

The `validate_chart_data_for_trading_days()` function (market_calendar.py line 137) filters out weekends/holidays but does NOT filter dates AFTER the target date:

```python
def validate_chart_data_for_trading_days(chart_data: dict) -> dict:
    """Filter chart data to only include trading days"""
    # Only checks if is_trading_day(), doesn't check LC date boundary
    for i, timestamp in enumerate(timestamps):
        if is_trading_day(date_part):  # ← Just checks weekend/holiday
            valid_indices.append(i)
```

This is by design - that function shouldn't know about LC dates. The LC date filtering should happen in `fetch_polygon_data()` instead.

