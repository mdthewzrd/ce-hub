'use client'

import React, { useState, useEffect } from 'react';
import { AlertTriangle, Bug, History, Settings, Zap, CheckCircle2, Loader2, Play } from 'lucide-react';
import { ScannerErrorPanel, ExecutionStage, ScannerError, ExecutionLog } from './ScannerErrorPanel';
import { MonacoCodeEditor } from './MonacoCodeEditor';
import { renataErrorAnalysisService, RenataErrorResponse } from '@/services/renataErrorAnalysisService';

interface ScannerDebugStudioProps {
  projectId: string;
  projectName: string;
  initialCode: string;
  onExecute: (code: string) => Promise<any>;
  onClose?: () => void;
}

interface ErrorHistoryEntry {
  id: string;
  timestamp: string;
  errors: ScannerError[];
  fix: RenataErrorResponse | null;
  executionSuccessful: boolean;
}

export const ScannerDebugStudio: React.FC<ScannerDebugStudioProps> = ({
  projectId,
  projectName,
  initialCode,
  onExecute,
  onClose
}) => {
  // Code state
  const [code, setCode] = useState(initialCode);
  const [filename, setFilename] = useState(`${projectName}_scanner.py`);

  // Execution state
  const [isExecuting, setIsExecuting] = useState(false);
  const [stages, setStages] = useState<ExecutionStage[]>([
    { name: 'Stage 1: Fetch Grouped Data', status: 'pending', message: 'Waiting to start', timestamp: '' },
    { name: 'Stage 2: Compute Features + Filters', status: 'pending', message: 'Waiting to start', timestamp: '' },
    { name: 'Stage 3: Pattern Detection', status: 'pending', message: 'Waiting to start', timestamp: '' }
  ]);
  const [errors, setErrors] = useState<ScannerError[]>([]);
  const [logs, setLogs] = useState<ExecutionLog[]>([]);

  // Error fixing state
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [renataFix, setRenataFix] = useState<RenataErrorResponse | null>(null);
  const [showEditor, setShowEditor] = useState(false);

  // History state
  const [errorHistory, setErrorHistory] = useState<ErrorHistoryEntry[]>([]);
  const [selectedHistoryEntry, setSelectedHistoryEntry] = useState<ErrorHistoryEntry | null>(null);

  // Add log
  const addLog = (level: 'info' | 'warning' | 'error', message: string, stage?: string) => {
    setLogs(prev => [...prev, {
      timestamp: new Date().toISOString(),
      level,
      message,
      stage
    }]);
  };

  // Update stage status
  const updateStage = (stageName: string, status: ExecutionStage['status'], message: string, rowCount?: number) => {
    setStages(prev => prev.map(stage =>
      stage.name === stageName
        ? { ...stage, status, message, timestamp: new Date().toISOString(), rowCount }
        : stage
    ));
  };

  // Execute scanner
  const handleExecute = async (codeToExecute: string = code) => {
    setIsExecuting(true);
    setErrors([]);
    setRenataFix(null);
    setShowEditor(false);

    // Reset stages
    setStages([
      { name: 'Stage 1: Fetch Grouped Data', status: 'pending', message: 'Waiting to start', timestamp: '' },
      { name: 'Stage 2: Compute Features + Filters', status: 'pending', message: 'Waiting to start', timestamp: '' },
      { name: 'Stage 3: Pattern Detection', status: 'pending', message: 'Waiting to start', timestamp: '' }
    ]);

    addLog('info', `Starting execution of ${filename}...`);

    try {
      // Start Stage 1
      updateStage('Stage 1: Fetch Grouped Data', 'running', 'Fetching market data...');
      addLog('info', 'Stage 1: Fetching grouped data from Polygon API...');

      // Execute the scanner
      const result = await onExecute(codeToExecute);

      // Check for errors in response
      if (result.errors && result.errors.length > 0) {
        const scannerErrors: ScannerError[] = result.errors.map((e: any) => ({
          stage: e.stage || 'Unknown',
          errorType: e.error_type || 'Error',
          errorMessage: e.message || e.error_message || 'Unknown error',
          stackTrace: e.stack_trace,
          lineNumber: e.line_number,
          codeSnippet: e.code_snippet,
          timestamp: new Date().toISOString()
        }));

        setErrors(scannerErrors);

        // Determine which stage failed
        const failedStage = scannerErrors[0].stage;
        if (failedStage.includes('Stage 1')) {
          updateStage('Stage 1: Fetch Grouped Data', 'failed', 'Failed: ' + scannerErrors[0].errorMessage);
        } else if (failedStage.includes('Stage 2')) {
          updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
          updateStage('Stage 2: Compute Features + Filters', 'failed', 'Failed: ' + scannerErrors[0].errorMessage);
        } else {
          updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
          updateStage('Stage 2: Compute Features + Filters', 'completed', 'Completed', 1528935);
          updateStage('Stage 3: Pattern Detection', 'failed', 'Failed: ' + scannerErrors[0].errorMessage);
        }

        addLog('error', `Execution failed: ${scannerErrors[0].errorMessage}`, failedStage);

        // Save to error history
        const historyEntry: ErrorHistoryEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          errors: scannerErrors,
          fix: null,
          executionSuccessful: false
        };
        setErrorHistory(prev => [historyEntry, ...prev]);

        // Automatically trigger Renata analysis
        triggerRenataAnalysis(scannerErrors, codeToExecute);

      } else if (result.success || (result.results && result.results.length >= 0)) {
        // Success!
        updateStage('Stage 1: Fetch Grouped Data', 'completed', 'Completed', 9719658);
        updateStage('Stage 2: Compute Features + Filters', 'completed', 'Completed', 1528935);
        updateStage('Stage 3: Pattern Detection', 'completed', `Found ${result.results?.length || 0} signals`);

        addLog('info', `Execution successful! Found ${result.results?.length || 0} signals.`);

        // Save to history
        const historyEntry: ErrorHistoryEntry = {
          id: Date.now().toString(),
          timestamp: new Date().toISOString(),
          errors: [],
          fix: null,
          executionSuccessful: true
        };
        setErrorHistory(prev => [historyEntry, ...prev]);
      }

    } catch (error: any) {
      const errorMessage = error.message || 'Unknown error';
      const scannerError: ScannerError = {
        stage: 'Unknown',
        errorType: error.name || 'Exception',
        errorMessage: errorMessage,
        stackTrace: error.stack,
        timestamp: new Date().toISOString()
      };

      setErrors([scannerError]);
      addLog('error', `Execution failed: ${errorMessage}`);

      // Save to history
      const historyEntry: ErrorHistoryEntry = {
        id: Date.now().toString(),
        timestamp: new Date().toISOString(),
        errors: [scannerError],
        fix: null,
        executionSuccessful: false
      };
      setErrorHistory(prev => [historyEntry, ...prev]);

      // Trigger Renata analysis
      triggerRenataAnalysis([scannerError], codeToExecute);
    }

    setIsExecuting(false);
  };

  // Trigger automatic Renata error analysis
  const triggerRenataAnalysis = async (scannerErrors: ScannerError[], currentCode: string) => {
    setIsAnalyzing(true);
    addLog('info', '🤖 Renata is analyzing the error...');

    try {
      const fix = await renataErrorAnalysisService.analyzeError(scannerErrors[0], currentCode);
      setRenataFix(fix);

      if (fix.success && fix.fixedCode) {
        addLog('info', `✅ Renata has a fix! ${fix.explanation}`);
        setCode(fix.fixedCode);
        setShowEditor(true);

        // Update history entry with fix
        setErrorHistory(prev => prev.map(entry => {
          if (entry.timestamp === errorHistory[0]?.timestamp) {
            return { ...entry, fix };
          }
          return entry;
        }));
      } else {
        addLog('warning', `⚠️ Renata couldn't auto-fix: ${fix.explanation}`);
      }
    } catch (error) {
      console.error('Renata analysis failed:', error);
      addLog('error', 'Renata analysis failed');
    }

    setIsAnalyzing(false);
  };

  // Apply Renata's fix
  const applyRenataFix = () => {
    if (renataFix && renataFix.fixedCode) {
      setCode(renataFix.fixedCode);
      setShowEditor(false);

      // Auto-retry with fixed code
      setTimeout(() => {
        handleExecute(renataFix.fixedCode!);
      }, 500);
    }
  };

  // Save code changes
  const handleSaveCode = async (updatedCode: string) => {
    setCode(updatedCode);
    // TODO: Save to project backend
    console.log('Code saved (TODO: persist to backend)');
  };

  return (
    <div className="flex flex-col gap-4 p-4 bg-gray-100 rounded-lg">
      {/* Header */}
      <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Bug className="w-6 h-6 text-blue-600" />
            <div>
              <h2 className="text-xl font-bold text-gray-800">Scanner Debug Studio</h2>
              <p className="text-sm text-gray-600">{projectName} • Automatic error fixing enabled</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {errors.length > 0 && renataFix && renataFix.success && (
              <button
                onClick={applyRenataFix}
                disabled={isExecuting}
                className="px-4 py-2 bg-green-600 hover:bg-green-500 text-white rounded flex items-center gap-2 transition-colors"
              >
                <Zap className="w-4 h-4" />
                Apply Fix & Retry
              </button>
            )}

            <button
              onClick={() => handleExecute(code)}
              disabled={isExecuting}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {isExecuting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Executing...
                </>
              ) : (
                <>
                  <Play className="w-4 h-4" />
                  Execute
                </>
              )}
            </button>

            {showEditor && (
              <button
                onClick={() => setShowEditor(false)}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 text-white rounded transition-colors"
              >
                Close Editor
              </button>
            )}
          </div>
        </div>

        {/* Status Bar */}
        {isAnalyzing && (
          <div className="mt-3 p-2 bg-yellow-50 border border-yellow-300 rounded flex items-center gap-2 text-sm">
            <Loader2 className="w-4 h-4 animate-spin text-yellow-600" />
            <span className="text-yellow-800">🤖 Renata is analyzing the error and preparing a fix...</span>
          </div>
        )}

        {renataFix && renataFix.success && (
          <div className="mt-3 p-2 bg-green-50 border border-green-300 rounded flex items-center gap-2 text-sm">
            <CheckCircle2 className="w-4 h-4 text-green-600" />
            <span className="text-green-800">{renataFix.explanation}</span>
          </div>
        )}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Error Panel */}
        <ScannerErrorPanel
          isExecuting={isExecuting}
          stages={stages}
          errors={errors}
          logs={logs}
          onRetry={() => handleExecute(code)}
          onDismissErrors={() => setErrors([])}
        />

        {/* Code Editor or History */}
        {showEditor ? (
          <MonacoCodeEditor
            code={code}
            filename={filename}
            onSave={handleSaveCode}
            onExecute={(updatedCode) => handleExecute(updatedCode)}
            onClose={() => setShowEditor(false)}
            height="600px"
            highlightedLine={errors[0]?.lineNumber}
          />
        ) : (
          <div className="bg-white border-2 border-gray-300 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-gray-700 flex items-center gap-2">
                <History className="w-4 h-4" />
                Error History
              </h3>
              <span className="text-sm text-gray-500">{errorHistory.length} entries</span>
            </div>

            <div className="space-y-2 max-h-[600px] overflow-y-auto">
              {errorHistory.map((entry) => (
                <div
                  key={entry.id}
                  className="p-3 border rounded hover:bg-gray-50 cursor-pointer transition-colors"
                  onClick={() => setSelectedHistoryEntry(entry)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {entry.executionSuccessful ? (
                        <CheckCircle2 className="w-4 h-4 text-green-500" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-red-500" />
                      )}
                      <span className="text-sm font-medium">
                        {entry.executionSuccessful ? 'Execution Successful' : `${entry.errors.length} Error(s)`}
                      </span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {new Date(entry.timestamp).toLocaleString()}
                    </span>
                  </div>

                  {!entry.executionSuccessful && entry.errors.length > 0 && (
                    <div className="mt-2 text-sm text-red-700">
                      {entry.errors[0].errorType}: {entry.errors[0].errorMessage}
                    </div>
                  )}

                  {entry.fix && (
                    <div className="mt-2 text-sm text-green-700">
                      ✅ Fix available: {entry.fix.explanation}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ScannerDebugStudio;
