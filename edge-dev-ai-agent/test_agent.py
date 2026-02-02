#!/usr/bin/env python3
"""
Test script for EdgeDev AI Agent

Tests the agent system without needing the web server.
"""

import asyncio
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))

from src.conversation.manager import ConversationManager


async def test_knowledge_retrieval():
    """Test knowledge base retrieval."""
    print("\n" + "=" * 60)
    print("  TEST 1: Knowledge Base Retrieval")
    print("=" * 60)

    from src.ingest.local_retriever import LocalKnowledgeRetriever

    chunks_dir = Path(__file__).parent / "data" / "chunks"
    if not chunks_dir.exists():
        print("  ✗ Knowledge base not found")
        return False

    retriever = LocalKnowledgeRetriever(str(chunks_dir))
    results = retriever.search("V31 scanner architecture", match_count=3)

    print(f"  ✓ Loaded {len(retriever.chunks)} chunks")
    print(f"  ✓ Found {len(results)} results for test query")
    print(f"    First result: {results[0].get('source_file', 'Unknown')}")
    return True


async def test_orchestrator():
    """Test orchestrator agent."""
    print("\n" + "=" * 60)
    print("  TEST 2: Orchestrator Agent")
    print("=" * 60)

    from src.agents.orchestrator import create_orchestrator
    from src.agents.scanner_builder import create_scanner_builder
    from src.llm.openrouter_client import LLMConfig

    # Check for API key
    config = LLMConfig()
    if not config.api_key or config.api_key == "your_openrouter_api_key_here":
        print("  ⚠️  Skipping LLM test (no API key)")
        print("     Set OPENROUTER_API_KEY in .env to test")
        return False

    # Create orchestrator with scanner builder
    subagents = {
        "scanner_builder": create_scanner_builder(),
    }
    orchestrator = create_orchestrator(subagents=subagents)

    print(f"  ✓ Orchestrator created")
    print(f"  ✓ Registered agents: {list(orchestrator.subagents.keys())}")
    print(f"  ✓ Total subagents: {len(orchestrator.subagents)}")

    # Test routing
    test_requests = [
        ("Create a scanner for mean reversion", "scanner_builder"),
        ("Help me optimize my strategy", "unimplemented_strategy_builder"),
        ("What's the current market regime?", None),  # Goes to orchestrator
    ]

    print(f"\n  Testing routing logic:")
    for request, expected in test_requests:
        routed = orchestrator._route_request(request)
        status = "✓" if routed == expected else "✗"
        print(f"    {status} '{request[:40]}...'")
        print(f"       Expected: {expected}, Got: {routed}")

    return True


async def test_conversation_manager():
    """Test conversation manager."""
    print("\n" + "=" * 60)
    print("  TEST 3: Conversation Manager")
    print("=" * 60)

    from src.conversation.manager import ConversationManager

    # Check for API key
    from src.llm.openrouter_client import LLMConfig
    config = LLMConfig()
    if not config.api_key or config.api_key == "your_openrouter_api_key_here":
        print("  ⚠️  Skipping conversation test (no API key)")
        return False

    manager = ConversationManager()

    # Create session
    session_id = manager.create_session()
    print(f"  ✓ Created session: {session_id[:8]}...")

    # Send message
    response = await manager.send_message(
        message="What is V31 scanner architecture?",
        session_id=session_id
    )
    print(f"  ✓ Sent message, got response: {response['status']}")
    print(f"  ✓ Response preview: {response['response'][:100]}...")

    # Get history
    history = manager.get_session_history(session_id)
    print(f"  ✓ Session history: {len(history)} messages")

    # Get status
    status = manager.get_status()
    print(f"  ✓ Manager status: {status['total_sessions']} session(s)")

    return True


async def test_agent_response():
    """Test full agent response with LLM."""
    print("\n" + "=" * 60)
    print("  TEST 4: Full Agent Response (LLM)")
    print("=" * 60)

    from src.llm.openrouter_client import LLMConfig, get_client, Message

    config = LLMConfig()
    if not config.api_key or config.api_key == "your_openrouter_api_key_here":
        print("  ⚠️  Skipping LLM test (no API key)")
        print("\n  To test LLM integration:")
        print("  1. Get API key from https://openrouter.ai/keys")
        print("  2. Add to .env: OPENROUTER_API_KEY=your_key_here")
        print("  3. Run this test again")
        return False

    client = get_client()

    # Simple test call
    messages = [
        Message(role="user", content="What is 2+2?"),
    ]

    print(f"  Sending test message to {client.model}...")

    try:
        response = await client.chat(messages)
        print(f"  ✓ Got response: {response.content[:100]}")
        print(f"  ✓ Model: {response.model}")
        print(f"  ✓ Tokens: {response.usage['total_tokens']}")
        return True
    except Exception as e:
        print(f"  ✗ Error: {e}")
        return False


async def run_all_tests():
    """Run all tests."""
    print("\n" + "=" * 60)
    print("  EDGEDEV AI AGENT - TEST SUITE")
    print("=" * 60)

    results = []

    # Test 1: Knowledge base
    results.append(await test_knowledge_retrieval())

    # Test 2: Orchestrator
    results.append(await test_orchestrator())

    # Test 3: Conversation manager
    results.append(await test_conversation_manager())

    # Test 4: LLM integration
    results.append(await test_agent_response())

    # Summary
    print("\n" + "=" * 60)
    print("  TEST SUMMARY")
    print("=" * 60)

    total = len(results)
    passed = sum(results)
    failed = total - passed

    print(f"\n  Total: {total}")
    print(f"  Passed: {passed} ✓")
    print(f"  Failed: {failed} ✗")

    if failed == 0:
        print("\n  ✓ All tests passed!")
        print("\n  Next steps:")
        print("  1. Add OPENROUTER_API_KEY to .env (if not done)")
        print("  2. Start the server: python -m src.main")
        print("  3. Open http://localhost:7447/docs for API docs")
        print("  4. Or use the CLI: python cli.py")
    else:
        print("\n  ⚠️  Some tests failed. Check output above.")

    print("\n" + "=" * 60)

    return failed == 0


if __name__ == "__main__":
    success = asyncio.run(run_all_tests())
    sys.exit(0 if success else 1)
