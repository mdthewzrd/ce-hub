#!/bin/bash
echo "Checking transcription progress..."
count=$(ls -1 "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1/"video_*.txt 2>/dev/null | wc -l)
echo "Completed: $count/21 videos"
if [ $count -eq 21 ]; then
    echo "✓ ALL VIDEOS TRANSCRIBED!"
    ls -lh "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1/"video_*.txt
    exit 0
fi
sleep 30
