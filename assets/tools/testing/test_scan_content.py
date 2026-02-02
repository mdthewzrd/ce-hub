#!/usr/bin/env python3

import requests
import json

# Read the scan file content
with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", "r") as f:
    scan_content = f.read()

# Test the API
response = requests.post(
    "http://localhost:8000/api/format/code",
    headers={"Content-Type": "application/json"},
    json={"code": scan_content}
)

print("Status Code:", response.status_code)
print("\nResponse Headers:")
for k, v in response.headers.items():
    print(f"  {k}: {v}")

print("\nResponse Content:")
if response.headers.get('content-type', '').startswith('application/json'):
    try:
        result = response.json()
        print(json.dumps(result, indent=2))
    except json.JSONDecodeError:
        print("Failed to decode JSON response")
        print(response.text)
else:
    print(response.text)