'use client'

import { useState, useEffect } from 'react'
import { DollarSign, Target } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDisplayMode, DisplayMode } from '@/contexts/DisplayModeContext'

interface DisplayModeToggleProps {
  className?: string
  size?: 'sm' | 'md' | 'lg'
  variant?: 'default' | 'compact' | 'icon-only' | 'flat'
  showLabels?: boolean
}

const sizeClasses = {
  sm: {
    container: 'p-0.5',
    button: 'px-2 py-1 text-xs',
    icon: 'h-3 w-3',
  },
  md: {
    container: 'p-1',
    button: 'px-3 py-1 text-sm',
    icon: 'h-4 w-4',
  },
  lg: {
    container: 'p-1.5',
    button: 'px-4 py-2 text-base',
    icon: 'h-5 w-5',
  },
}

export function DisplayModeToggle({
  className,
  size = 'md',
  variant = 'default',
  showLabels = false,
}: DisplayModeToggleProps) {
  const { displayMode, setDisplayMode } = useDisplayMode()
  const sizes = sizeClasses[size]
  const [isMounted, setIsMounted] = useState(false)

  // Prevent hydration mismatch
  useEffect(() => {
    setIsMounted(true)
  }, [])

  const modes: Array<{
    value: DisplayMode
    label: string
    icon: React.ComponentType<any>
    shortLabel: string
  }> = [
    { value: 'dollar', label: 'Dollar', icon: DollarSign, shortLabel: '$' },
    { value: 'r', label: 'Risk Multiple', icon: Target, shortLabel: 'R' },
  ]

  if (variant === 'icon-only') {
    return (
      <div className={cn('flex items-center space-x-1', className)}>
        {modes.map((mode) => {
          const Icon = mode.icon
          const isActive = displayMode === mode.value
          return (
            <button
              key={mode.value}
              onClick={() => setDisplayMode(mode.value)}
              className={cn(
                'rounded transition-colors',
                sizes.button,
                isActive
                  ? 'bg-yellow-500 text-black'
                  : 'text-gray-400 hover:text-gray-200 hover:bg-gray-800'
              )}
              title={mode.label}
              aria-label={`Switch to ${mode.label} display mode`}
            >
              <Icon className={sizes.icon} />
            </button>
          )
        })}
      </div>
    )
  }

  if (variant === 'compact') {
    return (
      <div className={cn(
        'flex items-center bg-gray-800 rounded-lg',
        sizes.container,
        className
      )}>
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setDisplayMode(mode.value)}
            className={cn(
              'font-medium rounded transition-colors',
              sizes.button,
              displayMode === mode.value
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-gray-200'
            )}
            aria-label={`Switch to ${mode.label} display mode`}
          >
            {mode.shortLabel}
          </button>
        ))}
      </div>
    )
  }

  if (variant === 'flat') {
    // Prevent hydration mismatch by not rendering until mounted
    if (!isMounted) {
      return (
        <div className={cn('flex items-center gap-1', className)}>
          {modes.map((mode) => (
            <button
              key={mode.value}
              className="px-3 py-1.5 text-sm font-medium rounded transition-all duration-200 text-gray-400"
            >
              {mode.shortLabel}
            </button>
          ))}
        </div>
      )
    }

    return (
      <div className={cn('flex items-center gap-1', className)}>
        {modes.map((mode) => (
          <button
            key={mode.value}
            onClick={() => setDisplayMode(mode.value)}
            className={cn(
              'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
              displayMode === mode.value
                ? 'bg-[#B8860B] text-black shadow-lg'
                : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
            )}
            aria-label={`Switch to ${mode.label} display mode`}
          >
            {mode.shortLabel}
          </button>
        ))}
      </div>
    )
  }

  // Default variant with full buttons
  return (
    <div className={cn(
      'flex items-center bg-gray-800 rounded-lg',
      sizes.container,
      className
    )}>
      {modes.map((mode) => {
        const Icon = mode.icon
        const isActive = displayMode === mode.value

        return (
          <button
            key={mode.value}
            onClick={() => setDisplayMode(mode.value)}
            className={cn(
              'flex items-center gap-2 font-medium rounded transition-colors',
              sizes.button,
              isActive
                ? 'bg-yellow-500 text-black'
                : 'text-gray-400 hover:text-gray-200'
            )}
            aria-label={`Switch to ${mode.label} display mode`}
          >
            <Icon className={sizes.icon} />
            {showLabels && <span>{mode.label}</span>}
            {!showLabels && <span>{mode.shortLabel}</span>}
          </button>
        )
      })}
    </div>
  )
}

// Alternative single-button toggle component
export function DisplayModeToggleButton({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const { displayMode, toggleDisplayMode, getDisplayModeLabel } = useDisplayMode()
  const sizes = sizeClasses[size]

  const getModeIcon = (mode: DisplayMode) => {
    switch (mode) {
      case 'dollar':
        return DollarSign
      case 'r':
        return Target
      default:
        return DollarSign
    }
  }

  const getModeSymbol = (mode: DisplayMode) => {
    switch (mode) {
      case 'dollar':
        return '$'
      case 'r':
        return 'R'
      default:
        return '$'
    }
  }

  const Icon = getModeIcon(displayMode)

  return (
    <button
      onClick={toggleDisplayMode}
      className={cn(
        'flex items-center gap-2 bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium rounded-lg transition-colors',
        sizes.button,
        className
      )}
      title={`Current: ${getDisplayModeLabel()} - Click to toggle`}
      aria-label={`Toggle display mode. Current: ${getDisplayModeLabel()}`}
    >
      <Icon className={sizes.icon} />
      <span>{getModeSymbol(displayMode)}</span>
    </button>
  )
}

// Dropdown variant for mobile or space-constrained layouts
export function DisplayModeDropdown({
  className,
  size = 'md',
}: {
  className?: string
  size?: 'sm' | 'md' | 'lg'
}) {
  const { displayMode, setDisplayMode, getDisplayModeLabel } = useDisplayMode()
  const sizes = sizeClasses[size]

  return (
    <select
      value={displayMode}
      onChange={(e) => setDisplayMode(e.target.value as DisplayMode)}
      className={cn(
        'bg-gray-800 text-gray-200 border border-gray-700 rounded-lg focus:ring-2 focus:ring-yellow-500 focus:border-yellow-500',
        sizes.button,
        className
      )}
      aria-label="Select display mode"
    >
      <option value="dollar">$ Dollar</option>
      <option value="r">R Risk Multiple</option>
    </select>
  )
}