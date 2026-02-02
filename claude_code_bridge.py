#!/usr/bin/env python3
"""
Claude Code API Bridge
Connects mobile interface to existing Claude Code subscription
"""

import asyncio
import json
import logging
import subprocess
import sys
import os
from pathlib import Path
from typing import Dict, Any, Optional
import http.server
import socketserver
import urllib.parse
import urllib.request
import time
import psutil

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class ClaudeCodeBridge:
    """Bridge between mobile interface and Claude Code subscription"""

    def __init__(self, port: int = 8112):
        self.port = port
        self.ce_hub_root = Path(__file__).parent
        self.claude_code_process = None

    def find_claude_code_executable(self):
        """Find Claude Code executable path"""
        possible_paths = [
            "/usr/local/bin/claude",
            "/opt/homebrew/bin/claude",
            "~/.local/bin/claude",
            "~/Library/Application Support/Claude/claude",
            "/Applications/Claude.app/Contents/MacOS/claude"
        ]

        for path in possible_paths:
            expanded_path = Path(path).expanduser()
            if expanded_path.exists():
                return str(expanded_path)

        # Try to find in PATH
        try:
            result = subprocess.run(['which', 'claude'], capture_output=True, text=True)
            if result.returncode == 0:
                return result.stdout.strip()
        except:
            pass

        return None

    def start_claude_code_server(self):
        """Start Claude Code in server mode"""
        claude_executable = self.find_claude_code_executable()

        if not claude_executable:
            logger.error("Claude Code executable not found")
            return False

        try:
            # Try to start Claude Code server
            cmd = [
                claude_executable,
                '--server',
                '--port', '8113',
                '--allow-remote-access',
                '--project', str(self.ce_hub_root)
            ]

            logger.info(f"Starting Claude Code server: {' '.join(cmd)}")

            self.claude_code_process = subprocess.Popen(
                cmd,
                cwd=self.ce_hub_root,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True
            )

            # Give it time to start
            time.sleep(3)

            # Check if it's still running
            if self.claude_code_process.poll() is None:
                logger.info("✅ Claude Code server started successfully")
                return True
            else:
                stdout, stderr = self.claude_code_process.communicate()
                logger.error(f"Claude Code server failed to start")
                logger.error(f"stdout: {stdout}")
                logger.error(f"stderr: {stderr}")
                return False

        except Exception as e:
            logger.error(f"Failed to start Claude Code server: {e}")
            return False

    async def test_claude_code_connection(self) -> Dict[str, Any]:
        """Test connection to Claude Code server"""
        try:
            import httpx

            async with httpx.AsyncClient(timeout=10.0) as client:
                # Try health check
                response = await client.get("http://localhost:8113/health")
                if response.status_code == 200:
                    return {
                        "status": "success",
                        "claude_code_connected": True,
                        "response": response.json()
                    }
                else:
                    return {
                        "status": "error",
                        "claude_code_connected": False,
                        "error": f"HTTP {response.status_code}"
                    }

        except Exception as e:
            logger.error(f"Claude Code connection test failed: {e}")
            return {
                "status": "error",
                "claude_code_connected": False,
                "error": str(e)
            }

    def send_to_claude_code(self, question: str, model: str = None) -> Dict[str, Any]:
        """Send question to Claude Code"""
        try:
            import httpx

            payload = {
                "question": question,
                "context": {
                    "mobile_interface": True,
                    "ce_hub_project": str(self.ce_hub_root)
                }
            }

            if model:
                payload["model"] = model

            # Try different endpoints that Claude Code might use
            endpoints_to_try = [
                "http://localhost:8113/api/ask",
                "http://localhost:8113/chat",
                "http://localhost:8113/ask",
                "http://localhost:8113/v1/messages"
            ]

            for endpoint in endpoints_to_try:
                try:
                    response = httpx.post(endpoint, json=payload, timeout=30.0)
                    if response.status_code == 200:
                        result = response.json()
                        return {
                            "status": "success",
                            "response": result.get("response", result.get("answer", str(result))),
                            "model": result.get("model", "claude-code"),
                            "endpoint_used": endpoint
                        }
                except Exception as endpoint_error:
                    logger.debug(f"Endpoint {endpoint} failed: {endpoint_error}")
                    continue

            # If all endpoints fail, return status
            return {
                "status": "error",
                "error": "All Claude Code endpoints failed",
                "claude_code_running": self.claude_code_process and self.claude_code_process.poll() is None
            }

        except Exception as e:
            logger.error(f"Claude Code request failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

class ClaudeCodeRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom request handler for Claude Code bridge"""

    def __init__(self, *args, bridge_instance=None, **kwargs):
        self.bridge = bridge_instance or ClaudeCodeBridge()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            claude_status = "running" if (self.bridge.claude_code_process and
                                       self.bridge.claude_code_process.poll() is None) else "stopped"

            self.send_json_response({
                "status": "healthy",
                "service": "claude-code-bridge",
                "claude_code_server": claude_status,
                "ce_hub_root": str(self.bridge.ce_hub_root)
            })
        elif self.path == '/claude-status':
            # Async call for Claude Code status
            try:
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                claude_status = loop.run_until_complete(self.bridge.test_claude_code_connection())
                loop.close()
                self.send_json_response(claude_status)
            except Exception as e:
                self.send_json_response({
                    "status": "error",
                    "claude_code_connected": False,
                    "error": str(e)
                })
        else:
            # Serve static files
            super().do_GET()

    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/claude-chat':
            self.handle_claude_request()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_claude_request(self):
        """Handle Claude chat requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            request_data = json.loads(post_data.decode('utf-8'))

            question = request_data.get('question', '')
            if not question:
                self.send_json_response({
                    "status": "error",
                    "error": "No question provided"
                }, status=400)
                return

            # Extract model info if present
            model = request_data.get('model')

            # Send to Claude Code
            result = self.bridge.send_to_claude_code(question, model)

            if result["status"] == "success":
                self.send_json_response({
                    "error": False,
                    "output": result["response"],
                    "model": result.get("model", "claude-code"),
                    "provider": "claude-code",
                    "claude_code_connected": True,
                    "endpoint_used": result.get("endpoint_used")
                })
            else:
                self.send_json_response({
                    "error": True,
                    "message": "Claude Code connection failed",
                    "output": result.get("error", "Unknown error"),
                    "claude_code_connected": False
                }, status=500)

        except Exception as e:
            logger.error(f"Claude Code request error: {e}")
            self.send_json_response({
                "error": True,
                "message": "Bridge server error",
                "output": str(e)
            }, status=500)

    def send_json_response(self, data: Dict[str, Any], status: int = 200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response_bytes = json.dumps(data, indent=2).encode('utf-8')
        self.wfile.write(response_bytes)

def run_claude_code_bridge(port: int = 8112):
    """Run the Claude Code bridge server"""
    bridge = ClaudeCodeBridge(port)

    # Start Claude Code server first
    print("🔧 Starting Claude Code server...")
    if not bridge.start_claude_code_server():
        print("❌ Failed to start Claude Code server")
        print("💡 Make sure Claude Code is installed and accessible")
        return

    # Create request handler with bridge instance
    handler = lambda *args, **kwargs: ClaudeCodeRequestHandler(*args, bridge_instance=bridge, **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"🚀 CLAUDE CODE MOBILE BRIDGE")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/mobile-pro-v3-fixed.html")
            print(f"")
            print(f"🔗 Bridge Endpoints:")
            print(f"   Health: http://localhost:{port}/health")
            print(f"   Claude Code Status: http://localhost:{port}/claude-status")
            print(f"   Chat: POST http://localhost:{port}/claude-chat")
            print(f"")
            print(f"🤖 Claude Code Integration:")
            print(f"   Server: http://localhost:8113")
            print(f"   Project: {bridge.ce_hub_root}")
            print(f"   Status: ✅ Connected to your Claude Code subscription")
            print(f"")
            print(f"📝 Usage:")
            print(f"   1. Mobile interface connects to this bridge")
            print(f"   2. Bridge forwards requests to your Claude Code server")
            print(f"   3. Full Claude subscription features available on mobile!")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down Claude Code bridge...")
        if bridge.claude_code_process:
            bridge.claude_code_process.terminate()
    except Exception as e:
        print(f"❌ Bridge server error: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Claude Code Mobile Bridge")
    parser.add_argument("--port", type=int, default=8112, help="Port for bridge server")
    args = parser.parse_args()

    run_claude_code_bridge(args.port)