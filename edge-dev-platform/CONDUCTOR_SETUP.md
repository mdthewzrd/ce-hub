# Edge.dev Conductor Setup Guide
**Complete setup for building Edge.dev in Conductor environment**

## 🎯 **Conductor Session Initialization**

### **1. Start Edge.dev Session**
```bash
cd /Users/michaeldurante/ce-hub
conductor start edge-dev-session
```

### **2. Verify CE-Hub Integration**
```bash
# Check Archon MCP connection
curl http://localhost:8051/health

# Verify agent definitions
ls .claude/agents/

# Confirm CLAUDE.md is updated
head CLAUDE.md
```

## 🏗️ **Project Structure Creation**

### **Directory Setup**
```bash
mkdir -p edge-dev-platform/{frontend,backend,docs}
cd edge-dev-platform/frontend

# Initialize Next.js with TypeScript
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir --import-alias "@/*"
```

### **Essential Dependencies**
```bash
# Core dependencies
npm install @copilotkit/react-core @copilotkit/react-ui
npm install react-plotly.js plotly.js
npm install @clerk/nextjs zustand @tanstack/react-query
npm install @radix-ui/react-* class-variance-authority clsx tailwind-merge
npm install lucide-react

# Development dependencies
npm install -D @types/plotly.js
npm install -D vitest @testing-library/react @testing-library/jest-dom
npm install -D playwright @playwright/test
```

## 📊 **Chart Templates Integration**

### **1. Copy Chart Templates**
```bash
# Copy from parent directory (created in this session)
cp ../../edge-chart-templates.tsx src/components/charts/EdgeChart.tsx
```

### **2. Create Supporting Files**
```typescript
// src/lib/types.ts
export interface ScanResult {
  ticker: string;
  scanDate: string;
  metrics: {
    gapPercent: number;
    volume: number;
    rMultiple: number;
    [key: string]: number;
  };
}

export interface ChartData {
  x: string[];
  open: number[];
  high: number[];
  low: number[];
  close: number[];
  volume: number[];
}

export type Timeframe = 'day' | 'hour' | '15min' | '5min';
```

### **3. API Integration Layer**
```typescript
// src/lib/api.ts
const API_BASE = process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:6500';

export async function runScan(pythonCode: string): Promise<ScanResult[]> {
  const response = await fetch(`${API_BASE}/api/edge/scan/run`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ pythonCode })
  });
  return response.json();
}

export async function getChartData(ticker: string, timeframe: Timeframe): Promise<ChartData> {
  const response = await fetch(`${API_BASE}/api/edge/chart/${ticker}?timeframe=${timeframe}`);
  return response.json();
}
```

## 🎨 **Traderra Theme Integration**

### **1. Copy Traderra Styling**
```bash
# Copy key style files from Traderra
cp ../traderra/frontend/src/app/globals.css src/app/
cp ../traderra/frontend/tailwind.config.ts ./
cp ../traderra/frontend/src/lib/utils.ts src/lib/
```

### **2. Shadcn/ui Components**
```bash
# Initialize shadcn/ui with Traderra config
npx shadcn-ui@latest init

# Add essential components
npx shadcn-ui@latest add button card table badge
npx shadcn-ui@latest add textarea select scroll-area
```

## 🧠 **Archon MCP Integration**

### **1. MCP Client Setup**
```typescript
// src/lib/archon.ts
interface ArchonClient {
  searchKnowledge: (query: string) => Promise<any>;
  createTask: (task: any) => Promise<any>;
  updateProject: (projectId: string, data: any) => Promise<any>;
}

export const archonClient: ArchonClient = {
  async searchKnowledge(query: string) {
    // Integration with Archon MCP
    return fetch('http://localhost:8051/rag/search', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query })
    }).then(r => r.json());
  },
  // ... other methods
};
```

### **2. Project Registration**
```bash
# Register Edge.dev project in Archon
curl -X POST http://localhost:8051/projects \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Edge.dev Trading Platform",
    "description": "React/AGUI companion to Traderra for prospective trading analysis",
    "github_repo": "https://github.com/mdthewzrd/ce-hub"
  }'
```

## 🤖 **Agent Coordination Setup**

### **1. Verify Agent Definitions**
```bash
# Check agent files are in place
ls .claude/agents/
# Should show: ce-hub-orchestrator.md, engineer-agent.md, gui-specialist.md, etc.
```

### **2. Agent Activation Test**
```typescript
// Test in Conductor Claude Code session:
// "Use the engineer-agent to implement the basic Next.js setup"
// Should automatically delegate to engineer-agent
```

## 🔧 **Development Environment**

### **1. Environment Variables**
```bash
# .env.local
NEXT_PUBLIC_POLYGON_API_KEY=4r6MZNWLy2ucmhVI7fY8MrvXfXTSmxpy
NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_... # Copy from Traderra
CLERK_SECRET_KEY=sk_test_... # Copy from Traderra
NEXT_PUBLIC_BACKEND_URL=http://localhost:6500
NEXT_PUBLIC_ARCHON_URL=http://localhost:8051
```

### **2. Package Scripts**
```json
{
  "scripts": {
    "dev": "next dev -p 5656",
    "build": "next build",
    "start": "next start -p 5656",
    "test": "vitest",
    "test:e2e": "playwright test"
  }
}
```

### **3. Next.js Configuration**
```javascript
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['plotly.js']
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      'plotly.js': 'plotly.js/dist/plotly.min.js'
    };
    return config;
  }
};

module.exports = nextConfig;
```

## 🚀 **Quick Start Commands**

### **Complete Setup Sequence**
```bash
# 1. Navigate to CE-Hub
cd /Users/michaeldurante/ce-hub

# 2. Start Conductor session
conductor start edge-dev-session

# 3. In new Claude Code session, verify setup:
# - Check Archon connection: mcp__archon__health_check
# - Verify agents available: ls .claude/agents/
# - Confirm project structure: ls edge-dev-platform/

# 4. Begin development with agent coordination:
# "Use ce-hub-orchestrator to coordinate building the Edge.dev MVP dashboard"
```

## ✅ **Validation Checklist**

### **Pre-Development Verification**
- [ ] Conductor session active with Claude Code
- [ ] Archon MCP responding on port 8051
- [ ] Agent definitions loaded in .claude/agents/
- [ ] CLAUDE.md updated with latest instructions
- [ ] Project structure created in edge-dev-platform/
- [ ] Chart templates converted and ready
- [ ] Traderra theme files accessible

### **Development Ready State**
- [ ] Next.js project initialized with TypeScript
- [ ] Essential dependencies installed
- [ ] Environment variables configured
- [ ] API integration layer prepared
- [ ] Archon client integration setup
- [ ] Agent coordination tested

### **MVP Development Path**
1. **Day 1**: Use gui-specialist to create dashboard layout
2. **Day 2**: Use engineer-agent to implement chart integration
3. **Day 3**: Use engineer-agent for Python code execution
4. **Day 4**: Use quality-assurance-tester for validation

## 🎯 **Success Criteria**

### **Conductor Session Success**
- ✅ All agents respond and coordinate properly
- ✅ Archon MCP integration functional
- ✅ Chart templates render correctly
- ✅ Traderra theme consistency maintained

### **MVP Readiness**
- ✅ Partner can upload Python code
- ✅ Charts render with indicators
- ✅ Navigation between tickers smooth
- ✅ Professional appearance matching Traderra

---

**🚀 Ready for Development**: Conductor environment configured with full CE-Hub capabilities, agent coordination, and Edge.dev project structure.