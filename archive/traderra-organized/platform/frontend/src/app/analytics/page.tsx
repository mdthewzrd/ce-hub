'use client'

import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Download } from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import {
  HourlyTradeDistribution,
  HourlyPerformanceChart,
  MonthlyTradeDistribution,
  MonthlyPerformanceChart,
  CumulativePnLComparison
} from '@/components/analytics/advanced-analytics-charts'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { TraderViewDateSelector } from '@/components/ui/traderview-date-selector'
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'
import { DateRangeProvider, useDateRange } from '@/contexts/DateRangeContext'
import { usePnLMode } from '@/contexts/PnLModeContext'
import { useDisplayMode } from '@/contexts/DisplayModeContext'
import { getPnLValue } from '@/lib/utils/pnl'
import { formatDisplayValue, getValueColorClass } from '@/utils/display-formatting'
import { cn } from '@/lib/utils'
import { TraderraTrade } from '@/lib/types'

// Calculate analytics stats from real trade data
function calculateAnalyticsStats(trades: TraderraTrade[], mode: 'gross' | 'net', displayMode: any) {
  if (!trades || trades.length === 0) {
    return [
      { title: 'Total Volume', value: formatDisplayValue(0, displayMode, 'currency'), change: '0%', trend: 'neutral' },
      { title: 'Average Position Size', value: formatDisplayValue(0, displayMode, 'currency'), change: '0%', trend: 'neutral' },
      { title: 'Win Rate', value: '0%', change: '0%', trend: 'neutral' },
      { title: 'Profit Factor', value: '0', change: '0%', trend: 'neutral' },
      { title: 'Average Winner', value: formatDisplayValue(0, displayMode, 'currency'), change: '0%', trend: 'neutral' },
      { title: 'Average Loser', value: formatDisplayValue(0, displayMode, 'currency'), change: '0%', trend: 'neutral' }
    ]
  }

  // Calculate basic metrics
  const totalVolume = trades.reduce((sum, trade) => sum + (trade.quantity * trade.entryPrice), 0)
  const avgPositionSize = totalVolume / trades.length

  // Winning and losing trades
  const winningTrades = trades.filter(trade => getPnLValue(trade, mode) > 0)
  const losingTrades = trades.filter(trade => getPnLValue(trade, mode) < 0)
  const winRate = (winningTrades.length / trades.length) * 100

  // Average winner/loser
  const avgWinner = winningTrades.length > 0
    ? winningTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0) / winningTrades.length
    : 0
  const avgLoser = losingTrades.length > 0
    ? losingTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0) / losingTrades.length
    : 0

  // Profit factor
  const totalWins = winningTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0)
  const totalLosses = Math.abs(losingTrades.reduce((sum, trade) => sum + getPnLValue(trade, mode), 0))
  const profitFactor = totalLosses > 0 ? totalWins / totalLosses : totalWins > 0 ? 999 : 0

  return [
    {
      title: 'Total Volume',
      value: formatDisplayValue(totalVolume, displayMode, 'currency'),
      change: '+0%', // TODO: Calculate period over period change
      trend: 'neutral' as const
    },
    {
      title: 'Average Position Size',
      value: formatDisplayValue(avgPositionSize, displayMode, 'currency'),
      change: '+0%', // TODO: Calculate period over period change
      trend: 'neutral' as const
    },
    {
      title: 'Win Rate',
      value: `${winRate.toFixed(1)}%`,
      change: '+0%', // TODO: Calculate period over period change
      trend: 'neutral' as const
    },
    {
      title: 'Profit Factor',
      value: profitFactor === Infinity ? '∞' : profitFactor.toFixed(2),
      change: '+0%', // TODO: Calculate period over period change
      trend: 'neutral' as const
    },
    {
      title: 'Average Winner',
      value: formatDisplayValue(avgWinner, displayMode, 'currency'),
      change: '+0%', // TODO: Calculate period over period change
      trend: 'neutral' as const
    },
    {
      title: 'Average Loser',
      value: formatDisplayValue(avgLoser, displayMode, 'currency'),
      change: '+0%', // TODO: Calculate period over period change
      trend: 'neutral' as const
    }
  ]
}

function AnalyticsPageContent() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [selectedMetrics, setSelectedMetrics] = useState('all')
  const { mode } = usePnLMode()
  const { displayMode } = useDisplayMode()

  // Fetch real trade data
  const { data: tradesData } = useQuery({
    queryKey: ['trades'],
    queryFn: async () => {
      const response = await fetch('/api/trades')
      if (!response.ok) {
        throw new Error('Failed to fetch trades')
      }
      const data = await response.json()
      return data.trades as TraderraTrade[]
    }
  })

  // Calculate analytics stats from real trade data
  const analyticsStats = calculateAnalyticsStats(tradesData || [], mode, displayMode)

  return (
    <div className="flex h-screen studio-bg">
      {/* Main content container with top navigation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Page Header */}
        <div className="studio-surface border-b border-[#1a1a1a] px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold studio-text">Advanced Analytics</h1>
            <div className="flex items-center space-x-4">
              <DisplayModeToggle size="sm" variant="flat" />
              <TraderViewDateSelector />
              <button className="btn-ghost flex items-center space-x-2">
                <Download className="h-4 w-4" />
                <span>Export</span>
              </button>
            </div>
          </div>
        </div>

        {/* Analytics content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-6">
            {/* Key Metrics Grid */}
            <div className="grid grid-cols-2 gap-0.5 md:grid-cols-3 lg:grid-cols-6">
              {analyticsStats.map((stat, index) => (
                <div key={index} className="studio-surface rounded-lg p-2 sm:p-3">
                  <div className="text-sm studio-muted mb-1">{stat.title}</div>
                  <div className="text-lg font-bold studio-text mb-1">{stat.value}</div>
                  <div className={cn(
                    'text-xs font-medium',
                    stat.trend === 'up' ? 'text-trading-profit' : 'text-trading-loss'
                  )}>
                    {stat.change}
                  </div>
                </div>
              ))}
            </div>

            {/* Main Analytics Charts */}
            <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
              {/* P&L Comparison Chart */}
              <div className="xl:col-span-2">
                <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                  <CumulativePnLComparison tradesData={tradesData} mode={mode} />
                </div>
              </div>

              {/* Hourly Trade Distribution */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <HourlyTradeDistribution tradesData={tradesData} mode={mode} />
              </div>

              {/* Hourly Performance */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <HourlyPerformanceChart tradesData={tradesData} mode={mode} />
              </div>

              {/* Monthly Trade Distribution */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <MonthlyTradeDistribution tradesData={tradesData} mode={mode} />
              </div>

              {/* Monthly Performance */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <MonthlyPerformanceChart tradesData={tradesData} mode={mode} />
              </div>
            </div>

            {/* Performance Summary Section */}
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
              {/* Best Performing Strategies */}
              <div className="studio-surface rounded-lg p-6">
                <h3 className="text-lg font-semibold studio-text mb-4">Best Performing Strategies</h3>
                <div className="space-y-3">
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Momentum</div>
                      <div className="text-xs studio-muted">45 trades</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold", getValueColorClass(2485))}>
                        {formatDisplayValue(2485, displayMode, 'currency')}
                      </div>
                      <div className="text-xs studio-muted">68.9% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Breakout</div>
                      <div className="text-xs studio-muted">28 trades</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold", getValueColorClass(1825))}>
                        {formatDisplayValue(1825, displayMode, 'currency')}
                      </div>
                      <div className="text-xs studio-muted">64.3% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Swing</div>
                      <div className="text-xs studio-muted">15 trades</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold", getValueColorClass(1485))}>
                        {formatDisplayValue(1485, displayMode, 'currency')}
                      </div>
                      <div className="text-xs studio-muted">73.3% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Gap Fill</div>
                      <div className="text-xs studio-muted">12 trades</div>
                    </div>
                    <div className="text-right">
                      <div className={cn("text-sm font-bold", getValueColorClass(685))}>
                        {formatDisplayValue(685, displayMode, 'currency')}
                      </div>
                      <div className="text-xs studio-muted">58.3% win rate</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Time Performance Analysis */}
              <div className="studio-surface rounded-lg p-6">
                <h3 className="text-lg font-semibold studio-text mb-4">Time Performance Analysis</h3>
                <div className="space-y-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-text">Best Trading Hour</span>
                      <span className="text-sm font-bold text-primary">9:00 - 10:00 AM</span>
                    </div>
                    <div className="text-xs studio-muted">
                      Average P&L: {formatDisplayValue(27.8, displayMode, 'currency')} per trade
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-text">Most Active Hour</span>
                      <span className="text-sm font-bold text-primary">9:00 - 10:00 AM</span>
                    </div>
                    <div className="text-xs studio-muted">45 trades executed</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-text">Best Trading Day</span>
                      <span className="text-sm font-bold text-primary">Wednesday</span>
                    </div>
                    <div className="text-xs studio-muted">
                      Average P&L: {formatDisplayValue(380, displayMode, 'currency')} per day
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-text">Best Month</span>
                      <span className="text-sm font-bold text-primary">February</span>
                    </div>
                    <div className="text-xs studio-muted">
                      Total P&L: {formatDisplayValue(1680, displayMode, 'currency')}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[480px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return <AnalyticsPageContent />
}