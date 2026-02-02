"""
Master Instagram Caption Generator
Uses advanced copywriting psychology, conversion techniques, and comment-baiting strategies
"""

import os
import json
from typing import Dict, List
import requests
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Master-level hook patterns (20+ variations)
HOOK_PATTERNS = {
    # Curiosity gaps
    "curiosity_negative": [
        "Stop ignoring this sign",
        "You're probably doing this wrong",
        "The mistake that's killing your progress",
        "What nobody tells you about",
        "The truth about",
        "Why you keep struggling with"
    ],
    "curiosity_positive": [
        "The one thing that changed everything",
        "I finally figured out",
        "This shifted my entire perspective",
        "Why this works better than anything else",
        "The game-changer I wish I knew sooner"
    ],

    # Relatability hooks
    "relatable_struggle": [
        "Ever feel like",
        "Is it just me or",
        "We've all been there",
        "Can we talk about",
        "Nobody admits this but"
    ],

    # Question hooks
    "question_direct": [
        "What if I told you",
        "Want to know the secret?",
        "Ready for the truth?",
        "Here's a question for you:",
        "Let me ask you something"
    ],

    # Story hooks
    "story_personal": [
        "I'll never forget the moment",
        "Here's something I learned the hard way",
        "After years of trying, I discovered",
        "The conversation that changed my mind:",
        "Can I be honest for a second?"
    ],

    # Value-forward hooks
    "value_promise": [
        "Save this for later",
        "You need to hear this:",
        "This is worth your time:",
        "Let me save you some trouble:",
        "Here's exactly what to do:"
    ],

    # Counter-intuitive hooks
    "counter_intuitive": [
        "The opposite is true",
        "Why conventional wisdom is wrong",
        "Unpopular opinion but",
        "Going to say something controversial:",
        "You've been lied to about"
    ]
}

# Comment-baiting strategies
COMMENT_BAIT_PATTERNS = [
    # Opinion questions
    "What's your take on this?",
    "Do you agree or disagree?",
    "Thoughts?",
    "Let me know in the comments",

    # Personal questions
    "Which one resonates with you?",
    "Have you experienced this?",
    "What would you add to this?",
    "Where do you stand on this?",

    # Debate starters
    "Am I the only one who thinks this?",
    "Controversial opinion:",
    "Unpopular opinion:",
    "Let's argue in the comments:",

    # Engagement prompts
    "Drop a 🔥 if this resonates",
    "Save this for later",
    "Tag someone who needs to see this",
    "Share this with",

    # Specific questions
    "What's your experience with this?",
    "How would you handle this?",
    "What's your favorite tip for",
    "What's been your experience?"
]

# Emoji strategy (placement and selection)
EMOJI_STRATEGY = {
    "attention_grabbers": ["🚨", "‼️", "💡", "🔥", "⚡", "✨"],
    "emotions": ["💪", "🙌", "😤", "🤯", "😌", "💭"],
    "pointing": ["👇", "👉", "→", "⬇️"],
    "success": ["✅", "🏆", "🎯", "⭐"],
    "connection": ["❤️", "💙", "🤝", "🫂"]
}

# Conversion frameworks
CONVERSION_FRAMEWORKS = {
    "AIDA": {
        "description": "Attention → Interest → Desire → Action",
        "structure": [
            ("hook", "Grab attention immediately"),
            ("problem", "Highlight the pain point"),
            ("solution", "Present the solution"),
            ("proof", "Show why it works"),
            ("cta", "Clear call to action")
        ]
    },
    "PAS": {
        "description": "Problem → Agitation → Solution",
        "structure": [
            ("hook", "Identify the problem"),
            ("agitate", "Make the problem feel urgent"),
            ("solution", "Provide the solution"),
            ("cta", "Call to action")
        ]
    },
    "STORY_BRIDGE": {
        "description": "Story → Bridge → Offer",
        "structure": [
            ("hook", "Start with a relatable moment"),
            ("story", "Tell a brief story"),
            ("bridge", "Connect story to lesson"),
            ("offer", "Provide value/CTA")
        ]
    }
}


class MasterCaptionGenerator:
    """Advanced Instagram caption generator with conversion psychology"""

    def __init__(self, api_key: str = None, model: str = None):
        self.api_key = api_key or os.getenv("OPENROUTER_API_KEY")
        self.model = model or os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

    def generate_caption(
        self,
        video_analysis: Dict,
        manychat_keyword: str,
        target_audience: str,
        caption_purpose: str = "engagement",  # engagement, conversion, community
        framework: str = "adaptive"  # AIDA, PAS, STORY_BRIDGE, adaptive
    ) -> str:
        """
        Generate a master-level Instagram caption

        Args:
            video_analysis: Video content analysis
            manychat_keyword: Conversion keyword
            target_audience: Who we're speaking to
            caption_purpose: Primary goal (engagement/conversion/community)
            framework: Copywriting framework to use
        """

        # Select hook pattern based on content type
        hook_category = self._select_hook_pattern(video_analysis, caption_purpose)

        # Build comprehensive prompt
        prompt = self._build_master_prompt(
            video_analysis=video_analysis,
            manychat_keyword=manychat_keyword,
            target_audience=target_audience,
            caption_purpose=caption_purpose,
            framework=framework,
            hook_category=hook_category
        )

        # Generate caption
        try:
            response = requests.post(
                "https://openrouter.ai/api/v1/chat/completions",
                headers={
                    "Authorization": f"Bearer {self.api_key}",
                    "Content-Type": "application/json",
                    "HTTP-Referer": "https://harmonatica.app",
                    "X-Title": "Harmonatica Master Caption Generator"
                },
                json={
                    "model": self.model,
                    "messages": [
                        {
                            "role": "system",
                            "content": self._get_system_prompt()
                        },
                        {
                            "role": "user",
                            "content": prompt
                        }
                    ],
                    "temperature": 0.85,  # Higher creativity for variety
                    "max_tokens": 2000
                },
                timeout=60
            )

            if response.status_code == 200:
                result = response.json()
                caption = result['choices'][0]['message']['content']
                # Clean up markdown
                caption = caption.replace('**', '').replace('```', '').strip()
                return caption
            else:
                return f"ERROR: {response.status_code}"

        except Exception as e:
            return f"ERROR: {str(e)}"

    def _select_hook_pattern(self, video_analysis: Dict, purpose: str) -> str:
        """Select appropriate hook pattern based on content and purpose"""

        content_type = video_analysis.get('content_type', 'general')
        vibe = video_analysis.get('vibe', 'neutral')

        # Tutorial/educational content
        if content_type in ['tutorial', 'educational']:
            if purpose == 'conversion':
                return 'value_promise'
            return 'curiosity_negative'

        # Motivational/inspiring content
        if content_type in ['motivational', 'story']:
            if purpose == 'engagement':
                return 'relatable_struggle'
            return 'story_personal'

        # Entertainment/lifestyle content
        if content_type in ['entertainment', 'lifestyle']:
            if vibe == 'casual':
                return 'question_direct'
            return 'curiosity_positive'

        # Promotional content
        if content_type == 'promotional':
            return 'counter_intuitive'

        # Default
        return 'curiosity_positive'

    def _get_system_prompt(self) -> str:
        """Get master-level system prompt with copywriting psychology"""

        return """You are an ELITE Instagram copywriter and conversion psychologist. You write captions that:

✅ STOP THE SCROLL immediately
✅ Build genuine connection through authenticity
✅ Drive meaningful engagement and comments
✅ Convert naturally through helpful CTAs
✅ Feel like a real person, not marketing copy

## MASTER HOOK PSYCHOLOGY

Your hooks MUST be one of these patterns (NEVER start with "Have you ever" or "I've been thinking"):

🎯 CURIOSITY GAPS (Negative):
- "Stop ignoring this sign"
- "The mistake killing your progress"
- "What nobody tells you about"

🎯 CURIOSITY GAPS (Positive):
- "The one thing that changed everything"
- "I finally figured out"
- "This shifted my entire perspective"

🎯 RELATABLE STRUGGLES:
- "Ever feel like"
- "Is it just me or"
- "We've all been there"

🎯 DIRECT QUESTIONS:
- "What if I told you"
- "Ready for the truth?"
- "Let me ask you something"

🎯 PERSONAL STORY:
- "I'll never forget the moment"
- "Here's something I learned the hard way"
- "Can I be honest for a second?"

🎯 VALUE PROMISE:
- "Save this for later"
- "You need to hear this"
- "Let me save you some trouble"

🎯 COUNTER-INTUITIVE:
- "The opposite is actually true"
- "Unpopular opinion but"
- "You've been lied to about"

## COMMENT BAITING (Natural, not spammy)

Sprinkle these throughout the body:
- "What's your take on this?"
- "Do you agree or disagree?"
- "Where do you stand on this?"
- "What's been your experience?"
- "Thoughts?"

## EMOJI STRATEGY

- Use 2-4 emojis strategically throughout
- Place them to break up text sections
- Use them to emphasize key points
- Don't overdo it (not every sentence)

## FORMATTING FOR READABILITY

- Short paragraphs (1-2 sentences max)
- Use line breaks liberally
- Create visual rhythm
- Make it skimmable but valuable

## CONVERSION PSYCHOLOGY

The ManyChat CTA must feel:
- Helpful, not transactional
- Natural next step, not forced
- Value-driven, not demand-driven
- Like an invitation, not a requirement

Examples:
❌ "Comment START below" (too direct)
✅ "Want the full breakdown? Comment START and I'll send it your way"

❌ "Comment FORM" (abrupt)
✅ "Drop FORM below and I'll share my complete form checklist"

## CAPTION STRUCTURE

1. HOOK (1 line, punchy, stops the scroll)
2. BRIDGE (connect hook to value)
3. VALUE (the meat, what they get)
4. COMMENT BAIT (question that drives engagement)
5. CTA (ManyChat keyword, positioned as helpful)

## QUALITY CHECKLIST

Before finalizing, ensure:
✅ Hook is under 15 words
✅ First sentence creates curiosity
✅ At least one emoji in first 3 lines
✅ Comment-bait question in body
✅ ManyChat CTA feels helpful
✅ Total length 100-200 words
✅ No hashtags in body
✅ No markdown formatting
✅ Sounds like a real person

Remember: Your goal is CONVERSATION, not broadcasting. Think "chat with a friend" not "announce to audience."""

    def _build_master_prompt(
        self,
        video_analysis: Dict,
        manychat_keyword: str,
        target_audience: str,
        caption_purpose: str,
        framework: str,
        hook_category: str
    ) -> str:
        """Build comprehensive generation prompt"""

        # Get example hooks for the selected category
        example_hooks = HOOK_PATTERNS.get(hook_category, HOOK_PATTERNS['curiosity_positive'])

        prompt = f"""Generate a MASTER-LEVEL Instagram caption using this analysis:

## VIDEO CONTENT
Type: {video_analysis.get('content_type', 'general')}
Vibe: {video_analysis.get('vibe', 'neutral')}
Core Message: {video_analysis.get('core_message', 'Engaging content')}
Value Proposition: {video_analysis.get('value_proposition', 'Valuable insights')}
Visual Description: {video_analysis.get('visual_description', 'Engaging visuals')}

## TARGET AUDIENCE
{target_audience}

## CAPTION PURPOSE
{caption_purpose}

## HOOK CATEGORY TO USE
{hook_category}

Example hooks in this category:
{chr(10).join(f"- {h}" for h in example_hooks[:5])}

## MANYCHAT KEYWORD
{manychat_keyword}

## REQUIREMENTS

1. Hook: Use the {hook_category} pattern, be ORIGINAL and punchy (under 15 words)
2. Body: 3-5 short paragraphs, add value, be authentic
3. Comment bait: Include at least one natural question for engagement
4. Emojis: Use 2-4 strategically throughout
5. CTA: Make "{manychat_keyword}" feel like a helpful next step
6. Formatting: Short paragraphs, clear line breaks
7. Length: 100-200 words total

Generate the caption now:"""

        return prompt


def generate_master_captions_for_test():
    """Generate test captions with the master system"""

    generator = MasterCaptionGenerator()

    test_scenarios = [
        {
            "name": "Fitness - Tutorial",
            "video_analysis": {
                "content_type": "tutorial",
                "vibe": "energetic",
                "core_message": "Proper form prevents injury and maximizes results",
                "value_proposition": "Learn correct form to avoid common mistakes",
                "visual_description": "Workout demonstration with proper form cues"
            },
            "manychat_keyword": "FORM",
            "target_audience": "Fitness beginners and gym-goers",
            "caption_purpose": "engagement"
        },
        {
            "name": "Business - Mindset",
            "video_analysis": {
                "content_type": "motivational",
                "vibe": "inspiring",
                "core_message": "Your mindset determines your success more than circumstances",
                "value_proposition": "Shift your perspective to unlock potential",
                "visual_description": "Passionate speaker sharing mindset insights"
            },
            "manychat_keyword": "START",
            "target_audience": "Aspiring entrepreneurs",
            "caption_purpose": "conversion"
        },
        {
            "name": "Travel - Lifestyle",
            "video_analysis": {
                "content_type": "entertainment",
                "vibe": "casual",
                "core_message": "Authentic travel experiences beat tourist traps",
                "value_proposition": "Discover genuine destinations and experiences",
                "visual_description": "Beautiful hidden gem travel location"
            },
            "manychat_keyword": "TRAVEL",
            "target_audience": "Travel enthusiasts",
            "caption_purpose": "engagement"
        }
    ]

    print("=" * 100)
    print("MASTER-LEVEL CAPTION GENERATION")
    print("=" * 100)

    for scenario in test_scenarios:
        print(f"\n{'=' * 100}")
        print(f"SCENARIO: {scenario['name']}")
        print(f"{'=' * 100}")
        print(f"\nType: {scenario['video_analysis']['content_type']}")
        print(f"Vibe: {scenario['video_analysis']['vibe']}")
        print(f"Keyword: {scenario['manychat_keyword']}")
        print(f"Purpose: {scenario['caption_purpose']}")

        print("\n" + "-" * 100)
        print("GENERATING MASTER CAPTION...")
        print("-" * 100)

        caption = generator.generate_caption(
            video_analysis=scenario['video_analysis'],
            manychat_keyword=scenario['manychat_keyword'],
            target_audience=scenario['target_audience'],
            caption_purpose=scenario['caption_purpose']
        )

        print("\n📝 MASTER CAPTION:")
        print("-" * 100)
        print(caption)
        print("-" * 100)

        # Analyze the caption
        lines = caption.split('\n')
        hook = lines[0] if lines else ""

        print(f"\n🔍 ANALYSIS:")
        print(f"Hook length: {len(hook.split())} words")
        print(f"Hook pattern: {hook[:50]}...")

        # Check for comment bait
        has_question = '?' in caption
        has_comment_trigger = any(word in caption.lower() for word in ['thoughts?', 'your take', 'agree?', 'experience'])

        print(f"Comment bait: {'✅' if (has_question or has_comment_trigger) else '❌'}")

        # Check emoji usage
        emoji_count = sum(1 for c in caption if ord(c) > 127000)
        print(f"Emoji count: {emoji_count} ({'✅' if 2 <= emoji_count <= 5 else '❌'})")

        # Check formatting
        has_spacing = '\n\n' in caption
        print(f"Good formatting: {'✅' if has_spacing else '❌'}")

        # Check ManyChat CTA
        keyword_present = scenario['manychat_keyword'].upper() in caption.upper()
        cta_natural = 'comment' in caption.lower() and len(caption.split('comment')) > 1
        print(f"Natural CTA: {'✅' if (keyword_present and cta_natural) else '❌'}")

        print("\n")


if __name__ == "__main__":
    generate_master_captions_for_test()
