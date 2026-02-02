# Press Agent

AI-powered press release automation platform with multi-agent workflow.

## Overview

Press Agent automates press release creation and distribution through:
- **Client-facing app**: AI onboarding chat → Press catalog selection → Request tracking
- **Team-facing app**: Dashboard → Multi-agent production workspace → Quality checks → Delivery

## Tech Stack

### Backend
- **FastAPI** - REST API
- **LangGraph** - Multi-agent workflow orchestration
- **LangChain** - LLM integration
- **OpenRouter** - Cost-optimized LLM routing
- **PostgreSQL** (Supabase) - Database
- **Archon MCP** - Knowledge graph integration

### Frontend
- **Next.js 15** - React framework
- **CopilotKit** - AI chat integration
- **Tailwind CSS** - Styling
- **shadcn/ui** - UI components
- **TypeScript** - Type safety

## Project Structure

```
press-agent/
├── backend/              # FastAPI backend
│   ├── app/
│   │   ├── main.py      # FastAPI entry point
│   │   ├── core/        # Config, database, Archon client
│   │   ├── models/      # Database models
│   │   ├── api/         # API endpoints
│   │   ├── agents/      # AI agents
│   │   ├── graph/       # LangGraph workflows
│   │   └── services/    # Business logic
│   ├── requirements.txt
│   └── .env.example
├── frontend/            # Next.js frontend
│   ├── src/
│   │   ├── app/        # Next.js app router
│   │   ├── components/ # React components
│   │   └── lib/        # Utilities
│   ├── package.json
│   └── .env.local.example
└── shared/             # Shared types/constants
```

## Quick Start

### Backend Setup

```bash
cd backend

# Create virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Copy environment file
cp .env.example .env
# Edit .env with your settings

# Run database migrations
alembic upgrade head

# Start server
uvicorn app.main:app --reload
```

### Frontend Setup

```bash
cd frontend

# Install dependencies
npm install

# Copy environment file
cp .env.local.example .env.local
# Edit .env.local with your settings

# Start dev server
npm run dev
```

## Environment Variables

### Backend (.env)
```bash
# Database
DATABASE_URL=postgresql+asyncpg://user:password@host:port/dbname

# OpenRouter API
OPENROUTER_API_KEY=sk-or-your-key

# Archon MCP
ARCHON_MCP_URL=http://localhost:8051

# Security
SECRET_KEY=your-secret-key
```

### Frontend (.env.local)
```bash
NEXT_PUBLIC_API_URL=http://localhost:8000
OPENROUTER_API_KEY=sk-or-your-key
```

## Agent Workflow

```
Client Request
     ↓
Onboarding Agent (DeepSeek - Free)
     ↓
Writer Agent (Claude 3.5 Sonnet)
     ↓
Editor Agent (GPT-4o-mini)
     ↓
QA Agent (GPT-4o-mini)
     ↓
Delivery
```

## Cost Optimization

| Task | Model | Cost/1K tokens |
|------|-------|----------------|
| Onboarding | DeepSeek Free | $0 |
| Writing | Claude 3.5 Sonnet | $0.003 |
| Editing | GPT-4o-mini | $0.00015 |
| QA | GPT-4o-mini | $0.00015 |

**Estimated cost per press release: ~$0.013**

## API Documentation

Once running, visit:
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc

## License

MIT
