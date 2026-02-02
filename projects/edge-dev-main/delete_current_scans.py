#!/usr/bin/env python3
"""
Delete all current saved scans programmatically
"""
import requests
import json

print("=== DELETING ALL CURRENT SAVED SCANS ===")

# First, get all current scan IDs
print("\n=== FETCHING CURRENT SCANS ===")
current_scan_ids = []
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            scans = data['data']
            current_scan_ids = [scan['id'] for scan in scans]
            print(f"Found {len(current_scan_ids)} scans to delete:")
            for scan in scans:
                print(f"  - {scan['id']}: {scan.get('name', 'Unknown')}")
        else:
            print("No scans found")
            exit(0)
    else:
        print(f"API returned status {response.status_code}")
        exit(1)
except Exception as e:
    print(f"Error fetching scans: {e}")
    exit(1)

# Delete each current scan
successful_deletions = 0
failed_deletions = []

for i, scan_id in enumerate(current_scan_ids, 1):
    print(f"\n[{i}/{len(current_scan_ids)}] Deleting scan {scan_id}...")
    try:
        response = requests.delete(f'http://localhost:5665/api/projects?id={scan_id}')
        print(f"Delete response status: {response.status_code}")

        if response.status_code == 200:
            data = response.json()
            if data.get('success'):
                print(f"✅ Successfully deleted: {data.get('data', {}).get('name', 'Unknown')}")
                successful_deletions += 1
            else:
                print(f"❌ Delete failed: {data.get('message', 'Unknown error')}")
                failed_deletions.append(scan_id)
        else:
            print(f"❌ Delete failed with status {response.status_code}")
            try:
                error_data = response.json()
                print(f"Error: {error_data.get('message', 'Unknown error')}")
            except:
                print(f"Error response: {response.text}")
            failed_deletions.append(scan_id)

    except Exception as e:
        print(f"❌ Error deleting scan {scan_id}: {e}")
        failed_deletions.append(scan_id)

# Verify final state
print(f"\n=== VERIFICATION: SCANS AFTER DELETION ===")
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            scans = data['data']
            print(f"Found {len(scans)} scans remaining:")
            for scan in scans:
                print(f"  - {scan['id']}: {scan.get('name', 'Unknown')}")
        else:
            print("🎉 No scans found - ALL DELETED SUCCESSFULLY!")
    else:
        print(f"API returned status {response.status_code}")
except Exception as e:
    print(f"Error verifying final state: {e}")

# Summary
print(f"\n=== DELETION SUMMARY ===")
print(f"✅ Successful deletions: {successful_deletions}/{len(current_scan_ids)}")
print(f"❌ Failed deletions: {len(failed_deletions)}")

if failed_deletions:
    print(f"Failed scan IDs: {failed_deletions}")
else:
    print("🎉 All scans deleted successfully!")