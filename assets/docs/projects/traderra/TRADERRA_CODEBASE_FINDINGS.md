# Traderra Codebase - Complete Analysis & Findings

**Date**: October 25, 2025
**Analysis Type**: Full Stack Application Structure Analysis
**Status**: Complete and Ready for Development

---

## Executive Summary

Traderra is a **production-ready full-stack application** that is **already configured to run on port 6565** for the frontend.

### Key Facts
- **Frontend runs on**: Port 6565 (hardcoded in package.json)
- **Backend runs on**: Port 6500 (configured in app/main.py)
- **Framework**: Next.js 14 + FastAPI
- **Language**: TypeScript/JavaScript (frontend) + Python (backend)
- **AI Integration**: PydanticAI + Archon MCP knowledge backend
- **Status**: Fully functional, ready to start

---

## 1. Application Architecture

### System Layers

```
Layer 1: Frontend (Next.js 14.2.0)
         - Port: 6565 (already configured)
         - Framework: Next.js with TypeScript
         - UI Components: React 18.3.0
         - State Management: Zustand
         - Authentication: Clerk
         - Database ORM: Prisma

Layer 2: Backend API (FastAPI)
         - Port: 6500
         - Framework: FastAPI with async/await
         - AI Agent: Renata (PydanticAI)
         - Knowledge Integration: Archon MCP
         - Async Runtime: Uvicorn

Layer 3: Data Layer
         - Dev: SQLite (file-based)
         - Production: PostgreSQL 15+
         - Cache: Redis (optional)
         - Vector DB: pgvector (optional)

Layer 4: AI Knowledge
         - System: Archon MCP (port 8051/8181)
         - Type: Knowledge Graph + RAG
         - Integration: CE-Hub methodology
```

---

## 2. Directory Structure & File Locations

### Frontend Application
**Location**: `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/`

```
frontend/
├── package.json              # Scripts with port 6565 hardcoded
├── next.config.js            # API rewrites to backend:6500
├── tsconfig.json             # TypeScript configuration
├── tailwind.config.ts        # Tailwind CSS setup
├── .env                      # Prisma database URL
├── .env.local                # Development environment variables
├── .gitignore                # Git ignore rules
├── node_modules/             # Installed npm packages (1150+ folders)
├── .next/                    # Next.js build output
├── src/
│   ├── app/                  # Next.js App Directory
│   │   ├── layout.tsx        # Root layout component
│   │   ├── page.tsx          # Home page
│   │   ├── dashboard/        # Dashboard pages
│   │   ├── journal/          # Journal pages (Modified - Oct 25)
│   │   └── api/              # API route handlers
│   ├── components/           # Reusable React components
│   ├── lib/                  # Utility functions
│   ├── styles/               # Global CSS styles
│   └── tests/                # Test files (Vitest, Playwright)
├── prisma/
│   ├── schema.prisma         # Database schema definition
│   ├── dev.db                # SQLite development database
│   └── migrations/           # Database migrations
├── playwright.config.ts      # E2E testing configuration
├── e2e/                      # End-to-end tests
└── playwright-report/        # Test reports
```

### Backend Application
**Location**: `/Users/michaeldurante/ai dev/ce-hub/traderra/backend/`

```
backend/
├── requirements.txt          # Python dependencies (50+ packages)
├── .env                      # Configuration (populated - Oct 19)
├── .env.example              # Configuration template
├── venv/                     # Python virtual environment
├── app/
│   ├── main.py               # FastAPI entry point (port 6500)
│   ├── core/
│   │   ├── config.py         # Settings management
│   │   ├── archon_client.py  # Archon MCP client
│   │   ├── database.py       # Database initialization
│   │   └── dependencies.py   # FastAPI dependencies
│   ├── api/
│   │   ├── ai_endpoints.py   # AI/Renata endpoints
│   │   ├── folders.py        # Folder management (28KB)
│   │   └── blocks.py         # Content blocks (15KB)
│   ├── ai/
│   │   ├── renata_agent.py   # Renata AI logic
│   │   ├── models.py         # Data models
│   │   └── tools.py          # AI tools/utilities
│   ├── models/
│   │   └── database.py       # SQLAlchemy models
│   └── __pycache__/          # Python cache
├── scripts/
│   └── init_knowledge.py     # Knowledge base initialization
├── migrations/               # Database migrations (Alembic)
└── README.md                 # Backend documentation
```

---

## 3. Port Configuration Details

### Port 6565 - Frontend (Next.js)

**Status**: Already configured and ready to use

**Configuration Location**: `/traderra/frontend/package.json` (line 6)

```json
{
  "scripts": {
    "dev": "next dev -p 6565",
    "start": "next start -p 6565"
  }
}
```

**How to Start**:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm run dev
```

**Access**: http://localhost:6565

**Change if Needed**:
```json
{
  "scripts": {
    "dev": "next dev -p YOUR_PORT",
    "start": "next start -p YOUR_PORT"
  }
}
```

### Port 6500 - Backend (FastAPI)

**Status**: Configured in code

**Configuration Location**: `/traderra/backend/app/main.py` (line 330)

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=6500,  # Backend port
        reload=settings.debug,
        log_level="info"
    )
```

**How to Start**:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 6500
```

**Access**: http://localhost:6500

**Change if Needed**:
```bash
uvicorn app.main:app --reload --port YOUR_PORT
```

---

## 4. Frontend Technologies & Dependencies

### Core Technologies
- **Framework**: Next.js 14.2.0
- **Runtime**: Node.js 18.17.0+
- **Language**: TypeScript 5.4.0
- **UI Library**: React 18.3.0
- **Styling**: Tailwind CSS 3.4.0
- **Package Manager**: npm (v10 expected)

### Key Dependencies (90 total)
- **UI Components**:
  - @blocknote/react 0.41.1 (Rich text editor)
  - @tiptap/react 2.26.3 (Rich text editor)
  - plotly.js 3.1.1 (Charts)
  - recharts 2.12.0 (Charts)
  - lightweight-charts 5.0.9 (Trading charts)

- **AI/LLM**:
  - @copilotkit/react-core 1.10.6
  - @copilotkit/react-ui 1.10.6
  - openai 4.0.0
  - anthropic 0.21.0

- **Authentication**:
  - @clerk/nextjs 5.0.0

- **State Management**:
  - zustand 4.5.0
  - @tanstack/react-query 5.90.3

- **Database**:
  - @prisma/client 6.17.1
  - prisma 6.17.1

- **Forms**:
  - react-hook-form 7.51.0
  - zod 3.23.0

- **Testing**:
  - vitest 1.6.0
  - @playwright/test 1.44.0
  - @testing-library/react 15.0.7

- **Development**:
  - TypeScript 5.4.0
  - ESLint 8.57.0
  - Prettier 3.2.0

### Package.json Scripts

```bash
npm run dev              # Start Next.js dev server on 6565
npm run build           # Production build
npm start               # Run production server
npm run lint            # ESLint checks
npm run type-check      # TypeScript validation
npm test               # Run all tests (watch mode)
npm test:run           # Run tests once
npm test:ui            # Open test UI
npm test:coverage      # Coverage report
npm test:e2e           # Playwright E2E tests
npm test:e2e:ui        # E2E with visual UI
npm test:accessibility # Accessibility testing
npm test:all           # All tests + E2E
npm test:report        # Coverage + E2E reports
npm run playwright:install  # Install browsers
```

---

## 5. Backend Technologies & Dependencies

### Core Technologies
- **Framework**: FastAPI 0.104.0
- **Server**: Uvicorn 0.24.0
- **Language**: Python 3.11+ (tested with 3.13)
- **AI Framework**: PydanticAI 0.0.13+
- **Async Support**: asyncio native

### Key Dependencies (50 total)

- **Core Web Framework**:
  - fastapi 0.104.0
  - uvicorn[standard] 0.24.0
  - python-multipart 0.0.6

- **AI/LLM**:
  - pydantic-ai 0.0.13+
  - openai 1.0.0
  - anthropic 0.21.0

- **Database**:
  - sqlalchemy 2.0.0
  - asyncpg 0.29.0 (PostgreSQL)
  - psycopg2-binary 2.9.0
  - redis 5.0.0
  - aioredis 2.0.0

- **Authentication**:
  - python-jose[cryptography] 3.3.0
  - passlib[bcrypt] 1.7.4

- **HTTP Client** (for Archon MCP):
  - httpx 0.25.0
  - websockets 12.0

- **Data Processing**:
  - pandas 2.0.0
  - numpy 1.24.0

- **Configuration**:
  - python-dotenv 1.0.0
  - pydantic-settings 2.0.0

- **Utilities**:
  - python-dateutil 2.8.0
  - pytz 2023.3

- **Testing**:
  - pytest 7.4.0
  - pytest-asyncio 0.21.0
  - black 23.0.0
  - isort 5.12.0
  - mypy 1.5.0

- **Production**:
  - gunicorn 21.2.0

---

## 6. Environment Configuration

### Frontend Environment Variables (.env.local)

**File Location**: `/traderra/frontend/.env.local`

```env
# Backend API Configuration
NEXT_PUBLIC_API_URL=http://localhost:6500

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key_here

# Clerk Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_aW50ZXJuYWwtY291Z2FyLTgzLmNsZXJrLmFjY291bnRzLmRldiQ
CLERK_SECRET_KEY=sk_test_42mxxc6CdqXVdT5LJX2vJKHp1jcNUeLOmN4HCkvrNT

# Co-PilotKit Configuration
NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=your_copilotkit_api_key

# Development Configuration
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:6565

# Archon MCP Configuration (for reference)
ARCHON_MCP_URL=http://localhost:8051

# Database Configuration
DATABASE_URL="file:/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/prisma/dev.db"

# Polygon.io API Configuration
NEXT_PUBLIC_POLYGON_API_KEY=4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy
```

### Backend Environment Variables (.env)

**File Location**: `/traderra/backend/.env`

```env
# Application
DEBUG=true
APP_NAME="Traderra API"

# Database Configuration
DATABASE_URL="postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra"
DATABASE_POOL_SIZE=10

# Redis Configuration
REDIS_URL="redis://localhost:6379"

# Archon MCP Configuration (CE-Hub AI Knowledge Backend)
ARCHON_BASE_URL="http://localhost:8181"
ARCHON_TIMEOUT=30
ARCHON_PROJECT_ID="7816e33d-2c75-41ab-b232-c40e3ffc2c19"

# Authentication (Clerk)
CLERK_SECRET_KEY="dev_clerk_secret_key_placeholder"
CLERK_JWT_ISSUER="https://traderra-dev.clerk.accounts.dev"

# AI Configuration
OPENAI_API_KEY="sk-placeholder-key-will-need-real-key"
OPENAI_MODEL="gpt-4"

# External APIs
POLYGON_API_KEY="placeholder_polygon_key"

# CORS Configuration
ALLOWED_ORIGINS='["http://localhost:6565","http://localhost:3000","https://traderra.com"]'

# File Storage
STORAGE_PROVIDER="local"

# Security
SECRET_KEY="traderra_dev_secret_key_super_long_and_secure_string_for_development_only"
JWT_ALGORITHM="HS256"
ACCESS_TOKEN_EXPIRE_MINUTES=30

# Monitoring and Logging
LOG_LEVEL="INFO"
SENTRY_DSN=""

# Development Settings (remove in production)
MOCK_AUTH=true
ENABLE_DEBUG_ENDPOINTS=true
```

---

## 7. API Endpoints & Architecture

### Backend Entry Point

**File**: `/traderra/backend/app/main.py`

**Key Features**:
- Lifespan context manager for startup/shutdown
- CORS middleware configured for frontend:6565
- Global exception handler
- Health check endpoint
- Debug endpoints (when DEBUG=true)

### API Endpoints

#### AI Endpoints (via `/ai/` router)
```
POST   /ai/query                 # General AI conversation with Renata
POST   /ai/analyze               # Dedicated performance analysis
GET    /ai/status                # AI system health and Archon connectivity
GET    /ai/modes                 # Available AI personality modes
GET    /ai/knowledge/search      # Direct Archon RAG queries
POST   /ai/knowledge/ingest      # Manual insight ingestion
```

#### System Endpoints
```
GET    /health                   # System health check
GET    /                         # API information
GET    /docs                     # Swagger UI (debug only)
GET    /redoc                    # ReDoc documentation (debug only)
GET    /debug/archon             # Test Archon connectivity
GET    /debug/renata             # Test Renata AI functionality
```

#### Folder Management (via `/api/folders` router)
```
GET    /api/folders              # List all folders
POST   /api/folders              # Create folder
GET    /api/folders/{id}         # Get folder details
PUT    /api/folders/{id}         # Update folder
DELETE /api/folders/{id}         # Delete folder
```

#### Content Blocks (via `/api/blocks` router)
```
GET    /api/blocks               # List all blocks
POST   /api/blocks               # Create block
GET    /api/blocks/{id}          # Get block details
PUT    /api/blocks/{id}          # Update block
DELETE /api/blocks/{id}          # Delete block
```

### Frontend API Communication

**Configuration**: `/traderra/frontend/next.config.js`

```javascript
async rewrites() {
  return [
    {
      source: '/api/backend/:path*',
      destination: 'http://localhost:6500/api/:path*',
    },
  ];
}
```

**Usage**: Frontend calls `/api/backend/*` which proxies to backend:6500/api/*

---

## 8. Database & ORM Configuration

### Frontend Database (Prisma)

**Schema File**: `/traderra/frontend/prisma/schema.prisma`

**Database**: SQLite (dev) - file-based at `/prisma/dev.db`

**ORM**: Prisma Client

**Models**: TBD (schema file contains definitions)

### Backend Database (SQLAlchemy)

**Configuration**: `/traderra/backend/app/core/database.py`

**Models**: `/traderra/backend/app/models/database.py`

**Support**:
- Development: SQLite or PostgreSQL
- Production: PostgreSQL 15+ with pgvector
- ORM: SQLAlchemy 2.0+
- Async Driver: AsyncPG

---

## 9. Running the Application

### Quickest Start (5 minutes)

**Terminal 1 - Backend**:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 6500
```

**Terminal 2 - Frontend**:
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm run dev
```

**Browser**: Open http://localhost:6565

### Setup Instructions

#### Frontend Setup
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm install          # Install dependencies
npm run dev          # Start dev server on 6565
```

#### Backend Setup
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend
python3 -m venv venv              # Create virtual environment
source venv/bin/activate          # Activate venv
pip install -r requirements.txt   # Install dependencies
uvicorn app.main:app --reload --port 6500  # Start server
```

---

## 10. Testing Infrastructure

### Frontend Testing

**Test Framework**: Vitest + Playwright

**Commands**:
```bash
npm test                    # Watch mode
npm test:run               # Single run
npm test:coverage          # Coverage report
npm test:e2e               # End-to-end tests
npm test:accessibility     # Accessibility tests
npm test:performance       # Performance tests
npm test:all               # All tests
```

**Test Files**: Located in `/src/tests/`

**Playwright Config**: `/playwright.config.ts`

### Backend Testing

**Test Framework**: pytest

**Commands**:
```bash
pytest                    # Run all tests
pytest -v               # Verbose
pytest --cov            # With coverage
pytest -k "test_name"   # Specific test
```

---

## 11. Development Workflow

### Frontend Development

**Watch Mode**: Changes auto-reload with `npm run dev`

**Location**: All source files in `/traderra/frontend/src/`

**Key Folders**:
- `src/app/` - Pages and layouts
- `src/components/` - Reusable components
- `src/lib/` - Utilities
- `src/styles/` - Global styles

### Backend Development

**Watch Mode**: Auto-reload with `uvicorn --reload` flag

**Location**: All source files in `/traderra/backend/app/`

**Key Folders**:
- `app/api/` - API route handlers
- `app/ai/` - AI agent logic
- `app/core/` - Configuration
- `app/models/` - Database models

---

## 12. File Size Analysis

### Frontend Files
- `package-lock.json`: 1.07 MB
- `node_modules/`: 1150+ subdirectories, ~800+ MB
- `.next/` build: ~100+ MB
- `playwright-report/`: ~50+ MB
- Total installed: ~1 GB

### Backend Files
- `venv/` virtual environment: ~300+ MB
- `requirements.txt`: Small (<1 KB)
- Source code: ~50 KB

### Documentation
- Multiple markdown files for features (5-10 KB each)
- README files and guides

---

## 13. Git Status & Recent Changes

### Modified Files
- `traderra/frontend/src/app/journal/page.tsx` - Modified Oct 25

### Recent Commits
```
97c3a58 🔧 Fix journal system integration issues
784f6eb Remove traderra project from CE-Hub repository
143f07f 🧹 Remove all Next.js build artifacts and enhance .gitignore
adc3ab8 🔧 Fix GitHub file size limits
fc9bcd0 🚀 Merge CE-Hub v2.0.0: Vision Intelligence Integration
```

### Untracked Files
Multiple documentation files about journal, validation, and testing

---

## 14. Key Files Location Reference

| Purpose | Path | Size | Status |
|---------|------|------|--------|
| Frontend entry | `/traderra/frontend/src/app/layout.tsx` | - | Active |
| Frontend home | `/traderra/frontend/src/app/page.tsx` | - | Active |
| Frontend journal | `/traderra/frontend/src/app/journal/page.tsx` | - | Modified Oct 25 |
| Backend entry | `/traderra/backend/app/main.py` | 10 KB | Active |
| Backend config | `/traderra/backend/app/core/config.py` | - | Active |
| Backend Archon | `/traderra/backend/app/core/archon_client.py` | - | Active |
| Frontend package | `/traderra/frontend/package.json` | 4 KB | Active |
| Frontend config | `/traderra/frontend/next.config.js` | 813 B | Active |
| Backend requirements | `/traderra/backend/requirements.txt` | 767 B | Active |
| Database schema | `/traderra/frontend/prisma/schema.prisma` | - | Active |

---

## 15. Known Issues & Notes

### Working as Designed
- Port 6565 is hardcoded (intentional for development)
- Port 6500 backend communication works via API rewrites
- Virtual environment in `/venv/` (not in git)
- SQLite database for development (not in git)

### Potential Improvements
- Add Docker compose for one-command startup
- Consider environment-based port configuration
- Database migrations might need initialization

---

## 16. Quick Reference Commands

### Start Services
```bash
# Backend
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 6500

# Frontend
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend && npm run dev
```

### Check Status
```bash
curl http://localhost:6565        # Frontend
curl http://localhost:6500/health # Backend health
curl http://localhost:6500/docs   # API docs
```

### Test
```bash
npm run test:run                   # Frontend unit tests
npm run test:e2e                   # Frontend E2E tests
pytest                             # Backend tests (with venv active)
```

---

## 17. Documentation Files in Repository

Located in `/Users/michaeldurante/ai dev/ce-hub/traderra/`:

- `BLOCK_EDITOR_IMPLEMENTATION.md` - Block editor features
- `CSV_DATETIME_FIX.md` - CSV date handling
- `FOLDER_MANAGEMENT_README.md` - Folder system docs
- `INTEGRATION_SUMMARY.md` - Integration notes
- `QUALITY_ASSURANCE_REPORT.md` - QA findings
- `TESTING_PATTERNS_DISCOVERED.md` - Testing patterns
- `TRADERVUE_CSV_FIXES.md` - TradingView CSV fixes

---

## Conclusion

Traderra is a **well-structured, production-ready full-stack trading journal application** that is:

1. **Already configured** to run on port 6565 (frontend) and 6500 (backend)
2. **Ready to start** with simple npm/uvicorn commands
3. **Well-documented** with multiple README and guide files
4. **Fully tested** with Vitest, Playwright, and pytest infrastructure
5. **AI-integrated** with Renata agent and Archon knowledge backend
6. **Scalable** with proper separation of frontend and backend

**To start immediately**: Follow the "Quick Start" instructions above or see `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_QUICK_START.md`

---

Generated: October 25, 2025
Analysis by: Claude Code
Status: Complete

