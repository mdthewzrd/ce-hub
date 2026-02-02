#!/usr/bin/env/python3
"""
Test deletion of actual existing scan
"""
import requests
import json

# Use one of the actual scan IDs from the debug output
scan_id_to_delete = "4"  # "Test Project Debug"

print(f"=== TESTING DELETION OF EXISTING SCAN {scan_id_to_delete} ===")
try:
    response = requests.delete(f'http://localhost:5665/api/projects?id={scan_id_to_delete}')
    print(f"Delete response status: {response.status_code}")

    if response.status_code == 200:
        data = response.json()
        print(f"✅ Delete successful!")
        print(f"Deleted scan: {data.get('data', {}).get('name', 'Unknown')}")
    else:
        print(f"❌ Delete failed with status {response.status_code}")
        try:
            error_data = response.json()
            print(f"Error: {error_data.get('message', 'Unknown error')}")
        except:
            print(f"Error response: {response.text}")
except Exception as e:
    print(f"Error deleting scan: {e}")

# Verify the scan is actually deleted
print(f"\n=== VERIFYING SCAN {scan_id_to_delete} IS DELETED ===")
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            scans = data['data']
            deleted_scan = next((scan for scan in scans if scan['id'] == scan_id_to_delete), None)

            if deleted_scan:
                print(f"❌ Scan {scan_id_to_delete} still exists: {deleted_scan.get('name', 'Unknown')}")
            else:
                print(f"✅ Scan {scan_id_to_delete} successfully deleted from persistent storage")

            print(f"Total scans remaining: {len(scans)}")
        else:
            print("No scans found")
    else:
        print(f"API returned status {response.status_code}")
except Exception as e:
    print(f"Error verifying deletion: {e}")