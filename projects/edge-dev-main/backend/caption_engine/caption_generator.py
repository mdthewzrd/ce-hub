"""
AI Caption Generator with Multi-Pass System
Orchestrates caption generation using OpenRouter models with template fallback
"""

import os
import json
import re
import time
from typing import Dict, Optional, List
from dataclasses import dataclass

from database_schema import (
    init_database,
    load_initial_templates,
    get_template_by_category,
    insert_caption,
    insert_generation_history
)
from openrouter_client import (
    OpenRouterClient,
    get_prompt_for_caption,
    DEFAULT_MODEL,
    PREMIUM_MODEL,
    GenerationResult
)


@dataclass
class CaptionData:
    """Structured caption data"""
    hook: str
    story: str
    value: str
    cta_comment: str
    cta_follow: str
    full_caption: str
    hashtags: str
    category: str
    target_keyword: str
    generation_model: str


class CaptionGenerator:
    """Main caption generation engine"""

    def __init__(self, openrouter_api_key: str):
        # Initialize database
        init_database()
        load_initial_templates()

        # Initialize OpenRouter client
        self.client = OpenRouterClient(api_key=openrouter_api_key)

        # Generation statistics
        self.stats = {
            "total_generated": 0,
            "ai_generated": 0,
            "template_fallback": 0,
            "total_cost": 0.0
        }

    def generate_caption(
        self,
        category: str,
        theme: str,
        target_keyword: str = "FREE",
        context: str = "",
        emotion: str = "inspiring",
        use_premium: bool = False,
        retry_with_fallback: bool = True
    ) -> Optional[CaptionData]:
        """
        Generate a complete caption with multi-pass system

        Args:
            category: Content category (fitness, motivation, business, etc.)
            theme: Specific theme/topic
            target_keyword: ManyChat trigger word (default: "FREE")
            context: Additional context about the content
            emotion: Target emotional tone
            use_premium: Use premium model (GPT-4o-mini) instead of default
            retry_with_fallback: Retry with alternative models if primary fails

        Returns:
            CaptionData object or None if generation fails
        """
        print(f"\n🤖 Generating caption for: {theme} ({category})")

        # Select model
        model = PREMIUM_MODEL if use_premium else DEFAULT_MODEL

        # Build prompt
        prompt = get_prompt_for_caption(
            category=category,
            theme=theme,
            target_keyword=target_keyword,
            context=context,
            emotion=emotion
        )

        # Try AI generation first
        if retry_with_fallback:
            result = self.client.generate_with_fallback(prompt, preferred_model=model)
        else:
            result = self.client.generate_caption(prompt, model=model)

        if result.success:
            try:
                # Parse JSON response
                caption_data = json.loads(result.content)

                # Validate required fields
                required_fields = ["hook", "story", "value", "cta_comment", "full_caption", "hashtags"]
                if not all(field in caption_data for field in required_fields):
                    raise ValueError("Missing required fields in response")

                # Create CaptionData object
                caption = CaptionData(
                    hook=caption_data.get("hook", ""),
                    story=caption_data.get("story", ""),
                    value=caption_data.get("value", ""),
                    cta_comment=caption_data.get("cta_comment", ""),
                    cta_follow=caption_data.get("cta_follow", ""),
                    full_caption=caption_data["full_caption"],
                    hashtags=caption_data.get("hashtags", ""),
                    category=category,
                    target_keyword=target_keyword,
                    generation_model=result.model_used
                )

                # Update stats
                self.stats["total_generated"] += 1
                self.stats["ai_generated"] += 1
                self.stats["total_cost"] += result.cost_usd

                print(f"✅ Caption generated using {result.model_used}")
                print(f"   Cost: ${result.cost_usd:.6f}")
                print(f"   Tokens: {result.total_tokens}")

                # Store in database
                self._save_caption_to_db(caption, result)

                return caption

            except (json.JSONDecodeError, ValueError) as e:
                print(f"⚠️ Failed to parse AI response: {e}")
                print(f"   Response: {result.content[:200]}...")
                # Fall through to template generation

        # Fallback to template-based generation
        print("🔄 Falling back to template-based generation")
        return self._generate_from_template(category, theme, target_keyword)

    def _generate_from_template(
        self,
        category: str,
        theme: str,
        target_keyword: str
    ) -> Optional[CaptionData]:
        """Generate caption using template (free fallback)"""
        template = get_template_by_category(category)

        if not template:
            print(f"❌ No template found for category: {category}")
            return None

        # Build caption from template
        hook = f"This changed everything for me 🔥"
        story = f"I was struggling with {theme} for years.\n\nThen I discovered one simple trick that made all the difference.\n\nNow it's effortless and I see results every single day."
        value = f"Save this so you don't forget. Consistency beats intensity every time. 🎯"
        cta_comment = f"Comment '{target_keyword}' and I'll send you the complete guide 🔥"
        cta_follow = f"Follow for more {category} content that actually works"

        # Combine into full caption
        full_caption = f"""{hook}

{story}

{value}

{cta_comment}

{cta_follow}

{template['emoji_palette'][0]} {template['emoji_palette'][1]} {template['emoji_palette'][2]}

{' '.join(template['hashtag_pools']['high_volume'][:5])} {' '.join(template['hashtag_pools']['medium_volume'][:5])}"""

        hashtags = ' '.join(template['hashtag_pools']['high_volume'] + template['hashtag_pools']['medium_volume'])

        caption = CaptionData(
            hook=hook,
            story=story,
            value=value,
            cta_comment=cta_comment,
            cta_follow=cta_follow,
            full_caption=full_caption,
            hashtags=hashtags,
            category=category,
            target_keyword=target_keyword,
            generation_model="template"
        )

        self.stats["total_generated"] += 1
        self.stats["template_fallback"] += 1

        print("✅ Caption generated from template (free)")

        return caption

    def _save_caption_to_db(self, caption: CaptionData, result: GenerationResult):
        """Save generated caption to database"""
        import sqlite3
        from database_schema import DB_PATH

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Insert caption
        cursor.execute("""
            INSERT INTO captions
            (hook, story_body, value_prop, cta_comment, cta_follow,
             full_caption, hashtag_string, caption_style, tone, target_keyword,
             category, generation_model, ai_generated, status)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        """, (
            caption.hook,
            caption.story,
            caption.value,
            caption.cta_comment,
            caption.cta_follow,
            caption.full_caption,
            caption.hashtags,
            "viral",
            "engaging",
            caption.target_keyword,
            caption.category,
            caption.generation_model,
            1,  # ai_generated
            "approved"  # status
        ))

        caption_id = cursor.lastrowid

        # Insert generation history
        cursor.execute("""
            INSERT INTO generation_history
            (caption_id, model_used, prompt_tokens, completion_tokens,
             total_tokens, cost_usd, generation_time_ms)
            VALUES (?, ?, ?, ?, ?, ?, ?)
        """, (
            caption_id,
            result.model_used,
            result.prompt_tokens,
            result.completion_tokens,
            result.total_tokens,
            result.cost_usd,
            0  # generation_time_ms (would need actual timing)
        ))

        conn.commit()
        conn.close()

    def generate_batch(
        self,
        items: List[Dict],
        use_premium: bool = False
    ) -> List[CaptionData]:
        """
        Generate captions for multiple items

        Args:
            items: List of dicts with category, theme, target_keyword, etc.
            use_premium: Use premium model for all

        Returns:
            List of CaptionData objects
        """
        captions = []

        print(f"\n🚀 Generating {len(items)} captions...")

        for i, item in enumerate(items, 1):
            print(f"\n[{i}/{len(items)}]", end=" ")

            caption = self.generate_caption(
                category=item.get("category", "motivation"),
                theme=item.get("theme", "success"),
                target_keyword=item.get("target_keyword", "FREE"),
                context=item.get("context", ""),
                emotion=item.get("emotion", "inspiring"),
                use_premium=use_premium
            )

            if caption:
                captions.append(caption)

            # Small delay to avoid rate limiting
            time.sleep(0.5)

        self._print_stats()
        return captions

    def _print_stats(self):
        """Print generation statistics"""
        print("\n" + "=" * 50)
        print("📊 GENERATION STATS")
        print("=" * 50)
        print(f"Total Generated: {self.stats['total_generated']}")
        print(f"AI Generated: {self.stats['ai_generated']}")
        print(f"Template Fallback: {self.stats['template_fallback']}")
        print(f"Total Cost: ${self.stats['total_cost']:.4f}")
        print("=" * 50)


def format_caption_for_display(caption: CaptionData) -> str:
    """Format caption for display in dashboard"""
    return f"""
┌─────────────────────────────────────────────┐
│ HOOK                                        │
├─────────────────────────────────────────────┤
{caption.hook}
├─────────────────────────────────────────────┤
│ STORY                                       │
├─────────────────────────────────────────────┤
{caption.story}
├─────────────────────────────────────────────┤
│ VALUE                                       │
├─────────────────────────────────────────────┤
{caption.value}
├─────────────────────────────────────────────┤
│ CTA                                         │
├─────────────────────────────────────────────┤
{caption.cta_comment}

{caption.cta_follow}
├─────────────────────────────────────────────┤
│ HASHTAGS                                    │
├─────────────────────────────────────────────┤
{caption.hashtags}
└─────────────────────────────────────────────┘


──────────────────────────────────────────────
FULL CAPTION (Ready to post)
──────────────────────────────────────────────

{caption.full_caption}
"""


# CLI interface for testing
if __name__ == "__main__":
    import sys

    # Check for API key
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("❌ OPENROUTER_API_KEY environment variable not set")
        print("   Get your API key at: https://openrouter.ai/keys")
        sys.exit(1)

    # Initialize generator
    generator = CaptionGenerator(openrouter_api_key=api_key)

    # Example generation
    print("\n" + "=" * 50)
    print("🧪 TESTING CAPTION GENERATION")
    print("=" * 50)

    test_caption = generator.generate_caption(
        category="fitness",
        theme="2-minute morning routine that changed my life",
        target_keyword="ROUTINE",
        emotion="inspiring"
    )

    if test_caption:
        print(format_caption_for_display(test_caption))
    else:
        print("❌ Failed to generate caption")
