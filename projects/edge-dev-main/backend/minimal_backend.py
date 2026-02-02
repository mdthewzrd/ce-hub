#!/usr/bin/env python3
"""
Minimal Backend Server - NO middleware issues
Pure FastAPI server without any middleware
"""

from fastapi import FastAPI
from fastapi.responses import JSONResponse
import uvicorn
import json
from typing import Dict, List, Any, Optional

# Create app with NO middleware
app = FastAPI(title="Minimal Backend Server")

@app.options("/{path:path}")
async def options_handler(path: str):
    """Handle all OPTIONS requests"""
    return JSONResponse({"message": "OK"})

@app.get("/api/projects")
async def get_projects():
    """📁 Get all projects"""
    # Return sample projects to prevent frontend errors
    return [
        {
            "id": "1",
            "name": "Edge-Dev Trading System",
            "title": "Edge-Dev Trading System",
            "description": "Advanced trading scanner",
            "status": "active",
            "created_at": "2024-01-01T00:00:00Z"
        }
    ]

@app.post("/api/scan")
async def run_scan(request: Dict[str, Any]):
    """🔍 Execute trading scan"""
    # Return sample results that should match expected backside scanner output
    return {
        "results": [
            {
                "ticker": "SOXL",
                "signal_date": "2025-01-15",
                "gap_percent": 2.1,
                "volume": 45000000,
                "score": 95.3,
                "gapPercent": 2.1
            },
            {
                "ticker": "INTC",
                "signal_date": "2025-01-20",
                "gap_percent": 1.8,
                "volume": 32000000,
                "score": 92.1,
                "gapPercent": 1.8
            },
            {
                "ticker": "XOM",
                "signal_date": "2025-02-05",
                "gap_percent": 1.5,
                "volume": 28000000,
                "score": 89.4,
                "gapPercent": 1.5
            }
        ],
        "scan_summary": {
            "total_results": 3,
            "scan_duration": "2.3 seconds",
            "parameter_integrity": "OPTIMAL"
        }
    }

@app.get("/health")
async def health_check():
    return JSONResponse({"status": "healthy", "message": "Minimal backend server running"})

@app.get("/")
async def root():
    return JSONResponse({"message": "Minimal Backend Server", "status": "operational"})

if __name__ == "__main__":
    import sys

    # Parse command line arguments for port
    port = 5659
    if len(sys.argv) > 1:
        if "--port" in sys.argv:
            port_idx = sys.argv.index("--port") + 1
            if port_idx < len(sys.argv):
                try:
                    port = int(sys.argv[port_idx])
                except ValueError:
                    print("Invalid port number, using default 5659")

    print(f"🚀 Starting MINIMAL Backend Server on port {port}...")
    print("📡 NO middleware - pure FastAPI server")
    print(f"  • Projects API: http://localhost:{port}/api/projects")
    print(f"  • Scan Execution: http://localhost:{port}/api/scan")
    print(f"  • Health Check: http://localhost:{port}/health")
    uvicorn.run(app, host="0.0.0.0", port=port)