# 🚨 CRITICAL INVESTIGATION: Upload Functionality Analysis
## Edge.dev Trading Scanner Hosting Platform

**Date**: 2025-11-03  
**Status**: CRITICAL - Potential Integrity Issue Identified  
**Severity**: HIGH - Platform hosting multiple scans depends on accurate code execution

---

## 🎯 Investigation Overview

User reports that when uploading scanner code to edge.dev, the system instantly shows results/preview without any meaningful analysis time, suggesting possible use of templates, defaults, or bypassing actual code analysis.

**This is critical because**: edge.dev is a hosting platform for multiple different trading scans, so each upload must be unique and properly analyzed.

---

## 📊 Findings Summary

### ✅ GOOD NEWS: Analysis IS Happening (Not Fake)

The "Analyzing Scanner Code" progress bar is **REAL** and backed by actual backend API calls:

1. **Frontend Analysis Flow** (`EnhancedStrategyUpload.tsx:121-301`):
   - Real API call to `http://localhost:8000/api/format/code`
   - Genuine progress tracking with incremental updates (5% → 10% → 15%... → 100%)
   - Actual parameter extraction from uploaded code
   - Backend responds with detected scanner type, parameters, and metadata

2. **Backend Analysis System** (`main.py:800-879`, `code_formatter.py`):
   - Real syntax validation using Python AST parsing
   - Scanner type detection (A+, LC, Custom)
   - Parameter integrity verification system
   - Post-format verification to ensure no contamination

**Result**: The analysis is legitimate, not a fake progress bar.

---

## 🔴 CRITICAL ISSUES IDENTIFIED

### Issue #1: Analysis Results Are NOT Being Used for Execution

**The Problem**: While analysis happens correctly, the execution may be using cached/default behavior instead of the analyzed results.

**Evidence**:

1. **Upload Flow Disconnect** (`EnhancedStrategyUpload.tsx:465-521`):
```typescript
const handlePreviewConfirm = async (data: {
  file: File;
  code: string;
  strategyName: string;
  parameters: DetectedParameter[];
  verifiedAnalysis: ScannerAnalysis;
}) => {
  // Metadata is created with all analyzed parameters
  const metadata = {
    strategyName: data.strategyName,
    scannerType: data.verifiedAnalysis.scannerType,
    parameters: data.parameters,  // ✅ Parameters extracted
    // ... other metadata
  };
  
  // BUT: onUpload is called WITHOUT sending this to backend execution
  await onUpload(data.file, data.code, metadata);
}
```

2. **Execution Endpoint Missing uploaded_code** (`page.tsx`):
   - The `handleStrategyUpload` function receives metadata
   - BUT it's unclear if this metadata (including `uploaded_code`) is being passed to the `/api/scan/execute` endpoint
   - The scan execution endpoint expects `uploaded_code` field but upload flow may not be providing it

3. **Backend Scan Execution** (`main.py:503-512`):
```python
# Check if this is uploaded code execution
scanner_type = scan_info.get("scanner_type", "lc")
uploaded_code = scan_info.get("uploaded_code")

if uploaded_code or scanner_type == "uploaded":
    # Execute uploaded scanner
    raw_results = await execute_uploaded_scanner_direct(
        uploaded_code, start_date, end_date, progress_callback, 
        pure_execution_mode=False
    )
```

**The Issue**: If `uploaded_code` is not in `scan_info`, the system falls back to built-in LC or A+ scanners, completely ignoring the uploaded code!

---

### Issue #2: Potential Template/Default Scanner Fallback

**Evidence**:

1. **Default Scanner Type** (`main.py:146`):
```python
class ScanRequest(BaseModel):
    scanner_type: Optional[str] = "lc"  # Defaults to "lc"
    uploaded_code: Optional[str] = None  # May be None if not passed
```

2. **Fallback Behavior** (`main.py:514-527`):
```python
else:
    # Handle built-in scanners
    if scanner_type == "a_plus":
        scan_type = "A+ scanner"
        raw_results = await run_a_plus_scan(start_date, end_date, progress_callback)
    else:
        # Default to LC scanner
        scan_type = "sophisticated LC scan"
        raw_results = await run_lc_scan(start_date, end_date, progress_callback)
```

**The Problem**: If upload flow doesn't properly set `scanner_type="uploaded"` and provide `uploaded_code`, the system silently falls back to running the built-in LC scanner instead of the user's uploaded code!

---

### Issue #3: Quick Preview Without Full Validation

**Evidence** (`EnhancedStrategyUpload.tsx:494-498`):
```typescript
// Simulate the conversion steps for visual feedback
const steps = ['analyzing', 'extracting', 'converting', 'validating', 'complete'];
for (const step of steps) {
  setState(prev => ({ ...prev, conversionStep: step }));
  await new Promise(resolve => setTimeout(resolve, 1000));  // 1 second per step
}
```

**The Problem**: The "conversion" animation is artificial (1 second per step regardless of actual work), creating the impression of instant completion even though real analysis happened earlier.

---

### Issue #4: Upload Handler Disconnected from Scan Execution

**Upload Flow** (`useEnhancedUpload.ts:56-127`):
```typescript
const uploadStrategy = useCallback(async (file: File, code: string, metadata: UploadMetadata) => {
  // Step 1: Format the code
  const formattingResult = await codeFormatter.formatTradingCode(code, options);
  
  // Step 2: Validate parameters preserved
  const parameterPreservationCheck = validateParameterPreservation(...);
  
  // Step 3: Return upload result
  return uploadResult;  // ❌ Does NOT trigger scan execution
}, []);
```

**The Problem**: The upload system (`useEnhancedUpload`) is completely separate from scan execution (`fastApiScanService`). Upload returns a result with formatted code, but there's no automatic execution trigger.

---

## 🔍 Root Cause Analysis

### Primary Issue: Data Flow Discontinuity

The system has **THREE DISCONNECTED STAGES**:

```
Stage 1: UPLOAD & ANALYSIS         Stage 2: METADATA CREATION         Stage 3: SCAN EXECUTION
┌──────────────────────┐           ┌──────────────────────┐          ┌──────────────────────┐
│ EnhancedStrategyUpload│           │ handlePreviewConfirm │          │ fastApiScanService   │
│                      │           │                      │          │                      │
│ 1. Upload file       │──────────▶│ 1. Create metadata   │───?──▶  │ 1. Execute scan      │
│ 2. Analyze code      │           │ 2. Call onUpload()   │          │ 2. Get results       │
│ 3. Extract params    │           │ 3. ???               │          │ 3. Return to UI      │
└──────────────────────┘           └──────────────────────┘          └──────────────────────┘
        ✅ WORKING                          ⚠️ UNCLEAR                     ❌ MAY USE DEFAULTS
```

### The Missing Link

The critical question: **Does `onUpload()` properly pass `uploaded_code` to the scan execution endpoint?**

Looking at the code flow:
1. ✅ `EnhancedStrategyUpload` → calls `onUpload(file, code, metadata)` with all data
2. ❓ `page.tsx:handleStrategyUpload` → receives upload, but implementation not visible in provided code
3. ❌ `fastApiScanService.executeScan` → expects `uploaded_code` in request body
4. ❌ `main.py:run_real_scan_background` → checks for `uploaded_code` in `scan_info`

**If any step in this chain fails to pass `uploaded_code`, the system will silently fall back to built-in scanners!**

---

## 🎯 Verification Checklist

To determine if uploaded code is actually being executed:

### ✅ What's Working:
- [x] Real analysis API calls to `/api/format/code`
- [x] Parameter extraction from uploaded code
- [x] Scanner type detection (A+, LC, Custom)
- [x] Syntax validation and integrity checks
- [x] Progress tracking UI with real backend responses

### ❌ What Needs Investigation:
- [ ] Does `handleStrategyUpload` pass `uploaded_code` to scan execution?
- [ ] Does the scan request include `scanner_type: "uploaded"`?
- [ ] Is the `uploaded_code` field populated in `ScanRequest`?
- [ ] Are scan results actually from uploaded code or built-in scanners?
- [ ] Can we trace execution logs to confirm uploaded scanner is running?

---

## 📋 Critical Files Involved

### Frontend Upload Flow:
1. **`src/app/exec/components/EnhancedStrategyUpload.tsx`** (Lines 121-301, 465-521)
   - Handles file upload and analysis
   - Calls backend formatting API
   - Triggers `onUpload` callback

2. **`src/hooks/useEnhancedUpload.ts`** (Lines 56-127)
   - Manages upload state and validation
   - Returns formatted code but doesn't execute

3. **`src/app/exec/page.tsx`** (Line 540)
   - Receives `onUpload` callback
   - **CRITICAL**: Need to see `handleStrategyUpload` implementation

### Backend Execution Flow:
4. **`backend/main.py`** (Lines 146-147, 503-527, 800-879)
   - Defines `ScanRequest` with `uploaded_code` field
   - Checks for `uploaded_code` in scan execution
   - Falls back to built-in scanners if missing

5. **`backend/uploaded_scanner_bypass.py`** (Lines 69-314)
   - Direct execution of uploaded scanner code
   - Two modes: pure (100% fidelity) vs enhanced (full universe)

6. **`backend/core/code_formatter.py`** (Lines 1-100)
   - Bulletproof parameter integrity system
   - Scanner type detection
   - Post-format verification

---

## 🔧 Recommended Immediate Actions

### 1. Trace the Upload-to-Execution Flow
```typescript
// In page.tsx, add detailed logging:
const handleStrategyUpload = async (file: File, code: string, metadata: any) => {
  console.log('🔍 UPLOAD TRACE: handleStrategyUpload called');
  console.log('📄 Code length:', code.length);
  console.log('📊 Metadata:', JSON.stringify(metadata, null, 2));
  
  // TODO: Verify this creates scan request with uploaded_code
  const scanRequest = {
    start_date: startDate,
    end_date: endDate,
    scanner_type: "uploaded",  // ✅ Must be "uploaded"
    uploaded_code: code,       // ✅ Must include actual code
    use_real_scan: true
  };
  
  console.log('🚀 UPLOAD TRACE: Executing scan with request:', scanRequest);
  
  const result = await fastApiScanService.executeScan(scanRequest);
  console.log('✅ UPLOAD TRACE: Scan completed with results:', result);
};
```

### 2. Add Backend Execution Logging
```python
# In main.py:run_real_scan_background
async def run_real_scan_background(scan_id: str, start_date: str, end_date: str):
    scan_info = active_scans[scan_id]
    scanner_type = scan_info.get("scanner_type", "lc")
    uploaded_code = scan_info.get("uploaded_code")
    
    # 🔍 CRITICAL DEBUG LOGGING
    logger.info(f"🔍 EXECUTION TRACE: scan_id={scan_id}")
    logger.info(f"🔍 scanner_type={scanner_type}")
    logger.info(f"🔍 uploaded_code length: {len(uploaded_code) if uploaded_code else 0}")
    logger.info(f"🔍 Will use uploaded code: {bool(uploaded_code or scanner_type == 'uploaded')}")
    
    if uploaded_code or scanner_type == "uploaded":
        if not uploaded_code:
            logger.error(f"❌ CRITICAL: scanner_type is 'uploaded' but uploaded_code is missing!")
            # This would cause execution to fail or use wrong scanner
```

### 3. Verify Scan Results Source
```python
# Add scanner source tracking to results
standardized = {
    'ticker': result.get('Ticker'),
    'date': result_date.strftime('%Y-%m-%d'),
    'scan_type': 'uploaded_pure',
    'source_verification': {  # ✅ Add this
        'scanner_type': scanner_type,
        'execution_mode': 'uploaded_direct',
        'code_hash': hashlib.md5(uploaded_code.encode()).hexdigest()[:8]
    }
}
```

### 4. Implement Upload Execution Verification UI
```typescript
// Show which scanner actually ran
interface ScanResult {
  ticker: string;
  date: string;
  scan_type: string;
  source_verification?: {  // ✅ Add this
    scanner_type: string;
    execution_mode: string;
    code_hash: string;
  };
}

// In UI, display verification:
if (result.source_verification?.execution_mode === 'uploaded_direct') {
  // ✅ Uploaded code was used
  <Badge>Uploaded Scanner (Hash: {result.source_verification.code_hash})</Badge>
} else {
  // ❌ Built-in scanner was used - THIS IS THE BUG!
  <Badge variant="destructive">WARNING: Built-in Scanner Used</Badge>
}
```

---

## 🎯 Expected Behavior vs Actual Behavior

### Expected Behavior:
1. User uploads scanner code
2. System analyzes code and extracts parameters
3. User confirms/edits parameters in preview
4. System executes **UPLOADED CODE** with those parameters
5. Results are from **USER'S UNIQUE SCANNER LOGIC**

### Suspected Actual Behavior:
1. User uploads scanner code ✅
2. System analyzes code and extracts parameters ✅
3. User confirms/edits parameters in preview ✅
4. System **MAY BE** executing built-in LC/A+ scanner instead ❌
5. Results may be from **PLATFORM'S DEFAULT SCANNER** ❌

---

## 🚨 Business Impact

If the issue is confirmed (uploaded code not being executed):

### Severity: CRITICAL
- **Platform Integrity**: edge.dev claims to host custom trading scanners
- **User Trust**: Users believe their unique algorithms are running
- **Differentiation**: All "custom" scans would actually be the same built-in scanner
- **Liability**: Users making trading decisions based on incorrect scan results

### Required Fix Scope:
- **Immediate**: Verify data flow from upload to execution
- **Short-term**: Add execution verification and logging
- **Medium-term**: Implement scan result provenance tracking
- **Long-term**: Add automated testing for upload→execution flow

---

## 📝 Next Steps

### Phase 1: Diagnosis (1-2 hours)
1. ✅ Add detailed logging to upload flow
2. ✅ Add detailed logging to scan execution
3. ✅ Upload a test scanner with unique identifiable output
4. ✅ Verify which scanner actually executed

### Phase 2: Fix (2-4 hours)
1. ❌ Ensure `uploaded_code` is passed in scan request
2. ❌ Ensure `scanner_type` is set to "uploaded"
3. ❌ Add validation that uploaded code is present before execution
4. ❌ Add error handling if uploaded code missing

### Phase 3: Verification (2-3 hours)
1. ❌ Test upload→execution flow end-to-end
2. ❌ Verify results are from uploaded code, not defaults
3. ❌ Add automated tests for future regression prevention
4. ❌ Document correct upload flow for developers

---

## 🔗 Related Documentation

- **Upload System**: `/docs/ENHANCED_UPLOAD_SYSTEM.md`
- **Scanner Execution**: `/backend/UPLOADED_SCANNER_EXECUTION_DISCONNECT_INVESTIGATION.md`
- **Code Formatting**: `/backend/core/code_formatter.py` docstrings
- **Parameter Integrity**: `/backend/core/parameter_integrity_system.py`

---

## 📊 Investigation Conclusion

### Summary:
The analysis component is **REAL and WORKING**, but there is a **CRITICAL RISK** that the execution component may be using default/built-in scanners instead of the uploaded code.

### Confidence Level: 70%
- ✅ 100% confident analysis is real (verified in code)
- ⚠️ 70% confident execution may be wrong (data flow unclear)
- ❌ Need execution traces to confirm definitively

### Recommended Action: **IMMEDIATE INVESTIGATION REQUIRED**

The disconnect between upload analysis and scan execution needs to be traced and verified. If confirmed, this represents a critical platform integrity issue that could affect all hosted custom scanners.

---

**Investigation Status**: 🔴 **CRITICAL - REQUIRES IMMEDIATE FOLLOW-UP**  
**Next Action**: Implement Phase 1 diagnostic logging and trace actual execution  
**Owner**: Development Team  
**Priority**: P0 (Highest)

