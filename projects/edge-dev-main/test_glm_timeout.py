#!/usr/bin/env python3
"""
Test GLM API timeout issues with different payloads
"""

import requests
import json
import time

def test_glm_simple():
    """Test simple GLM API call"""
    print("🧪 Testing Simple GLM API Call...")

    glm_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    glm_headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY'
    }

    glm_payload = {
        'model': 'glm-4.5-flash',
        'messages': [
            {
                'role': 'system',
                'content': 'You are a helpful AI assistant.'
            },
            {
                'role': 'user',
                'content': 'Say "Hello" if you can read this.'
            }
        ],
        'temperature': 0.1,
        'max_tokens': 10
    }

    try:
        start_time = time.time()
        response = requests.post(glm_url, headers=glm_headers, json=glm_payload, timeout=15)
        elapsed_time = time.time() - start_time

        print(f"📡 GLM API Response Status: {response.status_code}")
        print(f"⏱️ Response Time: {elapsed_time:.2f} seconds")

        if response.status_code == 200:
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            print(f"✅ GLM Simple Test: SUCCESS")
            print(f"📄 GLM Response: {content}")
        else:
            print(f"❌ GLM Simple Test: FAILED")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Simple test timed out after 15 seconds")
    except Exception as e:
        print(f"❌ Simple test error: {str(e)}")

def test_glm_code_formatting():
    """Test GLM API with code formatting task"""
    print("\n🧪 Testing GLM Code Formatting...")

    glm_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    glm_headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY'
    }

    # Short code snippet for formatting
    test_code = '''import pandas as pd
def simple_function():
    x = 5
    return x * 2'''

    glm_payload = {
        'model': 'glm-4.5-flash',
        'messages': [
            {
                'role': 'system',
                'content': 'You are an expert code formatter. Format the code and preserve all parameters exactly.'
            },
            {
                'role': 'user',
                'content': f'Please format this Python code:\n\n```python\n{test_code}\n```\n\nReturn only the formatted code.'
            }
        ],
        'temperature': 0.1,
        'max_tokens': 1000
    }

    try:
        start_time = time.time()
        response = requests.post(glm_url, headers=glm_headers, json=glm_payload, timeout=30)
        elapsed_time = time.time() - start_time

        print(f"📡 GLM Code Format Response Status: {response.status_code}")
        print(f"⏱️ Response Time: {elapsed_time:.2f} seconds")

        if response.status_code == 200:
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            print(f"✅ GLM Code Format Test: SUCCESS")
            print(f"📄 Formatted Code Length: {len(content)} characters")
            print("📄 Formatted Code Preview:")
            print(content[:200] + "..." if len(content) > 200 else content)
        else:
            print(f"❌ GLM Code Format Test: FAILED")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Code format test timed out after 30 seconds")
    except Exception as e:
        print(f"❌ Code format test error: {str(e)}")

def test_glm_large_code():
    """Test GLM API with larger code (like our backside scanner)"""
    print("\n🧪 Testing GLM Large Code Formatting...")

    glm_url = "https://open.bigmodel.cn/api/paas/v4/chat/completions"
    glm_headers = {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer 05d75ef6fbe645c78d10d92dd4b2a3a3.o0Dmxb2c2EMnmjkY'
    }

    # Read a larger code sample
    with open('/Users/michaeldurante/Downloads/backside para b copy.py', 'r') as f:
        large_code = f.read()

    # Take first 2000 characters to test
    code_sample = large_code[:2000] + "\n\n# ... (code truncated for test)"

    glm_payload = {
        'model': 'glm-4.5-flash',
        'messages': [
            {
                'role': 'system',
                'content': 'You are an expert trading scanner code formatter. PRESERVE ALL ORIGINAL PARAMETERS EXACTLY as they appear. DO NOT change any variable names, function names, or parameter values. Enhance code structure, readability, and performance. Return ONLY the formatted Python code, no explanations.'
            },
            {
                'role': 'user',
                'content': f'Please format this backside B scanner code:\n\n```python\n{code_sample}\n```\n\nReturn ONLY the enhanced code with all original parameters preserved exactly.'
            }
        ],
        'temperature': 0.1,
        'max_tokens': 4000
    }

    try:
        start_time = time.time()
        response = requests.post(glm_url, headers=glm_headers, json=glm_payload, timeout=45)
        elapsed_time = time.time() - start_time

        print(f"📡 GLM Large Code Response Status: {response.status_code}")
        print(f"⏱️ Response Time: {elapsed_time:.2f} seconds")

        if response.status_code == 200:
            result = response.json()
            content = result.get('choices', [{}])[0].get('message', {}).get('content', '')
            print(f"✅ GLM Large Code Test: SUCCESS")
            print(f"📄 Input Code Length: {len(code_sample)} characters")
            print(f"📄 Output Code Length: {len(content)} characters")

            # Check for parameter preservation
            if 'API_KEY' in content and 'Fm7brz4s23eSocDErnL68cE7wspz2K1I' in content:
                print("✅ Parameter preservation: SUCCESS")
            else:
                print("❌ Parameter preservation: FAILED")

        else:
            print(f"❌ GLM Large Code Test: FAILED")
            print(f"Response: {response.text}")

    except requests.exceptions.Timeout:
        print("❌ Large code test timed out after 45 seconds")
    except Exception as e:
        print(f"❌ Large code test error: {str(e)}")

if __name__ == "__main__":
    # Test simple GLM call first
    test_glm_simple()

    # Test code formatting
    test_glm_code_formatting()

    # Test large code formatting (this might be the issue)
    test_glm_large_code()