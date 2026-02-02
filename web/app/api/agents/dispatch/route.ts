import { NextResponse } from 'next/server'

export async function POST(request: Request) {
  const { agent, task } = await request.json()

  // In production, this would:
  // 1. Validate agent is available
  // 2. Dispatch agent to task
  // 3. Update agent status
  // 4. Return dispatch confirmation

  return NextResponse.json({
    agent,
    task,
    dispatched: true,
    dispatchedAt: new Date()
  })
}
