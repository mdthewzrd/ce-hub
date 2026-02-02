#!/usr/bin/env python3
"""
Extract YouTube subtitles using yt-dlp
This is the most reliable method for getting transcripts
"""

import json
import os
import subprocess
import sys
from pathlib import Path

PLAYLIST_JSON = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_4_video_list.json"
OUTPUT_DIR = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_4"

def load_videos():
    """Load video list"""
    with open(PLAYLIST_JSON, 'r') as f:
        return json.load(f)['videos']

def sanitize_filename(title):
    """Create safe filename from title"""
    # Remove special characters
    keep_chars = (' ', '.', '_', '-')
    title = ''.join(c for c in title if c.isalnum() or c in keep_chars).strip()
    title = title.replace(' ', '_')
    if len(title) > 50:
        title = title[:50]
    return title

def extract_subtitle_ytdlp(video_id, video_title, video_num):
    """Extract subtitle using yt-dlp"""
    print(f"[{video_num}] Extracting: {video_title[:50]}...")

    url = f"https://www.youtube.com/watch?v={video_id}"

    # Try to get auto-generated English subtitles
    cmd = [
        'yt-dlp',
        '--write-auto-sub',
        '--sub-lang', 'en',
        '--sub-format', 'ttml',
        '--skip-download',
        '--output', f'{OUTPUT_DIR}/subs/{video_id}',
        url
    ]

    try:
        os.makedirs(f"{OUTPUT_DIR}/subs", exist_ok=True)
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=30)

        if result.returncode == 0:
            # Find the downloaded subtitle file
            import glob
            ttml_files = glob.glob(f"{OUTPUT_DIR}/subs/{video_id}*.ttml")
            if ttml_files:
                return parse_ttml(ttml_files[0], video_title, url)
            else:
                return None
        else:
            print(f"  Error: {result.stderr}")
            return None

    except Exception as e:
        print(f"  Exception: {e}")
        return None

def parse_ttml(ttml_file, title, url):
    """Parse TTML subtitle file to text"""
    try:
        import xml.etree.ElementTree as ET

        tree = ET.parse(ttml_file)
        root = tree.getroot()

        # TTML uses namespaces
        namespaces = {
            'tt': 'http://www.w3.org/ns/ttml',
            'tts': 'http://www.w3.org/ns/ttml#styling'
        }

        transcript_lines = []
        transcript_lines.append(f"VIDEO: {title}")
        transcript_lines.append(f"URL: {url}")
        transcript_lines.append("=" * 80)
        transcript_lines.append("")

        # Find all text elements
        for div in root.findall('.//tt:div', namespaces):
            for p in div.findall('.//tt:p', namespaces):
                text = p.text
                if text:
                    transcript_lines.append(text.strip())

        return '\n'.join(transcript_lines)

    except Exception as e:
        print(f"  TTML parsing error: {e}")
        return None

def save_transcript(video_num, video_data, transcript):
    """Save transcript to file"""
    if not transcript:
        return None

    title_safe = sanitize_filename(video_data['title'])
    filename = f"video_{video_num:02d}_{title_safe}.txt"
    filepath = os.path.join(OUTPUT_DIR, filename)

    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(transcript)

    return filepath

def main():
    """Main processing"""
    print("🎬 YouTube Subtitle Extractor")
    print("=" * 60)

    videos = load_videos()
    total = len(videos)
    print(f"Processing {total} videos...\n")

    os.makedirs(OUTPUT_DIR, exist_ok=True)

    success = 0
    failed = []

    for i, video in enumerate(videos, 1):
        transcript = extract_subtitle_ytdlp(
            video['video_id'],
            video['title'],
            i
        )

        if transcript:
            filepath = save_transcript(i, video, transcript)
            print(f"  ✅ Saved")
            success += 1
        else:
            print(f"  ❌ No subtitles available")
            failed.append(video['title'])

        print()

    print("=" * 60)
    print(f"✅ Success: {success}/{total}")
    print(f"❌ Failed: {len(failed)}/{total}")

    if failed:
        print("\nFailed videos:")
        for title in failed:
            print(f"  - {title}")

if __name__ == "__main__":
    main()
