#!/usr/bin/env python3
"""
Test the optimized smart formatting agent to ensure 25% analysis hang is resolved
"""
import requests
import json
import time

def test_smart_formatting():
    print("🧪 Testing optimized smart formatting on port 8001...")

    # Simple LC D2 scanner code for testing
    test_code = '''
import pandas as pd
import numpy as np

def scan_stocks(start_date, end_date):
    """LC D2 scanner implementation"""
    # Volume filter
    min_volume = 1000000

    # Price range
    min_price = 1.0
    max_price = 50.0

    # Technical analysis
    def calculate_lc_d2(df):
        # Low close day 2 pattern
        return df['close'] < df['low'].shift(1) * 0.98

    results = []
    print(f"Scanning from {start_date} to {end_date}")

    return results

if __name__ == "__main__":
    results = scan_stocks("2025-01-01", "2025-11-06")
    print(f"Found {len(results)} matches")
'''

    # Test the smart formatting endpoint
    start_time = time.time()

    try:
        response = requests.post("http://localhost:8001/api/format/smart",
                               json={"code": test_code, "filename": "test_lc_d2.py"},
                               timeout=60)

        end_time = time.time()
        processing_time = end_time - start_time

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Smart formatting completed successfully!")
            print(f"⏱️ Processing time: {processing_time:.2f} seconds")
            print(f"📊 Analysis method: {result.get('metadata', {}).get('analysis_method', 'unknown')}")
            print(f"🎯 Parameters detected: {result.get('metadata', {}).get('parameter_count', 0)}")
            print(f"✅ Integrity verified: {result.get('metadata', {}).get('integrity_verified', False)}")

            if processing_time < 10:
                print(f"🎉 SUCCESS: Analysis completed in {processing_time:.2f}s (was hanging at 25% for 10+ minutes)")
            else:
                print(f"⚠️ SLOW: Analysis took {processing_time:.2f}s - may still have performance issues")

        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT: Analysis still hanging after 60 seconds")
    except Exception as e:
        print(f"❌ Error: {e}")

def test_backend_health():
    print("\n🏥 Testing backend health...")
    try:
        response = requests.get("http://localhost:8001/", timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on port 8001")
        else:
            print(f"⚠️ Backend returned {response.status_code}")
    except Exception as e:
        print(f"❌ Backend not reachable: {e}")

if __name__ == "__main__":
    test_backend_health()
    test_smart_formatting()