"""
Audio Database Schema
Extends Instagram automation database with audio tracking capabilities
"""

import sqlite3
import os
from datetime import datetime

# Get parent database path - use absolute path
DB_PATH = os.path.abspath(os.path.join(os.path.dirname(__file__), '..', 'instagram_automation.db'))


def init_audio_tables():
    """Initialize audio-related tables in the database"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    # Audio tracks library
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audio_tracks (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            source TEXT NOT NULL,
            source_id TEXT,
            title TEXT NOT NULL,
            artist TEXT,
            album TEXT,
            duration_seconds INTEGER,
            preview_url TEXT,
            cover_art_url TEXT,
            genre TEXT,
            tempo INTEGER,
            energy REAL,
            danceability REAL,
            is_explicit BOOLEAN DEFAULT 0,
            is_available BOOLEAN DEFAULT 1,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(source, source_id)
        )
    """)

    # Trending sounds tracking
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS trending_sounds (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            audio_track_id INTEGER NOT NULL,
            platform TEXT NOT NULL,
            rank INTEGER,
            usage_count INTEGER DEFAULT 0,
            reels_count INTEGER DEFAULT 0,
            trending_date DATE,
            score REAL,
            discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id),
            UNIQUE(platform, trending_date, audio_track_id)
        )
    """)

    # Sound usage in posted content
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS content_audio (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            posted_content_id INTEGER NOT NULL,
            audio_track_id INTEGER NOT NULL,
            start_time REAL DEFAULT 0,
            volume REAL DEFAULT 1.0,
            fade_in_duration REAL DEFAULT 0,
            fade_out_duration REAL DEFAULT 0,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            FOREIGN KEY (posted_content_id) REFERENCES posted_content(id),
            FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id)
        )
    """)

    # Sound collections/playlists
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS audio_collections (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            description TEXT,
            emoji TEXT,
            created_at DATETIME DEFAULT CURRENT_TIMESTAMP
        )
    """)

    # Collection tracks
    cursor.execute("""
        CREATE TABLE IF NOT EXISTS collection_tracks (
            collection_id INTEGER NOT NULL,
            audio_track_id INTEGER NOT NULL,
            position INTEGER,
            added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
            PRIMARY KEY (collection_id, audio_track_id),
            FOREIGN KEY (collection_id) REFERENCES audio_collections(id),
            FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id)
        )
    """)

    # Create indexes for performance
    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_audio_tracks_source
        ON audio_tracks(source, is_available)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_trending_sounds_date
        ON trending_sounds(trending_date DESC, score DESC)
    """)

    cursor.execute("""
        CREATE INDEX IF NOT EXISTS idx_content_audio_posted
        ON content_audio(posted_content_id)
    """)

    conn.commit()
    conn.close()

    print("Audio database tables initialized successfully")


def load_initial_collections():
    """Load initial audio collections"""
    conn = sqlite3.connect(DB_PATH)
    cursor = conn.cursor()

    initial_collections = [
        ("Trending Now", "Currently trending Instagram sounds", "🔥"),
        ("Viral Hits", "Most used sounds in viral reels", "💥"),
        ("Motivation", "Uplifting motivational music", "💪"),
        ("Chill Vibes", "Relaxed background music", "✨"),
        ("Workout Energy", "High-energy workout music", "⚡"),
        ("Dance & Party", "Party and dance tracks", "💃"),
        ("Focus & Flow", "Concentration and productivity", "🧠"),
        ("Trending Audio", "Daily updated trending sounds", "📈"),
    ]

    for name, description, emoji in initial_collections:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO audio_collections (name, description, emoji)
                VALUES (?, ?, ?)
            """, (name, description, emoji))
        except sqlite3.IntegrityError:
            pass  # Collection already exists

    conn.commit()
    conn.close()

    print("Initial audio collections loaded")


def get_audio_stats():
    """Get audio library statistics"""
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    cursor = conn.cursor()

    stats = {}

    # Total tracks
    cursor.execute("SELECT COUNT(*) as count FROM audio_tracks WHERE is_available = 1")
    stats['total_tracks'] = cursor.fetchone()['count']

    # Tracks by source
    cursor.execute("""
        SELECT source, COUNT(*) as count
        FROM audio_tracks
        WHERE is_available = 1
        GROUP BY source
    """)
    stats['by_source'] = {row['source']: row['count'] for row in cursor.fetchall()}

    # Trending today
    today = datetime.now().strftime('%Y-%m-%d')
    cursor.execute("""
        SELECT COUNT(*) as count
        FROM trending_sounds
        WHERE trending_date = ?
    """, (today,))
    stats['trending_today'] = cursor.fetchone()['count']

    # Collections
    cursor.execute("SELECT COUNT(*) as count FROM audio_collections")
    stats['collections'] = cursor.fetchone()['count']

    conn.close()
    return stats


if __name__ == "__main__":
    print("Initializing Audio Database Tables...")
    init_audio_tables()
    load_initial_collections()

    stats = get_audio_stats()
    print("\nAudio Library Statistics:")
    print(f"  Total Tracks: {stats['total_tracks']}")
    print(f"  Collections: {stats['collections']}")
    print(f"  Trending Today: {stats['trending_today']}")
