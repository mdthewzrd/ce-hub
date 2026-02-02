#!/usr/bin/env python3
"""
🔍 DEBUG PARAMETER EXTRACTION
Test individual scanner parameter extraction to understand why it's returning 0 parameters
"""
import requests
import json

# Configuration
BASE_URL = "http://localhost:8000"

# Sample individual scanner code (LC scanner extracted from splitter)
sample_individual_scanner = '''def check_high_lvl_filter_lc(df):
    """Modified to only include lc_frontside_d3_extended_1 logic"""

    # lc_frontside_d3_extended_1 scanner pattern
    df['lc_frontside_d3_extended_1'] = (
        (df['high_chg_atr1'] >= 2) & (df['high_chg_atr1'] < 3) &  # ATR-based gap detection
        (df['close'] > df['daily_pmh']) &  # Break above pre-market high
        (df['atr_mult'] >= 2.5) & (df['atr_mult'] < 4.0) &  # Volatility range
        (df['volume'] > df['avg_volume'] * 1.5) &  # Volume spike
        (df['score_atr'] > 15)  # Scoring threshold
    ).astype(int)
    return df
'''

def test_parameter_extraction_detailed():
    """Test parameter extraction with detailed logging"""
    print(f"🔍 DEBUGGING PARAMETER EXTRACTION")
    print(f"Testing individual scanner code with manual parameter inspection")

    # Manual inspection - what parameters should we expect?
    expected_params = {
        'high_chg_atr1_min': 2,
        'high_chg_atr1_max': 3,
        'atr_mult_min': 2.5,
        'atr_mult_max': 4.0,
        'volume_mult': 1.5,
        'score_atr_threshold': 15
    }

    print(f"\n📋 EXPECTED PARAMETERS:")
    for param, value in expected_params.items():
        print(f"  • {param}: {value}")

    # Test with API
    try:
        response = requests.post(
            f"{BASE_URL}/api/format/extract-parameters",
            json={"code": sample_individual_scanner},
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            found_params = result.get('parameters', [])
            total_found = result.get('parameter_count', 0)

            print(f"\n📊 API EXTRACTION RESULTS:")
            print(f"  • Total parameters found: {total_found}")
            print(f"  • Scanner type detected: {result.get('scanner_type', 'Unknown')}")
            print(f"  • Confidence: {result.get('confidence_score', 0):.2f}")

            if found_params:
                print(f"\n🎯 FOUND PARAMETERS:")
                for param in found_params:
                    print(f"  • {param.get('name', 'Unknown')}: {param.get('value', 'N/A')} "
                          f"(type: {param.get('type', 'unknown')}, confidence: {param.get('confidence', 0):.2f})")
            else:
                print(f"\n❌ NO PARAMETERS FOUND!")
                print(f"📝 Analysis details:")
                print(f"  • Extraction time: {result.get('analysis_time', 0):.2f}s")
                print(f"  • Methods used: {result.get('extraction_methods_used', [])}")
                print(f"  • Suggestions: {result.get('suggestions', [])}")

                # Let's check what the extraction process is seeing
                print(f"\n🔬 DETAILED ANALYSIS:")
                if 'complexity_analysis' in result:
                    complexity = result['complexity_analysis']
                    print(f"  • Complexity breakdown: {complexity}")
                if 'missed_patterns' in result and result['missed_patterns']:
                    print(f"  • Missed patterns: {result['missed_patterns']}")

        else:
            print(f"❌ API Error: {response.status_code}")
            print(f"Response: {response.text}")

    except Exception as e:
        print(f"❌ Error testing extraction: {e}")

def test_simple_parameter_code():
    """Test with very simple parameter code to verify extractor works"""
    simple_code = '''
# Simple test with obvious parameters
atr_mult = 2.5
volume_threshold = 1000
scoring_array = [20, 18, 15, 12]

def scan_function(df):
    filter = (df['atr'] >= atr_mult) & (df['volume'] > volume_threshold)
    return filter.astype(int)
'''

    print(f"\n\n🧪 TESTING SIMPLE PARAMETER CODE:")

    try:
        response = requests.post(
            f"{BASE_URL}/api/format/extract-parameters",
            json={"code": simple_code},
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            found_params = result.get('parameters', [])

            print(f"📊 Simple test results:")
            print(f"  • Parameters found: {len(found_params)}")

            for param in found_params:
                print(f"  • {param.get('name', 'Unknown')}: {param.get('value', 'N/A')}")

        else:
            print(f"❌ Simple test failed: {response.status_code}")

    except Exception as e:
        print(f"❌ Simple test error: {e}")

if __name__ == "__main__":
    test_parameter_extraction_detailed()
    test_simple_parameter_code()