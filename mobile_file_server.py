#!/usr/bin/env python3
"""
Mobile-friendly CE-Hub file server with API endpoints
Provides both file serving and basic API endpoints for mobile interface
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from pathlib import Path

class MobileFileHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

    def do_GET(self):
        """Handle GET requests"""
        try:
            parsed_path = urllib.parse.urlparse(self.path)

            # API endpoints for mobile interface
            if parsed_path.path == '/agents':
                self.handle_agents_api()
            elif parsed_path.path == '/read-file':
                self.handle_read_file_api(parsed_path.query)
            elif parsed_path.path == '/files-api':
                # Custom files API endpoint
                self.handle_files_api(parsed_path.query)
            else:
                # Static file serving
                super().do_GET()

        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def handle_agents_api(self):
        """Handle /agents API endpoint"""
        try:
            # Return hardcoded agent list for now
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
                },
                {
                    'id': 'ce-hub-gui-specialist',
                    'name': 'CE Hub GUI Specialist',
                    'description': 'Designs and develops user interfaces',
                    'status': 'available',
                    'capabilities': ['ui_design', 'frontend_development', 'user_experience'],
                    'triggers': ['ui', 'design', 'interface']
                },
                {
                    'id': 'qa-tester',
                    'name': 'QA Tester',
                    'description': 'Tests and validates implementations',
                    'status': 'available',
                    'capabilities': ['testing', 'quality_assurance', 'validation'],
                    'triggers': ['test', 'validate', 'verify']
                }
            ]

            self.send_json_response({
                'success': True,
                'agents': agents,
                'count': len(agents)
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f"Failed to load agents: {str(e)}"
            }, status=500)

    def handle_read_file_api(self, query):
        """Handle /read-file API endpoint"""
        try:
            query_params = urllib.parse.parse_qs(query)
            file_path = query_params.get('path', [''])[0]

            if not file_path:
                self.send_json_response({
                    'success': False,
                    'error': 'Missing file path parameter'
                }, status=400)
                return

            # Build full path
            full_path = Path.cwd() / file_path

            # Security check
            try:
                full_path.resolve().relative_to(Path.cwd().resolve())
            except ValueError:
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

            # Get file info
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

    def handle_files_api(self, query):
        """Handle /files-api endpoint for directory listing"""
        try:
            query_params = urllib.parse.parse_qs(query)
            path_param = query_params.get('path', [''])
            relative_path = path_param[0] if path_param[0] else '.'

            # Build full path
            if relative_path == '.' or relative_path == '':
                requested_path = Path.cwd()
            else:
                requested_path = Path.cwd() / relative_path

            # Security check - use string comparison instead of Path.relative_to for paths with spaces
            try:
                cwd = Path.cwd().resolve()
                req_path = requested_path.resolve()
                # Check if requested path is within current directory by checking if the path starts with cwd
                if not str(req_path).startswith(str(cwd)):
                    raise ValueError("Path outside allowed directory")
            except (ValueError, OSError):
                self.send_json_response({
                    'success': False,
                    'error': 'Invalid path - access denied'
                }, status=403)
                return

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
                    'path': str(requested_path.relative_to(Path.cwd())),
                    'size': stat.st_size,
                    'modified': stat.st_mtime
                })
                return

            # Get directory contents
            items = []
            try:
                for item in requested_path.iterdir():
                    if item.name.startswith('.'):
                        continue  # Skip hidden files

                    try:
                        stat = item.stat()
                        item_info = {
                            'name': item.name,
                            'path': str(item.relative_to(Path.cwd())),
                            'type': 'directory' if item.is_dir() else 'file',
                            'size': stat.st_size if item.is_file() else 0,
                            'modified': stat.st_mtime
                        }

                        # Add additional info for files
                        if item.is_file():
                            if '.' in item.name:
                                item_info['extension'] = item.name.split('.')[-1].lower()

                            # Check for previewable files
                            if item.name.endswith(('.md', '.txt', '.py', '.js', '.html', '.css', '.json')):
                                item_info['previewable'] = True

                        items.append(item_info)
                    except (OSError, PermissionError):
                        continue

            except PermissionError:
                self.send_json_response({
                    'success': False,
                    'error': 'Permission denied'
                }, status=403)
                return

            # Sort items: directories first, then files
            items.sort(key=lambda x: (x['type'] != 'directory', x['name'].lower()))

            self.send_json_response({
                'success': True,
                'type': 'directory',
                'path': str(requested_path.relative_to(Path.cwd())) if str(requested_path.relative_to(Path.cwd())) != '.' else '',
                'items': items,
                'parent': str(requested_path.parent.relative_to(Path.cwd())) if requested_path.parent != Path.cwd() else None
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f"Directory listing error: {str(e)}"
            }, status=500)

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

def run_mobile_file_server(port=8107):
    """Run mobile file server"""
    try:
        with socketserver.TCPServer(('0.0.0.0', port), MobileFileHandler) as httpd:
            local_ip = '100.95.223.19'

            print(f"🚀 MOBILE CE-HUB FILE SERVER")
            print(f"")
            print(f"📂 Serving Directory: {Path.cwd()}")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/")
            print(f"")
            print(f"💻 Local Access:")
            print(f"   http://localhost:{port}/")
            print(f"")
            print(f"🔗 API Endpoints:")
            print(f"   Agents list: GET /agents")
            print(f"   Read file: GET /read-file?path=<relative_path>")
            print(f"   Directory list: GET /files-api?path=<relative_path>")
            print(f"")
            print(f"📝 Usage:")
            print(f"   Browse files: http://{local_ip}:{port}/")
            print(f"   Get agents: http://{local_ip}:{port}/agents")
            print(f"   List files: http://{local_ip}:{port}/files-api")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Mobile file server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    import argparse
    parser = argparse.ArgumentParser(description="Mobile CE-Hub File Server")
    parser.add_argument("--port", type=int, default=8107, help="Port")

    args = parser.parse_args()
    run_mobile_file_server(args.port)