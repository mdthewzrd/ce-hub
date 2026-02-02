#!/usr/bin/env python3
"""
Persistent Claude Code Bridge
Uses a persistent Claude Code process to avoid startup overhead
"""

import asyncio
import json
import logging
import subprocess
import sys
import os
import signal
import threading
import time
from pathlib import Path
from typing import Dict, Any, Optional
import http.server
import socketserver
import queue

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class PersistentClaudeCodeBridge:
    """Bridge using persistent Claude Code process"""

    def __init__(self, port: int = 8114):
        self.port = port
        self.ce_hub_root = Path(__file__).parent
        self.claude_executable = "/opt/homebrew/bin/claude"
        self.claude_process = None
        self.request_queue = queue.Queue()
        self.response_queue = queue.Queue()
        self.running = False
        self.process_thread = None

    def start_claude_process(self):
        """Start persistent Claude Code process in interactive mode"""
        try:
            logger.info("Starting persistent Claude Code process...")

            # Start Claude Code in interactive mode
            cmd = [
                self.claude_executable,
                '--project', str(self.ce_hub_root),
                '--append-system-prompt',
                'You are in CE-Hub mobile bridge mode. Respond in JSON format: {"response": "your response"}'
            ]

            self.claude_process = subprocess.Popen(
                cmd,
                cwd=self.ce_hub_root,
                stdin=subprocess.PIPE,
                stdout=subprocess.PIPE,
                stderr=subprocess.PIPE,
                text=True,
                bufsize=0
            )

            # Start thread to monitor the process
            self.process_thread = threading.Thread(target=self._monitor_claude_process)
            self.process_thread.daemon = True
            self.process_thread.start()

            # Give it time to initialize
            time.sleep(3)

            if self.claude_process.poll() is None:
                logger.info("✅ Claude Code process started successfully")
                self.running = True
                return True
            else:
                logger.error("❌ Claude Code process failed to start")
                return False

        except Exception as e:
            logger.error(f"Failed to start Claude Code process: {e}")
            return False

    def _monitor_claude_process(self):
        """Monitor Claude Code process and handle responses"""
        buffer = ""

        while self.running and self.claude_process and self.claude_process.poll() is None:
            try:
                # Read output
                if self.claude_process.poll() is None:
                    output = self.claude_process.stdout.read(1)
                    if output:
                        buffer += output

                        # Try to parse JSON response
                        try:
                            if buffer.strip().startswith('{') and buffer.strip().endswith('}'):
                                # Try to find complete JSON object
                                json_start = buffer.find('{')
                                json_end = buffer.find('}', json_start) + 1

                                if json_end > json_start:
                                    json_str = buffer[json_start:json_end]
                                    response_data = json.loads(json_str)

                                    # Extract response text
                                    if isinstance(response_data, dict) and 'response' in response_data:
                                        self.response_queue.put({
                                            "status": "success",
                                            "response": response_data['response']
                                        })
                                    else:
                                        self.response_queue.put({
                                            "status": "success",
                                            "response": str(response_data)
                                        })

                                    # Keep remainder in buffer
                                    buffer = buffer[json_end:]

                        except json.JSONDecodeError:
                            # Not complete JSON yet, continue reading
                            pass
                        except Exception as e:
                            logger.debug(f"Response parsing error: {e}")

                else:
                    logger.error("Claude Code process died")
                    break

                time.sleep(0.01)  # Small delay to prevent busy waiting

            except Exception as e:
                logger.error(f"Process monitoring error: {e}")
                break

    def send_to_claude_code(self, question: str, model: str = None) -> Dict[str, Any]:
        """Send question to persistent Claude Code process"""
        try:
            if not self.running or not self.claude_process or self.claude_process.poll() is not None:
                return {
                    "status": "error",
                    "error": "Claude Code process not running"
                }

            # Enhance question with CE-Hub context
            enhanced_question = f"""[CE-Hub Mobile Request from {self.ce_hub_root}]

{question}

Respond with JSON format: {{"response": "your answer here"}}"""

            # Send to Claude Code process
            try:
                self.claude_process.stdin.write(enhanced_question + "\n")
                self.claude_process.stdin.flush()

                # Wait for response (with timeout)
                timeout = 45  # 45 seconds timeout
                start_time = time.time()

                while time.time() - start_time < timeout:
                    try:
                        if not self.response_queue.empty():
                            response = self.response_queue.get_nowait()
                            return response
                    except queue.Empty:
                        pass

                    time.sleep(0.1)

                # Timeout occurred
                return {
                    "status": "error",
                    "error": "Claude Code response timeout"
                }

            except Exception as e:
                logger.error(f"Failed to send to Claude Code: {e}")
                return {
                    "status": "error",
                    "error": str(e)
                }

        except Exception as e:
            logger.error(f"Claude Code request failed: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def test_claude_code_access(self) -> Dict[str, Any]:
        """Test if Claude Code is accessible"""
        try:
            result = subprocess.run(
                [self.claude_executable, '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                return {
                    "status": "success",
                    "claude_code_accessible": True,
                    "version": result.stdout.strip(),
                    "executable": self.claude_executable,
                    "persistent_process_running": self.running and self.claude_process and self.claude_process.poll() is None
                }
            else:
                return {
                    "status": "error",
                    "claude_code_accessible": False,
                    "error": result.stderr
                }

        except Exception as e:
            return {
                "status": "error",
                "claude_code_accessible": False,
                "error": str(e)
            }

    def shutdown(self):
        """Shutdown the persistent process"""
        logger.info("Shutting down persistent bridge...")
        self.running = False

        if self.claude_process:
            try:
                self.claude_process.terminate()
                self.claude_process.wait(timeout=5)
            except:
                try:
                    self.claude_process.kill()
                except:
                    pass

class PersistentBridgeRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Request handler for persistent Claude Code bridge"""

    def __init__(self, *args, bridge_instance=None, **kwargs):
        self.bridge = bridge_instance or PersistentClaudeCodeBridge()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            test_result = self.bridge.test_claude_code_access()

            self.send_json_response({
                "status": "healthy",
                "service": "persistent-claude-code-bridge",
                "ce_hub_root": str(self.bridge.ce_hub_root),
                "claude_code_test": test_result,
                "persistent_process_running": self.bridge.running
            })
        else:
            # Serve static files
            super().do_GET()

    def do_OPTIONS(self):
        """Handle OPTIONS requests (CORS preflight)"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

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
                    "error": True,
                    "message": "No question provided",
                    "output": "Please provide a question"
                }, status=400)
                return

            # Extract model parameter
            model = request_data.get('model')

            # Send to Claude Code
            result = self.bridge.send_to_claude_code(question, model)

            if result["status"] == "success":
                self.send_json_response({
                    "error": False,
                    "output": result["response"],
                    "model": model or "claude-default",
                    "provider": "claude-code-persistent",
                    "claude_code_connected": True,
                    "ce_hub_integration": True,
                    "mcp_enabled": True,
                    "persistent_bridge": True
                })
            else:
                self.send_json_response({
                    "error": True,
                    "message": "Claude Code request failed",
                    "output": result.get("error", "Unknown error"),
                    "claude_code_connected": False
                }, status=500)

        except Exception as e:
            logger.error(f"Request handler error: {e}")
            self.send_json_response({
                "error": True,
                "message": "Bridge server error",
                "output": str(e),
                "claude_code_connected": False
            }, status=500)

    def send_json_response(self, data: Dict[str, Any], status: int = 200):
        """Send JSON response"""
        self.send_response(status)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        response_bytes = json.dumps(data, indent=2).encode('utf-8')
        self.wfile.write(response_bytes)

def run_persistent_claude_bridge(port: int = 8114):
    """Run the persistent Claude Code bridge server"""
    bridge = PersistentClaudeCodeBridge(port)

    # Test Claude Code access first
    print("🔧 Testing Claude Code access...")
    test_result = bridge.test_claude_code_access()

    if test_result["status"] != "success":
        print("❌ Claude Code not accessible")
        print(f"Error: {test_result.get('error', 'Unknown error')}")
        print("💡 Make sure Claude Code is installed and you're signed in")
        return

    print(f"✅ Claude Code accessible: {test_result.get('version', 'Unknown version')}")

    # Start persistent process
    print("🚀 Starting persistent Claude Code process...")
    if not bridge.start_claude_process():
        print("❌ Failed to start persistent Claude Code process")
        return

    # Create request handler with bridge instance
    handler = lambda *args, **kwargs: PersistentBridgeRequestHandler(*args, bridge_instance=bridge, **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"")
            print(f"🚀 PERSISTENT CLAUDE CODE MOBILE BRIDGE")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/mobile-pro-v3-fixed.html")
            print(f"")
            print(f"🤖 Claude Code Integration:")
            print(f"   CLI: {bridge.claude_executable}")
            print(f"   Project: {bridge.ce_hub_root}")
            print(f"   Status: ✅ Persistent process running")
            print(f"   MCP: Your existing MCP servers loaded")
            print(f"   Performance: ⚡ Fast responses (no startup overhead)")
            print(f"")
            print(f"📝 How it works:")
            print(f"   1. Mobile interface sends requests to this bridge")
            print(f"   2. Bridge sends to persistent Claude Code process")
            print(f"   3. Your Claude subscription + MCP integration processes it")
            print(f"   4. Response returned to mobile interface instantly")
            print(f"")
            print(f"🔗 Bridge Endpoints:")
            print(f"   Health: http://localhost:{port}/health")
            print(f"   Chat: POST http://localhost:{port}/claude-chat")
            print(f"")

            try:
                httpd.serve_forever()
            except KeyboardInterrupt:
                print("\n🛑 Shutting down persistent bridge...")
            finally:
                bridge.shutdown()

    except Exception as e:
        print(f"❌ Bridge server error: {e}")
        bridge.shutdown()

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Persistent Claude Code Mobile Bridge")
    parser.add_argument("--port", type=int, default=8114, help="Port for bridge server")
    args = parser.parse_args()

    run_persistent_claude_bridge(args.port)