'use client';

import React from 'react';
import { AlertTriangle, RefreshCw, Bug, AlertCircle } from 'lucide-react';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: React.ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: React.ReactNode;
  fallback?: React.ComponentType<{ error: Error; retry: () => void }>;
  onError?: (error: Error, errorInfo: React.ErrorInfo) => void;
}

class ErrorBoundary extends React.Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null
    };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return {
      hasError: true,
      error,
      errorInfo: null
    };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    this.setState({
      error,
      errorInfo
    });

    // Log to console for development
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you could send this to an error reporting service
    if (process.env.NODE_ENV === 'production') {
      // Example: Send to error tracking service
      // errorTrackingService.captureException(error, { extra: errorInfo });
    }
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null
    });
  };

  render() {
    if (this.state.hasError) {
      // Use custom fallback if provided
      if (this.props.fallback) {
        const FallbackComponent = this.props.fallback;
        return <FallbackComponent error={this.state.error!} retry={this.handleRetry} />;
      }

      // Default error UI with Traderra styling
      return (
        <div className="studio-card p-6 m-4">
          <div className="flex items-center gap-3 mb-4">
            <AlertTriangle className="h-6 w-6 loss-text" />
            <h2 className="text-lg font-medium studio-text">Something went wrong</h2>
          </div>

          <div className="space-y-4">
            <div className="p-4 studio-surface border studio-border rounded-lg">
              <div className="flex items-start gap-3">
                <Bug className="h-5 w-5 loss-text mt-0.5 flex-shrink-0" />
                <div className="flex-1">
                  <div className="font-medium studio-text mb-1">Error Details</div>
                  <div className="text-sm studio-muted font-mono break-all">
                    {this.state.error?.message || 'Unknown error occurred'}
                  </div>
                </div>
              </div>
            </div>

            {/* Development mode: Show error stack */}
            {process.env.NODE_ENV === 'development' && this.state.error?.stack && (
              <details className="p-4 studio-surface border studio-border rounded-lg">
                <summary className="cursor-pointer flex items-center gap-2 font-medium studio-text">
                  <AlertCircle className="h-4 w-4" />
                  Stack Trace (Development)
                </summary>
                <pre className="mt-3 text-xs studio-muted font-mono whitespace-pre-wrap overflow-auto max-h-40">
                  {this.state.error.stack}
                </pre>
              </details>
            )}

            <div className="flex gap-3">
              <button
                onClick={this.handleRetry}
                className="btn-primary flex items-center gap-2"
              >
                <RefreshCw className="h-4 w-4" />
                Try Again
              </button>

              <button
                onClick={() => window.location.reload()}
                className="btn-secondary"
              >
                Reload Page
              </button>
            </div>

            <div className="text-sm studio-muted">
              If this problem persists, please check the browser console for more details
              or contact support if you need assistance.
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<ErrorBoundaryProps, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  );

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`;
  return WrappedComponent;
}

// Async error handler for promises and async operations
export class AsyncErrorHandler {
  static handle(error: Error, context?: string) {
    console.error(`Async error ${context ? `in ${context}` : ''}:`, error);

    // In production, send to error tracking
    if (process.env.NODE_ENV === 'production') {
      // errorTrackingService.captureException(error, { extra: { context } });
    }

    // You could also dispatch to a global error state or show a toast
    return error;
  }

  static async wrapAsync<T>(
    asyncFn: () => Promise<T>,
    context?: string,
    fallback?: T
  ): Promise<T | undefined> {
    try {
      return await asyncFn();
    } catch (error) {
      this.handle(error as Error, context);
      return fallback;
    }
  }
}

export default ErrorBoundary;