"""
Simple gap scanner for testing transformation
"""

def scan_gaps(df):
    """
    Simple gap scanning strategy
    """
    # Calculate gap
    df['gap'] = (df['open'] / df['close'].shift(1)) - 1

    # Filter for gaps
    results = df[df['gap'] > 0.02]

    return results
