#!/usr/bin/env python3
"""
Test and analyze chart API response data
"""
import requests
import json

def test_chart_response():
    """Test chart API and analyze response"""
    url = "http://localhost:8000/api/chart/SPY"
    params = {
        'timeframe': '5min',
        'lc_date': '2024-11-15',
        'day_offset': 0
    }

    print("🔍 Testing Chart API...")
    response = requests.get(url, params=params)
    print(f"Status Code: {response.status_code}")

    if response.status_code == 200:
        data = response.json()

        # Analyze the response
        chart_data = data['chartData']

        print("\n📊 Chart Data Analysis:")
        print(f"- Data points: {len(chart_data['x'])}")
        print(f"- Date range: {chart_data['x'][0]} to {chart_data['x'][-1]}")

        # Analyze prices
        close_prices = chart_data['close']
        print(f"- Close price range: ${min(close_prices):.2f} - ${max(close_prices):.2f}")
        print(f"- Opening price: ${chart_data['open'][0]:.2f}")
        print(f"- Closing price: ${chart_data['close'][-1]:.2f}")

        # Check for proper data structure
        print("\n🏗️ Data Structure:")
        print(f"- Has x (timestamps): {len(chart_data.get('x', []))}")
        print(f"- Has open: {len(chart_data.get('open', []))}")
        print(f"- Has high: {len(chart_data.get('high', []))}")
        print(f"- Has low: {len(chart_data.get('low', []))}")
        print(f"- Has close: {len(chart_data.get('close', []))}")
        print(f"- Has volume: {len(chart_data.get('volume', []))}")

        # Check for scaling issues
        if min(close_prices) < 10:
            print("⚠️ WARNING: Possible data scaling issue detected!")
        else:
            print("✅ Price data appears correctly scaled")

        # Sample data points
        print("\n📈 Sample Data Points (first 3):")
        for i in range(min(3, len(chart_data['x']))):
            print(f"  {i+1}: {chart_data['x'][i]} - O:{chart_data['open'][i]:.2f} H:{chart_data['high'][i]:.2f} L:{chart_data['low'][i]:.2f} C:{chart_data['close'][i]:.2f} V:{chart_data['volume'][i]}")

        return True

    else:
        print(f"❌ Error: {response.status_code}")
        print(f"Response: {response.text}")
        return False

if __name__ == "__main__":
    test_chart_response()