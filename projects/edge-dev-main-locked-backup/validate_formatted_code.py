#!/usr/bin/env python3
"""
Validate the formatted code output from AI Agent to confirm polygon integration
and smart threadpooling implementations
"""

import requests
import json
import re

def validate_formatted_code():
    print("🔍 FORMATTED CODE VALIDATION")
    print("=" * 60)

    # Test with LC D2 file (the original problematic one)
    test_file = '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py'

    try:
        # Read the original file
        with open(test_file, 'r', encoding='utf-8') as f:
            original_code = f.read()

        print(f"📄 Testing: {test_file.split('/')[-1]}")
        print(f"📊 Original size: {len(original_code):,} characters")

        # Get formatted code from AI Agent
        response = requests.post(
            "http://localhost:8000/api/format/smart",
            json={
                "code": original_code,
                "filename": "lc d2 scan - oct 25 new ideas.py"
            },
            timeout=120
        )

        if response.status_code != 200:
            print(f"❌ AI Agent request failed: {response.status_code}")
            return

        data = response.json()
        formatted_code = data.get('formatted_code', '')
        metadata = data.get('metadata', {})

        print(f"📊 Formatted size: {len(formatted_code):,} characters")
        print(f"🔒 Integrity verified: {metadata.get('integrity_verified', False)}")

        # Validation checks
        print(f"\n🔍 INFRASTRUCTURE VALIDATION")
        print("-" * 40)

        # Check for Polygon API integration
        polygon_imports = []
        polygon_usage = []

        if 'import polygon' in formatted_code.lower():
            polygon_imports.append("import polygon")
        if 'from polygon' in formatted_code.lower():
            polygon_imports.append("from polygon import")
        if 'polygon.' in formatted_code.lower():
            polygon_usage.append("polygon API calls")
        if 'rest_client' in formatted_code.lower():
            polygon_usage.append("REST client usage")
        if 'stocks_client' in formatted_code.lower():
            polygon_usage.append("stocks client")

        print(f"🔌 POLYGON INTEGRATION:")
        print(f"   Imports found: {len(polygon_imports)}")
        for imp in polygon_imports:
            print(f"   ✓ {imp}")
        print(f"   Usage patterns: {len(polygon_usage)}")
        for usage in polygon_usage:
            print(f"   ✓ {usage}")

        # Check for threading/pooling
        threading_patterns = []

        if 'threadpoolexecutor' in formatted_code.lower():
            threading_patterns.append("ThreadPoolExecutor")
        if 'concurrent.futures' in formatted_code.lower():
            threading_patterns.append("concurrent.futures")
        if 'threading' in formatted_code.lower():
            threading_patterns.append("threading module")
        if 'async def' in formatted_code.lower():
            threading_patterns.append("async/await patterns")
        if 'asyncio' in formatted_code.lower():
            threading_patterns.append("asyncio")
        if 'pool.submit' in formatted_code.lower():
            threading_patterns.append("pool submission")

        print(f"\n⚡ THREADING/POOLING:")
        print(f"   Patterns found: {len(threading_patterns)}")
        for pattern in threading_patterns:
            print(f"   ✓ {pattern}")

        # Check for ticker universe enhancement
        ticker_patterns = []

        if 'all_tickers' in formatted_code.lower():
            ticker_patterns.append("all_tickers variable")
        if 'ticker_list' in formatted_code.lower():
            ticker_patterns.append("ticker_list processing")
        if 'get_all_tickers' in formatted_code.lower():
            ticker_patterns.append("get_all_tickers function")

        print(f"\n🎯 TICKER UNIVERSE:")
        print(f"   Enhancements found: {len(ticker_patterns)}")
        for pattern in ticker_patterns:
            print(f"   ✓ {pattern}")

        # Check for error handling and retries
        error_patterns = []

        if 'try:' in formatted_code and 'except' in formatted_code:
            error_patterns.append("try/except blocks")
        if 'retry' in formatted_code.lower():
            error_patterns.append("retry logic")
        if 'timeout' in formatted_code.lower():
            error_patterns.append("timeout handling")

        print(f"\n🛡️  ERROR HANDLING:")
        print(f"   Patterns found: {len(error_patterns)}")
        for pattern in error_patterns:
            print(f"   ✓ {pattern}")

        # Show sample code sections
        print(f"\n📝 FORMATTED CODE SAMPLES")
        print("-" * 40)

        # Find and show polygon imports
        lines = formatted_code.split('\n')

        print("🔌 Polygon imports section:")
        for i, line in enumerate(lines[:50]):  # Check first 50 lines
            if 'polygon' in line.lower() or 'import' in line.lower():
                print(f"   {i+1:3}: {line.strip()}")

        print("\n⚡ Threading/async section:")
        for i, line in enumerate(lines):
            if any(pattern.lower().replace(' ', '') in line.lower() for pattern in ['threadpool', 'async def', 'concurrent', 'pool.submit']):
                print(f"   {i+1:3}: {line.strip()}")
                # Show a few context lines
                for j in range(max(0, i-1), min(len(lines), i+3)):
                    if j != i:
                        print(f"   {j+1:3}: {lines[j].strip()}")
                break

        # Summary validation
        print(f"\n✅ VALIDATION SUMMARY")
        print("-" * 30)

        total_enhancements = len(polygon_imports) + len(polygon_usage) + len(threading_patterns) + len(ticker_patterns) + len(error_patterns)

        polygon_ok = len(polygon_imports) > 0 and len(polygon_usage) > 0
        threading_ok = len(threading_patterns) > 0
        error_handling_ok = len(error_patterns) > 0

        print(f"🔌 Polygon Integration: {'✅ PASS' if polygon_ok else '❌ FAIL'}")
        print(f"⚡ Threading/Pooling: {'✅ PASS' if threading_ok else '❌ FAIL'}")
        print(f"🛡️  Error Handling: {'✅ PASS' if error_handling_ok else '❌ FAIL'}")
        print(f"🏗️  Total Enhancements: {total_enhancements}")

        if polygon_ok and threading_ok and error_handling_ok:
            print("\n🎉 ALL VALIDATION CHECKS PASSED!")
            print("The AI Agent is successfully adding all required infrastructure!")
        else:
            print("\n⚠️  SOME VALIDATION CHECKS FAILED")
            print("The AI Agent may need adjustments")

    except Exception as e:
        print(f"❌ Validation failed: {e}")

if __name__ == "__main__":
    validate_formatted_code()