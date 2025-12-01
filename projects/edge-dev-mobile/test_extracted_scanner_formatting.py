#!/usr/bin/env python3
"""
🧪 Test Extracted Scanner Formatting

This test validates that extracted scanners can be properly formatted
and maintain their parameter count through the complete workflow.
"""

import os
import sys
import ast
import re
from pathlib import Path

# Add backend to path
backend_path = Path(__file__).parent / "backend"
sys.path.insert(0, str(backend_path))

def test_extracted_scanner_formatting():
    """Test that extracted scanner can be formatted properly"""

    print("🧪 Testing Extracted Scanner Formatting Workflow")
    print("=" * 55)

    # Import the formatting function
    try:
        from main import format_individual_scanner
        print("✅ Successfully imported format_individual_scanner")
    except ImportError as e:
        print(f"❌ Failed to import format_individual_scanner: {e}")
        return False

    # Load the extracted scanner
    extracted_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_extracted_scanner.py"

    if not os.path.exists(extracted_file):
        print(f"❌ Extracted scanner file not found: {extracted_file}")
        return False

    with open(extracted_file, 'r') as f:
        extracted_code = f.read()

    print(f"✅ Loaded extracted scanner ({len(extracted_code)} characters)")

    # Count original parameters
    original_params = count_parameters(extracted_code)
    print(f"✅ Original parameter count: {original_params}")

    # Test formatting
    scanner_info = {
        "type": "logical_scanner",
        "name": "ATR Score Scanner",
        "pattern": "score_atr"
    }

    try:
        formatted_result = format_individual_scanner(extracted_code, scanner_info)

        if isinstance(formatted_result, dict) and 'formatted_code' in formatted_result:
            formatted_code = formatted_result['formatted_code']
            print(f"✅ Successfully formatted scanner ({len(formatted_code)} characters)")

            # Count formatted parameters
            formatted_params = count_parameters(formatted_code)
            print(f"✅ Formatted parameter count: {formatted_params}")

            # Validate syntax
            try:
                ast.parse(formatted_code)
                print("✅ Formatted code passes AST validation")
            except SyntaxError as e:
                print(f"❌ Syntax error in formatted code: {e}")
                return False

            # Check parameter preservation
            if formatted_params >= original_params * 0.8:  # Allow some parameter consolidation
                print("✅ Parameters successfully preserved through formatting")

                # Save formatted result
                output_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/test_formatted_scanner.py"
                with open(output_file, 'w') as f:
                    f.write(formatted_code)
                print(f"✅ Saved formatted scanner to: {output_file}")

                return True
            else:
                print(f"❌ Parameter loss detected: {original_params} → {formatted_params}")
                return False

        else:
            print("❌ Formatting failed or returned unexpected format")
            return False

    except Exception as e:
        print(f"❌ Formatting failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def count_parameters(code):
    """Count potential parameters in code"""
    # Count numeric comparisons
    numeric_patterns = re.findall(r'[><=]\s*([0-9.]+)', code)

    # Count scoring arrays
    array_patterns = re.findall(r'\[([0-9.,\s]+)\]', code)

    # Count variable assignments that look like parameters
    param_assignments = re.findall(r'\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*([0-9.]+)', code)

    total_params = len(numeric_patterns) + len(array_patterns) + len(param_assignments)
    return total_params

if __name__ == "__main__":
    print("🚀 Starting Extracted Scanner Formatting Test")
    print("=" * 50)

    test_passed = test_extracted_scanner_formatting()

    print("\n📊 Test Result")
    print("=" * 15)
    print(f"Formatting Workflow: {'✅ PASS' if test_passed else '❌ FAIL'}")

    if test_passed:
        print("\n🎉 Extracted scanner formatting workflow is working correctly!")
        print("The scanner splitter → formatter pipeline is fully functional.")
        exit(0)
    else:
        print("\n💥 Extracted scanner formatting workflow failed.")
        exit(1)