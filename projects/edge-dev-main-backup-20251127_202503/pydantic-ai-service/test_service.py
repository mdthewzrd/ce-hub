#!/usr/bin/env python3
"""
Simple test script to verify the PydanticAI service setup
"""

import asyncio
import sys
import os
from pathlib import Path

# Add the app directory to Python path
sys.path.insert(0, str(Path(__file__).parent / "app"))

async def test_agent_initialization():
    """Test that all agents can be initialized properly"""
    try:
        print("🧪 Testing PydanticAI Trading Agent Service...")

        # Test imports
        print("📦 Testing imports...")
        from app.agents.trading_agent import TradingAgent
        from app.agents.scan_creator import ScanCreatorAgent
        from app.agents.backtest_generator import BacktestGeneratorAgent
        from app.agents.parameter_optimizer import ParameterOptimizerAgent
        from app.core.config import settings
        print("✅ All imports successful")

        # Test configuration
        print("⚙️ Testing configuration...")
        print(f"   - Model: {settings.AGENT_MODEL}")
        print(f"   - Port: {settings.PORT}")
        print(f"   - Debug: {settings.DEBUG}")
        print("✅ Configuration loaded")

        # Test agent creation (without PydanticAI initialization for now)
        print("🤖 Testing agent creation...")

        trading_agent = TradingAgent()
        print(f"   - Trading Agent: {trading_agent.agent_type.value}")

        scan_creator = ScanCreatorAgent()
        print(f"   - Scan Creator: {scan_creator.agent_type.value}")

        backtest_generator = BacktestGeneratorAgent()
        print(f"   - Backtest Generator: {backtest_generator.agent_type.value}")

        parameter_optimizer = ParameterOptimizerAgent()
        print(f"   - Parameter Optimizer: {parameter_optimizer.agent_type.value}")

        print("✅ All agents created successfully")

        # Test agent status
        print("📊 Testing agent status...")
        print(f"   - Trading Agent ready: {trading_agent.is_ready()}")
        print(f"   - Scan Creator ready: {scan_creator.is_ready()}")
        print(f"   - Backtest Generator ready: {backtest_generator.is_ready()}")
        print(f"   - Parameter Optimizer ready: {parameter_optimizer.is_ready()}")

        print("✅ Agent status checks completed")

        print("\n🎉 Basic service setup test PASSED!")
        print("\nNext steps:")
        print("1. Set up your .env file with API keys")
        print("2. Run: cd pydantic-ai-service && poetry install")
        print("3. Run: poetry run uvicorn app.main:app --reload --port 8001")

        return True

    except ImportError as e:
        print(f"❌ Import error: {str(e)}")
        print("Make sure you have installed all dependencies:")
        print("cd pydantic-ai-service && poetry install")
        return False

    except Exception as e:
        print(f"❌ Test failed: {str(e)}")
        return False

async def test_with_mock_api_key():
    """Test with mock API key for development"""
    try:
        print("\n🔑 Testing with mock API key...")

        # Set mock environment variables
        os.environ["OPENAI_API_KEY"] = "mock_key_for_testing"
        os.environ["ANTHROPIC_API_KEY"] = "mock_key_for_testing"

        # Import after setting environment variables
        from app.core.config import settings

        print(f"   - OpenAI API Key set: {'Yes' if settings.OPENAI_API_KEY != 'your_openai_key_here' else 'No'}")

        print("✅ Mock API key test completed")

        return True

    except Exception as e:
        print(f"❌ Mock API key test failed: {str(e)}")
        return False

if __name__ == "__main__":
    try:
        # Run basic tests
        success1 = asyncio.run(test_agent_initialization())
        success2 = asyncio.run(test_with_mock_api_key())

        if success1 and success2:
            print("\n✅ All tests PASSED! PydanticAI service is ready for development.")
            sys.exit(0)
        else:
            print("\n❌ Some tests FAILED. Please fix the issues above.")
            sys.exit(1)

    except KeyboardInterrupt:
        print("\n⚠️ Test interrupted by user")
        sys.exit(1)
    except Exception as e:
        print(f"\n💥 Unexpected error: {str(e)}")
        sys.exit(1)