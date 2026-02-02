# Edge Dev Quick Reference Guide

## System Overview
- **Frontend:** Next.js 16.0.0 on port 5657
- **Backend:** FastAPI/Uvicorn on port 8000
- **Chart Library:** Plotly.js 3.1.2
- **Issue:** SMCI 2/18/25 5min chart days stacking instead of time series

## Port Configuration
| Service | Port | Protocol | Language |
|---------|------|----------|----------|
| Frontend | 5657 | HTTP | Node.js/TypeScript |
| Backend | 8000 | HTTP | Python |

## Key Files

### Critical Chart Files
```
/src/config/globalChartConfig.ts         (395 lines) - Global template system
/src/components/EdgeChart.tsx            (220 lines) - Main chart component
/backend/main.py                         (2050+ lines) - FastAPI app + chart endpoint
/backend/market_calendar.py              (200 lines) - Holiday filtering
```

### Test Files
```
test_smci_chart_duplication.py           - SMCI specific test
test_global_chart_template_system.py     - Global system validation
validate_all_chart_fixes.py              - Comprehensive validation
```

## Chart Endpoint
```
GET /api/chart/{ticker}
  ?timeframe=5min|15min|hour|day
  &lc_date=YYYY-MM-DD
  &day_offset=0
```

**Example:**
```bash
curl "http://localhost:8000/api/chart/SMCI?timeframe=5min&lc_date=2025-02-18&day_offset=0"
```

## Timeframe Configuration
| Timeframe | Duration | Bars/Day | Base Data | Hours |
|-----------|----------|----------|-----------|-------|
| 5min | 2 days | 192 | 1min | 4am-8pm |
| 15min | 5 days | 64 | 1min | 4am-8pm |
| hour | 15 days | 16 | 1min | 4am-8pm |
| day | 60 days | 1 | daily | N/A |

## SMCI 2/18/25 Analysis
**Date Context:**
- Feb 14, 2025 (Friday): Trading day
- Feb 15-16 (Sat-Sun): Weekend
- Feb 17 (Monday): Presidents' Day - **Market closed**
- Feb 18 (Tuesday): Trading day - **LC pattern date**

**Expected Chart Data:**
- 2 trading days of 5min bars
- Gap between Feb 14 and Feb 18 (weekend + holiday)
- ~192 bars per day = ~384 total bars
- NO duplication (each bar once)

## Critical Fixes Implemented
1. ✅ Global Chart Template System (prevents customization conflicts)
2. ✅ Universal Deduplication (ticker + date combination)
3. ✅ Market Calendar Integration (filters weekends/holidays)
4. ✅ Plotly Configuration Standardization (disabled resize handlers)
5. ✅ Extended Hours Support (4am-8pm for 5min charts)

## Running Tests
```bash
# SMCI specific test
python test_smci_chart_duplication.py

# Global template validation
python test_global_chart_template_system.py

# Frontend tests
npm run test:charts

# Health check
npm run health
```

## Starting Development
```bash
# Full stack startup
./dev-start.sh

# Or manually:
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2 - Frontend
npm run dev
```

## Data Flow
```
1. Frontend request → /api/chart/SMCI?timeframe=5min&lc_date=2025-02-18
2. Backend fetches from Polygon API
3. Filters to trading days (removes weekends/holidays)
4. Returns JSON with OHLC + volume + market session shapes
5. Frontend EdgeChart component uses GLOBAL_CHART_TEMPLATES['5min']
6. Generates unified layout + traces
7. Plotly renders with standardized config (no resize handling)
```

## Investigation Checklist
- [ ] Verify API response has correct timestamp format
- [ ] Check that data is sorted chronologically
- [ ] Confirm no duplicate entries in response
- [ ] Inspect Plotly layout.rangebreaks configuration
- [ ] Verify x-axis type is 'date'
- [ ] Check if multiple dates are being grouped incorrectly
- [ ] Test with curl to isolate frontend vs backend
- [ ] Review calculateGlobalDataBounds() logic
- [ ] Check generateGlobalRangebreaks() for weekends
- [ ] Verify yaxis domain split (0.3-1.0 for price, 0-0.25 for volume)

## Common Issues

### "Days are stacking"
- **Likely cause:** Multiple trading days with gaps not rendering as proper time series
- **Investigation:** Check how rangebreaks and non-contiguous dates interact
- **Files to check:** globalChartConfig.ts (generateGlobalRangebreaks)

### Duplicate candlesticks
- **Status:** FIXED by universal deduplication
- **Check:** Line 42-107 in main.py

### Chart not loading
- **Check:** Backend API responding (http://localhost:8000/api/health)
- **Check:** Frontend can reach backend (CORS settings)
- **Check:** Data from Polygon API available

## Technology Stack
**Frontend:**
- Next.js 16.0.0, React 19.2.0
- Plotly.js 3.1.2, Tailwind CSS 4.0
- TypeScript 5.0, Zustand 5.0.8

**Backend:**
- FastAPI, Uvicorn
- pandas, numpy
- slowapi (rate limiting)
- Polygon API (data source)

## File Locations (Absolute Paths)
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/EdgeChart.tsx
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/config/globalChartConfig.ts
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/market_calendar.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_smci_chart_duplication.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_global_chart_template_system.py
```

## Related Documentation
- `/edge-dev/API_INTEGRATION_GUIDE.md`
- `/edge-dev/README.md`
- `/edge-dev/backend/market_calendar.py` (inline comments)

## Key Code Patterns

### Global Template Usage
```typescript
const template = GLOBAL_CHART_TEMPLATES[timeframe];
const rangebreaks = generateGlobalRangebreaks(timeframe);
const bounds = calculateGlobalDataBounds(data, timeframe, dayNavigation);
const traces = generateGlobalTraces(symbol, data);
const layout = generateGlobalLayout(symbol, timeframe, bounds.xRange, bounds.yRange, bounds.volumeRange, rangebreaks, shapes);
```

### Market Calendar Check
```python
from market_calendar import is_trading_day, validate_chart_data_for_trading_days

# Filter chart data to trading days only
chart_data = validate_chart_data_for_trading_days(chart_data)
```

### API Request
```python
bars = await fetch_polygon_data(ticker, timeframe, days_back, target_date_str)
```

## Debugging Tips
1. Add `?debug=true` to requests (if implemented)
2. Check browser DevTools → Network → Preview tab for API response
3. Check Plotly console output for warnings
4. Review server logs: `/backend/scanner_backend.log`
5. Run `npm run health` to validate system status

## Next Steps
1. Run `test_smci_chart_duplication.py` to reproduce issue
2. Check API response structure with curl
3. Inspect Plotly rendering in browser
4. Review `calculateGlobalDataBounds()` implementation
5. Verify rangebreaks are properly hiding non-trading days
