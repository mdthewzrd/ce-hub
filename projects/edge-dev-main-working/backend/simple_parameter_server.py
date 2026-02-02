#!/usr/bin/env python3
"""
Minimal parameter preview server - no middleware issues
"""

from fastapi import FastAPI
import uvicorn
import json

app = FastAPI(title="Simple Parameter Preview Server")

@app.get("/api/scan/parameters/preview")
async def get_scan_parameters_preview():
    """
    📊 Get current scan parameter configuration for preview and validation
    """
    # Static parameter data showing integrity issues
    P = {
        "price_min": 3.0,  # RELAXED from 8.0
        "gap_div_atr_min": 0.3,  # RELAXED from 0.75
        "d1_volume_min": 1000000,  # RELAXED from 15M
        "require_open_gt_prev_high": False,  # RELAXED from True
    }

    # Calculate parameter impact and provide interpretations
    parameter_analysis = {
        "current_parameters": P,
        "parameter_interpretations": {
            "price_min": {
                "value": P.get("price_min", "N/A"),
                "current_status": "RELAXED" if P.get("price_min", 8.0) < 8.0 else "STANDARD",
                "recommended": 8.0,
                "impact": "Higher price filter reduces penny stock noise"
            },
            "gap_div_atr_min": {
                "value": P.get("gap_div_atr_min", "N/A"),
                "current_status": "RELAXED" if P.get("gap_div_atr_min", 0.75) < 0.75 else "STANDARD",
                "recommended": 0.75,
                "impact": "Ensures significant gap relative to volatility"
            },
            "d1_volume_min": {
                "value": P.get("d1_volume_min", "N/A"),
                "current_status": "RELAXED" if P.get("d1_volume_min", 15000000) < 15000000 else "STANDARD",
                "recommended": 15000000,
                "impact": "Higher volume ensures liquidity and institutional interest"
            },
            "require_open_gt_prev_high": {
                "value": P.get("require_open_gt_prev_high", "N/A"),
                "current_status": "RELAXED" if not P.get("require_open_gt_prev_high", True) else "STANDARD",
                "recommended": True,
                "impact": "Ensures true gap-up behavior"
            }
        },
        "estimated_results": {
            "current_count": "200-240 (EXCESSIVE)",
            "recommended_count": "8-12 (OPTIMAL)",
            "quality_level": "COMPROMISED",
            "risk_assessment": "PARAMETER INTEGRITY COMPROMISED - Too many low-quality matches",
            "description": "Current parameters allow too many low-quality matches. Restore quality filters for optimal results."
        },
        "recommendations": {
            "action": "RESTORE_QUALITY_PARAMETERS",
            "changes_needed": [
                "Increase price_min from 3.0 to 8.0",
                "Increase gap_div_atr_min from 0.3 to 0.75",
                "Increase d1_volume_min from 1,000,000 to 15,000,000",
                "Set require_open_gt_prev_high to True (currently False)"
            ]
        }
    }

    return parameter_analysis

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Simple parameter preview server running"}

if __name__ == "__main__":
    print("🚀 Starting Simple Parameter Preview Server on port 8002...")
    uvicorn.run(app, host="0.0.0.0", port=8002)