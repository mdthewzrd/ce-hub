/**
 * ProjectExecutor Component
 *
 * Enables project execution with configuration options, real-time progress monitoring,
 * signal aggregation preview, results visualization, and export functionality.
 */

'use client'

import React, { useState, useEffect, useCallback } from 'react';
import { Play, Square, Clock, BarChart3, Download, Eye, Settings, AlertCircle, CheckCircle, Loader2, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Project,
  Scanner,
  ExecutionConfig,
  ExecutionStatus,
  ExecutionResults,
  ProjectExecutorProps,
  Signal,
  ValidationResult
} from '@/types/projectTypes';
import { projectApiService } from '@/services/projectApiService';
import { cn } from '@/lib/utils';

// Execution Configuration Form Component
interface ExecutionConfigFormProps {
  project: Project;
  scanners: Scanner[];
  onExecute: (config: ExecutionConfig) => void;
  disabled?: boolean;
}

const ExecutionConfigForm: React.FC<ExecutionConfigFormProps> = ({
  project,
  scanners,
  onExecute,
  disabled = false
}) => {
  const [config, setConfig] = useState<ExecutionConfig>({
    date_range: {
      start_date: '',
      end_date: ''
    },
    symbols: [],
    filters: {},
    parallel_execution: true,
    timeout_seconds: 300
  });
  const [validation, setValidation] = useState<ValidationResult>({ isValid: false, errors: [] });
  const [symbolsInput, setSymbolsInput] = useState('');

  // Set default dates (last 30 days)
  useEffect(() => {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setDate(endDate.getDate() - 30);

    setConfig(prev => ({
      ...prev,
      date_range: {
        start_date: startDate.toISOString().split('T')[0],
        end_date: endDate.toISOString().split('T')[0]
      }
    }));
  }, []);

  // Validate configuration
  useEffect(() => {
    const errors = projectApiService.validateExecutionConfig(config);
    setValidation({
      isValid: errors.length === 0,
      errors
    });
  }, [config]);

  // Parse symbols input
  useEffect(() => {
    const symbols = symbolsInput
      .split(',')
      .map(s => s.trim().toUpperCase())
      .filter(s => s.length > 0);

    setConfig(prev => ({
      ...prev,
      symbols: symbols.length > 0 ? symbols : undefined
    }));
  }, [symbolsInput]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (validation.isValid) {
      onExecute(config);
    }
  };

  const enabledScanners = scanners.filter(s => s.enabled);

  return (
    <Card className="bg-gray-800 border-gray-700 p-6">
      <h3 className="text-lg font-semibold text-white mb-4">Execution Configuration</h3>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Project Summary */}
        <div className="bg-gray-900 rounded-lg p-4">
          <h4 className="text-sm font-medium text-white mb-2">Project Summary</h4>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-xs text-gray-400">
            <div>
              <div className="text-gray-500">Total Scanners</div>
              <div className="text-white font-medium">{scanners.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Enabled</div>
              <div className="text-white font-medium">{enabledScanners.length}</div>
            </div>
            <div>
              <div className="text-gray-500">Aggregation</div>
              <div className="text-white font-medium">{project.aggregation_method}</div>
            </div>
            <div>
              <div className="text-gray-500">Total Weight</div>
              <div className="text-white font-medium">
                {enabledScanners.reduce((sum, s) => sum + s.weight, 0).toFixed(1)}
              </div>
            </div>
          </div>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="start_date" className="text-sm font-medium text-gray-200">
              Start Date *
            </Label>
            <Input
              id="start_date"
              type="date"
              value={config.date_range.start_date}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                date_range: { ...prev.date_range, start_date: e.target.value }
              }))}
              disabled={disabled}
              className="bg-gray-900 border-gray-600 text-white"
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="end_date" className="text-sm font-medium text-gray-200">
              End Date *
            </Label>
            <Input
              id="end_date"
              type="date"
              value={config.date_range.end_date}
              onChange={(e) => setConfig(prev => ({
                ...prev,
                date_range: { ...prev.date_range, end_date: e.target.value }
              }))}
              disabled={disabled}
              className="bg-gray-900 border-gray-600 text-white"
              required
            />
          </div>
        </div>

        {/* Symbols */}
        <div className="space-y-2">
          <Label htmlFor="symbols" className="text-sm font-medium text-gray-200">
            Symbols (optional)
          </Label>
          <Input
            id="symbols"
            value={symbolsInput}
            onChange={(e) => setSymbolsInput(e.target.value)}
            placeholder="AAPL, MSFT, GOOGL (leave empty to scan all symbols)"
            disabled={disabled}
            className="bg-gray-900 border-gray-600 text-white"
          />
          <p className="text-xs text-gray-500">
            Comma-separated list of symbols to scan. Leave empty to scan all available symbols.
          </p>
        </div>

        {/* Execution Options */}
        <div className="space-y-4">
          <h4 className="text-sm font-medium text-gray-200">Execution Options</h4>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={config.parallel_execution}
                  onCheckedChange={(checked) => setConfig(prev => ({
                    ...prev,
                    parallel_execution: Boolean(checked)
                  }))}
                  disabled={disabled}
                />
                <Label className="text-sm text-gray-300">
                  Parallel Execution
                </Label>
              </div>
              <p className="text-xs text-gray-500 ml-6">
                Run scanners in parallel for faster execution
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="timeout" className="text-sm font-medium text-gray-200">
                Timeout (seconds)
              </Label>
              <Input
                id="timeout"
                type="number"
                value={config.timeout_seconds}
                onChange={(e) => setConfig(prev => ({
                  ...prev,
                  timeout_seconds: parseInt(e.target.value) || 300
                }))}
                min={30}
                max={1800}
                disabled={disabled}
                className="bg-gray-900 border-gray-600 text-white"
              />
            </div>
          </div>
        </div>

        {/* Validation Errors */}
        {!validation.isValid && (
          <Card className="bg-red-900 border-red-700 p-4">
            <div className="flex items-center space-x-2 mb-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <h4 className="text-red-200 font-medium">Configuration Errors</h4>
            </div>
            <ul className="list-disc list-inside text-red-300 text-sm space-y-1">
              {validation.errors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </Card>
        )}

        {/* Execute Button */}
        <Button
          type="submit"
          disabled={!validation.isValid || disabled || enabledScanners.length === 0}
          className="w-full bg-green-600 hover:bg-green-700"
        >
          <Play className="h-4 w-4 mr-2" />
          {enabledScanners.length === 0
            ? 'No Enabled Scanners'
            : `Execute Project (${enabledScanners.length} scanners)`
          }
        </Button>
      </form>
    </Card>
  );
};

// Execution Status Monitor Component
interface ExecutionStatusMonitorProps {
  execution: ExecutionStatus;
  onStop?: () => void;
  onViewResults?: () => void;
}

const ExecutionStatusMonitor: React.FC<ExecutionStatusMonitorProps> = ({
  execution,
  onStop,
  onViewResults
}) => {
  const getStatusIcon = () => {
    switch (execution.status) {
      case 'running':
        return <Loader2 className="h-4 w-4 animate-spin text-blue-400" />;
      case 'completed':
        return <CheckCircle className="h-4 w-4 text-green-400" />;
      case 'failed':
        return <AlertCircle className="h-4 w-4 text-red-400" />;
      default:
        return <Clock className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = () => {
    switch (execution.status) {
      case 'running':
        return 'text-blue-400';
      case 'completed':
        return 'text-green-400';
      case 'failed':
        return 'text-red-400';
      default:
        return 'text-gray-400';
    }
  };

  const formatDuration = (startTime: string) => {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = now.getTime() - start.getTime();
    const diffSeconds = Math.floor(diffMs / 1000);

    if (diffSeconds < 60) return `${diffSeconds}s`;
    const diffMinutes = Math.floor(diffSeconds / 60);
    if (diffMinutes < 60) return `${diffMinutes}m ${diffSeconds % 60}s`;
    const diffHours = Math.floor(diffMinutes / 60);
    return `${diffHours}h ${diffMinutes % 60}m`;
  };

  return (
    <Card className="bg-gray-800 border-gray-700 p-6">
      <div className="flex justify-between items-start mb-4">
        <div className="flex items-center space-x-3">
          {getStatusIcon()}
          <div>
            <h3 className="text-lg font-semibold text-white">
              Execution Status
            </h3>
            <p className={cn("text-sm capitalize", getStatusColor())}>
              {execution.status}
            </p>
          </div>
        </div>

        <div className="flex space-x-2">
          {execution.status === 'running' && onStop && (
            <Button
              variant="outline"
              size="sm"
              onClick={onStop}
              className="border-red-600 text-red-400 hover:bg-red-900"
            >
              <Square className="h-4 w-4 mr-2" />
              Stop
            </Button>
          )}
          {execution.status === 'completed' && onViewResults && (
            <Button
              size="sm"
              onClick={onViewResults}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Eye className="h-4 w-4 mr-2" />
              View Results
            </Button>
          )}
        </div>
      </div>

      {/* Execution Details */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
        <div>
          <div className="text-gray-400">Started</div>
          <div className="text-white">
            {new Date(execution.started_at).toLocaleTimeString()}
          </div>
        </div>
        <div>
          <div className="text-gray-400">Duration</div>
          <div className="text-white">
            {execution.execution_time
              ? `${(execution.execution_time / 1000).toFixed(1)}s`
              : formatDuration(execution.started_at)
            }
          </div>
        </div>
        <div>
          <div className="text-gray-400">Signals</div>
          <div className="text-white">
            {execution.total_signals || 0}
          </div>
        </div>
        <div>
          <div className="text-gray-400">ID</div>
          <div className="text-white font-mono text-xs">
            {execution.execution_id.split('_').pop()}
          </div>
        </div>
      </div>

      {/* Scanner Results Breakdown */}
      {execution.scanner_results && Object.keys(execution.scanner_results).length > 0 && (
        <div className="mt-6">
          <h4 className="text-sm font-medium text-gray-200 mb-3">Scanner Results</h4>
          <div className="space-y-2">
            {Object.entries(execution.scanner_results).map(([scannerId, count]) => (
              <div key={scannerId} className="flex justify-between items-center">
                <span className="text-sm text-gray-300">{scannerId}</span>
                <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                  {count} signals
                </Badge>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  );
};

// Results Viewer Component (Simple version)
interface SimpleResultsViewerProps {
  results: ExecutionResults;
  onDownload: (format: 'json' | 'csv') => void;
}

const SimpleResultsViewer: React.FC<SimpleResultsViewerProps> = ({
  results,
  onDownload
}) => {
  const [activeTab, setActiveTab] = useState('summary');

  return (
    <Card className="bg-gray-800 border-gray-700 p-6">
      <div className="flex justify-between items-start mb-6">
        <h3 className="text-lg font-semibold text-white">Execution Results</h3>
        <div className="flex space-x-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload('json')}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            JSON
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => onDownload('csv')}
            className="border-gray-600 text-gray-300 hover:bg-gray-700"
          >
            <Download className="h-4 w-4 mr-2" />
            CSV
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2 bg-gray-900">
          <TabsTrigger value="summary" className="text-gray-300 data-[state=active]:text-white">
            Summary
          </TabsTrigger>
          <TabsTrigger value="signals" className="text-gray-300 data-[state=active]:text-white">
            Signals ({results.signals.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="summary">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{results.summary.total_signals}</div>
              <div className="text-sm text-gray-400">Total Signals</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">{results.summary.unique_symbols}</div>
              <div className="text-sm text-gray-400">Unique Symbols</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">
                {Object.keys(results.summary.scanner_breakdown).length}
              </div>
              <div className="text-sm text-gray-400">Scanners</div>
            </div>
            <div className="bg-gray-900 rounded-lg p-4">
              <div className="text-2xl font-bold text-white">
                {(results.summary.execution_time_ms / 1000).toFixed(1)}s
              </div>
              <div className="text-sm text-gray-400">Execution Time</div>
            </div>
          </div>

          <div className="mt-6">
            <h4 className="text-sm font-medium text-gray-200 mb-3">Scanner Breakdown</h4>
            <div className="space-y-2">
              {Object.entries(results.summary.scanner_breakdown).map(([scanner, count]) => (
                <div key={scanner} className="flex justify-between items-center py-2 px-3 bg-gray-900 rounded">
                  <span className="text-sm text-gray-300">{scanner}</span>
                  <Badge variant="secondary" className="bg-gray-700 text-gray-300">
                    {count} signals
                  </Badge>
                </div>
              ))}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="signals">
          <div className="max-h-96 overflow-y-auto">
            {results.signals.length === 0 ? (
              <div className="text-center py-8 text-gray-400">
                No signals generated
              </div>
            ) : (
              <div className="space-y-2">
                {results.signals.slice(0, 100).map((signal, index) => (
                  <div key={index} className="flex justify-between items-center py-2 px-3 bg-gray-900 rounded text-sm">
                    <div className="flex items-center space-x-3">
                      <span className="font-mono text-blue-300">{signal.ticker}</span>
                      <span className="text-gray-400">{signal.date}</span>
                      <Badge className="bg-purple-900 text-purple-200 text-xs">
                        {signal.signal_type}
                      </Badge>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-xs text-gray-500">{signal.scanner_id}</span>
                      <span className="text-xs font-medium text-white">
                        {(signal.confidence * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                ))}
                {results.signals.length > 100 && (
                  <div className="text-center py-4 text-gray-400 text-sm">
                    Showing first 100 of {results.signals.length} signals. Download full results for complete data.
                  </div>
                )}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>
    </Card>
  );
};

// Main ProjectExecutor Component
export const ProjectExecutor: React.FC<ProjectExecutorProps> = ({
  project,
  scanners,
  onExecuteProject,
  activeExecution,
  onViewResults
}) => {
  const [executionResults, setExecutionResults] = useState<ExecutionResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleExecute = async (config: ExecutionConfig) => {
    try {
      setLoading(true);
      setError(null);
      setExecutionResults(null);

      const executionId = await onExecuteProject(config);
      console.log('Project execution started:', executionId);
    } catch (err: any) {
      setError(err.message || 'Failed to start project execution');
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (format: 'json' | 'csv') => {
    if (!executionResults || !activeExecution) return;

    try {
      const results = await projectApiService.getExecutionResults(
        project.id,
        activeExecution.execution_id,
        format
      );

      if (format === 'csv' && results instanceof Blob) {
        const url = URL.createObjectURL(results);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_${activeExecution.execution_id}.csv`;
        a.click();
        URL.revokeObjectURL(url);
      } else if (format === 'json') {
        const dataStr = JSON.stringify(results, null, 2);
        const dataBlob = new Blob([dataStr], { type: 'application/json' });
        const url = URL.createObjectURL(dataBlob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `${project.name}_${activeExecution.execution_id}.json`;
        a.click();
        URL.revokeObjectURL(url);
      }
    } catch (err: any) {
      console.error('Failed to download results:', err);
      setError(err.message || 'Failed to download results');
    }
  };

  // Load results when execution completes
  useEffect(() => {
    const loadResults = async () => {
      if (activeExecution?.status === 'completed') {
        try {
          const results = await projectApiService.getExecutionResults(
            project.id,
            activeExecution.execution_id
          ) as ExecutionResults;
          setExecutionResults(results);
        } catch (err: any) {
          console.error('Failed to load results:', err);
          setError(err.message || 'Failed to load execution results');
        }
      }
    };

    loadResults();
  }, [activeExecution?.status, project.id, activeExecution?.execution_id]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-2xl font-bold text-white mb-2">Execute Project</h2>
        <p className="text-gray-400">
          Configure and run your multi-scanner project to generate trading signals
        </p>
      </div>

      {/* Error Display */}
      {error && (
        <Card className="bg-red-900 border-red-700 p-4">
          <div className="flex items-center space-x-2">
            <AlertCircle className="h-4 w-4 text-red-400" />
            <p className="text-red-200">{error}</p>
          </div>
        </Card>
      )}

      {/* Execution Configuration */}
      {!activeExecution && (
        <ExecutionConfigForm
          project={project}
          scanners={scanners}
          onExecute={handleExecute}
          disabled={loading}
        />
      )}

      {/* Active Execution Monitor */}
      {activeExecution && (
        <ExecutionStatusMonitor
          execution={activeExecution}
          onViewResults={() => onViewResults(activeExecution.execution_id)}
        />
      )}

      {/* Results Display */}
      {executionResults && activeExecution?.status === 'completed' && (
        <SimpleResultsViewer
          results={executionResults}
          onDownload={handleDownload}
        />
      )}
    </div>
  );
};

export default ProjectExecutor;