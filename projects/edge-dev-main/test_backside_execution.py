#!/usr/bin/env python3
"""
Direct test of enhanced Renata service with backside scanner
This bypasses JSON parsing issues and tests the full pipeline
"""

import sys
import os
import requests
import json

# Add the project root to path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src')

def test_enhanced_renata():
    """Test the enhanced Renata service with backside scanner"""

    # Read the backside scanner code
    with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
        backside_code = f.read()

    print("🚀 Testing Enhanced Renata with Backside Scanner")
    print(f"📊 Code length: {len(backside_code)} characters")
    print(f"📅 Date range: 2025-01-01 to 2025-11-01")
    print(f"🔑 API Key: Fm7brz4s23eSocDErnL68cE7wspz2K1I")
    print()

    # Prepare the request
    request_data = {
        "type": "format-execute",
        "code": backside_code,
        "filename": "backside_para_b_copy.py",
        "executionParams": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-01",
            "use_real_scan": True,
            "scanner_type": "custom",
            "api_key": "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
        },
        "metadata": {
            "original_type": "backside",
            "expected_symbols": 50,
            "parameter_count": 20
        }
    }

    try:
        print("🌐 Calling Enhanced Renata Service...")
        response = requests.post(
            "http://localhost:5656/api/enhanced/renata/process",
            json=request_data,
            headers={"Content-Type": "application/json"},
            timeout=300  # 5 minute timeout
        )

        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Enhanced Renata processed the backside scanner")
            print(f"📈 Results found: {len(result.get('data', {}).get('executionResults', []))}")
            print(f"🔧 Scanner type: {result.get('data', {}).get('scannerType', 'unknown')}")
            print(f"⚡ Execution time: {result.get('data', {}).get('stats', {}).get('executionTime', 'unknown')}")

            # Show first few results if available
            execution_results = result.get('data', {}).get('executionResults', [])
            if execution_results:
                print(f"\n📊 First 3 results:")
                for i, res in enumerate(execution_results[:3]):
                    print(f"  {i+1}. {res}")

        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("⏰ Request timed out (5 minutes) - processing may still be running")
    except Exception as e:
        print(f"❌ Exception occurred: {e}")

if __name__ == "__main__":
    test_enhanced_renata()