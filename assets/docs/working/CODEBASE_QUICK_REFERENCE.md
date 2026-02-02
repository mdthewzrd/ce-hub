# CE-Hub Codebase Quick Reference

## Key Project Files at a Glance

### Entry Points
- **Frontend Main**: `/edge-dev/src/app/page.tsx` - Trading dashboard
- **Backend Scanner**: `/edge-dev/backend/core/scanner.py` - LC D2 pattern detection
- **API Bridge**: `/edge-dev/src/app/api/systematic/scan/route.ts` - Connects frontend to backend
- **Chart Viewer**: `/edge-dev/src/components/EdgeChart.tsx` - Plotly chart component

### Main Ports
```
Port 5657  → Edge-dev (Next.js) - Trading & Charts
Port 3000  → Planner-chat (Express) - AI Chat
Port 8000  → FastAPI Backend (inferred)
```

### Database/Polygon API
- **Polygon API Key**: `4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy`
- **Cached Data**: `/edge-dev/backend/*_data.json` (~150 files)
- **Market Calendar**: NYSE trading hours, holidays, extended hours (4am-8pm)

---

## Architecture in 30 Seconds

```
User Interface (React 19 + TypeScript)
    ↓
Main Page Component (page.tsx)
    ├─→ Upload Scanner Code
    ├─→ Extract Parameters
    ├─→ Execute Scan (fastApiScanService)
    ├─→ Display Results Table
    └─→ Click Result → Load Chart
         ↓
         EdgeChart Component (Plotly.js)
         ├─→ Fetch Data (Polygon API)
         ├─→ Process OHLC Data
         └─→ Render Candlestick Chart
                ↓
    Navigate Days (ChartDayNavigation)
    - Day 0: Pattern date
    - Day 1+: Following trading days
         ↓
    Save Scan (SaveScanModal)
    └─→ LocalStorage
         ↓
    Backend: Python FastAPI
    ├─→ scanner.py (LC D2 pattern detection)
    ├─→ parameter_integrity_system.py
    └─→ code_preservation_engine.py
```

---

## File Organization by Purpose

### Scan Execution
- `/edge-dev/src/app/page.tsx` - Scan UI, parameter extraction, result display
- `/edge-dev/src/services/fastApiScanService.ts` - FastAPI communication
- `/edge-dev/backend/core/scanner.py` - Pattern detection logic
- `/edge-dev/src/types/scanTypes.ts` - TypeScript interfaces

### Chart Display
- `/edge-dev/src/components/EdgeChart.tsx` - Plotly chart wrapper
- `/edge-dev/src/utils/polygonData.ts` - Polygon API integration
- `/edge-dev/src/utils/dataProcessing.ts` - OHLC processing
- `/edge-dev/src/utils/marketCalendar.ts` - Trading hours/holidays

### Scan Management
- `/edge-dev/src/components/SavedScansSidebar.tsx` - View saved scans
- `/edge-dev/src/components/SaveScanModal.tsx` - Save scan dialog
- `/edge-dev/src/hooks/useSavedScans.ts` - Scan state management
- `/edge-dev/src/utils/savedScans.ts` - LocalStorage interface

### Day Navigation
- `/edge-dev/src/components/ChartDayNavigation.tsx` - Day controls
- `/edge-dev/src/utils/chartDayNavigation.ts` - Navigation logic

### Backend Systems
- `/edge-dev/backend/core/code_preservation_engine.py` - Parameter preservation
- `/edge-dev/backend/core/parameter_integrity_system.py` - Validation
- `/edge-dev/backend/core/intelligent_parameter_extractor.py` - Parameter detection
- `/edge-dev/backend/core/local_llm_classifier.py` - LLM classification

---

## Key Data Structures

### ScanResult
```typescript
{
  symbol: string,
  ticker: string,
  date: string,
  gap_percent: number,
  volume_ratio: number | null,
  signal_strength: 'Strong' | 'Moderate',
  entry_price: number,
  target_price: number,
  // + 30+ additional fields in EnhancedScanResult
}
```

### ChartData
```typescript
{
  x: string[],        // ISO timestamps
  open: number[],
  high: number[],
  low: number[],
  close: number[],
  volume: number[]
}
```

### Chart Templates
- **day**: 90 days, 1 bar/day, daily OHLC
- **hour**: 90 days, 16 bars/day, 1-min resampled, 4am-8pm
- **15min**: 15 days, 64 bars/day, 1-min resampled, 4am-8pm
- **5min**: 5 days, 192 bars/day, 1-min resampled, 4am-8pm

---

## User Interaction Flows

### Flow 1: Run Scan
```
1. User uploads scanner code
2. CodeFormatter parses code
3. extractFiltersFromCode() extracts parameters
4. Click "Run Scan"
5. fastApiScanService.executeScan()
6. POST /api/systematic/scan
7. Python scanner.py processes
8. Returns EnhancedScanResult[]
9. Frontend displays results table
```

### Flow 2: Click Result & View Chart
```
1. User clicks result row in table
2. handleResultClick() triggered
3. Extract ticker + date
4. fetchRealData(ticker, timeframe, date)
5. fetchPolygonData() from Polygon API
6. processRawMarketData() transforms
7. EdgeChart renders Plotly candlesticks
8. User can navigate days with ChartDayNavigation
```

### Flow 3: Save Scan
```
1. SaveScanModal opens
2. User enters name/description
3. Current scanParams preserved
4. Results cached
5. localStorage.setItem('saved_scans')
6. Appears in SavedScansSidebar
```

---

## Essential Dependencies

### Frontend (npm packages)
- `next@16.0.0` - React framework
- `react@19.2.0` - UI library
- `plotly.js@3.1.2` - Charts
- `tailwindcss@4` - Styling
- `lucide-react@0.547.0` - Icons
- `typescript@5` - Type checking

### Backend (Python)
- `pandas` - Data manipulation
- `requests` - HTTP
- `plotly` - Visualizations
- `pandas_market_calendars` - Trading calendar
- `aiohttp` + `asyncio` - Async HTTP
- `numpy` - Numerical computing

---

## Environment & Configuration

### .env.local (edge-dev)
```
NEXT_PUBLIC_POLYGON_API_KEY=<key>
FASTAPI_BASE_URL=http://localhost:8000
```

### package.json Scripts (edge-dev)
```bash
npm run dev              # Port 5657
npm run build           # Production build
npm run test            # Playwright tests
npm run test:charts     # Chart tests
npm run test:trading    # Trading tests
```

### package.json Scripts (planner-chat)
```bash
npm run dev             # Port 3000
npm run start           # Production
```

---

## Database/API Connections

### Polygon API
- **Endpoint**: `https://api.polygon.io`
- **Key**: `4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy`
- **Used for**: OHLC bars, extended hours data
- **Cached**: `/edge-dev/backend/*_data.json` files

### LocalStorage
- **Key**: `saved_scans`
- **Format**: `{ version, scans[], settings }`
- **Persistence**: Browser storage, survives page reload

### Session Storage
- **Chart data**: Temporary cache during navigation
- **Scan progress**: Real-time updates
- **Form state**: Temporary form data

---

## Debugging Tips

### Check Scan Results
Look at: `page.tsx` lines 98-107 (mock results) and 19-35 (deduplication)

### Verify Chart Loading
Check: `EdgeChart.tsx` props and `fetchRealData()` in `page.tsx`

### Trace Parameter Extraction
See: `extractFiltersFromCode()` function in `page.tsx` (lines 124+)

### Monitor Backend
Look at: `/edge-dev/backend/core/scanner.py` (65.7KB main file)

### Check API Communication
Monitor: `/edge-dev/src/app/api/systematic/scan/route.ts`

### LocalStorage Issues
Inspect: Browser DevTools > Application > LocalStorage > saved_scans

---

## File Size Reference

### Large Files (Critical Components)
| File | Size | Purpose |
|------|------|---------|
| page.tsx | ~46KB | Main dashboard |
| scanner.py | 65.7KB | Pattern detection |
| parameter_integrity_system.py | 58.3KB | Validation |
| enhanced_code_formatter.py | 45KB | Code formatting |

### Medium Files (Supporting)
| File | Size |
|------|------|
| app.js (planner-chat) | 85.7KB |
| main.js (planner-chat server) | 23.9KB |
| EdgeChart.tsx | 18.5KB |
| CodeFormatter.tsx | 16.5KB |

---

## Testing Infrastructure

### Playwright Tests
- **Location**: `/edge-dev/tests/e2e/`
- **Test Types**: 
  - Chart interactions
  - Trading interface
  - Mobile responsiveness
  - Page load

### Page Objects
- **Location**: `/edge-dev/tests/page-objects/`
- **Components**:
  - ScanResultsTable.js
  - ChartComponent.js
  - TradingDashboard.js

### Fixtures
- **Location**: `/edge-dev/tests/fixtures/`
- **Types**: Auth, data, mock APIs

---

## Common Patterns

### API Communication Pattern
```typescript
// Service layer
const fastApiScanService = {
  async executeScan(request) {
    return fetch('http://localhost:8000/scan', {
      method: 'POST',
      body: JSON.stringify(request)
    }).then(r => r.json())
  }
}

// Component usage
const results = await fastApiScanService.executeScan({
  start_date, end_date, filters
})
```

### State Management Pattern
```typescript
const [scanState, setScanState] = useState({
  results: [],
  isLoading: false,
  error: null
})

// Persist to localStorage
useEffect(() => {
  localStorage.setItem('saved_scans', JSON.stringify(scanState))
}, [scanState])
```

### Chart Navigation Pattern
```typescript
const [currentDay, setCurrentDay] = useState(0)

const handleNextDay = () => {
  setCurrentDay(prev => prev + 1)
  // Reload chart for new day
  fetchRealData(ticker, timeframe, getDateForDay(currentDay))
}
```

---

## Quick Lookup Table

| What | Where | Key File |
|------|-------|----------|
| Chart display | Component | `EdgeChart.tsx` |
| Scan execution | API | `/api/systematic/scan/route.ts` |
| Pattern detection | Backend | `scanner.py` |
| Parameter extraction | Main page | `page.tsx` lines 124+ |
| Saved scans | Hook | `useSavedScans.ts` |
| Trading hours | Utility | `marketCalendar.ts` |
| Data processing | Utility | `dataProcessing.ts` |
| Day navigation | Component | `ChartDayNavigation.tsx` |
| Result deduplication | Main page | `page.tsx` lines 19-35 |
| Polygon integration | Utility | `polygonData.ts` |

