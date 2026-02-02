# Multi-Scanner Splitter Frontend Issue - Visual Reference

## Issue at a Glance

```
┌─────────────────────────────────────────────────────────────────┐
│ Frontend shows "Single Scanner Detected"                         │
│ But backend API correctly returns 3 scanners                     │
│                                                                   │
│ ROOT CAUSE: Key mismatch in API response parsing                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## The Mismatch

```
BACKEND (✅ CORRECT)
┌──────────────────────────┐
│ HTTP Response            │
├──────────────────────────┤
│ {                        │
│   "success": true,       │
│   "scanners": [          │  <-- KEY: "scanners"
│     {...Scanner 1...},   │
│     {...Scanner 2...},   │
│     {...Scanner 3...}    │
│   ],                     │
│   "total_scanners": 3,   │
│   ...                    │
│ }                        │
└──────────────────────────┘

FRONTEND (❌ WRONG)
┌──────────────────────────┐
│ Response Handler         │
├──────────────────────────┤
│ const extractionData =    │
│   await response.json()   │
│                          │
│ setExtractedScanners(    │
│   extractionData         │
│   .extracted_scanners    │  <-- LOOKING FOR: "extracted_scanners"
│   || []                  │
│ )                        │
│                          │
│ Result: undefined        │
│ Falls back to: []        │
└──────────────────────────┘
```

---

## What Happens

```
Step 1: Backend Analysis ✅
┌─────────────────────────────────────────┐
│ User uploads multi-scanner file         │
│ Backend analyzes code                   │
│ Finds 3 distinct scanner patterns       │
│ Returns JSON with 3 scanners under      │
│ key "scanners"                          │
└─────────────────────────────────────────┘
                ↓
Step 2: Frontend Response Handling ❌
┌─────────────────────────────────────────┐
│ Frontend receives JSON response          │
│ Tries to read: response.extracted_...   │
│ Finds: undefined (key doesn't exist)     │
│ Falls back to: []                        │
│ State: extractedScanners = []            │
└─────────────────────────────────────────┘
                ↓
Step 3: UI Rendering
┌─────────────────────────────────────────┐
│ if (extractedScanners.length > 1)       │
│   ├─ Show 3 scanners (NEVER HAPPENS)    │
│   └─ extractedScanners.length = 0       │
│                                         │
│ else                                    │
│   └─ Show "Single Scanner Detected" ❌  │
└─────────────────────────────────────────┘
```

---

## File Locations

```
PROJECT ROOT
│
├── backend/
│   └── main.py
│       ├── Line 3741: @app.post("/api/format/ai-split-scanners")
│       ├── Line 3757: result = await ai_scanner_service.split_scanner_intelligent(...)
│       ├── Line 3766: scanners_data = result.get("scanners", ...)
│       └── Line 3771: "scanners": scanners_data,  ✅ RETURNS "scanners"
│
└── src/
    ├── pages/
    │   └── scanner-splitter.tsx  ❌ HAS THE BUG
    │       ├── Line 164: POST /api/format/ai-split-scanners
    │       ├── Line 174: const extractionData = await response.json()
    │       ├── Line 175: setExtractedScanners(extractionData.extracted_scanners || [])
    │       │            ↑↑↑ WRONG KEY ↑↑↑
    │       ├── Line 410: Uses detectedScanners instead of extractedScanners
    │       └── Line 530: UI logic (works correctly, just gets empty array)
    │
    └── components/
        └── projects/
            └── ScannerSelector.tsx  (downstream consumer, not directly affected)
```

---

## The One-Line Fix

```typescript
📁 File: /src/pages/scanner-splitter.tsx
📍 Line: 175

BEFORE (BROKEN):
┌─────────────────────────────────────────────────────┐
│ setExtractedScanners(extractionData.extracted_... │
│                      ^^^^^^^^^^^^^^^^           │
│                      This key doesn't exist!    │
└─────────────────────────────────────────────────────┘

AFTER (FIXED):
┌─────────────────────────────────────────────────────┐
│ setExtractedScanners(                               │
│   extractionData.scanners ||                        │
│   extractionData.extracted_scanners ||              │
│   []                                                │
│ )                                                   │
│ ✅ Reads from correct key                          │
│ ✅ Falls back to old key for compatibility         │
│ ✅ Falls back to empty array if neither exists     │
└─────────────────────────────────────────────────────┘
```

---

## Impact Timeline

```
┌─────────────────────────────────────────────────────────────┐
│ BEFORE FIX                                                   │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. User uploads file                                        │
│ 2. Backend analyzes (3 scanners found) ✅                  │
│ 3. Frontend receives data (3 scanners in JSON) ✅           │
│ 4. Frontend reads wrong key ❌                              │
│ 5. extractedScanners = [] (empty)                           │
│ 6. UI shows "Single Scanner Detected" ❌                    │
│ 7. Download/Push buttons never appear ❌                    │
│ 8. Project creation unavailable ❌                          │
│                                                              │
└─────────────────────────────────────────────────────────────┘
                           ↓
                    APPLY ONE-LINE FIX
                           ↓
┌─────────────────────────────────────────────────────────────┐
│ AFTER FIX                                                    │
├─────────────────────────────────────────────────────────────┤
│                                                              │
│ 1. User uploads file                                        │
│ 2. Backend analyzes (3 scanners found) ✅                  │
│ 3. Frontend receives data (3 scanners in JSON) ✅           │
│ 4. Frontend reads correct key ✅                            │
│ 5. extractedScanners = [scanner1, scanner2, scanner3]      │
│ 6. UI shows "✅ Extraction Complete!" ✅                   │
│ 7. All 3 scanners displayed with cards ✅                  │
│ 8. Download/Push buttons work ✅                            │
│ 9. Project creation works ✅                                │
│                                                              │
└─────────────────────────────────────────────────────────────┘
```

---

## API Response Comparison

```
WHAT FRONTEND EXPECTS          WHAT BACKEND SENDS
┌─────────────────────────┐   ┌──────────────────────┐
│ {                       │   │ {                    │
│   "success": true,      │   │   "success": true,   │
│   "extracted_scanners": │   │   "scanners": [      │  <-- DIFFERENT!
│     [                   │   │     {                │
│       {...},            │   │       ...Scanner 1   │
│       {...},            │   │     },               │
│       {...}             │   │     {                │
│     ]                   │   │       ...Scanner 2   │
│ }                       │   │     },               │
│                         │   │     {                │
│ ❌ NEVER SENT           │   │       ...Scanner 3   │
│    BY BACKEND           │   │     }                │
└─────────────────────────┘   │   ],                 │
                              │   "total_scanners": 3
                              │ }                    │
                              │                      │
                              │ ✅ WHAT BACKEND     │
                              │    ACTUALLY SENDS   │
                              └──────────────────────┘
```

---

## Console Output After Fix

```
BEFORE FIX
┌──────────────────────────────────────────────────┐
│ Frontend Response:                               │
│ {                                                │
│   success: true,                                 │
│   scanners: [{...}, {...}, {...}],              │
│   total_scanners: 3,                             │
│   ...                                            │
│ }                                                │
│                                                  │
│ Frontend extracted: []                           │
│ Reason: extractionData.extracted_scanners = nil │
└──────────────────────────────────────────────────┘

AFTER FIX
┌──────────────────────────────────────────────────┐
│ Frontend Response: (same as above)               │
│                                                  │
│ Frontend extracted: [3 scanner objects]          │
│ Reason: extractionData.scanners = [3 items]     │
└──────────────────────────────────────────────────┘
```

---

## Verification Checklist

- [ ] Backend returns `"scanners"` key (confirmed line 3771 in main.py)
- [ ] Frontend fetches from correct endpoint (confirmed line 164)
- [ ] Frontend parses wrong key (confirmed line 175)
- [ ] Empty array causes "Single Scanner Detected" (confirmed line 530)
- [ ] Fix applied to line 175
- [ ] Frontend reads `extractionData.scanners`
- [ ] Test with 3-scanner file
- [ ] All 3 scanners display in UI
- [ ] Download buttons work
- [ ] Push to Formatter buttons work
- [ ] Project creation works

---

## Related Documentation

- **Detailed Report**: `MULTI_SCANNER_SPLITTER_FRONTEND_BUG_REPORT.md`
- **Quick Fix**: `MULTI_SCANNER_SPLITTER_QUICK_FIX.md`
- **Backend Endpoint**: `main.py` lines 3741-3796

