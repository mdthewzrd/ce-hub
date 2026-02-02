#!/usr/bin/env python3
"""
🧪 Test Backend API Parameter Extraction
==========================================

Test the actual backend API endpoint to see what's happening
with parameter extraction when uploading the problematic scanner.
"""

import requests
import json

def test_backend_api():
    """Test the backend API format endpoint with problematic scanner"""

    print("🧪 Testing Backend API Parameter Extraction")
    print("=" * 60)

    # Load the problematic scanner file
    problematic_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(problematic_file, 'r') as f:
            scanner_code = f.read()

        print(f"📄 Loaded scanner: {len(scanner_code)} characters")

        # Test the format endpoint
        api_url = "http://localhost:8000/api/format/code"

        payload = {
            "code": scanner_code
        }

        print(f"🔌 Calling API: {api_url}")
        print(f"📤 Payload size: {len(json.dumps(payload))} characters")

        response = requests.post(api_url, json=payload, timeout=30)

        print(f"📥 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()

            print("\n📊 API RESPONSE ANALYSIS:")
            print("=" * 40)

            # Check if response has the new AI extraction data
            if 'metadata' in result and 'ai_extraction' in result['metadata']:
                ai_data = result['metadata']['ai_extraction']
                print(f"✅ AI Extraction Found!")
                print(f"   📊 Total parameters: {ai_data['total_parameters']}")
                print(f"   🎯 Trading filters: {ai_data['trading_filters']}")
                print(f"   ⚙️ Config params: {ai_data['config_params']}")
                print(f"   🔧 Method: {ai_data['extraction_method']}")
                print(f"   ⏱️ Time: {ai_data['extraction_time']:.3f}s")
                print(f"   ✅ Success: {ai_data['success']}")

            else:
                print("❌ No AI extraction data found in response")

            # Check old parameter extraction
            if 'parameters' in result:
                old_params = result['parameters']
                print(f"📏 Old system parameters: {len(old_params)} found")
                if old_params:
                    print(f"   Sample: {list(old_params.keys())[:3]}")

            # Check overall result
            print(f"\n📋 Overall Result:")
            print(f"   Success: {result.get('success', 'Unknown')}")
            print(f"   Message: {result.get('message', 'No message')}")

            # Show metadata structure
            if 'metadata' in result:
                print(f"\n🔍 Metadata keys: {list(result['metadata'].keys())}")

        else:
            print(f"❌ API call failed: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backend_api()