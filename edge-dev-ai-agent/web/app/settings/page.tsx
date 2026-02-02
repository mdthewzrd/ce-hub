/**
 * Settings Page
 *
 * System settings and configuration.
 */

'use client';

import { useState } from 'react';
import { useHealth, useStatus, useLearningStats } from '@/lib/hooks';
import { Settings, Server, Database, Activity, RefreshCw } from 'lucide-react';
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
    } catch (error) {
      alert('Failed to restart system');
      setRestarting(false);
    }
  };

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold">Settings</h1>
          <p className="text-muted-foreground">
            System configuration and status
          </p>
        </div>

        <div className="space-y-6">
          {/* System Status */}
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Activity className="h-5 w-5" />
              <h2 className="text-lg font-semibold">System Status</h2>
            </div>

            {statusLoading || healthLoading ? (
              <p className="text-sm text-muted-foreground">Loading status...</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">API Status</span>
                  <span className={`font-medium ${isHealthy ? 'text-success' : 'text-error'}`}>
                    {health?.status || 'Unknown'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Version</span>
                  <span className="font-medium">{health?.version || status?.version || 'Unknown'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Knowledge Base</span>
                  <span className={`font-medium ${status?.knowledge_base ? 'text-success' : 'text-warning'}`}>
                    {status?.knowledge_base ? 'Connected' : 'Not Connected'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Active Sessions</span>
                  <span className="font-medium">{status?.sessions?.active_sessions || 0}</span>
                </div>
              </div>
            )}
          </section>

          {/* Learning Stats */}
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Database className="h-5 w-5" />
              <h2 className="text-lg font-semibold">Learning System</h2>
            </div>

            {statsLoading ? (
              <p className="text-sm text-muted-foreground">Loading stats...</p>
            ) : (
              <div className="space-y-3 text-sm">
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Workflows Logged</span>
                  <span className="font-medium">{stats?.workflows_logged || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Insights Stored</span>
                  <span className="font-medium">{stats?.insights_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Projects</span>
                  <span className="font-medium">{stats?.projects_count || 0}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-muted-foreground">Patterns Tracked</span>
                  <span className="font-medium">{stats?.patterns_tracked || 0}</span>
                </div>
              </div>
            )}
          </section>

          {/* Storage Directories */}
          {stats && (
            <section className="rounded-lg border border-border bg-card p-6">
              <div className="mb-4 flex items-center gap-2">
                <Server className="h-5 w-5" />
                <h2 className="text-lg font-semibold">Storage</h2>
              </div>

              <div className="space-y-2 text-sm">
                <div className="flex items-center justify-between rounded bg-secondary p-3">
                  <span className="text-muted-foreground">Logs</span>
                  <code className="text-xs">{stats.storage_dirs?.logs || 'N/A'}</code>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary p-3">
                  <span className="text-muted-foreground">Memory</span>
                  <code className="text-xs">{stats.storage_dirs?.memory || 'N/A'}</code>
                </div>
                <div className="flex items-center justify-between rounded bg-secondary p-3">
                  <span className="text-muted-foreground">Sessions</span>
                  <code className="text-xs">{stats.storage_dirs?.sessions || 'N/A'}</code>
                </div>
              </div>
            </section>
          )}

          {/* System Actions */}
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Settings className="h-5 w-5" />
              <h2 className="text-lg font-semibold">System Actions</h2>
            </div>

            <div className="space-y-3">
              <button
                onClick={handleRestart}
                disabled={restarting}
                className="flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium transition-colors hover:bg-secondary disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <RefreshCw className={`h-4 w-4 ${restarting ? 'animate-spin' : ''}`} />
                {restarting ? 'Restarting...' : 'Restart System'}
              </button>
              <p className="text-xs text-muted-foreground">
                Restarting will clear all active sessions and reinitialize the system.
              </p>
            </div>
          </section>

          {/* API Configuration */}
          <section className="rounded-lg border border-border bg-card p-6">
            <div className="mb-4 flex items-center gap-2">
              <Server className="h-5 w-5" />
              <h2 className="text-lg font-semibold">API Configuration</h2>
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center justify-between rounded bg-secondary p-3">
                <span className="text-muted-foreground">API URL</span>
                <code className="text-xs">
                  {process.env.NEXT_PUBLIC_API_URL || 'http://localhost:7447'}
                </code>
              </div>
              <div className="flex items-center justify-between rounded bg-secondary p-3">
                <span className="text-muted-foreground">Environment</span>
                <code className="text-xs">
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
