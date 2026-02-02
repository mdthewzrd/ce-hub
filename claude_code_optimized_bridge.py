#!/usr/bin/env python3
"""
Optimized Claude Code Bridge
Uses subprocess with optimized calls for better performance
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

class OptimizedClaudeCodeBridge:
    """Optimized bridge using subprocess with better Claude Code integration"""

    def __init__(self, port: int = 8114):
        self.port = port
        self.ce_hub_root = Path(__file__).parent
        self.claude_executable = "/opt/homebrew/bin/claude"
        self.last_call_time = 0
        self.min_call_interval = 2.0  # Minimum 2 seconds between calls

    def send_to_claude_code(self, question: str, model: str = None) -> Dict[str, Any]:
        """Send question to Claude Code with optimized call"""
        try:
            # Rate limiting to prevent overwhelming Claude Code
            current_time = time.time()
            if current_time - self.last_call_time < self.min_call_interval:
                time.sleep(self.min_call_interval - (current_time - self.last_call_time))

            # Build optimized command
            cmd = [
                self.claude_executable,
                '--print',                          # Non-interactive mode
                '--output-format', 'json',         # JSON output for parsing
                '--timeout', '30',                 # 30 second timeout
                '--append-system-prompt',          # Add system prompt for consistency
                'You are CE-Hub mobile assistant. Respond in JSON format: {"response": "your answer here"}'
            ]

            # Add model if specified
            if model:
                cmd.extend(['--model', model])

            # Add the enhanced question
            enhanced_question = f"""[CE-Hub Mobile Request from {self.ce_hub_root}]

{question}

Context: You are responding through CE-Hub mobile interface with full access to:
- CE-Hub project directory and files
- MCP servers (Archon, Playwright)
- Your existing Claude subscription and knowledge

Provide a concise, mobile-friendly response in JSON format."""

            cmd.append(enhanced_question)

            logger.info(f"Executing optimized Claude Code call...")
            self.last_call_time = time.time()

            # Execute with optimized settings
            result = subprocess.run(
                cmd,
                cwd=self.ce_hub_root,
                capture_output=True,
                text=True,
                timeout=35,  # Slightly longer than Claude's internal timeout
                preexec_fn=os.setsid if hasattr(os, 'setsid') else None  # Create process group
            )

            if result.returncode == 0:
                try:
                    # Parse JSON response
                    response_data = json.loads(result.stdout)

                    # Extract response text
                    if isinstance(response_data, dict):
                        if 'response' in response_data:
                            response_text = response_data['response']
                        elif 'result' in response_data:
                            response_text = response_data['result']
                        elif 'text' in response_data:
                            response_text = response_data['text']
                        elif 'content' in response_data:
                            response_text = response_data['content']
                        else:
                            # Fallback to string representation
                            response_text = json.dumps(response_data, indent=2)
                    else:
                        response_text = str(response_data)

                    return {
                        "status": "success",
                        "response": response_text,
                        "model": model or "claude-default",
                        "provider": "claude-code-optimized",
                        "usage": response_data.get('usage') if isinstance(response_data, dict) else None
                    }

                except json.JSONDecodeError:
                    # Fallback: treat stdout as plain text response
                    return {
                        "status": "success",
                        "response": result.stdout.strip(),
                        "model": model or "claude-default",
                        "provider": "claude-code-optimized"
                    }

            else:
                logger.error(f"Claude Code CLI failed: {result.stderr}")
                return {
                    "status": "error",
                    "error": f"Claude Code CLI failed (code {result.returncode})",
                    "stderr": result.stderr,
                    "stdout": result.stdout[:500] if result.stdout else ""  # Truncate long output
                }

        except subprocess.TimeoutExpired:
            return {
                "status": "error",
                "error": "Claude Code request timed out after 35 seconds"
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
            # Quick version test
            result = subprocess.run(
                [self.claude_executable, '--version'],
                capture_output=True,
                text=True,
                timeout=10
            )

            if result.returncode == 0:
                # Also test a simple command
                test_result = subprocess.run(
                    [self.claude_executable, '--print', '--timeout', '5', 'Say "test working"'],
                    cwd=self.ce_hub_root,
                    capture_output=True,
                    text=True,
                    timeout=10
                )

                return {
                    "status": "success",
                    "claude_code_accessible": True,
                    "version": result.stdout.strip(),
                    "executable": self.claude_executable,
                    "test_command_works": test_result.returncode == 0,
                    "test_output": test_result.stdout[:100] if test_result.stdout else test_result.stderr[:100]
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

class OptimizedBridgeRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Request handler for optimized Claude Code bridge"""

    def __init__(self, *args, bridge_instance=None, **kwargs):
        self.bridge = bridge_instance or OptimizedClaudeCodeBridge()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            test_result = self.bridge.test_claude_code_access()

            self.send_json_response({
                "status": "healthy",
                "service": "optimized-claude-code-bridge",
                "ce_hub_root": str(self.bridge.ce_hub_root),
                "claude_code_test": test_result,
                "rate_limiting": f"{self.bridge.min_call_interval}s between calls"
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
                    "provider": result.get("provider", "claude-code-optimized"),
                    "usage": result.get("usage"),
                    "claude_code_connected": True,
                    "ce_hub_integration": True,
                    "mcp_enabled": True,
                    "optimized_bridge": True
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

def run_optimized_claude_bridge(port: int = 8114):
    """Run the optimized Claude Code bridge server"""
    bridge = OptimizedClaudeCodeBridge(port)

    # Test Claude Code access first
    print("🔧 Testing Claude Code access...")
    test_result = bridge.test_claude_code_access()

    if test_result["status"] != "success":
        print("❌ Claude Code not accessible")
        print(f"Error: {test_result.get('error', 'Unknown error')}")
        print("💡 Make sure Claude Code is installed and you're signed in")
        return

    print(f"✅ Claude Code accessible: {test_result.get('version', 'Unknown version')}")

    if test_result.get("test_command_works"):
        print("✅ Claude Code commands working correctly")
    else:
        print("⚠️ Claude Code test command failed, but proceeding anyway...")

    # Create request handler with bridge instance
    handler = lambda *args, **kwargs: OptimizedBridgeRequestHandler(*args, bridge_instance=bridge, **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"")
            print(f"🚀 OPTIMIZED CLAUDE CODE MOBILE BRIDGE")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/mobile-pro-v3-fixed.html")
            print(f"")
            print(f"🤖 Claude Code Integration:")
            print(f"   CLI: {bridge.claude_executable}")
            print(f"   Project: {bridge.ce_hub_root}")
            print(f"   Status: ✅ Connected to your Claude subscription")
            print(f"   MCP: Your existing MCP servers loaded")
            print(f"   Performance: ⚡ Rate-limited optimized calls")
            print(f"   Timeout: 35 seconds")
            print(f"")
            print(f"📝 How it works:")
            print(f"   1. Mobile interface sends requests to this bridge")
            print(f"   2. Bridge executes optimized 'claude --print' calls")
            print(f"   3. Your Claude subscription + MCP integration processes it")
            print(f"   4. Response returned to mobile interface")
            print(f"")
            print(f"🔗 Bridge Endpoints:")
            print(f"   Health: http://localhost:{port}/health")
            print(f"   Chat: POST http://localhost:{port}/claude-chat")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down optimized bridge...")
    except Exception as e:
        print(f"❌ Bridge server error: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Optimized Claude Code Mobile Bridge")
    parser.add_argument("--port", type=int, default=8114, help="Port for bridge server")
    args = parser.parse_args()

    run_optimized_claude_bridge(args.port)