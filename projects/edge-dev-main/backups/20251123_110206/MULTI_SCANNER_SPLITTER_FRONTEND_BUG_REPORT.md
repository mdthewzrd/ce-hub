# Multi-Scanner Splitter Frontend Bug Report

## Issue Summary

**Problem**: The Multi-Scanner Splitter UI displays "Single Scanner Detected" even when the backend API correctly returns 3 detected scanners.

**Root Cause**: API response key mismatch between backend response (`"scanners"`) and frontend expectation (`"extracted_scanners"`).

**Severity**: High - Blocks entire AI Scanner Splitting workflow

**Status**: Identified and documented

---

## Problem Analysis

### What's Happening

1. User uploads a multi-scanner Python file to the frontend
2. Frontend calls `POST /api/format/ai-split-scanners` with file content
3. Backend correctly analyzes the file and returns:
   ```json
   {
     "success": true,
     "scanners": [
       { "scanner_name": "Scanner 1", "parameters": {...}, ... },
       { "scanner_name": "Scanner 2", "parameters": {...}, ... },
       { "scanner_name": "Scanner 3", "parameters": {...}, ... }
     ],
     "total_scanners": 3,
     ...
   }
   ```
4. Frontend receives response but looks for `extractionData.extracted_scanners` 
5. Key doesn't exist, so it gets undefined
6. Fallback `|| []` creates empty array
7. `extractedScanners.length === 0` triggers "Single Scanner Detected" UI instead of showing 3 scanners

### Verification

**Backend Response Key**: `"scanners"` (confirmed at `/backend/main.py` lines 3771)

**Frontend Expected Key**: `"extracted_scanners"` (attempted at `/src/pages/scanner-splitter.tsx` line 175)

---

## Code Locations

### Frontend File
**Path**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/pages/scanner-splitter.tsx`

**Problematic Code (Line 175)**:
```typescript
const extractScannersWithAI = async (code: string, filename: string) => {
  setStep('extract');
  setLoading(true);
  setAiProcessing(true);

  try {
    const response = await fetch('http://localhost:8000/api/format/ai-split-scanners', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        code: code,
        filename: filename
      })
    });

    if (response.ok) {
      const extractionData = await response.json();
      setExtractedScanners(extractionData.extracted_scanners || []);  // ❌ WRONG KEY
      setDetectedScanners([]);
      setStep('complete');
    } else {
      console.error('AI extraction failed');
      setStep('detect');
    }
  } catch (error) {
    console.error('Error with AI extraction:', error);
    setStep('detect');
  } finally {
    setLoading(false);
    setAiProcessing(false);
  }
};
```

**Secondary Issue (Line 410)**:
```typescript
{step === 'extract' && (
  <div className="text-center">
    <div className="w-12 h-12 border-4 border-yellow-500 border-t-transparent rounded-full animate-spin mx-auto mb-6"></div>
    <h2 className="text-xl font-semibold mb-4">Extracting Individual Scanners</h2>
    <p className="text-gray-400">Creating standalone files from {detectedScanners.length} scanners...</p>  {/* ❌ Should use extractedScanners */}
  </div>
)}
```

### Backend File
**Path**: `/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/main.py`

**Endpoint (Lines 3741-3796)**:
```python
@app.post("/api/format/ai-split-scanners")
async def ai_split_scanners(request: dict):
    """
    🧠 AI-Powered Scanner Splitting using OpenRouter + GLM
    """
    try:
        code = request.get("code", "")
        filename = request.get("filename", "uploaded_scanner.py")

        logger.info(f"🧠 Starting AI-powered scanner splitting for {filename}")
        logger.info(f"   - Code length: {len(code)} characters")

        # Use AI scanner service to intelligently split the scanner
        result = await ai_scanner_service.split_scanner_intelligent(code, filename)

        if result.get("success"):
            logger.info(f"✅ AI splitting successful: {result['total_scanners']} scanners generated")
            
            # Handle both 'scanners' and 'extracted_scanners' key names for compatibility
            scanners_data = result.get("scanners", result.get("extracted_scanners", []))

            return {
                "success": True,
                "message": f"AI successfully split scanner into {result['total_scanners']} individual patterns",
                "scanners": scanners_data,  # ✅ Returns data under "scanners" key
                "total_scanners": result["total_scanners"],
                "analysis_confidence": result["analysis_confidence"],
                "model_used": result["model_used"],
                "method": "AI_Powered_OpenRouter",
                "timestamp": result["timestamp"]
            }
        else:
            logger.error(f"❌ AI splitting failed: {result.get('error', 'Unknown error')}")
            return {
                "success": False,
                "message": f"AI scanner splitting failed: {result.get('error', 'Unknown error')}",
                "scanners": [],  # ✅ Also uses "scanners" for empty case
                "method": "AI_Powered_OpenRouter",
                "timestamp": result.get("timestamp")
            }
    except Exception as e:
        logger.error(f"❌ AI scanner splitting endpoint failed: {e}")
        return {
            "success": False,
            "message": f"AI scanner splitting failed: {str(e)}",
            "scanners": [],
            "method": "AI_Powered_OpenRouter"
        }
```

---

## Why "Single Scanner Detected" Appears

The complete section at lines 530-540 in `scanner-splitter.tsx`:

```typescript
{step === 'complete' && (
  <div>
    {extractedScanners.length > 1 ? (
      <div>
        {/* Show 3 scanner download/push interface */}
      </div>
    ) : (
      <div className="text-center">
        <AlertCircle className="w-16 h-16 mx-auto mb-6 text-blue-500" />
        <h2 className="text-xl font-semibold mb-4">Single Scanner Detected</h2>  {/* ❌ SHOWN HERE */}
        <p className="text-gray-400 mb-6">
          This file contains only one scanner. You can use it directly with your existing system!
        </p>
      </div>
    )}
  </div>
)}
```

Since `extractedScanners` is empty (length = 0, not > 1), the else branch executes.

---

## Fix

### Option 1: Direct Fix (Minimal Change)
Update line 175 to use the correct key:

```typescript
// Current (WRONG):
setExtractedScanners(extractionData.extracted_scanners || []);

// Fixed (CORRECT):
setExtractedScanners(extractionData.scanners || []);
```

### Option 2: Backward Compatible Fix (Recommended)
Handle both possible key names:

```typescript
// With fallback for backward compatibility:
setExtractedScanners(extractionData.scanners || extractionData.extracted_scanners || []);
```

### Option 3: Also Fix Secondary Issue
While fixing the primary issue, also update line 410 to be consistent:

```typescript
// Current (inconsistent):
<p className="text-gray-400">Creating standalone files from {detectedScanners.length} scanners...</p>

// Fixed (consistent):
<p className="text-gray-400">Creating standalone files from {extractedScanners.length || extractionData?.total_scanners || 0} scanners...</p>
```

---

## Expected Behavior After Fix

1. User uploads multi-scanner file
2. File is analyzed and 3 scanners are extracted
3. Frontend receives response with `"scanners"` key containing 3 scanner objects
4. Frontend correctly reads the array from `extractionData.scanners`
5. `extractedScanners.length === 3` (not > 1 condition is true)
6. UI shows all 3 scanners with:
   - Scanner name badge
   - Parameter count
   - File size
   - Download button
   - Push to Formatter button
7. Project creation section appears below
8. User can create a multi-scanner project or download individual scanners

---

## Testing Recommendations

### Before Fix
1. Upload a multi-scanner file (e.g., one containing 3 scanner patterns)
2. Verify that "Single Scanner Detected" message appears
3. Check browser console for any errors
4. Check Network tab - confirm backend returns `"scanners"` key with array of 3 items

### After Fix
1. Upload same multi-scanner file
2. Verify that 3 scanners are displayed with all details
3. Verify Download button works for each scanner
4. Verify Push to Formatter button works for each scanner
5. Verify Project creation form accepts project name
6. Verify project creation API call includes all 3 scanners with parameters

---

## Related Files

- **Frontend Main Component**: `/src/pages/scanner-splitter.tsx`
- **Scanner Selector Component**: `/src/components/projects/ScannerSelector.tsx` (project management)
- **Backend Endpoint**: `/backend/main.py` (lines 3741-3796)
- **Backend Service**: `ai_scanner_service_guaranteed` (provides split_scanner_intelligent method)

---

## Notes

- Backend implementation already provides good fallback handling (line 3766)
- The backend comment at line 3765 states: "Handle both 'scanners' and 'extracted_scanners' key names for compatibility"
- This comment suggests the backend was designed to support both keys, but the frontend wasn't updated to match
- No breaking changes needed - straightforward key name correction

