# Multi-Scanner Splitter Frontend User Experience Investigation

## Executive Summary

The user is experiencing confusion because they're seeing the **Individual Scanner Formatter** (used for single scanners) when they expected to see the **Multi-Scanner Splitter** (used for 3 scanners). The frontend has a critical **navigation/workflow issue** that causes users to end up in the wrong interface.

---

## The User's Frustration Point

**Their Complaint**: 
> "I uploaded a multi-scanner file and the system shows '0 Parameters Made Configurable' instead of showing me the Multi-Scanner Splitter with 3 scanners"

**What's Actually Happening**:
1. User uploads multi-scanner file → Backend correctly splits it into 3 scanners ✅
2. Frontend receives 3 scanners from API ✅
3. Frontend displays them in Multi-Scanner Splitter UI ✅
4. User clicks "Push to Formatter" on one of the 3 scanners...
5. **User gets sent to Individual Scanner Formatter** ❌
6. Individual Formatter has no parameters showing ❌
7. User thinks the Multi-Scanner Splitter is broken

---

## Frontend User Navigation Flow

### Path 1: Upload Choice Modal (Initial Entry Point)

**Location**: `/src/components/UploadChoiceModal.tsx`

**Visual**:
```
Main Page
    ↓
Click "Upload Scanner" button
    ↓
Upload Choice Modal appears with 2 options:
┌─────────────────────────────────────────────────┐
│ 1. Single Scanner (Blue button - Zap icon)      │
│    "Upload one scanner and run immediately"     │
│                                                 │
│ 2. Multi-Scanner Project (Green button - Chart) │
│    "Upload complex code, auto-split scanners"   │
└─────────────────────────────────────────────────┘
```

**Code Flow**:
```typescript
// Line 60: Single Scanner option clicked
onClick={onSingleScanner}

// Line 81: Multi-Scanner Project option clicked
onClick={onMultiScannerProject}
```

---

### Path 2: Multi-Scanner Project Workflow

**Location**: `/src/app/page.tsx` (main page component)

**When User Selects "Multi-Scanner Project":**

```
1. onMultiScannerProject() called
   └─> setShowScannerSplitter(true)  [Line 3688]
       └─> ScannerSplitter component renders [Line 3667-3674]

2. ScannerSplitter UI shows:
   ┌──────────────────────────────────┐
   │ Multi-Scanner Splitter           │
   ├──────────────────────────────────┤
   │ Progress: Upload → Detect → ... │
   │                                  │
   │ [Upload .py File Area]           │
   │ (Drag & drop or click)           │
   └──────────────────────────────────┘

3. User uploads file:
   └─> Backend analyzes (AI-Powered by default)
       └─> Returns: { scanners: [3 items], total_scanners: 3 }

4. Frontend displays 3 scanner cards:
   ┌─────────────────────────────────┐
   │ ✅ Extraction Complete!         │
   │ Successfully split into 3       │
   │                                 │
   │ [Scanner 1 Card]                │
   │ • Download button               │
   │ • "Push to Formatter" button ◀─ PROBLEM HERE
   │                                 │
   │ [Scanner 2 Card]                │
   │ • Download button               │
   │ • "Push to Formatter" button     │
   │                                 │
   │ [Scanner 3 Card]                │
   │ • Download button               │
   │ • "Push to Formatter" button     │
   └─────────────────────────────────┘
```

---

## The "Push to Formatter" Navigation Problem

### Location: `/src/pages/scanner-splitter.tsx` (Lines 204-224)

```typescript
const handlePushToFormatter = async (scanner: any) => {
  if (!onPushToFormatter) return;

  const scannerId = scanner.scanner_name;
  setPushingScanner(scannerId);

  try {
    // Call the parent handler [Line 212]
    onPushToFormatter(scanner);  // ◀ PASSED FROM PARENT
    
    // Mark as pushed
    setPushedScanners(prev => new Set([...prev, scannerId]));
  }
}
```

### The Parent Handler: `/src/app/page.tsx` (Line 3670)

```typescript
<ScannerSplitter
  onClose={() => setShowScannerSplitter(false)}
  onPushToFormatter={(scanner) => {
    // This handler is defined somewhere in the main page
    // It should open the formatter with the scanner data
  }}
/>
```

**Problem**: The handler needs to:
1. Show the Individual Scanner Formatter
2. Pass the scanner data (including parameters)
3. Pre-populate it with the scanner information

---

## The Individual Scanner Formatter Issue

### Location: `/src/pages/interactive-formatter.tsx`

**When the formatter loads with a scanner from the splitter:**

```typescript
// Lines 41-64: Handle initial scanner data
useEffect(() => {
  if (initialScannerData) {
    // Create file object from scanner data
    const blob = new Blob([initialScannerData.formatted_code], { type: 'text/plain' });
    const file = new File([blob], `${initialScannerData.scanner_name}.py`);
    
    // Set up formatter with pre-split scanner
    setFile(file);
    setCurrentStep('formatting');  // ◀ JUMPS STRAIGHT TO FORMATTING
    
    // Create analysis structure
    const analysisData = {
      scanner_name: initialScannerData.scanner_name,
      scanner_type: 'individual',
      confidence: 1.0,
      parameters: initialScannerData.parameters || [],  // ◀ USES PASSED PARAMETERS
      formatted_code: initialScannerData.formatted_code,
      is_multi_scanner: false
    };
    
    setAnalysis(analysisData);
    setFormattedCode(initialScannerData.formatted_code);
  }
}, [initialScannerData]);
```

**The Issue**: 
- If `initialScannerData.parameters` is empty or undefined
- The formatter shows "0 Parameters Made Configurable"
- This happens because the Multi-Scanner Splitter didn't properly pass parameter data

---

## Why "0 Parameters Made Configurable" Appears

### Backend Data Structure Issue

The Multi-Scanner Splitter backend returns:
```json
{
  "success": true,
  "scanners": [
    {
      "scanner_name": "lc_frontside_d3_extended_1_AI_Generated",
      "parameters": [...],  // ◀ Backend includes parameters
      "parameters_count": 42,
      "formatted_code": "...",
      ...
    },
    {...}
  ]
}
```

### Frontend Passes to Formatter

In `scanner-splitter.tsx` Line 212:
```typescript
onPushToFormatter(scanner);  // ◀ Passes entire scanner object with parameters
```

### Formatter Receives and Uses

In `interactive-formatter.tsx` Line 56:
```typescript
parameters: initialScannerData.parameters || []  // Should have data!
```

**The Problem Chain**:
1. ✅ Backend splits 3 scanners WITH parameters
2. ✅ Frontend receives 3 scanners WITH parameters  
3. ✅ Frontend displays 3 scanner cards
4. ✅ Frontend passes scanner object to formatter
5. ❌ **But the parameters might not be extracted/formatted properly**
6. ❌ Formatter receives scanner but parameters aren't in expected format
7. ❌ Shows "0 Parameters Made Configurable"

---

## Complete User Navigation Map

```
┌─────────────────────────────────────────────────────────────────┐
│ MAIN APPLICATION PAGE                                           │
│ src/app/page.tsx                                                │
└─────────────────────────────────────────────────────────────────┘
                        ↓
            [Upload Scanner Button]
                        ↓
┌─────────────────────────────────────────────────────────────────┐
│ UPLOAD CHOICE MODAL                                             │
│ src/components/UploadChoiceModal.tsx                            │
│                                                                 │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ Single Scanner         │  Multi-Scanner Project             │ │
│ │ (Blue - for 1)         │  (Green - for multiple)            │ │
│ └─────────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
        ↙                                          ↘
        │                                          │
        ↓                                          ↓
    [Single Path]                        [Multi Path - User's Choice]
                                                   ↓
                            ┌───────────────────────────────────────┐
                            │ MULTI-SCANNER SPLITTER                │
                            │ src/pages/scanner-splitter.tsx        │
                            │                                       │
                            │ Step 1: Upload File                   │
                            │ ↓                                     │
                            │ Step 2: Detect Scanners               │
                            │ ↓                                     │
                            │ Step 3: Extract Individual            │
                            │ ↓                                     │
                            │ Step 4: Show 3 Scanners ✅            │
                            │ • Download Buttons                    │
                            │ • "Push to Formatter" Buttons         │
                            │                                       │
                            │ [Download individual files]           │
                            │         ↓                             │
                            │ [Push to Formatter] ◀─ CRITICAL POINT │
                            │         ↓                             │
                            └───────────────────────────────────────┘
                                       ↓
                    ┌──────────────────────────────────────┐
                    │ INDIVIDUAL SCANNER FORMATTER         │
                    │ src/pages/interactive-formatter.tsx  │
                    │                                      │
                    │ Receives: scanner object with:       │
                    │ • scanner_name ✅                    │
                    │ • formatted_code ✅                  │
                    │ • parameters ??? ❌ MISSING/EMPTY    │
                    │                                      │
                    │ Shows: "0 Parameters..." ❌           │
                    └──────────────────────────────────────┘
```

---

## File Locations and Responsibilities

### Key Frontend Files

| File | Purpose | Status |
|------|---------|--------|
| `/src/app/page.tsx` | Main page, orchestrates ScannerSplitter | 🟡 Has state management but handler unclear |
| `/src/components/UploadChoiceModal.tsx` | Entry point for upload choice | ✅ Working correctly |
| `/src/pages/scanner-splitter.tsx` | Multi-scanner UI & splitting | ✅ Fixed (line 175) |
| `/src/pages/interactive-formatter.tsx` | Individual scanner formatter | 🟡 Receives data but parameters empty |
| `/src/components/projects/ScannerSelector.tsx` | Project management | 🟡 May be involved in data flow |

### Critical Integration Points

**1. UploadChoiceModal → Main Page** (src/app/page.tsx lines 3688)
```typescript
setShowScannerSplitter(true);  // Open multi-scanner UI
```

**2. ScannerSplitter → Formatter** (src/pages/scanner-splitter.tsx line 212)
```typescript
onPushToFormatter(scanner);  // Pass to parent handler
```

**3. Main Page Handler** (src/app/page.tsx - needs investigation)
```typescript
// Line 3670: onPushToFormatter prop on ScannerSplitter
// What does this actually do?
// Where is this handler defined?
```

---

## Debugging Questions to Answer

### Question 1: Where is the onPushToFormatter handler defined?

**Search needed**: 
```bash
grep -n "onPushToFormatter.*=>" /src/app/page.tsx
```

**Expected**: Should find where the handler opens the formatter

### Question 2: Is parameter data being properly passed?

**Check console logs**:
1. When pushing scanner from splitter
2. What data is in the scanner object?
3. Does it have `parameters` field?

### Question 3: What's the data flow from splitter to formatter?

**Trace**:
1. Backend returns scanners with parameters ✅
2. Frontend receives them in setExtractedScanners ✅
3. Frontend passes them via onPushToFormatter...
4. **Where do they go? How are they passed to formatter?**

---

## The Real Problem Summary

### Three Possible Causes

**Cause 1: Missing Handler** 🟡 LIKELY
- The `onPushToFormatter` handler on line 3670 might be undefined
- User clicks "Push to Formatter" but nothing happens or wrong thing happens
- Should navigate to formatter modal with scanner data

**Cause 2: Parameter Data Loss** 🟡 LIKELY  
- Scanner object is passed but without parameters
- Backend returns parameters, but somewhere in the chain they're lost
- Frontend receives: `{ scanners: [3 items] }` with parameters
- But only passes name + code to formatter, not parameters

**Cause 3: Formatter Not Initialized Properly** 🟡 LIKELY
- Formatter receives scanner but initialScannerData is undefined
- Falls back to upload mode instead of pre-filled mode
- Users re-upload or interact with wrong interface

### Why the User Sees "0 Parameters"

1. User uploads multi-scanner file to splitter
2. Splitter correctly shows 3 scanners ✅
3. User clicks "Push to Formatter" on scanner 1
4. **One of above causes occurs** ❌
5. Formatter opens but either:
   - It's in "upload" mode, not "formatting" mode
   - It received scanner name but not parameters
   - It shows "0 Parameters Made Configurable"
6. User sees individual formatter with no parameters
7. User thinks the splitter is broken

---

## Expected Correct Flow

```
User: "I want to use the 3-scanner file"
        ↓
Frontend: "Great! Choose how to upload"
        ↓
User: "Multi-Scanner Project please"
        ↓
Frontend: Opens Scanner Splitter
        ↓
User: Uploads multi-scanner file
        ↓
Backend: Analyzes, returns 3 scanners with all parameters
        ↓
Frontend: Displays 3 scanner cards with complete info
        ↓
User: Clicks "Push to Formatter" on Scanner 1
        ↓
Frontend: Opens formatter with pre-filled Scanner 1 data:
  • scanner_name: "lc_frontside_d3_extended_1"
  • parameters: [42 items with all configuration]
  • formatted_code: [complete scanner code]
        ↓
User: Sees "✅ 42 Parameters Made Configurable"
        ↓
User: Can review, approve, and use the scanner
```

---

## Recommended Investigation Steps

### Step 1: Find the Handler
```bash
# In /src/app/page.tsx, search for where onPushToFormatter is defined
grep -A 20 "onPushToFormatter=" page.tsx
```

### Step 2: Trace Data Flow
```bash
# Check what data is actually passed
# Add console.log in scanner-splitter.tsx line 212:
console.log('Pushing scanner to formatter:', scanner);

# Add console.log in interactive-formatter.tsx line 41:
console.log('Received initialScannerData:', initialScannerData);
```

### Step 3: Verify Backend Data
```bash
# Call the API directly
curl -X POST http://localhost:8000/api/format/ai-split-scanners \
  -H "Content-Type: application/json" \
  -d '{"code":"...","filename":"test.py"}' | jq '.scanners[0]'
```

Check if parameters are in the response.

### Step 4: Check UI Logic
In `interactive-formatter.tsx`, find where "0 Parameters Made Configurable" is displayed and trace back why it's zero.

---

## Key Code Locations to Review

1. **Main Page Handler** 
   - File: `/src/app/page.tsx` 
   - Search: "onPushToFormatter"
   - Action: Find and document what it does

2. **ScannerSplitter Pass-Through**
   - File: `/src/pages/scanner-splitter.tsx` line 212
   - Action: Verify it passes complete scanner object with parameters

3. **Formatter Initialization**
   - File: `/src/pages/interactive-formatter.tsx` lines 41-64
   - Action: Verify initialScannerData is received and has parameters

4. **Parameters Display**
   - File: `/src/pages/interactive-formatter.tsx`
   - Search: "Parameters Made Configurable"
   - Action: Find and trace why it shows 0

---

## Impact on User Experience

### Current (Broken)
- User uploads multi-scanner file ✅
- User sees 3 scanners in UI ✅
- User clicks "Push to Formatter" 
- User sees formatter with 0 parameters ❌
- User thinks system is broken ❌

### Expected (After Fix)
- User uploads multi-scanner file ✅
- User sees 3 scanners in UI ✅
- User clicks "Push to Formatter"
- User sees formatter with all 40+ parameters ✅
- User can configure and use scanner ✅

---

## Related Documentation

- **MULTI_SCANNER_SPLITTER_FRONTEND_BUG_REPORT.md** - API key mismatch issue
- **MULTI_SCANNER_SPLITTER_QUICK_FIX.md** - Quick reference for API fix
- **README_MULTI_SCANNER_BUG_INVESTIGATION.md** - Additional investigation notes

