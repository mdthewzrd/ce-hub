import { NextResponse } from 'next/server'

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  // In production, fetch from orchestrator state

  return NextResponse.json({
    workflowId: id,
    currentPhase: 'produce',
    progress: 60,
    status: 'active',
    agent: 'ce-hub-engineer',
    startedAt: new Date(Date.now() - 45 * 60 * 1000),
    consoleOutput: [
      '> Created POST /auth/login',
      '> Added JWT token generation',
      '> Testing endpoint...'
    ]
  })
}
