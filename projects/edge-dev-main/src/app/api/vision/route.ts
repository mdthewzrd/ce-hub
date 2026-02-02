/**
 * Vision Processing API
 * Multi-modal image analysis with GPT-4V and Claude integration
 */

import { NextRequest, NextResponse } from 'next/server';
import { getVisionProcessing } from '@/services/visionProcessingService';

// POST /api/vision - Analyze images with vision AI
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const visionService = getVisionProcessing();

    let result;

    switch (action) {
      case 'analyze':
        // Analyze image with custom prompt
        if (!data.image_url && !data.image_base64) {
          return NextResponse.json({
            success: false,
            error: 'Either image_url or image_base64 is required'
          }, { status: 400 });
        }

        const analysisResult = await visionService.analyzeImage({
          image_url: data.image_url,
          image_base64: data.image_base64,
          prompt: data.prompt || 'Describe this image in detail.',
          provider: data.provider || 'claude-3.5-sonnet',
          options: data.options
        });
        result = analysisResult;
        break;

      case 'screenshot':
        // Analyze screenshot for UI components
        if (!data.image_url && !data.image_base64) {
          return NextResponse.json({
            success: false,
            error: 'image_url or image_base64 is required'
          }, { status: 400 });
        }

        const screenshotResult = await visionService.analyzeScreenshot(
          data.image_url || data.image_base64
        );
        result = {
          success: true,
          analysis: screenshotResult
        };
        break;

      case 'extract_code':
        // Extract code from image
        if (!data.image_url && !data.image_base64) {
          return NextResponse.json({
            success: false,
            error: 'image_url or image_base64 is required'
          }, { status: 400 });
        }

        const codeBlocks = await visionService.extractCodeFromImage(
          data.image_url || data.image_base64,
          data.language_hint
        );
        result = {
          success: true,
          code_blocks: codeBlocks,
          count: codeBlocks.length
        };
        break;

      case 'extract_chart':
        // Extract chart data from image
        if (!data.image_url && !data.image_base64) {
          return NextResponse.json({
            success: false,
            error: 'image_url or image_base64 is required'
          }, { status: 400 });
        }

        const chartData = await visionService.extractChartFromImage(
          data.image_url || data.image_base64
        );
        result = {
          success: true,
          chart_data: chartData
        };
        break;

      case 'analyze_diagram':
        // Analyze technical diagram
        if (!data.image_url && !data.image_base64) {
          return NextResponse.json({
            success: false,
            error: 'image_url or image_base64 is required'
          }, { status: 400 });
        }

        const diagramAnalysis = await visionService.analyzeTechnicalDiagram(
          data.image_url || data.image_base64
        );
        result = {
          success: true,
          analysis: diagramAnalysis
        };
        break;

      case 'validate_api_key':
        // Validate API key for provider
        const isValid = await visionService.validateApiKey(data.provider || 'claude-3.5-sonnet');
        result = {
          success: true,
          valid: isValid,
          provider: data.provider
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: analyze, screenshot, extract_code, extract_chart, analyze_diagram, validate_api_key'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Vision POST API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/vision - Get vision service info
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'info';

    const visionService = getVisionProcessing();

    let result;

    switch (action) {
      case 'info':
        // Get service information
        result = {
          success: true,
          available: visionService.isAvailable(),
          default_provider: visionService.getDefaultProvider(),
          supported_providers: visionService.getSupportedProviders()
        };
        break;

      case 'providers':
        // Get supported vision providers
        result = {
          success: true,
          providers: visionService.getSupportedProviders().map(provider => ({
            name: provider,
            description: getProviderDescription(provider)
          }))
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: info, providers'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Vision GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

function getProviderDescription(provider: string): string {
  const descriptions: Record<string, string> = {
    'gpt-4v': 'GPT-4 Vision - Excellent for general image analysis and code extraction',
    'claude-3.5-sonnet': 'Claude 3.5 Sonnet - Great balance of speed and accuracy',
    'claude-3.5-opus': 'Claude 3.5 Opus - Highest accuracy for complex images',
    'tesseract': 'Tesseract OCR - Fallback for basic text extraction'
  };

  return descriptions[provider] || 'Unknown provider';
}
