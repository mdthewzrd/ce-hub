# Traderra Application Structure & Startup Guide

**Last Updated**: October 25, 2025
**Status**: Production-Ready Full Stack Application
**Port Configuration**: Frontend on 6565, Backend on 6500

---

## Table of Contents

1. [Application Architecture](#application-architecture)
2. [Directory Structure](#directory-structure)
3. [Frontend Setup & Startup](#frontend-setup--startup)
4. [Backend Setup & Startup](#backend-setup--startup)
5. [Port Configuration](#port-configuration)
6. [Running the Full Application](#running-the-full-application)
7. [Environment Configuration](#environment-configuration)
8. [API Endpoints](#api-endpoints)
9. [Development Tools & Testing](#development-tools--testing)
10. [Troubleshooting](#troubleshooting)

---

## Application Architecture

### System Components

```
┌─────────────────────────────────────────────────────┐
│  Frontend: Next.js 14.2.0 (Port 6565)               │
│  - React 18.3.0 + TypeScript                        │
│  - Trading Journal UI + Dashboard                   │
│  - Clerk Authentication                             │
│  - Co-PilotKit AI Integration                       │
├─────────────────────────────────────────────────────┤
│  Backend API: FastAPI (Port 6500)                   │
│  - Python 3.11+ with async support                  │
│  - Renata AI Agent (PydanticAI)                     │
│  - Archon MCP Integration                           │
│  - REST API + WebSocket Support                     │
├─────────────────────────────────────────────────────┤
│  Data Layer                                         │
│  - PostgreSQL 15+ with pgvector                     │
│  - Redis for caching                                │
│  - Prisma ORM (Frontend)                            │
│  - SQLAlchemy + AsyncPG (Backend)                   │
├─────────────────────────────────────────────────────┤
│  AI Knowledge: Archon MCP (Port 8051)               │
│  - Knowledge Graph                                  │
│  - RAG-powered Intelligence                         │
│  - CE-Hub Integration                               │
└─────────────────────────────────────────────────────┘
```

---

## Directory Structure

### Complete Project Layout

```
traderra/
├── frontend/                          # Next.js Frontend Application
│   ├── package.json                   # Frontend scripts & dependencies
│   ├── next.config.js                 # Next.js configuration (API rewrites)
│   ├── tsconfig.json                  # TypeScript configuration
│   ├── tailwind.config.ts             # Tailwind CSS configuration
│   ├── .env                           # Environment variables (Prisma)
│   ├── .env.local                     # Development config (API_URL, Clerk, etc.)
│   ├── node_modules/                  # Installed dependencies
│   ├── .next/                         # Build output
│   ├── src/
│   │   ├── app/                       # Next.js app directory
│   │   │   ├── layout.tsx             # Root layout
│   │   │   ├── page.tsx               # Home page
│   │   │   ├── dashboard/             # Dashboard pages
│   │   │   ├── journal/               # Journal pages
│   │   │   └── api/                   # API route handlers
│   │   ├── components/                # Reusable React components
│   │   ├── lib/                       # Utility functions
│   │   ├── styles/                    # Global styles
│   │   └── tests/                     # Test files (Vitest, Playwright)
│   ├── prisma/
│   │   ├── schema.prisma              # Database schema
│   │   ├── dev.db                     # SQLite dev database
│   │   └── migrations/                # Database migrations
│   └── playwright.config.ts           # E2E test configuration
│
├── backend/                           # FastAPI Backend Application
│   ├── package.json                   # N/A - Python project
│   ├── requirements.txt               # Python dependencies
│   ├── .env                           # Environment variables (populated)
│   ├── .env.example                   # Environment template
│   ├── venv/                          # Python virtual environment
│   ├── app/
│   │   ├── main.py                    # FastAPI application entry point
│   │   ├── core/
│   │   │   ├── config.py              # Configuration management
│   │   │   ├── archon_client.py       # Archon MCP client
│   │   │   ├── database.py            # Database connections
│   │   │   └── dependencies.py        # FastAPI dependencies
│   │   ├── api/
│   │   │   ├── ai_endpoints.py        # AI/Renata endpoints
│   │   │   ├── folders.py             # Folder management endpoints
│   │   │   └── blocks.py              # Block/content endpoints
│   │   ├── ai/
│   │   │   ├── renata_agent.py        # Renata AI agent logic
│   │   │   ├── models.py              # Data models
│   │   │   └── tools.py               # AI tools/utilities
│   │   └── models/
│   │       └── database.py            # SQLAlchemy models
│   ├── scripts/
│   │   └── init_knowledge.py          # Knowledge base initialization
│   ├── migrations/                    # Database migrations (Alembic)
│   └── README.md                      # Backend documentation
│
├── BLOCK_EDITOR_IMPLEMENTATION.md     # Block editor docs
├── CSV_DATETIME_FIX.md                # CSV datetime handling
├── INTEGRATION_SUMMARY.md             # Integration notes
├── QUALITY_ASSURANCE_REPORT.md        # QA findings
└── TESTING_PATTERNS_DISCOVERED.md     # Testing patterns
```

---

## Frontend Setup & Startup

### Prerequisites

- Node.js >= 18.17.0 (required by next.js)
- npm or yarn package manager

### Installation

```bash
# Navigate to frontend directory
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Install dependencies (if not already done)
npm install

# Or if you prefer yarn
yarn install
```

### Available Scripts

```bash
# Development server (runs on port 6565)
npm run dev

# Production build
npm run build

# Production server (runs on port 6565)
npm start

# Type checking
npm run type-check

# Linting
npm run lint

# Testing
npm run test                # Run all tests in watch mode
npm run test:run           # Run tests once
npm run test:ui            # Open test UI
npm run test:coverage      # Generate coverage report
npm run test:e2e           # Run Playwright E2E tests
npm run test:e2e:ui        # Run E2E tests with UI
npm run test:accessibility # Run accessibility tests
npm run test:all           # Run all tests (unit + E2E)

# Install Playwright browsers
npm run playwright:install
```

### Starting Development Server

```bash
# Method 1: Direct npm command
npm run dev

# Method 2: Using npx
npx next dev -p 6565

# Output should show:
# ▲ Next.js 14.2.0
# - Local: http://localhost:6565
# - Environments: .env
# - Environments: .env.local
```

### Frontend Port Configuration

The port is already configured in `package.json`:

```json
{
  "scripts": {
    "dev": "next dev -p 6565",
    "start": "next start -p 6565"
  }
}
```

**Port 6565 is hardcoded**. To change it, modify the scripts in `package.json`.

---

## Backend Setup & Startup

### Prerequisites

- Python 3.11+ (3.13 tested)
- PostgreSQL 15+ with pgvector extension (optional for local dev)
- Redis (optional for local dev)
- Virtual environment tool (venv)

### Installation & Environment Setup

```bash
# Navigate to backend directory
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend

# Create virtual environment (if not exists)
python3 -m venv venv

# Activate virtual environment
# On macOS/Linux:
source venv/bin/activate
# On Windows:
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Verify installation
python -c "import fastapi; import pydantic_ai; print('✅ Setup successful')"
```

### Environment Configuration

The `.env` file is already configured with:

```env
# Database (local SQLite or PostgreSQL)
DATABASE_URL="postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra"

# Archon MCP (Knowledge Backend)
ARCHON_BASE_URL="http://localhost:8181"
ARCHON_PROJECT_ID="7816e33d-2c75-41ab-b232-c40e3ffc2c19"

# OpenAI Configuration
OPENAI_API_KEY="sk-your-key-here"

# Frontend URL (CORS configuration)
ALLOWED_ORIGINS='["http://localhost:6565","http://localhost:3000"]'

# Application Settings
DEBUG=true
LOG_LEVEL="INFO"
```

### Starting Development Server

```bash
# Method 1: Using uvicorn directly (recommended)
uvicorn app.main:app --reload --port 6500

# Method 2: Using Python module execution
python -m uvicorn app.main:app --reload --port 6500

# Method 3: From within app.main.py (if __name__ == "__main__")
python app/main.py

# Expected output:
# INFO:     Uvicorn running on http://0.0.0.0:6500 (Press CTRL+C to quit)
# INFO:     Started server process [xxxxx]
# INFO:     Waiting for application startup.
```

### Backend Port Configuration

The port is configured in `app/main.py`:

```python
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=6500,           # Backend port
        reload=settings.debug,
        log_level="info"
    )
```

**Port 6500** is the backend default. To change it, modify the startup command or uvicorn configuration.

---

## Port Configuration

### Default Port Layout

| Service | Port | URL | Status |
|---------|------|-----|--------|
| Frontend (Next.js) | 6565 | http://localhost:6565 | Production-Ready |
| Backend API (FastAPI) | 6500 | http://localhost:6500 | Production-Ready |
| API Docs | 6500/docs | http://localhost:6500/docs | Debug Only |
| Archon MCP | 8051/8181 | http://localhost:8051 or 8181 | Optional |
| PostgreSQL | 5432 | localhost:5432 | Optional |
| Redis | 6379 | localhost:6379 | Optional |

### Changing Port 6565 for Frontend

If you need to run the frontend on a different port:

#### Option 1: Modify package.json

```json
{
  "scripts": {
    "dev": "next dev -p YOUR_NEW_PORT",
    "start": "next start -p YOUR_NEW_PORT"
  }
}
```

Then:
```bash
npm run dev
```

#### Option 2: Command Line Override

```bash
# Override port at runtime
next dev -p 3000
# or
npm run dev -- -p 3000
```

#### Option 3: Environment Variable

```bash
# Set PORT environment variable
PORT=3000 npm run dev
```

### Frontend-Backend Communication

The frontend connects to the backend via API rewrites configured in `next.config.js`:

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

**If you change the backend port**, update this configuration accordingly.

---

## Running the Full Application

### Sequential Startup (Recommended for Development)

#### Terminal 1: Start Backend

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend

# Activate venv
source venv/bin/activate

# Start server
uvicorn app.main:app --reload --port 6500

# Watch for:
# ✅ Database initialized successfully
# ✅ Archon MCP connected successfully
# 🚀 Traderra API startup complete
```

#### Terminal 2: Start Frontend

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Install (if needed)
npm install

# Start dev server
npm run dev

# Watch for:
# ▲ Next.js 14.2.0
# - Local: http://localhost:6565
```

#### Terminal 3: Open Application

```bash
# Open in browser
open http://localhost:6565

# Or from command line
curl http://localhost:6565
```

### Parallel Startup Script

Create a startup script (`start_traderra.sh`):

```bash
#!/bin/bash

# Colors for output
GREEN='\033[0;32m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}Starting Traderra Full Stack...${NC}"

# Start backend in background
echo -e "${GREEN}[1/2] Starting Backend (Port 6500)...${NC}"
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend
source venv/bin/activate
uvicorn app.main:app --reload --port 6500 &
BACKEND_PID=$!

# Wait for backend to start
sleep 3

# Start frontend in background
echo -e "${GREEN}[2/2] Starting Frontend (Port 6565)...${NC}"
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend
npm run dev &
FRONTEND_PID=$!

echo -e "${GREEN}✅ Both services started!${NC}"
echo -e "${BLUE}Frontend: http://localhost:6565${NC}"
echo -e "${BLUE}Backend:  http://localhost:6500${NC}"
echo -e "${BLUE}API Docs: http://localhost:6500/docs${NC}"

# Keep script running
wait

# Cleanup on exit
trap "kill $BACKEND_PID $FRONTEND_PID" EXIT
```

Make it executable and run:

```bash
chmod +x start_traderra.sh
./start_traderra.sh
```

---

## Environment Configuration

### Frontend Environment Variables (`.env.local`)

```env
# Backend API Connection
NEXT_PUBLIC_API_URL=http://localhost:6500

# Authentication (Clerk)
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# Application URL
NEXT_PUBLIC_APP_URL=http://localhost:6565
NODE_ENV=development

# AI Configuration
NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=your_api_key
OPENAI_API_KEY=sk_...

# Database (Prisma)
DATABASE_URL="file:/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/prisma/dev.db"

# External APIs
NEXT_PUBLIC_POLYGON_API_KEY=your_key
```

### Backend Environment Variables (`.env`)

```env
# Application
DEBUG=true
APP_NAME="Traderra API"
LOG_LEVEL="INFO"

# Database
DATABASE_URL="postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra"
DATABASE_POOL_SIZE=10

# Redis
REDIS_URL="redis://localhost:6379"

# Archon MCP (Knowledge Backend)
ARCHON_BASE_URL="http://localhost:8181"
ARCHON_TIMEOUT=30
ARCHON_PROJECT_ID="7816e33d-2c75-41ab-b232-c40e3ffc2c19"

# OpenAI
OPENAI_API_KEY="sk-your-key"
OPENAI_MODEL="gpt-4"

# CORS
ALLOWED_ORIGINS='["http://localhost:6565","http://localhost:3000"]'

# Security
SECRET_KEY="dev_secret_key_for_development_only"
JWT_ALGORITHM="HS256"

# Authentication
CLERK_SECRET_KEY="dev_clerk_secret_key"

# Storage
STORAGE_PROVIDER="local"

# Development
ENABLE_DEBUG_ENDPOINTS=true
MOCK_AUTH=true
```

---

## API Endpoints

### Core AI Endpoints

All endpoints require proper authentication and CORS headers.

#### Query Endpoint
```
POST /ai/query
Content-Type: application/json

{
  "prompt": "Analyze my performance this week",
  "mode": "coach"  # "analyst", "coach", or "mentor"
}
```

#### Analysis Endpoint
```
POST /ai/analyze
Content-Type: application/json

{
  "time_range": "week",
  "basis": "gross",
  "unit": "r_multiple"
}
```

#### Knowledge Search
```
GET /ai/knowledge/search?query=risk%20management&match_count=5
```

#### System Health
```
GET /health
GET /ai/status
```

### Debug Endpoints (Dev Only)

```
GET /debug/archon   # Test Archon connectivity
GET /debug/renata   # Test Renata AI functionality
GET /docs           # Swagger UI
GET /redoc          # ReDoc documentation
```

### Folder Management
```
GET /api/folders              # List all folders
POST /api/folders             # Create folder
GET /api/folders/{id}         # Get folder details
PUT /api/folders/{id}         # Update folder
DELETE /api/folders/{id}      # Delete folder
```

### Blocks/Content
```
GET /api/blocks               # List all blocks
POST /api/blocks              # Create block
GET /api/blocks/{id}          # Get block details
PUT /api/blocks/{id}          # Update block
DELETE /api/blocks/{id}       # Delete block
```

---

## Development Tools & Testing

### Frontend Testing

```bash
# Unit tests (Vitest)
npm run test              # Watch mode
npm run test:run          # Single run
npm run test:coverage     # With coverage

# E2E tests (Playwright)
npm run test:e2e          # Run tests
npm run test:e2e:ui       # With visual UI

# Accessibility testing
npm run test:accessibility

# Performance & Security
npm run test:performance
```

### Backend Testing

```bash
# With virtual environment activated
pytest                    # Run all tests
pytest -v               # Verbose output
pytest --cov            # With coverage
pytest -k "test_name"   # Specific test
```

### API Testing with curl

```bash
# Health check
curl http://localhost:6500/health

# AI query
curl -X POST http://localhost:6500/ai/query \
  -H "Content-Type: application/json" \
  -d '{"prompt": "Test", "mode": "coach"}'

# List folders
curl http://localhost:6500/api/folders

# API docs
open http://localhost:6500/docs
```

### Browser DevTools

```bash
# Frontend debugging
# - Built-in Next.js error overlay
# - React Developer Tools extension
# - Redux DevTools (if using Redux)

# Network inspection
# - All API calls visible in Network tab
# - CORS issues clearly marked

# Performance profiling
# - React Profiler
# - Web Vitals integration
```

---

## Troubleshooting

### Frontend Issues

#### Port 6565 Already in Use

```bash
# Find process using port
lsof -i :6565

# Kill process
kill -9 <PID>

# Or use different port
next dev -p 3000
```

#### Dependencies Not Installing

```bash
# Clear cache and reinstall
rm -rf node_modules package-lock.json
npm cache clean --force
npm install
```

#### Build Errors

```bash
# Clear Next.js cache
rm -rf .next

# Rebuild
npm run build

# Check TypeScript
npm run type-check
```

#### Clerk Authentication Issues

- Verify `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` is set
- Check Clerk dashboard for API keys
- Ensure redirect URLs are configured in Clerk settings

### Backend Issues

#### Port 6500 Already in Use

```bash
# Find and kill process
lsof -i :6500
kill -9 <PID>

# Or use different port
uvicorn app.main:app --port 6501
```

#### Virtual Environment Issues

```bash
# Recreate venv
rm -rf venv
python3 -m venv venv
source venv/bin/activate
pip install -r requirements.txt
```

#### Missing Dependencies

```bash
# Reinstall all requirements
pip install --upgrade -r requirements.txt

# Or specific package
pip install fastapi uvicorn
```

#### Archon MCP Connection Failed

```bash
# Verify Archon is running
curl http://localhost:8051/health_check
# or
curl http://localhost:8181/health

# Check environment variable
echo $ARCHON_BASE_URL
```

#### Database Connection Issues

```bash
# Test PostgreSQL connection
psql -U traderra -d traderra -h localhost

# Or with SQLite (file-based)
# Database file auto-created at DATABASE_URL path
```

### Common Error Messages

| Error | Cause | Solution |
|-------|-------|----------|
| `connect ECONNREFUSED 127.0.0.1:6500` | Backend not running | Start backend on port 6500 |
| `Port 6565 already in use` | Port conflict | Use different port or kill process |
| `ARCHON_BASE_URL not set` | Missing env var | Add to `.env` file |
| `OpenAI API key invalid` | Missing/wrong API key | Add valid OpenAI API key to `.env` |
| `Database connection timeout` | PostgreSQL not running | Start PostgreSQL or use SQLite |
| `Module not found` | Dependency missing | Run `npm install` or `pip install -r requirements.txt` |

### Debugging Commands

```bash
# Check Node version (Frontend)
node --version
npm --version

# Check Python version (Backend)
python --version
python3 --version

# Check installed packages (Backend)
pip list

# View environment variables
echo $PORT
echo $DATABASE_URL
echo $ARCHON_BASE_URL

# View running processes
ps aux | grep node
ps aux | grep uvicorn

# Network debugging
netstat -an | grep 6565
netstat -an | grep 6500
```

---

## Quick Reference

### Start Full Stack (Fastest Way)

```bash
# Terminal 1: Backend
cd traderra/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 6500

# Terminal 2: Frontend
cd traderra/frontend && npm run dev

# Then open: http://localhost:6565
```

### Check if Services are Running

```bash
curl http://localhost:6565      # Frontend
curl http://localhost:6500      # Backend API
curl http://localhost:6500/docs # API Docs
```

### View Logs

```bash
# Frontend dev logs appear in terminal running npm run dev
# Backend logs appear in terminal running uvicorn

# For production, check:
# Frontend: /var/log/nextjs.log (if configured)
# Backend: /var/log/traderra.log (if configured)
```

### Common File Locations

| File | Location |
|------|----------|
| Frontend config | `/traderra/frontend/next.config.js` |
| Frontend env | `/traderra/frontend/.env.local` |
| Backend config | `/traderra/backend/app/core/config.py` |
| Backend env | `/traderra/backend/.env` |
| API main | `/traderra/backend/app/main.py` |
| Frontend entry | `/traderra/frontend/src/app/layout.tsx` |

---

## Additional Resources

- **Frontend Documentation**: `/traderra/frontend/package.json` (scripts section)
- **Backend Documentation**: `/traderra/backend/README.md`
- **Database Schema**: `/traderra/frontend/prisma/schema.prisma`
- **API Documentation**: http://localhost:6500/docs (when running)
- **Next.js Docs**: https://nextjs.org/docs
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Archon Integration**: See backend README for CE-Hub integration details

---

**Built with the CE-Hub Master Operating System for intelligent agent creation and context engineering.**

