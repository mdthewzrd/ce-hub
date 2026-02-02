#!/usr/bin/env python3
"""
Test the conversation endpoint with real data integration
"""

import asyncio
import httpx
import json
import sys
import os

# Add the backend path to import modules
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/traderra/backend')

async def test_conversation_endpoint():
    """Test the conversation endpoint directly"""
    print("Testing conversation endpoint with real data...")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "http://localhost:6500/ai/conversation",
                json={
                    "user_input": "Analyze my trading performance in detail",
                    "mode": "analyst"
                }
            )

            if response.status_code == 200:
                data = response.json()
                print(f"✅ Response received:")
                print(f"   Response: {data.get('response', '')}")
                print(f"   Command Type: {data.get('command_type', '')}")
                print(f"   Intent: {data.get('intent', '')}")
                return True
            else:
                print(f"❌ Error: {response.status_code}")
                print(f"Response: {response.text}")
                return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

async def main():
    await test_conversation_endpoint()

if __name__ == "__main__":
    asyncio.run(main())