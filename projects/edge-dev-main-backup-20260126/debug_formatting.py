#!/usr/bin/env python3
"""
Debug formatting service
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
    print(f"Response Headers: {dict(response.headers)}")

    try:
        response_data = response.json()
        print(f"Response JSON: {json.dumps(response_data, indent=2)}")
    except:
        print(f"Raw Response Text: {response.text[:1000]}")

except Exception as e:
    print(f"Error: {e}")
    import traceback
    traceback.print_exc()