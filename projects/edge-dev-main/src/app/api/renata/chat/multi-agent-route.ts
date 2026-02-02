/**
 * 🤖 Renata Multi-Agent Chat Endpoint
 *
 * Simplified Renata chat that uses the multi-agent system
 * Routes requests to specialized agents for code transformation
 */

import { NextRequest, NextResponse } from "next/server";
import { renataOrchestrator } from "@/services/renata/agents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, context } = body;

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    console.log('💬 Renata Multi-Agent Chat:', message.substring(0, 100));

    // Check for conversational messages
    const isConversational = isGreetingOrConversation(message);

    if (isConversational) {
      return NextResponse.json({
        message: getConversationalResponse(message),
        type: 'chat',
        timestamp: new Date().toISOString(),
        ai_engine: 'Renata Multi-Agent'
      });
    }

    // Check if this is a code transformation request
    const hasCode = extractCode(message) !== null;

    if (hasCode) {
      console.log('🤖 Routing to multi-agent system...');

      const code = extractCode(message);

      if (!code) {
        return NextResponse.json({
          message: "I couldn't find any code in your message. Please paste your scanner code and I'll transform it using my multi-agent system!",
          type: 'chat',
          timestamp: new Date().toISOString(),
          ai_engine: 'Renata Multi-Agent'
        });
      }

      // Determine transformation type from message
      const transformationType = detectTransformationType(message);

      console.log(`🎯 Transformation type: ${transformationType}`);

      // Execute multi-agent workflow
      const result = await renataOrchestrator.processCodeTransformation(code, {
        transformationType,
        preserveParameters: true,
        addDocumentation: true,
        optimizePerformance: true,
        validateOutput: true
      });

      if (!result.success) {
        return NextResponse.json({
          message: `I encountered an error during transformation. Please try again or provide more details.`,
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'TRANSFORMATION_ERROR',
          ai_engine: 'Renata Multi-Agent'
        });
      }

      // Build success response
      const responseMessage = buildMultiAgentSuccessMessage(result, transformationType);

      return NextResponse.json({
        message: responseMessage,
        type: 'code',
        data: {
          formattedCode: result.transformedCode,
          workflow: result.workflow,
          summary: result.summary
        },
        timestamp: new Date().toISOString(),
        ai_engine: 'Renata Multi-Agent'
      });
    }

    // Default response
    return NextResponse.json({
      message: getConversationalResponse(message),
      type: 'chat',
      timestamp: new Date().toISOString(),
      ai_engine: 'Renata Multi-Agent'
    });

  } catch (error) {
    console.error('❌ Multi-Agent API Error:', error);

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

/**
 * Check if message is a greeting or conversational
 */
function isGreetingOrConversation(message: string): boolean {
  const patterns = [
    /^(hi|hello|hey|greetings|howdy|good morning|good afternoon|good evening)[\s!?]*$/i,
    /^(what'?s up|sup|how are you|how do you do|what's new)[\s!?]*$/i,
    /^(thanks|thank you|thx|ty|appreciate it)[\s!?]*$/i,
    /^(bye|goodbye|see you|later|gotta go)[\s!?]*$/i,
    /^(yes|no|maybe|ok|okay|sure|alright)[\s!?]*$/i,
    /^(cool|awesome|great|nice|interesting)[\s!?]*$/i,
  ];

  return patterns.some(pattern => pattern.test(message.trim()));
}

/**
 * Extract code from message
 */
function extractCode(message: string): string | null {
  // Try to extract from ```python ... ``` blocks
  const pythonBlockMatch = message.match(/```python\n([\s\S]+?)\n```/);
  if (pythonBlockMatch) {
    return pythonBlockMatch[1].trim();
  }

  // Try to extract from ``` ... ``` blocks (no language specified)
  const genericBlockMatch = message.match(/```\n([\s\S]+?)\n```/);
  if (genericBlockMatch) {
    return genericBlockMatch[1].trim();
  }

  // Try to extract from inline code
  const inlineMatch = message.match(/`([^`]+)`/);
  if (inlineMatch) {
    return inlineMatch[1].trim();
  }

  return null;
}

/**
 * Detect transformation type from message
 */
function detectTransformationType(message: string): 'v31_standard' | 'backside_b' | 'multi_pattern' | 'optimization' {
  const lower = message.toLowerCase();

  if (lower.includes('backside') || lower.includes('breakdown')) {
    return 'backside_b';
  }

  if (lower.includes('multi') || lower.includes('multiple patterns')) {
    return 'multi_pattern';
  }

  if (lower.includes('optimize') || lower.includes('performance')) {
    return 'optimization';
  }

  return 'v31_standard';
}

/**
 * Build success message from multi-agent result
 */
function buildMultiAgentSuccessMessage(
  result: any,
  transformationType: string
): string {
  const { workflow, summary } = result;

  const agentNames = {
    code_analyzer: '🔍 Analyzer',
    code_formatter: '✨ Formatter',
    parameter_extractor: '🔧 Parameter Extractor',
    validator: '✅ Validator',
    optimizer: '⚡ Optimizer',
    documentation: '📝 Documentation'
  };

  const agentsUsed = summary.agentsUsed.map((a: string) => agentNames[a as keyof typeof agentNames] || a);

  return `✅ **Multi-Agent Transformation Complete!**

**Transformation Type:** ${transformationType.replace('_', ' ').toUpperCase()}

**Workflow:** ${workflow.workflowId}
**Agents Used:** ${agentsUsed.join(' → ')}

**Results:**
• **Lines:** ${summary.originalLines} → ${summary.transformedLines}
• **Parameters Preserved:** ${summary.parametersPreserved}
• **V31 Compliance Score:** ${summary.validationScore}%
• **Optimizations:** ${summary.optimizationsApplied.length}

**What the multi-agent system did:**
${workflow.results.map((r: any) => `• ${agentNames[r.agentType as keyof typeof agentNames] || r.agentType}: ${r.data?.description || 'Completed'}`).join('\n')}

Your code is now transformed and ready to use! 🚀`;
}

/**
 * Generate conversational responses
 */
function getConversationalResponse(message: string): string {
  const lower = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|greetings|howdy)/i.test(lower)) {
    return `Hello! I'm **Renata Multi-Agent**, your AI trading scanner assistant with a team of specialized agents:

**🤖 My Agent Team:**
• 🔍 **Code Analyzer** - Understands code structure
• ✨ **Code Formatter** - Transforms to V31 standards
• 🔧 **Parameter Extractor** - Preserves your parameters
• ✅ **Validator** - Ensures V31 compliance
• ⚡ **Optimizer** - Improves performance
• 📝 **Documentation** - Adds comprehensive docs

Just paste your scanner code and I'll coordinate my agents to transform it! 🚀`;
  }

  // How are you
  if (/^(how are you|how do you do|how['']s it going)/i.test(lower)) {
    return `I'm doing great! My multi-agent system is ready to help with your trading scanners. I can now coordinate specialized agents to analyze, format, validate, and optimize your code simultaneously.

What would you like to work on?`;
  }

  // Thanks
  if (/^(thanks|thank you|thx|ty|appreciate)/i.test(lower)) {
    return "You're welcome! My multi-agent team made that transformation look easy! Feel free to ask if you need more help with your trading scanners. 😊";
  }

  // Goodbye
  if (/^(bye|goodbye|see you|later|gotta go)/i.test(lower)) {
    return "Take care! Happy trading from me and my agent team! 🚀";
  }

  // Default response
  return `I'm **Renata Multi-Agent** - your AI trading scanner assistant with specialized agents!

**My Agent Team:**
• 🔍 **Analyzer** - Understands code structure
• ✨ **Formatter** - Transforms to V31 standards
• 🔧 **Parameter Extractor** - Preserves parameters
• ✅ **Validator** - Ensures compliance
• ⚡ **Optimizer** - Improves performance
• 📝 **Documentation** - Adds docs

**Just paste your code and I'll coordinate my agents to transform it!** 🚀`;
}
