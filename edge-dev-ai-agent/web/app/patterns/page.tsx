/**
 * Patterns Page
 *
 * Display top performing patterns and recommendations.
 */

'use client';

import { usePatterns } from '@/lib/hooks';
import { TrendingUp, TrendingDown, Award, Target } from 'lucide-react';

export default function PatternsPage() {
  const { patterns, isLoading, error } = usePatterns(10);

  if (isLoading) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <div className="mb-4 h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="text-muted-foreground">Loading patterns...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full items-center justify-center">
        <div className="text-center">
          <p className="mb-2 text-lg font-medium text-error">Error loading patterns</p>
          <p className="text-sm text-muted-foreground">{error.message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 overflow-y-auto p-6">
      <div className="mx-auto max-w-6xl">
        <div className="mb-8">
          <h1 className="mb-2 text-2xl font-bold">Pattern Performance</h1>
          <p className="text-muted-foreground">
            Top performing patterns based on historical results
          </p>
        </div>

        {patterns.length === 0 ? (
          <div className="rounded-lg border border-border bg-card p-8 text-center">
            <Award className="mx-auto mb-4 h-12 w-12 text-muted-foreground" />
            <h3 className="mb-2 text-lg font-medium">No patterns tracked yet</h3>
            <p className="text-sm text-muted-foreground">
              Pattern recommendations will appear here as you execute strategies and backtests.
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
  const confidencePercent = pattern.confidence * 100;

  return (
    <div className="rounded-lg border border-border bg-card p-6 transition-colors hover:bg-secondary">
      <div className="mb-4 flex items-start justify-between">
        <h3 className="font-semibold">{pattern.pattern_name}</h3>
        <Badge value={confidencePercent} label="Confidence" />
      </div>

      <p className="mb-4 text-sm text-muted-foreground line-clamp-2">
        {pattern.description}
      </p>

      <div className="space-y-2 text-sm">
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
        <div className="flex items-center justify-between text-muted-foreground">
          <span className="flex items-center gap-2">
            <Award className="h-4 w-4" />
            Samples
          </span>
          <span className="font-medium">{pattern.sample_count}</span>
        </div>
      </div>

      {pattern.use_cases.length > 0 && (
        <div className="mt-4 pt-4 border-t border-border">
          <p className="mb-2 text-xs font-medium text-muted-foreground">Use Cases:</p>
          <div className="flex flex-wrap gap-1">
            {pattern.use_cases.slice(0, 3).map((useCase: string) => (
              <span
                key={useCase}
                className="rounded-full bg-secondary px-2 py-1 text-xs text-muted-foreground"
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
      <span className="flex items-center gap-2 text-muted-foreground">
        <Icon className="h-4 w-4" />
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

function Badge({ value, label }: { value: number; label: string }) {
  const getColor = () => {
    if (value >= 80) return 'bg-success/10 text-success border-success/20';
    if (value >= 50) return 'bg-warning/10 text-warning border-warning/20';
    return 'bg-error/10 text-error border-error/20';
  };

  return (
    <div
      className={`rounded-full border px-2 py-1 text-xs font-medium ${getColor()}`}
    >
      {label}: {value.toFixed(0)}%
    </div>
  );
}
