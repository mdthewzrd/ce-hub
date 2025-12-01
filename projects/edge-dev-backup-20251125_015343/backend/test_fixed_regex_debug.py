#!/usr/bin/env python3
"""
Test the FIXED regex extraction to verify deduplication works
"""

import re

def test_fixed_regex_extraction():
    print("🔍 TESTING FIXED REGEX EXTRACTION WITH DEDUPLICATION")
    print("=" * 60)

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
    found_scanners = set()  # Track unique scanner names

    for func_name in target_functions:
        print(f"\n🔎 Testing FIXED regex for: {func_name}")

        # Use the FIXED pattern that avoids == comparisons
        pattern = rf"df\['{re.escape(func_name)}'\]\s*=(?!=).*?\.astype\(int\)"
        print(f"   Pattern: {pattern}")

        # Test the pattern
        matches = re.findall(pattern, code, re.DOTALL)
        print(f"   Raw matches found: {len(matches)}")

        if matches:
            for i, match in enumerate(matches):
                print(f"      Match {i+1}: {match[:100]}...")

        # Only add if we haven't already found this scanner and there are matches
        if matches and func_name not in found_scanners:
            found_scanners.add(func_name)
            print(f"   ✅ UNIQUE SCANNER ADDED: {func_name}")
            scanners.append({
                'name': func_name,
                'match': matches[0]  # Use first match
            })
        elif matches:
            print(f"   ⚠️ DUPLICATE IGNORED: {func_name} already found")
        else:
            print(f"   ❌ NO MATCH: {func_name}")

    print(f"\n📊 FIXED RESULTS:")
    print(f"   Total unique scanners found: {len(scanners)}")
    print(f"   Success condition: len(scanners) == 3 -> {len(scanners) == 3}")
    print(f"   Found scanners set: {found_scanners}")

    if len(scanners) == 3:
        print(f"   ✅ SUCCESS! Would use Direct_Regex_Extraction method")
        print(f"   ✅ System will NOT fall back to AI analysis")
        print(f"   ✅ User's \"0 Parameters Made Configurable\" issue should be FIXED!")
    else:
        print(f"   ❌ Still failing - would fall back to AI analysis")

    print(f"\n🔍 DETAILED ANALYSIS:")
    if scanners:
        for i, scanner in enumerate(scanners, 1):
            print(f"   {i}. {scanner['name']}")
            print(f"      Match preview: {scanner['match'][:150]}...")
    else:
        print("   No scanners extracted - need further debugging")

if __name__ == "__main__":
    test_fixed_regex_extraction()