'use client'

import { useState } from 'react'

export default function AguiTestPage() {
  const [message, setMessage] = useState('')
  const [response, setResponse] = useState('')
  const [loading, setLoading] = useState(false)
  const [lastTest, setLastTest] = useState('')

  const testAGUI = async (testMessage: string) => {
    setLoading(true)
    setLastTest(testMessage)
    setMessage(testMessage)

    try {
      const response = await fetch('/api/agui', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: testMessage })
      })

      const data = await response.json()
      setResponse(data.message || data.response || JSON.stringify(data))
    } catch (error) {
      setResponse(`Error: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }

    setLoading(false)
  }

  const quickTests = [
    {
      name: "R-Multiple Mode Fix",
      message: "Switch to R-multiple mode",
      description: "This should be interpreted as display mode change, NOT stock symbol R"
    },
    {
      name: "Calendar Navigation",
      message: "Show me this year on the calendar",
      description: "Should navigate to /calendar page and set date range to this year"
    },
    {
      name: "Calendar in R-Multiple",
      message: "Can we look at the calendar view for this year in R?",
      description: "Should navigate to /calendar + set year range + R-multiple display mode"
    },
    {
      name: "Trades Page Navigation",
      message: "Check my trades from last month",
      description: "Should navigate to /trades and filter for last month"
    },
    {
      name: "Journal Navigation",
      message: "Navigate to the journal page",
      description: "Should understand this as navigation to /journal"
    },
    {
      name: "Stock Symbol Test",
      message: "Show me AAPL stock information",
      description: "Should correctly identify this as actual stock symbol request"
    },
    {
      name: "Analytics Navigation",
      message: "Open the analytics reports",
      description: "Should navigate to /analytics page"
    }
  ]

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-4">
          🧪 AG-UI Testing Interface
        </h1>
        <div className="rounded-lg border border-gray-600 bg-gray-800 p-6">
          <h2 className="text-xl font-semibold mb-4 text-green-400">
            ✅ Core R-Multiple Fix Implemented
          </h2>

          <div className="bg-green-900/20 p-4 rounded border border-green-500/30 mb-4">
            <h3 className="text-green-400 font-semibold mb-2">🎯 Problem Solved</h3>
            <p className="text-gray-300"><strong>Before:</strong> "Switch to R-multiple mode" incorrectly parsed as stock symbol "R"</p>
            <p className="text-gray-300"><strong>After:</strong> Enhanced system prompt correctly identifies as display mode change</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="bg-blue-900/20 p-4 rounded border border-blue-500/30">
              <h4 className="text-blue-400 font-semibold mb-2">✅ Implementation Status</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• Enhanced system prompt active</li>
                <li>• R-multiple parsing rules implemented</li>
                <li>• Independent OpenRouter integration</li>
                <li>• No dependency conflicts</li>
              </ul>
            </div>
            <div className="bg-purple-900/20 p-4 rounded border border-purple-500/30">
              <h4 className="text-purple-400 font-semibold mb-2">🧪 Test Commands</h4>
              <ul className="text-sm text-gray-300 space-y-1">
                <li>• "Switch to R-multiple mode"</li>
                <li>• "Show last month data"</li>
                <li>• "Navigate to journal"</li>
                <li>• "AAPL stock info" (control)</li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Test Buttons */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Quick Tests</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {quickTests.map((test, index) => (
            <div key={index} className="bg-gray-800 p-4 rounded-lg border border-gray-600">
              <h4 className="font-semibold text-white mb-2">{test.name}</h4>
              <p className="text-sm text-gray-400 mb-3">{test.description}</p>
              <button
                onClick={() => testAGUI(test.message)}
                disabled={loading}
                className="bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 text-white px-4 py-2 rounded text-sm transition-colors w-full"
              >
                {loading && lastTest === test.message ? 'Testing...' : 'Test'}
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Custom Input */}
      <div className="mb-8">
        <h3 className="text-lg font-semibold text-white mb-4">Custom Test</h3>
        <div className="flex gap-4">
          <input
            type="text"
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="Enter your test message..."
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-600 rounded text-white placeholder-gray-400 focus:outline-none focus:border-blue-500"
            onKeyPress={(e) => e.key === 'Enter' && !loading && message.trim() && testAGUI(message)}
          />
          <button
            onClick={() => testAGUI(message)}
            disabled={loading || !message.trim()}
            className="bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white px-6 py-2 rounded transition-colors"
          >
            {loading ? 'Testing...' : 'Send'}
          </button>
        </div>
      </div>

      {/* Response Display */}
      {response && (
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-white mb-4">Response</h3>
          <div className="bg-gray-900 border border-gray-700 rounded-lg p-4">
            <div className="mb-2">
              <span className="text-gray-400 text-sm">Input: </span>
              <span className="text-blue-400">{lastTest}</span>
            </div>
            <div className="border-t border-gray-700 pt-3 mt-3">
              <span className="text-gray-400 text-sm">AI Response: </span>
              <div className="text-white mt-2 whitespace-pre-wrap">{response}</div>
            </div>
          </div>
        </div>
      )}

      {/* Implementation Details */}
      <div className="bg-gray-800 rounded-lg p-6 border border-gray-600">
        <h3 className="text-lg font-semibold text-white mb-4">Implementation Details</h3>

        <div className="space-y-4 text-sm">
          <div className="bg-yellow-900/20 p-3 rounded border border-yellow-500/30">
            <h4 className="text-yellow-400 font-semibold mb-2">🔧 Enhanced System Prompt</h4>
            <p className="text-gray-300">Added explicit behavioral rules that prevent "R-multiple" from being interpreted as stock symbol "R"</p>
          </div>

          <div className="bg-green-900/20 p-3 rounded border border-green-500/30">
            <h4 className="text-green-400 font-semibold mb-2">⚡ Direct OpenRouter Integration</h4>
            <p className="text-gray-300">Bypasses problematic dependencies by implementing custom AG-UI compatibility layer</p>
          </div>

          <div className="bg-blue-900/20 p-3 rounded border border-blue-500/30">
            <h4 className="text-blue-400 font-semibold mb-2">🎯 Expected Behavior</h4>
            <ul className="text-gray-300 list-disc pl-5 space-y-1">
              <li>"Switch to R-multiple mode" → Display mode change acknowledgment</li>
              <li>"Show AAPL data" → Stock symbol recognition and appropriate response</li>
              <li>"Navigate to journal" → Page navigation acknowledgment</li>
              <li>"Show last month" → Date range change acknowledgment</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}