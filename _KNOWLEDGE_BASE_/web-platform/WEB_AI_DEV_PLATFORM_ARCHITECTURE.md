# Web-Based AI Development Platform - Complete Architecture Document

**Version:** 1.0
**Date:** January 11, 2026
**Status:** Foundation Architecture

---

## Executive Summary

This document provides a comprehensive, actionable architecture for building a web-based AI development platform that rivals and exceeds Cursor's capabilities. The platform enables Claude/AI chat interfaces from mobile or desktop, superior visual project management, parallel project workflows, AG-UI/CopilotKit orchestration, and support for all development workflows (building, editing, fixing, testing, validation).

### Vision Statement

Build a modern, mobile-first, AI-native development platform that provides:
- **Universal Access**: Seamless experience across mobile and desktop devices
- **Visual Excellence**: Superior UI with visual project management and workflow graphics
- **Parallel Productivity**: Multi-project workspace with context isolation
- **Intelligent Orchestration**: AG-UI and CopilotKit integration for agent coordination
- **Complete Workflow Support**: Building, editing, fixing, testing, and validation in one platform

---

## Table of Contents

1. [Recommended Technology Stack](#1-recommended-technology-stack)
2. [System Architecture](#2-system-architecture)
3. [Frontend Architecture](#3-frontend-architecture)
4. [Backend Architecture](#4-backend-architecture)
5. [Database & Storage Strategy](#5-database--storage-strategy)
6. [AG-UI & CopilotKit Integration](#6-ag-ui--copilotkit-integration)
7. [Real-Time Features](#7-real-time-features)
8. [Code Execution Environment](#8-code-execution-environment)
9. [Mobile-First Design](#9-mobile-first-design)
10. [Authentication & Security](#10-authentication--security)
11. [Deployment Architecture](#11-deployment-architecture)
12. [Monitoring & Observability](#12-monitoring--observability)
13. [Performance Optimization](#13-performance-optimization)
14. [Cost Management](#14-cost-management)
15. [MVP Roadmap](#15-mvp-roadmap)
16. [Risk Analysis](#16-risk-analysis)
17. [Implementation Checklist](#17-implementation-checklist)

---

## 1. Recommended Technology Stack

### 1.1 Frontend Stack

#### Core Framework
**Next.js 15.3+ with React 19**
- **Justification**:
  - 40% performance improvement over previous versions
  - Native Server Components reduce client-side JavaScript
  - Built-in API routes eliminate need for separate backend
  - Excellent mobile performance with automatic code splitting
  - Zero-config deployment on Vercel
- **Use Server Components for**: Data fetching, static layouts, authentication checks
- **Use Client Components for**: Interactive UI, real-time features, state management

#### UI Component Library
**shadcn/ui + Tailwind CSS v4**
- **Justification**:
  - Copy-paste components (no npm dependencies bloat)
  - Full TypeScript support
  - Perfect Next.js 15 + React 19 compatibility
  - Modern design system with dark mode
  - Highly customizable with Tailwind
- **Key Components**: Dialog, Dropdown Menu, Tabs, Command, Scroll Area, Separator

#### State Management
**Zustand v5+ (primary) + Jotai v2+ (secondary)**
- **Justification**:
  - Zustand: 40% faster implementation time, 15% smaller bundles
  - Minimal boilerplate, no context provider hell
  - Excellent TypeScript support
  - Jotai for fine-grained reactivity and derived state
- **Pattern**: Zustand for global state (auth, projects), Jotai for local component state

#### Code Editor
**Monaco Editor for Desktop, CodeMirror 6 for Mobile**
- **Justification**:
  - Monaco: Full IDE features (IntelliSense, debugging), VS Code foundation
  - CodeMirror: Lightweight, excellent mobile support, highly customizable
  - Conditional loading based on device detection
- **Implementation**: Lazy load Monaco on desktop, CodeMirror on mobile

#### Workflow Visualization
**React Flow (ReactFlow)**
- **Justification**:
  - Most mature React workflow library
  - DAG layout support with dagre integration
  - Drag-and-drop node editing
  - MIT licensed with extensive examples
- **Version**: reactflow@11.10+

#### Real-Time Communication
**Socket.io Client + Yjs for CRDT**
- **Justification**:
  - Socket.io: Automatic fallback, room support, reconnection handling
  - Yjs: Industry-standard CRDT implementation for collaborative editing
  - Battle-tested at scale
- **Version**: socket.io-client@4.7+, yjs@13.6+

#### PWA & Mobile
**next-pwa (Serwist)**
- **Justification**:
  - Automatic service worker generation
  - Offline fallback pages
  - App manifest generation
  - Push notification support
- **Version**: @ducanh2912/next-pwa@10.0+

### 1.2 Backend Stack

#### API Layer
**Hybrid: Next.js API Routes (Edge) + FastAPI (Python)**
- **Justification**:
  - Next.js API Routes: Fast, serverless, deploy with frontend
  - FastAPI: AI/ML operations, heavy computation, Python ecosystem
  - Best of both worlds: Node.js speed + Python AI libraries
- **Pattern**:
  - Next.js for: Auth, CRUD, real-time (WebSocket)
  - FastAPI for: Claude API, code execution, AI processing

#### AI Integration
**Vercel AI SDK + Anthropic Claude API**
- **Justification**:
  - Vercel AI SDK: Unified streaming interface, model-agnostic
  - Direct Claude API: Best performance, latest features
  - Support for streaming responses
  - Built-in tool calling support
- **Version**: ai@3.4+, @anthropic-ai/sdk@0.27+

#### Session Management
**Redis (Upstash)**
- **Justification**:
  - Sub-millisecond latency
  - Built-in TTL for session expiration
  - Edge-ready (global distribution)
  - Free tier available
- **Use Cases**: Session storage, rate limiting, caching, pub/sub

#### File System
**GitHub API + S3 (R2)**
- **Justification**:
  - GitHub API: Native Git operations, collaboration
  - S3/R2: File storage, asset hosting, cheaper than GitHub LFS
- **Pattern**: Metadata in PostgreSQL, files in S3, Git via GitHub API

### 1.3 Database Stack

#### Primary Database
**PostgreSQL 16+ with pgvector**
- **Justification**:
  - Relational data with JSONB for flexibility
  - pgvector for embeddings and semantic search
  - ACID compliance for critical operations
  - Excellent TypeScript support via Prisma
- **Hosting**: Vercel Postgres (Neon) or Supabase

#### ORM
**Prisma ORM 5.18+**
- **Justification**:
  - Type-safe database access
  - Excellent migration system
  - Built-in query debugging
  - Great Next.js 15 integration
- **Features**: Schema generation, connection pooling, query optimization

#### Vector Database
**pgvector (PostgreSQL extension)**
- **Justification**:
  - No separate infrastructure needed
  - Sufficient for RAG with <10M embeddings
  - Cost-effective (included with PostgreSQL)
  - Good performance for most use cases
- **Upgrade Path**: Pinecone/Qdrant if >10M embeddings or <10ms query time required

### 1.4 Deployment Stack

#### Hosting
**Vercel (Primary) + Railway (FastAPI)**
- **Justification**:
  - Vercel: Next.js creators, zero-config deployment, Edge Network
  - Railway: Easy Python deployment, auto-HTTPS, preview deployments
  - Free tiers available for both
- **Production**: Vercel Pro + Railway Hobby

#### CDN & Assets
**Vercel Edge Network + Cloudflare R2**
- **Justification**:
  - Vercel Edge: Global edge caching, automatic image optimization
  - R2: S3-compatible storage, zero egress fees
- **Use Cases**: Static assets, user uploads, code execution artifacts

### 1.5 Monitoring Stack

#### Error Tracking
**Sentry**
- **Justification**:
  - Best-in-class error tracking
  - Performance monitoring
  - Release tracking
  - Excellent Next.js integration
- **Version**: @sentry/nextjs@8.38+

#### Analytics
**Vercel Analytics + PostHog**
- **Justification**:
  - Vercel Analytics: Web Vitals, page views (free)
  - PostHog: Product analytics, session recordings, feature flags
- **Pattern**: Vercel for performance, PostHog for user behavior

---

## 2. System Architecture

### 2.1 High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT LAYER                              │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Desktop    │  │   Mobile     │  │     PWA      │         │
│  │   (Next.js)  │  │   (Next.js)  │  │  (Service    │         │
│  │              │  │              │  │   Worker)    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       EDGE LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Vercel     │  │  Cloudflare  │  │   Next.js    │         │
│  │   Edge CDN   │  │     R2       │  │   API Routes │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                      APPLICATION LAYER                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Next.js    │  │   FastAPI    │  │  Socket.io   │         │
│  │   API Routes │  │   Backend    │  │    Server    │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVICES LAYER                             │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   Claude     │  │   GitHub     │  │   Docker     │         │
│  │     API      │  │     API      │  │  Code Runner │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │   OpenRouter │  │   WebContainer│  │    Yjs       │         │
│  │     API      │  │     API      │  │    CRDT      │         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                       DATA LAYER                                 │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │
│  │ PostgreSQL   │  │    Redis     │  │     S3/R2    │         │
│  │  + pgvector  │  │   (Upstash)  │  │  (Cloudflare)│         │
│  └──────────────┘  └──────────────┘  └──────────────┘         │
└─────────────────────────────────────────────────────────────────┘
```

### 2.2 Component Communication

```
┌──────────────────────────────────────────────────────────────┐
│                   DATA FLOW DIAGRAM                          │
└──────────────────────────────────────────────────────────────┘

User Action → Client State → API Request → Server Processing →
    Database Query → Response → UI Update → Optimistic UI

Real-Time Flow:
User Action → WebSocket → Server → Broadcast → All Clients Update

AI Chat Flow:
User Message → API Route → Claude API (Streaming) →
    Forward Stream to Client → Display Token-by-Token

Code Execution Flow:
Code Submit → Docker Container → Execute → Capture Output →
    Store Results → Return to Client
```

### 2.3 Security Layers

```
┌──────────────────────────────────────────────────────────────┐
│                    SECURITY ARCHITECTURE                     │
└──────────────────────────────────────────────────────────────┘

Client Level:
  - Input sanitization
  - XSS protection
  - CSRF tokens
  - Content Security Policy

Edge Level:
  - DDoS protection
  - Rate limiting
  - WAF rules
  - Bot detection

Application Level:
  - Authentication (NextAuth.js)
  - Authorization (RBAC)
  - Input validation (Zod)
  - SQL injection prevention (Prisma)

Data Level:
  - Encryption at rest (PostgreSQL)
  - Encryption in transit (TLS 1.3)
  - Secrets management (Environment variables)
  - PII redaction
```

---

## 3. Frontend Architecture

### 3.1 Project Structure

```
web-ai-platform/
├── src/
│   ├── app/                          # Next.js App Router
│   │   ├── (auth)/                   # Auth route group
│   │   │   ├── login/
│   │   │   └── register/
│   │   ├── (dashboard)/              # Main dashboard
│   │   │   ├── layout.tsx            # Dashboard layout
│   │   │   ├── page.tsx              # Dashboard home
│   │   │   ├── projects/             # Projects management
│   │   │   ├── chat/                 # AI chat interface
│   │   │   └── workflows/            # Visual workflow builder
│   │   ├── api/                      # API routes
│   │   │   ├── auth/
│   │   │   ├── chat/
│   │   │   ├── projects/
│   │   │   └── execute/
│   │   └── layout.tsx                # Root layout
│   ├── components/
│   │   ├── ui/                       # shadcn/ui components
│   │   ├── editor/                   # Code editor components
│   │   ├── chat/                     # Chat components
│   │   ├── projects/                 # Project management
│   │   ├── workflows/                # Workflow visualizer
│   │   └── layout/                   # Layout components
│   ├── lib/
│   │   ├── stores/                   # Zustand stores
│   │   ├── atoms/                    # Jotai atoms
│   │   ├── hooks/                    # Custom hooks
│   │   ├── utils/                    # Utility functions
│   │   └── api/                      # API client functions
│   ├── styles/
│   │   └── globals.css
│   └── types/
│       └── index.ts
├── prisma/
│   └── schema.prisma
├── public/
└── package.json
```

### 3.2 Component Architecture

#### Server Components (Default)
```typescript
// app/projects/page.tsx - Server Component
async function ProjectsPage() {
  const session = await getServerSession();
  const projects = await prisma.project.findMany({
    where: { userId: session.user.id }
  });

  return <ProjectsList projects={projects} />;
}
```

#### Client Components (Interactive)
```typescript
// components/projects/project-card.tsx - Client Component
'use client';

import { useState } from 'react';

export function ProjectCard({ project }: { project: Project }) {
  const [isDeleting, setIsDeleting] = useState(false);

  return <div>{/* Interactive UI */}</div>;
}
```

### 3.3 State Management Strategy

#### Zustand Store Pattern
```typescript
// lib/stores/project-store.ts
import { create } from 'zustand';

interface ProjectStore {
  projects: Project[];
  activeProject: Project | null;
  setActiveProject: (project: Project) => void;
  addProject: (project: Project) => void;
}

export const useProjectStore = create<ProjectStore>((set) => ({
  projects: [],
  activeProject: null,
  setActiveProject: (project) => set({ activeProject: project }),
  addProject: (project) => set((state) =>
    ({ projects: [...state.projects, project] })
  ),
}));
```

#### Jotai Atom Pattern
```typescript
// lib/atoms/editor.ts
import { atom } from 'jotai';

export const editorContentAtom = atom('');
export const wordCountAtom = atom((get) =>
  get(editorContentAtom).split(' ').length
);
```

### 3.4 Code Editor Implementation

#### Desktop (Monaco)
```typescript
// components/editor/monaco-editor.tsx
'use client';

import Editor from '@monaco-editor/react';
import { useMediaQuery } from '@/lib/hooks/use-media-query';

export function CodeEditor() {
  const isMobile = useMediaQuery('(max-width: 768px)');

  if (isMobile) {
    return <CodeMirrorEditor />;
  }

  return (
    <Editor
      height="100%"
      language="typescript"
      theme="vs-dark"
      options={{
        minimap: { enabled: false },
        fontSize: 14,
        lineNumbers: 'on',
      }}
    />
  );
}
```

#### Mobile (CodeMirror)
```typescript
// components/editor/codemirror-editor.tsx
'use client';

import { useEffect, useRef } from 'react';
import { EditorView, basicSetup } from 'codemirror';
import { EditorState } from '@codemirror/state';

export function CodeMirrorEditor() {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!editorRef.current) return;

    const view = new EditorView({
      state: EditorState.create({
        doc: '',
        extensions: [basicSetup]
      }),
      parent: editorRef.current
    });

    return () => view.destroy();
  }, []);

  return <div ref={editorRef} className="h-full" />;
}
```

### 3.5 Workflow Visualization (React Flow)

```typescript
// components/workflows/workflow-canvas.tsx
'use client';

import ReactFlow, {
  Background,
  Controls,
  MiniMap
} from 'reactflow';
import 'reactflow/dist/style.css';

export function WorkflowCanvas() {
  const nodes = [
    {
      id: '1',
      type: 'input',
      data: { label: 'Start' },
      position: { x: 250, y: 25 },
    },
    // ... more nodes
  ];

  const edges = [
    { id: 'e1-2', source: '1', target: '2' },
    // ... more edges
  ];

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      fitView
    >
      <Background />
      <Controls />
      <MiniMap />
    </ReactFlow>
  );
}
```

---

## 4. Backend Architecture

### 4.1 Next.js API Routes

#### API Route Structure
```
src/app/api/
├── auth/
│   ├── [...nextauth]/
│   │   └── route.ts          # NextAuth.js configuration
│   └── session/
│       └── route.ts          # Get current session
├── chat/
│   ├── route.ts              # POST: Send message, GET: History
│   └── stream/
│       └── route.ts          # SSE: Streaming chat
├── projects/
│   ├── route.ts              # CRUD: Projects
│   └── [id]/
│       └── route.ts          # CRUD: Single project
├── execute/
│   └── route.ts              # POST: Execute code
└── websocket/
    └── route.ts              # WebSocket upgrade
```

#### Example API Route (Streaming Chat)
```typescript
// app/api/chat/stream/route.ts
import { streamText } from 'ai';
import { createOpenAI } from '@ai-sdk/openai';

export async function POST(req: Request) {
  const { messages } = await req.json();

  const result = streamText({
    model: createOpenAI({
      baseURL: 'https://api.anthropic.com',
      apiKey: process.env.ANTHROPIC_API_KEY,
    }).chatModel('claude-3-5-sonnet-20241022'),
    messages,
  });

  return result.toDataStreamResponse();
}
```

### 4.2 FastAPI Backend

#### Project Structure
```
backend/
├── app/
│   ├── main.py                # FastAPI app
│   ├── api/
│   │   ├── routes/
│   │   │   ├── chat.py        # Claude API integration
│   │   │   ├── execute.py     # Code execution
│   │   │   └── github.py      # GitHub operations
│   │   └── deps.py            # Dependencies
│   ├── core/
│   │   ├── config.py          # Configuration
│   │   ├── security.py        # Security utilities
│   │   └── docker.py          # Docker execution
│   └── models/
│       └── schemas.py         # Pydantic models
├── Dockerfile
└── requirements.txt
```

#### FastAPI Main Application
```python
# app/main.py
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api.routes import chat, execute, github

app = FastAPI(title="AI Platform API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://your-platform.vercel.app"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(chat.router, prefix="/api/chat", tags=["chat"])
app.include_router(execute.router, prefix="/api/execute", tags=["execute"])
app.include_router(github.router, prefix="/api/github", tags=["github"])
```

#### Claude API Integration
```python
# app/api/routes/chat.py
from fastapi import APIRouter
from anthropic import Anthropic

router = APIRouter()
client = Anthropic(api_key=settings.ANTHROPIC_API_KEY)

@router.post("/stream")
async def stream_chat(request: ChatRequest):
    def generate():
        with client.messages.stream(
            model="claude-3-5-sonnet-20241022",
            max_tokens=1024,
            messages=request.messages,
        ) as stream:
            for text in stream.text_stream:
                yield f"data: {json.dumps({'content': text})}\n\n"

    return StreamingResponse(generate(), media_type="text/event-stream")
```

### 4.3 Code Execution Environment

#### Docker Container Execution
```python
# app/core/docker.py
import docker
from docker.errors import DockerException

client = docker.from_env()

async def execute_code(code: str, language: str) -> ExecutionResult:
    try:
        # Create container
        container = client.containers.create(
            image=f"{language}:latest",
            command=f"python -c '{code}'",
            mem_limit="256m",
            cpu_quota=50000,
        )

        # Start and wait
        container.start()
        result = container.wait(timeout=10)

        # Get logs
        stdout = container.logs(stdout=True).decode('utf-8')
        stderr = container.logs(stderr=True).decode('utf-8')

        # Cleanup
        container.remove(force=True)

        return ExecutionResult(
            stdout=stdout,
            stderr=stderr,
            exit_code=result['StatusCode']
        )
    except DockerException as e:
        raise ExecutionError(str(e))
```

#### Alternative: WebContainer API
```typescript
// lib/webcontainer.ts
import { WebContainer } from '@webcontainer/api';

let webcontainer: WebContainer | null = null;

export async function executeCode(code: string, language: string) {
  if (!webcontainer) {
    webcontainer = await WebContainer.boot();
  }

  await webcontainer.fs.writeFile(`/index.${language}`, code);

  const install = await webcontainer.spawn('npm', ['install']);
  await install.exit;

  const run = await webcontainer.spawn('node', ['index.js']);
  const exitCode = await run.exit;

  const output = await run.output();
  return { output, exitCode };
}
```

---

## 5. Database & Storage Strategy

### 5.1 Database Schema (Prisma)

```prisma
// prisma/schema.prisma

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id            String    @id @default(cuid())
  email         String    @unique
  name          String?
  image         String?
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  projects      Project[]
  sessions      Session[]
  chats         Chat[]
}

model Project {
  id          String   @id @default(cuid())
  name        String
  description String?
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  files       File[]
  workflows   Workflow[]
  executions  Execution[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

model File {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  path        String
  content     String   @db.Text
  language    String
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
}

model Chat {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  projectId   String?
  messages    Message[]
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([userId])
}

model Message {
  id          String   @id @default(cuid())
  chatId      String
  chat        Chat     @relation(fields: [chatId], references: [id])
  role        String   // 'user' | 'assistant' | 'system'
  content     String   @db.Text
  createdAt   DateTime @default(now())

  @@index([chatId])
}

model Workflow {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  name        String
  definition  Json     // DAG definition
  isActive    Boolean  @default(true)
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([projectId])
}

model Execution {
  id          String   @id @default(cuid())
  projectId   String
  project     Project  @relation(fields: [projectId], references: [id])
  code        String   @db.Text
  language    String
  stdout      String?  @db.Text
  stderr      String?  @db.Text
  exitCode    Int
  duration    Int      // milliseconds
  createdAt   DateTime @default(now())

  @@index([projectId])
}

model Session {
  id          String   @id @default(cuid())
  userId      String
  user        User     @relation(fields: [userId], references: [id])
  token       String   @unique
  expiresAt   DateTime
  createdAt   DateTime @default(now())

  @@index([userId])
  @@index([token])
}
```

### 5.2 Vector Database (pgvector)

#### Setup
```sql
-- Enable pgvector extension
CREATE EXTENSION IF NOT EXISTS vector;

-- Create embeddings table
CREATE TABLE embeddings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL,
  content TEXT NOT NULL,
  embedding vector(1536),
  metadata JSONB,
  created_at TIMESTAMP DEFAULT NOW()

);

-- Create index for similarity search
CREATE INDEX embeddings_embedding_idx
ON embeddings
USING ivfflat (embedding vector_cosine_ops)
WITH (lists = 100);

-- Create index for project filtering
CREATE INDEX embeddings_project_id_idx
ON embeddings(project_id);
```

#### Query Example
```sql
-- Semantic search
SELECT
  id,
  content,
  metadata,
  1 - (embedding <=> $1) as similarity
FROM embeddings
WHERE project_id = $2
ORDER BY embedding <=> $1
LIMIT 10;
```

### 5.3 Redis (Upstash)

#### Usage Patterns

**Session Storage**
```typescript
// lib/redis.ts
import { Redis } from '@upstash/redis';

const redis = new Redis({
  url: process.env.UPSTASH_REDIS_REST_URL!,
  token: process.env.UPSTASH_REDIS_REST_TOKEN!,
});

export async function setSession(sessionId: string, data: any) {
  await redis.setex(`session:${sessionId}`, 3600, JSON.stringify(data));
}

export async function getSession(sessionId: string) {
  const data = await redis.get(`session:${sessionId}`);
  return data ? JSON.parse(data) : null;
}
```

**Rate Limiting (Token Bucket)**
```typescript
// lib/rate-limit.ts
export async function rateLimit(
  identifier: string,
  limit: number = 60,
  window: number = 60
) {
  const key = `ratelimit:${identifier}`;
  const now = Date.now();

  const bucket = await redis.get(key);
  const tokens = bucket ? JSON.parse(bucket) : { count: 0, reset_at: now + window * 1000 };

  if (now > tokens.reset_at) {
    tokens.count = 0;
    tokens.reset_at = now + window * 1000;
  }

  if (tokens.count >= limit) {
    return { allowed: false, reset_at: tokens.reset_at };
  }

  tokens.count += 1;
  await redis.set(key, JSON.stringify(tokens), 'PX', window * 1000);

  return { allowed: true, remaining: limit - tokens.count };
}
```

### 5.4 File Storage (S3/R2)

```typescript
// lib/storage.ts
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';

const s3 = new S3Client({
  region: 'auto',
  endpoint: process.env.R2_ENDPOINT,
  credentials: {
    accessKeyId: process.env.R2_ACCESS_KEY_ID!,
    secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
  },
});

export async function uploadFile(
  key: string,
  body: Buffer,
  contentType: string
) {
  const command = new PutObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME,
    Key: key,
    Body: body,
    ContentType: contentType,
  });

  await s3.send(command);

  return `https://${process.env.R2_BUCKET_NAME}.${process.env.R2_ENDPOINT}/${key}`;
}
```

---

## 6. AG-UI & CopilotKit Integration

### 6.1 AG-UI Architecture

AG-UI is an **event-based protocol** for connecting AI agents to user applications. It's designed for lightweight, real-time agent-user interaction.

#### Core Concepts

**Events**
```typescript
// AG-UI Event Types
type AGUIEvent =
  | { type: 'agent:speak'; text: string }
  | { type: 'agent:action'; action: string; params: any }
  | { type: 'agent:thinking'; isThinking: boolean }
  | { type: 'user:message'; text: string }
  | { type: 'context:update'; context: any };
```

#### Implementation Pattern

```typescript
// lib/agui/client.ts
class AGUIClient {
  private socket: WebSocket;
  private eventHandlers: Map<string, Function[]> = new Map();

  constructor(url: string) {
    this.socket = new WebSocket(url);
    this.socket.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data);
    };
  }

  on(event: string, handler: Function) {
    if (!this.eventHandlers.has(event)) {
      this.eventHandlers.set(event, []);
    }
    this.eventHandlers.get(event)!.push(handler);
  }

  emit(event: string, data: any) {
    const handlers = this.eventHandlers.get(event) || [];
    handlers.forEach(handler => handler(data));
  }

  send(event: AGUIEvent) {
    this.socket.send(JSON.stringify(event));
  }
}

export const aguiClient = new AGUIClient('ws://localhost:3001');
```

#### Agent Integration

```typescript
// components/agents/agent-chat.tsx
'use client';

import { useEffect } from 'react';
import { aguiClient } from '@/lib/agui/client';

export function AgentChat() {
  useEffect(() => {
    aguiClient.on('agent:speak', (data) => {
      console.log('Agent says:', data.text);
    });

    aguiClient.on('agent:action', (data) => {
      console.log('Agent action:', data.action, data.params);
    });
  }, []);

  const sendMessage = (text: string) => {
    aguiClient.send({
      type: 'user:message',
      text,
    });
  };

  return <div>{/* Chat UI */}</div>;
}
```

### 6.2 CopilotKit Architecture

CopilotKit is a **React-specific framework** for building in-app AI copilots with native UI integration.

#### Setup

```bash
npm install @copilotkit/react-core @copilotkit/react-ui
```

#### Provider Configuration

```typescript
// app/layout.tsx
import { CopilotKit } from '@copilotkit/react-core';

export default function RootLayout({ children }) {
  return (
    <CopilotKit runtimeUrl="/api/copilotkit">
      {children}
    </CopilotKit>
  );
}
```

#### Backend Integration (Next.js API Route)

```typescript
// app/api/copilotkit/route.ts
import { CopilotRuntime } from '@copilotkit/runtime';
import { copilotNextEndpoint } from '@copilotkit/react-ui';

export const POST = copilotNextEndpoint({
  runtime: new CopilotRuntime(),
  serviceAdapter: {
    async fetch() {
      // Custom AI integration
      const response = await fetch('https://api.anthropic.com/v1/messages', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-api-key': process.env.ANTHROPIC_API_KEY!,
        },
        body: JSON.stringify({
          model: 'claude-3-5-sonnet-20241022',
          max_tokens: 1024,
          messages: [{ role: 'user', content: 'Hello' }],
        }),
      });

      return response.json();
    },
  },
});
```

#### Frontend Usage

```typescript
// components/copilot/copilot-chat.tsx
'use client';

import { useCopilotChat } from '@copilotkit/react-core';

export function CopilotChat() {
  const {
    messages,
    appendMessage,
    setMessages,
    deleteMessage,
  } = useCopilotChat();

  return (
    <div>
      {messages.map((message) => (
        <div key={message.id}>
          {message.role === 'user' ? 'You' : 'AI'}: {message.content}
        </div>
      ))}

      <input
        type="text"
        onKeyDown={(e) => {
          if (e.key === 'Enter') {
            appendMessage({
              role: 'user',
              content: e.currentTarget.value,
            });
          }
        }}
      />
    </div>
  );
}
```

### 6.3 Unified Integration Pattern

```typescript
// lib/ai/unified-agent.ts
import { aguiClient } from './agui/client';
import { useCopilotChat } from '@copilotkit/react-core';

export function useUnifiedAgent() {
  const copilot = useCopilotChat();

  return {
    sendMessage: async (text: string) => {
      // Send to both AG-UI and CopilotKit
      aguiClient.send({ type: 'user:message', text });
      await copilot.appendMessage({
        role: 'user',
        content: text,
      });
    },

    onAgentResponse: (handler: (text: string) => void) => {
      // Listen to both systems
      aguiClient.on('agent:speak', (data) => handler(data.text));

      // CopilotKit handles this internally
    },
  };
}
```

---

## 7. Real-Time Features

### 7.1 WebSocket Implementation

#### Server (Socket.io)

```typescript
// app/api/websocket/route.ts
import { Server as SocketIOServer } from 'socket.io';
import { Server as HTTPServer } from 'http';

export const dynamic = 'force-dynamic';

export const GET = async (req: Request) => {
  if (!(req.socket as any).server.io) {
    const httpServer: HTTPServer = (req.socket as any).server;
    const io = new SocketIOServer(httpServer, {
      path: '/api/socket.io',
      addTrailingSlash: false,
    });

    (req.socket as any).server.io = io;

    io.on('connection', (socket) => {
      console.log('Client connected:', socket.id);

      socket.on('join-project', (projectId: string) => {
        socket.join(`project:${projectId}`);
      });

      socket.on('code-change', (data) => {
        socket.to(`project:${data.projectId}`).emit('code-change', data);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });
  }

  return new Response('WebSocket server is running', { status: 200 });
};
```

#### Client

```typescript
// lib/websocket.ts
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io({
      path: '/api/socket.io',
    });

    socket.on('connect', () => {
      console.log('Connected to WebSocket server');
    });
  }

  return socket;
}

export function joinProject(projectId: string) {
  const socket = getSocket();
  socket.emit('join-project', projectId);
}

export function sendCodeChange(data: { projectId: string; content: string }) {
  const socket = getSocket();
  socket.emit('code-change', data);
}
```

### 7.2 Collaborative Editing (Yjs + WebSockets)

#### Server

```typescript
// app/api/collaboration/route.ts
import { WebsocketProvider } from 'y-websocket/bin/ws';
import { Doc } from 'yjs';

const docs = new Map<string, Doc>();

export const GET = async (req: Request) => {
  const url = new URL(req.url);
  const roomId = url.searchParams.get('roomId');

  if (!docs.has(roomId!)) {
    docs.set(roomId!, new Doc());
  }

  const doc = docs.get(roomId)!;

  // Setup WebSocket provider
  // ... implementation

  return new Response('Collaboration server running');
};
```

#### Client

```typescript
// components/editor/collaborative-editor.tsx
'use client';

import { useEffect, useRef } from 'react';
import * as Y from 'yjs';
import { WebsocketProvider } from 'y-websocket';

export function CollaborativeEditor({ roomId }: { roomId: string }) {
  const editorRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const ydoc = new Y.Doc();
    const provider = new WebsocketProvider(
      'ws://localhost:3001',
      roomId,
      ydoc
    );

    const ytext = ydoc.getText('codemirror');

    // Sync with CodeMirror
    // ... implementation

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [roomId]);

  return <div ref={editorRef} className="h-full" />;
}
```

---

## 8. Code Execution Environment

### 8.1 Docker-Based Execution

#### Implementation Architecture

```
User Code Submit → Docker Container Create → Execute →
    Capture Output → Cleanup → Return Result
```

#### Security Measures

1. **Resource Limits**
   - Memory: 256MB limit
   - CPU: 0.5 CPU cores
   - Timeout: 10 seconds
   - Network: Disabled

2. **Sandboxing**
   - Non-root user
   - Read-only filesystem (except /tmp)
   - No host filesystem access
   - Seccomp profile

3. **Cleanup**
   - Always remove container after execution
   - Clean up temporary files
   - Kill processes if timeout

#### Implementation

```python
# app/core/executor.py
import docker
import time
from docker.errors import DockerException

class CodeExecutor:
    def __init__(self):
        self.client = docker.from_env()

    async def execute(
        self,
        code: str,
        language: str,
        timeout: int = 10
    ) -> dict:
        """Execute code in Docker container"""

        try:
            # Create container
            container = self.client.containers.create(
                image=f"{language}:latest",
                command=f"python -c '{code}'",
                mem_limit="256m",
                cpu_quota=50000,
                network_mode="none",
                read_only=True,
            )

            # Start and capture timing
            start_time = time.time()
            container.start()

            # Wait for completion
            result = container.wait(timeout=timeout)
            duration = int((time.time() - start_time) * 1000)

            # Get output
            stdout = container.logs(stdout=True).decode('utf-8')
            stderr = container.logs(stderr=True).decode('utf-8')

            # Cleanup
            container.remove(force=True)

            return {
                'stdout': stdout,
                'stderr': stderr,
                'exit_code': result['StatusCode'],
                'duration': duration,
            }

        except DockerException as e:
            return {
                'stdout': '',
                'stderr': str(e),
                'exit_code': -1,
                'duration': 0,
            }
```

### 8.2 WebContainer-Based Execution (Browser)

#### Advantages
- No server costs
- Zero latency
- Client-side only
- More secure (sandboxed in browser)

#### Limitations
- Browser-dependent
- Limited to JavaScript/TypeScript
- Resource constrained

#### Implementation

```typescript
// lib/webcontainer/executor.ts
import { WebContainer } from '@webcontainer/api';

let webcontainer: WebContainer | null = null;

export async function executeJS(code: string) {
  if (!webcontainer) {
    webcontainer = await WebContainer.boot({
      coep: 'require-corp',
      coop: 'same-origin',
    });
  }

  // Write files
  await webcontainer.fs.writeFile('/index.js', code);
  await webcontainer.fs.writeFile('/package.json', JSON.stringify({
    name: 'temp-project',
    version: '1.0.0',
  }));

  // Execute
  const install = await webcontainer.spawn('npm', ['install']);
  await install.exit;

  const run = await webcontainer.spawn('node', ['index.js']);
  const exitCode = await run.exit;

  const output = await run.output();

  return {
    stdout: output,
    stderr: '',
    exitCode,
    duration: 0,
  };
}
```

### 8.3 Hybrid Approach

```typescript
// lib/executor/smart-executor.ts
export async function executeCode(
  code: string,
  language: string
): Promise<ExecutionResult> {
  // Use WebContainer for JS/TS
  if (['javascript', 'typescript'].includes(language)) {
    return executeJS(code);
  }

  // Use Docker for everything else
  const response = await fetch('/api/execute', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ code, language }),
  });

  return response.json();
}
```

---

## 9. Mobile-First Design

### 9.1 Responsive Architecture

#### Breakpoints

```css
/* Tailwind config */
module.exports = {
  theme: {
    screens: {
      'xs': '375px',
      'sm': '640px',
      'md': '768px',
      'lg': '1024px',
      'xl': '1280px',
      '2xl': '1536px',
    },
  },
};
```

#### Mobile-First CSS

```css
/* styles/globals.css */
.container {
  width: 100%;
  padding: 1rem;
}

@media (min-width: 768px) {
  .container {
    max-width: 768px;
    margin: 0 auto;
    padding: 2rem;
  }
}

@media (min-width: 1024px) {
  .container {
    max-width: 1024px;
  }
}
```

### 9.2 Touch Interactions

```typescript
// components/mobile/touch-button.tsx
'use client';

import { useGesture } from '@use-gesture/react';

export function TouchButton({ children, onPress }) {
  const bind = useGesture({
    onDragEnd: (state) => {
      if (state.distance > 50) {
        onPress();
      }
    },
    onTap: () => {
      onPress();
    },
  });

  return (
    <button {...bind()} className="touch-manipulation">
      {children}
    </button>
  );
}
```

### 9.3 Mobile-Specific Features

#### Voice Input

```typescript
// hooks/use-speech-to-text.ts
export function useSpeechToText() {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');

  const startListening = () => {
    const recognition = new webkitSpeechRecognition();
    recognition.continuous = false;
    recognition.interimResults = false;

    recognition.onresult = (event) => {
      const text = event.results[0][0].transcript;
      setTranscript(text);
    };

    recognition.start();
    setIsListening(true);
  };

  const stopListening = () => {
    setIsListening(false);
  };

  return { isListening, transcript, startListening, stopListening };
}
```

#### Swipe Gestures

```typescript
// components/mobile/swipe-actions.tsx
'use client';

import { useSwipeable } from 'react-swipeable';

export function SwipeActions({ onSwipeLeft, onSwipeRight, children }) {
  const handlers = useSwipeable({
    onSwipedLeft: onSwipeLeft,
    onSwipedRight: onSwipeRight,
    trackMouse: true,
  });

  return <div {...handlers}>{children}</div>;
}
```

### 9.4 PWA Configuration

```javascript
// next.config.js
const withPWA = require('@ducanh2912/next-pwa').default({
  dest: 'public',
  disable: process.env.NODE_ENV === 'development',
  register: true,
  skipWaiting: true,
});

module.exports = withPWA({
  // ... other Next.js config
});
```

```json
// public/manifest.json
{
  "name": "AI Dev Platform",
  "short_name": "AI Dev",
  "description": "AI-powered development platform",
  "start_url": "/",
  "display": "standalone",
  "background_color": "#000000",
  "theme_color": "#000000",
  "orientation": "portrait",
  "icons": [
    {
      "src": "/icon-192.png",
      "sizes": "192x192",
      "type": "image/png",
      "purpose": "any maskable"
    },
    {
      "src": "/icon-512.png",
      "sizes": "512x512",
      "type": "image/png",
      "purpose": "any maskable"
    }
  ]
}
```

---

## 10. Authentication & Security

### 10.1 Authentication (NextAuth.js v5)

```typescript
// app/api/auth/[...nextauth]/route.ts
import NextAuth from 'next-auth';
import GitHub from 'next-auth/providers/github';
import Google from 'next-auth/providers/google';
import Credentials from 'next-auth/providers/credentials';
import { PrismaAdapter } from '@auth/prisma-adapter';
import { prisma } from '@/lib/prisma';

export const { handlers, auth, signIn, signOut } = NextAuth({
  adapter: PrismaAdapter(prisma),
  providers: [
    GitHub({
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    }),
    Google({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email: { type: 'email' },
        password: { type: 'password' },
      },
      authorize: async (credentials) => {
        // Custom authentication logic
        const user = await prisma.user.findUnique({
          where: { email: credentials.email as string },
        });

        if (user && await verifyPassword(credentials.password, user.password)) {
          return user;
        }

        return null;
      },
    }),
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/login',
    error: '/error',
  },
});
```

### 10.2 Middleware Protection

```typescript
// middleware.ts
import { auth } from '@/auth';
import { NextResponse } from 'next/server';

export default auth((req) => {
  const isLoggedIn = !!req.auth;
  const isOnDashboard = req.nextUrl.pathname.startsWith('/dashboard');
  const isOnLoginPage = req.nextUrl.pathname === '/login';

  if (isOnLoginPage && isLoggedIn) {
    return NextResponse.redirect(new URL('/dashboard', req.url));
  }

  if (isOnDashboard && !isLoggedIn) {
    return NextResponse.redirect(new URL('/login', req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
```

### 10.3 Rate Limiting

```typescript
// middleware/rate-limit.ts
import { NextResponse } from 'next/server';
import { rateLimit } from '@/lib/rate-limit';

export async function rateLimitMiddleware(
  req: Request,
  identifier: string
) {
  const result = await rateLimit(identifier, 60, 60);

  if (!result.allowed) {
    return NextResponse.json(
      { error: 'Too many requests' },
      {
        status: 429,
        headers: {
          'X-RateLimit-Limit': '60',
          'X-RateLimit-Remaining': '0',
          'X-RateLimit-Reset': result.reset_at.toString(),
        },
      }
    );
  }

  return NextResponse.next();
}
```

### 10.4 Input Validation (Zod)

```typescript
// lib/schemas/project.ts
import { z } from 'zod';

export const createProjectSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  language: z.enum(['typescript', 'python', 'javascript', 'go', 'rust']),
});

export type CreateProjectInput = z.infer<typeof createProjectSchema>;
```

```typescript
// app/api/projects/route.ts
import { createProjectSchema } from '@/lib/schemas/project';
import { z } from 'zod';

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const validated = createProjectSchema.parse(body);

    // Create project
    const project = await prisma.project.create({
      data: validated,
    });

    return NextResponse.json(project);
  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.errors },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
```

### 10.5 Security Headers

```typescript
// next.config.js
module.exports = {
  async headers() {
    return [
      {
        source: '/:path*',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'X-XSS-Protection',
            value: '1; mode=block'
          },
          {
            key: 'Referrer-Policy',
            value: 'origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:; object-src 'none'; base-uri 'self'; form-action 'self'; frame-ancestors 'self'; block-all-mixed-content; upgrade-insecure-requests;"
          }
        ]
      }
    ]
  }
};
```

---

## 11. Deployment Architecture

### 11.1 Vercel Deployment

#### Configuration

```json
// vercel.json
{
  "buildCommand": "prisma generate && next build",
  "devCommand": "next dev",
  "installCommand": "npm install",
  "framework": "nextjs",
  "regions": ["iad1"],
  "env": {
    "DATABASE_URL": "@database_url",
    "ANTHROPIC_API_KEY": "@anthropic_api_key"
  }
}
```

#### Environment Variables

```bash
# .env.production
DATABASE_URL="postgresql://user:password@host:5432/dbname"
ANTHROPIC_API_KEY="sk-ant-..."
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="https://your-platform.vercel.app"
GITHUB_CLIENT_ID="your-github-client-id"
GITHUB_CLIENT_SECRET="your-github-client-secret"
UPSTASH_REDIS_REST_URL="https://your-redis.upstash.io"
UPSTASH_REDIS_REST_TOKEN="your-redis-token"
R2_ENDPOINT="https://your-account.r2.cloudflarestorage.com"
R2_ACCESS_KEY_ID="your-access-key"
R2_SECRET_ACCESS_KEY="your-secret-key"
R2_BUCKET_NAME="your-bucket"
```

### 11.2 Railway Deployment (FastAPI)

#### Configuration

```toml
# railway.toml
[build]
builder = "DOCKERFILE"
dockerfilePath = "Dockerfile"

[deploy]
startCommand = "uvicorn app.main:app --host 0.0.0.0 --port $PORT"
healthcheckPath = "/health"
healthcheckTimeout = 300
restartPolicyType = "ON_FAILURE"
restartPolicyMaxRetries = 10
```

```dockerfile
# Dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

### 11.3 CI/CD Pipeline

#### GitHub Actions

```yaml
# .github/workflows/deploy.yml
name: Deploy

on:
  push:
    branches: [main]

jobs:
  deploy-frontend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'npm'

      - run: npm ci
      - run: npm run lint
      - run: npm run test
      - run: npm run build

      - uses: amondnet/vercel-action@v25
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-org-id: ${{ secrets.VERCEL_ORG_ID }}
          vercel-project-id: ${{ secrets.VERCEL_PROJECT_ID }}
          vercel-args: '--prod'

  deploy-backend:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4

      - uses: actions/setup-python@v5
        with:
          python-version: '3.11'

      - run: pip install -r requirements.txt
      - run: pytest

      - uses: railwayapp/cli-action@v1
        with:
          railway-token: ${{ secrets.RAILWAY_TOKEN }}
          command: "up --service=backend"
```

---

## 12. Monitoring & Observability

### 12.1 Error Tracking (Sentry)

```typescript
// sentry.client.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
  tracesSampleRate: 0.1,
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,

  integrations: [
    new Sentry.BrowserTracing(),
    new Sentry.Replay(),
  ],

  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.request) {
      delete event.request.cookies;
    }
    return event;
  },
});
```

```typescript
// sentry.server.config.ts
import * as Sentry from '@sentry/nextjs';

Sentry.init({
  dsn: process.env.SENTRY_DSN,
  tracesSampleRate: 0.1,

  environment: process.env.NODE_ENV,

  beforeSend(event, hint) {
    // Filter out sensitive data
    if (event.user) {
      delete event.user.ip_address;
    }
    return event;
  },
});
```

### 12.2 Performance Monitoring (Vercel Analytics)

```typescript
// app/layout.tsx
import { Analytics } from '@vercel/analytics/react';
import { SpeedInsights } from '@vercel/speed-insights/next';

export default function RootLayout({ children }) {
  return (
    <html>
      <body>
        {children}
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
```

### 12.3 Logging (Winston)

```python
# app/core/logging.py
import logging
from logging.handlers import RotatingFileHandler
import sys

def setup_logging():
    logger = logging.getLogger()
    logger.setLevel(logging.INFO)

    # Console handler
    console_handler = logging.StreamHandler(sys.stdout)
    console_handler.setLevel(logging.INFO)

    # File handler
    file_handler = RotatingFileHandler(
        'logs/app.log',
        maxBytes=10485760,  # 10MB
        backupCount=5
    )
    file_handler.setLevel(logging.INFO)

    # Formatter
    formatter = logging.Formatter(
        '%(asctime)s - %(name)s - %(levelname)s - %(message)s'
    )
    console_handler.setFormatter(formatter)
    file_handler.setFormatter(formatter)

    logger.addHandler(console_handler)
    logger.addHandler(file_handler)

    return logger
```

---

## 13. Performance Optimization

### 13.1 Code Splitting

```typescript
// Dynamic imports for code splitting
const MonacoEditor = dynamic(() => import('@/components/editor/monaco'), {
  loading: () => <EditorSkeleton />,
  ssr: false,
});

const WorkflowCanvas = dynamic(() => import('@/components/workflows/canvas'), {
  loading: () => <CanvasSkeleton />,
  ssr: false,
});
```

### 13.2 Image Optimization

```typescript
// Next.js Image component
import Image from 'next/image';

export function ProjectImage({ src, alt }: { src: string; alt: string }) {
  return (
    <Image
      src={src}
      alt={alt}
      width={800}
      height={600}
      loading="lazy"
      placeholder="blur"
    />
  );
}
```

### 13.3 Caching Strategy

```typescript
// lib/cache.ts
import { LRUCache } from 'lru-cache';

const cache = new LRUCache<string, any>({
  max: 500,
  ttl: 1000 * 60 * 5, // 5 minutes
});

export async function cachedFetch<T>(
  key: string,
  fetcher: () => Promise<T>
): Promise<T> {
  if (cache.has(key)) {
    return cache.get(key) as T;
  }

  const result = await fetcher();
  cache.set(key, result);

  return result;
}
```

### 13.4 Database Optimization

```prisma
// prisma/schema.prisma

// Add indexes
model Project {
  id          String   @id @default(cuid())
  name        String
  userId      String

  @@index([userId])
  @@index([name])
}

// Connection pooling
// lib/prisma.ts
export const prisma = new PrismaClient({
  log: ['query', 'error', 'warn'],
  datasources: {
    db: {
      url: process.env.DATABASE_URL,
    },
  },
}).$extends({
  query: {
    $allOperations({ operation, model, args, query }) {
      console.log(`[Prisma] ${model}.${operation}`, args);
      return query(args);
    },
  },
});
```

---

## 14. Cost Management

### 14.1 Cost Estimation

#### Infrastructure Costs (Monthly)

| Service | Tier | Cost |
|---------|------|------|
| Vercel (Frontend) | Pro | $20 |
| Railway (FastAPI) | Hobby | $5 |
| Vercel Postgres | Basic | $20 |
| Upstash Redis | Free | $0 |
| Cloudflare R2 | Pay-as-you-go | ~$5 |
| Sentry | Developer | $0 |
| **Total** | | **$50/month** |

#### AI API Costs

| Model | Input | Output | Example (100K tokens) |
|-------|-------|--------|----------------------|
| Claude 3.5 Sonnet | $3/M | $15/M | $1.50 |
| Claude 3 Opus | $15/M | $75/M | $7.50 |

#### Cost Optimization Strategies

1. **Caching**: Cache AI responses to reduce API calls
2. **Prompt Optimization**: Reduce token usage with efficient prompts
3. **Model Selection**: Use smaller models for simple tasks
4. **Rate Limiting**: Prevent abuse and excessive usage
5. **User Tiers**: Implement usage-based pricing

### 14.2 Usage Monitoring

```typescript
// lib/usage-tracking.ts
export async function trackUsage(
  userId: string,
  tokens: number,
  model: string
) {
  await prisma.usage.create({
    data: {
      userId,
      tokens,
      model,
      cost: calculateCost(tokens, model),
    },
  });

  // Check if user exceeded limit
  const total = await prisma.usage.aggregate({
    where: {
      userId,
      createdAt: {
        gte: new Date(new Date().setDate(new Date().getDate() - 30)),
      },
    },
    _sum: {
      tokens: true,
    },
  });

  if (total._sum.tokens! > USER_LIMIT) {
    throw new Error('Usage limit exceeded');
  }
}
```

---

## 15. MVP Roadmap

### Phase 1: Foundation (Week 1-4)

**Week 1: Project Setup & Authentication**
- [ ] Initialize Next.js 15 project with TypeScript
- [ ] Set up Prisma with PostgreSQL
- [ ] Configure NextAuth.js with GitHub OAuth
- [ ] Create basic layout with shadcn/ui
- [ ] Deploy to Vercel

**Week 2: Project Management**
- [ ] Build project CRUD API
- [ ] Create project list UI
- [ ] Implement project creation/editing
- [ ] Add project deletion
- [ ] Build project switching

**Week 3: Basic Code Editor**
- [ ] Integrate Monaco Editor (desktop)
- [ ] Integrate CodeMirror (mobile)
- [ ] Implement file management
- [ ] Add syntax highlighting
- [ ] Save files to database

**Week 4: Basic AI Chat**
- [ ] Set up Vercel AI SDK
- [ ] Integrate Claude API
- [ ] Build chat UI
- [ ] Implement streaming responses
- [ ] Save chat history

### Phase 2: Core Features (Month 2)

**Week 5-6: AG-UI Integration**
- [ ] Set up WebSocket server
- [ ] Implement AG-UI protocol
- [ ] Build agent chat UI
- [ ] Add agent action handling
- [ ] Test agent interactions

**Week 7-8: CopilotKit Integration**
- [ ] Install CopilotKit
- [ ] Set up CopilotKit backend
- [ ] Build CopilotChat component
- [ ] Implement UI control
- [ ] Test CopilotKit features

**Week 9-10: Workflow Visualization**
- [ ] Install React Flow
- [ ] Build workflow canvas
- [ ] Add node types (agent, action, decision)
- [ ] Implement workflow execution
- [ ] Save/load workflows

**Week 11-12: Real-Time Collaboration**
- [ ] Set up Yjs CRDT
- [ ] Implement collaborative editing
- [ ] Add presence indicators
- [ ] Build multi-user cursors
- [ ] Test collaboration

### Phase 3: Advanced Features (Month 3+)

**Week 13-14: Code Execution**
- [ ] Set up Docker execution
- [ ] Build execution API
- [ ] Add execution UI
- [ ] Implement result display
- [ ] Add execution history

**Week 15-16: Mobile Optimization**
- [ ] Implement PWA
- [ ] Add offline support
- [ ] Optimize touch interactions
- [ ] Add voice input
- [ ] Test on mobile devices

**Week 17-18: Testing & Quality**
- [ ] Write unit tests
- [ ] Write integration tests
- [ ] Perform load testing
- [ ] Fix bugs
- [ ] Optimize performance

**Week 19-20: Polish & Launch**
- [ ] Improve UI/UX
- [ ] Add documentation
- [ ] Create onboarding flow
- [ ] Set up analytics
- [ ] Launch MVP

---

## 16. Risk Analysis

### 16.1 Technical Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| AI API rate limits | High | High | Implement caching, rate limiting, fallback models |
| Code execution security | High | Critical | Use Docker sandboxing, resource limits, network isolation |
| Real-time collaboration bugs | Medium | Medium | Thorough testing, fallback to polling, error handling |
| Mobile performance | Medium | Medium | Code splitting, lazy loading, performance monitoring |
| Database scaling | Medium | High | Connection pooling, caching, read replicas |

### 16.2 Business Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| High AI costs | High | High | Usage limits, tiered pricing, efficient prompts |
| Low user adoption | Medium | High | User testing, feedback loops, marketing |
| Competitor pressure | High | Medium | Focus on unique features, rapid iteration |
| Security breach | Low | Critical | Security audits, penetration testing, bug bounties |

### 16.3 Operational Risks

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Downtime | Medium | High | Multiple availability zones, health checks, auto-scaling |
| Data loss | Low | Critical | Automated backups, disaster recovery plan |
| Third-party API changes | Medium | Medium | Version pinning, API monitoring, migration plans |

---

## 17. Implementation Checklist

### 17.1 Pre-Development

- [ ] Set up GitHub repository
- [ ] Configure local development environment
- [ ] Set up Vercel account
- [ ] Set up Railway account
- [ ] Set up Supabase/Neon account
- [ ] Set up Upstash account
- [ ] Set up Cloudflare R2 account
- [ ] Set up Sentry account
- [ ] Set up Anthropic API account
- [ ] Create project management board (Linear/Jira)

### 17.2 Development Environment

```bash
# Clone repository
git clone https://github.com/your-org/web-ai-platform.git
cd web-ai-platform

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Set up database
npx prisma generate
npx prisma db push

# Run development server
npm run dev
```

### 17.3 Quality Gates

**Before Committing**
- [ ] Code passes ESLint
- [ ] Code passes Prettier
- [ ] All tests pass
- [ ] Type checking passes
- [ ] No console errors

**Before Merging**
- [ ] Code review approved
- [ ] All tests pass
- [ ] No high-severity vulnerabilities
- [ ] Performance budget met
- [ ] Accessibility checks pass

**Before Deploying**
- [ ] Environment variables configured
- [ ] Database migrations applied
- [ ] Feature flags set
- [ ] Monitoring configured
- [ ] Rollback plan ready

---

## Appendix

### A. Technology Rationale

#### Why Next.js 15?
- 40% performance improvement over v14
- Native Server Components reduce client-side JavaScript
- Built-in API routes eliminate separate backend
- Excellent mobile performance
- Zero-config Vercel deployment

#### Why FastAPI?
- Best Python framework for AI/ML
- Automatic API documentation
- Native async support
- Type validation with Pydantic
- Easy deployment on Railway

#### Why PostgreSQL?
- Relational data with JSONB flexibility
- pgvector for embeddings (no separate DB needed)
- ACID compliance
- Excellent TypeScript support
- Cost-effective

#### Why Docker for Code Execution?
- Industry standard for containerization
- Strong security isolation
- Resource limiting
- Easy cleanup
- Battle-tested

### B. Alternative Technologies Considered

| Decision | Chosen | Alternatives | Rationale |
|----------|--------|--------------|-----------|
| Frontend | Next.js 15 | Remix, SvelteKit | Best ecosystem, Server Components |
| UI Library | shadcn/ui | Mantine, Chakra | Copy-paste, no bloat, customizable |
| State | Zustand | Redux, Recoil | Simpler, faster, smaller bundles |
| Editor | Monaco/CodeMirror | Ace, Codemirror 5 | Best features, mobile support |
| Workflow | React Flow | Dagre, Cytoscape | Most mature, best docs |
| Backend | FastAPI | Django, Flask | Best for AI, async, type-safe |
| Auth | NextAuth.js | Clerk, Auth0 | Open-source, customizable, free |
| Database | PostgreSQL | MongoDB, MySQL | pgvector, relational, ACID |
| Vector DB | pgvector | Pinecone, Qdrant | Single DB, cost-effective |
| Deployment | Vercel | Netlify, AWS | Next.js creators, best DX |

### C. Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | <1.5s | Lighthouse |
| Largest Contentful Paint | <2.5s | Lighthouse |
| Cumulative Layout Shift | <0.1 | Lighthouse |
| First Input Delay | <100ms | Lighthouse |
| Time to Interactive | <3.5s | Lighthouse |
| API Response Time (p95) | <500ms | Vercel Analytics |
| AI Response Time (streaming) | <100ms to first token | Custom tracking |
| Code Execution Time | <10s | Custom tracking |

### D. Security Checklist

- [ ] HTTPS enforced
- [ ] CSRF protection enabled
- [ ] XSS protection enabled
- [ ] SQL injection protection (Prisma)
- [ ] Rate limiting implemented
- [ ] Input validation (Zod)
- [ ] Output sanitization
- [ ] Secrets in environment variables
- [ ] Security headers configured
- [ ] CSP configured
- [ ] HSTS enabled
- [ ] Dependencies scanned
- [ ] Code execution sandboxed
- [ ] File uploads validated
- [ ] Authentication enforced
- [ ] Authorization checks
- [ ] Audit logging
- [ ] Error handling (no sensitive data in errors)

### E. Resources

#### Documentation
- [Next.js 15 Docs](https://nextjs.org/docs)
- [React 19 Docs](https://react.dev)
- [Prisma Docs](https://www.prisma.io/docs)
- [FastAPI Docs](https://fastapi.tiangolo.com)
- [shadcn/ui Docs](https://ui.shadcn.com)
- [Vercel AI SDK Docs](https://sdk.vercel.ai)

#### Tutorials
- [Next.js 15 Tutorial](https://nextjs.org/learn)
- [Prisma Tutorial](https://www.prisma.io/docs/getting-started)
- [FastAPI Tutorial](https://fastapi.tiangolo.com/tutorial/)
- [React Flow Tutorial](https://reactflow.dev/learn)

#### Community
- [Next.js GitHub](https://github.com/vercel/next.js)
- [Prisma Discord](https://discord.gg/prisma)
- [FastAPI Discord](https://discord.gg/fastapi)
- [Stack Overflow](https://stackoverflow.com)

---

## Conclusion

This architecture provides a comprehensive, actionable blueprint for building a modern web-based AI development platform. The recommended stack balances performance, developer experience, and cost-effectiveness while enabling all the features envisioned:

- **Universal Access**: Mobile-first PWA with responsive design
- **Visual Excellence**: shadcn/ui components, React Flow workflows
- **Parallel Productivity**: Zustand state management, multi-project support
- **Intelligent Orchestration**: AG-UI + CopilotKit integration
- **Complete Workflow Support**: Building, editing, fixing, testing, validation

The MVP roadmap provides a clear path from foundation to launch in 12-16 weeks, with each phase building on the previous one. The risk analysis and mitigation strategies help anticipate and address challenges before they become blockers.

**Next Steps:**
1. Review and approve architecture
2. Set up development environment
3. Begin Phase 1 implementation
4. Establish regular check-ins and progress tracking

---

**Document Version**: 1.0
**Last Updated**: January 11, 2026
**Maintained By**: Architecture Team

---

## Sources

### Frontend Architecture
- [React Server Components in Next.js 15: A Deep Dive](https://medium.com/@sureshdotariya/react-server-components-in-next-js-15-a-deep-dive-9ef8c9b5e574)
- [React & Next.js in 2025 - Modern Best Practices](https://strapi.io/blog/react-and-nextjs-in-2025-modern-best-practices)
- [Getting Started: Server and Client Components](https://nextjs.org/docs/app/getting-started/server-and-client-components)
- [Next.js Best Practices in 2025: Performance & Architecture](https://www.raftlabs.com/blog/building-with-next-js-best-practices-and-benefits-for-performance-first-teams/)

### Code Editor Comparison
- [CodeMirror vs Monaco Editor: A Comprehensive Comparison](https://agenthicks.com/research/codemirror-vs-monaco-editor-comparison)
- [Comparing Code Editors: Ace, CodeMirror and Monaco](https://blog.replit.com/code-editors)
- [Migrating from Monaco Editor to CodeMirror](https://sourcegraph.com/blog/migrating-monaco-codemirror)

### AG-UI & Agent Orchestration
- [AG-UI: A Lightweight Protocol for Agent-User Interaction](https://www.datacamp.com/tutorial/ag-ui)
- [How to Make Agents Talk to Each Other (and Your App)](https://www.copilotkit.ai/blog/how-to-make-agents-talk-to-each-other-and-your-app-using-a2a-ag-ui)
- [Building Multi-Agent Architectures](https://medium.com/@akankshasinha247/building-multi-agent-architectures-orchestrating-intelligent-agent-systems-46700e50250b)

### CopilotKit
- [CopilotKit | The Agentic Framework for In-App AI Copilots](https://www.copilotkit.ai/)
- [CopilotKit/CopilotKit: React UI + elegant infrastructure for AI](https://github.com/CopilotKit/CopilotKit)
- [Introduction to CopilotKit](https://docs.copilotkit.ai/)

### Workflow Visualization
- [React Flow: Node-Based UIs in React](https://reactflow.dev/)
- [Dagre Tree](https://reactflow.dev/examples/layout/dagre)
- [Examples](https://reactflow.dev/examples)

### WebContainer & Code Execution
- [WebContainers Official Site](https://webcontainers.io/)
- [WebContainer API Starter (GitHub)](https://github.com/stackblitz/webcontainer-api-starter)
- [Docker Sandboxes](https://docs.docker.com/ai/sandboxes/)
- [All-in-One Sandbox for AI Agents](https://github.com/agent-infra/sandbox)

### Database & Storage
- [Supercharging Your AI: Setting Up RAG with PostgreSQL and pgvector](https://joel-hanson.medium.com/supercharging-your-ai-setting-up-rag-with-postgresql-and-pgvector-2c37baa80e28)
- [Vector Databases Guide: RAG Applications 2025](https://dev.to/klement_gunndu_e16216829c/vector-databases-guide-rag-applications-2025-55oj)
- [Using Prisma ORM with Next.js 15, TypeScript, and PostgreSQL](https://dev.to/mihir_bhadak/using-prisma-orm-with-nextjs-15-typescript-and-postgresql-2b96)

### Deployment
- [Next.js on Vercel](https://vercel.com/docs/frameworks/full-stack/nextjs)
- [Next.js 15 + React 19: Full-Stack Implementation Guide](https://medium.com/@genildocs/next-js-15-react-19-full-stack-implementation-guide-4ba0978fa0e5)
- [How to Build a Fullstack App with Next.js, Prisma, and Vercel Postgres](https://vercel.com/kb/guide/nextjs-prisma-postgres)

### Authentication
- [Setting Up Authentication in Next.js 15 Using NextAuth.js v5](https://medium.com/front-end-weekly/setting-up-authentication-in-next-js-15-using-nextauth-js-v5-264f54d5471f)
- [NextAuth.js 2025: Secure Authentication for Next.js Apps](https://strapi.io/blog/nextauth-js-secure-authentication-nextjs-guide)
- [Next.js App Router: Adding Authentication](https://nextjs.org/learn/dashboard-app/adding-authentication)

### PWA & Mobile
- [Next.js Official PWA Guide](https://nextjs.org/docs/app/guides/progressive-web-apps)
- [Building Offline-Ready PWAs in Next.js](https://medium.com/@mohantaankit2002/building-offline-ready-pwas-in-next-js-your-guide-to-progressive-web-apps-ba720bd5ebe9)
- [PWA + Next.js 15: React Server Components & Offline-First](https://medium.com/@mernstackdevbykevin/progressive-web-app-next-js-15-16-react-server-components-is-it-still-relevant-in-2025-4dff01d32a5d)

### Real-Time Collaboration
- [Building a Real-Time Collaborative Text Editor - WebSockets Implementation with CRDT Data Structures](https://dev.to/dowerdev/building-a-real-time-collaborative-text-editor-websockets-implementation-with-crdt-data-structures-1bia)
- [Build a Collaborative Text Editor ReactJS and CRDT](https://www.pubnub.com/blog/how-to-build-a-reactjs-collaborative-text-editor-with-crdts/)
- [Yjs - Shared Data Types for Building Collaborative Software](https://github.com/yjs/yjs)

### Monitoring
- [Monitoring, Profiling, and Diagnosing Performance in Next.js 15 Web Apps (2025 Edition)](https://medium.com/@sureshdotariya/monitoring-profiling-and-diagnosing-performance-in-next-js-15-web-apps-2025-edition-bed33a88a719)
- [Error and Performance Monitoring for Next.js - Sentry](https://sentry.io/for/nextjs/)
- [Monitor Your Next.js App With RUM - Datadog](https://docs.datadoghq.com/real_user_monitoring/guide/monitor-your-nextjs-app-with-rum/)

### State Management
- [React State Management in 2025: What You Actually Need](https://www.developerway.com/posts/react-state-management-2025)
- [Do You Need State Management in 2025? React Context vs Zustand vs Jotai vs Redux](https://dev.to/saswatapal/do-you-need-state-management-in-2025-react-context-vs-zustand-vs-jotai-vs-redux-1ho)
- [Zustand vs Jotai vs Valtio: Performance Guide 2025](https://www.reactlibraries.com/blog/zustand-vs-jotai-vs-valtio-performance-guide-2025)

### UI Components
- [Using Shadcn in Next.js 15: A Step-by-Step Guide](https://medium.com/@hiteshchauhan2023/using-shadcn-in-nextjs-15-a-step-by-step-guide-a057fb8888ab)
- [Best Practices for Using shadcn/ui in Next.js](https://insight.akarinti.tech/best-practices-for-using-shadcn-ui-in-next-js-2134108553ae)

### Vercel AI SDK
- [Stream Object - Next.js](https://ai-sdk.dev/cookbook/next/stream-object)
- [Streaming responses from LLMs](https://vercel.com/kb/guide/streaming-from-llm)
- [Getting Started: Next.js App Router](https://ai-sdk.dev/docs/getting-started/nextjs-app-router)

### Rate Limiting
- [Rate Limiting in Node.js Using Redis and Token Bucket Algorithm](https://dev.to/hexshift/rate-limiting-in-nodejs-using-redis-and-token-bucket-algorithm-30ah)
- [Set up rate limiting in Next.js with Redis](https://blog.logrocket.com/set-up-rate-limiting-next-js-redis/)
- [How to build a Rate Limiter using Redis](https://redis.io/tutorials/howtos/ratelimiting/)
