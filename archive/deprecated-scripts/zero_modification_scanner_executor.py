#!/usr/bin/env python3
"""
🚀 Zero-Modification Uploaded Scanner Executor
============================================

This executor runs uploaded scanners exactly as they would execute in VS Code,
preserving their original execution flow, threading, date logic, and output format.

Key Principle: Execute the scanner's `if __name__ == "__main__":` block naturally
without calling individual functions or modifying execution logic.
"""

import re
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
import threading
import time

class ZeroModificationExecutor:
    """
    Executes uploaded scanner code with absolute zero modifications to execution flow.
    Captures output from the scanner's natural execution.
    """

    def __init__(self):
        self.captured_output = []
        self.captured_dataframes = []
        self.execution_context = {}

    def detect_scanner_patterns(self, code: str) -> Dict[str, Any]:
        """
        Analyze the scanner code to understand its execution patterns
        without modifying them.
        """
        patterns = {
            'has_main_block': 'if __name__ == "__main__":' in code,
            'has_threading': any(pattern in code for pattern in ['ThreadPoolExecutor', 'threading', 'as_completed']),
            'has_symbols_list': 'SYMBOLS = [' in code,
            'has_scan_function': 'def scan_symbol(' in code,
            'prints_results': any(pattern in code for pattern in ['print(', '.to_string(', 'pd.set_option']),
            'has_date_filtering': any(pattern in code for pattern in ['PRINT_FROM', 'PRINT_TO', 'pd.to_datetime']),
            'concatenates_results': 'pd.concat(' in code,
        }

        # Extract SYMBOLS if available
        symbols_match = re.search(r'SYMBOLS\s*=\s*\[(.*?)\]', code, re.DOTALL)
        if symbols_match:
            symbols_content = symbols_match.group(1)
            symbols = re.findall(r'[\'"]([^\'"]+)[\'"]', symbols_content)
            patterns['symbols'] = symbols
        else:
            patterns['symbols'] = []

        return patterns

    def modify_code_for_capture(self, code: str, start_date: str, end_date: str) -> str:
        """
        Make minimal modifications to capture results while preserving execution flow.
        Only modifies date variables and adds result capture - nothing else.
        """
        modified_code = code

        # 1. Override date variables to respect our date range
        # Replace fetch_start and fetch_end assignments with more precise patterns
        fetch_start_pattern = r'fetch_start\s*=\s*["\'][^"\']*["\']'
        fetch_end_pattern = r'fetch_end\s*=\s*datetime\.today\(\)\.strftime\(["\']%Y-%m-%d["\']\)'

        modified_code = re.sub(fetch_start_pattern, f'fetch_start = "{start_date}"', modified_code)
        modified_code = re.sub(fetch_end_pattern, f'fetch_end = "{end_date}"', modified_code)

        # 2. Override PRINT_FROM and PRINT_TO if they exist
        print_from_pattern = r'PRINT_FROM\s*=\s*["\'][^"\']*["\']'
        print_to_pattern = r'PRINT_TO\s*=\s*None'

        modified_code = re.sub(print_from_pattern, f'PRINT_FROM = "{start_date}"', modified_code)
        modified_code = re.sub(print_to_pattern, f'PRINT_TO = "{end_date}"', modified_code)

        # 3. Add result capture at the end of main block
        # Find the main block and add our capture logic
        main_block_start = modified_code.find('if __name__ == "__main__":')
        if main_block_start != -1:
            # Find the end of the main block by looking for the last print or assignment
            lines = modified_code[main_block_start:].split('\n')
            main_block_lines = []

            for i, line in enumerate(lines):
                if i == 0 or line.startswith('    ') or line.startswith('\t') or line.strip() == '':
                    main_block_lines.append(line)
                else:
                    break

            # Add our capture logic before the last print statements
            capture_code = '''
    # ZERO-MODIFICATION CAPTURE: Store results for external access
    if 'out' in locals() and not out.empty:
        # Store the final results DataFrame in a global variable for capture
        globals()['__CAPTURED_RESULTS__'] = out.copy()
    else:
        globals()['__CAPTURED_RESULTS__'] = pd.DataFrame()
'''

            # Insert capture code before the final print statements
            insert_index = -1
            for i in range(len(main_block_lines) - 1, -1, -1):
                line = main_block_lines[i].strip()
                if line.startswith('print(') or 'to_string(' in line:
                    insert_index = i
                    break

            if insert_index > 0:
                main_block_lines.insert(insert_index, capture_code)
            else:
                # If no print found, add at the end
                main_block_lines.append(capture_code)

            # Reconstruct the code
            before_main = modified_code[:main_block_start]
            after_main_start = main_block_start + len(modified_code[main_block_start:].split('\n')[0]) + 1
            rest_of_code = modified_code[after_main_start:]

            # Find where the main block ends
            main_end = 0
            for i, line in enumerate(rest_of_code.split('\n')):
                if line.strip() and not (line.startswith('    ') or line.startswith('\t')):
                    main_end = sum(len(l) + 1 for l in rest_of_code.split('\n')[:i])
                    break

            if main_end == 0:
                main_end = len(rest_of_code)

            reconstructed_main = '\n'.join(main_block_lines[:-len(rest_of_code[main_end:].split('\n'))])
            modified_code = before_main + reconstructed_main + rest_of_code[main_end:]

        return modified_code

    async def execute_scanner_naturally(self, code: str, start_date: str, end_date: str, progress_callback=None) -> List[Dict]:
        """
        Execute the scanner exactly as it would run in VS Code - zero modifications
        to execution flow, only minimal changes for result capture.
        """
        temp_file_path = None
        original_stdout = sys.stdout
        original_stderr = sys.stderr

        try:
            if progress_callback:
                await progress_callback({"progress_percent": 5, "message": "🔍 Zero-mod: Analyzing scanner patterns..."})

            # Analyze the scanner without modifying it
            patterns = self.detect_scanner_patterns(code)

            if not patterns['has_main_block']:
                raise Exception("Scanner must have 'if __name__ == \"__main__\":' block for zero-modification execution")

            if progress_callback:
                await progress_callback({"progress_percent": 15, "message": "🔧 Zero-mod: Preparing minimal modifications..."})

            # Make minimal modifications only for date range and result capture
            modified_code = self.modify_code_for_capture(code, start_date, end_date)

            if progress_callback:
                await progress_callback({"progress_percent": 25, "message": "📝 Zero-mod: Creating temporary scanner file..."})

            # Validate syntax
            try:
                ast.parse(modified_code)
            except SyntaxError as e:
                raise Exception(f"Syntax error in modified code: {str(e)}")

            # Create temporary file
            with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
                temp_file.write(modified_code)
                temp_file_path = temp_file.name

            if progress_callback:
                await progress_callback({"progress_percent": 35, "message": "🚀 Zero-mod: Executing scanner naturally..."})

            # Capture stdout to get printed results
            captured_output = io.StringIO()

            # Execute the scanner in its natural way
            old_path = sys.path.copy()
            sys.path.insert(0, os.path.dirname(temp_file_path))

            try:
                # Load and execute the module naturally
                spec = importlib.util.spec_from_file_location("natural_scanner", temp_file_path)
                scanner_module = importlib.util.module_from_spec(spec)

                # Set up the module environment to mimic natural execution
                scanner_module.__name__ = "__main__"  # Critical: This makes the main block execute

                old_module = sys.modules.get("natural_scanner")
                sys.modules["natural_scanner"] = scanner_module

                if progress_callback:
                    await progress_callback({"progress_percent": 50, "message": "⚡ Zero-mod: Scanner running with original logic..."})

                # Execute the module - this will run the if __name__ == "__main__": block naturally
                with contextlib.redirect_stdout(captured_output):
                    with contextlib.redirect_stderr(captured_output):
                        spec.loader.exec_module(scanner_module)

                if progress_callback:
                    await progress_callback({"progress_percent": 80, "message": "📊 Zero-mod: Extracting results from execution..."})

                # Extract results from the global variable we added
                results = []
                if hasattr(scanner_module, '__CAPTURED_RESULTS__'):
                    captured_df = scanner_module.__CAPTURED_RESULTS__
                    if not captured_df.empty:
                        # Convert to standard format
                        results = captured_df.to_dict('records')

                # If no results captured via global, try to parse from output
                if not results:
                    output_text = captured_output.getvalue()
                    if output_text:
                        # Try to extract information from printed output
                        # This is a fallback for scanners that only print results
                        lines = output_text.split('\n')
                        for line in lines:
                            if 'hits:' in line.lower() or 'results:' in line.lower():
                                print(f"Scanner output: {line}")

                if progress_callback:
                    await progress_callback({"progress_percent": 90, "message": f"✅ Zero-mod: Extracted {len(results)} results"})

                # Filter and standardize results
                if results:
                    filtered_results = []
                    start_dt = pd.to_datetime(start_date)
                    end_dt = pd.to_datetime(end_date)

                    for result in results:
                        # Get date from various possible field names
                        date_field = result.get('Date') or result.get('date') or result.get('DATE')
                        if date_field:
                            result_date = pd.to_datetime(date_field)
                            if start_dt <= result_date <= end_dt:
                                # Standardize format
                                standardized = {
                                    'ticker': result.get('Ticker') or result.get('ticker') or result.get('TICKER', ''),
                                    'date': result_date.strftime('%Y-%m-%d'),
                                    'scan_type': 'uploaded_zero_mod'
                                }
                                # Add all other fields
                                for key, value in result.items():
                                    if key.lower() not in ['ticker', 'date']:
                                        standardized[key] = value
                                filtered_results.append(standardized)

                    results = filtered_results

                if progress_callback:
                    await progress_callback({"progress_percent": 100, "message": f"🎉 Zero-mod complete: {len(results)} final results"})

                return results

            finally:
                # Restore module state
                if old_module:
                    sys.modules["natural_scanner"] = old_module
                else:
                    sys.modules.pop("natural_scanner", None)
                sys.path = old_path

        except Exception as e:
            if progress_callback:
                await progress_callback({"progress_percent": 100, "message": f"❌ Zero-mod execution failed: {str(e)}"})
            raise Exception(f"Zero-modification execution failed: {str(e)}")

        finally:
            # Cleanup
            if temp_file_path and os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

# Main interface function
async def execute_uploaded_scanner_zero_mod(code: str, start_date: str, end_date: str, progress_callback=None) -> List[Dict]:
    """
    Main interface for zero-modification scanner execution.
    """
    executor = ZeroModificationExecutor()
    return await executor.execute_scanner_naturally(code, start_date, end_date, progress_callback)

if __name__ == "__main__":
    # Test with the backside para scanner
    import asyncio

    async def test_zero_mod():
        print("🧪 Testing Zero-Modification Execution")
        print("=" * 50)

        # Load the backside para scanner
        backside_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
        try:
            with open(backside_path, 'r') as f:
                code = f.read()
            print(f"✅ Loaded scanner: {len(code)} characters")
        except Exception as e:
            print(f"❌ Failed to load scanner: {e}")
            return

        # Progress callback
        async def progress(data):
            print(f"Progress: {data['progress_percent']}% - {data['message']}")

        # Execute with zero modification
        try:
            results = await execute_uploaded_scanner_zero_mod(
                code,
                "2025-01-01",
                "2025-11-02",
                progress
            )

            print(f"\n🎉 ZERO-MOD RESULTS: {len(results)} total")
            if results:
                for i, result in enumerate(results[:10]):  # Show first 10
                    print(f"   {i+1}. {result.get('date', 'No date')} - {result.get('ticker', 'No ticker')}")
            else:
                print("❌ No results - this indicates an issue with execution")

        except Exception as e:
            print(f"❌ Zero-mod execution failed: {e}")
            import traceback
            traceback.print_exc()

    asyncio.run(test_zero_mod())