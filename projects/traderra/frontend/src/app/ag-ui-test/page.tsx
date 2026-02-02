/**
 * AG-UI Tools Test Page
 *
 * This page is used to test all AG-UI frontend tools.
 * It provides buttons to execute each tool and displays the results.
 */

'use client'

import { useState } from 'react'
import { useFrontendTools } from '@/hooks/useAGUITools'
import { AppLayout } from '@/components/layout/app-layout'
import { createAGUIChatHandler } from '@/lib/ag-ui/agui-chat-service'
import { DateRangeSelector } from '@/components/ui/date-range-selector'

interface ToolResult {
  success: boolean
  message?: string
  error?: string
  data?: any
}

export default function AGUITestPage() {
  const [results, setResults] = useState<Record<string, ToolResult>>({})
  const [chatResponse, setChatResponse] = useState<any>(null)
  const [chatLoading, setChatLoading] = useState(false)
  const [chatInput, setChatInput] = useState('Navigate to the trades page')
  const [testInputs, setTestInputs] = useState({
    page: 'dashboard',
    dateRange: '30d',
    displayMode: 'dollar',
    pnlMode: 'net',
    accountSize: '50000',
    journalTitle: 'Test Entry',
    journalContent: 'This is a test journal entry',
    searchQuery: 'AAPL',
  })

  const { executeTool } = useFrontendTools()

  const executeAndRecord = async (toolName: string, args: any) => {
    console.log(`🧪 Testing tool: ${toolName}`, args)
    const result = await executeTool(toolName, args)
    setResults(prev => ({ ...prev, [toolName]: result }))
    return result
  }

  const testAGUIChat = async () => {
    setChatLoading(true)
    setChatResponse(null)

    try {
      console.log(`[AG-UI] Testing chat with message: "${chatInput}"`)

      // Create handler with executeTool function
      const handler = createAGUIChatHandler(executeTool)

      // Send message and execute returned tool calls
      const response = await handler.sendMessage(chatInput)

      console.log('[AG-UI] Chat response:', response)
      setChatResponse(response)
    } catch (error) {
      console.error('[AG-UI] Chat test failed:', error)
      setChatResponse({ error: String(error) })
    } finally {
      setChatLoading(false)
    }
  }

  const Button = ({ onClick, children, className = '' }: { onClick: () => void; children: React.ReactNode; className?: string }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 bg-primary text-white rounded hover:bg-primary/90 transition-colors ${className}`}
    >
      {children}
    </button>
  )

  const Card = ({ children, className = '' }: { children: React.ReactNode; className?: string }) => (
    <div className={`bg-[#0f0f0f] border border-[#1a1a1a] rounded-lg p-6 ${className}`}>{children}</div>
  )

  const Input = ({ value, onChange, placeholder, className = '' }: { value: string; onChange: (e: any) => void; placeholder?: string; className?: string }) => (
    <input
      type="text"
      value={value}
      onChange={onChange}
      placeholder={placeholder}
      className={`px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white ${className}`}
    />
  )

  return (
    <AppLayout
      pageClassName="min-h-screen"
      showPageHeader={true}
      pageHeaderContent={
        <div className="px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-white">AG-UI Tools Test</h1>
              <p className="text-sm text-gray-400">Test all frontend tools</p>
            </div>
          </div>
        </div>
      }
    >
      <div className="p-6 max-w-7xl mx-auto space-y-6">
        {/* Description */}
        <Card>
          <h2 className="text-xl font-bold text-white mb-2">AG-UI Frontend Tools</h2>
          <p className="text-sm text-gray-400">
            Test all frontend tools that the AI agent can call directly.
            These tools replace the brittle DOM scraping approach.
          </p>
        </Card>

        {/* AG-UI Chat Test */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">AG-UI Chat Test (End-to-End)</h3>
          <p className="text-sm text-gray-400 mb-4">
            Test the full AG-UI chat flow: Send a natural language message to the backend,
            get tool calls back, and execute them on the frontend.
          </p>
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Input
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Enter a natural language command..."
                className="flex-1"
              />
              <Button onClick={testAGUIChat} disabled={chatLoading}>
                {chatLoading ? 'Sending...' : 'Send to AG-UI'}
              </Button>
            </div>

            {/* Quick test commands */}
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => setChatInput('Navigate to the trades page')}
                className="text-xs px-2 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              >
                Navigate to trades
              </Button>
              <Button
                onClick={() => setChatInput('Show me the last 30 days')}
                className="text-xs px-2 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              >
                30 days
              </Button>
              <Button
                onClick={() => setChatInput('Change to percent display mode')}
                className="text-xs px-2 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              >
                Percent mode
              </Button>
              <Button
                onClick={() => setChatInput('Go to journal')}
                className="text-xs px-2 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              >
                Go to journal
              </Button>
              <Button
                onClick={() => setChatInput('Set custom date range from December 1, 2024 to December 31, 2024')}
                className="text-xs px-2 py-1 bg-[#1a1a1a] hover:bg-[#2a2a2a]"
              >
                Custom date range (Dec 2024)
              </Button>
            </div>

            {/* Chat Response */}
            {chatResponse && (
              <div className="mt-4 p-4 bg-[#0a0a0a] rounded border border-[#1a1a1a]">
                <h4 className="text-sm font-semibold text-white mb-2">Backend Response:</h4>
                {chatResponse.error ? (
                  <div className="text-red-400 text-sm">{chatResponse.error}</div>
                ) : (
                  <div className="space-y-2">
                    <div className="text-sm">
                      <span className="text-gray-400">Response:</span>{' '}
                      <span className="text-white">{chatResponse.response}</span>
                    </div>
                    {chatResponse.tool_calls && chatResponse.tool_calls.length > 0 && (
                      <div className="text-sm">
                        <span className="text-gray-400">Tool Calls:</span>
                        <pre className="mt-1 text-xs text-green-400">
                          {JSON.stringify(chatResponse.tool_calls, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
        </Card>

        {/* Date Range GUI */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Date Range Selector GUI</h3>
          <p className="text-sm text-gray-400 mb-4">
            Interactive date range picker with calendar GUI. Click the button below to open the date range selector, then choose "Custom Range" to set specific start and end dates.
          </p>
          <div className="flex items-center gap-4">
            <DateRangeSelector className="min-w-[250px]" />
          </div>
          <div className="mt-4 p-3 bg-[#0a0a0a] rounded border border-[#1a1a1a]">
            <p className="text-xs text-gray-400">
              💡 <strong>Tip:</strong> The AG-UI system can control this date range through natural language. Try asking Renata:
              <span className="text-green-400 ml-1">"Show me data from Jan 1 to Mar 31 2024"</span> or
              <span className="text-green-400 ml-1">"Set custom date range from last month"</span>
            </p>
          </div>
        </Card>

        {/* Navigation Tools */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Navigation Tools</h3>
          <div className="flex items-center gap-4">
            <select
              value={testInputs.page}
              onChange={(e) => setTestInputs({ ...testInputs, page: e.target.value })}
              className="px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white"
            >
              <option value="dashboard">Dashboard</option>
              <option value="trades">Trades</option>
              <option value="journal">Journal</option>
              <option value="analytics">Analytics</option>
              <option value="calendar">Calendar</option>
              <option value="settings">Settings</option>
              <option value="daily-summary">Daily Summary</option>
            </select>
            <Button onClick={() => executeAndRecord('navigateToPage', { page: testInputs.page })}>
              Test Navigate
            </Button>
            {results.navigateToPage && (
              <div className={`text-sm ${results.navigateToPage.success ? 'text-green-400' : 'text-red-400'}`}>
                {results.navigateToPage.message || results.navigateToPage.error}
              </div>
            )}
          </div>
        </Card>

        {/* Display Tools */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Display Tools</h3>
          <div className="space-y-4">
            {/* Date Range */}
            <div className="flex items-center gap-4">
              <select
                value={testInputs.dateRange}
                onChange={(e) => setTestInputs({ ...testInputs, dateRange: e.target.value })}
                className="px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white"
              >
                <option value="today">Today</option>
                <option value="7d">7 Days</option>
                <option value="30d">30 Days</option>
                <option value="90d">90 Days</option>
                <option value="ytd">Year to Date</option>
                <option value="1y">1 Year</option>
                <option value="all">All Time</option>
              </select>
              <Button onClick={() => executeAndRecord('setDateRange', { range: testInputs.dateRange })}>
                Test Set Date Range
              </Button>
              {results.setDateRange && (
                <div className={`text-sm ${results.setDateRange.success ? 'text-green-400' : 'text-red-400'}`}>
                  {results.setDateRange.message || results.setDateRange.error}
                </div>
              )}
            </div>

            {/* Display Mode */}
            <div className="flex items-center gap-4">
              <select
                value={testInputs.displayMode}
                onChange={(e) => setTestInputs({ ...testInputs, displayMode: e.target.value })}
                className="px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white"
              >
                <option value="dollar">Dollar</option>
                <option value="percent">Percent</option>
                <option value="r-multiple">R-Multiple</option>
              </select>
              <Button onClick={() => executeAndRecord('setDisplayMode', { mode: testInputs.displayMode })}>
                Test Set Display Mode
              </Button>
              {results.setDisplayMode && (
                <div className={`text-sm ${results.setDisplayMode.success ? 'text-green-400' : 'text-red-400'}`}>
                  {results.setDisplayMode.message || results.setDisplayMode.error}
                </div>
              )}
            </div>

            {/* P&L Mode */}
            <div className="flex items-center gap-4">
              <select
                value={testInputs.pnlMode}
                onChange={(e) => setTestInputs({ ...testInputs, pnlMode: e.target.value })}
                className="px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white"
              >
                <option value="net">Net</option>
                <option value="gross">Gross</option>
              </select>
              <Button onClick={() => executeAndRecord('setPnLMode', { mode: testInputs.pnlMode })}>
                Test Set P&L Mode
              </Button>
              {results.setPnLMode && (
                <div className={`text-sm ${results.setPnLMode.success ? 'text-green-400' : 'text-red-400'}`}>
                  {results.setPnLMode.message || results.setPnLMode.error}
                </div>
              )}
            </div>

            {/* Account Size */}
            <div className="flex items-center gap-4">
              <Input
                type="number"
                value={testInputs.accountSize}
                onChange={(e) => setTestInputs({ ...testInputs, accountSize: e.target.value })}
                className="w-48"
                placeholder="Account size"
              />
              <Button onClick={() => executeAndRecord('setAccountSize', { size: Number(testInputs.accountSize) })}>
                Test Set Account Size
              </Button>
              {results.setAccountSize && (
                <div className={`text-sm ${results.setAccountSize.success ? 'text-green-400' : 'text-red-400'}`}>
                  {results.setAccountSize.message || results.setAccountSize.error}
                </div>
              )}
            </div>
          </div>
        </Card>

        {/* Journal Tools */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Journal Tools</h3>
          <div className="space-y-2">
            <Input
              value={testInputs.journalTitle}
              onChange={(e) => setTestInputs({ ...testInputs, journalTitle: e.target.value })}
              placeholder="Journal title"
            />
            <textarea
              value={testInputs.journalContent}
              onChange={(e) => setTestInputs({ ...testInputs, journalContent: e.target.value })}
              placeholder="Journal content"
              className="px-3 py-2 bg-[#0a0a0a] border border-[#1a1a1a] rounded text-white min-h-[100px] w-full"
            />
            <Button
              onClick={() =>
                executeAndRecord('createJournalEntry', {
                  date: new Date().toISOString().split('T')[0],
                  title: testInputs.journalTitle,
                  content: testInputs.journalContent,
                })
              }
            >
              Test Create Journal Entry
            </Button>
            {results.createJournalEntry && (
              <div className={`text-sm ${results.createJournalEntry.success ? 'text-green-400' : 'text-red-400'}`}>
                {results.createJournalEntry.message || results.createJournalEntry.error}
              </div>
            )}
          </div>
        </Card>

        {/* Search/Filter Tools */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">Search & Filter Tools</h3>
          <div className="flex items-center gap-4">
            <Input
              value={testInputs.searchQuery}
              onChange={(e) => setTestInputs({ ...testInputs, searchQuery: e.target.value })}
              placeholder="Search query"
              className="w-64"
            />
            <Button onClick={() => executeAndRecord('setSearchQuery', { query: testInputs.searchQuery })}>
              Test Set Search Query
            </Button>
            {results.setSearchQuery && (
              <div className={`text-sm ${results.setSearchQuery.success ? 'text-green-400' : 'text-red-400'}`}>
                {results.setSearchQuery.message || results.setSearchQuery.error}
              </div>
            )}
          </div>
        </Card>

        {/* All Results */}
        <Card>
          <h3 className="text-lg font-semibold text-white mb-4">All Results</h3>
          <pre className="bg-[#0a0a0a] p-4 rounded overflow-auto text-xs text-gray-300">
            {JSON.stringify(results, null, 2)}
          </pre>
        </Card>
      </div>
    </AppLayout>
  )
}
