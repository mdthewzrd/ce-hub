#!/usr/bin/env python3
"""
🔧 Debug pattern detection by examining backend logs
"""

import subprocess
import sys
import time
import requests
import json

def test_with_backend_logging():
    """Test pattern detection and monitor backend logs"""
    print("🔧 Testing Pattern Detection with Backend Logging")
    print("=" * 60)

    # Read the half A+ scanner
    scanner_file = "/Users/michaeldurante/Downloads/half A+ scan copy.py"
    try:
        with open(scanner_file, 'r') as f:
            half_a_plus_code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find scanner file: {scanner_file}")
        return False

    print(f"📄 Half A+ scanner loaded: {len(half_a_plus_code)} characters")

    # Test the uploaded scanner bypass directly
    print(f"\n🔧 Testing pattern detection directly...")

    # Import and test the bypass module directly
    try:
        sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')
        from uploaded_scanner_bypass import execute_uploaded_scanner_direct

        print(f"🚀 Testing direct execution with logging...")

        # This will show us the pattern detection logs
        import asyncio

        async def test_execution():
            try:
                # Test with smaller date range first
                results = await execute_uploaded_scanner_direct(
                    half_a_plus_code,
                    "2024-01-01",
                    "2024-01-31",
                    lambda progress, message: print(f"📊 Progress: {progress}% - {message}"),
                    pure_execution_mode=True
                )

                print(f"\n✅ Direct execution completed!")
                print(f"📊 Results: {len(results)}")
                if results:
                    print(f"📈 Sample results:")
                    for i, result in enumerate(results[:3]):
                        print(f"   {i+1}. {result}")

                return len(results) > 0

            except Exception as e:
                print(f"❌ Direct execution failed: {e}")
                return False

        success = asyncio.run(test_execution())
        return success

    except Exception as e:
        print(f"❌ Failed to import bypass module: {e}")
        return False

if __name__ == "__main__":
    success = test_with_backend_logging()
    print(f"\n📋 Pattern Detection Debug: {'✅ SUCCESS' if success else '❌ NEEDS MORE WORK'}")

    if not success:
        print(f"\n🔧 Debugging Info:")
        print(f"   - Check if Pattern 2 is being detected correctly")
        print(f"   - Verify main block extraction is working")
        print(f"   - Ensure custom_params are being passed correctly")
        print(f"   - Check date range filtering logic")