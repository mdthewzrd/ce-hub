"""
Content Preparation Engine for Semi-Automated Workflow
Downloads videos, generates captions, and prepares content for manual posting
"""

import os
import sqlite3
import requests
import tempfile
from pathlib import Path
from typing import Dict, Optional, List
from datetime import datetime, timedelta
import re

# OpenRouter for AI captions
import openai

# Database - use absolute path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), "instagram_automation.db"))

# Content storage
CONTENT_DIR = os.path.join(os.path.dirname(__file__), "prepared_content")
Path(CONTENT_DIR).mkdir(exist_ok=True)


class ContentPreparer:
    """
    Prepares content for manual posting workflow

    Process:
    1. Download video from source content
    2. Generate AI caption
    3. Extract hashtags
    4. Save to ready_content table
    """

    def __init__(self, openrouter_api_key: Optional[str] = None):
        """
        Initialize content preparer

        Args:
            openrouter_api_key: OpenRouter API key for AI caption generation
        """
        self.openrouter_api_key = openrouter_api_key or os.getenv("OPENROUTER_API_KEY")

        if self.openrouter_api_key:
            openai.api_key = self.openrouter_api_key
            openai.api_base = "https://openrouter.ai/api/v1"

    # ============================================================
    # VIDEO DOWNLOAD
    # ============================================================

    def download_video(self, media_url: str, source_id: int) -> Optional[str]:
        """
        Download video from source content

        Args:
            media_url: URL of the video to download
            source_id: Source content ID for naming

        Returns:
            Local path to downloaded video, or None if failed
        """
        if not media_url:
            return None

        try:
            print(f"Downloading video for source {source_id}...")

            response = requests.get(media_url, stream=True, timeout=30)
            response.raise_for_status()

            # Create filename
            filename = f"source_{source_id}_{datetime.now().strftime('%Y%m%d_%H%M%S')}.mp4"
            video_path = os.path.join(CONTENT_DIR, filename)

            # Download with chunking for large files
            with open(video_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            print(f"Video downloaded: {video_path}")
            return video_path

        except Exception as e:
            print(f"Failed to download video: {e}")
            return None

    def download_thumbnail(self, thumbnail_url: str, source_id: int) -> Optional[str]:
        """
        Download thumbnail image

        Args:
            thumbnail_url: URL of the thumbnail
            source_id: Source content ID for naming

        Returns:
            Local path to downloaded thumbnail, or None if failed
        """
        if not thumbnail_url:
            return None

        try:
            response = requests.get(thumbnail_url, stream=True, timeout=30)
            response.raise_for_status()

            filename = f"source_{source_id}_thumb.jpg"
            thumb_path = os.path.join(CONTENT_DIR, filename)

            with open(thumb_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    if chunk:
                        f.write(chunk)

            return thumb_path

        except Exception as e:
            print(f"Failed to download thumbnail: {e}")
            return None

    # ============================================================
    # AI CAPTION GENERATION
    # ============================================================

    def generate_caption(
        self,
        content_description: str,
        category: str = "general",
        platform: str = "instagram",
        tone: str = "engaging",
        include_hashtags: bool = True,
        hashtag_count: int = 15,
        persona: str = None
    ) -> Dict[str, str]:
        """
        Generate AI caption using OpenRouter

        Args:
            content_description: Description of the content
            category: Content category (motivation, fitness, business, etc.)
            platform: Target platform (instagram, tiktok, youtube)
            tone: Caption tone (engaging, informative, casual, professional)
            include_hashtags: Whether to include hashtags
            hashtag_count: Number of hashtags to generate
            persona: Brand persona (expert, friend, luxury, leader, etc.)

        Returns:
            Dict with 'caption' and 'hashtags' keys
        """
        if not self.openrouter_api_key:
            # Fallback to basic caption
            return self._generate_basic_caption(content_description, category, persona)

        try:
            prompt = self._build_caption_prompt(
                content_description, category, platform, tone, include_hashtags, hashtag_count, persona
            )

            response = openai.ChatCompletion.create(
                model="anthropic/claude-3-haiku",
                messages=[
                    {
                        "role": "system",
                        "content": "You are an expert social media content creator. Generate engaging, viral-worthy captions with relevant hashtags."
                    },
                    {
                        "role": "user",
                        "content": prompt
                    }
                ],
                max_tokens=500,
                temperature=0.8
            )

            result = response.choices[0].message.content.strip()

            # Parse caption and hashtags
            return self._parse_caption_result(result, include_hashtags)

        except Exception as e:
            print(f"AI caption generation failed: {e}")
            return self._generate_basic_caption(content_description, category, persona)

    def _build_caption_prompt(
        self,
        content_description: str,
        category: str,
        platform: str,
        tone: str,
        include_hashtags: bool,
        hashtag_count: int,
        persona: str = None
    ) -> str:
        """Build prompt for AI caption generation"""

        # Persona-specific instructions
        persona_instructions = {
            "expert": "Write as a knowledgeable, helpful expert who provides valuable insights.",
            "friend": "Write as a fun, relatable friend who's enthusiastic and casual.",
            "luxury": "Write as a premium luxury brand - sophisticated, exclusive, and elegant.",
            "leader": "Write as an inspirational leader who motivates and empowers others.",
            "relatable": "Write in a down-to-earth, authentic way that connects personally.",
            "edgy": "Write with bold, provocative energy that challenges the status quo.",
            "professional": "Write with authority, credibility, and professional expertise.",
            "creative": "Write with playful creativity, unique metaphors, and artistic flair.",
            "authentic": "Write raw, honest, and vulnerable - no filters, real talk only."
        }

        persona_instruction = persona_instructions.get(persona, "")

        prompt = f"""Create a {tone} Instagram caption for content about: {content_description}

Category: {category}
Platform: {platform}
{f'Brand Persona: {persona_instruction}' if persona_instruction else ''}

Requirements:
- 1-2 short sentences hook
- 2-3 sentences main content
- Call to action or question at the end
"""

        if include_hashtags:
            prompt += f"\n- Include {hashtag_count} relevant, trending hashtags at the end\n"
            prompt += "\nFormat: [caption text]\n\n[hashtags]"

        return prompt

    def _parse_caption_result(self, result: str, include_hashtags: bool) -> Dict[str, str]:
        """Parse AI result into caption and hashtags"""
        if not include_hashtags:
            return {"caption": result, "hashtags": ""}

        # Split by double newline to separate caption from hashtags
        parts = result.split("\n\n")

        caption = parts[0].strip()
        hashtags = ""

        if len(parts) > 1:
            # Extract hashtags from second part
            hashtag_text = parts[1].strip()
            # Find all hashtags
            hashtags = " ".join(re.findall(r'#\w+', hashtag_text))

        return {"caption": caption, "hashtags": hashtags}

    def _generate_basic_caption(self, content_description: str, category: str, persona: str = None) -> Dict[str, str]:
        """Generate basic caption without AI"""
        caption = f"{content_description}\n\nDouble tap if you agree! 💭"

        # Category-specific hashtags
        category_hashtags = {
            "motivation": "#motivation #success #mindset #goals #inspiration #nevergiveup",
            "fitness": "#fitness #workout #gym #health #fitnessmotivation #fitfam",
            "business": "#business #entrepreneur #success #money #motivation #hustle",
            "lifestyle": "#lifestyle #life #goodvibes #positive #vibes #mood",
            "education": "#education #learning #knowledge #growth #mindset #facts",
            "entertainment": "#funny #comedy #entertainment #viral #trending #fyp",
            "travel": "#travel #wanderlust #adventure #explore #travelgram #vacation",
            "food": "#food #foodie #foodporn #instafood #yummy #delicious",
            "fashion": "#fashion #style #ootd #fashionista #streetstyle #outfit",
            "general": "#viral #trending #fyp #explore #content #creator"
        }

        hashtags = category_hashtags.get(category, "#viral #trending #fyp #explore")

        return {"caption": caption, "hashtags": hashtags}

    # ============================================================
    # CONTENT PREPARATION
    # ============================================================

    def prepare_content(
        self,
        source_id: int,
        caption_params: Optional[Dict] = None
    ) -> Optional[Dict]:
        """
        Prepare content from source for manual posting

        Args:
            source_id: Source content ID
            caption_params: Optional params for caption generation

        Returns:
            Dict with prepared content details, or None if failed
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get source content
        cursor.execute("SELECT * FROM source_content WHERE id = ?", (source_id,))
        source = cursor.fetchone()

        if not source:
            print(f"Source content {source_id} not found")
            conn.close()
            return None

        source = dict(source)

        print(f"\n🎬 Preparing content from: {source['account']}")
        print(f"Original URL: {source['original_url']}")

        # Step 1: Download video
        video_path = self.download_video(source.get('media_url'), source_id)
        if not video_path:
            print("Failed to download video")
            conn.close()
            return None

        # Step 2: Download thumbnail
        thumbnail_path = self.download_thumbnail(source.get('thumbnail_url'), source_id)

        # Step 3: Generate caption
        caption_params = caption_params or {}
        caption_result = self.generate_caption(
            content_description=source.get('description', ''),
            category=caption_params.get('category', 'general'),
            tone=caption_params.get('tone', 'engaging'),
            persona=caption_params.get('persona', 'expert')
        )

        # Step 4: Extract hashtags from original content
        original_hashtags = self._extract_hashtags(source.get('hashtags', ''))
        ai_hashtags = caption_result.get('hashtags', '')

        # Combine hashtags
        all_hashtags = f"{original_hashtags} {ai_hashtags}".strip()

        # Step 5: Create ready_content record
        cursor.execute("""
            INSERT INTO ready_content (
                source_id,
                video_path,
                thumbnail_path,
                caption,
                hashtags,
                status,
                created_at,
                updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
        """, (
            source_id,
            video_path,
            thumbnail_path,
            caption_result.get('caption'),
            all_hashtags
        ))

        ready_id = cursor.lastrowid
        conn.commit()
        conn.close()

        print(f"\n✅ Content prepared successfully!")
        print(f"Ready Content ID: {ready_id}")
        print(f"Video: {video_path}")
        print(f"Caption: {caption_result.get('caption')[:100]}...")

        return {
            "ready_id": ready_id,
            "video_path": video_path,
            "thumbnail_path": thumbnail_path,
            "caption": caption_result.get('caption'),
            "hashtags": all_hashtags
        }

    def batch_prepare_content(
        self,
        limit: int = 10,
        min_engagement_rate: float = 0,
        content_type: Optional[str] = None
    ) -> List[Dict]:
        """
        Prepare multiple content items from pending source content

        Args:
            limit: Maximum number of items to prepare
            min_engagement_rate: Minimum engagement rate threshold
            content_type: Filter by content type (reel, post, story)

        Returns:
            List of prepared content results
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Query for pending source content
        query = """
            SELECT * FROM source_content
            WHERE status = 'pending'
        """
        params = []

        if min_engagement_rate > 0:
            query += " AND engagement_rate >= ?"
            params.append(min_engagement_rate)

        if content_type:
            query += " AND content_type = ?"
            params.append(content_type)

        query += " ORDER BY engagement_rate DESC LIMIT ?"
        params.append(limit)

        cursor.execute(query, params)
        sources = [dict(row) for row in cursor.fetchall()]
        conn.close()

        print(f"\n🎬 Preparing {len(sources)} content items...")

        results = []
        for i, source in enumerate(sources, 1):
            print(f"\n[{i}/{len(sources)}] Processing: {source['account']}")

            result = self.prepare_content(source['id'])
            if result:
                results.append(result)

        print(f"\n✅ Prepared {len(results)} content items successfully")

        return results

    def _extract_hashtags(self, text: str) -> str:
        """Extract hashtags from text"""
        if not text:
            return ""
        hashtags = re.findall(r'#\w+', text)
        return " ".join(hashtags)


# ============================================================
# Command Line Interface
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Content Preparation Engine")
    parser.add_argument("--source-id", type=int, help="Source content ID to prepare")
    parser.add_argument("--batch", action="store_true", help="Batch prepare pending content")
    parser.add_argument("--limit", type=int, default=10, help="Number of items for batch")
    parser.add_argument("--min-engagement", type=float, default=0, help="Min engagement rate")
    parser.add_argument("--content-type", choices=['reel', 'post', 'story'], help="Content type filter")
    parser.add_argument("--category", default="general", help="Caption category")
    parser.add_argument("--tone", default="engaging", help="Caption tone")

    args = parser.parse_args()

    # Get API key from environment
    api_key = os.getenv("OPENROUTER_API_KEY")
    if not api_key:
        print("Warning: OPENROUTER_API_KEY not found. Using basic captions.")

    preparer = ContentPreparer(openrouter_api_key=api_key)

    if args.source_id:
        # Single content preparation
        result = preparer.prepare_content(
            source_id=args.source_id,
            caption_params={
                "category": args.category,
                "tone": args.tone
            }
        )
        if result:
            print(f"\n✅ Content ready: {result}")
        else:
            print(f"\n❌ Failed to prepare content")

    elif args.batch:
        # Batch preparation
        results = preparer.batch_prepare_content(
            limit=args.limit,
            min_engagement_rate=args.min_engagement,
            content_type=args.content_type
        )
        print(f"\n📊 Prepared {len(results)} items")

    else:
        print("\nPlease provide --source-id or --batch")
        print("\nExamples:")
        print("  python content_preparer.py --source-id 1")
        print("  python content_preparer.py --batch --limit 5 --content-type reel")
