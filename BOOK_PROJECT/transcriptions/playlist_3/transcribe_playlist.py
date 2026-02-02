#!/usr/bin/env python3
"""
YouTube Playlist Transcription Script
Uses yt-dlp to download videos and OpenAI Whisper to transcribe them
"""

import os
import json
import subprocess
from pathlib import Path

# Configuration
PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLLBJrcnesgAfx5ffa1p0klmm_GDhkG70x"
OUTPUT_DIR = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_3"
AUDIO_DIR = f"{OUTPUT_DIR}/audio"
TRANSCRIPTS_DIR = OUTPUT_DIR

# Create directories
Path(AUDIO_DIR).mkdir(parents=True, exist_ok=True)
Path(TRANSCRIPTS_DIR).mkdir(parents=True, exist_ok=True)

def load_playlist_info():
    """Load playlist information from JSON file"""
    with open(f"{OUTPUT_DIR}/playlist_info.json", 'r') as f:
        return json.load(f)

def download_audio(video_url, video_index, title):
    """Download audio from YouTube video using yt-dlp"""
    # Sanitize filename
    safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in title)
    output_file = f"{AUDIO_DIR}/video_{video_index:02d}_{safe_title[:50]}"

    print(f"Downloading audio for video {video_index}: {title}")

    cmd = [
        'yt-dlp',
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '--extract-audio',
        '--audio-format', 'mp3',
        '-o', f'{output_file}.%(ext)s',
        video_url
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        # Find the downloaded file
        audio_file = f"{output_file}.mp3"
        if os.path.exists(audio_file):
            return audio_file
        else:
            print(f"Error: Audio file not found for video {video_index}")
            return None
    except subprocess.CalledProcessError as e:
        print(f"Error downloading video {video_index}: {e}")
        return None

def transcribe_audio(audio_file, video_index, title):
    """Transcribe audio using OpenAI Whisper"""
    print(f"Transcribing video {video_index}: {title}")

    output_file = f"{TRANSCRIPTS_DIR}/video_{video_index:02d}_{title[:50].replace(' ', '_')}.txt"

    cmd = [
        'whisper',
        audio_file,
        '--model', 'medium',  # Options: tiny, base, small, medium, large
        '--output_format', 'txt',
        '--output_dir', TRANSCRIPTS_DIR,
        '--verbose', 'True'
    ]

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)

        # Whisper creates a .txt file, rename it to our format
        whisper_output = f"{TRANSCRIPTS_DIR}/{Path(audio_file).stem}.txt"
        if os.path.exists(whisper_output):
            os.rename(whisper_output, output_file)
            print(f"Transcription saved: {output_file}")
            return output_file
        else:
            print(f"Error: Transcription file not created for video {video_index}")
            return None
    except subprocess.CalledProcessError as e:
        print(f"Error transcribing video {video_index}: {e}")
        return None
    except FileNotFoundError:
        print("Error: Whisper not installed. Install with: pip install openai-whisper")
        return None

def transcribe_playlist():
    """Main function to transcribe entire playlist"""
    playlist_data = load_playlist_info()
    videos = playlist_data['videos']

    print(f"Starting transcription of {len(videos)} videos...")
    print(f"Output directory: {OUTPUT_DIR}")
    print("-" * 80)

    successful = 0
    failed = 0

    for video in videos:
        index = video['index']
        title = video['title']
        url = video['url']

        print(f"\n[{index}/{len(videos)}] Processing: {title}")

        # Download audio
        audio_file = download_audio(url, index, title)

        if audio_file:
            # Transcribe
            transcript_file = transcribe_audio(audio_file, index, title)
            if transcript_file:
                successful += 1
                # Clean up audio file to save space
                os.remove(audio_file)
            else:
                failed += 1
        else:
            failed += 1

    print("\n" + "=" * 80)
    print(f"Transcription complete!")
    print(f"Successful: {successful}/{len(videos)}")
    print(f"Failed: {failed}/{len(videos)}")
    print(f"Transcripts saved to: {TRANSCRIPTS_DIR}")

if __name__ == "__main__":
    print("=" * 80)
    print("YouTube Playlist Transcription Script")
    print("=" * 80)
    print("\nRequirements:")
    print("1. yt-dlp: pip install yt-dlp")
    print("2. openai-whisper: pip install openai-whisper")
    print("3. FFmpeg (for audio processing)")
    print("\nStarting transcription process...")
    print("=" * 80)

    transcribe_playlist()
