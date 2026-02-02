/**
 * Activity Page - Clean Design
 */

'use client';

import { useWorkflows } from '@/lib/hooks';
import { Clock, CheckCircle, XCircle, AlertCircle, Tag, Sparkles } from 'lucide-react';

export default function ActivityPage() {
  const { workflows, isLoading, error } = useWorkflows(100);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-sm text-text-muted">Loading activity...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-error">Error loading activity</p>
          <p className="text-xs text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">Activity Log</h1>
          <p className="text-sm text-text-muted">
            Recent workflows and system activity
          </p>
        </div>

        {/* Empty state */}
        {workflows.length === 0 ? (
          <div className="card text-center p-12">
            <Clock className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <h3 className="mb-2 text-base font-medium">No activity yet</h3>
            <p className="text-sm text-text-muted">
              Activity will appear here as you interact with the system.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
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

  const getOutcome = () => {
    switch (workflow.outcome) {
      case 'success':
        return { icon: CheckCircle, color: 'text-success', label: 'Success' };
      case 'failed':
        return { icon: XCircle, color: 'text-error', label: 'Failed' };
      default:
        return { icon: AlertCircle, color: 'text-warning', label: 'Partial' };
    }
  };

  const outcome = getOutcome();
  const OutcomeIcon = outcome.icon;

  return (
    <div className="card">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <OutcomeIcon className={`h-4 w-4 ${outcome.color}`} />
          <span className="text-sm font-medium">{outcome.label}</span>
        </div>
        <div className="flex items-center gap-1 text-xs text-text-muted">
          <Clock className="h-3.5 w-3.5" />
          {timestamp}
        </div>
      </div>

      <div className="space-y-3 text-xs">
        <div>
          <p className="mb-1 text-xs font-medium text-text-muted">Request</p>
          <p className="text-sm text-text-primary line-clamp-2">{workflow.user_request}</p>
        </div>

        <div className="flex gap-4 text-text-muted">
          <div>
            <p className="mb-1 text-xs font-medium">Agent</p>
            <p className="text-sm font-medium text-text-primary capitalize">
              {workflow.agent_used.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">Code</p>
            <p className="text-sm font-medium text-text-primary">
              {workflow.code_generated ? 'Generated' : 'None'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">Validated</p>
            <p className="text-sm font-medium text-text-primary">
              {workflow.code_validated ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {workflow.tags?.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-3.5 w-3.5 text-text-muted" />
            <div className="flex flex-wrap gap-1">
              {workflow.tags.map((tag: string) => (
                <span key={tag} className="badge badge-primary">
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {workflow.learnings?.length > 0 && (
          <div>
            <p className="mb-1 text-xs font-medium text-text-muted">Learnings</p>
            <ul className="list-inside list-disc space-y-1 text-xs text-text-muted">
              {workflow.learnings.slice(0, 3).map((learning: string, i: number) => (
                <li key={i}>{learning}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
}
