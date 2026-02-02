# Traderra Codebase - Quick Reference Guide

## What is Traderra?
A Next.js-based trading journal that imports trades from TraderVue CSV files, calculates PnL metrics, and provides AI-powered analysis via chat interface.

## Key Technologies
- **Frontend:** Next.js 14, React 18, TypeScript, Tailwind CSS
- **Backend:** Python (Flask/FastAPI)
- **Database:** SQLite + Prisma ORM
- **Auth:** Clerk
- **AI:** CopilotKit + OpenAI

## Project Locations

### Absolute File Paths

| What | Path |
|------|------|
| **CSV Parser** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/utils/csv-parser.ts` |
| **PnL Calculator** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/utils/trade-statistics.ts` |
| **Data Diagnostics** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/utils/data-diagnostics.ts` |
| **Trade Hook** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/hooks/useTrades.ts` |
| **Trade API Route** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/app/api/trades/route.ts` |
| **Trades Page** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/app/trades/page.tsx` |
| **Trades Table** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/components/trades/trades-table.tsx` |
| **Import Guide Modal** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/components/trades/import-guide-modal.tsx` |
| **Database Schema** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/prisma/schema.prisma` |
| **Package Config** | `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/package.json` |

## CSV Import Workflow

```
User clicks Import
    ↓
Select trades.csv from computer
    ↓
validateTraderVueCSV() - Check structure
    ↓
parseCSV() - Parse CSV into objects
    ↓
convertTraderVueToTraderra() - Transform format
    ↓
createDataDiagnostic() - Validate accuracy
    ↓
If discrepancy > $100: Show warning
    ↓
saveTrades() - POST to API
    ↓
Database update via Prisma
    ↓
Table updates automatically
```

## Critical Code Snippets

### CSV Parser Entry Point
**File:** `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/app/trades/page.tsx` (lines 25-92)

```typescript
const handleImport = async (e) => {
  const csvText = await file.text()
  
  // Validation
  const validation = validateTraderVueCSV(csvText)
  
  // Parse
  const traderVueTrades = parseCSV(csvText)
  
  // Convert
  const traderraTrades = convertTraderVueToTraderra(traderVueTrades)
  
  // Diagnose
  const diagnostic = createDataDiagnostic(traderVueTrades, traderraTrades)
  
  // Save
  await saveTrades(traderraTrades)
}
```

### Key PnL Calculation
**File:** `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/utils/csv-parser.ts` (lines 113-210)

Uses **Net P&L** from TraderVue, not Gross P&L:
```typescript
const netPnL = safeParseFloat(trade['Net P&L'])
const commission = safeParseFloat(trade['Commissions']) + safeParseFloat(trade['Fees'])

return {
  pnl: netPnL,          // ✅ This is Net (after commissions)
  commission: commission,
  // ...
}
```

### Diagnostic Validation
**File:** `/Users/michaeldurante/ai dev/ce-hub/traderra/frontend/src/utils/data-diagnostics.ts` (lines 52-217)

Calculates discrepancy:
```typescript
const totalPnLTraderVue = sum of 'Net P&L' field
const totalPnLTraderra = sum of calculated pnl
const pnlDiscrepancy = totalPnLTraderVue - totalPnLTraderra

if (Math.abs(pnlDiscrepancy) > 100) {
  // Show warning to user
}
```

## Database Schema

### Trade Table
```
Fields:
  id, userId, date, symbol, side, quantity
  entryPrice, exitPrice, pnl, pnlPercent, commission
  duration, strategy, notes, entryTime, exitTime
  riskAmount, riskPercent, stopLoss, rMultiple, mfe, mae
  createdAt, updatedAt

Indexes:
  userId (fast user lookup)
  symbol (fast symbol filtering)
  date (fast date range queries)
```

## API Endpoints

### GET /api/trades
- **Purpose:** Fetch all trades for user
- **Auth:** Required (Clerk)
- **Response:** `{ trades: Trade[] }`

### POST /api/trades
- **Purpose:** Save trades (replaces all existing)
- **Auth:** Required (Clerk)
- **Body:** `{ trades: TraderraTrade[] }`
- **Response:** `{ message: string, count: number }`

## Common PnL Discrepancy Causes

| Issue | Root Cause | Solution |
|-------|-----------|----------|
| Large $ difference | Using Gross instead of Net P&L | Check CSV source |
| Commission mismatch | Fee calculation differences | Compare field values |
| Floating point errors | SQLite precision limits | < $0.01 tolerance OK |
| CSV parse failures | Special characters/quotes | Check CSV encoding |
| Date calculation wrong | Timezone handling | Verify date strings |

## Statistics Calculated

All in `calculateTradeStatistics()`:
- Total P&L, win rate, profit factor
- Max drawdown, Sharpe ratio
- Kelly percentage, average hold time
- Performance by day/month/hour
- Price distribution analysis
- MAE/MFE averages

## Testing

```bash
npm run dev              # Start dev server
npm run test             # Run tests
npm run test:e2e         # Playwright E2E tests
npm run test:coverage    # Coverage report
```

## Frontend Components Structure

```
components/
├── trades/
│   ├── trades-table.tsx           # Main table display
│   ├── import-guide-modal.tsx      # Step-by-step guide
│   ├── new-trade-modal.tsx         # Add new trade form
│   └── trade-detail-modal.tsx      # Trade details view
├── dashboard/                      # Dashboard widgets
├── editor/                         # Rich text editor
└── journal/                        # Journal components
```

## TypeScript Interfaces

### TraderVueTrade (from CSV)
Raw data from TraderVue export with fields like:
- 'Open Datetime', 'Close Datetime', 'Symbol', 'Side'
- 'Volume', 'Entry Price', 'Exit Price'
- 'Gross P&L', 'Net P&L', 'Commissions', 'Fees'
- 'P&L (R)', 'Position MFE', 'Position MAE'

### TraderraTrade (internal format)
Standardized format used throughout app:
- id, date, symbol, side (Long/Short)
- quantity, entryPrice, exitPrice
- pnl (Net), pnlPercent, commission
- duration, strategy, notes
- entryTime, exitTime (ISO format)
- Optional: riskAmount, rMultiple, mfe, mae

## Development Commands

```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra/frontend

# Start development
npm run dev                    # Runs on port 6565

# Building
npm run build                  # Production build

# Testing
npm run test:run              # Single test run
npm run test:watch            # Watch mode
npm run test:e2e              # Playwright
npm run test:coverage         # Coverage report

# Type checking
npm run type-check            # TypeScript check
```

## Key Performance Notes

- CSV parsing: ~1-2 sec for 1000 trades
- Statistics calc: ~50-100ms for 1000 trades
- Database queries: <100ms with indices
- UI target: 60 FPS (16ms frames)

## Important: Net vs Gross P&L

- **Gross P&L:** Profit before costs
- **Net P&L:** Profit after commissions/fees
- **Traderra uses:** Net P&L ✅
- **Why:** Net is actual money in/out

Example:
```
Entry: 100 shares @ $50 = $5,000
Exit:  100 shares @ $51 = $5,100
Gross P&L: $100
Commissions: -$2
Fees: -$1
Net P&L: $97 ← Traderra uses this
```

## Configuration Files

### Environment Variables (.env.local)
```
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=...
CLERK_SECRET_KEY=...
DATABASE_URL=file:./dev.db
COPILOT_CLOUD_DEPLOYMENT_URL=...
```

### Next.js Config
- Port: 6565
- Framework: App Router
- TypeScript: Yes
- Tailwind: Yes

## Recent Changes

Latest commits:
1. Remove traderra from CE-Hub (v1.0)
2. Remove Next.js build artifacts
3. Fix GitHub file size limits
4. Merge CE-Hub v2.0.0 (Vision + Chat)

## Need to Fix?

If PnL mismatches occur:

1. **Check browser console** (Diagnostic Report logged)
2. **Verify CSV export** from TraderVue (Net vs Gross)
3. **Check commission fields** in CSV
4. **Review data-diagnostics output** for specific issues
5. **Look at individual trade comparisons** in report

The diagnostic system automatically flags discrepancies > $100.

## Key Files to Study

| For | Read |
|-----|------|
| CSV logic | `csv-parser.ts` |
| Calculations | `trade-statistics.ts` |
| Validation | `data-diagnostics.ts` |
| Persistence | `useTrades.ts` |
| Schema | `prisma/schema.prisma` |
| Import flow | `trades/page.tsx` |

---

**Full Analysis:** `/Users/michaeldurante/ai dev/ce-hub/TRADERRA_CODEBASE_STATE_ANALYSIS.md`
