'use client'

import React from 'react'
import { TrendingUp, TrendingDown, Minus, MoreHorizontal } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AguiMetricCard } from '@/types/agui'

interface AguiMetricCardProps {
  component: AguiMetricCard
  onAction?: (action: string, data?: any) => void
  onUpdate?: (data: any) => void
  interactive?: boolean
}

export function AguiMetricCardComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: AguiMetricCardProps) {
  const {
    title,
    value,
    subtitle,
    trend,
    color = 'neutral',
    comparison,
    sparklineData
  } = component

  const colorClasses = {
    profit: 'text-profit border-profit/20 bg-profit/5',
    loss: 'text-loss border-loss/20 bg-loss/5',
    neutral: 'studio-text studio-border studio-surface',
    warning: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
  }

  const trendIcon = trend === 'up' ? TrendingUp : trend === 'down' ? TrendingDown : Minus
  const TrendIcon = trendIcon

  const formatValue = (val: string | number) => {
    if (typeof val === 'number') {
      // Format numbers with appropriate precision
      if (Math.abs(val) >= 1000000) {
        return `${(val / 1000000).toFixed(1)}M`
      } else if (Math.abs(val) >= 1000) {
        return `${(val / 1000).toFixed(1)}K`
      } else if (val % 1 === 0) {
        return val.toString()
      } else {
        return val.toFixed(2)
      }
    }
    return val.toString()
  }

  const handleCardClick = () => {
    if (interactive && onAction) {
      onAction('metric-clicked', {
        title,
        value,
        trend,
        color
      })
    }
  }

  const handleMenuClick = (e: React.MouseEvent) => {
    e.stopPropagation()
    if (interactive && onAction) {
      onAction('menu-clicked', { componentId: component.id })
    }
  }

  return (
    <div
      className={cn(
        'metric-card p-4 rounded-lg border transition-all duration-200',
        colorClasses[color],
        interactive && 'cursor-pointer hover:shadow-interactive hover:scale-[1.02]',
        'shadow-studio-subtle'
      )}
      onClick={handleCardClick}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-sm font-medium studio-muted uppercase tracking-wide">
          {title}
        </h3>
        {interactive && (
          <button
            onClick={handleMenuClick}
            className="p-1 rounded hover:bg-black/20 transition-colors"
          >
            <MoreHorizontal className="h-3 w-3 studio-muted" />
          </button>
        )}
      </div>

      {/* Main Value */}
      <div className="flex items-center space-x-2 mb-1">
        <span className="text-2xl font-bold font-mono">
          {formatValue(value)}
        </span>
        {trend && (
          <TrendIcon
            className={cn(
              'h-5 w-5',
              trend === 'up' && 'text-profit',
              trend === 'down' && 'text-loss',
              trend === 'neutral' && 'studio-muted'
            )}
          />
        )}
      </div>

      {/* Subtitle */}
      {subtitle && (
        <p className="text-xs studio-muted mb-2">{subtitle}</p>
      )}

      {/* Comparison */}
      {comparison && (
        <p className="text-xs studio-muted">{comparison}</p>
      )}

      {/* Mini Sparkline */}
      {sparklineData && sparklineData.length > 0 && (
        <div className="mt-3">
          <div className="flex items-end h-8 space-x-0.5">
            {sparklineData.slice(-20).map((point, index) => {
              const height = Math.max(2, (point / Math.max(...sparklineData)) * 100)
              return (
                <div
                  key={index}
                  className={cn(
                    'w-1 rounded-t transition-all duration-200',
                    color === 'profit' && 'bg-profit/60',
                    color === 'loss' && 'bg-loss/60',
                    color === 'neutral' && 'bg-gray-400/60',
                    color === 'warning' && 'bg-yellow-400/60'
                  )}
                  style={{ height: `${height}%` }}
                />
              )
            })}
          </div>
        </div>
      )}

      {/* Interactive Overlay */}
      {interactive && (
        <div className="absolute inset-0 rounded-lg border-2 border-transparent hover:border-primary/30 pointer-events-none transition-colors duration-200" />
      )}
    </div>
  )
}

/**
 * Grid layout for multiple metric cards
 */
export function AguiMetricCardGrid({
  cards,
  onAction,
  onUpdate,
  interactive = true,
  columns = 'auto'
}: {
  cards: AguiMetricCard[]
  onAction?: (action: string, data?: any) => void
  onUpdate?: (id: string, data: any) => void
  interactive?: boolean
  columns?: 'auto' | 1 | 2 | 3 | 4
}) {
  const gridClasses = {
    auto: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4',
    1: 'grid-cols-1',
    2: 'grid-cols-1 sm:grid-cols-2',
    3: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3',
    4: 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
  }

  return (
    <div className={cn('grid gap-4', gridClasses[columns])}>
      {cards.map((card) => (
        <AguiMetricCardComponent
          key={card.id}
          component={card}
          onAction={onAction}
          onUpdate={(data) => onUpdate?.(card.id, data)}
          interactive={interactive}
        />
      ))}
    </div>
  )
}