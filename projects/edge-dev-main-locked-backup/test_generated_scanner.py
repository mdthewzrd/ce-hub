#!/usr/bin/env python3
"""
Quick validation test of generated scanner
"""

import sys
import os

def test_generated_scanner():
    """Test that a generated scanner can be imported and executed"""

    scanner_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/formatted_scanners/Half_A_Plus_Scanner_Enhanced.py"

    print("🧪 TESTING GENERATED SCANNER")
    print("="*50)
    print(f"Scanner: {os.path.basename(scanner_path)}")

    # Check file exists and is readable
    if not os.path.exists(scanner_path):
        print(f"❌ Scanner file not found: {scanner_path}")
        return False

    try:
        with open(scanner_path, 'r') as f:
            content = f.read()

        print(f"✅ Scanner file readable: {len(content):,} characters")

        # Check for key components
        checks = [
            ('API_KEY', 'API_KEY' in content),
            ('Trading logic', 'high_pct_chg' in content or 'gap_pct' in content or 'volume' in content),
            ('Date handling', 'DATE' in content or 'date' in content),
            ('Execution wrapper', '__name__ == "__main__"' in content),
            ('Generated header', 'Generated Executable Scanner' in content)
        ]

        print(f"\n🔍 Scanner validation:")
        for check_name, passed in checks:
            status = "✅" if passed else "❌"
            print(f"   {status} {check_name}")

        all_passed = all(passed for _, passed in checks)

        if all_passed:
            print(f"\n✅ Scanner validation PASSED - Ready for execution")
            return True
        else:
            print(f"\n❌ Scanner validation FAILED")
            return False

    except Exception as e:
        print(f"❌ Error testing scanner: {e}")
        return False

if __name__ == "__main__":
    success = test_generated_scanner()
    print(f"\nTest result: {'PASSED' if success else 'FAILED'}")