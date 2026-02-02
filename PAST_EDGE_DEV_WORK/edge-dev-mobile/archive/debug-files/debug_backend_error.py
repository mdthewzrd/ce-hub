#!/usr/bin/env python3
"""
🔍 Debug Backend Error
======================

Find out why backend is returning Success: False
"""

import requests
import json

def debug_backend_error():
    """Debug what's wrong with backend formatting"""

    print("🔍 Debugging Backend Error")
    print("=" * 40)

    # Test with working scanner first
    working_file = "/Users/michaeldurante/Downloads/backside para b copy.py"

    with open(working_file, 'r') as f:
        working_code = f.read()

    print("✅ Testing with WORKING scanner:")

    working_response = requests.post(
        "http://localhost:8000/api/format/code",
        json={"code": working_code},
        timeout=30
    )

    if working_response.status_code == 200:
        working_data = working_response.json()
        print(f"   Status: {working_response.status_code}")
        print(f"   Success: {working_data.get('success')}")
        print(f"   Message: {working_data.get('message', 'No message')}")
        print(f"   Warnings: {working_data.get('warnings', [])}")
        print(f"   AI extraction: {bool(working_data.get('metadata', {}).get('ai_extraction'))}")
    else:
        print(f"   ❌ Working scanner failed: {working_response.status_code}")
        print(f"   Error: {working_response.text}")

    # Test with LC D2 scanner
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    print(f"\n❌ Testing with LC D2 scanner:")

    lc_d2_response = requests.post(
        "http://localhost:8000/api/format/code",
        json={"code": lc_d2_code},
        timeout=30
    )

    if lc_d2_response.status_code == 200:
        lc_d2_data = lc_d2_response.json()
        print(f"   Status: {lc_d2_response.status_code}")
        print(f"   Success: {lc_d2_data.get('success')}")
        print(f"   Message: {lc_d2_data.get('message', 'No message')}")
        print(f"   Warnings: {lc_d2_data.get('warnings', [])}")
        print(f"   AI extraction: {bool(lc_d2_data.get('metadata', {}).get('ai_extraction'))}")

        # Show full error if available
        if not lc_d2_data.get('success'):
            print(f"   📋 Full response: {json.dumps(lc_d2_data, indent=2)}")

    else:
        print(f"   ❌ LC D2 scanner failed: {lc_d2_response.status_code}")
        print(f"   Error: {lc_d2_response.text}")

if __name__ == "__main__":
    debug_backend_error()