'use client';

import { XCircle, RefreshCw, X } from 'lucide-react';

interface ErrorMessageProps {
  title?: string;
  message: string;
  onRetry?: () => void;
  onDismiss?: () => void;
  retryText?: string;
}

export function ErrorMessage({
  title = 'Error',
  message,
  onRetry,
  onDismiss,
  retryText = 'Try Again',
}: ErrorMessageProps) {
  return (
    <div className="rounded-xl border border-red-500/30 bg-gradient-to-br from-red-500/10 to-red-500/5 p-6 relative overflow-hidden">
      <div className="absolute inset-0 bg-red-500/5 animate-pulse" />
      <div className="relative">
        <div className="flex items-start gap-4">
          <div className="flex-shrink-0">
            <div className="p-2 rounded-lg bg-red-500/20 border border-red-500/30">
              <XCircle className="h-5 w-5 text-red-500" />
            </div>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-bold text-red-500 mb-2">{title}</h3>
            <p className="text-sm text-text-muted mb-4">{message}</p>
            <div className="flex gap-3">
              {onRetry && (
                <button
                  onClick={onRetry}
                  className="btn btn-secondary gap-2 text-sm"
                >
                  <RefreshCw className="h-4 w-4" />
                  {retryText}
                </button>
              )}
              {onDismiss && (
                <button
                  onClick={onDismiss}
                  className="text-sm text-text-muted hover:text-text-primary transition-colors duration-200"
                >
                  Dismiss
                </button>
              )}
            </div>
          </div>
          {onDismiss && (
            <button
              onClick={onDismiss}
              className="flex-shrink-0 text-text-muted hover:text-red-500 transition-colors duration-200"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
