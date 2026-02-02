"""
Simple Scanner Executor for Scan EZ
Bypasses the complex bypass system for direct execution
"""

import asyncio
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from typing import List, Dict, Any
import io
import sys
import re

API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'
BASE_URL = 'https://api.polygon.io'


async def execute_scanner_simple(code: str, start_date: str, end_date: str) -> List[Dict]:
    """
    Simple scanner execution - just run the code and capture results
    """

    print(f"🚀 Simple scanner execution")
    print(f"📅 Date range: {start_date} to {end_date}")

    # Prepare execution environment
    exec_globals = {
        '__name__': '__main__',
        'pd': pd,
        'np': np,
        'requests': requests,
        'datetime': datetime,
        'timedelta': timedelta,
        'asyncio': asyncio,
        'print': print,  # Capture print output
    }

    # Inject date variables
    exec_globals['START_DATE'] = start_date
    exec_globals['END_DATE'] = end_date
    exec_globals['start_date'] = start_date
    exec_globals['end_date'] = end_date

    # Capture stdout
    old_stdout = sys.stdout
    sys.stdout = io.StringIO()

    try:
        # Execute the code
        exec(code, exec_globals)

        # Get captured output
        output = sys.stdout.getvalue()

        # Try to find results in globals
        result_vars = ['results', 'df', 'data', 'output', 'matches', 'signals']

        for var_name in result_vars:
            if var_name in exec_globals and exec_globals[var_name] is not None:
                var_data = exec_globals[var_name]

                if isinstance(var_data, list):
                    print(f"✅ Found {len(var_data)} results in '{var_name}'")
                    return var_data
                elif hasattr(var_data, 'to_dict'):  # DataFrame
                    results = var_data.to_dict('records')
                    print(f"✅ Found {len(results)} results in DataFrame '{var_name}'")
                    return results

        # If no results found, check if there's a main() function to call
        if 'main' in exec_globals and callable(exec_globals['main']):
            print("🎯 Calling main() function...")
            result = exec_globals['main']()
            if isinstance(result, list):
                print(f"✅ main() returned {len(result)} results")
                return result

        # No results found - return empty list
        print("⚠️ No results found in execution")
        return []

    except Exception as e:
        print(f"❌ Execution error: {e}")
        import traceback
        traceback.print_exc()
        return []

    finally:
        sys.stdout = old_stdout
