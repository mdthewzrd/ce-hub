#!/usr/bin/env python3
"""
Simple Mobile CE-Hub File Explorer - Port 8106
Clean, self-contained solution for mobile file browsing
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from pathlib import Path

class SimpleMobileCEHubHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub")
        super().__init__(*args, directory=str(self.ce_hub_root), **kwargs)

    def log_message(self, format, *args):
        pass  # Suppress logs

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)

        # API endpoints
        if parsed_path.path == '/api/files':
            self.handle_files_api(parsed_path.query)
        elif parsed_path.path == '/api/read':
            self.handle_read_api(parsed_path.query)
        elif parsed_path.path == '/mobile':
            self.serve_mobile_interface()
        else:
            # Static file serving
            super().do_GET()

    def handle_files_api(self, query):
        try:
            query_params = urllib.parse.parse_qs(query)
            path_param = query_params.get('path', [''])[0]

            if not path_param:
                requested_path = self.ce_hub_root
            else:
                # Security check - prevent path traversal
                requested_path = self.ce_hub_root / path_param
                try:
                    requested_path.resolve().relative_to(self.ce_hub_root.resolve())
                except ValueError:
                    self.send_error(403, "Access denied")
                    return

            if not requested_path.exists():
                self.send_json_response({'success': False, 'error': 'Path not found'}, 404)
                return

            if requested_path.is_file():
                stat = requested_path.stat()
                self.send_json_response({
                    'success': True,
                    'type': 'file',
                    'name': requested_path.name,
                    'size': stat.st_size
                })
                return

            # List directory
            items = []
            for item in requested_path.iterdir():
                if item.name.startswith('.'):
                    continue

                try:
                    stat = item.stat()
                    item_info = {
                        'name': item.name,
                        'type': 'directory' if item.is_dir() else 'file',
                        'size': stat.st_size if item.is_file() else 0
                    }
                    items.append(item_info)
                except (OSError, PermissionError):
                    continue

            # Sort: directories first, then files
            items.sort(key=lambda x: (x['type'] != 'directory', x['name'].lower()))

            self.send_json_response({
                'success': True,
                'type': 'directory',
                'items': items,
                'current_path': str(requested_path.relative_to(self.ce_hub_root))
            })

        except Exception as e:
            self.send_json_response({'success': False, 'error': str(e)}, 500)

    def handle_read_api(self, query):
        try:
            query_params = urllib.parse.parse_qs(query)
            file_path = query_params.get('path', [''])[0]

            if not file_path:
                self.send_json_response({'success': False, 'error': 'Missing file path'}, 400)
                return

            # Security check
            full_path = self.ce_hub_root / file_path
            try:
                full_path.resolve().relative_to(self.ce_hub_root.resolve())
            except ValueError:
                self.send_json_response({'success': False, 'error': 'Access denied'}, 403)
                return

            if not full_path.exists() or not full_path.is_file():
                self.send_json_response({'success': False, 'error': 'File not found'}, 404)
                return

            # Read file
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                self.send_json_response({'success': False, 'error': 'Binary file'}, 400)
                return

            self.send_json_response({
                'success': True,
                'content': content,
                'name': full_path.name,
                'size': full_path.stat().st_size
            })

        except Exception as e:
            self.send_json_response({'success': False, 'error': str(e)}, 500)

    def serve_mobile_interface(self):
        # Serve the new professional mobile interface
        with open(self.ce_hub_root / 'mobile-cehub-pro.html', 'r', encoding='utf-8') as f:
            html_content = f.read()

        self.send_response(200)
        self.send_header('Content-Type', 'text/html; charset=utf-8')
        self.send_header('Content-Length', str(len(html_content)))
        self.end_headers()
        self.wfile.write(html_content.encode('utf-8'))

    def send_json_response(self, data, status=200):
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

def run_simple_mobile_cehub(port=8106):
    try:
        with socketserver.TCPServer(('0.0.0.0', port), SimpleMobileCEHubHandler) as httpd:
            local_ip = '100.95.223.19'

            print(f'🚀 SIMPLE MOBILE CE-HUB - PORT {port}')
            print(f'')
            print(f'📱 Mobile Access:')
            print(f'   http://{local_ip}:{port}/mobile')
            print(f'')
            print(f'💻 Desktop Access:')
            print(f'   http://localhost:{port}/mobile')
            print(f'')
            print(f'✅ Clean, simple file explorer')
            print(f'📁 Serving: {Path("/Users/michaeldurante/ai dev/ce-hub")}')
            print(f'')

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f'\\n🛑 Simple CE-Hub server stopped')
    except Exception as e:
        print(f'❌ Server error: {e}')

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Simple Mobile CE-Hub File Explorer")
    parser.add_argument("--port", type=int, default=8106, help="Port")

    args = parser.parse_args()
    run_simple_mobile_cehub(args.port)