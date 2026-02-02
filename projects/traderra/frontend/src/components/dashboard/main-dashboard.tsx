'use client'

import { useState } from 'react'
import { AppLayout } from '../layout/app-layout'
import { CalendarRow } from './calendar-row'
import { MetricsWithToggles } from './metric-toggles'
import { useChatContext } from '@/contexts/TraderraContext'
import { useComponentRegistry, type ScrollBehavior } from '@/lib/ag-ui/component-registry'
import { useUser } from '@clerk/nextjs'
import { useGuestMode } from '@/contexts/GuestModeContext'
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
import { StandaloneRenataChat } from '@/components/chat/standalone-renata-chat'
import { BarChart3, Clock, Calendar, TrendingUp, Target, Activity } from 'lucide-react'
import { useTrades } from '@/hooks/useTrades'
import { useDateRange } from '@/contexts/TraderraContext'
// CopilotKit calendar actions removed - now using direct API calls via simplified chat

export function MainDashboard() {
  // Use chat context for persistent sidebar state
  const { isSidebarOpen: aiSidebarOpen, setIsSidebarOpen: setAiSidebarOpen } = useChatContext()

  // Get authentication and guest mode state
  const { isSignedIn } = useUser()
  const { isGuestMode, setGuestMode } = useGuestMode()

  // Register dashboard components with AG-UI registry
  useComponentRegistry('dashboard.metrics', {
    scroll: (behavior) => {
      const element = document.getElementById('metrics-section')
      element?.scrollIntoView({ behavior: behavior as ScrollBehavior })
    }
  })

  useComponentRegistry('dashboard.charts', {
    scroll: (behavior) => {
      const element = document.getElementById('charts-section')
      element?.scrollIntoView({ behavior: behavior as ScrollBehavior })
    }
  })

  useComponentRegistry('dashboard.summary', {
    scroll: (behavior) => {
      const element = document.getElementById('summary-section')
      element?.scrollIntoView({ behavior: behavior as ScrollBehavior })
    }
  })

  useComponentRegistry('dashboard.journal', {
    scroll: (behavior) => {
      const element = document.getElementById('journal-section')
      element?.scrollIntoView({ behavior: behavior as ScrollBehavior })
    }
  })

  // Load trade data and apply date filtering
  const { trades, isLoading: tradesLoading, error: tradesError } = useTrades()
  const { getFilteredData } = useDateRange()
  const filteredTrades = getFilteredData(trades || [])

  // CopilotKit action hooks removed - calendar actions now handled directly via simplified chat API

  return (
    <AppLayout
      pageClassName="min-h-screen"
      showPageHeader={true}
      pageHeaderContent={
        <div className="px-6 py-4">
          <CalendarRow aiSidebarOpen={aiSidebarOpen} />
        </div>
      }
    >
      <div className="px-6 pb-6">
        <div className="mx-auto max-w-5xl space-y-8">
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
                <p className="studio-muted mb-4">
                  {!isSignedIn ? "Sign in to access your trading data or explore as a guest." : "Import your trades to see dashboard analytics."}
                </p>
                <div className="flex gap-3 justify-center">
                  {!isSignedIn && !isGuestMode && (
                    <button
                      onClick={() => setGuestMode(true)}
                      className="btn-secondary"
                    >
                      View as Guest
                    </button>
                  )}
                  <button
                    onClick={() => window.location.href = '/trades'}
                    className="btn-primary"
                  >
                    {isSignedIn ? 'Import Trades' : 'Sign In'}
                  </button>
                </div>
                {!isSignedIn && !isGuestMode && (
                  <p className="text-sm studio-muted mt-4">
                    Guest mode loads sample data to explore Renata AI features
                  </p>
                )}
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
            </>
          )}
        </div>
      </div>

      </AppLayout>
  )
}