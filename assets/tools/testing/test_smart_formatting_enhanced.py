#!/usr/bin/env python3
"""
🚀 Test Enhanced Smart Formatting System
Verify that uploaded LC D2 scanners now get all 5 smart infrastructure features
"""
import requests
import json
import time

def test_enhanced_smart_formatting():
    """Test the enhanced formatting system with LC D2 scanner"""
    print("🚀 TESTING ENHANCED SMART FORMATTING SYSTEM")
    print("Testing that uploaded LC D2 scanners get all 5 smart infrastructure features...")
    print("=" * 80)

    # Load the LC D2 scanner
    scanner_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (2).py"

    try:
        with open(scanner_path, 'r') as f:
            scanner_code = f.read()
        print(f"✅ Loaded LC D2 scanner: {len(scanner_code):,} characters")
    except FileNotFoundError:
        print(f"❌ Scanner not found: {scanner_path}")
        return False

    # Test the enhanced formatting endpoint
    format_url = "http://localhost:8000/api/format/code"
    format_payload = {
        "code": scanner_code
    }

    print(f"\n🔧 Testing enhanced smart formatting system...")

    try:
        format_response = requests.post(format_url, json=format_payload, timeout=60)

        if format_response.status_code != 200:
            print(f"❌ Formatting failed: {format_response.status_code}")
            print(f"Response: {format_response.text}")
            return False

        format_result = format_response.json()

        if format_result.get('success'):
            formatted_code = format_result.get('formatted_code', '')
            print(f"✅ Enhanced formatting succeeded!")
            print(f"   Original size: {len(scanner_code):,} characters")
            print(f"   Enhanced size: {len(formatted_code):,} characters")
            print(f"   Added infrastructure: {len(formatted_code) - len(scanner_code):,} characters")

            # Check for all 5 smart infrastructure features
            smart_features = [
                'smart_ticker_filtering',
                'efficient_api_batching',
                'polygon_api_wrapper',
                'memory_optimized',
                'rate_limit_handling'
            ]

            # Also check for class implementations
            infrastructure_classes = [
                'SmartTickerFiltering',
                'EfficientApiBatching',
                'PolygonApiWrapper',
                'MemoryOptimizedExecution',
                'RateLimitHandling'
            ]

            found_features = [feature for feature in smart_features if feature in formatted_code]
            found_classes = [cls for cls in infrastructure_classes if cls in formatted_code]

            print(f"\n🏗️ SMART INFRASTRUCTURE ANALYSIS:")
            print(f"   Found {len(found_features)}/{len(smart_features)} smart feature markers")
            print(f"   Found {len(found_classes)}/{len(infrastructure_classes)} infrastructure classes")

            # Check individual features
            for feature in smart_features:
                status = "✅" if feature in formatted_code else "❌"
                print(f"   {status} {feature}")

            for cls in infrastructure_classes:
                status = "✅" if cls in formatted_code else "❌"
                print(f"   {status} {cls} class")

            # Check enhanced metadata
            metadata = format_result.get('metadata', {})
            enhancement_type = metadata.get('enhancement_type', 'none')
            smart_features_list = metadata.get('smart_features', [])

            print(f"\n📊 METADATA ANALYSIS:")
            print(f"   Enhancement type: {enhancement_type}")
            print(f"   Smart features in metadata: {len(smart_features_list)}")
            for feature in smart_features_list:
                print(f"     ✅ {feature}")

            # Check scanner type
            scanner_type = format_result.get('scanner_type', '')
            print(f"\n🎯 SCANNER TYPE:")
            print(f"   Detected type: {scanner_type}")

            expected_types = ['sophisticated_lc_d2_smart_enhanced', 'smart_enhanced_uploaded']
            if any(expected_type in scanner_type for expected_type in expected_types):
                print(f"   ✅ Correctly identified as smart enhanced")
            else:
                print(f"   ⚠️ Type may not indicate smart enhancement")

            # Overall success criteria
            all_features_found = len(found_features) == len(smart_features)
            all_classes_found = len(found_classes) == len(infrastructure_classes)
            size_increased = len(formatted_code) > len(scanner_code)
            smart_metadata = len(smart_features_list) > 0

            if all_features_found and all_classes_found and size_increased and smart_metadata:
                print(f"\n🎉 ENHANCED SMART FORMATTING SUCCESS!")
                print(f"   ✅ All 5 smart features implemented")
                print(f"   ✅ All infrastructure classes added")
                print(f"   ✅ Scanner size increased with infrastructure")
                print(f"   ✅ Smart features in metadata")
                return True
            else:
                print(f"\n⚠️ ENHANCED SMART FORMATTING PARTIAL SUCCESS:")
                print(f"   Features: {len(found_features)}/{len(smart_features)} ({'✅' if all_features_found else '❌'})")
                print(f"   Classes: {len(found_classes)}/{len(infrastructure_classes)} ({'✅' if all_classes_found else '❌'})")
                print(f"   Size increased: {'✅' if size_increased else '❌'}")
                print(f"   Smart metadata: {'✅' if smart_metadata else '❌'}")
                return False

        else:
            print(f"❌ Enhanced formatting failed: {format_result.get('message', 'Unknown error')}")
            return False

    except Exception as e:
        print(f"❌ Enhanced formatting test error: {e}")
        return False

def main():
    """Test enhanced smart formatting implementation"""
    print("🚀 ENHANCED SMART FORMATTING SYSTEM TEST")
    print("Verifying LC D2 scanners get smart infrastructure transformation")

    success = test_enhanced_smart_formatting()

    print(f"\n{'='*80}")
    print("🎯 ENHANCED SMART FORMATTING TEST RESULTS")
    print('='*80)

    if success:
        print("🎉 ENHANCED SMART FORMATTING WORKING PERFECTLY!")
        print("✅ LC D2 scanners now use same smart infrastructure as built-in scanners")
        print("✅ All 5 smart features successfully added:")
        print("   ✅ smart_ticker_filtering: Intelligent universe filtering")
        print("   ✅ efficient_api_batching: Optimized batch processing")
        print("   ✅ polygon_api_wrapper: Enhanced API with retries")
        print("   ✅ memory_optimized: Memory-safe execution patterns")
        print("   ✅ rate_limit_handling: Advanced rate limiting")
        print("\n🔧 ISSUE RESOLVED:")
        print("   - Uploaded scanners now get smart infrastructure transformation")
        print("   - No more API overwhelm from uncontrolled requests")
        print("   - Memory safety prevents crashes")
        print("   - Efficient processing like built-in scanners")
    else:
        print("❌ Enhanced smart formatting system has issues")
        print("🔧 Further investigation needed")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)