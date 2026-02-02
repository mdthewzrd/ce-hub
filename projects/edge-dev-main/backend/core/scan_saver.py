#!/usr/bin/env python3
"""
Scan Saver System - Save and Manage User Scan Results
===================================================

Simple file-based user account system for saving scan results.
Can be upgraded to database later.

Features:
- Save scan results to user accounts
- Load saved scans by user
- Export saved scans to CSV/JSON
- Scan result metadata and timestamps
"""

import json
import os
import pandas as pd
from datetime import datetime
from typing import Dict, List, Optional, Any
from pathlib import Path
import hashlib
import uuid

class ScanSaver:
    """
    Simple file-based scan saver for user accounts
    """

    def __init__(self, base_dir: str = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/saved_scans"):
        self.base_dir = Path(base_dir)
        self.base_dir.mkdir(exist_ok=True)

    def _get_user_dir(self, user_id: str) -> Path:
        """Get or create user directory"""
        user_dir = self.base_dir / user_id
        user_dir.mkdir(exist_ok=True)
        return user_dir

    def save_scan(self, user_id: str, scan_name: str, scan_results: List[Dict],
                  scanner_type: str, metadata: Dict[str, Any] = None) -> str:
        """
        Save scan results to user account

        Args:
            user_id: User identifier
            scan_name: Name for the saved scan
            scan_results: List of scan result dictionaries
            scanner_type: Type of scanner (lc, a_plus, custom)
            metadata: Additional metadata

        Returns:
            scan_id: Unique identifier for the saved scan
        """

        user_dir = self._get_user_dir(user_id)
        scan_id = str(uuid.uuid4())

        # Create scan metadata
        scan_data = {
            'scan_id': scan_id,
            'scan_name': scan_name,
            'scanner_type': scanner_type,
            'timestamp': datetime.now().isoformat(),
            'user_id': user_id,
            'results_count': len(scan_results),
            'metadata': metadata or {},
            'results': scan_results
        }

        # Save to JSON file
        scan_file = user_dir / f"{scan_id}.json"
        with open(scan_file, 'w') as f:
            json.dump(scan_data, f, indent=2)

        # Update user scan index
        self._update_user_index(user_id, scan_id, scan_name, scanner_type, len(scan_results))

        return scan_id

    def _update_user_index(self, user_id: str, scan_id: str, scan_name: str,
                          scanner_type: str, results_count: int):
        """Update user's scan index"""
        user_dir = self._get_user_dir(user_id)
        index_file = user_dir / "scan_index.json"

        # Load existing index
        if index_file.exists():
            with open(index_file, 'r') as f:
                index = json.load(f)
        else:
            index = {'user_id': user_id, 'scans': []}

        # Add new scan to index
        scan_entry = {
            'scan_id': scan_id,
            'scan_name': scan_name,
            'scanner_type': scanner_type,
            'timestamp': datetime.now().isoformat(),
            'results_count': results_count
        }

        index['scans'].append(scan_entry)

        # Save updated index
        with open(index_file, 'w') as f:
            json.dump(index, f, indent=2)

    def get_user_scans(self, user_id: str) -> List[Dict]:
        """Get list of saved scans for user"""
        user_dir = self._get_user_dir(user_id)
        index_file = user_dir / "scan_index.json"

        if not index_file.exists():
            return []

        with open(index_file, 'r') as f:
            index = json.load(f)

        return index.get('scans', [])

    def load_scan(self, user_id: str, scan_id: str) -> Optional[Dict]:
        """Load specific scan by ID"""
        user_dir = self._get_user_dir(user_id)
        scan_file = user_dir / f"{scan_id}.json"

        if not scan_file.exists():
            return None

        with open(scan_file, 'r') as f:
            return json.load(f)

    def delete_scan(self, user_id: str, scan_id: str) -> bool:
        """Delete a saved scan"""
        user_dir = self._get_user_dir(user_id)
        scan_file = user_dir / f"{scan_id}.json"

        if not scan_file.exists():
            return False

        # Remove from index
        index_file = user_dir / "scan_index.json"
        if index_file.exists():
            with open(index_file, 'r') as f:
                index = json.load(f)

            index['scans'] = [s for s in index['scans'] if s['scan_id'] != scan_id]

            with open(index_file, 'w') as f:
                json.dump(index, f, indent=2)

        # Remove scan file
        scan_file.unlink()
        return True

    def export_scan_to_csv(self, user_id: str, scan_id: str, export_path: str = None) -> str:
        """Export scan results to CSV"""
        scan_data = self.load_scan(user_id, scan_id)
        if not scan_data:
            raise ValueError(f"Scan {scan_id} not found for user {user_id}")

        # Convert results to DataFrame
        df = pd.DataFrame(scan_data['results'])

        # Generate export path if not provided
        if not export_path:
            user_dir = self._get_user_dir(user_id)
            export_path = user_dir / f"{scan_data['scan_name']}_{scan_id[:8]}.csv"

        # Export to CSV
        df.to_csv(export_path, index=False)
        return str(export_path)

    def get_user_stats(self, user_id: str) -> Dict:
        """Get user statistics"""
        scans = self.get_user_scans(user_id)

        stats = {
            'total_scans': len(scans),
            'scanner_types': {},
            'total_results': 0,
            'latest_scan': None
        }

        for scan in scans:
            # Count by scanner type
            scanner_type = scan.get('scanner_type', 'unknown')
            stats['scanner_types'][scanner_type] = stats['scanner_types'].get(scanner_type, 0) + 1

            # Total results
            stats['total_results'] += scan.get('results_count', 0)

            # Latest scan
            if not stats['latest_scan'] or scan['timestamp'] > stats['latest_scan']['timestamp']:
                stats['latest_scan'] = scan

        return stats

# Global scan saver instance
scan_saver = ScanSaver()

def save_scan_results(user_id: str, scan_name: str, scan_results: List[Dict],
                     scanner_type: str, metadata: Dict[str, Any] = None) -> str:
    """
    Convenience function to save scan results
    """
    return scan_saver.save_scan(user_id, scan_name, scan_results, scanner_type, metadata)

def get_saved_scans(user_id: str) -> List[Dict]:
    """
    Convenience function to get saved scans
    """
    return scan_saver.get_user_scans(user_id)

def load_saved_scan(user_id: str, scan_id: str) -> Optional[Dict]:
    """
    Convenience function to load saved scan
    """
    return scan_saver.load_scan(user_id, scan_id)

if __name__ == "__main__":
    # Test the scan saver
    print("🔥 Testing Scan Saver System")
    print("=" * 40)

    # Test data
    test_user = "test_user_123"
    test_results = [
        {'ticker': 'AAPL', 'date': '2025-10-31', 'scanner_type': 'lc', 'score': 85.5},
        {'ticker': 'MSFT', 'date': '2025-10-31', 'scanner_type': 'lc', 'score': 92.1},
        {'ticker': 'GOOGL', 'date': '2025-10-31', 'scanner_type': 'lc', 'score': 78.3}
    ]

    # Save a test scan
    scan_id = save_scan_results(
        user_id=test_user,
        scan_name="Test LC Scan",
        scan_results=test_results,
        scanner_type="lc",
        metadata={'date_range': '90 days', 'total_symbols': 1000}
    )

    print(f"✅ Saved scan with ID: {scan_id}")

    # Load saved scans
    saved_scans = get_saved_scans(test_user)
    print(f"✅ User has {len(saved_scans)} saved scans")

    # Load specific scan
    loaded_scan = load_saved_scan(test_user, scan_id)
    print(f"✅ Loaded scan: {loaded_scan['scan_name']} with {len(loaded_scan['results'])} results")

    # Get user stats
    stats = scan_saver.get_user_stats(test_user)
    print(f"✅ User stats: {stats}")

    print("🎉 Scan Saver System working perfectly!")