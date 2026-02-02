import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🧪 Testing working model names...');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: 'No API key found' });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Test with the actual working models we discovered
    const workingModels = [
      'gemini-2.5-flash-image',
      'gemini-2.5-flash-lite',
      'gemini-pro-latest',
      'gemini-flash-latest',
      'gemini-2.5-flash'
    ];

    const results = [];

    for (const modelName of workingModels) {
      try {
        console.log(`🧪 Testing: ${modelName}`);
        const model = genAI.getGenerativeModel({ model: modelName });
        const result = await model.generateContent('Hello! If you can read this, respond with "Model working perfectly!"');
        const response = await result.response;
        const text = response.text();

        results.push({
          model: modelName,
          success: true,
          response: text,
          status: '✅ Working'
        });
        console.log(`✅ SUCCESS with ${modelName}`);

      } catch (error: any) {
        results.push({
          model: modelName,
          success: false,
          error: error.message,
          status: '❌ Failed'
        });
        console.log(`❌ FAILED with ${modelName}:`, error.message);
      }
    }

    const successfulModels = results.filter(r => r.success);

    return NextResponse.json({
      success: successfulModels.length > 0,
      totalTested: workingModels.length,
      workingCount: successfulModels.length,
      results: results,
      recommendedForImages: successfulModels.find(r => r.model.includes('image'))?.model || successfulModels[0]?.model,
      nextSteps: successfulModels.length > 0 ? [
        '🎉 Found working models!',
        'Ready to test the full try-on platform',
        'Go to http://localhost:7771 and try uploading photos'
      ] : [
        'Still having issues with model access',
        'Check project permissions and API enablement'
      ]
    });

  } catch (error: any) {
    console.error('🚨 Model test failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Test Working Models API',
    instructions: 'Send POST request to test the correct model names'
  });
}