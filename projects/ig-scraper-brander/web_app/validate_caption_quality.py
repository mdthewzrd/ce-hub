"""
Caption Quality Validation Test
Compares BEFORE vs AFTER improvements
"""

import os
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).parent))
from dotenv import load_dotenv
load_dotenv()

import sqlite3
import json
import requests
from datetime import datetime

# Test scenario


def add_emojis_if_needed(caption: str) -> str:
    """Add emojis to caption if there are fewer than 2"""
    # Count existing emojis
    emoji_count = sum(1 for c in caption if ord(c) > 127000)

    # If already has 2-4 emojis, return as-is
    if 2 <= emoji_count <= 5:
        return caption

    # Emojis to use strategically
    emoji_sets = {
        'attention': ['🚨', '💡', '✨', '⚡'],
        'emotion': ['💪', '🔥', '🙌', '😤', '🤯'],
        'action': ['🎯', '👇', '⬇️', '→'],
        'success': ['✅', '🏆', '⭐']
    }

    lines = caption.split('\n')
    result_lines = []
    emoji_index = 0

    for i, line in enumerate(lines):
        # Add emoji to hook (first non-empty line)
        if i == 0 and line.strip() and emoji_count == 0:
            line = line + ' 🚨'
            emoji_count += 1

        # Add emoji to body paragraphs
        elif line.strip() and emoji_count < 3 and len(line) > 20:
            # Alternate between emoji types
            if emoji_index % 2 == 0:
                line = line + ' 💡'
            else:
                line = line + ' 🔥'
            emoji_index += 1
            emoji_count += 1

        result_lines.append(line)

    return '\n'.join(result_lines)


# Test scenario
TEST_VIDEO = {
    "content_type": "tutorial",
    "vibe": "energetic",
    "visual_description": "Person demonstrating proper squat form in a gym, showing knee position and back alignment",
    "core_message": "Proper squat form prevents injury and maximizes muscle activation",
    "value_proposition": "Learn the 3 keys to perfect squat form",
    "target_audience": "Fitness beginners and gym-goers who want to train safely",
    "manychat_keyword": "SQUAT"
}


def generate_caption_production(video_data):
    """Generate caption using the production system with model fallback"""
    api_key = os.getenv("OPENROUTER_API_KEY")

    # Try multiple models in order of preference
    models_to_try = [
        "google/gemini-2.0-flash-exp:free",  # Best for emojis
        "meta-llama/llama-3.3-70b-instruct:free",  # Good fallback
        "mistralai/mistral-small-3.1-24b-instruct:free"  # Another option
    ]

    for model in models_to_try:
        try:
            print(f"Trying model: {model.split('/')[-1]}...")
            caption = _generate_with_model(video_data, api_key, model)
            if caption:
                return caption
        except Exception as e:
            print(f"Model {model} failed: {str(e)[:100]}")
            continue

    return None


def _generate_with_model(video_data, api_key, model):
    """Generate caption using specific model"""
    video_context = f"""## VIDEO FILE INFO
Content Type: {video_data['content_type']}
Vibe/Mood: {video_data['vibe']}

## AI VIDEO ANALYSIS
Content Type: {video_data['content_type']}
Vibe/Mood: {video_data['vibe']}
Emotional Tone: {video_data['vibe']}

## CORE MESSAGE
{video_data['core_message']}

## VALUE PROPOSITION
{video_data['value_proposition']}

## VISUAL DESCRIPTION
{video_data['visual_description']}

## MANYCHAT CONFIGURATION
Keyword: {video_data['manychat_keyword']}
"""

    messages = [
        {
            "role": "system",
            "content": """You are an ELITE Instagram copywriter and conversion psychologist. You write captions that:

✅ STOP THE SCROLL immediately with powerful hooks
✅ Build genuine connection through authenticity
✅ Drive meaningful engagement and comments
✅ Convert naturally through helpful CTAs

## MASTER HOOK PATTERNS (NEVER use "Have you ever" or "I've been thinking")

🎯 CURIOSITY GAPS: "The mistake killing your progress", "What nobody tells you about"
🎯 RELATABLE: "Ever feel like", "Is it just me or"
🎯 STORY: "Can I be honest for a second?", "I'll never forget the moment"
🎯 VALUE: "Save this for later", "You need to hear this"

## MANDATORY: Use 2-4 emojis throughout (💡 🔥 ✨ 🚨 💪 🎯)
## MANDATORY: Include comment-bait question in body
## MANDATORY: Make ManyChat CTA feel helpful, not transactional"""
        },
        {
            "role": "user",
            "content": f"""Generate an Instagram caption. ONLY output the caption itself, no introduction or meta-commentary.

{video_context}

Requirements:
1. HOOK: Curiosity gap or relatable struggle (under 15 words)
2. EMOJIS: 2-4 strategically throughout
3. COMMENT BAIT: Natural question for engagement
4. MANYCHAT CTA: Helpful and natural
5. FORMAT: Short paragraphs, clear breaks

Target: {video_data['target_audience']}

Output the caption directly, no preamble:"""
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
            "max_tokens": 2000
        },
        timeout=60
    )

    if response.status_code == 200:
        result = response.json()
        raw_caption = result['choices'][0]['message']['content']
        print(f"DEBUG: Raw response length: {len(raw_caption)}")

        # Clean up markdown
        caption = raw_caption.replace('**', '').replace('```', '').strip()

        # Extract caption if AI added meta-commentary
        # Look for the actual caption after lines like "Here's your caption:" or "Caption:"
        lines = caption.split('\n')
        caption_start = 0

        for i, line in enumerate(lines):
            # Skip meta-commentary lines
            if any(marker in line.lower() for marker in ['here\'s your', 'caption:', 'instagram caption:', 'master-level']):
                continue
            # Found actual caption content
            if len(line.strip()) > 5:
                caption_start = i
                break

        if caption_start > 0:
            caption = '\n'.join(lines[caption_start:])

        # Post-process: Add emojis if missing (models often ignore emoji instructions)
        caption = add_emojis_if_needed(caption)

        return caption.strip()
    return None


def analyze_caption_quality(caption, keyword):
    """Comprehensive quality analysis"""
    issues = []
    strengths = []
    score = 0

    lines = caption.split('\n')
    hook = lines[0] if lines else ""

    # Hook analysis
    hook_words = len(hook.split())
    if hook_words <= 15:
        strengths.append("✅ Hook is punchy and concise")
        score += 15
    else:
        issues.append("❌ Hook too long - may lose attention")
        score -= 5

    # Hook pattern analysis
    hook_lower = hook.lower()
    bad_patterns = ['have you ever', 'i\'ve been thinking', 'here is', 'here\'s', 'this is']
    if any(bad in hook_lower for bad in bad_patterns):
        issues.append("❌ Overused hook pattern detected")
        score -= 10
    else:
        strengths.append("✅ Original hook pattern")
        score += 15

    # Curiosity elements
    curiosity_words = ['mistake', 'secret', 'nobody', 'truth', 'killing', 'ignore', 'stop']
    if any(word in hook_lower for word in curiosity_words):
        strengths.append("✅ Curiosity gap created")
        score += 10

    # Emoji analysis
    emoji_count = sum(1 for c in caption if ord(c) > 127000)
    if 2 <= emoji_count <= 5:
        strengths.append(f"✅ Good emoji usage ({emoji_count} emojis)")
        score += 15
    elif emoji_count == 0:
        issues.append("❌ No emojis - add visual interest")
        score -= 10
    else:
        issues.append(f"⚠️ Too many emojis ({emoji_count}) - can feel spammy")

    # Comment bait analysis
    comment_bait = ['?', 'thoughts?', 'your take', 'experience', 'agree', 'opinion']
    has_bait = any(bait in caption.lower() for bait in comment_bait)
    if has_bait:
        strengths.append("✅ Comment-bait question included")
        score += 20
    else:
        issues.append("❌ Missing comment bait - add engagement trigger")
        score -= 15

    # Formatting analysis
    if '\n\n' in caption:
        strengths.append("✅ Good paragraph spacing")
        score += 10
    else:
        issues.append("❌ Needs more line breaks for readability")
        score -= 5

    # ManyChat CTA analysis
    keyword_present = keyword.upper() in caption.upper()
    cta_natural = any(phrase in caption.lower() for phrase in ['want more', 'send you', 'share my', 'get the'])
    if keyword_present:
        if cta_natural:
            strengths.append(f"✅ ManyChat CTA is helpful and natural")
            score += 15
        else:
            issues.append("⚠️ ManyChat keyword present but CTA could be more helpful")
            score += 5
    else:
        issues.append(f"❌ Missing ManyChat keyword '{keyword}'")
        score -= 20

    # Personal connection
    personal_words = ['i\'ve', 'i learned', 'my experience', 'let me', 'can i be honest']
    if any(word in caption.lower() for word in personal_words):
        strengths.append("✅ Personal connection established")
        score += 10

    return {
        'caption': caption,
        'hook': hook,
        'hook_length': hook_words,
        'emoji_count': emoji_count,
        'strengths': strengths,
        'issues': issues,
        'score': max(0, min(100, score))
    }


def main():
    print("=" * 100)
    print("CAPTION QUALITY VALIDATION TEST")
    print("=" * 100)
    print(f"\nTest Scenario: {TEST_VIDEO['content_type']} - {TEST_VIDEO['vibe']}")
    print(f"Keyword: {TEST_VIDEO['manychat_keyword']}")
    print(f"\nGenerating caption...\n")

    caption = generate_caption_production(TEST_VIDEO)

    if not caption or caption.startswith("ERROR"):
        print(f"❌ Failed to generate caption: {caption}")
        return

    print("=" * 100)
    print("GENERATED CAPTION")
    print("=" * 100)
    print(caption)
    print("=" * 100)

    print("\n" + "=" * 100)
    print("QUALITY ANALYSIS")
    print("=" * 100)

    analysis = analyze_caption_quality(caption, TEST_VIDEO['manychat_keyword'])

    print(f"\n📊 OVERALL SCORE: {analysis['score']}/100")

    print(f"\n🎣 HOOK: \"{analysis['hook']}\"")
    print(f"   Length: {analysis['hook_length']} words")

    print(f"\n📈 STRENGTHS ({len(analysis['strengths'])}):")
    for strength in analysis['strengths']:
        print(f"   {strength}")

    if analysis['issues']:
        print(f"\n⚠️ ISSUES ({len(analysis['issues'])}):")
        for issue in analysis['issues']:
            print(f"   {issue}")

    print(f"\n📊 EMOJI COUNT: {analysis['emoji_count']}")

    # Verdict
    print("\n" + "=" * 100)
    if analysis['score'] >= 80:
        print("✅ EXCELLENT - Master-level caption quality")
    elif analysis['score'] >= 60:
        print("✅ GOOD - Above average, minor improvements possible")
    elif analysis['score'] >= 40:
        print("⚠️ AVERAGE - Needs some improvements")
    else:
        print("❌ POOR - Significant improvements needed")
    print("=" * 100)

    # Save to database for learning
    print(f"\n💾 Saving to database for learning...")
    try:
        notes_data = json.dumps({
            'test': True,
            'score': analysis['score'],
            'generated_at': datetime.now().isoformat()
        }, indent=2)

        conn = sqlite3.connect('harmonatica.db')
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO ready_content (source_id, video_path, caption, status, notes) VALUES (?, ?, ?, ?, ?)",
            (0, 'test_video.mp4', caption, 'ready', notes_data)
        )

        conn.commit()
        conn.close()
        print("✅ Saved successfully")
    except Exception as e:
        print(f"⚠️ Could not save: {e}")


if __name__ == "__main__":
    main()
