#!/usr/bin/env python3
"""
Delete all 16 saved scans programmatically
"""
import requests
import json

# All 16 scan IDs that need to be deleted (from the debug output)
scan_ids_to_delete = [
    "1765151082718",  # backside para b copy Scanner
    "1764747388897",  # Backtest
    "1764734490909",  # backside para b Scanner
    "1764734376281",  # Test Project
    "1764734341656",  # Test Project
    "1764734309212",  # Test Project
    "1764734269085",  # Test Project
    "1764734235792",  # Test Project
    "1764734201950",  # Test Project
    "1764734164235",  # Test Project
    "1764734124567",  # Test Project
    "1764734081205",  # Test Project
    "1764734032683",  # Test Project
    "1764733987063",  # Test Project
    "1764733937177",  # Test Project
    "1764733860853"   # Test Project
]

print(f"=== DELETING ALL {len(scan_ids_to_delete)} SAVED SCANS ===")

# First, let's see what scans currently exist
print("\n=== CURRENT SCANS BEFORE DELETION ===")
try:
    response = requests.get('http://localhost:5665/api/projects')
    if response.status_code == 200:
        data = response.json()
        if data.get('success') and data.get('data'):
            scans = data['data']
            print(f"Found {len(scans)} scans:")
            for scan in scans:
                print(f"  - {scan['id']}: {scan.get('name', 'Unknown')}")
        else:
            print("No scans found or API error")
    else:
        print(f"API returned status {response.status_code}")
except Exception as e:
    print(f"Error fetching scans: {e}")

# Delete each scan
successful_deletions = 0
failed_deletions = []

for i, scan_id in enumerate(scan_ids_to_delete, 1):
    print(f"\n[{i}/{len(scan_ids_to_delete)}] Deleting scan {scan_id}...")
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
            print("No scans found - SUCCESS!")
    else:
        print(f"API returned status {response.status_code}")
except Exception as e:
    print(f"Error verifying final state: {e}")

# Summary
print(f"\n=== DELETION SUMMARY ===")
print(f"✅ Successful deletions: {successful_deletions}/{len(scan_ids_to_delete)}")
print(f"❌ Failed deletions: {len(failed_deletions)}")

if failed_deletions:
    print(f"Failed scan IDs: {failed_deletions}")
else:
    print("🎉 All scans deleted successfully!")