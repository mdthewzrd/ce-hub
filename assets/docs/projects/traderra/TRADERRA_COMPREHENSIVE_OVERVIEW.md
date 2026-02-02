# TRADERRA PROJECT COMPREHENSIVE OVERVIEW
**Last Updated:** October 30, 2025  
**Status:** Production-Ready with Active Development  
**Repository:** `/Users/michaeldurante/ai dev/ce-hub/`

---

## EXECUTIVE SUMMARY

**Traderra** is a professional AI-powered trading journal and performance analysis platform built with Next.js 14 (TypeScript) frontend and FastAPI (Python) backend. The application runs on **port 6565** (frontend) and **6500** (backend) and integrates Renata AI agent with Archon knowledge graph for continuous learning.

### Key Statistics
- **Frontend:** 938 lines (journal page) + 30+ custom components
- **Backend:** Renata AI agent (423 lines) + comprehensive REST API
- **Languages:** TypeScript/React, Python FastAPI
- **Ports:** 6565 (frontend), 6500 (backend), 8051 (Archon MCP)
- **Status:** Main branch with 1 modified file in progress

---

## UNDERSTANDING PORT 6565

### What is Port 6565?

**Port 6565** is the **frontend development and production port** for the Traderra application.

**Configuration:**
```json
// traderra/frontend/package.json
{
  "scripts": {
    "dev": "next dev -p 6565",      // Development server
    "start": "next start -p 6565"   // Production server
  }
}
```

### Port Mapping
| Service | Port | Purpose | Config |
|---------|------|---------|--------|
| **Traderra Frontend** | **6565** | Trading journal UI | `package.json` scripts |
| Traderra Backend | 6500 | REST API & AI endpoints | `backend/app/main.py` line 330 |
| Archon MCP | 8051 | Knowledge graph | `backend/.env` |
| API Docs | 6500/docs | Swagger documentation | FastAPI auto-generated |

### Starting on Port 6565

```bash
# Navigate to frontend
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Start development server (automatically uses port 6565)
npm run dev

# Or explicitly specify port
next dev -p 6565

# Expected output:
# ▲ Next.js 14.2.0
# - Local: http://localhost:6565
# ✓ Ready in 2.5s
```

### Frontend-Backend Communication

The frontend communicates with the backend through **API rewrites** configured in `next.config.js`:

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

**Flow:**
1. Frontend on http://localhost:6565
2. User action triggers API call
3. Request: `/api/backend/ai/query`
4. Rewritten to: `http://localhost:6500/api/query`
5. Backend processes and responds
6. Response sent back to frontend

---

## UNDERSTANDING RENATA FUNCTIONALITY

### What is Renata?

**Renata** is Traderra's central AI orchestrator providing adaptive, professional trading analysis and coaching. Renata operates through three distinct personality modes:

#### 1. **Analyst Mode**
- **Tone:** Clinical, direct, minimal emotion
- **Focus:** Raw, unfiltered performance truth
- **Style:** Declarative, metric-driven
- **Example:** "Expectancy fell 0.2R. Entry timing variance increased. Risk exceeded threshold in 3 trades."

#### 2. **Coach Mode** (Default)
- **Tone:** Professional but constructive
- **Focus:** Results with actionable suggestions
- **Style:** Mix of observation and correction
- **Example:** "You performed better managing losses this week. Focus on execution timing to stabilize expectancy."

#### 3. **Mentor Mode**
- **Tone:** Reflective, narrative-focused
- **Focus:** Building understanding through reflection
- **Style:** Longer cadence with causal linking
- **Example:** "You showed steadiness under pressure. Let's examine where conviction wavered."

### Renata Architecture

#### Backend Implementation
**File:** `/traderra/backend/app/ai/renata_agent.py` (423 lines)

**Key Components:**
```python
class RenataAgent:
    """Professional Trading AI Agent with Archon Integration"""
    
    # Three PydanticAI agents - one for each mode
    self.analyst_agent = Agent(model="openai:gpt-4", ...)
    self.coach_agent = Agent(model="openai:gpt-4", ...)
    self.mentor_agent = Agent(model="openai:gpt-4", ...)
    
    # Tools for analysis
    async _analyze_performance_tool()      # Analyze performance with Archon context
    async _get_historical_context_tool()  # Get historical patterns from Archon
```

**Workflow (Following CE-Hub Plan → Research → Produce → Ingest):**

1. **PLAN:** Determine analysis approach and select appropriate mode
2. **RESEARCH:** Query Archon knowledge graph for relevant trading patterns
3. **PRODUCE:** Use PydanticAI agent to generate mode-appropriate analysis
4. **INGEST:** Store insights back to Archon for continuous learning

**Data Models:**
```python
class UserPreferences(BaseModel):
    ai_mode: RenataMode = RenataMode.COACH
    verbosity: Literal["concise", "normal", "detailed"]
    stats_basis: Literal["gross", "net"]
    unit_mode: Literal["percent", "absolute", "r_multiple"]

class PerformanceData(BaseModel):
    trades_count: int
    win_rate: float
    profit_factor: Optional[float]
    expectancy: float
    total_pnl: float
    avg_winner: float
    avg_loser: float
    max_drawdown: float
```

#### Frontend Implementation
**File:** `/traderra/frontend/src/components/dashboard/renata-chat.tsx`

**Key Features:**
- **Mode Selector:** UI buttons to switch between Analyst, Coach, Mentor
- **AGUI Integration:** AI-Generated UI components for interactive analysis
- **CopilotKit Integration:** Copilot chat interface with Renata actions
- **Backend Connectivity:** Health checks and fallback offline responses
- **Conversation History:** Maintains recent interactions

**Copilot Actions Defined:**
```typescript
useCopilotAction({
  name: 'analyzePerformance',
  description: 'Analyze trading performance with current metrics',
  // Sends to backend /ai/analyze endpoint
})

useCopilotAction({
  name: 'switchMode',
  description: 'Switch Renata analysis mode (analyst|coach|mentor)',
})

useCopilotAction({
  name: 'generateAguiComponents',
  description: 'Generate interactive UI components for trading analysis',
})
```

### Renata API Endpoints

**Backend exposes:**
```
POST   /ai/query              # General AI conversation
POST   /ai/analyze            # Performance analysis with Renata
GET    /ai/status             # AI system health check
GET    /ai/modes              # Available personality modes
GET    /ai/knowledge/search   # Archon RAG queries
POST   /ai/knowledge/ingest   # Store insights to Archon
```

### Archon Integration

Renata implements **Archon-First Protocol** where:
1. All intelligence flows through Archon knowledge graph
2. RAG (Retrieval-Augmented Generation) provides context
3. Insights are ingested back for continuous learning

**Archon Client Methods Used:**
```python
# Search for trading knowledge
archon_response = await self.archon.search_trading_knowledge(
    query="trading performance analysis",
    match_count=8
)

# Ingest insights for learning
await self.archon.ingest_trading_insight(TradingInsight(...))
```

---

## PROJECT STRUCTURE OVERVIEW

### Directory Layout
```
/Users/michaeldurante/ai dev/ce-hub/
├── traderra/                              # Working development directory
│   ├── frontend/                          # Next.js 14 application (Port 6565)
│   │   ├── package.json                   # Scripts: dev (port 6565)
│   │   ├── next.config.js                 # API rewrites & configuration
│   │   ├── src/
│   │   │   ├── app/
│   │   │   │   ├── journal/page.tsx       # MODIFIED - Main journal (938 lines)
│   │   │   │   ├── dashboard/
│   │   │   │   ├── analytics/
│   │   │   │   ├── statistics/
│   │   │   │   └── [other pages]
│   │   │   ├── components/
│   │   │   │   ├── journal/
│   │   │   │   │   ├── journal-components.tsx    # 1,560 lines
│   │   │   │   │   ├── JournalLayout.tsx
│   │   │   │   │   ├── BlockNoteEditor.tsx
│   │   │   │   │   └── TemplateSelectionModal.tsx
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── renata-chat.tsx           # Renata UI
│   │   │   │   │   ├── main-dashboard.tsx
│   │   │   │   │   └── metrics-tiles.tsx
│   │   │   │   ├── charts/
│   │   │   │   └── [other components]
│   │   │   ├── contexts/
│   │   │   ├── hooks/
│   │   │   ├── utils/
│   │   │   ├── types/
│   │   │   └── styles/
│   │   ├── prisma/
│   │   │   ├── schema.prisma               # Database schema
│   │   │   └── dev.db                      # SQLite development DB
│   │   └── [config files]
│   │
│   └── backend/                           # FastAPI application (Port 6500)
│       ├── app/
│       │   ├── main.py                    # FastAPI entry point
│       │   ├── ai/
│       │   │   └── renata_agent.py        # Renata AI agent (423 lines)
│       │   ├── api/
│       │   │   ├── ai_endpoints.py        # AI endpoints (12K)
│       │   │   ├── folders.py             # Folder management (28K)
│       │   │   └── blocks.py              # Content blocks (15K)
│       │   ├── core/
│       │   │   ├── config.py              # Configuration
│       │   │   ├── database.py            # DB setup
│       │   │   ├── auth.py                # JWT auth
│       │   │   ├── archon_client.py       # Archon MCP integration
│       │   │   └── dependencies.py        # FastAPI dependencies
│       │   └── models/
│       │       └── folder_models.py       # Pydantic models
│       ├── requirements.txt               # Python dependencies
│       ├── .env                           # Environment variables
│       └── venv/                          # Python virtual environment
│
└── traderra-organized/                    # Clean, organized reference copy
    ├── platform/
    │   ├── backend/                       # Complete backend reference
    │   └── frontend/                      # Complete frontend reference
    └── documentation/
        ├── brand-system/                  # Design system & components
        ├── technical/                     # Technical architecture
        ├── development/                   # Development guidelines
        └── archived/                      # Historical documentation
```

### Frontend Technology Stack
- **Framework:** Next.js 14.2.0
- **Runtime:** React 18.3.0
- **Language:** TypeScript 5.4
- **Styling:** Tailwind CSS 3.4.0
- **State Management:** Zustand 4.5.0 + React Context
- **Data Fetching:** TanStack React Query 5.90.3
- **Rich Text Editing:** Tiptap 2.26.3 + BlockNote
- **Charts:** Recharts 2.12.0, Lightweight Charts 5.0.9, Plotly.js 3.1.1
- **Authentication:** Clerk
- **AI Integration:** CopilotKit (OpenAI)
- **Testing:** Vitest, Playwright, axe-core

### Backend Technology Stack
- **Framework:** FastAPI 0.104+
- **Server:** Uvicorn with auto-reload
- **Language:** Python 3.11+
- **Database:** SQLite (dev), PostgreSQL 15+ (production)
- **ORM:** SQLAlchemy 2.0+
- **AI Agents:** PydanticAI
- **AI Models:** OpenAI GPT-4, Anthropic Claude
- **Knowledge Graph:** Archon MCP (localhost:8051)
- **Cache:** Redis 5.0+
- **Authentication:** JWT + Clerk
- **API Documentation:** Swagger/OpenAPI

---

## CURRENT DEVELOPMENT STATUS

### Recent Commits
1. **97c3a58** - 🔧 Fix journal system integration issues
2. **784f6eb** - Remove traderra project from CE-Hub repository
3. **143f07f** - 🧹 Remove all Next.js build artifacts and enhance .gitignore
4. **adc3ab8** - 🔧 Fix GitHub file size limits
5. **fc9bcd0** - 🚀 Merge CE-Hub v2.0.0: Vision Intelligence Integration

### Current Modifications
**Modified Files (git status):**
```
M traderra/frontend/src/app/journal/page.tsx
  - Added: import { useFolderContentCounts } from '@/hooks/useFolderContentCounts'
  - Changed: Renata import from dashboard/renata-chat to chat/standalone-renata-chat
  - Status: Refactoring to use standalone Renata chat component
```

### Work in Progress
The `journal/page.tsx` file is being refactored to:
1. Remove large mock data arrays (content was being truncated in git diff)
2. Integrate real `useFolderContentCounts` hook
3. Switch from embedded RenataChat to StandaloneRenataChat component
4. Improve journal folder integration

---

## KEY FILES AND LOCATIONS

### Critical Frontend Files
```
/traderra/frontend/src/app/journal/page.tsx           (938 lines - MAIN JOURNAL - MODIFIED)
/traderra/frontend/src/components/journal/            (Journal components)
  ├── journal-components.tsx                          (1,560 lines)
  ├── JournalLayout.tsx
  ├── BlockNoteEditor.tsx
  └── TemplateSelectionModal.tsx
/traderra/frontend/src/components/dashboard/
  ├── renata-chat.tsx                                 (Renata UI - embedded)
  └── main-dashboard.tsx
/traderra/frontend/src/components/chat/
  └── standalone-renata-chat.tsx                      (Renata UI - standalone)
/traderra/frontend/src/hooks/
  ├── useFolders.ts
  ├── useFolderContentCounts.ts                       (NEW - being integrated)
  └── useFolderDragDrop.ts
/traderra/frontend/package.json                       (Port 6565 config)
/traderra/frontend/next.config.js                     (API rewrites)
/traderra/frontend/prisma/schema.prisma               (Database schema)
```

### Critical Backend Files
```
/traderra/backend/app/main.py                         (FastAPI setup - port 6500)
/traderra/backend/app/ai/renata_agent.py              (Renata agent - 423 lines)
/traderra/backend/app/api/
  ├── ai_endpoints.py                                 (AI endpoints - 12K)
  ├── folders.py                                      (Folder management - 28K)
  └── blocks.py                                       (Content blocks - 15K)
/traderra/backend/app/core/
  ├── config.py
  ├── database.py
  ├── archon_client.py                                (Archon integration)
  └── auth.py
/traderra/backend/requirements.txt
/traderra/backend/.env                                (Configuration)
```

### Documentation Files
```
/TRADERRA_PROJECT_STATE_OVERVIEW.md                  (Current state - comprehensive)
/TRADERRA_QUICK_START.md                             (5-minute startup guide)
/PORT_6565_CONFIGURATION_GUIDE.md                    (Port configuration)
/TRADERRA_EXPLORATION_FINDINGS.md                    (AI model findings)
/TRADERRA_QUICK_REFERENCE.md                         (Quick reference)
/TRADERRA_APPLICATION_STRUCTURE_GUIDE.md             (Architecture details)
/traderra-organized/documentation/                   (Complete organized docs)
```

---

## GETTING STARTED

### Prerequisites
- Node.js >= 18.17.0
- Python 3.11+
- npm/yarn
- Port 6565 available (frontend)
- Port 6500 available (backend)

### Quick Start (5 Minutes)

#### Terminal 1: Start Backend
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/backend

# Activate Python environment
source venv/bin/activate

# Start server on port 6500
uvicorn app.main:app --reload --port 6500

# Wait for: "🚀 Traderra API startup complete"
```

#### Terminal 2: Start Frontend
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Start Next.js dev server on port 6565
npm run dev

# Wait for: "▲ Next.js 14.2.0"
# Shows: "- Local: http://localhost:6565"
```

#### Open in Browser
```bash
open http://localhost:6565
```

### API Testing
```bash
# Health check
curl http://localhost:6500/health

# API documentation
open http://localhost:6500/docs

# Renata analysis endpoint
curl -X POST http://localhost:6500/ai/analyze \
  -H "Content-Type: application/json" \
  -d '{
    "performance_data": {
      "trades_count": 50,
      "win_rate": 0.52,
      "expectancy": 0.82
    },
    "mode": "coach"
  }'
```

---

## DATABASE SCHEMA

### SQLite Schema (Development)
```
User
  id: String (PK)
  trades: Trade[]
  createdAt: DateTime
  updatedAt: DateTime

Trade
  id: String (PK)
  userId: String (FK)
  
  # Core Data
  date, symbol, side, quantity
  entryPrice, exitPrice, pnl, pnlPercent
  commission, duration, strategy, notes
  entryTime, exitTime
  
  # Risk Management
  riskAmount, riskPercent
  stopLoss, rMultiple, mfe, mae
  
  createdAt, updatedAt
  Indexes: userId, symbol, date
```

### PostgreSQL Schema (Production)
- Planned upgrade with pgvector support
- Row-Level Security (RLS) for multi-tenancy
- Async support with asyncpg

---

## VALIDATION & QUALITY ASSURANCE

### Test Suites
```bash
# Frontend unit tests
npm run test:run

# Frontend E2E tests
npm run test:e2e

# Frontend accessibility tests
npm run test:accessibility

# Frontend performance tests
npm run test:performance

# Backend tests
pytest

# Backend with coverage
pytest --cov
```

### Available Test Types
- Unit tests (Vitest)
- E2E tests (Playwright)
- Accessibility tests (axe-core)
- Performance tests
- Integration tests
- Backward compatibility tests

---

## ENVIRONMENT VARIABLES

### Frontend (.env.local)
```env
# API Configuration
NEXT_PUBLIC_API_URL=http://localhost:6500
NEXT_PUBLIC_APP_URL=http://localhost:6565

# Authentication
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...

# AI Integration
OPENAI_API_KEY=sk_...
```

### Backend (.env)
```env
# AI Configuration
OPENAI_API_KEY=sk_...
OPENAI_MODEL=gpt-4
ANTHROPIC_API_KEY=...

# Database
DATABASE_URL=postgresql+asyncpg://user:pass@localhost:5432/traderra
REDIS_URL=redis://localhost:6379

# Archon Integration
ARCHON_BASE_URL=http://localhost:8051
ARCHON_PROJECT_ID=project_id_here

# Authentication
CLERK_SECRET_KEY=sk_test_...

# CORS
ALLOWED_ORIGINS='["http://localhost:6565","http://localhost:3000"]'

# Development
DEBUG=true
```

---

## TROUBLESHOOTING

### Port 6565 Already in Use
```bash
# Find process
lsof -i :6565

# Kill it
kill -9 <PID>

# Or use different port
next dev -p 3000
```

### Frontend Won't Connect to Backend
1. Check backend is running: `curl http://localhost:6500/health`
2. Verify `.env.local`: `NEXT_PUBLIC_API_URL=http://localhost:6500`
3. Restart frontend after env changes

### Dependencies Missing
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

## DEVELOPMENT WORKFLOW

### Recommended Approach
1. **Understand Requirements** → Review TRADERRA_QUICK_REFERENCE.md
2. **Design System** → Consult TRADERRA_DESIGN_SYSTEM_GUIDE.md
3. **Component Patterns** → Reference TRADERRA_COMPONENT_LIBRARY.md
4. **Implementation** → Follow CE-Hub Plan → Research → Produce → Ingest
5. **Validation** → Use TRADERRA_VALIDATION_GUIDE.md
6. **Testing** → Run comprehensive test suite

### Key Principles
- **Archon-First**: All AI operations via Archon MCP
- **Context as Product**: Design for reuse and knowledge accumulation
- **Plan Mode**: Present plans before execution
- **Quality Gates**: Implement validation checkpoints
- **Brand Consistency**: Follow design system strictly

---

## ARCHITECTURE HIGHLIGHTS

### Frontend Architecture
- **App Router:** Next.js 14 App Router for routing
- **Component Library:** 30+ custom components
- **State Management:** Zustand + React Context + React Query
- **Styling:** Tailwind CSS with custom Traderra theme
- **Editor:** Tiptap + BlockNote for rich editing
- **AI Integration:** CopilotKit for assistant interface

### Backend Architecture
- **REST API:** FastAPI for HTTP endpoints
- **AI Agent:** PydanticAI-based Renata with three modes
- **Knowledge Integration:** Archon MCP client for RAG
- **Database:** SQLAlchemy ORM abstraction
- **Authentication:** JWT + Clerk integration

### Data Flow
```
Frontend (6565)
    ↓
[/api/backend/* rewrite]
    ↓
Backend (6500)
    ↓
[Service Logic + Renata AI]
    ↓
Archon (8051)
[RAG Search + Knowledge Graph]
    ↓
Response → Ingest Learning
    ↓
Response back to Frontend
```

---

## SUCCESS METRICS & VALIDATION

### Code Quality
- TypeScript strict mode enabled
- ESLint compliance
- Prettier formatting
- Test coverage targets

### Performance
- Next.js optimized builds
- React Query caching
- Lazy loading components
- Chart performance optimization

### User Experience
- Responsive design (Tailwind)
- Accessibility compliance (A11y)
- Toast notifications
- Loading states

### AI Quality
- Renata personality consistency
- Archon knowledge accuracy
- Pattern recognition effectiveness
- Learning loop closure

---

## REFERENCES & RESOURCES

### Documentation
- Brand System: `/traderra-organized/documentation/brand-system/`
- Technical Specs: `/traderra-organized/documentation/technical/`
- Development: `/traderra-organized/documentation/development/`
- Quick Start: `TRADERRA_QUICK_START.md`

### Code Examples
- Components: `/traderra/frontend/src/components/`
- Hooks: `/traderra/frontend/src/hooks/`
- Utils: `/traderra/frontend/src/utils/`
- Backend: `/traderra/backend/app/`

### Testing Resources
- Test Files: `/traderra/frontend/src/tests/`
- Test Utils: `/traderra/frontend/src/utils/__tests__/`

---

## NEXT STEPS FOR DEVELOPMENT

### Immediate Tasks (Based on Modified Files)
1. **Complete journal/page.tsx refactoring**
   - Integration of useFolderContentCounts hook
   - Remove mock data arrays
   - Complete standalone Renata chat integration
   - Test folder content counting

2. **Validate Renata Integration**
   - Test all three modes (analyst, coach, mentor)
   - Verify Archon knowledge retrieval
   - Check insight ingestion

3. **Test Port 6565 Communication**
   - Frontend-backend API calls
   - Real-time updates
   - Error handling and fallbacks

### Medium-term Goals
- Mobile application support
- Advanced AI insights
- Multi-broker integration
- Real-time collaboration

---

**Document Version:** 2.0  
**Last Updated:** October 30, 2025  
**Status:** Current Development Snapshot  
**Prepared For:** Continuing Development & Future Handoff
