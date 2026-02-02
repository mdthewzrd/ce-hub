'use client'

import React, { useState } from 'react'
import { Lightbulb, Target, TrendingUp, AlertTriangle, ChevronDown, ChevronUp } from 'lucide-react'
import { cn } from '@/lib/utils'
import { AguiInsightPanel } from '@/types/agui'

interface AguiInsightPanelProps {
  component: AguiInsightPanel
  onAction?: (action: string, data?: any) => void
  onUpdate?: (data: any) => void
  interactive?: boolean
}

export function AguiInsightPanelComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: AguiInsightPanelProps) {
  const { title, insights, modeContext } = component
  const [expandedInsights, setExpandedInsights] = useState<string[]>([])
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null)

  const categoryIcons = {
    strength: TrendingUp,
    weakness: AlertTriangle,
    opportunity: Target,
    pattern: Lightbulb
  }

  const categoryColors = {
    strength: 'text-profit border-profit/20 bg-profit/5',
    weakness: 'text-loss border-loss/20 bg-loss/5',
    opportunity: 'text-blue-400 border-blue-400/20 bg-blue-400/5',
    pattern: 'text-yellow-400 border-yellow-400/20 bg-yellow-400/5'
  }

  const modeStyles = {
    analyst: {
      header: 'border-red-400/30 bg-red-400/5',
      accent: 'text-red-400'
    },
    coach: {
      header: 'border-blue-400/30 bg-blue-400/5',
      accent: 'text-blue-400'
    },
    mentor: {
      header: 'border-green-400/30 bg-green-400/5',
      accent: 'text-green-400'
    }
  }

  const toggleInsightExpansion = (insightIndex: number) => {
    const key = `${component.id}-${insightIndex}`
    setExpandedInsights(prev =>
      prev.includes(key)
        ? prev.filter(id => id !== key)
        : [...prev, key]
    )
  }

  const filterInsightsByCategory = () => {
    if (!selectedCategory) return insights
    return insights.filter(insight => insight.category === selectedCategory)
  }

  const categories = [...new Set(insights.map(insight => insight.category))]
  const filteredInsights = filterInsightsByCategory()

  const handleInsightClick = (insight: typeof insights[0], index: number) => {
    if (interactive && onAction) {
      onAction('insight-clicked', {
        insight,
        index,
        category: insight.category,
        confidence: insight.confidence
      })
    }
  }

  return (
    <div className="insight-panel studio-surface rounded-lg border studio-border shadow-studio-subtle">
      {/* Header */}
      <div className={cn(
        'p-4 rounded-t-lg border-b studio-border',
        modeStyles[modeContext].header
      )}>
        <div className="flex items-center justify-between">
          <h3 className="font-semibold studio-text">{title}</h3>
          <div className="flex items-center space-x-2">
            <span className={cn(
              'text-xs font-medium px-2 py-1 rounded-full',
              modeStyles[modeContext].accent,
              'bg-current/10'
            )}>
              {modeContext.charAt(0).toUpperCase() + modeContext.slice(1)} Mode
            </span>
            <span className="text-xs studio-muted">
              {insights.length} insight{insights.length !== 1 ? 's' : ''}
            </span>
          </div>
        </div>

        {/* Category Filters */}
        {categories.length > 1 && (
          <div className="flex flex-wrap gap-2 mt-3">
            <button
              onClick={() => setSelectedCategory(null)}
              className={cn(
                'px-3 py-1 text-xs rounded-full transition-all duration-200',
                !selectedCategory
                  ? 'bg-primary text-white'
                  : 'studio-surface studio-border hover:bg-[#161616]'
              )}
            >
              All ({insights.length})
            </button>
            {categories.map(category => {
              const count = insights.filter(i => i.category === category).length
              const Icon = categoryIcons[category as keyof typeof categoryIcons]
              return (
                <button
                  key={category}
                  onClick={() => setSelectedCategory(category)}
                  className={cn(
                    'flex items-center space-x-1 px-3 py-1 text-xs rounded-full transition-all duration-200',
                    selectedCategory === category
                      ? categoryColors[category as keyof typeof categoryColors]
                      : 'studio-surface studio-border hover:bg-[#161616]'
                  )}
                >
                  {Icon && <Icon className="h-3 w-3" />}
                  <span>{category} ({count})</span>
                </button>
              )
            })}
          </div>
        )}
      </div>

      {/* Insights List */}
      <div className="p-4 space-y-3">
        {filteredInsights.map((insight, index) => {
          const isExpanded = expandedInsights.includes(`${component.id}-${index}`)
          const Icon = categoryIcons[insight.category as keyof typeof categoryIcons] || Lightbulb
          const originalIndex = insights.indexOf(insight)

          return (
            <div
              key={`${insight.category}-${index}`}
              className={cn(
                'insight-item p-3 rounded-lg border transition-all duration-200',
                categoryColors[insight.category as keyof typeof categoryColors],
                interactive && 'cursor-pointer hover:shadow-interactive'
              )}
              onClick={() => handleInsightClick(insight, originalIndex)}
            >
              {/* Insight Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-start space-x-3 flex-1">
                  <Icon className="h-4 w-4 mt-0.5 flex-shrink-0" />
                  <div className="flex-1">
                    <p className="text-sm font-medium leading-relaxed">
                      {insight.text}
                    </p>

                    {/* Confidence Indicator */}
                    <div className="flex items-center space-x-2 mt-2">
                      <div className="flex items-center space-x-1">
                        <span className="text-xs studio-muted">Confidence:</span>
                        <div className="h-1.5 w-16 bg-gray-700 rounded-full overflow-hidden">
                          <div
                            className={cn(
                              'h-full transition-all duration-500',
                              insight.confidence >= 0.8 ? 'bg-profit' :
                              insight.confidence >= 0.6 ? 'bg-yellow-400' :
                              'bg-loss'
                            )}
                            style={{ width: `${insight.confidence * 100}%` }}
                          />
                        </div>
                        <span className="text-xs font-mono">
                          {(insight.confidence * 100).toFixed(0)}%
                        </span>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Expand/Collapse Button */}
                {insight.evidence && insight.evidence.length > 0 && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      toggleInsightExpansion(originalIndex)
                    }}
                    className="p-1 rounded hover:bg-black/20 transition-colors"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                )}
              </div>

              {/* Evidence (Expandable) */}
              {isExpanded && insight.evidence && insight.evidence.length > 0 && (
                <div className="mt-3 pt-3 border-t border-current/20">
                  <p className="text-xs studio-muted mb-2 font-medium">Supporting Evidence:</p>
                  <ul className="space-y-1">
                    {insight.evidence.map((evidence, evidenceIndex) => (
                      <li key={evidenceIndex} className="text-xs studio-muted flex items-start space-x-2">
                        <span className="text-current mt-1 opacity-60">•</span>
                        <span>{evidence}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}

        {filteredInsights.length === 0 && (
          <div className="text-center py-8">
            <Lightbulb className="h-8 w-8 studio-muted mx-auto mb-2" />
            <p className="text-sm studio-muted">
              {selectedCategory
                ? `No ${selectedCategory} insights available`
                : 'No insights available'
              }
            </p>
          </div>
        )}
      </div>

      {/* Mode-specific Footer */}
      <div className={cn(
        'px-4 py-2 rounded-b-lg border-t studio-border text-xs studio-muted',
        modeStyles[modeContext].header
      )}>
        {modeContext === 'analyst' && 'Data-driven insights based on quantitative analysis'}
        {modeContext === 'coach' && 'Actionable guidance for performance improvement'}
        {modeContext === 'mentor' && 'Reflective observations for long-term growth'}
      </div>
    </div>
  )
}