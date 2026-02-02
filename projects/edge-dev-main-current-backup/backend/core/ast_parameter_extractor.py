#!/usr/bin/env python3
"""
🤖 AST-Based Trading Parameter Extractor
==========================================

Intelligent extraction of trading filter parameters from Python scanner code
using Abstract Syntax Tree analysis. Replaces rigid regex patterns with
smart code structure analysis.

Key Features:
- Extracts assignments, comparisons, dictionary values
- Captures context for LLM classification
- Handles complex conditional logic
- Maps parameters to line numbers for debugging
"""

import ast
import re
from typing import Dict, List, Tuple, Any, Optional
from dataclasses import dataclass
from pathlib import Path

@dataclass
class ExtractedParameter:
    """Represents a parameter extracted from scanner code"""
    name: str
    value: Any
    context: str  # surrounding code for classification
    line_number: int
    extraction_type: str  # 'assignment', 'comparison', 'dict_value', 'method_arg'
    confidence: float = 1.0  # confidence in extraction accuracy

class ASTParameterExtractor(ast.NodeVisitor):
    """
    🔍 Intelligent parameter extraction using Python AST analysis

    Extracts all potential trading parameters from scanner code:
    1. Variable assignments: atr_mult = 4
    2. Comparison operations: df['gap_atr'] >= 0.3
    3. Dictionary values: {'ema_dev': 2.0}
    4. Method arguments: .rolling(window=14)
    """

    def __init__(self):
        self.parameters: List[ExtractedParameter] = []
        self.code_lines: List[str] = []
        self.current_context = ""

    def extract_parameters(self, code: str) -> List[ExtractedParameter]:
        """
        🎯 Main extraction method - Extract all parameters from Python code

        Args:
            code: Python scanner code as string

        Returns:
            List of ExtractedParameter objects with context for classification
        """
        try:
            # Parse code and split into lines for context
            tree = ast.parse(code)
            self.code_lines = code.split('\n')
            self.parameters = []

            print(f"🔍 AST parsing successful, analyzing {len(self.code_lines)} lines...")

            # PRIORITY 1: Extract P dictionary parameters first (most accurate)
            self._extract_p_dictionary_parameters(code)

            # Visit all nodes in the AST for other parameters
            self.visit(tree)

            # Post-process and deduplicate properly
            self.parameters = self._deduplicate_parameters()

            # Final filtering - keep ONLY P dictionary parameters for maximum accuracy
            self.parameters = [p for p in self.parameters if p.extraction_type == 'p_dictionary']

            print(f"✅ AST extraction complete: {len(self.parameters)} parameters found")
            return self.parameters

        except SyntaxError as e:
            print(f"❌ AST parsing failed - syntax error: {e}")
            return []
        except Exception as e:
            print(f"❌ AST extraction failed: {e}")
            return []

    def visit_Assign(self, node):
        """Handle variable assignments: atr_mult = 4, threshold_value = 0.5"""
        try:
            # Handle single target assignments
            if len(node.targets) == 1:
                target = node.targets[0]

                # Simple variable assignment: var = value
                if isinstance(target, ast.Name):
                    param_name = target.id
                    param_value = self._extract_value(node.value)

                    if self._is_potential_parameter(param_name, param_value):
                        context = self._get_context_lines(node.lineno)

                        self.parameters.append(ExtractedParameter(
                            name=param_name,
                            value=param_value,
                            context=context,
                            line_number=node.lineno,
                            extraction_type='assignment',
                            confidence=0.8
                        ))

        except Exception as e:
            print(f"⚠️ Error in visit_Assign: {e}")

        self.generic_visit(node)

    def visit_Compare(self, node):
        """Handle comparison operations: df['gap_atr'] >= 0.3, atr_mult > 2"""
        try:
            # Extract parameter name and threshold value from comparisons
            left = node.left

            # Handle different comparison patterns
            if isinstance(left, ast.Subscript):
                # df['parameter'] >= value
                param_name = self._extract_subscript_key(left)
            elif isinstance(left, ast.Name):
                # parameter >= value
                param_name = left.id
            elif isinstance(left, ast.Attribute):
                # obj.parameter >= value
                param_name = left.attr
            else:
                param_name = None

            if param_name and node.comparators:
                # Extract the comparison value (threshold)
                param_value = self._extract_value(node.comparators[0])

                if self._is_potential_parameter(param_name, param_value):
                    context = self._get_context_lines(node.lineno)

                    self.parameters.append(ExtractedParameter(
                        name=param_name,
                        value=param_value,
                        context=context,
                        line_number=node.lineno,
                        extraction_type='comparison',
                        confidence=0.95  # Comparisons are high confidence for trading filters
                    ))

        except Exception as e:
            print(f"⚠️ Error in visit_Compare: {e}")

        self.generic_visit(node)

    def visit_Dict(self, node):
        """Handle dictionary definitions: {'atr_mult': 4, 'ema_dev': 2.0}"""
        try:
            for key_node, value_node in zip(node.keys, node.values):
                if isinstance(key_node, ast.Str):
                    # Python < 3.8 string literals
                    param_name = key_node.s
                elif isinstance(key_node, ast.Constant) and isinstance(key_node.value, str):
                    # Python >= 3.8 string literals
                    param_name = key_node.value
                else:
                    continue

                param_value = self._extract_value(value_node)

                if self._is_potential_parameter(param_name, param_value):
                    context = self._get_context_lines(node.lineno)

                    self.parameters.append(ExtractedParameter(
                        name=param_name,
                        value=param_value,
                        context=context,
                        line_number=node.lineno,
                        extraction_type='dict_value',
                        confidence=0.9
                    ))

        except Exception as e:
            print(f"⚠️ Error in visit_Dict: {e}")

        self.generic_visit(node)

    def visit_Call(self, node):
        """Handle method calls with parameters: .rolling(window=14), .ewm(span=20)"""
        try:
            # Extract keyword arguments from method calls
            for keyword in node.keywords:
                if keyword.arg:  # Skip **kwargs
                    param_name = keyword.arg
                    param_value = self._extract_value(keyword.value)

                    if self._is_potential_parameter(param_name, param_value):
                        # Build more descriptive name for method parameters
                        method_name = self._get_method_name(node)
                        if method_name:
                            param_name = f"{method_name}_{param_name}"

                        context = self._get_context_lines(node.lineno)

                        self.parameters.append(ExtractedParameter(
                            name=param_name,
                            value=param_value,
                            context=context,
                            line_number=node.lineno,
                            extraction_type='method_arg',
                            confidence=0.7
                        ))

        except Exception as e:
            print(f"⚠️ Error in visit_Call: {e}")

        self.generic_visit(node)

    def _extract_value(self, node) -> Any:
        """Extract value from AST node, handling different value types"""
        try:
            if isinstance(node, ast.Constant):
                # Python >= 3.8
                return node.value
            elif isinstance(node, ast.Num):
                # Python < 3.8 numbers
                return node.n
            elif isinstance(node, ast.Str):
                # Python < 3.8 strings
                return node.s
            elif isinstance(node, ast.NameConstant):
                # Python < 3.8 constants (True, False, None)
                return node.value
            elif isinstance(node, ast.Name):
                # Variable reference - return the name
                return f"${node.id}"  # Mark as variable reference
            else:
                return None
        except:
            return None

    def _extract_subscript_key(self, node) -> Optional[str]:
        """Extract key from subscript: df['key'] -> 'key'"""
        try:
            if isinstance(node.slice, ast.Constant):
                return node.slice.value
            elif isinstance(node.slice, ast.Str):
                return node.slice.s
            elif isinstance(node.slice, ast.Index) and isinstance(node.slice.value, ast.Str):
                # Python < 3.9
                return node.slice.value.s
            elif isinstance(node.slice, ast.Index) and isinstance(node.slice.value, ast.Constant):
                # Python < 3.9
                return node.slice.value.value
            return None
        except:
            return None

    def _get_method_name(self, node) -> Optional[str]:
        """Extract method name from call node"""
        try:
            if isinstance(node.func, ast.Attribute):
                return node.func.attr
            elif isinstance(node.func, ast.Name):
                return node.func.id
            return None
        except:
            return None

    def _extract_p_dictionary_parameters(self, code: str):
        """
        🎯 PRIORITY 1: Extract parameters from P dictionary

        This is the most reliable source of actual user-configurable parameters
        in trading scanners. P dictionary contains the meaningful trading parameters.
        """
        import re

        # Find P dictionary using regex
        p_dict_match = re.search(r'P\s*=\s*\{(.*?)\}', code, re.DOTALL)
        if p_dict_match:
            p_content = p_dict_match.group(1)
            print(f"🎯 Found P dictionary - extracting high-confidence parameters...")

            # Extract parameter lines
            lines = p_content.split('\n')
            for line_num, line in enumerate(lines, 1):
                line = line.strip()

                # Skip comments and empty lines
                if not line or line.startswith('#'):
                    continue

                # Extract parameter name and value
                if ':' in line:
                    try:
                        # Split on first colon to handle values with colons
                        param_part, value_part = line.split(':', 1)
                        param_name = param_part.strip().strip('"\'')

                        # Clean up value and convert (handle comments)
                        value_str = value_part.split('#')[0].strip()  # Remove inline comments
                        value_str = value_str.rstrip(',').strip('"\'')

                        # Convert to appropriate type
                        param_value = self._convert_parameter_value(value_str)

                        if param_value is not None:
                            context = f"P dictionary parameter (line {line_num})"

                            self.parameters.append(ExtractedParameter(
                                name=param_name,
                                value=param_value,
                                context=context,
                                line_number=0,  # P dict has specific line handling
                                extraction_type='p_dictionary',
                                confidence=1.0  # Maximum confidence for P dict
                            ))
                            print(f"   ✅ P parameter: {param_name} = {param_value}")

                    except Exception as e:
                        print(f"   ⚠️ Could not parse P parameter line: {line[:50]}...")

    def _convert_parameter_value(self, value_str: str) -> Any:
        """Convert parameter value string to appropriate type"""
        try:
            # Handle None values
            if value_str.lower() == 'none':
                return None

            # Handle boolean values
            if value_str.lower() in ('true', 'false'):
                return value_str.lower() == 'true'

            # Clean numeric underscores
            if '_' in value_str:
                value_str = value_str.replace('_', '')

            # Handle floats
            if '.' in value_str:
                return float(value_str)

            # Handle integers
            return int(value_str)

        except ValueError:
            # Return as string if cannot convert to number
            return value_str

    def _prioritize_actual_parameters(self) -> List[ExtractedParameter]:
        """
        🎯 Filter and prioritize actual trading parameters vs noise

        Prioritizes:
        1. P dictionary parameters (highest confidence)
        2. Clear assignment variables with trading names
        3. Filters out API calls, pandas parameters, method arguments
        """
        # Separate by extraction type
        p_dict_params = [p for p in self.parameters if p.extraction_type == 'p_dictionary']
        trading_assignments = [p for p in self.parameters if p.extraction_type == 'assignment' and self._is_trading_parameter(p.name, p.value)]
        other_params = [p for p in self.parameters if p.extraction_type not in ['p_dictionary', 'assignment']]

        # Clear current parameters and re-add in priority order
        prioritized = []

        # 1. P dictionary parameters (highest priority)
        prioritized.extend(p_dict_params)

        # 2. Clear trading assignments
        prioritized.extend(trading_assignments)

        # 3. Limited other parameters (only if they look like real trading params)
        limited_other = [p for p in other_params if self._is_trading_parameter(p.name, p.value)][:5]  # Max 5 others
        prioritized.extend(limited_other)

        print(f"🎯 Parameter prioritization:")
        print(f"   P dictionary: {len(p_dict_params)}")
        print(f"   Trading assignments: {len(trading_assignments)}")
        print(f"   Limited others: {len(limited_other)}")
        print(f"   Final prioritized: {len(prioritized)}")

        return prioritized

    def _is_trading_parameter(self, name: str, value: Any) -> bool:
        """
        🎯 Enhanced filtering for actual trading parameters vs system noise

        Returns True only for parameters that look like actual trading configuration.
        """
        if not name or not isinstance(name, str):
            return False

        name_lower = name.lower()

        # DEFINITE trading parameter patterns
        trading_patterns = [
            r'^price_',
            r'^vol_',
            r'^atr_',
            r'^ema_',
            r'^gap_',
            r'^slope_',
            r'^threshold',
            r'^mult$',
            r'^min_',
            r'^max_',
            r'^lookback',
            r'^exclude_',
            r'^trigger_',
            r'^adv\d+',
            r'^d\d_',
            r'^abs_',
            r'^rel_',
            r'^require_',
            r'^enforce_'
        ]

        # Check for trading patterns
        for pattern in trading_patterns:
            if re.match(pattern, name_lower):
                return True

        # DEFINITE non-trading parameter patterns to exclude
        system_patterns = [
            r'^concat_',
            r'^ewm_',
            r'^rolling_',
            r'^to_',
            r'^max_axis',
            r'^sort',
            r'^limit$',
            r'^adjusted$',
            r'^apikey$',
            r'^[ohlcv]$',  # OHLCV single letters
            r'^fetch_',
            r'^datetime',
            r'^index$',
            r'^axis$',
            r'^ignore_index',
            r'^concat$',
            r'^threads?',
            r'^workers?',
            r'^pool',
            r'^executor',
            r'^session',
            r'^timeout',
            r'^header'
        ]

        # Check for system patterns
        for pattern in system_patterns:
            if re.match(pattern, name_lower):
                return False

        # Single-letter parameters are usually not user-configurable (except maybe 'P')
        if len(name) == 1 and name.upper() != 'P':
            return False

        # Method arguments with underscores are usually not user params
        if name.count('_') >= 2 and not any(re.match(pattern, name_lower) for pattern in trading_patterns):
            return False

        # Accept reasonable numeric values
        if isinstance(value, (int, float)):
            # Reject very specific system numbers
            if value in [0, 1, -1, 50000] and not any(re.match(pattern, name_lower) for pattern in trading_patterns):
                return False
            return True

        # Accept meaningful string values
        if isinstance(value, str):
            meaningful_values = ['true', 'false', 'D1_only', 'D1_or_D2', 'asc', 'desc']
            if value.lower() in meaningful_values:
                return True
            # API keys and dates
            if len(value) > 10:
                return True

        return False

    def _is_potential_parameter(self, name: str, value: Any) -> bool:
        """
        🎯 Filter potential trading parameters vs noise

        Basic filtering to avoid extracting obvious non-parameters:
        - Must have reasonable name
        - Must have numeric value or reasonable string
        - Skip obvious system variables
        """
        if not name or not isinstance(name, str):
            return False

        # Skip obviously non-parameter names
        skip_patterns = [
            r'^_',          # Private variables
            r'^[A-Z_]+$',   # All caps constants (except if they look like config)
            r'^\d',         # Names starting with digits
            r'^(self|cls|df|pd|np|sys|os)$'  # Common variable names
        ]

        for pattern in skip_patterns:
            if re.match(pattern, name):
                return False

        # Value filtering
        if value is None:
            return False

        # Accept numeric values
        if isinstance(value, (int, float)):
            return True

        # Accept reasonable string values (like API keys, dates)
        if isinstance(value, str) and len(value) > 0:
            return True

        # Accept variable references
        if isinstance(value, str) and value.startswith('$'):
            return True

        return False

    def _get_context_lines(self, line_number: int, context_size: int = 2) -> str:
        """Get surrounding code lines for context"""
        try:
            start = max(0, line_number - context_size - 1)
            end = min(len(self.code_lines), line_number + context_size)

            context_lines = self.code_lines[start:end]
            return '\n'.join(context_lines).strip()
        except:
            return ""

    def _deduplicate_parameters(self) -> List[ExtractedParameter]:
        """Remove duplicate parameters, keeping highest confidence version"""
        seen = {}

        for param in self.parameters:
            if param.name not in seen or param.confidence > seen[param.name].confidence:
                seen[param.name] = param

        # Sort by parameter name for consistent output
        return list(seen.values())

    def get_extraction_summary(self) -> Dict[str, Any]:
        """Get summary of extraction results for debugging"""
        by_type = {}
        for param in self.parameters:
            if param.extraction_type not in by_type:
                by_type[param.extraction_type] = 0
            by_type[param.extraction_type] += 1

        return {
            'total_parameters': len(self.parameters),
            'by_extraction_type': by_type,
            'avg_confidence': sum(p.confidence for p in self.parameters) / len(self.parameters) if self.parameters else 0,
            'parameter_names': [p.name for p in self.parameters]
        }

# Test function for development
if __name__ == "__main__":
    print("🔍 AST Parameter Extractor - Test Mode")

    # Test with sample LC D2 scanner code
    sample_code = '''
# Sample trading scanner parameters
atr_mult = 4
ema_dev = 2.0
gap_threshold = 0.3

# Dictionary parameters
params = {
    'dist_h_9ema_atr': 2.0,
    'high_pct_chg': 0.5,
    'close_range': 0.6
}

# Comparison filters
if (df['gap_atr'] >= 0.3) & (df['high_chg_atr'] >= 1.5):
    pass

# Method parameters
df['ema9'] = df['c'].ewm(span=9).mean()
df['atr'] = df['true_range'].rolling(window=14).mean()
'''

    extractor = ASTParameterExtractor()
    parameters = extractor.extract_parameters(sample_code)

    print(f"\n📊 Extraction Results:")
    print(f"   Total parameters: {len(parameters)}")

    for param in parameters:
        print(f"   🎯 {param.name}: {param.value} ({param.extraction_type}, confidence: {param.confidence:.2f})")

    print(f"\n📈 Summary:")
    summary = extractor.get_extraction_summary()
    for key, value in summary.items():
        print(f"   {key}: {value}")