#!/usr/bin/env python3
"""
Quick test to see if AI generates code with data type fixes
"""

import asyncio
from ai_scanner_service_guaranteed import ai_scanner_service_guaranteed as ai_scanner_service

async def test_generation():
    # Simple test code
    test_code = '''
import pandas as pd

def scan_test():
    df = pd.DataFrame({
        'h': ['10.5', '11.2'],
        'h1': ['10.0', '10.5'],
        'c': [10.3, 11.0]
    })

    # This will fail without data type conversion
    result = (df['h'] >= df['h1']).astype(int)
    return result

if __name__ == "__main__":
    print(scan_test())
    '''

    try:
        # Test AI analysis first
        analysis = await ai_scanner_service.analyze_scanner(test_code, "test.py")
        print(f"Analysis found {len(analysis.patterns)} patterns")

        if analysis.patterns:
            # Test code generation
            pattern = analysis.patterns[0]
            generated = await ai_scanner_service.generate_scanner(pattern, test_code, analysis.imports)

            print(f"Generated code length: {len(generated)} chars")
            print("Generated code preview:")
            print("=" * 60)
            print(generated[:1000])
            print("=" * 60)

            # Check for data type fixes
            has_fix_function = 'def fix_data_types(' in generated
            has_fix_calls = generated.count('fix_data_types(') > 1
            has_numeric_conversion = 'pd.to_numeric(' in generated

            print(f"\nData Type Fix Analysis:")
            print(f"- Contains fix_data_types function: {has_fix_function}")
            print(f"- Contains fix_data_types calls: {has_fix_calls}")
            print(f"- Contains pd.to_numeric calls: {has_numeric_conversion}")

            return has_fix_function and has_fix_calls
        else:
            print("No patterns found")
            return False

    except Exception as e:
        print(f"Error: {e}")
        return False

if __name__ == "__main__":
    result = asyncio.run(test_generation())
    print(f"\nFinal result: {'✅ SUCCESS' if result else '❌ FAILED'}")