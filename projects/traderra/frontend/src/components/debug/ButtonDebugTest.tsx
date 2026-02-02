'use client'

import React, { useState, useEffect } from 'react'
import { DollarSign, Percent, Target } from 'lucide-react'
import { useDisplayMode, DisplayMode } from '@/contexts/TraderraContext'

interface DebugButtonTestProps {
  position?: 'fixed' | 'relative'
}

export function DebugButtonTest({ position = 'fixed' }: DebugButtonTestProps) {
  const [testMode, setTestMode] = useState<'dollar' | 'percent' | 'r'>('dollar')
  const [clickCount, setClickCount] = useState(0)
  const [lastClickTime, setLastClickTime] = useState<string>('')
  const [isContextAvailable, setIsContextAvailable] = useState(false)
  const [contextError, setContextError] = useState<string>('')

  // Test DisplayModeContext availability
  let displayModeContext: any = null
  try {
    displayModeContext = useDisplayMode()
    setIsContextAvailable(true)
  } catch (error) {
    setContextError(error instanceof Error ? error.message : 'Context error')
    setIsContextAvailable(false)
  }

  console.log('🔍 DebugButtonTest rendered', {
    testMode,
    clickCount,
    isContextAvailable,
    contextError,
    displayModeContext: displayModeContext ? {
      displayMode: displayModeContext.displayMode,
      hasSetDisplayMode: typeof displayModeContext.setDisplayMode === 'function',
      hasToggleDisplayMode: typeof displayModeContext.toggleDisplayMode === 'function'
    } : null,
    timestamp: new Date().toISOString()
  })

  const handleSimpleClick = (mode: 'dollar' | 'percent' | 'r') => {
    const timestamp = new Date().toISOString()
    console.log('🎯 Simple button clicked', { mode, timestamp, clickCount: clickCount + 1 })

    setTestMode(mode)
    setClickCount(prev => prev + 1)
    setLastClickTime(timestamp)

    // Also try an alert to verify the click actually works
    alert(`Button clicked: ${mode} at ${timestamp}`)
  }

  const handleContextClick = (mode: DisplayMode) => {
    const timestamp = new Date().toISOString()
    console.log('🎯 Context button clicked', { mode, timestamp, isContextAvailable })

    if (displayModeContext && displayModeContext.setDisplayMode) {
      try {
        displayModeContext.setDisplayMode(mode)
        console.log('✅ Context setDisplayMode called successfully', { mode })
        alert(`Context button clicked: ${mode}`)
      } catch (error) {
        console.error('❌ Context setDisplayMode failed', error)
        alert(`Context error: ${error}`)
      }
    } else {
      console.error('❌ No context or setDisplayMode function available')
      alert('Context not available')
    }
  }

  const testAllClicks = () => {
    console.log('🔄 Testing all click handlers...')

    setTimeout(() => handleSimpleClick('dollar'), 100)
    setTimeout(() => handleContextClick('percent'), 200)
    setTimeout(() => handleSimpleClick('r'), 300)
  }

  const containerStyle = position === 'fixed' ? {
    position: 'fixed' as const,
    top: '10px',
    right: '10px',
    zIndex: 9999,
    background: '#ff0000',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #ffffff',
    minWidth: '300px'
  } : {
    background: '#ff0000',
    color: '#ffffff',
    padding: '20px',
    borderRadius: '8px',
    border: '2px solid #ffffff',
    margin: '20px 0'
  }

  return (
    <div style={containerStyle}>
      <h3 style={{ margin: '0 0 10px 0', fontSize: '16px', fontWeight: 'bold' }}>
        🔍 BUTTON DEBUG TEST
      </h3>

      {/* Status Information */}
      <div style={{ fontSize: '12px', marginBottom: '15px', lineHeight: '1.4' }}>
        <div>Current Test Mode: <strong>{testMode}</strong></div>
        <div>Total Clicks: <strong>{clickCount}</strong></div>
        <div>Last Click: <strong>{lastClickTime || 'None'}</strong></div>
        <div>Context Available: <strong>{isContextAvailable ? '✅ Yes' : '❌ No'}</strong></div>
        {contextError && <div>Context Error: <strong>{contextError}</strong></div>}
        {displayModeContext && (
          <div>Current Context Mode: <strong>{displayModeContext.displayMode}</strong></div>
        )}
      </div>

      {/* Simple Test Buttons */}
      <div style={{ marginBottom: '15px' }}>
        <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Simple Test Buttons:</h4>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button
            onClick={() => handleSimpleClick('dollar')}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: testMode === 'dollar' ? '#00ff00' : '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            $ TEST
          </button>
          <button
            onClick={() => handleSimpleClick('percent')}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: testMode === 'percent' ? '#00ff00' : '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            % TEST
          </button>
          <button
            onClick={() => handleSimpleClick('r')}
            style={{
              padding: '8px 12px',
              cursor: 'pointer',
              backgroundColor: testMode === 'r' ? '#00ff00' : '#ffffff',
              color: '#000000',
              border: 'none',
              borderRadius: '4px',
              fontWeight: 'bold'
            }}
          >
            R TEST
          </button>
        </div>
      </div>

      {/* Context Test Buttons */}
      {isContextAvailable && displayModeContext && (
        <div style={{ marginBottom: '15px' }}>
          <h4 style={{ margin: '0 0 8px 0', fontSize: '14px' }}>Context Test Buttons:</h4>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => handleContextClick('dollar')}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: displayModeContext.displayMode === 'dollar' ? '#00ff00' : '#ffff00',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              <DollarSign style={{ width: '16px', height: '16px', display: 'inline' }} />
              $
            </button>
            <button
              onClick={() => handleContextClick('percent')}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: displayModeContext.displayMode === 'percent' ? '#00ff00' : '#ffff00',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              <Percent style={{ width: '16px', height: '16px', display: 'inline' }} />
              %
            </button>
            <button
              onClick={() => handleContextClick('r')}
              style={{
                padding: '8px 12px',
                cursor: 'pointer',
                backgroundColor: displayModeContext.displayMode === 'r' ? '#00ff00' : '#ffff00',
                color: '#000000',
                border: 'none',
                borderRadius: '4px',
                fontWeight: 'bold'
              }}
            >
              <Target style={{ width: '16px', height: '16px', display: 'inline' }} />
              R
            </button>
          </div>
        </div>
      )}

      {/* Test All Button */}
      <div style={{ marginBottom: '10px' }}>
        <button
          onClick={testAllClicks}
          style={{
            padding: '10px 15px',
            cursor: 'pointer',
            backgroundColor: '#00ff00',
            color: '#000000',
            border: 'none',
            borderRadius: '4px',
            fontWeight: 'bold',
            width: '100%'
          }}
        >
          🔄 Test All Clicks
        </button>
      </div>

      {/* Instructions */}
      <div style={{ fontSize: '10px', lineHeight: '1.3' }}>
        <strong>Instructions:</strong><br />
        1. Check console for click events<br />
        2. Verify alerts appear on clicks<br />
        3. Test context integration<br />
        4. Look for any CSS blocking issues
      </div>
    </div>
  )
}

// Enhanced version with CSS investigation
export function CSSDebugOverlay() {
  const [debugInfo, setDebugInfo] = useState<any>(null)

  useEffect(() => {
    // Check for CSS issues that might block clicks
    const checkCSSIssues = () => {
      const elements = document.querySelectorAll('[class*="toggle"], [class*="button"], button')
      const issues: any[] = []

      elements.forEach((el, index) => {
        const styles = window.getComputedStyle(el)
        const rect = el.getBoundingClientRect()

        const elementInfo = {
          index,
          tagName: el.tagName,
          className: el.className,
          pointerEvents: styles.pointerEvents,
          zIndex: styles.zIndex,
          position: styles.position,
          display: styles.display,
          visibility: styles.visibility,
          opacity: styles.opacity,
          cursor: styles.cursor,
          width: rect.width,
          height: rect.height,
          top: rect.top,
          left: rect.left
        }

        // Check for potential issues
        if (styles.pointerEvents === 'none') {
          issues.push({ ...elementInfo, issue: 'pointer-events: none' })
        }
        if (styles.opacity === '0') {
          issues.push({ ...elementInfo, issue: 'opacity: 0' })
        }
        if (styles.display === 'none') {
          issues.push({ ...elementInfo, issue: 'display: none' })
        }
        if (styles.visibility === 'hidden') {
          issues.push({ ...elementInfo, issue: 'visibility: hidden' })
        }
        if (rect.width === 0 || rect.height === 0) {
          issues.push({ ...elementInfo, issue: 'zero dimensions' })
        }
      })

      setDebugInfo({
        totalElements: elements.length,
        issues,
        timestamp: new Date().toISOString()
      })

      console.log('🔍 CSS Debug Analysis', {
        totalElements: elements.length,
        issues,
        allElements: Array.from(elements).map((el, index) => {
          const styles = window.getComputedStyle(el)
          const rect = el.getBoundingClientRect()
          return {
            index,
            tagName: el.tagName,
            className: el.className,
            pointerEvents: styles.pointerEvents,
            zIndex: styles.zIndex,
            cursor: styles.cursor,
            dimensions: `${rect.width}x${rect.height}`,
            position: `${rect.left},${rect.top}`
          }
        })
      })
    }

    // Initial check
    checkCSSIssues()

    // Check again after a delay to catch dynamically loaded content
    const timer = setTimeout(checkCSSIssues, 2000)

    return () => clearTimeout(timer)
  }, [])

  if (!debugInfo) {
    return (
      <div style={{
        position: 'fixed',
        bottom: '10px',
        left: '10px',
        background: '#0000ff',
        color: '#ffffff',
        padding: '10px',
        borderRadius: '4px',
        zIndex: 9998,
        fontSize: '12px'
      }}>
        🔍 Analyzing CSS...
      </div>
    )
  }

  return (
    <div style={{
      position: 'fixed',
      bottom: '10px',
      left: '10px',
      background: '#0000ff',
      color: '#ffffff',
      padding: '15px',
      borderRadius: '8px',
      zIndex: 9998,
      fontSize: '12px',
      maxWidth: '400px',
      maxHeight: '300px',
      overflow: 'auto'
    }}>
      <h4 style={{ margin: '0 0 10px 0' }}>🔍 CSS Debug Info</h4>
      <div>Total Elements: {debugInfo.totalElements}</div>
      <div>Issues Found: {debugInfo.issues.length}</div>

      {debugInfo.issues.length > 0 && (
        <div style={{ marginTop: '10px' }}>
          <strong>Issues:</strong>
          {debugInfo.issues.map((issue: any, index: number) => (
            <div key={index} style={{
              margin: '5px 0',
              padding: '5px',
              background: 'rgba(255,255,255,0.1)',
              borderRadius: '3px'
            }}>
              <div>{issue.tagName}.{issue.className}</div>
              <div style={{ color: '#ffff00' }}>{issue.issue}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}