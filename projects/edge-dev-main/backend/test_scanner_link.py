#!/usr/bin/env python3
"""
Test script to save scanner to system and link to project
"""

import requests
import json

def test_scanner_save_and_link():
    """Test saving scanner with project linking"""

    # Read the scanner file
    with open("/Users/michaeldurante/ai dev/ce-hub/edge-dev/backend/sophisticated_lc_scanner.py", 'r') as f:
        scanner_code = f.read()

    # Prepare the request data
    data = {
        "scanner_code": scanner_code,
        "scanner_name": "Backside Para B Scanner",
        "parameters_count": 24,
        "scanner_type": "A+ Daily Parabolic",
        "user_id": "test_user",
        "project_id": "0770c2ac-fdff-4afe-b78b-c338cfecf0c5"  # The project ID from the user's session
    }

    print("🧪 Testing enhanced save-scanner-to-system with project linking...")
    print(f"📋 Scanner name: {data['scanner_name']}")
    print(f"📋 Project ID: {data['project_id']}")
    print(f"📋 Code length: {len(scanner_code)} characters")

    try:
        response = requests.post(
            "http://localhost:8000/api/format/save-scanner-to-system",
            json=data,
            headers={"Content-Type": "application/json"}
        )

        if response.status_code == 200:
            result = response.json()
            print("✅ SUCCESS!")
            print(f"📋 Scanner ID: {result.get('scanner_id')}")
            print(f"📋 Message: {result.get('message')}")
            print(f"📋 Linked to project: {result.get('linked_to_project')}")
            return True, result
        else:
            print(f"❌ FAILED! Status: {response.status_code}")
            print(f"Response: {response.text}")
            return False, None

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, None

def verify_project_scanners(project_id):
    """Verify that scanners are linked to the project"""
    print(f"\n🔍 Verifying project {project_id} scanners...")

    try:
        response = requests.get(f"http://localhost:8000/api/projects/{project_id}/scanners")

        if response.status_code == 200:
            scanners = response.json()
            print(f"✅ Found {len(scanners)} scanners in project:")
            for scanner in scanners:
                print(f"  📋 Scanner: {scanner.get('scanner_id', 'Unknown')}")
            return True, scanners
        else:
            print(f"❌ Failed to get scanners. Status: {response.status_code}")
            return False, None

    except Exception as e:
        print(f"❌ ERROR: {e}")
        return False, None

if __name__ == "__main__":
    print("🧪 Testing Scanner Save and Project Link Fix")
    print("=" * 50)

    # Test the enhanced save function
    success, result = test_scanner_save_and_link()

    if success:
        # Verify the project has the scanner
        project_id = "0770c2ac-fdff-4afe-b78b-c338cfecf0c5"
        verify_project_scanners(project_id)

    print("\n🧪 Test completed!")