# Simple test scan for drag and drop functionality
import pandas as pd
import requests
from datetime import datetime

# Basic configuration
API_KEY = "your_api_key_here"
BASE_URL = "https://api.polygon.io"

# Simple parameters
P = {
    "price_min": 10.0,
    "volume_min": 1000000,
    "gap_threshold": 0.02
}

# Test symbols
SYMBOLS = ['AAPL', 'MSFT', 'GOOGL', 'TSLA', 'AMZN']

def fetch_data(symbol):
    # Placeholder function for fetching data
    url = f"{BASE_URL}/v2/aggs/ticker/{symbol}/range/1/day/2024-01-01/2024-12-31"
    try:
        response = requests.get(url, params={"apiKey": API_KEY})
        return response.json()
    except Exception as e:
        print(f"Error fetching {symbol}: {e}")
        return None

def simple_gap_scan():
    results = []
    for symbol in SYMBOLS:
        data = fetch_data(symbol)
        if data:
            # Simple gap detection logic would go here
            results.append({
                'symbol': symbol,
                'gap_percent': 0.05,  # Mock data
                'volume': 5000000,
                'price': 150.00
            })
    return results

if __name__ == "__main__":
    print("Running simple gap scan...")
    results = simple_gap_scan()
    print(f"Found {len(results)} potential trades")