# Test Gap Scanner for Renata Upload Testing
# This is a simple test scanner to verify file upload functionality

import pandas as pd
import numpy as np
from datetime import datetime

def gap_scanner(data, gap_threshold=3.0, volume_multiplier=2.0):
    """
    Simple gap scanner for testing Renata file upload

    Parameters:
    - gap_threshold: Minimum gap percentage (default: 3.0%)
    - volume_multiplier: Volume must be X times average (default: 2.0x)
    """

    # Calculate gaps
    data['prev_close'] = data['close'].shift(1)
    data['gap_pct'] = ((data['open'] - data['prev_close']) / data['prev_close'] * 100)

    # Calculate volume average
    data['vol_avg'] = data['volume'].rolling(20).mean()
    data['vol_ratio'] = data['volume'] / data['vol_avg']

    # Apply filters
    gap_filter = abs(data['gap_pct']) >= gap_threshold
    volume_filter = data['vol_ratio'] >= volume_multiplier

    # Combine filters
    results = data[gap_filter & volume_filter].copy()

    # Add confidence score
    results['confidence'] = (
        (abs(results['gap_pct']) / 10) * 0.6 +
        (results['vol_ratio'] / 5) * 0.4
    )

    return results[['date', 'ticker', 'gap_pct', 'volume', 'vol_ratio', 'confidence']]

# Test function
if __name__ == "__main__":
    print("Gap Scanner Test File - Ready for Renata Upload")