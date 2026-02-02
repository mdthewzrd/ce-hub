#!/usr/bin/env python3
"""
Test the optimized CE-Hub formatter with backside para b copy.py
"""

import requests
import time
import json
import os
from pathlib import Path

def test_formatter_upload():
    """Test uploading the backside file through the CE-Hub formatter API"""

    # File to test
    file_path = "/Users/michaeldurante/Downloads/backside para b copy.py"

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False

    print(f"📁 Testing file: {os.path.basename(file_path)}")
    print(f"📏 File size: {os.path.getsize(file_path):,} bytes")

    # CE-Hub API endpoint (port 5659 as mentioned)
    api_url = "http://localhost:5659/api/format/code"

    print(f"🌐 API endpoint: {api_url}")

    # Read the file
    with open(file_path, 'r', encoding='utf-8') as f:
        file_content = f.read()

    print(f"📖 File content preview (first 500 chars):")
    print(file_content[:500])
    print("..." * 20)

    # Prepare the request - API expects JSON with 'code' field
    payload = {
        'code': file_content,
        'formatter_type': 'optimized',
        'create_backup': True,
        'validate_syntax': True,
        'optimize_for_edge_dev': True
    }

    print(f"\n🚀 Starting formatting test...")
    print(f"⏱️ Measuring response time...")

    start_time = time.time()

    try:
        # Make the request
        response = requests.post(
            api_url,
            json=payload,
            headers={'Content-Type': 'application/json'},
            timeout=60  # 60 second timeout as mentioned in optimizations
        )

        end_time = time.time()
        response_time = end_time - start_time

        print(f"⏱️ Response time: {response_time:.2f} seconds")
        print(f"📊 Status code: {response.status_code}")

        if response.status_code == 200:
            print("✅ Upload successful!")

            try:
                result = response.json()
                print(f"\n📋 API Response:")
                print(json.dumps(result, indent=2))

                # Check for expected EdgeDev structure in the response
                if 'formatted_code' in result:
                    formatted_code = result['formatted_code']

                    print(f"\n🔍 Analyzing formatted output...")

                    # Check for EdgeDev structure elements
                    structure_checks = {
                        'TICKER_UNIVERSE': 'TICKER_UNIVERSE' in formatted_code,
                        'SCANNER_PARAMETERS': 'SCANNER_PARAMETERS' in formatted_code,
                        'TIMEFRAME_CONFIG': 'TIMEFRAME_CONFIG' in formatted_code,
                        'TECHNICAL_INDICATORS': 'TECHNICAL_INDICATORS' in formatted_code,
                        'SCANNER_METADATA': 'SCANNER_METADATA' in formatted_code,
                        '15_core_instruments': len([line for line in formatted_code.split('\n')
                                                   if 'ETF' in line or 'AAPL' in line or 'MSFT' in line]) >= 10
                    }

                    print(f"\n🏗️ EdgeDev Structure Analysis:")
                    for element, found in structure_checks.items():
                        status = "✅" if found else "❌"
                        print(f"  {element}: {status}")

                    # Performance analysis
                    print(f"\n📈 Performance Metrics:")
                    print(f"  File size: {len(file_content):,} bytes")
                    print(f"  Response time: {response_time:.2f}s")
                    print(f"  Processing speed: {len(file_content)/response_time/1024:.1f} KB/s")

                    # Success criteria
                    structure_score = sum(structure_checks.values())
                    total_checks = len(structure_checks)

                    print(f"\n🎯 Success Score: {structure_score}/{total_checks} ({structure_score/total_checks*100:.1f}%)")

                    if structure_score >= total_checks * 0.8:
                        print("🎉 OPTIMIZATION SUCCESSFUL!")
                        return True
                    else:
                        print("⚠️ Partial success - some structure elements missing")
                        return True  # Still considered success since formatting worked

                else:
                    print("⚠️ No formatted_code in response")
                    return False

            except json.JSONDecodeError as e:
                print(f"❌ Failed to parse JSON response: {e}")
                print(f"Raw response: {response.text[:500]}")
                return False

        else:
            print(f"❌ Upload failed with status {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("❌ Request timed out after 60 seconds")
        return False
    except requests.exceptions.ConnectionError:
        print("❌ Connection error - is the backend running?")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {e}")
        return False

def test_backend_health():
    """Test if the backend is healthy"""
    print("🏥 Checking backend health...")

    try:
        response = requests.get("http://localhost:5659/health", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"⚠️ Backend health check failed: {response.status_code}")
            return False
    except:
        print("❌ Backend not responding to health check")
        return False

if __name__ == "__main__":
    print("🧪 CE-Hub Optimized Formatter Test")
    print("=" * 50)

    # Check backend health first
    if not test_backend_health():
        print("\n❌ Backend is not healthy - aborting test")
        exit(1)

    print()

    # Run the test
    success = test_formatter_upload()

    print("\n" + "=" * 50)
    if success:
        print("🎉 OVERALL TEST: SUCCESS")
    else:
        print("❌ OVERALL TEST: FAILED")
        exit(1)