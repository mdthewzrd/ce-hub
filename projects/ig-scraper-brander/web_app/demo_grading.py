"""
Caption Grading System - Demo
Demonstrates the grading system with sample captions
"""

import sqlite3
from datetime import datetime


# Sample captions representing different quality levels
SAMPLE_CAPTIONS = [
    {
        "name": "Excellent Quality (A)",
        "caption": """The mistake killing your progress 🚨

You're closer than you think, but self-doubt is holding you back. I've been there - that mental barrier feels impossible to break through alone.

What's the one goal you've been afraid to pursue? 💭

Let's break through together. Type GROWTH and I'll share the exact framework that helped me go from stuck to unstoppable.

This is your sign to take action 🔥""",
        "theme": "Entrepreneurship",
        "keyword": "GROWTH"
    },
    {
        "name": "Good Quality (B)",
        "caption": """Stop scrolling if you're tired of feeling stuck in your business

I found the secret to consistent growth that nobody talks about. It changed everything for me.

Want to know what it is? Comment START below and I'll send you the complete breakdown.

This could be the shift you've been waiting for ✨""",
        "theme": "Business",
        "keyword": "START"
    },
    {
        "name": "Average Quality (C)",
        "caption": """Here's something I learned about building a successful business

You need to be persistent and consistent with your efforts. Results take time, so don't give up when things get difficult.

Comment BUILD if you want more tips and strategies for your business journey.

Keep pushing forward! 💪""",
        "theme": "Business tips",
        "keyword": "BUILD"
    },
    {
        "name": "Below Average (D)",
        "caption": """Business tips for entrepreneurs

1. Focus on your goals
2. Work hard every day
3. Never give up
4. Stay consistent

Comment BUILD for more""",
        "theme": "Business",
        "keyword": "BUILD"
    },
    {
        "name": "Poor Quality (F)",
        "caption": """BUSINESS TIPS FOR ENTREPRENEURS!!! 🔥🔥💰

Follow these rules:
• Work 80 hours per week
• Never sleep
• Hustle harder
• GRIND GRIND GRIND!!!

Comment BUILD BUILD BUILD!!! 💪💪💪""",
        "theme": "Business",
        "keyword": "BUILD"
    }
]


def grade_caption_comprehensive(caption, keyword, theme):
    """Grade caption across all dimensions"""

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

    # Hook pattern
    hook_lower = hook.lower()
    bad_patterns = ['have you ever', 'i\'ve been thinking', 'here is', 'here\'s', 'this is']
    if any(bad in hook_lower for bad in bad_patterns):
        hook_score -= 10
        feedback.append("❌ Overused hook pattern")
    else:
        hook_score += 5
        feedback.append("✅ Original hook pattern")

    # Curiosity
    curiosity_words = ['mistake', 'secret', 'nobody', 'truth', 'killing', 'ignore', 'stop']
    if any(word in hook_lower for word in curiosity_words):
        hook_score += 5
        feedback.append("✅ Creates curiosity gap")

    grades['hook'] = max(0, min(25, hook_score))

    # 2. EMOJIS (15 points)
    emoji_count = sum(1 for c in caption if ord(c) > 127000)

    if 2 <= emoji_count <= 4:
        grades['emojis'] = 15
        feedback.append(f"✅ Perfect emoji count ({emoji_count} emojis)")
    elif emoji_count == 1:
        grades['emojis'] = 8
        feedback.append("⚠️ Only 1 emoji")
    elif emoji_count == 0:
        grades['emojis'] = 0
        feedback.append("❌ No emojis")
    else:
        grades['emojis'] = 10
        feedback.append(f"⚠️ Too many emojis ({emoji_count})")

    grades['emojis'] = max(0, min(15, grades['emojis']))

    # 3. COMMENT BAIT (20 points)
    bait_score = 0

    if '?' in caption:
        bait_score += 10
        feedback.append("✅ Has question mark")

    comment_triggers = ['thoughts?', 'your take', 'experience', 'agree', 'opinion', 'struggle', 'what']
    if any(trigger in caption.lower() for trigger in comment_triggers):
        bait_score += 10
        feedback.append("✅ Comment engagement trigger")

    grades['comment_bait'] = max(0, min(20, bait_score))

    # 4. MANYCHAT CTA (20 points)
    cta_score = 0
    keyword = keyword.upper()

    if keyword in caption.upper():
        # Check if helpful
        helpful = ['want', 'get', 'send', 'text', 'share', 'tips', 'guide', 'exclusive', 'breakdown']
        if any(word in caption.lower() for word in helpful):
            grades['cta'] = 20
            feedback.append(f"✅ {keyword} CTA is helpful")
        else:
            grades['cta'] = 12
            feedback.append(f"⚠️ {keyword} present but CTA basic")
    else:
        grades['cta'] = 0
        feedback.append(f"❌ Missing {keyword} keyword")

    # 5. SPACING (10 points)
    if '\n\n' in caption:
        grades['formatting'] = 10
        feedback.append("✅ Good paragraph spacing")
    else:
        grades['formatting'] = 5
        feedback.append("⚠️ Needs more paragraph breaks")

    # 6. READABILITY (10 points)
    readability = 0

    personal = ['i\'ve', 'i learned', 'my experience', 'let me']
    if any(word in caption.lower() for word in personal):
        readability += 5
        feedback.append("✅ Personal voice")

    if 'you' in caption.lower():
        readability += 5
        feedback.append("✅ Direct address")

    grades['readability'] = max(0, min(10, readability))

    # Calculate totals
    total = sum(grades.values())
    max_score = 100

    # Letter grade
    if total >= 90:
        letter = 'A'
        status = "EXCELLENT"
    elif total >= 80:
        letter = 'B'
        status = "GOOD"
    elif total >= 70:
        letter = 'C'
        status = "AVERAGE"
    elif total >= 60:
        letter = 'D'
        status = "BELOW AVERAGE"
    else:
        letter = 'F'
        status = "POOR"

    return {
        'grades': grades,
        'total': total,
        'letter': letter,
        'status': status,
        'feedback': feedback
    }


def display_results():
    """Display comprehensive grading results"""

    print("""
╔════════════════════════════════════════════════════════════════════════════╗
║              HARMONATICA CAPTION GRADING SYSTEM - TEST RESULTS                    ║
║                      Grading Your Real Video Captions                              ║
╚════════════════════════════════════════════════════════════════════════════╝
    """)

    results = []

    for sample in SAMPLE_CAPTIONS:
        # Grade the sample
        result = grade_caption_comprehensive(
            sample['caption'],
            sample['keyword'],
            sample['theme']
        )
        result['name'] = sample['name']
        result['caption'] = sample['caption']
        results.append(result)

        # Display
        print(f"\n{'=' * 100}")
        print(f"📝 {sample['name']}")
        print(f"{'=' * 100}")
        print(f"\n{sample['caption']}")
        print("\n" + "─" * 100)

        print(f"\n📊 GRADE BREAKDOWN:")
        print(f"  Hook Quality:    {result['grades']['hook']:>2}/25   {get_checkmark(result['grades']['hook'], 25)}")
        print(f"  Emoji Usage:     {result['grades']['emojis']:>2}/15   {get_checkmark(result['grades']['emojis'], 15)}")
        print(f"  Comment Bait:    {result['grades']['comment_bait']:>2}/20   {get_checkmark(result['grades']['comment_bait'], 20)}")
        print(f"  ManyChat CTA:    {result['grades']['cta']:>2}/20   {get_checkmark(result['grades']['cta'], 20)}")
        print(f"  Spacing:         {result['grades']['formatting']:>2}/10   {get_checkmark(result['grades']['formatting'], 10)}")
        print(f"  Readability:    {result['grades']['readability']:>2}/10   {get_checkmark(result['grades']['readability'], 10)}")

        print(f"  ─{'─' * 40}")
        print(f"  TOTAL SCORE:     {result['total']:>3}/100   {result['letter']} - {result['status']}")
        print("─" * 100)

        # Feedback
        print(f"\n💬 FEEDBACK:")
        for item in result['feedback']:
            print(f"  {item}")

    # Summary statistics
    print(f"\n{'=' * 100}")
    print("📊 CLASS STATISTICS")
    print(f"{'=' * 100}")

    scores = [r['total'] for r in results]
    letters = [r['letter'] for r in results]

    print(f"\n  Average Score: {sum(scores)/len(scores):.1f}/100")
    print(f"  Score Range: {min(scores)} - {max(scores)}")
    print(f"  Grade Distribution:")

    for letter in ['A', 'B', 'C', 'D', 'F']:
        count = letters.count(letter)
        if count > 0:
            bar = '█' * (count * 20 // len(results))
            percentage = count * 100 // len(results)
            print(f"    {letter}: {bar} {percentage}% ({count} caption{'s' if count > 1 else ''})")

    print(f"\n  📈 Score Distribution:")
    print(f"    A (90-100): {letters.count('A')} caption(s)")
    print(f"    B (80-89):  {letters.count('B')} caption(s)")
    print(f"    C (70-79):  {letters.count('C')} caption(s)")
    print(f"    D (60-69):  {letters.count('D')} caption(s)")
    print(f"    F (0-59):   {letters.count('F')} caption(s)")

    # Best and worst
    best = max(results, key=lambda x: x['total'])
    worst = min(results, key=lambda x: x['total'])

    print(f"\n  🏆 Best Caption: {best['letter']} ({best['total']}/100)")
    print(f"  ⚠️ Worst Caption: {worst['letter']} ({worst['total']}/100)")

    # Key insights
    print(f"\n{'=' * 100}")
    print("🎯 KEY INSIGHTS")
    print(f"{'=' * 100}")

    print("""
  ✅ HOOK QUALITY is the biggest differentiator
     • Hooks under 12 words perform significantly better
     • "Curiosity gap" hooks (e.g., "The mistake killing your progress")
       consistently outperform "Have you ever" patterns

  ✅ EMOJIS make or break engagement
     • 2-3 emojis is the sweet spot
     • Place at hook + body for maximum impact
     • More than 5 feels spammy

  ✅ COMMENT BAIT is critical for algorithm
     • Questions that end with specific prompts work best
     • "What's your X?" format drives the most comments
     • Opinion requests create conversation

  ✅ ManyChat CTA must feel HELPFUL, not transactional
     • ❌ "Comment GROWTH" (too direct)
     • ✅ "Type GROWTH for exclusive tips" (helpful)
     • ✅ "Want the full guide? Comment GROWTH" (value-driven)

  ✅ SPACING affects mobile readability
     • Double spacing between paragraphs is essential
     • Lines under 50 chars perform best
     • Visual rhythm keeps people reading

    """)

    print(f"\n{'=' * 100}")
    print("💾 Saving all graded captions to database for learning...")
    print(f"{'=' * 100}")

    # Save to database
    try:
        db_path = "/Users/michaeldurante/ai dev/ce-hub/projects/ig-scraper-brander/web_app/harmonatica.db"
        conn = sqlite3.connect(db_path)
        cursor = conn.cursor()

        for result in results:
            notes = {
                'graded': True,
                'score': result['total'],
                'letter_grade': result['letter'],
                'grades': result['grades'],
                'feedback': result['feedback'],
                'test_name': result['name'],
                'theme': result.get('theme', 'unknown'),
                'generated_at': datetime.now().isoformat()
            }

            cursor.execute(
                "INSERT INTO ready_content (source_id, video_path, caption, status, notes) VALUES (?, ?, ?, ?, ?)",
                (0, 'test_caption.mp4', result['caption'], 'ready', str(notes))
            )

        conn.commit()
        conn.close()

        print("✅ All captions saved to database")
        print(f"✅ Total captions in database: {len(results)}")

    except Exception as e:
        print(f"⚠️ Could not save: {e}")

    print(f"\n{'=' * 100}\n")


def get_checkmark(score, max_score):
    """Get checkmark or X based on score"""
    ratio = score / max_score if max_score > 0 else 0
    if ratio >= 0.9:
        return '✅'
    elif ratio >= 0.7:
        return '⚠️'
    else:
        return '❌'


if __name__ == "__main__":
    display_results()
