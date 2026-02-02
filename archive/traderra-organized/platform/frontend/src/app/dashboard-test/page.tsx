'use client'

import { MainDashboardDebug } from '@/components/dashboard/main-dashboard-debug'
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { PnLModeProvider } from '@/contexts/PnLModeContext'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'

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