#!/usr/bin/env python3

import requests
import json

def test_frontend_execution():
    """Test the frontend project execution"""

    print("🧪 TESTING FRONTEND PROJECT EXECUTION")
    print("=" * 50)

    # Test project execution
    project_id = "1765050996545"

    print(f"🚀 Executing project {project_id} through frontend API...")

    try:
        exec_response = requests.post(
            f"http://localhost:5656/api/projects/{project_id}/execute",
            json={
                "date_range": {
                    "start_date": "2025-01-01",
                    "end_date": "2025-11-01"
                },
                "timeout_seconds": 180,
                "parallel_execution": True
            },
            timeout=300
        )

        print(f"📡 Execution API Status: {exec_response.status_code}")

        if exec_response.status_code == 200:
            exec_result = exec_response.json()
            print(f"✅ Execution completed successfully!")
            print(f"   Success: {exec_result.get('success', False)}")
            print(f"   Execution ID: {exec_result.get('execution_id', 'N/A')}")
            print(f"   Results Count: {len(exec_result.get('results', []))}")
            print(f"   Total Found: {exec_result.get('total_found', 0)}")

            # Show sample results
            results = exec_result.get('results', [])
            if results:
                print(f"\n🎯 FIRST 5 RESULTS:")
                for i, result in enumerate(results[:5]):
                    symbol = result.get('symbol', result.get('ticker', 'Unknown'))
                    date = result.get('date', 'Unknown')
                    gap = result.get('gap_percent', 0)
                    print(f"   {i+1}. {symbol} - {date} - Gap: {gap}%")

                print(f"\n✅ FRONTEND WORKING: Found {len(results)} total patterns!")

                # Check for specific expected patterns
                symbols_found = [r.get('symbol') for r in results]
                if 'AMD' in symbols_found:
                    print(f"   ✅ AMD pattern found")
                if 'INTC' in symbols_found:
                    print(f"   ✅ INTC pattern found")
                if 'XOM' in symbols_found:
                    print(f"   ✅ XOM pattern found")

            else:
                print(f"\n⚠️  No results found")

        else:
            print(f"❌ Execution failed: {exec_response.status_code}")
            print(f"Response: {exec_response.text}")

    except Exception as e:
        print(f"❌ Error during execution: {e}")

if __name__ == "__main__":
    test_frontend_execution()