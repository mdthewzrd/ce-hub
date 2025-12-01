#!/usr/bin/env python3
"""
Debug the direct regex extraction in bulletproof_v2 service
"""

import re

def test_direct_regex_extraction():
    print("🔍 DEBUGGING DIRECT REGEX EXTRACTION IN BULLETPROOF V2")
    print("=" * 60)

    # Load the user's scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    # Target scanner functions (same as in bulletproof_v2)
    target_functions = [
        'lc_frontside_d3_extended_1',
        'lc_frontside_d2_extended',
        'lc_fbo'
    ]

    print(f"\n🎯 Looking for {len(target_functions)} target functions:")
    for func in target_functions:
        print(f"   - {func}")

    scanners = []
    found_scanners = set()

    for func_name in target_functions:
        print(f"\n🔎 Testing regex for: {func_name}")

        # Use the exact pattern from bulletproof_v2 (line 123)
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
                'matches': len(matches)
            })
        elif matches:
            print(f"   ⚠️ DUPLICATE IGNORED: {func_name} already found")
        else:
            print(f"   ❌ NO MATCH: {func_name}")

    print(f"\n📊 BULLETPROOF V2 DIRECT REGEX RESULTS:")
    print(f"   Total unique scanners found: {len(scanners)}")
    print(f"   Success condition: len(scanners) == 3 -> {len(scanners) == 3}")
    print(f"   Found scanners set: {found_scanners}")

    if len(scanners) == 3:
        print(f"   ✅ SUCCESS! Would use Direct_Regex_Extraction method")
        print(f"   ✅ Would not fall back to AI analysis")
        print(f"   ✅ No instant fake results from guaranteed service!")
    else:
        print(f"   ❌ FAILURE - would fall back to AI analysis -> guaranteed service -> instant fake results")
        print(f"   ❌ This explains the 'instant split' issue!")

    print(f"\n🔧 DEBUG ANALYSIS:")
    if len(scanners) == 0:
        print("   ❌ CRITICAL: No scanners found - regex patterns not matching")
        print("   💡 SOLUTION: Fix regex patterns or target function names")
    elif len(scanners) < 3:
        print(f"   ❌ PARTIAL: Only {len(scanners)}/3 scanners found")
        print("   💡 SOLUTION: Check if all target functions exist in file")
    else:
        print(f"   ❌ EXCESS: {len(scanners)} scanners found (more than 3)")
        print("   💡 SOLUTION: Adjust success condition or deduplication logic")

    print(f"\n🚀 NEXT STEPS:")
    if len(scanners) != 3:
        print(f"   1. Fix the direct regex extraction to find exactly 3 scanners")
        print(f"   2. This will prevent fallback to guaranteed service")
        print(f"   3. This will resolve the 'instant split' issue!")
    else:
        print(f"   1. Direct regex is working! Issue might be elsewhere.")
        print(f"   2. Check if bulletproof_v2 service is actually being called.")

if __name__ == "__main__":
    test_direct_regex_extraction()