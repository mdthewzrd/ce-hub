#!/bin/bash

# YouTube Playlist Transcription - Quick Start Script
# Automates the entire transcription process

echo "=========================================="
echo "YouTube Playlist Transcription System"
echo "=========================================="
echo ""

# Check if we're in the right directory
if [ ! -f "playlist_info.json" ]; then
    echo "Error: Please run this script from the playlist_3 directory"
    echo "cd /Users/michaeldurante/ai\ dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_3"
    exit 1
fi

# Check Python
if ! command -v python3 &> /dev/null; then
    echo "Error: Python 3 is not installed"
    exit 1
fi

echo "✓ Python found"

# Check yt-dlp
if ! command -v yt-dlp &> /dev/null; then
    echo ""
    echo "Installing yt-dlp..."
    pip3 install yt-dlp
fi

echo "✓ yt-dlp ready"

# Check whisper
if ! python3 -c "import whisper" 2>/dev/null; then
    echo ""
    echo "Installing OpenAI Whisper..."
    pip3 install openai-whisper
fi

echo "✓ Whisper ready"

# Check ffmpeg
if ! command -v ffmpeg &> /dev/null; then
    echo ""
    echo "⚠ WARNING: FFmpeg not found!"
    echo ""
    echo "Please install FFmpeg:"
    echo "  macOS:   brew install ffmpeg"
    echo "  Ubuntu:  sudo apt install ffmpeg"
    echo ""
    read -p "Continue anyway? (y/n) " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[Yy]$ ]]; then
        exit 1
    fi
else
    echo "✓ FFmpeg ready"
fi

echo ""
echo "=========================================="
echo "All dependencies ready!"
echo "=========================================="
echo ""
echo "Starting transcription of 35 videos..."
echo "This will take 4-8 hours"
echo ""
read -p "Press Enter to continue or Ctrl+C to cancel..."
echo ""

# Run the advanced transcription script
python3 transcribe_advanced.py

echo ""
echo "=========================================="
echo "Transcription complete!"
echo "=========================================="
echo ""
echo "Check the output directory for results:"
ls -lh video_*.txt 2>/dev/null | wc -l | xargs echo "Transcripts created:"
echo ""
echo "Files saved to: $(pwd)"
