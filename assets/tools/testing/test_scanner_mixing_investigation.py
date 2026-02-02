#!/usr/bin/env python3
"""
Comprehensive investigation of scanner mixing issue
Tests whether different scanners are producing different results or being confused
"""
import requests
import json
import time
import os

def test_scanner_type(scanner_name, file_path, scanner_label):
    """Test a specific scanner type and return detailed results"""
    print(f"\n🧪 Testing {scanner_label}")
    print("=" * 60)

    try:
        # Read the scanner code
        if not os.path.exists(file_path):
            print(f"❌ Scanner file not found: {file_path}")
            return None

        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📁 Loaded {scanner_label}: {len(code)} characters")

        # Step 1: Format the code
        print(f"\n🔧 Step 1: Formatting {scanner_label}...")
        format_request = {
            "code": code,
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
            timeout=120
        )

        if format_response.status_code != 200:
            print(f"❌ Format API failed: {format_response.status_code}")
            return None

        format_result = format_response.json()
        if not format_result.get('success'):
            print(f"❌ Code formatting failed: {format_result.get('errors')}")
            return None

        print(f"✅ {scanner_label} formatted successfully")

        # Get scanner type and parameters from formatting
        scanner_type = format_result.get('scanner_type', 'unknown')
        metadata = format_result.get('metadata', {})
        parameters = metadata.get('parameters', {})

        print(f"🔍 Detected Scanner Type: {scanner_type}")
        print(f"📊 Parameter Count: {len(parameters)}")

        # Step 2: Execute scan
        print(f"\n🚀 Step 2: Executing {scanner_label} scan...")
        scan_request = {
            "scanner_type": "uploaded",
            "start_date": "2025-10-01",
            "end_date": "2025-11-02",
            "uploaded_code": format_result.get('formatted_code'),
            "use_real_scan": True
        }

        scan_response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=scan_request,
            timeout=30
        )

        if scan_response.status_code != 200:
            print(f"❌ Scan execution failed: {scan_response.status_code}")
            return None

        scan_result = scan_response.json()
        scan_id = scan_result.get('scan_id')
        print(f"✅ Scan started: {scan_id}")

        # Step 3: Wait for completion
        print(f"\n⏱️ Step 3: Waiting for {scanner_label} completion...")
        for i in range(60):  # Wait up to 5 minutes
            status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
            if status_response.status_code == 200:
                status = status_response.json()
                if status.get('status') == 'completed':
                    print(f"✅ {scanner_label} scan completed successfully")
                    break
                elif status.get('status') == 'failed':
                    print(f"❌ {scanner_label} scan failed: {status.get('message', 'Unknown error')}")
                    return None
                else:
                    print(f"⏳ {scanner_label} progress: {status.get('progress_percent', 0)}%")
            time.sleep(5)
        else:
            print(f"❌ {scanner_label} scan timed out")
            return None

        # Step 4: Get results
        print(f"\n📊 Step 4: Analyzing {scanner_label} results...")
        results_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')

        if results_response.status_code != 200:
            print(f"❌ Failed to get {scanner_label} results: {results_response.status_code}")
            return None

        results_data = results_response.json()
        results = results_data.get('results', [])

        print(f"📈 {scanner_label} Total Results: {len(results)}")

        # Analyze unique tickers
        tickers = set(r.get('ticker', 'UNKNOWN') for r in results)
        print(f"🎯 {scanner_label} Unique Tickers: {len(tickers)}")

        # Show first few tickers for comparison
        if tickers:
            sample_tickers = sorted(list(tickers))[:10]
            print(f"📋 {scanner_label} Sample Tickers: {', '.join(sample_tickers)}")

        return {
            'scanner_name': scanner_name,
            'scanner_label': scanner_label,
            'scanner_type': scanner_type,
            'scan_id': scan_id,
            'total_results': len(results),
            'unique_tickers': len(tickers),
            'tickers': sorted(list(tickers)),
            'sample_results': results[:5],  # First 5 results for detailed comparison
            'parameters': parameters
        }

    except Exception as e:
        print(f"❌ {scanner_label} test failed with exception: {e}")
        return None

def compare_scanners(results):
    """Compare results from different scanners to identify mixing issues"""
    print("\n🔍 SCANNER COMPARISON ANALYSIS")
    print("=" * 70)

    if len(results) < 2:
        print("❌ Need at least 2 scanner results to compare")
        return

    # Compare tickers
    print("\n📊 TICKER COMPARISON:")
    for result in results:
        print(f"  {result['scanner_label']}: {result['unique_tickers']} unique tickers")

    # Check for identical results (which would indicate mixing)
    print("\n🔍 DETAILED COMPARISON:")

    for i in range(len(results)):
        for j in range(i + 1, len(results)):
            scanner1 = results[i]
            scanner2 = results[j]

            # Compare ticker sets
            tickers1 = set(scanner1['tickers'])
            tickers2 = set(scanner2['tickers'])

            common_tickers = tickers1.intersection(tickers2)
            unique_to_1 = tickers1 - tickers2
            unique_to_2 = tickers2 - tickers1

            print(f"\n🆚 {scanner1['scanner_label']} vs {scanner2['scanner_label']}:")
            print(f"   Common tickers: {len(common_tickers)}")
            print(f"   Unique to {scanner1['scanner_label']}: {len(unique_to_1)}")
            print(f"   Unique to {scanner2['scanner_label']}: {len(unique_to_2)}")

            if len(common_tickers) == len(tickers1) == len(tickers2) and len(common_tickers) > 0:
                print(f"⚠️  IDENTICAL RESULTS DETECTED! This suggests scanner mixing issue")
            elif len(common_tickers) > len(tickers1) * 0.8 or len(common_tickers) > len(tickers2) * 0.8:
                print(f"⚠️  HIGH OVERLAP ({len(common_tickers)}/{max(len(tickers1), len(tickers2))}) - Possible mixing")
            else:
                print(f"✅ Results appear distinct - scanners working independently")

def main():
    """Main function to test all scanner types"""
    print("🔍 COMPREHENSIVE SCANNER MIXING INVESTIGATION")
    print("=" * 70)

    # Define scanners to test
    scanners = [
        ('backside_para_a+', '/Users/michaeldurante/Downloads/backside para A+ copy.py', 'Backside Para A+ Scanner'),
        ('half_a+', '/Users/michaeldurante/Downloads/half A+ scan copy.py', 'Half A+ Scanner'),
        ('lc_d2', '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'LC D2 Scanner'),
    ]

    results = []

    for scanner_name, file_path, scanner_label in scanners:
        result = test_scanner_type(scanner_name, file_path, scanner_label)
        if result:
            results.append(result)
        else:
            print(f"❌ Skipping {scanner_label} due to errors")

        # Wait between tests to avoid rate limiting
        if len(results) < len(scanners):  # Don't wait after the last test
            print("\n⏱️ Waiting 15 seconds to avoid rate limiting...")
            time.sleep(15)

    # Compare all results
    if results:
        compare_scanners(results)

        # Summary
        print(f"\n📋 INVESTIGATION SUMMARY")
        print("=" * 50)
        print(f"✅ Successfully tested: {len(results)}/{len(scanners)} scanners")

        for result in results:
            print(f"  {result['scanner_label']}: {result['total_results']} results, {result['unique_tickers']} unique tickers")
            print(f"    Scan ID: {result['scan_id']}")
            print(f"    Scanner Type: {result['scanner_type']}")

        # Save detailed results for further analysis
        output_file = f"scanner_mixing_investigation_{int(time.time())}.json"
        with open(output_file, 'w') as f:
            json.dump(results, f, indent=2, default=str)
        print(f"\n💾 Detailed results saved to: {output_file}")
    else:
        print("\n❌ No scanners completed successfully - unable to perform comparison")

if __name__ == "__main__":
    main()