#!/usr/bin/env python3
"""
🔗 Test Frontend API Integration
Verify that meaningful trading parameters reach the frontend via the API
"""

import requests
import json

def test_frontend_parameter_integration():
    """
    Test the complete frontend integration to ensure meaningful parameters are returned
    """
    print("🔗 TESTING FRONTEND API INTEGRATION")
    print("=" * 80)

    # Load the LC D2 scanner file
    scanner_file = "/Users/michaeldurante/Downloads/lc d2 scan - oct 25 new ideas.py"

    try:
        with open(scanner_file, 'r') as f:
            code_content = f.read()

        print(f"📄 Loaded LC D2 scanner: {len(code_content)} characters")

        # Test the /api/format/code endpoint (what frontend calls)
        print(f"\n🔧 TESTING /api/format/code endpoint...")
        print("-" * 60)

        format_data = {
            "code": code_content
        }

        try:
            format_response = requests.post(
                "http://localhost:8000/api/format/code",
                json=format_data,
                headers={"Content-Type": "application/json"},
                timeout=30
            )

            if format_response.status_code == 200:
                format_result = format_response.json()

                print(f"✅ API call successful")
                print(f"📊 Response status: {format_response.status_code}")
                print(f"📊 Scanner type: {format_result.get('scanner_type')}")

                # Extract metadata and parameters
                metadata = format_result.get('metadata', {})
                parameters = metadata.get('parameters', {})

                print(f"📊 Total parameters: {len(parameters)}")

                # Categorize parameters like the frontend would see them
                trading_params = {}
                api_params = {}
                technical_params = {}
                other_params = {}

                for key, value in parameters.items():
                    if any(keyword in key for keyword in ['atr_mult', 'ema_dev', 'rvol', 'gap', 'parabolic_score',
                                                         'close_range', 'high_pct_chg', 'c_ua', 'v_ua', 'dol_v',
                                                         'high_chg_atr', 'dist_h_']):
                        trading_params[key] = value
                    elif any(keyword in key for keyword in ['api_key', 'base_url', 'date']):
                        api_params[key] = value
                    elif any(keyword in key for keyword in ['rolling_window', 'ema_span']):
                        technical_params[key] = value
                    else:
                        other_params[key] = value

                print(f"\n📊 PARAMETERS RECEIVED BY FRONTEND:")
                print("=" * 60)

                print(f"🎯 TRADING PARAMETERS ({len(trading_params)}):")
                for key, value in sorted(list(trading_params.items())[:10]):  # Show first 10
                    print(f"   📈 {key}: {value}")
                if len(trading_params) > 10:
                    print(f"   📈 ... and {len(trading_params) - 10} more trading parameters")

                print(f"\n🔧 API PARAMETERS ({len(api_params)}):")
                for key, value in sorted(api_params.items()):
                    print(f"   🔑 {key}: {value}")

                print(f"\n📊 TECHNICAL INDICATORS ({len(technical_params)}):")
                for key, value in sorted(technical_params.items()):
                    print(f"   📊 {key}: {value}")

                if other_params:
                    print(f"\n🔍 OTHER PARAMETERS ({len(other_params)}):")
                    for key, value in sorted(list(other_params.items())[:5]):
                        print(f"   🔍 {key}: {value}")

                # Frontend validation checks
                print(f"\n✅ FRONTEND VALIDATION CHECKS:")
                print("-" * 60)

                success_criteria = []

                # Check 1: Frontend receives meaningful trading parameters
                has_trading_params = len(trading_params) > 0
                success_criteria.append(("Frontend receives trading parameters", has_trading_params))

                # Check 2: Trading parameters outnumber rolling window parameters
                prioritizes_trading = len(trading_params) > len(technical_params)
                success_criteria.append(("Trading params > rolling windows", prioritizes_trading))

                # Check 3: Frontend gets specific key parameters
                key_params = ['atr_mult', 'ema_dev', 'rvol']
                detected_key_params = [param for param in key_params if any(param in key for key in trading_params.keys())]
                has_key_params = len(detected_key_params) >= 2
                success_criteria.append(("Has key trading parameters", has_key_params))

                # Check 4: No more generic "rolling_window" dominance
                no_rolling_dominance = len(technical_params) < 10
                success_criteria.append(("Limited rolling window parameters", no_rolling_dominance))

                # Check 5: Parameters have meaningful names (not just threshold_N)
                has_meaningful_names = any('_threshold' in key for key in trading_params.keys())
                success_criteria.append(("Parameters have meaningful names", has_meaningful_names))

                # Print validation results
                all_passed = True
                for check_name, passed in success_criteria:
                    status = "✅ PASS" if passed else "❌ FAIL"
                    print(f"   {status}: {check_name}")
                    if not passed:
                        all_passed = False

                print(f"\n{'🎉 FRONTEND INTEGRATION SUCCESS!' if all_passed else '❌ FRONTEND INTEGRATION NEEDS WORK'}")

                if has_trading_params:
                    print(f"\n💡 WHAT FRONTEND WILL DISPLAY:")
                    print("Instead of:")
                    print("   📊 rolling_window: 14")
                    print("   📊 rolling_window: 20")
                    print("Frontend will now show:")
                    for key, value in list(trading_params.items())[:3]:
                        print(f"   📈 {key}: {value}")

                return all_passed, trading_params

            else:
                print(f"❌ API call failed: {format_response.status_code}")
                print(f"Response: {format_response.text}")
                return False, {}

        except requests.RequestException as e:
            print(f"❌ API request failed: {e}")
            print(f"💡 Make sure the backend is running on localhost:8000")
            return False, {}

    except FileNotFoundError:
        print(f"❌ Scanner file not found: {scanner_file}")
        return False, {}
    except Exception as e:
        print(f"❌ Test failed: {e}")
        import traceback
        traceback.print_exc()
        return False, {}

if __name__ == "__main__":
    success, trading_params = test_frontend_parameter_integration()

    if success:
        print(f"\n🚀 SUCCESS: Frontend will now display {len(trading_params)} meaningful trading parameters!")
        print("The user should see actual scanner parameters instead of generic rolling_window values.")
    else:
        print(f"\n⚠️ Frontend integration test failed.")
        print("Check that the backend is running and the API is accessible.")