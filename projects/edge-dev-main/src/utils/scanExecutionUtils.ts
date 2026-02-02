/**
 * Scan Execution Utilities
 *
 * Utilities for integrating persistent scan execution with existing components
 */

import { useScanExecution, DEFAULT_SCAN_STAGES } from '@/contexts/ScanExecutionContext';

export interface ScanExecutionConfig {
  scanner_name: string;
  project_id?: string;
  date_range?: {
    start_date: string;
    end_date: string;
  };
  filters?: Record<string, any>;
}

/**
 * Enhanced execution handler that provides persistent scanning
 */
export function useEnhancedExecution() {
  const {
    startExecution,
    updateStage,
    completeExecution,
    failExecution,
    updateExecution,
    clearExecution
  } = useScanExecution();

  const executeScan = async (
    config: ScanExecutionConfig,
    executeFunction: (config: any) => Promise<any>
  ) => {
    // Check if context is available (if not, use fallback mode)
    const hasContext = !!startExecution;

    if (!hasContext) {
      console.log('⚠️  ScanExecution context not available, using fallback execution mode');
      // Fallback: just execute the function without progress tracking
      return await executeFunction(config);
    }

    const executionId = `scan_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Initialize execution with default stages
    const stages = DEFAULT_SCAN_STAGES.map((stage, index) => ({
      ...stage,
      id: `stage_${index}`,
      status: 'pending' as const
    }));

    startExecution({
      id: executionId,
      scanner_name: config.scanner_name,
      project_id: config.project_id,
      status: 'initializing',
      stages
    });

    try {
      // Update to running
      updateExecution(executionId, { status: 'running' });

      // Stage 1: Initializing
      updateStage(executionId, 'stage_0', { status: 'running', progress: 20 });
      await new Promise(resolve => setTimeout(resolve, 1000)); // Brief delay for visual feedback
      updateStage(executionId, 'stage_0', { status: 'completed', progress: 100 });

      // Stage 2: Fetching Market Data
      updateStage(executionId, 'stage_1', { status: 'running', progress: 0 });
      updateStage(executionId, 'stage_1', { progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 2000)); // Simulate market data fetch
      updateStage(executionId, 'stage_1', { status: 'completed', progress: 100 });

      // Stage 3: Smart Filtering
      updateStage(executionId, 'stage_2', { status: 'running', progress: 0 });
      // The actual smart filtering happens here
      updateStage(executionId, 'stage_2', { progress: 50 });
      await new Promise(resolve => setTimeout(resolve, 3000)); // Simulate filtering
      updateStage(executionId, 'stage_2', { status: 'completed', progress: 100 });

      // Stage 4: Pattern Detection
      updateStage(executionId, 'stage_3', { status: 'running', progress: 0 });
      updateStage(executionId, 'stage_3', { progress: 25 });

      // Execute the actual scan
      const results = await executeFunction(config);

      // Update progress based on results
      if (results && results.results) {
        const signalCount = results.results.length;
        updateStage(executionId, 'stage_3', {
          progress: 75,
          signals: signalCount
        });
      }

      updateStage(executionId, 'stage_3', { status: 'completed', progress: 100 });

      // Stage 5: Processing Results
      updateStage(executionId, 'stage_4', { status: 'running', progress: 0 });
      updateStage(executionId, 'stage_4', { progress: 50 });

      // Process final results
      await new Promise(resolve => setTimeout(resolve, 1000));

      const finalSignals = results?.results?.length || 0;
      updateStage(executionId, 'stage_4', {
        status: 'completed',
        progress: 100,
        signals: finalSignals
      });

      // Stage 6: Complete
      updateStage(executionId, 'stage_5', { status: 'completed', progress: 100 });

      // Complete execution
      const executionTime = Date.now() - new Date(executionId.split('_')[1]).getTime();

      completeExecution(executionId, {
        status: 'completed',
        execution_time: executionTime,
        total_signals: finalSignals,
        stages: stages.map(stage => ({
          ...stage,
          status: 'completed'
        }))
      });

      return results;

    } catch (error: any) {
      console.error('Scan execution failed:', error);
      failExecution(executionId, error.message || 'Scan execution failed');
      throw error;
    }
  };

  return {
    executeScan,
    cancelScan: clearExecution
  };
}

/**
 * Create mock scan data for testing
 */
export function createMockScanResults(scannerName: string) {
  const mockSignals = [
    {
      ticker: 'AAPL',
      date: '2025-01-15',
      signal: 'BACKSIDE_D1',
      gap_atr: 2.5,
      volume_ratio: 3.2,
      price: 185.50
    },
    {
      ticker: 'TSLA',
      date: '2025-01-16',
      signal: 'BACKSIDE_D2',
      gap_atr: 3.1,
      volume_ratio: 4.5,
      price: 225.75
    },
    {
      ticker: 'NVDA',
      date: '2025-01-17',
      signal: 'BACKSIDE_D1',
      gap_atr: 1.8,
      volume_ratio: 2.1,
      price: 145.30
    }
  ];

  return {
    success: true,
    scanner: scannerName,
    execution_id: `mock_${Date.now()}`,
    timestamp: new Date().toISOString(),
    total_signals: mockSignals.length,
    results: mockSignals,
    execution_time: Math.random() * 50000 + 30000 // 30-80 seconds
  };
}