# Chart API - Quick Reference Guide

## API Endpoint

```
GET /api/chart/{ticker}
```

### Query Parameters

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `ticker` | string | Yes | Stock ticker (e.g., "AAPL") |
| `timeframe` | string | No | Chart period: "5min", "hour", "day" (default: "5min") |
| `lc_date` | string | Yes | LC pattern date in format YYYY-MM-DD |
| `day_offset` | integer | No | Days to offset from LC date (default: 0) |

### Example Requests

```bash
# Daily chart ending on LC date 2025-02-18
curl "http://localhost:8000/api/chart/AAPL?timeframe=day&lc_date=2025-02-18&day_offset=0"

# 5min chart ending on LC date 2025-02-18
curl "http://localhost:8000/api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0"

# Hour chart ending on LC date with +1 day offset
curl "http://localhost:8000/api/chart/SPY?timeframe=hour&lc_date=2025-02-18&day_offset=1"
```

## Response Format

```json
{
  "chartData": {
    "x": ["2025-02-06T00:00:00", "2025-02-07T00:00:00", ...],
    "open": [150.25, 151.10, ...],
    "high": [151.75, 152.50, ...],
    "low": [150.00, 150.75, ...],
    "close": [151.00, 152.25, ...],
    "volume": [5000000, 4500000, ...]
  },
  "shapes": [...],  // Market session shapes for intraday
  "success": true,
  "message": "Chart data loaded successfully for AAPL"
}
```

---

## Data Flow Diagram

```
Request
  ↓
/api/chart/{ticker} endpoint (line 1950)
  ↓
Parse LC date & day_offset (lines 1967-1969)
  ↓
Determine days_back by timeframe (lines 1979-1984)
  ├─ 5min: 2 days
  ├─ hour: 15 days
  └─ day: 45 days
  ↓
Fetch from Polygon API (line 1989)
  ↓
fetch_polygon_data() (line 1827)
  ├─ Calculate date range (line 1829)
  │   ├─ get_trading_date_range() (line 1811)
  │   │   ├─ Daily: end_date = target + 5 days ❌ PROBLEM HERE
  │   │   └─ Intraday: end_date = target
  │   ↓
  │   Build Polygon URL
  │   ↓
  │   Fetch data from Polygon
  │   ↓
  └─ Filter to target date (lines 1862-1880)
      ├─ Intraday: ✓ FILTERS
      └─ Daily: ✗ SKIPS FILTERING
  ↓
Convert to chart format (lines 2015-2017)
  ↓
Market calendar filtering (lines 2020-2023)
  ├─ Removes weekends
  └─ Removes holidays
  ├─ Does NOT remove dates after LC date ❌
  ↓
Generate market session shapes (line 2027)
  ↓
Return ChartResponse (line 2029)
```

---

## Known Issues

### Issue 1: Daily Charts Extend Beyond LC Date

**Affected timeframe**: `day`

**Root cause**: Line 1821 in `main.py`
```python
end_date = target_date + timedelta(days=5)  # ❌ ADDS 5 DAY BUFFER
```

**Symptom**: Daily chart for LC date 2025-02-18 includes bars through 2025-02-24

**Example**:
- Input: `lc_date=2025-02-18`, `timeframe=day`
- Expected last bar: 2025-02-18
- Actual last bar: 2025-02-21 or 2025-02-24

### Issue 2: Daily Charts Not Filtered for LC Date

**Affected timeframe**: `day`

**Root cause**: Line 1862 in `main.py`
```python
if timeframe != 'day':  # ❌ SKIPS DAILY CHARTS
    # Filter to target date
```

**Symptom**: Daily charts bypass the LC date filtering that intraday charts use

---

## File Structure

### Key Files

```
edge-dev/backend/
├── main.py                          # FastAPI server (PRIMARY FILE)
│   ├── get_chart_data()             # Main chart endpoint (line 1950)
│   ├── fetch_polygon_data()         # Polygon API fetching (line 1827)
│   └── get_trading_date_range()     # Date range calculation (line 1811)
│
└── market_calendar.py               # Trading day validation
    ├── validate_chart_data_for_trading_days()  # Holiday/weekend filtering
    ├── is_trading_day()
    └── is_market_holiday()
```

### Imports in main.py (Lines 1-30)

```python
from datetime import datetime, date, timedelta  # Line 8
from fastapi import FastAPI, HTTPException     # Line 14
import httpx                                    # Line 39
from market_calendar import validate_chart_data_for_trading_days  # Line 1799
```

---

## Testing Commands

### Test 1: Daily Chart (Broken)
```bash
curl -s "http://localhost:8000/api/chart/AAPL?timeframe=day&lc_date=2025-02-18&day_offset=0" | jq '.chartData.x[-5:]'
```
Expected: Last 5 dates should end with 2025-02-18
Actual (broken): Includes 2025-02-19, 2025-02-20, 2025-02-21, 2025-02-24

### Test 2: 5min Chart (Working)
```bash
curl -s "http://localhost:8000/api/chart/AAPL?timeframe=5min&lc_date=2025-02-18&day_offset=0" | jq '.chartData.x[-1]'
```
Expected: Last date is 2025-02-18 (with intraday timestamp)

### Test 3: Hour Chart (Working)
```bash
curl -s "http://localhost:8000/api/chart/AAPL?timeframe=hour&lc_date=2025-02-18&day_offset=0" | jq '.chartData.x[-1]'
```
Expected: Last date is 2025-02-18 (with hour timestamp)

---

## Code Locations (Exact Line Numbers)

| Function | File | Line | Purpose |
|----------|------|------|---------|
| `get_chart_data()` | main.py | 1950 | Main API endpoint |
| `fetch_polygon_data()` | main.py | 1827 | Polygon API wrapper |
| `get_trading_date_range()` | main.py | 1811 | **ROOT CAUSE LOCATION** |
| `validate_chart_data_for_trading_days()` | market_calendar.py | 137 | Holiday/weekend filter |
| `is_trading_day()` | market_calendar.py | 65 | Trading day check |
| `is_market_holiday()` | market_calendar.py | 40 | Holiday check |

---

## Problem Summary

The backend chart API has inconsistent date handling:

- **Intraday (5min, hour)**: Correctly filters data to end on the LC pattern date ✓
- **Daily**: Adds a +5 day buffer and skips filtering, causing data to extend beyond the LC pattern date ✗

This causes daily charts to show trading activity after the LC pattern has occurred, contradicting the chart's purpose of showing activity up to and including the LC pattern date.

