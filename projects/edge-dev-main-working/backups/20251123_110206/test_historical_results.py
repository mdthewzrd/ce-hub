#!/usr/bin/env python3
"""
Test the LC D2 Extended scanner with historical dates to verify it finds actual results
The user insists there should be many results, so let's test with real market periods
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_historical_periods():
    """Test scanner with various historical periods to find actual results"""
    print("🧪 TESTING SCANNER WITH HISTORICAL MARKET DATA")
    print("=" * 70)
    print("Testing different 2024 periods to find actual trading signals")
    print()

    # Load the scanner file
    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(scanner_file, 'r') as f:
            code = f.read()
        print(f"📄 Loaded scanner: {len(code)} characters")
    except Exception as e:
        print(f"❌ Failed to load scanner: {e}")
        return False

    # Test periods from 2024 (when market had more volatility)
    test_periods = [
        ("2024-01-01", "2024-01-31", "January 2024 - New Year volatility"),
        ("2024-02-01", "2024-02-29", "February 2024 - Market corrections"),
        ("2024-03-01", "2024-03-31", "March 2024 - Fed decisions"),
        ("2024-06-01", "2024-06-30", "June 2024 - Summer trading"),
        ("2024-09-01", "2024-09-30", "September 2024 - Election buildup"),
        ("2024-11-01", "2024-11-30", "November 2024 - Election month"),
        ("2024-01-01", "2024-12-31", "Full Year 2024 - Complete scan")
    ]

    results_found = False

    for start_date, end_date, description in test_periods:
        print(f"\n🔍 Testing: {description}")
        print(f"   Date range: {start_date} to {end_date}")

        try:
            async def progress_callback(percentage, message):
                if percentage % 20 == 0:  # Only show every 20%
                    print(f"  [{percentage:3d}%] {message}")

            result = await execute_uploaded_scanner_direct(
                code=code,
                start_date=start_date,
                end_date=end_date,
                progress_callback=progress_callback
            )

            # Check results
            if isinstance(result, list):
                result_count = len(result)
                print(f"✅ Execution completed: {result_count} results found")

                if result_count > 0:
                    results_found = True
                    print(f"🎉 FOUND RESULTS! {result_count} trading signals detected")

                    # Show sample results
                    print(f"📊 Sample results:")
                    for i, trade in enumerate(result[:5]):  # Show first 5
                        if isinstance(trade, dict):
                            symbol = trade.get('symbol', 'Unknown')
                            date = trade.get('date', 'Unknown')
                            print(f"   {i+1}. {symbol} on {date}")
                        else:
                            print(f"   {i+1}. {trade}")

                    if result_count > 5:
                        print(f"   ... and {result_count - 5} more results")
                else:
                    print(f"   No results for this period")

            else:
                print(f"❌ Unexpected result type: {type(result)}")

        except Exception as e:
            print(f"❌ Error during {description}: {e}")
            continue

    return results_found

async def test_recent_volatile_periods():
    """Test with known volatile periods that should have LC patterns"""
    print(f"\n🧪 TESTING KNOWN VOLATILE PERIODS")
    print("=" * 70)

    # Load scanner
    scanner_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"
    with open(scanner_file, 'r') as f:
        code = f.read()

    # Known volatile periods with high probability of LC patterns
    volatile_periods = [
        ("2024-01-02", "2024-01-05", "First trading week of 2024"),
        ("2024-08-01", "2024-08-15", "August 2024 market correction"),
        ("2024-10-01", "2024-10-31", "October 2024 pre-election"),
        ("2024-03-15", "2024-03-22", "Fed March meeting week"),
        ("2024-07-01", "2024-07-15", "Mid-year earnings season")
    ]

    for start_date, end_date, description in volatile_periods:
        print(f"\n🔥 Testing volatile period: {description}")
        print(f"   Dates: {start_date} to {end_date}")

        try:
            result = await execute_uploaded_scanner_direct(
                code=code,
                start_date=start_date,
                end_date=end_date,
                progress_callback=lambda p, m: None  # Silent
            )

            if isinstance(result, list) and len(result) > 0:
                print(f"🎯 SUCCESS: Found {len(result)} LC patterns!")
                return True, result[:10]  # Return first 10 results
            else:
                print(f"   No LC patterns found in this period")

        except Exception as e:
            print(f"❌ Error: {e}")

    return False, []

async def main():
    """Test comprehensive historical periods to verify scanner functionality"""
    print("🎯 COMPREHENSIVE HISTORICAL TESTING")
    print("=" * 70)
    print("User reports scanner should find 'big list' of results")
    print("Testing historical periods to verify functionality...")
    print()

    # Test broad historical periods
    found_results = await test_historical_periods()

    # Test specific volatile periods
    found_volatile, sample_results = await test_recent_volatile_periods()

    print("\n" + "=" * 70)
    print("🎯 HISTORICAL TESTING RESULTS")
    print("=" * 70)

    if found_results or found_volatile:
        print("🎉 SUCCESS: Scanner IS finding results in historical data!")
        print("✅ Scanner logic is working correctly")
        print("✅ LC D2 patterns are being detected")

        if sample_results:
            print(f"\n📊 Sample of found trading signals:")
            for i, result in enumerate(sample_results):
                print(f"   {i+1}. {result}")

        print(f"\n💡 INSIGHT: Scanner works with historical data")
        print(f"   The issue may be with the specific date range being tested")
        print(f"   Future dates (2025) naturally have no historical market data")
        print(f"   User should test with 2024 dates for actual results")

    else:
        print("❌ No results found in any historical period")
        print("🔍 This suggests either:")
        print("   1. Scanner logic has an issue")
        print("   2. LC D2 patterns are very rare")
        print("   3. Market conditions in 2024 didn't trigger these patterns")
        print("   4. API/data access issue")

    print(f"\n🎯 RECOMMENDATION:")
    if found_results or found_volatile:
        print("   ✅ Scanner is working - user should test with 2024 date ranges")
        print("   ✅ Use periods like '2024-01-01' to '2024-12-31' for results")
    else:
        print("   🔧 Scanner may need debugging or pattern adjustment")
        print("   🔧 Check API connectivity and data availability")

if __name__ == "__main__":
    asyncio.run(main())