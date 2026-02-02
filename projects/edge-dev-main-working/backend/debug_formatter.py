#!/usr/bin/env python3
"""
Debug the formatter issue
"""

import sys
import os
import traceback
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def debug_formatter():
    """
    Debug the sophisticated formatter
    """
    try:
        from core.enhanced_code_formatter import SophisticatedCodePreservationFormatter

        # Read the backside scanner file
        reference_file = "/Users/michaeldurante/Downloads/backside para b copy.py"

        print("📁 Reading file...")
        with open(reference_file, 'r') as f:
            original_code = f.read()

        print(f"📊 File length: {len(original_code):,} characters")
        print("🔍 Creating formatter instance...")

        formatter = SophisticatedCodePreservationFormatter()

        print("🔍 Detecting scanner type...")
        scanner_type = formatter.detect_scanner_type(original_code)
        print(f"🎯 Detected scanner type: {scanner_type}")
        print(f"🎯 Scanner characteristics: {formatter.scanner_characteristics}")

        print("🔍 Extracting sophisticated logic...")
        preserved_components = formatter.extract_sophisticated_logic(original_code)
        print(f"📊 Extracted {len(preserved_components)} components")

        print("🔍 Creating infrastructure wrapper...")
        enhanced_code = formatter.create_infrastructure_wrapper(preserved_components, original_code)
        print(f"📊 Enhanced code length: {len(enhanced_code):,} characters")

        print("✅ Formatter debug completed successfully!")

        # Save debug output
        with open("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/debug_output.py", 'w') as f:
            f.write(enhanced_code)

        print("💾 Debug output saved to debug_output.py")

        return True

    except Exception as e:
        print(f"❌ Error during debug: {e}")
        print("📋 Full traceback:")
        traceback.print_exc()
        return False

if __name__ == "__main__":
    print("🐛 Debugging Sophisticated Formatter")
    print("=" * 50)
    debug_formatter()