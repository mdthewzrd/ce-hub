#!/usr/bin/env python3
"""
Instagram Profile Service using Instaloader
Fetches profile data and posts for preview before scraping
"""

import sys
import time
from pathlib import Path
from typing import Dict, List, Optional
from datetime import datetime
import json

# Add parent directory for imports
sys.path.insert(0, str(Path(__file__).parent.parent))

try:
    import instaloader
except ImportError:
    instaloader = None

def get_instaloader_instance() -> Optional['instaloader.Instaloader']:
    """Get configured Instaloader instance."""
    if instaloader is None:
        raise ImportError("Instaloader not installed. Run: pip install instaloader")

    # Configure Instaloader for anonymous access
    L = instaloader.Instaloader(
        download_pictures=False,
        download_videos=False,
        download_video_thumbnails=False,
        download_geotags=False,
        download_comments=False,
        save_metadata=False,
        compress_json=False
    )

    # Don't try to load session - use anonymous access only
    # Session loading was causing 403 errors

    return L

def fetch_profile(username: str) -> Dict:
    """
    Fetch Instagram profile data.

    Returns:
        Dict with profile info:
        {
            'username': str,
            'full_name': str,
            'biography': str,
            'profile_pic_url': str,
            'followers': int,
            'following': int,
            'posts_count': int,
            'is_private': bool,
            'is_verified': bool,
            'external_url': str
        }
    """
    L = get_instaloader_instance()

    try:
        profile = instaloader.Profile.from_username(L.context, username)

        return {
            'username': profile.username,
            'full_name': profile.full_name,
            'biography': profile.biography,
            'profile_pic_url': profile.profile_pic_url,
            'followers': profile.followers,
            'following': profile.followees,
            'posts_count': profile.mediacount,
            'is_private': profile.is_private,
            'is_verified': profile.is_verified,
            'external_url': profile.external_url or '',
            'success': True
        }
    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def fetch_profile_posts(username: str, limit: int = 36, after_shortcode: str = None, retries: int = 3) -> Dict:
    """
    Fetch recent posts from an Instagram profile with pagination support.

    Args:
        username: Instagram username
        limit: Maximum number of posts to fetch (default 36)
        after_shortcode: If provided, fetch posts after this specific post (for pagination)
        retries: Number of retry attempts for 403/429 errors (default 3)

    Returns:
        Dict with posts list and metadata
    """
    for attempt in range(retries):
        L = get_instaloader_instance()

        try:
            profile = instaloader.Profile.from_username(L.context, username)

            posts = []
            count = 0
            found_after = False

            # If after_shortcode is provided, we need to find that post first, then start collecting after it
            if after_shortcode:
                for post in profile.get_posts():
                    if not found_after:
                        if post.shortcode == after_shortcode:
                            found_after = True
                        continue
                    # Found the after_shortcode, now start collecting posts
                    if count >= limit:
                        break
                    posts.append(_post_to_dict(post))
                    count += 1
            else:
                # No pagination, just get the first batch
                for post in profile.get_posts():
                    if count >= limit:
                        break
                    posts.append(_post_to_dict(post))
                    count += 1

            return {
                'success': True,
                'posts': posts,
                'total_fetched': len(posts)
            }

        except Exception as e:
            error_str = str(e).lower()
            # Retry on 403 Forbidden or 429 Too Many Requests
            if ('403' in error_str or 'forbidden' in error_str or
                '429' in error_str or 'too many requests' in error_str) and attempt < retries - 1:
                # Exponential backoff: 2^attempt seconds
                wait_time = 2 ** attempt
                print(f"Got {str(e)}, retrying in {wait_time}s... (attempt {attempt + 1}/{retries})")
                time.sleep(wait_time)
                continue
            else:
                return {
                    'success': False,
                    'error': str(e),
                    'posts': []
                }

    return {
        'success': False,
        'error': 'Max retries exceeded',
        'posts': []
    }


def _post_to_dict(post) -> Dict:
    """Helper function to convert an Instaloader Post to a dictionary."""
    return {
        'shortcode': post.shortcode,
        'display_url': post.url,
        'video_url': post.video_url if post.is_video else None,
        'caption': post.caption or '',
        'likes': post.likes,
        'comments': post.comments,
        'is_video': post.is_video,
        'view_count': post.video_view_count if post.is_video else 0,
        'date': post.date_local.isoformat(),
        'taken_at': post.date_local.isoformat(),
        'url': f"https://www.instagram.com/p/{post.shortcode}/",
        'typename': post.typename
    }

def fetch_post_details(shortcode: str) -> Dict:
    """
    Fetch detailed information about a specific post.

    Args:
        shortcode: Instagram post shortcode

    Returns:
        Dict with full post details including video URL, caption, hashtags, etc.
    """
    L = get_instaloader_instance()

    try:
        post = instaloader.Post.from_shortcode(L.context, shortcode)

        # Extract hashtags from caption
        caption = post.caption or ''
        hashtags = []
        for word in caption.split():
            if word.startswith('#'):
                hashtags.append(word)

        # Extract mentions
        mentions = []
        for word in caption.split():
            if word.startswith('@'):
                mentions.append(word)

        return {
            'success': True,
            'shortcode': post.shortcode,
            'display_url': post.url,
            'video_url': post.video_url if post.is_video else None,
            'caption': caption,
            'likes': post.likes,
            'comments': post.comments,
            'is_video': post.is_video,
            'view_count': post.video_view_count if post.is_video else 0,
            'date': post.date_local.isoformat(),
            'url': f"https://www.instagram.com/p/{post.shortcode}/",
            'hashtags': hashtags,
            'mentions': mentions,
            'location': post.location.name if post.location else None,
            'sidecar_items': post.sidecar_items if post.typename == 'Sidecar' else []
        }

    except Exception as e:
        return {
            'success': False,
            'error': str(e)
        }

def download_selected_posts(shortcodes: List[str], target_dir: Path) -> Dict:
    """
    Download specific posts by their shortcodes.

    Args:
        shortcodes: List of post shortcodes to download
        target_dir: Directory to save downloaded content

    Returns:
        Dict with download results
    """
    L = get_instaloader_instance()

    # Configure download target - enable video downloads for this function
    L.download_geotags = False
    L.download_comments = False
    L.save_metadata = True  # Enable metadata saving for shortcode tracking
    L.download_video_thumbnails = False
    L.post_metadata_txt_pattern = ''
    L.download_videos = True  # CRITICAL: Enable video downloads!
    L.download_pictures = True  # Also enable pictures for non-video posts

    results = {
        'success': True,
        'downloaded': [],
        'failed': [],
        'total': len(shortcodes)
    }

    target_dir = Path(target_dir)
    target_dir.mkdir(parents=True, exist_ok=True)

    for shortcode in shortcodes:
        try:
            post = instaloader.Post.from_shortcode(L.context, shortcode)

            # Download to target directory
            L.download_post(post, target=target_dir)

            results['downloaded'].append({
                'shortcode': shortcode,
                'filename': f"{post.date_local.strftime('%Y-%m-%d_%H-%M-%S_UTC')}.mp4" if post.is_video else f"{post.date_local.strftime('%Y-%m-%d_%H-%M-%S_UTC')}.jpg"
            })

        except Exception as e:
            results['failed'].append({
                'shortcode': shortcode,
                'error': str(e)
            })

    return results

if __name__ == "__main__":
    # Test the service
    import argparse

    parser = argparse.ArgumentParser()
    parser.add_argument('username', help='Instagram username to fetch')
    parser.add_argument('--limit', type=int, default=12, help='Number of posts to fetch')
    args = parser.parse_args()

    print(f"Fetching profile: {args.username}")
    profile = fetch_profile(args.username)
    print(json.dumps(profile, indent=2))

    print(f"\nFetching {args.limit} posts...")
    posts = fetch_profile_posts(args.username, args.limit)
    print(json.dumps(posts, indent=2))
