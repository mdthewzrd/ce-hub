'use client'

import { useState } from 'react'
import { TopNavigation } from '../layout/top-nav'
import { CalendarRow } from './calendar-row'
import { MetricsWithToggles } from './metric-toggles'
import { RenataChat } from './renata-chat'
import {
  AdvancedEquityChart,
  PerformanceDistributionChart,
  SymbolPerformanceChart,
  BiggestTradesChart
} from './advanced-charts'
import {
  DayOfWeekChart,
  MonthlyPerformanceChart,
  WinRateAnalysisChart,
  PerformanceByPositionSizeChart,
  PerformanceByPriceChart
} from './additional-metrics'
import { TabbedWidget } from './tabbed-widget'
import { BarChart3, Clock, Calendar, TrendingUp, Target, Activity } from 'lucide-react'
import { useTrades } from '@/hooks/useTrades'
import { useDateRange } from '@/contexts/DateRangeContext'

export function MainDashboard() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)

  // Load trade data and apply date filtering
  const { trades, isLoading: tradesLoading, error: tradesError } = useTrades()
  const { getFilteredData } = useDateRange()
  const filteredTrades = getFilteredData(trades || [])

  return (
    <div className="min-h-screen studio-bg">
      {/* Fixed header section */}
      <div className="sticky top-0 z-50">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Calendar Row */}
        <CalendarRow aiSidebarOpen={aiSidebarOpen} />
      </div>

      {/* Main layout container */}
      <div className="flex min-h-[calc(100vh-128px)]">
        {/* Dashboard content - flexible width based on AI sidebar state */}
        <main className={`flex-1 overflow-auto p-6 transition-all duration-300 ${aiSidebarOpen ? 'mr-[480px]' : ''}`}>
          <div className="mx-auto max-w-7xl space-y-8">
            {/* Performance Metrics */}
            <MetricsWithToggles trades={filteredTrades} />

            {/* Loading/Error States */}
            {tradesLoading ? (
              <div className="flex items-center justify-center h-64">
                <div className="text-center">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="studio-muted">Loading trade data...</p>
                </div>
              </div>
            ) : tradesError ? (
              <div className="studio-surface rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold studio-text mb-2">Error Loading Data</h3>
                  <p className="studio-muted mb-4">{tradesError}</p>
                  <button
                    onClick={() => window.location.reload()}
                    className="btn-primary"
                  >
                    Retry
                  </button>
                </div>
              </div>
            ) : filteredTrades.length === 0 ? (
              <div className="studio-surface rounded-lg p-6">
                <div className="text-center">
                  <h3 className="text-lg font-semibold studio-text mb-2">No Trade Data</h3>
                  <p className="studio-muted mb-4">Import your trades to see dashboard analytics.</p>
                  <button
                    onClick={() => window.location.href = '/trades'}
                    className="btn-primary"
                  >
                    Import Trades
                  </button>
                </div>
              </div>
            ) : (
              <>
                {/* 2 Main Visual Assets */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Main Equity Chart */}
                  <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                    <AdvancedEquityChart trades={filteredTrades} />
                  </div>

                  {/* Performance Distribution */}
                  <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                    <PerformanceDistributionChart trades={filteredTrades} />
                  </div>
                </div>

                {/* Mini Stats Section - Metrics with Toggles (already shown above) */}

                {/* Enhanced Analytics with Tabbed Widgets */}
                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {/* Time-Based Analysis Widget */}
                  <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                    <TabbedWidget
                      variant="minimal"
                      tabs={[
                        {
                          id: 'dayofweek',
                          label: 'Day of Week',
                          icon: Calendar,
                          component: DayOfWeekChart,
                          props: { trades: filteredTrades }
                        },
                        {
                          id: 'monthly',
                          label: 'Monthly',
                          icon: Calendar,
                          component: MonthlyPerformanceChart,
                          props: { trades: filteredTrades }
                        },
                      ]}
                      defaultTab="dayofweek"
                    />
                  </div>

                  {/* Trading Performance Widget */}
                  <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                    <TabbedWidget
                      variant="minimal"
                      tabs={[
                        {
                          id: 'symbols',
                          label: 'Symbols',
                          icon: BarChart3,
                          component: SymbolPerformanceChart,
                          props: { trades: filteredTrades }
                        },
                        {
                          id: 'besttrades',
                          label: 'Best Trades',
                          icon: TrendingUp,
                          component: BiggestTradesChart,
                          props: { trades: filteredTrades }
                        },
                      ]}
                      defaultTab="symbols"
                    />
                  </div>
                </div>
              </>
            )}

            {/* Journal Section */}
            <div className="studio-surface rounded-lg p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold studio-text">Trading Journal</h2>
                <button
                  className="btn-primary"
                  onClick={() => window.location.href = '/journal'}
                >
                  Add Entry
                </button>
              </div>

              <div className="space-y-4">
                {/* Recent journal entries */}
                <div className="grid gap-2">
                  <div className="studio-surface rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-muted">Oct 12, 2024</span>
                      <span className="text-sm text-green-400">+$485.20</span>
                    </div>
                    <p className="text-sm studio-text">
                      Excellent entry on TSLA swing trade. Followed the technical setup perfectly with strong volume confirmation.
                    </p>
                  </div>

                  <div className="studio-surface rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-muted">Oct 11, 2024</span>
                      <span className="text-sm text-green-400">+$1,485.75</span>
                    </div>
                    <p className="text-sm studio-text">
                      Great day with multiple small wins. Stuck to the plan and managed risk well. Market conditions favorable.
                    </p>
                  </div>

                  <div className="studio-surface rounded-lg p-4 border border-[#1a1a1a]">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm studio-muted">Oct 10, 2024</span>
                      <span className="text-sm text-red-400">-$125.80</span>
                    </div>
                    <p className="text-sm studio-text">
                      Small loss on AAPL position. Should have waited for better confirmation. Lesson learned about patience.
                    </p>
                  </div>
                </div>

                <div className="text-center pt-4">
                  <button
                    className="btn-secondary"
                    onClick={() => window.location.href = '/journal'}
                  >
                    View All Entries
                  </button>
                </div>
              </div>
            </div>
          </div>
        </main>

        {/* AI Sidebar - Renata Chat - Fixed position */}
        {aiSidebarOpen && (
          <div className="fixed right-0 top-16 bottom-0 w-[480px] studio-surface border-l border-[#1a1a1a] z-40 overflow-auto">
            <RenataChat />
          </div>
        )}
      </div>
    </div>
  )
}