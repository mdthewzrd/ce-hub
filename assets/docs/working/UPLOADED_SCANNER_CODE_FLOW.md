# Uploaded Scanner Execution - Complete Code Flow Analysis

## Full Request-Response Lifecycle

### PHASE 1: Upload & Format (Lines Reference)

#### 1.1 User Uploads Scanner Code
**Frontend Action**: User selects scanner type and pastes code

#### 1.2 API Endpoint Receives Code
**File**: `/edge-dev/backend/main.py`  
**Lines**: 760-834

```python
@app.post("/api/format/code", response_model=CodeFormattingResponse)
@limiter.limit("5/minute")
async def format_code_with_integrity(request: Request, format_request: CodeFormattingRequest):
    """
    Format uploaded scanner code with bulletproof parameter integrity
    """
    try:
        logger.info("🔥 Starting bulletproof code formatting request")

        # Step 1: Validate code syntax
        validation = validate_code_syntax(format_request.code)  # Line 777
        if not validation['valid']:
            return CodeFormattingResponse(...)

        # Step 2: Detect scanner type quickly for logging
        scanner_type = detect_scanner_type(format_request.code)  # Line 792
        logger.info(f"📊 Detected scanner type: {scanner_type}")

        # Step 3: Format with bulletproof integrity
        result = format_user_code(format_request.code, format_request.options)  # Line 796

        # Step 4: Prepare response
        if result.success:
            logger.info(f"✅ Code formatting successful...")
            
        return CodeFormattingResponse(  # Line 810
            success=result.success,
            formatted_code=result.formatted_code,
            scanner_type=result.scanner_type,
            original_signature=result.original_signature,
            formatted_signature=result.formatted_signature,
            integrity_verified=result.integrity_verified,
            warnings=result.warnings,
            metadata=result.metadata,
            message=response_message
        )
```

**Status**: ✅ WORKS PERFECTLY

---

#### 1.3 Syntax Validation
**File**: `/edge-dev/backend/core/code_formatter.py`  
**Lines**: 181-210

```python
def validate_code_syntax(code: str) -> Dict[str, Any]:
    """
    🔍 Validate Python code syntax before formatting
    """
    try:
        # Try to compile the code
        compile(code, '<string>', 'exec')  # Line 193
        return {
            'valid': True,
            'message': 'Code syntax is valid',
            'errors': []
        }
    except SyntaxError as e:
        return {
            'valid': False,
            'message': f'Syntax error: {str(e)}',
            'errors': [str(e)]
        }
```

**Status**: ✅ VALIDATION WORKS

---

#### 1.4 Scanner Type Detection
**File**: `/edge-dev/backend/core/code_formatter.py`  
**Lines**: 212-231

```python
def detect_scanner_type(code: str) -> str:
    """
    🔍 Quick scanner type detection
    """
    try:
        integrity_system = ParameterIntegrityVerifier()
        signature = integrity_system.extract_original_signature(code)

        if signature:
            return signature.scanner_type  # Returns: "a_plus", "lc", "custom"
        else:
            return 'custom'
```

**Status**: ✅ DETECTION WORKS

**Example Results**:
- Backside Para A+ code → `"a_plus"`
- LC D2 code → `"lc"`
- Custom code → `"custom"`

---

#### 1.5 Parameter Extraction (10 Patterns)
**File**: `/edge-dev/backend/core/parameter_integrity_system.py`  
**Lines**: 43-167

```python
def extract_original_signature(self, original_code: str) -> ParameterSignature:
    """
    🔍 STEP 1: Extract exact parameter signature from original uploaded code
    """
    print("🔍 EXTRACTING original parameter signature...")

    # Pattern 1: custom_params = {...}
    custom_match = re.search(r'custom_params\s*=\s*\{([^}]+)\}', original_code, re.DOTALL)
    if custom_match:  # Line 57-59
        params.update(self._parse_parameter_dict(custom_match.group(1)))

    # Pattern 2: defaults = {...}
    defaults_match = re.search(r'defaults\s*=\s*\{([^}]+)\}', original_code, re.DOTALL)
    if defaults_match:  # Line 61-64
        params.update(self._parse_parameter_dict(defaults_match.group(1)))

    # Pattern 3: P = {...} (A+ specific)
    p_dict_match = re.search(r'P\s*=\s*\{([^}]+)\}', original_code, re.DOTALL)
    if p_dict_match:  # Line 66-70
        params.update(self._parse_parameter_dict(p_dict_match.group(1)))

    # Pattern 4-10: Additional patterns (named dicts, direct assignments, etc.)
    # Lines 72-152 extract remaining parameters...

    # Create parameter hash for integrity verification
    param_hash = self._create_parameter_hash(params)  # Line 155

    signature = ParameterSignature(
        scanner_type=scanner_type,
        parameter_values=params,
        parameter_hash=param_hash,
        scanner_name=scanner_name
    )

    return signature
```

**Status**: ✅ PARAMETER EXTRACTION PERFECT

**Example Extraction - A+ Scanner**:
```python
params = {
    'atr_mult': 3.5,
    'vol_mult': 1.2,
    'slope3d_min': 1.5,
    'slope5d_min': 2.0,
    'slope15d_min': 2.5,
    'prev_close_min': 10.0,
    'gap_div_atr_min': 0.5,
    'rolling_window_20': 20,
    'ema_span_9': 9,
    'ema_span_20': 20,
    # ... 20+ parameters total
}
```

---

#### 1.6 Code Preservation (NOT CALLED)
**File**: `/edge-dev/backend/core/code_preservation_engine.py`  
**Lines**: 65-100

```python
def preserve_original_code(self, original_code: str) -> PreservedCode:
    """
    🔍 STEP 1: Extract and preserve ALL original code components
    """
    print("🔍 PRESERVING original code components...")

    # Parse the AST to extract functions properly
    try:
        tree = ast.parse(original_code)  # Line 73
    except SyntaxError as e:
        # Fallback to text-based extraction
        return self._fallback_text_extraction(original_code)

    # Extract components
    imports = self._extract_imports(original_code)  # Line 80
    constants = self._extract_constants(original_code)
    functions = self._extract_functions_ast(tree, original_code)  # Line 82
    main_logic = self._extract_main_logic(original_code)
    parameters = self._extract_parameters(original_code)
    ticker_list = self._extract_ticker_list(original_code)

    preserved = PreservedCode(
        imports=imports,
        constants=constants,
        functions=functions,
        main_logic=main_logic,
        parameters=parameters,
        ticker_list=ticker_list
    )

    return preserved
```

**Status**: ❌ **DEFINED BUT NEVER CALLED IN EXECUTION**

---

#### 1.7 Format Response Returned
**File**: `/edge-dev/backend/main.py`  
**Lines**: 810-820

```python
return CodeFormattingResponse(
    success=result.success,
    formatted_code=result.formatted_code,  # Formatted code returned to user
    scanner_type=result.scanner_type,      # "a_plus", "lc", or "custom"
    original_signature=result.original_signature,
    formatted_signature=result.formatted_signature,
    integrity_verified=result.integrity_verified,
    warnings=result.warnings,
    metadata=result.metadata,  # Contains all extracted parameters
    message=response_message
)
```

**Problem**: ❌ Formatted code is returned but never saved for later execution

---

### PHASE 2: User Requests Scan (Lines Reference)

#### 2.1 Frontend Detects Scanner Type
**Frontend Logic**: Based on `scanner_type` from Phase 1.4

```
If scanner_type == "a_plus":
    → Route to /api/scan/execute/a-plus
Else if scanner_type == "lc":
    → Route to /api/scan/execute
Else:
    → Route to /api/scan/execute (or error)
```

**Problem**: Neither endpoint accepts uploaded/formatted code parameter

---

#### 2.2 API Call: LC Scanner (For LC D2 or Default)
**File**: `/edge-dev/backend/main.py`  
**Lines**: 333-456

```python
@app.post("/api/scan/execute", response_model=ScanResponse)
@limiter.limit("10/minute")
async def execute_scan(request: Request, scan_request: ScanRequest, background_tasks: BackgroundTasks):
    """
    Execute a new LC scan with enhanced 90-day analysis
    Auto-calculates 90-day lookback period if no dates provided
    """
    
    # ❌ NO PARAMETER FOR UPLOADED CODE
    # ❌ NO CHECK FOR FORMATTED CODE
    # ❌ ALWAYS EXECUTES BUILT-IN LC SCANNER
    
    # ... setup code ...
    
    if scan_request.use_real_scan:
        # Run enhanced 90-day scan in background
        background_tasks.add_task(run_real_scan_background, scan_id, start_date, end_date)  # Line 395
        
        # This calls the built-in LC scanner:
        # run_lc_scan() from sophisticated_lc_wrapper.py
```

**Status**: ❌ HARDCODED TO USE BUILT-IN LC SCANNER

---

#### 2.3 API Call: A+ Scanner (For A+ Variants)
**File**: `/edge-dev/backend/main.py`  
**Lines**: 900-1007

```python
@app.post("/api/scan/execute/a-plus", response_model=ScanResponse)
@limiter.limit("2/minute")
async def execute_a_plus_scan(request: Request, scan_request: ScanRequest):
    """Execute A+ Daily Parabolic scan"""

    # ❌ NO PARAMETER FOR UPLOADED CODE
    # ❌ NO CHECK FOR FORMATTED CODE
    # ❌ ALWAYS EXECUTES HARDCODED A+ SCANNER
    
    if not A_PLUS_MODE:
        raise HTTPException(status_code=503, detail="A+ scanner not available")

    # ... setup code ...

    # Execute A+ scan
    raw_results = await run_enhanced_a_plus_scan(  # Line 945
        start_date=scan_request.start_date,
        end_date=scan_request.end_date,
        progress_callback=progress_callback
    )
```

**Status**: ❌ HARDCODED TO USE BUILT-IN A+ SCANNER

---

### PHASE 3: Execute Built-in Scanner (Lines Reference)

#### 3.1 Background Scan Execution
**File**: `/edge-dev/backend/main.py`  
**Lines**: 458-540

```python
async def run_real_scan_background(scan_id: str, start_date: str, end_date: str):
    """
    Run the enhanced 90-day LC scan in background with progress updates
    """
    try:
        # ... setup ...

        if start_date == "auto-90day":
            logger.info(f"Executing enhanced 90-day LC scan for {scan_id}...")
            raw_results = await run_lc_scan(None, end_date, progress_callback)  # Line 484
        else:
            logger.info(f"Executing enhanced 90-day LC scan...")
            raw_results = await run_lc_scan(start_date, end_date, progress_callback)  # Line 487

        # 🔧 UNIVERSAL DEDUPLICATION: Apply to ALL results
        results = universal_deduplicate_scan_results(raw_results)  # Line 490
```

**Critical Line**: 484, 487 - `run_lc_scan()` is hardcoded, not parameterized

---

#### 3.2 LC Scanner Implementation
**File**: `/edge-dev/backend/core/scanner.py`  
**Lines**: 228-901

```python
def check_high_lvl_filter_lc(df):
    """
    ❌ HARDCODED LC FILTER PATTERNS - NOT FROM UPLOADED CODE
    """
    df['score_atr'] = np.select(
        [df['atr_14_div_close'] < 0.01,
         (df['atr_14_div_close'] >= 0.01) & (df['atr_14_div_close'] < 0.015),
         (df['atr_14_div_close'] >= 0.015) & (df['atr_14_div_close'] < 0.02),
         df['atr_14_div_close'] >= 0.02],
        [20, 18, 15, 12],
        default=0
    )  # Fixed score weights
    
    df['score_ema'] = np.select(
        [df['ema_12_14_pct'] < 0.005,
         (df['ema_12_14_pct'] >= 0.005) & (df['ema_12_14_pct'] < 0.01),
         (df['ema_12_14_pct'] >= 0.01) & (df['ema_12_14_pct'] < 0.015),
         df['ema_12_14_pct'] >= 0.015],
        [30, 25, 20, 15],
        default=0
    )  # Fixed score weights
    
    # ... 15 more hardcoded pattern definitions ...
```

**Status**: ❌ These are hardcoded, uploaded code parameters are ignored

---

#### 3.3 A+ Scanner Implementation
**File**: `/edge-dev/backend/enhanced_a_plus_scanner.py`

```python
async def run_enhanced_a_plus_scan(...):
    """
    ❌ HARDCODED A+ SCANNER - NOT FROM UPLOADED CODE
    """
    def scan_daily_para(df):
        # Hardcoded parameters:
        atr_mult = 3.5  # NOT from uploaded code
        vol_mult = 1.5  # NOT from uploaded code
        slope3d_min = 1.5  # NOT from uploaded code
        # ... more hardcoded parameters ...
```

**Status**: ❌ All parameters hardcoded, uploaded parameters ignored

---

### PHASE 4: Return Results (Lines Reference)

#### 4.1 Results Returned to User
**File**: `/edge-dev/backend/main.py`  
**Lines**: 550-575

```python
@app.get("/api/scan/results/{scan_id}")
async def get_scan_results(scan_id: str):
    """Get results of a completed scan"""
    if scan_id not in active_scans:
        raise HTTPException(status_code=404, detail="Scan not found")

    scan_info = active_scans[scan_id]

    if scan_info["status"] not in ["completed", "error"]:
        raise HTTPException(status_code=202, detail="Scan still in progress")

    # 🔧 UNIVERSAL DEDUPLICATION: Final safety net for ALL results
    raw_results = scan_info.get("results", [])
    deduplicated_results = universal_deduplicate_scan_results(raw_results)  # Line 563

    return {
        "scan_id": scan_id,
        "status": scan_info["status"],
        "results": deduplicated_results,  # Hardcoded results, not from uploaded code
        "total_found": len(deduplicated_results),
        "execution_time": scan_info.get("execution_time", 0),
        "date_range": {
            "start_date": scan_info["start_date"],
            "end_date": scan_info["end_date"]
        }
    }
```

**Status**: ❌ Results are from built-in scanner, not uploaded code

---

## The Missing Execution Path

### What Should Happen (NOT IMPLEMENTED)

```python
# MISSING ENDPOINT:

@app.post("/api/scan/execute/uploaded")
async def execute_uploaded_scan(
    request: Request,
    scan_id: str,  # Reference to previously formatted code
    start_date: str,
    end_date: str,
    background_tasks: BackgroundTasks
):
    """
    THIS ENDPOINT DOES NOT EXIST
    
    If it existed, it would:
    
    1. Retrieve formatted code from cache/database
    2. Extract scanner type and parameters
    3. Create execution environment:
       exec_globals = {
           'pd': pd,
           'np': np,
           'requests': requests,
           'aiohttp': aiohttp,
           'API_KEY': os.getenv('POLYGON_API_KEY'),
           'BASE_URL': 'https://api.polygon.io'
       }
    
    4. Execute the code:
       exec(formatted_code, exec_globals)
    
    5. Call main scanning function from uploaded code:
       scan_function = exec_globals.get('scan_daily_para') or \
                       exec_globals.get('check_high_lvl_filter_lc') or \
                       exec_globals.get('main')
    
    6. Return actual results from uploaded algorithm:
       results = await scan_function(start_date, end_date)
       return deduplicate_results(results)
    """
    pass
```

---

## Code Flow Visualization

```
USER UPLOADS SCANNER CODE
    ↓
POST /api/format/code
    ↓
┌─────────────────────────────────┐
│ 1. Validate Syntax ✅           │ (compile code)
│ 2. Detect Type ✅               │ ("a_plus", "lc", "custom")
│ 3. Extract Parameters ✅         │ (10+ patterns, all params)
│ 4. Preserve Code ✅ (defined)   │ (AST parsing ready)
│ 5. Verify Integrity ✅          │ (hash verification)
└─────────────────────────────────┘
    ↓
Return CodeFormattingResponse
    ├─ formatted_code ← NOT SAVED
    ├─ scanner_type: "a_plus"
    ├─ parameters: {atr_mult: 3.5, ...}
    └─ metadata: {...}
    
USER CLICKS "RUN SCAN"
    ↓
POST /api/scan/execute or /api/scan/execute/a-plus
    ↓
┌──────────────────────────────────────────┐
│ ❌ NO PARAMETER FOR UPLOADED CODE        │
│ ❌ NO CHECK FOR FORMATTED CODE           │
│ ❌ ALWAYS EXECUTES HARDCODED SCANNER     │
└──────────────────────────────────────────┘
    ↓
run_lc_scan() OR run_enhanced_a_plus_scan()
    ↓
┌──────────────────────────────────────────┐
│ HARDCODED SCANNER LOGIC                  │
│ - Fixed parameters                       │
│ - Fixed patterns                         │
│ - Fixed thresholds                       │
└──────────────────────────────────────────┘
    ↓
Return HARDCODED RESULTS
    ├─ From built-in LC or A+ scanner
    ├─ NOT from uploaded code
    └─ Same for all uploaded scanners of same type

RESULT: All uploaded A+ scanners return A+ results ✅
        All uploaded LC scanners return LC results ✅
        None execute their uploaded code ❌
```

---

## Summary of Missing/Broken Components

| Component | File | Lines | Status | Issue |
|-----------|------|-------|--------|-------|
| Format endpoint | main.py | 760-834 | ✅ Works | Returns formatted code but doesn't save it |
| Syntax validation | code_formatter.py | 181-210 | ✅ Works | Validates but never used for execution |
| Type detection | code_formatter.py | 212-231 | ✅ Works | Detects correctly but not used in execution |
| Parameter extraction | parameter_integrity_system.py | 43-167 | ✅ Works | Perfect extraction but parameters never used |
| Code preservation | code_preservation_engine.py | 65-100 | ✅ Built | Defined but never called |
| LC execution endpoint | main.py | 333-456 | ✅ Exists | No uploaded code parameter |
| A+ execution endpoint | main.py | 900-1007 | ✅ Exists | No uploaded code parameter |
| **Uploaded code execution** | **MISSING** | **N/A** | ❌ Missing | **No endpoint or logic** |
| Code caching | **MISSING** | **N/A** | ❌ Missing | **Formatted code not persisted** |
| Code retrieval | **MISSING** | **N/A** | ❌ Missing | **No way to get cached code** |
| Code execution path | **MISSING** | **N/A** | ❌ Missing | **No exec() call with proper namespace** |

---

## Conclusion

The entire upload and formatting pipeline works perfectly (4-5 phases complete), but it dead-ends without ever executing the code or using the extracted parameters.

The system creates a "complete" package:
- ✅ Formatted code
- ✅ Scanner type
- ✅ All parameters
- ✅ Preserved functions
- ✅ Integrity verification

But then throws it away and executes the built-in hardcoded scanner instead.

This is why all uploaded scanners of the same type return identical results.

