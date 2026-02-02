# CE-Hub Web App

A modern web application for managing AI development workflows with visual tracking, real-time monitoring, and integrated code editing.

## Features

- **Dashboard**: Track all your AI development tasks at a glance
- **Task Management**: Create, view, and manage tasks with PRP (Problem-Requirements-Plan) workflow
- **Real-time Monitoring**: Watch agents work in real-time with live console output
- **In-Browser Code Editor**: Full VS Code experience with Monaco Editor
- **Mobile Ready**: Work from anywhere with responsive design
- **Archon Integration**: Leverage your knowledge graph for pattern reuse

## Tech Stack

- **Frontend**: Next.js 14 with App Router
- **UI**: shadcn/ui + Tailwind CSS
- **State**: Zustand
- **Code Editor**: Monaco Editor (VS Code's engine)
- **TypeScript**: Full type safety

## Getting Started

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

1. Install dependencies:
```bash
cd web
npm install
```

2. Set up environment variables:
```bash
cp .env.local.example .env.local
```

3. Run the development server:
```bash
npm run dev
```

4. Open your browser to `http://localhost:8228`

## Project Structure

```
web/
├── app/                      # Next.js app directory
│   ├── page.tsx             # Dashboard (home)
│   ├── tasks/               # Task management
│   │   ├── page.tsx         # Task list
│   │   └── [id]/            # Task detail
│   │       └── page.tsx
│   ├── new/                 # Create task wizard
│   │   └── page.tsx
│   ├── editor/              # In-browser code editor
│   │   └── [taskId]/
│   │       └── page.tsx
│   ├── monitor/             # Agent monitor
│   │   └── page.tsx
│   ├── api/                 # API routes
│   │   ├── tasks/
│   │   ├── workflows/
│   │   ├── agents/
│   │   └── knowledge/
│   ├── layout.tsx           # Root layout
│   ├── globals.css          # Global styles
│   └── page.tsx             # Dashboard page
├── components/
│   ├── ui/                  # shadcn/ui components
│   └── editor/              # Editor components
│       ├── monaco-editor.tsx
│       ├── file-tree.tsx
│       ├── terminal-panel.tsx
│       └── mobile-toolbar.tsx
├── lib/
│   ├── utils.ts             # Utility functions
│   ├── state.ts             # Zustand stores
│   └── api.ts               # API client
└── public/                  # Static assets
```

## Pages

### Dashboard (`/`)
- View all tasks with status and progress
- Quick stats on active/in-progress/completed tasks
- Navigate to task details, create new tasks, or monitor agents

### Task Detail (`/tasks/[id]`)
- Full PRP overview (Problem, Requirements, Plan)
- Workflow progress through all 4 phases
- Real-time console output
- Similar tasks from Archon
- Workflow controls (pause, advance, view logs)

### Create Task Wizard (`/new`)
- 4-step guided flow
- Archon search for similar tasks
- Pattern selection for reuse
- Workflow configuration

### Agent Monitor (`/monitor`)
- Real-time agent status
- Active workflow tracking
- Live console output
- Auto-refresh capability

### Code Editor (`/editor/[taskId]`)
- Monaco Editor (VS Code's engine)
- File tree navigation
- Multi-tab editing
- Integrated terminal
- Mobile-optimized controls

## API Routes

All API routes proxy to the backend at `localhost:8229`:

- `GET/POST /api/tasks` - List/create tasks
- `GET/PUT/DELETE /api/tasks/[id]` - Task details
- `POST /api/workflows/start` - Start workflow
- `POST /api/workflows/[id]/advance` - Advance phase
- `POST /api/workflows/[id]/pause` - Pause workflow
- `GET /api/workflows/[id]/status` - Get status
- `GET /api/agents/status` - Agent pool status
- `POST /api/agents/dispatch` - Manual dispatch
- `GET /api/knowledge/search` - Search Archon
- `POST /api/knowledge/ingest` - Ingest patterns

## Development

### Run on custom port
```bash
npm run dev  # Runs on port 8228
```

### Build for production
```bash
npm run build
npm start
```

### Lint code
```bash
npm run lint
```

## Backend Integration

The web app expects a backend API running on port 8229. In production:

1. Implement the API routes in `core/scripts/api_bridge.py`
2. Connect to Archon MCP at `localhost:8051`
3. Use orchestrator.py for workflow management

## Mobile Support

The app is fully responsive and works on:
- Desktop browsers (full feature set)
- Tablets (optimized layout)
- Mobile phones (touch-optimized controls)

## Future Enhancements

- [ ] Real WebSocket connections for live updates
- [ ] Git integration in the editor
- [ ] Dark mode toggle
- [ ] User authentication
- [ ] Team collaboration features
- [ ] Custom workflow templates
- [ ] Advanced analytics and reporting

## License

MIT
