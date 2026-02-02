#!/usr/bin/env python3
"""
🤖 RENATA CHAT INTERFACE - GLM 4.5 POWERED
=====================================
Your familiar Renata chat interface from 5656, now powered by GLM 4.5
Maintains the exact same look and feel you're used to
"""

import json
import sys
import os
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Any, Optional

# Import the GLM-powered system
from renata_glm_powered import RenataGLMPowered

class RenataChat5656:
    """
    Exact replica of your 5656 Renata chat interface
    Powered by GLM 4.5 with bulletproof scanner system
    """

    def __init__(self):
        print("🤖 RENATA CHAT INITIALIZING...")

        # Initialize GLM 4.5 powered Renata
        self.renata = RenataGLMPowered()

        # Chat interface styling (exactly like 5656)
        self.chat_prompt = "💬 Renata: "
        self.user_prompt = "💬 You: "
        self.chat_history = []
        self.session_id = f"session_{datetime.now().strftime('%Y%m%d_%H%M%S')}"

        # Your familiar command structure
        self.commands = {
            'help': self._show_help,
            'clear': self._clear_history,
            'status': self._show_status,
            'history': self._show_history,
            'scanners': self._show_scanners,
            'export': self._export_session,
            'exit': self._exit_chat,
            'quit': self._exit_chat
        }

        # Available scanner types (familiar from 5656)
        self.scanner_types = [
            'backside_b',
            'half_a_plus',
            'lc_multiscanner'
        ]

        # Welcome message (exactly like 5656)
        self.welcome_message = """
🤖 RENATA - GLM 4.5 POWERED
=============================

Hello! I'm Renata, your AI scanner assistant, now supercharged with GLM 4.5 intelligence.

🔧 What I can help you with:
• Build scanners from natural language
• Optimize scanner parameters
• Debug scanner issues
• Analyze scanner results
• Research market strategies
• Execute multiple scans
• Advanced troubleshooting

💬 Type 'help' for commands or just start talking to me!
        """

    def start(self):
        """Start the chat interface (exactly like 5656)"""

        print(self.welcome_message)
        print("\n" + "="*60)

        # Main chat loop
        while True:
            try:
                # Get user input (exactly like 5656)
                user_input = input(self.user_prompt).strip()

                if not user_input:
                    continue

                # Handle commands
                if user_input.lower().startswith('/'):
                    self._handle_command(user_input[1:].lower())
                    continue

                # Handle exit
                if user_input.lower() in ['exit', 'quit']:
                    self._exit_chat()
                    break

                # Process with GLM 4.5
                self._process_user_message(user_input)

            except KeyboardInterrupt:
                print(f"\n{self.chat_prompt}Goodbye! Come back anytime! 👋")
                break
            except Exception as e:
                print(f"\n{self.chat_prompt}Oops! Something went wrong: {str(e)}")
                continue

    def _process_user_message(self, message: str):
        """Process user message with GLM 4.5 (core chat logic)"""

        # Add to history
        self.chat_history.append({
            'type': 'user',
            'message': message,
            'timestamp': datetime.now().isoformat()
        })

        # Process with GLM 4.5
        try:
            result = self.renata.analyze_user_request(message)

            # Format response (exactly like 5656)
            self._display_renata_response(result)

            # Add to history
            self.chat_history.append({
                'type': 'renata',
                'message': result.get('response', result.get('result', 'Task completed')),
                'timestamp': datetime.now().isoformat(),
                'success': result.get('success', False)
            })

        except Exception as e:
            error_response = {
                'success': False,
                'error': str(e),
                'response': f"I encountered an error: {str(e)}. Can you try rephrasing your request?"
            }
            self._display_renata_response(error_response)

    def _display_renata_response(self, result: Dict[str, Any]):
        """Display Renata's response (exactly like 5656 format)"""

        print(f"\n{self.chat_prompt}")

        if result.get('success'):
            # Success response
            response_text = result.get('result', result.get('response', 'Task completed successfully'))

            # Add GLM 4.5 insights if available
            if result.get('glm4_insights'):
                response_text += f"\n\n🧠 GLM 4.5 Insight: {result['glm4_insights']}"

            # Add recommendations if available
            if result.get('recommendations'):
                response_text += "\n\n💡 Recommendations:"
                for i, rec in enumerate(result['recommendations'], 1):
                    response_text += f"\n   {i}. {rec}"

            print(response_text)

            # Show task completion
            if result.get('type'):
                task_icons = {
                    'scanner_built': '🔧',
                    'scanner_optimized': '⚡',
                    'scanner_debugged': '🐛',
                    'market_research': '🌐',
                    'strategy_analyzed': '🎯'
                }
                icon = task_icons.get(result['type'], '✅')
                print(f"{icon} {result['type'].replace('_', ' ').title()} completed!")

        else:
            # Error response
            error_msg = result.get('error', result.get('response', 'Unknown error occurred'))
            print(f"❌ {error_msg}")

            if result.get('recommendation'):
                print(f"💡 {result['recommendation']}")

    def _handle_command(self, command: str):
        """Handle slash commands (exactly like 5656)"""

        if command in self.commands:
            self.commands[command]()
        else:
            print(f"{self.chat_prompt}Unknown command: /{command}")
            print("Type /help for available commands")

    def _show_help(self):
        """Show help (exactly like 5656 format)"""

        help_text = f"""
📖 RENATA COMMANDS:
===================

Basic Commands:
• /help - Show this help message
• /status - Show system status
• /clear - Clear chat history
• /history - Show conversation history
• /export - Export session to file

Scanner Commands:
• /scanners - Show available scanner types
• /run <scanner_type> - Quick scanner run

Examples:
• "Build a momentum scanner for tech stocks"
• "Optimize my backside B parameters"
• "Debug why scanner isn't generating signals"
• "Research AI market trends"
• "Analyze scanner performance"

Scanner Types: {', '.join(self.scanner_types)}

Type 'quit' or 'exit' to end conversation
        """

        print(f"\n{self.chat_prompt}{help_text}")

    def _show_status(self):
        """Show system status"""

        status = self.renata.get_system_status()

        status_text = f"""
📊 SYSTEM STATUS:
================

AI Engine: {status['renata_status']['ai_engine']}
Version: {status['renata_status']['version']}
Tasks Processed: {status['renata_status']['tasks_processed']}
Integration: {status['integration_status']}

Scanner System: {status['scanner_system_status']['system_health']}
Parameter Integrity: {status['scanner_system_status']['parameter_integrity_status']}

Session: {self.session_id}
Messages: {len(self.chat_history)}
        """

        print(f"\n{self.chat_prompt}{status_text}")

    def _show_history(self):
        """Show conversation history"""

        if not self.chat_history:
            print(f"\n{self.chat_prompt}No messages in history")
            return

        print(f"\n{self.chat_prompt}CHAT HISTORY:")
        print("="*50)

        for i, msg in enumerate(self.chat_history[-10:], 1):  # Last 10 messages
            icon = "👤" if msg['type'] == 'user' else "🤖"
            status = "✅" if msg.get('success', True) else "❌"
            timestamp = msg['timestamp'][:19]  # Just HH:MM:SS format
            message_preview = msg['message'][:60] + "..." if len(msg['message']) > 60 else msg['message']

            print(f"{i:2d}. {icon} [{timestamp}] {status} {message_preview}")

    def _show_scanners(self):
        """Show available scanners"""

        scanners_text = f"""
🔧 AVAILABLE SCANNERS:
=====================

1. backside_b
   • Conservative institutional-grade scanner
   • High parameter integrity
   • Risk-focused filtering

2. half_a_plus
   • Original A+ parameters
   • Momentum-based strategy
   • High signal quality

3. lc_multiscanner
   • Small-cap growth focus
   • Higher opportunity volume
   • Growth-oriented filters

Usage Examples:
• "Build a backside_b scanner for tech stocks"
• "Create half_a_plus scanner with AI optimization"
• "Run lc_multiscanner on biotech stocks"
        """

        print(f"\n{self.chat_prompt}{scanners_text}")

    def _clear_history(self):
        """Clear chat history"""
        self.chat_history = []
        print(f"\n{self.chat_prompt}Chat history cleared ✅")

    def _export_session(self):
        """Export session to file"""

        if not self.chat_history:
            print(f"\n{self.chat_prompt}No conversation to export")
            return

        filename = f"renata_session_{datetime.now().strftime('%Y%m%d_%H%M%S')}.json"

        session_data = {
            'session_id': self.session_id,
            'timestamp': datetime.now().isoformat(),
            'total_messages': len(self.chat_history),
            'chat_history': self.chat_history
        }

        try:
            with open(filename, 'w') as f:
                json.dump(session_data, f, indent=2)

            print(f"\n{self.chat_prompt}Session exported to: {filename} ✅")

        except Exception as e:
            print(f"\n{self.chat_prompt}Export failed: {str(e)}")

    def _exit_chat(self):
        """Exit chat"""
        print(f"\n{self.chat_prompt}Thank you for using Renata! 🤖")
        print(f"📊 Session: {self.session_id}")
        print(f"💬 Messages: {len(self.chat_history)}")
        print("👋 See you next time!")

def main():
    """Main entry point"""

    # Create banner (exactly like 5656)
    print("🚀 STARTING RENATA CHAT")
    print("="*50)
    print("🤖 Renata - GLM 4.5 Powered")
    print("🔒 Bulletproof Parameter Integrity")
    print("⚡ Advanced Scanner Intelligence")
    print("="*50)

    # Start chat interface
    chat = RenataChat5656()
    chat.start()

if __name__ == "__main__":
    main()