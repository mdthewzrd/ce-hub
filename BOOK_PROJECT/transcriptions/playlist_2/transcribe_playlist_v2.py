#!/usr/bin/env python3
"""
Video Transcription Agent for Vortex Based Mathematics Playlist
Transcribes all accessible videos with timestamps and preserves technical terminology
"""

import yt_dlp
import json
import re
import os
import sys
from pathlib import Path
from datetime import timedelta
import requests

class VideoTranscriptionAgent:
    def __init__(self, playlist_url, output_dir):
        self.playlist_url = playlist_url
        self.output_dir = Path(output_dir)
        self.output_dir.mkdir(parents=True, exist_ok=True)

    def get_accessible_videos(self):
        """Extract only accessible video information from the playlist"""
        print("=" * 80)
        print("EXTRACTING ACCESSIBLE VIDEOS FROM PLAYLIST")
        print("=" * 80)

        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'extract_flat': True,
        }

        with yt_dlp.YoutubeDL(ydl_opts) as ydl:
            try:
                info = ydl.extract_info(self.playlist_url, download=False)
                playlist_title = info.get('title', 'Unknown Playlist')
                all_entries = info.get('entries', [])

                accessible_videos = []

                print(f"\n✓ Playlist: {playlist_title}")
                print(f"✓ Total entries found: {len(all_entries)}\n")

                for idx, entry in enumerate(all_entries, 1):
                    # Skip private/unavailable videos
                    if entry.get('availability', 'unavailable') == 'unavailable':
                        print(f"  ⊘ {idx}. SKIPPED (Private/Unavailable): {entry.get('title', 'Unknown')}")
                        continue

                    video_info = {
                        'index': len(accessible_videos) + 1,
                        'original_index': idx,
                        'title': entry.get('title', 'Unknown'),
                        'url': entry.get('url', entry.get('webpage_url', '')),
                        'duration': entry.get('duration', 0),
                        'id': entry.get('id', '')
                    }
                    accessible_videos.append(video_info)

                    duration = video_info['duration']
                    duration_str = f"{duration//60}:{duration%60:02d}" if duration else "Unknown"

                    print(f"  ✓ {len(accessible_videos)}. {video_info['title']}")
                    print(f"     Duration: {duration_str}")
                    print(f"     URL: {video_info['url']}")
                    print()

                print(f"✓ Accessible videos: {len(accessible_videos)} out of {len(all_entries)} total\n")
                return accessible_videos

            except Exception as e:
                print(f"✗ Error extracting playlist: {str(e)}")
                return []

    def sanitize_filename(self, title):
        """Create safe filename from video title"""
        safe = re.sub(r'[^\w\s-]', '', title)
        safe = re.sub(r'[-\s]+', '_', safe)
        return safe[:50]

    def format_timestamp(self, seconds):
        """Format seconds to HH:MM:SS"""
        td = timedelta(seconds=int(seconds))
        hours, remainder = divmod(td.seconds, 3600)
        minutes, seconds = divmod(remainder, 60)
        return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

    def download_subtitles(self, video_url):
        """Download and parse subtitles from video"""
        ydl_opts = {
            'quiet': True,
            'no_warnings': True,
            'writesubtitles': True,
            'writeautomaticsub': True,
            'subtitleslangs': ['en'],
            'skip_download': True,
        }

        try:
            with yt_dlp.YoutubeDL(ydl_opts) as ydl:
                info = ydl.extract_info(video_url, download=False)

                # Check for available subtitles
                subtitles = info.get('subtitles', {})
                automatic_captions = info.get('automatic_captions', {})

                transcript_data = []

                # Try manual subtitles first
                if 'en' in subtitles and len(subtitles['en']) > 0:
                    sub_url = subtitles['en'][0].get('url')
                    if sub_url:
                        print("  ✓ Using manual subtitles")
                        transcript_data = self.download_and_parse_srt(sub_url)

                # Fall back to automatic captions
                if not transcript_data and 'en' in automatic_captions:
                    sub_url = automatic_captions['en'][0].get('url')
                    if sub_url:
                        print("  ✓ Using automatic captions")
                        transcript_data = self.download_and_parse_srt(sub_url)

                return transcript_data

        except Exception as e:
            print(f"  ✗ Error downloading subtitles: {str(e)}")
            return []

    def download_and_parse_srt(self, srt_url):
        """Download and parse SRT subtitle file"""
        try:
            response = requests.get(srt_url, timeout=30)
            response.raise_for_status()
            srt_content = response.text
            return self.parse_srt(srt_content)
        except Exception as e:
            print(f"  ⚠ Error downloading SRT: {e}")
            return []

    def parse_srt(self, srt_content):
        """Parse SRT subtitle format into structured data"""
        entries = []
        blocks = re.split(r'\n\s*\n', srt_content.strip())

        for block in blocks:
            lines = block.strip().split('\n')
            if len(lines) >= 3:
                # Parse timestamp line
                timestamp_line = lines[1]
                match = re.match(r'(\d{2}:\d{2}:\d{2}),\d{3}\s*-->\s*(\d{2}:\d{2}:\d{2}),\d{3}', timestamp_line)

                if match:
                    start_time = match.group(1)
                    text = '\n'.join(lines[2:])

                    entries.append({
                        'start': start_time,
                        'text': text.strip()
                    })

        return entries

    def transcribe_video(self, video_info, total_videos):
        """Transcribe a single video"""
        print(f"\n{'=' * 80}")
        print(f"TRANSCRIBING VIDEO {video_info['index']}/{total_videos}: {video_info['title']}")
        print(f"{'=' * 80}\n")

        try:
            # Download subtitles
            transcript_data = self.download_subtitles(video_info['url'])

            # Create filename
            filename = f"video_{video_info['index']:02d}_{self.sanitize_filename(video_info['title'])}.txt"
            output_path = self.output_dir / filename

            # Save transcript
            self.save_transcript(transcript_data, output_path, video_info, total_videos)

            if transcript_data:
                print(f"✓ Successfully transcribed and saved: {output_path.name}")
            else:
                print(f"⚠ No subtitles available - created placeholder: {output_path.name}")

            return True

        except Exception as e:
            print(f"✗ Error transcribing video: {str(e)}")
            return False

    def save_transcript(self, transcript_data, output_path, video_info, total_videos):
        """Save formatted transcript to file"""
        with open(output_path, 'w', encoding='utf-8') as f:
            # Write header
            f.write("=" * 80 + "\n")
            f.write(f"VIDEO TRANSCRIPT: {video_info['title']}\n")
            f.write("=" * 80 + "\n\n")

            f.write(f"Playlist: Vortex Based Mathematics (General)\n")
            f.write(f"Video {video_info['index']} of {total_videos}\n")
            f.write(f"URL: {video_info['url']}\n")

            duration = video_info['duration']
            if duration:
                minutes, seconds = divmod(duration, 60)
                hours, minutes = divmod(minutes, 60)
                f.write(f"Duration: {hours:02d}:{minutes:02d}:{seconds:02d}\n")

            f.write("\n" + "=" * 80 + "\n\n")

            # Write transcript content
            if transcript_data:
                current_segment = []
                last_timestamp = None

                for entry in transcript_data:
                    timestamp = entry['start']
                    text = entry['text']

                    # Add timestamp every 30 seconds or at speaker/topic changes
                    if last_timestamp is None or self.should_add_timestamp(last_timestamp, timestamp):
                        if current_segment:
                            f.write(f"{' '.join(current_segment)}\n\n")
                            current_segment = []
                        f.write(f"[{timestamp}] **Speaker**: {text} ")
                        last_timestamp = timestamp
                    else:
                        current_segment.append(text)

                # Write remaining content
                if current_segment:
                    f.write(f"{' '.join(current_segment)}\n\n")
            else:
                f.write("[No transcription available - subtitles not found for this video]\n")
                f.write("\nNote: This video may require manual transcription or may not have ")
                f.write("closed captions available.\n")

            f.write("\n" + "=" * 80 + "\n")
            f.write("END OF TRANSCRIPT\n")
            f.write("=" * 80 + "\n")

    def should_add_timestamp(self, last_time, current_time):
        """Determine if a new timestamp should be added based on time elapsed"""
        try:
            # Parse timestamps
            h1, m1, s1 = map(int, last_time.split(':'))
            h2, m2, s2 = map(int, current_time.split(':'))

            last_seconds = h1 * 3600 + m1 * 60 + s1
            current_seconds = h2 * 3600 + m2 * 60 + s2

            # Add timestamp every 60 seconds
            return (current_seconds - last_seconds) >= 60

        except Exception:
            return False

    def process_playlist(self):
        """Process all accessible videos in the playlist"""
        print("\n" + "=" * 80)
        print("VORTEX BASED MATHEMATICS PLAYLIST TRANSCRIPTION")
        print("=" * 80 + "\n")

        # Get accessible videos
        videos = self.get_accessible_videos()

        if not videos:
            print("✗ No accessible videos found in playlist\n")
            return {'success': 0, 'failed': 0, 'total': 0}

        # Transcribe each video
        results = {'success': 0, 'failed': 0, 'total': len(videos)}

        for video in videos:
            success = self.transcribe_video(video, len(videos))

            if success:
                results['success'] += 1
            else:
                results['failed'] += 1

        # Print summary
        print("\n" + "=" * 80)
        print("TRANSCRIPTION COMPLETE - SUMMARY")
        print("=" * 80)
        print(f"\nTotal accessible videos: {results['total']}")
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
    sys.exit(0 if main()['success'] > 0 else 1)
