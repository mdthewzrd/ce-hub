"""
Caption Grading System
Tests and grades caption quality across multiple dimensions
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


# Test scenarios with your actual @nuatlantis videos
TEST_VIDEOS = [
    {
        "path": "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/output/originals/@nuatlantis/2026-01-05_00-41-58_UTC.mp4",
        "filename": "2026-01-05_00-41-58_UTC.mp4",
        "content_theme": "Entrepreneurship",
        "manychat_keyword": "GROWTH",
        "target_audience": "Aspiring entrepreneurs"
    },
    {
        "path": "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/output/originals/@nuatlantis/2026-01-08_02-25-16_UTC.mp4",
        "filename": "2026-01-08_02-25-16_UTC.mp4",
        "content_theme": "Mindset",
        "manychat_keyword": "START",
        "target_audience": "Creators and dreamers"
    },
    {
        "path": "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/output/originals/@nuatlantis/2026-01-17_18-48-47_UTC.mp4",
        "filename": "2026-01-17_18-48-47_UTC.mp4",
        "content_theme": "Business",
        "manychat_keyword": "BUILD",
        "target_audience": "Business owners"
    }
]


def generate_caption_with_system(video_info):
    """Generate caption using the production system"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

    messages = [
        {
            "role": "system",
            "content": f"""You are an ELITE Instagram copywriter for {video_info['manychat_keyword']}.

Write captions that:
✅ STOP THE SCROLL with powerful hooks (under 15 words)
✅ Build genuine connection through authenticity
✅ Drive meaningful engagement and comments
✅ Convert naturally through helpful CTAs

HOOK PATTERNS (must use one):
- Curiosity gaps: "The mistake killing your progress"
- Relatable: "Ever feel like stuck?"
- Story: "Can I be honest for a second?"
- Value: "Save this for later"
- Counter-intuitive: "The opposite is true"

MANDATORY:
- 2-4 emojis throughout (💡 🔥 ✨ 🚨 💪 🎯)
- Include comment-bait question
- Make {video_info['manychat_keyword']} CTA feel helpful
- Short paragraphs, clear line breaks"""
        },
        {
            "role": "user",
            "content": f"""Generate a caption for a {video_info['content_theme']} Instagram Reel.

Target: {video_info['target_audience']}
ManyChat keyword: {video_info['manychat_keyword']}

Output ONLY the caption, no introduction."""
        }
    ]

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json"
            },
            json={
                "model": model,
                "messages": messages,
                "max_tokens": 1200,
                "temperature": 0.85
            },
            timeout=60
        )

        if response.status_code == 200:
            result = response.json()
            caption = result['choices'][0]['message']['content'].replace('**', '').replace('```', '').strip()
            return post_process_caption(caption, video_info['manychat_keyword'])

        return f"ERROR: {response.status_code}"

    except Exception as e:
        return f"ERROR: {str(e)}"


def post_process_caption(caption, keyword):
    """Add spacing and emojis if needed"""
    # Add double spacing between paragraphs
    lines = caption.split('\n')
    formatted = []
    prev_content = False

    for line in lines:
        if line.strip():
            if prev_content and len(formatted) > 0 and len(formatted[-1]) > 50:
                formatted.append("")  # Add break before long paragraphs
            formatted.append(line)
            prev_content = True
        else:
            formatted.append(line)
            prev_content = False

    caption = '\n'.join(formatted)

    # Add emojis if missing
    emoji_count = sum(1 for c in caption if ord(c) > 127000)
    if emoji_count < 2:
        lines = caption.split('\n')
        for i, line in enumerate(lines):
            if line.strip() and emoji_count < 2:
                if i == 0:
                    lines[i] = line + ' 🚨'
                elif i == len(lines) - 2:
                    lines[i] = line + ' 🔥'
                emoji_count += 1
        caption = '\n'.join(lines)

    return caption


def grade_caption(caption, video_info):
    """Comprehensive grading system for captions"""

    grades = {}
    feedback = []

    lines = caption.split('\n')
    hook = lines[0] if lines else ""

    # 1. HOOK QUALITY (25 points)
    hook_score = 0
    hook_words = len(hook.split())

    if hook_words <= 12:
        hook_score = 25
        feedback.append("✅ Hook is concise and punchy")
    elif hook_words <= 18:
        hook_score = 20
        feedback.append("✅ Hook length is good")
    elif hook_words <= 25:
        hook_score = 10
        feedback.append("⚠️ Hook is getting long")
    else:
        hook_score = 5
        feedback.append("❌ Hook too long - will lose attention")

    # Hook pattern analysis
    hook_lower = hook.lower()
    bad_patterns = ['have you ever', 'i\'ve been thinking', 'here is', 'here\'s', 'this is']
    if any(bad in hook_lower for bad in bad_patterns):
        hook_score -= 10
        feedback.append("❌ Overused hook pattern")
    else:
        hook_score += 5
        feedback.append("✅ Original hook pattern")

    # Curiosity elements
    curiosity_words = ['mistake', 'secret', 'nobody', 'truth', 'killing', 'ignore', 'stop', 'struggle']
    if any(word in hook_lower for word in curiosity_words):
        hook_score += 5
        feedback.append("✅ Creates curiosity gap")

    grades['hook'] = max(0, min(25, hook_score))

    # 2. EMOJI USAGE (15 points)
    emoji_score = 0
    emoji_count = sum(1 for c in caption if ord(c) > 127000)

    if 2 <= emoji_count <= 4:
        emoji_score = 15
        feedback.append(f"✅ Perfect emoji count ({emoji_count} emojis)")
    elif emoji_count == 1:
        emoji_score = 8
        feedback.append("⚠️ Only 1 emoji - add more visual interest")
    elif emoji_count == 0:
        emoji_score = 0
        feedback.append("❌ No emojis - needs visual interest")
    elif emoji_count > 5:
        emoji_score = 10
        feedback.append("⚠️ Too many emojis - can feel spammy")

    # Emoji placement
    first_3_lines_has_emoji = any(ord(c) > 127000 for line in lines[:3] for c in line)
    if first_3_lines_has_emoji:
        emoji_score += 0
        feedback.append("✅ Emojis well-positioned throughout")
    else:
        emoji_score -= 5
        feedback.append("⚠️ Add emoji in first 3 lines for impact")

    grades['emojis'] = max(0, min(15, emoji_score))

    # 3. COMMENT BAIT (20 points)
    bait_score = 0
    comment_triggers = ['?', 'thoughts?', 'your take', 'experience', 'agree', 'opinion', 'struggle', 'what']

    has_question = '?' in caption
    has_trigger = any(trigger in caption.lower() for trigger in comment_triggers)

    if has_question and has_trigger:
        bait_score = 20
        feedback.append("✅ Strong comment bait included")
    elif has_question:
        bait_score = 15
        feedback.append("✅ Comment question present")
    elif has_trigger:
        bait_score = 10
        feedback.append("⚠️ Engagement trigger present but no question")
    else:
        bait_score = 0
        feedback.append("❌ No comment bait - add engagement trigger")

    grades['comment_bait'] = bait_score

    # 4. MANYCHAT CTA (20 points)
    cta_score = 0
    keyword = video_info['manychat_keyword']
    keyword_upper = keyword.upper()

    if keyword_upper in caption.upper():
        # Check if CTA is helpful
        helpful_phrases = ['want', 'get', 'send', 'text', 'share', 'tips', 'guide', 'exclusive']
        if any(phrase in caption.lower() for phrase in helpful_phrases):
            cta_score = 20
            feedback.append(f"✅ {keyword} CTA is helpful and natural")
        else:
            cta_score = 12
            feedback.append(f"⚠️ {keyword} present but CTA could be more helpful")
    else:
        cta_score = 0
        feedback.append(f"❌ Missing {keyword} keyword")

    grades['cta'] = cta_score

    # 5. SPACING & FORMATTING (10 points)
    format_score = 0

    has_spacing = '\n\n' in caption
    short_lines = sum(1 for l in lines if l.strip() and len(l) < 50)
    total_lines = len([l for l in lines if l.strip()])

    if has_spacing:
        format_score += 5
        feedback.append("✅ Good paragraph spacing")
    else:
        format_score += 2
        feedback.append("⚠️ Could use more paragraph breaks")

    if short_lines >= total_lines * 0.5:
        format_score += 5
        feedback.append("✅ Lines are mobile-friendly")
    else:
        format_score += 2
        feedback.append("⚠️ Some lines may be long on mobile")

    grades['formatting'] = max(0, min(10, format_score))

    # 6. READABILITY & VOICE (10 points)
    readability_score = 0

    # Personal connection
    personal_words = ['i\'ve', 'i learned', 'my experience', 'let me', 'can i be honest', 'we\'ve']
    if any(word in caption.lower() for word in personal_words):
        readability_score += 5
        feedback.append("✅ Personal voice - sounds authentic")

    # You language
    if 'you' in caption.lower() or 'your' in caption.lower():
        readability_score += 5
        feedback.append("✅ Direct address - speaks to viewer")
    else:
        readability_score += 3
        feedback.append("⚠️ Could use more 'you' language")

    grades['readability'] = max(0, min(10, readability_score))

    # Calculate total score
    total_score = sum(grades.values())
    max_score = 25 + 15 + 20 + 20 + 10 + 10  # 100 points

    # Determine letter grade
    if total_score >= 90:
        letter = 'A'
        status = "EXCELLENT - Master-level caption"
    elif total_score >= 80:
        letter = 'B'
        status = "GOOD - Above average"
    elif total_score >= 70:
        letter = 'C'
        status = "AVERAGE - Meets standards"
    elif total_score >= 60:
        letter = 'D'
        status = "BELOW AVERAGE - Needs work"
    else:
        letter = 'F'
        status = "POOR - Significant improvements needed"

    return {
        'caption': caption,
        'grades': grades,
        'total_score': total_score,
        'letter_grade': letter,
        'status': status,
        'feedback': feedback,
        'word_count': len(caption.split()),
        'char_count': len(caption),
        'line_count': len(lines),
        'emoji_count': emoji_count
    }


def display_grade_result(video_info, result):
    """Display grading results in a beautiful format"""

    print(f"\n{'=' * 100}")
    print(f"VIDEO: {video_info['filename']}")
    print(f"Theme: {video_info['content_theme']} | Keyword: {video_info['manychat_keyword']}")
    print(f"{'=' * 100}")

    print("\n📝 GENERATED CAPTION:")
    print("─" * 100)
    print(result['caption'])
    print("─" * 100)

    print(f"\n📊 GRADE BREAKDOWN:")
    print("─" * 100)

    grades = result['grades']
    print(f"  Hook Quality:       {grades['hook']:>2}/25  {'✅' if grades['hook'] >= 20 else '⚠️' if grades['hook'] >= 15 else '❌'}")
    print(f"  Emoji Usage:        {grades['emojis']:>2}/15  {'✅' if grades['emojis'] >= 12 else '⚠️' if grades['emojis'] >= 8 else '❌'}")
    print(f"  Comment Bait:       {grades['comment_bait']:>2}/20  {'✅' if grades['comment_bait'] >= 15 else '⚠️' if grades['comment_bait'] >= 10 else '❌'}")
    print(f"  ManyChat CTA:       {grades['cta']:>2}/20  {'✅' if grades['cta'] >= 15 else '⚠️' if grades['cta'] >= 10 else '❌'}")
    print(f"  Spacing/Format:     {grades['formatting']:>2}/10  {'✅' if grades['formatting'] >= 8 else '⚠️' if grades['formatting'] >= 5 else '❌'}")
    print(f"  Readability:        {grades['readability']:>2}/10  {'✅' if grades['readability'] >= 8 else '⚠️' if grades['readability'] >= 5 else '❌'}")

    print(f"  {'─' * 40}")
    print(f"  TOTAL SCORE:        {result['total_score']:>3}/100  {result['letter_grade']} - {result['status']}")
    print("─" * 100)

    print(f"\n📏 METRICS:")
    print(f"  Words: {result['word_count']} (ideal: 50-100)")
    print(f"  Characters: {result['char_count']} (ideal: 200-500)")
    print(f"  Lines: {result['line_count']} (ideal: 4-8)")
    print(f"  Emojis: {result['emoji_count']} (ideal: 2-4)")

    print(f"\n💬 FEEDBACK:")
    for item in result['feedback'][:10]:  # Show first 10
        print(f"  {item}")

    if len(result['feedback']) > 10:
        print(f"  ... and {len(result['feedback']) - 10} more items")

    # Save to database
    try:
        conn = sqlite3.connect('/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/web_app/harmonatica.db')
        cursor = conn.cursor()

        notes = {
            'test': True,
            'graded': True,
            'score': result['total_score'],
            'letter_grade': result['letter_grade'],
            'grades': result['grades'],
            'feedback': result['feedback'],
            'video_file': video_info['filename'],
            'generated_at': datetime.now().isoformat()
        }

        cursor.execute(
            "INSERT INTO ready_content (source_id, video_path, caption, status, notes) VALUES (?, ?, ?, ?, ?)",
            (0, video_info['path'], result['caption'], 'ready', str(notes))
        )

        conn.commit()
        conn.close()
        print("\n💾 Saved to database")

    except Exception as e:
        print(f"\n⚠️ Could not save: {e}")

    print(f"\n{'=' * 100}\n")


def main():
    print("=" * 100)
    print("HARMONATICA CAPTION GRADING SYSTEM")
    print("=" * 100)
    print("\nTesting with your actual @nuatlantis videos...")
    print("Grading across 6 dimensions for comprehensive quality assessment\n")

    results = []

    for video in TEST_VIDEOS:
        # Check if video file exists
        if not os.path.exists(video['path']):
            print(f"\n⚠️ Video not found: {video['filename']}")
            continue

        # Generate caption
        print(f"🎬 Processing: {video['filename']}")
        print(f"   Theme: {video['content_theme']}")
        print(f"   Keyword: {video['manychat_keyword']}")

        caption = generate_caption_with_system(video)

        if caption and not caption.startswith("ERROR"):
            # Grade the caption
            result = grade_caption(caption, video)
            results.append(result)

            # Display results
            display_grade_result(video, result)
        else:
            print(f"   ❌ Failed: {caption}")

    # Summary
    if results:
        print("\n" + "=" * 100)
        print("📊 CLASS SUMMARY")
        print("=" * 100)

        avg_score = sum(r['total_score'] for r in results) / len(results)
        avg_letter = ''.join([r['letter_grade'] for r in results])

        print(f"\n  Average Score: {avg_score:.1f}/100")
        print(f"  Average Grade: {avg_letter}")

        print(f"\n  Score Distribution:")
        for letter in ['A', 'B', 'C', 'D', 'F']:
            count = sum(1 for r in results if r['letter_grade'] == letter)
            if count > 0:
                print(f"    {letter}: {count} caption(s) - {count * 100 // len(results)}%")

        print(f"\n  Best Caption: {max(results, key=lambda x: x['total_score'])['letter_grade']} ({max(r['total_score'] for r in results)}/100)")
        print(f"  Worst Caption: {min(results, key=lambda x: x['total_score'])['letter_grade']} ({min(r['total_score'] for r in results)}/100)")

        print("\n" + "=" * 100)


if __name__ == "__main__":
    main()
