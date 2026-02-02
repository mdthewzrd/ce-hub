#!/usr/bin/env python3
"""
🔍 Debug Exact Line 1561 Syntax Error
Test the exact processing pipeline to identify what's causing the syntax error at line 1561
"""
import requests
import json
import ast

def test_line_1561_debug():
    """Test to identify the exact syntax error at line 1561"""
    print("🔍 DEBUGGING EXACT LINE 1561 SYNTAX ERROR")
    print("Replicating the exact processing pipeline from uploaded_scanner_bypass.py")
    print("=" * 80)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Step 1: Format with smart infrastructure first
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

        enhanced_code = format_result.get('formatted_code', '')
        print(f"✅ Smart infrastructure formatting succeeded!")
        print(f"   Enhanced size: {len(enhanced_code):,} characters")

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

    # Step 2: Apply the exact runtime modifications that uploaded_scanner_bypass.py does
    print(f"\n🔧 Step 2: Applying uploaded_scanner_bypass.py modifications...")

    try:
        # Replicate the exact sequence from uploaded_scanner_bypass.py
        processed_code = enhanced_code
        start_date = "2025-01-01"
        end_date = "2025-11-08"

        # 2.1: Remove asyncio.run() calls (using the EXACT logic from the file)
        print("   🔧 Removing asyncio.run() calls...")
        if 'asyncio.run(' in processed_code:
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
                    print(f"   🔧 Skipped standalone: {line.strip()[:60]}...")
                # Preserve wrapper function calls (return asyncio.run(...))
                elif 'return asyncio.run(' in line:
                    print(f"   🔧 Preserved wrapper: {line.strip()[:60]}...")
                    cleaned_lines.append(line)
                # Preserve other asyncio.run calls in functions
                elif 'asyncio.run(' in line and ('def ' in line or 'return' in line or line.strip().startswith('result = ')):
                    print(f"   🔧 Preserved function call: {line.strip()[:60]}...")
                    cleaned_lines.append(line)
                # Skip other standalone asyncio.run calls
                elif line.strip().startswith('asyncio.run('):
                    print(f"   🔧 Skipped standalone: {line.strip()[:60]}...")
                else:
                    cleaned_lines.append(line)
            processed_code = '\n'.join(cleaned_lines)

        # 2.2: Inject LC D2 date range
        print(f"   🎯 Injecting LC D2 date range: {start_date} to {end_date}")

        # Replace DATES list/array patterns
        import re
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

        # 2.3: Add memory safety override
        print(f"   🧠 Adding memory-safe date range override...")

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

        # Inject memory safety code at the end
        processed_code = processed_code + '\n' + memory_safe_override + '\napply_memory_safe_date_limits()\n'
        print(f"   ✅ Memory safety override added at end")

        # 2.4: Replace datetime.today() patterns
        print(f"   🔧 Replacing datetime.today() calls...")
        datetime_patterns = [
            r"datetime\.today\(\)\.strftime\(['\"][^'\"]*['\"][,\)]",
            r"datetime\.now\(\)\.strftime\(['\"][^'\"]*['\"][,\)]"
        ]
        for pattern in datetime_patterns:
            if re.search(pattern, processed_code):
                processed_code = re.sub(pattern, f'"{end_date}"', processed_code)
                print(f"   🔧 Replaced datetime.today() with: {end_date}")

        # 2.5: Fix API keys for LC scanners
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

        print(f"✅ Runtime modifications applied")
        print(f"   Final size: {len(processed_code):,} characters")

        # Step 3: Test syntax of fully processed code
        print(f"\n🔍 Step 3: Syntax validation of fully processed code...")

        try:
            # This is where the error happens - let's see exactly what's wrong
            ast.parse(processed_code)
            print(f"✅ Fully processed code syntax is VALID")
            return True

        except SyntaxError as e:
            print(f"❌ SYNTAX ERROR at line {e.lineno}: {e.msg}")
            if e.text:
                print(f"   Text: {e.text.strip()}")

            # Get lines around the error to identify the problem
            lines = processed_code.split('\n')
            error_line = e.lineno - 1 if e.lineno else 0

            print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
            start = max(0, error_line - 10)
            end = min(len(lines), error_line + 11)

            for i in range(start, end):
                marker = " >>> " if i == error_line else "     "
                print(f"{marker}{i+1:4d}: {lines[i]}")

            # Save the problematic code for analysis
            debug_file = "/Users/michaeldurante/ai dev/ce-hub/debug_line_1561_error.py"
            with open(debug_file, 'w') as f:
                f.write(processed_code)
            print(f"\n💾 Saved problematic code to: {debug_file}")

            return False

    except Exception as e:
        print(f"❌ Runtime modification error: {e}")
        return False

def main():
    """Debug line 1561 syntax error"""
    print("🔍 LINE 1561 SYNTAX ERROR DEBUG")
    print("Finding the exact cause of syntax error at line 1561")

    success = test_line_1561_debug()

    print(f"\n{'='*80}")
    print("🎯 LINE 1561 DEBUG RESULTS")
    print('='*80)

    if success:
        print("✅ No syntax error found - the issue must be elsewhere")
    else:
        print("❌ Found syntax error at line 1561")
        print("🔧 Check debug_line_1561_error.py for detailed analysis")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)