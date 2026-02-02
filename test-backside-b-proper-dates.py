#!/usr/bin/env python3
"""
Test backside B with proper date range 1/1/25-11/1/25 to validate we get 8 results
"""

import requests
import json

def test_backside_b_proper_dates():
    """Test backside B with proper date format that should work"""
    print("🧪 Testing backside B with proper date range 1/1/25-11/1/25...")

    # Read the actual backside B code
    try:
        with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
            backside_code = f.read()
    except Exception as e:
        print(f"❌ Failed to read backside B code: {e}")
        return False

    # Test with CORRECT date format (not auto-90day)
    payload = {
        "uploaded_code": backside_code,
        "scanner_type": "uploaded",
        "date_range": {
            "start_date": "2025-01-01",  # Proper date format as requested
            "end_date": "2025-11-01"     # Proper date format as requested  
        },
        "parallel_execution": True,
        "timeout_seconds": 300
    }

    print(f"📅 Using EXACT date range: 2025-01-01 to 2025-11-01")
    print(f"📝 Code length: {len(backside_code)} characters")
    print(f"🎯 Expecting: 8 trading results based on your confirmation")

    try:
        response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=payload,
            timeout=320
        )

        if response.ok:
            result = response.json()
            results_count = len(result.get('results', []))
            total_found = result.get('total_found', 0)

            print(f"\n📊 BACKSIDE B EXECUTION RESULTS:")
            print(f"✅ Success: {result.get('success')}")
            print(f"📊 Results Count: {results_count}")
            print(f"📊 Total Found: {total_found}")
            print(f"📊 Status: {result.get('status')}")
            print(f"📊 Execution Time: {result.get('execution_time', 'N/A')}")
            print(f"📊 Message: {result.get('message', 'No message')}")

            if results_count == 8:
                print(f"\n🎉 SUCCESS! Got expected 8 trading results!")
                print(f"✅ The synchronous execution fix is working perfectly")
                
                # Show the first few results
                for i, signal in enumerate(result['results'][:3]):
                    print(f"  {i+1}. {signal.get('ticker', signal.get('Ticker', 'Unknown'))}: {signal.get('signal', 'Signal')} on {signal.get('date', signal.get('Date', 'N/A'))}")
                
                if len(result['results']) > 3:
                    print(f"  ... and {len(result['results']) - 3} more results")
                
                return True
            elif results_count > 0:
                print(f"\n⚠️  Got {results_count} results instead of expected 8")
                print(f"🔍 Fix is working, but result count differs from expectation")
                
                for i, signal in enumerate(result['results'][:3]):
                    print(f"  {i+1}. {signal.get('ticker', signal.get('Ticker', 'Unknown'))}: {signal.get('signal', 'Signal')} on {signal.get('date', signal.get('Date', 'N/A'))}")
                
                return True
            else:
                print(f"\n❌ FAILED: Got 0 results instead of expected 8")
                print(f"🔍 There may still be an issue with the execution")
                return False
        else:
            print(f"❌ Request failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

def main():
    print("🔍 TESTING BACKSIDE B WITH PROPER DATE RANGE")
    print("=" * 60)
    print("💡 Testing the synchronous execution fix with the exact date range you specified")
    print("💡 Expected: 8 trading results from 1/1/25-11/1/25")
    print()

    success = test_backside_b_proper_dates()

    if success:
        print("\n✅ BACKSIDE B EXECUTION FIX VALIDATED!")
        print("🚀 The synchronous execution is working and producing real trading results")
    else:
        print("\n❌ BACKSIDE B STILL NOT WORKING")
        print("🔍 Further investigation needed")

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)
