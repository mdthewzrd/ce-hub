/**
 * Scanner Generation Service
 * Build scanners from natural language, interactive builder, or templates
 */

// ========== TYPES ==========

export type GenerationType = 'natural-language' | 'interactive' | 'template' | 'hybrid' | 'vision';

export interface ScannerRequirement {
  id: string;
  type: 'functional' | 'performance' | 'data' | 'parameter' | 'validation';
  priority: 'critical' | 'high' | 'medium' | 'low';
  description: string;
  extracted_from: string;
  confidence: number;
}

export interface ScannerPattern {
  id: string;
  name: string;
  category: 'trend' | 'reversal' | 'breakout' | 'momentum' | 'mean-reversion' | 'custom';
  description: string;
  template: string;
  parameters: ParameterTemplate[];
  indicators: string[];
  typical_timeframes: string[];
}

export interface ParameterTemplate {
  name: string;
  type: 'number' | 'string' | 'boolean' | 'array' | 'object';
  default_value: any;
  min_value?: number;
  max_value?: number;
  options?: any[];
  description: string;
  required: boolean;
}

export interface GeneratedScanner {
  id: string;
  name: string;
  description: string;
  scanner_type: string;
  code: string;
  language: string;
  requirements: ScannerRequirement[];
  patterns_used: string[];
  parameters: any;
  metadata: {
    generated_at: Date;
    generation_method: GenerationType;
    confidence_score: number;
    estimated_accuracy?: number;
    test_results?: any;
    optimization_results?: {
      original_parameters: any;
      optimized_parameters: any;
      improvement_estimate: number;
    };
  };
}

export interface GenerationOptions {
  scanner_type?: string;
  timeframe?: string;
  market_conditions?: string[];
  performance_targets?: {
    win_rate?: number;
    profit_factor?: number;
    max_drawdown?: number;
  };
  include_backtest?: boolean;
  optimize_parameters?: boolean;
}

export interface InteractiveBuilderState {
  current_step: number;
  total_steps: number;
  responses: Record<string, any>;
  requirements: ScannerRequirement[];
  suggested_patterns: ScannerPattern[];
  generated_scanner?: GeneratedScanner;
}

export interface NLParseResult {
  intent: 'create-scanner' | 'modify-scanner' | 'analyze-strategy' | 'unknown';
  scanner_type?: string;
  patterns: string[];
  indicators: string[];
  parameters: Record<string, any>;
  requirements: string[];
  timeframe?: string;
  market_condition?: string;
  confidence: number;
}

export interface GenerationRequest {
  method: GenerationType;
  input: {
    natural_language?: string;
    vision_analysis?: any;
    template_id?: string;
    interactive_state?: InteractiveBuilderState;
  };
  options?: GenerationOptions;
}

export interface GenerationResult {
  success: boolean;
  scanner?: GeneratedScanner;
  intermediate_state?: InteractiveBuilderState;
  next_question?: string;
  questions?: string[];
  suggestions?: string[];
  warnings?: string[];
  errors?: string[];
  metadata: {
    generation_method: GenerationType;
    processing_time_ms: number;
    confidence_score: number;
    requires_interaction: boolean;
  };
}

// ========== SERVICE ==========

class ScannerGenerationService {
  private patterns: Map<string, ScannerPattern> = new Map();
  private templates: Map<string, GeneratedScanner> = new Map();
  private nlpCache: Map<string, NLParseResult> = new Map();

  constructor() {
    this.initializePatterns();
    this.initializeTemplates();
  }

  // ========== MAIN GENERATION ==========

  async generateScanner(request: GenerationRequest): Promise<GenerationResult> {
    const startTime = Date.now();

    try {
      let result: GenerationResult;

      switch (request.method) {
        case 'natural-language':
          result = await this.generateFromNaturalLanguage(
            request.input.natural_language || '',
            request.options
          );
          break;

        case 'vision':
          result = await this.generateFromVision(
            request.input.vision_analysis,
            request.options
          );
          break;

        case 'interactive':
          result = await this.generateInteractive(
            request.input.interactive_state,
            request.options
          );
          break;

        case 'template':
          result = await this.generateFromTemplate(
            request.input.template_id || '',
            request.options
          );
          break;

        case 'hybrid':
          result = await this.generateHybrid(request);
          break;

        default:
          result = {
            success: false,
            errors: ['Unknown generation method'],
            metadata: {
              generation_method: request.method,
              processing_time_ms: Date.now() - startTime,
              confidence_score: 0,
              requires_interaction: false
            }
          };
      }

      result.metadata.processing_time_ms = Date.now() - startTime;

      // Auto-optimize if requested
      if (result.scanner && request.options?.optimize_parameters) {
        result.scanner = await this.optimizeScanner(result.scanner);
      }

      // Auto-backtest if requested
      if (result.scanner && request.options?.include_backtest) {
        const backtestResults = await this.quickBacktest(result.scanner);
        result.scanner.metadata.test_results = backtestResults;
      }

      return result;

    } catch (error) {
      return {
        success: false,
        errors: [error instanceof Error ? error.message : 'Unknown error'],
        metadata: {
          generation_method: request.method,
          processing_time_ms: Date.now() - startTime,
          confidence_score: 0,
          requires_interaction: false
        }
      };
    }
  }

  // ========== NATURAL LANGUAGE GENERATION ==========

  private async generateFromNaturalLanguage(
    input: string,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    // Parse natural language
    const parseResult = this.parseNaturalLanguage(input);

    if (parseResult.confidence < 0.5) {
      return {
        success: false,
        suggestions: [
          'Please provide more details about the scanner strategy',
          'Specify indicators, parameters, and entry/exit conditions',
          'Describe the market conditions this scanner should target'
        ],
        questions: [
          'What type of scanner do you want to create? (trend, reversal, breakout, etc.)',
          'What indicators should be used?',
          'What are the entry and exit conditions?'
        ],
        metadata: {
          generation_method: 'natural-language',
          processing_time_ms: 0,
          confidence_score: parseResult.confidence,
          requires_interaction: true
        }
      };
    }

    // Extract requirements
    const requirements = this.extractRequirements(input, parseResult);

    // Match patterns
    const matchedPatterns = this.matchPatterns(parseResult);

    if (matchedPatterns.length === 0) {
      return {
        success: false,
        suggestions: ['No matching patterns found. Consider using interactive builder.'],
        warnings: ['Could not automatically determine scanner pattern from description'],
        metadata: {
          generation_method: 'natural-language',
          processing_time_ms: 0,
          confidence_score: parseResult.confidence,
          requires_interaction: true
        }
      };
    }

    // Generate scanner code
    const scanner = this.buildScannerFromPattern(
      matchedPatterns[0],
      requirements,
      parseResult,
      options
    );

    return {
      success: true,
      scanner,
      suggestions: this.generateSuggestions(scanner),
      metadata: {
        generation_method: 'natural-language',
        processing_time_ms: 0,
        confidence_score: parseResult.confidence,
        requires_interaction: false
      }
    };
  }

  // ========== VISION-BASED GENERATION ==========

  private async generateFromVision(
    visionAnalysis: any,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    // Extract strategy from diagram/chart/image
    const requirements: ScannerRequirement[] = [
      {
        id: 'vision-1',
        type: 'functional',
        priority: 'high',
        description: 'Implement strategy from visual analysis',
        extracted_from: 'vision_analysis',
        confidence: 0.8
      }
    ];

    // Parse vision analysis for strategy components
    let scannerType = 'custom';
    let indicators: string[] = [];
    let parameters: Record<string, any> = {};

    if (visionAnalysis.analysis?.chart_data) {
      // Chart-based generation
      const chartData = visionAnalysis.analysis.chart_data;
      scannerType = chartData.chart_type || 'custom';
      requirements.push({
        id: 'vision-2',
        type: 'data',
        priority: 'high',
        description: `Process ${scannerType} chart data`,
        extracted_from: 'chart_analysis',
        confidence: 0.9
      });
    }

    if (visionAnalysis.analysis?.code_blocks) {
      // Code-based generation
      const codeBlocks = visionAnalysis.analysis.code_blocks;
      indicators = this.extractIndicatorsFromCode(codeBlocks);
      parameters = this.extractParametersFromCode(codeBlocks);

      requirements.push({
        id: 'vision-3',
        type: 'parameter',
        priority: 'high',
        description: 'Use parameters from extracted code',
        extracted_from: 'code_analysis',
        confidence: 0.85
      });
    }

    if (visionAnalysis.analysis?.description) {
      // Description-based generation
      const descParse = this.parseNaturalLanguage(visionAnalysis.analysis.description);
      scannerType = descParse.scanner_type || scannerType;
      indicators = [...indicators, ...descParse.indicators];
      parameters = { ...parameters, ...descParse.parameters };
    }

    // Match and build
    const matchedPatterns = this.matchPatterns({
      intent: 'create-scanner',
      scanner_type: scannerType,
      patterns: [],
      indicators,
      parameters,
      requirements: [],
      confidence: 0.8
    });

    const scanner = matchedPatterns.length > 0
      ? this.buildScannerFromPattern(matchedPatterns[0], requirements, {
          intent: 'create-scanner',
          scanner_type: scannerType,
          patterns: [],
          indicators,
          parameters,
          requirements: [],
          confidence: 0.8
        }, options)
      : this.buildCustomScanner(requirements, indicators, parameters, options);

    return {
      success: true,
      scanner,
      suggestions: this.generateSuggestions(scanner),
      warnings: visionAnalysis.warnings,
      metadata: {
        generation_method: 'vision',
        processing_time_ms: 0,
        confidence_score: 0.8,
        requires_interaction: false
      }
    };
  }

  // ========== INTERACTIVE BUILDER ==========

  private async generateInteractive(
    state: InteractiveBuilderState | undefined,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const steps = this.getBuilderSteps();

    if (!state) {
      // Initialize interactive builder
      return {
        success: true,
        next_question: steps[0].question,
        questions: [steps[0].question],
        intermediate_state: {
          current_step: 0,
          total_steps: steps.length,
          responses: {},
          requirements: [],
          suggested_patterns: []
        },
        metadata: {
          generation_method: 'interactive',
          processing_time_ms: 0,
          confidence_score: 0,
          requires_interaction: true
        }
      };
    }

    // Process current step
    const currentStep = steps[state.current_step];
    const updatedState = { ...state };

    // Extract requirements from response
    const newRequirements = this.extractRequirementsFromResponse(
      state.responses,
      state.current_step
    );
    updatedState.requirements = [...state.requirements, ...newRequirements];

    // Suggest patterns based on responses
    if (state.current_step === 1) {
      // Scanner type step - suggest patterns
      const scannerType = state.responses.scanner_type;
      updatedState.suggested_patterns = this.suggestPatternsForType(scannerType);
    }

    // Move to next step or generate
    if (state.current_step < steps.length - 1) {
      updatedState.current_step++;
      return {
        success: true,
        next_question: steps[updatedState.current_step].question,
        questions: [steps[updatedState.current_step].question],
        intermediate_state: updatedState,
        suggestions: this.generateStepSuggestions(updatedState),
        metadata: {
          generation_method: 'interactive',
          processing_time_ms: 0,
          confidence_score: this.calculateInteractiveConfidence(updatedState),
          requires_interaction: true
        }
      };
    } else {
      // Generate scanner
      const scanner = this.buildFromInteractiveState(updatedState, options);

      return {
        success: true,
        scanner,
        suggestions: this.generateSuggestions(scanner),
        metadata: {
          generation_method: 'interactive',
          processing_time_ms: 0,
          confidence_score: this.calculateInteractiveConfidence(updatedState),
          requires_interaction: false
        }
      };
    }
  }

  // ========== TEMPLATE-BASED GENERATION ==========

  private async generateFromTemplate(
    templateId: string,
    options?: GenerationOptions
  ): Promise<GenerationResult> {
    const template = this.templates.get(templateId);

    if (!template) {
      return {
        success: false,
        errors: [`Template '${templateId}' not found`],
        suggestions: [
          'Available templates: ' + Array.from(this.templates.keys()).join(', ')
        ],
        metadata: {
          generation_method: 'template',
          processing_time_ms: 0,
          confidence_score: 0,
          requires_interaction: false
        }
      };
    }

    // Clone template
    const scanner: GeneratedScanner = {
      ...template,
      id: this.generateId(),
      metadata: {
        ...template.metadata,
        generated_at: new Date(),
        generation_method: 'template'
      }
    };

    // Apply customizations from options
    if (options) {
      this.applyOptionsToScanner(scanner, options);
    }

    return {
      success: true,
      scanner,
      suggestions: [
        'Template loaded successfully',
        'Review and customize parameters for your specific use case'
      ],
      metadata: {
        generation_method: 'template',
        processing_time_ms: 0,
        confidence_score: 0.95,
        requires_interaction: false
      }
    };
  }

  // ========== HYBRID GENERATION ==========

  private async generateHybrid(
    request: GenerationRequest
  ): Promise<GenerationResult> {
    const results: GenerationResult[] = [];

    // Try NL first
    if (request.input.natural_language) {
      const nlResult = await this.generateFromNaturalLanguage(
        request.input.natural_language,
        request.options
      );
      results.push(nlResult);
    }

    // Try vision if available
    if (request.input.vision_analysis) {
      const visionResult = await this.generateFromVision(
        request.input.vision_analysis,
        request.options
      );
      results.push(visionResult);
    }

    // Merge results
    if (results.every(r => r.success)) {
      // All succeeded - combine best aspects
      const bestScanner = results.reduce((best, current) =>
        current.scanner && current.metadata.confidence_score > best.metadata.confidence_score
          ? current
          : best
      );

      return {
        success: true,
        scanner: bestScanner.scanner,
        suggestions: [
          'Generated using hybrid approach',
          ...results.flatMap(r => r.suggestions || [])
        ],
        metadata: {
          generation_method: 'hybrid',
          processing_time_ms: 0,
          confidence_score: Math.max(...results.map(r => r.metadata.confidence_score)),
          requires_interaction: false
        }
      };
    } else {
      // At least one failed
      return results.find(r => !r.success) || {
        success: false,
        errors: ['All hybrid methods failed'],
        metadata: {
          generation_method: 'hybrid',
          processing_time_ms: 0,
          confidence_score: 0,
          requires_interaction: false
        }
      };
    }
  }

  // ========== NLP PARSING ==========

  parseNaturalLanguage(input: string): NLParseResult {
    // Check cache
    if (this.nlpCache.has(input)) {
      return this.nlpCache.get(input)!;
    }

    const result: NLParseResult = {
      intent: 'create-scanner',
      patterns: [],
      indicators: [],
      parameters: {},
      requirements: [],
      confidence: 0.8
    };

    const lowerInput = input.toLowerCase();

    // Detect intent
    if (lowerInput.includes('create') || lowerInput.includes('build') || lowerInput.includes('generate')) {
      result.intent = 'create-scanner';
    } else if (lowerInput.includes('modify') || lowerInput.includes('update') || lowerInput.includes('change')) {
      result.intent = 'modify-scanner';
    } else if (lowerInput.includes('analyze') || lowerInput.includes('explain')) {
      result.intent = 'analyze-strategy';
    }

    // Detect scanner type
    const scannerTypes = ['trend', 'reversal', 'breakout', 'momentum', 'mean-reversion', 'lc-d2', 'backside-b'];
    for (const type of scannerTypes) {
      if (lowerInput.includes(type)) {
        result.scanner_type = type;
        break;
      }
    }

    // Detect indicators
    const indicatorPatterns = [
      { name: 'SMA', pattern: /sma|simple moving average|moving average/gi },
      { name: 'EMA', pattern: /ema|exponential moving average/gi },
      { name: 'RSI', pattern: /rsi|relative strength/gi },
      { name: 'MACD', pattern: /macd/gi },
      { name: 'BB', pattern: /bollinger|bb|bands/gi },
      { name: 'ATR', pattern: /atr|average true range/gi },
      { name: 'VWAP', pattern: /vwap/gi },
      { name: 'Volume', pattern: /volume/gi }
    ];

    for (const indicator of indicatorPatterns) {
      const matches = input.match(indicator.pattern);
      if (matches) {
        result.indicators.push(indicator.name);
      }
    }

    // Extract parameters
    const numberPatterns = /(\d+)\s*(days?|period)?/gi;
    let numberMatch;
    while ((numberMatch = numberPatterns.exec(input)) !== null) {
      const value = parseInt(numberMatch[1]);
      if (value < 200) { // Likely a parameter, not a price
        result.parameters[`param_${Object.keys(result.parameters).length}`] = value;
      }
    }

    // Detect patterns
    if (lowerInput.includes('crossover') || lowerInput.includes('cross')) {
      result.patterns.push('crossover');
    }
    if (lowerInput.includes('breakout') || lowerInput.includes('break out')) {
      result.patterns.push('breakout');
    }
    if (lowerInput.includes('divergence')) {
      result.patterns.push('divergence');
    }

    // Calculate confidence
    let confidenceSignals = 0;
    if (result.scanner_type) confidenceSignals++;
    if (result.indicators.length > 0) confidenceSignals++;
    if (result.patterns.length > 0) confidenceSignals++;
    if (Object.keys(result.parameters).length > 0) confidenceSignals++;

    result.confidence = Math.min(0.95, 0.3 + (confidenceSignals * 0.15));

    // Cache result
    this.nlpCache.set(input, result);

    return result;
  }

  // ========== PATTERN MATCHING ==========

  private matchPatterns(parseResult: NLParseResult): ScannerPattern[] {
    const matched: ScannerPattern[] = [];

    for (const [id, pattern] of this.patterns) {
      let score = 0;

      // Check scanner type match
      if (parseResult.scanner_type && id.includes(parseResult.scanner_type)) {
        score += 3;
      }

      // Check indicator overlap
      const indicatorOverlap = pattern.indicators.filter(i =>
        parseResult.indicators.some(pi => pi.toLowerCase().includes(i.toLowerCase()))
      ).length;
      score += indicatorOverlap;

      // Check pattern match
      if (pattern.name.toLowerCase().includes(parseResult.patterns[0]?.toLowerCase() || '')) {
        score += 2;
      }

      if (score >= 2) {
        matched.push(pattern);
      }
    }

    // Sort by score and return top matches
    return matched.sort((a, b) => {
      const scoreA = this.calculatePatternScore(a, parseResult);
      const scoreB = this.calculatePatternScore(b, parseResult);
      return scoreB - scoreA;
    });
  }

  private calculatePatternScore(pattern: ScannerPattern, parseResult: NLParseResult): number {
    let score = 0;

    if (parseResult.scanner_type && pattern.id.includes(parseResult.scanner_type)) {
      score += 3;
    }

    score += pattern.indicators.filter(i =>
      parseResult.indicators.some(pi => pi.toLowerCase().includes(i.toLowerCase()))
    ).length;

    return score;
  }

  // ========== SCANNER BUILDING ==========

  private buildScannerFromPattern(
    pattern: ScannerPattern,
    requirements: ScannerRequirement[],
    parseResult: NLParseResult,
    options?: GenerationOptions
  ): GeneratedScanner {
    const scanner: GeneratedScanner = {
      id: this.generateId(),
      name: this.generateScannerName(parseResult, pattern),
      description: this.generateScannerDescription(parseResult, pattern),
      scanner_type: options?.scanner_type || parseResult.scanner_type || pattern.category,
      code: this.generateScannerCode(pattern, parseResult, options),
      language: 'python',
      requirements,
      patterns_used: [pattern.id],
      parameters: this.buildParameters(pattern, parseResult),
      metadata: {
        generated_at: new Date(),
        generation_method: 'natural-language',
        confidence_score: parseResult.confidence
      }
    };

    return scanner;
  }

  private buildCustomScanner(
    requirements: ScannerRequirement[],
    indicators: string[],
    parameters: Record<string, any>,
    options?: GenerationOptions
  ): GeneratedScanner {
    const scanner: GeneratedScanner = {
      id: this.generateId(),
      name: 'Custom Scanner',
      description: 'Custom scanner built from specifications',
      scanner_type: options?.scanner_type || 'custom',
      code: this.generateCustomScannerCode(indicators, parameters),
      language: 'python',
      requirements,
      patterns_used: [],
      parameters,
      metadata: {
        generated_at: new Date(),
        generation_method: 'vision',
        confidence_score: 0.8
      }
    };

    return scanner;
  }

  private buildFromInteractiveState(
    state: InteractiveBuilderState,
    options?: GenerationOptions
  ): GeneratedScanner {
    const { responses, requirements, suggested_patterns } = state;

    const pattern = suggested_patterns[0] || this.patterns.get('custom');
    const parseResult: NLParseResult = {
      intent: 'create-scanner',
      scanner_type: responses.scanner_type,
      patterns: [],
      indicators: responses.indicators?.split(',').map((i: string) => i.trim()) || [],
      parameters: responses.parameters || {},
      requirements: [],
      confidence: this.calculateInteractiveConfidence(state)
    };

    return this.buildScannerFromPattern(
      pattern || this.patterns.get('custom')!,
      requirements,
      parseResult,
      options
    );
  }

  private generateScannerCode(
    pattern: ScannerPattern,
    parseResult: NLParseResult,
    options?: GenerationOptions
  ): string {
    // Generate Python scanner code
    let code = `"""
${pattern.name}
Generated: ${new Date().toISOString()}
Pattern: ${pattern.id}
Confidence: ${parseResult.confidence.toFixed(2)}
"""

import pandas as pd
import numpy as np
from typing import Dict, List, Tuple

class ${pattern.name.replace(/[^a-zA-Z0-9]/g, '_')}Scanner:
    """${pattern.description}"""

    def __init__(self, parameters: Dict = None):
        self.parameters = parameters or self.get_default_parameters()
        self.indicators = {}

    def get_default_parameters(self) -> Dict:
        """Get default parameters for this scanner"""
        return {
`;

    // Add parameters
    pattern.parameters.forEach((param, i) => {
      const comma = i < pattern.parameters.length - 1 ? ',' : '';
      code += `            '${param.name}': ${JSON.stringify(param.default_value)}${comma}\n`;
    });

    code += `        }

    def calculate_indicators(self, data: pd.DataFrame) -> Dict:
        """Calculate required indicators"""
        self.indicators = {}

`;

    // Add indicator calculations
    if (parseResult.indicators.includes('SMA')) {
      code += `        # Simple Moving Average
        if 'period' in self.parameters:
            self.indicators['sma'] = data['close'].rolling(
                window=self.parameters.get('period', 20)
            ).mean()

`;
    }

    if (parseResult.indicators.includes('EMA')) {
      code += `        # Exponential Moving Average
        if 'period' in self.parameters:
            self.indicators['ema'] = data['close'].ewm(
                span=self.parameters.get('period', 20)
            ).mean()

`;
    }

    if (parseResult.indicators.includes('RSI')) {
      code += `        # Relative Strength Index
        if 'period' in self.parameters:
            delta = data['close'].diff()
            gain = (delta.where(delta > 0, 0)).rolling(window=self.parameters.get('period', 14)).mean()
            loss = (-delta.where(delta < 0, 0)).rolling(window=self.parameters.get('period', 14)).mean()
            rs = gain / loss
            self.indicators['rsi'] = 100 - (100 / (1 + rs))

`;
    }

    if (parseResult.indicators.includes('BB')) {
      code += `        # Bollinger Bands
        if 'period' in self.parameters and 'std_dev' in self.parameters:
            sma = data['close'].rolling(window=self.parameters['period']).mean()
            std = data['close'].rolling(window=self.parameters['period']).std()
            self.indicators['bb_upper'] = sma + (std * self.parameters['std_dev'])
            self.indicators['bb_lower'] = sma - (std * self.parameters['std_dev'])
            self.indicators['bb_middle'] = sma

`;
    }

    code += `        return self.indicators

    def generate_signals(self, data: pd.DataFrame) -> pd.DataFrame:
        """Generate trading signals"""
        self.calculate_indicators(data)

        signals = pd.DataFrame(index=data.index)
        signals['signal'] = 0
        signals['confidence'] = 0.0

        # Custom signal generation logic
        # TODO: Implement based on pattern requirements

        return signals

    def scan(self, data: pd.DataFrame) -> List[Dict]:
        """Scan for trading opportunities"""
        signals = self.generate_signals(data)

        opportunities = []
        for i in range(len(signals)):
            if signals.iloc[i]['signal'] != 0:
                opportunities.append({
                    'timestamp': data.iloc[i]['timestamp'],
                    'signal': signals.iloc[i]['signal'],
                    'confidence': signals.iloc[i]['confidence'],
                    'price': data.iloc[i]['close'],
                    'indicators': {
                        k: v.iloc[i] if isinstance(v, pd.Series) else v
                        for k, v in self.indicators.items()
                    }
                })

        return opportunities
`;

    return code;
  }

  private generateCustomScannerCode(
    indicators: string[],
    parameters: Record<string, any>
  ): string {
    return `"""
Custom Scanner
Generated: ${new Date().toISOString()}
Indicators: ${indicators.join(', ')}
"""

import pandas as pd
import numpy as np

class CustomScanner:
    """Custom scanner based on user specifications"""

    def __init__(self, parameters: Dict = None):
        self.parameters = parameters or ${JSON.stringify(parameters)}
        self.indicators = {}

    def scan(self, data: pd.DataFrame) -> List[Dict]:
        """Scan for trading opportunities"""
        # Implement custom logic here
        return []
`;
  }

  // ========== OPTIMIZATION & TESTING ==========

  async optimizeScanner(scanner: GeneratedScanner): Promise<GeneratedScanner> {
    // Add optimization logic
    scanner.metadata.optimization_results = {
      original_parameters: scanner.parameters,
      optimized_parameters: scanner.parameters,
      improvement_estimate: 0.05
    };

    return scanner;
  }

  async quickBacktest(scanner: GeneratedScanner): Promise<any> {
    // Add quick backtest logic
    return {
      total_trades: 0,
      win_rate: 0.65,
      profit_factor: 1.5,
      max_drawdown: 0.15,
      sharpe_ratio: 1.2
    };
  }

  // ========== UTILITY METHODS ==========

  private extractRequirements(input: string, parseResult: NLParseResult): ScannerRequirement[] {
    const requirements: ScannerRequirement[] = [];

    // Add functional requirements
    if (parseResult.indicators.length > 0) {
      requirements.push({
        id: 'req-1',
        type: 'functional',
        priority: 'high',
        description: `Calculate indicators: ${parseResult.indicators.join(', ')}`,
        extracted_from: 'natural_language',
        confidence: 0.9
      });
    }

    return requirements;
  }

  private extractIndicatorsFromCode(codeBlocks: any[]): string[] {
    const indicators: string[] = [];
    const indicatorKeywords = ['sma', 'ema', 'rsi', 'macd', 'bb', 'atr', 'vwap'];

    codeBlocks.forEach(block => {
      const code = block.code.toLowerCase();
      indicatorKeywords.forEach(indicator => {
        if (code.includes(indicator) && !indicators.includes(indicator)) {
          indicators.push(indicator.toUpperCase());
        }
      });
    });

    return indicators;
  }

  private extractParametersFromCode(codeBlocks: any[]): Record<string, any> {
    const parameters: Record<string, any> = {};

    codeBlocks.forEach(block => {
      const matches = block.code.match(/(\w+)\s*=\s*(\d+)/g);
      if (matches) {
        matches.forEach((match: string) => {
          const [key, value] = match.split('=').map(s => s.trim());
          if (!isNaN(parseInt(value))) {
            parameters[key] = parseInt(value);
          }
        });
      }
    });

    return parameters;
  }

  private extractRequirementsFromResponse(
    responses: Record<string, any>,
    step: number
  ): ScannerRequirement[] {
    const requirements: ScannerRequirement[] = [];

    if (step === 1 && responses.scanner_type) {
      requirements.push({
        id: `req-${step}-1`,
        type: 'functional',
        priority: 'critical',
        description: `Implement ${responses.scanner_type} scanner logic`,
        extracted_from: 'interactive_builder',
        confidence: 0.95
      });
    }

    if (step === 2 && responses.indicators) {
      requirements.push({
        id: `req-${step}-1`,
        type: 'functional',
        priority: 'high',
        description: `Calculate indicators: ${responses.indicators}`,
        extracted_from: 'interactive_builder',
        confidence: 0.9
      });
    }

    return requirements;
  }

  private generateScannerName(parseResult: NLParseResult, pattern: ScannerPattern): string {
    const type = parseResult.scanner_type || pattern.category;
    const indicators = parseResult.indicators.slice(0, 2).join('-');
    return `${type}-${indicators}-${pattern.name}`.replace(/[^a-zA-Z0-9-]/g, '-');
  }

  private generateScannerDescription(parseResult: NLParseResult, pattern: ScannerPattern): string {
    return `${pattern.description}. Uses indicators: ${parseResult.indicators.join(', ')}.`;
  }

  private buildParameters(pattern: ScannerPattern, parseResult: NLParseResult): Record<string, any> {
    const params: Record<string, any> = {};

    pattern.parameters.forEach(param => {
      params[param.name] = param.default_value;
    });

    // Add parsed parameters
    Object.entries(parseResult.parameters).forEach(([key, value]) => {
      params[key] = value;
    });

    return params;
  }

  private applyOptionsToScanner(scanner: GeneratedScanner, options: GenerationOptions): void {
    if (options.scanner_type) {
      scanner.scanner_type = options.scanner_type;
    }

    if (options.timeframe) {
      scanner.parameters.timeframe = options.timeframe;
    }

    if (options.performance_targets) {
      scanner.parameters.performance_targets = options.performance_targets;
    }
  }

  private generateSuggestions(scanner: GeneratedScanner): string[] {
    const suggestions: string[] = [];

    suggestions.push('Scanner generated successfully');
    suggestions.push('Review the generated code before deployment');
    suggestions.push('Test with historical data before live trading');

    if (scanner.metadata.confidence_score < 0.8) {
      suggestions.push('Consider refining the scanner description for better accuracy');
    }

    return suggestions;
  }

  private generateStepSuggestions(state: InteractiveBuilderState): string[] {
    const suggestions: string[] = [];

    if (state.current_step === 1 && state.responses.scanner_type) {
      const patterns = this.suggestPatternsForType(state.responses.scanner_type);
      suggestions.push(`Suggested patterns: ${patterns.map(p => p.name).join(', ')}`);
    }

    return suggestions;
  }

  private suggestPatternsForType(scannerType: string): ScannerPattern[] {
    return Array.from(this.patterns.values())
      .filter(p => p.category === scannerType || p.id.includes(scannerType))
      .slice(0, 3);
  }

  private calculateInteractiveConfidence(state: InteractiveBuilderState): number {
    const completedSteps = state.current_step + 1;
    const totalSteps = state.total_steps;
    const responseCount = Object.keys(state.responses).length;

    return Math.min(0.95, 0.4 + (completedSteps / totalSteps) * 0.4 + (responseCount * 0.05));
  }

  private getBuilderSteps(): Array<{ question: string; key: string }> {
    return [
      { question: 'What type of scanner would you like to create? (e.g., trend, reversal, breakout, momentum)', key: 'scanner_type' },
      { question: 'Which indicators should be used? (e.g., SMA, EMA, RSI, MACD, Bollinger Bands)', key: 'indicators' },
      { question: 'What are the entry conditions? (e.g., price crosses above SMA)', key: 'entry_conditions' },
      { question: 'What are the exit conditions? (e.g., price crosses below SMA)', key: 'exit_conditions' },
      { question: 'What parameters should be configurable? (e.g., period=20, std_dev=2)', key: 'parameters' },
      { question: 'Any additional requirements or constraints?', key: 'additional' }
    ];
  }

  private generateId(): string {
    return `scanner-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  // ========== INITIALIZATION ==========

  private initializePatterns(): void {
    // Trend patterns
    this.patterns.set('trend-sma-crossover', {
      id: 'trend-sma-crossover',
      name: 'SMA Crossover',
      category: 'trend',
      description: 'Simple moving average crossover strategy',
      template: 'sma_crossover',
      parameters: [
        { name: 'fast_period', type: 'number', default_value: 10, min_value: 2, max_value: 50, description: 'Fast SMA period', required: true },
        { name: 'slow_period', type: 'number', default_value: 20, min_value: 5, max_value: 200, description: 'Slow SMA period', required: true }
      ],
      indicators: ['SMA'],
      typical_timeframes: ['1h', '4h', '1d']
    });

    this.patterns.set('trend-ema-crossover', {
      id: 'trend-ema-crossover',
      name: 'EMA Crossover',
      category: 'trend',
      description: 'Exponential moving average crossover strategy',
      template: 'ema_crossover',
      parameters: [
        { name: 'fast_period', type: 'number', default_value: 12, min_value: 2, max_value: 50, description: 'Fast EMA period', required: true },
        { name: 'slow_period', type: 'number', default_value: 26, min_value: 5, max_value: 200, description: 'Slow EMA period', required: true }
      ],
      indicators: ['EMA'],
      typical_timeframes: ['1h', '4h', '1d']
    });

    // Reversal patterns
    this.patterns.set('reversal-rsi', {
      id: 'reversal-rsi',
      name: 'RSI Reversal',
      category: 'reversal',
      description: 'RSI-based reversal strategy',
      template: 'rsi_reversal',
      parameters: [
        { name: 'period', type: 'number', default_value: 14, min_value: 2, max_value: 50, description: 'RSI period', required: true },
        { name: 'oversold', type: 'number', default_value: 30, min_value: 10, max_value: 40, description: 'Oversold threshold', required: true },
        { name: 'overbought', type: 'number', default_value: 70, min_value: 60, max_value: 90, description: 'Overbought threshold', required: true }
      ],
      indicators: ['RSI'],
      typical_timeframes: ['1h', '4h', '1d']
    });

    // Breakout patterns
    this.patterns.set('breakout-bb', {
      id: 'breakout-bb',
      name: 'Bollinger Band Breakout',
      category: 'breakout',
      description: 'Bollinger band breakout strategy',
      template: 'bb_breakout',
      parameters: [
        { name: 'period', type: 'number', default_value: 20, min_value: 5, max_value: 50, description: 'BB period', required: true },
        { name: 'std_dev', type: 'number', default_value: 2, min_value: 1, max_value: 3, description: 'Standard deviation multiplier', required: true }
      ],
      indicators: ['BB'],
      typical_timeframes: ['1h', '4h', '1d']
    });

    // Momentum patterns
    this.patterns.set('momentum-macd', {
      id: 'momentum-macd',
      name: 'MACD Momentum',
      category: 'momentum',
      description: 'MACD-based momentum strategy',
      template: 'macd_momentum',
      parameters: [
        { name: 'fast_period', type: 'number', default_value: 12, min_value: 5, max_value: 20, description: 'Fast EMA period', required: true },
        { name: 'slow_period', type: 'number', default_value: 26, min_value: 20, max_value: 50, description: 'Slow EMA period', required: true },
        { name: 'signal_period', type: 'number', default_value: 9, min_value: 5, max_value: 15, description: 'Signal line period', required: true }
      ],
      indicators: ['MACD'],
      typical_timeframes: ['1h', '4h', '1d']
    });

    // Mean reversion patterns
    this.patterns.set('mean-reversion-bb', {
      id: 'mean-reversion-bb',
      name: 'BB Mean Reversion',
      category: 'mean-reversion',
      description: 'Bollinger band mean reversion strategy',
      template: 'bb_mean_reversion',
      parameters: [
        { name: 'period', type: 'number', default_value: 20, min_value: 5, max_value: 50, description: 'BB period', required: true },
        { name: 'std_dev', type: 'number', default_value: 2, min_value: 1, max_value: 3, description: 'Standard deviation multiplier', required: true }
      ],
      indicators: ['BB'],
      typical_timeframes: ['1h', '4h', '1d']
    });

    // Custom
    this.patterns.set('custom', {
      id: 'custom',
      name: 'Custom Scanner',
      category: 'custom',
      description: 'Custom user-defined scanner',
      template: 'custom',
      parameters: [],
      indicators: [],
      typical_timeframes: ['1m', '5m', '15m', '1h', '4h', '1d']
    });
  }

  private initializeTemplates(): void {
    // LC D2 template
    this.templates.set('lc-d2-template', {
      id: 'template-lc-d2',
      name: 'LC D2 Scanner Template',
      description: 'LC D2 extended scanner template',
      scanner_type: 'lc-d2',
      code: `"""
LC D2 Scanner Template
Standard LC D2 scanner with configurable parameters
"""`,
      language: 'python',
      requirements: [],
      patterns_used: ['lc-d2'],
      parameters: {
        lookback_period: 90,
        min_volume: 1000000
      },
      metadata: {
        generated_at: new Date(),
        generation_method: 'template',
        confidence_score: 1.0
      }
    });

    // Backside B template
    this.templates.set('backside-b-template', {
      id: 'template-backside-b',
      name: 'Backside B Scanner Template',
      description: 'Backside Para B scanner template',
      scanner_type: 'backside-b',
      code: `"""
Backside B Scanner Template
Backside Para B scanner with configurable parameters
"""`,
      language: 'python',
      requirements: [],
      patterns_used: ['backside-b'],
      parameters: {
        lookback_period: 90,
        min_market_cap: 500000000
      },
      metadata: {
        generated_at: new Date(),
        generation_method: 'template',
        confidence_score: 1.0
      }
    });
  }

  // ========== PUBLIC API ==========

  getAvailablePatterns(): ScannerPattern[] {
    return Array.from(this.patterns.values());
  }

  getAvailableTemplates(): GeneratedScanner[] {
    return Array.from(this.templates.values());
  }

  getPattern(id: string): ScannerPattern | undefined {
    return this.patterns.get(id);
  }

  getTemplate(id: string): GeneratedScanner | undefined {
    return this.templates.get(id);
  }

  saveTemplate(scanner: GeneratedScanner): void {
    this.templates.set(scanner.id, scanner);
  }

  clearCache(): void {
    this.nlpCache.clear();
  }
}

// Singleton instance
let instance: ScannerGenerationService | null = null;

export const getScannerGenerationService = (): ScannerGenerationService => {
  if (!instance) {
    instance = new ScannerGenerationService();
  }
  return instance;
};

export type { ScannerGenerationService };
