#!/usr/bin/env python3
"""
Simple HTTP server for CE-Hub Mobile Shell
Serves the mobile shell with proper MIME types and CORS headers
"""

import http.server
import socketserver
import os
import sys
import mimetypes
from urllib.parse import urlparse, parse_qs

# Set up MIME types
mimetypes.add_type('application/javascript', '.js')
mimetypes.add_type('text/css', '.css')
mimetypes.add_type('application/manifest+json', '.json')

class MobileShellHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler for mobile shell with CORS and proper headers"""

    def end_headers(self):
        # Add CORS headers
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')

        # Add security headers
        self.send_header('X-Content-Type-Options', 'nosniff')
        self.send_header('X-Frame-Options', 'SAMEORIGIN')
        self.send_header('X-XSS-Protection', '1; mode=block')

        # PWA headers
        self.send_header('Service-Worker-Allowed', '/')

        super().end_headers()

    def do_OPTIONS(self):
        """Handle preflight requests"""
        self.send_response(200)
        self.end_headers()

    def do_GET(self):
        """Handle GET requests with proper routing"""
        parsed_path = urlparse(self.path)
        path = parsed_path.path

        # Route handling
        if path == '/' or path == '/index.html' or path == '/mobile':
            self.serve_index()
        elif path.startswith('/api/'):
            self.handle_api(path)
        elif path == '/manifest.json':
            self.serve_manifest()
        elif path == '/sw.js':
            self.serve_service_worker()
        else:
            # Serve static files
            super().do_GET()

    def serve_index(self):
        """Serve the main mobile.html file"""
        try:
            with open('mobile.html', 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', 'text/html; charset=utf-8')
            self.send_header('Content-length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, 'Mobile file not found')

    def serve_manifest(self):
        """Serve the PWA manifest with proper headers"""
        try:
            with open('manifest.json', 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', 'application/manifest+json')
            self.send_header('Content-length', str(len(content)))
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, 'Manifest not found')

    def serve_service_worker(self):
        """Serve the service worker with proper headers"""
        try:
            with open('sw.js', 'rb') as f:
                content = f.read()

            self.send_response(200)
            self.send_header('Content-type', 'application/javascript')
            self.send_header('Content-length', str(len(content)))
            # Service worker must not be cached
            self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
            self.send_header('Pragma', 'no-cache')
            self.send_header('Expires', '0')
            self.end_headers()
            self.wfile.write(content)
        except FileNotFoundError:
            self.send_error(404, 'Service worker not found')

    def handle_api(self, path):
        """Handle API requests (placeholder for future API endpoints)"""
        if path == '/api/health':
            self.serve_health()
        elif path == '/api/config':
            self.serve_config()
        else:
            self.send_error(404, 'API endpoint not found')

    def serve_health(self):
        """Health check endpoint"""
        response = {
            'status': 'ok',
            'service': 'ce-hub-mobile-shell',
            'version': '1.0.0'
        }

        import json
        content = json.dumps(response).encode('utf-8')

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Content-length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def serve_config(self):
        """Serve mobile shell configuration"""
        config = {
            'version': '1.0.0',
            'features': {
                'gestures': True,
                'offline': True,
                'pwa': True,
                'vscode_integration': True
            },
            'vscode_url': 'https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8093/'
        }

        import json
        content = json.dumps(config).encode('utf-8')

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Content-length', str(len(content)))
        self.end_headers()
        self.wfile.write(content)

    def log_message(self, format, *args):
        """Enhanced logging"""
        print(f"[{self.address_string()}] {format % args}")

def main():
    """Main server function"""
    # Get port from environment or use default
    port = int(os.environ.get('PORT', 8094))
    host = os.environ.get('HOST', '0.0.0.0')

    # Change to the mobile-shell directory
    script_dir = os.path.dirname(os.path.abspath(__file__))
    os.chdir(script_dir)

    # Create server
    with socketserver.TCPServer((host, port), MobileShellHandler) as httpd:
        print(f"🚀 CE-Hub Mobile Shell Server")
        print(f"📱 Serving at http://{host}:{port}")
        print(f"📁 Directory: {script_dir}")
        print(f"🔗 VS Code: https://michaels-macbook-pro-2.tail6d4c6d.ts.net:8093/")
        print(f"✨ Features: PWA, Touch Gestures, Offline Support")
        print(f"🌐 Access on mobile: http://{get_local_ip()}:{port}")
        print()
        print("Press Ctrl+C to stop the server")

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n🛑 Server stopped")

def get_local_ip():
    """Get the local IP address for mobile access"""
    import socket
    try:
        # Connect to a remote address to determine local IP
        s = socket.socket(socket.AF_INET, socket.SOCK_DGRAM)
        s.connect(("8.8.8.8", 80))
        ip = s.getsockname()[0]
        s.close()
        return ip
    except:
        return "localhost"

if __name__ == '__main__':
    main()