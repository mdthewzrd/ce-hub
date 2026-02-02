# Polygon API Architecture Decision Guide

## Executive Summary

**Decision:** Use **Individual API** as default for Edge.dev scanner standardizations.
**Exception:** Use **Grouped API** only when Stage 2 processes 10,000+ tickers.

---

## API Approaches Comparison

### Individual API (Default Choice)

**How it works:**
```python
# ONE call per ticker returns 5+ years of historical data
url = f"{self.base_url}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
response = self.session.get(url, params={...})
# Returns ~1,260 trading days in ONE response
```

**Characteristics:**
- ✅ Parallel execution (96 concurrent workers)
- ✅ Fewer API calls (1 call per ticker)
- ✅ More data per call (all 5+ years in one response)
- ✅ Simpler code structure
- ⚠️ May hit rate limits at massive scale

**Performance:**
- API calls: ~1,800 for 1,800 tickers
- Execution: Parallelized with 96 workers
- Speed: **FAST** for 1,000-3,000 tickers

**Best for:**
- Stage 2 processes 1,000-3,000 tickers (typical after smart filtering)
- Most scanner types
- Faster execution despite rate limiting

---

### Grouped API (Massive Scale Only)

**How it works:**
```python
# ONE call per day returns ALL tickers for that day
for date_str in trading_days:  # 1,457 trading days
    url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
    response = self.session.get(url, params={...})
    # Returns all tickers for that specific day
```

**Characteristics:**
- ✅ Massive reduction at scale (98.9% fewer calls)
- ✅ No rate limiting issues
- ✅ Better for 10,000+ tickers
- ❌ Sequential execution (no parallelization)
- ❌ More API calls overall (1 per trading day)
- ❌ More complex data aggregation

**Performance:**
- API calls: ~1,457 for 5 years of data
- Execution: Sequential (no parallelization)
- Speed: **SLOWER** for 1,000-3,000 tickers

**Best for:**
- Stage 2 processes 10,000+ tickers (massive universe)
- Minimal Stage 1 filtering
- Rate limiting is severe issue

---

## Break-Even Analysis

### API Call Count Comparison

| Stage 2 Tickers | Individual API | Grouped API | Winner |
|----------------|----------------|-------------|--------|
| 1,000 | 1,000 calls | 1,457 calls | **Individual** |
| 3,000 | 3,000 calls | 1,457 calls | **Grouped** (by calls) |
| 5,000 | 5,000 calls | 1,457 calls | **Grouped** |
| 10,000 | 10,000 calls | 1,457 calls | **Grouped** |

**But wait!** Call count isn't the only factor...

### Execution Speed Comparison

| Stage 2 Tickers | Individual API (parallel) | Grouped API (sequential) | Winner |
|----------------|---------------------------|--------------------------|--------|
| 1,000 | ~10 seconds | ~70 seconds | **Individual** (7x faster) |
| 3,000 | ~30 seconds | ~70 seconds | **Individual** (2x faster) |
| 5,000 | ~50 seconds | ~70 seconds | **Individual** (1.4x faster) |
| 10,000 | ~100 seconds + rate limiting | ~70 seconds | **Grouped** |

**Break-even point:** ~5,000-10,000 Stage 2 tickers

---

## Decision Matrix

### Use Individual API When:
- ✅ Stage 2 processes <5,000 tickers
- ✅ Stage 1 smart filtering is effective
- ✅ Speed is priority
- ✅ Simpler code structure preferred
- ✅ **This is the DEFAULT case**

### Use Grouped API When:
- ✅ Stage 2 processes >10,000 tickers
- ✅ Minimal Stage 1 filtering
- ✅ Rate limiting is blocking execution
- ✅ Can accept slower execution for massive scale
- ⚠️ **This is the EXCEPTION**

---

## Real-World Example: Backside B Scanner

### Scenario:
- Stage 1: 12,000+ tickers → ~1,800 qualified (smart filtering works great)
- Stage 2: ~1,800 tickers to process

### Comparison:

**Individual API (Winner):**
```python
# ~1,800 API calls, parallelized with 96 workers
# Time: ~30 seconds
# Code: Simple and maintainable
```

**Grouped API (Slower):**
```python
# ~1,457 API calls, sequential execution
# Time: ~70 seconds (2.3x slower!)
# Code: More complex aggregation
```

**Conclusion:** Individual API is **2-3x faster** despite making more API calls.

---

## Implementation Guidance

### Individual API Template (Default)
```python
def execute_stage2_ultra_fast(self, optimized_universe: list):
    """Process qualified tickers with individual API calls"""
    with ThreadPoolExecutor(max_workers=self.stage2_workers) as executor:
        # Parallel execution - 96 workers
        future_to_symbol = {
            executor.submit(
                self.fetch_daily_data_optimized,  # Individual API call
                symbol, self.scan_start, self.scan_end
            ): symbol
            for symbol in batch_symbols
        }
        # Process results as they complete
```

### Grouped API Template (Exception)
```python
def execute_stage2_grouped_api(self, tickers: list):
    """Process massive universe with grouped API calls"""
    # Sequential execution - one call per trading day
    for date_str in trading_days:  # 1,457 days
        url = f"{self.base_url}/v2/aggs/grouped/locale/us/market/stocks/{date_str}"
        response = self.session.get(url, params={...})
        # Aggregate all tickers for this day
```

---

## FAQ

**Q: Why not always use grouped API?**
A: Grouped API is sequential (no parallelization). For typical Stage 2 sizes (1,000-3,000 tickers), individual API with 96 parallel workers is 2-3x faster despite making more API calls.

**Q: When does grouped API become faster?**
A: Break-even is around 5,000-10,000 Stage 2 tickers. Below that, parallel individual API wins. Above that, grouped API wins.

**Q: What about rate limiting?**
A: Individual API may hit rate limits with 96 workers, but it's still faster than sequential grouped API for typical Stage 2 sizes. Only switch to grouped API if rate limiting actually blocks execution.

**Q: Should I add grouped API to my scanner?**
A: Only if Stage 2 consistently processes 10,000+ tickers. For most scanners with effective Stage 1 filtering, individual API is optimal.

---

## Template Library Standard

**Standard:** Use **Individual API** as default for all Edge.dev scanner templates.

**Rationale:**
- Stage 1 smart filtering typically reduces universe to 1,000-3,000 tickers
- Individual API is 2-3x faster for this range
- Simpler code structure
- Parallel processing scales well

**Exception:** Document grouped API variant in template notes for massive-scale scenarios.

---

**Document Version:** 1.0
**Last Updated:** 2025-12-26
**Status:** Active Standard
