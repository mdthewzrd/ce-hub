"""
Audio Manager
Central management for audio discovery, library, and content attachment
"""

import os
from typing import List, Dict, Optional
from database import DB_PATH, get_audio_stats
import sqlite3
import requests


class AudioManager:
    """Central audio management system"""

    def __init__(self):
        """Initialize audio manager"""
        self.db_path = DB_PATH

    def search_library(
        self,
        query: str = None,
        filters: Optional[Dict] = None,
        limit: int = 50
    ) -> List[Dict]:
        """
        Search local audio library

        Args:
            query: Search query for title/artist
            filters: Optional filters (genre, source, etc.)
            limit: Max results

        Returns:
            List of audio tracks
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        sql = "SELECT * FROM audio_tracks WHERE is_available = 1"
        params = []

        if query:
            sql += " AND (title LIKE ? OR artist LIKE ?)"
            params.extend([f"%{query}%", f"%{query}%"])

        if filters:
            if filters.get('source'):
                sql += " AND source = ?"
                params.append(filters['source'])

            if filters.get('genre'):
                sql += " AND genre = ?"
                params.append(filters['genre'])

        sql += " ORDER BY added_at DESC LIMIT ?"
        params.append(limit)

        cursor.execute(sql, params)
        tracks = [dict(row) for row in cursor.fetchall()]

        # Add trending data if available
        for track in tracks:
            cursor.execute("""
                SELECT platform, rank, usage_count, reels_count, trending_date
                FROM trending_sounds
                WHERE audio_track_id = ?
                ORDER BY trending_date DESC
                LIMIT 1
            """, (track['id'],))

            trending = cursor.fetchone()
            if trending:
                track['trending'] = dict(trending)

        conn.close()
        return tracks

    def get_trending_sounds(
        self,
        platform: str = 'instagram',
        days: int = 7,
        limit: int = 20
    ) -> List[Dict]:
        """
        Get trending sounds with analytics

        Args:
            platform: 'instagram', 'tiktok', or 'all'
            days: Number of days to look back
            limit: Max results

        Returns:
            List of trending sounds with stats
        """
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT
                at.*,
                ts.platform,
                ts.rank,
                ts.usage_count,
                ts.reels_count,
                ts.trending_date,
                ts.score
            FROM trending_sounds ts
            JOIN audio_tracks at ON ts.audio_track_id = at.id
            WHERE at.is_available = 1
              AND ts.trending_date >= date('now', '-{} days')
            ORDER BY ts.trending_date DESC, ts.score DESC
            LIMIT ?
        """.format(days), (limit,))

        results = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return results

    def get_audio_track(self, track_id: int) -> Optional[Dict]:
        """Get specific audio track by ID"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM audio_tracks WHERE id = ?", (track_id,))
        row = cursor.fetchone()

        conn.close()

        return dict(row) if row else None

    def add_audio_track(self, track_data: Dict) -> Optional[int]:
        """
        Add audio track to library

        Args:
            track_data: Dictionary with track info

        Returns:
            Track ID if successful, None otherwise
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO audio_tracks (
                    source, source_id, title, artist, album,
                    duration_seconds, preview_url, cover_art_url,
                    genre, tempo, energy, danceability,
                    is_explicit
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            """, (
                track_data.get('source', 'custom'),
                track_data.get('source_id'),
                track_data['title'],
                track_data.get('artist'),
                track_data.get('album'),
                track_data.get('duration_seconds'),
                track_data.get('preview_url'),
                track_data.get('cover_art_url'),
                track_data.get('genre'),
                track_data.get('tempo'),
                track_data.get('energy'),
                track_data.get('danceability'),
                track_data.get('is_explicit', 0)
            ))

            track_id = cursor.lastrowid
            conn.commit()
            conn.close()

            return track_id

        except Exception as e:
            print(f"Error adding audio track: {e}")
            conn.close()
            return None

    def attach_audio_to_content(
        self,
        posted_content_id: int,
        audio_track_id: int,
        start_time: float = 0,
        volume: float = 1.0
    ) -> bool:
        """
        Attach audio to posted content

        Args:
            posted_content_id: Content ID
            audio_track_id: Audio track ID
            start_time: Start time in seconds
            volume: Volume level (0-1)

        Returns:
            True if successful
        """
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO content_audio (
                    posted_content_id, audio_track_id,
                    start_time, volume
                ) VALUES (?, ?, ?, ?)
            """, (posted_content_id, audio_track_id, start_time, volume))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            print(f"Error attaching audio: {e}")
            conn.close()
            return False

    def get_collections(self) -> List[Dict]:
        """Get all audio collections"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("SELECT * FROM audio_collections ORDER BY name")
        collections = [dict(row) for row in cursor.fetchall()]

        conn.close()
        return collections

    def get_collection_tracks(self, collection_id: int) -> List[Dict]:
        """Get tracks in a collection"""
        conn = sqlite3.connect(self.db_path)
        conn.row_factory = sqlite3.Row
        cursor = conn.cursor()

        cursor.execute("""
            SELECT at.*,
                   ct.position as collection_position
            FROM collection_tracks ct
            JOIN audio_tracks at ON ct.audio_track_id = at.id
            WHERE ct.collection_id = ?
            ORDER BY ct.position
        """, (collection_id,))

        tracks = [dict(row) for row in cursor.fetchall()]
        conn.close()
        return tracks

    def create_collection(
        self,
        name: str,
        description: str = None,
        emoji: str = None
    ) -> Optional[int]:
        """Create a new audio collection"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            cursor.execute("""
                INSERT INTO audio_collections (name, description, emoji)
                VALUES (?, ?, ?)
            """, (name, description, emoji))

            collection_id = cursor.lastrowid
            conn.commit()
            conn.close()

            return collection_id

        except Exception as e:
            print(f"Error creating collection: {e}")
            conn.close()
            return None

    def add_track_to_collection(
        self,
        collection_id: int,
        audio_track_id: int,
        position: int = None
    ) -> bool:
        """Add track to collection"""
        conn = sqlite3.connect(self.db_path)
        cursor = conn.cursor()

        try:
            # Get next position if not specified
            if position is None:
                cursor.execute("""
                    SELECT COALESCE(MAX(position), 0) + 1
                    FROM collection_tracks
                    WHERE collection_id = ?
                """, (collection_id,))
                position = cursor.fetchone()[0]

            cursor.execute("""
                INSERT INTO collection_tracks (collection_id, audio_track_id, position)
                VALUES (?, ?, ?)
            """, (collection_id, audio_track_id, position))

            conn.commit()
            conn.close()
            return True

        except Exception as e:
            print(f"Error adding track to collection: {e}")
            conn.close()
            return False

    def get_library_stats(self) -> Dict:
        """Get audio library statistics"""
        return get_audio_stats()

    def download_preview(self, preview_url: str, save_path: str) -> bool:
        """
        Download audio preview

        Args:
            preview_url: URL of preview
            save_path: Where to save file

        Returns:
            True if successful
        """
        try:
            response = requests.get(preview_url, stream=True)
            response.raise_for_status()

            with open(save_path, 'wb') as f:
                for chunk in response.iter_content(chunk_size=8192):
                    f.write(chunk)

            return True

        except Exception as e:
            print(f"Error downloading preview: {e}")
            return False


if __name__ == "__main__":
    # Initialize and test
    from database import init_audio_tables, load_initial_collections

    init_audio_tables()
    load_initial_collections()

    manager = AudioManager()

    print("\n📚 Audio Collections:")
    collections = manager.get_collections()
    for col in collections:
        print(f"  {col.get('emoji', '🎵')} {col['name']}")

    print("\n📊 Library Statistics:")
    stats = manager.get_library_stats()
    print(f"  Total Tracks: {stats['total_tracks']}")
    print(f"  Collections: {stats['collections']}")
    print(f"  Trending Today: {stats['trending_today']}")
