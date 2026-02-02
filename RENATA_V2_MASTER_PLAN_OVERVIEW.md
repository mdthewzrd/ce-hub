# 🎯 RENATA V2.0 - MASTER PLAN OVERVIEW
## Complete AI Agent Trading Platform - 10-Week Build Cycle

**Visionary**: Michael Durante
**Orchestrator**: CE-Hub Master System
**Timeline**: 10 Weeks (January 24 - April 4, 2026)
**Approach**: CopilotKit Rebuild + Sprint-Based Execution

---

## 📋 EXECUTIVE SUMMARY

**PRIMARY OBJECTIVE:**
Build a production AI agent platform that transforms ANY input (ideas, code, charts, videos, A+ examples) into production-ready V31 scanners with comprehensive backtesting and validation - enabling rapid strategy systematization at 5+ strategies per week.

**BUSINESS GOAL:**
Scale to $1M/month through fully automated trading infrastructure with high-frequency execution without quality loss.

**TECHNICAL APPROACH:**
- Rebuild Renata with CopilotKit v1.50 (cleaner architecture)
- Maintain existing EdgeDev platform (port 5665)
- Leverage existing FastAPI backend (port 8000)
- Integrate Archon knowledge graph (port 8051)
- Follow V31 Gold Standard specification

---

## 🏗️ COMPLETE SYSTEM ARCHITECTURE

```
┌─────────────────────────────────────────────────────────────────┐
│                    EDGE DEV FRONTEND (Next.js)                      │
│                          Port: 5665                                 │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────────────┐    │
│  │   /scan      │  │  /backtest   │  │  CopilotKit Runtime │    │
│  │   Page       │  │   Page       │  │  (NEW - Replaces    │    │
│  │              │  │              │  │   RenataV2Chat)    │    │
│  └──────────────┘  └──────────────┘  └─────────────────────┘    │
│                                                                     │
│  ┌────────────────────────────────────────────────────────────┐   │
│  │         AG-UI Protocol + CopilotKit Actions                │   │
│  │  • useAgent() hook for agent state management             │   │
│  │  • useCopilotAction() for tool registration              │   │
│  │  • Message state & history tracking                      │   │
│  └────────────────────────────────────────────────────────────┘   │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                     AG-UI Protocol / HTTP
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│              RENATA MULTI-AGENT ORCHESTRATOR (CopilotKit)           │
│                                                                     │
│  ┌──────────────┐  ┌──────────────┐  ┌─────────────┐  ┌─────────┐ │
│  │  PLANNER     │  │  RESEARCHER  │  │   BUILDER   │  │EXECUTOR │ │
│  │  Agent       │  │  Agent       │  │   Agent     │  │ Agent   │ │
│  │              │  │              │  │             │  │         │ │
│  │ (LangGraph   │  │ (Archon RAG) │  │ (Code Gen)  │  │(Backend │ │
│  │  Workflow)   │  │              │  │ + AST)      │  │Integration)│ │
│  └──────────────┘  └──────────────┘  └─────────────┘  └─────────┘ │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │              ANALYST Agent (Optimization)                    │  │
│  │              (IS/OOS, Monte Carlo, Regime Analysis)          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                    API Calls / WebSocket
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                      FASTAPI BACKEND (Port 8000)                     │
│                                                                     │
│  ┌──────────────────┐  ┌──────────────────┐  ┌─────────────────┐  │
│  │  Scanner Engine  │  │  Backtest Engine │  │  Validation     │  │
│  │  (v31 Pipeline)  │  │  (IS/OOS/Monte)  │  │  System         │  │
│  │  • Universal     │  │  • Parameter     │  │  • V31          │  │
│  │    Scanner v2    │  │    Optimization  │  │    Compliance   │  │
│  │  • Robustness    │  │  • IS/OOS        │  │  • Statistical   │  │
│  │    Engine        │  │  • Monte Carlo   │  │    Significance  │  │
│  └──────────────────┘  └──────────────────┘  └─────────────────┘  │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  Real-Time Execution (WebSocket + Status Endpoints)          │  │
│  └──────────────────────────────────────────────────────────────┘  │
└───────────────────────────────┬─────────────────────────────────────┘
                                │
                        Archon MCP Protocol
                                │
┌───────────────────────────────▼─────────────────────────────────────┐
│                      ARCHON KNOWLEDGE GRAPH (Port 8051)               │
│                                                                     │
│  ┌──────────────────────────────────────────────────────────────┐  │
│  │  KNOWLEDGE BASE (RAG-Enabled):                               │  │
│  │  • V31 Gold Standard Specification                          │  │
│  │  • Lingua Trading Framework (complete)                     │  │
│  │  • All 13 Trading Setups (systematized + concepts)        │  │
│  │  • A+ Examples & Pattern Library                            │  │
│  │  • Quant/Backtesting Best Practices                         │  │
│  │  • Every Strategy Built (with learnings)                   │  │
│  │  • Code Templates & Patterns                                │  │
│  └──────────────────────────────────────────────────────────────┘  │
│                                                                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌─────────────────┐    │
│  │  RAG     │  │ Project  │  │   Task   │  │  Learning       │    │
│  │  Search  │  │  Mgmt    │  │ Tracking │  │  Ingestion      │    │
│  └──────────┘  └──────────┘  └──────────┘  └─────────────────┘    │
└─────────────────────────────────────────────────────────────────────┘
```

---

## 🚀 10-WEEK SPRINT OVERVIEW

| Sprint | Duration | Focus | Key Deliverables | Success Criteria |
|--------|----------|-------|------------------|------------------|
| **0** | **Pre-Flight** | **Setup & Planning** | Environment ready, tasks defined | Ready to code |
| **1** | Week 1 | Foundation Repair | Fix critical bugs, start Archon | Upload → Execute works |
| **2** | Week 2 | Archon Integration | Knowledge base populated | RAG search functional |
| **3** | Weeks 3-4 | CopilotKit Foundation | Rebuild Renata interface | Chat interface working |
| **4** | Weeks 4-5 | Planner Agent | A+ analysis workflow | Can create plans from examples |
| **5** | Weeks 5-6 | Researcher Agent | Archon RAG integration | Can find similar strategies |
| **6** | Weeks 6-7 | Builder Agent | Code generation | Generates working V31 code |
| **7** | Week 7 | Executor Agent | Backend integration | Runs scanners, tracks progress |
| **8** | Week 8 | Analyst Agent | Optimization & validation | Improves strategy performance |
| **9** | Week 9 | Integration Testing | End-to-end workflows | Complete workflows functional |
| **10** | Week 10 | Production Polish | Performance & docs | Platform production-ready |

---

## 📊 SUCCESS METRICS

### Technical Metrics
- **Scanner Generation**: 95%+ success rate, 100% V31 compliant
- **Execution Speed**: <60s for full market scans (maintain current 315s)
- **API Response**: <2s for 95% of requests
- **Platform Uptime**: 99.5%+ availability
- **Code Quality**: 100% V31 validation pass rate

### User Experience Metrics
- **Time to First Scanner**: <10 minutes from signup to execution
- **Strategy Velocity**: 5+ new strategies per week (by Week 10)
- **AI Response Time**: <3s for agent responses
- **Workflow Success**: 95%+ completion rate
- **User Satisfaction**: 4.5+/5.0 rating

### Business Impact Metrics
- **Edge Validation**: 100% IS/OOS before deployment
- **Knowledge Growth**: Every session increases system intelligence
- **Capture Rate**: >90% of theoretical edge
- **Scalability**: Handle 100+ concurrent scans
- **Time to Market**: Idea → Launch in <1 day

---

## 🎯 CORE WORKFLOWS SUPPORTED

### 1. A+ Example Analysis (HIGHEST PRIORITY)
```
Chart Image + Breakdown
    ↓
Planner extracts parameters
    ↓
Researcher finds similar patterns in Archon
    ↓
Builder creates scanner mold
    ↓
Executor runs scan on whole market
    ↓
Analyst optimizes parameters
    ↓
Validate on A+ names
    ↓
Add execution logic → Backtest → Launch
```

### 2. Code Transformation (HIGH PRIORITY)
```
Existing Code (non-V31)
    ↓
Researcher analyzes structure
    ↓
Builder transforms to V31
    ↓
Validator checks compliance
    ↓
Executor tests execution
    ↓
Analyst suggests optimizations
```

### 3. Idea → Scanner (HIGHEST PRIORITY)
```
Natural Language Idea
    ↓
Planner clarifies requirements
    ↓
Researcher searches Archon for similar
    ↓
Builder generates V31 code
    ↓
Validator checks compliance
    ↓
Executor backtests
    ↓
Analyst optimizes
```

---

## 🔑 KEY PRINCIPLES

### 1. ARCHON-FIRST PROTOCOL (NON-NEGOTIABLE)
- EVERY workflow starts with Archon sync
- Knowledge graph queried before generating solutions
- All learnings ingested back into Archon
- System intelligence compounds over time

### 2. COPILOTKIT ARCHITECTURE (CLEAN REBUILD)
- Replace RenataV2Chat with CopilotKit v1.50
- AG-UI protocol for agent communication
- useAgent() hook for state management
- useCopilotAction() for tool registration
- Clean separation of concerns

### 3. HUMAN-IN-THE-LOOP DESIGN
- User approval at key checkpoints
- AI suggests, human decides
- Transparency in AI reasoning
- User always has final control

### 4. V31 GOLD STANDARD COMPLIANCE
- All generated code meets V31 specification
- Validation before execution
- No look-ahead bias
- Realistic execution simulation

### 5. SEMI-SYSTEMATIC FLEXIBILITY
- Strategy-by-strategy automation level
- If-then trees for grey areas
- Human supervision where needed
- Full automation when possible

### 6. CONTINUOUS IMPROVEMENT
- Every operation increases system intelligence
- Closed learning loops implemented
- Patterns and templates evolve
- Metrics drive optimization

---

## 📚 KNOWLEDGE BASE REQUIREMENTS

### 1. EdgeDev V31 Gold Standard
- 3-stage grouped endpoint architecture
- Per-ticker operations
- Historical buffer handling
- Parallel processing (Stage 1 & Stage 3)
- Smart filters (preserve historical data)
- Two-pass feature computation
- Complete V31 specification (950+ lines)

### 2. Lingua Trading Framework (772 lines)
- Trend cycle stages (9 stages)
- Timeframe hierarchy (HTF/MTF/LTF)
- Market structure principles
- All 13 trading setups
- Indicator system (EMA clouds, deviation bands, trail, VWAP, PDC)
- Execution philosophy (position trading, pyramiding, recycling)
- Daily context categories (Frontside/Backside/IPO)
- All daily molds (Daily Para, Para MDR, FBO, D2, MDR, etc.)

### 3. Quant & Backtesting Best Practices
- No look-ahead bias prevention
- Realistic execution simulation
- In-sample / Out-of-sample testing
- Monte Carlo simulation
- Regime analysis (bull/bear/ranging)
- Statistical significance testing
- Risk metrics (Sharpe, Sortino, max drawdown, win rate, etc.)

### 4. Python & Technical Analysis
- Pandas, NumPy for data manipulation
- Technical indicators (EMA, ATR, RSI, MACD, etc.)
- Polygon.io API integration
- Data quality validation
- Error handling and logging

### 5. System Architecture
- FastAPI backend endpoints
- Next.js frontend integration
- WebSocket real-time updates
- Archon MCP protocol
- CopilotKit AG-UI protocol
- Multi-agent coordination

---

## ✅ VALIDATION GATES

Each sprint MUST pass validation gate before proceeding:

### Sprint 1 Gate
- [ ] Upload → Execute flow works end-to-end
- [ ] Archon starts and responds on port 8051
- [ ] Dynamic date selection functional
- [ ] Results display correctly

### Sprint 2 Gate
- [ ] Archon RAG search returns relevant results
- [ ] V31 Gold Standard ingested
- [ ] Lingua framework ingested
- [ ] Existing strategies ingested

### Sprint 3 Gate
- [ ] CopilotKit integrated
- [ ] Chat interface functional
- [ ] Agent actions registered
- [ ] Message history tracked

### Sprint 4 Gate
- [ ] Can create plan from A+ example
- [ ] Parameter extraction working
- [ ] Workflow steps generated
- [ ] User approval checkpoint functional

### Sprint 5 Gate
- [ ] RAG search finds similar strategies
- [ ] Pattern matching works
- [ ] Market regime analysis functional
- [ ] Parameter suggestions based on history

### Sprint 6 Gate
- [ ] Generates working V31 code from ideas
- [ ] Transforms existing code to V31
- [ ] Creates molds from A+ examples
- [ ] All code passes V31 validation

### Sprint 7 Gate
- [ ] Runs scanners on backend
- [ ] Real-time progress updates
- [ ] Results collected and displayed
- [ ] Error recovery functional

### Sprint 8 Gate
- [ ] Analyzes backtest results
- [ ] Parameter suggestions improve performance
- [ ] IS/OOS validation confirms edge
- [ ] Monte Carlo shows consistency

### Sprint 9 Gate
- [ ] A+ Example → Launch workflow complete
- [ ] Code Transform → Launch workflow complete
- [ ] Idea → Launch workflow complete
- [ ] All workflows validated

### Sprint 10 Gate
- [ ] Performance optimized (<2s response)
- [ ] Documentation complete
- [ ] User testing successful
- [ ] Platform production-ready

---

## 🎯 IMMEDIATE NEXT STEPS

### Sprint 0: Pre-Flight (IMMEDIATE)
1. Create detailed task list for all 10 sprints
2. Setup project tracking system
3. Define acceptance criteria for each task
4. Identify dependencies between sprints
5. Create risk mitigation strategies

### Sprint 1: Foundation Repair (START AFTER APPROVAL)
1. Fix hardcoded date bug
2. Fix execution flow
3. Start Archon MCP
4. Validate basic workflow

---

## 📋 DOCUMENT STRUCTURE

This master plan is supported by detailed sprint documents:
- `SPRINT_00_PRE-FLIGHT.md` - Setup and tasks definition
- `SPRINT_01_FOUNDATION.md` - Critical bug fixes
- `SPRINT_02_ARCHON.md` - Knowledge base setup
- `SPRINT_03_COPILOTKIT.md` - Rebuild Renata interface
- `SPRINT_04_PLANNER.md` - A+ analysis workflow
- `SPRINT_05_RESEARCHER.md` - Archon RAG integration
- `SPRINT_06_BUILDER.md` - Code generation
- `SPRINT_07_EXECUTOR.md` - Backend integration
- `SPRINT_08_ANALYST.md` - Optimization
- `SPRINT_09_INTEGRATION.md` - End-to-end testing
- `SPRINT_10_PRODUCTION.md` - Final polish

Each sprint document contains:
- Objective and scope
- Detailed task breakdown
- Deliverables
- Validation criteria
- Dependencies
- Risks and mitigations
- Time estimates

---

## 🚀 THIS IS THE DEFINITIVE MASTER PLAN

**We will not deviate from this plan without explicit approval.**

**We will not skip sprints or cut corners.**

**We will validate each sprint before proceeding.**

**We will maintain focus on Michael's vision while building production-grade infrastructure.**

**The goal: Build a systematic, scalable AI agent platform that compounds intelligence through every interaction.**

**Every operation contributes to system intelligence.**

**Every artifact is designed for reuse.**

**Every workflow enhances collective capability.**

---

**Ready to proceed with Sprint 0: Pre-Flight and detailed sprint planning.**

**This plan is locked in. Let's build this right.**
