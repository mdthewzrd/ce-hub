#!/usr/bin/env python3
"""
Test script to validate real trading data connection
"""

import asyncio
import httpx
import sys
import os

# Add the backend path to import modules
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/traderra/backend')

async def test_frontend_data():
    """Test getting data from frontend"""
    print("Testing frontend data connection...")

    try:
        async with httpx.AsyncClient(timeout=10.0) as client:
            response = await client.get("http://localhost:6565/api/trades")

            if response.status_code == 200:
                data = response.json()
                trades = data.get('trades', [])
                print(f"✅ Frontend connection successful: {len(trades)} trades found")

                if trades:
                    # Calculate some metrics
                    total_trades = len(trades)
                    winning_trades = [t for t in trades if t.get('pnl', 0) > 0]
                    win_rate = len(winning_trades) / total_trades if total_trades > 0 else 0
                    total_pnl = sum(t.get('pnl', 0) for t in trades)

                    r_multiples = [t.get('rMultiple') for t in trades if t.get('rMultiple') is not None]
                    avg_expectancy = sum(r_multiples) / len(r_multiples) if r_multiples else 0

                    print(f"📊 Real Performance Summary:")
                    print(f"   - Total Trades: {total_trades}")
                    print(f"   - Win Rate: {win_rate:.1%}")
                    print(f"   - Total P&L: ${total_pnl:,.2f}")
                    print(f"   - Avg Expectancy: {avg_expectancy:.2f}R")
                    print(f"   - Winning Trades: {len(winning_trades)}")

                    return True
                else:
                    print("❌ No trades found in frontend data")
                    return False
            else:
                print(f"❌ Frontend API error: {response.status_code}")
                return False

    except Exception as e:
        print(f"❌ Frontend connection error: {e}")
        return False

async def test_backend_ai():
    """Test backend AI with real data"""
    print("\nTesting backend AI with real data...")

    try:
        async with httpx.AsyncClient(timeout=15.0) as client:
            response = await client.post(
                "http://localhost:6565/api/renata/chat",
                json={
                    "message": "Analyze my current trading performance",
                    "mode": "analyst"
                }
            )

            if response.status_code == 200:
                data = response.json()
                ai_response = data.get('response', '')
                print(f"✅ Backend AI response: {ai_response}")

                # Check if response contains real metrics
                if '6 trades' in ai_response or '1949' in ai_response or '83.3%' in ai_response:
                    print("✅ AI appears to be using real data!")
                    return True
                else:
                    print("⚠️  AI may still be using mock data")
                    return False
            else:
                print(f"❌ Backend AI error: {response.status_code}")
                return False

    except Exception as e:
        print(f"❌ Backend AI connection error: {e}")
        return False

async def main():
    print("🔍 Testing Renata AI Real Data Integration\n")

    frontend_ok = await test_frontend_data()
    backend_ok = await test_backend_ai()

    print(f"\n📋 Test Results:")
    print(f"   Frontend Data Connection: {'✅' if frontend_ok else '❌'}")
    print(f"   Backend AI Integration: {'✅' if backend_ok else '❌'}")

    if frontend_ok and backend_ok:
        print("\n🎉 All tests passed! Renata is using real trading data.")
    elif frontend_ok and not backend_ok:
        print("\n⚠️  Frontend data is available but backend needs fixes.")
    else:
        print("\n❌ Multiple issues detected - check system configuration.")

if __name__ == "__main__":
    asyncio.run(main())