#!/usr/bin/env python3
"""
Test the actual half A+ scan file with the formatting API
"""
import json
import requests

# Read the actual scan file
with open('/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py', 'r') as f:
    scan_code = f.read()

print(f"📁 Loaded scan code: {len(scan_code)} characters")
print("🧪 Testing with formatting API...")

# Prepare the request with comprehensive options
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
    response = requests.post(
        'http://localhost:8000/api/format/code',
        json=request_data,
        timeout=120  # Longer timeout for complex file
    )

    if response.status_code == 200:
        result = response.json()
        print(f"✅ Success: {result['success']}")
        print(f"📊 Scanner Type: {result['scanner_type']}")
        print(f"📝 Scanner Name: {result['scanner_name']}")
        print(f"🔍 Parameter Count: {result['metadata']['parameter_count']}")
        print(f"🎯 Integrity Verified: {result['integrity_verified']}")
        print(f"🔐 Integrity Hash: {result['metadata']['integrity_hash']}")

        if result['warnings']:
            print(f"⚠️ Warnings: {result['warnings']}")

        # Save formatted code
        with open('/Users/michaeldurante/ai dev/ce-hub/formatted_half_a_plus_actual.py', 'w') as f:
            f.write(result['formatted_code'])
        print("💾 Formatted code saved to formatted_half_a_plus_actual.py")

        # Display extracted parameters for verification
        if 'parameters' in result['metadata']:
            print("\n🎯 EXTRACTED PARAMETERS:")
            for param, value in result['metadata']['parameters'].items():
                print(f"  {param}: {value}")

        print(f"\n📈 Enhanced features added:")
        print(f"  - Multiprocessing: {request_data['options']['enableMultiprocessing']}")
        print(f"  - Async Patterns: {request_data['options']['enableAsyncPatterns']}")
        print(f"  - Trading Packages: {request_data['options']['addTradingPackages']}")
        print(f"  - Enhanced Ticker Universe: {request_data['options']['enhanceTickerUniverse']}")

    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Exception: {e}")