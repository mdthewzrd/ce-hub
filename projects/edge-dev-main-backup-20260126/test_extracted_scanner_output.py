#!/usr/bin/env python3
"""
🔍 DEBUG EXTRACTED SCANNER OUTPUT
Test what the extracted individual scanner code actually looks like
"""
import requests
import json

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

def test_extracted_scanner_code():
    """Test what extracted scanner code looks like"""
    print("🔍 TESTING EXTRACTED SCANNER CODE OUTPUT")

    code_content = read_file_safely(TEST_FILE)

    # Step 1: Analyze for multiple scanners
    analysis_response = requests.post(
        f"{BASE_URL}/api/format/analyze-code",
        json={
            "code": code_content,
            "analysis_type": "comprehensive_with_separation"
        },
        timeout=30
    )

    if analysis_response.status_code != 200:
        print("❌ Analysis failed")
        return

    analysis_result = analysis_response.json()

    # Step 2: Extract scanners
    extraction_response = requests.post(
        f"{BASE_URL}/api/format/extract-scanners",
        json={
            "code": code_content,
            "scanner_analysis": analysis_result
        },
        timeout=60
    )

    if extraction_response.status_code != 200:
        print("❌ Extraction failed")
        return

    extraction_result = extraction_response.json()
    extracted_scanners = extraction_result.get('extracted_scanners', [])

    if not extracted_scanners:
        print("❌ No scanners extracted")
        return

    # Test the first extracted scanner
    first_scanner = extracted_scanners[0]
    scanner_name = first_scanner.get('scanner_name', 'Unknown')
    scanner_code = first_scanner.get('formatted_code', '')

    print(f"\n📊 FIRST EXTRACTED SCANNER: {scanner_name}")
    print(f"📄 Code length: {len(scanner_code)} characters")
    print(f"📋 Parameters reported: {first_scanner.get('parameters_count', 0)}")

    print(f"\n🔍 EXTRACTED CODE PREVIEW (first 2000 chars):")
    print("="*80)
    print(scanner_code[:2000])
    print("="*80)

    # Now test parameter extraction on this individual code
    print(f"\n🧪 TESTING PARAMETER EXTRACTION ON EXTRACTED CODE:")
    param_response = requests.post(
        f"{BASE_URL}/api/format/extract-parameters",
        json={"code": scanner_code},
        timeout=30
    )

    if param_response.status_code == 200:
        param_result = param_response.json()
        found_params = param_result.get('parameters', [])

        print(f"✅ Parameter extraction test:")
        print(f"  • Parameters found: {len(found_params)}")
        print(f"  • Scanner type: {param_result.get('scanner_type', 'Unknown')}")

        if found_params:
            print(f"  • Found parameters:")
            for param in found_params[:10]:  # Show first 10
                print(f"    - {param.get('name', 'Unknown')}: {param.get('value', 'N/A')}")
        else:
            print("  • No parameters detected")

    else:
        print(f"❌ Parameter extraction failed: {param_response.status_code}")

if __name__ == "__main__":
    test_extracted_scanner_code()