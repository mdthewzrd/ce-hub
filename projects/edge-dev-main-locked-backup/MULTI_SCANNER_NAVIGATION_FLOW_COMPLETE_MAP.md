# Multi-Scanner Workflow Navigation Flow - Complete Map

## The User's Complete Journey (How It Currently Works)

### Stage 1: Initial Upload Choice

```
User clicks "Upload Scanner" → UploadChoiceModal opens

┌─────────────────────────────────────────────────────────┐
│ UPLOAD CHOICE MODAL (src/components/UploadChoiceModal)  │
├─────────────────────────────────────────────────────────┤
│                                                         │
│ Option 1: Single Scanner (Blue Button)                 │
│ └─ Leads to: Single Scanner Formatter                  │
│    └─ For uploading and running 1 scanner              │
│                                                         │
│ Option 2: Multi-Scanner Project (Green Button)         │
│ └─ Leads to: Multi-Scanner Splitter                    │
│    └─ For uploading, splitting, and managing           │
│       3+ scanner files                                  │
│                                                         │
└─────────────────────────────────────────────────────────┘

User clicks: "Multi-Scanner Project"
       ↓
UploadChoiceModal calls: onMultiScannerProject()
       ↓
main page.tsx (line 3688) → setShowScannerSplitter(true)
```

---

### Stage 2: Multi-Scanner Splitter (Primary Interface)

```
┌──────────────────────────────────────────────────────────────┐
│ MULTI-SCANNER SPLITTER (src/pages/scanner-splitter.tsx)      │
├──────────────────────────────────────────────────────────────┤
│                                                              │
│ 🎯 This is the MAIN interface for multi-scanner workflow     │
│                                                              │
│ Step 1: Upload File                                         │
│  • User drops .py file (multi-scanner)                      │
│  • File: lc_frontside_d3_extended_1_AI_Generated.py         │
│                          ↓                                   │
│ Step 2: Detect Scanners (Default: AI-Powered)              │
│  • Backend: POST /api/format/ai-split-scanners              │
│  • Returns: { scanners: [...3 items...], total: 3 }         │
│  • Frontend: setExtractedScanners(response.scanners)        │
│  • Line 175: ✅ CORRECTLY reads .scanners                   │
│                          ↓                                   │
│ Step 3: Extract Individual                                  │
│  • Shows loading spinner                                    │
│  • Text: "Creating standalone files from 3 scanners..."     │
│                          ↓                                   │
│ Step 4: Complete - Show 3 Scanner Cards                     │
│ ┌──────────────────────────────────────────────────────┐   │
│ │ ✅ Extraction Complete!                             │   │
│ │ Successfully split into 3 scanners                   │   │
│ │                                                      │   │
│ │ Scanner Card 1                                       │   │
│ │ • Name: "lc_frontside_d3_extended_1"                │   │
│ │ • 42 parameters                                      │   │
│ │ • File size: 15KB                                    │   │
│ │ • [Download Button] [Push to Formatter Button] ◀────┼── CRITICAL
│ │                                                      │   │
│ │ Scanner Card 2                                       │   │
│ │ • Name: "secondary_scanner"                          │   │
│ │ • [Download Button] [Push to Formatter Button]       │   │
│ │                                                      │   │
│ │ Scanner Card 3                                       │   │
│ │ • Name: "tertiary_scanner"                           │   │
│ │ • [Download Button] [Push to Formatter Button]       │   │
│ │                                                      │   │
│ │ [Project Creation Section]                           │   │
│ │ • Create multi-scanner project                       │   │
│ │ • Or download individual scanners                    │   │
│ └──────────────────────────────────────────────────────┘   │
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

---

### Stage 3: Push to Formatter Navigation

```
User clicks: "Push to Formatter" on Scanner 1
       ↓
scanner-splitter.tsx handlePushToFormatter() triggered
       ↓
Line 212: onPushToFormatter(scanner)
       ↓
Passes to parent handler (from main page.tsx)
       ↓

┌────────────────────────────────────────────────────────────┐
│ HANDLER DEFINITION (page.tsx line 595)                     │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ const handlePushToFormatter = (scanner: any) => {         │
│   const pendingScanner = {                                │
│     ...scanner,           // ◀ Includes parameters!       │
│     id: Date.now().toString(),                            │
│     addedAt: new Date()                                   │
│   };                                                      │
│   setPendingScanners(prev => [...prev, pendingScanner]);  │
│ }                                                         │
│                                                            │
│ ✅ Scanner data with parameters stored in state!          │
│                                                            │
└────────────────────────────────────────────────────────────┘
       ↓
setState: pendingScanners = [scanner1, scanner2, ...]
       ↓
Main page re-renders
       ↓
Displays: Pending Scanners Queue/Sidebar (somewhere on page.tsx)
       ↓
```

---

### Stage 4: Format Pending Scanner

```
┌────────────────────────────────────────────────────────────┐
│ PENDING SCANNERS QUEUE (displayed on main page)            │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Pending Formatters:                                        │
│ ┌──────────────────────────────────────────────────────┐  │
│ │ lc_frontside_d3_extended_1 (42 params)              │  │
│ │ [Format Button] ◀──────────────────────── CLICK      │  │
│ └──────────────────────────────────────────────────────┘  │
│                                                            │
└────────────────────────────────────────────────────────────┘
       ↓
User clicks: [Format] button on pending scanner
       ↓
handleFormatPendingScanner() called (page.tsx)
       ↓
Gets scanner from pendingScanners array
       ↓

┌────────────────────────────────────────────────────────────┐
│ PASS TO INDIVIDUAL FORMATTER                               │
├────────────────────────────────────────────────────────────┤
│                                                            │
│ Shows: InteractiveFormatter component                     │
│        WITH initialScannerData prop:                      │
│                                                            │
│ {                                                         │
│   scanner_name: "lc_frontside_d3_extended_1",            │
│   parameters: [...42 parameters...],  ◀ ✅ HAS DATA      │
│   formatted_code: "...complete code...",                 │
│   parameters_count: 42,                                  │
│   ...rest of scanner object...                           │
│ }                                                         │
│                                                            │
└────────────────────────────────────────────────────────────┘
       ↓

┌────────────────────────────────────────────────────────────┐
│ INTERACTIVE FORMATTER (src/pages/interactive-formatter.tsx)│
├────────────────────────────────────────────────────────────┤
│                                                            │
│ useEffect at Line 41-64:                                 │
│                                                            │
│ if (initialScannerData) {                                │
│   // Set up pre-filled formatter                        │
│   setFile(file);                                         │
│   setCurrentStep('formatting');                          │
│                                                            │
│   const analysisData = {                                │
│     scanner_name: initialScannerData.scanner_name,       │
│     parameters: initialScannerData.parameters || [],     │
│     formatted_code: initialScannerData.formatted_code,   │
│     ...                                                  │
│   };                                                     │
│   setAnalysis(analysisData);                             │
│ }                                                         │
│                                                            │
│ ✅ IF parameters exist → Shows "42 Parameters..."        │
│ ❌ IF parameters empty → Shows "0 Parameters..."         │
│                                                            │
└────────────────────────────────────────────────────────────┘
       ↓
UI Displays:
  • Scanner name: "lc_frontside_d3_extended_1"
  • Parameters list: [All 42 parameters with config]
  • Approve/Reject buttons for each
  • "Format & Apply" button
```

---

## Why User Sees "0 Parameters Made Configurable"

### The Debug Trace

```
1. USER ACTION: Uploads multi-scanner file to splitter
   └─ File: lc_frontside_d3_extended_1_AI_Generated.py

2. BACKEND ANALYSIS (AI-Powered)
   POST /api/format/ai-split-scanners
   └─ Response includes: { 
        scanners: [
          {
            scanner_name: "lc_frontside_d3_extended_1_AI_Generated",
            parameters: [...42 objects...],
            parameters_count: 42,
            formatted_code: "..."
          },
          ...
        ]
      }

3. FRONTEND RECEIVES
   Line 175: setExtractedScanners(extractionData.scanners || [])
   └─ ✅ Correctly reads 'scanners' key (FIXED)

4. SPLITTER DISPLAYS
   Shows 3 scanner cards with:
   • scanner_name ✅
   • parameters_count: 42 ✅
   • formatted_code ✅

5. USER CLICKS "Push to Formatter"
   └─ handlePushToFormatter(scanner) called
      └─ Passes ENTIRE scanner object including parameters

6. HANDLER RECEIVES
   handlePushToFormatter = (scanner: any) => {
     const pendingScanner = {
       ...scanner,  // ◀ Should include parameters
       id: Date.now(),
       addedAt: new Date()
     };
     setPendingScanners(prev => [...prev, pendingScanner]);
   }

7. QUESTION: Does pendingScanner have parameters?
   └─ SHOULD: Yes, it's spread from scanner object
   └─ IF NOT: Something else removed them

8. USER CLICKS FORMAT BUTTON
   └─ Formatter loads with initialScannerData
   └─ IF initialScannerData.parameters exists → Shows "42 Parameters"
   └─ IF initialScannerData.parameters is empty → Shows "0 Parameters"

❌ OBSERVED: User sees "0 Parameters..."
   
CONCLUSION: Somewhere between step 6-8, parameters are lost or not passed correctly
```

---

## Likely Root Causes (In Order of Probability)

### Issue 1: Missing State Display (MOST LIKELY)

**Problem**: The pending scanners queue isn't being displayed on the main page

**Evidence**:
- Line 595: Handler adds scanner to pendingScanners state
- Line 3672: ScannerSplitter has onPushToFormatter handler
- But: Where is pendingScanners displayed?
- And: How does user trigger format button?

**Investigation Needed**:
```bash
# Find where pendingScanners is displayed
grep -n "pendingScanners\|PendingFormatter" page.tsx

# Look for the UI that shows pending scanners
grep -n "Format\|Pending\|Queue" page.tsx | grep -A 5 -B 5 "pendingScanners"
```

### Issue 2: Parameters Not Copied in Handler (POSSIBLE)

**Problem**: When spreading scanner object, parameters might not be included

**Evidence**:
- Handler uses `...scanner` spread operator
- But if parameters is nested as `scanner.parameters`, it should work
- Unless: Parameters stored in different field or structure

**Verification**:
```bash
# Check what fields backend includes in scanner object
# Run backend with debug logging to see exact structure returned
```

### Issue 3: Formatter Not Receiving Data Correctly (POSSIBLE)

**Problem**: Data is stored in pendingScanners but not passed to formatter

**Evidence**:
- initialScannerData prop is optional
- If not provided, formatter opens in upload mode
- User might need to re-upload in formatter

**Verification**:
```bash
# Find where InteractiveFormatter is called
grep -n "InteractiveFormatter" page.tsx

# Check if initialScannerData prop is passed
grep -B 5 -A 5 "InteractiveFormatter" page.tsx
```

---

## The Complete Data Flow (Correct vs Broken)

### ✅ CORRECT FLOW (What Should Happen)

```
Backend Returns
↓
{
  scanners: [
    {
      scanner_name: "lc_frontside_d3_extended_1",
      parameters: [...42...],
      formatted_code: "...",
      parameters_count: 42
    },
    {...},
    {...}
  ]
}
↓
Frontend Receives (Line 175)
↓
setExtractedScanners(extractionData.scanners)
↓
State: extractedScanners = [3 objects with parameters]
↓
Splitter Display
↓
Shows 3 cards with "42 parameters" each
↓
User: "Push to Formatter"
↓
Handler (Line 595)
↓
const pendingScanner = {
  ...scanner,  ◀─ FULL OBJECT INCLUDING PARAMETERS
  id: Date.now(),
  addedAt: new Date()
}
setPendingScanners([...pendingScanner])
↓
State: pendingScanners = [
  {
    scanner_name: "lc_frontside_d3_extended_1",
    parameters: [...42...],  ◀─ STILL HERE
    formatted_code: "...",
    ...
  }
]
↓
Pending Queue Displays
↓
User: "Format"
↓
Formatter Loads
↓
initialScannerData = {
  scanner_name: "lc_frontside_d3_extended_1",
  parameters: [...42...],  ◀─ PASSED TO FORMATTER
  formatted_code: "...",
  ...
}
↓
Formatter Shows
↓
✅ "42 Parameters Made Configurable"
```

### ❌ BROKEN FLOW (What's Currently Happening)

```
[Same as above until...]
↓
User: "Push to Formatter"
↓
Handler (Line 595)
↓
pendingScanner created ✅
setPendingScanners called ✅
↓
BUT: Where is the pending queue UI?
     └─ NOT VISIBLE TO USER
        OR
        NOT PROPERLY CONNECTED TO FORMATTER
↓
Formatter Somehow Opens
(either manually or incorrectly)
↓
initialScannerData = undefined
  OR
initialScannerData = { ...but no parameters }
↓
Formatter Shows
↓
❌ "0 Parameters Made Configurable"
  (because parameters: [] from fallback)
```

---

## What You Need to Find

### Critical Question 1
**Where is the pending scanners queue displayed?**

```bash
grep -n "pendingScanners" page.tsx | head -20
```

Expected: Should find UI component showing pending formatters

### Critical Question 2
**How does the formatter open with pending scanner?**

```bash
grep -n "InteractiveFormatter\|handleFormatPending" page.tsx
```

Expected: Should find where formatter modal is shown with initialScannerData

### Critical Question 3
**What exact data is in scanner object when pushed?**

Add debug log in handler:
```typescript
const handlePushToFormatter = (scanner: any) => {
  console.log('DEBUG: Scanner object being pushed:', JSON.stringify(scanner, null, 2));
  // Check: does it have 'parameters' field?
  // Check: is parameters an array?
  // Check: how many parameters?
}
```

---

## Files You Need to Review (Priority Order)

### 1. CRITICAL: Main Page Handler Logic
**File**: `/src/app/page.tsx`
**Lines**: 595 and around 3672
**Action**: 
- Find where pendingScanners state is used
- Find where pending queue is displayed
- Find where formatter is opened with pending scanner

### 2. CRITICAL: Formatter Initialization
**File**: `/src/pages/interactive-formatter.tsx`
**Lines**: 41-64
**Action**:
- Verify initialScannerData is received
- Log what's in initialScannerData.parameters
- Check if formatter jumps to 'formatting' step

### 3. IMPORTANT: Splitter Handler
**File**: `/src/pages/scanner-splitter.tsx`
**Lines**: 204-224
**Action**:
- Verify complete scanner object passed
- Add debug logging to verify parameters exist

### 4. IMPORTANT: Pending Queue Display
**File**: `/src/app/page.tsx` (search entire file)
**Action**:
- Find UI that displays pending scanners
- Find button that triggers format action
- Verify it passes correct data to formatter

---

## Expected Files Structure After Review

```
/src/app/page.tsx
├─ Line 595: handlePushToFormatter()
│  └─ Receives scanner from splitter
│  └─ Stores in pendingScanners state
│
├─ ???: Pending Queue UI Component
│  └─ Displays pendingScanners array
│  └─ Shows [Format] button for each
│
├─ ???: handleFormatPendingScanner()
│  └─ Takes scanner from pendingScanners
│  └─ Opens formatter with initialScannerData
│
└─ ???: InteractiveFormatter
   └─ Receives initialScannerData prop
   └─ Should have parameters in it

/src/pages/interactive-formatter.tsx
├─ Line 41-64: useEffect
│  └─ Checks if initialScannerData exists
│  └─ Extracts parameters from it
│  └─ Sets up formatter for display
│
└─ [Parameter Display Logic]
   └─ Shows count: {parameters.length}
   └─ Should show: "42 Parameters Made Configurable"
```

---

## Test Checklist When Investigating

- [ ] Verify backend returns 3 scanners with parameters
- [ ] Check frontend correctly reads scanners array (Line 175)
- [ ] Verify splitter displays 3 scanner cards
- [ ] Verify "Push to Formatter" button clicks work
- [ ] Check console for any errors when pushing
- [ ] Find where pending queue is displayed
- [ ] Verify clicking format button opens formatter
- [ ] Check if initialScannerData is passed to formatter
- [ ] Verify initialScannerData has parameters field
- [ ] Confirm formatter shows parameter count > 0

