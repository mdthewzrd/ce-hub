/**
 * Patterns Page
 *
 * Display top performing patterns with clean design.
 */

'use client';

import { usePatterns } from '@/lib/hooks';
import { TrendingUp, TrendingDown, Award, Target, Sparkles } from 'lucide-react';

export default function PatternsPage() {
  const { patterns, isLoading, error } = usePatterns(10);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="spinner spinner-lg mx-auto mb-4" />
          <p className="text-sm text-text-muted">Loading patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-sm font-medium text-error">Error loading patterns</p>
          <p className="text-xs text-text-muted">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <h1 className="mb-2 text-xl font-semibold tracking-tight">Pattern Performance</h1>
          <p className="text-sm text-text-muted">
            Top performing patterns based on historical results
          </p>
        </div>

        {/* Empty state */}
        {patterns.length === 0 ? (
          <div className="card text-center p-12">
            <Award className="mx-auto mb-4 h-12 w-12 text-text-muted" />
            <h3 className="mb-2 text-base font-medium">No patterns tracked yet</h3>
            <p className="text-sm text-text-muted">
              Pattern recommendations will appear here as you execute strategies.
            </p>
          </div>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {patterns.map((pattern) => (
              <PatternCard key={pattern.pattern_name} pattern={pattern} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

function PatternCard({ pattern }: { pattern: any }) {
  const successPercent = pattern.success_rate * 100;
  const avgReturnPercent = pattern.avg_return * 100;

  return (
    <div className="card card-interactive">
      <div className="mb-4 flex items-start justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-primary" />
          <h3 className="font-medium text-sm">{pattern.pattern_name}</h3>
        </div>
        <ConfidenceBadge value={pattern.confidence * 100} />
      </div>

      <p className="mb-4 text-xs text-text-muted line-clamp-2 min-h-[2.5rem]">
        {pattern.description}
      </p>

      <div className="space-y-2 text-xs">
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
        <div className="flex items-center justify-between text-text-muted">
          <span>Samples</span>
          <span className="font-medium">{pattern.sample_count}</span>
        </div>
      </div>

      {pattern.use_cases?.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="flex flex-wrap gap-1">
            {pattern.use_cases.slice(0, 3).map((useCase: string) => (
              <span
                key={useCase}
                className="badge badge-primary"
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
      <span className="flex items-center gap-2 text-text-muted">
        <Icon className="h-3.5 w-3.5" />
        {label}
      </span>
      <span
        className={`font-medium ${
          format === 'percent' && isPositive ? 'text-success' : ''
        } ${format === 'percent' && !isPositive && value !== 0 ? 'text-error' : ''}`}
      >
        {formattedValue}
      </span>
    </div>
  );
}

function ConfidenceBadge({ value }: { value: number }) {
  const getColor = () => {
    if (value >= 80) return 'badge-success';
    if (value >= 50) return 'badge-warning';
    return 'badge-error';
  };

  return (
    <span className={`badge ${getColor()}`}>
      {value.toFixed(0)}%
    </span>
  );
}
