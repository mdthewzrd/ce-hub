#!/usr/bin/env python3
"""
Startup script for LC Scanner FastAPI Backend
Handles environment setup and server initialization
"""

import os
import sys
import logging
import uvicorn
from pathlib import Path

# Add the backend directory to Python path
backend_dir = Path(__file__).parent
sys.path.insert(0, str(backend_dir))

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
    handlers=[
        logging.StreamHandler(),
        logging.FileHandler('scanner_backend.log')
    ]
)

logger = logging.getLogger(__name__)

def check_environment():
    """Check that all required environment variables and dependencies are available"""

    # Check for Polygon API key
    api_key = os.getenv('POLYGON_API_KEY')
    if not api_key:
        logger.warning("POLYGON_API_KEY not found in environment. Using default from scanner.py")

    # Check Python version
    if sys.version_info < (3, 8):
        logger.error("Python 3.8 or higher is required")
        sys.exit(1)

    # Check critical imports
    try:
        import fastapi
        import uvicorn
        import pandas
        import aiohttp
        logger.info("All critical dependencies are available")
    except ImportError as e:
        logger.error(f"Missing critical dependency: {e}")
        logger.error("Please run: pip install -r requirements.txt")
        sys.exit(1)

def main():
    """Main startup function"""
    logger.info("Starting LC Scanner FastAPI Backend...")

    # Check environment
    check_environment()

    # Set environment variables if not set
    if not os.getenv('SCANNER_RESULTS_DIR'):
        os.environ['SCANNER_RESULTS_DIR'] = str(backend_dir / 'scan_results')

    # Get configuration from environment
    host = os.getenv('SCANNER_HOST', '0.0.0.0')
    port = int(os.getenv('SCANNER_PORT', 8000))
    workers = int(os.getenv('SCANNER_WORKERS', 1))
    reload = os.getenv('SCANNER_RELOAD', 'true').lower() == 'true'
    log_level = os.getenv('SCANNER_LOG_LEVEL', 'info').lower()

    logger.info(f"Starting server on {host}:{port}")
    logger.info(f"Workers: {workers}, Reload: {reload}, Log Level: {log_level}")

    # Start the server
    uvicorn.run(
        "main:app",
        host=host,
        port=port,
        workers=workers if not reload else 1,  # Reload mode requires workers=1
        reload=reload,
        log_level=log_level,
        access_log=True,
        loop="auto"
    )

if __name__ == "__main__":
    main()