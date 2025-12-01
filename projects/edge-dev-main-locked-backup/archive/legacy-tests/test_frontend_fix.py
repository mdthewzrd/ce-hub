#!/usr/bin/env python3
"""
🧪 Test Frontend Fix
====================

Test that frontend now correctly finds parameters from backend response.
"""

import requests
import json

def test_frontend_fix():
    """Test that frontend fix resolves the parameter detection issue"""

    print("🧪 Testing Frontend Parameter Detection Fix")
    print("=" * 50)

    # Load LC D2 scanner
    lc_d2_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    with open(lc_d2_file, 'r') as f:
        lc_d2_code = f.read()

    # Call backend API (what frontend calls)
    print("📡 Calling backend format API...")
    response = requests.post(
        "http://localhost:8000/api/format/code",
        json={"code": lc_d2_code},
        timeout=30
    )

    if response.status_code == 200:
        data = response.json()
        metadata = data.get('metadata', {})

        print("✅ Backend response received")
        print(f"   Success: {data.get('success')}")

        # Test old frontend logic (before fix)
        print(f"\n❌ OLD Frontend Logic (before fix):")
        old_params = metadata.get('ai_extraction', {}).get('parameters', {})
        print(f"   Looking for: metadata.ai_extraction.parameters")
        print(f"   Found: {len(old_params)} parameters")
        print(f"   Result: {'FAIL - No parameters found' if len(old_params) == 0 else 'SUCCESS'}")

        # Test new frontend logic (after fix)
        print(f"\n✅ NEW Frontend Logic (after fix):")
        ai_extraction = metadata.get('ai_extraction', {})
        intelligent_params = metadata.get('intelligent_parameters', {})
        new_params = intelligent_params or ai_extraction.get('parameters', {})

        print(f"   Looking for: metadata.intelligent_parameters first")
        print(f"   Found: {len(new_params)} parameters")
        print(f"   Total parameters: {ai_extraction.get('total_parameters', 0)}")
        print(f"   Trading filters: {ai_extraction.get('trading_filters', 0)}")
        print(f"   Result: {'SUCCESS - Parameters found!' if len(new_params) > 0 else 'FAIL'}")

        # Show some parameter examples
        if new_params:
            param_names = list(new_params.keys())[:5]
            print(f"   Sample parameters: {param_names}")

        # Test the condition frontend uses to show analysis
        has_ai_extraction = bool(ai_extraction)
        has_params = bool(intelligent_params or ai_extraction.get('parameters'))

        print(f"\n🔍 Frontend Condition Check:")
        print(f"   ai_extraction exists: {has_ai_extraction}")
        print(f"   parameters exist: {has_params}")
        print(f"   Combined condition: {has_ai_extraction and has_params}")
        print(f"   Frontend will: {'✅ Show analysis with parameters' if (has_ai_extraction and has_params) else '❌ Fall back to legacy mode'}")

    else:
        print(f"❌ Backend error: {response.status_code}")
        print(response.text)

if __name__ == "__main__":
    test_frontend_fix()