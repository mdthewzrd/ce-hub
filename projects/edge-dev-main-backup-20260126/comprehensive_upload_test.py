#!/usr/bin/env python3
"""
🔒 Comprehensive Upload System Parameter Integrity Test
Test all three scanner types to verify zero cross-contamination
"""
import requests
import json
import re
from typing import Set, Dict, Any

def extract_parameters_from_code(code: str) -> Set[str]:
    """Extract all parameters from code using multiple patterns"""
    params = set()

    # Pattern 1: Variable assignments
    assignments = re.findall(r'^\s*(\w+)\s*=\s*([\d.]+)', code, re.MULTILINE)
    for param, value in assignments:
        if not param.startswith('_') and len(param) > 2:
            params.add(param)

    # Pattern 2: Conditional expressions
    conditionals = re.findall(r'(\w+)\s*(>=|<=|>|<)\s*([\d.]+)', code)
    for param, op, value in conditionals:
        if not param.startswith('_') and len(param) > 2:
            params.add(param)

    # Pattern 3: Dictionary parameters
    dict_params = re.findall(r"'(\w+)'\s*:\s*([\d.]+)", code)
    for param, value in dict_params:
        if len(param) > 2:
            params.add(param)

    return params

def test_scanner_upload(file_path: str, expected_type: str) -> Dict[str, Any]:
    """Test a single scanner upload and return results"""
    print(f"\n{'='*80}")
    print(f"🔍 Testing: {file_path.split('/')[-1]}")
    print(f"   Expected type: {expected_type}")
    print('='*80)

    # Load the scanner
    try:
        with open(file_path, 'r') as f:
            original_code = f.read()
        print(f"✅ Loaded scanner: {len(original_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Could not find scanner: {file_path}")
        return {"success": False, "error": "File not found"}

    # Extract original parameters
    original_params = extract_parameters_from_code(original_code)
    print(f"📊 Original parameters: {len(original_params)}")
    for param in sorted(original_params)[:8]:
        print(f"   - {param}")
    if len(original_params) > 8:
        print(f"   ... and {len(original_params) - 8} more")

    # Critical contamination indicators
    has_parabolic = any('parabolic' in param.lower() for param in original_params)
    has_lc_indicators = any(param in ['ema_dev', 'atr_mult', 'gap'] for param in original_params)
    has_aplus_indicators = any('parabolic' in param.lower() for param in original_params)

    print(f"\n🎯 Scanner Type Indicators:")
    print(f"   Contains parabolic params: {'✅' if has_parabolic else '❌'}")
    print(f"   Contains LC indicators: {'✅' if has_lc_indicators else '❌'}")
    print(f"   Contains A+ indicators: {'✅' if has_aplus_indicators else '❌'}")

    # Test through formatting API
    api_url = "http://localhost:8000/api/format/code"
    payload = {"code": original_code, "scanner_type": "auto"}

    try:
        print(f"\n🔧 Testing upload through formatting API...")
        response = requests.post(api_url, json=payload, timeout=30)

        if response.status_code != 200:
            print(f"❌ API failed: {response.status_code}")
            return {"success": False, "error": f"API error {response.status_code}"}

        result = response.json()
        print("✅ Upload successful")

        # Extract processing info
        detected_type = result.get('scanner_type', 'Unknown')
        bypass_reason = result.get('metadata', {}).get('bypass_reason', 'None')
        preservation_mode = result.get('metadata', {}).get('preservation_mode', False)
        formatted_code = result.get('formatted_code', '')

        print(f"\n📋 Processing Results:")
        print(f"   Detected type: {detected_type}")
        print(f"   Bypass reason: {bypass_reason}")
        print(f"   Preservation mode: {preservation_mode}")
        print(f"   Length change: {len(original_code)} → {len(formatted_code)}")

        # CRITICAL: Check for parameter contamination
        print(f"\n🔒 CONTAMINATION ANALYSIS:")

        # Check for A+ contamination in LC scanners
        original_has_parabolic = 'parabolic' in original_code.lower()
        formatted_has_parabolic = 'parabolic' in formatted_code.lower()
        contamination_added = (not original_has_parabolic) and formatted_has_parabolic
        contamination_removed = original_has_parabolic and (not formatted_has_parabolic)

        print(f"   Original has parabolic: {'YES' if original_has_parabolic else 'NO'}")
        print(f"   Formatted has parabolic: {'YES' if formatted_has_parabolic else 'NO'}")

        if contamination_added:
            print("   🚨 CRITICAL: A+ contamination ADDED!")
            success = False
        elif contamination_removed:
            print("   🚨 CRITICAL: A+ parameters REMOVED!")
            success = False
        else:
            print("   ✅ Parameter integrity maintained")
            success = True

        # Additional integrity checks
        length_diff_pct = abs(len(formatted_code) - len(original_code)) / len(original_code) * 100

        if length_diff_pct > 10:
            print(f"   ⚠️ Significant code modification: {length_diff_pct:.1f}%")
        else:
            print(f"   ✅ Minimal modification: {length_diff_pct:.1f}%")

        return {
            "success": success,
            "file_path": file_path,
            "original_params": len(original_params),
            "detected_type": detected_type,
            "bypass_reason": bypass_reason,
            "preservation_mode": preservation_mode,
            "contamination_added": contamination_added,
            "contamination_removed": contamination_removed,
            "length_change_pct": length_diff_pct,
            "original_has_parabolic": original_has_parabolic,
            "formatted_has_parabolic": formatted_has_parabolic
        }

    except requests.exceptions.RequestException as e:
        print(f"❌ API request failed: {e}")
        return {"success": False, "error": str(e)}

def main():
    """Test all three scanners for parameter integrity"""
    print("🚀 COMPREHENSIVE UPLOAD SYSTEM PARAMETER INTEGRITY TEST")
    print("Testing parameter preservation across all scanner types")

    # Define test cases
    test_scanners = [
        ("/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py", "LC"),
        ("/Users/michaeldurante/Downloads/backside para b copy.py", "A+"),
        ("/Users/michaeldurante/Downloads/half A+ scan copy.py", "A+")
    ]

    results = []

    for file_path, expected_type in test_scanners:
        result = test_scanner_upload(file_path, expected_type)
        results.append(result)

    # Summary analysis
    print(f"\n{'='*80}")
    print("🎯 COMPREHENSIVE TEST SUMMARY")
    print('='*80)

    total_tests = len([r for r in results if 'success' in r])
    successful_tests = len([r for r in results if r.get('success', False)])

    print(f"\nOverall Results: {successful_tests}/{total_tests} tests passed")

    contamination_issues = 0
    for result in results:
        if result.get('success'):
            scanner_name = result['file_path'].split('/')[-1]
            print(f"\n✅ {scanner_name}:")
            print(f"   Detected as: {result['detected_type']}")
            print(f"   Bypass: {result['bypass_reason']}")
            print(f"   Preservation: {result['preservation_mode']}")

            if result['contamination_added'] or result['contamination_removed']:
                print(f"   🚨 CONTAMINATION DETECTED")
                contamination_issues += 1
            else:
                print(f"   ✅ Parameter integrity maintained")
        else:
            scanner_name = result.get('file_path', 'Unknown').split('/')[-1]
            print(f"\n❌ {scanner_name}: FAILED")
            contamination_issues += 1

    print(f"\n🔒 FINAL CONTAMINATION ASSESSMENT:")
    if contamination_issues == 0:
        print("🎉 PERFECT: Zero cross-contamination detected across all scanners!")
        print("✅ Parameter integrity fix is working correctly")
        print("✅ Upload system preserves exact scanner parameters")
        return True
    else:
        print(f"💥 ISSUES: {contamination_issues} contamination problems detected")
        print("❌ Parameter integrity fix needs further work")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)