# Traderra Navigation - Implementation Details

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                   TRADERRA NAVIGATION SYSTEM                │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  User Input (Chat Message)                                   │
│         ↓                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  StandaloneRenataChat (Frontend)                    │   │
│  │  - sendMessage() - Keyword detection (immediate)     │   │
│  │  - router.push() - Direct navigation               │   │
│  └──────────────────────────────────────────────────────┘   │
│         ↓                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  /api/renata/chat (Backend)                         │   │
│  │  - Keyword detection (second pass)                   │   │
│  │  - Returns navigationCommands array                  │   │
│  └──────────────────────────────────────────────────────┘   │
│         ↓                                                     │
│  ┌──────────────────────────────────────────────────────┐   │
│  │  Frontend (Second Execution)                        │   │
│  │  - Processes navigationCommands                      │   │
│  │  - Calls router.push() again                        │   │
│  └──────────────────────────────────────────────────────┘   │
│         ↓                                                     │
│  Page Navigation Complete                                    │
│                                                               │
└─────────────────────────────────────────────────────────────┘
```

---

## Frontend Implementation

### File: `src/components/chat/standalone-renata-chat.tsx`

#### State Variables
```typescript
const [currentMode, setCurrentMode] = useState<RenataMode>('renata')
const [inputMessage, setInputMessage] = useState('')
const [isLoading, setIsLoading] = useState(false)
const [messages, addMessage] = useChatContext()
```

#### Navigation Execution Function (Lines 142-207)

```typescript
const executeNavigation = (command: string, params?: any) => {
  // Handle date range setting if specified
  if (params?.dateRange) {
    switch (params.dateRange) {
      case 'last_90_days':
        setDateRange('90day')
        break
      case 'last_month':
        setDateRange('lastMonth')
        break
      // ... more date range cases
    }
  }

  // Execute navigation based on command
  switch (command) {
    case 'navigate_to_statistics':
      router.push('/statistics')
      return "✅ Navigated to Statistics page"
    case 'navigate_to_dashboard':
      router.push('/dashboard')
      return "✅ Navigated to Dashboard"
    case 'navigate_to_journal':
      router.push('/journal')
      return "✅ Navigated to Trading Journal"
    case 'navigate_to_analytics':
      router.push('/analytics')
      return "✅ Navigated to Analytics page"
    default:
      return "❌ Unknown navigation command"
  }
}
```

#### Message Sending (Lines 209-336)

```typescript
const sendMessage = async () => {
  if (!inputMessage.trim() || isLoading) return

  // 1. Add user message to context
  const userMessage = {
    type: 'user' as const,
    content: inputMessage,
    mode: currentMode
  }
  addMessage(userMessage)

  const messageToSend = inputMessage
  setInputMessage('')
  setIsLoading(true)

  // 2. FRONTEND KEYWORD DETECTION (before API call)
  const lowerMessage = messageToSend.toLowerCase()
  let shouldNavigate = false

  if (lowerMessage.includes('stats') || lowerMessage.includes('statistics')) {
    parseDateRange(lowerMessage)
    router.push('/statistics')
    shouldNavigate = true
  } else if (lowerMessage.includes('dashboard') || lowerMessage.includes('main page')) {
    parseDateRange(lowerMessage)
    router.push('/dashboard')
    shouldNavigate = true
  } else if (lowerMessage.includes('journal') || lowerMessage.includes('trades')) {
    parseDateRange(lowerMessage)
    router.push('/journal')
    shouldNavigate = true
  } else if (lowerMessage.includes('analytics') || lowerMessage.includes('analysis')) {
    parseDateRange(lowerMessage)
    router.push('/analytics')
    shouldNavigate = true
  }

  // 3. Send to API for AI response
  try {
    const response = await fetch('/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: messageToSend,
        mode: currentMode,
        model: modelToUse,
        context: { /* trading context */ }
      })
    })

    const data = await response.json()

    if (response.ok) {
      let responseContent = data.response

      // 4. BACKEND NAVIGATION COMMANDS (second pass)
      if (data.navigationCommands && data.navigationCommands.length > 0) {
        const navigationResults = data.navigationCommands.map((cmd: any) =>
          executeNavigation(cmd.command, cmd.params)
        )
        responseContent += '\n\n' + navigationResults.join('\n')
      }

      addMessage({
        type: 'assistant',
        content: responseContent,
        mode: currentMode
      })
    }
  } catch (error) {
    addMessage({
      type: 'error',
      content: 'Network error. Please try again.'
    })
  } finally {
    setIsLoading(false)
  }
}
```

#### Date Range Parsing (Lines 230-251)

```typescript
const parseDateRange = (message: string) => {
  if (message.includes('last 90 days') || message.includes('90 days')) {
    console.log('🔧 Chat: Setting date range to 90day')
    setDateRange('90day')
  } else if (message.includes('last month') || message.includes('previous month')) {
    setDateRange('lastMonth')
  } else if (message.includes('this month')) {
    setDateRange('month')
  } else if (message.includes('last week') || message.includes('previous week')) {
    setDateRange('week')
  } else if (message.includes('this week')) {
    setDateRange('week')
  } else if (message.includes('today')) {
    setDateRange('today')
  } else if (message.includes('yesterday')) {
    setDateRange('today')
  } else if (message.includes('last year') || message.includes('previous year')) {
    setDateRange('lastYear')
  } else if (message.includes('this year')) {
    setDateRange('year')
  }
}
```

---

## Backend Implementation

### File: `src/app/api/renata/chat/route.ts`

#### Request Handler (Lines 1-173)

```typescript
export async function POST(req: NextRequest) {
  try {
    const { message, mode = 'renata', model, context, smartAnalysis } = await req.json()

    // 1. Generate system prompt based on mode
    const renataSystemPrompt = `You are Renata, a sophisticated AI trading assistant...
    
NAVIGATION CAPABILITIES:
When users ask to view specific data or pages, I can automatically navigate them:
- "stats" or "statistics" → Navigate to Statistics page
- "dashboard" or "main page" → Navigate to Dashboard
- "journal" or "trades" → Navigate to Trading Journal
- "analytics" or "analysis" → Navigate to Analytics page
    `

    // 2. Call OpenRouter API
    const openRouterResponse = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:6565',
        'X-Title': 'Traderra AI Assistant',
      },
      body: JSON.stringify({
        model: model,
        messages: messages,
        max_tokens: 1500,
        temperature: 0.7,
        stream: false,
      }),
    })

    const data = await openRouterResponse.json()
    const response = data.choices?.[0]?.message?.content

    // 3. BACKEND KEYWORD DETECTION (Lines 108-154)
    const navigationCommands = []
    const lowerMessage = message.toLowerCase()

    // Detect date range
    let dateRangeDetected = null
    if (lowerMessage.includes('last 90 days') || lowerMessage.includes('90 days')) {
      dateRangeDetected = 'last_90_days'
    } else if (lowerMessage.includes('last month')) {
      dateRangeDetected = 'last_month'
    } else if (lowerMessage.includes('this month')) {
      dateRangeDetected = 'this_month'
    } else if (lowerMessage.includes('last week')) {
      dateRangeDetected = 'last_week'
    } else if (lowerMessage.includes('this week')) {
      dateRangeDetected = 'this_week'
    } else if (lowerMessage.includes('today')) {
      dateRangeDetected = 'today'
    } else if (lowerMessage.includes('yesterday')) {
      dateRangeDetected = 'yesterday'
    } else if (lowerMessage.includes('last year')) {
      dateRangeDetected = 'last_year'
    } else if (lowerMessage.includes('this year')) {
      dateRangeDetected = 'this_year'
    }

    // Detect navigation commands
    if (lowerMessage.includes('stats') || lowerMessage.includes('statistics')) {
      navigationCommands.push({
        command: 'navigate_to_statistics',
        params: { dateRange: dateRangeDetected }
      })
    } else if (lowerMessage.includes('dashboard') || lowerMessage.includes('main page')) {
      navigationCommands.push({
        command: 'navigate_to_dashboard',
        params: { dateRange: dateRangeDetected }
      })
    } else if (lowerMessage.includes('journal') || lowerMessage.includes('trades')) {
      navigationCommands.push({
        command: 'navigate_to_journal',
        params: { dateRange: dateRangeDetected }
      })
    } else if (lowerMessage.includes('analytics') || lowerMessage.includes('analysis')) {
      navigationCommands.push({
        command: 'navigate_to_analytics',
        params: { dateRange: dateRangeDetected }
      })
    }

    // 4. Return response with navigation commands
    return NextResponse.json({
      response,
      mode,
      model,
      navigationCommands,
      timestamp: new Date().toISOString()
    })

  } catch (error) {
    console.error('Renata API error:', error)
    return NextResponse.json({
      error: 'Internal server error',
      message: 'I apologize, but I encountered an internal error.'
    }, { status: 500 })
  }
}
```

---

## CopilotKit Integration

### File: `src/components/chat/standalone-renata-chat.tsx` (Lines 90-139)

```typescript
// CopilotKit action: Navigate to pages
useCopilotAction({
  name: "navigateToPage",
  description: "Navigate to different pages in the trading dashboard",
  parameters: [
    {
      name: "page",
      type: "string",
      description: "Page to navigate to: 'dashboard', 'statistics', 'journal', 'analytics'"
    }
  ],
  handler: async ({ page }) => {
    const result = executeNavigation(`navigate_to_${page}`)
    return result
  }
})

// CopilotKit action: Set date range
useCopilotAction({
  name: "setDateRange",
  description: "Set the date range for analysis and dashboard views",
  parameters: [
    {
      name: "preset",
      type: "string",
      description: "Date range preset: 'today', 'yesterday', 'this_week', 'last_week', 'this_month', 'last_month', 'this_year', 'last_year', 'all_time'"
    }
  ],
  handler: async ({ preset }) => {
    setDateRange({ preset })
    return `✅ Date range set to ${preset.replace('_', ' ')}`
  }
})

// CopilotKit action: Change Renata mode
useCopilotAction({
  name: "changeMode",
  description: "Change Renata's mode for different types of analysis and assistance",
  parameters: [
    {
      name: "mode",
      type: "string",
      description: "Mode to switch to: 'renata', 'analyst', 'coach', 'mentor'"
    }
  ],
  handler: async ({ mode }) => {
    setCurrentMode(mode as RenataMode)
    return `✅ Switched to ${mode} mode`
  }
})
```

---

## Page Components

### Dashboard (`src/app/dashboard/page.tsx`)

```typescript
import { MainDashboard } from '@/components/dashboard/main-dashboard'
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { PnLModeProvider } from '@/contexts/PnLModeContext'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'

export default function DashboardPage() {
  return (
    <DisplayModeProvider>
      <PnLModeProvider>
        <DateRangeProvider>
          <MainDashboard />
        </DateRangeProvider>
      </PnLModeProvider>
    </DisplayModeProvider>
  )
}
```

### Trades (`src/app/trades/page.tsx`)

Features:
- TradesTable component with trade list
- New trade modal
- Import CSV modal
- Display mode toggle
- Date range selector
- StandaloneRenataChat integration

### Statistics (`src/app/statistics/page.tsx`)

Features:
- Detailed trading statistics
- Charts and distributions
- Position size analysis
- Price level analysis
- Advanced metrics

### Journal (`src/app/journal/page.tsx`)

Features:
- Journal entries display
- Folder/organization system
- Entry creation/editing
- Template selection
- Rich text editing

### Analytics (`src/app/analytics/page.tsx`)

Features:
- Hourly trade distribution
- Monthly performance trends
- Cumulative PnL analysis
- Advanced charting

---

## Context Providers

### DateRangeContext

**Purpose**: Manages the selected date range across the app

**Location**: `src/contexts/DateRangeContext.tsx`

**Presets Supported**:
- `today`
- `week`
- `lastWeek`
- `month`
- `lastMonth`
- `90day`
- `year`
- `lastYear`
- `allTime`

**Usage**:
```typescript
const { dateRange, setDateRange } = useDateRange()

// Set via preset
setDateRange('month')

// Set with object
setDateRange({ preset: 'week' })

// Set custom range
setDateRange({
  startDate: new Date('2025-01-01'),
  endDate: new Date('2025-01-31'),
  preset: 'custom'
})
```

### PnLModeContext

**Purpose**: Manages Gross vs Net PnL display mode

**Values**: `'gross'` | `'net'`

### DisplayModeContext

**Purpose**: Manages different display formats/themes

---

## Navigation Flow Diagram

```
User Types Message
        ↓
[Frontend Check]
Is it a navigation keyword? (stats, dashboard, journal, analytics)
        ├─ YES → router.push('/page') → page loads
        └─ NO  ↓
Send to /api/renata/chat
        ↓
[Backend Check]
Is it a navigation keyword?
        ├─ YES → Include navigationCommands in response
        │        ↓
        │        Frontend processes response
        │        ↓
        │        router.push('/page') → page loads
        │
        └─ NO  → Just return AI response
```

---

## How to Add New Navigation

### Step 1: Add Page Component
```typescript
// src/app/new-page/page.tsx
export default function NewPage() {
  return (
    <DisplayModeProvider>
      <NewPageComponent />
    </DisplayModeProvider>
  )
}
```

### Step 2: Add Frontend Detection
```typescript
// src/components/chat/standalone-renata-chat.tsx (in sendMessage function)
} else if (lowerMessage.includes('new page') || lowerMessage.includes('my new page')) {
  parseDateRange(lowerMessage)
  router.push('/new-page')
  shouldNavigate = true
}
```

### Step 3: Add Backend Detection
```typescript
// src/app/api/renata/chat/route.ts (in navigation detection section)
} else if (lowerMessage.includes('new page') || lowerMessage.includes('my new page')) {
  navigationCommands.push({
    command: 'navigate_to_new_page',
    params: { dateRange: dateRangeDetected }
  })
}
```

### Step 4: Add to executeNavigation
```typescript
// src/components/chat/standalone-renata-chat.tsx (in executeNavigation function)
case 'navigate_to_new_page':
  router.push('/new-page')
  return "✅ Navigated to New Page"
```

### Step 5: Update CopilotKit Action
```typescript
// Update the navigateToPage action description to include new page
description: "Page to navigate to: 'dashboard', 'statistics', 'journal', 'analytics', 'new-page'"
```

---

## Debugging Navigation

### Enable Console Logs

In the frontend code, look for:
```typescript
console.log('💬 Chat: Adding user message:', userMessage)
console.log('🔧 Chat: Setting date range to', range)
console.log('🤖 Chat: Adding assistant message:', assistantMessage)
```

In the backend API, check server logs for:
```
Sending to OpenRouter (Renata):
OpenRouter response received:
```

### Test Commands

```
"Go to dashboard"
"Show me my stats"
"Show my statistics for this month"
"Take me to the journal"
"Show analytics"
"Show the calendar"        (should fail - not implemented)
"Go to settings"          (should fail - not implemented)
"Show my daily summary"   (should fail - not implemented)
```

---

## Future Improvements

1. **Consolidate Navigation Logic**
   - Move all keyword detection to backend
   - Frontend only handles immediate navigation
   - Reduce duplication

2. **Add Context Awareness**
   - Check current page before navigating
   - Don't re-navigate to same page
   - Provide feedback to user

3. **Support Complex Workflows**
   - "Show me stats then journal"
   - Multi-page navigation sequences
   - Conditional navigation based on data

4. **Semantic Understanding**
   - Move beyond keyword matching
   - Use NLP for intent detection
   - Understand user goals, not just words

5. **Add Missing Pages**
   - Calendar: `"calendar"`, `"calendar view"`
   - Daily Summary: `"daily summary"`, `"day summary"`
   - Settings: `"settings"`, `"preferences"`

