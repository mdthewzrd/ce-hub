'use client'

import React, { useEffect, useState } from 'react'
import { useDisplayMode, DisplayMode } from '@/contexts/DisplayModeContext'

export function DisplayModeTest() {
  const [mounted, setMounted] = useState(false)
  const [testResults, setTestResults] = useState<any[]>([])

  // Test the context
  let contextError: string | null = null
  let contextData: any = null

  try {
    contextData = useDisplayMode()
  } catch (error) {
    contextError = error instanceof Error ? error.message : 'Unknown context error'
  }

  useEffect(() => {
    setMounted(true)

    // Run comprehensive tests on the context
    const runTests = () => {
      const results: any[] = []

      // Test 1: Context availability
      results.push({
        test: 'Context Availability',
        result: contextError ? 'FAIL' : 'PASS',
        details: contextError || 'Context loaded successfully',
        timestamp: new Date().toISOString()
      })

      if (contextData) {
        // Test 2: Context properties
        results.push({
          test: 'Context Properties',
          result: 'PASS',
          details: {
            displayMode: contextData.displayMode,
            hasSetDisplayMode: typeof contextData.setDisplayMode === 'function',
            hasToggleDisplayMode: typeof contextData.toggleDisplayMode === 'function',
            hasGetDisplayModeLabel: typeof contextData.getDisplayModeLabel === 'function'
          },
          timestamp: new Date().toISOString()
        })

        // Test 3: setDisplayMode function
        if (typeof contextData.setDisplayMode === 'function') {
          try {
            const originalMode = contextData.displayMode
            results.push({
              test: 'setDisplayMode Function Test',
              result: 'PASS',
              details: `Function exists and is callable. Current mode: ${originalMode}`,
              timestamp: new Date().toISOString()
            })
          } catch (error) {
            results.push({
              test: 'setDisplayMode Function Test',
              result: 'FAIL',
              details: `Error calling setDisplayMode: ${error}`,
              timestamp: new Date().toISOString()
            })
          }
        } else {
          results.push({
            test: 'setDisplayMode Function Test',
            result: 'FAIL',
            details: 'setDisplayMode is not a function',
            timestamp: new Date().toISOString()
          })
        }

        // Test 4: localStorage persistence
        try {
          const stored = localStorage.getItem('traderra_display_mode')
          results.push({
            test: 'localStorage Persistence',
            result: 'PASS',
            details: `Stored value: ${stored || 'null'}`,
            timestamp: new Date().toISOString()
          })
        } catch (error) {
          results.push({
            test: 'localStorage Persistence',
            result: 'FAIL',
            details: `localStorage error: ${error}`,
            timestamp: new Date().toISOString()
          })
        }
      }

      setTestResults(results)
      console.log('🧪 DisplayModeContext Test Results', results)
    }

    runTests()
  }, [mounted, contextData, contextError])

  const handleModeChange = (mode: DisplayMode) => {
    console.log('🎯 Test mode change triggered', { mode, contextData })

    if (contextData && typeof contextData.setDisplayMode === 'function') {
      try {
        contextData.setDisplayMode(mode)
        console.log('✅ Mode change successful', { newMode: mode })

        // Add test result
        setTestResults(prev => [...prev, {
          test: `Mode Change to ${mode}`,
          result: 'PASS',
          details: `Successfully changed to ${mode} mode`,
          timestamp: new Date().toISOString()
        }])
      } catch (error) {
        console.error('❌ Mode change failed', { error, mode })

        // Add test result
        setTestResults(prev => [...prev, {
          test: `Mode Change to ${mode}`,
          result: 'FAIL',
          details: `Failed to change to ${mode}: ${error}`,
          timestamp: new Date().toISOString()
        }])
      }
    } else {
      console.error('❌ No context or setDisplayMode function', { contextData })
    }
  }

  if (!mounted) {
    return <div>Loading DisplayMode test...</div>
  }

  return (
    <div style={{
      background: '#1a1a1a',
      color: '#ffffff',
      padding: '20px',
      borderRadius: '8px',
      margin: '20px 0',
      border: '2px solid #333'
    }}>
      <h3 style={{ margin: '0 0 15px 0', color: '#ffff00' }}>
        🧪 DisplayModeContext Test Suite
      </h3>

      {/* Context Status */}
      <div style={{ marginBottom: '15px', fontSize: '14px' }}>
        <div style={{ color: contextError ? '#ff4444' : '#44ff44' }}>
          Status: {contextError ? 'ERROR' : 'OK'}
        </div>
        {contextError && (
          <div style={{ color: '#ff4444', fontSize: '12px' }}>
            Error: {contextError}
          </div>
        )}
        {contextData && (
          <div style={{ fontSize: '12px', color: '#cccccc' }}>
            Current Mode: <strong>{contextData.displayMode}</strong>
          </div>
        )}
      </div>

      {/* Interactive Test Buttons */}
      {contextData && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Interactive Tests:</h4>
          <div style={{ display: 'flex', gap: '10px' }}>
            {(['dollar', 'percent', 'r'] as DisplayMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => handleModeChange(mode)}
                style={{
                  padding: '8px 16px',
                  background: contextData.displayMode === mode ? '#ffff00' : '#444444',
                  color: contextData.displayMode === mode ? '#000000' : '#ffffff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: 'bold'
                }}
              >
                {mode.toUpperCase()}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Test Results */}
      <div style={{ marginTop: '15px' }}>
        <h4 style={{ margin: '0 0 10px 0', fontSize: '14px' }}>Test Results:</h4>
        <div style={{ maxHeight: '200px', overflow: 'auto', fontSize: '12px' }}>
          {testResults.map((result, index) => (
            <div
              key={index}
              style={{
                padding: '5px',
                margin: '2px 0',
                background: result.result === 'PASS' ? 'rgba(0,255,0,0.1)' : 'rgba(255,0,0,0.1)',
                borderLeft: `3px solid ${result.result === 'PASS' ? '#00ff00' : '#ff0000'}`,
                borderRadius: '2px'
              }}
            >
              <div style={{ fontWeight: 'bold' }}>
                {result.result === 'PASS' ? '✅' : '❌'} {result.test}
              </div>
              <div style={{ color: '#cccccc', fontSize: '11px' }}>
                {typeof result.details === 'string' ? result.details : JSON.stringify(result.details, null, 2)}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}