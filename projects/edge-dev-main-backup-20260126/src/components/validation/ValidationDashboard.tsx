/**
 * Validation Dashboard Component
 * Display validation results, metrics, and run tests
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Check,
  X,
  AlertTriangle,
  SkipForward,
  Play,
  RefreshCw,
  BarChart3,
  TrendingUp,
  Clock,
  FileText,
  Settings,
  Download,
  Lightbulb
} from 'lucide-react';
import type {
  ValidationSummary,
  ValidationLevel,
  TestResult,
  AccuracyMetrics,
  PerformanceMetrics
} from '@/services/validationTestingService';

interface ValidationDashboardProps {
  className?: string;
}

// Helper functions for status styling
function getStatusIcon(status: string) {
  switch (status) {
    case 'passed':
      return <Check className="w-4 h-4 text-green-600" />;
    case 'failed':
      return <X className="w-4 h-4 text-red-600" />;
    case 'warning':
      return <AlertTriangle className="w-4 h-4 text-yellow-600" />;
    case 'skipped':
      return <SkipForward className="w-4 h-4 text-gray-400" />;
    default:
      return null;
  }
}

function getStatusColor(status: string): string {
  switch (status) {
    case 'passed':
      return 'text-green-600 bg-green-50 border-green-200';
    case 'failed':
      return 'text-red-600 bg-red-50 border-red-200';
    case 'warning':
      return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    case 'skipped':
      return 'text-gray-600 bg-gray-50 border-gray-200';
    default:
      return '';
  }
}

function getStatusBorderColor(status: string): string {
  switch (status) {
    case 'passed':
      return 'border-l-4 border-l-green-500';
    case 'failed':
      return 'border-l-4 border-l-red-500';
    case 'warning':
      return 'border-l-4 border-l-yellow-500';
    case 'skipped':
      return 'border-l-4 border-l-gray-400';
    default:
      return '';
  }
}

export function ValidationDashboard({ className }: ValidationDashboardProps) {
  const [loading, setLoading] = useState(false);
  const [summary, setSummary] = useState<ValidationSummary | null>(null);
  const [selectedLevel, setSelectedLevel] = useState<ValidationLevel>('standard');
  const [testHistory, setTestHistory] = useState<TestResult[]>([]);
  const [lastRun, setLastRun] = useState<Date | null>(null);

  const handleRunValidation = async () => {
    setLoading(true);
    setSummary(null);

    try {
      const response = await fetch('/api/validation', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'run',
          level: selectedLevel
        })
      });

      const data = await response.json();

      if (data.success && data.summary) {
        setSummary(data.summary);
        setLastRun(new Date());

        // Refresh test history
        await fetchTestHistory();
      }
    } catch (err) {
      console.error('Failed to run validation:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchTestHistory = async () => {
    try {
      const response = await fetch('/api/validation?action=history&limit=50');
      const data = await response.json();

      if (data.success) {
        setTestHistory(data.history || []);
      }
    } catch (err) {
      console.error('Failed to fetch test history:', err);
    }
  };

  const handleDownloadReport = () => {
    if (!summary) return;

    const report = {
      generated_at: new Date().toISOString(),
      validation_level: selectedLevel,
      summary
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `validation-report-${Date.now()}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    fetchTestHistory();
  }, []);

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header */}
      <Card className="p-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold flex items-center gap-2">
              <BarChart3 className="w-6 h-6" />
              Validation Dashboard
            </h2>
            <p className="text-sm text-muted-foreground mt-1">
              Run validation tests and monitor system health
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge variant="outline">Phase 7</Badge>
            {lastRun && (
              <span className="text-xs text-muted-foreground">
                Last run: {lastRun.toLocaleTimeString()}
              </span>
            )}
          </div>
        </div>

        {/* Controls */}
        <div className="flex items-center gap-4 mt-6">
          <div className="flex items-center gap-2">
            <label className="text-sm font-medium">Validation Level:</label>
            <select
              value={selectedLevel}
              onChange={(e) => setSelectedLevel(e.target.value as ValidationLevel)}
              className="px-3 py-2 border rounded-lg text-sm"
              disabled={loading}
            >
              <option value="basic">Basic</option>
              <option value="standard">Standard</option>
              <option value="comprehensive">Comprehensive</option>
              <option value="exhaustive">Exhaustive</option>
            </select>
          </div>

          <Button
            onClick={handleRunValidation}
            disabled={loading}
            className="gap-2"
          >
            {loading ? (
              <>
                <RefreshCw className="w-4 h-4 animate-spin" />
                Running...
              </>
            ) : (
              <>
                <Play className="w-4 h-4" />
                Run Validation
              </>
            )}
          </Button>

          {summary && (
            <Button
              variant="outline"
              onClick={handleDownloadReport}
              className="gap-2"
            >
              <Download className="w-4 h-4" />
              Download Report
            </Button>
          )}
        </div>
      </Card>

      {/* Validation Summary */}
      {summary && (
        <Card className={`p-6 border-2 ${getStatusColor(summary.overall_status)}`}>
          <div className="flex items-start justify-between">
            <div className="flex items-start gap-3">
              <div className="mt-1">
                {getStatusIcon(summary.overall_status)}
              </div>
              <div>
                <h3 className="font-semibold text-lg">
                  Validation {summary.overall_status.charAt(0).toUpperCase() + summary.overall_status.slice(1)}
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Executed in {summary.execution_time_ms}ms
                </p>
              </div>
            </div>
            <Badge variant="outline" className="text-lg px-3 py-1">
              {summary.overall_status.toUpperCase()}
            </Badge>
          </div>

          {/* Stats Grid */}
          <div className="grid grid-cols-4 gap-4 mt-6">
            <div className="p-4 border rounded-lg">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Tests</span>
                <FileText className="w-4 h-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold mt-2">{summary.total_tests}</p>
            </div>

            <div className="p-4 border rounded-lg bg-green-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-green-700">Passed</span>
                <Check className="w-4 h-4 text-green-600" />
              </div>
              <p className="text-2xl font-bold mt-2 text-green-700">{summary.passed}</p>
            </div>

            <div className="p-4 border rounded-lg bg-red-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-red-700">Failed</span>
                <X className="w-4 h-4 text-red-600" />
              </div>
              <p className="text-2xl font-bold mt-2 text-red-700">{summary.failed}</p>
            </div>

            <div className="p-4 border rounded-lg bg-yellow-50">
              <div className="flex items-center justify-between">
                <span className="text-sm text-yellow-700">Warnings</span>
                <AlertTriangle className="w-4 h-4 text-yellow-600" />
              </div>
              <p className="text-2xl font-bold mt-2 text-yellow-700">{summary.warnings}</p>
            </div>
          </div>

          {/* Recommendations */}
          {summary.recommendations.length > 0 && (
            <div className="mt-6 p-4 border rounded-lg bg-blue-50">
              <div className="flex items-start gap-2">
                <Lightbulb className="w-4 h-4 text-blue-600 mt-0.5" />
                <div className="flex-1">
                  <h4 className="font-semibold text-sm text-blue-900">Recommendations</h4>
                  <ul className="mt-2 space-y-1 text-sm text-blue-800">
                    {summary.recommendations.map((rec, i) => (
                      <li key={i}>• {rec}</li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          )}
        </Card>
      )}

      {/* Detailed Metrics */}
      {summary && (
        <Tabs defaultValue="accuracy" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="accuracy" className="gap-2">
              <TrendingUp className="w-4 h-4" />
              Accuracy Metrics
            </TabsTrigger>
            <TabsTrigger value="performance" className="gap-2">
              <Clock className="w-4 h-4" />
              Performance Metrics
            </TabsTrigger>
            <TabsTrigger value="history" className="gap-2">
              <FileText className="w-4 h-4" />
              Test History
            </TabsTrigger>
          </TabsList>

          {/* Accuracy Tab */}
          <TabsContent value="accuracy" className="space-y-4">
            <AccuracyMetricsDisplay metrics={summary.accuracy_metrics} />
          </TabsContent>

          {/* Performance Tab */}
          <TabsContent value="performance" className="space-y-4">
            <PerformanceMetricsDisplay metrics={summary.performance_metrics} />
          </TabsContent>

          {/* History Tab */}
          <TabsContent value="history" className="space-y-4">
            <TestHistoryDisplay history={testHistory} />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}

// ========== SUB-COMPONENTS ==========

interface AccuracyMetricsDisplayProps {
  metrics: AccuracyMetrics;
}

function AccuracyMetricsDisplay({ metrics }: AccuracyMetricsDisplayProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Accuracy Metrics</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Single Scan Accuracy</span>
          <p className="text-2xl font-bold mt-2">
            {(metrics.single_scan_accuracy * 100).toFixed(1)}%
          </p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-green-600"
              style={{ width: `${metrics.single_scan_accuracy * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Multi-Scan Detection Accuracy</span>
          <p className="text-2xl font-bold mt-2">
            {(metrics.multi_scan_detection_accuracy * 100).toFixed(1)}%
          </p>
          <div className="mt-2 h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600"
              style={{ width: `${metrics.multi_scan_detection_accuracy * 100}%` }}
            />
          </div>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Precision</span>
          <p className="text-2xl font-bold mt-2">
            {(metrics.precision * 100).toFixed(1)}%
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Recall</span>
          <p className="text-2xl font-bold mt-2">
            {(metrics.recall * 100).toFixed(1)}%
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">F1 Score</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.f1_score.toFixed(3)}
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Confidence Interval</span>
          <p className="text-2xl font-bold mt-2">
            {(metrics.confidence_interval.min * 100).toFixed(0)}% - {(metrics.confidence_interval.max * 100).toFixed(0)}%
          </p>
        </div>
      </div>

      <div className="mt-4 p-4 border rounded-lg">
        <h4 className="font-semibold mb-2">Error Rates</h4>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-sm">False Positive Rate</span>
            <Badge variant={metrics.false_positive_rate < 0.05 ? 'default' : 'destructive'}>
              {(metrics.false_positive_rate * 100).toFixed(2)}%
            </Badge>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-sm">False Negative Rate</span>
            <Badge variant={metrics.false_negative_rate < 0.05 ? 'default' : 'destructive'}>
              {(metrics.false_negative_rate * 100).toFixed(2)}%
            </Badge>
          </div>
        </div>
      </div>
    </Card>
  );
}

interface PerformanceMetricsDisplayProps {
  metrics: PerformanceMetrics;
}

function PerformanceMetricsDisplay({ metrics }: PerformanceMetricsDisplayProps) {
  return (
    <Card className="p-6">
      <h3 className="font-semibold mb-4">Performance Metrics</h3>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Average Execution Time</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.average_execution_time_ms.toFixed(0)}ms
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">P50 Execution Time</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.p50_execution_time_ms.toFixed(0)}ms
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">P95 Execution Time</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.p95_execution_time_ms.toFixed(0)}ms
          </p>
          <Badge variant={metrics.p95_execution_time_ms < 500 ? 'default' : 'destructive'} className="mt-2">
            {metrics.p95_execution_time_ms < 500 ? 'Good' : 'Needs Improvement'}
          </Badge>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">P99 Execution Time</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.p99_execution_time_ms.toFixed(0)}ms
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">Memory Usage</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.memory_usage_mb.toFixed(0)} MB
          </p>
        </div>

        <div className="p-4 border rounded-lg">
          <span className="text-sm text-muted-foreground">CPU Usage</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.cpu_usage_percent.toFixed(0)}%
          </p>
        </div>

        <div className="p-4 border rounded-lg col-span-2">
          <span className="text-sm text-muted-foreground">Throughput</span>
          <p className="text-2xl font-bold mt-2">
            {metrics.throughput_scans_per_second.toFixed(1)} scans/second
          </p>
        </div>
      </div>
    </Card>
  );
}

interface TestHistoryDisplayProps {
  history: TestResult[];
}

function TestHistoryDisplay({ history }: TestHistoryDisplayProps) {
  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-semibold">Test History</h3>
        <Badge variant="outline">{history.length} tests</Badge>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          No test history available
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {history.map((result, index) => (
            <div
              key={index}
              className={`p-3 border rounded-lg flex items-center justify-between ${getStatusBorderColor(
                result.status
              )}`}
            >
              <div className="flex items-center gap-3">
                {getStatusIcon(result.status)}
                <div>
                  <p className="text-sm font-medium">{result.test_case_id}</p>
                  <p className="text-xs text-muted-foreground">
                    {new Date(result.metadata.executed_at).toLocaleString()}
                  </p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-sm font-medium">{result.execution_time_ms}ms</p>
                <Badge variant="outline" className="text-xs">
                  {result.status}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      )}
    </Card>
  );
}
