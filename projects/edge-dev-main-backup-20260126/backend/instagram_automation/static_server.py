"""
Simple static file server for content delivery UI
Serves the HTML interface and prepared content files
"""

import os
import http.server
import socketserver
import urllib.parse
from pathlib import Path
import mimetypes

# Configuration
PORT = 8181
DIRECTORY = os.path.dirname(__file__)
CONTENT_DIR = os.path.join(DIRECTORY, "prepared_content")

# Ensure content directory exists
Path(CONTENT_DIR). mkdir(exist_ok=True)


class ContentHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve files and redirect API calls"""

    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=DIRECTORY, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)

        # Serve the delivery UI at root
        if parsed_path.path == '/' or parsed_path.path == '':
            self.serve_delivery_ui()
            return

        # Serve prepared content files
        if parsed_path.path.startswith('/content/'):
            filename = parsed_path.path[8:]  # Remove /content/ prefix
            filepath = os.path.join(CONTENT_DIR, filename)

            if os.path.exists(filepath) and os.path.isfile(filepath):
                self.serve_file(filepath)
            else:
                self.send_error(404, "File not found")
            return

        # Default file serving
        return super().do_GET()

    def serve_delivery_ui(self):
        """Serve the main app UI"""
        # Try app.html first (new unified interface), fall back to delivery_ui.html
        app_path = os.path.join(DIRECTORY, "app.html")
        delivery_path = os.path.join(DIRECTORY, "delivery_ui.html")

        if os.path.exists(app_path):
            self.serve_file(app_path, content_type='text/html')
        elif os.path.exists(delivery_path):
            self.serve_file(delivery_path, content_type='text/html')
        else:
            self.send_error(404, "UI not found")

    def serve_file(self, filepath, content_type=None):
        """Serve a file with correct content type"""
        if content_type is None:
            content_type, _ = mimetypes.guess_type(filepath)
            if content_type is None:
                content_type = 'application/octet-stream'

        with open(filepath, 'rb') as f:
            content = f.read()

        self.send_response(200)
        self.send_header('Content-Type', content_type)
        self.send_header('Content-Length', len(content))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        self.wfile.write(content)

    def end_headers(self):
        """Add CORS headers to all responses"""
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        super().end_headers()


def start_server():
    """Start the static file server"""
    os.chdir(DIRECTORY)

    handler = ContentHTTPRequestHandler
    socketserver.TCPServer.allow_reuse_address = True

    with socketserver.TCPServer(("", PORT), handler) as httpd:
        print("\n" + "=" * 50)
        print("CONTENT DELIVERY SERVER")
        print("=" * 50)
        print(f"\nServer running on http://localhost:{PORT}")
        print(f"\nOpen this URL in your browser:")
        print(f"  → http://localhost:{PORT}")
        print(f"\nServing files from: {DIRECTORY}")
        print(f"Content directory: {CONTENT_DIR}")
        print("\nPress Ctrl+C to stop")
        print("=" * 50)

        try:
            httpd.serve_forever()
        except KeyboardInterrupt:
            print("\n\nServer stopped.")


if __name__ == "__main__":
    start_server()
