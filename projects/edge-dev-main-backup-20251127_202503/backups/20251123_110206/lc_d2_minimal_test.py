#!/usr/bin/env python3
"""
Minimal test of LC D2 scanner to identify where it hangs
"""

import asyncio
import io
import contextlib

async def test_lc_d2_minimal():
    print("🔍 MINIMAL LC D2 TEST - Direct execution with timeout")

    # Read the LC D2 scanner code
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"✅ LC D2 scanner code loaded: {len(scanner_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner code: {e}")
        return

    def run_lc_d2_sync():
        """Synchronous wrapper with strict timeout"""
        try:
            print("🔧 Creating execution environment...")
            exec_globals = {'__name__': '__main__'}

            # Clean up asyncio.run() calls
            print("🔧 Cleaning asyncio.run() calls...")
            processed_code = scanner_code
            if 'asyncio.run(' in processed_code:
                lines = processed_code.split('\n')
                cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
                processed_code = '\n'.join(cleaned_lines)
                print(f"🔧 Removed {len(lines) - len(cleaned_lines)} asyncio.run() lines")

            # Execute code to load definitions
            print("🔧 Loading scanner definitions...")
            with contextlib.redirect_stdout(io.StringIO()):
                exec(processed_code, exec_globals)

            print("🔧 Scanner definitions loaded successfully")

            # Check if main function exists
            if 'main' not in exec_globals:
                print("❌ No main() function found")
                return []

            main_function = exec_globals['main']
            print(f"🔧 Found main() function: {type(main_function)}")

            if asyncio.iscoroutinefunction(main_function):
                print("🔧 main() is async - creating new event loop...")
                try:
                    # This is where it probably hangs
                    loop = asyncio.new_event_loop()
                    asyncio.set_event_loop(loop)
                    print("🔧 Event loop created, calling main()...")

                    # Use run_until_complete with internal timeout
                    task = loop.create_task(main_function())
                    loop.run_until_complete(asyncio.wait_for(task, timeout=30.0))
                    print("✅ main() completed successfully!")

                    loop.close()
                except asyncio.TimeoutError:
                    print("❌ main() timed out after 30 seconds!")
                    loop.close()
                    return []
                except Exception as e:
                    print(f"❌ Error in async main(): {e}")
                    loop.close()
                    return []
            else:
                print("🔧 main() is sync - calling directly...")
                main_function()
                print("✅ Sync main() completed!")

            # Look for results
            result_vars = [
                'df_lc', 'df_sc', 'results', 'final_results', 'all_results',
                'scanned_results', 'filtered_results', 'output', 'scan_output',
                'df', 'data', 'matched_stocks', 'matches', 'found_stocks',
                'lc_results', 'long_call_results', 'scan_results'
            ]

            found_results = []
            for var_name in result_vars:
                if var_name in exec_globals and exec_globals[var_name] is not None:
                    var_data = exec_globals[var_name]
                    if hasattr(var_data, 'to_dict'):  # pandas DataFrame
                        found_results = var_data.to_dict('records')
                        print(f"✅ Found {len(found_results)} results in DataFrame '{var_name}'")
                        break
                    elif isinstance(var_data, list) and len(var_data) > 0:
                        found_results = var_data
                        print(f"✅ Found {len(found_results)} results in list '{var_name}'")
                        break

            return found_results

        except Exception as e:
            print(f"❌ Sync execution error: {e}")
            import traceback
            traceback.print_exc()
            return []

    # Run with strict timeout
    try:
        print("🚀 Starting LC D2 execution with 60s timeout...")
        results = await asyncio.wait_for(
            asyncio.to_thread(run_lc_d2_sync),
            timeout=60.0
        )

        print(f"✅ LC D2 test completed: {len(results)} results")
        if results:
            print(f"📊 Sample result: {results[0]}")

    except asyncio.TimeoutError:
        print("❌ LC D2 test timed out after 60 seconds!")
        print("🎯 CONCLUSION: LC D2 scanner has an execution issue (likely infinite loop or blocking call)")
    except Exception as e:
        print(f"❌ LC D2 test failed: {e}")

if __name__ == "__main__":
    asyncio.run(test_lc_d2_minimal())