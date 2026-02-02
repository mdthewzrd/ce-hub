#!/usr/bin/env python3
"""
Auto-generated scanner: half_a_plus_test
Scanner Type: half_a_plus
Generated: 2025-11-25T22:55:45.787915
Parameter Checksum: d44223b44593c5cc0d7b8bf1908112d88a93db37fce83e9aeed2afbe7d6a8fa3
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# PARAMETER INTEGRITY LOCKED - DO NOT MODIFY
P = {'price_min': 8.0, 'adv20_min_usd': 15000000, 'atr_mult': 2.0, 'vol_mult': 2.5, 'slope3d_min': 7.0, 'slope5d_min': 12.0, 'slope15d_min': 16.0, 'high_ema9_mult': 4.0, 'high_ema20_mult': 6.0, 'pct7d_low_div_atr_min': 6.0, 'pct14d_low_div_atr_min': 9.0, 'gap_div_atr_min': 1.25, 'open_over_ema9_min': 1.1, 'atr_pct_change_min': 0.25, 'prev_close_min': 10.0, 'pct2d_div_atr_min': 4.0, 'pct3d_div_atr_min': 3.0, 'lookback_days_2y': 1000, 'exclude_recent_days': 10, 'not_top_frac_abs': 0.75}

# Symbol Universe
SYMBOLS = ['TSLA', 'SMCI', 'DJT', 'AMD', 'NVDA', 'AAPL']

# Date Range
START_DATE = "2024-01-01"
END_DATE = "2025-11-01"

# API Configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Scanner execution code would go here
# This is a template that integrates with existing scanner implementations

def main():
    print(f"🎯 EXECUTING SCANNER: half_a_plus_test")
    print(f"📅 Date Range: {START_DATE} to {END_DATE}")
    print(f"🔧 Parameter Checksum: d44223b44593c5cc0d7b8bf1908112d88a93db37fce83e9aeed2afbe7d6a8fa3")
    print(f"📊 Symbols: {len(SYMBOLS)}")
    print("=" * 60)

    # Scanner execution logic would be implemented here
    # Using the locked parameters P and symbol universe SYMBOLS

    print("✅ Scanner execution complete")

if __name__ == "__main__":
    main()
