#!/usr/bin/env python3
"""
🔧 SCAN SYSTEM RECOVERY TOOL
===========================

Clears stuck scans and restores scan functionality to edge-dev-exact system.
Identifies and removes scans stuck in 'initializing' status for extended periods.
"""

import requests
import json
from datetime import datetime, timezone
from typing import Dict, List

def get_scan_status() -> Dict:
    """Get current scan status from Python backend"""
    try:
        response = requests.get("http://localhost:8000/api/health")
        return response.json()
    except Exception as e:
        return {"error": str(e)}

def list_stuck_scans() -> List[Dict]:
    """List all scans and identify stuck ones"""
    try:
        response = requests.get("http://localhost:8000/api/scan/list")
        if response.status_code != 200:
            print(f"❌ Failed to get scan list: {response.status_code}")
            return []

        scans = response.json().get("scans", [])
        stuck_scans = []

        for scan in scans:
            created_at = datetime.fromisoformat(scan["created_at"])
            age_hours = (datetime.now(timezone.utc) - created_at).total_seconds() / 3600

            # Consider a scan stuck if:
            # 1. Status is "initializing" and age > 30 minutes
            # 2. Status is "initializing" and created yesterday (old scans)
            # 3. Any scan older than 2 hours that's not completed

            if (scan["status"] == "initializing" and age_hours > 0.5) or \
               (scan["status"] == "initializing" and created_at.date() < datetime.now().date()) or \
               (age_hours > 2 and scan["status"] not in ["completed", "error"]):

                stuck_scans.append({
                    **scan,
                    "age_hours": age_hours,
                    "stuck_reason": "Old initializing scan" if scan["status"] == "initializing" else "Long-running scan"
                })

        return stuck_scans

    except Exception as e:
        print(f"❌ Error listing scans: {e}")
        return []

def restart_python_backend():
    """Restart the Python backend to clear stuck scans"""
    print("🔄 Attempting to restart Python backend...")

    try:
        # Get the process running on port 8000
        import subprocess
        result = subprocess.run(["lsof", "-t", "-i:8000"], capture_output=True, text=True)
        if result.returncode == 0:
            pid = result.stdout.strip()
            print(f"📋 Found Python backend PID: {pid}")

            # Kill the process
            subprocess.run(["kill", "-9", pid])
            print("✅ Terminated stuck Python backend")

            # Wait a moment
            import time
            time.sleep(2)

            # Restart the backend
            print("🚀 Restarting Python backend...")
            subprocess.Popen([
                "python", "-m", "uvicorn", "main:app",
                "--host", "0.0.0.0", "--port", "8000", "--reload"
            ], cwd="/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend")

            print("✅ Python backend restart initiated")
            return True

        else:
            print("❌ No process found on port 8000")
            return False

    except Exception as e:
        print(f"❌ Error restarting backend: {e}")
        return False

def test_scan_functionality():
    """Test if scan functionality is restored"""
    print("🧪 Testing scan functionality...")

    try:
        # Simple test payload
        test_payload = {
            "start_date": "2025-12-03",
            "end_date": "2025-12-10",
            "use_real_scan": True,
            "filters": {},
            "sophisticated_mode": True
        }

        response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=test_payload,
            timeout=10
        )

        if response.status_code == 200:
            result = response.json()
            if result.get("success"):
                print("✅ Scan functionality restored!")
                print(f"📊 Scan ID: {result.get('scan_id')}")
                return True
            else:
                print(f"❌ Scan failed: {result.get('error')}")
                return False
        else:
            print(f"❌ Scan request failed: {response.status_code}")
            try:
                error_detail = response.json()
                print(f"📋 Error detail: {error_detail}")
            except:
                print(f"📋 Raw response: {response.text}")
            return False

    except requests.exceptions.Timeout:
        print("⏰ Scan test timed out - backend may still be starting")
        return False
    except Exception as e:
        print(f"❌ Error testing scan: {e}")
        return False

def main():
    """Main recovery procedure"""
    print("🔧 EDGE-DEV-EXACT SCAN SYSTEM RECOVERY")
    print("=" * 50)

    # Step 1: Check current status
    print("\n📊 Step 1: Checking current scan status...")
    status = get_scan_status()
    if "error" in status:
        print(f"❌ Backend not responding: {status['error']}")
        print("🚀 Starting backend recovery...")
        restart_python_backend()
        return

    print(f"📈 Active scans: {status.get('active_scans', 0)}")
    print(f"🏥 Backend health: {status.get('status', 'unknown')}")

    # Step 2: Identify stuck scans
    print("\n🔍 Step 2: Identifying stuck scans...")
    stuck_scans = list_stuck_scans()

    if not stuck_scans:
        print("✅ No stuck scans found")
        # Test functionality anyway
        test_scan_functionality()
        return

    print(f"⚠️  Found {len(stuck_scans)} stuck scans:")
    for scan in stuck_scans:
        print(f"  - {scan['scan_id']}: {scan['status']} ({scan['age_hours']:.1f}h old)")

    # Step 3: Clear stuck scans by restarting backend
    print("\n🔄 Step 3: Clearing stuck scans...")
    if restart_python_backend():
        print("✅ Backend restarted successfully")

        # Step 4: Wait and test functionality
        print("\n⏳ Step 4: Waiting for backend to initialize...")
        import time
        time.sleep(5)

        print("\n🧪 Step 5: Testing restored functionality...")
        if test_scan_functionality():
            print("\n🎉 RECOVERY COMPLETE!")
            print("✅ Scan system is now operational")
        else:
            print("\n⚠️  RECOVERY PARTIAL")
            print("Backend restarted but scan test failed - may need manual intervention")
    else:
        print("\n❌ RECOVERY FAILED")
        print("Could not restart backend - manual intervention required")

if __name__ == "__main__":
    main()