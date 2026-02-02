#!/usr/bin/env python3
"""Quick API test"""
import requests
import json

url = "http://127.0.0.1:8052/api/transform"
payload = {
    "code": """import pandas as pd
import requests

def scan_ticker(ticker):
    url = f"https://api.polygon.io/{ticker}"
    data = requests.get(url).json()
    return data
""",
    "filename": "test_scanner.py",
    "preserve_logic": True,
    "validate_only": False
}

try:
    response = requests.post(url, json=payload, timeout=10)
    result = response.json()

    print("✅ API Test Result:")
    print(f"   Success: {result.get('success')}")
    print(f"   Scanner Type: {result.get('scanner_type')}")
    print(f"   Confidence: {result.get('confidence')}")

    if result.get('transformed_code'):
        code_lines = result['transformed_code'].split('\n')
        print(f"   Transformed Code Length: {len(code_lines)} lines")
        print("\n   First 15 lines:")
        for line in code_lines[:15]:
            print(f"   {line}")
    else:
        print(f"   Errors: {result.get('errors')}")

except Exception as e:
    print(f"❌ Error: {e}")
