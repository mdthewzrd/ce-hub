#!/usr/bin/env python3

import requests
import json

def test_format_api():
    """Test the format API directly"""

    base_url = "http://localhost:5659"

    # Simple test code
    test_code = """
# LC Backside Scanner Test
min_price = 5.0
min_volume = 1000000
min_gap = 2.0

def scan_stocks(data):
    results = []
    for symbol, stock_data in data.items():
        if len(stock_data) > 20:
            close = stock_data['close']
            volume = stock_data['volume']
            if volume[-1] > min_volume:
                results.append({
                    'symbol': symbol,
                    'volume': volume[-1],
                    'signal': 'BUY'
                })
    return results
"""

    print("🧪 Testing Format API Directly")
    print("="*40)

    try:
        response = requests.post(f"{base_url}/api/format/code",
                               json={"code": test_code})

        print(f"Status Code: {response.status_code}")
        print(f"Headers: {dict(response.headers)}")
        print(f"Response Text: {response.text[:500]}...")

        if response.status_code == 200:
            try:
                result = response.json()
                print(f"JSON Response Keys: {list(result.keys())}")
                if 'formatted_code' in result:
                    print(f"Formatted Code Length: {len(result['formatted_code'])}")
                    print(f"First 200 chars: {result['formatted_code'][:200]}...")
                else:
                    print("No 'formatted_code' key in response")
            except json.JSONDecodeError as e:
                print(f"JSON Decode Error: {e}")

    except Exception as e:
        print(f"Request Error: {e}")

if __name__ == "__main__":
    test_format_api()