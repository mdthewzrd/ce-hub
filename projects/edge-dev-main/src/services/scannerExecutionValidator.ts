/**
 * SCANNER EXECUTION VALIDATOR
 * ===========================
 *
 * Validates that formatted scanners produce the same results as original scanners
 * by executing both and comparing their outputs.
 *
 * This is the ultimate validation - if the outputs don't match, the pattern logic was not preserved.
 */

import { ScannerParameters } from '@/types/scannerTypes';

interface ExecutionConfig {
  dateRange: {
    start: string;  // ISO date string, e.g., "2024-01-01"
    end: string;    // ISO date string, e.g., "2024-12-31"
  };
  tickers?: string[];  // Optional: limit test to specific tickers
  timeout?: number;    // Execution timeout in milliseconds (default: 30000)
}

interface ExecutionResult {
  success: boolean;
  signals: Signal[];
  executionTime: number;
  error?: string;
  metadata: {
    scannerType: string;
    dateRange: ExecutionConfig['dateRange'];
    tickersTested: number;
    signalsFound: number;
  };
}

interface Signal {
  ticker: string;
  date: string;
  confidence?: number;
  [key: string]: any;  // Allow additional scanner-specific fields
}

interface ValidationResult {
  isValid: boolean;
  originalResult: ExecutionResult;
  formattedResult: ExecutionResult;
  comparison: {
    signalsMatch: boolean;
    originalSignalCount: number;
    formattedSignalCount: number;
    missingSignals: Signal[];
    extraSignals: Signal[];
    matchingSignals: Signal[];
    signalMatchRate: number;
  };
  performanceComparison: {
    originalExecutionTime: number;
    formattedExecutionTime: number;
    timeDifference: number;
    timeDifferencePercent: number;
  };
  errors: string[];
  warnings: string[];
}

/**
 * Execute a scanner and return its results
 */
export async function executeScanner(
  scannerCode: string,
  config: ExecutionConfig
): Promise<ExecutionResult> {
  const startTime = Date.now();

  try {
    // Call the backend execution API
    const response = await fetch('/api/renata/execute', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        code: scannerCode,
        dateRange: config.dateRange,
        tickers: config.tickers,
        timeout: config.timeout || 30000
      }),
    });

    if (!response.ok) {
      throw new Error(`Execution failed: ${response.statusText}`);
    }

    const data = await response.json();

    return {
      success: true,
      signals: data.signals || [],
      executionTime: Date.now() - startTime,
      metadata: {
        scannerType: data.scannerType || 'unknown',
        dateRange: config.dateRange,
        tickersTested: data.tickersTested || 0,
        signalsFound: data.signals?.length || 0
      }
    };

  } catch (error) {
    return {
      success: false,
      signals: [],
      executionTime: Date.now() - startTime,
      error: error instanceof Error ? error.message : String(error),
      metadata: {
        scannerType: 'unknown',
        dateRange: config.dateRange,
        tickersTested: 0,
        signalsFound: 0
      }
    };
  }
}

/**
 * Validate that formatted scanner produces same results as original
 */
export async function validateByExecution(
  originalCode: string,
  formattedCode: string,
  config: ExecutionConfig
): Promise<ValidationResult> {
  const result: ValidationResult = {
    isValid: false,
    originalResult: null as any,
    formattedResult: null as any,
    comparison: {
      signalsMatch: false,
      originalSignalCount: 0,
      formattedSignalCount: 0,
      missingSignals: [],
      extraSignals: [],
      matchingSignals: [],
      signalMatchRate: 0
    },
    performanceComparison: {
      originalExecutionTime: 0,
      formattedExecutionTime: 0,
      timeDifference: 0,
      timeDifferencePercent: 0
    },
    errors: [],
    warnings: []
  };

  // Execute both scanners
  console.log('🔬 Executing original scanner...');
  result.originalResult = await executeScanner(originalCode, config);

  console.log('🔬 Executing formatted scanner...');
  result.formattedResult = await executeScanner(formattedCode, config);

  // Check for execution errors
  if (!result.originalResult.success) {
    result.errors.push(`Original scanner execution failed: ${result.originalResult.error}`);
    return result;
  }

  if (!result.formattedResult.success) {
    result.errors.push(`Formatted scanner execution failed: ${result.formattedResult.error}`);
    return result;
  }

  // Compare signals
  const comparison = compareSignals(
    result.originalResult.signals,
    result.formattedResult.signals
  );
  result.comparison = comparison;

  // Compare performance
  result.performanceComparison = {
    originalExecutionTime: result.originalResult.executionTime,
    formattedExecutionTime: result.formattedResult.executionTime,
    timeDifference: result.formattedResult.executionTime - result.originalResult.executionTime,
    timeDifferencePercent: ((result.formattedResult.executionTime - result.originalResult.executionTime) / result.originalResult.executionTime) * 100
  };

  // Determine validity
  result.isValid = comparison.signalsMatch;

  // Generate warnings
  if (!comparison.signalsMatch) {
    if (comparison.missingSignals.length > 0) {
      result.warnings.push(`Missing ${comparison.missingSignals.length} signals in formatted output`);
    }
    if (comparison.extraSignals.length > 0) {
      result.warnings.push(`Found ${comparison.extraSignals.length} extra signals in formatted output`);
    }
  }

  if (result.performanceComparison.timeDifferencePercent > 50) {
    result.warnings.push(`Formatted scanner took ${result.performanceComparison.timeDifferencePercent.toFixed(1)}% longer to execute`);
  }

  return result;
}

/**
 * Compare two sets of signals
 */
function compareSignals(
  originalSignals: Signal[],
  formattedSignals: Signal[]
): ValidationResult['comparison'] {
  // Create maps for efficient lookup
  const originalMap = new Map<string, Signal>();
  const formattedMap = new Map<string, Signal>();

  for (const signal of originalSignals) {
    const key = signalKey(signal);
    originalMap.set(key, signal);
  }

  for (const signal of formattedSignals) {
    const key = signalKey(signal);
    formattedMap.set(key, signal);
  }

  // Find matching, missing, and extra signals
  const matchingSignals: Signal[] = [];
  const missingSignals: Signal[] = [];
  const extraSignals: Signal[] = [];

  // Check original signals
  for (const [key, signal] of originalMap) {
    if (formattedMap.has(key)) {
      matchingSignals.push(signal);
    } else {
      missingSignals.push(signal);
    }
  }

  // Find extra signals in formatted
  for (const [key, signal] of formattedMap) {
    if (!originalMap.has(key)) {
      extraSignals.push(signal);
    }
  }

  // Calculate match rate
  const totalOriginal = originalSignals.length;
  const signalMatchRate = totalOriginal > 0
    ? (matchingSignals.length / totalOriginal) * 100
    : 0;

  // Determine if signals match (allowing for small tolerance)
  const signalsMatch = missingSignals.length === 0 && extraSignals.length === 0;

  return {
    signalsMatch,
    originalSignalCount: originalSignals.length,
    formattedSignalCount: formattedSignals.length,
    missingSignals,
    extraSignals,
    matchingSignals,
    signalMatchRate
  };
}

/**
 * Generate a unique key for a signal
 * Uses ticker + date as the primary identifier
 */
function signalKey(signal: Signal): string {
  return `${signal.ticker}_${signal.date}`;
}

/**
 * Quick validation: Execute on a small date range first
 * Use this for fast feedback during development
 */
export async function quickValidate(
  originalCode: string,
  formattedCode: string,
  scannerType: string
): Promise<ValidationResult> {
  // Use a small date range for quick validation
  const quickConfig: ExecutionConfig = {
    dateRange: {
      start: '2024-12-01',  // Last month
      end: '2024-12-31'
    },
    tickers: ['AAPL', 'TSLA', 'NVDA'],  // Test with popular tickers
    timeout: 10000  // Short timeout
  };

  console.log(`⚡ Quick validation for ${scannerType}...`);
  return validateByExecution(originalCode, formattedCode, quickConfig);
}

/**
 * Full validation: Execute on complete date range
 * Use this for final validation before deployment
 */
export async function fullValidate(
  originalCode: string,
  formattedCode: string,
  config: ExecutionConfig
): Promise<ValidationResult> {
  console.log('🔬 Full validation...');
  return validateByExecution(originalCode, formattedCode, config);
}

/**
 * Generate a validation report
 */
export function generateValidationReport(result: ValidationResult): string {
  const lines: string[] = [];

  lines.push('════════════════════════════════════════════════════════════');
  lines.push('         SCANNER EXECUTION VALIDATION REPORT');
  lines.push('════════════════════════════════════════════════════════════');
  lines.push('');

  // Overall result
  lines.push(`Overall Result: ${result.isValid ? '✅ VALID' : '❌ INVALID'}`);
  lines.push('');

  // Signal comparison
  lines.push('────────────────────────────────────────────────────────────');
  lines.push('SIGNAL COMPARISON');
  lines.push('────────────────────────────────────────────────────────────');
  lines.push(`Original signals:     ${result.comparison.originalSignalCount}`);
  lines.push(`Formatted signals:    ${result.comparison.formattedSignalCount}`);
  lines.push(`Matching signals:     ${result.comparison.matchingSignals.length}`);
  lines.push(`Missing signals:      ${result.comparison.missingSignals.length}`);
  lines.push(`Extra signals:        ${result.comparison.extraSignals.length}`);
  lines.push(`Signal match rate:    ${result.comparison.signalMatchRate.toFixed(1)}%`);
  lines.push(`Signals match:        ${result.comparison.signalsMatch ? '✅ YES' : '❌ NO'}`);
  lines.push('');

  // Performance comparison
  lines.push('────────────────────────────────────────────────────────────');
  lines.push('PERFORMANCE COMPARISON');
  lines.push('────────────────────────────────────────────────────────────');
  lines.push(`Original execution:   ${result.performanceComparison.originalExecutionTime}ms`);
  lines.push(`Formatted execution:  ${result.performanceComparison.formattedExecutionTime}ms`);
  lines.push(`Time difference:      ${result.performanceComparison.timeDifference > 0 ? '+' : ''}${result.performanceComparison.timeDifference}ms`);
  lines.push(`Time difference:      ${result.performanceComparison.timeDifferencePercent > 0 ? '+' : ''}${result.performanceComparison.timeDifferencePercent.toFixed(1)}%`);
  lines.push('');

  // Errors
  if (result.errors.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('ERRORS');
    lines.push('────────────────────────────────────────────────────────────');
    for (const error of result.errors) {
      lines.push(`❌ ${error}`);
    }
    lines.push('');
  }

  // Warnings
  if (result.warnings.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('WARNINGS');
    lines.push('────────────────────────────────────────────────────────────');
    for (const warning of result.warnings) {
      lines.push(`⚠️  ${warning}`);
    }
    lines.push('');
  }

  // Missing signals details
  if (result.comparison.missingSignals.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('MISSING SIGNALS (in formatted output)');
    lines.push('────────────────────────────────────────────────────────────');
    for (const signal of result.comparison.missingSignals.slice(0, 10)) {
      lines.push(`  ${signal.ticker} @ ${signal.date}`);
    }
    if (result.comparison.missingSignals.length > 10) {
      lines.push(`  ... and ${result.comparison.missingSignals.length - 10} more`);
    }
    lines.push('');
  }

  // Extra signals details
  if (result.comparison.extraSignals.length > 0) {
    lines.push('────────────────────────────────────────────────────────────');
    lines.push('EXTRA SIGNALS (not in original output)');
    lines.push('────────────────────────────────────────────────────────────');
    for (const signal of result.comparison.extraSignals.slice(0, 10)) {
      lines.push(`  ${signal.ticker} @ ${signal.date}`);
    }
    if (result.comparison.extraSignals.length > 10) {
      lines.push(`  ... and ${result.comparison.extraSignals.length - 10} more`);
    }
    lines.push('');
  }

  lines.push('════════════════════════════════════════════════════════════');
  lines.push('');

  return lines.join('\n');
}
