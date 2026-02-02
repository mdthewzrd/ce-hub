"""
RAG-Based Caption Learner
Learns from top-performing captions to improve generation quality
"""

import os
import json
import sqlite3
from typing import Dict, List, Optional
from pathlib import Path
import requests
from datetime import datetime

# Database path
DB_PATH = Path(__file__).parent.parent.parent / "harmonatica.db"


class CaptionRAGSystem:
    """Retrieval-Augmented Generation for caption learning"""

    def __init__(self):
        self.embedding_cache = {}

    def get_top_performing_examples(
        self,
        content_type: str = None,
        vibe: str = None,
        limit: int = 5
    ) -> List[Dict]:
        """
        Retrieve top-performing captions as examples for new generation

        Uses filters to find the most relevant successful examples
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        query = """
            SELECT
                caption,
                hook,
                content_type,
                vibe,
                engagement_rate,
                likes,
                views,
                performance_tier
            FROM top_performers
            WHERE 1=1
        """

        params = []

        if content_type:
            query += " AND content_type = ?"
            params.append(content_type)

        if vibe:
            query += " AND vibe = ?"
            params.append(vibe)

        query += """
            ORDER BY engagement_rate DESC
            LIMIT ?
        """
        params.append(limit)

        cursor.execute(query, params)
        results = [dict(row) for row in cursor.fetchall()]

        conn.close()

        print(f"[RAG] Retrieved {len(results)} top-performing examples")
        return results

    def extract_successful_patterns(self) -> Dict[str, List[str]]:
        """
        Extract patterns that correlate with high performance

        Returns categorized patterns:
        - hook_patterns: Opening hooks that work
        - transition_phrases: Phrases that flow well
        - cta_variations: Effective call-to-actions
        - structure_templates: Proven caption structures
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Analyze top 10% performers
        cursor.execute("""
            SELECT caption, hook, engagement_rate
            FROM top_performers
            WHERE performance_tier IN ('top_1%', 'top_5%', 'top_10%')
            ORDER BY engagement_rate DESC
        """)

        top_captions = [dict(row) for row in cursor.fetchall()]

        patterns = {
            'hook_patterns': [],
            'transition_phrases': [],
            'cta_variations': [],
            'structure_templates': []
        }

        for caption_data in top_captions:
            caption = caption_data['caption']
            engagement = caption_data['engagement_rate']

            # Extract hook
            hook = caption_data['hook']
            if hook and len(hook) > 10:
                patterns['hook_patterns'].append({
                    'pattern': hook,
                    'avg_engagement': engagement,
                    'usage_count': 1
                })

            # Extract common transition phrases (3-5 words)
            lines = caption.split('\n')
            for i, line in enumerate(lines[1:-1]):  # Skip hook and CTA
                words = line.strip().split()
                if 3 <= len(words) <= 5:
                    phrase = ' '.join(words)
                    if any(word in phrase.lower() for word in ['but', 'so', 'when', 'if', 'because', 'that\'s']):
                        patterns['transition_phrases'].append({
                            'pattern': phrase,
                            'avg_engagement': engagement
                        })

            # Extract CTA variations
            last_line = lines[-1] if lines else ''
            if 'comment' in last_line.lower() and '"' in last_line:
                patterns['cta_variations'].append({
                    'pattern': last_line.strip(),
                    'avg_engagement': engagement
                })

            # Analyze structure (line count, paragraph breaks)
            structure = f"{len(lines)}_lines"
            patterns['structure_templates'].append({
                'pattern': structure,
                'avg_engagement': engagement
            })

        conn.close()

        # Remove duplicates and sort by engagement
        for key in patterns:
            unique = {}
            for item in patterns[key]:
                pattern = item['pattern']
                if pattern not in unique:
                    unique[pattern] = {
                        'pattern': pattern,
                        'total_engagement': 0,
                        'count': 0
                    }
                unique[pattern]['total_engagement'] += item.get('avg_engagement', 0)
                unique[pattern]['count'] += 1

            # Calculate average and sort
            sorted_patterns = sorted(
                [
                    {
                        'pattern': k,
                        'avg_engagement': v['total_engagement'] / v['count'],
                        'usage_count': v['count']
                    }
                    for k, v in unique.items()
                ],
                key=lambda x: x['avg_engagement'],
                reverse=True
            )

            patterns[key] = sorted_patterns[:20]  # Top 20 per category

        return patterns

    def build_learning_context(
        self,
        video_analysis: Dict,
        limit_examples: int = 3
    ) -> str:
        """
        Build RAG context from top performers for current generation

        This context gets added to the caption generation prompt
        """
        # Get relevant examples
        examples = self.get_top_performing_examples(
            content_type=video_analysis.get('content_type'),
            vibe=video_analysis.get('vibe'),
            limit=limit_examples
        )

        if not examples:
            return ""

        # Get successful patterns
        patterns = self.extract_successful_patterns()

        # Build context string
        context = "\n\n## LEARNING FROM TOP-PERFORMING CAPTIONS\n\n"

        context += "### EXAMPLES OF SUCCESSFUL CAPTIONS (similar content type):\n"
        for i, ex in enumerate(examples[:3], 1):
            context += f"\nExample {i} ({ex.get('performance_tier', 'top')} - {ex.get('engagement_rate', 0):.1f}% engagement):\n"
            context += f"Hook: {ex.get('hook', 'N/A')}\n"
            context += f"Caption: {ex.get('caption', 'N/A')[:200]}...\n"

        context += "\n### PROVEN HOOK PATTERNS (high-engagement openings):\n"
        for hook in patterns.get('hook_patterns', [])[:5]:
            context += f"- \"{hook['pattern']}\" ({hook['avg_engagement']:.1f}% avg)\n"

        context += "\n### EFFECTIVE TRANSITION PHRASES:\n"
        for phrase in patterns.get('transition_phrases', [])[:5]:
            context += f"- \"{phrase['pattern']}\"\n"

        context += "\n**LEARNING OBJECTIVE**: Study these patterns and understand what makes them work, but create something FRESH and UNIQUE - don't copy directly.\n"

        return context

    def should_use_learned_pattern(self, pattern: str) -> bool:
        """
        Check if a pattern should be used based on its success rate

        Returns True if the pattern has proven effective
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        cursor.execute("""
            SELECT avg_engagement_rate, success_rate
            FROM successful_patterns
            WHERE pattern = ?
        """, (pattern,))

        result = cursor.fetchone()
        conn.close()

        if result:
            avg_engagement, success_rate = result
            # Pattern is proven if it has >2% engagement and >50% success rate
            return avg_engagement > 2.0 and success_rate > 0.5

        return False

    def learn_from_feedback(
        self,
        caption: str,
        engagement_rate: float,
        benchmark_rating: str
    ):
        """
        Learn from caption performance to improve future generations

        Updates successful_patterns database
        """
        if engagement_rate < 1.0:  # Only learn from decent performing content
            return

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        # Extract and store hook pattern
        hook = caption.split('\n')[0] if caption else ''
        if hook:
            cursor.execute("""
                INSERT OR REPLACE INTO successful_patterns
                (pattern, pattern_type, avg_engagement_rate, success_rate, last_used)
                VALUES (?, 'hook',
                    COALESCE((SELECT avg_engagement_rate FROM successful_patterns WHERE pattern = ?), 0) * 0.8 + ? * 0.2,
                    COALESCE((SELECT success_rate FROM successful_patterns WHERE pattern = ?), 0) * 0.8 + 1.0 * 0.2,
                    CURRENT_TIMESTAMP)
            """, (hook, hook, engagement_rate, hook))

        # Extract transition phrases
        lines = caption.split('\n')
        for line in lines[1:-1]:
            words = line.strip().split()
            if 3 <= len(words) <= 5:
                phrase = ' '.join(words)
                cursor.execute("""
                    INSERT OR IGNORE INTO successful_patterns
                    (pattern, pattern_type, avg_engagement_rate, success_rate)
                    VALUES (?, 'transition', ?, 1.0)
                """, (phrase, engagement_rate))

        # Increment usage count
        cursor.execute("""
            UPDATE successful_patterns
            SET usage_count = usage_count + 1
            WHERE pattern = ?
        """, (hook,))

        conn.commit()
        conn.close()

        print(f"[RAG] Learned from feedback: {benchmark_rating} ({engagement_rate:.2f}% engagement)")


class CaptionKnowledgeBase:
    """Knowledge base for caption generation insights"""

    def __init__(self):
        self.rag = CaptionRAGSystem()

    def get_generation_insights(self, video_analysis: Dict) -> Dict:
        """
        Get comprehensive insights for caption generation

        Combines:
        - Top performing examples (RAG)
        - Successful patterns
        - Hook variety analysis
        - Engagement predictions
        """
        insights = {
            'examples': [],
            'patterns': {},
            'recommendations': []
        }

        # Get relevant examples
        examples = self.rag.get_top_performing_examples(
            content_type=video_analysis.get('content_type'),
            vibe=video_analysis.get('vibe'),
            limit=3
        )

        insights['examples'] = examples

        # Get patterns
        patterns = self.rag.extract_successful_patterns()
        insights['patterns'] = patterns

        # Generate recommendations
        if examples:
            avg_engagement = sum(e.get('engagement_rate', 0) for e in examples) / len(examples)
            if avg_engagement > 5.0:
                insights['recommendations'].append(
                    f"This content type performs very well (avg {avg_engagement:.1f}% engagement). Focus on authenticity and value."
                )

        # Check hook variety
        hooks = [e['hook'] for e in examples if e.get('hook')]
        if len(set(hooks)) < len(hooks):
            insights['recommendations'].append(
                "⚠️ Limited hook variety detected. Consider using a completely different opening."
            )

        return insights

    def store_generation_result(
        self,
        caption: str,
        video_analysis: Dict,
        quality_scores: Dict
    ):
        """
        Store generation result for future learning
        """
        # This will be called after generation, and actual performance
        # will be updated later via learn_from_feedback()
        pass


# Singleton
_rag_system = None
_knowledge_base = None


def get_rag_system() -> CaptionRAGSystem:
    """Get RAG system singleton"""
    global _rag_system
    if _rag_system is None:
        _rag_system = CaptionRAGSystem()
    return _rag_system


def get_knowledge_base() -> CaptionKnowledgeBase:
    """Get knowledge base singleton"""
    global _knowledge_base
    if _knowledge_base is None:
        _knowledge_base = CaptionKnowledgeBase()
    return _knowledge_base


if __name__ == "__main__":
    # Test RAG system
    rag = get_rag_system()

    print("\n=== SUCCESSFUL PATTERNS ===")
    patterns = rag.extract_successful_patterns()
    print(json.dumps(patterns, indent=2))

    print("\n=== LEARNING CONTEXT TEST ===")
    video_analysis = {
        'content_type': 'tutorial',
        'vibe': 'energetic'
    }
    context = rag.build_learning_context(video_analysis)
    print(context)
