import { NextResponse } from 'next/server'

// Mock data - replace with actual Archon/Database calls
const mockTasks = [
  {
    id: '1',
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication with token refresh',
    status: 'producing',
    currentPhase: 'produce',
    progress: 60,
    createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
    updatedAt: new Date(),
    assignedAgent: 'ce-hub-engineer'
  },
  {
    id: '2',
    title: 'Fix payment processing bug',
    description: 'Investigate and fix the payment gateway integration issue',
    status: 'planning',
    currentPhase: 'planning',
    progress: 10,
    createdAt: new Date(Date.now() - 5 * 60 * 60 * 1000),
    updatedAt: new Date(),
  },
  {
    id: '3',
    title: 'Add OAuth2 login',
    description: 'Integrate OAuth2 providers for social login',
    status: 'completed',
    currentPhase: 'ingest',
    progress: 100,
    createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
    updatedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
  }
]

export async function GET() {
  // In production, this would call:
  // 1. Archon MCP to get tasks from knowledge graph
  // 2. Local state storage for active workflows
  return NextResponse.json(mockTasks)
}

export async function POST(request: Request) {
  const body = await request.json()

  // In production, this would:
  // 1. Create task in local state
  // 2. Sync with Archon knowledge graph
  // 3. Initialize workflow state

  const newTask = {
    id: Date.now().toString(),
    ...body,
    status: 'pending',
    currentPhase: 'planning',
    progress: 0,
    createdAt: new Date(),
    updatedAt: new Date()
  }

  return NextResponse.json(newTask, { status: 201 })
}
