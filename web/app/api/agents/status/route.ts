import { NextResponse } from 'next/server'

export async function GET() {
  // In production, fetch from orchestrator agent pool

  return NextResponse.json({
    agents: [
      {
        id: 'ce-hub-engineer',
        name: 'CE-Hub Engineer',
        status: 'active',
        currentTask: 'Implement user authentication',
        lastActivity: new Date()
      },
      {
        id: 'research-intelligence-specialist',
        name: 'Research Intelligence Specialist',
        status: 'active',
        currentTask: 'Vector database options',
        lastActivity: new Date()
      },
      {
        id: 'qa-tester',
        name: 'QA Tester',
        status: 'idle',
        lastActivity: new Date(Date.now() - 30 * 60 * 1000)
      },
      {
        id: 'documentation-specialist',
        name: 'Documentation Specialist',
        status: 'idle',
        lastActivity: new Date(Date.now() - 60 * 60 * 1000)
      }
    ]
  })
}
