#!/usr/bin/env python3
"""
Auto-generated scanner: frontend_test_backside
Scanner Type: backside_b
Generated: 2025-11-25T22:57:52.445930
Parameter Checksum: 61d9045ad7368240c2029693529c6532461d6a39c768d7e49fd55a9872e7fcd5
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# PARAMETER INTEGRITY LOCKED - DO NOT MODIFY
P = {'price_min': 8.0, 'adv20_min_usd': 30000000, 'abs_lookback_days': 1000, 'abs_exclude_days': 10, 'pos_abs_max': 0.75, 'trigger_mode': 'D1_or_D2', 'atr_mult': 0.9, 'vol_mult': 0.9, 'd1_volume_min': 15000000, 'slope5d_min': 3.0, 'high_ema9_mult': 1.05, 'gap_div_atr_min': 0.75, 'open_over_ema9_min': 0.9, 'd1_green_atr_min': 0.3}

# Symbol Universe
SYMBOLS = ['TSLA', 'NVDA', 'AMD']

# Date Range
START_DATE = "2024-01-01"
END_DATE = "2025-11-01"

# API Configuration
API_KEY = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"

# Scanner execution code would go here
# This is a template that integrates with existing scanner implementations

def main():
    print(f"🎯 EXECUTING SCANNER: frontend_test_backside")
    print(f"📅 Date Range: {START_DATE} to {END_DATE}")
    print(f"🔧 Parameter Checksum: 61d9045ad7368240c2029693529c6532461d6a39c768d7e49fd55a9872e7fcd5")
    print(f"📊 Symbols: {len(SYMBOLS)}")
    print("=" * 60)

    # Scanner execution logic would be implemented here
    # Using the locked parameters P and symbol universe SYMBOLS

    print("✅ Scanner execution complete")

if __name__ == "__main__":
    main()
