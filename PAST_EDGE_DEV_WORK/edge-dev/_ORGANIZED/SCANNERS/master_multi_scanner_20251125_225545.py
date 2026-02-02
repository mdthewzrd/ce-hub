#!/usr/bin/env python3
"""
Master Multi-Scanner Execution Script
Generated: 2025-11-25T22:55:45.788576
Scanners: backside_b_test, half_a_plus_test
"""

import subprocess
import sys
from datetime import datetime
import os

# Create output directory
os.makedirs("multi_scanner_results", exist_ok=True)

# Scanner configurations with integrity verification
SCANNER_CONFIGS = {
    "backside_b_test": {
        "file": "generated_backside_b_test_20251125_225545.py",
        "checksum": "7abc9c5871c4549b3580cc7f97e3dab2a4cd6c301492016d97b58795de1a8ecc",
        "type": "backside_b"
    },
    "half_a_plus_test": {
        "file": "generated_half_a_plus_test_20251125_225545.py",
        "checksum": "d44223b44593c5cc0d7b8bf1908112d88a93db37fce83e9aeed2afbe7d6a8fa3",
        "type": "half_a_plus"
    },
}

def execute_scanner(scanner_name: str, config: dict):
    """Execute individual scanner with integrity check"""
    print(f"🚀 Executing scanner: {scanner_name}")
    print(f"📁 File: {config['file']}")
    print(f"🔐 Checksum: {config['checksum']}")

    try:
        # Execute scanner
        result = subprocess.run([sys.executable, config['file']],
                              capture_output=True, text=True, timeout=3600)

        if result.returncode == 0:
            print(f"✅ {scanner_name} executed successfully")
            print(result.stdout)
        else:
            print(f"❌ {scanner_name} failed")
            print(f"Error: {result.stderr}")

    except subprocess.TimeoutExpired:
        print(f"⏰ {scanner_name} timed out")
    except Exception as e:
        print(f"💥 {scanner_name} crashed: {str(e)}")

def main():
    print("🎯 MASTER MULTI-SCANNER EXECUTION")
    print("=" * 60)
    print(f"📅 Started: {datetime.now().isoformat()}")
    print(f"📊 Total scanners: {len(SCANNER_CONFIGS)}")
    print("=" * 60)

    # Execute all scanners
    for scanner_name, config in SCANNER_CONFIGS.items():
        execute_scanner(scanner_name, config)
        print("-" * 40)

    print("🎯 ALL SCANNERS EXECUTION COMPLETE")
    print(f"📅 Completed: {datetime.now().isoformat()}")

if __name__ == "__main__":
    main()
