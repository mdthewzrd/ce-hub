#!/usr/bin/env python3
"""
Test LC D2 result extraction fix - verify 80 internal results transfer to web interface
"""

import asyncio
import sys
import json
from datetime import datetime
from uploaded_scanner_bypass import execute_lc_d2_pattern_simple, filter_results_by_date

async def test_lc_d2_result_extraction():
    print("🔍 TESTING LC D2 RESULT EXTRACTION FIX")
    print("=" * 60)

    # Read the LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    # Progress callback to track execution
    async def progress_callback(percent, message):
        print(f"📊 {percent:3d}% - {message}")

    print(f"\n🚀 STEP 1: Test LC D2 execution with current date range...")
    print("-" * 50)

    try:
        # Test LC D2 with current system date range
        start_date = '2025-01-01'
        end_date = '2025-11-06'

        print(f"📅 Testing LC D2 with date range: {start_date} to {end_date}")

        # Execute LC D2 pattern with our fixed result extraction
        results = await execute_lc_d2_pattern_simple(
            code=scanner_code,
            start_date=start_date,
            end_date=end_date,
            progress_callback=progress_callback
        )

        print(f"\n📊 RAW EXECUTION RESULTS:")
        print(f"   Results returned: {len(results)}")
        print(f"   Results type: {type(results)}")

        if results:
            print(f"\n✅ SUCCESS: LC D2 returned {len(results)} results!")
            print(f"🎯 Result extraction fix is WORKING!")

            # Show first few results
            print(f"\n📋 First 3 results:")
            for i, result in enumerate(results[:3]):
                if isinstance(result, dict):
                    # Show key fields
                    ticker = result.get('ticker', result.get('Ticker', result.get('symbol', 'N/A')))
                    date_field = result.get('date', result.get('Date', result.get('timestamp', 'N/A')))
                    print(f"   {i+1}. {ticker} | {date_field} | Type: {type(date_field)}")

                    # Show all available keys for first result
                    if i == 0:
                        print(f"      Available keys: {sorted(result.keys())}")
                else:
                    print(f"   {i+1}. {result} (type: {type(result)})")
        else:
            print(f"\n❌ FAILURE: LC D2 returned 0 results")
            print(f"🔧 Result extraction still has issues")

    except Exception as e:
        print(f"❌ LC D2 execution failed: {e}")
        import traceback
        traceback.print_exc()
        return

    # Test date filtering separately if we got results
    if results:
        print(f"\n🚀 STEP 2: Test date filtering on extracted results...")
        print("-" * 50)

        print(f"   Input to date filter: {len(results)} results")

        try:
            filtered_results = filter_results_by_date(results, start_date, end_date)
            print(f"   Output from date filter: {len(filtered_results)} results")

            if filtered_results:
                print(f"✅ Date filtering preserved results!")
                print(f"📊 Sample filtered result:")
                sample = filtered_results[0]
                if isinstance(sample, dict):
                    ticker = sample.get('ticker', sample.get('Ticker', sample.get('symbol', 'N/A')))
                    date_field = sample.get('date', sample.get('Date', sample.get('timestamp', 'N/A')))
                    print(f"   Ticker: {ticker} | Date: {date_field}")
            else:
                print(f"❌ Date filtering removed ALL results!")

                # Analyze date formats in results
                print(f"\n🔍 Analyzing date formats in unfiltered results...")
                date_analysis = {}
                for i, result in enumerate(results[:5]):
                    if isinstance(result, dict):
                        for date_key in ['date', 'Date', 'timestamp', 'scan_date']:
                            if date_key in result:
                                date_value = result[date_key]
                                date_type = type(date_value).__name__
                                date_str = str(date_value)[:20]

                                if date_type not in date_analysis:
                                    date_analysis[date_type] = []
                                date_analysis[date_type].append(f"{date_key}={date_str}")
                                break

                print(f"📅 Date format analysis:")
                for dtype, examples in date_analysis.items():
                    print(f"   {dtype}: {examples[:3]}")

                # Try with wider date range
                print(f"\n🔧 Testing with wider date range (2020-2025)...")
                wide_filtered = filter_results_by_date(results, '2020-01-01', '2025-12-31')
                print(f"   Wide range results: {len(wide_filtered)}")

        except Exception as e:
            print(f"❌ Date filtering failed: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n🎯 FINAL STATUS:")
    print(f"   LC D2 execution: {'✅ SUCCESS' if 'results' in locals() and results else '❌ FAILED'}")
    print(f"   Result extraction: {'✅ WORKING' if 'results' in locals() and results else '❌ BROKEN'}")
    print(f"   Result count: {len(results) if 'results' in locals() and results else 0}")

    if 'results' in locals() and results and 'filtered_results' in locals():
        print(f"   Date filtering: {'✅ PRESERVES' if filtered_results else '❌ REMOVES ALL'} results")
        if filtered_results:
            print(f"   Final result count: {len(filtered_results)}")

    # Test web interface compatibility
    if 'results' in locals() and results:
        print(f"\n🌐 STEP 3: Test web interface format compatibility...")
        print("-" * 50)

        try:
            # Convert to JSON to test web compatibility
            json_test = json.dumps(results[:3], default=str, indent=2)
            print(f"✅ Results are JSON serializable for web interface")
            print(f"📊 JSON sample (first result):")
            print(json_test.split('\n')[1:10])  # Show first few lines

        except Exception as e:
            print(f"❌ Results NOT web compatible: {e}")
            print(f"🔧 Need to fix result format for web interface")

if __name__ == "__main__":
    asyncio.run(test_lc_d2_result_extraction())