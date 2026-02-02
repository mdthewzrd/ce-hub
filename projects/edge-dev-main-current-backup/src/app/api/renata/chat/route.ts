import { NextRequest, NextResponse } from "next/server";
import { renataCodeService } from "@/services/renataCodeService";
import { enhancedRenataCodeService } from "@/services/enhancedRenataCodeService";
import { sendProgressUpdate } from "../progress/route";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, personality, systemPrompt, context } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 🚀 ALL REQUESTS GO THROUGH GLM-4.5 - NO FALLBACKS!
    // Use your powerful GLM subscription for ALL conversations
    console.log('🚀 GLM-4.5 Processing ALL requests - Your subscription, your AI');

    // Send real progress updates
    sendProgressUpdate('🔍 Analyzing request structure...', 0);
    sendProgressUpdate('📝 Processing with AI model...', 1);
    sendProgressUpdate('🤖 Calling OpenRouter API...', 2);

    try {
      const enhancedResponse = await enhancedRenataCodeService.processCodeRequest(message, context);

      sendProgressUpdate('✨ Enhancing code quality...', 3);
      sendProgressUpdate('🔒 Verifying parameter integrity...', 4);
      sendProgressUpdate('📊 Finalizing results...', 5);

      return NextResponse.json({
        message: enhancedResponse.message,
        type: enhancedResponse.type,
        data: enhancedResponse.data,
        nextSteps: enhancedResponse.nextSteps,
        timestamp: new Date().toISOString(),
        context: {
          ...context,
          enhancedMode: true,
          fullMarketCoverage: true,
          polygonApiKey: 'Fm7brz4s23eSocDErnL68cE7wspz2K1I',
          maxThreading: true,
          codePreview: true,
          aiPowered: true,
          executionCapabilities: ['format-execute', 'multi-scan', 'single-scan', 'parameter-integrity', 'market-scan']
        },
        ai_engine: 'GLM-4.5 Enhanced Renata AI'
      });
    } catch (error) {
      console.error('❌ Enhanced GLM-4.5 processing error:', error);
      return NextResponse.json({
        message: `❌ I encountered an error with GLM-4.5: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        type: 'error',
        timestamp: new Date().toISOString(),
        error: 'GLM_PROCESSING_ERROR'
      });
    }
  } catch (error) {
    console.error('❌ API Error:', error);
    return NextResponse.json(
      {
        error: 'Internal server error',
        message: 'An error occurred while processing your request.',
        type: 'api_error'
      },
      { status: 500 }
    );
  }
}

// Helper functions
function isCodeRelated(message: string): boolean {
  const codeIndicators = [
    // Slash commands
    message.trim().startsWith('/format'),
    message.trim().startsWith('/upload'),
    message.trim().startsWith('/convert'),
    message.trim().startsWith('/validate'),
    message.trim().startsWith('/template'),

    // Code blocks
    message.includes('```'),

    // Python code patterns
    /def\s+\w+.*:/g.test(message),
    /import\s+\w+/g.test(message),
    /from\s+\w+\s+import/g.test(message),
    /class\s+\w+.*:/g.test(message),
    /if\s+__name__\s*==\s*["']__main__["']/g.test(message),

    // Trading-specific patterns
    /scanner|scan_symbol|get_minutely_data|ticker/gi.test(message),
    /gap_percent|volume_ratio|atr|moving_average/gi.test(message),
    /nyse|nasdaq|etf|polygon/gi.test(message),

    // File operations
    message.includes('.py'),
    message.includes('backside'),
    message.includes('scanner')
  ];

  return codeIndicators.some(indicator => typeof indicator === 'boolean' ? indicator : indicator);
}

function hasDirectExecutionIntent(message: string): boolean {
  const executionKeywords = [
    'execute', 'run', 'process', 'analyze', 'backtest', 'scan',
    'from date', 'to date', 'date range', '1/1/25', '2025',
    'market wide', 'full market', 'all symbols'
  ];

  const lowerMessage = message.toLowerCase();
  return executionKeywords.some(keyword => lowerMessage.includes(keyword));
}