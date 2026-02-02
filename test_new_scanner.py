#!/usr/bin/env python3

# Test scanner for Renata AI
import pandas as pd

def test_scanner(df):
    """Simple test scanner"""
    return df[df['close'] > 100]

# Parameters
symbols = ['AAPL', 'TSLA']
start_date = '2025-01-01'
end_date = '2025-11-25'