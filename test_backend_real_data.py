#!/usr/bin/env python3
"""
Test the backend real data function directly
"""

import asyncio
import httpx
import sys
import os

# Add the backend path to import modules
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/traderra/backend')

async def test_real_data_function():
    """Test the real data function directly"""
    print("Testing _get_real_performance_data function...")

    try:
        # Import the function
        from app.api.ai_endpoints import _get_real_performance_data

        # Test the function
        result = await _get_real_performance_data("test_user_123")

        if result:
            print(f"✅ Real data function working!")
            print(f"   - Trades: {result.trades_count}")
            print(f"   - Win Rate: {result.win_rate:.1%}")
            print(f"   - Expectancy: {result.expectancy:.2f}R")
            print(f"   - Total P&L: ${result.total_pnl:.2f}")
            return True
        else:
            print("❌ Real data function returned None")
            return False

    except Exception as e:
        print(f"❌ Error testing real data function: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    await test_real_data_function()

if __name__ == "__main__":
    asyncio.run(main())