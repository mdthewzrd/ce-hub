#!/usr/bin/env python3
"""
Test the half A+ scan file parameter extraction issue
"""
import json
import requests

# Read the actual scan file
with open('/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py', 'r') as f:
    scan_code = f.read()

print(f"📁 Loaded scan code: {len(scan_code)} characters")
print("🧪 Testing parameter extraction with formatting API...")

# Prepare the request
request_data = {
    "code": scan_code,
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

# Test the formatting
try:
    print("🚀 Calling formatting API...")
    response = requests.post(
        'http://localhost:8000/api/format/code',
        json=request_data,
        timeout=120
    )

    print(f"📊 Response status: {response.status_code}")

    if response.status_code == 200:
        result = response.json()

        print(f"✅ Success: {result.get('success', 'N/A')}")
        print(f"📝 Scanner Name: {result.get('scanner_name', 'N/A')}")
        print(f"🔍 Scanner Type: {result.get('scanner_type', 'N/A')}")

        if 'metadata' in result:
            metadata = result['metadata']
            print(f"\n🔍 Metadata found:")
            print(f"  Parameter Count: {metadata.get('parameter_count', 'N/A')}")
            print(f"  Integrity Hash: {metadata.get('integrity_hash', 'N/A')}")

            # Check if parameters were extracted
            if 'parameters' in metadata:
                params = metadata['parameters']
                print(f"\n🎯 PARAMETERS EXTRACTED ({len(params)}): ✅")
                for param, value in params.items():
                    print(f"  {param}: {value}")
            else:
                print(f"\n❌ NO PARAMETERS FOUND IN METADATA")
                print(f"Available metadata keys: {list(metadata.keys())}")
        else:
            print(f"\n❌ NO METADATA FOUND")
            print(f"Available result keys: {list(result.keys())}")

        if result.get('warnings'):
            print(f"\n⚠️ Warnings: {result['warnings']}")

        if result.get('errors'):
            print(f"\n🚨 Errors: {result['errors']}")

    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response text: {response.text}")

except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()