"""
RENATA_V2 AI Agent

Uses Qwen 3 Coder via OpenRouter API to extract strategy understanding
from trading scanner code.
"""

import os
import json
import time
from typing import Dict, Any, Optional
from dataclasses import dataclass

try:
    from openai import OpenAI
except ImportError:
    raise ImportError(
        "OpenAI package required. Install with: pip install openai"
    )

from RENATA_V2.core.models import (
    StrategySpec,
    StrategyType,
    ParameterSpec,
    PatternFilterSpec,
    V31Mapping
)


class AIExtractionError(Exception):
    """AI extraction error"""
    pass


@dataclass
class AIRequestResult:
    """Result of an AI request"""
    success: bool
    content: str
    model_used: str
    attempts: int
    elapsed_time: float


class AIAgent:
    """
    AI Agent for code analysis and transformation

    Uses Qwen 3 Coder via OpenRouter to understand trading scanner code
    and extract strategy logic for transformation to v31 standard.
    """

    def __init__(self):
        """Initialize AI agent with OpenRouter client"""
        api_key = os.getenv("OPENROUTER_API_KEY")

        if not api_key:
            raise ValueError(
                "OPENROUTER_API_KEY environment variable not set. "
                "Please set it in your .env file."
            )

        # Initialize OpenAI client with OpenRouter
        self.client = OpenAI(
            base_url="https://openrouter.ai/api/v1",
            api_key=api_key
        )

        # Model configuration
        self.models = {
            'primary': 'qwen/qwen3-coder',
            'fallback': 'deepseek/deepseek-coder',
            'validation': 'openai/gpt-4'
        }

        # Retry configuration
        self.max_retries = 3
        self.retry_delay = 1.0  # seconds
        self.request_timeout = 60  # seconds

        # Cache for responses (optional)
        self.cache_enabled = True
        self.response_cache = {}

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

IMPORTANT - Scanner Type Classification:
- LC (Low Close) Frontside: Patterns with names like 'lc_frontside_d2_extended', 'lc_frontside_d3_extended'
- LC (Low Close) Backside: Patterns with names like 'lc_backside_d2', 'lc_backside_para_b'
- Backside V: Patterns with names like 'backside_v_scanner', 'backside_para_b'
- D2/D3/D4: Day 2/Day 3/Day 4 patterns (NOT backside patterns)
- Gap: Gap trading patterns
- A+: A+ Daily Parabolic patterns

CRITICAL: Do NOT misclassify LC frontside patterns as "backside" scanners. Look at the actual pattern names:
- 'lc_frontside_*' = LC Frontside scanner (NOT backside)
- 'lc_backside_*' = LC Backside scanner
- 'backside_*' = Backside scanner
- 'd2', 'd3', 'd4' = Day patterns, NOT backside

Always be precise, technical, and focus on preserving the exact trading logic.
Return responses in valid JSON format when requested.
"""

    def _make_request(
        self,
        prompt: str,
        model: Optional[str] = None,
        response_format: str = "text"
    ) -> str:
        """
        Make request to AI model with retry logic

        Args:
            prompt: The prompt to send
            model: Model to use (defaults to primary)
            response_format: "text" or "json"

        Returns:
            Model response content

        Raises:
            AIExtractionError: If all retry attempts fail
        """
        if model is None:
            model = self.models['primary']

        # Check cache
        cache_key = f"{model}:{hash(prompt)}:{response_format}"
        if self.cache_enabled and cache_key in self.response_cache:
            return self.response_cache[cache_key]

        # Configure response format
        if response_format == "json":
            response_format_config = {"type": "json_object"}
        else:
            response_format_config = {"type": "text"}

        # Make request with retry logic
        last_error = None
        for attempt in range(self.max_retries):
            try:
                start_time = time.time()

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
                    response_format=response_format_config,
                    temperature=0.1,  # Low temperature for consistency
                    max_tokens=4096,
                    timeout=self.request_timeout
                )

                elapsed = time.time() - start_time

                content = response.choices[0].message.content

                # Cache successful response
                if self.cache_enabled:
                    self.response_cache[cache_key] = content

                return content

            except Exception as e:
                last_error = e
                if attempt < self.max_retries - 1:
                    # Exponential backoff
                    wait_time = self.retry_delay * (2 ** attempt)
                    print(f"⚠️  Attempt {attempt + 1} failed, retrying in {wait_time}s...")
                    time.sleep(wait_time)
                    continue

        # All retries failed
        raise AIExtractionError(
            f"AI request failed after {self.max_retries} attempts: {last_error}"
        )

    def extract_strategy_intent(
        self,
        code: str,
        ast_info: Any = None
    ) -> StrategySpec:
        """
        Extract strategy intent from scanner code

        Args:
            code: Original scanner code
            ast_info: AST analysis results (optional)

        Returns:
            StrategySpec with strategy understanding
        """
        # Limit code length to avoid token limits
        code_preview = code[:3000] if len(code) > 3000 else code

        # Build prompt
        prompt = f"""Analyze this trading scanner code and extract the strategy.

## Scanner Code:
{code_preview}

## AST Information:
{self._format_ast_info(ast_info) if ast_info else "No AST info available"}

## Extract:
1. Strategy Name - What pattern is being traded?
2. Strategy Type - Trend following, mean reversion, momentum, gap, etc.
3. Entry Conditions - What triggers the setup?
4. Exit Conditions - When to exit (if specified)?
5. Timeframe - Daily, intraday, multi-day?
6. Rationale - Why does this strategy work?

Return as JSON:
{{
    "name": "Strategy Name",
    "description": "Brief description of what this strategy does",
    "strategy_type": "trend_following|mean_reversion|momentum|gap|breakout|liquidity|pattern|other",
    "entry_conditions": [
        "condition 1",
        "condition 2"
    ],
    "exit_conditions": [
        "condition 1"
    ],
    "timeframe": "daily|intraday|multi_day",
    "rationale": "Why this strategy works"
}}
"""

        try:
            response = self._make_request(prompt, response_format="json")
            strategy_data = json.loads(response)

            # Map strategy type string to enum
            strategy_type_map = {
                'trend_following': StrategyType.TREND_FOLLOWING,
                'mean_reversion': StrategyType.MEAN_REVERSION,
                'momentum': StrategyType.MOMENTUM,
                'gap': StrategyType.GAP,
                'breakout': StrategyType.BREAKOUT,
                'liquidity': StrategyType.LIQUIDITY,
                'pattern': StrategyType.PATTERN,
                'other': StrategyType.OTHER
            }

            strategy_type = strategy_type_map.get(
                strategy_data.get('strategy_type', 'other'),
                StrategyType.OTHER
            )

            # Create StrategySpec
            spec = StrategySpec(
                name=strategy_data.get('name', 'Unknown Strategy'),
                description=strategy_data.get('description', ''),
                strategy_type=strategy_type,
                entry_conditions=strategy_data.get('entry_conditions', []),
                exit_conditions=strategy_data.get('exit_conditions', []),
                parameters={},  # Will be populated by identify_parameters
                timeframe=strategy_data.get('timeframe', 'daily'),
                rationale=strategy_data.get('rationale', ''),
                scanner_type='single'  # Will be updated based on AST classification
            )

            return spec

        except json.JSONDecodeError as e:
            raise AIExtractionError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise AIExtractionError(f"Strategy extraction failed: {e}")

    def identify_parameters(
        self,
        code: str,
        strategy: StrategySpec = None
    ) -> ParameterSpec:
        """
        Extract parameters from scanner code

        Args:
            code: Original scanner code
            strategy: Strategy specification (optional)

        Returns:
            ParameterSpec with all parameters
        """
        code_preview = code[:3000] if len(code) > 3000 else code

        prompt = f"""Extract ALL numeric parameters from this trading scanner.

## Scanner Code:
{code_preview}

## Strategy: {strategy.name if strategy else 'Unknown'}

## Extract These Parameters:

### Price Thresholds:
- min_price, max_price
- min_close, max_close
- min_high, max_high

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
- min_gain_pct, max_gain_pct
- min_prev_high_gain

For each parameter, extract:
1. The VALUE (numeric)
2. The UNITS (dollars, percent, shares, days, etc.)

Return as JSON:
{{
    "price_thresholds": {{
        "min_price": {{"value": 0.75, "units": "dollars"}},
        "max_price": null
    }},
    "volume_thresholds": {{
        "min_volume": {{"value": 1000000, "units": "shares"}}
    }},
    "gap_thresholds": {{
        "min_gap_pct": {{"value": 0.5, "units": "percent"}}
    }},
    "ema_periods": {{
        "ema_9": {{"value": 9, "units": "days"}},
        "ema_21": {{"value": 21, "units": "days"}}
    }},
    "consecutive_day_requirements": {{
        "min_consecutive": {{"value": 2, "units": "days"}}
    }},
    "other_parameters": {{}}
}}
"""

        try:
            response = self._make_request(prompt, response_format="json")
            param_data = json.loads(response)

            spec = ParameterSpec(
                price_thresholds=param_data.get('price_thresholds', {}),
                volume_thresholds=param_data.get('volume_thresholds', {}),
                gap_thresholds=param_data.get('gap_thresholds', {}),
                ema_periods=param_data.get('ema_periods', {}),
                consecutive_day_requirements=param_data.get('consecutive_day_requirements', {}),
                other_parameters=param_data.get('other_parameters', {})
            )

            return spec

        except json.JSONDecodeError as e:
            raise AIExtractionError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise AIExtractionError(f"Parameter extraction failed: {e}")

    def generate_pattern_logic(
        self,
        strategy: StrategySpec,
        parameters: ParameterSpec
    ) -> str:
        """
        Generate Python code for detect_patterns method

        Args:
            strategy: Strategy specification
            parameters: Parameter specification

        Returns:
            Valid Python code for detect_patterns
        """
        prompt = f"""Generate Python code for the detect_patterns method.

## Strategy: {strategy.name}
{strategy.description}

## Entry Conditions:
{json.dumps(strategy.entry_conditions, indent=2)}

## Parameters:
{json.dumps(parameters.to_dict(), indent=2)}

## Requirements:

### Code Structure:
def detect_patterns(self, stage2_data):
    '''
    Check for {strategy.name} setup

    Args:
        stage2_data: Filtered DataFrame from apply_smart_filters

    Returns:
        List of dictionaries with pattern results
    '''
    # YOUR CODE HERE

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

## CRITICAL OUTPUT REQUIREMENTS:
- ⚠️ IMMEDIATELY start your response with 'def detect_patterns('
- ⚠️ DO NOT include ANY thinking, reasoning, or explanation text
- ⚠️ DO NOT wrap code in markdown code blocks (```python or ```)
- ⚠️ DO NOT include class definition or __init__
- ⚠️ ONLY output the Python function code, nothing else
- ⚠️ NO introductory text, NO comments about your approach
- ⚠️ Start with 'def detect_patterns(' and end with the last line of the function
- Your entire response should be ONLY the Python function code

Remember: Your response must start with 'def detect_patterns(' - nothing before it!
"""

        try:
            response = self._make_request(prompt, response_format="text")

            # Post-process: Remove thinking text and extract only code
            response = response.strip()

            # First, find where the actual code starts
            # Look for Python code markers (import, class, def, etc.)
            lines = response.split('\n')
            code_start_idx = None

            for i, line in enumerate(lines):
                stripped = line.strip()
                # Skip empty lines and thinking markers
                if not stripped or stripped.startswith('#') and not stripped.startswith('# '):
                    # Skip comments that look like thinking
                    continue

                # Found actual code
                if stripped.startswith('import ') or \
                   stripped.startswith('from ') or \
                   stripped.startswith('class ') or \
                   stripped.startswith('def ') or \
                   stripped.startswith('```python') or \
                   stripped.startswith('```'):
                    code_start_idx = i
                    break

            # If we found where code starts, discard everything before
            if code_start_idx is not None and code_start_idx > 0:
                lines = lines[code_start_idx:]

            # Now remove markdown code blocks if present
            if lines and lines[0].strip().startswith('```'):
                # Find the line after ```python or ```
                start_idx = 0
                for i, line in enumerate(lines):
                    if line.strip().startswith('```') and not line.strip() == '```':
                        # This is ```python, skip next line
                        start_idx = i + 1
                        break
                    elif line.strip() == '```' and i > 0:
                        # This is closing ``` after code started
                        lines = lines[start_idx:i]
                        break
                    elif start_idx > 0 and i > start_idx:
                        # We're in the code, continue
                        continue

                if start_idx > 0:
                    lines = lines[start_idx:]

            # Remove closing ``` if present at the end
            if lines and lines[-1].strip() == '```':
                lines = lines[:-1]

            response = '\n'.join(lines)

            # Validate that we got function code
            if 'def detect_patterns(' not in response:
                raise AIExtractionError("Generated code doesn't contain detect_patterns function")

            return response

        except Exception as e:
            raise AIExtractionError(f"Pattern logic generation failed: {e}")

    def extract_pattern_filters(
        self,
        pattern_code: str,
        pattern_name: str
    ) -> PatternFilterSpec:
        """
        Extract filters for a specific pattern in a multi-scanner

        Args:
            pattern_code: Code for this specific pattern
            pattern_name: Name of the pattern

        Returns:
            PatternFilterSpec with filter parameters
        """
        prompt = f"""Extract the smart filter parameters for this pattern.

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
- min_prev_close, max_prev_close

### Volume Filters:
- min_prev_volume, min_pre_market_volume

### Gap Filters:
- min_gap_pct, max_gap_pct
- min_gap_consecutive

### Other Filters:
- Any other filtering criteria SPECIFIC to this pattern

IMPORTANT: Extract only the filters that are SPECIFIC to this pattern,
not universal filters applied to all patterns.

Return as JSON:
{{
    "min_price": {{"value": 0.75, "units": "dollars"}},
    "max_price": null,
    "min_volume": {{"value": 10000000, "units": "shares"}},
    "min_gap_pct": {{"value": 0.5, "units": "percent"}},
    "min_gap_consecutive": {{"value": 2, "units": "days"}}
}}
"""

        try:
            response = self._make_request(prompt, response_format="json")
            filter_data = json.loads(response)

            # Helper function to safely extract value from nested dict
            def safe_get(key):
                val = filter_data.get(key)
                if val is None:
                    return None
                return val.get('value') if isinstance(val, dict) else None

            spec = PatternFilterSpec(
                min_price=safe_get('min_price'),
                max_price=safe_get('max_price'),
                min_volume=safe_get('min_volume'),
                max_volume=safe_get('max_volume'),
                min_gap_pct=safe_get('min_gap_pct'),
                max_gap_pct=safe_get('max_gap_pct'),
                min_gap_consecutive=safe_get('min_gap_consecutive')
            )

            return spec

        except json.JSONDecodeError as e:
            raise AIExtractionError(f"Failed to parse AI response as JSON: {e}")
        except Exception as e:
            raise AIExtractionError(f"Pattern filter extraction failed: {e}")

    def _format_ast_info(self, ast_info: Any) -> str:
        """Format AST info for prompt"""
        if not ast_info:
            return "No AST information available"

        lines = []
        lines.append(f"- Functions: {[f.name for f in getattr(ast_info, 'functions', [])]}")

        if hasattr(ast_info, 'scanner_type'):
            lines.append(f"- Scanner Type: {ast_info.scanner_type.value}")

        if hasattr(ast_info, 'data_source'):
            ds = ast_info.data_source
            lines.append(f"- Data Source: {ds.primary_source}")
            lines.append(f"- Polygon API: {'Yes' if ds.polygon_usage else 'No'}")

        return "\n".join(lines)
