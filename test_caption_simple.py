"""
Test caption generation for Harmonatica
"""

import os
from dotenv import load_dotenv
import requests

load_dotenv()

api_key = os.getenv("OPENROUTER_API_KEY")

messages = [
    {
        "role": "system",
        "content": """You are an ELITE Instagram copywriter for @nuatlantis.

Write captions that:
- STOP THE SCROLL with powerful hooks
- Build genuine connection
- Drive engagement and comments
- Convert naturally through helpful CTAs

HOOK PATTERNS (MUST use one of these):
- Curiosity: "The mistake killing your progress"
- Relatable: "Ever feel like stuck?"
- Story: "Can I be honest for a second?"
- Value: "Save this for later"

REQUIREMENTS:
- Use 2-4 emojis (💡 🔥 ✨ 🚨 💪 🎯)
- Include comment-bait question
- Make ManyChat CTA feel helpful
- Short paragraphs, clear breaks"""
    },
    {
        "role": "user",
        "content": """Generate a caption for a motivational/business Instagram Reel.

Theme: Entrepreneurship and mindset
Target: Aspiring entrepreneurs and creators
ManyChat keyword: GROWTH

Output ONLY the caption, no introduction."""
    }
]

print("=" * 80)
print("HARMONATICA CAPTION GENERATION TEST")
print("=" * 80)

# Try Gemini first, fallback to Llama
for model in ["google/gemini-2.0-flash-exp:free", "meta-llama/llama-3.3-70b-instruct:free"]:
    try:
        model_name = model.split("/")[-1]
        print(f"\nTrying {model_name}...")

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
            timeout=45
        )

        if response.status_code == 200:
            result = response.json()
            raw_caption = result['choices'][0]['message']['content']

            # Clean up
            caption = raw_caption.replace('**', '').replace('```', '').strip()

            # Extract actual caption if AI added meta-commentary
            lines = caption.split('\n')
            caption_start = 0
            for i, line in enumerate(lines):
                if 'caption' in line.lower() and len(line) < 50 and caption_start == 0:
                    caption_start = i + 1
                elif line.strip() and caption_start > 0:
                    caption_start = i
                    break

            if caption_start > 0:
                caption = '\n'.join(lines[caption_start:])

            # Add emojis if missing
            emoji_count = sum(1 for c in caption if ord(c) > 127000)
            if emoji_count < 2:
                caption = caption.replace('\n\n', '\n\n💡\n\n', 1)
                caption = caption + ' 🔥'

            print(f"\n✅ SUCCESS with {model_name}!\n")

            # Display Instagram preview
            print("=" * 80)
            print("INSTAGRAM PREVIEW")
            print("=" * 80)
            print("\n👤 @nuatlantis")
            print("🎵 Original Audio")
            print("-" * 80)
            print(caption)
            print("-" * 80)

            # Analysis
            lines = caption.split('\n')
            hook = lines[0] if lines else ""

            print(f"\n📊 ANALYSIS:")
            print(f"   Hook: \"{hook[:50]}...\"")
            print(f"   Hook words: {len(hook.split())}")
            print(f"   Total lines: {len(lines)}")
            print(f"   Emoji count: {sum(1 for c in caption if ord(c) > 127000)}")
            print(f"   Has question: {'✅' if '?' in caption else '❌'}")
            print(f"   GROWTH keyword: {'✅' if 'GROWTH' in caption else '❌'}")
            print(f"   Good spacing: {'✅' if '\\n\\n' in caption else '❌'}")

            # Character count
            char_count = len(caption)
            print(f"\n📏 Instagram Info:")
            print(f"   Total characters: {char_count}")
            if char_count < 500:
                print(f"   ✅ Perfect length for Instagram")
            elif char_count < 1000:
                print(f"   ⚠️ Getting long but acceptable")
            else:
                print(f"   ❌ Too long - consider trimming")

            # Word count per line
            print(f"\n📐 Line breakdown:")
            for i, line in enumerate(lines[:8], 1):
                if line.strip():
                    print(f"   Line {i}: {len(line.split()):2} words - {len(line):3} chars")

            break
        else:
            print(f"  HTTP {response.status_code}")

    except Exception as e:
        print(f"  Error: {str(e)[:50]}")
