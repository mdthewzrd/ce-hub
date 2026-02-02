import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('Testing current Gemini API setup...');

    // Import Gemini to test
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'GEMINI_API_KEY not found',
        suggestion: 'Please add your new API key to .env.local'
      }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test with the working models
    const modelsToTry = [
      'gemini-1.5-pro',
      'gemini-1.5-flash',
      'gemini-pro'
    ];

    let workingModel = null;
    let testResponse = null;

    for (const modelName of modelsToTry) {
      try {
        console.log(`Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello! If you can read this, respond with "API is working perfectly!"');
        const response = await result.response;
        const text = response.text();

        workingModel = modelName;
        testResponse = text;
        console.log(`✅ SUCCESS with ${modelName}:`, text);
        break;
      } catch (error: any) {
        console.log(`❌ FAILED with ${modelName}:`, error.message);
      }
    }

    if (workingModel) {
      return NextResponse.json({
        success: true,
        message: '🎉 Gemini API is now working!',
        workingModel: workingModel,
        testResponse: testResponse,
        apiKeyPresent: true,
        testedModels: modelsToTry,
        nextSteps: [
          '✅ API connection successful',
          '✅ Ready to process images',
          'Go back to your main app and try uploading photos!'
        ]
      });
    } else {
      return NextResponse.json({
        success: false,
        error: 'No models are working yet',
        testedModels: modelsToTry,
        apiKeyPresent: true,
        suggestions: [
          'Double-check your new API key is correctly saved in .env.local',
          'Make sure the Generative Language API is enabled in your new project',
          'Try restarting the server: npm run dev'
        ]
      }, { status: 500 });
    }

  } catch (error: any) {
    console.error('API Test Error:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      suggestions: [
        'Restart your server with npm run dev',
        'Check your .env.local file has the correct API key',
        'Ensure your new project has Gemini API enabled'
      ]
    }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Current Gemini API Test',
    instructions: 'Send POST request to test your new API key',
    endpoint: '/api/test-current-gemini'
  });
}