#!/usr/bin/env python3
"""
Comprehensive test for all 3 scanner codes to ensure they work fully through the frontend
"""
import requests
import json
import time
import os

class ScannerTester:
    def __init__(self):
        self.base_url = "http://localhost:8000"
        self.scanner_paths = {
            'backside_para_b': '/Users/michaeldurante/Downloads/backside para b copy.py',
            'lc_d2': '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py',
            'half_a_plus': '/Users/michaeldurante/Downloads/half A+ scan copy.py'
        }

    def load_scanner(self, scanner_name):
        """Load scanner code from file"""
        path = self.scanner_paths.get(scanner_name)
        if not path or not os.path.exists(path):
            print(f"❌ Scanner file not found: {path}")
            return None

        try:
            with open(path, 'r') as f:
                code = f.read()
            print(f"✅ {scanner_name} loaded: {len(code)} characters")
            return code
        except Exception as e:
            print(f"❌ Failed to load {scanner_name}: {e}")
            return None

    def submit_scan(self, scanner_name, scanner_code):
        """Submit a scan and return scan ID"""
        scan_request = {
            'start_date': '2025-01-01',
            'end_date': '2025-11-06',
            'uploaded_code': scanner_code,
            'scanner_type': 'uploaded',
            'use_real_scan': True
        }

        print(f"📤 Submitting {scanner_name} scan...")
        try:
            response = requests.post(f'{self.base_url}/api/scan/execute', json=scan_request, timeout=120)
            if response.status_code == 200:
                result = response.json()
                scan_id = result.get('scan_id')
                print(f"🆔 {scanner_name} scan started: {scan_id}")
                return scan_id
            else:
                print(f"❌ {scanner_name} submission failed: {response.status_code}")
                return None
        except Exception as e:
            print(f"❌ {scanner_name} submission error: {e}")
            return None

    def wait_for_completion(self, scanner_name, scan_id, max_wait_minutes=3):
        """Wait for scan to complete and check status"""
        print(f"⏳ Waiting for {scanner_name} to complete...")
        start_time = time.time()
        max_wait_seconds = max_wait_minutes * 60

        while time.time() - start_time < max_wait_seconds:
            try:
                response = requests.get(f'{self.base_url}/api/scan/status/{scan_id}')
                if response.status_code == 200:
                    status = response.json()
                    progress = status.get('progress_percent', 0)
                    scan_status = status.get('status', 'unknown')

                    print(f"  📊 {scanner_name}: {progress}% ({scan_status})")

                    if scan_status == 'completed':
                        results = status.get('results', [])
                        total_found = status.get('total_found', 0)
                        execution_time = status.get('execution_time', 0)

                        print(f"✅ {scanner_name} COMPLETED!")
                        print(f"   📊 Total found: {total_found}")
                        print(f"   📋 Results returned: {len(results)}")
                        print(f"   ⏱️ Execution time: {execution_time}s")

                        if results:
                            print(f"   🎯 Sample results:")
                            for i, result in enumerate(results[:5]):  # Show first 5
                                ticker = result.get('ticker', 'N/A')
                                date = result.get('date', 'N/A')
                                print(f"     {i+1}. {ticker} on {date}")

                        return results

                    elif scan_status == 'failed':
                        print(f"❌ {scanner_name} FAILED")
                        return None

                else:
                    print(f"⚠️ Status check failed: {response.status_code}")

            except Exception as e:
                print(f"⚠️ Status check error: {e}")

            time.sleep(5)  # Wait 5 seconds before next check

        print(f"⏰ {scanner_name} timed out after {max_wait_minutes} minutes")
        return None

    def test_scanner(self, scanner_name):
        """Complete test of a single scanner"""
        print(f"\n🔍 TESTING {scanner_name.upper()} SCANNER")
        print("=" * 50)

        # Load scanner code
        code = self.load_scanner(scanner_name)
        if not code:
            return False

        # Submit scan
        scan_id = self.submit_scan(scanner_name, code)
        if not scan_id:
            return False

        # Wait for completion
        results = self.wait_for_completion(scanner_name, scan_id)
        if results is not None:
            print(f"✅ {scanner_name} test PASSED - {len(results)} results")
            return True
        else:
            print(f"❌ {scanner_name} test FAILED")
            return False

    def test_all_scanners(self):
        """Test all 3 scanners"""
        print("🚀 COMPREHENSIVE SCANNER TEST")
        print("Testing all 3 scanners through web interface...")
        print()

        results = {}
        for scanner_name in ['backside_para_b', 'lc_d2', 'half_a_plus']:
            results[scanner_name] = self.test_scanner(scanner_name)

        print("\n📊 FINAL RESULTS:")
        print("=" * 50)
        for scanner_name, success in results.items():
            status = "✅ PASSED" if success else "❌ FAILED"
            print(f"{scanner_name:20} {status}")

        all_passed = all(results.values())
        if all_passed:
            print(f"\n🎉 ALL SCANNERS WORKING PERFECTLY!")
        else:
            failed_count = sum(1 for success in results.values() if not success)
            print(f"\n⚠️ {failed_count} scanner(s) failed - need investigation")

        return all_passed

if __name__ == "__main__":
    tester = ScannerTester()
    tester.test_all_scanners()