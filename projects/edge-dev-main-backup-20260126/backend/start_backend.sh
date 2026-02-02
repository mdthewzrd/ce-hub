#!/bin/bash
# Startup script for backend with RENATA_V2 integration

# Change to backend directory
cd "$(dirname "$0")"

# Load environment variables from .env file
if [ -f .env ]; then
    export $(grep -v '^#' .env | xargs)
    echo "✅ Loaded environment variables from .env"
else
    echo "⚠️  .env file not found"
fi

# Start uvicorn with reload
echo "🚀 Starting backend server on port 5666..."
python3 -m uvicorn main:app --host 0.0.0.0 --port 5666 --reload
