"""
Harmonatica Production Test
Tests caption generation with real @nuatlantis videos
Shows Instagram preview formatting
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent / 'projects' / 'ig-scraper-brander' / 'web_app'))

from dotenv import load_dotenv
load_dotenv()

import sqlite3
import requests
from datetime import datetime


def get_sample_videos():
    """Get sample @nuatlantis videos for testing"""
    videos = [
        {
            "path": "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/output/originals/@nuatlantis/2026-01-05_00-41-58_UTC.mp4",
            "filename": "2026-01-05_00-41-58_UTC.mp4",
            "date": "2026-01-05",
            "account": "@nuatlantis"
        },
        {
            "path": "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/output/originals/@nuatlantis/2026-01-08_02-25-16_UTC.mp4",
            "filename": "2026-01-08_02-25-16_UTC.mp4",
            "date": "2026-01-08",
            "account": "@nuatlantis"
        },
        {
            "path": "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/output/originals/@nuatlantis/2026-01-17_18-48-47_UTC.mp4",
            "filename": "2026-01-17_18-48-47_UTC.mp4",
            "date": "2026-01-17",
            "account": "@nuatlantis"
        }
    ]
    return videos


def generate_caption_production_v2(video_info):
    """Generate caption using the enhanced production system"""
    api_key = os.getenv("OPENROUTER_API_KEY")

    # Try Gemini first for emojis, fallback to Llama
    models_to_try = [
        "google/gemini-2.0-flash-exp:free",
        "meta-llama/llama-3.3-70b-instruct:free"
    ]

    for model in models_to_try:
        try:
            caption = _generate_with_model(video_info, api_key, model)
            if caption and not caption.startswith("ERROR"):
                return add_emojis_if_needed(caption)
        except Exception as e:
            print(f"  Model {model.split('/')[-1]} failed: {str(e)[:50]}")
            continue

    return None


def _generate_with_model(video_info, api_key, model):
    """Generate with specific model"""
    # Generic video analysis for testing
    video_analysis = f"""
## VIDEO FILE
Filename: {video_info['filename']}
Account: {video_info['account']}
Date: {video_info['date']}

## VIDEO CONTENT
This is an Instagram Reel from @{video_info['account']}.
Content type: motivational/business/lifestyle
Target audience: Entrepreneurs, creators, and people looking for inspiration

## CAPTION REQUIREMENTS
- Generate based on motivational/business content theme
- Use engaging hook pattern
- Include emojis strategically
- Add comment-bait question
- Natural ManyChat CTA with keyword GROWTH
"""

    messages = [
        {
            "role": "system",
            "content": """You are an ELITE Instagram copywriter. Generate captions that:
✅ STOP THE SCROLL with powerful hooks
✅ Build genuine connection
✅ Drive engagement and comments
✅ Convert naturally through helpful CTAs

HOOK PATTERNS:
- Curiosity: "The mistake killing your progress"
- Relatable: "Ever feel like stuck?"
- Story: "Can I be honest for a second?"
- Value: "Save this for later"

MANDATORY:
- Use 2-4 emojis (💡 🔥 ✨ 🚨 💪 🎯)
- Include comment-bait question
- Make ManyChat CTA feel helpful"""
        },
        {
            "role": "user",
            "content": f"""Generate an Instagram caption. Output ONLY the caption, no intro.

{video_analysis}

Requirements:
1. Hook: Curiosity or relatable (under 15 words)
2. Emojis: 2-4 strategically throughout
3. Comment bait: Natural question
4. ManyChat CTA: Helpful with keyword GROWTH
5. Format: Short paragraphs, clear breaks

Output the caption now:"""
        }
    ]

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://harmonatica.app"
        },
        json={
            "model": model,
            "messages": messages,
            "temperature": 0.85,
            "max_tokens": 1500
        },
        timeout=60
    )

    if response.status_code == 200:
        result = response.json()
        return result['choices'][0]['message']['content'].replace('**', '').replace('```', '').strip()

    return f"ERROR: {response.status_code}"


def add_emojis_if_needed(caption: str) -> str:
    """Add emojis if missing"""
    emoji_count = sum(1 for c in caption if ord(c) > 127000)

    if 2 <= emoji_count <= 5:
        return caption

    lines = caption.split('\n')
    result_lines = []

    for i, line in enumerate(lines):
        if i == 0 and line.strip() and emoji_count == 0:
            line = line + ' 🚨'
            emoji_count += 1
        elif line.strip() and emoji_count < 3 and len(line) > 20:
            line = line + ' 💡' if emoji_count % 2 == 0 else line + ' 🔥'
            emoji_count += 1

        result_lines.append(line)

    return '\n'.join(result_lines)


def display_instagram_preview(caption, video_info):
    """Display caption as it would appear on Instagram"""
    print("\n" + "=" * 100)
    print("📱 INSTAGRAM PREVIEW")
    print("=" * 100)

    # Instagram header
    print(f"\n{'👤 @nuatlantis':<20} {'Following ✓':>20}")
    print(f"{'Original Audio':<30} {'🎵':>5}")

    print("\n" + "-" * 100)
    print("CAPTION:")
    print("-" * 100)

    # Caption with Instagram-style wrapping
    words = caption.split()
    line = ""
    for word in words:
        test_line = line + " " + word if line else word
        if len(test_line) <= 40:  # Instagram wraps around 40 chars
            line = test_line
        else:
            print(line)
            line = word
    if line:
        print(line)

    print("\n" + "-" * 100)

    # Metrics analysis
    lines = caption.split('\n')
    hook = lines[0] if lines else ""

    print("\n📊 ANALYSIS:")
    print(f"   Hook length: {len(hook.split())} words {'✅' if len(hook.split()) <= 15 else '❌'}")
    print(f"   Line count: {len(lines)} {'✅' if 3 <= len(lines) <= 8 else '⚠️'}")
    print(f"   Emoji count: {sum(1 for c in caption if ord(c) > 127000)} {'✅' if 2 <= sum(1 for c in caption if ord(c) > 127000) <= 5 else '❌'}")
    print(f"   Has question: {'✅' if '?' in caption else '❌'}")
    print(f"   Has GROWTH keyword: {'✅' if 'GROWTH' in caption else '❌'}")

    # Check spacing
    has_good_spacing = '\n\n' in caption or len([l for l in lines if l.strip() == '']) >= 1
    print(f"   Good spacing: {'✅' if has_good_spacing else '❌'}")

    print("\n" + "=" * 100)


def analyze_spacing_readability(caption):
    """Analyze spacing and readability"""
    lines = caption.split('\n')

    print("\n" + "=" * 100)
    print("📖 SPACING & READABILITY ANALYSIS")
    print("=" * 100)

    # Line length distribution
    print("\n📏 LINE LENGTH DISTRIBUTION:")
    for i, line in enumerate(lines[:10], 1):  # First 10 lines
        if line.strip():
            length_status = "✅" if 10 <= len(line) <= 80 else "⚠️"
            print(f"   Line {i}: {len(line):3} chars {length_status} - '{line[:60]}{'...' if len(line) > 60 else ''}'")

    # Spacing analysis
    print("\n📐 SPACING ANALYSIS:")
    empty_lines = len([l for l in lines if l.strip() == ''])
    double_spaces = caption.count('\n\n')

    print(f"   Empty lines: {empty_lines} {'✅ Good breaks' if 1 <= empty_lines <= 3 else '⚠️ Too many' if empty_lines > 3 else '❌ Need more'}")
    print(f"   Double spacing: {double_spaces} instances {'✅' if double_spaces >= 1 else '❌'}")

    # Readability score
    avg_line_length = sum(len(l) for l in lines if l.strip()) / max(1, len([l for l in lines if l.strip()]))

    print(f"\n📊 READABILITY SCORE:")
    if avg_line_length < 30:
        print("   ✅ Excellent - Easy to scan")
    elif avg_line_length < 50:
        print("   ✅ Good - Readable")
    elif avg_line_length < 70:
        print("   ⚠️ Fair - Some lines long")
    else:
        print("   ❌ Poor - Lines too long")


def main():
    print("=" * 100)
    print("HARMONATICA PRODUCTION TEST")
    print("=" * 100)

    videos = get_sample_videos()

    for i, video in enumerate(videos, 1):
        print(f"\n{'=' * 100}")
        print(f"VIDEO {i}/{len(videos)}: {video['filename']}")
        print(f"{'=' * 100}")
        print(f"Path: {video['path']}")

        # Generate caption
        print("\n🤖 Generating caption...")
        caption = generate_caption_production_v2(video)

        if not caption:
            print("❌ Failed to generate caption")
            continue

        # Display Instagram preview
        display_instagram_preview(caption, video)

        # Spacing analysis
        analyze_spacing_readability(caption)

        # Save to database
        print(f"\n💾 Saving to database...")
        try:
            conn = sqlite3.connect('/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/web_app/harmonatica.db')
            cursor = conn.cursor()

            notes = {
                'test': True,
                'video_file': video['filename'],
                'generated_at': datetime.now().isoformat()
            }

            cursor.execute(
                "INSERT INTO ready_content (source_id, video_path, caption, status, notes) VALUES (?, ?, ?, ?, ?)",
                (0, video['path'], caption, 'ready', str(notes))
            )

            conn.commit()
            conn.close()
            print("✅ Saved successfully")
        except Exception as e:
            print(f"⚠️ Could not save: {e}")


if __name__ == "__main__":
    main()
