/**
 * Memory Dashboard Component
 * Visualize memory usage, logs, and cleanup controls
 */

'use client';

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Card } from '@/components/ui/card';
import { Slider } from '@/components/ui/slider';
import {
  Database,
  Trash2,
  RefreshCw,
  Download,
  Upload,
  Settings,
  TrendingUp,
  AlertTriangle,
  CheckCircle,
  XCircle,
  FileText,
  FolderOpen,
  HardDrive
} from 'lucide-react';

interface LogEntry {
  id: string;
  timestamp: string;
  level: 'info' | 'warn' | 'error' | 'debug';
  category: string;
  message: string;
  source: string;
}

interface MemoryStats {
  logs: {
    total: number;
    by_level: Record<string, number>;
    by_category: Record<string, number>;
  };
  sessions: {
    total: number;
    active: number;
    archived: number;
    total_messages: number;
  };
  snapshots: {
    total: number;
    auto_saves: number;
    manual_saves: number;
  };
  retention_policy: any;
}

interface CleanupStats {
  logs_deleted: number;
  sessions_archived: number;
  sessions_deleted: number;
  space_freed_bytes: number;
  last_cleanup: string;
  next_cleanup: string;
}

interface RetentionPolicy {
  log_retention_days: number;
  max_log_entries: number;
  session_retention_days: number;
  max_sessions: number;
  auto_archive_sessions: boolean;
  cleanup_frequency_hours: number;
}

export function MemoryDashboard() {
  const [stats, setStats] = useState<MemoryStats | null>(null);
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [cleanupStats, setCleanupStats] = useState<CleanupStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [autoRefresh, setAutoRefresh] = useState(false);
  const [selectedLogLevel, setSelectedLogLevel] = useState<string>('all');

  // Load data
  useEffect(() => {
    loadData();

    if (autoRefresh) {
      const interval = setInterval(loadData, 5000);
      return () => clearInterval(interval);
    }
  }, [autoRefresh, selectedLogLevel]);

  async function loadData() {
    setLoading(true);
    try {
      // Load stats
      const statsResponse = await fetch('/api/memory?action=stats');
      const statsData = await statsResponse.json();
      if (statsData.success) {
        setStats(statsData.stats);
      }

      // Load logs
      const logsResponse = await fetch(`/api/memory?action=logs&level=${selectedLogLevel !== 'all' ? selectedLogLevel : ''}&limit=50`);
      const logsData = await logsResponse.json();
      if (logsData.success) {
        setLogs(logsData.logs || []);
      }
    } catch (error) {
      console.error('Failed to load memory data:', error);
    } finally {
      setLoading(false);
    }
  }

  // Perform cleanup
  const performCleanup = async () => {
    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'perform_cleanup' })
      });

      const data = await response.json();
      if (data.success) {
        setCleanupStats(data.stats);
        loadData(); // Refresh stats
      }
    } catch (error) {
      console.error('Failed to perform cleanup:', error);
    }
  };

  // Clear logs
  const clearLogs = async () => {
    if (!confirm('Are you sure you want to clear all logs?')) {
      return;
    }

    try {
      const response = await fetch('/api/memory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'clear_log', filters: {} })
      });

      if (response.ok) {
        loadData();
      }
    } catch (error) {
      console.error('Failed to clear logs:', error);
    }
  };

  // Export data
  const exportData = async () => {
    try {
      const response = await fetch('/api/memory?action=export_all');
      const data = await response.json();

      if (data.success) {
        const blob = new Blob([data.data_json], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `memory_export_${new Date().toISOString().split('T')[0]}.json`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
      }
    } catch (error) {
      console.error('Failed to export data:', error);
    }
  };

  // Calculate percentages
  const calculateUsage = () => {
    if (!stats) return { logs: 0, sessions: 0, snapshots: 0 };

    return {
      logs: (stats.logs.total / stats.retention_policy.max_log_entries) * 100,
      sessions: (stats.sessions.total / stats.retention_policy.max_sessions) * 100,
      snapshots: Math.min((stats.snapshots.total / 20) * 100, 100) // Assume max 20 snapshots
    };
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case 'error': return 'text-red-600 bg-red-50';
      case 'warn': return 'text-yellow-600 bg-yellow-50';
      case 'info': return 'text-blue-600 bg-blue-50';
      case 'debug': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-600 bg-gray-50';
    }
  };

  const getLevelIcon = (level: string) => {
    switch (level) {
      case 'error': return <XCircle className="w-4 h-4" />;
      case 'warn': return <AlertTriangle className="w-4 h-4" />;
      case 'info': return <CheckCircle className="w-4 h-4" />;
      case 'debug': return <FileText className="w-4 h-4" />;
      default: return <FileText className="w-4 h-4" />;
    }
  };

  if (loading || !stats) {
    return (
      <div className="p-6 border rounded-lg bg-card">
        <div className="animate-pulse space-y-4">
          <div className="h-6 bg-muted rounded w-1/3"></div>
          <div className="grid grid-cols-3 gap-4">
            {[1, 2, 3].map(i => (
              <div key={i} className="h-24 bg-muted rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  const usage = calculateUsage();

  return (
    <div className="p-6 border rounded-lg bg-card space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-xl font-semibold flex items-center gap-2">
            <Database className="w-5 h-5" />
            Memory Dashboard
          </h3>
          <p className="text-sm text-muted-foreground">
            Monitor and manage system memory usage
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            className="gap-2"
          >
            <RefreshCw className={`w-4 h-4 ${autoRefresh ? 'animate-spin' : ''}`} />
            {autoRefresh ? 'Auto-refreshing' : 'Auto-refresh'}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={loadData}
            className="gap-2"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </Button>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Logs Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <FileText className="w-4 h-4" />
              Logs
            </h4>
            <Badge variant="outline">{stats.logs.total} entries</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{usage.logs.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usage.logs > 90 ? 'bg-red-500' : usage.logs > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usage.logs, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <XCircle className="w-3 h-3 text-red-500" />
                <span>Error: {stats.logs.by_level.error || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <AlertTriangle className="w-3 h-3 text-yellow-500" />
                <span>Warn: {stats.logs.by_level.warn || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-blue-500" />
                <span>Info: {stats.logs.by_level.info || 0}</span>
              </div>
              <div className="flex items-center gap-1">
                <FileText className="w-3 h-3 text-gray-500" />
                <span>Debug: {stats.logs.by_level.debug || 0}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Sessions Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Sessions
            </h4>
            <Badge variant="outline">{stats.sessions.total} sessions</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{usage.sessions.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usage.sessions > 90 ? 'bg-red-500' : usage.sessions > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usage.sessions, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <CheckCircle className="w-3 h-3 text-green-500" />
                <span>Active: {stats.sessions.active}</span>
              </div>
              <div className="flex items-center gap-1">
                <FolderOpen className="w-3 h-3 text-gray-500" />
                <span>Archived: {stats.sessions.archived}</span>
              </div>
              <div className="flex items-center gap-1 col-span-2">
                <FileText className="w-3 h-3 text-blue-500" />
                <span>Total messages: {stats.sessions.total_messages}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Snapshots Card */}
        <Card className="p-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="font-semibold flex items-center gap-2">
              <HardDrive className="w-4 h-4" />
              Snapshots
            </h4>
            <Badge variant="outline">{stats.snapshots.total} snapshots</Badge>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Usage</span>
              <span>{usage.snapshots.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-muted rounded-full h-2">
              <div
                className={`h-2 rounded-full ${
                  usage.snapshots > 90 ? 'bg-red-500' : usage.snapshots > 70 ? 'bg-yellow-500' : 'bg-green-500'
                }`}
                style={{ width: `${Math.min(usage.snapshots, 100)}%` }}
              />
            </div>

            <div className="grid grid-cols-2 gap-2 mt-3 text-xs">
              <div className="flex items-center gap-1">
                <RefreshCw className="w-3 h-3 text-blue-500" />
                <span>Auto: {stats.snapshots.auto_saves}</span>
              </div>
              <div className="flex items-center gap-1">
                <Settings className="w-3 h-3 text-purple-500" />
                <span>Manual: {stats.snapshots.manual_saves}</span>
              </div>
            </div>
          </div>
        </Card>
      </div>

      {/* Retention Policy */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3 flex items-center gap-2">
          <Settings className="w-4 h-4" />
          Retention Policy
        </h4>

        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
          <div>
            <div className="flex justify-between mb-1">
              <span>Log retention</span>
              <span className="font-medium">{stats.retention_policy.log_retention_days} days</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div className="bg-blue-500 h-1 rounded-full" style={{ width: '30%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Session retention</span>
              <span className="font-medium">{stats.retention_policy.session_retention_days} days</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div className="bg-green-500 h-1 rounded-full" style={{ width: '60%' }} />
            </div>
          </div>

          <div>
            <div className="flex justify-between mb-1">
              <span>Cleanup frequency</span>
              <span className="font-medium">{stats.retention_policy.cleanup_frequency_hours} hours</span>
            </div>
            <div className="w-full bg-muted rounded-full h-1">
              <div className="bg-purple-500 h-1 rounded-full" style={{ width: '45%' }} />
            </div>
          </div>
        </div>
      </Card>

      {/* Actions */}
      <Card className="p-4">
        <h4 className="font-semibold mb-3">Actions</h4>

        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            onClick={performCleanup}
            className="gap-2"
          >
            <Trash2 className="w-4 h-4" />
            Perform Cleanup
          </Button>

          <Button
            variant="outline"
            onClick={clearLogs}
            className="gap-2"
          >
            <FileText className="w-4 h-4" />
            Clear Logs
          </Button>

          <Button
            variant="outline"
            onClick={exportData}
            className="gap-2"
          >
            <Download className="w-4 h-4" />
            Export Data
          </Button>
        </div>

        {cleanupStats && (
          <div className="mt-4 p-3 bg-green-50 border border-green-200 rounded-lg">
            <div className="text-sm font-medium text-green-800 mb-1">
              Cleanup completed successfully!
            </div>
            <div className="text-xs text-green-600 space-y-1">
              <div>• {cleanupStats.logs_deleted} logs deleted</div>
              <div>• {cleanupStats.sessions_archived} sessions archived</div>
              <div>• {cleanupStats.sessions_deleted} sessions deleted</div>
              <div>• {(cleanupStats.space_freed_bytes / 1024).toFixed(2)} KB freed</div>
            </div>
          </div>
        )}
      </Card>

      {/* Recent Logs */}
      <Card className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-semibold flex items-center gap-2">
            <FileText className="w-4 h-4" />
            Recent Logs
          </h4>

          <select
            value={selectedLogLevel}
            onChange={(e) => setSelectedLogLevel(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="all">All Levels</option>
            <option value="error">Errors</option>
            <option value="warn">Warnings</option>
            <option value="info">Info</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div className="space-y-2 max-h-64 overflow-y-auto">
          {logs.length === 0 ? (
            <div className="text-center py-4 text-muted-foreground text-sm">
              No logs found
            </div>
          ) : (
            logs.map(log => (
              <div
                key={log.id}
                className={`p-2 rounded border text-sm ${
                  log.level === 'error' ? 'border-red-200 bg-red-50' :
                  log.level === 'warn' ? 'border-yellow-200 bg-yellow-50' :
                  log.level === 'info' ? 'border-blue-200 bg-blue-50' :
                  'border-gray-200 bg-gray-50'
                }`}
              >
                <div className="flex items-start gap-2">
                  <div className={getLevelColor(log.level)}>
                    {getLevelIcon(log.level)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-medium">{log.category}</span>
                      <span className="text-xs text-muted-foreground">
                        {new Date(log.timestamp).toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs">{log.message}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </Card>
    </div>
  );
}
