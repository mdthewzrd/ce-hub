#!/usr/bin/env python3
"""
Test the formatting with the LC D2 scan file
"""
import json
import requests

# Read the LC D2 scan file
with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
    scan_code = f.read()

# Prepare the request
request_data = {
    "code": scan_code,
    "options": {
        "enableMultiprocessing": True,
        "enableAsyncPatterns": True,
        "addTradingPackages": True,
        "standardizeOutput": True,
        "optimizePerformance": True,
        "includeLogging": True
    }
}

# Test the formatting
try:
    response = requests.post(
        'http://localhost:8000/api/format/code',
        json=request_data,
        timeout=60  # Longer timeout for larger file
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ Success: {result['success']}")
        print(f"📊 Scanner Type: {result['scanner_type']}")
        print(f"🔍 Parameter Count: {result['metadata']['parameter_count']}")
        print(f"🎯 Integrity Verified: {result['integrity_verified']}")

        if result['warnings']:
            print(f"⚠️ Warnings: {result['warnings']}")

        # Save formatted code to check
        with open('/Users/michaeldurante/ai dev/ce-hub/formatted_lc_d2.py', 'w') as f:
            f.write(result['formatted_code'])
        print("💾 Formatted code saved to formatted_lc_d2.py")

    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Exception: {e}")