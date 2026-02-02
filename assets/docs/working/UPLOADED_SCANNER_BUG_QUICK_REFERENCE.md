# Uploaded Scanner Bug - Quick Reference

## Critical File Locations

### Formatting Pipeline (WORKS)
- `/edge-dev/backend/main.py` (Line 760-834)
  - `@app.post("/api/format/code")` endpoint

- `/edge-dev/backend/core/code_formatter.py`
  - `BulletproofCodeFormatter` class
  - `format_code_with_integrity()` method

- `/edge-dev/backend/core/parameter_integrity_system.py`
  - `ParameterIntegrityVerifier` class
  - `extract_original_signature()` method (10+ parameter patterns)

- `/edge-dev/backend/core/code_preservation_engine.py`
  - `CodePreservationEngine` class
  - `preserve_original_code()` method

### Execution Pipeline (BROKEN)
- `/edge-dev/backend/main.py` (Line 333-456)
  - `@app.post("/api/scan/execute")` - LC ONLY
  - Uses hardcoded `run_lc_scan()`
  
- `/edge-dev/backend/main.py` (Line 900-1007)
  - `@app.post("/api/scan/execute/a-plus")` - A+ ONLY
  - Uses hardcoded `run_enhanced_a_plus_scan()`

- **MISSING**: No endpoint for uploaded code execution

---

## Root Cause Chain

### Step 1: User Uploads Code
```
frontend → POST /api/format/code → Receives: formatted_code + metadata
```

### Step 2: Code Gets Formatted Successfully
```python
# /edge-dev/backend/core/code_formatter.py:52-156
result = bulletproof_formatter.format_code_with_integrity(original_code)
# Returns: FormattingResult with formatted_code, scanner_type, parameters
```

### Step 3: System Never Executes Formatted Code
```python
# /edge-dev/backend/main.py:333-456 (LC Endpoint)
@app.post("/api/scan/execute")
async def execute_scan(request, scan_request):
    # ❌ No parameter for uploaded_code
    # ❌ No check for formatted code
    results = await run_lc_scan(...)  # ← Always uses built-in LC
```

```python
# /edge-dev/backend/main.py:900-1007 (A+ Endpoint)
@app.post("/api/scan/execute/a-plus")
async def execute_a_plus_scan(request, scan_request):
    # ❌ No parameter for uploaded_code
    # ❌ No check for formatted code
    results = await run_enhanced_a_plus_scan(...)  # ← Always uses built-in A+
```

### Step 4: Results Are Hardcoded, Not From Uploaded Code
```python
# /edge-dev/backend/core/scanner.py:228-901
def check_high_lvl_filter_lc(df):
    """Hardcoded LC patterns - NOT from uploaded code"""
    df['score_atr'] = np.select([...], [20, 18, 15, 12], default=0)
    df['score_ema'] = np.select([...], [30, 25, 20, 15], default=0)
    # ... 15 more hardcoded pattern definitions
```

---

## Parameter Extraction Working Perfectly

### Extraction Patterns (10 Types)

**In `/edge-dev/backend/core/parameter_integrity_system.py:43-167`**

1. **custom_params = {...}** - Line 57-59
2. **defaults = {...}** - Line 61-64
3. **P = {...}** - Line 66-70 (A+ specific)
4. **Named dicts** (params, parameters, config, settings, knobs) - Line 72-78
5. **Direct assignments** (atr_mult, vol_mult, etc.) - Line 80-98
6. **API constants** (API_KEY, BASE_URL, DATE) - Line 99-102
7. **Rolling windows** (.rolling(window=N)) - Line 104-110
8. **EMA spans** (.ewm(span=N)) - Line 112-118
9. **Date constants** (START_DATE, END_DATE) - Line 120-125
10. **Threshold values** (>=, >, <=, <) - Line 127-152

### Example: A+ Parameters Correctly Extracted

```python
params = {
    'atr_mult': 3.5,
    'vol_mult': 1.2,
    'slope3d_min': 1.5,
    'slope5d_min': 2.0,
    'slope15d_min': 2.5,
    'prev_close_min': 10.0,
    'gap_div_atr_min': 0.5,
    'price_min': 5.0,
    'adv20_min_usd': 500000,
    # ... 20+ more extracted parameters
}
```

**Status**: ✅ EXTRACTED CORRECTLY
**Problem**: ❌ NEVER USED IN EXECUTION

---

## Missing Execution Endpoint

### What Should Exist (Option A - Recommended)

```python
@app.post("/api/scan/execute/uploaded")
async def execute_uploaded_scan(
    request: Request,
    scan_id: str,           # Reference to formatted code
    start_date: str,
    end_date: str,
    background_tasks: BackgroundTasks
):
    """
    MISSING ENDPOINT
    
    Should:
    1. Retrieve formatted code from cache
    2. Extract scanner type and parameters
    3. Create execution environment with imports
    4. Execute: exec(formatted_code, exec_globals)
    5. Call main scanning function from uploaded code
    6. Return actual results from uploaded algorithm
    """
```

### What Actually Happens

```python
# User clicks "Run Scan" after uploading code
# System calls /api/scan/execute or /api/scan/execute/a-plus
# These endpoints NEVER check for uploaded code
# They always execute their hardcoded logic
# Results are identical to built-in scanner
```

---

## Proof the Bug Exists

### Evidence 1: No Uploaded Code Parameter
Search `/edge-dev/backend/main.py`:
```bash
grep -n "uploaded_code" main.py
grep -n "formatted_code.*execute" main.py
```
**Result**: No matches - endpoints don't accept uploaded code

### Evidence 2: No Execution Call
Search `/edge-dev/backend/core/code_formatter.py`:
```bash
grep -n "exec(" code_formatter.py
```
**Result**: Only `compile()` for syntax validation, never `exec()` for execution

### Evidence 3: Hardcoded Results
In `/edge-dev/backend/main.py:489-490`:
```python
# 🔧 UNIVERSAL DEDUPLICATION: Apply to ALL results
results = universal_deduplicate_scan_results(raw_results)
```
This deduplicates hardcoded results, not uploaded code results

### Evidence 4: No Code Preservation Call
Search `/edge-dev/backend/` for calls to `preserve_and_enhance_code()`:
```bash
grep -r "preserve_and_enhance_code" backend/
grep -r "CodePreservationEngine" backend/
```
**Result**: Defined in `code_preservation_engine.py` but never called in execution

---

## Why All Scanners Return Identical Results

### Scenario 1: Upload Backside Para A+
```
1. Upload A+ code
2. /api/format/code → Detects scanner_type: "a_plus"
3. Extract 20+ A+ parameters (atr_mult, slope3d_min, etc.)
4. User clicks "Run Scan"
5. System calls /api/scan/execute/a-plus
6. Execute hardcoded A+ logic → Get A+ results
```

### Scenario 2: Upload Half A+
```
1. Upload Half A+ code
2. /api/format/code → Detects scanner_type: "a_plus"
3. Extract A+ parameters (subset version)
4. User clicks "Run Scan"
5. System calls /api/scan/execute/a-plus (or /api/scan/execute)
6. Execute hardcoded A+ logic → Get A+ results
```

### Scenario 3: Upload LC D2
```
1. Upload LC D2 code
2. /api/format/code → Detects scanner_type: "lc"
3. Extract LC parameters (lc_frontside_d3_extended_1, etc.)
4. User clicks "Run Scan"
5. System calls /api/scan/execute
6. Execute hardcoded LC logic → Get LC results
```

### Result
- **Backside Para A+**: Returns A+ results ✅ (Built-in)
- **Half A+**: Returns A+ results ✅ (Built-in)
- **LC D2**: Returns LC results ✅ (Built-in)

**NOT their uploaded code results** ❌

---

## How to Verify This Bug

### Step 1: Upload Backside Para A+ Code
```
1. Open frontend
2. Select "Scanner Type" → "Backside Para A+"
3. Paste code
4. Click "Analyze/Format"
5. Observe returned metadata:
   - scanner_type: "a_plus"
   - parameter_count: 20+
   - parameters: {atr_mult: 3.5, vol_mult: 1.2, ...}
```

### Step 2: Run Scan with This Code
```
1. Click "Run Scan" with same code
2. Check network tab → Request to /api/scan/execute/a-plus
3. Results come back with A+ patterns
```

### Step 3: Upload LC D2 Code
```
1. Select "Scanner Type" → "LC D2"
2. Paste completely different code
3. Click "Analyze/Format"
4. Observe returned metadata:
   - scanner_type: "lc"
   - parameter_count: 15+
   - parameters: {lc_frontside_d3_extended_1: 1, ...}
```

### Step 4: Run Scan with LC D2 Code
```
1. Click "Run Scan" with LC D2 code
2. Check network tab → Request to /api/scan/execute
3. Results come back with LC patterns
```

### Step 5: Compare Results
```
Backside Para A+ Results ≈ A+ Built-in Results ✅
LC D2 Results ≈ LC Built-in Results ✅
Neither matches their actual uploaded code logic ❌
```

---

## Summary Table

| Component | Location | Status | Issue |
|-----------|----------|--------|-------|
| Upload Interface | Frontend | ✅ Works | User can select and upload code |
| Syntax Validation | `code_formatter.py:181-210` | ✅ Works | `compile(code)` validates |
| Scanner Detection | `parameter_integrity_system.py:49-51` | ✅ Works | Correctly identifies A+/LC/custom |
| Parameter Extraction | `parameter_integrity_system.py:43-167` | ✅ Works | 10+ pattern extraction |
| Code Preservation | `code_preservation_engine.py:65-100` | ✅ Built | AST parsing ready |
| Integrity Verification | `parameter_integrity_system.py:104-142` | ✅ Works | Hash verification complete |
| **Code Execution** | **MISSING** | ❌ **BROKEN** | **No endpoint for uploaded code** |
| **Parameter Usage** | **MISSING** | ❌ **BROKEN** | **Extracted parameters never used** |
| Result Return | `main.py:489-575` | ✅ Works | Returns hardcoded results |

---

## Fix Options

### Option A: Create New Endpoint (Recommended)
**File**: `/edge-dev/backend/main.py`  
**Add**: New `@app.post("/api/scan/execute/uploaded")` endpoint  
**Complexity**: Medium  
**Benefits**: Separate execution path for uploaded code  
**Time**: 2-3 hours

### Option B: Modify Existing Endpoints
**File**: `/edge-dev/backend/main.py`  
**Change**: Add `uploaded_code` parameter to `/api/scan/execute`  
**Complexity**: Low  
**Benefits**: Reuses existing infrastructure  
**Time**: 1-2 hours

### Option C: Complete Refactor
**Files**: All scan endpoints  
**Change**: Unified execution system  
**Complexity**: High  
**Benefits**: Handles all scanner types uniformly  
**Time**: 4-5 hours

---

## Storage Requirement for Fix

Need to persist formatted code between requests:

```python
# Add to /api/format/code endpoint:

# SAVE formatted code
scan_id = str(uuid4())
cache_key = f"uploaded_scanner_{scan_id}"
redis_client.set(cache_key, formatted_code, ex=86400)  # 24 hour TTL

return CodeFormattingResponse(
    ...
    metadata={'scan_id': scan_id, 'cache_key': cache_key}
)
```

```python
# Add to execution endpoint:

# RETRIEVE formatted code
scan_id = request.query_params.get('scan_id')
cache_key = f"uploaded_scanner_{scan_id}"
formatted_code = redis_client.get(cache_key)

if not formatted_code:
    raise HTTPException(status_code=404, detail="Scan code not found")
```

---

## Conclusion

The uploaded scanner feature has everything EXCEPT execution:

✅ Upload interface  
✅ Syntax validation  
✅ Scanner detection  
✅ Parameter extraction  
✅ Code preservation  
✅ Integrity verification  

❌ **Code execution** ← THE BUG

This is why all uploaded scanners return identical/similar results - they're executing the built-in scanners, not the uploaded code.

