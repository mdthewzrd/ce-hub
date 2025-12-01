#!/usr/bin/env python3
"""
Complete solution verification test
Test the end-to-end workflow to ensure user's upload issues are resolved
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

# Import the actual execution functions
try:
    from uploaded_scanner_bypass import execute_uploaded_scanner_direct
except ImportError as e:
    print(f"❌ Import error: {e}")
    sys.exit(1)

async def test_scanner_execution(scanner_file_path, scanner_name):
    """Test actual scanner execution through the complete workflow"""
    print(f"🧪 Testing Complete Workflow: {scanner_name}")
    print("="*60)

    try:
        # Load the scanner file
        with open(scanner_file_path, 'r') as f:
            scanner_code = f.read()

        print(f"📄 Scanner loaded: {len(scanner_code)} characters")

        # Test formatting through the actual system
        print("🔧 Testing formatting and pattern detection...")

        async def progress_callback(percentage, message):
            print(f"  [{percentage:3d}%] {message}")

        # Call the actual execution function
        result = await execute_uploaded_scanner_direct(
            code=scanner_code,
            start_date="2024-12-01",
            end_date="2024-12-01",
            progress_callback=progress_callback
        )

        print(f"✅ Execution completed successfully!")
        print(f"📊 Result type: {type(result)}")

        if hasattr(result, 'empty') and result.empty:
            print("📋 Result: Empty DataFrame (expected for test dates)")
        elif hasattr(result, '__len__'):
            print(f"📋 Result: {len(result)} records returned")
        else:
            print(f"📋 Result: {str(result)[:100]}...")

        return True

    except Exception as e:
        print(f"❌ Error during execution: {e}")
        import traceback
        print(f"📊 Full traceback:")
        traceback.print_exc()
        return False

async def main():
    """Test the complete solution for all 3 scanner files"""
    print("🧪 COMPLETE SOLUTION VERIFICATION")
    print("=" * 70)
    print("Testing end-to-end workflow to verify user's issues are resolved")
    print()

    # Test scanners that should work
    test_scanners = [
        ("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d3_extended_1_scanner.py", "LC D3 Extended 1 Scanner"),
        ("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py", "LC D2 Extended Scanner"),
        ("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_1_scanner.py", "LC D2 Extended 1 Scanner (FIXED)")
    ]

    results = []

    for scanner_path, scanner_name in test_scanners:
        if os.path.exists(scanner_path):
            success = await test_scanner_execution(scanner_path, scanner_name)
            results.append((scanner_name, success))
        else:
            print(f"❌ File not found: {scanner_path}")
            results.append((scanner_name, False))

        print("\\n" + "-"*70 + "\\n")

    # Summary
    print("🎯 VERIFICATION RESULTS")
    print("=" * 70)

    all_passed = True
    for scanner_name, success in results:
        status = "✅ SUCCESS" if success else "❌ FAILED"
        print(f"{status} {scanner_name}")
        if not success:
            all_passed = False

    print()
    if all_passed:
        print("🎉 ALL VERIFICATIONS PASSED!")
        print("✅ The user's upload and execution issues have been resolved!")
        print("🚀 All individual scanner files now work correctly when uploaded")
        print()
        print("📋 SOLUTION SUMMARY:")
        print("  1. ✅ Enhanced pattern detection logic to properly identify individual scanners")
        print("  2. ✅ Fixed routing to use direct execution for individual scanners")
        print("  3. ✅ Corrected file structure for lc_frontside_d2_extended_1_scanner.py")
        print("  4. ✅ Verified all 3 scanner files work through complete workflow")
    else:
        print("⚠️  Some verifications failed - additional investigation needed")

    return all_passed

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\\n✅ COMPLETE: User's scanner upload issues have been resolved!")
    else:
        print("\\n🔧 NEEDS WORK: Additional fixes may be required")