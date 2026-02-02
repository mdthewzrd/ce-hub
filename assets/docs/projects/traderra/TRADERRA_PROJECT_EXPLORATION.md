# Traderra Project Structure Exploration Report

**Generated:** November 9, 2025
**Project Location:** `/Users/michaeldurante/ai dev/ce-hub/traderra`

## Overview

Traderra is an AI-powered professional trading journal and performance analysis platform with the following architecture:

```
Frontend: Next.js 14.2.0 (Running on port 6565)
         ↓
Backend: FastAPI + PydanticAI (Port 6500)
         ↓
Knowledge: Archon MCP (Port 8051)
         ↓
Data: PostgreSQL + Redis + R2 Storage
```

---

## 1. PROJECT DIRECTORY STRUCTURE

```
traderra/
├── frontend/                    # Next.js React application
│   ├── src/
│   │   ├── app/
│   │   │   ├── journal/        # Main journal page (page.tsx)
│   │   │   ├── journal-enhanced/
│   │   │   └── journal-enhanced-v2/
│   │   ├── components/
│   │   │   ├── journal/        # Journal UI components
│   │   │   │   ├── BlockNoteEditor.tsx
│   │   │   │   ├── JournalLayout.tsx
│   │   │   │   ├── TemplateSelectionModal.tsx
│   │   │   │   └── journal-components.tsx
│   │   │   ├── folders/        # Folder management components
│   │   │   │   ├── FolderTree.tsx
│   │   │   │   ├── EnhancedFolderTree.tsx
│   │   │   │   ├── CreateFolderModal.tsx
│   │   │   │   ├── DragDropProvider.tsx
│   │   │   │   └── ... (more folder components)
│   │   │   └── layout/
│   │   ├── hooks/
│   │   │   ├── useFolders.ts
│   │   │   └── useFolderContentCounts.ts
│   │   ├── contexts/
│   │   └── lib/
│   ├── package.json            # Dev server on port 6565
│   ├── .env.local              # Frontend configuration
│   ├── .next/                  # Next.js build artifacts
│   └── tests/                  # E2E and component tests
│
├── backend/                     # FastAPI Python application
│   ├── app/
│   │   ├── main.py             # FastAPI app entry point
│   │   ├── api/                # API endpoints
│   │   ├── ai/                 # Renata AI agent logic
│   │   ├── core/               # Configuration & Archon client
│   │   └── models/             # Database models
│   ├── scripts/
│   │   └── init_knowledge.py  # Archon initialization
│   ├── requirements.txt        # Python dependencies
│   ├── .env                    # Backend configuration
│   ├── README.md               # Comprehensive backend documentation
│   └── venv/                   # Python virtual environment
│
└── Documentation Files
    ├── QUALITY_ASSURANCE_REPORT.md
    ├── INTEGRATION_SUMMARY.md
    ├── TESTING_PATTERNS_DISCOVERED.md
    └── ... (various research & debug docs)
```

---

## 2. FRONTEND CONFIGURATION

### Port Configuration
- **Development Server Port:** `6565`
- **Command:** `npm run dev` (runs `next dev -p 6565`)
- **Production Start:** `npm run start` (starts `next start -p 6565`)

### Environment Variables (`.env.local`)
```
NEXT_PUBLIC_API_URL=http://localhost:6500         # Backend API
OPENROUTER_API_KEY=sk-or-v1-...                   # Renata AI
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...     # Authentication
CLERK_SECRET_KEY=sk_test_...                      # Clerk server
NEXT_PUBLIC_COPILOT_CLOUD_API_KEY=...             # CoPilot integration
NEXT_PUBLIC_APP_URL=http://localhost:6565         # Frontend URL
ARCHON_MCP_URL=http://localhost:8051              # Knowledge backend
DATABASE_URL=file:/path/to/prisma/dev.db          # Local SQLite
NEXT_PUBLIC_POLYGON_API_KEY=...                   # Market data API
```

### Key Dependencies
- **Framework:** Next.js 14.2.0
- **UI Libraries:** React 18.3.0, Tailwind CSS, Flowbite
- **State Management:** Zustand, React Query (TanStack)
- **Editors:** BlockNote, TipTap (rich text editor)
- **AI Integration:** CopilotKit (@copilotkit/react-core)
- **Authentication:** Clerk (@clerk/nextjs)
- **Forms:** React Hook Form, Zod validation
- **Charts:** Recharts, Plotly
- **Testing:** Vitest, Playwright, Testing Library

---

## 3. BACKEND CONFIGURATION

### API Port
- **Default Port:** `6500`
- **Command:** `uvicorn app.main:app --reload --port 6500`

### Environment Variables (`.env`)
```
DEBUG=true
APP_NAME="Traderra API"
DATABASE_URL="postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra"
DATABASE_POOL_SIZE=10
REDIS_URL="redis://localhost:6379"
ARCHON_BASE_URL="http://localhost:8051"           # Knowledge backend
ARCHON_TIMEOUT=30
ARCHON_PROJECT_ID="7816e33d-2c75-41ab-b232-c40e3ffc2c19"
OPENAI_API_KEY=...                                # For Renata AI
CLERK_SECRET_KEY=...                              # Authentication
```

### Key Features
- **Renata AI Agent:** Three modes (Analyst, Coach, Mentor)
- **Archon Integration:** Knowledge graph for continuous learning
- **API Endpoints:**
  - `POST /ai/query` - AI conversation
  - `POST /ai/analyze` - Performance analysis
  - `GET /ai/status` - System health
  - `GET /ai/knowledge/search` - RAG queries
  - `POST /ai/knowledge/ingest` - Knowledge storage

---

## 4. JOURNAL APPLICATION STRUCTURE

### Main Journal Page
**Location:** `/src/app/journal/page.tsx`

**Key Features:**
- Enhanced mode is now the default and only mode
- Folder-based organization with tree structure
- Content item management (trade entries, daily reviews)
- Template-based document creation
- Search and filtering capabilities
- Time period filtering (7d, 30d, 90d, all)

**Components Used:**
1. **JournalLayout** - Main container with folder sidebar
2. **EnhancedJournalContent** - Entry display and management
3. **TemplateSelectionModal** - Document template selection
4. **FolderTree** - Hierarchical folder navigation
5. **StandaloneRenataChat** - AI sidebar integration

### Folder System

**Components:**
- `FolderTree.tsx` - Main folder tree navigation
- `EnhancedFolderTree.tsx` - Advanced folder management
- `CreateFolderModal.tsx` - Folder creation UI
- `FolderContextMenu.tsx` - Right-click operations
- `FolderOperations.tsx` - CRUD operations
- `DragDropProvider.tsx` - Drag-and-drop support

**Hooks:**
- `useFolderTree()` - Folder state management
- `useFolders()` - Folder operations (create, update, delete)
- `useFolderContent()` - Content item management
- `useFolderContentCounts()` - Content counting hook

**Default Folder Structure:**
```
Trading Journal (folder-1)
├── Daily Trades (folder-1-1)
├── Daily Reviews (folder-1-2)
├── Strategies (folder-2)
├── Analysis (folder-3)
└── Research (folder-4)
```

### Journal Content Types

1. **Trade Entries** (trade_entry)
   - Symbol, Side, Entry/Exit Price
   - P&L, Rating (1-5)
   - Emotion, Category (win/loss)
   - Setup Analysis

2. **Daily Reviews** (daily_review)
   - Market conditions
   - Performance metrics (total P&L, win rate)
   - Best/Worst trades
   - Lessons learned
   - Tomorrow's focus

3. **Documents** (templates)
   - Template-based creation
   - Markdown-based content
   - Flexible metadata

### API Integration

**Entry Display Flow:**
1. Mock data loaded from `mockJournalEntries`
2. Content items queried from folder system
3. Display entries merged and transformed
4. Filtered by selected folder + search criteria
5. Rendered with JournalEntryCard components

**State Management:**
- Local state: selectedFolderId, searchQuery, editingEntry
- Shared state: useFolderContentCounts (shared across pages)
- Content items sync with displayEntries via useMemo

---

## 5. AVAILABLE JOURNAL VARIANTS

### Page Routes
1. **`/journal`** - Main production journal (Enhanced mode)
2. **`/journal-enhanced`** - Enhanced variant
3. **`/journal-enhanced-v2`** - Version 2 variant

All use the same enhanced folder-based system with content management.

---

## 6. DEVELOPMENT WORKFLOW

### Running the Application

**Frontend:**
```bash
cd traderra/frontend
npm install        # Install dependencies
npm run dev        # Start dev server on port 6565
```

**Backend:**
```bash
cd traderra/backend
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_knowledge.py  # Initialize Archon
uvicorn app.main:app --reload --port 6500
```

**Full Stack:**
- Frontend: http://localhost:6565
- Backend API: http://localhost:6500
- Archon MCP: http://localhost:8051 (must be running separately)
- Interactive API docs: http://localhost:6500/docs

### Testing

**Frontend Tests:**
```bash
npm run test              # Run Vitest
npm run test:e2e          # Run Playwright E2E
npm run test:coverage     # Coverage report
npm run test:ui           # UI test runner
```

**Backend Health Checks:**
```bash
curl http://localhost:6500/health                    # API health
curl http://localhost:6500/debug/archon              # Archon connectivity
curl http://localhost:6500/ai/status                 # AI system health
```

---

## 7. DATABASE SETUP

### Frontend Database
- **Type:** SQLite (development)
- **Location:** `prisma/dev.db`
- **ORM:** Prisma

### Backend Database
- **Type:** PostgreSQL
- **Connection:** `postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra`
- **Features:** pgvector support for RAG
- **Migrations:** Alembic-based

### Redis
- **Purpose:** Caching, sessions
- **URL:** `redis://localhost:6379`

---

## 8. AUTHENTICATION & SECURITY

**Clerk Integration:**
- Frontend: Publishable key (`pk_test_...`)
- Backend: Secret key (`sk_test_...`)
- Session management and user context

**Row-Level Security (RLS):**
- Multi-tenant support
- User data isolation

---

## 9. KEY DOCUMENTATION

### Important Files to Review
1. **`README.md`** (backend) - Complete API documentation
2. **`QUALITY_ASSURANCE_REPORT.md`** - Testing results
3. **`INTEGRATION_SUMMARY.md`** - System integration overview
4. **`TESTING_PATTERNS_DISCOVERED.md`** - Test patterns
5. **`FOLDER_FUNCTIONALITY_ANALYSIS.md`** - Folder system deep-dive

### Recent Work
- Journal system integration with folder structure
- Content item management
- Template-based document creation
- Display mode enhancements
- Backward compatibility support

---

## 10. QUICK REFERENCE: HOW THINGS WORK

### Creating a New Journal Entry
1. Click "New Entry" button
2. Select template or create blank entry
3. Fill in trade details (symbol, P&L, etc.)
4. Add setup analysis (rich text)
5. Select folder to save in
6. Save entry → Creates content item

### Navigating Folders
1. Click folder in sidebar to select
2. Entries filtered to that folder
3. Content counts updated automatically
4. Can drag/drop to move entries between folders
5. Right-click for folder options (create, rename, delete)

### Searching & Filtering
- **Search:** Title, content, date
- **Category Filter:** Win/Loss/Neutral
- **Emotion Filter:** Neutral, Positive, Negative
- **Time Period:** Last 7d, 30d, 90d, or all
- **Rating Filter:** Minimum star rating

---

## 11. INTEGRATION POINTS

### Archon MCP (Knowledge Backend)
- RAG queries for trading patterns
- Knowledge ingestion from AI analysis
- Continuous learning integration

### OpenRouter / OpenAI
- Renata AI personality modes
- Analysis and coaching
- Document generation

### Clerk
- User authentication
- Session management
- User context in components

### CoPilotKit
- AI sidebar integration
- Context-aware suggestions
- Natural language processing

---

## 12. CURRENT STATE & NEXT STEPS

**What's Working:**
- Journal page with folder structure
- Content creation and deletion
- Template-based documents
- Search and filtering
- Display mode switching
- Renata AI sidebar

**Areas for Development:**
- Real backend API integration (currently using mocks)
- User authentication context
- Database persistence
- Advanced analytics features
- Export/import functionality
- Rich editor enhancements

---

## SUMMARY

The Traderra project is a sophisticated trading journal application with:
- **Frontend:** Modern Next.js with React, running on port 6565
- **Backend:** FastAPI with Renata AI agent, running on port 6500
- **Knowledge:** Archon MCP integration for intelligent coaching
- **Data:** PostgreSQL + Redis, with Prisma ORM
- **Architecture:** Folder-based content organization with template system
- **AI Features:** Three AI modes (Analyst/Coach/Mentor) for trading analysis
- **Status:** Core functionality implemented, ready for integration testing

All components are configured and ready for development. The system uses CE-Hub methodology (Plan → Research → Produce → Ingest) for continuous learning and improvement.
