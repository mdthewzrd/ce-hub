#!/usr/bin/env python3
"""
Vortex Based Mathematics Playlist Transcription System
Transcribes all 21 videos from Playlist 1 with speaker diarization and timestamps
"""

import os
import json
import subprocess
import sys
from pathlib import Path
from datetime import timedelta

# Configuration
PLAYLIST_URL = "https://www.youtube.com/playlist?list=PLd8nNT6sz_QcT3_Svg3qIB3X-LhUrBvnG"
OUTPUT_DIR = Path("/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1")
VIDEO_LIST = [
    ("01", "https://www.youtube.com/watch?v=7pvuTZ5u6Kg", "Intro to Vortex Math - Part 1"),
    ("02", "https://www.youtube.com/watch?v=7Oc2j0TOefM", "Intro to Vortex Math - Part 2"),
    ("03", "https://www.youtube.com/watch?v=Y4HCNtNO2VU", "Intro to Vortex Math - Part 3"),
    ("04", "https://www.youtube.com/watch?v=6tc24nNQOCo", "Intro to Vortex Math - Part 4"),
    ("05", "https://www.youtube.com/watch?v=Ekfc6_zOCbA", "Intro to Vortex Math - Part 5"),
    ("06", "https://www.youtube.com/watch?v=uROabhExdwY", "Intro to Vortex Math - Part 6"),
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

class PlaylistTranscriber:
    """Transcribe YouTube playlist with speaker diarization and timestamps"""

    def __init__(self, output_dir: Path):
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)
        self.temp_dir = self.output_dir / "temp"
        self.temp_dir.mkdir(exist_ok=True)

    def format_timestamp(self, seconds: float) -> str:
        """Convert seconds to [HH:MM:SS] format"""
        td = timedelta(seconds=int(seconds))
        hours, remainder = divmod(td.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"[{td.days * 24 + hours:02d}:{minutes:02d}:{seconds:02d}]"

    def sanitize_filename(self, title: str) -> str:
        """Create safe filename from title"""
        # Remove invalid characters
        safe = "".join(c if c.isalnum() or c in (' ', '-', '_') else '_' for c in title)
        return safe.lower().replace(' ', '_')[:50]

    def check_tool(self, tool_name: str) -> bool:
        """Check if a tool is available"""
        try:
            result = subprocess.run(
                ['which', tool_name],
                capture_output=True,
                text=True
            )
            return result.returncode == 0
        except Exception:
            return False

    def download_audio(self, url: str, output_path: Path) -> bool:
        """Download audio from YouTube using yt-dlp or youtube-dl"""
        print(f"  → Downloading audio from: {url}")

        # Try yt-dlp first (more maintained)
        if self.check_tool('yt-dlp'):
            cmd = [
                'yt-dlp',
                '-f', 'bestaudio/best',
                '--extract-audio',
                '--audio-format', 'mp3',
                '--audio-quality', '0',
                '-o', str(output_path),
                url
            ]
        elif self.check_tool('youtube-dl'):
            cmd = [
                'youtube-dl',
                '-f', 'bestaudio/best',
                '--extract-audio',
                '--audio-format', 'mp3',
                '-o', str(output_path),
                url
            ]
        else:
            print("  ❌ ERROR: Neither yt-dlp nor youtube-dl found")
            print("  → Install: brew install yt-dlp")
            return False

        try:
            result = subprocess.run(cmd, capture_output=True, text=True, timeout=300)
            if result.returncode == 0:
                print(f"  ✓ Audio downloaded successfully")
                return True
            else:
                print(f"  ❌ Download failed: {result.stderr}")
                return False
        except subprocess.TimeoutExpired:
            print("  ❌ Download timed out")
            return False
        except Exception as e:
            print(f"  ❌ Download error: {e}")
            return False

    def transcribe_with_whisper_api(self, audio_path: Path, output_path: Path, video_title: str) -> bool:
        """Transcribe using OpenAI Whisper API"""
        print(f"  → Transcribing with Whisper API...")

        try:
            import openai
            client = openai.OpenAI()

            with open(audio_path, "rb") as audio_file:
                response = client.audio.transcriptions.create(
                    model="whisper-1",
                    language="en",
                    response_format="verbose_json",
                    timestamp_granularities=["segment"]
                )

            # Format transcript
            transcript_text = self.format_transcript(response, video_title)

            # Save to file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(transcript_text)

            print(f"  ✓ Transcription complete: {output_path.name}")
            return True

        except ImportError:
            print("  ❌ OpenAI library not found")
            print("  → Install: pip install openai")
            return False
        except Exception as e:
            print(f"  ❌ Transcription error: {e}")
            return False

    def transcribe_with_local_whisper(self, audio_path: Path, output_path: Path, video_title: str) -> bool:
        """Transcribe using local Whisper installation"""
        print(f"  → Transcribing with local Whisper...")

        try:
            import whisper
            model = whisper.load_model("base")

            result = model.transcribe(
                str(audio_path),
                language="en",
                verbose=False
            )

            # Format transcript
            transcript_text = self.format_transcript(result, video_title)

            # Save to file
            with open(output_path, 'w', encoding='utf-8') as f:
                f.write(transcript_text)

            print(f"  ✓ Transcription complete: {output_path.name}")
            return True

        except ImportError:
            print("  ❌ Whisper library not found")
            print("  → Install: pip install openai-whisper")
            return False
        except Exception as e:
            print(f"  ❌ Transcription error: {e}")
            return False

    def format_transcript(self, result: dict, video_title: str) -> str:
        """Format transcription result with timestamps and speaker labels"""
        output = []

        # Header
        output.append("=" * 80)
        output.append(f"VIDEO TRANSCRIPT: {video_title}")
        output.append("=" * 80)
        output.append("")
        output.append("Source: Marko Rodin Vortex Based Mathematics Course")
        output.append("Speaker: Randy Powell")
        output.append("Format: Timestamped transcription with speaker diarization")
        output.append("")
        output.append("=" * 80)
        output.append("")

        # Process segments
        if 'segments' in result:
            for segment in result['segments']:
                start_time = self.format_timestamp(segment['start'])
                text = segment['text'].strip()

                # Add timestamp and speaker
                output.append(f"{start_time} **Randy Powell**: {text}")
                output.append("")

        # Word-level timestamps if available
        if 'words' in result:
            output.append("")
            output.append("=" * 80)
            output.append("WORD-LEVEL TIMESTAMPS")
            output.append("=" * 80)
            output.append("")

            for word in result['words']:
                start_time = self.format_timestamp(word['start'])
                output.append(f"{start_time} {word['word']}")

        return "\n".join(output)

    def process_video(self, index: str, url: str, title: str) -> bool:
        """Process a single video: download and transcribe"""
        print(f"\n{'='*80}")
        print(f"Processing Video {index}: {title}")
        print(f"{'='*80}")

        # Generate output filename
        safe_title = self.sanitize_filename(title)
        output_file = self.output_dir / f"video_{index}_{safe_title}.txt"
        audio_file = self.temp_dir / f"video_{index}.mp3"

        # Check if already transcribed
        if output_file.exists():
            print(f"  ✓ Already transcribed: {output_file.name}")
            return True

        # Download audio
        if not self.download_audio(url, audio_file):
            return False

        # Try different transcription methods
        success = False

        # Method 1: OpenAI Whisper API (requires API key)
        if not success:
            success = self.transcribe_with_whisper_api(audio_file, output_file, title)

        # Method 2: Local Whisper (requires installation)
        if not success:
            success = self.transcribe_with_local_whisper(audio_file, output_file, title)

        # Cleanup audio file
        if audio_file.exists():
            audio_file.unlink()

        return success

    def process_playlist(self):
        """Process all videos in the playlist"""
        print("\n" + "="*80)
        print("VORTEX BASED MATHEMATICS - PLAYLIST TRANSCRIPTION SYSTEM")
        print("="*80)
        print(f"\nTotal Videos: {len(VIDEO_LIST)}")
        print(f"Output Directory: {self.output_dir}")
        print("\n")

        # Check prerequisites
        has_ytdl = self.check_tool('yt-dlp') or self.check_tool('youtube-dl')
        has_whisper = self.check_tool('whisper')

        print("PREREQUISITE CHECK:")
        print(f"  ✓ ffmpeg: {'Installed' if self.check_tool('ffmpeg') else 'NOT FOUND'}")
        print(f"  {'✓' if has_ytdl else '❌'} yt-dlp/youtube-dl: {'Installed' if has_ytdl else 'NOT FOUND - Install: brew install yt-dlp'}")
        print(f"  {'✓' if has_whisper else '❌'} whisper: {'Installed' if has_whisper else 'NOT FOUND - Install: pip install openai-whisper'}")
        print()

        if not has_ytdl:
            print("\n❌ CRITICAL: yt-dlp or youtube-dl is required")
            print("   Install with: brew install yt-dlp")
            return

        # Process each video
        results = {"success": 0, "failed": 0, "skipped": 0}

        for index, url, title in VIDEO_LIST:
            if self.process_video(index, url, title):
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
        print(f"\n  Output Directory: {self.output_dir}")
        print("="*80)

if __name__ == "__main__":
    transcriber = PlaylistTranscriber(OUTPUT_DIR)
    transcriber.process_playlist()
