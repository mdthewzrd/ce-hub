/**
 * Renata Automatic Error Analysis Service
 *
 * Analyzes scanner execution errors and automatically provides fixes
 */

import { ScannerError } from '@/components/debug/ScannerErrorPanel';

export interface ErrorFix {
  originalCode: string;
  fixedCode: string;
  description: string;
  confidence: 'high' | 'medium' | 'low';
  lineNumber?: number;
  requiresUserConfirmation: boolean;
}

export interface ErrorAnalysis {
  error: ScannerError;
  diagnosis: string;
  suggestedFixes: ErrorFix[];
  canAutoFix: boolean;
  estimatedSuccessRate: number;
}

export interface RenataErrorResponse {
  success: boolean;
  analysis: ErrorAnalysis;
  fixedCode?: string;
  explanation: string;
  appliedFixes: string[];
}

/**
 * Common Python error patterns and their fixes
 */
interface ErrorPattern {
  pattern: RegExp;
  diagnosis: string;
  fix: (code: string, ...args: any[]) => string | null;
}

const ERROR_PATTERNS: Record<string, ErrorPattern> = {
  KEYERROR_TRANSFORM: {
    pattern: /KeyError:\s*\d+\s*.*transform.*axis.*\d+/i,
    diagnosis: "Using .groupby().transform() with axis parameter in lambda - the lambda receives a Series not DataFrame",
    fix: (code: string, lineNum: number) => {
      // Extract the problematic line
      const lines = code.split('\n');
      const line = lines[lineNum - 1];

      // Check if it's the TR (True Range) calculation
      if (line.includes("TR") && line.includes("groupby") && line.includes("transform")) {
        // Replace with direct max computation
        const fixedLine = line.replace(
          /df\[['"]?TR['"]?\]\s*=\s*df\.groupby\(['"]\w+['"]\)\[\[[^\]]+\]\]\.transform\(\s*lambda\s+x:\s*x\.max\(axis=1\)\s*\)/,
          "df['TR'] = df[['high_low', 'high_prev_close', 'low_prev_close']].max(axis=1)"
        );

        lines[lineNum - 1] = fixedLine;
        return lines.join('\n');
      }

      return null;
    }
  },

  DUPLICATE_LABELS: {
    pattern: /ValueError:\s*cannot reindex on an axis with duplicate labels/i,
    diagnosis: "Using .reset_index() after groupby operations - this causes duplicate label errors",
    fix: (code: string, lineNum: number) => {
      // Replace .reset_index(0, drop=True) with .transform()
      const fixedCode = code.replace(
        /(\.groupby\([^)]+\)\[[^\]]+\]\.rolling\([^)]+\)\.mean\(\))\.reset_index\(0,\s*drop=True\)/g,
        '$1'
      );

      // Also need to ensure .transform() is used
      return fixedCode.replace(
        /df\[(['"])([\w_]+)\1\]\s*=\s*df\.groupby\(['"](\w+)['"]\)\[(['"])([\w_]+)\4\]\.rolling\(([^)]+)\)\.mean\(\)/g,
        "df['$2'] = df.groupby('$3').transform(lambda x: x.rolling($5).mean())"
      );
    }
  },

  POLYGON_COLUMN_NAMES: {
    pattern: /KeyError:\s*['"]T['"]|['"]c['"]|['"]v['"]|['"]o['"]|['"]h['"]|['"]l['"]/i,
    diagnosis: "Using Polygon API column names ('T', 'c', 'v', etc.) instead of renamed columns ('ticker', 'close', 'volume')",
    fix: (code: string) => {
      // Check if column renaming is present
      if (!code.includes("rename(columns={'T'")) {
        // Add column renaming after DataFrame creation
        const insertPoint = code.indexOf("df = pd.DataFrame(data['results'])");
        if (insertPoint !== -1) {
          const renameCode = `
        # Rename Polygon API columns to readable names
        df = df.rename(columns={
            'T': 'ticker',
            'o': 'open',
            'h': 'high',
            'l': 'low',
            'c': 'close',
            'v': 'volume',
            'vw': 'vwap',
            't': 'timestamp'
        })`;

          const before = code.substring(0, insertPoint);
          const after = code.substring(insertPoint);
          return before + "df = pd.DataFrame(data['results'])" + renameCode + after.substring(36);
        }
      }

      // Replace Polygon column references
      return code
        .replace(/groupby\(['"]T['"]\)/g, "groupby('ticker')")
        .replace(/\[['"]c['"]\]/g, "['close']")
        .replace(/\[['"]v['"]\]/g, "['volume']")
        .replace(/\[['"]o['"]\]/g, "['open']")
        .replace(/\[['"]h['"]\]/g, "['high']")
        .replace(/\[['"]l['"]\]/g, "['low']");
    }
  },

  MISSING_IMPORT: {
    pattern: /NameError:\s*name\s*['"](\w+)['"]\s*is\s*not\s*defined/i,
    diagnosis: "Missing required import for a module or function",
    fix: (code: string, error: string) => {
      const missingName = error.match(/NameError:\s*name\s*['"](\w+)['"]/)?.[1];
      if (!missingName) return null;

      // Map common missing names to imports
      const imports: {[key: string]: string} = {
        'pd': "import pandas as pd",
        'np': "import numpy as np",
        'get_trading_dates': "from pandas_market_calendars import get_calendar",
        'requests': "import requests"
      };

      const importStatement = imports[missingName];
      if (!importStatement) return null;

      // Check if import already exists
      if (code.includes(importStatement)) return null;

      // Add import at the top
      const lines = code.split('\n');
      let insertIndex = 0;

      // Find the last import line
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].trim().startsWith('import ') || lines[i].trim().startsWith('from ')) {
          insertIndex = i + 1;
        }
      }

      lines.splice(insertIndex, 0, importStatement);
      return lines.join('\n');
    }
  },

  SYNTAX_ERROR: {
    pattern: /SyntaxError:\s*(.+)/i,
    diagnosis: "Python syntax error - usually malformed code",
    fix: (code: string, lineNum: number) => {
      // Check for markdown code blocks
      if (code.includes('```python')) {
        return code.replace(/```python\n?/g, '').replace(/```\n?$/g, '');
      }

      return null;
    }
  }
};

/**
 * Analyze an error and provide automatic fix
 */
export async function analyzeError(
  error: ScannerError,
  code: string
): Promise<RenataErrorResponse> {
  console.log('🤖 Renata analyzing error:', error);

  // Try to match error against known patterns
  for (const [patternName, patternData] of Object.entries(ERROR_PATTERNS)) {
    if (patternData.pattern.test(error.errorMessage)) {
      console.log(`✅ Matched error pattern: ${patternName}`);

      const fixedCode = patternData.fix(code, error.lineNumber || 0);

      if (fixedCode) {
        return {
          success: true,
          analysis: {
            error,
            diagnosis: patternData.diagnosis,
            suggestedFixes: [{
              originalCode: code,
              fixedCode: fixedCode,
              description: patternData.diagnosis,
              confidence: 'high',
              lineNumber: error.lineNumber,
              requiresUserConfirmation: true
            }],
            canAutoFix: true,
            estimatedSuccessRate: 0.9
          },
          fixedCode: fixedCode,
          explanation: `I've identified the issue: ${patternData.diagnosis}. I've automatically applied the fix.`,
          appliedFixes: [patternName]
        };
      }
    }
  }

  // If no pattern matched, use AI to analyze
  return await analyzeErrorWithAI(error, code);
}

/**
 * Use AI to analyze complex errors
 */
async function analyzeErrorWithAI(
  error: ScannerError,
  code: string
): Promise<RenataErrorResponse> {
  console.log('🧠 Using AI to analyze error...');

  try {
    // Call the formatting service with error context
    const prompt = `
ERROR ANALYSIS REQUEST:

Error Type: ${error.errorType}
Error Message: ${error.errorMessage}
Stage: ${error.stage}
Line Number: ${error.lineNumber || 'Unknown'}

Code around error:
${error.codeSnippet || 'Not provided'}

FULL CODE:
${code.length > 5000 ? code.substring(0, 5000) + '\n... (truncated)' : code}

TASK:
1. Analyze the error and explain what went wrong
2. Provide the EXACT fixed code
3. Return ONLY valid JSON format:
{
  "diagnosis": "clear explanation",
  "fixedCode": "complete fixed code",
  "confidence": "high|medium|low",
  "requiresUserConfirmation": true
}
`;

    const response = await fetch('/api/renata/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: prompt,
        context: {
          type: 'error_analysis',
          code: code,
          error: error
        }
      })
    });

    if (!response.ok) {
      throw new Error('AI analysis failed');
    }

    const data = await response.json();

    return {
      success: true,
      analysis: {
        error,
        diagnosis: data.diagnosis || 'Error analyzed by AI',
        suggestedFixes: [{
          originalCode: code,
          fixedCode: data.fixedCode || code,
          description: data.diagnosis || 'AI-suggested fix',
          confidence: data.confidence || 'medium',
          lineNumber: error.lineNumber,
          requiresUserConfirmation: true
        }],
        canAutoFix: true,
        estimatedSuccessRate: data.confidence === 'high' ? 0.8 : 0.6
      },
      fixedCode: data.fixedCode,
      explanation: data.diagnosis || 'AI has analyzed and fixed the error.',
      appliedFixes: ['ai_analysis']
    };

  } catch (aiError) {
    console.error('AI analysis failed:', aiError);

    // Fallback to generic response
    return {
      success: false,
      analysis: {
        error,
        diagnosis: `Unknown error: ${error.errorMessage}`,
        suggestedFixes: [],
        canAutoFix: false,
        estimatedSuccessRate: 0
      },
      explanation: `I couldn't automatically fix this error. The error was: ${error.errorMessage}`,
      appliedFixes: []
    };
  }
}

/**
 * Batch analyze multiple errors
 */
export async function analyzeBatchErrors(
  errors: ScannerError[],
  code: string
): Promise<RenataErrorResponse[]> {
  const results = await Promise.all(
    errors.map(error => analyzeError(error, code))
  );

  return results;
}

// Export as a service object for easier importing
export const renataErrorAnalysisService = {
  analyzeError,
  analyzeBatchErrors
};
