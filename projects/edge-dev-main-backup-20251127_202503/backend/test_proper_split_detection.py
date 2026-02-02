#!/usr/bin/env python3
"""
Test proper split scanner detection
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_proper_split_detection():
    """Test the pattern detection with properly split scanner"""
    print("🧪 Testing Proper Split Scanner Detection")
    print("="*50)

    # Load the properly split scanner
    with open('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_d2_manual_split_scanner.py', 'r') as f:
        split_code = f.read()

    # Apply our detection logic
    is_standalone_script = (
        'if __name__ == "__main__":' in split_code
    )

    is_real_lc_d2 = (
        'async def main(' in split_code and
        ('DATES' in split_code or 'START_DATE' in split_code) and
        not is_standalone_script and
        ('lc_frontside_d2_extended_1' in split_code or
         'lc_frontside_d3_extended_1' in split_code or
         'df["lc_frontside' in split_code or
         "df['lc_frontside" in split_code or
         'process_date(' in split_code)
    )

    print(f"📄 Properly Split Scanner Analysis:")
    print(f"  Lines: {len(split_code.split('\n'))}")
    print(f"  Has '__main__': {'if __name__ == \"__main__\":' in split_code}")
    print(f"  Has async main: {'async def main(' in split_code}")
    print(f"  Has DATES: {'DATES' in split_code}")
    print(f"  Has START_DATE: {'START_DATE' in split_code}")
    print(f"  Has lc_frontside_d3_extended_1: {'lc_frontside_d3_extended_1' in split_code}")
    print(f"  ✅ Detected as standalone: {is_standalone_script}")
    print(f"  ✅ Detected as LC D2 pattern: {is_real_lc_d2}")
    print()

    # Determine pattern and routing
    if is_standalone_script:
        pattern = "standalone_script"
        execution_method = "execute_generic_pattern_simple()"
    elif is_real_lc_d2:
        pattern = "async_main_DATES"
        execution_method = "execute_lc_d2_pattern_simple()"
    else:
        pattern = "unknown"
        execution_method = "fallback"

    print(f"🎯 Pattern: {pattern}")
    print(f"🚀 Execution Method: {execution_method}")

    if is_real_lc_d2:
        print("✅ SUCCESS: Properly split scanner will use LC D2 execution!")
        print("🔧 This should work without syntax errors!")
    else:
        print("⚠️  WARNING: May not route to optimal execution method")

    return pattern, execution_method

if __name__ == "__main__":
    pattern, method = test_proper_split_detection()
    print("\n" + "="*50)
    print(f"🎯 RESULT: Properly split scanner detected as '{pattern}'")
    print(f"🚀 EXECUTION: Will use {method}")

    if pattern == "async_main_DATES":
        print("✅ PERFECT! This is the correct split methodology!")
    else:
        print("🔧 Split methodology needs adjustment")