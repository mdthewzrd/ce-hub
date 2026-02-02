#!/usr/bin/env python3
"""
🔍 VALIDATE SCAN RESULTS - NO RESULT LOSS TEST
==============================================

This script validates that the enhanced scan with fixed parameter extraction
produces identical results to the original scan (should be 9 matches).
"""

import sys
import os
import subprocess
import time

def run_original_scan():
    """Run the original scan and capture results"""
    print("🔍 Running ORIGINAL scan...")

    original_file = "/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py"

    try:
        # Run the original scan
        result = subprocess.run([
            sys.executable, original_file
        ], capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            print(f"❌ Original scan failed: {result.stderr}")
            return None

        return result.stdout

    except subprocess.TimeoutExpired:
        print("❌ Original scan timed out")
        return None
    except Exception as e:
        print(f"❌ Error running original scan: {e}")
        return None

def run_enhanced_scan():
    """Run the enhanced scan and capture results"""
    print("🔍 Running ENHANCED scan...")

    enhanced_file = "/Users/michaeldurante/ai dev/ce-hub/test_enhanced_scan.py"

    if not os.path.exists(enhanced_file):
        print(f"❌ Enhanced scan file not found: {enhanced_file}")
        return None

    try:
        # Run the enhanced scan
        result = subprocess.run([
            sys.executable, enhanced_file
        ], capture_output=True, text=True, timeout=300)

        if result.returncode != 0:
            print(f"❌ Enhanced scan failed: {result.stderr}")
            return None

        return result.stdout

    except subprocess.TimeoutExpired:
        print("❌ Enhanced scan timed out")
        return None
    except Exception as e:
        print(f"❌ Error running enhanced scan: {e}")
        return None

def extract_results(output):
    """Extract ticker results from scan output"""
    if not output:
        return []

    results = []
    lines = output.split('\n')

    # Look for ticker results (format: TICKER DATE)
    for line in lines:
        line = line.strip()
        if ' 2024-' in line or ' 2025-' in line:
            # This looks like a ticker result
            parts = line.split()
            if len(parts) >= 2 and parts[1].count('-') == 2:
                ticker = parts[0]
                date = parts[1]
                results.append(f"{ticker} {date}")

    return sorted(results)

def compare_results():
    """Compare original vs enhanced scan results"""
    print("🔍 VALIDATION TEST: Comparing Original vs Enhanced Scan Results")
    print("=" * 70)

    # Run both scans
    original_output = run_original_scan()
    enhanced_output = run_enhanced_scan()

    if not original_output:
        print("❌ Could not get original scan results")
        return False

    if not enhanced_output:
        print("❌ Could not get enhanced scan results")
        return False

    # Extract results
    original_results = extract_results(original_output)
    enhanced_results = extract_results(enhanced_output)

    print(f"\n📊 RESULTS COMPARISON:")
    print(f"   Original scan matches: {len(original_results)}")
    print(f"   Enhanced scan matches: {len(enhanced_results)}")

    # Print results side by side
    print(f"\n📋 ORIGINAL RESULTS:")
    for i, result in enumerate(original_results, 1):
        print(f"   {i:2d}. {result}")

    print(f"\n📋 ENHANCED RESULTS:")
    for i, result in enumerate(enhanced_results, 1):
        print(f"   {i:2d}. {result}")

    # Compare results
    if len(original_results) == len(enhanced_results):
        if set(original_results) == set(enhanced_results):
            print(f"\n✅ SUCCESS: Results identical!")
            print(f"   📊 Both scans found {len(original_results)} matches")
            print(f"   🎯 NO RESULT LOSS - Parameter extraction fix successful!")
            return True
        else:
            print(f"\n⚠️ WARNING: Same count but different matches")
            missing_in_enhanced = set(original_results) - set(enhanced_results)
            extra_in_enhanced = set(enhanced_results) - set(original_results)

            if missing_in_enhanced:
                print(f"   Missing in enhanced: {missing_in_enhanced}")
            if extra_in_enhanced:
                print(f"   Extra in enhanced: {extra_in_enhanced}")
            return False
    else:
        print(f"\n❌ FAILURE: Result count mismatch!")
        print(f"   📉 Result loss: {len(original_results) - len(enhanced_results)} matches")

        if len(enhanced_results) < len(original_results):
            print(f"   📉 {((len(original_results) - len(enhanced_results)) / len(original_results)) * 100:.1f}% result loss detected")

        return False

if __name__ == "__main__":
    success = compare_results()

    if success:
        print(f"\n🎉 VALIDATION COMPLETE: Parameter extraction fix successful!")
        print(f"🎯 The Code Preservation Engine now correctly prioritizes custom_params")
        print(f"🎯 No result loss - both scans produce identical results")
    else:
        print(f"\n❌ VALIDATION FAILED: Further investigation needed")

    sys.exit(0 if success else 1)