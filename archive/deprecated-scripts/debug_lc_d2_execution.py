#!/usr/bin/env python3
"""
Debug LC D2 Scanner Execution - Diagnostic Tool
Helps identify why LC D2 scanner is still failing after Pattern 5 fix
"""

import sys
import os
import importlib.util

def debug_lc_d2_file(file_path):
    """Debug the actual LC D2 file structure and test pattern detection"""

    print(f"🔍 DEBUGGING LC D2 FILE: {file_path}")
    print("=" * 80)

    if not os.path.exists(file_path):
        print(f"❌ File not found: {file_path}")
        return False

    try:
        # Read the file content
        with open(file_path, 'r', encoding='utf-8') as f:
            code_content = f.read()

        print(f"📄 File size: {len(code_content)} characters")
        print(f"📄 File lines: {len(code_content.splitlines())} lines")

        # Check for key components
        has_fetch_daily = 'def fetch_daily_data(' in code_content
        has_adjust_daily = 'def adjust_daily(' in code_content
        has_symbols = 'SYMBOLS = [' in code_content or 'SYMBOLS=[' in code_content

        print(f"\n🔍 STRUCTURE ANALYSIS:")
        print(f"   ✅ fetch_daily_data() function: {has_fetch_daily}")
        print(f"   ✅ adjust_daily() function: {has_adjust_daily}")
        print(f"   ✅ SYMBOLS list: {has_symbols}")

        if has_fetch_daily and has_adjust_daily and has_symbols:
            print(f"   🎯 PATTERN 5 MATCH: YES - Should be detected!")
        else:
            print(f"   ❌ PATTERN 5 MATCH: NO - Missing components")

        # Try to load as module to test
        print(f"\n🧪 TESTING MODULE LOADING:")

        try:
            # Create a temporary module
            spec = importlib.util.spec_from_file_location("lc_d2_test", file_path)
            module = importlib.util.module_from_spec(spec)

            # Execute the module
            spec.loader.exec_module(module)

            # Test hasattr checks (same as Pattern 5 detection)
            has_fetch_attr = hasattr(module, 'fetch_daily_data')
            has_adjust_attr = hasattr(module, 'adjust_daily')
            has_symbols_attr = hasattr(module, 'SYMBOLS')

            print(f"   ✅ Module loaded successfully")
            print(f"   ✅ hasattr(module, 'fetch_daily_data'): {has_fetch_attr}")
            print(f"   ✅ hasattr(module, 'adjust_daily'): {has_adjust_attr}")
            print(f"   ✅ hasattr(module, 'SYMBOLS'): {has_symbols_attr}")

            if has_symbols_attr:
                symbols = getattr(module, 'SYMBOLS', [])
                print(f"   📊 SYMBOLS count: {len(symbols)}")
                if len(symbols) > 0:
                    print(f"   📊 First 5 symbols: {symbols[:5]}")

            # Test function calls
            if has_fetch_attr and has_adjust_attr:
                print(f"\n🧪 TESTING FUNCTION CALLS:")

                try:
                    # Test fetch_daily_data with a sample call
                    fetch_func = getattr(module, 'fetch_daily_data')
                    print(f"   📞 fetch_daily_data function: {fetch_func}")

                    # Try a test call with SPY
                    print(f"   🧪 Testing fetch_daily_data('SPY', '2024-10-01', '2024-10-25')...")
                    result = fetch_func('SPY', '2024-10-01', '2024-10-25')
                    print(f"   📊 Result type: {type(result)}")

                    if result is not None:
                        if hasattr(result, 'shape'):
                            print(f"   📊 Result shape: {result.shape}")
                        if hasattr(result, '__len__'):
                            print(f"   📊 Result length: {len(result)}")

                        # Test adjust_daily
                        adjust_func = getattr(module, 'adjust_daily')
                        print(f"   🧪 Testing adjust_daily(result)...")
                        adjusted = adjust_func(result)
                        print(f"   📊 Adjusted type: {type(adjusted)}")

                        if adjusted is not None:
                            if hasattr(adjusted, 'shape'):
                                print(f"   📊 Adjusted shape: {adjusted.shape}")
                            if hasattr(adjusted, '__len__'):
                                print(f"   📊 Adjusted length: {len(adjusted)}")
                    else:
                        print(f"   ⚠️ fetch_daily_data returned None")

                except Exception as e:
                    print(f"   ❌ Function test failed: {e}")
                    import traceback
                    traceback.print_exc()

            return True

        except Exception as e:
            print(f"   ❌ Module loading failed: {e}")
            import traceback
            traceback.print_exc()
            return False

    except Exception as e:
        print(f"❌ File reading failed: {e}")
        return False

def check_backend_patterns():
    """Check if our Pattern 5 is actually in the backend code"""

    print(f"\n🔍 CHECKING BACKEND PATTERN 5 IMPLEMENTATION:")
    print("=" * 80)

    backend_file = "/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/uploaded_scanner_bypass.py"

    try:
        with open(backend_file, 'r') as f:
            backend_code = f.read()

        # Check for Pattern 5
        has_pattern5_detection = 'fetch_daily_data' in backend_code and 'adjust_daily' in backend_code
        has_pattern5_execution = 'fetch_daily_adjust_daily' in backend_code

        print(f"   ✅ Pattern 5 detection code: {has_pattern5_detection}")
        print(f"   ✅ Pattern 5 execution code: {has_pattern5_execution}")

        if has_pattern5_detection and has_pattern5_execution:
            print(f"   🎯 Pattern 5 implementation: FOUND")
        else:
            print(f"   ❌ Pattern 5 implementation: MISSING")

        # Count patterns
        pattern_count = backend_code.count('elif scanner_pattern ==')
        print(f"   📊 Total execution patterns found: {pattern_count}")

    except Exception as e:
        print(f"   ❌ Backend check failed: {e}")

def main():
    print("🧪 LC D2 SCANNER DEBUGGING TOOL")
    print("=" * 80)
    print("This tool helps diagnose why LC D2 scanner execution is failing")
    print()

    # Check common LC D2 file locations
    possible_paths = [
        "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py",
        "/Users/michaeldurante/Downloads/lc_d2_scan_oct_25_new_ideas.py"
    ]

    lc_d2_file = None
    for path in possible_paths:
        if os.path.exists(path):
            lc_d2_file = path
            break

    if lc_d2_file:
        print(f"📁 Found LC D2 file: {lc_d2_file}")
        debug_lc_d2_file(lc_d2_file)
    else:
        print("❌ LC D2 file not found in expected locations:")
        for path in possible_paths:
            print(f"   - {path}")
        print()
        print("Please provide the correct path:")
        user_path = input("LC D2 file path: ").strip()
        if user_path and os.path.exists(user_path):
            debug_lc_d2_file(user_path)
        else:
            print("❌ Invalid path provided")

    # Check backend implementation
    check_backend_patterns()

    print(f"\n🎯 DEBUGGING COMPLETE")
    print("=" * 80)
    print("Next steps:")
    print("1. Check if Pattern 5 is being detected in backend logs")
    print("2. Check FastAPI backend logs during scan execution")
    print("3. Look for specific error messages during execution")
    print("4. Verify the file structure matches Pattern 5 requirements")

if __name__ == "__main__":
    main()