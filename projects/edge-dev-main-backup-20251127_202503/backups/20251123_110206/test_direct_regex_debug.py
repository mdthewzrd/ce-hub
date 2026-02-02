#!/usr/bin/env python3
"""
Debug script to test direct regex extraction from bulletproof v2 service
"""

import re

def test_direct_regex_extraction():
    print("🔍 DEBUGGING DIRECT REGEX EXTRACTION")
    print("=" * 50)

    # Load the user's scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    # Target scanner functions (from bulletproof v2 service)
    target_functions = [
        'lc_frontside_d3_extended_1',
        'lc_frontside_d2_extended',
        'lc_fbo'
    ]

    print(f"\n🎯 Looking for {len(target_functions)} target functions:")
    for func in target_functions:
        print(f"   - {func}")

    scanners = []

    for func_name in target_functions:
        print(f"\n🔎 Testing regex for: {func_name}")

        # Use the EXACT pattern from bulletproof v2 service (line 89)
        pattern = rf"df\['{re.escape(func_name)}'\]\s*=.*?\.astype\(int\)"
        print(f"   Pattern: {pattern}")

        # Test the pattern
        matches = re.findall(pattern, code, re.DOTALL)
        print(f"   Matches found: {len(matches)}")

        if matches:
            print(f"   ✅ MATCH: {func_name}")
            for i, match in enumerate(matches):
                print(f"      Match {i+1}: {match[:100]}...")
                scanners.append({
                    'name': func_name,
                    'match': match
                })
        else:
            print(f"   ❌ NO MATCH: {func_name}")

            # Try to see what's actually in the file for this function
            simple_search = func_name in code
            print(f"   Simple string search '{func_name}' in code: {simple_search}")

            if simple_search:
                # Find the line containing this function name
                lines = code.split('\n')
                for line_num, line in enumerate(lines, 1):
                    if func_name in line:
                        print(f"      Line {line_num}: {line.strip()}")
                        break

    print(f"\n📊 FINAL RESULTS:")
    print(f"   Total scanners found: {len(scanners)}")
    print(f"   Success condition: len(scanners) == 3 -> {len(scanners) == 3}")

    if len(scanners) == 3:
        print(f"   ✅ Would use Direct_Regex_Extraction method")
    else:
        print(f"   ❌ Would fall back to AI analysis")

    print(f"\n🔍 DETAILED ANALYSIS:")
    if scanners:
        for i, scanner in enumerate(scanners, 1):
            print(f"   {i}. {scanner['name']}")
            print(f"      Match preview: {scanner['match'][:150]}...")
    else:
        print("   No scanners extracted - need to debug regex patterns")

if __name__ == "__main__":
    test_direct_regex_extraction()