#!/usr/bin/env python3
"""
Test script for Backside B scanner formatting with enhanced Renata service
"""

import requests
import json
from datetime import datetime

# Read the backside B scanner code
with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
    scanner_code = f.read()

# Test the API endpoint
def test_backside_b_formatting():
    url = "http://localhost:5656/api/renata/chat"

    # Create test message with the backside B scanner
    test_message = f"""Format and execute this backside B scanner from 1/1/25 to 11/1/25:

```python
{scanner_code}
```

Please preserve all parameters and execute the scan."""

    payload = {
        "message": test_message,
        "context": {
            "user_id": "test_user",
            "timestamp": datetime.now().isoformat()
        }
    }

    try:
        print("🧪 Testing Backside B Scanner Formatting...")
        print(f"📊 Scanner code length: {len(scanner_code)} characters")
        print(f"📅 Date range: 1/1/25 to 11/1/25")
        print(f"🌐 API Endpoint: {url}")
        print("\n" + "="*60)

        response = requests.post(url, json=payload, timeout=60)

        print(f"📡 Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ API call successful!")
            print("\n📋 Response Analysis:")
            print(f"- Success: {result.get('success', False)}")
            print(f"- Type: {result.get('type', 'Unknown')}")
            print(f"- Message Length: {len(result.get('message', ''))}")

            # Check for GLM formatting indicators
            message = result.get('message', '')
            if 'GLM AI formatting successful' in message:
                print("✅ GLM AI formatting: SUCCESS")
            elif 'Local Formatting (GLM unavailable)' in message:
                print("⚠️ GLM AI formatting: FALLBACK TO LOCAL")
            else:
                print("❓ GLM AI formatting: UNCLEAR")

            # Check for scanner name detection
            if 'Backside B' in message:
                print("✅ Scanner name detection: SUCCESS")
            else:
                print("❌ Scanner name detection: FAILED")

            # Check for parameter preservation
            if 'parameter' in message.lower() and 'preserv' in message.lower():
                print("✅ Parameter preservation: MENTIONED")
            else:
                print("❌ Parameter preservation: NOT MENTIONED")

            # Check for execution results
            if 'executionResults' in result.get('data', {}):
                execution_results = result['data'].get('executionResults', [])
                print(f"✅ Execution results: {len(execution_results)} results found")
            else:
                print("❌ Execution results: NOT FOUND")

            print("\n" + "="*60)
            print("📄 Full Response:")
            print(json.dumps(result, indent=2))

        else:
            print(f"❌ API call failed with status {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Request timed out after 60 seconds")
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the server running on port 5656?")
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")

def test_glm_api_directly():
    """Test GLM API directly to verify connectivity"""
    print("\n" + "="*60)
    print("🧪 Testing GLM API Directly...")

    glm_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    glm_headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY'
    }

    glm_payload = {
        'model': 'glm-4.5-flash',
        'messages': [
            {
                'role': 'system',
                'content': 'You are a helpful AI assistant. Respond briefly.'
            },
            {
                'role': 'user',
                'content': 'Say "GLM API is working" if you can read this.'
            }
        ],
        'temperature': 0.1,
        'max_tokens': 50
    }

    try:
        response = requests.post(glm_url, headers=glm_headers, json=glm_payload, timeout=30)
        print(f"📡 GLM API Response Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            print(f"✅ GLM API Direct Test: SUCCESS")
            print(f"📄 GLM Response: {content}")
        else:
            print(f"❌ GLM API Direct Test: FAILED")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ GLM API Direct Test Error: {str(e)}")

if __name__ == "__main__":
    # Test GLM API first
    test_glm_api_directly()

    # Then test the backside B formatting
    test_backside_b_formatting()