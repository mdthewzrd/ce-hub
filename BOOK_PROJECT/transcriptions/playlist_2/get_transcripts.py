#!/usr/bin/env python3
"""
Extract YouTube transcripts using youtube-transcript-api
"""

import sys
import json
import re
from pathlib import Path

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api.formatters import TextFormatter
except ImportError:
    print("Installing youtube-transcript-api...")
    import subprocess
    subprocess.check_call([sys.executable, "-m", "pip", "install", "youtube-transcript-api", "--quiet"])
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api.formatters import TextFormatter

def extract_video_id(url):
    """Extract video ID from YouTube URL"""
    patterns = [
        r'(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&\n?#]+)',
        r'youtube\.com\/watch\?.*v=([^&\n?#]+)'
    ]

    for pattern in patterns:
        match = re.search(pattern, url)
        if match:
            return match.group(1)

    return None

def get_transcript(video_url):
    """Get transcript for a single video"""
    video_id = extract_video_id(video_url)

    if not video_id:
        return None, "Invalid YouTube URL"

    try:
        # Use the correct API method
        transcript = YouTubeTranscriptApi.get_transcript(video_id, languages=['en'])
        return transcript, None
    except Exception as e:
        # Try without language filter
        try:
            transcript = YouTubeTranscriptApi.get_transcript(video_id)
            return transcript, None
        except Exception as e2:
            return None, str(e2)

def format_transcript(transcript_data):
    """Format transcript data into readable text"""
    formatted_text = []

    for entry in transcript_data:
        # Format timestamp
        timestamp = format_timestamp(entry['start'])

        # Get text
        text = entry['text'].strip()

        # Add duration if available
        if 'duration' in entry:
            duration = entry['duration']
            if duration > 3.0:
                # Long pause - add break
                formatted_text.append(f"\n[{timestamp}] **Speaker**: {text}\n")
            else:
                formatted_text.append(f"{text} ")
        else:
            formatted_text.append(f"{text} ")

    return ''.join(formatted_text)

def format_timestamp(seconds):
    """Format seconds to HH:MM:SS"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"{hours:02d}:{minutes:02d}:{secs:02d}"

def process_videos(video_urls, output_dir):
    """Process multiple videos and save transcripts"""
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)

    results = {
        'success': 0,
        'failed': 0,
        'total': len(video_urls)
    }

    for idx, (video_number, url, title) in enumerate(video_urls, 1):
        print(f"\nProcessing {video_number}: {title}")

        transcript, error = get_transcript(url)

        if transcript:
            # Format transcript
            formatted_text = format_transcript(transcript)

            # Create filename
            safe_title = re.sub(r'[^\w\s-]', '', title)[:50]
            safe_title = re.sub(r'[-\s]+', '_', safe_title)
            filename = f"video_{video_number:02d}_{safe_title}.txt"
            filepath = output_path / filename

            # Save transcript
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write("=" * 80 + "\n")
                f.write(f"VIDEO TRANSCRIPT: {title}\n")
                f.write("=" * 80 + "\n\n")
                f.write(f"URL: {url}\n")
                f.write(f"Video Number: {video_number}\n\n")
                f.write("=" * 80 + "\n\n")
                f.write(formatted_text)
                f.write("\n" + "=" * 80 + "\n")
                f.write("END OF TRANSCRIPT\n")
                f.write("=" * 80 + "\n")

            print(f"✓ Saved: {filename}")
            results['success'] += 1
        else:
            print(f"✗ Failed: {error}")
            results['failed'] += 1

    return results

if __name__ == "__main__":
    # Vortex Based Mathematics playlist videos
    videos = [
        (1, "https://www.youtube.com/watch?v=fI93jeaXGvs", "Vortex Based Mathematics - Marko Rodin"),
        (2, "https://www.youtube.com/watch?v=UQ5I5mLeAaU", "Vortex Mathematics - Randy Powell"),
        (3, "https://www.youtube.com/watch?v=FS5LKtbKxqE", "Vortex Based Math - The Flower of Life"),
        (4, "https://www.youtube.com/watch?v=CEFWYYCCiTI", "TRUTH - The Universal Language - Fibonacci and Vortex Based Math"),
        (5, "https://www.youtube.com/watch?v=c42vXYykm6s", "Marko Rodin on the Word of God"),
        (6, "https://www.youtube.com/watch?v=unqKSfZfzho", "RODIN FRACTAL EIGHT ABHA TORI MATRIX"),
        (11, "https://www.youtube.com/watch?v=Z48FbS2bPIw", "Marko Rodin 2011 Rare Interview"),
    ]

    output_dir = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_2"

    results = process_videos(videos, output_dir)

    print("\n" + "=" * 80)
    print("TRANSCRIPTION COMPLETE")
    print("=" * 80)
    print(f"Total: {results['total']}")
    print(f"Success: {results['success']}")
    print(f"Failed: {results['failed']}")
    print("=" * 80)
