#!/usr/bin/env python3
"""
Renata Chat - Minimal 5656 Style
Clean, minimal interface matching your 5656 setup
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import the GLM-powered system
from renata_glm_powered import RenataGLMPowered

class RenataChatMinimal:
    """Minimal Renata chat interface matching 5656 style"""

    def __init__(self, demo_mode=False):
        # Silent initialization - no startup messages
        self.renata = RenataGLMPowered()
        self.demo_mode = demo_mode
        self.chat_history = []
        self.session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Your familiar commands
        self.commands = {
            'help': self._show_help,
            'clear': self._clear_history,
            'status': self._show_status,
            'exit': self._exit_chat,
            'quit': self._exit_chat
        }

    def _show_help(self):
        print("\n📖 Available Commands:")
        print("   help - Show this help")
        print("   clear - Clear chat history")
        print("   status - Show system status")
        print("   exit/quit - Exit Renata")

    def _clear_history(self):
        self.chat_history = []
        print("\n✓ Chat history cleared")

    def _show_status(self):
        status = self.renata.get_system_status()
        print(f"\n📊 Status: {status['renata_status']['ai_engine']} - Ready")

    def _exit_chat(self):
        print("\n👋 Goodbye!")
        return True

    def _process_request(self, user_input):
        """Process user request with GLM 4.5"""
        try:
            result = self.renata.analyze_user_request(user_input)

            if result['success']:
                print(f"\n✅ {result.get('type', 'Completed')}")
                if 'recommendations' in result and result['recommendations']:
                    for rec in result['recommendations'][:2]:  # Show only top 2
                        print(f"   • {rec}")
            else:
                print(f"\n❌ Error: {result.get('error', 'Request failed')}")

            # Store in history
            self.chat_history.append({
                'timestamp': datetime.now().isoformat(),
                'request': user_input,
                'success': result.get('success', False)
            })

        except Exception as e:
            print(f"\n❌ Error: {str(e)}")

    def _run_demo(self):
        """Quick demo without verbose output"""
        demo_requests = [
            "Build a momentum scanner for technology stocks",
            "Optimize my backside B scanner parameters",
            "Debug why my scanner isn't generating signals"
        ]

        print("\n🎯 Quick Demo:")
        for i, request in enumerate(demo_requests, 1):
            print(f"\n{i}. {request}")
            self._process_request(request)
            print("─" * 30)

    def start(self):
        """Start the chat interface"""
        if self.demo_mode:
            self._run_demo()
            return

        # Clean startup - just one line
        print("\n💬 Renata (GLM 4.5) - Type 'help' for commands or just start chatting")
        print("─" * 60)

        while True:
            try:
                user_input = input("\n💬 You: ").strip()

                if not user_input:
                    continue

                if user_input.lower() in self.commands:
                    if self.commands[user_input.lower()]():
                        break
                else:
                    self._process_request(user_input)

            except KeyboardInterrupt:
                print("\n👋 Goodbye!")
                break
            except EOFError:
                # Non-interactive environment detected
                self._run_demo()
                break
            except Exception as e:
                print(f"\n❌ Error: {str(e)}")

def main():
    """Main entry point"""
    demo_mode = '--demo' in sys.argv or '-d' in sys.argv

    chat = RenataChatMinimal(demo_mode=demo_mode)
    chat.start()

if __name__ == "__main__":
    main()