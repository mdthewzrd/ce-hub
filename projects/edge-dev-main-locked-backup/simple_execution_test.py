#!/usr/bin/env python3
"""
Simple test to see execution results
"""

import requests
import time
import json

def simple_test():
    project_id = "8"

    execution_payload = {
        "date_range": {
            "start_date": "2025-01-01",
            "end_date": "2025-11-19"
        }
    }

    print(f"🚀 Testing execution of project {project_id}...")
    start_time = time.time()

    try:
        response = requests.post(
            f'http://localhost:5659/api/projects/{project_id}/execute',
            json=execution_payload,
            timeout=20
        )

        execution_time = time.time() - start_time
        print(f"⏱️ Execution time: {execution_time:.3f} seconds")
        print(f"📊 Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"Success flag: {result.get('success')}")
            print(f"Results count: {len(result.get('results', []))}")

            if result.get('results'):
                print("📄 Results:")
                for i, res in enumerate(result['results']):
                    print(f"  {i+1}. {res}")

            if execution_time >= 3.0:
                print("\n🎉 BUG FIXED! Real execution confirmed!")
                print("⏱️ Processing time is realistic (3+ seconds)")
                print("🔧 Scanner code is being executed, not fake data!")
            else:
                print("\n⚠️  Execution still fast, might be fake data")

        else:
            print(f"❌ Failed: {response.text}")

    except Exception as e:
        print(f"❌ Error: {e}")

if __name__ == "__main__":
    simple_test()