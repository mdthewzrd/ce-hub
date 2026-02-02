#!/usr/bin/env python3
"""
🔍 Debug Full Execution Pipeline Syntax Error
Test the complete execution path that includes smart infrastructure + runtime modifications
"""
import requests
import json
import ast
import re

def test_full_execution_pipeline():
    """Test the complete execution pipeline including all runtime modifications"""
    print("🔍 DEBUGGING FULL EXECUTION PIPELINE SYNTAX ERROR")
    print("Testing LC D2 scanner through complete execution path...")
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

    # Step 1: Format with smart infrastructure
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

        # Verify enhanced code syntax
        try:
            ast.parse(enhanced_code)
            print(f"✅ Enhanced code syntax is valid")
        except SyntaxError as e:
            print(f"❌ Enhanced code has syntax error: {e}")
            return False

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

    # Step 2: Apply runtime modifications (simulate the execution pipeline)
    print(f"\n🔧 Step 2: Applying runtime modifications...")

    try:
        # Simulate the runtime modifications from the logs:
        modified_code = enhanced_code

        # 1. Remove asyncio.run() calls
        print("   🔧 Removing asyncio.run() calls...")
        modified_code = re.sub(r'asyncio\.run\([^)]+\)', '# asyncio.run() removed', modified_code)

        # 2. Inject date range parameters
        print("   🔧 Injecting LC D2 date range...")
        date_injections = '''
# INJECTED DATE PARAMETERS
START_DATE = "2025-01-01"
END_DATE = "2025-11-08"
DATE = "2025-11-08"
DATES = ["2025-01-01", "2025-11-08"]
'''
        modified_code = date_injections + modified_code

        # 3. Replace datetime.today() calls
        print("   🔧 Replacing datetime.today() calls...")
        modified_code = re.sub(r'datetime\.today\(\)', 'datetime.date(2025, 11, 8)', modified_code)

        # 4. Add memory safety override
        print("   🔧 Adding memory safety override...")
        memory_safety = '''
# MEMORY SAFETY OVERRIDE
if 'DATES' in locals() and len(DATES) > 100:
    DATES = DATES[:100]  # Prevent memory crashes
'''
        modified_code = modified_code + memory_safety

        print(f"✅ Runtime modifications applied")
        print(f"   Final size: {len(modified_code):,} characters")

        # Test syntax of fully modified code
        print(f"\n🔍 Step 3: Syntax validation of fully modified code...")

        try:
            # Try to parse the fully modified code
            ast.parse(modified_code)
            print(f"✅ Fully modified code syntax is VALID")

            # If syntax is valid, test actual execution
            print(f"\n🔧 Step 4: Testing actual code execution...")

            try:
                # Try to compile and execute (safely)
                compiled_code = compile(modified_code, '<scanner>', 'exec')
                print(f"✅ Code compilation succeeded")

                # Don't actually execute to avoid side effects, but compilation success means syntax is good
                return True

            except SyntaxError as e:
                print(f"❌ Code compilation failed with syntax error:")
                print(f"   Line {e.lineno}: {e.msg}")
                if e.text:
                    print(f"   Text: {e.text.strip()}")

                # Get lines around the error
                lines = modified_code.split('\n')
                error_line = e.lineno - 1 if e.lineno else 0

                print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
                start = max(0, error_line - 5)
                end = min(len(lines), error_line + 6)

                for i in range(start, end):
                    marker = " >>> " if i == error_line else "     "
                    print(f"{marker}{i+1:4d}: {lines[i]}")

                return False

            except Exception as e:
                print(f"❌ Code compilation failed: {e}")
                return False

        except SyntaxError as e:
            print(f"❌ SYNTAX ERROR in fully modified code:")
            print(f"   Line {e.lineno}: {e.msg}")
            if e.text:
                print(f"   Text: {e.text.strip()}")

            # Get lines around the error
            lines = modified_code.split('\n')
            error_line = e.lineno - 1 if e.lineno else 0

            print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
            start = max(0, error_line - 5)
            end = min(len(lines), error_line + 6)

            for i in range(start, end):
                marker = " >>> " if i == error_line else "     "
                print(f"{marker}{i+1:4d}: {lines[i]}")

            # Save the problematic code for inspection
            debug_file = "/Users/michaeldurante/ai dev/ce-hub/debug_problematic_code.py"
            with open(debug_file, 'w') as f:
                f.write(modified_code)
            print(f"\n💾 Saved problematic code to: {debug_file}")

            return False

    except Exception as e:
        print(f"❌ Runtime modification error: {e}")
        return False

def main():
    """Debug full execution pipeline syntax error"""
    print("🔍 FULL EXECUTION PIPELINE SYNTAX ERROR DEBUG")
    print("Testing complete execution path: Smart Infrastructure + Runtime Modifications")

    success = test_full_execution_pipeline()

    print(f"\n{'='*80}")
    print("🎯 FULL EXECUTION PIPELINE DEBUG RESULTS")
    print('='*80)

    if success:
        print("✅ Full execution pipeline is working correctly!")
        print("   The syntax error must be happening elsewhere in the system")
        print("   Need to investigate the actual runtime execution code")
    else:
        print("❌ Found syntax error in full execution pipeline")
        print("🔧 The issue is in the runtime modifications, not smart infrastructure")
        print("   Check the debug_problematic_code.py file for analysis")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)