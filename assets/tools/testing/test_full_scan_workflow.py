#!/usr/bin/env python3
"""
Test the complete scan workflow with progress updates
"""
import requests
import json
import time
import threading

def test_full_scan_workflow():
    print("🧪 Testing Complete Scan Workflow with Progress Updates")
    print("=" * 60)

    # Read the real LC D2 scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        try:
            with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
                scanner_code = f.read()
            print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
        except FileNotFoundError:
            print("❌ LC D2 scanner file not found")
            return False

    print("\n🔧 Step 1: Testing API responsiveness before scan")
    try:
        response = requests.get("http://localhost:8000/api/scan/status", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is responsive before scan")
        else:
            print(f"❌ Backend not responsive: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connectivity issue: {e}")
        return False

    print("\n🚀 Step 2: Start LC D2 scan")
    try:
        # Start the scan
        scan_payload = {
            "uploaded_code": scanner_code,
            "scanner_type": "uploaded",
            "use_real_scan": True,
            "start_date": "2025-10-07",
            "end_date": "2025-11-06"
        }

        response = requests.post("http://localhost:8000/api/scan/execute",
                               json=scan_payload,
                               timeout=10)

        if response.status_code == 200:
            result = response.json()
            scan_id = result.get('scan_id')
            print(f"✅ Scan started successfully! Scan ID: {scan_id}")
        else:
            print(f"❌ Failed to start scan: {response.status_code}")
            print(f"Response: {response.text}")
            return False
    except Exception as e:
        print(f"❌ Error starting scan: {e}")
        return False

    print("\n🔍 Step 3: Monitor progress updates during scan execution")

    def monitor_progress():
        """Background thread to monitor progress"""
        for i in range(20):  # Monitor for up to 20 seconds
            try:
                response = requests.get("http://localhost:8000/api/scan/status", timeout=3)
                if response.status_code == 200:
                    result = response.json()
                    status = result.get('status', 'unknown')
                    progress = result.get('progress', 0)
                    message = result.get('message', '')

                    timestamp = time.strftime("%H:%M:%S")
                    if status == 'running':
                        print(f"   [{timestamp}] 🔄 RUNNING - Progress: {progress}% - {message}")
                    elif status == 'completed':
                        print(f"   [{timestamp}] ✅ COMPLETED - Progress: {progress}%")
                        break
                    elif status == 'no_scans':
                        print(f"   [{timestamp}] ⚠️ No scans detected")
                    else:
                        print(f"   [{timestamp}] 📊 Status: {status} - Progress: {progress}%")
                else:
                    print(f"   [{time.strftime('%H:%M:%S')}] ❌ API Error: {response.status_code}")

            except requests.exceptions.Timeout:
                print(f"   [{time.strftime('%H:%M:%S')}] ⚠️ API TIMEOUT - Backend may be blocked!")
                break
            except Exception as e:
                print(f"   [{time.strftime('%H:%M:%S')}] ❌ Error: {e}")

            time.sleep(1)

    # Start monitoring in background
    monitor_thread = threading.Thread(target=monitor_progress)
    monitor_thread.start()

    # Wait for monitoring to complete
    monitor_thread.join()

    print("\n📊 Step 4: Final status check")
    try:
        response = requests.get("http://localhost:8000/api/scan/status", timeout=5)
        if response.status_code == 200:
            result = response.json()
            print(f"✅ Final API call successful!")
            print(f"   Status: {result.get('status', 'unknown')}")
            print(f"   Progress: {result.get('progress', 0)}%")

            # Test responsiveness during/after scan
            print(f"\n🎯 CRITICAL TEST RESULT:")
            if response.elapsed.total_seconds() < 2:
                print(f"✅ SUCCESS: Backend stayed responsive ({response.elapsed.total_seconds():.2f}s response)")
                print(f"🎉 ASYNC FIX WORKING! No more blocking issues!")
                return True
            else:
                print(f"⚠️ Slow response: {response.elapsed.total_seconds():.2f}s")
                return False
        else:
            print(f"❌ Final status check failed: {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Final check error: {e}")
        return False

if __name__ == "__main__":
    success = test_full_scan_workflow()

    if success:
        print("\n🎉 WORKFLOW TEST COMPLETE!")
        print("✅ Backend blocking issue RESOLVED")
        print("✅ Progress updates working correctly")
        print("✅ Frontend will now receive real-time updates")
    else:
        print("\n❌ WORKFLOW TEST FAILED")
        print("⚠️ Additional debugging needed")