# Instagram Automation - Complete Setup Guide

## Prerequisites Checklist ✓

Before starting, ensure you have:
- [ ] Python 3.8+ installed
- [ ] Node.js 16+ installed
- [ ] Instagram account (for posting)
- [ ] OpenRouter API key (get free at https://openrouter.ai/keys)
- [ ] (Optional) ManyChat account for comment automation

---

## Phase 1: Install Dependencies (5-10 min)

### 1.1 Backend Python Dependencies

```bash
# Navigate to caption engine
cd backend/caption_engine

# Create and activate virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Navigate to instagram automation
cd ../instagram_automation

# Create and activate virtual environment (recommended)
python3 -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt
```

### 1.2 Frontend Dependencies

```bash
# From project root
cd ../..
npm install
```

---

## Phase 2: Configure Environment Variables (5 min)

### 2.1 Create Environment File

```bash
# From project root
cp .env.local.example .env.local
nano .env.local  # or use your preferred editor
```

### 2.2 Get OpenRouter API Key

1. Go to https://openrouter.ai/keys
2. Sign up (free)
3. Generate an API key
4. Add to `.env.local`:

```bash
OPENROUTER_API_KEY=sk-or-your-key-here
```

### 2.3 Add Instagram Credentials

⚠️ **Important**: Use a secondary/test account, not your main account!

```bash
INSTAGRAM_USERNAME=your_instagram_username
INSTAGRAM_PASSWORD=your_instagram_password
```

### 2.4 (Optional) Configure ManyChat

```bash
MANYCHAT_API_KEY=your_manychat_api_key
```

### 2.5 Complete .env.local Example

```bash
# Caption Engine API (Port 3131)
OPENROUTER_API_KEY=sk-or-v1-...

# Instagram Automation API (Port 4400)
INSTAGRAM_USERNAME=your_username
INSTAGRAM_PASSWORD=your_password

# ManyChat Integration (Port 4401) - Optional
MANYCHAT_API_KEY=your_key_here

# Dashboard (Port 8181)
NEXT_PUBLIC_CAPTION_ENGINE_URL=http://localhost:3131
NEXT_PUBLIC_BACKEND_URL=http://localhost:4400
```

---

## Phase 3: Initialize Databases (2 min)

### 3.1 Initialize Caption Engine Database

```bash
cd backend/caption_engine

# If using venv, activate it first
source venv/bin/activate

# Initialize database and load templates
python -c "
from database_schema import init_database, load_initial_templates
init_database()
load_initial_templates()
print('✅ Caption engine database initialized!')
"
```

### 3.2 Initialize Instagram Automation Database

```bash
cd ../instagram_automation

# If using venv, activate it first
source venv/bin/activate

# Initialize database and load categories
python -c "
from database_schema import init_database, load_initial_categories
init_database()
load_initial_categories()
print('✅ Instagram automation database initialized!')
"
```

### 3.3 Verify Database Initialization

```bash
# Check caption engine database
sqlite3 backend/caption_engine/instagram_captions.db ".tables"
# Should show: captions, caption_templates, categories, etc.

# Check instagram automation database
sqlite3 backend/instagram_automation/instagram_automation.db ".tables"
# Should show: source_content, posted_content, content_queue, etc.
```

---

## Phase 4: Test Core Components (10-15 min)

### 4.1 Test Caption Engine API

```bash
# Terminal 1 - Start Caption Engine
cd backend/caption_engine
source venv/bin/activate
python api.py
```

**Expected Output:**
```
CAPTION ENGINE API
======================================
Server starting on http://localhost:3131
API docs: http://localhost:3131/docs
```

**Test the API:**
```bash
# In a new terminal
curl http://localhost:3131/health
# Should return: {"status":"healthy","database":"connected"}

# Test caption generation
curl -X POST http://localhost:3131/api/generate \
  -H "Content-Type: application/json" \
  -d '{
    "category": "motivation",
    "theme": "morning routine success",
    "target_keyword": "FREE",
    "emotion": "inspiring"
  }'
```

### 4.2 Test Instagram API

```bash
# Terminal 2 - Start Instagram Automation API
cd backend/instagram_automation
source venv/bin/activate
python api.py
```

**Expected Output:**
```
INSTAGRAM AUTOMATION API
======================================
Server starting on http://localhost:4400
API docs: http://localhost:4400/docs
```

**Test the API:**
```bash
# In a new terminal
curl http://localhost:4400/health
# Should return: {"status":"healthy","database":"connected"}

# Check stats
curl http://localhost:4400/api/stats
```

### 4.3 Test Scraper (Optional - Requires Instagram Login)

⚠️ **Warning**: Instagram may flag your account if you login frequently. Use with caution.

```bash
cd backend/instagram_automation

# Test scraper (scrapes a few posts, no saving)
python scraper.py \
  YOUR_USERNAME \
  YOUR_PASSWORD \
  --target instagram \
  --amount 5
```

**Expected Output:**
```
Successfully logged in as YOUR_USERNAME
[1/1] Scraping instagram...
  Found 5 items
```

---

## Phase 5: Start All Services (2 min)

### Option A: Using Startup Script (Recommended)

```bash
# From project root
./start-instagram-automation.sh
```

This will start:
- Caption Engine API (Port 3131)
- Instagram Automation API (Port 4400)
- ManyChat Webhooks (Port 4401)

### Option B: Manual Startup

```bash
# Terminal 1: Caption Engine
cd backend/caption_engine
source venv/bin/activate
python api.py

# Terminal 2: Instagram Automation API
cd backend/instagram_automation
source venv/bin/activate
python api.py

# Terminal 3: ManyChat Webhooks
cd backend/instagram_automation
source venv/bin/activate
python manychat_integration.py

# Terminal 4: Dashboard (in a new terminal)
cd ../..
npm run dev:instagram
```

---

## Phase 6: Access Dashboard & First Run

### 6.1 Open Dashboard

Navigate to: http://localhost:8181/instagram-dashboard

You should see:
- Overview tab with system stats
- Source Content tab (for scraped content)
- Captions tab (for AI-generated captions)
- Schedule tab (for posting queue)
- Analytics tab (performance metrics)

### 6.2 Complete First Workflow

#### Step 1: Scrape Content

```bash
cd backend/instagram_automation

# Scrape from a target account and save to database
python scraper.py \
  YOUR_USERNAME \
  YOUR_PASSWORD \
  --target example_account \
  --amount 10 \
  --save
```

#### Step 2: Generate Captions

```python
# In Python shell or script
from integration import InstagramAutomationWorkflow

workflow = InstagramAutomationWorkflow(
    openrouter_api_key="your_openrouter_key"
)

# Get pending scraped content
pending = workflow.get_pending_content(limit=5)

# Generate captions for each
for item in pending:
    result = workflow.generate_caption_from_source(
        source_id=item['id'],
        category="motivation",
        target_keyword="FREE"
    )
    print(f"Generated caption for {item['account']}")
```

#### Step 3: Review in Dashboard

1. Go to http://localhost:8181/instagram-dashboard
2. Click "Captions" tab
3. Review generated captions
4. Approve the best ones

#### Step 4: Schedule Posts

1. Go to "Schedule" tab
2. Set posting time
3. Add approved captions to queue

#### Step 5: Process Queue

```bash
cd backend/instagram_automation

# Process posting queue (manual)
python auto_poster.py \
  YOUR_USERNAME \
  YOUR_PASSWORD \
  --process-queue

# Or run as daemon (auto-processes)
python auto_poster.py \
  YOUR_USERNAME \
  YOUR_PASSWORD \
  --daemon
```

---

## Phase 7: (Optional) ManyChat Integration

### 7.1 Configure ManyChat

1. Log in to ManyChat
2. Create a new bot or use existing
3. Set up keyword triggers:
   - "FREE" → Sends DM asking for email
   - "GUIDE" → Sends DM asking for email
   - "LINK" → Sends DM asking for email

### 7.2 Configure Webhook URL

Set ManyChat webhook to:
```
http://your-server.com:4401/webhook/comment
```

For local testing, use ngrok:
```bash
# Install ngrok
brew install ngrok  # macOS

# Start ngrok tunnel
ngrok http 4401

# Use the HTTPS URL in ManyChat
# Example: https://abc123.ngrok.io/webhook/comment
```

### 7.3 Test ManyChat Integration

```bash
# Test webhook endpoint
curl -X POST http://localhost:4401/webhook/comment \
  -H "Content-Type: application/json" \
  -d '{
    "comment_id": "test123",
    "commenter_id": "user456",
    "comment_text": "FREE",
    "posted_id": 1
  }'
```

---

## Troubleshooting

### Database Locked Error

```bash
# Remove lock files
rm backend/instagram_automation/instagram_automation.db-wal
rm backend/instagram_automation/instagram_automation.db-shm
rm backend/caption_engine/instagram_captions.db-wal
rm backend/caption_engine/instagram_captions.db-shm
```

### Port Already in Use

```bash
# Find process using port
lsof -ti:3131 | xargs kill -9  # Caption Engine
lsof -ti:4400 | xargs kill -9  # Instagram API
lsof -ti:4401 | xargs kill -9  # ManyChat
```

### Instagram Login Failed

```bash
# Use session file for persistent login
python scraper.py \
  YOUR_USERNAME \
  YOUR_PASSWORD \
  --target account \
  --session session.json
```

### Caption Generation Fails

1. Check OpenRouter API key is valid
2. Check OpenRouter status: https://status.openrouter.ai
3. View caption engine logs: `cat .sessions/caption_engine.log`

### Module Not Found Errors

```bash
# Make sure you're in the correct directory
cd backend/caption_engine  # or instagram_automation

# Activate virtual environment
source venv/bin/activate

# Reinstall dependencies
pip install -r requirements.txt
```

---

## Security Best Practices

1. **Never commit `.env.local` to git**
2. **Use a secondary Instagram account** for automation
3. **Rotate API keys regularly**
4. **Keep dependencies updated**
5. **Monitor rate limits**

---

## Cost Estimates

Using Gemini 2.0 Flash Lite (free tier):
- **100 captions/day**: ~$0.18/month
- **1,000 captions/day**: ~$1.80/month
- **10,000 captions/day**: ~$18/month

---

## Next Steps After Setup

1. ✅ Add scraper target accounts
2. ✅ Test caption generation quality
3. ✅ Set up posting schedule
4. ✅ Configure ManyChat keywords
5. ✅ Monitor first week of performance
6. ✅ Optimize based on analytics

---

## Quick Reference Commands

```bash
# Start everything
./start-instagram-automation.sh

# Stop everything
./stop-instagram-automation.sh

# Check health
curl http://localhost:4400/health

# View logs
cat .sessions/instagram_api.log
cat .sessions/caption_engine.log

# Database stats
sqlite3 backend/instagram_automation/instagram_automation.db "
SELECT 'source_content' as tbl, COUNT(*) as cnt FROM source_content
UNION SELECT 'posted_content', COUNT(*) FROM posted_content
UNION SELECT 'content_queue', COUNT(*) FROM content_queue
"
```

---

**Setup Complete! 🎉**

Your Instagram automation system is now ready to use. Start with small tests and gradually scale up.
