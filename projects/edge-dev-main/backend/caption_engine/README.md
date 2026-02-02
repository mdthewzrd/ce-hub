# 🤖 Instagram Caption Engine

AI-powered caption generation system for Instagram automation with OpenRouter integration.

## Features

- ✨ **Multi-Model AI Generation** - Uses cheapest models (Gemini Flash Lite ~$0.00006/caption)
- 📝 **Template Fallback** - Free template-based generation when API fails
- 🎯 **Quality Scoring** - Automatic caption quality analysis
- 📊 **Performance Tracking** - Database-driven analytics
- 🚀 **Batch Generation** - Generate multiple captions in background
- 💅 **Approval Dashboard** - React UI for reviewing and editing captions

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    CAPTION ENGINE STACK                         │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Content     │ -> │ AI Caption      │ -> │ Quality      │  │
│  │ Queue       │    │ Generator       │    │ Scorer       │  │
│  └─────────────┘    │ (OpenRouter)    │    └──────────────┘  │
│                     └─────────────────┘           │          │
│                              │                    │          │
│                              v                    v          │
│                     ┌─────────────────┐    ┌──────────────┐  │
│                     │ SQLite Database │    │ Approval     │  │
│                     │ (Captions,      │    │ Dashboard    │  │
│                     │  Analytics)     │    │ (React UI)   │  │
│                     └─────────────────┘    └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Model Selection

| Model | Input | Output | Best For | Cost/Caption |
|-------|-------|--------|----------|--------------|
| **Gemini 2.0 Flash Lite** ⭐ | $0.075/M | $0.30/M | Bulk generation | ~$0.00006 |
| GPT-4o-mini | $0.15/M | $0.60/M | Premium quality | ~$0.00012 |
| Gemini 2.0 Flash | $0.10/M | $0.40/M | Speed balance | ~$0.00008 |

## Installation

### 1. Install Dependencies

```bash
cd backend/caption_engine
pip install -r requirements.txt
```

### 2. Set API Key

Get your OpenRouter API key at https://openrouter.ai/keys

```bash
export OPENROUTER_API_KEY="your-api-key-here"
```

Or add to `.env`:

```
OPENROUTER_API_KEY=your-api-key-here
```

### 3. Initialize Database

```bash
python -c "from database_schema import init_database, load_initial_templates; init_database(); load_initial_templates()"
```

## Usage

### Start API Server

```bash
python api.py
```

Server runs at `http://localhost:3131`

API docs: `http://localhost:3131/docs`

### Generate Caption (Python)

```python
from caption_generator import CaptionGenerator

# Initialize
generator = CaptionGenerator(openrouter_api_key="your-api-key")

# Generate single caption
caption = generator.generate_caption(
    category="fitness",
    theme="2-minute morning routine",
    target_keyword="ROUTINE",
    emotion="inspiring"
)

print(caption.full_caption)
```

### Generate Caption (API)

```bash
curl -X POST http://localhost:3131/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "category": "fitness",
    "theme": "2-minute morning routine",
    "target_keyword": "ROUTINE"
  }'
```

### Score Caption Quality

```python
from quality_scorer import score_caption_and_suggest

result = score_caption_and_suggest(caption_text, "fitness")
print(f"Score: {result['overall_score']}/100 ({result['grade']})")
print(f"Issues: {result['issues']}")
print(f"Suggestions: {result['suggestions']}")
```

## API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/` | GET | API info |
| `/health` | GET | Health check |
| `/api/generate` | POST | Generate single caption |
| `/api/batch` | POST | Generate batch captions |
| `/api/score` | POST | Score caption quality |
| `/api/captions` | GET | List captions |
| `/api/captions/{id}` | GET | Get caption by ID |
| `/api/captions/{id}/status` | PUT | Update caption status |
| `/api/queue` | GET/POST | Manage posting queue |
| `/api/stats` | GET | Generation statistics |

## Database Schema

### Tables

- **`captions`** - Generated captions with metadata
- **`caption_templates`** - Template library for fallback
- **`content_queue`** - Content awaiting posting
- **`caption_analytics`** - Performance tracking
- **`generation_history`** - AI generation logs
- **`hashtag_pools`** - Organized hashtag collections

## Caption Structure

Each generated caption includes:

1. **Hook** (First 2 lines) - Stops the scroll
2. **Story** (3-5 paragraphs) - Builds emotional connection
3. **Value** - Actionable takeaway
4. **CTA** - Comment keyword + ManyChat trigger
5. **Formatting** - Line breaks, emojis, hashtags

## Quality Scoring

Captions are scored on:
- Hook quality (25%)
- Story engagement (20%)
- CTA effectiveness (25%)
- Formatting (10%)
- Emoji usage (10%)
- Hashtag optimization (10%)

**Grade Scale:**
- A+ (90-100): Excellent
- A (80-89): Great
- B (70-79): Good
- C (60-69): Fair
- D (50-59): Poor
- F (0-49): Fail

## Cost Estimation

```
1,000 captions with Gemini Flash Lite:
Input: 1.5M tokens × $0.075/M = $0.1125
Output: 200K tokens × $0.30/M = $0.06
Total: $0.17 for 1,000 captions
Per caption: ~$0.00017
```

## Integration with Scraper

Add to your existing scraper:

```python
# After scraping content
for video in scraped_videos:
    caption = generator.generate_caption(
        category=video['category'],
        theme=video['theme'],
        target_keyword="FREE"
    )

    # Save to database for review
    # Link to video in content_queue
```

## Dashboard

The React dashboard (`CaptionApprovalDashboard.tsx`) provides:

- 📋 Caption list with filters
- ✏️ Live caption editing
- 📊 Quality score display
- ✅ Approve/Reject buttons
- 📅 Schedule posting

## Troubleshooting

### "OPENROUTER_API_KEY not set"

Set the environment variable:

```bash
export OPENROUTER_API_KEY="your-key"
```

### "Caption generation failed"

1. Check API key is valid
2. Check OpenRouter status: https://status.openrouter.ai
3. System falls back to free templates automatically

### Low quality scores

Common issues:
- Hook too long (>140 chars) or too short
- Missing comment CTA
- No line breaks
- Too few/too many emojis
- Hashtag count wrong (aim for 15-25)

## Roadmap

- [ ] Auto-posting integration (Instagrapi)
- [ ] ManyChat webhook integration
- [ ] A/B testing for captions
- [ ] Performance-based optimization
- [ ] Multi-language support
- [ ] Video analysis for auto-category detection

## License

MIT

## Sources

- [OpenRouter Models](https://openrouter.ai/models)
- [OpenRouter Pricing](https://openrouter.ai/pricing)
- [Gemini 2.0 Flash Lite](https://openrouter.ai/google/gemini-2.0-flash-lite-001)
- [GPT-4o-mini](https://openrouter.ai/openai/gpt-4o-mini)
