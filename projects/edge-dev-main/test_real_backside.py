#!/usr/bin/env python3
"""
Test Renata formatting service with real backside B code
"""
import requests
import json

# Read the actual backside B file
with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
    test_code = f.read()

payload = {
    "code": test_code,
    "filename": "backside_para_b_copy.py",
    "useEnhancedService": True,
    "validateOutput": True,
    "maxRetries": 2,
    "aiProvider": "openrouter",
    "model": "qwen/qwen-2.5-coder-32b-instruct"
}

try:
    response = requests.post(
        "http://localhost:5665/api/format-exact",
        headers={"Content-Type": "application/json"},
        json=payload,
        timeout=90
    )

    print(f"Status Code: {response.status_code}")

    response_data = response.json()
    print(f"Success: {response_data.get('success')}")
    print(f"Message: {response_data.get('message')}")

    if response_data.get("success"):
        formatted_code = response_data.get("formattedCode")
        if formatted_code:
            print(f"Formatted Code Length: {len(formatted_code)} characters")
            print(f"Formatted Code Lines: {len(formatted_code.split(chr(10)))}")

            # Check for class name consistency
            class_count = formatted_code.count("class FormattedBacksideParaBScanner")
            main_func_count = formatted_code.count("scanner = FormattedBacksideParaBScanner()")

            print(f"Class Definition Count: {class_count}")
            print(f"Main Function Count: {main_func_count}")

            # Check for timedelta import
            has_timedelta = "from datetime import datetime, timedelta" in formatted_code
            print(f"Has Timedelta Import: {has_timedelta}")

            # Save formatted code
            with open("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/test_renata_fixed_output.py", "w") as f:
                f.write(formatted_code)
            print("Formatted code saved to test_renata_fixed_output.py")

            # Test if the formatted code can be executed (basic syntax check)
            try:
                compile(formatted_code, '<string>', 'exec')
                print("✅ Formatted code compiles successfully")
            except SyntaxError as e:
                print(f"❌ Formatted code has syntax error: {e}")
        else:
            print("❌ No formatted code in response")
    else:
        print(f"❌ Formatting failed: {response_data}")

except Exception as e:
    print(f"Error: {e}")