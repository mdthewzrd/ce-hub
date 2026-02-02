'use client'

import { MainDashboardDebug } from '@/components/dashboard/main-dashboard-debug'
import { DateRangeProvider } from '@/contexts/TraderraContext'
import { PnLModeProvider } from '@/contexts/TraderraContext'
import { DisplayModeProvider } from '@/contexts/TraderraContext'

// Test page for dashboard without authentication requirement
export default function DashboardTestPage() {
  return (
    <DisplayModeProvider>
      <PnLModeProvider>
        <DateRangeProvider>
          <MainDashboardDebug />
        </DateRangeProvider>
      </PnLModeProvider>
    </DisplayModeProvider>
  )
}