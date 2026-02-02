/**
 * FastAPI Scan Service
 * Connects frontend to our FastAPI backend for real scan execution
 */

const FASTAPI_BASE_URL = 'http://localhost:5666';

export interface ScanRequest {
  start_date: string;
  end_date: string;
  use_real_scan?: boolean;
  filters?: Record<string, any>;
  chunk_size_days?: number; // For auto-chunking optimization
  max_concurrent_chunks?: number; // Limit parallel processing
  scanner_type?: string; // For uploaded scanners
  uploaded_code?: string; // Scanner code content
  function_name?: string; // Target function to execute from uploaded scanner
  // Two-stage scanning parameters
  use_two_stage?: boolean; // Enable two-stage scanning
  d0_start_date?: string; // D0 setup range start for two-stage
  d0_end_date?: string; // D0 setup range end for two-stage
  scanner_name?: string; // Name for uploaded scanner
  timeout_seconds?: number; // Custom timeout for uploaded scanners
}

export interface ScanResult {
  ticker: string;
  date: string;
  gap_pct: number;
  parabolic_score: number;
  lc_frontside_d2_extended: number;
  volume: number;
  close: number;
  confidence_score: number;
}

export interface ScanResponse {
  success: boolean;
  scan_id: string;
  message: string;
  results: ScanResult[];
  execution_time?: number;
  total_found?: number;
}

export interface ScanStatus {
  scan_id: string;
  status: 'initializing' | 'running' | 'completed' | 'error';
  progress_percent: number;
  message: string;
  results?: ScanResult[];
  total_found?: number;
  execution_time?: number;
  error?: string;
  // Two-stage specific fields
  scanner_type?: string; // "two_stage", "uploaded", "lc", "a_plus"
  stage?: string; // Current stage for two-stage scans
  scanner_name?: string; // Name of uploaded scanner
  progress_stage?: string; // "smart_filtering", "scanner_execution"
}

class FastApiScanService {
  private baseUrl: string;

  constructor(baseUrl: string = FASTAPI_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Validate and fix date range to prevent 422 errors from Python backend
   */
  private validateAndFixDateRange(request: ScanRequest): ScanRequest {
    const start = new Date(request.start_date);
    const end = new Date(request.end_date);
    const today = new Date();

    // If end_date is in the future, use today
    const fixedEnd = end > today ? new Date(today) : new Date(end);

    // Ensure start_date is at least 7 days before end_date
    let fixedStart = new Date(start);
    if (fixedStart >= fixedEnd) {
      fixedStart.setTime(fixedEnd.getTime() - (7 * 24 * 60 * 60 * 1000)); // 7 days before end
    }

    // If after fixing start_date it's still the same as end_date, make it 7 days earlier
    if (fixedStart >= fixedEnd) {
      fixedStart.setTime(fixedEnd.getTime() - (7 * 24 * 60 * 60 * 1000));
    }

    return {
      ...request,
      start_date: fixedStart.toISOString().split('T')[0],
      end_date: fixedEnd.toISOString().split('T')[0]
    };
  }

  /**
   * Calculate optimal chunk size based on date range
   */
  private calculateOptimalChunkSize(startDate: string, endDate: string): number {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    // Optimize chunk size based on total range
    if (totalDays <= 30) return totalDays; // Don't chunk small ranges
    if (totalDays <= 90) return 30; // 1 month chunks
    if (totalDays <= 180) return 45; // 1.5 month chunks
    if (totalDays <= 365) return 60; // 2 month chunks
    return 90; // 3 month chunks for very large ranges
  }

  /**
   * Split date range into manageable chunks
   */
  private createDateChunks(startDate: string, endDate: string, chunkSizeDays: number): Array<{start: string, end: string}> {
    const chunks: Array<{start: string, end: string}> = [];
    const start = new Date(startDate);
    const end = new Date(endDate);

    let currentStart = new Date(start);

    while (currentStart < end) {
      const currentEnd = new Date(currentStart);
      currentEnd.setDate(currentEnd.getDate() + chunkSizeDays - 1);

      // Don't exceed the original end date
      if (currentEnd > end) {
        currentEnd.setTime(end.getTime());
      }

      chunks.push({
        start: currentStart.toISOString().split('T')[0],
        end: currentEnd.toISOString().split('T')[0]
      });

      // Move to next chunk
      currentStart = new Date(currentEnd);
      currentStart.setDate(currentStart.getDate() + 1);
    }

    return chunks;
  }

  /**
   * Execute scan with automatic chunking optimization for large date ranges
   */
  async executeOptimizedScan(request: ScanRequest, onProgress?: (progress: any) => void): Promise<ScanResponse> {
    // Validate and fix date range first to prevent 422 errors
    const validatedRequest = this.validateAndFixDateRange(request);

    const start = new Date(validatedRequest.start_date);
    const end = new Date(validatedRequest.end_date);
    const totalDays = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));

    console.log(`📊 Optimized scan: ${totalDays} days from ${validatedRequest.start_date} to ${validatedRequest.end_date}`);

    // Use chunking for ranges larger than 60 days
    if (totalDays > 60) {
      return this.executeChunkedScan(validatedRequest, onProgress);
    } else {
      return this.executeScan(validatedRequest);
    }
  }

  /**
   * Execute scan using chunking for better performance
   */
  async executeChunkedScan(request: ScanRequest, onProgress?: (progress: any) => void): Promise<ScanResponse> {
    const chunkSize = request.chunk_size_days || this.calculateOptimalChunkSize(request.start_date, request.end_date);
    const maxConcurrent = request.max_concurrent_chunks || 3; // Conservative default

    console.log(`  Starting chunked scan: ${request.start_date} to ${request.end_date}`);
    console.log(`📊 Chunk size: ${chunkSize} days, Max concurrent: ${maxConcurrent}`);

    const chunks = this.createDateChunks(request.start_date, request.end_date, chunkSize);
    console.log(`📦 Created ${chunks.length} chunks for processing`);

    const allResults: ScanResult[] = [];
    let completedChunks = 0;
    let totalExecutionTime = 0;

    // Process chunks in batches to avoid overwhelming the backend
    for (let i = 0; i < chunks.length; i += maxConcurrent) {
      const batch = chunks.slice(i, i + maxConcurrent);
      console.log(`🚀 Processing batch ${Math.floor(i / maxConcurrent) + 1}/${Math.ceil(chunks.length / maxConcurrent)} (${batch.length} chunks)`);

      // Execute batch in parallel
      const batchPromises = batch.map(async (chunk, batchIndex) => {
        const chunkRequest: ScanRequest = {
          ...request,
          start_date: chunk.start,
          end_date: chunk.end
        };

        const globalIndex = i + batchIndex;
        console.log(`📊 Chunk ${globalIndex + 1}/${chunks.length}: ${chunk.start} to ${chunk.end}`);

        try {
          const chunkResult = await this.executeScan(chunkRequest);
          completedChunks++;

          // Report progress
          const progressPercent = Math.round((completedChunks / chunks.length) * 100);
          if (onProgress) {
            onProgress({
              type: 'chunk_progress',
              chunk: globalIndex + 1,
              total_chunks: chunks.length,
              progress_percent: progressPercent,
              message: `Completed chunk ${globalIndex + 1}/${chunks.length} (${chunk.start} to ${chunk.end})`,
              results_this_chunk: chunkResult.results?.length || 0
            });
          }

          console.log(`  Chunk ${globalIndex + 1} complete: ${chunkResult.results?.length || 0} results`);
          return chunkResult;
        } catch (error) {
          console.error(`❌ Chunk ${globalIndex + 1} failed:`, error);
          completedChunks++;

          // Report failure but continue with other chunks
          if (onProgress) {
            onProgress({
              type: 'chunk_error',
              chunk: globalIndex + 1,
              total_chunks: chunks.length,
              progress_percent: Math.round((completedChunks / chunks.length) * 100),
              message: `Chunk ${globalIndex + 1} failed: ${error instanceof Error ? error.message : 'Unknown error'}`,
              error: error instanceof Error ? error.message : 'Unknown error'
            });
          }

          return null;
        }
      });

      // Wait for batch to complete
      const batchResults = await Promise.all(batchPromises);

      // Collect successful results
      for (const result of batchResults) {
        if (result && result.success && result.results) {
          allResults.push(...result.results);
          totalExecutionTime += result.execution_time || 0;
        }
      }

      // Small delay between batches to prevent overwhelming backend
      if (i + maxConcurrent < chunks.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    console.log(`  Chunked scan complete! Total results: ${allResults.length}`);

    return {
      success: true,
      scan_id: `chunked_${Date.now()}`,
      message: `Chunked scan completed: ${allResults.length} results from ${chunks.length} chunks`,
      results: allResults,
      total_found: allResults.length,
      execution_time: totalExecutionTime
    };
  }

  /**
   * Execute a scan with optional real-time progress tracking
   */
  async executeScan(request: ScanRequest): Promise<ScanResponse> {
    try {
      console.log('🚀 Executing scan via FastAPI:', request);

      // Fix date validation - ensure start_date is before end_date and not same day
      const validatedRequest = this.validateAndFixDateRange(request);
      console.log('📅 Fixed date range:', {
        original: { start_date: request.start_date, end_date: request.end_date },
        fixed: { start_date: validatedRequest.start_date, end_date: validatedRequest.end_date }
      });

      // Use timeout_seconds from request for uploaded scanners (optimized scanners need more time)
      const timeoutMs = validatedRequest.scanner_type === 'uploaded' && validatedRequest.timeout_seconds
        ? validatedRequest.timeout_seconds * 1000
        : (validatedRequest.scanner_type === 'uploaded' ? 600000 : 30000); // Use provided timeout, default to 10min for uploaded, 30s for others

      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const response = await fetch(`${this.baseUrl}/api/scan/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(validatedRequest),
        signal: controller.signal,
      });

      clearTimeout(timeoutId);

      if (!response.ok) {
        throw new Error(`FastAPI scan failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      console.log('  FastAPI scan response:', data);

      return data;
    } catch (error) {
      console.error('❌ FastAPI scan error:', error);

      // Provide specific error messages for different failure types
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutMinutes = (request.timeout_seconds || (request.scanner_type === 'uploaded' ? 600 : 30)) / 60;
        throw new Error(`Scan request timeout: Complex scanner took longer than ${timeoutMinutes} minutes to initialize. This may indicate the scanner code is very complex or has issues.`);
      }

      throw error;
    }
  }

  /**
   * 🎯 Execute Two-Stage Scan with Smart Temporal Filtering
   *
   * Specialized method for EdgeDev 5665/scan two-stage workflow:
   * Stage 1: Market Universe (17,000+ tickers) + Smart Filtering → ~200-500 qualified tickers
   * Stage 2: Exact Original Scanner Logic on Optimized Universe → Final Results
   */
  async executeTwoStageScan(request: ScanRequest): Promise<ScanResponse> {
    try {
      console.log('🎯 Executing Two-Stage Scan via FastAPI:', {
        scanner_name: request.scanner_name,
        d0_range: `${request.d0_start_date} to ${request.d0_end_date}`,
        code_length: request.uploaded_code?.length || 0
      });

      // Validate required parameters for two-stage scanning
      if (!request.uploaded_code) {
        throw new Error('Two-stage scanning requires uploaded scanner code');
      }

      if (!request.scanner_name) {
        throw new Error('Scanner name is required for two-stage scanning');
      }

      // Set default D0 range if not provided
      const today = new Date().toISOString().split('T')[0];
      const twoStageRequest = {
        ...request,
        scanner_type: 'two_stage' as const,
        use_two_stage: true,
        d0_end_date: request.d0_end_date || today,
        d0_start_date: request.d0_start_date || this.calculateDefaultD0Start(request.d0_end_date || today),
        use_real_scan: true, // Always use real scan for two-stage
        timeout_seconds: request.timeout_seconds || 1800 // 30 minutes default for two-stage
      };

      console.log('📅 Two-Stage D0 Range:', {
        d0_start: twoStageRequest.d0_start_date,
        d0_end: twoStageRequest.d0_end_date
      });

      // Use longer timeout for two-stage scans (market universe + filtering + execution)
      const timeoutMs = twoStageRequest.timeout_seconds * 1000;
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

      const apiUrl = `${this.baseUrl}/api/scan/execute/two-stage`;
      console.log('🔍 DEBUG: About to make fetch request to:', apiUrl);
      console.log('🔍 DEBUG: Request payload:', twoStageRequest);

      const response = await fetch(apiUrl, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(twoStageRequest),
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      console.log('🔍 DEBUG: Fetch response received:', {
        status: response.status,
        statusText: response.statusText,
        ok: response.ok,
        headers: Object.fromEntries(response.headers.entries())
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('🔍 DEBUG: Error response body:', errorText);
        throw new Error(`Two-Stage scan failed: ${response.status} ${response.statusText} - ${errorText}`);
      }

      const data = await response.json();
      console.log('🎯 Two-Stage scan response:', data);

      return data;
    } catch (error) {
      console.error('❌ Two-Stage scan error:', error);

      // Provide specific error messages for two-stage failures
      if (error instanceof Error && error.name === 'AbortError') {
        const timeoutMinutes = (request.timeout_seconds || 1800) / 60;
        throw new Error(`Two-Stage scan timeout: Market universe filtering and scanner execution took longer than ${timeoutMinutes} minutes. This may indicate market data issues or scanner complexity.`);
      }

      throw error;
    }
  }

  /**
   * Calculate default D0 start date (180 days before end date)
   */
  private calculateDefaultD0Start(endDate: string): string {
    const end = new Date(endDate);
    const start = new Date(end);
    start.setDate(start.getDate() - 180); // 180 days = ~6 months
    return start.toISOString().split('T')[0];
  }

  /**
   * Get scan status by ID
   */
  async getScanStatus(scanId: string): Promise<ScanStatus> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scan/status/${scanId}`);

      if (!response.ok) {
        throw new Error(`Failed to get scan status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('❌ Error getting scan status:', error);
      throw error;
    }
  }

  /**
   * Get scan results by ID
   */
  async getScanResults(scanId: string): Promise<ScanResult[]> {
    try {
      const response = await fetch(`${this.baseUrl}/api/scan/results/${scanId}`);

      if (!response.ok) {
        throw new Error(`Failed to get scan results: ${response.status}`);
      }

      const data = await response.json();
      return data.results || [];
    } catch (error) {
      console.error('❌ Error getting scan results:', error);
      throw error;
    }
  }

  /**
   * Check if FastAPI backend is available
   */
  async checkHealth(): Promise<boolean> {
    try {
      const response = await fetch(`${this.baseUrl}/api/health`);
      return response.ok;
    } catch (error) {
      console.error('❌ FastAPI health check failed:', error);
      return false;
    }
  }

  /**
   * Get performance info from backend
   */
  async getPerformanceInfo(): Promise<any> {
    try {
      const response = await fetch(`${this.baseUrl}/api/performance`);
      return await response.json();
    } catch (error) {
      console.error('❌ Error getting performance info:', error);
      return null;
    }
  }

  /**
   * Execute a quick scan for a specific project type and wait for completion
   */
  async executeProjectScan(projectName: string, dateRange: { start: string; end: string }): Promise<ScanResponse> {
    const request: ScanRequest = {
      start_date: dateRange.start,
      end_date: dateRange.end,
      use_real_scan: true,
      filters: this.getFiltersForProject(projectName)
    };

    console.log(`  Starting ${projectName} scan for ${dateRange.start} to ${dateRange.end}`);

    // Start the scan
    const scanResponse = await this.executeScan(request);

    if (!scanResponse.success) {
      throw new Error(`Scan failed: ${scanResponse.message}`);
    }

    console.log(`⏳ Scan started with ID: ${scanResponse.scan_id}. Waiting for completion...`);

    // Wait for scan to complete and get results
    return this.waitForScanCompletion(scanResponse.scan_id);
  }

  /**
   * Wait for scan completion and return results
   */
  async waitForScanCompletion(scanId: string, onProgress?: (progress: number, message: string, status: string) => void): Promise<ScanResponse> {
    const maxWaitTime = 1800000; // 30 minutes max for complex uploaded scanners
    const pollInterval = 2000; // Check every 2 seconds
    const startTime = Date.now();

    while (Date.now() - startTime < maxWaitTime) {
      try {
        const status = await this.getScanStatus(scanId);

        console.log(`📊 Scan ${scanId}: ${status.status} (${status.progress_percent}%) - ${status.message}`);

        // Call progress callback if provided
        if (onProgress) {
          onProgress(status.progress_percent || 0, status.message || 'Processing...', status.status);
        }

        if (status.status === 'completed') {
          console.log(`  Scan completed! Found ${status.total_found || 0} results`);

          return {
            success: true,
            scan_id: scanId,
            message: status.message,
            results: status.results || [],
            total_found: status.total_found || 0,
            execution_time: status.execution_time || 0
          };
        }

        if (status.status === 'error') {
          throw new Error(status.error || 'Scan failed with unknown error');
        }

        // Wait before next poll
        await new Promise(resolve => setTimeout(resolve, pollInterval));

      } catch (error) {
        console.error(`❌ Error checking scan status:`, error);
        throw error;
      }
    }

    throw new Error(`Scan timeout: ${scanId} did not complete within ${maxWaitTime / 1000} seconds`);
  }

  /**
   * Get appropriate filters for different project types
   */
  private getFiltersForProject(projectName: string): Record<string, any> {
    switch (projectName.toLowerCase()) {
      case 'gap up scanner':
        return {
          lc_frontside_d2_extended: true,
          min_gap_atr: 0.5,
          min_volume: 10000000,
          scan_type: 'gap_up'
        };
      case 'breakout strategy':
        return {
          lc_frontside_d3_extended_1: true,
          min_volume: 15000000,
          new_highs: true,
          scan_type: 'breakout'
        };
      case 'volume surge':
        return {
          min_volume: 20000000,
          volume_surge: true,
          scan_type: 'volume'
        };
      default:
        return {
          lc_frontside_d2_extended: true,
          min_volume: 10000000,
          scan_type: 'general'
        };
    }
  }

  /**
   * Create WebSocket connection for real-time progress updates
   */
  createProgressWebSocket(scanId: string, onProgress: (progress: any) => void, onComplete: (results: any) => void): WebSocket {
    const wsUrl = `ws://localhost:5666/api/scan/progress/${scanId}`;
    const ws = new WebSocket(wsUrl);

    ws.onopen = () => {
      console.log('🔌 WebSocket connected for scan:', scanId);
    };

    ws.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);

        if (data.type === 'progress') {
          onProgress(data);
        } else if (data.type === 'final' || data.status === 'completed') {
          onComplete(data);
          ws.close();
        }
      } catch (error) {
        console.error('❌ WebSocket message error:', error);
      }
    };

    ws.onerror = (error) => {
      console.error('❌ WebSocket error:', error);
    };

    ws.onclose = () => {
      console.log('🔌 WebSocket disconnected for scan:', scanId);
    };

    return ws;
  }
}

// Export singleton instance
export const fastApiScanService = new FastApiScanService();
export default fastApiScanService;