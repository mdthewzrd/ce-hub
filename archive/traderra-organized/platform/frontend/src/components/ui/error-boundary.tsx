'use client'

import React, { Component, ErrorInfo, ReactNode } from 'react'
import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react'

interface Props {
  children: ReactNode
  fallback?: ReactNode
  onError?: (error: Error, errorInfo: ErrorInfo) => void
}

interface State {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({ error, errorInfo })

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }

    // Call custom error handler if provided
    this.props.onError?.(error, errorInfo)

    // In production, you might want to send this to an error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo })
  }

  handleRetry = () => {
    this.setState({ hasError: false, error: undefined, errorInfo: undefined })
  }

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center studio-bg p-4">
          <div className="max-w-md w-full text-center">
            {/* Error Icon */}
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-red-900/20 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-8 w-8 text-red-400" />
              </div>
            </div>

            {/* Error Message */}
            <h1 className="text-xl font-semibold studio-text mb-2">
              Something went wrong
            </h1>
            <p className="text-sm studio-muted mb-6">
              We encountered an unexpected error. This has been logged and we'll look into it.
            </p>

            {/* Error Details (Development Only) */}
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mb-6 p-4 bg-red-900/10 border border-red-900/30 rounded-lg text-left">
                <h3 className="text-sm font-medium text-red-400 mb-2 flex items-center">
                  <Bug className="h-4 w-4 mr-2" />
                  Error Details (Development)
                </h3>
                <div className="text-xs font-mono text-red-300 overflow-auto max-h-32">
                  <div className="font-bold mb-1">{this.state.error.name}:</div>
                  <div className="mb-2">{this.state.error.message}</div>
                  {this.state.error.stack && (
                    <div className="text-red-200/60">
                      {this.state.error.stack.split('\n').slice(0, 5).join('\n')}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="space-y-3">
              <button
                onClick={this.handleRetry}
                className="w-full btn-primary flex items-center justify-center space-x-2"
              >
                <RefreshCw className="h-4 w-4" />
                <span>Try Again</span>
              </button>

              <button
                onClick={() => window.location.href = '/'}
                className="w-full btn-ghost flex items-center justify-center space-x-2"
              >
                <Home className="h-4 w-4" />
                <span>Go Home</span>
              </button>
            </div>

            {/* Report Issue */}
            <div className="mt-6 pt-6 border-t border-[#1a1a1a]">
              <p className="text-xs studio-muted">
                If this problem persists, please{' '}
                <a
                  href="mailto:support@traderra.com"
                  className="text-primary hover:text-primary/80 transition-colors"
                >
                  contact support
                </a>
                .
              </p>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Higher-order component for easier usage
export function withErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  errorBoundaryProps?: Omit<Props, 'children'>
) {
  const WrappedComponent = (props: P) => (
    <ErrorBoundary {...errorBoundaryProps}>
      <Component {...props} />
    </ErrorBoundary>
  )

  WrappedComponent.displayName = `withErrorBoundary(${Component.displayName || Component.name})`

  return WrappedComponent
}

// Simpler error boundary for specific components
export function ComponentErrorBoundary({
  children,
  componentName = 'Component'
}: {
  children: ReactNode
  componentName?: string
}) {
  return (
    <ErrorBoundary
      fallback={
        <div className="p-4 border border-red-900/30 bg-red-900/10 rounded-lg">
          <div className="flex items-center space-x-2 text-red-400 mb-2">
            <AlertTriangle className="h-4 w-4" />
            <span className="text-sm font-medium">{componentName} Error</span>
          </div>
          <p className="text-xs studio-muted">
            This component encountered an error and couldn't render properly.
          </p>
          <button
            onClick={() => window.location.reload()}
            className="mt-3 text-xs text-primary hover:text-primary/80 transition-colors"
          >
            Refresh page
          </button>
        </div>
      }
    >
      {children}
    </ErrorBoundary>
  )
}