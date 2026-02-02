#!/usr/bin/env python3
"""
Simple Claude Code Bridge V2
Most basic implementation without complex options
"""

import json
import logging
import subprocess
import sys
import os
import time
from pathlib import Path
from typing import Dict, Any
import http.server
import socketserver

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class SimpleClaudeCodeBridgeV2:
    """Very simple bridge using basic Claude Code CLI"""

    def __init__(self, port: int = 8114):
        self.port = port
        self.ce_hub_root = Path(__file__).parent
        self.claude_executable = "/opt/homebrew/bin/claude"

    def send_to_claude_code(self, question: str, model: str = None) -> Dict[str, Any]:
        """Send question to Claude Code using the simplest possible approach"""
        try:
            # Build the most basic command
            cmd = [self.claude_executable, '--print']

            # Add model if specified (but skip if not supported)
            if model and model != "claude-default":
                try:
                    # Test if model option works
                    test_cmd = [self.claude_executable, '--model', model, '--print', 'test']
                    test_result = subprocess.run(test_cmd, capture_output=True, text=True, timeout=5)
                    if test_result.returncode == 0:
                        cmd.extend(['--model', model])
                except:
                    # If model option fails, skip it
                    pass

            # Create enhanced question
            enhanced_question = f"""[CE-Hub Mobile Request from {self.ce_hub_root}]

{question}

You are responding through CE-Hub mobile interface with MCP integration enabled."""

            cmd.append(enhanced_question)

            logger.info(f"Executing simple Claude Code call...")

            # Execute with generous timeout
            result = subprocess.run(
                cmd,
                cwd=self.ce_hub_root,
                capture_output=True,
                text=True,
                timeout=60
            )

            if result.returncode == 0:
                response_text = result.stdout.strip()

                # Try to extract JSON if present
                try:
                    if response_text.startswith('{') and response_text.endswith('}'):
                        parsed = json.loads(response_text)
                        if isinstance(parsed, dict) and 'response' in parsed:
                            response_text = parsed['response']
                except:
                    # Not JSON or parsing failed, use as-is
                    pass

                return {
                    "status": "success",
                    "response": response_text,
                    "model": model or "claude-default",
                    "provider": "claude-code-simple-v2"
                }

            else:
                logger.error(f"Claude Code CLI failed: {result.stderr}")
                return {
                    "status": "error",
                    "error": f"Claude Code CLI failed (code {result.returncode})",
                    "stderr": result.stderr,
                    "stdout": result.stdout[:200] if result.stdout else ""
                }

        except subprocess.TimeoutExpired:
            return {
                "status": "error",
                "error": "Claude Code request timed out after 60 seconds"
            }
        except Exception as e:
            logger.error(f"Failed to execute Claude Code CLI: {e}")
            return {
                "status": "error",
                "error": str(e)
            }

    def test_claude_code_access(self) -> Dict[str, Any]:
        """Test if Claude Code is accessible"""
        try:
            # Simple version test
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
                    "executable": self.claude_executable
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

class SimpleBridgeRequestHandlerV2(http.server.SimpleHTTPRequestHandler):
    """Request handler for simple Claude Code bridge V2"""

    def __init__(self, *args, bridge_instance=None, **kwargs):
        self.bridge = bridge_instance or SimpleClaudeCodeBridgeV2()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            test_result = self.bridge.test_claude_code_access()

            self.send_json_response({
                "status": "healthy",
                "service": "simple-claude-code-bridge-v2",
                "ce_hub_root": str(self.bridge.ce_hub_root),
                "claude_code_test": test_result
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
                    "model": result.get("model", "claude-default"),
                    "provider": result.get("provider", "claude-code-simple-v2"),
                    "claude_code_connected": True,
                    "ce_hub_integration": True,
                    "mcp_enabled": True,
                    "simple_bridge": True
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

def run_simple_claude_bridge_v2(port: int = 8114):
    """Run the simple Claude Code bridge V2 server"""
    bridge = SimpleClaudeCodeBridgeV2(port)

    # Test Claude Code access first
    print("🔧 Testing Claude Code access...")
    test_result = bridge.test_claude_code_access()

    if test_result["status"] != "success":
        print("❌ Claude Code not accessible")
        print(f"Error: {test_result.get('error', 'Unknown error')}")
        print("💡 Make sure Claude Code is installed and you're signed in")
        return

    print(f"✅ Claude Code accessible: {test_result.get('version', 'Unknown version')}")

    # Create request handler with bridge instance
    handler = lambda *args, **kwargs: SimpleBridgeRequestHandlerV2(*args, bridge_instance=bridge, **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"")
            print(f"🚀 SIMPLE CLAUDE CODE BRIDGE V2")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/mobile-pro-v3-fixed.html")
            print(f"")
            print(f"🤖 Claude Code Integration:")
            print(f"   CLI: {bridge.claude_executable}")
            print(f"   Project: {bridge.ce_hub_root}")
            print(f"   Status: ✅ Connected to your Claude subscription")
            print(f"   MCP: Your existing MCP servers loaded")
            print(f"   Method: Basic subprocess calls")
            print(f"")
            print(f"📝 How it works:")
            print(f"   1. Mobile interface sends requests to this bridge")
            print(f"   2. Bridge calls 'claude --print' with your question")
            print(f"   3. Your Claude subscription + MCP processes it")
            print(f"   4. Response returned to mobile interface")
            print(f"")
            print(f"🔗 Bridge Endpoints:")
            print(f"   Health: http://localhost:{port}/health")
            print(f"   Chat: POST http://localhost:{port}/claude-chat")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down simple bridge...")
    except Exception as e:
        print(f"❌ Bridge server error: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Simple Claude Code Mobile Bridge V2")
    parser.add_argument("--port", type=int, default=8114, help="Port for bridge server")
    args = parser.parse_args()

    run_simple_claude_bridge_v2(args.port)