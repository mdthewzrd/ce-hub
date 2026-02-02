'use client'

import React from 'react'
import { cn } from '@/lib/utils'
import { AguiActionButtons } from '@/types/agui'
import * as Icons from 'lucide-react'

interface AguiActionButtonsProps {
  component: AguiActionButtons
  onAction?: (action: string, data?: any) => void
  onUpdate?: (data: any) => void
  interactive?: boolean
}

export function AguiActionButtonsComponent({
  component,
  onAction,
  onUpdate,
  interactive = true
}: AguiActionButtonsProps) {
  const { title, actions, layout } = component

  const handleActionClick = (action: typeof actions[0]) => {
    if (interactive && !action.disabled && onAction) {
      onAction('button-clicked', {
        action: action.action,
        label: action.label,
        variant: action.variant
      })
    }
  }

  const getIcon = (iconName?: string) => {
    if (!iconName) return null

    // Convert icon name to PascalCase for Lucide icons
    const iconKey = iconName.split('-').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join('')

    const IconComponent = (Icons as any)[iconKey]
    return IconComponent ? <IconComponent className="h-4 w-4" /> : null
  }

  const getVariantClasses = (variant: string) => {
    switch (variant) {
      case 'primary':
        return 'btn-primary shadow-interactive'
      case 'secondary':
        return 'btn-secondary shadow-interactive'
      case 'danger':
        return 'bg-red-600 hover:bg-red-700 text-white border-red-500 shadow-interactive'
      case 'ghost':
        return 'btn-ghost shadow-interactive'
      default:
        return 'btn-secondary shadow-interactive'
    }
  }

  const getLayoutClasses = () => {
    switch (layout) {
      case 'horizontal':
        return 'flex flex-wrap gap-2'
      case 'vertical':
        return 'flex flex-col space-y-2'
      case 'grid':
        return 'grid grid-cols-1 sm:grid-cols-2 gap-2'
      default:
        return 'flex flex-wrap gap-2'
    }
  }

  return (
    <div className="action-buttons-component">
      {/* Title */}
      {title && (
        <h4 className="text-sm font-medium studio-text mb-3">{title}</h4>
      )}

      {/* Action Buttons */}
      <div className={getLayoutClasses()}>
        {actions.map((action, index) => {
          const icon = getIcon(action.icon)

          return (
            <button
              key={`${action.action}-${index}`}
              onClick={() => handleActionClick(action)}
              disabled={action.disabled || !interactive}
              className={cn(
                'flex items-center justify-center space-x-2 px-4 py-2 rounded-lg font-medium transition-all duration-200',
                'disabled:opacity-50 disabled:cursor-not-allowed',
                getVariantClasses(action.variant),
                layout === 'vertical' && 'text-left justify-start',
                layout === 'grid' && 'text-center'
              )}
            >
              {icon}
              <span>{action.label}</span>
            </button>
          )
        })}
      </div>

      {/* Quick Action Hints */}
      {actions.length > 3 && (
        <div className="mt-3 text-xs studio-muted">
          <p>Tip: Use keyboard shortcuts for faster access</p>
        </div>
      )}
    </div>
  )
}