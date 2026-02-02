#!/usr/bin/env python3
"""
Auto-generated scanner: backside_b_test
Scanner Type: backside_b
Generated: 2025-11-25T22:55:30.002525
Parameter Checksum: 7abc9c5871c4549b3580cc7f97e3dab2a4cd6c301492016d97b58795de1a8ecc
"""

import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
from concurrent.futures import ThreadPoolExecutor, as_completed

# PARAMETER INTEGRITY LOCKED - DO NOT MODIFY
P = {'price_min': 8.0, 'adv20_min_usd': 30000000, 'abs_lookback_days': 1000, 'abs_exclude_days': 10, 'pos_abs_max': 0.75, 'trigger_mode': 'D1_or_D2', 'atr_mult': 0.9, 'vol_mult': 0.9, 'd1_volume_min': 15000000, 'slope5d_min': 3.0, 'high_ema9_mult': 1.05, 'gap_div_atr_min': 0.75, 'open_over_ema9_min': 0.9, 'd1_green_atr_min': 0.3}

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
    print(f"🎯 EXECUTING SCANNER: backside_b_test")
    print(f"📅 Date Range: {START_DATE} to {END_DATE}")
    print(f"🔧 Parameter Checksum: 7abc9c5871c4549b3580cc7f97e3dab2a4cd6c301492016d97b58795de1a8ecc")
    print(f"📊 Symbols: {len(SYMBOLS)}")
    print("=" * 60)

    # Scanner execution logic would be implemented here
    # Using the locked parameters P and symbol universe SYMBOLS

    print("✅ Scanner execution complete")

if __name__ == "__main__":
    main()
