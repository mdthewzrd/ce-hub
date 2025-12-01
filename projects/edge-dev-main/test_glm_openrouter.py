#!/usr/bin/env python3
"""
Test GLM via OpenRouter API (same as Cursor)
"""

import requests
import json

def test_glm_openrouter():
    """Test GLM via OpenRouter"""

    url = "https://openrouter.ai/api/v1/chat/completions"

    headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY',
        'HTTP-Referer': 'https://cursor.sh',
        'X-Title': 'EdgeDev GLM Test'
    }

    data = {
        "model": "zhipuai/glm-4.5",
        "messages": [
            {
                "role": "system",
                "content": "You are an expert trading assistant. Respond briefly."
            },
            {
                "role": "user",
                "content": "Test message: Can you format this Python code snippet?\n\ndef test():\n    return 'hello world'"
            }
        ],
        "max_tokens": 200,
        "temperature": 0.1
    }

    print("🤖 Testing GLM via OpenRouter API (Cursor-style setup)")
    print(f"🔑 API Key: 05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY")
    print(f"🎯 Model: zhipuai/glm-4.5")
    print()

    try:
        response = requests.post(url, headers=headers, json=data, timeout=30)
        print(f"📡 Response status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS! GLM is working via OpenRouter")
            print(f"📄 Response: {result['choices'][0]['message']['content'][:200]}...")
        else:
            print(f"❌ Error: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Exception: {e}")

if __name__ == "__main__":
    test_glm_openrouter()