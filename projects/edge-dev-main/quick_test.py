#!/usr/bin/env python3
"""
Quick test of backside scanner execution via REST API
"""

import requests
import json

def test_backside_scanner():
    """Test the backside scanner through the Renata API"""

    # Read the backside scanner code
    with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
        backside_code = f.read()

    print("🚀 Testing Backside Scanner via Renata API")
    print(f"📊 Code length: {len(backside_code)} characters")
    print(f"📅 Date range: 2025-01-01 to 2025-11-01")
    print()

    # Create a simple message to trigger execution
    message = f"""Execute this enhanced backside scanner from 1/1/25 to 11/1/25:

```python
{backside_code}
```

Please execute with real market data and show results."""

    try:
        print("🌐 Calling Renata API...")
        response = requests.post(
            "http://localhost:5656/api/renata/chat",
            json={
                "message": message,
                "context": {
                    "execution_mode": "real",
                    "start_date": "2025-01-01",
                    "end_date": "2025-11-01",
                    "api_key": "Fm7brz4s23eSocDErnL68cE7wspz2K1I"
                }
            },
            timeout=300  # 5 minutes
        )

        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"📄 Response: {result.get('message', 'No message')[:500]}...")

            # Look for execution results in the response
            if 'data' in result:
                data = result.get('data', {})
                if 'executionResults' in data:
                    signals = data.get('executionResults', [])
                    print(f"🎯 Signals found: {len(signals)}")

                    if signals:
                        print(f"📈 First 3 signals:")
                        for i, signal in enumerate(signals[:3]):
                            print(f"  {i+1}. {signal}")

                        if len(signals) >= 8:
                            print(f"✅ SUCCESS: Found {len(signals)} signals (8+ as requested!)")
                        else:
                            print(f"⚠️  Found {len(signals)} signals (expected 8+)")

        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_backside_scanner()