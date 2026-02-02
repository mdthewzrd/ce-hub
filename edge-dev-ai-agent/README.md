# EdgeDev AI Agent
**Archon-Powered Trading Strategy Development System**

An AI agent system that collaborates with you to develop trading strategies using Archon as the knowledge/memory base.

## Quick Start

1. Install Python dependencies:
```bash
pip install -r requirements.txt
```

2. Install Web UI dependencies:
```bash
cd web
npm install
cd ..
```

3. Configure environment:
```bash
cp .env.example .env
# Edit .env with your API keys
```

4. Get OpenRouter API key (for LLM access):
- Visit https://openrouter.ai/keys
- Add to .env: `OPENROUTER_API_KEY=your_key_here`

5. Start the backend server:
```bash
python -m src.main
# Runs on http://localhost:7447
```

6. Start the web UI (in a new terminal):
```bash
cd web
npm run dev
# Runs on http://localhost:7446
```

7. Or use the CLI:
```bash
python cli.py
```

## Architecture

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    COMPLETE SYSTEM ARCHITECTURE                         │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 1: ARCHON (Knowledge & Memory)                             │ │
│  │  ├── Gold Standards (all documentation)                          │ │
│  │  ├── Past Projects (scanners, backtests, results)               │ │
│  │  ├── Conversations (full chat history)                           │ │
│  │  ├── A+ Examples Database                                         │ │
│  │  ├── Performance Database (what worked)                          │ │
│  │  └── Learning Evolution (agent improvement over time)          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↕ MCP/RAG                               │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 2: AGENT ORCHESTRATION                                    │ │
│  │  ├── Main Orchestrator (coordinates everything)                 │ │
│  │  ├── Subagent Router (routes to specialist)                     │ │
│  │  └── Conversation Manager (chat interface)                      │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 3: SPECIALIST SUBAGENTS                                   │ │
│  │  ├── Scanner Builder (V31, patterns)                             │ │
│  │  ├── Strategy Builder (execution, pyramiding, etc.)            │ │
│  │  ├── Backtest Builder (simulation, metrics)                     │ │
│  │  ├── Optimizer (parameter search, validation)                   │ │
│  │  ├── Validator (testing, debugging, quality check)            │ │
│  │  └── Trading Advisor (markets, regimes, edge analysis)          │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                              ↕                                      │
│  ┌──────────────────────────────────────────────────────────────────┐ │
│  │  LAYER 4: EXECUTION & VALIDATION                                │ │
│  │  ├── Code Generator (writes Python code)                        │ │
│  │  ├── Code Validator (checks syntax, runs tests)                  │ │
│  │  ├── EdgeDev Client (uploads, runs, views results)              │ │
│  │  └── Result Analyzer (metrics, visualization)                   │ │
│  └──────────────────────────────────────────────────────────────────┘ │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

## Configuration

### LLM Provider: OpenRouter
- Access to multiple models (Claude, GPT-4, etc.)
- OpenAI-compatible API
- API key: `OPENROUTER_API_KEY`

### Archon MCP: Full Server
- Running on localhost:8051
- 13 tools available
- Knowledge & memory storage

### EdgeDev Platform
- Backend: localhost:5666 (needs to be started)
- Dashboard: localhost:5665 (needs to be started)
- Polygon API for market data

## Project Structure

```
edge-dev-ai-agent/
├── prompts/              # System prompts for all agents
│   ├── orchestrator.md
│   ├── scanner_builder.md
│   ├── strategy_builder.md
│   ├── backtest_builder.md
│   ├── optimizer.md
│   ├── validator.md
│   └── trading_advisor.md
├── src/                  # Source code
│   ├── ingest/          # Knowledge ingestion system
│   │   ├── chunker.py
│   │   ├── archon_client.py
│   │   ├── local_retriever.py
│   │   └── ingest_gold_standards.py
│   ├── agents/          # Agent implementations
│   ├── code/            # Code generation and validation
│   │   ├── generator.py
│   │   ├── validator.py
│   │   └── analyzer.py
│   ├── learning/        # Learning and memory system
│   │   ├── extractor.py
│   │   ├── memory.py
│   │   └── evolution.py
│   ├── conversation/    # Conversation management
│   ├── llm/             # LLM client integration
│   └── edgedev/         # EdgeDev platform client
├── web/                 # Next.js Web UI
│   ├── app/             # Next.js App Router pages
│   ├── components/      # Reusable components
│   ├── lib/             # API client and hooks
│   └── styles/          # Global styles
├── data/                # Data storage
│   └── chunks/          # Chunked knowledge (549 chunks from 6 documents)
├── tests/               # Tests
├── docs/                # Documentation
└── config/              # Configuration files
```

## Build Progress

| Phase | Status | Description |
|-------|--------|-------------|
| **Phase 0** | ✅ Complete | Foundations setup (project structure, config) |
| **Phase 1** | ✅ Complete | Archon Knowledge Base (549 chunks from 6 Gold Standards) |
| **Phase 2** | ✅ Complete | System Prompts (7 agent prompts written) |
| **Phase 3** | ✅ Complete | Orchestrator, LLM Client, Conversation Manager |
| **Phase 4** | ✅ Complete | All 6 Subagents Implemented |
| **Phase 5** | ✅ Complete | Code Generation, Validation, EdgeDev Integration |
| **Phase 6** | ✅ Complete | Learning Loop & Archon Storage |
| **Phase 7** | ✅ Complete | Advanced Web UI (Next.js) |

### Phase 7 Details: Advanced Web UI (Next.js)
- **React/Next.js Interface** - Modern web UI with App Router
- **Chat Interface** - Real-time chat with the AI agent
- **Pattern Dashboard** - View top performing patterns
- **Project Management** - Browse and manage projects
- **Memory Search** - Search conversations and learnings
- **Activity Log** - View recent workflows
- **Settings Page** - System status and configuration
- **API Integration** - SWR hooks for data fetching

### Phase 6 Details: Learning Loop & Archon Storage

### Phase 5 Details: Code Generation & Validation
- **Code Generator** - Extract Python code from LLM responses
- **Code Validator** - Syntax, imports, V31 structure checks
- **File Operations** - Save generated code to files
- **EdgeDev Client** - Connect to EdgeDev backend API
- **Result Analyzer** - Parse and display execution metrics
- **Enhanced Scanner Builder** - Auto-saves generated code

### Phase 4 Details: All Subagents
All 6 specialist agents are now implemented:
1. **Scanner Builder** - V31-compliant scanner development
2. **Strategy Builder** - Complete execution strategies
3. **Backtest Builder** - Historical validation
4. **Optimizer** - Parameter tuning with walk-forward
5. **Validator** - Code quality and standards compliance
6. **Trading Advisor** - Market analysis and edge assessment

### Phase 3 Details: Agent System
- **OpenRouter Client**: LLM integration with fallback support
- **Base Agent Class**: Common functionality for all agents
- **Orchestrator**: Routes requests, manages workflows
- **Conversation Manager**: Session management and history
- **Scanner Builder**: First subagent implementation (example)
- **FastAPI Server**: REST API at http://localhost:7447
- **CLI Interface**: Interactive command-line tool

### Phase 1 Details: Knowledge Base
- **Documents Ingested**: 6 Gold Standard files
- **Chunks Created**: 549 total chunks
- **Chunk Types**: 300 sections, 236 code blocks, 13 examples
- **Storage**: Local JSON (ready for Archon when MCP methods available)

#### Documents Loaded:
1. EDGEDEV_PRESUMED_GOLD_STANDARD_SPECIFICATION.md (121 chunks) - V31 Architecture
2. EDGEDEV_PATTERN_TYPE_CATALOG.md (94 chunks) - Pattern Types
3. EDGEDEV_CODE_STRUCTURE_GUIDE.md (73 chunks) - Code Standards
4. EDGEDEV_BACKTEST_OPTIMIZATION_GOLD_STANDARD.md (65 chunks) - Backtesting
5. EDGEDEV_INDICATORS_EXECUTION_GOLD_STANDARD.md (98 chunks) - Indicators & Execution
6. EDGEDEV_EXECUTION_SYSTEM_GOLD_STANDARD.md (98 chunks) - Complete Strategy Framework

### Phase 2 Details: System Prompts
All 7 agent system prompts completed:
1. **Orchestrator** - Main coordinator, workflow management
2. **Scanner Builder** - V31-compliant scanner development
3. **Strategy Builder** - Complete execution strategy design
4. **Backtest Builder** - Historical validation and simulation
5. **Optimizer** - Parameter tuning with overfitting prevention
6. **Validator** - Code quality and standards compliance
7. **Trading Advisor** - Market analysis and edge assessment

## Documentation

- **Prompts README**: `prompts/README.md` - Quick reference for all agents
- **Build Plan**: `/Users/michaeldurante/ai dev/ce-hub/EDGEDEV_BUILD_PLAN.md`
- **Gold Standards**: `/Users/michaeldurante/ai dev/ce-hub/EDGEDEV_*.md`

## Status

**Version**: 0.7.0
**Status**: Phase 7 Complete - Advanced Web UI Operational

## Web UI

The EdgeDev AI Agent now includes a modern React/Next.js web interface:

```bash
cd web
npm install
npm run dev
# Visit http://localhost:7446
```

### Web UI Features:
- **Chat** - Interactive AI chat interface
- **Patterns** - View top performing patterns
- **Projects** - Manage trading strategy projects
- **Memory** - Search past conversations
- **Activity** - View workflow logs
- **Settings** - System configuration

## New API Endpoints

### Learning System
- `GET /api/learning/workflows` - List workflow logs
- `GET /api/learning/insights` - Get stored insights
- `GET /api/learning/projects` - List projects
- `GET /api/learning/projects/{project_id}` - Get project details
- `GET /api/learning/memory/search` - Search memory for context
- `GET /api/learning/patterns` - Get top performing patterns
- `GET /api/learning/patterns/{pattern_name}` - Get pattern recommendation
- `GET /api/learning/parameters/{parameter}` - Get parameter range
- `GET /api/learning/stats` - Get learning system statistics

### Code Operations
- `POST /api/code/validate` - Validate Python code
- `GET /api/code/validate/{file_path}` - Validate a file
- `GET /api/generated/files` - List generated code files
- `GET /api/generated/files/{file_path}` - Get file content

### EdgeDev Integration
- `GET /api/edgedev/health` - Check EdgeDev status
- `POST /api/edgedev/execute` - Execute scanner on EdgeDev

## Usage Examples

### CLI Interface
```bash
python cli.py

You: Create a scanner for mean reversion patterns
Agent: [Routes to Scanner Builder, provides V31 code]

You: Build a strategy with pyramiding and trailing stops
Agent: [Routes to Strategy Builder, provides complete spec]

You: What's the V31 architecture?
Agent: [Explains the 5-stage pipeline from knowledge base]

You: Optimize my scanner parameters
Agent: [Routes to Optimizer, provides tuning approach]

You: Validate this code
Agent: [Routes to Validator, checks V31 compliance]

You: What's the current market regime?
Agent: [Routes to Trading Advisor, provides market analysis]
```

### API Usage
```bash
# Start server
python -m src.main

# Send message (curl)
curl -X POST http://localhost:7447/api/chat \
  -H "Content-Type: application/json" \
  -d '{"message": "Explain pyramiding strategies"}'

# Get status
curl http://localhost:7447/api/status
```

## Next Steps

To continue development:
- **Phase 4**: Implement remaining subagents (Strategy Builder, Backtest Builder, etc.)
- **Phase 5**: Add code generation and validation
- **Phase 6**: Integrate with EdgeDev platform

## Documentation

- **Prompts README**: `prompts/README.md` - Agent quick reference
- **Build Plan**: `/Users/michaeldurante/ai dev/ce-hub/EDGEDEV_BUILD_PLAN.md`
- **Gold Standards**: `/Users/michaeldurante/ai dev/ce-hub/EDGEDEV_*.md`
