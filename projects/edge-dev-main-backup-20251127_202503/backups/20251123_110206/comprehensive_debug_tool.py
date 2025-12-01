#!/usr/bin/env python3
"""
Comprehensive Debug Tool for Scanner Result Extraction Issues

This tool systematically debugs the entire scanner execution pipeline to identify
where the 80 internal results are being lost before reaching the web interface.
"""

import asyncio
import io
import contextlib
import pandas as pd
from datetime import datetime
import json
import sys

async def debug_scanner_execution_pipeline():
    print("🔍 COMPREHENSIVE SCANNER EXECUTION PIPELINE DEBUG")
    print("=" * 80)

    # Read the LC D2 scanner code for detailed analysis
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    print(f"\n🔍 STEP 1: Analyze LC D2 Scanner Code Structure")
    print("-" * 50)

    # Analyze the scanner structure
    lines = scanner_code.split('\n')

    # Look for key indicators
    async_main_pattern = any('async def main(' in line for line in lines)
    dataframe_creation = [i for i, line in enumerate(lines) if 'df_lc' in line and ('=' in line or 'DataFrame' in line)]
    result_variables = [i for i, line in enumerate(lines) if any(var in line for var in ['df_lc', 'df_sc', 'results', 'final_results'])]

    print(f"📊 Scanner Analysis:")
    print(f"   📁 Total lines: {len(lines)}")
    print(f"   🔄 Uses async main(): {async_main_pattern}")
    print(f"   📊 DataFrame creation lines: {len(dataframe_creation)}")
    print(f"   📋 Result variable lines: {len(result_variables)}")

    if dataframe_creation:
        print(f"   🎯 Key DataFrame creation locations:")
        for line_num in dataframe_creation[:5]:  # Show first 5
            print(f"      Line {line_num + 1}: {lines[line_num].strip()}")

    print(f"\n🔍 STEP 2: Test Direct Execution (Control Test)")
    print("-" * 50)

    def test_direct_execution():
        """Test direct execution to confirm internal results are generated"""
        try:
            print("🔧 Setting up direct execution environment...")
            exec_globals = {'__name__': '__main__'}

            # Clean up asyncio.run() calls
            processed_code = scanner_code
            if 'asyncio.run(' in processed_code:
                lines = processed_code.split('\n')
                cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
                processed_code = '\n'.join(cleaned_lines)
                print(f"🔧 Removed {len(lines) - len(cleaned_lines)} asyncio.run() lines")

            # Capture stdout to see what the scanner is printing
            stdout_capture = io.StringIO()

            # Execute code to load definitions
            print("🔧 Loading scanner definitions...")
            with contextlib.redirect_stdout(stdout_capture):
                exec(processed_code, exec_globals)

            captured_output = stdout_capture.getvalue()
            print(f"📊 Scanner output length: {len(captured_output)} characters")

            # Execute main function
            if 'main' in exec_globals and callable(exec_globals['main']):
                main_function = exec_globals['main']
                print(f"🔧 Found main() function: {type(main_function)}")

                if asyncio.iscoroutinefunction(main_function):
                    print("🔧 Executing async main() in new event loop...")
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)

                    stdout_capture = io.StringIO()
                    with contextlib.redirect_stdout(stdout_capture):
                        loop.run_until_complete(main_function())

                    execution_output = stdout_capture.getvalue()
                    loop.close()

                    print(f"📊 Execution output length: {len(execution_output)} characters")
                    print(f"🎯 Last 500 chars of output:")
                    print(f"   {execution_output[-500:]}")

                    # Analyze what variables were created
                    result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results', 'matched_stocks', 'lc_results']

                    print(f"\n📋 VARIABLE ANALYSIS:")
                    for var_name in result_vars:
                        if var_name in exec_globals and exec_globals[var_name] is not None:
                            var_data = exec_globals[var_name]
                            if hasattr(var_data, 'shape'):  # pandas DataFrame
                                print(f"✅ {var_name}: DataFrame with shape {var_data.shape}")
                                if len(var_data) > 0:
                                    print(f"   📊 Columns: {list(var_data.columns)}")
                                    print(f"   🎯 Sample row: {var_data.iloc[0].to_dict()}")
                                    return var_data.to_dict('records')
                            elif isinstance(var_data, list) and len(var_data) > 0:
                                print(f"✅ {var_name}: List with {len(var_data)} items")
                                print(f"   🎯 Sample item: {var_data[0]}")
                                return var_data
                            else:
                                print(f"⚠️  {var_name}: {type(var_data)} with length {len(var_data) if hasattr(var_data, '__len__') else 'N/A'}")
                        else:
                            print(f"❌ {var_name}: Not found or None")

                    print(f"📊 All global variables created:")
                    for key, value in exec_globals.items():
                        if not key.startswith('__') and not callable(value):
                            data_type = type(value).__name__
                            try:
                                size = len(value) if hasattr(value, '__len__') else 'N/A'
                                print(f"   {key}: {data_type} (size: {size})")
                            except:
                                print(f"   {key}: {data_type}")

            return []

        except Exception as e:
            print(f"❌ Direct execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    # Run direct execution test
    direct_results = test_direct_execution()
    print(f"\n📊 Direct execution results: {len(direct_results)}")

    if direct_results:
        print(f"✅ DIRECT EXECUTION WORKS - Found {len(direct_results)} results!")
        print(f"🎯 Sample result: {direct_results[0]}")
    else:
        print(f"❌ DIRECT EXECUTION FAILED - No results found")
        print(f"🔍 This suggests the issue is with the scanner code itself, not the web pipeline")
        return

    print(f"\n🔍 STEP 3: Test Thread Execution (Web Pipeline Simulation)")
    print("-" * 50)

    import concurrent.futures

    def thread_execution_test():
        """Test execution in thread context (simulating web pipeline)"""
        try:
            print("🔧 Setting up thread execution environment...")

            # Create new event loop in thread
            import asyncio
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)

            exec_globals = {'__name__': '__main__'}

            # Clean up asyncio.run() calls
            processed_code = scanner_code
            if 'asyncio.run(' in processed_code:
                lines = processed_code.split('\n')
                cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
                processed_code = '\n'.join(cleaned_lines)

            # Execute code in thread context
            stdout_capture = io.StringIO()
            with contextlib.redirect_stdout(stdout_capture):
                exec(processed_code, exec_globals)

            # Execute main function
            if 'main' in exec_globals and callable(exec_globals['main']):
                main_function = exec_globals['main']

                if asyncio.iscoroutinefunction(main_function):
                    stdout_capture = io.StringIO()
                    with contextlib.redirect_stdout(stdout_capture):
                        new_loop.run_until_complete(main_function())

                    execution_output = stdout_capture.getvalue()
                    print(f"📊 Thread execution output length: {len(execution_output)} characters")

            new_loop.close()

            # Check for results in thread context
            result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']
            thread_results = []

            print(f"\n📋 THREAD VARIABLE ANALYSIS:")
            for var_name in result_vars:
                if var_name in exec_globals and exec_globals[var_name] is not None:
                    var_data = exec_globals[var_name]
                    if hasattr(var_data, 'shape'):  # pandas DataFrame
                        print(f"✅ THREAD {var_name}: DataFrame with shape {var_data.shape}")
                        if len(var_data) > 0:
                            thread_results = var_data.to_dict('records')
                            break
                    elif isinstance(var_data, list) and len(var_data) > 0:
                        print(f"✅ THREAD {var_name}: List with {len(var_data)} items")
                        thread_results = var_data
                        break
                else:
                    print(f"❌ THREAD {var_name}: Not found or None")

            return thread_results

        except Exception as e:
            print(f"❌ Thread execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    # Test thread execution
    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
        future = executor.submit(thread_execution_test)
        try:
            thread_results = future.result(timeout=120)  # 2 minute timeout
            print(f"\n📊 Thread execution results: {len(thread_results)}")

            if thread_results:
                print(f"✅ THREAD EXECUTION WORKS - Found {len(thread_results)} results!")
                print(f"🎯 Sample thread result: {thread_results[0]}")
            else:
                print(f"❌ THREAD EXECUTION FAILED - Results lost in thread context")
                print(f"🔍 This suggests the issue is with threading/event loop interaction")

        except concurrent.futures.TimeoutError:
            print(f"⏰ Thread execution timed out after 120 seconds")
            print(f"🔍 This suggests the async execution is hanging in thread context")
        except Exception as e:
            print(f"❌ Thread execution failed: {e}")

    print(f"\n🔍 STEP 4: Analyze Date Filtering Impact")
    print("-" * 50)

    if direct_results:
        # Test date filtering on the direct results
        from uploaded_scanner_bypass import filter_results_by_date

        start_date = '2025-01-01'
        end_date = '2025-11-06'

        print(f"🗓️  Testing date filtering: {start_date} to {end_date}")
        print(f"📊 Input results: {len(direct_results)}")

        # Analyze date formats in results
        print(f"\n📅 DATE FORMAT ANALYSIS:")
        for i, result in enumerate(direct_results[:5]):
            if isinstance(result, dict):
                date_fields = {}
                for key, value in result.items():
                    if 'date' in key.lower() or 'time' in key.lower():
                        date_fields[key] = f"{value} (type: {type(value).__name__})"

                if date_fields:
                    print(f"   Result {i+1}: {date_fields}")
                else:
                    print(f"   Result {i+1}: No date fields found. Keys: {list(result.keys())[:10]}")

        try:
            filtered_results = filter_results_by_date(direct_results, start_date, end_date)
            print(f"\n📊 Filtered results: {len(filtered_results)}")

            if filtered_results:
                print(f"✅ DATE FILTERING PRESERVES RESULTS")
                print(f"🎯 Sample filtered result: {filtered_results[0]}")
            else:
                print(f"❌ DATE FILTERING REMOVES ALL RESULTS")
                print(f"🔍 This suggests the issue is with date format compatibility")

                # Test with wider date range
                print(f"\n🔧 Testing with wider date range (2020-2030)...")
                wide_filtered = filter_results_by_date(direct_results, '2020-01-01', '2030-12-31')
                print(f"📊 Wide range results: {len(wide_filtered)}")

        except Exception as e:
            print(f"❌ Date filtering failed: {e}")
            import traceback
            traceback.print_exc()

    print(f"\n🎯 DIAGNOSTIC SUMMARY:")
    print("=" * 50)

    if len(direct_results) > 0:
        print(f"✅ LC D2 Scanner: GENERATES {len(direct_results)} results internally")
    else:
        print(f"❌ LC D2 Scanner: GENERATES 0 results (code issue)")
        return

    if 'thread_results' in locals() and len(thread_results) > 0:
        print(f"✅ Thread Execution: PRESERVES {len(thread_results)} results")
    else:
        print(f"❌ Thread Execution: LOSES results (threading issue)")

    if 'filtered_results' in locals() and len(filtered_results) > 0:
        print(f"✅ Date Filtering: PRESERVES {len(filtered_results)} results")
    else:
        print(f"❌ Date Filtering: REMOVES all results (date format issue)")

    print(f"\n🔥 RECOMMENDED NEXT STEPS:")
    if 'thread_results' not in locals() or len(thread_results) == 0:
        print(f"1. 🎯 FIX THREAD EXECUTION: Results are lost during threading")
        print(f"   - Review ThreadPoolExecutor result capture")
        print(f"   - Ensure exec_globals are properly returned from thread")
        print(f"   - Test with synchronous execution in thread")

    if 'filtered_results' in locals() and len(filtered_results) == 0:
        print(f"2. 🎯 FIX DATE FILTERING: Date format incompatibility")
        print(f"   - Convert dates to standard format before filtering")
        print(f"   - Add fallback date parsing logic")
        print(f"   - Test with no date filtering")

if __name__ == "__main__":
    asyncio.run(debug_scanner_execution_pipeline())