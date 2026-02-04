/**
 * EdgeDev AI Agent - Activity Page
 *
 * Activity log with premium black/gold theme
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useWorkflows } from '@/lib/hooks';
import {
  MessageSquare,
  BarChart3,
  FolderOpen,
  Brain,
  Settings,
  Activity,
  Menu,
  X,
  Sparkles,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Tag,
  RefreshCw,
} from 'lucide-react';

interface NavItem {
  name: string;
  href: string;
  icon: React.ComponentType<{ className?: string }>;
}

const navigation: NavItem[] = [
  { name: 'Chat', href: '/', icon: MessageSquare },
  { name: 'Plan', href: '/plan', icon: Sparkles },
  { name: 'Scan', href: '/scan', icon: BarChart3 },
  { name: 'Backtest', href: '/backtest', icon: TrendingUp },
  { name: 'Patterns', href: '/patterns', icon: BarChart3 },
  { name: 'Projects', href: '/projects', icon: FolderOpen },
  { name: 'Memory', href: '/memory', icon: Brain },
  { name: 'Activity', href: '/activity', icon: Activity },
  { name: 'Settings', href: '/settings', icon: Settings },
];

export default function ActivityPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { workflows, isLoading, error } = useWorkflows(100);
  const pathname = usePathname();

  return (
    <div className="flex h-screen bg-background">
      {/* Mobile backdrop */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 w-64 transform border-r border-border bg-surface lg:static lg:z-40 lg:translate-x-0 transition-transform duration-200 ease-in-out ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-14 items-center justify-between border-b border-border px-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gold shadow-glow-sm">
                <Sparkles className="h-4 w-4 text-black" />
              </div>
              <span className="font-semibold text-lg">EdgeDev AI</span>
            </Link>
            <button
              onClick={() => setSidebarOpen(false)}
              className="lg:hidden p-1 rounded hover:bg-surface-hover text-text-muted"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-0.5 p-2">
            {navigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-all duration-150 ${
                    isActive
                      ? 'bg-gold text-black shadow-gold-sm'
                      : 'text-text-muted hover:bg-surface hover:text-text-primary'
                  }`}
                >
                  <item.icon className="h-4 w-4" />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* Status */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-2 text-xs text-text-muted">
              <div className="h-2 w-2 rounded-full bg-gold shadow-[0_0_0_2px_rgba(212,175,55,0.3)]" />
              <span>Activity Log</span>
            </div>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <main
        className="flex-1 flex flex-col overflow-hidden relative z-10 transition-all duration-300 ease-out"
        style={{ width: sidebarOpen ? 'calc(100% - 384px)' : '100%' }}
      >
        {/* Header */}
        <header className="flex h-14 items-center justify-between border-b border-border bg-surface px-6">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 rounded hover:bg-surface-hover text-text-muted"
          >
            <Menu className="h-5 w-5" />
          </button>
          <div className="flex items-center gap-3">
            <Activity className="h-5 w-5 text-gold" />
            <h1 className="text-sm font-medium">Activity</h1>
          </div>
          <button
            onClick={() => window.location.reload()}
            className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-all duration-200"
          >
            <RefreshCw className="h-4 w-4" />
          </button>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-4xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Clock className="h-8 w-8 text-gold" />
                Activity Log
              </h2>
              <p className="text-sm text-text-muted">
                Recent workflows and system activity
              </p>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="card rounded-xl p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-text-muted">Loading activity...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="card rounded-xl p-12 text-center border border-red-500/20">
                <p className="mb-2 text-sm font-medium text-red-500">Error loading activity</p>
                <p className="text-xs text-text-muted">{error.message}</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && workflows.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <Clock className="mx-auto mb-4 h-16 w-16 text-text-muted" />
                <h3 className="mb-2 text-lg font-semibold">No activity yet</h3>
                <p className="text-sm text-text-muted">
                  Activity will appear here as you interact with the system.
                </p>
              </div>
            )}

            {/* Workflows */}
            {!isLoading && !error && workflows.length > 0 && (
              <div className="space-y-4">
                {workflows.map((workflow: any, index: number) => (
                  <WorkflowCard key={index} workflow={workflow} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function WorkflowCard({ workflow }: { workflow: any }) {
  const timestamp = new Date(workflow.timestamp).toLocaleString();

  const getOutcome = () => {
    switch (workflow.outcome) {
      case 'success':
        return { icon: CheckCircle, color: 'text-green-500', label: 'Success' };
      case 'failed':
        return { icon: XCircle, color: 'text-red-500', label: 'Failed' };
      default:
        return { icon: AlertCircle, color: 'text-yellow-500', label: 'Partial' };
    }
  };

  const outcome = getOutcome();
  const OutcomeIcon = outcome.icon;

  return (
    <div className="card rounded-xl p-6 hover:border-gold/30 transition-all duration-200">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <OutcomeIcon className={`h-5 w-5 ${outcome.color}`} />
          <span className="font-semibold">{outcome.label}</span>
        </div>
        <div className="flex items-center gap-1 text-sm text-text-muted">
          <Clock className="h-4 w-4" />
          {timestamp}
        </div>
      </div>

      <div className="space-y-3 text-sm">
        <div>
          <p className="mb-1 text-xs font-medium text-text-muted">Request</p>
          <p className="text-text-primary line-clamp-2">{workflow.user_request}</p>
        </div>

        <div className="flex gap-6 text-text-muted">
          <div>
            <p className="mb-1 text-xs font-medium">Agent</p>
            <p className="font-semibold text-text-primary capitalize">
              {workflow.agent_used.replace('_', ' ')}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">Code</p>
            <p className="font-semibold text-text-primary">
              {workflow.code_generated ? 'Generated' : 'None'}
            </p>
          </div>
          <div>
            <p className="mb-1 text-xs font-medium">Validated</p>
            <p className="font-semibold text-text-primary">
              {workflow.code_validated ? 'Yes' : 'No'}
            </p>
          </div>
        </div>

        {workflow.tags?.length > 0 && (
          <div className="flex items-center gap-2">
            <Tag className="h-4 w-4 text-text-muted" />
            <div className="flex flex-wrap gap-2">
              {workflow.tags.map((tag: string) => (
                <span
                  key={tag}
                  className="px-2 py-1 text-xs font-medium bg-gold/10 text-gold border border-gold/20 rounded-lg"
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>
        )}

        {workflow.learnings?.length > 0 && (
          <div>
            <p className="mb-2 text-xs font-medium text-text-muted">Learnings</p>
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
