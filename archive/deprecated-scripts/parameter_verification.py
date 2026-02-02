#!/usr/bin/env python3

import re
import json

# Extract parameters from original file
def extract_original_parameters():
    with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", "r") as f:
        content = f.read()

    # Find custom_params dictionary in main block
    pattern = r'custom_params\s*=\s*\{([^}]+)\}'
    match = re.search(pattern, content, re.DOTALL)

    if not match:
        return None

    params_text = match.group(1)
    params = {}

    # Parse each parameter line
    for line in params_text.split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith('#'):
            key_value = line.split(':', 1)
            if len(key_value) == 2:
                key = key_value[0].strip().strip("'\"")
                value_str = key_value[1].strip().rstrip(',').strip()

                # Handle comments
                if '#' in value_str:
                    value_str = value_str.split('#')[0].strip()

                # Convert value to appropriate type
                try:
                    if '.' in value_str:
                        value = float(value_str)
                    else:
                        value = int(value_str)
                    params[key] = value
                except ValueError:
                    continue

    return params

# Extract parameters from formatted code (from API response)
def extract_formatted_parameters():
    # Get the response from previous API call
    import requests

    with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", "r") as f:
        scan_content = f.read()

    response = requests.post(
        "http://localhost:8000/api/format/code",
        headers={"Content-Type": "application/json"},
        json={"code": scan_content}
    )

    if response.status_code != 200:
        return None

    result = response.json()
    formatted_code = result.get('formatted_code', '')

    # Extract preserved_custom_params from formatted code
    pattern = r'preserved_custom_params\s*=\s*\{([^}]+)\}'
    match = re.search(pattern, formatted_code, re.DOTALL)

    if not match:
        return None

    params_text = match.group(1)
    params = {}

    # Parse each parameter line
    for line in params_text.split('\n'):
        line = line.strip()
        if ':' in line and not line.startswith('#'):
            key_value = line.split(':', 1)
            if len(key_value) == 2:
                key = key_value[0].strip().strip("'\"")
                value_str = key_value[1].strip().rstrip(',').strip()

                # Handle comments
                if '#' in value_str:
                    value_str = value_str.split('#')[0].strip()

                # Convert value to appropriate type
                try:
                    if '.' in value_str:
                        value = float(value_str)
                    else:
                        value = int(value_str)
                    params[key] = value
                except ValueError:
                    continue

    return params

def main():
    print("🔍 PARAMETER VERIFICATION TEST")
    print("=" * 50)

    # Extract original parameters
    original_params = extract_original_parameters()
    print(f"\n📋 ORIGINAL PARAMETERS ({len(original_params)} found):")
    for key, value in sorted(original_params.items()):
        print(f"   {key}: {value}")

    # Extract formatted parameters
    formatted_params = extract_formatted_parameters()
    print(f"\n📋 FORMATTED PARAMETERS ({len(formatted_params)} found):")
    for key, value in sorted(formatted_params.items()):
        print(f"   {key}: {value}")

    # Compare parameters
    print(f"\n🔍 PARAMETER COMPARISON:")
    print("=" * 30)

    all_match = True
    missing_in_formatted = []
    missing_in_original = []
    value_mismatches = []

    # Check for missing parameters
    for key in original_params:
        if key not in formatted_params:
            missing_in_formatted.append(key)
            all_match = False

    for key in formatted_params:
        if key not in original_params:
            missing_in_original.append(key)
            all_match = False

    # Check for value mismatches
    for key in original_params:
        if key in formatted_params:
            if original_params[key] != formatted_params[key]:
                value_mismatches.append({
                    'key': key,
                    'original': original_params[key],
                    'formatted': formatted_params[key]
                })
                all_match = False

    # Critical validation checks
    critical_params = {
        'slope15d_min': 50,    # Should be 50, NOT 40
        'open_over_ema9_min': 1.0,  # Should be 1.0, NOT 1.25
        'prev_close_min': 10.0  # Should be 10.0, NOT 15.0
    }

    print(f"\n🎯 CRITICAL PARAMETER VALIDATION:")
    critical_pass = True
    for param, expected_value in critical_params.items():
        if param in formatted_params:
            actual_value = formatted_params[param]
            status = "✅ PASS" if actual_value == expected_value else "❌ FAIL"
            print(f"   {param}: {actual_value} (expected: {expected_value}) {status}")
            if actual_value != expected_value:
                critical_pass = False
        else:
            print(f"   {param}: MISSING ❌ FAIL")
            critical_pass = False

    # Results
    print(f"\n📊 VALIDATION RESULTS:")
    print("=" * 25)

    if missing_in_formatted:
        print(f"❌ Missing in formatted: {missing_in_formatted}")

    if missing_in_original:
        print(f"⚠️ Extra in formatted: {missing_in_original}")

    if value_mismatches:
        print(f"❌ Value mismatches:")
        for mismatch in value_mismatches:
            print(f"   {mismatch['key']}: {mismatch['original']} → {mismatch['formatted']}")

    # Final determination
    print(f"\n🏆 FINAL RESULT:")
    if all_match and critical_pass:
        print("✅ PASS - 100% parameter preservation achieved!")
        print("✅ All critical parameters match custom_params exactly")
    else:
        print("❌ FAIL - Parameter contamination detected!")
        if not critical_pass:
            print("❌ Critical parameter contamination found")
        if not all_match:
            print("❌ Parameter mismatch detected")

    return all_match and critical_pass

if __name__ == "__main__":
    main()