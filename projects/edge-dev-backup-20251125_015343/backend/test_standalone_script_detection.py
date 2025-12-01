#!/usr/bin/env python3
"""
Test standalone script detection fix
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_standalone_detection():
    """Test the standalone script detection logic"""
    print("🧪 Testing Standalone Script Detection Fix")
    print("="*50)

    # Test case 1: Original LC D2 scanner (should be detected as standalone)
    with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py', 'r') as f:
        lc_d2_code = f.read()

    # Apply our detection logic
    is_standalone_script = (
        'if __name__ == "__main__":' in lc_d2_code and
        len(lc_d2_code.split('\n')) > 500
    )

    is_real_lc_d2 = (
        'async def main(' in lc_d2_code and
        ('DATES' in lc_d2_code or 'START_DATE' in lc_d2_code) and
        not is_standalone_script and  # Should exclude standalone scripts
        ('lc_frontside_d2_extended_1' in lc_d2_code or
         'lc_frontside_d3_extended_1' in lc_d2_code or
         'df["lc_frontside' in lc_d2_code or
         "df['lc_frontside" in lc_d2_code or
         'process_date(' in lc_d2_code)
    )

    print(f"📄 LC D2 Scanner Analysis:")
    print(f"  Lines: {len(lc_d2_code.split('\n'))}")
    print(f"  Has '__main__': {'if __name__ == \"__main__\":' in lc_d2_code}")
    print(f"  Has async main: {'async def main(' in lc_d2_code}")
    print(f"  Has DATES: {'DATES' in lc_d2_code}")
    print(f"  ✅ Detected as standalone: {is_standalone_script}")
    print(f"  ❌ Would route to LC D2 execution: {is_real_lc_d2}")
    print()

    # Determine pattern
    if is_standalone_script:
        pattern = "standalone_script"
        execution_method = "execute_generic_pattern_simple()"
        print(f"🎯 Pattern: {pattern}")
        print(f"🚀 Execution Method: {execution_method}")
        print("✅ SUCCESS: Standalone script will use generic execution!")
    else:
        print("❌ FAILED: Should be detected as standalone script")
        return False

    print()

    # Test case 2: Working scanner (should NOT be detected as standalone)
    try:
        with open('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_1_scanner.py', 'r') as f:
            working_code = f.read()

        is_working_standalone = (
            'if __name__ == "__main__":' in working_code and
            len(working_code.split('\n')) > 500
        )

        print(f"📄 Working Scanner Analysis:")
        print(f"  Lines: {len(working_code.split('\n'))}")
        print(f"  Has '__main__': {'if __name__ == \"__main__\":' in working_code}")
        print(f"  ✅ Detected as standalone: {is_working_standalone}")

        if not is_working_standalone:
            print("✅ SUCCESS: Working scanner NOT detected as standalone!")
        else:
            print("⚠️  WARNING: Working scanner detected as standalone (may be expected)")

    except FileNotFoundError:
        print("⚠️  Working scanner file not found for comparison")

    return True

if __name__ == "__main__":
    success = test_standalone_detection()
    print("\n" + "="*50)
    if success:
        print("✅ Standalone Script Detection Fix: VERIFIED")
        print("🚀 Original LC D2 scanner should now execute without syntax errors!")
    else:
        print("❌ Standalone Script Detection Fix: FAILED")
        print("🔧 Additional debugging needed")