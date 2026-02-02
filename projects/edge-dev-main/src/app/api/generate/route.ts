/**
 * Scanner Generation API
 * Create scanners from natural language, vision, interactive builder, or templates
 */

import { NextRequest, NextResponse } from 'next/server';
import { getScannerGenerationService } from '@/services/scannerGenerationService';
import type { GenerationRequest, GenerationOptions } from '@/services/scannerGenerationService';

// POST /api/generate - Generate scanners using various methods
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, ...data } = body;

    const generationService = getScannerGenerationService();

    let result;

    switch (action) {
      case 'from-idea':
      case 'from-description':
        // Generate from natural language
        const nlRequest: GenerationRequest = {
          method: 'natural-language',
          input: {
            natural_language: data.description || data.idea || data.text
          },
          options: data.options
        };

        result = await generationService.generateScanner(nlRequest);
        break;

      case 'from-image':
      case 'from-vision':
        // Generate from vision analysis
        const visionRequest: GenerationRequest = {
          method: 'vision',
          input: {
            vision_analysis: data.vision_analysis
          },
          options: data.options
        };

        result = await generationService.generateScanner(visionRequest);
        break;

      case 'interactive':
        // Generate using interactive builder
        const interactiveRequest: GenerationRequest = {
          method: 'interactive',
          input: {
            interactive_state: data.state
          },
          options: data.options
        };

        result = await generationService.generateScanner(interactiveRequest);
        break;

      case 'from-template':
        // Generate from template
        const templateRequest: GenerationRequest = {
          method: 'template',
          input: {
            template_id: data.template_id
          },
          options: data.options
        };

        result = await generationService.generateScanner(templateRequest);
        break;

      case 'hybrid':
        // Hybrid generation using multiple methods
        const hybridRequest: GenerationRequest = {
          method: 'hybrid',
          input: {
            natural_language: data.description,
            vision_analysis: data.vision_analysis,
            template_id: data.template_id
          },
          options: data.options
        };

        result = await generationService.generateScanner(hybridRequest);
        break;

      case 'parse':
        // Parse natural language without generating
        const parseResult = generationService.parseNaturalLanguage(
          data.text || data.description || ''
        );

        result = {
          success: true,
          parse_result: parseResult
        };
        break;

      case 'suggest':
        // Get suggestions for incomplete input
        const suggestions = await generateSuggestions(data);
        result = {
          success: true,
          suggestions
        };
        break;

      case 'optimize':
        // Optimize existing scanner
        if (!data.scanner) {
          return NextResponse.json({
            success: false,
            error: 'scanner parameter is required for optimization'
          }, { status: 400 });
        }

        const optimizedScanner = await generationService.optimizeScanner(data.scanner);
        result = {
          success: true,
          scanner: optimizedScanner
        };
        break;

      case 'test':
        // Test scanner with backtest
        if (!data.scanner) {
          return NextResponse.json({
            success: false,
            error: 'scanner parameter is required for testing'
          }, { status: 400 });
        }

        const backtestResults = await generationService.quickBacktest(data.scanner);
        result = {
          success: true,
          test_results: backtestResults
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: from-idea, from-description, from-image, from-vision, interactive, from-template, hybrid, parse, suggest, optimize, test'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Scanner Generation API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// GET /api/generate - Get generation service info
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const action = searchParams.get('action') || 'info';

    const generationService = getScannerGenerationService();

    let result;

    switch (action) {
      case 'info':
        // Get service information
        result = {
          success: true,
          service: 'Scanner Generation Service',
          version: '1.0.0',
          available_methods: [
            'natural-language',
            'vision',
            'interactive',
            'template',
            'hybrid'
          ],
          supported_actions: [
            'from-idea',
            'from-description',
            'from-image',
            'from-vision',
            'interactive',
            'from-template',
            'hybrid',
            'parse',
            'suggest',
            'optimize',
            'test'
          ]
        };
        break;

      case 'patterns':
        // Get available patterns
        result = {
          success: true,
          patterns: generationService.getAvailablePatterns()
        };
        break;

      case 'templates':
        // Get available templates
        result = {
          success: true,
          templates: generationService.getAvailableTemplates()
        };
        break;

      case 'pattern':
        // Get specific pattern
        const patternId = searchParams.get('id');
        if (!patternId) {
          return NextResponse.json({
            success: false,
            error: 'pattern id is required'
          }, { status: 400 });
        }

        const pattern = generationService.getPattern(patternId);
        if (!pattern) {
          return NextResponse.json({
            success: false,
            error: `Pattern '${patternId}' not found`
          }, { status: 404 });
        }

        result = {
          success: true,
          pattern
        };
        break;

      case 'template':
        // Get specific template
        const templateId = searchParams.get('id');
        if (!templateId) {
          return NextResponse.json({
            success: false,
            error: 'template id is required'
          }, { status: 400 });
        }

        const template = generationService.getTemplate(templateId);
        if (!template) {
          return NextResponse.json({
            success: false,
            error: `Template '${templateId}' not found`
          }, { status: 404 });
        }

        result = {
          success: true,
          template
        };
        break;

      case 'cache-stats':
        // Get cache statistics
        result = {
          success: true,
          cache_stats: {
            nlp_cache_size: 'cache_size' in generationService ? 'N/A' : 'Available'
          }
        };
        break;

      case 'clear-cache':
        // Clear cache
        generationService.clearCache();
        result = {
          success: true,
          message: 'Cache cleared successfully'
        };
        break;

      default:
        result = {
          success: false,
          error: 'Unknown action. Use: info, patterns, templates, pattern, template, cache-stats, clear-cache'
        };
    }

    return NextResponse.json(result);

  } catch (error) {
    console.error('Scanner Generation GET API error:', error);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

// ========== HELPER FUNCTIONS ==========

async function generateSuggestions(data: any): Promise<string[]> {
  const suggestions: string[] = [];

  if (!data.text && !data.description && !data.idea) {
    suggestions.push('Provide a description of the scanner you want to create');
    suggestions.push('Specify the trading strategy (trend, reversal, breakout, etc.)');
    suggestions.push('Mention indicators you want to use (SMA, EMA, RSI, MACD, etc.)');
    return suggestions;
  }

  const text = (data.text || data.description || data.idea || '').toLowerCase();

  // Check for scanner type
  const hasScannerType = ['trend', 'reversal', 'breakout', 'momentum', 'mean-reversion'].some(type =>
    text.includes(type)
  );

  if (!hasScannerType) {
    suggestions.push('Specify the type of scanner: trend, reversal, breakout, momentum, or mean-reversion');
  }

  // Check for indicators
  const hasIndicators = ['sma', 'ema', 'rsi', 'macd', 'bollinger', 'bb', 'atr', 'vwap'].some(ind =>
    text.includes(ind)
  );

  if (!hasIndicators) {
    suggestions.push('Add technical indicators: SMA, EMA, RSI, MACD, Bollinger Bands, etc.');
  }

  // Check for parameters
  const hasParameters = /\d+/.test(text);
  if (!hasParameters) {
    suggestions.push('Specify parameter values (e.g., "20 period SMA", "14 RSI")');
  }

  // Check for entry/exit conditions
  if (!text.includes('entry') && !text.includes('exit') && !text.includes('buy') && !text.includes('sell')) {
    suggestions.push('Describe entry and exit conditions');
  }

  if (suggestions.length === 0) {
    suggestions.push('Your description looks good! Ready to generate.');
  }

  return suggestions;
}
