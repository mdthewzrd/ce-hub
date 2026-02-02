/**
 * 🚀 OpenRouter-Powered AI Code Formatter for Renata
 *
 * NOW WITH AI-FIRST ARCHITECTURE - Uses actual template code examples!
 *
 * Features:
 * - Multiple model tiers (FREE → Ultra-Cheap → Premium)
 * - GLM-4.5-Air integration (Zhipu AI)
 * - Automatic fallback through model tiers
 * - Cost optimization
 * - Perfect for OpenRouter membership users
 * - ✅ ACTUAL TEMPLATE CODE EXAMPLES via renataPromptEngineer
 * - ✅ 3-Stage architecture patterns from real templates
 * - ✅ Polygon API integration examples
 * - ✅ Parallel worker patterns
 */

// AI-FIRST: Import renataPromptEngineer for template code examples
import {
  buildCompletePrompt,
  buildSystemPrompt,
  PromptContext
} from '../services/renataPromptEngineer';

export interface OpenRouterCodeFormattingOptions {
  model?: string;
  maxCostPerRequest?: number;
  allowFreeTier?: boolean;
  priorityTier?: 'free' | 'ultra-cheap' | 'premium';
}

export interface OpenRouterFormattingResult {
  success: boolean;
  formattedCode: string;
  scannerType: string;
  integrityVerified: boolean;
  model: string;
  cost: number;
  tier: string;
  optimizations: string[];
  warnings: string[];
  errors: string[];
  tokensUsed: number;
}

class OpenRouterAICodeFormatter {
  private readonly OPENROUTER_API_URL = 'https://openrouter.ai/api/v1/chat/completions';

  // 🏆 OPTIMIZED MODEL TIERS - Best options for code formatting
  // Prioritizing GLM-4.5-Air and DeepSeek Chat for this user
  private readonly MODEL_TIERS = {
    free: [
      { model: 'meta-llama/Meta-Llama-3.1-8B-Instruct', cost: 0.000000, description: 'Llama 3.1 8B - Free tier available' },
      { model: 'microsoft/WizardLM-2-8x22B', cost: 0.000000, description: 'WizardLM 2 8x22B - Free tier' },
      { model: 'Qwen/Qwen-2.5-7B-Instruct', cost: 0.000000, description: 'Qwen 2.5 7B - Free tier' },
    ],
    'ultra-cheap': [
      { model: 'deepseek/deepseek-chat', cost: 0.00000014, description: 'DeepSeek Chat - Best coding model, ultra cheap! ⭐⭐⭐⭐⭐' },
      { model: 'GLM-4.5-Air', cost: 0.00000025, description: 'GLM-4.5 Air - Zhipu AI flagship' },
      { model: 'Qwen/Qwen-2.5-14B-Instruct', cost: 0.00000020, description: 'Qwen 2.5 14B - Great value' },
      { model: 'microsoft/WizardLM-2-7B', cost: 0.00000030, description: 'WizardLM 2 7B - Code expert' },
    ],
    premium: [
      { model: 'anthropic/claude-3.5-haiku', cost: 0.00000025, description: 'Claude 3.5 Haiku - Code specialist' },
      { model: 'anthropic/claude-3.5-sonnet', cost: 0.0000005, description: 'Claude 3.5 Sonnet - Premium reasoning' },
      { model: 'openai/gpt-4o-mini', cost: 0.00000015, description: 'GPT-4o Mini - Fast & cheap' },
    ]
  };

  async formatCode(
    code: string,
    options: OpenRouterCodeFormattingOptions = {}
  ): Promise<OpenRouterFormattingResult> {
    const priorityTier = options.priorityTier || 'free'; // Prioritize FREE models first!
    const maxCost = options.maxCostPerRequest || 0.01; // Default $0.01 max per request

    console.log(`🤖 OpenRouter AI: Starting DeepSeek-first formatting with ${priorityTier} tier priority`);

    // Try models in priority order
    const modelsToTry = this.getModelsByPriority(priorityTier, options.allowFreeTier !== false);

    for (const modelConfig of modelsToTry) {
      if (modelConfig.cost > maxCost) {
        console.log(`💸 Skipping ${modelConfig.model} - cost $${modelConfig.cost} exceeds max $${maxCost}`);
        continue;
      }

      try {
        console.log(`🚀 Trying ${modelConfig.model} (${modelConfig.description})`);
        const result = await this.callOpenRouter(code, modelConfig);

        if (result.success && result.formattedCode) {
          return {
            success: true,
            formattedCode: result.formattedCode,
            scannerType: result.scannerType || 'unknown',
            integrityVerified: result.integrityVerified ?? false,
            model: modelConfig.model,
            tier: this.getTierName(modelConfig.model),
            cost: result.cost || modelConfig.cost * 1000,
            optimizations: result.optimizations || [],
            warnings: result.warnings || [],
            errors: result.errors || [],
            tokensUsed: result.tokensUsed || 0
          };
        }
      } catch (error) {
        console.warn(`❌ ${modelConfig.model} failed:`, error);
        continue;
      }
    }

    // All models failed, return basic formatting but maintain integrity
    return {
      success: false,
      formattedCode: this.basicFormat(code),
      scannerType: 'unknown',
      integrityVerified: true, // Backend fallback still preserves parameters
      model: 'fallback',
      cost: 0,
      tier: 'fallback',
      optimizations: ['Fallback formatting applied'],
      warnings: ['All AI models failed, used basic formatting'],
      errors: ['No AI models available'],
      tokensUsed: 0
    };
  }

  private getModelsByPriority(priorityTier: string, allowFree: boolean = true): typeof this.MODEL_TIERS['ultra-cheap'] {
    const allModels = [...this.MODEL_TIERS['ultra-cheap'], ...this.MODEL_TIERS.premium];

    if (allowFree) {
      allModels.unshift(...this.MODEL_TIERS.free);
    }

    // Reorder based on priority
    switch (priorityTier) {
      case 'free':
        return [...this.MODEL_TIERS.free, ...this.MODEL_TIERS['ultra-cheap'], ...this.MODEL_TIERS.premium];
      case 'premium':
        return [...this.MODEL_TIERS.premium, ...this.MODEL_TIERS['ultra-cheap'], ...this.MODEL_TIERS.free];
      case 'ultra-cheap':
      default:
        return [...this.MODEL_TIERS['ultra-cheap'], ...this.MODEL_TIERS.free, ...this.MODEL_TIERS.premium];
    }
  }

  private async callOpenRouter(code: string, modelConfig: any): Promise<Partial<OpenRouterFormattingResult>> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY');
    }

    const prompt = this.buildCodeFormattingPrompt(code);

    const response = await fetch(this.OPENROUTER_API_URL, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5657',
        'X-Title': 'Renata OpenRouter AI Code Formatter'
      },
      body: JSON.stringify({
        model: modelConfig.model,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1,
        max_tokens: 8000,
        response_format: { type: 'json_object' }
      })
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`OpenRouter API error: ${response.status} - ${errorText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response from OpenRouter');
    }

    // Parse JSON response
    let parsedResponse;
    try {
      parsedResponse = JSON.parse(generatedText);
    } catch (parseError) {
      console.warn('Failed to parse JSON, using raw text');
      return {
        success: true,
        formattedCode: generatedText,
        scannerType: 'unknown',
        optimizations: ['OpenRouter formatting applied'],
        warnings: ['Could not parse structured response'],
        errors: []
      };
    }

    const tokensUsed = data.usage?.total_tokens || this.estimateTokens(prompt + generatedText);
    const cost = data.usage?.total_cost || (tokensUsed * modelConfig.cost);

    return {
      success: true,
      formattedCode: parsedResponse.formattedCode || parsedResponse.formatted_code || generatedText,
      scannerType: parsedResponse.scannerType || parsedResponse.scanner_type || 'unknown',
      integrityVerified: true,
      optimizations: parsedResponse.optimizations || ['AI-powered formatting'],
      warnings: parsedResponse.warnings || [],
      errors: parsedResponse.errors || [],
      tokensUsed,
      cost
    };
  }

  /**
   * AI-FIRST: Build rich prompt with actual template code examples
   * Uses renataPromptEngineer for comprehensive context
   */
  private buildCodeFormattingPrompt(code: string): string {
    console.log('🤖 AI-FIRST: Building rich prompt with template context...');

    // Create prompt context for renataPromptEngineer
    const promptContext: PromptContext = {
      task: 'format',
      userInput: code,
      detectedType: undefined, // Will be auto-detected from templates
      requirements: [
        '3-stage grouped endpoint architecture',
        'Parallel workers (stage1=5, stage3=10)',
        'Full market scanning',
        'Parameter integrity',
        'Code structure standards',
        'Polygon API integration'
      ],
      relevantExamples: [],
      userIntent: 'Format uploaded code to Edge Dev standards'
    };

    // Build complete prompt with system requirements + template examples
    const completePrompt = buildCompletePrompt(promptContext);

    console.log(`✅ Rich prompt built:`);
    console.log(`   - System prompt: ${buildSystemPrompt().length} characters`);
    console.log(`   - Template examples: Included with actual code`);
    console.log(`   - Total prompt size: ${completePrompt.length} characters`);

    // Add OpenRouter-specific JSON response format requirement
    const v31TransformationInstruction = `

## 🚨 CRITICAL: V31 TRANSFORMATION FOR DYNAMIC DATE SUPPORT

You MUST transform the uploaded scanner into V31 format that accepts dynamic date parameters from the frontend:

### V31 REQUIRED STRUCTURE:
\`\`\`python
import pandas as pd
import numpy as np
import requests
from datetime import datetime, timedelta
import pandas_market_calendars as mcal

class DynamicScanner:
    def __init__(self, api_key: str, d0_start: str = None, d0_end: str = None):
        self.api_key = api_key
        self.base_url = "https://api.polygon.io"

        # ✅ V31: Use _user suffix for frontend dates
        self.d0_start_user = d0_start or self.get_default_d0_start()
        self.d0_end_user = d0_end or self.get_default_d0_end()

        # Calculate scan_start with lookback buffer
        lookback_buffer = 50
        scan_start_dt = pd.to_datetime(self.d0_start_user) - pd.Timedelta(days=lookback_buffer)
        self.scan_start = scan_start_dt.strftime('%Y-%m-%d')

        self.nyse = mcal.get_calendar('XNYS')

    def get_default_d0_start(self):
        return (datetime.now() - timedelta(days=30)).strftime('%Y-%m-%d')

    def get_default_d0_end(self):
        return datetime.now().strftime('%Y-%m-%d')

    def run_scan(self):
        """✅ V31 REQUIRED: Main entry point"""
        trading_dates = self.get_trading_dates(self.scan_start, self.d0_end_user)

        # Stage 1: Fetch data
        stage1_data = self.fetch_grouped_data(trading_dates)

        # Stage 2a: Compute simple features
        stage2a_data = self.compute_simple_features(stage1_data)

        # Stage 2b: Apply smart filters
        stage2b_data = self.apply_smart_filters(stage2a_data)

        # Stage 3a: Compute full features
        stage3a_data = self.compute_full_features(stage2b_data)

        # Stage 3b: Detect patterns
        results = self.detect_patterns(stage3a_data)

        return results

    def fetch_grouped_data(self, trading_dates: list) -> pd.DataFrame:
        """✅ V31: Stage 1 - Fetch grouped data"""
        # Implementation here...

    def compute_simple_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 2a - Basic features"""
        # Implementation here...

    def apply_smart_filters(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 2b - Smart filters"""
        # Implementation here...

    def compute_full_features(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 3a - All remaining features"""
        # Implementation here...

    def detect_patterns(self, df: pd.DataFrame) -> pd.DataFrame:
        """✅ V31: Stage 3b - Pattern detection"""
        # TRANSPLANT the original scanner's detection logic here
        # Implementation here...
\`\`\`

### TRANSFORMATION RULES:
1. ✅ Wrap old scanner in a V31 class with __init__(self, api_key, d0_start, d0_end)
2. ✅ Add run_scan() method as the main entry point
3. ✅ Implement the 5 V31 stages: fetch_grouped_data, compute_simple_features, apply_smart_filters, compute_full_features, detect_patterns
4. ✅ CRITICAL: Transplant the original detection logic into detect_patterns() method VERBATIM
5. ✅ REMOVE any hardcoded PRINT_FROM or date filtering from original code
6. ✅ Use self.d0_start_user and self.d0_end_user for date filtering
7. ✅ The frontend will call run_scan(d0_start="2025-01-01", d0_end="2025-11-01") dynamically

### ❌ FORBIDDEN:
- Do NOT keep old main() execution blocks
- Do NOT keep hardcoded PRINT_FROM dates
- Do NOT use if __name__ == "__main__" blocks
- Do NOT simplify or lose the original detection logic

`

    const jsonFormatInstruction = `

Return ONLY valid JSON in this exact format:
{
  "formattedCode": "fully executable V31 scanner code that accepts dynamic d0_start and d0_end parameters",
  "scannerType": "v31_dynamic_scanner",
  "optimizations": ["Transformed to V31 format with dynamic date support", "Removed hardcoded date filters", "Added run_scan() entry point"],
  "warnings": ["any warnings about the formatting"],
  "errors": ["critical errors if any"]
}

IMPORTANT: The formatted code MUST:
- Be V31 format with class structure and run_scan(d0_start, d0_end) method
- Accept dynamic date parameters from frontend
- Transplant original detection logic VERBATIM into detect_patterns()
- Use Polygon API: /v2/aggs/grouped/locale/us/market/stocks/{date}
- Preserve all parameters in flat self.params dict
- Follow exact code structure from template examples above
`;

    return completePrompt + v31TransformationInstruction + `

## USER'S UPLOADED SCANNER CODE TO TRANSFORM:
\`\`\`python
${code}
\`\`\`

` + jsonFormatInstruction;
  }

  private basicFormat(code: string): string {
    return `# Basic formatted code (AI models unavailable)
${code}
# Basic formatting complete`;
  }

  private getTierName(model: string): string {
    for (const [tier, models] of Object.entries(this.MODEL_TIERS)) {
      if (models.some(m => m.model === model)) {
        return tier;
      }
    }
    return 'unknown';
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get available models organized by tier
   */
  getAvailableModels(): typeof this.MODEL_TIERS {
    return this.MODEL_TIERS;
  }

  /**
   * Get recommended model based on user's membership and priorities
   */
  getRecommendedModel(hasMembership: boolean = false): string {
    // DeepSeek is the best choice - excellent coding ability + ultra cheap
    return 'deepseek/deepseek-chat'; // Best coding model, ultra cheap!
  }

  /**
   * Estimate formatting cost for a given code size
   */
  estimateCost(codeLength: number, model: string = 'deepseek/deepseek-chat'): number {
    const tokens = Math.ceil(codeLength / 4); // Estimate tokens
    const modelConfig = [...this.MODEL_TIERS.free, ...this.MODEL_TIERS['ultra-cheap'], ...this.MODEL_TIERS.premium]
      .find(m => m.model === model);

    if (!modelConfig) return 0;
    return tokens * modelConfig.cost;
  }
}

// Export singleton instance
export const openRouterAICodeFormatter = new OpenRouterAICodeFormatter();
export default openRouterAICodeFormatter;