# TRADERRA PROJECT - QUICK SUMMARY
**Date:** October 30, 2025

## What is "Traderra 6565"?

**Port 6565** is the frontend development/production port where the Traderra trading journal application runs.

### Quick Facts
- **Frontend URL:** http://localhost:6565
- **Backend URL:** http://localhost:6500
- **Technology:** Next.js 14 (TypeScript/React)
- **Config File:** `traderra/frontend/package.json`

### Start It Up (5 Minutes)
```bash
# Terminal 1: Backend (port 6500)
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 6500

# Terminal 2: Frontend (port 6565)
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm run dev

# Then open: http://localhost:6565
```

---

## What is "Renata Functionality"?

**Renata** is Traderra's AI coaching agent that analyzes trading performance. It operates in three modes:

### Three Renata Modes

| Mode | Tone | Focus | Use Case |
|------|------|-------|----------|
| **Analyst** | Direct, clinical | Raw data truth | Want unfiltered metrics |
| **Coach** (Default) | Professional, constructive | Results + suggestions | Want actionable feedback |
| **Mentor** | Reflective, narrative | Understanding patterns | Want psychological insights |

### How Renata Works

```
1. PLAN: User selects mode (analyst/coach/mentor)
2. RESEARCH: Query Archon knowledge graph for context
3. PRODUCE: AI generates mode-appropriate response
4. INGEST: Insights stored back to Archon for learning
```

### Current Implementation Status

**Backend:** COMPLETE
- File: `/traderra/backend/app/ai/renata_agent.py` (423 lines)
- All three modes fully implemented
- Archon integration working
- PydanticAI agents configured

**Frontend:** IN PROGRESS
- File: `/traderra/frontend/src/components/dashboard/renata-chat.tsx`
- Embedded version: DONE
- Standalone version: BEING INTEGRATED
- Currently refactoring `journal/page.tsx` to use standalone component

### Key Files
```
Backend:
  /traderra/backend/app/ai/renata_agent.py         (Main agent - 423 lines)
  /traderra/backend/app/api/ai_endpoints.py        (API routes)
  /traderra/backend/app/core/archon_client.py      (Knowledge graph connection)

Frontend:
  /traderra/frontend/src/components/dashboard/renata-chat.tsx
  /traderra/frontend/src/components/chat/standalone-renata-chat.tsx
  /traderra/frontend/src/app/journal/page.tsx      (BEING MODIFIED)
```

### API Endpoints
```
POST   /ai/query              # Chat with Renata
POST   /ai/analyze            # Performance analysis
GET    /ai/modes              # Available modes
GET    /ai/knowledge/search   # Search Archon
POST   /ai/knowledge/ingest   # Save insights to Archon
```

---

## Project Structure at a Glance

```
traderra/
├── frontend/                 # Next.js 14 (Port 6565)
│   ├── src/app/
│   │   ├── journal/         # Main journal view
│   │   ├── dashboard/       # Dashboard
│   │   └── [other pages]
│   ├── src/components/
│   │   ├── dashboard/
│   │   │   └── renata-chat.tsx
│   │   ├── journal/         # Journal components
│   │   └── [other components]
│   ├── package.json         # Scripts with "dev": "next dev -p 6565"
│   └── next.config.js       # API rewrites to localhost:6500
│
└── backend/                 # FastAPI (Port 6500)
    ├── app/
    │   ├── ai/
    │   │   └── renata_agent.py
    │   ├── api/
    │   │   ├── ai_endpoints.py
    │   │   ├── folders.py
    │   │   └── blocks.py
    │   ├── core/
    │   │   ├── archon_client.py
    │   │   ├── config.py
    │   │   └── auth.py
    │   └── main.py
    └── requirements.txt
```

---

## Current Development Status

### Modified Files
```
M traderra/frontend/src/app/journal/page.tsx
  - Adding: useFolderContentCounts hook
  - Removing: Large mock data arrays
  - Changing: RenataChat import to StandaloneRenataChat
```

### What Was Done Recently (Last 5 Commits)
1. 97c3a58 - Fix journal system integration issues
2. 784f6eb - Remove traderra project from CE-Hub repository
3. 143f07f - Remove all Next.js build artifacts
4. adc3ab8 - Fix GitHub file size limits
5. fc9bcd0 - Merge CE-Hub v2.0.0 (Vision Intelligence Integration)

### What Needs to Happen Next
1. Complete journal/page.tsx refactoring
2. Test folder content counting
3. Validate Renata mode switching
4. Verify Archon integration

---

## Understanding the Flow

### Port 6565 Frontend → Port 6500 Backend

```
User Action on Frontend (6565)
    ↓
API Request: /api/backend/ai/analyze
    ↓
next.config.js rewrites to:
    /api/analyze → http://localhost:6500/api/analyze
    ↓
Backend (6500) processes request
    ↓
Calls Renata Agent
    ↓
Queries Archon (localhost:8051)
    ↓
Returns response
    ↓
Frontend displays result
```

### Technology Stack

**Frontend (6565):**
- Next.js 14, React 18, TypeScript
- Tailwind CSS, Zustand state management
- Recharts, Tiptap editor, CopilotKit

**Backend (6500):**
- FastAPI, Python 3.11+
- SQLAlchemy ORM, SQLite (dev)/PostgreSQL (prod)
- PydanticAI, OpenAI GPT-4
- Archon MCP for knowledge graph

---

## Common Commands

```bash
# Start frontend (port 6565)
cd traderra/frontend && npm run dev

# Start backend (port 6500)
cd traderra/backend && source venv/bin/activate && uvicorn app.main:app --reload

# Test frontend
cd traderra/frontend && npm test

# Test backend
cd traderra/backend && pytest

# Check if ports are free
lsof -i :6565   # Frontend
lsof -i :6500   # Backend

# API documentation (when running)
open http://localhost:6500/docs
```

---

## Key Documentation Files

**For Different Needs:**

- **5-minute intro:** `/TRADERRA_QUICK_START.md`
- **Port 6565 config:** `/PORT_6565_CONFIGURATION_GUIDE.md`
- **Architecture details:** `/TRADERRA_APPLICATION_STRUCTURE_GUIDE.md`
- **Design system:** `/traderra-organized/documentation/brand-system/`
- **Complete overview:** `/TRADERRA_COMPREHENSIVE_OVERVIEW.md` (NEW - this reference)

---

## Quick Reference: Renata Modes

### Analyst Mode
```javascript
// Clinical, direct, metric-driven
"Expectancy fell 0.2R. Entry timing variance increased. 
Risk exceeded threshold in 3 trades."
```

### Coach Mode (Default)
```javascript
// Professional, constructive, actionable
"You performed better managing losses this week. 
Focus on execution timing to stabilize expectancy."
```

### Mentor Mode
```javascript
// Reflective, narrative, psychological insights
"You showed steadiness under pressure. 
The expectancy deviation stemmed from subtle confidence shifts. 
Let's examine where conviction wavered."
```

---

## Troubleshooting

### Port 6565 In Use?
```bash
lsof -i :6565
kill -9 <PID>
# Or use different port: next dev -p 3000
```

### Backend Won't Connect?
1. Check backend running: `curl http://localhost:6500/health`
2. Check `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:6500`
3. Restart frontend

### Dependencies Missing?
```bash
# Frontend
cd frontend && npm install

# Backend
cd backend && python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Important Locations

```
Main Project: /Users/michaeldurante/ai dev/ce-hub/
Frontend Config: /traderra/frontend/package.json
Backend Config: /traderra/backend/app/main.py
Renata Code: /traderra/backend/app/ai/renata_agent.py
API Routes: /traderra/backend/app/api/ai_endpoints.py
Current Work: /traderra/frontend/src/app/journal/page.tsx (MODIFIED)
```

---

**Last Updated:** October 30, 2025  
**Status:** Ready for Development  
**See Also:** TRADERRA_COMPREHENSIVE_OVERVIEW.md for complete details
