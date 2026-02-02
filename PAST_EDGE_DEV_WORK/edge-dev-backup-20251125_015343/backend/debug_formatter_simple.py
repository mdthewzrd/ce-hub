#!/usr/bin/env python3
"""
Simple debug test using the main format function
"""

import sys
import os
import traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_format_function():
    """
    Test the main format_sophisticated_code function
    """
    try:
        from core.enhanced_code_formatter import format_sophisticated_code

        # Read the backside scanner file
        reference_file = "/Users/michaeldurante/Downloads/backside para b copy.py"

        print("📁 Reading file...")
        with open(reference_file, 'r') as f:
            original_code = f.read()

        print(f"📊 File length: {len(original_code):,} characters")
        print("🔥 Testing format_sophisticated_code function...")

        enhanced_code = format_sophisticated_code(original_code)
        print(f"📊 Enhanced code length: {len(enhanced_code):,} characters")

        print("✅ Format function completed successfully!")

        # Save output
        with open("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/formatted_backside_scanner.py", 'w') as f:
            f.write(enhanced_code)

        print("💾 Formatted scanner saved to formatted_backside_scanner.py")

        return True

    except Exception as e:
        print(f"❌ Error during format: {e}")
        print("📋 Full traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🧪 Testing Format Sophisticated Code Function")
    print("=" * 55)
    test_format_function()