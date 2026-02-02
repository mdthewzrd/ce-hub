#!/usr/bin/env python3
"""
Detailed diagnostic test to understand why bypass system returns 0 results
when original scanner returns 8 results
"""
import requests
import json
import time
import tempfile
import sys
import importlib.util

def test_bypass_detailed():
    """Detailed test to diagnose bypass execution issues"""
    print("🔍 DETAILED BYPASS DIAGNOSTIC")
    print("=" * 70)

    # Read the actual backside para scanner code
    backside_para_path = '/Users/michaeldurante/.anaconda/working code/backside daily para/backside para b.py'
    try:
        with open(backside_para_path, 'r') as f:
            backside_code = f.read()
        print(f"✅ Loaded backside para scanner: {len(backside_code)} characters")
    except Exception as e:
        print(f"❌ Failed to load backside para scanner: {e}")
        return False

    try:
        # Step 1: Local execution test
        print(f"\n🧪 Step 1: Testing local execution with same logic as bypass...")

        # Create temporary file and load as module (same as bypass system)
        with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as temp_file:
            temp_file.write(backside_code)
            temp_file_path = temp_file.name

        # Load as module
        spec = importlib.util.spec_from_file_location("test_scanner", temp_file_path)
        uploaded_module = importlib.util.module_from_spec(spec)

        old_module = sys.modules.get("test_scanner")
        sys.modules["test_scanner"] = uploaded_module

        try:
            spec.loader.exec_module(uploaded_module)
            print("✅ Module loaded successfully")
        except Exception as e:
            print(f"❌ Failed to load module: {e}")
            return False

        # Check if module has the expected attributes
        has_scan_symbol = hasattr(uploaded_module, 'scan_symbol')
        has_symbols = hasattr(uploaded_module, 'SYMBOLS')

        print(f"🔍 Module attributes:")
        print(f"   - has scan_symbol function: {has_scan_symbol}")
        print(f"   - has SYMBOLS list: {has_symbols}")

        if has_symbols:
            symbols = uploaded_module.SYMBOLS
            print(f"   - SYMBOLS count: {len(symbols)}")
            print(f"   - First 5 symbols: {symbols[:5]}")

        if has_scan_symbol and has_symbols:
            # Test scanning a single symbol that we know should have results
            print(f"\n🎯 Step 2: Testing scan_symbol with SOXL (should have result on 2025-10-02)...")

            try:
                # Test with the exact date range that should include SOXL result
                result_df = uploaded_module.scan_symbol('SOXL', '2025-10-01', '2025-10-03')

                if result_df is not None and not result_df.empty:
                    print(f"✅ SOXL scan successful: {len(result_df)} results")
                    print(f"📊 Result columns: {list(result_df.columns)}")
                    print(f"📅 Result dates: {result_df['Date'].tolist() if 'Date' in result_df.columns else 'No Date column'}")

                    # Convert to dict format like bypass system does
                    results_dict = result_df.to_dict('records')
                    print(f"🔍 First result: {results_dict[0] if results_dict else 'No results'}")

                else:
                    print(f"❌ SOXL scan returned empty results")
                    print(f"📊 DataFrame info: {result_df}")

            except Exception as e:
                print(f"❌ Error scanning SOXL: {e}")
                import traceback
                traceback.print_exc()

            # Test with broader date range
            print(f"\n🎯 Step 3: Testing with broader date range (2025-01-01 to 2025-11-02)...")

            try:
                result_df = uploaded_module.scan_symbol('SOXL', '2025-01-01', '2025-11-02')

                if result_df is not None and not result_df.empty:
                    print(f"✅ SOXL broad range scan: {len(result_df)} results")
                    results_dict = result_df.to_dict('records')
                    for i, result in enumerate(results_dict):
                        print(f"   Result {i+1}: {result.get('Date', 'No date')} - {result.get('Ticker', 'No ticker')}")
                else:
                    print(f"❌ SOXL broad range scan returned empty")

            except Exception as e:
                print(f"❌ Error in broad range scan: {e}")

        else:
            print(f"❌ Module missing required attributes")
            print(f"   Available attributes: {[attr for attr in dir(uploaded_module) if not attr.startswith('_')]}")

        # Step 4: Compare with API execution
        print(f"\n🚀 Step 4: Testing through API and comparing...")

        scan_request = {
            "scanner_type": "uploaded",
            "start_date": "2025-01-01",
            "end_date": "2025-11-02",
            "uploaded_code": backside_code
        }

        scan_response = requests.post(
            'http://localhost:8000/api/scan/execute',
            json=scan_request,
            timeout=30
        )

        if scan_response.status_code == 200:
            scan_result = scan_response.json()
            scan_id = scan_result.get('scan_id')
            print(f"✅ API scan started: {scan_id}")

            # Wait for completion
            for i in range(60):
                status_response = requests.get(f'http://localhost:8000/api/scan/status/{scan_id}')
                if status_response.status_code == 200:
                    status = status_response.json()
                    if status.get('status') == 'completed':
                        print(f"✅ API scan completed")
                        break
                    elif status.get('status') == 'failed':
                        print(f"❌ API scan failed: {status.get('message')}")
                        break
                    else:
                        print(f"⏳ API progress: {status.get('progress_percent', 0)}%")
                time.sleep(2)

            # Get results
            results_response = requests.get(f'http://localhost:8000/api/scan/results/{scan_id}')
            if results_response.status_code == 200:
                results_data = results_response.json()
                results = results_data.get('results', [])
                print(f"📊 API Results: {len(results)} total")

                if results:
                    for i, result in enumerate(results[:5]):  # Show first 5
                        print(f"   API Result {i+1}: {result.get('date', 'No date')} - {result.get('ticker', 'No ticker')}")
                else:
                    print("❌ API returned 0 results - this is the problem!")

        return True

    except Exception as e:
        print(f"❌ Test failed with exception: {e}")
        import traceback
        traceback.print_exc()
        return False

    finally:
        # Cleanup
        if 'temp_file_path' in locals():
            import os
            if os.path.exists(temp_file_path):
                try:
                    os.unlink(temp_file_path)
                except:
                    pass

if __name__ == "__main__":
    test_bypass_detailed()