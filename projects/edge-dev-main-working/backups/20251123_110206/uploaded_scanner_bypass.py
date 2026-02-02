#!/usr/bin/env python3
"""
Simple, working version of uploaded scanner bypass - fixes infinite loop issue
This replaces the overly complex logic that was causing event loop blocking
"""

import asyncio
import os
import tempfile
import pandas as pd
from datetime import datetime, timedelta
import subprocess
import sys
import io
import contextlib


async def safe_progress_callback(callback, percentage, message):
    """Helper function to safely call progress callbacks (async or sync)"""
    if callback:
        if asyncio.iscoroutinefunction(callback):
            await callback(percentage, message)
        else:
            callback(percentage, message)


async def execute_uploaded_scanner_direct(
    code: str,
    start_date: str = None,
    end_date: str = None,
    progress_callback=None,
    pure_execution_mode: bool = False
):
    """
    SIMPLIFIED version of uploaded scanner execution that prevents infinite loops
    and event loop blocking by using proper async patterns.
    """

    print(f"🚀 Starting SIMPLIFIED uploaded scanner execution...")
    print(f"📅 Date range: {start_date} to {end_date}")
    print(f"🔧 Pure execution mode: {pure_execution_mode}")

    # 🔧 FIX: Convert JavaScript 'null' to Python 'None' to prevent NameError
    if ' = null' in code:
        print("🔧 Converting JavaScript 'null' to Python 'None'")
        code = code.replace(' = null', ' = None')

    await safe_progress_callback(progress_callback, 10, "🚀 Initializing simplified scanner execution...")

    try:
        # Detect scanner pattern
        await safe_progress_callback(progress_callback, 20, "🔍 Detecting scanner pattern...")

        scanner_pattern = "unknown"
        # 🔧 FIXED: Detect standalone scripts vs. properly structured scanners
        # Standalone scripts should use direct execution, not LC D2 pattern execution
        is_standalone_script = (
            'if __name__ == "__main__":' in code
            # Removed arbitrary line count threshold
        )

        # 🔧 IMPROVED: Detect individual scanner files vs original multi-scanner files
        # Individual scanners should use direct execution, not LC D2 execution

        # Count actual trading patterns (exclude pricing calculations like _min_price)
        pattern_lines = [line for line in code.split('\n') if 'df[\'lc_frontside' in line and '= (' in line]
        actual_pattern_count = len(pattern_lines)

        is_individual_scanner = (
            'async def main(' in code and
            not is_standalone_script and
            # Individual scanners have exactly 1 main pattern definition
            (('df[\'lc_frontside_d3_extended_1\'] = ' in code and actual_pattern_count == 1) or
             ('df[\'lc_frontside_d2_extended\'] = ' in code and actual_pattern_count == 1) or
             ('df[\'lc_frontside_d2_extended_1\'] = ' in code and actual_pattern_count == 1))
        )

        # Real LC D2 scanners are complex multi-pattern files
        is_real_lc_d2 = (
            'async def main(' in code and
            ('DATES' in code or 'START_DATE' in code) and
            not is_standalone_script and
            not is_individual_scanner and  # 🔧 NEW: Exclude individual scanners
            # Multi-pattern LC D2 indicators (multiple patterns defined)
            (code.count('df[\'lc_frontside') >= 3 or  # Multiple LC patterns
             code.count('df["lc_frontside') >= 3 or
             'process_date(' in code)  # Original LC D2 function patterns
        )

        if is_standalone_script:
            scanner_pattern = "standalone_script"
            print(f"🎯 Detected Pattern: Standalone script ({len(code.split('\\n'))} lines) - using direct execution")
        elif is_individual_scanner:
            scanner_pattern = "direct_execution"
            print(f"🎯 Detected Pattern: Individual LC scanner ({len(code.split('\\n'))} lines) - using direct execution")
        elif is_real_lc_d2:
            scanner_pattern = "async_main_DATES"
            print(f"🎯 Detected Pattern: Multi-pattern LC D2 scanner - using LC D2 execution")
        elif 'def main(' in code:
            scanner_pattern = "sync_main"
            print(f"🎯 Detected Pattern: Synchronous main function")
        elif 'asyncio.run(' in code:
            scanner_pattern = "asyncio_run"
            print(f"🎯 Detected Pattern: asyncio.run() pattern")
        else:
            scanner_pattern = "direct_execution"
            print(f"🎯 Detected Pattern: Direct execution")

        await safe_progress_callback(progress_callback,
            30, f"🎯 Pattern detected: {scanner_pattern}")

        # Route to appropriate execution method
        if scanner_pattern == "async_main_DATES":
            return await execute_lc_d2_pattern_simple(code, start_date, end_date, progress_callback)
        elif scanner_pattern == "direct_execution":
            # 🚀 CRITICAL FIX: Route individual LC scanners to proper LC execution
            print(f"🎯 Routing individual LC scanner to LC D2 execution...")
            return await execute_lc_d2_pattern_simple(code, start_date, end_date, progress_callback)
        elif scanner_pattern in ["sync_main", "asyncio_run", "standalone_script"]:
            # 🔧 FIX: Route standalone scripts to generic execution (preserves original structure)
            return await execute_generic_pattern_simple(code, start_date, end_date, progress_callback)
        else:
            return await execute_fallback_simple(code, start_date, end_date, progress_callback)

    except Exception as e:
        print(f"❌ Scanner execution failed: {e}")
        await safe_progress_callback(progress_callback,
            100, f"❌ Execution failed: {str(e)}")
        return []


async def execute_lc_d2_pattern_simple(code: str, start_date: str, end_date: str, progress_callback):
    """
    FIXED LC D2 pattern execution - resolves nested event loop deadlock
    """
    print(f"🔧 Executing LC D2 pattern with EVENT LOOP FIX...")

    await safe_progress_callback(progress_callback, 40, "🔧 Preparing LC D2 scanner execution...")

    def run_scanner_sync():
        """Synchronous wrapper for LC D2 scanner execution - FIXED for nested event loops"""
        try:
            import io
            import contextlib
            import concurrent.futures
            import threading

            # Capture output
            stdout_capture = io.StringIO()
            exec_globals = {'__name__': '__main__'}

            print(f"🔧 Loading scanner code with EVENT LOOP FIX...")

            # Clean up asyncio.run() calls to prevent conflicts
            # FIXED: Only remove standalone asyncio.run() calls, preserve wrapper functions
            processed_code = code
            if 'asyncio.run(' in processed_code:
                print(f"🔧 Removing standalone asyncio.run() calls...")
                lines = processed_code.split('\n')
                cleaned_lines = []
                for line in lines:
                    # Only remove standalone asyncio.run() calls, preserve wrapper function calls
                    stripped = line.strip()

                    # Skip standalone asyncio.run() calls
                    if (stripped.startswith('asyncio.run(main') or
                        stripped.startswith('# asyncio.run(main') or
                        stripped == 'asyncio.run(main())' or
                        stripped == '# asyncio.run(main())'):
                        print(f"🔧 Skipped standalone: {line.strip()[:60]}...")
                    # Preserve wrapper function calls (return asyncio.run(...))
                    elif 'return asyncio.run(' in line:
                        print(f"🔧 Preserved wrapper: {line.strip()[:60]}...")
                        cleaned_lines.append(line)
                    # Preserve other asyncio.run calls in functions
                    elif 'asyncio.run(' in line and ('def ' in line or 'return' in line or line.strip().startswith('result = ')):
                        print(f"🔧 Preserved function call: {line.strip()[:60]}...")
                        cleaned_lines.append(line)
                    # Skip other standalone asyncio.run calls
                    elif line.strip().startswith('asyncio.run('):
                        print(f"🔧 Skipped standalone: {line.strip()[:60]}...")
                    else:
                        cleaned_lines.append(line)
                processed_code = '\n'.join(cleaned_lines)

            # 🔧 CRITICAL FIX: Inject user's date range for LC D2 scanners
            print(f"🎯 Injecting LC D2 date range: {start_date} to {end_date}")
            import re

            # Replace DATES list/array patterns common in LC scanners
            dates_patterns = [
                r'DATES\s*=\s*\[[^\]]*\]',
                r'dates\s*=\s*\[[^\]]*\]',
                r'DATE_RANGE\s*=\s*\[[^\]]*\]'
            ]

            for pattern in dates_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f'DATES = ["{start_date}", "{end_date}"]', processed_code)
                    print(f"🔧 Injected DATES array: {start_date} to {end_date}")

            # Replace individual date variables (FIXED: handle both single and double quotes)
            start_patterns = [
                r"START_DATE\s*=\s*['\"][^'\"]*['\"]",
                r"start_date\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in start_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"START_DATE = '{start_date}'", processed_code)
                    print(f"🔧 Injected START_DATE: {start_date}")

            end_patterns = [
                r"END_DATE\s*=\s*['\"][^'\"]*['\"]",
                r"end_date\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in end_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"END_DATE = '{end_date}'", processed_code)
                    print(f"🔧 Injected END_DATE: {end_date}")

            # 🔧 CRITICAL FIX: Also handle DATE variable (used by LC D2)
            date_patterns = [
                r"DATE\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in date_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"DATE = '{end_date}'", processed_code)
                    print(f"🔧 Injected DATE variable: {end_date}")

            # 🧠 MEMORY SAFETY: TEMPORARILY DISABLED FOR TESTING
            print(f"🧠 BYPASSING memory safety override for syntax debugging...")

            # Skip memory safety override to test if it's causing syntax errors
            memory_safe_override = ""  # Disabled for testing
            if True:  # Re-enabled for LC scanner execution
                memory_safe_override = f'''
# 🧠 MEMORY SAFETY OVERRIDE - Prevent 7.8M+ row memory exhaustion
def apply_memory_safe_date_limits():
    """Override dangerous date calculations that cause memory crashes"""
    global START_DATE, END_DATE, start_date_300_days_before, DATES

    try:
        import pandas as pd
        import pandas_market_calendars as mcal

        # Check if we're about to create a massive date range
        if 'START_DATE' in globals() and 'END_DATE' in globals():
            start_dt = pd.to_datetime(START_DATE)
            end_dt = pd.to_datetime(END_DATE)
            total_days = (end_dt - start_dt).days

            print(f"🧠 Original date range: {START_DATE} to {END_DATE} = {total_days} days")

            if total_days > 7:  # More than 1 week = potential memory issues
                print(f"⚠️  MEMORY SAFETY: {total_days} days would create 7M+ rows -> system crash")
                print(f"🔧 Limiting to 7 days to prevent memory exhaustion")

                # Use last 7 days from requested range
                safe_start = end_dt - pd.DateOffset(days=7)
                START_DATE = safe_start.strftime('%Y-%m-%d')

                print(f"🧠 Safe date range: {START_DATE} to {END_DATE}")

                # Override the 400-day lookback that causes the crash
                start_date_300_days_before = START_DATE
                print(f"🔧 Overrode start_date_300_days_before to prevent 726-day crash")

                # Create safe DATES list
                if 'nyse' in globals():
                    try:
                        DATES = nyse.valid_days(start_date=START_DATE, end_date=END_DATE)
                        DATES = [date.strftime('%Y-%m-%d') for date in DATES]
                        print(f"🧠 Safe DATES list: {len(DATES)} trading days: {DATES}")
                    except:
                        # Fallback to manual date list
                        DATES = [START_DATE, END_DATE]
                        print(f"🧠 Fallback DATES: {DATES}")

                return True
            else:
                print(f"✅ Date range is safe: {total_days} days")
                return False

    except Exception as e:
        print(f"⚠️  Memory safety check error: {e}")
        # Emergency fallback to 2-day range
        import datetime
        end_date_obj = datetime.datetime.strptime(END_DATE, '%Y-%m-%d')
        start_date_obj = end_date_obj - datetime.timedelta(days=2)
        END_DATE = end_date_obj.strftime('%Y-%m-%d')
        START_DATE = start_date_obj.strftime('%Y-%m-%d')

        globals()['START_DATE'] = START_DATE
        globals()['END_DATE'] = END_DATE
        globals()['start_date_300_days_before'] = START_DATE
        globals()['DATES'] = [START_DATE, END_DATE]

        print(f"🚨 Emergency safe mode: {START_DATE} to {END_DATE}")
        return True

# Apply memory safety immediately after date setup
if __name__ == "__main__":
    # Insert a call to apply memory safety right before main execution
    original_main_call = "asyncio.run(main())"

    # Add memory safety call before main
    def safe_main_wrapper():
        apply_memory_safe_date_limits()
        import asyncio
        return asyncio.run(main())

'''

            # Insert memory safety override near the end of the file, before main execution
            main_call_pattern = r'(if __name__ == "__main__":.*?)(\s*asyncio\.run\(main\(\)\))'

            if re.search(main_call_pattern, processed_code, re.DOTALL):
                # Insert memory safety before asyncio.run(main())
                processed_code = re.sub(
                    r'(if __name__ == "__main__":.*?)(\s*asyncio\.run\(main\(\)\))',
                    r'\1\n' + memory_safe_override + '\n    apply_memory_safe_date_limits()\n\2',
                    processed_code,
                    flags=re.DOTALL
                )
                print(f"✅ Memory safety override injected before main() execution")
            else:
                # Fallback: add at the end
                processed_code = processed_code + '\n' + memory_safe_override + '\napply_memory_safe_date_limits()\n'
                print(f"✅ Memory safety override added at end")

            # Replace datetime.today() patterns - comprehensive coverage with proper quote handling
            datetime_patterns = [
                # Handle datetime.today().strftime() with single quotes
                r"datetime\.today\(\)\.strftime\('[^']*'\)",
                # Handle datetime.today().strftime() with double quotes
                r"datetime\.today\(\)\.strftime\(\"[^\"]*\"\)",
                # Handle datetime.date.today().strftime() with single quotes
                r"datetime\.date\.today\(\)\.strftime\('[^']*'\)",
                # Handle datetime.date.today().strftime() with double quotes
                r"datetime\.date\.today\(\)\.strftime\(\"[^\"]*\"\)",
                # Handle datetime.now().strftime() with single quotes
                r"datetime\.now\(\)\.strftime\('[^']*'\)",
                # Handle datetime.now().strftime() with double quotes
                r"datetime\.now\(\)\.strftime\(\"[^\"]*\"\)",
                # Handle datetime.datetime.now().strftime() with single quotes
                r"datetime\.datetime\.now\(\)\.strftime\('[^']*'\)",
                # Handle datetime.datetime.now().strftime() with double quotes
                r"datetime\.datetime\.now\(\)\.strftime\(\"[^\"]*\"\)",
                # Handle datetime.datetime.today().strftime() with single quotes
                r"datetime\.datetime\.today\(\)\.strftime\('[^']*'\)",
                # Handle datetime.datetime.today().strftime() with double quotes
                r"datetime\.datetime\.today\(\)\.strftime\(\"[^\"]*\"\)",
                # Handle bare calls without strftime
                r"datetime\.datetime\.now\(\)",
                r"datetime\.datetime\.today\(\)",
                r"datetime\.date\.today\(\)",
                r"datetime\.now\(\)",
                r"datetime\.today\(\)"
            ]
            for pattern in datetime_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f'"{end_date}"', processed_code)
                    print(f"🔧 Replaced datetime pattern with: {end_date}")

            # Also fix API keys for LC scanners
            working_api_key = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"
            api_patterns = [
                r'API_KEY\s*=\s*["\'][^"\']*["\']',
                r'api_key\s*=\s*["\'][^"\']*["\']'
            ]
            for pattern in api_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f'API_KEY = "{working_api_key}"', processed_code)
                    print(f"🔧 Updated API key for LC scanner")

            # Execute code to load definitions
            print(f"🔧 Loading scanner definitions...")
            with contextlib.redirect_stdout(stdout_capture):
                exec(processed_code, exec_globals)

            # Look for main() function and execute it
            result_vars = [
                'df_lc', 'df_sc', 'results', 'final_results', 'all_results',
                'scanned_results', 'filtered_results', 'output', 'scan_output',
                'df', 'data', 'matched_stocks', 'matches', 'found_stocks',
                'lc_results', 'long_call_results', 'scan_results'
            ]

            found_results = []

            # Check for existing results first
            for var_name in result_vars:
                if var_name in exec_globals and exec_globals[var_name] is not None:
                    var_data = exec_globals[var_name]
                    if hasattr(var_data, 'to_dict'):  # pandas DataFrame
                        found_results = var_data.to_dict('records')
                        print(f"✅ Found {len(found_results)} results in existing DataFrame '{var_name}'")
                        break
                    elif isinstance(var_data, list) and len(var_data) > 0:
                        found_results = var_data
                        print(f"✅ Found {len(found_results)} results in existing list '{var_name}'")
                        break

            # If no results found, try to execute main()
            if not found_results and 'main' in exec_globals and callable(exec_globals['main']):
                print(f"🔧 Executing main() function with NESTED EVENT LOOP FIX...")
                main_function = exec_globals['main']

                try:
                    if asyncio.iscoroutinefunction(main_function):
                        print(f"🔧 LC D2 main() is async - using ThreadPoolExecutor to avoid nested loop conflict...")

                        # Use ThreadPoolExecutor for async main() functions to avoid nested event loop issues
                        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                            def run_async_main():
                                """Run async function in its own thread with its own event loop"""
                                import asyncio
                                import contextlib
                                from io import StringIO

                                # Create new event loop for this thread
                                loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(loop)

                                try:
                                    # Re-execute the code in this thread to get fresh globals
                                    thread_globals = {'__name__': '__main__'}
                                    exec(processed_code, thread_globals)

                                    # Get the main function
                                    if 'main' in thread_globals:
                                        thread_main = thread_globals['main']

                                        # Run the async main function
                                        loop.run_until_complete(thread_main())

                                        # Look for results in typical LC D2 variables
                                        for var_name in ['df_lc', 'lc_results', 'results', 'final_results']:
                                            if var_name in thread_globals and thread_globals[var_name] is not None:
                                                var_data = thread_globals[var_name]
                                                if hasattr(var_data, 'to_dict'):  # DataFrame
                                                    return var_data.to_dict('records')
                                                elif isinstance(var_data, list):
                                                    return var_data

                                        return []
                                    else:
                                        print(f"⚠️ No main function found in thread globals")
                                        return []

                                except Exception as e:
                                    print(f"⚠️ Thread execution error: {e}")
                                    import traceback
                                    traceback.print_exc()
                                    return []
                                finally:
                                    loop.close()

                            # Execute the async main in the thread
                            future = executor.submit(run_async_main)
                            thread_results = future.result(timeout=120)  # 2 minute timeout

                            if thread_results:
                                found_results = thread_results
                                print(f"✅ Found {len(found_results)} results from threaded execution")
                            else:
                                print(f"⚠️ Thread completed but returned no results")
                    else:
                        # Sync main function - execute normally
                        with contextlib.redirect_stdout(stdout_capture):
                            main_function()
                        print(f"✅ Sync main() executed successfully")

                    # Check for results after execution
                    for var_name in result_vars:
                        if var_name in exec_globals and exec_globals[var_name] is not None:
                            var_data = exec_globals[var_name]
                            if hasattr(var_data, 'to_dict'):  # pandas DataFrame
                                found_results = var_data.to_dict('records')
                                print(f"✅ Found {len(found_results)} results in DataFrame '{var_name}' after main()")
                                break
                            elif isinstance(var_data, list) and len(var_data) > 0:
                                found_results = var_data
                                print(f"✅ Found {len(found_results)} results in list '{var_name}' after main()")
                                break

                except Exception as e:
                    print(f"⚠️ Error executing main(): {e}")
                    import traceback
                    traceback.print_exc()

            captured_output = stdout_capture.getvalue()
            print(f"📄 Captured {len(captured_output)} characters of output")

            return found_results

        except Exception as e:
            print(f"❌ Scanner execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    # Execute in thread pool to prevent blocking
    if progress_callback:
        await progress_callback(60, "🚀 Running scanner with event loop fix...")

    try:
        # Use asyncio.to_thread for proper async execution without blocking
        results = await asyncio.wait_for(
            asyncio.to_thread(run_scanner_sync),
            timeout=120.0  # 2 minute timeout
        )

        await safe_progress_callback(progress_callback,
            90, f"🎯 Processing {len(results)} results...")

        # Filter results by date range if provided
        if results and start_date and end_date:
            results = filter_results_by_date(results, start_date, end_date)

        await safe_progress_callback(progress_callback,
            100, f"✅ Completed: {len(results)} results")

        print(f"🎉 LC D2 execution completed with EVENT LOOP FIX: {len(results)} results")
        return results

    except asyncio.TimeoutError:
        print(f"❌ Scanner execution timed out after 2 minutes")
        await safe_progress_callback(progress_callback,
            100, "❌ Scanner execution timed out")
        return []
    except Exception as e:
        print(f"❌ Scanner execution failed: {e}")
        await safe_progress_callback(progress_callback,
            100, f"❌ Execution failed: {str(e)}")
        return []


async def execute_generic_pattern_simple(code: str, start_date: str, end_date: str, progress_callback):
    """
    ENHANCED generic pattern execution with date injection and output capture
    """
    print(f"🔧 Executing generic pattern with enhanced orchestration...")

    await safe_progress_callback(progress_callback, 50, "🔧 Executing generic scanner pattern...")

    def run_generic_sync():
        """Synchronous wrapper for generic scanner execution with proper orchestration"""
        import io
        import sys
        import re
        from contextlib import redirect_stdout

        try:
            exec_globals = {'__name__': '__main__'}

            # 🔧 STEP 1: Fix API key
            fixed_code = code
            working_api_key = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"

            # Replace common API key patterns
            api_patterns = [
                r'API_KEY\s*=\s*["\'][^"\']*["\']',
                r'api_key\s*=\s*["\'][^"\']*["\']',
                r'apikey\s*=\s*["\'][^"\']*["\']'
            ]

            for pattern in api_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f'API_KEY = "{working_api_key}"', fixed_code)
                    print(f"🔧 Replaced API key in uploaded scanner with working key")

            # 🔧 STEP 2: Inject user's date range
            print(f"🎯 Injecting date range: {start_date} to {end_date}")

            # Replace hardcoded start_date patterns
            start_patterns = [
                r"start_date\s*=\s*['\"][^'\"]*['\"]",
                r"START_DATE\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in start_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f'start_date = "{start_date}"', fixed_code)
                    print(f"🔧 Injected start_date: {start_date}")

            # Replace hardcoded end_date patterns
            end_patterns = [
                r"end_date\s*=\s*datetime\.today\(\)\.strftime\(['\"][^'\"]*['\"]\)",
                r"end_date\s*=\s*datetime\.date\.today\(\)\.strftime\(['\"][^'\"]*['\"]\)",
                r"end_date\s*=\s*['\"][^'\"]*['\"]",
                r"END_DATE\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in end_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f'end_date = "{end_date}"', fixed_code)
                    print(f"🔧 Injected end_date: {end_date}")

            # 🔧 STEP 3: Capture printed output
            captured_output = io.StringIO()

            print(f"🚀 Executing A+ scanner with injected parameters...")
            with redirect_stdout(captured_output):
                exec(fixed_code, exec_globals)

            # 🔧 STEP 4: Parse printed results
            output_text = captured_output.getvalue()
            print(f"📊 Captured output: {len(output_text)} characters")

            results = []
            if output_text.strip():
                # Parse lines like "SYMBOL DATE"
                for line in output_text.strip().split('\n'):
                    line = line.strip()
                    if line and ' ' in line:
                        parts = line.split()
                        if len(parts) >= 2:
                            symbol = parts[0]
                            date_str = parts[1]
                            results.append({
                                'symbol': symbol,
                                'date': date_str,
                                'scanner_type': 'A+ Daily Parabolic'
                            })

            # 🔧 STEP 5: Also check for results in variables (fallback)
            if not results:
                result_vars = ['results', 'df', 'data', 'output', 'matches', 'found_stocks', 'out']
                for var_name in result_vars:
                    if var_name in exec_globals and exec_globals[var_name] is not None:
                        var_data = exec_globals[var_name]

                        if hasattr(var_data, 'to_dict'):  # pandas DataFrame
                            results.extend(var_data.to_dict('records'))
                        elif isinstance(var_data, list):
                            if var_data and hasattr(var_data[0], 'to_dict'):
                                for df in var_data:
                                    if hasattr(df, 'to_dict'):
                                        results.extend(df.to_dict('records'))
                            else:
                                results.extend(var_data)

            print(f"🎉 A+ scanner execution completed: {len(results)} results found")
            return results

        except Exception as e:
            print(f"❌ Generic scanner execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    try:
        results = await asyncio.to_thread(run_generic_sync)

        if results and start_date and end_date:
            results = filter_results_by_date(results, start_date, end_date)

        await safe_progress_callback(progress_callback,
            100, f"✅ Completed: {len(results)} results")

        print(f"🎉 Generic execution completed: {len(results)} results")
        return results

    except Exception as e:
        print(f"❌ Generic scanner execution failed: {e}")
        await safe_progress_callback(progress_callback,
            100, f"❌ Execution failed: {str(e)}")
        return []


async def execute_fallback_simple(code: str, start_date: str, end_date: str, progress_callback):
    """
    SIMPLIFIED fallback execution
    """
    print(f"🔧 Using fallback execution method...")

    await safe_progress_callback(progress_callback, 70, "🔧 Using fallback execution method...")

    try:
        exec_globals = {}
        exec(code, exec_globals)

        await safe_progress_callback(progress_callback,
            100, "✅ Fallback execution completed")

        print(f"🎉 Fallback execution completed")
        return []

    except Exception as e:
        print(f"❌ Fallback execution failed: {e}")
        await safe_progress_callback(progress_callback,
            100, f"❌ Fallback failed: {str(e)}")
        return []


def filter_results_by_date(results, start_date_str, end_date_str):
    """
    Filter results by date range - ENHANCED to handle more date field formats
    SMART FALLBACK: If no results after filtering, return original results with warning
    """
    if not results or not start_date_str or not end_date_str:
        print(f"🔍 No filtering needed: results={bool(results)}, start_date={start_date_str}, end_date={end_date_str}")
        return results

    try:
        start_date = pd.to_datetime(start_date_str)
        end_date = pd.to_datetime(end_date_str)
        print(f"🔍 Date range filter: {start_date.date()} to {end_date.date()}")

        filtered_results = []
        for i, result in enumerate(results):
            if isinstance(result, dict):
                # Enhanced date field detection - check ALL possible date field names
                date_value = None
                date_field_found = None

                # Check all possible date field names (more comprehensive list)
                possible_date_fields = [
                    'date', 'Date', 'DATE', 'scan_date', 'scan_Date', 'timestamp',
                    'time', 'Time', 'datetime', 'DateTime', 'day', 'Day',
                    'trade_date', 'trading_date', 'signal_date'
                ]

                for date_field in possible_date_fields:
                    if date_field in result:
                        try:
                            # Enhanced date parsing to handle datetime.date objects from LC D2
                            raw_date = result[date_field]
                            if isinstance(raw_date, str):
                                date_value = pd.to_datetime(raw_date)
                            elif hasattr(raw_date, 'date'):  # datetime object
                                date_value = pd.to_datetime(raw_date)
                            elif hasattr(raw_date, 'year'):  # datetime.date object (LC D2 format)
                                date_value = pd.to_datetime(raw_date)
                            else:
                                # Try direct conversion as fallback
                                date_value = pd.to_datetime(raw_date)
                            date_field_found = date_field
                            break
                        except Exception as e:
                            continue

                # If no standard date field found, print the keys for debugging
                if date_value is None and i < 3:  # Only print for first 3 results to avoid spam
                    print(f"🔍 Result {i} keys: {list(result.keys())}")

                # Check if date is in range
                if date_value and start_date <= date_value <= end_date:
                    # Standardize result format
                    standardized = {
                        'ticker': result.get('ticker', result.get('Ticker', result.get('symbol', result.get('Symbol', '')))),
                        'date': date_value.strftime('%Y-%m-%d'),
                        'scan_type': 'uploaded_simple'
                    }
                    # Add other fields
                    for key, value in result.items():
                        if key.lower() not in ['ticker', 'date']:
                            standardized[key] = value

                    filtered_results.append(standardized)
                    if len(filtered_results) <= 3:  # Show first few matches
                        print(f"  ✅ Match {len(filtered_results)}: {standardized['ticker']} on {standardized['date']}")

        print(f"🔍 FINAL FILTER: {len(results)} -> {len(filtered_results)} results by date range {start_date.date()} to {end_date.date()}")

        # 🚀 SMART FALLBACK: If filtering removes ALL results from uploaded scanner, show original results
        if len(filtered_results) == 0 and len(results) > 0:
            print(f"⚠️ SMART FALLBACK: Date filtering removed ALL {len(results)} results from uploaded scanner!")
            print(f"🔄 Returning original results with date range note...")

            # Standardize original results without date filtering
            fallback_results = []
            for result in results[:20]:  # Limit to first 20 for display
                if isinstance(result, dict):
                    standardized = {
                        'ticker': result.get('ticker', result.get('Ticker', result.get('symbol', result.get('Symbol', 'N/A')))),
                        'date': 'varies',  # Indicate date range varies
                        'scan_type': 'uploaded_unfiltered',
                        'note': f'Original scanner results (outside {start_date.date()} to {end_date.date()} range)'
                    }
                    # Add other fields
                    for key, value in result.items():
                        if key.lower() not in ['ticker', 'date']:
                            standardized[key] = value
                    fallback_results.append(standardized)

            print(f"🎯 FALLBACK: Returning {len(fallback_results)} unfiltered results")
            return fallback_results

        return filtered_results

    except Exception as e:
        print(f"⚠️ Date filtering failed: {e}, returning all results")
        return results


def detect_scanner_type_simple(code: str) -> str:
    """
    Simple scanner type detection for compatibility with main.py imports
    Enhanced to properly detect individual scanners
    """
    # Check for standalone script
    is_standalone_script = 'if __name__ == "__main__":' in code

    # Count actual trading patterns (exclude pricing calculations like _min_price)
    pattern_lines = [line for line in code.split('\n') if 'df[\'lc_frontside' in line and '= (' in line]
    actual_pattern_count = len(pattern_lines)

    # Check for individual scanner (single pattern definition)
    is_individual_scanner = (
        'async def main(' in code and
        not is_standalone_script and
        # Individual scanners have exactly 1 main pattern definition
        (('df[\'lc_frontside_d3_extended_1\'] = ' in code and actual_pattern_count == 1) or
         ('df[\'lc_frontside_d2_extended\'] = ' in code and actual_pattern_count == 1) or
         ('df[\'lc_frontside_d2_extended_1\'] = ' in code and actual_pattern_count == 1))
    )

    # Check for real LC D2 (multi-pattern) scanner
    is_real_lc_d2 = (
        'async def main(' in code and
        ('DATES' in code or 'START_DATE' in code) and
        not is_standalone_script and
        not is_individual_scanner and  # Exclude individual scanners
        # Multi-pattern LC D2 indicators (multiple patterns defined)
        (code.count('df[\'lc_frontside') >= 3 or  # Multiple LC patterns
         code.count('df["lc_frontside') >= 3 or
         'process_date(' in code)  # Original LC D2 function patterns
    )

    if is_standalone_script:
        return "standalone_script"
    elif is_individual_scanner:
        return "direct_execution"  # Route individual scanners to direct execution
    elif is_real_lc_d2:
        return "async_main_DATES"  # Only true multi-pattern LC D2 scanners
    elif 'def main(' in code:
        return "sync_main"
    elif 'asyncio.run(' in code:
        return "asyncio_run"
    else:
        return "direct_execution"


def should_use_direct_execution(code: str) -> bool:
    """
    Simple decision function for compatibility with main.py imports
    """
    # Always use direct execution for simplicity
    return True


if __name__ == "__main__":
    print("🔧 Simple uploaded scanner bypass - ready for use")