#!/usr/bin/env python3
"""
🔧 Quick Verification Test
Test that the fresh backend has the enhanced parameter detection working
"""

import requests
import json

# Test with a small subset of the LC D2 scanner
test_code = '''
import pandas as pd

DATE = "2025-01-01"
API_KEY = 'test_key'
BASE_URL = "https://api.polygon.io"

def scan_symbol(symbol, start_date, end_date):
    # Trading parameters in conditional logic
    atr_mult = 3.0
    ema_dev = 4.0
    rvol = 2.0

    if atr_mult >= 3 and ema_dev >= 4.0 and rvol >= 2:
        return {"symbol": symbol, "signal": "BUY"}

    return {"symbol": symbol, "signal": "HOLD"}
'''

print("🔧 QUICK VERIFICATION: Enhanced Parameter Detection")
print("=" * 60)

try:
    response = requests.post(
        "http://localhost:8000/api/format/code",
        json={"code": test_code},
        headers={"Content-Type": "application/json"},
        timeout=10
    )

    if response.status_code == 200:
        result = response.json()
        parameters = result.get('metadata', {}).get('parameters', {})

        print(f"✅ Backend responding on port 8000")
        print(f"📊 Scanner type: {result.get('scanner_type')}")
        print(f"📊 Total parameters: {len(parameters)}")

        # Check for enhanced trading parameters
        trading_params = [k for k in parameters.keys() if any(x in k for x in ['atr_mult', 'ema_dev', 'rvol'])]
        api_params = [k for k in parameters.keys() if any(x in k for x in ['api_key', 'base_url', 'date'])]

        print(f"🎯 Trading parameters detected: {len(trading_params)}")
        print(f"🔑 API parameters detected: {len(api_params)}")

        if trading_params:
            print(f"✅ SUCCESS: Enhanced parameter detection working!")
            print(f"   Examples: {trading_params[:3]}")
        else:
            print(f"❌ ISSUE: No trading parameters detected")

        if api_params:
            print(f"✅ API constants working: {api_params}")

    else:
        print(f"❌ Backend error: {response.status_code}")

except Exception as e:
    print(f"❌ Connection failed: {e}")

print(f"\n🚀 Frontend on port 5657 should now show meaningful trading parameters!")