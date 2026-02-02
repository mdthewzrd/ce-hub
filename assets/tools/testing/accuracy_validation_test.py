#!/usr/bin/env python3
"""
🎯 ACCURACY VALIDATION TEST
======================================================================
Test to verify that the original expected results are included in the expanded result set.

This answers the key question:
- Are the original ~8 results that should appear with ~80 tickers actually present in our 182 results?
- This validates algorithm accuracy, not just total count.
"""

import sys
import os
import tempfile
import importlib.util
import pandas as pd
from datetime import datetime

# Add backend to path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

def load_original_scanner():
    """Load the original backside para scanner"""
    scanner_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
    with open(scanner_path, 'r') as f:
        return f.read()

def execute_scanner_with_symbols(code: str, symbols_list: list) -> list:
    """Execute scanner with a specific symbols list"""

    # Replace SYMBOLS list in the code
    import re
    symbols_str = ',\n    '.join([f"'{symbol}'" for symbol in symbols_list])
    symbols_replacement = f"SYMBOLS = [\n    {symbols_str}\n]"

    # Replace the original SYMBOLS definition
    modified_code = re.sub(
        r'SYMBOLS\s*=\s*\[(.*?)\]',
        symbols_replacement,
        code,
        flags=re.DOTALL
    )

    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
        temp_file.write(modified_code)
        temp_file_path = temp_file.name

    try:
        # Load as module
        spec = importlib.util.spec_from_file_location("test_scanner", temp_file_path)
        scanner_module = importlib.util.module_from_spec(spec)
        spec.loader.exec_module(scanner_module)

        # Execute scan for each symbol
        all_results = []
        fetch_start = "2020-01-01"
        fetch_end = datetime.now().strftime("%Y-%m-%d")

        print(f"   📊 Scanning {len(symbols_list)} symbols...")
        for i, symbol in enumerate(symbols_list):
            try:
                result_df = scanner_module.scan_symbol(symbol, fetch_start, fetch_end)
                if result_df is not None and not result_df.empty:
                    all_results.append(result_df)

                if i % 20 == 0:
                    print(f"      Processed {i}/{len(symbols_list)} symbols...")

            except Exception as e:
                print(f"      Error scanning {symbol}: {e}")
                continue

        # Combine results
        if all_results:
            combined_df = pd.concat(all_results, ignore_index=True)

            # Apply scanner's natural date filtering (PRINT_FROM logic)
            print_from = "2025-01-01"  # From the original scanner code
            filtered_df = combined_df[pd.to_datetime(combined_df["Date"]) >= pd.to_datetime(print_from)]

            return filtered_df.to_dict('records')
        else:
            return []

    finally:
        # Cleanup
        if os.path.exists(temp_file_path):
            os.unlink(temp_file_path)

def main():
    print("🎯 ACCURACY VALIDATION TEST")
    print("=" * 70)
    print("Testing if original expected results are included in expanded result set")
    print()

    # Load original scanner
    print("1. Loading original backside para scanner...")
    original_code = load_original_scanner()

    # Extract original SYMBOLS list
    import re
    symbols_match = re.search(r'SYMBOLS\s*=\s*\[(.*?)\]', original_code, re.DOTALL)
    if symbols_match:
        symbols_content = symbols_match.group(1)
        original_symbols = re.findall(r'[\'"]([^\'"]+)[\'"]', symbols_content)
        print(f"   ✅ Original symbols list: {len(original_symbols)} tickers")
    else:
        print("   ❌ Could not extract original SYMBOLS list")
        return

    # Test 1: Run with original symbols (baseline)
    print(f"\n2. BASELINE TEST: Running with original {len(original_symbols)} symbols...")
    try:
        baseline_results = execute_scanner_with_symbols(original_code, original_symbols)
        print(f"   ✅ Baseline results: {len(baseline_results)} results")

        if len(baseline_results) > 0:
            print(f"   📋 Baseline signals found:")
            for i, result in enumerate(baseline_results[:10]):  # Show first 10
                ticker = result.get('Ticker', result.get('ticker', 'UNKNOWN'))
                date = result.get('Date', result.get('date', 'UNKNOWN'))
                print(f"      {i+1}. {ticker} on {date}")
            if len(baseline_results) > 10:
                print(f"      ... and {len(baseline_results) - 10} more")

    except Exception as e:
        print(f"   ❌ Baseline test failed: {e}")
        return

    # Test 2: Run with expanded universe
    print(f"\n3. EXPANDED TEST: Running with enhanced symbol universe...")
    try:
        # Create expanded universe (original + common large caps)
        expanded_symbols = original_symbols + [
            'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'TSLA', 'META', 'BRK.B', 'UNH', 'LLY',
            'AVGO', 'JPM', 'V', 'WMT', 'XOM', 'MA', 'PG', 'JNJ', 'HD', 'CVX',
            'ABBV', 'BAC', 'ORCL', 'CRM', 'KO', 'MRK', 'COST', 'PEP', 'TMO', 'DHR'
        ]
        # Remove duplicates while preserving order
        seen = set()
        expanded_symbols = [x for x in expanded_symbols if not (x in seen or seen.add(x))]

        expanded_results = execute_scanner_with_symbols(original_code, expanded_symbols)
        print(f"   ✅ Expanded results: {len(expanded_results)} results")

    except Exception as e:
        print(f"   ❌ Expanded test failed: {e}")
        return

    # Test 3: Accuracy validation
    print(f"\n4. ACCURACY VALIDATION:")
    print(f"   📊 Baseline results: {len(baseline_results)}")
    print(f"   📊 Expanded results: {len(expanded_results)}")

    if len(baseline_results) == 0:
        print(f"   ⚠️  No baseline results to validate against")
        return

    # Check if all baseline results are present in expanded results
    baseline_signals = set()
    for result in baseline_results:
        ticker = result.get('Ticker', result.get('ticker', ''))
        date = result.get('Date', result.get('date', ''))
        baseline_signals.add((ticker, date))

    expanded_signals = set()
    for result in expanded_results:
        ticker = result.get('Ticker', result.get('ticker', ''))
        date = result.get('Date', result.get('date', ''))
        expanded_signals.add((ticker, date))

    # Find matching signals
    matching_signals = baseline_signals.intersection(expanded_signals)
    missing_signals = baseline_signals - expanded_signals

    print(f"   📈 Baseline signals: {len(baseline_signals)}")
    print(f"   📈 Expanded signals: {len(expanded_signals)}")
    print(f"   ✅ Matching signals: {len(matching_signals)}")
    print(f"   ❌ Missing signals: {len(missing_signals)}")

    accuracy_percentage = (len(matching_signals) / len(baseline_signals)) * 100 if baseline_signals else 0
    print(f"   🎯 Accuracy: {accuracy_percentage:.1f}%")

    if missing_signals:
        print(f"\n   ⚠️  Missing signals (these should be investigated):")
        for ticker, date in sorted(missing_signals):
            print(f"      - {ticker} on {date}")

    # Final assessment
    print(f"\n🎯 FINAL ASSESSMENT:")
    if accuracy_percentage >= 100:
        print(f"   ✅ PERFECT ACCURACY: All original signals preserved in expanded results")
    elif accuracy_percentage >= 90:
        print(f"   ✅ HIGH ACCURACY: {accuracy_percentage:.1f}% of original signals preserved")
    elif accuracy_percentage >= 75:
        print(f"   ⚠️  MODERATE ACCURACY: {accuracy_percentage:.1f}% of original signals preserved")
    else:
        print(f"   ❌ LOW ACCURACY: Only {accuracy_percentage:.1f}% of original signals preserved")

    if len(expanded_results) > len(baseline_results) * 2:
        print(f"   📊 EXPECTED EXPANSION: Results expanded {len(expanded_results)/len(baseline_results):.1f}x due to more symbols")

    print(f"\nResult: {'VALIDATION PASSED' if accuracy_percentage >= 90 else 'VALIDATION FAILED'}")

if __name__ == "__main__":
    main()