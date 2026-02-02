"""
Quick test to compare LC D2 pattern detection
"""
import pandas as pd
import numpy as np

# Load my results
my_results = pd.read_csv('lc_d2_results.csv')
print(f"\n✅ My scanner found {len(my_results)} signals")
print("\nMy results (first 20):")
print(my_results[['Ticker', 'Date', 'Scanner_Label']].head(20).to_string(index=False))

# Check for duplicates
print(f"\n📊 Unique tickers: {my_results['Ticker'].nunique()}")
print(f"📊 Pattern counts:")
print(my_results['Scanner_Label'].value_counts())
