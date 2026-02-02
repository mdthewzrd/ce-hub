#!/usr/bin/env python3
"""
🔍 DEBUG COMPREHENSIVE TEST EXACT STEPS
Replicate the exact comprehensive test steps to isolate the issue
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

def test_comprehensive_exact_steps():
    """Replicate the exact steps from comprehensive test"""
    print("🔍 REPLICATING COMPREHENSIVE TEST EXACT STEPS")

    code_content = read_file_safely(TEST_FILE)

    print("\n📋 STEP 1: Multi-scanner detection (exact replica)")
    # EXACT REPLICA of comprehensive test step 1
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
            print(f"📊 Total scanners found: {result.get('total_scanners_found', 0)}")

            detected_scanners = result.get('detected_scanners', [])
            print(f"🎯 DETECTED SCANNERS ({len(detected_scanners)}):")
            for i, scanner in enumerate(detected_scanners, 1):
                print(f"  {i}. {scanner.get('name', 'Unknown')} (confidence: {scanner.get('confidence', 0):.2f})")

            analysis_result = result
        else:
            print(f"❌ Detection failed: {response.status_code}")
            return

    except Exception as e:
        print(f"❌ Error in detection: {e}")
        return

    print("\n📋 STEP 2: Scanner extraction (exact replica)")
    # EXACT REPLICA of comprehensive test step 2
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
            print(f"🎯 EXTRACTED SCANNERS ({len(extracted_scanners)}):")

            # EXACT REPLICA of data structure creation
            individual_scanners = []
            for i, scanner in enumerate(extracted_scanners, 1):
                scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
                params_count = scanner.get('parameters_count', 0)
                print(f"  {i}. {scanner_name} ({params_count} parameters)")

                # EXACT REPLICA: Save individual scanner for testing
                individual_scanners.append({
                    'name': scanner_name,
                    'code': scanner.get('formatted_code', ''),
                    'parameters_count': params_count
                })

        else:
            print(f"❌ Extraction failed: {response.status_code}")
            return

    except Exception as e:
        print(f"❌ Error in extraction: {e}")
        return

    print("\n📋 STEP 3: Individual scanner upload tests (exact replica)")
    # Test each individual scanner (exact replica)
    for i, scanner in enumerate(individual_scanners, 1):
        print(f"\n{'='*40}")
        print(f"📤 TESTING UPLOAD {i}/{len(individual_scanners)}: {scanner['name']}")
        print('='*40)

        print(f"📊 Code length being tested: {len(scanner['code'])} characters")
        print(f"📊 Expected parameters: {scanner['parameters_count']}")

        # Show first 500 chars of code being tested
        print(f"\n📝 Code preview (first 500 chars):")
        print("-" * 60)
        print(scanner['code'][:500])
        print("-" * 60)

        # EXACT REPLICA of upload test
        try:
            # EXACT REPLICA: Test parameter extraction on individual scanner
            response = requests.post(
                f"{BASE_URL}/api/format/extract-parameters",
                json={"code": scanner['code']},
                timeout=30
            )

            if response.status_code == 200:
                result = response.json()
                params_found = result.get('parameter_count', 0)
                print(f"✅ Upload successful!")
                print(f"📊 Parameters found: {params_found}")
                print(f"📊 Scanner type: {result.get('scanner_type', 'Unknown')}")

                if found_params := result.get('parameters', []):
                    print(f"📋 First 5 parameters:")
                    for j, param in enumerate(found_params[:5], 1):
                        print(f"  {j}. {param.get('name', 'Unknown')}: {param.get('value', 'N/A')}")

                # Verify it's detected as single scanner
                if params_found > 0:
                    print(f"✅ Scanner is functional (has {params_found} parameters)")
                else:
                    print(f"⚠️  Scanner has no parameters detected")
                    print(f"🔍 Analysis details:")
                    print(f"  • Extraction time: {result.get('analysis_time', 0):.2f}s")
                    print(f"  • Methods used: {result.get('extraction_methods_used', [])}")

            else:
                print(f"❌ Upload failed: {response.status_code}")
                print(f"Response: {response.text}")

        except Exception as e:
            print(f"❌ Error testing upload: {e}")

if __name__ == "__main__":
    test_comprehensive_exact_steps()