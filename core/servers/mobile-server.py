#!/usr/bin/env python3
"""
Simple HTTP server to serve the mobile VS Code wrapper at /mobile endpoint
This can be used to serve the mobile interface on your VS Code server
"""

import http.server
import socketserver
import os
from urllib.parse import urlparse
from pathlib import Path

class MobileVSCodeHandler(http.server.SimpleHTTPRequestHandler):
    """Custom handler to serve mobile VS Code wrapper"""

    def __init__(self, *args, **kwargs):
        self.script_dir = Path(__file__).parent
        super().__init__(*args, directory=str(self.script_dir), **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/mobile' or parsed_path.path == '/mobile/':
            # Serve mobile VS Code wrapper
            self.serve_mobile_wrapper()
        elif parsed_path.path == '/mobile-vscode' or parsed_path.path == '/mobile-vscode/':
            # Alternative endpoint
            self.serve_mobile_wrapper()
        else:
            # Default behavior for other paths
            super().do_GET()

    def serve_mobile_wrapper(self):
        """Serve the mobile VS Code wrapper HTML"""
        mobile_file = self.script_dir / "mobile-endpoint.html"

        if mobile_file.exists():
            try:
                with open(mobile_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_header('Content-length', str(len(content.encode('utf-8'))))

                # Add mobile-friendly headers
                self.send_header('X-UA-Compatible', 'IE=edge')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')

                self.end_headers()
                self.wfile.write(content.encode('utf-8'))

                print(f"📱 Served mobile VS Code wrapper to {self.address_string()}")

            except Exception as e:
                self.send_error(500, f"Error reading mobile wrapper: {e}")
        else:
            self.send_error(404, "Mobile VS Code wrapper not found")

    def log_message(self, format, *args):
        """Override to add emoji to log messages"""
        print(f"🌐 {self.address_string()} - {format % args}")

def run_server(port=8080):
    """Run the mobile VS Code server"""
    try:
        with socketserver.TCPServer(("", port), MobileVSCodeHandler) as httpd:
            print(f"📱 Mobile VS Code Server starting...")
            print(f"🌐 Server running at http://localhost:{port}/")
            print(f"📱 Mobile interface at http://localhost:{port}/mobile")
            print(f"🔧 VS Code optimization guide at http://localhost:{port}/mobile-vscode")
            print(f"⚡ Press Ctrl+C to stop the server")
            print()

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped by user")
    except OSError as e:
        if e.errno == 98:  # Address already in use
            print(f"❌ Port {port} is already in use.")
            print(f"💡 Try a different port: python mobile-server.py --port 8081")
        else:
            print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Mobile VS Code Server")
    parser.add_argument("--port", type=int, default=8080,
                       help="Port to run the server on (default: 8080)")

    args = parser.parse_args()

    print("📱 Mobile VS Code Wrapper Server")
    print("=" * 50)
    print()

    run_server(args.port)