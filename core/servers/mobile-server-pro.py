#!/usr/bin/env python3
"""
CE-Hub Pro Mobile Server
Production-ready mobile interface with real file integration
"""

import http.server
import socketserver
import json
import os
import subprocess
import mimetypes
import urllib.parse
from pathlib import Path
import argparse
import threading
import time

class CEHubProHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub").resolve()
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        parsed_path = urllib.parse.urlparse(self.path)

        # API endpoints
        if parsed_path.path == '/api/files':
            self.handle_get_files()
        elif parsed_path.path.startswith('/api/file/'):
            self.handle_get_file_content()
        elif parsed_path.path == '/api/status':
            self.handle_get_status()
        else:
            # Serve static files
            super().do_GET()

    def do_POST(self):
        """Handle POST requests"""
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/api/save':
            self.handle_save_file()
        elif parsed_path.path == '/api/execute':
            self.handle_execute_command()
        elif parsed_path.path == '/api/claude':
            self.handle_launch_claude()
        else:
            self.send_error(404)

    def handle_get_files(self):
        """Get real CE-Hub files"""
        try:
            files = []

            # Get files from CE-Hub directory
            for item in self.ce_hub_root.iterdir():
                if item.name.startswith('.git'):
                    continue

                file_info = {
                    'name': item.name,
                    'path': str(item),
                    'type': 'folder' if item.is_dir() else 'file',
                    'size': self.get_size_string(item),
                    'icon': self.get_file_icon(item),
                    'modified': int(item.stat().st_mtime)
                }
                files.append(file_info)

            # Sort: folders first, then files
            files.sort(key=lambda x: (x['type'] != 'folder', x['name'].lower()))

            self.send_json_response({'files': files, 'total': len(files)})

        except Exception as e:
            self.send_error_response(f"Failed to load files: {str(e)}")

    def handle_get_file_content(self):
        """Get content of a specific file"""
        try:
            # Extract file path from URL
            file_path = self.path.replace('/api/file/', '')
            file_path = urllib.parse.unquote(file_path)

            full_path = Path(file_path).resolve()

            # Security check - ensure file is within CE-Hub
            if not str(full_path).startswith(str(self.ce_hub_root)):
                self.send_error_response("Access denied")
                return

            if not full_path.exists():
                self.send_error_response("File not found")
                return

            if full_path.is_dir():
                # Return directory listing
                items = []
                for item in full_path.iterdir():
                    items.append({
                        'name': item.name,
                        'path': str(item),
                        'type': 'folder' if item.is_dir() else 'file',
                        'size': self.get_size_string(item),
                        'icon': self.get_file_icon(item)
                    })

                items.sort(key=lambda x: (x['type'] != 'folder', x['name'].lower()))
                self.send_json_response({'items': items, 'path': str(full_path)})
            else:
                # Return file content
                try:
                    with open(full_path, 'r', encoding='utf-8') as f:
                        content = f.read()

                    self.send_json_response({
                        'content': content,
                        'path': str(full_path),
                        'size': full_path.stat().st_size,
                        'type': 'file'
                    })
                except UnicodeDecodeError:
                    # Binary file
                    self.send_json_response({
                        'error': 'Binary file - cannot display content',
                        'path': str(full_path),
                        'size': full_path.stat().st_size,
                        'type': 'binary'
                    })

        except Exception as e:
            self.send_error_response(f"Failed to load file: {str(e)}")

    def handle_save_file(self):
        """Save file content"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            file_path = Path(data['path']).resolve()

            # Security check
            if not str(file_path).startswith(str(self.ce_hub_root)):
                self.send_error_response("Access denied")
                return

            # Create backup
            if file_path.exists():
                backup_path = file_path.with_suffix(file_path.suffix + '.bak')
                file_path.rename(backup_path)

            # Save new content
            with open(file_path, 'w', encoding='utf-8') as f:
                f.write(data['content'])

            self.send_json_response({
                'success': True,
                'message': f'Saved {file_path.name}',
                'size': file_path.stat().st_size
            })

        except Exception as e:
            self.send_error_response(f"Failed to save file: {str(e)}")

    def handle_execute_command(self):
        """Execute terminal command"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            command = data['command']

            # Security: whitelist allowed commands
            safe_commands = [
                'ls', 'pwd', 'git', 'npm', 'node', 'python3', 'claude', 'code',
                'clear', 'whoami', 'date', 'cat', 'grep', 'find', 'echo'
            ]

            cmd_parts = command.split()
            if not cmd_parts or cmd_parts[0] not in safe_commands:
                self.send_json_response({
                    'output': f"Command '{cmd_parts[0] if cmd_parts else command}' not allowed for security",
                    'error': True
                })
                return

            # Execute command in CE-Hub directory
            result = subprocess.run(
                command,
                shell=True,
                cwd=str(self.ce_hub_root),
                capture_output=True,
                text=True,
                timeout=30
            )

            output = result.stdout + result.stderr

            self.send_json_response({
                'output': output or f"Command '{command}' executed successfully",
                'error': result.returncode != 0,
                'return_code': result.returncode
            })

        except subprocess.TimeoutExpired:
            self.send_json_response({
                'output': "Command timed out (30s limit)",
                'error': True
            })
        except Exception as e:
            self.send_error_response(f"Failed to execute command: {str(e)}")

    def handle_launch_claude(self):
        """Launch Claude with specified model"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            model = data.get('model', 'sonnet')
            provider = data.get('provider', 'claude')

            # Map model names to actual command parameters
            model_mapping = {
                'sonnet-4': 'sonnet-4',
                'sonnet-4.5': 'sonnet-4.5',
                'haiku': 'haiku',
                'opus': 'opus',
                'glm-4-plus': 'glm-4-plus',
                'glm-4.5': 'glm-4.5',
                'glm-4.6': 'glm-4.6'
            }

            actual_model = model_mapping.get(model, model)

            # Launch Claude in background
            def launch_claude():
                try:
                    if provider == 'glm':
                        # For GLM models, we might need different command structure
                        command = f"claude --dangerously-skip-permissions --provider glm --model {actual_model}"
                    else:
                        # Standard Claude command
                        command = f"claude --dangerously-skip-permissions --model {actual_model}"

                    subprocess.Popen(
                        command,
                        shell=True,
                        cwd=str(self.ce_hub_root)
                    )
                except Exception as e:
                    print(f"Failed to launch Claude: {e}")

            # Start in background thread
            threading.Thread(target=launch_claude, daemon=True).start()

            # Generate appropriate message based on model
            model_names = {
                'sonnet-4': 'Claude 4 Sonnet',
                'sonnet-4.5': 'Claude 4.5 Sonnet',
                'haiku': 'Claude 3.5 Haiku',
                'opus': 'Claude 3 Opus',
                'glm-4-plus': 'GLM-4 Plus',
                'glm-4.5': 'GLM-4.5',
                'glm-4.6': 'GLM-4.6'
            }

            model_display = model_names.get(model, model)
            command_display = f"claude --dangerously-skip-permissions --model {actual_model}"

            self.send_json_response({
                'success': True,
                'message': f'🚀 Launching {model_display} with dangerous permissions...\n✓ Model: {actual_model}\n✓ Provider: {provider.upper()}\n✓ Permissions: Skipped\n✓ Ready for development',
                'command': command_display
            })

        except Exception as e:
            self.send_error_response(f"Failed to launch Claude: {str(e)}")

    def handle_get_status(self):
        """Get system status"""
        try:
            # Check if code-server is running
            code_server_running = False
            try:
                result = subprocess.run(['pgrep', 'code-server'], capture_output=True)
                code_server_running = result.returncode == 0
            except:
                pass

            status = {
                'ce_hub_path': str(self.ce_hub_root),
                'code_server_running': code_server_running,
                'mobile_server_running': True,
                'files_accessible': self.ce_hub_root.exists(),
                'timestamp': int(time.time())
            }

            self.send_json_response(status)

        except Exception as e:
            self.send_error_response(f"Failed to get status: {str(e)}")

    def get_size_string(self, path):
        """Get human-readable size string"""
        try:
            if path.is_dir():
                count = len(list(path.iterdir()))
                return f"{count} items"
            else:
                size = path.stat().st_size
                if size < 1024:
                    return f"{size} B"
                elif size < 1024 * 1024:
                    return f"{size / 1024:.1f} KB"
                else:
                    return f"{size / (1024 * 1024):.1f} MB"
        except:
            return "Unknown"

    def get_file_icon(self, path):
        """Get appropriate icon for file/folder"""
        if path.is_dir():
            special_folders = {
                'config': '⚙️',
                'docs': '📚',
                'scripts': '🔧',
                'src': '📦',
                'node_modules': '📦',
                '.git': '🔗',
                'mobile': '📱'
            }
            return special_folders.get(path.name.lower(), '📁')

        suffix = path.suffix.lower()
        file_icons = {
            '.md': '📄',
            '.txt': '📝',
            '.json': '📋',
            '.js': '📜',
            '.ts': '📘',
            '.py': '🐍',
            '.html': '🌐',
            '.css': '🎨',
            '.yml': '⚙️',
            '.yaml': '⚙️',
            '.gitignore': '🚫',
            '.env': '🔐',
            '.log': '📊'
        }
        return file_icons.get(suffix, '📄')

    def send_json_response(self, data):
        """Send JSON response"""
        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps(data).encode('utf-8'))

    def send_error_response(self, message):
        """Send error response"""
        self.send_response(500)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.end_headers()
        self.wfile.write(json.dumps({'error': message}).encode('utf-8'))

def main():
    parser = argparse.ArgumentParser(description='CE-Hub Pro Mobile Server')
    parser.add_argument('--port', type=int, default=8101, help='Server port')
    parser.add_argument('--host', default='0.0.0.0', help='Server host')
    args = parser.parse_args()

    try:
        with socketserver.TCPServer((args.host, args.port), CEHubProHandler) as httpd:
            print(f"""
🚀 CE-Hub Pro Mobile Server
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
📱 Mobile Interface: http://100.95.223.19:{args.port}/mobile-pro.html
🔗 VS Code Server: http://100.95.223.19:8080/
💻 Local Access: http://localhost:{args.port}/mobile-pro.html
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

✅ Real file integration enabled
✅ Terminal command execution enabled
✅ Claude model launcher ready
✅ Production-ready features active

Server running on {args.host}:{args.port}
Press Ctrl+C to stop
            """)

            httpd.serve_forever()

    except KeyboardInterrupt:
        print("\n🛑 Server stopped")
    except Exception as e:
        print(f"❌ Server error: {e}")

if __name__ == "__main__":
    main()