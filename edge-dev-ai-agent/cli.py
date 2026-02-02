#!/usr/bin/env python3
"""
EdgeDev AI Agent - CLI Interface

Simple command-line interface for interacting with the agent.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.conversation.manager import ConversationManager
from src.llm.openrouter_client import LLMConfig


def print_banner():
    """Print welcome banner."""
    print("\n" + "=" * 60)
    print("  EdgeDev AI Agent - CLI")
    print("  Archon-Powered Trading Strategy Development")
    print("=" * 60)


def print_help():
    """Print help information."""
    print("""
Commands:
  /help     - Show this help
  /status   - Show system status
  /new      - Start new session
  /history  - Show conversation history
  /quit     - Exit

Examples:
  - "Create a scanner for mean reversion"
  - "What's the V31 architecture?"
  - "How do I implement pyramiding?"
  - "Explain backtest optimization"
""")


async def main():
    """Main CLI loop."""
    print_banner()

    # Check API key
    config = LLMConfig()
    if not config.api_key or config.api_key == "your_openrouter_api_key_here":
        print("\n⚠️  WARNING: OPENROUTER_API_KEY not set!")
        print("\nTo use this CLI:")
        print("1. Get API key from https://openrouter.ai/keys")
        print("2. Add to .env: OPENROUTER_API_KEY=your_key_here")
        print("3. Run this script again\n")
        return

    # Initialize conversation manager
    print(f"\nInitializing...")
    manager = ConversationManager()
    session_id = manager.create_session()

    print(f"✓ Connected to {config.default_model}")
    print(f"✓ Session: {session_id[:8]}...")
    print_help()

    print("\nType your message and press Enter. Type /help for commands.\n")

    # Main loop
    while True:
        try:
            # Get user input
            user_input = input("You: ").strip()

            if not user_input:
                continue

            # Handle commands
            if user_input.lower() in ["/quit", "/exit", "/q"]:
                print("\nGoodbye!")
                break

            if user_input.lower() == "/help":
                print_help()
                continue

            if user_input.lower() == "/status":
                status = manager.get_status()
                print(f"\nStatus:")
                print(f"  Sessions: {status['total_sessions']}")
                print(f"  Current: {status['current_session']}")
                print(f"  Model: {config.default_model}")
                continue

            if user_input.lower() == "/new":
                session_id = manager.create_session()
                print(f"\n✓ New session: {session_id[:8]}...")
                continue

            if user_input.lower() == "/history":
                history = manager.get_session_history()
                print(f"\nConversation History ({len(history)} messages):")
                for msg in history[-10:]:
                    role = msg["role"].upper()
                    content = msg["content"][:100]
                    print(f"  {role}: {content}...")
                continue

            # Send message to agent
            print("\nAgent: ", end="", flush=True)

            result = await manager.send_message(
                message=user_input,
                session_id=session_id
            )

            if result["status"] == "success":
                print(result["response"])
            else:
                print(f"Error: {result.get('error', 'Unknown error')}")

            print()  # Empty line for readability

        except KeyboardInterrupt:
            print("\n\nUse /quit to exit.")
        except EOFError:
            print("\n\nGoodbye!")
            break


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except Exception as e:
        print(f"\nError: {e}")
        sys.exit(1)
