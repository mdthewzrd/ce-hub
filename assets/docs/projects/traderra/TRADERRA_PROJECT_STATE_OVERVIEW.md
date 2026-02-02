# Traderra Project Comprehensive Overview

**Generated: 2025-10-27**
**Repository**: `/Users/michaeldurante/ai dev/ce-hub/`

---

## Executive Summary

Traderra is a **professional AI-powered trading journal and performance analysis platform**. It combines advanced frontend UI with a sophisticated backend powered by Renata AI agent and Archon knowledge graph integration. The project follows CE-Hub methodology with Archon-First protocol for continuous learning.

**Key Stats:**
- 31,679 TypeScript/Python source files (excluding node_modules)
- 938 lines in main journal page component
- 1,560 lines in journal components library
- 423 lines in Renata AI agent
- Full Next.js 14 + FastAPI architecture
- Comprehensive testing and validation frameworks

---

## Directory Structure Overview

```
ce-hub/
├── traderra/                           # Original working directory
│   ├── backend/                        # Python FastAPI backend
│   ├── frontend/                       # Next.js 14 frontend
│   └── [documentation files]           # Technical guides and reports
│
└── traderra-organized/                 # Clean, organized reference copy
    ├── platform/                       # Production-ready platform
    │   ├── backend/                    # Complete backend implementation
    │   └── frontend/                   # Complete frontend implementation
    ├── documentation/                  # Comprehensive docs
    │   ├── brand-system/               # Design system & components
    │   ├── technical/                  # Technical architecture
    │   ├── development/                # Development guidelines
    │   └── archived/                   # Historical documentation
    └── agents/                         # AI agent specifications
```

---

## Frontend Architecture

### Location
`/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/`

### Technology Stack
- **Framework**: Next.js 14.2.0
- **Runtime**: React 18.3.0
- **Language**: TypeScript 5.4
- **Styling**: Tailwind CSS 3.4.0 + custom Traderra theme
- **UI Components**: Custom components + BlockNote editor
- **State Management**: 
  - Zustand 4.5.0 (lightweight stores)
  - React Context (DateRange, DisplayMode, PnL modes)
  - TanStack React Query 5.90.3 (data fetching)
- **Rich Text Editing**: 
  - Tiptap 2.26.3 (advanced WYSIWYG editor)
  - BlockNote core + React (structured note-taking)
- **Charts**: 
  - Recharts 2.12.0 (React charts)
  - Lightweight Charts 5.0.9 (professional trading charts)
  - Plotly.js 3.1.1 (advanced analytics)
- **Authentication**: Clerk (NextAuth replacement)
- **AI Integration**: 
  - CopilotKit (AI chat integration)
  - OpenAI API client

### Project Configuration

**package.json Scripts:**
```
dev              - Start dev server on port 6565
build            - Production build
start            - Start production server on port 6565
lint             - ESLint check
type-check       - TypeScript validation
test             - Vitest unit tests
test:e2e         - Playwright browser tests
test:coverage    - Coverage report
test:accessibility - A11y testing
test:performance - Performance validation
test:all         - Complete test suite
```

**Environment Configuration:**
- `.env` - Base configuration
- `.env.local` - Local overrides
- `next.config.js` - Next.js configuration
  - Image domains: unsplash, github
  - API rewrites: `/api/backend/*` → `http://localhost:6500/api/*`
  - Security headers: X-Frame-Options, CSP, etc.

### Core Directories

#### `/src/app/` - Next.js App Router Pages
```
journal/                  # Main journal with folder system (938 lines, MODIFIED)
dashboard/               # Analytics dashboard
statistics/              # Trading statistics view
trades/                  # Trade list/management
analytics/               # Performance analytics
daily-summary/           # Daily trading recap
calendar/                # Calendar view
sign-in/, sign-up/       # Auth pages
[test pages]             # Various feature test pages
api/                     # API route handlers
```

#### `/src/components/` - React Components (30+ component files)
```
journal/
  - JournalLayout.tsx         # Main layout container
  - journal-components.tsx    # Card, filters, stats, modals (1,560 lines)
  - BlockNoteEditor.tsx       # Rich text editor wrapper
  - TemplateSelectionModal.tsx # Journal template selection
  
dashboard/                     # Dashboard widgets
  - main-dashboard.tsx         # Main dashboard
  - renata-chat.tsx            # AI chat integration
  - metrics-tiles.tsx          # Performance metrics
  - performance-chart.tsx      # Chart displays
  - daily-summary-card.tsx     # Summary widget

charts/
  - trading-chart.tsx          # Main trading chart
  - enhanced-trading-chart.tsx # Advanced features
  - overview-chart.tsx         # Overview visualization

ui/                            # Reusable UI components
  - date-range-selector.tsx
  - display-mode-toggle.tsx    # Dollar/% toggle
  - pnl-mode-toggle.tsx        # Profit/loss mode
  - traderview-date-selector.tsx
  - Toast.tsx, LoadingStates.tsx

trades/
  - trades-table.tsx           # Trade history table
  - trade-detail-modal.tsx     # Trade details
  - new-trade-modal.tsx        # Create trade form

auth/
  - sign-in.tsx
  - sign-up.tsx
  - user-profile.tsx

layout/
  - top-nav.tsx                # Navigation bar
  - footer.tsx

providers/
  - query-provider.tsx         # React Query setup
  - toast-provider.tsx         # Toast notifications
  - studio-theme.tsx           # Traderra theme

folders/                       # Folder tree components
agui/                          # Custom UI elements
```

#### `/src/contexts/` - React Contexts
- `DateRangeContext.tsx` - Global date range state
- `DisplayModeContext.tsx` - Dollar/Percentage toggle
- `PnLModeContext.tsx` - Profit/Loss display modes

#### `/src/hooks/` - Custom React Hooks
- `useFolders.ts` - Folder CRUD operations
- `useFolderDragDrop` - Drag & drop handling
- `useFolderContentCounts.ts` - Content count tracking
- `useTrades.ts` - Trade data management
- `useVSCodeTree.ts` - VS Code-style tree implementation

#### `/src/utils/` - Utility Functions
```
csv-parser.ts              # CSV import parsing
trade-statistics.ts        # Calculation logic
data-enhancement-pipeline.ts # Data transformation
trade-matcher.ts           # Trade matching logic
validation-audit-tools.ts  # Data validation
display-formatting.ts      # Number formatting
```

#### `/src/types/` - TypeScript Type Definitions
- `enhanced-trade.ts` - Extended trade data types

#### `/src/styles/` - Global Styles
- `globals.css` - Tailwind base + custom Traderra theme
- `editor.css` - RichText editor styling
- `button-fix.css` - Button customization
- `vscode-tree.css` - Tree component styling

#### `/prisma/` - Database Schema
- `schema.prisma` - SQLite database models
  - User model
  - Trade model (comprehensive fields including risk metrics)
- `dev.db` - Local development database

### Key Features

**Trading Journal**
- Folder-based hierarchical organization
- Rich text editing with BlockNote
- Template system for journal entries
- Trade metadata capture (symbol, side, entry/exit prices, P&L, R-multiple)
- Emotion tracking and rating system
- Tag-based categorization

**Display Modes**
- Dollar amount display
- Percentage return display
- R-multiple (risk-adjusted) display
- Toggle system between modes

**Performance Metrics**
- Win/loss statistics
- Expectancy calculations
- Profit factor
- Drawdown analysis
- Performance by symbol/strategy
- Daily summaries

**AI Integration**
- Renata AI chat assistant (via CopilotKit)
- Real-time suggestions
- Performance analysis

**Testing**
- Vitest unit tests
- Playwright e2e tests
- Accessibility testing (axe-core, jest-axe)
- Performance monitoring

---

## Backend Architecture

### Location
`/Users/michaeldurante/ai dev/ce-hub/traderra/backend/`

### Technology Stack
- **Framework**: FastAPI 0.104+
- **Server**: Uvicorn with auto-reload
- **Database**: 
  - PostgreSQL 15+ with pgvector (future)
  - SQLite (current/development)
- **ORM**: SQLAlchemy 2.0+
- **Cache**: Redis 5.0+
- **AI**: 
  - PydanticAI (Renata agent)
  - OpenAI API 4.0+
  - Anthropic SDK (Claude integration)
- **Authentication**: JWT + Clerk
- **Environment**: Python 3.11+ with venv

### Project Structure

```
app/
├── main.py                 # FastAPI application setup
├── ai/
│   └── renata_agent.py     # Renata AI agent (423 lines)
│       - Three personality modes: Analyst, Coach, Mentor
│       - Performance analysis
│       - Pattern recognition
│       - Psychological insights
│
├── api/
│   ├── ai_endpoints.py     # AI conversation endpoints (12K)
│   │   - POST /ai/query
│   │   - POST /ai/analyze
│   │   - GET /ai/status
│   │   - Knowledge management endpoints
│   ├── folders.py          # Journal folder endpoints (28K)
│   │   - Hierarchical folder CRUD
│   │   - Content association
│   │   - Drag & drop support
│   └── blocks.py           # Journal content blocks (15K)
│       - Rich text content
│       - Template management
│       - Version history
│
├── core/
│   ├── config.py           # Settings & environment config
│   ├── database.py         # Database initialization
│   ├── auth.py             # JWT authentication
│   ├── dependencies.py     # FastAPI dependencies
│   └── archon_client.py    # Archon MCP integration
│
└── models/
    └── folder_models.py    # Pydantic models
```

### API Endpoints

**AI Endpoints** (`/ai/`)
- `POST /ai/query` - General AI conversation
- `POST /ai/analyze` - Performance analysis with Renata
- `GET /ai/status` - AI system health check
- `GET /ai/modes` - Available personality modes
- `GET /ai/knowledge/search` - Archon RAG queries
- `POST /ai/knowledge/ingest` - Store insights to Archon

**Folder Endpoints** (`/folders/`)
- `GET /folders/` - List user folders
- `POST /folders/` - Create folder
- `PUT /folders/{id}` - Update folder
- `DELETE /folders/{id}` - Delete folder
- `GET /folders/{id}/contents` - Get folder contents

**Block/Content Endpoints** (`/blocks/`)
- Content block CRUD operations
- Template management

**System Endpoints**
- `GET /health` - Health check
- `GET /` - API info
- `GET /docs` - Swagger UI
- `GET /debug/archon` - Archon connectivity test
- `GET /debug/renata` - Renata AI test

### Renata AI Agent

The Renata AI agent provides adaptive coaching with three distinct modes:

**Analyst Mode**
- Clinical, direct communication
- Raw performance truth
- Technical metrics focus
- Minimal emotional content

**Coach Mode** (Default)
- Professional and constructive
- Results with actionable suggestions
- Balanced feedback
- Performance-oriented

**Mentor Mode**
- Reflective, narrative-focused
- Deep understanding building
- Psychological insights
- Wisdom-based coaching

### Archon Integration

The backend implements **Archon-First Protocol**:
- All AI operations route through Archon MCP
- Knowledge graph maintains system state
- RAG-powered intelligence for pattern recognition
- Continuous learning through ingestion
- Plan → Research → Produce → Ingest workflow

**Archon Client** (`archon_client.py`)
- MCP connection to localhost:8051
- Knowledge search/retrieval
- Insight ingestion
- Project synchronization

### Environment Configuration

**Key Environment Variables** (.env)
```
# Archon Integration
ARCHON_BASE_URL="http://localhost:8051"
ARCHON_PROJECT_ID="project_id_here"

# AI Configuration
OPENAI_API_KEY="your_key"
OPENAI_MODEL="gpt-4"
ANTHROPIC_API_KEY="your_key"

# Database
DATABASE_URL="postgresql+asyncpg://user:pass@localhost:5432/traderra"
REDIS_URL="redis://localhost:6379"

# Authentication
CLERK_SECRET_KEY="your_key"

# Server
DEBUG=true  # Enable debug endpoints
```

---

## Git Status & Modified Files

### Current Branch
`main` - Primary development branch

### Modified Files
```
M traderra/frontend/src/app/journal/page.tsx (MODIFIED)
  - Added: import { useFolderContentCounts } from '@/hooks/useFolderContentCounts'
  - Refactored: Removed large mock data arrays
  - Impact: Cleaning up mock data, integrating real content counting
```

### Untracked Files
31 new documentation files + configuration files (various guides, validation reports)

---

## Key Recent Commits

1. **97c3a58** - Fix journal system integration issues
2. **784f6eb** - Remove traderra project from CE-Hub repository
3. **143f07f** - Remove all Next.js build artifacts and enhance .gitignore
4. **adc3ab8** - Fix GitHub file size limits
5. **fc9bcd0** - Merge CE-Hub v2.0.0: Vision Intelligence Integration + Enhanced Chat System

---

## Documentation Structure

### Active Documentation (Current State)
Located in `/traderra-organized/documentation/`

**Brand System** (`brand-system/`)
- `TRADERRA_DESIGN_SYSTEM_GUIDE.md` - Complete design system
- `TRADERRA_COMPONENT_LIBRARY.md` - Component patterns
- `TRADERRA_AI_AGENT_CHEATSHEET.md` - Quick development reference
- `TRADERRA_BRAND_KIT_INDEX.md` - Navigation hub

**Technical** (`technical/`)
- `TRADERRA_QUICK_REFERENCE.md` - Platform overview
- `TRADERRA_QUICK_START.md` - Getting started
- `TRADERRA_APPLICATION_STRUCTURE_GUIDE.md` - Architecture

**Development** (`development/`)
- `TRADERRA_VALIDATION_GUIDE.md` - QA procedures
- `TRADERRA_WORKFLOW_OPTIMIZATION_SUMMARY.md` - Best practices

**Archived** (`archived/`)
- Historical documentation and completed analyses

### Project Documentation (Working Directory)
Located in `/traderra/`

Multiple technical guides covering:
- Block editor implementation
- Folder management
- CSV import/datetime fixes
- Journal features
- Testing patterns
- Quality assurance reports
- Dashboard fixes

---

## Database Schema

### SQLite Schema (Current - Development)
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
  
  # Indexes: userId, symbol, date
```

### PostgreSQL Schema (Future Production)
- Planned upgrade with pgvector support
- Row-Level Security (RLS) for multi-tenancy
- Async support with asyncpg

---

## Testing & Quality Assurance

### Test Files Location
`/traderra/frontend/src/tests/` and `/src/utils/__tests__/`

### Test Types
- **Unit Tests** (Vitest) - Component and utility testing
- **E2E Tests** (Playwright) - Browser automation
- **Accessibility Tests** (axe-core) - A11y compliance
- **Performance Tests** - Load testing and metrics
- **Integration Tests** - API and data flow
- **Backward Compatibility** - Legacy feature support

### Test Utilities
- CSV validation and parsing tests
- Data enhancement pipeline tests
- Trade matcher validation
- Journal layout tests
- Template workflow tests

---

## Environment & Setup

### Frontend Setup Requirements
- Node.js >= 18.17.0
- npm/yarn/pnpm
- Port 6565 (configurable)

**Start Development:**
```bash
cd traderra/frontend
npm install
npm run dev
# Accessible at http://localhost:6565
```

### Backend Setup Requirements
- Python 3.11+
- PostgreSQL 15+ (or SQLite for dev)
- Redis (for caching)
- Archon MCP (localhost:8051)

**Start Development:**
```bash
cd traderra/backend
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt
uvicorn app.main:app --reload --port 6500
# API docs at http://localhost:6500/docs
```

### API Integration
Frontend automatically proxies backend calls:
- Frontend: `http://localhost:6565`
- Backend: `http://localhost:6500`
- Rewrite rule: `/api/backend/*` → `http://localhost:6500/api/*`

---

## Key Features & Capabilities

### Trading Journal
- Hierarchical folder system for organization
- Rich text editing with advanced formatting
- Trade metadata capture
- Emotion and confidence tracking
- Rating system
- Template-based entries
- Search and filtering

### Performance Analytics
- Win/loss statistics
- Expectancy calculations
- Profit factor analysis
- Drawdown tracking
- Performance by symbol/strategy
- Daily summaries
- Trend analysis

### Display Modes
- Dollar amount display
- Percentage return display
- R-multiple (risk-adjusted) display
- Toggle system with persistent state

### AI-Powered Coaching
- Renata AI with three personality modes
- Real-time performance analysis
- Pattern recognition
- Psychological insights
- Archon knowledge integration
- Continuous learning

### Data Management
- CSV import/export
- Trade data validation
- Automated calculations
- Data enhancement pipeline
- Validation audit tools

---

## Architecture Highlights

### Frontend Architecture
- **App Router**: Next.js 14 App Router for routing
- **Component Library**: 30+ custom components
- **State Management**: Zustand + React Context + React Query
- **Styling**: Tailwind CSS with custom Traderra theme
- **Editor**: Tiptap + BlockNote for rich editing

### Backend Architecture
- **REST API**: FastAPI for HTTP endpoints
- **AI Agent**: PydanticAI for Renata
- **Knowledge Integration**: Archon MCP client
- **Database**: SQLAlchemy ORM abstraction
- **Authentication**: JWT + Clerk

### Data Flow
1. **Frontend**: User input → Context/Store → API call
2. **Backend**: Request → Route → Service → AI Agent → Archon
3. **Archon**: Knowledge lookup → RAG search → Vector storage
4. **Response**: AI output → Ingest learning → Return result

---

## Current Development Status

### Completed
- AI-powered trading journal with folder management
- Comprehensive component library
- Chart integration and display modes
- Brand system documentation
- Quality validation frameworks
- Backward compatibility

### In Development
- Renata AI agent enhancements
- Advanced trading analytics
- Cross-platform consistency

### Planned
- Mobile applications
- Advanced AI insights
- Multi-broker integration
- Real-time collaboration

---

## Important Files & Locations

### Critical Frontend Files
```
/traderra/frontend/src/app/journal/page.tsx        (938 lines - MAIN JOURNAL)
/traderra/frontend/src/components/journal/         (Journal components)
/traderra/frontend/prisma/schema.prisma            (Database schema)
/traderra/frontend/next.config.js                  (Next.js config)
/traderra/frontend/package.json                    (Dependencies)
```

### Critical Backend Files
```
/traderra/backend/app/main.py                      (FastAPI setup)
/traderra/backend/app/ai/renata_agent.py           (AI agent - 423 lines)
/traderra/backend/app/api/ai_endpoints.py          (AI endpoints - 12K)
/traderra/backend/app/api/folders.py               (Folder endpoints - 28K)
/traderra/backend/requirements.txt                 (Dependencies)
```

### Key Documentation
```
/traderra-organized/README.md                      (Master overview)
/traderra/backend/README.md                        (Backend guide)
/traderra/INTEGRATION_SUMMARY.md                   (Architecture)
/traderra/QUALITY_ASSURANCE_REPORT.md              (QA findings)
```

---

## Development Workflow

### Recommended Approach
1. **Understand Requirements**: Review TRADERRA_QUICK_REFERENCE.md
2. **Design System**: Consult TRADERRA_DESIGN_SYSTEM_GUIDE.md
3. **Component Patterns**: Reference TRADERRA_COMPONENT_LIBRARY.md
4. **Implementation**: Follow CE-Hub Plan → Research → Produce → Ingest
5. **Validation**: Use TRADERRA_VALIDATION_GUIDE.md
6. **Testing**: Run comprehensive test suite

### Key Principles
- **Archon-First**: All AI operations via Archon MCP
- **Context as Product**: Design for reuse and knowledge accumulation
- **Plan Mode**: Present plans before execution
- **Quality Gates**: Implement validation checkpoints
- **Brand Consistency**: Follow design system strictly

---

## Network Configuration

### Ports
- **Frontend**: 6565 (Next.js dev/prod)
- **Backend**: 6500 (FastAPI)
- **Archon MCP**: 8051 (Knowledge graph)
- **Redis**: 6379 (Caching)
- **PostgreSQL**: 5432 (Database)

### API Rewrite Rules
```
Frontend → /api/backend/* 
  ↓
Backend ← http://localhost:6500/api/*
```

---

## Success Metrics & Validation

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

## References & Resources

### Documentation
- Brand System Guide: `/traderra-organized/documentation/brand-system/`
- Technical Specs: `/traderra-organized/documentation/technical/`
- Quick Start: `/traderra-organized/documentation/technical/TRADERRA_QUICK_START.md`

### Code Examples
- Components: `/traderra/frontend/src/components/`
- Hooks: `/traderra/frontend/src/hooks/`
- Utils: `/traderra/frontend/src/utils/`
- Backend: `/traderra/backend/app/`

### Testing
- Test Files: `/traderra/frontend/src/tests/`
- Test Utils: `/traderra/frontend/src/utils/__tests__/`

---

**Document Version**: 1.0
**Last Updated**: October 27, 2025
**Status**: Production Overview Complete

