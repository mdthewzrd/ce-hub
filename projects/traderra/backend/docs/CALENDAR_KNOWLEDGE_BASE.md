# Traderra Calendar Page - Renata Knowledge Base

## Overview

The Traderra Trading Calendar is a comprehensive trading performance visualization tool that displays trades in both yearly and monthly views. It provides multiple display modes, filtering options, and interactive controls for analyzing trading performance over time.

**Page Location:** `/calendar`
**Current Working Year:** Auto-detected from trade data or defaults to current year
**Sample Data:** Automatically generated when no authenticated trades are available

---

## Core Components

### 1. Display Mode Toggle (`$` / `R` Buttons)

**Purpose:** Switch between Dollar and Risk Multiple (R-multiple) display modes

**Component:** `DisplayModeToggle` (`@/components/ui/display-mode-toggle.tsx`)

**Buttons:**
- **`$` Button** (Dollar mode): Shows P&L in dollar format (e.g., "+$1910")
- **`R` Button** (Risk Multiple mode): Shows P&L as R-multiples (e.g., "7.3R")

**Technical Details:**
- Hook: `useDisplayMode()` from `TraderraContext`
- State: `displayMode` ('dollar' | 'r')
- Setter: `setDisplayMode(mode)`
- AGUI IDs: `display-mode-dollar-button`, `display-mode-r-button`
- Data attributes: `data-agui-component="display-mode-toggle"`, `data-agui-action="set-mode"`

**R-Multiple Calculation:**
```
R-multiple = P&L / Risk Amount
Gross P&L = Net P&L + |commission|
```

**Interaction Examples for Renata:**
- User: "switch to R" → Click R button
- User: "show dollars" → Click $ button
- User: "change to R-multiple view" → Click R button

---

### 2. P&L Mode Toggle (`G` / `N` Buttons)

**Purpose:** Switch between Gross and Net P&L calculations

**Component:** `PnLModeToggle` (`@/components/ui/pnl-mode-toggle.tsx`)

**Buttons:**
- **`G` Button** (Gross P&L): Shows P&L before commissions (Net P&L + |commission|)
- **`N` Button** (Net P&L): Shows P&L after commissions

**Technical Details:**
- Hook: `usePnLMode()` from `TraderraContext`
- State: `pnlMode` ('gross' | 'net')
- Setter: `setPnLMode(mode)`
- AGUI IDs: `pnl-mode-gross-button`, `pnl-mode-net-button`
- Data attributes: `data-agui-component="pnl-mode-toggle"`, `data-agui-action="set-mode"`

**P&L Calculations:**
```javascript
// Gross P&L (before commissions)
grossPnL = trade.pnl + Math.abs(trade.commission)

// Net P&L (after commissions)
netPnL = trade.pnl
```

**Interaction Examples for Renata:**
- User: "show gross" → Click G button
- User: "switch to net" → Click N button
- User: "include commissions" → Click G button (gross = before commissions)
- User: "after fees" → Click N button

---

### 3. Date Range Selector

**Purpose:** Filter trades by time period

**Component:** `TraderViewDateSelector` (`@/components/ui/traderview-date-selector.tsx`)

**Quick Range Buttons:**
- **`7d`**: Last 7 days
- **`30d`**: Last 30 days
- **`90d`**: Last 90 days
- **`YTD`**: Year to date (Jan 1 of current year)
- **`All`**: All trades (no date filtering)
- **📅 Calendar**: Custom date range picker

**Technical Details:**
- Hook: `useDateRange()` from `TraderraContext`
- State: `selectedRange` ('week' | 'month' | '90day' | 'year' | 'all' | 'custom')
- State: `customStartDate`, `customEndDate`
- Setter: `setDateRange(range)`, `setCustomRange(start, end)`
- Calendar opens popup with:
  - Direct date input fields
  - Visual calendar picker
  - Quick selection buttons
  - Apply/Cancel buttons

**Custom Date Range Features:**
- Start date and end date inputs (HTML5 date picker)
- Visual calendar with clickable dates
- Range highlighting for selected dates
- Max date: Today (future dates disabled)
- Reset button: Returns to 30-day default

**Interaction Examples for Renata:**
- User: "show last week" → Click 7d button
- User: "this month" → Click 30d button
- User: "quarter to date" → Click 90d button
- User: "year to date" → Click YTD button
- User: "all time" → Click All button
- User: "from Jan 1 to Mar 31" → Click calendar, set dates, Apply
- User: "custom range" → Open calendar popup, select dates

---

### 4. View Mode Toggle (Year / Month)

**Purpose:** Switch between yearly overview and detailed monthly view

**Location:** Header section, right side

**Buttons:**
- **`Year`**: Shows all 12 months as cards (4x3 grid)
- **`Month`**: Shows detailed calendar for selected month

**Technical Details:**
- State: `viewMode` ('year' | 'month')
- Component-registered: `calendar.view-mode`
- Year view shows mini calendar previews for each month
- Month view shows full 42-cell calendar grid (6 weeks)

**Year View Features:**
- 12 month cards in responsive grid
- Each card shows:
  - Month name
  - Total P&L (color-coded badge)
  - Trading days count
  - Winning days count
  - Total trades count
  - Mini calendar preview (first 5 weeks)
- Click any month card to switch to Month view

**Month View Features:**
- Full 42-cell grid (6 rows × 7 columns)
- Previous/next month days (dimmed)
- Current month days (full opacity)
- Today highlighted with primary color background
- Each day cell shows:
  - Date number
  - Trade count badge (if trades exist)
  - Daily P&L (color-coded: green/red)
- Hover effects on cells with trades
- "Back to Year View" button to return

**Interaction Examples for Renata:**
- User: "show January" → Click January card
- User: "go to year view" → Click Year button
- User: "show March details" → Click March card
- User: "back to all months" → Click "Back to Year View"

---

### 5. Year Navigation

**Purpose:** Navigate between different years

**Location:** Header section, right side

**Controls:**
- **`<` Previous Year button**: Decrements year by 1
- **Year Display**: Shows current year (e.g., "2026")
- **`>` Next Year button**: Increments year by 1

**Technical Details:**
- State: `currentYear` (number)
- Component-registered: `calendar.year`
- Auto-detects year from trade data on initial load
- ChevronLeft/ChevronRight icons from lucide-react

**Interaction Examples for Renata:**
- User: "show 2024" → Click `<` until 2024, or use component registry
- User: "next year" → Click `>` button
- User: "go to 2025" → Use AGUI to set calendar.year = 2025

---

## Data Flow & Calculations

### Trade Data Source
```typescript
const { trades, isLoading: tradesLoading } = useTrades()
```

### Date Filtering
```typescript
const filteredTrades = useMemo(() => {
  // Filter trades based on selectedRange
  // - week: last 7 days
  // - month: last 30 days
  // - 90day: last 90 days
  // - year: Jan 1 to today
  // - all: no filtering
  // - custom: customStartDate to customEndDate
}, [trades, selectedRange, customStartDate, customEndDate])
```

### Display Calculations

**Value Calculation (Monthly/Daily):**
```typescript
let totalValue = 0
for (const trade of trades) {
  // 1. Get P&L based on Gross vs Net mode
  let tradePnL = trade.pnl || 0
  if (isGrossPnL && trade.commission) {
    tradePnL = tradePnL + Math.abs(trade.commission)
  }

  // 2. Get value based on Dollar vs R mode
  if (displayMode === 'r') {
    if (trade.rMultiple !== undefined && trade.rMultiple !== null) {
      totalValue += trade.rMultiple
    } else if (trade.riskAmount && trade.riskAmount !== 0) {
      totalValue += tradePnL / Math.abs(trade.riskAmount)
    } else {
      totalValue += tradePnL  // Fallback to dollar if no risk info
    }
  } else {
    totalValue += tradePnL
  }
}
```

**Value Formatting:**
```typescript
const formatValue = (value: number) => {
  if (displayMode === 'r') {
    return `${value.toFixed(1)}R`  // "7.3R"
  } else {
    return `${value >= 0 ? '+' : ''}$${value.toFixed(0)}`  // "+$1910"
  }
}
```

---

## AG-UI Integration for Programmatic Control

### Component Registry System

The calendar components register themselves for AG-UI control:

```typescript
useComponentRegistry('calendar.view-mode', {
  setState: (state) => {
    if (state === 'year' || state === 'month') {
      setViewMode(state)
    }
  }
})

useComponentRegistry('calendar.year', {
  setState: (state) => {
    const year = typeof state === 'number' ? state : parseInt(state)
    if (!isNaN(year)) {
      setCurrentYear(year)
    }
  }
})

useComponentRegistry('calendar.month', {
  setState: (state) => {
    const month = typeof state === 'number' ? state : parseInt(state)
    if (!isNaN(month) && month >= 0 && month <= 11) {
      setSelectedMonth(month)
      setViewMode('month')
    }
  }
})
```

### Programmatic Control Examples

```javascript
// Switch to month view
window.agui.setComponentState('calendar.view-mode', 'month')

// Change to 2025
window.agui.setComponentState('calendar.year', 2025)

// Go to March (month 2, zero-indexed)
window.agui.setComponentState('calendar.month', 2)

// Switch to R display mode
window.agui.setComponentState('display-mode', 'r')

// Switch to Gross P&L
window.agui.setComponentState('pnl-mode', 'gross')
```

---

## UI Context Structure

When sending UI context to the backend, include:

```typescript
{
  currentPage: 'calendar',
  displayMode: 'dollar' | 'r',
  pnlMode: 'gross' | 'net',
  selectedRange: 'week' | 'month' | '90day' | 'year' | 'all' | 'custom',
  customStartDate: Date | null,
  customEndDate: Date | null,
  currentYear: number,
  selectedMonth: number | null,
  viewMode: 'year' | 'month',
  hasTrades: boolean,
  tradeCount: number
}
```

---

## Sample Trade Structure

```typescript
{
  id: string,
  date: Date | string,  // ISO format: "2026-01-15"
  symbol: string,       // "AAPL", "TSLA", etc.
  entry_price: number,
  exit_price: number,
  quantity: number,
  pnl: number,          // Net P&L in dollars
  side: 'long' | 'short',
  commission: number,   // Negative value: -4.50
  riskAmount: number,   // Risk amount in dollars
  rMultiple: number     // Pre-calculated R-multiple
}
```

---

## Styling & Color Coding

### Status Colors
- **Profit (Green):** `bg-green-900/40`, `text-green-400`
- **Loss (Red):** `bg-red-900/40`, `text-red-400`
- **Neutral (Gray):** `bg-[#1a1a1a]`, `text-gray-400`
- **Primary (Gold):** `bg-[#B8860B]`, `text-black`
- **Today Highlight:** Primary color background

### Mini Calendar Preview (Year View)
- Shows first 35 cells (5 weeks) of each month
- Green cells: Profitable days
- Red cells: Loss days
- Gray cells: No trades
- Dimmed: Previous/next month days

---

## Common User Interactions & Renata Responses

### Display Mode Changes
**User says:** "switch to R"
**Renata should:** Guide user to click R button, explain R-multiples show P&L relative to risk

**User says:** "show me dollars"
**Renata should:** Guide user to click $ button, explain dollar view shows actual P&L

### P&L Mode Changes
**User says:** "include commissions"
**Renata should:** Click G button (Gross P&L = before commissions)

**User says:** "after fees" or "net P&L"
**Renata should:** Click N button (Net P&L = after commissions)

### Date Range Queries
**User says:** "how did I do this week?"
**Renata should:** Click 7d button, analyze performance

**User says:** "show me YTD performance"
**Renata should:** Click YTD button, provide analysis

**User says:** "from January to March"
**Renata should:** Open calendar popup, set start date to Jan 1, end date to Mar 31, click Apply

### Year/Month Navigation
**User says:** "show January 2025"
**Renata should:** Set year to 2025, click January card

**User says:** "compare Q1 and Q2"
**Renata should:** Suggest using custom ranges or guide user through each quarter

---

## Known Contextual Information

### Auto-Detection
- Year is automatically detected from trade data
- Falls back to current year if no trades
- Sample trades generated when not authenticated

### Performance Metrics Calculated
- Total P&L (per day, per month)
- Trading days count
- Winning days count
- Total trades count
- Win rate (implicit from winning days / trading days)

### Sample Data Mode
When no real trades exist, the calendar generates sample trades:
- 70% chance of trades on weekdays
- Random P&L: $100-$2100 wins, -$50 to -$1550 losses
- Random risk amounts: $100-$600
- R-multiple automatically calculated
- Random symbols from: AAPL, TSLA, NVDA, MSFT, GOOGL, AMZN, META

---

## Integration Points for Renata

### When User Asks About Calendar

1. **Check current page:** If `currentPage === 'calendar'`
2. **Read UI context:** Get current displayMode, pnlMode, selectedRange
3. **Understand request:** Parse what user wants to see/change
4. **Generate UI action:** Return appropriate `ui_action` with parameters

### Example UI Action Response

```json
{
  "action_type": "change_display_mode",
  "parameters": {
    "mode": "r"
  }
}
```

```json
{
  "action_type": "change_date_range",
  "parameters": {
    "range": "custom",
    "start_date": "2026-01-01",
    "end_date": "2026-03-31"
  }
}
```

```json
{
  "action_type": "navigate_calendar",
  "parameters": {
    "year": 2025,
    "month": 2,
    "view": "month"
  }
}
```

---

## Key Takeaways for Renata

1. **Four Toggle Buttons:** `$` (dollar), `R` (R-multiple), `G` (gross), `N` (net)
2. **Date Ranges:** 7d, 30d, 90d, YTD, All, Custom (calendar picker)
3. **Two Views:** Year (overview), Month (detailed)
4. **Year Navigation:** Previous/Next buttons with year display
5. **Color Coding:** Green (profit), Red (loss), Gold (active/primary)
6. **Sample Data:** Automatically generated when no trades exist
7. **Auto-Detection:** Year detected from trade data
8. **AG-UI Integration:** All components controllable via AG-UI registry

---

## File Locations

- **Calendar Page:** `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/frontend/src/app/calendar/page.tsx`
- **Display Mode Toggle:** `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/frontend/src/components/ui/display-mode-toggle.tsx`
- **P&L Mode Toggle:** `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/frontend/src/components/ui/pnl-mode-toggle.tsx`
- **Date Selector:** `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/frontend/src/components/ui/traderview-date-selector.tsx`
- **Context Provider:** `/Users/michaeldurante/ai dev/ce-hub/projects/traderra/frontend/src/contexts/TraderraContext.tsx`

---

*Last Updated: 2025-01-04*
*Calendar Version: 1.0*
*Frontend: Next.js 15.5.9 with App Router*
