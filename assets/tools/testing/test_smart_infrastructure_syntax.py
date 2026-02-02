#!/usr/bin/env python3
"""
🔍 Test Smart Infrastructure Syntax Issues
Debug the smart infrastructure formatting to find syntax errors
"""
import requests
import json
import ast

def test_smart_infrastructure_syntax():
    """Test smart infrastructure formatting for syntax issues"""
    print("🔍 TESTING SMART INFRASTRUCTURE SYNTAX")
    print("Checking if smart infrastructure is introducing syntax errors...")
    print("=" * 80)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    try:
        with open(scanner_path, 'r') as f:
            original_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(original_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Test original scanner syntax
    print(f"\n🔍 Testing ORIGINAL scanner syntax...")
    try:
        ast.parse(original_code)
        print(f"✅ Original scanner syntax is VALID")
    except SyntaxError as e:
        print(f"❌ ORIGINAL scanner has syntax error: {e}")
        return False

    # Test smart infrastructure formatting
    format_url = "http://localhost:8000/api/format/code"
    format_payload = {"code": original_code}

    print(f"\n🔧 Testing smart infrastructure formatting...")

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

        # Test enhanced code syntax
        print(f"\n🔍 Testing ENHANCED code syntax...")
        try:
            ast.parse(enhanced_code)
            print(f"✅ Enhanced code syntax is VALID")
            print(f"   ✅ Smart infrastructure is NOT causing syntax errors")
            return True
        except SyntaxError as e:
            print(f"❌ ENHANCED code has syntax error:")
            print(f"   Line {e.lineno}: {e.msg}")
            if e.text:
                print(f"   Text: {e.text.strip()}")

            # Save problematic enhanced code for analysis
            debug_file = "/Users/michaeldurante/ai dev/ce-hub/debug_smart_infrastructure_syntax.py"
            with open(debug_file, 'w') as f:
                f.write(enhanced_code)
            print(f"\n💾 Saved problematic enhanced code to: {debug_file}")

            # Show context around error
            lines = enhanced_code.split('\n')
            error_line = e.lineno - 1 if e.lineno else 0

            print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
            start = max(0, error_line - 10)
            end = min(len(lines), error_line + 11)

            for i in range(start, end):
                marker = " >>> " if i == error_line else "     "
                print(f"{marker}{i+1:4d}: {lines[i]}")

            print(f"\n🔧 SMART INFRASTRUCTURE IS INTRODUCING SYNTAX ERRORS!")
            return False

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

def main():
    """Test smart infrastructure syntax"""
    print("🔍 SMART INFRASTRUCTURE SYNTAX TEST")
    print("Isolating whether smart infrastructure is causing syntax issues")

    success = test_smart_infrastructure_syntax()

    print(f"\n{'='*80}")
    print("🎯 SMART INFRASTRUCTURE SYNTAX RESULTS")
    print('='*80)

    if success:
        print("✅ Smart infrastructure is working correctly")
        print("   The syntax errors must be coming from runtime processing")
    else:
        print("❌ Smart infrastructure is introducing syntax errors")
        print("   Need to fix the smart infrastructure formatter")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)