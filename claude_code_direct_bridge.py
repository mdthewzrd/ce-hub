#!/usr/bin/env python3
"""
Direct Claude Code Bridge
Uses Claude Code CLI directly to leverage your existing subscription
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
import threading
import queue
import time

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(name)s | %(levelname)s | %(message)s"
)
logger = logging.getLogger(__name__)

class DirectClaudeCodeBridge:
    """Direct bridge using Claude Code CLI"""

    def __init__(self, port: int = 8112):
        self.port = port
        self.ce_hub_root = Path(__file__).parent
        self.claude_executable = "/opt/homebrew/bin/claude"

    async def send_to_claude_code(self, question: str, model: str = None) -> Dict[str, Any]:
        """Send question directly to Claude Code CLI"""
        try:
            # Build the command
            cmd = [
                self.claude_executable,
                '--print',                          # Non-interactive mode
                '--output-format', 'json',         # JSON output
                '--dangerously-skip-permissions',  # Skip permission prompts for mobile
                '--append-system-prompt',          # Add mobile context
                'You are responding through a mobile CE-Hub interface. Be concise and mobile-friendly.'
            ]

            # Add model if specified
            if model:
                cmd.extend(['--model', model])

            # Add the question as the final argument
            cmd.append(question)

            logger.info(f"Executing: {' '.join(cmd[:6])}... [question]")

            # Execute Claude Code
            process = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=self.ce_hub_root,
                stdout=asyncio.subprocess.PIPE,
                stderr=asyncio.subprocess.PIPE,
                text=True
            )

            stdout, stderr = await process.communicate()

            if process.returncode == 0:
                try:
                    # Parse JSON response
                    result = json.loads(stdout)

                    # Extract the actual response content
                    if isinstance(result, dict):
                        response_text = result.get('response', result.get('text', str(result)))
                    else:
                        response_text = str(result)

                    return {
                        "status": "success",
                        "response": response_text,
                        "model": model or "claude-default",
                        "provider": "claude-code-subscription",
                        "usage": result.get('usage') if isinstance(result, dict) else None
                    }

                except json.JSONDecodeError:
                    # Fallback: treat stdout as plain text response
                    return {
                        "status": "success",
                        "response": stdout.strip(),
                        "model": model or "claude-default",
                        "provider": "claude-code-subscription"
                    }

            else:
                logger.error(f"Claude Code CLI failed with return code {process.returncode}")
                logger.error(f"stderr: {stderr}")

                return {
                    "status": "error",
                    "error": f"Claude Code CLI failed (code {process.returncode})",
                    "stderr": stderr,
                    "stdout": stdout
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
            # Quick test command
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

class DirectClaudeRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Request handler for direct Claude Code bridge"""

    def __init__(self, *args, bridge_instance=None, **kwargs):
        self.bridge = bridge_instance or DirectClaudeCodeBridge()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            test_result = self.bridge.test_claude_code_access()

            self.send_json_response({
                "status": "healthy",
                "service": "direct-claude-code-bridge",
                "ce_hub_root": str(self.bridge.ce_hub_root),
                "claude_code_test": test_result
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
        """Handle Claude chat requests using Claude Code CLI"""
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

            # Extract additional parameters
            model = request_data.get('model')

            # Add CE-Hub mobile context to the question
            enhanced_question = f"""[CE-Hub Mobile Interface Request]
{question}

Context: You are responding through the CE-Hub mobile interface with access to:
- CE-Hub project directory: {self.bridge.ce_hub_root}
- MCP servers: Archon, Playwright
- Mobile-optimized responses appreciated
"""

            # Run async function in sync context
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)
            try:
                result = loop.run_until_complete(
                    self.bridge.send_to_claude_code(enhanced_question, model)
                )
            finally:
                loop.close()

            if result["status"] == "success":
                self.send_json_response({
                    "error": False,
                    "output": result["response"],
                    "model": result.get("model", "claude-default"),
                    "provider": result.get("provider", "claude-code-subscription"),
                    "usage": result.get("usage"),
                    "claude_code_connected": True,
                    "ce_hub_integration": True
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

def run_direct_claude_bridge(port: int = 8112):
    """Run the direct Claude Code bridge server"""
    bridge = DirectClaudeCodeBridge(port)

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
    handler = lambda *args, **kwargs: DirectClaudeRequestHandler(*args, bridge_instance=bridge, **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"")
            print(f"🚀 DIRECT CLAUDE CODE MOBILE BRIDGE")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/mobile-pro-v3-fixed.html")
            print(f"")
            print(f"🤖 Claude Code Integration:")
            print(f"   CLI: {bridge.claude_executable}")
            print(f"   Project: {bridge.ce_hub_root}")
            print(f"   Status: ✅ Connected to your Claude subscription")
            print(f"   MCP: Archon + Playwright servers loaded")
            print(f"")
            print(f"📝 How it works:")
            print(f"   1. Mobile interface sends requests to this bridge")
            print(f"   2. Bridge executes 'claude --print --output-format json'")
            print(f"   3. Your Claude subscription processes the request")
            print(f"   4. Response returned to mobile interface")
            print(f"")
            print(f"🔗 Bridge Endpoints:")
            print(f"   Health: http://localhost:{port}/health")
            print(f"   Chat: POST http://localhost:{port}/claude-chat")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 Shutting down Claude Code bridge...")
    except Exception as e:
        print(f"❌ Bridge server error: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Direct Claude Code Mobile Bridge")
    parser.add_argument("--port", type=int, default=8112, help="Port for bridge server")
    args = parser.parse_args()

    run_direct_claude_bridge(args.port)