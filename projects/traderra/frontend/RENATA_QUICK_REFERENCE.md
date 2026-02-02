# Renata AI - Quick Reference Guide

## Core Components at a Glance

### Chat Interfaces
| Component | File | Purpose | Status |
|-----------|------|---------|--------|
| **StandaloneRenataChat** | `chat/standalone-renata-chat.tsx` | Primary chat interface | Primary |
| **RenataChat** | `dashboard/renata-chat.tsx` | Dashboard widget wrapper | Uses Standalone |
| **EnhancedRenataChat** | `chat/enhanced-renata-chat.tsx` | Learning-enabled version | Available |

### Key APIs & Methods

```typescript
// Main chat endpoint (intelligentChat)
await api.renata.intelligentChat(userInput, uiContext, conversationHistory)
→ POST http://localhost:6500/ai/conversation

// Simple chat
await api.renata.chat(query, mode, performanceData, tradingContext)
→ POST http://localhost:6500/ai/renata/chat-simple

// Components
await api.renata.generateComponents(request)
→ POST http://localhost:6500/api/ai/renata/generate-agui

// Knowledge search
await api.knowledge.search(query, sourceId, matchCount)
→ POST http://localhost:6500/api/archon/search
```

### State Context

```typescript
// Date Range Management
const { dateRange, setDateRange } = useDateRange()
// Options: 'today' | 'week' | 'month' | 'year' | '90day' | 'lastMonth' | 'lastYear' | 'all' | 'custom'

// Chat History
const { messages, addMessage, conversations, createNewConversation } = useChatContext()

// Display Modes
// 'dollar' | 'r_multiple' | 'percentage'
```

### Supported Commands

```
Navigation Commands:
├── navigate_to_statistics
├── navigate_to_dashboard
├── navigate_to_trades
├── navigate_to_journal
├── navigate_to_analytics
├── navigate_to_calendar
└── set_date_range

Parameters:
├── dateRange: last_90_days | last_month | this_month | last_week | today | etc.
├── symbols: ['AAPL', 'MSFT', ...]
├── profitLossFilter: profitable_only | losing_only | breakeven_only
├── timeFilter: morning | afternoon | evening | premarket | afterhours
├── strategy: scalping | swing | daytrading | momentum | reversal
└── minVolume: number
```

### AI Modes

```
1. RENATA (Default)    → Orchestrator, general assistant
2. ANALYST             → Data-focused, quantitative insights
3. COACH               → Constructive guidance, improvement
4. MENTOR              → Philosophical, wisdom-based
```

### Natural Language Recognition Patterns

**Recognized Date Ranges**:
- "last 90 days", "this month", "last week", "today", "yesterday"
- "this year", "last year", "all time"
- Specific years: "2024", "2025"
- Quarters: "this quarter", "last quarter"

**Page Navigation Triggers**:
- "stats", "statistics" → Statistics page
- "dashboard", "main page" → Dashboard
- "trades", "trade list" → Trades page
- "journal" → Journal page
- "analytics", "analysis" → Analytics page
- "calendar" → Calendar page

**Filter Recognition**:
- Stocks: "AAPL", "MSFT", "GOOGL" (case-insensitive)
- Profit: "profitable", "profitable_only", "above $50"
- Loss: "losing", "losing_only", "below $100"
- Time: "morning", "afternoon", "evening", "premarket", "afterhours"
- Strategy: "scalping", "swing", "day trading", "momentum", "reversal"
- Volume: "volume over 1000000"

## Data Flow

### Message Sending Flow
```
User Input
  ↓
StandaloneRenataChat.sendMessage()
  ↓
calculateTradingMetrics() [if needed]
  ↓
api.renata.intelligentChat(message, uiContext, history)
  ↓
HTTP POST to backend
  ↓
Response parsing:
  - response (text)
  - navigationCommands (array)
  - smartSuggestions (array)
  - nlpAnalysis (parsed data)
  ↓
executeNavigation() for each command
  ↓
setDateRange() + router.push() + state updates
  ↓
addMessage() to conversation history
```

### Navigation Execution
```
executeNavigation(command, params)
  ├── For navigate_to_*:
  │   ├── router.push('/path')
  │   ├── if params.dateRange: setDateRange(mapped_value)
  │   └── Apply advanced filters
  └── For set_date_range:
      └── setDateRange(mapped_value)
```

## Common Queries & Execution

### Query: "Show me stats for last 90 days"
```
1. NLP detects: page=statistics, dateRange=last_90_days
2. Generates command: navigate_to_statistics with {dateRange: 'last_90_days'}
3. Executes: router.push('/statistics') + setDateRange('90day')
```

### Query: "Analyze my profitable trades this week"
```
1. NLP detects:
   - intent: analyze
   - dateRange: this_week
   - profitLossFilter: profitable_only
2. Sends parameters in context
3. Generates analysis in Analyst mode
```

### Query: "Switch to mentor mode"
```
1. Detects: command_type = 'ai_mode'
2. Extracts: new_mode = 'mentor'
3. Calls: setCurrentMode('mentor')
4. Response regenerated with mentor perspective
```

## Configuration

**Environment Variables**:
```
OPENROUTER_API_KEY=<your-key>
NEXT_PUBLIC_API_URL=http://localhost:6500
NEXT_PUBLIC_FASTAPI_WS_URL=ws://localhost:8000
NEXT_PUBLIC_APP_URL=http://localhost:6565
```

**Default Ports**:
- Frontend: 3000 (Next.js)
- Backend: 6500 (FastAPI)
- WebSocket: 8000 (FastAPI)
- Traderra: 6565

**Default Model**:
- `anthropic/claude-3.5-sonnet` (OpenRouter)

## Response Structure

```typescript
interface AIResponse {
  response: string                    // AI generated text
  command_type: string               // 'ui_action' | 'ai_mode' | 'question' | ...
  intent: string                     // Parsed user intent
  confidence: number                 // 0-1 confidence score
  navigationCommands?: Array<{       // Commands to execute
    command: string
    params: Record<string, any>
  }>
  smartSuggestions?: Array<{        // Contextual help
    type: string
    text: string
  }>
  nlpAnalysis?: {                    // Parsed analysis
    dateRange: string | null
    intents: Array
    advancedParams: Record<string, any>
  }
}
```

## Debugging Tips

### Check Connection
```typescript
await api.ping()  // Frontend health check
```

### View Conversation History
```typescript
const { messages } = useChatContext()
console.log(messages)
```

### Trace Navigation
```
// Add console.log in executeNavigation()
console.log('Command:', command, 'Params:', params)
```

### Monitor API Calls
```
Browser DevTools → Network → Filter 'ai/conversation'
or 'localhost:6500'
```

### Test Fallback Responses
- Disconnect backend on port 6500
- System should trigger fallback mock responses
- Check console for "Using fallback mock response"

## Known Limitations

1. ❌ Cannot modify chart parameters directly
2. ❌ Cannot create/edit journal entries
3. ❌ Cannot apply filters beyond date ranges
4. ❌ No real-time chart synchronization
5. ❌ Learning system incomplete (backend unclear)
6. ❌ WebSocket only for scan commentary
7. ❌ No command acknowledgment system
8. ❌ No rollback on failed state updates

## Enhancement Roadmap

### Priority 1 (High Impact)
- [ ] Bidirectional state sync (EventEmitter)
- [ ] Expand read-only data access to charts
- [ ] Implement persistent learning storage

### Priority 2 (Medium)
- [ ] WebSocket integration for live updates
- [ ] Command queue & execution tracking
- [ ] Journal entry CRUD operations

### Priority 3 (Nice to Have)
- [ ] Voice input/output
- [ ] Custom knowledge graph
- [ ] Autonomous trade analysis

## File Locations Summary

```
Frontend Structure:
/src
├── components
│   ├── chat/
│   │   ├── standalone-renata-chat.tsx        ← Primary
│   │   ├── enhanced-renata-chat.tsx          ← Learning enabled
│   │   └── simple-model-selector.tsx
│   └── dashboard/
│       ├── renata-chat.tsx                   ← Widget wrapper
│       └── main-dashboard.tsx                ← Integration point
├── lib/
│   └── api.ts                                ← API client
├── contexts/
│   ├── DateRangeContext.tsx                  ← Date filtering
│   ├── ChatContext.tsx                       ← History management
│   └── DisplayModeContext.tsx                ← Display mode
├── services/
│   └── aiWebSocketService.ts                 ← Scan commentary
└── app/api/
    └── renata/chat/
        └── route.ts                          ← API endpoint

Backend Assumed Endpoints:
POST /ai/conversation                         ← Main chat
POST /ai/renata/chat-simple                   ← Simple chat
POST /api/archon/search                       ← Knowledge
POST /api/ai/learning/feedback                ← Learning
POST /api/ai/learning/correction              ← Corrections
```

---

## Quick Checklist for New Developers

- [ ] Read RENATA_AI_TECHNICAL_ANALYSIS.md for full context
- [ ] Understand State: DateRangeContext, ChatContext, DisplayModeContext
- [ ] Trace: StandaloneRenataChat.sendMessage() → api.renata.intelligentChat()
- [ ] Know the four modes: Renata, Analyst, Coach, Mentor
- [ ] Understand NLP pipeline: message → parsing → commands → execution
- [ ] Test with: "Show me stats for last 90 days"
- [ ] Check /tmp/api-test.sh for backend testing
- [ ] Monitor: Browser DevTools Network tab for /ai/conversation calls

