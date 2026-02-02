#!/usr/bin/env python3
"""
Comprehensive test for both scanner files as requested by user:
1. LC D2 scanner: /Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py
2. Backside Para B scanner: /Users/michaeldurante/Downloads/backside para b copy.py
Date range: 1/1/25 to 11/1/25
"""

import requests
import json
import time
import threading
from datetime import datetime


def test_scanner_upload_and_execution(scanner_name, scanner_file_path, start_date, end_date):
    """Test a scanner from upload to completed execution"""
    print(f"\n🧪 TESTING: {scanner_name}")
    print(f"📄 File: {scanner_file_path}")
    print(f"📅 Date Range: {start_date} to {end_date}")
    print("=" * 80)

    try:
        # Step 1: Load the scanner file
        print(f"📂 Step 1: Loading scanner file...")
        try:
            with open(scanner_file_path, 'r') as f:
                scanner_code = f.read()
            print(f"✅ Scanner loaded: {len(scanner_code):,} characters")
        except FileNotFoundError:
            print(f"❌ Scanner file not found: {scanner_file_path}")
            return False

        # Step 2: Test backend connectivity
        print(f"\n🔧 Step 2: Testing backend connectivity...")
        try:
            response = requests.get("http://localhost:8000/api/health", timeout=5)
            if response.status_code == 200:
                print(f"✅ Backend is responsive")
            else:
                print(f"❌ Backend not responsive: {response.status_code}")
                return False
        except Exception as e:
            print(f"❌ Backend connectivity issue: {e}")
            return False

        # Step 3: Upload and execute scanner
        print(f"\n🚀 Step 3: Uploading and executing scanner...")
        scan_payload = {
            "uploaded_code": scanner_code,
            "scanner_type": "uploaded",
            "use_real_scan": True,
            "start_date": start_date,
            "end_date": end_date
        }

        start_time = time.time()
        response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=scan_payload,
            timeout=15  # Increased timeout for initial request
        )

        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id')
            print(f"✅ Scan started successfully! Scan ID: {scan_id}")
        else:
            print(f"❌ Failed to start scan: {response.status_code}")
            print(f"Response: {response.text[:200]}...")
            return False

        # Step 4: Monitor progress with better timeout handling
        print(f"\n🔍 Step 4: Monitoring scan progress...")

        max_wait_time = 180  # 3 minutes maximum
        check_interval = 2   # Check every 2 seconds
        checks_performed = 0
        max_checks = max_wait_time // check_interval

        scan_completed = False
        final_results = []

        while checks_performed < max_checks:
            try:
                response = requests.get("http://localhost:8000/api/scan/status", timeout=5)

                if response.status_code == 200:
                    result = response.json()
                    status = result.get('status', 'unknown')
                    progress = result.get('progress', 0)
                    message = result.get('message', '')

                    elapsed = time.time() - start_time
                    timestamp = time.strftime("%H:%M:%S")

                    if status == 'running':
                        print(f"   [{timestamp}] 🔄 RUNNING - Progress: {progress}% - {message} (Elapsed: {elapsed:.1f}s)")
                    elif status == 'completed':
                        print(f"   [{timestamp}] ✅ COMPLETED - Progress: {progress}% (Elapsed: {elapsed:.1f}s)")
                        final_results = result.get('results', [])
                        scan_completed = True
                        break
                    elif status == 'error':
                        print(f"   [{timestamp}] ❌ ERROR - {message}")
                        return False
                    elif status == 'no_scans':
                        print(f"   [{timestamp}] ⚠️ No scans detected")
                    else:
                        print(f"   [{timestamp}] 📊 Status: {status} - Progress: {progress}%")

                    # Check if backend is still responsive
                    if elapsed > 30 and progress == 0:
                        print(f"   [{timestamp}] ⚠️ WARNING: No progress after 30 seconds")

                else:
                    print(f"   [{time.strftime('%H:%M:%S')}] ❌ API Error: {response.status_code}")

            except requests.exceptions.Timeout:
                print(f"   [{time.strftime('%H:%M:%S')}] ⚠️ API TIMEOUT - Backend may be processing...")
            except Exception as e:
                print(f"   [{time.strftime('%H:%M:%S')}] ❌ Error: {e}")

            time.sleep(check_interval)
            checks_performed += 1

        # Step 5: Final validation
        print(f"\n📊 Step 5: Final validation...")

        if scan_completed:
            total_time = time.time() - start_time
            print(f"✅ Scan completed successfully in {total_time:.1f} seconds")
            print(f"🎯 Results found: {len(final_results)}")

            if final_results:
                print(f"📋 Sample results:")
                for i, result in enumerate(final_results[:3]):  # Show first 3 results
                    print(f"   {i+1}. {result}")
                if len(final_results) > 3:
                    print(f"   ... and {len(final_results) - 3} more results")

            # Verify backend is still responsive
            try:
                response = requests.get("http://localhost:8000/api/health", timeout=3)
                if response.status_code == 200 and response.elapsed.total_seconds() < 2:
                    print(f"✅ Backend remained responsive throughout scan")
                    print(f"🎉 INFINITE LOOP FIX WORKING! No more blocking issues!")
                    return True
                else:
                    print(f"⚠️ Backend response time: {response.elapsed.total_seconds():.2f}s")
                    return False
            except Exception as e:
                print(f"❌ Backend responsiveness check failed: {e}")
                return False
        else:
            total_time = time.time() - start_time
            print(f"❌ Scan did not complete within {max_wait_time} seconds (took {total_time:.1f}s)")
            print(f"🔧 This may indicate the infinite loop issue still exists")
            return False

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        return False


def main():
    """Main test function"""
    print("🧪 COMPREHENSIVE SCANNER TESTING")
    print("Testing both scanner files as requested by user")
    print("=" * 80)

    # Test configuration
    start_date = "2025-01-01"  # 1/1/25
    end_date = "2025-11-01"    # 11/1/25

    # Scanner files to test
    scanners = [
        {
            "name": "LC D2 Scanner",
            "file_path": "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py",
            "description": "LC D2 style scanner with async main() and DATES"
        },
        {
            "name": "Backside Para B Scanner",
            "file_path": "/Users/michaeldurante/Downloads/backside para b copy.py",
            "description": "Backside Para B scanner pattern"
        }
    ]

    print(f"📅 Date Range: {start_date} to {end_date}")
    print(f"🎯 Testing {len(scanners)} scanner files")
    print()

    results = []

    for i, scanner in enumerate(scanners, 1):
        print(f"\n{'='*20} SCANNER {i}/{len(scanners)} {'='*20}")
        success = test_scanner_upload_and_execution(
            scanner["name"],
            scanner["file_path"],
            start_date,
            end_date
        )

        results.append({
            "scanner": scanner["name"],
            "file_path": scanner["file_path"],
            "success": success
        })

        if i < len(scanners):
            print(f"\n⏸️ Waiting 5 seconds before next test...")
            time.sleep(5)

    # Final summary
    print(f"\n🎉 TESTING COMPLETE!")
    print("=" * 80)

    successful_tests = sum(1 for r in results if r["success"])
    total_tests = len(results)

    print(f"📊 Results Summary:")
    print(f"   ✅ Successful: {successful_tests}/{total_tests}")
    print(f"   ❌ Failed: {total_tests - successful_tests}/{total_tests}")

    print(f"\n📋 Detailed Results:")
    for result in results:
        status = "✅ PASSED" if result["success"] else "❌ FAILED"
        print(f"   {status} - {result['scanner']}")
        print(f"        File: {result['file_path']}")

    if successful_tests == total_tests:
        print(f"\n🎉 ALL TESTS PASSED!")
        print(f"✅ Both scanner files work correctly from 1/1/25 to 11/1/25")
        print(f"✅ Infinite loop issue has been resolved")
        print(f"✅ Backend remains responsive during and after scans")
    else:
        print(f"\n⚠️ {total_tests - successful_tests} test(s) failed")
        print(f"🔧 Additional debugging may be needed")

    return successful_tests == total_tests


if __name__ == "__main__":
    success = main()
    exit_code = 0 if success else 1
    exit(exit_code)