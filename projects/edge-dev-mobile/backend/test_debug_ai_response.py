#!/usr/bin/env python3
"""
Debug AI Response Content - See what the AI actually returns
"""

import asyncio
import aiohttp
import json
import time
from ai_scanner_service_bulletproof_v2 import BulletproofAIScannerV2

async def debug_ai_response_content():
    print("🔍 DEBUGGING AI RESPONSE CONTENT")
    print("=" * 60)

    # Load the user's scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py', 'r') as f:
            code = f.read()
        print(f"📄 Loaded scanner file: {len(code):,} characters")
    except Exception as e:
        print(f"❌ Failed to load file: {e}")
        return

    # Create service instance
    service = BulletproofAIScannerV2()

    # Create the exact same prompt that would be sent to AI
    prompt = service._create_optimized_prompt(code, 'lc d2 scan - oct 25 new ideas (2).py')

    print(f"\n📝 PROMPT BEING SENT TO AI:")
    print("-" * 40)
    print(prompt[:1000] + "..." if len(prompt) > 1000 else prompt)
    print("-" * 40)

    # Make actual AI request
    async with aiohttp.ClientSession(timeout=service.timeout) as session:
        try:
            print(f"\n🤖 MAKING AI REQUEST...")
            start_time = time.time()
            response_text = await service._make_ai_request(session, prompt)
            duration = time.time() - start_time

            print(f"⏱️ AI Response time: {duration:.1f} seconds")
            print(f"📏 AI Response length: {len(response_text):,} characters")

            print(f"\n📄 RAW AI RESPONSE:")
            print("-" * 60)
            print(response_text[:2000] + "..." if len(response_text) > 2000 else response_text)
            print("-" * 60)

            # Parse the AI response to see the structure
            try:
                if '```json' in response_text:
                    json_str = response_text.split('```json')[1].split('```')[0].strip()
                elif '```' in response_text:
                    json_str = response_text.split('```')[1].strip()
                elif '{' in response_text:
                    start = response_text.find('{')
                    end = response_text.rfind('}') + 1
                    json_str = response_text[start:end]
                else:
                    print("❌ No JSON found in AI response")
                    return

                print(f"\n🔧 EXTRACTED JSON STRING:")
                print("-" * 40)
                print(json_str[:1500] + "..." if len(json_str) > 1500 else json_str)
                print("-" * 40)

                # Parse the JSON
                data = json.loads(json_str)
                scanners = data.get('scanners', [])

                print(f"\n🧪 PARSED AI RESPONSE ANALYSIS:")
                print(f"   📊 Scanners found: {len(scanners)}")

                for i, scanner in enumerate(scanners, 1):
                    print(f"\n   📄 Scanner {i}:")
                    print(f"      🏷️ Name: {scanner.get('name', 'Missing')}")
                    print(f"      📝 Description: {scanner.get('description', 'Missing')[:100]}...")

                    # CRITICAL: Check if code field exists and has content
                    code_field = scanner.get('code', '')
                    print(f"      📄 Code field exists: {'✅ YES' if 'code' in scanner else '❌ NO'}")
                    print(f"      📏 Code field length: {len(code_field)} characters")

                    if len(code_field) > 0:
                        print(f"      ✅ CODE CONTENT FOUND!")
                        print(f"      🔍 Code preview: {code_field[:200]}...")
                    else:
                        print(f"      ❌ CRITICAL: CODE FIELD IS EMPTY! This explains the issue!")

                    params = scanner.get('parameters', [])
                    print(f"      🔧 Parameters: {len(params)}")

                    if params:
                        print(f"      🔍 Parameter examples:")
                        for j, param in enumerate(params[:3], 1):
                            name = param.get('name', 'Unknown')
                            value = param.get('value', 'N/A')
                            print(f"         {j}. {name} = {value}")

                print(f"\n🎯 ROOT CAUSE DIAGNOSIS:")
                scanner_codes = [s.get('code', '') for s in scanners]
                total_code_length = sum(len(code) for code in scanner_codes)

                if total_code_length == 0:
                    print(f"   ❌ CONFIRMED: AI is NOT providing scanner code!")
                    print(f"   📝 AI Response has 'code' fields but they are all empty")
                    print(f"   💡 SOLUTION: Need to improve prompt or use different extraction method")
                elif total_code_length < 100:
                    print(f"   ⚠️ PARTIAL: AI providing minimal code ({total_code_length} chars total)")
                    print(f"   💡 SOLUTION: Need to improve prompt to get full function code")
                else:
                    print(f"   ✅ GOOD: AI providing substantial code ({total_code_length} chars total)")
                    print(f"   💡 BUG: Code exists but not being processed correctly")

            except json.JSONDecodeError as e:
                print(f"❌ JSON Parse Error: {e}")
                print(f"📄 Problem JSON: {json_str[:500]}")
            except Exception as e:
                print(f"❌ Parse Error: {e}")

        except Exception as e:
            print(f"❌ AI Request failed: {e}")

if __name__ == "__main__":
    asyncio.run(debug_ai_response_content())