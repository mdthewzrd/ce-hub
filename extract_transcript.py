#!/usr/bin/env python3
"""
Extract transcript from Thrive II documentary and organize for book chapters
"""

import json
import re
from datetime import timedelta

try:
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api.formatters import TextFormatter
except ImportError:
    print("Installing youtube-transcript-api...")
    import subprocess
    subprocess.run(['pip', 'install', 'youtube-transcript-api'], check=True)
    from youtube_transcript_api import YouTubeTranscriptApi
    from youtube_transcript_api.formatters import TextFormatter

def get_video_id(url):
    """Extract video ID from YouTube URL"""
    pattern = r'(?:v=|\/)([0-9A-Za-z_-]{11}).*'
    match = re.search(pattern, url)
    if match:
        return match.group(1)
    return None

def format_timestamp(seconds):
    """Convert seconds to HH:MM:SS format"""
    td = timedelta(seconds=seconds)
    hours, remainder = divmod(td.seconds, 3600)
    minutes, seconds = divmod(remainder, 60)
    return f"{hours:02d}:{minutes:02d}:{seconds:02d}"

def extract_transcript(video_id):
    """Extract transcript from YouTube video"""
    try:
        # Instantiate the API
        ytt_api = YouTubeTranscriptApi()

        # Get transcript list
        transcript_list = ytt_api.list(video_id)

        # Try manual transcript first, then generated
        try:
            transcript = transcript_list.find_manually_created_transcript(['en'])
        except:
            try:
                transcript = transcript_list.find_generated_transcript(['en'])
            except:
                # Get any available transcript
                transcript = list(transcript_list)[0]

        # Fetch the transcript data
        transcript_data = transcript.fetch()
        return transcript_data
    except Exception as e:
        print(f"Error extracting transcript: {e}")
        print(f"Error type: {type(e)}")
        import traceback
        traceback.print_exc()
        return None

def organize_by_topic(transcript):
    """Organize transcript content by topic for book chapters"""

    # Keywords for each chapter
    chapter_keywords = {
        "Chapter 1: Universal Language (vibration, frequency)": [
            "vibration", "frequency", "resonance", "sound", "wave", "oscillation",
            "tuning", "pitch", "harmonic", "acoustic", "hz", "hertz"
        ],
        "Chapter 2: Vortex Math (patterns, torus, Rodin coils)": [
            "vortex", "torus", "rodin", "coil", "doubling", "circuit",
            "mathematics", "numerical", "pattern", "infinity", "loop",
            "1, 2, 4, 8, 7, 5", "1-2-4-8-7-5"
        ],
        "Chapter 3: Sacred Patterns (Fibonacci, Phi, nature)": [
            "fibonacci", "phi", "golden", "ratio", "spiral", "sequence", "nature",
            "flower", "shell", "galaxy", "pattern", "sacred", "geometry",
            "1.618", "phi ratio"
        ],
        "Chapter 4: Unified Field (everything connected, Tesla)": [
            "tesla", "nikola", "unified", "field", "connected", "electricity", "energy",
            "universe", "ether", "scalar", "wave", "zero-point", "zeropoint"
        ],
        "Chapter 5: Healing Through Harmony": [
            "healing", "health", "frequency", "medicine", "treatment", "therapy",
            "body", "cells", "dna", "vibration", "rife", "cure", "harmony"
        ],
        "Chapter 6: Hidden in Plain Sight": [
            "hidden", "secret", "ancient", "knowledge", "symbol", "pattern",
            "obvious", "visible", "everywhere", "nature", "universe"
        ]
    }

    organized = {
        "full_transcript": [],
        "by_chapter": {chapter: [] for chapter in chapter_keywords.keys()},
        "key_concepts": [],
        "important_quotes": [],
        "visual_descriptions": [],
        "math_explanations": [],
        "narrative_flow": []
    }

    for item in transcript:
        # Handle both dict and object formats
        if isinstance(item, dict):
            start_time = item.get('start', 0)
            text = item.get('text', '')
            duration = item.get('duration', 0)
        else:
            # FetchedTranscriptSnippet object
            start_time = item.start
            text = item.text
            duration = item.duration

        timestamp = format_timestamp(start_time)
        text_lower = text.lower()

        # Add to full transcript
        organized["full_transcript"].append({
            "timestamp": timestamp,
            "text": text,
            "duration": duration
        })

        # Categorize by chapter
        categorized = False
        for chapter, keywords in chapter_keywords.items():
            if any(keyword in text_lower for keyword in keywords):
                organized["by_chapter"][chapter].append({
                    "timestamp": timestamp,
                    "text": text
                })
                categorized = True
                break

        # Extract important quotes
        if any(word in text_lower for word in ["truth", "secret", "key", "principle", "law", "discovery", "breakthrough"]):
            organized["important_quotes"].append({
                "timestamp": timestamp,
                "quote": text
            })

        # Extract mathematical content
        if any(word in text_lower for word in ["equation", "formula", "mathematics", "calculate", "number", "pattern"]):
            organized["math_explanations"].append({
                "timestamp": timestamp,
                "content": text
            })

        # Extract visual descriptions
        if any(word in text_lower for word in ["you can see", "show", "display", "graphic", "animation", "image", "visual"]):
            organized["visual_descriptions"].append({
                "timestamp": timestamp,
                "description": text
            })

        # Extract key concepts (words that appear important)
        if len(text.split()) > 5:  # Substantial content
            organized["key_concepts"].append({
                "timestamp": timestamp,
                "concept": text
            })

        # Build narrative flow
        organized["narrative_flow"].append({
            "timestamp": timestamp,
            "content": text,
            "categorized": categorized
        })

    return organized

def create_readable_transcript(organized):
    """Create a readable text transcript with timestamps"""

    output = []
    output.append("=" * 80)
    output.append("THRIVE II: THIS IS WHAT IT TAKES - FULL TRANSCRIPT")
    output.append("=" * 80)
    output.append("")

    # Full transcript
    output.append("FULL TRANSCRIPT WITH TIMESTAMPS")
    output.append("-" * 80)
    for item in organized['full_transcript']:
        output.append(f"[{item['timestamp']}] {item['text']}")
        output.append("")

    return "\n".join(output)

def create_chapter_summary(organized):
    """Create chapter-based summaries"""

    output = []
    output.append("=" * 80)
    output.append("THRIVE II: CONTENT ORGANIZED BY BOOK CHAPTERS")
    output.append("=" * 80)
    output.append("")

    for chapter, segments in organized['by_chapter'].items():
        if segments:
            output.append(f"\n{chapter}")
            output.append("-" * 80)
            for seg in segments[:20]:  # First 20 segments per chapter
                output.append(f"[{seg['timestamp']}] {seg['text']}")
            if len(segments) > 20:
                output.append(f"\n... and {len(segments) - 20} more segments in this chapter")
            output.append("")

    return "\n".join(output)

def main():
    video_url = "https://www.youtube.com/watch?v=nq2MCxXn3vg"
    video_id = get_video_id(video_url)

    if not video_id:
        print("Could not extract video ID")
        return

    print(f"Extracting transcript from video: {video_id}")

    transcript = extract_transcript(video_id)

    if not transcript:
        print("Failed to extract transcript")
        return

    print(f"Extracted {len(transcript)} transcript segments")

    # Organize content
    organized = organize_by_topic(transcript)

    # Save organized JSON
    json_file = "/Users/michaeldurante/ai dev/ce-hub/thrive2_transcript_organized.json"
    with open(json_file, 'w', encoding='utf-8') as f:
        json.dump(organized, f, indent=2, ensure_ascii=False)

    print(f"\n✓ Saved organized JSON to: {json_file}")

    # Save readable transcript
    readable_file = "/Users/michaeldurante/ai dev/ce-hub/thrive2_transcript_readable.txt"
    readable_content = create_readable_transcript(organized)
    with open(readable_file, 'w', encoding='utf-8') as f:
        f.write(readable_content)
    print(f"✓ Saved readable transcript to: {readable_file}")

    # Save chapter summary
    chapter_file = "/Users/michaeldurante/ai dev/ce-hub/thrive2_by_chapters.txt"
    chapter_content = create_chapter_summary(organized)
    with open(chapter_file, 'w', encoding='utf-8') as f:
        f.write(chapter_content)
    print(f"✓ Saved chapter summary to: {chapter_file}")

    # Statistics
    print(f"\n{'='*80}")
    print("TRANSCRIPT STATISTICS")
    print(f"{'='*80}")
    print(f"Total segments: {len(organized['full_transcript'])}")
    print(f"Key concepts identified: {len(organized['key_concepts'])}")
    print(f"Important quotes: {len(organized['important_quotes'])}")
    print(f"Visual descriptions: {len(organized['visual_descriptions'])}")
    print(f"Mathematical explanations: {len(organized['math_explanations'])}")

    print(f"\nSegments by chapter:")
    for chapter, segments in organized['by_chapter'].items():
        print(f"  {chapter}: {len(segments)} segments")

if __name__ == "__main__":
    main()
