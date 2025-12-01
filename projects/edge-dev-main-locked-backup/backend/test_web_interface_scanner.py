#!/usr/bin/env python3
"""
Test the scanner through the web interface to verify the enhanced date filtering works
"""
import requests
import json
import time

def test_web_interface():
    print("🔍 Testing Backside Para B scanner through web interface...")

    # Read the Backside Para B scanner code
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ Scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load scanner code: {e}")
        return

    # Test scan execution endpoint
    scan_request = {
        'start_date': '2025-01-01',
        'end_date': '2025-11-06',
        'uploaded_code': scanner_code,
        'scanner_type': 'uploaded',
        'use_real_scan': True
    }

    print("📤 Submitting scan execution request...")
    try:
        response = requests.post('http://localhost:8000/api/scan/execute', json=scan_request, timeout=120)
        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Success: {result.get('success')}")
            print(f"🆔 Scan ID: {result.get('scan_id')}")
            print(f"💬 Message: {result.get('message')}")

            total_found = result.get('total_found', 0)
            execution_time = result.get('execution_time', 0)
            results = result.get('results', [])

            print(f"📊 Total found: {total_found}")
            print(f"⏱️ Execution time: {execution_time}")
            print(f"📋 Results array length: {len(results)}")

            if results:
                print("🎯 SUCCESS! Results found:")
                for i, result in enumerate(results[:8]):  # Show all results (should be 8)
                    ticker = result.get('ticker', 'N/A')
                    date = result.get('date', 'N/A')
                    scan_type = result.get('scan_type', 'N/A')
                    print(f"   {i+1}. {ticker} on {date} ({scan_type})")

                if len(results) == 8:
                    print("✅ PERFECT! Found exactly 8 results as expected for 2025")
                else:
                    print(f"⚠️ Expected 8 results, got {len(results)}")
            else:
                print("❌ NO RESULTS FOUND - The enhanced filtering still isn't working!")

        else:
            print(f"❌ Request failed: {response.status_code}")
            try:
                error = response.json()
                print(f"💥 Error details: {json.dumps(error, indent=2)}")
            except:
                print(f"💥 Error text: {response.text}")

    except requests.exceptions.Timeout:
        print("⏰ Request timed out - execution is taking too long or hanging")
    except Exception as e:
        print(f"💥 Request error: {str(e)}")

if __name__ == "__main__":
    test_web_interface()