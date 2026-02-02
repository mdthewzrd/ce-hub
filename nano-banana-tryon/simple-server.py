#!/usr/bin/env python3
"""
Simple HTTP server for Nano Banana 3D Reconstruction & AR Try-On App
Run this with: python simple-server.py
"""

import http.server
import socketserver
import os
import webbrowser
from pathlib import Path

# Configuration
PORT = 7174
DIRECTORY = "."

class CustomHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        # Handle the /virtual-try-on and /3d-reconstruction routes
        if self.path == '/virtual-try-on' or self.path == '/' or self.path == '/3d-reconstruction':
            self.path = '/public/index.html'
        elif self.path == '/try-on-from-photo':
            self.path = '/public/ai-glasses-editor.html'
        elif self.path == '/src/virtual-try-on.js':
            self.path = '/src/virtual-try-on.js'
        elif self.path == '/src/working-glasses.js':
            self.path = '/src/working-glasses.js'
        elif self.path.startswith('/src/'):
            # Handle all other src files
            pass  # Let super().do_GET() handle it

        # Handle CORS preflight
        if self.path == '/favicon.ico':
            return

        super().do_GET()

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        # Set proper MIME types
        if self.path.endswith('.js'):
            self.send_header('Content-Type', 'application/javascript')
        elif self.path.endswith('.json'):
            self.send_header('Content-Type', 'application/json')
        super().end_headers()

def start_server():
    """Start the local development server"""
    os.chdir(os.path.dirname(os.path.abspath(__file__)))

    with socketserver.TCPServer(("", PORT), CustomHTTPRequestHandler) as httpd:
        print(f"🍌 Nano Banana 3D Reconstruction Server Started!")
        print(f"📍 Server running at: http://localhost:{PORT}/virtual-try-on")
        print(f"📁 Serving directory: {DIRECTORY}/")
        print(f"🛑 Press Ctrl+C to stop the server")

        # Auto-open browser
        try:
            webbrowser.open(f'http://localhost:{PORT}/virtual-try-on')
        except:
            pass

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped gracefully")

if __name__ == "__main__":
    start_server()