import { NextRequest, NextResponse } from 'next/server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const query = searchParams.get('q')

  if (!query) {
    return NextResponse.json({ error: 'Query required' }, { status: 400 })
  }

  // In production, this would:
  // 1. Call Archon MCP RAG search
  // 2. Query knowledge graph
  // 3. Return relevant patterns/tasks

  const mockResults = [
    {
      id: '101',
      type: 'task',
      title: 'JWT auth for API',
      completedAt: '2024-12-15',
      patterns: ['JWT setup', 'Token storage', 'Refresh logic'],
      similarity: 0.92,
      snippet: 'Implemented JWT authentication with refresh tokens...'
    },
    {
      id: '102',
      type: 'task',
      title: 'OAuth2 integration',
      completedAt: '2024-11-20',
      patterns: ['OAuth2 flow', 'Social login'],
      similarity: 0.85,
      snippet: 'Added OAuth2 providers for Google and GitHub...'
    }
  ]

  return NextResponse.json({ results: mockResults })
}
