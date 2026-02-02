# Edge Dev System Exploration - Complete Index

## Report Files Generated
This exploration has produced three comprehensive documents:

### 1. EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md
**Comprehensive Technical Deep Dive**
- 5000+ words of detailed analysis
- Complete system architecture documentation
- File structure breakdown (frontend, backend, configuration)
- Chart system component analysis
- Data flow diagrams for SMCI 2/18/25 scenario
- Technology stack details
- Critical fixes documentation
- Next steps for investigation

**Best for:** Understanding the complete system, detailed technical reference

---

### 2. EDGE_DEV_QUICK_REFERENCE.md  
**Quick Lookup Guide**
- 1500+ words of practical reference
- Port configuration (5657, 8000)
- Key files summary
- Chart endpoint documentation
- Timeframe configuration reference
- SMCI 2/18/25 context and analysis
- Test file locations and commands
- Common issues and troubleshooting
- Debugging tips and code patterns

**Best for:** Quick lookup, running tests, troubleshooting

---

### 3. EXPLORATION_COMPLETE_SUMMARY.md
**Executive Summary**
- Project completion status
- Investigation objectives (all achieved)
- Key discoveries summary
- Technology stack overview
- System status assessment
- Investigation roadmap
- Starting points for development
- Contact points for further investigation

**Best for:** Overview, quick understanding, next steps planning

---

## Exploration Scope

### Investigation Completed
- [x] Find all Edge Dev related files and directories
- [x] Look for chart rendering/formatting code  
- [x] Find SMCI and scanner-related code
- [x] Identify port 5657 configuration
- [x] Find existing chart data and test files

### Thoroughness Level
**Very Thorough** - Comprehensive exploration including:
- Complete directory structure mapping
- Source code analysis (Frontend & Backend)
- Configuration file review
- Test suite location and analysis
- Technology stack identification
- Data flow documentation

---

## Key Findings Summary

### System Architecture
```
Port 5657 (Frontend)                Port 8000 (Backend)
├─ Next.js 16.0.0                  ├─ FastAPI
├─ React 19.2.0                    ├─ Uvicorn
├─ Plotly.js 3.1.2                 ├─ Python 3.13+
├─ TypeScript 5.0                  ├─ pandas, numpy
└─ Tailwind CSS 4.0                └─ Polygon API
```

### Critical Files (Absolute Paths)

**Frontend:**
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/components/EdgeChart.tsx`
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/config/globalChartConfig.ts`

**Backend:**
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/market_calendar.py`

**Tests:**
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_smci_chart_duplication.py`
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_global_chart_template_system.py`

---

## SMCI 2/18/25 Issue Analysis

### Issue Description
"Days are stacking instead of displaying as a proper time series"

### Technical Context
- **Date:** Feb 18, 2025 (Tuesday)
- **Previous trading day:** Feb 14, 2025 (Friday)  
- **Gap reason:** Weekend (Feb 15-16) + Presidents' Day (Feb 17)
- **Expected result:** 2 trading days of 5min bars (~384 total bars)
- **Actual result:** Days appear stacked instead of time-series

### Root Cause Assessment
- **NOT** data duplication (universal deduplication in place)
- **NOT** Plotly rendering duplication (resize handlers disabled)
- **LIKELY:** Rangebreaks or x-axis date handling with non-contiguous dates

### Fixes Already Implemented
1. Global Chart Template System (prevents customization conflicts)
2. Universal Deduplication (ticker + date combination)
3. Market Calendar Integration (filters weekends/holidays)
4. Plotly Configuration Standardization (disabled resize handlers)
5. Extended Hours Support (4am-8pm for 5min charts)

---

## Quick Navigation

### For Quick Understanding
Start with: **EXPLORATION_COMPLETE_SUMMARY.md**
- Executive overview
- Key discoveries
- Investigation roadmap
- 5-10 minute read

### For Technical Details
Start with: **EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md**
- Complete architecture
- Data flow diagrams
- Component analysis
- Technology stack
- 30-45 minute read

### For Quick Lookup
Start with: **EDGE_DEV_QUICK_REFERENCE.md**
- File locations
- Commands and endpoints
- Configuration details
- Troubleshooting
- 10-15 minute read

---

## Getting Started with Edge Dev

### View System Status
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
npm run health
```

### Start Development Servers
```bash
# Full stack
./dev-start.sh

# Or separately:
# Terminal 1 - Backend
cd backend && source venv/bin/activate && uvicorn main:app --reload

# Terminal 2 - Frontend  
npm run dev
```

### Test SMCI Issue
```bash
python test_smci_chart_duplication.py
```

### Quick API Test
```bash
curl "http://localhost:8000/api/chart/SMCI?timeframe=5min&lc_date=2025-02-18&day_offset=0"
```

### View in Browser
```
Frontend: http://localhost:5657
Backend Health: http://localhost:8000/api/health
```

---

## Code Priority List

### High Priority (Likely Issue Location)
1. **globalChartConfig.ts** - `generateGlobalRangebreaks()` function
2. **globalChartConfig.ts** - `calculateGlobalDataBounds()` function
3. **main.py** - `fetch_polygon_data()` function (lines 1827-1887)
4. **main.py** - `validate_chart_data_for_trading_days()` (line 2018)

### Medium Priority (Supporting Code)
5. **globalChartConfig.ts** - `generateGlobalTraces()` function
6. **globalChartConfig.ts** - `generateGlobalLayout()` function
7. **market_calendar.py** - Holiday definitions and validation
8. **EdgeChart.tsx** - Data bounds calculation and trace generation

### Lower Priority (Infrastructure)
9. **main.py** - API endpoint setup and CORS configuration
10. **start.py** - Server initialization
11. **package.json** - Dependency configuration

---

## Investigation Checklist

### API Testing
- [ ] Call endpoint with curl (verify JSON structure)
- [ ] Check timestamp formatting (ISO standard)
- [ ] Confirm no duplicate entries
- [ ] Validate OHLC data ranges
- [ ] Check volume data integrity

### Frontend Testing
- [ ] Navigate to http://localhost:5657
- [ ] Load SMCI scan results
- [ ] View 5min chart for Feb 18
- [ ] Check if single day or multiple days appear
- [ ] Inspect Plotly layout in DevTools

### Code Review
- [ ] Review rangebreaks configuration
- [ ] Check x-axis type (should be 'date')
- [ ] Verify data bounds calculation
- [ ] Confirm trace visibility settings
- [ ] Check uirevision and datarevision

### Comparative Analysis
- [ ] Test SMCI other dates
- [ ] Test other tickers on Feb 18
- [ ] Test 5min vs other timeframes
- [ ] Compare with working charts

---

## File Organization

### Documentation Files (Generated)
```
/Users/michaeldurante/ai dev/ce-hub/
├─ EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md    (5000+ words)
├─ EDGE_DEV_QUICK_REFERENCE.md            (1500+ words)
├─ EXPLORATION_COMPLETE_SUMMARY.md        (2000+ words)
└─ EXPLORATION_INDEX.md                   (this file)
```

### Source Code (Explored)
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/
├─ src/
│  ├─ components/EdgeChart.tsx            (220 lines)
│  ├─ config/globalChartConfig.ts         (395 lines)
│  └─ [other components and utilities]
├─ backend/
│  ├─ main.py                             (2050+ lines)
│  ├─ market_calendar.py                  (200 lines)
│  ├─ core/                               (scanner modules)
│  └─ [data files and other modules]
├─ package.json                           (94 lines)
├─ next.config.ts
└─ [test files and configuration]
```

---

## Technology Stack at a Glance

### Frontend (TypeScript)
- **Framework:** Next.js 16.0.0
- **UI Library:** React 19.2.0
- **Charts:** Plotly.js 3.1.2
- **Styling:** Tailwind CSS 4.0
- **State:** Zustand 5.0.8
- **HTTP:** Axios 1.12.2

### Backend (Python)
- **Framework:** FastAPI
- **Server:** Uvicorn
- **Data:** pandas, numpy
- **API Source:** Polygon.io
- **Rate Limit:** slowapi

### Development
- **Testing:** Playwright 1.56.1
- **Linting:** ESLint 9+
- **Port Config:** package.json line 6 (npm run dev -p 5657)

---

## Next Steps

### Immediate (Today)
1. Read EXPLORATION_COMPLETE_SUMMARY.md (5 minutes)
2. Review EDGE_DEV_QUICK_REFERENCE.md (10 minutes)
3. Run `python test_smci_chart_duplication.py` (reproduce issue)

### Short Term (This Session)
1. Test with curl to isolate backend vs frontend
2. Inspect Plotly rendering in browser DevTools
3. Review `calculateGlobalDataBounds()` implementation
4. Check rangebreaks configuration

### Medium Term (Debug Session)
1. Add console logging to trace execution
2. Inspect Plotly data structure in browser
3. Test with different dates to identify pattern
4. Compare working vs broken configurations

### Long Term (Solution)
1. Implement fix based on investigation findings
2. Run test suite to validate
3. Deploy to production
4. Monitor for similar issues

---

## Summary Statistics

### Codebase Size
- **Frontend Components:** 10+ TypeScript files
- **Backend Modules:** 50+ Python files
- **Total Lines of Code:** 10,000+ (excluding node_modules/venv)
- **Configuration Files:** 5+ (package.json, next.config.ts, etc.)
- **Test Files:** 4+ dedicated test suites

### System Complexity
- **Frontend Dependencies:** 24 packages
- **Backend Dependencies:** 50+ packages
- **Port Configuration:** 2 (5657 frontend, 8000 backend)
- **API Endpoints:** 15+ routes
- **Data Sources:** 1 (Polygon API)

### Documentation Generated
- **Total Words:** 8,000+ across 4 documents
- **Code Snippets:** 20+
- **Tables:** 10+
- **Diagrams:** 5+
- **Lists:** 50+

---

## Document Cross-References

### EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md
Linked from:
- System Architecture section
- Data Flow documentation
- Chart System Architecture section
- Critical Fixes section
- File Reference Summary

### EDGE_DEV_QUICK_REFERENCE.md
Linked from:
- Quick lookup sections
- API endpoint documentation
- Testing procedures
- Common issues
- Debugging tips

### EXPLORATION_COMPLETE_SUMMARY.md
Linked from:
- Executive overview
- Investigation roadmap
- Technology details
- Status assessment
- Starting points

---

## Contact Information for Issues

### If You Encounter Issues

**System Not Starting:**
- Check `npm run health`
- Verify ports 5657 and 8000 are available
- See EDGE_DEV_QUICK_REFERENCE.md "Common Issues"

**Chart Not Loading:**
- Check backend: `curl http://localhost:8000/api/health`
- Check frontend: `curl http://localhost:5657`
- Review test files in EXPLORATION_COMPLETE_SUMMARY.md

**SMCI Issue Reproducing:**
- Run `python test_smci_chart_duplication.py`
- Use curl to test API directly
- See Investigation Checklist in this file

**Code Questions:**
- Refer to EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md for detailed analysis
- Use Code Priority List for focused investigation
- Check specific function locations in Quick Reference

---

## Acknowledgments

Comprehensive exploration completed November 8, 2025.

All documentation generated with focus on:
- Clarity and usability
- Absolute file paths (no relative references)
- Actionable insights
- Quick reference capability
- Complete coverage of system

---

**Document Status:** Complete ✅  
**Exploration Status:** Complete ✅  
**Ready for Next Phase:** Yes ✅

---

Start with: **EXPLORATION_COMPLETE_SUMMARY.md** for overview  
Deep dive into: **EDGE_DEV_SYSTEM_STRUCTURE_REPORT.md** for details  
Quick lookup: **EDGE_DEV_QUICK_REFERENCE.md** for commands and files
