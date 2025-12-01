# Quick Fix: Multi-Scanner Splitter Frontend Bug

## The Problem in 30 Seconds

Frontend UI shows "Single Scanner Detected" instead of 3 scanners because it's looking for the wrong JSON key in the API response.

**Backend returns**: `{ "scanners": [...] }`  
**Frontend looks for**: `{ "extracted_scanners": [...] }`  

They don't match!

---

## The Fix (2 lines of code)

### File: `/src/pages/scanner-splitter.tsx`
### Line: 175

**BEFORE:**
```typescript
setExtractedScanners(extractionData.extracted_scanners || []);
```

**AFTER:**
```typescript
setExtractedScanners(extractionData.scanners || extractionData.extracted_scanners || []);
```

---

## What This Does

1. First tries to read from `extractionData.scanners` (what backend actually returns)
2. Falls back to `extractionData.extracted_scanners` (for backward compatibility)
3. Falls back to empty array if neither exists

**Result**: Frontend now reads the 3 scanners the backend correctly returns

---

## Additional Fix (Optional)

**File**: `/src/pages/scanner-splitter.tsx`  
**Line**: 410

**BEFORE:**
```typescript
<p className="text-gray-400">Creating standalone files from {detectedScanners.length} scanners...</p>
```

**AFTER:**
```typescript
<p className="text-gray-400">Creating standalone files...</p>
```

(Or reference the total_scanners from the API response)

---

## Test It

1. Upload a multi-scanner Python file
2. Should see 3 scanners listed (not "Single Scanner Detected")
3. Each scanner should show:
   - Scanner name
   - Parameter count
   - File size
   - Download button
   - Push to Formatter button

---

## Root Cause

The backend endpoint `/api/format/ai-split-scanners` at line 3771 in `main.py` returns:
```python
return {
    "success": True,
    "scanners": scanners_data,  # <-- KEY IS "scanners"
    ...
}
```

But the frontend at line 175 in `scanner-splitter.tsx` was expecting:
```typescript
extractionData.extracted_scanners || []  // <-- WRONG KEY
```

Simple mismatch, simple fix!

---

## Affected Components

- **Main UI**: Multi-Scanner Splitter page
- **Features Blocked**: 
  - Viewing extracted scanners
  - Downloading individual scanners
  - Pushing scanners to formatter
  - Creating multi-scanner projects

All will work once this single line is fixed.

