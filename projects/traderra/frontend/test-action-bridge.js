/**
 * Test script for Traderra Action Bridge
 * Run this in browser console to test the action bridge functionality
 */

// Test action bridge functionality
function testActionBridge() {
  console.log('🧪 Testing Traderra Action Bridge...')

  // Check if action bridge is available
  if (!window.traderraActionBridge) {
    console.error('❌ Action bridge not found on window object')
    return
  }

  // Get status
  const status = window.traderraActionBridge.getStatus()
  console.log('📊 Action Bridge Status:', status)

  // Test navigation action
  console.log('\n🧭 Testing navigation action...')
  const navAction = {
    type: 'navigateToPage',
    payload: { page: 'dashboard' },
    timestamp: Date.now()
  }

  window.traderraExecuteActions([navAction])

  // Test display mode action
  console.log('\n🎨 Testing display mode action...')
  setTimeout(() => {
    const displayAction = {
      type: 'setDisplayMode',
      payload: { mode: 'r' },
      timestamp: Date.now()
    }
    window.traderraExecuteActions([displayAction])
  }, 2000)

  // Test date range action
  console.log('\n📅 Testing date range action...')
  setTimeout(() => {
    const dateAction = {
      type: 'setDateRange',
      payload: { range: '90day' },
      timestamp: Date.now()
    }
    window.traderraExecuteActions([dateAction])
  }, 4000)

  // Test multiple actions (this should work with CopilotKit)
  console.log('\n🚀 Testing multiple actions (CopilotKit simulation)...')
  setTimeout(() => {
    const multiActions = [
      {
        type: 'navigateToPage',
        payload: { page: 'statistics' },
        timestamp: Date.now()
      },
      {
        type: 'setDisplayMode',
        payload: { mode: 'percent' },
        timestamp: Date.now() + 1
      },
      {
        type: 'setDateRange',
        payload: { range: 'ytd' },
        timestamp: Date.now() + 2
      }
    ]
    window.traderraExecuteActions(multiActions)
  }, 6000)

  console.log('✅ Test initiated! Check console for action execution logs...')
}

// Test CopilotKit action event dispatch
function testCopilotKitEventDispatch() {
  console.log('🧪 Testing CopilotKit event dispatch...')

  const copilotActions = [
    {
      type: 'navigateToPage',
      payload: { page: 'trades' },
      timestamp: Date.now()
    },
    {
      type: 'setDisplayMode',
      payload: { mode: 'dollar' },
      timestamp: Date.now() + 1
    },
    {
      type: 'setDateRange',
      payload: { range: 'month' },
      timestamp: Date.now() + 2
    }
  ]

  console.log('📡 Dispatching CopilotKit-style event:', copilotActions)
  window.dispatchEvent(new CustomEvent('traderra-actions', {
    detail: copilotActions
  }))
}

// Test custom date patterns that should work with CopilotKit
function testCustomDatePatterns() {
  console.log('🗓️ Testing custom date patterns...')

  const customDateActions = [
    {
      type: 'setDateRange',
      payload: { range: '90day' }, // Should match "last 90 days"
      timestamp: Date.now()
    }
  ]

  window.traderraExecuteActions(customDateActions)
}

// Export functions for manual testing
window.testActionBridge = testActionBridge
window.testCopilotKitEventDispatch = testCopilotKitEventDispatch
window.testCustomDatePatterns = testCustomDatePatterns

console.log('🎯 Action Bridge Test Suite Loaded!')
console.log('Run testActionBridge() to test basic functionality')
console.log('Run testCopilotKitEventDispatch() to test CopilotKit event handling')