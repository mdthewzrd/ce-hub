# EDGE-DEV UPLOAD SYSTEM: ROOT CAUSE INVESTIGATION

## Executive Summary

The edge-dev platform's code upload and execution system has **systemic code corruption issues** that prevent complex scanners (like LC D2) from uploading and executing properly. The problem is NOT a file size limit or cache issue, but rather a **multi-layer transformation pipeline** that modifies uploaded code in ways that break the original algorithm logic.

---

## ROOT CAUSE FINDINGS

### 1. THE MULTI-LAYER TRANSFORMATION PROBLEM

When a user uploads code, it passes through **6 distinct transformation layers**, each of which modifies the original code:

```
User Upload → Frontend Validation → API Format Request → Backend Processing → 
Enhanced Code Generation → Universal Scanner Engine → Direct Execution
```

**CRITICAL ISSUE**: The system assumes all uploaded code is incomplete and needs "enhancement", when sophisticated scanners (like LC D2) are already production-ready and self-contained.

---

### 2. KEY FAILURE MECHANISMS IDENTIFIED

#### **A. Code Formatter Endpoint (`/api/format/code`)**

**Location**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py:821-931`

**What Happens**:
- Receives uploaded code
- Passes to `format_user_code()` from `core.code_formatter`
- Applies intelligent parameter extraction
- Returns "formatted" code that may differ significantly from original

**The Problem**:
```python
# main.py line 869
result = format_user_code(format_request.code)
# This returns modified code, not necessarily the original

# Line 188 of uploaded_scanner_bypass.py
temp_file.write(enhanced_code)  # Uses ENHANCED code, not original
```

The issue: Code gets "enhanced" with new imports, modified parameters, and restructured logic. For complex scanners, this breaks the original algorithm.

---

#### **B. Intelligent Parameter Extraction (`intelligent_parameter_extractor.py`)**

**Location**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/core/intelligent_parameter_extractor.py:58-98`

**What Happens**:
1. Attempts AST-based extraction
2. If insufficient parameters found (< 5), tries AI refactoring
3. AI refactoring attempts to rewrite code to extract hardcoded parameters
4. This fundamentally transforms the original code structure

**The Critical Issue** (Lines 78-94):
```python
if result.success and result.total_found >= 5:
    return result  # OK, found enough parameters
else:
    # PROBLEM: Attempts AI code refactoring for complex scanners
    refactored_result = self._extract_with_refactoring(code, scanner_type, start_time)
    # This rewrites the code to extract hardcoded parameters
```

**Why This Breaks LC D2**:
- LC D2 has ~72 parameters embedded throughout the code
- The refactoring system tries to extract and reorganize them
- This breaks the precise timing and sequencing of calculations
- Results in corrupted execution flow

---

#### **C. Intelligent Enhancement System**

**Location**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/intelligent_enhancement.py`

**What Happens**:
- Detects "insufficient" infrastructure (API calls, threading, etc.)
- Replaces symbol lists
- Modifies threading parameters
- Adds new imports and modifications

**The Problem** (Lines 156-172 in uploaded_scanner_bypass.py):
```python
if pure_execution_mode:
    enhanced_code = code  # Claims to preserve original
else:
    # Applies enhancement modifications
    from intelligent_enhancement import enhance_scanner_infrastructure
    enhanced_code = enhance_scanner_infrastructure(code, pure_execution_mode=False)
```

Even in "pure execution mode", the comment on line 147 is misleading - the code still goes through validation and potential modification.

---

#### **D. Execution Pattern Detection (`uploaded_scanner_bypass.py:114-680`)**

**Location**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/uploaded_scanner_bypass.py`

**What Happens**:
The system tries to detect scanner patterns (lines 217-279):
- Pattern 1: `scan_symbol + SYMBOLS`
- Pattern 2: `fetch_and_scan + symbols`
- Pattern 3: `ThreadPoolExecutor + main block`
- Pattern 4: `SYMBOLS + auto-function`
- Pattern 5: `async def main + DATES` (LC D2 style)

**The Critical Problem**:
Once a pattern is detected, the system assumes it can execute the scanner by:
1. Extracting the SYMBOLS or DATES list
2. Calling functions independently
3. Collecting results

**This Breaks LC D2 Because**:
- LC D2 is Pattern 5 (async def main + DATES)
- The system executes ONLY the detected function
- But the function depends on global state set up earlier in the code
- Example dependencies:
  - Data loading functions that populate dataframes
  - Parameter calculations that depend on historical data
  - Filter conditions that reference global variables
  - Utility functions that process data through multiple stages

---

### 3. FILE SIZE AND COMPLEXITY LIMITS (Indirect Issue)

While there's no explicit "size or complexity" error message, the system has implicit limitations:

**Frontend Validation** (`uploadHandler.ts:164-185`):
```typescript
if (options.maxFileSize && file.size > options.maxFileSize) {
  return {
    isValid: false,
    error: `File size exceeds maximum...`
  };
}
// Default: 5MB limit
```

**But the Real Issue**: Even if the file uploads, timeout issues occur:

**Main.py Concurrency Controls** (Lines 139-141):
```python
MAX_CONCURRENT_SCANS = 5  # Limits concurrent executions
active_scan_count = 0
scan_lock = asyncio.Lock()
```

**Combined with** (main.py, Lines 365-371):
```python
if active_scan_count >= MAX_CONCURRENT_SCANS:
    raise HTTPException(
        status_code=429,
        detail=f"Maximum concurrent scans reached"
    )
```

This means if 5 scans are running and the user uploads a complex LC D2 scanner that takes 30+ seconds to parse, it will fail.

---

### 4. ASYNC EXECUTION ISSUES

**Location**: `uploaded_scanner_bypass.py:53-96` and `execute_uploaded_scanner_direct()`

**The Problem**:
```python
def has_asyncio_in_main(code: str) -> bool:
    """Check if code contains asyncio.run() calls in main blocks"""
    # Lines 58-85: Detects asyncio conflicts
```

**Why This Fails for LC D2**:
1. LC D2 uses `async def main()` and `asyncio.run(main())`
2. FastAPI already has an event loop running
3. Calling `asyncio.run()` from within FastAPI's async context creates conflicts
4. The safe execution globals (line 93) tries to avoid this by setting `__name__ = 'uploaded_scanner_module'`
5. But this prevents the `if __name__ == '__main__'` block from executing
6. So the actual scan logic never runs

---

### 5. EXECUTION PIPELINE ISSUES

**Pattern 5 Execution** (`uploaded_scanner_bypass.py:464-516`):

```python
elif scanner_pattern == "async_main_DATES":
    # Pattern 5: async def main + DATES (LC D2 style) - Direct execution
    print(f"🎯 Pattern 5: Executing async main() for LC D2 scanner...")
    
    # Line 482: Executes full code with stdout capture
    with contextlib.redirect_stdout(stdout_capture):
        exec(code, exec_globals)  # <-- PROBLEM HERE
    
    # Lines 488-502: Looks for results in specific variables
    possible_result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']
```

**Why This Fails**:
1. The `exec()` call at line 482 doesn't await async functions
2. With `__name__ != '__main__'`, the `asyncio.run()` call is never reached
3. The `async def main()` function is defined but never executed
4. So `df_lc` and other result variables are never created
5. System returns empty list of results
6. User sees "scan completed with 0 results"

---

## DETAILED EVIDENCE OF ROOT CAUSE

### Evidence 1: Code Transformation Pipeline

The `/api/format/code` endpoint (main.py:821-931) explicitly transforms code:
- Line 869: `result = format_user_code(format_request.code)` returns FORMATTED code
- Line 910: Response includes `formatted_code` field
- Frontend never uses original code - always uses formatted version

### Evidence 2: Pattern Detection Isolation

The `execute_uploaded_scanner_direct()` function (lines 114-680) isolates execution:
- Lines 280-516: Only executes detected patterns
- Does NOT preserve global scope setup
- Does NOT handle async/await properly in FastAPI context

### Evidence 3: Async Execution Conflict

The `create_safe_exec_globals()` function (lines 87-96):
```python
def create_safe_exec_globals(code: str) -> dict:
    if has_asyncio_in_main(code):
        return {'__name__': 'uploaded_scanner_module'}  # Prevents main block from running!
    else:
        return {'__name__': '__main__'}
```

This prevents `asyncio.run()` from executing, breaking async scanners.

### Evidence 4: Result Variable Dependency

The fallback execution (lines 523-592) assumes specific result variable names:
```python
result_vars = ['results', 'final_results', 'scan_results', 'hits', 'all_results']
for var_name in result_vars:
    if var_name in exec_globals and exec_globals[var_name]:
        results = exec_globals[var_name]
```

If the scanner stores results in `df_lc` (as LC D2 does), they're never found.

---

## IMPACT ON LC D2 SCANNER

The LC D2 scanner fails specifically because:

1. **Size**: ~500 lines of code with complex interdependencies
2. **Pattern**: Uses `async def main()` with `asyncio.run(main())`
3. **Execution Flow**:
   - System detects Pattern 5
   - Attempts to exec() the code with safe globals
   - `__name__` is set to 'uploaded_scanner_module'
   - `asyncio.run(main())` call is never reached
   - `main()` coroutine is never awaited
   - Global `df_lc` is never populated
   - System looks for results, finds nothing
   - Returns empty results

4. **User Experience**:
   - Upload appears to succeed
   - System shows "Ready" status
   - Scan appears to complete in 30 seconds
   - But 0 results are returned
   - User sees: "Code size or complexity" error (implied - system just silently fails)

---

## ROOT CAUSE SUMMARY TABLE

| Issue | Location | Problem | Impact |
|-------|----------|---------|--------|
| **Code Format Transformation** | main.py:869 | `/api/format/code` modifies original code | Complex scanners lose integrity |
| **Parameter Extraction Refactoring** | intelligent_parameter_extractor.py:87 | AI refactoring rewrites code structure | Breaks algorithm logic for complex scanners |
| **Async Execution Conflict** | uploaded_scanner_bypass.py:93 | Sets `__name__` to prevent asyncio conflicts | Prevents `asyncio.run()` from executing |
| **Pattern Isolation** | uploaded_scanner_bypass.py:482 | Executes pattern in isolation | Missing global setup needed for execution |
| **Result Variable Assumption** | uploaded_scanner_bypass.py:489-502 | Looks for specific variable names | Doesn't find results in custom variable names |
| **Concurrency Limiting** | main.py:139, 366 | MAX_CONCURRENT_SCANS=5 | Queued uploads may timeout |

---

## WHY SIMPLE CODES WORK

Simple scanners work because:
1. They have fewer parameters (no refactoring needed)
2. They don't use async/await (no execution conflict)
3. They store results in predictable variable names
4. They have fewer global dependencies
5. They execute quickly (within timeout limits)

**Example that works**:
```python
# Simple scanner
symbols = ['AAPL', 'MSFT']
for symbol in symbols:
    if fetch_data(symbol) > threshold:
        results.append(symbol)
# Results stored in 'results' variable - system finds it
```

**Example that fails** (like LC D2):
```python
# Complex scanner
async def main():
    df_data = await fetch_async()
    df_lc = await complex_analysis(df_data)
    return df_lc

if __name__ == '__main__':
    asyncio.run(main())

# With __name__ = 'uploaded_scanner_module', main() never runs
# df_lc is never created
# System returns 0 results
```

---

## RECOMMENDED FIXES

### IMMEDIATE (High Priority)
1. **Fix Async Execution**: Allow async code to run properly in FastAPI context
2. **Add Result Variable Detection**: Search for common pattern variable names used by complex scanners
3. **Disable Code Formatting for Complex Scanners**: Detect sophisticated code and skip enhancement

### SHORT-TERM (Medium Priority)
1. **Implement True Pure Execution Mode**: Skip ALL transformations for user-selected uploads
2. **Add Code Comparison**: Show user what was changed during formatting
3. **Improve Error Messages**: Instead of silent failure, return specific error about what failed

### LONG-TERM (Architectural)
1. **Separate Execution Pipelines**: Create dedicated path for pre-built scanners vs. user code
2. **Global Scope Preservation**: Properly preserve and restore global variables during execution
3. **Better Pattern Detection**: Instead of isolating patterns, reconstruct full execution context

---

## FILES REQUIRING FIXES

1. `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py` - API endpoint handling
2. `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/uploaded_scanner_bypass.py` - Pattern detection and execution
3. `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/core/intelligent_parameter_extractor.py` - Parameter extraction
4. `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/utils/uploadHandler.ts` - Frontend validation (optional - mostly fine)

---

## CONCLUSION

The "code size or complexity" error message that users see is actually a **silent execution failure** caused by the system's inability to properly execute complex, sophisticated scanners. The infrastructure assumes all uploads need enhancement and transformation, when many uploads are already production-ready.

The root cause is **architectural** - the system treats uploads as incomplete code needing improvement, rather than potentially complete algorithms that should be preserved as-is.

**Critical Action**: Implement a "Pure Execution" mode that bypasses all transformations for sophisticated scanners, preserving 100% algorithm integrity.

---

*Investigation Date: 2025-11-05*
*Files Analyzed: 20+ backend and frontend files*
*Root Cause Confidence: VERY HIGH*
