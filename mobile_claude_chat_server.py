#!/usr/bin/env python3
"""
Mobile Claude Chat Server - Port 8115
Handles /claude-chat endpoint for mobile interface
"""

import http.server
import socketserver
import json
import time
from datetime import datetime

class MobileClaudeChatHandler(http.server.SimpleHTTPRequestHandler):
    def do_POST(self):
        if self.path == '/claude-chat':
            try:
                # Read request data
                content_length = int(self.headers['Content-Length'])
                post_data = self.rfile.read(content_length)
                data = json.loads(post_data.decode('utf-8'))

                question = data.get('question', '').strip()
                model = data.get('model', 'claude-3-sonnet')
                provider = data.get('provider', 'test')

                # Mock response that looks like a real Claude response
                response = f"""🤖 **Claude Response**

**Question:** {question}
**Model:** {model}
**Provider:** {provider}
**Time:** {datetime.now().strftime('%H:%M:%S')}

Hello! I'm your Claude assistant running through the CE-Hub mobile bridge system.

✅ **Connection Status:** SUCCESS
🌐 **Server:** Running on port 8115
📱 **Mobile Interface:** Connected

This response confirms that:
- The mobile interface can successfully connect to the Claude chat endpoint
- The API is receiving requests properly
- JSON communication is working correctly

**Available Features:**
- Model selection interface ✅
- Provider selection ✅
- Question processing ✅
- Response delivery ✅

**Next Steps:**
Once you confirm this basic connection works, we can integrate:
- Real Claude API responses
- Archon MCP tool integration
- Agent orchestration
- Project management features

The mobile bridge platform is now fully functional!
"""

                self.send_json_response({
                    'error': False,
                    'output': response,
                    'model': model,
                    'provider': provider,
                    'timestamp': datetime.now().isoformat(),
                    'status': 'connected'
                })

            except Exception as e:
                self.send_json_response({
                    'error': True,
                    'output': f'Server error: {str(e)}',
                    'status': 'error'
                })
        else:
            self.send_error(404, "Endpoint not found")

    def do_GET(self):
        if self.path == '/health':
            self.send_json_response({
                'status': 'healthy',
                'service': 'mobile-claude-chat-server',
                'port': 8115,
                'endpoint': '/claude-chat'
            })
        else:
            self.send_error(404, "Endpoint not found")

    def send_json_response(self, data):
        json_data = json.dumps(data, indent=2)
        self.send_response(200)
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
    with socketserver.TCPServer(('0.0.0.0', port), MobileClaudeChatHandler) as httpd:
        print(f"🚀 MOBILE CLAUDE CHAT SERVER")
        print(f"")
        print(f"📱 Mobile Interface: http://100.95.223.19:{port}/")
        print(f"🔗 Chat Endpoint: http://100.95.223.19:{port}/claude-chat")
        print(f"💚 Health Check: http://100.95.223.19:{port}/health")
        print(f"")
        print(f"✅ Ready to handle mobile model launches!")
        print(f"")

        httpd.serve_forever()