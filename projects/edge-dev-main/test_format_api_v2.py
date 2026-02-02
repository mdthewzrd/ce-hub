#!/usr/bin/env python3
"""
Test the format-scan API with updated prompts
"""
import requests
import base64
import json

# Read the messy test file
with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backside_b_MESSY_TEST.py', 'r') as f:
    messy_code = f.read()

# Encode to base64
encoded_code = base64.b64encode(messy_code.encode()).decode()

# Call the format-scan API
response = requests.post(
    'http://localhost:5665/api/format-scan',
    json={
        'code': encoded_code,
        'encoding': 'base64'
    },
    timeout=180  # Increased timeout for larger prompts
)

print(f"Status Code: {response.status_code}")

if response.status_code == 200:
    result = response.json()

    # Debug: print all keys
    print(f"Response keys: {result.keys()}")
    for key in result.keys():
        if key != 'formattedCode':
            print(f"  {key}: {result.get(key)}")

    formatted_code = result.get('formattedCode', '')

    # Debug: check if formatted code is different
    if formatted_code == messy_code:
        print("⚠️ WARNING: Output is identical to input! No transformation occurred.")
    else:
        print("✅ Code was transformed")

    # Save to file
    with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backside_b_AI_FORMATTED_V2.py', 'w') as f:
        f.write(formatted_code)

    print(f"✅ Formatting complete!")
    print(f"Input: {len(messy_code)} chars")
    print(f"Output: {len(formatted_code)} chars")
    print(f"Saved to: backside_b_AI_FORMATTED_V2.py")
else:
    print(f"❌ Error: {response.text}")
