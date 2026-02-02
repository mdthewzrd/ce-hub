#!/usr/bin/env python3
"""
Test the actual half A+ scan file with detailed response analysis
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

        # Print the full response structure for debugging
        print(f"\n🔍 FULL RESPONSE STRUCTURE:")
        print(json.dumps(result, indent=2, default=str)[:1000] + "..." if len(json.dumps(result, indent=2, default=str)) > 1000 else json.dumps(result, indent=2, default=str))

        print(f"\n✅ Success: {result.get('success', 'N/A')}")
        print(f"📊 Scanner Type: {result.get('scanner_type', 'N/A')}")
        print(f"📝 Scanner Name: {result.get('scanner_name', 'N/A')}")

        if 'metadata' in result:
            print(f"🔍 Parameter Count: {result['metadata'].get('parameter_count', 'N/A')}")
            print(f"🔐 Integrity Hash: {result['metadata'].get('integrity_hash', 'N/A')}")

            # Display extracted parameters
            if 'parameters' in result['metadata']:
                print(f"\n🎯 EXTRACTED PARAMETERS ({len(result['metadata']['parameters'])}):")
                for param, value in result['metadata']['parameters'].items():
                    print(f"  {param}: {value}")

        print(f"\n🎯 Integrity Verified: {result.get('integrity_verified', 'N/A')}")

        if result.get('warnings'):
            print(f"\n⚠️ Warnings: {result['warnings']}")

        # Save formatted code to analyze
        if 'formatted_code' in result:
            with open('/Users/michaeldurante/ai dev/ce-hub/formatted_half_a_plus_actual.py', 'w') as f:
                f.write(result['formatted_code'])
            print("\n💾 Formatted code saved to formatted_half_a_plus_actual.py")

            # Show first few lines of formatted code
            formatted_lines = result['formatted_code'].split('\n')[:20]
            print(f"\n📄 First 20 lines of formatted code:")
            for i, line in enumerate(formatted_lines, 1):
                print(f"{i:2d}: {line}")

    else:
        print(f"❌ Error: {response.status_code}")
        print(response.text)

except Exception as e:
    print(f"❌ Exception: {e}")
    import traceback
    traceback.print_exc()