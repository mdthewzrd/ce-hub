import { NextRequest, NextResponse } from 'next/server'

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()

    // Simple fallback response for now to prevent 404s
    // TODO: Implement proper CopilotKit integration when dependencies are resolved
    return NextResponse.json({
      response: "I'm Renata, your AI trading assistant. I'm currently being configured.",
      status: 'success'
    })
  } catch (error) {
    console.error('CopilotKit API error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}