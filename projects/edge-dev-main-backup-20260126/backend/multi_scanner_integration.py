#!/usr/bin/env python3
"""
Multi-Scanner Execution Integration Patch

This patch integrates the multi-scanner pattern extraction into the
execution pipeline, ensuring that multi-scanners with pattern_assignments
are properly detected and executed.

Apply this patch to the uploaded_scanner_bypass.py file or import it
directly into the execution flow.
"""

import sys
import os
from typing import List, Dict, Any, Optional, Tuple

# Import the pattern extractor
try:
    from multi_scanner_fix import MultiScannerPatternExtractor, create_multi_scanner_wrapper
    print("✅ Multi-scanner fix module loaded")
except ImportError as e:
    print(f"⚠️  Multi-scanner fix module not available: {e}")
    MultiScannerPatternExtractor = None
    create_multi_scanner_wrapper = None


def is_multi_scanner(code: str) -> bool:
    """
    Detect if code is a multi-scanner

    Args:
        code: Scanner code to check

    Returns:
        True if code appears to be a multi-scanner
    """
    if not MultiScannerPatternExtractor:
        # Fallback detection
        indicators = [
            'pattern_assignments' in code,
            'multi.*pattern' in code.lower(),
            code.count('def detect_') > 1,
            code.count('def check_') > 1,
            'Multi-Pattern' in code or 'Multi-Pattern Scanner' in code
        ]
        return sum(indicators) >= 2

    # Use proper extractor
    extractor = MultiScannerPatternExtractor(code)
    patterns, _ = extractor.extract_pattern_assignments()
    return len(patterns) > 1


def prepare_multi_scanner_for_execution(code: str) -> Tuple[str, Optional[str]]:
    """
    Prepare multi-scanner code for execution

    Args:
        code: Original multi-scanner code

    Returns:
        Tuple of (prepared_code, error_message if any)
    """
    if not MultiScannerPatternExtractor:
        return code, "Multi-scanner fix module not available"

    try:
        # Extract patterns
        extractor = MultiScannerPatternExtractor(code)
        patterns, error = extractor.extract_pattern_assignments()

        if error or not patterns:
            return code, f"Pattern extraction failed: {error}"

        print(f"🎯 Multi-Scanner detected with {len(patterns)} patterns")

        # Check if code already has proper pattern execution
        if 'def detect_patterns' in code and 'pattern_assignments' in code:
            # Code might already be properly structured
            # Just ensure pattern_assignments is properly accessible
            if 'self.pattern_assignments' in code:
                print("✅ Code already has proper pattern execution structure")
                return code, None
            else:
                # Need to add pattern_assignments to __init__
                print("⚠️  Adding pattern_assignments to __init__")
                return _inject_pattern_assignments_init(code, patterns), None

        # Create wrapper for execution
        prepared_code = create_multi_scanner_wrapper(code, patterns)
        return prepared_code, None

    except Exception as e:
        return code, f"Error preparing multi-scanner: {str(e)}"


def _inject_pattern_assignments_init(code: str, patterns: List[Dict[str, Any]]) -> str:
    """
    Inject pattern_assignments into __init__ method if missing

    Args:
        code: Original code
        patterns: Pattern assignments to inject

    Returns:
        Modified code with pattern_assignments in __init__
    """
    # Find __init__ method
    init_match = __import__('re').search(r'def __init__\s*\([^)]*\)\s*:\s*\n', code)

    if not init_match:
        return code  # Can't find __init__, return original

    init_end = init_match.end()

    # Create pattern_assignments initialization
    patterns_str = str(patterns)
    injection = f'\n        # Pattern assignments for multi-scanner\n        self.pattern_assignments = {patterns_str}\n'

    # Insert after __init__ declaration
    modified_code = code[:init_end] + injection + code[init_end:]

    return modified_code


def enhance_execute_uploaded_scanner_direct(original_function):
    """
    Decorator to enhance execute_uploaded_scanner_direct with multi-scanner support

    Args:
        original_function: Original execute_uploaded_scanner_direct function

    Returns:
        Enhanced function that handles multi-scanners
    """
    def enhanced_function(code: str, *args, **kwargs):
        # Check if this is a multi-scanner
        if is_multi_scanner(code):
            print("🎯 Multi-Scanner detected - applying pattern extraction...")

            # Prepare code for execution
            prepared_code, error = prepare_multi_scanner_for_execution(code)

            if error:
                print(f"⚠️  Multi-scanner preparation warning: {error}")
                print("   Attempting execution with original code...")
                prepared_code = code

            # Execute with prepared code
            return original_function(prepared_code, *args, **kwargs)

        # Single scanner - use original flow
        return original_function(code, *args, **kwargs)

    return enhanced_function


# Export main functions
__all__ = [
    'is_multi_scanner',
    'prepare_multi_scanner_for_execution',
    'enhance_execute_uploaded_scanner_direct',
    'MultiScannerPatternExtractor',
    'create_multi_scanner_wrapper'
]


if __name__ == "__main__":
    # Test the integration
    test_code = '''
class TestMultiScanner:
    """Multi-Pattern Scanner with 2 patterns"""

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

    def detect_patterns(self, data):
        results = []
        for pattern in self.pattern_assignments:
            mask = data.eval(pattern['logic'])
            if mask.any():
                results.extend(data[mask].to_dict('records'))
        return results
'''

    print("Testing multi-scanner integration...")

    # Test detection
    if is_multi_scanner(test_code):
        print("✅ Multi-scanner detection working")
    else:
        print("❌ Multi-scanner detection failed")

    # Test preparation
    prepared_code, error = prepare_multi_scanner_for_execution(test_code)

    if error:
        print(f"⚠️  Preparation warning: {error}")
    else:
        print("✅ Multi-scanner preparation successful")
