#!/usr/bin/env python3
"""
🔒 Parameter Integrity Fix Validation Test
Test the fixed formatting system to ensure ZERO cross-contamination
"""
import requests
import json

def test_lc_scanner_parameter_integrity():
    """Test that LC scanner maintains pure parameters without A+ contamination"""
    print("🔒 Testing Parameter Integrity Fix...")
    print("=" * 60)

    # Read the original LC scanner
    lc_scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    try:
        with open(lc_scanner_path, 'r') as f:
            original_code = f.read()
        print(f"✅ Loaded original LC scanner: {len(original_code)} characters")
    except FileNotFoundError:
        print(f"❌ Could not find LC scanner at: {lc_scanner_path}")
        return

    # Extract original parameters for validation
    import re

    # Find original parameters in the code
    original_params = set()

    # Pattern 1: Variable assignments
    assignments = re.findall(r'^\s*(\w+)\s*=\s*([\d.]+)', original_code, re.MULTILINE)
    for param, value in assignments:
        if not param.startswith('_') and len(param) > 2:
            original_params.add(param)

    # Pattern 2: Conditional expressions
    conditionals = re.findall(r'(\w+)\s*(>=|<=|>|<)\s*([\d.]+)', original_code)
    for param, op, value in conditionals:
        if not param.startswith('_') and len(param) > 2:
            original_params.add(param)

    print(f"📊 Original parameters found: {len(original_params)}")
    for param in sorted(original_params)[:10]:  # Show first 10
        print(f"   - {param}")
    if len(original_params) > 10:
        print(f"   ... and {len(original_params) - 10} more")

    # Critical check: Verify 'parabolic_score' is NOT in original parameters
    has_parabolic_param = 'parabolic_score' in original_params
    print(f"\n🎯 Parabolic parameter check: {'❌ HAS PARABOLIC_SCORE' if has_parabolic_param else '✅ CLEAN'}")

    # Test the formatting API
    print("\n🔧 Testing formatting API with fixed parameter integrity...")

    api_url = "http://localhost:8000/api/format/code"

    payload = {
        "code": original_code,
        "scanner_type": "lc"
    }

    try:
        response = requests.post(api_url, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()
            print("✅ Formatting API response received")

            # Debug: Print the actual response structure
            print(f"🔍 API Response keys: {list(result.keys())}")
            if result:
                for key, value in list(result.items())[:3]:  # Show first 3 keys
                    print(f"   {key}: {type(value)} ({len(str(value))} chars)")

            # Debug signature structures
            if 'formatted_signature' in result:
                sig = result['formatted_signature']
                print(f"🔍 Formatted signature keys: {list(sig.keys()) if isinstance(sig, dict) else type(sig)}")

            if 'original_signature' in result:
                sig = result['original_signature']
                print(f"🔍 Original signature keys: {list(sig.keys()) if isinstance(sig, dict) else type(sig)}")

            if 'metadata' in result:
                meta = result['metadata']
                print(f"🔍 Metadata keys: {list(meta.keys()) if isinstance(meta, dict) else type(meta)}")

            # Check bypass reason and examine formatted code directly
            bypass_reason = result.get('metadata', {}).get('bypass_reason', 'Unknown')
            preservation_mode = result.get('metadata', {}).get('preservation_mode', False)

            print(f"\n🔧 Processing Info:")
            print(f"   Bypass reason: {bypass_reason}")
            print(f"   Preservation mode: {preservation_mode}")

            # Most important: Check if formatted code has contamination
            formatted_code = result.get('formatted_code', '')

            # Direct contamination check - look for parabolic_score injection
            original_has_parabolic = 'parabolic_score' in original_code
            formatted_has_parabolic = 'parabolic_score' in formatted_code

            print(f"\n🔒 CONTAMINATION CHECK:")
            print(f"   Original contains 'parabolic_score': {'❌ YES' if original_has_parabolic else '✅ NO'}")
            print(f"   Formatted contains 'parabolic_score': {'❌ YES' if formatted_has_parabolic else '✅ NO'}")

            # Check if contamination was ADDED during formatting
            contamination_added = (not original_has_parabolic) and formatted_has_parabolic

            if contamination_added:
                print("\n💥 CRITICAL: A+ contamination was ADDED during formatting!")
                print("   'parabolic_score' was injected into clean LC scanner")
                return False
            elif formatted_has_parabolic and original_has_parabolic:
                print("\n⚠️ WARNING: parabolic_score exists in original code")
                print("   This is not contamination - it was already there")
                return True
            else:
                print("\n🎉 SUCCESS: No A+ contamination added!")
                print("   Parameter integrity preserved during formatting")

                # Check if code length changed significantly (sign of modification)
                original_len = len(original_code)
                formatted_len = len(formatted_code)
                length_diff_pct = abs(formatted_len - original_len) / original_len * 100

                print(f"\n📊 Code Analysis:")
                print(f"   Original length: {original_len:,} chars")
                print(f"   Formatted length: {formatted_len:,} chars")
                print(f"   Length difference: {length_diff_pct:.1f}%")

                if length_diff_pct < 5:
                    print("   ✅ Minimal changes - good preservation")
                else:
                    print("   ⚠️ Significant changes detected")

                return True

        else:
            print(f"❌ Formatting API failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.RequestException as e:
        print(f"❌ API request failed: {e}")
        return False

if __name__ == "__main__":
    success = test_lc_scanner_parameter_integrity()
    if success:
        print("\n🎯 PARAMETER INTEGRITY FIX VALIDATED")
        exit(0)
    else:
        print("\n💥 PARAMETER INTEGRITY FIX FAILED")
        exit(1)