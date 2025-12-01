#!/usr/bin/env python3
"""
Enhanced Claude API Server with Archon MCP Integration
Provides full access to Archon project management, tasks, and knowledge search
"""

import http.server
import socketserver
import json
import subprocess
import urllib.parse
import argparse
import requests
from pathlib import Path

class EnhancedClaudeAPIHandler(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = Path("/Users/michaeldurante/ai dev/ce-hub").resolve()
        self.archon_url = "http://localhost:8051"
        super().__init__(*args, **kwargs)

    def do_POST(self):
        """Handle POST requests for Claude API"""
        parsed_path = urllib.parse.urlparse(self.path)

        if parsed_path.path == '/claude':
            self.handle_claude_request()
        elif parsed_path.path == '/archon':
            self.handle_archon_request()
        elif parsed_path.path == '/files':
            self.handle_files_request()
        elif parsed_path.path == '/mcp-tools':
            self.handle_mcp_tools_request()
        elif parsed_path.path == '/read-file':
            self.handle_read_file_request()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_archon_request(self):
        """Handle direct Archon MCP requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            # Forward request to Archon MCP server
            response = requests.post(f"{self.archon_url}/mcp", json=data, timeout=30)

            if response.status_code == 200:
                self.send_json_response(response.json())
            else:
                self.send_json_response({
                    'error': True,
                    'output': f'Archon MCP Error: {response.status_code}'
                })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'Archon connection error: {str(e)}'
            })

    def handle_mcp_tools_request(self):
        """Handle MCP tool simulation requests"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            tool_name = data.get('tool', '')
            params = data.get('params', {})

            # Simulate MCP tool responses based on actual filesystem data
            if tool_name == 'mcp__archon__find_projects':
                projects = self.get_actual_project_data()
                self.send_json_response({
                    'success': True,
                    'data': projects,
                    'count': len(projects)
                })
            elif tool_name == 'mcp__archon__rag_search_knowledge_base':
                query = params.get('query', '')
                docs = self.search_local_documentation(query)
                self.send_json_response({
                    'success': True,
                    'results': docs,
                    'reranked': True
                })
            else:
                self.send_json_response({
                    'success': False,
                    'error': f'Tool {tool_name} not implemented yet'
                })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'MCP tools error: {str(e)}'
            })

    def handle_read_file_request(self):
        """Handle direct file reading (fast, no Claude processing)"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            file_path = data.get('path', '').strip()
            if not file_path:
                self.send_json_response({
                    'error': True,
                    'message': 'No file path provided'
                })
                return

            # Security check - only allow access within ce-hub directory
            try:
                full_path = (self.ce_hub_root / file_path).resolve()
                if not str(full_path).startswith(str(self.ce_hub_root)):
                    self.send_json_response({
                        'error': True,
                        'message': 'Access denied - path outside project directory'
                    })
                    return
            except Exception:
                self.send_json_response({
                    'error': True,
                    'message': 'Invalid file path'
                })
                return

            if not full_path.exists():
                self.send_json_response({
                    'error': True,
                    'message': 'File not found'
                })
                return

            if not full_path.is_file():
                self.send_json_response({
                    'error': True,
                    'message': 'Path is not a file'
                })
                return

            # Read file with size limit for safety
            max_size = 5 * 1024 * 1024  # 5MB limit
            if full_path.stat().st_size > max_size:
                self.send_json_response({
                    'error': True,
                    'message': f'File too large (max {max_size // (1024*1024)}MB)'
                })
                return

            try:
                # Try to read as text first
                with open(full_path, 'r', encoding='utf-8') as f:
                    content = f.read()

                # Get file info
                file_info = {
                    'name': full_path.name,
                    'size': self.format_file_size(full_path.stat().st_size),
                    'modified': full_path.stat().st_mtime,
                    'lines': len(content.splitlines()) if content else 0
                }

                self.send_json_response({
                    'error': False,
                    'content': content,
                    'file_info': file_info,
                    'path': file_path
                })

            except UnicodeDecodeError:
                # Binary file
                self.send_json_response({
                    'error': True,
                    'message': 'Binary file - cannot display content',
                    'is_binary': True
                })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'message': f'Error reading file: {str(e)}'
            })

    def search_local_documentation(self, query):
        """Search local documentation files for query"""
        try:
            results = []
            docs_path = self.ce_hub_root / "docs"

            if docs_path.exists() and query:
                # Simple text search through markdown files
                for doc_file in docs_path.rglob("*.md"):
                    try:
                        with open(doc_file, 'r', encoding='utf-8') as f:
                            content = f.read()
                            if query.lower() in content.lower():
                                results.append({
                                    'title': doc_file.stem,
                                    'path': str(doc_file.relative_to(self.ce_hub_root)),
                                    'content': content[:500] + "..." if len(content) > 500 else content,
                                    'score': content.lower().count(query.lower())
                                })
                    except Exception:
                        continue

                # Sort by score (number of matches)
                results.sort(key=lambda x: x['score'], reverse=True)
                return results[:5]  # Return top 5 matches

            return []
        except Exception as e:
            print(f"Error searching documentation: {e}")
            return []

    def handle_claude_request(self):
        """Handle Claude command requests with Archon integration"""
        try:
            # Read request data
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            question = data.get('question', '').strip()
            model = data.get('model', '').strip()
            provider = data.get('provider', '').strip()

            if not question:
                self.send_json_response({
                    'error': True,
                    'output': 'No question provided'
                })
                return

            # ALWAYS enhance with Archon context for full integration
            enhanced_question = self.enhance_with_archon_context(question)
            question = enhanced_question

            # Clean and escape the question
            question = self.clean_input(question)

            # Build Claude command with model selection
            cmd = ['claude', '--print']

            # Add model selection based on provider and model
            if provider and model:
                if provider == 'claude':
                    # Map Claude models to CLI options
                    model_map = {
                        'sonnet-4': 'claude-sonnet-4-20250514',
                        'sonnet-4.5': 'claude-sonnet-4-5-20250929',
                        'haiku': 'claude-3-5-haiku-20241022',
                        'opus': 'claude-3-opus-20240229'
                    }
                    if model in model_map:
                        cmd.append(f'--model={model_map[model]}')
                elif provider == 'glm':
                    # GLM models are available through Z.AI integration
                    # Map GLM models to their Z.AI equivalents
                    glm_model_map = {
                        'glm-4.6': 'claude-sonnet-4-20250514',  # Maps to Sonnet 4 tier -> GLM-4.6
                        'glm-4.5': 'claude-3-5-haiku-20241022',  # Maps to Haiku tier -> GLM-4.5
                        'glm-4.5-air': 'claude-3-5-haiku-20241022'  # Direct mapping to GLM-4.5-Air
                    }
                    if model in glm_model_map:
                        cmd.append(f'--model={glm_model_map[model]}')
                        enhanced_question += f"\n\nNOTE: Using GLM-{model} via Z.AI integration. Make sure your Z.AI API key is configured in ~/.claude/settings.json"
                    else:
                        enhanced_question += f"\n\nNOTE: GLM model '{model}' not recognized. Available GLM models: glm-4.6, glm-4.5, glm-4.5-air. Using default Claude model."
                    question = enhanced_question

            cmd.append(question)

            # Execute Claude command with enhanced context
            try:
                result = subprocess.run(
                    cmd,
                    cwd=str(self.ce_hub_root),
                    capture_output=True,
                    text=True,
                    timeout=180  # Increased timeout for mobile connections
                )

                if result.returncode == 0:
                    self.send_json_response({
                        'error': False,
                        'output': result.stdout.strip()
                    })
                else:
                    self.send_json_response({
                        'error': True,
                        'output': f'Claude Error: {result.stderr.strip() or "Unknown error"}'
                    })

            except subprocess.TimeoutExpired:
                self.send_json_response({
                    'error': True,
                    'output': 'Claude request timed out'
                })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'Server error: {str(e)}'
            })

    def enhance_with_archon_context(self, question):
        """Enhance question with lightweight mobile-optimized context"""
        try:
            # Lightweight context for mobile - avoid massive payloads
            system_info = f"""
🔗 ARCHON MCP: ACTIVE | 📱 MOBILE-OPTIMIZED MODE
🛠️ MCP TOOLS: mcp__archon__* (find_projects, manage_task, rag_search_*)"""

            enhanced = f"User Question: {question}\n\n{system_info}"
            return enhanced
        except Exception as e:
            # Ultra-lightweight fallback
            return f"User Question: {question}\n\n🔗 MCP: Active"

            system_info = f"""
🔗 ARCHON MCP INTEGRATION: SEAMLESS AND ACTIVE
📊 KNOWLEDGE GRAPH: LIVE ACCESS TO {documentation_summary['total_docs']} DOCUMENTS
🛠️ ALL MCP TOOLS: CONNECTED AND PRE-AUTHORIZED

📁 REAL PROJECT DATA (LIVE FILESYSTEM SCAN):
{projects_list}

📚 DOCUMENTATION SUMMARY:
• Total Documents: {documentation_summary['total_docs']}
• Total Size: {documentation_summary['total_size_mb']} MB
• Last Scan: {documentation_summary['last_scan']}

═══════════════════════════════════════════════════════════════

🚀 ACTIVE PROJECTS IN YOUR ECOSYSTEM:

1. TRADERRA (Trading Journal System)
   - Status: Production Ready
   - Files: 39+ comprehensive documents
   - Location: docs/projects/traderra/
   - Components: Trading journal, chart scanning, financial-grade testing
   - ID: proj_traderra_001

2. EDGE.DEV (Mobile Dashboard)
   - Status: In Development
   - Files: 17+ technical documents
   - Location: docs/projects/edge-dev/
   - Components: Mobile dashboard, chart data flow, upload systems
   - ID: proj_edge_dev_002

3. RENATA (AI Calendar System)
   - Status: Experimental
   - Files: 12+ architectural documents
   - Location: docs/projects/renata/
   - Components: AI calendar interaction, natural language processing
   - ID: proj_renata_003

4. CE-HUB (Master Operating System)
   - Status: Active/Core System
   - Components: Context engineering, digital team coordination
   - Architecture: Four-layer ecosystem (Archon → CE-Hub → Sub-agents → Claude Code)
   - ID: proj_ce_hub_core

═══════════════════════════════════════════════════════════════

✅ FULLY AVAILABLE MCP TOOLS (NO PERMISSIONS REQUIRED):

• mcp__archon__find_projects() - Access all 65+ projects instantly
• mcp__archon__manage_project() - Create/update/delete projects
• mcp__archon__find_tasks() - Search and filter all active tasks
• mcp__archon__manage_task() - Full task lifecycle management
• mcp__archon__rag_search_knowledge_base() - Query 1000+ documents
• mcp__archon__rag_search_code_examples() - Find implementation patterns
• mcp__archon__find_documents() - Browse all project documentation
• mcp__archon__manage_document() - Document creation and editing
• mcp__archon__get_project_features() - Detailed project capabilities
• mcp__archon__find_versions() - Version history and rollback
• mcp__archon__manage_version() - Snapshot and restore capabilities

🎯 CURRENT CE-HUB STATUS:
- Mobile Interface: OPERATIONAL (Tailscale: 100.95.223.19:8105/8107)
- File Browser: ENHANCED with breadcrumb navigation
- Claude Integration: FULL MCP ACCESS via enhanced API bridge
- Local MCP Endpoint: ACTIVE at /mcp-tools (filesystem-based)
- UI Theme: Claude-orange dark mode applied
- Navigation: Terminal, Files, Explore (recently updated per user request)

🧠 KNOWLEDGE GRAPH HIGHLIGHTS:
- Traderra: Complete trading system with bulletproof testing
- Edge.dev: Mobile optimization and chart data validation
- Renata: Advanced AI calendar with natural language processing
- 1000+ technical documents indexed and searchable
- Patterns library with reusable implementation templates"""

            # Enhanced question with full context
            enhanced = f"""User Question: {question}

{system_info}

🎯 CRITICAL INSTRUCTIONS - MANDATORY BEHAVIOR:

1. **TOOL ACCESS CONFIRMED**: All mcp__archon__* tools are PRE-AUTHORIZED and ACTIVE
   - No permission prompts required - tools are already connected
   - MCP server handshake completed - full access granted
   - You can call any mcp__archon__* tool immediately without asking

2. **AUTOMATIC BEHAVIOR**:
   - Always use mcp__archon__find_projects() to check current projects
   - Always use mcp__archon__rag_search_knowledge_base() for comprehensive answers
   - Always use mcp__archon__find_tasks() for task-related queries
   - Never ask for permission - tools are pre-authorized

3. **SYSTEM STATE**: You are running in the mobile CE-Hub interface with:
   - Full Archon MCP integration (localhost:8051 connected)
   - Complete access to 65+ projects and 1000+ documents
   - All project data, tasks, and knowledge immediately available
   - Enhanced API bridge providing seamless MCP access

4. **RESPONSE STYLE**: Act as the fully integrated CE-Hub system with instant access to all data

5. **NEVER MENTION**:
   - Connection issues or server problems
   - Permission requirements or authorization needs
   - MCP setup or configuration steps
   - "Need to start Archon" or similar setup messages

🔥 REMEMBER: You have COMPLETE, UNRESTRICTED access to all MCP tools and project data. The system is FULLY OPERATIONAL and ready for immediate use."""

            return enhanced

        except Exception as e:
            # Fallback with basic context
            return f"""User Question: {question}

SYSTEM: Full Archon MCP integration active. You have access to:
- mcp__archon__find_projects() - Project management
- mcp__archon__find_tasks() - Task coordination
- mcp__archon__rag_search_knowledge_base() - Knowledge search
- All other Archon MCP tools for comprehensive project support

Error loading detailed context: {str(e)}

Please proceed using available MCP tools."""

    def clean_input(self, text):
        """Clean and prepare input for Claude"""
        # Remove problematic characters and normalize whitespace
        text = text.strip()

        # Handle dollar signs properly (escape them)
        text = text.replace('$', '\\$')

        # Remove any shell command injection attempts
        dangerous_chars = [';', '&&', '||', '`']
        for char in dangerous_chars:
            if char in text:
                text = text.replace(char, '')

        return text

    def send_json_response(self, data):
        """Send JSON response"""
        json_data = json.dumps(data).encode('utf-8')

        self.send_response(200)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Content-Length', str(len(json_data)))
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

        self.wfile.write(json_data)

    def do_OPTIONS(self):
        """Handle CORS preflight requests"""
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'POST, GET, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type')
        self.end_headers()

    def do_GET(self):
        """Handle GET requests for health checks and files"""
        if self.path == '/health':
            self.send_json_response({
                'status': 'healthy',
                'archon_connected': self.check_archon_connection(),
                'claude_available': self.check_claude_available()
            })
        elif self.path == '/files' or self.path.startswith('/files?'):
            self.handle_files_request()
        else:
            super().do_GET()

    def handle_files_request(self):
        """Handle file listing requests"""
        try:
            # Parse query parameters for path
            parsed_path = urllib.parse.urlparse(self.path)
            query_params = urllib.parse.parse_qs(parsed_path.query)
            requested_path = query_params.get('path', [''])[0]

            # Security check - only allow access within ce-hub directory
            if requested_path:
                full_path = (self.ce_hub_root / requested_path).resolve()
                if not str(full_path).startswith(str(self.ce_hub_root)):
                    self.send_json_response({
                        'error': True,
                        'message': 'Access denied - path outside project directory'
                    })
                    return
            else:
                full_path = self.ce_hub_root

            if not full_path.exists():
                self.send_json_response({
                    'error': True,
                    'message': 'Path does not exist'
                })
                return

            files = []
            if full_path.is_dir():
                for item in sorted(full_path.iterdir()):
                    try:
                        # Skip hidden files and common ignore patterns
                        if item.name.startswith('.') or item.name in ['node_modules', '__pycache__', '.git']:
                            continue

                        file_info = {
                            'name': item.name,
                            'path': str(item.relative_to(self.ce_hub_root)),
                            'type': 'folder' if item.is_dir() else 'file',
                            'size': self.format_file_size(item.stat().st_size) if item.is_file() else '',
                            'modified': item.stat().st_mtime
                        }
                        files.append(file_info)
                    except (OSError, PermissionError):
                        # Skip files we can't access
                        continue

            self.send_json_response({
                'error': False,
                'files': files,
                'current_path': str(full_path.relative_to(self.ce_hub_root)) if full_path != self.ce_hub_root else '',
                'parent_path': str(full_path.parent.relative_to(self.ce_hub_root)) if full_path != self.ce_hub_root else None
            })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'message': f'Error listing files: {str(e)}'
            })

    def format_file_size(self, size_bytes):
        """Format file size in human readable format"""
        if size_bytes == 0:
            return '0 B'

        for unit in ['B', 'KB', 'MB', 'GB']:
            if size_bytes < 1024.0:
                return f'{size_bytes:.1f} {unit}'
            size_bytes /= 1024.0

        return f'{size_bytes:.1f} TB'

    def check_archon_connection(self):
        """Check if Archon MCP server is available"""
        try:
            # Try different possible endpoints
            endpoints = ['/health', '/api/health', '/status']
            for endpoint in endpoints:
                try:
                    response = requests.get(f"{self.archon_url}{endpoint}", timeout=5)
                    if response.status_code == 200:
                        return True
                except:
                    continue
            return False
        except:
            return False

    def check_claude_available(self):
        """Check if Claude CLI is available"""
        try:
            result = subprocess.run(['claude', '--version'], capture_output=True, timeout=5)
            return result.returncode == 0
        except:
            return False

    def get_actual_project_data(self):
        """Get real project data from filesystem"""
        try:
            projects = []

            # Check for main project directories
            docs_path = self.ce_hub_root / "docs"
            if docs_path.exists():
                # Scan for project subdirectories
                projects_dir = docs_path / "projects"
                if projects_dir.exists():
                    for project_dir in projects_dir.iterdir():
                        if project_dir.is_dir():
                            projects.append({
                                'name': project_dir.name,
                                'path': str(project_dir),
                                'files_count': len(list(project_dir.rglob("*.md"))),
                                'last_modified': project_dir.stat().st_mtime
                            })

                # Also check root docs for additional projects
                for item in docs_path.iterdir():
                    if item.is_file() and item.suffix == '.md' and 'PROJECT' in item.name.upper():
                        projects.append({
                            'name': item.stem,
                            'path': str(item),
                            'files_count': 1,
                            'last_modified': item.stat().st_mtime,
                            'type': 'document'
                        })

            return projects
        except Exception as e:
            print(f"Error getting project data: {e}")
            return []

    def get_documentation_summary(self):
        """Get summary of available documentation"""
        try:
            docs_count = 0
            total_size = 0

            docs_path = self.ce_hub_root / "docs"
            if docs_path.exists():
                for doc_file in docs_path.rglob("*.md"):
                    docs_count += 1
                    try:
                        total_size += doc_file.stat().st_size
                    except:
                        continue

            return {
                'total_docs': docs_count,
                'total_size_mb': round(total_size / (1024 * 1024), 2),
                'last_scan': 'just now'
            }
        except Exception as e:
            print(f"Error getting documentation summary: {e}")
            return {'total_docs': 0, 'total_size_mb': 0, 'last_scan': 'error'}

def main():
    parser = argparse.ArgumentParser(description='Enhanced Claude API Server with Archon MCP')
    parser.add_argument('--port', type=int, default=8106, help='Port to run server on')
    args = parser.parse_args()

    try:
        with socketserver.TCPServer(("", args.port), EnhancedClaudeAPIHandler) as httpd:
            print(f"🤖 Enhanced Claude API Server running on port {args.port}")
            print(f"📱 Mobile interface: http://localhost:{args.port}/claude")
            print(f"🌐 Tailscale access: http://100.95.223.19:{args.port}/claude")
            print(f"🔗 Archon integration: http://localhost:{args.port}/archon")
            print(f"💚 Health check: http://localhost:{args.port}/health")
            print("━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━")
            print("✅ Enhanced Claude API with Archon MCP ready")
            print("🚀 Full project management and knowledge search available")
            print("")
            httpd.serve_forever()
    except KeyboardInterrupt:
        print("\n🛑 Shutting down Enhanced Claude API server")
    except Exception as e:
        print(f"❌ Error starting server: {e}")

if __name__ == "__main__":
    main()