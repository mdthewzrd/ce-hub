import { NextRequest, NextResponse } from 'next/server';
import { renataAIAgentService } from '@/services/renataAIAgentService';

/**
 * Renata AI Agent API Endpoint
 *
 * Provides intelligent code generation using Qwen Coder 3
 * while maintaining EdgeDev standardization compliance.
 */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, prompt, code, context, temperature, messages } = body;

    switch (action) {
      case 'generate':
        // Generate new code or modify existing code
        if (!prompt) {
          return NextResponse.json({
            success: false,
            error: 'Prompt is required for generate action'
          }, { status: 400 });
        }

        const generatedCode = await renataAIAgentService.generate({
          prompt,
          code,
          context,
          temperature: temperature || 0.7
        });

        return NextResponse.json({
          success: true,
          code: generatedCode,
          model: 'qwen/qwen3-coder'
        });

      case 'chat':
        // Conversational interaction with the AI
        if (!messages || !Array.isArray(messages)) {
          return NextResponse.json({
            success: false,
            error: 'Messages array is required for chat action'
          }, { status: 400 });
        }

        const response = await renataAIAgentService.chat(
          messages,
          temperature || 0.7
        );

        return NextResponse.json({
          success: true,
          response,
          model: 'qwen/qwen3-coder'
        });

      case 'analyze':
        // Analyze existing code and suggest improvements
        if (!code) {
          return NextResponse.json({
            success: false,
            error: 'Code is required for analyze action'
          }, { status: 400 });
        }

        const analysis = await renataAIAgentService.generate({
          prompt: 'Analyze this code for EdgeDev compliance. Identify: 1) Whether it follows 3-stage architecture, 2) Which of the 7 standardizations are missing, 3) Scanner type, 4) Suggestions for improvement.',
          code,
          context: 'You are a code reviewer. Provide specific, actionable feedback.'
        });

        return NextResponse.json({
          success: true,
          analysis,
          model: 'qwen/qwen3-coder'
        });

      case 'improve':
        // Improve existing code to EdgeDev standards
        if (!code) {
          return NextResponse.json({
            success: false,
            error: 'Code is required for improve action'
          }, { status: 400 });
        }

        const improved = await renataAIAgentService.generate({
          prompt: 'Refactor this code to fully comply with EdgeDev 3-stage architecture and all 7 standardizations. Preserve the core strategy logic, but ensure the structure is production-ready.',
          code,
          context: 'Maintain the original strategy intent while enforcing EdgeDev standards.'
        });

        return NextResponse.json({
          success: true,
          originalCode: code,
          improvedCode: improved,
          model: 'qwen/qwen3-coder'
        });

      case 'explain':
        // Explain how the code works
        if (!code) {
          return NextResponse.json({
            success: false,
            error: 'Code is required for explain action'
          }, { status: 400 });
        }

        const explanation = await renataAIAgentService.generate({
          prompt: 'Explain how this scanner works in detail. Cover: 1) Overall strategy, 2) Each stage of the 3-stage architecture, 3) Key parameters and their effects, 4) Pattern detection logic, 5) Expected use case.',
          code,
          context: 'Be thorough but clear. Assume the reader is a developer learning EdgeDev patterns.'
        });

        return NextResponse.json({
          success: true,
          explanation,
          model: 'qwen/qwen3-coder'
        });

      default:
        return NextResponse.json({
          success: false,
          error: `Unknown action: ${action}. Valid actions: generate, chat, analyze, improve, explain`
        }, { status: 400 });
    }

  } catch (error) {
    console.error('Renata AI Agent API error:', error);

    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      details: process.env.NODE_ENV === 'development' ? String(error) : undefined
    }, { status: 500 });
  }
}

// OPTIONS handler for CORS
export async function OPTIONS() {
  return NextResponse.json({}, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}
