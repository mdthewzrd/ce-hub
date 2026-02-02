# Instagram Automation System - Quick Start Guide

Get your Instagram automation system up and running in 5 minutes.

## Prerequisites

- Python 3.8+
- Node.js 16+
- OpenRouter API key (get free at https://openrouter.ai/keys)
- Instagram account for posting
- (Optional) ManyChat account for comment automation

## Step 1: Install Dependencies

```bash
# Backend dependencies
cd backend/caption_engine
pip install -r requirements.txt

cd ../instagram_automation
pip install -r requirements.txt

# Frontend dependencies (from project root)
cd ../..
npm install
```

## Step 2: Configure Environment

```bash
# Copy environment template
cp .env.local.example .env.local

# Edit with your credentials
nano .env.local
```

Required variables:
```bash
OPENROUTER_API_KEY=sk-or-...      # Get from openrouter.ai/keys
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password
MANYCHAT_API_KEY=your_key         # Optional
```

## Step 3: Initialize Databases

```bash
# Caption engine database
cd backend/caption_engine
python -c "from database_schema import init_database, load_initial_templates; init_database(); load_initial_templates()"

# Instagram automation database
cd ../instagram_automation
python -c "from database_schema import init_database, load_initial_categories; init_database(); load_initial_categories()"
```

## Step 4: Start All Services

### Option A: Use startup script (recommended)

```bash
# From project root
./start-instagram-automation.sh
```

### Option B: Manual startup

```bash
# Terminal 1: Caption Engine (Port 3131)
cd backend/caption_engine
python api.py

# Terminal 2: Instagram Automation API (Port 4400)
cd backend/instagram_automation
python api.py

# Terminal 3: ManyChat Webhooks (Port 4401)
cd backend/instagram_automation
python manychat_integration.py

# Terminal 4: Dashboard (Port 8181)
npm run dev:instagram
```

## Step 5: Access Dashboard

Open your browser to:
```
http://localhost:8181/instagram-dashboard
```

## First-Time Workflow

### 1. Scrape Content

```bash
cd backend/instagram_automation
python scraper.py YOUR_USERNAME YOUR_PASSWORD \
  --target example_account \
  --save \
  --amount 10
```

### 2. Generate Captions

```python
# In Python shell
from integration import InstagramAutomationWorkflow

workflow = InstagramAutomationWorkflow(openrouter_api_key="your_key")

# Generate caption for scraped content
result = workflow.generate_caption_from_source(
    source_id=1,  # ID from database
    category="motivation",
    target_keyword="FREE"
)
```

### 3. Review & Approve

1. Open dashboard: http://localhost:8181/instagram-dashboard
2. Go to "Captions" tab
3. Review generated captions
4. Click "Approve" on good ones

### 4. Schedule Posts

1. Go to "Schedule" tab
2. Set posting time
3. Add to queue

### 5. Auto-Post

```bash
cd backend/instagram_automation
python auto_poster.py YOUR_USERNAME YOUR_PASSWORD --process-queue
```

## API Endpoints

### Caption Engine (Port 3131)
- Docs: http://localhost:3131/docs
- Generate: `POST /api/generate`
- Score: `POST /api/score`
- List: `GET /api/captions`

### Instagram API (Port 4400)
- Docs: http://localhost:4400/docs
- Add source: `POST /api/source`
- Add posted: `POST /api/posted`
- Stats: `GET /api/stats`

### ManyChat (Port 4401)
- Health: `GET /health`
- Webhook: `POST /webhook/comment`

## Troubleshooting

### Port already in use

```bash
# Find process using port
lsof -ti:3131 | xargs kill -9  # Caption Engine
lsof -ti:4400 | xargs kill -9  # Instagram API
lsof -ti:4401 | xargs kill -9  # ManyChat
```

### Database locked

```bash
# Remove lock file
rm backend/instagram_automation/instagram_automation.db-wal
rm backend/instagram_automation/instagram_automation.db-shm
```

### Caption generation fails

1. Check API key is valid
2. Check OpenRouter status: https://status.openrouter.ai
3. System falls back to free templates automatically

### Scraper login failed

```bash
# Use session file
python scraper.py user pass --target account --session session.json
```

## Common Tasks

### Run scraper on schedule

```bash
# Add to crontab (runs daily at 9 AM)
0 9 * * * cd /path/to/project && ./backend/instagram_automation/scraper.py user pass --target account1,account2 --save
```

### Process posting queue automatically

```bash
# Run as daemon
python auto_poster.py user pass --daemon
```

### Generate daily report

```bash
cd backend/instagram_automation
python analytics.py
```

## Cost Estimate

- **Caption Generation**: ~$0.00006 per caption
- **100 captions/day**: ~$0.18/month
- **1,000 captions/day**: ~$1.80/month

## Next Steps

1. Set up ManyChat keyword triggers
2. Configure affiliate links
3. Set optimal posting times
4. Add more scraper targets
5. Review analytics and optimize

## Support

For detailed documentation, see:
- `backend/instagram_automation/README.md`
- `backend/caption_engine/README.md`

For issues, check logs in `.sessions/` directory.
