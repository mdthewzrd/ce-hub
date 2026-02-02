# Run Scan Functionality Analysis - Edge-Dev Dashboard

## Executive Summary

The "Run Scan" functionality has **multiple connection points** between the frontend (Next.js on port 5657) and backend (FastAPI on port 8000), but there are **critical integration issues** preventing successful scan execution.

### Key Issues Identified:
1. **Dual API Implementation Problem** - Two conflicting scan implementations
2. **Backend Service Not Connected** - Frontend calls local implementation instead of backend
3. **Missing Error Handling Chain** - Errors aren't propagated properly
4. **No CopilotKit Integration** - AI agent capabilities not present
5. **Potential Data Format Mismatches** - Response formats may differ

---

## Frontend Architecture

### Component: SystematicTrading.tsx
**Path:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/SystematicTrading.tsx`

**Responsibility:** Main UI component for the scan workflow

#### Key Code Flow:

```typescript
// Line 94-216: startScan() function
const startScan = async () => {
  // Makes fetch request to LOCAL API (not backend!)
  const response = await fetch('/api/systematic/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: selectedFilters,
      scan_date: new Date().toISOString().split('T')[0],
      enable_progress: true
    })
  });

  // Processes streaming response
  const reader = response.body?.getReader();
  // Reads JSON-formatted progress updates from stream
}
```

**Issues Found:**
- Line 107: Hardcoded path `/api/systematic/scan` - calls Next.js API route, NOT FastAPI
- Line 129-198: Expects streaming response with JSON lines
- No connection to `http://localhost:8000` backend

### Service Layer: fastApiScanService.ts
**Path:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts`

**Responsibility:** Should bridge frontend to FastAPI backend

#### Implementation:
```typescript
// Line 6: Correct backend URL
const FASTAPI_BASE_URL = 'http://localhost:8000';

// Line 56-80: Proper scan execution
async executeScan(request: ScanRequest): Promise<ScanResponse> {
  const response = await fetch(`${this.baseUrl}/api/scan/execute`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(request)
  });
  // ... error handling ...
}

// Line 174-212: Poll-based status checking
async waitForScanCompletion(scanId: string): Promise<ScanResponse> {
  while (Date.now() - startTime < maxWaitTime) {
    const status = await this.getScanStatus(scanId);
    if (status.status === 'completed') {
      return { ... };
    }
  }
}
```

**Status:** ✅ **Correctly implemented but UNUSED by SystematicTrading component**

---

## Critical Problem #1: Dual API Implementations

### Path A: Next.js Local API (Currently Used)
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/api/systematic/scan/route.ts`

```typescript
// Lines 6-38: API Route Handler
export async function POST(request: NextRequest) {
  const { filters, scan_date = '2024-02-23', streaming = false } = await request.json();

  if (streaming) {
    // Returns ReadableStream
    const stream = new ReadableStream({
      start(controller) {
        runScanWithProgress(controller, filters, scan_date);
      }
    });
    return new Response(stream, {
      headers: { 'Content-Type': 'text/plain', 'Transfer-Encoding': 'chunked' }
    });
  } else {
    return await runCorrectedScan(filters, scan_date);
  }
}

// Lines 65-120: CorrectedLC_Scanner class
class CorrectedLC_Scanner {
  private apiKey = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'; // Polygon API key
  private tickers = [...list of 80+ tickers...]; // Hardcoded universe

  async scanUniverseExact(scanDate: string) {
    // Fetches from Polygon.io API
    // Calculates 20+ technical indicators
    // Checks LC patterns with complex logic
  }
}
```

**Problems:**
- Relies on **external Polygon.io API** (rate-limited)
- **Hardcoded ticker list** - not dynamic
- **Duplicate implementation** of Python scanner logic
- API key embedded in frontend code (security issue)
- Date parameter hardcoded to `'2024-02-23'` despite taking input

### Path B: FastAPI Backend (Should Be Used)
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`

```python
@app.post("/api/scan/execute", response_model=ScanResponse)
async def execute_scan(scan_request: ScanRequest, background_tasks: BackgroundTasks):
    """Execute real LC scan with dynamic date range using real Python scan code"""
    
    # Line 163-165: Starts real scan in background
    if scan_request.use_real_scan:
        background_tasks.add_task(run_real_scan_background, 
                                 scan_id, 
                                 scan_request.start_date, 
                                 scan_request.end_date)
        
        return ScanResponse(
            success=True,
            scan_id=scan_id,
            message="Real LC scan started. Use WebSocket or status endpoint for progress.",
            results=[]
        )

@app.websocket("/api/scan/progress/{scan_id}")
async def websocket_scan_progress(websocket: WebSocket, scan_id: str):
    """Real-time progress via WebSocket"""

@app.get("/api/scan/status/{scan_id}")
async def get_scan_status(scan_id: str):
    """Poll-based status checking"""

@app.get("/api/scan/results/{scan_id}")
async def get_scan_results(scan_id: str):
    """Get completed results"""
```

**Features:**
- ✅ Real Python scanner integration
- ✅ Async background execution
- ✅ WebSocket support for real-time updates
- ✅ Poll-based status API
- ✅ Proper error handling
- ✅ Optimized scanner with 80%+ performance improvement

---

## Critical Problem #2: Backend Execution Flow

### Backend Integration
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_wrapper.py`

```python
async def run_lc_scan(start_date: str, end_date: str, progress_callback=None):
    """Run OPTIMIZED LC scan with dramatic performance improvements"""
    
    # Delegates to optimized scanner
    results = await run_optimized_lc_scan(start_date, end_date, progress_callback)
    return results
```

**Uses:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_optimized.py`

**Optimizations:**
- 80%+ dataset reduction through early pre-filtering
- Reduced historical data range (90 days vs 400 days)
- Increased API concurrency (12x vs 3x)
- Preserves original LC pattern detection logic

---

## Connection Issues Identified

### Issue 1: SystematicTrading Doesn't Use FastAPI Service

```typescript
// WRONG: Current implementation (line 107 in SystematicTrading.tsx)
const response = await fetch('/api/systematic/scan', {
  // ... calls local Next.js route
});

// CORRECT: Should be
import { fastApiScanService } from '@/services/fastApiScanService';

const response = await fastApiScanService.executeScan({
  start_date: selectedDate,
  end_date: selectedDate,
  use_real_scan: true,
  filters: selectedFilters
});
```

### Issue 2: API Response Format Mismatch

**Frontend expects (line 157-184):**
```typescript
const data = JSON.parse(line);
if (data.type === 'progress') {
  setScanProgress(data.progress || 0);
  setScanStatusMessage(data.message || 'Processing...');
} else if (data.type === 'complete') {
  setScanResults(data.results || []);
}
```

**Local API returns (route.ts line 639-670):**
```typescript
controller.enqueue(new TextEncoder().encode(JSON.stringify({
  type: 'progress',
  progress: step.progress,
  message: step.message
}) + '\n'));

// Final response:
controller.enqueue(new TextEncoder().encode(JSON.stringify({
  type: 'complete',
  results: results,
  total_found: results.length
}) + '\n'));
```

**Backend returns (main.py line 70-77):**
```python
{
  "type": "progress",
  "scan_id": scan_id,
  "status": status,
  "progress_percent": progress,
  "message": message,
  "timestamp": datetime.now().isoformat()
}
```

**Incompatibility:** Backend sends `progress_percent` but frontend expects `progress`

### Issue 3: Streaming vs Polling

**Local API:** Streaming responses with chunked transfer
**FastAPI Backend:** Two strategies:
- WebSocket for real-time updates
- Polling `/api/scan/status/{scan_id}` for status

**Frontend expectation:** Streaming JSON lines

### Issue 4: Data Format Differences

| Aspect | Local Route | FastAPI Backend |
|--------|------------|-----------------|
| Progress field | `progress` (0-100) | `progress_percent` (0-100) |
| Status field | `type: 'progress'/'complete'/'error'` | `status: 'initializing'/'running'/'completed'/'error'` |
| Result structure | Simple array | `ScanResponse` model |
| Error handling | `type: 'error'` | HTTP exceptions + JSON errors |
| Date handling | Hardcoded to `'2024-02-23'` | Dynamic from request |

---

## Error Propagation Analysis

### Current Error Chain (Broken)

```typescript
// SystematicTrading.tsx line 121-124
if (!response.ok) {
  const errorText = await response.text();
  console.error('❌ API Error Response:', errorText);
  throw new Error(`Scan failed with status ${response.status}: ${errorText}`);
}
```

**Problems:**
1. Only catches HTTP errors, not functional failures
2. Frontend doesn't validate response structure
3. No distinction between "API down" vs "scan failed" vs "data error"
4. Error message displayed to user lacks context

### Backend Error Handling (Robust)

```python
# main.py line 211-216
except ValueError as e:
  logger.error(f"Validation error: {str(e)}")
  raise HTTPException(status_code=400, detail=str(e))
except Exception as e:
  logger.error(f"Error executing scan: {str(e)}")
  raise HTTPException(status_code=500, detail=f"Scan execution failed: {str(e)}")
```

---

## CopilotKit Integration Status

**Current Status:** ❌ **NOT INTEGRATED**

**Evidence:**
- No CopilotKit imports in `SystematicTrading.tsx`
- No CopilotKit provider in layout or page
- No AI agent actions defined
- No context sharing with LLM

**Recommended Integration Points:**

1. **Scan Progress Context**
   ```typescript
   useCopilotAction({
     name: "scan_progress",
     description: "Provides real-time scan progress updates",
     parameters: [
       { name: "progress", description: "Current progress percentage" },
       { name: "message", description: "Status message" },
       { name: "current_ticker", description: "Currently scanning ticker" }
     ],
     handler: (params) => {
       // Update UI based on progress
     }
   });
   ```

2. **Scan Results Context**
   ```typescript
   useCopilotContext({
     documents: scanResults.map(result => ({
       id: result.ticker,
       content: `${result.ticker}: ${result.gap}% gap, score: ${result.parabolic_score}`
     }))
   });
   ```

3. **AI-Assisted Analysis**
   ```typescript
   // Allow Copilot to suggest which results to trade on
   // Provide market context and pattern recognition
   ```

---

## Data Flow Diagrams

### Current Broken Flow
```
User clicks "Run Scan" 
  ↓
SystematicTrading.startScan()
  ↓
fetch('/api/systematic/scan') → Next.js Route
  ↓
CorrectedLC_Scanner (local, no real Python execution)
  ↓
Polygon.io API (rate-limited, external)
  ↓
Mock or partial results
  ↓
Frontend UI updated
  ↓
❌ Doesn't use optimized backend
❌ Duplicates logic
❌ Security issues (API key exposed)
```

### Correct Flow (Should Be)
```
User clicks "Run Scan"
  ↓
SystematicTrading should call:
  fastApiScanService.executeScan()
  ↓
fetch('http://localhost:8000/api/scan/execute')
  ↓
FastAPI Backend receives request
  ↓
background_tasks.add_task(run_real_scan_background)
  ↓
run_lc_scan() → lc_scanner_wrapper.py
  ↓
run_optimized_lc_scan() → Real Python scanner
  ↓
Market data fetching + technical calculations
  ↓
LC pattern detection
  ↓
Results stored in active_scans[scan_id]
  ↓
Frontend polls /api/scan/status/{scan_id}
  OR WebSocket connects to /api/scan/progress/{scan_id}
  ↓
Real-time progress updates
  ↓
✅ Uses optimized backend
✅ No code duplication
✅ Security (no exposed API keys)
✅ Proper async execution
```

---

## Scan Filter Configuration Issues

### Frontend Filter Structure (SystematicTrading.tsx line 66-72)
```typescript
const [selectedFilters, setSelectedFilters] = useState({
  lc_frontside_d2_extended: true,
  lc_frontside_d3_extended_1: true,
  min_gap: 0.5,
  min_pm_vol: 5000000,
  min_prev_close: 0.75
});
```

### Backend Expected Format (fastApiScanService.ts line 217-246)
```typescript
getFiltersForProject(projectName: string): Record<string, any> {
  switch (projectName.toLowerCase()) {
    case 'gap up scanner':
      return {
        lc_frontside_d2_extended: true,
        min_gap_atr: 0.5,
        min_volume: 10000000,
        scan_type: 'gap_up'
      };
```

**Mismatch:** Frontend sends `min_pm_vol` but service expects `min_volume`

---

## Port Configuration

| Service | Port | Status |
|---------|------|--------|
| Next.js Frontend | 5657 | ✅ Running |
| FastAPI Backend | 8000 | ✅ Configured in fastApiScanService |
| Polygon.io API | HTTPS | ⚠️ External (rate-limited, embedded key) |

**Environment Variables Missing:**
- `NEXT_PUBLIC_API_URL` - Should point to backend
- `FASTAPI_URL` - Not defined
- `POLYGON_API_KEY` - Exposed in frontend code

---

## Recommendations

### Immediate Fixes (Priority 1)

1. **Update SystematicTrading to use backend service**
   ```typescript
   import { fastApiScanService } from '@/services/fastApiScanService';

   const startScan = async () => {
     setIsScanning(true);
     try {
       // Use backend scan service instead of local route
       const response = await fastApiScanService.executeProjectScan(
         'LC Frontside D2/D3',
         { start: scanDate, end: scanDate }
       );
       
       setScanResults(response.results || []);
       setScanProgress(100);
       setScanStatusMessage(`Found ${response.total_found} qualifying tickers`);
     } catch (error) {
       setScanError(error instanceof Error ? error.message : 'Unknown error');
     } finally {
       setIsScanning(false);
     }
   };
   ```

2. **Fix filter format mismatch**
   ```typescript
   // Map frontend filters to backend format
   const backendFilters = {
     lc_frontside_d2_extended: selectedFilters.lc_frontside_d2_extended,
     min_gap_atr: selectedFilters.min_gap,
     min_volume: selectedFilters.min_pm_vol,
     // ... other filters
   };
   ```

3. **Remove or fix local scan route**
   - Either delete `/api/systematic/scan/route.ts` 
   - OR update it to proxy to backend with proper format conversion

4. **Add environment variable for backend URL**
   ```bash
   # .env.local
   NEXT_PUBLIC_FASTAPI_URL=http://localhost:8000
   ```

### Medium-term Improvements (Priority 2)

1. **Add CopilotKit integration**
   - Create `useScanContext` hook
   - Share progress updates with Copilot
   - Allow AI to suggest analysis/trades

2. **Implement proper error boundaries**
   - Create error recovery strategies
   - Add retry logic for transient failures
   - Better error messaging

3. **Add progress visualization options**
   - Support both streaming and polling
   - Handle connection interruptions gracefully
   - Show estimated time remaining

4. **Create comprehensive logging/monitoring**
   - Log all API calls with timestamps
   - Track scan performance metrics
   - Alert on failures

### Long-term Architecture (Priority 3)

1. **Consolidate API layer**
   - Single source of truth for backend communication
   - Typed API client with validation

2. **Add caching layer**
   - Cache scan results by date/filters
   - Reduce redundant backend calls

3. **Implement scan job management**
   - Queue multiple scans
   - Schedule periodic scans
   - Store historical results

---

## Files to Review

### Critical Files
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/SystematicTrading.tsx` (Frontend UI)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts` (Service layer - currently unused)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/api/systematic/scan/route.ts` (Local API - problematic)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py` (Backend - correct implementation)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_wrapper.py` (Scanner wrapper)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_optimized.py` (Real scanner)

### Configuration Files
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/.env.local` (Missing FASTAPI URL)
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/requirements.txt` (Dependencies)

---

## Testing Checklist

- [ ] Backend health check: `curl http://localhost:8000/api/health`
- [ ] Backend scan endpoint: `POST http://localhost:8000/api/scan/execute`
- [ ] WebSocket connection: `ws://localhost:8000/api/scan/progress/{scan_id}`
- [ ] Frontend -> Backend connectivity
- [ ] Progress updates via polling
- [ ] Progress updates via WebSocket
- [ ] Error handling for missing backend
- [ ] Error handling for API failures
- [ ] Filter format conversion
- [ ] Result display formatting

---

## Conclusion

The "Run Scan" failure is caused by **architectural confusion** where the frontend uses a local, incomplete implementation instead of the properly built FastAPI backend. The backend is correctly implemented with real Python scanner integration, async execution, and proper error handling. A simple redirect from the frontend component to use the existing `fastApiScanService` combined with proper filter mapping would immediately fix the issue.

**Estimated fix time:** 30-45 minutes for core functionality, +30 minutes for CopilotKit integration.
