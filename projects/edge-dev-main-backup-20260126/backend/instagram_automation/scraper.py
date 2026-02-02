"""
Instagram Content Scraper
Uses Instagrapi to scrape content from target accounts
"""

import os
import json
import asyncio
from typing import List, Dict, Optional
from datetime import datetime, timedelta
from instagrapi import Client
from instagrapi.types import User, Media, Story
import time

# Local imports
from database_schema import DB_PATH, log_event
import sqlite3


# ============================================================
# Configuration
# ============================================================

class ScraperConfig:
    """Scraper configuration"""

    # Rate limiting
    DEFAULT_DELAY = 10  # seconds between requests
    BATCH_DELAY = 60  # seconds between batches

    # Limits
    MAX_ITEMS_PER_SCRAPE = 50
    MAX_AGE_DAYS = 30

    # Filters
    MIN_ENGAGEMENT_RATE = 0  # 0-100%
    MIN_LIKES = 100


# ============================================================
# Instagram Scraper
# ============================================================

class InstagramScraper:
    """Instagram content scraper using Instagrapi"""

    def __init__(
        self,
        username: Optional[str] = None,
        password: Optional[str] = None,
        session_file: Optional[str] = None
    ):
        """
        Initialize Instagram scraper

        Args:
            username: Instagram username
            password: Instagram password
            session_file: Path to session file for login persistence
        """
        self.client = Client()

        # Load session if available
        if session_file and os.path.exists(session_file):
            try:
                self.client.load_settings(session_file)
                self.client.login(username, password)
                print(f"Logged in using session: {session_file}")
            except Exception as e:
                print(f"Session load failed: {e}. Trying fresh login...")
                self._login(username, password)
        elif username and password:
            self._login(username, password)
        else:
            print("Warning: No credentials provided. Some features will be limited.")

        self.config = ScraperConfig()

    def _login(self, username: str, password: str):
        """Login to Instagram"""
        try:
            self.client.login(username, password)
            print(f"Successfully logged in as {username}")
        except Exception as e:
            print(f"Login failed: {e}")
            raise

    def save_session(self, session_file: str):
        """Save session for future use"""
        try:
            self.client.dump_settings(session_file)
            print(f"Session saved to {session_file}")
        except Exception as e:
            print(f"Failed to save session: {e}")

    # ============================================================
    # Account Methods
    # ============================================================

    def get_user_info(self, username: str) -> Optional[Dict]:
        """Get user information"""
        try:
            user_id = self.client.user_id_from_username(username)
            user_info = self.client.user_info(user_id)

            return {
                "username": user_info.username,
                "full_name": user_info.full_name,
                "biography": user_info.biography,
                "followers": user_info.follower_count,
                "following": user_info.following_count,
                "is_verified": user_info.is_verified,
                "is_private": user_info.is_private,
                "profile_pic_url": user_info.profile_pic_url,
                "media_count": user_info.media_count
            }
        except Exception as e:
            print(f"Error getting user info for {username}: {e}")
            return None

    # ============================================================
    # Media Scraping Methods
    # ============================================================

    def scrape_user_medias(
        self,
        username: str,
        media_type: str = "all",
        amount: int = 50,
        min_likes: int = None,
        min_engagement_rate: float = None
    ) -> List[Dict]:
        """
        Scrape media from a user

        Args:
            username: Target username
            media_type: 'all', 'posts', 'reels'
            amount: Maximum number of items to scrape
            min_likes: Minimum like count
            min_engagement_rate: Minimum engagement rate (0-100)

        Returns:
            List of media data dictionaries
        """
        try:
            user_id = self.client.user_id_from_username(username)

            medias = []
            if media_type in ["all", "posts"]:
                medias.extend(self.client.user_medias(user_id, amount=amount))

            if media_type in ["all", "reels"]:
                medias.extend(self.client.user_clips(user_id, amount=amount))

            # Filter and format
            filtered_medias = []
            for media in medias[:amount]:
                media_data = self._format_media(media, username)

                # Apply filters
                if min_likes and media_data.get("original_likes", 0) < min_likes:
                    continue

                if min_engagement_rate:
                    engagement = self._calculate_engagement_rate(media_data)
                    if engagement < min_engagement_rate:
                        continue

                filtered_medias.append(media_data)

            log_event(
                "INFO",
                "scraper",
                f"Scraped {len(filtered_medias)} items from {username}"
            )

            return filtered_medias

        except Exception as e:
            print(f"Error scraping medias from {username}: {e}")
            log_event("ERROR", "scraper", f"Scrape failed for {username}: {str(e)}")
            return []

    def scrape_hashtag_medias(
        self,
        hashtag: str,
        amount: int = 50
    ) -> List[Dict]:
        """Scrape media from a hashtag"""
        try:
            medias = self.client.hashtag_medias_recent(hashtag, amount=amount)

            formatted_medias = []
            for media in medias:
                media_data = self._format_media(media, f"#{hashtag}")
                formatted_medias.append(media_data)

            log_event(
                "INFO",
                "scraper",
                f"Scraped {len(formatted_medias)} items from #{hashtag}"
            )

            return formatted_medias

        except Exception as e:
            print(f"Error scraping hashtag {hashtag}: {e}")
            return []

    # ============================================================
    # Formatting Methods
    # ============================================================

    def _format_media(self, media: Media, account: str) -> Dict:
        """Format media object into dictionary"""
        # Determine content type
        content_type = "post"
        if media.media_type == 2:  # Video
            if media.product_type == "clips":
                content_type = "reel"
            else:
                content_type = "video"
        elif media.media_type == 8:  # Carousel
            content_type = "carousel"

        # Extract hashtags
        hashtags = ""
        if media.caption_text:
            tags = [tag for tag in media.caption_text.split() if tag.startswith("#")]
            hashtags = " ".join(tags)

        return {
            "original_url": f"https://www.instagram.com/p/{media.code}/",
            "account": account,
            "content_type": content_type,
            "original_likes": media.like_count,
            "original_comments": media.comment_count,
            "original_shares": 0,  # Not available via API
            "original_views": media.view_count if hasattr(media, 'view_count') else 0,
            "media_url": media.video_url if media.media_type in [2, 8] else media.thumbnail_url,
            "thumbnail_url": media.thumbnail_url,
            "description": media.caption_text or "",
            "hashtags": hashtags,
            "taken_at": media.taken_at.isoformat() if media.taken_at else None
        }

    def _calculate_engagement_rate(self, media_data: Dict, followers: int = None) -> float:
        """Calculate engagement rate"""
        likes = media_data.get("original_likes", 0)
        comments = media_data.get("original_comments", 0)

        if followers and followers > 0:
            return ((likes + comments) / followers) * 100

        # Fallback: use likes as a proxy
        return likes / 10 if likes > 0 else 0


# ============================================================
# Batch Scraper
# ============================================================

class BatchScraper:
    """Batch scraper for multiple accounts"""

    def __init__(self, scraper: InstagramScraper):
        self.scraper = scraper

    def scrape_multiple_accounts(
        self,
        accounts: List[str],
        delay: int = 10,
        **scrape_kwargs
    ) -> Dict[str, List[Dict]]:
        """Scrape multiple accounts with delays"""
        results = {}

        for i, account in enumerate(accounts):
            print(f"\n[{i+1}/{len(accounts)}] Scraping {account}...")

            medias = self.scraper.scrape_user_medias(
                username=account,
                **scrape_kwargs
            )

            results[account] = medias
            print(f"  Found {len(medias)} items")

            # Delay between accounts
            if i < len(accounts) - 1:
                print(f"  Waiting {delay} seconds...")
                time.sleep(delay)

        return results

    def scrape_and_save(
        self,
        accounts: List[str],
        save_to_db: bool = True,
        **scrape_kwargs
    ) -> Dict[str, int]:
        """Scrape accounts and save to database"""
        from integration import ScraperIntegration

        integration = ScraperIntegration()
        stats = {"total": 0, "added": 0, "skipped": 0}

        results = self.scrape_multiple_accounts(accounts, **scrape_kwargs)

        for account, medias in results.items():
            print(f"\nSaving {len(medias)} items from {account}...")

            for media in medias:
                stats["total"] += 1

                if save_to_db:
                    source_id = integration.add_scraped_content(media)
                    if source_id:
                        stats["added"] += 1
                    else:
                        stats["skipped"] += 1

        print(f"\n{'='*50}")
        print(f"Scraping Summary:")
        print(f"  Total items: {stats['total']}")
        print(f"  Added to DB: {stats['added']}")
        print(f"  Skipped: {stats['skipped']}")
        print(f"{'='*50}")

        return stats


# ============================================================
# Command Line Interface
# ============================================================

def main():
    """Command line interface for scraper"""
    import argparse

    parser = argparse.ArgumentParser(description="Instagram Content Scraper")
    parser.add_argument("username", help="Instagram username")
    parser.add_argument("password", help="Instagram password")
    parser.add_argument("--target", "-t", required=True, help="Target account(s) to scrape (comma-separated)")
    parser.add_argument("--type", choices=["all", "posts", "reels"], default="all", help="Media type")
    parser.add_argument("--amount", "-a", type=int, default=50, help="Max items to scrape")
    parser.add_argument("--min-likes", type=int, help="Minimum like count")
    parser.add_argument("--save", "-s", action="store_true", help="Save to database")
    parser.add_argument("--session", help="Session file path")

    args = parser.parse_args()

    # Initialize scraper
    scraper = InstagramScraper(
        username=args.username,
        password=args.password,
        session_file=args.session
    )

    # Parse targets
    targets = [t.strip() for t in args.target.split(",")]

    # Scrape
    batch_scraper = BatchScraper(scraper)

    if args.save:
        batch_scraper.scrape_and_save(
            accounts=targets,
            media_type=args.type,
            amount=args.amount,
            min_likes=args.min_likes
        )
    else:
        results = batch_scraper.scrape_multiple_accounts(
            accounts=targets,
            media_type=args.type,
            amount=args.amount,
            min_likes=args.min_likes
        )

        # Print results
        for account, medias in results.items():
            print(f"\n{account}: {len(medias)} items")
            for media in medias[:5]:
                print(f"  - {media['original_url']}")

    # Save session
    if args.session:
        scraper.save_session(args.session)


if __name__ == "__main__":
    main()
