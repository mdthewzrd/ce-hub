#!/usr/bin/env python3
"""
Enhanced Backside Scanner Execution with Edge.dev Integration
Executes the enhanced original backside scanner with 30-minute timeout and smart filtering
"""

import subprocess
import json
import time
import sys
import os
from pathlib import Path

def main():
    print("=" * 80)
    print("🚀 ENHANCED BACKSIDE SCANNER EXECUTION THROUGH EDGE.DEV")
    print("=" * 80)
    print(f"⏰ Execution started at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print(f"📁 Working directory: {os.getcwd()}")
    print()

    # Load the test configuration
    test_file = "test_enhanced_backside_execution.json"

    print(f"📋 Loading test configuration from: {test_file}")

    try:
        with open(test_file, 'r') as f:
            test_config = json.load(f)

        message = test_config.get('message', '')
        print(f"📝 Test configuration loaded successfully")
        print(f"📄 Message length: {len(message)} characters")

        # Extract the Python code from the message
        if "```python" in message:
            # Extract Python code between ```python and ```
            start_idx = message.find("```python") + 9
            end_idx = message.find("```", start_idx)
            python_code = message[start_idx:end_idx].strip()

            print(f"🐍 Python scanner code extracted ({len(python_code)} characters)")

            # Save the scanner code to a temporary file
            scanner_file = "enhanced_backside_scanner_temp.py"
            with open(scanner_file, 'w') as f:
                f.write(python_code)

            print(f"💾 Scanner code saved to: {scanner_file}")
            print()

            # Execute the scanner
            print("🔥 EXECUTING ENHANCED BACKSIDE SCANNER")
            print("=" * 80)
            print("⚠️  NOTE: This execution uses:")
            print("   • 30-minute timeout (vs previous 5-minute)")
            print("   • Smart filtering to reduce universe while preserving signals")
            print("   • Market-wide scanning with Polygon grouped API")
            print("   • Proper backside scanner execution (not cached results)")
            print("   • Date range: 2025-01-01 to 2025-11-01")
            print("   • Expected: 8 trading signals (SOXL, INTC, XOM, AMD, SMCI, BABA)")
            print()

            start_time = time.time()

            try:
                # Execute with 30-minute timeout (1800 seconds)
                result = subprocess.run([
                    sys.executable, scanner_file
                ],
                capture_output=True,
                text=True,
                timeout=1800,  # 30 minutes
                cwd=os.getcwd()
                )

                execution_time = time.time() - start_time

                print(f"⏱️  Execution completed in {execution_time:.2f} seconds")
                print()

                if result.returncode == 0:
                    print("✅ SUCCESS - Scanner executed successfully!")
                    print()
                    print("📊 SCANNER OUTPUT:")
                    print("-" * 80)
                    print(result.stdout)
                    print("-" * 80)

                    # Try to extract and format results if it looks like JSON/CSV output
                    output_lines = result.stdout.strip().split('\n')

                    # Look for results in the output
                    result_section = []
                    in_results = False

                    for line in output_lines:
                        if any(keyword in line.lower() for keyword in ['ticker', 'date', 'soxl', 'intc', 'amd']):
                            in_results = True

                        if in_results:
                            result_section.append(line)

                    if result_section:
                        print()
                        print("📈 EXTRACTED TRADING SIGNALS:")
                        print("-" * 80)
                        for line in result_section[:20]:  # Show first 20 lines of results
                            if line.strip():
                                print(line)
                        print("-" * 80)

                        # Count signals
                        signal_count = len([line for line in result_section if any(ticker in line.upper() for ticker in ['SOXL', 'INTC', 'XOM', 'AMD', 'SMCI', 'BABA'])])
                        print(f"\n🎯 Found {signal_count} expected trading signals")

                else:
                    print("❌ ERROR - Scanner execution failed!")
                    print(f"🔄 Return code: {result.returncode}")
                    print()
                    print("📊 ERROR OUTPUT:")
                    print("-" * 80)
                    print(result.stderr)
                    print("-" * 80)

            except subprocess.TimeoutExpired:
                print("⏰ TIMEOUT - Scanner execution exceeded 30 minutes!")
                print("💡 This may indicate:")
                print("   • Market-wide scanning is taking longer than expected")
                print("   • Polygon API rate limits may be active")
                print("   • Smart filtering may need further optimization")

            except Exception as e:
                print(f"💥 EXCEPTION - {str(e)}")

            finally:
                # Clean up temporary file
                if os.path.exists(scanner_file):
                    os.remove(scanner_file)
                    print(f"🧹 Cleaned up temporary file: {scanner_file}")

        else:
            print("❌ ERROR: No Python code found in test configuration!")

    except FileNotFoundError:
        print(f"❌ ERROR: Test file '{test_file}' not found!")
        print("💡 Make sure you're in the correct directory with the test file")

    except Exception as e:
        print(f"❌ ERROR: {str(e)}")

    print()
    print("=" * 80)
    print(f"🏁 Execution completed at: {time.strftime('%Y-%m-%d %H:%M:%S')}")
    print("=" * 80)

if __name__ == "__main__":
    main()