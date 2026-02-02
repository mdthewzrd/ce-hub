import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    console.log('🔍 Debugging Gemini API setup...');

    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    console.log('🔑 API Key present:', !!apiKey);
    console.log('🔑 API Key starts with:', apiKey?.substring(0, 10) + '...');

    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key found in environment',
        fix: 'Check your .env.local file for GEMINI_API_KEY'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // First, try to list available models (this will tell us a lot)
    try {
      console.log('📋 Trying to list available models...');
      const models = await genAI.listModels();
      console.log('📋 Models found:', models.models.length);

      const modelList = models.models.map(model => ({
        name: model.name,
        displayName: model.displayName,
        supportedGenerationMethods: model.supportedGenerationMethods
      }));

      return NextResponse.json({
        success: true,
        message: '✅ API connection successful!',
        apiKeyValid: true,
        totalModels: modelList.length,
        availableModels: modelList,
        nextStep: 'Now try testing text generation'
      });

    } catch (listError: any) {
      console.log('❌ Model listing failed:', listError.message);

      // If model listing fails, try a basic generation test
      try {
        console.log('🧪 Trying basic generation test...');
        const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });
        const result = await model.generateContent('Hello, respond with "Working!"');
        const response = await result.response;
        const text = response.text();

        return NextResponse.json({
          success: true,
          message: '✅ Basic generation working!',
          response: text,
          apiKeyValid: true,
          model: 'gemini-1.5-pro'
        });

      } catch (genError: any) {
        console.log('❌ Generation failed:', genError.message);

        return NextResponse.json({
          success: false,
          error: 'API connection issues detected',
          apiKeyPresent: !!apiKey,
          listingError: listError.message,
          generationError: genError.message,
          suggestions: [
            '1. Make sure Generative Language API is enabled in your new project',
            '2. Check if billing is properly linked to your new project',
            '3. Verify your project is in a supported region',
            '4. Try creating a fresh API key from the new project'
          ]
        });
      }
    }

  } catch (error: any) {
    console.error('🚨 Debug failed:', error);
    return NextResponse.json({
      success: false,
      error: error.message,
      stack: error.stack,
      apiKeyPresent: !!process.env.GEMINI_API_KEY
    });
  }
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    message: 'Gemini API Debug Tool',
    instructions: 'Send POST request to debug your API setup',
    whatThisTests: [
      'API key validity',
      'Project configuration',
      'Available models',
      'Basic generation capability'
    ]
  });
}