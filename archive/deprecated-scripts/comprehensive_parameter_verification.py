#!/usr/bin/env python3

import re
import json
import requests

def extract_all_parameters_from_original():
    """Extract all parameters from the original scan file"""
    with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", "r") as f:
        content = f.read()

    # Find custom_params dictionary
    pattern = r'custom_params\s*=\s*\{([^}]+)\}'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        print("❌ Could not find custom_params in original file")
        return None

    params_text = match.group(1)
    params = {}

    # Parse each parameter line more carefully
    lines = params_text.split('\n')
    for line in lines:
        line = line.strip()
        if ':' in line and not line.startswith('#') and line:
            # Split on first colon only
            parts = line.split(':', 1)
            if len(parts) == 2:
                key = parts[0].strip().strip("'\"")
                value_part = parts[1].strip()

                # Remove trailing comma and comments
                if ',' in value_part:
                    value_part = value_part.split(',')[0].strip()
                if '#' in value_part:
                    value_part = value_part.split('#')[0].strip()

                # Convert to number
                try:
                    if '.' in value_part:
                        params[key] = float(value_part)
                    else:
                        params[key] = int(value_part)
                except ValueError as e:
                    print(f"Warning: Could not parse {key}: {value_part} ({e})")

    return params

def extract_parameters_from_formatted():
    """Extract parameters from formatted code via API"""
    with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", "r") as f:
        scan_content = f.read()

    try:
        response = requests.post(
            "http://localhost:8000/api/format/code",
            headers={"Content-Type": "application/json"},
            json={"code": scan_content},
            timeout=30
        )

        if response.status_code != 200:
            print(f"❌ API request failed: {response.status_code}")
            return None

        result = response.json()
        formatted_code = result.get('formatted_code', '')

        # Extract preserved_custom_params
        pattern = r'preserved_custom_params\s*=\s*\{([^}]+)\}'
        match = re.search(pattern, formatted_code, re.DOTALL)

        if not match:
            print("❌ Could not find preserved_custom_params in formatted code")
            return None

        params_text = match.group(1)
        params = {}

        # Parse parameters
        lines = params_text.split('\n')
        for line in lines:
            line = line.strip()
            if ':' in line and not line.startswith('#') and line:
                parts = line.split(':', 1)
                if len(parts) == 2:
                    key = parts[0].strip().strip("'\"")
                    value_part = parts[1].strip()

                    # Remove trailing comma and comments
                    if ',' in value_part:
                        value_part = value_part.split(',')[0].strip()
                    if '#' in value_part:
                        value_part = value_part.split('#')[0].strip()

                    # Convert to number
                    try:
                        if '.' in value_part:
                            params[key] = float(value_part)
                        else:
                            params[key] = int(value_part)
                    except ValueError as e:
                        print(f"Warning: Could not parse {key}: {value_part} ({e})")

        return params, result

    except Exception as e:
        print(f"❌ Error calling API: {e}")
        return None

def main():
    print("🔍 COMPREHENSIVE PARAMETER VERIFICATION")
    print("=" * 60)

    # Extract original parameters
    original_params = extract_all_parameters_from_original()
    if not original_params:
        return False

    print(f"\n📋 ORIGINAL PARAMETERS ({len(original_params)} found):")
    for key, value in sorted(original_params.items()):
        print(f"   {key}: {value}")

    # Extract formatted parameters
    formatted_result = extract_parameters_from_formatted()
    if not formatted_result:
        return False

    formatted_params, api_result = formatted_result

    print(f"\n📋 FORMATTED PARAMETERS ({len(formatted_params)} found):")
    for key, value in sorted(formatted_params.items()):
        print(f"   {key}: {value}")

    # Critical validation - these must match exactly
    critical_tests = [
        ('slope15d_min', 50, 'NOT 40 from defaults'),
        ('open_over_ema9_min', 1.0, 'NOT 1.25 from defaults'),
        ('prev_close_min', 10.0, 'NOT 15.0 from defaults')
    ]

    print(f"\n🎯 CRITICAL PARAMETER TESTS:")
    print("-" * 40)
    critical_pass = True

    for param_name, expected_value, note in critical_tests:
        if param_name in formatted_params:
            actual_value = formatted_params[param_name]
            status = "✅ PASS" if actual_value == expected_value else "❌ FAIL"
            print(f"   {param_name}: {actual_value} (expected: {expected_value}) {status}")
            print(f"      → {note}")
            if actual_value != expected_value:
                critical_pass = False
        else:
            print(f"   {param_name}: MISSING ❌ FAIL")
            critical_pass = False

    # Comprehensive comparison
    print(f"\n🔍 COMPREHENSIVE COMPARISON:")
    print("-" * 35)

    all_keys = set(original_params.keys()) | set(formatted_params.keys())
    exact_match = True

    for key in sorted(all_keys):
        orig_val = original_params.get(key, "MISSING")
        form_val = formatted_params.get(key, "MISSING")

        if orig_val == "MISSING":
            print(f"   {key}: EXTRA in formatted ({form_val}) ⚠️")
            exact_match = False
        elif form_val == "MISSING":
            print(f"   {key}: MISSING in formatted ❌")
            exact_match = False
        elif orig_val == form_val:
            print(f"   {key}: {orig_val} ✅")
        else:
            print(f"   {key}: {orig_val} → {form_val} ❌")
            exact_match = False

    # API metadata check
    print(f"\n📊 API METADATA:")
    print("-" * 20)
    metadata = api_result.get('metadata', {})
    print(f"   Parameter count: {metadata.get('parameter_count', 'N/A')}")
    print(f"   Processing time: {metadata.get('processing_time', 'N/A')}")
    print(f"   Integrity verified: {api_result.get('integrity_verified', False)}")

    # Final result
    print(f"\n🏆 FINAL VALIDATION RESULT:")
    print("=" * 35)

    if critical_pass and exact_match:
        print("✅ PASS - 100% parameter preservation achieved!")
        print("✅ All critical parameters preserved exactly")
        print("✅ No parameter contamination detected")
        return True
    else:
        print("❌ FAIL - Parameter contamination detected!")
        if not critical_pass:
            print("❌ Critical parameter values don't match custom_params")
        if not exact_match:
            print("❌ Parameter set doesn't match exactly")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)