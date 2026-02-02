'use client'

import React, { useState, useEffect } from 'react';
import { AlertCircle, CheckCircle, XCircle, Loader2, ChevronDown, ChevronUp, Copy, RefreshCw, Bug } from 'lucide-react';

export interface ExecutionStage {
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  message: string;
  details?: string;
  timestamp: string;
  rowCount?: number;
}

export interface ScannerError {
  stage: string;
  errorType: string;
  errorMessage: string;
  stackTrace?: string;
  lineNumber?: number;
  codeSnippet?: string;
  timestamp: string;
}

export interface ExecutionLog {
  timestamp: string;
  level: 'info' | 'warning' | 'error';
  message: string;
  stage?: string;
}

interface ScannerErrorPanelProps {
  isExecuting: boolean;
  stages: ExecutionStage[];
  errors: ScannerError[];
  logs: ExecutionLog[];
  onRetry?: () => void;
  onDismissErrors?: () => void;
  className?: string;
}

export const ScannerErrorPanel: React.FC<ScannerErrorPanelProps> = ({
  isExecuting,
  stages,
  errors,
  logs,
  onRetry,
  onDismissErrors,
  className = ''
}) => {
  const [expandedStage, setExpandedStage] = useState<string | null>(null);
  const [expandedLog, setExpandedLog] = useState(false);
  const [selectedError, setSelectedError] = useState<number | null>(null);

  // Auto-expand failed stages
  useEffect(() => {
    const failedStage = stages.find(s => s.status === 'failed');
    if (failedStage && !expandedStage) {
      setExpandedStage(failedStage.name);
    }
  }, [stages, expandedStage]);

  const getStatusIcon = (status: ExecutionStage['status']) => {
    switch (status) {
      case 'pending':
        return <div className="w-4 h-4 rounded-full border-2 border-gray-400" />;
      case 'running':
        return <Loader2 className="w-4 h-4 text-blue-500 animate-spin" />;
      case 'completed':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'failed':
        return <XCircle className="w-4 h-4 text-red-500" />;
    }
  };

  const getStatusColor = (status: ExecutionStage['status']) => {
    switch (status) {
      case 'pending':
        return 'bg-gray-100 border-gray-300';
      case 'running':
        return 'bg-blue-50 border-blue-400';
      case 'completed':
        return 'bg-green-50 border-green-400';
      case 'failed':
        return 'bg-red-50 border-red-400';
    }
  };

  const getLogIcon = (level: ExecutionLog['level']) => {
    switch (level) {
      case 'info':
        return <div className="w-2 h-2 rounded-full bg-blue-400" />;
      case 'warning':
        return <AlertCircle className="w-3 h-3 text-yellow-500" />;
      case 'error':
        return <XCircle className="w-3 h-3 text-red-500" />;
    }
  };

  const copyError = (error: ScannerError) => {
    const text = `Error: ${error.errorMessage}\n\nStage: ${error.stage}\nType: ${error.errorType}\n\n${error.stackTrace || ''}`;
    navigator.clipboard.writeText(text);
  };

  return (
    <div className={`bg-white rounded-lg border-2 border-gray-300 shadow-lg ${className}`}>
      {/* Header */}
      <div className="bg-gradient-to-r from-gray-800 to-gray-900 text-white px-4 py-3 rounded-t-lg">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {isExecuting ? (
              <Loader2 className="w-5 h-5 animate-spin" />
            ) : errors.length > 0 ? (
              <AlertCircle className="w-5 h-5 text-red-400" />
            ) : (
              <CheckCircle className="w-5 h-5 text-green-400" />
            )}
            <h3 className="font-bold text-lg">
              {isExecuting ? 'Scanner Executing' : errors.length > 0 ? 'Execution Failed' : 'Execution Complete'}
            </h3>
          </div>
          <div className="flex items-center gap-2">
            {errors.length > 0 && (
              <button
                onClick={onDismissErrors}
                className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 rounded flex items-center gap-1"
              >
                Dismiss
              </button>
            )}
            {onRetry && !isExecuting && (
              <button
                onClick={onRetry}
                className="px-3 py-1 text-sm bg-blue-600 hover:bg-blue-500 rounded flex items-center gap-1"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="p-4 space-y-4">
        {/* Execution Stages */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-gray-700 flex items-center gap-2">
              <Bug className="w-4 h-4" />
              Execution Stages
            </h4>
            <span className="text-sm text-gray-500">
              {stages.filter(s => s.status === 'completed').length} / {stages.length} completed
            </span>
          </div>

          <div className="space-y-2">
            {stages.map((stage, index) => (
              <div
                key={index}
                className={`border-2 rounded-lg ${getStatusColor(stage.status)} transition-all`}
              >
                <div
                  className="flex items-center justify-between p-3 cursor-pointer hover:opacity-80"
                  onClick={() => setExpandedStage(expandedStage === stage.name ? null : stage.name)}
                >
                  <div className="flex items-center gap-3">
                    {getStatusIcon(stage.status)}
                    <div>
                      <div className="font-semibold text-gray-800">{stage.name}</div>
                      <div className="text-sm text-gray-600">{stage.message}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {stage.rowCount !== undefined && (
                      <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded">
                        {stage.rowCount.toLocaleString()} rows
                      </span>
                    )}
                    <span className="text-xs text-gray-500">
                      {new Date(stage.timestamp).toLocaleTimeString()}
                    </span>
                    {expandedStage === stage.name ? (
                      <ChevronUp className="w-4 h-4" />
                    ) : (
                      <ChevronDown className="w-4 h-4" />
                    )}
                  </div>
                </div>

                {expandedStage === stage.name && stage.details && (
                  <div className="px-3 pb-3">
                    <div className="bg-gray-900 text-green-400 p-3 rounded text-sm font-mono overflow-x-auto">
                      <pre>{stage.details}</pre>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Errors Section */}
        {errors.length > 0 && (
          <div>
            <h4 className="font-semibold text-gray-700 flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-red-500" />
              Errors ({errors.length})
            </h4>

            <div className="space-y-3">
              {errors.map((error, index) => (
                <div
                  key={index}
                  className="bg-red-50 border-2 border-red-400 rounded-lg overflow-hidden"
                >
                  <div
                    className="p-3 cursor-pointer hover:bg-red-100 transition-colors"
                    onClick={() => setSelectedError(selectedError === index ? null : index)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="font-semibold text-red-800 flex items-center gap-2">
                          <XCircle className="w-4 h-4" />
                          {error.errorType}
                          {error.lineNumber && (
                            <span className="text-sm bg-red-200 px-2 py-0.5 rounded">
                              Line {error.lineNumber}
                            </span>
                          )}
                        </div>
                        <div className="text-red-700 mt-1">{error.errorMessage}</div>
                        <div className="text-xs text-red-600 mt-1">
                          Stage: {error.stage} • {new Date(error.timestamp).toLocaleTimeString()}
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            copyError(error);
                          }}
                          className="p-2 hover:bg-red-200 rounded"
                          title="Copy error"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        {selectedError === index ? (
                          <ChevronUp className="w-4 h-4" />
                        ) : (
                          <ChevronDown className="w-4 h-4" />
                        )}
                      </div>
                    </div>

                    {selectedError === index && (
                      <div className="mt-3 space-y-2">
                        {error.codeSnippet && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Code Context:</div>
                            <div className="bg-gray-900 text-green-400 p-2 rounded text-sm font-mono overflow-x-auto">
                              <pre>{error.codeSnippet}</pre>
                            </div>
                          </div>
                        )}
                        {error.stackTrace && (
                          <div>
                            <div className="text-xs font-semibold text-gray-700 mb-1">Stack Trace:</div>
                            <div className="bg-gray-100 p-2 rounded text-xs font-mono overflow-x-auto max-h-40 overflow-y-auto">
                              <pre className="text-gray-800">{error.stackTrace}</pre>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Execution Logs */}
        {logs.length > 0 && (
          <div>
            <div
              className="flex items-center justify-between mb-2 cursor-pointer"
              onClick={() => setExpandedLog(!expandedLog)}
            >
              <h4 className="font-semibold text-gray-700">Execution Logs</h4>
              <span className="text-sm text-gray-500">{logs.length} messages</span>
            </div>

            {expandedLog && (
              <div className="bg-gray-900 rounded-lg p-3 max-h-60 overflow-y-auto">
                <div className="space-y-1">
                  {logs.map((log, index) => (
                    <div key={index} className="flex items-start gap-2 text-sm font-mono">
                      <span className="text-gray-500 text-xs mt-0.5">
                        {new Date(log.timestamp).toLocaleTimeString()}
                      </span>
                      {getLogIcon(log.level)}
                      <span
                        className={
                          log.level === 'error'
                            ? 'text-red-400'
                            : log.level === 'warning'
                            ? 'text-yellow-400'
                            : 'text-gray-300'
                        }
                      >
                        {log.message}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};
