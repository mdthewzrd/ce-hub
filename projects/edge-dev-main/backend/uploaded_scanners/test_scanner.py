"""
Simple Test Scanner
Basic gap scanner to test the scan_ez upload and run functionality
"""

import pandas as pd
import numpy as np
from datetime import datetime

def scan(data, start_date, end_date):
    """
    Simple gap scanner - finds stocks with gap > 3%

    Args:
        data: Dictionary with ticker as key and price data as value
        start_date: Start date string (YYYY-MM-DD)
        end_date: End date string (YYYY-MM-DD)

    Returns:
        List of scan results with gap information
    """
    results = []

    for ticker, df in data.items():
        if df.empty:
            continue

        # Calculate gap from previous close to open
        df['gap'] = (df['Open'] - df['Close'].shift(1)) / df['Close'].shift(1)

        # Filter for gaps > 3%
        gaps = df[df['gap'] > 0.03]

        for date, row in gaps.iterrows():
            results.append({
                'ticker': ticker,
                'date': date.strftime('%Y-%m-%d'),
                'gap': round(row['gap'], 4),
                'open': round(row['Open'], 2),
                'prev_close': round(row['Close'].shift(1)[date], 2)
            })

    return results
