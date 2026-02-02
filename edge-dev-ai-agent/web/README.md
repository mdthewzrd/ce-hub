# EdgeDev AI Agent - Web UI

Modern React/Next.js web interface for the EdgeDev AI Agent system.

## Features

- **Real-time Chat** - Interactive chat interface with the AI agent
- **Pattern Dashboard** - View top performing patterns and recommendations
- **Project Management** - Browse and manage trading strategy projects
- **Memory Search** - Search through past conversations and learnings
- **Activity Log** - View recent workflows and system activity
- **Settings** - System status and configuration

## Tech Stack

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type-safe development
- **Tailwind CSS** - Utility-first styling
- **SWR** - Data fetching and caching
- **Lucide Icons** - Beautiful icon set
- **Recharts** - Data visualization (future)

## Installation

```bash
cd web
npm install
```

## Development

```bash
npm run dev
```

The web UI will be available at http://localhost:7446

## Build for Production

```bash
npm run build
npm start
```

## API Integration

The web UI proxies API requests to the backend server (http://localhost:7447) through Next.js rewrites configured in `next.config.js`.

## Pages

- `/` - Chat interface
- `/patterns` - Pattern performance dashboard
- `/projects` - Project management
- `/memory` - Memory search
- `/activity` - Activity log
- `/settings` - System settings

## Component Structure

```
web/
├── app/              # Next.js App Router pages
│   ├── page.tsx      # Main chat page
│   ├── patterns/     # Patterns page
│   ├── projects/     # Projects page
│   ├── memory/       # Memory search page
│   ├── activity/     # Activity log page
│   └── settings/     # Settings page
├── components/       # Reusable components (future)
├── lib/              # Utilities and API client
│   ├── api.ts        # API client functions
│   └── hooks.ts      # SWR hooks
└── styles/           # Global styles and CSS
```

## Environment Variables

Create a `.env.local` file:

```bash
NEXT_PUBLIC_API_URL=http://localhost:7447
```

## Future Enhancements

- [ ] Real-time WebSocket updates
- [ ] Charts and visualizations
- [ ] Dark/light mode toggle
- [ ] Project creation wizard
- [ ] Code editor integration
- [ ] Backtest results visualization
- [ ] Parameter tuning interface
