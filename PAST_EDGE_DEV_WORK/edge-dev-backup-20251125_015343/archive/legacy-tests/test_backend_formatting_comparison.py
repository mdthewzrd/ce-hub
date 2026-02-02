#!/usr/bin/env python3
"""
Test backend formatting API with all three files to see the processing differences
"""

import requests
import json
import time
from pathlib import Path

def test_backend_formatting():
    print("🔬 BACKEND FORMATTING API COMPARISON TEST")
    print("=" * 60)

    # Test files
    files_to_test = [
        '/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py',
        '/Users/michaeldurante/Downloads/half A+ scan copy.py',
        '/Users/michaeldurante/Downloads/backside para b copy.py'
    ]

    results = {}

    for file_path in files_to_test:
        print(f"\n📄 TESTING: {Path(file_path).name}")
        print("-" * 40)

        if not Path(file_path).exists():
            print(f"❌ File not found: {file_path}")
            continue

        try:
            # Read file
            with open(file_path, 'r', encoding='utf-8') as f:
                code_content = f.read()

            print(f"📊 File size: {len(code_content):,} characters")

            # Test backend API
            start_time = time.time()

            response = requests.post(
                "http://localhost:8000/api/format/code",
                json={"code": code_content},
                timeout=60  # Give it more time
            )

            processing_time = time.time() - start_time
            print(f"⏱️  Processing time: {processing_time:.2f} seconds")

            if response.status_code == 200:
                data = response.json()

                # Extract key metrics
                metadata = data.get('metadata', {})
                ai_extraction = metadata.get('ai_extraction', {})
                intelligent_params = metadata.get('intelligent_parameters', {})

                # Store results
                results[Path(file_path).name] = {
                    'success': data.get('success', False),
                    'processing_time': processing_time,
                    'scanner_type': data.get('scanner_type', 'unknown'),
                    'total_parameters': ai_extraction.get('total_parameters', 0),
                    'trading_filters': ai_extraction.get('trading_filters', 0),
                    'intelligent_param_count': len(intelligent_params) if intelligent_params else 0,
                    'extraction_method': ai_extraction.get('extraction_method', 'unknown'),
                    'extraction_time': ai_extraction.get('extraction_time', 0),
                    'fallback_used': ai_extraction.get('fallback_used', False)
                }

                print(f"✅ Backend Success: {data.get('success')}")
                print(f"🎯 Scanner Type: {data.get('scanner_type')}")
                print(f"📊 Total Parameters: {ai_extraction.get('total_parameters', 0)}")
                print(f"🎯 Trading Filters: {ai_extraction.get('trading_filters', 0)}")
                print(f"🧠 Intelligent Parameters: {len(intelligent_params) if intelligent_params else 0}")
                print(f"⚡ Extraction Method: {ai_extraction.get('extraction_method', 'unknown')}")
                print(f"⏱️  AI Extraction Time: {ai_extraction.get('extraction_time', 0):.3f}s")
                print(f"🔄 Fallback Used: {ai_extraction.get('fallback_used', False)}")

                # Check for polygon integration
                formatted_code = data.get('formatted_code', '')
                has_polygon = 'polygon' in formatted_code.lower()
                has_threading = 'thread' in formatted_code.lower() or 'pool' in formatted_code.lower()
                has_async = 'async' in formatted_code.lower() or 'asyncio' in formatted_code.lower()

                print(f"🔌 Has Polygon: {has_polygon}")
                print(f"⚡ Has Threading/Pooling: {has_threading}")
                print(f"🚀 Has Async: {has_async}")

                # Show first few infrastructure enhancements
                enhancements = metadata.get('infrastructure_enhancements', [])
                if enhancements:
                    print(f"🏗️  Infrastructure Enhancements: {', '.join(enhancements[:3])}")

            else:
                print(f"❌ Backend Error: {response.status_code}")
                print(f"Response: {response.text[:500]}...")
                results[Path(file_path).name] = {'error': response.status_code}

        except Exception as e:
            print(f"❌ Exception: {e}")
            results[Path(file_path).name] = {'error': str(e)}

    # Summary comparison
    print(f"\n📊 COMPARISON SUMMARY")
    print("=" * 60)

    for filename, result in results.items():
        if 'error' in result:
            print(f"❌ {filename}: ERROR - {result['error']}")
        else:
            print(f"✅ {filename}:")
            print(f"   Processing Time: {result['processing_time']:.2f}s")
            print(f"   Scanner Type: {result['scanner_type']}")
            print(f"   Total Parameters: {result['total_parameters']}")
            print(f"   Intelligent Parameters: {result['intelligent_param_count']}")
            print(f"   Extraction Method: {result['extraction_method']}")
            print(f"   Fallback Used: {result['fallback_used']}")

    # Identify issues
    print(f"\n🔍 ISSUE ANALYSIS")
    print("=" * 30)

    lc_d2_result = results.get('lc d2 scan - oct 25 new ideas.py', {})

    if 'error' not in lc_d2_result:
        if lc_d2_result.get('processing_time', 0) < 2:
            print("⚠️  LC D2 processing too fast - not doing deep analysis")

        if lc_d2_result.get('fallback_used', False):
            print("⚠️  LC D2 using fallback extraction - AI analysis failed")

        if lc_d2_result.get('total_parameters', 0) < 50:
            print("⚠️  LC D2 parameter count too low")

        if lc_d2_result.get('extraction_method') != 'ast_llm':
            print("⚠️  LC D2 not using advanced AST+LLM extraction")

    return results

if __name__ == "__main__":
    results = test_backend_formatting()
    print(f"\n🎯 Test completed")