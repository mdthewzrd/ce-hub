# Traderra Technical Reference Guide

## Frontend Architecture (Next.js 14.2.0)

### Project Root
```
traderra/frontend/
├── src/
│   ├── app/                          # Next.js app directory
│   │   ├── journal/page.tsx          # Main journal page (939 lines)
│   │   ├── journal-enhanced/         # Enhanced variant
│   │   └── journal-enhanced-v2/      # Version 2 variant
│   │
│   ├── components/
│   │   ├── journal/                  # Journal-specific UI
│   │   │   ├── journal-components.tsx (56KB)
│   │   │   ├── JournalLayout.tsx
│   │   │   ├── TemplateSelectionModal.tsx
│   │   │   └── BlockNoteEditor.tsx
│   │   │
│   │   ├── folders/                  # Folder management
│   │   │   ├── FolderTree.tsx (13.5KB) - Main component
│   │   │   ├── EnhancedFolderTree.tsx (22KB)
│   │   │   ├── CreateFolderModal.tsx
│   │   │   ├── FolderContextMenu.tsx
│   │   │   ├── FolderOperations.tsx
│   │   │   ├── DragDropProvider.tsx
│   │   │   ├── SimpleFolderTree.tsx
│   │   │   ├── RCTreeFolderTree.tsx (rc-tree)
│   │   │   ├── VSCodeFolderTree.tsx
│   │   │   └── NavigationTest.tsx
│   │   │
│   │   ├── chat/                     # AI integration
│   │   │   └── standalone-renata-chat.tsx
│   │   │
│   │   ├── layout/                   # Layout components
│   │   │   └── top-nav.tsx
│   │   │
│   │   └── ui/                       # Reusable UI components
│   │       ├── traderview-date-selector.tsx
│   │       └── display-mode-toggle.tsx
│   │
│   ├── hooks/                        # React hooks
│   │   ├── useFolders.ts (14.4KB) - Folder operations
│   │   │   - useFolderTree()
│   │   │   - useFolderContent()
│   │   │   - useFolderDragDrop()
│   │   │
│   │   └── useFolderContentCounts.ts (14.5KB) - Shared state
│   │       - useFolderContentCounts()
│   │
│   ├── contexts/                     # React contexts
│   │   ├── DateRangeContext.tsx
│   │   └── DisplayModeContext.tsx
│   │
│   ├── lib/                          # Utilities
│   │   ├── markdown.ts - Convert markdown to HTML
│   │   └── utils.ts - Utility functions
│   │
│   └── types/                        # TypeScript types
│       └── (folder and content types)
│
├── tests/                            # Test files
│   ├── journal-folder-expansion.spec.ts
│   ├── journal-navigation.spec.ts
│   ├── journal-folder-debug.spec.ts
│   ├── journal-editor.spec.ts
│   ├── journal-folder-functionality.spec.ts
│   └── journal-folder-fixes-validation.spec.ts
│
├── public/                           # Static assets
├── prisma/                           # Prisma ORM (SQLite)
├── e2e/                              # Playwright E2E tests
├── package.json                      # Dependencies and scripts
├── tsconfig.json                     # TypeScript config
├── next.config.js                    # Next.js config
├── tailwind.config.js                # Tailwind CSS config
└── .env.local                        # Environment variables
```

### Key Components Deep Dive

#### 1. Journal Page (`/src/app/journal/page.tsx`)

**Main Exports:**
- `JournalPage` - Root component
- `EnhancedJournalContent` - Entry display logic
- Hooks: `useState`, `useSearchParams`, `useCallback`, `useMemo`

**State Management:**
```javascript
// Local state
const [showNewEntryModal, setShowNewEntryModal] = useState(false)
const [showTemplateModal, setShowTemplateModal] = useState(false)
const [journalEntries, setJournalEntries] = useState(mockJournalEntries)
const [selectedFolderId, setSelectedFolderId] = useState<string>('folder-1-1')
const [searchQuery, setSearchQuery] = useState('')
const [filters, setFilters] = useState({...})
const [localContentItems, setLocalContentItems] = useState(sharedContentItems)
```

**Key Functions:**
- `filterByTimePeriod()` - Filter entries by date range
- `getDescendantFolderIds()` - Get all folder descendants
- `enhancedFilteredEntries` - Combined filtering logic
- `handleSaveEntry()` - Save or update entry
- `handleDeleteEntry()` - Delete entry
- `handleCreateFromTemplate()` - Create from template

**Content Transformation:**
```javascript
// Entry transformation flow
mockJournalEntries 
  → contentItems (from folder system)
  → displayEntries (merged & transformed)
  → enhanced filterEntries (with time/search/category filters)
  → EnhancedJournalContent (rendered)
```

#### 2. Folder Tree (`/src/components/folders/FolderTree.tsx`)

**Exported Hook:**
```typescript
export function useFolderTree(initialFolders?: FolderNode[]) {
  // Returns:
  // {
  //   folders: FolderNode[]
  //   selectedFolderId: string
  //   expandedFolderIds: Set<string>
  //   handleFolderSelect(id: string)
  //   handleFolderExpand(id: string)
  // }
}
```

**FolderNode Structure:**
```typescript
interface FolderNode {
  id: string
  name: string
  children: FolderNode[]
  type?: 'folder' | 'daily_trades' | 'daily_reviews'
  level?: number
  itemCount?: number
}
```

**Default Structure:**
```
folder-1: Trading Journal
  ├─ folder-1-1: Daily Trades
  └─ folder-1-2: Daily Reviews
folder-2: Strategies
folder-3: Analysis
folder-4: Research
```

#### 3. Folder Content Counts Hook (`/src/hooks/useFolderContentCounts.ts`)

**Purpose:** Shared state across multiple pages for content item counts

**Returns:**
```typescript
{
  folders: FolderNode[]           // Folder structure with counts
  contentItems: ContentItem[]     // All content items
}
```

**Content Item Structure:**
```typescript
interface ContentItem {
  id: string
  title: string
  type: 'trade_entry' | 'daily_review' | 'document' | string
  folder_id: string
  created_at: string
  updated_at?: string
  tags: string[]
  content: {
    trade_data?: {
      symbol: string
      side: 'Long' | 'Short'
      entry_price: number
      exit_price: number
      pnl: number
      rating: 1-5
      emotion: 'neutral' | 'positive' | 'negative'
      category: 'win' | 'loss' | 'neutral'
      setup_analysis: string
    }
    daily_review_data?: {
      market_conditions: string
      day_performance: {}
      lessons_learned: string[]
      tomorrow_focus: string[]
      content_text?: string
    }
    markdown_content?: string
    template_name?: string
  }
}
```

#### 4. Journal Components (`/src/components/journal/journal-components.tsx`)

**Exports:**
- `JournalEntryCard` - Individual entry display
- `JournalFilters` - Filter UI
- `JournalStats` - Statistics display
- `NewEntryModal` - Entry creation/editing
- `mockJournalEntries` - Test data

**JournalEntryCard Props:**
```typescript
{
  entry: JournalEntry
  onEdit: (entry) => void
  onDelete: (id: string) => void
}
```

**JournalEntry Fields:**
```typescript
{
  id: string
  date: string
  title: string
  symbol?: string
  side?: 'Long' | 'Short'
  entryPrice?: number
  exitPrice?: number
  pnl: number
  rating: 1-5
  tags: string[]
  content: string (HTML)
  emotion?: string
  category?: 'win' | 'loss' | 'neutral'
  isContentItem?: boolean
  contentType?: string
}
```

### Environment & Configuration

**Frontend Environment (`.env.local`):**
```env
NEXT_PUBLIC_API_URL=http://localhost:6500
NEXT_PUBLIC_APP_URL=http://localhost:6565
OPENROUTER_API_KEY=sk-or-v1-...
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_...
CLERK_SECRET_KEY=sk_test_...
ARCHON_MCP_URL=http://localhost:8051
NEXT_PUBLIC_POLYGON_API_KEY=...
DATABASE_URL=file:./prisma/dev.db
```

**Build Commands:**
```json
{
  "dev": "next dev -p 6565",
  "build": "next build",
  "start": "next start -p 6565",
  "test": "vitest",
  "test:e2e": "playwright test"
}
```

---

## Backend Architecture (FastAPI + PydanticAI)

### Project Structure
```
traderra/backend/
├── app/
│   ├── main.py                       # FastAPI application
│   │   - @app.get("/health")
│   │   - @app.post("/ai/query")
│   │   - @app.post("/ai/analyze")
│   │   - @app.get("/ai/status")
│   │   - @app.get("/ai/modes")
│   │   - @app.get("/ai/knowledge/search")
│   │   - @app.post("/ai/knowledge/ingest")
│   │   - @app.get("/debug/archon") [debug mode]
│   │   - @app.get("/debug/renata") [debug mode]
│   │
│   ├── api/                          # API endpoints
│   │   └── (endpoint implementations)
│   │
│   ├── ai/                           # AI agent logic
│   │   └── renata.py - Renata AI agent
│   │       - Analyst mode
│   │       - Coach mode (default)
│   │       - Mentor mode
│   │
│   ├── core/                         # Configuration
│   │   ├── config.py - Settings management
│   │   ├── archon_client.py - Archon MCP integration
│   │   └── dependencies.py - Dependency injection
│   │
│   ├── models/                       # Data models
│   │   └── (database models - future)
│   │
│   └── services/                     # Business logic
│       └── (service implementations - future)
│
├── scripts/
│   └── init_knowledge.py             # Initialize Archon KB
│
├── requirements.txt                  # Python dependencies
├── .env                              # Configuration
├── README.md                         # Complete documentation
└── venv/                             # Python virtual environment
```

### Key Dependencies

```
fastapi==0.109.0           # Web framework
uvicorn==0.27.0            # ASGI server
pydantic==2.5.0            # Data validation
pydantic-ai==0.1.0         # AI framework
httpx==0.25.2              # HTTP client
sqlalchemy==2.0.0          # ORM
asyncpg==0.29.0            # PostgreSQL async
redis==5.0.1               # Cache
openai==1.3.0              # OpenAI API
python-clerk==0.3.0        # Clerk auth
```

### API Endpoints

**AI Query (`POST /ai/query`)**
```json
Request: {
  "prompt": "string",
  "mode": "analyst|coach|mentor",
  "context": {}
}

Response: {
  "result": "string",
  "mode": "string",
  "confidence": 0-1
}
```

**Performance Analysis (`POST /ai/analyze`)**
```json
Request: {
  "time_range": "week|month|quarter|year",
  "basis": "gross|net",
  "unit": "r_multiple|percentage|currency"
}

Response: {
  "analysis": {
    "expectancy": number,
    "profit_factor": number,
    "win_rate": number,
    ...
  },
  "insights": [string],
  "recommendations": [string]
}
```

**Knowledge Search (`GET /ai/knowledge/search`)**
```
Query Parameters:
  - query: string (search term)
  - match_count: number (default 5)

Response:
  - results: [{id, score, content, tags}]
```

### Archon MCP Integration

**Configuration:**
```env
ARCHON_BASE_URL=http://localhost:8051
ARCHON_TIMEOUT=30
ARCHON_PROJECT_ID=7816e33d-2c75-41ab-b232-c40e3ffc2c19
```

**Usage Pattern (Plan → Research → Produce → Ingest):**
```python
# RESEARCH: Query Archon for context
patterns = await archon.search_trading_knowledge(
    query="risk management patterns",
    match_count=5
)

# PRODUCE: Generate insights with context
result = await renata.analyze(
    user_data=user_data,
    context=patterns,
    mode="coach"
)

# INGEST: Store for future learning
await archon.ingest_trading_insight(
    insights=result.insights,
    tags=["ai_analysis", "risk_management"]
)
```

### Database Configuration

**PostgreSQL:**
```
DATABASE_URL=postgresql+asyncpg://traderra:traderra123@localhost:5432/traderra
```

**Migrations:**
- Location: `traderra/backend/migrations/`
- Tool: Alembic
- Commands: `alembic upgrade head`

**pgvector Extension:**
- Required for RAG embeddings
- Initialize: `CREATE EXTENSION vector;`

---

## Data Flow Diagrams

### Entry Creation Flow
```
User Clicks "New Entry"
        ↓
TemplateSelectionModal Opens
        ↓
User Selects Template/Template
        ↓
Form Data Submitted
        ↓
handleCreateFromTemplate() / handleSaveEntry()
        ↓
createContent() API Call
        ↓
Content Item Created in Folder
        ↓
Entry Appears in JournalEntryCard
```

### Filtering Flow
```
User Enters Search/Selects Folder
        ↓
State Updated (searchQuery, selectedFolderId, filters)
        ↓
displayEntries Computed (journalEntries + contentItems)
        ↓
filterByTimePeriod() Applied
        ↓
enhancedFilteredEntries Computed
        ↓
EnhancedJournalContent Re-renders
```

### Backend Processing Flow
```
Frontend API Request
        ↓
FastAPI Endpoint Handler
        ↓
RESEARCH: Query Archon MCP
        ↓
PRODUCE: Generate with Renata AI
        ↓
INGEST: Store Learning in Archon
        ↓
Response to Frontend
```

---

## Testing Strategy

### Frontend Tests

**Component Tests (Vitest):**
```bash
npm run test                # Run all tests
npm run test:watch        # Watch mode
npm run test:ui           # UI viewer
npm run test:coverage     # Coverage report
```

**E2E Tests (Playwright):**
```bash
npm run test:e2e          # Run Playwright tests
npm run test:e2e:ui       # UI test runner
```

**Test Files Location:**
- Unit: `src/tests/`
- E2E: `tests/`
- Specs: `tests/*.spec.ts`

### Backend Health Checks

```bash
# API Health
curl http://localhost:6500/health

# Archon Connectivity
curl http://localhost:6500/debug/archon

# AI System
curl http://localhost:6500/debug/renata

# Interactive Docs
# http://localhost:6500/docs
```

---

## Development Workflow

### Adding New Features

**Frontend (React Component):**
1. Create component in `src/components/`
2. Add types if needed
3. Integrate into page
4. Add tests in `tests/`
5. Update documentation

**Backend (API Endpoint):**
1. Define request/response models
2. Implement endpoint in `app/main.py`
3. Add Archon query in RESEARCH phase
4. Add response formatting in PRODUCE phase
5. Add knowledge ingestion in INGEST phase

### Debugging

**Frontend:**
- Browser DevTools console
- React DevTools extension
- Next.js debug output

**Backend:**
- Debug endpoints: `/debug/archon`, `/debug/renata`
- Log output: JSON structured logging
- Interactive docs: `/docs`

---

## Performance Considerations

### Frontend Optimization
- Content items loaded via `useFolderContentCounts` (shared across pages)
- `useMemo` for expensive computations
- Virtual scrolling for large entry lists
- Markdown to HTML caching

### Backend Optimization
- Archon RAG for efficient knowledge retrieval
- Connection pooling (PostgreSQL)
- Redis caching for frequent queries
- Async/await for non-blocking I/O

### Database Optimization
- Index on content folder_id
- Index on created_at for sorting
- pgvector indices for embeddings
- Connection pooling configuration

---

## Common Tasks

### Add New Journal Template
1. Define in `TemplateSelectionModal.tsx`
2. Add content type handling in `page.tsx`
3. Create markdown template
4. Add variables for replacement
5. Test creation flow

### Integrate New API Endpoint
1. Create endpoint in backend
2. Add TypeScript types in frontend
3. Create query/mutation hook
4. Integrate in component
5. Update error handling

### Add New Folder Type
1. Update `FolderNode` type
2. Add folder creation logic
3. Update folder tree rendering
4. Update content filtering
5. Add tests

---

**Last Updated:** November 9, 2025
**Version:** 1.0
**Status:** Complete - Ready for development
