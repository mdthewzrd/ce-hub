#!/usr/bin/env python3
"""
Simple mobile server that serves the mobile VS Code wrapper
No external dependencies required
"""

import http.server
import socketserver
from pathlib import Path
import json
from urllib.parse import urlparse

class SimpleMobileHandler(http.server.SimpleHTTPRequestHandler):
    """Simple handler for mobile VS Code wrapper"""

    def __init__(self, *args, **kwargs):
        self.script_dir = Path(__file__).parent
        super().__init__(*args, directory=str(self.script_dir), **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/mobile' or parsed_path.path == '/mobile/':
            self.serve_mobile_wrapper()
        elif parsed_path.path == '/mobile-status':
            self.serve_status()
        elif parsed_path.path.startswith('/mobile-'):
            self.serve_mobile_assets()
        else:
            self.send_redirect_to_mobile()

    def serve_mobile_wrapper(self):
        """Serve the mobile VS Code wrapper"""
        mobile_file = self.script_dir / "mobile-endpoint.html"

        if mobile_file.exists():
            try:
                with open(mobile_file, 'r', encoding='utf-8') as f:
                    content = f.read()

                self.send_response(200)
                self.send_header('Content-type', 'text/html; charset=utf-8')
                self.send_header('X-Frame-Options', 'SAMEORIGIN')
                self.send_header('Cache-Control', 'no-cache, no-store, must-revalidate')
                self.send_header('Pragma', 'no-cache')
                self.send_header('Expires', '0')
                self.end_headers()

                self.wfile.write(content.encode('utf-8'))
                print(f"📱 Served mobile wrapper to {self.address_string()}")

            except Exception as e:
                self.send_error(500, f"Error serving mobile wrapper: {e}")
        else:
            self.send_error(404, "Mobile wrapper file not found - check mobile-endpoint.html exists")

    def serve_status(self):
        """Serve status information"""
        status = {
            "mobile_wrapper": "online",
            "vscode_url": "http://100.95.223.19:8080",
            "mobile_endpoint": f"http://localhost:{self.server.server_address[1]}/mobile",
            "files_available": {
                "mobile_endpoint": (self.script_dir / "mobile-endpoint.html").exists(),
                "mobile_wrapper": (self.script_dir / "mobile-vscode-wrapper.html").exists(),
                "setup_guide": (self.script_dir / "MOBILE_VSCODE_SETUP.md").exists()
            },
            "instructions": [
                "Visit /mobile for the mobile VS Code wrapper",
                "Ensure VS Code is running on http://100.95.223.19:8080",
                "Use F12 to open dev tools and apply optimizations"
            ],
            "timestamp": "2025-11-22T23:50:00Z"
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        self.wfile.write(json.dumps(status, indent=2).encode('utf-8'))

    def serve_mobile_assets(self):
        """Serve mobile-related files"""
        # Map requests to actual files
        file_mapping = {
            '/mobile-wrapper': 'mobile-vscode-wrapper.html',
            '/mobile-setup': 'MOBILE_VSCODE_SETUP.md',
            '/mobile-guide': 'MOBILE_VSCODE_SETUP.md'
        }

        filename = file_mapping.get(self.path)
        if filename:
            file_path = self.script_dir / filename
            if file_path.exists():
                with open(file_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                if filename.endswith('.md'):
                    content_type = 'text/markdown; charset=utf-8'
                else:
                    content_type = 'text/html; charset=utf-8'

                self.send_response(200)
                self.send_header('Content-type', content_type)
                self.end_headers()
                self.wfile.write(content.encode('utf-8'))
                return

        self.send_error(404, "Mobile asset not found")

    def send_redirect_to_mobile(self):
        """Redirect root requests to mobile interface"""
        redirect_html = f"""
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>📱 Mobile VS Code Server</title>
    <style>
        body {{
            font-family: -apple-system, BlinkMacSystemFont, sans-serif;
            background: #1e1e1e;
            color: #d4d4d4;
            text-align: center;
            padding: 20px;
            margin: 0;
        }}
        .container {{
            max-width: 400px;
            margin: 40px auto;
        }}
        .logo {{ font-size: 64px; margin-bottom: 20px; }}
        .title {{ font-size: 24px; font-weight: 600; margin-bottom: 10px; }}
        .subtitle {{ color: #888; margin-bottom: 30px; }}
        .button {{
            background: #007acc;
            color: white;
            border: none;
            padding: 16px 24px;
            border-radius: 8px;
            font-size: 16px;
            text-decoration: none;
            display: inline-block;
            margin: 8px;
            cursor: pointer;
            transition: background 0.2s;
        }}
        .button:hover {{ background: #005a9e; }}
        .status {{
            background: #2d2d30;
            border-radius: 8px;
            padding: 20px;
            margin: 20px 0;
            text-align: left;
        }}
        .status-item {{
            margin: 8px 0;
            font-size: 14px;
        }}
        .online {{ color: #4CAF50; }}
        .offline {{ color: #f44747; }}
    </style>
</head>
<body>
    <div class="container">
        <div class="logo">📱</div>
        <div class="title">Mobile VS Code Server</div>
        <div class="subtitle">Ready to serve your mobile development needs</div>

        <a href="/mobile" class="button">📱 Open Mobile VS Code</a>
        <a href="/mobile-status" class="button">📊 Server Status</a>

        <div class="status">
            <div class="status-item">📱 <strong>Mobile Interface:</strong> <span class="online">Online</span></div>
            <div class="status-item">💻 <strong>VS Code Target:</strong> http://100.95.223.19:8080</div>
            <div class="status-item">🔗 <strong>Mobile URL:</strong> <a href="/mobile">http://localhost:{self.server.server_address[1]}/mobile</a></div>
        </div>

        <div style="margin-top: 30px; color: #888; font-size: 12px;">
            Make sure VS Code is running on port 8080 for the mobile wrapper to work properly.
        </div>
    </div>
</body>
</html>
"""

        self.send_response(200)
        self.send_header('Content-type', 'text/html; charset=utf-8')
        self.end_headers()
        self.wfile.write(redirect_html.encode('utf-8'))

    def log_message(self, format, *args):
        """Custom log formatting with emoji"""
        print(f"📱 {self.address_string()} - {format % args}")

def run_simple_mobile_server(port=8082):
    """Run the simple mobile server"""
    try:
        with socketserver.TCPServer(("", port), SimpleMobileHandler) as httpd:
            print(f"📱 Simple Mobile VS Code Server")
            print(f"=" * 50)
            print(f"🌐 Server: http://localhost:{port}/")
            print(f"📱 Mobile: http://localhost:{port}/mobile")
            print(f"📊 Status: http://localhost:{port}/mobile-status")
            print(f"🎯 VS Code: http://100.95.223.19:8080/ (target)")
            print(f"🛑 Press Ctrl+C to stop")
            print()

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Mobile server stopped")
    except OSError as e:
        if e.errno == 48:  # Address already in use (macOS)
            print(f"❌ Port {port} is already in use")
            print(f"💡 Try: python3 simple-mobile-server.py --port {port + 1}")
        else:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Simple Mobile VS Code Server")
    parser.add_argument("--port", type=int, default=8082,
                       help="Port to run on (default: 8082)")

    args = parser.parse_args()
    run_simple_mobile_server(args.port)