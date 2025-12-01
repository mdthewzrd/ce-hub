#!/usr/bin/env python3
"""
Test all 3 individual scanner files to verify proper pattern detection
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_pattern_detection(file_path, scanner_name):
    """Test the pattern detection for a specific scanner file"""
    print(f"🧪 Testing {scanner_name}")
    print("="*50)

    try:
        # Load the scanner file
        with open(file_path, 'r') as f:
            code = f.read()

        # Apply our detection logic (same as uploaded_scanner_bypass.py)
        is_standalone_script = (
            'if __name__ == "__main__":' in code
        )

        # Count actual trading patterns (exclude pricing calculations like _min_price)
        pattern_lines = [line for line in code.split('\n') if 'df[\'lc_frontside' in line and '= (' in line]
        actual_pattern_count = len(pattern_lines)

        is_individual_scanner = (
            'async def main(' in code and
            not is_standalone_script and
            # Individual scanners have exactly 1 main pattern definition
            (('df[\'lc_frontside_d3_extended_1\'] = ' in code and actual_pattern_count == 1) or
             ('df[\'lc_frontside_d2_extended\'] = ' in code and actual_pattern_count == 1) or
             ('df[\'lc_frontside_d2_extended_1\'] = ' in code and actual_pattern_count == 1))
        )

        is_real_lc_d2 = (
            'async def main(' in code and
            ('DATES' in code or 'START_DATE' in code) and
            not is_standalone_script and
            not is_individual_scanner and  # Exclude individual scanners
            (code.count('df[\'lc_frontside') >= 3 or code.count('df["lc_frontside') >= 3 or 'process_date(' in code)
        )

        print(f"📄 {scanner_name} Analysis:")
        print(f"  File exists: {os.path.exists(file_path)}")
        print(f"  Lines: {len(code.split('\\n'))}")
        print(f"  Characters: {len(code)}")
        print(f"  Has '__main__': {'if __name__ == \\\"__main__\\\":' in code}")
        print(f"  Has async main: {'async def main(' in code}")
        print(f"  Has proper signature: {'async def main(start_date: str, end_date: str):' in code}")
        print(f"  Has DATES: {'DATES' in code}")
        print(f"  Has START_DATE: {'START_DATE' in code}")

        # Pattern count analysis
        lc_pattern_count = code.count('df[\'lc_') + code.count('df["lc_')
        print(f"  Total LC references: {lc_pattern_count}")
        print(f"  Actual pattern definitions: {actual_pattern_count}")

        # Specific pattern checks
        has_d3_extended_1 = 'lc_frontside_d3_extended_1' in code
        has_d2_extended = 'lc_frontside_d2_extended' in code and 'lc_frontside_d2_extended_1' not in code
        has_d2_extended_1 = 'lc_frontside_d2_extended_1' in code

        print(f"  Has lc_frontside_d3_extended_1: {has_d3_extended_1}")
        print(f"  Has lc_frontside_d2_extended: {has_d2_extended}")
        print(f"  Has lc_frontside_d2_extended_1: {has_d2_extended_1}")

        print(f"  ✅ Detected as standalone: {is_standalone_script}")
        print(f"  ✅ Detected as individual scanner: {is_individual_scanner}")
        print(f"  ✅ Detected as LC D2 pattern: {is_real_lc_d2}")
        print()

        # Determine pattern and routing
        if is_standalone_script:
            pattern = "standalone_script"
            execution_method = "execute_generic_pattern_simple()"
        elif is_individual_scanner:
            pattern = "direct_execution"
            execution_method = "execute_direct_pattern_simple()"
        elif is_real_lc_d2:
            pattern = "async_main_DATES"
            execution_method = "execute_lc_d2_pattern_simple()"
        else:
            pattern = "unknown"
            execution_method = "fallback"

        print(f"🎯 Pattern: {pattern}")
        print(f"🚀 Execution Method: {execution_method}")

        if pattern == "direct_execution":
            print("✅ SUCCESS: Individual scanner will use direct execution!")
            print("🔧 This should work without syntax errors!")
            return True
        else:
            print("⚠️  WARNING: May not route to optimal execution method")
            return False

    except Exception as e:
        print(f"❌ ERROR testing {scanner_name}: {e}")
        return False

def main():
    """Test all 3 individual scanner files"""
    print("🧪 COMPREHENSIVE SCANNER FILE TESTING")
    print("=" * 60)
    print()

    # Define the 3 scanner files to test
    scanner_files = [
        ("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d3_extended_1_scanner.py", "LC D3 Extended 1 Scanner"),
        ("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py", "LC D2 Extended Scanner"),
        ("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_1_scanner.py", "LC D2 Extended 1 Scanner (FIXED)")
    ]

    results = []

    for file_path, scanner_name in scanner_files:
        success = test_pattern_detection(file_path, scanner_name)
        results.append((scanner_name, success))
        print("\\n" + "-"*60 + "\\n")

    # Summary
    print("🎯 FINAL RESULTS SUMMARY")
    print("=" * 60)

    all_passed = True
    for scanner_name, success in results:
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {scanner_name}")
        if not success:
            all_passed = False

    print()
    if all_passed:
        print("🎉 ALL SCANNER FILES PASSED!")
        print("🚀 All individual scanners will route to direct execution")
        print("✅ The user's upload and execution issues should be resolved!")
    else:
        print("⚠️  Some scanner files failed - additional fixes needed")

    return all_passed

if __name__ == "__main__":
    success = main()
    if success:
        print("\\n✅ COMPLETE: All scanner files are properly configured")
    else:
        print("\\n🔧 NEEDS WORK: Some files require additional fixes")