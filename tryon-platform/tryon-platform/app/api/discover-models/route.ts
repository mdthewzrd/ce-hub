import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Discovering available Gemini models...');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try different model naming patterns
    const modelsToTry = [
      'gemini-pro',
      'gemini-1.0-pro',
      'gemini-1.5-pro-latest',
      'gemini-1.5-flash-latest',
      'gemini-pro-vision',
      'text-bison-001',
      'chat-bison-001'
    ];

    const workingModels = [];
    const failedModels = [];

    for (const modelName of modelsToTry) {
      try {
        console.log(`🧪 Testing model: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello, respond with "Working!"');
        const response = await result.response;
        const text = response.text();

        workingModels.push({
          name: modelName,
          response: text,
          status: '✅ Working'
        });
        console.log(`✅ SUCCESS with ${modelName}:`, text);

      } catch (error: any) {
        failedModels.push({
          name: modelName,
          error: error.message,
          status: '❌ Failed'
        });
        console.log(`❌ FAILED with ${modelName}:`, error.message);
      }
    }

    // Also try to get model info via REST API
    let restModels = [];
    try {
      const restResponse = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`);
      if (restResponse.ok) {
        const restData = await restResponse.json();
        restModels = restData.models?.map((model: any) => ({
          name: model.name,
          displayName: model.displayName,
          supportedMethods: model.supportedGenerationMethods
        })) || [];
      }
    } catch (restError: any) {
      console.log('REST API call failed:', restError.message);
    }

    return NextResponse.json({
      success: workingModels.length > 0,
      workingModels,
      failedModels,
      restModels,
      summary: {
        totalTested: modelsToTry.length,
        workingCount: workingModels.length,
        failedCount: failedModels.length,
        apiKeyValid: true
      },
      nextSteps: workingModels.length > 0 ? [
        '✅ Found working models!',
        'Update your code to use working model names',
        'Test the full platform functionality'
      ] : [
        'No working models found',
        'Check if Generative Language API is fully enabled',
        'Verify project has billing linked properly'
      ]
    });

  } catch (error: any) {
    console.error('🚨 Model discovery failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Gemini Model Discovery Tool',
    instructions: 'Send POST request to discover available models'
  });
}