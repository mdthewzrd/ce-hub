#!/usr/bin/env python3
"""
Comprehensive Parameter Detection Fix Implementation
Addresses the critical discrepancy where splitter finds 59 parameters but formatter shows 0.

Key Fix: Focus on TRADING LOGIC parameters in DataFrame conditions and parameter dictionaries.
Ignore infrastructure values (ports, line numbers, timeouts) that are not configurable trading params.
"""

import re
import ast
import json
import pandas as pd
from typing import Dict, List, Tuple, Any, Set

def extract_trading_parameters_enhanced(code: str) -> Dict[str, Any]:
    """
    Enhanced parameter detection that focuses on TRADING LOGIC parameters.

    Identifies:
    1. DataFrame filtering conditions: df['high_pct_chg1'] >= .5
    2. Parameter dictionaries: {'atr_mult': 4, 'vol_mult': 2.0}
    3. Trading thresholds and multipliers in scanner logic
    4. Configurable values that affect trading decisions

    Ignores:
    - Infrastructure values (ports, timeouts, line numbers)
    - Data processing constants (window sizes for rolling means)
    - API keys and URLs
    """

    parameters = {}
    trading_contexts = set()

    # 1. Extract DataFrame condition parameters
    dataframe_patterns = [
        # Standard comparison operators with DataFrame columns
        r"df\['(\w+)'\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)",
        r"df\[\"(\w+)\"\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)",
        # Parenthesized conditions
        r"\(df\['(\w+)'\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)\)",
        r"\(df\[\"(\w+)\"\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)\)",
    ]

    for pattern in dataframe_patterns:
        matches = re.finditer(pattern, code)
        for match in matches:
            column_name = match.group(1)
            operator = match.group(2)
            value = match.group(3)

            # Filter for trading-relevant columns
            if is_trading_parameter(column_name, value):
                param_key = f"{column_name}_{operator.replace('=', 'eq').replace('>', 'gt').replace('<', 'lt')}"
                parameters[param_key] = float(value)
                trading_contexts.add(f"DataFrame condition: {column_name} {operator} {value}")

    # 2. Extract parameter dictionaries
    dict_patterns = [
        r"(\w+)\s*=\s*\{([^}]+)\}",  # variable = {key: value, ...}
        r"defaults\s*=\s*\{([^}]+)\}",  # defaults = {...}
        r"custom_params\s*=\s*\{([^}]+)\}",  # custom_params = {...}
        r"params\s*=\s*\{([^}]+)\}",  # params = {...}
    ]

    for pattern in dict_patterns:
        matches = re.finditer(pattern, code)
        for match in matches:
            try:
                dict_content = match.group(2) if len(match.groups()) >= 2 else match.group(1)
            except IndexError:
                continue
            dict_params = parse_dictionary_content(dict_content)
            for key, value in dict_params.items():
                if is_trading_parameter(key, str(value)):
                    parameters[key] = value
                    trading_contexts.add(f"Dictionary parameter: {key} = {value}")

    # 3. Extract function parameter assignments in trading scanner functions
    function_patterns = [
        r"def\s+(check_high_lvl_filter_\w+|scan_daily_\w+|.*scanner.*)\([^)]*\):",
        r"def\s+(.*scan.*)\([^)]*\):",
    ]

    for pattern in function_patterns:
        func_matches = re.finditer(pattern, code, re.IGNORECASE)
        for func_match in func_matches:
            func_start = func_match.start()
            # Extract parameters within the function body
            func_body = extract_function_body(code, func_start)
            func_params = extract_function_parameters(func_body)
            for key, value in func_params.items():
                if is_trading_parameter(key, str(value)):
                    parameters[f"func_{key}"] = value
                    trading_contexts.add(f"Function parameter: {key} = {value}")

    # 4. Extract assignment statements with trading-relevant variable names
    assignment_patterns = [
        r"(\w*(?:mult|threshold|min|max|limit|pct|atr|vol|gap|slope)\w*)\s*=\s*([+-]?\d*\.?\d+)",
        r"(\w*(?:high|low|close|range)\w*)\s*=\s*([+-]?\d*\.?\d+)",
    ]

    for pattern in assignment_patterns:
        matches = re.finditer(pattern, code, re.IGNORECASE)
        for match in matches:
            var_name = match.group(1)
            value = match.group(2)

            if is_trading_parameter(var_name, value) and not is_infrastructure_value(var_name, value):
                parameters[var_name] = float(value)
                trading_contexts.add(f"Assignment: {var_name} = {value}")

    # 5. Extract comparison values in conditional statements
    condition_patterns = [
        r"if\s+.*?([>=<]+)\s*([+-]?\d*\.?\d+)",
        r"elif\s+.*?([>=<]+)\s*([+-]?\d*\.?\d+)",
    ]

    for pattern in condition_patterns:
        matches = re.finditer(pattern, code)
        for match in matches:
            operator = match.group(1)
            value = match.group(2)

            # Extract the full condition to understand context
            full_line = get_line_containing_match(code, match.start())
            if contains_trading_context(full_line):
                param_key = f"condition_threshold_{len(parameters)}"
                parameters[param_key] = float(value)
                trading_contexts.add(f"Conditional threshold: {value} in {full_line.strip()}")

    return {
        'parameters': parameters,
        'contexts': list(trading_contexts),
        'count': len(parameters)
    }

def is_trading_parameter(name: str, value: str) -> bool:
    """
    Determine if a parameter is related to trading logic.

    Returns True for:
    - Volume/ATR multipliers: vol_mult, atr_mult
    - Percentage thresholds: high_pct_chg, gap_pct
    - Price/range filters: close_range, high_chg
    - EMA distance parameters: dist_h_9ema_atr
    - Trading bounds: c_ua (price bounds), v_ua (volume bounds)

    Returns False for:
    - Infrastructure: ports, API keys, line numbers
    - Data processing: rolling window sizes
    - Timestamps and dates
    """

    trading_keywords = [
        'mult', 'threshold', 'min', 'max', 'limit', 'pct', 'atr', 'vol', 'gap',
        'slope', 'high', 'low', 'close', 'range', 'ema', 'dist', 'chg',
        'score', 'burst', 'tier', 'watch', 'filter', 'param'
    ]

    infrastructure_keywords = [
        'port', 'url', 'key', 'api', 'host', 'timeout', 'retry', 'delay',
        'line', 'debug', 'log', 'print', 'file', 'path', 'import', 'version'
    ]

    # Check if name contains trading keywords
    name_lower = name.lower()
    has_trading_keyword = any(keyword in name_lower for keyword in trading_keywords)

    # Check if name contains infrastructure keywords
    has_infrastructure_keyword = any(keyword in name_lower for keyword in infrastructure_keywords)

    # Check value range for trading parameters
    try:
        val = float(value)
        is_reasonable_trading_value = 0.01 <= abs(val) <= 10000
    except (ValueError, TypeError):
        is_reasonable_trading_value = False

    return has_trading_keyword and not has_infrastructure_keyword and is_reasonable_trading_value

def is_infrastructure_value(name: str, value: str) -> bool:
    """Check if this is an infrastructure value to ignore."""

    infrastructure_indicators = [
        'port', 'url', 'api', 'key', 'host', 'timeout', 'retry', 'delay',
        'line', 'debug', 'log', 'file', 'path', 'import', 'version',
        'date', 'time', 'year', 'month', 'day'
    ]

    name_lower = name.lower()

    # Check for infrastructure keywords
    if any(indicator in name_lower for indicator in infrastructure_indicators):
        return True

    # Check for large numbers that are likely infrastructure (ports, line numbers)
    try:
        val = float(value)
        if val > 10000 or (val == int(val) and val > 1000):  # Likely line numbers or ports
            return True
    except (ValueError, TypeError):
        pass

    return False

def parse_dictionary_content(content: str) -> Dict[str, Any]:
    """Parse dictionary content from string format."""

    try:
        # Try to evaluate as Python literal
        return ast.literal_eval(f"{{{content}}}")
    except (ValueError, SyntaxError):
        # Fallback: regex parsing
        parameters = {}
        pattern = r"['\"]?(\w+)['\"]?\s*:\s*([+-]?\d*\.?\d+)"
        matches = re.finditer(pattern, content)

        for match in matches:
            key = match.group(1)
            value = match.group(2)
            try:
                parameters[key] = float(value)
            except ValueError:
                parameters[key] = value

        return parameters

def extract_function_body(code: str, func_start: int) -> str:
    """Extract function body from start position."""

    lines = code[func_start:].split('\n')
    function_lines = []
    indent_level = None

    for i, line in enumerate(lines):
        if i == 0:  # Function definition line
            function_lines.append(line)
            continue

        stripped = line.lstrip()
        if not stripped:  # Empty line
            function_lines.append(line)
            continue

        current_indent = len(line) - len(stripped)

        if indent_level is None and stripped:
            indent_level = current_indent

        if stripped and current_indent <= indent_level and i > 1:
            break

        function_lines.append(line)

    return '\n'.join(function_lines)

def extract_function_parameters(func_body: str) -> Dict[str, Any]:
    """Extract parameter assignments within function body."""

    parameters = {}

    # Look for variable assignments
    assignment_pattern = r"^\s*(\w+)\s*=\s*([+-]?\d*\.?\d+)"
    lines = func_body.split('\n')

    for line in lines:
        match = re.search(assignment_pattern, line)
        if match:
            var_name = match.group(1)
            value = match.group(2)

            if is_trading_parameter(var_name, value):
                try:
                    parameters[var_name] = float(value)
                except ValueError:
                    parameters[var_name] = value

    return parameters

def contains_trading_context(line: str) -> bool:
    """Check if line contains trading-related context."""

    trading_indicators = [
        'df[', 'high_', 'low_', 'close_', 'volume_', 'atr_', 'gap_',
        'pct_', 'range_', 'ema', 'dist_', 'score_', 'filter'
    ]

    line_lower = line.lower()
    return any(indicator in line_lower for indicator in trading_indicators)

def get_line_containing_match(text: str, position: int) -> str:
    """Get the line containing the match position."""

    lines = text.split('\n')
    current_pos = 0

    for line in lines:
        if current_pos <= position <= current_pos + len(line):
            return line
        current_pos += len(line) + 1  # +1 for newline character

    return ""

def identify_scanner_functions(code: str) -> List[str]:
    """
    Identify actual trading scanner functions vs infrastructure functions.

    Real scanners:
    - check_high_lvl_filter_*
    - scan_daily_*
    - Functions with DataFrame filtering logic

    NOT scanners:
    - adjust_daily, compute_indicators (data processing)
    - fetch_data functions (API calls)
    - Helper/utility functions
    """

    scanner_functions = []

    # Patterns for scanner function names
    scanner_patterns = [
        r"def\s+(check_high_lvl_filter_\w*)\s*\(",
        r"def\s+(scan_daily_\w*)\s*\(",
        r"def\s+(\w*scan\w*)\s*\(",
        r"def\s+(\w*filter\w*)\s*\(",
        r"def\s+(\w*screen\w*)\s*\(",
    ]

    # Patterns for NON-scanner functions to exclude
    exclude_patterns = [
        r"def\s+(adjust_\w+)\s*\(",
        r"def\s+(compute_\w+)\s*\(",
        r"def\s+(fetch_\w+)\s*\(",
        r"def\s+(process_\w+)\s*\(",
        r"def\s+(get_\w+)\s*\(",
        r"def\s+(calculate_\w+)\s*\(",
    ]

    # Find potential scanner functions
    for pattern in scanner_patterns:
        matches = re.finditer(pattern, code, re.IGNORECASE)
        for match in matches:
            func_name = match.group(1)

            # Check if it contains actual trading logic
            func_start = match.start()
            func_body = extract_function_body(code, func_start)

            if contains_dataframe_filtering(func_body):
                scanner_functions.append(func_name)

    # Remove excluded functions
    for pattern in exclude_patterns:
        matches = re.finditer(pattern, code, re.IGNORECASE)
        for match in matches:
            func_name = match.group(1)
            if func_name in scanner_functions:
                scanner_functions.remove(func_name)

    return scanner_functions

def contains_dataframe_filtering(func_body: str) -> bool:
    """Check if function body contains DataFrame filtering logic."""

    filtering_indicators = [
        r"df\[.*\]\s*[><=!]+",  # DataFrame column comparisons
        r"\.astype\(int\)",     # Converting boolean filters to int
        r"np\.select",          # Numpy select for conditional logic
        r"np\.where",           # Numpy where for conditional logic
    ]

    for pattern in filtering_indicators:
        if re.search(pattern, func_body):
            return True

    return False

def test_parameter_detection_fix():
    """Test the enhanced parameter detection on all three user files."""

    files_to_test = [
        '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py',
        '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py',
        '/Users/michaeldurante/Downloads/half A+ scan copy.py'
    ]

    results = {}

    for file_path in files_to_test:
        print(f"\n{'='*80}")
        print(f"Testing: {file_path}")
        print(f"{'='*80}")

        try:
            with open(file_path, 'r') as f:
                code = f.read()

            # Extract trading parameters
            param_result = extract_trading_parameters_enhanced(code)

            # Identify scanner functions
            scanner_funcs = identify_scanner_functions(code)

            print(f"Scanner Functions Identified: {len(scanner_funcs)}")
            for func in scanner_funcs:
                print(f"  - {func}")

            print(f"\nTrading Parameters Found: {param_result['count']}")
            print("\nParameters:")
            for param, value in param_result['parameters'].items():
                print(f"  {param}: {value}")

            print("\nContexts:")
            for context in param_result['contexts'][:10]:  # Show first 10 contexts
                print(f"  - {context}")

            if len(param_result['contexts']) > 10:
                print(f"  ... and {len(param_result['contexts']) - 10} more")

            results[file_path] = {
                'parameters': param_result['parameters'],
                'count': param_result['count'],
                'scanners': scanner_funcs,
                'contexts': param_result['contexts']
            }

        except Exception as e:
            print(f"Error processing {file_path}: {e}")
            results[file_path] = {'error': str(e)}

    return results

if __name__ == "__main__":
    print("Running Comprehensive Parameter Detection Fix...")
    results = test_parameter_detection_fix()

    # Summary
    print(f"\n{'='*80}")
    print("SUMMARY")
    print(f"{'='*80}")

    for file_path, result in results.items():
        if 'error' in result:
            print(f"{file_path}: ERROR - {result['error']}")
        else:
            filename = file_path.split('/')[-1]
            print(f"{filename}: {result['count']} parameters, {len(result['scanners'])} scanners")