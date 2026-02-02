# Edge Dev V31 - Quick Reference Guide

**Last Updated**: 2026-01-07
**Status**: ✅ Production-Ready with All Bug Fixes

---

## 🚀 Quick Start: Transform Your Scanner

### Method 1: Frontend (Recommended)

1. Open http://localhost:5665/scan
2. Upload your `.py` scanner file
3. Click "Transform to V31"
4. Download production-ready scanner

### Method 2: API

```bash
curl -X POST http://localhost:5666/api/renata_v2/transform \
  -H "Content-Type: application/json" \
  -d '{
    "code": "YOUR_CODE_HERE",
    "scanner_name": "my_scanner",
    "date_range": "2024-01-01 to 2024-12-31"
  }'
```

---

## ✅ V31 Compliance Checklist

Use this to verify transformed code has all 6 pillars:

```python
# ✅ Pillar 1: Grouped API
def fetch_grouped_daily(date: str) -> pd.DataFrame:
    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date}"
    # NOT: /v2/aggs/ticker/{ticker}

# ✅ Pillar 2: Dynamic Universe
def build_market_universe(max_tickers: int = 1000) -> list:
    # Fetches from Polygon API
    # NOT: SYMBOLS = ['AAPL', 'MSFT', ...]

# ✅ Pillar 3: Smart Filtering
def apply_smart_filters_to_dataframe(df: pd.DataFrame, params: dict):
    # Implements price, volume, ADV filters
    # Present and functional

# ✅ Pillar 4: 5-Stage Architecture
class my_scanner:
    def fetch_grouped_data(self, ...):     # Stage 1
    def apply_smart_filters(self, ...):    # Stage 2
    def detect_patterns(self, ...):        # Stage 3
    def format_results(self, ...):         # Stage 4
    def run_scan(self, ...):               # Stage 5

# ✅ Pillar 5: Parameter Detection
# Should auto-detect 15-25 parameters from P dict

# ✅ Pillar 6: Bug Fix v30
# D-2 high check uses correct column reference
```

---

## 🐛 Bug Fixes (January 2026)

### Bug #1: Missing `import os` ✅ FIXED

**Check**: Line 18 should have `import os`
```python
import os  # Required for os.getenv()
```

### Bug #2: Missing Smart Filter Function ✅ FIXED

**Check**: Should have function definition around line 224
```python
def apply_smart_filters_to_dataframe(df: pd.DataFrame, params: dict) -> pd.DataFrame:
    # 44 lines of filtering logic
```

### Bug #3: Dead Code ✅ FIXED

**Check**: No unreachable code after `return self.stage4_results`

---

## 📊 Performance Targets

| Metric | Target | How to Check |
|--------|--------|--------------|
| **API Calls** | ~2 per trading day | Count `/aggs/grouped` calls |
| **Stage 2 Retention** | 0.5-2% | Check log output |
| **Execution Time** | <5 min (1-year) | Use `time` command |
| **Memory Usage** | <2GB | Activity Monitor |

---

## 🔧 Common Issues & Solutions

### Issue: `NameError: name 'os' is not defined`

**Solution**: Update transformer (after Jan 7, 2026)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
git pull
# Restart backend
```

### Issue: Too many API calls

**Check**: Transformed code uses `/v2/aggs/grouped` NOT `/v2/aggs/ticker/`

### Issue: No results

**Verify**:
1. API keys set in `.env.local`
2. Date range has trading days
3. Parameters not too strict

---

## 📁 File Structure

```
your_scanner_v31.py (~20,000 characters)
├── Original code (preserved)
├── Smart filter function (new)
└── V31 class wrapper (new)
    ├── Stages 1-5 methods
    └── Example usage in __main__
```

---

## 🧪 Verification Commands

```bash
# Check if code compiles
python -m py_compile your_scanner.py

# Count V31 pillars
grep -c "fetch_grouped_daily\|build_market_universe\|apply_smart_filters_to_dataframe" your_scanner.py
# Should return 3+

# Check for bugs
grep -n "import os" your_scanner.py
# Should show line 18

# Run test scan
python your_scanner.py
# Should see 5-stage pipeline execute
```

---

## 📖 Full Documentation

- **Complete V31 Guide**: [RENATA_V2/V31_TRANSFORMATION_COMPLETE.md](./RENATA_V2/V31_TRANSFORMATION_COMPLETE.md)
- **API Docs**: http://localhost:5666/docs
- **Frontend**: http://localhost:5665/scan

---

## 🎯 Success Criteria

Your transformed scanner is production-ready when:

- ✅ Compiles without errors
- ✅ Has `import os` at line 18
- ✅ Has `apply_smart_filters_to_dataframe()` defined
- ✅ Uses grouped API endpoint
- ✅ Has dynamic `build_market_universe()`
- ✅ All 5 stages present and functional
- ✅ Runs end-to-end without crashes
- ✅ Logs show proper filtering statistics

---

**Quick Reference Version**: 2.0.0
**Maintained By**: CE-Hub Development Team
**Support**: See full documentation for details
