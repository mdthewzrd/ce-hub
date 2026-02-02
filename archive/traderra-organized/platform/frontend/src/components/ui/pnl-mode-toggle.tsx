'use client'

import { cn } from '@/lib/utils'
import { usePnLMode } from '@/contexts/PnLModeContext'

interface PnLModeToggleProps {
  className?: string
}

export function PnLModeToggle({ className }: PnLModeToggleProps) {
  const { mode, setMode, isGross, isNet } = usePnLMode()

  return (
    <div className={cn('flex items-center gap-1', className)}>
      {/* Gross P&L button */}
      <button
        onClick={() => setMode('gross')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
          isGross
            ? 'bg-[#B8860B] text-black shadow-lg'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
        )}
        title="Gross P&L (before commissions)"
      >
        G
      </button>

      {/* Net P&L button */}
      <button
        onClick={() => setMode('net')}
        className={cn(
          'px-3 py-1.5 text-sm font-medium rounded transition-all duration-200',
          isNet
            ? 'bg-[#B8860B] text-black shadow-lg'
            : 'text-gray-400 hover:text-gray-200 hover:bg-gray-700/50'
        )}
        title="Net P&L (after commissions)"
      >
        N
      </button>
    </div>
  )
}