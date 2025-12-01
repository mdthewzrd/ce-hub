#!/usr/bin/env python3
"""
CE-Hub Chat Endpoints Monitor & Auto-Healer
Continuously monitors and maintains all four chat endpoints
"""

import time
import requests
import subprocess
import os
import json
from datetime import datetime
from pathlib import Path

# Configuration
ENDPOINTS = [
    "https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8013/glm4.5chat",
    "https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8013/claude4chat",
    "https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8013/glm46chat",
    "https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8013/chat"
]

API_ENDPOINT = "https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8013/send"
TOKEN = "171158e5e011bb1d3e50a387a8234d60871323ce9463ec1ff4a1194cd686cfb4"
GLM_API_KEY = "05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY"

MONITOR_INTERVAL = 60  # seconds
MAX_FAILURES = 3

# State tracking
failure_counts = {endpoint: 0 for endpoint in ENDPOINTS}
last_check = datetime.now()
status_log = []

def log(message):
    timestamp = datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    log_entry = f"[{timestamp}] {message}"
    print(log_entry)
    status_log.append(log_entry)
    # Keep only last 100 entries
    if len(status_log) > 100:
        status_log.pop(0)

def check_endpoint(url):
    """Check if an endpoint is responding"""
    try:
        response = requests.get(url, timeout=10)
        if response.status_code == 200:
            # Check if it contains expected chat interface elements
            content = response.text.lower()
            if "chat" in content and "input" in content and "send" in content:
                return True, "OK"
            else:
                return False, "Invalid content"
        else:
            return False, f"HTTP {response.status_code}"
    except requests.exceptions.RequestException as e:
        return False, str(e)

def test_api_functionality():
    """Test actual API functionality with a test message"""
    try:
        # Test GLM model
        response = requests.post(API_ENDPOINT,
            headers={
                "Authorization": f"Bearer {TOKEN}",
                "Content-Type": "application/json"
            },
            json={
                "text": "test",
                "mode": "chat",
                "model": "glm-4",
                "wait_ms": 3000
            },
            timeout=15
        )

        if response.status_code == 200:
            data = response.json()
            if "full_response" in data or "preview" in data:
                return True, "API functional"
            else:
                return False, "API response format issue"
        else:
            return False, f"API HTTP {response.status_code}"

    except Exception as e:
        return False, f"API test failed: {str(e)}"

def restart_server():
    """Restart the chat server"""
    log("🔧 Attempting to restart server...")

    try:
        # Kill existing processes
        subprocess.run(["pkill", "-f", "claude_bridge_server.py"],
                      capture_output=True, check=False)

        # Kill anything on port 8013
        try:
            result = subprocess.run(["lsof", "-ti", ":8013"],
                                  capture_output=True, text=True, check=False)
            if result.stdout.strip():
                pids = result.stdout.strip().split('\n')
                for pid in pids:
                    subprocess.run(["kill", "-9", pid.strip()],
                                 capture_output=True, check=False)
        except:
            pass

        time.sleep(3)

        # Disable Tailscale serve
        subprocess.run(["tailscale", "serve", "--https=8013", "off"],
                      capture_output=True, check=False)

        time.sleep(2)

        # Start new server
        script_dir = Path(__file__).parent
        server_script = script_dir / "claude_bridge_server.py"

        env = os.environ.copy()
        env["HOST"] = "0.0.0.0"
        env["PORT"] = "8013"

        subprocess.Popen(
            ["python3", str(server_script)],
            cwd=str(script_dir),
            env=env,
            stdout=subprocess.DEVNULL,
            stderr=subprocess.DEVNULL
        )

        time.sleep(5)

        # Re-enable Tailscale HTTPS
        subprocess.run(["tailscale", "serve", "--bg", "--https", "8013", "8013"],
                      capture_output=True, check=False)

        time.sleep(3)

        log("✅ Server restart completed")
        return True

    except Exception as e:
        log(f"❌ Server restart failed: {str(e)}")
        return False

def monitor_loop():
    """Main monitoring loop"""
    log("🚀 CE-Hub Chat Endpoints Monitor Started")
    log("📡 Monitoring endpoints:")
    for endpoint in ENDPOINTS:
        log(f"  • {endpoint}")

    consecutive_failures = 0

    while True:
        try:
            log("🔍 Checking all endpoints...")

            all_healthy = True
            api_healthy = True

            # Check all chat endpoints
            for endpoint in ENDPOINTS:
                healthy, status = check_endpoint(endpoint)

                if healthy:
                    failure_counts[endpoint] = 0
                    log(f"✅ {endpoint.split('/')[-1]}: {status}")
                else:
                    failure_counts[endpoint] += 1
                    all_healthy = False
                    log(f"❌ {endpoint.split('/')[-1]}: {status} (failures: {failure_counts[endpoint]})")

            # Test API functionality every few checks
            if consecutive_failures == 0:  # Only test API when endpoints are healthy
                api_healthy, api_status = test_api_functionality()
                if api_healthy:
                    log(f"✅ API: {api_status}")
                else:
                    log(f"❌ API: {api_status}")
                    all_healthy = False

            # Check if restart is needed
            max_endpoint_failures = max(failure_counts.values())
            if max_endpoint_failures >= MAX_FAILURES or not api_healthy:
                log(f"🚨 CRITICAL: Max failures reached ({max_endpoint_failures}/{MAX_FAILURES}) or API failed")
                if restart_server():
                    # Reset failure counts after successful restart
                    for endpoint in ENDPOINTS:
                        failure_counts[endpoint] = 0
                    consecutive_failures = 0
                else:
                    consecutive_failures += 1
                    log(f"⚠️  Restart failed (attempt {consecutive_failures})")
            else:
                consecutive_failures = 0
                if all_healthy:
                    log("💚 All systems healthy")

            # Update status
            global last_check
            last_check = datetime.now()

            # Sleep until next check
            log(f"😴 Sleeping for {MONITOR_INTERVAL} seconds...")
            time.sleep(MONITOR_INTERVAL)

        except KeyboardInterrupt:
            log("🛑 Monitor stopped by user")
            break
        except Exception as e:
            log(f"⚠️  Monitor error: {str(e)}")
            time.sleep(30)

if __name__ == "__main__":
    monitor_loop()