#!/usr/bin/env python3
"""
🔍 Comprehensive Syntax Error Debug
Find ALL syntax errors in the processed LC D2 scanner code
"""
import requests
import json
import ast

def comprehensive_syntax_debug():
    """Test to find all syntax errors in the processed code"""
    print("🔍 COMPREHENSIVE SYNTAX ERROR DEBUG")
    print("Finding ALL syntax errors in the processed LC D2 scanner...")
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

        # Check if enhanced code has syntax errors BEFORE runtime modifications
        print(f"\n🔍 Testing enhanced code syntax BEFORE runtime modifications...")
        try:
            ast.parse(enhanced_code)
            print(f"✅ Enhanced code syntax is VALID before runtime modifications")
        except SyntaxError as e:
            print(f"❌ SYNTAX ERROR in enhanced code BEFORE runtime modifications:")
            print(f"   Line {e.lineno}: {e.msg}")
            if e.text:
                print(f"   Text: {e.text.strip()}")

            # Save problematic enhanced code
            debug_file = "/Users/michaeldurante/ai dev/ce-hub/debug_enhanced_code_syntax.py"
            with open(debug_file, 'w') as f:
                f.write(enhanced_code)
            print(f"   💾 Saved problematic enhanced code to: {debug_file}")

            # Get lines around the error
            lines = enhanced_code.split('\n')
            error_line = e.lineno - 1 if e.lineno else 0

            print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
            start = max(0, error_line - 10)
            end = min(len(lines), error_line + 11)

            for i in range(start, end):
                marker = " >>> " if i == error_line else "     "
                print(f"{marker}{i+1:4d}: {lines[i]}")

            return False

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

    # Step 2: Test the full execution pipeline through the API
    print(f"\n🔧 Step 2: Testing full execution pipeline through API...")

    execute_url = "http://localhost:8000/api/scan/execute"
    execute_payload = {
        "scanner_type": "uploaded",
        "uploaded_code": scanner_code,
        "start_date": "2024-11-01",
        "end_date": "2024-11-07"
    }

    try:
        # Execute and immediately check for recent execution logs
        execute_response = requests.post(execute_url, json=execute_payload, timeout=30)

        if execute_response.status_code != 200:
            print(f"❌ Execution failed: {execute_response.status_code}")
            return False

        execute_result = execute_response.json()
        scan_id = execute_result.get('scan_id')
        print(f"✅ Scanner execution started: {scan_id}")

        # Wait a moment then check the latest processed code that caused errors
        import time
        time.sleep(2)

        # Check if there's a debug file created during execution
        import glob
        debug_files = glob.glob("/Users/michaeldurante/ai dev/ce-hub/debug_*_error.py")
        debug_files.sort(key=lambda x: -os.path.getmtime(x))  # Most recent first

        if debug_files:
            latest_debug = debug_files[0]
            print(f"\n🔍 Found recent debug file: {latest_debug}")

            # Load and analyze the debug file
            with open(latest_debug, 'r') as f:
                debug_code = f.read()

            print(f"   Debug file size: {len(debug_code):,} characters")

            # Test syntax of debug file
            try:
                ast.parse(debug_code)
                print(f"   ✅ Debug file syntax is actually VALID!")
            except SyntaxError as e:
                print(f"   ❌ SYNTAX ERROR in debug file:")
                print(f"      Line {e.lineno}: {e.msg}")
                if e.text:
                    print(f"      Text: {e.text.strip()}")

                # Show context around error
                lines = debug_code.split('\n')
                error_line = e.lineno - 1 if e.lineno else 0

                print(f"\n   🔍 CONTEXT around line {e.lineno}:")
                start = max(0, error_line - 5)
                end = min(len(lines), error_line + 6)

                for i in range(start, end):
                    marker = "   >>> " if i == error_line else "       "
                    print(f"{marker}{i+1:4d}: {lines[i]}")

        return True

    except Exception as e:
        print(f"❌ API execution test error: {e}")
        return False

def main():
    """Comprehensive syntax error debug"""
    print("🔍 COMPREHENSIVE SYNTAX ERROR DEBUG")
    print("Finding all syntax issues preventing LC D2 scanner from working")

    success = comprehensive_syntax_debug()

    print(f"\n{'='*80}")
    print("🎯 COMPREHENSIVE DEBUG RESULTS")
    print('='*80)

    if success:
        print("📊 Debug analysis completed")
    else:
        print("❌ Critical syntax errors found")

    return success

if __name__ == "__main__":
    import os
    success = main()
    exit(0 if success else 1)