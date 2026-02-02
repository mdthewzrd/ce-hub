import { NextRequest, NextResponse } from 'next/server';
import { openrouterService } from '@/lib/openrouter';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing OpenRouter API connection...');

    const { testType = 'text' } = await request.json();

    // Test basic connection
    const isConnected = await openrouterService.testConnection();
    if (!isConnected) {
      return NextResponse.json({
        success: false,
        error: 'OpenRouter API connection failed',
        suggestion: 'Please check your OPENROUTER_API_KEY in .env.local'
      }, { status: 500 });
    }

    if (testType === 'text') {
      // Test text generation
      const response = await openrouterService.generateText(
        'Hello, please respond with "OpenRouter API is working successfully."'
      );

      return NextResponse.json({
        success: true,
        message: 'OpenRouter API is working!',
        response: response,
        apiKeyPresent: !!process.env.OPENROUTER_API_KEY,
        model: 'google/gemini-1.5-pro via OpenRouter'
      });
    } else {
      return NextResponse.json({
        success: true,
        message: 'OpenRouter API connection successful',
        apiKeyPresent: !!process.env.OPENROUTER_API_KEY,
        readyForVision: true
      });
    }

  } catch (error: any) {
    console.error('OpenRouter API Test Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      stack: error.stack,
      suggestions: [
        'Get your API key from https://openrouter.ai/keys',
        'Make sure you have credits in your OpenRouter account',
        'Verify the API key is correctly set in .env.local'
      ]
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.OPENROUTER_API_KEY;

    return NextResponse.json({
      message: 'OpenRouter API Test Endpoint',
      instructions: 'Send a POST request to test the API',
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'Not found',
      setupInstructions: [
        '1. Go to https://openrouter.ai and create an account',
        '2. Add credits (you can start with $5)',
        '3. Get an API key from https://openrouter.ai/keys',
        '4. Add OPENROUTER_API_KEY to your .env.local file'
      ]
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}