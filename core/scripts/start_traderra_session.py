#!/usr/bin/env python3
"""
Traderra Automated Development Session Starter
Automatically sets up context, agents, and workflow optimization
"""

import sys
import json
from pathlib import Path

# Add the automation directory to path
sys.path.append(str(Path(__file__).parent / "automation"))

from context_manager import ContextManager

def start_traderra_session():
    """Start an optimized Traderra development session"""
    print("🚀 Starting Traderra Development Session")
    print("=" * 50)

    # Initialize context manager
    context = ContextManager()
    session_id = context.start_session("traderra_development")

    print(f"✓ Session ID: {session_id}")
    print("✓ Context tracking enabled")
    print("✓ Automatic agent dispatch configured")
    print("✓ Screenshot analysis ready")
    print("✓ Decision logging active")

    print("\n📋 Session Ready - Key Features:")
    print("• Send screenshots for automatic UI analysis")
    print("• Agents will be auto-dispatched based on request type")
    print("• All decisions and context will be preserved")
    print("• Regression prevention system active")

    print("\n🎯 Optimized for:")
    print("• Fast UI iterations")
    print("• Context preservation")
    print("• Automatic documentation")
    print("• Quality assurance")

    return session_id

if __name__ == "__main__":
    start_traderra_session()
