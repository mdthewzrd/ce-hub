#!/usr/bin/env python3
"""
Simple test to verify project creation functionality
"""

import requests
import json

def test_simple_project():
    """Test basic project creation"""

    print("🧪 Testing Simple Project Creation")
    print("=" * 50)

    base_url = "http://localhost:5659"

    try:
        # Step 1: Create a simple project
        print("📝 Step 1: Creating test project...")

        project_data = {
            "name": "Test Scanner Project",
            "description": "A test project to verify functionality",
            "aggregation_method": "union",
            "tags": ["test"]
        }

        response = requests.post(
            f"{base_url}/api/projects",
            json=project_data,
            headers={"Content-Type": "application/json"}
        )

        print(f"   Status: {response.status_code}")

        if response.status_code == 200:
            project = response.json()
            project_id = project.get('id')
            print(f"✅ Project created successfully!")
            print(f"   ID: {project_id}")
            print(f"   Name: {project.get('name')}")
            print(f"   Scanner Count: {project.get('scanner_count')}")

            # Step 2: List projects to verify
            print("\n📋 Step 2: Listing all projects...")

            list_response = requests.get(f"{base_url}/api/projects")
            print(f"   Status: {list_response.status_code}")

            if list_response.status_code == 200:
                projects = list_response.json()
                print(f"✅ Found {len(projects)} projects:")

                for project in projects:
                    print(f"   - {project.get('name')} (ID: {project.get('id')})")

                # Look for our test project
                test_project = next((p for p in projects if p.get('id') == project_id), None)
                if test_project:
                    print(f"✅ Test project found in list!")
                    return True
                else:
                    print(f"❌ Test project not found in list")
                    return False
            else:
                print(f"❌ Failed to list projects: {list_response.text}")
                return False
        else:
            print(f"❌ Failed to create project: {response.text}")
            return False

    except Exception as e:
        print(f"❌ Error: {e}")
        return False

if __name__ == "__main__":
    success = test_simple_project()

    print(f"\n{'=' * 50}")
    if success:
        print("🎉 SUCCESS: Project creation works!")
        print("✅ Projects should appear in the Projects section!")
    else:
        print("❌ FAILED: Project creation has issues")
        print("❌ Need to debug project creation workflow")
    print(f"{'=' * 50}")