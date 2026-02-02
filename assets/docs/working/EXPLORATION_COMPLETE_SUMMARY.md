# Edge Dev System Exploration - Complete Summary

## Project: Edge Dev Comprehensive System Exploration
**Completed:** November 8, 2025  
**Scope:** Port 5657 Frontend + Port 8000 Backend Analysis  
**Thoroughness Level:** Very Thorough (COMPLETED)

---

## Exploration Objectives (All Achieved)

### 1. Find All Edge Dev Related Files and Directories ✅
**Result:** Located complete system structure
- Frontend: `/src/` directory (11 subdirectories)
- Backend: `/backend/` directory (271 subdirectories including venv)
- Configuration files: Next.js, Tailwind, TypeScript configs
- Test files: Multiple test suites for chart validation

### 2. Look for Chart Rendering/Formatting Code ✅
**Result:** Identified comprehensive chart system
- **Main component:** `/src/components/EdgeChart.tsx` (220 lines)
- **Global config:** `/src/config/globalChartConfig.ts` (395 lines)
- **Backend endpoint:** `/backend/main.py` (2050+ lines, includes `/api/chart/{ticker}`)
- **Supporting:** Market calendar, trace generation, layout configuration

### 3. Find SMCI and Scanner-Related Code ✅
**Result:** Located SMCI-specific test and implementation
- Test file: `/edge-dev/test_smci_chart_duplication.py`
- SMCI data file: `/backend/SMCI_data.json`
- Global template validation: `/edge-dev/test_global_chart_template_system.py`
- Scanner modules in `/backend/core/` directory

### 4. Identify Port 5657 Configuration ✅
**Result:** Found complete port configuration
- **Framework:** Next.js 16.0.0
- **Command:** `npm run dev` → `next dev -p 5657`
- **Package.json:** Line 6 shows port configuration
- **Server:** Node.js with hot reload enabled
- **Build:** Next.js with TypeScript support

### 5. Find Existing Chart Data and Test Files ✅
**Result:** Located comprehensive test suite
- **Chart tests:** 4+ test files for chart validation
- **SMCI data:** Pre-computed JSON with full OHLC data
- **Test infrastructure:** Playwright test framework configured
- **Validation scripts:** Multiple validation and health check files

---

## Key Discoveries

### System Architecture
```
Port 5657 (Frontend)          Port 8000 (Backend)
   ↓                              ↓
Next.js 16.0.0              FastAPI + Uvicorn
React 19.2.0                Python 3.13+
Plotly.js 3.1.2             pandas, numpy
Tailwind CSS 4.0            Polygon API integration
TypeScript 5.0              Market calendar filtering
```

### Chart System Hierarchy
1. **Global Configuration** (`globalChartConfig.ts`)
   - GLOBAL_CHART_TEMPLATES (4 timeframes)
   - GLOBAL_PLOTLY_CONFIG (standardized settings)
   - Template definitions for 5min, 15min, hour, day

2. **Chart Component** (`EdgeChart.tsx`)
   - Uses ONLY global templates (no per-ticker overrides)
   - Generates traces, layout, rangebreaks
   - Integrates day navigation for LC pattern analysis

3. **Backend API** (`/api/chart/{ticker}`)
   - Fetches from Polygon.io
   - Filters by market calendar
   - Returns OHLC + volume + market session shapes
   - Supports day_offset for multi-day analysis

4. **Market Calendar** (`market_calendar.py`)
   - Holiday filtering for 2024-2025
   - Presidents' Day fix: Feb 17, 2025
   - Trading day validation

### SMCI 2/18/25 Analysis

**Date Context:**
- Friday, Feb 14, 2025: Trading day
- Saturday-Sunday, Feb 15-16: Weekend (no trading)
- Monday, Feb 17, 2025: Presidents' Day (market closed)
- **Tuesday, Feb 18, 2025: LC Pattern Date (trading day)**

**Expected Chart Behavior:**
- 2 trading days of 5min bars (Feb 14 + Feb 18)
- ~192 bars per day (4am-8pm extended hours)
- Gap between Feb 14 and Feb 18 (shown via rangebreaks)
- No duplication (each bar appears once)

**Issue Description:**
"Days are stacking instead of displaying as a proper time series"

**Root Cause Assessment:**
- NOT data duplication (fixed by universal deduplication)
- NOT Plotly rendering duplication (resize handlers disabled)
- LIKELY: Multiple trading days with gaps not rendering properly
- SUSPECT: Rangebreaks or x-axis date handling

---

## Critical Code Locations

### Frontend (Absolute Paths)
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/EdgeChart.tsx
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/config/globalChartConfig.ts
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/ChartDayNavigation.tsx
/Users/michaeldurante/ai dev/ce-hub/edge-dev/package.json
/Users/michaeldurante/ai dev/ce-hub/edge-dev/next.config.ts
```

### Backend (Absolute Paths)
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/market_calendar.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/start.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/core/scanner.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/SMCI_data.json
```

### Tests (Absolute Paths)
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_smci_chart_duplication.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_global_chart_template_system.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_hourly_chart_fixes.py
/Users/michaeldurante/ai dev/ce-hub/edge-dev/validate_all_chart_fixes.py
```

---

## Technology Details

### Frontend Stack
- **Next.js:** 16.0.0 (React app framework)
- **React:** 19.2.0 (UI library)
- **Plotly.js:** 3.1.2 (chart rendering)
- **react-plotly.js:** 2.6.0 (React wrapper)
- **Tailwind CSS:** 4.0 (styling)
- **TypeScript:** 5.0 (type safety)
- **Zustand:** 5.0.8 (state management)
- **Axios:** 1.12.2 (HTTP client)
- **Lucide React:** 0.547.0 (icons)

### Backend Stack
- **FastAPI:** Modern Python web framework
- **Uvicorn:** ASGI server
- **pandas:** Data manipulation
- **numpy:** Numerical computing
- **slowapi:** Rate limiting
- **Polygon API:** Market data source
- **Python:** 3.13+ (from venv)

### Development Tools
- **Playwright:** 1.56.1 (browser testing)
- **ESLint:** 9+ (code linting)
- **Tailwind CSS:** 4.0 (styling framework)
- **Concurrently:** 9.1.0 (parallel execution)

---

## System Status Assessment

### What's Working Well ✅
1. **Global Template System** - Enforces uniform chart configuration
2. **Universal Deduplication** - Removes all ticker+date duplicates
3. **Market Calendar** - Properly filters weekends and holidays
4. **Extended Hours** - 4am-8pm coverage for intraday charts
5. **Port Configuration** - Both ports properly configured
6. **API Endpoints** - Chart endpoint fully implemented
7. **Error Handling** - Comprehensive error handling in place
8. **Test Infrastructure** - Multiple test files for validation

### Potential Issues ⚠️
1. **Day Stacking** - Multiple trading days not displaying as clean time series
2. **Rangebreaks** - Possible issue with how gaps (weekends/holidays) display
3. **X-Axis Handling** - Non-contiguous dates might not display correctly
4. **Data Bounds** - calculateGlobalDataBounds() logic might need review

---

## Investigation Roadmap

### Immediate Actions
1. Run `python test_smci_chart_duplication.py` to reproduce
2. Check API response with curl to verify data format
3. Inspect Plotly rendering in browser DevTools
4. Review `calculateGlobalDataBounds()` implementation
5. Verify rangebreaks configuration for weekends

### Code Review Priorities
1. **globalChartConfig.ts** - generateGlobalRangebreaks() function
2. **globalChartConfig.ts** - calculateGlobalDataBounds() function
3. **globalChartConfig.ts** - generateGlobalTraces() function
4. **main.py** - fetch_polygon_data() function (lines 1827-1887)
5. **main.py** - validate_chart_data_for_trading_days() call (line 2018)

### Testing Approach
```
1. API Testing
   - Verify JSON structure (curl)
   - Check timestamp formatting
   - Confirm no duplicates
   - Validate data ranges

2. Frontend Testing
   - Visual inspection at http://localhost:5657
   - Browser DevTools Network tab
   - Plotly console logs
   - React component state inspection

3. Comparative Testing
   - Test SMCI 2/18/25 (problem case)
   - Test other dates for SMCI
   - Test other tickers for 2/18/25
   - Compare 5min vs other timeframes
```

---

## Documentation Generated

### Files Created
1. **EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md** (5000+ words)
   - Comprehensive system architecture
   - Data flow diagrams
   - Chart system components
   - Technology stack details
   - Critical fixes documentation

2. **EDGE_DEV_QUICK_REFERENCE.md** (1500+ words)
   - Quick lookup guide
   - Port configuration
   - API endpoints
   - File locations
   - Common issues and solutions

3. **EXPLORATION_COMPLETE_SUMMARY.md** (this document)
   - Summary of all findings
   - Investigation roadmap
   - Status assessment
   - Code priorities

---

## Key Files Summary Table

| Category | File | Lines | Purpose |
|----------|------|-------|---------|
| **Frontend** | EdgeChart.tsx | 220 | Main chart component |
| **Frontend** | globalChartConfig.ts | 395 | Global templates |
| **Backend** | main.py | 2050+ | FastAPI + chart API |
| **Backend** | market_calendar.py | 200 | Holiday filtering |
| **Backend** | start.py | 88 | Server startup |
| **Config** | package.json | 94 | Dependencies |
| **Config** | next.config.ts | - | Next.js config |
| **Tests** | test_smci_chart_duplication.py | - | SMCI test |
| **Tests** | test_global_chart_template_system.py | - | System validation |
| **Tests** | validate_all_chart_fixes.py | - | Comprehensive tests |

---

## Starting Points for Development

### Quick Start
```bash
# Navigate to project
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev

# Start both servers
./dev-start.sh

# Or separately:
# Terminal 1
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2
npm run dev
```

### Testing
```bash
# SMCI specific test
python test_smci_chart_duplication.py

# Global system test
python test_global_chart_template_system.py

# Health check
npm run health
```

### Debugging
```bash
# Check API directly
curl "http://localhost:8000/api/chart/SMCI?timeframe=5min&lc_date=2025-02-18&day_offset=0"

# Check frontend
curl "http://localhost:5657"

# Check health
curl "http://localhost:8000/api/health"
```

---

## Conclusion

The Edge Dev system is a **well-architected Next.js + FastAPI application** with sophisticated chart rendering capabilities. The system includes comprehensive fixes for chart duplication and uniform configuration management.

The SMCI 2/18/25 issue appears to be related to **how multiple trading days with significant gaps (weekend + holiday) display in Plotly**, rather than fundamental data or rendering duplication issues.

**Recommended Focus:** Review the interaction between:
- Plotly's rangebreaks (hiding non-trading days)
- X-axis date type handling
- Data bounds calculation for non-contiguous date ranges
- Y-axis domain split between price and volume

All necessary investigation tools, test suites, and documentation have been located and catalogued for detailed analysis.

---

## Contact Points for Further Investigation

### Key Functions to Inspect
- `calculateGlobalDataBounds()` in globalChartConfig.ts
- `generateGlobalRangebreaks()` in globalChartConfig.ts  
- `validate_chart_data_for_trading_days()` in market_calendar.py
- `fetch_polygon_data()` in main.py (lines 1827-1887)
- `get_chart_data()` in main.py (lines 1950-2041)

### Test Commands
- `python test_smci_chart_duplication.py` - Reproduce issue
- `curl "http://localhost:8000/api/chart/SMCI?timeframe=5min&lc_date=2025-02-18&day_offset=0"` - Test API
- `npm run health` - System validation

### Browser Debugging
- Open http://localhost:5657 and navigate to SMCI chart
- Open DevTools → Network tab
- Check API response in Preview tab
- Inspect Plotly layout configuration

---

**Status:** Exploration Complete ✅  
**Documentation:** Comprehensive ✅  
**Ready for Implementation:** Yes ✅
