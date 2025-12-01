#!/usr/bin/env python3
"""
Test script to verify the scanner execution bug and fix it
"""

import sys
import os
import json
import time
import requests

def test_current_execution_behavior():
    """Test the current execution behavior to confirm the bug"""

    print("🔍 Testing current backend execution behavior...")

    # Test 1: Check if backend is running
    try:
        response = requests.get('http://localhost:5659/api/projects', timeout=5)
        if response.status_code == 200:
            print("✅ Backend is running on port 5659")
            projects = response.json()  # It's a list directly, not wrapped in a dict
            print(f"📊 Found {len(projects)} projects")

            # Show project details
            for project in projects:
                print(f"  - Project {project['id']}: {project['name']}")
        else:
            print("❌ Backend not responding correctly")
            return False
    except Exception as e:
        print(f"❌ Cannot connect to backend: {e}")
        return False

    # Test 2: Try to execute a project and measure time
    if projects:
        test_project = projects[0]
        project_id = test_project['id']

        print(f"\n🚀 Testing execution of project {project_id}: {test_project['name']}")

        execution_payload = {
            "date_range": {
                "start_date": "2025-01-01",
                "end_date": "2025-11-19"
            }
        }

        start_time = time.time()
        try:
            response = requests.post(
                f'http://localhost:5659/api/projects/{project_id}/execute',
                json=execution_payload,
                timeout=15  # Give it more time
            )
            execution_time = time.time() - start_time

            print(f"📊 Response status: {response.status_code}")
            print(f"⏱️ Execution time: {execution_time:.3f} seconds")

            if response.status_code == 200:
                result = response.json()
                print(f"✅ Execution completed")
                print(f"📊 Success: {result.get('success')}")
                print(f"🎯 Results count: {len(result.get('results', []))}")
                print(f"📄 Execution ID: {result.get('execution_id')}")

                if result.get('results'):
                    sample_result = result['results'][0]
                    print(f"📄 Sample result: {sample_result.get('symbol')} - {sample_result.get('signal')} - ${sample_result.get('price')}")

                    # Check if it's always the same fake AAPL result
                    symbols = [r.get('symbol') for r in result['results']]
                    if symbols == ['AAPL'] or all(s == 'AAPL' for s in symbols):
                        print("🚨 BUG CONFIRMED: Always returning AAPL - fake data!")

                # Check if it's fake data (instant execution under 0.1 seconds)
                if execution_time < 0.1:
                    print("🚨 BUG CONFIRMED: Execution too fast (< 0.1s) - returning fake data!")
                    return True
                elif execution_time < 3.0:
                    print("⚠️  Execution suspiciously fast (< 3s) - may not be processing real data")
                    return True
                else:
                    print("✅ Execution time looks realistic (3+ seconds)")
                    return False
            else:
                print(f"❌ Execution failed: {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"❌ Error details: {error_data}")
                except:
                    print(f"❌ Error response: {response.text}")
                return False

        except requests.exceptions.Timeout:
            print("⏰ Execution timed out (> 15s) - this might be good (real processing)")
            return False
        except Exception as e:
            print(f"❌ Execution error: {e}")
            return False

    return False

def main():
    print("=" * 60)
    print("🔧 EDGE-DEV BACKEND EXECUTION BUG VERIFICATION")
    print("=" * 60)

    bug_confirmed = test_current_execution_behavior()

    print("\n" + "=" * 60)
    if bug_confirmed:
        print("🚨 BUG CONFIRMED: Backend returns fake instant results")
        print("📋 Next steps:")
        print("  1. Fix scanner_code_storage population")
        print("  2. Ensure real scanner code execution")
        print("  3. Verify 3-8 second processing time")
    else:
        print("✅ No obvious bug detected - execution looks normal")
    print("=" * 60)

if __name__ == "__main__":
    main()