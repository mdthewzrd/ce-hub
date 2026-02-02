#!/usr/bin/env python3
"""
Edge.dev Backend Server Launcher
Starts the FastAPI backend on the correct port for the frontend system
"""

import sys
import uvicorn

# Default port for Edge.dev system
port = 5659

# Parse command line arguments for port
if len(sys.argv) > 1:
    if "--port" in sys.argv:
        port_idx = sys.argv.index("--port") + 1
        if port_idx < len(sys.argv):
            try:
                port = int(sys.argv[port_idx])
            except ValueError:
                print("Invalid port number, using default 5659")
    elif len(sys.argv) > 1 and sys.argv[1].isdigit():
        try:
            port = int(sys.argv[1])
        except ValueError:
            print("Invalid port number, using default 5659")

print(f"🚀 Starting Edge.dev Backend Server on port {port}")

# Import the app after port configuration
from main import app

# Start the server with the correct port
uvicorn.run(app, host="0.0.0.0", port=port, reload=False)
