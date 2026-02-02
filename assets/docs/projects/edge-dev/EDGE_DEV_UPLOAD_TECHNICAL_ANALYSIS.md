# TECHNICAL DEEP-DIVE: CODE UPLOAD EXECUTION FAILURE ANALYSIS

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         FRONTEND (React)                         │
│  uploadHandler.ts → CodeFormatterService → /api/format/code     │
└──────────────────────────┬──────────────────────────────────────┘
                           │
                           ▼
┌─────────────────────────────────────────────────────────────────┐
│                    BACKEND (FastAPI)                             │
│  main.py:821-931 → /api/format/code endpoint                    │
│  ↓                                                               │
│  core.code_formatter.format_user_code()                         │
│  ↓                                                               │
│  core.intelligent_parameter_extractor.extract_parameters()      │
│  ↓                                                               │
│  Returns: FormattingResponse with metadata                      │
└──────────────────────────┬──────────────────────────────────────┘
                           │
         ┌─────────────────┴─────────────────┐
         │                                   │
         ▼                                   ▼
    /api/scan/execute              (User sees "Ready")
         │
         ├─→ main.py:483-601
         │   run_real_scan_background()
         │   ↓
         │   ├─→ Detects: scanner_type == "uploaded"
         │   ├─→ Calls: execute_uploaded_scanner_direct()
         │   │
         │   └─→ uploaded_scanner_bypass.py:114-680
         │       ├─ Detects Pattern 5: async def main + DATES
         │       ├─ Creates safe exec globals with __name__='uploaded_scanner_module'
         │       ├─ exec(code, exec_globals)  <-- FAILS HERE
         │       ├─ Looks for df_lc, results, etc.
         │       └─ Returns 0 results
         │
         └─→ Returns: scan_id with "completed" status

                (User sees: "Scan completed with 0 results")
```

---

## CRITICAL CODE PATHS THAT FAIL

### Path 1: Code Format Request → Transformation

**File**: `main.py:821-931`

```python
@app.post("/api/format/code", response_model=CodeFormattingResponse)
async def format_code_with_integrity(request: Request, format_request: CodeFormattingRequest):
    """
    Line 823: Limit formatting requests
    Line 859: intelligent_extractor = IntelligentParameterExtractor()
    Line 860: extraction_result = intelligent_extractor.extract_parameters(format_request.code)
    Line 869: result = format_user_code(format_request.code)  <-- TRANSFORMATION HAPPENS HERE
    """
    
    # This calls code_formatter.py:format_user_code()
    # Which then calls intelligent_enhancement.py
    # Which modifies the original code
    
    # The frontend receives formatted_code, not the original
    # When executing, the modified code is used, not the original
```

**Why LC D2 Fails**:
- LC D2 has complex interdependencies
- Each line of code depends on previous lines
- Transformations break these dependencies
- Refactoring attempts to extract parameters
- But parameters are scattered throughout the code
- Reorganizing them breaks the logic

---

### Path 2: Intelligent Parameter Extraction → AI Refactoring

**File**: `intelligent_parameter_extractor.py:58-98`

```python
def extract_parameters(self, code: str, scanner_type: str = "unknown") -> ExtractionResult:
    """
    Line 76: result = self._extract_with_ast_llm(code, scanner_type)
    
    Line 78-80:
    if result.success and result.total_found >= 5:
        return result  # Good path
    else:
        # PROBLEM: Attempts AI refactoring for complex scanners
        refactored_result = self._extract_with_refactoring(code, scanner_type, start_time)
    """
```

**The Refactoring Attempt** (lines 128-168):

```python
def _extract_with_refactoring(self, code: str, scanner_type: str, start_time: float):
    """
    Phase 1: AI code refactoring (lines 139-147)
    - Uses LLM to identify hardcoded parameters
    - Extracts them into P = {} dictionary
    - Refactors all references to use P[]
    
    Phase 2: Extraction from refactored code (lines 148-156)
    - Runs AST extraction on new code
    - Tries to find parameters in clean structure
    """
    
    # This fundamentally transforms the code structure
    # Breaking the original algorithm's logic
    refactored_code = self._refactor_code_with_ai(code, scanner_type)
    # refactored_code now looks different
    # But it's this version that gets executed!
```

**For LC D2, This Means**:
- System tries to extract 72 parameters
- Refactoring process reorganizes them
- Data loading sequence is altered
- Filter conditions reference new variable names
- Original execution flow is broken

---

### Path 3: Async Execution Conflict

**File**: `uploaded_scanner_bypass.py:53-96`

```python
def has_asyncio_in_main(code: str) -> bool:
    """
    Detects if code has asyncio.run() calls
    Returns True for LC D2 (which has asyncio.run(main()))
    """
    lines = code.split('\n')
    in_main_block = False
    
    for line in lines:
        if 'if __name__ ==' in stripped and '__main__' in stripped:
            in_main_block = True
            # ... check for asyncio.run() in main block
            if 'asyncio.run(' in stripped:
                return True  # LC D2 returns True here
    
    return False

def create_safe_exec_globals(code: str) -> dict:
    """
    Line 91-96:
    if has_asyncio_in_main(code):
        return {'__name__': 'uploaded_scanner_module'}  <-- PROBLEM!
    else:
        return {'__name__': '__main__'}
    """
    
    # For LC D2, __name__ is set to 'uploaded_scanner_module'
    # This prevents the `if __name__ == '__main__':` block from executing
    # So asyncio.run(main()) is never called
    # So main() coroutine is never executed
```

**Why This Breaks LC D2**:

```python
# Original LC D2 code:
async def main():
    # 500 lines of async logic
    df_lc = await complex_scan()  # Async function call
    return df_lc

if __name__ == '__main__':
    asyncio.run(main())  # This line is never reached!

# With __name__ = 'uploaded_scanner_module':
# The if __name__ == '__main__': block is skipped
# main() function is defined but never awaited
# df_lc is never created
# System looks for df_lc in results - finds nothing
# Returns empty list
```

---

### Path 4: Pattern Detection and Isolated Execution

**File**: `uploaded_scanner_bypass.py:216-516`

```python
# Pattern 5 Detection (lines 268-278):
elif (
    'async def main(' in code and
    'DATES' in code and
    'asyncio.run(main())' in code
):
    scanner_pattern = "async_main_DATES"
    main_function = getattr(uploaded_module, 'main', None)
    print(f"🎯 Detected Pattern 5: async def main + DATES + asyncio.run(main())")

# Pattern 5 Execution (lines 464-516):
elif scanner_pattern == "async_main_DATES":
    print(f"🎯 Pattern 5: Executing async main() for LC D2 scanner...")
    
    try:
        import io
        import contextlib
        import asyncio
        
        stdout_capture = io.StringIO()
        exec_globals = create_safe_exec_globals(code)
        
        # LINE 482: THE CRITICAL FAILURE POINT
        with contextlib.redirect_stdout(stdout_capture):
            exec(code, exec_globals)  # <-- DOESN'T AWAIT ASYNC FUNCTIONS!
        
        # Lines 488-502: Look for results
        possible_result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']
        found_results = []
        
        for var_name in possible_result_vars:
            if var_name in exec_globals and exec_globals[var_name] is not None:
                var_data = exec_globals[var_name]
                if hasattr(var_data, 'to_dict'):
                    found_results = var_data.to_dict('records')
                    break
        
        if found_results:
            return found_results
        else:
            return []  # <-- LC D2 RETURNS EMPTY HERE
```

**The Execution Problem**:

1. `exec(code, exec_globals)` - Standard exec, doesn't handle async
2. `exec_globals['__name__'] = 'uploaded_scanner_module'` - Prevents main block
3. `async def main():` is defined but never called
4. `main()` exists as a coroutine but never awaited
5. Result variables are never populated
6. System returns empty results

**What Should Happen**:
```python
# For async code, would need:
if 'async def main' in code and 'asyncio.run' in code:
    # Extract and await the main function properly
    event_loop = asyncio.new_event_loop()
    asyncio.set_event_loop(event_loop)
    try:
        result = event_loop.run_until_complete(main())
    finally:
        event_loop.close()
```

---

## TIMEOUT AND CONCURRENCY ISSUES

### Issue 1: Request Timeout

**File**: `main.py:821-931` for format request
- Frontend timeout: 30 seconds (from complete_upload_analysis.py:49)
- Backend processing time: Can exceed this for complex scanners
- Result: "request timeout" error (implicit, not shown to user)

### Issue 2: Concurrent Scan Limit

**File**: `main.py:139-141, 365-371`

```python
MAX_CONCURRENT_SCANS = 5
active_scan_count = 0
scan_lock = asyncio.Lock()

# In execute_scan():
async with scan_lock:
    if active_scan_count >= MAX_CONCURRENT_SCANS:
        raise HTTPException(
            status_code=429,
            detail=f"Maximum concurrent scans reached"
        )
    active_scan_count += 1
```

**Impact on LC D2**:
- If 5 complex scans are running
- Each taking 30+ seconds to parse
- New upload gets queued
- Waits for one to complete
- May timeout if parsing takes too long

---

## CODE INTEGRITY VERIFICATION FAILURES

### The Parameter Integrity System

**File**: `core/code_formatter.py:52-150` and `core/parameter_integrity_system.py`

```python
def format_code_with_integrity(self, original_code: str, options: Dict[str, Any] = None) -> FormattingResult:
    """
    Claims to preserve integrity but:
    
    Line 68: original_sig = self.integrity_system.extract_original_signature(original_code)
    Line 86: format_result = self.integrity_system.format_with_integrity_preservation(original_code)
    Line 104: integrity_result = self.integrity_system.verify_post_format_integrity(original_code, formatted_code)
    
    Line 107-116: If integrity fails, it suppresses the warning:
    if not integrity_result['integrity_verified']:
        if options and options.get('suppress_integrity_warnings', False):
            pass  # Suppress warning!
        else:
            warnings.append("Parameter integrity verification failed!")
    """
    
    # The integrity system detects that parameters have changed
    # But system suppresses the warning
    # Returns success=True even though code was modified
```

**This Means**:
- LC D2 parameters are modified
- System detects the modification
- But suppresses the warning
- Tells frontend "Format successful" when it actually failed
- Frontend uses corrupted code

---

## RESULT VARIABLE DETECTION FAILURE

**File**: `uploaded_scanner_bypass.py:488-510`

```python
# Looking for results in these variables:
possible_result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']

# For LC D2, the main result is stored in: df_lc
# This IS in the list!

# But the code that creates it never executes:
# async def main():
#     ...
#     df_lc = await process_data()  # <-- Never awaited
#     return df_lc
#
# if __name__ == '__main__':
#     asyncio.run(main())  # <-- Never executed because __name__ != '__main__'

# So df_lc is never created in exec_globals
# System looks for df_lc, doesn't find it
# Returns empty results
```

---

## THE CHAIN OF FAILURES FOR LC D2

```
1. User uploads LC D2 (500 lines)
   ↓
2. Frontend calls /api/format/code
   ↓
3. Backend tries to format:
   - Extracts parameters (finds 72)
   - Detects refactoring needed (< 5 initially? or just tries anyway)
   - AI refactoring rewrites code structure
   ↓
4. Frontend receives formatted_code response
   - Shows "Analysis complete, ready to scan"
   - Stores formatted_code (not original)
   ↓
5. User clicks "Run Scan"
   ↓
6. Frontend calls /api/scan/execute with uploaded_code (the formatted version)
   ↓
7. Backend run_real_scan_background():
   - Detects scanner_type == "uploaded"
   - Calls execute_uploaded_scanner_direct()
   ↓
8. uploaded_scanner_bypass.py:
   - Detects Pattern 5: async def main + DATES
   - Creates safe_exec_globals with __name__ = 'uploaded_scanner_module'
   - Calls exec(code, exec_globals)
   ↓
9. Execution:
   - async def main(): defined but not called
   - if __name__ == '__main__': skipped (because __name__ != '__main__')
   - asyncio.run(main()): never reached
   - df_lc never created
   ↓
10. Result Collection:
    - Looks for df_lc in exec_globals
    - Doesn't find it (because main() never executed)
    - Returns []
    ↓
11. Backend Response:
    - status: "completed"
    - results: []
    - message: "Scan completed with 0 results"
    ↓
12. Frontend:
    - Shows "Scan completed"
    - Displays 0 results
    - User confused: "Code worked in VS Code, why 0 results?"
```

---

## WHY SIMPLE CODES WORK

### Example: Simple A+ Scanner (Works)

```python
# Simple scanner - NO async, NO complex dependencies
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL']

def scan_symbol(symbol):
    # Simple logic
    if get_price(symbol) > threshold:
        return symbol
    return None

results = []
for symbol in SYMBOLS:
    if scan_symbol(symbol):
        results.append(symbol)

# Results stored in 'results' variable
# System finds it in exec_globals['results']
# Returns the results successfully
```

### Why It Works:
1. No async functions - no execution conflict
2. Results in predictable variable name 'results'
3. No complex interdependencies
4. Executes completely with exec()
5. System finds 'results' variable
6. Returns actual results

### Example: LC D2 Scanner (Fails)

```python
# Complex scanner - HAS async, HAS dependencies
DATES = ['2025-01-01', ...]
# ... 20 lines of setup code ...

async def main():
    # Main logic that depends on:
    # - Global constants (DATES, etc.)
    # - Helper functions defined earlier
    # - Data structures created in setup
    
    # 100+ lines of async operations
    df_lc = await fetch_and_analyze()
    return df_lc

if __name__ == '__main__':
    asyncio.run(main())

# With __name__ = 'uploaded_scanner_module':
# if __name__ == '__main__': is False
# asyncio.run(main()) is never executed
# df_lc is never created
# System returns []
```

### Why It Fails:
1. Async functions - execution conflict
2. __name__ manipulation - main block skipped
3. Complex interdependencies - global state lost
4. main() not awaited - never executes
5. Result variables never created
6. System returns empty results

---

## VERIFICATION OF ROOT CAUSE

### Test 1: Check Format Endpoint Response

Would show that formatted_code != original code

### Test 2: Add Logging to exec() Call

Would show that asyncio.run() is never called for async scanners

### Test 3: Check exec_globals After exec()

Would show that df_lc, results, etc. are not in the globals

### Test 4: Bypass Format Endpoint

Send code directly to /api/scan/execute
- If using formatted_code: Still fails (same root cause)
- If using original_code: Would still fail (same async problem)

### Test 5: Add await to async Execution

Change pattern 5 execution to properly await async functions
- Would fix LC D2 execution

---

## CONCLUSION

The root cause is **multi-layered**:

1. **Code Transformation** - Original code is modified by formatting system
2. **Async Execution Conflict** - `__name__` manipulation prevents main block execution
3. **Pattern Isolation** - Pattern detection doesn't preserve global context
4. **Silent Failures** - System reports success but returns 0 results

All three issues must be fixed for complex scanners to work:
1. Don't transform sophisticated code
2. Properly execute async functions in FastAPI context
3. Preserve global execution context

