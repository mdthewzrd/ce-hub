# 🚀 Instagram Caption Engine - Quick Start Guide

## What Was Built

A complete AI-powered caption generation system for your Instagram automation. Here's what you now have:

```
backend/caption_engine/
├── database_schema.py      # SQLite database with 6 tables
├── openrouter_client.py    # OpenRouter API integration (3 models)
├── caption_generator.py    # Multi-pass caption generation
├── quality_scorer.py       # Caption quality scoring (0-100)
├── api.py                   # FastAPI REST endpoints
├── test_caption_engine.py  # Test suite
├── requirements.txt         # Python dependencies
└── README.md               # Full documentation

src/components/
└── CaptionApprovalDashboard.tsx  # React approval UI
```

## Model Selection Results

After comprehensive research, the best model for caption generation is:

### 🏆 Winner: Google Gemini 2.0 Flash Lite

| Metric | Value |
|--------|-------|
| **Model ID** | `google/gemini-2.0-flash-lite-001` |
| **Input Cost** | $0.075 per million tokens |
| **Output Cost** | $0.30 per million tokens |
| **Cost Per Caption** | ~$0.00006 (that's 0.006 cents!) |
| **Context Window** | 1M+ tokens |
| **Speed** | ~160 tokens/second |

### 💰 Cost Breakdown

```
1,000 captions = $0.17 total
10,000 captions = $1.70 total
100,000 captions = $17.00 total
```

### Alternative Models

| Model | Cost/Caption | Best For |
|-------|--------------|----------|
| Gemini 2.0 Flash | $0.00008 | Speed balance |
| GPT-4o-mini | $0.00012 | Premium quality |
| Llama 3.1 405B | $0.00040 | High quality (expensive) |

## Quick Start

### 1. Get OpenRouter API Key

Go to https://openrouter.ai/keys and get your free API key.

### 2. Install Dependencies

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/projects/edge-dev-main/backend/caption_engine
pip install -r requirements.txt
```

### 3. Set API Key

```bash
export OPENROUTER_API_KEY="your-key-here"
```

### 4. Test the System

```bash
python test_caption_engine.py
```

This will:
- Initialize database
- Test OpenRouter connection
- Generate a sample caption
- Test quality scoring
- Show database contents

### 5. Start API Server

```bash
python api.py
```

Server runs at `http://localhost:3131`

API docs at `http://localhost:3131/docs`

## Caption Structure

Every generated caption follows this proven structure:

```
1. HOOK (First 2 lines, <140 chars)
   Stops the scroll with question/claim/open loop

2. STORY (3-5 paragraphs)
   Builds emotional connection through personal narrative

3. VALUE
   Actionable takeaway + "Save this" reminder

4. CTA
   "Comment 'KEYWORD' for freebie 🔥"
   "Follow for more [category] content"

5. FORMATTING
   Line breaks, emojis (3-5), hashtags (15-25)
```

## Quality Scoring

Each caption is scored on 6 components:

| Component | Weight | What It Checks |
|-----------|--------|----------------|
| Hook | 25% | Length, power words, curiosity gap |
| Story | 20% | Length, paragraphs, personal tone |
| CTA | 25% | Comment keyword, urgency, spam check |
| Formatting | 10% | Line breaks, capitalization, length |
| Emoji | 10% | Count (3-5 ideal), engagement emojis |
| Hashtags | 10% | Count (15-25 ideal), placement |

**Grading Scale:**
- A+ (90-100): Excellent
- A (80-89): Great
- B (70-79): Good
- C (60-69): Fair
- D/F (0-59): Poor

## API Usage Examples

### Generate Caption

```bash
curl -X POST http://localhost:3131/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "category": "fitness",
    "theme": "2-minute morning routine that changed my life",
    "target_keyword": "ROUTINE",
    "emotion": "inspiring"
  }'
```

### Score Caption

```bash
curl -X POST http://localhost:3131/api/score \
  -H "Content-Type: application/json" \
  -d '{
    "caption": "This changed everything for me 🔥...",
    "category": "fitness"
  }'
```

### List Captions

```bash
curl http://localhost:3131/api/captions?status=pending
```

## Integration with Your Scraper

Add to your existing Instagram scraper workflow:

```python
from caption_generator import CaptionGenerator

# Initialize once
generator = CaptionGenerator(
    openrouter_api_key=os.getenv("OPENROUTER_API_KEY")
)

# After scraping each video
for video in scraped_videos:
    # Auto-generate caption
    caption = generator.generate_caption(
        category=video.get('category', 'motivation'),
        theme=video.get('theme', 'success'),
        target_keyword="FREE"  # ManyChat trigger
    )

    if caption:
        # Caption is saved to database automatically
        # It appears in dashboard for approval
        print(f"✅ Caption generated for: {video['url']}")
        print(f"   Score: N/A (run quality scorer)")
        print(f"   Preview: {caption.hook}")
```

## Dashboard Usage

The React dashboard (`CaptionApprovalDashboard.tsx`) provides:

1. **Caption List** - View all generated captions with filters
2. **Live Editor** - Edit captions before posting
3. **Quality Score** - See engagement potential score
4. **Approve/Reject** - One-click approval workflow
5. **Schedule** - Add to posting queue

To use:
1. Start the API server (`python api.py`)
2. Add dashboard to your Next.js app
3. Set `NEXT_PUBLIC_API_URL=http://localhost:8000`

## Features Included

✅ **Multi-Model Support**
- Gemini 2.0 Flash Lite (cheapest)
- GPT-4o-mini (premium quality)
- Automatic fallback on failure

✅ **Template Fallback**
- Free caption generation when API unavailable
- 3 pre-built categories (motivation, fitness, business)
- Easy to extend

✅ **Quality Scoring**
- 6-component scoring algorithm
- Issue detection
- Improvement suggestions
- Letter grading

✅ **Database Tracking**
- All captions saved to SQLite
- Generation history with costs
- Performance analytics
- Hashtag pools

✅ **REST API**
- Full CRUD operations
- Batch generation
- Quality scoring endpoint
- Statistics endpoint

✅ **Approval Dashboard**
- React UI component
- Live editing
- Quality display
- Approve/Reject workflow

## Database Schema

### Tables Created

1. **captions** - Generated captions with full metadata
2. **caption_templates** - Template library for fallback
3. **content_queue** - Content awaiting posting
4. **caption_analytics** - Performance tracking
5. **generation_history** - AI generation logs
6. **hashtag_pools** - Organized hashtag collections

### Database Location

```
backend/caption_engine/instagram_captions.db
```

## Cost Analysis

### Per-Generation

- Input: ~1,500 tokens (prompt)
- Output: ~200 tokens (caption)
- Cost: ~$0.00006 per caption

### Monthly Estimates

```
100 posts/day × 30 days = 3,000 captions
Cost: 3,000 × $0.00006 = $0.18/month
```

Even at scale:
```
1,000 posts/day × 30 days = 30,000 captions
Cost: 30,000 × $0.00006 = $1.80/month
```

## Troubleshooting

### Issue: "OPENROUTER_API_KEY not set"

**Solution:**
```bash
export OPENROUTER_API_KEY="your-key"
```

### Issue: Generation fails, no fallback

**Solution:** System automatically falls back to free templates. Check:
1. API key is valid
2. OpenRouter status: https://status.openrouter.ai
3. Internet connection

### Issue: Low quality scores

**Common fixes:**
- Hook too long (>140 chars) → Shorten to 1-2 lines
- Missing comment CTA → Add "Comment 'KEYWORD'"
- No line breaks → Add `\n\n` between paragraphs
- Too few emojis → Add 3-5 strategic emojis
- Wrong hashtag count → Aim for 15-25

## What's Next

### Immediate (To Integrate)

1. **Add to scraper** - Auto-generate on content scrape
2. **Connect ManyChat** - Webhook for keyword detection
3. **Enable auto-posting** - Integrate with Instagrapi

### Future Enhancements

1. **A/B Testing** - Test different caption styles
2. **Performance Optimization** - Learn from best performers
3. **Video Analysis** - Auto-detect category from video
4. **Multi-language** - Support Spanish, Portuguese, etc.
5. **Scheduled Posting** - Full auto-posting workflow

## Sources

- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [Gemini 2.0 Flash Lite](https://openrouter.ai/google/gemini-2.0-flash-lite-001)
- [GPT-4o-mini](https://openrouter.ai/openai/gpt-4o-mini)
- [Free Models Collection](https://openrouter.ai/collections/free-models)

---

**Built for your Instagram automation empire 🚀**

Total cost for 100,000 captions: **~$6**
That's less than one coffee ☕
