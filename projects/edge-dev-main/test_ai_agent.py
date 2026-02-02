#!/usr/bin/env python3
"""
Test Renata AI Agent Integration
"""

import requests
import json

# Test with the user's backside para b scanner
test_code = """
# daily_para_backside_lite_scan.py
# Daily-only "A+ para, backside" scan — lite mold.

import pandas as pd, numpy as np, requests
from datetime import datetime
from concurrent.futures import ThreadPoolExecutor, as_completed

API_KEY  = "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
BASE_URL = "https://api.polygon.io"
MAX_WORKERS = 6

P = {
    "price_min"        : 8.0,
    "adv20_min_usd"    : 30_000_000,
    "abs_lookback_days": 1000,
    "pos_abs_max"      : 0.75,
    "trigger_mode"     : "D1_or_D2",
    "atr_mult"         : .9,
    "vol_mult"         : 0.9,
    "slope5d_min"      : 3.0,
    "high_ema9_mult"   : 1.05,
}

def scan_ticker(ticker: str, start: str, end: str):
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
    data = requests.get(url, params={"apiKey": API_KEY}).json()
    return data
"""

def test_ai_agent():
    """Test the AI agent endpoint"""
    url = "http://localhost:5665/api/format-exact"

    payload = {
        "code": test_code,
        "filename": "backside_para_b_copy_3.py",
        "useAIAgent": True,
        "useRenataRebuild": False
    }

    print("=" * 70)
    print("TESTING RENATA AI AGENT")
    print("=" * 70)
    print("\n📤 Sending request to AI Agent...")
    print(f"   Model: Qwen Coder 3 (OpenRouter)")
    print(f"   Code length: {len(test_code)} characters")

    try:
        response = requests.post(url, json=payload, timeout=60)

        if response.status_code == 200:
            result = response.json()
            print("\n✅ SUCCESS!")
            print(f"\n{result.get('message', 'No message')}")
            print(f"\n📊 Code Info:")
            print(f"   Original lines: {result.get('codeInfo', {}).get('originalLines')}")
            print(f"   Formatted lines: {result.get('codeInfo', {}).get('formattedLines')}")
            print(f"   Scanner type: {result.get('scannerType')}")
            print(f"   Service: {result.get('service')}")

            if result.get('formattedCode'):
                print("\n" + "=" * 70)
                print("FIRST 30 LINES OF FORMATTED CODE:")
                print("=" * 70)
                lines = result['formattedCode'].split('\n')[:30]
                for i, line in enumerate(lines, 1):
                    print(f"{i:3d}: {line}")
                if len(result['formattedCode'].split('\n')) > 30:
                    print(f"\n... ({len(result['formattedCode'].split('\n')) - 30} more lines)")
        else:
            print(f"\n❌ ERROR: {response.status_code}")
            print(response.text)

    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")
        import traceback
        traceback.print_exc()

    print("\n" + "=" * 70)

if __name__ == "__main__":
    test_ai_agent()
