/**
 * Vision Processing Service
 * Multi-modal image analysis with GPT-4V and Claude integration
 */

// ========== TYPES ==========

export type VisionProvider = 'gpt-4v' | 'claude-3.5-sonnet' | 'claude-3.5-opus' | 'tesseract';

export interface VisionAnalysisRequest {
  image_url?: string;
  image_base64?: string;
  prompt: string;
  provider: VisionProvider;
  options?: VisionAnalysisOptions;
}

export interface VisionAnalysisOptions {
  max_tokens?: number;
  temperature?: number;
  detail?: 'low' | 'high' | 'auto';
  extract_code?: boolean;
  extract_charts?: boolean;
  detect_ui?: boolean;
  ocr_fallback?: boolean;
}

export interface VisionAnalysisResult {
  success: boolean;
  provider: VisionProvider;
  analysis: {
    description?: string;
    code_blocks?: CodeBlock[];
    chart_data?: ChartData;
    ui_elements?: UIElement[];
    text_content?: string;
    confidence: number;
  };
  metadata: {
    processed_at: Date;
    processing_time_ms: number;
    image_format?: string;
    image_size_bytes?: number;
  };
  error?: string;
}

export interface CodeBlock {
  language: string;
  code: string;
  start_line?: number;
  end_line?: number;
  confidence: number;
}

export interface ChartData {
  chart_type?: 'line' | 'bar' | 'pie' | 'scatter' | 'candlestick' | 'unknown';
  title?: string;
  axes?: {
    x_axis?: string;
    y_axis?: string;
    x_label?: string;
    y_label?: string;
  };
  data_points?: Array<{
    x: any;
    y: any;
    label?: string;
  }>;
  confidence: number;
}

export interface UIElement {
  type: 'button' | 'input' | 'text' | 'image' | 'table' | 'chart' | 'dropdown' | 'checkbox' | 'unknown';
  label?: string;
  position?: { x: number; y: number; width: number; height: number };
  attributes?: Record<string, any>;
  confidence: number;
}

export interface ScreenshotAnalysis {
  summary: string;
  ui_components: UIElement[];
  text_content: string[];
  interactive_elements: Array<{
    type: string;
    label: string;
    action?: string;
  }>;
  code_detected: boolean;
  charts_detected: boolean;
  confidence: number;
}

// ========== SERVICE ==========

class VisionProcessingService {
  private apiKey: string;
  private apiEndpoint: string;
  private defaultProvider: VisionProvider = 'claude-3.5-sonnet';

  constructor() {
    // Initialize with OpenRouter API (supports multiple vision models)
    this.apiKey = process.env.OPENROUTER_API_KEY || '';
    this.apiEndpoint = 'https://openrouter.ai/api/v1/chat/completions';
  }

  // ========== MAIN ANALYSIS ==========

  async analyzeImage(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    const startTime = Date.now();

    try {
      if (!request.image_url && !request.image_base64) {
        throw new Error('Either image_url or image_base64 must be provided');
      }

      let result: VisionAnalysisResult;

      switch (request.provider) {
        case 'gpt-4v':
          result = await this.analyzeWithGPT4V(request);
          break;
        case 'claude-3.5-sonnet':
        case 'claude-3.5-opus':
          result = await this.analyzeWithClaude(request);
          break;
        case 'tesseract':
          result = await this.analyzeWithTesseract(request);
          break;
        default:
          result = await this.analyzeWithClaude(request);
      }

      result.metadata = {
        ...result.metadata,
        processed_at: new Date(),
        processing_time_ms: Date.now() - startTime
      };

      return result;

    } catch (error) {
      return {
        success: false,
        provider: request.provider,
        analysis: { confidence: 0 },
        metadata: {
          processed_at: new Date(),
          processing_time_ms: Date.now() - startTime
        },
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  // ========== PROVIDER-SPECIFIC ANALYSIS ==========

  private async analyzeWithGPT4V(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    try {
      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ce-hub.dev',
          'X-Title': 'Renata Vision Processing'
        },
        body: JSON.stringify({
          model: 'openai/gpt-4-vision-preview',
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: this.buildAnalysisPrompt(request.prompt, request.options) },
                {
                  type: 'image_url',
                  image_url: {
                    url: request.image_base64 || request.image_url,
                    detail: request.options?.detail || 'auto'
                  }
                }
              ]
            }
          ],
          max_tokens: request.options?.max_tokens || 2000,
          temperature: request.options?.temperature || 0.7
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'GPT-4V API error');
      }

      const analysis = this.parseAnalysisResponse(data.choices[0].message.content, request.options);

      return {
        success: true,
        provider: 'gpt-4v',
        analysis,
        metadata: {
          processed_at: new Date(),
          processing_time_ms: 0
        }
      };

    } catch (error) {
      throw new Error(`GPT-4V analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeWithClaude(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    try {
      const model = request.provider === 'claude-3.5-opus'
        ? 'anthropic/claude-3.5-opus'
        : 'anthropic/claude-3.5-sonnet';

      const response = await fetch(this.apiEndpoint, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': 'https://ce-hub.dev',
          'X-Title': 'Renata Vision Processing'
        },
        body: JSON.stringify({
          model,
          messages: [
            {
              role: 'user',
              content: [
                { type: 'text', text: this.buildAnalysisPrompt(request.prompt, request.options) },
                {
                  type: 'image_url',
                  image_url: {
                    url: request.image_base64 || request.image_url
                  }
                }
              ]
            }
          ],
          max_tokens: request.options?.max_tokens || 4096
        })
      });

      const data = await response.json();

      if (data.error) {
        throw new Error(data.error.message || 'Claude API error');
      }

      const analysis = this.parseAnalysisResponse(data.choices[0].message.content, request.options);

      return {
        success: true,
        provider: request.provider,
        analysis,
        metadata: {
          processed_at: new Date(),
          processing_time_ms: 0
        }
      };

    } catch (error) {
      throw new Error(`Claude analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  private async analyzeWithTesseract(request: VisionAnalysisRequest): Promise<VisionAnalysisResult> {
    // Tesseract OCR fallback for basic text extraction
    try {
      // Note: This would require Tesseract.js in a browser environment
      // For Node.js backend, you'd use a different OCR library
      const result: VisionAnalysisResult = {
        success: true,
        provider: 'tesseract',
        analysis: {
          text_content: 'OCR functionality requires Tesseract.js integration',
          confidence: 0.5
        },
        metadata: {
          processed_at: new Date(),
          processing_time_ms: 0
        }
      };

      return result;
    } catch (error) {
      throw new Error(`Tesseract analysis failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // ========== SPECIALIZED ANALYSIS ==========

  async analyzeScreenshot(imageUrl: string): Promise<ScreenshotAnalysis> {
    const request: VisionAnalysisRequest = {
      image_url: imageUrl,
      prompt: 'Analyze this screenshot. Describe the UI components, text content, interactive elements, and overall layout.',
      provider: this.defaultProvider,
      options: {
        detect_ui: true,
        extract_code: true,
        extract_charts: true
      }
    };

    const result = await this.analyzeImage(request);

    if (!result.success || !result.analysis.description) {
      throw new Error(result.error || 'Failed to analyze screenshot');
    }

    return this.parseScreenshotAnalysis(result.analysis);
  }

  async extractCodeFromImage(imageUrl: string, languageHint?: string): Promise<CodeBlock[]> {
    const prompt = languageHint
      ? `Extract all code blocks from this image. The code is likely written in ${languageHint}. Provide the complete, formatted code.`
      : 'Extract all code blocks from this image. Identify the programming language and provide complete, formatted code.';

    const request: VisionAnalysisRequest = {
      image_url: imageUrl,
      prompt,
      provider: this.defaultProvider,
      options: {
        extract_code: true,
        max_tokens: 4096
      }
    };

    const result = await this.analyzeImage(request);

    if (!result.success) {
      throw new Error(result.error || 'Failed to extract code');
    }

    return result.analysis.code_blocks || [];
  }

  async extractChartFromImage(imageUrl: string): Promise<ChartData> {
    const prompt = `Analyze this chart image. Extract:
1. The chart type (line, bar, pie, scatter, candlestick, etc.)
2. Chart title and axis labels
3. All data points visible
4. Any trends or patterns you notice

Provide the data in a structured format.`;

    const request: VisionAnalysisRequest = {
      image_url: imageUrl,
      prompt,
      provider: this.defaultProvider,
      options: {
        extract_charts: true,
        max_tokens: 4096
      }
    };

    const result = await this.analyzeImage(request);

    if (!result.success || !result.analysis.chart_data) {
      throw new Error(result.error || 'Failed to extract chart data');
    }

    return result.analysis.chart_data;
  }

  async analyzeTechnicalDiagram(imageUrl: string): Promise<{
    description: string;
    components: Array<{
      type: string;
      label: string;
      connections: string[];
    }>;
    flow?: string[];
  }> {
    const prompt = `Analyze this technical diagram. Describe:
1. The type of diagram (flowchart, sequence diagram, architecture diagram, etc.)
2. All components and their labels
3. Relationships and connections between components
4. The overall flow or process illustrated

Provide a detailed technical analysis.`;

    const request: VisionAnalysisRequest = {
      image_url: imageUrl,
      prompt,
      provider: this.defaultProvider,
      options: {
        detect_ui: true,
        max_tokens: 4096
      }
    };

    const result = await this.analyzeImage(request);

    if (!result.success) {
      throw new Error(result.error || 'Failed to analyze diagram');
    }

    // Parse technical diagram from description
    return this.parseTechnicalDiagram(result.analysis.description || '');
  }

  // ========== PROMPT BUILDING ==========

  private buildAnalysisPrompt(userPrompt: string, options?: VisionAnalysisOptions): string {
    let prompt = userPrompt;

    if (options?.extract_code) {
      prompt += '\n\nIf there is code in this image, extract it and identify the programming language.';
    }

    if (options?.extract_charts) {
      prompt += '\n\nIf there is a chart or graph in this image, extract the data points and identify the chart type.';
    }

    if (options?.detect_ui) {
      prompt += '\n\nIdentify all UI components (buttons, inputs, text areas, images, tables, etc.) and their positions.';
    }

    return prompt;
  }

  // ========== RESPONSE PARSING ==========

  private parseAnalysisResponse(content: string, options?: VisionAnalysisOptions): VisionAnalysisResult['analysis'] {
    const analysis: VisionAnalysisResult['analysis'] = {
      description: content,
      confidence: 0.85
    };

    // Extract code blocks
    if (options?.extract_code) {
      analysis.code_blocks = this.extractCodeBlocks(content);
    }

    // Extract chart data
    if (options?.extract_charts) {
      analysis.chart_data = this.extractChartData(content);
    }

    // Extract UI elements
    if (options?.detect_ui) {
      analysis.ui_elements = this.extractUIElements(content);
    }

    // Extract text content
    analysis.text_content = this.extractTextContent(content);

    return analysis;
  }

  private extractCodeBlocks(content: string): CodeBlock[] {
    const codeBlocks: CodeBlock[] = [];
    const codeBlockRegex = /```(\w+)?\n([\s\S]*?)```/g;

    let match;
    while ((match = codeBlockRegex.exec(content)) !== null) {
      const language = match[1] || 'unknown';
      const code = match[2].trim();

      codeBlocks.push({
        language,
        code,
        confidence: 0.9
      });
    }

    return codeBlocks;
  }

  private extractChartData(content: string): ChartData | undefined {
    // Try to parse chart data from text response
    const chartData: ChartData = {
      confidence: 0.7
    };

    // Detect chart type
    if (content.toLowerCase().includes('line chart')) {
      chartData.chart_type = 'line';
    } else if (content.toLowerCase().includes('bar chart')) {
      chartData.chart_type = 'bar';
    } else if (content.toLowerCase().includes('pie chart')) {
      chartData.chart_type = 'pie';
    } else if (content.toLowerCase().includes('scatter')) {
      chartData.chart_type = 'scatter';
    } else if (content.toLowerCase().includes('candlestick')) {
      chartData.chart_type = 'candlestick';
    }

    // Try to extract data points (look for patterns like "x: 1, y: 2")
    const dataPointRegex = /(?:x|horizontal|category)[:\s]*([^\n,]+),\s*(?:y|vertical|value)[:\s]*([^\n,]+)/gi;
    const dataPoints: Array<{ x: any; y: any }> = [];

    let match;
    while ((match = dataPointRegex.exec(content)) !== null) {
      const x = isNaN(Number(match[1])) ? match[1].trim() : Number(match[1]);
      const y = Number(match[2]);

      if (!isNaN(y)) {
        dataPoints.push({ x, y });
      }
    }

    if (dataPoints.length > 0) {
      chartData.data_points = dataPoints;
      return chartData;
    }

    return undefined;
  }

  private extractUIElements(content: string): UIElement[] {
    const uiElements: UIElement[] = [];

    // Look for UI component mentions
    const uiPatterns = [
      { type: 'button', regex: /button[:\s]*["']([^"']+)["']/gi },
      { type: 'input', regex: /input[:\s]*["']([^"']+)["']/gi },
      { type: 'dropdown', regex: /dropdown[:\s]*["']([^"']+)["']/gi },
      { type: 'text', regex: /text[:\s]*["']([^"']+)["']/gi },
    ];

    uiPatterns.forEach(pattern => {
      let match;
      while ((match = pattern.regex.exec(content)) !== null) {
        uiElements.push({
          type: pattern.type as any,
          label: match[1],
          confidence: 0.8
        });
      }
    });

    return uiElements;
  }

  private extractTextContent(content: string): string {
    // Extract plain text, removing code blocks and markdown
    return content
      .replace(/```[\s\S]*?```/g, '[CODE BLOCK]')
      .replace(/!\[.*?\]\(.*?\)/g, '[IMAGE]')
      .replace(/\*\*([^*]+)\*\*/g, '$1')
      .replace(/\*([^*]+)\*/g, '$1')
      .trim();
  }

  private parseScreenshotAnalysis(analysis: any): ScreenshotAnalysis {
    return {
      summary: analysis.description || '',
      ui_components: analysis.ui_elements || [],
      text_content: analysis.text_content ? [analysis.text_content] : [],
      interactive_elements: (analysis.ui_elements || [])
        .filter((el: any) => ['button', 'input', 'dropdown', 'checkbox'].includes(el.type))
        .map((el: any) => ({
          type: el.type,
          label: el.label || '',
          action: undefined
        })),
      code_detected: (analysis.code_blocks || []).length > 0,
      charts_detected: !!analysis.chart_data,
      confidence: analysis.confidence || 0
    };
  }

  private parseTechnicalDiagram(content: string): {
    description: string;
    components: any[];
    flow?: string[];
  } {
    // Parse technical diagram components from text
    const components: any[] = [];
    const componentRegex = /(?:component|element|node)[:\s]*([^\n,]+)/gi;

    let match;
    while ((match = componentRegex.exec(content)) !== null) {
      components.push({
        type: 'unknown',
        label: match[1].trim(),
        connections: []
      });
    }

    // Extract flow/sequence if present
    const flowMatch = content.match(/(?:flow|sequence|process)[:\s]*([^\n]+)/i);
    const flow = flowMatch ? flowMatch[1].split(/->|→|,/) : undefined;

    return {
      description: content,
      components,
      flow
    };
  }

  // ========== UTILITY METHODS ==========

  getDefaultProvider(): VisionProvider {
    return this.defaultProvider;
  }

  setDefaultProvider(provider: VisionProvider): void {
    this.defaultProvider = provider;
  }

  isAvailable(): boolean {
    return !!this.apiKey;
  }

  getSupportedProviders(): VisionProvider[] {
    return ['gpt-4v', 'claude-3.5-sonnet', 'claude-3.5-opus', 'tesseract'];
  }

  async validateApiKey(provider: VisionProvider): Promise<boolean> {
    try {
      const testRequest: VisionAnalysisRequest = {
        image_base64: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNk+M9QDwADhgGAWjR9awAAAABJRU5ErkJggg==', // 1x1 transparent PNG
        prompt: 'Test',
        provider
      };

      const result = await this.analyzeImage(testRequest);
      return result.success;
    } catch {
      return false;
    }
  }
}

// Singleton instance
let instance: VisionProcessingService | null = null;

export const getVisionProcessing = (): VisionProcessingService => {
  if (!instance) {
    instance = new VisionProcessingService();
  }
  return instance;
};

export type { VisionProcessingService };
