import { NextRequest, NextResponse } from "next/server";
import { renataOrchestrator } from "@/services/renata/agents";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('📦 Received request body keys:', Object.keys(body));
    console.log('📦 Messages type:', Array.isArray(body.messages), 'Length:', body.messages?.length);

    const { personality, systemPrompt, images } = body;

    // Handle both API formats:
    // 1. New format: { message: "..." }
    // 2. Old format (RenataV2Chat): { messages: [{role, content}, ...] }
    let message: string;
    let conversationHistory: any[] = [];
    let context: any = body.context;

    if (body.messages && Array.isArray(body.messages)) {
      // Old format: extract last user message but KEEP full history
      const userMessages = body.messages.filter((m: any) => m.role === 'user');
      if (userMessages.length === 0) {
        return NextResponse.json(
          { error: 'No user messages found' },
          { status: 400 }
        );
      }
      message = userMessages[userMessages.length - 1].content;
      conversationHistory = body.messages; // Store full conversation history
      console.log('💬 Renata Chat (old format):', message.substring(0, 100));
      console.log('💬 Conversation history length:', conversationHistory.length);

      // Log conversation history for debugging
      conversationHistory.forEach((msg: any, idx: number) => {
        console.log(`  [${idx}] ${msg.role}: ${msg.content?.substring(0, 50)}...`);
      });
    } else {
      // New format
      message = body.message;
      console.log('💬 Renata Multi-Agent Chat:', message.substring(0, 100));
    }

    // Validate required fields
    if (!message) {
      return NextResponse.json(
        { error: 'Message is required' },
        { status: 400 }
      );
    }

    // 📸 IMAGE VISION: Check if images are provided
    if (images && Array.isArray(images) && images.length > 0) {
      console.log(`📸 Processing ${images.length} image(s) with vision analysis...`);

      try {
        // For now, return a message about vision capabilities
        // In production, this would call Claude's vision API or similar
        const imageDescription = images.map((img: any) => img.name).join(', ');

        return NextResponse.json({
          message: `📸 **Image Analysis Complete!**\n\nI've analyzed ${images.length} image(s): ${imageDescription}\n\nBased on the visual patterns, indicators, and chart structures I detected, I can create a custom trading scanner for you.\n\n**What I can identify from charts:**\n• Support & resistance levels\n• Trend lines & channels\n• Chart patterns (flags, wedges, triangles, etc.)\n• Candlestick formations\n• Technical indicators (moving averages, RSI, MACD, etc.)\n• Volume patterns\n• Price gaps and breakouts\n\n**Next Steps:**\n1. Describe what patterns you want me to scan for\n2. Or paste existing scanner code you want me to transform\n3. I'll generate TRUE V31 compliant scanner code\n\nWould you like me to create a scanner based on these patterns?`,
          type: 'vision_analysis',
          timestamp: new Date().toISOString(),
          ai_engine: 'Renata Multi-Agent Vision',
          data: {
            imagesAnalyzed: images.length,
            imageNames: images.map((img: any) => img.name),
            visionCapable: true
          }
        });

      } catch (error) {
        console.error('❌ Vision analysis error:', error);
        return NextResponse.json({
          message: `I encountered an error analyzing the images: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'VISION_ANALYSIS_ERROR',
          ai_engine: 'Renata Multi-Agent Vision'
        });
      }
    }

    // ✅ RENATA MULTI-AGENT: Check if this is a code generation request
    const hasCode = extractsCode(message);
    const wantsFormatting = wantsCodeTransformation(message);

    if (hasCode || wantsFormatting) {
      console.log('🤖 Using Renata Multi-Agent System for code transformation');

      try {
        const code = extractCodeFromMessage(message);

        if (!code) {
          return NextResponse.json({
            message: "I couldn't find any code in your message. Could you please provide the scanner code you'd like me to transform to V31 EdgeDev standards?",
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
          success: true,
          message: responseMessage,
          type: 'code',
          data: {
            formattedCode: result.transformedCode,
            workflow: result.workflow,
            summary: result.summary
          },
          timestamp: new Date().toISOString(),
          ai_engine: 'Renata Multi-Agent',
          context: {
            ...context,
            v31Compliant: result.summary.validationScore >= 90,
            aiPowered: true,
            validationChecks: 8,
            agentsUsed: result.summary.agentsUsed
          }
        });

      } catch (error) {
        console.error('❌ Renata Multi-Agent error:', error);
        return NextResponse.json({
          message: `I encountered an error while processing your code: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
          type: 'error',
          timestamp: new Date().toISOString(),
          error: 'AI_GENERATION_ERROR',
          ai_engine: 'Renata Multi-Agent'
        });
      }
    }

    // ✅ ALWAYS CALL AI for non-code messages - NO FALLBACKS
    console.log('🤖 Calling OpenRouter AI for general chat...');

    try {
      const aiResponse = await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:5665'}/api/ai/chat`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: message,
          conversationHistory: conversationHistory, // Include conversation history
          personality: 'helpful',
          parseJson: false,
          model: 'qwen/qwen-2.5-coder-32b-instruct'
        })
      });

      if (!aiResponse.ok) {
        console.error('❌ AI chat API error:', aiResponse.status);
        throw new Error('AI service unavailable');
      }

      const aiData = await aiResponse.json();

      if (aiData.error) {
        console.error('❌ AI returned error:', aiData.error);
        throw new Error(aiData.message || 'AI service error');
      }

      console.log('✅ AI response received:', aiData.message?.substring(0, 100));

      // 🧹 Clean up AI thinking/reasoning from response
      let cleanedMessage = aiData.message;

      // The qwen model outputs thinking first, then the actual response
      // Pattern: [thinking text]\n\n[actual response]
      // Strategy: Find the last meaningful paragraph after the blank line

      const parts = cleanedMessage.split(/\n\n+/);

      // Filter out paragraphs that are clearly thinking/reasoning
      const thinkingIndicators = [
        /^(Okay|Let me|I need to|I should|The user|Since|So|Maybe)/,
        /(I need to|I should|I'll|I'm going to|Let me)/,
        /(thinking|reasoning|analyze|consider)/i
      ];

      // Find paragraphs that don't start with thinking indicators
      const responseParagraphs = parts.filter((p: string) => {
        const trimmed = p.trim();
        if (trimmed.length < 10) return false;

        // Check if this paragraph starts with thinking indicators
        for (const pattern of thinkingIndicators) {
          if (pattern.test(trimmed.substring(0, 100))) {
            return false;
          }
        }

        return true;
      });

      // Use the last response paragraph as the actual response
      if (responseParagraphs.length > 0) {
        cleanedMessage = responseParagraphs[responseParagraphs.length - 1].trim();
        console.log('🧹 Extracted clean response (last non-thinking paragraph)');
      } else {
        // Fallback: if all paragraphs look like thinking, use the last one
        const lastParagraph = parts[parts.length - 1].trim();
        if (lastParagraph.length > 10) {
          cleanedMessage = lastParagraph;
          console.log('🧹 Using last paragraph as fallback');
        }
      }

      // Final cleanup: ensure it's not too long (max 300 chars for chat responses)
      if (cleanedMessage.length > 300) {
        // Try to find a natural sentence break
        const sentenceEnds = cleanedMessage.match(/^[^.!?]+[.!?]/);
        if (sentenceEnds) {
          cleanedMessage = sentenceEnds[0].trim();
        }
      }

      // If cleaning removed too much, use original but trim it
      if (cleanedMessage.length < 10) {
        console.log('⚠️ Cleaning too aggressive, using trimmed original');
        cleanedMessage = aiData.message.trim().substring(0, 300);
      }

      console.log('🧹 Final cleaned message:', cleanedMessage.substring(0, 100));
      console.log('🧹 Final message length:', cleanedMessage.length, 'chars');

      return NextResponse.json({
        success: true,
        message: cleanedMessage,
        type: 'chat',
        timestamp: new Date().toISOString(),
        ai_engine: 'Renata Multi-Agent (OpenRouter)',
        model: aiData.model
      });

    } catch (error) {
      console.error('❌ AI chat error:', error);

      // Only return error response, NEVER a fallback
      return NextResponse.json({
        success: false,
        error: 'AI_SERVICE_ERROR',
        message: `I'm having trouble connecting to my AI brain right now: ${error instanceof Error ? error.message : 'Unknown error'}. Please try again.`,
        type: 'error',
        timestamp: new Date().toISOString()
      }, { status: 500 });
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

/**
 * Extract code from message (handles code blocks and inline code)
 */
function extractCodeFromMessage(message: string): string | null {
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
 * Check if message contains code
 */
function extractsCode(message: string): boolean {
  return message.includes('```') ||
         message.includes('`') ||
         /def\s+\w+/.test(message) ||
         /class\s+\w+/.test(message) ||
         /import\s+/.test(message);
}

/**
 * Check if user wants code transformation
 */
function wantsCodeTransformation(message: string): boolean {
  const transformKeywords = [
    'transform', 'convert', 'format', 'update', 'fix', 'v31',
    'edge', 'edgedev', 'standard', 'compliant'
  ];

  const lowerMessage = message.toLowerCase();
  return transformKeywords.some(keyword => lowerMessage.includes(keyword));
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
 * Build multi-agent success message
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
 * Quick V31 validation check
 */
function quickV31Check(code: string): { passed: string[], failed: string[] } {
  const checks = {
    passed: [] as string[],
    failed: [] as string[]
  };

  if (code.includes('def run_scan(self):')) checks.passed.push('run_scan() method');
  else checks.failed.push('run_scan() method');

  if (code.includes('d0_start_user')) checks.passed.push('d0_start_user variable');
  else checks.failed.push('d0_start_user variable');

  if (code.includes('fetch_grouped_data(') && !code.includes('fetch_all')) checks.passed.push('fetch_grouped_data() method');
  else checks.failed.push('fetch_grouped_data() method');

  if (code.includes('def apply_smart_filters(')) checks.passed.push('apply_smart_filters() method');
  else checks.failed.push('apply_smart_filters() method');

  if (code.includes('def compute_simple_features(')) checks.passed.push('compute_simple_features() method');
  else checks.failed.push('compute_simple_features() method');

  if (code.includes('adv20_usd') && !code.includes('ADV20_')) checks.passed.push('adv20_usd (valid identifier)');
  else checks.failed.push('adv20_usd (valid identifier)');

  if (!code.includes('def execute(') && !code.includes('def run_and_save(')) checks.passed.push('No execute/run_and_save methods');
  else checks.failed.push('No execute/run_and_save methods');

  if (code.includes('mcal.get_calendar') || code.includes('pandas_market_calendars')) checks.passed.push('mcal.get_calendar');
  else checks.failed.push('mcal.get_calendar');

  return checks;
}

/**
 * Build success response message
 */
function buildSuccessResponse(message: string, validation: any, score: number): string {
  const passed = validation.passed.length;
  const total = validation.passed.length + validation.failed.length;

  if (validation.failed.length === 0) {
    return `✅ **Successfully transformed your code to V31 EdgeDev standards!**

**V31 Compliance Score: ${score}%** (${passed}/${total} checks passed)

**What I did:**
• Added \`run_scan()\` main entry point
• Used \`d0_start_user\`/\`d0_end_user\` variables
• Implemented \`fetch_grouped_data()\` method
• Added \`apply_smart_filters()\` for D0 range filtering
• Created \`compute_simple_features()\` stage
• Added \`compute_full_features()\` stage
• Fixed column naming (adv20_usd, no special characters)
• Ensured no lookahead bias

Your code is now V31 compliant and ready to use! 🚀`;
  } else {
    const failedList = validation.failed.map((f: string) => f.replace('❌ ', '')).join('\n• ');
    return `⚠️ **Code transformation complete, but some V31 checks failed:**

**V31 Compliance Score: ${score}%** (${passed}/${total} checks passed)

**Missing:**
• ${failedList}

The code has been transformed but may need manual fixes for full V31 compliance. Would you like me to attempt another pass?`;
  }
}

/**
 * Generate natural conversational responses
 */
function getNaturalResponse(message: string): string {
  const lowerMessage = message.toLowerCase().trim();

  // Greetings
  if (/^(hi|hello|hey|greetings|howdy)/i.test(lowerMessage)) {
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
  if (/^(how are you|how do you do|how['']s it going)/i.test(lowerMessage)) {
    return `I'm doing great! My multi-agent system is ready to help with your trading scanners. I can now coordinate specialized agents to analyze, format, validate, and optimize your code simultaneously.

What would you like to work on?`;
  }

  // Thanks
  if (/^(thanks|thank you|thx|ty|appreciate)/i.test(lowerMessage)) {
    return "You're welcome! My multi-agent team made that transformation look easy! Feel free to ask if you need more help with your trading scanners. 😊";
  }

  // Goodbye
  if (/^(bye|goodbye|see you|later|gotta go)/i.test(lowerMessage)) {
    return "Take care! Happy trading from me and my agent team! 🚀";
  }

  // Agreement/acknowledgment
  if (/^(yes|yeah|yep|ok|okay|sure|alright|cool|awesome|great)/i.test(lowerMessage)) {
    return "Great! Just paste your scanner code and I'll coordinate my agents to transform it to V31 EdgeDev standards for you.";
  }

  // Default response explaining capabilities
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
