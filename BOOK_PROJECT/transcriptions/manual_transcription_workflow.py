#!/usr/bin/env python3
"""
Video Transcription Workflow for Playlist 4: Unified Physics
Uses web reading to extract video information and guide manual transcription
"""

import json
import os
import requests
from pathlib import Path

PLAYLIST_JSON = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_4_video_list.json"
OUTPUT_DIR = "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_4"

def load_videos():
    """Load video list"""
    with open(PLAYLIST_JSON, 'r') as f:
        return json.load(f)['videos']

def get_video_transcript_url(video_id):
    """Generate URL for YouTube's transcript API (if available)"""
    return f"https://www.youtube.com/watch?v={video_id}"

def create_transcript_template(video_num, video_data):
    """Create a template file for manual transcription"""
    title_safe = video_data['title'].replace('/', '_').replace('\\', '_')[:50]
    filename = f"video_{video_num:02d}_{title_safe}.txt"
    filepath = os.path.join(OUTPUT_DIR, filename)

    template = f"""TRANSCRIPT: {video_data['title']}
Video URL: https://www.youtube.com/watch?v={video_data['video_id']}
Playlist: Unified Physics (Playlist 4)
Video Number: {video_num}/64

===============================================================================
TRANSCRIPT CONTENT
===============================================================================

[INSTRUCTIONS: Transcribe the video content below. Include timestamps every 2-3 minutes.
Mark speaker changes clearly. Preserve technical terminology accurately.]

===============================================================================
VIDEO METADATA
===============================================================================
Title: {video_data['title']}
Video ID: {video_data['video_id']}
Index: {video_num}

Expected topics:
- Plasmoids
- Ball Lightning
- Thunderstorm Generator
- Unified Physics
- Vortex Based Mathematics
- Sacred Geometry

===============================================================================
NOTES
===============================================================================

[Add any relevant notes about the video content, key concepts, timestamps for important sections, etc.]

"""

    os.makedirs(OUTPUT_DIR, exist_ok=True)
    with open(filepath, 'w', encoding='utf-8') as f:
        f.write(template)

    return filepath

def generate_transcription_guide():
    """Generate a comprehensive guide for manual transcription"""
    guide_content = """# TRANSCRIPTION GUIDE: Playlist 4 - Unified Physics

## Overview
This guide helps you transcribe all 64 videos from the "Unified Physics" playlist by Alchemical Science.

## Video List
"""

    videos = load_videos()
    for video in videos:
        guide_content += f"\n{video['index']}. **{video['title']}**\n"
        guide_content += f"   - URL: https://www.youtube.com/watch?v={video['video_id']}\n"

    guide_content += """

## Transcription Standards

### Format Requirements
- **Timestamps**: Include every 2-3 minutes at speaker/topic changes
  - Format: [HH:MM:SS] or [MM:SS]
- **Speaker Labels**: Use **Speaker Name**: format
- **Technical Terms**: Preserve exact terminology
- **Structure**: Use paragraph breaks for topic changes

### Key Terminology to Preserve
- Plasmoids
- Ball Lightning
- Thunderstorm Generator
- MSAART Technology
- Vortex Based Mathematics (VBM)
- Plasmoid Unification Model (PUM)
- Alpha & Omega Ladder
- Vajra Implosive Turbine
- Sacred Geometry
- Pythagorean Tuning
- Zero Point Energy
- Transmutation

### Example Format
```
[00:00] **Speaker**: Welcome to this exploration of unified physics.
Today we're going to dive deep into the nature of plasmoids...

[02:15] **Speaker**: The thunderstorm generator works by creating a plasma
field that...
```

## Workflow

1. **Open the video** in YouTube
2. **Enable subtitles** if available (auto-generated or manual)
3. **Use the template** file created for each video
4. **Transcribe systematically**:
   - Start with available subtitles
   - Fill in gaps manually
   - Add timestamps at key intervals
   - Mark speaker changes clearly
5. **Review and proofread** for accuracy

## Tools That May Help

### YouTube Features
- Auto-generated subtitles (Settings → Subtitles → Auto-generate)
- Playback speed control (for slower transcription)

### Browser Extensions
- YouTube Transcript (browser extension to copy full transcript)
- Reread (YouTube chapter summaries)

### Manual Transcription Tools
- oTranscribe (online transcription tool)
- Express Scribe (free transcription software)

## Quality Checklist

For each transcript, verify:
- [ ] All technical terms spelled correctly
- [ ] Timestamps present at regular intervals
- [ ] Speaker changes clearly marked
- [ ] Numbers and measurements accurate
- [ ] Proper formatting and structure
- [ ] Complete content (no major sections missing)

## File Naming Convention

```
video_XX_title_keywords.txt
```

Where XX is the video number (01-64).

## Progress Tracking

Track completed videos:
"""

    for i in range(1, 65):
        guide_content += f"[ ] Video {i:02d}\n"

    # Save the guide
    guide_path = os.path.join(OUTPUT_DIR, "TRANSCRIPTION_GUIDE.md")
    os.makedirs(OUTPUT_DIR, exist_ok=True)

    with open(guide_path, 'w', encoding='utf-8') as f:
        f.write(guide_content)

    return guide_path

def main():
    """Main workflow"""
    print("🎬 Creating Transcription Templates for Playlist 4")
    print("=" * 60)

    videos = load_videos()
    total = len(videos)

    print(f"Creating templates for {total} videos...\n")

    # Create transcription guide
    guide_path = generate_transcription_guide()
    print(f"✅ Created transcription guide: {guide_path}")

    # Create template files
    for video in videos:
        filepath = create_transcript_template(video['index'], video)
        print(f"[{video['index']}/{total}] Created: {os.path.basename(filepath)}")

    print("\n" + "=" * 60)
    print("✅ All template files created successfully!")
    print(f"\n📁 Output directory: {OUTPUT_DIR}")
    print("\n📝 Next steps:")
    print("1. Open the TRANSCRIPTION_GUIDE.md for instructions")
    print("2. For each video, open the template file and transcribe the content")
    print("3. Use YouTube's auto-generated subtitles as a starting point")

if __name__ == "__main__":
    main()
