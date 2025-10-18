// CE-Hub Edge Function: Hello World
// PRP-04 First CE Cycle Implementation
//
// This Edge Function demonstrates minimal Supabase Edge Function
// implementation following security-first principles and TypeScript best practices.

import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

interface HelloResponse {
  message: string
  timestamp: string
  requestId: string
  metadata: {
    agent: string
    version: string
    environment: string
  }
}

serve(async (req: Request): Promise<Response> => {
  // Security: Validate HTTP method
  if (req.method !== 'GET' && req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      {
        status: 405,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }

  try {
    // Generate unique request ID for tracing
    const requestId = crypto.randomUUID()

    // Extract optional name parameter
    const url = new URL(req.url)
    const name = url.searchParams.get('name') || 'World'

    // Validate and sanitize input
    const sanitizedName = name.replace(/[<>]/g, '').substring(0, 100)

    // Create response payload
    const response: HelloResponse = {
      message: `Hello, ${sanitizedName}! This is CE-Hub Edge Function responding from the edge.`,
      timestamp: new Date().toISOString(),
      requestId: requestId,
      metadata: {
        agent: 'edge-hello',
        version: '1.0.0',
        environment: 'production'
      }
    }

    // Security headers and CORS
    const headers = {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'X-Request-ID': requestId,
      'X-Content-Type-Options': 'nosniff',
      'X-Frame-Options': 'DENY'
    }

    return new Response(
      JSON.stringify(response, null, 2),
      {
        status: 200,
        headers: headers
      }
    )

  } catch (error) {
    // Error handling with proper logging
    console.error('Edge Function Error:', error)

    return new Response(
      JSON.stringify({
        error: 'Internal server error',
        requestId: crypto.randomUUID()
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
})

// Log function startup
console.log('CE-Hub Edge Hello Function started successfully')