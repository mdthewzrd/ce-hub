# Traderra Quick Start Guide

## What You Have

A complete AI-powered trading journal system with three components:

1. **Frontend** - Modern React/Next.js UI on port 6565
2. **Backend** - FastAPI with Renata AI on port 6500
3. **Knowledge** - Archon MCP on port 8051 (manages knowledge/learning)

## Quick Commands

### Start the Frontend (React UI)
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm install                    # First time only
npm run dev                    # Runs on http://localhost:6565
```

### Start the Backend (API)
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend
source venv/bin/activate       # Activate Python environment
python scripts/init_knowledge.py  # Initialize knowledge (first time)
uvicorn app.main:app --reload --port 6500  # Runs API on port 6500
```

### Check Backend Health
```bash
# Quick health check
curl http://localhost:6500/health

# Check Archon connectivity
curl http://localhost:6500/debug/archon

# Interactive API docs
# Open: http://localhost:6500/docs
```

## What's Currently Working

✓ Journal page with folder structure
✓ Create/delete entries
✓ Search and filtering
✓ Template-based documents
✓ Renata AI sidebar (chat)
✓ Display mode switching
✓ Folder tree navigation

## Important Locations

- **Journal page:** `/traderra/frontend/src/app/journal/page.tsx`
- **Folder components:** `/traderra/frontend/src/components/folders/`
- **Journal components:** `/traderra/frontend/src/components/journal/`
- **Backend main:** `/traderra/backend/app/main.py`
- **Configuration:** Check `.env` files in frontend and backend

## Database Status

- **Frontend:** SQLite (local file)
- **Backend:** PostgreSQL (requires setup)
- **Cache:** Redis (optional but recommended)

## Current Mock Data

The journal page uses mock data for testing. Real entries will display once backend API is integrated:
- Sample trade entries
- Sample daily reviews
- Sample folder structure

## Next Steps for Development

1. **Start frontend:** `npm run dev` in frontend folder
2. **Start backend:** `uvicorn` command in backend folder
3. **Test integration:** Check if frontend API calls reach backend
4. **Connect to database:** Wire up real PostgreSQL for persistence
5. **Enable Archon:** Ensure Archon MCP is running on 8051

## Key Files to Know

- **Main Journal:** `traderra/frontend/src/app/journal/page.tsx` (939 lines)
- **Folder Tree:** `traderra/frontend/src/components/folders/FolderTree.tsx`
- **API Documentation:** `traderra/backend/README.md`
- **This Report:** `TRADERRA_PROJECT_EXPLORATION.md`

## Architecture at a Glance

```
User Opens Journal
        ↓
Frontend (React/Next.js on 6565)
        ↓
Backend API (FastAPI on 6500)
        ↓
Archon MCP (Knowledge on 8051)
        ↓
PostgreSQL Database + Redis Cache
```

## Troubleshooting

**Frontend won't start?**
- Check Node.js is installed: `node --version`
- Delete node_modules and reinstall: `rm -rf node_modules && npm install`

**Backend won't start?**
- Check Python 3.11+: `python --version`
- Activate venv: `source venv/bin/activate`
- Install deps: `pip install -r requirements.txt`

**Port already in use?**
- Frontend: Change port in `package.json` dev script
- Backend: Change port in uvicorn command
- Check what's using ports: `lsof -i :6565` or `:6500`

## Contact Points

- **Frontend questions:** Check React/Next.js files
- **Backend questions:** Check FastAPI files in app/
- **AI integration:** Look in app/ai/ folder
- **Database:** Check migrations folder

---

**Last Updated:** November 9, 2025
**Status:** Ready for development and testing
