'use client'

import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'
import { useDisplayMode } from '@/contexts/DisplayModeContext'

export default function ButtonTestPage() {
  const { displayMode } = useDisplayMode()

  return (
    <div className="p-8 space-y-6">
      <h1 className="text-2xl font-bold">$ R Button Test</h1>

      <div className="space-y-4">
        <p>Current Display Mode: <strong>{displayMode}</strong></p>

        <div className="space-y-2">
          <h2>Flat Variant (matches 7d, 30d, 90d, All, G, N buttons) - Now just $ and R:</h2>
          <DisplayModeToggle size="sm" variant="flat" />
        </div>

        <div className="space-y-2">
          <h2>Compact Variant (original dashboard style):</h2>
          <DisplayModeToggle size="sm" variant="compact" />
        </div>

        <div className="space-y-2">
          <h2>Default Variant:</h2>
          <DisplayModeToggle size="md" variant="default" />
        </div>

        <div className="space-y-2">
          <h2>Icon Only Variant:</h2>
          <DisplayModeToggle size="md" variant="icon-only" />
        </div>
      </div>

      <div className="mt-8 p-4 bg-gray-800 rounded">
        <h3>Instructions:</h3>
        <ol className="list-decimal list-inside space-y-1 mt-2">
          <li>Click any $ R button above</li>
          <li>Check browser console for logs</li>
          <li>Verify the "Current Display Mode" updates</li>
          <li>Verify button highlighting changes</li>
          <li>Note: Percentage mode has been removed - only Dollar ($) and Risk Multiple (R) remain</li>
        </ol>
      </div>
    </div>
  )
}