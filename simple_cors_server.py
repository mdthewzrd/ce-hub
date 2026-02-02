#!/usr/bin/env python3
"""
Simple CORS-enabled file server for CE-Hub
"""

import http.server
import socketserver
import os
from pathlib import Path

class CORSFileHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', '*')
        super().end_headers()

    def do_OPTIONS(self):
        self.send_response(200)
        self.end_headers()

def run_cors_server(port=8107, directory=None):
    if directory is None:
        directory = Path.cwd()
    else:
        directory = Path(directory)

    if not directory.exists():
        print(f"❌ Directory not found: {directory}")
        return

    # Change to the directory
    os.chdir(directory)

    with socketserver.TCPServer(('0.0.0.0', port), CORSFileHandler) as httpd:
        local_ip = '100.95.223.19'

        print(f"🚀 CE-HUB CORS FILE SERVER")
        print(f"📂 Serving: {directory}")
        print(f"📱 Mobile: http://{local_ip}:{port}/")
        print(f"💻 Local: http://localhost:{port}/")
        print(f"✅ CORS-enabled server running on port {port}")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print(f"\n🛑 Server stopped")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Simple CORS-enabled CE-Hub File Server")
    parser.add_argument("--port", type=int, default=8107, help="Port")
    parser.add_argument("--dir", type=str, help="Directory to serve")

    args = parser.parse_args()
    run_cors_server(args.port, args.dir)