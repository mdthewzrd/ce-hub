# Edge.dev Upload Timing Fixes - Quick Reference Guide

## Main Page Upload Location Map

### 1. Main Page Entry Point
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/page.tsx`

#### Upload Button Click Handler
- **Function:** `openUploadModal()`
- **Action:** Opens enhanced upload modal
- **Related State:** `showEnhancedUpload`

#### Main Upload Handler (CRITICAL)
- **Function:** `handleEnhancedUpload` 
- **Line:** 1379-1414
- **Purpose:** Receives uploaded file, code, and metadata after EnhancedStrategyUpload completes
- **What it does:**
  1. Creates strategy ID with timestamp
  2. Builds enhanced strategy object
  3. Adds to uploadedStrategies state
  4. Triggers Renata AI validation
  5. Formats code using CodeFormatterService

**NEEDED FIX HERE:**
```typescript
const handleEnhancedUpload = async (file: File, code: string, metadata: any) => {
  const uploadStartTime = Date.now(); // ADD THIS
  console.log('🚀 Enhanced upload with metadata:', metadata);
  
  // ... existing code ...
  
  // ADD TIMING VALIDATION
  const uploadDuration = Date.now() - uploadStartTime;
  console.log(`⏱️ Upload completed in ${uploadDuration}ms`);
  if (uploadDuration < 2000) {
    console.warn('⚠️ Upload too fast - may be using template results');
  }
};
```

#### Scan Executor for Uploaded Code (CRITICAL)
- **Function:** `executeScanChunkForUploadedStrategy`
- **Lines:** 895-940
- **Purpose:** Sends uploaded scanner code to backend for execution
- **Backend Target:** `http://localhost:8000/api/scan/execute`
- **Request Body Contains:**
  - `start_date`, `end_date` (string)
  - `use_real_scan: true`
  - `scanner_type: "uploaded"`
  - `uploaded_code: uploadedCode`

**ISSUE HERE:** No timeout mechanism - polling can hang indefinitely

**NEEDED FIX HERE:**
```typescript
const executeScanChunkForUploadedStrategy = async (
  startDate: string,
  endDate: string,
  uploadedCode: string,
  timeoutMs = 300000 // ADD: 5 minute timeout
): Promise<any[]> => {
  const startTime = Date.now(); // ADD: track timing
  // ... existing code ...
  // Add timeout handling to pollForScanCompletion call
};
```

### 2. Upload UI Component (CRITICAL)
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/EnhancedStrategyUpload.tsx`

#### Code Analysis Function
- **Function:** `analyzeCodeWithRenata`
- **Lines:** 121-301
- **Purpose:** Analyzes uploaded code and returns scanner metadata
- **Backend Target:** `http://localhost:8000/api/format/code`

**MAIN ISSUE - Progress Timer (Lines 145-160):**
```typescript
const progressInterval = setInterval(() => {
  // PROBLEM: This increments independently of backend execution
  const increment = Math.floor(Math.random() * 8) + 8;
  currentProgress = Math.min(85, currentProgress + increment);
  onProgress?.(currentProgress, currentMessage);
}, 1200); // Updates every 1.2 seconds

// PROBLEM: Backend API call happens simultaneously
const response = await fetch('http://localhost:8000/api/format/code', { ... });

// PROBLEM: No waiting for actual backend work
clearInterval(progressInterval);
onProgress?.(90, 'Processing results...');
```

**WHY THIS IS WRONG:**
1. Progress can reach 85% before backend even responds
2. If backend takes 30 seconds, progress finishes in ~7 seconds
3. Creates illusion of completion before actual work is done

**NEEDED FIX:**
Replace independent progress timer with phase-based tracking tied to actual backend calls:
```typescript
// Phase 1: Initialization (0-10%)
onProgress?.(10, 'Initializing scanner analysis...');

// Phase 2: Backend execution (10-50%)
onProgress?.(20, 'Connecting to analysis engine...');
const response = await fetch('http://localhost:8000/api/format/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, options })
});

// Phase 3: Processing response (50-85%)
if (!response.ok) throw new Error(`Backend analysis failed: ${response.status}`);
onProgress?.(70, 'Processing analysis results...');
const data = await response.json();

// Phase 4: Finalization (85-100%)
onProgress?.(90, 'Finalizing conversion...');
onProgress?.(100, 'Analysis complete!');
```

### 3. Hook Integration (OPTIONAL)
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/hooks/useEnhancedUpload.ts`

**Function:** `uploadStrategy`
- **Lines:** 56-127
- **Purpose:** Handles the actual upload with code formatting
- **Could Add:** Timing metrics to UploadResult

### 4. Testing & Validation
**File:** `/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_upload_timing_validation.py`

**What to Check:**
- Runs comprehensive timing validation
- Expected: ≥30 seconds for real execution (not 23 seconds simulated)
- Validates multiple progress steps detected
- Checks for monotonic progress (never goes backward)

**Run Test:**
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
python test_upload_timing_validation.py
```

## The Complete Upload Flow on Main Page

```
1. User sees "Upload Strategy" button on main page
   ↓
2. Click button → openUploadModal() → showEnhancedUpload = true
   ↓
3. EnhancedStrategyUpload modal renders
   - User selects file or pastes code
   ↓
4. File/code is read by FileReader
   ↓
5. analyzeCodeWithRenata() is called (THE PROBLEMATIC FUNCTION)
   - ⚠️ Progress timer starts (1200ms intervals)
   - Sends to http://localhost:8000/api/format/code
   - ⚠️ No synchronization with actual backend execution
   - Returns analysis (parameters, scanner type, confidence)
   ↓
6. UploadPreviewModal shows the analysis results
   ↓
7. User clicks "Upload Strategy" in preview
   ↓
8. handleEnhancedUpload() is called with file, code, and metadata (NO TIMING CHECKS)
   - Creates strategy object
   - Adds to uploadedStrategies
   - Renata AI validation
   - Code formatting
   ↓
9. Strategy appears in left navigation
   ↓
10. User clicks "Run Scan" on the strategy
    ↓
11. executeScanChunkForUploadedStrategy() is called (HAS NO TIMEOUT)
    - Sends to http://localhost:8000/api/scan/execute
    - Polls for completion with pollForScanCompletion
    - ⚠️ Can hang indefinitely if backend doesn't respond
    ↓
12. Scan results appear in main area
```

## Implementation Priority

### CRITICAL (Do First)
1. **Fix EnhancedStrategyUpload.tsx** - Remove independent progress timer, synchronize with actual backend
2. **Add timing to handleEnhancedUpload** - Track how long upload actually takes
3. **Add timeout to executeScanChunkForUploadedStrategy** - Prevent infinite hangs

### IMPORTANT (Do After)
4. Add phase-based progress tracking
5. Improve error messages and recovery

### NICE-TO-HAVE (Do Last)
6. Add timing metrics to useEnhancedUpload hook
7. Enhanced logging and debugging

## Testing Your Fixes

### Manual Test
1. Start edge-dev: `npm run dev`
2. Navigate to http://localhost:5657
3. Click "Upload Strategy" button
4. Paste sample Python code
5. Watch progress bar - should take 10+ seconds
6. Check browser console for timing logs
7. Verify upload completes and results appear

### Automated Test
```bash
python test_upload_timing_validation.py
```

Expected results:
- ✅ Upload takes ≥30 seconds
- ✅ Multiple progress steps detected
- ✅ Progress is monotonic (never goes backward)
- ✅ Real results (not template data)

## Files Created/Updated
- **Analysis:** `/Users/michaeldurante/ai dev/ce-hub/EDGE_DEV_UPLOAD_TIMING_FIXES_ANALYSIS.md`
- **This Guide:** EDGE_DEV_UPLOAD_QUICK_REFERENCE.md
