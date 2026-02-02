#!/usr/bin/env python3
"""
Quick test server for parameter preview functionality
Bypasses all middleware issues to test the core functionality
"""

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
import uvicorn

app = FastAPI(title="Parameter Preview Test Server")

# Simple CORS setup
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/api/scan/parameters/preview")
async def get_scan_parameters_preview():
    """
    📊 Get current scan parameter configuration for preview and validation
    """
    try:
        # Use static parameter data for testing (showing parameter integrity issues)
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
                "quality_level": "COMPROMISED" if any([
                    P.get("price_min", 8.0) < 8.0,
                    P.get("gap_div_atr_min", 0.75) < 0.75,
                    P.get("d1_volume_min", 15000000) < 15000000,
                    not P.get("require_open_gt_prev_high", True)
                ]) else "INSTITUTIONAL_GRADE",
                "risk_assessment": "PARAMETER INTEGRITY COMPROMISED - Too many low-quality matches" if any([
                    P.get("price_min", 8.0) < 8.0,
                    P.get("gap_div_atr_min", 0.75) < 0.75,
                    P.get("d1_volume_min", 15000000) < 15000000,
                    not P.get("require_open_gt_prev_high", True)
                ]) else "PARAMETERS OPTIMIZED FOR QUALITY",
                "description": "Current parameters allow too many low-quality matches. Restore quality filters for optimal results."
            },
            "recommendations": {
                "action": "RESTORE_QUALITY_PARAMETERS",
                "changes_needed": [
                    "Increase price_min from {} to 8.0".format(P.get("price_min", "N/A")),
                    "Increase gap_div_atr_min from {} to 0.75".format(P.get("gap_div_atr_min", "N/A")),
                    "Increase d1_volume_min from {} to 15,000,000".format(P.get("d1_volume_min", "N/A")),
                    "Set require_open_gt_prev_high to True (currently {})".format(P.get("require_open_gt_prev_high", "N/A"))
                ]
            }
        }

        return parameter_analysis

    except Exception as e:
        return {
            "error": f"Unable to fetch parameter data: {str(e)}",
            "current_parameters": {},
            "parameter_interpretations": {},
            "estimated_results": {
                "risk_assessment": "Unable to analyze parameters - check scanner configuration"
            }
        }

@app.get("/health")
async def health_check():
    return {"status": "healthy", "message": "Parameter preview server running"}

if __name__ == "__main__":
    print("🚀 Starting Parameter Preview Test Server on port 8001...")
    uvicorn.run(app, host="0.0.0.0", port=8001)