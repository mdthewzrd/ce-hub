"""
Automated Instagram Reel Posting with Sound
Complete automation workflow: Scrape → Add Sound → Post
"""

import os
from pathlib import Path
from typing import Dict, Optional

from scraper import InstagramScraper, BatchScraper
from auto_poster import InstagramAutoPoster
from audio.processor import AudioProcessor
from audio.manager import AudioManager
from integration import ScraperIntegration
import sqlite3

# Database paths
DB_PATH = os.path.join(os.path.dirname(__file__), 'instagram_automation.db')


class AutomatedReelWorkflow:
    """
    Fully automated workflow for posting Reels with sound

    Process:
    1. Download video from source content
    2. Select/add sound from library
    3. Pre-mix audio with video (FFmpeg)
    4. Upload to Instagram via Instagrapi
    5. Sound is automatically recognized by Instagram!
    """

    def __init__(
        self,
        instagram_username: str,
        instagram_password: str
    ):
        """
        Initialize automated workflow

        Args:
            instagram_username: Your Instagram username
            instagram_password: Your Instagram password
        """
        self.scraper = InstagramScraper(
            username=instagram_username,
            instagram_password=instagram_password
        )

        self.poster = InstagramAutoPoster(
            username=instagram_username,
            password=instagram_password
        )

        self.audio_processor = AudioProcessor()
        self.audio_manager = AudioManager()

    def create_reel_from_source_with_sound(
        self,
        source_id: int,
        audio_track_id: int,
        caption: Optional[str] = None,
        audio_volume: float = 0.7,
        affiliate_link: Optional[str] = None
    ) -> Dict:
        """
        Create and post a Reel from source content with sound

        Complete automation:
        1. Download original video
        2. Get audio from library
        3. Mix audio with video
        4. Post to Instagram

        Args:
            source_id: Source content ID from database
            audio_track_id: Audio track ID from library
            caption: Caption for the post
            audio_volume: Audio volume (0-1)
            affiliate_link: Optional affiliate link

        Returns:
            Dict with results
        """
        import tempfile

        # Get source content
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM source_content WHERE id = ?", (source_id,))
        source = cursor.fetchone()

        if not source:
            return {"success": False, "error": "Source content not found"}

        source = dict(source)

        # Get audio track
        cursor.execute("SELECT * FROM audio_tracks WHERE id = ?", (audio_track_id,))
        audio = cursor.fetchone()

        if not audio:
            return {"success": False, "error": "Audio track not found"}

        audio = dict(audio)

        conn.close()

        print(f"\n🎬 Creating Reel from: {source['account']}")
        print(f"🎵 Using sound: {audio['title']}")

        # Step 1: Download video
        print("⬇️  Downloading video...")
        video_url = source.get('media_url')

        if not video_url:
            return {"success": False, "error": "No video URL available"}

        with tempfile.NamedTemporaryFile(delete=False, suffix='.mp4') as tmp_video:
            video_path = tmp_video.name

        try:
            import requests
            response = requests.get(video_url, stream=True, timeout=30)
            response.raise_for_status()

            with open(video_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            print(f"✅ Video downloaded: {video_path}")

            # Step 2: Get audio
            print("🎵 Getting audio...")
            audio_path = None

            if audio.get('preview_url'):
                # Download from URL (Spotify preview, etc.)
                audio_path = self.audio_processor.download_audio_from_url(
                    audio['preview_url']
                )
            elif audio.get('source_id'):
                # Check for local audio file
                local_audio = Path("sounds_library") / f"{audio['source_id']}.mp3"
                if local_audio.exists():
                    audio_path = str(local_audio)

            if not audio_path:
                return {"success": False, "error": "Audio not available"}

            print(f"✅ Audio ready: {audio_path}")

            # Step 3: Mix audio with video
            print("🔀 Mixing audio with video...")

            output_dir = Path("temp_reels")
            output_dir.mkdir(exist_ok=True)

            output_path = output_dir / f"reel_{source_id}_{audio_track_id}.mp4"

            result = self.audio_processor.mix_audio_with_video(
                video_path=video_path,
                audio_path=audio_path,
                output_path=str(output_path),
                volume=audio_volume
            )

            if not result or not os.path.exists(result):
                return {"success": False, "error": "Failed to mix audio"}

            print(f"✅ Video with sound created: {output_path}")

            # Step 4: Post to Instagram
            print("📤 Posting to Instagram...")

            if caption is None:
                caption = f"Sound: {audio['title']} - {audio.get('artist', 'Unknown Artist')}"

            post_result = self.poster.upload_video(
                video_path=result,
                caption=caption
            )

            # Cleanup
            try:
                os.remove(video_path)
                if audio_path and os.path.exists(audio_path):
                    os.remove(audio_path)
            except:
                pass

            if post_result:
                print(f"✅ Posted successfully: {post_result['url']}")
                print(f"🎵 Sound is now available on Instagram!")

                # Save posted content record
                conn = sqlite3.connect(DB_PATH)
                cursor = conn.cursor()

                cursor.execute("""
                    INSERT INTO posted_content (
                        source_id, media_type, status,
                        posted_at, affiliate_link
                    ) VALUES (?, ?, ?, CURRENT_TIMESTAMP, ?)
                """, (source_id, 'reel', 'posted', affiliate_link))

                posted_id = cursor.lastrowid

                # Record audio attachment
                cursor.execute("""
                    INSERT INTO content_audio (
                        posted_content_id, audio_track_id
                    ) VALUES (?, ?)
                """, (posted_id, audio_track_id))

                conn.commit()
                conn.close()

                return {
                    "success": True,
                    "post_url": post_result['url'],
                    "video_path": result,
                    "sound": audio['title']
                }
            else:
                return {"success": False, "error": "Failed to post"}

        except Exception as e:
            print(f"❌ Error: {e}")
            return {"success": False, "error": str(e)}

    def batch_create_reels_with_sounds(
        self,
        limit: int = 5,
        sound_collection_id: Optional[int] = None
    ):
        """
        Create multiple Reels with sounds

        Args:
            limit: Number of Reels to create
            sound_collection_id: Use sounds from this collection
        """
        conn = sqlite3.connect(DB_PATH)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        # Get pending source content
        cursor.execute("""
            SELECT * FROM source_content
            WHERE status = 'pending'
              AND content_type = 'reel'
            ORDER BY engagement_rate DESC
            LIMIT ?
        """, (limit,))

        sources = [dict(row) for row in cursor.fetchall()]

        # Get sounds to use
        if sound_collection_id:
            cursor.execute("""
                SELECT at.* FROM collection_tracks ct
                JOIN audio_tracks at ON ct.audio_track_id = at.id
                WHERE ct.collection_id = ?
                ORDER BY ct.position
            """, (sound_collection_id,))
            sounds = [dict(row) for row in cursor.fetchall()]
        else:
            cursor.execute("""
                SELECT * FROM audio_tracks
                WHERE is_available = 1
                ORDER BY RANDOM()
                LIMIT ?
            """, (limit,))
            sounds = [dict(row) for row in cursor.fetchall()]

        conn.close()

        print(f"\n🎬 Creating {len(sources)} Reels with sounds...")

        results = []
        for i, (source, sound) in enumerate(zip(sources, sounds)):
            print(f"\n[{i+1}/{len(sources)}] Processing: {source['account']}")

            result = self.create_reel_from_source_with_sound(
                source_id=source['id'],
                audio_track_id=sound['id']
            )

            results.append(result)

        return results


# ============================================================
# Command Line Interface
# ============================================================

if __name__ == "__main__":
    import argparse

    parser = argparse.ArgumentParser(description="Automated Reel Posting with Sound")
    parser.add_argument("username", help="Instagram username")
    parser.add_argument("password", help="Instagram password")
    parser.add_argument("--source-id", type=int, help="Source content ID")
    parser.add_argument("--audio-id", type=int, help="Audio track ID")
    parser.add_argument("--batch", action="store_true", help="Batch process pending content")
    parser.add_argument("--limit", type=int, default=5, help="Number of reels for batch")
    parser.add_argument("--volume", type=float, default=0.7, help="Audio volume (0-1)")

    args = parser.parse_args()

    workflow = AutomatedReelWorkflow(
        instagram_username=args.username,
        instagram_password=args.password
    )

    if args.batch:
        # Batch process
        results = workflow.batch_create_reels_with_sounds(limit=args.limit)
        print(f"\n📊 Results: {len(results)} reels created")
    elif args.source_id and args.audio_id:
        # Single reel
        result = workflow.create_reel_from_source_with_sound(
            source_id=args.source_id,
            audio_track_id=args.audio_id,
            audio_volume=args.volume
        )
        print(f"\nResult: {result}")
    else:
        print("\nPlease provide:")
        print("  --source-id and --audio-id for single reel")
        print("  --batch for batch processing")
        print("\nOr use the workflow programmatically:")
        print("  from automated_reel_workflow import AutomatedReelWorkflow")
        print("  workflow = AutomatedReelWorkflow('user', 'pass')")
        print("  result = workflow.create_reel_from_source_with_sound(...)")
