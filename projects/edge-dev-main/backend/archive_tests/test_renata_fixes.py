"""
Test script to verify Renata V2 fixes
"""

import requests
import json

# Test scanner code with the sym variable bug
TEST_SCANNER = '''
"""
daily_para_backside_lite_scan.py
Daily-only "A+ para, backside" scan — lite mold.
"""

import pandas as pd, numpy as np
from datetime import datetime

SYMBOLS = ['AAPL', 'MSFT', 'GOOGL']

def fetch_daily_multi_range(start: str, end: str) -> pd.DataFrame:
    """Mock fetch function"""
    return pd.DataFrame()

def add_daily_metrics(df: pd.DataFrame) -> pd.DataFrame:
    """Mock metrics function"""
    return df

def scan_symbol(sym: str, start: str, end: str) -> pd.DataFrame:
    """Scan a single symbol"""
    df = fetch_daily_multi_range(start, end)
    if df.empty:
        return pd.DataFrame()

    m = add_daily_metrics(df)

    rows = []
    for i in range(2, len(m)):
        rows.append({
            "Ticker": sym,  # BUG: This should be 'ticker' in the class method
            "Date": m.index[i].strftime("%Y-%m-%d"),
            "Close": m.iloc[i]["Close"]
        })

    return pd.DataFrame(rows)


if __name__ == "__main__":
    # Orphaned code that should be removed
    results = []
    for s in SYMBOLS:
        df = scan_symbol(s, "2024-01-01", "2024-12-31")
        if not df.empty:
            results.append(df)

    if results:
        out = pd.concat(results, ignore_index=True)
        print(out.to_string(index=False))
'''

def test_renata_transformation():
    """Test the Renata V2 transformation with fixes"""

    print("=" * 70)
    print("TESTING RENATA V2 FIXES")
    print("=" * 70)

    url = "http://localhost:5666/api/renata_v2/transform"

    payload = {
        "source_code": TEST_SCANNER,
        "scanner_name": "TestBacksideParaB",
        "date_range": "2024-01-01 to 2024-12-31",
        "verbose": True
    }

    print("\n📤 Sending transformation request...")

    try:
        response = requests.post(url, json=payload, timeout=30)

        if response.status_code == 200:
            result = response.json()

            if result.get('success'):
                generated_code = result.get('generated_code', '')

                print("\n✅ Transformation successful!")

                # Check for the fixes
                print("\n🔍 VERIFYING FIXES:")

                # Fix 1: Check for variable substitution
                if '"Ticker": ticker,' in generated_code or '"Ticker":ticker' in generated_code:
                    print("   ✅ FIX 1: Variable substitution - PASS (sym → ticker)")
                elif '"Ticker": sym,' in generated_code:
                    print("   ❌ FIX 1: Variable substitution - FAIL (still using 'sym')")
                else:
                    print("   ⚠️  FIX 1: Variable substitution - UNKNOWN (couldn't find Ticker line)")

                # Fix 2: Check for missing time import
                if 'import time' in generated_code:
                    print("   ✅ FIX 2: Missing import - PASS (time module added)")
                else:
                    print("   ℹ️  FIX 2: Missing import - N/A (time not used)")

                # Fix 3: Check for orphaned code removal
                if 'results = []' not in generated_code or 'def ' in generated_code.split('results = []')[0]:
                    print("   ✅ FIX 3: Orphaned code - PASS (removed or inside function)")
                else:
                    print("   ❌ FIX 3: Orphaned code - FAIL (orphaned code still present)")

                # Save for review
                output_file = "/tmp/test_renata_output.py"
                with open(output_file, 'w') as f:
                    f.write(generated_code)

                print(f"\n📁 Saved transformed code to: {output_file}")

                # Show snippet around the Ticker line
                if '"Ticker"' in generated_code:
                    lines = generated_code.split('\n')
                    for i, line in enumerate(lines):
                        if '"Ticker"' in line:
                            print(f"\n📄 Context around Ticker line:")
                            for j in range(max(0, i-2), min(len(lines), i+3)):
                                print(f"   {lines[j]}")
                            break

                return True
            else:
                print("\n❌ Transformation failed!")
                print(f"Errors: {result.get('errors', [])}")
                return False
        else:
            print(f"\n❌ HTTP Error: {response.status_code}")
            print(response.text)
            return False

    except Exception as e:
        print(f"\n❌ Exception: {e}")
        return False

if __name__ == "__main__":
    success = test_renata_transformation()

    print("\n" + "=" * 70)
    if success:
        print("✅ ALL TESTS COMPLETED")
    else:
        print("❌ TESTS FAILED")
    print("=" * 70)
