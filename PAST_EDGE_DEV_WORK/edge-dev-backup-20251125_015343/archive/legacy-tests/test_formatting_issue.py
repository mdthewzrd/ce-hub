#!/usr/bin/env python3
"""
🔧 Test the formatting issue that's causing syntax errors
"""

import requests
import json

# Read the user's sophisticated scanner
scanner_file = "/Users/michaeldurante/Downloads/backside para b copy.py"
with open(scanner_file, 'r') as f:
    original_code = f.read()

print("🔧 TESTING CODE FORMATTING ISSUE")
print("=" * 50)
print(f"📄 Original code length: {len(original_code)} characters")

# Test the formatting endpoint
FORMAT_URL = "http://localhost:8000/api/format/code"

format_request = {
    "code": original_code,
    "options": {"preserve_integrity": True}
}

print(f"\n🎯 Testing formatting endpoint...")
format_response = requests.post(FORMAT_URL, json=format_request)

if format_response.status_code == 200:
    format_result = format_response.json()
    formatted_code = format_result['formatted_code']

    print(f"✅ Formatting successful")
    print(f"📊 Scanner type: {format_result['scanner_type']}")
    print(f"🔒 Integrity verified: {format_result['integrity_verified']}")
    print(f"📄 Formatted code length: {len(formatted_code)} characters")

    # Check for syntax errors in formatted code
    print(f"\n🔍 Checking formatted code syntax...")
    try:
        compile(formatted_code, '<formatted_code>', 'exec')
        print(f"✅ Formatted code syntax is valid")
    except SyntaxError as e:
        print(f"❌ SYNTAX ERROR in formatted code:")
        print(f"   Line {e.lineno}: {e.text}")
        print(f"   Error: {e.msg}")

        # Show the problematic area
        lines = formatted_code.split('\n')
        start_line = max(0, e.lineno - 5)
        end_line = min(len(lines), e.lineno + 5)

        print(f"\n📄 Context around line {e.lineno}:")
        for i in range(start_line, end_line):
            marker = ">>> " if i == e.lineno - 1 else "    "
            print(f"{marker}{i+1:3d}: {lines[i]}")

        # Compare with original code around the same area
        original_lines = original_code.split('\n')
        if e.lineno <= len(original_lines):
            print(f"\n📄 Original code around line {e.lineno}:")
            for i in range(start_line, end_line):
                if i < len(original_lines):
                    marker = ">>> " if i == e.lineno - 1 else "    "
                    print(f"{marker}{i+1:3d}: {original_lines[i]}")

        print(f"\n🔍 Checking if this is a formatting corruption...")
        # Save both versions for inspection
        with open('/tmp/original_code.py', 'w') as f:
            f.write(original_code)
        with open('/tmp/formatted_code.py', 'w') as f:
            f.write(formatted_code)
        print(f"💾 Saved files for inspection:")
        print(f"   Original: /tmp/original_code.py")
        print(f"   Formatted: /tmp/formatted_code.py")

else:
    print(f"❌ Formatting failed: {format_response.status_code}")
    print(f"Error: {format_response.text}")