/**
 * Edge Dev Unified API Client
 * Production-ready API client for Edge Dev platform
 * Consolidates all backend communication with proper error handling, retries, and progress tracking
 */

import { ScanRequest, ScanResponse, ScanStatus, ScanResult } from './fastApiScanService';

// ============= Configuration =============

const EDGE_DEV_CONFIG = {
  backendUrl: 'http://localhost:5666',
  timeout: 60000, // 60 seconds default
  retries: 3,
  retryDelay: 1000, // 1 second
} as const;

// ============= Types =============

export interface ExecutionConfig {
  date: string; // Scan date (YYYY-MM-DD)
  maxResults?: number;
  timeout?: number;
}

export interface ExecutionResult {
  executionId: string;
  status: 'queued' | 'running' | 'complete' | 'failed';
  estimatedTime?: number;
}

export interface ExecutionStatus {
  id: string;
  state: 'queued' | 'running' | 'complete' | 'failed';
  progress: number; // 0-100
  currentStage?: string;
  results?: ScanResult[];
  error?: string;
  totalFound?: number;
  executionTime?: number;
}

export interface CodeAnalysis {
  structure: {
    type: 'function' | 'class' | 'module';
    name?: string;
    functions: string[];
    imports: string[];
  };
  quality: {
    score: number; // 0-100
    issues: string[];
  };
  v31Compliance: boolean;
  requiredChanges: string[];
  conversionPath: 'direct' | 'refactor' | 'rewrite';
}

export interface v31Scanner {
  name: string;
  description: string;
  fetch_grouped_data: string;
  apply_smart_filters: string;
  detect_patterns: string;
  format_results: string;
  run_scan: string;
  parameters?: Record<string, any>;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  compliance: number; // 0-100
}

// ============= API Client Class =============

export class EdgeDevAPI {
  private backendUrl: string;
  private timeout: number;

  constructor(config: Partial<typeof EDGE_DEV_CONFIG> = {}) {
    this.backendUrl = config.backendUrl || EDGE_DEV_CONFIG.backendUrl;
    this.timeout = config.timeout || EDGE_DEV_CONFIG.timeout;
  }

  // ============= Health Check =============

  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.backendUrl}/api/health`, {
        signal: AbortSignal.timeout(5000), // 5 second timeout for health check
      });

      if (!response.ok) {
        console.error('Backend health check failed:', response.status);
        return false;
      }

      const data = await response.json();
      console.log('✅ Backend health check:', data);
      return data.status === 'healthy';
    } catch (error) {
      console.error('Backend health check error:', error);
      return false;
    }
  }

  // ============= Scanner Execution =============

  async executeScanner(
    scanner: v31Scanner,
    config: ExecutionConfig
  ): Promise<ExecutionResult> {
    // Validate backend is healthy first
    const healthy = await this.checkHealth();
    if (!healthy) {
      throw new Error('Backend is not available. Please ensure the Edge Dev backend is running.');
    }

    // Validate scanner structure
    const validation = await this.validateV31Scanner(scanner);
    if (!validation.isValid) {
      throw new Error(`Invalid scanner: ${validation.errors.join(', ')}`);
    }

    // Calculate date range (7 days leading up to scan date)
    const endDate = config.date;
    const startDate = new Date(new Date(config.date).getTime() - 7 * 24 * 60 * 60 * 1000)
      .toISOString()
      .split('T')[0];

    // Prepare scan request
    const scanRequest: ScanRequest = {
      start_date: startDate,
      end_date: endDate,
      scanner_type: 'uploaded',
      uploaded_code: this.serializeScanner(scanner),
      use_real_scan: true,
      filters: {
        scan_type: 'v31_scanner',
        scanner_name: scanner.name,
      },
      timeout_seconds: config.timeout || this.timeout / 1000,
    };

    try {
      // Execute scan
      const response = await this.retryFetch(
        `${this.backendUrl}/api/scan/execute`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(scanRequest),
          signal: AbortSignal.timeout(config.timeout || this.timeout),
        }
      );

      if (!response.ok) {
        const error = await response.text();
        throw new Error(`Scanner execution failed: ${response.status} ${error}`);
      }

      const result: ScanResponse = await response.json();

      return {
        executionId: result.scan_id,
        status: result.success ? 'queued' : 'failed',
        estimatedTime: result.execution_time,
      };
    } catch (error) {
      console.error('Scanner execution error:', error);
      throw error;
    }
  }

  async getExecutionStatus(executionId: string): Promise<ExecutionStatus> {
    try {
      const response = await fetch(
        `${this.backendUrl}/api/scan/status/${executionId}`,
        {
          signal: AbortSignal.timeout(5000),
        }
      );

      if (!response.ok) {
        throw new Error(`Status check failed: ${response.status}`);
      }

      const data: ScanStatus = await response.json();

      // Map backend status to ExecutionState type
      const statusMap: Record<string, 'queued' | 'running' | 'complete' | 'failed'> = {
        'error': 'failed',
        'completed': 'complete',
        'initializing': 'queued',
        'running': 'running'
      };

      return {
        id: data.scan_id,
        state: statusMap[data.status] || 'running',
        progress: data.progress_percent,
        currentStage: data.stage || data.progress_stage,
        results: data.results,
        error: data.error,
        totalFound: data.total_found,
        executionTime: data.execution_time,
      };
    } catch (error) {
      console.error('Execution status error:', error);
      throw error;
    }
  }

  async waitForCompletion(
    executionId: string,
    onProgress?: (progress: number, message: string, status: string) => void
  ): Promise<ExecutionStatus> {
    return new Promise((resolve, reject) => {
      const pollInterval = 1000; // Poll every second
      let lastProgress = 0;

      const poll = async () => {
        try {
          const status = await this.getExecutionStatus(executionId);

          // Call progress callback if progress has changed
          if (onProgress && status.progress !== lastProgress) {
            lastProgress = status.progress;
            onProgress(
              status.progress,
              status.currentStage || 'Processing...',
              status.state
            );
          }

          // Check if complete
          if (status.state === 'complete') {
            resolve(status);
          } else if (status.state === 'failed') {
            reject(new Error(status.error || 'Execution failed'));
          } else {
            // Continue polling
            setTimeout(poll, pollInterval);
          }
        } catch (error) {
          reject(error);
        }
      };

      // Start polling
      poll();
    });
  }

  // ============= Code Analysis =============

  async analyzeCode(code: string): Promise<CodeAnalysis> {
    try {
      const response = await this.retryFetch(
        `${this.backendUrl}/api/analyze/code`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code, language: 'python' }),
          signal: AbortSignal.timeout(30000), // 30 second timeout
        }
      );

      if (!response.ok) {
        throw new Error(`Code analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Code analysis error:', error);
      throw error;
    }
  }

  async convertToV31(code: string, format: string = 'auto'): Promise<v31Scanner> {
    try {
      const response = await this.retryFetch(
        `${this.backendUrl}/api/convert/scanner`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            code,
            source_format: format,
            target_format: 'v31',
          }),
          signal: AbortSignal.timeout(60000), // 60 second timeout for conversion
        }
      );

      if (!response.ok) {
        throw new Error(`Code conversion failed: ${response.status}`);
      }

      const result = await response.json();

      if (!result.validation.isValid) {
        throw new Error(
          `Conversion validation failed: ${result.validation.errors.join(', ')}`
        );
      }

      return result.converted_code;
    } catch (error) {
      console.error('Code conversion error:', error);
      throw error;
    }
  }

  async validateV31Scanner(scanner: v31Scanner): Promise<ValidationResult> {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check required methods
    const requiredMethods = [
      'fetch_grouped_data',
      'apply_smart_filters',
      'detect_patterns',
      'format_results',
      'run_scan',
    ];

    for (const method of requiredMethods) {
      if (!(scanner as any)[method]) {
        errors.push(`Missing required method: ${method}`);
      }
    }

    // Check name
    if (!scanner.name) {
      errors.push('Scanner name is required');
    }

    // Check parameters exist
    if (!scanner.parameters) {
      warnings.push('No parameters defined');
    }

    const isValid = errors.length === 0;
    const compliance = isValid ? 100 - warnings.length * 10 : 0;

    return {
      isValid,
      errors,
      warnings,
      compliance: Math.max(0, compliance),
    };
  }

  // ============= Results Analysis =============

  async analyzeResults(results: ScanResult[], scanner: v31Scanner): Promise<{
    summary: string;
    metrics: Record<string, any>;
    insights: string[];
    optimizations: string[];
  }> {
    try {
      const response = await this.retryFetch(
        `${this.backendUrl}/api/analyze/results`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ results, scanner }),
          signal: AbortSignal.timeout(30000),
        }
      );

      if (!response.ok) {
        throw new Error(`Results analysis failed: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('Results analysis error:', error);
      throw error;
    }
  }

  // ============= Helper Methods =============

  private serializeScanner(scanner: v31Scanner): string {
    // Convert scanner object to executable Python code
    const code = `
# Edge Dev v31 Scanner: ${scanner.name}
# ${scanner.description || 'No description'}

${scanner.fetch_grouped_data}

${scanner.apply_smart_filters}

${scanner.detect_patterns}

${scanner.format_results}

${scanner.run_scan}

# Parameters
if __name__ == "__main__":
    results = run_scan()
    print(results)
    `.trim();

    return code;
  }

  private async retryFetch(
    url: string,
    options: RequestInit,
    retries: number = EDGE_DEV_CONFIG.retries
  ): Promise<Response> {
    for (let i = 0; i < retries; i++) {
      try {
        const response = await fetch(url, options);
        if (response.ok || response.status < 500) {
          return response;
        }
      } catch (error) {
        if (i === retries - 1) throw error;
        // Wait before retrying
        await new Promise(resolve =>
          setTimeout(resolve, EDGE_DEV_CONFIG.retryDelay * (i + 1))
        );
      }
    }
    throw new Error('Max retries exceeded');
  }
}

// ============= Singleton Instance =============

export const edgeDevAPI = new EdgeDevAPI();

// ============= Convenience Functions =============

export async function executeScanner(
  scanner: v31Scanner,
  config: ExecutionConfig
): Promise<ExecutionResult> {
  return edgeDevAPI.executeScanner(scanner, config);
}

export async function analyzeCode(code: string): Promise<CodeAnalysis> {
  return edgeDevAPI.analyzeCode(code);
}

export async function convertToV31(code: string, format?: string): Promise<v31Scanner> {
  return edgeDevAPI.convertToV31(code, format);
}

export async function waitForCompletion(
  executionId: string,
  onProgress?: (progress: number, message: string, status: string) => void
): Promise<ExecutionStatus> {
  return edgeDevAPI.waitForCompletion(executionId, onProgress);
}
