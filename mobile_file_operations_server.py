#!/usr/bin/env python3
"""
Mobile File Operations Server - Port 8109
Provides file browsing, agents listing, and file operations for mobile interface
"""

import http.server
import socketserver
import json
import urllib.parse
from pathlib import Path

class MobileFileOpsHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub").resolve()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/health':
            self.handle_health()
        elif parsed_path.path == '/agents':
            self.handle_agents()
        elif parsed_path.path == '/read-file':
            self.handle_read_file(parsed_path.query)
        elif parsed_path.path == '/files':
            self.handle_files_api(parsed_path.query)
        else:
            self.send_error(404, "Endpoint not found")

    def handle_health(self):
        """Health check endpoint"""
        self.send_json_response({
            'status': 'healthy',
            'service': 'mobile-file-operations-server',
            'port': 8109,
            'features': ['file-browsing', 'agents', 'file-operations'],
            'ce_hub_root': str(self.ce_hub_root)
        })

    def handle_agents(self):
        """Return available CE-Hub agents"""
        agents = [
            {
                'id': 'ce-hub-orchestrator',
                'name': 'CE Hub Orchestrator',
                'description': 'Coordinates and routes tasks across specialized agents',
                'status': 'available',
                'capabilities': ['task_analysis', 'agent_routing', 'workflow_coordination'],
                'icon': '🎯'
            },
            {
                'id': 'research-intelligence-specialist',
                'name': 'Research Intelligence Specialist',
                'description': 'Researches and analyzes complex topics, market data, and trends',
                'status': 'available',
                'capabilities': ['research', 'analysis', 'knowledge_synthesis', 'market_analysis'],
                'icon': '🔍'
            },
            {
                'id': 'ce-hub-engineer',
                'name': 'CE Hub Engineer',
                'description': 'Implements technical solutions and code development',
                'status': 'available',
                'capabilities': ['coding', 'implementation', 'system_architecture', 'debugging'],
                'icon': '💻'
            },
            {
                'id': 'ce-hub-gui-specialist',
                'name': 'CE Hub GUI Specialist',
                'description': 'Designs and develops user interfaces and mobile experiences',
                'status': 'available',
                'capabilities': ['ui_design', 'frontend_development', 'user_experience', 'mobile_design'],
                'icon': '🎨'
            },
            {
                'id': 'qa-tester',
                'name': 'QA Tester',
                'description': 'Tests and validates implementations and mobile functionality',
                'status': 'available',
                'capabilities': ['testing', 'quality_assurance', 'validation', 'mobile_testing'],
                'icon': '🧪'
            },
            {
                'id': 'trading-scanner-researcher',
                'name': 'Trading Scanner Researcher',
                'description': 'Develops trading algorithms and market analysis tools',
                'status': 'available',
                'capabilities': ['trading_algorithms', 'market_scanners', 'technical_analysis', 'risk_management'],
                'icon': '📈'
            },
            {
                'id': 'realtime-trading-scanner',
                'name': 'Realtime Trading Scanner',
                'description': 'Monitors live market data and trading opportunities',
                'status': 'available',
                'capabilities': ['realtime_monitoring', 'alert_systems', 'market_data_processing'],
                'icon': '📊'
            },
            {
                'id': 'quant-backtest-specialist',
                'name': 'Quant Backtest Specialist',
                'description': 'Validates trading strategies through rigorous backtesting',
                'status': 'available',
                'capabilities': ['strategy_backtesting', 'risk_analysis', 'performance_validation'],
                'icon': '📉'
            }
        ]

        self.send_json_response({
            'success': True,
            'agents': agents,
            'count': len(agents),
            'updated': '2025-11-28'
        })

    def handle_read_file(self, query):
        """Handle file reading with security checks"""
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
            full_path = self.ce_hub_root / file_path

            # Security check
            try:
                full_path.resolve().relative_to(self.ce_hub_root.resolve())
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
                'type': 'text',
                'modified': stat.st_mtime,
                'readable': True
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f'Failed to read file: {str(e)}'
            }, status=500)

    def handle_files_api(self, query):
        """Handle directory listing and file browsing"""
        try:
            query_params = urllib.parse.parse_qs(query)
            path_param = query_params.get('path', [''])
            relative_path = path_param[0] if path_param[0] else '.'

            # Build full path
            if relative_path in ['.', '']:
                requested_path = self.ce_hub_root
            else:
                requested_path = self.ce_hub_root / relative_path

            # Security check
            try:
                cwd = self.ce_hub_root.resolve()
                req_path = requested_path.resolve()
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
                file_info = {
                    'success': True,
                    'type': 'file',
                    'name': requested_path.name,
                    'path': str(requested_path.relative_to(self.ce_hub_root)),
                    'size': stat.st_size,
                    'modified': stat.st_mtime,
                    'readable': True
                }

                # Add file type info
                if requested_path.suffix.lower() in ['.py', '.js', '.html', '.css', '.json', '.md', '.txt']:
                    file_info['previewable'] = True
                if requested_path.suffix.lower() in ['.py']:
                    file_info['language'] = 'python'
                elif requested_path.suffix.lower() in ['.js']:
                    file_info['language'] = 'javascript'
                elif requested_path.suffix.lower() in ['.html']:
                    file_info['language'] = 'html'

                self.send_json_response(file_info)
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
                            'path': str(item.relative_to(self.ce_hub_root)),
                            'type': 'directory' if item.is_dir() else 'file',
                            'size': stat.st_size if item.is_file() else 0,
                            'modified': stat.st_mtime
                        }

                        # Add additional info for files
                        if item.is_file():
                            if '.' in item.name:
                                item_info['extension'] = item.name.split('.')[-1].lower()

                            # Check for previewable files
                            if item.name.endswith(('.md', '.txt', '.py', '.js', '.html', '.css', '.json', '.yml', '.yaml')):
                                item_info['previewable'] = True

                            # Language detection
                            ext = item.name.lower().split('.')[-1] if '.' in item.name else ''
                            lang_map = {
                                'py': 'python',
                                'js': 'javascript',
                                'html': 'html',
                                'css': 'css',
                                'json': 'json',
                                'md': 'markdown'
                            }
                            if ext in lang_map:
                                item_info['language'] = lang_map[ext]

                        # Add special directory indicators
                        if item.is_dir():
                            if item.name == 'core':
                                item_info['description'] = 'Core CE-Hub functionality'
                            elif item.name == 'projects':
                                item_info['description'] = 'Active projects'
                            elif item.name == 'agents':
                                item_info['description'] = 'CE-Hub agents'
                            elif item.name == 'production':
                                item_info['description'] = 'Production systems'

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

            # Add directory info
            response_data = {
                'success': True,
                'type': 'directory',
                'path': str(requested_path.relative_to(self.ce_hub_root)) if str(requested_path.relative_to(self.ce_hub_root)) != '.' else '',
                'items': items,
                'parent': str(requested_path.parent.relative_to(self.ce_hub_root)) if requested_path.parent != self.ce_hub_root else None,
                'item_count': len(items)
            }

            # Add current directory description
            current_dir = requested_path.relative_to(self.ce_hub_root)
            if str(current_dir) == '.':
                response_data['description'] = 'CE-Hub root directory'
            elif str(current_dir) == 'core':
                response_data['description'] = 'Core CE-Hub systems and servers'
            elif str(current_dir) == 'projects':
                response_data['description'] = 'Active CE-Hub projects'
            elif str(current_dir) == 'agents':
                response_data['description'] = 'CE-Hub agent definitions'

            self.send_json_response(response_data)

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': f'Directory listing error: {str(e)}'
            }, status=500)

    def send_json_response(self, data, status=200):
        """Send JSON response with CORS headers"""
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        """Handle OPTIONS requests for CORS"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == "__main__":
    port = 8109
    with socketserver.TCPServer(('0.0.0.0', port), MobileFileOpsHandler) as httpd:
        print(f"📁 MOBILE FILE OPERATIONS SERVER")
        print(f"")
        print(f"🗂️  File Operations: http://100.95.223.19:{port}/files")
        print(f"🤖 Agents List: http://100.95.223.19:{port}/agents")
        print(f"📖 Read File: http://100.95.223.19:{port}/read-file?path=<file>")
        print(f"💚 Health Check: http://100.95.223.19:{port}/health")
        print(f"")
        print(f"✨ Features:")
        print(f"   • Secure file browsing")
        print(f"   • CE-Hub agents directory")
        print(f"   • File reading and preview")
        print(f"   • Directory navigation")
        print(f"")

        httpd.serve_forever()