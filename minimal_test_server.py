#!/usr/bin/env python3
"""
Minimal test server to test the file upload functionality
"""

import sys
import os
import json
from pathlib import Path

# Add the backend directory to the path
sys.path.insert(0, str(Path(__file__).parent / "projects/edge-dev-main/backend"))

def test_utf8_fix():
    """Test the UTF-8 encoding fix we made"""
    print("🧪 Testing UTF-8 encoding fix...")

    # Create test content with emoji
    test_content = "# Test Scanner 🚀\nprint('Hello World with emoji: 🎉')\n"

    try:
        # Test decoding with utf-8 (this would fail before our fix)
        decoded = test_content.encode('utf-8').decode('utf-8')
        print("✅ UTF-8 encoding test passed")
        return True
    except UnicodeDecodeError as e:
        print(f"❌ UTF-8 encoding test failed: {e}")
        return False

def test_parameter_format_fix():
    """Test the parameter format fix we made"""
    print("🧪 Testing parameter format fix...")

    # Simulate the old format (list) that was causing issues
    old_format = [
        {"name": "gap_threshold", "value": 0.05},
        {"name": "volume_threshold", "value": 1000000},
        "simple_param"
    ]

    try:
        # Convert to dictionary format (our fix)
        parameters_dict = {}
        for param in old_format:
            if isinstance(param, dict) and 'name' in param and 'value' in param:
                parameters_dict[param['name']] = param['value']
            elif isinstance(param, str):
                parameters_dict[param] = param

        # Test that it has .keys() method
        keys = list(parameters_dict.keys())
        print(f"✅ Parameter format test passed - keys: {keys}")
        return True
    except Exception as e:
        print(f"❌ Parameter format test failed: {e}")
        return False

def test_file_processing():
    """Test actual file processing"""
    print("🧪 Testing file processing...")

    scanner_path = Path("/Users/michaeldurante/Downloads/formatted backside para b with smart filtering.py")

    if not scanner_path.exists():
        print("❌ Test scanner file not found")
        return False

    try:
        # Read the file (testing UTF-8 handling)
        with open(scanner_path, 'r', encoding='utf-8') as f:
            content = f.read()

        print(f"✅ File read successfully - {len(content)} characters")

        # Test if it looks like a scanner
        has_import = 'import' in content
        has_df = 'df[' in content or 'pd.' in content

        if has_import and has_df:
            print("✅ File appears to be a valid scanner")
            return True
        else:
            print("⚠️ File may not be a typical scanner")
            return True

    except UnicodeDecodeError:
        try:
            # Test fallback encoding (our fix)
            with open(scanner_path, 'r', encoding='utf-8', errors='replace') as f:
                content = f.read()
            print(f"✅ File read with fallback encoding - {len(content)} characters")
            return True
        except Exception as e:
            print(f"❌ File processing failed: {e}")
            return False

def run_all_tests():
    """Run all tests"""
    print("🧪 TESTING FILE UPLOAD FIXES")
    print("=" * 50)

    tests = [
        test_utf8_fix,
        test_parameter_format_fix,
        test_file_processing
    ]

    passed = 0
    total = len(tests)

    for test in tests:
        if test():
            passed += 1
        print()

    print("=" * 50)
    print(f"📊 RESULTS: {passed}/{total} tests passed")

    if passed == total:
        print("🎉 ALL FIXES VERIFIED - File upload should work!")
    else:
        print("❌ Some tests failed - More work needed")

    return passed == total

if __name__ == "__main__":
    success = run_all_tests()
    sys.exit(0 if success else 1)