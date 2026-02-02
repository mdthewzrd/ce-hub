#!/usr/bin/env python3
"""
Test the optimized smart formatting with the real LC D2 scanner (64,219 characters)
"""
import requests
import json
import time

def test_real_lc_d2_formatting():
    print("🧪 Testing optimized smart formatting with REAL LC D2 scanner...")

    # Read the real LC D2 scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
    except FileNotFoundError:
        print("❌ Original scanner file not found, trying alternate name...")
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
            scanner_code = f.read()

    print(f"📄 Loaded REAL scanner code: {len(scanner_code)} characters")

    # Test the smart formatting endpoint with the real complex scanner
    start_time = time.time()

    try:
        print("🚀 Sending REAL LC D2 scanner to smart formatting on port 8000...")
        response = requests.post("http://localhost:8000/api/format/smart",
                               json={"code": scanner_code, "filename": "lc_d2_real.py"},
                               timeout=120)  # 2 minute timeout

        end_time = time.time()
        processing_time = end_time - start_time

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Smart formatting completed successfully!")
            print(f"⏱️ Processing time: {processing_time:.2f} seconds")
            print(f"📊 Analysis method: {result.get('metadata', {}).get('analysis_method', 'unknown')}")
            print(f"🎯 Parameters detected: {result.get('metadata', {}).get('parameter_count', 0)}")
            print(f"✅ Integrity verified: {result.get('metadata', {}).get('integrity_verified', False)}")

            # Check if it's actually doing analysis
            ai_extraction = result.get('metadata', {}).get('ai_extraction', {})
            print(f"🤖 AI extraction success: {ai_extraction.get('success', False)}")
            print(f"📋 Total parameters found: {ai_extraction.get('total_parameters', 0)}")
            print(f"💹 Trading filters found: {ai_extraction.get('trading_filters', 0)}")

            if processing_time < 3:
                print(f"🎉 EXCELLENT: Real scanner analyzed in {processing_time:.2f}s")
            elif processing_time < 8:
                print(f"✅ GOOD: Real scanner analyzed in {processing_time:.2f}s")
            else:
                print(f"⚠️ SLOW: Real scanner took {processing_time:.2f}s - may need further optimization")

            # Verify it's not using fallback mode
            if result.get('metadata', {}).get('analysis_method') == 'fallback_mode':
                print("❌ WARNING: Using fallback mode - not doing real analysis!")
            else:
                print("✅ Using proper deep analysis mode")

        else:
            print(f"❌ HTTP Error: {response.status_code}")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print(f"❌ TIMEOUT: Real scanner analysis still hanging after 2 minutes")
    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    test_real_lc_d2_formatting()