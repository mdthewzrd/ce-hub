# Edge.dev MVP Dashboard Specification
**Goal**: Get your trading partner productive TODAY with Python code visualization

## 🎯 **MVP Requirements (Phase 1)**

### **Core User Flow**
1. **Upload Python Code**: Partner pastes/uploads Python scanning code
2. **Instant Results**: Code runs, produces ticker list with data
3. **Easy Chart View**: Click any ticker → see chart with indicators
4. **Quick Navigation**: Rapidly flip through charts to validate results

### **Dashboard Layout** (Edge to Trade inspired)
```
┌─────────────────────────────────────────────────────────────┐
│ Edge.dev - Historical Scanner                    [Upload Code] │
├─────────────────────────────────────────────────────────────┤
│ 📊 Active Scan: "Day 2 Gap Analysis"               [▶ Run] │
│ Filters: [Date: 2025-01-01→2025-10-24] [Gap%: >=30] [Vol: >=10M] │
├─────────────────────────────┬───────────────────────────────┤
│                            │                               │
│  SCAN RESULTS              │      STATISTICS               │
│                            │                               │
│  ┌─────────────────────┐    │  📈 Total Results: 47        │
│  │ ☑ BYND   53.5%  8.6R│    │  📊 Avg Gap: 34.2%          │
│  │   WOLF   699.7% 814 │    │  💰 Avg Volume: 2.1M        │
│  │   HOUR   288.8% 234 │    │                              │
│  │   THAR   199.5% 283 │    │  [Gap % Distribution Chart]  │
│  │ → ATNF   382.1% 431 │    │                              │
│  │   ETHZ   392.1% 431 │    │  [Volume Distribution]       │
│  │   ...              │    │                              │
│  └─────────────────────┘    │  Top Gappers:                │
│                            │  • WOLF: 699.7%              │
│                            │  • HOUR: 288.8%              │
│                            │  • THAR: 199.5%              │
│                            │                               │
├─────────────────────────────┴───────────────────────────────┤
│                                                             │
│                    📈 CHART AREA                           │
│                                                             │
│  ┌─────────────────────────────────────────────────────────┐ │
│  │ ATNF - Daily Chart with 9/20 EMA Cloud        [D][H][15m]│ │
│  │                                                         │ │
│  │     📈 [Candlestick chart with indicators]             │ │
│  │                                                         │ │
│  │     [Volume bars at bottom]                             │ │
│  │                                                         │ │
│  └─────────────────────────────────────────────────────────┘ │
│                                                             │
└─────────────────────────────────────────────────────────────┘
```

## 🔧 **Technical Implementation**

### **Frontend Stack**
- **Next.js 14** + React 18 + TypeScript
- **Shadcn/ui** components (matching Traderra gold theme)
- **React-Plotly.js** with your chart templates
- **TailwindCSS** for styling consistency

### **Backend Integration**
- **FastAPI endpoint**: `/api/edge/scan/run`
- **Python code execution**: Sandboxed execution environment
- **Polygon.io integration**: Reuse Traderra's API setup
- **Data flow**: Python → JSON results → React display

### **Data Structure**
```typescript
interface ScanResult {
  ticker: string;
  scanDate: string;
  metrics: {
    gapPercent: number;
    volume: number;
    rMultiple: number;
    [key: string]: number; // Flexible for custom metrics
  };
  chartData?: ChartData; // Loaded on demand
}

interface ChartData {
  timeframe: 'day' | 'hour' | '15min' | '5min';
  ohlcv: {
    timestamps: string[];
    open: number[];
    high: number[];
    low: number[];
    close: number[];
    volume: number[];
  };
  indicators: {
    vwap?: number[];
    ema9?: number[];
    ema20?: number[];
    // ... your indicator suite
  };
}
```

## ⚡ **MVP Features (Week 1)**

### **Essential Features**
- ✅ **Code Upload Interface**: Textarea + file upload for Python code
- ✅ **One-Click Execution**: Run button executes code via FastAPI
- ✅ **Results Table**: Sortable, clickable ticker list with metrics
- ✅ **Chart Viewer**: Your chart templates converted to React
- ✅ **Timeframe Switching**: D/H/15m/5m buttons
- ✅ **Keyboard Navigation**: Arrow keys to flip between charts

### **Nice-to-Have (Week 2)**
- 📊 **Statistics Panel**: Real-time metrics and distributions
- 💾 **Save Scans**: Store successful scan configurations
- 🔍 **Filter Bar**: Visual display of active scan parameters
- ⚡ **Performance**: Cached chart data for fast navigation

## 🎨 **UI Components Needed**

### **Primary Components**
1. **CodeUploadPanel**: Python code input with syntax highlighting
2. **ScanResultsTable**: Clickable ticker list with sortable columns
3. **EdgeChart**: Your chart templates as React component
4. **StatisticsPanel**: Metrics display and mini-charts
5. **TimeframeSelector**: D/H/15m/5m switching buttons

### **Styling Requirements**
- **Traderra Gold Theme**: Consistent with existing branding
- **Dark Mode**: Professional trading platform appearance
- **Responsive**: Works on different screen sizes
- **Clean Typography**: Easy to read numbers and tickers

## 🚀 **Implementation Priority**

### **Day 1: Core Framework**
- Next.js project setup with Traderra theme
- Basic layout with 4-panel design
- Code upload interface

### **Day 2: Chart Integration**
- Convert your chart templates to React
- Implement EdgeChart component
- Add timeframe switching

### **Day 3: Scan Execution**
- FastAPI endpoint for Python code execution
- Results table with click-to-chart
- Basic navigation between tickers

### **Day 4: Polish & Testing**
- Statistics panel
- Performance optimization
- Testing with your partner's actual code

## 📝 **Partner Integration Guide**

### **Python Code Format Expected**
```python
# Your partner's code should return this format:
def scan_function():
    results = []
    for ticker in tickers:
        # ... scanning logic ...
        results.append({
            'ticker': ticker,
            'scanDate': '2025-10-24',
            'metrics': {
                'gapPercent': 45.2,
                'volume': 1500000,
                'rMultiple': 2.1,
                # ... custom metrics
            }
        })
    return results
```

### **Upload Options**
1. **Paste Code**: Direct code input in dashboard
2. **File Upload**: Upload .py files
3. **Git Integration**: Pull from repository (future)

### **Execution Environment**
- Sandboxed Python execution
- Polygon.io API access
- Common libraries pre-installed (pandas, numpy, ta)
- Security restrictions to prevent system access

## 🎯 **Success Metrics**

### **MVP Success**
- ✅ Partner can upload code and see results in < 5 minutes
- ✅ Chart navigation is smooth and intuitive
- ✅ Visual validation of scan results is easy
- ✅ Performance is acceptable for 50+ results

### **Quality Gates**
- Code execution completes in < 30 seconds
- Chart loading is < 2 seconds per ticker
- UI is responsive and professional
- No crashes or data loss during normal use

This MVP gets your partner immediately productive while setting the foundation for the full Edge.dev platform!