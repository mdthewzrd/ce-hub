/**
 * 🔍 Code Analyzer Agent
 *
 * Analyzes Python trading scanner code to understand structure, patterns, and characteristics
 * First step in the multi-agent pipeline
 */

export interface CodeAnalysisResult {
  scannerType: 'backside_b' | 'lc_pattern' | 'multi_pattern' | 'custom' | 'unknown';
  structure: {
    hasRunScan: boolean;
    hasFetchGroupedData: boolean;
    hasApplySmartFilters: boolean;
    hasComputeFeatures: boolean;
    hasDetectPatterns: boolean;
    hasExecuteMethod: boolean;
  };
  patterns: {
    usesGroupBy: boolean;
    usesVectorization: boolean;
    usesLookahead: boolean;
    hasMarketCalendar: boolean;
    hasParameterClass: boolean;
  };
  metrics: {
    lineCount: number;
    methodCount: number;
    parameterCount: number;
    complexity: 'simple' | 'moderate' | 'complex';
  };
  issues: string[];
  suggestions: string[];
}

export interface AgentResult {
  success: boolean;
  agentType: string;
  data: CodeAnalysisResult;
  executionTime: number;
  timestamp: string;
  errors?: string[];
  warnings?: string[];
}

/**
 * Code Analyzer Agent - Analyzes code structure and patterns
 */
export class CodeAnalyzerAgent {
  /**
   * Analyze Python trading scanner code
   */
  async analyze(code: string): Promise<AgentResult> {
    const startTime = Date.now();

    try {
      console.log('🔍 Analyzing code structure...');

      const result: CodeAnalysisResult = {
        scannerType: this.detectScannerType(code),
        structure: this.analyzeStructure(code),
        patterns: this.analyzePatterns(code),
        metrics: this.calculateMetrics(code),
        issues: this.identifyIssues(code),
        suggestions: this.generateSuggestions(code)
      };

      console.log(`✅ Analysis complete: ${result.scannerType} scanner detected`);
      console.log(`   Methods: ${result.metrics.methodCount}, Parameters: ${result.metrics.parameterCount}`);

      return {
        success: true,
        agentType: 'code_analyzer',
        data: result,
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      console.error('❌ Code analysis failed:', error);

      return {
        success: false,
        agentType: 'code_analyzer',
        data: {
          scannerType: 'unknown',
          structure: {
            hasRunScan: false,
            hasFetchGroupedData: false,
            hasApplySmartFilters: false,
            hasComputeFeatures: false,
            hasDetectPatterns: false,
            hasExecuteMethod: false
          },
          patterns: {
            usesGroupBy: false,
            usesVectorization: false,
            usesLookahead: false,
            hasMarketCalendar: false,
            hasParameterClass: false
          },
          metrics: { lineCount: 0, methodCount: 0, parameterCount: 0, complexity: 'simple' },
          issues: [error instanceof Error ? error.message : 'Unknown error'],
          suggestions: []
        },
        executionTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
        errors: [error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Detect scanner type
   */
  private detectScannerType(code: string): CodeAnalysisResult['scannerType'] {
    if (code.includes('backside') && code.includes('para_b')) {
      return 'backside_b';
    }

    if (code.includes('lc_') && (code.includes('momentum') || code.includes('d2') || code.includes('d3'))) {
      return 'lc_pattern';
    }

    if (this.hasMultiplePatterns(code)) {
      return 'multi_pattern';
    }

    if (code.includes('def run_scan') || code.includes('def fetch_grouped_data')) {
      return 'custom';
    }

    return 'unknown';
  }

  /**
   * Analyze code structure
   */
  private analyzeStructure(code: string): CodeAnalysisResult['structure'] {
    return {
      hasRunScan: /def\s+run_scan\s*\(/.test(code),
      hasFetchGroupedData: /def\s+fetch_grouped_data\s*\(/.test(code),
      hasApplySmartFilters: /def\s+apply_smart_filters\s*\(/.test(code),
      hasComputeFeatures: /def\s+compute_(simple|full)_features\s*\(/.test(code),
      hasDetectPatterns: /def\s+detect_patterns\s*\(/.test(code),
      hasExecuteMethod: /def\s+(execute|run_and_save)\s*\(/.test(code)
    };
  }

  /**
   * Analyze code patterns
   */
  private analyzePatterns(code: string): CodeAnalysisResult['patterns'] {
    return {
      usesGroupBy: /\.groupby\(/.test(code),
      usesVectorization: /\[(.*)\]\s*[\&\|]\s*\[(.*)\]/.test(code),
      usesLookahead: /\.shift\(1\)/.test(code),
      hasMarketCalendar: /mcal\.get_calendar|pandas_market_calendars/.test(code),
      hasParameterClass: /class\s+ScannerConfig/.test(code)
    };
  }

  /**
   * Calculate code metrics
   */
  private calculateMetrics(code: string): CodeAnalysisResult['metrics'] {
    const lines = code.split('\n');
    const methodMatches = code.match(/def\s+\w+\s*\(/g) || [];
    const paramMatches = code.match(/^\s*(\w+)\s*=\s*[^#\n]/gm) || [];

    // Estimate complexity based on method count and nesting
    let complexity: 'simple' | 'moderate' | 'complex' = 'simple';
    if (methodMatches.length > 10) {
      complexity = 'complex';
    } else if (methodMatches.length > 5) {
      complexity = 'moderate';
    }

    return {
      lineCount: lines.length,
      methodCount: methodMatches.length,
      parameterCount: this.countParameters(code),
      complexity
    };
  }

  /**
   * Count parameters in ScannerConfig
   */
  private countParameters(code: string): number {
    const scannerConfigMatch = code.match(/class\s+ScannerConfig[^{]*:\s*([\s\S]*?)(?=\n\S|\n#|$)/);
    if (!scannerConfigMatch) return 0;

    const content = scannerConfigMatch[1];
    const paramMatches = content.match(/^\s*(\w+)\s*=\s*[^#\n]/gm) || [];

    // Filter out special attributes
    return paramMatches.filter(match =>
      !match.startsWith('_') &&
      !match.includes('pass') &&
      !match.includes('class ')
    ).length;
  }

  /**
   * Check for multiple patterns
   */
  private hasMultiplePatterns(code: string): boolean {
    const patterns = [
      'momentum_d3_extended_pattern',
      'momentum_d2_extended_pattern',
      'lc_frontside_d3_extended_1',
      'lc_frontside_d2_extended',
      'lc_frontside_d2_extended_1'
    ];

    const foundPatterns = patterns.filter(p => code.includes(p));
    return foundPatterns.length >= 2;
  }

  /**
   * Identify code issues
   */
  private identifyIssues(code: string): string[] {
    const issues: string[] = [];

    // Check for forbidden methods
    if (/def\s+execute\s*\(/.test(code)) {
      issues.push('Contains execute() method (deprecated in V31)');
    }

    if (/def\s+run_and_save\s*\(/.test(code)) {
      issues.push('Contains run_and_save() method (deprecated in V31)');
    }

    // Check for invalid column names
    if (/ADV20_\$/.test(code)) {
      issues.push('Contains invalid column name ADV20_$');
    }

    // Check for fetch_all instead of fetch_grouped_data
    if (/fetch_all_grouped_data/.test(code)) {
      issues.push('Uses fetch_all_grouped_data instead of fetch_grouped_data');
    }

    // Check for missing required V31 components
    if (!/def\s+run_scan\s*\(/.test(code)) {
      issues.push('Missing run_scan() method (required in V31)');
    }

    if (!/d0_start_user/.test(code)) {
      issues.push('Missing d0_start_user variable (required in V31)');
    }

    return issues;
  }

  /**
   * Generate improvement suggestions
   */
  private generateSuggestions(code: string): string[] {
    const suggestions: string[] = [];

    if (!/class\s+ScannerConfig/.test(code)) {
      suggestions.push('Consider adding ScannerConfig class for better parameter management');
    }

    if (!/mcal\.get_calendar/.test(code)) {
      suggestions.push('Add proper market calendar handling with mcal.get_calendar');
    }

    if (/\.groupby\(/.test(code) && !/\[(.*)\]\s*[\&\|]/.test(code)) {
      suggestions.push('Consider vectorizing operations instead of using groupby');
    }

    if (!/def\s+apply_smart_filters/.test(code)) {
      suggestions.push('Add apply_smart_filters() method for D0 range filtering');
    }

    return suggestions;
  }
}

export default CodeAnalyzerAgent;
