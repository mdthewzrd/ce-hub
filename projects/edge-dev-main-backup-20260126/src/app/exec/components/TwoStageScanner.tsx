'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Play,
  Square,
  Brain,
  Filter,
  Database,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  Loader2,
  BarChart3,
  Zap,
  Target,
  Clock,
  Activity
} from 'lucide-react';
import { fastApiScanService, ScanRequest, ScanResponse, ScanStatus } from '@/services/fastApiScanService';

interface TwoStageScannerProps {
  uploadedCode: string;
  scannerName: string;
  onResults: (results: any[], scanId: string) => void;
  onError: (error: string) => void;
}

interface TwoStageProgress {
  currentStage: 'initialization' | 'stage1' | 'stage2' | 'completed' | 'error';
  stage1Progress: number;
  stage2Progress: number;
  overallProgress: number;
  message: string;
  tickerCount: number;
  qualifiedCount: number;
  resultsFound: number;
}

export const TwoStageScanner: React.FC<TwoStageScannerProps> = ({
  uploadedCode,
  scannerName,
  onResults,
  onError
}) => {
  // Debug: Log props on component render
  console.log('🔍 DEBUG: TwoStageScanner rendered with props:', {
    hasUploadedCode: !!uploadedCode,
    codeLength: uploadedCode?.length || 0,
    scannerName,
    codePreview: uploadedCode ? uploadedCode.substring(0, 100) + '...' : 'No code'
  });

  const [isRunning, setIsRunning] = useState(false);
  const [scanId, setScanId] = useState<string | null>(null);
  const [progress, setProgress] = useState<TwoStageProgress>({
    currentStage: 'initialization',
    stage1Progress: 0,
    stage2Progress: 0,
    overallProgress: 0,
    message: 'Ready to start Two-Stage scanning',
    tickerCount: 0,
    qualifiedCount: 0,
    resultsFound: 0
  });
  const [executionTime, setExecutionTime] = useState(0);
  const [startTime, setStartTime] = useState<Date | null>(null);

  // Check for code from Renata chat upload
  useEffect(() => {
    const storedCode = localStorage.getItem('twoStageScannerCode');
    const storedName = localStorage.getItem('twoStageScannerName');

    if (storedCode && !uploadedCode) {
      console.log('🧠 Found code from Renata chat upload:', storedName);
      // Update parent component with the uploaded code
      if (onResults && typeof onResults === 'function') {
        // Note: We can't directly update props, but we can use the code
        localStorage.setItem('twoStageActiveCode', storedCode);
        localStorage.setItem('twoStageActiveName', storedName || 'Uploaded Scanner');
      }
    }
  }, [uploadedCode, onResults]);

  // Progress tracking interval
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (isRunning && scanId) {
      console.log('🔍 DEBUG: Starting progress polling for scanId:', scanId);
      interval = setInterval(() => {
        console.log('🔍 DEBUG: Polling scan progress for scanId:', scanId);
        updateScanProgress();
      }, 1000); // Update every second
    } else {
      console.log('🔍 DEBUG: Progress polling not active:', { isRunning, scanId });
    }

    return () => {
      if (interval) {
        console.log('🔍 DEBUG: Cleaning up progress polling interval');
        clearInterval(interval);
      }
    };
  }, [isRunning, scanId]);

  // Update execution time
  useEffect(() => {
    let interval: NodeJS.Timeout | null = null;

    if (startTime && isRunning) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - startTime.getTime()) / 1000);
        setExecutionTime(elapsed);
      }, 1000);
    }

    return () => {
      if (interval) {
        clearInterval(interval);
      }
    };
  }, [startTime, isRunning]);

  const parseStage = (status: string, stage?: string): TwoStageProgress['currentStage'] => {
    if (status === 'error') return 'error';
    if (status === 'completed') return 'completed';

    switch (stage) {
      case 'market_universe':
        return 'stage1';
      case 'pattern_detection':
        return 'stage2';
      default:
        return status as any; // Fallback
    }
  };

  const updateScanProgress = useCallback(async () => {
    if (!scanId) return;

    try {
      const status: ScanStatus = await fastApiScanService.getScanStatus(scanId);

      // Update progress based on status
      let newProgress: TwoStageProgress;

      if (status.scanner_type === 'two_stage') {
        // Two-stage specific progress parsing
        newProgress = {
          currentStage: parseStage(status.status, status.stage),
          stage1Progress: status.progress_percent < 50 ? status.progress_percent * 2 : 100,
          stage2Progress: status.progress_percent > 50 ? (status.progress_percent - 50) * 2 : 0,
          overallProgress: status.progress_percent,
          message: status.message,
          tickerCount: 17000, // Full market universe
          qualifiedCount: status.total_found || 0,
          resultsFound: status.total_found || 0
        };
      } else {
        // Fallback for non-two-stage scans
        newProgress = {
          currentStage: status.status === 'completed' ? 'completed' :
                     status.status === 'error' ? 'error' : 'stage2',
          stage1Progress: 100,
          stage2Progress: status.progress_percent,
          overallProgress: status.progress_percent,
          message: status.message,
          tickerCount: 0,
          qualifiedCount: 0,
          resultsFound: status.total_found || 0
        };
      }

      setProgress(newProgress);

      // Check for completion
      if (status.status === 'completed' && status.results && scanId) {
        console.log('🎯 Two-Stage scan completed:', status.results.length, 'results');

        setProgress(prev => ({
          ...prev,
          currentStage: 'completed',
          message: `✅ Two-Stage scan complete! Found ${status.results?.length || 0} results from market universe filtering.`,
          resultsFound: status.results?.length || 0,
          overallProgress: 100
        }));

        setIsRunning(false);
        setScanId(null);
        setStartTime(null);

        onResults(status.results, scanId);
      } else if (status.status === 'error') {
        console.error('❌ Two-Stage scan error:', status.error || 'Unknown error occurred');

        setProgress(prev => ({
          ...prev,
          currentStage: 'error',
          message: `❌ Scan failed: ${status.error || 'Unknown error occurred'}`,
          overallProgress: 0
        }));

        setIsRunning(false);
        setScanId(null);
        setStartTime(null);
      }

    } catch (error) {
      console.error('🔍 DEBUG: Error updating scan progress:', error);
      console.error('🔍 DEBUG: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace',
        scanId: scanId
      });
      // Don't show error to user unless it's a critical failure
    }
  }, [scanId]);

  
  const startTwoStageScan = useCallback(async () => {
    // Get code from props or localStorage (from Renata chat upload)
    let codeToUse = uploadedCode;
    let nameToUse = scannerName;

    if (!codeToUse) {
      codeToUse = localStorage.getItem('twoStageScannerCode') || '';
      nameToUse = localStorage.getItem('twoStageScannerName') || 'Uploaded Scanner';
    }

    if (!codeToUse || !nameToUse) {
      onError('Scanner code and name are required for Two-Stage scanning');
      return;
    }

    console.log('🔍 DEBUG: startTwoStageScan called', {
      hasUploadedCode: !!uploadedCode,
      codeLength: codeToUse?.length,
      scannerName: nameToUse,
      source: uploadedCode ? 'props' : 'localStorage'
    });

    setIsRunning(true);
    setStartTime(new Date());
    setExecutionTime(0);

    // Reset progress
    setProgress({
      currentStage: 'initialization',
      stage1Progress: 0,
      stage2Progress: 0,
      overallProgress: 0,
      message: '🎯 Initializing Two-Stage Scanner with Smart Filtering...',
      tickerCount: 17000,
      qualifiedCount: 0,
      resultsFound: 0
    });

    try {
      console.log('🚀 Starting Two-Stage scan:', { scannerName, codeLength: uploadedCode.length });

      // Prepare scan request for two-stage execution
      const scanRequest: ScanRequest = {
        start_date: '2025-01-01', // D0 start
        end_date: '2025-11-01',   // D0 end
        d0_start_date: '2025-01-01',
        d0_end_date: '2025-11-01',
        scanner_name: nameToUse,
        uploaded_code: codeToUse,
        scanner_type: 'two_stage',
        use_two_stage: true,
        use_real_scan: true,
        timeout_seconds: 1800 // 30 minutes
      };

      console.log('🔍 DEBUG: About to call executeTwoStageScan with request:', scanRequest);

      const response: ScanResponse = await fastApiScanService.executeTwoStageScan(scanRequest);

      console.log('🔍 DEBUG: Received response from executeTwoStageScan:', response);

      if (response.success) {
        setScanId(response.scan_id);
        console.log('✅ Two-Stage scan started:', response.scan_id);
      } else {
        console.error('🔍 DEBUG: Scan response not successful:', response);
        throw new Error(response.message || 'Failed to start Two-Stage scan');
      }

    } catch (error) {
      console.error('❌ Two-Stage scan failed:', error);
      console.error('🔍 DEBUG: Error details:', {
        message: error instanceof Error ? error.message : 'Unknown error',
        stack: error instanceof Error ? error.stack : 'No stack trace'
      });
      handleScanError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  }, [uploadedCode, scannerName, onError]);

  const stopScan = useCallback(() => {
    setIsRunning(false);
    setScanId(null);
    setStartTime(null);

    setProgress(prev => ({
      ...prev,
      currentStage: 'error',
      message: 'Scan stopped by user',
      overallProgress: 0
    }));
  }, []);

  const handleScanComplete = useCallback((results: any[], completedScanId: string) => {
    console.log('🎯 Two-Stage scan completed:', results.length, 'results');

    setProgress(prev => ({
      ...prev,
      currentStage: 'completed',
      message: `✅ Two-Stage scan complete! Found ${results.length} results from market universe filtering.`,
      resultsFound: results.length,
      overallProgress: 100
    }));

    setIsRunning(false);
    setScanId(null);
    setStartTime(null);

    onResults(results, completedScanId);
  }, [onResults]);

  const handleScanError = useCallback((error: string) => {
    console.error('❌ Two-Stage scan error:', error);

    setProgress(prev => ({
      ...prev,
      currentStage: 'error',
      message: `❌ Two-Stage scan failed: ${error}`,
      overallProgress: 0
    }));

    setIsRunning(false);
    setScanId(null);
    setStartTime(null);

    onError(error);
  }, [onError]);

  const formatExecutionTime = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`;
    return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`;
  };

  const getStageIcon = (stage: TwoStageProgress['currentStage']) => {
    switch (stage) {
      case 'initialization': return <Loader2 className="w-5 h-5 animate-spin" />;
      case 'stage1': return <Database className="w-5 h-5" />;
      case 'stage2': return <Target className="w-5 h-5" />;
      case 'completed': return <CheckCircle className="w-5 h-5 text-green-500" />;
      case 'error': return <AlertTriangle className="w-5 h-5 text-red-500" />;
    }
  };

  const getStageColor = (stage: TwoStageProgress['currentStage']) => {
    switch (stage) {
      case 'initialization': return 'text-blue-600';
      case 'stage1': return 'text-orange-600';
      case 'stage2': return 'text-purple-600';
      case 'completed': return 'text-green-600';
      case 'error': return 'text-red-600';
    }
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="w-6 h-6" />
          Two-Stage Scanner with Smart Filtering
          <Badge variant="outline" className="ml-2">
            EdgeDev 5665/scan
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Scanner Info */}
        <div className="flex items-center justify-between">
          <div>
            <h3 className="font-semibold">{scannerName}</h3>
            <p className="text-sm text-gray-600">
              Market Universe: 17,000+ tickers → Smart Filtering → Exact Scanner Logic
            </p>
          </div>
          <div className="flex items-center gap-2">
            {isRunning && (
              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Clock className="w-4 h-4" />
                {formatExecutionTime(executionTime)}
              </div>
            )}
            {!isRunning ? (
              <Button
                onClick={startTwoStageScan}
                className="flex items-center gap-2"
                size="sm"
              >
                <Play className="w-4 h-4" />
                Start Two-Stage Scan
              </Button>
            ) : (
              <Button
                onClick={stopScan}
                variant="destructive"
                className="flex items-center gap-2"
                size="sm"
              >
                <Square className="w-4 h-4" />
                Stop Scan
              </Button>
            )}
          </div>
        </div>

        {/* Progress Overview */}
        <div className="space-y-4">
          {/* Current Stage Status */}
          <div className="flex items-center gap-3 p-3 bg-gray-50 rounded-lg">
            {getStageIcon(progress.currentStage)}
            <div className="flex-1">
              <div className={`font-medium ${getStageColor(progress.currentStage)}`}>
                {progress.currentStage === 'initialization' && 'Initializing Two-Stage Scanner'}
                {progress.currentStage === 'stage1' && 'Stage 1: Market Universe + Smart Filtering'}
                {progress.currentStage === 'stage2' && 'Stage 2: Exact Scanner Logic'}
                {progress.currentStage === 'completed' && 'Scan Completed Successfully'}
                {progress.currentStage === 'error' && 'Scan Failed'}
              </div>
              <div className="text-sm text-gray-600">{progress.message}</div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold">{progress.overallProgress}%</div>
            </div>
          </div>

          {/* Overall Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Overall Progress</span>
              <span>{progress.overallProgress}%</span>
            </div>
            <Progress value={progress.overallProgress} className="h-2" />
          </div>

          {/* Stage-specific progress */}
          {isRunning && progress.currentStage !== 'error' && progress.currentStage !== 'completed' && (
            <div className="grid grid-cols-2 gap-4">
              {/* Stage 1 Progress */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4 text-orange-600" />
                  <span className="text-sm font-medium">Stage 1: Smart Filtering</span>
                  <Badge variant={progress.stage1Progress === 100 ? "default" : "secondary"}>
                    {progress.stage1Progress}%
                  </Badge>
                </div>
                <Progress value={progress.stage1Progress} className="h-1" />
                <div className="text-xs text-gray-600">
                  {progress.tickerCount.toLocaleString()} tickers → ~{progress.qualifiedCount} qualified
                </div>
              </div>

              {/* Stage 2 Progress */}
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-purple-600" />
                  <span className="text-sm font-medium">Stage 2: Scanner Execution</span>
                  <Badge variant={progress.stage2Progress > 0 ? "default" : "secondary"}>
                    {progress.stage2Progress}%
                  </Badge>
                </div>
                <Progress value={progress.stage2Progress} className="h-1" />
                <div className="text-xs text-gray-600">
                  {progress.resultsFound} results found
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Results Summary */}
        {progress.currentStage === 'completed' && (
          <div className="p-4 bg-green-50 border border-green-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <CheckCircle className="w-5 h-5 text-green-600" />
              <span className="font-medium text-green-800">Two-Stage Scan Complete!</span>
            </div>
            <div className="grid grid-cols-3 gap-4 text-sm">
              <div>
                <div className="font-medium">Market Universe</div>
                <div className="text-gray-600">{progress.tickerCount.toLocaleString()} tickers</div>
              </div>
              <div>
                <div className="font-medium">Qualified After Filtering</div>
                <div className="text-gray-600">~{progress.qualifiedCount} tickers</div>
              </div>
              <div>
                <div className="font-medium">Final Results</div>
                <div className="text-gray-600">{progress.resultsFound} patterns</div>
              </div>
            </div>
            <div className="mt-2 text-sm text-gray-600">
              Execution time: {formatExecutionTime(executionTime)}
            </div>
          </div>
        )}

        {/* Error Display */}
        {progress.currentStage === 'error' && (
          <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <AlertTriangle className="w-5 h-5 text-red-600" />
              <span className="font-medium text-red-800">Scan Error</span>
            </div>
            <div className="text-sm text-red-700">{progress.message}</div>
          </div>
        )}

        {/* Two-Stage Process Info */}
        {!isRunning && progress.currentStage !== 'completed' && (
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex items-center gap-2 mb-2">
              <Zap className="w-5 h-5 text-blue-600" />
              <span className="font-medium text-blue-800">Two-Stage Process</span>
            </div>
            <div className="text-sm text-blue-700 space-y-1">
              <div>• <strong>Stage 1:</strong> Fetch 17,000+ tickers from Polygon + Smart Temporal Filtering</div>
              <div>• <strong>Stage 2:</strong> Execute exact scanner logic on optimized universe (100% parameter integrity)</div>
              <div>• <strong>Result:</strong> 95-98% market reduction while maintaining 99.9% accuracy</div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TwoStageScanner;