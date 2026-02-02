#!/usr/bin/env python3
"""
Update the platform scanner with the proven working configuration with FULL MARKET coverage
"""

import json
import os

def update_projects_json():
    # Read the current projects.json
    data_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/data/projects.json'

    with open(data_file, 'r') as f:
        projects_data = json.load(f)

    # Read the proven full market scanner code
    scanner_file = '/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/proven_backside_scanner_full_market.py'

    with open(scanner_file, 'r') as f:
        scanner_code = f.read()

    # Update the scanner code in the projects data
    projects_data['data'][0]['code'] = scanner_code
    projects_data['data'][0]['description'] = "PROVEN Backside B Scanner - Full market coverage (NYSE + NASDAQ + ETFs) with corrected date range logic"
    projects_data['data'][0]['name'] = "Backside B Scanner - Full Market"

    # Save the updated projects.json
    with open(data_file, 'w') as f:
        json.dump(projects_data, f, indent=2)

    print(f"✅ Updated scanner with PROVEN FULL MARKET configuration")
    print(f"📊 Scanner now covers NYSE + NASDAQ + ETFs for comprehensive market scanning")
    print(f"🎯 Fixed date range logic: fetch from 2021, display 2025 results")
    print(f"🌍 This should now find patterns across the entire market like your local version")

if __name__ == "__main__":
    update_projects_json()