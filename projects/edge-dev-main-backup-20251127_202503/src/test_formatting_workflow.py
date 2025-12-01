#!/usr/bin/env python3

import requests
import json

# Test file content (first 50 lines of the backside para b copy)
test_code = '''# daily_para_backside_lite_scan.py
# Daily-only "A+ para, backside" scan — lite mold.
# Trigger: D-1 (or D-2) fits; trade day (D0) must gap & open > D-1 high.
# D-1 must take out D-2 high and close above D-2 close.
# Adds absolute D-1 volume floor: d1_volume_min.

import pandas as pd, numpy as np, requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

# ───────── config ─────────
session  = requests.Session()
API_KEY  = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 6

PRINT_FROM = "2025-01-01"  # set None to keep all
PRINT_TO   = None

# ───────── knobs ─────────
P = {
    # hard liquidity / price
    "price_min"        : 8.0,
    "adv20_min_usd"    : 30_000_000,

    # backside context (absolute window)
    "abs_lookback_days": 1000,
    "abs_exclude_days" : 10,
    "pos_abs_max"      : 0.75,

    # trigger mold (evaluated on D-1 or D-2)
    "trigger_mode"     : "D1_or_D2",   # "D1_only" or "D1_or_D2"
    "atr_mult"         : .9,
    "vol_mult"         : 0.9,         # max(D-1 vol/avg, D-2 vol/avg)

    # Relative D-1 vol (optional). Set to None to disable.
    "d1_vol_mult_min"  : None,         # e.g., 1.25

    # NEW: Absolute D-1 volume floor (shares). Set None to disable.
    "d1_volume_min"    : 15_000_000,   # e.g., require ≥ 20M shares on D-1

    "slope5d_min"      : 3.0,
    "high_ema9_mult"   : 1.05,

    # trade-day (D0) gates
    "gap_div_atr_min"   : .75,
    "open_over_ema9_min": .9,
    "d1_green_atr_min"  : 0.30,
    "require_open_gt_prev_high": True,

    # relative requirement
    "enforce_d1_above_d2": True,
}

# ───────── universe ─────────
SYMBOLS = [
    'MSTR','SMCI','DJT','BABA','TCOM','AMC','SOXL','MRVL','TGT','DOCU','ZM','DIS',
    'NFLX','SNAP','RBLX','META','SE','NVDA','AAPL','MSFT','GOOGL','AMZN','TSLA',
    'AMD','INTC','BA','PYPL','QCOM','ORCL','KO','PEP','ABBV','JNJ','CRM','BAC',
]'''

def test_formatting():
    """Test the code formatting functionality"""

    print("🧪 Testing Code Formatting API")
    print("=" * 50)

    # Test direct backend API
    backend_url = "http://localhost:5659/api/format/code"

    try:
        print(f"📡 Sending request to: {backend_url}")
        print(f"📝 Code length: {len(test_code)} characters")

        response = requests.post(
            backend_url,
            headers={"Content-Type": "application/json"},
            json={"code": test_code, "options": {}},
            timeout=30
        )

        print(f"📊 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! Backend formatting worked")
            print(f"   - Success: {result.get('success', False)}")
            print(f"   - Scanner Type: {result.get('scannerType', 'Unknown')}")
            print(f"   - Integrity Verified: {result.get('integrityVerified', False)}")
            print(f"   - Optimizations: {len(result.get('optimizations', []))}")
            print(f"   - Warnings: {len(result.get('warnings', []))}")
            print(f"   - Errors: {len(result.get('errors', []))}")

            # Check for EdgeDev structure
            formatted_code = result.get('formattedCode', '')
            if 'TICKER_UNIVERSE' in formatted_code:
                print("✅ TICKER_UNIVERSE found in formatted code")
            else:
                print("❌ TICKER_UNIVERSE NOT found in formatted code")

            if 'SCANNER_PARAMETERS' in formatted_code:
                print("✅ SCANNER_PARAMETERS found in formatted code")
            else:
                print("❌ SCANNER_PARAMETERS NOT found in formatted code")

            print(f"\n📄 Formatted code preview (first 500 chars):")
            print("-" * 50)
            print(formatted_code[:500] + "..." if len(formatted_code) > 500 else formatted_code)
            print("-" * 50)

        else:
            print("❌ FAILED!")
            print(f"   Response: {response.text}")

    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

def test_frontend_integration():
    """Test the frontend API route"""

    print("\n🌐 Testing Frontend Integration")
    print("=" * 50)

    frontend_url = "http://localhost:5656/api/format-scan"

    try:
        # Create a temporary file
        with open("/tmp/test_scanner.py", "w") as f:
            f.write(test_code)

        print(f"📁 Created test file: /tmp/test_scanner.py")

        with open("/tmp/test_scanner.py", "rb") as f:
            files = {"file": f}
            response = requests.post(frontend_url, files=files, timeout=30)

        print(f"📊 Frontend response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            if result.get('success'):
                print("✅ Frontend integration successful!")
            else:
                print(f"❌ Frontend integration failed: {result.get('error', 'Unknown error')}")
        else:
            print(f"❌ Frontend HTTP error: {response.text}")

    except Exception as e:
        print(f"❌ Frontend exception: {e}")

if __name__ == "__main__":
    test_formatting()
    test_frontend_integration()