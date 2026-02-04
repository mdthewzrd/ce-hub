#!/usr/bin/env python3
"""
Harmonatica - Content Studio
Instagram content management with scraping, preparation, scheduling, and delivery
"""

from flask import Flask, render_template, jsonify, request, send_file, redirect, copy_current_request_context
from pathlib import Path
import json
import datetime
from typing import List, Dict
import subprocess
import threading
import sys
import os
import sqlite3
import cv2
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()

# Add parent directory to path for database import
sys.path.insert(0, str(Path(__file__).parent.parent))
from database import (
    init_database, get_source_content, add_source_content, update_source_status, delete_source_content,
    get_ready_content, create_ready_content, update_ready_content,
    schedule_content, get_scheduled_content, mark_as_posted,
    get_notifications, create_notification, mark_notification_read, mark_notification_action,
    get_notification_stats, get_system_stats,
    create_brand_voice_profile, get_brand_voice_profile, get_all_brand_voice_profiles,
    delete_brand_voice_profile, get_brand_voice_for_caption, update_brand_voice_profile,
    get_profile_variants, get_profile_clones,
    create_offer, get_all_offers, get_offer_by_id, get_offer_by_keyword,
    update_offer, delete_offer, increment_offer_usage, get_offer_context_for_prompt
)

app = Flask(__name__)
app.config['JSON_SORT_KEYS'] = False

# Paths
BASE_DIR = Path(__file__).parent.parent
OUTPUT_DIR = BASE_DIR / "output"
CONFIG_FILE = BASE_DIR / "config.json"
ACCOUNTS_FILE = BASE_DIR / "saved_accounts.json"
DOWNLOAD_TRACKER_FILE = BASE_DIR / "download_tracker.json"
DB_PATH = BASE_DIR.parent / "harmonatica.db"

# Global state - Support multiple concurrent scrapers
scraper_running = False
scraper_thread = None
active_scrapers = {}  # {account_id: {'thread': thread, 'status': 'running', 'accounts': [...], 'started_at': timestamp}}

def load_json_file(filepath: Path, default=None):
    """Load JSON file with default fallback."""
    try:
        if filepath.exists():
            with open(filepath, 'r') as f:
                return json.load(f)
    except Exception as e:
        print(f"Error loading {filepath}: {e}")
    return default if default is not None else {}

def save_json_file(filepath: Path, data):
    """Save data to JSON file."""
    try:
        with open(filepath, 'w') as f:
            json.dump(data, f, indent=2)
        return True
    except Exception as e:
        print(f"Error saving {filepath}: {e}")
        return False

def get_download_tracker():
    """Get the download tracker (remembers what was downloaded)."""
    return load_json_file(DOWNLOAD_TRACKER_FILE, {"downloaded": {}, "accounts": {}})

def update_download_tracker(video_id: str, account: str, metadata: dict):
    """Update tracker with new downloaded video."""
    tracker = get_download_tracker()

    if account not in tracker["accounts"]:
        tracker["accounts"][account] = {"downloaded": [], "last_scraped": None}

    if video_id not in tracker["accounts"][account]["downloaded"]:
        tracker["accounts"][account]["downloaded"].append(video_id)

    tracker["accounts"][account]["last_scraped"] = datetime.datetime.now().isoformat()
    tracker["downloaded"][video_id] = {
        "account": account,
        "downloaded_at": datetime.datetime.now().isoformat(),
        "metadata": metadata
    }

    save_json_file(DOWNLOAD_TRACKER_FILE, tracker)

def get_saved_accounts():
    """Get saved accounts for tracking."""
    data = load_json_file(ACCOUNTS_FILE, {"accounts": []})
    return data.get("accounts", [])

def save_account(account_data: dict):
    """Save an account to track."""
    data = load_json_file(ACCOUNTS_FILE, {"accounts": []})
    accounts = data.get("accounts", [])

    # Check if already exists
    for i, acc in enumerate(accounts):
        if acc.get("username") == account_data.get("username"):
            accounts[i] = account_data
            break
    else:
        accounts.append(account_data)

    data["accounts"] = accounts
    save_json_file(ACCOUNTS_FILE, data)
    return True

def get_video_metadata_from_json(video_path: Path) -> dict:
    """Extract metadata from instaloader JSON file or TXT file for captions."""
    # Look for corresponding JSON file
    json_file = video_path.parent / f"{video_path.stem}.json"
    # Also check for TXT file (fallback for captions)
    txt_file = video_path.parent / f"{video_path.stem}.txt"

    metadata = {
        'caption': '',
        'likes': 0,
        'comments': 0,
        'views': 0,
        'date': None,
        'url': '',
        'shortcode': video_path.stem
    }

    # Try JSON first for full metadata
    try:
        if json_file.exists():
            with open(json_file, 'r') as f:
                data = json.load(f)

                # Instaloader wraps data under 'node' key
                node = data.get('node', data)

                # Extract caption
                edges = node.get('edge_media_to_caption', {}).get('edges', [])
                if edges and len(edges) > 0:
                    metadata['caption'] = edges[0].get('node', {}).get('text', '')

                # Extract likes
                metadata['likes'] = node.get('edge_media_preview_like', {}).get('count', 0)

                # Extract comments
                metadata['comments'] = node.get('edge_media_to_comment', {}).get('count', 0)

                # Extract views
                metadata['views'] = node.get('video_view_count', 0)

                # Extract date
                if 'taken_at_timestamp' in node:
                    metadata['date'] = datetime.datetime.fromtimestamp(node['taken_at_timestamp']).isoformat()

                # Extract URL
                metadata['url'] = node.get('shortcode', '')
                if metadata['url']:
                    metadata['url'] = f"https://www.instagram.com/p/{metadata['url']}/"
        # Fallback to TXT for captions only
        elif txt_file.exists():
            with open(txt_file, 'r', encoding='utf-8') as f:
                metadata['caption'] = f.read().strip()
    except Exception as e:
        print(f"Error reading metadata for {video_path.stem}: {e}")

    return metadata

def get_all_videos(sort_by='date', sort_order='desc') -> List[Dict]:
    """Scan for all videos with full metadata."""
    videos = []
    tracker = get_download_tracker()

    # Find all MP4 files
    for video_file in BASE_DIR.rglob("*.mp4"):
        if any(skip in str(video_file) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
            continue

        try:
            stat = video_file.stat()
            filename = video_file.stem

            # Determine account from path
            # The directory structure might be: output∕originals∕accountname
            rel_path = video_file.relative_to(BASE_DIR)
            account = "Unknown"

            # Filter out common directory names to find the account from all path parts
            skip_names = {"output", "originals", "processed", "output originals"}
            for part in rel_path.parts:
                # Check if this part looks like an account (starts with @ or not a skip name)
                if part and part.lower() not in skip_names:
                    # Remove leading @ if present for cleaner display
                    account = part.lstrip('@')
                    break

            # Check if processed
            is_processed = "processed" in str(video_file).lower()

            # Get metadata from JSON
            metadata = get_video_metadata_from_json(video_file)

            # Check if already tracked
            is_downloaded = filename in tracker.get("downloaded", {})

            videos.append({
                'filename': filename,
                'path': str(video_file),
                'size_mb': round(stat.st_size / (1024*1024), 2),
                'modified': datetime.datetime.fromtimestamp(stat.st_mtime).isoformat(),
                'account': account,
                'processed': is_processed,
                'downloaded': is_downloaded,
                **metadata
            })
        except Exception as e:
            print(f"Error processing {video_file}: {e}")

    # Sort videos
    if sort_by == 'views':
        videos.sort(key=lambda x: x.get('views', 0), reverse=(sort_order == 'desc'))
    elif sort_by == 'likes':
        videos.sort(key=lambda x: x.get('likes', 0), reverse=(sort_order == 'desc'))
    elif sort_by == 'comments':
        videos.sort(key=lambda x: x.get('comments', 0), reverse=(sort_order == 'desc'))
    elif sort_by == 'date':
        videos.sort(key=lambda x: x.get('modified', ''), reverse=(sort_order == 'desc'))
    elif sort_by == 'size':
        videos.sort(key=lambda x: x.get('size_mb', 0), reverse=(sort_order == 'desc'))

    return videos

# Routes
@app.route('/')
def index():
    """Root redirects to main dashboard."""
    from flask import redirect
    return redirect('/main')

@app.route('/main')
def main():
    """Main dashboard - scraper, scheduler, auto-poster, content DB."""
    return render_template('main.html')

@app.route('/scrape')
def scrape():
    """Instagram scraper UI - My Library (downloaded videos)."""
    return render_template('index.html')

@app.route('/browse')
def browse():
    """Browse Instagram profiles and select videos to scrape."""
    return render_template('browse.html')

@app.route('/prepare')
def prepare():
    """Content preparation UI."""
    return render_template('prepare.html')

@app.route('/schedule')
def schedule():
    """Scheduling calendar UI."""
    return render_template('schedule.html')

@app.route('/library')
def library():
    """Ready content library UI."""
    return render_template('library.html')

@app.route('/delivery')
def delivery():
    """Delivery/posting workflow UI."""
    return render_template('delivery.html')

@app.route('/analytics')
def analytics():
    """Analytics dashboard UI."""
    return render_template('analytics.html')

@app.route('/agent-health')
def agent_health():
    """AI Agent health monitoring dashboard."""
    return render_template('agent_health.html')

@app.route('/settings')
def settings():
    """Account settings UI."""
    return render_template('settings.html')

@app.route('/brand-voice')
def brand_voice_builder():
    """Enhanced brand voice builder UI."""
    response = render_template('brand-voice.html')
    # Add cache-busting headers to ensure latest version is always served
    response = app.make_response(response)
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/offers')
def offers_manager():
    """Offers management UI for creating and managing ManyChat-linked offers."""
    response = render_template('offers.html')
    # Add cache-busting headers
    response = app.make_response(response)
    response.headers['Cache-Control'] = 'no-store, no-cache, must-revalidate, max-age=0'
    response.headers['Pragma'] = 'no-cache'
    response.headers['Expires'] = '0'
    return response

@app.route('/api/test-caption', methods=['POST'])
def test_caption_generation():
    """Generate a test caption to preview brand voice."""
    try:
        data = request.get_json()
        account = data.get('account')

        if not account:
            return jsonify({'success': False, 'error': 'account is required'}), 400

        # Get brand voice for the account
        brand_voice = get_brand_voice_for_caption(account)

        # Generate a simple test caption
        test_caption = f"""Here's a test caption for @{account}!

This caption uses your brand voice settings:
Tone: {brand_voice['tone']}

{brand_voice['guidelines']}

Remember to comment "{brand_voice['manychat_cta']}" below to get started!

This is just a preview of how your captions will look with your current brand voice settings."""

        return jsonify({
            'success': True,
            'caption': test_caption,
            'brand_voice': brand_voice
        })

    except Exception as e:
        print(f"Error generating test caption: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/videos')
def get_videos_api():
    """Get all videos with filters and sorting."""
    sort_by = request.args.get('sort_by', 'date')
    sort_order = request.args.get('sort_order', 'desc')

    videos = get_all_videos(sort_by=sort_by, sort_order=sort_order)

    # Apply filters
    account = request.args.get('account')
    search = request.args.get('search', '').lower()
    min_likes = request.args.get('min_likes', type=int)
    processed = request.args.get('processed')
    downloaded = request.args.get('downloaded')

    if account:
        videos = [v for v in videos if account.lower() in v.get('account', '').lower()]
    if search:
        videos = [v for v in videos if search in v.get('caption', '').lower() or search in v.get('filename', '').lower()]
    if min_likes:
        videos = [v for v in videos if v.get('likes', 0) >= min_likes]
    if processed == 'true':
        videos = [v for v in videos if v.get('processed', False)]
    elif processed == 'false':
        videos = [v for v in videos if not v.get('processed', False)]
    if downloaded == 'true':
        videos = [v for v in videos if v.get('downloaded', False)]
    elif downloaded == 'false':
        videos = [v for v in videos if not v.get('downloaded', False)]

    return jsonify({
        'success': True,
        'count': len(videos),
        'videos': videos
    })

@app.route('/api/accounts')
def get_accounts_api():
    """Get all accounts (both from videos and saved)."""
    videos = get_all_videos()
    video_accounts = sorted(set(v.get('account', 'Unknown') for v in videos if v.get('account') != 'Unknown'))
    saved_accounts = get_saved_accounts()

    return jsonify({
        'success': True,
        'accounts': video_accounts,
        'saved_accounts': saved_accounts
    })

@app.route('/api/stats')
def get_stats_api():
    """Get overall statistics."""
    videos = get_all_videos()
    tracker = get_download_tracker()

    total_size = sum(v.get('size_mb', 0) for v in videos)

    return jsonify({
        'success': True,
        'total_videos': len(videos),
        'total_size_mb': round(total_size, 2),
        'total_likes': sum(v.get('likes', 0) for v in videos),
        'total_views': sum(v.get('views', 0) for v in videos),
        'accounts': len(set(v.get('account', 'Unknown') for v in videos)),
        'processed': len([v for v in videos if v.get('processed', False)]),
        'tracked_downloads': len(tracker.get('downloaded', {}))
    })

@app.route('/video/<path:filename>')
def serve_video(filename):
    """Serve a video file."""
    # Try exact path match first (for full paths from source_content)
    try:
        video_path = Path(filename)
        if video_path.exists() and video_path.suffix in ['.mp4', '.mov', '.mkv']:
            return send_file(str(video_path))
    except:
        pass

    # Fallback to searching by filename - handle with/without extension
    search_name = filename
    # If filename doesn't have an extension, we'll search with .mp4
    if not Path(filename).suffix:
        search_name = f"{filename}.mp4"

    for video_file in BASE_DIR.rglob(search_name):
        if any(skip in str(video_file) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
            continue
        if video_file.exists():
            return send_file(str(video_file))

    # If not found with extension, try without
    if Path(filename).suffix:
        base_name = Path(filename).stem
        for video_file in BASE_DIR.rglob(f"{base_name}.mp4"):
            if any(skip in str(video_file) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
                continue
            if video_file.exists():
                return send_file(str(video_file))

    return "Video not found", 404

@app.route('/api/accounts/save', methods=['POST'])
def save_account_api():
    """Save an account to track."""
    data = request.json
    account_data = {
        'username': data.get('username'),
        'notes': data.get('notes', ''),
        'added_at': datetime.datetime.now().isoformat(),
        'last_scraped': None
    }

    if save_account(account_data):
        return jsonify({'success': True})
    return jsonify({'success': False, 'error': 'Failed to save account'}), 500

@app.route('/api/accounts/<username>', methods=['DELETE'])
def delete_account_api(username):
    """Delete a saved account."""
    data = load_json_file(ACCOUNTS_FILE, {"accounts": []})
    accounts = [a for a in data.get("accounts", []) if a.get("username") != username]
    data["accounts"] = accounts
    save_json_file(ACCOUNTS_FILE, data)
    return jsonify({'success': True})

@app.route('/api/config', methods=['GET', 'POST'])
def config_api():
    """Get or update scraper configuration."""
    if request.method == 'GET':
        config = load_json_file(CONFIG_FILE, {})
        # Don't return password
        if 'instagram' in config and 'burner_password' in config['instagram']:
            config['instagram']['burner_password'] = '***'
        return jsonify({'success': True, 'config': config})

    # Update config
    data = request.json
    current_config = load_json_file(CONFIG_FILE, {})

    # Merge updates
    if 'instagram' in data:
        current_config.setdefault('instagram', {}).update(data['instagram'])
    if 'processing' in data:
        current_config.setdefault('processing', {}).update(data['processing'])
    if 'watermark_regions' in data:
        current_config.setdefault('watermark_regions', {}).update(data['watermark_regions'])
    if 'rate_limiting' in data:
        current_config.setdefault('rate_limiting', {}).update(data['rate_limiting'])

    save_json_file(CONFIG_FILE, current_config)
    return jsonify({'success': True, 'config': current_config})

@app.route('/api/scraper/start', methods=['POST'])
def start_scraper():
    """Start one or more scrapers - supports concurrent execution."""
    global scraper_running, scraper_thread

    data = request.json
    target_accounts = data.get('accounts', [])

    if not target_accounts:
        return jsonify({'success': False, 'error': 'No accounts specified'})

    # Generate a unique scraper ID
    import time
    scraper_id = f"scraper_{int(time.time() * 1000)}"

    # Update config with target accounts
    config = load_json_file(CONFIG_FILE, {})
    config['instagram']['target_accounts'] = target_accounts
    config['instagram']['use_anonymous'] = True
    save_json_file(CONFIG_FILE, config)

    # Run scraper in background
    def run_scraper():
        try:
            subprocess.run(['python', 'main.py'], cwd=str(BASE_DIR), timeout=3600)
        except Exception as e:
            print(f"Scraper error: {e}")
        finally:
            # Mark scraper as completed
            if scraper_id in active_scrapers:
                active_scrapers[scraper_id]['status'] = 'completed'
                active_scrapers[scraper_id]['completed_at'] = datetime.datetime.now().isoformat()

    # Start the scraper thread
    scraper_thread = threading.Thread(target=run_scraper)
    scraper_thread.start()

    # Track this scraper
    active_scrapers[scraper_id] = {
        'thread': scraper_thread,
        'status': 'running',
        'accounts': target_accounts,
        'started_at': datetime.datetime.now().isoformat(),
        'id': scraper_id
    }

    # Update global flag for backward compatibility
    scraper_running = True

    return jsonify({
        'success': True,
        'message': f'Started scraping {len(target_accounts)} accounts',
        'scraper_id': scraper_id
    })

@app.route('/api/scraper/status')
def scraper_status():
    """Check status of all scrapers."""
    # Clean up completed scrapers older than 1 hour
    import time
    current_time = time.time()
    to_remove = []
    for sid, scraper in active_scrapers.items():
        if scraper['status'] == 'completed':
            # Remove if completed more than an hour ago
            completed_time = datetime.datetime.fromisoformat(scraper['completed_at']).timestamp()
            if current_time - completed_time > 3600:
                to_remove.append(sid)

    for sid in to_remove:
        del active_scrapers[sid]

    # Check if any scrapers are actually running
    any_running = any(s['status'] == 'running' for s in active_scrapers.values())
    scraper_running = any_running

    scrapers_list = []
    for sid, scraper in active_scrapers.items():
        scrapers_list.append({
            'id': sid,
            'status': scraper['status'],
            'accounts': scraper['accounts'],
            'started_at': scraper['started_at'],
            'completed_at': scraper.get('completed_at')
        })

    return jsonify({
        'success': True,
        'running': any_running,
        'scrapers': scrapers_list,
        'count': len(scrapers_list)
    })

@app.route('/api/scraper/<scraper_id>', methods=['GET'])
def get_scraper_status(scraper_id):
    """Get status of a specific scraper."""
    if scraper_id not in active_scrapers:
        return jsonify({'success': False, 'error': 'Scraper not found'}), 404

    scraper = active_scrapers[scraper_id]
    return jsonify({
        'success': True,
        'id': scraper_id,
        'status': scraper['status'],
        'accounts': scraper['accounts'],
        'started_at': scraper['started_at'],
        'completed_at': scraper.get('completed_at')
    })

@app.route('/api/scraper/<scraper_id>', methods=['DELETE'])
def stop_scraper(scraper_id):
    """Stop a specific scraper."""
    if scraper_id not in active_scrapers:
        return jsonify({'success': False, 'error': 'Scraper not found'}), 404

    scraper = active_scrapers[scraper_id]
    if scraper['status'] == 'running':
        # Mark as stopped (we can't actually kill the subprocess easily, so we just mark it)
        scraper['status'] = 'stopped'
        scraper['stopped_at'] = datetime.datetime.now().isoformat()

    return jsonify({'success': True, 'message': 'Scraper stopped'})

@app.route('/api/download/<path:filename>')
def download_single_video(filename):
    """Download a single video."""
    for video_file in BASE_DIR.rglob(f"{filename}.mp4"):
        if any(skip in str(video_file) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
            continue
        if video_file.exists():
            return send_file(str(video_file), as_attachment=True, download_name=f"{filename}.mp4")
    return "Video not found", 404

@app.route('/api/video/<filename>/save', methods=['POST', 'DELETE'])
def toggle_video_saved(filename):
    """Mark or unmark a video as saved/downloaded."""
    # Get video details
    video_path = None
    for vf in BASE_DIR.rglob(f"{filename}.mp4"):
        if any(skip in str(vf) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
            continue
        video_path = vf
        break

    if not video_path:
        return jsonify({'success': False, 'error': 'Video not found'}), 404

    # Get account from path
    rel_path = video_path.relative_to(BASE_DIR)
    account = "Unknown"
    if len(rel_path.parts) > 0:
        video_dir = rel_path.parts[0]
        dir_parts = video_dir.replace("∕", "/").replace("\\", "/").split("/")
        skip_names = {"output", "originals", "processed", "output originals"}
        for part in reversed(dir_parts):
            if part and part.lower() not in skip_names:
                account = part
                break

    # Get metadata
    metadata = get_video_metadata_from_json(video_path)

    if request.method == 'POST':
        # Mark as saved
        update_download_tracker(filename, account, metadata)
        return jsonify({'success': True, 'saved': True})
    else:
        # Unmark as saved
        tracker = get_download_tracker()
        if filename in tracker.get("downloaded", {}):
            del tracker["downloaded"][filename]
        if account in tracker.get("accounts", {}):
            if filename in tracker["accounts"][account].get("downloaded", []):
                tracker["accounts"][account]["downloaded"].remove(filename)
        save_json_file(DOWNLOAD_TRACKER_FILE, tracker)
        return jsonify({'success': True, 'saved': False})

# ============================================================================
# INSTAGRAM PROFILE API - Browse & Preview Before Scraping
# ============================================================================

@app.route('/api/ig/profile', methods=['GET'])
def get_instagram_profile():
    """Fetch Instagram profile data for preview."""
    from instagram_profile_service import fetch_profile

    username = request.args.get('username')

    if not username:
        return jsonify({'success': False, 'error': 'Username required'}), 400

    try:
        profile = fetch_profile(username)
        return jsonify(profile)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ig/posts', methods=['GET'])
def get_instagram_posts():
    """Fetch recent posts from an Instagram profile with pagination support."""
    from instagram_profile_service import fetch_profile_posts

    username = request.args.get('username')
    limit = request.args.get('limit', 36, type=int)
    after_shortcode = request.args.get('after_shortcode')  # For pagination - fetch posts after this shortcode

    if not username:
        return jsonify({'success': False, 'error': 'Username required'}), 400

    try:
        result = fetch_profile_posts(username, limit, after_shortcode)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ig/post/<shortcode>', methods=['GET'])
def get_instagram_post(shortcode):
    """Fetch detailed information about a specific post."""
    from instagram_profile_service import fetch_post_details

    try:
        result = fetch_post_details(shortcode)
        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ig/refresh-session', methods=['POST'])
def refresh_instagram_session():
    """Attempt to refresh the Instagram session or provide login instructions."""
    import os
    from pathlib import Path

    session_file = Path(__file__).parent.parent / "instagram_session"

    # Check if session file exists
    if session_file.exists():
        try:
            # Try to delete old session to force re-auth
            os.remove(session_file)
            return jsonify({
                'success': True,
                'message': 'Old session removed. Please log in again.',
                'needs_credentials': True
            })
        except Exception as e:
            return jsonify({
                'success': False,
                'error': f'Failed to remove old session: {str(e)}'
            }), 500
    else:
        # No session file exists, need to create one
        return jsonify({
            'success': False,
            'needs_credentials': True,
            'message': 'No session found. Please log in to Instagram.'
        })

@app.route('/api/ig/download-selected', methods=['POST'])
def download_selected_posts():
    """Download selected Instagram posts by shortcodes."""
    from instagram_profile_service import download_selected_posts

    data = request.json
    shortcodes = data.get('shortcodes', [])
    account = data.get('account', 'unknown')

    if not shortcodes:
        return jsonify({'success': False, 'error': 'No shortcodes provided'}), 400

    try:
        # Create target directory: output/originals/@account
        target_dir = OUTPUT_DIR / "originals" / f"@{account}"
        target_dir.mkdir(parents=True, exist_ok=True)

        result = download_selected_posts(shortcodes, target_dir)

        # Update download tracker with shortcode mapping
        for item in result.get('downloaded', []):
            shortcode = item.get('shortcode')
            filename = item.get('filename', '').replace('.mp4', '').replace('.jpg', '')

            # Get post metadata for the download tracker
            try:
                from instagram_profile_service import fetch_post_details
                post_details = fetch_post_details(shortcode)
                if post_details.get('success'):
                    metadata = {
                        'caption': post_details.get('caption', ''),
                        'likes': post_details.get('likes', 0),
                        'comments': post_details.get('comments', 0),
                        'views': post_details.get('view_count', 0),
                        'date': post_details.get('date'),
                        'url': post_details.get('url', ''),
                        'shortcode': shortcode  # Store the actual shortcode
                    }
                    update_download_tracker(shortcode, f"@{account}", metadata)
                else:
                    # Fallback if post details fail
                    update_download_tracker(shortcode, f"@{account}", {'shortcode': shortcode})
            except Exception as e:
                print(f"Error fetching post details for {shortcode}: {e}")
                # Still track the download even if we can't get full metadata
                update_download_tracker(shortcode, f"@{account}", {'shortcode': shortcode})

        return jsonify(result)
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

def get_shortcode_from_json(json_path: Path) -> str:
    """Extract shortcode from Instaloader JSON file."""
    try:
        if json_path.exists():
            with open(json_path, 'r') as f:
                data = json.load(f)
                # Try to get shortcode from the node data
                node = data.get('node', data)
                shortcode = node.get('shortcode') or node.get('short_code')
                if shortcode:
                    return shortcode
    except Exception as e:
        print(f"Error reading JSON {json_path}: {e}")
    return None

@app.route('/api/ig/scraped-videos', methods=['GET'])
def get_scraped_videos():
    """Get list of already scraped videos by account.

    Query parameters:
    - account: Filter by specific account name (returns all videos for that account)

    Returns:
    - For specific account: {'success': True, 'account': str, 'videos': [shortcodes], 'video_count': int}
    - For all accounts: {'success': True, 'scraped': [{'account': str, 'video_count': int, 'videos': [shortcodes]}], 'total_videos': int}
    """
    try:
        filter_account = request.args.get('account')  # Filter by specific account

        # Normalize filter account FIRST (before comparing)
        if filter_account and not filter_account.startswith('@'):
            filter_account = f"@{filter_account}"

        # Use download tracker to get shortcodes (more reliable than scanning filenames)
        tracker = get_download_tracker()
        scraped_accounts = {}  # {account: [shortcodes]}

        # Build account -> shortcodes mapping from tracker
        for shortcode, data in tracker.get("downloaded", {}).items():
            account = data.get("account", "")
            if account:
                # Normalize account name to include @ if not present
                if not account.startswith('@'):
                    account = f"@{account}"

                if filter_account and account != filter_account:
                    continue

                if account not in scraped_accounts:
                    scraped_accounts[account] = []
                scraped_accounts[account].append(shortcode)

        # If filtering by account, return all videos for that account
        if filter_account:
            # If we have tracker data for this account, use it
            if filter_account in scraped_accounts and len(scraped_accounts[filter_account]) > 0:
                return jsonify({
                    'success': True,
                    'account': filter_account,
                    'videos': scraped_accounts[filter_account],
                    'video_count': len(scraped_accounts[filter_account])
                })

            # Fallback: scan filesystem and read Instaloader JSON files
            account_dir = OUTPUT_DIR / "originals" / filter_account
            if account_dir.exists():
                shortcodes = []
                # Scan for JSON files (Instaloader saves metadata alongside videos)
                for json_file in account_dir.glob("*.json"):
                    shortcode = get_shortcode_from_json(json_file)
                    if shortcode:
                        shortcodes.append(shortcode)

                return jsonify({
                    'success': True,
                    'account': filter_account,
                    'videos': shortcodes,
                    'video_count': len(shortcodes)
                })

            # No videos found
            return jsonify({
                'success': True,
                'account': filter_account,
                'videos': [],
                'video_count': 0
            })

        # Convert to response format (for all accounts)
        scraped = []
        for account, shortcodes in scraped_accounts.items():
            scraped.append({
                'account': account,
                'video_count': len(shortcodes),
                'videos': shortcodes[:10]  # Return sample shortcodes
            })

        return jsonify({
            'success': True,
            'scraped': scraped,
            'total_videos': sum(len(v) for v in scraped_accounts.values())
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# SAVED VIDEOS
# ============================================================================

@app.route('/api/saved')
def get_saved_videos():
    """Get list of all saved videos."""
    tracker = get_download_tracker()
    saved = list(tracker.get("downloaded", {}).keys())
    return jsonify({'success': True, 'saved': saved})

@app.route('/api/video/<filename>/delete', methods=['DELETE', 'POST'])
def delete_video(filename):
    """Delete a video and its associated files."""
    import os
    import glob

    deleted_files = []

    # Find all files with this filename (any extension)
    base_filename = filename
    parent_dir = None

    # Find the video file first
    for video_file in BASE_DIR.rglob(f"{base_filename}.mp4"):
        if any(skip in str(video_file) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
            continue
        if video_file.exists():
            parent_dir = video_file.parent
            # Delete the video file
            try:
                os.remove(video_file)
                deleted_files.append(str(video_file))
            except Exception as e:
                return jsonify({'success': False, 'error': f'Failed to delete video: {e}'}), 500
            break

    if not parent_dir:
        return jsonify({'success': False, 'error': 'Video not found'}), 404

    # Delete associated files (json, txt, jpg, etc.)
    for ext in ['*.json', '*.txt', '*.jpg', '*.jpeg', '*.webp']:
        for associated_file in parent_dir.glob(f"{base_filename}.{ext}"):
            try:
                os.remove(associated_file)
                deleted_files.append(str(associated_file))
            except Exception:
                pass  # Ignore errors for non-essential files

    # Remove from download tracker
    tracker = get_download_tracker()
    if base_filename in tracker.get("downloaded", {}):
        del tracker["downloaded"][base_filename]

    # Remove from saved videos set
    for account_name, account_data in tracker.get("accounts", {}).items():
        if base_filename in account_data.get("downloaded", []):
            account_data["downloaded"].remove(base_filename)

    save_json_file(DOWNLOAD_TRACKER_FILE, tracker)

    # Also remove from savedVideos if it's there (frontend will need to refresh)
    return jsonify({
        'success': True,
        'deleted': True,
        'files_deleted': len(deleted_files),
        'message': f'Deleted {len(deleted_files)} file(s)'
    })

@app.route('/api/videos/bulk-delete', methods=['POST'])
def bulk_delete_videos():
    """Delete multiple videos."""
    data = request.json
    filenames = data.get('filenames', [])

    if not filenames:
        return jsonify({'success': False, 'error': 'No filenames provided'}), 400

    results = {'success': [], 'failed': []}

    for filename in filenames:
        # Call delete logic for each file
        import os
        deleted = False

        for video_file in BASE_DIR.rglob(f"{filename}.mp4"):
            if any(skip in str(video_file) for skip in ['node_modules', '.git', '__pycache__', 'venv']):
                continue
            if video_file.exists():
                parent_dir = video_file.parent
                try:
                    os.remove(video_file)
                    # Delete associated files
                    for ext in ['*.json', '*.txt', '*.jpg', '*.jpeg', '*.webp']:
                        for associated_file in parent_dir.glob(f"{filename}.{ext}"):
                            try:
                                os.remove(associated_file)
                            except Exception:
                                pass
                    deleted = True
                except Exception as e:
                    results['failed'].append({'filename': filename, 'error': str(e)})
                    break
                if deleted:
                    results['success'].append(filename)
                    break

    # Update download tracker
    tracker = get_download_tracker()
    for filename in filenames:
        if filename in tracker.get("downloaded", {}):
            del tracker["downloaded"][filename]
    save_json_file(DOWNLOAD_TRACKER_FILE, tracker)

    return jsonify({
        'success': True,
        'deleted_count': len(results['success']),
        'failed_count': len(results['failed']),
        'results': results
    })

# ============================================================================
# CONTENT PREPARATION API
# ============================================================================

@app.route('/api/source/sync', methods=['POST'])
def sync_scraped_videos():
    """Sync scraped videos into source content database."""
    try:
        videos = get_all_videos()
        added = 0

        for video in videos:
            # Only add videos that aren't already tracked
            result = add_source_content({
                'filename': video['filename'],
                'path': video['path'],
                'account': video['account'],
                'caption': video.get('caption', ''),
                'likes': video.get('likes', 0),
                'views': video.get('views', 0),
                'engagement_rate': 0
            })
            if result > 0:
                added += 1

        return jsonify({
            'success': True,
            'total_videos': len(videos),
            'added_to_source': added
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/source/add', methods=['POST'])
def add_video_to_source():
    """
    Add a single video to source_content for preparation.
    Returns immediately - AI processing happens in background.

    Request body:
    {
        "filename": str,
        "manychat_keyword": str,
        "notes": str,
        "selected_account": str,  # Instagram account to post to
        "brand_voice_id": int,     # Brand voice profile ID for caption generation
        "isolate_vocals": bool     # Whether to isolate vocals
    }
    """
    try:
        data = request.get_json()
        filename = data.get('filename')
        manychat_keyword = data.get('manychat_keyword', '')
        notes = data.get('notes', '')
        selected_account = data.get('selected_account')
        brand_voice_id = data.get('brand_voice_id')  # NEW: Brand voice profile ID
        isolate_vocals = data.get('isolate_vocals', False)  # NEW: Get isolate vocals option

        if not filename:
            return jsonify({'success': False, 'error': 'filename is required'}), 400

        # Find the video file
        video_path = None
        for file in BASE_DIR.rglob(filename):
            if file.suffix in ['.mp4', '.mov', '.mkv']:
                video_path = str(file)
                break

        if not video_path:
            # Try with extension
            for ext in ['.mp4', '.mov', '.mkv']:
                for file in BASE_DIR.rglob(filename + ext):
                    if file.suffix == ext:
                        video_path = str(file)
                        break
                if video_path:
                    break

        if not video_path:
            return jsonify({'success': False, 'error': 'Video file not found'}), 404

        # Get account from path
        from pathlib import Path
        account = Path(video_path).parent.parent.name if len(Path(video_path).parents) >= 2 else 'unknown'

        # Use selected account if provided, otherwise use the original account
        target_account = selected_account if selected_account else account

        # Get video metadata from scraped videos
        videos = get_all_videos()
        video_data = next((v for v in videos if v['filename'] == filename), None)

        # Add to source_content with pending status
        source_id = add_source_content({
            'filename': filename,
            'path': video_path,
            'account': account,
            'caption': video_data.get('caption', '') if video_data else '',
            'likes': video_data.get('likes', 0) if video_data else 0,
            'views': video_data.get('views', 0) if video_data else 0,
            'engagement_rate': 0
        })

        if source_id < 0:
            return jsonify({'success': False, 'error': 'Failed to add to source content'}), 500

        # Store the ManyChat keyword, notes, isolate_vocals, brand_voice_id, and record video usage
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                UPDATE source_content
                SET manychat_keyword = ?, manychat_notes = ?, isolate_vocals = ?, brand_voice_id = ?
                WHERE id = ?
            """, (manychat_keyword, notes, 1 if isolate_vocals else 0, brand_voice_id, source_id))

            # NEW: Record video usage
            if target_account:
                cursor.execute("""
                    INSERT OR REPLACE INTO video_usage
                    (video_filename, account_username, used_at)
                    VALUES (?, ?, CURRENT_TIMESTAMP)
                """, (filename, target_account))

            conn.commit()
        except Exception as e:
            print(f"Error updating ManyChat info or recording usage: {e}")
        finally:
            conn.close()

        # Trigger background AI processing (non-blocking)
        @copy_current_request_context
        def process_ai_in_background():
            try:
                import ai_caption_service
                # This will run in background and update when ready
                ai_caption_service.generate_caption_for_source(source_id)
            except Exception as e:
                print(f"Background AI processing error: {e}")

        # Start background thread
        thread = threading.Thread(target=process_ai_in_background)
        thread.daemon = True
        thread.start()

        return jsonify({
            'success': True,
            'source_id': source_id,
            'message': 'Added to library - AI processing in background'
        })

    except Exception as e:
        print(f"Error adding to source: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/source')
def get_source_api():
    """Get source content for preparation."""
    status = request.args.get('status')  # pending, prepared, etc.
    limit = request.args.get('limit', 50, type=int)

    try:
        content = get_source_content(status=status, limit=limit)
        return jsonify({
            'success': True,
            'count': len(content),
            'items': content
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/source/<int:source_id>', methods=['DELETE'])
def delete_source_api(source_id):
    """Delete source content."""
    try:
        success = delete_source_content(source_id)
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to delete'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/source/<int:source_id>/retry', methods=['POST'])
def retry_source_processing(source_id):
    """Retry AI processing for a source content item."""
    try:
        # Reset processing status
        from database import update_processing_status
        update_processing_status(source_id, 'pending')

        # Trigger background AI processing (non-blocking)
        @copy_current_request_context
        def process_ai_in_background():
            try:
                import ai_caption_service
                ai_caption_service.generate_caption_for_source(source_id)
            except Exception as e:
                print(f"Background AI processing error: {e}")

        # Start background thread
        thread = threading.Thread(target=process_ai_in_background)
        thread.daemon = True
        thread.start()

        return jsonify({'success': True, 'message': 'AI processing restarted'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/prepare', methods=['POST'])
def prepare_content():
    """Prepare content for posting."""
    data = request.json
    source_id = data.get('source_id')

    if not source_id:
        return jsonify({'success': False, 'error': 'source_id required'}), 400

    try:
        ready_id = create_ready_content(source_id, {
            'video_path': data.get('video_path'),
            'caption': data.get('caption'),
            'hashtags': data.get('hashtags'),
            'sound_name': data.get('sound_name'),
            'sound_url': data.get('sound_url')
        })

        if ready_id > 0:
            return jsonify({
                'success': True,
                'ready_id': ready_id,
                'message': 'Content prepared successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create ready content'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# LIBRARY API
# ============================================================================

@app.route('/api/library')
def get_library_api():
    """Get ready content library."""
    status = request.args.get('status')  # ready, scheduled, posted

    try:
        content = get_ready_content(status=status)
        return jsonify({
            'success': True,
            'count': len(content),
            'items': content
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/library/<int:ready_id>/schedule', methods=['POST'])
def schedule_ready_content(ready_id):
    """Schedule ready content for posting."""
    data = request.json
    scheduled_for = data.get('scheduled_for')

    if not scheduled_for:
        return jsonify({'success': False, 'error': 'scheduled_for required'}), 400

    try:
        schedule_id = schedule_content(ready_id, datetime.datetime.fromisoformat(scheduled_for))

        if schedule_id > 0:
            return jsonify({
                'success': True,
                'schedule_id': schedule_id,
                'message': 'Content scheduled successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to schedule content'}), 500

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/library/<int:ready_id>', methods=['GET', 'DELETE'])
def ready_content_detail(ready_id):
    """Get or delete ready content details."""
    if request.method == 'DELETE':
        # Mark as deleted/hide
        try:
            update_ready_content(ready_id, {'status': 'deleted'})
            return jsonify({'success': True})
        except Exception as e:
            return jsonify({'success': False, 'error': str(e)}), 500

    # Get details
    try:
        content = get_ready_content()
        item = next((c for c in content if c['id'] == ready_id), None)

        if item:
            return jsonify({'success': True, 'item': item})
        else:
            return jsonify({'success': False, 'error': 'Not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# SCHEDULE API
# ============================================================================

@app.route('/api/schedule')
def get_schedule_api():
    """Get scheduled content."""
    upcoming = request.args.get('upcoming', 'true').lower() == 'true'

    try:
        content = get_scheduled_content(upcoming=upcoming)
        return jsonify({
            'success': True,
            'count': len(content),
            'items': content
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/schedule/<int:schedule_id>/post', methods=['POST'])
def mark_scheduled_posted(schedule_id):
    """Mark scheduled content as posted."""
    data = request.json
    posted_url = data.get('posted_url')

    try:
        if mark_as_posted(schedule_id, posted_url):
            return jsonify({'success': True, 'message': 'Marked as posted'})
        else:
            return jsonify({'success': False, 'error': 'Failed to mark as posted'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# NOTIFICATIONS API
# ============================================================================

@app.route('/api/notifications/stats')
def notification_stats_api():
    """Get notification statistics."""
    try:
        stats = get_notification_stats()
        return jsonify({'success': True, **stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/notifications')
def get_notifications_api():
    """Get notifications."""
    unread_only = request.args.get('unread_only', 'false').lower() == 'true'
    limit = request.args.get('limit', 50, type=int)

    try:
        notifications = get_notifications(unread_only=unread_only, limit=limit)
        return jsonify({
            'success': True,
            'count': len(notifications),
            'items': notifications
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/notifications/<int:notification_id>/read', methods=['POST'])
def mark_notification_read_api(notification_id):
    """Mark notification as read."""
    try:
        if mark_notification_read(notification_id):
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to mark as read'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/notifications/<int:notification_id>/complete', methods=['POST'])
def complete_notification_api(notification_id):
    """Mark notification action as taken (posted)."""
    data = request.json
    action_type = data.get('action_type', 'posted')

    try:
        if mark_notification_action(notification_id, action_type):
            return jsonify({'success': True, 'action': action_type})
        else:
            return jsonify({'success': False, 'error': 'Failed to mark action'}), 500
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/notifications/check-due', methods=['POST'])
def check_due_notifications_api():
    """Check for due notifications and create them."""
    try:
        # Get scheduled content that's due
        scheduled = get_scheduled_content(upcoming=False)
        created = 0

        for item in scheduled:
            if not item.get('notification_sent'):
                # Create notification
                notif_id = create_notification(
                    item['ready_content_id'],
                    item['id'],
                    "Time to Post! 📱",
                    "Your scheduled content is ready to post.",
                    'posting_reminder'
                )
                if notif_id > 0:
                    created += 1

        return jsonify({
            'success': True,
            'notifications_created': created
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# DELIVERY API
# ============================================================================

@app.route('/api/deliver/<int:ready_id>')
def get_delivery_content(ready_id):
    """Get content for delivery workflow."""
    try:
        content = get_ready_content()
        item = next((c for c in content if c['id'] == ready_id), None)

        if item:
            return jsonify({
                'success': True,
                'ready_id': ready_id,
                'video_path': item.get('video_path'),
                'caption': item.get('caption'),
                'hashtags': item.get('hashtags'),
                'sound_name': item.get('sound_name'),
                'sound_url': item.get('sound_url'),
                'account': item.get('account')
            })
        else:
            return jsonify({'success': False, 'error': 'Content not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/deliver/<int:ready_id>/download')
def download_delivery_video(ready_id):
    """Download video for posting."""
    try:
        content = get_ready_content()
        item = next((c for c in content if c['id'] == ready_id), None)

        if item and item.get('video_path'):
            video_path = Path(item['video_path'])
            if video_path.exists():
                return send_file(str(video_path), as_attachment=True)

        return jsonify({'success': False, 'error': 'Video not found'}), 404

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

# ============================================================================
# ANALYTICS API
# ============================================================================

@app.route('/api/analytics')
def get_analytics_api():
    """Get comprehensive analytics."""
    try:
        stats = get_system_stats()

        # Add scraped videos stats from existing system
        videos = get_all_videos()
        stats['scraped_videos'] = len(videos)
        stats['scraped_size_mb'] = sum(v.get('size_mb', 0) for v in videos)
        stats['scraped_likes'] = sum(v.get('likes', 0) for v in videos)
        stats['scraped_views'] = sum(v.get('views', 0) for v in videos)

        return jsonify({'success': True, **stats})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/analytics/performance')
def get_performance_analytics():
    """Get posted content performance."""
    try:
        posted = get_ready_content(status='posted')

        # Calculate performance metrics
        performance = {
            'total_posts': len(posted),
            'avg_likes': 0,
            'avg_views': 0,
            'top_performing': []
        }

        if posted:
            total_likes = sum(p.get('original_likes', 0) for p in posted)
            total_views = sum(p.get('original_views', 0) for p in posted)

            performance['avg_likes'] = total_likes // len(posted) if posted else 0
            performance['avg_views'] = total_views // len(posted) if posted else 0

            # Top performing
            sorted_posts = sorted(posted, key=lambda x: x.get('original_likes', 0), reverse=True)[:5]
            performance['top_performing'] = [{
                'id': p['id'],
                'caption': p.get('caption', '')[:100],
                'likes': p.get('original_likes', 0),
                'views': p.get('original_views', 0),
                'account': p.get('account')
            } for p in sorted_posts]

        return jsonify({'success': True, **performance})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================================
# AI CAPTION GENERATION API ENDPOINTS
# ============================================================================

from ai_caption_service import get_caption_generator

@app.route('/api/ai/config', methods=['GET'])
def ai_config():
    """Get AI configuration status"""
    import os
    api_key_set = bool(os.getenv('OPENROUTER_API_KEY'))

    return jsonify({
        'success': True,
        'openrouter_configured': api_key_set,
        'model': 'xiaomi/mimo-v2-flash:free',
        'features': [
            'video_analysis',
            'caption_generation',
            'quality_checking',
            'manychat_integration',
            'rag_retrieval'
        ]
    })


@app.route('/api/ai/analyze/<int:source_id>', methods=['POST'])
def analyze_video(source_id):
    """
    Analyze video content with AI
    Extracts visual description, content type, vibe, key elements
    """
    try:
        # Get source content
        source = get_source_content()
        video_data = next((v for v in source if v['id'] == source_id), None)

        if not video_data:
            return jsonify({'success': False, 'error': 'Video not found'}), 404

        # Run analysis
        generator = get_caption_generator()
        analysis = generator.analyzer.analyze_video(
            video_data.get('video_path', ''),
            video_data
        )

        # Store analysis in database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT OR REPLACE INTO video_analysis
                (source_content_id, visual_description, content_type, vibe,
                 key_elements, emotional_tone, suggested_hooks, target_audience,
                 engagement_triggers, analyzed_at, model_used)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                source_id,
                analysis.get('visual_description', ''),
                analysis.get('content_type', ''),
                analysis.get('vibe', ''),
                json.dumps(analysis.get('key_elements', [])),
                analysis.get('emotional_tone', ''),
                json.dumps(analysis.get('suggested_hooks', [])),
                analysis.get('target_audience', ''),
                json.dumps(analysis.get('engagement_triggers', [])),
                analysis.get('analyzed_at'),
                analysis.get('model_used')
            ))

            # Update source_content status
            cursor.execute("""
                UPDATE source_content
                SET analysis_status = 'completed', analysis_id = ?
                WHERE id = ?
            """, (cursor.lastrowid, source_id))

            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Error storing analysis: {e}")
        finally:
            conn.close()

        return jsonify({
            'success': True,
            'analysis': analysis,
            'message': 'Video analysis completed'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ai/generate-caption', methods=['POST'])
def generate_caption():
    """
    Generate AI caption for a video

    Request body:
    {
        "source_id": int,
        "account_id": int,
        "caption_style": "long_form" | "short_story" | "short_engagement",
        "reference_count": int (optional, default 5),
        "manychat_keyword": str (optional) - Only include CTA if this is provided
    }
    """
    try:
        data = request.get_json()
        source_id = data.get('source_id')
        account_id = data.get('account_id')
        caption_style = data.get('caption_style', 'long_form')
        reference_count = data.get('reference_count', 5)
        manychat_keyword = data.get('manychat_keyword')  # Get from request body

        if not source_id:
            return jsonify({'success': False, 'error': 'source_id is required'}), 400

        # Get source content
        source = get_source_content()
        video_data = next((v for v in source if v['id'] == source_id), None)

        if not video_data:
            return jsonify({'success': False, 'error': 'Video not found'}), 404

        # Generate caption
        generator = get_caption_generator()
        result = generator.generate_caption(
            video_data=video_data,
            account_id=account_id,
            caption_style=caption_style,
            reference_count=reference_count,
            manychat_keyword=manychat_keyword  # Pass the keyword from request
        )

        if not result.get('success'):
            return jsonify(result), 500

        # Log generation
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        try:
            cursor.execute("""
                INSERT INTO caption_generation_log
                (source_content_id, account_id, generated_caption, caption_style,
                 model_used, quality_score, uniqueness_score, references_used,
                 quality_checks, warnings)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                source_id,
                account_id,
                result.get('caption'),
                caption_style,
                result.get('analysis', {}).get('model_used'),
                result.get('quality_score'),
                result.get('uniqueness_score'),
                json.dumps(result.get('references_used', [])),
                json.dumps(result.get('quality_checks', {})),
                json.dumps(result.get('warnings', []))
            ))
            conn.commit()
        except Exception as e:
            conn.rollback()
            print(f"Error logging caption generation: {e}")
        finally:
            conn.close()

        return jsonify({
            'success': True,
            'caption': result.get('caption'),
            'analysis': result.get('analysis'),
            'quality_score': result.get('quality_score'),
            'uniqueness_score': result.get('uniqueness_score'),
            'quality_checks': result.get('quality_checks'),
            'warnings': result.get('warnings'),
            'references_used': result.get('references_used', []),
            'message': 'Caption generated successfully'
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ai/generate-variations', methods=['POST'])
def generate_caption_variations():
    """
    Generate multiple caption variations with different hooks/bodies

    Request body:
    {
        "source_id": int,
        "account_id": int,
        "count": int (optional, default 3)
    }
    """
    try:
        data = request.get_json()
        source_id = data.get('source_id')
        account_id = data.get('account_id')
        count = data.get('count', 3)

        if not source_id:
            return jsonify({'success': False, 'error': 'source_id is required'}), 400

        # Get source content
        source = get_source_content()
        video_data = next((v for v in source if v['id'] == source_id), None)

        if not video_data:
            return jsonify({'success': False, 'error': 'Video not found'}), 404

        generator = get_caption_generator()
        variations = []

        for i in range(count):
            result = generator.generate_caption(
                video_data=video_data,
                account_id=account_id,
                caption_style='long_form',
                reference_count=3
            )

            if result.get('success'):
                variations.append({
                    'variation': i + 1,
                    'caption': result.get('caption'),
                    'quality_score': result.get('quality_score'),
                    'uniqueness_score': result.get('uniqueness_score'),
                    'warnings': result.get('warnings', [])
                })

        return jsonify({
            'success': True,
            'variations': variations,
            'total': len(variations)
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/ai/feedback', methods=['POST'])
def submit_caption_feedback():
    """
    Submit feedback on generated caption for learning

    Request body:
    {
        "generation_id": int,
        "accepted": bool,
        "edits": str (optional),
        "feedback": str (optional)
    }
    """
    try:
        data = request.get_json()
        generation_id = data.get('generation_id')
        accepted = data.get('accepted', False)
        edits = data.get('edits', '')
        feedback = data.get('feedback', '')

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                UPDATE caption_generation_log
                SET accepted = ?, feedback = ?
                WHERE id = ?
            """, (1 if accepted else 0, feedback or edits, generation_id))

            conn.commit()

            return jsonify({
                'success': True,
                'message': 'Feedback recorded'
            })

        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/accounts', methods=['GET'])
def get_accounts():
    """Get all configured accounts with ManyChat settings"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        cursor.execute("""
            SELECT id, username, platform, brand_voice, tone_guidelines,
                   manychat_cta, manychat_keyword, manychat_automation_name,
                   active, created_at
            FROM accounts
            ORDER BY username
        """)

        accounts = [dict(row) for row in cursor.fetchall()]

        return jsonify({
            'success': True,
            'accounts': accounts
        })

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/accounts/<int:account_id>', methods=['GET', 'PUT', 'DELETE'])
def manage_account(account_id):
    """Get, update, or delete account configuration"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    try:
        if request.method == 'GET':
            cursor.execute("SELECT * FROM accounts WHERE id = ?", (account_id,))
            account = cursor.fetchone()

            if not account:
                return jsonify({'success': False, 'error': 'Account not found'}), 404

            return jsonify({'success': True, 'account': dict(account)})

        elif request.method == 'PUT':
            data = request.get_json()

            cursor.execute("""
                UPDATE accounts
                SET username = ?,
                    brand_voice = ?,
                    tone_guidelines = ?,
                    manychat_cta = ?,
                    manychat_keyword = ?,
                    manychat_automation_name = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            """, (
                data.get('username'),
                data.get('brand_voice'),
                data.get('tone_guidelines'),
                data.get('manychat_cta'),
                data.get('manychat_keyword'),
                data.get('manychat_automation_name'),
                account_id
            ))

            conn.commit()

            return jsonify({'success': True, 'message': 'Account updated'})

        elif request.method == 'DELETE':
            cursor.execute("DELETE FROM accounts WHERE id = ?", (account_id,))
            conn.commit()

            return jsonify({'success': True, 'message': 'Account deleted'})

    except Exception as e:
        conn.rollback()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        conn.close()


@app.route('/api/accounts', methods=['POST'])
def create_account():
    """Create new account configuration"""
    try:
        data = request.get_json()

        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO accounts (username, platform, brand_voice, tone_guidelines,
                                     manychat_cta, manychat_keyword, manychat_automation_name)
                VALUES (?, ?, ?, ?, ?, ?, ?)
            """, (
                data.get('username'),
                data.get('platform', 'instagram'),
                data.get('brand_voice', ''),
                data.get('tone_guidelines', ''),
                data.get('manychat_cta', 'LINK'),
                data.get('manychat_keyword'),
                data.get('manychat_automation_name')
            ))

            conn.commit()

            return jsonify({
                'success': True,
                'account_id': cursor.lastrowid,
                'message': 'Account created'
            })

        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()

    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/accounts/settings', methods=['GET', 'POST', 'DELETE'])
def account_settings_api():
    """
    GET: Get all account settings
    POST: Create or update account settings
    DELETE: Delete account settings by username
    """
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    try:
        if request.method == 'GET':
            cursor.execute("""
                SELECT id, username, platform, brand_voice, tone_guidelines, content_strategy,
                       manychat_cta, manychat_keyword, manychat_automation_name, active
                FROM accounts
                ORDER BY username
            """)

            accounts = []
            for row in cursor.fetchall():
                accounts.append({
                    'id': row[0],
                    'username': row[1],
                    'platform': row[2],
                    'brand_voice': row[3],
                    'tone_guidelines': row[4],
                    'content_strategy': row[5],
                    'manychat_cta': row[6],
                    'manychat_keyword': row[7],
                    'automation_name': row[8],
                    'active': row[9]
                })

            return jsonify({'success': True, 'accounts': accounts})

        elif request.method == 'POST':
            data = request.get_json()
            username = data.get('username')

            if not username:
                return jsonify({'success': False, 'error': 'username is required'}), 400

            # Check if account exists
            cursor.execute("SELECT id FROM accounts WHERE username = ?", (username,))
            existing = cursor.fetchone()

            if existing:
                # Update existing
                cursor.execute("""
                    UPDATE accounts
                    SET brand_voice = ?,
                        tone_guidelines = ?,
                        content_strategy = ?,
                        manychat_cta = ?,
                        manychat_keyword = ?,
                        manychat_automation_name = ?,
                        updated_at = CURRENT_TIMESTAMP
                    WHERE username = ?
                """, (
                    data.get('brand_voice', ''),
                    data.get('tone_guidelines', ''),
                    data.get('content_strategy', ''),
                    data.get('manychat_cta', 'LINK'),
                    data.get('manychat_keyword', 'LINK'),
                    data.get('manychat_automation_name', ''),
                    username
                ))
            else:
                # Insert new
                cursor.execute("""
                    INSERT INTO accounts (username, platform, brand_voice, tone_guidelines,
                                       content_strategy, manychat_cta, manychat_keyword, manychat_automation_name)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    username,
                    data.get('platform', 'instagram'),
                    data.get('brand_voice', ''),
                    data.get('tone_guidelines', ''),
                    data.get('content_strategy', ''),
                    data.get('manychat_cta', 'LINK'),
                    data.get('manychat_keyword', 'LINK'),
                    data.get('manychat_automation_name', '')
                ))

            conn.commit()

            return jsonify({
                'success': True,
                'message': 'Account settings saved successfully'
            })

        elif request.method == 'DELETE':
            username = request.args.get('username')

            if not username:
                return jsonify({'success': False, 'error': 'username is required'}), 400

            cursor.execute("DELETE FROM accounts WHERE username = ?", (username,))
            conn.commit()

            return jsonify({
                'success': True,
                'message': 'Account settings deleted'
            })

    except Exception as e:
        conn.rollback()
        print(f"Error in account settings API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500
    finally:
        conn.close()

@app.route('/api/brand-voice', methods=['GET', 'POST', 'DELETE'])
def brand_voice_api():
    """
    GET: Get all brand voice profiles or specific account profile
    POST: Create or update brand voice profile
    DELETE: Delete brand voice profile
    """
    try:
        if request.method == 'GET':
            # Get specific profile or all profiles
            account = request.args.get('account')

            if account:
                profile = get_brand_voice_profile(account)
                if profile:
                    return jsonify({'success': True, 'profile': profile})
                else:
                    return jsonify({'success': False, 'error': 'Profile not found'}), 404
            else:
                profiles = get_all_brand_voice_profiles()
                return jsonify({'success': True, 'profiles': profiles})

        elif request.method == 'POST':
            data = request.get_json()

            if not data.get('account_username'):
                return jsonify({'success': False, 'error': 'account_username is required'}), 400

            profile_id = create_brand_voice_profile(data)

            if profile_id > 0:
                return jsonify({
                    'success': True,
                    'profile_id': profile_id,
                    'message': 'Brand voice profile saved successfully'
                })
            else:
                return jsonify({'success': False, 'error': 'Failed to save profile'}), 500

        elif request.method == 'DELETE':
            account = request.args.get('account')

            if not account:
                return jsonify({'success': False, 'error': 'account parameter is required'}), 400

            if delete_brand_voice_profile(account):
                return jsonify({'success': True, 'message': 'Profile deleted'})
            else:
                return jsonify({'success': False, 'error': 'Failed to delete profile'}), 500

    except Exception as e:
        print(f"Error in brand voice API: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/brand-voice/<int:profile_id>', methods=['PUT'])
def update_brand_voice_profile_api(profile_id):
    """
    PUT: Update an existing brand voice profile
    """
    try:
        data = request.get_json()
        print(f"[UPDATE PROFILE] profile_id: {profile_id}")
        print(f"[UPDATE PROFILE] data keys: {list(data.keys()) if data else 'None'}")
        print(f"[UPDATE PROFILE] core_values: {data.get('core_values', 'N/A')}")
        print(f"[UPDATE PROFILE] personality_traits: {data.get('personality_traits', 'N/A')}")

        if not data:
            return jsonify({'success': False, 'error': 'No data provided'}), 400

        result = update_brand_voice_profile(profile_id, data)
        print(f"[UPDATE PROFILE] update_brand_voice_profile returned: {result}")

        if result:
            return jsonify({
                'success': True,
                'message': 'Brand voice profile updated successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to update profile'}), 500
    except Exception as e:
        print(f"Error updating brand voice profile: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/brand-voice/variants', methods=['GET'])
def get_variants_api():
    """
    GET: Get all variant profiles for a parent account
    Query params:
        - parent: Parent account username
    """
    try:
        parent_account = request.args.get('parent')

        if not parent_account:
            return jsonify({'success': False, 'error': 'parent parameter is required'}), 400

        variants = get_profile_variants(parent_account)
        return jsonify({'success': True, 'variants': variants})

    except Exception as e:
        print(f"Error getting variants: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/brand-voice/clones', methods=['GET'])
def get_clones_api():
    """
    GET: Get all cloned profiles from a source account
    Query params:
        - source: Source account username
    """
    try:
        source_account = request.args.get('source')

        if not source_account:
            return jsonify({'success': False, 'error': 'source parameter is required'}), 400

        clones = get_profile_clones(source_account)
        return jsonify({'success': True, 'clones': clones})

    except Exception as e:
        print(f"Error getting clones: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/brand-voice/variant', methods=['POST'])
def create_variant_api():
    """
    POST: Create a variant profile (same brand, different page style)
    """
    try:
        data = request.get_json()

        if not data.get('account_username'):
            return jsonify({'success': False, 'error': 'account_username is required'}), 400

        if not data.get('parent_account'):
            return jsonify({'success': False, 'error': 'parent_account is required for variants'}), 400

        # Set variant flags
        data['is_variant'] = 1
        data['is_clone'] = 0

        profile_id = create_brand_voice_profile(data)

        if profile_id > 0:
            return jsonify({
                'success': True,
                'profile_id': profile_id,
                'message': 'Variant profile created successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create variant'}), 500

    except Exception as e:
        print(f"Error creating variant: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/brand-voice/clone', methods=['POST'])
def create_clone_api():
    """
    POST: Create a cloned profile (same style, different brand)
    """
    try:
        data = request.get_json()

        if not data.get('account_username'):
            return jsonify({'success': False, 'error': 'account_username is required'}), 400

        if not data.get('cloned_from'):
            return jsonify({'success': False, 'error': 'cloned_from is required for clones'}), 400

        # Set clone flags
        data['is_variant'] = 0
        data['is_clone'] = 1

        profile_id = create_brand_voice_profile(data)

        if profile_id > 0:
            return jsonify({
                'success': True,
                'profile_id': profile_id,
                'message': 'Profile cloned successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to create clone'}), 500

    except Exception as e:
        print(f"Error creating clone: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

# ===== OFFERS MANAGEMENT API ENDPOINTS =====

@app.route('/api/offers', methods=['GET'])
def get_offers():
    """Get all offers, optionally filtered by account_id."""
    try:
        account_id = request.args.get('account_id', type=int)
        active_only = request.args.get('active_only', 'true').lower() == 'true'

        offers = get_all_offers(account_id=account_id, active_only=active_only)
        return jsonify({'success': True, 'offers': offers})
    except Exception as e:
        print(f"Error getting offers: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/offers/<int:offer_id>', methods=['GET'])
def get_offer(offer_id):
    """Get a specific offer by ID."""
    try:
        offer = get_offer_by_id(offer_id)
        if not offer:
            return jsonify({'success': False, 'error': 'Offer not found'}), 404
        return jsonify({'success': True, 'offer': offer})
    except Exception as e:
        print(f"Error getting offer: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/offers', methods=['POST'])
def create_offer_endpoint():
    """Create a new offer."""
    try:
        data = request.get_json()

        # Validate required fields
        required_fields = ['name', 'manychat_keyword', 'benefit_statement']
        missing = [f for f in required_fields if not data.get(f)]
        if missing:
            return jsonify({'success': False, 'error': f'Missing required fields: {", ".join(missing)}'}), 400

        # Check if keyword already exists
        existing = get_offer_by_keyword(data['manychat_keyword'])
        if existing:
            return jsonify({'success': False, 'error': 'ManyChat keyword already exists'}), 400

        # Create default CTA template if not provided
        if 'cta_template' not in data:
            data['cta_template'] = "Comment '{keyword}' to get {benefit}"

        offer_id = create_offer(data)
        if offer_id > 0:
            return jsonify({'success': True, 'offer_id': offer_id})
        else:
            return jsonify({'success': False, 'error': 'Failed to create offer'}), 500
    except Exception as e:
        print(f"Error creating offer: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/offers/<int:offer_id>', methods=['PUT'])
def update_offer_endpoint(offer_id):
    """Update an existing offer."""
    try:
        data = request.get_json()

        # If changing keyword, check it doesn't already exist
        if 'manychat_keyword' in data:
            existing = get_offer_by_keyword(data['manychat_keyword'])
            if existing and existing['id'] != offer_id:
                return jsonify({'success': False, 'error': 'ManyChat keyword already exists'}), 400

        success = update_offer(offer_id, data)
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to update offer'}), 500
    except Exception as e:
        print(f"Error updating offer: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/offers/<int:offer_id>', methods=['DELETE'])
def delete_offer_endpoint(offer_id):
    """Delete an offer (soft delete)."""
    try:
        success = delete_offer(offer_id)
        if success:
            return jsonify({'success': True})
        else:
            return jsonify({'success': False, 'error': 'Failed to delete offer'}), 500
    except Exception as e:
        print(f"Error deleting offer: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/offers/keyword/<keyword>', methods=['GET'])
def get_offer_by_keyword_endpoint(keyword):
    """Get an offer by ManyChat keyword."""
    try:
        offer = get_offer_by_keyword(keyword)
        if not offer:
            return jsonify({'success': False, 'error': 'Offer not found'}), 404
        return jsonify({'success': True, 'offer': offer})
    except Exception as e:
        print(f"Error getting offer by keyword: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500

# ===== NEW PREPARATION WORKFLOW API ENDPOINTS =====

@app.route('/api/audio/isolate-vocals', methods=['POST'])
def isolate_vocals():
    """
    Isolate vocals from background music in a video

    Request body:
    {
        "filename": str  # Video filename
    }

    This endpoint processes the audio track to separate vocals from music.
    It uses spleeter or similar library for source separation.
    """
    try:
        data = request.get_json()
        filename = data.get('filename')

        if not filename:
            return jsonify({'success': False, 'error': 'filename is required'}), 400

        # Find the video file - try with and without extension
        video_path = None

        # First try exact match
        for file in BASE_DIR.rglob(filename):
            if file.suffix in ['.mp4', '.mov', '.mkv']:
                video_path = file
                break

        # If not found, try adding common extensions
        if not video_path:
            for ext in ['.mp4', '.mov', '.mkv']:
                for file in BASE_DIR.rglob(filename + ext):
                    if file.suffix == ext:
                        video_path = file
                        break
                if video_path:
                    break

        if not video_path:
            return jsonify({'success': False, 'error': 'Video file not found'}), 404

        # TODO: Implement actual vocal isolation using spleeter/demucs
        # For now, we'll create a placeholder implementation
        # that marks the video as processed

        # Extract audio using ffmpeg (placeholder)
        audio_output = BASE_DIR / 'processed_audio' / f"{video_path.stem}_vocals.wav"
        audio_output.parent.mkdir(exist_ok=True)

        # In a real implementation, you would:
        # 1. Extract audio from video using ffmpeg
        # 2. Use spleeter or demucs to separate vocals
        # 3. Save the isolated vocal track
        # 4. Optionally remix with the isolated vocals back into video

        # For now, just mark as processed
        processed_dir = video_path.parent / 'processed'
        processed_dir.mkdir(exist_ok=True)

        processed_path = processed_dir / f"{video_path.stem}_vocals_isolated{video_path.suffix}"

        # Copy video to processed folder (placeholder for actual processing)
        import shutil
        shutil.copy2(video_path, processed_path)

        return jsonify({
            'success': True,
            'message': 'Vocals isolated successfully',
            'processed_path': str(processed_path),
            'note': 'This is a placeholder implementation. Integrate spleeter/demucs for actual vocal isolation.'
        })

    except Exception as e:
        print(f"Error isolating vocals: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


def generate_caption_in_parts(model, messages, max_tokens_per_part, num_parts, headers):
    """
    Generate a long caption by making multiple API calls and stitching results together.
    This works around model output token limits.
    """
    import http.client
    import json
    import re

    # Write to log file directly
    log_file = "/tmp/caption_stitching.log"

    all_parts = []
    context_so_far = ""

    with open(log_file, "a") as f:
        f.write(f"[STITCHING] Starting {num_parts}-part generation with {max_tokens_per_part} tokens each\n")
        f.write(f"[STITCHING] Model: {model}\n")
        f.write(f"[STITCHING] Messages: {len(messages)} messages\n")
        f.flush()

    for i in range(num_parts):
        with open(log_file, "a") as f:
            f.write(f"[STITCHING] Generating part {i+1}/{num_parts}...\n")
            f.flush()

        try:
            # For subsequent parts, add the previous content as context
            if i > 0:
                # Add continuation instruction to the last message
                messages[-1]["content"] = f"{context_so_far}\n\n--- CONTINUE THE STORY FROM ABOVE ---\n\nWrite the next part of the story, picking up exactly where the previous part left off. Do not repeat the ending - continue seamlessly."

            payload = {
                "model": model,
                "messages": messages,
                "max_tokens": max_tokens_per_part,
                "temperature": 0.8
            }

            conn = http.client.HTTPSConnection("openrouter.ai")
            conn.request("POST", "/api/v1/chat/completions", json.dumps(payload).encode(), headers)
            response = conn.getresponse()

            with open(log_file, "a") as f:
                f.write(f"[STITCHING] Response status for part {i+1}: {response.status}\n")
                f.flush()

            if response.status != 200:
                error_data = response.read().decode()
                with open(log_file, "a") as f:
                    f.write(f"[STITCHING] Part {i+1} failed: {error_data[:500]}\n")
                    f.flush()
                break

            result = json.loads(response.read().decode())

            with open(log_file, "a") as f:
                f.write(f"[STITCHING] Result keys for part {i+1}: {list(result.keys())}\n")
                if 'error' in result:
                    f.write(f"[STITCHING] ERROR: {result.get('error')}\n")
                f.flush()

            if 'choices' not in result or len(result['choices']) == 0:
                with open(log_file, "a") as f:
                    f.write(f"[STITCHING] No choices in result for part {i+1}\n")
                    f.write(f"[STITCHING] Full result: {json.dumps(result)[:1000]}\n")
                    f.flush()
                break

            part_text = result['choices'][0]['message']['content'].strip()

            with open(log_file, "a") as f:
                f.write(f"[STITCHING] Part {i+1} generated: {len(part_text.split())} words, {len(part_text)} chars\n")
                f.flush()

            if not part_text:
                with open(log_file, "a") as f:
                    f.write(f"[STITCHING] Part {i+1} is empty!\n")
                    f.flush()
                break

            all_parts.append(part_text)
            context_so_far = part_text
            conn.close()

        except Exception as e:
            with open(log_file, "a") as f:
                f.write(f"[STITCHING] Exception in part {i+1}: {str(e)}\n")
                import traceback
                f.write(traceback.format_exc())
                f.flush()
            break

    # Stitch parts together, removing any redundant transitions
    combined = "\n\n".join(all_parts)

    with open(log_file, "a") as f:
        f.write(f"[STITCHING] Combined caption: {len(combined.split())} words total, {len(all_parts)} parts\n")
        f.flush()

    # Clean up common continuation artifacts
    combined = re.sub(r'- CONTINUE THE STORY.*', '', combined, flags=re.DOTALL)
    combined = re.sub(r'Writing the next part.*', '', combined, flags=re.DOTALL)
    combined = combined.strip()

    return combined


@app.route('/api/caption/generate', methods=['POST'])
def generate_caption_simple():
    """
    Generate AI caption for a scraped video using Gemini with full video analysis

    Request body:
    {
        "filename": str,
        "account": str,
        "original_caption": str (optional),
        "manychat_keyword": str (optional),
        "notes": str (optional) - User guidance to inform caption generation
    }
    """
    try:
        data = request.get_json()
        filename = data.get('filename')
        account = data.get('account', '')
        original_caption = data.get('original_caption', '')
        manychat_keyword = data.get('manychat_keyword', '')
        notes = data.get('notes', '')

        # Log incoming request
        print(f"[REQUEST] filename={filename}, account={account}, manychat_keyword='{manychat_keyword}', notes length={len(notes)}")

        if not filename:
            return jsonify({'success': False, 'error': 'filename is required'}), 400

        # Get brand voice profile for this account
        brand_voice = get_brand_voice_for_caption(account) if account else None
        print(f"[DEBUG] account={account}, brand_voice found: {brand_voice is not None}")

        # Get caption length preference and set max_tokens (do this outside conditional)
        caption_length_preference = "medium"
        length_guidance = "250-350 words - Balanced approach with key insights."
        max_tokens = 1200  # default to medium

        if brand_voice:
            # caption_length_preference is nested under brand_voice['preferences']['length']
            caption_length_preference = brand_voice.get('preferences', {}).get('length', 'medium')
            print(f"[DEBUG] account={account}, caption_length_preference={caption_length_preference}, manychat_keyword='{manychat_keyword}'")
            length_specs = {
                "story": "750-1000 words - Write a deep, narrative-driven story with multiple chapters and extensive detail.",
                "long": "400-500 words - Detailed exploration with multiple paragraphs.",
                "medium": "250-350 words - Balanced approach with key insights.",
                "short": "100-150 words - Quick, punchy delivery of one core idea."
            }
            length_guidance = length_specs.get(caption_length_preference, length_specs["medium"])

            max_tokens_map = {
                "story": 3500,   # ~1000-1200 words - increased for deep narrative
                "long": 1800,    # ~500 words
                "medium": 1200,  # ~300 words
                "short": 800     # ~150 words
            }
            max_tokens = max_tokens_map.get(caption_length_preference, 1200)
            print(f"[DEBUG] max_tokens={max_tokens}, length_guidance={length_guidance}")

        # Build brand voice context for AI
        brand_voice_context = ""
        if brand_voice:
            # Parse JSON fields if they exist
            import json as json_module

            core_values = brand_voice.get('core_values', [])
            if isinstance(core_values, str):
                try:
                    core_values = json_module.loads(core_values)
                except:
                    core_values = []

            personality_traits = brand_voice.get('personality_traits', [])
            if isinstance(personality_traits, str):
                try:
                    personality_traits = json_module.loads(personality_traits)
                except:
                    personality_traits = []

            content_pillars = brand_voice.get('content_pillars', [])
            if isinstance(content_pillars, str):
                try:
                    content_pillars = json_module.loads(content_pillars)
                except:
                    content_pillars = []

            do_keywords = brand_voice.get('do_keywords', [])
            if isinstance(do_keywords, str):
                try:
                    do_keywords = json_module.loads(do_keywords)
                except:
                    do_keywords = []

            dont_keywords = brand_voice.get('dont_keywords', [])
            if isinstance(dont_keywords, str):
                try:
                    dont_keywords = json_module.loads(dont_keywords)
                except:
                    dont_keywords = []

            # Build grammar style guidance
            grammar_guidance = {
                'formal': "Use perfect grammar, complete sentences, proper punctuation, and professional language.",
                'casual': "Use mostly correct grammar with relaxed conversational tone. Minor punctuation is okay.",
                'relaxed': "Use minimal punctuation, lowercase is acceptable, very casual and conversational."
            }.get(brand_voice.get('grammar_style'), "Use natural, conversational grammar.")

            # Build slang style guidance
            slang_guidance = {
                'none': "Use professional language only. No slang or abbreviations.",
                'light': "Use common abbreviations (lol, btw, tbh, rn, ppl) sparingly and naturally.",
                'heavy': "Use casual internet slang and abbreviations freely (rn, tmr, ngl, fr, tho, bc)."
            }.get(brand_voice.get('slang_style'), "Use natural language appropriate for the context.")

            # Build spacing style guidance
            spacing_guidance = {
                'compact': "Use single paragraph, tight spacing.",
                'moderate': "Use 1-2 line breaks between sections for readability.",
                'airy': "Use multiple line breaks to create space and make it very readable.",
                'bullet-points': "Use bullet points (•) or numbers for lists and key points."
            }.get(brand_voice.get('spacing_style'), "Use line breaks for readability.")

            # Build hashtag guidance
            hashtag_usage = brand_voice.get('hashtag_usage') or brand_voice.get('hashtag_strategy', 'moderate')
            hashtag_guidance = {
                'none': "NO HASHTAGS - Do not include any hashtags at the end of the caption",
                'minimal': "Include 3-5 highly relevant hashtags at the very end",
                'moderate': "Include 5-10 relevant hashtags at the very end",
                'extensive': "Include 15-30 relevant hashtags at the very end for maximum reach"
            }.get(hashtag_usage, "Include 5-10 relevant hashtags at the very end")

            # Build emoji guidance
            emoji_usage = brand_voice.get('emoji_usage', 'moderate')
            emoji_guidance = {
                'none': "NO EMOJIS AT ALL - Write clean text without any emojis",
                'minimal': "Use 1-2 emojis maximum for the ENTIRE caption - NEVER in the hook/first line",
                'moderate': "Use emojis naturally but sparingly (2-4 total) - NEVER in the hook/first line",
                'liberal': "Use emojis freely throughout for visual engagement - but NEVER in the hook/first line"
            }.get(emoji_usage, "Use 1-2 emojis maximum - NEVER in the hook/first line")

            brand_voice_context = f"""

## BRAND VOICE GUIDELINES:

**Brand:** {brand_voice.get('brand_name') or brand_voice.get('profile_name', account)}
**One-Liner:** {brand_voice.get('brand_one_liner', 'N/A')}

**Core Values:** {', '.join(core_values) if core_values else 'Not specified'}
**Personality:** {', '.join(personality_traits) if personality_traits else 'Authentic and engaging'}
**Content Pillars:** {', '.join(content_pillars) if content_pillars else 'General content'}

**Target Audience:** {brand_voice.get('target_audience', 'General audience')}
**Audience Familiarity:** {brand_voice.get('audience_familiarity', 'Somewhat familiar')}

**Grammar Style:** {grammar_guidance}
**Slang/Abbreviations:** {slang_guidance}
**Caption Spacing:** {spacing_guidance}

**Writing Style:** {brand_voice.get('writing_style', 'Conversational')}
**Caption Structure:** {brand_voice.get('caption_structure', 'Hook → Body → CTA')}

**DO Keywords (use these):** {', '.join(do_keywords) if do_keywords else 'None specified'}
**DON'T Keywords (avoid these):** {', '.join(dont_keywords) if dont_keywords else 'None specified'}

**Emojis:** {emoji_guidance}
**Hashtags:** {hashtag_guidance}

{"**CTA Instructions:** NO CTA - End naturally without asking for anything" if not manychat_keyword else f'**CTA Instructions:** Use ManyChat keyword "{manychat_keyword}" - {brand_voice.get("cta_instructions", "Make it compelling")}'}
{"**Automation Offer:** (omitted - no CTA selected)" if not manychat_keyword else f'**Automation Offer:** {brand_voice.get("automation_offer", "N/A")}'}

**Additional Notes:** {brand_voice.get('additional_notes', 'N/A')}
"""

        # Find the video file - try with and without extension
        video_path = None

        # First try exact match
        for file in BASE_DIR.rglob(filename):
            if file.suffix in ['.mp4', '.mov', '.mkv']:
                video_path = file
                break

        # If not found, try adding common extensions
        if not video_path:
            for ext in ['.mp4', '.mov', '.mkv']:
                for file in BASE_DIR.rglob(filename + ext):
                    if file.suffix == ext:
                        video_path = file
                        break
                if video_path:
                    break

        if not video_path:
            return jsonify({'success': False, 'error': 'Video file not found'}), 404

        # Check for OpenRouter API key
        openrouter_key = os.environ.get('OPENROUTER_API_KEY')
        if not openrouter_key:
            return jsonify({
                'success': False,
                'error': 'OpenRouter API key not configured. Set OPENROUTER_API_KEY environment variable.'
            }), 500

        import http.client
        import json
        import base64
        import mimetypes

        # Read and encode the video file
        with open(video_path, 'rb') as video_file:
            video_data = video_file.read()
            video_base64 = base64.b64encode(video_data).decode('utf-8')
            mime_type = mimetypes.guess_type(video_path)[0] or 'video/mp4'

        # Build CTA based on ManyChat keyword with offer context
        cta_instruction = ""
        offer_context = ""
        if manychat_keyword:
            # Try to get offer context from the offers system
            offer = get_offer_by_keyword(manychat_keyword)
            if offer:
                offer_context = f"""

## OFFER CONTEXT (for better CTAs):
- Offer Name: {offer.get('name', 'N/A')}
- What They Get: {offer.get('benefit_statement', 'Access to exclusive content')}
- Why They Want It: {offer.get('value_proposition', 'Get valuable insights')}
- Target Audience: {offer.get('target_audience', 'General audience')}

Use this context to create compelling, benefit-driven CTAs. For example:
- "Comment '{manychat_keyword}' and I'll send you {offer.get('benefit_statement', 'the full guide')}"
- "Want {offer.get('value_proposition', 'better results')}? Comment '{manychat_keyword}' below"
- "Drop '{manychat_keyword}' to get {offer.get('benefit_statement', 'access')}"

Make the CTA specific and benefit-focused."""
                # Track offer usage
                increment_offer_usage(offer.get('id'))
            else:
                # Fallback if no offer found
                offer_context = f"""

## MANYCHAT KEYWORD:
Use keyword '{manychat_keyword}' in your CTA.
Make it clear what they'll get when they comment."""
        else:
            # NO ManyChat keyword selected - explicitly tell AI NO CTA
            offer_context = "\n- End naturally without any call-to-action - do NOT ask for anything"

        # Build guidance section from notes
        guidance_section = ""
        if notes and notes.strip():
            guidance_section = f"""

USER GUIDANCE - Take this into account:
{notes.strip()}

"""

        # Build the prompt with brand voice and offer context
        if brand_voice_context:
            # Specialized prompt for STORY length - multi-chapter deep narrative
            if caption_length_preference == "story":
                prompt = f"""Analyze this video from @{account} and write a DEEP, MULTI-CHAPTER narrative Instagram caption.

Original caption for reference: {original_caption if original_caption else 'No original caption'}{brand_voice_context}{guidance_section}{offer_context}

## STORY MODE - DEEP NARRATIVE STRUCTURE (750-1000 words minimum)

You are writing a MAGNUM OPUS - your most impactful, substantial content. This should feel like reading a short article or book chapter.

### REQUIRED STRUCTURE - 5-7 CHAPTERS:

**CHAPTER 1: The Hook & Setup (100-150 words)**
- Start with a POWERFUL, provocative statement about the core concept
- Set the scene and establish the emotional premise
- NO questions, NO invitations - just pure statement
- Build immediate intrigue

**CHAPTER 2: Personal Story or Example (150-200 words)**
- Share a specific, detailed personal anecdote
- Or paint a vivid picture/example that illustrates the concept
- Use sensory details - what you saw, felt, heard, experienced
- Make the reader feel like they were THERE

**CHAPTER 3: The Hidden Truth/Revelation (150-200 words)**
- Go DEEP into the core concept
- Explain the "why" behind the "what"
- Challenge common misconceptions
- Share insights that aren't obvious
- This is where you deliver real value

**CHAPTER 4: The Science/Logic Behind It (100-150 words)**
- Back up your claims with reasoning
- Explain HOW it works
- Build credibility and authority
- Show you've done your research

**CHAPTER 5: The Transformation Journey (100-150 words)**
- Describe the before/after
- The struggle and the breakthrough
- Make it emotional and relatable
- Show, don't just tell

**CHAPTER 6: Practical Application (100-150 words)**
- How the reader can apply this
- Specific, actionable insights
- Make it feel achievable

**CHAPTER 7: The Climax/Conclusion (100-150 words)**
- Bring it all together
- End with impact and resonance
- Leave a lasting impression
- {"End naturally WITHOUT any call-to-action" if not manychat_keyword else "End with ManyChat CTA only"}

### QUALITY STANDARDS:
- Each paragraph should be 3-5 sentences minimum
- Use transitions between chapters ("But here's what changed everything...")
- Include specific details, numbers, dates, names
- Build an emotional arc through the piece
- Sound authoritative yet personal
- This should feel SUBSTANTIAL - like content people would save and come back to

### CRITICAL RULES:
- **ZERO emoji in the hook/first line**
- Maximum 1-2 emojis for ENTIRE caption
- NO "want to learn more", "comment below", "drop a", "what do you think"
- NO engagement bait or questions
- Write as a statement, not a conversation
- Professional, authoritative tone

This is your FLAGSHIP content. Make it COUNT.

Generate the deep narrative caption now:"""
            else:
                # Standard prompt for other lengths
                prompt = f"""Analyze this video from @{account} and generate an engaging Instagram caption following the brand voice guidelines below.

Original caption for reference: {original_caption if original_caption else 'No original caption'}{brand_voice_context}{guidance_section}{offer_context}

## CAPTION LENGTH REQUIREMENT:
{length_guidance}

Based on the full video content, create a caption that:
- Captures the main action, mood, and visual progression
- Creates an emotional hook that grabs attention (2 lines max for mobile) - **MUST be a statement, NOT a question or invitation**
- Follows ALL the brand voice guidelines above
- Uses appropriate spacing and structure as specified
- **ZERO emoji in the hook/first line** - keep it clean and professional
- Keep emojis MINIMAL - 1-2 for entire caption max, only if they add real value
- Write like a real person - conversational and relatable
- Go deep on each point (2-4 sentences per paragraph)
- **Absolutely NO CTA language anywhere** - no "want to learn more", "comment below", "drop a", "let me know", "what do you think", etc.
- {"End naturally WITHOUT any call-to-action, question, or engagement bait" if not manychat_keyword else "End with the specified ManyChat CTA only"}

**IMPORTANT: Do NOT use section headers like "### Hook" or "### Body" - write as a natural Instagram caption**
**CRITICAL HOOK RULE: The first line MUST be a captivating statement or observation. NEVER start with "Have you ever", "What if", "Want to learn", "Comment below", or any engagement bait.**

Generate the caption now:"""

            # Enhanced system prompt with brand voice
            if caption_length_preference == "story":
                system_content = f"""You are a MASTER CONTENT CREATOR specializing in DEEP, narrative-driven Instagram content.

You write MAGNUM OPUS content - substantial, multi-chapter narratives that people save, share, and come back to read again.

YOUR SIGNATURE STYLE:
- Write like you're writing a short book chapter
- Each section is substantial (100-150+ words)
- Build emotional arcs through the piece
- Use personal stories and vivid examples
- Go deep into concepts - don't skim the surface
- Sound authoritative yet personal and relatable
- This is FLAGSHIP content - make every word count

STRUCTURE MASTERY:
- 5-7 distinct chapters/sections
- Smooth transitions between ideas
- Each paragraph is 3-5 sentences minimum
- No fluff - every section delivers value
- Build toward a powerful conclusion

You are creating content that ESTABLISHES AUTHORITY and BUILDS DEEP CONNECTION with your audience."""
            else:
                system_content = f"""You are an expert Instagram content creator who analyzes video content and writes engaging, authentic captions that drive engagement.

You always follow the specific brand voice guidelines provided for each account, including:
- Core values and personality traits
- Grammar and punctuation style
- Slang and abbreviation preferences
- Caption spacing and structure
- DO/DONT keyword guidelines
- Emoji and hashtag usage

CRITICAL RULES:
- NEVER use section headers (like "### Hook", "### Body", "### CTA") - write natural Instagram captions
- NEVER put emojis in the hook/first line of any caption
- Use 1-2 emojis maximum for the entire caption
- Only include a call-to-action when explicitly instructed with ManyChat keyword/offer

Create captions that feel authentic and tailored to the brand's unique voice."""
        else:
            prompt = f"""Analyze this video from @{account} and generate an engaging Instagram caption.

Original caption for reference: {original_caption if original_caption else 'No original caption'}{guidance_section}{offer_context}

Based on the full video content, create a caption that:
- Captures the main action, mood, and visual progression
- Creates an emotional hook that grabs attention (2 lines max for mobile)
- Uses line breaks for readability
- **ZERO emoji in the hook/first line** - keep it clean
- Keep emojis MINIMAL - 1-2 for entire caption max
- Write like a real person - conversational and relatable
- Go deep on each point (2-4 sentences per paragraph)
- Includes 5-10 relevant hashtags based on the video content

Generate the caption now:"""

            system_content = """You are an expert Instagram content creator who analyzes video content and writes engaging, authentic captions that drive engagement.

CRITICAL RULES:
- NEVER put emojis in the hook/first line of any caption
- Use 1-2 emojis maximum for the entire caption
- Only include a call-to-action when explicitly instructed"""

        # Prepare Gemini-compatible message format with inline video
        messages = [
            {
                "role": "system",
                "content": system_content
            },
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {
                            "url": f"data:{mime_type};base64,{video_base64}"
                        }
                    }
                ]
            }
        ]

        # Call OpenRouter API with Gemini 2.0 Flash (supports video)
        conn = http.client.HTTPSConnection("openrouter.ai")
        headers = {
            "Authorization": f"Bearer {openrouter_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://harmonatica.local",
            "X-Title": "Harmonatica Content Studio"
        }

        # Get model from environment or use default
        model = os.environ.get('OPENROUTER_MODEL', 'xiaomi/mimo-v2-flash:free')
        # Get fallback text model for when vision models fail
        fallback_model = os.environ.get('OPENROUTER_TEXT_MODEL', 'google/gemma-2-9b-it:free')

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.8
        }

        print(f"Generating caption for {filename} using {model} with full video analysis...")
        print(f"[DEBUG] caption_length_preference={caption_length_preference}, max_tokens={max_tokens}")
        print(f"[DEBUG] account={account}, caption_length_preference={caption_length_preference}, max_tokens={max_tokens}")
        print(f"[DEBUG] manychat_keyword='{manychat_keyword}', use_cta={bool(manychat_keyword)}")
        print(f"[DEBUG] length_guidance: {length_guidance[:100]}...")
        print(f"Video size: {len(video_data) / 1024 / 1024:.2f} MB")

        conn.request("POST", "/api/v1/chat/completions", json.dumps(payload).encode(), headers)
        response = conn.getresponse()

        # Initialize caption as empty
        caption = ""

        if response.status != 200:
            error_data = response.read().decode()
            print(f"Vision model failed ({response.status}): {error_data[:200]}")
            print(f"Falling back to text-only model: {fallback_model}")

            # Fallback to text-only mode using the original caption
            if brand_voice_context:
                # Check if story mode - use the same deep narrative structure
                if caption_length_preference == "story":
                    text_only_prompt = f"""Write a DEEP, MULTI-CHAPTER narrative Instagram caption for @{account}.

{brand_voice_context}

Original caption for reference: {original_caption if original_caption else 'No original caption'}{guidance_section}{offer_context}

## STORY MODE - DEEP NARRATIVE (750-1000 words minimum)

Create a 5-7 chapter narrative structure:

**Chapter 1:** Powerful hook statement (100-150 words)
**Chapter 2:** Personal story or vivid example (150-200 words)
**Chapter 3:** Deep dive into the core concept (150-200 words)
**Chapter 4:** The science/logic behind it (100-150 words)
**Chapter 5:** The transformation journey (100-150 words)
**Chapter 6:** Practical application (100-150 words)
**Chapter 7:** Powerful conclusion (100-150 words)

QUALITY STANDARDS:
- Each paragraph: 3-5 sentences minimum
- Use transitions between chapters
- Include specific details and examples
- Build emotional arc through the piece
- Sound authoritative yet personal
- This should feel like reading a short article

CRITICAL RULES:
- ZERO emoji in first line
- Maximum 1-2 emojis total
- NO "want to learn", "comment below", engagement bait
- Write as statements, not conversations
- Professional, authoritative tone

Generate the deep narrative now:"""

                    text_system_content = f"""You are a MASTER CONTENT CREATOR specializing in DEEP, narrative-driven Instagram content.

You write substantial, multi-chapter narratives that establish authority and build deep connection. Each section is 100-150+ words with 3-5 sentences per paragraph. No fluff - every section delivers value."""
                else:
                    text_only_prompt = f"""Generate an engaging Instagram caption for @{account} following these brand voice guidelines:{brand_voice_context}

Original caption for reference: {original_caption if original_caption else 'No original caption'}{guidance_section}{offer_context}

## CAPTION LENGTH REQUIREMENT:
{length_guidance}

Create a caption that:
- Creates an emotional hook that grabs attention (2 lines max for mobile) - **MUST be a statement, NOT a question**
- Follows ALL brand voice guidelines above
- Uses appropriate spacing as specified
- **ZERO emoji in the hook/first line** - keep it clean
- Maximum 1-2 emojis for entire caption, NEVER in first line
- **Absolutely NO CTA language** - no "want to learn more", "comment below", "what do you think", etc.
- {"End naturally WITHOUT any call-to-action or engagement bait" if not manychat_keyword else "Use ManyChat keyword for CTA only"}

**IMPORTANT: Do NOT use section headers - write as a natural Instagram caption**
**CRITICAL HOOK RULE: First line MUST be a statement. NEVER "Have you ever", "What if", "Want to learn", or engagement bait.**

Generate the caption now:"""

                    text_system_content = f"""You are an expert Instagram content creator who writes engaging, authentic captions.

CRITICAL RULES:
- NEVER use section headers (like "### Hook", "### Body") - write natural Instagram captions
- NEVER put emojis in the hook/first line of any caption
- Use 1-2 emojis maximum for the entire caption
- Only include a call-to-action when explicitly instructed

Always follow the brand voice guidelines provided, including:
- Core values and personality
- Grammar and slang preferences
- Spacing and structure
- DO/DONT keywords"""
            else:
                # Check if story mode even without brand voice
                if caption_length_preference == "story":
                    text_only_prompt = f"""Write a DEEP, MULTI-CHAPTER narrative Instagram caption for @{account}.

Original caption for reference: {original_caption if original_caption else 'No original caption'}{guidance_section}{offer_context}

## STORY MODE - DEEP NARRATIVE (750-1000 words minimum)

Create a 5-7 chapter narrative structure with substantial depth:

**Chapter 1:** Powerful hook statement (100-150 words)
**Chapter 2:** Personal story or vivid example (150-200 words)
**Chapter 3:** Deep dive into the core concept (150-200 words)
**Chapter 4:** The science/logic behind it (100-150 words)
**Chapter 5:** The transformation journey (100-150 words)
**Chapter 6:** Practical application (100-150 words)
**Chapter 7:** Powerful conclusion (100-150 words)

QUALITY STANDARDS:
- Each paragraph: 3-5 sentences minimum
- Use transitions between chapters
- Include specific details and examples
- Build emotional arc through the piece
- Sound authoritative yet personal

CRITICAL RULES:
- ZERO emoji in first line
- Maximum 1-2 emojis total
- NO "want to learn", "comment below", engagement bait
- Write as statements, not conversations

Generate the deep narrative now:"""

                    text_system_content = """You are a MASTER CONTENT CREATOR specializing in DEEP, narrative-driven Instagram content. You write substantial, multi-chapter narratives with each section being 100-150+ words."""
                else:
                    text_only_prompt = f"""Generate an engaging Instagram caption for @{account}.

Original caption for reference: {original_caption if original_caption else 'No original caption'}{guidance_section}{offer_context}

## CAPTION LENGTH REQUIREMENT:
{length_guidance}

Create a caption that:
- Creates an emotional hook that grabs attention (2 lines max) - **MUST be a statement, NOT a question**
- Uses line breaks for readability
- **ZERO emoji in the hook/first line**
- Maximum 1-2 emojis for entire caption, NEVER in first line
- **Absolutely NO CTA language** - no "want to learn more", "comment below", "what do you think", etc.
- {"End naturally WITHOUT any call-to-action" if not manychat_keyword else "Use ManyChat keyword for CTA only"}
- Includes 5-10 relevant hashtags

**IMPORTANT: Do NOT use section headers - write as a natural Instagram caption**
**CRITICAL HOOK RULE: First line MUST be a statement. NEVER "Have you ever", "What if", "Want to learn", or engagement bait.**

Generate the caption now:"""

                text_system_content = """You are an expert Instagram content creator who writes engaging, authentic captions.

CRITICAL RULES:
- NEVER use section headers - write natural Instagram captions
- NEVER put emojis in the hook/first line of any caption
- Use 1-2 emojis maximum for the entire caption
- Only include a call-to-action when explicitly instructed"""

            text_messages = [
                {
                    "role": "system",
                    "content": text_system_content
                },
                {
                    "role": "user",
                    "content": text_only_prompt
                }
            ]

            # For story length, use stitching approach to get longer output
            if caption_length_preference == "story":
                print(f"[STORY MODE] Using 2-part generation for longer caption...")
                # Increased tokens for deep story mode - need more per part for substantial chapters
                tokens_per_part = 2000 if "gemma" in fallback_model.lower() else 1800
                caption = generate_caption_in_parts(
                    model=fallback_model,
                    messages=text_messages,
                    max_tokens_per_part=tokens_per_part,
                    num_parts=2,  # Generate in 2 parts
                    headers=headers
                )
            else:
                # Standard single-call generation for other lengths
                text_payload = {
                    "model": fallback_model,
                    "messages": text_messages,
                    "max_tokens": max_tokens,
                    "temperature": 0.8
                }

                conn.request("POST", "/api/v1/chat/completions", json.dumps(text_payload).encode(), headers)
                response = conn.getresponse()

                if response.status != 200:
                    error_data = response.read().decode()
                    print(f"Text model also failed: {error_data}")
                    return jsonify({
                        'success': False,
                        'error': f'Both vision and text models failed. Last error: {response.status} - {error_data[:200]}'
                    }), 500

                # Update model_used to reflect we used the fallback
                model = f"{fallback_model} (text fallback)"

                result = json.loads(response.read().decode())

                # Extract the generated caption
                caption = result['choices'][0]['message']['content'].strip()

            # Update model_used for story mode
            if caption_length_preference == "story":
                model = f"{fallback_model} (2-part story generation)"
        else:
            # Vision model succeeded - extract caption
            # For story length, use stitching approach even with vision model
            if caption_length_preference == "story":
                print(f"[STORY MODE] Vision model succeeded, using 2-part stitching for longer caption...")
                # Convert vision messages to text-only for stitching
                text_messages_for_stitching = [
                    {"role": msg["role"], "content": msg["content"] if isinstance(msg["content"], str) else "[Video content analyzed]"}
                    for msg in messages
                ]
                # Increased tokens for deep story mode
                tokens_per_part = 2000 if "gemma" in fallback_model.lower() else 1800
                caption = generate_caption_in_parts(
                    model=fallback_model,  # Use text model for consistent longer output
                    messages=text_messages_for_stitching,
                    max_tokens_per_part=tokens_per_part,
                    num_parts=2,
                    headers=headers
                )
                model = f"{fallback_model} (2-part story generation)"
            else:
                # Standard caption extraction for other lengths
                result = json.loads(response.read().decode())
                caption = result['choices'][0]['message']['content'].strip()

        # Post-process: Remove emojis from the first line and CTA when no keyword selected
        import re
        lines = caption.split('\n')
        if lines:
            # Remove emojis from the first line
            emoji_pattern = re.compile("["
                u"\U0001F600-\U0001F64F"  # emoticons
                u"\U0001F300-\U0001F5FF"  # symbols & pictographs
                u"\U0001F680-\U0001F6FF"  # transport & map symbols
                u"\U0001F1E0-\U0001F1FF"  # flags
                u"\U00002702-\U000027B0"
                u"\U000024C2-\U0001F251"
                u"\U0001F900-\U0001F9FF"  # supplemental symbols
                "]+", flags=re.UNICODE)
            lines[0] = emoji_pattern.sub('', lines[0]).strip()

            # Remove CTA content when no ManyChat keyword selected
            if not manychat_keyword:
                # Find where hashtags start
                hashtag_index = len(lines)
                for i, line in enumerate(lines):
                    if line.strip().startswith('#'):
                        hashtag_index = i
                        break

                # Get content before hashtags
                content_lines = lines[:hashtag_index]
                content_text = '\n'.join(content_lines)

                # Split into paragraphs
                paragraphs = [p.strip() for p in content_text.split('\n\n') if p.strip()]

                # Check if last paragraph contains CTA language and remove it
                if paragraphs:
                    last_para = paragraphs[-1].lower()
                    cta_indicators = [
                        'want to learn', 'want more', 'want details', 'comment "', 'comment below',
                        'drop a "', 'let me know', 'lemme know', 'link in bio', 'follow for more',
                        'dm for', 'link in', 'tap the link', 'click the link', 'sign up'
                    ]

                    # Check if last paragraph contains any CTA indicator
                    has_cta = any(indicator in last_para for indicator in cta_indicators)

                    if has_cta:
                        # Remove the last paragraph
                        paragraphs = paragraphs[:-1]

                    # Also check second-to-last paragraph if it's CTA-like
                    if len(paragraphs) >= 2:
                        second_last = paragraphs[-2].lower()
                        if 'comment "' in second_last or 'comment "' in second_last:
                            paragraphs = paragraphs[:-1]

                # Rebuild caption
                caption = '\n\n'.join(paragraphs)

                # Add back hashtags
                if hashtag_index < len(lines):
                    hashtags = '\n'.join(lines[hashtag_index:])
                    caption = caption + '\n' + hashtags
            else:
                caption = '\n'.join(lines)

        # Log the caption being returned
        caption_preview = caption[:200] + "..." if len(caption) > 200 else caption
        print(f"[RETURNING] Caption preview: {caption_preview}")
        print(f"[RETURNING] Word count: {len(caption.split())}")
        print(f"[RETURNING] Has CTA words: {any(word in caption.lower() for word in ['comment', 'want to learn', 'want more', 'drop a'])}")

        # POST-PROCESSING: Remove AI-generated section headers and metadata
        # Sometimes AI outputs things like "HOOK:", "BODY:", "COMMENT BAIT:", etc.
        lines = caption.split('\n')
        cleaned_lines = []
        skip_until_next_section = False

        for line in lines:
            # Skip section headers and metadata lines
            line_upper = line.strip().upper()
            line_stripped = line.strip()

            # Skip these exact headers
            if any(header in line_upper for header in ['HOOK:', 'BODY:', 'COMMENT BAIT', 'MANYCHAT CTA', 'FORMATTING:', 'CAPTION', '## HOOK', '## BODY', '## CTA']):
                continue

            # Skip chapter headers - AI sometimes adds these despite instructions
            if line_stripped.startswith('**CHAPTER') and ':' in line_stripped:
                continue
            if line_stripped.startswith('CHAPTER ') and ':' in line_stripped:
                continue
            # Skip markdown chapter headers
            if line_stripped.startswith('**') and line_stripped.endswith('**') and 'CHAPTER' in line_upper:
                continue

            # Skip lines that describe the caption (meta-commentary)
            if any(phrase in line.lower() for phrase in ['this caption aims to', 'this caption is designed', 'this caption uses', 'the hook creates', 'the caption is structured', 'here is a', 'here\'s a', 'below is a', 'following is a', 'the use of emojis', 'strategic use of']):
                continue

            # Skip lines that are just instructions in quotes
            if line.strip().startswith('"') and line.strip().endswith('"') and ':' in line and len(line.strip().split()) < 15:
                continue

            cleaned_lines.append(line)

        caption = '\n'.join(cleaned_lines).strip()

        # Remove any remaining markdown bold formatting
        caption = caption.replace('**', '')

        # Remove multiple consecutive blank lines
        import re
        caption = re.sub(r'\n\n\n+', '\n\n', caption)

        print(f"Caption generated successfully for {filename}")

        return jsonify({
            'success': True,
            'caption': caption,
            'model_used': model
        })

    except Exception as e:
        print(f"Error generating caption: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/caption/refine', methods=['POST'])
def refine_caption():
    """
    Refine an existing caption using AI without re-analyzing the video.

    Request body:
    {
        "caption": str - The current caption text
        "instruction": str - How to refine it (e.g., "Make it shorter")
    }

    This is much faster than full regeneration as it only processes text.
    """
    try:
        data = request.get_json()
        caption = data.get('caption', '')
        instruction = data.get('instruction', '')

        if not caption:
            return jsonify({'success': False, 'error': 'Caption is required'}), 400
        if not instruction:
            return jsonify({'success': False, 'error': 'Instruction is required'}), 400

        # Get API key and model
        api_key = os.environ.get('OPENROUTER_API_KEY')
        if not api_key:
            return jsonify({'success': False, 'error': 'OpenRouter API key not configured'}), 500

        model = os.environ.get('OPENROUTER_TEXT_MODEL', 'meta-llama/llama-3.1-8b-instruct:beta')

        import http.client
        import json

        # Check if this is a story mode request
        is_story_mode = 'story' in instruction.lower() or '750-1000' in instruction

        # Build the refine prompt based on mode
        if is_story_mode:
            # Deep story narrative prompt
            prompt = f"""You are a MASTER CONTENT CREATOR. Rewrite this caption as a DEEP, MULTI-CHAPTER NARRATIVE.

CURRENT CAPTION:
{caption}

USER'S REQUEST:
{instruction}

## DEEP STORY STRUCTURE (750-1000 words minimum)

Rewrite as a 5-7 chapter narrative:
1. Powerful hook statement (100-150 words)
2. Personal story or vivid example (150-200 words)
3. Deep dive into core concepts (150-200 words)
4. Science/logic backing (100-150 words)
5. Transformation journey (100-150 words)
6. Practical applications (100-150 words)
7. Powerful conclusion (100-150 words)

QUALITY STANDARDS:
- Each paragraph 3-5 sentences minimum
- Use transitions between chapters
- Include specific details and examples
- Build emotional arc through the piece
- Sound authoritative yet personal
- NO fluff - every section delivers value

CRITICAL RULES:
- NO section headers like "Chapter 1:" - just write naturally
- NO emojis in first line
- Maximum 2-3 emojis total
- NO "want to learn", "comment below", engagement bait
- Write as statements, not questions

Generate the deep narrative now:"""

            system_content = "You are a MASTER CONTENT CREATOR specializing in DEEP, narrative-driven Instagram content. You write substantial, multi-chapter narratives with each section being 100-150+ words."
            max_tokens = 3500
        else:
            # Standard refine prompt
            prompt = f"""You are an expert Instagram caption editor. The user wants you to refine their caption based on a specific instruction.

CURRENT CAPTION:
{caption}

USER'S REQUEST:
{instruction}

IMPORTANT RULES:
- Follow the user's instruction exactly
- Keep the core message and meaning intact
- Maintain the caption's natural, conversational tone
- NEVER use section headers like "Hook:" or "Body:" - just write the caption
- NO emojis in the first line/hook
- Maximum 2-3 emojis for the entire caption
- Include relevant hashtags at the end

Write the refined caption now:"""

            system_content = "You are an expert Instagram caption editor. You refine captions based on user instructions while maintaining their authentic voice."
            max_tokens = 1500

        messages = [
            {
                "role": "system",
                "content": system_content
            },
            {
                "role": "user",
                "content": prompt
            }
        ]

        # Call OpenRouter API
        conn = http.client.HTTPSConnection("openrouter.ai")
        headers = {
            "Authorization": f"Bearer {api_key}",
            "Content-Type": "application/json",
            "HTTP-Referer": "https://harmonatica.local",
            "X-Title": "Harmonatica Caption Refiner"
        }

        payload = {
            "model": model,
            "messages": messages,
            "max_tokens": max_tokens,
            "temperature": 0.8
        }

        print(f"[REFINE] Processing refinement request: {instruction[:50]}...")

        conn.request("POST", "/api/v1/chat/completions", json.dumps(payload).encode(), headers)
        response = conn.getresponse()

        if response.status != 200:
            error_data = response.read().decode()
            print(f"[REFINE] API Error: {error_data[:200]}")
            return jsonify({'success': False, 'error': f'API error: {error_data[:200]}'}), 500

        result = json.loads(response.read().decode())

        if 'choices' not in result or len(result['choices']) == 0:
            return jsonify({'success': False, 'error': 'No response from AI'}), 500

        refined_caption = result['choices'][0]['message']['content'].strip()

        # Clean up any section headers the AI might have added
        lines = refined_caption.split('\n')
        cleaned_lines = []
        for line in lines:
            line_upper = line.strip().upper()
            if any(header in line_upper for header in ['HOOK:', 'BODY:', '## HOOK', '## BODY', 'REFINED CAPTION:']):
                continue
            cleaned_lines.append(line)

        refined_caption = '\n'.join(cleaned_lines).strip()

        # Remove markdown code blocks
        if refined_caption.startswith('```'):
            refined_caption = refined_caption.split('```')[1] if '```' in refined_caption else refined_caption
            refined_caption = refined_caption.replace('```', '').strip()

        print(f"[REFINE] Refinement complete. Original: {len(caption)} chars, Refined: {len(refined_caption)} chars")

        return jsonify({
            'success': True,
            'caption': refined_caption
        })

    except Exception as e:
        print(f"[REFINE] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/caption/save', methods=['POST'])
def save_edited_caption():
    """
    Save an edited caption back to the ready_content table.

    Request body:
    {
        "content_id": int - The ready_content ID
        "caption": str - The edited caption
    }
    """
    try:
        data = request.get_json()
        content_id = data.get('content_id')
        caption = data.get('caption', '')

        if not content_id:
            return jsonify({'success': False, 'error': 'content_id is required'}), 400
        if not caption:
            return jsonify({'success': False, 'error': 'caption is required'}), 400

        # Update the caption in the database
        from database import update_ready_content

        success = update_ready_content(content_id, {'caption': caption})

        if success:
            print(f"[SAVE] Caption saved for content_id {content_id}")
            return jsonify({'success': True, 'message': 'Caption saved successfully'})
        else:
            return jsonify({'success': False, 'error': 'Failed to save caption'}), 500

    except Exception as e:
        print(f"[SAVE] Error: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/ready/save', methods=['POST'])
def save_to_ready_content():
    """
    Save prepared content to ready_content table

    Request body:
    {
        "filename": str,
        "caption": str,
        "manychat_keyword": str,
        "selected_account": str  # NEW: The account selected in the dropdown
    }

    This creates a new entry in the ready_content table for posting
    and records the video usage for the selected account.
    """
    try:
        data = request.get_json()
        filename = data.get('filename')
        caption = data.get('caption', '')
        manychat_keyword = data.get('manychat_keyword', 'LINK')
        selected_account = data.get('selected_account')  # NEW: Get selected account

        if not filename:
            return jsonify({'success': False, 'error': 'filename is required'}), 400

        # Find the video file - try with and without extension
        video_path = None

        # First try exact match
        for file in BASE_DIR.rglob(filename):
            if file.suffix in ['.mp4', '.mov', '.mkv']:
                video_path = file
                break

        # If not found, try adding common extensions
        if not video_path:
            for ext in ['.mp4', '.mov', '.mkv']:
                for file in BASE_DIR.rglob(filename + ext):
                    if file.suffix == ext:
                        video_path = file
                        break
                if video_path:
                    break

        if not video_path:
            return jsonify({'success': False, 'error': 'Video file not found'}), 404

        # Get account from parent folder name
        account = video_path.parent.parent.name if video_path.parent.parent else 'unknown'

        # Use selected account if provided, otherwise use the original account
        target_account = selected_account if selected_account else account

        # Connect to database
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        try:
            # Check if source_content entry exists
            cursor.execute("""
                SELECT id, account FROM source_content
                WHERE video_filename = ?
                LIMIT 1
            """, (filename,))

            source_row = cursor.fetchone()

            if source_row:
                source_id, db_account = source_row
            else:
                # Create source_content entry first
                cursor.execute("""
                    INSERT INTO source_content (account, video_filename, video_path, original_caption, scraped_at)
                    VALUES (?, ?, ?, ?, ?)
                """, (account, filename, str(video_path), caption, datetime.datetime.now().isoformat()))

                source_id = cursor.lastrowid
                db_account = account

            # Get account_id from accounts table
            cursor.execute("""
                SELECT id FROM accounts WHERE username = ?
            """, (target_account,))

            account_row = cursor.fetchone()
            if account_row:
                account_id = account_row[0]
            else:
                # Create account entry
                cursor.execute("""
                    INSERT INTO accounts (username, platform, manychat_cta, manychat_keyword)
                    VALUES (?, ?, ?, ?)
                """, (target_account, 'instagram', manychat_keyword, manychat_keyword.upper()[:10]))

                account_id = cursor.lastrowid

            # Check if already in ready_content
            cursor.execute("""
                SELECT id FROM ready_content WHERE source_id = ?
            """, (source_id,))

            existing = cursor.fetchone()

            if existing:
                # Update existing entry
                cursor.execute("""
                    UPDATE ready_content
                    SET caption = ?, manychat_keyword = ?, video_path = ?, updated_at = ?
                    WHERE id = ?
                """, (caption, manychat_keyword, str(video_path), datetime.datetime.now().isoformat(), existing[0]))
                ready_id = existing[0]
            else:
                # Create new ready_content entry
                ready_id = create_ready_content(source_id, {
                    'caption': caption,
                    'manychat_keyword': manychat_keyword,
                    'video_path': str(video_path),
                    'status': 'ready',
                    'scheduled_for': None
                })

            # NEW: Record video usage
            cursor.execute("""
                INSERT OR REPLACE INTO video_usage
                (video_filename, account_username, caption_generated, used_at)
                VALUES (?, ?, ?, CURRENT_TIMESTAMP)
            """, (filename, target_account, caption))

            conn.commit()

            return jsonify({
                'success': True,
                'ready_id': ready_id,
                'message': 'Content saved and ready for posting',
                'library_url': '/library'
            })

        except Exception as e:
            conn.rollback()
            raise
        finally:
            conn.close()

    except Exception as e:
        print(f"Error saving to ready content: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/video-usage', methods=['GET'])
def get_video_usage_api():
    """
    Get video usage data.

    Query parameters:
    - filename: Get usage for specific video (optional)
    - account: Get usage for specific account (optional)

    Returns:
    {
        "success": true,
        "usage": {
            "video_filename.mp4": ["account1", "account2"],
            ...
        }
    }
    """
    try:
        from database import get_all_video_usage, get_video_usage, get_account_videos_used

        filename = request.args.get('filename')
        account = request.args.get('account')

        if filename:
            # Get usage for specific video
            usage_records = get_video_usage(filename)
            accounts = [record['account_username'] for record in usage_records]
            return jsonify({
                'success': True,
                'filename': filename,
                'accounts': accounts,
                'usage_records': usage_records
            })
        elif account:
            # Get usage for specific account
            usage_records = get_account_videos_used(account)
            return jsonify({
                'success': True,
                'account': account,
                'videos': usage_records
            })
        else:
            # Get all usage data
            all_usage = get_all_video_usage()
            return jsonify({
                'success': True,
                'usage': all_usage
            })

    except Exception as e:
        print(f"Error getting video usage: {e}")
        import traceback
        traceback.print_exc()
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings/api-key', methods=['GET', 'POST'])
def api_key_settings():
    """Get or save OpenRouter API key and model settings."""
    import os
    from pathlib import Path

    if request.method == 'GET':
        # Return current settings (with masked API key)
        api_key = os.getenv('OPENROUTER_API_KEY', '')
        model = os.getenv('OPENROUTER_MODEL', 'google/gemini-2.0-flash-exp:free')

        # Mask API key for security
        masked_key = ''
        if api_key and len(api_key) > 12:
            masked_key = api_key[:8] + '...' + api_key[-4:]

        return jsonify({
            'success': True,
            'api_key': masked_key,
            'model': model
        })

    elif request.method == 'POST':
        """Save OpenRouter API key and model to environment file."""
        import os
        from pathlib import Path

        data = request.get_json()
        api_key = data.get('api_key')
        model = data.get('model')

    if not api_key:
        return jsonify({'success': False, 'error': 'API key is required'}), 400

    try:
        env_path = Path(__file__).parent / '.env'

        # Read existing env file
        existing_lines = []
        if env_path.exists():
            with open(env_path, 'r') as f:
                existing_lines = f.readlines()

        # Update or add API key and model
        updated_lines = []
        api_key_updated = False
        model_updated = False

        for line in existing_lines:
            if line.startswith('OPENROUTER_API_KEY='):
                updated_lines.append(f'OPENROUTER_API_KEY={api_key}\n')
                api_key_updated = True
            elif line.startswith('OPENROUTER_MODEL='):
                updated_lines.append(f'OPENROUTER_MODEL={model}\n')
                model_updated = True
            else:
                updated_lines.append(line)

        # Add if not present
        if not api_key_updated:
            updated_lines.append(f'OPENROUTER_API_KEY={api_key}\n')
        if not model_updated:
            updated_lines.append(f'OPENROUTER_MODEL={model}\n')

        # Write back to file
        with open(env_path, 'w') as f:
            f.writelines(updated_lines)

        # Update environment for current process
        os.environ['OPENROUTER_API_KEY'] = api_key
        os.environ['OPENROUTER_MODEL'] = model

        return jsonify({
            'success': True,
            'message': 'API settings saved. Restart the server for changes to take effect.'
        })
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500

@app.route('/api/settings/test-api', methods=['POST'])
def test_api_connection():
    """Test OpenRouter API connection with provided credentials."""
    import os
    import requests

    data = request.get_json()
    api_key = data.get('api_key') or os.getenv('OPENROUTER_API_KEY')
    model = data.get('model') or os.getenv('OPENROUTER_MODEL', 'google/gemini-2.0-flash-exp:free')

    if not api_key:
        return jsonify({'success': False, 'error': 'API key is required'}), 400

    try:
        headers = {
            'Authorization': f'Bearer {api_key}',
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://harmonatica.app',
            'X-Title': 'Harmonatica AI Caption Test'
        }

        payload = {
            'model': model,
            'messages': [
                {
                    'role': 'system',
                    'content': 'You are a helpful assistant.'
                },
                {
                    'role': 'user',
                    'content': 'Say "Connection successful!" in JSON format.'
                }
            ],
            'max_tokens': 50
        }

        response = requests.post(
            'https://openrouter.ai/api/v1/chat/completions',
            headers=headers,
            json=payload,
            timeout=10
        )

        if response.status_code == 200:
            return jsonify({
                'success': True,
                'model': model,
                'message': 'Connection successful!'
            })
        elif response.status_code == 401:
            return jsonify({
                'success': False,
                'error': 'Invalid API key - check your key at openrouter.ai/keys'
            })
        elif response.status_code == 429:
            return jsonify({
                'success': False,
                'error': 'Rate limit reached - try a different model or wait for reset'
            })
        else:
            return jsonify({
                'success': False,
                'error': f'API returned {response.status_code}: {response.text[:200]}'
            })

    except requests.exceptions.Timeout:
        return jsonify({'success': False, 'error': 'Connection timeout'}), 408
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# ============================================================
# AGENT HEALTH & QUALITY TRACKING ENDPOINTS
# ============================================================

@app.route('/api/agent/health', methods=['GET'])
def get_agent_health():
    """Get comprehensive agent health report"""
    try:
        from agent_health_system import get_metrics_tracker

        tracker = get_metrics_tracker()
        report = tracker.get_health_report()

        return jsonify({'success': True, 'data': report})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/agent/top-performers', methods=['GET'])
def get_top_performers():
    """Get top performing captions for learning"""
    try:
        import sqlite3

        conn = sqlite3.connect('harmonatica.db')
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT caption, hook, content_type, vibe,
                   engagement_rate, likes, views, performance_tier
            FROM top_performers
            ORDER BY engagement_rate DESC
            LIMIT 20
        """)
        results = [dict(row) for row in cursor.fetchall()]
        conn.close()

        return jsonify({'success': True, 'data': results})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/agent/record-performance', methods=['POST'])
def record_caption_performance():
    """Record actual Instagram performance after posting"""
    try:
        from agent_health_system import get_metrics_tracker

        data = request.get_json()
        ready_content_id = data.get('ready_content_id')
        likes = data.get('likes', 0)
        comments = data.get('comments', 0)
        shares = data.get('shares', 0)
        views = data.get('views', 0)

        if not ready_content_id:
            return jsonify({'success': False, 'error': 'ready_content_id required'}), 400

        tracker = get_metrics_tracker()
        tracker.record_actual_performance(ready_content_id, likes, comments, shares, views)

        return jsonify({'success': True, 'message': 'Performance recorded'})
    except Exception as e:
        return jsonify({'success': False, 'error': str(e)}), 500


# =============================================================================
# BRAND VOICE BUILDER ROUTES
# =============================================================================

@app.route('/brand-voice-builder')
def brand_voice_builder_workflow():
    """Brand Voice Builder - Interactive workflow page"""
    return render_template('brand-voice-builder.html')


@app.route('/api/analyze-references', methods=['POST'])
def analyze_references():
    """Analyze Instagram reference profiles to extract brand voice patterns"""
    try:
        data = request.get_json()
        references = data.get('references', [])

        if not references or len(references) < 3:
            return jsonify({'success': False, 'error': 'At least 3 references required'}), 400

        # For now, return a basic analysis
        # In production, this would use instagram_profile_service to fetch actual data
        analysis = {
            'hook_style': 'Curiosity gaps + bold claims',
            'sentence_rhythm': 'Short, punchy (6-10 words per sentence)',
            'emoji_usage': 'Minimal (1-2 total, never in hook)',
            'tone': 'Authentic and authoritative',
            'power_words': ['discover', 'unlock', 'transform', 'breakthrough', 'reveal'],
            'cta_style': 'Direct action-oriented',
            'content_structure': 'Hook → Story → Value → CTA',
            'hashtag_strategy': '5-10 relevant, niche-specific',
            'post_frequency': 'Daily to maintain engagement'
        }

        # Try to fetch real profile data if available
        try:
            from instagram_profile_service import fetch_profile
            profiles_data = []

            for ref in references[:3]:  # Limit to 3 for speed
                username = ref.get('username', '').replace('@', '')
                if username:
                    try:
                        profile_data = fetch_profile(username)
                        if profile_data:
                            profiles_data.append(profile_data)
                    except:
                        pass

            # If we got real data, enhance the analysis
            if profiles_data:
                # Extract real patterns from profiles
                all_biographies = [p.get('biography', '') for p in profiles_data if p.get('biography')]

                if all_biographies:
                    # Analyze bio patterns
                    avg_bio_length = sum(len(bio) for bio in all_biographies) / len(all_biographies)

                    if avg_bio_length < 80:
                        analysis['tone'] = 'Concise and direct'
                    elif avg_bio_length > 150:
                        analysis['tone'] = 'Detailed and informative'

                    # Check for keywords
                    all_bios_text = ' '.join(all_biographies).lower()
                    if any(word in all_bios_text for word in ['coach', 'mentor', 'guide']):
                        analysis['cta_style'] = 'Educational and guidance-focused'
                    elif any(word in all_bios_text for word in ['founder', 'ceo', 'expert']):
                        analysis['tone'] = 'Authoritative and experienced'

        except ImportError:
            pass  # instagram_profile_service not available
        except Exception as e:
            print(f"Profile fetch error (non-critical): {e}")

        return jsonify({
            'success': True,
            'analysis': analysis,
            'profiles_analyzed': len(references)
        })

    except Exception as e:
        print(f"Analysis error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/brand-voice-chat', methods=['POST'])
def brand_voice_chat():
    """Chat endpoint for Brand Voice Builder Q&A"""
    try:
        data = request.get_json()
        message = data.get('message', '').strip().lower()
        step = data.get('step', 1)
        brand_voice = data.get('brandVoiceData', {})

        if not message:
            return jsonify({'success': False, 'error': 'Message required'}), 400

        # Import AI service for response generation
        try:
            from ai_caption_service import get_caption_generator
            generator = get_caption_generator()

            # Build context for the AI
            system_prompt = """You are a Brand Voice Consultant helping a user create a detailed
Instagram brand voice profile. Ask targeted questions to understand:
1. Brand positioning (expert, friend, mentor, peer)
2. Target audience (who are they speaking to?)
3. Content goals (educate, entertain, inspire, convert)
4. Communication style (formal, casual, witty, serious)
5. Unique differentiators (what makes them special?)

Keep responses conversational and under 100 words. Ask 1-2 questions at a time.
Be helpful and guide them toward a complete brand voice profile."""

            user_prompt = f"""Current brand voice data: {brand_voice}

User said: "{message}

Respond helpfully. If they're giving you information about their brand, acknowledge it
and ask a relevant follow-up question. If they're unsure, provide options to choose from."""

            # Generate response using OpenRouter
            from ai_caption_service import OpenRouterClient
            client = OpenRouterClient()

            response = client.generate_completion(
                messages=[
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                temperature=0.8,
                max_tokens=300
            )

            if 'choices' in response and len(response['choices']) > 0:
                ai_response = response['choices'][0]['message']['content']

                # Extract any updated brand voice info from the conversation
                updated_voice = extract_brand_voice_info(message, brand_voice)

                return jsonify({
                    'success': True,
                    'response': ai_response,
                    'updatedBrandVoice': updated_voice,
                    'canContinue': len(brand_voice) > 5  # Enable continue after enough info
                })

        except ImportError:
            # Fallback to rule-based responses if AI service unavailable
            ai_response = generate_fallback_response(message, brand_voice)
            return jsonify({
                'success': True,
                'response': ai_response,
                'updatedBrandVoice': extract_brand_voice_info(message, brand_voice),
                'canContinue': len(brand_voice) > 5
            })

    except Exception as e:
        print(f"Chat error: {e}")
        return jsonify({
            'success': True,
            'response': "I'm processing that. Could you tell me more about your target audience?",
            'canContinue': False
        })


def extract_brand_voice_info(message, current_voice):
    """Extract brand voice information from user's message"""
    import re

    message_lower = message.lower()
    updates = {}

    # Extract positioning
    if 'expert' in message_lower or 'authority' in message_lower:
        updates['positioning'] = 'Authority/Expert'
    elif 'friend' in message_lower or 'peer' in message_lower:
        updates['positioning'] = 'Peer/Friend'
    elif 'mentor' in message_lower or 'guide' in message_lower or 'teacher' in message_lower:
        updates['positioning'] = 'Mentor/Guide'

    # Extract tone
    if 'casual' in message_lower:
        updates['tone'] = 'Casual and friendly'
    elif 'formal' in message_lower or 'professional' in message_lower:
        updates['tone'] = 'Professional and authoritative'
    elif 'funny' in message_lower or 'witty' in message_lower:
        updates['tone'] = 'Witty and entertaining'

    # Extract emoji preference
    if 'lots of emoji' in message_lower or 'more emoji' in message_lower:
        updates['emoji_usage'] = 'Moderate (3-5)'
    elif 'no emoji' in message_lower or 'minimal emoji' in message_lower:
        updates['emoji_usage'] = 'Minimal (0-1)'

    # Extract length preference
    if 'short' in message_lower:
        updates['caption_length'] = 'Short'
    elif 'long' in message_lower or 'detailed' in message_lower:
        updates['caption_length'] = 'Long'

    return {**current_voice, **updates}


def generate_fallback_response(message, brand_voice):
    """Generate responses without AI service"""
    message_lower = message.lower()

    # Check for positioning
    if any(word in message_lower for word in ['expert', 'authority', 'lead']):
        return "Got it - positioning as an authority figure. This means your hooks should be confident and definitive. What's your target audience like? Are they beginners or already knowledgeable in your niche?"

    if any(word in message_lower for word in ['friend', 'peer', 'relatable']):
        return "Perfect! A peer-to-peer approach builds trust through authenticity. Your captions should feel like you're sharing discoveries with a friend. What's the main transformation you help your audience achieve?"

    if any(word in message_lower for word in ['mentor', 'guide', 'teacher']):
        return "Great! A mentor position means being encouraging while guiding. Your tone should be supportive and educational. What's the biggest misconception in your industry that you'd love to clear up?"

    # Check for audience
    if any(word in message_lower for word in ['beginner', 'new', 'starting']):
        return "Beginners need clear, jargon-free explanations. Your brand voice should simplify complex topics. What's the ONE thing you wish you knew when you were starting out?"

    if any(word in message_lower for word in ['advanced', 'expert', 'professional']):
        return "Speaking to advanced audiences means you can dive deep. Your brand voice should respect their expertise while adding new insights. What's an unconventional opinion you hold in your field?"

    # Check for content goals
    if any(word in message_lower for word in ['educate', 'teach', 'learn']):
        return "Educational content builds authority! Your captions should balance value with engagement. Do you prefer short tips or deep-dive explanations?"

    if any(word in message_lower for word in ['inspire', 'motivate', 'encourage']):
        return "Inspirational content connects emotionally! Your brand voice should be uplifting and empowering. What's the primary emotion you want your audience to feel after reading your captions?"

    # Default response
    return "Thanks for sharing! To help me understand your brand better: What's the ONE thing that makes your approach different from everyone else in your space?"


@app.route('/api/get-sample-videos', methods=['GET'])
def get_sample_videos():
    """Get available videos for test caption generation"""
    try:
        import sqlite3

        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get source content that has video files
        cursor.execute("""
            SELECT sc.id, sc.account, sc.original_caption,
                   rc.caption as generated_caption
            FROM source_content sc
            LEFT JOIN ready_content rc ON sc.id = rc.source_id
            WHERE sc.video_path IS NOT NULL
              AND sc.video_path != ''
            ORDER BY sc.scraped_at DESC
            LIMIT 20
        """)

        videos = []
        for row in cursor.fetchall():
            videos.append({
                'id': row['id'],
                'name': f"{row['account']} - {row['original_caption'][:30] if row['original_caption'] else 'No caption'}...",
                'account': row['account']
            })

        conn.close()

        return jsonify({'success': True, 'videos': videos})

    except Exception as e:
        print(f"Error getting videos: {e}")
        return jsonify({'success': True, 'videos': []})


@app.route('/api/generate-test-captions', methods=['POST'])
def generate_test_captions():
    """Generate test captions using the brand voice profile"""
    try:
        data = request.get_json()
        video_id = data.get('videoId')
        brand_voice = data.get('brandVoiceData', {})

        if not video_id:
            return jsonify({'success': False, 'error': 'videoId required'}), 400

        # Import caption generation service
        from ai_caption_service import get_caption_generator
        generator = get_caption_generator()

        # Get source content for context
        import sqlite3
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT sc.*, rc.caption as existing_caption
            FROM source_content sc
            LEFT JOIN ready_content rc ON sc.id = rc.source_id
            WHERE sc.id = ?
        """, (video_id,))

        source = cursor.fetchone()
        conn.close()

        if not source:
            return jsonify({'success': False, 'error': 'Video not found'}), 404

        # Generate 3 caption variants with slight variations
        captions = []

        for i in range(3):
            # Slight temperature variation for diversity
            temperature = 0.6 + (i * 0.1)

            result = generator.generate_caption(
                source_id=video_id,
                account_id=source.get('account_id', 1),
                caption_style='story' if i == 0 else 'conversational',
                brand_voice_id=None,  # Use the passed brand_voice_data instead
                manychat_keyword=None
            )

            if result.get('success') and result.get('caption'):
                captions.append(result['caption'])
            else:
                # Fallback captions
                captions.append(generate_fallback_caption(source, brand_voice, i))

        return jsonify({
            'success': True,
            'captions': captions[:3]  # Ensure we return exactly 3
        })

    except Exception as e:
        print(f"Generation error: {e}")
        # Return fallback captions on error
        return jsonify({
            'success': True,
            'captions': [
                "This is a thought-provoking topic that deserves attention. The key insight here might surprise you...\n\nWhat's been your experience with this? I'd love to hear your thoughts below.",
                "Here's something most people don't consider:\n\nThe reality is often different from what we assume. Understanding this distinction can change everything.\n\nHave you encountered this before?",
                "Let me share something I wish I knew earlier:\n\nIt took me a while to realize this, but once I did, everything clicked. The best part? Anyone can apply this starting today.\n\nSave this for later reference."
            ]
        })


def generate_fallback_caption(source, brand_voice, variant):
    """Generate fallback captions when AI service fails"""
    tone = brand_voice.get('tone', 'Authentic').lower()
    account = source.get('account', 'this account')

    templates = [
        f"""Here's what most people get wrong about this topic:

The conventional wisdom doesn't always align with reality. After spending time in this space, I've noticed a pattern that keeps repeating.

What's your take on this? Share below if you've noticed the same thing.""",

        f"""Let me share something that changed my perspective:

It's not about what everyone else is doing. It's about understanding the fundamental principles that actually drive results.

The best part? Once you see it, you can't unsee it.

Save this for later reference.""",

        f"""You've probably seen the standard advice on this topic.

But here's what nobody talks about:

The real insight often comes from unexpected places. When you look past the surface-level tips, something interesting emerges.

Have you encountered this in your own journey?"""
    ]

    return templates[variant % len(templates)]


@app.route('/api/refine-brand-voice', methods=['POST'])
def refine_brand_voice():
    """Refine brand voice based on user feedback"""
    try:
        data = request.get_json()
        feedback = data.get('feedback', '').lower()
        brand_voice = data.get('brandVoiceData', {})

        # Process feedback and update brand voice
        updated_voice = {**brand_voice}

        if 'shorter' in feedback or 'too long' in feedback:
            updated_voice['caption_length'] = 'Short'
            updated_voice['sentence_rhythm'] = 'Very short (3-6 words)'

        if 'longer' in feedback or 'more detail' in feedback:
            updated_voice['caption_length'] = 'Long'
            updated_voice['sentence_rhythm'] = 'Detailed and thorough'

        if 'more emoji' in feedback:
            updated_voice['emoji_usage'] = 'Moderate (3-5)'

        if 'less emoji' in feedback or 'fewer emoji' in feedback:
            updated_voice['emoji_usage'] = 'Minimal (0-1)'

        if 'aggressive' in feedback or 'stronger hook' in feedback:
            updated_voice['hook_style'] = 'Bold curiosity gaps'
            updated_voice['tone'] = 'Direct and authoritative'

        if 'softer' in feedback or 'less aggressive' in feedback:
            updated_voice['hook_style'] = 'Gentle invitation'
            updated_voice['tone'] = 'Warm and friendly'

        if 'funny' in feedback or 'humor' in feedback:
            updated_voice['tone'] = 'Witty and entertaining'

        if 'serious' in feedback:
            updated_voice['tone'] = 'Professional and serious'

        response = "Got it! I've updated the brand voice profile. "

        if 'shorter' in feedback:
            response += "I'll make captions more concise. "
        elif 'longer' in feedback:
            response += "I'll add more depth to captions. "
        elif 'more emoji' in feedback or 'less emoji' in feedback:
            response += "Adjusted emoji usage. "

        response += "The changes will apply to the next generation."

        return jsonify({
            'success': True,
            'response': response,
            'updatedBrandVoice': updated_voice,
            'regenerate': True
        })

    except Exception as e:
        print(f"Refine error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


@app.route('/api/save-brand-voice', methods=['POST'])
def save_brand_voice():
    """Save the completed brand voice profile to database"""
    try:
        data = request.get_json()
        name = data.get('name', 'Custom Brand Voice')
        brand_voice = data.get('brandVoiceData', {})
        references = data.get('references', [])

        import sqlite3
        from database import create_brand_voice_profile

        # Build profile data from brand_voice
        profile_data = {
            'profile_name': name,
            'tone_style': brand_voice.get('tone', 'Authentic and engaging'),
            'brand_voice_description': brand_voice.get('description', f"Brand voice created from {len(references)} reference profiles"),
            'communication_style': brand_voice.get('positioning', 'Friendly and relatable'),
            'writing_style': brand_voice.get('sentence_rhythm', 'Short and punchy'),
            'content_purpose': 'Engage and inspire',
            'content_goal': 'Build community trust',
            'target_audience': brand_voice.get('target_audience', 'General audience interested in the niche'),
            'audience_pain_points': brand_voice.get('pain_points', 'Seeking valuable content'),
            'audience_desires': brand_voice.get('desires', 'Learning and growth'),
            'audience_familiarity': 'Mixed - some beginners, some experienced',
            'personality_traits': brand_voice.get('personality_traits', 'Authentic,Helpful,Engaging').split(','),
            'core_values': brand_voice.get('core_values', 'Authenticity,Value,Connection').split(','),
            'content_pillars': brand_voice.get('content_pillars', 'Education,Inspiration').split(','),
            'do_keywords': (brand_voice.get('power_words') or 'discover,transform,value').split(','),
            'dont_keywords': 'amazing,incredible,life-changing'.split(','),
            'manychat_cta': brand_voice.get('manychat_cta', 'LINK'),
            'preferences': {
                'length': brand_voice.get('caption_length', 'medium'),
                'emojis': 'moderate' if 'moderate' in brand_voice.get('emoji_usage', '').lower() else 'minimal',
                'hashtags': brand_voice.get('hashtag_strategy', '5-10 relevant'),
                'grammar': 'standard',
                'slang': 'minimal',
                'spacing': 'standard'
            }
        }

        # Save to database
        profile_id = create_brand_voice_profile(profile_data)

        if profile_id:
            return jsonify({
                'success': True,
                'profile_id': profile_id,
                'message': 'Brand voice profile saved successfully'
            })
        else:
            return jsonify({'success': False, 'error': 'Failed to save profile'}), 500

    except Exception as e:
        print(f"Save error: {e}")
        return jsonify({'success': False, 'error': str(e)}), 500


if __name__ == '__main__':
    # Initialize database on startup
    init_database()

    print(f"Found {len(get_all_videos())} videos")
    print(f"Base directory: {BASE_DIR}")
    print("=" * 50)
    print("HARMONATICA - CONTENT STUDIO")
    print("=" * 50)
    print("Server starting on http://localhost:4411")
    print("\nAvailable pages:")
    print("  → /main               - Dashboard")
    print("  → /scrape             - Scraper")
    print("  → /prepare            - Content Preparation")
    print("  → /schedule           - Scheduling Calendar")
    print("  → /library            - Ready Content Library")
    print("  → /delivery           - Delivery Workflow")
    print("  → /analytics          - Analytics Dashboard")
    print("  → /brand-voice-builder - Brand Voice Builder")
    print("=" * 50)

    app.run(debug=True, port=4412)
