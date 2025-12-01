'use client';

import React from 'react';
import { Loader2, Activity, TrendingUp, BarChart3, Database, Brain } from 'lucide-react';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className = ''
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12'
  };

  return (
    <Loader2
      className={`animate-spin text-primary ${sizeClasses[size]} ${className}`}
    />
  );
};

interface LoadingCardProps {
  title?: string;
  description?: string;
  icon?: React.ComponentType<{ className?: string }>;
  progress?: number;
  size?: 'sm' | 'md' | 'lg';
}

export const LoadingCard: React.FC<LoadingCardProps> = ({
  title = 'Loading...',
  description,
  icon: Icon = Activity,
  progress,
  size = 'md'
}) => {
  const sizeClasses = {
    sm: 'p-4',
    md: 'p-6',
    lg: 'p-8'
  };

  const iconSizes = {
    sm: 'h-6 w-6',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <div className={`studio-card ${sizeClasses[size]} text-center`}>
      <div className="flex flex-col items-center space-y-4">
        <div className="relative">
          <Icon className={`${iconSizes[size]} text-primary animate-pulse`} />
          <LoadingSpinner
            size="sm"
            className="absolute -top-1 -right-1"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium studio-text">{title}</h3>
          {description && (
            <p className="text-sm studio-muted">{description}</p>
          )}
        </div>

        {progress !== undefined && (
          <div className="w-full space-y-2">
            <div className="flex justify-between text-sm studio-muted">
              <span>Progress</span>
              <span className="number-font">{Math.max(0, Math.min(100, progress))}%</span>
            </div>
            <div className="w-full studio-surface rounded-full h-2">
              <div
                className="bg-primary h-2 rounded-full transition-all duration-300"
                style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

interface SkeletonProps {
  className?: string;
  variant?: 'text' | 'rectangular' | 'circular';
  width?: string;
  height?: string;
}

export const Skeleton: React.FC<SkeletonProps> = ({
  className = '',
  variant = 'rectangular',
  width,
  height
}) => {
  const variantClasses = {
    text: 'h-4 rounded',
    rectangular: 'rounded-lg',
    circular: 'rounded-full'
  };

  const style = {
    width: width || 'auto',
    height: height || (variant === 'text' ? '1rem' : '4rem')
  };

  return (
    <div
      className={`animate-pulse studio-surface ${variantClasses[variant]} ${className}`}
      style={style}
    />
  );
};

interface TableSkeletonProps {
  rows?: number;
  columns?: number;
  showHeader?: boolean;
}

export const TableSkeleton: React.FC<TableSkeletonProps> = ({
  rows = 5,
  columns = 4,
  showHeader = true
}) => {
  return (
    <div className="space-y-4">
      {showHeader && (
        <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
          {Array.from({ length: columns }).map((_, i) => (
            <Skeleton key={i} variant="text" height="1.5rem" />
          ))}
        </div>
      )}

      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div
          key={rowIndex}
          className="grid gap-4"
          style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}
        >
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} variant="text" />
          ))}
        </div>
      ))}
    </div>
  );
};

interface ChartSkeletonProps {
  height?: string;
}

export const ChartSkeleton: React.FC<ChartSkeletonProps> = ({
  height = '400px'
}) => {
  return (
    <div className="studio-card p-6">
      <div className="space-y-4">
        {/* Chart header */}
        <div className="flex items-center justify-between">
          <Skeleton variant="text" width="200px" height="1.5rem" />
          <Skeleton variant="text" width="100px" height="1rem" />
        </div>

        {/* Chart area */}
        <div
          className="studio-surface rounded-lg animate-pulse flex items-center justify-center"
          style={{ height }}
        >
          <BarChart3 className="h-16 w-16 text-primary opacity-30" />
        </div>

        {/* Chart legend */}
        <div className="flex justify-center space-x-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="flex items-center space-x-2">
              <Skeleton variant="rectangular" width="12px" height="12px" />
              <Skeleton variant="text" width="80px" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

interface MetricSkeletonProps {
  count?: number;
}

export const MetricSkeleton: React.FC<MetricSkeletonProps> = ({
  count = 4
}) => {
  return (
    <div className="metrics-grid">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="metric-tile">
          <div className="flex items-center justify-between mb-2">
            <Skeleton variant="circular" width="20px" height="20px" />
            <Skeleton variant="text" width="60px" height="1.5rem" />
          </div>
          <Skeleton variant="text" width="80px" height="1rem" />
          <Skeleton variant="text" width="100%" height="0.75rem" className="mt-1" />
        </div>
      ))}
    </div>
  );
};

interface LoadingStateProps {
  type: 'scanning' | 'backtesting' | 'formatting' | 'loading' | 'processing';
  message?: string;
  progress?: number;
  details?: string[];
}

export const LoadingState: React.FC<LoadingStateProps> = ({
  type,
  message,
  progress,
  details = []
}) => {
  const getIcon = () => {
    switch (type) {
      case 'scanning':
        return BarChart3;
      case 'backtesting':
        return TrendingUp;
      case 'formatting':
        return Database;
      case 'processing':
        return Brain;
      default:
        return Activity;
    }
  };

  const getDefaultMessage = () => {
    switch (type) {
      case 'scanning':
        return 'Scanning market universe...';
      case 'backtesting':
        return 'Running backtest analysis...';
      case 'formatting':
        return 'Formatting strategy data...';
      case 'processing':
        return 'Processing request...';
      default:
        return 'Loading...';
    }
  };

  const Icon = getIcon();

  return (
    <div className="studio-card p-8 text-center">
      <div className="flex flex-col items-center space-y-6">
        <div className="relative">
          <Icon className="h-12 w-12 text-primary animate-pulse" />
          <LoadingSpinner
            size="sm"
            className="absolute -top-1 -right-1"
          />
        </div>

        <div className="space-y-2">
          <h3 className="text-xl font-medium studio-text">
            {message || getDefaultMessage()}
          </h3>

          {progress !== undefined && (
            <div className="w-64 space-y-2">
              <div className="flex justify-between text-sm studio-muted">
                <span>Progress</span>
                <span className="number-font">{Math.max(0, Math.min(100, progress))}%</span>
              </div>
              <div className="w-full studio-surface rounded-full h-2">
                <div
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${Math.max(0, Math.min(100, progress))}%` }}
                />
              </div>
            </div>
          )}
        </div>

        {details.length > 0 && (
          <div className="space-y-2 text-sm studio-muted max-w-md">
            {details.map((detail, index) => (
              <div key={index} className="flex items-center space-x-2">
                <div className="w-1 h-1 bg-primary rounded-full" />
                <span>{detail}</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

// Error state component
interface ErrorStateProps {
  title?: string;
  message?: string;
  action?: {
    label: string;
    onClick: () => void;
  };
  details?: string;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Something went wrong',
  message = 'An unexpected error occurred. Please try again.',
  action,
  details
}) => {
  return (
    <div className="studio-card p-8 text-center">
      <div className="flex flex-col items-center space-y-4">
        <div className="p-3 rounded-full bg-red-500/10">
          <Activity className="h-8 w-8 text-red-500" />
        </div>

        <div className="space-y-2">
          <h3 className="text-lg font-medium studio-text">{title}</h3>
          <p className="text-sm studio-muted max-w-md">{message}</p>
        </div>

        {details && (
          <details className="text-left w-full max-w-md">
            <summary className="cursor-pointer text-sm studio-muted">
              Show details
            </summary>
            <pre className="mt-2 text-xs studio-muted font-mono whitespace-pre-wrap bg-studio-surface p-3 rounded border studio-border">
              {details}
            </pre>
          </details>
        )}

        {action && (
          <button
            onClick={action.onClick}
            className="btn-primary"
          >
            {action.label}
          </button>
        )}
      </div>
    </div>
  );
};

export default {
  LoadingSpinner,
  LoadingCard,
  Skeleton,
  TableSkeleton,
  ChartSkeleton,
  MetricSkeleton,
  LoadingState,
  ErrorState
};