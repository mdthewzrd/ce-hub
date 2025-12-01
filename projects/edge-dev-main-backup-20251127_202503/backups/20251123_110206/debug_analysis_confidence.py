#!/usr/bin/env python3
"""
Debug the analysis confidence issue - test the exact logic that determines 0% vs 100% confidence
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_individual_scanner_detection():
    """Test the exact logic that should detect individual scanners"""
    print("🔍 DEBUGGING INDIVIDUAL SCANNER DETECTION LOGIC")
    print("=" * 70)

    # Load the problematic file
    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Loaded file: {len(code)} characters")
        print()

        # Test each detection criteria
        print("🔍 DETECTION CRITERIA ANALYSIS:")
        print()

        # 1. Check for async def main
        has_async_main = 'async def main(' in code
        print(f"1. Has 'async def main(': {has_async_main}")

        # 2. Check for standalone script
        is_standalone_script = 'if __name__ == "__main__"' in code
        print(f"2. Is standalone script (has __main__): {is_standalone_script}")
        print(f"   Should be False for individual scanners: {not is_standalone_script}")

        # 3. Count patterns
        pattern_lines = [line for line in code.split('\n') if 'df[\'lc_frontside' in line and '= (' in line]
        actual_pattern_count = len(pattern_lines)
        print(f"3. Pattern count: {actual_pattern_count}")
        print(f"   Pattern lines found: {len(pattern_lines)}")
        for i, line in enumerate(pattern_lines):
            print(f"      {i+1}. {line.strip()}")

        # 4. Check for specific patterns
        has_d3_extended_1 = "df['lc_frontside_d3_extended_1'] = " in code
        has_d2_extended = "df['lc_frontside_d2_extended'] = " in code
        has_d2_extended_1 = "df['lc_frontside_d2_extended_1'] = " in code
        print(f"4. Specific patterns:")
        print(f"   has_d3_extended_1: {has_d3_extended_1}")
        print(f"   has_d2_extended: {has_d2_extended}")
        print(f"   has_d2_extended_1: {has_d2_extended_1}")
        print(f"   Any pattern found: {has_d3_extended_1 or has_d2_extended or has_d2_extended_1}")

        # Final calculation
        print()
        print("🎯 FINAL INDIVIDUAL SCANNER DETECTION:")
        is_individual_scanner = (
            'async def main(' in code and
            not is_standalone_script and
            actual_pattern_count == 1 and
            (has_d3_extended_1 or has_d2_extended or has_d2_extended_1)
        )
        print(f"   Result: {is_individual_scanner}")

        if is_individual_scanner:
            print("✅ Should return confidence=100 and bypass parameter extraction")
        else:
            print("❌ Will go through normal analysis (causing 0% confidence)")
            print()
            print("🔧 DEBUGGING WHY DETECTION FAILED:")
            if not has_async_main:
                print("   ❌ Missing 'async def main('")
            if is_standalone_script:
                print("   ❌ Has __main__ block (should not have)")
            if actual_pattern_count != 1:
                print(f"   ❌ Pattern count is {actual_pattern_count} (should be 1)")
            if not (has_d3_extended_1 or has_d2_extended or has_d2_extended_1):
                print("   ❌ No recognized pattern found")

        return is_individual_scanner

    except Exception as e:
        print(f"❌ Error: {e}")
        import traceback
        traceback.print_exc()
        return False

def test_pattern_line_detection():
    """Debug the pattern line detection specifically"""
    print(f"\n🔍 DEBUGGING PATTERN LINE DETECTION")
    print("=" * 70)

    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            lines = f.readlines()

        print(f"📄 Analyzing {len(lines)} lines")
        print()

        # Look for pattern-related lines
        pattern_candidates = []
        for i, line in enumerate(lines, 1):
            line_clean = line.strip()
            if 'lc_frontside' in line_clean:
                pattern_candidates.append((i, line_clean))

        print(f"🔍 Found {len(pattern_candidates)} lines containing 'lc_frontside':")
        for line_num, line_content in pattern_candidates:
            print(f"   Line {line_num}: {line_content}")

        print()

        # Test the specific detection logic
        pattern_lines = [line for line in [l[1] for l in pattern_candidates] if 'df[\'lc_frontside' in line and '= (' in line]
        print(f"🎯 Pattern lines matching detection logic: {len(pattern_lines)}")
        for i, line in enumerate(pattern_lines):
            print(f"   {i+1}. {line}")

        # Test alternative detection methods
        print()
        print("🔧 Alternative detection patterns:")
        alt1 = [line for line in [l[1] for l in pattern_candidates] if 'df[' in line and '= (' in line]
        print(f"   df[...] = ( patterns: {len(alt1)}")

        alt2 = [line for line in [l[1] for l in pattern_candidates] if "df['lc_frontside" in line]
        print(f"   df['lc_frontside patterns: {len(alt2)}")

        return pattern_lines

    except Exception as e:
        print(f"❌ Error: {e}")
        return []

def compare_with_working_file():
    """Compare with a working individual scanner file"""
    print(f"\n🔍 COMPARING WITH WORKING INDIVIDUAL SCANNER")
    print("=" * 70)

    working_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_1_scanner.py"
    problem_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    for label, file_path in [("Working File", working_file), ("Problem File", problem_file)]:
        try:
            with open(file_path, 'r') as f:
                code = f.read()

            print(f"\n📄 {label}: {os.path.basename(file_path)}")

            has_async_main = 'async def main(' in code
            is_standalone_script = 'if __name__ == "__main__"' in code
            pattern_lines = [line for line in code.split('\n') if 'df[\'lc_frontside' in line and '= (' in line]
            actual_pattern_count = len(pattern_lines)
            has_d2_extended = "df['lc_frontside_d2_extended'] = " in code
            has_d2_extended_1 = "df['lc_frontside_d2_extended_1'] = " in code

            is_individual = (
                has_async_main and
                not is_standalone_script and
                actual_pattern_count == 1 and
                (has_d2_extended or has_d2_extended_1)
            )

            print(f"   async def main: {has_async_main}")
            print(f"   __main__ block: {is_standalone_script}")
            print(f"   pattern count: {actual_pattern_count}")
            print(f"   d2_extended: {has_d2_extended}")
            print(f"   d2_extended_1: {has_d2_extended_1}")
            print(f"   → Individual scanner: {is_individual}")

        except Exception as e:
            print(f"   ❌ Error reading {file_path}: {e}")

def main():
    """Debug the confidence analysis issue"""
    print("🎯 DEBUGGING 0% CONFIDENCE ISSUE")
    print("=" * 70)
    print("Understanding why individual scanner detection is failing")
    print()

    # Test the detection logic
    detected = test_individual_scanner_detection()

    # Debug pattern detection
    patterns = test_pattern_line_detection()

    # Compare with working file
    compare_with_working_file()

    print("\n" + "=" * 70)
    print("🎯 DIAGNOSIS SUMMARY")
    print("=" * 70)

    if detected:
        print("✅ Individual scanner detection SHOULD work")
        print("💡 If still seeing 0% confidence, there may be:")
        print("   - A caching issue in the backend")
        print("   - A different code path being used")
        print("   - A frontend/backend synchronization issue")
    else:
        print("❌ Individual scanner detection is failing")
        print("🔧 This explains the 0% confidence")
        print("💡 Need to fix the detection logic or file structure")

if __name__ == "__main__":
    main()