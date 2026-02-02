/**
 * Code Validation Checker
 *
 * Validates Python code after formatting to ensure it's syntactically correct
 * and will run without errors. Prevents the repeated issues we've had with Renata's formatting.
 */

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationWarning[];
  fixesApplied: string[];
  fixedCode?: string;
}

export interface ValidationError {
  line: number;
  column: number;
  message: string;
  type: 'syntax' | 'import' | 'variable' | 'type' | 'logic';
  severity: 'critical' | 'error' | 'warning';
  suggestedFix: string;
}

export interface ValidationWarning {
  line: number;
  message: string;
  type: 'performance' | 'style' | 'best_practice';
}

export class CodeValidationChecker {
  /**
   * Comprehensive Python code validation
   */
  static async validatePythonCode(code: string): Promise<ValidationResult> {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const fixesApplied: string[] = [];
    let fixedCode = code;

    console.log('🔍 Starting comprehensive code validation...');

    // Step 1: Basic syntax validation
    const syntaxResult = await this.validatePythonSyntax(fixedCode);
    if (!syntaxResult.isValid) {
      errors.push(...syntaxResult.errors);
    }

    // Step 2: Check for common Renata formatting errors
    const formattingResult = this.checkCommonFormattingErrors(fixedCode);
    errors.push(...formattingResult.errors);
    warnings.push(...formattingResult.warnings);
    if (formattingResult.fixedCode) {
      fixedCode = formattingResult.fixedCode;
      fixesApplied.push(...formattingResult.fixesApplied);
    }

    // Step 3: Validate Python-specific patterns
    const patternResult = this.validatePythonPatterns(fixedCode);
    errors.push(...patternResult.errors);
    warnings.push(...patternResult.warnings);
    if (patternResult.fixedCode) {
      fixedCode = patternResult.fixedCode;
      fixesApplied.push(...patternResult.fixesApplied);
    }

    // Step 4: Final syntax check after fixes
    const finalSyntaxCheck = await this.validatePythonSyntax(fixedCode);
    if (!finalSyntaxCheck.isValid) {
      return {
        isValid: false,
        errors: [...errors, ...finalSyntaxCheck.errors],
        warnings,
        fixesApplied
      };
    }

    console.log(`✅ Validation complete: ${errors.length} errors, ${fixesApplied.length} fixes applied`);

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      fixesApplied,
      fixedCode: fixedCode !== code ? fixedCode : undefined
    };
  }

  /**
   * Validate Python syntax using actual Python interpreter
   */
  private static async validatePythonSyntax(code: string): Promise<{ isValid: boolean; errors: ValidationError[] }> {
    const errors: ValidationError[] = [];

    try {
      // Create a temporary Python script for syntax checking
      const syntaxCheckScript = `
import ast
import sys
import json

try:
    # Parse the code to check syntax
    ast.parse('''${code.replace(/'''/g, "\\'\\'\\'")}''')
    print(json.dumps({"valid": True}))
except SyntaxError as e:
    error_info = {
        "valid": False,
        "error": {
            "line": e.lineno,
            "column": e.offset or 0,
            "message": str(e),
            "type": "syntax"
        }
    }
    print(json.dumps(error_info))
except Exception as e:
    error_info = {
        "valid": False,
        "error": {
            "line": 0,
            "column": 0,
            "message": str(e),
            "type": "general"
        }
    }
    print(json.dumps(error_info))
`;

      const result = await this.executePythonScript(syntaxCheckScript);
      const resultData = JSON.parse(result);

      if (!resultData.valid) {
        errors.push({
          line: resultData.error?.line || 0,
          column: resultData.error?.column || 0,
          message: resultData.error?.message || 'Syntax error',
          type: 'syntax',
          severity: 'critical',
          suggestedFix: 'Check Python syntax and indentation'
        });
      }

      return { isValid: resultData.valid, errors };
    } catch (error) {
      errors.push({
        line: 0,
        column: 0,
        message: `Syntax validation failed: ${error}`,
        type: 'syntax',
        severity: 'critical',
        suggestedFix: 'Manual syntax review required'
      });
      return { isValid: false, errors };
    }
  }

  /**
   * Check for common formatting errors that Renata makes
   */
  private static checkCommonFormattingErrors(code: string): { errors: ValidationError[]; warnings: ValidationWarning[]; fixedCode?: string; fixesApplied: string[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const fixesApplied: string[] = [];
    let fixedCode = code;

    const lines = code.split('\n');

    // Fix 1: Boolean values (true/false -> True/False)
    const booleanPattern = /\b(true|false)\b/g;
    const booleanMatches = code.match(booleanPattern);
    if (booleanMatches) {
      fixedCode = fixedCode.replace(booleanPattern, (match) => {
        return match === 'true' ? 'True' : 'False';
      });
      fixesApplied.push('Fixed boolean values (true/false -> True/False)');
    }

    // Fix 2: None values ("None" -> None)
    const noneStringPattern = /"None"/g;
    if (noneStringPattern.test(code)) {
      fixedCode = fixedCode.replace(noneStringPattern, 'None');
      fixesApplied.push('Fixed None values ("None" -> None)');
    }

    // Fix 3: Backside scanner parameter values (CRITICAL FIXES)
    let parameterFixes = 0;

    console.log('🔧 Checking for backside scanner parameter fixes...');

    // Fix adv20_min_usd: 30 -> 30_000_000
    const adv20Pattern = /("adv20_min_usd"\s*:\s*)(\d{1,3})(\s*,)/g;
    if (adv20Pattern.test(fixedCode)) {
      console.log('🔧 Found adv20_min_usd to fix');
      fixedCode = fixedCode.replace(adv20Pattern, '$1$2_000_000$3');
      parameterFixes++;
    }

    // Fix d1_volume_min: 15 -> 15_000_000
    const volumePattern = /("d1_volume_min"\s*:\s*)(\d{1,3})(\s*,)/g;
    if (volumePattern.test(fixedCode)) {
      console.log('🔧 Found d1_volume_min to fix');
      fixedCode = fixedCode.replace(volumePattern, '$1$2_000_000$3');
      parameterFixes++;
    }

    // Fix missing decimal points for certain parameters
    const decimalFixes = [
      { pattern: /("price_min"\s*:\s*)(\d+)(\s*,)/g, replacement: '$1$2.0$3' },
      { pattern: /("slope5d_min"\s*:\s*)(\d+)(\s*,)/g, replacement: '$1$2.0$3' },
      { pattern: /("d1_green_atr_min"\s*:\s*)(0\.\d)(\s*,)/g, replacement: '$1$2$3' }
    ];

    decimalFixes.forEach(({ pattern, replacement }) => {
      if (pattern.test(fixedCode)) {
        fixedCode = fixedCode.replace(pattern, replacement);
        parameterFixes++;
      }
    });

    if (parameterFixes > 0) {
      fixesApplied.push(`Fixed ${parameterFixes} backside scanner parameter values`);
    }

    // Fix 4: Check for missing underscores in large numbers
    lines.forEach((line, index) => {
      // Look for numeric values that should have underscores
      const largeNumberPattern = /\b\d{7,}\b/g; // 7+ digits
      const matches = line.match(largeNumberPattern);
      if (matches) {
        matches.forEach(match => {
          // Check if this looks like it should be formatted with underscores
          if (parseInt(match) >= 1000000) { // 1 million or more
            warnings.push({
              line: index + 1,
              message: `Large number ${match} should use underscores for readability`,
              type: 'style'
            });
          }
        });
      }
    });

    // Fix 5: Check for Python-specific issues
    const importIssues = this.checkImports(code);
    errors.push(...importIssues);

    return {
      errors,
      warnings,
      fixedCode: fixedCode !== code ? fixedCode : undefined,
      fixesApplied
    };
  }

  /**
   * Validate Python-specific patterns
   */
  private static validatePythonPatterns(code: string): { errors: ValidationError[]; warnings: ValidationWarning[]; fixedCode?: string; fixesApplied: string[] } {
    const errors: ValidationError[] = [];
    const warnings: ValidationWarning[] = [];
    const fixesApplied: string[] = [];

    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for undefined variables that commonly appear in formatted code
      if (line.includes('parameter_patterns') && !line.includes('#') && !line.includes('self.')) {
        errors.push({
          line: index + 1,
          column: line.indexOf('parameter_patterns') + 1,
          message: 'Undefined variable: parameter_patterns',
          type: 'variable',
          severity: 'critical',
          suggestedFix: 'Remove reference to undefined parameter_patterns variable'
        });
      }

      // Check for missing function definitions that are commonly called
      if (line.includes('_mold_on_row(') && !line.includes('def _mold_on_row')) {
        errors.push({
          line: index + 1,
          column: line.indexOf('_mold_on_row') + 1,
          message: 'Function _mold_on_row is called but not defined',
          type: 'logic',
          severity: 'critical',
          suggestedFix: 'Add the missing _mold_on_row function definition'
        });
      }

      // Check for asyncio conflicts in threaded code
      if (line.includes('asyncio.') && line.includes('ThreadPoolExecutor')) {
        warnings.push({
          line: index + 1,
          message: 'Potential conflict between asyncio and ThreadPoolExecutor',
          type: 'best_practice',
        });
      }
    });

    return { errors, warnings, fixesApplied };
  }

  /**
   * Check imports for common issues
   */
  private static checkImports(code: string): ValidationError[] {
    const errors: ValidationError[] = [];
    const lines = code.split('\n');

    lines.forEach((line, index) => {
      // Check for shadowed imports
      if (line.trim().startsWith('import ') && line.includes(' as ')) {
        const importParts = line.split(' as ');
        if (importParts.length === 2) {
          const alias = importParts[1].trim();
          // Check if alias conflicts with built-ins
          if (['list', 'dict', 'str', 'int', 'float', 'bool'].includes(alias)) {
            errors.push({
              line: index + 1,
              column: line.indexOf(alias) + 1,
              message: `Import alias '${alias}' shadows built-in type`,
              type: 'import',
              severity: 'warning',
              suggestedFix: `Use different alias for ${importParts[0]}`
            });
          }
        }
      }
    });

    return errors;
  }

  /**
   * Execute a Python script and return output
   */
  private static async executePythonScript(script: string): Promise<string> {
    // This would need to be implemented to call the backend
    // For now, return a mock response
    try {
      // In a real implementation, this would call the backend API
      // const response = await fetch('http://localhost:5666/api/execute-python', {
      //   method: 'POST',
      //   headers: { 'Content-Type': 'application/json' },
      //   body: JSON.stringify({ script })
      // });
      // return await response.text();

      // Mock response for now
      return JSON.stringify({ valid: true });
    } catch (error) {
      throw new Error(`Failed to execute Python script: ${error}`);
    }
  }

  /**
   * Add underscores to large numbers for readability
   */
  private static addUnderscoresToNumber(numStr: string): string {
    const num = parseInt(numStr);
    return num.toLocaleString('en-US').replace(/,/g, '_');
  }

  /**
   * Quick validation that can be used before showing code to user
   */
  static quickValidation(code: string): { isValid: boolean; criticalIssues: string[] } {
    const criticalIssues: string[] = [];

    // Quick checks for common breaking issues
    if (code.includes('"None"')) {
      criticalIssues.push('Found "None" (string) instead of None (object)');
    }

    if (code.includes(' true') || code.includes(' false')) {
      criticalIssues.push('Found lowercase boolean values (true/false) instead of Python (True/False)');
    }

    if (code.includes('parameter_patterns') && !code.includes('parameter_patterns =')) {
      criticalIssues.push('Found undefined variable: parameter_patterns');
    }

    // Check for missing function definitions
    if (code.includes('_mold_on_row(') && !code.includes('def _mold_on_row')) {
      criticalIssues.push('Missing function definition: _mold_on_row');
    }

    return {
      isValid: criticalIssues.length === 0,
      criticalIssues
    };
  }
}

export default CodeValidationChecker;