"""
Text Input Handler - Process Natural Language Scanner Descriptions

This module:
1. Accepts natural language scanner descriptions
2. Extracts key requirements and parameters
3. Identifies pattern types and logic
4. Generates structured specification for code generation
"""

import re
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass


@dataclass
class TextInput:
    """Structured representation of text description"""
    raw_text: str
    scanner_type: Optional[str]
    parameters: Dict[str, Any]
    logic_requirements: List[str]
    indicators: List[str]
    filters: List[str]
    output_requirements: List[str]
    confidence: float


class TextInputHandler:
    """
    Handler for natural language input

    Accepts:
    - Scanner descriptions
    - Trading ideas
    - Strategy explanations
    - Pattern descriptions

    Outputs:
    - Structured TextInput object
    - Parsed requirements
    - Parameter suggestions
    """

    def __init__(self):
        """Initialize text input handler"""
        # Pattern type keywords
        self.pattern_keywords = {
            'backside_b': ['backside', 'bollinger', 'band', 'squeeze', 'volatility'],
            'a_plus': ['a plus', 'aplus', 'accumulation', 'distribution'],
            'lc_d2': ['lc d2', 'low close', 'day 2', 'extended'],
            'd1_gap': ['gap', 'gap up', 'gap down', 'opening gap'],
            'half_a_plus': ['half a plus', 'half aplus', 'modified accumulation'],
            'sc_dmr': ['sc dmr', 'daily mean reversion', 'mean reversion'],
            'custom': []
        }

        # Parameter keywords
        self.parameter_keywords = {
            'min_price': ['minimum price', 'min price', 'price above', 'price greater'],
            'max_price': ['maximum price', 'max price', 'price below', 'price less'],
            'min_volume': ['minimum volume', 'min volume', 'volume above', 'volume greater'],
            'max_volume': ['maximum volume', 'max volume', 'volume below', 'volume less'],
            'min_gap': ['minimum gap', 'min gap', 'gap above', 'gap percent'],
            'max_gap': ['maximum gap', 'max gap', 'gap below'],
            'min_atr': ['minimum atr', 'min atr', 'atr above'],
            'lookback': ['lookback', 'look back', 'period', 'days back', 'window'],
            'ema_short': ['short ema', 'fast ema', 'ema 9', '9 ema'],
            'ema_long': ['long ema', 'slow ema', 'ema 20', '20 ema']
        }

        # Indicator keywords
        self.indicator_keywords = {
            'EMA': ['ema', 'exponential moving average', 'moving average'],
            'ATR': ['atr', 'average true range', 'volatility'],
            'VOL_AVG': ['volume average', 'average volume', 'adv'],
            'RSI': ['rsi', 'relative strength'],
            'MACD': ['macd', 'moving average convergence'],
            'BB': ['bollinger', 'bands', 'bb']
        }

        # Filter keywords
        self.filter_keywords = {
            'price_filter': ['price', 'share price', 'stock price'],
            'volume_filter': ['volume', 'liquidity', 'trading volume'],
            'gap_filter': ['gap', 'opening gap', 'gap up', 'gap down'],
            'volatility_filter': ['volatility', 'atr', 'true range']
        }

    def handle_input(self, text: str) -> TextInput:
        """
        Handle natural language input

        Args:
            text: Natural language description

        Returns:
            TextInput object with parsed information
        """
        # Normalize text
        normalized_text = self._normalize_text(text)

        # Extract information
        scanner_type = self._identify_scanner_type(normalized_text)
        parameters = self._extract_parameters(normalized_text)
        logic_requirements = self._extract_logic_requirements(normalized_text)
        indicators = self._extract_indicators(normalized_text)
        filters = self._extract_filters(normalized_text)
        output_requirements = self._extract_output_requirements(normalized_text)

        # Calculate confidence
        confidence = self._calculate_confidence(
            scanner_type, parameters, logic_requirements
        )

        return TextInput(
            raw_text=text,
            scanner_type=scanner_type,
            parameters=parameters,
            logic_requirements=logic_requirements,
            indicators=indicators,
            filters=filters,
            output_requirements=output_requirements,
            confidence=confidence
        )

    def _normalize_text(self, text: str) -> str:
        """Normalize text for processing"""
        # Convert to lowercase
        text = text.lower()

        # Remove extra whitespace
        text = re.sub(r'\s+', ' ', text)

        # Remove special characters (but keep letters, numbers, spaces)
        text = re.sub(r'[^a-z0-9\s]', ' ', text)

        return text.strip()

    def _identify_scanner_type(self, text: str) -> Optional[str]:
        """Identify scanner type from description"""
        scores = {}

        for pattern_type, keywords in self.pattern_keywords.items():
            score = sum(1 for keyword in keywords if keyword in text)
            if score > 0:
                scores[pattern_type] = score

        if not scores:
            return None

        # Return type with highest score
        return max(scores, key=scores.get)

    def _extract_parameters(self, text: str) -> Dict[str, Any]:
        """Extract parameter values from text"""
        parameters = {}

        for param_name, keywords in self.parameter_keywords.items():
            for keyword in keywords:
                # Look for parameter value patterns
                # Example: "min price of 5" or "price above 10"
                pattern = rf'{keyword}\s+(?:of|above|greater than|:|=)?\s*(\d+(?:\.\d+)?)'
                match = re.search(pattern, text)

                if match:
                    value = float(match.group(1))
                    # Remove decimal if it's .0
                    if value == int(value):
                        value = int(value)
                    parameters[param_name] = value
                    break

        # Extract lookback period
        lookback_patterns = [
            r'(\d+)\s+day',
            r'lookback\s+of\s+(\d+)',
            r'period\s+of\s+(\d+)',
            r'window\s+of\s+(\d+)'
        ]

        for pattern in lookback_patterns:
            match = re.search(pattern, text)
            if match:
                parameters['lookback'] = int(match.group(1))
                break

        return parameters

    def _extract_logic_requirements(self, text: str) -> List[str]:
        """Extract logic requirements from text"""
        requirements = []

        # Common trading logic patterns
        logic_patterns = [
            (r'above\s+(\w+)', lambda m: f"{m.group(1).capitalize()} above threshold"),
            (r'below\s+(\w+)', lambda m: f"{m.group(1).capitalize()} below threshold"),
            (r'crosses?\s+(?:above|over)\s+(\w+)', lambda m: f"Crosses above {m.group(1)}"),
            (r'crosses?\s+(?:below|under)\s+(\w+)', lambda m: f"Crosses below {m.group(1)}"),
            (r'higher\s+than\s+(\w+)', lambda m: f"Higher than {m.group(1)}"),
            (r'lower\s+than\s+(\w+)', lambda m: f"Lower than {m.group(1)}"),
            (r'between\s+(\w+)\s+and\s+(\w+)', lambda m: f"Between {m.group(1)} and {m.group(2)}")
        ]

        for pattern, formatter in logic_patterns:
            matches = re.finditer(pattern, text)
            for match in matches:
                try:
                    requirements.append(formatter(match))
                except:
                    pass

        return requirements

    def _extract_indicators(self, text: str) -> List[str]:
        """Extract technical indicators from text"""
        indicators = []

        for indicator, keywords in self.indicator_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    if indicator not in indicators:
                        indicators.append(indicator)
                    break

        # Extract specific EMA periods
        ema_periods = re.findall(r'ema\s*(\d+)', text)
        for period in ema_periods:
            indicators.append(f"EMA_{period}")

        return indicators

    def _extract_filters(self, text: str) -> List[str]:
        """Extract filter requirements from text"""
        filters = []

        for filter_type, keywords in self.filter_keywords.items():
            for keyword in keywords:
                if keyword in text:
                    filters.append(filter_type)
                    break

        return filters

    def _extract_output_requirements(self, text: str) -> List[str]:
        """Extract output requirements from text"""
        requirements = []

        # Look for output keywords
        if 'signal' in text or 'alert' in text:
            requirements.append('generate_signals')

        if 'backtest' in text or 'historical' in text:
            requirements.append('historical_analysis')

        if 'chart' in text or 'visual' in text:
            requirements.append('visualization')

        if 'export' in text or 'csv' in text:
            requirements.append('data_export')

        if 'rank' in text or 'top' in text or 'best' in text:
            requirements.append('ranking')

        return requirements

    def _calculate_confidence(
        self,
        scanner_type: Optional[str],
        parameters: Dict[str, Any],
        logic_requirements: List[str]
    ) -> float:
        """Calculate confidence score for parsing"""
        score = 0.0
        max_score = 3.0

        # Scanner type identified
        if scanner_type and scanner_type != 'custom':
            score += 1.0
        elif scanner_type:
            score += 0.5

        # Parameters extracted
        if len(parameters) >= 2:
            score += 1.0
        elif len(parameters) >= 1:
            score += 0.5

        # Logic requirements extracted
        if len(logic_requirements) >= 2:
            score += 1.0
        elif len(logic_requirements) >= 1:
            score += 0.5

        return score / max_score

    def generate_specification(self, text_input: TextInput) -> Dict[str, Any]:
        """
        Generate structured specification from text input

        Returns dict ready for code generation
        """
        spec = {
            'scanner_type': text_input.scanner_type or 'custom',
            'description': text_input.raw_text,
            'parameters': text_input.parameters,
            'logic': text_input.logic_requirements,
            'indicators': text_input.indicators,
            'filters': text_input.filters,
            'outputs': text_input.output_requirements,
            'confidence': text_input.confidence
        }

        # Suggest missing parameters
        if 'min_price' not in spec['parameters']:
            spec['suggested_parameters'] = {
                'min_price': 5.0,
                'min_volume': 1000000
            }

        return spec

    def get_input_summary(self, text_input: TextInput) -> str:
        """
        Get human-readable summary of text input

        Returns formatted string
        """
        lines = []
        lines.append("=" * 70)
        lines.append("TEXT INPUT SUMMARY")
        lines.append("=" * 70)

        lines.append(f"\nOriginal Description:")
        lines.append(f'  "{text_input.raw_text[:100]}..."')

        lines.append(f"\nDetected Scanner Type: {text_input.scanner_type or 'Custom'}")

        lines.append(f"\nParameters ({len(text_input.parameters)}):")
        if text_input.parameters:
            for param, value in text_input.parameters.items():
                lines.append(f"  - {param}: {value}")
        else:
            lines.append("  (none detected)")

        lines.append(f"\nLogic Requirements ({len(text_input.logic_requirements)}):")
        if text_input.logic_requirements:
            for req in text_input.logic_requirements[:5]:
                lines.append(f"  - {req}")
            if len(text_input.logic_requirements) > 5:
                lines.append(f"  ... and {len(text_input.logic_requirements) - 5} more")
        else:
            lines.append("  (none detected)")

        lines.append(f"\nIndicators ({len(text_input.indicators)}):")
        if text_input.indicators:
            for ind in text_input.indicators:
                lines.append(f"  - {ind}")
        else:
            lines.append("  (none detected)")

        lines.append(f"\nFilters ({len(text_input.filters)}):")
        if text_input.filters:
            for filt in text_input.filters:
                lines.append(f"  - {filt}")
        else:
            lines.append("  (none detected)")

        lines.append(f"\nConfidence: {text_input.confidence:.2f}")

        if text_input.confidence < 0.5:
            lines.append("\n⚠️ Low confidence - may need clarification")
        elif text_input.confidence < 0.8:
            lines.append("\n⚠️ Medium confidence - some parameters may be missing")

        lines.append("\n" + "=" * 70)

        return "\n".join(lines)


# Test the text input handler
if __name__ == "__main__":
    handler = TextInputHandler()

    # Test with sample description
    test_description = """
    I want to create a scanner that looks for gap up patterns.
    The stock should gap up by at least 3%, with minimum price of $5
    and minimum volume of 1 million shares. Use EMA 9 and EMA 20
    to confirm the trend. Only look at stocks from the last 20 days.
    """

    print("Testing TextInputHandler...\n")

    text_input = handler.handle_input(test_description)

    print(handler.get_input_summary(text_input))

    print("\nGenerated Specification:")
    spec = handler.generate_specification(text_input)
    for key, value in spec.items():
        if isinstance(value, list):
            print(f"  {key}: {value}")
        else:
            print(f"  {key}: {value}")
