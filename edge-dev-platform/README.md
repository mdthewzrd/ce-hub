# Edge.dev Trading Platform
**React/AGUI companion to Traderra - Edge to Trade inspired interface**

## 🎯 Project Overview

Edge.dev is a specialized trading platform focused on **prospective analysis** and **real-time execution**, complementing Traderra's retrospective performance tracking. Built using React/Next.js with AGUI patterns and CopilotKit integration.

## 🏗️ Architecture

### **Tech Stack**
- **Frontend**: Next.js 14 + React 18 + TypeScript
- **UI Framework**: Shadcn/ui (matching Traderra branding)
- **Charts**: React-Plotly.js with converted wzrd-algo templates
- **AI Integration**: CopilotKit + Archon MCP
- **Backend**: Shared FastAPI with Traderra (port 6500)
- **Authentication**: Shared Clerk integration

### **Port Configuration**
- **Edge.dev Frontend**: localhost:5656
- **Traderra Frontend**: localhost:6565
- **Shared Backend**: localhost:6500
- **Archon MCP**: localhost:8051

## 📊 **Chart Templates Integration**

Converted from `/Users/michaeldurante/wzrd-algo/wzrd-algo-mini-files/utils/chart_templates.py`:

- **Timeframes**: Day, Hour, 15min, 5min
- **Indicators**: VWAP, Prev Close, EMA 9/20, EMA 72/89, Clouds, Bands
- **Professional Styling**: Dark theme, white/red candles, gold VWAP
- **Market Hours**: Range breaks for weekends and non-trading hours

## 🎯 **MVP Features** (Week 1 Priority)

### **Core User Flow**
1. **Code Upload**: Partner uploads Python scanning code
2. **Instant Execution**: Code runs via FastAPI, returns ticker list
3. **Easy Chart View**: Click ticker → see chart with indicators
4. **Quick Navigation**: Keyboard shortcuts to flip between charts

### **Dashboard Layout**
```
┌─────────────────────────────────────────┐
│ Code Upload Panel                       │
├─────────────────┬───────────────────────┤
│ Scan Results    │ Statistics Panel      │
│ (Clickable)     │ (Metrics/Charts)      │
├─────────────────┴───────────────────────┤
│           Chart Area                    │
│     (Large, with timeframe controls)    │
└─────────────────────────────────────────┘
```

## 🚀 **Setup Instructions**

### **1. Environment Setup**
```bash
cd /Users/michaeldurante/ce-hub/edge-dev-platform
npm install
```

### **2. Required Dependencies**
```json
{
  "@copilotkit/react-core": "^1.10.6",
  "@copilotkit/react-ui": "^1.10.6",
  "react-plotly.js": "^2.6.0",
  "plotly.js": "^3.1.1",
  "@clerk/nextjs": "latest",
  "zustand": "^4.5.0",
  "@tanstack/react-query": "^5.90.3"
}
```

### **3. Environment Variables**
```bash
NEXT_PUBLIC_POLYGON_API_KEY=your_polygon_key
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=your_clerk_key
CLERK_SECRET_KEY=your_clerk_secret
NEXT_PUBLIC_BACKEND_URL=http://localhost:6500
```

## 📁 **Project Structure**

```
edge-dev-platform/
├── src/
│   ├── components/
│   │   ├── charts/
│   │   │   ├── EdgeChart.tsx           # Main chart component
│   │   │   ├── TimeframeSelector.tsx   # D/H/15m/5m buttons
│   │   │   └── ChartTemplates.ts       # Converted wzrd templates
│   │   ├── scanner/
│   │   │   ├── CodeUploadPanel.tsx     # Python code input
│   │   │   ├── ScanResultsTable.tsx    # Clickable ticker list
│   │   │   └── StatisticsPanel.tsx     # Metrics display
│   │   └── shared/
│   │       ├── Layout.tsx              # Main layout component
│   │       └── Navigation.tsx          # App navigation
│   ├── lib/
│   │   ├── api.ts                      # FastAPI integration
│   │   ├── chart-utils.ts              # Chart helper functions
│   │   └── types.ts                    # TypeScript definitions
│   └── app/
│       ├── page.tsx                    # Main dashboard page
│       └── layout.tsx                  # Root layout
├── package.json
├── next.config.js
└── tailwind.config.js
```

## 🔧 **API Integration**

### **Scan Execution Endpoint**
```typescript
// POST /api/edge/scan/run
interface ScanRequest {
  pythonCode: string;
  parameters?: Record<string, any>;
}

interface ScanResponse {
  results: ScanResult[];
  executionTime: number;
  status: 'success' | 'error';
  error?: string;
}
```

### **Chart Data Endpoint**
```typescript
// GET /api/edge/chart/{ticker}?timeframe=day
interface ChartResponse {
  ticker: string;
  timeframe: Timeframe;
  ohlcv: OHLCVData;
  indicators: IndicatorData;
}
```

## 🎨 **Branding Consistency**

### **Color Palette** (Matching Traderra)
- **Gold Primary**: `#FFD700` (VWAP, accents)
- **Dark Background**: `#000000` (charts)
- **Success Green**: `#00FF00` (bullish indicators)
- **Error Red**: `#FF0000` (bearish indicators)
- **Muted Gray**: `#808080` (secondary text)

### **Typography**
- **Font Family**: Inter (matching Traderra)
- **Code Font**: JetBrains Mono (for code editor)

## 🚀 **Development Workflow**

### **Phase 1: MVP Dashboard** (Week 1)
- [ ] Next.js project setup with Traderra theme
- [ ] EdgeChart component with chart templates
- [ ] Code upload and execution interface
- [ ] Basic scan results table with click-to-chart

### **Phase 2: Enhanced Features** (Week 2)
- [ ] Statistics panel with mini-charts
- [ ] Keyboard navigation between charts
- [ ] Save/load scan configurations
- [ ] Performance optimization

### **Phase 3: AI Integration** (Week 3)
- [ ] CopilotKit chat integration
- [ ] AI-assisted parameter building
- [ ] Natural language scan creation
- [ ] Performance analysis insights

### **Phase 4: Component Library** (Week 4)
- [ ] Drag-drop parameter builder
- [ ] Reusable indicator library
- [ ] Strategy template system
- [ ] Cross-project component sharing

## 🧪 **Testing Strategy**

### **Testing Framework**
- **Unit Tests**: Vitest for component testing
- **Integration Tests**: Testing chart data flow
- **E2E Tests**: Playwright for full user workflow
- **Performance Tests**: Chart rendering and API response times

### **Quality Gates**
- Code execution < 30 seconds
- Chart loading < 2 seconds
- UI responsiveness maintained
- No data loss during navigation

## 📈 **Success Metrics**

### **MVP Success Criteria**
- ✅ Partner productive in < 5 minutes
- ✅ Smooth chart navigation experience
- ✅ Visual validation of scan results
- ✅ Professional trading platform feel

### **Performance Targets**
- Scan execution: < 30 seconds
- Chart rendering: < 2 seconds per ticker
- Memory usage: < 1GB for 100+ results
- Zero crashes during normal operation

## 🔗 **Integration Points**

### **With Traderra**
- Shared authentication (Clerk)
- Shared backend API endpoints
- Cross-navigation between platforms
- Consistent component library

### **With Archon MCP**
- Knowledge graph integration
- AI agent coordination
- Strategy pattern storage
- Performance intelligence capture

## 📚 **Documentation**

- **API Documentation**: FastAPI auto-generated docs
- **Component Library**: Storybook integration
- **User Guide**: Interactive tutorial system
- **Developer Guide**: Architecture and patterns

---

**🎯 Ready for Conductor Development**: This specification provides everything needed to build Edge.dev in the Conductor environment with full access to existing CE-Hub infrastructure and agent coordination.