'use client'

import { useState } from 'react'
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
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { cn } from '@/lib/utils'

// Analytics summary data
const analyticsStats = [
  {
    title: 'Total Volume',
    value: '$2,847,650',
    change: '+12.5%',
    trend: 'up'
  },
  {
    title: 'Average Position Size',
    value: '$8,425',
    change: '+3.2%',
    trend: 'up'
  },
  {
    title: 'Win Rate',
    value: '68.4%',
    change: '+5.1%',
    trend: 'up'
  },
  {
    title: 'Profit Factor',
    value: '1.85',
    change: '-2.3%',
    trend: 'down'
  },
  {
    title: 'Average Winner',
    value: '$145.20',
    change: '+8.7%',
    trend: 'up'
  },
  {
    title: 'Average Loser',
    value: '-$78.50',
    change: '-12.1%',
    trend: 'up'
  }
]

function AnalyticsPageContent() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [selectedMetrics, setSelectedMetrics] = useState('all')

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
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-6">
              {analyticsStats.map((stat, index) => (
                <div key={index} className="studio-surface rounded-lg p-4">
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
            <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
              {/* P&L Comparison Chart */}
              <div className="xl:col-span-2">
                <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                  <CumulativePnLComparison />
                </div>
              </div>

              {/* Hourly Trade Distribution */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <HourlyTradeDistribution />
              </div>

              {/* Hourly Performance */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <HourlyPerformanceChart />
              </div>

              {/* Monthly Trade Distribution */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <MonthlyTradeDistribution />
              </div>

              {/* Monthly Performance */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <MonthlyPerformanceChart />
              </div>
            </div>

            {/* Performance Summary Section */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
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
                      <div className="text-sm font-bold text-trading-profit">+$2,485</div>
                      <div className="text-xs studio-muted">68.9% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Breakout</div>
                      <div className="text-xs studio-muted">28 trades</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-trading-profit">+$1,825</div>
                      <div className="text-xs studio-muted">64.3% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Swing</div>
                      <div className="text-xs studio-muted">15 trades</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-trading-profit">+$1,485</div>
                      <div className="text-xs studio-muted">73.3% win rate</div>
                    </div>
                  </div>
                  <div className="flex items-center justify-between py-2 border-b border-[#1a1a1a] last:border-b-0">
                    <div>
                      <div className="text-sm font-medium studio-text">Gap Fill</div>
                      <div className="text-xs studio-muted">12 trades</div>
                    </div>
                    <div className="text-right">
                      <div className="text-sm font-bold text-trading-profit">+$685</div>
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
                    <div className="text-xs studio-muted">Average P&L: +$27.8 per trade</div>
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
                    <div className="text-xs studio-muted">Average P&L: +$380 per day</div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-text">Best Month</span>
                      <span className="text-sm font-bold text-primary">February</span>
                    </div>
                    <div className="text-xs studio-muted">Total P&L: +$1,680</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[600px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}
    </div>
  )
}

export default function AnalyticsPage() {
  return (
    <DateRangeProvider>
      <AnalyticsPageContent />
    </DateRangeProvider>
  )
}