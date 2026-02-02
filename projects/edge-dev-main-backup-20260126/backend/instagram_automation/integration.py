"""
Instagram Automation Integration Layer
Connects caption engine, scraper, and posting automation
"""

import os
import sys
from typing import Optional, List, Dict
from datetime import datetime, timedelta
import requests

# Add caption engine to path
sys.path.insert(0, os.path.join(os.path.dirname(__file__), '..', 'caption_engine'))

from caption_generator import CaptionGenerator
from database_schema import DB_PATH
import sqlite3


# ============================================================
# Configuration
# ============================================================

CAPTION_ENGINE_API = os.getenv("CAPTION_ENGINE_API", "http://localhost:3131")


# ============================================================
# Caption Generation Integration
# ============================================================

class CaptionIntegration:
    """Integration layer for caption generation with scraped content"""

    def __init__(self, openrouter_api_key: str):
        self.generator = CaptionGenerator(openrouter_api_key=openrouter_api_key)

    def generate_caption_from_source(
        self,
        source_id: int,
        category: str = "motivation",
        target_keyword: str = "FREE",
        emotion: str = "inspiring",
        use_premium: bool = False
    ) -> Optional[Dict]:
        """
        Generate a caption based on source content

        Args:
            source_id: ID of source content
            category: Content category for caption
            target_keyword: ManyChat trigger keyword
            emotion: Target emotion for caption
            use_premium: Use premium model (GPT-4o-mini)

        Returns:
            Dict with caption_id and metadata, or None if failed
        """
        # Get source content
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM source_content WHERE id = ?", (source_id,))
        source_row = cursor.fetchone()
        conn.close()

        if not source_row:
            print(f"Source content {source_id} not found")
            return None

        source = dict(source_row)

        # Build theme from description
        theme = self._build_theme_from_source(source)

        # Generate caption
        caption = self.generator.generate_caption(
            category=category,
            theme=theme,
            target_keyword=target_keyword,
            context=f"Source: {source['account']}",
            emotion=emotion,
            use_premium=use_premium
        )

        if not caption:
            print(f"Failed to generate caption for source {source_id}")
            return None

        # Get caption ID from caption engine database
        # Note: This is in the caption_engine database, not instagram_automation
        # We store the caption_id for reference

        # For now, return the caption object
        # The caller will need to store the relationship

        return {
            "caption": caption,
            "source_id": source_id,
            "category": category,
            "target_keyword": target_keyword,
            "generation_model": caption.generation_model
        }

    def generate_batch_from_sources(
        self,
        source_ids: List[int],
        category: str = "motivation",
        target_keyword: str = "FREE",
        use_premium: bool = False
    ) -> List[Dict]:
        """Generate captions for multiple source items"""
        results = []

        for source_id in source_ids:
            result = self.generate_caption_from_source(
                source_id=source_id,
                category=category,
                target_keyword=target_keyword,
                use_premium=use_premium
            )
            if result:
                results.append(result)

        return results

    def _build_theme_from_source(self, source: Dict) -> str:
        """Build a theme string from source content"""
        theme_parts = []

        if source.get("description"):
            # Use description, truncated if needed
            description = source["description"]
            if len(description) > 100:
                description = description[:97] + "..."
            theme_parts.append(description)

        if source.get("account"):
            theme_parts.append(f"from @{source['account']}")

        return " | ".join(theme_parts) if theme_parts else "Instagram content"


# ============================================================
# Scraper Integration
# ============================================================

class ScraperIntegration:
    """Integration layer for scraping content"""

    def __init__(self):
        pass

    def add_scraped_content(self, content_data: Dict) -> Optional[int]:
        """
        Add scraped content to database

        Args:
            content_data: Dict with scraped content data

        Returns:
            source_id if successful, None otherwise
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            # Check for duplicates
            cursor.execute(
                "SELECT id FROM source_content WHERE original_url = ?",
                (content_data.get("original_url"),)
            )
            if cursor.fetchone():
                print(f"Content already exists: {content_data.get('original_url')}")
                conn.close()
                return None

            # Calculate engagement rate
            engagement_rate = None
            followers = content_data.get("original_followers", 0)
            if followers > 0:
                likes = content_data.get("original_likes", 0)
                comments = content_data.get("original_comments", 0)
                engagement_rate = ((likes + comments) / followers) * 100

            cursor.execute("""
                INSERT INTO source_content (
                    original_url, account, content_type,
                    original_likes, original_comments, original_shares, original_views,
                    media_url, thumbnail_url, description, hashtags,
                    engagement_rate, status
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                content_data.get("original_url"),
                content_data.get("account"),
                content_data.get("content_type", "reel"),
                content_data.get("original_likes", 0),
                content_data.get("original_comments", 0),
                content_data.get("original_shares", 0),
                content_data.get("original_views", 0),
                content_data.get("media_url"),
                content_data.get("thumbnail_url"),
                content_data.get("description"),
                content_data.get("hashtags"),
                engagement_rate,
                "pending"
            ))

            source_id = cursor.lastrowid
            conn.commit()
            conn.close()

            print(f"Added scraped content: {source_id}")
            return source_id

        except Exception as e:
            print(f"Error adding scraped content: {e}")
            return None

    def mark_as_processed(self, source_id: int) -> bool:
        """Mark source content as processed"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            cursor.execute("""
                UPDATE source_content
                SET status = 'processed'
                WHERE id = ?
            """, (source_id,))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            print(f"Error marking as processed: {e}")
            return False


# ============================================================
# Posting Automation Integration
# ============================================================

class PostingIntegration:
    """Integration layer for posting automation"""

    def __init__(self, instagram_client=None):
        self.client = instagram_client

    def create_posted_content(
        self,
        caption_id: Optional[int] = None,
        source_id: Optional[int] = None,
        media_type: str = "reel",
        affiliate_link: Optional[str] = None,
        target_keyword: Optional[str] = None,
        scheduled_for: Optional[str] = None
    ) -> Optional[int]:
        """
        Create a new posted content record

        Args:
            caption_id: ID from caption engine
            source_id: ID of source content (if reposting)
            media_type: Type of media (reel, post, story, carousel)
            affiliate_link: Affiliate link for this post
            target_keyword: ManyChat trigger keyword
            scheduled_for: ISO datetime string for scheduling

        Returns:
            posted_id if successful, None otherwise
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            cursor.execute("""
                INSERT INTO posted_content (
                    source_id, caption_id, media_type,
                    affiliate_link, target_keyword, scheduled_for
                ) VALUES (?, ?, ?, ?, ?, ?)
            """, (
                source_id, caption_id, media_type,
                affiliate_link, target_keyword, scheduled_for
            ))

            posted_id = cursor.lastrowid
            conn.commit()
            conn.close()

            print(f"Created posted content: {posted_id}")
            return posted_id

        except Exception as e:
            print(f"Error creating posted content: {e}")
            return None

    def schedule_post(
        self,
        posted_id: int,
        scheduled_for: str
    ) -> bool:
        """Schedule a post for future publishing"""
        try:
            conn = sqlite3.connect(DB_PATH)
            cursor = conn.cursor()

            # Update posted_content
            cursor.execute("""
                UPDATE posted_content
                SET scheduled_for = ?, status = 'scheduled'
                WHERE id = ?
            """, (scheduled_for, posted_id))

            # Add to queue
            cursor.execute("""
                INSERT INTO content_queue (posted_content_id, scheduled_for, status)
                VALUES (?, ?, 'pending')
            """, (posted_id, scheduled_for))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            print(f"Error scheduling post: {e}")
            return False


# ============================================================
# Complete Workflow
# ============================================================

class InstagramAutomationWorkflow:
    """Complete automation workflow combining all components"""

    def __init__(self, openrouter_api_key: str, instagram_client=None):
        self.caption_integration = CaptionIntegration(openrouter_api_key)
        self.scraper_integration = ScraperIntegration()
        self.posting_integration = PostingIntegration(instagram_client)

    def scrape_and_generate(
        self,
        scraped_content: Dict,
        category: str = "motivation",
        target_keyword: str = "FREE",
        auto_approve: bool = False
    ) -> Optional[Dict]:
        """
        Complete workflow: scrape content, generate caption, create post

        Args:
            scraped_content: Dict of scraped content
            category: Content category
            target_keyword: ManyChat trigger keyword
            auto_approve: If True, automatically mark caption as approved

        Returns:
            Dict with source_id, caption_id, posted_id, or None if failed
        """
        # Step 1: Add scraped content
        source_id = self.scraper_integration.add_scraped_content(scraped_content)
        if not source_id:
            return None

        # Step 2: Generate caption
        caption_result = self.caption_integration.generate_caption_from_source(
            source_id=source_id,
            category=category,
            target_keyword=target_keyword
        )
        if not caption_result:
            return None

        # Step 3: Create posted content record
        posted_id = self.posting_integration.create_posted_content(
            source_id=source_id,
            caption_id=None,  # Will link later
            media_type=scraped_content.get("content_type", "reel"),
            target_keyword=target_keyword
        )
        if not posted_id:
            return None

        return {
            "source_id": source_id,
            "caption": caption_result["caption"],
            "posted_id": posted_id
        }

    def get_pending_content(self, limit: int = 20) -> List[Dict]:
        """Get pending source content for caption generation"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            cursor.execute("""
                SELECT * FROM source_content
                WHERE status = 'pending'
                ORDER BY engagement_rate DESC
                LIMIT ?
            """, (limit,))

            rows = cursor.fetchall()
            conn.close()

            return [dict(row) for row in rows]

        except Exception as e:
            print(f"Error getting pending content: {e}")
            return []


# ============================================================
# API Integration Helpers
# ============================================================

def call_caption_engine_api(endpoint: str, data: Dict) -> Optional[Dict]:
    """Call caption engine API"""
    try:
        url = f"{CAPTION_ENGINE_API}{endpoint}"
        response = requests.post(url, json=data, timeout=30)
        response.raise_for_status()
        return response.json()
    except Exception as e:
        print(f"Error calling caption engine API: {e}")
        return None


def generate_caption_via_api(
    category: str,
    theme: str,
    target_keyword: str = "FREE",
    emotion: str = "inspiring"
) -> Optional[Dict]:
    """Generate caption using caption engine API"""
    data = {
        "category": category,
        "theme": theme,
        "target_keyword": target_keyword,
        "emotion": emotion
    }
    return call_caption_engine_api("/api/generate", data)


def score_caption_via_api(caption: str, category: str) -> Optional[Dict]:
    """Score caption using caption engine API"""
    data = {
        "caption": caption,
        "category": category
    }
    return call_caption_engine_api("/api/score", data)


if __name__ == "__main__":
    print("Instagram Automation Integration Layer")
    print("=" * 50)
    print("\nThis module provides integration between:")
    print("  - Content scraper")
    print("  - Caption generation engine")
    print("  - Posting automation")
    print("\nExample usage:")
    print("  from integration import InstagramAutomationWorkflow")
    print("  workflow = InstagramAutomationWorkflow(openrouter_api_key)")
    print("  result = workflow.scrape_and_generate(scraped_content)")
