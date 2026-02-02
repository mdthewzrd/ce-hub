#!/usr/bin/env python3
"""
Test that scan deletion is now working properly
"""
import requests
import json

# First, let's see what scans currently exist
print("=== CURRENT SCANS ===")
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            scans = data['data']
            print(f"Found {len(scans)} scans:")
            for scan in scans[:5]:  # Show first 5
                print(f"  - {scan['id']}: {scan.get('name', 'Unknown')}")
        else:
            print("No scans found or API error")
    else:
        print(f"API returned status {response.status_code}")
except Exception as e:
    print(f"Error fetching scans: {e}")

# Test deletion of a scan (using the ID from the user's screenshot)
scan_id_to_delete = "1765151082718"  # This should be the "backside para b copy Scanner"

print(f"\n=== TESTING DELETION OF SCAN {scan_id_to_delete} ===")
try:
    response = requests.delete(f'http://localhost:5665/api/projects?id={scan_id_to_delete}')
    print(f"Delete response status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"Delete response: {json.dumps(data, indent=2)}")
        print("✅ Scan deletion successful!")
    else:
        print(f"❌ Delete failed with status {response.status_code}")
        try:
            print(f"Error response: {response.text}")
        except:
            pass
except Exception as e:
    print(f"Error deleting scan: {e}")

# Check what scans remain after deletion
print("\n=== SCANS AFTER DELETION ===")
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            scans = data['data']
            print(f"Found {len(scans)} scans after deletion:")
            for scan in scans[:5]:  # Show first 5
                print(f"  - {scan['id']}: {scan.get('name', 'Unknown')}")

            # Check if the deleted scan is still there
            deleted_still_exists = any(scan['id'] == scan_id_to_delete for scan in scans)
            if deleted_still_exists:
                print(f"❌ Scan {scan_id_to_delete} still exists after deletion!")
            else:
                print(f"✅ Scan {scan_id_to_delete} successfully removed")
        else:
            print("No scans found or API error")
    else:
        print(f"API returned status {response.status_code}")
except Exception as e:
    print(f"Error fetching scans after deletion: {e}")