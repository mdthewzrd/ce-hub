#!/usr/bin/env python3
"""
Test the exact user workflow to see where it fails
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from uploaded_scanner_bypass import execute_uploaded_scanner_direct

async def test_lc_frontside_d2_extended():
    """Test the exact file the user is having issues with"""
    print("🧪 TESTING USER'S PROBLEMATIC FILE")
    print("=" * 70)
    print("File: /Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py")
    print()

    try:
        # Load the exact file
        file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py"

        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Loaded file: {len(code)} characters")
        print()

        # Test execution exactly as user would experience it
        print("🔧 Testing execution through user workflow...")
        print("   (This simulates: Upload → Format → Run)")

        async def progress_callback(percentage, message):
            print(f"  [{percentage:3d}%] {message}")

        # Execute with simple test dates
        result = await execute_uploaded_scanner_direct(
            code=code,
            start_date="2024-12-01",
            end_date="2024-12-01",
            progress_callback=progress_callback
        )

        print(f"✅ Execution completed!")
        print(f"📊 Result type: {type(result)}")
        print(f"📋 Result length: {len(result) if hasattr(result, '__len__') else 'N/A'}")

        return True

    except Exception as e:
        print(f"❌ EXECUTION FAILED: {e}")
        print()
        print("📊 Full error details:")
        import traceback
        traceback.print_exc()
        print()
        print("🔍 This is exactly what the user sees when they try to run!")
        return False

async def test_working_scanner_comparison():
    """Test a working scanner to compare"""
    print("\n🧪 TESTING WORKING SCANNER FOR COMPARISON")
    print("=" * 70)

    # Look for backside scanners or other working scanners
    working_scanners = [
        "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d3_extended_1_scanner.py",
        "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_1_scanner.py"
    ]

    for scanner_path in working_scanners:
        if os.path.exists(scanner_path):
            try:
                print(f"📄 Testing: {os.path.basename(scanner_path)}")

                with open(scanner_path, 'r') as f:
                    code = f.read()

                async def progress_callback(percentage, message):
                    print(f"  [{percentage:3d}%] {message}")

                result = await execute_uploaded_scanner_direct(
                    code=code,
                    start_date="2024-12-01",
                    end_date="2024-12-01",
                    progress_callback=progress_callback
                )

                print(f"✅ Working scanner executed successfully!")
                print(f"📊 Result: {len(result) if hasattr(result, '__len__') else result}")
                return True

            except Exception as e:
                print(f"❌ Error with {scanner_path}: {e}")
                continue

    print("⚠️ No working scanners found for comparison")
    return False

async def main():
    """Test the user's exact issue"""
    print("🎯 USER'S ACTUAL WORKFLOW TEST")
    print("=" * 70)
    print("Testing the exact workflow that's failing for the user")
    print()

    # Test the problematic file
    problematic_works = await test_lc_frontside_d2_extended()

    # Test a working file for comparison
    comparison_works = await test_working_scanner_comparison()

    print("\n" + "=" * 70)
    print("🎯 WORKFLOW COMPARISON RESULTS")
    print("=" * 70)

    print(f"❌ Problematic LC D2 Extended: {'PASSED' if problematic_works else 'FAILED'}")
    print(f"✅ Comparison Scanner: {'PASSED' if comparison_works else 'FAILED'}")

    if not problematic_works:
        print("\n🔍 ISSUE IDENTIFIED:")
        print("   The user's LC D2 Extended scanner is failing during execution")
        print("   This explains why they can't get the run button to work")
        print("   The issue is NOT with formatting bypass - it's with the scanner code itself")

    return problematic_works

if __name__ == "__main__":
    success = asyncio.run(main())
    if not success:
        print("\n🔧 USER'S ISSUE CONFIRMED: The scanner code has execution problems")
    else:
        print("\n✅ SCANNER WORKS: Issue may be elsewhere")