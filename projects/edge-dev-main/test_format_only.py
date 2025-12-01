#!/usr/bin/env python3
"""
Test script for Backside B scanner formatting ONLY (no execution)
"""

import requests
import json
from datetime import datetime

# Read the backside B scanner code
with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
    scanner_code = f.read()

# Test the API endpoint with format-only request
def test_format_only():
    url = "http://localhost:5656/api/renata/chat"

    # Create format-only test message
    test_message = f"""Please format this backside B scanner code only (no execution):

```python
{scanner_code[:2000]}...
```

This is a backside B scanner. Please format it and preserve all parameters."""

    payload = {
        "message": test_message,
        "context": {
            "user_id": "test_format_only",
            "timestamp": datetime.now().isoformat()
        }
    }

    try:
        print("🧪 Testing Format-Only Request...")
        print(f"📊 Scanner code length: {len(scanner_code)} characters")
        print(f"🌐 API Endpoint: {url}")
        print("\n" + "="*60)

        response = requests.post(url, json=payload, timeout=30)

        print(f"📡 Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")
            print("\n📋 Response Analysis:")
            print(f"- Success: {result.get('success', False)}")
            print(f"- Type: {result.get('type', 'Unknown')}")

            # Check for GLM formatting indicators
            message = result.get('message', '')
            if 'GLM AI formatting successful' in message:
                print("✅ GLM AI formatting: SUCCESS")
            elif 'Local Formatting (GLM unavailable)' in message:
                print("⚠️ GLM AI formatting: FALLBACK TO LOCAL")
            else:
                print("❓ GLM AI formatting: UNCLEAR")

            # Check for scanner name detection
            if 'Backside B' in message or 'backside' in message.lower():
                print("✅ Scanner name detection: SUCCESS")
            else:
                print("❌ Scanner name detection: FAILED")

            # Check for parameter preservation
            if 'parameter' in message.lower() and ('preserv' in message.lower() or 'integrity' in message.lower()):
                print("✅ Parameter preservation: MENTIONED")
            else:
                print("❌ Parameter preservation: NOT MENTIONED")

            # Check for formatted code
            if result.get('data', {}).get('formattedCode'):
                formatted_code = result['data']['formattedCode']
                print(f"✅ Formatted code returned: {len(formatted_code)} characters")
            else:
                print("❌ Formatted code: NOT FOUND")

            print("\n" + "="*60)
            print("📄 Message Preview (first 500 chars):")
            print(message[:500] + "..." if len(message) > 500 else message)

        else:
            print(f"❌ API call failed with status {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Request timed out after 30 seconds")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the server running on port 5656?")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

# Test parameter extraction function
def test_parameter_extraction():
    print("\n" + "="*60)
    print("🧪 Testing Parameter Extraction...")

    # Simple parameter extraction test
    import re

    parameters = []
    assignments = re.findall(r'^([A-Z_][A-Z0-9_]*)\s*=\s*(.+)$', scanner_code, re.MULTILINE)

    for name, value in assignments:
        parameters.append({
            'name': name.strip(),
            'value': value.strip()
        })

    print(f"📊 Parameters found: {len(parameters)}")

    for i, param in enumerate(parameters[:10]):  # Show first 10
        print(f"{i+1:2d}. {param['name']}: {param['value']}")

    if len(parameters) > 10:
        print(f"    ... and {len(parameters) - 10} more parameters")

# Test scanner name detection
def test_scanner_detection():
    print("\n" + "="*60)
    print("🧪 Testing Scanner Name Detection...")

    code_lower = scanner_code.lower()

    # Check for backside B patterns
    if 'backside' in code_lower and 'para' in code_lower:
        print("✅ Backside B detection: SUCCESS (backside + para)")
    elif 'backside' in code_lower:
        print("✅ Backside detection: SUCCESS")
    else:
        print("❌ Backside detection: FAILED")

    # Check for specific patterns
    if 'daily_para_backside' in code_lower:
        print("✅ daily_para_backside: FOUND")

    if 'para b' in code_lower:
        print("✅ para b: FOUND")

    # Check file name patterns
    if 'backside para b' in code_lower:
        print("✅ 'backside para b' pattern: FOUND")

if __name__ == "__main__":
    # Test parameter extraction
    test_parameter_extraction()

    # Test scanner detection
    test_scanner_detection()

    # Test format-only request
    test_format_only()