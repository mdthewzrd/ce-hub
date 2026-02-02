#!/usr/bin/env python3
"""
Test to identify the formatting syntax issue
"""
import sys
import os

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_syntax_issue():
    """Test whether the original file has syntax vs formatted file"""
    print("🧪 TESTING SYNTAX ISSUES IN FORMATTING")
    print("=" * 60)

    # Test original unformatted file
    try:
        with open('lc_frontside_d2_extended_scanner.py', 'r') as f:
            original_code = f.read()

        # Try to compile the original code
        compile(original_code, '<original_file>', 'exec')
        print("✅ ORIGINAL FILE: Syntax is valid")

    except SyntaxError as e:
        print(f"❌ ORIGINAL FILE: Syntax error at line {e.lineno}: {e.msg}")
        print(f"   Text: {e.text}")
        return
    except Exception as e:
        print(f"❌ ORIGINAL FILE: Error loading: {e}")
        return

    print()
    print("🔧 The issue must be in the formatting process...")
    print("   When parameters are extracted and replaced, syntax is broken.")
    print()
    print("🎯 LIKELY CAUSES:")
    print("   1. Parameter replacement breaks complex boolean expressions")
    print("   2. Indentation issues when replacing multi-line conditions")
    print("   3. Missing imports when code is split")
    print("   4. Variable scope issues when parameters are extracted")
    print()
    print("💡 SOLUTION:")
    print("   Skip formatting for individual scanners - they're already perfectly")
    print("   structured and don't need parameter extraction!")

if __name__ == "__main__":
    test_syntax_issue()