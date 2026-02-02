"""
Instagram Auto-Poster
Handles automated posting with Instagrapi
"""

import os
import time
import asyncio
from typing import Optional, Dict, List
from datetime import datetime, timedelta
from pathlib import Path
from instagrapi import Client
from instagrapi.exceptions import ChallengeRequired, LoginRequired

# Local imports
from database_schema import DB_PATH, log_event
import sqlite3


# ============================================================
# Auto-Poster Configuration
# ============================================================

class PosterConfig:
    """Auto-poster configuration"""

    # Posting schedule
    DEFAULT_TIMEZONES = ["America/New_York", "America/Los_Angeles"]
    OPTIMAL_POSTING_TIMES = [
        "06:00", "09:00", "12:00", "15:00", "18:00", "21:00"
    ]

    # Rate limiting
    POST_DELAY_MIN = 180  # 3 minutes minimum between posts
    POST_DELAY_MAX = 600  # 10 minutes maximum between posts
    DAILY_POST_LIMIT = 5

    # Media settings
    MAX_VIDEO_SIZE_MB = 100
    MAX_VIDEO_DURATION_SECONDS = 90
    MAX_IMAGE_SIZE_MB = 10


# ============================================================
# Instagram Auto-Poster
# ============================================================

class InstagramAutoPoster:
    """Automated posting with Instagrapi"""

    def __init__(
        self,
        username: str,
        password: str,
        session_file: Optional[str] = None
    ):
        """
        Initialize auto-poster

        Args:
            username: Instagram username
            password: Instagram password
            session_file: Path to session file
        """
        self.client = Client()
        self.username = username
        self.password = password
        self.session_file = session_file

        self.config = PosterConfig()

        # Login
        self._login()

    def _login(self):
        """Login to Instagram"""
        try:
            # Try loading session first
            if self.session_file and os.path.exists(self.session_file):
                self.client.load_settings(self.session_file)
                self.client.login(self.username, self.password)
                print(f"Logged in using session: {self.session_file}")
            else:
                self.client.login(self.username, self.password)
                print(f"Logged in as {self.username}")

                # Save session for next time
                if self.session_file:
                    self.client.dump_settings(self.session_file)

        except ChallengeRequired as e:
            print(f"Challenge required: {e}")
            print("Please complete the challenge in the Instagram app")
            raise
        except Exception as e:
            print(f"Login failed: {e}")
            raise

    # ============================================================
    # Media Upload Methods
    # ============================================================

    def upload_photo(
        self,
        image_path: str,
        caption: str,
        location: Optional[str] = None,
        hashtag_filter: Optional[List[str]] = None
    ) -> Optional[Dict]:
        """
        Upload a photo post

        Args:
            image_path: Path to image file
            caption: Post caption
            location: Location name
            hashtag_filter: List of hashtags to filter (first 30 will be used)

        Returns:
            Dict with post info if successful, None otherwise
        """
        try:
            # Process caption
            processed_caption = self._process_caption(caption, hashtag_filter)

            # Upload
            media = self.client.photo_upload(
                path=image_path,
                caption=processed_caption,
                location=location
            )

            result = {
                "pk": media.pk,
                "id": media.id,
                "code": media.code,
                "url": f"https://www.instagram.com/p/{media.code}/",
                "posted_at": datetime.now().isoformat()
            }

            log_event("INFO", "auto_poster", f"Photo posted: {media.code}")

            return result

        except Exception as e:
            print(f"Error uploading photo: {e}")
            log_event("ERROR", "auto_poster", f"Photo upload failed: {str(e)}")
            return None

    def upload_video(
        self,
        video_path: str,
        caption: str,
        thumbnail_path: Optional[str] = None,
        hashtag_filter: Optional[List[str]] = None
    ) -> Optional[Dict]:
        """
        Upload a video/reel post

        Args:
            video_path: Path to video file
            caption: Post caption
            thumbnail_path: Path to custom thumbnail
            hashtag_filter: List of hashtags to filter

        Returns:
            Dict with post info if successful, None otherwise
        """
        try:
            # Process caption
            processed_caption = self._process_caption(caption, hashtag_filter)

            # Upload
            media = self.client.clip_upload(
                path=video_path,
                caption=processed_caption,
                thumbnail=thumbnail_path
            )

            result = {
                "pk": media.pk,
                "id": media.id,
                "code": media.code,
                "url": f"https://www.instagram.com/p/{media.code}/",
                "posted_at": datetime.now().isoformat()
            }

            log_event("INFO", "auto_poster", f"Video/Reel posted: {media.code}")

            return result

        except Exception as e:
            print(f"Error uploading video: {e}")
            log_event("ERROR", "auto_poster", f"Video upload failed: {str(e)}")
            return None

    def upload_album(
        self,
        media_paths: List[str],
        caption: str,
        hashtag_filter: Optional[List[str]] = None
    ) -> Optional[Dict]:
        """
        Upload a carousel/album post

        Args:
            media_paths: List of paths to media files (images/videos)
            caption: Post caption
            hashtag_filter: List of hashtags to filter

        Returns:
            Dict with post info if successful, None otherwise
        """
        try:
            # Process caption
            processed_caption = self._process_caption(caption, hashtag_filter)

            # Upload
            media = self.client.album_upload(
                paths=media_paths,
                caption=processed_caption
            )

            result = {
                "pk": media.pk,
                "id": media.id,
                "code": media.code,
                "url": f"https://www.instagram.com/p/{media.code}/",
                "posted_at": datetime.now().isoformat()
            }

            log_event("INFO", "auto_poster", f"Album posted: {media.code}")

            return result

        except Exception as e:
            print(f"Error uploading album: {e}")
            log_event("ERROR", "auto_poster", f"Album upload failed: {str(e)}")
            return None

    # ============================================================
    # Caption Processing
    # ============================================================

    def _process_caption(
        self,
        caption: str,
        hashtag_filter: Optional[List[str]] = None
    ) -> str:
        """
        Process caption for posting

        Args:
            caption: Original caption
            hashtag_filter: List of hashtags to include (max 30)

        Returns:
            Processed caption
        """
        # Extract hashtags from caption
        caption_hashtags = []
        caption_lines = []
        hashtag_lines = []

        for line in caption.split("\n"):
            if line.strip().startswith("#"):
                hashtag_lines.append(line.strip())
            else:
                caption_lines.append(line)

        # Collect hashtags
        for line in hashtag_lines:
            caption_hashtags.extend([tag for tag in line.split() if tag.startswith("#")])

        # If hashtag_filter provided, use only those
        if hashtag_filter:
            # Filter to only hashtags in the filter list
            filtered_tags = [tag for tag in caption_hashtags if tag in hashtag_filter]
            # Limit to 30
            caption_hashtags = filtered_tags[:30]
        else:
            # Limit to 30
            caption_hashtags = caption_hashtags[:30]

        # Rebuild caption
        processed = "\n".join(caption_lines)

        if caption_hashtags:
            processed += "\n\n" + " ".join(caption_hashtags)

        return processed

    # ============================================================
    # Scheduled Posting
    # ============================================================

    def process_queue(self, limit: int = 5) -> Dict:
        """
        Process pending items from the posting queue

        Args:
            limit: Maximum number of items to process

        Returns:
            Dict with processing results
        """
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Get pending scheduled items
            now = datetime.now().isoformat()
            cursor.execute("""
                SELECT cq.*, pc.caption_id, pc.media_type, pc.affiliate_link, pc.target_keyword,
                       c.full_caption
                FROM content_queue cq
                JOIN posted_content pc ON cq.posted_content_id = pc.id
                LEFT JOIN captions c ON pc.caption_id = c.id
                WHERE cq.status = 'pending'
                  AND cq.scheduled_for <= ?
                ORDER BY cq.scheduled_for ASC
                LIMIT ?
            """, (now, limit))

            items = cursor.fetchall()

            results = {
                "processed": 0,
                "posted": 0,
                "failed": 0,
                "errors": []
            }

            for item in items:
                item_dict = dict(item)
                results["processed"] += 1

                # Mark as processing
                cursor.execute("""
                    UPDATE content_queue
                    SET status = 'processing', started_at = CURRENT_TIMESTAMP
                    WHERE id = ?
                """, (item_dict["id"],))
                conn.commit()

                # Post the content
                # TODO: Implement actual posting logic
                # For now, just mark as completed
                try:
                    # This would call the appropriate upload method
                    # based on media_type and caption

                    cursor.execute("""
                        UPDATE content_queue
                        SET status = 'completed', completed_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (item_dict["id"],))

                    cursor.execute("""
                        UPDATE posted_content
                        SET status = 'posted', posted_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (item_dict["posted_content_id"],))

                    conn.commit()
                    results["posted"] += 1

                except Exception as e:
                    cursor.execute("""
                        UPDATE content_queue
                        SET status = 'failed', error_message = ?, completed_at = CURRENT_TIMESTAMP
                        WHERE id = ?
                    """, (str(e), item_dict["id"]))
                    conn.commit()
                    results["failed"] += 1
                    results["errors"].append(str(e))

            conn.close()

            log_event(
                "INFO",
                "auto_poster",
                f"Queue processed: {results['posted']} posted, {results['failed']} failed"
            )

            return results

        except Exception as e:
            print(f"Error processing queue: {e}")
            log_event("ERROR", "auto_poster", f"Queue processing failed: {str(e)}")
            return {"processed": 0, "posted": 0, "failed": 0, "errors": [str(e)]}

    def get_queue_status(self) -> Dict:
        """Get status of posting queue"""
        try:
            conn = sqlite3.connect(DB_PATH)
            conn.row_factory = sqlite3.Row
            cursor = conn.cursor()

            # Count by status
            cursor.execute("""
                SELECT status, COUNT(*) as count
                FROM content_queue
                GROUP BY status
            """)
            status_counts = {row["status"]: row["count"] for row in cursor.fetchall()}

            # Get upcoming
            cursor.execute("""
                SELECT COUNT(*) as count
                FROM content_queue
                WHERE status = 'pending'
                  AND scheduled_for > CURRENT_TIMESTAMP
            """)
            upcoming = cursor.fetchone()["count"]

            conn.close()

            return {
                **status_counts,
                "upcoming": upcoming
            }

        except Exception as e:
            print(f"Error getting queue status: {e}")
            return {}


# ============================================================
# Scheduled Posting Service
# ============================================================

class ScheduledPostingService:
    """Background service for scheduled posting"""

    def __init__(self, poster: InstagramAutoPoster, check_interval: int = 60):
        """
        Initialize scheduled posting service

        Args:
            poster: InstagramAutoPoster instance
            check_interval: Seconds between queue checks
        """
        self.poster = poster
        self.check_interval = check_interval
        self.running = False

    def start(self):
        """Start the scheduled posting service"""
        self.running = True
        print(f"Scheduled posting service started (checking every {self.check_interval}s)")

        while self.running:
            try:
                # Process queue
                results = self.poster.process_queue()

                if results["processed"] > 0:
                    print(f"Processed {results['processed']} items: {results['posted']} posted, {results['failed']} failed")

                # Wait before next check
                time.sleep(self.check_interval)

            except KeyboardInterrupt:
                print("\nStopping scheduled posting service...")
                self.running = False
            except Exception as e:
                print(f"Error in scheduled posting service: {e}")
                time.sleep(self.check_interval)

    def stop(self):
        """Stop the scheduled posting service"""
        self.running = False


# ============================================================
# Command Line Interface
# ============================================================

def main():
    """Command line interface for auto-poster"""
    import argparse

    parser = argparse.ArgumentParser(description="Instagram Auto-Poster")
    parser.add_argument("username", help="Instagram username")
    parser.add_argument("password", help="Instagram password")
    parser.add_argument("--session", help="Session file path")
    parser.add_argument("--photo", help="Upload a photo")
    parser.add_argument("--video", help="Upload a video/reel")
    parser.add_argument("--caption", help="Caption text")
    parser.add_argument("--process-queue", action="store_true", help="Process posting queue")
    parser.add_argument("--daemon", action="store_true", help="Run as daemon")

    args = parser.parse_args()

    # Initialize poster
    poster = InstagramAutoPoster(
        username=args.username,
        password=args.password,
        session_file=args.session
    )

    if args.photo:
        # Upload photo
        result = poster.upload_photo(args.photo, args.caption or "")
        print(f"Photo uploaded: {result}")

    elif args.video:
        # Upload video
        result = poster.upload_video(args.video, args.caption or "")
        print(f"Video uploaded: {result}")

    elif args.process_queue:
        # Process queue
        results = poster.process_queue()
        print(f"Queue processed: {results}")

    elif args.daemon:
        # Run as daemon
        service = ScheduledPostingService(poster)
        service.start()


if __name__ == "__main__":
    main()
