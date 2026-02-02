#!/usr/bin/env python3
"""
Test all scanner files for parameter extraction and formatting
"""
import requests
import json
import time
import sys

def test_scanner_file(file_path, scanner_name):
    """Test a single scanner file"""
    print(f"\n🧪 Testing {scanner_name}")
    print("=" * 60)

    try:
        # Read the scanner code
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📁 Loaded code: {len(code)} characters")

        # Test with the formatting API
        request_data = {
            "code": code,
            "options": {
                "enableMultiprocessing": True,
                "enableAsyncPatterns": True,
                "addTradingPackages": True,
                "standardizeOutput": True,
                "optimizePerformance": True,
                "includeLogging": True,
                "preserveParameterIntegrity": True,
                "enhanceTickerUniverse": True
            }
        }

        print("🚀 Calling formatting API...")
        response = requests.post(
            'http://localhost:8000/api/format/code',
            json=request_data,
            timeout=120
        )

        print(f"📊 Response status: {response.status_code}")

        if response.status_code == 429:
            print("⏰ Rate limited - waiting 30 seconds...")
            time.sleep(30)
            # Retry once
            response = requests.post(
                'http://localhost:8000/api/format/code',
                json=request_data,
                timeout=120
            )
            print(f"📊 Retry response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print(f"✅ Success: {result.get('success', 'N/A')}")
            print(f"🔍 Scanner Type: {result.get('scanner_type', 'N/A')}")

            if 'metadata' in result:
                metadata = result['metadata']
                print(f"📊 Parameter Count: {metadata.get('parameter_count', 'N/A')}")

                if 'parameters' in metadata:
                    params = metadata['parameters']
                    print(f"🎯 PARAMETERS EXTRACTED ({len(params)}):")
                    for param, value in list(params.items())[:10]:  # Show first 10
                        print(f"  {param}: {value}")
                    if len(params) > 10:
                        print(f"  ... and {len(params) - 10} more parameters")
                else:
                    print("❌ No parameters found in metadata")

            if result.get('warnings'):
                print(f"⚠️ Warnings: {result['warnings']}")

            return {
                'success': True,
                'scanner_type': result.get('scanner_type'),
                'parameter_count': result.get('metadata', {}).get('parameter_count', 0),
                'parameters': result.get('metadata', {}).get('parameters', {})
            }
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")
            return {'success': False, 'error': f"HTTP {response.status_code}"}

    except Exception as e:
        print(f"❌ Exception: {e}")
        return {'success': False, 'error': str(e)}

def main():
    """Test all scanner files"""
    scanners = [
        ('/Users/michaeldurante/Downloads/backside para A+ copy.py', 'Backside Para A+ Scanner'),
        ('/Users/michaeldurante/Downloads/half A+ scan copy.py', 'Half A+ Scanner Copy'),
        ('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'LC D2 Scanner'),
    ]

    results = {}

    print("🔧 Testing All Scanner Files for Parameter Extraction")
    print("=" * 70)

    for file_path, scanner_name in scanners:
        try:
            result = test_scanner_file(file_path, scanner_name)
            results[scanner_name] = result

            # Wait between requests to avoid rate limiting
            print("⏱️ Waiting 10 seconds to avoid rate limiting...")
            time.sleep(10)

        except Exception as e:
            print(f"❌ Failed to test {scanner_name}: {e}")
            results[scanner_name] = {'success': False, 'error': str(e)}

    # Summary
    print("\n📋 SUMMARY RESULTS")
    print("=" * 50)

    for scanner_name, result in results.items():
        if result['success']:
            print(f"✅ {scanner_name}:")
            print(f"   Scanner Type: {result.get('scanner_type', 'Unknown')}")
            print(f"   Parameters: {result.get('parameter_count', 0)}")
        else:
            print(f"❌ {scanner_name}: {result.get('error', 'Unknown error')}")

    # Count successes
    successful = sum(1 for r in results.values() if r['success'])
    total = len(results)

    print(f"\n🎯 Final Result: {successful}/{total} scanners processed successfully")

    if successful == total:
        print("🎉 All scanners work perfectly!")
    else:
        print("⚠️ Some scanners need attention")

if __name__ == "__main__":
    main()