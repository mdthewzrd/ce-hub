# Renata AI Architecture - Visual Diagrams

## 1. System Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         TRADERRA FRONT-END                              │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Standalone Renata Chat Component                                 │   │
│  │ - currentMode: 'renata' | 'analyst' | 'coach' | 'mentor'         │   │
│  │ - calculateTradingMetrics()                                       │   │
│  │ - generateMockResponse()                                          │   │
│  │ - executeNavigation()                                             │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                               ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Chat Context (SessionStorage)                                    │   │
│  │ - conversations[]                                                │   │
│  │ - currentConversation                                            │   │
│  │ - messages[] (with optional mode field)                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                               ↓ HTTP POST
┌─────────────────────────────────────────────────────────────────────────┐
│                    TRADERRA BACK-END (FastAPI)                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ API Endpoints (/ai/*)                                            │   │
│  │ - POST /renata/chat-simple                                       │   │
│  │ - POST /renata/chat                                              │   │
│  │ - POST /analyze                                                  │   │
│  │ - POST /query                                                    │   │
│  │ - GET /knowledge/search                                          │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                               ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ RenataAgent (Main Orchestrator)                                  │   │
│  │ ┌────────────────────────────────────────────────────────────┐  │   │
│  │ │ 1. PLAN Phase: Select Mode                                │  │   │
│  │ │    - Determine agent (analyst/coach/mentor)               │  │   │
│  │ │    - Set preferences                                      │  │   │
│  │ └────────────────────────────────────────────────────────────┘  │   │
│  │ ┌────────────────────────────────────────────────────────────┐  │   │
│  │ │ 2. RESEARCH Phase: Query Knowledge                         │  │   │
│  │ │    - Build semantic query                                 │  │   │
│  │ │    - Search Archon RAG                                    │  │   │
│  │ │    - Get matched knowledge (top 8)                        │  │   │
│  │ └────────────────────────────────────────────────────────────┘  │   │
│  │ ┌────────────────────────────────────────────────────────────┐  │   │
│  │ │ 3. PRODUCE Phase: Generate Analysis                        │  │   │
│  │ │    - Build comprehensive prompt                           │  │   │
│  │ │    - Execute PydanticAI agent                             │  │   │
│  │ │    - Apply mode-specific system prompt                    │  │   │
│  │ │    - Use mock if OpenAI unavailable                       │  │   │
│  │ └────────────────────────────────────────────────────────────┘  │   │
│  │ ┌────────────────────────────────────────────────────────────┐  │   │
│  │ │ 4. INGEST Phase: Store Learning                           │  │   │
│  │ │    - Extract insights                                     │  │   │
│  │ │    - Ingest to Archon                                     │  │   │
│  │ │    - Update knowledge graph                               │  │   │
│  │ └────────────────────────────────────────────────────────────┘  │   │
│  │                                                                   │   │
│  │ Components:                                                       │   │
│  │ - analyst_agent (PydanticAI)                                     │   │
│  │ - coach_agent (PydanticAI)                                       │   │
│  │ - mentor_agent (PydanticAI)                                      │   │
│  │ - _analyze_performance_tool()                                    │   │
│  │ - _get_historical_context_tool()                                 │   │
│  │ - _generate_mock_response()                                      │   │
│  │ - _extract_insights()                                            │   │
│  └──────────────────────────────────────────────────────────────────┘   │
│                               ↓                                           │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │ Archon Client (Knowledge Management)                             │   │
│  │ - search_trading_knowledge(query, match_count=8)                 │   │
│  │ - ingest_trading_insight(insight)                                │   │
│  │ - health_check()                                                 │   │
│  └──────────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────────┘
                               ↓ HTTP
┌─────────────────────────────────────────────────────────────────────────┐
│                   ARCHON MCP SERVER (Knowledge Graph)                   │
│  - /rag_search_knowledge_base                                            │
│  - /rag_search_code_examples                                             │
│  - /ingest_document                                                      │
│  - /manage_task (project management)                                     │
│  - /health                                                               │
└─────────────────────────────────────────────────────────────────────────┘
```

## 2. Command Processing Flow - Current State

```
┌─────────────────────────────────────────────────────────────────────┐
│ User Input: "switch to R"                                           │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Frontend: generateMockResponse(query, mode)                         │
│                                                                     │
│ const lowerQuery = "switch to r"                                    │
│                                                                     │
│ ❌ NOT greeting (hey, hi, hello)                                    │
│ ❌ NOT thanks (thank, thanks, thx)                                  │
│ ❌ NOT help (what can you do, help me, what do you do)             │
│ ❌ NOT performance (if mode === 'analyst')                          │
│ ❌ NOT coach question (if mode === 'coach')                         │
│ ❌ NOT mentor question (if mode === 'mentor')                       │
│ ❌ NOT market related (market, stock, price, chart)                │
│ ❌ NOT trade related (buy, sell, entry, exit)                       │
│                                                                     │
│ Fall through to DEFAULT RESPONSE                                   │
└─────────────────────────────────────────────────────────────────────┘
                               ↓
┌─────────────────────────────────────────────────────────────────────┐
│ Response: "I'm currently in demo mode with limited backend         │
│            connectivity. I can still help with general trading     │
│            questions, strategy discussions, and provide guidance   │
│            based on common trading principles. What would you      │
│            like to talk about?"                                    │
│                                                                     │
│ ❌ Mode NOT changed                                                 │
│ ❌ Command NOT executed                                             │
│ ❌ User intention NOT understood                                    │
└─────────────────────────────────────────────────────────────────────┘
```

## 3. Context Flow - Current vs Proposed

### Current Flow (Fragmented)

```
Frontend UI State             Backend Context           Archon Knowledge
┌──────────────────┐         ┌──────────────────┐      ┌─────────────────┐
│ currentMode      │         │ UserPreferences  │      │ RAG Results     │
│ selectedModel    │         │ TradingContext   │      │ (top 3 items)   │
│ inputMessage ───────────→  │ PerformanceData  │────→ │ Truncated to     │
│ dateRange        │         │                  │      │ 200 chars       │
│ trades[]         │         └──────────────────┘      │ Limited context │
└──────────────────┘                                   └─────────────────┘
                                       ↓
                            Mode NOT persisted
                            No message history sent
                            Archon results not reused
                            Context losses at each step
```

### Proposed Flow (Integrated)

```
┌─────────────────────────────────────────────────────────────────────┐
│                    Persistent Conversation Context                  │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │ - conversation_id                                             │   │
│  │ - user_id, workspace_id                                       │   │
│  │ - current_mode (PERSISTED!)                                   │   │
│  │ - mode_history: [(mode, timestamp), ...]                      │   │
│  │ - messages: [ChatMessage, ...]                                │   │
│  │   └─ each message has: command_type, command_params, mode_used│   │
│  │ - date_range, symbols, strategies (FILTERS!)                  │   │
│  │ - performance_data (CACHED)                                   │   │
│  │ - last_archon_query, last_archon_results                      │   │
│  └──────────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────────┘
                    ↓ Synchronized bi-directionally
        ┌───────────┴───────────┐
        ↓                       ↓
   Frontend               Backend
   (SessionStorage)       (Database/Redis)
   
Benefits:
- Mode changes persisted
- Message history available for context
- Command intent tracked
- Performance metrics cached
- Archon results reusable across messages
```

## 4. Mode Switching Architecture - Current vs Proposed

### Current Implementation

```
┌──────────────────────────────┐
│ RENATA_MODES Definition      │
├──────────────────────────────┤
│ - renata (default)           │
│ - analyst (red, #ff0000)      │
│ - coach (blue, #0000ff)       │
│ - mentor (green, #00ff00)     │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│ setCurrentMode(mode)         │
│ (UI State only)              │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│ Next Message Send:           │
│ api.chat({                   │
│   mode: currentMode,         │  ← Sent to backend
│   ...                        │
│ })                           │
└──────────────────────────────┘

Problems:
- Mode only in UI memory
- Not persisted in conversation
- Not in message history
- Sidebar mode changes ignored
```

### Proposed Implementation

```
┌──────────────────────────────┐
│ User: "switch to analyst"    │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│ CommandParser.parse()        │
├──────────────────────────────┤
│ Detects: MODE_SWITCH         │
│ Extracts: mode="analyst"     │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│ CommandExecutor.execute()    │
├──────────────────────────────┤
│ Updates:                     │
│ - currentMode → "analyst"    │
│ - conversation context       │
│ - message history            │
│ - backend state              │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│ CommandResponse:             │
│ ✓ success: true              │
│ ✓ message: "Switched to      │
│   Analyst mode"              │
│ ✓ mode_changed: "analyst"    │
│ ✓ context_updated: {...}     │
└──────────────────────────────┘
           ↓
┌──────────────────────────────┐
│ ChatContext Updated:         │
│ - mode persisted             │
│ - history recorded           │
│ - state synchronized         │
└──────────────────────────────┘
```

## 5. Command Parsing Taxonomy

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         USER INPUT                                       │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                           │
│  ┌─────────────────────────┐  ┌──────────────────────┐                 │
│  │ MODE SWITCH COMMANDS    │  │ CONTEXT SET COMMANDS │                 │
│  ├─────────────────────────┤  ├──────────────────────┤                 │
│  │ - switch to analyst     │  │ - show me this week  │                 │
│  │ - use coach mode        │  │ - analyze last month │                 │
│  │ - try mentor            │  │ - filter by AAPL     │                 │
│  │ - give me analyst       │  │ - focus on winners   │                 │
│  │ - analyst please        │  │ - all-time view      │                 │
│  │ - switch to r           │  │                      │                 │
│  └─────────────────────────┘  └──────────────────────┘                 │
│                                                                           │
│  ┌──────────────────────────┐  ┌─────────────────────┐                 │
│  │ NAVIGATION COMMANDS      │  │ META COMMANDS       │                 │
│  ├──────────────────────────┤  ├─────────────────────┤                 │
│  │ - go to journal          │  │ - help              │                 │
│  │ - show dashboard         │  │ - what can you do   │                 │
│  │ - back to trades         │  │ - what modes exist  │                 │
│  │ - open scanner           │  │ - show capabilities │                 │
│  │ - view charts            │  │ - how does this work│                 │
│  └──────────────────────────┘  └─────────────────────┘                 │
│                                                                           │
│  ┌──────────────────────────┐  ┌─────────────────────┐                 │
│  │ CLARIFICATION COMMANDS   │  │ QUESTION (Analysis) │                 │
│  ├──────────────────────────┤  ├─────────────────────┤                 │
│  │ - explain that           │  │ - how am I doing?   │                 │
│  │ - more detail            │  │ - what's my win %?  │                 │
│  │ - summarize              │  │ - analyze my risk   │                 │
│  │ - can you elaborate?     │  │ - show expectancy   │                 │
│  │ - tell me more           │  │ - performance?      │                 │
│  └──────────────────────────┘  └─────────────────────┘                 │
└─────────────────────────────────────────────────────────────────────────┘
```

## 6. Archon Integration Points

```
RenataAgent Analysis Workflow with Archon
─────────────────────────────────────────

┌──────────────────────────────────────────────────────────┐
│ Input: Performance Data + User Prompt                    │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ RESEARCH Phase                                            │
│ _build_research_query()                                  │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Input: win_rate=0.45, expectancy=0.1R             │   │
│ │ Output: "trading performance low win rate"        │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ Archon RAG Search                                         │
│ archon.search_trading_knowledge(                          │
│   query="trading performance low win rate",              │
│   match_count=8                                          │
│ )                                                         │
│ Returns: [                                               │
│   {id: "insight_001", content: "Win rate below..."},     │
│   {id: "insight_042", content: "Entry timing..."},       │
│   ...up to 8 results                                     │
│ ]                                                         │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ PRODUCE Phase                                             │
│ _build_analysis_prompt()                                 │
│ ┌────────────────────────────────────────────────────┐   │
│ │ PERFORMANCE METRICS:                               │   │
│ │ - Trades: 42                                       │   │
│ │ - Win Rate: 45%                                    │   │
│ │ - Expectancy: 0.1R                                 │   │
│ │                                                    │   │
│ │ CONTEXT FROM KNOWLEDGE BASE:                       │   │
│ │ 1. Win rate below 45% suggests entry timing...     │   │
│ │ 2. Position sizing risk adjustment methods...      │   │
│ │ 3. Psychological patterns in losing trades...      │   │
│ │                                                    │   │
│ │ USER QUESTION: (from user_prompt)                  │   │
│ │                                                    │   │
│ │ [System Prompt for Mode]                          │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ PydanticAI Agent Generation                              │
│ agent.run(prompt, deps=trading_context)                  │
│ Returns: analysis text                                   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ INGEST Phase                                              │
│ _extract_insights()                                       │
│ ┌────────────────────────────────────────────────────┐   │
│ │ Patterns found:                                    │   │
│ │ - low_win_rate_pattern                             │   │
│ │ - entry_timing_issue                               │   │
│ │ - psychology_factor                                │   │
│ └────────────────────────────────────────────────────┘   │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ _ingest_insights()                                        │
│ archon.ingest_trading_insight(                            │
│   content={insights, mode_used, user_context, timestamp}, │
│   tags=["ai_analysis", "mode_coach", "perf_insights"]    │
│ )                                                         │
│ Stored to Archon Knowledge Graph                         │
└──────────────────────────────────────────────────────────┘
                          ↓
┌──────────────────────────────────────────────────────────┐
│ Response Returned to Frontend + Chat Context Updated     │
└──────────────────────────────────────────────────────────┘
```

## 7. Mode-Specific Response Differentiation

```
Same Performance Data → Different Analysis
─────────────────────────────────────────

Input: win_rate=52%, expectancy=0.82R, max_drawdown=15%

┌─────────────────────────────────────────────────────────────┐
│ ANALYST MODE - Clinical, Data-Driven                        │
├─────────────────────────────────────────────────────────────┤
│ "Win rate 52%, expectancy 0.82R. Drawdown 15% acceptable.  │
│  Profit factor 1.47. Risk management within parameters."    │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ COACH MODE - Constructive, Action-Oriented                  │
├─────────────────────────────────────────────────────────────┤
│ "Your performance shows solid fundamentals! You're above    │
│  50% win rate which is great. Focus on reducing that 15%    │
│  drawdown through better position sizing."                  │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ MENTOR MODE - Reflective, Pattern-Focused                   │
├─────────────────────────────────────────────────────────────┤
│ "You're demonstrating consistent profitability. The 0.82R   │
│  expectancy shows your strategy has an edge. That 15%       │
│  drawdown reflects moments of doubt—where conviction        │
│  wavered. What patterns do you notice there?"               │
└─────────────────────────────────────────────────────────────┘

        ↓ All modes use same Archon knowledge
        ↓ Different system prompts shape interpretation
        ↓ Mode affects tone, focus, and recommendations
```

## 8. Mock Response Fallback System

```
When OpenAI/Archon unavailable:

┌────────────────────────────────┐
│ User Input                     │
│ + CurrentMode                  │
│ + PerformanceData              │
└────────────────────────────────┘
          ↓
┌────────────────────────────────┐
│ generateMockResponse()          │
│ (Frontend)                     │
├────────────────────────────────┤
│ Check Keyword Patterns:        │
│ 1. Greeting keywords           │
│ 2. Thanks keywords             │
│ 3. Help request keywords       │
│ 4. Performance keywords        │
│ 5. Risk keywords               │
│ 6. Improve keywords            │
│ 7. Market keywords             │
│ 8. Trade keywords              │
│ 9. Default response            │
└────────────────────────────────┘
          ↓
┌────────────────────────────────┐
│ Mode-Specific Response Template│
│ [Analyst | Coach | Mentor]     │
├────────────────────────────────┤
│ + Performance metrics           │
│ + Contextual enhancements      │
│ + "Demo mode" disclaimer       │
└────────────────────────────────┘
          ↓
┌────────────────────────────────┐
│ Formatted Response             │
└────────────────────────────────┘

Issue: No command parsing in this system
→ "switch to r" falls through to default response
```

## 9. Data Type Mapping: Frontend ↔ Backend

```
Frontend (TypeScript)          Backend (Python)
─────────────────────────────────────────────────

ChatMessage                    RenataResponse
├─ id: string                  ├─ text: str
├─ type: enum                  ├─ data: Dict
├─ content: string             ├─ actions: List
├─ timestamp: Date             ├─ mode_used: RenataMode
└─ mode?: enum                 └─ archon_sources: List

Conversation                   TradingContext
├─ id: string                  ├─ user_id: str
├─ title: string               ├─ workspace_id: str
├─ messages: Message[]         ├─ time_range: Dict
├─ createdAt: Date             ├─ symbols: List
└─ updatedAt: Date             ├─ strategies: List
                               └─ current_filters: Dict

                               PerformanceData
                               ├─ trades_count: int
                               ├─ win_rate: float
                               ├─ profit_factor: float
                               ├─ expectancy: float
                               ├─ total_pnl: float
                               ├─ avg_winner: float
                               ├─ avg_loser: float
                               ├─ max_drawdown: float
                               └─ sharpe_ratio: float

Loss Points During Mapping:
- Message history not sent (only current query)
- Mode state not included in request payload
- Performance data hardcoded to mock values
- Context filters lost in conversion
- Archon results not cached/reused
```

## 10. Context Loss Journey

```
User: "switch to analyst"

            Browser Memory
            ┌───────────────────┐
            │ currentMode =     │
            │   'renata'        │ ← Mode is UI state only
            └───────────────────┘
                    ↓
            Message added to chat:
            {
              type: 'user',
              content: 'switch to analyst',
              mode: 'renata'  ← Stale mode!
            }
                    ↓
            API Call ────────────────────────────────→ Backend
            {
              query: "switch to analyst",
              mode: "renata",  ← Backend gets WRONG mode
              performance_data: {...}
            }
                    ↓
            Backend processes with WRONG context:
            ┌──────────────────────────────────────┐
            │ RenataMode.COACH (default mapping)   │
            │ not RenataMode.ANALYST               │
            └──────────────────────────────────────┘
                    ↓
            Backend response treats as regular question:
            {
              text: "I'm in coach mode, here's feedback...",
              mode_used: "coach"  ← Wrong response type!
            }
                    ↓
            Frontend adds to chat:
            {
              type: 'assistant',
              content: '...',
              mode: 'coach'  ← Overwrites with BACKEND mode
            }

Result: User thinks they switched modes, but backend
        never knew about the switch intent!

Key Problems:
1. Mode change not treated as command (treated as question)
2. No explicit mode switch execution
3. No feedback that command was understood
4. Mode state fragmented across frontend/backend
5. No context synchronization
```

---

This visual representation shows the complete data flow, architectural organization, and the critical points where context is lost or misinterpreted in the current system.

