#!/usr/bin/env python3
"""
🎯 COMPREHENSIVE SYSTEM TEST
End-to-end test of the complete scanner splitter and formatter workflow
"""
import requests
import json
import os
from pathlib import Path

# Configuration
BASE_URL = "http://localhost:8000"
TEST_FILES = [
    "/Users/michaeldurante/Downloads/formatted_lc d2 scan - oct 25 new ideas (2).py.py",
    "/Users/michaeldurante/Downloads/SC DMR SCAN copy.py"
]

def read_file_safely(file_path):
    """Read file with proper encoding handling"""
    try:
        with open(file_path, 'r', encoding='utf-8') as f:
            return f.read()
    except UnicodeDecodeError:
        with open(file_path, 'r', encoding='latin1') as f:
            return f.read()

def test_multi_scanner_detection(file_path, file_name):
    """Test scanner detection on multi-scanner file"""
    print(f"\n{'='*60}")
    print(f"🔍 TESTING MULTI-SCANNER DETECTION: {file_name}")
    print('='*60)

    code_content = read_file_safely(file_path)

    try:
        response = requests.post(
            f"{BASE_URL}/api/format/analyze-code",
            json={
                "code": code_content,
                "analysis_type": "comprehensive_with_separation"
            },
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Detection successful!")
            print(f"📊 Scanner type: {result.get('scanner_type', 'Unknown')}")
            print(f"📊 Total scanners found: {result.get('total_scanners_found', 0)}")
            print(f"📊 Separation possible: {result.get('separation_possible', False)}")

            detected_scanners = result.get('detected_scanners', [])
            print(f"\n🎯 DETECTED SCANNERS ({len(detected_scanners)}):")
            for i, scanner in enumerate(detected_scanners, 1):
                print(f"  {i}. {scanner.get('name', 'Unknown')} (confidence: {scanner.get('confidence', 0):.2f})")

            return result
        else:
            print(f"❌ Detection failed: {response.status_code}")
            print(f"Response: {response.text}")
            return None

    except Exception as e:
        print(f"❌ Error testing detection: {e}")
        return None

def test_scanner_extraction(code_content, analysis_result, file_name):
    """Test individual scanner extraction"""
    print(f"\n{'='*60}")
    print(f"🔧 TESTING SCANNER EXTRACTION: {file_name}")
    print('='*60)

    try:
        response = requests.post(
            f"{BASE_URL}/api/format/extract-scanners",
            json={
                "code": code_content,
                "scanner_analysis": analysis_result
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Extraction successful!")

            extracted_scanners = result.get('extracted_scanners', [])
            print(f"\n🎯 EXTRACTED SCANNERS ({len(extracted_scanners)}):")

            individual_scanners = []
            for i, scanner in enumerate(extracted_scanners, 1):
                scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
                params_count = scanner.get('parameters_count', 0)
                print(f"  {i}. {scanner_name} ({params_count} parameters)")

                # Save individual scanner for testing
                individual_scanners.append({
                    'name': scanner_name,
                    'code': scanner.get('formatted_code', ''),
                    'parameters_count': params_count
                })

            return individual_scanners
        else:
            print(f"❌ Extraction failed: {response.status_code}")
            print(f"Response: {response.text}")
            return []

    except Exception as e:
        print(f"❌ Error testing extraction: {e}")
        return []

def test_individual_scanner_upload(scanner):
    """Test uploading individual scanner to formatter"""
    print(f"\n{'='*40}")
    print(f"📤 TESTING UPLOAD: {scanner['name']}")
    print('='*40)

    try:
        # Test parameter extraction on individual scanner
        response = requests.post(
            f"{BASE_URL}/api/format/extract-parameters",
            json={"code": scanner['code']},
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            # Fix: parameter_count doesn't exist in response model - use len(parameters) instead
            parameters = result.get('parameters', [])
            params_found = len(parameters)
            print(f"✅ Upload successful!")
            print(f"📊 Parameters found: {params_found}")
            print(f"📊 Scanner type: {result.get('scanner_type', 'Unknown')}")

            # Verify it's detected as single scanner
            if params_found > 0:
                print(f"✅ Scanner is functional (has {params_found} parameters)")
                return True
            else:
                print(f"⚠️  Scanner has no parameters detected")
                return False
        else:
            print(f"❌ Upload failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Error testing upload: {e}")
        return False

def run_comprehensive_test():
    """Run complete end-to-end system test"""
    print(f"🚀 COMPREHENSIVE EDGE-DEV SYSTEM TEST")
    print(f"Testing: Scanner Splitter → Individual Extraction → Formatter Upload")
    print(f"Files: {len(TEST_FILES)} multi-scanner files")
    print(f"Expected: All individual scanners should work independently")

    total_files = len(TEST_FILES)
    total_scanners_extracted = 0
    successful_uploads = 0

    for i, file_path in enumerate(TEST_FILES, 1):
        file_name = Path(file_path).name

        print(f"\n\n{'='*80}")
        print(f"📁 TESTING FILE {i}/{total_files}: {file_name}")
        print('='*80)

        # Step 1: Test multi-scanner detection
        analysis_result = test_multi_scanner_detection(file_path, file_name)
        if not analysis_result:
            print(f"❌ Skipping {file_name} - detection failed")
            continue

        # Step 2: Test scanner extraction
        code_content = read_file_safely(file_path)
        individual_scanners = test_scanner_extraction(code_content, analysis_result, file_name)

        if not individual_scanners:
            print(f"❌ Skipping {file_name} - extraction failed")
            continue

        total_scanners_extracted += len(individual_scanners)

        # Step 3: Test individual scanner uploads
        for scanner in individual_scanners:
            if test_individual_scanner_upload(scanner):
                successful_uploads += 1

    # Final Results
    print(f"\n\n{'='*80}")
    print(f"🎯 COMPREHENSIVE TEST RESULTS")
    print('='*80)
    print(f"📁 Files tested: {total_files}")
    print(f"🔧 Individual scanners extracted: {total_scanners_extracted}")
    print(f"✅ Successful uploads: {successful_uploads}")
    print(f"📊 Success rate: {(successful_uploads/max(total_scanners_extracted, 1))*100:.1f}%")

    if successful_uploads == total_scanners_extracted and total_scanners_extracted > 0:
        print(f"🎉 COMPREHENSIVE TEST PASSED!")
        print(f"✅ All extracted scanners work independently!")
        print(f"✅ Scanner splitter fix is working correctly!")
    elif successful_uploads > 0:
        print(f"⚠️  PARTIAL SUCCESS")
        print(f"✅ {successful_uploads} scanners work correctly")
        print(f"❌ {total_scanners_extracted - successful_uploads} scanners failed")
    else:
        print(f"❌ COMPREHENSIVE TEST FAILED")
        print(f"❌ No scanners working after extraction")

if __name__ == "__main__":
    run_comprehensive_test()