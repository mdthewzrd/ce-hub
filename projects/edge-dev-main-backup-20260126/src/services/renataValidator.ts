/**
 * Renata Code Validator
 *
 * Comprehensive validation system for AI-generated scanner code
 * Validates structure, syntax, and logic before execution
 */

import { PythonShell } from 'python-shell';

export interface ValidationResult {
  layer: 'structure' | 'syntax' | 'logic';
  passed: boolean;
  score: number; // 0-100
  issues: ValidationIssue[];
  timestamp: string;
}

export interface ValidationIssue {
  severity: 'critical' | 'error' | 'warning' | 'info';
  category: string;
  message: string;
  line?: number;
  suggestion?: string;
}

export interface ComprehensiveValidation {
  structure: ValidationResult;
  syntax: ValidationResult;
  logic: ValidationResult;

  overall: {
    score: number; // 0-100
    passed: boolean;
    canDeploy: boolean;
    status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';
    recommendations: string[];
  };

  executionTime: number;
  timestamp: string;
}

export interface ValidationOptions {
  scannerType?: 'single' | 'multi';
  strictMode?: boolean;
  checkRuleCompliance?: boolean;
}

/**
 * Main validator class
 */
export class RenataValidator {

  /**
   * Run all validation layers
   */
  async validate(code: string, options: ValidationOptions = {}): Promise<ComprehensiveValidation> {
    const startTime = Date.now();

    console.log('🔍 Starting comprehensive code validation...');

    // Run all validation layers in parallel
    const [structure, syntax, logic] = await Promise.all([
      this.validateStructure(code, options),
      this.validateSyntax(code),
      this.validateLogic(code, options)
    ]);

    // Calculate overall score
    const overall = this.calculateOverallScore(structure, syntax, logic);

    const executionTime = Date.now() - startTime;

    return {
      structure,
      syntax,
      logic,
      overall,
      executionTime,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Layer 1: Structure Validation
   * Checks that code follows EdgeDev architecture
   */
  private async validateStructure(code: string, options: ValidationOptions): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    let score = 100;

    console.log('  📐 Validating structure...');

    // Check 1: Required imports
    const requiredImports = [
      'import pandas as pd',
      'import numpy as np',
      'import requests',
      'import time',
      'from datetime import',
      'from concurrent.futures import',
      'import pandas_market_calendars as mcal'
    ];

    const missingImports = requiredImports.filter(imp => !code.includes(imp));
    if (missingImports.length > 0) {
      issues.push({
        severity: 'error',
        category: 'imports',
        message: `Missing required imports: ${missingImports.join(', ')}`,
        suggestion: 'Add all required imports for EdgeDev scanner'
      });
      score -= missingImports.length * 10;
    }

    // Check 2: Class definition
    if (!code.includes('class ')) {
      issues.push({
        severity: 'critical',
        category: 'class',
        message: 'No class definition found',
        suggestion: 'Scanner must be defined as a class'
      });
      score -= 30;
    }

    // Check 3: __init__ method
    if (!code.includes('def __init__')) {
      issues.push({
        severity: 'critical',
        category: 'constructor',
        message: 'Missing __init__ method',
        suggestion: 'Must have __init__ with api_key, d0_start, d0_end parameters'
      });
      score -= 20;
    } else {
      // Check __init__ stores parameters
      if (!code.includes('self.api_key = api_key')) {
        issues.push({
          severity: 'critical',
          category: 'constructor',
          message: '__init__ does not store api_key',
          suggestion: 'Add: self.api_key = api_key'
        });
        score -= 10;
      }

      if (!code.includes('self.d0_start') || !code.includes('self.d0_end')) {
        issues.push({
          severity: 'error',
          category: 'constructor',
          message: '__init__ does not store date parameters',
          suggestion: 'Add: self.d0_start = d0_start and self.d0_end = d0_end'
        });
        score -= 10;
      }
    }

    // Check 4: Required methods
    const requiredMethods = [
      'def fetch_all_grouped_data',
      'def compute_simple_features',
      'def apply_smart_filters',
      'def execute'
    ];

    const missingMethods = requiredMethods.filter(method => !code.includes(method));
    if (missingMethods.length > 0) {
      issues.push({
        severity: 'error',
        category: 'methods',
        message: `Missing required methods: ${missingMethods.join(', ')}`,
        suggestion: 'All scanners must have these methods'
      });
      score -= missingMethods.length * 10;
    }

    // Check 5: Scanner-specific requirements
    if (options.scannerType === 'single') {
      if (!code.includes('ThreadPoolExecutor')) {
        issues.push({
          severity: 'error',
          category: 'parallelization',
          message: 'Single-scanner must use ThreadPoolExecutor',
          suggestion: 'Add parallel ticker processing with ThreadPoolExecutor'
        });
        score -= 15;
      }

      if (!code.includes('process_ticker')) {
        issues.push({
          severity: 'warning',
          category: 'methods',
          message: 'Single-scanner should have process_ticker or process_ticker_3 method',
          suggestion: 'Add process_ticker_3 method for pattern detection'
        });
        score -= 5;
      }
    } else if (options.scannerType === 'multi') {
      if (!code.includes('compute_full_features')) {
        issues.push({
          severity: 'error',
          category: 'methods',
          message: 'Multi-scanner must have compute_full_features method',
          suggestion: 'Add compute_full_features for EMA/ATR calculations'
        });
        score -= 15;
      }
    }

    // Check 6: Session configuration
    if (!code.includes('requests.Session()') || !code.includes('HTTPAdapter')) {
      issues.push({
        severity: 'warning',
        category: 'configuration',
        message: 'Missing connection pooling configuration',
        suggestion: 'Add requests.Session() with HTTPAdapter for performance'
      });
      score -= 5;
    }

    // Check 7: Parameters dictionary
    if (!code.includes('self.params')) {
      issues.push({
        severity: 'error',
        category: 'parameters',
        message: 'Missing self.params dictionary',
        suggestion: 'Define self.params in __init__ with scanner parameters'
      });
      score -= 15;
    }

    // Ensure score doesn't go below 0
    score = Math.max(0, score);

    return {
      layer: 'structure',
      passed: score >= 70,
      score,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Layer 2: Syntax Validation
   * Checks that Python code is syntactically valid
   */
  private async validateSyntax(code: string): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    let score = 100;

    console.log('  🔤 Validating Python syntax...');

    try {
      // Use Python to check syntax
      const result = await this.runPythonSyntaxCheck(code);

      if (!result.valid) {
        issues.push({
          severity: 'critical',
          category: 'syntax',
          message: result.error || 'Syntax error detected',
          suggestion: 'Fix Python syntax errors'
        });
        score = 0;
      }

      // Check for common syntax patterns
      const syntaxPatterns = [
        { pattern: /:\s*$/, message: 'Possible incomplete statement (ends with colon)' },
        { pattern: /\[\s*$/, message: 'Possible unclosed bracket' },
        { pattern: /\(\s*$/, message: 'Possible unclosed parenthesis' },
        { pattern: /\{\s*$/, message: 'Possible unclosed brace' }
      ];

      const lines = code.split('\n');
      lines.forEach((line, index) => {
        syntaxPatterns.forEach(({ pattern, message }) => {
          if (pattern.test(line.trim())) {
            issues.push({
              severity: 'warning',
              category: 'syntax',
              message: `Line ${index + 1}: ${message}`,
              line: index + 1,
              suggestion: 'Check for incomplete code block'
            });
            score -= 2;
          }
        });
      });

    } catch (error) {
      issues.push({
        severity: 'error',
        category: 'validation',
        message: `Syntax validation failed: ${error}`,
        suggestion: 'Could not validate syntax'
      });
      score -= 20;
    }

    score = Math.max(0, score);

    return {
      layer: 'syntax',
      passed: score >= 80,
      score,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Layer 3: Logic Validation
   * Checks for Rule #5 compliance and critical logic errors
   */
  private async validateLogic(code: string, options: ValidationOptions): Promise<ValidationResult> {
    const issues: ValidationIssue[] = [];
    let score = 100;

    console.log('  🧠 Validating logic and rule compliance...');

    // Check 1: Rule #5 - Feature computation order
    const applySmartFiltersMatch = code.match(/def apply_smart_filters[\s\S]*?\n    def /);
    if (applySmartFiltersMatch) {
      const functionBody = applySmartFiltersMatch[0];

      // Check if dropna appears before feature computation
      const dropnaIndex = functionBody.indexOf('dropna');
      const featureComputeIndex = functionBody.indexOf("df['prev_close']");

      if (dropnaIndex > 0 && dropnaIndex < featureComputeIndex) {
        issues.push({
          severity: 'critical',
          category: 'rule5',
          message: '🔴 CRITICAL: dropna() called BEFORE feature computation',
          suggestion: 'Compute features (prev_close, ADV20, price_range) BEFORE calling dropna()',
          line: this.findLineNumber(code, 'dropna')
        });
        score -= 50;
      } else if (featureComputeIndex < 0) {
        issues.push({
          severity: 'error',
          category: 'rule5',
          message: 'Features not computed in apply_smart_filters',
          suggestion: 'Compute prev_close, ADV20, and price_range before filtering'
        });
        score -= 30;
      } else {
        // Good! Features computed before dropna
        console.log('    ✅ Rule #5 compliant: Features computed before dropna');
      }
    }

    // Check 2: groupby + transform usage
    if (!code.includes('groupby') || !code.includes('transform')) {
      issues.push({
        severity: 'error',
        category: 'pattern',
        message: 'Missing groupby + transform pattern',
        suggestion: 'Use df.groupby("ticker").transform() for rolling calculations'
      });
      score -= 20;
    }

    // Check 3: Parameter access pattern
    const hasHardcodedValues = /\b(price_min|adv20_min|pos_abs_max|atr_mult)\s*[=!]=\s*[0-9.]+/.test(code);
    if (hasHardcodedValues) {
      issues.push({
        severity: 'warning',
        category: 'parameters',
        message: 'Possible hardcoded parameter value',
        suggestion: 'Access parameters via self.params["param_name"]'
      });
      score -= 10;
    }

    // Check 4: Column reference validation (common missing columns)
    const columnReferences = code.match(/df\[['"]([^'"]+)['"]\]|row\[['"]([^'"]+)['"]\]/g) || [];
    const commonColumns = ['ticker', 'date', 'open', 'high', 'low', 'close', 'volume'];

    // Check for references to potentially undefined columns
    const suspiciousRefs = columnReferences.filter(ref => {
      const match = ref.match(/['"]([^'"]+)['"]/);
      if (!match) return false;
      const col = match[1];
      return !commonColumns.includes(col) &&
             !code.includes(`df['${col}'] =`) &&
             !col.includes('prev') &&
             !col.includes('EMA') &&
             !col.includes('ATR') &&
             !col.includes('VOL');
    });

    if (suspiciousRefs.length > 0) {
      const uniqueRefs = [...new Set(suspiciousRefs)];
      issues.push({
        severity: 'warning',
        category: 'columns',
        message: `References to potentially undefined columns: ${uniqueRefs.length} found`,
        suggestion: 'Verify these columns are computed before use'
      });
      score -= Math.min(20, uniqueRefs.length * 2);
    }

    // Check 5: Shift operations
    const shift1Pattern = /\.(shift\(1\)|shift\(1\)|shift\(1\))/;
    const shift2Pattern = /\.(shift\(2\)|shift\(2\)|shift\(2\))/;

    if (!shift1Pattern.test(code)) {
      issues.push({
        severity: 'info',
        category: 'shifts',
        message: 'No shift(1) operations found (D-1 references)',
        suggestion: 'May need D-1 calculations'
      });
    }

    // Check 6: DataFrame assignment patterns
    if (code.includes('df[') && !code.includes("df.groupby")) {
      issues.push({
        severity: 'warning',
        category: 'pattern',
        message: 'DataFrame operations without groupby may be incorrect',
        suggestion: 'Use groupby("ticker").transform() for per-ticker calculations'
      });
      score -= 5;
    }

    score = Math.max(0, score);

    return {
      layer: 'logic',
      passed: score >= 60,
      score,
      issues,
      timestamp: new Date().toISOString()
    };
  }

  /**
   * Calculate overall validation score
   */
  private calculateOverallScore(
    structure: ValidationResult,
    syntax: ValidationResult,
    logic: ValidationResult
  ): ComprehensiveValidation['overall'] {
    // Weighted average: structure 40%, syntax 30%, logic 30%
    const score = Math.round(
      (structure.score * 0.4) +
      (syntax.score * 0.3) +
      (logic.score * 0.3)
    );

    const allIssues = [
      ...structure.issues,
      ...syntax.issues,
      ...logic.issues
    ];

    const criticalIssues = allIssues.filter(i => i.severity === 'critical').length;
    const errorIssues = allIssues.filter(i => i.severity === 'error').length;

    let status: 'excellent' | 'good' | 'fair' | 'poor' | 'critical';

    if (criticalIssues > 0) {
      status = 'critical';
    } else if (score >= 90) {
      status = 'excellent';
    } else if (score >= 75) {
      status = 'good';
    } else if (score >= 60) {
      status = 'fair';
    } else {
      status = 'poor';
    }

    const recommendations = this.generateRecommendations(allIssues);

    return {
      score,
      passed: score >= 60,
      canDeploy: score >= 90 && criticalIssues === 0 && errorIssues === 0,
      status,
      recommendations
    };
  }

  /**
   * Generate actionable recommendations from issues
   */
  private generateRecommendations(issues: ValidationIssue[]): string[] {
    const recommendations: string[] = [];

    const criticalCount = issues.filter(i => i.severity === 'critical').length;
    const errorCount = issues.filter(i => i.severity === 'error').length;
    const warningCount = issues.filter(i => i.severity === 'warning').length;

    if (criticalCount > 0) {
      recommendations.push(`🚨 CRITICAL: Fix ${criticalCount} critical issues before deployment`);
    }

    if (errorCount > 0) {
      recommendations.push(`❌ Fix ${errorCount} errors to make code functional`);
    }

    if (warningCount > 5) {
      recommendations.push(`⚠️ Address ${warningCount} warnings for better code quality`);
    }

    // Category-specific recommendations
    const categories = [...new Set(issues.map(i => i.category))];
    categories.forEach(category => {
      const categoryIssues = issues.filter(i => i.category === category);
      if (categoryIssues.length >= 3) {
        recommendations.push(`📌 Focus on fixing ${category} issues (${categoryIssues.length} found)`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push('✅ Code looks good! Ready for testing.');
    }

    return recommendations;
  }

  /**
   * Run Python syntax check
   */
  private async runPythonSyntaxCheck(code: string): Promise<{ valid: boolean; error?: string }> {
    return new Promise((resolve) => {
      const tempFile = '/tmp/renata_syntax_check.py';

      const fs = require('fs');
      fs.writeFileSync(tempFile, code);

      PythonShell.run('-m py_compile', {
        mode: 'text',
        pythonPath: 'python3',
        args: [tempFile]
      }).then(() => {
        fs.unlinkSync(tempFile);
        resolve({ valid: true });
      }).catch((error) => {
        fs.unlinkSync(tempFile);
        resolve({ valid: false, error: error.message });
      });
    });
  }

  /**
   * Find line number for a pattern in code
   */
  private findLineNumber(code: string, pattern: string): number | undefined {
    const lines = code.split('\n');
    const index = lines.findIndex(line => line.includes(pattern));
    return index >= 0 ? index + 1 : undefined;
  }
}

/**
 * Singleton instance
 */
export const renataValidator = new RenataValidator();
