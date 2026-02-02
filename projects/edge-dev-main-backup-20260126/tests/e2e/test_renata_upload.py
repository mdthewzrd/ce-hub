# Test Python scanner file for Renata AI upload testing
import pandas as pd
import numpy as np
from datetime import datetime

class ScannerConfig:
    # Basic configuration parameters
    min_gap_percent = 5.0
    volume_multiplier = 2.0
    price_range_min = 1.0
    max_results = 50

def sample_gap_scanner():
    """
    Sample gap scanner for testing Renata AI formatting
    """
    print("🔍 Running sample gap scanner...")

    # Mock data for testing
    results = [
        {"ticker": "AAPL", "gap": 3.2, "volume": 150000},
        {"ticker": "TSLA", "gap": 8.7, "volume": 2500000},
        {"ticker": "MSFT", "gap": 2.1, "volume": 890000}
    ]

    # Convert to DataFrame
    df = pd.DataFrame(results)
    df['timestamp'] = datetime.now()

    return df

if __name__ == "__main__":
    # Run the scanner
    scan_results = sample_gap_scanner()
    print(f"✅ Found {len(scan_results)} gap opportunities")
    print(scan_results)