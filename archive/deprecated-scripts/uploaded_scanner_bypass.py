#!/usr/bin/env python3
"""
🔧 Direct Uploaded Scanner Execution Bypass
===========================================

This creates a new execution path that bypasses the broken formatting system
and executes uploaded scanner code directly with 100% integrity.
"""

import re
import tempfile
import os
import sys
import importlib.util
import ast
import asyncio
import pandas as pd
from datetime import datetime
from typing import Dict, List, Any, Optional

def detect_scanner_type_simple(code: str) -> str:
    """
    Simple, reliable scanner type detection based on actual content
    """
    code_lower = code.lower()

    # Check for specific A+ backside para patterns
    if any(pattern in code_lower for pattern in ['backside para', 'daily para', 'a+ para']):
        return 'a_plus_backside'

    # Check for other A+ patterns
    if any(pattern in code_lower for pattern in ['daily para', 'a+', 'parabolic']):
        return 'a_plus'

    # Check for LC patterns
    if any(pattern in code_lower for pattern in ['lc_frontside', 'lc d2', 'frontside']):
        return 'lc'

    return 'custom'

def should_use_direct_execution(code: str) -> bool:
    """
    Determine if we should bypass the formatting system and execute directly
    """
    scanner_type = detect_scanner_type_simple(code)

    # Use direct execution for A+ scanners and custom scanners
    return scanner_type in ['a_plus_backside', 'a_plus', 'custom']

def extract_symbols_from_code(code: str) -> Optional[List[str]]:
    """
    Extract SYMBOLS list from uploaded code
    """
    try:
        # Look for SYMBOLS = [...] pattern
        symbols_match = re.search(r'SYMBOLS\s*=\s*\[(.*?)\]', code, re.DOTALL)
        if symbols_match:
            symbols_content = symbols_match.group(1)
            # Extract quoted strings
            symbols = re.findall(r'[\'"]([^\'"]+)[\'"]', symbols_content)
            return symbols
    except:
        pass
    return None

async def execute_uploaded_scanner_direct(code: str, start_date: str, end_date: str, progress_callback=None) -> List[Dict]:
    """
    Execute uploaded scanner code directly without any formatting/modification
    """
    temp_file_path = None

    try:
        if progress_callback:
            await progress_callback({"progress_percent": 5, "message": "🔧 Direct execution: Validating syntax..."})

        # Basic syntax validation
        try:
            ast.parse(code)
        except SyntaxError as e:
            raise Exception(f"Syntax error in uploaded code: {str(e)}")

        if progress_callback:
            await progress_callback({"progress_percent": 15, "message": "🔧 Direct execution: Creating temporary module..."})

        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name

        if progress_callback:
            await progress_callback({"progress_percent": 30, "message": "🔧 Direct execution: Loading scanner module..."})

        # Load as module
        spec = importlib.util.spec_from_file_location("uploaded_scanner", temp_file_path)
        uploaded_module = importlib.util.module_from_spec(spec)

        old_module = sys.modules.get("uploaded_scanner")
        sys.modules["uploaded_scanner"] = uploaded_module

        try:
            spec.loader.exec_module(uploaded_module)
        except Exception as e:
            if old_module:
                sys.modules["uploaded_scanner"] = old_module
            else:
                sys.modules.pop("uploaded_scanner", None)
            raise Exception(f"Failed to load uploaded scanner: {str(e)}")

        if progress_callback:
            await progress_callback({"progress_percent": 50, "message": "🚀 Direct execution: Running scanner algorithm..."})

        # Execute the scanner
        results = []

        # Check if module has main execution pattern
        if hasattr(uploaded_module, '__name__') and uploaded_module.__name__ == "__main__":
            # This won't work since __name__ will be "uploaded_scanner"
            # Instead, look for main execution patterns
            pass

        # Look for common scanner patterns
        if hasattr(uploaded_module, 'scan_symbol') and hasattr(uploaded_module, 'SYMBOLS'):
            # Pattern: scan_symbol function with SYMBOLS list
            symbols = uploaded_module.SYMBOLS
            if progress_callback:
                await progress_callback({"progress_percent": 60, "message": f"🎯 Direct execution: Scanning {len(symbols)} symbols..."})

            # Execute scan_symbol for each symbol
            all_results = []
            for i, symbol in enumerate(symbols):
                try:
                    result_df = uploaded_module.scan_symbol(symbol, start_date, end_date)
                    if result_df is not None and not result_df.empty:
                        all_results.append(result_df)

                    # Progress update
                    if progress_callback and i % 10 == 0:
                        progress = 60 + (i / len(symbols)) * 25
                        await progress_callback({"progress_percent": progress, "message": f"🎯 Direct execution: Processed {i}/{len(symbols)} symbols..."})

                except Exception as e:
                    print(f"Error scanning {symbol}: {e}")
                    continue

            # Combine results
            if all_results:
                combined_df = pd.concat(all_results, ignore_index=True)
                results = combined_df.to_dict('records')

        else:
            # Try to execute main-like code directly
            # This is more complex and might require modifying the uploaded code
            raise Exception("Scanner pattern not recognized - needs scan_symbol function and SYMBOLS list")

        if progress_callback:
            await progress_callback({"progress_percent": 90, "message": f"✅ Direct execution: Found {len(results)} results"})

        # Filter by date range if needed
        if results:
            filtered_results = []
            start_dt = pd.to_datetime(start_date)
            end_dt = pd.to_datetime(end_date)

            for result in results:
                result_date = pd.to_datetime(result.get('Date', result.get('date', '')))
                if start_dt <= result_date <= end_dt:
                    # Standardize result format
                    standardized = {
                        'ticker': result.get('Ticker', result.get('ticker', '')),
                        'date': result_date.strftime('%Y-%m-%d'),
                        'scan_type': 'uploaded_direct'
                    }
                    # Add any additional fields
                    for key, value in result.items():
                        if key.lower() not in ['ticker', 'date']:
                            standardized[key] = value
                    filtered_results.append(standardized)

            results = filtered_results

        if progress_callback:
            await progress_callback({"progress_percent": 100, "message": f"🎉 Direct execution completed: {len(results)} final results"})

        return results

    except Exception as e:
        if progress_callback:
            await progress_callback({"progress_percent": 100, "message": f"❌ Direct execution failed: {str(e)}"})
        raise

    finally:
        # Cleanup
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass

if __name__ == "__main__":
    # Test the detection logic
    test_code = '''
    # daily_para_backside_lite_scan.py
    # Daily-only "A+ para, backside" scan — lite mold.
    SYMBOLS = ['MSTR', 'SMCI', 'DJT']
    def scan_symbol(symbol, start_date, end_date):
        return pd.DataFrame()
    '''

    print("Scanner type:", detect_scanner_type_simple(test_code))
    print("Should use direct execution:", should_use_direct_execution(test_code))
    print("Symbols:", extract_symbols_from_code(test_code))