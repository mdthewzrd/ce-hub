#!/usr/bin/env python3
"""
Advanced YouTube Playlist Transcription with Timestamps
Uses yt-dlp + OpenAI Whisper with detailed timestamps
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
    safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in title)
    output_file = f"{AUDIO_DIR}/video_{video_index:02d}_{safe_title[:50]}"

    print(f"[{video_index}] Downloading: {title[:60]}...")

    cmd = [
        'yt-dlp',
        '-f', 'bestaudio[ext=m4a]/bestaudio',
        '--extract-audio',
        '--audio-format', 'mp3',
        '--audio-quality', '192K',  # Higher quality for better transcription
        '-o', f'{output_file}.%(ext)s',
        '--no-playlist',  # Download single video
        video_url
    ]

    try:
        subprocess.run(cmd, check=True, capture_output=True, text=True)
        audio_file = f"{output_file}.mp3"
        if os.path.exists(audio_file):
            print(f"[{video_index}] ✓ Audio downloaded: {os.path.getsize(audio_file) / (1024*1024):.1f} MB")
            return audio_file
        else:
            print(f"[{video_index}] ✗ Error: Audio file not found")
            return None
    except subprocess.CalledProcessError as e:
        print(f"[{video_index}] ✗ Download error: {e}")
        return None

def transcribe_with_timestamps(audio_file, video_index, title):
    """Transcribe with detailed timestamps using Whisper"""

    safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in title)
    base_name = f"video_{video_index:02d}_{safe_title[:50]}"

    print(f"[{video_index}] Transcribing with timestamps...")

    # Whisper command with all output formats
    cmd = [
        'whisper',
        audio_file,
        '--model', 'medium',
        '--output_dir', TRANSCRIPTS_DIR,
        '--output_format', 'all',  # Generate txt, srt, vtt, json
        '--verbose', 'False',
        '--task', 'transcribe',
        '--language', 'en',  # Specify English
        '--word_timestamps', 'True'  # Include word-level timestamps
    ]

    try:
        result = subprocess.run(cmd, check=True, capture_output=True, text=True)

        # Process different output formats
        base_output = f"{TRANSCRIPTS_DIR}/{Path(audio_file).stem}"

        # 1. Plain text transcript
        txt_file = f"{TRANSCRIPTS_DIR}/{base_name}.txt"
        if os.path.exists(f"{base_output}.txt"):
            os.rename(f"{base_output}.txt", txt_file)

        # 2. SRT (SubRip format with timestamps)
        srt_file = f"{TRANSCRIPTS_DIR}/{base_name}.srt"
        if os.path.exists(f"{base_output}.srt"):
            os.rename(f"{base_output}.srt", srt_file)

        # 3. VTT (WebVTT format)
        vtt_file = f"{TRANSCRIPTS_DIR}/{base_name}.vtt"
        if os.path.exists(f"{base_output}.vtt"):
            os.rename(f"{base_output}.vtt", vtt_file)

        # 4. JSON (with detailed word-level timestamps)
        json_file = f"{TRANSCRIPTS_DIR}/{base_name}.json"
        if os.path.exists(f"{base_output}.json"):
            os.rename(f"{base_output}.json", json_file)

        print(f"[{video_index}] ✓ Transcription complete:")
        print(f"  - Text: {txt_file}")
        print(f"  - SRT: {srt_file}")
        print(f"  - VTT: {vtt_file}")
        print(f"  - JSON: {json_file}")

        return {
            'txt': txt_file,
            'srt': srt_file,
            'vtt': vtt_file,
            'json': json_file
        }

    except subprocess.CalledProcessError as e:
        print(f"[{video_index}] ✗ Transcription error: {e}")
        return None
    except FileNotFoundError:
        print("Error: Whisper not installed. Install with: pip install openai-whisper")
        return None

def create_book_ready_format(transcript_files, video_data):
    """Create book-ready transcript with speaker labels and timestamps"""

    if not transcript_files or 'json' not in transcript_files:
        return None

    json_file = transcript_files['json']
    video_index = video_data['index']
    title = video_data['title']

    print(f"[{video_index}] Creating book-ready format...")

    # Load JSON transcript
    with open(json_file, 'r') as f:
        data = json.load(f)

    output_file = f"{TRANSCRIPTS_DIR}/video_{video_index:02d}_book_ready.txt"

    with open(output_file, 'w') as f:
        # Header
        f.write("=" * 80 + "\n")
        f.write(f"VIDEO {video_index}: {title}\n")
        f.write(f"Duration: {video_data.get('duration', 'Unknown')}\n")
        f.write(f"URL: {video_data['url']}\n")
        f.write("=" * 80 + "\n\n")

        # Process segments
        if 'segments' in data:
            for segment in data['segments']:
                start_time = segment['start']
                end_time = segment['end']
                text = segment['text'].strip()

                # Convert seconds to HH:MM:SS format
                hours = int(start_time // 3600)
                minutes = int((start_time % 3600) // 60)
                seconds = int(start_time % 60)
                timestamp = f"[{hours:02d}:{minutes:02d}:{seconds:02d}]"

                # Write with timestamp every 30 seconds or on speaker change
                f.write(f"{timestamp} {text}\n\n")

    print(f"[{video_index}] ✓ Book-ready format: {output_file}")
    return output_file

def transcribe_playlist():
    """Main function to transcribe entire playlist"""
    playlist_data = load_playlist_info()
    videos = playlist_data['videos']

    print("\n" + "=" * 80)
    print(f"TRANSCRIBING {len(videos)} VIDEOS")
    print("=" * 80)
    print(f"Playlist: {playlist_data['playlist_title']}")
    print(f"Channel: {playlist_data['channel']}")
    print(f"Output: {OUTPUT_DIR}")
    print("=" * 80 + "\n")

    successful = 0
    failed = 0
    skipped = 0

    for video in videos:
        index = video['index']
        title = video['title']
        url = video['url']

        print("\n" + "-" * 80)

        # Check if already transcribed
        safe_title = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in title)
        existing_txt = f"{TRANSCRIPTS_DIR}/video_{index:02d}_{safe_title[:50]}.txt"

        if os.path.exists(existing_txt):
            print(f"[{index}] ✓ Already transcribed, skipping...")
            skipped += 1
            continue

        # Download audio
        audio_file = download_audio(url, index, title)

        if audio_file:
            # Transcribe
            transcript_files = transcribe_with_timestamps(audio_file, index, title)

            if transcript_files:
                # Create book-ready format
                create_book_ready_format(transcript_files, video)
                successful += 1

                # Clean up audio file to save space
                os.remove(audio_file)
                print(f"[{index}] ✓ Cleaned up audio file")
            else:
                failed += 1
        else:
            failed += 1

    # Summary
    print("\n" + "=" * 80)
    print("TRANSCRIPTION COMPLETE!")
    print("=" * 80)
    print(f"Total videos: {len(videos)}")
    print(f"✓ Successful: {successful}")
    print(f"⊗ Skipped: {skipped}")
    print(f"✗ Failed: {failed}")
    print(f"\nAll transcripts saved to: {TRANSCRIPTS_DIR}")
    print("=" * 80)

if __name__ == "__main__":
    print("\n" + "=" * 80)
    print("YOUTUBE PLAYLIST TRANSCRIPTION SYSTEM")
    print("with Timestamps & Book-Ready Formatting")
    print("=" * 80)

    print("\nREQUIREMENTS:")
    print("  pip install yt-dlp openai-whisper")
    print("  brew install ffmpeg  (macOS)")
    print("  sudo apt install ffmpeg  (Ubuntu/Debian)")

    print("\nFEATURES:")
    print("  ✓ Downloads audio from YouTube")
    print("  ✓ Transcribes with word-level timestamps")
    print("  ✓ Outputs: TXT, SRT, VTT, JSON formats")
    print("  ✓ Creates book-ready formatted transcripts")
    print("  ✓ Automatic resume (skips completed videos)")

    print("\n" + "=" * 80)

    transcribe_playlist()
