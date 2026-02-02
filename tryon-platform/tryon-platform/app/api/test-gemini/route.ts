import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing Gemini API connection...');

    // Import Gemini dynamically to avoid loading issues
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    // Initialize Gemini with your API key
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not found in environment variables'
      }, { status: 500 });
    }

    console.log('API Key found:', apiKey.substring(0, 10) + '...');

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try multiple model names to find one that works
    const modelsToTry = [
      'gemini-2.5-flash-image',
      'gemini-2.5-flash',
      'gemini-pro-latest',
      'gemini-flash-latest',
      'gemini-2.0-flash'
    ];

    let lastError = null;
    let workingModel = null;
    let workingResponse = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing with model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, please respond with "API working successfully."');
        const response = await result.response;
        const text = response.text();

        console.log(`✅ SUCCESS with ${modelName}:`, text);
        workingModel = modelName;
        workingResponse = text;
        break;
      } catch (modelError: any) {
        console.log(`❌ FAILED with ${modelName}:`, modelError.message);
        lastError = modelError;
      }
    }

    if (workingModel) {
      return NextResponse.json({
        success: true,
        message: 'Gemini API is working!',
        response: workingResponse,
        workingModel,
        apiKeyPresent: !!apiKey,
        testedModels: modelsToTry
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'All models failed',
        lastError: lastError?.message,
        testedModels: modelsToTry,
        apiKeyPresent: !!apiKey,
        suggestions: [
          'Check if Generative Language API is enabled in your Google Cloud Console',
          'Verify you are using the correct Google Cloud project',
          'Try creating a new API key from AI Studio instead of Google Cloud Console'
        ]
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('Gemini API Test Error:', error);

    return NextResponse.json({
      success: false,
      error: error.message,
      details: error.toString(),
      stack: error.stack
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    return NextResponse.json({
      message: 'Gemini API Test Endpoint',
      instructions: 'Send a POST request to test the API',
      apiKeyPresent: !!apiKey,
      apiKeyPrefix: apiKey ? apiKey.substring(0, 10) + '...' : 'Not found'
    });
  } catch (error: any) {
    return NextResponse.json({
      error: error.message
    }, { status: 500 });
  }
}