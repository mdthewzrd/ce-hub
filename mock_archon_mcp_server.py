#!/usr/bin/env python3
"""
Mock Archon MCP Server
Provides project management, knowledge base, and agent coordination functionality
"""

import http.server
import socketserver
import json
import time
from datetime import datetime

class MockArchonMCPServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, **kwargs)

    def do_POST(self):
        if self.path == '/rag_search_knowledge_base':
            self.handle_search_knowledge_base()
        elif self.path == '/rag_search_code_examples':
            self.handle_search_code_examples()
        elif self.path == '/manage_document':
            self.handle_manage_document()
        elif self.path == '/manage_task':
            self.handle_manage_task()
        elif self.path == '/projects':
            self.handle_projects()
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        if self.path == '/health':
            self.handle_health()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_health(self):
        """Health check endpoint"""
        self.send_json_response({
            'success': True,
            'health': {
                'status': 'healthy',
                'api_service': True,
                'agents_service': True
            },
            'uptime_seconds': time.time()
        })

    def handle_search_knowledge_base(self):
        """Mock knowledge base search"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            query = data.get('query', '').lower()
            match_count = data.get('match_count', 3)

            # Mock search results based on query
            if 'agent' in query:
                results = [
                    {
                        'content': 'CE-Hub agents are specialized AI assistants for different tasks like coding, research, and testing.',
                        'source': 'agents.md',
                        'score': 0.95
                    },
                    {
                        'content': 'Agent orchestration allows multiple specialized agents to work together on complex tasks.',
                        'source': 'orchestration.md',
                        'score': 0.87
                    },
                    {
                        'content': 'The CE-Hub ecosystem includes engineers, researchers, GUI specialists, and QA testers.',
                        'source': 'ecosystem.md',
                        'score': 0.82
                    }
                ]
            elif 'project' in query:
                results = [
                    {
                        'content': 'Projects in CE-Hub are organized with clear specifications, tasks, and documentation.',
                        'source': 'project-management.md',
                        'score': 0.91
                    },
                    {
                        'content': 'Each project has dedicated agents, version control, and progress tracking.',
                        'source': 'project-workflow.md',
                        'score': 0.88
                    }
                ]
            else:
                results = [
                    {
                        'content': f'Found information related to "{query}" in the CE-Hub knowledge base.',
                        'source': 'general.md',
                        'score': 0.75
                    }
                ]

            self.send_json_response({
                'success': True,
                'results': results[:match_count],
                'reranked': True,
                'query': query
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_search_code_examples(self):
        """Mock code examples search"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            query = data.get('query', '').lower()
            match_count = data.get('match_count', 3)

            # Mock code search results
            results = [
                {
                    'content': 'def analyze_trading_performance(trades):\n    """Analyze trading performance metrics"""\n    total_trades = len(trades)\n    winning_trades = [t for t in trades if t.pnl > 0]\n    win_rate = len(winning_trades) / total_trades\n    return {"win_rate": win_rate, "total_trades": total_trades}',
                    'language': 'python',
                    'summary': 'Trading performance analysis function',
                    'score': 0.92
                },
                {
                    'content': 'const calculateRisk = (positionSize, stopLoss) => {\n    return Math.abs(positionSize * stopLoss);\n};',
                    'language': 'javascript',
                    'summary': 'Risk calculation for position sizing',
                    'score': 0.87
                }
            ]

            self.send_json_response({
                'success': True,
                'results': results[:match_count],
                'reranked': True,
                'query': query
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_manage_document(self):
        """Mock document management"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            action = data.get('action', 'create')

            if action == 'create':
                doc_id = f"doc_{int(time.time())}"
                self.send_json_response({
                    'success': True,
                    'document': {
                        'id': doc_id,
                        'title': data.get('title', 'Untitled Document'),
                        'type': data.get('document_type', 'note'),
                        'created_at': datetime.now().isoformat()
                    }
                })
            else:
                self.send_json_response({
                    'success': True,
                    'message': f'Document {action} operation completed'
                })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_manage_task(self):
        """Mock task management"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            action = data.get('action', 'create')

            if action == 'create':
                task_id = f"task_{int(time.time())}"
                self.send_json_response({
                    'success': True,
                    'task': {
                        'id': task_id,
                        'title': data.get('title', 'Untitled Task'),
                        'status': data.get('status', 'todo'),
                        'created_at': datetime.now().isoformat()
                    }
                })
            elif action == 'update':
                self.send_json_response({
                    'success': True,
                    'task': {
                        'id': data.get('task_id'),
                        'status': data.get('status'),
                        'updated_at': datetime.now().isoformat()
                    }
                })
            else:
                self.send_json_response({
                    'success': True,
                    'message': f'Task {action} operation completed'
                })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_projects(self):
        """Mock projects endpoint"""
        try:
            content_length = int(self.headers['Content-Length'])
            if content_length > 0:
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))
                query = data.get('query', '').lower()
            else:
                query = ''

            # Mock project data
            projects = [
                {
                    'id': 'proj-1',
                    'title': 'Mobile CE-Hub Platform',
                    'description': 'Mobile interface for CE-Hub with full Claude Code functionality',
                    'status': 'active',
                    'github_repo': 'https://github.com/ce-hub/mobile-platform',
                    'agents': ['gui-specialist', 'qa-tester', 'ce-hub-engineer']
                },
                {
                    'id': 'proj-2',
                    'title': 'Trading Scanner Integration',
                    'description': 'Real-time trading analysis and market scanning system',
                    'status': 'active',
                    'github_repo': 'https://github.com/ce-hub/trading-scanner',
                    'agents': ['trading-scanner-researcher', 'quant-backtest-specialist']
                },
                {
                    'id': 'proj-3',
                    'title': 'Agent Orchestration System',
                    'description': 'Multi-agent coordination and workflow management',
                    'status': 'development',
                    'github_repo': 'https://github.com/ce-hub/agent-orchestration',
                    'agents': ['ce-hub-orchestrator', 'ce-hub-engineer']
                },
                {
                    'id': 'proj-4',
                    'title': 'Knowledge Base Integration',
                    'description': 'RAG-powered knowledge management system',
                    'status': 'active',
                    'github_repo': 'https://github.com/ce-hub/knowledge-base',
                    'agents': ['research-intelligence-specialist']
                }
            ]

            # Filter projects if query provided
            if query:
                projects = [p for p in projects if query in p['title'].lower() or query in p['description'].lower()]

            self.send_json_response({
                'success': True,
                'projects': projects,
                'count': len(projects),
                'total_available': 78
            })

        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def send_json_response(self, data, status=200):
        json_data = json.dumps(data, indent=2)
        self.send_response(status)
        self.send_header('Content-Type', 'application/json')
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()
        self.wfile.write(json_data.encode('utf-8'))

    def do_OPTIONS(self):
        self.send_response(200)
        self.send_header('Access-Control-Allow-Origin', '*')
        self.send_header('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
        self.send_header('Access-Control-Allow-Headers', 'Content-Type, Authorization')
        self.end_headers()

if __name__ == "__main__":
    port = 8052
    with socketserver.TCPServer(('0.0.0.0', port), MockArchonMCPServer) as httpd:
        print(f"🔧 MOCK ARCHON MCP SERVER")
        print(f"")
        print(f"🌐 Server: http://100.95.223.19:{port}")
        print(f"💚 Health: http://100.95.223.19:{port}/health")
        print(f"🔍 Knowledge Search: http://100.95.223.19:{port}/rag/search_knowledge_base")
        print(f"📋 Projects: http://100.95.223.19:{port}/projects")
        print(f"")
        print(f"✅ Mock Services:")
        print(f"   • Knowledge Base Search")
        print(f"   • Project Management")
        print(f"   • Agent Coordination")
        print(f"")

        httpd.serve_forever()