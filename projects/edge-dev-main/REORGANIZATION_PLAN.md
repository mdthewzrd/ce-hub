# 🚀 Edge-Dev-Main Reorganization Plan
## Clean Fresh Start for Sprint-Based Development

**Date**: January 26, 2026
**Project**: edge-dev-main
**Goal**: Create clean, organized repository structure that stays clean during sprints
**Approach**: Fresh start with essential files only

---

## 📊 CURRENT STATE ANALYSIS

### Problems Found
1. **50+ directories at root level** - Completely unorganized
2. **Multiple backup directories** (backup/, backups/, archive/)
3. **Virtual environments in repo** (edge-venv/, venv/, venv_new/)
4. **Generated code not ignored** (generated_scanners/, formatted_scanners/)
5. **Test artifacts everywhere** (.pytest_cache/, __pycache__/, .next/)
6. **Documentation scattered** (200+ md files mixed with code)
7. **Multiple scanner systems** (scanners/, uploaded_scanners/, saved_scans/)
8. **No clear separation** between core code and experiments

### What's Working
- ✅ Good backend structure (FastAPI)
- ✅ Good frontend structure (Next.js)
- ✅ Some documentation exists
- ✅ Test files exist (need organization)

---

## 🎯 PROPOSED CLEAN STRUCTURE

```
edge-dev-main/
├── README.md                    # Main project README
├── .gitignore                   # Comprehensive ignore rules
├── package.json                 # Root package config
├── .env.example                 # Environment template
│
├── docs/                        # ALL DOCUMENTATION
│   ├── README.md
│   ├── architecture/
│   │   ├── SYSTEM_OVERVIEW.md
│   │   ├── V31_SCANNER_STANDARD.md
│   │   └── API_ARCHITECTURE.md
│   ├── guides/
│   │   ├── QUICK_START.md
│   │   ├── DEVELOPER_SETUP.md
│   │   └── SPRINT_WORKFLOW.md
│   ├── api/
│   │   └── ENDPOINT_REFERENCE.md
│   └── retrospectives/
│       ├── SPRINT_0_RETROSPECTIVE.md
│       └── SPRINT_1_RETROSPECTIVE.md
│
├── frontend/                    # NEXT.JS FRONTEND
│   ├── README.md
│   ├── package.json
│   ├── next.config.js
│   ├── tsconfig.json
│   ├── tailwind.config.js
│   ├── .env.local.example
│   ├── src/
│   │   ├── app/                # Next.js app directory
│   │   │   ├── page.tsx        # Main dashboard
│   │   │   ├── scan/           # Scanner pages
│   │   │   ├── backtest/       # Backtest pages
│   │   │   ├── exec/           # Execution pages
│   │   │   └── projects/       # Project management
│   │   ├── components/         # React components
│   │   │   ├── ui/             # shadcn/ui components
│   │   │   ├── charts/         # Chart components
│   │   │   ├── forms/          # Form components
│   │   │   └── agents/         # AI agent components
│   │   ├── hooks/              # Custom React hooks
│   │   ├── services/           # API services
│   │   ├── utils/              # Utility functions
│   │   └── types/              # TypeScript types
│   ├── public/
│   │   └── images/
│   └── tests/                  # Frontend tests
│       ├── unit/
│       └── e2e/
│
├── backend/                     # FASTAPI BACKEND
│   ├── README.md
│   ├── main.py                 # FastAPI app entry
│   ├── requirements.txt        # Python dependencies
│   ├── pyproject.toml          # Project config
│   ├── .env.example            # Backend env template
│   ├── src/
│   │   ├── api/                # API routes
│   │   │   ├── scan/           # Scanner endpoints
│   │   │   ├── backtest/       # Backtest endpoints
│   │   │   ├── chart/          # Chart data endpoints
│   │   │   ├── projects/       # Project management
│   │   │   └── agents/         # AI agent endpoints
│   │   ├── core/               # Core business logic
│   │   │   ├── scanner/        # Scanner engine
│   │   │   ├── v31/            # V31 standard implementation
│   │   │   ├── market/         # Market data processing
│   │   │   └── execution/      # Execution engine
│   │   ├── services/           # External services
│   │   │   ├── polygon/        # Polygon.io integration
│   │   │   ├── database/       # Database service
│   │   │   └── cache/          # Caching service
│   │   ├── models/             # Pydantic models
│   │   ├── utils/              # Utility functions
│   │   └── config/             # Configuration
│   ├── data/                   # Static data (gitignored except examples)
│   │   ├── tickers/            # Ticker universes
│   │   └── examples/           # Example data
│   └── tests/                  # Backend tests
│       ├── unit/
│       ├── integration/
│       └── e2e/
│
├── scanners/                    # SCANNER SYSTEM
│   ├── README.md
│   ├── templates/              # Scanner templates
│   │   ├── v31_template.py
│   │   └── scanner_base.py
│   ├── library/                # Reusable scanner patterns
│   │   ├── indicators/
│   │   ├── patterns/
│   │   └── filters/
│   └── generated/              # Generated scanners (gitignored)
│
├── agents/                      # AI AGENT SYSTEM
│   ├── README.md
│   ├── renata/                 # RENATA V2 agent
│   │   ├── RENATA_V2_2026/
│   │   │   ├── ACTIVE_TASKS.md
│   │   │   ├── SPRINT_00_PRE-FLIGHT.md
│   │   │   ├── SPRINT_01_FOUNDATION_REPAIR.md
│   │   │   └── ... (all sprint docs)
│   │   ├── prompts/
│   │   └── workflows/
│   └── tools/                  # Agent tools
│       ├── scanner_tools.py
│       └── analysis_tools.py
│
├── scripts/                     # UTILITY SCRIPTS
│   ├── setup/
│   │   ├── install.sh
│   │   └── dev-start.sh
│   ├── maintenance/
│   │   ├── cleanup.sh
│   │   └── backup.sh
│   └── migration/
│       └── migrate_data.py
│
├── tests/                       # INTEGRATION TESTS
│   ├── e2e/
│   │   ├── scanner_workflow.test.js
│   │   └── backtest_workflow.test.py
│   └── performance/
│       └── load_tests.py
│
└── .github/                     # GITHUB CONFIG
    ├── workflows/
    │   ├── test.yml
    │   └── deploy.yml
    └── ISSUE_TEMPLATE/
        ├── bug_report.md
        └── feature_request.md
```

---

## 🔧 IMPLEMENTATION PLAN

### Phase 1: Preparation (15 minutes)

#### Step 1.1: Backup Current Repository
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects"
cp -r edge-dev-main edge-dev-main-backup-$(date +%Y%m%d)
```

#### Step 1.2: Create New Repository Location
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects"

# Option A: Create new folder (recommended)
mkdir edge-dev-main-v2
cd edge-dev-main-v2

# Option B: Replace current (CAUTION: wipes existing)
# cd edge-dev-main
```

---

### Phase 2: Core Structure Setup (30 minutes)

#### Step 2.1: Create Directory Structure
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main-v2"

# Create all directories
mkdir -p docs/{architecture,guides,api,retrospectives}
mkdir -p frontend/{src/{app,components/{ui,charts,forms,agents},hooks,services,utils,types},public/images,tests/{unit,e2e}}
mkdir -p backend/{src/{api/{scan,backtest,chart,projects,agents},core/{scanner,v31,market,execution},services/{polygon,database,cache},models,utils,config},data/{tickers,examples},tests/{unit,integration,e2e}}
mkdir -p scanners/{templates,library/{indicators,patterns,filters},generated}
mkdir -p agents/{renata/{RENATA_V2_2026,prompts,workflows},tools}
mkdir -p scripts/{setup,maintenance,migration}
mkdir -p tests/{e2e,performance}
mkdir -p .github/{workflows,ISSUE_TEMPLATE}
```

#### Step 2.2: Create Comprehensive .gitignore
```bash
cat > .gitignore << 'EOF'
# ============================================
# EDGE-DEV-MAIN COMPREHENSIVE GITIGNORE
# ============================================

# ---------- Dependencies ----------
node_modules/
npm-debug.log*
yarn-debug.log*
yarn-error.log*
.pnpm-debug.log*
__pycache__/
*.py[cod]
*$py.class
*.so
.Python
*.egg-info/

# ---------- Virtual Environments ----------
.venv/
venv/
venv_new/
edge-venv/
env/
ENV/
.env/
.env.local
.env.*.local
!**/.env.example

# ---------- Build Outputs ----------
.next/
out/
dist/
build/
*.tgz
*.tar.gz

# ---------- Cache & Temporary ----------
.cache/
.tmp/
tmp/
temp/
*.tmp
*.temp
*.bak
*.backup
*.log
logs/
.pytest_cache/
.coverage
htmlcov/
.nyc_output/
test-results/
playwright-report/
playwright/.cache/

# ---------- IDE & Editors ----------
.vscode/
.vscode-server/
.idea/
*.swp
*.swo
*~
.DS_Store
Thumbs.db

# ---------- Generated Code ----------
generated_scanners/
formatted_scanners/
scanners/generated/
backend/generated_scanners/
backend/uploaded_scanners/
backend/scan_results/

# ---------- Data Files ----------
backend/data/*.json
!backend/data/examples/*.json
backend/data/projects.json.local
data/*.csv
data/*.json.gz

# ---------- AI & Agents ----------
.chat_history/
.ai-sessions/
.claude/cache/
.claude/temp/
.archon-cache/
.mcp-cache/

# ---------- Testing ----------
.playwright-mcp/
screenshots/
test-results/

# ---------- Documentation Builds ----------
docs/_build/
docs/.vuepress/dist/

# ---------- Sessions & State ----------
.sessions/
.last-validation.json
.session/

# ---------- Archives & Backups ----------
backup/
backups/
archive/
archives/
old/
deprecated/
*_backup/
*_BACKUP/
*-backup-*/

# ---------- OS Files ----------
.DS_Store
.DS_Store?
._*
.Spotlight-V100
.Trashes
ehthumbs.db
Desktop.ini

# ---------- Large Files ----------
*.mp4
*.mov
*.avi
*.mkv
*.zip
*.tar.gz
*.rar
*.7z

# ---------- Database ----------
*.db
*.sqlite
*.sqlite3
!backend/data/examples/*.db

# ---------- Keep Example Files ----------
!**/.env.example
!**/examples/
!**/templates/
EOF
```

#### Step 2.3: Initialize Git Repository
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main-v2"

# Initialize fresh git
git init

# Create initial commit with structure
git add .
git commit -m "Initial commit: Clean repository structure"
```

---

### Phase 3: Essential Files Migration (1 hour)

#### Step 3.1: Backend Core Files
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"

# Copy core backend files
cp backend/main.py ../edge-dev-main-v2/backend/
cp backend/requirements.txt ../edge-dev-main-v2/backend/
cp -r backend/src/api/* ../edge-dev-main-v2/backend/src/api/
cp -r backend/src/core/* ../edge-dev-main-v2/backend/src/core/
cp -r backend/src/services/* ../edge-dev-main-v2/backend/src/services/
cp -r backend/src/models/* ../edge-dev-main-v2/backend/src/models/
cp -r backend/src/utils/* ../edge-dev-main-v2/backend/src/utils/
cp -r backend/src/config/* ../edge-dev-main-v2/backend/src/config/

# Copy example data
cp backend/data/projects.json ../edge-dev-main-v2/backend/data/examples/
```

#### Step 3.2: Frontend Core Files
```bash
# Copy core frontend files
cp package.json ../edge-dev-main-v2/frontend/
cp next.config.js ../edge-dev-main-v2/frontend/
cp tsconfig.json ../edge-dev-main-v2/frontend/
cp tailwind.config.js ../edge-dev-main-v2/frontend/
cp -r src/app/* ../edge-dev-main-v2/frontend/src/app/
cp -r src/components/* ../edge-dev-main-v2/frontend/src/components/
cp -r src/hooks/* ../edge-dev-main-v2/frontend/src/hooks/
cp -r src/services/* ../edge-dev-main-v2/frontend/src/services/
cp -r src/utils/* ../edge-dev-main-v2/frontend/src/utils/
cp -r src/types/* ../edge-dev-main-v2/frontend/src/types/
```

#### Step 3.3: Scanner System
```bash
# Copy scanner templates and library
cp -r backend/scanners/* ../edge-dev-main-v2/scanners/templates/ 2>/dev/null || true
cp -r backend/template_generation/* ../edge-dev-main-v2/scanners/library/ 2>/dev/null || true

# Copy V31 standard
cp backend/core/v31_standard.py ../edge-dev-main-v2/scanners/templates/v31_template.py 2>/dev/null || true
```

#### Step 3.4: RENATA V2 Agent System
```bash
# Copy entire RENATA V2 directory
cp -r RENATA_V2_2026/* ../edge-dev-main-v2/agents/renata/RENATA_V2_2026/

# Copy agent tools
cp backend/ai_agent_api_endpoints.py ../edge-dev-main-v2/agents/tools/scanner_tools.py 2>/dev/null || true
```

#### Step 3.5: Documentation
```bash
# Copy architecture docs
cp V31_GOLD_STANDARD_SPECIFICATION.md ../edge-dev-main-v2/docs/architecture/ 2>/dev/null || true
cp V31_MULTI_SCAN_SPECIFICATION.md ../edge-dev-main-v2/docs/architecture/ 2>/dev/null || true
cp API_ARCHITECTURE_DECISION.md ../edge-dev-main-v2/docs/architecture/ 2>/dev/null || true

# Copy guides
cp QUICK_START_GUIDE.md ../edge-dev-main-v2/docs/guides/QUICK_START.md 2>/dev/null || true
cp README.md ../edge-dev-main-v2/docs/guides/DEVELOPER_SETUP.md 2>/dev/null || true

# Copy sprint retrospectives
cp RENATA_V2_2026/SPRINT_0_RETROSPECTIVE.md ../edge-dev-main-v2/docs/retrospectives/ 2>/dev/null || true
```

#### Step 3.6: Scripts
```bash
# Copy setup scripts
cp cehub-aliases.sh ../edge-dev-main-v2/scripts/setup/ 2>/dev/null || true

# Copy maintenance scripts (if any)
cp backend/cleanup*.sh ../edge-dev-main-v2/scripts/maintenance/ 2>/dev/null || true
```

---

### Phase 4: README Files (30 minutes)

#### Step 4.1: Main README.md
```bash
cat > ../edge-dev-main-v2/README.md << 'EOF'
# Edge-Dev-Main

AI-powered trading scanner platform with RENATA V2 agent integration.

## Quick Start

### Prerequisites
- Node.js 25+
- Python 3.9+
- PostgreSQL 14+ (optional)

### Setup

1. **Clone repository**
   ```bash
   git clone https://github.com/mdthewzrd/edge-dev-main.git
   cd edge-dev-main
   ```

2. **Install backend dependencies**
   ```bash
   cd backend
   pip install -r requirements.txt
   cp .env.example .env  # Configure your environment
   ```

3. **Install frontend dependencies**
   ```bash
   cd frontend
   npm install
   cp .env.local.example .env.local  # Configure your environment
   ```

4. **Start development servers**
   ```bash
   # Terminal 1: Backend
   cd backend && python main.py

   # Terminal 2: Frontend
   cd frontend && npm run dev
   ```

5. **Access application**
   - Frontend: http://localhost:5665
   - Backend API: http://localhost:8000
   - API Docs: http://localhost:8000/docs

## Documentation

- [Architecture](docs/architecture/SYSTEM_OVERVIEW.md)
- [Quick Start Guide](docs/guides/QUICK_START.md)
- [Developer Setup](docs/guides/DEVELOPER_SETUP.md)
- [API Reference](docs/api/ENDPOINT_REFERENCE.md)
- [Sprint Workflow](docs/guides/SPRINT_WORKFLOW.md)

## Project Structure

```
edge-dev-main/
├── frontend/          # Next.js frontend (port 5665)
├── backend/           # FastAPI backend (port 8000)
├── scanners/          # Scanner system and templates
├── agents/            # AI agent system (RENATA V2)
├── docs/              # Documentation
├── scripts/           # Utility scripts
└── tests/             # Integration tests
```

## Development

See [SPRINT_WORKFLOW.md](docs/guides/SPRINT_WORKFLOW.md) for sprint-based development process.

## License

MIT
EOF
```

#### Step 4.2: Backend README.md
```bash
cat > ../edge-dev-main-v2/backend/README.md << 'EOF'
# Backend - FastAPI

Python FastAPI backend for edge-dev-main trading platform.

## Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Configure environment
cp .env.example .env
# Edit .env with your configuration

# Run development server
python main.py
# OR
uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## Project Structure

```
backend/
├── main.py                 # FastAPI app entry point
├── requirements.txt        # Python dependencies
├── src/
│   ├── api/                # API route handlers
│   ├── core/               # Core business logic
│   ├── services/           # External service integrations
│   ├── models/             # Pydantic models
│   ├── utils/              # Utility functions
│   └── config/             # Configuration
├── data/                   # Static data
└── tests/                  # Backend tests
```

## Key Services

- **Scanner API**: V31 standard scanner generation and execution
- **Backtest API**: Historical backtesting engine
- **Chart API**: Real-time chart data delivery
- **Project API**: Project and scan management
- **Agent API**: AI agent integration

## Testing

```bash
# Run all tests
pytest

# Run specific test
pytest tests/unit/test_scanner.py

# Run with coverage
pytest --cov=src tests/
```

## Environment Variables

See `.env.example` for full list.
EOF
```

#### Step 4.3: Frontend README.md
```bash
cat > ../edge-dev-main-v2/frontend/README.md << 'EOF'
# Frontend - Next.js

React frontend built with Next.js 16 and shadcn/ui.

## Quick Start

```bash
# Install dependencies
npm install

# Configure environment
cp .env.local.example .env.local
# Edit .env.local with your configuration

# Run development server
npm run dev
```

## Project Structure

```
frontend/
├── src/
│   ├── app/                # Next.js app directory
│   ├── components/         # React components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── charts/         # Chart components
│   │   ├── forms/          # Form components
│   │   └── agents/         # AI agent components
│   ├── hooks/              # Custom React hooks
│   ├── services/           # API services
│   ├── utils/              # Utility functions
│   └── types/              # TypeScript types
└── tests/                  # Frontend tests
```

## Key Pages

- `/` - Main dashboard
- `/scan` - Scanner creation and execution
- `/backtest` - Backtesting interface
- `/exec` - Strategy execution
- `/projects` - Project management

## Development

```bash
# Run dev server (port 5665)
npm run dev

# Run type checking
npm run type-check

# Run linting
npm run lint

# Build for production
npm run build
```

## Testing

```bash
# Run unit tests
npm test

# Run E2E tests
npm run test:e2e
```
EOF
```

---

### Phase 5: Sprint Workflow Documentation (30 minutes)

#### Step 5.1: Create SPRINT_WORKFLOW.md
```bash
cat > ../edge-dev-main-v2/docs/guides/SPRINT_WORKFLOW.md << 'EOF'
# Sprint-Based Development Workflow

This document defines the sprint-based development workflow for edge-dev-main.

## Sprint Structure

Each sprint is **1 week** (5 business days) with clear deliverables.

### Sprint Lifecycle

1. **Sprint Planning** (Monday, 1 hour)
   - Review sprint goals
   - Assign tasks
   - Identify dependencies
   - Estimate effort

2. **Sprint Execution** (Tuesday-Thursday)
   - Complete tasks
   - Daily progress updates
   - Blocker resolution

3. **Sprint Review** (Friday, 1 hour)
   - Demo completed features
   - Validate acceptance criteria
   - Stakeholder feedback

4. **Sprint Retrospective** (Friday, 30 min)
   - What went well
   - What could be improved
   - Action items for next sprint

## Task Workflow

### Task States

```
[Backlog] → [In Progress] → [In Review] → [Validation] → [Done]
```

### Task DoD (Definition of Done)

Every task must meet these criteria before marking as "Done":

- [ ] Code written and committed
- [ ] Code follows V31 standard (if applicable)
- [ ] Acceptance criteria met
- [ ] Code reviewed (if complex)
- [ ] Tested manually
- [ ] Documentation updated
- [ ] No known bugs
- [ ] Performance acceptable
- [ ] Task marked as Done

## File Organization Rules

### Where Files Go

**New Feature Code**:
- Frontend: `frontend/src/app/[feature]/`
- Backend: `backend/src/api/[feature]/`

**Reusable Components**:
- UI Components: `frontend/src/components/ui/`
- Business Logic: `backend/src/core/[domain]/`

**Documentation**:
- Architecture: `docs/architecture/`
- Guides: `docs/guides/`
- API Docs: `docs/api/`
- Sprint Retrospectives: `docs/retrospectives/`

**Tests**:
- Unit Tests: `backend/tests/unit/` or `frontend/tests/unit/`
- E2E Tests: `tests/e2e/`

### What NOT to Commit

- Generated code (scanners, formatted output)
- Temporary files
- Cache files
- Environment files with secrets
- Build artifacts
- Dependencies (node_modules, venv)

## Commit Guidelines

### Commit Message Format

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Types**: feat, fix, docs, style, refactor, test, chore

**Examples**:
```
feat(scanner): add V31 standard compliance checker

- Implement 5 required methods check
- Add per-ticker operation validation
- Include market scanning pillar check

Closes #123
```

### Branch Strategy

- `main` - Production-ready code
- `sprint/<n>` - Sprint branch (e.g., sprint/1)
- `feat/<task-id>` - Feature branch
- `fix/<bug-id>` - Bugfix branch

## Daily Workflow

### Morning Standup (Async)

Update your task with:
1. What I completed yesterday
2. What I'll work on today
3. Blockers (if any)

### End of Day

1. Commit and push your work
2. Update task status
3. Document any decisions

## Sprint Handoff

### End of Sprint Checklist

- [ ] All tasks marked Done
- [ ] All tests passing
- [ ] Documentation updated
- [ ] Demo prepared
- [ ] Retrospective completed
- [ ] Next sprint tasks identified

## Keeping Repository Clean

### During Sprints

1. **Daily Commits**: Commit at least once per day
2. **Clean Branches**: Delete merged branches
3. **Update Docs**: Document as you code
4. **Review PRs**: Don't let them pile up

### Weekly Cleanup

```bash
# Delete merged branches
git branch --merged | grep -v "main" | xargs git branch -d

# Clean untracked files
git clean -fd

# Update dependencies
npm audit fix
pip install --upgrade -r requirements.txt
```

## Quality Gates

### Before Merging to Main

1. **Code Review**: All PRs reviewed
2. **Tests Pass**: All tests green
3. **Documentation**: Docs updated
4. **Performance**: No performance regression
5. **Security**: No new vulnerabilities

### Sprint Completion

1. **Deliverables Met**: All sprint goals achieved
2. **Stakeholder Approval**: Features validated
3. **Retrospective Done**: Lessons learned
4. **Next Sprint Ready**: Tasks identified

## Tools & Resources

- **Project Tracking**: GitHub Projects
- **Documentation**: Markdown in `docs/`
- **Communication**: GitHub Issues + PRs
- **Code Review**: GitHub PR reviews

## Emergency Process

If sprint goals can't be met:

1. **Immediate**: Notify stakeholders
2. **Assess**: What's achievable?
3. **Reprioritize**: Must-have vs nice-to-have
4. **Adjust**: Update sprint plan
5. **Document**: Why adjustment was needed
EOF
```

---

### Phase 6: Final Setup (15 minutes)

#### Step 6.1: Create Environment Templates
```bash
# Backend .env.example
cat > ../edge-dev-main-v2/backend/.env.example << 'EOF'
# FastAPI Configuration
ENVIRONMENT=development
DEBUG=true
HOST=0.0.0.0
PORT=8000

# API Keys
POLYGON_IO_API_KEY=your_polygon_api_key_here
ANTHROPIC_API_KEY=your_anthropic_api_key_here

# Database (if using)
DATABASE_URL=postgresql://user:password@localhost:5432/edgedev

# CORS
FRONTEND_URL=http://localhost:5665

# Scanner Configuration
MAX_SCANNERS_PER_REQUEST=10
SCAN_TIMEOUT_SECONDS=300

# Market Data
MARKET_DATA_CACHE_TTL=3600
EOF

# Frontend .env.local.example
cat > ../edge-dev-main-v2/frontend/.env.local.example << 'EOF'
# Next.js Configuration
NEXT_PUBLIC_API_URL=http://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:5665

# Feature Flags
NEXT_PUBLIC_ENABLE_AGENT_CHAT=true
NEXT_PUBLIC_ENABLE_BACKTEST=true

# Analytics (optional)
NEXT_PUBLIC_GA_ID=
EOF
```

#### Step 6.2: Create Setup Scripts
```bash
# Development startup script
cat > ../edge-dev-main-v2/scripts/setup/dev-start.sh << 'EOF'
#!/bin/bash

echo "🚀 Starting Edge-Dev-Main Development Environment..."

# Start Backend
echo "⚡ Starting FastAPI Backend..."
cd backend
source ../.venv/bin/activate 2>/dev/null || python -m venv ../.venv && source ../.venv/bin/activate
pip install -q -r requirements.txt
python main.py &
BACKEND_PID=$!
echo "Backend PID: $BACKEND_PID"

# Wait for backend to start
sleep 3

# Start Frontend
echo "🎨 Starting Next.js Frontend..."
cd ../frontend
npm install
npm run dev &
FRONTEND_PID=$!
echo "Frontend PID: $FRONTEND_PID"

echo ""
echo "✅ All services started!"
echo "  Frontend: http://localhost:5665"
echo "  Backend:  http://localhost:8000"
echo "  API Docs: http://localhost:8000/docs"
echo ""
echo "Press Ctrl+C to stop all services"

# Handle shutdown
trap "kill $BACKEND_PID $FRONTEND_PID; exit" INT TERM

wait
EOF

chmod +x ../edge-dev-main-v2/scripts/setup/dev-start.sh
```

#### Step 6.3: Create GitHub Workflows
```bash
# Test workflow
cat > ../edge-dev-main-v2/.github/workflows/test.yml << 'EOF'
name: Test

on:
  push:
    branches: [main, sprint/*]
  pull_request:
    branches: [main]

jobs:
  backend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Python
        uses: actions/setup-python@v4
        with:
          python-version: '3.11'
      - name: Install dependencies
        run: |
          cd backend
          pip install -r requirements.txt
      - name: Run tests
        run: |
          cd backend
          pytest

  frontend-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '25'
      - name: Install dependencies
        run: |
          cd frontend
          npm ci
      - name: Run tests
        run: |
          cd frontend
          npm test
EOF
```

#### Step 6.4: Initial Commit
```bash
cd ../edge-dev-main-v2

# Add all essential files
git add .

# Commit organized structure
git commit -m "Initial commit: Clean repository structure

- Organized backend (FastAPI)
- Organized frontend (Next.js)
- Scanner system structure
- Agent system structure (RENATA V2)
- Documentation structure
- Comprehensive .gitignore
- Sprint workflow documentation
- Setup scripts and templates"

# Create main branch
git branch -M main

# Ready for GitHub
echo "Repository ready for GitHub!"
echo "Next: create GitHub repo and push"
```

---

## ✅ SUCCESS CRITERIA

### Repository Structure
- [ ] Clear directory structure (<20 items at root)
- [ ] All code properly organized
- [ ] Documentation in dedicated folder
- [ ] Tests separated from source code
- [ ] No generated code in repo

### .gitignore Effectiveness
- [ ] `git status` shows only source code
- [ ] No node_modules, venv, or build artifacts
- [ ] No temporary or cache files
- [ ] No generated scanners or data files

### Documentation
- [ ] README.md at root explains project
- [ ] Each major folder has README.md
- [ ] Sprint workflow documented
- [ ] API documentation exists

### Sprint Readiness
- [ ] SPRINT_WORKFLOW.md guides development
- [ ] Task DoD prevents incomplete work
- [ ] Commit guidelines ensure clean history
- [ ] Branch strategy prevents conflicts

---

## 🎯 MAINTAINING CLEANLINESS

### Daily Habits
1. **Commit Often**: At least once per day
2. **Review PRs**: Don't let them pile up
3. **Update Docs**: As you code
4. **Delete Branches**: After merging

### Weekly Cleanup
1. **Git Clean**: Remove untracked files
2. **Delete Merged Branches**: Keep branch list clean
3. **Update Dependencies**: Security patches
4. **Review Docs**: Ensure accuracy

### Sprint Boundaries
1. **Clean Main**: Only production-ready code
2. **Archive Completed Sprints**: Move to retrospectives/
3. **Update README**: Reflect current state
4. **Close Old Issues**: Keep issue tracker clean

---

## ⏱️ TIME ESTIMATE

| Phase | Task | Time |
|-------|------|------|
| 1 | Preparation | 15m |
| 2 | Core Structure Setup | 30m |
| 3 | Essential Files Migration | 1h |
| 4 | README Files | 30m |
| 5 | Sprint Workflow Docs | 30m |
| 6 | Final Setup | 15m |
| **TOTAL** | | **3 hours** |

---

## 🚀 NEXT STEPS

1. **Review this plan** and approve structure
2. **Run implementation** (I can execute automatically)
3. **Test new repository** (verify everything works)
4. **Push to GitHub** (create new repo or replace existing)
5. **Start Sprint 1** with clean slate!

---

**Ready to proceed?** Say "yes" and I'll execute the entire reorganization automatically!
