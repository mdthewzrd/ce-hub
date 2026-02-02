#!/usr/bin/env python3
"""
Test Universal Scanner Engine API with Backside Para B scanner
This tests the USE system to ensure it doesn't get stuck in the analyzer
"""

import requests
import json
import time
import asyncio
import websockets
from datetime import datetime

# Read the Backside Para B scanner code
with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
    scanner_code = f.read()

# API endpoints
BASE_URL = "http://localhost:8000"
UNIVERSAL_API = f"{BASE_URL}/api/universal"

def test_universal_scanner_execution():
    """Test the Universal Scanner Engine execution"""
    print("🚀 Testing Universal Scanner Engine with Backside Para B scanner...")
    print(f"📅 Using current 2025 data")
    print(f"🔧 API URL: {UNIVERSAL_API}")
    print()

    # Prepare the request
    scan_request = {
        "filename": "backside_para_b_copy.py",
        "code": scanner_code,
        "scan_date": "2025-11-06",
        "user_params": None,
        "priority": 3
    }

    try:
        # 1. Test system status first
        print("1️⃣ Checking Universal Scanner Engine system status...")
        status_response = requests.get(f"{UNIVERSAL_API}/system/status", timeout=10)
        if status_response.status_code == 200:
            print("   ✅ Universal Scanner Engine system is online")
            status_data = status_response.json()
            print(f"   📊 Components: {len(status_data.get('components', []))}")
        else:
            print(f"   ❌ System status check failed: {status_response.status_code}")
            return False

        # 2. Submit scanner for execution
        print("2️⃣ Submitting Backside Para B scanner to Universal Scanner Engine...")
        execute_response = requests.post(
            f"{UNIVERSAL_API}/scan/execute",
            json=scan_request,
            timeout=30
        )

        if execute_response.status_code != 200:
            print(f"   ❌ Scanner submission failed: {execute_response.status_code}")
            print(f"   📄 Response: {execute_response.text}")
            return False

        execution_data = execute_response.json()
        scanner_id = execution_data.get("scanner_id")
        print(f"   ✅ Scanner submitted successfully")
        print(f"   🆔 Scanner ID: {scanner_id}")
        print(f"   📊 Status: {execution_data.get('execution_status')}")
        print(f"   💬 Message: {execution_data.get('message')}")

        # 3. Monitor execution progress
        print("3️⃣ Monitoring scanner execution progress...")
        max_wait_time = 180  # 3 minutes max
        start_time = time.time()

        while time.time() - start_time < max_wait_time:
            # Check status
            status_response = requests.get(f"{UNIVERSAL_API}/scan/status/{scanner_id}", timeout=10)

            if status_response.status_code == 200:
                status_data = status_response.json()
                status = status_data.get("status", "unknown")
                phase = status_data.get("phase", "unknown")
                progress = status_data.get("progress_percent", 0)
                symbols_processed = status_data.get("symbols_processed", 0)

                print(f"   📊 Status: {status} | Phase: {phase} | Progress: {progress}% | Symbols: {symbols_processed}")

                # Check if completed
                if status in ['completed', 'failed']:
                    print(f"   🎯 Scanner execution {status}!")

                    # Get results if completed
                    if status == 'completed':
                        print("4️⃣ Retrieving scan results...")
                        results_response = requests.get(f"{UNIVERSAL_API}/scan/results/{scanner_id}", timeout=10)
                        if results_response.status_code == 200:
                            results_data = results_response.json()
                            print(f"   ✅ Results retrieved successfully")
                            print(f"   📊 Total results: {results_data.get('total_found', 0)}")
                            print(f"   ⏱️ Execution time: {results_data.get('execution_time', 0):.2f} seconds")

                            # Print classification if available
                            classification = results_data.get('classification')
                            if classification:
                                print(f"   🏷️ Scanner type: {classification.get('scanner_type', 'Unknown')}")
                                print(f"   🎯 Confidence: {classification.get('confidence', 0):.2f}")

                            return True
                        else:
                            print(f"   ❌ Failed to retrieve results: {results_response.status_code}")
                            return False
                    else:
                        print(f"   ❌ Scanner execution failed")
                        return False

            elif status_response.status_code == 404:
                print(f"   ❌ Scanner {scanner_id} not found")
                return False
            else:
                print(f"   ⚠️ Status check failed: {status_response.status_code}")

            time.sleep(2)  # Wait 2 seconds before checking again

        print(f"   ⏰ Timeout reached ({max_wait_time}s). Scanner may still be running.")
        return False

    except requests.exceptions.RequestException as e:
        print(f"❌ API request error: {str(e)}")
        return False
    except Exception as e:
        print(f"❌ Unexpected error: {str(e)}")
        return False

def test_capabilities_endpoint():
    """Test the capabilities endpoint"""
    print("🔍 Testing Universal Scanner Engine capabilities...")
    try:
        response = requests.get(f"{UNIVERSAL_API}/capabilities", timeout=10)
        if response.status_code == 200:
            capabilities = response.json()
            print("   ✅ Capabilities retrieved successfully")
            print(f"   🚀 Engine: {capabilities.get('engine_name')} v{capabilities.get('version')}")

            # Print supported scanner types
            scanners = capabilities.get('supported_scanners', {})
            print("   📊 Supported scanner types:")
            for scanner_type, info in scanners.items():
                print(f"      • {scanner_type.title()}: {info.get('description')}")
                print(f"        - Runtime: {info.get('typical_runtime')}")
                print(f"        - Memory: {info.get('memory_usage')}")

            return True
        else:
            print(f"   ❌ Capabilities request failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"   ❌ Error testing capabilities: {str(e)}")
        return False

if __name__ == "__main__":
    print("🧪 Universal Scanner Engine API Test")
    print("=" * 60)
    print()

    # Test 1: Capabilities
    test_capabilities_endpoint()
    print()

    # Test 2: Scanner execution
    success = test_universal_scanner_execution()

    print()
    print("=" * 60)
    if success:
        print("✅ Universal Scanner Engine test PASSED!")
        print("🎯 Scanners are no longer getting stuck in the analyzer")
    else:
        print("❌ Universal Scanner Engine test FAILED")
        print("⚠️ Need to investigate further")
    print("=" * 60)