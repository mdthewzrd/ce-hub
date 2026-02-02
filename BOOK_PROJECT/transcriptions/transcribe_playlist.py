#!/usr/bin/env python3
"""
YouTube Playlist Transcription Script
Processes all videos from a playlist and generates transcripts
"""

import json
import os
import subprocess
import sys
from pathlib import Path

# Configuration
PLAYLIST_JSON = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_4_video_list.json"
OUTPUT_DIR = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_4"

def load_video_list():
    """Load the video list from JSON file"""
    with open(PLAYLIST_JSON, 'r') as f:
        data = json.load(f)
    return data['videos']

def sanitize_filename(title):
    """Convert title to safe filename"""
    # Remove invalid characters
    invalid_chars = '<>:"/\\|?*'
    for char in invalid_chars:
        title = title.replace(char, '')
    # Limit length
    if len(title) > 50:
        title = title[:47] + '...'
    return title.strip()

def get_transcript_using_yt_transcript(video_id):
    """Try to get transcript using youtube-transcript-api"""
    try:
        from youtube_transcript_api import YouTubeTranscriptApi
        transcript = YouTubeTranscriptApi.get_transcript(video_id)
        return transcript
    except Exception as e:
        print(f"  ⚠ youtube-transcript-api failed: {e}")
        return None

def get_transcript_using_ytdlp(video_url):
    """Try to get transcript using yt-dlp"""
    try:
        cmd = [
            'yt-dlp',
            '--write-auto-sub',
            '--skip-download',
            '--sub-lang', 'en',
            '--sub-format', 'json3',
            '--output', '%(id)s',
            video_url
        ]
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=60)
        if result.returncode == 0:
            return "ytdlp_success"
    except Exception as e:
        print(f"  ⚠ yt-dlp failed: {e}")
    return None

def format_transcript_with_timestamps(transcript_data, video_title, video_url):
    """Format transcript with timestamps and speakers"""
    output = []
    output.append(f"TRANSCRIPT: {video_title}")
    output.append(f"URL: {video_url}")
    output.append(f"Generated: {__import__('datetime').datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
    output.append("=" * 80)
    output.append("")

    if isinstance(transcript_data, list):
        for entry in transcript_data:
            time = entry.get('start', 0)
            text = entry.get('text', '')
            minutes = int(time // 60)
            seconds = int(time % 60)
            timestamp = f"[{minutes:02d}:{seconds:02d}]"
            output.append(f"{timestamp} {text}")

    return '\n'.join(output)

def save_transcript(video_num, video_data, transcript):
    """Save transcript to file"""
    # Create filename
    title_safe = sanitize_filename(video_data['title'])
    filename = f"video_{video_num:02d}_{title_safe}.txt"
    filepath = os.path.join(OUTPUT_DIR, filename)

    # Format transcript
    content = format_transcript_with_timestamps(
        transcript,
        video_data['title'],
        f"https://www.youtube.com/watch?v={video_data['video_id']}"
    )

    # Save to file
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(content)

    return filepath

def main():
    """Main transcription workflow"""
    print("🎬 YouTube Playlist Transcription Tool")
    print("=" * 60)

    # Load video list
    videos = load_video_list()
    total = len(videos)
    print(f"Found {total} videos to process")
    print()

    # Create output directory
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    # Process each video
    success_count = 0
    failed_videos = []

    for i, video in enumerate(videos, 1):
        print(f"[{i}/{total}] Processing: {video['title'][:60]}...")

        video_url = f"https://www.youtube.com/watch?v={video['video_id']}"

        # Try to get transcript
        transcript = None

        # Method 1: youtube-transcript-api
        transcript = get_transcript_using_yt_transcript(video['video_id'])

        # Method 2: yt-dlp (fallback)
        if not transcript:
            print("  Trying yt-dlp...")
            result = get_transcript_using_ytdlp(video_url)
            if result:
                # Read the downloaded subtitle file
                import glob
                json_files = glob.glob(f"{video['video_id']}*.json3")
                if json_files:
                    with open(json_files[0], 'r') as f:
                        data = json.load(f)
                        transcript = data.get('events', [])
                    # Cleanup
                    os.remove(json_files[0])

        if transcript:
            filepath = save_transcript(i, video, transcript)
            print(f"  ✅ Saved: {os.path.basename(filepath)}")
            success_count += 1
        else:
            print(f"  ❌ Failed to retrieve transcript")
            failed_videos.append(video)

        print()

    # Summary
    print("=" * 60)
    print(f"📊 SUMMARY:")
    print(f"  ✅ Successfully transcribed: {success_count}/{total}")
    print(f"  ❌ Failed: {len(failed_videos)}/{total}")

    if failed_videos:
        print("\nFailed videos:")
        for v in failed_videos:
            print(f"  - {v['title']}")

if __name__ == "__main__":
    main()
