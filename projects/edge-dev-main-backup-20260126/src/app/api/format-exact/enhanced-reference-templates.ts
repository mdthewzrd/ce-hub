/**
 * ENHANCED REFERENCE TEMPLATES FOR 100% ACCURATE SCANNER FORMATTING
 *
 * This file contains comprehensive reference templates and detection patterns
 * to ensure Renata always produces the exact correct formatting.
 *
 * Reference Sources:
 * 1. /Users/michaeldurante/.anaconda/working code/backside daily para/formatted final - UPDATED.py
 * 2. /Users/michaeldurante/.anaconda/working code/Daily Para/A+ format confirm.py
 */

// ===== REFERENCE TEMPLATES =====

const BACKSIDE_B_TEMPLATE = {
  className: 'FormattedBacksideParaBScanner',
  headerPattern: 'FORMATTED BACKSIDE PARA B SCANNER',
  docstringPattern: 'FORMATTED BACKSIDE PARA B SCANNER - Multi-Stage Process (UPDATED)',
  footerPattern: 'FINAL VERSION - Based on',
  expectedLines: 825,
  parameterPattern: 'P = {',
  parameterPreservation: [
    'price_min', 'adv20_min_usd', 'abs_lookback_days', 'abs_exclude_days', 'pos_abs_max',
    'trigger_mode', 'atr_mult', 'vol_mult', 'd1_vol_mult_min', 'd1_volume_min',
    'slope5d_min', 'high_ema9_mult', 'gap_div_atr_min', 'open_over_ema9_min',
    'd1_green_atr_min', 'require_open_gt_prev_high', 'enforce_d1_above_d2'
  ],
  imports: [
    'pandas as pd',
    'numpy as np',
    'requests',
    'time',
    'from datetime import datetime',
    'from concurrent.futures import ThreadPoolExecutor, as_completed',
    'import multiprocessing as mp'
  ],
  classStructure: [
    '__init__',
    'fetch_polygon_market_universe',
    '_fetch_full_market_snapshot',
    '_fetch_v3_tickers',
    '_get_fallback_universe',
    'apply_smart_temporal_filters',
    'execute_stage1_market_universe_optimization',
    'fetch_daily_data',
    'add_daily_metrics',
    'abs_top_window',
    'pos_between',
    '_mold_on_row',
    'scan_symbol_original_logic',
    'execute_stage2_backside_scanning',
    'execute_stage3_results_analysis',
    'run_formatted_scan'
  ]
};

const A_PLUS_TEMPLATE = {
  className: 'APlusFormatConfirmationScanner',
  headerPattern: 'A+ FORMAT CONFIRMATION - Two-Stage A+ Scanner',
  docstringPattern: 'This includes the COMPLETE two-stage formatting process:',
  expectedLines: 755,
  parameterPattern: 'self.a_plus_params = {',
  parameterPreservation: [
    'atr_mult', 'vol_mult', 'slope3d_min', 'slope5d_min', 'slope15d_min',
    'high_ema9_mult', 'high_ema20_mult', 'pct7d_low_div_atr_min', 'pct14d_low_div_atr_min',
    'gap_div_atr_min', 'open_over_ema9_min', 'atr_pct_change_min', 'prev_close_min',
    'prev_gain_pct_min', 'pct2d_div_atr_min', 'pct3d_div_atr_min'
  ],
  imports: [
    'pandas as pd',
    'numpy as np',
    'requests',
    'time',
    'from datetime import datetime',
    'from concurrent.futures import ThreadPoolExecutor, as_completed',
    'import multiprocessing as mp'
  ],
  classStructure: [
    '__init__',
    'fetch_polygon_market_universe',
    '_fetch_full_market_snapshot',
    '_fetch_v3_tickers',
    '_get_fallback_universe',
    'apply_smart_temporal_filters',
    'execute_stage1_market_universe_optimization',
    'fetch_daily_data',
    'compute_all_metrics',
    'scan_a_plus_logic',
    'execute_stage2_a_plus_scanning',
    'execute_stage3_results_analysis',
    'run_formatted_scan'
  ]
};

const GAP_SCANNER_TEMPLATE = {
  className: 'SmallCapGapScanner',
  headerPattern: 'SMALL CAP GAP SCANNER - Gap Up with EMA Validation',
  docstringPattern: 'Identifies small-cap gap up plays with EMA200 oversold confirmation',
  expectedLines: 850,
  parameterPattern: 'self.gap_params = {',
  parameterPreservation: [
    'gap_threshold', 'pm_gap_threshold', 'open_above_prev_high_threshold',
    'pm_vol_threshold', 'min_price', 'ema200_multiplier', 'min_data_points',
    'market_cap_max', 'exclude_d2_days', 'trading_days_back'
  ],
  imports: [
    'pandas as pd',
    'numpy as np',
    'requests',
    'time',
    'from datetime import datetime, timedelta',
    'from concurrent.futures import ThreadPoolExecutor, as_completed',
    'import multiprocessing as mp',
    'pandas_market_calendars as mcal'
  ],
  classStructure: [
    '__init__',
    'fetch_polygon_market_universe',
    '_fetch_full_market_snapshot',
    '_fetch_v3_tickers',
    '_get_fallback_universe',
    'apply_smart_temporal_filters',
    'execute_stage1_market_universe_optimization',
    'fetch_daily_data',
    'calculate_ema200',
    'validate_ema_condition',
    'scan_gap_logic',
    'execute_stage2_gap_scanning',
    'execute_stage3_results_analysis',
    'run_formatted_scan'
  ]
};

// ===== FORMAT DETECTION PATTERNS =====

const FORMAT_DETECTION_PATTERNS = {
  // Class name patterns
  CLASS_PATTERNS: [
    { pattern: /class\s+(\w+Scanner):/, priority: 1, type: 'backside' },
    { pattern: /class\s+(\w+FormatConfirmationScanner):/, priority: 1, type: 'a_plus' },
    { pattern: /class\s+(SmallCapGapScanner):/, priority: 1, type: 'gap_scanner' },
    { pattern: /class\s+(.+)/, priority: 2, type: 'generic' }
  ],

  // Docstring patterns
  DOCSTRING_PATTERNS: [
    { pattern: /FORMATTED\s+(.+)\s+SCANNER.*Multi-Stage.*UPDATED/, priority: 1, type: 'backside' },
    { pattern: /A\+\s+FORMAT\s+CONFIRMATION.*Two-Stage.*A\+\s+Scanner/, priority: 1, type: 'a_plus' },
    { pattern: /SMALL CAP GAP SCANNER.*Gap Up.*EMA Validation/i, priority: 1, type: 'gap_scanner' },
    { pattern: /class\s+.+:/, priority: 2, type: 'generic' }
  ],

  // Parameter block patterns
  PARAM_PATTERNS: [
    { pattern: /P\s*=\s*{([^}]+)}/, priority: 1, type: 'backside' },
    { pattern: /self\.a_plus_params\s*=\s*{([^}]+)}/, priority: 1, type: 'a_plus' },
    { pattern: /self\.gap_params\s*=\s*{([^}]+)}/, priority: 1, type: 'gap_scanner' },
    { pattern: /\w+_params\s*=\s*{([^}]+)}/, priority: 2, type: 'generic' }
  ],

  // Import patterns
  IMPORT_PATTERNS: [
    /import\s+pandas\s+as\s+pd/i,
    /import\s+numpy\s+as\s+np/i,
    /import\s+requests/i,
    /import\s+time/i,
    /from\s+datetime\s+import\s+datetime/i,
    /from\s+concurrent\.futures\s+import/i,
    /import\s+multiprocessing\s+as\s+mp/i
  ],

  // Gap Scanner specific patterns
  GAP_SCANNER_PATTERNS: [
    { pattern: /ema200/i, priority: 1, type: 'gap_scanner' },
    { pattern: /ema\s*\*\s*0\.8/i, priority: 1, type: 'gap_scanner' },
    { pattern: /d2\s*==\s*0/i, priority: 1, type: 'gap_scanner' },
    { pattern: /pm_vol\s*>=\s*5_000_000/i, priority: 1, type: 'gap_scanner' },
    { pattern: /\.csv.*gap/i, priority: 1, type: 'gap_scanner' }
  ]
};

// ===== ENHANCED PARAMETER EXTRACTION =====

export interface ExtractedParameters {
  name: string;
  value: any;
  type: 'string' | 'number' | 'boolean';
  line?: number;
}

class ParameterExtractor {
  /**
   * Extract parameters from scanner code with multiple detection methods
   */
  static extractParameters(code: string): ExtractedParameters[] {
    const params: ExtractedParameters[] = [];

    // Method 1: Try P = {} pattern (Backside style)
    const backsideParams = this.extractFromPBlock(code);
    if (backsideParams.length > 0) {
      params.push(...backsideParams);
    }

    // Method 2: Try self.params = {} pattern (A+ style)
    const aPlusParams = this.extractFromSelfParams(code);
    if (aPlusParams.length > 0) {
      params.push(...aPlusParams);
    }

    // Method 3: Generic parameter extraction
    const genericParams = this.extractGenericParameters(code);
    if (genericParams.length > 0 && params.length === 0) {
      params.push(...genericParams);
    }

    return this.deduplicateAndValidate(params);
  }

  private static extractFromPBlock(code: string): ExtractedParameters[] {
    const params: ExtractedParameters[] = [];

    // Find P = { ... } blocks
    const pMatch = code.match(/P\s*=\s*{([^}]+)}/);
    if (pMatch) {
      const paramText = pMatch[1];

      // Extract parameter lines
      const lines = paramText.split('\n');
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes(':')) {
          const match = trimmedLine.match(/"([^"]+)"\s*:\s*([^,}]+)/);
          if (match) {
            const value = this.parseParameterValue(match[2]);
            params.push({
              name: match[1],
              value: value.value,
              type: value.type,
              line: index
            });
          }
        }
      });
    }

    return params;
  }

  private static extractFromSelfParams(code: string): ExtractedParameters[] {
    const params: ExtractedParameters[] = [];

    // Find self.params = { ... } blocks
    const selfParamsMatch = code.match(/self\.\w+_params\s*=\s*{([^}]+)}/);
    if (selfParamsMatch) {
      const paramText = selfParamsMatch[1];

      const lines = paramText.split('\n');
      lines.forEach((line, index) => {
        const trimmedLine = line.trim();
        if (trimmedLine.includes(':')) {
          const match = trimmedLine.match(/'([^']+)'\s*:\s*([^,}]+)/);
          if (match) {
            const value = this.parseParameterValue(match[2]);
            params.push({
              name: match[1],
              value: value.value,
              type: value.type,
              line: index
            });
          }
        }
      });
    }

    return params;
  }

  private static extractGenericParameters(code: string): ExtractedParameters[] {
    const params: ExtractedParameters[] = [];

    // Look for parameter definitions in various formats
    const patterns = [
      /"([^"]+)"\s*[:=]\s*([^,\n}]+)/g,
      /(\w+)\s*[:=]\s*(\d+\.?\d*|True|False)/g,
      /(\w+)\s*[:=]\s*"([^"]*)"/g
    ];

    patterns.forEach(pattern => {
      let match;
      while ((match = pattern.exec(code)) !== null) {
        const value = this.parseParameterValue(match[2]);
        params.push({
          name: match[1],
          value: value.value,
          type: value.type
        });
      }
    });

    return params;
  }

  private static parseParameterValue(valueStr: string): { value: any; type: 'string' | 'number' | 'boolean' } {
    const value = valueStr.trim();

    // Try to parse as boolean
    if (value === 'True' || value === 'False') {
      return { value: value === 'True', type: 'boolean' };
    }

    // Try to parse as number
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && isFinite(numValue)) {
      return { value: numValue, type: 'number' };
    }

    // Try to parse as quoted string
    if ((value.startsWith('"') && value.endsWith('"')) ||
        (value.startsWith("'") && value.endsWith("'"))) {
      return { value: value.slice(1, -1), type: 'string' };
    }

    // Default to string
    return { value: value, type: 'string' };
  }

  private static deduplicateAndValidate(params: ExtractedParameters[]): ExtractedParameters[] {
    const seen = new Set<string>();
    return params.filter(param => {
      if (seen.has(param.name)) {
        return false;
      }
      seen.add(param.name);
      return param.value !== null && param.value !== undefined;
    });
  }
}

// ===== COMPREHENSIVE VALIDATION SYSTEM =====

class FormatValidator {
  /**
   * Validate formatted code against reference templates
   */
  static validateFormat(code: string, expectedTemplate: any): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
    metrics: any;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check basic structure
    const structureValidation = this.validateStructure(code, expectedTemplate);
    errors.push(...structureValidation.errors);
    warnings.push(...structureValidation.warnings);

    // Check parameters preservation
    const paramValidation = this.validateParameterPreservation(code, expectedTemplate);
    errors.push(...paramValidation.errors);

    // Check imports
    const importValidation = this.validateImports(code, expectedTemplate);
    errors.push(...importValidation.errors);

    const metrics = {
      totalLines: code.split('\n').length,
      parameterCount: paramValidation.paramCount,
      importCount: importValidation.importCount,
      structureScore: structureValidation.score
    };

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      metrics
    };
  }

  /**
   * Validate basic code structure (simplified validation)
   * Used by enhancedFormattingService for quick validation
   */
  static validateBasic(code: string): {
    isValid: boolean;
    errors: string[];
    warnings: string[];
  } {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check if code exists
    if (!code || code.trim().length === 0) {
      errors.push('Code is empty');
      return { isValid: false, errors, warnings };
    }

    // Check for basic Python syntax
    if (!code.includes('def ') && !code.includes('class ')) {
      warnings.push('No functions or classes found');
    }

    // Check for proper parameter dict syntax
    if (code.includes('self.params')) {
      // Improved check: Look for ACTUAL unquoted keys (not false positives on quoted keys)
      // Extract lines within the params dict and check for unquoted key patterns
      const paramsMatch = code.match(/self\.params\s*=\s*\{([\s\S]*?)\n\s*\}/);
      if (paramsMatch) {
        const paramsContent = paramsMatch[1];
        // Check for lines with pattern:   key_name: (not "key_name": or 'key_name':)
        // Ignore comment lines
        const lines = paramsContent.split('\n');
        for (const line of lines) {
          const trimmed = line.trim();
          // Skip comments and empty lines
          if (trimmed.startsWith('#') || !trimmed) continue;

          // Check for unquoted key pattern: starts with word char, has : before value, but no quote at start
          // Valid: "key": value or 'key': value
          // Invalid: key: value or key:value
          const unquotedKeyPattern = /^\s*[a-zA-Z_][a-zA-Z0-9_]*\s*:/;
          // But make sure it's not a quoted key
          const quotedKeyPattern = /^\s*['"][a-zA-Z_][a-zA-Z0-9_]*['"]\s*:/;

          if (unquotedKeyPattern.test(trimmed) && !quotedKeyPattern.test(trimmed)) {
            errors.push('Parameters dict has unquoted keys - use quoted strings like "key": value');
            break; // Only add error once
          }
        }
      }
    }

    // Check for grouped endpoint usage (Edge Dev standard)
    if (!code.includes('/v2/aggs/grouped')) {
      warnings.push('Missing Polygon grouped endpoint - should use /v2/aggs/grouped/locale/us/market/stocks/{date}');
    }

    // Check for parallel workers
    if (!code.includes('ThreadPoolExecutor') && !code.includes('stage1_workers')) {
      warnings.push('Missing parallel workers - should use ThreadPoolExecutor for performance');
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings
    };
  }

  private static validateStructure(code: string, template: any): {
    errors: string[];
    warnings: string[];
    score: number;
  } {
    const errors: string[] = [];
    const warnings: string[] = [];
    let score = 0;

    // Check for expected class name
    if (template.className && !code.includes(`class ${template.className}`)) {
      errors.push(`Missing expected class name: ${template.className}`);
    } else {
      score += 20;
    }

    // Check for expected header pattern
    if (template.headerPattern && !code.includes(template.headerPattern)) {
      errors.push(`Missing expected header pattern: ${template.headerPattern}`);
    } else {
      score += 15;
    }

    // Check for expected methods
    const methodCount = template.classStructure.filter((method: string) =>
      code.includes(method)
    ).length;
    const expectedMethodCount = template.classStructure.length;
    const methodScore = (methodCount / expectedMethodCount) * 100;

    score += methodScore * 0.65; // 65% of structure score

    return { errors, warnings, score };
  }

  private static validateParameterPreservation(code: string, template: any): {
    errors: string[];
    paramCount: number;
  } {
    const errors: string[] = [];
    const extractedParams = ParameterExtractor.extractParameters(code);
    const expectedParams = template.parameterPreservation;

    // Check if expected parameters are preserved
    expectedParams.forEach((expectedParam: string) => {
      const found = extractedParams.find(p => p.name === expectedParam);
      if (!found) {
        errors.push(`Missing expected parameter: ${expectedParam}`);
      }
    });

    return { errors, paramCount: extractedParams.length };
  }

  private static validateImports(code: string, template: any): {
    errors: string[];
    importCount: number;
  } {
    const errors: string[] = [];
    let importCount = 0;

    template.imports.forEach((importPattern: string) => {
      if (code.includes(importPattern)) {
        importCount++;
      } else {
        errors.push(`Missing expected import: ${importPattern}`);
      }
    });

    return { errors, importCount };
  }
}

// ===== REFERENCE TEMPLATE SELECTION =====

class TemplateSelector {
  /**
   * Automatically select the best reference template based on code analysis
   */
  static selectTemplate(code: string): any {
    const analysis = this.analyzeCode(code);

    if (analysis.formatType === 'backside') {
      return BACKSIDE_B_TEMPLATE;
    } else if (analysis.formatType === 'a_plus') {
      return A_PLUS_TEMPLATE;
    } else if (analysis.formatType === 'gap_scanner') {
      return GAP_SCANNER_TEMPLATE;
    } else if (analysis.complexity === 'high') {
      return BACKSIDE_B_TEMPLATE; // Default to backside for complex code
    } else {
      return A_PLUS_TEMPLATE; // Default to A+ for simpler code
    }
  }

  public static analyzeCode(code: string): {
    formatType: 'backside' | 'a_plus' | 'gap_scanner' | 'generic';
    complexity: 'high' | 'medium' | 'low';
    confidence: number;
  } {
    let backsideScore = 0;
    let aPlusScore = 0;
    let gapScannerScore = 0;

    const codeLower = code.toLowerCase();

    // Format detection - header/docstring patterns
    if (code.includes('FORMATTED BACKSIDE PARA B') || codeLower.includes('backside para')) {
      backsideScore += 50;
    }

    if (code.includes('A+ FORMAT CONFIRMATION') || codeLower.includes('a+ format')) {
      aPlusScore += 50;
    }

    if (code.includes('SMALL CAP GAP SCANNER') || codeLower.includes('gap up')) {
      gapScannerScore += 50;
    }

    // Gap Scanner unique patterns (HIGH WEIGHT)
    if (codeLower.includes('ema200')) gapScannerScore += 50;
    if (codeLower.includes('ema * 0.8') || codeLower.includes('ema200*0.8')) gapScannerScore += 30;
    if (codeLower.includes('d2 == 0') || codeLower.includes('d2==0')) gapScannerScore += 20;
    if (codeLower.includes('.csv') && codeLower.includes('gap')) gapScannerScore += 25;

    // Pattern detection - parameter blocks
    if (code.includes('P = {')) backsideScore += 25;
    if (code.includes('self.a_plus_params')) aPlusScore += 25;
    if (codeLower.includes('self.gap_params')) gapScannerScore += 25;

    // Method complexity
    const methodCount = (code.match(/def\s+\w+\(/g) || []).length;
    if (methodCount > 15) aPlusScore += 10;
    if (methodCount > 20) backsideScore += 10;

    // Determine format type
    let formatType: 'backside' | 'a_plus' | 'gap_scanner' | 'generic';
    const scores = { backside: backsideScore, a_plus: aPlusScore, gap_scanner: gapScannerScore };
    const maxScore = Math.max(backsideScore, aPlusScore, gapScannerScore);

    if (maxScore === gapScannerScore && gapScannerScore > 30) {
      formatType = 'gap_scanner';
    } else if (maxScore === backsideScore) {
      formatType = 'backside';
    } else if (maxScore === aPlusScore) {
      formatType = 'a_plus';
    } else {
      formatType = 'generic';
    }

    // Determine complexity
    let complexity: 'high' | 'medium' | 'low';
    if (methodCount > 20 || code.length > 10000) {
      complexity = 'high';
    } else if (methodCount > 10 || code.length > 5000) {
      complexity = 'medium';
    } else {
      complexity = 'low';
    }

    // Calculate confidence
    const confidence = maxScore / 100; // Normalize to 0-1

    return { formatType, complexity, confidence };
  }
}

// ===== EXPORT MAIN INTERFACES =====

export {
  BACKSIDE_B_TEMPLATE,
  A_PLUS_TEMPLATE,
  GAP_SCANNER_TEMPLATE,
  FORMAT_DETECTION_PATTERNS,
  ParameterExtractor,
  FormatValidator,
  TemplateSelector
};