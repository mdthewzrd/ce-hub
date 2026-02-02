# CE-Hub Web App - Quick Start Guide

## Running the Web App

### Start the Development Server

```bash
cd web
npm run dev
```

The app will be available at: **http://localhost:8228**

### What's Included

#### Pages:
1. **Dashboard (`/`)** - Main overview with task stats and task list
2. **Task Detail (`/tasks/[id]`)** - Full PRP workflow view with phases
3. **Create Task (`/new`)** - 4-step wizard for creating new tasks
4. **Agent Monitor (`/monitor`)** - Real-time agent and workflow monitoring
5. **Code Editor (`/editor/[taskId]`)** - Monaco-based in-browser code editor

#### Features:
- ✅ Modern Linear.app-style UI with shadcn/ui
- ✅ Fully responsive (desktop, tablet, mobile)
- ✅ Real-time updates simulation
- ✅ Monaco Editor integration (VS Code's engine)
- ✅ Task workflow tracking (Plan → Research → Produce → Ingest)
- ✅ Agent monitoring with console output
- ✅ Archon knowledge search integration (mocked)
- ✅ In-browser code editing with file tree
- ✅ Mobile-optimized toolbar

### Current State

The web app is **fully functional with mock data**. All UI components are working:

- ✅ Dashboard displays tasks with filtering
- ✅ Task detail shows full PRP and workflow progress
- ✅ Create wizard guides through task creation
- ✅ Agent monitor shows real-time status
- ✅ Code editor works with Monaco

### Next Steps for Production

To connect to your actual CE-Hub backend:

1. **Create the backend API** (`core/scripts/api_bridge.py`):
   ```python
   # This should bridge to your existing orchestrator
   # - Expose task management endpoints
   # - Connect to Archon MCP at localhost:8051
   # - Handle workflow state management
   ```

2. **Update API URLs** in `.env.local`:
   ```
   NEXT_PUBLIC_API_URL=http://localhost:8229
   NEXT_PUBLIC_ARCHON_URL=http://localhost:8051
   ```

3. **Replace mock data** in API routes with real data from:
   - Archon knowledge graph
   - Orchestrator state
   - Agent status from CE-Hub

### Architecture

```
Web App (8228) ←→ Backend API (8229) ←→ Orchestrator ←→ Archon (8051)
```

### Testing the App

1. Open http://localhost:8228
2. Click "New Task" to create a task
3. View the task detail to see PRP workflow
4. Check /monitor for agent status
5. Try /editor/1 for the code editor

### Keyboard Shortcuts (in Editor)

- `Cmd/Ctrl + S` - Save
- `Cmd/Ctrl + /` - Toggle comment
- Standard VS Code shortcuts work in Monaco

### Mobile Usage

Open on your phone using the Network URL:
- http://192.168.1.218:8228 (or your local IP)

The mobile toolbar provides:
- Run, Save, Commit buttons
- Touch-optimized file tree
- Responsive Monaco editor

### Stopping the Server

Press `Ctrl + C` in the terminal or:
```bash
pkill -f "next dev"
```

### Build for Production

```bash
cd web
npm run build
npm start
```

This will run on port 8228 in production mode.

---

**The web app is ready to use!** All UI components are working with simulated data. Connect it to your backend API for full functionality.
