/**
 * EdgeDev AI Agent - Patterns Page
 *
 * Pattern performance display with premium black/gold theme
 */

'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { usePatterns } from '@/lib/hooks';
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
  Award,
  Target,
  TrendingDown,
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

export default function PatternsPage() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { patterns, isLoading, error } = usePatterns(10);
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
              <span>Pattern Analysis</span>
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
            <BarChart3 className="h-5 w-5 text-gold" />
            <h1 className="text-sm font-medium">Patterns</h1>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => window.location.reload()}
              className="p-2 rounded-lg hover:bg-surface-hover text-text-muted transition-all duration-200"
            >
              <RefreshCw className="h-4 w-4" />
            </button>
          </div>
        </header>

        {/* Content */}
        <div className="flex-1 overflow-y-auto">
          <div className="max-w-7xl mx-auto p-6">
            {/* Header */}
            <div className="mb-8">
              <h2 className="text-2xl font-bold mb-2 flex items-center gap-3">
                <Award className="h-8 w-8 text-gold" />
                Pattern Performance
              </h2>
              <p className="text-sm text-text-muted">
                Top performing patterns based on historical backtest results
              </p>
            </div>

            {/* Loading state */}
            {isLoading && (
              <div className="card rounded-xl p-12 text-center">
                <div className="flex flex-col items-center gap-4">
                  <div className="w-12 h-12 border-2 border-gold border-t-transparent rounded-full animate-spin" />
                  <p className="text-sm text-text-muted">Loading patterns...</p>
                </div>
              </div>
            )}

            {/* Error state */}
            {error && (
              <div className="card rounded-xl p-12 text-center border border-red-500/20">
                <p className="mb-2 text-sm font-medium text-red-500">Error loading patterns</p>
                <p className="text-xs text-text-muted">{error.message}</p>
              </div>
            )}

            {/* Empty state */}
            {!isLoading && !error && patterns.length === 0 && (
              <div className="card rounded-xl p-12 text-center">
                <Award className="mx-auto mb-4 h-16 w-16 text-text-muted" />
                <h3 className="mb-2 text-lg font-semibold">No patterns tracked yet</h3>
                <p className="text-sm text-text-muted mb-6">
                  Execute strategies and backtests to discover high-performing patterns.
                </p>
                <Link
                  href="/scan"
                  className="inline-flex items-center gap-2 px-6 py-3 bg-gold text-black font-medium rounded-lg hover:bg-gold-hover transition-all duration-200 shadow-gold-sm hover:shadow-glow-md"
                >
                  <Target className="h-4 w-4" />
                  Execute Scanner
                </Link>
              </div>
            )}

            {/* Patterns grid */}
            {!isLoading && !error && patterns.length > 0 && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {patterns.map((pattern: any) => (
                  <PatternCard key={pattern.pattern_name} pattern={pattern} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: any }) {
  const successPercent = pattern.success_rate * 100;
  const avgReturnPercent = pattern.avg_return * 100;

  return (
    <div className="card rounded-xl p-6 hover:border-gold/30 transition-all duration-200">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-5 w-5 text-gold" />
          <h3 className="font-semibold">{pattern.pattern_name}</h3>
        </div>
        <ConfidenceBadge value={pattern.confidence * 100} />
      </div>

      <p className="mb-4 text-sm text-text-muted line-clamp-2 min-h-[2.5rem]">
        {pattern.description}
      </p>

      <div className="space-y-3 mb-4">
        <MetricRow
          label="Success Rate"
          value={successPercent}
          format="percent"
          icon={TrendingUp}
        />
        <MetricRow
          label="Avg Return"
          value={avgReturnPercent}
          format="percent"
          icon={Target}
        />
        <div className="flex items-center justify-between text-sm">
          <span className="text-text-muted">Samples</span>
          <span className="font-semibold">{pattern.sample_count}</span>
        </div>
      </div>

      {pattern.use_cases?.length > 0 && (
        <div className="pt-4 border-t border-border">
          <div className="flex flex-wrap gap-2">
            {pattern.use_cases.slice(0, 3).map((useCase: string) => (
              <span
                key={useCase}
                className="px-2 py-1 text-xs font-medium bg-gold/10 text-gold border border-gold/20 rounded-lg"
              >
                {useCase}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function MetricRow({
  label,
  value,
  format,
  icon: Icon,
}: {
  label: string;
  value: number;
  format: 'percent' | 'number';
  icon: React.ComponentType<{ className?: string }>;
}) {
  const formattedValue =
    format === 'percent' ? `${value.toFixed(1)}%` : value.toFixed(2);
  const isPositive = value > 0;

  return (
    <div className="flex items-center justify-between">
      <span className="flex items-center gap-2 text-sm text-text-muted">
        <Icon className="h-4 w-4" />
        {label}
      </span>
      <span
        className={`font-semibold ${
          format === 'percent' && isPositive
            ? 'text-green-500'
            : ''
        } ${format === 'percent' && !isPositive && value !== 0 ? 'text-red-500' : ''}`}
      >
        {formattedValue}
      </span>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 80) return 'bg-green-500/10 text-green-500 border-green-500/20';
    if (value >= 50) return 'bg-yellow-500/10 text-yellow-500 border-yellow-500/20';
    return 'bg-red-500/10 text-red-500 border-red-500/20';
  };

  return (
    <span
      className={`px-2 py-1 text-xs font-semibold border rounded-lg ${getColor()}`}
    >
      {value.toFixed(0)}%
    </span>
  );
}
