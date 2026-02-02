#!/usr/bin/env python3

import requests
import json
import time

def test_frontend_scan_execution():
    """Test the complete frontend scan execution flow"""

    print("🧪 TESTING FRONTEND SCAN EXECUTION FLOW")
    print("=" * 50)

    # Step 1: Check if there are any projects with scanner code
    try:
        projects_response = requests.get("http://localhost:5656/api/projects")
        if projects_response.status_code == 200:
            projects_data = projects_response.json()
            print(f"📊 Found {len(projects_data.get('data', []))} projects")

            # Find a project with scanner code
            test_project = None
            data = projects_data.get('data', []) if isinstance(projects_data, dict) else projects_data
            for project in data:
                if isinstance(project, dict) and project.get('code'):
                    test_project = project
                    break

            if not test_project:
                print("❌ No projects with scanner code found")
                return

            print(f"✅ Using project: {test_project.get('name', 'Unknown')} (ID: {test_project.get('id')})")
            print(f"📝 Code length: {len(test_project.get('code', ''))} characters")

        else:
            print(f"❌ Failed to get projects: {projects_response.status_code}")
            return

    except Exception as e:
        print(f"❌ Error getting projects: {e}")
        return

    # Step 2: Execute the scan through the frontend API
    project_id = test_project.get('id')

    print(f"\n🚀 Executing scan through frontend API...")
    print(f"   Project ID: {project_id}")

    try:
        exec_response = requests.post(
            f"http://localhost:5656/api/projects/{project_id}/execute",
            json={
                "scanner_code": test_project.get('code', ''),
                "start_date": "2025-01-01",
                "end_date": "2025-11-01",
                "parallel_execution": True,
                "timeout_seconds": 120
            },
            timeout=180  # 3 minutes
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
                print(f"\n🎯 SAMPLE RESULTS (first 5):")
                for i, result in enumerate(results[:5]):
                    symbol = result.get('symbol', result.get('ticker', 'Unknown'))
                    date = result.get('date', 'Unknown')
                    gap = result.get('gap_percent', 0)
                    print(f"   {i+1}. {symbol} - {date} - Gap: {gap}%")

                print(f"\n✅ FRONTEND API WORKING: Found {len(results)} trading patterns!")
                print(f"   🎯 These results should now display in the frontend dashboard")

            else:
                print(f"\n⚠️  No results found, but API execution was successful")

        else:
            print(f"❌ Execution failed: {exec_response.status_code}")
            print(f"Response: {exec_response.text}")

    except Exception as e:
        print(f"❌ Error during execution: {e}")

if __name__ == "__main__":
    test_frontend_scan_execution()