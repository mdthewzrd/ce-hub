# 🚨 Upload Issue - Quick Reference Guide

## TL;DR
**Analysis IS real**, but execution **MAY BE using wrong scanner** (built-in LC/A+ instead of uploaded code).

---

## 🎯 Quick Verification Test

### Test 1: Check Backend Logs
```bash
# Run edge.dev backend
cd /Users/michaeldurante/ai\ dev/ce-hub/edge-dev/backend
python main.py

# Upload a scanner, then check logs for:
grep "uploaded_code" backend.log
grep "EXECUTION TRACE" backend.log

# Should see:
# ✅ "uploaded_code length: 1234"
# ❌ If you see "uploaded_code length: 0" → BUG CONFIRMED
```

### Test 2: Upload Test Scanner
```python
# Create test_unique_scanner.py with UNIQUE output:
PRINT_FROM = "2024-01-01"
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

def scan_symbol(symbol, start_date, end_date):
    # Unique marker that shouldn't appear in built-in scanners
    return pd.DataFrame([{
        'Ticker': symbol,
        'Date': '2024-01-01',
        'UNIQUE_TEST_FIELD': 'UPLOADED_SCANNER_TEST_12345'
    }])
```

Upload this and check if results contain `UNIQUE_TEST_FIELD`. If not → **BUG CONFIRMED**.

---

## 🔍 Critical Code Locations

### Where Upload Happens:
- **File**: `src/app/exec/components/EnhancedStrategyUpload.tsx`
- **Line**: 500 (`await onUpload(data.file, data.code, metadata)`)

### Where Execution Should Happen:
- **File**: `backend/main.py`
- **Line**: 507-512 (checks for `uploaded_code`)
- **Problem**: If `uploaded_code` not in request → falls back to built-in scanner

### The Missing Link:
- **File**: `src/app/exec/page.tsx`
- **Function**: `handleStrategyUpload` (need to verify implementation)
- **Critical**: Must pass `uploaded_code` field to scan request

---

## 🔧 Quick Fix (If Bug Confirmed)

### Fix Location: `src/app/exec/page.tsx`

```typescript
const handleStrategyUpload = async (file: File, code: string, metadata: any) => {
  // CRITICAL: Must include these fields
  const scanRequest = {
    start_date: startDate,
    end_date: endDate,
    scanner_type: "uploaded",      // ✅ Must be "uploaded"
    uploaded_code: code,            // ✅ Must include actual code
    use_real_scan: true,
    filters: {}
  };
  
  // Execute scan with uploaded code
  const result = await fastApiScanService.executeScan(scanRequest);
  
  // Display results
  setResults(result.results);
};
```

---

## 🎯 Symptoms Indicating Bug

1. **Instant Preview**: Results appear instantly after upload (under 1 second)
2. **Same Results**: Different uploaded scanners produce identical results
3. **Parameter Mismatch**: Results don't reflect uploaded scanner's parameters
4. **Scanner Type**: Results show `scan_type: "lc"` or `scan_type: "a_plus"` instead of `scan_type: "uploaded"`

---

## ✅ Verification Checklist

After implementing fix, verify:

- [ ] Backend logs show: `scanner_type=uploaded`
- [ ] Backend logs show: `uploaded_code length: <non-zero>`
- [ ] Scan execution calls `execute_uploaded_scanner_direct()`
- [ ] Results contain fields unique to uploaded scanner
- [ ] Results have `scan_type: "uploaded_pure"` or `scan_type: "uploaded_enhanced"`
- [ ] Different uploaded scanners produce different results

---

## 📊 Data Flow That Must Exist

```
Upload Form → onUpload callback → handleStrategyUpload → ScanRequest{uploaded_code} → 
Backend /api/scan/execute → run_real_scan_background → execute_uploaded_scanner_direct → 
Results from UPLOADED code
```

If any link breaks → falls back to built-in scanner → **BUG**.

---

## 🚨 Impact If Confirmed

- **Severity**: CRITICAL
- **Scope**: All uploaded custom scanners
- **Risk**: Platform appears to execute custom code but actually uses defaults
- **User Impact**: Trading decisions based on wrong scan logic

---

## 📞 Who to Contact

- **Issue**: Upload functionality not executing uploaded code
- **Owner**: Development Team
- **Priority**: P0 (Highest)
- **Related Files**: See full investigation report

---

**Status**: 🔴 Investigation in Progress  
**Full Report**: `/UPLOAD_FUNCTIONALITY_CRITICAL_INVESTIGATION.md`

