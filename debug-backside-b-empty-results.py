#!/usr/bin/env python3
"""
DEBUG BACKSIDE B EMPTY RESULTS ISSUE
Investigating why the backside B scanner returns empty results despite successful execution
"""

import requests
import json
import sys
import subprocess
import time
from datetime import datetime

def test_backend_health():
    """Check if backend is running and accessible"""
    print("🔍 Checking backend health...")
    try:
        response = requests.get('http://localhost:8000/api/projects', timeout=5)
        if response.ok:
            print("✅ Backend is healthy")
            return True
        else:
            print(f"❌ Backend returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Backend connection failed: {e}")
        return False

def read_backside_b_code():
    """Read the actual backside B code"""
    print("\n📄 Reading backside B code...")
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            code = f.read()
        print(f"✅ Code loaded: {len(code)} characters")
        return code
    except Exception as e:
        print(f"❌ Failed to read backside B code: {e}")
        return None

def test_direct_execution():
    """Test backside B code execution directly"""
    print("\n🚀 Testing direct scanner execution...")

    # Read the scanner code
    code = read_backside_b_code()
    if not code:
        return False

    # Execute via working scan endpoint
    payload = {
        "uploaded_code": code,
        "scanner_type": "uploaded",
        "date_range": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-01"
        },
        "parallel_execution": True,
        "timeout_seconds": 300
    }

    print("📡 Sending execution request...")
    print(f"📅 Date range: 2025-01-01 to 2025-11-01")
    print(f"📝 Code length: {len(code)} characters")

    try:
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=payload,
            timeout=300
        )

        if not response.ok:
            print(f"❌ Execution request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        result = response.json()
        print(f"✅ Execution response received!")
        print(f"📊 Success: {result.get('success')}")
        print(f"📊 Status: {result.get('status')}")
        print(f"📊 Total Found: {result.get('total_found', 0)}")
        print(f"📊 Results Count: {len(result.get('results', []))}")
        print(f"📊 Execution Time: {result.get('execution_time', 'N/A')}")
        print(f"📊 Message: {result.get('message', 'No message')}")

        if result.get('results') and len(result.get('results', [])) > 0:
            print(f"\n🎉 FOUND {len(result['results'])} TRADING SIGNALS!")
            for i, signal in enumerate(result['results'][:5]):  # Show first 5
                print(f"  {i+1}. {signal.get('ticker', 'Unknown')}: {signal.get('signal', 'Signal')} on {signal.get('date', 'N/A')}")
            return True
        else:
            print(f"\n❌ NO TRADING SIGNALS FOUND!")
            print(f"💡 This is the core issue - the scanner runs but produces no results")

            # Try to get more debug info
            if 'debug_info' in result:
                print(f"🔍 Debug info: {result['debug_info']}")

            return False

    except Exception as e:
        print(f"❌ Execution failed: {e}")
        return False

def test_different_date_ranges():
    """Test with different date ranges to see if it's a market data issue"""
    print("\n🗓️ Testing different date ranges...")

    code = read_backside_b_code()
    if not code:
        return

    date_ranges = [
        ("2024-01-01", "2024-12-31"),  # Full 2024
        ("2024-06-01", "2024-06-30"),  # June 2024
        ("2024-01-01", "2024-03-31"),  # Q1 2024
        ("2023-01-01", "2023-12-31"),  # Full 2023
    ]

    for start_date, end_date in date_ranges:
        print(f"\n📅 Testing {start_date} to {end_date}...")

        payload = {
            "uploaded_code": code,
            "scanner_type": "uploaded",
            "date_range": {
                "start_date": start_date,
                "end_date": end_date
            },
            "parallel_execution": True,
            "timeout_seconds": 180
        }

        try:
            response = requests.post(
                'http://localhost:8000/api/scan/execute',
                json=payload,
                timeout=200
            )

            if response.ok:
                result = response.json()
                total_found = result.get('total_found', 0)
                results_count = len(result.get('results', []))

                print(f"  📊 Results: {total_found} found, {results_count} returned")

                if results_count > 0:
                    print(f"  ✅ FOUND SIGNALS in this date range!")
                    return True
                else:
                    print(f"  ❌ No signals in this date range")
            else:
                print(f"  ❌ Request failed: {response.status_code}")

        except Exception as e:
            print(f"  ❌ Test failed: {e}")

    print(f"\n❌ NO DATE RANGE PRODUCED SIGNALS")
    return False

def test_code_analysis():
    """Analyze the backside B code to understand what it should produce"""
    print("\n🔍 Analyzing backside B code...")

    code = read_backside_b_code()
    if not code:
        return

    # Look for key indicators
    print(f"📝 Code Analysis:")
    print(f"  - Total lines: {len(code.splitlines())}")
    print(f"  - Contains 'def main': {'def main' in code}")
    print(f"  - Contains 'asyncio.run': {'asyncio.run' in code}")
    print(f"  - Contains 'yfinance': {'yfinance' in code}")
    print(f"  - Contains 'pandas': {'pandas' in code or 'pd' in code}")
    print(f"  - Contains 'results' or 'signals': {'results' in code.lower() or 'signals' in code.lower()}")

    # Look for expected output patterns
    if 'print(' in code or 'print("' in code:
        print(f"  ✅ Contains print statements - should produce output")
    else:
        print(f"  ⚠️ No print statements found - might not output signals")

    # Look for data fetching patterns
    data_sources = []
    if 'yf.download' in code:
        data_sources.append('yfinance')
    if 'polygon' in code.lower():
        data_sources.append('polygon')

    print(f"  📊 Data sources: {data_sources if data_sources else 'None detected'}")

    # Check for return values
    if 'return' in code:
        print(f"  ✅ Contains return statements")
    else:
        print(f"  ⚠️ No return statements - might not return data")

def test_simple_scanner():
    """Test with a simple known-working scanner"""
    print("\n🧪 Testing simple known-working scanner...")

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

    payload = {
        "uploaded_code": simple_scanner,
        "scanner_type": "uploaded",
        "date_range": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-01"
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

            if results_count > 0:
                print("✅ Simple scanner works - backend execution is functional")
                for signal in result['results'][:3]:
                    print(f"  - {signal.get('ticker')}: {signal.get('signal')} @ {signal.get('price')}")
                return True
            else:
                print("❌ Even simple scanner produces no results - deeper backend issue")
                return False
        else:
            print(f"❌ Simple scanner request failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Simple scanner test failed: {e}")
        return False

def main():
    print("🔍 DEBUGGING BACKSIDE B EMPTY RESULTS ISSUE")
    print("=" * 60)

    # Step 1: Check backend health
    if not test_backend_health():
        print("\n❌ Backend is not healthy - fix this first")
        return False

    # Step 2: Analyze the code
    test_code_analysis()

    # Step 3: Test simple scanner first
    if not test_simple_scanner():
        print("\n❌ Even simple scanner fails - backend execution is broken")
        return False

    # Step 4: Test the actual backside B scanner
    if not test_direct_execution():
        print("\n❌ Backside B scanner produces no results")
        print("💡 This confirms the issue seen in the frontend")

        # Step 5: Test different date ranges
        if not test_different_date_ranges():
            print("\n❌ No date range produces signals - scanner logic issue")
            return False

    print("\n✅ BACKSIDE B SCANNER WORKS AND PRODUCES RESULTS!")
    return True

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)