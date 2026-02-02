#!/usr/bin/env python3
"""
Simplified Caption Hook Testing Script

Tests caption generation with improved hook patterns using actual database content
"""

import os
import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent))
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import caption generation service
from ai_caption_service import (
    OpenRouterClient,
    remove_chapter_labels_and_headers,
    filter_shadowban_triggers,
    format_for_mobile_readability,
    improve_caption_spacing,
    add_emojis_if_needed,
    enforce_hook_length_limit
)

# Database path
DB_PATH = Path(__file__).parent.parent.parent / "harmonatica.db"


def get_test_content() -> List[Dict]:
    """Get test content from database"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, account, original_caption,
               original_likes, original_views, engagement_rate
        FROM source_content
        WHERE original_caption IS NOT NULL
          AND LENGTH(original_caption) > 100
        ORDER BY RANDOM()
        LIMIT 5
    """)

    content = [dict(row) for row in cursor.fetchall()]
    conn.close()

    return content


def get_brand_voice() -> Dict:
    """Get Harmonatica brand voice"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    cursor.execute("""
        SELECT id, account_username, profile_name,
               caption_length_preference, emoji_usage, hashtag_usage,
               brand_voice_description, tone_style, writing_style,
               spacing_style, manychat_keyword
        FROM brand_voice_profiles
        WHERE account_username = 'harmonatica'
        LIMIT 1
    """)

    row = cursor.fetchone()
    conn.close()

    return dict(row) if row else None


def evaluate_hook_strength(caption: str) -> Dict:
    """Evaluate hook strength"""
    lines = caption.split('\n')
    first_line = lines[0].strip() if lines else ""

    issues = []
    strengths = []
    score = 5.0

    # Check 1: Length
    if len(first_line) > 150:
        issues.append("Hook too long")
        score -= 2
    elif len(first_line) < 30:
        issues.append("Hook too short")
        score -= 1
    else:
        strengths.append("Good length")
        score += 1

    # Check 2: Weak openings
    weak_openings = [
        "have you ever", "i've been thinking", "today i want to talk",
        "in this video", "welcome back", "hey everyone", "i wanted to talk"
    ]

    first_lower = first_line.lower()
    if any(weak in first_lower for weak in weak_openings):
        issues.append("Weak opening pattern")
        score -= 2
    else:
        strengths.append("Avoids weak openings")

    # Check 3: Strong patterns
    strong_patterns = {
        "curiosity_gap": ["what nobody tells you", "the mistake killing", "stop ignoring", "why nobody"],
        "counter_intuitive": ["the opposite is true", "you've been lied to", "unpopular opinion"],
        "value_promise": ["the one thing", "this changed everything", "i finally figured out"],
        "personal_story": ["i'll never forget", "here's what i learned", "can i be honest"],
    }

    pattern_found = False
    for pattern_type, phrases in strong_patterns.items():
        if any(phrase in first_lower for phrase in phrases):
            strengths.append(f"Strong {pattern_type}")
            score += 2
            pattern_found = True
            break

    if not pattern_found:
        if any(word in first_lower for word in ["secret", "hidden", "mistake", "truth", "nobody"]):
            strengths.append("Has curiosity elements")
            score += 1

    # Check 4: Questions
    if '?' in first_line:
        strengths.append("Uses question")
        score += 1

    # Check 5: Emotional words
    emotional_words = ["pain", "struggle", "fear", "love", "hate", "obsessed", "terrified", "excited"]
    if any(word in first_lower for word in emotional_words):
        strengths.append("Emotional language")
        score += 1

    score = max(0, min(10, score))

    return {
        "score": round(score, 1),
        "hook_text": first_line,
        "issues": issues,
        "strengths": strengths
    }


def generate_test_caption(client: OpenRouterClient, content: Dict, brand_voice: Dict) -> str:
    """Generate a test caption with improved hooks"""

    # Build the system prompt with improved hook patterns
    system_prompt = f"""You are an ELITE Instagram copywriter specializing in scroll-stopping hooks.

## 🚨 CRITICAL: THE FIRST 1-2 LINES ARE EVERYTHING

Most people NEVER click "more". Your hook MUST work in the preview.

❌ NEVER USE THESE WEAK OPENINGS:
- "Have you ever..."
- "I've been thinking about..."
- "Today I want to share..."
- "In this video I'll show..."
- "Welcome back to my channel"
- "Hey everyone, today..."
- "I wanted to talk about..."

✅ USE THESE POWER HOOK PATTERNS:

🎯 CURIOSITY GAPS (Negative):
- "Stop ignoring this sign"
- "The mistake killing your [result]"
- "What nobody tells you about [topic]"
- "You've been doing [topic] wrong"
- "The silent killer of your [goal]"

🎯 CURIOSITY GAPS (Positive):
- "The one thing that changed everything"
- "I finally figured out [topic]"
- "This shifted my entire perspective"
- "This single hack transformed my [result]"

🎯 COUNTER-INTUITIVE:
- "The opposite is actually true"
- "Unpopular opinion but..."
- "You've been lied to about [topic]"
- "Everything you know about [topic] is wrong"

🎯 PERSONAL REVELATION:
- "I'll never forget the moment"
- "Here's something I learned the hard way"
- "Can I be honest for a second?"
- "This is uncomfortable to admit..."

🎯 DIRECT CHALLENGE:
- "What if I told you..."
- "Let me ask you something"
- "Ready for the truth?"
- "Here's what nobody wants to admit"

## BRAND VOICE: {brand_voice.get('brand_voice_description', 'Authentic and engaging')}

## CRITICAL PRODUCTION RULES:
- NO section headers (no "HOOK:", "BODY:", etc.)
- NO meta-commentary
- Start directly with the caption content
- NO emojis in the first line/hook
- NO hashtags (brand voice preference: {brand_voice.get('hashtag_usage', 'none')})
- Caption length: {brand_voice.get('caption_length_preference', 'medium')}
- Emoji usage: {brand_voice.get('emoji_usage', 'minimal')} max
- Spacing: {brand_voice.get('spacing_style', 'standard')}

Write a production-ready Instagram caption now."""

    # Build user prompt from original caption
    original_caption = content.get('original_caption', '')
    account = content.get('account', '')

    user_prompt = f"""Write a scroll-stopping Instagram caption for this content.

ORIGINAL CAPTION (for context):
{original_caption[:500]}

Account: @{account}

Your task: Create a fresh, unique caption with a POWERFUL hook that stops the scroll.
Focus on the first 1-2 lines - they must be impossible to scroll past.

Generate the caption now:"""

    # Generate caption
    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = client.generate_completion(
            messages=messages,
            temperature=0.7,
            max_tokens=1500
        )

        if "choices" in response and len(response["choices"]) > 0:
            caption = response["choices"][0]["message"]["content"].strip()

            # Apply post-processing to clean up formatting
            caption = remove_chapter_labels_and_headers(caption)
            caption = filter_shadowban_triggers(caption)
            caption = format_for_mobile_readability(caption)
            caption = improve_caption_spacing(caption)
            caption = add_emojis_if_needed(caption)
            caption = enforce_hook_length_limit(caption)  # Enforce mobile preview limit

            return caption
        else:
            return None

    except Exception as e:
        print(f"  ❌ Error generating caption: {e}")
        return None


def main():
    """Main testing function"""
    print("\n" + "="*70)
    print("🧪 CAPTION HOOK OPTIMIZATION TESTING")
    print("="*70)

    # Get test data
    print("\n📦 Loading test data...")
    content_list = get_test_content()
    brand_voice = get_brand_voice()

    if not content_list:
        print("❌ No test content found!")
        return

    if not brand_voice:
        print("❌ No brand voice found!")
        return

    print(f"   ✓ Found {len(content_list)} test content items")
    print(f"   ✓ Brand voice: {brand_voice['profile_name']}")
    print(f"   ✓ Preferences: {brand_voice['caption_length_preference']} length, {brand_voice['emoji_usage']} emojis, {brand_voice['hashtag_usage']} hashtags")

    # Initialize client
    client = OpenRouterClient()

    # Test results
    results = []
    hook_scores = []

    # Run tests
    for i, content in enumerate(content_list, 1):
        print(f"\n{'='*70}")
        print(f"Test {i}/{len(content_list)}: Content ID {content['id']}")
        print(f"{'='*70}")

        print(f"  Original: {content['original_caption'][:80]}...")

        # Generate caption
        print("  → Generating caption...")
        caption = generate_test_caption(client, content, brand_voice)

        if not caption:
            print("  ❌ Failed to generate caption")
            continue

        # Evaluate hook
        print("  → Evaluating hook strength...")
        hook_eval = evaluate_hook_strength(caption)
        hook_scores.append(hook_eval['score'])

        # Display results
        print(f"\n  📊 Results:")
        print(f"     Hook Score: {hook_eval['score']}/10")
        print(f"     Hook: \"{hook_eval['hook_text']}\"")

        if hook_eval['strengths']:
            print(f"     ✓ Strengths: {', '.join(hook_eval['strengths'][:3])}")

        if hook_eval['issues']:
            print(f"     ⚠️  Issues: {', '.join(hook_eval['issues'])}")

        print(f"\n  📝 Full Caption:")
        print("  " + "-"*66)
        for line in caption.split('\n')[:10]:  # Show first 10 lines
            print(f"  {line}")
        if len(caption.split('\n')) > 10:
            print("  ...")
        print("  " + "-"*66)

        results.append({
            "content_id": content['id'],
            "hook_score": hook_eval['score'],
            "hook_text": hook_eval['hook_text'],
            "caption": caption
        })

    # Print summary
    print("\n" + "="*70)
    print("📊 TEST SUMMARY")
    print("="*70)

    if hook_scores:
        avg_score = sum(hook_scores) / len(hook_scores)
        strong_hooks = [s for s in hook_scores if s >= 7]
        weak_hooks = [s for s in hook_scores if s < 6]

        print(f"\n📈 Metrics:")
        print(f"   Average Hook Score: {avg_score:.1f}/10")
        print(f"   Strong Hooks (≥7): {len(strong_hooks)}/{len(hook_scores)} ({len(strong_hooks)/len(hook_scores)*100:.0f}%)")
        print(f"   Weak Hooks (<6): {len(weak_hooks)}/{len(hook_scores)} ({len(weak_hooks)/len(hook_scores)*100:.0f}%)")

        # Best hooks
        print(f"\n🏆 Best Hooks:")
        for r in sorted(results, key=lambda x: x['hook_score'], reverse=True)[:3]:
            print(f"   {r['hook_score']}/10: \"{r['hook_text']}\"")

        # Recommendations
        print(f"\n💡 Recommendations:")
        if avg_score < 6:
            print("   🚨 URGENT: Hooks need major improvement")
            print("   → Add more curiosity gaps")
            print("   → Use stronger emotional language")
        elif avg_score < 7:
            print("   ⚠️  Hooks need refinement")
            print("   → Test more counter-intuitive statements")
            print("   → Add specific numbers and claims")
        else:
            print("   ✅ Hooks are performing well!")

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = Path(__file__).parent / f"hook_test_results_{timestamp}.json"

    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "brand_voice": brand_voice['profile_name'],
            "avg_hook_score": sum(hook_scores) / len(hook_scores) if hook_scores else 0,
            "results": results
        }, f, indent=2)

    print(f"\n💾 Results saved to: {results_file}")
    print("\n✅ Testing complete!")


if __name__ == "__main__":
    main()
