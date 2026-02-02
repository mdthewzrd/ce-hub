#!/usr/bin/env python3
"""
Test script to execute the backside scanner standalone and compare with Edge.dev platform results
"""

import sys
import os
import subprocess
import pandas as pd
from datetime import datetime

# Add the path to execute the original scanner
SCANNER_PATH = "/Users/michaeldurante/Downloads/backside para b copy.py"

def main():
    print("=" * 80)
    print("STANDALONE BACKSIDE SCANNER EXECUTION TEST")
    print("=" * 80)
    print(f"Scanner: {SCANNER_PATH}")
    print(f"Date Range: 2025-01-01 to 2025-11-01")
    print(f"Universe: 75 symbols")
    print(f"Execution Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

    try:
        # Execute the scanner and capture output
        result = subprocess.run([
            sys.executable, SCANNER_PATH
        ], capture_output=True, text=True, timeout=300)

        print("STDOUT:")
        print("-" * 50)
        print(result.stdout)
        print("-" * 50)

        if result.stderr:
            print("STDERR:")
            print("-" * 50)
            print(result.stderr)
            print("-" * 50)

        print(f"Return Code: {result.returncode}")

        # Parse the output to count signals
        if result.returncode == 0:
            output_lines = result.stdout.strip().split('\n')

            # Look for the results table - more flexible parsing
            table_start = -1
            for i, line in enumerate(output_lines):
                if "Ticker" in line and "Date" in line:
                    table_start = i
                    break

            if table_start >= 0:
                # Count data rows - lines that start with a stock ticker pattern
                signal_lines = []
                for line in output_lines[table_start+1:]:
                    line = line.strip()
                    # Check if line starts with a stock ticker (all caps letters)
                    if line and (line[0].isupper() and len([c for c in line[:10] if c.isalpha()]) >= 3):
                        signal_lines.append(line)

                print(f"\nSIGNAL COUNT ANALYSIS:")
                print(f"Total signals detected: {len(signal_lines)}")

                if signal_lines:
                    print("\nSignal details:")
                    for i, line in enumerate(signal_lines, 1):
                        print(f"  {i}. {line}")
                else:
                    print("No signals found in output")
            else:
                print("No results table found in output")
        else:
            print("Scanner execution failed!")

    except subprocess.TimeoutExpired:
        print("Scanner execution timed out after 300 seconds")
    except FileNotFoundError:
        print(f"Scanner file not found: {SCANNER_PATH}")
    except Exception as e:
        print(f"Error executing scanner: {e}")

if __name__ == "__main__":
    main()