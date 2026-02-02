#!/usr/bin/env python3
"""
Debug the data type error preventing scan execution
"""
import pandas as pd
import numpy as np

# Test basic scanner execution with sample data
def test_scanner_execution():
    print("🔍 Testing scanner execution with sample data...")

    # Create sample data that mimics the structure from your original scanner
    sample_data = {
        'h': ['10.5', '11.2', '10.8'],  # Heights as strings (potential issue)
        'h1': ['10.0', '10.5', '11.2'],
        'h2': ['9.8', '10.0', '10.5'],
        'c': [10.3, 11.0, 10.6],
        'c_ua': [10.3, 11.0, 10.6],
        'v_ua': [1000000, 1200000, 900000],
        'dol_v': [500000000, 600000000, 450000000],
        'high_chg_atr': [1.2, 1.5, 0.8],
        'dist_h_9ema_atr': [2.1, 2.5, 1.9],
        'dist_h_20ema_atr': [3.2, 3.8, 2.9],
        'ema9': [10.1, 10.8, 10.4],
        'ema20': [9.9, 10.6, 10.2],
        'ema50': [9.5, 10.2, 9.8]
    }

    df = pd.DataFrame(sample_data)
    print("📊 Sample data created:")
    print(df.dtypes)
    print()

    # Test the problematic condition from lc_frontside_d3_extended_1
    try:
        print("🧪 Testing: (df['h'] >= df['h1'])")
        result1 = (df['h'] >= df['h1'])
        print(f"✅ Success: {result1.tolist()}")
    except Exception as e:
        print(f"❌ Error: {e}")
        print("🔧 Converting 'h' and 'h1' to numeric...")
        df['h'] = pd.to_numeric(df['h'], errors='coerce')
        df['h1'] = pd.to_numeric(df['h1'], errors='coerce')
        result1 = (df['h'] >= df['h1'])
        print(f"✅ After conversion: {result1.tolist()}")

    print()

    # Test other conditions
    try:
        print("🧪 Testing: (df['c_ua'] >= 5)")
        result2 = (df['c_ua'] >= 5)
        print(f"✅ Success: {result2.tolist()}")
    except Exception as e:
        print(f"❌ Error: {e}")

    # Test complex condition
    try:
        print("🧪 Testing complex scanner logic...")
        complex_condition = (
            (df['h'] >= df['h1']) &
            (df['c_ua'] >= 5) &
            (df['high_chg_atr'] >= 1) &
            (df['v_ua'] >= 10000000)
        )
        result3 = complex_condition.astype(int)
        print(f"✅ Complex condition result: {result3.tolist()}")
    except Exception as e:
        print(f"❌ Complex condition error: {e}")

if __name__ == "__main__":
    test_scanner_execution()