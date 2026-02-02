#!/usr/bin/env python3

import requests
import json
import time
import tempfile
import os
from datetime import datetime

def test_edge_dev_integration():
    """Test complete integration with edge-dev frontend workflow"""

    print("🧪 EDGE-DEV FRONTEND INTEGRATION TEST")
    print("=" * 50)

    # Test file path (actual scan file)
    test_file_path = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"

    print(f"📁 Test file: {test_file_path}")
    print(f"🕐 Test started: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")

    # Step 1: Test file upload simulation
    print(f"\n🔄 STEP 1: Simulating file upload process")
    print("-" * 40)

    try:
        with open(test_file_path, 'r') as f:
            file_content = f.read()

        print(f"✅ File read successfully ({len(file_content)} characters)")

        # Step 2: Test API formatting call
        print(f"\n🔄 STEP 2: Testing API formatting call")
        print("-" * 40)

        start_time = time.time()

        response = requests.post(
            "http://localhost:8000/api/format/code",
            headers={"Content-Type": "application/json"},
            json={"code": file_content},
            timeout=60
        )

        api_time = time.time() - start_time

        print(f"API Response time: {api_time:.2f}s")
        print(f"Status code: {response.status_code}")

        if response.status_code != 200:
            print(f"❌ API call failed: {response.status_code}")
            print(f"Response: {response.text}")
            return False

        result = response.json()
        print(f"✅ API call successful")

        # Step 3: Validate API response structure
        print(f"\n🔄 STEP 3: Validating API response structure")
        print("-" * 45)

        required_fields = ['success', 'formatted_code', 'scanner_type', 'integrity_verified', 'metadata']
        missing_fields = []

        for field in required_fields:
            if field not in result:
                missing_fields.append(field)
            else:
                print(f"✅ {field}: present")

        if missing_fields:
            print(f"❌ Missing required fields: {missing_fields}")
            return False

        # Step 4: Test formatted code functionality
        print(f"\n🔄 STEP 4: Testing formatted code execution")
        print("-" * 42)

        formatted_code = result['formatted_code']
        print(f"Formatted code length: {len(formatted_code)} characters")

        # Write to temporary file and test execution
        temp_file = tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False)
        temp_file.write(formatted_code)
        temp_file.close()

        try:
            # Test that the formatted code can import without errors
            import subprocess
            test_result = subprocess.run(
                ['python', '-c', f'import sys; sys.path.insert(0, "{os.path.dirname(temp_file.name)}"); exec(open("{temp_file.name}").read())'],
                capture_output=True,
                text=True,
                timeout=10
            )

            if test_result.returncode == 0:
                print("✅ Formatted code executes without syntax errors")
            else:
                print(f"❌ Formatted code execution failed:")
                print(f"STDERR: {test_result.stderr}")
                return False

        finally:
            os.unlink(temp_file.name)

        # Step 5: Test metadata validation
        print(f"\n🔄 STEP 5: Testing metadata validation")
        print("-" * 35)

        metadata = result.get('metadata', {})
        expected_metadata = ['parameter_count', 'processing_time', 'scanner_type']

        for field in expected_metadata:
            if field in metadata:
                print(f"✅ {field}: {metadata[field]}")
            else:
                print(f"⚠️ {field}: missing")

        # Validate parameter count
        param_count = metadata.get('parameter_count', 0)
        if param_count == 17:
            print(f"✅ Parameter count correct: {param_count}")
        else:
            print(f"❌ Parameter count incorrect: {param_count} (expected 17)")
            return False

        # Step 6: Test scanner type detection
        print(f"\n🔄 STEP 6: Testing scanner type detection")
        print("-" * 38)

        scanner_type = result.get('scanner_type', '')
        if scanner_type == 'a_plus':
            print(f"✅ Scanner type correctly detected: {scanner_type}")
        else:
            print(f"❌ Scanner type incorrect: {scanner_type} (expected 'a_plus')")
            return False

        # Step 7: Test integrity verification
        print(f"\n🔄 STEP 7: Testing integrity verification")
        print("-" * 37)

        integrity_verified = result.get('integrity_verified', False)
        if integrity_verified:
            print(f"✅ Integrity verification: {integrity_verified}")
        else:
            print(f"❌ Integrity verification failed: {integrity_verified}")
            return False

        # Step 8: Test download preparation (frontend simulation)
        print(f"\n🔄 STEP 8: Testing download preparation")
        print("-" * 35)

        # Simulate frontend preparing download
        download_filename = f"enhanced_a_plus_scan_{datetime.now().strftime('%Y%m%d_%H%M%S')}.py"

        # Test that formatted code can be prepared for download
        if len(formatted_code) > 1000:  # Reasonable size check
            print(f"✅ Download preparation successful")
            print(f"   Filename: {download_filename}")
            print(f"   Size: {len(formatted_code)} characters")
        else:
            print(f"❌ Download preparation failed - file too small")
            return False

        # Step 9: Performance validation
        print(f"\n🔄 STEP 9: Performance validation")
        print("-" * 30)

        if api_time < 5.0:  # Should complete within 5 seconds
            print(f"✅ Performance acceptable: {api_time:.2f}s")
        else:
            print(f"⚠️ Performance slow: {api_time:.2f}s")

        # Step 10: Integration summary
        print(f"\n🔄 STEP 10: Integration summary")
        print("-" * 30)

        print(f"✅ All integration tests passed!")
        print(f"✅ Frontend workflow fully functional")
        print(f"✅ API response complete and valid")
        print(f"✅ Code formatting successful")
        print(f"✅ Download preparation ready")

        return True

    except Exception as e:
        print(f"❌ Integration test failed with exception: {e}")
        return False

def test_api_stability():
    """Test API stability with multiple requests"""

    print(f"\n🔬 API STABILITY TEST")
    print("-" * 25)

    with open("/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py", 'r') as f:
        file_content = f.read()

    # Test multiple consecutive requests
    success_count = 0
    total_requests = 5

    for i in range(total_requests):
        try:
            response = requests.post(
                "http://localhost:8000/api/format/code",
                headers={"Content-Type": "application/json"},
                json={"code": file_content},
                timeout=30
            )

            if response.status_code == 200:
                success_count += 1
                print(f"✅ Request {i+1}: Success")
            else:
                print(f"❌ Request {i+1}: Failed ({response.status_code})")

        except Exception as e:
            print(f"❌ Request {i+1}: Exception ({e})")

    stability_rate = (success_count / total_requests) * 100
    print(f"\n📊 Stability Rate: {stability_rate:.1f}% ({success_count}/{total_requests})")

    return stability_rate >= 100.0  # Require 100% success rate

def main():
    """Main integration test function"""

    print("🧪 COMPREHENSIVE EDGE-DEV INTEGRATION VALIDATION")
    print("=" * 60)

    # Test 1: Frontend integration workflow
    integration_success = test_edge_dev_integration()

    # Test 2: API stability
    stability_success = test_api_stability()

    # Final results
    print(f"\n🏆 FINAL INTEGRATION TEST RESULTS")
    print("=" * 40)

    if integration_success and stability_success:
        print("✅ PASS - Full integration test successful")
        print("✅ Frontend workflow fully functional")
        print("✅ API stability confirmed")
        print("✅ Production ready for edge-dev integration")
        return True
    else:
        print("❌ FAIL - Integration test failed")
        if not integration_success:
            print("❌ Frontend workflow issues detected")
        if not stability_success:
            print("❌ API stability issues detected")
        return False

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)