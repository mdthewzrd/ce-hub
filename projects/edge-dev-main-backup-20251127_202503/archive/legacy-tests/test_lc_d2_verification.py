#!/usr/bin/env python3
"""
🔍 Test LC D2 Verification Failure
==================================

Test the exact verification steps that happen during upload
to see why LC D2 fails but other scanners work.
"""

import requests
import json

def test_verification_failure():
    """Test what happens during LC D2 verification vs working scanner"""

    print("🔍 Testing LC D2 Verification Failure")
    print("=" * 60)

    # Test 1: Load both scanners
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"
    working_file = "/Users/michaeldurante/Downloads/backside para b copy.py"

    # Load LC D2 scanner
    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    # Load working scanner
    with open(working_file, 'r') as f:
        working_code = f.read()

    print(f"📄 LC D2 scanner: {len(lc_d2_code)} characters")
    print(f"📄 Working scanner: {len(working_code)} characters")

    # Test 2: Compare backend formatting responses
    api_url = "http://localhost:8000/api/format/code"

    print(f"\n🔧 Testing Backend Format API:")

    # Test working scanner first
    print(f"\n✅ Testing Working Scanner:")
    working_payload = {"code": working_code}

    try:
        working_response = requests.post(api_url, json=working_payload, timeout=30)
        print(f"   Status: {working_response.status_code}")

        if working_response.status_code == 200:
            working_data = working_response.json()
            print(f"   Success: {working_data.get('success', 'Unknown')}")
            print(f"   Scanner type: {working_data.get('metadata', {}).get('scanner_type', 'Unknown')}")
            print(f"   Warnings: {len(working_data.get('warnings', []))}")
            print(f"   AI extraction: {working_data.get('metadata', {}).get('ai_extraction', {}).get('total_parameters', 0)} parameters")

            if working_data.get('warnings'):
                print(f"   Warning details: {working_data['warnings']}")

        else:
            print(f"   Failed: {working_response.text}")

    except Exception as e:
        print(f"   Error: {e}")

    # Test LC D2 scanner
    print(f"\n❌ Testing LC D2 Scanner:")
    lc_d2_payload = {"code": lc_d2_code}

    try:
        lc_d2_response = requests.post(api_url, json=lc_d2_payload, timeout=30)
        print(f"   Status: {lc_d2_response.status_code}")

        if lc_d2_response.status_code == 200:
            lc_d2_data = lc_d2_response.json()
            print(f"   Success: {lc_d2_data.get('success', 'Unknown')}")
            print(f"   Scanner type: {lc_d2_data.get('metadata', {}).get('scanner_type', 'Unknown')}")
            print(f"   Warnings: {len(lc_d2_data.get('warnings', []))}")
            print(f"   AI extraction: {lc_d2_data.get('metadata', {}).get('ai_extraction', {}).get('total_parameters', 0)} parameters")

            if lc_d2_data.get('warnings'):
                print(f"   Warning details: {lc_d2_data['warnings']}")

            # Check specific verification fields
            metadata = lc_d2_data.get('metadata', {})
            print(f"\n🔍 LC D2 Verification Details:")
            print(f"   Integrity verified: {metadata.get('integrity_verified', 'Unknown')}")
            print(f"   Processing time: {metadata.get('processing_time', 'Unknown')}")
            print(f"   Scanner type detected: {metadata.get('scanner_type', 'Unknown')}")

            # Check AI extraction details
            ai_extraction = metadata.get('ai_extraction', {})
            if ai_extraction:
                print(f"   AI extraction success: {ai_extraction.get('success', 'Unknown')}")
                print(f"   AI extraction method: {ai_extraction.get('extraction_method', 'Unknown')}")
                print(f"   Fallback used: {ai_extraction.get('fallback_used', 'Unknown')}")

        else:
            print(f"   Failed: {lc_d2_response.text}")

    except Exception as e:
        print(f"   Error: {e}")

    # Test 3: Compare code characteristics
    print(f"\n🔍 Code Structure Comparison:")

    # Check for problematic patterns
    problematic_patterns = [
        ('Very long lines', max(len(line) for line in lc_d2_code.split('\n'))),
        ('Total lines', len(lc_d2_code.split('\n'))),
        ('Contains async/await', 'async ' in lc_d2_code or 'await ' in lc_d2_code),
        ('Contains asyncio', 'asyncio' in lc_d2_code),
        ('Contains threading', 'threading' in lc_d2_code or 'ThreadPoolExecutor' in lc_d2_code),
        ('Contains multiprocessing', 'multiprocessing' in lc_d2_code),
        ('Contains complex imports', lc_d2_code.count('import ') + lc_d2_code.count('from ')),
        ('Contains global variables', 'global ' in lc_d2_code),
        ('Contains exec/eval', 'exec(' in lc_d2_code or 'eval(' in lc_d2_code),
    ]

    print(f"   LC D2 Scanner Issues:")
    for pattern_name, result in problematic_patterns:
        print(f"     {pattern_name}: {result}")

if __name__ == "__main__":
    test_verification_failure()