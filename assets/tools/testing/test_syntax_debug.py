#!/usr/bin/env python3
"""
🔍 Debug Smart Infrastructure Syntax Error
Test the smart infrastructure formatter and check for syntax errors in the generated code
"""
import requests
import json
import ast

def test_syntax_error_debug():
    """Test the smart infrastructure formatter and validate syntax"""
    print("🔍 DEBUGGING SMART INFRASTRUCTURE SYNTAX ERROR")
    print("Testing LC D2 scanner formatting for syntax issues...")
    print("=" * 70)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Test formatting with smart infrastructure
    format_url = "http://localhost:8000/api/format/code"
    format_payload = {
        "code": scanner_code
    }

    print(f"\n🔧 Testing smart infrastructure formatting...")

    try:
        format_response = requests.post(format_url, json=format_payload, timeout=60)

        if format_response.status_code != 200:
            print(f"❌ Formatting failed: {format_response.status_code}")
            print(f"Response: {format_response.text}")
            return False

        format_result = format_response.json()

        if format_result.get('success'):
            formatted_code = format_result.get('formatted_code', '')
            print(f"✅ Smart formatting succeeded!")
            print(f"   Original size: {len(scanner_code):,} characters")
            print(f"   Enhanced size: {len(formatted_code):,} characters")

            # Syntax validation of enhanced code
            print(f"\n🔍 SYNTAX VALIDATION:")
            try:
                ast.parse(formatted_code)
                print(f"   ✅ Enhanced code syntax is VALID")
                return True
            except SyntaxError as e:
                print(f"   ❌ SYNTAX ERROR in enhanced code:")
                print(f"      Line {e.lineno}: {e.msg}")
                print(f"      Text: {e.text.strip() if e.text else 'N/A'}")

                # Get lines around the error
                lines = formatted_code.split('\n')
                error_line = e.lineno - 1 if e.lineno else 0

                print(f"\n🔍 CODE CONTEXT around line {e.lineno}:")
                start = max(0, error_line - 3)
                end = min(len(lines), error_line + 4)

                for i in range(start, end):
                    marker = " >>> " if i == error_line else "     "
                    print(f"{marker}{i+1:4d}: {lines[i]}")

                return False

        else:
            print(f"❌ Smart formatting failed: {format_result.get('message', 'Unknown error')}")
            return False

    except Exception as e:
        print(f"❌ Formatting test error: {e}")
        return False

def main():
    """Debug syntax error in smart infrastructure"""
    print("🔍 SMART INFRASTRUCTURE SYNTAX ERROR DEBUG")
    print("Finding and fixing syntax issues in enhanced code")

    success = test_syntax_error_debug()

    print(f"\n{'='*70}")
    print("🎯 SYNTAX ERROR DEBUG RESULTS")
    print('='*70)

    if success:
        print("✅ Enhanced code syntax is valid!")
        print("   The smart infrastructure is generating syntactically correct code")
    else:
        print("❌ Found syntax error in enhanced code")
        print("🔧 Need to fix smart infrastructure code generation")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)