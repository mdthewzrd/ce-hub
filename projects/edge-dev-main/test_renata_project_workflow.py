#!/usr/bin/env python3
"""
Test Script: End-to-End Renata → Project Creation → Project Display Workflow

This script tests the complete workflow where:
1. User adds scanner code via Renata chat
2. Renata chat calls the projects API to create a project
3. Project is saved to persistent storage
4. Projects page loads and displays the new project
"""

import requests
import json
import time
from datetime import datetime

# Configuration
BASE_URL = "http://localhost:5665"
API_BASE = f"{BASE_URL}/api"

def test_health_check():
    """Test if the server is running"""
    print("🔍 Testing server health...")
    try:
        response = requests.get(f"{BASE_URL}", timeout=5)
        if response.status_code == 200:
            print("✅ Server is running")
            return True
        else:
            print(f"❌ Server returned status {response.status_code}")
            return False
    except Exception as e:
        print(f"❌ Server connection failed: {e}")
        return False

def test_get_projects_initial():
    """Get initial count of projects"""
    print("\n📊 Getting initial project count...")
    try:
        response = requests.get(f"{API_BASE}/projects", timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('success'):
            initial_count = len(data.get('data', []))
            print(f"✅ Initial projects count: {initial_count}")
            return data.get('data', []), initial_count
        else:
            print("❌ Failed to get projects")
            return [], 0
    except Exception as e:
        print(f"❌ Error getting projects: {e}")
        return [], 0

def test_create_project_via_renata():
    """Simulate Renata chat creating a project"""
    print("\n🚀 Simulating Renata chat project creation...")

    # Sample scanner code that might come from Renata
    scanner_code = '''#!/usr/bin/env python3
"""
Sample Trading Scanner from Renata Chat
"""
import pandas as pd
import numpy as np

def scan_symbol(symbol, start_date, end_date):
    """
    Scan a symbol for trading signals
    """
    # Sample scanner logic
    print(f"Scanning {symbol} from {start_date} to {end_date}")

    # Return sample results
    return pd.DataFrame({
        'Ticker': [symbol],
        'Date': [datetime.now().strftime('%Y-%m-%d')],
        'Signal': ['BUY'],
        'Strength': [0.85]
    })

if __name__ == "__main__":
    results = scan_symbol("AAPL", "2025-01-01", "2025-01-31")
    print(results)
'''

    project_data = {
        "code": scanner_code,
        "name": "Renata Sample Scanner",
        "description": "Sample trading scanner created via Renata chat workflow test",
        "language": "python",
        "tags": ["renata", "test", "scanner", "trading", "sample"]
    }

    try:
        response = requests.post(
            f"{API_BASE}/projects",
            json=project_data,
            headers={'Content-Type': 'application/json'},
            timeout=10
        )
        response.raise_for_status()

        result = response.json()
        if result.get('success'):
            print(f"✅ Project created successfully: {result.get('message')}")
            print(f"   Project ID: {result['project']['id']}")
            print(f"   Project Name: {result['project']['name']}")
            print(f"   Total Projects: {result.get('totalProjects')}")
            return result['project']
        else:
            print(f"❌ Project creation failed: {result}")
            return None

    except Exception as e:
        print(f"❌ Error creating project: {e}")
        return None

def test_get_projects_after_creation(expected_count):
    """Verify the new project appears in the projects list"""
    print(f"\n📋 Verifying project appears in list (expecting {expected_count} projects)...")

    # Allow a brief moment for persistence
    time.sleep(1)

    try:
        response = requests.get(f"{API_BASE}/projects", timeout=10)
        response.raise_for_status()
        data = response.json()

        if data.get('success'):
            projects = data.get('data', [])
            actual_count = len(projects)
            print(f"✅ Projects count after creation: {actual_count}")

            if actual_count == expected_count:
                print("✅ Project count matches expectation")
            else:
                print(f"⚠️ Project count mismatch. Expected: {expected_count}, Got: {actual_count}")

            # Find our new project
            new_project = None
            for project in projects:
                if project.get('name') == 'Renata Sample Scanner':
                    new_project = project
                    break

            if new_project:
                print("✅ New project found in list:")
                print(f"   - ID: {new_project.get('id')}")
                print(f"   - Name: {new_project.get('name')}")
                print(f"   - Type: {new_project.get('type')}")
                print(f"   - Enhanced: {new_project.get('enhanced')}")
                print(f"   - Created: {new_project.get('createdAt')}")
                print(f"   - Code Length: {len(new_project.get('code', ''))} chars")
                return True
            else:
                print("❌ New project not found in list")
                return False
        else:
            print("❌ Failed to get projects after creation")
            return False

    except Exception as e:
        print(f"❌ Error getting projects after creation: {e}")
        return False

def test_project_persistence():
    """Test that projects persist (check storage file)"""
    print("\n💾 Testing project persistence...")

    try:
        # Check the projects.json file
        projects_file = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/data/projects.json"
        with open(projects_file, 'r') as f:
            data = json.load(f)

        projects = data.get('data', [])
        print(f"✅ Projects file contains {len(projects)} projects")

        # Find our test project
        test_project = None
        for project in projects:
            if project.get('name') == 'Renata Sample Scanner':
                test_project = project
                break

        if test_project:
            print("✅ Test project found in persistent storage:")
            print(f"   - File Name: {projects_file}")
            print(f"   - Project ID: {test_project.get('id')}")
            print(f"   - Last Updated: {test_project.get('updatedAt')}")
            return True
        else:
            print("❌ Test project not found in persistent storage")
            return False

    except Exception as e:
        print(f"❌ Error checking persistence: {e}")
        return False

def main():
    """Run the complete end-to-end test"""
    print("=" * 60)
    print("🧪 RENATA PROJECT CREATION WORKFLOW TEST")
    print("=" * 60)

    # Test 1: Health Check
    if not test_health_check():
        print("\n❌ Server health check failed. Aborting test.")
        return False

    # Test 2: Get Initial Projects
    initial_projects, initial_count = test_get_projects_initial()

    # Test 3: Create Project via Renata
    new_project = test_create_project_via_renata()
    if not new_project:
        print("\n❌ Project creation failed. Aborting test.")
        return False

    expected_count = initial_count + 1

    # Test 4: Verify Project in List
    if not test_get_projects_after_creation(expected_count):
        print("\n❌ Project verification failed.")
        return False

    # Test 5: Test Persistence
    if not test_project_persistence():
        print("\n❌ Persistence test failed.")
        return False

    # Success!
    print("\n" + "=" * 60)
    print("🎉 ALL TESTS PASSED!")
    print("=" * 60)
    print("\n📋 SUMMARY:")
    print(f"   ✅ Server is running on {BASE_URL}")
    print(f"   ✅ Initial projects: {initial_count}")
    print(f"   ✅ Project created via Renata API")
    print(f"   ✅ Project appears in Projects list")
    print(f"   ✅ Project persisted to storage")
    print(f"   ✅ Total projects now: {expected_count}")
    print("\n🚀 The Renata → Project Creation → Project Display workflow is working correctly!")

    return True

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)