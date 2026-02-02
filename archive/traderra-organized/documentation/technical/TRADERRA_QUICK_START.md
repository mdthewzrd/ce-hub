# Traderra Application - Quick Start Guide

## One-Minute Summary

Traderra is a full-stack AI-powered trading journal application with:
- **Frontend**: Next.js 14 running on **port 6565**
- **Backend**: FastAPI running on **port 6500**
- **Database**: SQLite (dev) or PostgreSQL (production)
- **AI**: Renata agent with Archon knowledge integration

---

## Start the Application (5 Minutes)

### Step 1: Start Backend (Terminal 1)

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend

# Activate Python environment
source venv/bin/activate

# Start server
uvicorn app.main:app --reload --port 6500

# Wait for: "🚀 Traderra API startup complete"
```

### Step 2: Start Frontend (Terminal 2)

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Start Next.js dev server
npm run dev

# Wait for: "▲ Next.js 14.2.0"
# Shows: "- Local: http://localhost:6565"
```

### Step 3: Open in Browser

```bash
open http://localhost:6565
```

---

## Application URLs

| Service | URL | Purpose |
|---------|-----|---------|
| Frontend | http://localhost:6565 | Trading journal UI |
| Backend API | http://localhost:6500 | REST API endpoint |
| API Docs | http://localhost:6500/docs | Swagger documentation |
| Health Check | http://localhost:6500/health | API status |

---

## Project Structure

```
/Users/michaeldurante/ai dev/ce-hub/traderra/
├── frontend/                          # Next.js 14 Application (Port 6565)
│   ├── package.json                   # Scripts: dev, build, start, test
│   ├── next.config.js                 # API rewrites to backend:6500
│   ├── .env.local                     # Environment variables
│   ├── src/
│   │   └── app/                       # Next.js pages & layouts
│   └── prisma/
│       ├── schema.prisma              # Database schema
│       └── dev.db                     # SQLite database (dev)
│
└── backend/                           # FastAPI Application (Port 6500)
    ├── requirements.txt               # Python dependencies
    ├── .env                           # Environment variables
    ├── venv/                          # Python virtual environment
    └── app/
        ├── main.py                    # FastAPI entry point
        ├── api/
        │   ├── ai_endpoints.py        # AI/Renata endpoints
        │   ├── folders.py             # Folder management
        │   └── blocks.py              # Content blocks
        ├── core/
        │   ├── config.py              # Configuration
        │   ├── archon_client.py       # Archon integration
        │   └── database.py            # Database setup
        └── ai/
            └── renata_agent.py        # AI agent logic
```

---

## Port Configuration

### Current Setup

| Component | Port | Config Location |
|-----------|------|-----------------|
| Frontend | 6565 | `frontend/package.json` line 6 |
| Backend | 6500 | `backend/app/main.py` line 330 |

### Port 6565 is Already Configured

```json
{
  "scripts": {
    "dev": "next dev -p 6565",
    "start": "next start -p 6565"
  }
}
```

**To change port 6565**, edit `package.json` scripts or run:
```bash
next dev -p 3000  # Use different port
```

---

## Key Technologies

### Frontend Stack
- **Framework**: Next.js 14.2.0
- **UI Library**: React 18.3.0
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **Database ORM**: Prisma
- **Authentication**: Clerk
- **Testing**: Vitest + Playwright
- **State**: Zustand

### Backend Stack
- **Framework**: FastAPI
- **Language**: Python 3.11+
- **AI**: PydanticAI + OpenAI
- **Knowledge**: Archon MCP
- **Database**: SQLAlchemy + AsyncPG
- **Async**: Uvicorn

### Database
- **Dev**: SQLite (file-based)
- **Production**: PostgreSQL 15+ with pgvector
- **Cache**: Redis (optional)

---

## Available Commands

### Frontend Commands

```bash
npm run dev              # Start dev server on 6565
npm run build           # Production build
npm start               # Run production build
npm run type-check      # TypeScript validation
npm run lint            # ESLint check
npm test               # Run tests
npm test:e2e           # End-to-end tests
npm test:coverage      # Coverage report
```

### Backend Commands

```bash
# With virtual environment activated
uvicorn app.main:app --reload         # Start dev server
python -m pytest                       # Run tests
python -m pytest --cov                # With coverage
python scripts/init_knowledge.py       # Initialize AI knowledge
```

---

## Environment Variables

### Frontend (.env.local)

```env
NEXT_PUBLIC_API_URL=http://localhost:6500
NEXT_PUBLIC_APP_URL=http://localhost:6565
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
OPENAI_API_KEY=sk_...
```

### Backend (.env)

```env
DEBUG=true
DATABASE_URL=postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra
ARCHON_BASE_URL=http://localhost:8181
OPENAI_API_KEY=sk_...
ALLOWED_ORIGINS='["http://localhost:6565","http://localhost:3000"]'
```

---

## Troubleshooting

### Port 6565 Already in Use?

```bash
# Find process
lsof -i :6565

# Kill it
kill -9 <PID>

# Or use different port
next dev -p 3000
```

### Frontend Won't Connect to Backend?

1. Check backend is running on 6500: `curl http://localhost:6500/health`
2. Verify `.env.local` has: `NEXT_PUBLIC_API_URL=http://localhost:6500`
3. Restart frontend after changing env variables

### Dependencies Missing?

```bash
# Frontend
cd frontend && npm install

# Backend
cd backend
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

### Clear Caches

```bash
# Frontend
rm -rf .next node_modules package-lock.json
npm install && npm run dev

# Backend
rm -rf venv __pycache__
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## API Examples

### Health Check
```bash
curl http://localhost:6500/health
```

### AI Query
```bash
curl -X POST http://localhost:6500/ai/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Analyze my performance", "mode": "coach"}'
```

### List Folders
```bash
curl http://localhost:6500/api/folders
```

### View API Docs
```bash
open http://localhost:6500/docs
```

---

## File Locations Reference

| Purpose | Path |
|---------|------|
| Frontend config | `/traderra/frontend/next.config.js` |
| Frontend env | `/traderra/frontend/.env.local` |
| Backend config | `/traderra/backend/app/core/config.py` |
| Backend env | `/traderra/backend/.env` |
| Frontend entry | `/traderra/frontend/src/app/layout.tsx` |
| Backend entry | `/traderra/backend/app/main.py` |
| Database schema | `/traderra/frontend/prisma/schema.prisma` |

---

## Development Workflow

### Make Code Changes

```bash
# Frontend changes
# - Edit files in /traderra/frontend/src/
# - Auto-reload on save (npm run dev running)

# Backend changes
# - Edit files in /traderra/backend/app/
# - Auto-reload on save (--reload flag in uvicorn)
```

### Run Tests

```bash
# Frontend unit tests
cd frontend && npm run test:run

# Frontend E2E tests
cd frontend && npm run test:e2e

# Backend tests
cd backend
source venv/bin/activate
pytest
```

### Build for Production

```bash
# Frontend
npm run build
npm start  # Runs on 6565

# Backend
# Already production-ready with uvicorn
# Use gunicorn for production deployment:
gunicorn -w 4 -k uvicorn.workers.UvicornWorker app.main:app
```

---

## Quick Commands (Copy-Paste)

### Start Everything

```bash
# Terminal 1: Backend
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 6500

# Terminal 2: Frontend
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend && npm run dev

# Then open: http://localhost:6565
```

### Check Status

```bash
# Frontend alive?
curl http://localhost:6565

# Backend alive?
curl http://localhost:6500/health

# Both running?
ps aux | grep -E "node|uvicorn"
```

### Stop Everything

```bash
# Ctrl+C in both terminals
# Or:
lsof -i :6565 -i :6500 | grep LISTEN | awk '{print $2}' | sort -u | xargs kill -9
```

---

## Learning Resources

- **Next.js**: https://nextjs.org/docs
- **FastAPI**: https://fastapi.tiangolo.com
- **Traderra Backend Docs**: `/traderra/backend/README.md`
- **API Documentation**: http://localhost:6500/docs (when running)
- **CE-Hub Integration**: See backend README for Archon details

---

## Summary

1. Port **6565** is the frontend (Next.js)
2. Port **6500** is the backend (FastAPI)
3. Start with: `npm run dev` in frontend directory
4. Access at: http://localhost:6565
5. API docs at: http://localhost:6500/docs

**That's it! You're ready to develop Traderra.**

---

For detailed information, see: `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_APPLICATION_STRUCTURE_GUIDE.md`

