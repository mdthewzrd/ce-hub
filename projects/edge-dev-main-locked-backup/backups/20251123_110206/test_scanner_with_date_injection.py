#!/usr/bin/env python3

import requests
import json
import re
from datetime import datetime, timedelta

def test_scanner_with_date_injection():
    """Test the LC D2 scanner with proper date injection"""

    # Use historical dates where stock data should exist
    start_date = "2024-01-01"
    end_date = "2024-11-01"

    print(f"🧪 Testing LC D2 scanner with date injection: {start_date} to {end_date}")

    # Read the LC D2 scanner code
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py"

    try:
        with open(scanner_file, 'r') as f:
            scanner_code = f.read()
    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        return

    # Inject the correct date range into the scanner code
    print("🔧 Injecting correct date range into scanner code...")

    # Replace hardcoded DATE value
    modified_code = re.sub(
        r'DATE\s*=\s*["\'][^"\']+["\']',
        f'DATE = "{end_date}"',
        scanner_code
    )

    # Also inject START_DATE and END_DATE variables if they exist
    if 'START_DATE' in modified_code:
        modified_code = re.sub(
            r'START_DATE\s*=\s*["\'][^"\']+["\']',
            f'START_DATE = "{start_date}"',
            modified_code
        )
    else:
        # Add START_DATE if it doesn't exist
        modified_code = f'START_DATE = "{start_date}"\n' + modified_code

    if 'END_DATE' in modified_code:
        modified_code = re.sub(
            r'END_DATE\s*=\s*["\'][^"\']+["\']',
            f'END_DATE = "{end_date}"',
            modified_code
        )
    else:
        # Add END_DATE if it doesn't exist
        modified_code = f'END_DATE = "{end_date}"\n' + modified_code

    # Look for PRINT_FROM and PRINT_TO date variables and update them
    if 'PRINT_FROM' in modified_code:
        modified_code = re.sub(
            r'PRINT_FROM\s*=\s*["\'][^"\']+["\']',
            f'PRINT_FROM = "{start_date}"',
            modified_code
        )

    if 'PRINT_TO' in modified_code:
        modified_code = re.sub(
            r'PRINT_TO\s*=\s*["\'][^"\']+["\']',
            f'PRINT_TO = "{end_date}"',
            modified_code
        )

    print(f"✅ Date injection complete")
    print(f"📝 Modified code length: {len(modified_code)} chars")

    # Prepare the request payload with the modified code
    payload = {
        "start_date": start_date,
        "end_date": end_date,
        "scanner_type": "uploaded",
        "uploaded_code": modified_code
    }

    print("📤 Sending request to scanner API with date-injected code...")

    try:
        # Call the scanner API
        response = requests.post(
            "http://localhost:8000/api/scan/execute",
            json=payload,
            headers={"Content-Type": "application/json"},
            timeout=180  # Allow 3 minutes for scan completion
        )

        print(f"📊 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ Scanner executed successfully!")
            print(f"📈 Results: {json.dumps(result, indent=2)}")

            # Check if we got actual ticker results
            if 'results' in result and result['results']:
                ticker_count = len(result['results'])
                print(f"🎯 Found {ticker_count} qualifying stocks!")

                # Show first few results as examples
                for i, stock in enumerate(result['results'][:5]):
                    if isinstance(stock, dict) and 'ticker' in stock:
                        print(f"  📊 {i+1}. {stock['ticker']}")
                    else:
                        print(f"  📊 {i+1}. {stock}")
            else:
                print("⚠️  No qualifying stocks found - may need to adjust criteria or check data availability")

        else:
            print(f"❌ Scanner API error: {response.status_code}")
            print(f"Error details: {response.text}")

    except requests.exceptions.RequestException as e:
        print(f"❌ Request failed: {e}")
    except json.JSONDecodeError as e:
        print(f"❌ JSON decode error: {e}")
        print(f"Raw response: {response.text}")

if __name__ == "__main__":
    test_scanner_with_date_injection()