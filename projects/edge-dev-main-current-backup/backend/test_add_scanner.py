#!/usr/bin/env python3
"""
Test adding a scanner to a project
"""

import requests
import json

def test_add_scanner_to_project():
    """Test adding a formatted scanner to a project"""

    print("🧪 Testing Add Scanner to Project")
    print("=" * 50)

    base_url = "http://localhost:5659"
    project_id = "df213ba6-85f2-49e0-8b9b-42aef2d00e13"  # Our test project ID

    # Sample scanner code
    scanner_code = '''
P = {
    "price_min": 8.0,
    "volume_min": 500000,
    "atr_mult": 2.0
}

def scan_symbol(symbol):
    # Sample scanner function
    return {"symbol": symbol, "signal": "BUY"}
'''

    try:
        # Step 1: Save scanner and link to project
        print("📝 Step 1: Saving scanner and linking to project...")

        save_data = {
            "scanner_code": scanner_code,
            "scanner_name": "Test Scanner for Project",
            "parameters_count": 3,
            "scanner_type": "formatted_scanner",
            "user_id": "test_user",
            "project_id": project_id  # This should link the scanner to the project
        }

        response = requests.post(
            f"{base_url}/api/format/save-scanner-to-system",
            json=save_data,
            headers={"Content-Type": "application/json"}
        )

        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            result = response.json()
            print(f"✅ Scanner saved successfully!")
            print(f"   Success: {result.get('success')}")
            print(f"   Scanner ID: {result.get('scanner_id')}")

            # Step 2: Check if scanner was added to project
            print(f"\n📋 Step 2: Checking project scanners...")

            scanners_response = requests.get(
                f"{base_url}/api/projects/{project_id}/scanners",
                headers={"Content-Type": "application/json"}
            )

            print(f"   Status: {scanners_response.status_code}")

            if scanners_response.status_code == 200:
                scanners = scanners_response.json()
                print(f"✅ Found {len(scanners)} scanners in project:")

                for scanner in scanners:
                    print(f"   - {scanner.get('scanner_id')} (File: {scanner.get('scanner_file')})")
                    print(f"     Enabled: {scanner.get('enabled')}, Parameters: {scanner.get('parameter_count')}")

                # Step 3: Check project details
                print(f"\n📊 Step 3: Checking updated project details...")

                project_response = requests.get(
                    f"{base_url}/api/projects/{project_id}",
                    headers={"Content-Type": "application/json"}
                )

                if project_response.status_code == 200:
                    project = project_response.json()
                    print(f"✅ Project updated successfully!")
                    print(f"   Scanner Count: {project.get('scanner_count')} (was 0 before)")

                    if project.get('scanner_count') > 0:
                        return True
                    else:
                        print(f"❌ Scanner was not added to project")
                        return False
                else:
                    print(f"❌ Failed to get project details: {project_response.text}")
                    return False
            else:
                print(f"❌ Failed to get project scanners: {scanners_response.text}")
                return False
        else:
            print(f"❌ Failed to save scanner: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_add_scanner_to_project()

    print(f"\n{'=' * 50}")
    if success:
        print("🎉 SUCCESS: Scanner added to project!")
        print("✅ Project should now show scanners in the Projects section!")
    else:
        print("❌ FAILED: Scanner was not added to project")
        print("❌ Need to debug the save-scanner-to-system endpoint")
    print(f"{'=' * 50}")