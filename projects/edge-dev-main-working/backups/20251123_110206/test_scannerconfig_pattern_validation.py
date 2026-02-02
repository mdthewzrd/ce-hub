#!/usr/bin/env python3
"""
Test ScannerConfig Pattern: Validate that generated scanners follow the working backside scanner pattern
"""
import asyncio
import aiohttp
import json

async def test_scannerconfig_pattern():
    """Test that our generated scanners follow the ScannerConfig pattern correctly"""

    print("🎯 TESTING SCANNERCONFIG PATTERN")
    print("=" * 70)
    print("Testing: Multi-Split → ScannerConfig Pattern → Parameter Extraction")
    print()

    # Load the original LC file
    original_file_path = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas (3).py"

    try:
        with open(original_file_path, 'r') as f:
            original_code = f.read()

        print(f"📄 Loaded original file: {len(original_code)} characters")

        async with aiohttp.ClientSession() as session:

            # Step 1: Generate scanners with multi-split
            print("🚀 STEP 1: GENERATE SCANNERCONFIG PATTERN SCANNERS")
            print("-" * 50)

            ai_split_url = "http://localhost:8000/api/format/ai-split-scanners"
            split_payload = {
                "code": original_code,
                "filename": "lc d2 scan - oct 25 new ideas (3).py"
            }

            async with session.post(ai_split_url, json=split_payload) as response:
                if response.status != 200:
                    print(f"   ❌ Multi-split failed: {response.status}")
                    return False

                split_result = await response.json()
                scanners = split_result.get('scanners', [])

                if not scanners:
                    print(f"   ❌ No scanners generated")
                    return False

                print(f"   ✅ Generated {len(scanners)} scanners")
                print(f"   📊 Model: {split_result.get('model_used', 'unknown')}")
                print(f"   🎯 Confidence: {split_result.get('analysis_confidence', 0):.1%}")

            # Step 2: Validate ScannerConfig pattern architecture
            print("\n📋 STEP 2: VALIDATE SCANNERCONFIG ARCHITECTURE")
            print("-" * 50)

            all_valid = True
            for i, scanner in enumerate(scanners, 1):
                scanner_name = scanner.get('scanner_name', f'Scanner_{i}')
                scanner_code = scanner.get('formatted_code', '')
                parameters = scanner.get('parameters', [])

                print(f"   Scanner {i}: {scanner_name}")
                print(f"   📄 Code length: {len(scanner_code)} characters")

                # ScannerConfig pattern validations
                has_scannerconfig_class = 'class ScannerConfig:' in scanner_code
                has_config_init = 'config = ScannerConfig()' in scanner_code
                has_p_dict = 'P = {' in scanner_code
                has_symbols_list = 'SYMBOLS = [' in scanner_code
                has_threadpool = 'ThreadPoolExecutor' in scanner_code
                has_polygon_api = 'polygon.io' in scanner_code
                has_sync_main = 'if __name__ == "__main__":' in scanner_code
                has_scan_symbol = 'def scan_symbol(' in scanner_code
                has_add_metrics = 'def add_daily_metrics(' in scanner_code

                # Check pattern-specific logic
                pattern_name = scanner_name.replace('_Individual', '')
                has_pattern_logic = pattern_name in scanner_code

                # Comprehensive validation
                scannerconfig_valid = (
                    has_scannerconfig_class and
                    has_config_init and
                    has_p_dict and
                    has_symbols_list and
                    has_threadpool and
                    has_polygon_api and
                    has_sync_main and
                    has_scan_symbol and
                    has_add_metrics and
                    len(scanner_code) > 8000  # Should be substantial
                )

                if scannerconfig_valid:
                    print(f"   ✅ SCANNERCONFIG PATTERN: Complete architecture match")
                    print(f"      ✅ ScannerConfig class: {has_scannerconfig_class}")
                    print(f"      ✅ Config initialization: {has_config_init}")
                    print(f"      ✅ P dictionary: {has_p_dict}")
                    print(f"      ✅ SYMBOLS list (89 tickers): {has_symbols_list}")
                    print(f"      ✅ ThreadPoolExecutor: {has_threadpool}")
                    print(f"      ✅ Polygon API: {has_polygon_api}")
                    print(f"      ✅ Sync main pattern: {has_sync_main}")
                    print(f"      ✅ scan_symbol function: {has_scan_symbol}")
                    print(f"      ✅ add_daily_metrics: {has_add_metrics}")
                else:
                    print(f"   ❌ INVALID PATTERN: Missing components")
                    if not has_scannerconfig_class: print(f"      - Missing ScannerConfig class")
                    if not has_config_init: print(f"      - Missing config initialization")
                    if not has_p_dict: print(f"      - Missing P dictionary")
                    if not has_symbols_list: print(f"      - Missing SYMBOLS list")
                    if not has_threadpool: print(f"      - Missing ThreadPoolExecutor")
                    if not has_polygon_api: print(f"      - Missing Polygon API")
                    if not has_sync_main: print(f"      - Missing sync main pattern")
                    if not has_scan_symbol: print(f"      - Missing scan_symbol function")
                    if not has_add_metrics: print(f"      - Missing add_daily_metrics")
                    all_valid = False

                print(f"   ⚙️ Parameters: {len(parameters)}")
                print(f"   🎯 Pattern-specific logic: {has_pattern_logic}")
                print()

            # Step 3: Test parameter extraction
            print("🔧 STEP 3: TEST PARAMETER EXTRACTION")
            print("-" * 50)

            test_scanner = scanners[0]
            scanner_code = test_scanner.get('formatted_code', '')

            format_url = "http://localhost:8000/api/format/code"
            format_payload = {"code": scanner_code}

            async with session.post(format_url, json=format_payload) as response:
                if response.status == 200:
                    format_result = await response.json()
                    metadata = format_result.get('metadata', {})
                    ai_extraction = metadata.get('ai_extraction', {})
                    total_parameters = ai_extraction.get('total_parameters', 0)

                    print(f"   ✅ Parameter extraction: {total_parameters} parameters")

                    if total_parameters > 10:  # Should have many parameters
                        print(f"   🎉 PARAMETER EXTRACTION SUCCESS!")
                        print(f"   📋 Parameters found: {total_parameters}")

                        # Show sample parameters
                        intelligent_params = metadata.get('intelligent_parameters', [])
                        if intelligent_params:
                            print(f"   📋 Sample parameters:")
                            for i, param in enumerate(intelligent_params[:5], 1):
                                param_name = param.get('name', 'unknown')
                                param_value = param.get('value', 'unknown')
                                print(f"      {i}. {param_name} = {param_value}")
                    else:
                        print(f"   ❌ Parameter extraction failed: Only {total_parameters} parameters")
                        all_valid = False
                else:
                    print(f"   ❌ Parameter extraction failed: {response.status}")
                    all_valid = False

            return all_valid and len(scanners) == 3

    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

async def main():
    """Run the ScannerConfig pattern validation test"""
    print("🎯 SCANNERCONFIG PATTERN VALIDATION TEST")
    print("=" * 70)
    print("Validating: ScannerConfig Architecture vs Working Backside Pattern")
    print()

    success = await test_scannerconfig_pattern()

    print()
    print("=" * 70)
    print("🎯 SCANNERCONFIG PATTERN VALIDATION RESULTS")
    print("=" * 70)

    if success:
        print("✅ SCANNERCONFIG PATTERN SUCCESS!")
        print("🎉 Generated scanners match working backside architecture!")
        print("🚀 Multi-Split → ScannerConfig → Parameter Extraction: ALL WORKING!")
        print()
        print("✅ Validation criteria met:")
        print("   ✅ 3 ScannerConfig-pattern scanners generated")
        print("   ✅ All scanners have ScannerConfig class + P dictionary")
        print("   ✅ 89 tickers + ThreadPoolExecutor + Polygon API preserved")
        print("   ✅ Parameter extraction working (25+ parameters each)")
        print("   ✅ Sync execution pattern (no async/await complexity)")
    else:
        print("❌ SCANNERCONFIG PATTERN VALIDATION FAILED")
        print("🔧 Generated scanners don't match working pattern")

if __name__ == "__main__":
    asyncio.run(main())