/**
 * Activity Page
 *
 * Display recent workflow logs and system activity.
 */

'use client';

import { useWorkflows } from '@/lib/hooks';
import { Clock, CheckCircle, XCircle, AlertCircle, Tag } from 'lucide-react';

export default function ActivityPage() {
  const { workflows, isLoading, error } = useWorkflows(100);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg font-medium text-error">Error loading activity</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold">Activity Log</h1>
          <p className="text-muted-foreground">
            Recent workflows and system activity
          </p>
        </div>

        {workflows.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Clock className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No activity yet</h3>
            <p className="text-sm text-muted-foreground">
              Activity will appear here as you interact with the system.
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {workflows.map((workflow, index) => (
              <WorkflowCard key={index} workflow={workflow} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: any }) {
  const timestamp = new Date(workflow.timestamp).toLocaleString();

  const getOutcomeIcon = () => {
    switch (workflow.outcome) {
      case 'success':
        return <CheckCircle className="h-5 w-5 text-success" />;
      case 'failed':
        return <XCircle className="h-5 w-5 text-error" />;
      default:
        return <AlertCircle className="h-5 w-5 text-warning" />;
    }
  };

  const getOutcomeLabel = () => {
    switch (workflow.outcome) {
      case 'success':
        return 'Success';
      case 'failed':
        return 'Failed';
      case 'partial':
        return 'Partial';
      default:
        return 'Unknown';
    }
  };

  return (
    <div className="rounded-lg border border-border bg-card p-6">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          {getOutcomeIcon()}
          <span className="font-medium">{getOutcomeLabel()}</span>
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <Clock className="h-4 w-4" />
          {timestamp}
        </div>
      </div>

      <div className="space-y-3">
        <div>
          <p className="mb-1 text-xs font-medium text-muted-foreground">Request</p>
          <p className="text-sm line-clamp-2">{workflow.user_request}</p>
        </div>

        <div className="flex items-center gap-4 text-sm">
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Agent</p>
            <p className="font-medium capitalize">{workflow.agent_used.replace('_', ' ')}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Code Generated</p>
            <p className="font-medium">{workflow.code_generated ? 'Yes' : 'No'}</p>
          </div>

          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Validated</p>
            <p className="font-medium">{workflow.code_validated ? 'Yes' : 'No'}</p>
          </div>
        </div>

        {workflow.tags && workflow.tags.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-muted-foreground" />
            <div className="flex flex-wrap gap-1">
              {workflow.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="rounded-full bg-secondary px-2 py-0.5 text-xs text-muted-foreground"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {workflow.learnings && workflow.learnings.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Learnings</p>
            <ul className="list-inside list-disc space-y-1 text-sm text-muted-foreground">
              {workflow.learnings.slice(0, 3).map((learning: string, i: number) => (
                <li key={i}>{learning}</li>
              ))}
            </ul>
          </div>
        )}

        {workflow.metrics && Object.keys(workflow.metrics).length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-muted-foreground">Metrics</p>
            <div className="flex flex-wrap gap-2 text-xs">
              {Object.entries(workflow.metrics).slice(0, 4).map(([key, value]) => (
                <span
                  key={key}
                  className="rounded bg-secondary px-2 py-1 text-muted-foreground"
                >
                  {key}: {typeof value === 'number' ? value.toFixed(2) : value}
                </span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
