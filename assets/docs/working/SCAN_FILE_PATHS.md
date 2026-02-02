# Run Scan - Complete File Path Reference

## Absolute File Paths (Copy/Paste Ready)

### Frontend Components & Services

**Main UI Component (Where the bug is):**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/SystematicTrading.tsx
```
- Lines 94-216: `startScan()` function (NEEDS FIX)
- Lines 50-72: State initialization with filters
- Lines 357-580: Scan configuration UI

**Service Layer (Correctly implemented but unused):**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts
```
- Lines 6: FASTAPI_BASE_URL = 'http://localhost:8000'
- Lines 56-80: `executeScan()` method
- Lines 148-169: `executeProjectScan()` convenience method
- Lines 174-212: `waitForScanCompletion()` polling method
- Lines 217-246: `getFiltersForProject()` filter mapping

**Local API Route (Currently called, should be bypassed):**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/api/systematic/scan/route.ts
```
- Lines 6-38: Route handler
- Lines 65-636: CorrectedLC_Scanner class (duplicate implementation)
- Lines 639-683: `runScanWithProgress()` streaming function

**Related Components:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/page.tsx
```
- Main dashboard page that imports SystematicTrading

### Backend (FastAPI)

**Main API Server:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py
```
- Lines 29-49: Pydantic models (ScanRequest, ScanResponse, ScanProgress)
- Lines 82-98: FastAPI app initialization
- Lines 113-133: Health check endpoints
- Lines 135-216: `execute_scan()` endpoint (POST /api/scan/execute)
- Lines 218-275: `run_real_scan_background()` async executor
- Lines 276-283: `get_scan_status()` endpoint (GET /api/scan/status/{scan_id})
- Lines 284-305: `get_scan_results()` endpoint (GET /api/scan/results/{scan_id})
- Lines 312-360: `websocket_scan_progress()` WebSocket endpoint
- Lines 362-385: Performance info endpoint

**Scanner Wrapper:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_wrapper.py
```
- Lines 21-39: `validate_date_range()` function
- Lines 41-74: `run_lc_scan()` async function
- Lines 76-93: `sync_run_lc_scan()` synchronous wrapper
- Delegates to: `lc_scanner_optimized.py`

**Optimized Scanner:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_optimized.py
```
- Real Python scanner implementation
- 80%+ performance optimization
- 12x API concurrency
- 90-day data window instead of 400+

**Original Full Scanner (Reference):**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner.py
```
- Original implementation (slower, for reference)

### Configuration Files

**Backend Configuration:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/requirements.txt
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/requirements-minimal.txt
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/docker-compose.yml
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/Dockerfile
```

**Frontend Configuration:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/.env.local
```
- Currently missing: `NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000`

**Backend Configuration (Deployment):**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/DEPLOYMENT_GUIDE.md
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/README.md
```

### Analysis Documents (This Analysis)

```
/Users/michaeldurante/ai dev/ce-hub/SCAN_FUNCTIONALITY_ANALYSIS.md
/Users/michaeldurante/ai dev/ce-hub/SCAN_QUICK_REFERENCE.md
/Users/michaeldurante/ai dev/ce-hub/SCAN_FILE_PATHS.md
```

## Directory Structure

```
edge-dev/
├── src/
│   ├── app/
│   │   ├── exec/
│   │   │   ├── components/
│   │   │   │   ├── SystematicTrading.tsx          [BUG HERE]
│   │   │   │   ├── ExecutionChart.tsx
│   │   │   │   ├── ExecutionStats.tsx
│   │   │   │   └── ...
│   │   │   ├── page.tsx
│   │   │   ├── utils/
│   │   │   │   ├── executionEngine.ts
│   │   │   │   ├── executionMetrics.ts
│   │   │   │   └── strategyConverter.ts
│   │   │   └── ...
│   │   ├── api/
│   │   │   └── systematic/
│   │   │       └── scan/
│   │   │           ├── route.ts               [PROBLEMATIC]
│   │   │           ├── route-backup.ts
│   │   │           └── route-updated.ts
│   │   └── ...
│   ├── services/
│   │   └── fastApiScanService.ts               [CORRECTLY IMPLEMENTED]
│   ├── components/
│   ├── utils/
│   └── ...
├── backend/
│   ├── main.py                                  [BACKEND API]
│   ├── lc_scanner_wrapper.py                   [WRAPPER]
│   ├── lc_scanner_optimized.py                 [REAL SCANNER]
│   ├── lc_scanner.py                           [ORIGINAL]
│   ├── api/
│   ├── core/
│   ├── models/
│   ├── requirements.txt
│   ├── docker-compose.yml
│   ├── Dockerfile
│   ├── DEPLOYMENT_GUIDE.md
│   └── README.md
├── .env.local                                  [MISSING CONFIG]
├── public/
├── tests/
└── ...
```

## Quick Links to Code

### The Bug (SystematicTrading.tsx)
```
file:///Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/SystematicTrading.tsx
Lines: 94-216 (startScan function)
```

### The Solution (fastApiScanService.ts)
```
file:///Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts
Lines: 56-80 (executeScan) or 148-169 (executeProjectScan)
```

### The Backend (main.py)
```
file:///Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py
Lines: 135-216 (execute_scan endpoint)
```

## Related UI Pages & Components

**Execution Dashboard:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/page.tsx
```
- Imports SystematicTrading component
- Main trading execution interface

**Execution Components:**
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/
├── ExecutionChart.tsx
├── ExecutionStats.tsx
├── TradeList.tsx
├── LeftNavigation.tsx
├── LoadingStates.tsx
├── RenataAgent.tsx               (AI agent - potential CopilotKit integration)
├── StrategyUpload.tsx
├── SystematicTrading.tsx          (OUR BUG)
└── ErrorBoundary.tsx
```

## Log & Output Files

```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/logs/
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/scan_results/
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test-results/
```

## Testing Files

```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/tests/
/Users/michaeldurante/ai dev/ce-hub/edge-dev/test-strategies/
/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/utils/__tests__/
```

## Key Constants & Configs

### Backend URL (Frontend Service)
```typescript
// File: /Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts
// Line 6:
const FASTAPI_BASE_URL = 'http://localhost:8000';
```

### Polygon API Key (Frontend Route - SECURITY ISSUE)
```typescript
// File: /Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/api/systematic/scan/route.ts
// Line 67:
private apiKey = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy';
```

### Backend Settings (main.py)
```python
# CORS Configuration - Line 101
# Allows all origins (should restrict in production)

# Health Check - Line 123
# GET /api/health

# Scan Execution - Line 135
# POST /api/scan/execute
# use_real_scan: bool (default True)

# WebSocket Progress - Line 312
# ws://localhost:8000/api/scan/progress/{scan_id}

# Poll Interval (fastApiScanService.ts) - Line 176
# 2000ms (2 seconds)

# Max Wait Time (fastApiScanService.ts) - Line 175
# 300000ms (5 minutes)
```

## Environment Setup

### Backend Requirements
```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/requirements.txt

Key packages:
- fastapi
- uvicorn
- pandas
- pandas_market_calendars
- aiohttp
- numpy
```

### Frontend Setup
```
Node.js + npm/yarn
Next.js 14+
React 18+
TypeScript
Tailwind CSS
Lucide Icons
```

## Starting Services

### Start Backend
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend"
python main.py
# OR with uvicorn
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### Start Frontend
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/edge-dev"
npm run dev
# Runs on port 5657 (configured in next.config.js)
```

## Common Commands

### Test Backend Health
```bash
curl http://localhost:8000/api/health
curl http://localhost:8000/
```

### Create Test Scan Request
```bash
curl -X POST http://localhost:8000/api/scan/execute \
  -H "Content-Type: application/json" \
  -d '{
    "start_date": "2024-10-30",
    "end_date": "2024-10-30",
    "use_real_scan": true,
    "filters": {}
  }'
```

### Check Scan Status
```bash
curl http://localhost:8000/api/scan/status/[SCAN_ID]
```

### Get Scan Results
```bash
curl http://localhost:8000/api/scan/results/[SCAN_ID]
```

## Related Documentation Files

```
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/DEPLOYMENT_GUIDE.md
/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/README.md
/Users/michaeldurante/ai dev/ce-hub/docs/traderra-csv-developer-guide.md
/Users/michaeldurante/ai dev/ce-hub/docs/journal-developer-reference.md
```

## Summary Table

| File | Purpose | Status | Issue |
|------|---------|--------|-------|
| SystematicTrading.tsx | UI Component | ✅ Built | ❌ Wrong endpoint |
| fastApiScanService.ts | Service Layer | ✅ Built | ⚠️ Not used |
| route.ts (local) | API Handler | ⚠️ Works | ❌ Incomplete |
| main.py | Backend API | ✅ Built | ✅ Ready |
| lc_scanner_wrapper.py | Integration | ✅ Built | ✅ Ready |
| lc_scanner_optimized.py | Real Scanner | ✅ Built | ✅ Ready |

---

**Next Action:** Fix the `startScan()` function in SystematicTrading.tsx to use `fastApiScanService` instead of the local route.

**Estimated Time:** 30-45 minutes including testing.
