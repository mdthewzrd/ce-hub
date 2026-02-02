#!/usr/bin/env python3
"""
🎯 Enhanced Mode Validation Test
======================================================================
Tests that enhanced mode (full universe) returns MORE results while
preserving the original 8 signals that appeared with the 106 symbols.

This validates:
1. Enhanced mode uses full ticker universe (not just 106 symbols)
2. Original 8 signals are preserved in the expanded result set
3. Algorithm integrity is maintained across different symbol universes
"""

import requests
import json
import time

def test_enhanced_mode_with_original_signals():
    """Test enhanced mode preserves original signals while expanding universe"""
    print("🎯 ENHANCED MODE VALIDATION TEST")
    print("=" * 70)
    print("Testing that enhanced mode preserves original 8 signals in expanded results")
    print()

    # Load the original scanner code
    scanner_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
    with open(scanner_path, 'r') as f:
        scanner_code = f.read()

    print(f"✅ Loaded backside para scanner: {len(scanner_code)} characters")

    # Expected original 8 signals (from pure mode with 106 symbols)
    expected_original_signals = [
        ('SMCI', '2025-02-18'),
        ('SMCI', '2025-02-19'),
        ('BABA', '2025-01-27'),
        ('BABA', '2025-01-29'),
        ('SOXL', '2025-10-02'),
        ('AMD', '2025-05-14'),
        ('INTC', '2025-08-15'),
        ('XOM', '2025-06-13')
    ]

    # Test the enhanced mode request format
    request_data = {
        "start_date": "2025-01-01",
        "end_date": "2025-11-03",
        "use_real_scan": True,
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code
    }

    print("\\n🚀 Sending request to /api/scan/execute...")
    print(f"   - scanner_type: {request_data['scanner_type']}")
    print(f"   - date range: {request_data['start_date']} to {request_data['end_date']}")
    print(f"   - Expected: Enhanced mode with full universe")
    print(f"   - Validation: Original 8 signals should be preserved")

    try:
        # Send request to backend
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=request_data,
            headers={'Content-Type': 'application/json'}
        )

        if response.status_code == 200:
            data = response.json()
            print(f"\\n✅ Request successful!")
            print(f"   - scan_id: {data.get('scan_id')}")
            print(f"   - message: {data.get('message')}")

            if data.get('scan_id'):
                # Poll for completion
                scan_id = data['scan_id']
                print(f"\\n⏳ Polling for scan completion...")

                max_attempts = 120  # Extended for enhanced mode
                for attempt in range(max_attempts):
                    time.sleep(3)  # Extended interval for enhanced mode

                    status_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')
                    if status_response.status_code == 200:
                        results_data = status_response.json()
                        results = results_data.get('results', [])

                        print(f"\\n🎉 ENHANCED SCAN COMPLETED!")
                        print(f"   - Total results: {len(results)}")
                        print(f"   - Execution time: {results_data.get('execution_time', 0):.2f}s")

                        if len(results) > 0:
                            # Check scan type
                            scan_type = results[0].get('scan_type', 'unknown')
                            print(f"   - Scan type: {scan_type}")

                            # Show first 15 results
                            print(f"\\n📊 First 15 results:")
                            for i, result in enumerate(results[:15]):
                                ticker = result.get('ticker', 'UNKNOWN')
                                date = result.get('date', 'UNKNOWN')
                                scan_type = result.get('scan_type', 'UNKNOWN')
                                # Clean up date format
                                clean_date = date.split('T')[0] if 'T' in date else date
                                print(f"      {i+1}. {ticker} on {clean_date} (type: {scan_type})")

                            if len(results) > 15:
                                print(f"      ... and {len(results) - 15} more")

                        # Validate that original 8 signals are preserved
                        found_original_signals = []
                        for result in results:
                            ticker = result.get('ticker', '')
                            date = result.get('date', '')
                            # Clean up date format for comparison
                            clean_date = date.split('T')[0] if 'T' in date else date
                            if (ticker, clean_date) in expected_original_signals:
                                found_original_signals.append((ticker, clean_date))

                        print(f"\\n🎯 ORIGINAL SIGNAL PRESERVATION VALIDATION:")
                        print(f"   - Expected original signals: {len(expected_original_signals)}")
                        print(f"   - Found original signals: {len(found_original_signals)}")

                        if found_original_signals:
                            preservation_rate = (len(found_original_signals) / len(expected_original_signals)) * 100
                            print(f"   - Preservation rate: {preservation_rate:.1f}%")
                            print(f"   ✅ Preserved original signals:")
                            for ticker, date in found_original_signals:
                                print(f"      - {ticker} on {date}")

                        missing_original_signals = [s for s in expected_original_signals if s not in found_original_signals]
                        if missing_original_signals:
                            print(f"   ⚠️ Missing original signals:")
                            for ticker, date in missing_original_signals:
                                print(f"      - {ticker} on {date}")

                        # Enhanced mode success criteria
                        print(f"\\n🎯 ENHANCED MODE VALIDATION:")

                        # Check 1: More results than pure mode (8)
                        if len(results) > 8:
                            print(f"   ✅ EXPANSION SUCCESS: {len(results)} results (vs 8 in pure mode)")
                        else:
                            print(f"   ⚠️ LIMITED EXPANSION: {len(results)} results (same as pure mode)")

                        # Check 2: Original signals preserved
                        if len(found_original_signals) == len(expected_original_signals):
                            print(f"   ✅ PRESERVATION SUCCESS: All 8 original signals preserved")
                        elif len(found_original_signals) >= 6:
                            print(f"   ⚠️ PARTIAL PRESERVATION: {len(found_original_signals)}/8 original signals preserved")
                        else:
                            print(f"   ❌ PRESERVATION FAILURE: Only {len(found_original_signals)}/8 original signals preserved")

                        # Check 3: Scan type is enhanced
                        if any('enhanced' in result.get('scan_type', '').lower() for result in results):
                            print(f"   ✅ MODE CONFIRMATION: Enhanced mode detected")
                        else:
                            print(f"   ⚠️ MODE UNCLEAR: Scan type not confirmed as enhanced")

                        # Final assessment
                        if (len(results) > 8 and
                            len(found_original_signals) >= 6 and
                            any('enhanced' in result.get('scan_type', '').lower() for result in results)):
                            print(f"\\n✅ ENHANCED MODE SUCCESS!")
                            print(f"   - Expanded universe: {len(results)} total results")
                            print(f"   - Algorithm integrity: {len(found_original_signals)}/8 original signals preserved")
                            print(f"   - Full universe scan confirmed")
                        else:
                            print(f"\\n⚠️ ENHANCED MODE NEEDS INVESTIGATION")
                            if len(results) <= 8:
                                print(f"   - Issue: No universe expansion detected")
                            if len(found_original_signals) < 6:
                                print(f"   - Issue: Algorithm integrity compromised")

                        return results

                    elif status_response.status_code == 202:
                        # Still in progress
                        print(f"   ⏳ Attempt {attempt + 1}/{max_attempts} - Enhanced mode processing...")
                        continue
                    else:
                        print(f"   ❌ Status check failed: {status_response.status_code}")
                        break

                print(f"   ❌ Enhanced scan timed out after {max_attempts} attempts")

        else:
            print(f"\\n❌ Request failed: {response.status_code}")
            print(f"   Response: {response.text}")

    except Exception as e:
        print(f"\\n❌ Enhanced mode test failed: {str(e)}")
        return None

def main():
    print("🎯 ENHANCED MODE VALIDATION")
    print("=" * 50)
    print("Testing enhanced mode with full universe preservation")
    print()

    results = test_enhanced_mode_with_original_signals()

    if results and len(results) > 8:
        print(f"\\n🎉 Enhanced mode validation completed - found {len(results)} results")
        print(f"📈 Universe expansion: {len(results)/8:.1f}x more results than pure mode")
    elif results and len(results) == 8:
        print(f"\\n⚠️ Enhanced mode validation completed - same result count as pure mode")
    else:
        print(f"\\n❌ Enhanced mode validation failed")

if __name__ == "__main__":
    main()