#!/usr/bin/env python3
"""
Deep debug LC D2 execution to trace where the 33 results are lost
"""

import asyncio
import io
import contextlib
import pandas as pd
from datetime import datetime
from uploaded_scanner_bypass import execute_lc_d2_pattern_simple, filter_results_by_date

async def debug_lc_d2_execution_pipeline():
    print("🔍 DEEP DEBUGGING LC D2 EXECUTION PIPELINE")
    print("=" * 60)

    # Read the LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    # Debug progress callback to trace execution
    async def debug_progress_callback(percent, message):
        print(f"📊 PROGRESS: {percent}% - {message}")

    print(f"\n🔧 STEP 1: Testing LC D2 pattern execution directly...")
    print("-" * 40)

    # Execute LC D2 pattern with debug tracing
    try:
        results = await execute_lc_d2_pattern_simple(
            code=scanner_code,
            start_date='2025-01-01',  # Current test date range
            end_date='2025-11-06',
            progress_callback=debug_progress_callback
        )

        print(f"\n📊 STEP 1 RESULTS:")
        print(f"   Results returned: {len(results)}")
        print(f"   Results type: {type(results)}")

        if results:
            print(f"\n🔍 First 3 results from execute_lc_d2_pattern_simple:")
            for i, result in enumerate(results[:3]):
                print(f"   Result {i+1}: {result}")
                if isinstance(result, dict):
                    print(f"      Keys: {list(result.keys())}")
                    for key in ['date', 'Date', 'ticker', 'Ticker', 'symbol', 'Symbol']:
                        if key in result:
                            print(f"      {key}: {repr(result[key])} ({type(result[key]).__name__})")
        else:
            print(f"   ❌ No results returned from execute_lc_d2_pattern_simple")

    except Exception as e:
        print(f"❌ LC D2 pattern execution failed: {e}")
        import traceback
        traceback.print_exc()
        return

    print(f"\n🔧 STEP 2: Testing date filtering separately...")
    print("-" * 40)

    # If we got results, test date filtering separately
    if results:
        print(f"   Input to date filter: {len(results)} results")

        # Test date filtering with the results we got
        filtered_results = filter_results_by_date(results, '2025-01-01', '2025-11-06')

        print(f"   Output from date filter: {len(filtered_results)} results")

        if filtered_results:
            print(f"\n✅ Date filtering worked! Sample filtered result:")
            print(f"      {filtered_results[0]}")
        else:
            print(f"\n❌ Date filtering removed all results")

            # Try with wider date range
            print(f"\n🔧 Testing with wider date range (2020-2025)...")
            wide_filtered = filter_results_by_date(results, '2020-01-01', '2025-12-31')
            print(f"   Wide range results: {len(wide_filtered)}")

            if wide_filtered:
                print(f"   Sample wide range result: {wide_filtered[0]}")

                # Check what date values we actually have
                date_values = []
                for result in results[:5]:
                    if isinstance(result, dict):
                        for date_field in ['date', 'Date', 'scan_date', 'timestamp']:
                            if date_field in result:
                                date_values.append((date_field, result[date_field], type(result[date_field])))
                                break

                print(f"\n📅 Actual date values in results:")
                for i, (field, value, dtype) in enumerate(date_values):
                    print(f"   Result {i+1}: {field} = {repr(value)} ({dtype.__name__})")
    else:
        print(f"   ⚠️ No results to test date filtering with")

    print(f"\n🔧 STEP 3: Manual execution trace...")
    print("-" * 40)

    # Let's manually execute the scanner and trace each step
    def trace_scanner_execution():
        """Manually execute scanner with detailed tracing"""
        try:
            print(f"   🔧 Creating execution globals...")
            exec_globals = {'__name__': '__main__'}

            print(f"   🔧 Cleaning asyncio.run() calls...")
            processed_code = scanner_code
            if 'asyncio.run(' in processed_code:
                lines = processed_code.split('\n')
                cleaned_lines = []
                for line in lines:
                    if 'asyncio.run(' not in line:
                        cleaned_lines.append(line)
                    else:
                        print(f"      Skipped: {line.strip()[:60]}...")
                processed_code = '\n'.join(cleaned_lines)

            print(f"   🔧 Executing scanner code...")
            with contextlib.redirect_stdout(io.StringIO()):
                exec(processed_code, exec_globals)

            print(f"   🔧 Checking for existing results...")
            result_vars = [
                'df_lc', 'df_sc', 'results', 'final_results', 'all_results',
                'scanned_results', 'filtered_results', 'output', 'scan_output',
                'df', 'data', 'matched_stocks', 'matches', 'found_stocks',
                'lc_results', 'long_call_results', 'scan_results'
            ]

            found_vars = {}
            for var_name in result_vars:
                if var_name in exec_globals and exec_globals[var_name] is not None:
                    var_data = exec_globals[var_name]
                    found_vars[var_name] = var_data
                    if hasattr(var_data, 'shape'):  # pandas DataFrame
                        print(f"   ✅ Found DataFrame '{var_name}': {var_data.shape}")
                    elif isinstance(var_data, list):
                        print(f"   ✅ Found list '{var_name}': {len(var_data)} items")
                    else:
                        print(f"   ✅ Found '{var_name}': {type(var_data)}")

            if not found_vars:
                print(f"   ❌ No result variables found after execution")
                print(f"   📋 Available variables: {list(exec_globals.keys())}")

            # Try executing main() if it exists
            if 'main' in exec_globals and callable(exec_globals['main']):
                print(f"   🔧 Executing main() function...")
                try:
                    main_function = exec_globals['main']
                    if asyncio.iscoroutinefunction(main_function):
                        loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(loop)
                        loop.run_until_complete(main_function())
                        loop.close()
                    else:
                        main_function()

                    print(f"   ✅ main() executed successfully")

                    # Check for results after main() execution
                    for var_name in result_vars:
                        if var_name in exec_globals and exec_globals[var_name] is not None:
                            var_data = exec_globals[var_name]
                            if hasattr(var_data, 'shape'):  # pandas DataFrame
                                print(f"   ✅ After main(): DataFrame '{var_name}': {var_data.shape}")
                                return var_data.to_dict('records')
                            elif isinstance(var_data, list) and len(var_data) > 0:
                                print(f"   ✅ After main(): list '{var_name}': {len(var_data)} items")
                                return var_data

                except Exception as e:
                    print(f"   ❌ Error executing main(): {e}")

            return []

        except Exception as e:
            print(f"   ❌ Manual execution failed: {e}")
            import traceback
            traceback.print_exc()
            return []

    manual_results = trace_scanner_execution()
    print(f"\n📊 MANUAL EXECUTION RESULTS:")
    print(f"   Manual results: {len(manual_results)}")

    if manual_results:
        print(f"   ✅ Manual execution found results!")
        print(f"   Sample result: {manual_results[0] if manual_results else 'None'}")

        # Test date filtering on manual results
        manual_filtered = filter_results_by_date(manual_results, '2025-01-01', '2025-11-06')
        print(f"   Manual results after date filtering: {len(manual_filtered)}")
    else:
        print(f"   ❌ Manual execution found no results")

    print(f"\n🎯 SUMMARY:")
    print(f"   LC D2 pattern function results: {len(results) if 'results' in locals() else 0}")
    print(f"   Manual execution results: {len(manual_results)}")
    print(f"   Date filtering working: {'Yes' if 'filtered_results' in locals() and filtered_results else 'No'}")

if __name__ == "__main__":
    asyncio.run(debug_lc_d2_execution_pipeline())