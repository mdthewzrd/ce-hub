# Traderra Navigation Structure & AI Command Guide

**Document Purpose**: Complete reference for understanding Traderra's navigation structure and how Renata AI should handle navigation commands.

**Last Updated**: 2025-10-30

---

## Table of Contents

1. [Available Pages/Routes](#available-pagesroutes)
2. [Route Structure & URL Paths](#route-structure--url-paths)
3. [Page Purposes & Content](#page-purposes--content)
4. [Current Navigation Logic (Renata AI)](#current-navigation-logic-renata-ai)
5. [Navigation Command Keywords](#navigation-command-keywords)
6. [Implementation Details](#implementation-details)
7. [Known Issues & Edge Cases](#known-issues--edge-cases)

---

## Available Pages/Routes

The Traderra application has **7 primary navigation routes** plus several test/demo pages:

### Core Pages (User-Facing)
1. **Dashboard** (`/dashboard`)
2. **Trades** (`/trades`)
3. **Statistics** (`/statistics`)
4. **Journal** (`/journal`)
5. **Analytics** (`/analytics`)
6. **Calendar** (`/calendar`)
7. **Daily Summary** (`/daily-summary`)
8. **Settings** (`/settings`)

### Test/Demo Pages (Development Only)
- `/debug-dashboard` - Dashboard debugging page
- `/editor-demo` - Editor component testing
- `/button-test` - Button component testing
- `/dashboard-test` - Alternative dashboard test
- `/journal-enhanced` - Enhanced journal variant
- `/journal-enhanced-v2` - Journal v2 variant

### Auth Pages
- `/sign-in` - User authentication
- `/sign-up` - User registration

### Home Page
- `/` (root) - Displays landing page (LandingPage component)

---

## Route Structure & URL Paths

### Next.js App Router Structure

```
traderra/frontend/src/app/
├── page.tsx                           → / (root - landing page)
├── layout.tsx                         → Root layout with providers
│
├── dashboard/
│   └── page.tsx                       → /dashboard
├── trades/
│   └── page.tsx                       → /trades
├── statistics/
│   └── page.tsx                       → /statistics
├── journal/
│   └── page.tsx                       → /journal
├── analytics/
│   └── page.tsx                       → /analytics
├── calendar/
│   └── page.tsx                       → /calendar
├── daily-summary/
│   └── page.tsx                       → /daily-summary
├── settings/
│   └── page.tsx                       → /settings
│
├── sign-in/
│   └── [[...sign-in]]/page.tsx        → /sign-in
├── sign-up/
│   └── [[...sign-up]]/page.tsx        → /sign-up
│
├── api/
│   ├── copilotkit/route.ts            → CopilotKit integration
│   ├── renata/chat/route.ts           → Renata AI chat endpoint
│   ├── trades/route.ts                → Trades API endpoint
│   ├── trades-debug/route.ts          → Trades debug endpoint
│   ├── debug-user/route.ts            → User debug endpoint
│   └── fix-user-id/route.ts           → User ID fix endpoint
│
└── [test pages...]
```

---

## Page Purposes & Content

### 1. **Dashboard** (`/dashboard`)

**Purpose**: Primary overview and main trading performance hub

**Key Features**:
- Real-time trading performance metrics
- Win rate, profit factor, expectancy visualization
- PnL breakdown and trend analysis
- Quick access to trading data
- Integrated Renata AI sidebar for analysis
- Displays using MainDashboard component

**Navigation Trigger Keywords**: 
- "dashboard", "main page", "main dashboard", "home dashboard"

**URL**: `/dashboard`

---

### 2. **Trades** (`/trades`)

**Purpose**: Detailed trade list, management, and import functionality

**Key Features**:
- Complete trades table with filtering and sorting
- Individual trade details and inspection
- New trade entry creation modal
- CSV import functionality (TraderVue format)
- Display mode toggle (different viewing formats)
- Date range selection and filtering

**Navigation Trigger Keywords**:
- "trades", "trade list", "trade table", "my trades", "view trades"

**URL**: `/trades`

**Note**: When user says "journal" or "trades", navigation defaults to `/journal`, NOT `/trades`. The Trades page is more for data management.

---

### 3. **Statistics** (`/statistics`)

**Purpose**: Detailed performance statistics and metrics dashboard

**Key Features**:
- Comprehensive trading statistics (win rate, profit factor, etc.)
- Breakdown by position size, price levels, time periods
- Advanced charts and distributions
- Per-hour, per-day, per-month analysis
- Performance metrics and comparative analysis
- Display mode toggle for different formats

**Navigation Trigger Keywords**:
- "stats", "statistics", "metrics", "performance stats", "analytics stats"

**URL**: `/statistics`

---

### 4. **Journal** (`/journal`)

**Purpose**: Trading journal entries and reflective documentation

**Key Features**:
- Trading journal entries (text-based reflections, setup notes, etc.)
- Folder/organization system for entries
- Entry filtering and search
- Multiple entry templates
- Rich text editing
- Entry tagging and categorization
- Display mode toggle

**Navigation Trigger Keywords**:
- "journal", "trading journal", "journal entries", "trades" (can also trigger journal)
- "entries", "notes", "reflections"

**URL**: `/journal`

**Important**: "trades" keyword can navigate to EITHER `/trades` or `/journal` depending on context. Current implementation defaults to `/journal`.

---

### 5. **Analytics** (`/analytics`)

**Purpose**: Advanced trading analysis with time-based distributions

**Key Features**:
- Hourly trade distribution and performance
- Monthly performance trends
- Cumulative PnL analysis
- Trade volume analysis
- Advanced charting and visualization
- Comparative performance metrics

**Navigation Trigger Keywords**:
- "analytics", "analysis", "trends", "performance analysis", "advanced analytics"

**URL**: `/analytics`

---

### 6. **Calendar** (`/calendar`)

**Purpose**: Calendar-based trading view with daily performance

**Key Features**:
- Monthly calendar visualization
- Daily PnL indicators (colored by profit/loss)
- Trade count per day
- Journal entry indicators
- Month/year navigation
- Click-to-view daily details

**Navigation Trigger Keywords**:
- "calendar", "calendar view", "daily calendar", "trading calendar"

**URL**: `/calendar`

---

### 7. **Daily Summary** (`/daily-summary`)

**Purpose**: Day-by-day breakdown of trading activity

**Key Features**:
- Daily performance cards
- Trade summaries per day
- Quick statistics per trading day
- Navigation between days
- R-multiple and PnL displays
- Date navigation

**Navigation Trigger Keywords**:
- "daily summary", "day summary", "summary", "daily view"

**URL**: `/daily-summary`

---

### 8. **Settings** (`/settings`)

**Purpose**: Application configuration and user preferences

**Key Features**:
- User profile settings
- Display preferences
- Data management (import/export)
- Application settings
- Account configuration
- Notification preferences

**Navigation Trigger Keywords**:
- "settings", "preferences", "configuration", "account settings"

**URL**: `/settings`

---

## Current Navigation Logic (Renata AI)

### Implementation Locations

**1. Frontend Navigation (StandaloneRenataChat Component)**
- File: `/traderra/frontend/src/components/chat/standalone-renata-chat.tsx`
- Lines: 141-207 (`executeNavigation` function)

**2. Backend Navigation Detection (Renata Chat API)**
- File: `/traderra/frontend/src/app/api/renata/chat/route.ts`
- Lines: 108-154 (navigation command detection)

### Navigation Flow

```
User Message
    ↓
[Frontend] StandaloneRenataChat.sendMessage()
    ├─ Message sent to /api/renata/chat
    ├─ API detects navigation keywords
    ├─ Returns navigationCommands array
    └─ Frontend executes navigation via router.push()
```

### Current Navigation Implementation

```typescript
// Keyword-based detection in both frontend and backend
const executeNavigation = (command: string, params?: any) => {
  switch (command) {
    case 'navigate_to_statistics':
      router.push('/statistics')
      break
    case 'navigate_to_dashboard':
      router.push('/dashboard')
      break
    case 'navigate_to_journal':
      router.push('/journal')
      break
    case 'navigate_to_analytics':
      router.push('/analytics')
      break
  }
}
```

---

## Navigation Command Keywords

### Keyword Detection Rules

Navigation is triggered by keyword matching in user messages (case-insensitive):

#### Dashboard
```
Keywords: "dashboard", "main page"
Route: /dashboard
```

#### Statistics Page
```
Keywords: "stats", "statistics"
Route: /statistics
```

#### Journal/Trades
```
Keywords: "journal", "trades"
Route: /journal
Note: Currently both map to journal, not trades
```

#### Analytics
```
Keywords: "analytics", "analysis"
Route: /analytics
```

### Current Keywords Detection Code

**Backend API** (`/api/renata/chat/route.ts`):
```typescript
if (lowerMessage.includes('stats') || lowerMessage.includes('statistics')) {
  navigationCommands.push({ command: 'navigate_to_statistics' })
} else if (lowerMessage.includes('dashboard') || lowerMessage.includes('main page')) {
  navigationCommands.push({ command: 'navigate_to_dashboard' })
} else if (lowerMessage.includes('journal') || lowerMessage.includes('trades')) {
  navigationCommands.push({ command: 'navigate_to_journal' })
} else if (lowerMessage.includes('analytics') || lowerMessage.includes('analysis')) {
  navigationCommands.push({ command: 'navigate_to_analytics' })
}
```

**Frontend** (`/components/chat/standalone-renata-chat.tsx`):
```typescript
if (lowerMessage.includes('stats') || lowerMessage.includes('statistics')) {
  // Parse date range
  router.push('/statistics')
  shouldNavigate = true
} else if (lowerMessage.includes('dashboard') || lowerMessage.includes('main page')) {
  router.push('/dashboard')
  shouldNavigate = true
} else if (lowerMessage.includes('journal') || lowerMessage.includes('trades')) {
  // Parse date range
  router.push('/journal')
  shouldNavigate = true
} else if (lowerMessage.includes('analytics') || lowerMessage.includes('analysis')) {
  router.push('/analytics')
  shouldNavigate = true
}
```

---

## Implementation Details

### Navigation Methods

**Method 1: Frontend Navigation (Primary)**
- Used in: StandaloneRenataChat component
- Trigger: User message detection before sending to API
- Execution: `router.push('/page-name')`
- Advantage: Immediate navigation without API call
- Type: Direct client-side routing

**Method 2: Backend Navigation Commands (Secondary)**
- Used in: API route (`/api/renata/chat/route.ts`)
- Trigger: API response includes navigationCommands array
- Execution: Frontend processes and calls `router.push()` after response
- Advantage: Centralized detection, can include complex logic
- Type: Indirect via API response

### CopilotKit Actions

Renata has defined actions that Copilot can invoke:

**File**: `/components/chat/standalone-renata-chat.tsx`

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
```

**Supported pages in CopilotKit**: 
- `dashboard`
- `statistics`
- `journal`
- `analytics`

### Date Range Integration

Navigation can include date range parameter setting:

```typescript
// Example: "Show me my stats for last month"
const parseDateRange = (message: string) => {
  if (message.includes('last month')) {
    setDateRange('lastMonth')
  } else if (message.includes('this week')) {
    setDateRange('week')
  }
  // ... etc
}
```

**Supported Date Range Presets**:
- `today`
- `week` / `this_week` / `last_week`
- `month` / `this_month` / `last_month`
- `90day` / `last_90_days`
- `year` / `this_year` / `last_year`
- `lastMonth`, `lastYear` (context-specific)

---

## Known Issues & Edge Cases

### Issue 1: "Trades" vs "Journal" Ambiguity

**Problem**: User says "trades" or "show me my trades"
- Current Behavior: Routes to `/journal` (not `/trades`)
- Reason: "trades" was interpreted as trading journal entries

**Recommendation**: 
- Clarify the semantic difference in Renata's understanding:
  - "trades" = individual trade records → `/trades` (trade list/table)
  - "journal" = reflective trade documentation → `/journal`
  - "trading journal entries" = explicitly → `/journal`

### Issue 2: Calendar & Daily-Summary Not Navigable

**Problem**: No Renata navigation keywords exist for:
- Calendar (`/calendar`)
- Daily Summary (`/daily-summary`)
- Settings (`/settings`)

**Recommendation**: 
Add keywords:
- Calendar: "calendar", "calendar view", "monthly view"
- Daily Summary: "daily summary", "day summary", "summary view"
- Settings: "settings", "preferences", "configuration"

### Issue 3: Inconsistent Navigation Paths

**Problem**: 
- Some navigation happens before API call (frontend detection)
- Some happens after API response (backend detection)
- Can cause duplicate/redundant navigation

**Recommendation**: 
- Consolidate to single source of truth (preferably backend API)
- Frontend should only handle immediate keyword detection
- Reduce duplicate keyword checking

### Issue 4: Analytics vs Statistics Naming

**Problem**: 
- Both `/analytics` and `/statistics` exist
- Keywords can be ambiguous ("analysis", "stats", "analytics")
- User intent may be unclear

**Recommendation**: 
- Define clear user-facing distinction:
  - "Statistics" = Detailed metric breakdowns, win rate, profit factor, etc.
  - "Analytics" = Time-based trends, distributions, advanced charts
  - Educate users: "Tell me about my stats" vs "Show me my trends"

### Issue 5: Limited Navigation Context

**Problem**: Navigation doesn't consider:
- Current page (avoid re-navigating to same page)
- User intent (understand context of why they want navigation)
- Page-specific functionality

**Recommendation**: 
- Add context awareness to navigation handlers
- Check current pathname before navigating
- Provide feedback if already on requested page

---

## Navigation Command Reference

### Complete Command Mapping

| User Request | Keywords | Route | Status |
|---|---|---|---|
| "Go to dashboard" | dashboard, main page | /dashboard | ✓ Implemented |
| "Show me stats" | stats, statistics | /statistics | ✓ Implemented |
| "Open journal" | journal, trades | /journal | ✓ Implemented (trades maps to journal) |
| "Show analytics" | analytics, analysis | /analytics | ✓ Implemented |
| "Show calendar" | calendar | /calendar | ✗ Not Implemented |
| "Daily summary" | daily summary, day summary | /daily-summary | ✗ Not Implemented |
| "Go to settings" | settings, preferences | /settings | ✗ Not Implemented |

---

## Recommended Enhancements

### Priority 1: Fix Semantic Issues
1. Add calendar navigation support
2. Add daily-summary navigation support
3. Add settings navigation support
4. Clarify trades vs journal semantics

### Priority 2: Improve Navigation Logic
1. Consolidate keyword detection to single location (preferably backend)
2. Add context awareness (check current page)
3. Add navigation confirmation/feedback messages
4. Reduce duplicate keyword checking

### Priority 3: Enhanced Navigation
1. Support multi-page workflows ("Show me stats and then journal")
2. Add breadcrumb navigation tracking
3. Implement "go back" command
4. Add page-specific search/filter triggers via navigation

### Priority 4: AI Enhancement
1. Use semantic understanding instead of keyword matching
2. Add intent detection (user wants data analysis vs page navigation)
3. Provide navigation suggestions based on user context
4. Remember user's frequent page transitions

---

## Files Referenced

- **Navigation Component**: `/traderra/frontend/src/components/layout/top-nav.tsx`
- **Chat Components**: 
  - `/traderra/frontend/src/components/chat/standalone-renata-chat.tsx`
  - `/traderra/frontend/src/components/dashboard/renata-chat.tsx`
- **API Route**: `/traderra/frontend/src/app/api/renata/chat/route.ts`
- **Context Providers**: `/traderra/frontend/src/contexts/`
  - DateRangeContext.tsx
  - ChatContext.tsx
  - PnLModeContext.tsx
  - DisplayModeContext.tsx

---

## Summary

Traderra has **8 core user-facing pages** with navigation currently implemented for **4 pages** through Renata AI. The navigation system uses keyword-based detection in both frontend and backend, with some redundancy. The main gaps are missing navigation for Calendar, Daily Summary, and Settings pages, plus semantic clarification needed for "trades" vs "journal" terminology.

