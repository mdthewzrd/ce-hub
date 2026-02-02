'use client'

import { MainDashboard } from '@/components/dashboard/main-dashboard'
import { DebugButtonTest, CSSDebugOverlay } from '@/components/debug/ButtonDebugTest'
import { DisplayModeProvider } from '@/contexts/TraderraContext'
import { PnLModeProvider } from '@/contexts/TraderraContext'
import { DateRangeProvider } from '@/contexts/TraderraContext'

export default function DebugDashboardPage() {
  return (
    <DisplayModeProvider>
      <PnLModeProvider>
        <DateRangeProvider>
          <div className="relative">
            {/* Main Dashboard */}
            <MainDashboard />

            {/* Debug Overlay Components */}
            <DebugButtonTest position="fixed" />
            <CSSDebugOverlay />

            {/* Additional Debug Info */}
            <div style={{
              position: 'fixed',
              top: '50%',
              left: '10px',
              background: '#00ff00',
              color: '#000000',
              padding: '15px',
              borderRadius: '8px',
              zIndex: 9997,
              fontSize: '12px',
              transform: 'translateY(-50%)',
              maxWidth: '300px'
            }}>
              <h4 style={{ margin: '0 0 10px 0', fontWeight: 'bold' }}>
                🔍 Debug Dashboard
              </h4>
              <div>
                <div>• Main dashboard loaded with debug overlays</div>
                <div>• Red box: Debug button tests</div>
                <div>• Blue box: CSS analysis</div>
                <div>• Green box: This info panel</div>
                <div>• Check browser console for logs</div>
                <div>• Look for $ % R buttons in dashboard</div>
              </div>
            </div>
          </div>
        </DateRangeProvider>
      </PnLModeProvider>
    </DisplayModeProvider>
  )
}