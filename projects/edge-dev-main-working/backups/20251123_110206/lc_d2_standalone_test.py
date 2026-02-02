#!/usr/bin/env python3
"""
Standalone LC D2 Test - Outside any existing event loop

This test runs LC D2 in a completely isolated environment to confirm
that the issue is with nested event loops, not the web pipeline.
"""

import subprocess
import sys
import os

def test_lc_d2_standalone():
    print("🔍 TESTING LC D2 IN STANDALONE PYTHON PROCESS")
    print("=" * 60)

    # Create a standalone script that runs LC D2 completely isolated
    standalone_script = '''
import asyncio
import sys
import os
import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

def main():
    print("🚀 Starting standalone LC D2 execution...")
    print(f"Python version: {sys.version}")
    print(f"Event loop policy: {asyncio.get_event_loop_policy()}")

    # Check if there's an existing event loop
    try:
        current_loop = asyncio.get_event_loop()
        print(f"❌ Found existing event loop: {current_loop}")
        print(f"   Loop is running: {current_loop.is_running()}")
    except RuntimeError:
        print("✅ No existing event loop found - this is good!")

    # Read LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2: {e}")
        return

    # Execute LC D2 code to load definitions
    exec_globals = {'__name__': '__main__'}

    # Clean up asyncio.run() calls to prevent conflicts
    processed_code = scanner_code
    if 'asyncio.run(' in processed_code:
        lines = processed_code.split('\\n')
        cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
        processed_code = '\\n'.join(cleaned_lines)
        print(f"🔧 Removed {len(lines) - len(cleaned_lines)} asyncio.run() lines")

    try:
        print("🔧 Loading LC D2 definitions...")
        exec(processed_code, exec_globals)
        print("✅ LC D2 definitions loaded successfully")
    except Exception as e:
        print(f"❌ Failed to load LC D2 definitions: {e}")
        import traceback
        traceback.print_exc()
        return

    # Check if main function exists
    if 'main' not in exec_globals:
        print("❌ No main() function found in LC D2")
        return

    main_function = exec_globals['main']
    print(f"✅ Found main() function: {type(main_function)}")
    print(f"   Is coroutine function: {asyncio.iscoroutinefunction(main_function)}")

    # Execute main function using asyncio.run (the clean way)
    if asyncio.iscoroutinefunction(main_function):
        print("🚀 Executing async main() with asyncio.run()...")
        try:
            # This is the proper way to run async code from a sync context
            asyncio.run(main_function())
            print("✅ LC D2 main() executed successfully!")

            # Check for results
            result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']

            print(f"\\n📊 CHECKING FOR RESULTS:")
            results_found = False

            for var_name in result_vars:
                if var_name in exec_globals and exec_globals[var_name] is not None:
                    var_data = exec_globals[var_name]
                    if hasattr(var_data, 'shape'):  # pandas DataFrame
                        print(f"✅ {var_name}: DataFrame with shape {var_data.shape}")
                        if len(var_data) > 0:
                            print(f"   📊 Sample data: {var_data.head(1).to_dict('records')[0]}")
                            results_found = True
                    elif isinstance(var_data, list) and len(var_data) > 0:
                        print(f"✅ {var_name}: List with {len(var_data)} items")
                        print(f"   📊 Sample data: {var_data[0]}")
                        results_found = True
                    else:
                        print(f"⚠️  {var_name}: {type(var_data)} with length {len(var_data) if hasattr(var_data, '__len__') else 'N/A'}")
                else:
                    print(f"❌ {var_name}: Not found")

            if results_found:
                print(f"\\n🎉 SUCCESS: LC D2 generated results in standalone execution!")
                print(f"🔥 This confirms the scanner code works - the issue is with nested event loops!")
            else:
                print(f"\\n⚠️  No results found - may be a data/date range issue, not a code issue")

        except Exception as e:
            print(f"❌ LC D2 execution failed: {e}")
            import traceback
            traceback.print_exc()
    else:
        print("🔧 main() is sync function - calling directly...")
        try:
            main_function()
            print("✅ Sync main() executed successfully!")
        except Exception as e:
            print(f"❌ Sync main() failed: {e}")

if __name__ == "__main__":
    main()
'''

    # Write the standalone script
    script_path = '/tmp/lc_d2_standalone_test.py'
    with open(script_path, 'w') as f:
        f.write(standalone_script)

    print("✅ Created standalone test script")

    # Run the script in a completely separate Python process
    print("\n🚀 Executing LC D2 in standalone Python process...")
    print("-" * 50)

    try:
        # Run in completely isolated process
        result = subprocess.run(
            [sys.executable, script_path],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=os.getcwd()
        )

        print("STDOUT:")
        print(result.stdout)

        if result.stderr:
            print("\nSTDERR:")
            print(result.stderr)

        print(f"\nReturn code: {result.returncode}")

        if result.returncode == 0:
            if "SUCCESS: LC D2 generated results" in result.stdout:
                print("\n🎉 CONCLUSION: LC D2 works perfectly in standalone execution!")
                print("🔧 ISSUE: Nested event loop conflicts in server environment")
                print("💡 SOLUTION: Need to modify uploaded_scanner_bypass.py to handle async properly")
            else:
                print("\n⚠️  LC D2 ran without error but found no results")
                print("🔍 May be a data availability issue, not a code issue")
        else:
            print(f"\n❌ Standalone execution failed with return code {result.returncode}")

    except subprocess.TimeoutExpired:
        print("⏰ Standalone test timed out after 5 minutes")
    except Exception as e:
        print(f"❌ Failed to run standalone test: {e}")

    # Cleanup
    try:
        os.remove(script_path)
    except:
        pass

if __name__ == "__main__":
    test_lc_d2_standalone()