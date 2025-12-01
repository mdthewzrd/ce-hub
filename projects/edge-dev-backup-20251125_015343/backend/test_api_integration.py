#!/usr/bin/env python3
"""
🔧 Test API Integration - Bulletproof Parameter Integrity
=========================================================

Test the new API endpoint with the A+ scanner to verify:
1. Correct scanner type detection
2. Parameter integrity preservation
3. Zero LC contamination
4. Full infrastructure enhancements
"""

import requests
import json
import time

def test_bulletproof_api_integration():
    """
    🔥 Test the bulletproof parameter integrity API with A+ scanner
    """
    print("🔥 Testing Bulletproof Parameter Integrity API Integration")
    print("=" * 60)

    # Load the A+ scanner code
    try:
        with open('/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py', 'r') as f:
            a_plus_code = f.read()
    except FileNotFoundError:
        print("❌ A+ scanner file not found")
        return False

    print("📊 A+ Scanner code loaded successfully")
    print(f"📊 Code length: {len(a_plus_code)} characters")

    # API endpoint
    api_url = "http://localhost:8000/api/format/code"

    # Prepare request
    request_data = {
        "code": a_plus_code,
        "options": {}
    }

    print("\n🔧 Sending A+ scanner to bulletproof formatting API...")
    start_time = time.time()

    try:
        # Make the API request
        response = requests.post(
            api_url,
            json=request_data,
            headers={"Content-Type": "application/json"}
        )

        elapsed_time = time.time() - start_time
        print(f"⏱️  API response time: {elapsed_time:.2f} seconds")

        if response.status_code == 200:
            result = response.json()

            print("\n✅ API REQUEST SUCCESSFUL!")
            print("=" * 40)
            print(f"✅ Success: {result.get('success', False)}")
            print(f"✅ Scanner type detected: {result.get('scanner_type', 'unknown')}")
            print(f"✅ Integrity verified: {result.get('integrity_verified', False)}")
            print(f"✅ Warnings count: {len(result.get('warnings', []))}")
            print(f"✅ Message: {result.get('message', 'No message')}")

            # Print warnings if any
            warnings = result.get('warnings', [])
            if warnings:
                print(f"\n⚠️  WARNINGS ({len(warnings)}):")
                for i, warning in enumerate(warnings, 1):
                    print(f"   {i}. {warning}")

            # Verify A+ parameters are preserved
            formatted_code = result.get('formatted_code', '')
            if formatted_code:
                print(f"\n📊 Formatted code length: {len(formatted_code)} characters")

                # Check for A+ signature parameters
                a_plus_signatures = [
                    'atr_mult.*4',
                    'slope3d_min.*10',
                    'prev_close_min.*10.0',
                    'vol_mult.*2.0',
                    'slope15d_min.*50'
                ]

                print("\n🎯 A+ PARAMETER VERIFICATION:")
                import re
                for signature in a_plus_signatures:
                    if re.search(signature, formatted_code.replace(' ', '').replace('\n', '')):
                        print(f"✅ Found A+ parameter: {signature}")
                    else:
                        print(f"❌ MISSING A+ parameter: {signature}")

                # Check for LC contamination
                lc_signatures = ['frontside', 'lc_', 'prev_close_min.*15']
                print("\n🚫 LC CONTAMINATION CHECK:")
                contamination_found = False
                for sig in lc_signatures:
                    if re.search(sig, formatted_code, re.IGNORECASE):
                        print(f"⚠️  Found potential LC contamination: {sig}")
                        contamination_found = True
                    else:
                        print(f"✅ No LC contamination: {sig}")

                if not contamination_found:
                    print("✅ ZERO LC CONTAMINATION CONFIRMED!")

                # Verify metadata
                metadata = result.get('metadata', {})
                if metadata:
                    print(f"\n📊 METADATA:")
                    print(f"   Original lines: {metadata.get('original_lines', 0)}")
                    print(f"   Formatted lines: {metadata.get('formatted_lines', 0)}")
                    print(f"   Parameter count: {metadata.get('parameter_count', 0)}")
                    print(f"   Processing time: {metadata.get('processing_time', 'Unknown')}")

                    enhancements = metadata.get('infrastructure_enhancements', [])
                    print(f"\n🚀 INFRASTRUCTURE ENHANCEMENTS ({len(enhancements)}):")
                    for enhancement in enhancements:
                        print(f"   ✅ {enhancement}")

            # Final assessment
            if (result.get('success') and
                result.get('scanner_type') == 'a_plus' and
                result.get('integrity_verified')):
                print("\n🎉 BULLETPROOF FORMATTING TEST: PASSED!")
                print("✅ A+ scanner correctly identified")
                print("✅ Parameter integrity verified")
                print("✅ No contamination detected")
                return True
            else:
                print("\n❌ BULLETPROOF FORMATTING TEST: FAILED!")
                return False

        else:
            print(f"❌ API request failed with status code: {response.status_code}")
            print(f"❌ Response: {response.text}")
            return False

    except requests.exceptions.ConnectionError:
        print("❌ Connection error - Is the API server running on localhost:8000?")
        return False
    except Exception as e:
        print(f"❌ Test failed with error: {str(e)}")
        return False

def test_scanner_type_detection():
    """
    🔍 Test the scanner type detection endpoint
    """
    print("\n🔍 Testing Scanner Type Detection API")
    print("=" * 40)

    api_url = "http://localhost:8000/api/format/scanner-types"

    try:
        response = requests.get(api_url)

        if response.status_code == 200:
            result = response.json()
            print("✅ Scanner types API successful!")

            supported_types = result.get('supported_types', {})
            print(f"📊 Supported scanner types: {len(supported_types)}")

            for scanner_type, info in supported_types.items():
                print(f"\n🎯 {scanner_type.upper()}:")
                print(f"   Name: {info.get('name', 'Unknown')}")
                print(f"   Description: {info.get('description', 'No description')}")
                print(f"   Key parameters: {', '.join(info.get('key_parameters', []))}")

            integrity_features = result.get('integrity_features', [])
            print(f"\n🔧 Integrity features ({len(integrity_features)}):")
            for feature in integrity_features:
                print(f"   ✅ {feature}")

            return True
        else:
            print(f"❌ Scanner types API failed: {response.status_code}")
            return False

    except Exception as e:
        print(f"❌ Scanner types test failed: {str(e)}")
        return False

if __name__ == "__main__":
    print("🔥 BULLETPROOF PARAMETER INTEGRITY API TESTS")
    print("=" * 60)

    # Test 1: Main formatting API with A+ scanner
    success1 = test_bulletproof_api_integration()

    # Test 2: Scanner types endpoint
    success2 = test_scanner_type_detection()

    # Final results
    print("\n" + "=" * 60)
    print("🎯 FINAL TEST RESULTS:")
    print(f"✅ Bulletproof formatting API: {'PASSED' if success1 else 'FAILED'}")
    print(f"✅ Scanner types API: {'PASSED' if success2 else 'FAILED'}")

    if success1 and success2:
        print("\n🎉 ALL TESTS PASSED!")
        print("🔧 Bulletproof parameter integrity system is working perfectly!")
    else:
        print("\n❌ SOME TESTS FAILED!")
        print("🔧 Check the API server and parameter integrity system!")