#!/usr/bin/env python3
"""
🔍 Test Exact Runtime Processing from uploaded_scanner_bypass.py
Replicate the exact sequence that's causing the syntax error at line 1561
"""
import requests
import json
import ast
import re

def test_exact_runtime_processing():
    """Test the exact runtime processing from uploaded_scanner_bypass.py"""
    print("🔍 TESTING EXACT RUNTIME PROCESSING")
    print("Replicating uploaded_scanner_bypass.py processing sequence...")
    print("=" * 80)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Step 1: Smart infrastructure formatting (same as before)
    format_url = "http://localhost:8000/api/format/code"
    format_payload = {"code": scanner_code}

    print(f"\n🔧 Step 1: Smart infrastructure formatting...")

    try:
        format_response = requests.post(format_url, json=format_payload, timeout=60)
        if format_response.status_code != 200:
            print(f"❌ Formatting failed: {format_response.status_code}")
            return False

        format_result = format_response.json()
        if not format_result.get('success'):
            print(f"❌ Smart formatting failed: {format_result.get('message', 'Unknown error')}")
            return False

        processed_code = format_result.get('formatted_code', '')
        print(f"✅ Smart infrastructure formatting succeeded!")
        print(f"   Enhanced size: {len(processed_code):,} characters")

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

    # Step 2: EXACT runtime processing from uploaded_scanner_bypass.py
    print(f"\n🔧 Step 2: Exact runtime processing from uploaded_scanner_bypass.py...")

    try:
        start_date = "2025-01-01"
        end_date = "2025-11-08"

        # 2.1: Remove asyncio.run() calls (exact logic from line 101-108)
        print("   🔧 Removing asyncio.run() calls...")
        lines = processed_code.split('\n')
        cleaned_lines = []
        for line in lines:
            if 'asyncio.run(' not in line:
                cleaned_lines.append(line)
            else:
                print(f"   🔧 Skipped: {line.strip()[:60]}...")
        processed_code = '\n'.join(cleaned_lines)

        # 2.2: Inject LC D2 date range (exact logic from line 115-152)
        print(f"   🎯 Injecting LC D2 date range: {start_date} to {end_date}")

        # Replace DATES list/array patterns
        dates_patterns = [
            r'DATES\s*=\s*\[[^\]]*\]',
            r'dates\s*=\s*\[[^\]]*\]',
            r'DATE_RANGE\s*=\s*\[[^\]]*\]'
        ]
        for pattern in dates_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f'DATES = ["{start_date}", "{end_date}"]', processed_code)
                print(f"   🔧 Injected DATES array: {start_date} to {end_date}")

        # Replace START_DATE patterns
        start_patterns = [
            r"START_DATE\s*=\s*['\"][^'\"]*['\"]",
            r"start_date\s*=\s*['\"][^'\"]*['\"]"
        ]
        for pattern in start_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f"START_DATE = '{start_date}'", processed_code)
                print(f"   🔧 Injected START_DATE: {start_date}")

        # Replace END_DATE patterns
        end_patterns = [
            r"END_DATE\s*=\s*['\"][^'\"]*['\"]",
            r"end_date\s*=\s*['\"][^'\"]*['\"]"
        ]
        for pattern in end_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f"END_DATE = '{end_date}'", processed_code)
                print(f"   🔧 Injected END_DATE: {end_date}")

        # Replace DATE variable patterns
        date_patterns = [
            r"DATE\s*=\s*['\"][^'\"]*['\"]"
        ]
        for pattern in date_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f"DATE = '{end_date}'", processed_code)
                print(f"   🔧 Injected DATE variable: {end_date}")

        # 2.3: Add memory safety override (exact logic from line 158-248)
        print(f"   🧠 Adding memory-safe date range override...")

        # EXACT memory safety override from uploaded_scanner_bypass.py
        memory_safe_override = '''
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
                print(f"⚠️  MEMORY SAFETY: {total_days} days would create 7M+ rows → system crash")
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
                else:
                    DATES = [START_DATE, END_DATE]
                    print(f"🧠 No NYSE calendar - using basic DATES: {DATES}")

                return True
            else:
                print(f"✅ Date range is safe: {total_days} days")
                return False

    except Exception as e:
        print(f"⚠️  Memory safety check error: {e}")
        # Emergency fallback to 2-day range
        import datetime
        end_date = datetime.datetime.now().strftime('%Y-%m-%d')
        start_date = (datetime.datetime.now() - datetime.timedelta(days=2)).strftime('%Y-%m-%d')

        globals()['START_DATE'] = start_date
        globals()['END_DATE'] = end_date
        globals()['start_date_300_days_before'] = start_date
        globals()['DATES'] = [start_date, end_date]

        print(f"🚨 Emergency safe mode: {start_date} to {end_date}")
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

        # Inject memory safety code (simulating the exact logic from lines 238-250)
        main_call_pattern = r'(if __name__ == "__main__":.*?)(\s*asyncio\.run\(main\(\)\))'
        if re.search(main_call_pattern, processed_code, re.DOTALL):
            # Insert memory safety before asyncio.run(main())
            processed_code = re.sub(
                r'(if __name__ == "__main__":.*?)(\s*asyncio\.run\(main\(\)\))',
                r'\1\n' + memory_safe_override + '\n    apply_memory_safe_date_limits()\n\2',
                processed_code,
                flags=re.DOTALL
            )
            print(f"   ✅ Memory safety override injected before main() execution")
        else:
            # Fallback: add at the end
            processed_code = processed_code + '\n' + memory_safe_override + '\napply_memory_safe_date_limits()\n'
            print(f"   ✅ Memory safety override added at end")

        # 2.4: Replace datetime.today() patterns (exact logic from lines 252-259)
        print(f"   🔧 Replacing datetime.today() calls...")
        datetime_patterns = [
            r"datetime\.today\(\)\.strftime\(['\"][^'\"]*['\"]\)",
            r"datetime\.now\(\)\.strftime\(['\"][^'\"]*['\"]\)"
        ]
        for pattern in datetime_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f'"{end_date}"', processed_code)
                print(f"   🔧 Replaced datetime.today() with: {end_date}")

        # 2.5: Fix API keys for LC scanners (exact logic from lines 262-270)
        print(f"   🔧 Updating API keys...")
        working_api_key = "4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy"
        api_patterns = [
            r'API_KEY\s*=\s*["\'][^"\']*["\']',
            r'api_key\s*=\s*["\'][^"\']*["\']'
        ]
        for pattern in api_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f'API_KEY = "{working_api_key}"', processed_code)
                print(f"   🔧 Updated API key for LC scanner")

        print(f"✅ Exact runtime processing completed")
        print(f"   Final size: {len(processed_code):,} characters")

        # Step 3: Test syntax of fully processed code (this is where the error happens)
        print(f"\n🔍 Step 3: Syntax validation (THIS IS WHERE THE ERROR OCCURS)...")

        try:
            # This is the exact line from uploaded_scanner_bypass.py:275 that fails
            ast.parse(processed_code)
            print(f"✅ Fully processed code syntax is VALID")
            return True

        except SyntaxError as e:
            print(f"❌ SYNTAX ERROR (exactly like line 1561 error):")
            print(f"   Line {e.lineno}: {e.msg}")
            if e.text:
                print(f"   Text: {e.text.strip()}")

            # Get lines around the error to identify the problem
            lines = processed_code.split('\n')
            error_line = e.lineno - 1 if e.lineno else 0

            print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
            start = max(0, error_line - 5)
            end = min(len(lines), error_line + 6)

            for i in range(start, end):
                marker = " >>> " if i == error_line else "     "
                print(f"{marker}{i+1:4d}: {lines[i]}")

            # Save the problematic code for detailed analysis
            debug_file = "/Users/michaeldurante/ai dev/ce-hub/debug_exact_runtime_error.py"
            with open(debug_file, 'w') as f:
                f.write(processed_code)
            print(f"\n💾 Saved problematic code to: {debug_file}")

            return False

    except Exception as e:
        print(f"❌ Exact runtime processing error: {e}")
        return False

def main():
    """Test exact runtime processing to identify syntax error"""
    print("🔍 EXACT RUNTIME PROCESSING SYNTAX ERROR DEBUG")
    print("Replicating uploaded_scanner_bypass.py processing sequence")

    success = test_exact_runtime_processing()

    print(f"\n{'='*80}")
    print("🎯 EXACT RUNTIME PROCESSING DEBUG RESULTS")
    print('='*80)

    if success:
        print("✅ Exact runtime processing is working correctly!")
        print("   The syntax error must be coming from a different source")
    else:
        print("❌ Found the exact syntax error source!")
        print("🔧 The issue is in the runtime processing of uploaded_scanner_bypass.py")
        print("   Check the debug_exact_runtime_error.py file for analysis")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)