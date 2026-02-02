#!/usr/bin/env python3
"""
Simple JavaScript file server for mobile CE-Hub integration
"""

import http.server
import socketserver
import os
from pathlib import Path

class JavaScriptFileServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub").resolve()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        if self.path == '/mobile_archon_integration.js':
            self.serve_js_file()
        elif self.path == '/health':
            self.send_json_response({
                'status': 'healthy',
                'service': 'javascript-file-server',
                'port': 8122,
                'purpose': 'serve JavaScript integration files'
            })
        else:
            self.send_error(404, "File not found")

    def serve_js_file(self):
        """Serve the mobile Archon integration JavaScript file"""
        try:
            js_file_path = self.ce_hub_root / 'mobile_archon_integration.js'

            if js_file_path.exists():
                with open(js_file_path, 'r', encoding='utf-8') as f:
                    js_content = f.read()

                # Send JavaScript file with proper MIME type
                self.send_response(200)
                self.send_header('Content-Type', 'application/javascript')
                self.send_header('Access-Control-Allow-Origin', '*')
                self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
                self.send_header('Access-Control-Allow-Headers', 'Content-Type')
                self.end_headers()
                self.wfile.write(js_content.encode('utf-8'))
            else:
                self.send_error(404, "JavaScript integration file not found")

        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def send_json_response(self, data, status=200):
        import json
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

if __name__ == "__main__":
    port = 8122
    with socketserver.TCPServer(('0.0.0.0', port), JavaScriptFileServer) as httpd:
        print(f"🚀 JAVASCRIPT FILE SERVER FOR MOBILE CE-HUB")
        print(f"")
        print(f"📱 JavaScript Files: http://100.95.223.19:{port}/")
        print(f"🔗 Integration JS: http://100.95.223.19:{port}/mobile_archon_integration.js")
        print(f"💚 Health Check: http://100.95.223.19:{port}/health")
        print(f"")
        print(f"✅ Purpose: Serve JavaScript integration files for mobile CE-Hub")
        print(f"✅ CORS-enabled for cross-origin requests")
        print(f"")

        httpd.serve_forever()