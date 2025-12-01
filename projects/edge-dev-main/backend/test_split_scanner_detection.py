#!/usr/bin/env python3
"""
Test split scanner detection to see what's really happening
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_split_scanner_detection():
    """Test the pattern detection with your actual split scanner"""
    print("🧪 Testing Your Split Scanner Detection")
    print("="*50)

    # Load your split scanner
    with open('/Users/michaeldurante/Downloads/lc_frontside_d3_extended_1_scanner.py', 'r') as f:
        split_code = f.read()

    # Apply our current detection logic (after removing threshold)
    is_standalone_script = (
        'if __name__ == "__main__":' in split_code
    )

    is_real_lc_d2 = (
        'async def main(' in split_code and
        ('DATES' in split_code or 'START_DATE' in split_code) and
        not is_standalone_script and  # Should exclude standalone scripts
        ('lc_frontside_d2_extended_1' in split_code or
         'lc_frontside_d3_extended_1' in split_code or
         'df["lc_frontside' in split_code or
         "df['lc_frontside" in split_code or
         'process_date(' in split_code)
    )

    print(f"📄 Split Scanner Analysis:")
    print(f"  Lines: {len(split_code.split('\n'))}")
    print(f"  Has '__main__': {'if __name__ == \"__main__\":' in split_code}")
    print(f"  Has async main: {'async def main(' in split_code}")
    print(f"  Has DATES: {'DATES' in split_code}")
    print(f"  Has START_DATE: {'START_DATE' in split_code}")
    print(f"  Has lc_frontside_d2_extended_1: {'lc_frontside_d2_extended_1' in split_code}")
    print(f"  Has lc_frontside_d3_extended_1: {'lc_frontside_d3_extended_1' in split_code}")
    print()

    # Determine pattern
    if is_standalone_script:
        pattern = "standalone_script"
        execution_method = "execute_generic_pattern_simple()"
        print(f"🎯 Pattern: {pattern}")
        print(f"🚀 Execution Method: {execution_method}")
    elif is_real_lc_d2:
        pattern = "async_main_DATES"
        execution_method = "execute_lc_d2_pattern_simple()"
        print(f"🎯 Pattern: {pattern}")
        print(f"🚀 Execution Method: {execution_method}")
    else:
        pattern = "unknown"
        execution_method = "fallback"
        print(f"🎯 Pattern: {pattern}")
        print(f"🚀 Execution Method: {execution_method}")

    print()

    # Check for specific patterns that might cause issues
    print("🔍 DETAILED PATTERN ANALYSIS:")
    has_async_main = 'async def main(' in split_code
    has_dates_or_start = ('DATES' in split_code or 'START_DATE' in split_code)
    has_lc_patterns = any([
        'lc_frontside_d2_extended_1' in split_code,
        'lc_frontside_d3_extended_1' in split_code,
        'df["lc_frontside' in split_code,
        "df['lc_frontside" in split_code,
        'process_date(' in split_code
    ])

    print(f"  async def main: {has_async_main}")
    print(f"  DATES/START_DATE: {has_dates_or_start}")
    print(f"  LC patterns: {has_lc_patterns}")
    print(f"  Standalone script: {is_standalone_script}")
    print(f"  Would be LC D2 if not standalone: {has_async_main and has_dates_or_start and has_lc_patterns}")

    return pattern, execution_method

if __name__ == "__main__":
    pattern, method = test_split_scanner_detection()
    print("\n" + "="*50)
    print(f"🎯 RESULT: Your split scanner will be detected as '{pattern}'")
    print(f"🚀 EXECUTION: Will use {method}")
    print("✅ This should work with our standalone script fix!")