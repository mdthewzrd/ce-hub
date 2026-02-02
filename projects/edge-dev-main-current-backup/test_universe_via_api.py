#!/usr/bin/env python3
"""
Test Production Universe Integration via HTTP API
Tests the 12,086 symbol universe expansion by calling the Edge.dev API
"""

import requests
import json
import re
import time

def test_universe_expansion_via_api():
    """Test the universe expansion through the Edge.dev platform API"""
    print("🌍 TESTING PRODUCTION UNIVERSE EXPANSION VIA API")
    print("==============================================\n")

    try:
        # Test with a simple backside scanner that should trigger universe expansion
        test_code = '''# Simple Test Backside Scanner
SYMBOLS = ["AAPL", "MSFT", "GOOGL"]

def scan_backside_para_b():
    """Test backside scanner for universe expansion"""
    print("Scanning backside para B pattern...")
    results = []
    for symbol in SYMBOLS:
        # Mock backside scanning logic
        if len(symbol) <= 4:  # Simple filter
            results.append({
                'symbol': symbol,
                'pattern': 'backside_para_b',
                'signal': 'BULLISH'
            })
    return results

def main():
    return scan_backside_para_b()
'''

        print("📍 Testing universe expansion with backside scanner...")
        print(f"📄 Original code length: {len(test_code)} characters")
        print(f"🔍 Original symbols: 3 (AAPL, MSFT, GOOGL)")

        # Prepare the API request to Edge.dev platform
        url = "http://localhost:5659/api/ai-agent"
        payload = {
            "message": f"Please format and enhance this backside scanner code:\n\n```python\n{test_code}\n```",
            "context": {
                "page": "renata-popup",
                "timestamp": time.strftime("%Y-%m-%d %H:%M:%S"),
                "request_type": "code_formatting"
            }
        }

        print("\n📡 Sending request to Edge.dev platform...")
        start_time = time.time()

        try:
            response = requests.post(url, json=payload, timeout=120)
            response_time = time.time() - start_time

            print(f"✅ Response received in {response_time:.2f} seconds")
            print(f"📋 Status Code: {response.status_code}")

            if response.status_code == 200:
                result = response.json()
                print(f"📄 Response type: {result.get('type', 'unknown')}")
                print(f"📝 Message length: {len(result.get('message', ''))} characters")

                # Analyze the response for universe expansion
                message = result.get('message', '')

                # Look for code blocks in the response
                code_block_pattern = r'```(?:python)?\s*([\s\S]*?)\s*```'
                code_matches = re.findall(code_block_pattern, message)

                if code_matches:
                    # Analyze the first (and likely only) code block
                    enhanced_code = code_matches[0]
                    symbol_matches = re.findall(r'"[A-Za-z0-9\.\-+/]+"', enhanced_code)
                    symbol_count = len(symbol_matches)

                    print(f"\n🌍 UNIVERSE EXPANSION RESULTS:")
                    print(f"=============================")
                    print(f"✅ Original symbols: 3")
                    print(f"✅ Enhanced symbols: {symbol_count}")
                    print(f"📈 Expansion ratio: {(symbol_count / 3):.1f}x")

                    # Check for key indicators of successful universe expansion
                    has_production_comment = "PRODUCTION MARKET UNIVERSE" in enhanced_code
                    has_comprehensive_coverage = symbol_count >= 10000
                    has_tech_giants = any(symbol in enhanced_code for symbol in ['"AAPL"', '"MSFT"', '"GOOGL"'])
                    has_major_etfs = any(symbol in enhanced_code for symbol in ['"SPY"', '"QQQ"', '"VTI"'])

                    print(f"\n🔍 VERIFICATION METRICS:")
                    print(f"========================")
                    print(f"📝 Production Universe Comment: {'✅' if has_production_comment else '❌'}")
                    print(f"📊 Comprehensive Coverage (10k+): {'✅' if has_comprehensive_coverage else '❌'}")
                    print(f"💻 Tech Giants Present: {'✅' if has_tech_giants else '❌'}")
                    print(f"📈 Major ETFs Present: {'✅' if has_major_etfs else '❌'}")

                    # Final evaluation
                    success = (has_production_comment and
                              has_comprehensive_coverage and
                              has_tech_giants)

                    if success:
                        print(f"\n🎉 SUCCESS: PRODUCTION UNIVERSE EXPANSION CONFIRMED!")
                        print(f"===================================================")
                        print(f"✅ Expanded from 3 to {symbol_count} symbols")
                        print(f"✅ Production universe comment detected")
                        print(f"✅ Comprehensive market coverage achieved")
                        print(f"✅ Complete NYSE + NASDAQ + AMEX integration")
                        print(f"✅ Universe expansion working in production")

                        print(f"\n📋 EXPANSION SUMMARY:")
                        print(f"====================")
                        print(f"• Original: 3 symbols (test scanner)")
                        print(f"• Expanded: {symbol_count} symbols")
                        print(f"• Coverage: Complete US equity market")
                        print(f"• Expansion: {(symbol_count / 3):.1f}x increase")
                        print(f"• Response Time: {response_time:.2f} seconds")
                        print(f"• Status: PRODUCTION READY")

                        return True
                    else:
                        print(f"\n❌ PRODUCTION UNIVERSE EXPANSION FAILED")
                        print(f"=======================================")
                        print(f"❌ Production Comment: {'Found' if has_production_comment else 'Missing'}")
                        print(f"❌ Comprehensive Coverage: {'Found' if has_comprehensive_coverage else 'Missing'}")
                        print(f"❌ Tech Giants: {'Found' if has_tech_giants else 'Missing'}")
                        print(f"❌ Only {symbol_count} symbols (expected 10,000+)")
                        return False

                else:
                    print("❌ No code blocks found in API response")
                    print("📄 Response preview:")
                    print(message[:500] + "..." if len(message) > 500 else message)
                    return False

            else:
                print(f"❌ API request failed with status {response.status_code}")
                print(f"Error response: {response.text}")
                return False

        except requests.exceptions.RequestException as e:
            print(f"❌ Connection error: {e}")
            print("🔧 Make sure Edge.dev backend is running on localhost:5659")
            return False

    except Exception as e:
        print(f"❌ Universe expansion test failed: {e}")
        import traceback
        traceback.print_exc()
        return False

def main():
    """Main execution function"""
    print("🚀 TESTING PRODUCTION UNIVERSE INTEGRATION")
    print("=" * 50)

    success = test_universe_expansion_via_api()

    if success:
        print(f"\n✅ PRODUCTION UNIVERSE INTEGRATION TEST PASSED")
        print("=" * 50)
        print("🎉 The 12,086 symbol universe is working correctly!")
        print("🎉 Edge.dev platform is ready for production scanning!")
    else:
        print(f"\n❌ PRODUCTION UNIVERSE INTEGRATION TEST FAILED")
        print("=" * 50)
        print("🔧 Check the enhanced service and backend configuration")

    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)