# EDGE.DEV PRODUCTION RESTORATION PLAN
**Complete Workflow: Upload → Format → Parameters → Full Market Scan → Results → Save**

## 🎯 GOAL: Complete Production-Ready Scanner System

### User Workflow Requirements:
```
1. Upload scanner code (.py file)
2. System formats code and preserves all parameters
3. Full market scanning (4000+ stocks) with Polygon API + max threading
4. User selects date range and clicks "Run"
5. Results display in dashboard with full details
6. User can save results for later analysis
```

---

## 🏗️ CURRENT SYSTEM ARCHITECTURE

### Frontend (Next.js - Port 5657)
- **Main Dashboard**: `/src/app/exec/page.tsx`
- **Scan Modal**: `/src/app/exec/components/SystematicTrading.tsx` (922 lines)
- **Upload Component**: `/src/app/exec/components/EnhancedStrategyUpload.tsx`
- **AI Chat**: `/src/app/exec/components/RenataAgent.tsx`

### Backend Systems
- **Next.js API Routes**: `/src/app/api/systematic/scan/route.ts` (BROKEN)
- **FastAPI Backend**: `/backend/main.py` (Port 8000 - WORKING BUT UNUSED)
- **Polygon Integration**: Working in FastAPI
- **Thread Pooling**: Working in FastAPI

---

## 🚨 CRITICAL ISSUES BLOCKING PRODUCTION

### Issue #1: Upload Code Never Executes
- **Location**: `/src/app/exec/page.tsx:112-122`
- **Problem**: `handleStrategyUpload()` only converts for display, never runs
- **Impact**: User uploads are completely ignored
- **Status**: 🔴 CRITICAL

### Issue #2: Scanner Returns 0 Results Always
- **Location**: `/src/app/api/systematic/scan/route.ts:602-631`
- **Problem**: Hardcoded scan date `'2024-02-23'` (9+ months old)
- **Impact**: All tickers filtered out before scanning starts
- **Status**: 🔴 CRITICAL

### Issue #3: Working FastAPI Backend Completely Unused
- **Problem**: Frontend uses broken Next.js endpoints instead of working FastAPI
- **FastAPI Status**: ✅ Operational with threading, full universe, proper execution
- **Impact**: All advanced functionality unavailable
- **Status**: 🔴 CRITICAL

### Issue #4: Parameter Extraction Only 14% Accurate
- **Current**: Regex finds 5/36 parameters
- **Available**: AI system with 95% accuracy already built
- **Impact**: Users can't see their trading logic
- **Status**: 🟡 HIGH

### Issue #5: Limited to 85 Mega-Cap Stocks
- **Current**: Hardcoded to 85 tickers
- **Required**: 4000+ stocks for gap plays and breakouts
- **Impact**: Missing most trading opportunities
- **Status**: 🟡 HIGH

### Issue #6: No Results Persistence
- **Problem**: Results disappear on page refresh
- **Required**: Save/load functionality for analysis
- **Impact**: No historical comparison or saving work
- **Status**: 🟡 MEDIUM

---

## 🛠️ IMPLEMENTATION PLAN

### PHASE 1: CRITICAL FIXES (2-3 hours)
**Goal**: Get basic upload → scan → results working

#### Fix 1.1: Connect Frontend to Working FastAPI Backend
**File**: `/src/app/exec/components/SystematicTrading.tsx`
**Change**: Replace broken Next.js API calls with FastAPI service
```typescript
// Replace line ~150:
const response = await fetch('/api/systematic/scan', {...})
// With:
const response = await fastApiScanService.executeScan({...})
```

#### Fix 1.2: Enable Uploaded Scanner Execution
**File**: `/src/app/exec/page.tsx:112-122`
**Change**: Add actual execution to upload handler
```typescript
const handleStrategyUpload = async (file: File, code: string, metadata: any) => {
  // Current: Only UI conversion
  // Add: Actual scanner execution
  await fastApiScanService.executeScan({
    scanner_type: 'uploaded',
    uploaded_code: code,
    use_real_scan: true
  });
};
```

#### Fix 1.3: Update Scan Dates to Current
**File**: `/backend/main.py`
**Change**: Replace hardcoded dates with current calculation
```python
# Replace:
scan_date = '2024-02-23'
# With:
scan_date = datetime.now().date().strftime('%Y-%m-%d')
```

### PHASE 2: FULL MARKET EXPANSION (1-2 hours)
**Goal**: Enable 4000+ stock universe

#### Fix 2.1: Expand Ticker Universe
**File**: `/backend/config/scanner_config.py`
**Change**: Replace 85-ticker limit with full market screener
- Add NYSE, NASDAQ, AMEX universe
- Include micro/small-cap stocks ($10M+ market cap)
- Remove $500M volume requirement (use $10M)

#### Fix 2.2: Optimize Threading for Full Market
**File**: `/backend/core/scanner_engine.py`
**Verify**: Max thread pool configuration handles 4000+ stocks
**Target**: Complete full market scan in <5 minutes

### PHASE 3: PARAMETER PRESERVATION (1 hour)
**Goal**: 95% parameter detection accuracy

#### Fix 3.1: Deploy AI Parameter Extractor
**File**: `/backend/core/intelligent_parameter_extractor.py`
**Action**: Replace regex extraction with AI system
**Result**: Show all trading parameters to user

#### Fix 3.2: Update Frontend Parameter Display
**File**: `/src/app/exec/components/SystematicTrading.tsx`
**Action**: Display comprehensive parameter analysis
**Result**: User sees complete trading logic breakdown

### PHASE 4: DYNAMIC DATE RANGES (30 minutes)
**Goal**: User-selectable scan periods

#### Fix 4.1: Add Date Range Picker
**File**: `/src/app/exec/components/SystematicTrading.tsx`
**Add**: React date range component
**Default**: Last 30 trading days

#### Fix 4.2: Wire Date Selection to Backend
**Connect**: Date picker → FastAPI scan parameters
**Validation**: Ensure sufficient data availability

### PHASE 5: RESULTS PERSISTENCE (2 hours)
**Goal**: Save and reload scan results

#### Fix 5.1: Add Database Layer
**File**: `/backend/database/results_store.py`
**Add**: SQLite database for scan results
**Schema**: `scan_id, timestamp, parameters, results, metadata`

#### Fix 5.2: Save/Load UI Components
**File**: `/src/app/exec/components/ResultsManager.tsx`
**Add**: Save button, results history, load previous scans

### PHASE 6: PERFORMANCE OPTIMIZATION (1 hour)
**Goal**: Production-grade performance

#### Fix 6.1: Result Caching
**Add**: Redis/memory cache for repeated scans
**TTL**: 1 hour for same parameters

#### Fix 6.2: Progress Indicators
**Add**: Real-time progress updates via WebSocket
**Show**: Stocks processed, matches found, ETA

---

## 🎯 SUCCESS VALIDATION TESTS

### Test 1: Complete Upload Workflow
```
✅ Upload scanner.py file
✅ See 95% of parameters extracted correctly
✅ Parameters match actual code logic
✅ Upload confirmation shows code will execute
```

### Test 2: Full Market Scanning
```
✅ Select date range (last 30 days)
✅ Click "Run Scan"
✅ See progress: "Processing 4127 stocks..."
✅ Scan completes in <5 minutes
✅ Results show matches from full universe
```

### Test 3: Results Management
```
✅ Results display with stock symbols, dates, details
✅ Click "Save Results" button
✅ Results saved with timestamp
✅ Can reload saved results later
✅ Results persist across browser sessions
```

### Test 4: Different Uploaded Scanners
```
✅ Upload Scanner A → Get Results Set A
✅ Upload Scanner B → Get Results Set B
✅ Results are different (proving execution works)
✅ Both result sets can be saved and compared
```

---

## 📁 CRITICAL FILE LOCATIONS

### Frontend Files to Modify:
- `/src/app/exec/page.tsx:112-122` - Upload handler
- `/src/app/exec/components/SystematicTrading.tsx:94-216` - Main scan logic
- `/src/services/fastApiScanService.ts` - API integration service

### Backend Files to Modify:
- `/backend/main.py` - Date calculation fix
- `/backend/config/scanner_config.py` - Universe expansion
- `/backend/core/intelligent_parameter_extractor.py` - Deploy AI extraction

### Files to Remove:
- `/src/app/api/systematic/scan/route.ts` - Broken Next.js endpoint

---

## ⏱️ IMPLEMENTATION TIMELINE

### Day 1 (6-8 hours):
- **Phase 1**: Critical fixes (2-3 hours)
- **Phase 2**: Full market expansion (1-2 hours)
- **Phase 3**: Parameter preservation (1 hour)
- **Phase 4**: Dynamic date ranges (30 minutes)
- **Phase 5**: Results persistence (2 hours)

### Day 2 (2-3 hours):
- **Phase 6**: Performance optimization (1 hour)
- **Testing**: Complete validation tests (1-2 hours)
- **Documentation**: Update user guides

### Total Estimated Time: 8-11 hours

---

## 🚨 RISK MITIGATION

### Backup Strategy:
- Git branch: `edge-dev-production-fixes`
- Database backup before schema changes
- FastAPI service health monitoring

### Rollback Plan:
- Keep original Next.js endpoints as fallback
- Feature flags for new functionality
- Gradual deployment of full market scanning

### Performance Monitoring:
- Scan completion time tracking
- Memory usage monitoring during full market scans
- Error rate tracking and alerting

---

## 📊 SUCCESS METRICS

### Immediate (After Phase 1):
- ✅ Upload → execution → results workflow functional
- ✅ Scans return >0 results with current dates
- ✅ Different uploaded scanners produce different results

### Short-term (After Phase 3):
- ✅ Parameter detection: 95% accuracy
- ✅ Full market scanning: 4000+ stocks
- ✅ Scan completion: <5 minutes

### Production-ready (After Phase 5):
- ✅ Results persistence and reload functionality
- ✅ Complete workflow from upload to save working
- ✅ System handles concurrent users and large datasets

---

## 🔧 NEXT ACTIONS

1. **Start Phase 1 Implementation** - Critical fixes
2. **Test each fix incrementally** - Ensure no regressions
3. **Deploy phases sequentially** - Validate before proceeding
4. **Complete validation testing** - Confirm all requirements met

**Ready to begin implementation of Phase 1 critical fixes.**