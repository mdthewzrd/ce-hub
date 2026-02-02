# Traderra Project - Quick Navigation & Commands

**Quick Reference for Common Tasks and File Locations**

---

## Project Locations

### Root Directory
```
/Users/michaeldurante/ai\ dev/ce-hub/
```

### Working Directories
```
traderra/                    # Active development directory
├── frontend/                # Next.js application
├── backend/                 # Python FastAPI server
└── [docs]                   # Project documentation

traderra-organized/          # Clean reference copy
├── platform/                # Production code
└── documentation/           # Organized docs
```

---

## Frontend Development

### Quick Start
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Install dependencies
npm install

# Start development server (port 6565)
npm run dev

# Type checking
npm run type-check

# Run tests
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:e2e          # Browser tests
npm run test:coverage     # With coverage
```

### Key Files
```
src/app/journal/page.tsx              Main journal page (938 lines)
src/components/journal/               Journal components
src/components/dashboard/             Dashboard widgets
src/hooks/                            Custom React hooks
src/contexts/                         Global state contexts
src/utils/                            Utility functions
prisma/schema.prisma                  Database schema
next.config.js                        Next.js config
package.json                          Dependencies
tailwind.config.js                    Tailwind config (if exists)
```

### Common Patterns

**Using Contexts**
```tsx
import { useDisplayMode } from '@/contexts/DisplayModeContext'
import { useDateRange } from '@/contexts/DateRangeContext'

// In component
const { displayMode, setDisplayMode } = useDisplayMode()
const { dateRange, setDateRange } = useDateRange()
```

**Using Hooks**
```tsx
import { useFolders } from '@/hooks/useFolders'
import { useFolderContentCounts } from '@/hooks/useFolderContentCounts'

// Fetch data
const { folders, loading } = useFolders()
const { counts } = useFolderContentCounts()
```

**React Query**
```tsx
import { useQuery } from '@tanstack/react-query'

const { data, isLoading, error } = useQuery({
  queryKey: ['trades', userId],
  queryFn: async () => fetchTrades(userId),
})
```

---

## Backend Development

### Quick Start
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # or: venv\Scripts\activate on Windows

# Install dependencies
pip install -r requirements.txt

# Initialize Archon knowledge base
python scripts/init_knowledge.py

# Start development server (port 6500)
uvicorn app.main:app --reload --port 6500
```

### Access Points
```
API Docs (Swagger)     http://localhost:6500/docs
ReDoc                  http://localhost:6500/redoc
Health Check           http://localhost:6500/health
Archon Debug           http://localhost:6500/debug/archon
Renata Debug           http://localhost:6500/debug/renata
```

### Key Files
```
app/main.py                    FastAPI application
app/ai/renata_agent.py         Renata AI agent (423 lines)
app/api/ai_endpoints.py        AI endpoints
app/api/folders.py             Folder endpoints
app/api/blocks.py              Content endpoints
app/core/archon_client.py      Archon integration
app/core/config.py             Configuration
requirements.txt               Python dependencies
.env                           Environment variables
```

### API Endpoints Reference

**AI Endpoints**
```
POST   /ai/query              # Chat with Renata
POST   /ai/analyze            # Performance analysis
GET    /ai/status             # Health check
GET    /ai/modes              # Available modes
GET    /ai/knowledge/search   # Search Archon
POST   /ai/knowledge/ingest   # Store to Archon
```

**Folder Endpoints**
```
GET    /folders/              # List folders
POST   /folders/              # Create folder
PUT    /folders/{id}          # Update folder
DELETE /folders/{id}          # Delete folder
GET    /folders/{id}/contents # Get contents
```

**Block Endpoints**
```
CRUD operations for journal content blocks
```

### Testing Backend
```bash
# Run tests
pytest

# With coverage
pytest --cov=app

# Specific test
pytest tests/test_ai_endpoints.py
```

---

## Environment Configuration

### Frontend .env
```
# Database
DATABASE_URL="file:./dev.db"

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY="your_key"
CLERK_SECRET_KEY="your_key"

# Optional
NEXT_PUBLIC_CUSTOM_KEY="value"
```

### Backend .env
```
# Archon Integration
ARCHON_BASE_URL="http://localhost:8051"
ARCHON_PROJECT_ID="project_id"

# AI
OPENAI_API_KEY="your_key"
OPENAI_MODEL="gpt-4"

# Database
DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/traderra"

# Redis
REDIS_URL="redis://localhost:6379"

# Auth
CLERK_SECRET_KEY="your_key"

# Server
DEBUG=true
```

---

## Database Operations

### Prisma (Frontend)
```bash
cd traderra/frontend

# Generate Prisma client
npx prisma generate

# Run migrations
npx prisma migrate dev --name "description"

# View database
npx prisma studio

# Reset database
npx prisma migrate reset
```

### SQLite
```bash
# View database (if using SQLite)
sqlite3 prisma/dev.db

# Backup
cp prisma/dev.db prisma/dev.db.backup
```

---

## Documentation Structure

### Brand System & Design
```
/traderra-organized/documentation/brand-system/
├── TRADERRA_DESIGN_SYSTEM_GUIDE.md      Colors, spacing, fonts
├── TRADERRA_COMPONENT_LIBRARY.md        Component patterns
├── TRADERRA_AI_AGENT_CHEATSHEET.md      Quick reference
└── TRADERRA_BRAND_KIT_INDEX.md          Navigation hub
```

### Technical Docs
```
/traderra-organized/documentation/technical/
├── TRADERRA_QUICK_REFERENCE.md          Overview
├── TRADERRA_QUICK_START.md              Getting started
└── TRADERRA_APPLICATION_STRUCTURE_GUIDE.md  Architecture
```

### Development Guides
```
/traderra-organized/documentation/development/
├── TRADERRA_VALIDATION_GUIDE.md         QA procedures
└── TRADERRA_WORKFLOW_OPTIMIZATION_SUMMARY.md  Best practices
```

---

## Common Development Tasks

### Adding a New Page
1. Create `traderra/frontend/src/app/[page]/page.tsx`
2. Export default component
3. Use existing components and contexts
4. Follow Tailwind styling conventions

### Adding a New Component
1. Create file in `src/components/[category]/`
2. Use TypeScript for type safety
3. Import from established patterns
4. Add to relevant stories/tests

### Adding a New Hook
1. Create file in `src/hooks/`
2. Export custom hook function
3. Use React hooks internally
4. Document parameters and return types

### Adding a Backend Endpoint
1. Create route in appropriate API module
2. Use FastAPI decorators (@router.post, etc.)
3. Add Pydantic models for validation
4. Include error handling
5. Document with docstrings

### Testing
```bash
# Frontend tests
cd traderra/frontend
npm run test:run
npm run test:e2e
npm run test:coverage

# Backend tests
cd traderra/backend
pytest
pytest --cov=app
```

---

## Git Workflow

### Check Status
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub
git status
```

### View Changes
```bash
# See all changes
git diff

# See staged changes
git diff --staged

# See changes for specific file
git diff traderra/frontend/src/app/journal/page.tsx
```

### Common Commands
```bash
# Add files
git add traderra/frontend/src/app/journal/page.tsx
git add -A

# Commit
git commit -m "Description of changes"

# Push
git push origin main

# Pull latest
git pull origin main

# View logs
git log --oneline -10
```

---

## Port Configuration

### Default Ports
```
Frontend      6565    http://localhost:6565
Backend       6500    http://localhost:6500
Archon MCP    8051    http://localhost:8051
Redis         6379    redis://localhost:6379
PostgreSQL    5432    postgresql://localhost:5432
```

### Changing Frontend Port
```bash
npm run dev -- -p 3000  # Run on port 3000
```

### Changing Backend Port
```bash
uvicorn app.main:app --port 8000 --reload
```

---

## Troubleshooting

### Frontend Issues

**Port 6565 Already in Use**
```bash
# Find process using port
lsof -i :6565

# Kill process (macOS/Linux)
kill -9 <PID>

# Or use different port
npm run dev -- -p 3000
```

**Module Not Found**
```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm install
```

**TypeScript Errors**
```bash
# Type check
npm run type-check

# Generate Prisma types
npx prisma generate
```

### Backend Issues

**Archon Connection Failed**
```bash
# Check Archon is running on 8051
curl http://localhost:8051/health

# Check environment variables
echo $ARCHON_BASE_URL
```

**Database Errors**
```bash
# Reset database
python scripts/init_knowledge.py

# Or for SQLite
rm prisma/dev.db
npx prisma migrate reset
```

**Python Virtual Environment**
```bash
# Activate venv
source venv/bin/activate

# If that fails
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

---

## Performance Optimization

### Frontend
```bash
# Analyze bundle
npm run build && npm run start

# Check performance
npm run test:performance

# View Lighthouse scores in Playwright report
npm run test:e2e -- --reporter=html
```

### Backend
```bash
# Check endpoint performance
curl -w "@curl-format.txt" -o /dev/null -s http://localhost:6500/health

# Use timing tools
python -m cProfile -s cumtime app/main.py
```

---

## Useful Resources

### Documentation Files
- **Overview**: `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_PROJECT_STATE_OVERVIEW.md`
- **Design System**: `/traderra-organized/documentation/brand-system/TRADERRA_DESIGN_SYSTEM_GUIDE.md`
- **Quick Start**: `/traderra-organized/documentation/technical/TRADERRA_QUICK_START.md`

### Code Examples
- **Components**: `/traderra/frontend/src/components/`
- **Hooks**: `/traderra/frontend/src/hooks/`
- **Backend APIs**: `/traderra/backend/app/api/`

### Testing
- **Test Files**: `/traderra/frontend/src/tests/`
- **Test Utils**: `/traderra/frontend/src/utils/__tests__/`

---

## Quick Checklist for New Development

- [ ] Read TRADERRA_DESIGN_SYSTEM_GUIDE.md
- [ ] Review TRADERRA_COMPONENT_LIBRARY.md
- [ ] Check existing patterns in components directory
- [ ] Follow CE-Hub Plan → Research → Produce → Ingest
- [ ] Write tests alongside code
- [ ] Ensure TypeScript strict mode compliance
- [ ] Run full test suite before commit
- [ ] Update documentation if needed
- [ ] Commit with clear message
- [ ] Push to appropriate branch

---

## Key Commands Summary

```bash
# Frontend
cd traderra/frontend && npm run dev              # Start dev
cd traderra/frontend && npm run test             # Run tests
cd traderra/frontend && npm run build            # Build for prod

# Backend
cd traderra/backend && source venv/bin/activate  # Activate venv
cd traderra/backend && pip install -r requirements.txt  # Install deps
cd traderra/backend && uvicorn app.main:app --reload   # Start dev

# Database
cd traderra/frontend && npx prisma studio       # View/edit data
cd traderra/frontend && npx prisma migrate dev  # Run migrations

# Git
git status                                      # Check status
git diff [file]                                # View changes
git add .                                       # Stage all
git commit -m "message"                         # Commit
git push origin main                            # Push

# Testing
npm run test:run                                # Full test run
npm run test:e2e                                # Browser tests
npm run test:coverage                           # Coverage report
npm run type-check                              # Type checking
```

---

**Last Updated**: October 27, 2025
**Status**: Production Reference

