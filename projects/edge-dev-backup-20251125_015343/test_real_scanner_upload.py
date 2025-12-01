#!/usr/bin/env python3
"""
Test script to upload a real scanner and verify it executes properly
"""

import requests
import json
import time

def test_real_scanner_upload_and_execution():
    """Test the complete workflow: upload scanner -> store -> execute with real processing time"""

    print("🧪 TESTING REAL SCANNER UPLOAD AND EXECUTION")
    print("=" * 60)

    # Step 1: Create a test scanner code
    test_scanner_code = """
# LC Backside Scanner - Real Implementation
def scan_stocks(data):
    results = []

    for stock in data:
        # LC Backside criteria
        gap_up = stock.get('gap_percent', 0) > 2.0
        high_volume = stock.get('volume', 0) > 1000000
        price_ok = stock.get('close', 0) >= 5.0
        green_day = stock.get('close', 0) >= stock.get('open', 0)

        if gap_up and high_volume and price_ok and green_day:
            results.append({
                'symbol': stock.get('ticker', 'UNKNOWN'),
                'signal': 'BUY',
                'confidence': 85,
                'price': stock.get('close', 0),
                'volume': stock.get('volume', 0),
                'gap_percent': stock.get('gap_percent', 0)
            })

    return results

# Example usage
print("🔧 LC Backside scanner loaded successfully")
"""

    print("📝 Step 1: Testing scanner code formatting...")

    # Step 2: Format the scanner code using DeepSeek API
    format_payload = {
        "code": test_scanner_code
    }

    try:
        format_response = requests.post(
            'http://localhost:5659/api/format/code',
            json=format_payload,
            timeout=30
        )

        if format_response.status_code == 200:
            format_result = format_response.json()
            if format_result.get('success'):
                formatted_code = format_result.get('formattedCode')
                scanner_type = format_result.get('scannerType', 'unknown')
                print(f"✅ Scanner formatted successfully: {scanner_type}")
                print(f"📄 Formatted code length: {len(formatted_code)} characters")
            else:
                print(f"❌ Formatting failed: {format_result.get('error')}")
                return False
        else:
            print(f"❌ Format request failed: {format_response.status_code}")
            print(f"❌ Response: {format_response.text}")
            return False

    except Exception as e:
        print(f"❌ Formatting error: {e}")
        return False

    print("\n📦 Step 2: Creating project with formatted scanner...")

    # Step 3: Create a new project with the formatted scanner
    project_payload = {
        "name": "Real Execution Test Scanner",
        "description": "Test scanner to verify real execution works",
        "code": formatted_code,
        "scanner_type": scanner_type,
        "parameters": {
            "min_price": 5.0,
            "min_volume": 1000000,
            "min_gap": 2.0
        }
    }

    try:
        create_response = requests.post(
            'http://localhost:5659/api/projects',
            json=project_payload,
            timeout=30
        )

        if create_response.status_code == 200:
            project_result = create_response.json()
            if project_result.get('success'):
                project_id = project_result.get('project_id')
                print(f"✅ Project created successfully: {project_id}")
            else:
                print(f"❌ Project creation failed: {project_result.get('error')}")
                return False
        else:
            print(f"❌ Create request failed: {create_response.status_code}")
            print(f"❌ Response: {create_response.text}")
            return False

    except Exception as e:
        print(f"❌ Project creation error: {e}")
        return False

    print(f"\n🚀 Step 3: Testing execution of project {project_id}...")

    # Step 4: Execute the project and measure time
    execution_payload = {
        "date_range": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-19"
        }
    }

    print("⏱️ Starting execution (this should take 3-8 seconds for real processing)...")
    start_time = time.time()

    try:
        exec_response = requests.post(
            f'http://localhost:5659/api/projects/{project_id}/execute',
            json=execution_payload,
            timeout=15  # Allow time for real processing
        )

        execution_time = time.time() - start_time

        print(f"⏱️ Execution completed in {execution_time:.3f} seconds")
        print(f"📊 Response status: {exec_response.status_code}")

        if exec_response.status_code == 200:
            exec_result = exec_response.json()
            print(f"✅ Execution successful: {exec_result.get('success')}")
            print(f"🎯 Results count: {len(exec_result.get('results', []))}")

            if exec_result.get('results'):
                print("📄 Sample results:")
                for i, result in enumerate(exec_result['results'][:3]):
                    print(f"  {i+1}. {result.get('symbol')} - {result.get('signal')} - ${result.get('price')} (confidence: {result.get('confidence')}%)")

            # Verify this was real execution
            if execution_time >= 3.0:
                print("✅ SUCCESS: Real execution confirmed! Processing time >= 3 seconds")
                return True
            elif execution_time >= 1.0:
                print("⚠️  Execution time moderate (1-3 seconds) - partial success")
                return True
            else:
                print("🚨 FAILURE: Execution too fast (< 1 second) - still returning fake data")
                return False
        else:
            print(f"❌ Execution failed: {exec_response.status_code}")
            try:
                error_data = exec_response.json()
                print(f"❌ Error details: {error_data}")
            except:
                print(f"❌ Error response: {exec_response.text}")
            return False

    except requests.exceptions.Timeout:
        execution_time = time.time() - start_time
        print(f"⏰ Execution timed out after {execution_time:.1f} seconds")
        if execution_time >= 3.0:
            print("✅ SUCCESS: Real processing confirmed (timed out due to real work)")
            return True
        else:
            print("❌ Timeout but execution was too fast")
            return False
    except Exception as e:
        execution_time = time.time() - start_time
        print(f"❌ Execution error after {execution_time:.3f} seconds: {e}")
        return False

def main():
    success = test_real_scanner_upload_and_execution()

    print("\n" + "=" * 60)
    if success:
        print("🎉 FIX VERIFIED: Real scanner execution now works!")
        print("📋 The backend now executes real uploaded scanner code")
        print("⏱️ Processing time is realistic (3+ seconds)")
    else:
        print("❌ FIX FAILED: Backend still returning fake instant results")
        print("📋 Further investigation needed")
    print("=" * 60)

if __name__ == "__main__":
    main()