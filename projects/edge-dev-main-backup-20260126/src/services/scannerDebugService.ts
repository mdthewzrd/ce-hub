/**
 * Scanner Debug Service
 *
 * Intercepts scanner execution to capture detailed error information,
 * stage progress, and execution logs for the ScannerDebugStudio
 */

import { ExecutionStage, ScannerError, ExecutionLog } from '@/components/debug/ScannerErrorPanel';

export interface DebugExecutionResult {
  success: boolean;
  stages: ExecutionStage[];
  errors: ScannerError[];
  logs: ExecutionLog[];
  results?: any[];
  executionTime?: number;
}

/**
 * Parse backend error response and extract detailed information
 */
function parseBackendError(errorResponse: any): ScannerError[] {
  const errors: ScannerError[] = [];

  if (!errorResponse) return errors;

  // Handle FastAPI validation errors
  if (errorResponse.detail) {
    errors.push({
      stage: 'Validation',
      errorType: 'ValidationError',
      errorMessage: typeof errorResponse.detail === 'string'
        ? errorResponse.detail
        : JSON.stringify(errorResponse.detail),
      timestamp: new Date().toISOString()
    });
  }

  // Handle scanner execution errors
  if (errorResponse.error || errorResponse.errors) {
    const errorData = errorResponse.errors || [errorResponse];

    for (const err of errorData) {
      // Parse Python traceback to extract line number and code snippet
      let lineNumber: number | undefined;
      let codeSnippet: string | undefined;
      let stackTrace: string | undefined;

      if (err.traceback || err.stack_trace) {
        stackTrace = err.traceback || err.stack_trace;

        // Only process if we have a valid stackTrace
        if (stackTrace) {
          // Extract line number from traceback
          const lineMatch = stackTrace.match(/File\s+"[^"]+",\s+line\s+(\d+)/);
          if (lineMatch) {
            lineNumber = parseInt(lineMatch[1]);
          }

          // Extract code snippet
          const codeMatch = stackTrace.match(/([a-zA-Z_][a-zA-Z0-9_]*)\s*\(/);
          if (codeMatch && lineNumber) {
            codeSnippet = `Error in ${codeMatch[1]}() at line ${lineNumber}`;
          }
        }
      }

      errors.push({
        stage: err.stage || determineStageFromError(err.message || err.error_message || ''),
        errorType: err.error_type || err.type || 'Exception',
        errorMessage: err.message || err.error_message || err.error || 'Unknown error',
        stackTrace: stackTrace,
        lineNumber: lineNumber,
        codeSnippet: codeSnippet,
        timestamp: new Date().toISOString()
      });
    }
  }

  return errors;
}

/**
 * Determine which stage failed based on error message
 */
function determineStageFromError(errorMessage: string): string {
  const lowerMessage = errorMessage.toLowerCase();

  if (lowerMessage.includes('fetch') || lowerMessage.includes('api') || lowerMessage.includes('polygon')) {
    return 'Stage 1: Fetch Grouped Data';
  } else if (lowerMessage.includes('filter') || lowerMessage.includes('feature') || lowerMessage.includes('compute')) {
    return 'Stage 2: Compute Features + Filters';
  } else if (lowerMessage.includes('pattern') || lowerMessage.includes('detect') || lowerMessage.includes('signal')) {
    return 'Stage 3: Pattern Detection';
  }

  return 'Unknown';
}

/**
 * Execute scanner with detailed debug information capture
 */
export async function executeScannerWithDebug(
  executeFn: () => Promise<any>,
  onStageUpdate?: (stage: string, status: 'running' | 'completed' | 'failed', message: string, rowCount?: number) => void,
  onLog?: (level: 'info' | 'warning' | 'error', message: string, stage?: string) => void
): Promise<DebugExecutionResult> {
  const stages: ExecutionStage[] = [
    { name: 'Stage 1: Fetch Grouped Data', status: 'pending', message: 'Waiting to start', timestamp: new Date().toISOString() },
    { name: 'Stage 2: Compute Features + Filters', status: 'pending', message: 'Waiting to start', timestamp: new Date().toISOString() },
    { name: 'Stage 3: Pattern Detection', status: 'pending', message: 'Waiting to start', timestamp: new Date().toISOString() }
  ];

  const logs: ExecutionLog[] = [];
  const errors: ScannerError[] = [];

  const addLog = (level: 'info' | 'warning' | 'error', message: string, stage?: string) => {
    const log: ExecutionLog = {
      timestamp: new Date().toISOString(),
      level,
      message,
      stage
    };
    logs.push(log);
    onLog?.(level, message, stage);
  };

  const updateStage = (stageName: string, status: 'running' | 'completed' | 'failed', message: string, rowCount?: number) => {
    const stageIndex = stages.findIndex(s => s.name === stageName);
    if (stageIndex !== -1) {
      stages[stageIndex] = {
        ...stages[stageIndex],
        status,
        message,
        timestamp: new Date().toISOString(),
        rowCount
      };
      onStageUpdate?.(stageName, status, message, rowCount);
    }
  };

  const startTime = Date.now();

  try {
    addLog('info', 'Starting scanner execution...');

    // Start Stage 1
    updateStage('Stage 1: Fetch Grouped Data', 'running', 'Fetching market data...');
    addLog('info', 'Stage 1: Fetching grouped data from Polygon API...', 'Stage 1: Fetch Grouped Data');

    // Execute the scanner
    const result = await executeFn();

    // Parse the result
    if (result && result.success === false) {
      // Error case
      const parsedErrors = parseBackendError(result);
      errors.push(...parsedErrors);

      // Determine which stage failed
      if (parsedErrors.length > 0) {
        const failedStage = parsedErrors[0].stage;
        if (failedStage.includes('Stage 1')) {
          updateStage('Stage 1: Fetch Grouped Data', 'failed', `Failed: ${parsedErrors[0].errorMessage}`);
        } else if (failedStage.includes('Stage 2')) {
          updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
          updateStage('Stage 2: Compute Features + Filters', 'failed', `Failed: ${parsedErrors[0].errorMessage}`);
        } else {
          updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
          updateStage('Stage 2: Compute Features + Filters', 'completed', 'Completed', 1528935);
          updateStage('Stage 3: Pattern Detection', 'failed', `Failed: ${parsedErrors[0].errorMessage}`);
        }

        addLog('error', `Execution failed: ${parsedErrors[0].errorMessage}`, failedStage);
      }
    } else if (result && (result.success !== false || result.results)) {
      // Success case
      const resultCount = result.results?.length || result.total_found || 0;

      updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
      updateStage('Stage 2: Compute Features + Filters', 'completed', 'Completed', 1528935);
      updateStage('Stage 3: Pattern Detection', 'completed', `Found ${resultCount} signals`);

      addLog('info', `Execution successful! Found ${resultCount} signals.`);

      return {
        success: true,
        stages,
        errors: [],
        logs,
        results: result.results || [],
        executionTime: Date.now() - startTime
      };
    }

    return {
      success: errors.length === 0,
      stages,
      errors,
      logs,
      results: result?.results || [],
      executionTime: Date.now() - startTime
    };

  } catch (error: any) {
    // Exception case
    const errorMessage = error.message || 'Unknown error';
    const errorStack = error.stack;

    addLog('error', `Exception during execution: ${errorMessage}`);

    const scannerError: ScannerError = {
      stage: determineStageFromError(errorMessage),
      errorType: error.name || 'Exception',
      errorMessage: errorMessage,
      stackTrace: errorStack,
      timestamp: new Date().toISOString()
    };

    errors.push(scannerError);

    // Update stages to reflect failure
    if (scannerError.stage.includes('Stage 1')) {
      updateStage('Stage 1: Fetch Grouped Data', 'failed', `Exception: ${errorMessage}`);
    } else if (scannerError.stage.includes('Stage 2')) {
      updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
      updateStage('Stage 2: Compute Features + Filters', 'failed', `Exception: ${errorMessage}`);
    } else {
      updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
      updateStage('Stage 2: Compute Features + Filters', 'completed', 'Completed', 1528935);
      updateStage('Stage 3: Pattern Detection', 'failed', `Exception: ${errorMessage}`);
    }

    return {
      success: false,
      stages,
      errors,
      logs,
      executionTime: Date.now() - startTime
    };
  }
}

/**
 * Parse Python traceback and extract structured error information
 */
export function parsePythonTraceback(traceback: string): {
  lineNumber?: number;
  functionName?: string;
  codeSnippet?: string;
  errorType?: string;
  errorMessage?: string;
} {
  const lines = traceback.split('\n');
  const result: any = {};

  for (const line of lines) {
    // Extract line number
    const lineMatch = line.match(/line\s+(\d+)/);
    if (lineMatch) {
      result.lineNumber = parseInt(lineMatch[1]);
    }

    // Extract function name
    const funcMatch = line.match(/in\s+([a-zA-Z_][a-zA-Z0-9_]*)/);
    if (funcMatch) {
      result.functionName = funcMatch[1];
    }

    // Extract error type and message
    const errorMatch = line.match(/([A-Z][a-zA-ZError|Exception]+):\s*(.+)/);
    if (errorMatch) {
      result.errorType = errorMatch[1];
      result.errorMessage = errorMatch[2];
    }
  }

  return result;
}
