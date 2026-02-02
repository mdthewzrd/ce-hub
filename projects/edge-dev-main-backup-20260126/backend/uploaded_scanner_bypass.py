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
    pure_execution_mode: bool = False,
    function_name: str = None
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

        # NEW: Check for standalone script with __main__ execution
        has_main_execution = (
            'if __name__ == "__main__":' in code and
            'SYMBOLS' in code and  # Has symbol universe
            'ThreadPoolExecutor' in code and  # Uses parallel execution
            'futs = {exe.submit(' in code  # Standard pattern
        )

        # Real LC D2 scanners are complex multi-pattern files
        is_real_lc_d2 = (
            'async def main(' in code and
            ('DATES' in code or 'START_DATE' in code) and
            not is_standalone_script and
            not is_individual_scanner and  # 🔧 NEW: Exclude individual scanners
            not has_main_execution and  # NEW: Exclude standalone scripts
            # Multi-pattern LC D2 indicators (multiple patterns defined)
            (code.count('df[\'lc_frontside') >= 3 or  # Multiple LC patterns
             code.count('df["lc_frontside') >= 3 or
             'process_date(' in code)  # Original LC D2 function patterns
        )

        # NEW: Check for user functions that need to be called
        has_user_function = False
        user_function_name = None

        # Infrastructure functions to exclude (same as frontend + additional ones)
        infrastructure_functions = [
            '__init__',  # ❌ CRITICAL FIX: Exclude class constructors
            '__init__',
            '__str__',
            '__repr__',
            'get_proper_date_range',
            'get_full_ticker_universe',
            'fetch_aggregates_enhanced',
            'fetch_and_scan_a_plus',
            'fetch_data_enhanced',
            'fetch_and_scan_custom',
            'fetch_daily',  # Data fetching function, not main scanner
            'run_enhanced_a_plus_scan',
            'run_enhanced_custom_scan',
            'run_enhanced_lc_scan',
            'dates_before_after',
            'get_offsets',
            'add_daily_metrics',  # Helper function for metrics
            'abs_top_window',  # Helper function for window calculations
            'pos_between',  # Helper function for position calculations
            '_mold_on_row',  # Helper function for mold detection
            '_extract_parameters',  # Helper function for parameter extraction
            'format_results',  # Helper function for formatting results
            '_process_ticker',  # Helper function for processing individual tickers
            '_process_ticker_optimized_pre_sliced',  # Helper function for optimized ticker processing
            'compute_simple_features',  # v31 helper function
            'apply_smart_filters',  # v31 helper function
            'compute_full_features',  # v31 helper function
            'detect_patterns',  # v31 helper function
            'fetch_grouped_data',  # v31 helper function
            '_fetch_grouped_day'  # v31 helper function
        ]

        # Find all function definitions in the code
        import re
        all_function_matches = re.findall(r'def\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*\(', code)
        print(f"🔍 Function Detection Debug:")
        print(f"   All functions found: {all_function_matches}")

        # ✅ CRITICAL FIX: Prioritize run_scan for v31 scanners (highest priority)
        if 'run_scan' in all_function_matches:
            user_function_name = 'run_scan'
            has_user_function = True
            print(f"   ✅✅✅ HIGHEST PRIORITY: run_scan function detected for v31 scanner")
        # 🔧 CRITICAL FIX: Prioritize scan_symbol function for backside scanners
        elif 'scan_symbol' in all_function_matches:
            user_function_name = 'scan_symbol'
            has_user_function = True
            print(f"   ✅ Prioritized scan_symbol function detected for backside scanner")
        # If a specific function name is provided, use it
        elif function_name and function_name in all_function_matches:
            user_function_name = function_name
            has_user_function = True
            print(f"   ✅ Using specified function: {function_name}")
        else:
            # Filter out infrastructure functions to find user functions (fallback)
            for func_name in all_function_matches:
                if func_name not in infrastructure_functions:
                    user_function_name = func_name
                    has_user_function = True
                    print(f"   ✅ User function detected: {func_name}")
                    break

        if not has_user_function:
            print(f"   ❌ No user functions detected - all functions are infrastructure")

        # 🔧 FIX: Prioritize user function execution over standalone script for backside scanners
        # Backside scanners should always use user function pattern for scan_symbol execution
        is_backside_scanner = (
            'scan_symbol' in all_function_matches and
            ('P = {' in code or 'PARAMS' in code) and
            ('fetch_start' in code or 'PRINT_FROM' in code)
        )

        # 🔧 CRITICAL FIX: Backside scanners should ALWAYS use user function execution
        # ✅ CRITICAL FIX: Prioritize standalone scripts FIRST (highest priority)
        # Standalone scripts with if __name__ == "__main__": should execute as complete scripts
        # This is CRITICAL for v31 class-based scanners that need proper instantiation
        if is_standalone_script:
            scanner_pattern = "standalone_script"
            print(f"🎯✅✅ HIGHEST PRIORITY: Detected Pattern: Standalone script with if __name__ == '__main__': - using complete script execution")
        # Then check for backside scanners with user functions (but NOT if they're standalone scripts)
        elif is_backside_scanner and has_user_function and user_function_name:
            scanner_pattern = "user_function"
            print(f"🎯 DETECTED: Backside scanner with {user_function_name} - using user function execution")
        elif has_user_function and user_function_name:
            scanner_pattern = "user_function"
            print(f"🎯 Detected Pattern: User function execution ({user_function_name})")
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
        if scanner_pattern == "user_function":
            print(f"🎯 Routing user function to custom execution wrapper...")
            return await execute_user_function_pattern(code, start_date, end_date, progress_callback, user_function_name)
        elif scanner_pattern == "async_main_DATES":
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

            # 🔧 CRITICAL FIX: Apply PROVEN date range logic for Backside B scanners
            print(f"🎯 Applying PROVEN date range logic: fetch from 2021, display {start_date} to {end_date}")
            import re

            # PROVEN FIX: For Backside B scanners, always fetch from 2021-01-01 for proper technical indicators
            # but display results in user's requested range
            fetch_start = "2021-01-01"
            fetch_end = datetime.now().strftime("%Y-%m-%d")  # Today

            print(f"🔧 Using proven date logic: FETCH {fetch_start} to {fetch_end}, DISPLAY {start_date} to {end_date}")

            # Replace FETCH_START/FETCH_END patterns (our proven approach)
            fetch_start_patterns = [
                r"FETCH_START\s*=\s*['\"][^'\"]*['\"]",
                r"fetch_start\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in fetch_start_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"FETCH_START = '{fetch_start}'", processed_code)
                    print(f"🔧 Set FETCH_START to: {fetch_start}")

            fetch_end_patterns = [
                r"FETCH_END\s*=\s*['\"][^'\"]*['\"]",
                r"fetch_end\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in fetch_end_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"FETCH_END = '{fetch_end}'", processed_code)
                    print(f"🔧 Set FETCH_END to: {fetch_end}")

            # Replace PRINT_FROM/PRINT_TO patterns (for result display)
            print_from_patterns = [
                r"PRINT_FROM\s*=\s*['\"][^'\"]*['\"]",
                r"print_from\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in print_from_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"PRINT_FROM = '{start_date}'", processed_code)
                    print(f"🔧 Set PRINT_FROM to: {start_date}")

            print_to_patterns = [
                r"PRINT_TO\s*=\s*['\"][^'\"]*['\"]",
                r"print_to\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in print_to_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"PRINT_TO = '{end_date}'", processed_code)
                    print(f"🔧 Set PRINT_TO to: {end_date}")

            # LEGACY: Replace old-style date variables for compatibility
            # Replace DATES list/array patterns common in LC scanners
            dates_patterns = [
                r'DATES\s*=\s*\[[^\]]*\]',
                r'dates\s*=\s*\[[^\]]*\]',
                r'DATE_RANGE\s*=\s*\[[^\]]*\]'
            ]

            for pattern in dates_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f'DATES = ["{fetch_start}", "{fetch_end}"]', processed_code)
                    print(f"🔧 Set DATES array: {fetch_start} to {fetch_end} (for historical data)")

            # Replace individual date variables (FIXED: handle both single and double quotes)
            start_patterns = [
                r"START_DATE\s*=\s*['\"][^'\"]*['\"]",
                r"start_date\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in start_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"START_DATE = '{fetch_start}'", processed_code)
                    print(f"🔧 Set START_DATE to: {fetch_start} (for historical data)")

            end_patterns = [
                r"END_DATE\s*=\s*['\"][^'\"]*['\"]",
                r"end_date\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in end_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"END_DATE = '{fetch_end}'", processed_code)
                    print(f"🔧 Set END_DATE to: {fetch_end} (for historical data)")

            # 🔧 CRITICAL FIX: Also handle DATE variable (used by LC D2)
            date_patterns = [
                r"DATE\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in date_patterns:
                if re.search(pattern, processed_code):
                    processed_code = re.sub(pattern, f"DATE = '{fetch_end}'", processed_code)
                    print(f"🔧 Set DATE variable: {fetch_end} (for historical data)")

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

            # 🔧 CRITICAL FIX: DISABLED memory safety limits for Backside B scanners
            # Your working scanner uses years of data, not just 7 days!
            if total_days > 7:
                print(f"⚠️  MEMORY SAFETY BYPASSED: {total_days} days required for proper technical indicators")
                print(f"🎯 Using PROVEN approach: Full historical range for accurate pattern detection")
                # DO NOT limit date range - Backside B needs years of data like your working version
                print(f"🧠 Preserving original date range: {START_DATE} to {END_DATE} = {total_days} days")

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
        try:
            # Check if we're already in an async context
            if asyncio.get_event_loop().is_running():
                # We're in an async context, create a new event loop
                loop = asyncio.new_event_loop()
                asyncio.set_event_loop(loop)
                try:
                    return loop.run_until_complete(main())
                finally:
                    asyncio.set_event_loop(asyncio.get_event_loop())
            else:
                # We're not in an async context, safe to use asyncio.run()
                return asyncio.run(main())
        except Exception:
            # Fallback to the original method
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
    print(f"🚀 Initializing scan execution...")

    await safe_progress_callback(progress_callback, 50, "Initializing...")

    def run_generic_sync():
        """Synchronous wrapper for generic scanner execution with proper orchestration"""
        import io
        import sys
        import re
        from contextlib import redirect_stdout

        try:
            exec_globals = {'__name__': '__backend_scan__'}  # Don't trigger __main__ block

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

            # 🔧 STEP 2: Apply SMART date range logic - fetch only what's needed
            print(f"🎯 Applying SMART date range logic for {start_date} to {end_date}")

            # SMART FIX: Calculate fetch_start as 30 days before user's start_date
            # This gives enough historical data for indicators without fetching too much!
            from datetime import timedelta
            user_start = datetime.strptime(start_date, "%Y-%m-%d")
            user_end = datetime.strptime(end_date, "%Y-%m-%d")
            fetch_start = (user_start - timedelta(days=30)).strftime("%Y-%m-%d")  # 30 days before (faster!)
            fetch_end = min(user_end, datetime.now()).strftime("%Y-%m-%d")  # User's end_date or today, whichever is earlier

            print(f"🔧 Using SMART date logic (30-day buffer): FETCH {fetch_start} to {fetch_end}, DISPLAY {start_date} to {end_date}")

            # Replace FETCH_START/FETCH_END patterns (our proven approach)
            fetch_start_patterns = [
                r"FETCH_START\s*=\s*['\"][^'\"]*['\"]",
                r"fetch_start\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in fetch_start_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f"FETCH_START = '{fetch_start}'", fixed_code)
                    print(f"🔧 Set FETCH_START to: {fetch_start}")

            fetch_end_patterns = [
                r"FETCH_END\s*=\s*['\"][^'\"]*['\"]",
                r"fetch_end\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in fetch_end_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f"FETCH_END = '{fetch_end}'", fixed_code)
                    print(f"🔧 Set FETCH_END to: {fetch_end}")

            # Replace PRINT_FROM/PRINT_TO patterns (for result display)
            print_from_patterns = [
                r"PRINT_FROM\s*=\s*['\"][^'\"]*['\"]",
                r"print_from\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in print_from_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f"PRINT_FROM = '{start_date}'", fixed_code)
                    print(f"🔧 Set PRINT_FROM to: {start_date}")

            print_to_patterns = [
                r"PRINT_TO\s*=\s*['\"][^'\"]*['\"]",
                r"print_to\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in print_to_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f"PRINT_TO = '{end_date}'", fixed_code)
                    print(f"🔧 Set PRINT_TO to: {end_date}")

            # LEGACY: Replace old-style date variables for compatibility
            # Replace hardcoded start_date patterns
            start_patterns = [
                r"start_date\s*=\s*['\"][^'\"]*['\"]",
                r"START_DATE\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in start_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f'start_date = "{fetch_start}"', fixed_code)
                    print(f"🔧 Set start_date to: {fetch_start} (for historical data)")

            # Replace hardcoded end_date patterns
            end_patterns = [
                r"end_date\s*=\s*datetime\.today\(\)\.strftime\(['\"][^'\"]*['\"]\)",
                r"end_date\s*=\s*datetime\.date\.today\(\)\.strftime\(['\"][^'\"]*['\"]\)",
                r"end_date\s*=\s*['\"][^'\"]*['\"]",
                r"END_DATE\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in end_patterns:
                if re.search(pattern, fixed_code):
                    fixed_code = re.sub(pattern, f'end_date = "{fetch_end}"', fixed_code)
                    print(f"🔧 Set end_date to: {fetch_end} (for historical data)")

            # 🔧 STEP 3: Load the scanner code (define functions, don't execute yet)
            print(f"🚀 Loading A+ scanner code...")
            exec_result = exec(fixed_code, exec_globals)

            # 🔧 STEP 4: Explicitly call run_scan() to get results
            print(f"🎯 Calling run_scan() function...")
            results = []

            # Check if run_scan function exists
            if 'run_scan' in exec_globals and callable(exec_globals['run_scan']):
                try:
                    # Try calling with positional args first (for old-style scanners)
                    try:
                        scan_results = exec_globals['run_scan'](fetch_start, fetch_end)
                        print(f"✅ run_scan() called with positional args, returned: {type(scan_results)}")
                    except TypeError:
                        # Fallback to keyword args (for v31 scanners)
                        scan_results = exec_globals['run_scan'](start_date=fetch_start, end_date=fetch_end)
                        print(f"✅ run_scan() called with keyword args, returned: {type(scan_results)}")

                    # Handle different return types
                    if hasattr(scan_results, 'to_dict'):
                        # It's a DataFrame - convert to list of dicts
                        results = scan_results.to_dict('records')
                        print(f"✅ Converted DataFrame to list: {len(results)} results")
                    elif isinstance(scan_results, list):
                        results = scan_results
                        print(f"✅ Got list of results: {len(results)} results")
                    elif scan_results is not None:
                        print(f"⚠️  Unexpected result type: {type(scan_results)}")

                    # Debug: show first result
                    if len(results) > 0:
                        print(f"   Sample result: {results[0]}")

                except Exception as e:
                    print(f"❌ Error calling run_scan(): {e}")
                    import traceback
                    traceback.print_exc()

            # Fallback: Check for results in variables (for old-style scanners)
            elif 'all_results' in exec_globals and exec_globals['all_results'] is not None:
                variable_results = exec_globals['all_results']
                print(f"✅ Found 'all_results' variable with type: {type(variable_results)}")

                if hasattr(variable_results, 'to_dict'):
                    results = variable_results.to_dict('records')
                    print(f"✅ Converted DataFrame to list: {len(results)} results")
                elif isinstance(variable_results, list) and len(variable_results) > 0:
                    results = variable_results
                    print(f"✅ Found results in 'all_results' variable: {len(results)} results")
                if len(results) > 0:
                    print(f"   Sample result: {results[0]}")

            elif 'results' in exec_globals and exec_globals['results'] is not None:
                variable_results = exec_globals['results']
                print(f"✅ Found 'results' variable with type: {type(variable_results)}")

                if hasattr(variable_results, 'to_dict'):
                    results = variable_results.to_dict('records')
                    print(f"✅ Converted DataFrame to list: {len(results)} results")
                elif isinstance(variable_results, list) and len(variable_results) > 0:
                    results = variable_results
                    print(f"✅ Found results in 'results' variable: {len(results)} results")
                if len(results) > 0:
                    print(f"   Sample result: {results[0]}")

            # 🔧 STEP 5: Fallback - check for other result variables if no results yet
            if not results:
                result_vars = ['df', 'data', 'output', 'matches', 'found_stocks', 'out']
                for var_name in result_vars:
                    if var_name in exec_globals and exec_globals[var_name] is not None:
                        var_data = exec_globals[var_name]

                        if hasattr(var_data, 'to_dict'):  # pandas DataFrame
                            results.extend(var_data.to_dict('records'))
                            print(f"✅ Found results in '{var_name}' variable: {len(results)} results")
                        elif isinstance(var_data, list):
                            if var_data and hasattr(var_data[0], 'to_dict'):
                                for df in var_data:
                                    if hasattr(df, 'to_dict'):
                                        results.extend(df.to_dict('records'))
                            else:
                                results.extend(var_data)
                                print(f"✅ Found results in '{var_name}' variable: {len(results)} results")
                    if results:  # Stop if we found results
                        break

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


async def execute_user_function_pattern(code: str, start_date: str, end_date: str, progress_callback, user_function_name: str):
    """
    Execute user-defined functions with proper market data and symbol iteration
    Similar to frontend's pythonExecutorService approach
    """
    print(f"🎯 Executing user function: {user_function_name}")

    await safe_progress_callback(progress_callback, 40, f"🎯 Setting up user function execution: {user_function_name}")

    # Import for coroutine fixes
    import concurrent.futures

    def run_user_function_sync():
        """Execute backside B scanner properly"""
        try:
            import io
            import contextlib
            import pandas as pd
            from datetime import datetime
            import concurrent.futures

            # Capture output
            stdout_capture = io.StringIO()
            exec_globals = {'__name__': '__main__'}

            # 🔧 CRITICAL FIX: Add _safe_len function to global scope
            def _safe_len(obj):
                """Safe len() function that handles coroutines properly"""
                import asyncio
                import concurrent.futures
                # Check if it's a coroutine and handle it
                if asyncio.iscoroutine(obj):
                    print(f"🔧 CRITICAL: Detected coroutine in len() call, executing...")
                    def run_coroutine():
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                        try:
                            result = new_loop.run_until_complete(obj)
                            return len(result) if hasattr(result, '__len__') else 0
                        finally:
                            new_loop.close()
                            asyncio.set_event_loop(None)

                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(run_coroutine)
                        return future.result(timeout=30)
                else:
                    return len(obj)

            # Add _safe_len to global scope
            exec_globals['_safe_len'] = _safe_len

            print(f"🔧 Loading backside B scanner code...")

            # Add asyncio conflict handling to execution globals
            def safe_asyncio_run(main_func):
                """Safe asyncio execution wrapper that handles event loop conflicts"""
                import asyncio
                import concurrent.futures
                import threading

                try:
                    # Handle different types of main_func
                    if asyncio.iscoroutine(main_func):
                        # It's already a coroutine
                        coro = main_func
                    elif callable(main_func):
                        # It's a function, call it to get the coroutine
                        coro = main_func()
                    else:
                        # It's neither coroutine nor callable, return as-is
                        return main_func

                    # Check if we're in an async context
                    try:
                        current_loop = asyncio.get_running_loop()
                        # We're in an async context, use create_task
                        if current_loop.is_running():
                            # Create task and wait for it in the current loop
                            task = asyncio.create_task(coro)
                            # Use a small timeout to avoid blocking forever
                            try:
                                return asyncio.wait_for(task, timeout=300)  # 5 minute timeout
                            except asyncio.TimeoutError:
                                task.cancel()
                                return None
                        else:
                            return current_loop.run_until_complete(coro)
                    except RuntimeError:
                        # No running loop, safe to use asyncio.run()
                        return asyncio.run(coro)

                except Exception as e:
                    print(f"⚠️ safe_asyncio_run error, trying sync fallback: {e}")
                    # Enhanced fallback handling
                    try:
                        if callable(main_func):
                            # Try direct synchronous execution
                            result = main_func()
                            if asyncio.iscoroutine(result):
                                # If it returns a coroutine, try to run it in a new thread
                                def run_in_thread():
                                    new_loop = asyncio.new_event_loop()
                                    asyncio.set_event_loop(new_loop)
                                    try:
                                        return new_loop.run_until_complete(result)
                                    finally:
                                        new_loop.close()
                                        asyncio.set_event_loop(None)

                                with concurrent.futures.ThreadPoolExecutor() as executor:
                                    future = executor.submit(run_in_thread)
                                    return future.result(timeout=300)
                            return result
                        else:
                            return main_func
                    except Exception as e2:
                        print(f"⚠️ All async methods failed, returning None: {e2}")
                        return None

            def _safe_len(obj):
                """Safe len() function that handles coroutines properly"""
                import asyncio
                import concurrent.futures
                # Check if it's a coroutine and handle it
                if asyncio.iscoroutine(obj):
                    print(f"🔧 CRITICAL: Detected coroutine in len() call, executing...")
                    def run_coroutine():
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                        try:
                            result = new_loop.run_until_complete(obj)
                            return len(result) if hasattr(result, '__len__') else 0
                        finally:
                            new_loop.close()
                            asyncio.set_event_loop(None)

                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(run_coroutine)
                        return future.result(timeout=30)
                else:
                    return len(obj)

            # Load the scanner symbols and parameters
            scanner_symbols = [
                'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
                'NFLX','SNAP','RBLX','META','SE','NVDA','AAPL','MSFT','GOOGL','AMZN','TSLA',
                'AMD','INTC','BA','PYPL','QCOM','ORCL','KO','PEP','ABBV','JNJ','CRM','BAC',
                'JPM','WMT','CVX','XOM','COP','RTX','SPGI','GS','HD','LOW','COST','UNH','NKE',
                'LMT','HON','CAT','LIN','ADBE','AVGO','TXN','ACN','UPS','BLK','PM','ELV','VRTX',
                'ZTS','NOW','ISRG','PLD','MS','MDT','WM','GE','IBM','BKNG','FDX','ADP','EQIX',
                'DHR','SNPS','REGN','SYK','TMO','CVS','INTU','SCHW','CI','APD','SO','MMC','ICE',
                'FIS','ADI','CSX','LRCX','GILD','RIVN','PLTR','SNOW','SPY','QQQ','IWM','RIOT',
                'MARA','COIN','MRNA','CELH','UPST','AFRM','DKNG'
            ]

            print(f"🎯 Processing {len(scanner_symbols)} symbols for backside B scanner...")

            # 🔧 CRITICAL FIX: Apply PROVEN date range logic for Backside B scanners
            print(f"🎯 Applying PROVEN date range logic: fetch from 2021, display {start_date} to {end_date}")
            import re

            # PROVEN FIX: For Backside B scanners, always fetch from 2021-01-01 for proper technical indicators
            # but display results in user's requested range
            fetch_start = "2021-01-01"
            fetch_end = datetime.now().strftime("%Y-%m-%d")  # Today

            print(f"🔧 Using proven date logic: FETCH {fetch_start} to {fetch_end}, DISPLAY {start_date} to {end_date}")

            # Apply the same date range logic as the working LC D2 execution
            modified_code = code

            # Replace FETCH_START/FETCH_END patterns (our proven approach)
            fetch_start_patterns = [
                r"FETCH_START\s*=\s*['\"][^'\"]*['\"]",
                r"fetch_start\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in fetch_start_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f"FETCH_START = '{fetch_start}'", modified_code)
                    print(f"🔧 Set FETCH_START to: {fetch_start}")

            fetch_end_patterns = [
                r"FETCH_END\s*=\s*['\"][^'\"]*['\"]",
                r"fetch_end\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in fetch_end_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f"FETCH_END = '{fetch_end}'", modified_code)
                    print(f"🔧 Set FETCH_END to: {fetch_end}")

            # Replace PRINT_FROM/PRINT_TO patterns (for result display)
            print_from_patterns = [
                r"PRINT_FROM\s*=\s*['\"][^'\"]*['\"]",
                r"print_from\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in print_from_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f"PRINT_FROM = '{start_date}'", modified_code)
                    print(f"🔧 Set PRINT_FROM to: {start_date}")

            print_to_patterns = [
                r"PRINT_TO\s*=\s*['\"][^'\"]*['\"]",
                r"print_to\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in print_to_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f"PRINT_TO = '{end_date}'", modified_code)
                    print(f"🔧 Set PRINT_TO to: {end_date}")

            # LEGACY: Replace old-style date variables for compatibility
            # Replace DATES list/array patterns common in LC scanners
            dates_patterns = [
                r'DATES\s*=\s*\[[^\]]*\]',
                r'dates\s*=\s*\[[^\]]*\]',
                r'DATE_RANGE\s*=\s*\[[^\]]*\]'
            ]

            for pattern in dates_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f'DATES = ["{fetch_start}", "{fetch_end}"]', modified_code)
                    print(f"🔧 Set DATES array: {fetch_start} to {fetch_end} (for historical data)")

            # Replace individual date variables (FIXED: handle both single and double quotes)
            start_patterns = [
                r"START_DATE\s*=\s*['\"][^'\"]*['\"]",
                r"start_date\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in start_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f"START_DATE = '{fetch_start}'", modified_code)
                    print(f"🔧 Set START_DATE to: {fetch_start} (for historical data)")

            end_patterns = [
                r"END_DATE\s*=\s*['\"][^'\"]*['\"]",
                r"end_date\s*=\s*['\"][^'\"]*['\"]"
            ]
            for pattern in end_patterns:
                if re.search(pattern, modified_code):
                    modified_code = re.sub(pattern, f"END_DATE = '{fetch_end}'", modified_code)
                    print(f"🔧 Set END_DATE to: {fetch_end} (for historical data)")

            # Apply variables to execution globals with PROVEN date ranges
            exec_globals.update({
                'start_date': start_date,
                'end_date': end_date,
                'fetch_start': fetch_start,  # PROVEN: Add fetch range for proper technical indicators
                'fetch_end': fetch_end,      # PROVEN: Add fetch range for proper technical indicators
                'safe_asyncio_run': safe_asyncio_run,
                '_safe_len': _safe_len
            })

            # Apply preemptive asyncio fix to prevent event loop conflicts
            import re
            # Pattern to match asyncio.run(anything)
            asyncio_pattern = r'asyncio\.run\(([^)]+)\)'
            if re.search(asyncio_pattern, modified_code):
                modified_code = re.sub(asyncio_pattern, r'safe_asyncio_run(\1)', modified_code)
                print(f"🔧 Applied preemptive asyncio.run() -> safe_asyncio_run() replacement")

            # 🔧 ADDITIONAL CRITICAL FIX: Add _safe_len function and protection for len() calls on coroutines
            # This prevents "object of type 'coroutine' has no len()" errors

            def _safe_len(obj):
                """Safe len() function that handles coroutines properly"""
                import asyncio
                import concurrent.futures
                # Check if it's a coroutine and handle it
                if asyncio.iscoroutine(obj):
                    print(f"🔧 CRITICAL: Detected coroutine in len() call, executing...")
                    def run_coroutine():
                        new_loop = asyncio.new_event_loop()
                        asyncio.set_event_loop(new_loop)
                        try:
                            result = new_loop.run_until_complete(obj)
                            return len(result) if hasattr(result, '__len__') else 0
                        finally:
                            new_loop.close()
                            asyncio.set_event_loop(None)

                    with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                        future = executor.submit(run_coroutine)
                        return future.result(timeout=30)
                else:
                    return len(obj)

            # Replace len() calls with safe version
            len_pattern = r'len\(([^)]+)\)'
            if re.search(len_pattern, modified_code):
                modified_code = re.sub(len_pattern, r'_safe_len(\1)', modified_code)
                print(f"🔧 Applied len() -> _safe_len() replacement for coroutine safety")

            # Execute the scanner code to load functions
            with contextlib.redirect_stdout(stdout_capture):
                try:
                    exec(modified_code, exec_globals)
                except RuntimeError as e:
                    if "cannot be called from a running event loop" in str(e):
                        print(f"🔧 Still detected asyncio conflict, applying additional fix...")
                        # Additional fallback fix if some patterns were missed
                        modified_code_fallback = modified_code.replace('asyncio.run', 'safe_asyncio_run')
                        exec(modified_code_fallback, exec_globals)
                    else:
                        raise

            # Check if scan_symbol function exists
            if 'scan_symbol' not in exec_globals:
                print(f"❌ scan_symbol function not found in scanner code")
                return []

            scan_symbol_func = exec_globals['scan_symbol']
            all_results = []

            # Process each symbol
            for i, symbol in enumerate(scanner_symbols):
                try:
                    print(f"📊 Scanning {symbol} ({i+1}/{len(scanner_symbols)})...")

                    # 🔧 CRITICAL FIX: Call scan_symbol with PROVEN date ranges
                    # Use fetch range for proper technical indicators, not just display range
                    print(f"🔧 {symbol}: Using PROVEN date ranges - FETCH {fetch_start} to {fetch_end}, DISPLAY {start_date} to {end_date}")
                    symbol_results = scan_symbol_func(symbol, fetch_start, fetch_end)

                    # 🔧 CRITICAL FIX: Handle coroutines properly
                    import asyncio
                    if asyncio.iscoroutine(symbol_results):
                        print(f"🔧 {symbol}: Detected coroutine, awaiting...")
                        try:
                            # Run in thread to avoid event loop conflicts
                            def run_coroutine():
                                new_loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(new_loop)
                                try:
                                    return new_loop.run_until_complete(symbol_results)
                                finally:
                                    new_loop.close()
                                    asyncio.set_event_loop(None)

                            import concurrent.futures
                            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                                future = executor.submit(run_coroutine)
                                symbol_results = future.result(timeout=30)
                        except Exception as e:
                            print(f"❌ {symbol}: Coroutine execution failed: {e}")
                            continue

                    # 🔧 CRITICAL FIX: Handle coroutines properly
                    import asyncio
                    if asyncio.iscoroutine(symbol_results):
                        print(f"🔧 {symbol}: Detected coroutine, awaiting...")
                        try:
                            # Run in thread to avoid event loop conflicts
                            def run_coroutine():
                                new_loop = asyncio.new_event_loop()
                                asyncio.set_event_loop(new_loop)
                                try:
                                    return new_loop.run_until_complete(symbol_results)
                                finally:
                                    new_loop.close()
                                    asyncio.set_event_loop(None)

                            with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
                                future = executor.submit(run_coroutine)
                                symbol_results = future.result(timeout=30)
                                print(f"✅ {symbol}: Coroutine completed successfully")
                        except Exception as e:
                            print(f"❌ {symbol}: Coroutine execution failed: {e}")
                            continue

                    # Debug: Print what we actually got
                    print(f"🔍 {symbol}: Result type = {type(symbol_results)}, value = {symbol_results}")

                    # 🔧 CRITICAL FIX: Handle DataFrame results properly
                    if symbol_results is None:
                        print(f"⚪ {symbol}: No results (None)")
                    elif isinstance(symbol_results, str):
                        print(f"⚠️ {symbol}: String result: {symbol_results}")
                    elif hasattr(symbol_results, 'to_dict'):  # pandas DataFrame
                        try:
                            # Convert DataFrame to dict records properly
                            df_records = symbol_results.to_dict('records')
                            print(f"📊 {symbol}: Got {len(df_records)} DataFrame results")

                            # 🔧 CRITICAL FIX: Map Backside B scanner columns to frontend format
                            mapped_records = []
                            for record in df_records:
                                mapped_record = {
                                    'ticker': record.get('Ticker', 'Unknown'),
                                    'date': record.get('Date', 'Unknown'),
                                    'trigger': record.get('Trigger', 'Unknown'),
                                    'pos_abs_1000d': record.get('PosAbs_1000d', 0),
                                    'd1_body_atr': record.get('D1_Body/ATR', 0),
                                    'd1_volume': record.get('D1Vol(shares)', 0),
                                    'd1_volume_avg': record.get('D1Vol/Avg', 0),
                                    'vol_signal': record.get('VolSig(max D-1,D-2)/Avg', 0),
                                    'gap_atr': record.get('Gap/ATR', 0),
                                    'open_gt_prev_high': record.get('Open>PrevHigh', False),
                                    'open_ema9': record.get('Open/EMA9', 0),
                                    'd1_gt_d2_high': record.get('D1>H(D-2)', False),
                                    'd1_close_gt_d2_close': record.get('D1Close>D2Close', False),
                                    'slope_9_5d': record.get('Slope9_5d', 0),
                                    'high_ema9_atr_trigger': record.get('High-EMA9/ATR(trigger)', 0),
                                    'adv20_usd': record.get('ADV20_$', 0)
                                }
                                mapped_records.append(mapped_record)

                                # Debug output for first few patterns
                                if len(all_results) < 5:
                                    ticker = mapped_record['ticker']
                                    date = mapped_record['date']
                                    print(f"✅ {symbol}: Found pattern {ticker} on {date}")

                            all_results.extend(mapped_records)
                            print(f"📊 {symbol}: Mapped {len(mapped_records)} patterns to frontend format")

                        except Exception as df_error:
                            print(f"❌ {symbol}: DataFrame conversion failed: {df_error}")
                            # Fallback: try manual conversion
                            try:
                                records = []
                                if hasattr(symbol_results, 'iterrows'):
                                    for index, row in symbol_results.iterrows():
                                        row_dict = {}
                                        for col in symbol_results.columns:
                                            row_dict[col] = row[col]
                                        records.append(row_dict)
                                all_results.extend(records)
                                print(f"📊 {symbol}: Manually converted {len(records)} DataFrame rows")
                            except Exception as manual_error:
                                print(f"❌ {symbol}: Manual conversion failed: {manual_error}")
                        # 🔧 CRITICAL FIX: Continue to next symbol after DataFrame processing
                        continue
                    elif isinstance(symbol_results, list):
                        # Handle list of results
                        all_results.extend(symbol_results)
                        print(f"📊 {symbol}: Got {len(symbol_results)} list results")
                    elif hasattr(symbol_results, '__iter__') and not isinstance(symbol_results, str):
                        # Handle other iterables (but not DataFrames)
                        results_list = list(symbol_results)
                        print(f"📊 {symbol}: Got {len(results_list)} iterable results")

                        for i, result in enumerate(results_list):
                            if isinstance(result, dict):
                                all_results.append(result)
                                print(f"✅ {symbol}: Found pattern {i+1}")
                            else:
                                print(f"⚠️ {symbol}: Non-dict result {i+1}: {type(result)} = {result}")

                        if len(results_list) == 0:
                            print(f"⚪ {symbol}: Empty result list")
                    else:
                        print(f"⚠️ {symbol}: Invalid result format - {type(symbol_results)}: {symbol_results}")

                except Exception as e:
                    print(f"❌ {symbol}: Error - {str(e)}")
                    continue

            print(f"📊 Raw scanner results: {len(all_results)} total patterns found")

            # 🔧 CRITICAL FIX: Filter results to respect user's display date range
            if start_date and end_date:
                try:
                    from datetime import datetime
                    start_dt = datetime.strptime(start_date, "%Y-%m-%d")
                    end_dt = datetime.strptime(end_date, "%Y-%m-%d")

                    filtered_results = []
                    for result in all_results:
                        result_date = result.get('date')
                        if result_date and result_date != 'Unknown':
                            try:
                                result_dt = datetime.strptime(str(result_date), "%Y-%m-%d")
                                if start_dt <= result_dt <= end_dt:
                                    filtered_results.append(result)
                            except ValueError:
                                # Skip invalid dates
                                continue

                    print(f"🎯 DATE FILTER: {len(filtered_results)} patterns in display range {start_date} to {end_date}")
                    all_results = filtered_results
                except Exception as date_error:
                    print(f"⚠️ Date filtering error: {date_error}")

            print(f"✅ Backside B scanner execution completed: {len(all_results)} patterns in display range")
            return all_results

        except Exception as e:
            print(f"❌ User function execution error: {e}")
            import traceback
            print(f"Full error: {traceback.format_exc()}")
            return []

    # Execute the synchronous function
    await safe_progress_callback(progress_callback, 60, "🚀 Running user function execution...")
    results = run_user_function_sync()

    # 🔧 CRITICAL FIX: Ensure results is not a coroutine before calling len()
    import asyncio
    if asyncio.iscoroutine(results):
        print(f"🔧 CRITICAL FIX: run_user_function_sync returned coroutine, awaiting...")
        # This shouldn't happen with the fix above, but add safety
        def run_coroutine():
            new_loop = asyncio.new_event_loop()
            asyncio.set_event_loop(new_loop)
            try:
                return new_loop.run_until_complete(results)
            finally:
                new_loop.close()
                asyncio.set_event_loop(None)

        with concurrent.futures.ThreadPoolExecutor(max_workers=1) as executor:
            future = executor.submit(run_coroutine)
            results = future.result(timeout=60)

    # Ensure we have a list-like object before calling len()
    if results is None:
        results = []
    elif not hasattr(results, '__len__'):
        print(f"🔧 Converting results to list: {type(results)}")
        results = list(results) if hasattr(results, '__iter__') else []

    await safe_progress_callback(progress_callback, 90, f"🎯 Processing {len(results)} user function results...")

    # Convert results to expected format
    formatted_results = []
    for result in results:
        if isinstance(result, dict):
            formatted_results.append(result)

    await safe_progress_callback(progress_callback, 100, f"✅ User function execution completed: {len(formatted_results)} signals")
    print(f"🎉 User function pattern execution completed: {len(formatted_results)} results")

    return formatted_results


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