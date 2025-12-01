#!/usr/bin/env python3
"""
Mobile Bridge Connection Test
Test mobile connectivity to the Claude Bridge server

This script simulates what would happen on a mobile device connecting
to the bridge server. It tests all endpoints and provides status reports.
"""

import requests
import json
import time
import sys
from pathlib import Path
from typing import Dict, Any

class MobileBridgeTest:
    def __init__(self, base_url: str = "http://127.0.0.1:8008"):
        self.base_url = base_url
        self.token_file = Path.home() / ".claude-bridge" / "token.txt"
        self.token = self._load_token()
        self.session = requests.Session()
        if self.token:
            self.session.headers.update({"Authorization": f"Bearer {self.token}"})

    def _load_token(self) -> str:
        try:
            return self.token_file.read_text().strip()
        except FileNotFoundError:
            print("❌ No authentication token found")
            sys.exit(1)

    def test_health(self) -> Dict[str, Any]:
        """Test the health endpoint"""
        try:
            response = requests.get(f"{self.base_url}/healthz", timeout=5)
            return {
                "success": response.status_code == 200,
                "data": response.json() if response.status_code == 200 else None,
                "status_code": response.status_code
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def test_send_command(self, command: str = "pwd") -> Dict[str, Any]:
        """Test sending a command"""
        try:
            payload = {
                "text": command,
                "mode": "ask",
                "wait_ms": 2000
            }
            response = self.session.post(
                f"{self.base_url}/send",
                json=payload,
                timeout=10
            )
            return {
                "success": response.status_code == 200,
                "data": response.json() if response.status_code == 200 else None,
                "status_code": response.status_code
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def test_job_tail(self, job_id: str) -> Dict[str, Any]:
        """Test tailing a job"""
        try:
            response = requests.get(
                f"{self.base_url}/jobs/{job_id}/tail?lines=10",
                timeout=5
            )
            return {
                "success": response.status_code == 200,
                "data": response.text if response.status_code == 200 else None,
                "status_code": response.status_code
            }
        except Exception as e:
            return {"success": False, "error": str(e)}

    def run_mobile_simulation(self):
        """Run a full mobile device simulation"""
        print("📱 Mobile Bridge Connection Test")
        print("=" * 40)

        # Test 1: Health Check
        print("\n🔍 Test 1: Health Check")
        health = self.test_health()
        if health["success"]:
            print("✅ Bridge server is healthy")
            print(f"   Status: {health['data']}")
        else:
            print(f"❌ Health check failed: {health.get('error', 'Unknown error')}")
            return False

        # Test 2: Authentication & Send Command
        print("\n🔍 Test 2: Send Command (with auth)")
        send_result = self.test_send_command("echo 'Hello from mobile device!'")
        if send_result["success"]:
            print("✅ Command sent successfully")
            job_data = send_result["data"]
            print(f"   Job ID: {job_data.get('id', 'N/A')}")
            print(f"   Preview: {job_data.get('preview', 'N/A')[:100]}...")

            # Test 3: Job Tail
            job_id = job_data.get("id")
            if job_id:
                print("\n🔍 Test 3: Job Tail")
                time.sleep(1)  # Give job time to complete
                tail_result = self.test_job_tail(job_id)
                if tail_result["success"]:
                    print("✅ Job tail successful")
                    print(f"   Output: {tail_result['data'][:200]}...")
                else:
                    print(f"❌ Job tail failed: {tail_result.get('error', 'Unknown error')}")
        else:
            print(f"❌ Send command failed: {send_result.get('error', 'Unknown error')}")
            return False

        # Test 4: Mobile Context Setup
        print("\n🔍 Test 4: Mobile Context Setup")
        mobile_setup = self.test_send_command("""
# Mobile work session started
cd ~/ai\ dev/ce-hub
echo "Starting mobile work in CE-Hub"
git status
""")
        if mobile_setup["success"]:
            print("✅ Mobile context setup successful")
        else:
            print(f"❌ Mobile context setup failed")

        print("\n🎉 Mobile Bridge Test Complete!")
        print("\n📋 Next Steps for Mobile Device:")
        print("1. Install iOS Shortcuts app or similar automation tool")
        print("2. Create shortcuts to send commands to this bridge")
        print("3. Set up Tailscale for secure remote access")
        print("4. Test mobile workflow end-to-end")

        return True

def main():
    tester = MobileBridgeTest()
    success = tester.run_mobile_simulation()
    sys.exit(0 if success else 1)

if __name__ == "__main__":
    main()