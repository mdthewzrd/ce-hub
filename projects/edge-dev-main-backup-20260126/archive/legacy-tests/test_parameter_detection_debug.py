#!/usr/bin/env python3
"""
🔍 Parameter Detection Debug Test
Test the specific scanners to see why parameter detection is failing
"""

import requests
import json
import sys
import os

def test_parameter_detection(scanner_name, scanner_path):
    """
    Test parameter detection for a specific scanner
    """
    print(f"\n🔍 TESTING PARAMETER DETECTION: {scanner_name}")
    print("=" * 80)

    if not os.path.exists(scanner_path):
        print(f"❌ Scanner file not found: {scanner_path}")
        return False

    with open(scanner_path, 'r') as f:
        uploaded_code = f.read()

    print(f"📄 Loaded {scanner_name}: {len(uploaded_code)} characters")

    # Test the parameter detection directly
    sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend')

    try:
        from core.parameter_integrity_system import ParameterIntegrityVerifier

        print(f"🔧 Testing parameter extraction directly...")

        integrity_system = ParameterIntegrityVerifier()
        original_sig = integrity_system.extract_original_signature(uploaded_code)

        if original_sig:
            print(f"✅ Scanner type detected: {original_sig.scanner_type}")
            print(f"✅ Parameter count: {len(original_sig.parameter_values)}")
            print(f"🔑 Parameter hash: {original_sig.parameter_hash}")

            print(f"\n📊 ACTUAL PARAMETERS FOUND:")
            for i, (key, value) in enumerate(original_sig.parameter_values.items(), 1):
                print(f"   {i:2d}. {key}: {value}")

        else:
            print(f"❌ Failed to extract parameters")
            return False

    except Exception as e:
        print(f"❌ Direct parameter extraction failed: {e}")
        return False

    # Test the API endpoint
    print(f"\n🌐 Testing API parameter detection...")

    format_data = {
        "code": uploaded_code
    }

    try:
        format_response = requests.post(
            "http://localhost:8000/api/format/code",
            json=format_data,
            headers={"Content-Type": "application/json"},
            timeout=30
        )

        if format_response.status_code == 200:
            result = format_response.json()
            print(f"✅ API call successful")
            print(f"📊 Scanner type: {result.get('scanner_type')}")
            print(f"📊 Integrity verified: {result.get('integrity_verified')}")

            metadata = result.get('metadata', {})
            parameters = metadata.get('parameters', {})

            print(f"\n📊 API DETECTED PARAMETERS:")
            if parameters:
                for i, (key, value) in enumerate(parameters.items(), 1):
                    print(f"   {i:2d}. {key}: {value}")
            else:
                print(f"   ❌ No parameters detected by API")

            print(f"\n📋 METADATA:")
            for key, value in metadata.items():
                if key != 'parameters':
                    print(f"   {key}: {value}")

            return len(parameters) > 0
        else:
            print(f"❌ API call failed: {format_response.status_code}")
            print(f"Response: {format_response.text}")
            return False

    except Exception as e:
        print(f"❌ API call failed: {e}")
        return False

def main():
    """
    Test parameter detection on all three scanner files
    """
    print("🔍 PARAMETER DETECTION DEBUG TEST")
    print("=" * 100)

    scanners = [
        ("LC D2 Scanner", "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"),
        ("Backside Para B", "/Users/michaeldurante/Downloads/backside para b copy.py"),
        ("Half A+ Scanner", "/Users/michaeldurante/Downloads/half A+ scan copy.py")
    ]

    results = []

    for name, path in scanners:
        success = test_parameter_detection(name, path)
        results.append((name, success))

    print(f"\n📋 PARAMETER DETECTION SUMMARY")
    print("=" * 100)

    for name, success in results:
        status = "✅ WORKING" if success else "❌ BROKEN"
        print(f"{status} {name}")

    all_working = all(success for _, success in results)

    if all_working:
        print(f"\n🎉 ALL PARAMETER DETECTION WORKING!")
    else:
        print(f"\n❌ PARAMETER DETECTION IS BROKEN")
        print(f"   The system is not correctly extracting actual scanner parameters")
        print(f"   Instead it's showing generic 'rolling_window' parameters")

    return all_working

if __name__ == "__main__":
    success = main()
    sys.exit(0 if success else 1)