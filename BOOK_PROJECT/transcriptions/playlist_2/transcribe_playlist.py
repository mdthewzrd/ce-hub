#!/usr/bin/env python3
"""
Video Transcription Agent for Vortex Based Mathematics Playlist
Transcribes all videos with timestamps and preserves technical terminology
"""

import yt_dlp
import json
import re
import os
from pathlib import Path
from datetime import timedelta

class VideoTranscriptionAgent:
    def __init__(self, playlist_url, output_dir):
        self.playlist_url = playlist_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

        # Configure YouTube download options
        self.ydl_opts = {
            'quiet': False,
            'no_warnings': False,
            'extract_flat': False,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
        }

    def get_playlist_info(self):
        """Extract all video information from the playlist"""
        print("=" * 80)
        print("EXTRACTING PLAYLIST INFORMATION")
        print("=" * 80)

        with yt_dlp.YoutubeDL(self.ydl_opts) as ydl:
            info = ydl.extract_info(self.playlist_url, download=False)

            playlist_title = info.get('title', 'Unknown Playlist')
            videos = info.get('entries', [])

            print(f"\n✓ Playlist: {playlist_title}")
            print(f"✓ Total videos: {len(videos)}\n")

            video_list = []
            for idx, entry in enumerate(videos, 1):
                video_info = {
                    'index': idx,
                    'title': entry.get('title', 'Unknown'),
                    'url': entry.get('url', entry.get('webpage_url', '')),
                    'duration': entry.get('duration', 0),
                    'id': entry.get('id', '')
                }
                video_list.append(video_info)

                duration = video_info['duration']
                duration_str = f"{duration//60}:{duration%60:02d}" if duration else "Unknown"

                print(f"  {idx}. {video_info['title']}")
                print(f"     Duration: {duration_str}")
                print(f"     URL: {video_info['url']}")
                print()

        return video_list

    def sanitize_filename(self, title):
        """Create safe filename from video title"""
        # Remove special characters, keep spaces and alphanumeric
        safe = re.sub(r'[^\w\s-]', '', title)
        safe = re.sub(r'[-\s]+', '_', safe)
        return safe[:50]  # Limit length

    def format_timestamp(self, seconds):
        """Format seconds to HH:MM:SS"""
        td = timedelta(seconds=int(seconds))
        hours, remainder = divmod(td.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def transcribe_video(self, video_info):
        """Transcribe a single video using available subtitles"""
        print(f"\n{'=' * 80}")
        print(f"TRANSCRIBING VIDEO {video_info['index']}: {video_info['title']}")
        print(f"{'=' * 80}\n")

        video_url = video_info['url']
        video_id = video_info['id']
        title = video_info['title']

        # Configure for subtitle extraction
        ydl_opts_sub = {
            'quiet': False,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'subtitlesformat': 'srt',
            'skip_download': True,
            'outtmpl': str(self.output_dir / f'{video_id}.%(ext)s'),
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts_sub) as ydl:
                info = ydl.extract_info(video_url, download=False)

                # Check for available subtitles
                subtitles = info.get('subtitles', {})
                automatic_captions = info.get('automatic_captions', {})

                transcript_data = []

                # Try manual subtitles first
                if 'en' in subtitles:
                    print(f"✓ Found manual subtitles for: {title}")
                    sub_url = subtitles['en'][0]['url']
                    transcript_data = self.download_and_parse_srt(sub_url)

                # Fall back to automatic captions
                elif 'en' in automatic_captions:
                    print(f"✓ Found automatic captions for: {title}")
                    sub_url = automatic_captions['en'][0]['url']
                    transcript_data = self.download_and_parse_srt(sub_url)

                else:
                    print(f"⚠ No subtitles available for: {title}")
                    # Create placeholder file
                    transcript_data = [
                        {
                            'start': 0,
                            'text': "[No transcription available - video may need manual transcription]"
                        }
                    ]

                # Format and save transcript
                filename = f"video_{video_info['index']:02d}_{self.sanitize_filename(title)}.txt"
                output_path = self.output_dir / filename

                self.save_transcript(transcript_data, output_path, video_info)

                print(f"✓ Saved transcript to: {output_path.name}\n")
                return True

        except Exception as e:
            print(f"✗ Error transcribing {title}: {str(e)}\n")
            return False

    def download_and_parse_srt(self, srt_url):
        """Download and parse SRT subtitle file"""
        import requests

        try:
            response = requests.get(srt_url, timeout=30)
            response.raise_for_status()
            srt_content = response.text

            # Parse SRT format
            return self.parse_srt(srt_content)
        except Exception as e:
            print(f"⚠ Error downloading subtitles: {e}")
            return []

    def parse_srt(self, srt_content):
        """Parse SRT subtitle format into structured data"""
        entries = []
        blocks = re.split(r'\n\s*\n', srt_content.strip())

        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) >= 3:
                # Parse timestamp line (format: 00:00:00,000 --> 00:00:05,000)
                timestamp_line = lines[1]
                match = re.match(r'(\d{2}:\d{2}:\d{2}),\d{3}\s*-->\s*(\d{2}:\d{2}:\d{2}),\d{3}', timestamp_line)

                if match:
                    start_time = match.group(1)
                    # end_time = match.group(2)
                    text = '\n'.join(lines[2:])

                    entries.append({
                        'start': start_time,
                        'text': text.strip()
                    })

        return entries

    def save_transcript(self, transcript_data, output_path, video_info):
        """Save formatted transcript to file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            # Write header
            f.write("=" * 80 + "\n")
            f.write(f"VIDEO TRANSCRIPT: {video_info['title']}\n")
            f.write("=" * 80 + "\n\n")

            f.write(f"Playlist: Vortex Based Mathematics (General)\n")
            f.write(f"Video {video_info['index']} of {video_info.get('total', '?')}\n")
            f.write(f"Duration: {video_info['duration']} seconds\n")
            f.write(f"URL: {video_info['url']}\n")
            f.write("\n" + "=" * 80 + "\n\n")

            # Write transcript with timestamps
            if transcript_data:
                for entry in transcript_data:
                    timestamp = entry['start']
                    text = entry['text']

                    f.write(f"[{timestamp}] **Speaker**: {text}\n\n")
            else:
                f.write("[No transcription data available]\n")

            f.write("\n" + "=" * 80 + "\n")
            f.write("END OF TRANSCRIPT\n")
            f.write("=" * 80 + "\n")

    def process_playlist(self):
        """Process all videos in the playlist"""
        print("\n" + "=" * 80)
        print("VORTEX BASED MATHEMATICS PLAYLIST TRANSCRIPTION")
        print("=" * 80 + "\n")

        # Get all video information
        videos = self.get_playlist_info()

        # Transcribe each video
        results = {
            'success': 0,
            'failed': 0,
            'total': len(videos)
        }

        for video in videos:
            video['total'] = len(videos)  # Add total for display
            success = self.transcribe_video(video)

            if success:
                results['success'] += 1
            else:
                results['failed'] += 1

        # Print summary
        print("\n" + "=" * 80)
        print("TRANSCRIPTION COMPLETE - SUMMARY")
        print("=" * 80)
        print(f"\nTotal videos processed: {results['total']}")
        print(f"Successfully transcribed: {results['success']}")
        print(f"Failed: {results['failed']}")
        print(f"\nAll transcripts saved to: {self.output_dir}")
        print("=" * 80 + "\n")

        return results


def main():
    """Main execution function"""
    playlist_url = "https://www.youtube.com/playlist?list=PL2itiI3QsMbXV0o0zcEtAA-a7G5jFWCcc"
    output_dir = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_2"

    agent = VideoTranscriptionAgent(playlist_url, output_dir)
    results = agent.process_playlist()

    return results


if __name__ == "__main__":
    main()
