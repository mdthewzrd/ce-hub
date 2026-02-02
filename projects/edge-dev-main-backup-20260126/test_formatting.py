#!/usr/bin/env python3
"""
Test Renata formatting service
"""
import requests
import json

# Test the formatting service with simple code
test_code = '''print("hello world")'''

payload = {
    "code": test_code,
    "filename": "test.py",
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
        timeout=60
    )

    print(f"Status Code: {response.status_code}")
    print(f"Response: {json.dumps(response.json(), indent=2)}")

    if response.status_code == 200 and response.json().get("success"):
        formatted_code = response.json().get("formattedCode")
        if formatted_code:
            print(f"\nFormatted Code (first 500 chars):")
            print(formatted_code[:500])
            print(f"\nTotal Length: {len(formatted_code)} characters")
        else:
            print("No formatted code in response")
    else:
        print("Formatting failed")

except Exception as e:
    print(f"Error: {e}")