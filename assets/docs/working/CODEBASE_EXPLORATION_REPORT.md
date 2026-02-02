# CE-Hub Codebase Structure Exploration Report
**Generated:** November 5, 2025  
**Thoroughness Level:** Medium - Focused Overview

---

## 1. OVERALL ARCHITECTURE

The CE-Hub ecosystem is a sophisticated trading/scanning platform with three main integrated projects:

### Projects Structure
```
/Users/michaeldurante/ai dev/ce-hub/
├── edge-dev/              # Trading Dashboard & Scanning Platform (Next.js 16, Port 5657)
├── planner-chat/          # AI Planning & Research Chat Interface (Express.js, Port 3000)
└── docs/, agents/         # Documentation & Agent Configuration
```

---

## 2. EDGE-DEV PROJECT (Primary Focus Area)

**Purpose:** Advanced trading platform with real-time scanning and chart analysis
**Technology Stack:** Next.js 16, React 19, TypeScript, Tailwind CSS, Plotly.js
**Port:** 5657 (dev server)

### 2.1 Project Structure

```
edge-dev/
├── src/
│   ├── app/
│   │   ├── page.tsx                    # Main trading dashboard page
│   │   ├── api/
│   │   │   └── systematic/
│   │   │       ├── scan/route.ts       # LC D2 Scanner API endpoint
│   │   │       └── backtest/route.ts   # Backtesting endpoint
│   │   ├── exec/                       # Strategy execution components
│   │   │   ├── page.tsx
│   │   │   └── components/
│   │   │       ├── EnhancedStrategyUpload.tsx
│   │   │       ├── ExecutionChart.tsx
│   │   │       ├── RenataAgent.tsx
│   │   │       └── SystematicTrading.tsx
│   │   └── code-formatter/page.tsx     # Code formatting utilities
│   │
│   ├── components/
│   │   ├── EdgeChart.tsx                      # Chart visualization (Plotly-based)
│   │   ├── ChartDayNavigation.tsx             # Day navigation for patterns
│   │   ├── SavedScansSidebar.tsx              # Saved scans management
│   │   ├── SaveScanModal.tsx                  # Save scan modal UI
│   │   ├── CodeFormatter.tsx                  # Code formatting display
│   │   └── ui/                                # UI component library
│   │       ├── button.tsx, input.tsx, card.tsx, etc.
│   │
│   ├── services/
│   │   └── fastApiScanService.ts      # FastAPI backend connector
│   │
│   ├── hooks/
│   │   └── useSavedScans.ts           # Saved scans state management
│   │
│   ├── utils/
│   │   ├── dataProcessing.ts          # OHLC data handling
│   │   ├── polygonData.ts             # Polygon API integration
│   │   ├── marketCalendar.ts          # Trading hours & holidays
│   │   ├── chartDayNavigation.ts      # Day navigation logic
│   │   ├── savedScans.ts              # LocalStorage scan management
│   │   ├── uploadHandler.ts           # File upload processing
│   │   ├── codeFormatter.ts           # Code formatting utilities
│   │   └── codeFormatterAPI.ts        # Backend API for code formatting
│   │
│   └── types/
│       └── scanTypes.ts               # TypeScript interfaces
│
├── backend/                           # Python FastAPI backend
│   ├── core/
│   │   ├── scanner.py                 # Main LC D2 Scanner implementation
│   │   ├── code_preservation_engine.py
│   │   ├── parameter_integrity_system.py
│   │   ├── intelligent_parameter_extractor.py
│   │   ├── scanner_wrapper.py
│   │   └── scan_manager.py
│   │
│   ├── models/                        # Data models
│   ├── utils/                         # Utility functions
│   ├── api/                           # API endpoints
│   ├── saved_scans/                   # User scan storage
│   ├── scan_results/                  # Result caching
│   └── *_data.json                    # Cached ticker data (~150 files)
│
├── tests/                             # Playwright E2E tests
│   ├── e2e/
│   │   ├── charts/chart-interactions.spec.js
│   │   ├── trading/trading-interface.spec.js
│   │   ├── mobile/mobile-responsiveness.spec.js
│   │   └── page-load-basic.spec.js
│   ├── page-objects/
│   │   ├── components/
│   │   │   ├── ScanResultsTable.js
│   │   │   └── ChartComponent.js
│   │   └── pages/TradingDashboard.js
│   └── fixtures/
│
└── public/                            # Static assets
```

### 2.2 Key Dependencies

**Frontend:**
- `next@16.0.0` - React framework
- `react@19.2.0`, `react-dom@19.2.0` - React library
- `plotly.js@3.1.2` - Chart visualization
- `react-plotly.js@2.6.0` - React wrapper for Plotly
- `tailwindcss@4` - Styling
- `lucide-react@0.547.0` - Icons
- `@tanstack/react-query@5.90.5` - Data fetching
- `zustand@5.0.8` - State management
- `@clerk/nextjs@6.34.0` - Authentication
- `@copilotkit/*` - AI copilot integration

**Backend:**
- Python FastAPI (inferred from file structure)
- Polygon API for market data
- Pandas for data processing
- Plotly for visualizations

---

## 3. PLANNER-CHAT PROJECT

**Purpose:** AI-powered planning and research chat interface
**Technology Stack:** Express.js, Node.js, Anthropic SDK, OpenAI SDK, Playwright
**Port:** 3000 (default)

### 3.1 Architecture

```
planner-chat/
├── server/
│   ├── main.js                    # Express server (23.9KB)
│   └── services/
│       ├── IndexManager.js        # Project index management
│       ├── ProjectManager.js      # Project CRUD operations
│       └── ChatManager.js         # Chat message handling
│
├── web/
│   ├── app.js                     # Frontend application (85.7KB)
│   ├── index.html                 # Main HTML template
│   └── style.css                  # Styling
│
├── llm/                           # LLM Adapters
│   ├── anthropic/                 # Anthropic Claude integration
│   ├── openai/                    # OpenAI GPT integration
│   └── openrouter/                # OpenRouter integration
│
├── archon/                        # Archon knowledge graph bridge
│   └── bridge/
│
├── data/                          # Data storage
├── uploads/                       # File uploads
├── projects/                      # Project definitions
├── prompts/                       # Prompt templates
└── tests/                         # Test files
```

### 3.2 Key Features
- **Multi-LLM Support**: Anthropic, OpenAI, OpenRouter
- **File Upload**: Comprehensive file type support (images, PDFs, documents, code)
- **Archon Integration**: Knowledge graph synchronization
- **Project Management**: Full CRUD operations
- **Streaming Chat**: Real-time streaming responses

---

## 4. CHART FUNCTIONALITY (Port 5657)

### 4.1 Chart Component Architecture

**Main Component:** `EdgeChart.tsx` (Port 5657 - http://localhost:5657)

```typescript
// Chart Templates Configuration
CHART_TEMPLATES = {
  day: {
    defaultDays: 90,
    barsPerDay: 1,
    baseTimeframe: 'daily',
    description: "Daily candlestick (90 days)"
  },
  hour: {
    defaultDays: 90,
    barsPerDay: 16,
    baseTimeframe: '1min',  // Resampled from 1-minute
    extendedHours: true
  },
  '15min': {
    defaultDays: 15,
    barsPerDay: 64,
    baseTimeframe: '1min',
    extendedHours: true
  },
  '5min': {
    defaultDays: 5,
    barsPerDay: 192,
    baseTimeframe: '1min',
    extendedHours: true
  }
};
```

### 4.2 Chart Features
- **Plotly.js Integration**: Candlestick charts with full interaction
- **Market Hours Management**:
  - Extended hours: 4am - 8pm (16 hours)
  - Weekend/holiday hiding via rangebreaks
  - Market calendar integration
  
- **Data Processing**:
  - Polygon API for OHLC data
  - Candlestick resampling from 1-minute base data
  - Data quality metrics
  - Fake print detection

- **Dynamic Navigation**:
  - Day navigation for pattern analysis
  - Timeframe switching
  - Reset to reference date
  - Quick jump navigation

### 4.3 Chart Data Structure

```typescript
interface ChartData {
  x: string[];           // ISO timestamps
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}
```

---

## 5. SCAN RESULTS & CLICKING FUNCTIONALITY

### 5.1 Scan Result Types

```typescript
// Core ScanResult interface
interface ScanResult {
  symbol: string;
  ticker: string;
  date: string;
  scanner_type: string;
  gap_percent: number;
  volume_ratio: number | null;
  signal_strength: 'Strong' | 'Moderate';
  entry_price: number;
  target_price: number;
}

// Extended results with pattern metadata
interface EnhancedScanResult extends ScanResult {
  id?: string;
  close?: number;
  gap_pct?: number;
  confidence_score?: number;
  parabolic_score?: number;
  high_chg_atr?: number;
  dist_h_9ema_atr?: number;
  ema_stack?: boolean;
  // ... 30+ additional fields
}
```

### 5.2 Main Page (page.tsx) - Click Handling

**Frontend page.tsx** contains:
- **Mock scan results display** (line 98-107)
- **Result deduplication** (line 19-35)
- **Parameter extraction from code** (line 124-164)
- **Scan filter parsing** (line 195-200+)

**Click functionality structure:**
- Scan result table rendering
- Row click handling (likely for chart loading)
- Result filtering and display
- Save scan modal integration

### 5.3 Scan Execution Flow

```
User Uploads Scanner Code
        ↓
CodeFormatter Component (CodeFormatter.tsx)
        ↓
extractFiltersFromCode() - Parse parameters
        ↓
fastApiScanService.executeScan()
        ↓
FastAPI Backend (/systematic/scan)
        ↓
Python Scanner (scanner.py)
        ↓
Return EnhancedScanResult[]
        ↓
Frontend Result Display
        ↓
User Clicks Result Row
        ↓
ChartDayNavigation loads chart for that date
```

### 5.4 Result Handling Components

1. **SavedScansSidebar.tsx** (11.9KB)
   - Displays saved scans
   - Load/delete/rename operations
   - Favorite toggles
   
2. **SaveScanModal.tsx** (15.8KB)
   - Save current scan results
   - Name and description
   - Preserves scan parameters

3. **ChartDayNavigation.tsx** (7.4KB)
   - Navigate through pattern days
   - Multi-day progression
   - Reference date tracking

---

## 6. BACKEND SCANNER IMPLEMENTATION

### 6.1 Main Scanner (scanner.py - 65.7KB)

**Core Functionality:**
- LC (Liquid Core) pattern detection
- D2 (Double Pattern) analysis
- Extended hours support (4am - 8pm)
- ATR (Average True Range) calculations
- EMA (Exponential Moving Average) stack detection
- Volume analysis

**Key Methods:**
```python
adjust_daily(df)              # Daily adjustment metrics
calculate_atr()               # Average True Range
calculate_ema()               # Exponential Moving Average
detect_lc_patterns()          # Pattern recognition
scan_universe()               # Full ticker universe
```

### 6.2 Related Backend Systems

- **code_preservation_engine.py** - Parameter preservation during formatting
- **parameter_integrity_system.py** - Parameter validation & integrity
- **intelligent_parameter_extractor.py** - AI-based parameter detection
- **local_llm_classifier.py** - Local LLM classification
- **scan_manager.py** - Scan lifecycle management
- **scanner_wrapper.py** - Scanner interface wrapping

### 6.3 API Integration (route.ts)

Located: `/edge-dev/src/app/api/systematic/scan/route.ts`

```typescript
// POST /api/systematic/scan
// Handles:
// - Filter parameters
// - Scan date specification  
// - Streaming vs direct response
// - Corrected LC D2 logic matching Python exactly
```

---

## 7. DATA FLOW ARCHITECTURE

### 7.1 Complete Request Flow

```
Frontend (page.tsx)
    ↓
User Interaction (click scan result, change timeframe)
    ↓
Event Handler
    ├─→ Chart Loading: fetchRealData()
    │      ↓
    │   fetchPolygonData() [utils/polygonData.ts]
    │      ↓
    │   Polygon API
    │
    ├─→ Scan Execution: fastApiScanService.executeScan()
    │      ↓
    │   POST /api/systematic/scan
    │      ↓
    │   FastAPI Backend (/backend/core/scanner.py)
    │      ↓
    │   Return Results
    │
    └─→ Save Scan: SavedScanModal
           ↓
        LocalStorage: localStorage.setItem('saved_scans')
```

### 7.2 Data Processing Pipeline

**Chart Data Processing:**
```
Raw Polygon OHLC
    ↓
processRawMarketData() [utils/dataProcessing.ts]
    ↓
resampleCandles() [for non-daily timeframes]
    ↓
generateComprehensiveRangebreaks() [market hours]
    ↓
Plotly Chart Render
```

**Scan Results Processing:**
```
Python Scanner Output
    ↓
Backend /api/systematic/scan endpoint
    ↓
deduplicateResults() [frontend line 19-35]
    ↓
EnhancedScanResult[] normalization
    ↓
Display in Results Table
    ↓
User saves → LocalStorage
```

---

## 8. KEY FILES FOR UNDERSTANDING

### Frontend Core
| File | Size | Purpose |
|------|------|---------|
| `src/app/page.tsx` | ~46KB | Main dashboard, scan execution, result handling |
| `src/components/EdgeChart.tsx` | 18.5KB | Chart rendering & interactions |
| `src/app/api/systematic/scan/route.ts` | Size varies | API endpoint for scan execution |
| `src/services/fastApiScanService.ts` | ~150 lines | FastAPI connector with chunking |
| `src/utils/polygonData.ts` | Size varies | Polygon API integration |
| `src/utils/marketCalendar.ts` | Size varies | Trading hours & holidays |

### Backend Core
| File | Size | Purpose |
|------|------|---------|
| `backend/core/scanner.py` | 65.7KB | Main LC D2 scanner implementation |
| `backend/core/parameter_integrity_system.py` | 58.3KB | Parameter validation |
| `backend/core/code_preservation_engine.py` | 28.2KB | Preserve params during formatting |

### Test Files (Playwright E2E)
| File | Purpose |
|------|---------|
| `tests/e2e/charts/chart-interactions.spec.js` | Chart interaction testing |
| `tests/e2e/trading/trading-interface.spec.js` | Trading UI testing |
| `tests/e2e/page-load-basic.spec.js` | Basic load testing |

---

## 9. CONFIGURATION & SETUP

### 9.1 Environment Variables
- **Frontend**: `.env.local` in edge-dev
- **API Keys**: Polygon API (found in route.ts: `4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy`)
- **Ports**: 
  - Edge-dev: 5657 (via `npm run dev`)
  - Planner-chat: 3000 (via `npm run dev`)
  - FastAPI: 8000 (inferred)

### 9.2 Build & Run Commands

**Edge-dev:**
```bash
npm run dev              # Start dev server on port 5657
npm run build           # Build for production
npm run test            # Run Playwright tests
npm run test:charts     # Test chart interactions
npm run test:trading    # Test trading interface
```

**Planner-chat:**
```bash
npm run dev             # Start server on port 3000
npm run start           # Start production server
```

---

## 10. ARCHITECTURE PATTERNS

### 10.1 Component Organization
- **Container Pattern**: page.tsx manages state & logic
- **Presentational Pattern**: Components are reusable and focused
- **Service Pattern**: Isolated API communication (fastApiScanService.ts)
- **Hook Pattern**: Custom hooks for saved scans (useSavedScans.ts)
- **Type Safety**: Full TypeScript implementation with interfaces

### 10.2 State Management
- **Local State**: React `useState` for UI state
- **Custom Hook**: `useSavedScans()` for scan management
- **LocalStorage**: Persistent saved scans storage
- **Query State**: @tanstack/react-query for API state
- **Store**: Zustand for global state (included in deps)

### 10.3 API Communication
- **Direct Fetch**: `fetchPolygonData()` for market data
- **Service Class**: `fastApiScanService` for scan execution
- **NextJS Routes**: `/api/systematic/scan` for backend connection
- **Streaming**: Support for streaming responses
- **Chunking**: Large requests auto-chunked for performance

---

## 11. CLICK & INTERACTION FLOW DETAILS

### 11.1 Scan Result Row Click (Primary Interaction)

```
User clicks row in scan results table
    ↓
handleResultClick() [inferred in page.tsx]
    ↓
Extract: ticker, date from clicked result
    ↓
Load chart for that ticker/date:
    ├─ Call fetchRealData(ticker, timeframe, date)
    ├─ Polygon API returns bars for that date
    ├─ processRawMarketData() transforms to ChartData
    └─ Plotly renders candlestick chart
    ↓
User can navigate days using ChartDayNavigation
    ├─ Day 0: Original pattern date
    ├─ Day 1: Next trading day
    └─ Continue up to max available days
```

### 11.2 Scan Execution Flow (Secondary Interaction)

```
User uploads scanner code
    ↓
CodeFormatter parses code
    ↓
extractFiltersFromCode() extracts parameters
    ↓
User clicks "Run Scan"
    ↓
fastApiScanService.executeScan({
  start_date, end_date, filters
})
    ↓
POST /api/systematic/scan
    ↓
FastAPI backend executes scanner.py
    ↓
Returns: EnhancedScanResult[]
    ↓
Frontend displays results in table
    ↓
User can now click individual results
```

---

## 12. INTEGRATION POINTS

### 12.1 Frontend ↔ Backend
- **API Endpoint**: `/api/systematic/scan` (Next.js API route)
- **FastAPI**: Local FastAPI server (port 8000, inferred)
- **Polygon API**: Market data integration
- **Clerk**: Authentication (not visible in core flow)
- **CopilotKit**: AI chat integration

### 12.2 Data Dependencies
- **Polygon API Key**: Required for chart data
- **Market Calendar**: NYSE trading hours
- **Ticker Universe**: ~80+ tickers in scanner
- **Cached Data**: Stored in `backend/*_data.json` files

---

## 13. SUMMARY OF KEY FINDINGS

### Important Discoveries
1. **Port 5657**: Edge-dev runs Next.js dev server with charts
2. **Chart Library**: Plotly.js for interactive candlesticks
3. **Scanner Backend**: Python-based FastAPI with advanced LC pattern detection
4. **Data Flow**: Complete cycle from scan → results → click → chart
5. **Day Navigation**: Multi-day pattern progression tracking
6. **Saved Scans**: LocalStorage-based persistence with full CRUD
7. **Code Preservation**: Advanced parameter extraction & integrity systems
8. **Type Safety**: Full TypeScript implementation throughout

### Critical Files to Monitor
- `edge-dev/src/app/page.tsx` - Main interaction hub
- `edge-dev/src/components/EdgeChart.tsx` - Chart rendering
- `edge-dev/backend/core/scanner.py` - Scan logic
- `edge-dev/src/app/api/systematic/scan/route.ts` - API bridge
- `edge-dev/src/services/fastApiScanService.ts` - Service layer

