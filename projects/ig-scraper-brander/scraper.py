"""
Instagram Video Scraper Module
Handles downloading videos from Instagram using Instaloader
"""

import instaloader
import time
import logging
from pathlib import Path
from typing import List, Optional
from datetime import datetime

class InstagramScraper:
    """Scrape videos from Instagram accounts safely."""

    def __init__(self, username: str, password: str, config: dict):
        """
        Initialize the scraper.

        Args:
            username: Instagram burner account username (can be empty for anonymous)
            password: Instagram burner account password (can be empty for anonymous)
            config: Configuration dictionary
        """
        self.username = username
        self.password = password
        self.config = config
        self.rate_limit = config.get('rate_limiting', {})
        self.use_anonymous = config.get('instagram', {}).get('use_anonymous', False)

        # Setup logging
        log_config = config.get('logging', {})
        if log_config.get('enabled', True):
            logging.basicConfig(
                level=getattr(logging, log_config.get('log_level', 'INFO')),
                format='%(asctime)s - %(name)s - %(levelname)s - %(message)s',
                handlers=[
                    logging.FileHandler(log_config.get('log_file', 'scraper.log')),
                    logging.StreamHandler()
                ]
            )
        self.logger = logging.getLogger(__name__)

        # Initialize Instaloader
        self.L = instaloader.Instaloader(
            download_videos=True,
            download_video_thumbnails=False,
            download_geotags=False,
            download_comments=False,
            save_metadata=True,  # Enable metadata saving for engagement stats
            compress_json=False
        )

        self._logged_in = False

    def login(self) -> bool:
        """Login to Instagram with the burner account, or skip for anonymous mode."""
        if self.use_anonymous:
            self.logger.info("Running in ANONYMOUS mode - no login required")
            self.logger.info("Will only download from public profiles")
            self._logged_in = True  # Anonymous mode is "logged in"
            return True

        try:
            self.logger.info(f"Logging in as {self.username}...")
            self.L.login(self.username, self.password)
            self._logged_in = True
            self.logger.info("Login successful!")
            return True
        except Exception as e:
            self.logger.error(f"Login failed: {e}")
            return False

    def download_from_profile(self, profile_name: str, output_dir: Path) -> dict:
        """
        Download videos from a specific profile.

        Args:
            profile_name: Instagram username to scrape
            output_dir: Directory to save downloaded videos

        Returns:
            Dictionary with download results
        """
        if not self._logged_in:
            if not self.login():
                return {"success": False, "error": "Not logged in"}

        results = {
            "profile": profile_name,
            "downloaded": [],
            "failed": [],
            "total": 0
        }

        try:
            profile = instaloader.Profile.from_username(self.L.context, profile_name)
            self.logger.info(f"Fetching posts from @{profile_name}...")

            count = 0
            max_downloads = self.rate_limit.get('max_downloads_per_session', 50)
            delay = self.rate_limit.get('delay_between_requests', 15)

            for post in profile.get_posts():
                if count >= max_downloads:
                    self.logger.info(f"Reached max downloads limit ({max_downloads})")
                    break

                if post.typename == 'GraphVideo' or post.is_video:
                    try:
                        self.logger.info(f"Downloading video {count + 1}: {post.shortcode}")
                        self.L.download_post(post, target=str(output_dir / profile_name))

                        # Find the downloaded video file
                        video_files = list((output_dir / profile_name).glob(f"{post.shortcode}*.mp4"))
                        if video_files:
                            results["downloaded"].append({
                                "shortcode": post.shortcode,
                                "file_path": str(video_files[0]),
                                "url": post.url,
                                "caption": post.caption or "",
                                "likes": post.likes,
                                "date": post.date_local.isoformat()
                            })
                            count += 1

                        # Rate limiting delay
                        self.logger.debug(f"Waiting {delay} seconds before next download...")
                        time.sleep(delay)

                    except Exception as e:
                        self.logger.error(f"Failed to download {post.shortcode}: {e}")
                        results["failed"].append({
                            "shortcode": post.shortcode,
                            "error": str(e)
                        })

            results["total"] = count
            self.logger.info(f"Downloaded {count} videos from @{profile_name}")

        except Exception as e:
            self.logger.error(f"Error scraping profile {profile_name}: {e}")
            results["error"] = str(e)
            results["success"] = False
        else:
            results["success"] = True

        return results

    def download_from_multiple_profiles(self, profile_names: List[str], output_dir: Path) -> dict:
        """
        Download videos from multiple profiles.

        Args:
            profile_names: List of Instagram usernames
            output_dir: Base directory for downloads

        Returns:
            Dictionary with all download results
        """
        all_results = {
            "accounts": {},
            "total_downloaded": 0,
            "timestamp": datetime.now().isoformat()
        }

        account_delay = self.rate_limit.get('delay_between_accounts', 60)

        for i, profile_name in enumerate(profile_names):
            self.logger.info(f"Processing account {i + 1}/{len(profile_names)}: @{profile_name}")

            result = self.download_from_profile(profile_name, output_dir)
            all_results["accounts"][profile_name] = result
            all_results["total_downloaded"] += result.get("total", 0)

            # Delay between accounts (except for the last one)
            if i < len(profile_names) - 1:
                self.logger.info(f"Waiting {account_delay} seconds before next account...")
                time.sleep(account_delay)

        return all_results

    def get_profile_info(self, profile_name: str) -> Optional[dict]:
        """Get basic information about a profile."""
        try:
            profile = instaloader.Profile.from_username(self.L.context, profile_name)
            return {
                "username": profile.username,
                "full_name": profile.full_name,
                "followers": profile.followers,
                "following": profile.followees,
                "posts": profile.mediacount,
                "bio": profile.biography,
                "verified": profile.is_verified,
                "private": profile.is_private
            }
        except Exception as e:
            self.logger.error(f"Error fetching profile info for {profile_name}: {e}")
            return None
