#!/usr/bin/env python3
"""Monitor transcription progress"""

import time
import os
from pathlib import Path

OUTPUT_DIR = Path("/Users/michaeldurante/ai dev/ce-hub/BOOK_PROJECT/transcriptions/playlist_1")

def count_transcripts():
    """Count completed transcripts"""
    txt_files = list(OUTPUT_DIR.glob("video_*.txt"))
    return len(txt_files), sorted(txt_files)

def main():
    print("="*80)
    print("TRANSCRIPTION PROGRESS MONITOR")
    print("="*80)
    print()

    while True:
        count, files = count_transcripts()

        print(f"\rProgress: {count}/21 videos transcribed | ", end="")

        if count == 21:
            print("\n✓ ALL VIDEOS TRANSCRIBED!")
            print()
            print("Completed files:")
            for f in files:
                size = f.stat().st_size / 1024  # KB
                print(f"  ✓ {f.name} ({size:.1f} KB)")
            break

        if count > 0:
            latest = files[-1]
            print(f"Latest: {latest.name}")

        time.sleep(5)

if __name__ == "__main__":
    main()
