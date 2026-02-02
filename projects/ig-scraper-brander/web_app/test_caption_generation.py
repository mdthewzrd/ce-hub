"""
Caption Quality Testing & Enhancement
Tests current generation and implements master-level improvements
"""

import os
import sys
from pathlib import Path

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

from dotenv import load_dotenv
load_dotenv()

import requests
import json

# Test scenarios with realistic video content
TEST_SCENARIOS = [
    {
        "name": "Fitness Tips",
        "video_analysis": {
            "content_type": "tutorial",
            "vibe": "energetic",
            "visual_description": "Person demonstrating a workout routine in a gym, showing proper form for exercises",
            "activity": "Fitness instruction and workout demonstration",
            "core_message": "Proper form prevents injury and maximizes results",
            "value_proposition": "Learn the right way to do common exercises",
            "engagement_triggers": ["Clear demonstrations", "Actionable tips", "Expert knowledge"]
        },
        "original_caption": "Here's how to do squats properly! Stop making these common mistakes. Your knees will thank you later. #fitness #workout",
        "target_audience": "Fitness beginners and gym-goers",
        "manychat_keyword": "FORM"
    },
    {
        "name": "Business/Mindset",
        "video_analysis": {
            "content_type": "motivational",
            "vibe": "inspiring",
            "visual_description": "Person speaking directly to camera with passion, gesturing emphatically about mindset and success",
            "activity": "Motivational speaking about business and mindset",
            "core_message": "Your mindset determines your success more than your circumstances",
            "value_proposition": "Shift your perspective to unlock your potential",
            "engagement_triggers": ["Emotional resonance", "Relatable struggle", "Hope and possibility"]
        },
        "original_caption": "Stop thinking you're not ready. You'll never feel ready so just start. The moment you decide is the moment everything changes. #mindset #entrepreneur",
        "target_audience": "Aspiring entrepreneurs and creators",
        "manychat_keyword": "START"
    },
    {
        "name": "Lifestyle/Travel",
        "video_analysis": {
            "content_type": "entertainment",
            "vibe": "casual",
            "visual_description": "Beautiful travel destination footage with person enjoying the moment, scenic views",
            "activity": "Travel vlog showing hidden gems and experiences",
            "core_message": "This place changed how I view travel",
            "value_proposition": "Discover destinations that feel authentic",
            "engagement_triggers": ["Beautiful scenery", "Authentic experience", "Travel inspiration"]
        },
        "original_caption": "Found this spot by accident and it ended up being the highlight of my trip. Sometimes the best moments aren't planned. #travel #wanderlust",
        "target_audience": "Travel enthusiasts and adventure seekers",
        "manychat_keyword": "TRAVEL"
    }
]


def generate_caption_with_current_system(scenario):
    """Test caption generation with current prompts"""
    api_key = os.getenv("OPENROUTER_API_KEY")
    model = os.getenv("OPENROUTER_MODEL", "meta-llama/llama-3.3-70b-instruct:free")

    video_context = f"""
## VIDEO FILE INFO
Content Type: {scenario['video_analysis']['content_type']}
Vibe/Mood: {scenario['video_analysis']['vibe']}

## ORIGINAL CAPTION (for reference)
{scenario['original_caption']}

## AI VIDEO ANALYSIS
Content Type: {scenario['video_analysis']['content_type']}
Vibe/Mood: {scenario['video_analysis']['vibe']}
Emotional Tone: {scenario['video_analysis']['vibe']}

## CORE MESSAGE
{scenario['video_analysis']['core_message']}

## VALUE PROPOSITION
{scenario['video_analysis']['value_proposition']}

## KEY VIDEO ELEMENTS DETECTED
{chr(10).join(f"• {elem}" for elem in scenario['video_analysis']['engagement_triggers'])}

## WHAT MAKES THIS ENGAGING
{chr(10).join(f"• {elem}" for elem in scenario['video_analysis']['engagement_triggers'])}

## VISUAL DESCRIPTION
{scenario['video_analysis']['visual_description']}

## MANYCHAT CONFIGURATION
Keyword: {scenario['manychat_keyword']}
"""

    messages = [
        {
            "role": "system",
            "content": f"""You are a skilled Instagram copywriter specializing in authentic, engaging captions for 2026. Your captions:
1. Start with genuine curiosity or relatable observations
2. Share valuable insights in a conversational, down-to-earth tone
3. Build real connection through authenticity
4. Include CTAs naturally using the ManyChat keyword
5. Use emojis thoughtfully to enhance readability
6. Format with clean line breaks for easy reading
7. Sound like a real person, not marketing copy

## MANYCHAT CTA REQUIREMENT
You MUST include this exact call-to-action: "Comment "{scenario['manychat_keyword']}" below"
- Place it naturally at the end
- Make it feel authentic and helpful

## CAPTION STRUCTURE
1. HOOK: Start with something relatable or intriguing (not clickbait)
2. VALUE: Share genuine insights, tips, or perspectives
3. CONNECTION: Create emotional resonance through authenticity
4. CTA: "Comment "{scenario['manychat_keyword']}" below

## CRITICAL CONTENT GUIDELINES FOR 2026:
- NO exaggerated claims ("will change your life", "you must know this")
- NO clickbait or shock tactics
- NO controversy for engagement's sake
- BE honest about what you know and don't know
- FOCUS on helpful, shareable content
- SOUND like you're talking to a friend

## FORMATTING REQUIREMENTS:
- NO hashtags in the caption body
- NO bold text (Instagram doesn't support markdown **bold**)
- NO excessive ALL CAPS for emphasis
- Use regular sentence case
- Clean line breaks between sections"""
        },
        {
            "role": "user",
            "content": f"""Create an engaging Instagram caption for this video using the analysis:

{video_context}

Write a caption that:
1. Uses a UNIQUE hook - create something fresh and engaging
2. Incorporates the key elements naturally
3. Matches the {scenario['video_analysis']['vibe']} vibe and {scenario['video_analysis']['content_type']} content type
4. Speaks to {scenario['target_audience']}
5. Ends with: "Comment "{scenario['manychat_keyword']}" below

Remember: Be authentic, avoid exaggerated claims, and focus on genuine value.

Generate the caption now:"""
        }
    ]

    try:
        response = requests.post(
            "https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {api_key}",
                "Content-Type": "application/json",
                "HTTP-Referer": "https://harmonatica.app",
                "X-Title": "Harmonatica Caption Test"
            },
            json={
                "model": model,
                "messages": messages,
                "temperature": 0.8,
                "max_tokens": 1500
            },
            timeout=45
        )

        if response.status_code == 200:
            result = response.json()
            caption = result['choices'][0]['message']['content']
            return caption
        else:
            return f"ERROR: {response.status_code} - {response.text}"

    except Exception as e:
        return f"ERROR: {str(e)}"


def analyze_caption_quality(caption, scenario):
    """Analyze caption quality based on conversion principles"""
    issues = []
    strengths = []
    suggestions = []

    lines = caption.split('\n')
    hook = lines[0] if lines else ""

    # Check hook quality
    if len(hook) < 15:
        issues.append("Hook too short - may not stop the scroll")
    elif len(hook) > 100:
        issues.append("Hook too long - people might skip")

    hook_words = hook.lower().split()
    if any(word in hook.lower() for word in ['here is', 'here\'s', 'this is', 'these are']):
        issues.append("Generic hook opener - 'here's/this is' is overused")

    if any(word in hook.lower() for word in ['stop', 'don\'t', 'never', 'mistake', 'wrong']):
        strengths.append("Negative framing - can create curiosity gap")

    if '?' in hook:
        strengths.append("Question hook - encourages engagement")
    elif any(word in hook.lower() for word in ['why', 'how', 'what', 'when']):
        suggestions.append("Consider making your hook a question for more engagement")

    # Check value clarity
    if 'you' in caption.lower() or 'your' in caption.lower():
        strengths.append("Direct address - speaks to the viewer")
    else:
        suggestions.append("Add more 'you' language to make it personal")

    # Check for comment triggers
    comment_triggers = ['opinion?', 'thoughts?', 'agree?', 'you think', 'your experience', 'drop a']
    if any(trigger in caption.lower() for trigger in comment_triggers):
        strengths.append("Comment bait included - encourages conversation")
    else:
        suggestions.append("Add a question or opinion request to drive comments")

    # Check ManyChat CTA
    if scenario['manychat_keyword'].upper() in caption.upper():
        if 'comment' in caption.lower() and '"' in caption:
            strengths.append(f"ManyChat keyword '{scenario['manychat_keyword']}' included naturally")
        else:
            issues.append(f"ManyChat keyword present but CTA unclear")
    else:
        issues.append(f"Missing ManyChat keyword '{scenario['manychat_keyword']}'")

    # Check formatting
    if '\n\n' in caption:
        strengths.append("Good spacing - easy to read")
    else:
        suggestions.append("Add more line breaks for better readability")

    # Check emoji usage
    emoji_count = sum(1 for char in caption if ord(char) > 127000)
    if 1 <= emoji_count <= 5:
        strengths.append("Appropriate emoji usage - enhances without overwhelming")
    elif emoji_count > 5:
        issues.append("Too many emojis - can feel spammy")
    else:
        suggestions.append("Consider adding a few emojis to break up text")

    # Check for emotional words
    emotional_words = ['feel', 'believe', 'wish', 'hope', 'struggle', 'finally', 'discovered', 'realized', 'changed']
    if any(word in caption.lower() for word in emotional_words):
        strengths.append("Emotional language - creates connection")

    # Check for specific value
    specific_indicators = ['#', 'step', 'tip', 'way', 'how', 'example', 'try']
    if any(word in caption.lower() for word in specific_indicators):
        strengths.append("Specific value offered - not just vague inspiration")

    return {
        'hook': hook,
        'issues': issues,
        'strengths': strengths,
        'suggestions': suggestions,
        'score': len(strengths) * 10 - len(issues) * 5
    }


def run_test():
    """Run caption quality tests"""
    print("=" * 80)
    print("CAPTION QUALITY TEST - CURRENT SYSTEM")
    print("=" * 80)

    for scenario in TEST_SCENARIOS:
        print(f"\n{'=' * 80}")
        print(f"TEST: {scenario['name']}")
        print(f"{'=' * 80}")
        print(f"\nVideo Type: {scenario['video_analysis']['content_type']}")
        print(f"Vibe: {scenario['video_analysis']['vibe']}")
        print(f"ManyChat Keyword: {scenario['manychat_keyword']}")
        print(f"\nOriginal Caption: {scenario['original_caption'][:100]}...")

        print("\n" + "-" * 80)
        print("GENERATING CAPTION...")
        print("-" * 80)

        caption = generate_caption_with_current_system(scenario)

        if caption.startswith("ERROR"):
            print(f"\n❌ {caption}")
            continue

        print("\n📝 GENERATED CAPTION:")
        print("-" * 80)
        print(caption)
        print("-" * 80)

        print("\n🔍 QUALITY ANALYSIS:")
        print("-" * 80)

        analysis = analyze_caption_quality(caption, scenario)

        print(f"\nHook: \"{analysis['hook']}\"")
        print(f"\n✅ Strengths ({len(analysis['strengths'])}):")
        for strength in analysis['strengths']:
            print(f"   • {strength}")

        if analysis['issues']:
            print(f"\n❌ Issues ({len(analysis['issues'])}):")
            for issue in analysis['issues']:
                print(f"   • {issue}")

        if analysis['suggestions']:
            print(f"\n💡 Suggestions ({len(analysis['suggestions'])}):")
            for suggestion in analysis['suggestions']:
                print(f"   • {suggestion}")

        print(f"\n📊 Quality Score: {analysis['score']}/100")


if __name__ == "__main__":
    run_test()
