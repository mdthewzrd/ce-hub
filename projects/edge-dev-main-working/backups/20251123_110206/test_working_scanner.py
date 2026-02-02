#!/usr/bin/env python3
"""
Test the working backside scanner to see if it can find results
This will help determine if the issue is with LC patterns specifically
or if there's a general execution problem
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_working_backside_scanner():
    """Test the known working backside scanner"""
    print("🧪 TESTING KNOWN WORKING BACKSIDE SCANNER")
    print("=" * 70)
    print("This scanner was mentioned by the user as 'still work perfectly fine'")
    print()

    # Test the backside scanner
    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/standardized_backside_para_b_scanner.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded backside scanner: {len(code)} characters")
        print()

        # Test recent date range
        print("🔍 Testing with recent dates: 2024-11-01 to 2024-11-15")

        async def progress_callback(percentage, message):
            if percentage % 20 == 0:
                print(f"  [{percentage:3d}%] {message}")

        result = await execute_uploaded_scanner_direct(
            code=code,
            start_date="2024-11-01",
            end_date="2024-11-15",
            progress_callback=progress_callback
        )

        print(f"\n✅ Backside execution completed")

        if isinstance(result, list):
            result_count = len(result)
            print(f"📊 Results found: {result_count}")

            if result_count > 0:
                print(f"🎉 SUCCESS: Backside scanner FOUND {result_count} results!")
                print(f"💡 This proves the system CAN find results")
                print(f"🔍 The issue is specific to the LC pattern")

                # Show sample results
                print(f"\n📋 Sample backside results:")
                for i, stock in enumerate(result[:5]):
                    if isinstance(stock, dict):
                        symbol = stock.get('symbol', 'Unknown')
                        date = stock.get('date', 'Unknown')
                        print(f"   {i+1}. {symbol} on {date}")
                    else:
                        print(f"   {i+1}. {stock}")

                return True, result_count
            else:
                print(f"⚠️ Backside scanner also found 0 results")
                return False, 0
        else:
            print(f"❌ Unexpected result type: {type(result)}")
            return False, 0

    except Exception as e:
        print(f"❌ Backside scanner failed: {e}")
        import traceback
        traceback.print_exc()
        return False, 0

async def compare_lc_vs_backside():
    """Compare LC vs Backside scanners directly"""
    print(f"\n🧪 DIRECT COMPARISON: LC vs BACKSIDE")
    print("=" * 70)

    # Test LC scanner first
    print("1️⃣ Testing LC Scanner:")
    lc_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(lc_file, 'r') as f:
            lc_code = f.read()

        lc_result = await execute_uploaded_scanner_direct(
            code=lc_code,
            start_date="2024-11-01",
            end_date="2024-11-05",
            progress_callback=lambda p, m: None
        )

        lc_count = len(lc_result) if isinstance(lc_result, list) else 0
        print(f"   LC Results: {lc_count}")

    except Exception as e:
        print(f"   LC Error: {e}")
        lc_count = -1

    # Test Backside scanner
    print("\n2️⃣ Testing Backside Scanner:")
    backside_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/standardized_backside_para_b_scanner.py"

    try:
        with open(backside_file, 'r') as f:
            backside_code = f.read()

        backside_result = await execute_uploaded_scanner_direct(
            code=backside_code,
            start_date="2024-11-01",
            end_date="2024-11-05",
            progress_callback=lambda p, m: None
        )

        backside_count = len(backside_result) if isinstance(backside_result, list) else 0
        print(f"   Backside Results: {backside_count}")

    except Exception as e:
        print(f"   Backside Error: {e}")
        backside_count = -1

    print(f"\n📊 COMPARISON RESULTS:")
    print(f"   LC Scanner: {lc_count} results")
    print(f"   Backside Scanner: {backside_count} results")

    if backside_count > 0 and lc_count == 0:
        print(f"\n🎯 CONCLUSION: LC pattern issue confirmed!")
        print(f"   ✅ System works (backside finds results)")
        print(f"   ❌ LC pattern has specific issues")
    elif lc_count == backside_count == 0:
        print(f"\n🤔 Both scanners find 0 results")
        print(f"   Could be market conditions or general issue")

    return lc_count, backside_count

async def main():
    """Test working scanner vs problematic LC scanner"""
    print("🎯 WORKING SCANNER COMPARISON TEST")
    print("=" * 70)
    print("Testing if the issue is LC-specific or system-wide")
    print()

    # Test known working backside scanner
    backside_works, backside_count = await test_working_backside_scanner()

    # Compare both scanners directly
    lc_count, backside_count = await compare_lc_vs_backside()

    print("\n" + "=" * 70)
    print("🎯 FINAL ANALYSIS")
    print("=" * 70)

    if backside_works:
        print("✅ CONFIRMED: System CAN find trading results")
        print(f"   Backside scanner found {backside_count} results")
        print(f"🔍 USER WAS RIGHT: The issue is specific to the LC scanner")
        print(f"\n💡 NEXT STEPS:")
        print(f"   1. LC pattern criteria are likely too restrictive")
        print(f"   2. Need to relax volume/price requirements")
        print(f"   3. Consider debugging the LC pattern logic")
        print(f"   4. May need to fix execution errors in LC code")

        return True
    else:
        print("❌ Both scanners find 0 results")
        print("💡 This suggests broader system issues:")
        print("   - API connectivity problems")
        print("   - Market data access issues")
        print("   - Date range handling problems")

        return False

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n🎉 USER VINDICATED: LC scanner definitely has issues that need fixing!")
    else:
        print("\n🔧 SYSTEM ISSUE: Both scanners failing - broader problem to investigate")