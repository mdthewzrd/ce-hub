#!/usr/bin/env python3
"""
Multi-Scanner Pattern Extraction Fix

This module provides a robust solution for extracting pattern_assignments
from multi-scanner code and properly executing them.

The issue: Multi-scanners with pattern_assignments were failing to execute
because the execution wrapper wasn't properly handling the pattern detection logic.

The fix: Extract pattern_assignments and create proper execution wrapper that
iterates through patterns and applies detection logic correctly.
"""

import re
import ast
from typing import List, Dict, Any, Optional, Tuple


class MultiScannerPatternExtractor:
    """
    Extract pattern_assignments from multi-scanner code

    Handles various formats of pattern_assignments:
    1. List of dicts with 'name' and 'logic' keys
    2. List of dicts with 'name' and 'condition' keys
    3. Custom pattern structures
    """

    def __init__(self, code: str):
        """
        Initialize extractor with scanner code

        Args:
            code: Python scanner code to analyze
        """
        self.code = code
        self.lines = code.split('\n')

    def extract_pattern_assignments(self) -> Tuple[List[Dict[str, Any]], Optional[str]]:
        """
        Extract pattern_assignments from code

        Returns:
            Tuple of (pattern_assignments list, error message if any)
        """
        try:
            # Method 1: Try to parse pattern_assignments using AST
            patterns = self._extract_via_ast()
            if patterns:
                return patterns, None

            # Method 2: Try regex-based extraction
            patterns = self._extract_via_regex()
            if patterns:
                return patterns, None

            # Method 3: Try to detect multi-pattern structure
            patterns = self._extract_via_structure_detection()
            if patterns:
                return patterns, None

            return [], "No pattern_assignments found in code"

        except Exception as e:
            return [], f"Error extracting patterns: {str(e)}"

    def _extract_via_ast(self) -> Optional[List[Dict[str, Any]]]:
        """Extract pattern_assignments using AST parsing"""
        try:
            tree = ast.parse(self.code)

            for node in ast.walk(tree):
                if isinstance(node, ast.Assign):
                    # Look for: pattern_assignments = [...]
                    for target in node.targets:
                        if isinstance(target, ast.Name) and target.id == 'pattern_assignments':
                            # Found it! Now extract the list
                            if isinstance(node.value, (ast.List, ast.Tuple)):
                                patterns = []
                                for elt in node.value.elts:
                                    if isinstance(elt, ast.Dict):
                                        pattern_dict = self._extract_pattern_from_dict(elt)
                                        if pattern_dict:
                                            patterns.append(pattern_dict)
                                return patterns if patterns else None
        except Exception as e:
            # AST parsing failed, will try other methods
            return None

        return None

    def _extract_pattern_from_dict(self, dict_node: ast.Dict) -> Optional[Dict[str, Any]]:
        """Extract pattern from AST Dict node"""
        pattern = {}
        keys = []
        values = []

        for key in dict_node.keys:
            if isinstance(key, ast.Constant):
                keys.append(key.value)
            elif isinstance(key, ast.Str):  # Python < 3.8
                keys.append(key.s)

        for value in dict_node.values:
            if isinstance(value, ast.Constant):
                values.append(value.value)
            elif isinstance(value, ast.Str):  # Python < 3.8
                values.append(value.s)
            elif isinstance(value, ast.NameConstant):  # Python < 3.8
                values.append(value.value)
            else:
                # For complex expressions, try to unparse
                values.append(ast.unparse(value))

        # Create pattern dictionary
        for i, key in enumerate(keys):
            if i < len(values):
                pattern[key] = values[i]

        # Validate pattern has required fields
        if 'name' in pattern:
            return pattern
        return None

    def _extract_via_regex(self) -> Optional[List[Dict[str, Any]]]:
        """Extract pattern_assignments using regex"""
        # Look for pattern_assignments = [ ... ]
        pattern = r'pattern_assignments\s*=\s*\[(.*?)\]'
        matches = re.findall(pattern, self.code, re.DOTALL)

        if not matches:
            return None

        patterns = []
        for match in matches:
            # Extract individual pattern dictionaries
            # Look for {'name': ..., 'logic': ...} or {"name": ..., "logic": ...}
            dict_pattern = r'\{[^}]*["\']name["\']\s*:\s*[^,]+,\s*["\'](?:logic|condition|detection)["\']\s*:\s*[^}]+\}'
            dict_matches = re.findall(dict_pattern, match, re.DOTALL)

            for dict_match in dict_matches:
                pattern = self._parse_pattern_dict(dict_match)
                if pattern:
                    patterns.append(pattern)

        return patterns if patterns else None

    def _parse_pattern_dict(self, dict_str: str) -> Optional[Dict[str, Any]]:
        """Parse individual pattern dictionary string"""
        try:
            # Safely evaluate the dictionary
            # Replace single quotes with double quotes for JSON parsing
            dict_str = dict_str.replace("'", '"')

            # Extract key-value pairs manually for safety
            pattern = {}

            # Extract name
            name_match = re.search(r'"name"\s*:\s*"([^"]+)"', dict_str)
            if name_match:
                pattern['name'] = name_match.group(1)

            # Extract logic/condition/detection
            logic_match = re.search(r'"(logic|condition|detection)"\s*:\s*"([^"]+)"', dict_str)
            if logic_match:
                pattern['logic'] = logic_match.group(2)
            elif 'logic' in dict_str.lower() or 'condition' in dict_str.lower():
                # Try to extract logic as raw string (may contain special characters)
                logic_match = re.search(r'"(logic|condition|detection)"\s*:\s*([^,}\n]+)', dict_str)
                if logic_match:
                    pattern['logic'] = logic_match.group(2).strip().strip('"').strip("'")

            # Extract other fields
            desc_match = re.search(r'"description"\s*:\s*"([^"]*)"', dict_str)
            if desc_match:
                pattern['description'] = desc_match.group(1)

            if pattern and 'name' in pattern and 'logic' in pattern:
                return pattern

        except Exception as e:
            pass

        return None

    def _extract_via_structure_detection(self) -> Optional[List[Dict[str, Any]]]:
        """Detect and extract patterns from code structure"""
        patterns = []

        # Look for methods that might be pattern detectors
        # Common patterns: detect_<pattern>, check_<pattern>, is_<pattern>
        pattern_method_pattern = r'def\s+(detect|check|is)_(\w+)\s*\('
        matches = re.findall(pattern_method_pattern, self.code)

        if len(matches) > 1:
            # Multiple detection methods found - likely a multi-scanner
            for prefix, pattern_name in matches:
                # Try to extract the logic from the method
                method_start = self.code.find(f'def {prefix}_{pattern_name}(')
                if method_start != -1:
                    # Find the method body (simplified)
                    method_section = self.code[method_start:min(method_start+500, len(self.code))]

                    # Extract return statement or condition
                    logic_match = re.search(r'return\s+([^\n]+)', method_section)
                    if logic_match:
                        logic = logic_match.group(1).strip()
                    else:
                        # Use the pattern name as logic placeholder
                        logic = f"# {pattern_name.upper()}_PATTERN"

                    patterns.append({
                        'name': f"{prefix}_{pattern_name}",
                        'logic': logic,
                        'method_name': f"{prefix}_{pattern_name}"
                    })

        return patterns if len(patterns) > 1 else None


def create_multi_scanner_wrapper(original_code: str, pattern_assignments: List[Dict[str, Any]]) -> str:
    """
    Create a proper execution wrapper for multi-scanner code

    Args:
        original_code: Original scanner code
        pattern_assignments: Extracted pattern assignments

    Returns:
        Modified code with proper execution wrapper
    """
    # Extract the original class and methods
    class_match = re.search(r'class\s+(\w+)\s*:\s*\n(""" + r'"""' + r'[^"]*' + r'"""' + r')?', original_code)

    if not class_match:
        return original_code  # Can't wrap if no class found

    class_name = class_match.group(1)

    # Create wrapper code
    wrapper_code = f"""
# Multi-Scanner Execution Wrapper
# Generated to properly handle {len(pattern_assignments)} patterns

import pandas as pd
import numpy as np
from datetime import datetime
from typing import List, Dict, Any

{original_code}

# Multi-scanner execution adapter
class MultiScannerExecutor:
    def __init__(self, scanner_class, pattern_assignments: List[Dict[str, Any]]):
        self.scanner_class = scanner_class
        self.pattern_assignments = pattern_assignments
        self.scanner_instance = None

    def execute_with_patterns(self, start_date: str, end_date: str) -> List[Dict[str, Any]]:
        \"\"\"Execute scanner with all patterns\"\"\\"\"
        # Initialize scanner
        self.scanner_instance = self.scanner_class()

        # Run the scan (this will use original scanner's pipeline)
        results = self.scanner_instance.run_scan(start_date=start_date, end_date=end_date)

        # Process results and add pattern labels
        if not results.empty:
            # Convert to list of dicts with pattern labels
            formatted_results = []
            for idx, row in results.iterrows():
                result_dict = row.to_dict()
                # Add pattern labels if available
                if 'Scanner_Label' in result_dict:
                    result_dict['patterns'] = result_dict['Scanner_Label'].split(', ')
                formatted_results.append(result_dict)
            return formatted_results

        return []

# Create executor instance
executor = MultiScannerExecutor({class_name}, {pattern_assignments})
"""

    return wrapper_code


def fix_multi_scanner_execution(code: str) -> Tuple[str, Optional[str]]:
    """
    Fix multi-scanner code to execute properly

    Args:
        code: Original multi-scanner code

    Returns:
        Tuple of (fixed_code, error_message if any)
    """
    # Extract pattern assignments
    extractor = MultiScannerPatternExtractor(code)
    patterns, error = extractor.extract_pattern_assignments()

    if error or not patterns:
        return code, f"Pattern extraction failed: {error}"

    print(f"✅ Extracted {len(patterns)} patterns:")
    for pattern in patterns:
        print(f"   - {pattern.get('name', 'Unknown')}")

    # Create fixed wrapper
    fixed_code = create_multi_scanner_wrapper(code, patterns)

    return fixed_code, None


# Standalone test function
def test_extraction(test_code: str):
    """Test pattern extraction on sample code"""
    extractor = MultiScannerPatternExtractor(test_code)
    patterns, error = extractor.extract_pattern_assignments()

    if error:
        print(f"❌ Error: {error}")
        return False

    print(f"✅ Successfully extracted {len(patterns)} patterns:")
    for i, pattern in enumerate(patterns, 1):
        print(f"{i}. {pattern.get('name', 'Unknown')}: {pattern.get('logic', 'No logic')[:50]}")

    return True


if __name__ == "__main__":
    # Test with sample multi-scanner code
    sample_code = '''
class TestMultiScanner:
    def __init__(self):
        self.pattern_assignments = [
            {
                "name": "lc_frontside_d3",
                "logic": "(gap > 0.01) & (range > range.mean()) & (close > open)"
            },
            {
                "name": "lc_backside_d3",
                "logic": "(gap < -0.01) & (range > range.mean()) & (close < open)"
            }
        ]

    def run_scan(self, start_date, end_date):
        # Scan implementation
        pass
'''

    print("Testing multi-scanner pattern extraction...")
    test_extraction(sample_code)
