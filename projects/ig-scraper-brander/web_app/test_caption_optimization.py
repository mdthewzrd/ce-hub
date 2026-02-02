#!/usr/bin/env python3
"""
Comprehensive Caption Generation Testing & Optimization Script

This script will:
1. Analyze current caption generation weaknesses
2. Test with multiple videos and brand voices
3. Iteratively improve the system prompt
4. Track metrics and provide recommendations
"""

import os
import sys
import json
import sqlite3
from datetime import datetime
from pathlib import Path
from typing import Dict, List, Tuple
import random

# Add parent directory to path
sys.path.insert(0, str(Path(__file__).parent.parent))

# Import caption generation service
from ai_caption_service import OpenRouterClient, VideoAnalyzer, CaptionPromptBuilder

# Database path
DB_PATH = Path(__file__).resolve().parent.parent.parent / "harmonatica.db"


class CaptionTester:
    """Test and optimize caption generation"""

    def __init__(self):
        self.client = OpenRouterClient()
        self.analyzer = VideoAnalyzer(self.client)
        self.test_results = []
        self.hook_scores = []

    def get_test_videos(self, limit: int = 10) -> List[Dict]:
        """Get videos for testing"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, video_path, account, original_caption,
                   original_likes, original_views, engagement_rate
            FROM source_content
            WHERE video_path IS NOT NULL
              AND original_caption IS NOT NULL
              AND LENGTH(original_caption) > 50
            ORDER BY RANDOM()
            LIMIT ?
        """, (limit,))

        videos = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return videos

    def get_brand_voices(self) -> List[Dict]:
        """Get all brand voice profiles for testing"""
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT id, account_username, profile_name,
                   caption_length_preference, emoji_usage, hashtag_usage,
                   spacing_style, brand_voice_description, tone_style,
                   writing_style, manychat_keyword
            FROM brand_voice_profiles
            WHERE is_active = 1
        """)

        voices = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return voices

    def evaluate_hook_strength(self, caption: str) -> Dict:
        """
        Evaluate hook strength on multiple dimensions

        Returns:
            {
                "score": 0-10,
                "issues": [],
                "strengths": []
            }
        """
        lines = caption.split('\n')
        first_line = lines[0].strip() if lines else ""

        issues = []
        strengths = []
        score = 5.0  # Base score

        # Check 1: Length (should be short and punchy)
        if len(first_line) > 150:
            issues.append("Hook too long - will be truncated on mobile")
            score -= 2
        elif len(first_line) < 30:
            issues.append("Hook too short - lacks substance")
            score -= 1
        else:
            strengths.append("Good length for mobile preview")
            score += 1

        # Check 2: Weak openings to avoid
        weak_openings = [
            "have you ever",
            "i've been thinking",
            "i wanted to talk",
            "today i want to",
            "in this video",
            "welcome back",
            "hey everyone"
        ]

        first_lower = first_line.lower()
        if any(weak in first_lower for weak in weak_openings):
            issues.append(f"Weak opening pattern detected")
            score -= 2
        else:
            strengths.append("Avoids generic openings")

        # Check 3: Strong hook patterns
        strong_patterns = {
            "curiosity_gap": ["what nobody tells you", "the mistake killing", "stop ignoring", "why nobody"],
            "counter_intuitive": ["the opposite is true", "you've been lied to", "unpopular opinion"],
            "value_promise": ["the one thing", "this changed everything", "i finally figured out"],
            "direct_question": ["what if i told you", "let me ask you", "ready for the truth?"],
            "personal_story": ["i'll never forget", "here's what i learned", "can i be honest"]
        }

        pattern_found = False
        for pattern_type, phrases in strong_patterns.items():
            if any(phrase in first_lower for phrase in phrases):
                strengths.append(f"Strong {pattern_type} pattern")
                score += 2
                pattern_found = True
                break

        if not pattern_found:
            # Check if it has curiosity elements
            if any(word in first_lower for word in ["secret", "hidden", "mistake", "truth", "nobody", "everyone", "stop"]):
                strengths.append("Has curiosity elements")
                score += 1
            else:
                issues.append("Lacks strong curiosity driver")

        # Check 4: Question marks (good for engagement)
        if '?' in first_line:
            strengths.append("Uses question format")
            score += 1

        # Check 5: Emotional words
        emotional_words = ["pain", "struggle", "fear", "love", "hate", "obsessed", "terrified", "excited"]
        if any(word in first_lower for word in emotional_words):
            strengths.append("Uses emotional language")
            score += 1

        # Check 6: Specific numbers (adds credibility)
        if any(char.isdigit() for char in first_line):
            strengths.append("Includes specific numbers")
            score += 0.5

        # Normalize score to 0-10
        score = max(0, min(10, score))

        return {
            "score": round(score, 1),
            "hook_text": first_line,
            "issues": issues,
            "strengths": strengths
        }

    def evaluate_brand_voice_compliance(self, caption: str, brand_voice: Dict) -> Dict:
        """
        Check if caption follows brand voice preferences
        """
        issues = []
        score = 10.0

        # Emoji check
        emoji_pref = brand_voice.get('emoji_usage', 'moderate').lower()
        emoji_count = sum(1 for c in caption if ord(c) > 127000)

        if emoji_pref == 'none' and emoji_count > 0:
            issues.append(f"Brand voice says NO emojis, found {emoji_count}")
            score -= 3
        elif emoji_pref == 'minimal' and emoji_count > 2:
            issues.append(f"Brand voice says minimal emojis, found {emoji_count}")
            score -= 2

        # Hashtag check
        hashtag_pref = brand_voice.get('hashtag_usage', 'none').lower()
        hashtag_count = caption.count('#')

        if hashtag_pref == 'none' and hashtag_count > 0:
            issues.append(f"Brand voice says NO hashtags, found {hashtag_count}")
            score -= 3

        # Spacing check
        spacing_pref = brand_voice.get('spacing_style', 'moderate').lower()
        line_count = len([l for l in caption.split('\n') if l.strip()])
        paragraph_count = len([p for p in caption.split('\n\n') if p.strip()])

        if spacing_pref == 'airy' and paragraph_count < line_count / 3:
            issues.append("Brand voice wants airy spacing, but caption is dense")
            score -= 1

        # Word count check
        length_pref = brand_voice.get('caption_length_preference', 'medium').lower()
        word_count = len(caption.split())

        if length_pref == 'short' and word_count > 150:
            issues.append(f"Brand voice wants short captions, got {word_count} words")
            score -= 2
        elif length_pref == 'story' and word_count < 500:
            issues.append(f"Brand voice wants story length, got {word_count} words")
            score -= 2

        return {
            "score": max(0, score),
            "compliant": len(issues) == 0,
            "issues": issues,
            "metrics": {
                "emojis": emoji_count,
                "hashtags": hashtag_count,
                "words": word_count,
                "lines": line_count
            }
        }

    def test_caption_generation(self, video: Dict, brand_voice: Dict) -> Dict:
        """
        Generate and test a caption for a specific video and brand voice

        Returns:
            {
                "video_id": int,
                "brand_voice_id": int,
                "caption": str,
                "hook_eval": dict,
                "brand_voice_eval": dict,
                "overall_score": float,
                "recommendations": list
            }
        """
        print(f"\n{'='*60}")
        print(f"Testing: Video {video['id']} × {brand_voice['profile_name']}")
        print(f"{'='*60}")

        # Build video data for analysis
        video_data = {
            "video_path": video['video_path'],
            "account": video['account'],
            "original_caption": video.get('original_caption', ''),
            "original_likes": video.get('original_likes', 0),
            "original_views": video.get('original_views', 0),
            "engagement_rate": video.get('engagement_rate', 0)
        }

        try:
            # Analyze video
            print("  → Analyzing video content...")
            analysis = self.analyzer.analyze_video(
                video_path=video['video_path'],
                existing_data=video_data
            )

            # Build brand voice context
            brand_voice_context = {
                "brand_voice": brand_voice.get('brand_voice_description', ''),
                "tone_guidelines": brand_voice.get('tone_style', ''),
                "manychat_cta": brand_voice.get('manychat_keyword', 'LINK'),
                "caption_length_preference": brand_voice.get('caption_length_preference', 'medium')
            }

            # Generate caption
            print("  → Generating caption...")
            messages = self.build_test_prompt(analysis, brand_voice_context)

            response = self.client.generate_completion(
                messages=messages,
                temperature=0.7,
                max_tokens=1500
            )

            if "choices" not in response or len(response["choices"]) == 0:
                return {
                    "video_id": video['id'],
                    "brand_voice_id": brand_voice['id'],
                    "error": "Failed to generate caption"
                }

            caption = response["choices"][0]["message"]["content"].strip()

            # Evaluate hook
            print("  → Evaluating hook strength...")
            hook_eval = self.evaluate_hook_strength(caption)
            self.hook_scores.append(hook_eval['score'])

            # Evaluate brand voice compliance
            print("  → Checking brand voice compliance...")
            brand_eval = self.evaluate_brand_voice_compliance(caption, brand_voice)

            # Calculate overall score
            overall_score = (hook_eval['score'] * 0.6) + (brand_eval['score'] * 0.4)

            # Generate recommendations
            recommendations = []
            if hook_eval['score'] < 6:
                recommendations.append("⚠️ WEAK HOOK - Needs more punch and curiosity")
            if brand_eval['score'] < 7:
                recommendations.append("⚠️ BRAND VOICE - Check compliance issues")
            if overall_score >= 8:
                recommendations.append("✅ STRONG CAPTION - Ready for production")

            result = {
                "video_id": video['id'],
                "brand_voice_id": brand_voice['id'],
                "video_account": video['account'],
                "brand_voice_name": brand_voice['profile_name'],
                "caption": caption,
                "hook_eval": hook_eval,
                "brand_voice_eval": brand_eval,
                "overall_score": round(overall_score, 1),
                "recommendations": recommendations,
                "analysis": analysis
            }

            self.test_results.append(result)

            # Print summary
            print(f"\n  📊 RESULTS:")
            print(f"     Hook Score: {hook_eval['score']}/10")
            print(f"     Brand Voice: {brand_eval['score']}/10")
            print(f"     Overall: {overall_score}/10")
            print(f"     Hook: \"{hook_eval['hook_text'][:60]}...\"")

            if hook_eval['issues']:
                print(f"     ⚠️  Issues: {', '.join(hook_eval['issues'][:2])}")

            return result

        except Exception as e:
            print(f"  ❌ ERROR: {e}")
            return {
                "video_id": video['id'],
                "brand_voice_id": brand_voice['id'],
                "error": str(e)
            }

    def build_test_prompt(self, analysis: Dict, brand_voice: Dict) -> List[Dict]:
        """Build prompt for testing"""
        system_prompt = f"""You are an ELITE Instagram copywriter specializing in scroll-stopping hooks.

## CRITICAL HOOK REQUIREMENTS

The FIRST 1-2 LINES are everything. Most people NEVER click "more".

❌ AVOID THESE WEAK OPENINGS:
- "Have you ever..."
- "I've been thinking about..."
- "Today I want to talk about..."
- "In this video I'll show..."
- "Welcome back to my channel!"

✅ USE THESE POWER HOOK PATTERNS:

🎯 CURIOSITY GAPS (Negative):
- "Stop ignoring this sign"
- "The mistake killing your [result]"
- "What nobody tells you about [topic]"
- "You've been doing [topic] wrong"

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

## BRAND VOICE:
{brand_voice.get('brand_voice', 'Authentic and engaging')}

## CAPTION REQUIREMENTS:
- Length: {brand_voice.get('caption_length_preference', 'medium')}
- First 2 lines MUST hook the reader
- NO section headers or meta-commentary
- Write like a real person, not a marketer
- Start directly with the caption content

Generate a production-ready caption now."""

        user_prompt = f"""Write a scroll-stopping Instagram caption for this video:

Content Type: {analysis.get('content_type', 'general')}
Vibe: {analysis.get('vibe', 'engaging')}
Description: {analysis.get('visual_description', 'Engaging content')}

Make the FIRST 1-2 LINES impossible to scroll past."""

        return [
            {"role": "system", "content": system_prompt},
            {"role": "user", "content": user_prompt}
        ]

    def run_comprehensive_tests(self, num_videos: int = 5, num_brand_voices: int = 3):
        """Run comprehensive test suite"""
        print("\n" + "="*60)
        print("🧪 COMPREHENSIVE CAPTION GENERATION TESTING")
        print("="*60)

        # Get test data
        videos = self.get_test_videos(limit=num_videos)
        brand_voices = self.get_brand_voices()

        if not videos:
            print("❌ No test videos found!")
            return

        if not brand_voices:
            print("❌ No brand voice profiles found!")
            return

        print(f"\n📦 Test Data:")
        print(f"   Videos: {len(videos)}")
        print(f"   Brand Voices: {len(brand_voices)}")

        # Limit brand voices if needed
        brand_voices = brand_voices[:num_brand_voices]

        # Run tests
        test_count = 0
        for video in videos:
            for brand_voice in brand_voices:
                test_count += 1
                print(f"\n[Test {test_count}/{len(videos) * len(brand_voices)}]")
                self.test_caption_generation(video, brand_voice)

        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "="*60)
        print("📊 TEST SUMMARY")
        print("="*60)

        if not self.test_results:
            print("No test results available")
            return

        # Filter successful tests
        successful = [r for r in self.test_results if 'error' not in r]

        if not successful:
            print("❌ All tests failed!")
            return

        # Calculate metrics
        avg_hook_score = sum(r['hook_eval']['score'] for r in successful) / len(successful)
        avg_brand_score = sum(r['brand_voice_eval']['score'] for r in successful) / len(successful)
        avg_overall = sum(r['overall_score'] for r in successful) / len(successful)

        strong_hooks = [r for r in successful if r['hook_eval']['score'] >= 7]
        weak_hooks = [r for r in successful if r['hook_eval']['score'] < 6]

        print(f"\n📈 Overall Metrics:")
        print(f"   Average Hook Score: {avg_hook_score:.1f}/10")
        print(f"   Average Brand Voice Score: {avg_brand_score:.1f}/10")
        print(f"   Average Overall Score: {avg_overall:.1f}/10")
        print(f"   Strong Hooks: {len(strong_hooks)}/{len(successful)} ({len(strong_hooks)/len(successful)*100:.0f}%)")
        print(f"   Weak Hooks: {len(weak_hooks)}/{len(successful)} ({len(weak_hooks)/len(successful)*100:.0f}%)")

        # Show best and worst hooks
        if strong_hooks:
            print(f"\n🏆 BEST HOOKS:")
            for r in sorted(strong_hooks, key=lambda x: x['hook_eval']['score'], reverse=True)[:3]:
                print(f"   {r['hook_eval']['score']}/10: \"{r['hook_eval']['hook_text'][:70]}...\"")

        if weak_hooks:
            print(f"\n⚠️  WEAKEST HOOKS:")
            for r in sorted(weak_hooks, key=lambda x: x['hook_eval']['score'])[:3]:
                print(f"   {r['hook_eval']['score']}/10: \"{r['hook_eval']['hook_text'][:70]}...\"")

        # Recommendations
        print(f"\n💡 RECOMMENDATIONS:")

        if avg_hook_score < 6:
            print("   🚨 URGENT: Hook patterns need major improvement")
            print("   → Add more curiosity gaps")
            print("   → Use stronger emotional language")
            print("   → Focus on first 1-2 lines only")
        elif avg_hook_score < 7:
            print("   ⚠️  Hooks need refinement")
            print("   → Test more counter-intuitive statements")
            print("   → Add specific numbers and claims")
        else:
            print("   ✅ Hooks are performing well!")

        if avg_brand_score < 7:
            print("   ⚠️  Brand voice compliance issues detected")
            print("   → Review emoji/hashtag preferences")
            print("   → Check caption length compliance")

        # Save results
        self.save_results()

    def save_results(self):
        """Save test results to file"""
        timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
        results_file = Path(__file__).parent / f"caption_test_results_{timestamp}.json"

        output = {
            "timestamp": datetime.now().isoformat(),
            "total_tests": len(self.test_results),
            "summary": {
                "avg_hook_score": sum(r['hook_eval']['score'] for r in self.test_results if 'hook_eval' in r) / max(1, len(self.test_results)),
                "avg_brand_score": sum(r['brand_voice_eval']['score'] for r in self.test_results if 'brand_voice_eval' in r) / max(1, len(self.test_results)),
                "avg_overall": sum(r['overall_score'] for r in self.test_results if 'overall_score' in r) / max(1, len(self.test_results))
            },
            "results": self.test_results
        }

        with open(results_file, 'w') as f:
            json.dump(output, f, indent=2)

        print(f"\n💾 Results saved to: {results_file}")


def main():
    """Main entry point"""
    print("🚀 Caption Generation Optimization Testing")
    print("="*60)

    tester = CaptionTester()

    # Run comprehensive tests
    tester.run_comprehensive_tests(
        num_videos=5,  # Test with 5 different videos
        num_brand_voices=3  # Test with 3 brand voices
    )

    print("\n✅ Testing complete!")


if __name__ == "__main__":
    main()
