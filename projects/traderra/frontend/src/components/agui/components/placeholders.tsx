'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import {
  AguiPerformanceChart,
  AguiRiskAnalysis,
  AguiTradeTable,
  AguiProgressTracker,
  AguiComparisonWidget,
  AguiAlertCard,
  AguiRecommendationList
} from '@/types/agui'

// Placeholder components for AGUI types
// These will be enhanced with full implementations later

interface PlaceholderProps {
  onAction?: (action: string, data?: any) => void
  onUpdate?: (data: any) => void
  interactive?: boolean
}

export function AguiPerformanceChartComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiPerformanceChart } & PlaceholderProps) {
  return (
    <div className="p-4 studio-surface rounded-lg border studio-border">
      <h4 className="font-medium studio-text mb-2">{component.title}</h4>
      <div className="h-32 bg-[#161616] rounded flex items-center justify-center">
        <p className="text-sm studio-muted">Chart: {component.chartType}</p>
      </div>
    </div>
  )
}

export function AguiRiskAnalysisComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiRiskAnalysis } & PlaceholderProps) {
  const riskColors = {
    low: 'text-profit',
    medium: 'text-yellow-400',
    high: 'text-orange-400',
    critical: 'text-loss'
  }

  return (
    <div className="p-4 studio-surface rounded-lg border studio-border">
      <div className="flex items-center justify-between mb-3">
        <h4 className="font-medium studio-text">{component.title}</h4>
        <span className={cn('text-sm font-medium', riskColors[component.riskLevel])}>
          {component.riskLevel.toUpperCase()}
        </span>
      </div>
      <div className="space-y-2">
        {component.metrics.map((metric, index) => (
          <div key={index} className="flex justify-between text-sm">
            <span className="studio-muted">{metric.name}</span>
            <span className="font-mono">{metric.value}{metric.unit}</span>
          </div>
        ))}
      </div>
    </div>
  )
}

export function AguiTradeTableComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiTradeTable } & PlaceholderProps) {
  return (
    <div className="p-4 studio-surface rounded-lg border studio-border">
      <h4 className="font-medium studio-text mb-3">{component.title}</h4>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b studio-border">
              <th className="text-left py-2 studio-muted">Symbol</th>
              <th className="text-left py-2 studio-muted">Side</th>
              <th className="text-right py-2 studio-muted">P&L</th>
            </tr>
          </thead>
          <tbody>
            {component.trades.slice(0, component.limit || 5).map((trade, index) => (
              <tr key={index} className="border-b studio-border/50">
                <td className="py-2 font-mono">{trade.symbol}</td>
                <td className="py-2">
                  <span className={cn(
                    'px-2 py-1 rounded text-xs',
                    trade.side === 'long' ? 'bg-profit/20 text-profit' : 'bg-loss/20 text-loss'
                  )}>
                    {trade.side}
                  </span>
                </td>
                <td className={cn(
                  'py-2 text-right font-mono',
                  trade.pnl >= 0 ? 'text-profit' : 'text-loss'
                )}>
                  ${trade.pnl.toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export function AguiProgressTrackerComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiProgressTracker } & PlaceholderProps) {
  return (
    <div className="p-4 studio-surface rounded-lg border studio-border">
      <h4 className="font-medium studio-text mb-3">{component.title}</h4>
      <div className="space-y-3">
        {component.goals.map((goal, index) => {
          const progress = (goal.current / goal.target) * 100
          return (
            <div key={index}>
              <div className="flex justify-between text-sm mb-1">
                <span className="studio-text">{goal.name}</span>
                <span className="font-mono studio-muted">
                  {goal.current}/{goal.target} {goal.unit}
                </span>
              </div>
              <div className="h-2 bg-[#161616] rounded-full overflow-hidden">
                <div
                  className="h-full bg-primary transition-all duration-500"
                  style={{ width: `${Math.min(progress, 100)}%` }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}

export function AguiComparisonWidgetComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiComparisonWidget } & PlaceholderProps) {
  return (
    <div className="p-4 studio-surface rounded-lg border studio-border">
      <h4 className="font-medium studio-text mb-3">{component.title}</h4>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {component.periods.map((period, index) => (
          <div key={index} className="space-y-2">
            <h5 className="text-sm font-medium studio-muted">{period.name}</h5>
            {Object.entries(period.metrics).map(([key, value]) => (
              <div key={key} className="flex justify-between text-sm">
                <span className="studio-muted">{key}</span>
                <span className="font-mono">{value}</span>
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

export function AguiAlertCardComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiAlertCard } & PlaceholderProps) {
  const severityStyles = {
    info: 'border-blue-400/20 bg-blue-400/5 text-blue-400',
    warning: 'border-yellow-400/20 bg-yellow-400/5 text-yellow-400',
    error: 'border-red-400/20 bg-red-400/5 text-red-400',
    success: 'border-green-400/20 bg-green-400/5 text-green-400'
  }

  return (
    <div className={cn(
      'p-4 rounded-lg border',
      severityStyles[component.severity]
    )}>
      <h4 className="font-medium mb-2">{component.title}</h4>
      <p className="text-sm opacity-90">{component.message}</p>
      {component.action && (
        <button
          onClick={() => onAction?.(component.action!.action)}
          className="mt-3 px-3 py-1 text-xs rounded border border-current/30 hover:bg-current/10 transition-colors"
        >
          {component.action.label}
        </button>
      )}
    </div>
  )
}

export function AguiRecommendationListComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: { component: AguiRecommendationList } & PlaceholderProps) {
  const priorityColors = {
    high: 'text-red-400',
    medium: 'text-yellow-400',
    low: 'text-green-400'
  }

  return (
    <div className="p-4 studio-surface rounded-lg border studio-border">
      <h4 className="font-medium studio-text mb-3">{component.title}</h4>
      <div className="space-y-3">
        {component.recommendations.slice(0, component.maxItems || 5).map((rec, index) => (
          <div key={index} className="flex items-start space-x-3">
            <div className={cn(
              'w-2 h-2 rounded-full mt-2 flex-shrink-0',
              priorityColors[rec.priority]
            )} />
            <div className="flex-1">
              <p className="text-sm studio-text">{rec.text}</p>
              <div className="flex items-center space-x-2 mt-1">
                <span className={cn('text-xs', priorityColors[rec.priority])}>
                  {rec.priority.toUpperCase()}
                </span>
                <span className="text-xs studio-muted">{rec.category}</span>
                {rec.effort && (
                  <span className="text-xs studio-muted">• {rec.effort}</span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}