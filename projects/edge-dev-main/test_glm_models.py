#!/usr/bin/env python3
"""
Test different GLM model names to find what works with your subscription
"""

import requests
import json

def test_glm_models():
    """Test different GLM model configurations"""

    base_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    api_key = "05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY"

    models_to_test = [
        "glm-4.5",
        "glm-4.5-flash",
        "glm-4.5-plus",
        "glm-4",
        "glm-4v",
        "glm-4-flash",
        "zhipuai/glm-4.5",
        "zhipuai/glm-4.5-flash"
    ]

    headers = {
        'Content-Type': 'application/json',
        'Authorization': f'Bearer {api_key}'
    }

    print(f"🔍 Testing different GLM model names with your API key...")
    print(f"🔑 API Key: {api_key[:15]}...")
    print()

    for model in models_to_test:
        print(f"🧪 Testing model: {model}")

        data = {
            "model": model,
            "messages": [
                {"role": "system", "content": "You are an expert trading assistant."},
                {"role": "user", "content": "Hello, test this model"}
            ],
            "max_tokens": 50,
            "temperature": 0.1
        }

        try:
            response = requests.post(base_url, headers=headers, json=data, timeout=30)

            if response.status_code == 200:
                result = response.json()
                print(f"✅ SUCCESS: {model} works!")
                print(f"   Response: {result['choices'][0]['message']['content'][:50]}...")

                # If one works, we can stop
                break
            else:
                error = response.json()
                error_msg = error.get('error', {}).get('message', str(response.status_code))
                print(f"❌ Failed: {model} - {error_msg}")

        except Exception as e:
            print(f"❌ Exception: {model} - {e}")

if __name__ == "__main__":
    test_glm_models()