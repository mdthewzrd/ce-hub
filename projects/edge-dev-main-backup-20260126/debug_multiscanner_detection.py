#!/usr/bin/env python3
"""
Debug Multi-Scanner Detection Logic
==================================

This script debugs why the frontend multi-scanner detection is not working
"""

import re

def debug_multiscanner_detection():
    """Debug the multi-scanner detection logic"""

    print("🔍 DEBUGGING MULTI-SCANNER DETECTION")
    print("=" * 70)

    # Load the original multi-scanner file
    original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"

    try:
        with open(original_file_path, 'r') as f:
            code = f.read()

        print(f"📄 File size: {len(code):,} characters")
        print(f"📄 Lines: {len(code.split('\n')):,}")

        # Test each detection criterion
        print("\n🔍 Testing detection criteria:")
        print("-" * 50)

        # LC scanner patterns
        lc_patterns = [
            'lc_frontside_d3_extended_1',
            'lc_frontside_d2_extended',
            'lc_frontside_d2_extended_1',
        ]

        for pattern in lc_patterns:
            found = pattern in code
            print(f"   {'✅' if found else '❌'} LC pattern '{pattern}': {found}")

        # Pattern indicators
        momentum_patterns = [
            'momentum_d3_extended_pattern',
            'momentum_d2_extended_pattern',
            'momentum_d2_variant_pattern',
        ]

        for pattern in momentum_patterns:
            found = pattern in code
            print(f"   {'✅' if found else '❌'} Momentum pattern '{pattern}': {found}")

        # Function patterns
        print("\n🔍 Function patterns:")
        print("-" * 30)

        # Scanner function pattern
        scanner_function_pattern = r'(async\s+)?def\s+\w*(scan|scanner)\w*\s*\('
        scanner_functions = re.findall(scanner_function_pattern, code, re.IGNORECASE)
        print(f"   📋 Scanner functions found: {len(scanner_functions)}")
        for i, match in enumerate(scanner_functions[:10], 1):  # Show first 10
            print(f"      {i}. {match}")

        # Main execution blocks
        main_blocks = code.count('if __name__ == "__main__":')
        print(f"   📋 Main execution blocks: {main_blocks}")

        # Async def patterns
        async_scanner_pattern = r'async\s+def\s+\w+.*scanner.*:'
        async_matches = re.findall(async_scanner_pattern, code, re.IGNORECASE)
        print(f"   📋 Async scanner functions: {len(async_matches)}")

        # Regular def patterns
        def_scanner_pattern = r'def\s+\w+.*scan.*:'
        def_matches = re.findall(def_scanner_pattern, code, re.IGNORECASE)
        print(f"   📋 Regular scan functions: {len(def_matches)}")

        # Calculate indicator count (same logic as frontend)
        indicator_count = 0

        # String indicators
        string_indicators = [
            'lc_frontside_d3_extended_1',
            'lc_frontside_d2_extended',
            'lc_frontside_d2_extended_1',
            'momentum_d3_extended_pattern',
            'momentum_d2_extended_pattern',
            'momentum_d2_variant_pattern',
            'if __name__ == "__main__":',
        ]

        for indicator in string_indicators:
            if indicator in code:
                indicator_count += 1
                print(f"   ✅ Found indicator: {indicator}")

        # File size indicator
        if len(code) > 50000:
            indicator_count += 1
            print(f"   ✅ File size indicator: {len(code):,} > 50,000")

        # Regex indicators
        regex_indicators = [
            (r'async\s+def\s+\w+.*scanner.*:', 'async scanner functions'),
            (r'def\s+\w+.*scan.*:', 'scan functions'),
        ]

        for pattern, description in regex_indicators:
            matches = re.findall(pattern, code, re.IGNORECASE)
            if matches:
                indicator_count += 1
                print(f"   ✅ Found regex indicator: {description} ({len(matches)} matches)")

        # Special case: multiple scanner function definitions
        scanner_function_pattern = r'(async\s+)?def\s+\w*(scan|scanner)\w*\s*\('
        scanner_functions = re.findall(scanner_function_pattern, code, re.IGNORECASE)
        if len(scanner_functions) > 3:
            indicator_count += 2
            print(f"   ✅ Multiple scanner functions: {len(scanner_functions)} > 3 (+2 indicators)")

        print(f"\n📊 TOTAL INDICATOR COUNT: {indicator_count}")
        print(f"📊 File size: {len(code):,}")
        print(f"📊 Size threshold (100,000): {len(code) > 100000}")

        # Final detection result
        is_multi_scanner = indicator_count >= 2 or len(code) > 100000
        print(f"\n🎯 MULTI-SCANNER DETECTION RESULT: {'✅ DETECTED' if is_multi_scanner else '❌ NOT DETECTED'}")

        if not is_multi_scanner:
            print("\n🔧 Why not detected:")
            if indicator_count < 2:
                print(f"   - Indicator count ({indicator_count}) < 2")
            if len(code) <= 100000:
                print(f"   - File size ({len(code):,}) <= 100,000")

        # Sample content analysis
        print("\n📋 Sample content analysis:")
        print("-" * 40)
        lines = code.split('\n')
        for i, line in enumerate(lines[:50], 1):  # First 50 lines
            line = line.strip()
            if line and any(keyword in line.lower() for keyword in ['def ', 'async def', 'scan', 'main']):
                print(f"   Line {i}: {line[:80]}...")

    except Exception as e:
        print(f"❌ Debug failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    debug_multiscanner_detection()