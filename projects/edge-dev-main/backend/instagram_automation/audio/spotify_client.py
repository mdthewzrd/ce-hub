"""
Spotify Audio Client
Provides access to Spotify's music library for audio discovery
"""

import os
from typing import List, Dict, Optional
from database import DB_PATH
import sqlite3


class SpotifyAudioClient:
    """
    Spotify integration for audio search and discovery

    Note: This uses Spotify's Web API for:
    - Audio search
    - Track metadata
    - Audio previews (30 seconds)
    - Audio features (tempo, energy, danceability)

    Full track playback requires Premium subscription
    """

    def __init__(self, client_id: Optional[str] = None, client_secret: Optional[str] = None):
        """
        Initialize Spotify client

        Args:
            client_id: Spotify Client ID (from developer dashboard)
            client_secret: Spotify Client Secret
        """
        self.client_id = client_id or os.getenv('SPOTIFY_CLIENT_ID')
        self.client_secret = client_secret or os.getenv('SPOTIFY_CLIENT_SECRET')
        self.access_token = None

        # Try to import spotipy
        try:
            import spotipy
            from spotipy.oauth2 import SpotifyClientCredentials
            self.spotipy = spotipy
            self.SpotifyClientCredentials = SpotifyClientCredentials
            self.available = True
        except ImportError:
            self.available = False
            print("Warning: spotipy not installed. Install with: pip install spotipy")

    def authenticate(self):
        """Authenticate with Spotify and get access token"""
        if not self.available:
            raise Exception("Spotipy not available")

        if not self.client_id or not self.client_secret:
            raise Exception("Spotify credentials not configured. Set SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET")

        client_credentials_manager = self.SpotifyClientCredentials(
            client_id=self.client_id,
            client_secret=self.client_secret
        )

        self.client = self.spotipy.Spotify(client_credentials_manager=client_credentials_manager)
        self.access_token = client_credentials_manager.get_access_token()
        return True

    def search_audio(
        self,
        query: str,
        limit: int = 20,
        offset: int = 0,
        market: str = "US",
        filters: Optional[Dict] = None
    ) -> List[Dict]:
        """
        Search for tracks on Spotify

        Args:
            query: Search query
            limit: Number of results
            offset: Pagination offset
            market: Country code
            filters: Optional filters (genre, year, etc.)

        Returns:
            List of track dictionaries
        """
        if not self.available or not hasattr(self, 'client'):
            return []

        # Build search query
        search_query = query
        if filters:
            if filters.get('year'):
                search_query += f" year:{filters['year']}"
            if filters.get('genre'):
                search_query += f" genre:{filters['genre']}"

        try:
            results = self.client.search(
                q=search_query,
                type='track',
                limit=limit,
                offset=offset,
                market=market
            )

            tracks = []
            for item in results['tracks']['items']:
                track = {
                    'source': 'spotify',
                    'source_id': item['id'],
                    'title': item['name'],
                    'artist': item['artists'][0]['name'] if item['artists'] else None,
                    'album': item['album']['name'],
                    'duration_seconds': item['duration_ms'] // 1000,
                    'preview_url': item['preview_url'],
                    'cover_art_url': item['album']['images'][0]['url'] if item['album']['images'] else None,
                    'is_explicit': item['explicit'],
                    'external_url': item['external_urls']['spotify']
                }
                tracks.append(track)

            return tracks

        except Exception as e:
            print(f"Error searching Spotify: {e}")
            return []

    def get_audio_features(self, track_id: str) -> Optional[Dict]:
        """
        Get audio features for a track

        Args:
            track_id: Spotify track ID

        Returns:
            Dictionary with audio features
        """
        if not self.available or not hasattr(self, 'client'):
            return None

        try:
            features = self.client.audio_features(track_id)
            if features and features[0]:
                f = features[0]
                return {
                    'tempo': int(f['tempo']),
                    'energy': f['energy'],
                    'danceability': f['danceability'],
                    'valence': f['valence'],
                    'acousticness': f['acousticness'],
                    'instrumentalness': f['instrumentalness'],
                    'liveness': f['liveness'],
                    'speechiness': f['speechiness']
                }
        except Exception as e:
            print(f"Error getting audio features: {e}")

        return None

    def get_trending_tracks(
        self,
        country: str = "US",
        limit: int = 50
    ) -> List[Dict]:
        """
        Get trending/popular tracks from Spotify

        Args:
            country: Country code
            limit: Number of results

        Returns:
            List of trending tracks
        """
        if not self.available or not hasattr(self, 'client'):
            return []

        try:
            results = self.client.playlist_items(
                f"37i9dQZF1DXcBWIGoYBM5M",  # Today's Top Hits playlist
                limit=limit,
                country=country
            )

            tracks = []
            for item in results['items']:
                track = item['track']
                tracks.append({
                    'source': 'spotify',
                    'source_id': track['id'],
                    'title': track['name'],
                    'artist': track['artists'][0]['name'] if track['artists'] else None,
                    'album': track['album']['name'],
                    'duration_seconds': track['duration_ms'] // 1000,
                    'preview_url': track['preview_url'],
                    'cover_art_url': track['album']['images'][0]['url'] if track['album']['images'] else None,
                    'is_explicit': track['explicit']
                })

            return tracks

        except Exception as e:
            print(f"Error getting trending tracks: {e}")
            return []

    def save_tracks_to_database(self, tracks: List[Dict]):
        """
        Save Spotify tracks to local database

        Args:
            tracks: List of track dictionaries from search_audio()
        """
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()

        saved = 0
        skipped = 0

        for track in tracks:
            try:
                # Check if already exists
                cursor.execute("""
                    SELECT id FROM audio_tracks
                    WHERE source = 'spotify' AND source_id = ?
                """, (track['source_id'],))

                if cursor.fetchone():
                    skipped += 1
                    continue

                # Insert track
                cursor.execute("""
                    INSERT INTO audio_tracks (
                        source, source_id, title, artist, album,
                        duration_seconds, preview_url, cover_art_url,
                        is_explicit
                    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                """, (
                    'spotify',
                    track['source_id'],
                    track['title'],
                    track['artist'],
                    track['album'],
                    track['duration_seconds'],
                    track['preview_url'],
                    track['cover_art_url'],
                    track['is_explicit']
                ))

                saved += 1

            except sqlite3.IntegrityError:
                skipped += 1

        conn.commit()
        conn.close()

        print(f"Saved {saved} tracks to database ({skipped} skipped)")
        return saved


# Quick start function
def setup_spotify_client():
    """
    Quick setup for Spotify client

    Returns:
        Authenticated SpotifyAudioClient instance
    """
    client = SpotifyAudioClient()

    print("Spotify Audio Client Setup")
    print("=" * 50)
    print("\nTo use Spotify audio integration:")
    print("1. Go to https://developer.spotify.com/dashboard")
    print("2. Create a new app")
    print("3. Get Client ID and Client Secret")
    print("4. Add to .env.local:")
    print("   SPOTIFY_CLIENT_ID=your_client_id")
    print("   SPOTIFY_CLIENT_SECRET=your_client_secret")
    print("5. Run: pip install spotipy")
    print("\n" + "=" * 50)

    return client


if __name__ == "__main__":
    # Initialize audio tables first
    from database import init_audio_tables, load_initial_collections
    init_audio_tables()
    load_initial_collections()

    # Setup and test Spotify client
    client = setup_spotify_client()

    if client.available and client.client_id:
        try:
            client.authenticate()
            print("\n✅ Spotify authentication successful!")

            # Test search
            print("\nTesting search for 'motivational'...")
            tracks = client.search_audio("motivational", limit=5)
            print(f"Found {len(tracks)} tracks")

            for track in tracks[:3]:
                print(f"  - {track['title']} by {track['artist']}")

            # Save to database
            print("\nSaving to database...")
            client.save_tracks_to_database(tracks)

        except Exception as e:
            print(f"\n❌ Authentication failed: {e}")
    else:
        print("\n⚠️  Spotify client not configured. See setup instructions above.")
