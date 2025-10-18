'use client'

import { useState } from 'react'
import { Plus, Upload } from 'lucide-react'
import { TopNavigation } from '@/components/layout/top-nav'
import { TradesTable } from '@/components/trades/trades-table'
import { RenataChat } from '@/components/dashboard/renata-chat'
import { NewTradeModal } from '@/components/trades/new-trade-modal'
import { TraderViewDateSelector } from '@/components/ui/traderview-date-selector'
import { DateRangeProvider } from '@/contexts/DateRangeContext'

function TradesPageContent() {
  const [aiSidebarOpen, setAiSidebarOpen] = useState(true)
  const [isNewTradeModalOpen, setIsNewTradeModalOpen] = useState(false)

  const handleImport = () => {
    // Create a file input element
    const input = document.createElement('input')
    input.type = 'file'
    input.accept = '.csv,.xlsx,.xls'
    input.onchange = (e) => {
      const file = (e.target as HTMLInputElement).files?.[0]
      if (file) {
        // TODO: Implement file parsing and trade import
        console.log('Importing file:', file.name)
        alert(`Import functionality coming soon! Selected file: ${file.name}`)
      }
    }
    input.click()
  }

  const handleNewTrade = () => {
    setIsNewTradeModalOpen(true)
  }

  const handleSaveNewTrade = (newTrade: any) => {
    // TODO: Add the trade to your data store/API
    console.log('Saving new trade:', newTrade)
    // For now, just log it. In a real app, you'd save to your backend
  }

  return (
    <div className="flex h-screen studio-bg">
      {/* Main content container with top navigation */}
      <div className="flex flex-1 flex-col overflow-hidden">
        {/* Top Navigation */}
        <TopNavigation onAiToggle={() => setAiSidebarOpen(!aiSidebarOpen)} aiOpen={aiSidebarOpen} />

        {/* Page Header */}
        <div className="studio-surface border-b border-[#1a1a1a] px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-xl font-semibold studio-text">Trade History</h1>
            <div className="flex items-center space-x-4">
              <TraderViewDateSelector />
              <button onClick={handleImport} className="btn-ghost flex items-center space-x-2">
                <Upload className="h-4 w-4" />
                <span>Import</span>
              </button>
              <button onClick={handleNewTrade} className="btn-primary flex items-center space-x-2">
                <Plus className="h-4 w-4" />
                <span>New Trade</span>
              </button>
            </div>
          </div>
        </div>

        {/* Trades content */}
        <main className="flex-1 overflow-auto p-6">
          <div className="mx-auto max-w-7xl">
            <TradesTable />
          </div>
        </main>
      </div>

      {/* AI Sidebar - Renata Chat */}
      {aiSidebarOpen && (
        <div className="w-[600px] studio-surface border-l border-[#1a1a1a] z-40">
          <RenataChat />
        </div>
      )}

      {/* New Trade Modal */}
      <NewTradeModal
        isOpen={isNewTradeModalOpen}
        onClose={() => setIsNewTradeModalOpen(false)}
        onSave={handleSaveNewTrade}
      />
    </div>
  )
}

export default function TradesPage() {
  return (
    <DateRangeProvider>
      <TradesPageContent />
    </DateRangeProvider>
  )
}