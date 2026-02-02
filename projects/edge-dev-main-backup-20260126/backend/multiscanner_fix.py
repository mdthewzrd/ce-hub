#!/usr/bin/env python3
"""
Multi-Scanner Pattern Detection & Execution Fix

This is a standalone module that provides multi-scanner detection and
execution support without modifying existing code.

Usage:
    from multiscanner_fix import detect_and_execute_multiscanner

    # Instead of calling execute_uploaded_scanner_direct directly
    results = await detect_and_execute_multiscanner(code, start_date, end_date, progress_callback)
"""

import re
import ast
from typing import List, Dict, Any, Optional, Tuple


def fix_pattern_assignments_for_eval(code: str) -> str:
    """
    Fix pattern_assignments to be compatible with df.eval()

    The bug: Pattern logic may have inconsistent column references.
    The fix: Remove ALL df[' prefixes for df.eval() compatibility.

    Args:
        code: Scanner code with potentially broken pattern_assignments

    Returns:
        Fixed code with pattern_assignments compatible with df.eval()
    """

    # Find the pattern_assignments section
    pattern_match = re.search(
        r'self\.pattern_assignments = \[(.*?)\]',
        code,
        re.DOTALL
    )

    if not pattern_match:
        return code  # No pattern_assignments found

    patterns_str = pattern_match.group(1)

    # Fix by removing ALL df[' prefixes and closing brackets
    # This is the correct format for df.eval()
    def fix_logic(match):
        logic = match.group(1)

        # Remove all df['...' and make them bare column names
        fixed_logic = re.sub(r"df\['([^']+)'\]", r'\1', logic)

        return fixed_logic

    # Apply the fix to each pattern's logic
    fixed_patterns = re.sub(
        r'"logic":\s*"([^"]*(?:h>|l>|c_>|o_>|v_>|high_|low_|close_|open_|gap_|high_pct_|pct_chg|dist_|ema_|highest_|lowest_|c_ua|l_ua|v_ua|dol_|range|rvol|atr|true_|close_|d1_|high_chg)[^"]*)"',
        lambda m: '"logic": "' + fix_logic(m) + '"',
        patterns_str,
        flags=re.DOTALL
    )

    # Replace the old pattern_assignments with the fixed version
    fixed_code = code[:pattern_match.start()] + 'self.pattern_assignments = [' + fixed_patterns + ']' + code[pattern_match.end():]

    print("✅ Fixed pattern_assignments for df.eval() compatibility")

    return fixed_code


def detect_pattern_assignments(code: str) -> Tuple[bool, List[Dict[str, Any]]]:
    """
    Detect and extract pattern_assignments from multi-scanner code

    Args:
        code: Scanner code to analyze

    Returns:
        Tuple of (is_multi_scanner, patterns_list)
    """
    patterns = []

    # Method 1: Look for pattern_assignments variable
    if 'pattern_assignments' in code:
        # Find the pattern_assignments assignment
        assign_match = re.search(r'pattern_assignments\s*=\s*\[(.*?)\]', code, re.DOTALL)

        if assign_match:
            patterns_str = assign_match.group(1)

            # Extract individual patterns - look for {'name': ..., 'logic': ...} or {"name": ..., "logic": ...}
            # Try single quotes first
            pattern_matches = re.findall(
                r"['\"]name['\"]\s*:\s*['\"]([^'\"]+)['\"]\s*,[^}]*['\"](?:logic|condition|detection)['\"]\s*:\s*['\"]([^'\"]+)['\"]",
                patterns_str
            )

            for name, logic in pattern_matches:
                patterns.append({
                    'name': name,
                    'logic': logic
                })

    # Method 2: Look for multiple detect methods
    detect_methods = re.findall(r'def\s+(detect|check)_(\w+)\s*\(', code)
    if len(detect_methods) > 1:
        for prefix, pattern_name in detect_methods:
            # Check if pattern not already in list
            if not any(p['name'] == f"{prefix}_{pattern_name}" for p in patterns):
                patterns.append({
                    'name': f"{prefix}_{pattern_name}",
                    'logic': f"detected_by_{prefix}_{pattern_name}"
                })

    # Method 3: Check for multi-pattern indicators
    multi_pattern_keywords = [
        r'multi.*pattern.*scanner',
        r'multi-pattern scanner',
        r'patterns?:\s*\d+',
        r'\d+\s+patterns?',
        r'Multi-Pattern Scanner'
    ]

    has_multi_indicator = any(
        re.search(keyword, code, re.IGNORECASE)
        for keyword in multi_pattern_keywords
    )

    is_multi = len(patterns) > 1 or (has_multi_indicator and len(patterns) >= 1)

    return is_multi, patterns


def execute_multi_scanner(code: str, start_date: str, end_date: str,
                          progress_callback=None, pure_execution_mode: bool = True):
    """
    Execute multi-scanner code with proper pattern handling

    This function wraps the execution to ensure pattern_assignments
    are properly handled during execution.

    Args:
        code: Multi-scanner code
        start_date: Start date for scan
        end_date: End date for scan
        progress_callback: Optional progress callback
        pure_execution_mode: Pure execution mode flag

    Returns:
        List of scan results
    """
    import tempfile
    import os
    import importlib.util

    # Detect patterns
    is_multi, patterns = detect_pattern_assignments(code)

    if not is_multi:
        # Not a multi-scanner, use standard execution
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct
        return execute_uploaded_scanner_direct(code, start_date, end_date, progress_callback, pure_execution_mode)

    print(f"🎯 Multi-Scanner detected with {len(patterns)} patterns")
    for i, pattern in enumerate(patterns, 1):
        print(f"   {i}. {pattern['name']}")

    # Apply pattern_assignments fix for df.eval() compatibility
    modified_code = fix_pattern_assignments_for_eval(code)

    # Check if pattern_assignments is already a class attribute
    if 'self.pattern_assignments = [' not in modified_code:
        # Try to inject pattern_assignments into __init__
        init_match = re.search(r'(def __init__\s*\([^)]*\)\s*:\s*\n)', modified_code)
        if init_match:
            # Create pattern_assignments initialization
            patterns_init = f'\n        # Multi-scanner pattern assignments\n        self.pattern_assignments = {patterns}\n'

            # Insert after __init__
            insert_pos = init_match.end()
            modified_code = modified_code[:insert_pos] + patterns_init + modified_code[insert_pos:]
            print("✅ Injected pattern_assignments into __init__")

    # Write to temp file and execute
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(modified_code)
        temp_path = f.name

    try:
        # Import the module
        spec = importlib.util.spec_from_file_location("temp_scanner", temp_path)
        module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(module)

        # Find the scanner class
        scanner_class = None
        for item_name in dir(module):
            item = getattr(module, item_name)
            if isinstance(item, type) and hasattr(item, 'run_scan'):
                scanner_class = item
                break

        if not scanner_class:
            raise ValueError("No scanner class found with run_scan method")

        # Initialize scanner
        scanner = scanner_class()

        # Set dates if they have d0_start and d0_end attributes
        if hasattr(scanner, 'd0_start'):
            scanner.d0_start = start_date
        if hasattr(scanner, 'd0_end'):
            scanner.d0_end = end_date

        # Run the scan
        if progress_callback:
            if asyncio.iscoroutinefunction(progress_callback):
                # This is async but we're in sync context - skip for now
                pass
            else:
                progress_callback(f"🎯 Running multi-scanner with {len(patterns)} patterns...", 50)

        results_df = scanner.run_scan(start_date=start_date, end_date=end_date)

        # Convert results to expected format
        results = []
        if not results_df.empty:
            for idx, row in results_df.iterrows():
                result_dict = row.to_dict()

                # Normalize field names
                if 'ticker' in result_dict:
                    result_dict['symbol'] = result_dict['ticker']
                elif 'symbol' not in result_dict:
                    result_dict['symbol'] = result_dict.get('Ticker', 'Unknown')

                # Add pattern labels if available
                if 'Scanner_Label' in result_dict:
                    result_dict['patterns'] = result_dict['Scanner_Label'].split(', ')
                else:
                    result_dict['patterns'] = [p['name'] for p in patterns]

                results.append(result_dict)

        return results

    except Exception as e:
        print(f"❌ Multi-scanner execution error: {e}")
        import traceback
        traceback.print_exc()

        # Fallback to standard execution
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct
        return execute_uploaded_scanner_direct(code, start_date, end_date, progress_callback, pure_execution_mode)

    finally:
        # Clean up temp file
        try:
            os.unlink(temp_path)
        except:
            pass


async def detect_and_execute_multiscanner(code: str, start_date: str, end_date: str,
                                         progress_callback=None, pure_execution_mode: bool = True):
    """
    Async wrapper for multi-scanner detection and execution

    This function can be used as a drop-in replacement for execute_uploaded_scanner_direct

    Args:
        code: Scanner code (may be multi-scanner or single)
        start_date: Start date for scan
        end_date: End date for scan
        progress_callback: Optional progress callback
        pure_execution_mode: Pure execution mode flag

    Returns:
        List of scan results
    """
    # Check if this is a multi-scanner
    is_multi, patterns = detect_pattern_assignments(code)

    if is_multi:
        print(f"🎯 Multi-Scanner detected - using specialized execution")
        return execute_multi_scanner(code, start_date, end_date, progress_callback, pure_execution_mode)
    else:
        # Use standard execution
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct
        return await execute_uploaded_scanner_direct(code, start_date, end_date, progress_callback, pure_execution_mode)


# Export functions
__all__ = [
    'fix_pattern_assignments_for_eval',
    'detect_pattern_assignments',
    'execute_multi_scanner',
    'detect_and_execute_multiscanner'
]


if __name__ == "__main__":
    # Test the detection
    test_code = '''
class TestMultiScanner:
    def __init__(self):
        self.pattern_assignments = [
            {"name": "pattern1", "logic": "gap > 0.01"},
            {"name": "pattern2", "logic": "gap < -0.01"}
        ]

    def run_scan(self, start_date, end_date):
        import pandas as pd
        return pd.DataFrame({
            'ticker': ['AAPL', 'MSFT'],
            'Scanner_Label': ['pattern1', 'pattern2']
        })
'''

    print("Testing multi-scanner detection...")
    is_multi, patterns = detect_pattern_assignments(test_code)

    print(f"Multi-scanner: {is_multi}")
    print(f"Patterns: {len(patterns)}")
    for pattern in patterns:
        print(f"  - {pattern['name']}: {pattern['logic']}")
