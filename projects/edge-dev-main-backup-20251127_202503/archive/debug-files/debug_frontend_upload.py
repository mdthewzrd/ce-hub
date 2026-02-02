#!/usr/bin/env python3
"""
🔍 Debug Frontend Upload Process
Test the exact same process the frontend uses to understand parameter detection failure
"""

import requests
import json

def test_frontend_upload_process():
    """
    Simulate the exact frontend upload process
    """
    print("🔍 DEBUGGING FRONTEND UPLOAD PROCESS")
    print("=" * 80)

    # Load the LC D2 scanner file (same one user is uploading)
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code_content = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(code_content)} characters")

        # Step 1: Test /api/format/code endpoint (what I was testing)
        print(f"\n🔧 STEP 1: Testing /api/format/code endpoint...")

        format_data = {
            "code": code_content
        }

        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if format_response.status_code == 200:
            format_result = format_response.json()
            print(f"✅ /api/format/code successful")
            print(f"📊 Scanner type: {format_result.get('scanner_type')}")
            print(f"📊 Metadata keys: {list(format_result.get('metadata', {}).keys())}")

            metadata = format_result.get('metadata', {})
            parameters = metadata.get('parameters', {})
            print(f"📊 Parameter count: {len(parameters)}")

            if parameters:
                print(f"📊 Sample parameters:")
                for i, (key, value) in enumerate(list(parameters.items())[:5], 1):
                    print(f"   {i}. {key}: {value}")

            # Check what scanner type the frontend would see
            frontend_scanner_type = format_result.get('scanner_type') or 'Unknown'
            print(f"🎯 Frontend would see scanner type: '{frontend_scanner_type}'")

            # Step 2: Test what frontend would do with this scanner type
            scanner_endpoint_mapping = {
                'A+': '/api/scanner/a-plus',
                'LC': '/api/scanner/lc',
                'lc': '/api/scanner/lc',  # Try both cases
                'Custom': '/api/scanner/custom',
                'Unknown': '/api/scanner/unknown'
            }

            expected_endpoint = scanner_endpoint_mapping.get(frontend_scanner_type, '/api/scanner/unknown')
            print(f"🎯 Frontend would call: {expected_endpoint}")

            # Step 3: Test calling that endpoint
            print(f"\n🔧 STEP 2: Testing frontend endpoint call...")

            try:
                endpoint_response = requests.get(expected_endpoint, timeout=10)
                print(f"📊 Endpoint {expected_endpoint} status: {endpoint_response.status_code}")
                if endpoint_response.status_code != 200:
                    print(f"❌ Endpoint response: {endpoint_response.text}")
            except Exception as e:
                print(f"❌ Endpoint call failed: {e}")

        else:
            print(f"❌ /api/format/code failed: {format_response.status_code}")
            print(f"Response: {format_response.text}")

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        print("Using a simple test scanner instead...")

        # Fallback test with simple scanner
        simple_scanner = '''
import pandas as pd

# Scanner parameters
atr_mult = 4
vol_mult = 2

def scan_symbol(symbol, start_date, end_date):
    return pd.DataFrame([{
        'Ticker': symbol,
        'Date': '2024-01-01',
        'scanner_type': 'lc'
    }])

SYMBOLS = ['AAPL', 'MSFT']
'''

        format_data = {"code": simple_scanner}
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if format_response.status_code == 200:
            result = format_response.json()
            print(f"✅ Simple scanner test:")
            print(f"📊 Scanner type: {result.get('scanner_type')}")
            print(f"📊 Parameters: {result.get('metadata', {}).get('parameters', {})}")

    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    test_frontend_upload_process()