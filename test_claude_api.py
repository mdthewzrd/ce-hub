#!/usr/bin/env python3
"""
Test Claude API Server - Quick Mock Response for Testing
"""

import http.server
import socketserver
import json
import time
from datetime import datetime

class TestClaudeHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/claude':
            try:
                # Read request data
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))

                question = data.get('question', '').strip()

                # Mock response
                response = f"""🤖 Test Claude API Response

Question: {question}

Status: ✅ Connection successful!
Server: Running on port 8106
Time: {datetime.now().strftime('%H:%M:%S')}

This is a test response to verify the mobile interface can connect to the Claude API.
The real Claude integration can be configured once the connection is verified.

Available endpoints:
- POST /claude - Claude chat API
- Mobile interface: http://100.95.223.19:8106/mobile-pro-v3-fixed.html
"""

                self.send_json_response({
                    'error': False,
                    'output': response
                })

            except Exception as e:
                self.send_json_response({
                    'error': True,
                    'output': f'Server error: {str(e)}'
                })
        else:
            self.send_error(404, "Endpoint not found")

    def send_json_response(self, data):
        json_data = json.dumps(data, indent=2)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

if __name__ == "__main__":
    port = 8106
    with socketserver.TCPServer(('0.0.0.0', port), TestClaudeHandler) as httpd:
        print(f"🚀 Test Claude API Server running on port {port}")
        print(f"📱 Mobile interface: http://100.95.223.19:{port}/mobile-pro-v3-fixed.html")
        print(f"🔗 API endpoint: http://100.95.223.19:{port}/claude")
        httpd.serve_forever()