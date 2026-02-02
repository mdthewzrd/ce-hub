#!/usr/bin/env python3
"""
Traderra Backend Server Startup Script
"""

import sys
import os

# Add current directory to path
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from app.main import app
import uvicorn

if __name__ == "__main__":
    uvicorn.run(
        "app.main:app",
        host="0.0.0.0",
        port=6500,
        reload=True,
        log_level="info"
    )