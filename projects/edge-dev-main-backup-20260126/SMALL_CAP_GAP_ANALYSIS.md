# Small Cap Gap Scanner - Renata Formatting Analysis

## Original Code Structure

**Type:** Procedural Script (not OOP class)
**Purpose:** Small-cap gap scanner with EMA validation
**Lines:** ~240 lines
**Style:** Research/one-time execution script

### Key Characteristics

1. **No class structure** - Linear execution script
2. **Hardcoded paths** - `D:/TRADING/Backtesting/...`
3. **Embedded API keys** - Security concern
4. **Multi-stage filtering process:**
   - Stage 1: Load historical data from feather file
   - Stage 2: Calculate `trig_day` flags (pre-market gap criteria)
   - Stage 3: Filter by date range
   - Stage 4: For each trigger, fetch live Polygon data
   - Stage 5: Validate EMA200 condition (close ≤ EMA200 * 0.8)
   - Stage 6: Output to CSV

5. **Iterative API calls** - `iterrows()` with individual HTTP requests per ticker
6. **Complex date arithmetic** - Uses `pandas_market_calendars`
7. **Mixed concerns** - Data loading, filtering, API fetching, file output all in one script

### Entry Conditions

```python
# Primary trigger (trig_day):
pm_high / prev_close - 1 >= 0.5    # 50% pre-market gap
gap >= 0.5                           # 50% gap
open / prev_high - 1 >= 0.3          # 30% above previous high
pm_vol >= 5_000_000                   # 5M pre-market volume
prev_close >= 0.75                    # Minimum price

# Secondary filter (EMA validation):
close <= ema200 * 0.8                 # At least 20% below 200-day EMA
d2 == 0                               # No previous 30%+ day
not within 30 days of bag_day         # No recent triggers
```

### Expected Renata Behavior (Current Implementation)

Based on current Renata templates and training, here's what I expect:

#### ✅ What Renata Will Handle Well:
1. **Parameter detection** - Will find numeric parameters (0.5, 0.3, 5M, etc.)
2. **Basic formatting** - Add docstrings, improve variable names
3. **API optimization** - Group Polygon API calls where possible
4. **Parameter extraction** - Create configurable parameters

#### ❌ What Renata Will Struggle With:
1. **Script vs Class confusion** - Will try to wrap it in a TradingScanner class
   - This is WRONG for this type of script
   - The script is meant to be a one-time research tool, not a reusable scanner

2. **Hardcoded file paths** - Won't know how to handle:
   ```python
   FILENAME = "D:/TRADING/Backtesting/filtered/20_plus/temp/data_2019_current_temp.feather"
   ```

3. **Multi-stage data flow** - The script has:
   - Initial data load → calculate flags → filter → API validation → output
   - Renata's templates expect: `load_data() → scan() → return results`

4. **Iterative API pattern** - The `iterrows()` loop with API calls:
   ```python
   for i, row in df_trig_day.iterrows():
       # Make API call for each row
   ```
   Renata will try to batch this, but the logic requires sequential validation

5. **Mixed data sources** - Combines:
   - Local feather file (historical intraday data)
   - Polygon API (daily price data)
   - Polygon API (market cap data)

6. **CSV output instead of return** - Script writes to file, doesn't return DataFrame

### Current Renata Template Mismatch

Renata's existing templates are designed for:
```python
class TradingScanner:
    def __init__(self):
        self.min_price = 10.0
        self.min_volume = 1_000_000

    def load_data(self):
        # Fetch data from API
        pass

    def scan(self, df):
        # Apply filters
        return results
```

But this scanner is:
```python
# Load local data
df = pd.read_feather(FILENAME)

# Calculate triggers
df['trig_day'] = ...

# Filter by date
df_trig_day = df[...]

# For each trigger, validate with API
for i, row in df_trig_day.iterrows():
    # API call + EMA check
    # Update df_trig_day

# Save to CSV
df_trig_day.to_csv("D1 Gap.csv")
```

---

## Test Plan

### Step 1: User Tests in Chat
User will upload `test_small_cap_gap_scanner.py` to Renata chat and observe:
- How she identifies the scanner type
- What template she applies
- What parameters she extracts
- How she handles the script structure

### Step 2: Analyze Output
We'll review:
- Did she wrap it in a class? (incorrect for this type)
- Did she preserve the multi-stage logic?
- How did she handle hardcoded paths?
- What did she do with the API calls?
- Did she maintain the CSV output?

### Step 3: Enhancement Plan
Based on results, create new capabilities:
1. **Scanner type detection** - Distinguish between:
   - Reusable class-based scanners (Backside B style)
   - Research scripts (this style)
   - Data preprocessing scripts
   - Validation scripts

2. **New template** - Script-style scanner template:
   ```python
   """
   Small Cap Gap Scanner - Research Script
   Type: Gap Scanner
   Data: Local feather file + Polygon API validation
   Output: CSV file
   """
   ```

3. **Path handling** - Make paths configurable:
   ```python
   INPUT_FILE = "{DATA_DIR}/temp/data_2019_current_temp.feather"
   OUTPUT_FILE = "{OUTPUT_DIR}/D1_Gap_{DATE}.csv"
   ```

4. **Parameter organization** - Group parameters by stage:
   - Stage 1: Initial filtering parameters
   - Stage 2: EMA validation parameters
   - Stage 3: API configuration

5. **Preserve logic flow** - Don't force into class if it doesn't fit

---

## Expected Issues vs Solutions

| Issue | Current Behavior | Needed Enhancement |
|-------|-----------------|-------------------|
| Script vs Class | Forces into TradingScanner class | Detect script style and preserve structure |
| Hardcoded paths | Tries to parameterize or leaves as-is | Create configurable path template |
| Multi-stage logic | Tries to simplify to single scan() | Preserve stage-by-stage flow |
| Iterative APIs | Tries to batch all calls | Recognize sequential validation requirement |
| CSV output | Tries to return DataFrame | Offer both return and file output options |
| Mixed data sources | Confuses the load_data() pattern | Handle hybrid local+API data sources |

---

## Next Steps

1. **User tests scanner in chat** - Upload and observe Renata's formatting
2. **Capture the formatted output** - Save both code and metadata
3. **Analyze gaps** - Document what went wrong/right
4. **Create enhancement PRD** - Detailed requirements for script-style support
5. **Implement enhancements** - Add new capabilities to Renata
6. **Add to knowledge base** - Store this as new scanner pattern type

---

**Status:** Ready for testing
**Test File:** `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/test_small_cap_gap_scanner.py`
**Expected Outcome:** Identify gaps in Renata's current capabilities for script-style scanners
