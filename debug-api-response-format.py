#!/usr/bin/env python3
"""
Debug the actual API response format to understand why results aren't returned properly
"""

import requests
import json

def test_api_response_format():
    """Test what the API actually returns vs what we expect"""
    print("🔍 DEBUGGING API RESPONSE FORMAT")
    print("=" * 50)

    # Read the backside B code
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            backside_code = f.read()
    except Exception as e:
        print(f"❌ Failed to read backside B code: {e}")
        return False

    # Test with the exact same payload that's working in the backend logs
    payload = {
        "uploaded_code": backside_code,
        "scanner_type": "uploaded",
        "date_range": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-01"
        },
        "parallel_execution": True,
        "timeout_seconds": 300
    }

    print(f"📡 Sending request to /api/scan/execute...")
    print(f"📝 Code length: {len(backside_code)} characters")

    try:
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=payload,
            timeout=320
        )

        print(f"📊 Response Status: {response.status_code}")
        print(f"📊 Response Headers: {dict(response.headers)}")

        if not response.ok:
            print(f"❌ Request failed: {response.text}")
            return False

        # Parse the response
        try:
            result = response.json()
        except json.JSONDecodeError as e:
            print(f"❌ Failed to parse JSON: {e}")
            print(f"Raw response: {response.text[:1000]}")
            return False

        print(f"\n📊 FULL API RESPONSE:")
        print("=" * 40)
        print(json.dumps(result, indent=2))
        print("=" * 40)

        # Analyze the response structure
        print(f"\n🔍 RESPONSE ANALYSIS:")
        print(f"✅ Success: {result.get('success')}")
        print(f"📊 Status: {result.get('status')}")
        print(f"📊 Message: {result.get('message')}")
        print(f"📊 Total Found: {result.get('total_found', 'Not present')}")
        print(f"📊 Results Field: {'results' in result}")

        if 'results' in result:
            results = result['results']
            print(f"📊 Results Type: {type(results)}")
            print(f"📊 Results Length: {len(results) if isinstance(results, list) else 'Not a list'}")

            if isinstance(results, list) and len(results) > 0:
                print(f"✅ Found {len(results)} results!")
                print(f"📄 First result sample: {json.dumps(results[0], indent=2)}")
                return True
            elif isinstance(results, str) and results.strip():
                print(f"📝 Results is a string: {results[:200]}...")
                # Try to parse if it might be JSON
                try:
                    parsed = json.loads(results)
                    print(f"✅ Parsed results from string: {len(parsed) if isinstance(parsed, list) else 'Not a list'}")
                    return True
                except:
                    print(f"❌ Results string is not valid JSON")
            else:
                print(f"❌ Results is empty or not a list: {repr(results)}")
        else:
            print(f"❌ No 'results' field in response")
            print(f"📋 Available fields: {list(result.keys())}")

        # Check for other potential result fields
        for field in ['data', 'signals', 'trades', 'output', 'scan_results']:
            if field in result:
                print(f"🔍 Found alternative field '{field}': {type(result[field])}")

        return False

    except Exception as e:
        print(f"❌ Request failed: {e}")
        return False

def test_scan_status_endpoint():
    """Test the scan status endpoint to see if it has results"""
    print("\n🔍 TESTING SCAN STATUS ENDPOINT")

    try:
        # Get a recent scan ID from the backend
        response = requests.get('http://localhost:8000/api/projects')
        if response.ok:
            projects = response.json()
            print(f"📊 Found {len(projects)} projects")

        # Try checking a generic status endpoint
        status_response = requests.get('http://localhost:8000/api/scan/status/scan_20251205_104652_8ea8e7ae')
        if status_response.ok:
            status_result = status_response.json()
            print(f"📊 Status response: {json.dumps(status_result, indent=2)}")
        else:
            print(f"❌ Status endpoint returned: {status_response.status_code}")

    except Exception as e:
        print(f"❌ Status test failed: {e}")

def main():
    print("🚀 STARTING API RESPONSE FORMAT DEBUG")
    print("=" * 60)

    success = test_api_response_format()

    if not success:
        test_scan_status_endpoint()
        print(f"\n❌ API RESPONSE ISSUE CONFIRMED")
        print(f"💡 The API response format doesn't match frontend expectations")
    else:
        print(f"\n✅ API RESPONSE WORKS!")
        print(f"💡 The issue might be in frontend response parsing")

if __name__ == "__main__":
    main()