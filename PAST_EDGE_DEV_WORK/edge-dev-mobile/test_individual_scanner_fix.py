#!/usr/bin/env python3
"""
🔍 TEST INDIVIDUAL SCANNER FIX
Test if the new extraction logic creates truly individual scanner files
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

def test_individual_scanner_creation():
    """Test if individual scanners are now truly single-pattern"""
    print("🔍 TESTING INDIVIDUAL SCANNER CREATION FIX")

    code_content = read_file_safely(TEST_FILE)

    print("\n📋 Step 1: Analyze multi-scanner file")
    analysis_response = requests.post(
        f"{BASE_URL}/api/format/analyze-code",
        json={
            "code": code_content,
            "analysis_type": "comprehensive_with_separation"
        },
        timeout=30
    )

    if analysis_response.status_code != 200:
        print(f"❌ Analysis failed: {analysis_response.status_code}")
        return

    analysis_result = analysis_response.json()
    print(f"✅ Analysis complete: {analysis_result.get('total_scanners_found', 0)} scanners detected")

    print("\n📋 Step 2: Extract individual scanners")
    extraction_response = requests.post(
        f"{BASE_URL}/api/format/extract-scanners",
        json={
            "code": code_content,
            "scanner_analysis": analysis_result
        },
        timeout=60
    )

    if extraction_response.status_code != 200:
        print(f"❌ Extraction failed: {extraction_response.status_code}")
        return

    extraction_result = extraction_response.json()
    extracted_scanners = extraction_result.get('extracted_scanners', [])

    if not extracted_scanners:
        print("❌ No scanners extracted")
        return

    print(f"✅ Extraction complete: {len(extracted_scanners)} individual scanners created")

    # Test each individual scanner
    for i, scanner in enumerate(extracted_scanners, 1):
        scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
        scanner_code = scanner.get('formatted_code', '')

        print(f"\n📋 Step 3.{i}: Testing individual scanner: {scanner_name}")
        print(f"  📄 Code length: {len(scanner_code)} characters")

        # Test if this individual scanner is detected as single scanner
        individual_analysis_response = requests.post(
            f"{BASE_URL}/api/format/analyze-code",
            json={
                "code": scanner_code,
                "analysis_type": "comprehensive_with_separation"
            },
            timeout=30
        )

        if individual_analysis_response.status_code == 200:
            individual_result = individual_analysis_response.json()
            scanners_found = individual_result.get('total_scanners_found', 0)
            scanner_type = individual_result.get('scanner_type', 'Unknown')

            print(f"  📊 Scanner detection result:")
            print(f"    • Scanners found: {scanners_found}")
            print(f"    • Scanner type: {scanner_type}")
            print(f"    • Separation possible: {individual_result.get('separation_possible', False)}")

            if scanners_found == 1:
                print(f"  ✅ SUCCESS: Individual scanner contains only 1 pattern!")
            else:
                print(f"  ❌ FAILED: Individual scanner still contains {scanners_found} patterns")

                # Show first 1000 chars to debug
                print(f"  🔍 Debug - First 1000 chars of problematic code:")
                print("-" * 60)
                print(scanner_code[:1000])
                print("-" * 60)
        else:
            print(f"  ❌ Individual analysis failed: {individual_analysis_response.status_code}")

if __name__ == "__main__":
    test_individual_scanner_creation()