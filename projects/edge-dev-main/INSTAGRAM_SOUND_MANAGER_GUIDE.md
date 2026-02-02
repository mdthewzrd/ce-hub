# Instagram Sound Manager - Quick Start Guide

## The Problem
Instagrapi **cannot** add sounds to Reels when posting. Instagram doesn't provide a public API for sounds.

## The Solution
**Pre-mix audio with video BEFORE uploading** to Instagram.

When you upload a video that already has audio embedded:
- ✅ Instagram recognizes it as having a "sound"
- ✅ The sound appears on your Reel
- ✅ Others can use your sound in their Reels
- ✅ It works with Instagrapi's upload function

---

## How to Use the Sound Manager

### 1. Install FFmpeg (Required)

```bash
# macOS
brew install ffmpeg

# Ubuntu/Debian
sudo apt-get install ffmpeg

# Windows
choco install ffmpeg
```

### 2. Start the Sound Manager

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/projects/edge-dev-main
./start-sound-manager.sh
```

Or manually:
```bash
cd backend/instagram_automation
source venv/bin/activate
pip install flask flask-cors requests pydub
cd audio
python sound_manager.py
```

### 3. Open in Browser

Go to: **http://localhost:5500**

---

## How to Add Sounds to Your Reels

### Method 1: From Spotify Preview URL

1. Find a song on Spotify
2. Copy the "preview" URL (30-second clip)
3. Paste into Sound Manager
4. Select your video
5. Click "Create Reel + Sound"
6. Download the ready-to-post video

### Method 2: Upload Your Own Audio

1. Have an MP3 or WAV file
2. Upload to Sound Manager
3. Add name and artist
4. Select your video
5. Click "Create Reel + Sound"
6. Download the ready-to-post video

### Method 3: From Instagram Sounds (Manual)

1. On Instagram app, find a sound you like
2. Use a screen recorder to capture the preview
3. Extract audio (online tools available)
4. Upload to Sound Manager
5. Continue with Method 2

---

## Complete Workflow: From Scrape to Posted Reel

### Step 1: Scrape Content (No Posting)
```bash
cd backend/instagram_automation

# Scrape interesting Reels (just for reference)
python scraper.py harmonatica Advncmedia1! \
  --target example_account \
  --amount 10
```

### Step 2: Create Your Own Video
- Record your video
- Edit as needed
- Save as MP4

### Step 3: Add Sound
1. Open Sound Manager: http://localhost:5500
2. Add your sound (or use existing)
3. Upload your video
4. Create Reel + Sound
5. Download the final video

### Step 4: Post to Instagram (Optional - When Ready)
```bash
# When you want to post:
python auto_poster.py harmonatica Advncmedia1! \
  --video /path/to/reel_with_sound.mp4 \
  --caption "Your caption here"
```

---

## Where Sounds Are Stored

```
backend/instagram_automation/sounds_library/
├── sound_name.json           # Sound metadata
├── sound_name.mp3            # Audio file
└── ...
```

---

## Adding Spotify Integration (Optional)

Want automatic Spotify search?

1. Go to https://developer.spotify.com/dashboard
2. Create a new app
3. Get Client ID and Client Secret
4. Add to `.env.local`:
   ```
   SPOTIFY_CLIENT_ID=your_client_id
   SPOTIFY_CLIENT_SECRET=your_client_secret
   ```
5. Install: `pip install spotipy`

Then you can search Spotify directly from the Sound Manager!

---

## Technical Details

### What Actually Happens

1. **Upload** your video and sound
2. **FFmpeg** mixes them together:
   ```bash
   ffmpeg -i video.mp4 -i sound.mp3 \
     -map 0:v -map 1:a \
     -c:v copy -c:a aac \
     -shortest \
     output.mp4
   ```
3. **Download** the final video with embedded audio
4. **Upload** to Instagram - audio already included!

### Why This Works

- Instagram receives video with audio already embedded
- Instagram's system extracts the audio
- Creates a "sound" page for it
- Others can now use your sound

---

## Limitations

- **Spotify previews**: 30 seconds only
- **Copyright**: Be careful with copyrighted music
- **Instagram limits**: Max 90 seconds for Reels
- **File size**: Keep videos under ~50MB

---

## Alternative: Manual Sound Addition

If automation isn't critical:

1. Upload video WITHOUT sound using Instagrapi
2. Open Instagram app
3. Find the posted Reel
4. Tap "Edit"
5. Tap "Audio" or "Music"
6. Select a sound from Instagram's library
7. Done!

---

## Troubleshooting

### FFmpeg not found
```bash
brew install ffmpeg  # macOS
```

### Port already in use
```bash
lsof -ti:5500 | xargs kill -9
```

### Audio not syncing
- Check video and audio formats
- Try converting audio to MP3 first
- Ensure audio is shorter than video

### Instagram rejects upload
- Check video is under 90 seconds
- Ensure file size is reasonable (<50MB)
- Try different audio codec (AAC works best)

---

## Quick Reference

| Task | Command |
|------|---------|
| Start Sound Manager | `./start-sound-manager.sh` |
| Open in Browser | http://localhost:5500 |
| Stop Sound Manager | Ctrl+C in terminal |
| Check sounds | Open browser → Your Sounds section |
| Create Reel | Select sound + upload video → Create |

---

## Future Enhancements

- [ ] Spotify search integration
- [ ] TikTok sounds scraping
- [ ] Batch processing (multiple videos at once)
- [ ] Sound library from trending Instagram sounds
- [ ] Auto-detect best audio start point

---

**Need Help?**
- FFmpeg issues: https://ffmpeg.org/documentation.html
- Spotify API: https://developer.spotify.com/dashboard
- Instagram limits: https://help.instagram.com

---

**Created for your Instagram automation platform**
