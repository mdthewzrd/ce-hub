#!/bin/bash

echo "=========================================="
echo "VORTEX MATH TRANSCRIPTION STATUS"
echo "=========================================="
echo ""

# Count completed transcriptions
completed=$(ls -1 "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1/"video_*.txt 2>/dev/null | wc -l)
remaining=$((21 - completed))

echo "Progress: $completed/21 videos completed"
echo "Remaining: $remaining videos"
echo ""

if [ $completed -gt 0 ]; then
    echo "✅ Completed Transcriptions:"
    ls -lh "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1/"video_*.txt | awk '{print "  " $9 " (" $5 ")"}'
fi

echo ""
echo "=========================================="
echo "Background Process Status"
echo "=========================================="

# Check if batch process is running
if ps aux | grep -v grep | grep "batch_transcribe.py" > /dev/null; then
    echo "✅ Batch transcription process is RUNNING"

    # Show last 10 lines of log
    if [ -f "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/batch_transcript.log" ]; then
        echo ""
        echo "Latest log output:"
        tail -5 "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/batch_transcript.log" | sed 's/^/  /'
    fi
else
    echo "⏸ Batch transcription process is NOT running"
fi

echo ""
echo "=========================================="
echo "Monitoring Commands"
echo "=========================================="
echo ""
echo "Watch progress in real-time:"
echo "  tail -f /Users/michaeldurante/ai\\ dev/ce-hub/BOOK_PROJECT/batch_transcript.log"
echo ""
echo "Check completed files:"
echo "  ls -lh /Users/michaeldurante/ai\\ dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1/"
echo ""
echo "Read a specific transcript:"
echo "  cat /Users/michaeldurante/ai\\ dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1/video_01_*.txt"
echo ""
