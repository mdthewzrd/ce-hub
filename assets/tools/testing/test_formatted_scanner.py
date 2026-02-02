#!/usr/bin/env python3
"""
Test the formatted A+ scanner to verify it produces expected results
"""
import requests
import json
import tempfile
import subprocess
import sys
import os

def test_formatted_scanner():
    """Test the formatted A+ scanner implementation"""
    print("🧪 Testing Formatted A+ Scanner with Full Universe Implementation")
    print("=" * 70)

    # Read the original half A+ scan code
    with open('/Users/michaeldurante/.anaconda/working code/Daily Para/half A+ scan.py', 'r') as f:
        original_code = f.read()

    print(f"📁 Loaded original code: {len(original_code)} characters")

    # Get the formatted code from the API
    print("🚀 Getting formatted code from API...")
    request_data = {
        "code": original_code,
        "options": {
            "enableMultiprocessing": True,
            "enableAsyncPatterns": True,
            "addTradingPackages": True,
            "standardizeOutput": True,
            "optimizePerformance": True,
            "includeLogging": True,
            "preserveParameterIntegrity": True,
            "enhanceTickerUniverse": True
        }
    }

    try:
        response = requests.post(
            'http://localhost:8000/api/format/code',
            json=request_data,
            timeout=120
        )

        if response.status_code != 200:
            print(f"❌ API Error: {response.status_code} - {response.text}")
            return False

        result = response.json()

        if not result.get('success'):
            print(f"❌ Formatting failed: {result.get('errors', 'Unknown error')}")
            return False

        formatted_code = result.get('formatted_code')
        if not formatted_code:
            print("❌ No formatted code returned")
            return False

        print(f"✅ Got formatted code: {len(formatted_code)} characters")
        print(f"📊 Scanner type: {result.get('scanner_type')}")
        print(f"🔧 Parameters: {result.get('metadata', {}).get('parameter_count', 'N/A')}")

        # Save the formatted code to a temporary file
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
            f.write(formatted_code)
            temp_file = f.name

        print(f"💾 Saved formatted code to: {temp_file}")

        # Try to run the formatted code
        print("🚀 Running formatted scanner...")
        try:
            # Set environment variables for the subprocess
            env = os.environ.copy()
            env['PYTHONPATH'] = '/Users/michaeldurante/.anaconda/envs/myenv/lib/python3.12/site-packages'

            result = subprocess.run(
                [sys.executable, temp_file],
                capture_output=True,
                text=True,
                timeout=60,  # 60 second timeout
                env=env
            )

            print("📊 SCANNER EXECUTION RESULTS:")
            print("=" * 50)

            if result.stdout:
                print("📈 STDOUT:")
                print(result.stdout)

            if result.stderr:
                print("⚠️ STDERR:")
                print(result.stderr)

            print(f"🔢 Return code: {result.returncode}")

            # Check if we got expected output patterns
            output = result.stdout + result.stderr

            # Look for key indicators
            if "Full Universe Implementation" in output:
                print("✅ Full universe implementation detected")

            if "FULL UNIVERSE SCAN" in output:
                print("✅ Full universe scan mode activated")

            if "Preserved Parameters:" in output:
                print("✅ Parameter preservation confirmed")

            if "Total Results:" in output:
                print("✅ Results generated")

            # Look for specific tickers that should appear
            expected_tickers = ['SMCI', 'MSTR', 'DJT', 'BABA']
            found_tickers = []

            for ticker in expected_tickers:
                if ticker in output:
                    found_tickers.append(ticker)

            if found_tickers:
                print(f"🎯 Expected tickers found: {', '.join(found_tickers)}")
            else:
                print("⚠️ No expected tickers found in output")

            return len(found_tickers) > 0

        except subprocess.TimeoutExpired:
            print("⏰ Scanner execution timed out (60s)")
            return False
        except Exception as e:
            print(f"❌ Error running scanner: {e}")
            return False
        finally:
            # Clean up temp file
            try:
                os.unlink(temp_file)
            except:
                pass

    except Exception as e:
        print(f"❌ Test failed: {e}")
        return False

if __name__ == "__main__":
    success = test_formatted_scanner()
    if success:
        print("\n🎉 TEST PASSED: Formatted scanner is working correctly!")
    else:
        print("\n❌ TEST FAILED: Scanner needs further investigation")

    sys.exit(0 if success else 1)