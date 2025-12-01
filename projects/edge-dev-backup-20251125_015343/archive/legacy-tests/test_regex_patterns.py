#!/usr/bin/env python3
"""
Test regex patterns on actual LC D2 scanner file
"""

import re

def test_parameter_patterns():
    """Test the exact regex patterns from parameter_integrity_system.py"""

    # Load the LC D2 scanner file
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded file: {len(code)} characters")

        # Test Pattern 6: API constants (exact pattern from backend)
        print(f"\n🔍 Testing Pattern 6: API constants")
        api_pattern = r'(API_KEY|BASE_URL|DATE)\s*=\s*["\']([^"\']+)["\']'
        api_constants = re.findall(api_pattern, code)
        print(f"API constants found: {api_constants}")

        # Test Pattern 5: Direct parameter assignments
        print(f"\n🔍 Testing Pattern 5: Parameter assignments")
        param_pattern = r'(\w+)\s*=\s*([\d._]+)'
        param_assignments = re.findall(param_pattern, code)
        print(f"Parameter assignments found (first 10): {param_assignments[:10]}")

        # Debug: Show actual lines with API constants
        print(f"\n🔍 Lines containing API constants:")
        lines = code.split('\n')
        for i, line in enumerate(lines, 1):
            if any(const in line for const in ['API_KEY', 'BASE_URL', 'DATE']) and '=' in line:
                print(f"   Line {i}: {line.strip()}")

        # Test rolling window pattern (what's actually being found)
        print(f"\n🔍 Testing rolling window pattern:")
        rolling_pattern = r'\.rolling\(window=(\d+)\)'
        rolling_windows = re.findall(rolling_pattern, code)
        print(f"Rolling windows found: {rolling_windows}")

        return len(api_constants) > 0, len(param_assignments) > 0

    except Exception as e:
        print(f"❌ Error: {e}")
        return False, False

if __name__ == "__main__":
    test_parameter_patterns()