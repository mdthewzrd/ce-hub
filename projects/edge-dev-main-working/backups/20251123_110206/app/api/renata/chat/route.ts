import { NextRequest, NextResponse } from "next/server";
import { renataCodeService } from "../../../../services/renataCodeService";

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

    // 🤖 Code detection and processing
    if (isCodeRelated(message)) {
      console.log('🔧 Code request detected, routing to RenataCodeService');
      try {
        const codeResponse = await renataCodeService.processCodeRequest(message, context);

        return NextResponse.json({
          message: codeResponse.message,
          type: codeResponse.type,
          data: codeResponse.data,
          timestamp: new Date().toISOString(),
          context: context
        });
      } catch (error) {
        console.error('❌ Code processing error:', error);
        return NextResponse.json({
          message: "I encountered an issue processing your code. Please try again or contact support.",
          type: 'error',
          timestamp: new Date().toISOString()
        }, { status: 500 });
      }
    }

    // Parse navigation commands (similar to 6565 platform)
    const navigationCommands = parseNavigationCommand(message);
    if (navigationCommands.isNavigation) {
      return NextResponse.json({
        message: navigationCommands.response,
        type: 'navigation',
        action: navigationCommands.action
      });
    }

    // Enhanced system prompt with context
    const enhancedSystemPrompt = `${systemPrompt}

Current Context:
- Platform: CE-Hub Edge-Dev Trading Platform
- Page: ${context?.page || 'Unknown'}
- Features: Scanner Analysis, AI-Powered Pattern Splitting, Parameter Optimization
- Available Scanner Types: LC patterns, Gap Up scanners, A+ patterns
- Current Timestamp: ${context?.timestamp || new Date().toISOString()}

Scanner-Specific Knowledge:
- Parameter contamination issues and fixes
- Upload strategy debugging
- Scanner optimization techniques
- Performance metrics analysis
- Real-time data processing

Available Commands:
- "optimize scanner" - Get specific optimization recommendations
- "analyze results" - Interpret scan results and patterns
- "debug upload" - Troubleshoot file upload issues
- "fix parameters" - Address parameter contamination
- "performance tips" - Get performance improvement suggestions

Be specific, actionable, and focused on CE-Hub scanner functionality.`;

    // Make request to OpenRouter
    const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer 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`,
        'Content-Type': 'application/json',
        'HTTP-Referer': req.headers.get('referer') || 'http://localhost:5657',
        'X-Title': 'CE-Hub Renata AI Assistant'
      },
      body: JSON.stringify({
        model: 'qwen/qwen-2.5-72b-instruct',
        messages: [
          {
            role: 'system',
            content: enhancedSystemPrompt
          },
          {
            role: 'user',
            content: message
          }
        ],
        stream: false,
        temperature: 0.3,
        max_tokens: 1000
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices?.[0]?.message?.content || "I apologize, but I encountered an issue processing your request.";

    // Process AI response for enhanced formatting
    const processedMessage = processAIResponse(aiMessage, personality);

    return NextResponse.json({
      message: processedMessage,
      personality: personality,
      timestamp: new Date().toISOString(),
      context: context
    });

  } catch (error) {
    console.error('Renata Chat API error:', error);
    return NextResponse.json(
      {
        error: 'Failed to process chat request',
        message: "I'm having trouble connecting to my AI service right now. Please try again in a moment."
      },
      { status: 500 }
    );
  }
}

// Parse navigation commands (inspired by 6565 platform)
function parseNavigationCommand(message: string) {
  const lower = message.toLowerCase().trim();

  // Scanner-specific navigation commands
  const navigationPatterns = [
    {
      patterns: ['go to scanner', 'open scanner', 'show scanner'],
      action: 'navigate_scanner',
      response: '🔍 Navigate to the scanner interface to run and analyze your trading patterns.'
    },
    {
      patterns: ['upload strategy', 'upload file', 'add strategy'],
      action: 'navigate_upload',
      response: '📁 Use the "Upload Strategy" button to add your trading strategy files for AI-powered analysis.'
    },
    {
      patterns: ['show results', 'view results', 'see scan results'],
      action: 'navigate_results',
      response: '📊 Check the "Scan Results" section to view your latest scanner analysis and trading opportunities.'
    },
    {
      patterns: ['help with parameters', 'parameter settings', 'scanner settings'],
      action: 'help_parameters',
      response: '⚙️ Scanner parameters control how the AI analyzes patterns. Key settings include ATR multipliers, volume filters, and time ranges.'
    }
  ];

  for (const pattern of navigationPatterns) {
    for (const p of pattern.patterns) {
      if (lower.includes(p)) {
        return {
          isNavigation: true,
          action: pattern.action,
          response: pattern.response
        };
      }
    }
  }

  return { isNavigation: false };
}

// Process AI response for enhanced formatting
function processAIResponse(message: string, personality: string): string {
  let processedMessage = message;

  // Add personality-specific enhancements
  switch (personality) {
    case 'analyst':
      processedMessage = enhanceAnalystResponse(processedMessage);
      break;
    case 'optimizer':
      processedMessage = enhanceOptimizerResponse(processedMessage);
      break;
    case 'debugger':
      processedMessage = enhanceDebuggerResponse(processedMessage);
      break;
    default:
      processedMessage = enhanceRenataResponse(processedMessage);
  }

  return processedMessage;
}

function enhanceRenataResponse(message: string): string {
  // Add scanner-specific context
  if (message.includes('optimize') || message.includes('parameter')) {
    return `🔧 **Scanner Optimization**\n\n${message}`;
  }
  if (message.includes('analyz') || message.includes('result')) {
    return `📈 **Analysis Insight**\n\n${message}`;
  }
  if (message.includes('error') || message.includes('problem')) {
    return `🚨 **Troubleshooting Guide**\n\n${message}`;
  }
  return message;
}

function enhanceAnalystResponse(message: string): string {
  return `📊 **Technical Analysis**\n\n${message}`;
}

function enhanceOptimizerResponse(message: string): string {
  return `⚡ **Performance Optimization**\n\n${message}`;
}

function enhanceDebuggerResponse(message: string): string {
  return `🔧 **Debug Solution**\n\n${message}`;
}

// 🤖 Code detection function
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
    message.toLowerCase().includes('scanner') && (message.includes('def ') || message.includes('import ')),
    message.includes('pandas') && message.includes('def '),
    message.includes('polygon') && message.includes('API_KEY'),

    // Natural language code requests
    message.toLowerCase().includes('format') && (message.toLowerCase().includes('code') || message.toLowerCase().includes('scanner') || message.toLowerCase().includes('python')),
    message.toLowerCase().includes('optimize') && (message.toLowerCase().includes('code') || message.toLowerCase().includes('scanner')),
    message.toLowerCase().includes('convert') && message.toLowerCase().includes('trade era'),

    // File-like content (long code pastes)
    message.split('\n').length > 10 && /import|def |class /.test(message)
  ];

  const hasCodeIndicators = codeIndicators.some(indicator => indicator);

  if (hasCodeIndicators) {
    console.log('🔍 Code detected in message:', {
      hasSlashCommand: message.trim().startsWith('/'),
      hasCodeBlocks: message.includes('```'),
      hasPythonPatterns: /def\s+\w+.*:|import\s+\w+/g.test(message),
      messageLength: message.length,
      lineCount: message.split('\n').length
    });
  }

  return hasCodeIndicators;
}