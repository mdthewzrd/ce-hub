# 🚀 Conductor Start Prompt for Edge.dev Development

**Copy and paste this exact message into your new Conductor Claude Code session:**

---

## Edge.dev Trading Platform Development

I need to build the Edge.dev trading platform using the complete setup that's been prepared in this repository. This is a React/Next.js dashboard that will complement Traderra, focusing on prospective trading analysis.

### 🎯 **Immediate Goal**
Create an MVP dashboard where my trading partner can upload Python scanning code and immediately see professional chart visualizations with click-to-chart navigation.

### 📁 **Everything is Ready**
All specifications, converted chart templates, and setup instructions are in:
- `edge-dev-platform/README.md` - Complete project overview
- `edge-dev-platform/CONDUCTOR_SETUP.md` - Step-by-step setup guide
- `edge-dev-platform/edge-chart-templates.tsx` - Converted wzrd-algo charts
- `edge-dev-platform/edge-mvp-dashboard-spec.md` - Detailed MVP requirements
- `EDGE_DEV_HANDOFF.md` - Complete handoff documentation

### 🤖 **Agent Coordination Required**
Use the ce-hub-orchestrator to coordinate this multi-phase development:

1. **Setup Phase**: Initialize Next.js project with Traderra theme consistency
2. **Chart Integration**: Implement the converted chart templates
3. **Dashboard Phase**: Build the 4-panel interface (upload, results, stats, charts)
4. **API Integration**: Connect to shared FastAPI backend for Python execution

### 🔧 **Technical Requirements**
- **Port 5656** for Edge.dev frontend
- **React/Next.js + TypeScript** with CopilotKit integration
- **Shadcn/ui components** matching Traderra's gold theme
- **React-Plotly.js** with converted wzrd-algo indicator templates
- **Shared backend** integration with Traderra (port 6500)

### ⚡ **Priority: Partner Productivity**
The trading partner has Python code ready and needs to see chart visualizations immediately. Focus on:
1. Code upload interface
2. Scan execution via API
3. Click-to-chart navigation
4. Professional appearance matching Traderra

### 📊 **Success Criteria**
- Partner uploads Python code → sees ticker results in < 5 minutes
- Clicks any ticker → sees chart with VWAP, EMAs, and indicators
- Navigation is smooth and professional
- Matches Traderra's visual quality and branding

**Please use the ce-hub-orchestrator to coordinate this development, starting with the setup phase and following the detailed specifications in the edge-dev-platform folder.**

---

**Copy this message exactly and start your Conductor session!**