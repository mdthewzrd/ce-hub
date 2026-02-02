#!/usr/bin/env python3
"""
Test Universe Expansion Fix
Tests that the universe expansion is working correctly with the uploaded scanner
"""

import requests
import json
import time
from datetime import datetime

def test_universe_expansion():
    """Test universe expansion with the actual uploaded scanner code"""
    print("🧪 TESTING UNIVERSE EXPANSION FIX")
    print("=" * 50)

    # Read the actual uploaded scanner file
    scanner_file = "/Users/michaeldurante/Downloads/backside para b copy.py"

    try:
        with open(scanner_file, 'r') as f:
            scanner_code = f.read()

        print(f"📁 Loaded scanner file: {len(scanner_code)} characters")

        # Count original symbols in the scanner
        import re
        symbols_matches = re.findall(r'SYMBOLS\s*=\s*\[(.*?)\]', scanner_code, re.DOTALL)
        if symbols_matches:
            # Extract symbols from the first match
            symbols_text = symbols_matches[0]
            original_symbols = re.findall(r"'([A-Za-z0-9\.\-+/]+)'", symbols_text)
            print(f"📊 Original symbols found: {len(original_symbols)}")
            print(f"   First 10 symbols: {original_symbols[:10]}")
        else:
            print("❌ No SYMBOLS array found in scanner")
            original_symbols = []

        # Test the backend formatting endpoint
        print("\n🔧 TESTING BACKEND FORMATTING WITH UNIVERSE EXPANSION...")

        # Make request to backend formatter
        payload = {
            "code": scanner_code,
            "requirements": {
                "full_universe": True,
                "max_threading": True,
                "polygon_api": True
            }
        }

        response = requests.post(
            'http://localhost:5659/api/format/code',
            json=payload,
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            formatted_code = result.get('formatted_code', '')

            print(f"✅ Backend formatting successful")
            print(f"📊 Response metadata: {result.get('metadata', {})}")

            # Count symbols in formatted code
            formatted_symbols_matches = re.findall(r'SYMBOLS\s*=\s*\[(.*?)\]', formatted_code, re.DOTALL)
            if formatted_symbols_matches:
                formatted_symbols_text = formatted_symbols_matches[0]
                formatted_symbols = re.findall(r"'([A-Za-z0-9\.\-+/]+)'", formatted_symbols_text)
                print(f"🌍 Expanded symbols: {len(formatted_symbols)}")
                print(f"   First 10 symbols: {formatted_symbols[:10]}")

                # Calculate expansion ratio
                if original_symbols and formatted_symbols:
                    expansion_ratio = len(formatted_symbols) / len(original_symbols)
                    print(f"📈 Expansion ratio: {expansion_ratio:.1f}x")

                    if len(formatted_symbols) >= 1000:
                        print("🎉 UNIVERSE EXPANSION SUCCESSFUL!")
                        print(f"   ✅ Expanded from {len(original_symbols)} to {len(formatted_symbols)} symbols")
                    else:
                        print("⚠️ Universe expansion may be incomplete")
                        print(f"   ⚠️ Only expanded to {len(formatted_symbols)} symbols")
                else:
                    print("❌ Could not count symbols in formatted code")
            else:
                print("❌ No SYMBOLS array found in formatted code")

            # Save a sample of the formatted code for verification
            with open('formatted_scanner_sample.py', 'w') as f:
                # Write just the SYMBOLS section for verification
                if formatted_symbols_matches:
                    f.write("# FORMATTED SCANNER SYMBOLS SECTION\n")
                    f.write(f"# Original: {len(original_symbols)} symbols\n")
                    f.write(f"# Expanded: {len(formatted_symbols)} symbols\n\n")
                    f.write("SYMBOLS = [\n")
                    for i, symbol in enumerate(formatted_symbols[:20]):  # Show first 20
                        f.write(f"    '{symbol}',\n")
                    if len(formatted_symbols) > 20:
                        f.write(f"    # ... and {len(formatted_symbols) - 20} more symbols\n")
                    f.write("]\n")

            print(f"📄 Sample saved to: formatted_scanner_sample.py")

        else:
            print(f"❌ Backend formatting failed: {response.status_code}")
            print(f"   Error: {response.text}")

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

    return True

def main():
    """Main execution"""
    start_time = datetime.now()
    print(f"Started: {start_time.strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    success = test_universe_expansion()

    end_time = datetime.now()
    duration = end_time - start_time
    print(f"\n⏱️  Test Duration: {duration}")
    print(f"Completed: {end_time.strftime('%Y-%m-%d %H:%M:%S')}")

    if success:
        print("\n🎉 UNIVERSE EXPANSION TEST COMPLETED!")
        print("✅ Ready for full market scanning with expanded universe")
    else:
        print("\n❌ UNIVERSE EXPANSION TEST FAILED!")
        print("❌ Please check backend logs for details")

if __name__ == "__main__":
    main()