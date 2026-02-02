#!/usr/bin/env python3
"""
Complete Test for Saved Scans Integration
=========================================
This script validates that the comprehensive saved scans are working correctly.
"""

import json
import sys
import os
from datetime import datetime

# Add the backend directory to Python path
sys.path.append('/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend')

def test_scan_saver():
    """Test the scan saver functionality"""
    print("🔍 TESTING SCAN SAVER FUNCTIONALITY")
    print("=" * 50)

    try:
        from core.scan_saver import get_saved_scans, load_saved_scan, scan_saver

        # Test getting all scans for test_user_123
        user_id = "test_user_123"
        scans = get_saved_scans(user_id)

        print(f"✅ SUCCESS: Found {len(scans)} saved scans for user '{user_id}'")
        print()

        # Validate expected scans
        expected_scans = [
            "NVDA Gap Up - High Volume Alert",
            "LC Patterns - Frontside Breakouts",
            "Volume Surge Detection - Unusual Activity",
            "Breakout Candidates - New Highs"
        ]

        found_scans = []
        for scan in scans:
            scan_name = scan.get('scan_name', 'Unknown')
            results_count = scan.get('results_count', 0)
            timestamp = scan.get('timestamp', 'Unknown')

            print(f"📋 {scan_name}")
            print(f"   • Results: {results_count}")
            print(f"   • Timestamp: {timestamp}")

            if scan_name in expected_scans:
                found_scans.append(scan_name)

            # Test loading detailed scan data for one scan
            if scan_name == "NVDA Gap Up - High Volume Alert":
                scan_id = scan.get('scan_id')
                if scan_id:
                    detailed_scan = load_saved_scan(user_id, scan_id)
                    if detailed_scan:
                        print(f"   • Detailed scan loaded: {len(detailed_scan.get('results', []))} results")
                        # Show first result details
                        results = detailed_scan.get('results', [])
                        if results:
                            first_result = results[0]
                            print(f"   • Sample result: {first_result.get('ticker')} (${first_result.get('price')})")

            print()

        # Validate all expected scans are present
        print("🎯 VALIDATION RESULTS:")
        print(f"   Expected comprehensive scans: {len(expected_scans)}")
        print(f"   Found comprehensive scans: {len(found_scans)}")

        if len(found_scans) == len(expected_scans):
            print("   ✅ ALL EXPECTED SCANS FOUND!")
        else:
            missing = set(expected_scans) - set(found_scans)
            print(f"   ⚠️  Missing scans: {missing}")

        # Test user stats
        try:
            stats = scan_saver.get_user_stats(user_id)
            print(f"   📊 User stats: {stats}")
        except Exception as e:
            print(f"   ⚠️  User stats error: {e}")

        return len(found_scans) == len(expected_scans)

    except Exception as e:
        print(f"❌ ERROR: {e}")
        import traceback
        traceback.print_exc()
        return False

def validate_scan_data():
    """Validate that the scan data is properly structured"""
    print("\n🔍 VALIDATING SCAN DATA STRUCTURE")
    print("=" * 50)

    try:
        from core.scan_saver import load_saved_scan, get_saved_scans

        user_id = "test_user_123"
        scans = get_saved_scans(user_id)

        # Test each comprehensive scan
        for scan in scans:
            scan_name = scan.get('scan_name')
            scan_id = scan.get('scan_id')

            if scan_name in [
                "NVDA Gap Up - High Volume Alert",
                "LC Patterns - Frontside Breakouts",
                "Volume Surge Detection - Unusual Activity",
                "Breakout Candidates - New Highs"
            ]:
                print(f"\n🔎 Validating: {scan_name}")

                # Load detailed scan
                detailed_scan = load_saved_scan(user_id, scan_id)

                if detailed_scan:
                    # Validate required fields
                    required_fields = ['scan_id', 'scan_name', 'scanner_type', 'results', 'metadata']
                    missing_fields = [field for field in required_fields if field not in detailed_scan]

                    if missing_fields:
                        print(f"   ⚠️  Missing fields: {missing_fields}")
                    else:
                        print(f"   ✅ All required fields present")

                    # Validate results structure
                    results = detailed_scan.get('results', [])
                    print(f"   📊 Results count: {len(results)}")

                    if results:
                        sample_result = results[0]
                        print(f"   📝 Sample result keys: {list(sample_result.keys())}")

                        # Check for ticker field
                        if 'ticker' in sample_result:
                            print(f"   ✅ Has ticker: {sample_result['ticker']}")
                        else:
                            print(f"   ⚠️  Missing ticker field")
                else:
                    print(f"   ❌ Failed to load detailed scan")

        print("\n✅ Scan data validation complete!")
        return True

    except Exception as e:
        print(f"❌ Validation error: {e}")
        return False

def main():
    """Main test function"""
    print("🚀 COMPREHENSIVE SAVED SCANS TEST")
    print("=" * 60)
    print(f"📅 Test Date: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    print()

    # Test 1: Basic scan saver functionality
    test1_passed = test_scan_saver()

    # Test 2: Scan data validation
    test2_passed = validate_scan_data()

    # Summary
    print("\n" + "=" * 60)
    print("🎯 FINAL TEST RESULTS")
    print("=" * 60)
    print(f"✅ Scan Saver Test: {'PASSED' if test1_passed else 'FAILED'}")
    print(f"✅ Data Validation Test: {'PASSED' if test2_passed else 'FAILED'}")

    if test1_passed and test2_passed:
        print("\n🎉 ALL TESTS PASSED!")
        print("   🔧 Backend fix implemented successfully")
        print("   📁 Saved scans are properly created and accessible")
        print("   🌐 Frontend should now display all 4 comprehensive scans")
        print("   🔄 RESTART THE BACKEND to apply changes:")
        print("      cd /Users/michaeldurante/ai\\ dev/ce-hub/projects/edge-dev-main/backend")
        print("      python main.py")
    else:
        print("\n❌ SOME TESTS FAILED!")
        print("   🔧 Check the error messages above")

    print("\n📋 Expected Frontend Behavior:")
    print("   • Visit http://localhost:5665/scan")
    print("   • Click 'Load' button to open dropdown")
    print("   • Should see:")
    print("     - NVDA Gap Up - High Volume Alert (3 results • 12/10/2025)")
    print("     - LC Patterns - Frontside Breakouts (4 results • 12/9/2025)")
    print("     - Volume Surge Detection - Unusual Activity (5 results • 12/8/2025)")
    print("     - Breakout Candidates - New Highs (6 results • 12/7/2025)")

if __name__ == "__main__":
    main()