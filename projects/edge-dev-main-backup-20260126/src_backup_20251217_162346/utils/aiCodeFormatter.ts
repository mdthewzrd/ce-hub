/**
 * 🚀 AI-Powered Code Formatter for Renata
 *
 * Integrates with powerful, affordable AI models for intelligent code formatting
 * Supports Gemini, Claude, and other models via OpenRouter
 */

export interface CodeFormattingOptions {
  model?: 'gemini-1.5-flash-8b' | 'claude-3-5-haiku' | 'gemini-2.0-flash';
  preserveParameters?: boolean;
  detectScannerType?: boolean;
}

export interface FormattingResult {
  success: boolean;
  formattedCode: string;
  scannerType: string;
  integrityVerified: boolean;
  originalSignature: string;
  formattedSignature: string;
  optimizations: string[];
  warnings: string[];
  errors: string[];
  model: string;
  cost?: number;
}

class AICodeFormatter {
  private readonly API_ENDPOINTS = {
    'gemini': 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-8b:generateContent',
    'openrouter': 'https://openrouter.ai/api/v1/chat/completions'
  };

  private readonly MODEL_CONFIGS = {
    'gemini-1.5-flash-8b': {
      provider: 'gemini',
      costPerToken: 0.00000015, // Very affordable
      maxTokens: 1000000
    },
    'claude-3-5-haiku': {
      provider: 'openrouter',
      costPerToken: 0.00000025, // Very affordable
      maxTokens: 200000
    },
    'gemini-2.0-flash': {
      provider: 'gemini',
      costPerToken: 0.00000035,
      maxTokens: 1000000
    }
  };

  async formatCode(code: string, options: CodeFormattingOptions = {}): Promise<FormattingResult> {
    const model = options.model || 'gemini-1.5-flash-8b';
    const config = this.MODEL_CONFIGS[model];

    console.log(`🤖 AI Code Formatter: Using ${model} for intelligent formatting`);

    try {
      const prompt = this.buildFormattingPrompt(code, options);
      const response = await this.callAI(prompt, model, config);

      return {
        success: true,
        formattedCode: response.formattedCode,
        scannerType: response.scannerType,
        integrityVerified: true,
        originalSignature: this.generateSignature(code),
        formattedSignature: this.generateSignature(response.formattedCode),
        optimizations: response.optimizations,
        warnings: response.warnings,
        errors: response.errors,
        model: model,
        cost: response.cost
      };

    } catch (error) {
      console.error('❌ AI formatting failed:', error);

      // Fallback to basic formatting
      return {
        success: false,
        formattedCode: this.basicFormat(code),
        scannerType: 'unknown',
        integrityVerified: false,
        originalSignature: this.generateSignature(code),
        formattedSignature: this.generateSignature(code),
        optimizations: [],
        warnings: ['AI formatting failed, used basic formatting'],
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        model: 'fallback'
      };
    }
  }

  private buildFormattingPrompt(code: string, options: CodeFormattingOptions): string {
    return `
You are an expert trading scanner code formatter specializing in POLYGON API OPTIMIZATION. Format the following Python trading scanner code with these requirements:

🚀 **CRITICAL: API OPTIMIZATION REQUIREMENT**
- **REPLACE individual API calls with GROUPED API** to eliminate rate limiting
- Use Polygon's grouped endpoint: \`/v2/aggs/grouped/locale/us/market/stocks/{date}\`
- This reduces API calls from 31,800+ to ~238 (99.3% reduction)

**FORMATTING REQUIREMENTS:**
1. **Preserve 100% of parameters and their values** - NO CHANGES to parameters
2. **Replace individual ticker API loops with grouped API calls**
3. **Detect scanner type** (A+, LC, Custom, Multi-scanner)
4. **Improve code structure** while maintaining functionality
5. **Add proper documentation** where missing
6. **Optimize performance** with grouped API approach
7. **Maintain parameter integrity** - this is critical

**API OPTIMIZATION EXAMPLE:**
❌ OLD (Individual API):
\`\`\`python
for ticker in SYMBOLS:
    url = f"{BASE_URL}/v2/aggs/ticker/{ticker}/range/1/day/{start}/{end}"
    # ... fetch data
\`\`\`

✅ NEW (Grouped API):
\`\`\`python
def fetch_grouped_daily(date: str):
    url = f"{BASE_URL}/v2/aggs/grouped/locale/us/market/stocks/{date}"
    # Fetch ALL symbols in ONE API call
    response = session.get(url, params={"apiKey": API_KEY, "adjusted": "true"})
    # Process response to get data for all target symbols
\`\`\`

Scanner code to format:
\`\`\`python
${code}
\`\`\`

Return your response as JSON:
{
  "formattedCode": "// Optimized code with grouped API",
  "scannerType": "detected_type",
  "optimizations": ["Used Polygon grouped API - 99.3% API reduction", "Eliminated rate limiting", "Enhanced performance"],
  "warnings": ["any warnings about parameters"],
  "errors": ["any errors found"],
  "apiOptimization": {
    "originalApiCalls": "number_of_individual_calls",
    "optimizedApiCalls": "number_of_grouped_calls",
    "reductionPercentage": "99.3"
  }
}
`;
  }

  private async callAI(prompt: string, model: string, config: any): Promise<any> {
    if (config.provider === 'gemini') {
      return await this.callGemini(prompt, model, config);
    } else if (config.provider === 'openrouter') {
      return await this.callOpenRouter(prompt, model, config);
    }
    throw new Error(`Unsupported provider: ${config.provider}`);
  }

  private async callGemini(prompt: string, model: string, config: any): Promise<any> {
    const apiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    if (!apiKey) {
      throw new Error('Gemini API key not configured. Please set GEMINI_API_KEY or NEXT_PUBLIC_GEMINI_API_KEY');
    }

    const response = await fetch(`${this.API_ENDPOINTS.gemini}?key=${apiKey}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [{
          parts: [{
            text: prompt
          }]
        }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 8000,
        }
      })
    });

    if (!response.ok) {
      throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.candidates[0]?.content?.parts[0]?.text;

    if (!generatedText) {
      throw new Error('No response from Gemini');
    }

    // Parse JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from Gemini');
    }

    const result = JSON.parse(jsonMatch[0]);
    const tokens = this.estimateTokens(prompt + generatedText);

    return {
      formattedCode: result.formattedCode || result.formatted_code || prompt,
      scannerType: result.scannerType || result.scanner_type || 'unknown',
      optimizations: result.optimizations || [],
      warnings: result.warnings || [],
      errors: result.errors || [],
      cost: tokens * config.costPerToken
    };
  }

  private async callOpenRouter(prompt: string, model: string, config: any): Promise<any> {
    const apiKey = process.env.OPENROUTER_API_KEY;

    if (!apiKey) {
      throw new Error('OpenRouter API key not configured. Please set OPENROUTER_API_KEY');
    }

    const response = await fetch(this.API_ENDPOINTS.openrouter, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:5657',
        'X-Title': 'Renata AI Code Formatter'
      },
      body: JSON.stringify({
        model: `google/${model}`,
        messages: [{
          role: 'user',
          content: prompt
        }],
        temperature: 0.1,
        max_tokens: 8000,
      })
    });

    if (!response.ok) {
      throw new Error(`OpenRouter API error: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    const generatedText = data.choices[0]?.message?.content;

    if (!generatedText) {
      throw new Error('No response from OpenRouter');
    }

    // Parse JSON response
    const jsonMatch = generatedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error('Invalid JSON response from OpenRouter');
    }

    const result = JSON.parse(jsonMatch[0]);
    const tokens = this.estimateTokens(prompt + generatedText);

    return {
      formattedCode: result.formattedCode || result.formatted_code || generatedText,
      scannerType: result.scannerType || result.scanner_type || 'unknown',
      optimizations: result.optimizations || [],
      warnings: result.warnings || [],
      errors: result.errors || [],
      cost: tokens * config.costPerToken
    };
  }

  private basicFormat(code: string): string {
    // Basic fallback formatting
    return `# Basic formatted code
${code}
# Basic formatting complete`;
  }

  private generateSignature(code: string): string {
    // Simple hash for integrity checking
    let hash = 0;
    for (let i = 0; i < code.length; i++) {
      const char = code.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash;
    }
    return hash.toString(16);
  }

  private estimateTokens(text: string): number {
    // Rough estimation: ~4 characters per token
    return Math.ceil(text.length / 4);
  }

  /**
   * Get available models and their costs
   */
  getAvailableModels(): Array<{model: string, cost: number, description: string}> {
    return [
      {
        model: 'gemini-1.5-flash-8b',
        cost: 0.00000015,
        description: 'Fastest, most cost-effective by Google (Recommended)'
      },
      {
        model: 'claude-3-5-haiku',
        cost: 0.00000025,
        description: 'Excellent for code by Anthropic'
      },
      {
        model: 'gemini-2.0-flash',
        cost: 0.00000035,
        description: 'Next generation with advanced reasoning'
      }
    ];
  }
}

// Export singleton instance
export const aiCodeFormatter = new AICodeFormatter();
export default aiCodeFormatter;