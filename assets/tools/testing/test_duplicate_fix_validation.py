#!/usr/bin/env python3
"""
Test to validate that the duplicate fix is working for user's LC D2 scanner code
This tests the exact scenario the user reported: uploading LC D2 scanner and checking for duplicates
"""
import requests
import json
import time

def test_duplicate_fix():
    """Test that uploaded LC D2 scanner code no longer produces duplicates"""
    print("🧪 Testing Universal Deduplication Fix")
    print("=" * 60)

    # Read the user's original LC D2 scanner code
    lc_d2_path = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py'
    try:
        with open(lc_d2_path, 'r') as f:
            original_code = f.read()
        print(f"✅ Loaded LC D2 scanner code: {len(original_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner: {e}")
        return False

    try:
        # Step 1: Format the code through the API
        print("\n🔧 Step 1: Formatting LC D2 scanner code...")
        format_request = {
            "code": original_code,
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

        format_response = requests.post(
            'http://localhost:8000/api/format/code',
            json=format_request,
            timeout=60
        )

        if format_response.status_code != 200:
            print(f"❌ Format API failed: {format_response.status_code}")
            return False

        format_result = format_response.json()
        if not format_result.get('success'):
            print(f"❌ Code formatting failed: {format_result.get('errors')}")
            return False

        print("✅ LC D2 scanner formatted successfully")

        # Step 2: Execute scan with formatted code
        print("\n🚀 Step 2: Executing scan with uploaded LC D2 code...")
        scan_request = {
            "scanner_type": "uploaded",
            "start_date": "2025-10-01",
            "end_date": "2025-11-02",
            "uploaded_code": format_result.get('formatted_code')
        }

        scan_response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=scan_request,
            timeout=30
        )

        if scan_response.status_code != 200:
            print(f"❌ Scan execution failed: {scan_response.status_code}")
            return False

        scan_result = scan_response.json()
        scan_id = scan_result.get('scan_id')
        print(f"✅ Scan started: {scan_id}")

        # Step 3: Wait for scan completion
        print("\n⏱️ Step 3: Waiting for scan completion...")
        for i in range(60):  # Wait up to 5 minutes
            status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
            if status_response.status_code == 200:
                status = status_response.json()
                if status.get('status') == 'completed':
                    print("✅ Scan completed successfully")
                    break
                elif status.get('status') == 'failed':
                    print(f"❌ Scan failed: {status.get('message', 'Unknown error')}")
                    return False
                else:
                    print(f"⏳ Scan progress: {status.get('progress_percent', 0)}% - {status.get('message', '')}")
            time.sleep(5)
        else:
            print("❌ Scan timed out")
            return False

        # Step 4: Get results and check for duplicates
        print("\n📊 Step 4: Analyzing results for duplicates...")
        results_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')

        if results_response.status_code != 200:
            print(f"❌ Failed to get results: {results_response.status_code}")
            return False

        results_data = results_response.json()
        results = results_data.get('results', [])

        print(f"📈 Total results: {len(results)}")

        # Check specifically for the tickers that were duplicated before
        duplicate_check_tickers = ['AQMS', 'GWH', 'TMQ']

        # Count occurrences of each ticker
        ticker_counts = {}
        for result in results:
            ticker = result.get('ticker', '')
            date = result.get('date', '')
            key = f"{ticker}_{date}"
            ticker_counts[key] = ticker_counts.get(key, 0) + 1

        # Check for duplicates
        duplicates_found = []
        for key, count in ticker_counts.items():
            if count > 1:
                duplicates_found.append(f"{key} (appears {count} times)")

        # Detailed analysis for the problematic tickers
        for ticker in duplicate_check_tickers:
            ticker_results = [r for r in results if r.get('ticker') == ticker]
            if ticker_results:
                print(f"🎯 {ticker}: Found {len(ticker_results)} result(s)")
                for result in ticker_results:
                    print(f"   - Date: {result.get('date')}, Ticker: {result.get('ticker')}")
            else:
                print(f"ℹ️ {ticker}: Not found in current results")

        # Final verdict
        if duplicates_found:
            print(f"\n❌ DUPLICATES DETECTED:")
            for dup in duplicates_found:
                print(f"   - {dup}")
            return False
        else:
            print(f"\n✅ NO DUPLICATES FOUND! Universal deduplication is working perfectly.")
            print(f"🎉 Test PASSED - Backend fix successfully eliminates duplicate results")
            return True

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False

if __name__ == "__main__":
    success = test_duplicate_fix()
    exit(0 if success else 1)