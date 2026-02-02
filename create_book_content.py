#!/usr/bin/env python3
"""
Create comprehensive book content from Thrive II transcript
"""

import json
from collections import defaultdict

def load_organized_transcript():
    """Load the organized transcript data"""
    with open('/Users/michaeldurante/ai dev/ce-hub/thrive2_transcript_organized.json', 'r', encoding='utf-8') as f:
        return json.load(f)

def extract_context_segments(transcript, center_timestamp, window_seconds=120):
    """Extract segments around a timestamp for context"""
    # Parse center timestamp to seconds
    h, m, s = map(int, center_timestamp.split(':'))
    center_seconds = h * 3600 + m * 60 + s

    context_segments = []
    for item in transcript:
        # Parse item timestamp
        h, m, s = map(int, item['timestamp'].split(':'))
        item_seconds = h * 3600 + m * 60 + s

        if abs(item_seconds - center_seconds) <= window_seconds:
            context_segments.append(item)

    return context_segments

def identify_speaker_changes(transcript):
    """Identify potential speaker changes based on patterns"""
    speakers = []
    current_speaker = "Narrator"

    for i, item in enumerate(transcript):
        text = item['text'].lower()

        # Detect potential speaker introductions
        if any(word in text for word in ['i am', 'my name is', 'i\'m']):
            current_speaker = "Guest/Speaker"
        elif any(word in text for word in ['foster says', 'foster explains']):
            current_speaker = "Foster Gamble"

        speakers.append({
            'timestamp': item['timestamp'],
            'speaker': current_speaker,
            'text': item['text']
        })

    return speakers

def create_comprehensive_book_content(data):
    """Create comprehensive book content organized by chapters"""

    output = []
    output.append("=" * 100)
    output.append("THRIVE II: COMPREHENSIVE BOOK CONTENT ANALYSIS")
    output.append("Organized for Book Chapter Writing")
    output.append("=" * 100)
    output.append("")

    # Executive Summary
    output.append("EXECUTIVE SUMMARY")
    output.append("-" * 100)
    output.append(f"Total Transcript Segments: {len(data['full_transcript'])}")
    output.append(f"Video Duration: ~2 hours 31 minutes (9,060 seconds)")
    output.append(f"Key Concepts Identified: {len(data['key_concepts'])}")
    output.append(f"Important Quotes: {len(data['important_quotes'])}")
    output.append(f"Visual Descriptions: {len(data['visual_descriptions'])}")
    output.append(f"Mathematical Explanations: {len(data['math_explanations'])}")
    output.append("")

    # Chapter 1: Universal Language
    output.append("\n" + "=" * 100)
    output.append("CHAPTER 1: UNIVERSAL LANGUAGE (Vibration, Frequency)")
    output.append("=" * 100)
    output.append("")
    output.append("KEY CONCEPTS:")
    output.append("-" * 100)

    chapter1_segments = [s for s in data['full_transcript']
                        if any(kw in s['text'].lower() for kw in
                              ['vibration', 'frequency', 'resonance', 'sound', 'wave', 'energy', 'atom'])]

    for seg in chapter1_segments[:30]:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    if len(chapter1_segments) > 30:
        output.append(f"\n... {len(chapter1_segments) - 30} more segments in this chapter")

    # Chapter 2: Vortex Math
    output.append("\n" + "=" * 100)
    output.append("CHAPTER 2: VORTEX MATH (Patterns, Torus, Rodin Coils)")
    output.append("=" * 100)
    output.append("")
    output.append("KEY CONCEPTS:")
    output.append("-" * 100)

    chapter2 = data['by_chapter']['Chapter 2: Vortex Math (patterns, torus, Rodin coils)']
    for seg in chapter2:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    # Chapter 3: Sacred Patterns
    output.append("\n" + "=" * 100)
    output.append("CHAPTER 3: SACRED PATTERNS (Fibonacci, Phi, Nature)")
    output.append("=" * 100)
    output.append("")
    output.append("KEY CONCEPTS:")
    output.append("-" * 100)

    chapter3 = data['by_chapter']['Chapter 3: Sacred Patterns (Fibonacci, Phi, nature)']
    for seg in chapter3:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    # Chapter 4: Unified Field
    output.append("\n" + "=" * 100)
    output.append("CHAPTER 4: UNIFIED FIELD (Everything Connected, Tesla)")
    output.append("=" * 100)
    output.append("")
    output.append("KEY CONCEPTS:")
    output.append("-" * 100)

    chapter4 = data['by_chapter']['Chapter 4: Unified Field (everything connected, Tesla)'][:40]
    for seg in chapter4:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    if len(data['by_chapter']['Chapter 4: Unified Field (everything connected, Tesla)']) > 40:
        output.append(f"\n... {len(data['by_chapter']['Chapter 4: Unified Field (everything connected, Tesla)']) - 40} more segments")

    # Chapter 5: Healing Through Harmony
    output.append("\n" + "=" * 100)
    output.append("CHAPTER 5: HEALING THROUGH HARMONY")
    output.append("=" * 100)
    output.append("")
    output.append("KEY CONCEPTS:")
    output.append("-" * 100)

    chapter5 = data['by_chapter']['Chapter 5: Healing Through Harmony'][:30]
    for seg in chapter5:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    if len(data['by_chapter']['Chapter 5: Healing Through Harmony']) > 30:
        output.append(f"\n... {len(data['by_chapter']['Chapter 5: Healing Through Harmony']) - 30} more segments")

    # Chapter 6: Hidden in Plain Sight
    output.append("\n" + "=" * 100)
    output.append("CHAPTER 6: HIDDEN IN PLAIN SIGHT")
    output.append("=" * 100)
    output.append("")
    output.append("KEY CONCEPTS:")
    output.append("-" * 100)

    chapter6 = data['by_chapter']['Chapter 6: Hidden in Plain Sight']
    for seg in chapter6:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    # Important Quotes Section
    output.append("\n" + "=" * 100)
    output.append("IMPORTANT QUOTES FOR BOOK")
    output.append("=" * 100)
    output.append("")

    for quote in data['important_quotes']:
        output.append(f"[{quote['timestamp']}]")
        output.append(f"  \"{quote['quote']}\"")
        output.append("")

    # Mathematical Explanations
    output.append("\n" + "=" * 100)
    output.append("MATHEMATICAL EXPLANATIONS & EQUATIONS")
    output.append("=" * 100)
    output.append("")

    for math_expl in data['math_explanations']:
        output.append(f"[{math_expl['timestamp']}]")
        output.append(f"  {math_expl['content']}")
        output.append("")

    # Visual Descriptions
    output.append("\n" + "=" * 100)
    output.append("VISUAL DESCRIPTIONS (Animations, Graphics, Diagrams)")
    output.append("=" * 100)
    output.append("")

    for visual in data['visual_descriptions']:
        output.append(f"[{visual['timestamp']}]")
        output.append(f"  {visual['description']}")
        output.append("")

    # Narrative Flow
    output.append("\n" + "=" * 100)
    output.append("NARRATIVE FLOW & STORY STRUCTURE")
    output.append("=" * 100)
    output.append("")

    # Find introduction
    intro_segments = data['full_transcript'][:50]
    output.append("INTRODUCTION (First 5 minutes):")
    output.append("-" * 100)
    for seg in intro_segments:
        output.append(f"[{seg['timestamp']}] {seg['text']}")
    output.append("")

    # Find key transitions (every 30 minutes approximately)
    output.append("\nMAJOR NARRATIVE TRANSITIONS:")
    output.append("-" * 100)

    total_duration = 9060  # ~2h 31m in seconds
    transition_points = [900, 1800, 2700, 3600, 4500, 5400, 6300, 7200, 8100]  # Every 15 minutes

    for transition in transition_points:
        if transition < len(data['full_transcript']):
            # Find segment closest to this time
            for item in data['full_transcript']:
                h, m, s = map(int, item['timestamp'].split(':'))
                seconds = h * 3600 + m * 60 + s
                if abs(seconds - transition) <= 30:
                    output.append(f"\nTransition around {item['timestamp']}:")
                    output.append(f"  {item['text']}")
                    break

    # Conclusion
    output.append("\n" + "=" * 100)
    output.append("CONCLUSION & FINAL MESSAGE")
    output.append("=" * 100)
    output.append("")

    conclusion_segments = data['full_transcript'][-100:]
    for seg in conclusion_segments:
        output.append(f"[{seg['timestamp']}] {seg['text']}")

    return "\n".join(output)

def create_topic_analysis(data):
    """Create detailed topic analysis"""

    output = []
    output.append("=" * 100)
    output.append("TOPIC-BASED ANALYSIS FOR BOOK CHAPTERS")
    output.append("=" * 100)
    output.append("")

    # Analyze frequency of key terms
    term_frequency = defaultdict(int)

    for item in data['full_transcript']:
        text = item['text'].lower()
        terms = ['energy', 'frequency', 'vibration', 'tesla', 'unified', 'field',
                'healing', 'consciousness', 'pattern', 'mathematics', 'geometry',
                'fibonacci', 'phi', 'golden', 'torus', 'vortex', 'coil', 'atom']

        for term in terms:
            if term in text:
                term_frequency[term] += 1

    output.append("KEY TERM FREQUENCY ANALYSIS:")
    output.append("-" * 100)
    for term, count in sorted(term_frequency.items(), key=lambda x: x[1], reverse=True):
        output.append(f"  {term}: {count} mentions")
    output.append("")

    # Temporal distribution
    output.append("\nTEMPORAL DISTRIBUTION OF TOPICS:")
    output.append("-" * 100)

    # Break transcript into 10-minute segments and analyze dominant topics
    segment_duration = 600  # 10 minutes in seconds
    current_segment = 0

    while current_segment * segment_duration < 9060:  # Total duration
        segment_start = current_segment * segment_duration
        segment_end = segment_start + segment_duration

        segment_items = []
        for item in data['full_transcript']:
            h, m, s = map(int, item['timestamp'].split(':'))
            seconds = h * 3600 + m * 60 + s
            if segment_start <= seconds < segment_end:
                segment_items.append(item)

        if segment_items:
            # Analyze dominant topics in this segment
            topic_counts = defaultdict(int)
            for item in segment_items:
                text = item['text'].lower()
                for topic in ['energy', 'frequency', 'tesla', 'pattern', 'healing', 'math', 'geometry']:
                    if topic in text:
                        topic_counts[topic] += 1

            if topic_counts:
                dominant_topics = sorted(topic_counts.items(), key=lambda x: x[1], reverse=True)[:3]
                output.append(f"\nMinutes {current_segment * 10}-{(current_segment + 1) * 10}:")
                output.append(f"  Timestamp: {segment_items[0]['timestamp']}")
                output.append(f"  Dominant topics: {', '.join([f'{t}({c})' for t, c in dominant_topics])}")

        current_segment += 1

    return "\n".join(output)

def main():
    print("Loading organized transcript...")
    data = load_organized_transcript()

    print("Creating comprehensive book content...")
    book_content = create_comprehensive_book_content(data)

    output_file = '/Users/michaeldurante/ai dev/ce-hub/THRIVE_II_BOOK_CONTENT.txt'
    with open(output_file, 'w', encoding='utf-8') as f:
        f.write(book_content)

    print(f"✓ Saved comprehensive book content to: {output_file}")

    print("Creating topic analysis...")
    topic_analysis = create_topic_analysis(data)

    topic_file = '/Users/michaeldurante/ai dev/ce-hub/THRIVE_II_TOPIC_ANALYSIS.txt'
    with open(topic_file, 'w', encoding='utf-8') as f:
        f.write(topic_analysis)

    print(f"✓ Saved topic analysis to: {topic_file}")

    print("\n" + "="*100)
    print("BOOK CONTENT GENERATION COMPLETE")
    print("="*100)
    print(f"\nGenerated files:")
    print(f"  1. {output_file} - Comprehensive content organized by chapters")
    print(f"  2. {topic_file} - Topic frequency and temporal distribution")
    print(f"  3. thrive2_transcript_organized.json - Full structured data")
    print(f"  4. thrive2_transcript_readable.txt - Full readable transcript")
    print(f"  5. thrive2_by_chapters.txt - Content organized by chapters")

if __name__ == "__main__":
    main()
