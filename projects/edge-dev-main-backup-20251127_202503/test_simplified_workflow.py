#!/usr/bin/env python3
"""
Simplified Workflow Test - Focus on Parameter Preview and Scanner Execution
"""

import requests
import json
import time

# Configuration
BACKEND_URL = "http://localhost:5659"
SCANNER_FILE = "/Users/michaeldurante/Downloads/backside para b copy.py"

def test_parameter_preview():
    """Test parameter preview functionality"""
    print("🔍 Testing Parameter Preview...")

    # Read the scanner file
    try:
        with open(SCANNER_FILE, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Scanner file loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to read scanner file: {e}")
        return False

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/scan/parameters/preview",
            json={"code": scanner_code},
            timeout=15
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Parameter preview successful")
            return True, result
        else:
            print(f"❌ Parameter preview failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Parameter preview request failed: {e}")
        return False, None

def test_scan_execution():
    """Test scanner execution with date range 1/1/25 to 11/1/25"""
    print("🔍 Testing Scanner Execution...")

    # Read the scanner file
    try:
        with open(SCANNER_FILE, 'r') as f:
            scanner_code = f.read()
    except Exception as e:
        print(f"❌ Failed to read scanner file: {e}")
        return False

    # Create scan request with specific date range
    scan_request = {
        "start_date": "2025-01-01",
        "end_date": "2025-11-01",
        "scanner_code": scanner_code,
        "scanner_name": "Backside Para B Test",
        "parameters": {
            "price_min": 8.0,
            "adv20_min_usd": 30000000,
            "gap_div_atr_min": 0.75,
            "d1_volume_min": 15000000,
            "trigger_mode": "D1_or_D2"
        }
    }

    try:
        response = requests.post(
            f"{BACKEND_URL}/api/scan/execute",
            json=scan_request,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ Scanner execution successful")
            return True, result
        else:
            print(f"❌ Scanner execution failed: {response.status_code}")
            print(f"   Response: {response.text}")
            return False, None
    except Exception as e:
        print(f"❌ Scanner execution request failed: {e}")
        return False, None

def main():
    """Run simplified workflow test"""
    print("🚀 Starting Simplified Workflow Test")
    print("=" * 50)

    # Test parameter preview
    preview_success, preview_result = test_parameter_preview()
    if not preview_success:
        print("❌ Parameter preview failed")
        return False

    print("\n" + "=" * 50)

    # Test scanner execution
    execution_success, execution_result = test_scan_execution()
    if not execution_success:
        print("❌ Scanner execution failed")
        return False

    print("\n" + "=" * 50)
    print("📊 Test Results Summary:")
    print(f"   Parameter Preview: ✅")
    print(f"   Scanner Execution: ✅")

    if preview_result and preview_result.get('parameters'):
        params = preview_result['parameters']
        print(f"\n🔍 Detected Scanner Parameters:")
        print(f"   Scan Type: {params.get('scanType', 'N/A')}")
        print(f"   Universe: {params.get('tickerUniverse', 'N/A')}")
        print(f"   Timeframe: {params.get('timeframe', 'N/A')}")
        print(f"   Filters: {len(params.get('filters', []))}")
        print(f"   Indicators: {len(params.get('indicators', []))}")

        if params.get('filters'):
            print(f"   Active Filters: {', '.join(params['filters'][:5])}")
        if params.get('indicators'):
            print(f"   Technical Indicators: {', '.join(params['indicators'][:5])}")

    if execution_result:
        print(f"\n📈 Scanner Execution Results:")
        print(f"   Execution ID: {execution_result.get('execution_id', 'N/A')}")
        print(f"   Status: {execution_result.get('status', 'N/A')}")
        print(f"   Results Found: {execution_result.get('result_count', 0)}")
        print(f"   Date Range: 2025-01-01 to 2025-11-01")

        if execution_result.get('results'):
            results = execution_result['results'][:3]  # Show first 3 results
            print(f"\n   Sample Results:")
            for i, result in enumerate(results):
                print(f"   {i+1}. {result['ticker']} - {result['date']} - Gap: {result.get('gap_percent', 'N/A')}% - Score: {result.get('score', 'N/A')}")

    print("\n🎯 Workflow Test Status: PASSED ✅")
    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)