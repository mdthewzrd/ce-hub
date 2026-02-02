#!/usr/bin/env python3
"""
Run the original backside B scanner with hardcoded symbols and correct date range
"""

import sys
import os
import subprocess
from pathlib import Path

def create_modified_scanner():
    """Create a modified version of the original scanner"""
    original_path = Path("/Users/michaeldurante/Downloads/backside para b copy.py")

    # Read the original scanner
    with open(original_path, 'r') as f:
        content = f.read()

    # Modify the date range
    content = content.replace('fetch_start = "2020-01-01"', 'fetch_start = "2025-01-01"')
    content = content.replace('fetch_end   = datetime.today().strftime("%Y-%m-%d")', 'fetch_end   = "2025-11-01"')

    # Write to temp file
    temp_path = Path("/Users/michaeldurante/ai dev/ce-hub/temp_original_scanner.py")
    with open(temp_path, 'w') as f:
        f.write(content)

    return temp_path

def run_original():
    """Run the original scanner"""
    print("🏃 RUNNING ORIGINAL BACKSIDE B SCANNER")
    print("=" * 60)
    print("📅 Date Range: 1/1/25 - 11/1/25")
    print("🎯 Parameters: $8.00 min price, $30M min ADV, 15M min D-1 volume")
    print("📊 Symbol List: ~100 predefined tickers")
    print()

    # Create modified scanner
    temp_scanner = create_modified_scanner()

    try:
        # Run the scanner
        result = subprocess.run([
            "python3", str(temp_scanner)
        ], capture_output=True, text=True, timeout=300)  # 5 minute timeout

        print(result.stdout)
        if result.stderr:
            print("STDERR:", result.stderr)

        if result.returncode == 0:
            print("\n✅ SCANNER COMPLETED SUCCESSFULLY")
        else:
            print(f"\n❌ SCANNER FAILED with return code {result.returncode}")

        return result.returncode == 0

    except subprocess.TimeoutExpired:
        print("\n⏰ SCANNER TIMEOUT - taking too long")
        return False
    except Exception as e:
        print(f"\n❌ SCANNER ERROR: {e}")
        return False
    finally:
        # Clean up temp file
        if temp_scanner.exists():
            temp_scanner.unlink()

def main():
    """Main runner"""
    print("🧪 ORIGINAL BACKSIDE B SCANNER TEST")
    print("Running with hardcoded symbol list and full parameter integrity")
    print("=" * 70)

    success = run_original()

    print("\n" + "=" * 70)
    if success:
        print("🎉 SCANNER EXECUTION COMPLETED")
        print("Results above show real ticker/date combinations for 1/1/25 - 11/1/25")
        print("This should show the 10-20 results you expected for the year")
    else:
        print("❌ SCANNER EXECUTION FAILED")

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)