#!/usr/bin/env python3
"""
🔍 DEBUG COMPREHENSIVE TEST DIFFERENCE
Compare what comprehensive test vs direct test are actually sending for parameter extraction
"""
import requests
import json
import hashlib

BASE_URL = "http://localhost:8000"
TEST_FILE = "/Users/michaeldurante/Downloads/formatted_lc d2 scan - oct 25 new ideas (2).py.py"

def read_file_safely(file_path):
    """Read file with proper encoding handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin1') as f:
            return f.read()

def test_comprehensive_vs_direct():
    """Compare what each test is sending"""
    print("🔍 DEBUGGING COMPREHENSIVE VS DIRECT TEST DIFFERENCE")

    code_content = read_file_safely(TEST_FILE)

    # Step 1: Get extraction results (same as both tests)
    print("\n📋 Step 1: Getting extraction results...")
    analysis_response = requests.post(
        f"{BASE_URL}/api/format/analyze-code",
        json={
            "code": code_content,
            "analysis_type": "comprehensive_with_separation"
        },
        timeout=30
    )

    analysis_result = analysis_response.json()

    extraction_response = requests.post(
        f"{BASE_URL}/api/format/extract-scanners",
        json={
            "code": code_content,
            "scanner_analysis": analysis_result
        },
        timeout=60
    )

    extraction_result = extraction_response.json()
    extracted_scanners = extraction_result.get('extracted_scanners', [])

    if not extracted_scanners:
        print("❌ No scanners extracted")
        return

    # Get first scanner (same as both tests)
    first_scanner = extracted_scanners[0]
    scanner_name = first_scanner.get('scanner_name', 'Unknown')

    # COMPREHENSIVE TEST PATH: Use code from scanner dict
    comprehensive_code = first_scanner.get('formatted_code', '')

    # DIRECT TEST PATH: Use the same code
    direct_code = first_scanner.get('formatted_code', '')

    print(f"\n📊 SCANNER: {scanner_name}")
    print(f"📊 Comprehensive code length: {len(comprehensive_code)}")
    print(f"📊 Direct code length: {len(direct_code)}")

    # Check if codes are identical
    comp_hash = hashlib.md5(comprehensive_code.encode()).hexdigest()
    direct_hash = hashlib.md5(direct_code.encode()).hexdigest()

    print(f"📊 Code hashes identical: {comp_hash == direct_hash}")

    if comp_hash != direct_hash:
        print("❌ CODE MISMATCH DETECTED!")
        return

    print(f"\n🧪 TESTING COMPREHENSIVE TEST PATH:")
    # Mimic comprehensive test exactly
    comp_response = requests.post(
        f"{BASE_URL}/api/format/extract-parameters",
        json={"code": comprehensive_code},
        timeout=30
    )

    if comp_response.status_code == 200:
        comp_result = comp_response.json()
        print(f"  ✅ Comprehensive path: {len(comp_result.get('parameters', []))} parameters")
    else:
        print(f"  ❌ Comprehensive path failed: {comp_response.status_code}")
        print(f"  Response: {comp_response.text}")

    print(f"\n🧪 TESTING DIRECT TEST PATH:")
    # Mimic direct test exactly
    direct_response = requests.post(
        f"{BASE_URL}/api/format/extract-parameters",
        json={"code": direct_code},
        timeout=30
    )

    if direct_response.status_code == 200:
        direct_result = direct_response.json()
        print(f"  ✅ Direct path: {len(direct_result.get('parameters', []))} parameters")
    else:
        print(f"  ❌ Direct path failed: {direct_response.status_code}")
        print(f"  Response: {direct_response.text}")

    # Check if there's any timing difference
    print(f"\n⏱️ TESTING TIMING DIFFERENCE:")
    for i in range(3):
        print(f"  Test {i+1}:")

        test_response = requests.post(
            f"{BASE_URL}/api/format/extract-parameters",
            json={"code": comprehensive_code},
            timeout=30
        )

        if test_response.status_code == 200:
            test_result = test_response.json()
            params_count = len(test_result.get('parameters', []))
            print(f"    Parameters: {params_count}")
        else:
            print(f"    Failed: {test_response.status_code}")

if __name__ == "__main__":
    test_comprehensive_vs_direct()