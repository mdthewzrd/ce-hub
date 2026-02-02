#!/usr/bin/env python3
"""
Test the formatting process that happens before execution
This is where the user's issue likely occurs
"""
import sys
import os
import asyncio

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

from main import ApplyFormattingRequest, apply_formatting

async def test_formatting_step():
    """Test the exact formatting step that happens when user clicks Format"""
    print("🧪 TESTING FORMATTING STEP")
    print("=" * 70)
    print("This is what happens when user clicks 'Format' button")
    print()

    try:
        # Load the problematic file
        file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py"

        with open(file_path, 'r') as f:
            original_code = f.read()

        print(f"📄 Loaded file: {len(original_code)} characters")

        # Simulate exactly what the web interface sends
        print("🔧 Simulating web interface formatting request...")

        request = ApplyFormattingRequest(
            original_code=original_code,
            approved_parameters=[],  # Empty list as sent by web interface
            scanner_type=None,       # Let it auto-detect
            user_feedback={}         # Empty dict as sent by web interface
        )

        # Call formatting function
        print("⚡ Calling apply_formatting...")
        result = await apply_formatting(request)

        print("✅ Formatting completed successfully!")
        print()
        print("📊 FORMATTING RESULTS:")
        print(f"   Success: {result.success}")
        print(f"   Message: {result.message}")
        print(f"   Code length: {len(result.formatted_code)} chars")
        print(f"   Code unchanged: {result.formatted_code == original_code}")
        print(f"   Improvements: {result.improvements}")

        if result.success and result.formatted_code == original_code:
            print("\n🎉 SUCCESS: Formatting bypass working correctly!")
            print("✅ Code preserved unchanged")
            print("✅ Should enable Run button")
            return True
        else:
            print(f"\n❌ FORMATTING ISSUE FOUND:")
            print(f"   Success: {result.success}")
            print(f"   Code changed: {result.formatted_code != original_code}")
            return False

    except Exception as e:
        print(f"❌ FORMATTING FAILED: {e}")
        print()
        print("📊 Full error:")
        import traceback
        traceback.print_exc()
        print()
        print("🔍 This could be the user's issue!")
        return False

async def test_web_interface_simulation():
    """Test what happens from the web interface perspective"""
    print("\n🧪 TESTING COMPLETE WEB INTERFACE SIMULATION")
    print("=" * 70)
    print("Simulating: Upload → Format → Check Run Button State")
    print()

    try:
        # Step 1: Upload (load file)
        file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc_frontside_d2_extended_scanner.py"
        with open(file_path, 'r') as f:
            uploaded_code = f.read()

        print(f"📤 Step 1 - Upload: {len(uploaded_code)} characters loaded")

        # Step 2: Format
        print("🔧 Step 2 - Format: Processing...")

        request = ApplyFormattingRequest(
            original_code=uploaded_code,
            approved_parameters=[],
            scanner_type=None,
            user_feedback={}
        )

        format_result = await apply_formatting(request)

        print(f"   Formatting success: {format_result.success}")
        print(f"   Formatted code length: {len(format_result.formatted_code)}")

        # Step 3: Check if Run button should be enabled
        print("🏃 Step 3 - Run Button: Checking state...")

        if format_result.success:
            print("   ✅ Run button should be ENABLED")
            print("   ✅ User should be able to click Run")
            return True
        else:
            print("   ❌ Run button would be DISABLED")
            print(f"   ❌ Error: {format_result.message}")
            return False

    except Exception as e:
        print(f"❌ Web interface simulation failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Test complete formatting workflow"""
    print("🎯 TESTING USER'S FORMATTING WORKFLOW")
    print("=" * 70)
    print("Testing why user can't click Run button after formatting")
    print()

    # Test formatting step
    formatting_works = await test_formatting_step()

    # Test complete web interface flow
    web_interface_works = await test_web_interface_simulation()

    print("\n" + "=" * 70)
    print("🎯 FORMATTING WORKFLOW RESULTS")
    print("=" * 70)

    print(f"🔧 Formatting Process: {'PASSED' if formatting_works else 'FAILED'}")
    print(f"🌐 Web Interface Flow: {'PASSED' if web_interface_works else 'FAILED'}")

    if formatting_works and web_interface_works:
        print("\n✅ ALL FORMATTING TESTS PASSED")
        print("🤔 User's issue may be in frontend JavaScript or browser-specific")
        print("💡 Suggestion: Check browser console for JavaScript errors")
    else:
        print("\n❌ FORMATTING ISSUE FOUND")
        print("🔍 This explains why user can't run the scanner")

    return formatting_works and web_interface_works

if __name__ == "__main__":
    success = asyncio.run(main())
    if success:
        print("\n✅ FORMATTING WORKING: Issue may be in frontend")
    else:
        print("\n🔧 FORMATTING BROKEN: Found the user's issue")