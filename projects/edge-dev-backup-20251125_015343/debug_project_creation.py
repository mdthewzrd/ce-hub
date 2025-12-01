#!/usr/bin/env python3
"""
Debug script to check project creation endpoint
"""

import requests
import json

def debug_project_creation():
    """Debug the project creation process"""

    print("🔍 Debugging project creation endpoint...")

    # Test scanner code
    test_scanner_code = """
def scan_stocks(data):
    results = []
    for stock in data:
        if stock.get('gap_percent', 0) > 2.0:
            results.append({
                'symbol': stock.get('ticker', 'TEST'),
                'signal': 'BUY',
                'confidence': 80
            })
    return results
"""

    # Test the format endpoint first
    print("📝 Step 1: Testing format endpoint...")
    format_payload = {"code": test_scanner_code}

    try:
        format_response = requests.post(
            'http://localhost:5659/api/format/code',
            json=format_payload,
            timeout=10
        )
        print(f"Format status: {format_response.status_code}")
        print(f"Format response: {format_response.text[:500]}...")

        if format_response.status_code == 200:
            format_result = format_response.json()
            formatted_code = format_result.get('formattedCode', test_scanner_code)
            print(f"✅ Formatting successful")
        else:
            print(f"❌ Formatting failed")
            return False

    except Exception as e:
        print(f"❌ Format request error: {e}")
        return False

    # Test project creation
    print("\n📦 Step 2: Testing project creation...")
    project_payload = {
        "name": "Debug Test Scanner",
        "description": "Test scanner for debugging",
        "formattedCode": formatted_code,  # IMPORTANT: Must be 'formattedCode', not 'code'
        "scanner_type": "LC Backside Scanner",
        "parameters": {
            "min_price": 5.0,
            "min_volume": 1000000,
            "min_gap": 2.0
        }
    }

    try:
        create_response = requests.post(
            'http://localhost:5659/api/projects',
            json=project_payload,
            timeout=10
        )
        print(f"Create status: {create_response.status_code}")
        print(f"Create headers: {dict(create_response.headers)}")
        print(f"Create response: {create_response.text}")

        if create_response.status_code == 200:
            create_result = create_response.json()
            print(f"✅ Project creation result: {json.dumps(create_result, indent=2)}")
            return create_result
        else:
            print(f"❌ Project creation failed")
            return False

    except Exception as e:
        print(f"❌ Create request error: {e}")
        return False

if __name__ == "__main__":
    debug_project_creation()