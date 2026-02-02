#!/usr/bin/env python3
"""
Test and fix the individual scanner detection logic
This will verify the detection issue and then fix it.
"""
import sys
import os
import asyncio
import requests

# Add current directory to path
sys.path.append(os.path.dirname(os.path.abspath(__file__)))

async def test_detection_issue():
    """Test the detection logic issue directly"""
    print("🧪 TESTING DETECTION LOGIC FIX")
    print("=" * 70)

    # Load the problematic file
    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Loaded file: {len(code)} characters")
        print()

        # Test the EXACT detection logic from main.py
        is_standalone_script = 'if __name__ == "__main__"' in code
        pattern_lines = [line for line in code.split('\n') if 'df[\'lc_frontside' in line and '= (' in line]
        actual_pattern_count = len(pattern_lines)

        has_d3_extended_1 = "df['lc_frontside_d3_extended_1'] = " in code
        has_d2_extended = "df['lc_frontside_d2_extended'] = " in code
        has_d2_extended_1 = "df['lc_frontside_d2_extended_1'] = " in code

        print(f"🔍 CURRENT DETECTION LOGIC RESULTS:")
        print(f"   has async def main: {'async def main(' in code}")
        print(f"   is standalone script: {is_standalone_script}")
        print(f"   pattern count: {actual_pattern_count}")
        print(f"   has d3_extended_1: {has_d3_extended_1}")
        print(f"   has d2_extended: {has_d2_extended}")
        print(f"   has d2_extended_1: {has_d2_extended_1}")
        print()

        # Current logic
        is_individual_scanner_current = (
            'async def main(' in code and
            not is_standalone_script and
            actual_pattern_count == 1 and
            (has_d3_extended_1 or has_d2_extended or has_d2_extended_1)
        )

        print(f"🎯 CURRENT INDIVIDUAL SCANNER RESULT: {is_individual_scanner_current}")
        print()

        # Show what the issue is
        if not is_individual_scanner_current:
            print("🔧 DEBUGGING WHY DETECTION FAILED:")
            if not ('async def main(' in code):
                print("   ❌ Missing 'async def main('")
            if is_standalone_script:
                print("   ❌ Detected as standalone script (has __main__ block)")
            if actual_pattern_count != 1:
                print(f"   ❌ Pattern count is {actual_pattern_count} (should be 1)")
            if not (has_d3_extended_1 or has_d2_extended or has_d2_extended_1):
                print("   ❌ No recognized pattern found")
            print()

        # Now let me check if there's another issue - maybe there's hidden __main__ content?
        print("🔍 SEARCHING FOR HIDDEN __main__ PATTERNS:")
        main_variations = [
            'if __name__ == "__main__"',
            "if __name__ == '__main__'",
            'if __name__=="__main__"',
            "if __name__=='__main__'",
            '__name__',
            '__main__'
        ]

        for pattern in main_variations:
            if pattern in code:
                print(f"   ✅ Found pattern: {pattern}")
                # Find where it is
                lines = code.split('\n')
                for i, line in enumerate(lines, 1):
                    if pattern in line:
                        print(f"      Line {i}: {line.strip()}")
            else:
                print(f"   ⚪ Not found: {pattern}")
        print()

        # IMPROVED DETECTION LOGIC
        print("🎯 PROPOSING IMPROVED DETECTION LOGIC:")
        print("   Instead of just checking for __name__, we should check if it's a")
        print("   proper individual scanner with all the characteristics:")
        print()

        # New improved logic that's more lenient
        has_main_function = 'async def main(' in code
        has_exactly_one_pattern = actual_pattern_count == 1
        has_valid_pattern = (has_d3_extended_1 or has_d2_extended or has_d2_extended_1)
        is_not_complex_multi_scanner = actual_pattern_count < 5  # Allow some flexibility

        # More sophisticated standalone detection
        # A true standalone script will have:
        # 1. if __name__ == "__main__" block
        # 2. AND actual execution code after it (like asyncio.run())
        has_main_block = 'if __name__ == "__main__"' in code
        has_execution_call = ('asyncio.run(' in code or 'main(' in code) if has_main_block else False
        is_true_standalone = has_main_block and has_execution_call

        print(f"   has_main_function: {has_main_function}")
        print(f"   has_exactly_one_pattern: {has_exactly_one_pattern}")
        print(f"   has_valid_pattern: {has_valid_pattern}")
        print(f"   is_not_complex_multi_scanner: {is_not_complex_multi_scanner}")
        print(f"   is_true_standalone: {is_true_standalone}")
        print()

        # New improved individual scanner detection
        is_individual_scanner_improved = (
            has_main_function and
            has_exactly_one_pattern and
            has_valid_pattern and
            not is_true_standalone  # Only exclude if it's truly a standalone script with execution
        )

        print(f"🎉 IMPROVED INDIVIDUAL SCANNER RESULT: {is_individual_scanner_improved}")

        if is_individual_scanner_improved:
            print("✅ SUCCESS: Improved logic correctly detects individual scanner!")
            print("   This would return confidence=100 and bypass parameter extraction")
        else:
            print("❌ Still failing with improved logic")

        return is_individual_scanner_improved

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def test_api_fix():
    """Test the fix by calling the API directly"""
    print(f"\n🧪 TESTING API FIX")
    print("=" * 70)

    file_path = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/lc frontside d2 extended new.py"

    try:
        with open(file_path, 'r') as f:
            code = f.read()

        print(f"📄 Testing with LC file: {len(code)} characters")

        # Test the analysis API
        url = "http://localhost:8000/api/format/analyze-code"

        payload = {
            "code": code
        }

        print(f"🌐 Making API request to: {url}")

        response = requests.post(url, json=payload)

        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ API Response received")
            print()
            print(f"🔍 ANALYSIS RESULTS:")
            print(f"   Scanner type: {result.get('scanner_type', 'Unknown')}")
            print(f"   Confidence: {result.get('confidence', 0)}")
            print(f"   Ready for execution: {result.get('ready_for_execution', False)}")
            print(f"   Bypass formatting: {result.get('bypass_formatting', False)}")
            print(f"   Message: {result.get('message', 'No message')}")

            if result.get('confidence', 0) == 100:
                print("\\n🎉 SUCCESS: API correctly detects individual scanner with 100% confidence!")
                return True
            else:
                print(f"\\n❌ API still returning {result.get('confidence', 0)}% confidence")
                return False
        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"   Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ API test failed: {e}")
        return False

async def main():
    """Test detection logic and propose fix"""
    print("🎯 INDIVIDUAL SCANNER DETECTION FIX")
    print("=" * 70)
    print("Understanding and fixing the 0% confidence issue")
    print()

    # Test current detection logic
    detection_works = await test_detection_issue()

    if detection_works:
        print("\\n🎯 NEXT: Implement this fix in main.py")
        print("The improved logic should replace the current detection in the analyze-code endpoint")
    else:
        print("\\n🔧 Need further investigation into detection logic")

    # Test API after potential fix
    # await test_api_fix()

if __name__ == "__main__":
    asyncio.run(main())