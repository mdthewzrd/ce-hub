#!/usr/bin/env python3
"""
Run the actual backside B scanner from 1/1/25 to 11/1/25
"""

import sys
import os
import subprocess
from pathlib import Path

def modify_scanner_dates():
    """Modify the scanner to use the correct date range"""
    scanner_path = Path("/Users/michaeldurante/Downloads/formatted backside para b with smart filtering.py")

    # Read the scanner
    with open(scanner_path, 'r') as f:
        content = f.read()

    # Modify date range in main section
    content = content.replace(
        'fetch_start = "2020-01-01"',
        'fetch_start = "2025-01-01"'
    )
    content = content.replace(
        'fetch_end   = datetime.today().strftime("%Y-%m-%d")',
        'fetch_end   = "2025-11-01"'
    )

    # Modify print range
    content = content.replace(
        'PRINT_FROM = "2025-01-01"',
        'PRINT_FROM = "2025-01-01"'
    )

    # Write modified scanner to temp file
    temp_scanner = Path("/Users/michaeldurante/ai dev/ce-hub/temp_backside_scanner.py")
    with open(temp_scanner, 'w') as f:
        f.write(content)

    return temp_scanner

def run_original_scanner():
    """Run the original scanner without smart filtering"""
    print("🏃 RUNNING ORIGINAL BACKSIDE B SCANNER")
    print("=" * 60)
    print("📅 Date Range: 1/1/25 - 11/1/25")
    print("🎯 Full Parameters: $8.00 min price, $30M min ADV, 15M min D-1 volume")
    print()

    # Create modified scanner
    temp_scanner = modify_scanner_dates()

    try:
        # Run the scanner
        result = subprocess.run([
            "python3", str(temp_scanner)
        ], capture_output=True, text=True, timeout=600)  # 10 minute timeout

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
    print("🧪 BACKSIDE B SCANNER TEST")
    print("Running original scanner with full parameter integrity")
    print("=" * 70)

    success = run_original_scanner()

    print("\n" + "=" * 70)
    if success:
        print("🎉 SCANNER EXECUTION COMPLETED")
        print("Results above show ticker/date combinations for 1/1/25 - 11/1/25")
    else:
        print("❌ SCANNER EXECUTION FAILED")

    return success

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)