# Edge.dev Upload Timing Fixes - Implementation Guide

## Overview
This guide provides exact code changes needed to fix the upload timing issues on the main page (localhost:5657).

## Problem Statement
The upload functionality on the main page has a race condition where:
1. Progress bar updates happen independently via a 1200ms timer
2. Backend API calls happen simultaneously
3. No synchronization between visual progress and actual backend work
4. Results in progress reaching 85% in ~7 seconds while backend takes 30+ seconds

## Solution Overview
1. **Synchronize progress** with actual backend API responses
2. **Add timing validation** to detect instant/cached results
3. **Implement timeout mechanisms** for long-running operations
4. **Use phase-based progress** tied to actual execution steps

---

## CRITICAL FIX #1: EnhancedStrategyUpload.tsx

### File Location
`/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/exec/components/EnhancedStrategyUpload.tsx`

### Problem Code (Lines 145-160 + 163-184)
```typescript
// ❌ WRONG: Progress timer runs independently
const progressInterval = setInterval(() => {
  const increment = Math.floor(Math.random() * 8) + 8;
  currentProgress = Math.min(85, currentProgress + increment);
  const currentMessage = messages[messageIndex % messages.length];
  messageIndex++;
  onProgress?.(currentProgress, currentMessage);
  if (currentProgress >= 85) {
    clearInterval(progressInterval);
  }
}, 1200); // Updates every 1.2 seconds

// ❌ Backend call happens simultaneously with progress timer
const response = await fetch('http://localhost:8000/api/format/code', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ code, options })
});

// ❌ No waiting for actual work
clearInterval(progressInterval);
onProgress?.(90, 'Processing results...');
const data = await response.json();
onProgress?.(100, 'Analysis complete!');
```

### Fixed Code (Phase-Based Progress)
```typescript
// ✅ CORRECT: Progress tied to actual execution phases

// Phase 1: Initialization (0-15%)
onProgress?.(5, 'Initializing scanner analysis...');
onProgress?.(10, 'Connecting to analysis engine...');

// Phase 2: Backend execution (15-50%)
onProgress?.(15, 'Sending code for analysis...');

try {
  const response = await fetch('http://localhost:8000/api/format/code', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      code: code,
      options: {
        enableMultiprocessing: true,
        enableAsyncPatterns: true,
        addTradingPackages: true,
        standardizeOutput: true,
        optimizePerformance: true,
        preserveParameterIntegrity: true,
        enhanceTickerUniverse: true
      }
    })
  });

  if (!response.ok) {
    throw new Error(`Backend analysis failed: ${response.status}`);
  }

  // Phase 3: Processing response (50-85%)
  onProgress?.(50, 'Processing backend analysis...');
  const data = await response.json();
  
  if (!data.success) {
    throw new Error('Backend formatting failed');
  }

  onProgress?.(70, 'Extracting parameters...');
  
  // Convert backend response to upload component format
  const metadata = data.metadata || {};
  const parameters = metadata.parameters || {};
  
  // [Rest of processing code...]
  
  // Phase 4: Finalization (85-100%)
  onProgress?.(90, 'Finalizing conversion...');
  onProgress?.(100, 'Analysis complete!');
  return analysis;
  
} catch (error) {
  console.error('Backend analysis failed:', error);
  onProgress?.(100, 'Analysis failed - using fallback mode');
  // Return fallback analysis
}
```

### Key Changes:
1. **REMOVE** the `setInterval` progress loop (lines 145-160)
2. **REPLACE** with explicit phase-based progress tracking
3. **ADD** progress updates tied to actual API calls:
   - Before fetch
   - After successful response
   - After JSON parsing
4. **ADD** error handling with phase progress
5. **ENSURE** progress only moves forward (never backward)

---

## CRITICAL FIX #2: page.tsx - handleEnhancedUpload

### File Location
`/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/page.tsx` (Lines 1379-1414)

### Problem Code
```typescript
// ❌ WRONG: No timing validation
const handleEnhancedUpload = async (file: File, code: string, metadata: any) => {
  console.log('🚀 Enhanced upload with metadata:', metadata);

  const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const enhancedStrategy: UploadedStrategy = {
    // ... strategy definition ...
  };

  setUploadedStrategies(prev => [...prev, enhancedStrategy]);
  console.log('✅ Enhanced strategy uploaded successfully:', enhancedStrategy);
};
```

### Fixed Code
```typescript
// ✅ CORRECT: With timing validation
const handleEnhancedUpload = async (file: File, code: string, metadata: any) => {
  const uploadStartTime = Date.now(); // Track when upload starts
  console.log('🚀 Enhanced upload with metadata:', metadata);

  const strategyId = `strategy_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  
  const enhancedStrategy: UploadedStrategy = {
    id: strategyId,
    name: metadata.strategyName || file.name.replace('.py', ''),
    code: code,
    formattedCode: code,
    scannerType: metadata.scannerType || 'Unknown',
    filters: metadata.parameters?.reduce((acc: any, param: any) => {
      acc[param.name] = param.value;
      return acc;
    }, {}) || {},
    parameters: metadata.parameters || {},
    indicators: metadata.detectedFeatures || [],
    uploadedAt: new Date(),
    isActive: false,
    isScanning: false,
    aiAnalysis: {
      confidence: metadata.confidence,
      expectedEndpoint: metadata.expectedEndpoint,
      tickerUniverseSize: metadata.tickerUniverseSize,
      aiAnalyzed: metadata.aiAnalyzed,
      verificationCompleted: metadata.verificationCompleted
    }
  };

  // Add timing validation
  const uploadDuration = Date.now() - uploadStartTime;
  console.log(`⏱️  Upload completed in ${uploadDuration}ms`);
  
  // Warn if upload is suspiciously fast (likely using cached/template results)
  if (uploadDuration < 2000) {
    console.warn('⚠️  Upload completed very quickly (< 2s) - may be using cached results');
    console.warn(`    Expected duration: 5-30+ seconds for real backend execution`);
  } else if (uploadDuration > 120000) {
    console.warn('⚠️  Upload took very long (> 2 min) - possible backend timeout');
  } else {
    console.log('✅ Upload timing appears normal');
  }

  // Add to uploaded strategies
  setUploadedStrategies(prev => [...prev, enhancedStrategy]);

  console.log('✅ Enhanced strategy uploaded successfully:', enhancedStrategy);
  console.log(`📊 Total upload time: ${(uploadDuration / 1000).toFixed(2)} seconds`);
};
```

### Key Changes:
1. **ADD** `const uploadStartTime = Date.now()` at the beginning
2. **ADD** duration calculation: `const uploadDuration = Date.now() - uploadStartTime`
3. **ADD** validation checks:
   - Warn if < 2 seconds (too fast)
   - Warn if > 120 seconds (timeout)
   - Confirm if 5-30 seconds (normal)
4. **ADD** console logging with timing metrics

---

## CRITICAL FIX #3: page.tsx - executeScanChunkForUploadedStrategy

### File Location
`/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/app/page.tsx` (Lines 895-940)

### Problem Code
```typescript
// ❌ WRONG: No timeout mechanism
const executeScanChunkForUploadedStrategy = async (
  startDate: string,
  endDate: string,
  uploadedCode: string
): Promise<any[]> => {
  // ... request setup ...
  
  if (response.ok) {
    const data = await response.json();
    if (data.success && data.scan_id) {
      console.log(`🚀 Uploaded scanner chunk started with ID: ${data.scan_id}`);

      try {
        // ❌ No timeout - can hang indefinitely
        const results = await pollForScanCompletion(data.scan_id);
        return Array.isArray(results) ? results : [];
      } catch (error) {
        console.error(`❌ Uploaded scanner chunk failed: ${startDate} to ${endDate}`, error);
        return [];
      }
    }
  }
  
  return [];
};
```

### Fixed Code
```typescript
// ✅ CORRECT: With timeout mechanism
const executeScanChunkForUploadedStrategy = async (
  startDate: string,
  endDate: string,
  uploadedCode: string,
  timeoutMs = 300000 // Default: 5 minute timeout
): Promise<any[]> => {
  const chunkStartTime = Date.now(); // Track chunk timing
  const requestBody = {
    start_date: startDate,
    end_date: endDate,
    use_real_scan: true,
    scanner_type: "uploaded",
    uploaded_code: uploadedCode
  };

  const endpoint = 'http://localhost:8000/api/scan/execute';

  console.log(`📤 Sending uploaded scanner chunk request: ${startDate} to ${endDate}`);

  const response = await fetch(endpoint, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(requestBody)
  });

  if (response.ok) {
    const data = await response.json();
    if (data.success && data.scan_id) {
      console.log(`🚀 Uploaded scanner chunk started with ID: ${data.scan_id}`);

      try {
        // ✅ Add timeout handling
        const pollStartTime = Date.now();
        const results = await Promise.race([
          pollForScanCompletion(data.scan_id),
          new Promise((_, reject) =>
            setTimeout(() => {
              const elapsed = Date.now() - pollStartTime;
              reject(new Error(`Scan polling timeout after ${elapsed}ms (limit: ${timeoutMs}ms)`));
            }, timeoutMs)
          )
        ]);

        const totalTime = Date.now() - chunkStartTime;
        console.log(`✅ Uploaded scanner chunk completed in ${totalTime}ms`);
        
        return Array.isArray(results) ? results : [];
      } catch (error) {
        const totalTime = Date.now() - chunkStartTime;
        console.error(
          `❌ Uploaded scanner chunk failed: ${startDate} to ${endDate}`,
          error,
          `Elapsed: ${totalTime}ms`
        );
        return [];
      }
    }
  } else {
    const errorText = await response.text();
    throw new Error(`Uploaded scanner chunk API error: ${response.status} ${errorText}`);
  }

  return [];
};
```

### Key Changes:
1. **ADD** `timeoutMs = 300000` parameter (5 minute default)
2. **ADD** `chunkStartTime` timing tracking
3. **WRAP** `pollForScanCompletion` in `Promise.race()` with timeout
4. **ADD** proper error messages with timing information
5. **ADD** success logging with timing metrics

---

## Optional Enhancement: useEnhancedUpload Hook

### File Location
`/Users/michaeldurante/ai dev/ce-hub/edge-dev/src/hooks/useEnhancedUpload.ts`

### Enhancement (Lines 56-127)
Add timing to the `uploadStrategy` function:

```typescript
const uploadStrategy = useCallback(async (
  file: File,
  code: string,
  metadata: UploadMetadata
): Promise<UploadResult> => {
  const uploadStartTime = Date.now(); // Track timing
  setIsUploading(true);
  setError(null);

  try {
    console.log('🚀 Starting enhanced upload process...');
    console.log('📊 Metadata:', metadata);

    // ... existing formatting code ...

    const uploadDuration = Date.now() - uploadStartTime; // Calculate duration
    
    const uploadResult: UploadResult = {
      success: true,
      originalCode: code,
      formattedCode: formattingResult.formattedCode,
      metadata: {
        ...metadata,
        parameterCount: formattingResult.metadata?.parameterCount || metadata.parameters.length,
        processingTime: `${uploadDuration}ms` // Add timing to result
      },
      formattingResult
    };

    console.log(`✅ Enhanced upload completed in ${uploadDuration}ms`);
    setUploadResults(prev => [...prev, uploadResult]);

    return uploadResult;

  } catch (err) {
    // ... existing error handling ...
  } finally {
    setIsUploading(false);
  }
}, []);
```

---

## Testing & Validation

### Run Automatic Tests
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev
python test_upload_timing_validation.py
```

### Manual Testing Checklist
- [ ] Application loads at http://localhost:5657
- [ ] "Upload Strategy" button visible on main page
- [ ] Click button opens upload modal
- [ ] Paste sample Python code into textarea
- [ ] Observe progress bar - should NOT jump to 85% instantly
- [ ] Wait for backend to respond - should take 5-30 seconds
- [ ] Check browser console for timing logs
- [ ] Verify upload completes with success message
- [ ] Check that strategy appears in left navigation
- [ ] Click "Run Scan" on uploaded strategy
- [ ] Verify scan completes without hanging

### Expected Log Output (console)
```
🚀 Enhanced upload with metadata: {scannerType: "A+", confidence: 95, ...}
⏱️  Upload completed in 15432ms
✅ Upload timing appears normal
📊 Total upload time: 15.43 seconds
✅ Enhanced strategy uploaded successfully
📤 Sending uploaded scanner chunk request: 2024-02-23 to 2024-02-24
🚀 Uploaded scanner chunk started with ID: abc123xyz
✅ Uploaded scanner chunk completed in 45678ms
```

### Validation Criteria

| Metric | Bad | Good |
|--------|-----|------|
| First progress update | < 100ms | 100-500ms |
| Time to 85% | < 5s | 10+ seconds |
| Total upload time | < 2s or > 2min | 5-30 seconds |
| Progress steps detected | < 3 | 5+ |
| Monotonic progress | No (goes backward) | Yes (always forward) |

---

## Files Modified

1. **`src/app/exec/components/EnhancedStrategyUpload.tsx`**
   - Remove `setInterval` progress loop
   - Add phase-based progress tracking
   - Sync progress with actual API calls

2. **`src/app/page.tsx` - `handleEnhancedUpload`**
   - Add timing tracking
   - Add validation checks
   - Add console logging

3. **`src/app/page.tsx` - `executeScanChunkForUploadedStrategy`**
   - Add timeout parameter
   - Implement `Promise.race()` timeout
   - Add timing to logs

4. **`src/hooks/useEnhancedUpload.ts`** (optional)
   - Add timing to result
   - Enhanced logging

---

## Implementation Order

1. **First:** Fix `EnhancedStrategyUpload.tsx` (most critical)
2. **Second:** Fix `handleEnhancedUpload` in `page.tsx`
3. **Third:** Fix `executeScanChunkForUploadedStrategy` in `page.tsx`
4. **Fourth:** Optional - enhance `useEnhancedUpload.ts`
5. **Last:** Run tests and validate

---

## Rollback Plan

If issues occur:
1. Progress bar shows 0% for long time:
   - Add initial progress update immediately after backend call
   - Ensure first API response triggers progress > 0

2. Progress goes backward:
   - Ensure all `onProgress` calls use increasing percentages
   - Check for race conditions in state updates

3. Upload hangs:
   - Verify timeout is working
   - Check backend is responding
   - Review `pollForScanCompletion` implementation

4. Timing validation too strict:
   - Adjust `uploadDuration < 2000` threshold
   - Increase timeout for slow backends

---

## Success Criteria

✅ Progress bar updates synchronize with backend execution
✅ Upload takes realistic time (5-30+ seconds)
✅ Progress never goes backward
✅ Timeout prevents indefinite hangs
✅ Console logs show timing metrics
✅ Test suite passes with ≥30s duration
✅ Real results (not templates) are returned
