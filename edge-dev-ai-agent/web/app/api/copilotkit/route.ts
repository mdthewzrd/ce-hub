/**
 * CopilotKit API Route
 *
 * Integrates with EdgeDev backend for Renata V2 AI chat functionality
 */

import { NextRequest } from 'next/server';

const BACKEND_URL = 'http://localhost:7447';

// Define Renata V2 tools/actions
const renataActions = [
  {
    name: 'execute_scan',
    description: 'Execute a market scan using EdgeDev scanner',
    parameters: {
      symbol: { type: 'string', description: 'Trading symbol (e.g., SPY, QQQ)' },
      scanner_type: { type: 'string', description: 'Type of scanner to use' },
      date_range: { type: 'string', description: 'Date range for scan' },
    },
  },
  {
    name: 'run_backtest',
    description: 'Run a strategy backtest',
    parameters: {
      strategy: { type: 'string', description: 'Strategy name' },
      symbol: { type: 'string', description: 'Trading symbol' },
      start_date: { type: 'string', description: 'Start date (YYYY-MM-DD)' },
      end_date: { type: 'string', description: 'End date (YYYY-MM-DD)' },
      initial_capital: { type: 'number', description: 'Initial capital amount' },
    },
  },
  {
    name: 'validate_code',
    description: 'Validate generated scanner code',
    parameters: {
      code: { type: 'string', description: 'Python code to validate' },
    },
  },
];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();

    // Check for tool calls in the request
    const toolCalls = body.messages?.[
      body.messages.length - 1
    ]?.tool_calls;

    if (toolCalls && toolCalls.length > 0) {
      // Handle tool calls
      const results = await Promise.all(
        toolCalls.map(async (toolCall: any) => {
          const { name, arguments: args } = toolCall.function;

          try {
            const result = await executeTool(name, args);
            return {
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify(result),
            };
          } catch (error) {
            return {
              tool_call_id: toolCall.id,
              role: 'tool',
              content: JSON.stringify({ error: String(error) }),
            };
          }
        })
      );

      return new Response(JSON.stringify({ results }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    // Forward regular chat messages to EdgeDev backend
    const lastMessage = body.messages?.[body.messages.length - 1];
    const messageContent = lastMessage?.content || '';

    const backendResponse = await fetch(`${BACKEND_URL}/api/chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: messageContent,
        session_id: body.sessionId || 'default',
        context: {
          tools: renataActions,
          platform: 'edgedev',
        },
      }),
    });

    if (!backendResponse.ok) {
      throw new Error(`Backend error: ${backendResponse.statusText}`);
    }

    const backendData = await backendResponse.json();

    // Return OpenAI-compatible response
    return new Response(
      JSON.stringify({
        id: `chatcmpl-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'renata-v2',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: backendData.response || backendData.message || 'Processing complete',
              tool_calls: backendData.tool_calls || undefined,
            },
            finish_reason: backendData.finish_reason || 'stop',
          },
        ],
        usage: backendData.usage || {
          prompt_tokens: 0,
          completion_tokens: 0,
          total_tokens: 0,
        },
      }),
      {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('CopilotKit route error:', error);

    // Return error response in OpenAI format
    return new Response(
      JSON.stringify({
        id: `error-${Date.now()}`,
        object: 'chat.completion',
        created: Math.floor(Date.now() / 1000),
        model: 'renata-v2',
        choices: [
          {
            index: 0,
            message: {
              role: 'assistant',
              content: 'I apologize, but I encountered an error connecting to the EdgeDev backend. Please ensure the backend service is running on port 7447.',
            },
            finish_reason: 'stop',
          },
        ],
      }),
      {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );
  }
}

// Execute tool/action
async function executeTool(name: string, args: any) {
  const backendResponse = await fetch(`${BACKEND_URL}/api/edgedev/execute`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: name,
      ...args,
    }),
  });

  if (!backendResponse.ok) {
    throw new Error(`Tool execution error: ${backendResponse.statusText}`);
  }

  return await backendResponse.json();
}

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
