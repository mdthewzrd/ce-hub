#!/usr/bin/env python3
"""
LC D2 Execution Fix - Compare working direct execution vs hanging web execution
"""

import asyncio
import io
import contextlib
import pandas as pd
from datetime import datetime

async def test_lc_d2_execution_differences():
    print("🔍 COMPARING LC D2 EXECUTION METHODS")
    print("=" * 60)

    # Read the LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    print(f"\n🔧 METHOD 1: Direct execution (WORKING - finds 80 results)")
    print("-" * 40)

    def direct_execution():
        """Direct execution method that works"""
        try:
            exec_globals = {'__name__': '__main__'}

            # Clean asyncio.run calls
            processed_code = scanner_code
            if 'asyncio.run(' in processed_code:
                lines = processed_code.split('\n')
                cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
                processed_code = '\n'.join(cleaned_lines)
                print(f"🔧 Removed {len(lines) - len(cleaned_lines)} asyncio.run() lines")

            # Execute to load definitions
            print(f"🔧 Loading scanner definitions...")
            with contextlib.redirect_stdout(io.StringIO()):
                exec(processed_code, exec_globals)

            # Execute main() directly
            if 'main' in exec_globals and callable(exec_globals['main']):
                print(f"🔧 Executing main() function...")
                main_function = exec_globals['main']

                if asyncio.iscoroutinefunction(main_function):
                    print(f"🔧 main() is async - creating new event loop...")
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    loop.run_until_complete(main_function())
                    loop.close()
                else:
                    main_function()

                print(f"✅ main() executed successfully")

                # Check results
                result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results']
                for var_name in result_vars:
                    if var_name in exec_globals and exec_globals[var_name] is not None:
                        var_data = exec_globals[var_name]
                        if hasattr(var_data, 'shape'):
                            print(f"✅ Found DataFrame '{var_name}': {var_data.shape}")
                            return var_data.to_dict('records')
                        elif isinstance(var_data, list) and len(var_data) > 0:
                            print(f"✅ Found list '{var_name}': {len(var_data)} items")
                            return var_data

            print(f"❌ No results found")
            return []

        except Exception as e:
            print(f"❌ Direct execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    # Test direct execution
    direct_results = direct_execution()
    print(f"📊 Direct execution: {len(direct_results)} results")

    print(f"\n🔧 METHOD 2: Web execution with asyncio.to_thread (HANGING)")
    print("-" * 40)

    def web_execution_sync():
        """Web execution method that hangs"""
        try:
            print(f"🔧 Web execution: Creating globals...")
            exec_globals = {'__name__': '__main__'}

            # Same code cleaning as direct
            processed_code = scanner_code
            if 'asyncio.run(' in processed_code:
                lines = processed_code.split('\n')
                cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
                processed_code = '\n'.join(cleaned_lines)

            # Execute to load definitions
            print(f"🔧 Web execution: Loading scanner definitions...")
            with contextlib.redirect_stdout(io.StringIO()):
                exec(processed_code, exec_globals)

            print(f"🔧 Web execution: Checking for main()...")
            if 'main' in exec_globals and callable(exec_globals['main']):
                main_function = exec_globals['main']
                print(f"🔧 Web execution: Found main() function: {type(main_function)}")

                if asyncio.iscoroutinefunction(main_function):
                    print(f"🔧 Web execution: main() is async - THIS IS WHERE IT HANGS")
                    print(f"🚨 About to create event loop inside asyncio.to_thread context...")

                    # This is the difference - we're inside an asyncio.to_thread context!
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    print(f"🔧 Web execution: Event loop created")

                    print(f"🔧 Web execution: About to run main()...")
                    loop.run_until_complete(main_function())
                    print(f"✅ Web execution: main() completed!")

                    loop.close()

            return []

        except Exception as e:
            print(f"❌ Web execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    try:
        # Test web execution with timeout to see if it hangs
        print(f"🚀 Testing web execution with 30s timeout...")
        web_results = await asyncio.wait_for(
            asyncio.to_thread(web_execution_sync),
            timeout=30.0
        )
        print(f"📊 Web execution: {len(web_results)} results")

    except asyncio.TimeoutError:
        print(f"❌ WEB EXECUTION TIMED OUT - This confirms the issue!")
        print(f"🎯 CONCLUSION: The problem is nested event loops in asyncio.to_thread context")

    except Exception as e:
        print(f"❌ Web execution failed: {e}")

    print(f"\n🎯 ANALYSIS:")
    print(f"   Direct execution: Creates event loop in main thread -> Works")
    print(f"   Web execution: Creates event loop inside asyncio.to_thread -> Hangs")
    print(f"   ROOT CAUSE: Nested event loop conflict in web execution pipeline")

if __name__ == "__main__":
    asyncio.run(test_lc_d2_execution_differences())