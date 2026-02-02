"""
Caption Quality Scoring System
Analyzes and scores captions for engagement potential
"""

import re
from typing import Dict, List, Tuple
from dataclasses import dataclass


@dataclass
class QualityScore:
    """Quality score breakdown"""
    overall_score: float  # 0-100
    hook_score: float
    story_score: float
    cta_score: float
    formatting_score: float
    emoji_score: float
    hashtag_score: float

    # Issues found
    issues: List[str]
    suggestions: List[str]


class CaptionQualityScorer:
    """Scores captions for engagement potential"""

    # Power words that drive engagement
    POWER_WORDS = [
        "secret", "hack", "trick", "mistake", "shocking", "truth",
        "revealed", "discover", "proven", "guaranteed", "ultimate",
        "exclusive", "urgent", "breaking", "finally", "exact"
    ]

    # Spammy phrases to avoid
    SPAM_PHRASES = [
        "click the link in bio", "link in bio", "check link in bio",
        "buy now", "limited time only", "act now", "don't miss out",
        "free money", "get rich quick", "work from home"
    ]

    # Good emoji indicators
    ENGAGEMENT_EMOJIS = [
        "🔥", "💪", "💯", "⚡", "🎯", "🚀", "💸", "🏆", "✨",
        "😤", "💡", "🔑", "💎", "👇", "📲", "💰"
    ]

    def score_caption(self, caption: str, category: str = "general") -> QualityScore:
        """
        Score a caption for quality and engagement potential

        Args:
            caption: Full caption text
            category: Content category for context

        Returns:
            QualityScore with detailed breakdown
        """
        issues = []
        suggestions = []

        # Individual component scores
        hook_score = self._score_hook(caption, issues, suggestions)
        story_score = self._score_story(caption, issues, suggestions)
        cta_score = self._score_cta(caption, issues, suggestions)
        formatting_score = self._score_formatting(caption, issues, suggestions)
        emoji_score = self._score_emojis(caption, issues, suggestions)
        hashtag_score = self._score_hashtags(caption, issues, suggestions)

        # Calculate overall score (weighted average)
        weights = {
            "hook": 0.25,
            "story": 0.20,
            "cta": 0.25,
            "formatting": 0.10,
            "emoji": 0.10,
            "hashtag": 0.10
        }

        overall = (
            hook_score * weights["hook"] +
            story_score * weights["story"] +
            cta_score * weights["cta"] +
            formatting_score * weights["formatting"] +
            emoji_score * weights["emoji"] +
            hashtag_score * weights["hashtag"]
        )

        return QualityScore(
            overall_score=round(overall, 1),
            hook_score=hook_score,
            story_score=story_score,
            cta_score=cta_score,
            formatting_score=formatting_score,
            emoji_score=emoji_score,
            hashtag_score=hashtag_score,
            issues=issues,
            suggestions=suggestions
        )

    def _score_hook(self, caption: str, issues: List[str], suggestions: List[str]) -> float:
        """Score the hook (first 2 lines)"""
        lines = caption.split("\n")
        first_lines = [l for l in lines if l.strip()][:2]
        hook = " ".join(first_lines)

        score = 100.0

        # Length check
        if len(hook) > 140:
            score -= 20
            issues.append("Hook too long (should be <140 chars)")
        elif len(hook) < 30:
            score -= 15
            issues.append("Hook too short (needs more punch)")

        # Power word check
        if not any(word in hook.lower() for word in self.POWER_WORDS):
            score -= 10
            suggestions.append("Add a power word to the hook")

        # Question or claim check
        has_question = "?" in hook
        has_claim = any(word in hook.lower() for word in ["this", "these", "my", "the"])
        has_number = bool(re.search(r'\d+', hook))

        if not (has_question or has_claim or has_number):
            score -= 15
            suggestions.append("Make hook more compelling with a question, claim, or number")

        # Curiosity gap check
        curiosity_words = ["secret", "why", "how", "what", "didn't", "nobody", "everyone"]
        if not any(word in hook.lower() for word in curiosity_words):
            score -= 10
            suggestions.append("Create curiosity gap in hook")

        return max(0, score)

    def _score_story(self, caption: str, issues: List[str], suggestions: List[str]) -> float:
        """Score the story body"""
        # Extract story (between hook and CTA)
        lines = caption.split("\n")
        story_lines = []
        in_story = False

        for line in lines[2:]:  # Skip hook
            line_lower = line.lower().strip()
            if any(word in line_lower for word in ["comment", "follow", "save", "link"]):
                break
            if line.strip():
                story_lines.append(line)

        story = " ".join(story_lines)
        score = 100.0

        # Length check
        if len(story) < 100:
            score -= 30
            issues.append("Story too short (needs 3-5 paragraphs)")
        elif len(story) > 2000:
            score -= 20
            issues.append("Story too long (people won't read it)")

        # Paragraph structure
        paragraphs = [p for p in caption.split("\n\n") if p.strip()]
        if len(paragraphs) < 3:
            score -= 15
            suggestions.append("Add more paragraph breaks for readability")

        # Personal connection words
        personal_words = ["i", "my", "me", "i was", "i felt", "i discovered"]
        if not any(word in story.lower() for word in personal_words):
            score -= 20
            suggestions.append("Make story more personal (use 'I', 'my')")

        # Emotional words
        emotion_words = ["felt", "struggle", "pain", "breakthrough", "finally",
                        "discover", "change", "transform"]
        if not any(word in story.lower() for word in emotion_words):
            score -= 15
            suggestions.append("Add more emotional language")

        return max(0, score)

    def _score_cta(self, caption: str, issues: List[str], suggestions: List[str]) -> float:
        """Score the call-to-action"""
        caption_lower = caption.lower()
        score = 100.0

        # Check for comment CTA
        has_comment_cta = bool(re.search(r"comment\s+['\"]?\w+['\"]?", caption_lower))
        if not has_comment_cta:
            score -= 40
            issues.append("Missing comment CTA (crucial for ManyChat)")
        else:
            # Check if comment keyword is clear
            comment_match = re.search(r"comment\s+['\"]?(\w+)['\"]?", caption_lower)
            if comment_match:
                keyword = comment_match.group(1)
                if len(keyword) < 3:
                    score -= 10
                    issues.append("Comment keyword too short")
                elif len(keyword) > 15:
                    score -= 10
                    issues.append("Comment keyword too long")

        # Check for follow CTA
        if "follow" not in caption_lower:
            score -= 20
            suggestions.append("Add follow CTA")

        # Check for urgency/exclusivity
        urgency_words = ["now", "today", "limited", "only", "exclusive", "free"]
        if not any(word in caption_lower for word in urgency_words):
            score -= 15
            suggestions.append("Add urgency or exclusivity to CTA")

        # Check spam phrases
        for spam in self.SPAM_PHRASES:
            if spam in caption_lower:
                score -= 10
                issues.append(f"Spammy phrase detected: '{spam}'")

        return max(0, score)

    def _score_formatting(self, caption: str, issues: List[str], suggestions: List[str]) -> float:
        """Score formatting and readability"""
        score = 100.0

        # Line breaks
        lines = [l for l in caption.split("\n") if l.strip()]
        if len(lines) < 5:
            score -= 20
            issues.append("Not enough line breaks (needs more spacing)")

        # Check for double line breaks (paragraphs)
        if "\n\n" not in caption:
            score -= 15
            suggestions.append("Add double line breaks between paragraphs")

        # Overall length
        if len(caption) < 200:
            score -= 30
            issues.append("Caption too short")
        elif len(caption) > 2200:
            score -= 20
            issues.append("Caption exceeds Instagram limit (2200 chars)")

        # Check for proper capitalization
        if caption.islower() or caption.isupper():
            score -= 15
            issues.append("Poor capitalization (mix case properly)")

        return max(0, score)

    def _score_emojis(self, caption: str, issues: List[str], suggestions: List[str]) -> float:
        """Score emoji usage"""
        emoji_count = len([c for c in caption if ord(c) > 127])
        score = 100.0

        # Emoji count
        if emoji_count == 0:
            score -= 30
            suggestions.append("Add emojis for visual appeal")
        elif emoji_count < 3:
            score -= 10
            suggestions.append("Add more emojis (aim for 3-5)")
        elif emoji_count > 10:
            score -= 20
            issues.append("Too many emojis (looks spammy)")

        # Engagement emojis
        has_engagement_emoji = any(emoji in caption for emoji in self.ENGAGEMENT_EMOJIS)
        if not has_engagement_emoji:
            score -= 15
            suggestions.append("Use engagement-focused emojis (🔥💪💯)")

        return max(0, score)

    def _score_hashtags(self, caption: str, issues: List[str], suggestions: List[str]) -> float:
        """Score hashtag usage"""
        hashtags = re.findall(r'#\w+', caption)
        score = 100.0

        # Hashtag count
        if len(hashtags) == 0:
            score -= 40
            issues.append("No hashtags (add 15-25)")
        elif len(hashtags) < 10:
            score -= 15
            suggestions.append("Add more hashtags (aim for 15-25)")
        elif len(hashtags) > 30:
            score -= 20
            issues.append("Too many hashtags (Instagram limit is 30)")

        # Check hashtag placement (should be at bottom)
        caption_lines = caption.split("\n")
        hashtag_line_indices = [i for i, line in enumerate(caption_lines)
                               if any(line.startswith("#") for line in line)]

        if hashtag_line_indices:
            # Hashtags should be in the last few lines
            if hashtag_line_indices[0] < len(caption_lines) - 5:
                score -= 10
                suggestions.append("Move hashtags to bottom of caption")

        return max(0, score)


def score_caption_and_suggest(caption: str, category: str = "general") -> Dict:
    """
    Score a caption and get suggestions for improvement

    Args:
        caption: The caption text to score
        category: Content category for context

    Returns:
        Dict with score and suggestions
    """
    scorer = CaptionQualityScorer()
    result = scorer.score_caption(caption, category)

    return {
        "overall_score": result.overall_score,
        "breakdown": {
            "hook": result.hook_score,
            "story": result.story_score,
            "cta": result.cta_score,
            "formatting": result.formatting_score,
            "emoji": result.emoji_score,
            "hashtags": result.hashtag_score
        },
        "issues": result.issues,
        "suggestions": result.suggestions,
        "grade": _get_grade(result.overall_score)
    }


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


# CLI for testing
if __name__ == "__main__":
    test_caption = """This 2-minute routine changed everything for me 🔥

I used to wake up tired, going through the motions. Then I discovered this one simple change.

Now I have energy all day and feel amazing.

Save this so you don't forget! 🎯

Comment 'ROUTINE' and I'll send you the guide 🔥

Follow for more fitness content

#fitness #workout #motivation #gym #fitfam"""

    result = score_caption_and_suggest(test_caption, "fitness")

    print("\n" + "=" * 50)
    print("📊 CAPTION QUALITY SCORE")
    print("=" * 50)
    print(f"\nOverall Score: {result['overall_score']}/100 ({result['grade']})")
    print("\nBreakdown:")
    for component, score in result['breakdown'].items():
        print(f"  {component.title()}: {score}/100")

    if result['issues']:
        print(f"\n❌ Issues ({len(result['issues'])}):")
        for issue in result['issues']:
            print(f"  • {issue}")

    if result['suggestions']:
        print(f"\n💡 Suggestions ({len(result['suggestions'])}):")
        for suggestion in result['suggestions']:
            print(f"  • {suggestion}")
