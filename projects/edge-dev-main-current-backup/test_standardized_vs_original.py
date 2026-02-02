#!/usr/bin/env python3
"""
Compare standardized backside scanner vs original to identify the missing 2 signals
"""

import sys
import os
import subprocess
from datetime import datetime

def test_original_scanner():
    """Test the original backside scanner"""
    print("=" * 80)
    print("TESTING ORIGINAL BACKSIDE SCANNER")
    print("=" * 80)

    original_path = "/Users/michaeldurante/Downloads/backside para b copy.py"

    result = subprocess.run([
        sys.executable, original_path
    ], capture_output=True, text=True, timeout=300)

    if result.returncode == 0:
        lines = result.stdout.strip().split('\n')
        signal_lines = []
        for line in lines:
            line = line.strip()
            if line and (line[0].isupper() and len([c for c in line[:10] if c.isalpha()]) >= 3):
                signal_lines.append(line)

        print(f"Original scanner signals: {len(signal_lines)}")
        for i, line in enumerate(signal_lines, 1):
            print(f"  {i}. {line}")
        return signal_lines
    else:
        print(f"Original scanner failed: {result.stderr}")
        return []

def test_standardized_scanner():
    """Test the standardized backside scanner through Edge.dev system"""
    print("\n" + "=" * 80)
    print("TESTING STANDARDIZED BACKSIDE SCANNER")
    print("=" * 80)

    standardized_path = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/standardized_backside_para_b_scanner.py"

    # Test the standardized scanner directly
    result = subprocess.run([
        sys.executable, standardized_path
    ], capture_output=True, text=True, timeout=300)

    print("Standardized scanner output:")
    print(result.stdout)

    if result.stderr:
        print("Standardized scanner errors:")
        print(result.stderr)

    # Now let's create a custom test that runs the scan_symbol function for all symbols
    test_code = '''
import sys
sys.path.append("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend")
from standardized_backside_para_b_scanner import scan_symbol, SYMBOLS
from datetime import date

start_date = "2020-01-01"
end_date = "2025-11-01"

total_signals = []
for symbol in SYMBOLS:
    try:
        results = scan_symbol(symbol, start_date, end_date)
        for result in results:
            # Filter for our target date range
            result_date = result.get('date', '')
            if "2025-01-01" <= result_date <= "2025-11-01":
                total_signals.append({
                    'symbol': symbol,
                    'date': result_date,
                    'trigger': result.get('trigger', ''),
                    'gap_atr': result.get('gap_atr', 0),
                    'd1_volume_shares': result.get('d1_volume_shares', 0)
                })
    except Exception as e:
        print(f"Error scanning {symbol}: {e}")

# Sort by date (newest first) and symbol
total_signals.sort(key=lambda x: (x['date'], x['symbol']), reverse=True)

print(f"Standardized scanner signals: {len(total_signals)}")
for i, signal in enumerate(total_signals, 1):
    print(f"  {i}. {signal['symbol']} {signal['date']} {signal['trigger']} Gap/ATR:{signal['gap_atr']} Vol:{signal['d1_volume_shares']}")
'''

    result = subprocess.run([
        sys.executable, "-c", test_code
    ], capture_output=True, text=True, timeout=300)

    print("Custom standardized test results:")
    print(result.stdout)

    if result.stderr:
        print("Custom standardized test errors:")
        print(result.stderr)

    # Parse signals from output
    lines = result.stdout.strip().split('\n')
    signal_lines = []
    for line in lines:
        if "Standardized scanner signals:" in line:
            continue
        if line.strip() and line.strip().startswith('  '):
            signal_lines.append(line.strip())

    print(f"Standardized scanner signals: {len(signal_lines)}")
    return signal_lines

def compare_signals(original_signals, standardized_signals):
    """Compare the two sets of signals to identify differences"""
    print("\n" + "=" * 80)
    print("SIGNAL COMPARISON ANALYSIS")
    print("=" * 80)

    print(f"Original scanner signals: {len(original_signals)}")
    print(f"Standardized scanner signals: {len(standardized_signals)}")

    # Parse original signals into comparable format
    original_parsed = []
    for line in original_signals:
        parts = line.split()
        if len(parts) >= 3:
            symbol = parts[0]
            date = parts[1]
            trigger = parts[2] if len(parts) > 2 else ""
            original_parsed.append(f"{symbol} {date} {trigger}")

    print("\nOriginal signals:")
    for signal in original_parsed:
        print(f"  {signal}")

    print("\nStandardized signals:")
    for signal in standardized_signals:
        print(f"  {signal}")

    # Find differences
    original_set = set(original_parsed)
    standardized_set = set(standardized_signals)

    missing_in_standardized = original_set - standardized_set
    extra_in_standardized = standardized_set - original_set

    if missing_in_standardized:
        print(f"\n❌ MISSING IN STANDARDIZED ({len(missing_in_standardized)} signals):")
        for signal in sorted(missing_in_standardized):
            print(f"  {signal}")

    if extra_in_standardized:
        print(f"\n➕ EXTRA IN STANDARDIZED ({len(extra_in_standardized)} signals):")
        for signal in sorted(extra_in_standardized):
            print(f"  {signal}")

    if not missing_in_standardized and not extra_in_standardized:
        print("\n✅ SIGNALS MATCH PERFECTLY!")

def main():
    original_signals = test_original_scanner()
    standardized_signals = test_standardized_scanner()
    compare_signals(original_signals, standardized_signals)

if __name__ == "__main__":
    main()