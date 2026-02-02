#!/usr/bin/env python3
"""
Update the platform scanner with the proven working configuration
"""

import json
import os

def update_projects_json():
    # Read the current projects.json
    data_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/data/projects.json'

    with open(data_file, 'r') as f:
        projects_data = json.load(f)

    # Read the proven scanner code
    scanner_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/proven_backside_scanner.py'

    with open(scanner_file, 'r') as f:
        scanner_code = f.read()

    # Update the scanner code in the projects data
    projects_data['data'][0]['code'] = scanner_code
    projects_data['data'][0]['description'] = "PROVEN Backside B Scanner - Exact copy of working local version with 106 symbols that produce results"

    # Save the updated projects.json
    with open(data_file, 'w') as f:
        json.dump(projects_data, f, indent=2)

    print(f"✅ Updated scanner with proven working configuration")
    print(f"📊 Scanner now uses {len([s for s in projects_data['data'][0]['code'].split('SYMBOLS = [')[1].split(']')[0].strip().split(',')])} proven symbols")
    print(f"🎯 This should now find the same patterns as your local terminal execution")

if __name__ == "__main__":
    update_projects_json()