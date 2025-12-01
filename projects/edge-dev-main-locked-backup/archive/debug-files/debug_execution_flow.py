#!/usr/bin/env python3
"""
🔧 Deep debug of half A+ scanner execution flow
"""

import tempfile
import os
import sys
import importlib.util
import pandas as pd
from datetime import datetime

def debug_half_a_plus_execution():
    """Debug the exact execution flow step by step"""
    print("🔧 DEEP DEBUGGING: Half A+ Scanner Execution Flow")
    print("=" * 70)

    # Read the scanner
    scanner_file = "/Users/michaeldurante/Downloads/half A+ scan copy.py"
    try:
        with open(scanner_file, 'r') as f:
            code = f.read()
    except FileNotFoundError:
        print(f"❌ Could not find scanner file: {scanner_file}")
        return False

    print(f"📄 Code loaded: {len(code)} characters")

    # Step 1: Test module loading
    print(f"\n🔧 Step 1: Testing module loading...")
    temp_file_path = None

    try:
        # Create temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(code)
            temp_file_path = temp_file.name

        # Load as module
        spec = importlib.util.spec_from_file_location("uploaded_scanner", temp_file_path)
        uploaded_module = importlib.util.module_from_spec(spec)

        old_module = sys.modules.get("uploaded_scanner")
        sys.modules["uploaded_scanner"] = uploaded_module

        try:
            spec.loader.exec_module(uploaded_module)
            print(f"✅ Module loaded successfully")
        except Exception as e:
            print(f"❌ Module loading failed: {e}")
            return False

        # Step 2: Check what's available in module scope
        print(f"\n🔧 Step 2: Checking module attributes...")

        has_fetch_and_scan = hasattr(uploaded_module, 'fetch_and_scan')
        has_symbols_lower = hasattr(uploaded_module, 'symbols')
        has_SYMBOLS_upper = hasattr(uploaded_module, 'SYMBOLS')
        has_custom_params = hasattr(uploaded_module, 'custom_params')

        print(f"   fetch_and_scan function: {has_fetch_and_scan}")
        print(f"   symbols (lowercase): {has_symbols_lower}")
        print(f"   SYMBOLS (uppercase): {has_SYMBOLS_upper}")
        print(f"   custom_params: {has_custom_params}")

        # Step 3: Test pattern detection logic
        print(f"\n🔧 Step 3: Testing pattern detection logic...")

        # Replicate the exact pattern detection from the bypass
        scanner_pattern = None

        if hasattr(uploaded_module, 'scan_symbol') and hasattr(uploaded_module, 'SYMBOLS'):
            scanner_pattern = "Pattern 1: scan_symbol_SYMBOLS"
        elif hasattr(uploaded_module, 'fetch_and_scan') and (
            hasattr(uploaded_module, 'symbols') or
            hasattr(uploaded_module, 'SYMBOLS') or
            'symbols = [' in code or
            'SYMBOLS = [' in code
        ):
            scanner_pattern = "Pattern 2: fetch_and_scan_symbols"
        else:
            scanner_pattern = "Other pattern or fallback"

        print(f"   Detected pattern: {scanner_pattern}")

        # Step 4: Test main block execution
        print(f"\n🔧 Step 4: Testing main block execution...")

        if scanner_pattern == "Pattern 2: fetch_and_scan_symbols":
            symbols = getattr(uploaded_module, 'symbols', None) or getattr(uploaded_module, 'SYMBOLS', [])

            if not symbols:
                print(f"   🔧 No symbols in module scope, executing main block...")
                try:
                    exec_globals = {'__name__': '__main__'}
                    exec(code, exec_globals)

                    symbols = exec_globals.get('symbols', [])
                    custom_params = exec_globals.get('custom_params', {})

                    print(f"   ✅ Extracted from main block:")
                    print(f"      - symbols: {len(symbols)} items")
                    print(f"      - custom_params: {len(custom_params)} items")

                    if symbols:
                        print(f"      - Sample symbols: {symbols[:5]}")
                    if custom_params:
                        print(f"      - Sample params: {list(custom_params.keys())[:5]}")

                except Exception as e:
                    print(f"   ❌ Main block execution failed: {e}")
                    return False
            else:
                print(f"   ✅ Found symbols in module scope: {len(symbols)} items")
                custom_params = getattr(uploaded_module, 'custom_params', {})

            # Step 5: Test fetch_and_scan function
            print(f"\n🔧 Step 5: Testing fetch_and_scan function...")

            if len(symbols) > 0:
                test_symbol = symbols[0]
                print(f"   Testing with symbol: {test_symbol}")

                try:
                    # Test the function call
                    result_tuples = uploaded_module.fetch_and_scan(
                        test_symbol,
                        "2024-11-01",
                        "2024-11-30",
                        custom_params
                    )

                    print(f"   ✅ Function call successful")
                    print(f"   📊 Result type: {type(result_tuples)}")
                    print(f"   📊 Result length: {len(result_tuples) if result_tuples else 0}")

                    if result_tuples:
                        print(f"   📈 Sample results: {result_tuples[:3]}")
                        return True
                    else:
                        print(f"   ⚠️  Function returned no results for {test_symbol}")

                        # Test with multiple symbols
                        print(f"   🔧 Testing with first 5 symbols...")
                        total_results = 0
                        for i, symbol in enumerate(symbols[:5]):
                            try:
                                results = uploaded_module.fetch_and_scan(symbol, "2024-01-01", "2024-12-31", custom_params)
                                if results:
                                    total_results += len(results)
                                    print(f"      {symbol}: {len(results)} results")
                                else:
                                    print(f"      {symbol}: 0 results")
                            except Exception as e:
                                print(f"      {symbol}: Error - {e}")

                        print(f"   📊 Total results from 5 symbols: {total_results}")
                        return total_results > 0

                except Exception as e:
                    print(f"   ❌ Function call failed: {e}")
                    print(f"   🔧 This explains why the backend execution is failing!")
                    return False
            else:
                print(f"   ❌ No symbols available for testing")
                return False
        else:
            print(f"   ⚠️  Not Pattern 2, testing other patterns...")
            return False

    finally:
        # Cleanup
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.unlink(temp_file_path)
            except:
                pass

        # Restore modules
        if old_module:
            sys.modules["uploaded_scanner"] = old_module
        else:
            sys.modules.pop("uploaded_scanner", None)

if __name__ == "__main__":
    success = debug_half_a_plus_execution()
    print(f"\n📋 Deep Debug Result: {'✅ IDENTIFIED ISSUE' if success else '❌ EXECUTION PROBLEM CONFIRMED'}")

    if not success:
        print(f"\n🎯 FINDINGS:")
        print(f"   This debug shows exactly where the execution is failing")
        print(f"   Use this information to fix the Pattern 2 execution logic")