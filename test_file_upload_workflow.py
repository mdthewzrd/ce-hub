#!/usr/bin/env python3
"""
Test the complete file upload workflow by simulating the frontend process
"""

import requests
import json
from pathlib import Path

def test_file_upload_workflow():
    """Test the complete workflow: upload → format → run scanner → get results"""

    # 1. Find and read the backside B scanner
    scanner_path = Path("/Users/michaeldurante/Downloads/formatted backside para b with smart filtering.py")

    if not scanner_path.exists():
        print("❌ Backside B scanner not found")
        return False

    with open(scanner_path, 'r', encoding='utf-8') as f:
        scanner_code = f.read()

    print(f"✅ Loaded scanner: {scanner_path.name}")
    print(f"📊 Scanner size: {len(scanner_code)} characters")

    # 2. Test the formatting API (simulating frontend upload)
    try:
        # First, let's start a backend server
        import subprocess
        import time
        import os

        # Change to backend directory
        backend_dir = Path("/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend")
        os.chdir(backend_dir)

        # Start the backend server
        print("🚀 Starting backend server...")
        backend_process = subprocess.Popen([
            "python3", "main.py"
        ], stdout=subprocess.PIPE, stderr=subprocess.PIPE)

        # Wait for server to start
        time.sleep(5)

        # Test if server is running
        try:
            response = requests.get("http://localhost:8000/", timeout=2)
            print("✅ Backend server is running")
        except:
            print("❌ Backend server not responding")
            backend_process.terminate()
            return False

        # 3. Test the file formatting endpoint
        print("📤 Testing file upload and formatting...")

        # Create multipart form data like the frontend does
        files = {
            'scanFile': ('backside_b_scanner.py', scanner_code, 'text/x-python'),
            'formatterType': (None, 'edge'),
            'message': (None, 'Please format this backside B scanner for edge.dev')
        }

        response = requests.post(
            "http://localhost:8000/api/format-scan",
            files=files,
            timeout=30
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ File successfully formatted!")
            print(f"📊 Scanner type: {result.get('scanner_type', 'unknown')}")
            print(f"🔧 Parameters extracted: {result.get('parameter_count', 0)}")
            print(f"📈 Changes made: {len(result.get('changes', []))}")

            # 4. Test scanner execution
            print("🏃 Testing scanner execution...")

            # Create project configuration
            project_data = {
                "name": "Backside B Test Project",
                "description": "Testing backside B scanner execution",
                "start_date": "2025-01-01",
                "end_date": "2025-11-25",
                "scanners": [{
                    "scanner_id": "backside_b_test",
                    "scanner_code": result.get('formatted_code', scanner_code),
                    "parameters": result.get('parameters', {}),
                    "enabled": True
                }]
            }

            exec_response = requests.post(
                "http://localhost:8000/api/projects/create-and-execute",
                json=project_data,
                timeout=60
            )

            if exec_response.status_code == 200:
                exec_result = exec_response.json()
                print("✅ Scanner execution completed!")

                # 5. Get and analyze results
                results = exec_result.get('results', {})
                signals = results.get('signals', [])

                print(f"🎯 RESULTS SUMMARY:")
                print(f"   • Total signals found: {len(signals)}")
                print(f"   • Execution time: {results.get('execution_time', 'N/A')} seconds")
                print(f"   • Project ID: {exec_result.get('project_id', 'N/A')}")

                if signals:
                    print(f"\n📊 TOP 10 SIGNALS:")
                    for i, signal in enumerate(signals[:10]):
                        print(f"   {i+1}. {signal.get('ticker', 'N/A')} - {signal.get('date', 'N/A')} - Gap: {signal.get('gap_percent', 'N/A')}%")

                return True
            else:
                print(f"❌ Scanner execution failed: {exec_response.status_code}")
                print(f"Error: {exec_response.text}")
                return False

        else:
            print(f"❌ File formatting failed: {response.status_code}")
            print(f"Error: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error during testing: {e}")
        return False

    finally:
        # Clean up backend process
        if 'backend_process' in locals():
            backend_process.terminate()

if __name__ == "__main__":
    print("🧪 TESTING COMPLETE FILE UPLOAD WORKFLOW")
    print("=" * 50)

    success = test_file_upload_workflow()

    print("=" * 50)
    if success:
        print("🎉 ALL TESTS PASSED - File upload workflow is working!")
    else:
        print("❌ TESTS FAILED - Issues found in workflow")