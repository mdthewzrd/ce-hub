#!/bin/bash
# Renata Rebuild API Startup Script

echo "🚀 Starting Renata Rebuild API Service..."

# Get the directory where this script is located
SCRIPT_DIR="$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )"
cd "$SCRIPT_DIR"

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "⚡ Activating virtual environment..."
source venv/bin/activate

# Install dependencies
echo "📥 Installing dependencies..."
pip install -q fastapi uvicorn pydantic pandas numpy

# Start the API server
echo "🌟 Starting Renata Rebuild API on http://127.0.0.1:8052"
echo "📚 API Documentation: http://127.0.0.1:8052/docs"
echo ""
echo "Press Ctrl+C to stop the server"
echo ""

cd renata_rebuild
python api_service.py
