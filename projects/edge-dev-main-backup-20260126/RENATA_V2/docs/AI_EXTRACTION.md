# AI Extraction for Renata V2

## 📋 Overview

AI Extraction is the second stage in the Renata V2 transformation pipeline. It uses AI models (via OpenRouter API) to understand the **intent** behind the code, extract **strategy logic**, and identify **parameters** that AST alone cannot determine.

---

## 🎯 Why AI Extraction?

### Limitations of AST

AST is great for understanding **structure**, but not **intent**:

```python
# AST can tell us this is a comparison
if stock['price'] > stock['ma200']:
    results.append(stock)

# ❌ AST cannot tell us:
# - This is a "trend following" strategy
# - MA200 means "200-day moving average"
# - This checks for "bullish momentum"
# - The trader wants "stocks above long-term average"
```

### AI Complements AST

```python
# AI extracts the MEANING:
{
    "strategy": "Trend Following",
    "intent": "Find stocks in bullish uptrend",
    "logic": "Price above 200-day MA indicates long-term bullish trend",
    "parameters": {
        "ma_period": 200,
        "condition": "price > ma200"
    }
}
```

---

## 🤖 AI Models

### Primary Model: Qwen 3 Coder

**Model**: `qwen/qwen-3-coder-32b-instruct`

**Why This Model**:
- Latest generation code-specialized model
- 32B parameters - large enough for complex reasoning
- Superior code understanding and generation
- Excellent at Python code analysis
- Fast response times
- Cost-effective

**Use Cases**:
- Strategy intent extraction
- Parameter identification
- Code explanation
- Pattern logic generation

### Fallback Model: DeepSeek Coder

**Model**: `deepseek/deepseek-coder`

**When to Use**:
- If Qwen is unavailable
- For simpler extraction tasks
- For cost optimization

### Validation Model: GPT-4

**Model**: `openai/gpt-4`

**When to Use**:
- Final validation of critical code
- Complex reasoning tasks
- When accuracy is more important than cost

---

## 🔧 OpenRouter Integration

### Setup

```python
# RENATA_V2/core/ai_agent.py

import os
from openai import OpenAI

class AIAgent:
    """AI Agent for code analysis and transformation"""

    def __init__(self):
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=os.getenv("OPENROUTER_API_KEY")
        )

        # Model configuration
        self.models = {
            'primary': 'qwen/qwen-3-coder-32b-instruct',
            'fallback': 'deepseek/deepseek-coder',
            'validation': 'openai/gpt-4'
        }

        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
```

### Basic Request

```python
def _make_request(
    self,
    prompt: str,
    model: str = None,
    response_format: str = "text"
) -> str:
    """
    Make request to AI model

    Args:
        prompt: The prompt to send
        model: Model to use (defaults to primary)
        response_format: "text" or "json"

    Returns:
        Model response
    """
    if model is None:
        model = self.models['primary']

    # Configure response format
    if response_format == "json":
        response_format = {"type": "json_object"}
    else:
        response_format = {"type": "text"}

    # Make request with retry logic
    for attempt in range(self.max_retries):
        try:
            response = self.client.chat.completions.create(
                model=model,
                messages=[
                    {
                        "role": "system",
                        "content": self._get_system_prompt()
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                response_format=response_format,
                temperature=0.1,  # Low temperature for consistent outputs
                max_tokens=4096
            )

            return response.choices[0].message.content

        except Exception as e:
            if attempt < self.max_retries - 1:
                time.sleep(self.retry_delay * (2 ** attempt))
                continue
            else:
                raise AIExtractionError(f"AI request failed: {e}")
```

### System Prompt

```python
def _get_system_prompt(self) -> str:
    """Get system prompt for AI model"""
    return """You are an expert trading system analyst and Python code specialist.

Your role is to analyze trading scanner code and extract:
1. Strategy intent - what pattern is being traded
2. Entry conditions - what triggers the setup
3. Parameters - numeric thresholds and settings
4. Data requirements - what data is needed
5. Scanner type - single or multi-pattern

You are helping transform trading code into the EdgeDev v31 standard, which is a
5-stage architecture:
1. fetch_grouped_data - Get all tickers that traded each day
2. apply_smart_filters - Reduce dataset by 99% with price/volume filters
3. detect_patterns - Check if pattern conditions are met
4. format_results - Format output for display
5. run_scan - Orchestrate the entire pipeline

Always be precise, technical, and focus on preserving the exact trading logic.
"""
```

---

## 🎯 Extraction Tasks

### Task 1: Strategy Intent Extraction

**Goal**: Understand WHAT the strategy is doing

**Prompt Template**:
```python
def extract_strategy_intent(
    self,
    code: str,
    ast_info: ASTInfo
) -> StrategySpec:
    """
    Extract strategy intent from scanner code

    Args:
        code: Original scanner code
        ast_info: AST analysis results

    Returns:
        StrategySpec with strategy understanding
    """
    prompt = f"""
Analyze this trading scanner code and extract the strategy.

## Scanner Code:
{code[:2000]}  # First 2000 chars (token limit)

## AST Information:
- Functions: {[f.name for f in ast_info.functions]}
- Scanner Type: {ast_info.scanner_type}
- Data Source: {ast_info.data_source.primary_source}

## Extract:
1. Strategy Name - What pattern is being traded?
2. Strategy Type - Trend following, mean reversion, momentum, etc.
3. Entry Conditions - What triggers the setup?
4. Exit Conditions - When to exit (if specified)?
5. Timeframe - Daily, intraday, multi-day?
6. Rationale - Why does this strategy work?

Return as JSON:
{{
    "name": "strategy name",
    "type": "strategy type",
    "entry_conditions": ["condition 1", "condition 2"],
    "exit_conditions": ["condition 1"],
    "timeframe": "daily",
    "rationale": "why this works"
}}
"""

    response = self._make_request(prompt, response_format="json")
    strategy_data = json.loads(response)

    return StrategySpec(**strategy_data)
```

**Example Output**:
```json
{
    "name": "A+ Daily Parabolic",
    "type": "momentum",
    "entry_conditions": [
        "Price gaps up at least 0.5%",
        "Pre-market volume at least 5M shares",
        "Previous close at least $0.75",
        "EMA slopes are bullish (EMA9 > EMA21 > EMA50)",
        "Stock in parabolic move (accelerating upward)"
    ],
    "exit_conditions": [
        "Not specified in scanner"
    ],
    "timeframe": "daily",
    "rationale": "Finds stocks in strong momentum moves that gap up with
                  high volume, indicating continued upside potential.
                  The EMA slope alignment confirms the trend is strong."
}
```

---

### Task 2: Parameter Extraction

**Goal**: Extract ALL numeric parameters and their meanings

**Prompt Template**:
```python
def identify_parameters(
    self,
    code: str,
    strategy: StrategySpec
) -> ParameterSpec:
    """
    Extract parameters from scanner code

    Args:
        code: Original scanner code
        strategy: Strategy specification

    Returns:
        ParameterSpec with all parameters
    """
    prompt = f"""
Extract ALL numeric parameters from this trading scanner.

## Scanner Code:
{code[:3000]}

## Strategy:
{strategy.name}

## Extract These Parameters:

### Price Thresholds:
- min_price, max_price
- min_close, max_close

### Volume Thresholds:
- min_volume, max_volume
- min_pre_market_volume

### Gap Thresholds:
- min_gap_pct, max_gap_pct
- min_gap_amount, max_gap_amount

### EMA/Indicator Periods:
- EMA lengths (9, 21, 50, 200, etc.)
- Lookback periods
- Calculation windows

### Consecutive Day Requirements:
- min_consecutive_days
- gap_consecutive

### Gain/Loss Thresholds:
- min_gain_pct
- max_loss_pct

### Other Numeric Thresholds:
- ANY numeric constant used in conditions

For each parameter:
1. Extract the VALUE
2. Describe what it MEANS
3. Specify the UNITS (dollars, percent, shares, etc.)

Return as JSON:
{{
    "price_thresholds": {{
        "min_price": {{"value": 0.75, "units": "dollars", "description": "Minimum previous close price"}},
        "max_price": {{"value": null, "units": null, "description": "No maximum"}}
    }},
    "volume_thresholds": {{
        "min_volume": {{"value": 1000000, "units": "shares", "description": "Minimum daily volume"}}
    }},
    "gap_thresholds": {{
        "min_gap_pct": {{"value": 0.5, "units": "percent", "description": "Minimum gap up percentage"}}
    }},
    "ema_periods": {{
        "ema_short": {{"value": 9, "units": "days", "description": "Short-term EMA"}},
        "ema_medium": {{"value": 21, "units": "days", "description": "Medium-term EMA"}},
        "ema_long": {{"value": 50, "units": "days", "description": "Long-term EMA"}}
    }}
}}
"""

    response = self._make_request(prompt, response_format="json")
    param_data = json.loads(response)

    return ParameterSpec(**param_data)
```

**Example Output**:
```json
{
    "price_thresholds": {
        "min_price": {
            "value": 0.75,
            "units": "dollars",
            "description": "Minimum previous close price to filter penny stocks"
        },
        "max_price": null
    },
    "volume_thresholds": {
        "min_volume": {
            "value": 5000000,
            "units": "shares",
            "description": "Minimum pre-market volume"
        }
    },
    "gap_thresholds": {
        "min_gap_pct": {
            "value": 0.5,
            "units": "percent",
            "description": "Minimum gap up percentage"
        }
    },
    "ema_periods": {
        "ema_9": {"value": 9, "units": "days", "description": "Fast EMA"},
        "ema_21": {"value": 21, "units": "days", "description": "Medium EMA"},
        "ema_50": {"value": 50, "units": "days", "description": "Slow EMA"}
    }
}
```

---

### Task 3: Pattern Logic Generation

**Goal**: Generate Python code for `detect_patterns` method

**Prompt Template**:
```python
def generate_pattern_logic(
    self,
    strategy: StrategySpec,
    parameters: ParameterSpec
) -> str:
    """
    Generate pattern detection code

    Args:
        strategy: Strategy specification
        parameters: Parameter specification

    Returns:
        Valid Python code for detect_patterns
    """
    prompt = f"""
Generate Python code for the detect_patterns method.

## Strategy: {strategy.name}
{strategy.description}

## Entry Conditions:
{json.dumps(strategy.entry_conditions, indent=2)}

## Parameters:
{json.dumps(parameters.dict(), indent=2)}

## Requirements:

### Code Structure:
```python
def detect_patterns(self, stage2_data):
    '''
    Check for {strategy.name} setup

    Args:
        stage2_data: Filtered DataFrame from apply_smart_filters

    Returns:
        List of dictionaries with pattern results
    '''
    # YOUR CODE HERE
```

### Must Use:
1. Vectorized pandas operations (NO iterrows!)
2. All indicators from parameters
3. Check all entry conditions
4. Return list of results with keys:
   - ticker
   - date
   - entry_price
   - entry_conditions_met
   - indicators_calculated

### Indicator Calculations:
- Calculate EMAs using: df['close'].ewm(span=N).mean()
- Calculate gaps using: (df['open'] / df['prev_close']) - 1
- Calculate ranges using: df['high'] - df['low']

### Condition Checking:
- Use pandas boolean indexing
- Combine conditions with & (AND) and | (OR)
- Use parentheses for complex conditions

### Example:
```python
# Calculate EMAs
stage2_data['ema9'] = stage2_data['close'].ewm(span=9).mean()
stage2_data['ema21'] = stage2_data['close'].ewm(span=21).mean()

# Check conditions
pattern_mask = (
    (stage2_data['gap_pct'] >= 0.5) &
    (stage2_data['prev_volume'] >= 5_000_000) &
    (stage2_data['ema9'] > stage2_data['ema21'])
)

# Get results
pattern_results = stage2_data[pattern_mask]

# Format output
results = []
for idx, row in pattern_results.iterrows():
    results.append({{
        'ticker': row['ticker'],
        'date': row['date'],
        'entry': row['open'],
        'gap_pct': row['gap_pct'],
        'volume': row['volume']
    }})
```

Generate ONLY the code for the detect_patterns method.
Do NOT include class definition or __init__.
Return ONLY valid Python code.
"""

    response = self._make_request(prompt, response_format="text")

    # Validate generated code
    try:
        ast.parse(response)
        return response
    except SyntaxError:
        # Self-correction loop
        return self._correct_pattern_logic(response, strategy)
```

**Example Output**:
```python
def detect_patterns(self, stage2_data):
    """
    Check for A+ Parabolic setup

    Args:
        stage2_data: Filtered DataFrame from apply_smart_filters

    Returns:
        List of dictionaries with pattern results
    """
    # Calculate EMAs
    stage2_data['ema9'] = stage2_data['close'].ewm(span=9).mean()
    stage2_data['ema21'] = stage2_data['close'].ewm(span=21).mean()
    stage2_data['ema50'] = stage2_data['close'].ewm(span=50).mean()

    # Calculate EMA slopes (compare current to previous)
    stage2_data['ema9_slope'] = stage2_data['ema9'].pct_change()
    stage2_data['ema21_slope'] = stage2_data['ema21'].pct_change()

    # Calculate gap
    stage2_data['gap_pct'] = (stage2_data['open'] / stage2_data['prev_close']) - 1

    # Check entry conditions
    pattern_mask = (
        (stage2_data['gap_pct'] >= 0.5) &  # Gap up at least 0.5%
        (stage2_data['prev_volume'] >= 5_000_000) &  # High pre-market volume
        (stage2_data['prev_close'] >= 0.75) &  # Filter penny stocks
        (stage2_data['ema9_slope'] > 0) &  # Fast EMA rising
        (stage2_data['ema21_slope'] > 0) &  # Medium EMA rising
        (stage2_data['ema9'] > stage2_data['ema21']) &  # Bullish alignment
        (stage2_data['ema21'] > stage2_data['ema50'])  # Trend confirmation
    )

    # Get results
    pattern_results = stage2_data[pattern_mask].copy()

    # Format output
    results = []
    for idx, row in pattern_results.iterrows():
        results.append({
            'ticker': row['ticker'],
            'date': row['date'].strftime('%Y-%m-%d'),
            'entry': float(row['open']),
            'gap_pct': float(row['gap_pct'] * 100),
            'volume': int(row['volume']),
            'prev_close': float(row['prev_close']),
            'ema9': float(row['ema9']),
            'ema21': float(row['ema21'])
        })

    return results
```

---

### Task 4: Pattern-Specific Filter Extraction (Multi-Scanners)

**Goal**: Extract unique filters for each pattern in multi-scanners

**Prompt Template**:
```python
def extract_pattern_filters(
    self,
    pattern_code: str,
    pattern_name: str
) -> PatternFilterSpec:
    """
    Extract filters for a specific pattern

    Args:
        pattern_code: Code for this specific pattern
        pattern_name: Name of the pattern

    Returns:
        PatternFilterSpec with filter parameters
    """
    prompt = f"""
Extract the smart filter parameters for this pattern.

## Pattern: {pattern_name}
## Code:
{pattern_code}

## Background:
In the EdgeDev v31 system, each pattern in a multi-scanner has its OWN
smart filters that are applied BEFORE checking the pattern conditions.
This makes the scanner much more efficient.

For example, if Pattern A requires gap >= 0.5 and Pattern B requires
gap >= 1.0, we would:
1. Apply gap >= 0.5 filter for Pattern A
2. Apply gap >= 1.0 filter for Pattern B

Each pattern gets different pre-filtered data based on its requirements.

## Extract:
For THIS pattern, what are the filter parameters?

### Price Filters:
- min_prev_close
- max_prev_close

### Volume Filters:
- min_prev_volume
- min_pre_market_volume

### Gap Filters:
- min_gap_pct
- max_gap_pct
- min_gap_consecutive

### Other Filters:
- Any other filtering criteria SPECIFIC to this pattern

IMPORTANT: Extract only the filters that are SPECIFIC to this pattern,
not universal filters applied to all patterns.

Return as JSON:
{{
    "min_prev_close": {{"value": 0.75, "units": "dollars"}},
    "min_prev_volume": {{"value": 10000000, "units": "shares"}},
    "min_gap_pct": {{"value": 0.5, "units": "percent"}},
    "min_gap_consecutive": {{"value": 2, "units": "days"}}
}}
"""

    response = self._make_request(prompt, response_format="json")
    filter_data = json.loads(response)

    return PatternFilterSpec(**filter_data)
```

**Example Output** (D2 PM Setup Pattern):
```json
{
    "min_prev_close": {
        "value": 0.75,
        "units": "dollars"
    },
    "min_prev_volume": {
        "value": 10000000,
        "units": "shares"
    },
    "min_prev_high_gain": {
        "value": 0.50,
        "units": "percent"
    },
    "min_gap_pct": {
        "value": 0.5,
        "units": "percent"
    }
}
```

**Example Output** (D3 Pattern):
```json
{
    "min_prev_close": {
        "value": 0.75,
        "units": "dollars"
    },
    "min_prev_volume": {
        "value": 10000000,
        "units": "shares"
    },
    "min_gap_consecutive": {
        "value": 3,
        "units": "days"
    }
}
```

**Notice**: D2 PM Setup requires 50% previous gain and 0.5% gap, while D3 requires 3 consecutive gaps. Each has UNIQUE filters.

---

## 🔄 Self-Correction Loop

### Validation Feedback

```python
def _correct_pattern_logic(
    self,
    code: str,
    strategy: StrategySpec,
    validation_errors: List[str]
) -> str:
    """
    Correct generated code based on validation errors

    Args:
        code: Generated code with errors
        strategy: Strategy specification
        validation_errors: List of validation errors

    Returns:
        Corrected code
    """
    prompt = f"""
The generated code has validation errors. Fix them.

## Original Strategy: {strategy.name}

## Generated Code (with errors):
{code}

## Validation Errors:
{json.dumps(validation_errors, indent=2)}

## Common Errors to Fix:
1. ❌ Using fetch_all_grouped_data() → ✅ Use fetch_grouped_data()
2. ❌ Using get_all_stocks() → ✅ Use Polygon grouped endpoint
3. ❌ Invalid characters ($) → ✅ Remove all $ characters
4. ❌ Non-vectorized operations → ✅ Use pandas vectorized operations
5. ❌ Syntax errors → ✅ Fix syntax

## Instructions:
1. Fix ALL validation errors
2. Keep the same logic
3. Ensure it's valid Python
4. Use vectorized pandas operations
5. Return ONLY the corrected code

Corrected code:
"""

    response = self._make_request(prompt, response_format="text")

    # Validate again
    try:
        ast.parse(response)
        return response
    except SyntaxError:
        # Return best effort if max retries reached
        return response
```

---

## 📊 Performance Optimization

### Caching

```python
from functools import lru_cache
import hashlib

class AIAgent:
    def __init__(self):
        self.cache_enabled = True
        self.response_cache = {}

    def _cached_request(
        self,
        prompt: str,
        model: str,
        response_format: str
    ) -> str:
        """Make cached request"""
        if not self.cache_enabled:
            return self._make_request(prompt, model, response_format)

        # Create cache key
        cache_key = hashlib.md5(
            f"{prompt}:{model}:{response_format}".encode()
        ).hexdigest()

        # Check cache
        if cache_key in self.response_cache:
            return self.response_cache[cache_key]

        # Make request
        response = self._make_request(prompt, model, response_format)

        # Cache response
        self.response_cache[cache_key] = response

        return response
```

### Prompt Optimization

```python
def _optimize_prompt(self, prompt: str) -> str:
    """Optimize prompt to reduce token usage"""
    # Remove redundant explanations
    # Consolidate similar instructions
    # Use concise language
    # Remove examples if not needed

    # Example: Before
    long_prompt = """
    Please analyze this code and tell me what it does.
    I need you to look at the functions and the variables
    and the conditions and tell me the strategy name.
    Also tell me the entry conditions and exit conditions
    and any parameters used.
    """

    # After: 70% fewer tokens
    short_prompt = """
    Analyze this scanner code. Extract:
    1. Strategy name
    2. Entry/exit conditions
    3. All parameters

    Code: {code}
    """

    return short_prompt
```

---

## 🧪 Testing AI Extraction

### Unit Tests

```python
# tests/test_ai_agent.py

import pytest
from RENATA_V2.core.ai_agent import AIAgent

def test_extract_strategy_intent():
    """Test strategy extraction"""
    agent = AIAgent()

    with open('tests/data/a_plus_scanner.py', 'r') as f:
        code = f.read()

    ast_info = parse_ast(code)
    strategy = agent.extract_strategy_intent(code, ast_info)

    assert strategy.name is not None
    assert len(strategy.entry_conditions) > 0
    assert strategy.timeframe is not None

def test_identify_parameters():
    """Test parameter extraction"""
    agent = AIAgent()

    with open('tests/data/a_plus_scanner.py', 'r') as f:
        code = f.read()

    strategy = get_test_strategy()
    parameters = agent.identify_parameters(code, strategy)

    assert parameters.price_thresholds is not None
    assert parameters.volume_thresholds is not None
    assert parameters.ema_periods is not None

def test_generate_pattern_logic():
    """Test pattern logic generation"""
    agent = AIAgent()

    strategy = get_test_strategy()
    parameters = get_test_parameters()

    code = agent.generate_pattern_logic(strategy, parameters)

    # Verify valid Python
    try:
        ast.parse(code)
    except SyntaxError:
        pytest.fail("Generated code has syntax errors")

    # Verify it's a function
    assert 'def detect_patterns(' in code
```

---

## 📝 Best Practices

### DO:
✅ Provide clear, specific prompts
✅ Include examples in prompts
✅ Use low temperature (0.1) for consistency
✅ Validate AI outputs
✅ Implement retry logic
✅ Cache responses when appropriate
✅ Handle API errors gracefully

### DON'T:
❌ Don't use vague prompts
❌ Don't assume AI will be 100% accurate
❌ Don't skip validation
❌ Don't exceed token limits
❌ Don't forget error handling
❌ Don't use high temperature (causes inconsistency)

---

## 🎯 Key Takeaways

1. **AI Complements AST**: AI extracts intent, AST extracts structure
2. **Right Model for Right Job**: Use specialized code models
3. **Prompt Quality Matters**: Good prompts = good outputs
4. **Validation is Critical**: Always validate AI outputs
5. **Self-Correction Works**: Use validation feedback to improve
6. **Performance Matters**: Cache, optimize, parallelize
7. **Pattern-Specific Logic**: Multi-scanners need unique filters per pattern

---

## 📚 References

- [OpenRouter Documentation](https://openrouter.ai/docs)
- [Qwen 3 Coder](https://huggingface.co/Qwen/Qwen3-Coder-32B-Instruct)
- [DeepSeek Coder](https://huggingface.co/deepseek-ai/deepseek-coder)
- [Prompt Engineering Guide](https://www.promptingguide.ai/)

---

**Version**: 2.0
**Last Updated**: 2025-01-02
