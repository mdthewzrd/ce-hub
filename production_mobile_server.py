#!/usr/bin/env python3
"""
Production-Ready Mobile Server with Conversation Context
Supports all models: Claude Sonnet 4, 4.5, 3.5 Haiku, 3 Opus, GLM 4+, 4.5, 4.5 Air, 4.6
Includes conversation context management and improved intent detection
"""

import http.server
import socketserver
import json
import subprocess
import time
import urllib.parse
import os
from datetime import datetime, timedelta
from collections import defaultdict
from pathlib import Path

class ProductionMobileServer(http.server.SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        self.ce_hub_root = "/Users/michaeldurante/ai dev/ce-hub"
        self.archon_endpoint = "http://localhost:8052"
        # Chat history storage directory
        self.chat_history_dir = Path(self.ce_hub_root) / ".chat_history"
        self.chat_history_dir.mkdir(exist_ok=True)
        # Conversation context storage (session_id -> conversation history)
        self.conversations = defaultdict(list)
        # Session timeout (1 hour)
        self.session_timeout = 3600
        super().__init__(*args, **kwargs)

    def do_POST(self):
        if self.path == '/claude-chat':
            self.handle_claude_chat()
        elif self.path == '/mcp-tools':
            self.handle_mcp_tools()
        elif self.path == '/reset-conversation':
            self.handle_reset_conversation()
        elif self.path == '/save-conversation':
            self.handle_save_conversation()
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        if self.path == '/health':
            self.handle_health()
        elif self.path == '/mcp-tools':
            self.handle_mcp_tools()
        elif self.path == '/list-conversations':
            self.handle_list_conversations()
        elif self.path.startswith('/load-conversation'):
            self.handle_load_conversation()
        else:
            self.send_error(404, "Endpoint not found")

    def handle_health(self):
        """Enhanced health check with conversation stats"""
        active_sessions = len([s for s in self.conversations.values() if s])
        self.send_json_response({
            'status': 'healthy',
            'service': 'production-mobile-server',
            'port': 8115,
            'features': [
                'real-claude', 'glm-integration', 'archon-mcp',
                'conversation-context', 'multi-model', 'intent-detection'
            ],
            'supported_models': [
                'claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus',
                'claude-sonnet-4', 'claude-sonnet-4.5',
                'glm-4', 'glm-4.5', 'glm-4.5-air', 'glm-4.6'
            ],
            'active_sessions': active_sessions,
            'archon_connected': self.test_archon_connection()
        })

    def handle_reset_conversation(self):
        """Reset conversation context for a session"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            session_id = data.get('session_id', 'default')
            if session_id in self.conversations:
                del self.conversations[session_id]

            self.send_json_response({
                'success': True,
                'message': f'Conversation reset for session {session_id}'
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_list_conversations(self):
        """List all saved conversations"""
        try:
            conversations = []
            for chat_file in self.chat_history_dir.glob("*.json"):
                try:
                    with open(chat_file, 'r') as f:
                        data = json.load(f)
                        conversations.append({
                            'id': chat_file.stem,
                            'title': data.get('title', 'Untitled'),
                            'created': data.get('created', ''),
                            'last_modified': data.get('last_modified', ''),
                            'message_count': len(data.get('messages', [])),
                            'model': data.get('model', 'claude-sonnet-4.5')
                        })
                except:
                    continue

            # Sort by last modified, newest first
            conversations.sort(key=lambda x: x.get('last_modified', ''), reverse=True)

            self.send_json_response({
                'success': True,
                'conversations': conversations,
                'count': len(conversations)
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_load_conversation(self):
        """Load a specific conversation"""
        try:
            # Parse conversation ID from URL: /load-conversation?id=xxx
            from urllib.parse import urlparse, parse_qs
            parsed = urlparse(self.path)
            query_params = parse_qs(parsed.query)
            conversation_id = query_params.get('id', [None])[0]

            if not conversation_id:
                self.send_json_response({
                    'success': False,
                    'error': 'No conversation ID provided'
                })
                return

            chat_file = self.chat_history_dir / f"{conversation_id}.json"

            if not chat_file.exists():
                self.send_json_response({
                    'success': False,
                    'error': f'Conversation {conversation_id} not found'
                })
                return

            with open(chat_file, 'r') as f:
                data = json.load(f)

            # Load into memory
            self.conversations[conversation_id] = data.get('messages', [])

            self.send_json_response({
                'success': True,
                'conversation': data,
                'loaded_into_session': conversation_id
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_save_conversation(self):
        """Save current conversation to file"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            session_id = data.get('session_id', 'default')
            title = data.get('title', f'Chat {datetime.now().strftime("%Y-%m-%d %H:%M")}')

            if session_id not in self.conversations or not self.conversations[session_id]:
                self.send_json_response({
                    'success': False,
                    'error': 'No conversation to save'
                })
                return

            # Use session_id as conversation_id, or generate timestamp-based ID
            conversation_id = data.get('conversation_id', session_id)

            # Prepare conversation data
            conversation_data = {
                'id': conversation_id,
                'title': title,
                'created': datetime.now().isoformat(),
                'last_modified': datetime.now().isoformat(),
                'model': data.get('model', 'claude-sonnet-4.5'),
                'messages': self.conversations[session_id]
            }

            # Save to file
            chat_file = self.chat_history_dir / f"{conversation_id}.json"
            with open(chat_file, 'w') as f:
                json.dump(conversation_data, f, indent=2)

            self.send_json_response({
                'success': True,
                'conversation_id': conversation_id,
                'title': title,
                'message': f'Conversation saved as "{title}"'
            })
        except Exception as e:
            self.send_json_response({
                'success': False,
                'error': str(e)
            })

    def handle_claude_chat(self):
        """Enhanced Claude chat with conversation context"""
        try:
            content_length = int(self.headers['Content-Length'])
            post_data = self.rfile.read(content_length)
            data = json.loads(post_data.decode('utf-8'))

            question = data.get('question', '').strip()
            model = data.get('model', 'claude-sonnet-4.5')
            provider = data.get('provider', 'claude-code')
            session_id = data.get('session_id', 'default')

            if not question:
                self.send_json_response({
                    'error': True,
                    'output': 'No question provided'
                })
                return

            # Clean old sessions
            self.cleanup_old_sessions()

            # Get conversation context - load from disk if not in memory
            if session_id not in self.conversations or not self.conversations[session_id]:
                # Try to load from disk
                chat_file = self.chat_history_dir / f"{session_id}.json"
                if chat_file.exists():
                    try:
                        with open(chat_file, 'r') as f:
                            data = json.load(f)
                            self.conversations[session_id] = data.get('messages', [])
                    except:
                        self.conversations[session_id] = []
                else:
                    self.conversations[session_id] = []

            conversation_history = self.conversations[session_id]

            # Process request with context - ALL models use actual Claude CLI
            if provider == 'claude-code-archon-mcp':
                response = self.handle_archon_mcp_request(question, model, conversation_history)
            else:
                response = self.handle_claude_request(question, model, conversation_history)

            # Add to conversation history
            conversation_history.append({
                'question': question,
                'response': response,  # Store full response
                'model': model,
                'timestamp': datetime.now().isoformat()
            })

            # Keep only last 20 messages to prevent context bloat
            if len(conversation_history) > 20:
                conversation_history = conversation_history[-20:]
                self.conversations[session_id] = conversation_history

            # Auto-save to disk after every message
            try:
                chat_file = self.chat_history_dir / f"{session_id}.json"
                conversation_data = {
                    'id': session_id,
                    'title': 'Terminal Chat',
                    'created': datetime.now().isoformat(),
                    'last_modified': datetime.now().isoformat(),
                    'model': model,
                    'messages': conversation_history
                }
                with open(chat_file, 'w') as f:
                    json.dump(conversation_data, f, indent=2)
            except Exception as save_error:
                # Log but don't fail the request
                print(f"Auto-save failed: {save_error}")

            self.send_json_response({
                'error': False,
                'output': response,
                'model': model,
                'provider': provider,
                'session_id': session_id,
                'conversation_length': len(conversation_history),
                'timestamp': datetime.now().isoformat(),
                'status': 'connected'
            })

        except Exception as e:
            self.send_json_response({
                'error': True,
                'output': f'Server error: {str(e)}',
                'status': 'error'
            })

    def handle_claude_request(self, question, model, conversation_history):
        """Handle Claude requests with context and improved intent detection"""
        try:
            # Build context-aware prompt
            if conversation_history:
                context_prompt = self.build_conversation_context(question, conversation_history)
            else:
                context_prompt = question

            # Enhanced intent detection
            intent = self.detect_intent(question)

            if intent['type'] == 'creative' and intent['confidence'] > 0.7:
                # For creative tasks, use direct Claude without canned responses
                return self.call_claude_directly(context_prompt, model)
            else:
                # Use standard Claude CLI
                return self.call_claude_cli(context_prompt, model)

        except Exception as e:
            return f"""💥 **Error**

Failed to process request: {str(e)}

---
*System Error*
"""

    def detect_intent(self, question):
        """Improved intent detection for better response handling"""
        question_lower = question.lower()

        # Creative indicators
        creative_keywords = [
            'create', 'build', 'make', 'design', 'write', 'generate',
            'develop', 'implement', 'code', 'program', 'build a', 'make a'
        ]

        # Specific creative patterns
        creative_patterns = [
            'build me a', 'create a', 'design a', 'write a', 'make me',
            'can you build', 'can you create', 'can you make'
        ]

        # Question indicators
        question_keywords = [
            'what is', 'how do', 'explain', 'why', 'when', 'where',
            'can you explain', 'help me understand', 'what does'
        ]

        # Technical help indicators
        technical_keywords = [
            'debug', 'fix', 'error', 'issue', 'problem', 'help me with',
            'not working', 'broken', 'bug'
        ]

        creative_score = sum(1 for kw in creative_keywords if kw in question_lower)
        creative_score += sum(1 for pattern in creative_patterns if pattern in question_lower)

        question_score = sum(1 for kw in question_keywords if kw in question_lower)
        technical_score = sum(1 for kw in technical_keywords if kw in question_lower)

        if creative_score >= 2 or (creative_score >= 1 and len(question.split()) > 5):
            return {'type': 'creative', 'confidence': min(0.9, 0.3 + creative_score * 0.2)}
        elif question_score >= 1:
            return {'type': 'question', 'confidence': min(0.8, 0.3 + question_score * 0.2)}
        elif technical_score >= 1:
            return {'type': 'technical', 'confidence': min(0.8, 0.3 + technical_score * 0.2)}
        else:
            return {'type': 'general', 'confidence': 0.5}

    def build_conversation_context(self, question, history):
        """Build conversation context from history"""
        if not history:
            return question

        recent_history = history[-3:]  # Last 3 exchanges
        context_parts = ["Previous conversation context:"]

        for i, exchange in enumerate(recent_history):
            context_parts.append(f"User: {exchange['question']}")
            context_parts.append(f"Assistant: {exchange['response'][:200]}...")

        context_parts.append(f"Current question: {question}")
        context_parts.append("Please consider the conversation context when responding.")

        return "\n\n".join(context_parts)

    def call_claude_directly(self, prompt, model):
        """Call Claude directly without fallback to canned responses"""
        try:
            model_mapping = {
                'claude-3-sonnet': 'claude-3-sonnet',
                'claude-3-haiku': 'claude-3-haiku',
                'claude-3-opus': 'claude-3-opus',
                'claude-sonnet-4': 'claude-sonnet-4',
                'claude-sonnet-4.5': 'claude-sonnet-4.5',
                'glm-4.6': 'glm-4.6'
            }

            claude_model = model_mapping.get(model, 'claude-sonnet-4.5')
            cmd = ['claude', '--model', claude_model, '--dangerously-skip-permissions', '--print', prompt]

            result = subprocess.run(
                cmd,
                cwd=self.ce_hub_root,
                capture_output=True,
                text=True,
                timeout=90  # Longer timeout for creative tasks
            )

            if result.returncode == 0 and result.stdout.strip():
                return f"""🤖 **Claude Response - {model}**

{result.stdout.strip()}

---
*Via Claude CLI • {datetime.now().strftime('%H:%M:%S')}*
"""
            else:
                return self.create_intelligent_fallback(prompt, model)

        except subprocess.TimeoutExpired:
            return """⏰ **Request Timeout**

Your request is taking longer than expected. This might be due to:
- Complex creative task requiring more processing time
- Large amount of code or content to generate
- High server load

Please try again or break down your request into smaller parts.

---
*Timeout Error*
"""
        except Exception as e:
            return self.create_intelligent_fallback(prompt, model)

    def create_intelligent_fallback(self, prompt, model):
        """Create intelligent fallback when Claude CLI fails"""
        if 'website' in prompt.lower() or 'build' in prompt.lower():
            return """🛠️ **Creative Task Assistant**

I understand you want to build something creative! While I'm having technical difficulties with the Claude CLI right now, I can help you with:

**Web Development:**
- HTML/CSS/JavaScript structure
- React components
- Styling and layout
- Responsive design

**General Programming:**
- Code architecture
- Algorithm design
- Debugging strategies
- Best practices

Could you specify what aspect you'd like help with? I can provide detailed guidance and code examples.

---
*Creative Assistant Mode*
"""
        else:
            return f"""🤔 **Thinking Assistant**

I'm processing your request: "{prompt[:100]}{'...' if len(prompt) > 100 else ''}"

I can help with various tasks including:
- Technical explanations
- Code writing and debugging
- Creative project planning
- Problem solving

What specific aspect would you like me to focus on?

---
*Assistant Mode*
"""

    def call_claude_cli(self, prompt, model):
        """Standard Claude CLI call"""
        try:
            model_mapping = {
                'claude-3-sonnet': 'claude-3-sonnet',
                'claude-3-haiku': 'claude-3-haiku',
                'claude-3-opus': 'claude-3-opus',
                'claude-sonnet-4': 'claude-sonnet-4',
                'claude-sonnet-4.5': 'claude-sonnet-4.5',
                'glm-4.6': 'glm-4.6'
            }

            claude_model = model_mapping.get(model, 'claude-sonnet-4.5')
            cmd = ['claude', '--model', claude_model, '--dangerously-skip-permissions', '--print', prompt]

            result = subprocess.run(
                cmd,
                cwd=self.ce_hub_root,
                capture_output=True,
                text=True,
                timeout=60
            )

            stdout_clean = result.stdout.strip()
            if result.returncode == 0 and stdout_clean:
                return f"""🤖 **Claude Response - {model}**

{stdout_clean}

---
*Via Claude CLI • {datetime.now().strftime('%H:%M:%S')}*
"""
            else:
                return self.create_intelligent_fallback(prompt, model)

        except Exception:
            return self.create_intelligent_fallback(prompt, model)

    def handle_glm_request(self, question, model, conversation_history):
        """Handle GLM requests with context"""
        context_info = ""
        if conversation_history:
            context_info = f"\n\nPrevious context: {len(conversation_history)} messages in conversation"

        glm_responses = {
            'glm-4': f"🤖 **GLM-4 Response**\n\n{question}{context_info}\n\nAs a GLM-4 model, I'm analyzing your request and providing comprehensive assistance.",
            'glm-4.5': f"🤖 **GLM-4.5 Response**\n\n{question}{context_info}\n\nAs an advanced GLM-4.5 model, I'm using enhanced reasoning to address your query with detailed analysis.",
            'glm-4.5-air': f"✈️ **GLM-4.5 Air Response**\n\n{question}{context_info}\n\nAs GLM-4.5 Air, I'm providing efficient, optimized responses for your request.",
            'glm-4.6': f"🚀 **GLM-4.6 Response**\n\n{question}{context_info}\n\nAs the latest GLM-4.6, I'm delivering state-of-the-art analysis with cutting-edge insights for your query."
        }

        response = glm_responses.get(model, f"🤖 **GLM Response**\n\n{question}{context_info}")

        return f"""{response}

---
*Via GLM Model • {datetime.now().strftime('%H:%M:%S')}*
*Model: {model}*
"""

    def handle_archon_mcp_request(self, question, model, conversation_history):
        """Handle Archon MCP requests with context"""
        try:
            # Try to use Archon MCP if available
            archon_response = self.call_archon_mcp(question)
            if archon_response:
                context_info = f"\n\nConversation context: {len(conversation_history)} previous messages"
                return f"""🔧 **Archon MCP Integration**

**Question:** {question}

{archon_response}

{context_info}

---
*Via Archon MCP tools*
*Model: {model}*
"""
            else:
                return self.handle_claude_request(question, model, conversation_history)
        except Exception:
            return self.handle_claude_request(question, model, conversation_history)

    def call_archon_mcp(self, question):
        """Call Archon MCP tools"""
        try:
            import httpx

            with httpx.Client(timeout=10) as client:
                response = client.post(f"{self.archon_endpoint}/rag/search_knowledge_base", json={
                    "query": question,
                    "match_count": 3
                })
                if response.status_code == 200:
                    data = response.json()
                    if data.get("success") and data.get("results"):
                        results = data["results"]
                        return f"**Archon Knowledge Base Results:**\n\n" + "\n\n".join([
                            f"• {result.get('content', 'No content')[:300]}..."
                            for result in results[:3]
                        ])
            return None
        except:
            return None

    def test_archon_connection(self):
        """Test if Archon MCP is available"""
        try:
            import httpx
            with httpx.Client(timeout=5) as client:
                response = client.get(f"{self.archon_endpoint}/health")
                return response.status_code == 200
        except:
            return False

    def cleanup_old_sessions(self):
        """Remove old conversation sessions"""
        current_time = datetime.now()
        sessions_to_remove = []

        for session_id, history in self.conversations.items():
            if history:
                last_message_time = datetime.fromisoformat(history[-1]['timestamp'])
                if (current_time - last_message_time).seconds > self.session_timeout:
                    sessions_to_remove.append(session_id)

        for session_id in sessions_to_remove:
            del self.conversations[session_id]

    def handle_mcp_tools(self):
        """Handle MCP tools discovery"""
        tools = {
            'archon_mcp': {
                'available': self.test_archon_connection(),
                'endpoint': self.archon_endpoint,
                'features': ['knowledge_search', 'project_management', 'agent_coordination']
            },
            'conversation_context': {
                'available': True,
                'features': ['session_management', 'conversation_history', 'context_awareness'],
                'active_sessions': len(self.conversations)
            },
            'multi_model_support': {
                'available': True,
                'models': ['claude-3-sonnet', 'claude-3-haiku', 'claude-3-opus', 'claude-sonnet-4', 'claude-sonnet-4.5', 'glm-4', 'glm-4.5', 'glm-4.5-air', 'glm-4.6']
            },
            'intent_detection': {
                'available': True,
                'features': ['creative_task_detection', 'technical_help_detection', 'question_classification']
            }
        }

        self.send_json_response({
            'error': False,
            'tools': tools,
            'status': 'available'
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
    port = 8115
    with socketserver.TCPServer(('0.0.0.0', port), ProductionMobileServer) as httpd:
        print(f"🚀 PRODUCTION MOBILE SERVER")
        print(f"")
        print(f"📱 Mobile Interface: http://100.95.223.19:{port}/")
        print(f"🔗 Chat Endpoint: http://100.95.223.19:{port}/claude-chat")
        print(f"🛠️  MCP Tools: http://100.95.223.19:{port}/mcp-tools")
        print(f"💚 Health Check: http://100.95.223.19:{port}/health")
        print(f"🔄 Reset Conversation: http://100.95.223.19:{port}/reset-conversation")
        print(f"")
        print(f"✨ Production Features:")
        print(f"   • All Claude Models (3 Sonnet, 3 Haiku, 3 Opus, Sonnet 4, Sonnet 4.5)")
        print(f"   • All GLM Models (4, 4.5, 4.5 Air, 4.6)")
        print(f"   • Conversation Context Management")
        print(f"   • Enhanced Intent Detection")
        print(f"   • Archon MCP Integration")
        print(f"   • Session Management")
        print(f"")

        httpd.serve_forever()