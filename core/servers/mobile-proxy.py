#!/usr/bin/env python3
"""
Mobile proxy server that adds a /mobile endpoint to your existing VS Code server
This runs on a different port and provides the mobile wrapper
"""

import http.server
import socketserver
import requests
from urllib.parse import urlparse, parse_qs
from pathlib import Path
import json

class MobileProxyHandler(http.server.SimpleHTTPRequestHandler):
    """Proxy handler that adds mobile endpoints"""

    def __init__(self, *args, **kwargs):
        self.script_dir = Path(__file__).parent
        self.vscode_url = "http://100.95.223.19:8080"
        super().__init__(*args, directory=str(self.script_dir), **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urlparse(self.path)

        if parsed_path.path == '/mobile' or parsed_path.path == '/mobile/':
            self.serve_mobile_wrapper()
        elif parsed_path.path == '/mobile-optimize':
            self.serve_optimization_guide()
        elif parsed_path.path == '/mobile-status':
            self.serve_mobile_status()
        else:
            # Proxy other requests to VS Code server
            self.proxy_to_vscode()

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
                self.send_header('Cache-Control', 'no-cache')
                self.end_headers()

                self.wfile.write(content.encode('utf-8'))
                print(f"📱 Served mobile wrapper to {self.address_string()}")

            except Exception as e:
                self.send_error(500, f"Error serving mobile wrapper: {e}")
        else:
            self.send_error(404, "Mobile wrapper file not found")

    def serve_optimization_guide(self):
        """Serve optimization instructions as JSON"""
        optimization_script = '''
// 📱 Mobile VS Code Optimization Script
(function() {
    console.log('📱 Applying Mobile Optimizations...');

    const style = document.createElement('style');
    style.id = 'mobile-optimizations';
    style.innerHTML = `
        /* Mobile-friendly fonts and sizing */
        .monaco-workbench { font-size: 16px !important; }

        /* Larger touch targets */
        .monaco-list-row, .monaco-tree-row {
            min-height: 44px !important;
            font-size: 16px !important;
            padding: 8px 12px !important;
        }

        /* Hide minimap on mobile */
        .minimap-shadow-visible { display: none !important; }
        .editor-widget.minimap { display: none !important; }

        /* Larger scrollbars */
        .monaco-scrollable-element > .scrollbar {
            width: 16px !important;
            height: 16px !important;
        }

        /* Activity bar optimization */
        .monaco-workbench .part.activitybar .action-item {
            width: 60px !important;
            height: 50px !important;
        }

        /* Editor optimization */
        .monaco-editor {
            font-size: 16px !important;
            line-height: 1.5 !important;
        }

        /* Touch-friendly elements */
        .monaco-button, .monaco-inputbox {
            min-height: 44px !important;
            font-size: 16px !important;
        }
    `;

    document.head.appendChild(style);
    console.log('✅ Mobile optimizations applied!');

    // Force layout refresh
    setTimeout(() => {
        window.dispatchEvent(new Event('resize'));
    }, 100);
})();
'''

        response = {
            "optimization_script": optimization_script,
            "instructions": [
                "Open VS Code Developer Tools (F12)",
                "Go to Console tab",
                "Paste the optimization script",
                "Press Enter to execute",
                "Look for '✅ Mobile optimizations applied!' message"
            ],
            "mobile_features": [
                "16px fonts for better mobile readability",
                "44px touch targets for accessibility",
                "Hidden minimap to maximize screen space",
                "Larger scrollbars for touch interaction"
            ]
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        self.wfile.write(json.dumps(response, indent=2).encode('utf-8'))

    def serve_mobile_status(self):
        """Serve mobile status information"""
        try:
            # Check if VS Code server is responding
            response = requests.get(f"{self.vscode_url}/", timeout=5)
            vscode_status = "online" if response.status_code in [200, 302] else "offline"
        except:
            vscode_status = "offline"

        status = {
            "mobile_wrapper": "online",
            "vscode_server": vscode_status,
            "vscode_url": self.vscode_url,
            "mobile_endpoint": f"http://{self.server.server_address[0]}:{self.server.server_address[1]}/mobile",
            "optimization_guide": f"http://{self.server.server_address[0]}:{self.server.server_address[1]}/mobile-optimize",
            "timestamp": "2025-11-22T23:49:00Z"
        }

        self.send_response(200)
        self.send_header('Content-type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()

        self.wfile.write(json.dumps(status, indent=2).encode('utf-8'))

    def proxy_to_vscode(self):
        """Proxy requests to VS Code server"""
        try:
            response = requests.get(f"{self.vscode_url}{self.path}", timeout=10)

            self.send_response(response.status_code)

            # Forward headers
            for header, value in response.headers.items():
                if header.lower() not in ['connection', 'transfer-encoding']:
                    self.send_header(header, value)

            self.end_headers()
            self.wfile.write(response.content)

        except Exception as e:
            self.send_error(502, f"Proxy error: {e}")

    def log_message(self, format, *args):
        """Custom log formatting"""
        print(f"📱 {self.address_string()} - {format % args}")

def run_mobile_proxy(port=8081):
    """Run the mobile proxy server"""
    try:
        with socketserver.TCPServer(("", port), MobileProxyHandler) as httpd:
            print(f"📱 Mobile VS Code Proxy starting...")
            print(f"🌐 Proxy server: http://localhost:{port}/")
            print(f"📱 Mobile interface: http://localhost:{port}/mobile")
            print(f"📊 Status endpoint: http://localhost:{port}/mobile-status")
            print(f"🔧 Optimization guide: http://localhost:{port}/mobile-optimize")
            print(f"⚡ VS Code proxied from: http://100.95.223.19:8080/")
            print(f"🛑 Press Ctrl+C to stop")
            print()

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Mobile proxy stopped")
    except OSError as e:
        if e.errno == 98:
            print(f"❌ Port {port} is already in use")
            print(f"💡 Try: python mobile-proxy.py --port 8082")
        else:
            print(f"❌ Error: {e}")

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Mobile VS Code Proxy Server")
    parser.add_argument("--port", type=int, default=8081,
                       help="Port for the mobile proxy (default: 8081)")

    args = parser.parse_args()

    print("📱 Mobile VS Code Proxy Server")
    print("=" * 50)
    run_mobile_proxy(args.port)