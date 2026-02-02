'use client'

import { MainDashboard } from '@/components/dashboard/main-dashboard'
import { DateRangeProvider } from '@/contexts/DateRangeContext'
import { PnLModeProvider } from '@/contexts/PnLModeContext'
import { DisplayModeProvider } from '@/contexts/DisplayModeContext'

// Dashboard page with optimized spacing
export default function DashboardPage() {
  return (
    <DisplayModeProvider>
      <PnLModeProvider>
        <DateRangeProvider>
          <MainDashboard />
        </DateRangeProvider>
      </PnLModeProvider>
    </DisplayModeProvider>
  )
}