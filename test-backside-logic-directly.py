#!/usr/bin/env python3

"""
Direct test of the backside B scanner logic to identify why it returns 0 results
"""

import sys
import os
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend')

# Extract the backside B scanner code from the project
import json

def load_backside_code():
    with open('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/data/projects.json', 'r') as f:
        projects = json.load(f)

    backside_project = next((p for p in projects if p['id'] == '1765041068338'), None)
    if not backside_project:
        print("❌ Project not found")
        return None

    return backside_project['code']

def test_backside_logic():
    print("🔍 DIRECT BACKSIDE B LOGIC TEST")
    print("================================")

    # Load the code
    code = load_backside_code()
    if not code:
        return

    print(f"✅ Loaded backside B code: {len(code)} characters")

    # Execute the code to get access to its functions
    try:
        exec(code)
        print("✅ Code executed successfully")

        # Check if main_sync function exists
        if 'main_sync' in globals():
            print("✅ main_sync function found")
        else:
            print("❌ main_sync function NOT found")
            print("Available functions:", [name for name in globals() if callable(globals()[name])])
            return

        # Test the scanner logic directly
        print("\n🎯 Testing main_sync function...")

        # Call the function
        results = main_sync()

        print(f"\n📊 RESULTS:")
        print(f"Function returned: {type(results)}")
        print(f"Results count: {len(results) if results else 0}")

        if results:
            print(f"✅ Found {len(results)} patterns!")
            print("Sample results:")
            for i, result in enumerate(results[:5]):
                print(f"  {i+1}. {result}")
        else:
            print("❌ No results found")

            # Let's debug what might be wrong
            print("\n🔍 DEBUGGING: Let's test individual components...")

            # Test date range calculation
            if 'get_proper_date_range' in globals():
                start_date, end_date = get_proper_date_range('2025-01-01', '2025-11-01')
                print(f"Date range: {start_date} to {end_date}")

            # Test one symbol fetch
            if 'fetch_daily_sync' in globals():
                print("\n🔍 Testing data fetch for AAPL...")
                df = fetch_daily_sync('AAPL', '2025-10-01', '2025-11-01')
                if df.empty:
                    print("❌ No data returned for AAPL (could be API key issue)")
                else:
                    print(f"✅ Got {len(df)} rows of data for AAPL")
                    print("Sample data:")
                    print(df.head(3))

                    # Test scan logic on this data
                    if 'scan_symbol' in globals():
                        print("\n🔍 Testing scan_symbol logic...")
                        scan_results = scan_symbol('AAPL', '2025-10-01', '2025-11-01')
                        if scan_results.empty:
                            print("❌ scan_symbol returned no results for AAPL")
                        else:
                            print(f"✅ scan_symbol found {len(scan_results)} patterns for AAPL")
                            print(scan_results.head())

    except Exception as e:
        print(f"❌ Error executing code: {e}")
        import traceback
        traceback.print_exc()

if __name__ == "__main__":
    test_backside_logic()