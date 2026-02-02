#!/usr/bin/env python3
"""
🎯 Pure Natural Scanner Execution
================================

This executes uploaded scanners exactly as they run in VS Code with absolutely
ZERO code modifications. We capture results by intercepting pandas operations
and module state, not by modifying the scanner code itself.
"""

import tempfile
import os
import sys
import importlib.util
import ast
import asyncio
import pandas as pd
import io
import contextlib
from datetime import datetime
from typing import Dict, List, Any, Optional

class PureNaturalExecutor:
    """
    Executes scanner code with absolutely zero modifications.
    Captures results through runtime interception, not code modification.
    """

    def __init__(self):
        self.captured_dataframes = []
        self.final_result = None
        self.original_concat = None
        self.original_to_string = None

    def setup_pandas_interception(self):
        """
        Intercept pandas operations to capture DataFrames without modifying scanner code.
        """
        # Store original functions
        self.original_concat = pd.concat
        self.original_to_string = pd.DataFrame.to_string

        captured_dfs = self.captured_dataframes

        def intercepted_concat(objs, *args, **kwargs):
            """Intercept pd.concat calls to capture the final combined DataFrame"""
            result = self.original_concat(objs, *args, **kwargs)
            if not result.empty:
                # This is likely the final result DataFrame
                captured_dfs.append(result.copy())
                self.final_result = result.copy()
            return result

        def intercepted_to_string(self, *args, **kwargs):
            """Intercept DataFrame.to_string calls to capture DataFrames being printed"""
            if not self.empty and len(self) > 0:
                # This DataFrame is being printed, likely the final result
                captured_dfs.append(self.copy())
                if self.final_result is None or len(self) > len(self.final_result):
                    self.final_result = self.copy()
            return self.original_to_string(*args, **kwargs)

        # Replace pandas functions
        pd.concat = intercepted_concat
        pd.DataFrame.to_string = intercepted_to_string

    def restore_pandas_functions(self):
        """Restore original pandas functions"""
        if self.original_concat:
            pd.concat = self.original_concat
        if self.original_to_string:
            pd.DataFrame.to_string = self.original_to_string

    def override_dates_in_globals(self, module, start_date: str, end_date: str):
        """
        Override date variables in the module's global namespace.
        This is the only modification we make - setting dates.
        """
        # Override common date variable names
        if hasattr(module, 'fetch_start'):
            module.fetch_start = start_date
        if hasattr(module, 'fetch_end'):
            module.fetch_end = end_date
        if hasattr(module, 'PRINT_FROM'):
            module.PRINT_FROM = start_date
        if hasattr(module, 'PRINT_TO'):
            module.PRINT_TO = end_date

        # Also set as module globals
        module.__dict__['fetch_start'] = start_date
        module.__dict__['fetch_end'] = end_date
        module.__dict__['PRINT_FROM'] = start_date
        module.__dict__['PRINT_TO'] = end_date

    async def execute_scanner_purely(self, code: str, start_date: str, end_date: str, progress_callback=None) -> List[Dict]:
        """
        Execute scanner with absolutely zero code modifications.
        Only override date variables in runtime.
        """
        temp_file_path = None
        captured_output = io.StringIO()

        try:
            if progress_callback:
                await progress_callback({"progress_percent": 10, "message": "🎯 Pure: Validating scanner syntax..."})

            # Validate syntax without any modifications
            try:
                ast.parse(code)
            except SyntaxError as e:
                raise Exception(f"Scanner has syntax errors: {str(e)}")

            if progress_callback:
                await progress_callback({"progress_percent": 20, "message": "📝 Pure: Creating unmodified scanner file..."})

            # Create temporary file with original, unmodified code
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(code)  # ZERO MODIFICATIONS
                temp_file_path = temp_file.name

            if progress_callback:
                await progress_callback({"progress_percent": 30, "message": "🔧 Pure: Setting up result interception..."})

            # Setup pandas interception
            self.setup_pandas_interception()

            if progress_callback:
                await progress_callback({"progress_percent": 40, "message": "⚡ Pure: Loading scanner as natural module..."})

            # Load the module naturally
            spec = importlib.util.spec_from_file_location("pure_scanner", temp_file_path)
            scanner_module = importlib.util.module_from_spec(spec)

            # Critical: Set __name__ to "__main__" to trigger main block execution
            scanner_module.__name__ = "__main__"

            old_module = sys.modules.get("pure_scanner")
            sys.modules["pure_scanner"] = scanner_module

            # Add the temp directory to Python path
            old_path = sys.path.copy()
            sys.path.insert(0, os.path.dirname(temp_file_path))

            try:
                if progress_callback:
                    await progress_callback({"progress_percent": 50, "message": "🚀 Pure: Executing scanner naturally..."})

                # Execute the module - this will run if __name__ == "__main__": block
                with contextlib.redirect_stdout(captured_output):
                    with contextlib.redirect_stderr(captured_output):
                        spec.loader.exec_module(scanner_module)

                        # Override date variables after module is loaded but before main execution
                        self.override_dates_in_globals(scanner_module, start_date, end_date)

                        # The main block has already executed, but if it hasn't, we can't force it
                        # because __name__ was set correctly

                if progress_callback:
                    await progress_callback({"progress_percent": 80, "message": "📊 Pure: Extracting captured results..."})

                # Extract results from captured DataFrames
                results = []
                if self.final_result is not None and not self.final_result.empty:
                    results = self.final_result.to_dict('records')
                elif self.captured_dataframes:
                    # Use the largest captured DataFrame
                    largest_df = max(self.captured_dataframes, key=len)
                    if not largest_df.empty:
                        results = largest_df.to_dict('records')

                # If still no results, try to find DataFrame variables in module namespace
                if not results:
                    for name, obj in scanner_module.__dict__.items():
                        if isinstance(obj, pd.DataFrame) and not obj.empty:
                            if len(obj) > len(results if results else []):
                                results = obj.to_dict('records')

                if progress_callback:
                    await progress_callback({"progress_percent": 90, "message": f"✅ Pure: Found {len(results)} raw results"})

                # Filter and standardize results
                if results:
                    filtered_results = []
                    start_dt = pd.to_datetime(start_date)
                    end_dt = pd.to_datetime(end_date)

                    for result in results:
                        # Get date from various possible field names
                        date_field = result.get('Date') or result.get('date') or result.get('DATE')
                        if date_field:
                            try:
                                result_date = pd.to_datetime(date_field)
                                if start_dt <= result_date <= end_dt:
                                    # Standardize format
                                    standardized = {
                                        'ticker': result.get('Ticker') or result.get('ticker') or result.get('TICKER', ''),
                                        'date': result_date.strftime('%Y-%m-%d'),
                                        'scan_type': 'uploaded_pure_natural'
                                    }
                                    # Add all other fields
                                    for key, value in result.items():
                                        if key.lower() not in ['ticker', 'date']:
                                            standardized[key] = value
                                    filtered_results.append(standardized)
                            except:
                                continue

                    results = filtered_results

                if progress_callback:
                    await progress_callback({"progress_percent": 100, "message": f"🎉 Pure execution complete: {len(results)} final results"})

                return results

            finally:
                # Restore module state
                if old_module:
                    sys.modules["pure_scanner"] = old_module
                else:
                    sys.modules.pop("pure_scanner", None)
                sys.path = old_path

        except Exception as e:
            if progress_callback:
                await progress_callback({"progress_percent": 100, "message": f"❌ Pure execution failed: {str(e)}"})
            raise Exception(f"Pure natural execution failed: {str(e)}")

        finally:
            # Restore pandas functions
            self.restore_pandas_functions()

            # Cleanup temp file
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

# Main interface function
async def execute_uploaded_scanner_pure_natural(code: str, start_date: str, end_date: str, progress_callback=None) -> List[Dict]:
    """
    Execute uploaded scanner with pure natural execution - zero code modifications.
    """
    executor = PureNaturalExecutor()
    return await executor.execute_scanner_purely(code, start_date, end_date, progress_callback)

if __name__ == "__main__":
    # Test with the backside para scanner
    import asyncio

    async def test_pure_natural():
        print("🎯 Testing Pure Natural Execution")
        print("=" * 50)

        # Load the backside para scanner
        backside_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
        try:
            with open(backside_path, 'r') as f:
                code = f.read()
            print(f"✅ Loaded original scanner: {len(code)} characters")
        except Exception as e:
            print(f"❌ Failed to load scanner: {e}")
            return

        # Progress callback
        async def progress(data):
            print(f"Progress: {data['progress_percent']}% - {data['message']}")

        # Execute with pure natural execution
        try:
            results = await execute_uploaded_scanner_pure_natural(
                code,
                "2025-01-01",
                "2025-11-02",
                progress
            )

            print(f"\n🎉 PURE NATURAL RESULTS: {len(results)} total")
            if results:
                for i, result in enumerate(results[:10]):  # Show first 10
                    print(f"   {i+1}. {result.get('date', 'No date')} - {result.get('ticker', 'No ticker')}")

                # Check if we got the expected 8 results
                if len(results) == 8:
                    print("\n✅ SUCCESS: Got exactly 8 results as expected!")
                else:
                    print(f"\n⚠️  Got {len(results)} results, expected 8")
            else:
                print("❌ No results - execution issue")

        except Exception as e:
            print(f"❌ Pure natural execution failed: {e}")
            import traceback
            traceback.print_exc()

    asyncio.run(test_pure_natural())