#!/usr/bin/env python3
"""
Test the API Gateway implementation to verify it's working correctly
"""

import asyncio
import aiohttp
import json
from datetime import datetime

async def test_api_gateway():
    """Test the API Gateway endpoints"""

    base_url = "http://localhost:8001"

    # Test 1: Health check
    print("🔍 Testing API Gateway health check...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{base_url}/health") as response:
                if response.status == 200:
                    health_data = await response.json()
                    print(f"✅ Health check passed: {health_data.get('status')}")
                    print(f"   Service: {health_data.get('service')}")
                    print(f"   AI Integration: {health_data.get('glm_integration')}")
                else:
                    print(f"❌ Health check failed: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Health check error: {e}")
        return False

    # Test 2: Agent status
    print("\n🤖 Testing agent status...")
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(f"{base_url}/api/agent/status") as response:
                if response.status == 200:
                    status_data = await response.json()
                    print(f"✅ Agent status retrieved")
                    print(f"   Service Health: {status_data.get('service_health')}")
                    print(f"   AI Integration: {status_data.get('ai_integration')}")
                    print(f"   Rate Limiting: {status_data.get('rate_limiting')}")
                    print(f"   Request Queue: {status_data.get('request_queue')}")
                else:
                    print(f"❌ Agent status failed: {response.status}")
                    return False
    except Exception as e:
        print(f"❌ Agent status error: {e}")
        return False

    # Test 3: Code formatting through API Gateway
    print("\n📝 Testing code formatting through API Gateway...")

    test_code = '''
def scan_symbol(symbol, from_date, to_date):
    """Test trading scanner"""
    print(f"Scanning {symbol} from {from_date} to {to_date}")

    # Test parameters
    min_gap = 0.5
    volume_threshold = 1000000
    atr_multiplier = 2.0

    return {"symbol": symbol, "gap": min_gap}
'''

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/api/agent/scan/format",
                headers={"Content-Type": "application/json"},
                json={
                    "source_code": test_code,
                    "format_type": "scan_optimization",
                    "preserve_logic": True,
                    "add_documentation": True,
                    "optimize_performance": True,
                    "current_issues": []
                }
            ) as response:
                if response.status == 200:
                    format_data = await response.json()
                    print(f"✅ Code formatting successful")
                    print(f"   Success: {format_data.get('success')}")
                    print(f"   Agent Type: {format_data.get('agent_type')}")
                    print(f"   Execution Time: {format_data.get('execution_time')}s")

                    if format_data.get('data'):
                        enhancements = format_data['data'].get('enhancements_applied', [])
                        print(f"   Enhancements: {len(enhancements)} applied")
                        for enhancement in enhancements[:3]:  # Show first 3
                            print(f"     - {enhancement}")
                else:
                    error_data = await response.json()
                    print(f"❌ Code formatting failed: {response.status}")
                    print(f"   Error: {error_data.get('message')}")
                    return False
    except Exception as e:
        print(f"❌ Code formatting error: {e}")
        return False

    # Test 4: Chat through API Gateway
    print("\n💬 Testing chat through API Gateway...")

    try:
        async with aiohttp.ClientSession() as session:
            async with session.post(
                f"{base_url}/api/agent/chat",
                headers={"Content-Type": "application/json"},
                json={
                    "message": "Hello! Can you help me with trading scanner development?",
                    "context": {
                        "system_prompt": "You are a helpful AI assistant for trading development."
                    }
                }
            ) as response:
                if response.status == 200:
                    chat_data = await response.json()
                    print(f"✅ Chat successful")
                    print(f"   Success: {chat_data.get('success')}")
                    print(f"   Agent Type: {chat_data.get('agent_type')}")
                    print(f"   Message Length: {len(chat_data.get('message', ''))}")
                else:
                    error_data = await response.json()
                    print(f"❌ Chat failed: {response.status}")
                    print(f"   Error: {error_data.get('message')}")
                    return False
    except Exception as e:
        print(f"❌ Chat error: {e}")
        return False

    print("\n🎉 All API Gateway tests passed!")
    print("📊 Summary:")
    print("   ✅ Health check working")
    print("   ✅ Agent status working")
    print("   ✅ Code formatting through API Gateway working")
    print("   ✅ Chat through API Gateway working")
    print("   🚀 API Gateway is ready for production!")

    return True

if __name__ == "__main__":
    print("🧪 Testing API Gateway Implementation")
    print("=" * 50)
    print(f"📅 Test started: {datetime.now().isoformat()}")

    success = asyncio.run(test_api_gateway())

    if success:
        print("\n✅ API Gateway implementation is working correctly!")
        print("🎯 Ready to handle all AI requests through centralized gateway")
    else:
        print("\n❌ API Gateway implementation has issues!")
        print("🔧 Please check the service logs and configuration")