"""
Instagram Spacing & Formatting Test
Shows how captions will actually look on Instagram mobile
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")


def generate_test_caption():
    """Generate a test caption with proper spacing"""

    messages = [
        {
            "role": "system",
            "content": """You are an ELITE Instagram copywriter.

REQUIREMENTS:
- Hook: Under 15 words, punchy
- 2-4 emojis throughout (💡 🔥 ✨ 🚨 💪 🎯)
- Include comment-bait question
- Helpful ManyChat CTA
- SHORT paragraphs (1-2 sentences max)
- Clear line breaks between sections

Hook patterns to use:
- "The mistake killing your progress"
- "Ever feel like stuck?"
- "Can I be honest for a second?"
- "Save this for later"
- "What if I told you"

FORMAT:
[Hook with emoji]

[Short paragraph 1-2 sentences with emoji]

[Comment bait question with emoji]

[Helpful CTA with emoji]"""
        },
        {
            "role": "user",
            "content": """Generate a caption for a motivational/business Instagram Reel from @nuatlantis.

Theme: Entrepreneurship and mindset
Target: Aspiring entrepreneurs
ManyChat keyword: GROWTH

Output the caption directly, no intro."""
        }
    ]

    response = requests.post(
        "https://openrouter.ai/api/v1/chat/completions",
        headers={
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json"
        },
        json={
            "model": "meta-llama/llama-3.3-70b-instruct:free",
            "messages": messages,
            "max_tokens": 1200,
            "temperature": 0.85
        },
        timeout=45
    )

    if response.status_code == 200:
        result = response.json()
        caption = result['choices'][0]['message']['content'].replace('**', '').replace('```', '').strip()
        return caption
    return None


def format_for_instagram(caption):
    """Format caption with proper spacing and emojis"""

    # Ensure double spacing between paragraphs
    lines = caption.split('\n')
    formatted_lines = []
    prev_was_empty = False

    for line in lines:
        is_empty = not line.strip()

        # If this is a content line after another content line, no double space
        # If this is after empty line, keep as is
        if not is_empty:
            if prev_was_empty:
                formatted_lines.append("")  # Keep the empty line
                formatted_lines.append(line)
            else:
                formatted_lines.append(line)
            prev_was_empty = False
        else:
            prev_was_empty = True

    caption = '\n'.join(formatted_lines)

    # Add emojis if missing
    emoji_count = sum(1 for c in caption if ord(c) > 127000)
    if emoji_count < 2:
        # Add emoji to first non-empty line
        lines = caption.split('\n')
        for i, line in enumerate(lines):
            if line.strip():
                if emoji_count == 0:
                    lines[i] = line + ' 🚨'
                elif emoji_count == 1:
                    lines[i] = line + ' 💡'
                emoji_count += 1
                if emoji_count >= 2:
                    break
        caption = '\n'.join(lines)

        # Add emoji at end if still needed
        if emoji_count < 2:
            caption = caption + ' 🔥'

    return caption


def show_instagram_mobile_preview(caption):
    """Show how caption appears on Instagram mobile"""

    print("\n" + "=" * 80)
    print("📱 INSTAGRAM MOBILE PREVIEW")
    print("=" * 80)

    # Simulated Instagram header
    print("\n┌─────────────────────────────────────────────────────────────┐")
    print("│ @nuatlantis                                              │")
    print("│ Following • 12K followers                                 │")
    print("├─────────────────────────────────────────────────────────────┤")
    print("│ [Video Thumbnail]                                         │")
    print("│ ▶️  0:45 / 1:23                                          │")
    print("├─────────────────────────────────────────────────────────────┤")
    print("│ CAPTION                                                   │")

    # Show caption with proper word wrapping (Instagram wraps at ~30-35 chars)
    print("│                                                             │")

    for line in caption.split('\n')[:15]:  # Limit to 15 lines for display
        wrapped_lines = wrap_text_instagram(line, 32)
        for wrapped in wrapped_lines:
            print(f"│ {wrapped:<63} │")

    print("│                                                             │")
    print("│                                                             │")
    print("│ [💬 142 comments]  [❤️ 2.4K likes]  [✨ 342 saves]          │")
    print("└─────────────────────────────────────────────────────────────┘")

    # Metrics
    print("\n" + "-" * 80)
    print("📊 SPACING & FORMATTING ANALYSIS")
    print("-" * 80)

    lines = caption.split('\n')
    hook = lines[0] if lines else ""

    print(f"\n✨ HOOK ANALYSIS:")
    print(f"   Text: \"{hook[:60]}...\"")
    print(f"   Length: {len(hook.split())} words {'✅ Perfect' if len(hook.split()) <= 12 else '⚠️ Could be shorter' if len(hook.split()) <= 18 else '❌ Too long'}")
    print(f"   Chars: {len(hook)} {'✅ Good' if len(hook) <= 80 else '⚠️ Will wrap on mobile' if len(hook) <= 120 else '❌ Too long for mobile'}")

    print(f"\n📏 STRUCTURE:")
    print(f"   Total lines: {len(lines)}")
    print(f"   Paragraphs: {len([l for l in lines if l.strip()])}")
    print(f"   Empty lines: {len([l for l in lines if not l.strip()])}")

    print(f"\n🎨 EMOJIS:")
    emoji_count = sum(1 for c in caption if ord(c) > 127000)
    print(f"   Count: {emoji_count} {'✅ Perfect' if 2 <= emoji_count <= 4 else '⚠️ Need more' if emoji_count < 2 else '⚠️ Too many'}")

    emoji_positions = [(i, c) for i, line in enumerate(lines) for c in line if ord(c) > 127000]
    if emoji_positions:
        print(f"   Positions: Line {emoji_positions[0][0]+1}, {emoji_positions[1][0]+1}{'...' if len(emoji_positions) > 2 else ''}")

    print(f"\n💬 ENGAGEMENT:")
    print(f"   Questions: {'✅ Yes' if '?' in caption else '❌ No'}")
    print(f"   GROWTH keyword: {'✅ Yes' if 'GROWTH' in caption else '❌ No'}")
    print(f"   CTA helpful: {'✅ Yes' if any(word in caption.lower() for word in ['want', 'get', 'send', 'text']) else '⚠️ Could be clearer'}")

    print(f"\n📱 INSTAGRAM LIMITS:")
    char_count = len(caption)
    print(f"   Characters: {char_count}/2200 {'✅ Perfect' if char_count < 1000 else '⚠️ Long' if char_count < 1500 else '❌ Too long'}")
    print(f"   Hashtags: {'✅ None (good)' if '#' not in caption else '❌ Hashtags in caption'}")

    # Readability score
    short_lines = sum(1 for l in lines if l.strip() and len(l) < 50)
    print(f"\n📖 READABILITY:")
    print(f"   Short lines (<50 chars): {short_lines}/{len([l for l in lines if l.strip()])} {'✅ Great for mobile' if short_lines >= len([l for l in lines if l.strip()]) * 0.6 else '⚠️ Some long lines'}")


def wrap_text_instagram(text, width=32):
    """Wrap text for Instagram mobile width"""
    words = text.split()
    lines = []
    current_line = ""

    for word in words:
        test_line = current_line + " " + word if current_line else word
        if len(test_line) <= width:
            current_line = test_line
        else:
            if current_line:
                lines.append(current_line)
            current_line = word

    if current_line:
        lines.append(current_line)

    return lines if lines else [""]


def main():
    print("=" * 80)
    print("HARMONATICA SPACING & FORMATTING TEST")
    print("=" * 80)

    print("\n🤖 Generating caption with Llama 3.3 70B...")

    caption = generate_test_caption()

    if not caption:
        print("❌ Failed to generate caption")
        return

    # Format with proper spacing
    caption = format_for_instagram(caption)

    # Show preview
    show_instagram_mobile_preview(caption)

    # Save to database
    print(f"\n💾 Saving to database for learning...")
    try:
        import sqlite3
        from datetime import datetime

        conn = sqlite3.connect('harmonatica.db')
        cursor = conn.cursor()

        cursor.execute(
            "INSERT INTO ready_content (source_id, video_path, caption, status, notes) VALUES (?, ?, ?, ?, ?)",
            (0, 'test_video.mp4', caption, 'ready', f'{{"test": true, "generated_at": "{datetime.now().isoformat()}"}}')
        )

        conn.commit()
        conn.close()
        print("✅ Saved successfully")
    except Exception as e:
        print(f"⚠️ Could not save: {e}")


if __name__ == "__main__":
    main()
