# Run Scan - Quick Reference Guide

## Problem Summary
The "Run Scan" button fails because the frontend UI component calls a **local Next.js API route** instead of the **optimized FastAPI backend** that's already properly configured.

## The Core Issue (One Picture)

```
CURRENT (BROKEN):
Frontend → fetch('/api/systematic/scan') → Next.js Route → Polygon.io (rate-limited)

SHOULD BE:
Frontend → fastApiScanService → http://localhost:8000 → Real Python Scanner → Market Data
```

## Quick Fixes

### Fix #1: Update SystematicTrading.tsx (Lines 94-216)

**REPLACE THIS:**
```typescript
const startScan = async () => {
  const response = await fetch('/api/systematic/scan', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      filters: selectedFilters,
      scan_date: new Date().toISOString().split('T')[0],
      enable_progress: true
    }),
  });
  // ... rest of streaming logic
}
```

**WITH THIS:**
```typescript
import { fastApiScanService } from '@/services/fastApiScanService';

const startScan = async () => {
  setIsScanning(true);
  setScanProgress(0);
  setScanResults([]);
  setScanStatusMessage('Starting scan...');
  setScanError('');

  try {
    // Create date string for today
    const today = new Date().toISOString().split('T')[0];
    
    // Use the FastAPI service with polling
    const response = await fastApiScanService.executeProjectScan(
      'LC Frontside D2/D3',
      { 
        start: today, 
        end: today 
      }
    );
    
    // Update state with results
    setScanResults(response.results || []);
    setScanProgress(100);
    setScanStatusMessage(
      `Scan completed! Found ${response.total_found || 0} qualifying tickers.`
    );
  } catch (error) {
    console.error('Scan error:', error);
    setScanError(
      error instanceof Error ? error.message : 'Scan failed with unknown error'
    );
    setScanProgress(0);
  } finally {
    setIsScanning(false);
  }
};
```

### Fix #2: Check Backend is Running

```bash
# Test backend health
curl http://localhost:8000/api/health

# Expected response:
# {"status":"healthy","timestamp":"...","active_scans":0,"version":"2.0.0","real_scan_available":true}
```

### Fix #3: Optional - Remove Local API Route

If using backend exclusively, delete:
- `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/api/systematic/scan/route.ts`

Or keep it as a fallback by making it proxy to backend.

## API Endpoints Reference

### Frontend Service (fastApiScanService.ts)
```typescript
// Basic execution (returns immediately with scan_id)
await fastApiScanService.executeScan({
  start_date: "2024-10-30",
  end_date: "2024-10-30",
  use_real_scan: true,
  filters: {...}
})
// Returns: { success, scan_id, message, results: [] }

// Convenience method (waits for completion)
await fastApiScanService.executeProjectScan('Gap Up Scanner', {
  start: "2024-10-30",
  end: "2024-10-30"
})
// Returns: { success, scan_id, message, results: [...] }

// Check status
await fastApiScanService.getScanStatus(scan_id)
// Returns: { scan_id, status, progress_percent, message, results?, error? }

// Get results
await fastApiScanService.getScanResults(scan_id)
// Returns: { results: [...] }
```

### Backend API (port 8000)
```
POST   /api/scan/execute
GET    /api/scan/status/{scan_id}
GET    /api/scan/results/{scan_id}
WebSocket /api/scan/progress/{scan_id}
GET    /api/health
GET    /api/performance
```

## Component Flow (Fixed)

```
User clicks "Run Scan"
    ↓
startScan() function triggered
    ↓
Call fastApiScanService.executeProjectScan()
    ↓
Backend executes real Python scanner
    ↓
Service polls /api/scan/status/{scan_id} every 2 seconds
    ↓
Frontend updates progress bar and message
    ↓
Scan completes or errors
    ↓
Display results or error message
```

## Key Differences: Local Route vs Backend

| Feature | Local Route | FastAPI Backend |
|---------|------------|-----------------|
| Real Python execution | ❌ No | ✅ Yes |
| Optimized (80%+ faster) | ❌ No | ✅ Yes |
| 12x API concurrency | ❌ 3x only | ✅ Yes |
| Dynamic date handling | ❌ Hardcoded 2024-02-23 | ✅ Yes |
| Production ready | ❌ No | ✅ Yes |
| API key exposed | ⚠️ Yes (security risk) | ✅ No |
| Ticker list | ❌ Hardcoded 80 | ✅ Dynamic |

## Debugging

### Check if backend is running
```bash
# Terminal
cd "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend"
python main.py
# Should see: "Uvicorn running on http://0.0.0.0:8000"
```

### Check frontend service health
```typescript
// In browser console
import { fastApiScanService } from '@/services/fastApiScanService';
const health = await fastApiScanService.checkHealth();
console.log(health); // Should be true
```

### Monitor scan progress
```bash
# Get scan status
curl http://localhost:8000/api/scan/status/scan_20241030_120000_abc12345

# Expected response:
# {
#   "scan_id": "scan_20241030_120000_abc12345",
#   "status": "running",
#   "progress_percent": 45,
#   "message": "Processing tickers...",
#   "results": null
# }
```

## Filter Mapping

Frontend sends:
```typescript
{
  lc_frontside_d2_extended: true,
  lc_frontside_d3_extended_1: true,
  min_gap: 0.5,
  min_pm_vol: 5000000,
  min_prev_close: 0.75
}
```

Backend expects (if using advanced filters):
```typescript
{
  lc_frontside_d2_extended: true,
  min_gap_atr: 0.5,
  min_volume: 10000000,
  scan_type: 'gap_up'
}
```

The service already maps this correctly in `getFiltersForProject()`.

## Common Errors

### Error: "Cannot reach localhost:8000"
**Cause:** Backend not running
**Fix:** 
```bash
cd /Users/michaeldurante/ai dev/ce-hub/edge-dev/backend
python main.py
```

### Error: "Scan timeout"
**Cause:** Scan taking longer than 5 minutes
**Fix:** Increase timeout in `fastApiScanService.ts` line 175

### Error: "No progress updates"
**Cause:** Streaming parsing error
**Fix:** Use polling instead (current code does this)

### Error: API returns 400
**Cause:** Invalid date format or filter validation
**Fix:** Check date format is "YYYY-MM-DD" and backend is running

## Files Modified by This Fix

1. `SystematicTrading.tsx` - Update startScan() function
2. Optional: Delete `src/app/api/systematic/scan/route.ts` if no longer needed

## Estimated Impact

- **Time to fix:** 30-45 minutes
- **Lines changed:** ~50-80 lines
- **Breaking changes:** None (existing API still works)
- **Performance improvement:** 80%+ faster scans
- **User experience:** No visible changes, just works better

## Next Steps (CopilotKit Integration)

After fixing the core issue:

1. Add CopilotKit provider to layout
2. Create scan action for Copilot
3. Share scan results as context
4. Allow Copilot to analyze results

Estimated additional time: 30 minutes

## References

- FastAPI Service: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/services/fastApiScanService.ts`
- Backend Main: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`
- Scanner Wrapper: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_wrapper.py`
- Real Scanner: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_scanner_optimized.py`

---

**Summary:** The fix is simple - just change SystematicTrading to use the existing `fastApiScanService` instead of the local API route. The entire backend infrastructure is already built and working correctly.
