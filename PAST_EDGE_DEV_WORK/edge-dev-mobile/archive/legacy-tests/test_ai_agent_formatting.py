#!/usr/bin/env python3
"""
Test AI Agent Smart Formatting with all three files to validate polygon integration,
smart threadpooling, and proper deep analysis
"""

import requests
import json
import time
from pathlib import Path

def test_ai_agent_formatting():
    print("🤖 AI AGENT SMART FORMATTING TEST")
    print("=" * 60)

    # Test files from the user's Downloads folder
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

            # Test AI Agent smart formatting endpoint
            print("🤖 Testing AI Agent Smart Formatting Endpoint...")
            start_time = time.time()

            response = requests.post(
                "http://localhost:8000/api/format/smart",
                json={
                    "code": code_content,
                    "filename": Path(file_path).name
                },
                timeout=120  # Give AI agent more time for deep analysis
            )

            processing_time = time.time() - start_time
            print(f"⏱️  AI Agent Processing time: {processing_time:.2f} seconds")

            if response.status_code == 200:
                data = response.json()

                # Extract key metrics
                metadata = data.get('metadata', {})
                ai_extraction = metadata.get('ai_extraction', {})
                intelligent_params = metadata.get('intelligent_parameters', {})
                infrastructure_enhancements = metadata.get('infrastructure_enhancements', [])

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
                    'integrity_verified': metadata.get('integrity_verified', False),
                    'has_polygon': False,
                    'has_threading': False,
                    'has_async': False,
                    'infrastructure_count': len(infrastructure_enhancements)
                }

                print(f"✅ AI Agent Success: {data.get('success')}")
                print(f"🎯 Scanner Type: {data.get('scanner_type')}")
                print(f"📊 Total Parameters: {ai_extraction.get('total_parameters', 0)}")
                print(f"🎯 Trading Filters: {ai_extraction.get('trading_filters', 0)}")
                print(f"🧠 Intelligent Parameters: {len(intelligent_params) if intelligent_params else 0}")
                print(f"⚡ Extraction Method: {ai_extraction.get('extraction_method', 'unknown')}")
                print(f"⏱️  AI Extraction Time: {ai_extraction.get('extraction_time', 0):.3f}s")
                print(f"🔒 Integrity Verified: {metadata.get('integrity_verified', False)}")

                # Check formatted code for required enhancements
                formatted_code = data.get('formatted_code', '')
                has_polygon = 'polygon' in formatted_code.lower()
                has_threading = 'thread' in formatted_code.lower() or 'pool' in formatted_code.lower()
                has_async = 'async' in formatted_code.lower() or 'asyncio' in formatted_code.lower()

                results[Path(file_path).name]['has_polygon'] = has_polygon
                results[Path(file_path).name]['has_threading'] = has_threading
                results[Path(file_path).name]['has_async'] = has_async

                print(f"🔌 Has Polygon Integration: {has_polygon}")
                print(f"⚡ Has Threading/Pooling: {has_threading}")
                print(f"🚀 Has Async: {has_async}")

                # Show infrastructure enhancements
                if infrastructure_enhancements:
                    print(f"🏗️  Infrastructure Enhancements ({len(infrastructure_enhancements)}):")
                    for enhancement in infrastructure_enhancements[:5]:  # Show first 5
                        print(f"   ✓ {enhancement}")
                    if len(infrastructure_enhancements) > 5:
                        print(f"   ... and {len(infrastructure_enhancements) - 5} more")

            else:
                print(f"❌ AI Agent Error: {response.status_code}")
                print(f"Response: {response.text[:500]}...")
                results[Path(file_path).name] = {'error': response.status_code}

        except Exception as e:
            print(f"❌ Exception: {e}")
            results[Path(file_path).name] = {'error': str(e)}

    # Summary comparison
    print(f"\n📊 AI AGENT VALIDATION SUMMARY")
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
            print(f"   Integrity Verified: {result['integrity_verified']}")
            print(f"   Polygon Integration: {result['has_polygon']}")
            print(f"   Threading/Pooling: {result['has_threading']}")
            print(f"   Infrastructure Count: {result['infrastructure_count']}")

    # Validation checks
    print(f"\n🔍 QUALITY VALIDATION")
    print("=" * 30)

    success_count = 0
    polygon_count = 0
    threading_count = 0
    integrity_count = 0

    for filename, result in results.items():
        if 'error' not in result:
            if result['success']:
                success_count += 1
            if result['has_polygon']:
                polygon_count += 1
            if result['has_threading']:
                threading_count += 1
            if result['integrity_verified']:
                integrity_count += 1

    total_files = len([r for r in results.values() if 'error' not in r])

    print(f"✅ Success Rate: {success_count}/{total_files} ({(success_count/total_files*100):.0f}%)")
    print(f"🔌 Polygon Integration: {polygon_count}/{total_files} ({(polygon_count/total_files*100):.0f}%)")
    print(f"⚡ Threading/Pooling: {threading_count}/{total_files} ({(threading_count/total_files*100):.0f}%)")
    print(f"🔒 Integrity Verified: {integrity_count}/{total_files} ({(integrity_count/total_files*100):.0f}%)")

    # Identify issues
    if polygon_count < total_files:
        print("⚠️  ISSUE: Not all files have Polygon integration!")

    if threading_count < total_files:
        print("⚠️  ISSUE: Not all files have smart threading/pooling!")

    if integrity_count < total_files:
        print("⚠️  ISSUE: Not all files have verified integrity!")

    # Special check for LC D2 (the problematic file)
    lc_d2_result = results.get('lc d2 scan - oct 25 new ideas.py', {})
    if 'error' not in lc_d2_result:
        print(f"\n🎯 LC D2 SPECIFIC VALIDATION:")
        print(f"   Processing Time: {lc_d2_result.get('processing_time', 0):.2f}s (should be >2s for deep analysis)")
        print(f"   Total Parameters: {lc_d2_result.get('total_parameters', 0)} (should be >50)")
        print(f"   Extraction Method: {lc_d2_result.get('extraction_method', 'unknown')} (should be ast_llm)")
        print(f"   Integrity Verified: {lc_d2_result.get('integrity_verified', False)} (should be True)")
        print(f"   Polygon Integration: {lc_d2_result.get('has_polygon', False)} (should be True)")
        print(f"   Threading/Pooling: {lc_d2_result.get('has_threading', False)} (should be True)")

        # Check if LC D2 meets all requirements
        lc_requirements = [
            lc_d2_result.get('processing_time', 0) > 2,
            lc_d2_result.get('total_parameters', 0) > 50,
            lc_d2_result.get('extraction_method') == 'ast_llm',
            lc_d2_result.get('integrity_verified', False),
            lc_d2_result.get('has_polygon', False),
            lc_d2_result.get('has_threading', False)
        ]

        if all(lc_requirements):
            print("✅ LC D2 PASSES all quality requirements!")
        else:
            print("❌ LC D2 FAILS some quality requirements")

    return results

if __name__ == "__main__":
    results = test_ai_agent_formatting()
    print(f"\n🎯 AI Agent validation completed")