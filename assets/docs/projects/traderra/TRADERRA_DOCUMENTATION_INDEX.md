# Traderra Documentation Index

**Last Updated:** November 9, 2025
**Project Status:** Ready for Development & Integration Testing

---

## Quick Navigation

### For Getting Started
- **Start here:** [TRADERRA_QUICKSTART.md](TRADERRA_QUICKSTART.md)
- **Project overview:** [TRADERRA_PROJECT_EXPLORATION.md](TRADERRA_PROJECT_EXPLORATION.md)
- **Technical deep-dive:** [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md)

---

## Documentation Files

### 1. TRADERRA_QUICKSTART.md
**What:** Quick start guide for running the application
**For:** Developers who want to get the app running immediately
**Contains:**
- Commands to start frontend and backend
- Health check endpoints
- What's currently working
- Troubleshooting guide
- Port configuration reference

**Key Commands:**
```bash
# Frontend
cd traderra/frontend && npm run dev

# Backend
cd traderra/backend && source venv/bin/activate && uvicorn app.main:app --reload --port 6500
```

---

### 2. TRADERRA_PROJECT_EXPLORATION.md
**What:** Comprehensive project structure and architecture overview
**For:** Understanding the entire project layout and how components fit together
**Contains:**
- Complete directory structure
- Configuration details for frontend and backend
- Journal application structure
- Folder system explanation
- Development workflow
- Database setup information
- Integration points with Archon, OpenAI, Clerk
- Current state and next steps

**Key Sections:**
- Overview of the 4-layer architecture
- Frontend configuration (port 6565)
- Backend configuration (port 6500)
- Journal content types (trade entries, daily reviews, documents)
- Default folder structure
- Available journal routes

---

### 3. TRADERRA_TECHNICAL_REFERENCE.md
**What:** In-depth technical guide for developers
**For:** Developers building features and understanding code internals
**Contains:**
- Detailed file structure with line counts
- Component deep-dives (Journal Page, Folder Tree, etc.)
- TypeScript interfaces and data structures
- Backend API endpoints and request/response formats
- Archon MCP integration patterns
- Data flow diagrams
- Testing strategies
- Performance considerations
- Common development tasks

**Key Information:**
- How to add new journal templates
- How to integrate new API endpoints
- How to add new folder types
- Database configuration details
- Debugging information

---

## Project at a Glance

### Technology Stack

**Frontend:**
- Next.js 14.2.0 (running on port 6565)
- React 18.3.0
- TypeScript
- Tailwind CSS + Flowbite
- TanStack Query (React Query)
- Zustand (state management)

**Backend:**
- FastAPI (running on port 6500)
- Python 3.11+
- PydanticAI
- SQLAlchemy ORM
- asyncpg (PostgreSQL async)
- Redis

**Knowledge System:**
- Archon MCP (port 8051)
- RAG-powered intelligence
- Knowledge graph storage

**Data:**
- PostgreSQL (backend data)
- SQLite (frontend dev database)
- Redis (caching)
- R2 (object storage)

---

## Key Features

### Journal Application
- Folder-based content organization
- Multiple content types (trade entries, daily reviews, documents)
- Template-based document creation
- Search and filtering (title, content, date, category, emotion, rating)
- Time period filtering (7d, 30d, 90d, all)
- Drag-and-drop folder management
- Rich text editing (BlockNote, TipTap)

### AI Integration
- **Renata AI Agent** with three personality modes:
  - Analyst Mode (clinical, direct feedback)
  - Coach Mode (professional, constructive)
  - Mentor Mode (reflective, narrative)
- AI sidebar for contextual assistance
- CoPilotKit integration for suggestions

### Authentication & Security
- Clerk authentication integration
- Row-Level Security (RLS) for multi-tenancy
- JWT-based authentication
- API rate limiting

---

## File Locations Reference

### Frontend Key Files
```
traderra/frontend/
├── src/app/journal/page.tsx              # Main journal page (939 lines)
├── src/components/journal/               # Journal UI components
│   ├── journal-components.tsx            # Entry cards, filters, modals
│   ├── JournalLayout.tsx                 # Layout container
│   ├── TemplateSelectionModal.tsx        # Template selection
│   └── BlockNoteEditor.tsx               # Rich text editor
├── src/components/folders/               # Folder management
│   ├── FolderTree.tsx                    # Main folder tree
│   ├── EnhancedFolderTree.tsx            # Advanced features
│   ├── CreateFolderModal.tsx             # Folder creation
│   └── ... (11 total folder components)
├── src/hooks/
│   ├── useFolderContentCounts.ts         # Shared content counts
│   └── useFolders.ts                     # Folder operations
└── .env.local                            # Configuration
```

### Backend Key Files
```
traderra/backend/
├── app/main.py                           # FastAPI application
├── app/ai/renata.py                      # Renata AI agent
├── app/core/archon_client.py             # Archon integration
├── scripts/init_knowledge.py             # Knowledge initialization
├── requirements.txt                      # Python dependencies
├── .env                                  # Configuration
└── README.md                             # Detailed docs
```

---

## Running the Application

### Prerequisites
- Node.js 18+ (frontend)
- Python 3.11+ (backend)
- PostgreSQL 15+ (database)
- Redis (optional, recommended)
- Archon MCP running on port 8051

### Startup Sequence

**Terminal 1: Frontend**
```bash
cd traderra/frontend
npm install
npm run dev
# Opens on http://localhost:6565
```

**Terminal 2: Backend**
```bash
cd traderra/backend
source venv/bin/activate
pip install -r requirements.txt
python scripts/init_knowledge.py
uvicorn app.main:app --reload --port 6500
# API available at http://localhost:6500
# Interactive docs at http://localhost:6500/docs
```

**Verify Everything:**
```bash
# Frontend is running
curl http://localhost:6565

# Backend is running
curl http://localhost:6500/health

# Backend can reach Archon
curl http://localhost:6500/debug/archon
```

---

## Common Development Tasks

### Creating a New Feature
1. Define what needs to be built
2. Check [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md) for similar examples
3. Implement frontend component (if UI needed)
4. Implement backend endpoint (if API needed)
5. Create TypeScript types
6. Add tests
7. Update documentation

### Understanding a Component
1. Check [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md) for detailed breakdown
2. Look at the source file in `traderra/frontend/src/components/`
3. Review any related hooks in `traderra/frontend/src/hooks/`
4. Check example usage in page files

### Debugging Issues
1. **Frontend:** Use browser DevTools, React DevTools extension
2. **Backend:** Use debug endpoints (`/debug/archon`, `/debug/renata`)
3. **API Integration:** Check network tab, review response format
4. **Database:** Check PostgreSQL logs, verify migrations ran

---

## Related Documentation

### In the Repository
- `traderra/backend/README.md` - Complete backend API documentation
- `traderra/frontend/package.json` - Frontend dependencies and scripts
- `traderra/QUALITY_ASSURANCE_REPORT.md` - Testing and QA details
- `traderra/INTEGRATION_SUMMARY.md` - System integration overview
- `traderra/TESTING_PATTERNS_DISCOVERED.md` - Test patterns used

### External Resources
- [Next.js Documentation](https://nextjs.org/docs)
- [FastAPI Documentation](https://fastapi.tiangolo.com/)
- [Archon MCP Documentation](http://localhost:8051/docs)
- [Clerk Documentation](https://clerk.com/docs)
- [PydanticAI Documentation](https://ai.pydantic.dev/)

---

## Development Workflow

### Typical Feature Development

**Phase 1: Plan (Review Documents)**
1. Check [TRADERRA_PROJECT_EXPLORATION.md](TRADERRA_PROJECT_EXPLORATION.md) for relevant parts
2. Review [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md) for implementation patterns
3. Identify affected components and files

**Phase 2: Implement**
1. Start with frontend UI if user-facing
2. Create backend endpoint if data needed
3. Wire them together
4. Add tests
5. Verify with manual testing

**Phase 3: Document**
1. Add comments in code
2. Update relevant documentation files
3. Add to this index if new file structure created

---

## Architecture Diagrams

### High-Level Architecture
```
Frontend Layer (port 6565)
├─ React/Next.js
├─ React Query
└─ Zustand

    ↓ HTTP/WebSocket

API Layer (port 6500)
├─ FastAPI
├─ Renata AI
└─ Archon Client

    ↓ Knowledge Queries

Knowledge Layer (port 8051)
├─ Archon MCP
├─ Knowledge Graph
└─ RAG Engine

    ↓ Data Persistence

Data Layer
├─ PostgreSQL (backend data)
├─ Redis (caching)
└─ R2 (object storage)
```

### Data Flow (Entry Creation)
```
User Form Submission
    ↓
handleSaveEntry() or handleCreateFromTemplate()
    ↓
createContent() API Call to Backend
    ↓
Backend stores in PostgreSQL
    ↓
Archon ingests as knowledge
    ↓
Frontend receives response
    ↓
UI updates with new entry
```

---

## Maintenance & Support

### Common Issues & Solutions

**Port Already in Use**
- Frontend: Modify `package.json` dev script
- Backend: Modify uvicorn command
- Check: `lsof -i :6565` (frontend) or `:6500` (backend)

**Module Not Found Errors**
- Frontend: `rm -rf node_modules && npm install`
- Backend: `pip install -r requirements.txt`

**Database Connection Issues**
- Verify PostgreSQL is running
- Check DATABASE_URL in .env
- Run migrations: `alembic upgrade head`

**Archon Connection Failed**
- Verify Archon MCP is running on 8051
- Check ARCHON_BASE_URL in .env
- Test: `curl http://localhost:8051/health_check`

---

## Quick Reference

### Environment Files
- **Frontend:** `traderra/frontend/.env.local`
- **Backend:** `traderra/backend/.env`

### Default Ports
- Frontend: 6565
- Backend API: 6500
- Archon MCP: 8051
- PostgreSQL: 5432
- Redis: 6379

### API Documentation
- Interactive docs: http://localhost:6500/docs
- ReDoc: http://localhost:6500/redoc

### Test Commands
```bash
# Frontend unit tests
npm run test

# Frontend E2E tests
npm run test:e2e

# Backend health check
curl http://localhost:6500/health

# Backend Archon test
curl http://localhost:6500/debug/archon
```

---

## Learning Path for New Developers

1. **Day 1:** Read [TRADERRA_QUICKSTART.md](TRADERRA_QUICKSTART.md), get app running
2. **Day 2:** Read [TRADERRA_PROJECT_EXPLORATION.md](TRADERRA_PROJECT_EXPLORATION.md), understand architecture
3. **Day 3:** Review [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md), explore code
4. **Day 4+:** Pick a feature, read relevant source files, start coding

---

## Document History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | Nov 9, 2025 | Initial complete documentation |

---

## How to Use These Documents

### If You Want To...

**Get the app running:**
→ Read [TRADERRA_QUICKSTART.md](TRADERRA_QUICKSTART.md)

**Understand the overall architecture:**
→ Read [TRADERRA_PROJECT_EXPLORATION.md](TRADERRA_PROJECT_EXPLORATION.md)

**Implement a feature:**
→ Read [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md) + source files

**Integrate a new component:**
→ Check "Common Tasks" in [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md)

**Debug an issue:**
→ Check "Troubleshooting" in [TRADERRA_QUICKSTART.md](TRADERRA_QUICKSTART.md)

**Understand data structures:**
→ Check "Interfaces" section in [TRADERRA_TECHNICAL_REFERENCE.md](TRADERRA_TECHNICAL_REFERENCE.md)

---

**Documentation Status:** Complete and Current
**Last Verified:** November 9, 2025
**Next Review:** After major feature additions
