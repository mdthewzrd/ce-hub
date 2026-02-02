# Instagram Video Scraper & Brand Overlay Tool

**Automated tool for scraping Instagram videos, blurring original watermarks, and overlaying your own branding.**

> ⚠️ **Important:** This tool is for educational purposes. Always respect copyright laws and Instagram's Terms of Service. Consider crediting original creators in your captions when reposting.

---

## 🎯 Features

- ✅ **Safe Scraping**: Rate-limited Instagram video downloading
- ✅ **Blur Watermarks**: Remove username overlays with intelligent blurring
- ✅ **Brand Overlay**: Add your own logo to processed videos
- ✅ **Batch Processing**: Handle multiple accounts automatically
- ✅ **Organized Output**: Clean folder structure for originals and processed videos
- ✅ **Detailed Logging**: Track all operations
- ✅ **JSON Reports**: Save results for analysis

---

## 📋 Requirements

- Python 3.8+
- FFmpeg (must be installed on your system)
- A burner Instagram account (do NOT use your main account!)

---

## 🚀 Quick Start

### 1. Install Dependencies

```bash
# Install Python packages
pip install -r requirements.txt

# Install FFmpeg
# macOS:
brew install ffmpeg

# Ubuntu/Debian:
sudo apt install ffmpeg

# Windows:
# Download from https://ffmpeg.org/download.html
```

### 2. Configure the Tool

```bash
# Copy the example config
cp config.json config.backup.json

# Edit config.json with your settings
nano config.json  # or use your preferred editor
```

**Key Settings to Configure:**

```json
{
  "instagram": {
    "burner_username": "YOUR_BURNER_USERNAME",
    "burner_password": "YOUR_BURNER_PASSWORD",
    "target_accounts": [
      "account1",
      "account2"
    ]
  },
  "processing": {
    "blur_intensity": 20,
    "logo_path": "assets/your_logo.png"
  },
  "watermark_regions": {
    "bottom_center": {
      "enabled": true,
      "width": 600,
      "height": 120,
      "x": null,
      "y": "85%"  // 85% from top = near bottom
    }
  }
}
```

### 3. Add Your Logo

```bash
mkdir assets
# Place your logo PNG (with transparency) in assets/your_logo.png
```

### 4. Run the Tool

```bash
# Full pipeline: scrape + process
python main.py

# Scrape only (download videos)
python main.py --scrape-only

# Process existing videos only
python main.py --process-only

# Skip the summary report
python main.py --no-report
```

---

## 📁 Output Structure

```
output/
├── originals/           # Downloaded videos from Instagram
│   ├── account1/
│   │   ├── video1.mp4
│   │   └── video2.mp4
│   └── account2/
│       └── video3.mp4
├── processed/           # Processed videos (blurred + logo)
│   ├── processed_video1.mp4
│   └── processed_video2.mp4
└── results_*.json       # Execution reports
```

---

## ⚙️ Configuration Guide

### Instagram Settings

| Setting | Description |
|---------|-------------|
| `burner_username` | Your burner account username |
| `burner_password` | Your burner account password |
| `target_accounts` | List of accounts to scrape |
| `download_videos_only` | Only download videos (skip photos) |
| `download_stories` | Also download stories |

### Watermark Regions

Configure where to apply blur effects:

```json
"watermark_regions": {
  "bottom_center": {
    "enabled": true,
    "x": null,           // null = center horizontally
    "y": "85%",          // 85% from top
    "width": 600,
    "height": 120
  },
  "top_right": {
    "enabled": false,
    "x": "70%",
    "y": "5%",
    "width": 400,
    "height": 100
  }
}
```

**Coordinates:**
- Can be pixels (number) or percentage ("50%")
- `x, y`: Top-left corner of blur region
- `width, height`: Size of blur region
- Set `enabled: true` to activate

### Rate Limiting

| Setting | Default | Description |
|---------|---------|-------------|
| `delay_between_requests` | 15 | Seconds between video downloads |
| `delay_between_accounts` | 60 | Seconds between account switches |
| `max_downloads_per_session` | 50 | Max videos per run |
| `session_break_duration` | 300 | Break time after limit |

**Recommendation:** Start with conservative settings, adjust as needed.

---

## 🔒 Safety Best Practices

### Account Safety

1. **Use a burner account** - Never use your main account
2. **Age the burner** - Post some content first, warm it up
3. **Don't scrape aggressively** - Respect rate limits
4. **Monitor for issues** - Check scraper.log regularly

### Legal/Ethical Considerations

1. **Credit original creators** - Add "@username" in captions
2. **Don't claim ownership** - Be transparent it's a repost
3. **Respect copyright** - Some content may not be repostable
4. **Consider permission** - Reach out to creators when possible

---

## 📊 Understanding the Output

### Console Report

```
============================================================
INSTAGRAM SCRAPER & BRANDER - REPORT
============================================================
Timestamp: 2025-12-28T15:30:00
Duration: 847.3 seconds

SCRAPING RESULTS:
  Total downloaded: 24 videos

  @account1:
    Downloaded: 12
    Failed: 0

PROCESSING RESULTS:
  Successful: 24
  Failed: 0

============================================================
Processed videos saved to: output/processed
============================================================
```

### JSON Results File

Saved as `output/results_TIMESTAMP.json`:

```json
{
  "success": true,
  "duration_seconds": 847.3,
  "scrape_results": {
    "total_downloaded": 24,
    "accounts": {...}
  },
  "process_results": {
    "successful": [...],
    "failed": []
  }
}
```

---

## 🐛 Troubleshooting

### Login Fails

- Verify username/password in config.json
- Check if burner account is banned/locked
- Try logging in manually first to verify account works

### No Videos Downloaded

- Check if target accounts are private (can't scrape private)
- Verify accounts actually have video content
- Check scraper.log for detailed errors

### Video Processing Fails

- Ensure FFmpeg is installed (`ffmpeg -version`)
- Check logo path exists and is a valid PNG
- Verify watermark regions are within video bounds
- Check video_processor.log for errors

### Account Gets Flagged

- **Stop immediately** - don't continue with same account
- Increase delay settings in config.json
- Create a new burner account
- Wait before using again

---

## 📝 Example Workflow

1. **Setup**
   ```bash
   # Configure
   nano config.json

   # Add logo
   cp my_logo.png assets/your_logo.png
   ```

2. **Run**
   ```bash
   python main.py
   ```

3. **Review**
   ```bash
   # Check processed videos
   ls output/processed/

   # View the report
   cat output/results_*.json
   ```

4. **Manual Post**
   - Review videos in `output/processed/`
   - Upload to your repost page manually
   - **Add credit to caption:** "Credit: @original_creator"

---

## 🛠️ Advanced Usage

### Custom Watermark Regions

Some creators put watermarks in different spots:

```json
"watermark_regions": {
  "bottom_left": {      // TikTok-style
    "enabled": true,
    "x": 0,
    "y": "85%",
    "width": 300,
    "height": 80
  },
  "top_left": {         // Some creators
    "enabled": true,
    "x": 0,
    "y": 0,
    "width": 350,
    "height": 100
  }
}
```

### Logo Positioning

```json
"processing": {
  "logo_position": "bottom_right",  // Options: top_left, top_right,
                                     //          bottom_left, bottom_right,
                                     //          bottom_center
  "logo_size": 80
}
```

---

## 📄 License

This tool is provided as-is for educational purposes. Use responsibly.

---

## 🙏 Disclaimer

This tool is for educational purposes only. Users are responsible for:

- Complying with Instagram's Terms of Service
- Respecting copyright and intellectual property
- Properly crediting original content creators
- Understanding and accepting all risks

The developers are not responsible for any misuse or consequences of using this tool.

---

## 📚 Resources

- [Instaloader Documentation](https://instaloader.github.io/)
- [FFmpeg Documentation](https://ffmpeg.org/documentation.html)
- [OpenCV Python](https://docs.opencv.org/4.x/d6/d00/tutorial_py_root.html)
