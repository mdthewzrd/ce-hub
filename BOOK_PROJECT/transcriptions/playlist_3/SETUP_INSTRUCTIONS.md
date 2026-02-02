# YouTube Playlist Transcription System

## Overview
This system transcribes all 35 videos from the "Vedic / Vortex Based Mathematics & Plasmoid Unification Theory" playlist with timestamps and book-ready formatting.

## Prerequisites Installation

### 1. Install Python Dependencies
```bash
pip install yt-dlp openai-whisper
```

### 2. Install FFmpeg

**On macOS:**
```bash
brew install ffmpeg
```

**On Ubuntu/Debian:**
```bash
sudo apt update
sudo apt install ffmpeg
```

**On Windows:**
Download from https://ffmpeg.org/download.html and add to PATH

## Quick Start

### Option 1: Basic Transcription (Simple TXT output)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_3"
python transcribe_playlist.py
```

### Option 2: Advanced Transcription (Timestamps + Multiple Formats)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_3"
python transcribe_advanced.py
```

## What These Scripts Do

### transcribe_playlist.py (Basic)
- Downloads audio from each video
- Transcribes using Whisper (medium model)
- Outputs simple text files
- Cleans up audio files after transcription

### transcribe_advanced.py (Recommended)
- Downloads high-quality audio (192kbps)
- Transcribes with word-level timestamps
- Outputs 4 formats:
  - **.txt** - Plain text transcript
  - **.srt** - SubRip subtitles (with timestamps)
  - **.vtt** - WebVTT subtitles
  - **.json** - Full data with all timestamps
- Creates book-ready formatted version
- Automatic resume (skips already completed videos)
- Cleans up audio files after successful transcription

## Output Files

For each video, you'll get:
1. `video_01_[title].txt` - Plain transcript
2. `video_01_[title].srt` - Subtitle format with timestamps
3. `video_01_[title].vtt` - Web subtitle format
4. `video_01_[title].json` - Complete data with word-level timestamps
5. `video_01_book_ready.txt` - Formatted for book publication

## Estimated Time

- **Short videos (5-20 min)**: ~1-2 minutes each
- **Medium videos (20-60 min)**: ~3-5 minutes each
- **Long videos (1-2+ hours)**: ~10-15 minutes each

**Total estimated time for 35 videos**: 4-8 hours

## Troubleshooting

### Error: "whisper: command not found"
```bash
pip install openai-whisper
```

### Error: "yt-dlp: command not found"
```bash
pip install yt-dlp
```

### Error: "ffmpeg: command not found"
Install FFmpeg (see Prerequisites above)

### Video fails to download
Check your internet connection. Some videos may be region-restricted or private.

### Out of memory during transcription
The transcription uses a "medium" model by default. For lower memory usage, edit `transcribe_advanced.py` and change:
```python
'--model', 'medium',
```
to:
```python
'--model', 'small',  # or 'base' for even lower memory
```

## File Structure

```
playlist_3/
├── playlist_info.json              # Video metadata
├── transcribe_playlist.py          # Basic script
├── transcribe_advanced.py          # Advanced script (recommended)
├── SETUP_INSTRUCTIONS.md           # This file
├── audio/                          # Temporary audio files (auto-deleted)
└── video_01_*.txt                  # Transcripts (generated)
    ├── video_01_*.srt
    ├── video_01_*.vtt
    ├── video_01_*.json
    └── video_01_book_ready.txt
```

## Customization

### Change Whisper Model
Edit `transcribe_advanced.py`:
```python
'--model', 'medium',  # Options: tiny, base, small, medium, large
```

### Change Audio Quality
Edit `transcribe_advanced.py`:
```python
'--audio-quality', '192K',  # Higher = better transcription, larger file
```

### Change Output Directory
Edit the configuration at the top of either script:
```python
OUTPUT_DIR = "/your/custom/path"
```

## Technical Details

### Whisper Models
- **tiny**: 39M parameters, ~1GB VRAM, fastest, least accurate
- **base**: 74M parameters, ~1GB VRAM
- **small**: 244M parameters, ~2GB VRAM
- **medium**: 769M parameters, ~5GB VRAM (recommended)
- **large**: 1550M parameters, ~10GB VRAM, most accurate

### Why Multiple Formats?
- **TXT**: Easy to read and edit
- **SRT**: Standard subtitle format for video players
- **VTT**: Web-based subtitle format
- **JSON**: Complete data for programmatic access
- **Book-ready**: Formatted specifically for publication

## Support

For issues with:
- **yt-dlp**: https://github.com/yt-dlp/yt-dlp
- **Whisper**: https://github.com/openai/whisper
- **FFmpeg**: https://ffmpeg.org/documentation.html

## License Notes

These transcripts are for personal/research use. Respect YouTube's Terms of Service and the content creator's copyright.
