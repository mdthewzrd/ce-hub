#!/usr/bin/env python3
"""
Simple file server for CE-Hub directory
"""

import http.server
import socketserver
import json
import os
from pathlib import Path
import urllib.parse

class SimpleFileServerHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, directory=None, **kwargs):
        self.directory = Path(directory) if directory else Path.cwd()
        super().__init__(*args, directory=str(self.directory), **kwargs)

    def do_GET(self):
        if self.path.startswith('/files'):
            self.handle_file_api()
        else:
            super().do_GET()

    def handle_file_api(self):
        """Handle file API requests"""
        try:
            parsed = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed.query)

            # Get requested path, default to root
            rel_path = query_params.get('path', ['.'])[0]
            if rel_path == '/':
                rel_path = '.'

            # Build full path
            full_path = self.directory / rel_path

            # Security: ensure we're within the directory
            try:
                full_path.resolve().relative_to(self.directory.resolve())
            except ValueError:
                self.send_error(403, "Access denied")
                return

            if not full_path.exists():
                self.send_error(404, "Not found")
                return

            if full_path.is_file():
                # Return file info
                stat = full_path.stat()
                response = {
                    "type": "file",
                    "name": full_path.name,
                    "path": str(full_path.relative_to(self.directory)),
                    "size": stat.st_size,
                    "modified": stat.st_mtime
                }
            else:
                # Return directory listing
                items = []
                for item in full_path.iterdir():
                    if item.name.startswith('.'):
                        continue  # Skip hidden files

                    try:
                        stat = item.stat()
                        item_data = {
                            "name": item.name,
                            "path": str(item.relative_to(self.directory)),
                            "type": "directory" if item.is_dir() else "file",
                            "size": stat.st_size if item.is_file() else 0,
                            "modified": stat.st_mtime
                        }

                        # Add file type hints
                        if item.is_file() and '.' in item.name:
                            item_data["extension"] = item.name.split('.')[-1].lower()

                        items.append(item_data)
                    except (OSError, PermissionError):
                        continue

                items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))

                response = {
                    "type": "directory",
                    "name": full_path.name,
                    "path": str(full_path.relative_to(self.directory)) if str(full_path.relative_to(self.directory)) != '.' else '',
                    "items": items,
                    "parent": str(full_path.parent.relative_to(self.directory)) if full_path.parent != self.directory else None
                }

            self.send_json_response(response)

        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def send_json_response(self, data):
        """Send JSON response"""
        json_data = json.dumps(data, indent=2)
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        """Handle CORS preflight"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_simple_file_server(port=8107, directory=None):
    """Run simple file server"""
    if directory is None:
        directory = Path.cwd()
    else:
        directory = Path(directory)

    if not directory.exists():
        print(f"❌ Directory not found: {directory}")
        return

    handler = lambda *args, **kwargs: SimpleFileServerHandler(*args, directory=directory, **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"🚀 CE-HUB FILE SERVER")
            print(f"📂 Serving: {directory}")
            print(f"📱 Mobile: http://{local_ip}:{port}/files")
            print(f"💻 Local: http://localhost:{port}/files")
            print(f"🔗 API: GET /files?path=<relative_path>")
            print(f"")
            print(f"✅ Server running on port {port}")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Simple CE-Hub File Server")
    parser.add_argument("--port", type=int, default=8107, help="Port")
    parser.add_argument("--dir", type=str, help="Directory to serve")

    args = parser.parse_args()
    run_simple_file_server(args.port, args.dir)