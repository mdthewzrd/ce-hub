#!/bin/bash

# Instagram Sound Manager - Startup Script

echo "🎵 Instagram Sound Manager"
echo "======================"
echo ""

# Check if FFmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "❌ FFmpeg not found!"
    echo ""
    echo "Install FFmpeg:"
    echo "  macOS:   brew install ffmpeg"
    echo "  Ubuntu:  sudo apt-get install ffmpeg"
    echo "  Windows: choco install ffmpeg"
    echo ""
    exit 1
fi

echo "✅ FFmpeg found"
echo ""

# Install Flask dependencies
echo "📦 Installing dependencies..."
cd backend/instagram_automation

# Create venv if not exists
if [ ! -d "venv" ]; then
    python3 -m venv venv
fi

source venv/bin/activate

# Install Flask and dependencies
pip install -q flask flask-cors requests pydub

echo "✅ Dependencies installed"
echo ""

# Start sound manager
echo "🚀 Starting Sound Manager..."
echo ""
echo "Open: http://localhost:5500"
echo ""
echo "Press Ctrl+C to stop"
echo ""

cd audio
python sound_manager.py
