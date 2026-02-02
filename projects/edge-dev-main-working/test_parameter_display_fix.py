#!/usr/bin/env python3
"""
Parameter Display Fix Validation
================================
Test that individual scanners now return the correct parameter count
instead of being hardcoded to 0.
"""

import asyncio
import aiohttp
import json

async def test_parameter_display_fix():
    """Test that the parameter display fix is working"""

    print("🔧 TESTING PARAMETER DISPLAY FIX")
    print("=" * 60)

    # Sample scanner code with ScannerConfig class (should have parameters)
    sample_scanner_with_config = '''
class ScannerConfig:
    """User-configurable scanner parameters"""
    price_min = 8
    volume_min = 1000000
    atr_mult = 1.5
    gap_threshold = 0.02

async def main(start_date: str, end_date: str):
    """Simple scanner with config class"""
    config = ScannerConfig()

    # Scanner logic using config parameters
    df['lc_frontside_d2_extended'] = ((df['price'] >= config.price_min) &
                                      (df['volume'] >= config.volume_min))

    return df[df['lc_frontside_d2_extended'] == 1]
'''

    async with aiohttp.ClientSession() as session:

        # Test analyze-code endpoint
        print("🔍 Testing analyze-code endpoint...")
        analyze_url = "http://localhost:8000/api/format/analyze-code"
        analyze_payload = {"code": sample_scanner_with_config}

        async with session.post(analyze_url, json=analyze_payload) as response:
            if response.status == 200:
                analyze_result = await response.json()
                print(f"✅ Analysis successful")
                print(f"📊 Scanner type: {analyze_result.get('scanner_type', 'Unknown')}")
                print(f"📊 Configurable parameters: {len(analyze_result.get('configurable_parameters', []))}")

                if len(analyze_result.get('configurable_parameters', [])) > 0:
                    print(f"✅ PARAMETER EXTRACTION WORKING: {len(analyze_result.get('configurable_parameters', []))} parameters found!")
                    print(f"📋 Parameters: {[p.get('name', 'unnamed') for p in analyze_result.get('configurable_parameters', [])]}")
                    return True
                else:
                    print(f"❌ STILL BROKEN: 0 parameters returned")
                    return False
            else:
                print(f"❌ Analysis failed: {response.status}")
                error_text = await response.text()
                print(f"Error: {error_text[:200]}")
                return False

        # Test extract-parameters endpoint directly
        print(f"\n🔍 Testing extract-parameters endpoint...")
        extract_url = "http://localhost:8000/api/format/extract-parameters"
        extract_payload = {"code": sample_scanner_with_config}

        async with session.post(extract_url, json=extract_payload) as response:
            if response.status == 200:
                extract_result = await response.json()
                param_count = len(extract_result.get('parameters', []))
                print(f"✅ Parameter extraction successful: {param_count} parameters")

                if param_count > 0:
                    for param in extract_result.get('parameters', [])[:5]:  # Show first 5
                        print(f"   - {param.get('name', 'unnamed')}: {param.get('default_value', 'no default')}")
                    return True
                else:
                    print(f"❌ No parameters extracted")
                    return False
            else:
                print(f"❌ Parameter extraction failed: {response.status}")
                return False

if __name__ == "__main__":
    result = asyncio.run(test_parameter_display_fix())
    if result:
        print(f"\n🎉 PARAMETER DISPLAY FIX IS WORKING!")
        print(f"✅ The frontend should now show the correct parameter count.")
    else:
        print(f"\n❌ Parameter display fix needs more work.")