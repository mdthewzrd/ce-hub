#!/usr/bin/env python3
"""
Test script to verify multi-scanner transformation is using fetch_all_grouped_data()
instead of direct Polygon API calls
"""

import requests
import json

# Test multi-scanner code (simplified version of LC D2)
test_multi_scanner = '''
import pandas as pd
import numpy as np

def compute_indicators1(df):
    """
    Compute indicators for LC D2 patterns
    """
    # EMAs
    df['ema_9'] = df.groupby('ticker')['close'].transform(
        lambda x: x.ewm(span=9, adjust=False).mean()
    )
    df['ema_20'] = df.groupby('ticker')['close'].transform(
        lambda x: x.ewm(span=20, adjust=False).mean()
    )

    # Previous values
    df['prev_close'] = df.groupby('ticker')['close'].shift(1)
    df['prev_open'] = df.groupby('ticker')['open'].shift(1)

    # Gaps and ranges
    df['gap'] = (df['open'] / df['prev_close']) - 1
    df['range'] = df['high'] - df['low']

    return df

def main():
    # Pattern detection
    df['lc_frontside_d3'] = (
        (df['gap'] > 0.01) &
        (df['range'] > df['range'].mean()) &
        (df['close'] > df['open'])
    ).astype(int)

    df['lc_backside_d3'] = (
        (df['gap'] < -0.01) &
        (df['range'] > df['range'].mean()) &
        (df['close'] < df['open'])
    ).astype(int)

    return df[df['lc_frontside_d3'] == 1]

if __name__ == "__main__":
    main()
'''

print("="*60)
print("Testing Multi-Scanner Transformation Fix")
print("="*60)

# Test the transformation
url = "http://localhost:5666/api/renata_v2/transform"

payload = {
    "source_code": test_multi_scanner,
    "scanner_name": "TestMultiScanner",
    "date_range": "2024-01-01 to 2024-12-31",
    "verbose": True
}

print("\n📤 Sending transformation request...")
print(f"   Scanner: TestMultiScanner")
print(f"   Date Range: 2024-01-01 to 2024-12-31")
print(f"   Code length: {len(test_multi_scanner)} chars")

try:
    response = requests.post(url, json=payload, timeout=60)

    print(f"\n📥 Response status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()

        print(f"\n✅ Transformation successful!")
        print(f"   Success: {data['success']}")
        print(f"   Generated code length: {len(data.get('generated_code', ''))} chars")

        # Check the transformed code
        generated_code = data.get('generated_code', '')

        # ✅ POSITIVE CHECKS: Should have these
        print(f"\n✅ POSITIVE CHECKS (should be present):")

        if 'fetch_all_grouped_data' in generated_code:
            print(f"✅ Contains fetch_all_grouped_data()")
        else:
            print(f"❌ MISSING: fetch_all_grouped_data()")

        if 'from universal_scanner_engine.core.data_loader import fetch_all_grouped_data' in generated_code:
            print(f"✅ Contains correct import for fetch_all_grouped_data")
        else:
            print(f"❌ MISSING: Correct import for fetch_all_grouped_data")

        if 'class TestMultiScanner:' in generated_code:
            print(f"✅ Wrapped in class structure")
        else:
            print(f"❌ MISSING: Class structure")

        # ❌ NEGATIVE CHECKS: Should NOT have these
        print(f"\n❌ NEGATIVE CHECKS (should NOT be present):")

        if 'import requests' in generated_code:
            print(f"❌ WARNING: Contains 'import requests' (should not import requests)")
        else:
            print(f"✅ Does NOT contain 'import requests'")

        if 'api_key' in generated_code.lower():
            print(f"❌ WARNING: Contains 'api_key' (should not have API key)")
        else:
            print(f"✅ Does NOT contain 'api_key'")

        if 'polygon.io' in generated_code.lower():
            print(f"❌ WARNING: Contains 'polygon.io' (should not use Polygon API)")
        else:
            print(f"✅ Does NOT contain 'polygon.io'")

        if '_fetch_grouped_day' in generated_code:
            print(f"❌ WARNING: Contains '_fetch_grouped_day' method (should not exist)")
        else:
            print(f"✅ Does NOT contain '_fetch_grouped_day' method")

        if 'self.api_key' in generated_code:
            print(f"❌ WARNING: Contains 'self.api_key' (should not exist)")
        else:
            print(f"✅ Does NOT contain 'self.api_key'")

        # Save the transformed code for inspection
        output_file = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/test_multi_scanner_output.py"
        with open(output_file, 'w') as f:
            f.write(generated_code)

        print(f"\n📄 Transformed code saved to: {output_file}")

        # Show a snippet of the fetch_grouped_data method
        print(f"\n📝 Transformed fetch_grouped_data method snippet:")
        print("="*60)
        lines = generated_code.split('\n')
        in_fetch_method = False
        method_lines = []
        for i, line in enumerate(lines):
            if 'def fetch_grouped_data' in line:
                in_fetch_method = True

            if in_fetch_method:
                method_lines.append(line)

                # Stop after 30 lines or at next method
                if len(method_lines) > 30 or (len(method_lines) > 5 and line.strip() and not line.startswith(' ') and 'def ' in line):
                    break

        for line in method_lines[:30]:
            print(line)
        print("="*60)

        # Summary
        print(f"\n📊 TRANSFORMATION SUMMARY:")

        positive_checks = [
            'fetch_all_grouped_data' in generated_code,
            'from universal_scanner_engine.core.data_loader import fetch_all_grouped_data' in generated_code,
            'class TestMultiScanner:' in generated_code
        ]

        negative_checks = [
            'import requests' not in generated_code,
            'api_key' not in generated_code.lower(),
            'polygon.io' not in generated_code.lower(),
            '_fetch_grouped_day' not in generated_code,
            'self.api_key' not in generated_code
        ]

        positive_pass = sum(positive_checks)
        negative_pass = sum(negative_checks)

        print(f"   Positive checks: {positive_pass}/{len(positive_checks)} passed")
        print(f"   Negative checks: {negative_pass}/{len(negative_checks)} passed")

        if positive_pass == len(positive_checks) and negative_pass == len(negative_checks):
            print(f"\n🎉 ALL CHECKS PASSED! Multi-scanner transformation is working correctly.")
        else:
            print(f"\n⚠️  SOME CHECKS FAILED! Please review the transformation.")

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
