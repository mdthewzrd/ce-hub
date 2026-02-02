#!/usr/bin/env python3
"""
Working CE-Hub API Server - Returns actual CE-Hub directory contents
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from pathlib import Path

class CEHubWorkingAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        # Set the working directory to CE-Hub root first
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub")
        # Change directory to CE-Hub root for static file serving
        os.chdir(str(self.ce_hub_root))
        super().__init__(*args, directory=str(self.ce_hub_root), **kwargs)

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_path = urllib.parse.urlparse(self.path)

            # API endpoints
            if parsed_path.path == '/agents':
                self.handle_agents_api()
            elif parsed_path.path == '/files-api':
                self.handle_files_api(parsed_path.query)
            elif parsed_path.path == '/read-file':
                self.handle_read_file_api(parsed_path.query)
            else:
                # Static file serving from CE-Hub root
                self.serve_static_file(parsed_path.path)

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f"Server error: {str(e)}"
            }, status=500)

    def handle_agents_api(self):
        """Handle /agents API endpoint"""
        agents = [
            {
                'id': 'ce-hub-orchestrator',
                'name': 'CE Hub Orchestrator',
                'description': 'Coordinates and routes tasks across specialized agents',
                'status': 'available',
                'capabilities': ['task_analysis', 'agent_routing', 'workflow_coordination'],
                'triggers': ['coordinate', 'orchestrate', 'manage workflow']
            },
            {
                'id': 'research-intelligence-specialist',
                'name': 'Research Intelligence Specialist',
                'description': 'Researches and analyzes complex topics',
                'status': 'available',
                'capabilities': ['research', 'analysis', 'knowledge_synthesis'],
                'triggers': ['research', 'analyze', 'investigate']
            },
            {
                'id': 'ce-hub-engineer',
                'name': 'CE Hub Engineer',
                'description': 'Implements technical solutions and code development',
                'status': 'available',
                'capabilities': ['coding', 'implementation', 'system_architecture'],
                'triggers': ['implement', 'build', 'fix']
            }
        ]

        self.send_json_response({
            'success': True,
            'agents': agents,
            'count': len(agents)
        })

    def handle_files_api(self, query):
        """Handle /files-api endpoint - returns CE-Hub directory listing"""
        try:
            query_params = urllib.parse.parse_qs(query)
            path_param = query_params.get('path', [''])[0]

            # Use CE-Hub root as base
            if not path_param or path_param == '':
                requested_path = self.ce_hub_root
            else:
                requested_path = self.ce_hub_root / path_param

            if not requested_path.exists():
                self.send_json_response({
                    'success': False,
                    'error': 'Path not found'
                }, status=404)
                return

            if requested_path.is_file():
                # Return file info
                stat = requested_path.stat()
                self.send_json_response({
                    'success': True,
                    'type': 'file',
                    'name': requested_path.name,
                    'path': str(requested_path.relative_to(self.ce_hub_root)),
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })
                return

            # Get directory contents
            items = []
            try:
                for item in requested_path.iterdir():
                    if item.name.startswith('.'):
                        continue

                    try:
                        stat = item.stat()
                        item_info = {
                            'name': item.name,
                            'path': str(item.relative_to(self.ce_hub_root)),
                            'type': 'directory' if item.is_dir() else 'file',
                            'size': stat.st_size if item.is_file() else 0,
                            'modified': stat.st_mtime
                        }

                        if item.is_file() and '.' in item.name:
                            item_info['extension'] = item.name.split('.')[-1].lower()

                        items.append(item_info)
                    except (OSError, PermissionError):
                        continue
            except PermissionError:
                self.send_json_response({
                    'success': False,
                    'error': 'Permission denied'
                }, status=403)
                return

            # Sort: directories first, then files
            items.sort(key=lambda x: (x['type'] != 'directory', x['name'].lower()))

            # Calculate parent path
            parent_path = None
            if requested_path != self.ce_hub_root:
                parent_path = str(requested_path.parent.relative_to(self.ce_hub_root))
                if parent_path == '.':
                    parent_path = ''

            self.send_json_response({
                'success': True,
                'type': 'directory',
                'path': str(requested_path.relative_to(self.ce_hub_root)),
                'items': items,
                'parent': parent_path
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f"Directory listing error: {str(e)}"
            }, status=500)

    def handle_read_file_api(self, query):
        """Handle /read-file endpoint - reads files from CE-Hub directory"""
        try:
            query_params = urllib.parse.parse_qs(query)
            file_path = query_params.get('path', [''])[0]

            if not file_path:
                self.send_json_response({
                    'success': False,
                    'error': 'Missing file path parameter'
                }, status=400)
                return

            # Build full path in CE-Hub directory
            full_path = self.ce_hub_root / file_path

            # Security check
            try:
                full_path = full_path.resolve()
                if not str(full_path).startswith(str(self.ce_hub_root.resolve())):
                    raise ValueError("Path outside CE-Hub directory")
            except (ValueError, OSError):
                self.send_json_response({
                    'success': False,
                    'error': 'Invalid file path - access denied'
                }, status=403)
                return

            if not full_path.exists() or not full_path.is_file():
                self.send_json_response({
                    'success': False,
                    'error': 'File not found'
                }, status=404)
                return

            # Read file content
            try:
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()
            except UnicodeDecodeError:
                self.send_json_response({
                    'success': False,
                    'error': 'Binary file - cannot display as text'
                }, status=400)
                return

            stat = full_path.stat()
            self.send_json_response({
                'success': True,
                'content': content,
                'path': file_path,
                'name': full_path.name,
                'size': stat.st_size,
                'type': 'text'
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f"Failed to read file: {str(e)}"
            }, status=500)

    def serve_static_file(self, path):
        """Serve static files from CE-Hub directory"""
        if path == '/':
            path = '/index.html'

        # Remove leading slash and find file in CE-Hub directory
        relative_path = path.lstrip('/')
        full_path = self.ce_hub_root / relative_path

        if not full_path.exists():
            self.send_error(404, "File not found")
            return

        if full_path.is_file():
            # Serve the file
            try:
                with open(full_path, 'rb') as f:
                    content = f.read()

                content_type = self.guess_type(str(full_path))
                self.send_response(200)
                self.send_header('Content-Type', content_type)
                self.send_header('Content-Length', str(len(content)))
                self.send_header('Access-Control-Allow-Origin', '*')
                self.end_headers()
                self.wfile.write(content)
            except Exception as e:
                self.send_error(500, f"Error serving file: {str(e)}")
        else:
            self.send_error(404, "File not found")

    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

def run_ce_hub_working_api(port=8107):
    """Run working CE-Hub API server"""
    try:
        with socketserver.TCPServer(('0.0.0.0', port), CEHubWorkingAPIHandler) as httpd:
            local_ip = '100.95.223.19'

            print(f"🚀 CE-HUB WORKING API SERVER")
            print(f"")
            print(f"📂 Serving Directory: {Path('/Users/michaeldurante/ai dev/ce-hub')}")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/")
            print(f"")
            print(f"💻 Local Access:")
            print(f"   http://localhost:{port}/")
            print(f"")
            print(f"🔗 API Endpoints:")
            print(f"   Agents: GET /agents")
            print(f"   Files: GET /files-api?path=<relative_path>")
            print(f"   Read file: GET /read-file?path=<relative_path>")
            print(f"")
            print(f"✅ Ready for mobile file explorer connections!")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 CE-Hub API server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Working CE-Hub API Server")
    parser.add_argument("--port", type=int, default=8107, help="Port")

    args = parser.parse_args()
    run_ce_hub_working_api(args.port)