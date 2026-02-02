#!/usr/bin/env python3
"""
Optimized Batch Transcription for Vortex Based Mathematics
Processes all remaining videos with parallel download and sequential transcription
"""

import os
import sys
import subprocess
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor, as_completed

# Configuration
OUTPUT_DIR = Path("/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1")
VIDEO_LIST = [
    ("07", "https://www.youtube.com/watch?v=bU0sT2XZkX0", "Intro to Vortex Math - Part 7"),
    ("08", "https://www.youtube.com/watch?v=E8Ja1m6qFmI", "Intro to Vortex Math - Part 8"),
    ("09", "https://www.youtube.com/watch?v=n3zAXWfd9KQ", "Intro to Vortex Math - Part 9"),
    ("10", "https://www.youtube.com/watch?v=imXJmo1PrF0", "Intro to Vortex Math - Part 10"),
    ("11", "https://www.youtube.com/watch?v=NS451asNKhk", "Intro to Vortex Math - Part 11"),
    ("12", "https://www.youtube.com/watch?v=Kysak8VPvkY", "Intro to Vortex Math - Part 12"),
    ("13", "https://www.youtube.com/watch?v=fp6zSDNLvwg", "Intro to Vortex Math - Part 13"),
    ("14", "https://www.youtube.com/watch?v=3K_9mixAbO8", "Intro to Vortex Math - Part 14"),
    ("15", "https://www.youtube.com/watch?v=vvgH0uGA5ls", "Intro to Vortex Math - Part 15"),
    ("16", "https://www.youtube.com/watch?v=hOi3v87Dgl0", "Intro to Vortex Math - Part 16"),
    ("17", "https://www.youtube.com/watch?v=-PmQUa8fqHQ", "Advanced Vortex Math - Part 1"),
    ("18", "https://www.youtube.com/watch?v=Li-oumsqjkM", "Advanced Vortex Math - Part 2"),
    ("19", "https://www.youtube.com/watch?v=9TCYJMw72Cg", "Advanced Vortex Math - Part 3"),
    ("20", "https://www.youtube.com/watch?v=DowQ93ju6Rs", "Advanced Vortex Math - Part 4"),
    ("21", "https://www.youtube.com/watch?v=EZ8HIV8AHdU", "Advanced Vortex Math - Part 5"),
]

def format_timestamp(seconds):
    """Convert seconds to [HH:MM:SS] format"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    return f"[{hours:02d}:{minutes:02d}:{secs:02d}]"

def sanitize_filename(title):
    """Create safe filename from title"""
    safe = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in title)
    return safe.lower().replace(' ', '_')[:50]

def download_audio(index, url, temp_dir):
    """Download audio from YouTube"""
    output_path = temp_dir / f"video_{index}.mp3"

    if output_path.exists():
        print(f"  ✓ Audio already downloaded: video_{index}")
        return True, output_path

    print(f"  ↓ Downloading audio for video_{index}...")

    cmd = [
        'yt-dlp',
        '-f', 'bestaudio/best',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '0',
        '-o', str(output_path),
        url
    ]

    try:
        result = subprocess.run(cmd, capture_output=True, text=True, timeout=180)
        if result.returncode == 0:
            print(f"  ✓ Download complete: video_{index}")
            return True, output_path
        else:
            print(f"  ❌ Download failed: {result.stderr[:100]}")
            return False, None
    except Exception as e:
        print(f"  ❌ Download error: {e}")
        return False, None

def transcribe_audio(audio_path, output_path, video_title):
    """Transcribe audio using Whisper"""
    print(f"  🎙️  Transcribing {audio_path.name}...")

    try:
        import whisper
        model = whisper.load_model("base")

        result = model.transcribe(
            str(audio_path),
            language="en",
            verbose=False
        )

        # Format transcript
        lines = []
        lines.append("=" * 80)
        lines.append(f"VIDEO TRANSCRIPT: {video_title}")
        lines.append("=" * 80)
        lines.append("")
        lines.append("Source: Marko Rodin Vortex Based Mathematics Course")
        lines.append("Speaker: Randy Powell")
        lines.append("Format: Timestamped transcription with speaker diarization")
        lines.append("")
        lines.append("=" * 80)
        lines.append("")

        for segment in result.get('segments', []):
            start_time = format_timestamp(segment['start'])
            text = segment['text'].strip()
            lines.append(f"{start_time} **Randy Powell**: {text}")
            lines.append("")

        # Save transcript
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write("\n".join(lines))

        print(f"  ✓ Transcription complete: {output_path.name}")
        return True

    except Exception as e:
        print(f"  ❌ Transcription error: {e}")
        return False

def process_video(index, url, title):
    """Process a single video"""
    print(f"\n{'='*80}")
    print(f"Processing Video {index}: {title}")
    print(f"{'='*80}")

    # Setup paths
    safe_title = sanitize_filename(title)
    output_file = OUTPUT_DIR / f"video_{index}_{safe_title}.txt"
    temp_dir = OUTPUT_DIR / "temp"
    temp_dir.mkdir(exist_ok=True)

    # Check if already transcribed
    if output_file.exists():
        print(f"  ✓ Already transcribed: {output_file.name}")
        return True

    # Download audio
    success, audio_path = download_audio(index, url, temp_dir)
    if not success:
        return False

    # Transcribe
    success = transcribe_audio(audio_path, output_file, title)

    # Cleanup
    if audio_path and audio_path.exists():
        audio_path.unlink()

    return success

def main():
    print("\n" + "="*80)
    print("OPTIMIZED BATCH TRANSCRIPTION")
    print("="*80)
    print(f"\nRemaining Videos: {len(VIDEO_LIST)}")
    print(f"Output Directory: {OUTPUT_DIR}")
    print("\n")

    # Process each video sequentially (more stable)
    results = {"success": 0, "failed": 0, "skipped": 0}

    for index, url, title in VIDEO_LIST:
        if process_video(index, url, title):
            results["success"] += 1
        else:
            results["failed"] += 1

    # Summary
    print("\n" + "="*80)
    print("TRANSCRIPTION SUMMARY")
    print("="*80)
    print(f"  ✓ Successfully Transcribed: {results['success']}")
    print(f"  ❌ Failed: {results['failed']}")
    print(f"  ⏭ Skipped: {results['skipped']}")
    print(f"  📊 Total Processed: {results['success'] + results['failed'] + results['skipped']}")
    print(f"\n  Output Directory: {OUTPUT_DIR}")
    print("="*80)

if __name__ == "__main__":
    main()
