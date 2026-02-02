/**
 * 🤖 Direct AI Chat API Endpoint
 * Uses OpenRouter API directly for AI responses
 */

import { NextRequest, NextResponse } from 'next/server';

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';

export async function POST(request: NextRequest) {
  try {
    console.log('🤖 Direct AI Chat API: Processing request');

    if (!OPENROUTER_API_KEY) {
      console.error('❌ OpenRouter API key not found');
      return NextResponse.json({
        error: 'AI service not configured',
        message: 'OpenRouter API key not found'
      }, { status: 500 });
    }

    const body = await request.json();
    const { message, conversationHistory = [], personality = 'helpful', parseJson = false, extractFields = [], model = 'qwen/qwen-2.5-coder-32b-instruct' } = body;

    console.log('📨 Sending message to OpenRouter:', message.substring(0, 100));
    console.log('💬 Conversation history messages:', conversationHistory.length);
    console.log('🔧 Parse JSON:', parseJson, 'Extract fields:', extractFields);
    console.log('🤖 Model:', model);

    // Select system message based on parseJson requirement
    const systemMessage = parseJson ? {
      role: 'system',
      content: `You are a strict JSON-output code formatter. You MUST:
1. Respond ONLY with valid JSON - no conversational text
2. Return exactly the requested fields in JSON format
3. Never wrap your response in markdown code blocks
4. Never include explanatory text before or after the JSON
5. Ensure all quotes and special characters are properly escaped`
    } : {
      role: 'system',
      content: `You are Renata, an expert AI assistant for the CE-Hub trading scanner platform. You specialize in:

1. Code formatting and optimization for trading scanners
2. Parameter extraction and validation
3. Trading strategy development
4. Technical analysis implementation

Personality: ${personality}

CRITICAL RESPONSE RULES:
- Respond directly and concisely
- NEVER include your thinking process or reasoning
- NEVER explain what you're going to say before saying it
- Start immediately with the actual response
- Keep greetings brief and friendly
- Focus on being helpful and action-oriented

When users provide scanner code, you should:
- Extract and preserve all parameters exactly
- Suggest optimizations for performance
- Ensure proper Python syntax and structure
- Recommend best practices for trading scanners

Always be helpful, precise, and focus on trading/scanner-related tasks.`
    };

    // Build messages array with conversation history
    const messages: any[] = [systemMessage];

    // Add conversation history (excluding the last message which is the current one)
    if (conversationHistory.length > 1) {
      // conversationHistory includes all messages including current one
      // We need to exclude the last message (current user message) since we'll add it separately
      const historyMessages = conversationHistory.slice(0, -1);

      // Convert role names: "user" → "user", "assistant" → "assistant"
      for (const msg of historyMessages) {
        if (msg.role === 'user' || msg.role === 'assistant') {
          messages.push({
            role: msg.role,
            content: msg.content
          });
        }
      }
      console.log('💬 Added', messages.length - 1, 'conversation history messages');
    }

    // Add current user message
    messages.push({
      role: 'user',
      content: message
    });

    // Call OpenRouter API directly
    const response = await fetch(`${OPENROUTER_BASE_URL}/chat/completions`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5665',
        'X-Title': 'CE-Hub Trading Scanner'
      },
      body: JSON.stringify({
        model: model,
        provider: {
          order: ['DeepInfra', 'Novita', 'Together'],  // Avoid Hyperbolic which fails on long prompts
          allow_fallbacks: true
        },
        messages: messages,
        temperature: parseJson ? 0.1 : 0.7,  // Lower temperature for more predictable JSON output
        max_tokens: 4000
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('❌ OpenRouter API error:', response.status, errorText);
      return NextResponse.json({
        error: 'AI service unavailable',
        message: 'Failed to get response from AI service'
      }, { status: 500 });
    }

    const data = await response.json();

    // Debug logging
    console.log('📦 OpenRouter response structure:', {
      hasChoices: !!data.choices,
      choicesLength: data.choices?.length,
      firstChoice: data.choices?.[0] ? 'exists' : 'missing',
      hasMessage: !!data.choices?.[0]?.message,
      hasContent: !!data.choices?.[0]?.message?.content,
      model: data.model
    });

    const aiMessage = data.choices[0]?.message?.content;

    // Check for empty response (common with rate limiting or model issues)
    if (!aiMessage || aiMessage.trim().length === 0) {
      console.error('❌ Empty response from OpenRouter');
      console.error('📦 Full data:', JSON.stringify(data, null, 2));
      console.error('🔍 Usage:', JSON.stringify(data.usage || {}, null, 2));
      return NextResponse.json({
        error: 'AI service error',
        message: 'Empty response from AI service (possible rate limit or model issue). Please try again.',
        details: {
          model: data.model,
          usage: data.usage,
          choices: data.choices?.length || 0
        }
      }, { status: 500 });
    }

    console.log('✅ AI response received successfully');
    console.log('📄 Raw AI response (first 500 chars):', aiMessage.substring(0, 500));
    console.log('📄 Raw AI response length:', aiMessage.length);

    // Parse JSON response if requested
    let responseData: any = {
      message: aiMessage,
      type: 'ai_response',
      timestamp: new Date().toISOString(),
      model: data.model,
      usage: data.usage
    };

    if (parseJson) {
      try {
        // Extract JSON from the AI response
        const jsonMatch = aiMessage.match(/\{[\s\S]*\}/);
        if (jsonMatch) {
          console.log('🔍 JSON match found (first 300 chars):', jsonMatch[0].substring(0, 300));
          const parsedData = JSON.parse(jsonMatch[0]);
          console.log('📋 Parsed JSON from AI response:', Object.keys(parsedData));

          // Extract requested fields
          for (const field of extractFields) {
            if (parsedData[field] !== undefined) {
              responseData[field] = parsedData[field];
              console.log(`  ✓ Extracted ${field}:`, parsedData[field]);
            }
          }
        }
      } catch (error) {
        console.warn('⚠️ Failed to parse JSON from AI response:', error);
      }
    }

    return NextResponse.json(responseData);

  } catch (error) {
    console.error('❌ Direct AI Chat API error:', error);
    return NextResponse.json({
      error: 'Internal server error',
      message: 'Failed to process AI chat request'
    }, { status: 500 });
  }
}