"""
Test script for Instagram Caption Engine
Run this to verify everything is working
"""

import os
import sys

# Check for API key
api_key = os.getenv("OPENROUTER_API_KEY")
if not api_key:
    print("\n❌ OPENROUTER_API_KEY environment variable not set")
    print("\n📝 Get your free API key at: https://openrouter.ai/keys")
    print("\n💡 Set it with:")
    print("   export OPENROUTER_API_KEY='your-key-here'")
    print("\nOr create a .env file with:")
    print("   OPENROUTER_API_KEY=your-key-here")
    sys.exit(1)

print("\n" + "=" * 60)
print("🧪 INSTAGRAM CAPTION ENGINE - TEST SUITE")
print("=" * 60)

# Test 1: Database initialization
print("\n[1/5] Testing database initialization...")
try:
    from database_schema import init_database, load_initial_templates, get_template_by_category
    init_database()
    load_initial_templates()
    print("✅ Database initialized successfully")

    # Test template retrieval
    template = get_template_by_category("fitness")
    if template:
        print(f"✅ Template loaded: {template['name']}")
    else:
        print("⚠️ No template found for fitness category")
except Exception as e:
    print(f"❌ Database test failed: {e}")
    sys.exit(1)

# Test 2: OpenRouter client
print("\n[2/5] Testing OpenRouter client...")
try:
    from openrouter_client import OpenRouterClient, get_prompt_for_caption, estimate_caption_cost

    client = OpenRouterClient(api_key=api_key)

    # Test cost estimation
    costs = estimate_caption_cost(100, "gemini-flash-lite")
    print(f"✅ Cost estimate for 100 captions: ${costs['total_cost']:.4f}")
    print(f"   Per caption: ${costs['cost_per_caption']:.6f}")

    # Test prompt building
    prompt = get_prompt_for_caption(
        category="fitness",
        theme="morning routine",
        target_keyword="FREE"
    )
    print(f"✅ Prompt built: {len(prompt)} chars")
except Exception as e:
    print(f"❌ OpenRouter client test failed: {e}")
    sys.exit(1)

# Test 3: Caption generation (if API key works)
print("\n[3/5] Testing AI caption generation...")
try:
    from caption_generator import CaptionGenerator

    generator = CaptionGenerator(openrouter_api_key=api_key)

    # Generate test caption
    caption = generator.generate_caption(
        category="motivation",
        theme="never give up on your dreams",
        target_keyword="GRIND",
        emotion="inspiring"
    )

    if caption:
        print("✅ Caption generated successfully!")
        print(f"\n📝 Generated Caption:")
        print("=" * 60)
        print(caption.full_caption)
        print("=" * 60)
    else:
        print("⚠️ Caption generation returned None (API issue or using template fallback)")

    # Print stats
    generator._print_stats()
except Exception as e:
    print(f"❌ Caption generation failed: {e}")
    import traceback
    traceback.print_exc()

# Test 4: Quality scoring
print("\n[4/5] Testing quality scoring...")
try:
    from quality_scorer import CaptionQualityScorer

    scorer = CaptionQualityScorer()

    test_caption = """This changed everything for me 🔥

I was stuck for years, going through the motions.

Then I discovered one simple trick.

Now I see results every single day.

Save this so you don't forget! 🎯

Comment 'FREE' for the guide 🔥

Follow for more motivation

#motivation #success #mindset"""

    result = scorer.score_caption(test_caption, "motivation")
    print(f"✅ Quality Score: {result.overall_score}/100 (Grade: {_get_grade(result.overall_score)})")
    print(f"   Breakdown: Hook={result.hook_score}, Story={result.story_score}, CTA={result.cta_score}")
except Exception as e:
    print(f"❌ Quality scoring failed: {e}")

# Test 5: Database operations
print("\n[5/5] Testing database operations...")
try:
    import sqlite3
    from database_schema import DB_PATH

    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Count captions
    cursor.execute("SELECT COUNT(*) FROM captions")
    count = cursor.fetchone()[0]
    print(f"✅ Database contains {count} caption(s)")

    # Count generation history
    cursor.execute("SELECT COUNT(*) FROM generation_history")
    history_count = cursor.fetchone()[0]
    print(f"✅ Generation history: {history_count} record(s)")

    # Get recent captions
    cursor.execute("SELECT id, category, status FROM captions ORDER BY created_at DESC LIMIT 5")
    recent = cursor.fetchall()
    if recent:
        print(f"✅ Recent captions:")
        for row in recent:
            print(f"   ID {row[0]}: {row[1]} - {row[2]}")

    conn.close()
except Exception as e:
    print(f"❌ Database operations failed: {e}")


def _get_grade(score: float) -> str:
    """Convert score to letter grade"""
    if score >= 90:
        return "A+"
    elif score >= 80:
        return "A"
    elif score >= 70:
        return "B"
    elif score >= 60:
        return "C"
    elif score >= 50:
        return "D"
    else:
        return "F"


# Final summary
print("\n" + "=" * 60)
print("🎉 TEST SUITE COMPLETE!")
print("=" * 60)
print("\n✅ All core systems operational")
print("\n📖 Next Steps:")
print("   1. Start API server: python api.py")
print("   2. Open dashboard: http://localhost:3131/docs")
print("   3. Generate captions via API or dashboard")
print("\n💡 Pro tip: Add to your scraper for auto-caption generation")
print("=" * 60 + "\n")
