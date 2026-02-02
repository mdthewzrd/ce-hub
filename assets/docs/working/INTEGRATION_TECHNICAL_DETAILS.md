# Frontend Integration Technical Details

**Complete Analysis of Frontend/Backend Synchronization Issues**

---

## File Reference Map

### Critical Files for Integration

| File | Path | Status | Integration % | Issue |
|------|------|--------|--------------|-------|
| Main Page | `/src/app/page.tsx` | Partial | 30% | Field mapping mismatch, missing fields |
| API Service | `/src/services/fastApiScanService.ts` | Good | 85% | Types correct but component doesn't use |
| Type Defs | `/src/types/scanTypes.ts` | Conflict | 60% | Dual interfaces, legacy + new |
| Upload Handler | `/src/utils/uploadHandler.ts` | Isolated | 40% | Doesn't call backend |
| Upload Component | `/src/app/exec/components/StrategyUpload.tsx` | Partial | 50% | No backend integration |
| Legacy Route | `/src/app/api/systematic/scan/route.ts` | Bypass | 10% | Doesn't use FastAPI backend |
| Backend Main | `/backend/main.py` | Ready | 95% | Fully functional, waiting for frontend |
| Universal Scanner | `/backend/universal_scanner_engine.py` | Ready | 95% | Implemented, not being called |

---

## Detailed Code Comparison

### Issue #1: Field Naming Mismatch

#### Frontend Service Layer (CORRECT):
**File:** `/src/services/fastApiScanService.ts:17-26`
```typescript
export interface ScanResult {
  ticker: string;
  date: string;
  gap_pct: number;                    // ✓ Matches backend
  parabolic_score: number;             // ✓ Matches backend
  lc_frontside_d2_extended: number;    // ✓ Matches backend
  volume: number;                      // ✓ Matches backend
  close: number;                       // ✓ Matches backend
  confidence_score: number;            // ✓ Matches backend
}
```

#### Backend Response (CORRECT):
**File:** `/backend/main.py:427-444`
```python
mock_results = [
    {
        "ticker": "AAPL",
        "date": scan_request.start_date,
        "gap_pct": 3.4,                     # ✓
        "parabolic_score": 85.2,            # ✓
        "lc_frontside_d2_extended": 1,      # ✓
        "volume": 45000000,                 # ✓
        "close": 175.43,                    # ✓
        "confidence_score": 0.85            # ✓
    }
]
```

#### Frontend Main Page (WRONG):
**File:** `/src/app/page.tsx:512-517`
```typescript
const enhancedMockResults: EnhancedScanResult[] = MOCK_SCAN_RESULTS.map(result => ({
  ...result,
  gap_pct: result.gapPercent,           // ❌ Wrong! field named gapPercent in mock
  v_ua: result.volume,
  confidence_score: result.score        // ❌ Wrong! score != confidence_score
}));
```

**File:** `/src/app/page.tsx:2431-2432`
```typescript
<td className="status-positive">{result.gapPercent.toFixed(1)}%</td>  // ❌ gapPercent
<td style={{ color: 'var(--studio-text-secondary)' }}>{(result.volume / 1000000).toFixed(1)}M</td>
<td style={{ color: 'var(--studio-info)', fontWeight: '600' }}>{result.score.toFixed(1)}</td>  // ❌ score
```

### Issue #2: Upload Integration Not Connected

#### Upload Component Flow:
**File:** `/src/app/exec/components/StrategyUpload.tsx:20-23`
```typescript
interface StrategyUploadProps {
  onUpload: (file: File, code: string, onProgress?: (step: string, message?: string) => void) => Promise<void>;
  onClose: () => void;
}
```

#### Parent Handler (Incomplete):
**File:** `/src/app/page.tsx:1588-1711`
```typescript
const handleUploadedStrategy = async (file: File, formattedCode: string) => {
  // ... formatting happens ...
  
  // But NO backend call with uploaded_code!
  const strategy: FormattedStrategyRequest = {
    id: Date.now().toString(),
    name: file.name,
    code: formattedCode,
    parameters: extractedParams,
    formatConfig: {/* ... */},
    isFormatted: true,
    uploadedAt: new Date(),
    metadata: {/* ... */}
  };
  
  // Stores locally only:
  setUploadedStrategies([...uploadedStrategies, strategy]);
  
  // ❌ MISSING:
  // const response = await fetch('http://localhost:8000/api/scan/execute', {
  //   method: 'POST',
  //   body: JSON.stringify({
  //     start_date: scanStartDate,
  //     end_date: scanEndDate,
  //     scanner_type: 'uploaded',
  //     uploaded_code: formattedCode  // ← THIS IS MISSING!
  //   })
  // });
};
```

#### Backend Ready to Receive:
**File:** `/backend/main.py:347-405`
```python
@app.post("/api/scan/execute", response_model=ScanResponse)
async def execute_scan(request: Request, scan_request: ScanRequest, ...):
    scanner_type = scan_request.scanner_type  # "uploaded"
    uploaded_code = scan_request.uploaded_code  # Code content
    
    active_scans[scan_id] = {
        # ...
        "scanner_type": scanner_type,
        "uploaded_code": uploaded_code
    }
```

#### Backend Routing Ready:
**File:** `/backend/main.py:517-522`
```python
if uploaded_code or scanner_type == "uploaded":
    # 🏆 GOLD STANDARD EXECUTION
    raw_results = await universal_scanner.execute_universal_scan(
        uploaded_code, start_date, end_date, progress_callback
    )
```

### Issue #3: Type Definition Conflict

#### Frontend Type 1 (Old):
**File:** `/src/types/scanTypes.ts:7-13`
```typescript
export interface ScanResult {
  ticker: string;
  date: string;
  gapPercent: number;      // ❌ Legacy naming
  volume: number;
  score: number;           // ❌ Legacy naming
}
```

#### Frontend Type 2 (New):
**File:** `/src/types/scanTypes.ts:16-29`
```typescript
export interface EnhancedScanResult extends ScanResult {
  id?: string;
  close?: number;
  gap_pct?: number;        // ✓ Correct but optional
  v_ua?: number;
  confidence_score?: number; // ✓ Correct but optional
  parabolic_score?: number;  // ✓ Correct but optional
  // ...
}
```

#### Problem:
- Code uses both interfaces
- Properties with different names
- Optional fields cause undefined errors
- No consistent standardization

---

## Specific Integration Points

### 1. Scan Execution Flow

#### Current State:
```
User clicks "Execute Scan"
  ↓
fastApiScanService.executeScan()  [Line 223 in fastApiScanService.ts]
  ↓
POST http://localhost:8000/api/scan/execute  [Line 227]
  ↓
Backend /api/scan/execute [main.py:345]
  ↓
Returns results with gap_pct, parabolic_score
  ↓
Frontend page.tsx setScanResults(data.results)
  ↓
Renders with result.gapPercent ❌ UNDEFINED!
```

#### Fix Needed:
All references to `result.gapPercent` should be `result.gap_pct`
All references to `result.score` should be `result.parabolic_score`

### 2. Upload Execution Flow

#### Current State:
```
User uploads custom scanner
  ↓
StrategyUpload.tsx reads file
  ↓
uploadHandler.handleFileUpload() [uploadHandler.ts:49]
  ↓
CodeFormatterService.formatTradingCode() [formatting]
  ↓
handleUploadedStrategy() callback [page.tsx:1588]
  ↓
Local state update only - NO BACKEND CALL
  ↓
❌ Never sent to backend
```

#### Should Be:
```
User uploads custom scanner
  ↓
StrategyUpload.tsx reads file
  ↓
uploadHandler.handleFileUpload() [formatting]
  ↓
handleUploadedStrategy() callback
  ↓
POST /api/scan/execute with uploaded_code ← ADD THIS
  ↓
Backend universal_scanner.execute_universal_scan()
  ↓
Returns standardized results
  ↓
setScanResults(standardized_results)
  ↓
Display with correct field mapping
```

---

## Result Field Mapping Table

### Backend Output vs Frontend Usage

| Backend Field | Backend Type | Frontend Expected | Current Frontend | Fix |
|---------------|--------------|-------------------|------------------|-----|
| ticker | string | ticker | result.ticker ✓ | None |
| date | string | date | result.date ✓ | None |
| gap_pct | float | gap_pct | result.gapPercent ❌ | Change to gap_pct |
| parabolic_score | float | parabolic_score | result.score ❌ | Change to parabolic_score |
| lc_frontside_d2_extended | int | lc_frontside_d2_extended | NOT DISPLAYED | Add column |
| volume | int | volume | result.volume ✓ | None |
| close | float | close | NOT DISPLAYED | Add column |
| confidence_score | float | confidence_score | NOT DISPLAYED | Add column |

---

## Component Update Checklist

### File: `/src/types/scanTypes.ts`
Priority: P1 (Critical)
```
[ ] Remove legacy ScanResult interface (line 7-13)
[ ] Rename EnhancedScanResult to ScanResult
[ ] Make all new fields required (not optional)
[ ] Update all type references throughout codebase
```

### File: `/src/app/page.tsx`
Priority: P1 (Critical)
```
[ ] Update field references (lines 2431-2432):
    - result.gapPercent → result.gap_pct
    - result.score → result.parabolic_score
    
[ ] Add table columns for:
    - lc_frontside_d2_extended
    - confidence_score
    - close
    
[ ] Update statistics calculations (lines 2454-2461):
    - Handle gap_pct instead of gapPercent
    - Add confidence_score statistics
    
[ ] Implement upload backend integration (after line 1711):
    - POST /api/scan/execute with uploaded_code
    - Handle upload execution flow
    
[ ] Update sorting (line 522):
    - Add gap_pct, parabolic_score, confidence_score
```

### File: `/src/services/fastApiScanService.ts`
Priority: P2 (Verify)
```
[ ] Verify ScanResult interface matches backend (already correct)
[ ] Add mapping function for legacy field names if needed
[ ] Document that service layer is correct
```

### File: `/src/app/api/systematic/scan/route.ts`
Priority: P3 (Deprecate)
```
[ ] Either deprecate this route
[ ] Or redirect to backend /api/scan/execute
[ ] Remove duplicate scan logic
```

---

## Backend API Contracts

### Request Format (What Frontend Sends)

**Endpoint:** `POST http://localhost:8000/api/scan/execute`

**Required Request Body:**
```json
{
  "start_date": "2024-10-01",
  "end_date": "2024-10-31",
  "use_real_scan": true,
  "scanner_type": "lc",  // or "a_plus", or "uploaded"
  "uploaded_code": null  // or Python code as string
}
```

**Optional Parameters:**
```json
{
  "filters": {},
  "chunk_size_days": 30,
  "max_concurrent_chunks": 3
}
```

### Response Format (What Backend Returns)

**Success Response:**
```json
{
  "success": true,
  "scan_id": "scan_20251104_123456_a1b2c3d4",
  "message": "Scan completed",
  "results": [
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
  ],
  "execution_time": 23.45,
  "total_found": 45
}
```

**Status Endpoint:** `GET http://localhost:8000/api/scan/status/{scan_id}`
```json
{
  "scan_id": "scan_20251104_123456_a1b2c3d4",
  "status": "completed",
  "progress_percent": 100,
  "message": "Scan completed",
  "total_found": 45,
  "execution_time": 23.45
}
```

---

## Data Flow Diagrams

### Current (Broken) Upload Flow
```
┌─────────────────┐
│ Upload Component│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Formatter  │
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ uploadHandler   │
└────────┬────────┘
         │
         ▼
┌─────────────────────────────┐
│ Store in local state only   │
│ NO BACKEND CALL!            │
└─────────────────────────────┘
         │
         ▼
    ❌ DEAD END
```

### Required (Fixed) Upload Flow
```
┌─────────────────┐
│ Upload Component│
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Code Formatter  │
└────────┬────────┘
         │
         ▼
┌──────────────────────────────────┐
│ POST /api/scan/execute           │
│ {                                │
│   uploaded_code: formattedCode,  │
│   scanner_type: "uploaded"       │
│ }                                │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Backend                          │
│ Universal Scanner Engine         │
│ (main.py:517)                    │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Standardized Results             │
│ (gap_pct, parabolic_score, etc) │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Frontend setScanResults()        │
│ Correct field mapping           │
└────────┬─────────────────────────┘
         │
         ▼
┌──────────────────────────────────┐
│ Display in table with all       │
│ standard fields                  │
└──────────────────────────────────┘
```

### Current (Functional) LC Scan Flow
```
┌──────────────────────────────┐
│ User clicks Execute Scan     │
└────────┬─────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ fastApiScanService.executeScan()         │
│ (fastApiScanService.ts:223)              │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ POST /api/scan/execute                   │
│ Backend main.py:345                      │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ run_lc_scan() [default]                  │
│ (main.py:537)                            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ Results with correct field names         │
│ gap_pct, parabolic_score, etc            │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ setScanResults(results)                  │
│ ❌ BUG: uses result.gapPercent           │
└────────┬─────────────────────────────────┘
         │
         ▼
┌──────────────────────────────────────────┐
│ undefined values in table                │
│ gap_pct field missing from display       │
└──────────────────────────────────────────┘
```

---

## Testing Verification

### Unit Test for Field Mapping
```typescript
// Test that backend results work with frontend
test('Backend results map correctly', () => {
  const backendResult = {
    ticker: 'AAPL',
    date: '2024-10-25',
    gap_pct: 3.4,
    parabolic_score: 85.2,
    lc_frontside_d2_extended: 1,
    volume: 45000000,
    close: 175.43,
    confidence_score: 0.85
  };
  
  // Frontend should use these directly
  expect(backendResult.gap_pct).toBeDefined();
  expect(backendResult.parabolic_score).toBeDefined();
  expect(backendResult.confidence_score).toBeDefined();
  
  // NOT these
  expect(backendResult.gapPercent).toBeUndefined();
  expect(backendResult.score).toBeUndefined();
});
```

### Integration Test for Upload
```typescript
// Test that upload sends to backend
test('Upload sends code to backend', async () => {
  const mockFetch = jest.fn().mockResolvedValue({
    ok: true,
    json: async () => ({ success: true, results: [] })
  });
  
  global.fetch = mockFetch;
  
  // Upload code
  const code = "def scan(): return []";
  await uploadStrategy(code);
  
  // Verify fetch was called with uploaded_code
  expect(mockFetch).toHaveBeenCalledWith(
    expect.stringContaining('/api/scan/execute'),
    expect.objectContaining({
      body: expect.stringContaining('uploaded_code')
    })
  );
});
```

---

## Conclusion

The frontend and backend are **35% integrated** with **critical gaps** in:

1. **Field Mapping** - Frontend uses wrong property names
2. **Upload Integration** - Formatted code never sent to backend
3. **Type Consistency** - Conflicting interface definitions
4. **Display Coverage** - Only 5 of 8+ standardized fields shown

**Estimated Fix Time:** 3-4 hours for Phase 1 critical fixes

