import { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  // Create a Server-Sent Event stream
  const encoder = new TextEncoder()
  const stream = new ReadableStream({
    start(controller) {
      // Send initial connection message
      const data = JSON.stringify({
        message: 'Connected to progress stream',
        step: 0
      })
      controller.enqueue(encoder.encode(`data: ${data}\n\n`))

      // Store the controller for sending progress updates
      // In a real implementation, you'd store this in a global map
      // keyed by session ID or request ID
      global.progressControllers = global.progressControllers || new Map()
      const clientId = Date.now().toString() + Math.random().toString(36)
      global.progressControllers.set(clientId, controller)

      // Clean up on disconnect
      request.signal.addEventListener('abort', () => {
        global.progressControllers.delete(clientId)
        controller.close()
      })
    }
  })

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET',
      'Access-Control-Allow-Headers': 'Content-Type'
    }
  })
}

// Helper function to send progress updates (called from other API endpoints)
export function sendProgressUpdate(message: string, step?: number) {
  if (!global.progressControllers) return

  const data = JSON.stringify({ message, step })
  const encodedData = `data: ${data}\n\n`

  global.progressControllers.forEach((controller: any) => {
    try {
      controller.enqueue(new TextEncoder().encode(encodedData))
    } catch (error) {
      // Client disconnected, remove from controllers
      global.progressControllers.delete(controller)
    }
  })
}