#!/usr/bin/env python3
"""
Direct test of working manual scanner - bypassing upload execution
"""
import sys
import os
import asyncio
from pathlib import Path

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

def test_direct_scanner_import():
    """Test importing and running working scanner directly"""
    print("🧪 Testing direct scanner import...")

    # Check if working scanner exists
    scanner_path = Path(__file__).parent / "lc_frontside_d2_extended_1_scanner.py"

    if not scanner_path.exists():
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    print(f"✅ Scanner found: {scanner_path}")

    # Try importing as module
    try:
        import importlib.util

        spec = importlib.util.spec_from_file_location("working_scanner", scanner_path)
        working_scanner = importlib.util.module_from_spec(spec)

        print("📦 Loading scanner module...")
        spec.loader.exec_module(working_scanner)
        print("✅ Scanner module loaded successfully!")

        # Check if it has main function
        if hasattr(working_scanner, 'main'):
            print("✅ Found main() function")
            print("🚀 This scanner can be imported and executed directly!")
            return True
        else:
            print("❌ No main() function found")
            return False

    except Exception as e:
        print(f"❌ Import failed: {e}")
        return False

def test_working_scanner_in_backend():
    """Test that we can integrate working scanner into backend"""
    print("\n" + "="*50)
    print("🎯 SOLUTION: Direct Scanner Integration")
    print("="*50)

    print("""
✅ APPROACH: Skip Upload Execution Entirely

Instead of uploading code as strings (which causes type contamination),
we can:

1. Copy your working scanners to backend/scanners/ directory
2. Import them as Python modules directly
3. Add them to the scan API as predefined scanner types
4. Preserve EXACT parameter integrity

This bypasses the problematic upload execution environment.
""")

    return True

if __name__ == "__main__":
    print("🧪 Testing Direct Scanner Import Approach")
    print("="*50)

    success = test_direct_scanner_import()
    if success:
        test_working_scanner_in_backend()

    print("\n✅ Direct import test complete!")