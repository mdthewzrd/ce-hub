#!/usr/bin/env python3
"""
🔍 Debug LC D2 API Call Issues
Test the specific API calls that LC D2 scanner makes to find the failure
"""
import requests
import asyncio
import aiohttp
import json

async def test_polygon_api_calls():
    """Test the actual API calls the LC D2 scanner makes"""
    print("🔍 DEBUGGING LC D2 API CALLS")
    print("Testing Polygon.io API calls that LC D2 scanner uses...")
    print("=" * 70)

    # API key from LC D2 scanner
    API_KEY = '4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy'

    # Test 1: Daily market data (what LC D2 uses first)
    test_date = "2024-08-01"
    url1 = f"https://api.polygon.io/v2/aggs/grouped/locale/us/market/stocks/{test_date}?adjusted=true&apiKey={API_KEY}"

    print(f"🌐 Test 1: Daily market data for {test_date}")
    print(f"URL: {url1}")

    try:
        response = requests.get(url1, timeout=30)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            results_count = len(data.get('results', []))
            print(f"✅ SUCCESS: Got {results_count} daily results")

            if results_count > 0:
                sample_ticker = data['results'][0]['T']
                print(f"Sample ticker: {sample_ticker}")

                # Test 2: Minute data for specific ticker (intensive call)
                start_date = "2024-08-01"
                end_date = "2024-08-01"
                url2 = f"https://api.polygon.io/v2/aggs/ticker/{sample_ticker}/range/1/minute/{start_date}/{end_date}?adjusted=true&apiKey={API_KEY}"

                print(f"\n🌐 Test 2: Minute data for {sample_ticker}")
                print(f"URL: {url2}")

                response2 = requests.get(url2, timeout=30)
                print(f"Status: {response2.status_code}")

                if response2.status_code == 200:
                    data2 = response2.json()
                    results_count2 = len(data2.get('results', []))
                    print(f"✅ SUCCESS: Got {results_count2} minute results")
                else:
                    print(f"❌ FAILED: {response2.text}")

                # Test 3: 30-minute data (another intensive call)
                url3 = f"https://api.polygon.io/v2/aggs/ticker/{sample_ticker}/range/30/minute/{start_date}/{end_date}?adjusted=true&apiKey={API_KEY}"

                print(f"\n🌐 Test 3: 30-minute data for {sample_ticker}")
                print(f"URL: {url3}")

                response3 = requests.get(url3, timeout=30)
                print(f"Status: {response3.status_code}")

                if response3.status_code == 200:
                    data3 = response3.json()
                    results_count3 = len(data3.get('results', []))
                    print(f"✅ SUCCESS: Got {results_count3} 30-minute results")
                else:
                    print(f"❌ FAILED: {response3.text}")

        else:
            print(f"❌ FAILED: {response.text}")

    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

    # Test 4: Check API key limits and status
    print(f"\n🌐 Test 4: API key status check")
    status_url = f"https://api.polygon.io/v3/reference/tickers?active=true&limit=1&apikey={API_KEY}"

    try:
        response = requests.get(status_url, timeout=30)
        print(f"Status: {response.status_code}")

        if response.status_code == 200:
            print("✅ API key is working")
        elif response.status_code == 401:
            print("❌ API key is invalid")
        elif response.status_code == 403:
            print("❌ API key lacks permissions")
        elif response.status_code == 429:
            print("❌ Rate limit exceeded")
        else:
            print(f"❌ Unknown error: {response.text}")

    except Exception as e:
        print(f"❌ EXCEPTION: {e}")

def main():
    """Debug LC D2 API issues"""
    print("🔍 LC D2 API DEBUGGING")
    print("Finding why LC D2 scanner can't fetch data")

    asyncio.run(test_polygon_api_calls())

    print(f"\n{'='*70}")
    print("🎯 DEBUGGING COMPLETE")
    print("Check the API test results above to identify the issue")

if __name__ == "__main__":
    main()