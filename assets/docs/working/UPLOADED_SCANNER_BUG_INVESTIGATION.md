# Uploaded Scanner Bug Investigation Report

## Executive Summary

**Critical Bug Identified**: All uploaded scanner types (Backside Para A+, Half A+, LC D2) are returning **identical results** despite being completely different algorithms with distinct parameter sets and logic flows.

**Root Cause**: The uploaded scanner execution system has a **fallback mechanism** that causes all scanner types to execute the same default built-in scanner instead of executing their respective uploaded code.

---

## 1. Architecture Overview

### 1.1 Four-Layer System
The backend scanning system operates in a four-layer architecture:

1. **Frontend Layer**: User uploads scanner code + selects scan type
2. **API Gateway**: `/api/format/code` endpoint receives uploaded code
3. **Code Processing Layer**: Code formatting, parameter extraction, integrity verification
4. **Execution Layer**: Actual scan execution with uploaded/formatted code

### 1.2 Key Backend Components

**File Paths**:
- `/edge-dev/backend/main.py` - FastAPI server with scan endpoints
- `/edge-dev/backend/core/code_formatter.py` - Code formatting engine
- `/edge-dev/backend/core/parameter_integrity_system.py` - Parameter extraction & verification
- `/edge-dev/backend/core/code_preservation_engine.py` - Original code preservation
- `/edge-dev/backend/core/scanner_wrapper.py` - Scanner execution wrapper
- `/edge-dev/backend/core/scanner.py` - LC scanner implementation

---

## 2. The Uploaded Scanner Execution Flow

### 2.1 Code Upload & Formatting Pipeline

**Endpoint**: `POST /api/format/code`

```python
# main.py: Line 760-834
@app.post("/api/format/code", response_model=CodeFormattingResponse)
async def format_code_with_integrity(request: Request, format_request: CodeFormattingRequest):
    """
    Format uploaded scanner code with bulletproof parameter integrity
    """
```

**Processing Steps**:

1. **Syntax Validation** (code_formatter.py:181-210)
   - Uses `compile(code, '<string>', 'exec')` to validate Python syntax
   - Returns validation errors if code is invalid

2. **Scanner Type Detection** (code_formatter.py:212-231 + parameter_integrity_system.py:43-167)
   - Detects if code is "a_plus", "lc", or "custom" scanner
   - Extracts scanner name from code

3. **Parameter Extraction** (parameter_integrity_system.py:43-167)
   - **Extremely Comprehensive**: Extracts 10+ different parameter patterns:
     - `custom_params = {...}` dictionaries
     - `defaults = {...}` dictionaries  
     - `P = {...}` dictionaries (A+ specific)
     - Named dictionaries (params, parameters, config, settings, knobs)
     - Direct parameter assignments (atr_mult, vol_mult, slope3d_min, etc.)
     - API constants (API_KEY, BASE_URL, DATE)
     - Rolling window parameters (.rolling(window=N))
     - EMA span parameters (.ewm(span=N))
     - Date constants (START_DATE, END_DATE)
     - Threshold values from conditionals (>= N, > N, < N, <= N)

4. **Code Preservation** (code_preservation_engine.py)
   - Preserves ALL original functions instead of replacing with templates
   - Maintains complete original logic
   - Adds infrastructure enhancements:
     - Polygon API integration
     - Full ticker universe
     - Max workers/threadpooling
     - Enhanced error handling
     - Progress tracking
     - Async processing

5. **Integrity Verification** (parameter_integrity_system.py:104-142)
   - Creates hash of original parameters
   - Verifies formatted code maintains parameter integrity
   - Compares pre-format and post-format signatures

### 2.2 Code Formatting Results

The `/api/format/code` endpoint returns:

```python
class CodeFormattingResponse(BaseModel):
    success: bool
    formatted_code: Optional[str] = ""
    scanner_type: str                # "a_plus", "lc", "custom"
    original_signature: str
    formatted_signature: str
    integrity_verified: bool
    warnings: List[str]
    metadata: Dict[str, Any]
    message: str
```

---

## 3. The Critical Bug: Where Execution Fails

### 3.1 Missing Execution Endpoint

**THE BUG**: There is **NO endpoint that actually executes the formatted/uploaded code**.

The code formatting pipeline:
- ✅ Accepts uploaded code
- ✅ Validates syntax
- ✅ Detects scanner type
- ✅ Extracts all parameters
- ✅ Preserves original logic
- ✅ Verifies integrity
- ❌ **NEVER ACTUALLY EXECUTES IT**

### 3.2 Existing Scan Endpoints

**Built-in Scanner Endpoints** (main.py):

1. **LC Scanner**: `POST /api/scan/execute`
   - Uses `run_lc_scan()` from `sophisticated_lc_wrapper.py`
   - Executes hardcoded LC pattern detection logic
   - **No parameter for uploaded code**

2. **A+ Scanner**: `POST /api/scan/execute/a-plus`
   - Uses `run_enhanced_a_plus_scan()`
   - Executes hardcoded A+ Daily Parabolic logic
   - **No parameter for uploaded code**

### 3.3 Hardcoded Scanner Logic

**LC Scanner** (scanner.py:228-901):
```python
def check_high_lvl_filter_lc(df):
    """
    Hardcoded LC filter patterns with fixed:
    - 5 scoring components (ATR, EMA, Burst, Volume, Gap)
    - 20+ named pattern conditions
    - Complex multi-condition logic
    """
    df['score_atr'] = np.select([...], [20, 18, 15, 12], default=0)
    df['score_ema'] = np.select([...], [30, 25, 20, 15], default=0)
    # ... 15 more pattern definitions
```

**A+ Scanner** (enhanced_a_plus_scanner.py):
```python
def scan_daily_para(df):
    """
    Hardcoded A+ pattern with fixed parameters:
    - atr_mult, vol_mult, slope3d_min
    - slope5d_min, slope15d_min
    - prev_close_min, gap_div_atr_min
    """
```

---

## 4. The Root Cause Chain

### 4.1 Why All Scanners Return Identical Results

```
USER UPLOADS SCANNER → Code formatting succeeds (✅)
                    → Returns formatted code + metadata
                    → BUT no execution endpoint uses it
                    
USER CLICKS "RUN SCAN" → Calls /api/scan/execute (LC) or /api/scan/execute/a-plus (A+)
                      → Ignores formatted/uploaded code
                      → Executes hardcoded scanner logic instead
                      
RESULT: All scanners return BUILT-IN results, not uploaded code results
```

### 4.2 Why Different Uploaded Scanners Get Same Results

Since all requests use built-in scanners:

1. **Backside Para A+ Uploaded**
   - Format & extract parameters ✅
   - Get `/api/scan/execute/a-plus` endpoint
   - Execute hardcoded A+ logic → Gets A+ results

2. **Half A+ Uploaded**
   - Format & extract parameters ✅
   - Get `/api/scan/execute/a-plus` endpoint (or `/api/scan/execute`)
   - Execute hardcoded A+ or LC logic → Gets A+/LC results

3. **LC D2 Uploaded**
   - Format & extract parameters ✅
   - Get `/api/scan/execute` endpoint
   - Execute hardcoded LC logic → Gets LC results

**If all upload to same endpoint**: All get same results

---

## 5. Parameter Extraction (WORKING CORRECTLY)

The system **IS** properly extracting parameters from all three scanner types:

### 5.1 LC D2 Parameters Extracted
```python
params = {
    'lc_frontside_d3_extended_1': 1,
    'lc_frontside_d2_extended': 1,
    'lc_frontside_d2_extended_1': 1,
    # ... plus rolling windows, EMA spans, thresholds
}
```

### 5.2 A+ Parameters Extracted  
```python
params = {
    'atr_mult': 3.5,
    'slope3d_min': 1.5,
    'slope5d_min': 2.0,
    'slope15d_min': 2.5,
    'prev_close_min': 10.0,
    'gap_div_atr_min': 0.5,
    'price_min': 5.0,
    # ... plus all thresholds
}
```

### 5.3 Half A+ Parameters Extracted
```python
params = {
    'atr_mult': 2.5,
    'vol_mult': 1.2,
    'slope3d_min': 1.0,
    # ... subset of A+ parameters
}
```

---

## 6. What's Missing: Uploaded Scanner Execution

### 6.1 Required but Missing Architecture

**Needed Flow**:

```
POST /api/scan/execute/uploaded
  ├─ Parameters:
  │  ├─ scan_id (previously formatted)
  │  ├─ start_date
  │  └─ end_date
  ├─ Lookup formatted code from cache/database
  ├─ Extract scanner type
  ├─ Extract parameters
  ├─ Build execution environment with:
  │  ├─ Polygon API access
  │  ├─ Historical data
  │  ├─ Proper imports
  │  └─ Parallel execution setup
  ├─ Execute: exec(formatted_code) with proper namespace
  └─ Return: scan results
```

### 6.2 Current Fallback Behavior

When user requests scan of uploaded code:
1. System checks if endpoint expects uploaded code
2. **No such endpoint exists**
3. **Falls back to built-in scanner** based on detected type
4. Returns hardcoded results

---

## 7. Code Execution Mechanisms Already in Place

The system HAS infrastructure for code execution:

### 7.1 Module Loading (scanner_wrapper.py:26-30)
```python
import importlib.util

scanner_path = os.path.join(os.path.dirname(__file__), 'scanner.py')
spec = importlib.util.spec_from_file_location("scanner", scanner_path)
scanner_module = importlib.util.module_from_spec(spec)
spec.loader.exec_module(scanner_module)  # ← exec_module() exists!
```

### 7.2 Code Compilation (code_formatter.py:193)
```python
compile(code, '<string>', 'exec')  # ← compile() already used for validation
```

### 7.3 Execution Environment Setup
- Polygon API integration ready
- Full ticker universe available
- Threading/ProcessPoolExecutor infrastructure in place
- Progress tracking callbacks prepared
- Result deduplication system ready

---

## 8. Why This Bug Persists

### 8.1 Incomplete Implementation

The upload feature was designed with 5 phases:

| Phase | Status | Evidence |
|-------|--------|----------|
| 1. Upload interface | ✅ Complete | Frontend sends code |
| 2. Syntax validation | ✅ Complete | Uses `compile()` |
| 3. Parameter extraction | ✅ Complete | 10+ pattern extraction |
| 4. Code preservation | ✅ Complete | AST parsing, function preservation |
| 5. **Execution** | ❌ **MISSING** | No upload-specific execution endpoint |

### 8.2 Code Preservation Engine Built But Unused

`code_preservation_engine.py` extracts and preserves:
- All original functions (scan_daily_para, compute_all_metrics, etc.)
- All imports and constants
- All parameter assignments
- Complete main logic

**But this preserved code is never executed** - it's only returned in the formatting response.

### 8.3 Parameter Integrity System Perfect But Wasted

The parameter extraction is extremely comprehensive:
- Extracts parameters from 10 different code patterns
- Creates integrity hashes
- Verifies post-format consistency
- Returns complete parameter metadata

**But these parameters are never used in execution** - they're only returned for user validation.

---

## 9. Consequences of This Bug

### 9.1 For Users Uploading Different Scanners

1. **Upload Backside Para A+** → Get A+ results
2. **Upload Half A+** → Get A+ or LC results (depends on endpoint)
3. **Upload LC D2** → Get LC results
4. **All identical because none execute uploaded code**

### 9.2 For Parameter Customization

- Extract "atr_mult=3.5" → Never used
- Extract "slope3d_min=1.5" → Never used  
- Extract "prev_close_min=10" → Never used
- All replaced with hardcoded defaults

### 9.3 For Custom Scanners

- Upload custom algorithm → Formatted successfully
- Get hardcoded results → Completely wrong
- No indication code wasn't executed

---

## 10. How to Fix This Bug

### 10.1 Option A: Create Uploaded Scanner Endpoint (Recommended)

```python
@app.post("/api/scan/execute/uploaded")
async def execute_uploaded_scan(
    request: Request,
    scan_id: str,           # Reference to previously formatted code
    start_date: str,
    end_date: str,
    background_tasks: BackgroundTasks
):
    """
    Execute previously formatted and uploaded scanner code
    """
    # 1. Retrieve formatted code from cache/database
    formatted_code = get_formatted_code(scan_id)
    
    # 2. Extract scanner type and parameters
    scanner_type = detect_scanner_type(formatted_code)
    parameters = extract_parameters(formatted_code)
    
    # 3. Create execution environment
    exec_globals = {
        'pd': pd,
        'np': np,
        'requests': requests,
        'aiohttp': aiohttp,
        # ... all necessary imports
        'API_KEY': os.getenv('POLYGON_API_KEY'),
        'BASE_URL': 'https://api.polygon.io'
    }
    
    # 4. Execute the code
    exec(formatted_code, exec_globals)
    
    # 5. Call the main scanning function
    # (extracted by code preservation engine)
    scan_function = exec_globals.get('scan_daily_para') or \
                    exec_globals.get('check_high_lvl_filter_lc') or \
                    exec_globals.get('main')
    
    results = await scan_function(start_date, end_date)
    
    return deduplicate_results(results)
```

### 10.2 Option B: Modify Existing Endpoints

Add `uploaded_code` parameter to existing scan endpoints:

```python
@app.post("/api/scan/execute")
async def execute_scan(
    request: Request,
    scan_request: ScanRequest,
    uploaded_code: Optional[str] = None,  # Add this
    background_tasks: BackgroundTasks
):
    """
    Execute scan - either built-in or uploaded
    """
    if uploaded_code:
        # Execute uploaded code
        return await execute_uploaded_code(uploaded_code, scan_request)
    else:
        # Execute built-in LC scan
        return await execute_built_in_lc_scan(scan_request)
```

### 10.3 Data Storage Requirement

Need to persist formatted code between requests:

```python
# Cache formatted code after formatting
@app.post("/api/format/code")
async def format_code_with_integrity(...):
    # ... existing code ...
    
    # MISSING: Save formatted code
    cache_key = f"uploaded_scanner_{scan_id}"
    redis_client.set(cache_key, formatted_code, ex=86400)  # 24 hour TTL
    
    return CodeFormattingResponse(
        success=True,
        formatted_code=formatted_code,
        # ... include scan_id for later retrieval
        metadata={'cache_key': cache_key}
    )
```

---

## 11. Verification Steps

### 11.1 Confirm the Bug

1. Upload **Backside Para A+** code
   - Note returned `scanner_type: "a_plus"`
   - Note returned parameters

2. Click "Run Scan"
   - Observe it calls `/api/scan/execute/a-plus`
   - Returns A+ results

3. Upload **LC D2** code
   - Note returned `scanner_type: "lc"`
   - Note completely different parameters

4. Click "Run Scan"
   - Observe it calls `/api/scan/execute`
   - Returns LC results (different from A+)

5. **They have different parameters but both are built-in scanners**

### 11.2 Check for Uploaded Code Execution

Search codebase for:
```bash
grep -r "uploaded_code" .
grep -r "formatted_code.*execute" .
grep -r "exec(formatted_code" .
grep -r "exec_scan.*uploaded" .
```

**Expected Result**: No matches (confirming code isn't executed)

---

## 12. Impact Assessment

| Component | Status | Impact |
|-----------|--------|--------|
| Upload functionality | ✅ Works | Users can upload code |
| Formatting & parsing | ✅ Works | Code is properly analyzed |
| Parameter extraction | ✅ Works | All parameters extracted |
| Execution | ❌ Broken | Code never runs |
| Result accuracy | ❌ Broken | All results are hardcoded |
| Custom scanners | ❌ Broken | Cannot run custom algorithms |

**Severity**: **CRITICAL** - Feature is completely non-functional

---

## 13. Evidence Summary

### 13.1 Code Paths Analyzed

**Formatting Pipeline** (WORKING):
- `main.py:760-834` - `/api/format/code` endpoint
- `code_formatter.py:52-156` - Formatting logic
- `parameter_integrity_system.py:43-167` - Parameter extraction
- `code_preservation_engine.py:65-100` - Code preservation

**Execution Pipeline** (INCOMPLETE):
- `main.py:333-456` - `/api/scan/execute` (LC only)
- `main.py:900-1007` - `/api/scan/execute/a-plus` (A+ only)
- **MISSING**: `/api/scan/execute/uploaded`

### 13.2 Key Findings

1. **No uploaded code is ever executed**
   - Formatted code is returned to user but cached
   - No endpoint retrieves and executes cached code
   - Falls back to hardcoded scanner logic

2. **Parameter extraction is perfect but unused**
   - 10+ pattern types covered
   - Hashing and verification complete
   - Never actually used in execution

3. **Code preservation infrastructure exists**
   - AST parsing ready
   - Function extraction ready
   - Namespace setup ready
   - Just never called

4. **Execution infrastructure exists**
   - `exec()` and `compile()` already used elsewhere
   - Threading/async infrastructure in place
   - Polygon API integration ready
   - Just not connected to uploaded code

---

## Conclusion

**The uploaded scanner feature is a "Potemkin village"** - it looks complete from the outside (validation ✅, formatting ✅, parameter extraction ✅) but the core functionality (execution) is missing.

The system formats and analyzes uploaded code perfectly, then silently discards it and executes the built-in scanner instead, making it impossible to run custom or uploaded scanning logic.

**This explains why all uploaded scanners return identical/similar results** - they're not running the uploaded code at all.

