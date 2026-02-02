#!/usr/bin/env python3
"""
Improved Caption Hook Testing - Focused on SHORT, Punchy Hooks

Tests caption generation with emphasis on 2-line maximum hooks for mobile
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
from ai_caption_service import OpenRouterClient

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
    """Evaluate hook strength with emphasis on mobile optimization"""
    lines = caption.split('\n')
    first_line = lines[0].strip() if lines else ""
    second_line = lines[1].strip() if len(lines) > 1 else ""

    # Combine first two lines for "before more" preview
    preview_text = f"{first_line} {second_line}".strip()

    issues = []
    strengths = []
    score = 5.0

    # Check 1: Combined preview length (CRITICAL for mobile)
    if len(preview_text) > 140:  # Twitter-style limit for Instagram preview
        issues.append(f"Preview too long ({len(preview_text)} chars - will be truncated)")
        score -= 3
    elif len(preview_text) < 50:
        issues.append("Preview too short - lacks substance")
        score -= 1
    else:
        strengths.append("Good mobile preview length")
        score += 2

    # Check 2: First line length (should be punchy)
    if len(first_line) > 80:
        issues.append("First line too long")
        score -= 1
    elif len(first_line) < 20:
        issues.append("First line too short")
        score -= 0.5
    else:
        strengths.append("Punchy first line")
        score += 1

    # Check 3: Weak openings
    weak_openings = [
        "have you ever", "i've been thinking", "today i want to talk",
        "in this video", "welcome back", "hey everyone", "i wanted to talk",
        "here is", "below is", "following is"
    ]

    first_lower = first_line.lower()
    if any(weak in first_lower for weak in weak_openings):
        issues.append("Weak opening pattern")
        score -= 2
    else:
        strengths.append("Avoids weak openings")

    # Check 4: Strong patterns
    strong_patterns = {
        "curiosity_gap": ["nobody tells you", "mistake killing", "stop ignoring", "why nobody", "hidden", "secret"],
        "counter_intuitive": ["opposite is true", "been lied to", "unpopular opinion", "wrong"],
        "value_promise": ["one thing", "changed everything", "finally figured", "single hack"],
        "personal_story": ["never forget", "learned hard way", "can i be honest", "uncomfortable"],
        "direct_challenge": ["what if i told", "let me ask", "ready for truth", "nobody wants"],
    }

    pattern_found = False
    for pattern_type, phrases in strong_patterns.items():
        if any(phrase in first_lower for phrase in phrases):
            strengths.append(f"Strong {pattern_type}")
            score += 2
            pattern_found = True
            break

    if not pattern_found:
        if any(word in first_lower for word in ["secret", "hidden", "mistake", "truth", "nobody", "everyone", "stop", "killing"]):
            strengths.append("Has curiosity elements")
            score += 0.5

    # Check 5: Questions (great for engagement)
    if '?' in first_line:
        strengths.append("Uses question format")
        score += 1

    # Check 6: Numbers (adds specificity)
    if any(char.isdigit() for char in first_line):
        strengths.append("Includes specific number")
        score += 0.5

    # Check 7: Emotional words
    emotional_words = ["pain", "struggle", "fear", "love", "hate", "kill", "dead", "obsessed", "terrified"]
    if any(word in first_lower for word in emotional_words):
        strengths.append("Strong emotional word")
        score += 1

    # Check 8: Second line hooks into content
    if second_line:
        if len(second_line) < 100:
            strengths.append("Good second line length")
            score += 0.5
        else:
            issues.append("Second line too long")

    score = max(0, min(10, score))

    return {
        "score": round(score, 1),
        "hook_text": first_line,
        "second_line": second_line,
        "preview_text": preview_text,
        "preview_length": len(preview_text),
        "issues": issues,
        "strengths": strengths
    }


def generate_improved_caption(client: OpenRouterClient, content: Dict, brand_voice: Dict) -> str:
    """Generate a caption with improved SHORT hooks"""

    system_prompt = f"""You are an ELITE Instagram copywriter. Your specialty: WRITING HOOKS THAT STOP THE SCROLL.

## 🚨 THE MOST CRITICAL RULE: 2 LINES MAX

Your hook must be COMPLETELY VISIBLE before the "more" button on mobile.

❌ WEAK HOOK EXAMPLES (too long, generic):
- "Have you ever wondered why it's so hard to achieve your goals in life?"
- "I've been thinking a lot lately about the nature of reality and..."
- "Today I want to talk about something that changed my perspective..."

✅ POWER HOOK EXAMPLES (short, punchy, curious):
- "The mistake killing your progress"
- "What nobody tells you about [topic]"
- "This single hack changed everything"
- "You've been doing [topic] wrong"
- "The truth they don't want you to know"

## PROVEN HOOK FORMULAS (use these EXACT patterns):

🎯 NEGATIVE CURIOSITY (fear of missing/wrong):
- "Stop ignoring [specific thing]"
- "The mistake killing [desired result]"
- "What nobody tells you about [topic]"
- "You've been lied to about [topic]"
- "The [result] killer hiding in plain sight"
- "Why [common approach] fails"

🎯 POSITIVE CURIOSITY (anticipation):
- "The one thing that changed everything"
- "This shifted my entire perspective"
- "Finally figured out [topic]"
- "This single hack transformed my [result]"
- "The breakthrough that made the difference"

🎯 COUNTER-INTUITIVE (challenges beliefs):
- "The opposite is actually true"
- "Unpopular opinion: [contrarian view]"
- "Everything you know about [topic] is wrong"
- "Why [common advice] is dead wrong"

🎯 PERSONAL REVELATION (vulnerability):
- "I'll never forget that moment"
- "Here's what I learned the hard way"
- "Can I be honest for a second?"
- "This is uncomfortable to admit..."

🎯 DIRECT CHALLENGE (engagement):
- "What if I told you..."
- "Let me ask you something"
- "Ready for the truth?"
- "Here's what nobody wants to admit"

## CRITICAL PRODUCTION RULES:

1. HOOK LENGTH: Maximum 2 lines, 140 characters total
2. NO section headers (no "HOOK:", "BODY:", "**STORY**", etc.)
3. NO meta-commentary or explanations
4. Start directly with the caption text - NO preamble
5. NO emojis in the hook
6. NO hashtags (brand voice: {brand_voice.get('hashtag_usage', 'none')})
7. Length: {brand_voice.get('caption_length_preference', 'medium')}
8. Emojis: {brand_voice.get('emoji_usage', 'minimal')} max total
9. Spacing: {brand_voice.get('spacing_style', 'standard')}

## BRAND VOICE:
{brand_voice.get('brand_voice_description', 'Authentic and engaging')}

## IMPORTANT: WRITE THE ACTUAL CAPTION ONLY

Do NOT write "Here's a caption:" or include any headers. Just write the caption itself, starting with the hook.

Generate a production-ready Instagram caption now."""

    # Build user prompt
    original_caption = content.get('original_caption', '')
    account = content.get('account', '')

    # Extract key themes from original caption
    themes = []
    if 'biofield' in original_caption.lower():
        themes.append('biofield energy')
    if 'hidden' in original_caption.lower() or 'secret' in original_caption.lower():
        themes.append('hidden knowledge')
    if 'power' in original_caption.lower():
        themes.append('personal power')
    if 'ancient' in original_caption.lower() or 'temple' in original_caption.lower():
        themes.append('ancient wisdom')
    if 'aura' in original_caption.lower() or 'energy' in original_caption.lower():
        themes.append('energy activation')

    theme_text = ', '.join(themes) if themes else 'transformation and hidden knowledge'

    user_prompt = f"""Write a scroll-stopping Instagram caption.

ORIGINAL CONTEXT (for understanding themes, NOT to copy):
{original_caption[:300]}

Key themes: {theme_text}
Account: @{account}

CRITICAL INSTRUCTIONS:
1. Start IMMEDIATELY with the hook - no preamble, no "here's a caption"
2. Write a SHORT, PUNCHY hook (max 2 lines, 140 chars total)
3. Use one of the proven hook formulas from the system prompt
4. Make it impossible to scroll past
5. Then expand into a {brand_voice.get('caption_length_preference', 'medium')} caption
6. NO section headers or labels

Write the caption now, starting directly with the hook:"""

    messages = [
        {"role": "system", "content": system_prompt},
        {"role": "user", "content": user_prompt}
    ]

    try:
        response = client.generate_completion(
            messages=messages,
            temperature=0.8,  # Slightly higher for more creative hooks
            max_tokens=2000
        )

        if "choices" in response and len(response["choices"]) > 0:
            return response["choices"][0]["message"]["content"].strip()
        else:
            return None

    except Exception as e:
        print(f"  ❌ Error generating caption: {e}")
        return None


def main():
    """Main testing function"""
    print("\n" + "="*70)
    print("🧪 IMPROVED CAPTION HOOK TESTING")
    print("="*70)
    print("\n📱 Focused on MOBILE-OPTIMIZED, SHORT hooks")
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

        # Generate caption
        print("  → Generating caption with improved hook patterns...")
        caption = generate_improved_caption(client, content, brand_voice)

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
        print(f"     Preview Length: {hook_eval['preview_length']} chars {'✓' if hook_eval['preview_length'] <= 140 else '❌'}")

        print(f"\n  📱 Mobile Preview:")
        print(f"     Line 1: \"{hook_eval['hook_text']}\"")
        if hook_eval['second_line']:
            print(f"     Line 2: \"{hook_eval['second_line']}\"")
        print(f"     Combined: \"{hook_eval['preview_text'][:100]}...\"")

        if hook_eval['strengths']:
            print(f"\n     ✓ Strengths: {', '.join(hook_eval['strengths'][:3])}")

        if hook_eval['issues']:
            print(f"     ⚠️  Issues: {', '.join(hook_eval['issues'])}")

        print(f"\n  📝 Full Caption:")
        print("  " + "-"*66)
        for line in caption.split('\n')[:12]:
            print(f"  {line}")
        if len(caption.split('\n')) > 12:
            print("  ...")
        print("  " + "-"*66)

        results.append({
            "content_id": content['id'],
            "hook_score": hook_eval['score'],
            "hook_text": hook_eval['hook_text'],
            "preview_length": hook_eval['preview_length'],
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
        mobile_optimized = [r for r in results if r['preview_length'] <= 140]

        print(f"\n📈 Metrics:")
        print(f"   Average Hook Score: {avg_score:.1f}/10")
        print(f"   Strong Hooks (≥7): {len(strong_hooks)}/{len(hook_scores)} ({len(strong_hooks)/len(hook_scores)*100:.0f}%)")
        print(f"   Weak Hooks (<6): {len(weak_hooks)}/{len(hook_scores)} ({len(weak_hooks)/len(hook_scores)*100:.0f}%)")
        print(f"   Mobile Optimized (≤140 chars): {len(mobile_optimized)}/{len(results)} ({len(mobile_optimized)/len(results)*100:.0f}%)")

        # Best hooks
        print(f"\n🏆 Best Hooks:")
        for r in sorted(results, key=lambda x: x['hook_score'], reverse=True)[:3]:
            print(f"   {r['hook_score']}/10 ({r['preview_length']} chars): \"{r['hook_text']}\"")

        # Recommendations
        print(f"\n💡 Recommendations:")
        if avg_score < 6:
            print("   🚨 URGENT: Hooks need major improvement")
            print("   → Focus on SHORT, punchy statements")
            print("   → Use more curiosity gaps")
            print("   → Remove all filler words")
        elif avg_score < 7:
            print("   ⚠️  Hooks need refinement")
            print("   → Test more counter-intuitive statements")
            print("   → Add specific numbers")
        else:
            print("   ✅ Hooks are performing well!")

        if len(mobile_optimized) < len(results):
            print(f"\n   📱 MOBILE OPTIMIZATION NEEDED:")
            print(f"   → {len(results) - len(mobile_optimized)} hooks too long for mobile preview")
            print(f"   → Aim for 140 characters max across first 2 lines")

    # Save results
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    results_file = Path(__file__).parent / f"improved_hook_test_{timestamp}.json"

    with open(results_file, 'w') as f:
        json.dump({
            "timestamp": datetime.now().isoformat(),
            "brand_voice": brand_voice['profile_name'],
            "avg_hook_score": sum(hook_scores) / len(hook_scores) if hook_scores else 0,
            "mobile_optimized": len([r for r in results if r['preview_length'] <= 140]),
            "results": results
        }, f, indent=2)

    print(f"\n💾 Results saved to: {results_file}")
    print("\n✅ Testing complete!")


if __name__ == "__main__":
    main()
