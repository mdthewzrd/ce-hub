#!/usr/bin/env python3
"""
Clear all projects from all storage locations
"""
import requests
import json
import os
import time

print("=== CLEARING ALL PROJECTS ===")

# 1. Clear from API
print("\n1. Clearing from API...")
try:
    # First get all projects
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            projects = data['data']
            print(f"   Found {len(projects)} projects in API:")

            for project in projects:
                project_id = project['id']
                project_name = project.get('name', 'Unknown')
                created = project.get('createdAt', 'Unknown')
                print(f"   - {project_id}: {project_name} (created: {created})")

            # Delete all projects
            for project in projects:
                try:
                    delete_response = requests.delete(f"http://localhost:5665/api/projects?id={project['id']}")
                    if delete_response.status_code == 200:
                        print(f"   ✅ Deleted: {project['name']}")
                    else:
                        print(f"   ❌ Failed to delete: {project['name']} (status: {delete_response.status})")
                except Exception as e:
                    print(f"   ❌ Error deleting {project['name']}: {e}")
        else:
            print("   No projects found in API")
    else:
        print(f"   API error: {response.status_code}")
except Exception as e:
    print(f"   Error accessing API: {e}")

# 2. Clear from localStorage files (if they exist)
print("\n2. Clearing localStorage files...")
localStorage_files = [
    "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/projects.json",
]

for file_path in localStorage_files:
    if os.path.exists(file_path):
        try:
            with open(file_path, 'r') as f:
                data = json.load(f)
            print(f"   📁 Found {file_path}: {len(data)} projects")

            # Backup the file
            backup_path = f"{file_path}.backup_{int(time.time())}"
            with open(backup_path, 'w') as f:
                json.dump(data, f, indent=2)
            print(f"   💾 Backed up to: {backup_path}")

            # Clear the file
            with open(file_path, 'w') as f:
                json.dump([], f)
            print(f"   ✅ Cleared: {file_path}")

        except Exception as e:
            print(f"   ❌ Error with {file_path}: {e}")
    else:
        print(f"   📁 Not found: {file_path}")

# 3. Verify everything is cleared
print("\n3. Verifying all projects are cleared...")
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success'):
            remaining = len(data.get('data', []))
            if remaining == 0:
                print("   ✅ API: No projects remaining")
            else:
                print(f"   ⚠️  API: {remaining} projects still remaining")
        else:
            print("   ⚠️  API response indicates error")
    else:
        print(f"   ❌ API error: {response.status_code}")
except Exception as e:
    print(f"   ❌ Error verifying API: {e}")

print(f"\n=== CLEARING COMPLETE ===")
print(f"You can now upload fresh backside B scanners through Renata!")
print(f"The old vs new distinction is now irrelevant - everything is cleared.")