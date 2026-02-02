'use client'

import { useState, useEffect } from 'react'
import { useSearchParams } from 'next/navigation'
import { useChatContext } from '@/contexts/TraderraContext'
import { useComponentRegistry, type ScrollBehavior } from '@/lib/ag-ui/component-registry'
import { Plus, Upload, HelpCircle } from 'lucide-react'
import { AppLayout } from '@/components/layout/app-layout'
import { TradesTable } from '@/components/trades/trades-table'
import { NewTradeModal } from '@/components/trades/new-trade-modal'
import { ImportGuideModal } from '@/components/trades/import-guide-modal'
import { TraderViewDateSelector } from '@/components/ui/traderview-date-selector'
import { DisplayModeToggle } from '@/components/ui/display-mode-toggle'
import { TradeUploadModal } from '@/components/trades/trade-upload-modal'
import type { UploadResult } from '@/components/trades/trade-upload-modal'
// Context providers removed - now using unified TraderraProvider in layout
import { parseCSV, convertTraderVueToTraderra, validateTraderVueCSV } from '@/utils/csv-parser'
import { useTrades } from '@/hooks/useTrades'
import { createDataDiagnostic, logDiagnosticReport } from '@/utils/data-diagnostics'
import { useCopilotReadable } from '@/hooks/useCopilotReadableWithContext'


function TradesPageContent() {
  // Use chat context for persistent sidebar state
  const { isSidebarOpen: aiSidebarOpen, setIsSidebarOpen: setAiSidebarOpen } = useChatContext()
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false)
  const [isImportGuideOpen, setIsImportGuideOpen] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [isTradeUploadModalOpen, setIsTradeUploadModalOpen] = useState(false)

  // Register trades components with AG-UI registry
  useComponentRegistry('trades.new-trade-modal', {
    activate: (action) => {
      if (action === 'open' || action === 'click') {
        setIsNewTradeModalOpen(true)
      } else if (action === 'close') {
        setIsNewTradeModalOpen(false)
      }
    }
  })

  useComponentRegistry('trades.import-modal', {
    activate: (action) => {
      if (action === 'open' || action === 'click') {
        setIsImportGuideOpen(true)
      } else if (action === 'close') {
        setIsImportGuideOpen(false)
      }
    }
  })

  useComponentRegistry('trades.upload-modal', {
    activate: (action) => {
      if (action === 'open' || action === 'click') {
        setIsTradeUploadModalOpen(true)
      } else if (action === 'close') {
        setIsTradeUploadModalOpen(false)
      }
    }
  })

  useComponentRegistry('trades.table', {
    scroll: (behavior) => {
      const element = document.getElementById('trades-table-section')
      element?.scrollIntoView({ behavior: behavior as ScrollBehavior })
    }
  })

  useComponentRegistry('trades.summary', {
    scroll: (behavior) => {
      const element = document.getElementById('trades-summary-section')
      element?.scrollIntoView({ behavior: behavior as ScrollBehavior })
    }
  })

  // Get the selectedTrade query parameter
  const searchParams = useSearchParams()
  const selectedTradeId = searchParams.get('selectedTrade')

  // Use the persistent trades hook instead of local state
  const { trades, isLoading: tradesLoading, error: tradesError, saveTrades, addTrade, deleteTrade } = useTrades()

  // Expose trades data to Renata AI for context awareness
  useCopilotReadable({
    description: 'Trades page showing trade history and data',
    value: {
      currentPage: 'trades',
      totalTrades: trades?.length || 0,
      isLoading: tradesLoading,
      hasError: !!tradesError,
      error: tradesError,
      selectedTradeId
    }
  })

  const handleImport = () => {
    // Open the new trade upload modal with backend deduplication
    setIsTradeUploadModalOpen(true)
  }

  // Handle trade upload completion
  const handleTradeUploadComplete = (result: UploadResult) => {
    console.log('Trade upload complete:', result)

    // Refresh trades after upload
    if (result.success) {
      // Trigger a refresh of trades
      window.dispatchEvent(new CustomEvent('refreshTrades'))
    }
  }

  // Keep the old import method as fallback
  const handleLegacyImport = () => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv'
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        setIsImporting(true)
        try {
          const csvText = await file.text()
          const validation = validateTraderVueCSV(csvText)

          if (!validation.valid) {
            alert(`Import Error: ${validation.error}`)
            return
          }

          const traderVueTrades = parseCSV(csvText)
          const traderraTrades = convertTraderVueToTraderra(traderVueTrades)

          console.log(`Successfully imported ${traderraTrades.length} trades from ${file.name}`)

          // 🔍 DIAGNOSTIC: Analyze data accuracy before saving
          console.log('🔍 Running comprehensive data diagnostic...')
          const diagnostic = createDataDiagnostic(traderVueTrades, traderraTrades)
          logDiagnosticReport(diagnostic)

          // Check for significant discrepancies and warn user
          if (Math.abs(diagnostic.summary.pnlDiscrepancy) > 100) {
            console.warn(`⚠️  SIGNIFICANT P&L DISCREPANCY DETECTED: $${diagnostic.summary.pnlDiscrepancy.toFixed(2)}`)
            const proceed = confirm(
              `⚠️  Data Analysis Warning!\n\n` +
              `Found significant discrepancy in P&L calculations:\n` +
              `• TraderVue Net P&L: $${diagnostic.summary.totalPnLTraderVue.toFixed(2)}\n` +
              `• Traderra Calculated: $${diagnostic.summary.totalPnLTraderra.toFixed(2)}\n` +
              `• Difference: $${diagnostic.summary.pnlDiscrepancy.toFixed(2)}\n\n` +
              `This could indicate:\n` +
              `• Commission calculation issues\n` +
              `• CSV parsing problems\n` +
              `• Net vs Gross P&L confusion\n\n` +
              `Check browser console for detailed diagnostic report.\n\n` +
              `Do you want to proceed with import anyway?`
            )

            if (!proceed) {
              console.log('❌ Import cancelled by user due to data discrepancy')
              alert('Import cancelled. Please check your CSV file and try again.')
              return
            }
          }

          // Save trades to database
          await saveTrades(traderraTrades)

          // Show success message
          alert(`🎉 Successfully imported ${traderraTrades.length} trades! Your trading history is now saved to your account and will persist across sessions.`)

        } catch (error) {
          console.error('Import failed:', error)
          alert(`Import failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
        } finally {
          setIsImporting(false)
        }
      }
    }
    input.click()
  }

  const showImportGuide = () => {
    setIsImportGuideOpen(true)
  }

  const handleNewTrade = () => {
    setIsNewTradeModalOpen(true)
  }

  const handleSaveNewTrade = async (newTrade: any) => {
    try {
      await addTrade(newTrade)
      console.log('Successfully saved new trade:', newTrade)
    } catch (error) {
      console.error('Failed to save new trade:', error)
      alert('Failed to save trade. Please try again.')
    }
  }

  return (
    <AppLayout
      pageClassName="min-h-screen"
      showPageHeader={true}
      pageHeaderContent={
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold studio-text">Trade History</h1>
            <div className="flex items-center space-x-4">
              <DisplayModeToggle size="sm" variant="flat" />
              <TraderViewDateSelector />
              <button onClick={showImportGuide} className="btn-ghost flex items-center space-x-2">
                <HelpCircle className="h-4 w-4" />
                <span>Import Guide</span>
              </button>
              <button
                onClick={handleImport}
                disabled={isImporting}
                className="btn-primary flex items-center space-x-2"
                title="Import Tradervue CSV with deduplication"
              >
                <Upload className="h-4 w-4" />
                <span>{isImporting ? 'Importing...' : 'Import CSV'}</span>
              </button>
              <button onClick={handleNewTrade} className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Trade</span>
              </button>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-6">
        <div className="mx-auto max-w-7xl">
          {tradesError && (
            <div className="mb-4 p-4 bg-red-500/10 border border-red-500/20 rounded-lg">
              <p className="text-red-400 text-sm">Error loading trades: {tradesError}</p>
            </div>
          )}
          <TradesTable importedTrades={trades} isLoading={tradesLoading} selectedTradeId={selectedTradeId || undefined} onDeleteTrade={deleteTrade} />
        </div>
      </div>

      {/* New Trade Modal */}
      <NewTradeModal
        isOpen={isNewTradeModalOpen}
        onClose={() => setIsNewTradeModalOpen(false)}
        onSave={handleSaveNewTrade}
      />

      {/* Import Guide Modal */}
      <ImportGuideModal
        isOpen={isImportGuideOpen}
        onClose={() => setIsImportGuideOpen(false)}
      />

      {/* Trade Upload Modal with Deduplication */}
      <TradeUploadModal
        isOpen={isTradeUploadModalOpen}
        onClose={() => setIsTradeUploadModalOpen(false)}
        onUploadComplete={handleTradeUploadComplete}
      />
    </AppLayout>
  )
}

export default function TradesPage() {
  return <TradesPageContent />
}