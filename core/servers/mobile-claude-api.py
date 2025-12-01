#!/usr/bin/env python3
"""
Simple Claude API Server for Mobile Interface
Handles Claude commands with proper escaping and dollar sign fixes
"""

import http.server
import socketserver
import json
import subprocess
import urllib.parse
import argparse
from pathlib import Path

class ClaudeAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub").resolve()
        super().__init__(*args, **kwargs)

    def do_POST(self):
        """Handle POST requests for Claude API"""
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/claude':
            self.handle_claude_request()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_claude_request(self):
        """Handle Claude command requests"""
        try:
            # Read request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            question = data.get('question', '').strip()
            if not question:
                self.send_json_response({
                    'error': True,
                    'output': 'No question provided'
                })
                return

            # Clean and escape the question
            question = self.clean_input(question)

            # Execute Claude command
            try:
                result = subprocess.run(
                    ['claude', '--print', question],
                    cwd=str(self.ce_hub_root),
                    capture_output=True,
                    text=True,
                    timeout=60
                )

                if result.returncode == 0:
                    self.send_json_response({
                        'error': False,
                        'output': result.stdout.strip()
                    })
                else:
                    self.send_json_response({
                        'error': True,
                        'output': f'Claude Error: {result.stderr.strip() or "Unknown error"}'
                    })

            except subprocess.TimeoutExpired:
                self.send_json_response({
                    'error': True,
                    'output': 'Claude request timed out'
                })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'Server error: {str(e)}'
            })

    def clean_input(self, text):
        """Clean and prepare input for Claude"""
        # Remove problematic characters and normalize whitespace
        text = text.strip()

        # Handle dollar signs properly (escape them)
        text = text.replace('$', '\\$')

        # Remove any shell command injection attempts
        dangerous_chars = [';', '&&', '||', '|', '`', '$(', ')']
        for char in dangerous_chars:
            if char in text:
                text = text.replace(char, '')

        return text

    def send_json_response(self, data):
        """Send JSON response"""
        json_data = json.dumps(data).encode('utf-8')

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_data)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        self.wfile.write(json_data)

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def main():
    parser = argparse.ArgumentParser(description='Claude API Server for Mobile')
    parser.add_argument('--port', type=int, default=8106, help='Port to run server on')
    args = parser.parse_args()

    try:
        with socketserver.TCPServer(("", args.port), ClaudeAPIHandler) as httpd:
            print(f"🤖 Claude API Server running on port {args.port}")
            print(f"📱 Mobile interface can now call: http://localhost:{args.port}/claude")
            print(f"🌐 Tailscale access: http://100.95.223.19:{args.port}/claude")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print("✅ Claude API ready for mobile requests")
            print("")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Claude API server")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()