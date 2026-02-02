# RENATA V2 + CopilotKit Integration Guide

## 🎯 What You're Getting

Integration of **RENATA V2 Orchestrator** (Python backend with 13 tools) into your existing Edge Dev frontend at:
- `/scan` - Scanner generation and validation
- `/backtest` - Backtesting and analysis
- `/plan` - Strategy planning and implementation

---

## ✅ Prerequisites Check

### Backend (RENATA V2 Orchestrator)
✅ Already running on `http://localhost:5666`

### Frontend (Edge Dev)
✅ CopilotKit already installed
✅ Pages exist at `/scan`, `/backtest`, `/plan`

---

## 🔧 Integration Steps

### Step 1: Update the API Route

Replace or update `/api/renata/chat` to call the Python orchestrator:

**File**: `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/api/renata/chat/route.ts`

**What to do**:
1. Backup existing route
2. Replace with new orchestrator route
3. Or create new route `/api/renata/chat-orchestrator`

### Step 2: Add Chat Component to Pages

Add the `RenataOrchestratorChat` component to each page:

#### `/scan/page.tsx`:
```tsx
import { RenataOrchestratorChat } from '@/components/renata/RenataOrchestratorChat';

// In your page component:
<RenataOrchestratorChat
  mode="scan"
  scannerCode={scannerCode}
  scanResults={scanResults}
/>
```

#### `/backtest/page.tsx`:
```tsx
import { RenataOrchestratorChat } from '@/components/renata/RenataOrchestratorChat';

<RenataOrchestratorChat
  mode="backtest"
  scannerCode={scannerCode}
  backtestResults={backtestResults}
/>
```

#### `/plan/page.tsx`:
```tsx
import { RenataOrchestratorChat } from '@/components/renata/RenataOrchestratorChat';

<RenataOrchestratorChat
  mode="plan"
  currentPlan={implementationPlan}
/>
```

### Step 3: Wrap with CopilotKit Provider

Make sure your root layout has the CopilotKit provider:

**File**: `/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main/src/app/layout.tsx`

```tsx
import { CopilotKit } from '@copilotkit/react-core';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        <CopilotKit runtimeUrl="/api/copilotkit">
          {children}
        </CopilotKit>
      </body>
    </html>
  );
}
```

---

## 🚀 Quick Start Commands

### 1. Start Backend (if not running)
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main-v2/backend"
python orchestrator_server.py --port 5666
```

### 2. Start Frontend
```bash
cd "/Users/michaeldurante/ai dev/ce-hub/projects/edge-dev-main"
npm run dev
```

### 3. Open Browser
Go to: `http://localhost:5665` (or whatever port your frontend uses)

Navigate to:
- `http://localhost:5665/scan`
- `http://localhost:5665/backtest`
- `http://localhost:5665/plan`

---

## 💬 Example Interactions

### In /scan page:
- "Generate a D2 momentum scanner with gap confirmation"
- "Validate this V31 scanner code"
- "Optimize gap percent from 1.5 to 3.0"
- "What parameters should I use for Backside B?"

### In /backtest page:
- "Run quick backtest on last 30 days"
- "Analyze backtest results and metrics"
- "Generate backtest script for this scanner"
- "What's the Sharpe ratio of this strategy?"

### In /plan page:
- "Create implementation plan for momentum strategy"
- "Generate step-by-step roadmap for D2 trading"
- "What indicators should I use for trend following?"
- "Plan complete Backside B trading system"

---

## 🎨 Customization

### Change Chat Suggestions

Edit the suggestions in `RenataOrchestratorChat.tsx`:

```tsx
// Find this section and customize:
{mode === 'scan' && (
  <>
    <button onClick={() => appendMessage({ role: 'user', content: 'YOUR CUSTOM SUGGESTION' })}>
      Your custom suggestion
    </button>
  </>
)}
```

### Add More Tools

The orchestrator has 13 tools available. Add them to suggestions:

1. V31 Scanner Generator
2. V31 Validator
3. Indicator Calculator
4. Market Structure Analyzer
5. Daily Context Detector
6. A+ Analyzer
7. Quick Backtester
8. Parameter Optimizer
9. Sensitivity Analyzer
10. Backtest Generator
11. Backtest Analyzer
12. Build Plan Generator
13. Scanner Executor

---

## 🧪 Testing

### Test Backend Connection:
```bash
curl -X POST http://localhost:5666/api/renata/chat \
  -H 'Content-Type: application/json' \
  -d '{"message": "Generate a D2 scanner"}'
```

### Test Frontend Connection:
Open browser DevTools (F12) → Network tab
Look for requests to `/api/renata/chat`
Should see: `tools_used`, `execution_time`, `intent`

---

## 📊 What You'll See

### Chat Response Format:
```json
{
  "success": true,
  "message": "✅ Scanner Generated Successfully!...",
  "tools_used": ["V31 Scanner Generator", "V31 Validator"],
  "execution_time": 0.0023,
  "intent": {
    "type": "GENERATE_SCANNER",
    "details": {...}
  }
}
```

### UI Features:
- ✅ Beautiful gradient dark theme
- ✅ Message bubbles with timestamps
- ✅ Typing indicators
- ✅ Quick action buttons
- ✅ Mode-specific suggestions
- ✅ Tool usage display
- ✅ Execution time metrics

---

## 🔧 Troubleshooting

### Backend not responding:
```bash
# Check if orchestrator is running
curl http://localhost:5666/health

# Should return:
{"status": "healthy", "service": "RENATA V2 Orchestrator", ...}
```

### Frontend connection errors:
1. Check browser console for CORS errors
2. Verify backend is on port 5666
3. Check network tab in DevTools
4. Look for 404/500 errors

### CopilotKit not working:
1. Verify runtimeUrl in CopilotKit provider
2. Check /api/copilotkit route exists
3. Ensure CopilotKit packages are installed

---

## 📁 Files Created

1. **`/api/renata/chat-orchestrator-route.ts`** - New API route calling Python backend
2. **`/components/renata/RenataOrchestratorChat.tsx`** - Chat component with CopilotKit
3. **This guide** - Complete integration documentation

---

## 🎓 Next Steps

1. **Test the integration** - Try each page (/scan, /backtest, /plan)
2. **Customize the UI** - Adjust colors, layout, suggestions
3. **Add more features** - File upload, code editor integration
4. **Deploy** - Push to production when ready

---

## 🚀 You're Ready!

Your Edge Dev platform now has **AI-powered trading assistance** through:
- ✅ 13 coordinated tools
- ✅ Natural language understanding
- ✅ Multi-step workflows
- ✅ Beautiful chat interface
- ✅ Lightning fast responses (<10ms)

**Enjoy!** 🎉
