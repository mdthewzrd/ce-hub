#!/usr/bin/env python3
"""
Test the real Archon MCP project integration functionality
"""

import sys
import os

# Add the project root to Python path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main')

async def test_real_project_integration():
    """Test the real handleAddToProject functionality"""

    print("🧪 Testing Real Archon MCP Project Integration")
    print("=" * 50)

    try:
        # Import the real service
        from src.services.enhancedRenataCodeService import enhancedRenataCodeService

        # Test the handleAddToProject method directly
        print("📋 Testing handleAddToProject with 'Test Scanner'...")

        # Call the real method
        result = await enhancedRenataCodeService.handleAddToProject("Test Scanner")

        print(f"✅ Test Result:")
        print(f"   Success: {result['success']}")
        print(f"   Type: {result['type']}")
        print(f"   Message: {result['message'][:200]}...")

        if result['success']:
            print(f"   Project ID: {result['metadata'].get('projectId', 'N/A')}")
            print(f"   Task ID: {result['metadata'].get('taskId', 'N/A')}")
            print(f"   Document ID: {result['metadata'].get('documentId', 'N/A')}")
            print(f"   MCP Used: {result['metadata'].get('archonMCPUsed', False)}")

        print("\n🎉 Real project integration test completed!")
        return result['success']

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

if __name__ == "__main__":
    import asyncio
    success = asyncio.run(test_real_project_integration())
    print(f"\n{'✅ SUCCESS' if success else '❌ FAILED'}: Real project integration test")