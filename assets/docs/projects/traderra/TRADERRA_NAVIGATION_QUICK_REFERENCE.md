# Traderra Navigation - Quick Reference Guide

## Pages at a Glance

| Page | URL | Purpose | AI Keywords |
|------|-----|---------|------------|
| Dashboard | `/dashboard` | Main trading overview & metrics | dashboard, main page |
| Trades | `/trades` | Trade list & import | trades (→ journal), trade table |
| Statistics | `/statistics` | Detailed performance stats | stats, statistics |
| Journal | `/journal` | Trading reflections & entries | journal, trades, entries |
| Analytics | `/analytics` | Time-based trends & analysis | analytics, analysis |
| Calendar | `/calendar` | Monthly calendar view | calendar ❌ Not implemented |
| Daily Summary | `/daily-summary` | Day-by-day breakdown | daily summary ❌ Not implemented |
| Settings | `/settings` | App preferences & config | settings ❌ Not implemented |

---

## Navigation Keywords (What Renata Understands)

### Currently Implemented
- **"dashboard"** or **"main page"** → `/dashboard`
- **"stats"** or **"statistics"** → `/statistics`
- **"journal"** or **"trades"** → `/journal` ⚠️ (trades should go to `/trades`)
- **"analytics"** or **"analysis"** → `/analytics`

### NOT Yet Implemented
- **"calendar"** → `/calendar` (missing)
- **"daily summary"** → `/daily-summary` (missing)
- **"settings"** → `/settings` (missing)

---

## Key Points

### About Trades vs Journal
- **"Show me my trades"** currently goes to `/journal`
- Should go to `/trades` for detailed trade table
- Semantic difference: individual records (trades) vs reflective documentation (journal)

### Date Range Support
When navigating, can also set date range:
- "Show my stats for last month" → `/statistics` + last month
- Supported: today, week, month, 90days, year, etc.

### Where Navigation Happens
1. **Frontend** (`standalone-renata-chat.tsx`) - Immediate keyword detection
2. **Backend** (`/api/renata/chat/route.ts`) - Secondary detection
3. **CopilotKit** - Direct action invocation

---

## Implementation Files

```
src/
├── components/
│   ├── chat/standalone-renata-chat.tsx     (navigation logic)
│   └── layout/top-nav.tsx                  (UI navigation)
├── app/
│   ├── api/renata/chat/route.ts           (backend detection)
│   └── [pages]/page.tsx                   (page implementations)
└── contexts/
    └── DateRangeContext.tsx               (date range state)
```

---

## Quick Enhancements Needed

1. **Add 3 missing pages**: Calendar, Daily Summary, Settings
2. **Fix trades/journal**: Route "trades" to `/trades` not `/journal`
3. **Consolidate detection**: Reduce backend/frontend duplication
4. **Add context awareness**: Don't re-navigate to current page

---

## Testing Navigation

Try these commands with Renata:
- "Go to dashboard"
- "Show me my stats"
- "Open my journal"
- "Show analytics"
- "Show my stats for last month" (with date range)
- "Show calendar" (currently won't work)
- "Go to settings" (currently won't work)

