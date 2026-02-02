import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // In production, fetch from Archon/local state
  const task = {
    id: id,
    title: 'Implement user authentication',
    description: 'Add JWT-based authentication with token refresh',
    status: 'producing',
    currentPhase: 'produce',
    progress: 60,
    createdAt: new Date(),
    updatedAt: new Date(),
    prp: {
      problem: 'Users need secure login with JWT tokens',
      requirements: ['JWT auth', 'Token refresh', 'Session management'],
      plan: ['Setup JWT', 'Create endpoints', 'Add refresh logic']
    },
    phases: [
      { name: 'Planning', status: 'completed', notes: 'PRP completed' },
      { name: 'Research', status: 'completed', notes: 'Found 3 similar tasks' },
      { name: 'Producing', status: 'in_progress', notes: 'Implementing endpoints' },
      { name: 'Ingesting', status: 'pending', notes: 'Pending completion' }
    ],
    similarTasks: [
      { id: '101', title: 'JWT auth for API', patterns: ['JWT', 'Refresh tokens'] }
    ]
  }

  return NextResponse.json(task)
}

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await request.json()

  // In production, update in Archon/local state
  return NextResponse.json({ id, ...body })
}

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // In production, delete from Archon/local state
  return NextResponse.json({ success: true })
}
