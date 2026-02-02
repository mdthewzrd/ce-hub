#!/usr/bin/env python3
"""
Test script to verify generic v31 transformation is working correctly
"""

import requests
import json

# Test scanner code - simple RSI scanner
test_scanner = '''
def scan_stocks(df):
    """
    Simple scanner to find oversold stocks using RSI

    Args:
        df: DataFrame with stock data

    Returns:
        DataFrame with oversold stocks
    """
    # Calculate RSI
    delta = df['close'].diff()
    gain = (delta.where(delta > 0, 0)).rolling(window=14).mean()
    loss = (-delta.where(delta < 0, 0)).rolling(window=14).mean()
    rs = gain / loss
    df['rsi'] = 100 - (100 / (1 + rs))

    # Find oversold stocks
    results = df[
        (df['rsi'] < 30) &
        (df['volume'] > 1000000)
    ][['ticker', 'date', 'close', 'rsi', 'volume']]

    return results

if __name__ == "__main__":
    # Test the scanner
    import pandas as pd
    test_data = {
        'ticker': ['AAPL', 'MSFT', 'GOOGL'],
        'date': ['2024-01-01', '2024-01-01', '2024-01-01'],
        'close': [150.0, 300.0, 140.0],
        'volume': [5000000, 3000000, 2000000]
    }
    df = pd.DataFrame(test_data)
    results = scan_stocks(df)
    print(results)
'''

print("="*60)
print("Testing Generic v31 Transformation")
print("="*60)

# Test the transformation
url = "http://localhost:5666/api/renata_v2/transform"

payload = {
    "source_code": test_scanner,
    "scanner_name": "TestRSIScanner",
    "date_range": "2024-01-01 to 2024-12-31",
    "verbose": True
}

print("\n📤 Sending transformation request...")
print(f"   Scanner: TestRSIScanner")
print(f"   Date Range: 2024-01-01 to 2024-12-31")
print(f"   Code length: {len(test_scanner)} chars")

try:
    response = requests.post(url, json=payload, timeout=60)

    print(f"\n📥 Response status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()

        print(f"\n✅ Transformation successful!")
        print(f"   Success: {data['success']}")
        print(f"   Corrections made: {data.get('corrections_made', 0)}")
        print(f"   Generated code length: {len(data.get('generated_code', ''))} chars")

        # Check if it used the generic transformation
        generated_code = data.get('generated_code', '')

        if 'TestRSIScanner' in generated_code:
            print(f"\n✅ Scanner name correctly set to: TestRSIScanner")

        if 'fetch_grouped_data' in generated_code:
            print(f"✅ Contains fetch_grouped_data method")

        if 'run_pattern_detection' in generated_code:
            print(f"✅ Contains run_pattern_detection method")

        if 'def scan_stocks' in generated_code:
            print(f"✅ Original scan_stocks function preserved")

        if 'class TestRSIScanner:' in generated_code:
            print(f"✅ Wrapped in v31 class structure")

        # Check that it's NOT using Backside Para B specific patterns
        if '_mold_on_row' in generated_code:
            print(f"❌ WARNING: Contains Backside Para B specific function (_mold_on_row)")
        else:
            print(f"✅ Does NOT contain Backside Para B specific patterns")

        if 'P = {' in generated_code:
            print(f"❌ WARNING: Contains Backside Para B P dict")
        else:
            print(f"✅ Does NOT contain Backside Para B P dict")

        # Save the transformed code for inspection
        output_file = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/test_generic_v31_output.py"
        with open(output_file, 'w') as f:
            f.write(generated_code)

        print(f"\n📄 Transformed code saved to: {output_file}")

        # Show a snippet of the transformed code
        print(f"\n📝 Transformed code snippet (first 50 lines):")
        print("="*60)
        lines = generated_code.split('\n')
        for i, line in enumerate(lines[:50], 1):
            print(f"{i:3d}: {line}")
        print("="*60)

    else:
        print(f"\n❌ Transformation failed!")
        print(f"   Error: {response.text}")

except Exception as e:
    print(f"\n❌ Request failed: {e}")
    import traceback
    traceback.print_exc()

print("\n" + "="*60)
print("Test Complete")
print("="*60)
