# Frontend Parameter Disconnect Analysis
## Problem: Backend Sends Correct Parameters, Frontend Shows "rolling_window"

### Executive Summary
The frontend is displaying generic "rolling_window" parameters instead of the actual scanner parameters (like "atr_mult: 4", "vol_mult: 2") that the backend is correctly extracting from uploaded code.

---

## Issue Breakdown

### 1. BACKEND: Correct Parameter Extraction
**File**: `/backend/core/parameter_integrity_system.py`
**Function**: `extract_original_signature()` (lines 43-175)

The backend correctly extracts parameters using 10 different patterns:
- Pattern 1: `custom_params = {...}`
- Pattern 2: `defaults = {...}`
- Pattern 3: `P = {...}`
- Pattern 4: `params/parameters/settings/knobs = {...}`
- Pattern 5: Direct parameter assignments (atr_mult, vol_mult, etc.)
- Pattern 6: API constants (API_KEY, BASE_URL, DATE)
- **Pattern 7: Rolling window parameters** (.rolling(window=N))
- Pattern 8: EMA span parameters (.ewm(span=N))
- Pattern 9: Date constants (START_DATE, END_DATE)
- Pattern 10: Threshold values from conditionals

**The parameters dictionary is correctly returned** as `parameter_values` in the `ParameterSignature` object.

### 2. BACKEND: Parameter Inclusion in API Response
**File**: `/backend/core/code_formatter.py`
**Function**: `format_code_with_integrity()` (lines 52-150)

The metadata is correctly created with actual parameters (line 124):
```python
metadata = {
    'original_lines': len(original_code.split('\n')),
    'formatted_lines': len(formatted_code.split('\n')),
    'scanner_type': original_sig.scanner_type,
    'parameter_count': len(original_sig.parameter_values),
    'parameters': original_sig.parameter_values,  # ✅ CORRECT - actual parameters here
    'integrity_hash': original_sig.parameter_hash,
    'processing_time': datetime.now().isoformat(),
    'infrastructure_enhancements': [...]
}
```

This FormattingResult is returned by the endpoint and serialized to JSON.

### 3. API ENDPOINT: Returns Parameters Correctly
**File**: `/backend/main.py`
**Endpoint**: `/api/format/code` (lines 810-878)

The endpoint correctly returns `result.metadata` which contains the parameters:
```python
return CodeFormattingResponse(
    success=result.success,
    formatted_code=result.formatted_code,
    scanner_type="uploaded",
    original_signature=result.original_signature,
    formatted_signature=result.formatted_signature,
    integrity_verified=result.integrity_verified,
    warnings=result.warnings,
    metadata=result.metadata,  # ✅ Contains parameters
    message=response_message
)
```

### 4. FRONTEND: Receives and Processes Parameters CORRECTLY
**File**: `/src/app/exec/components/EnhancedStrategyUpload.tsx`
**Function**: `analyzeCodeWithRenata()` (lines 140-175)

The frontend correctly:
1. Fetches from `/api/format/code` endpoint
2. Receives the response with `metadata.parameters`
3. Converts parameters to array format (lines 216-222):

```typescript
const parameterArray = Object.entries(parameters).map(([name, value]) => ({
  name,
  value: String(value),
  type: typeof value === 'number' ? 'number' : typeof value === 'boolean' ? 'boolean' : 'string',
  description: parameterConditions[name] || `Configuration parameter: ${name}`,
  isUnusual: false
}));
```

### 5. PROBLEM: Frontend Gets Wrong Parameters from Backend

**The ROOT CAUSE**: When uploaded code doesn't have scanner parameters in Patterns 1-6, the backend falls back to Pattern 7 (rolling window parameters) as fallback extraction method.

**Example Scenario**:
- User uploads a simple scanner with `atr_mult = 4` and `vol_mult = 2`
- But if these aren't in the standard dictionary format (Pattern 1-4), they may not be extracted
- The code has `.rolling(window=14)` for an EMA calculation
- Backend finds "rolling_window_14" as the only parameter
- Frontend receives `metadata.parameters = {rolling_window_14: 14}` instead of the actual parameters

### 6. Why This Happens

The parameter extraction in `parameter_integrity_system.py` (lines 86-103) has a key limitation:

```python
# Pattern 5: Direct parameter assignments (expanded list)
param_assignments = re.findall(r'(\w+)\s*=\s*([\d._]+)', original_code)
relevant_params = [
    'atr_mult', 'vol_mult', 'slope3d_min', 'slope5d_min', 'slope15d_min',
    # ... only specific known parameters
]
for param_name, param_value in param_assignments:
    if param_name in relevant_params:  # ⚠️ Only matches if in whitelist
        # Extract...
```

**Issue**: If the parameter name isn't in the hardcoded `relevant_params` list, it won't be extracted from direct assignments. The code then falls back to rolling windows and other patterns.

---

## Data Flow Diagram

```
BACKEND:
Upload Code
    ↓
parameter_integrity_system.py:extract_original_signature()
    ├─ Pattern 1-4: Dictionary formats ❌ (not found)
    ├─ Pattern 5: Direct assignments (atr_mult=4) ❌ (only if in whitelist)
    ├─ Pattern 6: API constants ❌ (not found)
    ├─ Pattern 7: Rolling windows ✅ (rolling_window_14: 14)
    └─ Patterns 8-10: Other formats
    ↓
code_formatter.py:format_code_with_integrity()
    ↓
metadata['parameters'] = {rolling_window_14: 14}  ❌ WRONG PARAMETERS
    ↓
FRONTEND:
API Response → metadata.parameters
    ↓
EnhancedStrategyUpload.tsx:analyzeCodeWithRenata()
    ↓
Display: rolling_window: 14  ❌ WRONG PARAMETERS SHOWN
```

---

## Key Files and Line Numbers

### Backend Parameter Extraction
1. **`/backend/core/parameter_integrity_system.py`**
   - Lines 43-175: `extract_original_signature()` method
   - Lines 86-103: Pattern 5 (direct assignments) - has whitelist limitation
   - Lines 110-116: Pattern 7 (rolling windows) - fallback that returns wrong params

2. **`/backend/core/code_formatter.py`**
   - Lines 119-135: Metadata creation with parameters
   - Line 124: `'parameters': original_sig.parameter_values` - correctly includes parameters

3. **`/backend/main.py`**
   - Lines 810-878: `/api/format/code` endpoint
   - Line 876: `metadata=result.metadata` - passes parameters to response

### Frontend Parameter Display
1. **`/src/app/exec/components/EnhancedStrategyUpload.tsx`**
   - Lines 140-175: `analyzeCodeWithRenata()` function
   - Line 175: `const parameters = metadata.parameters || {};`
   - Lines 216-222: Converts parameters to UI format
   - Lines 177-213: Parameter descriptions mapping

2. **`/src/app/page.tsx`**
   - Lines 1478-1482: Uses `metadata.parameters` for display
   - Lines 124-252: `extractFiltersFromCode()` tries to parse formatted code directly

---

## The Actual Problem

The frontend is NOT the problem. The frontend is correctly displaying what the backend sends in `metadata.parameters`. The problem is:

1. **Backend doesn't find actual scanner parameters** if they're not in expected format
2. **Falls back to rolling_window parameters** as a default fallback
3. **Sends rolling_window parameters to frontend** as the only parameters found
4. **Frontend displays these generic parameters** instead of the actual scanner parameters

---

## Why Parameters Are Generic

When a user uploads a custom scanner with parameters like:
```python
atr_mult = 4.0
vol_mult = 2.0
slope_min = 1.5
```

**If these aren't in one of the standard patterns, they won't be extracted**. The code only looks for:
- Dictionary definitions (`P = {...}`, `PARAMS = {...}`, etc.)
- Parameters in a hardcoded whitelist (`relevant_params` list)
- Rolling window calls (fallback)

---

## Solution Approach

The fix needs to be in the BACKEND parameter extraction:

1. **Expand Pattern 5 parameter whitelist** to include more known parameters
2. **Add a new pattern** to extract ANY parameter-like assignments (not just whitelisted ones)
3. **Improve scanner type detection** to help guide parameter extraction
4. **Add a fallback extraction** that captures any `variable = value` assignments that look like parameters

The frontend code is working correctly - it will automatically display the correct parameters once the backend sends them.

---

## Verification Steps

To verify the fix:
1. Upload a scanner with `atr_mult = 4` and `vol_mult = 2`
2. Check the `/api/format/code` response in browser DevTools
3. Verify `metadata.parameters` contains `{atr_mult: 4, vol_mult: 2}` (not rolling_window)
4. Frontend will automatically display the correct parameters

