import { NextRequest, NextResponse } from 'next/server';

/**
 * Code Validation API
 *
 * Validates Python code after formatting to ensure it will run without errors
 * This addresses the repeated issues with Renata's formatting output
 */

interface ValidationRequest {
  code: string;
  language: 'python' | 'javascript';
}

interface ValidationResponse {
  isValid: boolean;
  errors: Array<{
    line: number;
    column: number;
    message: string;
    type: string;
    severity: string;
    suggestedFix: string;
  }>;
  warnings: Array<{
    line: number;
    message: string;
    type: string;
  }>;
  fixesApplied: string[];
  fixedCode?: string;
  criticalIssues: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: ValidationRequest = await request.json();
    const { code, language = 'python' } = body;

    if (!code) {
      return NextResponse.json({
        isValid: false,
        errors: [{ line: 0, column: 0, message: 'No code provided', type: 'input', severity: 'critical', suggestedFix: 'Provide code to validate' }],
        warnings: [],
        fixesApplied: [],
        criticalIssues: ['No code provided for validation']
      }, { status: 400 });
    }

    console.log(`🔍 Validating ${language} code (${code.length} characters)...`);

    // For now, focus on Python validation
    if (language !== 'python') {
      return NextResponse.json({
        isValid: true,
        errors: [],
        warnings: [{ line: 1, message: `Validation for ${language} not implemented yet`, type: 'info' }],
        fixesApplied: [],
        criticalIssues: []
      });
    }

    const result = await validatePythonCode(code);

    console.log(`✅ Validation complete: ${result.errors.length} errors, ${result.fixesApplied.length} fixes`);

    return NextResponse.json(result);

  } catch (error) {
    console.error('❌ Code validation error:', error);
    return NextResponse.json({
      isValid: false,
      errors: [{
        line: 0,
        column: 0,
        message: `Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
        type: 'system',
        severity: 'critical',
        suggestedFix: 'Check validation service'
      }],
      warnings: [],
      fixesApplied: [],
      criticalIssues: ['Validation service error']
    }, { status: 500 });
  }
}

async function validatePythonCode(code: string): Promise<ValidationResponse> {
  const errors: any[] = [];
  const warnings: any[] = [];
  const fixesApplied: string[] = [];
  let fixedCode = code;

  // Quick validation checks for common issues
  const criticalIssues: string[] = [];

  // Check 1: Boolean values
  const booleanPattern = /\b(true|false)\b/g;
  const booleanMatches = code.match(booleanPattern);
  if (booleanMatches) {
    fixedCode = fixedCode.replace(booleanPattern, (match) => match === 'true' ? 'True' : 'False');
    fixesApplied.push('Fixed boolean values (true/false -> True/False)');
    criticalIssues.push('Found lowercase boolean values (true/false) instead of Python (True/False)');
  }

  // Check 2: None values
  const noneStringPattern = /"None"/g;
  if (noneStringPattern.test(code)) {
    fixedCode = fixedCode.replace(noneStringPattern, 'None');
    fixesApplied.push('Fixed None values ("None" -> None)');
    criticalIssues.push('Found string "None" instead of Python None object');
  }

  // Check 3: Backside scanner parameter values (CRITICAL FIXES)
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
    criticalIssues.push(`Fixed incorrect parameter values (${parameterFixes} parameters corrected)`);
    console.log(`✅ Applied ${parameterFixes} parameter fixes`);
  }

  // Check 4: Undefined variables
  const lines = code.split('\n');
  lines.forEach((line, index) => {
    if (line.includes('parameter_patterns') && !line.includes('#') && !line.includes('self.') && !line.includes('parameter_patterns =')) {
      errors.push({
        line: index + 1,
        column: Math.max(1, line.indexOf('parameter_patterns')),
        message: 'Undefined variable: parameter_patterns',
        type: 'variable',
        severity: 'critical',
        suggestedFix: 'Remove reference to undefined parameter_patterns variable'
      });
      criticalIssues.push('Found undefined variable: parameter_patterns');
    }

    if (line.includes('_mold_on_row(') && !code.includes('def _mold_on_row')) {
      errors.push({
        line: index + 1,
        column: Math.max(1, line.indexOf('_mold_on_row')),
        message: 'Function _mold_on_row is called but not defined',
        type: 'logic',
        severity: 'critical',
        suggestedFix: 'Add the missing _mold_on_row function definition'
      });
      criticalIssues.push('Missing function definition: _mold_on_row');
    }
  });

  // Check 5: Try to validate syntax using Python if available
  let syntaxValid = false;
  try {
    // Call the backend to validate Python syntax
    const syntaxCheckCode = `
import ast
import json
import sys

try:
    # Parse the code to check syntax
    ast.parse('''${code.replace(/'''/g, "\\'\\'\\'").replace(/\\n/g, '\\n')}''')
    print(json.dumps({"valid": True, "errors": []}))
except SyntaxError as e:
    error_info = {
        "valid": False,
        "errors": [{
            "line": e.lineno or 1,
            "column": e.offset or 1,
            "message": str(e),
            "type": "syntax"
        }]
    }
    print(json.dumps(error_info))
except Exception as e:
    print(json.dumps({"valid": False, "errors": [{"line": 1, "column": 1, "message": str(e), "type": "general"}]}))
`;

    const response = await fetch('http://localhost:5666/api/execute-python', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ script: syntaxCheckCode })
    });

    if (response.ok) {
      const result = await response.json();
      if (result.valid) {
        syntaxValid = true;
      } else {
        errors.push(...result.errors.map((err: any) => ({
          ...err,
          severity: 'critical',
          suggestedFix: 'Fix syntax error'
        })));
        criticalIssues.push('Syntax errors found in code');
      }
    }
  } catch (error) {
    warnings.push({
      line: 1,
      message: 'Could not validate Python syntax (backend unavailable)',
      type: 'system'
    });
  }

  const isValid = errors.length === 0 && (syntaxValid || criticalIssues.length === 0);

  return {
    isValid,
    errors,
    warnings,
    fixesApplied: fixesApplied.length > 0 ? fixesApplied : [],
    fixedCode: fixedCode !== code ? fixedCode : undefined,
    criticalIssues
  };
}