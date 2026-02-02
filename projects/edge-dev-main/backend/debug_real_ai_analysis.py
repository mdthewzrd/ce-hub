#!/usr/bin/env python3
"""
DEBUG: Test real AI analysis step by step to find the exact failure point
"""
import os
import asyncio
import aiohttp
import time
import logging
from ai_scanner_service_guaranteed import GuaranteedAIScannerService

# Configure logging to see all debug info
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

async def debug_real_ai_analysis():
    print("🔍 DEBUGGING REAL AI ANALYSIS STEP BY STEP")
    print("=" * 60)

    # Load the real file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py', 'r') as f:
            real_code = f.read()

        print(f"📄 Real file loaded: {len(real_code):,} characters")

    except Exception as e:
        print(f"❌ Failed to load real file: {e}")
        return

    # Create the service
    service = GuaranteedAIScannerService()

    # Check API key
    print(f"\n🔑 CHECKING API KEY:")
    if service.openrouter_api_key:
        print(f"   ✅ OPENROUTER_API_KEY is configured")
        print(f"   📝 Key starts with: {service.openrouter_api_key[:15]}...")
    else:
        print(f"   ❌ OPENROUTER_API_KEY is missing!")
        return

    # Test 1: Check AST scanner extraction
    print(f"\n🧪 TEST 1: AST SCANNER FUNCTION EXTRACTION")
    print("-" * 50)

    try:
        scanner_functions = service._extract_scanner_functions_ast(real_code)
        print(f"✅ AST extraction succeeded: {len(scanner_functions)} scanner functions found")

        if len(scanner_functions) == 0:
            print(f"❌ CRITICAL: No scanner functions found by AST - this explains the failure!")
            print(f"💡 Testing regex fallback...")

            regex_functions = service._extract_scanner_functions_regex(real_code)
            print(f"🔍 Regex extraction found: {len(regex_functions)} scanner functions")

            if len(regex_functions) > 0:
                print(f"✅ Using regex extraction results for testing")
                scanner_functions = regex_functions
            else:
                print(f"❌ Both AST and regex extraction failed - no scanner functions detected")
                return

        for i, scanner_func in enumerate(scanner_functions, 1):
            print(f"   Scanner {i}: {scanner_func['name']} (lines {scanner_func['line_start']}-{scanner_func['line_end']})")
            print(f"      Source length: {len(scanner_func['source'])} characters")

    except Exception as e:
        print(f"❌ AST extraction failed: {e}")
        return

    # Test 2: Test individual AI analysis on first scanner
    print(f"\n🧪 TEST 2: INDIVIDUAL AI ANALYSIS ON FIRST SCANNER")
    print("-" * 50)

    if len(scanner_functions) > 0:
        first_scanner = scanner_functions[0]
        print(f"🎯 Testing AI analysis on: {first_scanner['name']}")

        start_time = time.time()
        try:
            result = await service._analyze_scanner_function_ai(first_scanner)
            duration = time.time() - start_time

            print(f"⏱️ AI analysis duration: {duration:.2f} seconds")

            if result:
                print(f"✅ AI analysis succeeded!")
                print(f"   📊 Parameters found: {len(result.get('parameters', []))}")
                print(f"   📄 Scanner name: {result.get('scanner_name', 'Unknown')}")
                print(f"   📝 Description: {result.get('description', 'No description')[:100]}...")

                if len(result.get('parameters', [])) > 0:
                    print(f"   🔧 Sample parameters:")
                    for j, param in enumerate(result['parameters'][:3], 1):
                        print(f"      {j}. {param.get('name')} = {param.get('current_value')} ({param.get('type')})")
                else:
                    print(f"   ⚠️ No parameters extracted from this scanner")

            else:
                print(f"❌ AI analysis returned None - this is the failure point!")
                print(f"💡 Duration was {duration:.2f} seconds")

        except Exception as e:
            duration = time.time() - start_time
            print(f"❌ AI analysis failed with exception after {duration:.2f} seconds: {e}")

    # Test 3: Test full workflow
    print(f"\n🧪 TEST 3: FULL REAL AI ANALYSIS WORKFLOW")
    print("-" * 50)

    start_time = time.time()
    try:
        result = await service._attempt_real_ai_analysis(real_code, "test-real-file.py")
        duration = time.time() - start_time

        print(f"⏱️ Full workflow duration: {duration:.2f} seconds")

        if result:
            print(f"✅ Full workflow succeeded!")
            print(f"   📊 Total scanners: {result.get('total_scanners', 0)}")
            print(f"   🔧 Total parameters: {sum(len(s.get('parameters', [])) for s in result.get('scanners', []))}")
            print(f"   🤖 Method: {result.get('method', 'Unknown')}")
            print(f"   📈 Confidence: {result.get('analysis_confidence', 0):.2f}")
        else:
            print(f"❌ Full workflow returned None")
            print(f"💡 This explains why the system falls back to templates!")

    except Exception as e:
        duration = time.time() - start_time
        print(f"❌ Full workflow failed with exception after {duration:.2f} seconds: {e}")

    # Test 4: Simple OpenRouter API connectivity test
    print(f"\n🧪 TEST 4: DIRECT OPENROUTER API CONNECTIVITY TEST")
    print("-" * 50)

    try:
        async with aiohttp.ClientSession() as session:
            headers = {
                'Authorization': f'Bearer {service.openrouter_api_key}',
                'Content-Type': 'application/json'
            }

            simple_payload = {
                'model': 'anthropic/claude-3.5-sonnet',
                'messages': [
                    {
                        'role': 'user',
                        'content': 'Respond with just the word "SUCCESS" if you can read this.'
                    }
                ],
                'max_tokens': 10,
                'temperature': 0.1
            }

            start_time = time.time()
            async with session.post(
                'https://openrouter.ai/api/v1/chat/completions',
                headers=headers,
                json=simple_payload,
                timeout=aiohttp.ClientTimeout(total=30)
            ) as response:
                duration = time.time() - start_time

                print(f"📡 API Response Status: {response.status}")
                print(f"⏱️ API Response Time: {duration:.2f} seconds")

                if response.status == 200:
                    result = await response.json()
                    if 'choices' in result and result['choices']:
                        ai_response = result['choices'][0]['message']['content']
                        print(f"✅ OpenRouter API is working!")
                        print(f"🤖 AI Response: '{ai_response}'")
                    else:
                        print(f"❌ Invalid response format from OpenRouter")
                        print(f"📄 Response: {result}")
                else:
                    error_text = await response.text()
                    print(f"❌ OpenRouter API error: {response.status}")
                    print(f"📄 Error details: {error_text[:500]}")

    except Exception as e:
        print(f"❌ OpenRouter connectivity test failed: {e}")

    print(f"\n🏁 DEBUGGING COMPLETE")
    print("=" * 30)

if __name__ == "__main__":
    asyncio.run(debug_real_ai_analysis())