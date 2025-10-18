'use client'

import { MainDashboard } from '@/components/dashboard/main-dashboard'
import { DateRangeProvider } from '@/contexts/DateRangeContext'

export default function DashboardPage() {
  return (
    <DateRangeProvider>
      <MainDashboard />
    </DateRangeProvider>
  )
}