#!/usr/bin/env python3
"""
🧪 Test LC D2 Scanner Direct Execution
========================================

Test what happens when we execute the LC D2 scanner code directly
to see why it's failing in the backend.
"""

import sys
import os
import traceback

# Add backend path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

from uploaded_scanner_bypass import create_safe_exec_globals

def test_lc_d2_execution():
    """Test direct execution of LC D2 scanner code"""

    print("🧪 Testing LC D2 Scanner Direct Execution")
    print("=" * 60)

    # Load the problematic LC D2 scanner
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(lc_d2_file, 'r') as f:
            code = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(code)} characters")

        # Test 1: Check if it has the expected patterns
        print(f"\n🔍 Pattern Detection:")
        print(f"   Has 'async def main(': {'async def main(' in code}")
        print(f"   Has 'DATES': {'DATES' in code}")
        print(f"   Has 'asyncio.run(main())': {'asyncio.run(main())' in code}")

        # Test 2: Try to execute with safe globals (like backend does)
        print(f"\n🔧 Testing Execution with Safe Globals:")
        exec_globals = create_safe_exec_globals(code)
        print(f"   Safe globals provided: {list(exec_globals.keys())}")

        try:
            print("   Attempting execution...")
            exec(code, exec_globals)
            print("   ✅ Execution completed successfully!")

            # Check for result variables
            result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']
            print(f"\n📊 Checking for result variables:")
            for var_name in result_vars:
                if var_name in exec_globals:
                    var_data = exec_globals[var_name]
                    print(f"   ✅ Found '{var_name}': {type(var_data)} - {len(var_data) if hasattr(var_data, '__len__') else 'N/A'}")
                else:
                    print(f"   ❌ Missing '{var_name}'")

            # Show all available variables
            available_vars = [k for k in exec_globals.keys() if not k.startswith('__')]
            print(f"\n📋 All available variables: {available_vars}")

        except Exception as e:
            print(f"   ❌ Execution failed: {e}")
            print(f"\n🔍 Full error traceback:")
            traceback.print_exc()

        # Test 3: Try with full globals (all standard modules)
        print(f"\n🔧 Testing Execution with Full Globals:")
        try:
            import builtins
            full_globals = {**builtins.__dict__, '__name__': '__main__'}

            print("   Attempting execution with full standard library access...")
            exec(code, full_globals)
            print("   ✅ Execution with full globals completed!")

            # Check for result variables
            print(f"\n📊 Results with full globals:")
            for var_name in result_vars:
                if var_name in full_globals:
                    var_data = full_globals[var_name]
                    print(f"   ✅ Found '{var_name}': {type(var_data)} - {len(var_data) if hasattr(var_data, '__len__') else 'N/A'}")

        except Exception as e:
            print(f"   ❌ Execution with full globals failed: {e}")
            print(f"\n🔍 Full error traceback:")
            traceback.print_exc()

    except Exception as e:
        print(f"❌ Test failed: {e}")
        traceback.print_exc()

if __name__ == "__main__":
    test_lc_d2_execution()