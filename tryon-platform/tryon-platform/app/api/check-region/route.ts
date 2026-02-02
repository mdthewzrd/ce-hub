import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    // Import Gemini to check what's available
    const { GoogleGenerativeAI } = await import('@google/generative-ai');

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({
        error: 'No API key found',
        suggestion: 'Please set GEMINI_API_KEY in your environment variables'
      });
    }

    const genAI = new GoogleGenerativeAI(apiKey);

    // Try to list available models
    try {
      console.log('Attempting to list available models...');

      // This will tell us what models are actually available
      const models = await genAI.listModels();

      const modelList = models.models.map(model => ({
        name: model.name,
        displayName: model.displayName,
        description: model.description,
        supportedGenerationMethods: model.supportedGenerationMethods
      }));

      return NextResponse.json({
        success: true,
        message: 'Available Gemini models',
        models: modelList,
        apiKeyPresent: true,
        totalModels: modelList.length
      });

    } catch (error: any) {
      return NextResponse.json({
        success: false,
        error: error.message,
        suggestion: 'This confirms the region/account issue with Google Cloud',
        apiKeyPresent: true,
        recommendations: [
          'Try Google AI Studio instead (aistudio.google.com)',
          'Check if account billing is properly set up',
          'Verify account age restrictions',
          'Try different Google Cloud region (us-central1, us-west1, us-west2)'
        ]
      });
    }

  } catch (error: any) {
    return NextResponse.json({
      error: error.message,
      suggestions: [
        'Try Google AI Studio instead',
        'Check Google Cloud project settings'
      ]
    });
  }
}