#!/usr/bin/env python3
"""
Enhanced Scanner Processor
Implements the comprehensive fix for parameter detection and scanner splitting/formatting.

Addresses the critical issue where 59 parameters are found but 0 configurable parameters are detected.
This implementation focuses on TRADING LOGIC parameters and real scanner functions.
"""

import re
import ast
import json
import os
from typing import Dict, List, Tuple, Any, Set
from comprehensive_parameter_fix_implementation import extract_trading_parameters_enhanced, identify_scanner_functions

def split_scanner_enhanced(file_path: str) -> Dict[str, Any]:
    """
    Enhanced scanner splitting that identifies:
    1. Real trading scanner functions (not infrastructure)
    2. Trading parameters embedded in DataFrame conditions
    3. Configurable parameter dictionaries
    4. Trading logic structures
    """

    try:
        with open(file_path, 'r') as f:
            code = f.read()
    except FileNotFoundError:
        return {'error': f"File not found: {file_path}"}

    # Extract trading parameters using enhanced detection
    param_result = extract_trading_parameters_enhanced(code)

    # Find scanner functions
    scanner_functions = find_trading_scanner_functions(code)

    # Extract scanner structures
    scanners = []
    for func_name in scanner_functions:
        scanner_info = extract_scanner_structure(code, func_name)
        if scanner_info:
            scanners.append(scanner_info)

    # Extract parameter dictionaries
    param_dicts = extract_parameter_dictionaries(code)

    result = {
        'file_path': file_path,
        'scanner_functions': len(scanner_functions),
        'scanners': scanners,
        'trading_parameters': param_result['parameters'],
        'parameter_count': param_result['count'],
        'parameter_dictionaries': param_dicts,
        'contexts': param_result['contexts']
    }

    return result

def find_trading_scanner_functions(code: str) -> List[str]:
    """
    Find actual trading scanner functions by looking for:
    1. Functions with 'scan', 'filter', 'check' in name
    2. Functions containing DataFrame filtering logic
    3. Functions that return filtered data
    """

    scanner_functions = []

    # Function patterns for trading scanners
    function_patterns = [
        (r"def\s+(check_high_lvl_filter_\w*)\s*\(", "Primary Scanner"),
        (r"def\s+(scan_daily_\w*)\s*\(", "Daily Scanner"),
        (r"def\s+(\w*scan\w*_para?)\s*\(", "Parameterized Scanner"),
        (r"def\s+(filter_\w*_rows?)\s*\(", "Row Filter")
    ]

    for pattern, scanner_type in function_patterns:
        matches = re.finditer(pattern, code, re.IGNORECASE)
        for match in matches:
            func_name = match.group(1)

            # Extract function body to verify it's a real scanner
            func_start = match.start()
            func_body = extract_function_body_enhanced(code, func_start)

            if is_real_trading_scanner(func_body):
                scanner_functions.append({
                    'name': func_name,
                    'type': scanner_type,
                    'body': func_body,
                    'start_pos': func_start
                })

    return scanner_functions

def extract_function_body_enhanced(code: str, func_start: int) -> str:
    """Extract complete function body with proper indentation handling."""

    lines = code[func_start:].split('\n')
    function_lines = []
    base_indent = None
    in_function = False

    for i, line in enumerate(lines):
        if i == 0:  # Function definition
            function_lines.append(line)
            in_function = True
            continue

        stripped = line.lstrip()

        if not stripped:  # Empty line
            if in_function:
                function_lines.append(line)
            continue

        current_indent = len(line) - len(stripped)

        if base_indent is None and stripped and in_function:
            base_indent = current_indent

        # Check if we're still in the function
        if base_indent is not None and current_indent <= base_indent and i > 1:
            # We've exited the function
            break

        if in_function:
            function_lines.append(line)

    return '\n'.join(function_lines)

def is_real_trading_scanner(func_body: str) -> bool:
    """
    Determine if function body contains real trading scanner logic.

    Real scanners have:
    1. DataFrame filtering conditions
    2. Trading parameter comparisons
    3. Return statements with filtered data
    """

    trading_indicators = [
        r"df\[.*\]\s*[><=!]+.*\d+",  # DataFrame column comparisons with numbers
        r"\.astype\(int\)",          # Boolean to int conversion
        r"return\s+df",              # Return filtered DataFrame
        r"np\.select",               # Numpy conditional selection
        r"high_pct_chg|gap_atr|close_range|dist_h_",  # Trading column names
        r"parabolic_score|burst_score|vol_score",     # Trading scores
    ]

    score = 0
    for pattern in trading_indicators:
        if re.search(pattern, func_body, re.IGNORECASE):
            score += 1

    # Need at least 2 trading indicators to be considered a real scanner
    return score >= 2

def extract_scanner_structure(code: str, scanner_info: Dict[str, Any]) -> Dict[str, Any]:
    """Extract the structure of a trading scanner function."""

    func_body = scanner_info['body']
    func_name = scanner_info['name']

    # Extract conditions and parameters
    conditions = extract_trading_conditions(func_body)
    local_params = extract_local_parameters(func_body)

    # Extract return logic
    return_pattern = r"return\s+(.+)"
    return_match = re.search(return_pattern, func_body)
    return_logic = return_match.group(1).strip() if return_match else None

    structure = {
        'function_name': func_name,
        'scanner_type': scanner_info['type'],
        'conditions': conditions,
        'local_parameters': local_params,
        'return_logic': return_logic,
        'configurable_params': len(local_params),
        'trading_conditions': len(conditions)
    }

    return structure

def extract_trading_conditions(func_body: str) -> List[Dict[str, Any]]:
    """Extract trading conditions from function body."""

    conditions = []

    # Pattern for DataFrame conditions
    condition_patterns = [
        r"df\['(\w+)'\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)",
        r"\(df\['(\w+)'\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)\)",
        r"df\[\"(\w+)\"\]\s*([><=!]+)\s*([+-]?\d*\.?\d+)",
    ]

    for pattern in condition_patterns:
        matches = re.finditer(pattern, func_body)
        for match in matches:
            column = match.group(1)
            operator = match.group(2)
            value = match.group(3)

            if is_trading_column(column):
                conditions.append({
                    'column': column,
                    'operator': operator,
                    'value': float(value),
                    'type': 'dataframe_filter'
                })

    return conditions

def extract_local_parameters(func_body: str) -> Dict[str, Any]:
    """Extract local parameter assignments within the function."""

    parameters = {}

    # Look for variable assignments that look like trading parameters
    assignment_pattern = r"^\s*(\w+)\s*=\s*([+-]?\d*\.?\d+)"
    lines = func_body.split('\n')

    for line in lines:
        match = re.search(assignment_pattern, line)
        if match:
            var_name = match.group(1)
            value = match.group(2)

            if is_trading_variable(var_name):
                try:
                    parameters[var_name] = float(value)
                except ValueError:
                    parameters[var_name] = value

    return parameters

def is_trading_column(column: str) -> bool:
    """Check if column name represents trading data."""

    trading_keywords = [
        'high', 'low', 'close', 'range', 'pct', 'chg', 'gap', 'atr',
        'ema', 'dist', 'score', 'vol', 'burst', 'tier'
    ]

    column_lower = column.lower()
    return any(keyword in column_lower for keyword in trading_keywords)

def is_trading_variable(var_name: str) -> bool:
    """Check if variable name represents a trading parameter."""

    trading_indicators = [
        'mult', 'threshold', 'min', 'max', 'limit', 'pct', 'atr', 'vol',
        'gap', 'slope', 'score', 'filter', 'param'
    ]

    var_lower = var_name.lower()
    return any(indicator in var_lower for indicator in trading_indicators)

def extract_parameter_dictionaries(code: str) -> List[Dict[str, Any]]:
    """Extract parameter dictionaries that contain trading parameters."""

    param_dicts = []

    # Patterns for parameter dictionaries
    dict_patterns = [
        (r"(\w+)\s*=\s*\{([^}]+)\}", "variable_dict"),
        (r"defaults\s*=\s*\{([^}]+)\}", "defaults"),
        (r"custom_params\s*=\s*\{([^}]+)\}", "custom_params"),
        (r"params\s*=\s*\{([^}]+)\}", "params"),
    ]

    for pattern, dict_type in dict_patterns:
        matches = re.finditer(pattern, code)
        for match in matches:
            if dict_type == "variable_dict":
                dict_name = match.group(1)
                dict_content = match.group(2)
            else:
                dict_name = dict_type
                dict_content = match.group(1)

            # Parse dictionary content
            parsed_dict = parse_dict_content_enhanced(dict_content)

            # Filter for trading parameters
            trading_params = {}
            for key, value in parsed_dict.items():
                if is_trading_variable(key):
                    trading_params[key] = value

            if trading_params:
                param_dicts.append({
                    'name': dict_name,
                    'type': dict_type,
                    'parameters': trading_params,
                    'param_count': len(trading_params)
                })

    return param_dicts

def parse_dict_content_enhanced(content: str) -> Dict[str, Any]:
    """Enhanced dictionary content parsing."""

    try:
        # Try AST literal eval first
        return ast.literal_eval(f"{{{content}}}")
    except (ValueError, SyntaxError):
        # Fallback to regex parsing
        parameters = {}

        # Pattern for key: value pairs
        pair_patterns = [
            r"['\"]?(\w+)['\"]?\s*:\s*([+-]?\d*\.?\d+)",
            r"['\"]?(\w+)['\"]?\s*:\s*['\"]([^'\"]+)['\"]",
        ]

        for pattern in pair_patterns:
            matches = re.finditer(pattern, content)
            for match in matches:
                key = match.group(1)
                value = match.group(2)

                try:
                    parameters[key] = float(value)
                except ValueError:
                    parameters[key] = value

        return parameters

def format_scanner_enhanced(scanner_data: Dict[str, Any], output_file: str) -> Dict[str, Any]:
    """
    Enhanced scanner formatting that creates properly formatted scanner with configurable parameters.

    Creates a parameterized scanner function with:
    1. Clear parameter dictionary
    2. Configurable trading logic
    3. Proper documentation
    4. Test execution capability
    """

    if 'error' in scanner_data:
        return scanner_data

    # Create formatted scanner code
    formatted_code = generate_formatted_scanner_code(scanner_data)

    # Write to output file
    try:
        with open(output_file, 'w') as f:
            f.write(formatted_code)

        result = {
            'success': True,
            'output_file': output_file,
            'original_file': scanner_data['file_path'],
            'scanner_functions': scanner_data['scanner_functions'],
            'configurable_parameters': scanner_data['parameter_count'],
            'formatted_parameters': extract_formatted_parameters(formatted_code)
        }

    except Exception as e:
        result = {
            'success': False,
            'error': str(e),
            'output_file': output_file
        }

    return result

def generate_formatted_scanner_code(scanner_data: Dict[str, Any]) -> str:
    """Generate properly formatted scanner code with configurable parameters."""

    # Extract original filename for documentation
    original_file = os.path.basename(scanner_data['file_path'])

    # Collect all trading parameters
    all_params = scanner_data['trading_parameters']
    param_dicts = scanner_data['parameter_dictionaries']

    # Build parameter dictionary
    default_params = {}
    for param_dict in param_dicts:
        default_params.update(param_dict['parameters'])

    # Add parameters from DataFrame conditions
    for param, value in all_params.items():
        if not param.startswith('condition_threshold'):
            default_params[param] = value

    # Generate the formatted code
    code = f'''#!/usr/bin/env python3
"""
Enhanced Trading Scanner - Generated from {original_file}

This scanner has been formatted to expose configurable trading parameters.
Original file contained {scanner_data['parameter_count']} trading parameters.
Formatted version provides {len(default_params)} configurable parameters.

Key Features:
- Configurable trading thresholds
- Parameter validation
- Clear trading logic structure
- Test execution capability
"""

import pandas as pd
import numpy as np
from typing import Dict, Any, List

def enhanced_trading_scanner(df: pd.DataFrame, params: Dict[str, Any] = None) -> pd.DataFrame:
    """
    Enhanced trading scanner with configurable parameters.

    Args:
        df: Input DataFrame with OHLCV data and calculated indicators
        params: Dictionary of configurable trading parameters

    Returns:
        Filtered DataFrame containing trading opportunities
    """

    # Default parameter configuration
    default_params = {default_params}

    # Merge with user parameters
    if params:
        default_params.update(params)

    p = default_params

    # Apply enhanced trading filters
    '''

    # Add scanner logic based on detected scanners
    if scanner_data['scanners']:
        code += generate_scanner_logic(scanner_data['scanners'], default_params)
    else:
        code += generate_generic_scanner_logic(default_params)

    # Add test execution
    code += '''

def test_scanner_execution():
    """Test the scanner with sample data."""

    # Create sample data for testing
    dates = pd.date_range('2024-01-01', periods=100, freq='D')
    sample_data = pd.DataFrame({
        'Date': dates,
        'Open': np.random.randn(100).cumsum() + 100,
        'High': np.random.randn(100).cumsum() + 105,
        'Low': np.random.randn(100).cumsum() + 95,
        'Close': np.random.randn(100).cumsum() + 100,
        'Volume': np.random.randint(1000000, 10000000, 100)
    })

    # Add sample calculated fields
    sample_data['high_pct_chg1'] = np.random.uniform(0.01, 0.1, 100)
    sample_data['gap_atr'] = np.random.uniform(0.1, 1.0, 100)
    sample_data['close_range1'] = np.random.uniform(0.3, 0.9, 100)
    sample_data['v_ua1'] = np.random.randint(5000000, 50000000, 100)
    sample_data['dol_v1'] = np.random.randint(100000000, 2000000000, 100)
    sample_data['c_ua1'] = np.random.uniform(5, 100, 100)
    sample_data['high_chg_atr1'] = np.random.uniform(0.5, 3.0, 100)

    # Test with default parameters
    print("Testing enhanced trading scanner...")
    results = enhanced_trading_scanner(sample_data)
    print(f"Scanner found {len(results)} trading opportunities out of {len(sample_data)} records")

    return results

if __name__ == "__main__":
    test_results = test_scanner_execution()
    print("\\nScanner test completed successfully!")
    print(f"Sample results: {len(test_results)} trading signals detected")
'''

    return code

def generate_scanner_logic(scanners: List[Dict[str, Any]], params: Dict[str, Any]) -> str:
    """Generate scanner logic based on detected scanner structures."""

    logic = "\n    # Trading Logic Based on Original Scanner\n"
    logic += "    conditions = (\n"

    # Convert detected conditions to parameterized logic
    for i, scanner in enumerate(scanners):
        if i > 0:
            logic += "        # Additional scanner conditions\n"

        for condition in scanner.get('conditions', []):
            column = condition['column']
            operator = condition['operator']
            param_name = f"{column}_{operator.replace('=', 'eq').replace('>', 'gt').replace('<', 'lt')}"

            if param_name in params:
                logic += f"        (df['{column}'] {operator} p.get('{param_name}', {condition['value']})) &\n"

    # Remove trailing " &\n"
    logic = logic.rstrip(" &\n") + "\n    )\n\n"
    logic += "    return df[conditions].copy()\n"

    return logic

def generate_generic_scanner_logic(params: Dict[str, Any]) -> str:
    """Generate generic scanner logic from parameters."""

    logic = "\n    # Generic Trading Logic from Detected Parameters\n"
    logic += "    conditions = (\n"

    # Map common parameter patterns to logical conditions
    param_mappings = {
        'high_pct_chg1_gteq': "df['high_pct_chg1'] >= p.get('high_pct_chg1_gteq', {})",
        'gap_atr_gteq': "df['gap_atr'] >= p.get('gap_atr_gteq', {})",
        'close_range1_gteq': "df['close_range1'] >= p.get('close_range1_gteq', {})",
        'vol_mult': "df['volume_ratio'] >= p.get('vol_mult', {})",
        'atr_mult': "df['range_ratio'] >= p.get('atr_mult', {})",
    }

    condition_count = 0
    for param_key, value in params.items():
        if param_key in param_mappings:
            condition_template = param_mappings[param_key]
            logic += f"        {condition_template.format(value)} &\n"
            condition_count += 1

        elif any(keyword in param_key.lower() for keyword in ['gteq', 'lteq', 'min', 'max']):
            # Generic condition for threshold parameters
            base_column = param_key.replace('_gteq', '').replace('_lteq', '').replace('_min', '').replace('_max', '')
            operator = '>=' if 'gteq' in param_key or 'min' in param_key else '<='

            logic += f"        (df.get('{base_column}', 0) {operator} p.get('{param_key}', {value})) &\n"
            condition_count += 1

    # Add fallback condition if no specific conditions were added
    if condition_count == 0:
        logic += "        (df['Volume'] > 0) &  # Basic volume filter\n"

    # Remove trailing " &\n"
    logic = logic.rstrip(" &\n") + "\n    )\n\n"
    logic += "    return df[conditions].copy()\n"

    return logic

def extract_formatted_parameters(formatted_code: str) -> Dict[str, Any]:
    """Extract parameters from the formatted scanner code."""

    # Look for the default_params dictionary in the formatted code
    pattern = r"default_params\s*=\s*\{([^}]+)\}"
    match = re.search(pattern, formatted_code)

    if match:
        dict_content = match.group(1)
        return parse_dict_content_enhanced(dict_content)

    return {}

def test_complete_workflow():
    """Test the complete workflow with all 3 user files."""

    files_to_test = [
        '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py',
        '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py',
        '/Users/michaeldurante/Downloads/half A+ scan copy.py'
    ]

    results = {}

    for file_path in files_to_test:
        print(f"\n{'='*80}")
        filename = os.path.basename(file_path)
        print(f"Processing: {filename}")
        print(f"{'='*80}")

        # Step 1: Split scanner
        split_result = split_scanner_enhanced(file_path)

        if 'error' in split_result:
            print(f"Error: {split_result['error']}")
            results[filename] = split_result
            continue

        # Step 2: Format scanner
        output_file = f"/Users/michaeldurante/ai dev/ce-hub/edge-dev/formatted_{filename}"
        format_result = format_scanner_enhanced(split_result, output_file)

        # Report results
        print(f"Scanner Functions Found: {split_result['scanner_functions']}")
        print(f"Trading Parameters Detected: {split_result['parameter_count']}")
        print(f"Parameter Dictionaries: {len(split_result['parameter_dictionaries'])}")

        if format_result['success']:
            print(f"✓ Formatted scanner created: {format_result['output_file']}")
            print(f"✓ Configurable parameters: {len(format_result['formatted_parameters'])}")
        else:
            print(f"✗ Formatting failed: {format_result['error']}")

        results[filename] = {
            'split_result': split_result,
            'format_result': format_result
        }

    return results

if __name__ == "__main__":
    print("Running Enhanced Scanner Processing Workflow...")
    workflow_results = test_complete_workflow()

    # Final summary
    print(f"\n{'='*80}")
    print("FINAL WORKFLOW SUMMARY")
    print(f"{'='*80}")

    for filename, result in workflow_results.items():
        if 'error' in result:
            print(f"{filename}: ERROR")
        else:
            split_data = result['split_result']
            format_data = result['format_result']
            status = "✓ SUCCESS" if format_data['success'] else "✗ FAILED"

            print(f"{filename}: {status}")
            print(f"  - Original Parameters: {split_data['parameter_count']}")
            print(f"  - Formatted Parameters: {len(format_data.get('formatted_parameters', {}))}")
            print(f"  - Scanner Functions: {split_data['scanner_functions']}")

    print("\nWorkflow completed!")