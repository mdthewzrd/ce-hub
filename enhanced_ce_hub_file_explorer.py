#!/usr/bin/env python3
"""
Enhanced CE-Hub File Explorer with Mobile API Support
Provides both file exploration and mobile interface API endpoints
"""

import http.server
import socketserver
import json
import os
import urllib.parse
from pathlib import Path
import argparse

class EnhancedCEHubFileExplorerHandler(http.server.SimpleHTTPRequestHandler):
    """Enhanced file explorer handler for CE-Hub directory with mobile API support"""

    def __init__(self, *args, ce_hub_root=None, **kwargs):
        self.ce_hub_root = Path(ce_hub_root) if ce_hub_root else Path.cwd()
        super().__init__(*args, directory=str(self.ce_hub_root), **kwargs)

    def log_message(self, format, *args):
        """Suppress default logging"""
        pass

    def do_GET(self):
        """Handle GET requests for files, directory listing, and API endpoints"""
        try:
            parsed_path = urllib.parse.urlparse(self.path)

            # API endpoints for mobile interface
            if parsed_path.path == '/agents':
                self.handle_agents_api()
            elif parsed_path.path == '/read-file':
                self.handle_read_file_api(parsed_path.query)
            elif parsed_path.path == '/files':
                # Directory listing request
                self.handle_directory_listing(parsed_path.query)
            elif parsed_path.path.startswith('/files/'):
                # File request - remove /files prefix and serve from actual directory
                relative_path = parsed_path.path[7:]  # Remove '/files' prefix
                actual_path = self.ce_hub_root / relative_path

                if actual_path.is_file():
                    # Serve the file
                    self.serve_file(actual_path)
                elif actual_path.is_dir():
                    # Redirect to directory listing
                    query_params = urllib.parse.parse_qs(parsed_path.query)
                    query_params['path'] = [str(actual_path.relative_to(self.ce_hub_root))]
                    new_query = urllib.parse.urlencode(query_params, doseq=True)
                    self.send_response(302)
                    self.send_header('Location', f'/files?{new_query}')
                    self.end_headers()
                else:
                    self.send_error(404, "File not found")
            else:
                # Static file serving
                super().do_GET()

        except Exception as e:
            self.send_error(500, f"Server error: {str(e)}")

    def handle_agents_api(self):
        """Handle /agents API endpoint for mobile interface"""
        try:
            # Load agent configuration from dispatch config
            config_path = self.ce_hub_root / 'core' / 'config' / 'agent_dispatch.json'

            if config_path.exists():
                with open(config_path, 'r') as f:
                    config = json.load(f)

                agents = []
                for agent_name, agent_config in config.get('auto_dispatch', {}).get('rules', {}).items():
                    agents.append({
                        'id': agent_name,
                        'name': agent_name.replace('-', ' ').title(),
                        'description': ', '.join(agent_config.get('capabilities', [])),
                        'status': 'available',
                        'capabilities': agent_config.get('capabilities', []),
                        'triggers': agent_config.get('triggers', [])
                    })
            else:
                # Fallback agent list
                agents = [
                    {
                        'id': 'ce-hub-orchestrator',
                        'name': 'CE Hub Orchestrator',
                        'description': 'Coordinates and routes tasks across specialized agents',
                        'status': 'available',
                        'capabilities': ['task_analysis', 'agent_routing', 'workflow_coordination']
                    },
                    {
                        'id': 'research-intelligence-specialist',
                        'name': 'Research Intelligence Specialist',
                        'description': 'Researches and analyzes complex topics',
                        'status': 'available',
                        'capabilities': ['research', 'analysis', 'knowledge_synthesis']
                    },
                    {
                        'id': 'ce-hub-engineer',
                        'name': 'CE Hub Engineer',
                        'description': 'Implements technical solutions and code development',
                        'status': 'available',
                        'capabilities': ['coding', 'implementation', 'system_architecture']
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
        """Handle /read-file API endpoint for mobile interface"""
        try:
            query_params = urllib.parse.parse_qs(query)
            file_path = query_params.get('path', [''])[0]

            if not file_path:
                self.send_json_response({
                    'success': False,
                    'error': 'Missing file path parameter'
                }, status=400)
                return

            # Security check - ensure path is within CE-Hub root
            try:
                full_path = (self.ce_hub_root / file_path).resolve()
                full_path.relative_to(self.ce_hub_root.resolve())
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
                # For binary files, return base64 encoded content
                import base64
                with open(full_path, 'rb') as f:
                    content = base64.b64encode(f.read()).decode('ascii')

                self.send_json_response({
                    'success': True,
                    'content': content,
                    'path': str(full_path.relative_to(self.ce_hub_root)),
                    'name': full_path.name,
                    'size': full_path.stat().st_size,
                    'binary': True
                })
                return

            # Determine file type
            file_extension = full_path.suffix.lower()
            file_type = 'text'
            if file_extension in ['.py', '.js', '.ts', '.html', '.css', '.json', '.md', '.txt']:
                file_type = 'code'
            elif file_extension in ['.jpg', '.jpeg', '.png', '.gif', '.svg']:
                file_type = 'image'
            elif file_extension in ['.mp4', '.webm', '.mov']:
                file_type = 'video'

            self.send_json_response({
                'success': True,
                'content': content,
                'path': str(full_path.relative_to(self.ce_hub_root)),
                'name': full_path.name,
                'size': full_path.stat().st_size,
                'type': file_type,
                'extension': file_extension,
                'binary': False
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f"Failed to read file: {str(e)}"
            }, status=500)

    def handle_directory_listing(self, query):
        """Handle directory listing requests"""
        try:
            # Parse query parameters to get path
            query_params = urllib.parse.parse_qs(query)
            path_param = query_params.get('path', [''])
            relative_path = path_param[0] if path_param[0] else '.'

            # Security check - ensure path is within CE-Hub root
            try:
                requested_path = (self.ce_hub_root / relative_path).resolve()
                requested_path.relative_to(self.ce_hub_root.resolve())
            except (ValueError, OSError):
                self.send_error(400, "Invalid path - access denied")
                return

            if not requested_path.exists():
                self.send_error(404, "Directory not found")
                return

            if requested_path.is_file():
                # If it's a file, show file info
                self.send_json_response({
                    "type": "file",
                    "name": requested_path.name,
                    "path": str(requested_path.relative_to(self.ce_hub_root)),
                    "size": requested_path.stat().st_size,
                    "modified": requested_path.stat().st_mtime,
                    "parent": str(requested_path.parent.relative_to(self.ce_hub_root)) if requested_path.parent != self.ce_hub_root else None
                })
                return

            # Get directory contents
            items = []
            try:
                for item in requested_path.iterdir():
                    try:
                        stat = item.stat()
                        item_info = {
                            "name": item.name,
                            "path": str(item.relative_to(self.ce_hub_root)),
                            "type": "directory" if item.is_dir() else "file",
                            "size": stat.st_size if item.is_file() else 0,
                            "modified": stat.st_mtime,
                            "permissions": oct(stat.st_mode)[-3:]
                        }

                        # Add additional info for different file types
                        if item.is_file():
                            # Get file extension
                            if '.' in item.name:
                                item_info["extension"] = item.name.split('.')[-1].lower()

                            # Check for common file types
                            if item.name.endswith(('.md', '.txt', '.py', '.js', '.html', '.css', '.json')):
                                item_info["previewable"] = True
                            elif item.name.endswith(('.jpg', '.jpeg', '.png', '.gif', '.svg')):
                                item_info["image"] = True
                            elif item.name.endswith(('.mp4', '.webm', '.mov')):
                                item_info["video"] = True
                            elif item.name.endswith(('.mp3', '.wav', '.ogg')):
                                item_info["audio"] = True

                        items.append(item_info)
                    except (OSError, PermissionError):
                        # Skip files we can't access
                        continue
            except PermissionError:
                self.send_error(403, "Permission denied")
                return

            # Sort items: directories first, then files, both alphabetically
            items.sort(key=lambda x: (x["type"] != "directory", x["name"].lower()))

            # Build response
            response_data = {
                "type": "directory",
                "path": str(requested_path.relative_to(self.ce_hub_root)),
                "items": items,
                "parent": str(requested_path.parent.relative_to(self.ce_hub_root)) if requested_path.parent != self.ce_hub_root else None,
                "root": str(self.ce_hub_root)
            }

            self.send_json_response(response_data)

        except Exception as e:
            self.send_error(500, f"Directory listing error: {str(e)}")

    def serve_file(self, file_path):
        """Serve a specific file"""
        try:
            # Determine content type
            content_type = self.guess_type(str(file_path))

            # Read file
            with open(file_path, 'rb') as f:
                content = f.read()

            # Send response
            self.send_response(200)
            self.send_header('Content-Type', content_type)
            self.send_header('Content-Length', str(len(content)))
            self.send_header('Cache-Control', 'no-cache')
            self.end_headers()
            self.wfile.write(content)

        except PermissionError:
            self.send_error(403, "Permission denied")
        except FileNotFoundError:
            self.send_error(404, "File not found")
        except Exception as e:
            self.send_error(500, f"File serving error: {str(e)}")

    def send_json_response(self, data, status=200):
        """Send JSON response"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Cache-Control', 'no-cache')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        """Handle OPTIONS requests (CORS preflight)"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

def run_enhanced_ce_hub_file_explorer(port=8107, ce_hub_root=None):
    """Run enhanced CE-Hub file explorer server with mobile API support"""
    if ce_hub_root is None:
        ce_hub_root = Path.cwd()
    else:
        ce_hub_root = Path(ce_hub_root)

    # Make sure the CE-Hub root exists
    if not ce_hub_root.exists():
        print(f"❌ CE-Hub directory not found: {ce_hub_root}")
        return

    # Create handler with CE-Hub root
    handler = lambda *args, **kwargs: EnhancedCEHubFileExplorerHandler(*args, ce_hub_root=str(ce_hub_root), **kwargs)

    try:
        with socketserver.TCPServer(('0.0.0.0', port), handler) as httpd:
            local_ip = '100.95.223.19'

            print(f"🚀 ENHANCED CE-HUB FILE EXPLORER WITH MOBILE API")
            print(f"")
            print(f"📂 Serving Directory:")
            print(f"   {ce_hub_root}")
            print(f"")
            print(f"📱 Mobile Access:")
            print(f"   http://{local_ip}:{port}/files")
            print(f"")
            print(f"💻 Local Access:")
            print(f"   http://localhost:{port}/files")
            print(f"")
            print(f"🔗 API Endpoints:")
            print(f"   Directory listing: GET /files?path=<relative_path>")
            print(f"   File access: GET /files/<relative_path>")
            print(f"   Agents list: GET /agents")
            print(f"   Read file: GET /read-file?path=<relative_path>")
            print(f"")
            print(f"📝 Usage Examples:")
            print(f"   View root: http://{local_ip}:{port}/files")
            print(f"   View core: http://{local_ip}:{port}/files?path=core")
            print(f"   View mobile: http://{local_ip}:{port}/files?path=core/interfaces/mobile")
            print(f"   Get agents: http://{local_ip}:{port}/agents")
            print(f"")

            httpd.serve_forever()

    except KeyboardInterrupt:
        print(f"\n🛑 Shutting down enhanced CE-Hub file explorer...")
    except Exception as e:
        print(f"❌ Enhanced file explorer server error: {e}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="Enhanced CE-Hub File Explorer Server with Mobile API Support")
    parser.add_argument("--port", type=int, default=8107, help="Port for file explorer server")
    parser.add_argument("--ce-hub-root", type=str, help="Path to CE-Hub directory (default: current directory)")

    args = parser.parse_args()

    run_enhanced_ce_hub_file_explorer(args.port, args.ce_hub_root)