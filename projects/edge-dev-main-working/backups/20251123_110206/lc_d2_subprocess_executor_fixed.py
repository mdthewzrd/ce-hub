#!/usr/bin/env python3
"""
LC D2 Subprocess Executor - FIXED VERSION - Completely Isolated Execution
========================================================================

This executor runs LC D2 in a completely separate Python process to eliminate
all event loop conflicts and ensure proper result capture.

FIXED: Uses temporary file approach to avoid string escaping issues.
"""

import subprocess
import sys
import json
import tempfile
import os
from datetime import datetime
from typing import List, Dict, Any, Optional

async def execute_lc_d2_subprocess_fixed(
    scanner_code: str,
    start_date: str,
    end_date: str,
    progress_callback=None
) -> List[Dict[str, Any]]:
    """
    Execute LC D2 in a completely separate subprocess for total isolation
    FIXED: Uses temporary file approach to avoid string escaping issues

    Args:
        scanner_code: LC D2 scanner source code
        start_date: Start date in YYYY-MM-DD format
        end_date: End date in YYYY-MM-DD format
        progress_callback: Optional progress callback function

    Returns:
        List of result dictionaries from LC D2 execution
    """

    print(f"🚀 SUBPROCESS ISOLATION FIXED: Starting LC D2 in separate Python process")
    print(f"📅 Date range: {start_date} to {end_date}")

    if progress_callback:
        await progress_callback(10, "🔧 Setting up subprocess isolation for LC D2...")

    # Create temporary file for scanner code to avoid string escaping issues
    with tempfile.NamedTemporaryFile(mode='w', suffix='_scanner.py', delete=False) as scanner_file:
        scanner_file.write(scanner_code)
        scanner_code_path = scanner_file.name

    if progress_callback:
        await progress_callback(20, "💾 Creating isolated subprocess script...")

    # Create isolated execution script that loads from temporary file
    isolated_script = f'''
import asyncio
import sys
import os
import json
import pandas as pd
from datetime import datetime
import warnings
warnings.filterwarnings("ignore")

def main():
    """Main execution function for isolated LC D2 subprocess"""
    try:
        print("🚀 SUBPROCESS: Starting LC D2 in isolated Python process...")
        print(f"Python version: {{sys.version}}")
        print(f"Process ID: {{os.getpid()}}")

        # Check event loop status
        try:
            current_loop = asyncio.get_event_loop()
            print(f"⚠️ Found existing event loop: {{current_loop}}")
            print(f"   Loop is running: {{current_loop.is_running()}}")
        except RuntimeError:
            print("✅ No existing event loop - perfect for subprocess!")

        # Load scanner code from temporary file (avoids string escaping issues)
        scanner_code_path = "{scanner_code_path}"
        print(f"📂 Loading scanner code from: {{scanner_code_path}}")

        with open(scanner_code_path, 'r') as f:
            scanner_code = f.read()

        print(f"📊 Scanner code loaded: {{len(scanner_code)}} characters")

        # Set up execution environment
        exec_globals = {{'__name__': '__main__'}}

        # Clean up asyncio.run() calls to prevent conflicts
        processed_code = scanner_code
        if 'asyncio.run(' in processed_code:
            lines = processed_code.split('\\n')
            cleaned_lines = [line for line in lines if 'asyncio.run(' not in line]
            processed_code = '\\n'.join(cleaned_lines)
            print(f"🔧 Removed {{len(lines) - len(cleaned_lines)}} asyncio.run() lines")

        # Execute scanner code to load definitions
        print("🔧 Loading LC D2 definitions in subprocess...")
        exec(processed_code, exec_globals)
        print("✅ LC D2 definitions loaded successfully in subprocess")

        # Check if main function exists
        if 'main' not in exec_globals:
            print("❌ No main() function found in LC D2")
            return []

        main_function = exec_globals['main']
        print(f"✅ Found main() function: {{type(main_function)}}")
        print(f"   Is coroutine function: {{asyncio.iscoroutinefunction(main_function)}}")

        # Execute main function with proper event loop handling
        if asyncio.iscoroutinefunction(main_function):
            print("🔧 Executing async main() with new event loop...")

            # Create fresh event loop for clean execution
            loop = asyncio.new_event_loop()
            asyncio.set_event_loop(loop)

            try:
                # Execute in the fresh loop
                result = loop.run_until_complete(main_function())
                print("✅ LC D2 async main() executed successfully in subprocess!")
            finally:
                loop.close()
        else:
            print("🔧 Executing sync main() directly...")
            main_function()
            print("✅ LC D2 sync main() executed successfully in subprocess!")

        # Extract results from execution environment
        result_vars = ['df_lc', 'df_sc', 'results', 'final_results', 'all_results', 'lc_results']

        print(f"\\n📊 SUBPROCESS RESULT EXTRACTION:")
        extracted_results = []

        for var_name in result_vars:
            if var_name in exec_globals and exec_globals[var_name] is not None:
                var_data = exec_globals[var_name]
                if hasattr(var_data, 'shape'):  # pandas DataFrame
                    print(f"✅ Found DataFrame {{var_name}}: shape {{var_data.shape}}")
                    if len(var_data) > 0:
                        print(f"   📊 Columns: {{list(var_data.columns)}}")
                        try:
                            # Convert to records for JSON serialization
                            records = var_data.to_dict('records')
                            print(f"   🎯 Converted {{len(records)}} records")
                            extracted_results = records
                            break
                        except Exception as e:
                            print(f"   ⚠️ Error converting DataFrame: {{e}}")
                elif isinstance(var_data, list) and len(var_data) > 0:
                    print(f"✅ Found list {{var_name}}: {{len(var_data)}} items")
                    print(f"   🎯 Sample item: {{var_data[0]}}")
                    extracted_results = var_data
                    break
                else:
                    print(f"⚠️ {{var_name}}: {{type(var_data)}} with length {{len(var_data) if hasattr(var_data, '__len__') else 'N/A'}}")
            else:
                print(f"❌ {{var_name}}: Not found or None")

        # Final result summary
        print(f"\\n🎯 SUBPROCESS EXECUTION SUMMARY:")
        print(f"   📊 Results extracted: {{len(extracted_results)}}")

        if extracted_results:
            print(f"   🎉 SUCCESS: LC D2 subprocess captured {{len(extracted_results)}} results!")
            print(f"   🔥 Sample result: {{extracted_results[0]}}")
        else:
            print(f"   ⚠️ No results found - may be data/date range issue")

        # Output results as JSON for parent process
        results_output = {{
            'success': True,
            'results': extracted_results,
            'total_found': len(extracted_results),
            'execution_method': 'subprocess_isolation_fixed',
            'process_id': os.getpid()
        }}

        print("\\n📤 SUBPROCESS OUTPUT:")
        print(json.dumps(results_output, default=str))

        # Clean up temporary scanner file
        try:
            os.unlink(scanner_code_path)
            print(f"🧹 Cleaned up scanner temp file")
        except:
            pass

        return extracted_results

    except Exception as e:
        print(f"❌ SUBPROCESS ERROR: {{e}}")
        import traceback
        traceback.print_exc()

        error_output = {{
            'success': False,
            'error': str(e),
            'results': [],
            'total_found': 0,
            'execution_method': 'subprocess_isolation_fixed',
            'process_id': os.getpid()
        }}

        print("\\n📤 SUBPROCESS ERROR OUTPUT:")
        print(json.dumps(error_output, default=str))

        # Clean up temporary scanner file
        try:
            os.unlink("{scanner_code_path}")
        except:
            pass

        return []

if __name__ == "__main__":
    main()
'''

    if progress_callback:
        await progress_callback(30, "🚀 Launching LC D2 in separate Python process...")

    # Create temporary script file
    with tempfile.NamedTemporaryFile(mode='w', suffix='_subprocess.py', delete=False) as temp_script:
        temp_script.write(isolated_script)
        temp_script_path = temp_script.name

    try:
        print(f"🔧 Executing LC D2 subprocess: {temp_script_path}")
        print(f"📂 Scanner code file: {scanner_code_path}")

        # Execute in completely separate Python process
        result = subprocess.run(
            [sys.executable, temp_script_path],
            capture_output=True,
            text=True,
            timeout=300,  # 5 minute timeout
            cwd=os.getcwd(),
            env=os.environ.copy()
        )

        if progress_callback:
            await progress_callback(80, "📊 Processing subprocess results...")

        print(f"📊 Subprocess completed:")
        print(f"   Return code: {result.returncode}")
        print(f"   stdout length: {len(result.stdout)} chars")
        print(f"   stderr length: {len(result.stderr)} chars")

        # Parse subprocess output
        subprocess_results = []

        if result.returncode == 0:
            print("✅ Subprocess completed successfully")

            # Extract JSON output from subprocess stdout
            lines = result.stdout.split('\n')
            for line in lines:
                if line.strip().startswith('{') and 'results' in line:
                    try:
                        output_data = json.loads(line.strip())
                        if output_data.get('success'):
                            subprocess_results = output_data.get('results', [])
                            total_found = output_data.get('total_found', 0)
                            process_id = output_data.get('process_id', 'unknown')

                            print(f"🎉 SUBPROCESS SUCCESS:")
                            print(f"   📊 Results captured: {total_found}")
                            print(f"   🆔 Process ID: {process_id}")

                            if subprocess_results:
                                print(f"   🎯 Sample result: {subprocess_results[0]}")
                            break
                    except json.JSONDecodeError as e:
                        print(f"⚠️ JSON parse error: {e}")
                        continue

            if not subprocess_results:
                print("⚠️ No JSON results found in subprocess output")
                print("📋 Full subprocess stdout:")
                print(result.stdout[-1000:])  # Last 1000 chars
        else:
            print(f"❌ Subprocess failed with return code: {result.returncode}")
            if result.stderr:
                print(f"📋 Subprocess stderr:")
                print(result.stderr[-1000:])  # Last 1000 chars

        if progress_callback:
            await progress_callback(100, f"✅ Subprocess execution complete: {len(subprocess_results)} results")

        print(f"🎯 SUBPROCESS ISOLATION FIXED FINAL RESULT: {len(subprocess_results)} results extracted")
        return subprocess_results

    except subprocess.TimeoutExpired:
        print("⏰ Subprocess execution timed out after 5 minutes")
        if progress_callback:
            await progress_callback(100, "❌ Subprocess execution timed out")
        return []

    except Exception as e:
        print(f"❌ Subprocess execution failed: {e}")
        if progress_callback:
            await progress_callback(100, f"❌ Subprocess execution failed: {str(e)}")
        return []

    finally:
        # Clean up temporary files
        try:
            os.unlink(temp_script_path)
            os.unlink(scanner_code_path)
            print(f"🧹 Cleaned up temporary files")
        except:
            pass

# Test function
if __name__ == "__main__":
    print("🧪 Testing LC D2 Subprocess Executor FIXED...")

    # Load LC D2 scanner for testing
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            lc_d2_code = f.read()
        print(f"✅ LC D2 scanner loaded: {len(lc_d2_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load LC D2 scanner: {e}")
        sys.exit(1)

    # Test subprocess execution
    import asyncio

    async def run_test():
        async def test_progress(percent, message):
            print(f"📊 {percent:3d}% - {message}")

        start_time = datetime.now()

        try:
            results = await execute_lc_d2_subprocess_fixed(
                lc_d2_code,
                '2025-01-01',
                '2025-11-06',
                test_progress
            )

            execution_time = (datetime.now() - start_time).total_seconds()

            print(f"\n🎯 SUBPROCESS FIXED TEST RESULTS:")
            print(f"   📊 Results: {len(results)}")
            print(f"   ⏱️ Time: {execution_time:.1f}s")

            if results:
                print(f"   🎯 First result: {results[0]}")
                print(f"✅ SUCCESS: Subprocess isolation FIXED captured LC D2 results!")
            else:
                print(f"   ⚠️ No results returned - need further investigation")

        except Exception as e:
            print(f"❌ Test failed: {e}")
            import traceback
            traceback.print_exc()

    # Run the async test
    asyncio.run(run_test())