#!/usr/bin/env python3
"""
Optimized Mobile Claude API Server
Lightweight version for mobile connectivity with reduced timeouts and payloads
"""

import json
import subprocess
import argparse
import socketserver
import http.server
from pathlib import Path
import os

class OptimizedMobileAPIHandler(http.server.BaseHTTPRequestHandler):

    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path(__file__).parent.resolve()
        super().__init__(*args, **kwargs)

    def do_OPTIONS(self):
        """Handle preflight CORS requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.send_header('Access-Control-Max-Age', '3600')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests"""
        if self.path == '/health':
            self.handle_health_request()
        elif self.path.startswith('/files'):
            self.handle_files_request()
        else:
            self.send_response(404)
            self.end_headers()

    def do_POST(self):
        """Handle POST requests"""
        if self.path == '/claude':
            self.handle_claude_request()
        elif self.path == '/read-file':
            self.handle_read_file_request()
        else:
            self.send_response(404)
            self.end_headers()

    def handle_health_request(self):
        """Simple health check"""
        self.send_json_response({
            "status": "healthy",
            "mobile_optimized": True,
            "claude_available": True
        })

    def handle_claude_request(self):
        """Handle Claude API requests with mobile optimization"""
        try:
            # Read request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            question = data.get('question', '').strip()
            if not question:
                self.send_json_response({
                    'error': True,
                    'output': 'No question provided'
                })
                return

            # Build lightweight Claude command
            cmd = ['claude', '--print']

            # Handle model selection (lightweight)
            provider = data.get('provider')
            model = data.get('model')

            if provider and model:
                if provider == 'claude':
                    model_map = {
                        'sonnet-4': 'claude-sonnet-4-20250514',
                        'sonnet-4.5': 'claude-sonnet-4-5-20250929',
                        'haiku': 'claude-3-5-haiku-20241022'
                    }
                    if model in model_map:
                        cmd.append(f'--model={model_map[model]}')
                elif provider == 'glm':
                    glm_model_map = {
                        'glm-4.6': 'claude-sonnet-4-20250514',
                        'glm-4.5': 'claude-3-5-haiku-20241022',
                        'glm-4.5-air': 'claude-3-5-haiku-20241022'
                    }
                    if model in glm_model_map:
                        cmd.append(f'--model={glm_model_map[model]}')
                        question += f" [Using GLM-{model} via Z.AI]"

            # Add minimal context for mobile
            enhanced_question = f"""User Question: {question}

📱 CE-Hub Mobile | MCP: Active
Tools: mcp__archon__* available"""

            cmd.append(enhanced_question)

            # Execute with mobile-friendly timeout
            result = subprocess.run(
                cmd,
                cwd=str(self.ce_hub_root),
                capture_output=True,
                text=True,
                timeout=90  # Reduced timeout for mobile
            )

            if result.returncode == 0:
                self.send_json_response({
                    'error': False,
                    'output': result.stdout.strip()
                })
            else:
                self.send_json_response({
                    'error': True,
                    'output': f'Claude error: {result.stderr.strip()}'
                })

        except subprocess.TimeoutExpired:
            self.send_json_response({
                'error': True,
                'output': 'Request timed out - try a shorter question for mobile'
            })
        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'Server error: {str(e)}'
            })

    def handle_files_request(self):
        """Handle file listing requests"""
        try:
            # Simple file listing
            from urllib.parse import parse_qs, urlparse
            parsed_url = urlparse(self.path)
            query_params = parse_qs(parsed_url.query)

            path = query_params.get('path', [''])[0]
            target_path = self.ce_hub_root / path if path else self.ce_hub_root

            if not target_path.exists() or not target_path.is_dir():
                self.send_json_response({'error': True, 'message': 'Directory not found'})
                return

            files = []
            dirs = []

            for item in sorted(target_path.iterdir()):
                if item.name.startswith('.'):
                    continue

                if item.is_dir():
                    dirs.append({
                        'name': item.name,
                        'type': 'directory',
                        'path': str(item.relative_to(self.ce_hub_root))
                    })
                else:
                    size = item.stat().st_size
                    files.append({
                        'name': item.name,
                        'type': 'file',
                        'size': self.format_file_size(size),
                        'path': str(item.relative_to(self.ce_hub_root))
                    })

            self.send_json_response({
                'error': False,
                'directories': dirs,
                'files': files,
                'current_path': str(target_path.relative_to(self.ce_hub_root))
            })

        except Exception as e:
            self.send_json_response({'error': True, 'message': f'Error: {str(e)}'})

    def handle_read_file_request(self):
        """Handle fast file reading"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            file_path = data.get('path', '').strip()
            full_path = (self.ce_hub_root / file_path).resolve()

            # Security check
            if not str(full_path).startswith(str(self.ce_hub_root)):
                self.send_json_response({'error': True, 'message': 'Access denied'})
                return

            if not full_path.exists():
                self.send_json_response({'error': True, 'message': 'File not found'})
                return

            # Read with size limit for mobile
            max_size = 1 * 1024 * 1024  # 1MB limit for mobile
            if full_path.stat().st_size > max_size:
                self.send_json_response({
                    'error': True,
                    'message': f'File too large for mobile ({self.format_file_size(full_path.stat().st_size)})'
                })
                return

            with open(full_path, 'r', encoding='utf-8') as f:
                content = f.read()

            self.send_json_response({
                'error': False,
                'content': content,
                'file_info': {
                    'name': full_path.name,
                    'size': self.format_file_size(full_path.stat().st_size)
                }
            })

        except Exception as e:
            self.send_json_response({'error': True, 'message': f'Error reading file: {str(e)}'})

    def format_file_size(self, size):
        """Format file size for display"""
        for unit in ['B', 'KB', 'MB', 'GB']:
            if size < 1024.0:
                return f"{size:.1f} {unit}"
            size /= 1024.0
        return f"{size:.1f} TB"

    def send_json_response(self, data):
        """Send JSON response with CORS headers"""
        try:
            self.send_response(200)
            self.send_header('Content-Type', 'application/json')
            self.send_header('Access-Control-Allow-Origin', '*')
            self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
            self.send_header('Access-Control-Allow-Headers', 'Content-Type')
            self.end_headers()

            json_data = json.dumps(data, ensure_ascii=False, indent=2)
            self.wfile.write(json_data.encode('utf-8'))
        except BrokenPipeError:
            # Client disconnected - common on mobile
            print("Client disconnected during response")
        except Exception as e:
            print(f"Error sending response: {e}")

def main():
    parser = argparse.ArgumentParser(description='Optimized Mobile Claude API Server')
    parser.add_argument('--port', type=int, default=8108, help='Port to run server on')
    args = parser.parse_args()

    try:
        with socketserver.TCPServer(("", args.port), OptimizedMobileAPIHandler) as httpd:
            print(f"🚀 Optimized Mobile Claude API running on port {args.port}")
            print(f"📱 Mobile optimized: http://100.95.223.19:{args.port}")
            print(f"💚 Health: http://localhost:{args.port}/health")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print("✅ Mobile-optimized Claude API ready")
            print("🔥 Lightweight context | Fast timeouts | Better connectivity")
            print("")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Mobile Claude API server")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()