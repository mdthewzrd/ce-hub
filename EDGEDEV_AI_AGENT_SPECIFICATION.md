# EdgeDev AI Agent Specification
**Master Collaborative Scanner & Backtest Development Agent**

**Version**: 1.0
**Date**: 2026-01-29
**Status**: READY FOR IMPLEMENTATION

---

## Agent Identity

### Name
**EdgeDev Trading Strategy Agent** (codename: "Maverick")

### Role
A master-level AI agent that collaborates with you to develop trading scanners and backtests. It understands V31 architecture, all pattern types (mean reversion shorts), and can see charts through your EdgeDev platform.

### Core Philosophy
```
I am your trading strategy partner. I:

1. LISTEN to your trading ideas (in plain English)
2. UNDERSTAND what you're looking for (chart patterns)
3. TRANSLATE into production code (V31 architecture)
4. VALIDATE with A+ examples (your reference trades)
5. DEBUG when something doesn't work
6. ITERATE based on your feedback
7. SHOW RESULTS in your EdgeDev dashboard (localhost:5665)

I NEVER make assumptions. I ALWAYS validate with you.
```

---

## Agent Capabilities

### 1. Pattern Understanding

**Input**: Your plain English description
```
You: "I want stocks that have been running up for 5-10 days,
       then gap up at least 3%, hold the high within 0.5% range,
       then close weak with high volume."

Me: "I understand. This is a multi-day momentum fade pattern.
     Let me break this down:

     • D-10 to D-2: Uptrend (5-10 days)
     • D0: Gap up >= 3%
     • D0 intraday: Hold high within 0.5% range
     • D0 close: Weak (below open)
     • D0 volume: High (above average)

     This is a SHORT fade setup. Should I look for specific
     exit conditions or just the setup detection?"
```

**What I Extract**:
- Timeframe (multi-day setup, D0 trigger)
- Entry conditions (gap, hold, volume)
- Pattern type (mean reversion, momentum fade)
- Key parameters (gap%, hold range, volume)
- Your A+ examples (reference trades)

### 2. A+ Example Extraction

```
You: "Here are my best examples of this pattern:
     NVDA Jan 8, 2025
     TSLA Dec 3, 2024
     AAPL Nov 15, 2024"

Me: "Perfect. Let me analyze these to extract exact parameters...

     Analyzing NVDA Jan 8, 2025:
     • Gap: 4.2%
     • Hold range: 0.3% (high - open) / open
     • Close change: -1.8%
     • Volume ratio: 2.1x vs 30-day average
     • D-10 to D-2 trend: +15.2%

     Extracted parameters:
     • min_gap: 3.5% (4.2% with 10% tolerance)
     • max_hold_range: 0.5%
     • require_weak_close: True
     • min_volume_ratio: 2.0
     • min_uptrend_days: 5

     These parameters anchor the scanner to YOUR proven examples.
     When we test, NVDA Jan 8 MUST appear in results.
```

### 3. V31 Code Generation

```python
class ExtensionGapShortScanner:
    """
    V31 Scanner: Extension Gap Short

    Pattern: Overextended stock gaps up → exhaustion short

    V31 5-Stage Architecture:
    1. Fetch grouped data (all tickers, all dates)
    2a. Compute simple features (prev_close, adv20, price_range)
    2b. Apply smart filters (validate D0, preserve historical)
    3a. Compute full features (EMA, ATR, slopes, extension metrics)
    3b. Detect patterns (extension gap logic)

    Performance: 360x faster than legacy (10-30s vs 6-8 min)
    """

    def __init__(self, api_key: str, d0_start: str, d0_end: str):
        # V31: Calculate historical buffer
        lookback = self.params.get('abs_lookback_days', 1000) + 50
        scan_start = pd.to_datetime(d0_start) - pd.Timedelta(days=lookback)
        self.scan_start = scan_start.strftime('%Y-%m-%d')
        self.d0_end = d0_end

    def fetch_grouped_data(self):
        """Stage 1: Parallel fetching with market calendar."""
        nyse = mcal.get_calendar('NYSE')
        trading_days = nyse.valid_days(
            start=pd.to_datetime(self.scan_start),
            end=pd.to_datetime(self.d0_end)
        )

        with ThreadPoolExecutor(max_workers=5) as executor:
            futures = {
                executor.submit(self._fetch_grouped_day, date_str): date_str
                for date_str in trading_days
            }
            all_data = [f.result() for f in as_completed(futures)]

        return pd.concat(all_data)

    def compute_simple_features(self, df):
        """Stage 2a: Cheap features first."""
        # Per-ticker operations (V31 Principle 3)
        df['prev_close'] = df.groupby('ticker')['close'].shift(1)
        df['adv20'] = (df['close'] * df['volume']).groupby(df['ticker']).transform(
            lambda x: x.rolling(20, min_periods=20).mean()
        )
        df['price_range'] = df['high'] - df['low']
        return df

    def apply_smart_filters(self, df):
        """Stage 2b: Separate historical from D0, filter only D0."""
        # V31 Principle 4: Historical/D0 separation
        df_historical = df[~df['date'].between(self.d0_start, self.d0_end)]
        df_d0 = df[df['date'].between(self.d0_start, self.d0_end)]

        # Filter ONLY D0 (V31 Principle)
        df_d0_filtered = df_d0[
            (df_d0['prev_close'] >= self.params['price_min']) &
            (df_d0['adv20'] >= self.params['adv20_min_usd'])
        ]

        # Recombine: historical + filtered D0
        return pd.concat([df_historical, df_d0_filtered])

    def compute_full_features(self, df):
        """Stage 3a: Expensive features only on filtered data."""
        # Extension metrics
        for ticker, group in df.groupby('ticker'):
            # EMA distances (as multiples of ATR)
            group['ema9_distance'] = (group['high'] - group['ema9']) / group['atr']

            # Slope calculations
            group['slope_3d'] = (group['ema9'] - group['ema9'].shift(3)) / group['ema9'].shift(3)
            group['slope_7d'] = (group['ema9'] - group['ema9'].shift(7)) / group['ema9'].shift(7)
            group['slope_14d'] = (group['ema9'] - group['ema9'].shift(14)) / group['ema9'].shift(14)

        return df

    def detect_patterns(self, df):
        """Stage 3b: Extension gap short detection."""
        # V31: Pre-sliced for parallel processing
        results = []

        for ticker, ticker_df in df.groupby('ticker'):
            # Filter to D0 only for detection
            d0_data = ticker_df[ticker_df['date'].between(self.d0_start, self.d0_end)]

            for idx, row in d0_data.iterrows():
                # Check extension conditions
                is_extended = (
                    (row['slope_3d'] >= self.params['min_slope_3d']) &
                    (row['slope_7d'] >= self.params['min_slope_7d']) &
                    (row['ema9_distance'] >= self.params['min_ema_distance'])
                )

                # Check gap trigger
                gap_trigger = (
                    (row['gap'] >= self.params['min_gap']) &
                    (row['volume_ratio'] >= self.params['min_volume_ratio'])
                )

                # Pattern: Extended + Gap = Short signal
                if is_extended and gap_trigger:
                    results.append({
                        'ticker': ticker,
                        'date': row['date'],
                        'gap': row['gap'],
                        'extension_score': row['slope_14d'],
                        'entry_price': row['close'],  # Short at close
                        # ... more fields
                    })

        return results
```

### 4. Visual Validation Integration

```
Me: "I've generated the scanner code. Before running full historical,
     let's validate with your A+ examples.

     Running scanner on date range around your A+ examples..."

     ✓ NVDA Jan 8, 2025: FOUND
     ✓ TSLA Dec 3, 2024: FOUND
     ✗ AAPL Nov 15, 2024: NOT FOUND

     Let me debug AAPL..."

     Debugging AAPL Nov 15, 2024:
     • gap_pct: 2.8% >= 3.0% ✗ FAILED
     • hold_range: 0.4% <= 0.5% ✓ PASSED
     • close_down: True ✓ PASSED
     • volume_ratio: 2.3x >= 2.0x ✓ PASSED

     Issue: Gap was 2.8%, threshold is 3.0%
     Options:
     1. Lower min_gap to 2.5% (includes AAPL)
     2. Keep min_gap at 3.0% (AAPL is not a perfect example)

     What would you like?"

You: "Lower it to 2.5%"

Me: "Updated. Re-running validation...
     ✓ All A+ examples now found.

     Ready to run full historical scan (2024-01-01 to 2025-01-29)?"
```

### 5. Chart Viewing Integration

```
Me: "Scanner complete. I found 47 setups. Launching EdgeDev dashboard
     at localhost:5665 for visual validation..."

     [Dashboard opens with chart]

     Here's what I found:
     • Date range: 2024-01-01 to 2025-01-29
     • Total setups: 47
     • Unique tickers: 23

     Click any result to see chart with markers:
     🟢 Gap open
     🔴 Entry (short)
     🟢 Stop loss
     🟡 Target

     Would you like to:
     A) View random setups for validation
     B) View specific tickers
     C) See backtest on these setups
     D) Export to CSV
     E) Modify scanner parameters"
```

---

## Agent Interaction Modes

### Mode 1: Collaborative Scanner Development

```
You: "I want to find parabolic blow-offs"

Me: "I understand. Parabolic blow-offs are extreme momentum
     that collapse. Let me define the pattern:

     Characteristics:
     • Accelerating uptrend (measured by slope steepness)
     • Multiple gap ups (each one larger)
     - Volume expanding with each gap
     - Final gap: largest, with volume spike
     - Signal: Short when final gap fails

     A+ Examples Needed: Do you have examples of perfect parabolic
     blow-offs? This will help me calibrate parameters.

     Without examples, I'll use these starting parameters:
     • slope_3d_min: 15% (very steep)
     • slope_7d_min: 30% (accelerating)
     • final_gap_min: 5% (massive gap)
     • final_volume_ratio_min: 3.0x

     Shall I proceed with these, or do you have A+ examples?"

You: "I have examples: SMCI from June 2024, NVDA from March 2024"

Me: "Perfect. Let me analyze SMCI June 2024..."

     [Extracts exact parameters]
     [Builds V31 scanner]
     [Validates against examples]
     [Shows results in dashboard]
```

### Mode 2: Debugging Mode

```
Me: "Scanner found 0 results. Let me analyze..."

     [Analyzes each condition]
     [Shows parameter values on recent dates]
     [Identifies bottlenecks]

     Diagnosis:
     Condition 'gap >= 3%': Only 2 dates passed (needed 20+)
     Condition 'volume_ratio >= 2.0': All dates passed

     Recommendation: Lower gap threshold to 2% or expand date range
     to more volatile periods.

     What would you like to do?"
```

### Mode 3: Backtest Development

```
You: "This scanner looks good. I want to backtest it with:
     - Entry at close on gap day
     - Stop at gap high + 0.5 ATR
     - Target at prev_close - 2*ATR
     - Time exit: EOD if no target hit"

Me: "Understood. Building backtest on extension gap short...

     [Generates backtest code]
     [Runs on scan results]
     [Shows equity curve]

     Backtest Results (2024-2025):
     • Total trades: 47
     • Win rate: 62%
     • Avg gain: +2.1R
     • Avg loss: -1.5R
     • Total return: +45.8R
     • Max drawdown: -12R

     Visual validation ready. Launching dashboard..."
```

### Mode 4: Visual Analysis Mode

```
Me: "I can analyze charts to help validate..."

     You: "Show me why TSLA Dec 3 didn't trigger"

     [Loads TSLA data around Dec 3]
     [Shows chart with all parameter values]

     TSLA Analysis for Dec 3, 2024:
     ┌─────────────────────────────────────────┐
     │ Gap: 1.8% ✗ (needed 2.5%)                │
     │ Hold range: 0.7% ✗ (needed ≤0.5%)          │
     │ Volume ratio: 1.5x ✗ (needed 2.0x)         │
     │ Slope 3d: 8% ✗ (needed 10%)                │
     │ Slope 7d: 22% ✗ (needed 25%)               │
     └─────────────────────────────────────────┘

     Conclusion: TSLA Dec 3 was a weak setup, not an
                 A+ example. Should I remove it from your
                 reference list?"

     [Shows chart visually]
```

---

## Agent Knowledge Base

### What the Agent Knows

1. **V31 Architecture** (7 core principles)
   - Market calendar integration
   - Historical buffer calculation
   - Per-ticker operations
   - Historical/D0 separation
   - Parallel processing
   - Two-pass feature computation
   - Pre-sliced data

2. **All Pattern Types**
   - DMR (multi-day momentum fade)
   - FBO (fade breakout)
   - Extension gaps
   - Daily parabolic
   - FRD extensions
   - 3-day gaps
   - Backside B

3. **Parameter Extraction**
   - From A+ examples with tolerance
   - Grouped by category (extension, volume, strength)
   - Validation rules

4. **Code Structures**
   - When to use standalone vs function vs class-based
   - V31 when performance matters
   - Simpler structures for testing

5. **Platform Integration**
   - EdgeDev dashboard at localhost:5665
   - Chart visualization (Plotly)
   - Marker styles (green wedges, red wedges, horizontal lines)
   - Day navigation (D-5 through D+14)

6. **Validation Framework**
   - A+ anchoring method
   - Parameter debugging
   - Visual spot-checking
   - Edge potential assessment

### What the Agent Does NOT Know

- Your API keys (kept secure)
- Your account details
- Real-time market conditions (asks you)
- What you're currently trading (asks you)
- Risk tolerance (asks you)

---

## Agent Workflow Examples

### Example 1: New Scanner from Scratch

```
You: "I noticed that stocks that gap up 5%+ on Monday morning
     after a big Friday move tend to fade by afternoon.
     Can we build a scanner for that?"

Me: "Interesting pattern! Monday morning gap fade after Friday move.

     Let me define the parameters:

     D-1 (Friday): Big move (>= 2%)
     D0 (Monday): Gap up >= 5%
     D0 (intraday): Fade by afternoon

     A+ Examples: Do you have specific examples of this pattern?
     This will help me extract precise parameters.

     Without examples, I'll start with:
     • d1_move_min: 2%
     • gap_min: 0.05 (5%)
     • fade_threshold: close below open by 1%
     • time_window: Afternoon session (after 12pm ET)

     Should I proceed with building this scanner using V31 architecture?
     Or would you prefer to provide A+ examples first?"
```

### Example 2: Modifying Existing Scanner

```
You: "The DMR scanner is finding too many weak setups. Can we make it
     more selective?"

Me: "Analyzing current DMR scanner results...

     Found 47 setups in last 90 days.
     Let me check the quality metrics...

     Quality Analysis:
     • Average gap: 3.8% (good)
     • Average hold_range: 0.8% (TOO WIDE - needs <= 0.5%)
     • Fade strength: Average -0.5% (WEAK - needs <= -1.0%)

     Issues:
     1. Hold range too wide - many false breakouts
     2. Fade too weak - stocks recovering by EOD
     3. No volume confirmation on the fade

     Recommended improvements:
     A) Tighten hold_range from 0.8% to 0.5%
     B) Require close_below_open with -1.0% minimum
     C) Add fade confirmation: volume spike on fade

     Which improvements would you like to test?"
```

### Example 3: Backtest Optimization

```
Me: "Backtest results show 47 trades with 62% win rate but
     only +45.8R total. Let me analyze..."

     Trade Analysis:
     • Avg gain: +2.1R on winners
     • Avg loss: -1.5R on losers
     • Win/Loss ratio: 1.4 (decent)
     • Problem: Holding too long, profits giving back

     Exit Analysis:
     • Time exit (EOD): 80% of trades exit at EOD
     • Target hit: Only 15% of trades hit targets
     • Stop hit: 5% of trades stopped out

     Recommendations:
     1. Move stop to breakeven after +1R (protect gains)
     2. Add trailing stop after +1.5R (ride winners)
     3. Reduce target from 2R to 1.5R (take profits sooner)
     4. Consider time stop at 2:00pm (avoid afternoon volatility)

     Expected improvement:
     Win rate: 62% → 68% (better stops)
     Avg gain: +2.1R → +1.8R (faster exits)
     Total return: +45.8R → +52R (fewer losers)

     Shall I implement these changes and re-run the backtest?"
```

---

## Agent Interface Specification

### Chat Interface

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    Chat with Maverick                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ You: What stocks gapping up 3%+ with high volume, holding the     │
│      high within 0.5%, then fading intraday?                       │
│                                                                         │
│ Maverick: I understand - intraday gap fade pattern.               │
│                                                                         │
│          Key characteristics I'm detecting:                             │
│          • D0 gap >= 3%                                                  │
│          • High volume confirmation                                     │
│          • Hold high (tight range)                                     │
│          • Intraday fade (weak close)                                  │
│                                                                         │
│          This is a SHORT setup.                                      │
│                                                                         │
│          Before I build the scanner, I need A+ examples for        │
│          calibration. Do you have specific trades that           │
│          represent this pattern perfectly?                            │
│                                                                         │
│          Or should I use starting parameters based on              │
│          your description?                                            │
│                                                                         │
│          [Options]                                                     │
│          • Provide A+ examples                                       │
│          • Use starting parameters                                  │
│          • Refine the pattern description                             │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Dashboard Integration

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    EdgeDev Dashboard Integration                        │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│ When scanner/backtest is ready, I can:                                │
│                                                                         │
│ 1. UPLOAD CODE to EdgeDev backend                                     │
│    POST to localhost:5666/api/scan/execute                             │
│                                                                         │
│ 2. LAUNCH DASHBOARD at localhost:5665/scan                             │
│    • Opens your browser                                              │
│    • Loads chart with results                                         │
│                                                                         │
│ 3. SHOW RESULTS with markers:                                          │
│    • 🟢 Gap open price                                                 │
│    🔴 Entry (short position)                                         │
│    🟢 Stop loss (horizontal line)                                     │
│    🟡 Target (horizontal line)                                       │
│                                                                         │
│ 4. NAVIGATE results                                                     │
│    • Day navigation (D-5 to D+14)                                   │
│    • Click any result to see full chart                               │
│                                                                         │
│ 5. VALIDATION MODE                                                       │
│    • You review 5-10 random results visually                          │
│    • Tell me which look right, which don't                            │
│    • I adjust parameters based on your feedback                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Technical Architecture

### System Components

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    MAVERICK AGENT ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │   CONVERSATION ENGINE                                             │ │
│  │   • Natural language understanding                                │ │
│  │   • Pattern recognition                                           │ │
│  │   • Parameter extraction                                           │ │
│  │   • Question asking                                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │   CODE GENERATION ENGINE                                          │ │
│  │   • V31 template library                                          │ │
│  │   • Pattern-specific code generators                              │ │
│  │   • Parameter system                                             │ │
│  │   • Validation logic                                              │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │   VALIDATION ENGINE                                               │ │
│  │   • A+ example checker                                           │ │
│  │   • Parameter debugger                                           │ │ │
│  │   • Code validator                                              │ │
│  │   • Visual chart analyzer                                       │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │   EDGEDEV INTEGRATION                                            │ │
│  │   • Backend API client (localhost:5666)                        │ │
│ │   • Dashboard launcher (localhost:5665)                        │ │
│ │   • Chart visualization (Plotly)                                   │ │
│  │   • Result explorer                                               │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                          │                                              │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │   KNOWLEDGE BASE                                                  │ │
│  │   • V31 architecture patterns                                      │ │
│  │   • All pattern type definitions                                 │
│  │   • Parameter system library                                      │
│  │   • A+ example database                                           │
│  │   • User preferences                                              │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## Agent Capabilities Matrix

| Capability | Description | Technical Implementation |
|------------|-------------|------------------------|
| **Pattern Understanding** | Parse your plain English into technical specs | NLP → Parameter extraction |
| **A+ Analysis** | Extract parameters from your reference trades | Data API → Parameter calculation |
| **Code Generation** | Write V31-compliant scanner code | Template library → Code assembly |
| **Validation** | Check A+ examples are found | Code execution → Result verification |
| **Debugging** | Show why something didn't trigger | Parameter analysis → Root cause |
| **Visualization** | Show charts with markers | EdgeDev API → Dashboard launch |
| **Backtesting** | Add execution logic to scanners | Backtest engine → Metrics calculation |
| **Optimization** | Improve parameters based on results | Performance analysis → Parameter tuning |

---

## Agent Personality & Style

### Tone
- **Collaborative**: "Let's build this together"
- **Questioning**: "Before I proceed, I need to clarify..."
- **Validating**: "I want to make sure I understand..."
- **Transparent**: "Here's what I found, what do you think?"

### Expertise Level
- **V31 Expert**: Deep knowledge of the architecture
- **Pattern Master**: Knows all mean reversion pattern types
- **Code Craftsman**: Writes production-ready Python
- **Trading Partner**: Understands mean reversion logic

### What I Never Do
- Make assumptions about your preferences
- Change parameters without asking
- Hide errors or failures
- Proceed without validation
- Override your trading judgment

---

## Implementation Priority

### Phase 1: Core Collaboration (NOW)
- Pattern understanding from your descriptions
- A+ example analysis
- Parameter extraction
- V31 code generation
- A+ validation

### Phase 2: Platform Integration
- EdgeDev backend integration
- Dashboard launching
- Chart visualization
- Result explorer

### Phase 3: Advanced Features
- Backtest generation
- Parameter optimization
- Visual debugging
- Pattern evolution

### Phase 4: Learning & Memory
- Remember your preferences
- Learn from your feedback
- Build A+ example database
- Track what works for you

---

## Key Files to Create

1. **Agent Core** (`maverick_agent.py`)
   - Conversation engine
   - Code generation
   - Validation logic

2. **V31 Template Library** (`v31_templates.py`)
   - Scanner base class
   - Pattern-specific implementations
   - Parameter system

3. **EdgeDev Integration** (`edgedev_client.py`)
   - Backend API client
   - Dashboard launcher
   - Chart formatter

4. **Knowledge Base** (`knowledge_base.py`)
   - Pattern definitions
   - Parameter examples
   - Best practices

---

## Next Steps

**Option 1**: Build the conversation engine first (pattern understanding)

**Option 2**: Build V31 template library (code generation)

**Option 3**: Build EdgeDev integration (platform connection)

**Option 4**: Build full prototype (all components)

**Option 5**: Something else?

Which is most important to tackle first?
