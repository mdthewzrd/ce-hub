# Instagram Sounds/Audio Feature - Technical Plan

## Overview
Add Instagram Reels music/audio functionality to the automation platform, including:
- Audio search and discovery
- Trending sounds tracking
- Sound usage analytics
- Audio attachment to posted content

---

## Challenge Analysis

### Current Limitations
1. **Instagram Music API**: Instagram doesn't provide a public API for their music library
2. **Instagrapi Limitations**: Current Instagrapi library has limited audio support
3. **Copyright**: Must ensure licensed music usage

### Solution Approach
Use a **hybrid approach** combining multiple data sources and API integrations.

---

## Architecture Design

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTAGRAM AUDIO SYSTEM                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Audio       │ -> │ Trending        │ -> │ Content      │  │
│  │ Discovery   │    │ Analysis        │    │ Library      │  │
│  │ Engine      │    │                 │    │              │  │
│  └─────────────┘    └─────────────────┘    └──────────────┘  │
│         │                     │                     │            │
│         v                     v                     v            │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Multiple    │    │ TikTok/IG       │    │ Posted       │  │
│  │ Sources     │    │ Scraping        │    │ Content      │  │
│  │ (Spotify,   │    │ for trending    │    │ + Audio      │  │
│  │ TikTok)     │    │                 │    │              │  │
│  └─────────────┘    └─────────────────┘    └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

---

## Implementation Plan

### Phase 1: Audio Discovery Engine (Priority: HIGH)

#### 1.1 Spotify API Integration
**Purpose**: Access to vast music library with search and metadata

```python
# backend/instagram_automation/audio/spotify_client.py
class SpotifyAudioClient:
    """Search and retrieve audio from Spotify"""

    def search_audio(self, query: str, limit: int = 20):
        """Search for tracks by query"""

    def get_trending_tracks(self):
        """Get currently trending tracks"""

    def get_audio_features(self, track_id: str):
        """Get audio features (tempo, energy, etc.)"""
```

**Setup Required**:
- Spotify Developer Account
- Spotify API Credentials (Client ID, Secret)
- Install: `pip install spotipy`

#### 1.2 TikTok Sound Scraping
**Purpose**: Discover trending sounds used in viral Reels

```python
# backend/instagram_automation/audio/tiktok_scraper.py
class TikTokTrendingScraper:
    """Scrape trending sounds from TikTok"""

    def get_trending_sounds(self):
        """Get trending sounds from TikTok discovery page"""

    def get_sound_stats(self, sound_id: str):
        """Get usage statistics for a sound"""

    def scrape_hashtag_sounds(self, hashtag: str):
        """Get popular sounds from hashtag pages"""
```

#### 1.3 Instagram Sound Library Scraping
**Purpose**: Direct access to Instagram's trending sounds

```python
# backend/instagram_automation/audio/instagram_audio.py
class InstagramAudioScraper:
    """Scrape Instagram's audio library"""

    def get_trending_sounds(self):
        """Scrape trending sounds from Instagram"""

    def search_instagram_audio(self, query: str):
        """Search Instagram audio library"""

    def get_sound_usage_count(self, sound_id: str):
        """Get number of Reels using this sound"""
```

---

### Phase 2: Audio Database & Management (Priority: HIGH)

#### 2.1 Database Schema

```sql
-- Audio tracks library
CREATE TABLE audio_tracks (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    source TEXT NOT NULL,  -- 'spotify', 'tiktok', 'instagram', 'custom'
    source_id TEXT,  -- External ID (Spotify URI, TikTok sound ID, etc.)
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
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(source, source_id)
);

-- Trending sounds tracking
CREATE TABLE trending_sounds (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    audio_track_id INTEGER NOT NULL,
    platform TEXT NOT NULL,  -- 'instagram', 'tiktok', 'both'
    rank INTEGER,
    usage_count INTEGER DEFAULT 0,
    reels_count INTEGER DEFAULT 0,
    trending_date DATE,
    score REAL,  -- Composite trending score
    discovered_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id),
    UNIQUE(platform, trending_date, audio_track_id)
);

-- Sound usage in posted content
CREATE TABLE content_audio (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    posted_content_id INTEGER NOT NULL,
    audio_track_id INTEGER NOT NULL,
    start_time REAL DEFAULT 0,  -- Where to start audio in video
    volume REAL DEFAULT 1.0,
    fade_in_duration REAL DEFAULT 0,
    fade_out_duration REAL DEFAULT 0,
    FOREIGN KEY (posted_content_id) REFERENCES posted_content(id),
    FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id)
);

-- Sound collections/playlists
CREATE TABLE audio_collections (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    name TEXT NOT NULL,
    description TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE collection_tracks (
    collection_id INTEGER NOT NULL,
    audio_track_id INTEGER NOT NULL,
    position INTEGER,
    added_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (collection_id, audio_track_id),
    FOREIGN KEY (collection_id) REFERENCES audio_collections(id),
    FOREIGN KEY (audio_track_id) REFERENCES audio_tracks(id)
);
```

#### 2.2 Audio Management Module

```python
# backend/instagram_automation/audio/manager.py
class AudioManager:
    """Central audio management system"""

    def add_audio_track(self, track_data: dict):
        """Add audio track to library"""

    def search_library(self, query: str, filters: dict = None):
        """Search local audio library"""

    def get_trending_sounds(self, platform: str = 'instagram', days: int = 7):
        """Get trending sounds with analytics"""

    def attach_audio_to_content(self, posted_content_id: int, audio_track_id: int):
        """Attach audio to content for posting"""
```

---

### Phase 3: Audio Search UI (Priority: MEDIUM)

#### 3.1 Frontend Components

```typescript
// src/components/AudioSearchPanel.tsx
interface AudioSearchProps {
  onSelectAudio: (audio: AudioTrack) => void;
  selectedAudio?: AudioTrack;
}

interface AudioTrack {
  id: number;
  title: string;
  artist: string;
  preview_url: string;
  cover_art_url: string;
  duration: number;
  trending?: {
    rank: number;
    usage_count: number;
    reels_count: number;
  };
}
```

**UI Features**:
- Search bar with filters (genre, tempo, energy)
- Trending sounds section (like Instagram)
- Sound preview player
- Usage statistics display
- Add to collection/favorites
- Recently used sounds

#### 3.2 Sound Browser Layout

```
┌─────────────────────────────────────────────────────────────┐
│ 🔍 Search Sounds...                        [Filters ▼]      │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│ 📈 TRENDING SOUNDS                            [View All →]   │
│ ┌────────────────────────────────────────────────────────┐  │
│ │ 🎵 Blinding Lights - The Weeknd                      │  │
│ │    💬 2.5M Reels │ 🔥 Trending #3 │ ⏱ 3:20          │  │
│ │    [▶ Preview] [+]                                   │  │
│ ├────────────────────────────────────────────────────────┤  │
│ │ 🎵 Levitating - Dua Lipa                             │  │
│ │    💬 1.8M Reels │ 🔥 Trending #7 │ ⏱ 3:23          │  │
│ │    [▶ Preview] [+]                                   │  │
│ └────────────────────────────────────────────────────────┘  │
│                                                               │
│ 🔥 POPULAR THIS WEEK                                        │
│ [Sound cards with usage stats]                              │
│                                                               │
│ 📁 YOUR COLLECTIONS                                           │
│ [Motivation] [Workout] [Viral Covers] [+ New Collection]   │
│                                                               │
│ ⏱ RECENTLY USED                                               │
│ [Recently used sounds]                                        │
└─────────────────────────────────────────────────────────────┘
```

---

### Phase 4: Audio Attachment to Posts (Priority: HIGH)

#### 4.1 Enhanced Auto-Poster

```python
# backend/instagram_automation/audio/audio_poster.py
class AudioAwareAutoPoster:
    """Extended auto-poster with audio support"""

    def upload_video_with_audio(
        self,
        video_path: str,
        audio_path: str,
        caption: str,
        audio_start_time: float = 0,
        audio_volume: float = 1.0
    ):
        """
        Upload video with audio track

        Note: Instagram API requires audio to be mixed into video
        before upload. We need to use ffmpeg to merge audio.
        """

    def merge_audio_to_video(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        audio_start: float = 0,
        volume: float = 1.0
    ):
        """Merge audio track into video using ffmpeg"""

    def fetch_audio_preview(self, audio_track_id: int):
        """Download audio preview for mixing"""
```

#### 4.2 Audio Processing Pipeline

```python
# backend/instagram_automation/audio/processor.py
class AudioProcessor:
    """Process and prepare audio for Instagram posting"""

    def download_preview(self, preview_url: str) -> str:
        """Download audio preview from source"""

    def trim_audio(self, input_path: str, start: float, duration: float) -> str:
        """Trim audio to desired section"""

    def normalize_volume(self, input_path: str, target_db: float = -14) -> str:
        """Normalize audio volume"""

    def mix_with_video(
        self,
        video_path: str,
        audio_path: str,
        output_path: str,
        video_volume: float = 0,
        audio_volume: float = 1.0
    ) -> str:
        """Mix audio track with video using ffmpeg"""
```

---

## API Endpoints

### Audio Discovery

```
GET  /api/audio/search?q={query}&filters={}
POST /api/audio/trending
GET  /api/audio/track/{id}
GET  /api/audio/trending?platform=instagram&days=7
```

### Audio Management

```
POST /api/audio/library
GET  /api/audio/library
PUT  /api/audio/library/{id}
DELETE /api/audio/library/{id}
```

### Content Audio

```
POST /api/posted/{id}/audio
GET  /api/posted/{id}/audio
PUT  /api/posted/{id}/audio
DELETE /api/posted/{id}/audio
```

### Collections

```
POST /api/audio/collections
GET  /api/audio/collections
POST /api/audio/collections/{id}/tracks
DELETE /api/audio/collections/{id}/tracks/{track_id}
```

---

## Technical Requirements

### Dependencies

```bash
# Audio processing
pip install spotipy          # Spotify API
pip install pydub            # Audio processing
pip install ffmpeg-python     # FFmpeg bindings

# System requirements
brew install ffmpeg           # macOS
# apt-get install ffmpeg      # Linux

# Video editing
pip install moviepy          # Video editing
```

### External APIs

1. **Spotify API**
   - Sign up: https://developer.spotify.com/dashboard
   - Free tier available
   - Provides: Search, metadata, previews

2. **Optional: TikTok API**
   - Limited public API
   - May require scraping

---

## Implementation Order

### Sprint 1: Core Audio Infrastructure (Week 1)
- [ ] Set up Spotify API integration
- [ ] Create audio database schema
- [ ] Build audio management module
- [ ] Basic audio search API

### Sprint 2: Trending Discovery (Week 2)
- [ ] Instagram sound scraping
- [ ] TikTok trending scraper
- [ ] Trending analytics
- [ ] Automated trending updates

### Sprint 3: UI & Search (Week 2-3)
- [ ] Audio search panel component
- [ ] Trending sounds display
- [ ] Audio preview player
- [ ] Collection management

### Sprint 4: Audio Posting (Week 3-4)
- [ ] FFmpeg integration
- [ ] Audio processing pipeline
- [ ] Enhanced auto-poster with audio
- [ ] Test end-to-end posting with audio

---

## Cost & Limitations

### Spotify API (Free Tier)
- Rate limits: ~180 requests per minute
- Preview clips: 30 seconds
- Full tracks: Requires Premium subscription

### TikTok Scraping
- No official API
- May violate ToS
- Consider ethical implications

### Instagram Audio
- No public API
- Scraping may be brittle
- Manual sound selection alternative

---

## Alternative Approach: Manual Sound Library

If automated discovery proves difficult:

1. **Curated Library**: Manually add trending sounds
2. **User Submissions**: Allow users to suggest sounds
3. **Collection Templates**: Pre-built collections by niche
4. **Regular Updates**: Weekly manual updates from Instagram app

---

## Security & Compliance

- ✅ Only use licensed music
- ✅ Respect API rate limits
- ✅ Comply with Instagram ToS
- ✅ Handle copyrighted content appropriately
- ✅ Provide attribution when required

---

## Success Metrics

- Audio search: < 2 second response time
- Trending updates: Daily automated refresh
- Audio attachment: < 30 second processing time
- Preview playback: Instant streaming
- User satisfaction: Sound availability > 90%

---

## Next Steps

1. **Immediate**: Set up Spotify Developer account
2. **This Week**: Implement Phase 1 (Audio Discovery Engine)
3. **Next Week**: Build trending sounds scraper
4. **Following**: UI development and testing
