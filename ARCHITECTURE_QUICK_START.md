# Web AI Platform - Architecture Quick Start

## TL;DR - What You Need to Know

### The Vision
Build a web platform that beats Cursor by providing:
- **Better UI**: Visual project management, workflow graphics, modern design
- **Universal Access**: Works on mobile AND desktop
- **AI-Native**: Claude/AI chat, AG-UI/CopilotKit orchestration
- **Parallel Work**: Multiple projects running simultaneously
- **Complete Workflow**: Building → Editing → Fixing → Testing → Validation

---

## The Stack (Why These Choices?)

### Frontend
- **Next.js 15 + React 19**: 40% faster, Server Components, zero-config deployment
- **shadcn/ui**: Modern components, no bloat, fully customizable
- **Zustand**: Simple state management, 40% faster implementation
- **Monaco + CodeMirror**: Desktop IDE features + mobile support
- **React Flow**: Visual workflow builder
- **Yjs**: Collaborative editing (CRDTs)

### Backend
- **Next.js API Routes**: Fast, serverless, deploy with frontend
- **FastAPI (Python)**: AI/ML operations, heavy computation
- **Claude API**: Best AI model for coding
- **Vercel AI SDK**: Streaming responses made easy

### Data & Storage
- **PostgreSQL + pgvector**: Relational data + vector search (no separate DB!)
- **Prisma ORM**: Type-safe database access
- **Redis (Upstash)**: Sessions, rate limiting, caching
- **S3/Cloudflare R2**: File storage, zero egress fees

### Deployment
- **Vercel**: Next.js hosting, Edge Network, best DX
- **Railway**: Python backend, easy deployment
- **Docker**: Secure code execution sandbox

### Monitoring
- **Sentry**: Error tracking, performance monitoring
- **Vercel Analytics**: Web Vitals, page views
- **PostHog**: User analytics, session recordings

---

## System Architecture (Visual)

```
┌─────────────────────────────────────────────────┐
│  Desktop/Mobile/PWA (Next.js 15)               │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Edge Layer (Vercel CDN + Cloudflare R2)       │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  API Layer (Next.js API + FastAPI)             │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Services (Claude, GitHub, Docker, Yjs)         │
└─────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────┐
│  Data (PostgreSQL, Redis, S3/R2)               │
└─────────────────────────────────────────────────┘
```

---

## Key Features & Implementation

### 1. Claude/AI Chat Interface

**Tech**: Vercel AI SDK + Claude API + Streaming

```typescript
// Stream Claude responses token-by-token
import { streamText } from 'ai';

const result = streamText({
  model: anthropic('claude-3-5-sonnet-20241022'),
  messages,
});

return result.toDataStreamResponse();
```

**Benefits**:
- Fast: <100ms to first token
- User experience: See responses in real-time
- Cost-effective: Only pay for tokens used

### 2. Visual Project Management

**Tech**: React Flow + shadcn/ui + Zustand

```typescript
// Build visual workflow graphs
<ReactFlow
  nodes={workflowNodes}
  edges={workflowEdges}
  onNodesChange={onNodesChange}
  onEdgesChange={onEdgesChange}
>
  <Background />
  <Controls />
  <MiniMap />
</ReactFlow>
```

**Benefits**:
- Visual: See entire project at a glance
- Interactive: Drag-and-drop workflow building
- Real-time: Live updates as code executes

### 3. Parallel Project Working

**Tech**: Zustand + Jotai + WebSocket

```typescript
// Multi-project state management
const useProjectStore = create((set) => ({
  projects: [],
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),
}));

// Real-time collaboration
socket.on('project-update', (update) => {
  // Update project in real-time
});
```

**Benefits**:
- Productivity: Work on multiple projects simultaneously
- Context isolation: Each project has its own state
- Real-time: See changes from collaborators instantly

### 4. AG-UI + CopilotKit Integration

**Tech**: AG-UI protocol + CopilotKit React framework

```typescript
// AG-UI: Event-based agent communication
aguiClient.send({
  type: 'user:message',
  text: 'Fix this bug',
});

aguiClient.on('agent:speak', (data) => {
  console.log('Agent says:', data.text);
});

// CopilotKit: React-specific AI integration
const { appendMessage, messages } = useCopilotChat();

await appendMessage({
  role: 'user',
  content: 'Refactor this function',
});
```

**Benefits**:
- Orchestration: Coordinate multiple AI agents
- UI Control: AI can manipulate UI elements
- Context: Agents have access to application state

### 5. Code Execution

**Tech**: Docker + WebContainer API

```python
# Docker: Secure sandboxed execution
container = client.containers.create(
    image='python:latest',
    command=f'python -c "{code}"',
    mem_limit='256m',
    cpu_quota=50000,
)
```

```typescript
// WebContainer: Browser-based execution (JS/TS only)
const webcontainer = await WebContainer.boot();
await webcontainer.fs.writeFile('/index.js', code);
const run = await webcontainer.spawn('node', ['index.js']);
```

**Benefits**:
- Secure: Sandboxed execution, resource limits
- Fast: Sub-90ms sandbox creation
- Flexible: Support multiple languages

---

## MVP Roadmap (12-16 Weeks)

### Phase 1: Foundation (Weeks 1-4)
✅ Project setup + Next.js 15
✅ Authentication (NextAuth.js)
✅ Project management (CRUD)
✅ Code editor (Monaco + CodeMirror)
✅ Basic AI chat (Claude API)

### Phase 2: Core Features (Weeks 5-12)
✅ AG-UI integration
✅ CopilotKit integration
✅ Workflow visualization (React Flow)
✅ Real-time collaboration (Yjs)
✅ Code execution (Docker)

### Phase 3: Advanced Features (Weeks 13-16)
✅ Mobile optimization (PWA)
✅ Testing & quality assurance
✅ Performance optimization
✅ Launch preparation

---

## Cost Estimates

### Infrastructure (Monthly)
- Vercel (Pro): $20
- Railway (Hobby): $5
- PostgreSQL (Basic): $20
- Redis (Free tier): $0
- Cloudflare R2: ~$5
- Sentry (Free): $0
- **Total**: ~$50/month

### AI API Costs
- Claude 3.5 Sonnet: $3/M input, $15/M output
- Example: 100K tokens/month = ~$1.50
- Heavy user: 1M tokens/month = ~$15

### Optimization Strategies
1. Cache AI responses (reduce API calls by 50%)
2. Use efficient prompts (reduce token usage by 30%)
3. Implement usage limits (prevent abuse)
4. Tiered pricing (free tier + paid tiers)

---

## Performance Targets

| Metric | Target | Why It Matters |
|--------|--------|----------------|
| First Contentful Paint | <1.5s | User perceives fast load |
| Largest Contentful Paint | <2.5s | Main content loads quickly |
| First Input Delay | <100ms | Responsive interactions |
| Time to Interactive | <3.5s | User can interact quickly |
| AI Response (first token) | <100ms | Fast AI responses |
| Code Execution | <10s | Quick feedback loop |

---

## Security Checklist

### Must-Have
✅ HTTPS everywhere
✅ CSRF protection
✅ XSS protection
✅ SQL injection prevention (Prisma)
✅ Rate limiting (Redis)
✅ Input validation (Zod)
✅ Secrets in environment variables
✅ Code execution sandboxed (Docker)
✅ Security headers configured

### Nice-to-Have
✅ Content Security Policy (CSP)
✅ HSTS (HTTP Strict Transport Security)
✅ Dependency scanning
✅ Penetration testing
✅ Bug bounty program

---

## Getting Started

### 1. Prerequisites
```bash
# Install Node.js 20+
node --version  # v20.x.x

# Install Python 3.11+
python --version  # 3.11.x

# Install Docker
docker --version  # 24.x.x

# Install psql (PostgreSQL client)
psql --version  # 16.x
```

### 2. Clone & Install
```bash
# Clone repository
git clone https://github.com/your-org/web-ai-platform.git
cd web-ai-platform

# Install frontend dependencies
npm install

# Install backend dependencies
cd backend
pip install -r requirements.txt
```

### 3. Configure Environment
```bash
# Copy environment template
cp .env.example .env.local

# Edit with your values
nano .env.local
```

Required variables:
```env
DATABASE_URL="postgresql://..."
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_SECRET="your-secret"
GITHUB_CLIENT_ID="your-github-id"
GITHUB_CLIENT_SECRET="your-github-secret"
```

### 4. Setup Database
```bash
# Generate Prisma client
npx prisma generate

# Push schema to database
npx prisma db push

# Seed database (optional)
npx prisma db seed
```

### 5. Run Development Server
```bash
# Frontend (Next.js)
npm run dev

# Backend (FastAPI) - in separate terminal
cd backend
uvicorn app.main:app --reload
```

Visit: http://localhost:3000

---

## Common Tasks

### Add a New API Route
```typescript
// app/api/your-endpoint/route.ts
import { NextRequest, NextResponse } from 'next/server';

export async function GET(req: NextRequest) {
  return NextResponse.json({ message: 'Hello' });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  return NextResponse.json({ received: body });
}
```

### Add a New Database Model
```prisma
// prisma/schema.prisma
model YourModel {
  id        String   @id @default(cuid())
  name      String
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt
}
```

Then run:
```bash
npx prisma db push
```

### Add a New Page
```typescript
// app/your-page/page.tsx
export default function YourPage() {
  return (
    <div>
      <h1>Your Page</h1>
    </div>
  );
}
```

### Deploy to Vercel
```bash
# Install Vercel CLI
npm i -g vercel

# Login
vercel login

# Deploy
vercel --prod
```

---

## Troubleshooting

### Issue: Database Connection Failed
**Solution**: Check DATABASE_URL in .env.local
```bash
echo $DATABASE_URL
```

### Issue: AI API Rate Limited
**Solution**: Implement caching or upgrade API tier
```typescript
// Add cache
const cached = await redis.get(`ai:${promptHash}`);
if (cached) return cached;
```

### Issue: Docker Code Execution Timeout
**Solution**: Increase timeout or optimize code
```python
container = client.containers.create(
    ...,
    mem_limit='512m',  # Increase memory
)
```

### Issue: WebSocket Connection Drops
**Solution**: Implement reconnection logic
```typescript
socket.on('disconnect', () => {
  setTimeout(() => socket.connect(), 1000);
});
```

---

## Resources

### Documentation
- [Full Architecture Document](./WEB_AI_DEV_PLATFORM_ARCHITECTURE.md)
- [Next.js 15 Docs](https://nextjs.org/docs)
- [Prisma Docs](https://www.prisma.io/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [Vercel AI SDK](https://sdk.vercel.ai)

### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma Discord](https://discord.gg/prisma)
- [FastAPI Discord](https://discord.gg/fastapi)

---

## Next Steps

1. **Review the full architecture document** (WEB_AI_DEV_PLATFORM_ARCHITECTURE.md)
2. **Set up your development environment**
3. **Clone the starter template** (when available)
4. **Join the community** (Discord/Slack)
5. **Start building!** (Follow MVP roadmap)

---

**Questions?** Check the [full architecture document](./WEB_AI_DEV_PLATFORM_ARCHITECTURE.md) or open an issue on GitHub.

**Ready to build?** Let's make the best AI development platform! 🚀
