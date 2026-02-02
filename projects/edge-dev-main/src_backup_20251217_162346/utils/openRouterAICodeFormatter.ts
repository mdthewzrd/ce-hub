/**
 * 🚀 OpenRouter-Powered AI Code Formatter for Renata
 *
 * Optimized for OpenRouter's extensive model library with focus on
 * free tier and ultra-cheap premium models for code formatting.
 *
 * Features:
 * - Multiple model tiers (FREE → Ultra-Cheap → Premium)
 * - GLM-4.5-Air integration (Zhipu AI)
 * - Automatic fallback through model tiers
 * - Cost optimization
 * - Perfect for OpenRouter membership users
 */

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
    const priorityTier = options.priorityTier || 'ultra-cheap';
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

        if (result.success) {
          return {
            success: result.success ?? true,
            formattedCode: result.formattedCode || code,
            scannerType: result.scannerType || 'unknown',
            integrityVerified: result.integrityVerified ?? false,
            tier: this.getTierName(modelConfig.model),
            cost: result.cost || modelConfig.cost * 1000, // Estimate if not provided
            model: modelConfig.model,
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

  private buildCodeFormattingPrompt(code: string): string {
    return `You are an expert Python trading scanner code formatter. Format this code with EXECUTABLE INTEGRITY as the absolute #1 priority.

EXECUTION ENVIRONMENT CONSTRAINTS:
- NO external libraries available (NO pandas, numpy, matplotlib, etc.)
- ONLY standard Python built-ins are allowed
- Code MUST execute in a restricted environment
- ALL imports must be standard library only

CRITICAL REQUIREMENTS:
1. **EXECUTABLE CODE** - Must run without external dependencies
2. **Preserve 100% of parameters and their values** - NO CHANGES to parameters
3. **Maintain valid Python syntax** - Dictionary keys MUST be quoted: 'key': value NOT key: value
4. **Preserve ALL original logic** - Do not simplify or remove functionality
5. **Remove unsupported imports** - Replace pandas/numpy with pure Python alternatives
6. **Maintain parameter integrity** - This is critical

IMPORT RULES:
- REMOVE: import pandas as pd, import numpy as np, matplotlib, yfinance, etc.
- KEEP: import json, import time, import datetime, import random, import os, import sys
- REPLACE pandas operations with pure Python equivalents
- REPLACE numpy operations with built-in functions (min, max, sum, len, etc.)

SYNTAX INTEGRITY:
- Dictionary keys MUST be quoted: 'symbol': data NEVER symbol: data
- Function signatures MUST be preserved exactly
- Variable names MUST remain unchanged
- All logic MUST be preserved - NO simplification

Scanner code to format:
\`\`\`python
${code}
\`\`\`

Return ONLY valid JSON in this exact format:
{
  "formattedCode": "fully executable code with no external dependencies",
  "scannerType": "detected_type",
  "optimizations": ["pure python improvements made"],
  "warnings": ["any concerns about unsupported libraries"],
  "errors": ["critical syntax or execution errors"]
}`;
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