#!/bin/bash
# LC Scanner FastAPI Backend Startup Script

set -e  # Exit on any error

echo "🚀 Starting LC Scanner FastAPI Backend..."

# Check if we're in the right directory
if [ ! -f "main.py" ]; then
    echo "❌ Error: main.py not found. Please run this script from the backend directory."
    exit 1
fi

# Check if virtual environment exists
if [ ! -d "venv" ]; then
    echo "📦 Creating virtual environment..."
    python3 -m venv venv
fi

# Activate virtual environment
echo "🔧 Activating virtual environment..."
source venv/bin/activate

# Upgrade pip
echo "⬆️ Upgrading pip..."
pip install --upgrade pip

# Install dependencies
echo "📚 Installing dependencies..."
pip install -r requirements.txt

# Set environment variables if not set
export SCANNER_HOST=${SCANNER_HOST:-"0.0.0.0"}
export SCANNER_PORT=${SCANNER_PORT:-"8000"}
export SCANNER_WORKERS=${SCANNER_WORKERS:-"1"}
export SCANNER_RELOAD=${SCANNER_RELOAD:-"true"}
export SCANNER_LOG_LEVEL=${SCANNER_LOG_LEVEL:-"info"}

# Create results directory
mkdir -p scan_results

echo "✅ Environment setup complete!"
echo "🌐 Server will be available at: http://${SCANNER_HOST}:${SCANNER_PORT}"
echo "📊 WebSocket endpoint: ws://${SCANNER_HOST}:${SCANNER_PORT}/ws/scan/{scan_id}"
echo "📋 API documentation: http://${SCANNER_HOST}:${SCANNER_PORT}/docs"

# Start the server
echo "🎯 Starting FastAPI server..."
python start.py