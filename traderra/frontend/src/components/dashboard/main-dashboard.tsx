'use client'

import { useState } from 'react'
// import { UserButton } from '@clerk/nextjs' // Temporarily disabled
// import { CopilotSidebar } from '@copilotkit/react-ui' // Removed to eliminate Renata image
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
import { cn } from '@/lib/utils'

export function MainDashboard() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)

  return (
    <div className="flex h-screen studio-bg">
      {/* Main content container with top navigation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Calendar Row */}
        <CalendarRow />

        {/* Dashboard content - 2/3 width when AI sidebar is open */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl space-y-8">
            {/* 2 Main Visual Assets */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Main Equity Chart */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <AdvancedEquityChart />
              </div>

              {/* Performance Distribution */}
              <div className="studio-surface rounded-lg p-6 min-h-[400px]">
                <PerformanceDistributionChart />
              </div>
            </div>

            {/* Mini Stats Section - Metrics with Toggles */}
            <MetricsWithToggles />

            {/* Winners/Losers Interactive Dashboard */}
            <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
              {/* Symbol Performance - Horizontal Bar Chart */}
              <div className="studio-surface rounded-lg p-6 min-h-[350px]">
                <SymbolPerformanceChart />
              </div>

              {/* Biggest/Best Trades with W|L Toggle */}
              <div className="studio-surface rounded-lg p-6 min-h-[350px]">
                <BiggestTradesChart />
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
                <div className="grid gap-4">
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