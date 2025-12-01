#!/usr/bin/env python3
"""
Edge-Dev Domain-Specific Pattern Recognition Engine
Specialized for Trading Scanner Analysis and Parameter Extraction

This engine provides:
1. Trading-specific pattern recognition for technical indicators
2. Advanced parameter extraction for trading conditions
3. Optimized processing for edge-dev scanner formats
4. Pre-compiled regex patterns for common trading patterns
"""

import re
import ast
import logging
from typing import Dict, List, Any, Optional, Tuple
from dataclasses import dataclass
from enum import Enum

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

class PatternType(Enum):
    """Types of trading patterns we can recognize"""
    PRICE_COMPARISON = "price_comparison"
    VOLUME_CONDITION = "volume_condition"
    TECHNICAL_INDICATOR = "technical_indicator"
    TIME_CONDITION = "time_condition"
    MOVING_AVERAGE = "moving_average"
    OSCILLATOR = "oscillator"
    SUPPORT_RESISTANCE = "support_resistance"
    TREND_ANALYSIS = "trend_analysis"

@dataclass
class ExtractedParameter:
    """Structure for extracted trading parameters"""
    name: str
    current_value: Any
    parameter_type: str
    category: str
    description: str
    suggested_range: Optional[Tuple[float, float]] = None
    optimization_priority: str = "medium"  # high, medium, low

@dataclass
class TradingPattern:
    """Structure for recognized trading patterns"""
    pattern_type: PatternType
    confidence: float
    parameters: List[ExtractedParameter]
    code_snippet: str
    description: str
    complexity_score: int

class EdgeDevPatternEngine:
    """
    Domain-specific pattern recognition engine for edge-dev trading scanners
    """

    def __init__(self):
        self.trading_patterns = self._compile_trading_patterns()
        self.parameter_extractors = self._compile_parameter_extractors()

    def _compile_trading_patterns(self) -> Dict[str, re.Pattern]:
        """
        Compile optimized regex patterns for common trading conditions
        """
        patterns = {
            # Price comparison patterns
            'price_greater_than': re.compile(
                r"df\[(['\"])(h|l|c|o)\1\]\s*[>]=?\s*df\[(['\"])(h\d*|l\d*|c\d*|o\d*)\3\]",
                re.IGNORECASE
            ),

            # Volume conditions
            'volume_spike': re.compile(
                r"df\[(['\"])v\1\]\s*[>]=?\s*(?:df\[(['\"])v\d*\2\]|\d+(?:\.\d+)?)",
                re.IGNORECASE
            ),

            # Moving average patterns
            'ma_cross': re.compile(
                r"df\[(['\"])(?:sma|ema|ma)_?(\d+)\1\]\s*[<>=!]+\s*df\[(['\"])(?:sma|ema|ma)_?(\d+)\3\]",
                re.IGNORECASE
            ),

            # RSI conditions
            'rsi_condition': re.compile(
                r"df\[(['\"])rsi(?:_?\d+)?\1\]\s*[<>=!]+\s*(\d+(?:\.\d+)?)",
                re.IGNORECASE
            ),

            # Bollinger Band conditions
            'bb_condition': re.compile(
                r"df\[(['\"])(?:bb_upper|bb_lower|bb_mid)\1\]",
                re.IGNORECASE
            ),

            # Time-based conditions
            'time_condition': re.compile(
                r"df\[(['\"])(?:time|hour|minute|day)\1\]\s*[<>=!]+\s*(\d+)",
                re.IGNORECASE
            ),

            # Support/Resistance levels
            'support_resistance': re.compile(
                r"df\[(['\"])(h|l|c)\1\]\s*[<>=!]+\s*(\d+(?:\.\d+)?)",
                re.IGNORECASE
            ),

            # Percentage change conditions
            'percent_change': re.compile(
                r"\(df\[(['\"])(h|l|c|o)\1\]\s*[-+*/]\s*df\[(['\"])(h\d*|l\d*|c\d*|o\d*)\3\]\)\s*/\s*df\[(['\"])(h\d*|l\d*|c\d*|o\d*)\4\]",
                re.IGNORECASE
            ),

            # Column assignments (the main pattern we fixed earlier)
            'scanner_assignment': re.compile(
                r"df\[(['\"])([a-zA-Z_][a-zA-Z0-9_]*)\1\]\s*=(?!=).*?\.astype\(int\)",
                re.DOTALL
            )
        }

        logger.info(f"Compiled {len(patterns)} optimized trading patterns")
        return patterns

    def _compile_parameter_extractors(self) -> Dict[str, re.Pattern]:
        """
        Compile regex patterns for extracting numerical parameters
        """
        extractors = {
            # Extract numerical values
            'numbers': re.compile(r'(\d+(?:\.\d+)?)', re.MULTILINE),

            # Extract periods for moving averages
            'ma_periods': re.compile(r'(?:sma|ema|ma)_?(\d+)', re.IGNORECASE),

            # Extract RSI periods
            'rsi_periods': re.compile(r'rsi_?(\d+)', re.IGNORECASE),

            # Extract thresholds
            'thresholds': re.compile(r'[<>=!]+\s*(\d+(?:\.\d+)?)', re.MULTILINE),

            # Extract lookback periods
            'lookbacks': re.compile(r'(?:shift|lag)\((\d+)\)', re.IGNORECASE),

            # Extract column references
            'columns': re.compile(r"df\[(['\"])([a-zA-Z_][a-zA-Z0-9_]*)\1\]", re.MULTILINE)
        }

        return extractors

    def analyze_scanner_code(self, code: str) -> Dict[str, Any]:
        """
        Analyze trading scanner code using domain-specific patterns

        Args:
            code: Trading scanner Python code

        Returns:
            Analysis results with patterns, parameters, and metadata
        """
        logger.info(f"Analyzing scanner code: {len(code)} characters")

        # Find all scanner assignments first
        scanner_assignments = self._find_scanner_assignments(code)

        # Analyze each scanner assignment
        scanner_details = []
        total_parameters = 0

        for assignment in scanner_assignments:
            scanner_info = self._analyze_single_scanner(assignment)
            scanner_details.append(scanner_info)
            total_parameters += len(scanner_info['parameters'])

        # Calculate overall complexity
        complexity_score = self._calculate_complexity(code, scanner_details)

        # Determine confidence based on pattern recognition success
        confidence = self._calculate_confidence(scanner_details, total_parameters)

        return {
            'success': True,
            'total_scanners': len(scanner_details),
            'total_parameters': total_parameters,
            'total_complexity': complexity_score,
            'analysis_confidence': confidence,
            'method': 'Edge_Dev_Pattern_Engine',
            'scanners': scanner_details,
            'processing_notes': {
                'patterns_detected': len(scanner_assignments),
                'avg_params_per_scanner': total_parameters / len(scanner_details) if scanner_details else 0,
                'complexity_breakdown': self._get_complexity_breakdown(scanner_details)
            }
        }

    def _find_scanner_assignments(self, code: str) -> List[Dict[str, str]]:
        """
        Find all scanner column assignments in the code
        """
        pattern = self.trading_patterns['scanner_assignment']
        matches = []

        for match in pattern.finditer(code):
            scanner_name = match.group(2)
            full_assignment = match.group(0)

            # Extract the full logical expression
            lines = code.split('\n')
            assignment_line = None

            for i, line in enumerate(lines):
                if scanner_name in line and 'df[' in line and '=' in line:
                    assignment_line = i
                    break

            if assignment_line is not None:
                # Get the complete multi-line assignment
                complete_assignment = self._extract_complete_assignment(lines, assignment_line)

                matches.append({
                    'name': scanner_name,
                    'assignment': full_assignment,
                    'complete_logic': complete_assignment,
                    'line_number': assignment_line + 1
                })

        logger.info(f"Found {len(matches)} scanner assignments")
        return matches

    def _extract_complete_assignment(self, lines: List[str], start_line: int) -> str:
        """
        Extract complete multi-line assignment including all logical conditions
        """
        assignment_lines = [lines[start_line]]

        # Look for continuation lines
        i = start_line + 1
        while i < len(lines):
            line = lines[i].strip()

            # Check if this is a continuation (starts with logical operator or has unmatched parentheses)
            if (line.startswith(('&', '|', 'and', 'or')) or
                assignment_lines[-1].count('(') > assignment_lines[-1].count(')')):
                assignment_lines.append(lines[i])
                i += 1
            else:
                break

        return '\n'.join(assignment_lines)

    def _analyze_single_scanner(self, scanner_info: Dict[str, str]) -> Dict[str, Any]:
        """
        Analyze a single scanner assignment to extract patterns and parameters
        """
        name = scanner_info['name']
        logic = scanner_info['complete_logic']

        logger.info(f"Analyzing scanner: {name}")

        # Recognize patterns in the logic
        recognized_patterns = self._recognize_patterns(logic)

        # Extract parameters from the logic
        extracted_params = self._extract_parameters(logic, recognized_patterns)

        # Calculate complexity for this scanner
        complexity = self._calculate_scanner_complexity(logic, recognized_patterns)

        # Generate description
        description = self._generate_scanner_description(name, recognized_patterns)

        return {
            'scanner_name': name,
            'description': description,
            'complexity': complexity,
            'patterns_detected': [p.pattern_type.value for p in recognized_patterns],
            'parameters': [self._parameter_to_dict(p) for p in extracted_params],
            'code_snippet': logic[:200] + '...' if len(logic) > 200 else logic,
            'analysis_metadata': {
                'line_number': scanner_info['line_number'],
                'pattern_count': len(recognized_patterns),
                'parameter_count': len(extracted_params)
            }
        }

    def _recognize_patterns(self, logic: str) -> List[TradingPattern]:
        """
        Recognize trading patterns in scanner logic
        """
        patterns = []

        # Check each compiled pattern
        for pattern_name, regex in self.trading_patterns.items():
            if pattern_name == 'scanner_assignment':  # Skip the main assignment pattern
                continue

            matches = regex.findall(logic)
            if matches:
                pattern_type = self._map_pattern_to_type(pattern_name)
                confidence = self._calculate_pattern_confidence(pattern_name, matches, logic)

                pattern = TradingPattern(
                    pattern_type=pattern_type,
                    confidence=confidence,
                    parameters=[],  # Will be populated later
                    code_snippet=logic,
                    description=self._describe_pattern(pattern_name, matches),
                    complexity_score=self._get_pattern_complexity(pattern_name)
                )

                patterns.append(pattern)

        return patterns

    def _extract_parameters(self, logic: str, patterns: List[TradingPattern]) -> List[ExtractedParameter]:
        """
        Extract configurable parameters from scanner logic
        """
        parameters = []

        # Extract numbers (potential thresholds, periods, etc.)
        numbers = self.parameter_extractors['numbers'].findall(logic)
        thresholds = self.parameter_extractors['thresholds'].findall(logic)
        ma_periods = self.parameter_extractors['ma_periods'].findall(logic)
        rsi_periods = self.parameter_extractors['rsi_periods'].findall(logic)

        # Process moving average periods
        for period in ma_periods:
            param = ExtractedParameter(
                name=f"ma_period_{period}",
                current_value=int(period),
                parameter_type="integer",
                category="moving_average",
                description=f"Moving Average period of {period} bars",
                suggested_range=(5, 200),
                optimization_priority="high"
            )
            parameters.append(param)

        # Process RSI periods
        for period in rsi_periods:
            param = ExtractedParameter(
                name=f"rsi_period_{period}",
                current_value=int(period),
                parameter_type="integer",
                category="oscillator",
                description=f"RSI calculation period of {period} bars",
                suggested_range=(2, 50),
                optimization_priority="high"
            )
            parameters.append(param)

        # Process threshold values
        for i, threshold in enumerate(set(thresholds)):  # Remove duplicates
            try:
                value = float(threshold)
                param = ExtractedParameter(
                    name=f"threshold_{i+1}",
                    current_value=value,
                    parameter_type="float",
                    category="threshold",
                    description=f"Comparison threshold value: {value}",
                    suggested_range=(value * 0.5, value * 2.0),
                    optimization_priority="medium"
                )
                parameters.append(param)
            except ValueError:
                continue

        # Process other numerical values
        processed_numbers = set(ma_periods + rsi_periods + thresholds)
        for number in numbers:
            if number not in processed_numbers:
                try:
                    value = float(number)
                    if value > 1:  # Filter out very small numbers that might not be parameters
                        param = ExtractedParameter(
                            name=f"numeric_param_{number}",
                            current_value=value,
                            parameter_type="float",
                            category="numeric",
                            description=f"Numeric parameter: {value}",
                            suggested_range=(max(0, value * 0.1), value * 10),
                            optimization_priority="low"
                        )
                        parameters.append(param)
                except ValueError:
                    continue

        logger.info(f"Extracted {len(parameters)} parameters")
        return parameters

    def _map_pattern_to_type(self, pattern_name: str) -> PatternType:
        """Map pattern name to PatternType enum"""
        mapping = {
            'price_greater_than': PatternType.PRICE_COMPARISON,
            'volume_spike': PatternType.VOLUME_CONDITION,
            'ma_cross': PatternType.MOVING_AVERAGE,
            'rsi_condition': PatternType.OSCILLATOR,
            'bb_condition': PatternType.TECHNICAL_INDICATOR,
            'time_condition': PatternType.TIME_CONDITION,
            'support_resistance': PatternType.SUPPORT_RESISTANCE,
            'percent_change': PatternType.TREND_ANALYSIS
        }
        return mapping.get(pattern_name, PatternType.TECHNICAL_INDICATOR)

    def _calculate_pattern_confidence(self, pattern_name: str, matches: List, logic: str) -> float:
        """Calculate confidence score for pattern recognition"""
        base_confidence = 0.8

        # Adjust based on number of matches
        match_bonus = min(len(matches) * 0.1, 0.2)

        # Adjust based on pattern complexity
        complexity_bonus = len(logic) / 1000.0 * 0.1

        return min(base_confidence + match_bonus + complexity_bonus, 1.0)

    def _describe_pattern(self, pattern_name: str, matches: List) -> str:
        """Generate human-readable description of detected pattern"""
        descriptions = {
            'price_greater_than': f"Price comparison conditions detected ({len(matches)} instances)",
            'volume_spike': f"Volume spike conditions detected ({len(matches)} instances)",
            'ma_cross': f"Moving average crossover conditions detected ({len(matches)} instances)",
            'rsi_condition': f"RSI oscillator conditions detected ({len(matches)} instances)",
            'bb_condition': f"Bollinger Band conditions detected ({len(matches)} instances)",
            'time_condition': f"Time-based conditions detected ({len(matches)} instances)",
            'support_resistance': f"Support/Resistance level conditions detected ({len(matches)} instances)",
            'percent_change': f"Percentage change calculations detected ({len(matches)} instances)"
        }
        return descriptions.get(pattern_name, f"Pattern detected: {pattern_name}")

    def _get_pattern_complexity(self, pattern_name: str) -> int:
        """Get complexity score for different pattern types"""
        complexity_scores = {
            'price_greater_than': 1,
            'volume_spike': 2,
            'ma_cross': 3,
            'rsi_condition': 3,
            'bb_condition': 4,
            'time_condition': 2,
            'support_resistance': 2,
            'percent_change': 3
        }
        return complexity_scores.get(pattern_name, 2)

    def _calculate_scanner_complexity(self, logic: str, patterns: List[TradingPattern]) -> str:
        """Calculate complexity level for individual scanner"""
        total_score = sum(p.complexity_score for p in patterns)
        line_count = len(logic.split('\n'))

        # Adjust for code length
        total_score += line_count // 5

        if total_score <= 3:
            return "low"
        elif total_score <= 7:
            return "medium"
        else:
            return "high"

    def _calculate_complexity(self, code: str, scanner_details: List[Dict]) -> int:
        """Calculate overall complexity score"""
        total_score = 0

        for scanner in scanner_details:
            complexity = scanner['complexity']
            param_count = len(scanner['parameters'])

            # Base complexity score
            if complexity == "low":
                total_score += 1
            elif complexity == "medium":
                total_score += 3
            else:
                total_score += 5

            # Parameter complexity bonus
            total_score += param_count // 3

        # Code size factor
        total_score += len(code) // 10000

        return total_score

    def _calculate_confidence(self, scanner_details: List[Dict], total_parameters: int) -> float:
        """Calculate overall analysis confidence"""
        if not scanner_details:
            return 0.0

        # Base confidence from successful pattern recognition
        base_confidence = 0.85

        # Parameter extraction success bonus
        param_bonus = min(total_parameters * 0.02, 0.15)

        # Pattern recognition bonus
        total_patterns = sum(len(s.get('patterns_detected', [])) for s in scanner_details)
        pattern_bonus = min(total_patterns * 0.01, 0.1)

        return min(base_confidence + param_bonus + pattern_bonus, 0.95)

    def _generate_scanner_description(self, name: str, patterns: List[TradingPattern]) -> str:
        """Generate human-readable description for scanner"""
        if not patterns:
            return f"Trading scanner '{name}' with custom logic"

        pattern_types = [p.pattern_type.value.replace('_', ' ').title() for p in patterns]
        unique_types = list(set(pattern_types))

        if len(unique_types) == 1:
            return f"Trading scanner '{name}' using {unique_types[0]} analysis"
        elif len(unique_types) <= 3:
            return f"Trading scanner '{name}' combining {', '.join(unique_types[:2])} and {unique_types[-1]} analysis"
        else:
            return f"Trading scanner '{name}' using multi-factor analysis with {len(unique_types)} different condition types"

    def _parameter_to_dict(self, param: ExtractedParameter) -> Dict[str, Any]:
        """Convert ExtractedParameter to dictionary for JSON serialization"""
        return {
            'name': param.name,
            'current_value': param.current_value,
            'type': param.parameter_type,
            'category': param.category,
            'description': param.description,
            'suggested_range': param.suggested_range,
            'optimization_priority': param.optimization_priority
        }

    def _get_complexity_breakdown(self, scanner_details: List[Dict]) -> Dict[str, int]:
        """Get breakdown of complexity by category"""
        breakdown = {'low': 0, 'medium': 0, 'high': 0}

        for scanner in scanner_details:
            complexity = scanner['complexity']
            breakdown[complexity] += 1

        return breakdown

# Test the pattern engine
if __name__ == "__main__":
    # Initialize the engine
    engine = EdgeDevPatternEngine()

    # Test with sample trading code
    sample_code = """
# Sample trading scanner code
import pandas as pd

def trading_scanner(df):
    # Price breakout above previous high
    df['breakout_scanner'] = ((df['h'] > df['h1']) &
                              (df['v'] > df['v1'] * 1.5) &
                              (df['rsi_14'] < 70)).astype(int)

    # Moving average crossover
    df['ma_cross_scanner'] = ((df['sma_5'] > df['sma_20']) &
                              (df['sma_20'] > df['sma_50'])).astype(int)

    return df
    """

    # Test the analysis
    result = engine.analyze_scanner_code(sample_code)

    print("🔍 Edge-Dev Pattern Engine Test Results:")
    print(f"Scanners found: {result['total_scanners']}")
    print(f"Parameters extracted: {result['total_parameters']}")
    print(f"Confidence: {result['analysis_confidence']:.2f}")
    print(f"Method: {result['method']}")