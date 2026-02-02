# EdgeDev AI Agent Implementation Map
**How The Agent Actually Writes Code & Builds Strategies**

**Version**: 1.0
**Date**: 2026-01-29
**Status**: COMPLETE IMPLEMENTATION GUIDE

---

## Table of Contents

1. [The Map: Code Writing Pipeline](#the-map-code-writing-pipeline)
2. [Creative Mode](#creative-mode)
3. [Technical Implementation](#technical-implementation)
4. [Data Flow Architecture](#data-flow-architecture)
5. [Step-by-Step Example](#step-by-step-example)
6. [Implementation Checklist](#implementation-checklist)

---

## The Map: Archon-Powered Agent

### Overview: How Agent Uses Archon to Build Strategy Systems

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    ARCHON-POWERED AGENT SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  USER: "I want a gap fade strategy with pyramiding"                  │
│       ↓                                                                 │
│  [ORCHESTRATOR] Routes to subagents                                   │
│       ↓                                                                 │
│  [SUBAGENTS] Query Archon                                              │
│   ├── "Retrieve gap fade patterns"                                     │
│   ├── "Retrieve pyramiding best practices"                           │
│   ├── "Retrieve past similar projects"                                │
│   └── "Retrieve what worked/what didn't"                             │
│       ↓                                                                 │
│  [ARCHON] Returns relevant knowledge                                   │
│       ↓                                                                 │
│  [SUBAGENTS] Generate code based on knowledge                          │
│   ├── NOT from templates (rigid)                                      │
│   ├── BUT from understanding patterns (flexible)                       │
│   └── CAN combine concepts creatively                                  │
│       ↓                                                                 │
│  [VALIDATOR] Tests and stores results back to Archon                  │
│       ↓                                                                 │
│  [ARCHON] Learning grows over time                                    │
│   ├── What works added to knowledge                                  │
│   ├── What doesn't work added to knowledge                            │
│   └── Agent gets smarter each project                                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Key Difference**:

**Template Approach** (Rigid): Agent has pre-built code, fills in blanks
**Our Approach** (Flexible): Agent has knowledge from Archon, generates from understanding

### Stage 1: Pattern Recognition (Your Description → Technical Specs)

**Input**: Your plain English description
```
"I want stocks gapping up 3%+ after running for 5 days,
holding the high tight, then fading by afternoon"
```

**Agent Processing Steps**:

1. **Extract Keywords**:
```python
# Agent identifies:
{
    "trigger": "gap up 3%+",
    "setup": "running for 5 days",
    "confirmation": "holding high tight",
    "signal": "fading by afternoon",
    "direction": "short"  # Mean reversion fade
}
```

2. **Map to Pattern Type**:
```python
# Agent knowledge base lookup:
pattern_type = "Multi-Day Momentum Fade (DMR)"
# Based on: multi-day run + gap trigger + fade signal
```

3. **Define Technical Specs**:
```python
specs = {
    "timeframe": "multi-day (D-5 to D0)",
    "setup_window": "D-5 to D-2: uptrend",
    "d0_trigger": "gap >= 3%",
    "d0_confirmation": "hold high within tight range",
    "d0_signal": "fade intraday (weak close)",
    "direction": "SHORT"
}
```

4. **Ask Clarification Questions** (if needed):
```
Agent: "I understand this as a DMR-style fade setup.
       Quick clarification:
       1. 'Holding high tight' - what range? 0.5%? 1%?
       2. 'Fading by afternoon' - close below open? Specific time?
       3. Do you have A+ examples for calibration?"
```

**Output**: Technical specification document

---

### Stage 2: Parameter Extraction (Specs → Concrete Values)

**Two Paths:**

#### Path A: From A+ Examples (Preferred)

**Input**: Your reference trades
```
NVDA Jan 8, 2025
TSLA Dec 3, 2024
AAPL Nov 15, 2024
```

**Agent Processing**:

1. **Fetch Market Data**:
```python
# For each A+ example:
data = fetch_polygon_data(
    ticker="NVDA",
    date="2025-01-08",
    lookback=20  # Need D-5 to D+5 for analysis
)
```

2. **Calculate All Parameters**:
```python
# NVDA Jan 8, 2025 analysis:
params = {
    # Gap metrics
    "gap_pct": 4.2,           # (open - prev_close) / prev_close
    "gap_dollar": 7.85,       # open - prev_close
    "gap_vs_range": 0.62,     # gap / prev_range

    # Setup strength
    "d_minus_5_to_d_minus_2_change": 15.2,  # % move over setup period
    "prev_close_range": 0.58,  # prev day's range %
    "prev_close_above_open": True,  # Green D-1

    # Hold tightness
    "hold_range": 0.31,       # (high - open) / open  (0.31%)
    "hold_time": "10:30 AM to 1:00 PM",  # Held high for 2.5 hours

    # Fade signal
    "close_below_open": True,
    "close_change": -1.82,    # % from open to close
    "close_vs_high": -2.13,   # % from high to close

    # Volume
    "volume_ratio": 2.15,     # vs 30-day average
    "volume_absolute": 185_000_000,

    # Extension
    "rsi_14": 68.5,
    "ema9_distance": 1.2,     # as multiple of ATR
}
```

3. **Apply Tolerance**:
```python
# Extract parameters with ±10% tolerance:
extracted_params = {
    "min_gap": 4.2 * 0.9,     # 3.78% → round to 3.8%
    "max_hold_range": 0.31 * 1.1,  # 0.34% → round to 0.35%
    "min_volume_ratio": 2.15 * 0.9,  # 1.94 → round to 2.0
    "min_uptrend_days": 5,
    "require_weak_close": True,
    "min_close_below_open": 1.5,  # 1.82 * 0.9 = 1.64 → round to 1.5%
}
```

4. **Validate All A+ Examples**:
```python
# Test each A+ example against extracted parameters:
results = []
for example in a_plus_examples:
    if passes_all_conditions(example, extracted_params):
        results.append("PASS")
    else:
        results.append("FAIL - condition X didn't pass")

# Expected: All A+ examples MUST pass
# If any fail, widen tolerance or mark example as "imperfect"
```

#### Path B: From Description (No A+ Examples)

**Agent Uses Starting Parameters**:
```python
# Based on pattern type knowledge base:
starting_params = {
    "min_gap": 0.03,           # 3% (from description)
    "max_hold_range": 0.005,   # 0.5% (interpret "tight")
    "min_uptrend_days": 5,
    "require_weak_close": True,
    "min_close_below_open": 0.01,  # 1% (interpret "fade")
    "min_volume_ratio": 1.5,
}
```

**Output**: Parameter dictionary ready for code generation

---

### Stage 3: Template Selection (Pattern → Code Structure)

**Agent Decision Tree**:

```python
def select_code_structure(pattern_type, complexity, performance_needs):
    """Agent decides which code structure to use."""

    # Simple pattern, quick test → Standalone script
    if complexity == "simple" and not performance_needs:
        return "standalone_script"
        # 50-100 lines, single file, quick execution

    # Medium complexity, modular → Function-based
    elif complexity == "medium":
        return "function_based"
        # Multiple functions, reusable, clear structure

    # Production, performance critical → V31 class-based
    elif complexity == "complex" or performance_needs:
        return "v31_class_based"
        # 5-stage pipeline, parallel processing, optimized
```

**For Our Example** (DMR pattern, full market scan):
```python
# Agent selects: V31_CLASS_BASED
# Reasons:
# - Scanning entire market (need performance)
# - Multi-day setup (need historical buffer)
# - Production use (need reliability)

# Template: V31ScannerBase
# With: DMRCustomization
```

**Output**: Code template selected

---

### Stage 4: Code Assembly (Template + Parameters → Production Code)

**Step-by-Step Assembly**:

#### Step 1: Import V31 Template
```python
# Agent loads base template:
from v31_templates import V31ScannerBase

class DMRFadeScanner(V31ScannerBase):
    """V31 Scanner: Multi-Day Momentum Fade

    Pattern: Stock runs up 5+ days, gaps up, holds high, then fades
    Direction: SHORT (mean reversion)
    """
```

#### Step 2: Insert Parameters
```python
    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        super().__init__(api_key, d0_start, d0_end)

        # Insert extracted parameters:
        self.params = {
            # Gap requirements
            'min_gap': 0.038,          # 3.8% (from A+ examples)
            'min_gap_vs_range': 0.5,   # Gap >= 50% of prev range

            # Setup requirements
            'min_uptrend_days': 5,
            'min_uptrend_pct': 0.10,   # 10% move over setup
            'require_green_d1': True,   # D-1 must be green

            # Hold requirements
            'max_hold_range': 0.0035,   # 0.35% (from A+ examples)

            # Fade signal
            'require_weak_close': True,
            'min_close_below_open': 0.015,  # 1.5% below open

            # Volume
            'min_volume_ratio': 2.0,

            # Smart filters
            'price_min': 10.0,
            'adv20_min_usd': 5_000_000,
        }
```

#### Step 3: Implement Pattern Logic
```python
    def detect_patterns(self, df):
        """Stage 3b: DMR fade detection."""
        results = []

        for ticker, ticker_df in df.groupby('ticker'):
            d0_data = ticker_df[
                ticker_df['date'].between(self.d0_start, self.d0_end)
            ]

            for idx, row in d0_data.iterrows():
                # DMR Pattern Logic (inserted by agent):

                # 1. Check setup (D-5 to D-2 uptrend)
                setup_condition = (
                    (row['uptrend_days'] >= self.params['min_uptrend_days']) &
                    (row['uptrend_pct'] >= self.params['min_uptrend_pct']) &
                    (row['prev_green'] == self.params['require_green_d1'])
                )

                # 2. Check D0 gap trigger
                gap_condition = (
                    (row['gap'] >= self.params['min_gap']) &
                    (row['gap_vs_range'] >= self.params['min_gap_vs_range'])
                )

                # 3. Check hold tightness
                hold_condition = (
                    (row['hold_range'] <= self.params['max_hold_range'])
                )

                # 4. Check fade signal
                fade_condition = (
                    (row['close_below_open'] == self.params['require_weak_close']) &
                    (row['close_change_pct'] <= -self.params['min_close_below_open']) &
                    (row['volume_ratio'] >= self.params['min_volume_ratio'])
                )

                # All conditions met → SHORT signal
                if setup_condition and gap_condition and hold_condition and fade_condition:
                    results.append({
                        'ticker': ticker,
                        'date': row['date'],
                        'entry_price': row['close'],  # Short at close
                        'stop_price': row['high'] * 1.02,  # Above gap high
                        'target_price': row['prev_close'] * 0.97,  # Below prev close
                        'gap': row['gap'],
                        'hold_range': row['hold_range'],
                        'fade_strength': abs(row['close_change_pct']),
                    })

        return results
```

#### Step 4: Add Feature Computations
```python
    def compute_full_features(self, df):
        """Stage 3a: DMR-specific features."""

        # Per-ticker operations (V31 Principle 3):
        for ticker, group in df.groupby('ticker'):
            # Setup strength features
            group['uptrend_days'] = group['close'].pct_change().rolling(5).apply(
                lambda x: (x > 0).sum()
            )
            group['uptrend_pct'] = (
                group['close'].shift(1) / group['close'].shift(6) - 1
            )
            group['prev_green'] = group['close'].shift(1) > group['open'].shift(1)

            # Gap features
            group['gap'] = group['open'] / group['close'].shift(1) - 1
            group['gap_vs_range'] = (
                (group['open'] - group['close'].shift(1)) / group['range'].shift(1)
            )

            # Hold features (intraday)
            group['hold_range'] = (group['high'] - group['open']) / group['open']

            # Fade features
            group['close_below_open'] = group['close'] < group['open']
            group['close_change_pct'] = group['close'] / group['open'] - 1

            # Volume features
            group['volume_avg30'] = group['volume'].rolling(30).mean()
            group['volume_ratio'] = group['volume'] / group['volume_avg30']

            df.loc[df['ticker'] == ticker] = group

        return df
```

#### Step 5: Add Validation Method
```python
    def validate_a_plus_examples(self, a_plus_examples):
        """Validate that A+ examples are found."""
        results = self.run_scan(
            d0_start=min(ex['date'] for ex in a_plus_examples) - timedelta(days=5),
            d0_end=max(ex['date'] for ex in a_plus_examples) + timedelta(days=5),
        )

        validation_report = []
        for example in a_plus_examples:
            found = any(
                r['ticker'] == example['ticker'] and
                r['date'] == example['date']
                for r in results
            )

            if found:
                validation_report.append(f"✓ {example['ticker']} {example['date']}: FOUND")
            else:
                # Debug: Why didn't it trigger?
                validation_report.append(
                    self._debug_missing_example(example)
                )

        return validation_report

    def _debug_missing_example(self, example):
        """Show why an A+ example didn't trigger."""
        # Fetch data for that ticker/date
        data = self._fetch_example_data(example)

        # Check each condition
        checks = {
            'gap': data['gap'] >= self.params['min_gap'],
            'hold_range': data['hold_range'] <= self.params['max_hold_range'],
            'volume_ratio': data['volume_ratio'] >= self.params['min_volume_ratio'],
            # ... etc
        }

        # Return detailed breakdown
        failed = [k for k, v in checks.items() if not v]
        return f"✗ {example['ticker']} {example['date']}: FAILED - {', '.join(failed)}"
```

**Output**: Complete V31 scanner code (production-ready)

---

### Stage 5: Validation (Code → Testing)

**Agent Testing Pipeline**:

```python
# Step 1: Validate A+ examples
validation_results = scanner.validate_a_plus_examples(a_plus_examples)

# Expected output:
# ✓ NVDA Jan 8, 2025: FOUND
# ✓ TSLA Dec 3, 2024: FOUND
# ✗ AAPL Nov 15, 2024: FAILED - gap (2.8% < 3.8%)

# Step 2: If failures, ask user
agent: "AAPL Nov 15 didn't trigger. Gap was 2.8%, threshold is 3.8%.
       Options:
       1. Lower min_gap to 2.5% (includes AAPL)
       2. Keep min_gap at 3.8% (AAPL is not a perfect example)

       What would you prefer?"

user: "Lower it to 2.5%"

# Step 3: Update and re-test
scanner.params['min_gap'] = 0.025
validation_results = scanner.validate_a_plus_examples(a_plus_examples)

# ✓ All A+ examples now found
```

**Output**: Validated scanner code

---

### Stage 6: Dashboard Integration (Code → Visualization)

**Agent Workflow**:

```python
# Step 1: Upload scanner to EdgeDev backend
response = edgedev_client.upload_scanner(
    code=scanner_code,
    scanner_name="DMR_Fade_Scanner",
    params=scanner.params
)

# Step 2: Run scanner
scan_results = edgedev_client.run_scan(
    scanner_name="DMR_Fade_Scanner",
    d0_start="2024-01-01",
    d0_end="2025-01-29"
)

# Step 3: Format results for dashboard
formatted_results = edgedev_client.format_for_chart(
    results=scan_results,
    marker_config={
        'gap_open': {'color': 'green', 'symbol': 'circle', 'size': 10},
        'entry': {'color': 'red', 'symbol': 'triangle-down', 'size': 12},
        'stop': {'color': 'green', 'line': True},
        'target': {'color': 'yellow', 'line': True},
    }
)

# Step 4: Launch dashboard
edgedev_client.launch_dashboard(
    url="http://localhost:5665/scan",
    results=formatted_results
)

# Dashboard opens in browser with:
# - All 47 scan results
# - Click any result to see chart
# - Markers show gap, entry, stop, target
# - Day navigation (D-5 to D+14)
```

**Output**: Visual results in EdgeDev dashboard

---

## Creative Mode

### What Is Creative Mode?

**Creative Mode** = Agent explores variations and new ideas without strict constraints

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    CREATIVE MODE vs PRECISION MODE                     │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  PRECISION MODE                    CREATIVE MODE                        │
│  ────────────────                  ────────────────                     │
│  • A+ anchored                     • Exploratory                        │
│  • Tight parameters                • Parameter variations               │
│  • Validated examples              • "What if" scenarios                │
│  • Production code                 • Experimental code                 │
│  • Reproducible                    • Discovery focused                 │
│  • "This exact pattern"            • "Similar patterns"                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### When to Use Creative Mode

**Use Creative Mode When**:
1. **Exploring new patterns** - "What if we tried X?"
2. **Brainstorming** - "Show me variations of this setup"
3. **Discovery** - "Find interesting patterns I haven't seen"
4. **Parameter exploration** - "What happens if we relax/tighten X?"
5. **Market regime testing** - "How does this perform in different conditions?"

**Use Precision Mode When**:
1. **Production trading** - Exact pattern you want to trade
2. **A+ examples available** - You have reference trades
3. **Backtesting** - Need reproducible results
4. **Live scanning** - Daily scan execution

### Creative Mode Features

#### Feature 1: Parameter Exploration

```
You: "Creative mode: Show me variations of the DMR fade pattern"

Agent: "Exploring DMR fade variations...

       Generating 5 variations:

       Variation 1: RELAXED GAPS
       • min_gap: 2.0% (vs 3.8% in precision)
       • Expected: 2-3x more setups, lower quality

       Variation 2: TIGHTER HOLD
       • max_hold_range: 0.2% (vs 0.35% in precision)
       • Expected: Fewer setups, higher quality

       Variation 3: NO VOLUME FILTER
       • min_volume_ratio: 1.0 (vs 2.0 in precision)
       • Expected: More setups in small caps

       Variation 4: STRONGER FADE
       • min_close_below_open: 2.5% (vs 1.5% in precision)
       • Expected: Fewer setups, stronger signals

       Variation 5: EXTENDED SETUP
       • min_uptrend_days: 8 (vs 5 in precision)
       • Expected: Fewer but more overextended setups

       Running all 5 variations on 2024 data...

       Results:
       Var 1 (Relaxed): 127 setups, avg quality: 6.2/10
       Var 2 (Tight hold): 31 setups, avg quality: 7.8/10
       Var 3 (No volume): 89 setups, avg quality: 5.9/10
       Var 4 (Strong fade): 23 setups, avg quality: 8.1/10
       Var 5 (Extended): 18 setups, avg quality: 8.4/10

       Recommendation: Var 5 looks most promising for further testing.
       Would you like to see charts for any variation?"
```

#### Feature 2: Pattern Discovery

```
You: "Creative mode: Find interesting gap patterns I haven't considered"

Agent: "Searching for gap patterns in your historical data...

       Analyzing 10,000+ gap events from 2024...
       Clustering by characteristics...

       Found 3 interesting clusters:

       Cluster A: 'Monday Gap Reversal'
       • Gaps up on Monday >= 2%
       • Friday before was strong (+2%+)
       • Fades by Monday close 65% of time
       • 47 occurrences in 2024

       Cluster B: 'Earnings Gap Explosion'
       • Gaps up >= 5% on earnings
       • Previous day: inside day (range < 1%)
       • Continues (doesn't fade) 70% of time
       • 23 occurrences in 2024
       • Note: This is LONG continuation, not short

       Cluster C: 'Pre-market Fakeout'
       • PM gap >= 3%, but opening gap < 1%
       • High volume in pre-market
       • Fades intraday 58% of time
       • 31 occurrences in 2024

       Which cluster would you like to explore further?"
```

#### Feature 3: What-If Scenarios

```
You: "Creative mode: What if we combined DMR with extension criteria?"

Agent: "Combining DMR + Extension criteria...

       Hypothesis: Multi-day run + gap + overextended = stronger fade

       New hybrid pattern:
       • D-5 to D-2: Uptrend (DMR)
       • D-1: Extended (EMA9 distance >= 1.5x ATR)
       • D0: Gap >= 3%
       • D0: Hold tight
       • D0: Fade

       Testing on 2024 data...

       Results:
       • Original DMR: 47 setups
       • Hybrid (DMR+Extension): 19 setups

       Quality comparison:
       • Original DMR: Avg fade -1.8%
       • Hybrid: Avg fade -2.7% (stronger!)

       Win rate comparison (if short at close, cover next day open):
       • Original DMR: 62%
       • Hybrid: 74%

       The hybrid looks promising! Fewer setups but higher quality.

       Ready to validate with A+ examples or explore more variations?"
```

#### Feature 4: Market Regime Testing

```
You: "Creative mode: How does DMR perform in different market conditions?"

Agent: "Testing DMR across market regimes...

       Analyzing DMR performance in:
       • Bull markets (SPY +10%+ in 3 months)
       • Bear markets (SPY -10%+ in 3 months)
       • Choppy markets (SPY ±5% in 3 months)

       Results:

       Bull Markets (Jan-Mar 2024):
       • 23 setups
       • Avg fade: -1.2% (weaker)
       • Win rate: 54% (lower)
       • Reason: Momentum continues, fades are weak

       Bear Markets (Apr-Jun 2024):
       • 18 setups
       • Avg fade: -2.8% (stronger!)
       • Win rate: 78% (higher!)
       • Reason: Markets fearful, gaps get faded

       Choppy Markets (Jul-Sep 2024):
       • 6 setups
       • Avg fade: -1.9%
       • Win rate: 67%

       Insight: DMR performs BEST in bear/fearful markets
                Consider running only when VIX >= 25 or SPY -5% in last month

       Would you like me to add a market regime filter to the scanner?"
```

### Creative Mode Implementation

**Agent Architecture for Creative Mode**:

```python
class CreativeModeEngine:
    """Generates and tests variations of trading patterns."""

    def explore_parameter_variations(self, base_pattern, num_variations=5):
        """Generate parameter variations."""
        variations = []

        for i in range(num_variations):
            # Vary one parameter at a time
            variation = self._vary_single_parameter(base_pattern)
            variations.append(variation)

        return variations

    def discover_patterns(self, data, min_occurrences=20):
        """Discover new patterns via clustering."""
        # Use unsupervised learning to find clusters
        # of similar market events
        pass

    def test_hypothesis(self, hypothesis, data):
        """Test a 'what if' scenario."""
        # Build scanner from hypothesis
        # Run on historical data
        # Compare to base pattern
        pass

    def analyze_market_regimes(self, pattern, market_data):
        """Test pattern across different market conditions."""
        # Segment data by market regime
        # Test pattern in each regime
        # Compare performance
        pass
```

---

## Technical Implementation

### Component 1: Conversation Engine

**Purpose**: Understand user's description and extract requirements

```python
class ConversationEngine:
    """Natural language understanding for trading patterns."""

    def process_input(self, user_input):
        """Convert user description to technical specs."""

        # Step 1: Extract keywords
        keywords = self._extract_keywords(user_input)

        # Step 2: Identify pattern type
        pattern_type = self._identify_pattern_type(keywords)

        # Step 3: Parse requirements
        requirements = self._parse_requirements(user_input, pattern_type)

        # Step 4: Check for ambiguity
        ambiguous = self._check_ambiguity(requirements)

        # Step 5: Ask clarification if needed
        if ambiguous:
            return self._ask_clarification(ambiguous)

        # Step 6: Return technical specs
        return {
            'pattern_type': pattern_type,
            'requirements': requirements,
            'clarification_needed': False
        }

    def _extract_keywords(self, text):
        """Extract trading-related keywords."""
        keywords = {
            'trigger': [],      # gap, break, close, etc.
            'setup': [],        # uptrend, extended, etc.
            'confirmation': [], # volume, hold, etc.
            'signal': [],       # fade, continue, etc.
            'direction': None,  # long or short
            'timeframe': None,  # intraday, daily, multi-day
        }

        # NLP processing to extract keywords
        # ... (implementation details)

        return keywords

    def _identify_pattern_type(self, keywords):
        """Map keywords to known pattern types."""

        # Pattern matching logic
        if 'multi-day' in keywords['timeframe'] and 'gap' in keywords['trigger']:
            return 'DMR'
        elif 'gap' in keywords['trigger'] and 'resistance' in keywords['setup']:
            return 'FBO'
        # ... etc

        return 'UNKNOWN'
```

### Component 2: Code Generation Engine

**Purpose**: Convert specs to V31 production code

```python
class CodeGenerationEngine:
    """Generate V31-compliant scanner code."""

    def generate_scanner(self, specs, params, template_type='v31_class'):
        """Generate complete scanner code."""

        # Step 1: Load template
        template = self._load_template(template_type)

        # Step 2: Insert parameters
        code = self._insert_parameters(template, params)

        # Step 3: Insert pattern logic
        code = self._insert_pattern_logic(code, specs['pattern_type'])

        # Step 4: Insert feature computations
        code = self._insert_feature_computations(code, specs)

        # Step 5: Insert validation method
        code = self._insert_validation_method(code)

        # Step 6: Format and return
        return self._format_code(code)

    def _load_template(self, template_type):
        """Load code template from library."""
        templates = {
            'v31_class': 'V31_CLASS_TEMPLATE.py',
            'function_based': 'FUNCTION_TEMPLATE.py',
            'standalone': 'STANDALONE_TEMPLATE.py',
        }
        return open(templates[template_type]).read()

    def _insert_parameters(self, template, params):
        """Insert parameters into template."""
        # Replace placeholders with actual values
        for key, value in params.items():
            template = template.replace(f'{{params.{key}}}', str(value))
        return template
```

### Component 3: Validation Engine

**Purpose**: Test code against A+ examples

```python
class ValidationEngine:
    """Validate scanner code against A+ examples."""

    def validate_scanner(self, scanner_code, a_plus_examples):
        """Test scanner finds all A+ examples."""

        # Step 1: Execute scanner code
        scanner = self._execute_scanner(scanner_code)

        # Step 2: Run on date range covering A+ examples
        results = scanner.run_scan(
            d0_start=min(ex['date'] for ex in a_plus_examples) - timedelta(days=5),
            d0_end=max(ex['date'] for ex in a_plus_examples) + timedelta(days=5),
        )

        # Step 3: Check each A+ example
        validation_report = []
        for example in a_plus_examples:
            found = self._check_example_in_results(example, results)

            if found:
                validation_report.append({
                    'ticker': example['ticker'],
                    'date': example['date'],
                    'status': 'PASS',
                })
            else:
                # Debug: Why didn't it trigger?
                debug_info = self._debug_missing_example(scanner, example)
                validation_report.append({
                    'ticker': example['ticker'],
                    'date': example['date'],
                    'status': 'FAIL',
                    'debug': debug_info,
                })

        return validation_report

    def _debug_missing_example(self, scanner, example):
        """Analyze why an example didn't trigger."""
        # Fetch data for that example
        data = scanner._fetch_example_data(example)

        # Check each condition
        failed_conditions = []
        for condition_name, condition_func in scanner.conditions.items():
            if not condition_func(data):
                failed_conditions.append({
                    'condition': condition_name,
                    'value': data.get(condition_name),
                    'required': scanner.params.get(condition_name),
                })

        return failed_conditions
```

### Component 4: EdgeDev Integration

**Purpose**: Connect to EdgeDev platform

```python
class EdgeDevClient:
    """Integration with EdgeDev platform."""

    def __init__(self, backend_url='http://localhost:5666',
                 dashboard_url='http://localhost:5665'):
        self.backend_url = backend_url
        self.dashboard_url = dashboard_url

    def upload_scanner(self, code, scanner_name, params):
        """Upload scanner code to EdgeDev backend."""
        response = requests.post(
            f'{self.backend_url}/api/scanner/upload',
            json={
                'name': scanner_name,
                'code': code,
                'params': params,
            }
        )
        return response.json()

    def run_scan(self, scanner_name, d0_start, d0_end):
        """Execute scanner and return results."""
        response = requests.post(
            f'{self.backend_url}/api/scan/execute',
            json={
                'scanner': scanner_name,
                'd0_start': d0_start,
                'd0_end': d0_end,
            }
        )
        return response.json()['results']

    def format_for_chart(self, results, marker_config):
        """Format results for dashboard visualization."""
        formatted = []
        for result in results:
            formatted.append({
                'ticker': result['ticker'],
                'date': result['date'],
                'markers': [
                    {
                        'type': 'gap_open',
                        'price': result['gap_open'],
                        'color': marker_config['gap_open']['color'],
                        'symbol': marker_config['gap_open']['symbol'],
                    },
                    {
                        'type': 'entry',
                        'price': result['entry_price'],
                        'color': marker_config['entry']['color'],
                        'symbol': marker_config['entry']['symbol'],
                    },
                    # ... more markers
                ]
            })
        return formatted

    def launch_dashboard(self, url, results):
        """Launch EdgeDev dashboard with results."""
        # Open browser to dashboard URL
        import webbrowser
        webbrowser.open(f'{url}?results={json.dumps(results)}')
```

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE DATA FLOW                                  │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  YOUR INPUT                                                           │
│     ↓                                                                  │
│  CONVERSATION ENGINE (Understand → Extract Specs)                     │
│     ↓                                                                  │
│  PARAMETER EXTRACTION (From A+ examples or description)                │
│     ↓                                                                  │
│  TEMPLATE SELECTION (Choose code structure)                            │
│     ↓                                                                  │
│  CODE GENERATION (Assemble V31 scanner)                               │
│     ↓                                                                  │
│  VALIDATION (Test against A+ examples)                                │
│     ↓                                                                  │
│  EDGEDEV UPLOAD (Send code to backend)                                │
│     ↓                                                                  │
│  SCAN EXECUTION (Run on market data)                                  │
│     ↓                                                                  │
│  DASHBOARD VIEWING (Show charts with markers)                          │
│     ↓                                                                  │
│  YOUR VALIDATION (Review results, provide feedback)                    │
│     ↓                                                                  │
│  ITERATION (Refine based on feedback)                                 │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Step-by-Step Example

### Complete Workflow: From Idea to Dashboard

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    STEP-BY-STEP EXAMPLE                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ YOU: "I want stocks that gap up at least 3% after running up for 5+   │
│       days, hold the high tight (within 0.5%), then fade by close"     │
│                                                                         │
│ AGENT: "I understand - multi-day momentum fade pattern.               │
│         Key characteristics:                                           │
│         • D-5 to D-2: Uptrend (5+ days)                               │
│         • D0: Gap >= 3%                                                │
│         • D0 intraday: Hold high within 0.5% range                     │
│         • D0 close: Fade (weak close)                                  │
│         Direction: SHORT                                               │
│                                                                       │
│         Before I build, I need A+ examples for calibration.            │
│         Do you have reference trades?"                                 │
│                                                                         │
│ YOU: "NVDA Jan 8, 2025, TSLA Dec 3, 2024, AAPL Nov 15, 2024"           │
│                                                                         │
│ AGENT: "Perfect. Analyzing A+ examples..."                             │
│                                                                       │
│         [Fetching Polygon data for NVDA Jan 8, 2025]                   │
│         • Gap: 4.2%                                                     │
│         • Hold range: 0.31%                                            │
│         • Close change: -1.82%                                         │
│         • Volume ratio: 2.15x                                          │
│         • Uptrend days: 6                                              │
│                                                                       │
│         [Fetching Polygon data for TSLA Dec 3, 2024]                   │
│         • Gap: 3.8%                                                     │
│         • Hold range: 0.28%                                            │
│         • Close change: -2.15%                                         │
│         • Volume ratio: 2.05x                                          │
│         • Uptrend days: 5                                              │
│                                                                       │
│         [Fetching Polygon data for AAPL Nov 15, 2024]                  │
│         • Gap: 2.8% ✗ (below 3%)                                      │
│         • Hold range: 0.35%                                            │
│         • Close change: -1.45%                                         │
│         • Volume ratio: 1.95x ✗ (below 2.0x)                          │
│         • Uptrend days: 5                                              │
│                                                                       │
│         Extracted parameters (with tolerance):                         │
│         • min_gap: 3.5% (from NVDA 4.2%, TSLA 3.8%)                   │
│         • max_hold_range: 0.35% (from all examples)                   │
│         • min_close_below_open: 1.5% (from all examples)              │
│         • min_volume_ratio: 2.0x (from NVDA, TSLA)                    │
│         • min_uptrend_days: 5                                          │
│                                                                       │
│         Issue: AAPL Nov 15 has gap 2.8% (below 3.5%)                   │
│                and volume 1.95x (below 2.0x)                          │
│         Options:                                                       │
│         1. Lower min_gap to 2.5% (includes AAPL)                      │
│         2. Lower min_volume_ratio to 1.5x (includes AAPL)             │
│         3. Keep AAPL out (it's not a perfect example)                 │
│                                                                       │
│         What would you prefer?"                                         │
│                                                                         │
│ YOU: "Lower both to include AAPL"                                      │
│                                                                         │
│ AGENT: "Updated. Parameters:                                          │
│         • min_gap: 2.5%                                                │
│         • min_volume_ratio: 1.5x                                       │
│         [Other parameters unchanged]                                   │
│                                                                       │
│         Validating all A+ examples..."                                 │
│         ✓ NVDA Jan 8, 2025: FOUND                                      │
│         ✓ TSLA Dec 3, 2024: FOUND                                      │
│         ✓ AAPL Nov 15, 2024: FOUND                                     │
│                                                                       │
│         All A+ examples validated! Generating V31 scanner code..."    │
│                                                                       │
│         [Generating V31 class-based scanner]                          │
│         • Pattern: Multi-Day Momentum Fade                             │
│         • Architecture: 5-stage pipeline                              │
│         • Performance: Parallel processing (360x speedup)             │
│                                                                       │
│         Code complete. Ready to upload to EdgeDev?                    │
│                                                                         │
│ YOU: "Yes, upload and run on 2024-2025 data"                           │
│                                                                         │
│ AGENT: "Uploading scanner to EdgeDev backend..."                      │
│         ✓ Uploaded: DMR_Fade_Scanner                                    │
│                                                                       │
│         Running scan on 2024-01-01 to 2025-01-29..."                  │
│         [Scanning 7,500+ stocks × 252 trading days]                   │
│         [Execution time: 12 seconds]                                   │
│                                                                       │
│         Results:                                                       │
│         • Total setups: 47                                             │
│         • Unique tickers: 23                                          │
│         • Avg gap: 3.4%                                                │
│         • Avg hold_range: 0.28%                                        │
│         • Avg fade: -1.92%                                             │
│                                                                       │
│         Launching EdgeDev dashboard..."                                │
│         [Browser opens to http://localhost:5665/scan]                  │
│                                                                       │
│         You can now:                                                   │
│         • Click any result to see chart                                │
│         • Navigate D-5 to D+14                                         │
│         • View markers (gap, entry, stop, target)                      │
│         • Export to CSV                                                │
│                                                                       │
│         Would you like to:                                             │
│         A) View random setups for validation                           │
│         B) Add backtest logic                                          │
│         C) Explore variations (creative mode)                          │
│         D) Export results"                                             │
│                                                                         │
│ YOU: "Creative mode - show me variations"                              │
│                                                                         │
│ AGENT: "Creative mode activated. Exploring variations..."             │
│                                                                       │
│         Generating 5 parameter variations:                             │
│         [See Creative Mode section above]                              │
│                                                                       │
│         Which variation would you like to explore?"                    │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Implementation Checklist

### Phase 1: Core Agent (Week 1)

- [ ] Conversation Engine
  - [ ] Natural language processor
  - [ ] Pattern type matcher
  - [ ] Requirements parser
  - [ ] Clarification question generator

- [ ] Parameter Extraction
  - [ ] Polygon data fetcher
  - [ ] A+ example analyzer
  - [ ] Tolerance calculator
  - [ ] Parameter validator

- [ ] Code Generation
  - [ ] V31 template library
  - [ ] Parameter inserter
  - [ ] Pattern logic library
  - [ ] Code formatter

### Phase 2: Platform Integration (Week 2)

- [ ] EdgeDev Client
  - [ ] Backend API client
  - [ ] Scanner uploader
  - [ ] Scan executor
  - [ ] Result formatter

- [ ] Dashboard Integration
  - [ ] Dashboard launcher
  - [ ] Chart marker formatter
  - [ ] Result explorer
  - [ ] Day navigator

### Phase 3: Creative Mode (Week 3)

- [ ] Exploration Engine
  - [ ] Parameter variation generator
  - [ ] Pattern discovery (clustering)
  - [ ] Hypothesis tester
  - [ ] Market regime analyzer

- [ ] Quality Assessment
  - [ ] Setup rater
  - [ ] Performance comparator
  - [ ] Recommendation engine

### Phase 4: Advanced Features (Week 4)

- [ ] Backtest Integration
  - [ ] Backtest code generator
  - [ ] Execution logic builder
  - [ ] Performance calculator
  - [ ] Equity curve generator

- [ ] Learning & Memory
  - [ ] User preference tracker
  - [ ] A+ example database
  - [ ] Pattern evolution tracker
  - [ ] Feedback learner

---

**Document Status**: COMPLETE
**Version**: 1.0
**Last Updated**: 2026-01-29
