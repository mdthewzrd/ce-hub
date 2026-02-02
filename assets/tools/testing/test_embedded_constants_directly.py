#!/usr/bin/env python3
"""
Test the enhanced embedded constants extraction directly
"""
import sys
import os
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/edge-dev')

from smart_formatting_agent import SmartFormattingAgent

def test_embedded_constants_directly():
    print("🔧 Testing Enhanced Parameter Extraction DIRECTLY")
    print("=" * 60)

    # Read the real LC D2 scanner file
    try:
        with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (1).py', 'r') as f:
            scanner_code = f.read()
        print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        try:
            with open('/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py', 'r') as f:
                scanner_code = f.read()
            print(f"📄 Loaded REAL LC D2 scanner: {len(scanner_code):,} characters")
        except FileNotFoundError:
            print("❌ LC D2 scanner file not found")
            return

    # Test the enhanced extraction directly
    agent = SmartFormattingAgent()

    print("\n🧪 Testing _extract_embedded_constants method directly...")
    embedded_params = agent._extract_embedded_constants(scanner_code)

    print(f"🎯 Embedded Constants Found: {len(embedded_params)}")

    # Group parameters by category
    by_category = {}
    for param in embedded_params:
        category = param.get('category', 'unknown')
        if category not in by_category:
            by_category[category] = []
        by_category[category].append(param)

    # Display results by category
    for category, params in by_category.items():
        print(f"\n📊 {category.upper()} ({len(params)} parameters):")
        for param in params[:5]:  # Show first 5 per category
            print(f"   {param['name']}: {param['default']}")
        if len(params) > 5:
            print(f"   ... and {len(params) - 5} more")

    # Look for specific real parameters we expect
    print(f"\n🔍 Looking for Expected LC D2 Scan Filters:")
    expected_filters = [
        ('volume_min_10000000', 10000000),
        ('dollar_volume_min_500000000', 500000000),
        ('gap_percent_min_15', 0.15),
        ('gap_percent_min_1', 0.1),
        ('high_move_min_5', 0.5),
        ('atr_move_min_2', 2.0),
        ('score_threshold_60', 60),
        ('close_range_min_6', 0.6)
    ]

    found_expected = 0
    for expected_name, expected_value in expected_filters:
        found = any(p['name'] == expected_name and p['default'] == expected_value
                   for p in embedded_params)
        status = "✅" if found else "❌"
        print(f"   {status} {expected_name}: {expected_value}")
        if found:
            found_expected += 1

    print(f"\n📈 Results Summary:")
    print(f"   Total embedded parameters extracted: {len(embedded_params)}")
    print(f"   Expected scan filters found: {found_expected}/{len(expected_filters)}")
    print(f"   Categories detected: {list(by_category.keys())}")

    if found_expected >= len(expected_filters) // 2:
        print(f"\n🎉 SUCCESS: Enhanced extraction is working!")
        print(f"✅ Found {found_expected} real scan filter parameters")
        return True
    else:
        print(f"\n⚠️ PARTIAL: Some scan filters found but needs refinement")
        return False

if __name__ == "__main__":
    test_embedded_constants_directly()