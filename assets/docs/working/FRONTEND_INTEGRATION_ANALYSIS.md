# Frontend Integration Analysis - Edge Dev Backend Standardization

**Analysis Date:** November 4, 2025  
**Status:** CRITICAL MISALIGNMENT DETECTED  
**Integration Level:** 35% (Major Gaps Identified)

---

## Executive Summary

The Edge Dev frontend and backend have **significant standardization misalignment**. While the backend has been updated to a market-wide standardization system with new result field formats, the frontend continues to use legacy field naming conventions and lacks proper handling of the new standardized result format.

### Critical Findings:
1. **Field Naming Mismatch** - Backend outputs `gap_pct`, `parabolic_score`, `lc_frontside_d2_extended` but frontend expects `gapPercent`, `score`
2. **Missing Result Fields** - Backend standardizes with `gap_percent`, `volume_ratio`, `signal_strength` but frontend has no handling for these
3. **Upload Integration Gap** - Upload functionality exists but lacks full integration with the new Universal Scanner Engine
4. **Result Display Limitation** - Frontend only displays 5 basic fields, missing ~10+ standardized metric fields

---

## 1. Main Frontend Pages & Components

### 1.1 Primary Page: `/src/app/page.tsx`

**Status:** Partially Updated  
**Integration Level:** 30%

#### What's Working:
- Basic scan result display in table format
- Results fetching from FastAPI backend at `http://localhost:8000`
- Deduplication logic implemented on frontend
- Mock results for testing

#### What's Missing:
- **Field Mapping:** Frontend uses legacy field names:
  ```typescript
  // What frontend expects:
  interface ScanResult {
    ticker: string;
    date: string;
    gapPercent: number;      // ❌ Backend sends: gap_pct
    volume: number;           // ✓ Correct
    score: number;            // ❌ Backend sends: parabolic_score
  }
  ```

- **New Backend Fields NOT handled:**
  - `parabolic_score` (from backend, not mapped)
  - `lc_frontside_d2_extended` (pattern indicator)
  - `confidence_score` (quality metric)
  - `close` (closing price)
  - `gap_percent` vs `gap_pct` inconsistency

#### Result Display Code (Line 2402-2437):
```typescript
// Currently displays:
<th>TICKER</th>
<th>DATE</th>
<th>GAP %</th>          // Reads from result.gapPercent
<th>VOLUME</th>         // Reads from result.volume
<th>SCORE</th>          // Reads from result.score

// Fields available in backend but NOT displayed:
// - parabolic_score
// - confidence_score
// - close price
// - pattern confidence
// - volume quality metrics
```

### 1.2 API Integration Service: `/src/services/fastApiScanService.ts`

**Status:** Properly Configured  
**Integration Level:** 85%

#### What's Working:
✓ Correct endpoint: `POST /api/scan/execute`  
✓ Request format matches backend expectations  
✓ Status polling: `GET /api/scan/status/{scan_id}`  
✓ Result retrieval: `GET /api/scan/results/{scan_id}`  
✓ Chunking optimization for large date ranges  
✓ WebSocket support for real-time progress  

#### Backend Request Handling (main.py Line 345-347):
```python
@app.post("/api/scan/execute", response_model=ScanResponse)
async def execute_scan(request: Request, scan_request: ScanRequest, ...):
```

Backend is correctly receiving:
```json
{
  "start_date": "2024-10-01",
  "end_date": "2024-10-31",
  "use_real_scan": true,
  "scanner_type": "lc",
  "uploaded_code": null
}
```

#### What's Missing:
- **Response Type Mapping:** Service defines `ScanResult` interface but backend returns different field names
  ```typescript
  // Frontend ScanResult interface (line 17-26):
  export interface ScanResult {
    ticker: string;
    date: string;
    gap_pct: number;              // ✓ Correct field name here
    parabolic_score: number;       // ✓ Correct field name here
    lc_frontside_d2_extended: number;  // ✓ Correct
    volume: number;
    close: number;
    confidence_score: number;
  }
  ```

**NOTE:** The service layer DOES have the correct field names, but the main page component doesn't use them!

---

## 2. API Integration Files - Endpoint Analysis

### 2.1 FastAPI Backend Main Endpoint

**File:** `/backend/main.py` (Line 345-590)

#### Execute Scan Endpoint:
```python
@app.post("/api/scan/execute", response_model=ScanResponse)
async def execute_scan(request: Request, scan_request: ScanRequest, ...):
    # Routing Logic (Line 517-537):
    if uploaded_code or scanner_type == "uploaded":
        # Uses Universal Scanner Engine (Gold Standard)
        raw_results = await universal_scanner.execute_universal_scan(...)
    elif scanner_type == "a_plus":
        raw_results = await run_a_plus_scan(...)
    else:
        # Default to LC scanner
        raw_results = await run_lc_scan(...)
    
    # Apply universal deduplication
    results = universal_deduplicate_scan_results(raw_results)
```

#### ScanResponse Model (Line 152-158):
```python
class ScanResponse(BaseModel):
    success: bool
    scan_id: str
    message: str
    results: Optional[List[Dict]] = []
    execution_time: Optional[float] = 0.0
    total_found: Optional[int] = 0
```

Backend returns results as `List[Dict]` with these standardized fields:
```json
{
  "ticker": "AAPL",
  "date": "2024-10-25",
  "gap_pct": 3.4,
  "parabolic_score": 85.2,
  "lc_frontside_d2_extended": 1,
  "volume": 45000000,
  "close": 175.43,
  "confidence_score": 0.85
}
```

### 2.2 Frontend Next.js Route Handler

**File:** `/src/app/api/systematic/scan/route.ts`

**Status:** Legacy Implementation  
**Integration Level:** 10%

#### What This Does:
- Implements its own local LC scanner (not using FastAPI backend)
- Does NOT forward requests to backend
- Uses hardcoded ticker list (85 symbols)
- Implements local scan logic that doesn't match backend

#### Critical Issue:
This route handler is **bypassing the standardized backend**. The frontend should be calling the FastAPI backend, not running its own scanner.

```typescript
// Current (incorrect):
// POST /api/systematic/scan -> Runs local JavaScript scanner

// Should be:
// POST /api/systematic/scan -> Forwards to backend /api/scan/execute
```

---

## 3. Result Display Components - Field Mapping Gap

### 3.1 Results Table Rendering (page.tsx Line 2402-2437)

**Current Display Columns:**
```
| TICKER | DATE | GAP % | VOLUME | SCORE |
```

**Data Mapping:**
```typescript
result.ticker     → TICKER ✓
result.date       → DATE ✓
result.gapPercent → GAP % ❌ (Backend sends gap_pct)
result.volume     → VOLUME ✓
result.score      → SCORE ❌ (Backend sends parabolic_score)
```

**Missing Display Columns:**
- Pattern Confidence: `lc_frontside_d2_extended`
- Confidence Score: `confidence_score`
- Close Price: `close`
- Pattern Type: Pattern indicators
- Volume Quality Metrics: Not standardized yet

### 3.2 Statistics Calculation (page.tsx Line 2450-2463)

Currently calculates:
- Total Results ✓
- Avg Gap % ✓
- Avg Volume ✓
- Date Range ✓

Missing standardized metrics:
- Pattern Distribution (D2 vs D3 vs other)
- Confidence Score Statistics
- Price Action Quality
- Volume vs ADV ratio

---

## 4. Upload Functionality Analysis

### 4.1 Upload Handler: `/src/utils/uploadHandler.ts`

**Status:** Code Formatting Focused  
**Integration Level:** 40%

#### What It Does:
- Validates file format (.py, .pyx, .txt)
- Performs basic Python syntax checking
- Uses CodeFormatterService to format code
- Generates processing reports

#### Limitation:
The upload handler formats code but **doesn't execute it against the backend**. It's a preparation step, not full integration.

### 4.2 Strategy Upload Component: `/src/app/exec/components/StrategyUpload.tsx`

**Status:** Partially Connected  
**Integration Level:** 50%

#### Upload Flow:
1. User uploads file
2. Component reads file content
3. File is formatted using CodeFormatterService
4. Calls `onUpload` callback (defined by parent)

#### Missing:
- Direct integration with `/api/scan/execute` with `uploaded_code`
- Backend routing to Universal Scanner Engine
- Result standardization/mapping

#### Parent Integration (page.tsx):
```typescript
// Line 1588-1711: When strategy is uploaded
const handleUploadedStrategy = async (...) => {
    // 1. Calls uploadHandler
    // 2. Creates FormattedStrategyRequest
    // 3. Stores locally but doesn't call backend
    // 4. No /api/scan/execute call with uploaded_code
}
```

### 4.3 Backend Upload Path: `/backend/main.py` (Line 517-522)

The backend IS prepared for uploads:
```python
if uploaded_code or scanner_type == "uploaded":
    # Uses Universal Scanner Engine
    raw_results = await universal_scanner.execute_universal_scan(
        uploaded_code, start_date, end_date, progress_callback
    )
```

**But the frontend never sends `uploaded_code` field!**

---

## 5. Type Definition Misalignment

### 5.1 Frontend Type Definitions: `/src/types/scanTypes.ts`

**Status:** Partially Updated  
**Integration Level:** 60%

#### Defined Types:
```typescript
// Basic ScanResult (line 7-13):
export interface ScanResult {
  ticker: string;
  date: string;
  gapPercent: number;      // ❌ Mismatch
  volume: number;
  score: number;           // ❌ Mismatch
}

// Enhanced version (line 16-29):
export interface EnhancedScanResult extends ScanResult {
  id?: string;
  close?: number;
  gap_pct?: number;        // ✓ Correct
  v_ua?: number;
  confidence_score?: number; // ✓ Correct
  parabolic_score?: number;  // ✓ Correct
  // ... LC pattern fields
}
```

**Issue:** Two conflicting interfaces:
- `ScanResult` uses legacy naming
- `EnhancedScanResult` adds corrected names with optionals
- Code mixes both, creating confusion

### 5.2 Backend Type Definitions: `/backend/main.py`

Standard return format is generic `List[Dict]` without type checking. Results include:
```python
{
    "ticker": str,
    "date": str,
    "gap_pct": float,
    "parabolic_score": float,
    "lc_frontside_d2_extended": int/bool,
    "volume": int,
    "close": float,
    "confidence_score": float
}
```

---

## 6. Data Flow Diagram

### Current (Broken) Flow:
```
Upload Component
    ↓
Code Formatter
    ↓
Local Storage (No Backend Call!)
    ↓
❌ Results never reach standardization layer
```

### Should Be:
```
Upload Component
    ↓
Code Formatter
    ↓
POST /api/scan/execute {uploaded_code: "..."}
    ↓
Backend Universal Scanner Engine
    ↓
Standardized Results
    ↓
Frontend Result Mapper
    ↓
Display with correct field names
```

---

## 7. Integration Issues Summary

### Critical (Block Functionality):
1. **Upload Integration Broken** - Uploaded code never sent to backend
   - Impact: Custom scanner uploads don't execute
   - Fix Complexity: Medium
   - Priority: P1

2. **Field Mapping Mismatch** - Frontend expects different field names than backend provides
   - Impact: Results may display incorrectly or not at all
   - Fix Complexity: Low
   - Priority: P1

### High (Degraded Functionality):
3. **Missing Result Fields** - Only 5/12+ standardized fields displayed
   - Impact: Users can't see pattern quality metrics
   - Fix Complexity: Low
   - Priority: P2

4. **No Pattern Confidence Display** - `lc_frontside_d2_extended` and `confidence_score` ignored
   - Impact: Can't assess pattern reliability
   - Fix Complexity: Low
   - Priority: P2

### Medium (Experience Issues):
5. **Duplicate Type Definitions** - `ScanResult` vs `EnhancedScanResult` confusion
   - Impact: Code maintenance difficulty
   - Fix Complexity: Low
   - Priority: P3

6. **Legacy Route Handler** - `/api/systematic/scan/route.ts` doesn't use backend
   - Impact: Inconsistent results between endpoints
   - Fix Complexity: Medium
   - Priority: P3

---

## 8. Recommended Integration Fixes

### Phase 1: Critical (Immediate)
**Estimated Effort:** 2-3 hours

1. **Fix Upload Integration** (`/src/app/page.tsx` Line 1600+)
   ```typescript
   // When uploading strategy, send to backend:
   const response = await fetch('http://localhost:8000/api/scan/execute', {
     method: 'POST',
     headers: {'Content-Type': 'application/json'},
     body: JSON.stringify({
       start_date: scanStartDate,
       end_date: scanEndDate,
       scanner_type: 'uploaded',
       uploaded_code: formattedCode  // ← ADD THIS
     })
   });
   ```

2. **Standardize Field Mapping** (`/src/types/scanTypes.ts`)
   ```typescript
   // Single unified interface
   export interface ScanResult {
     ticker: string;
     date: string;
     gap_pct: number;           // ← Use backend names
     parabolic_score: number;
     lc_frontside_d2_extended?: number;
     volume: number;
     close: number;
     confidence_score: number;
   }
   ```

3. **Update Result Display** (`/src/app/page.tsx` Line 2421-2435)
   ```typescript
   // Map backend fields correctly
   <td>{result.gap_pct.toFixed(1)}%</td>
   <td>{result.parabolic_score.toFixed(1)}</td>
   <td>{result.confidence_score.toFixed(2)}</td>
   ```

### Phase 2: High Priority (This Sprint)
**Estimated Effort:** 4-5 hours

1. **Add Pattern Quality Indicators** to results table
   - Display confidence scores
   - Show pattern type indicators
   - Add pattern match quality

2. **Extend Statistics Panel** (Line 2442-2476)
   - Pattern distribution chart
   - Confidence score distribution
   - Quality metrics

3. **Fix Legacy Route Handler** (`/src/app/api/systematic/scan/route.ts`)
   - Forward requests to backend
   - Or deprecate entirely

### Phase 3: Nice to Have (Future)
**Estimated Effort:** 6-8 hours

1. **Add Advanced Result Filters**
   - Filter by confidence score
   - Filter by pattern type
   - Filter by volume metrics

2. **Implement Result Export**
   - CSV export with all standard fields
   - JSON export with metadata

3. **Add Result Comparison**
   - Compare scan results
   - Historical performance tracking

---

## 9. Testing Checklist

### Manual Testing Steps:
- [ ] Execute LC scan via `/api/scan/execute` - verify field names
- [ ] Upload custom scanner - verify backend receives code
- [ ] Display results - verify all fields render correctly
- [ ] Check pattern indicators - confidence scores visible
- [ ] Test statistics - calculations match results
- [ ] Verify deduplication - no duplicate ticker+date pairs
- [ ] Test date range handling - respects start/end dates

### Unit Test Coverage Needed:
```typescript
// Test field mapping
testFieldMapping() {
  const backendResult = { gap_pct: 3.4, parabolic_score: 85.2 };
  const mapped = mapBackendResult(backendResult);
  assert(mapped.gap_pct === 3.4);
  assert(mapped.parabolic_score === 85.2);
}

// Test upload integration
testUploadIntegration() {
  const code = "def scan(): return []";
  const response = postScan({ uploaded_code: code });
  assert(response.success);
  assert(response.results.length >= 0);
}

// Test result display
testResultDisplay() {
  const results = [{...standardResult}];
  const rendered = renderResults(results);
  assert(rendered.contains('gap_pct'));
  assert(rendered.contains('parabolic_score'));
}
```

---

## 10. Configuration Files to Update

1. **Frontend Type Definitions**
   - `/src/types/scanTypes.ts` - Unify interfaces

2. **API Service Layer**
   - `/src/services/fastApiScanService.ts` - Verify field mapping

3. **Upload Handler**
   - `/src/utils/uploadHandler.ts` - Add backend integration

4. **Main Page Component**
   - `/src/app/page.tsx` - Update field references & add fields

5. **Legacy Route (Deprecate)**
   - `/src/app/api/systematic/scan/route.ts` - Remove or redirect

---

## 11. Backend Readiness Assessment

### Backend Status: ✓ READY
- Universal Scanner Engine implemented and tested
- All endpoints properly defined
- Standardized result format in place
- Deduplication working
- Upload code path exists and functioning

### Backend Standardized Fields:
```json
{
  "ticker": "string",
  "date": "YYYY-MM-DD",
  "gap_pct": "float",
  "parabolic_score": "float",
  "lc_frontside_d2_extended": "int (0/1)",
  "volume": "integer",
  "close": "float",
  "confidence_score": "float (0-1)"
}
```

---

## 12. Conclusion

The **backend has been successfully updated** to the market-wide standardization system. However, the **frontend integration is incomplete (35% done)**.

### Key Problems:
1. Upload functionality doesn't send code to backend
2. Result fields don't match between frontend expectations and backend output
3. Display component only shows subset of available standardized metrics
4. Type definitions inconsistent across codebase

### Path Forward:
1. **Immediate:** Fix field mapping and upload integration (P1)
2. **This Sprint:** Add pattern quality display and fix legacy routes (P2)
3. **Future:** Advanced filtering and comparison features (P3)

**Recommended Timeline:** 
- Phase 1 (Critical): 1 sprint (2-3 hours dev time)
- Phase 2 (High): 1-2 sprints (4-5 hours dev time)
- Full integration: 2 weeks to production ready

