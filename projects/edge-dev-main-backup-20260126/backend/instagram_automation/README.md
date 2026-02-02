# Instagram Automation System

Complete Instagram automation system with AI caption generation, content scraping, auto-posting, and affiliate marketing integration.

## Features

- **AI Caption Generation**: Multi-model caption generation using OpenRouter
- **Content Scraping**: Scrape high-performing content from target accounts
- **Quality Scoring**: Automatic caption quality scoring (0-100)
- **Auto-Posting**: Scheduled posting with Instagrapi
- **ManyChat Integration**: Keyword-triggered email capture automation
- **Analytics Dashboard**: Performance tracking and insights
- **Affiliate Tracking**: Click and conversion tracking
- **Dual Database**: Separate source content and posted content tracking

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                    INSTAGRAM AUTOMATION STACK                  │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Content     │ -> │ Caption Engine  │ -> │ Posted       │  │
│  │ Scraper     │    │ (AI Generation) │    │ Content      │  │
│  │             │    │ (Port 3131)     │    │ Database     │  │
│  └─────────────┘    └─────────────────┘    └──────────────┘  │
│         │                     │                     │          │
│         v                     v                     v          │
│  ┌─────────────┐    ┌─────────────────┐    ┌──────────────┐  │
│  │ Source      │    │ Approval        │    │ Auto         │  │
│  │ Content     │    │ Dashboard       │    │ Poster       │  │
│  │ Database    │    │ (React UI)      │    │ (Instagrapi) │  │
│  └─────────────┘    └─────────────────┘    └──────────────┘  │
│                                   │                     │          │
│                                   v                     v          │
│                          ┌────────────────────────────────────┐ │
│                          │  ManyChat Webhook & Analytics   │ │
│                          └────────────────────────────────────┘ │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

## Directory Structure

```
backend/instagram_automation/
├── database_schema.py       # Complete database schema
├── api.py                   # FastAPI REST endpoints (Port 4400)
├── integration.py           # Integration layer between components
├── scraper.py               # Instagram content scraper
├── auto_poster.py           # Automated posting with Instagrapi
├── manychat_integration.py  # ManyChat webhook handler (Port 4401)
├── analytics.py             # Performance analytics module
├── requirements.txt         # Python dependencies
└── README.md               # This file

backend/caption_engine/
├── database_schema.py       # Caption engine database
├── openrouter_client.py     # OpenRouter API client
├── caption_generator.py     # Multi-pass caption generation
├── quality_scorer.py        # Caption quality scoring
├── api.py                   # Caption engine API (Port 3131)
├── test_caption_engine.py  # Test suite
└── requirements.txt         # Dependencies

src/app/instagram-dashboard/
└── page.tsx                # Unified React dashboard (Port 8181)
```

## Installation

### 1. Install Dependencies

```bash
# Caption engine dependencies
cd backend/caption_engine
pip install -r requirements.txt

# Instagram automation dependencies
cd ../instagram_automation
pip install -r requirements.txt
```

### 2. Set Environment Variables

Create `.env.local` in the project root:

```bash
# Caption Engine (Port 3131)
OPENROUTER_API_KEY=your_openrouter_api_key_here

# Instagram Automation (Port 4400)
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password

# ManyChat Integration (Port 4401)
MANYCHAT_API_KEY=your_manychat_api_key

# Dashboard (Port 8181)
NEXT_PUBLIC_CAPTION_ENGINE_URL=http://localhost:3131
NEXT_PUBLIC_BACKEND_URL=http://localhost:4400
```

### 3. Initialize Databases

```bash
# Initialize caption engine database
cd backend/caption_engine
python -c "from database_schema import init_database, load_initial_templates; init_database(); load_initial_templates()"

# Initialize Instagram automation database
cd ../instagram_automation
python -c "from database_schema import init_database, load_initial_categories; init_database(); load_initial_categories()"
```

## Usage

### Start All Services

```bash
# Terminal 1: Caption Engine API (Port 3131)
cd backend/caption_engine
python api.py

# Terminal 2: Instagram Automation API (Port 4400)
cd backend/instagram_automation
python api.py

# Terminal 3: ManyChat Webhooks (Port 4401)
cd backend/instagram_automation
python manychat_integration.py

# Terminal 4: React Dashboard (Port 8181)
npm run dev:instagram
```

### Using the Scraper

```bash
# Scrape from a single account
cd backend/instagram_automation
python scraper.py your_username your_password --target example_account --save

# Scrape from multiple accounts
python scraper.py your_username your_password --target account1,account2,account3 --save --amount 50
```

### Generate Captions

```python
from integration import InstagramAutomationWorkflow

workflow = InstagramAutomationWorkflow(openrouter_api_key="your_key")

# Scrape and generate in one step
scraped_content = {
    "original_url": "https://instagram.com/p/ABC123/",
    "account": "example_account",
    "content_type": "reel",
    "original_likes": 5000,
    "original_comments": 200,
    "description": "Amazing morning routine content"
}

result = workflow.scrape_and_generate(
    scraped_content=scraped_content,
    category="motivation",
    target_keyword="FREE"
)
```

### Auto-Post Content

```bash
# Process posting queue
cd backend/instagram_automation
python auto_poster.py your_username your_password --process-queue

# Run as daemon (continuously processes queue)
python auto_poster.py your_username your_password --daemon
```

## API Endpoints

### Caption Engine (Port 3131)

- `POST /api/generate` - Generate single caption
- `POST /api/batch` - Generate batch captions
- `POST /api/score` - Score caption quality
- `GET /api/captions` - List captions
- `PUT /api/captions/{id}/status` - Update caption status

### Instagram Automation (Port 4400)

- `POST /api/source` - Add scraped content
- `GET /api/source` - List source content
- `POST /api/posted` - Add content to post
- `GET /api/posted` - List posted content
- `PUT /api/posted/{id}/status` - Update post status
- `POST /api/scraper/targets` - Add scraper target
- `GET /api/stats` - System statistics

### ManyChat Integration (Port 4401)

- `POST /webhook/comment` - Comment webhook handler
- `POST /webhook/email` - Email capture handler
- `GET /stats/{posted_id}` - Get keyword stats

## Dashboard

Access the unified dashboard at `http://localhost:8181/instagram-dashboard`

Features:
- Overview with real-time stats
- Source content management
- Caption approval workflow
- Content calendar
- Performance analytics

## ManyChat Setup

### 1. Create Keyword Triggers

In ManyChat, create keyword triggers for your target keywords (e.g., "FREE", "GUIDE", "LINK").

### 2. Configure Webhook URL

Set up ManyChat to send webhooks to:
```
http://your-server.com:4401/webhook/comment
```

### 3. Email Capture Flow

Create a ManyChat flow that:
1. Triggers on keyword comment
2. Sends a DM asking for email
3. Captures email and sends to `/webhook/email`

## Cost Estimation

### Caption Generation
Using Gemini 2.0 Flash Lite:
- **1,000 captions**: ~$0.17
- **10,000 captions**: ~$1.70
- **100,000 captions**: ~$17.00

### Monthly Estimates
- **100 posts/day**: $0.18/month
- **1,000 posts/day**: $1.80/month

## Database Schema

### Source Content Tables
- `source_content` - Scraped content library
- `source_content_analytics` - Performance tracking over time
- `content_categories` - Content categorization
- `scraper_targets` - Scraper configuration
- `scraper_runs` - Scraper execution logs

### Posted Content Tables
- `posted_content` - Our published posts
- `posted_content_analytics` - Performance tracking
- `content_queue` - Posting queue
- `manychat_interactions` - Comment keyword tracking

### Affiliate Tables
- `affiliate_campaigns` - Campaign management
- `affiliate_events` - Click and conversion tracking

## Troubleshooting

### Caption Engine Not Responding
```bash
# Check if API is running
curl http://localhost:3131/health

# Check API key
echo $OPENROUTER_API_KEY
```

### Scraper Login Failed
```bash
# Try with session file
python scraper.py username password --target account --session session.json
```

### Auto-Post Queue Not Processing
```bash
# Check queue status
curl http://localhost:4400/api/stats

# Manually process queue
python auto_poster.py username password --process-queue
```

## Roadmap

- [ ] Video content analysis for auto-categorization
- [ ] A/B testing for captions
- [ ] Multi-account support
- [ ] Advanced scheduling with optimal times
- [ ] Instagram Story automation
- [ ] Comment automation
- [ ] Advanced analytics with ML predictions

## License

MIT

## Support

For issues or questions, check the documentation or create an issue in the repository.
