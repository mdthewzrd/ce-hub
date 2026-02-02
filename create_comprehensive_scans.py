#!/usr/bin/env python3
"""
Create Comprehensive Saved Scans for Testing
=============================================
This script creates the 4 comprehensive saved scans that should be visible in the dropdown:
1. "NVDA Gap Up - High Volume Alert" (3 results • 12/10/2025)
2. "LC Patterns - Frontside Breakouts" (4 results • 12/9/2025)
3. "Volume Surge Detection - Unusual Activity" (5 results • 12/8/2025)
4. "Breakout Candidates - New Highs" (6 results • 12/7/2025)
"""

import json
import os
import uuid
from datetime import datetime, timedelta

def create_comprehensive_scans():
    """Create the 4 comprehensive saved scans"""

    base_dir = "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/backend/saved_scans/test_user_123"

    # Define the 4 comprehensive scans
    scans = [
        {
            "name": "NVDA Gap Up - High Volume Alert",
            "date": "2025-12-10",
            "results_count": 3,
            "scan_id": str(uuid.uuid4()),
            "description": "NVDA gap up detection with unusual volume spike",
            "scanner_type": "gap_up_volume",
            "results": [
                {
                    "ticker": "NVDA",
                    "date": "2025-12-10",
                    "gap_up_pct": 8.5,
                    "volume_ratio": 3.2,
                    "price": 145.80,
                    "volume": 125_000_000,
                    "avg_volume": 38_900_000,
                    "gap_atr": 1.8,
                    "volume_surprise": 221.3,
                    "relative_strength": 95.2
                },
                {
                    "ticker": "SMCI",
                    "date": "2025-12-10",
                    "gap_up_pct": 6.2,
                    "volume_ratio": 2.8,
                    "price": 520.40,
                    "volume": 8_900_000,
                    "avg_volume": 3_175_000,
                    "gap_atr": 1.5,
                    "volume_surprise": 180.3,
                    "relative_strength": 88.7
                },
                {
                    "ticker": "AMD",
                    "date": "2025-12-10",
                    "gap_up_pct": 4.8,
                    "volume_ratio": 2.1,
                    "price": 128.90,
                    "volume": 65_200_000,
                    "avg_volume": 31_047_619,
                    "gap_atr": 1.2,
                    "volume_surprise": 110.0,
                    "relative_strength": 76.4
                }
            ]
        },
        {
            "name": "LC Patterns - Frontside Breakouts",
            "date": "2025-12-9",
            "results_count": 4,
            "scan_id": str(uuid.uuid4()),
            "description": "Lucrative Chart patterns detecting frontside breakout formations",
            "scanner_type": "lc_frontside",
            "results": [
                {
                    "ticker": "AAPL",
                    "date": "2025-12-09",
                    "lc_strength": 92.5,
                    "breakout_confirmation": True,
                    "price": 198.35,
                    "volume_ratio": 1.8,
                    "pattern_days": 15,
                    "consolidation_range": "185-192",
                    "breakout_volume": 85_400_000,
                    "target_price": 215.00,
                    "risk_reward": 3.2
                },
                {
                    "ticker": "MSFT",
                    "date": "2025-12-09",
                    "lc_strength": 88.3,
                    "breakout_confirmation": True,
                    "price": 412.80,
                    "volume_ratio": 1.6,
                    "pattern_days": 22,
                    "consolidation_range": "395-405",
                    "breakout_volume": 32_100_000,
                    "target_price": 445.00,
                    "risk_reward": 2.8
                },
                {
                    "ticker": "GOOGL",
                    "date": "2025-12-09",
                    "lc_strength": 85.7,
                    "breakout_confirmation": False,
                    "price": 142.65,
                    "volume_ratio": 1.4,
                    "pattern_days": 18,
                    "consolidation_range": "135-140",
                    "breakout_volume": 28_300_000,
                    "target_price": 155.00,
                    "risk_reward": 2.5
                },
                {
                    "ticker": "AMZN",
                    "date": "2025-12-09",
                    "lc_strength": 81.2,
                    "breakout_confirmation": True,
                    "price": 178.90,
                    "volume_ratio": 1.9,
                    "pattern_days": 12,
                    "consolidation_range": "170-175",
                    "breakout_volume": 52_700_000,
                    "target_price": 195.00,
                    "risk_reward": 2.9
                }
            ]
        },
        {
            "name": "Volume Surge Detection - Unusual Activity",
            "date": "2025-12-8",
            "results_count": 5,
            "scan_id": str(uuid.uuid4()),
            "description": "Unusual volume surge detection algorithm finding abnormal trading activity",
            "scanner_type": "volume_surge",
            "results": [
                {
                    "ticker": "TSLA",
                    "date": "2025-12-08",
                    "volume_ratio": 4.8,
                    "price_change": 12.3,
                    "price": 248.65,
                    "volume": 182_000_000,
                    "avg_volume": 37_916_667,
                    "volume_z_score": 4.2,
                    "price_impact": 0.15,
                    "institutional_score": 89.5
                },
                {
                    "ticker": "COIN",
                    "date": "2025-12-08",
                    "volume_ratio": 6.2,
                    "price_change": -8.7,
                    "price": 125.40,
                    "volume": 45_800_000,
                    "avg_volume": 7_387_097,
                    "volume_z_score": 5.1,
                    "price_impact": -0.22,
                    "institutional_score": 92.1
                },
                {
                    "ticker": "RIVN",
                    "date": "2025-12-08",
                    "volume_ratio": 3.5,
                    "price_change": 15.8,
                    "price": 16.85,
                    "volume": 98_500_000,
                    "avg_volume": 28_142_857,
                    "volume_z_score": 3.7,
                    "price_impact": 0.18,
                    "institutional_score": 78.3
                },
                {
                    "ticker": "PLTR",
                    "date": "2025-12-08",
                    "volume_ratio": 2.9,
                    "price_change": 9.4,
                    "price": 28.45,
                    "volume": 112_300_000,
                    "avg_volume": 38_724_138,
                    "volume_z_score": 2.8,
                    "price_impact": 0.12,
                    "institutional_score": 74.6
                },
                {
                    "ticker": "MARA",
                    "date": "2025-12-08",
                    "volume_ratio": 5.1,
                    "price_change": -11.2,
                    "price": 18.95,
                    "volume": 156_800_000,
                    "avg_volume": 30_745_098,
                    "volume_z_score": 4.8,
                    "price_impact": -0.25,
                    "institutional_score": 87.9
                }
            ]
        },
        {
            "name": "Breakout Candidates - New Highs",
            "date": "2025-12-7",
            "results_count": 6,
            "scan_id": str(uuid.uuid4()),
            "description": "Stocks breaking out to new 52-week highs with momentum confirmation",
            "scanner_type": "new_highs",
            "results": [
                {
                    "ticker": "NVDA",
                    "date": "2025-12-07",
                    "new_high_type": "52_week",
                    "momentum_score": 94.7,
                    "price": 142.30,
                    "volume_ratio": 2.1,
                    "rsi_14": 68.5,
                    "macd_signal": "bullish",
                    "volume_confirmation": True,
                    "sector_strength": "Technology",
                    "relative_strength": 91.3
                },
                {
                    "ticker": "SMCI",
                    "date": "2025-12-07",
                    "new_high_type": "52_week",
                    "momentum_score": 91.2,
                    "price": 485.60,
                    "volume_ratio": 1.8,
                    "rsi_14": 72.1,
                    "macd_signal": "bullish",
                    "volume_confirmation": True,
                    "sector_strength": "Technology",
                    "relative_strength": 88.9
                },
                {
                    "ticker": "META",
                    "date": "2025-12-07",
                    "new_high_type": "52_week",
                    "momentum_score": 88.6,
                    "price": 542.80,
                    "volume_ratio": 1.5,
                    "rsi_14": 65.3,
                    "macd_signal": "bullish",
                    "volume_confirmation": False,
                    "sector_strength": "Technology",
                    "relative_strength": 85.2
                },
                {
                    "ticker": "LLY",
                    "date": "2025-12-07",
                    "new_high_type": "52_week",
                    "momentum_score": 86.3,
                    "price": 745.20,
                    "volume_ratio": 1.7,
                    "rsi_14": 69.8,
                    "macd_signal": "bullish",
                    "volume_confirmation": True,
                    "sector_strength": "Healthcare",
                    "relative_strength": 82.7
                },
                {
                    "ticker": "AVGO",
                    "date": "2025-12-07",
                    "new_high_type": "52_week",
                    "momentum_score": 84.9,
                    "price": 178.50,
                    "volume_ratio": 1.4,
                    "rsi_14": 71.2,
                    "macd_signal": "bullish",
                    "volume_confirmation": False,
                    "sector_strength": "Technology",
                    "relative_strength": 79.4
                },
                {
                    "ticker": "UNH",
                    "date": "2025-12-07",
                    "new_high_type": "52_week",
                    "momentum_score": 81.5,
                    "price": 585.40,
                    "volume_ratio": 1.6,
                    "rsi_14": 67.4,
                    "macd_signal": "bullish",
                    "volume_confirmation": True,
                    "sector_strength": "Healthcare",
                    "relative_strength": 76.8
                }
            ]
        }
    ]

    # Create scan files and update index
    scan_entries = []

    # Keep existing test scan
    existing_scan = {
        "scan_id": "2d7cf136-23c4-44a1-b73a-8278c80c5c9c",
        "scan_name": "Test LC Scan",
        "scanner_type": "lc",
        "timestamp": "2025-10-31T18:34:52.739427",
        "results_count": 3
    }
    scan_entries.append(existing_scan)

    # Add new comprehensive scans
    for scan in scans:
        scan_data = {
            "scan_id": scan["scan_id"],
            "scan_name": scan["name"],
            "scanner_type": scan["scanner_type"],
            "timestamp": f"{scan['date']}T12:00:00.000000",
            "results_count": scan["results_count"],
            "user_id": "test_user_123",
            "metadata": {
                "scan_type": scan["scanner_type"],
                "description": scan["description"],
                "date_range": "90 days",
                "total_symbols": 6000,
                "creation_date": scan["date"]
            },
            "results": scan["results"]
        }

        # Save individual scan file
        scan_file = os.path.join(base_dir, f"{scan['scan_id']}.json")
        with open(scan_file, 'w') as f:
            json.dump(scan_data, f, indent=2)

        print(f"✅ Created scan: {scan['name']} ({scan['results_count']} results)")

        # Add to index
        scan_entries.append({
            "scan_id": scan["scan_id"],
            "scan_name": scan["name"],
            "scanner_type": scan["scanner_type"],
            "timestamp": f"{scan['date']}T12:00:00.000000",
            "results_count": scan["results_count"]
        })

    # Update scan index
    scan_index = {
        "user_id": "test_user_123",
        "scans": scan_entries
    }

    index_file = os.path.join(base_dir, "scan_index.json")
    with open(index_file, 'w') as f:
        json.dump(scan_index, f, indent=2)

    print(f"\n🎯 COMPREHENSIVE SCANS CREATION COMPLETE!")
    print(f"   📁 Total scans: {len(scan_entries)}")
    print(f"   🔧 Updated scan index: {index_file}")
    print(f"   📊 Scan breakdown:")

    for entry in scan_entries:
        print(f"      • {entry['scan_name']} ({entry['results_count']} results)")

if __name__ == "__main__":
    create_comprehensive_scans()