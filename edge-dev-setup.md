# Edge.dev Parallel Development Setup

## 🎯 Project Overview
Edge.dev Trading Platform - React/AGUI companion to Traderra, inspired by Edge to Trade interface.

## 📁 Recommended Project Structure

```
/Users/michaeldurante/ce-hub/
├── edge-dev-platform/              # Main Edge.dev project
│   ├── frontend/                   # React/Next.js frontend (port 5656)
│   │   ├── src/
│   │   │   ├── components/
│   │   │   │   ├── charts/         # Chart components from wzrd templates
│   │   │   │   ├── scanner/        # Historical scanner interface
│   │   │   │   ├── execution/      # Execution testing dashboard
│   │   │   │   └── shared/         # Shared components with Traderra
│   │   │   ├── lib/
│   │   │   │   ├── chart-templates.ts  # Converted from wzrd-algo
│   │   │   │   └── api.ts          # FastAPI integration
│   │   │   └── app/
│   │   ├── package.json
│   │   └── next.config.js
│   ├── backend/                    # If needed, or use Traderra's backend
│   ├── docs/                       # Project documentation
│   └── README.md
└── traderra/                       # Existing Traderra project (unchanged)
```

## 🚀 Conductor Session Commands

### Start Edge.dev Development Session
```bash
cd /Users/michaeldurante/ce-hub
conductor start edge-dev
# This creates isolated Claude Code environment
```

### Continue Traderra Development
```bash
cd /Users/michaeldurante/ai\ dev/ce-hub/traderra
# Your existing session continues here
```

## 🔄 Development Workflow

1. **Morning**: Check both projects' status
2. **Context Switch**: Use Conductor to switch between environments
3. **Shared Resources**: Backend API (port 6500) serves both frontends
4. **Component Sharing**: Shared component library between projects

## 📡 Port Configuration

- **Traderra Frontend**: localhost:6565
- **Edge.dev Frontend**: localhost:5656
- **Shared Backend**: localhost:6500
- **Archon MCP**: localhost:8051

## 🎯 Integration Points

- Shared authentication (Clerk)
- Shared backend API
- Shared component library
- Shared chart templates (converted from wzrd-algo)
- Cross-project navigation links

## 🔧 Setup Commands

```bash
# Create Edge.dev project structure
cd /Users/michaeldurante/ce-hub
mkdir -p edge-dev-platform/{frontend,backend,docs}
cd edge-dev-platform/frontend

# Initialize Next.js project
npx create-next-app@latest . --typescript --tailwind --eslint --app --src-dir

# Install shared dependencies
npm install @copilotkit/react-core @copilotkit/react-ui
npm install recharts plotly.js react-plotly.js lightweight-charts
npm install @clerk/nextjs zustand @tanstack/react-query

# Copy chart templates from wzrd-algo
# Convert Python templates to TypeScript
```

## 🎨 Branding Consistency

- Use Traderra's shadcn/ui theme
- Match color palette and typography
- Maintain navigation patterns
- Share authentication UI components