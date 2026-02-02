'use client'

/**
 * Multi-Agent System Test Page
 *
 * Simple test page to verify the agent system is working correctly.
 */

import { useEffect, useState } from 'react'
import { Loader2, CheckCircle2, XCircle, Send } from 'lucide-react'

export default function AgentTestPage() {
  const [status, setStatus] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [testMessage, setTestMessage] = useState('Hello Renata!')
  const [testResponse, setTestResponse] = useState<any>(null)
  const [testing, setTesting] = useState(false)

  // Check agent system status on mount
  useEffect(() => {
    const checkStatus = async () => {
      try {
        const response = await fetch('/api/agents/chat')
        const data = await response.json()
        setStatus(data)
        setLoading(false)
      } catch (error) {
        console.error('Failed to fetch status:', error)
        setStatus({ error: 'Failed to connect to agent system' })
        setLoading(false)
      }
    }

    checkStatus()

    // Poll every 3 seconds
    const interval = setInterval(checkStatus, 3000)
    return () => clearInterval(interval)
  }, [])

  // Test agent communication
  const testAgent = async () => {
    setTesting(true)
    setTestResponse(null)

    try {
      const response = await fetch('/api/agents/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: testMessage,
          context: {
            userId: 'test-user',
            currentPage: 'agent-test'
          }
        })
      })

      const data = await response.json()
      setTestResponse(data)
    } catch (error) {
      setTestResponse({ error: (error as Error).message })
    } finally {
      setTesting(false)
    }
  }

  return (
    <div className="min-h-screen bg-studio-bg studio-text p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-8">Multi-Agent System Test</h1>

        {/* Status Section */}
        <div className="studio-surface border border-border rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">System Status</h2>

          {loading ? (
            <div className="flex items-center gap-3">
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Checking agent system status...</span>
            </div>
          ) : status?.error ? (
            <div className="flex items-center gap-3 text-red-400">
              <XCircle className="w-5 h-5" />
              <span>{status.error}</span>
            </div>
          ) : status?.ready ? (
            <div className="flex items-center gap-3 text-green-400">
              <CheckCircle2 className="w-5 h-5" />
              <span>
                Agent system ready! {status.agentsRegistered} agents registered,
                {status.agentsHealthy} healthy
              </span>
            </div>
          ) : (
            <div className="flex items-center gap-3 text-yellow-400">
              <Loader2 className="w-5 h-3 animate-spin" />
              <span>Agent system initializing...</span>
            </div>
          )}

          {/* Detailed Status */}
          {status?.status && (
            <div className="mt-4 p-4 bg-black/30 rounded font-mono text-sm">
              <pre>{JSON.stringify(status.status, null, 2)}</pre>
            </div>
          )}
        </div>

        {/* Test Section */}
        <div className="studio-surface border border-border rounded-lg p-6">
          <h2 className="text-xl font-semibold mb-4">Test Agent Communication</h2>

          <div className="flex gap-3 mb-4">
            <input
              type="text"
              value={testMessage}
              onChange={(e) => setTestMessage(e.target.value)}
              className="flex-1 px-4 py-2 bg-studio-bg border border-border rounded-lg studio-text focus:outline-none focus:ring-2 focus:ring-primary"
              placeholder="Enter a test message..."
            />
            <button
              onClick={testAgent}
              disabled={testing || !status?.ready}
              className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
            >
              {testing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Testing...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4" />
                  Send Test
                </>
              )}
            </button>
          </div>

          {/* Test Response */}
          {testResponse && (
            <div className="p-4 bg-black/30 rounded-lg">
              <h3 className="font-semibold mb-2">Response:</h3>
              <pre className="text-sm overflow-x-auto">
                {JSON.stringify(testResponse, null, 2)}
              </pre>
            </div>
          )}
        </div>

        {/* Instructions */}
        <div className="mt-6 p-4 bg-blue-500/10 border border-blue-500/30 rounded-lg">
          <h3 className="font-semibold mb-2">How to use this test page:</h3>
          <ol className="list-decimal list-inside space-y-1 text-sm">
            <li>Wait for the agent system to show "ready" status</li>
            <li>Enter a test message in the input field</li>
            <li>Click "Send Test" to send the message to the agent system</li>
            <li>View the response below to verify the agent is working correctly</li>
          </ol>
        </div>
      </div>
    </div>
  )
}
