#!/usr/bin/env python3
"""
Test execution of project 8 to see if it has scanner code
"""

import requests
import time

def test_project_8_execution():
    """Test execution of project 8"""

    print("🚀 TESTING EXECUTION OF PROJECT 8")
    print("=" * 60)

    project_id = "8"

    # Test execution with timing
    execution_payload = {
        "date_range": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-19"
        }
    }

    print(f"🎯 Executing project {project_id}...")
    print("⏱️ Starting execution...")

    start_time = time.time()

    try:
        exec_response = requests.post(
            f'http://localhost:5659/api/projects/{project_id}/execute',
            json=execution_payload,
            timeout=15
        )

        execution_time = time.time() - start_time

        print(f"⏱️ Execution completed in {execution_time:.3f} seconds")
        print(f"📊 Response status: {exec_response.status_code}")

        if exec_response.status_code == 200:
            exec_result = exec_response.json()
            print(f"✅ Execution successful: {exec_result.get('success')}")
            print(f"🎯 Results count: {len(exec_result.get('results', []))}")
            print(f"📄 Execution ID: {exec_result.get('execution_id')}")

            if exec_result.get('results'):
                print("📄 Sample results:")
                results = exec_result['results']
                for i in range(min(3, len(results))):
                    result = results[i]
                    print(f"  {i+1}. {result.get('symbol')} - {result.get('signal')} - ${result.get('price')} (confidence: {result.get('confidence')}%)")

            # Check execution time
            if execution_time >= 3.0:
                print("✅ SUCCESS: Real execution confirmed! Processing time >= 3 seconds")
                return True
            elif execution_time >= 1.0:
                print("⚠️  Execution time moderate (1-3 seconds)")
                return True
            else:
                print("🚨 Execution too fast (< 1 second) - likely fake data")
                return False
        else:
            print(f"❌ Execution failed: {exec_response.status_code}")
            print(f"❌ Error response: {exec_response.text}")
            return False

    except Exception as e:
        execution_time = time.time() - start_time
        print(f"❌ Execution error after {execution_time:.3f} seconds: {e}")
        return False

if __name__ == "__main__":
    success = test_project_8_execution()

    print("\n" + "=" * 60)
    if success:
        print("🎉 EXECUTION SUCCESSFUL!")
    else:
        print("❌ EXECUTION FAILED")
    print("=" * 60)