#!/usr/bin/env python3
"""
Simple Direct Claude Server - No frills, just real Claude responses
Eliminates all the complexity and ensures direct Claude CLI integration
"""

import http.server
import socketserver
import json
import subprocess
from datetime import datetime
from pathlib import Path

class SimpleDirectClaudeHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub").resolve()
        super().__init__(*args, **kwargs)

    def do_POST(self):
        if self.path == '/claude-chat':
            self.handle_claude_chat()
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        if self.path == '/health':
            self.send_json_response({
                'status': 'healthy',
                'service': 'simple-direct-claude-server',
                'port': 8118,
                'features': ['direct-claude-cli', 'all-models', 'no-filters']
            })
        else:
            self.send_error(404, "Endpoint not found")

    def handle_claude_chat(self):
        """Direct Claude chat with no canned responses or filtering"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            question = data.get('question', '').strip()
            model = data.get('model', 'claude-sonnet-4.5')

            if not question:
                self.send_json_response({
                    'error': True,
                    'output': 'No question provided'
                })
                return

            # Get real Claude response - NO FILTERING, NO CANNED RESPONSES
            response = self.get_real_claude_response(question, model)

            self.send_json_response({
                'error': False,
                'output': response,
                'model': model,
                'timestamp': datetime.now().isoformat(),
                'status': 'connected'
            })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'Server error: {str(e)}',
                'status': 'error'
            })

    def get_real_claude_response(self, question, model):
        """Get actual Claude CLI response with no interference"""
        try:
            # Map model names to Claude CLI
            model_mapping = {
                'claude-3-sonnet': 'claude-3-sonnet',
                'claude-3-haiku': 'claude-3-haiku',
                'claude-3-opus': 'claude-3-opus',
                'claude-sonnet-4': 'claude-sonnet-4',
                'claude-sonnet-4.5': 'claude-sonnet-4.5'
            }

            claude_model = model_mapping.get(model, 'claude-sonnet-4.5')

            # Use Claude CLI directly
            cmd = ['claude', '--model', claude_model, '--print', question]

            result = subprocess.run(
                cmd,
                cwd=str(self.ce_hub_root),
                capture_output=True,
                text=True,
                timeout=120  # 2 minutes for complex responses
            )

            stdout_clean = result.stdout.strip()
            if result.returncode == 0 and stdout_clean:
                # Return Claude's response directly, unfiltered
                return f"""🤖 **Claude Response - {model}**

{stdout_clean}

---
*Via Claude CLI • {datetime.now().strftime('%H:%M:%S')}*
"""
            else:
                # If Claude fails, try again with simpler prompt
                return self.retry_with_fallback(question, model)

        except subprocess.TimeoutExpired:
            return """⏰ **Claude is thinking...**

Your request is taking longer than expected. Claude is working on a detailed response.

Try:
- Breaking your request into smaller parts
- Being more specific about what you need
- Waiting a moment and trying again

---
*Claude Processing*
"""
        except Exception as e:
            return f"""❌ **Claude Connection Issue**

Having trouble connecting to Claude CLI: {str(e)}

Technical details:
- Model: {model}
- Error: {type(e).__name__}

Please try again or contact support if this persists.

---
*Connection Error*
"""

    def retry_with_fallback(self, question, model):
        """Retry with a simpler approach if Claude CLI fails"""
        try:
            # Try with basic model and simpler prompt
            cmd = ['claude', '--print', f"Please help with: {question}"]

            result = subprocess.run(
                cmd,
                cwd=str(self.ce_hub_root),
                capture_output=True,
                text=True,
                timeout=60
            )

            stdout_clean = result.stdout.strip()
            if result.returncode == 0 and stdout_clean:
                return f"""🤖 **Claude Response - {model}**

{stdout_clean}

---
*Via Claude CLI (Fallback) • {datetime.now().strftime('%H:%M:%S')}*
"""
            else:
                return f"""🤔 **Claude is temporarily unavailable**

I'm having trouble connecting to Claude right now. This could be due to:
- Network connectivity issues
- Claude service temporary unavailability
- High demand on the service

Please try again in a few moments.

---
*Service Unavailable*
"""
        except Exception:
            return f"""🤔 **Claude is temporarily unavailable**

I'm having trouble connecting to Claude right now. This could be due to:
- Network connectivity issues
- Claude service temporary unavailability
- High demand on the service

Please try again in a few moments.

---
*Service Unavailable*
"""

    def send_json_response(self, data, status=200):
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == "__main__":
    port = 8118
    with socketserver.TCPServer(('0.0.0.0', port), SimpleDirectClaudeHandler) as httpd:
        print(f"🚀 SIMPLE DIRECT CLAUDE SERVER")
        print(f"")
        print(f"📱 Mobile Interface: http://100.95.223.19:{port}/")
        print(f"🔗 Chat Endpoint: http://100.95.223.19:{port}/claude-chat")
        print(f"💚 Health Check: http://100.95.223.19:{port}/health")
        print(f"")
        print(f"✅ Features:")
        print(f"   • Direct Claude CLI Integration")
        print(f"   • No Canned Responses")
        print(f"   • No Intent Filtering")
        print(f"   • Raw Claude Responses")
        print(f"   • All Claude Models Supported")
        print(f"")

        httpd.serve_forever()