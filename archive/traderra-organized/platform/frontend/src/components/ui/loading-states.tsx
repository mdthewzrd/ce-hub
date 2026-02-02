'use client'

import { ReactNode } from 'react'
import { Loader2, RefreshCw, Brain, Globe, Activity } from 'lucide-react'
import { cn } from '@/lib/utils'

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg'
  className?: string
}

export function LoadingSpinner({ size = 'md', className }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8'
  }

  return (
    <Loader2 className={cn(
      'animate-spin text-primary',
      sizeClasses[size],
      className
    )} />
  )
}

interface LoadingOverlayProps {
  isLoading: boolean
  children: ReactNode
  loadingText?: string
  className?: string
}

export function LoadingOverlay({
  isLoading,
  children,
  loadingText = 'Loading...',
  className
}: LoadingOverlayProps) {
  return (
    <div className={cn('relative', className)}>
      {children}
      {isLoading && (
        <div className="absolute inset-0 bg-[#0a0a0a]/80 backdrop-blur-sm flex items-center justify-center rounded-lg z-10">
          <div className="flex flex-col items-center space-y-3">
            <LoadingSpinner size="lg" />
            <p className="text-sm studio-text font-medium">{loadingText}</p>
          </div>
        </div>
      )}
    </div>
  )
}

interface SkeletonProps {
  className?: string
  variant?: 'text' | 'circular' | 'rectangular'
}

export function Skeleton({ className, variant = 'rectangular' }: SkeletonProps) {
  const baseClasses = 'animate-pulse bg-[#1a1a1a]'

  const variantClasses = {
    text: 'h-4 rounded',
    circular: 'rounded-full',
    rectangular: 'rounded'
  }

  return (
    <div className={cn(
      baseClasses,
      variantClasses[variant],
      className
    )} />
  )
}

interface LoadingCardProps {
  title?: string
  description?: string
  lines?: number
}

export function LoadingCard({
  title = 'Loading content...',
  description,
  lines = 3
}: LoadingCardProps) {
  return (
    <div className="studio-surface rounded-lg p-6 border border-[#1a1a1a]">
      <div className="flex items-center space-x-3 mb-4">
        <LoadingSpinner />
        <div>
          <h3 className="text-sm font-medium studio-text">{title}</h3>
          {description && (
            <p className="text-xs studio-muted">{description}</p>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {Array.from({ length: lines }).map((_, i) => (
          <Skeleton
            key={i}
            className={cn(
              'h-3',
              i === lines - 1 ? 'w-2/3' : 'w-full'
            )}
            variant="text"
          />
        ))}
      </div>
    </div>
  )
}

interface ProgressBarProps {
  progress: number
  label?: string
  showPercentage?: boolean
  className?: string
}

export function ProgressBar({
  progress,
  label,
  showPercentage = true,
  className
}: ProgressBarProps) {
  const clampedProgress = Math.max(0, Math.min(100, progress))

  return (
    <div className={cn('space-y-2', className)}>
      {(label || showPercentage) && (
        <div className="flex justify-between items-center">
          {label && (
            <span className="text-sm font-medium studio-text">{label}</span>
          )}
          {showPercentage && (
            <span className="text-xs studio-muted">{Math.round(clampedProgress)}%</span>
          )}
        </div>
      )}

      <div className="w-full bg-[#1a1a1a] rounded-full h-2">
        <div
          className="bg-primary h-2 rounded-full transition-all duration-300 ease-out"
          style={{ width: `${clampedProgress}%` }}
        />
      </div>
    </div>
  )
}

interface EmptyStateProps {
  icon?: ReactNode
  title: string
  description?: string
  action?: {
    label: string
    onClick: () => void
  }
  className?: string
}

export function EmptyState({
  icon,
  title,
  description,
  action,
  className
}: EmptyStateProps) {
  return (
    <div className={cn(
      'flex flex-col items-center justify-center p-8 text-center',
      className
    )}>
      {icon && (
        <div className="mb-4 text-[#404040]">
          {icon}
        </div>
      )}

      <h3 className="text-lg font-medium studio-text mb-2">{title}</h3>

      {description && (
        <p className="text-sm studio-muted mb-4 max-w-sm">{description}</p>
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
  )
}

interface ServiceLoadingStateProps {
  service: 'renata' | 'archon' | 'playwright' | 'general'
  message?: string
  progress?: number
}

export function ServiceLoadingState({
  service,
  message,
  progress
}: ServiceLoadingStateProps) {
  const getIcon = () => {
    switch (service) {
      case 'renata':
        return <Brain className="h-8 w-8 text-primary" />
      case 'archon':
        return <Activity className="h-8 w-8 text-primary" />
      case 'playwright':
        return <Globe className="h-8 w-8 text-primary" />
      default:
        return <LoadingSpinner size="lg" />
    }
  }

  const getDefaultMessage = () => {
    switch (service) {
      case 'renata':
        return 'Renata is thinking...'
      case 'archon':
        return 'Searching knowledge graph...'
      case 'playwright':
        return 'Automating browser actions...'
      default:
        return 'Processing request...'
    }
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="relative">
        {getIcon()}
        <div className="absolute -bottom-1 -right-1">
          <LoadingSpinner size="sm" className="text-primary/60" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <p className="text-sm font-medium studio-text">
          {message || getDefaultMessage()}
        </p>

        {progress !== undefined && (
          <div className="w-48">
            <ProgressBar progress={progress} showPercentage />
          </div>
        )}
      </div>
    </div>
  )
}

// Hook for managing loading states
export function useLoadingState(initialState = false) {
  const [isLoading, setIsLoading] = useState(initialState)

  const withLoading = async <T,>(asyncFunction: () => Promise<T>): Promise<T> => {
    setIsLoading(true)
    try {
      const result = await asyncFunction()
      return result
    } finally {
      setIsLoading(false)
    }
  }

  return {
    isLoading,
    setIsLoading,
    withLoading
  }
}

// Import React hook
import { useState } from 'react'