#!/usr/bin/env python3
"""
Test script to verify the parameter extraction fix is working
"""

import requests
import json

def test_parameter_extraction():
    """Test the formatter with a simple P dictionary"""

    # Simple test code with exactly 3 parameters
    test_code = '''P = {
    "price_min": 8.0,
    "adv20_min_usd": 30000000,
    "abs_lookback_days": 1000
}

def scan_symbol():
    pass
'''

    # Send to formatter
    response = requests.post(
        "http://localhost:5659/api/format/code",
        json={
            "code": test_code,
            "requirements": {
                "full_universe": True,
                "max_threading": True,
                "polygon_api": True
            }
        }
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ Formatter Response Success!")
        print(f"📊 Parameter Count: {result.get('parameter_count', 'N/A')}")
        print(f"🎯 Scanner Type: {result.get('scanner_type', 'N/A')}")
        print(f"✅ Integrity: {result.get('integrity_verified', 'N/A')}")

        # Show parameter details if available
        if 'parameters' in result:
            print(f"\n📋 Parameters Found:")
            for param in result['parameters'][:5]:  # Show first 5
                print(f"   - {param}")

        return result
    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
        return None

if __name__ == "__main__":
    test_parameter_extraction()