#!/usr/bin/env python3
"""
Simple Parameter Extraction Test
"""
import asyncio
import aiohttp
import json

async def test_simple_extraction():
    """Simple test to see parameter extraction results"""

    # Get a generated scanner first
    original_code = open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py').read()

    async with aiohttp.ClientSession() as session:
        # Generate scanner
        ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
        split_payload = {"code": original_code, "filename": "test.py"}

        async with session.post(ai_split_url, json=split_payload) as response:
            split_result = await response.json()
            generated_scanner = split_result['scanners'][0]['formatted_code']

        # Test parameter extraction on generated scanner
        format_url = "http://localhost:8000/api/format/code"
        generated_payload = {"code": generated_scanner}

        print("🔬 Testing parameter extraction on generated scanner:")
        print(f"Scanner preview:")
        print(generated_scanner[:500])
        print("...")

        async with session.post(format_url, json=generated_payload) as response:
            if response.status == 200:
                result = await response.json()
                metadata = result.get('metadata', {})

                print(f"\n📊 Extraction Results:")
                print(f"   Status: {response.status}")
                print(f"   Metadata keys: {list(metadata.keys())}")

                if 'ai_extraction' in metadata:
                    ai_extraction = metadata['ai_extraction']
                    print(f"   AI extraction: {ai_extraction}")

                if 'regex_extraction' in metadata:
                    regex_extraction = metadata['regex_extraction']
                    print(f"   Regex extraction: {regex_extraction}")

                if 'intelligent_parameters' in metadata:
                    intelligent_params = metadata['intelligent_parameters']
                    print(f"   Intelligent params count: {len(intelligent_params) if intelligent_params else 0}")

            else:
                error_text = await response.text()
                print(f"❌ Extraction failed: {response.status}")
                print(f"   Error: {error_text}")

if __name__ == "__main__":
    asyncio.run(test_simple_extraction())