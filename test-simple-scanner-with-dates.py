#!/usr/bin/env python3
"""
Test simple scanner with proper date format to verify this works
"""

import requests
import json

def test_simple_scanner_proper_dates():
    """Test simple scanner with proper date format"""
    print("🧪 Testing simple scanner with proper date format...")

    simple_scanner = '''
import yfinance as yf
import pandas as pd
from datetime import datetime, timedelta

def main():
    try:
        # Get some popular tech stocks
        symbols = ['AAPL', 'GOOGL', 'MSFT', 'TSLA']

        results = []
        for symbol in symbols:
            try:
                # Get recent data
                ticker = yf.Ticker(symbol)
                data = ticker.history(period="1mo")

                if len(data) > 0:
                    latest_price = data['Close'].iloc[-1]
                    prev_price = data['Close'].iloc[-2] if len(data) > 1 else latest_price

                    # Simple signal: price increase
                    if latest_price > prev_price:
                        signal = "BULLISH"
                    elif latest_price < prev_price:
                        signal = "BEARISH"
                    else:
                        signal = "NEUTRAL"

                    results.append({
                        'ticker': symbol,
                        'signal': signal,
                        'price': round(latest_price, 2),
                        'date': datetime.now().strftime('%Y-%m-%d')
                    })

            except Exception as e:
                print(f"Error processing {symbol}: {e}")
                continue

        print(f"Simple scanner found {len(results)} signals")
        return results

    except Exception as e:
        print(f"Simple scanner error: {e}")
        return []

if __name__ == "__main__":
    results = main()
    print(f"Final results: {results}")
'''

    # Test with PROPER date format (not auto-90day)
    payload = {
        "uploaded_code": simple_scanner,
        "scanner_type": "uploaded",
        "date_range": {
            "start_date": "2025-01-01",  # Proper date format
            "end_date": "2025-11-01"     # Proper date format
        },
        "parallel_execution": True,
        "timeout_seconds": 60
    }

    try:
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=payload,
            timeout=80
        )

        if response.ok:
            result = response.json()
            results_count = len(result.get('results', []))

            print(f"📊 Simple scanner results: {results_count} signals found")
            print(f"✅ Success: {result.get('success')}")
            print(f"📊 Total Found: {result.get('total_found', 0)}")
            print(f"📊 Status: {result.get('status')}")

            if results_count > 0:
                print("✅ Simple scanner works with proper dates!")
                for signal in result['results'][:3]:
                    print(f"  - {signal.get('ticker')}: {signal.get('signal')} @ {signal.get('price')}")
                return True
            else:
                print("❌ Even with proper dates, no results")
                return False
        else:
            print(f"❌ Simple scanner request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Simple scanner test failed: {e}")
        return False

def test_backside_b_with_proper_dates():
    """Test backside B with proper date format"""
    print("\n🔍 Testing backside B with proper date format...")

    # Read the actual backside B code
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            backside_code = f.read()
    except Exception as e:
        print(f"❌ Failed to read backside B code: {e}")
        return False

    # Test with PROPER date format
    payload = {
        "uploaded_code": backside_code,
        "scanner_type": "uploaded",
        "date_range": {
            "start_date": "2025-01-01",  # Proper date format
            "end_date": "2025-11-01"     # Proper date format
        },
        "parallel_execution": True,
        "timeout_seconds": 300
    }

    print(f"📅 Using proper date range: 2025-01-01 to 2025-11-01")
    print(f"📝 Code length: {len(backside_code)} characters")

    try:
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=payload,
            timeout=320
        )

        if response.ok:
            result = response.json()
            results_count = len(result.get('results', []))

            print(f"📊 Backside B results: {results_count} signals found")
            print(f"✅ Success: {result.get('success')}")
            print(f"📊 Total Found: {result.get('total_found', 0)}")
            print(f"📊 Status: {result.get('status')}")
            print(f"📊 Execution Time: {result.get('execution_time', 'N/A')}")

            if results_count > 0:
                print(f"🎉 SUCCESS! Backside B found {results_count} trading signals!")
                for signal in result['results'][:5]:
                    print(f"  - {signal.get('Ticker', signal.get('ticker', 'Unknown'))}: {signal.get('signal', 'Signal')} on {signal.get('Date', signal.get('date', 'N/A'))}")
                return True
            else:
                print("❌ Backside B returned no results even with proper dates")
                return False
        else:
            print(f"❌ Backside B request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Backside B test failed: {e}")
        return False

def main():
    print("🔍 TESTING DATE FORMAT HYPOTHESIS")
    print("=" * 50)

    print("💡 Hypothesis: The issue is 'auto-90day' date format being sent by frontend")
    print("💡 Testing with proper date strings to verify this fixes the issue\n")

    # Test 1: Simple scanner with proper dates
    if not test_simple_scanner_proper_dates():
        print("\n❌ Even simple scanner fails - backend is broken")
        return False

    # Test 2: Backside B with proper dates
    if not test_backside_b_with_proper_dates():
        print("\n❌ Backside B still fails even with proper dates")
        return False

    print("\n✅ DATE FORMAT HYPOTHESIS CONFIRMED!")
    print("🎯 The issue is that frontend sends 'auto-90day' but backend expects proper dates")
    print("🔧 Fix: Update frontend to send proper date format instead of 'auto-90day'")
    return True

if __name__ == "__main__":
    success = main()
    if success:
        print("\n🚀 SOLUTION FOUND: Fix frontend date format!")
    else:
        print("\n❌ Date format is not the issue")