/**
 * Settings Page - Clean Design
 */

'use client';

import { useState } from 'react';
import { useHealth, useStatus, useLearningStats } from '@/lib/hooks';
import { Settings, Server, Database, Activity, RefreshCw, Sparkles } from 'lucide-react';
import { restartSystem } from '@/lib/api';

export default function SettingsPage() {
  const { health, isHealthy, isLoading: healthLoading } = useHealth();
  const { status, isLoading: statusLoading } = useStatus();
  const { stats, isLoading: statsLoading } = useLearningStats();
  const [restarting, setRestarting] = useState(false);

  const handleRestart = async () => {
    if (!confirm('Are you sure you want to restart the system?')) return;

    setRestarting(true);
    try {
      await restartSystem();
      window.location.reload();
    } catch {
      alert('Failed to restart system');
      setRestarting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">Settings</h1>
          <p className="text-sm text-text-muted">
            System configuration and status
          </p>
        </div>

        <div className="space-y-4">
          {/* System Status */}
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">System Status</h2>
            </div>

            {statusLoading || healthLoading ? (
              <p className="text-xs text-text-muted">Loading status...</p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-muted">API Status</span>
                  <span className={`font-medium ${isHealthy ? 'text-success' : 'text-error'}`}>
                    {health?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-muted">Version</span>
                  <span className="font-medium">{health?.version || status?.version || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-muted">Knowledge Base</span>
                  <span className={`font-medium ${status?.knowledge_base ? 'text-success' : 'text-warning'}`}>
                    {status?.knowledge_base ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-text-muted">Active Sessions</span>
                  <span className="font-medium">{status?.sessions?.active_sessions || 0}</span>
                </div>
              </div>
            )}
          </section>

          {/* Learning Stats */}
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">Learning System</h2>
            </div>

            {statsLoading ? (
              <p className="text-xs text-text-muted">Loading stats...</p>
            ) : (
              <div className="space-y-3 text-xs">
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-muted">Workflows Logged</span>
                  <span className="font-medium">{stats?.workflows_logged || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-muted">Insights Stored</span>
                  <span className="font-medium">{stats?.insights_count || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2 border-b border-border">
                  <span className="text-text-muted">Projects</span>
                  <span className="font-medium">{stats?.projects_count || 0}</span>
                </div>
                <div className="flex items-center justify-between py-2">
                  <span className="text-text-muted">Patterns Tracked</span>
                  <span className="font-medium">{stats?.patterns_tracked || 0}</span>
                </div>
              </div>
            )}
          </section>

          {/* Storage */}
          {stats && (
            <section className="card">
              <div className="mb-4 flex items-center gap-2">
                <Server className="h-5 w-5 text-primary" />
                <h2 className="text-base font-semibold">Storage</h2>
              </div>

              <div className="space-y-2 text-xs">
                <div className="flex items-center justify-between rounded bg-surface p-3">
                  <span className="text-text-muted">Logs</span>
                  <code className="text-xs text-text-primary">{stats.storage_dirs?.logs || 'N/A'}</code>
                </div>
                <div className="flex items-center justify-between rounded bg-surface p-3">
                  <span className="text-text-muted">Memory</span>
                  <code className="text-xs text-text-primary">{stats.storage_dirs?.memory || 'N/A'}</code>
                </div>
                <div className="flex items-center justify-between rounded bg-surface p-3">
                  <span className="text-text-muted">Sessions</span>
                  <code className="text-xs text-text-primary">{stats.storage_dirs?.sessions || 'N/A'}</code>
                </div>
              </div>
            </section>
          )}

          {/* Actions */}
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">System Actions</h2>
            </div>

            <button
              onClick={handleRestart}
              disabled={restarting}
              className="btn btn-secondary w-full"
            >
              <RefreshCw className={`h-4 w-4 ${restarting ? 'animate-spin' : ''}`} />
              {restarting ? 'Restarting...' : 'Restart System'}
            </button>
            <p className="mt-2 text-xs text-text-muted">
              Restarting will clear all active sessions and reinitialize the system.
            </p>
          </section>

          {/* API Config */}
          <section className="card">
            <div className="mb-4 flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              <h2 className="text-base font-semibold">API Configuration</h2>
            </div>

            <div className="space-y-2 text-xs">
              <div className="flex items-center justify-between rounded bg-surface p-3">
                <span className="text-text-muted">API URL</span>
                <code className="text-xs text-text-primary">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7447'}
                </code>
              </div>
              <div className="flex items-center justify-between rounded bg-surface p-3">
                <span className="text-text-muted">Environment</span>
                <code className="text-xs text-text-primary">
                  {process.env.NODE_ENV || 'development'}
                </code>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
