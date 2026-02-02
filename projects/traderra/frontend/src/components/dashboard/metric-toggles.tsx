'use client'

import { TrendingUp, TrendingDown, Target, DollarSign, Percent } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useDateRange } from '@/contexts/TraderraContext'
import { useDisplayMode, DisplayMode } from '@/contexts/TraderraContext'
import { usePnLMode } from '@/contexts/TraderraContext'
import { TraderraTrade } from '@/utils/csv-parser'
import { calculateTradeStatistics, formatCurrency, formatPercentage } from '@/utils/trade-statistics'
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'
import { useCopilotReadable } from '@/hooks/useCopilotReadableWithContext'


interface MetricCardProps {
  title: string
  value: number
  displayMode: DisplayMode
  icon: React.ComponentType<any>
  type: 'currency' | 'percentage' | 'ratio' | 'expectancy'
  trend?: number
  positive?: boolean
  rValue?: number // For proper R-multiple display
}

function MetricCard({ title, value, displayMode, icon: Icon, type, trend, positive = true, rValue }: MetricCardProps) {
  const formatValue = () => {
    switch (displayMode) {
      case 'dollar':
        if (type === 'currency') {
          const absValue = Math.abs(value)
          if (absValue >= 1000000) return `$${(absValue / 1000000).toFixed(1)}M`
          if (absValue >= 1000) return `$${(absValue / 1000).toFixed(1)}K`
          return `$${absValue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`
        }
        if (type === 'percentage') return `${value.toFixed(1)}%`
        if (type === 'expectancy') return `$${Math.abs(value).toFixed(2)}`
        if (type === 'ratio') return value === Infinity ? '∞' : value.toFixed(2)
        return value.toString()
      case 'r':
        if (type === 'currency') return `${Math.abs(rValue !== undefined ? rValue : 0).toFixed(2)}R`
        if (type === 'percentage') return `${value.toFixed(1)}%`
        if (type === 'expectancy') return `${Math.abs(rValue !== undefined ? rValue : 0).toFixed(2)}R`
        if (type === 'ratio') return value === Infinity ? '∞' : value.toFixed(2)
        return value.toString()
      default:
        return value.toString()
    }
  }

  const isNegative = displayMode === 'r' ? (rValue !== undefined ? rValue < 0 : false) : value < 0

  return (
    <div className="studio-surface rounded-lg p-1.5 sm:p-2 lg:p-3 hover:bg-[#0f0f0f] transition-colors min-w-0">
      <div className="flex items-center justify-between mb-0.5 sm:mb-1">
        <div className="text-[10px] sm:text-xs studio-muted truncate mr-1 sm:mr-2 flex-shrink">{title}</div>
        <Icon className={cn(
          'h-3 w-3 sm:h-3.5 sm:w-3.5 lg:h-4 lg:w-4 flex-shrink-0',
          positive && !isNegative ? 'text-green-400' : 'text-red-400'
        )} />
      </div>
      <div className={cn(
        'text-xs sm:text-sm md:text-base lg:text-lg xl:text-xl font-semibold mb-0.5 sm:mb-1 truncate',
        'overflow-hidden text-ellipsis whitespace-nowrap',
        positive && !isNegative ? 'text-green-400' :
        isNegative ? 'text-red-400' : 'text-white'
      )}>
        {isNegative && value !== 0 ? '-' : ''}
        {formatValue()}
      </div>
      {trend && (
        <div className={cn(
          'text-[9px] sm:text-[10px] lg:text-xs flex items-center truncate',
          trend > 0 ? 'text-green-400' : 'text-red-400'
        )}>
          {trend > 0 ? <TrendingUp className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" /> : <TrendingDown className="h-2.5 w-2.5 sm:h-3 sm:w-3 mr-0.5 sm:mr-1 flex-shrink-0" />}
          <span className="truncate">{trend > 0 ? '+' : ''}{trend.toFixed(1)}%</span>
        </div>
      )}
    </div>
  )
}

export function MetricsWithToggles({ trades }: { trades: TraderraTrade[] }) {
  const { mode } = usePnLMode()
  const { displayMode } = useDisplayMode()

  // Calculate metrics from filtered trade data using the proper statistics function with PnL mode
  const stats = calculateTradeStatistics(trades, mode)

  // Expose dashboard metrics to Renata AI for context awareness
  useCopilotReadable({
    description: 'Trading dashboard performance metrics currently displayed on screen',
    value: {
      totalPnL: stats.totalGainLoss,
      totalRMultiple: stats.totalRMultiple,
      winRate: stats.winRate,
      profitFactor: stats.profitFactor,
      expectancy: stats.expectancy,
      expectancyR: stats.expectancyR,
      maxDrawdown: stats.maxDrawdown,
      maxDrawdownR: stats.maxDrawdownR,
      averageWin: stats.averageWin,
      averageWinR: stats.averageWinR,
      averageLoss: stats.averageLoss,
      averageLossR: stats.averageLossR,
      totalTrades: stats.totalTrades,
      winningTrades: stats.winningTrades,
      losingTrades: stats.losingTrades,
      largestWin: stats.largestWin,
      largestLoss: stats.largestLoss,
      displayMode: displayMode,
      pnlMode: mode
    }
  })

  return (
    <div className="space-y-4">
      {/* Performance Overview Header */}
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold studio-text">Performance Overview</h2>
      </div>

      {/* Main Metrics Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-1 sm:gap-2">
        <MetricCard
          title="Total P&L"
          value={stats.totalGainLoss}
          displayMode={displayMode}
          icon={DollarSign}
          type="currency"
          positive={stats.totalGainLoss > 0}
          rValue={stats.totalRMultiple}
        />
        <MetricCard
          title="Win Rate"
          value={stats.winRate}
          displayMode={displayMode}
          icon={Target}
          type="percentage"
        />
        <MetricCard
          title="Profit Factor"
          value={stats.profitFactor}
          displayMode={displayMode}
          icon={TrendingUp}
          type="ratio"
        />
        <MetricCard
          title="Expectancy"
          value={stats.expectancy}
          displayMode={displayMode}
          icon={TrendingUp}
          type="expectancy"
          rValue={stats.expectancyR}
        />
        <MetricCard
          title="Max Drawdown"
          value={-stats.maxDrawdown}
          displayMode={displayMode}
          icon={TrendingDown}
          type="currency"
          positive={false}
          rValue={-Math.abs(stats.maxDrawdownR)} // Ensure negative display for drawdown
        />
        <MetricCard
          title="Avg Winner"
          value={stats.averageWin}
          displayMode={displayMode}
          icon={TrendingUp}
          type="currency"
          rValue={stats.averageWinR} // Use calculated average winner R-multiple
        />
        <MetricCard
          title="Avg Loser"
          value={stats.averageLoss}
          displayMode={displayMode}
          icon={TrendingDown}
          type="currency"
          positive={false}
          rValue={stats.averageLossR} // Use calculated average loser R-multiple (already negative)
        />
      </div>
    </div>
  )
}