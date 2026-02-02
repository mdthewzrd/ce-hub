#!/bin/bash
# Quick setup script for Instagram Video Scraper & Brand Overlay Tool

echo "================================"
echo "Instagram Scraper Setup"
echo "================================"
echo ""

# Check Python
echo "Checking Python installation..."
if ! command -v python3 &> /dev/null; then
    echo "❌ Python 3 is not installed. Please install Python 3.8+ first."
    exit 1
fi
echo "✅ Python found: $(python3 --version)"
echo ""

# Check pip
echo "Checking pip installation..."
if ! command -v pip3 &> /dev/null; then
    echo "❌ pip3 is not installed."
    exit 1
fi
echo "✅ pip found"
echo ""

# Install Python dependencies
echo "Installing Python dependencies..."
pip3 install -r requirements.txt
echo "✅ Dependencies installed"
echo ""

# Check FFmpeg
echo "Checking FFmpeg installation..."
if ! command -v ffmpeg &> /dev/null; then
    echo "⚠️  FFmpeg is not installed!"
    echo ""
    echo "Please install FFmpeg:"
    echo "  macOS:   brew install ffmpeg"
    echo "  Ubuntu:  sudo apt install ffmpeg"
    echo "  Windows: https://ffmpeg.org/download.html"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo ""
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✅ FFmpeg found: $(ffmpeg -version | head -n1)"
fi
echo ""

# Create output directories
echo "Creating output directories..."
mkdir -p output/originals
mkdir -p output/processed
mkdir -p assets
echo "✅ Directories created"
echo ""

# Config setup
echo "Configuration Setup:"
echo "====================="
echo ""
echo "1. Edit config.json with your settings:"
echo "   - burner_username: Your burner Instagram account"
echo "   - burner_password: Your burner Instagram password"
echo "   - target_accounts: List of accounts to scrape"
echo "   - logo_path: Path to your logo file"
echo "   - watermark_regions: Configure blur regions"
echo ""
echo "2. Add your logo to assets/your_logo.png"
echo ""
echo "3. Run the tool:"
echo "   python3 main.py              # Full pipeline"
echo "   python3 main.py --scrape-only # Download only"
echo "   python3 main.py --process-only # Process only"
echo ""

echo "================================"
echo "Setup complete!"
echo "================================"
