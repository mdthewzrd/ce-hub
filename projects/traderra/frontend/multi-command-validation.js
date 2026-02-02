/**
 * Comprehensive Multi-Command Validation Script
 * Tests if CopilotKit commands actually make proper state changes
 * Run this in browser console with Renata chat open
 */

// Helper function to simulate CopilotKit multi-commands
function simulateCopilotMultiCommand(testName, commands) {
  console.log(`\n🧪 ${testName}`)
  console.log('📦 Commands:', commands)

  const actions = commands.map(cmd => ({
    type: cmd.type,
    payload: cmd.payload,
    timestamp: Date.now() + commands.indexOf(cmd) // Add small delay for sequencing
  }))

  console.log('🚀 Dispatching multi-command event...')
  window.dispatchEvent(new CustomEvent('traderra-actions', {
    detail: actions
  }))

  return actions
}

// Test 1: Complex multi-command "show me stats for year to date in R"
function testComplexMultiCommand() {
  return simulateCopilotMultiCommand("Complex: Stats + YTD + R Mode", [
    { type: 'navigateToPage', payload: { page: 'statistics' } },
    { type: 'setDateRange', payload: { range: 'ytd' } },
    { type: 'setDisplayMode', payload: { mode: 'r' } }
  ])
}

// Test 2: "navigate to trades and show last 90 days in percent"
function testTradesMultiCommand() {
  return simulateCopilotMultiCommand("Trades: Navigation + 90 Days + Percent", [
    { type: 'navigateToPage', payload: { page: 'trades' } },
    { type: 'setDateRange', payload: { range: '90day' } },
    { type: 'setDisplayMode', payload: { mode: 'percent' } }
  ])
}

// Test 3: "switch to dashboard and show in dollars"
function testDashboardDollarCommand() {
  return simulateCopilotMultiCommand("Dashboard: Navigation + Dollar Mode", [
    { type: 'navigateToPage', payload: { page: 'dashboard' } },
    { type: 'setDisplayMode', payload: { mode: 'dollar' } }
  ])
}

// Test 4: Date range variations
function testDateRanges() {
  const tests = [
    { name: "Show This Week", commands: [{ type: 'setDateRange', payload: { range: 'week' } }] },
    { name: "Show Last 30 Days", commands: [{ type: 'setDateRange', payload: { range: 'month' } }] },
    { name: "Show Last Quarter", commands: [{ type: 'setDateRange', payload: { range: '90day' } }] },
    { name: "Show All Time", commands: [{ type: 'setDateRange', payload: { range: 'all' } }] }
  ]

  tests.forEach((test, index) => {
    setTimeout(() => {
      simulateCopilotMultiCommand(test.name, test.commands)
    }, index * 2000)
  })
}

// Test 5: Display mode variations
function testDisplayModes() {
  const tests = [
    { name: "Switch to Dollar", commands: [{ type: 'setDisplayMode', payload: { mode: 'dollar' } }] },
    { name: "Switch to R-Multiples", commands: [{ type: 'setDisplayMode', payload: { mode: 'r' } }] },
    { name: "Switch to Percent", commands: [{ type: 'setDisplayMode', payload: { mode: 'percent' } }] }
  ]

  tests.forEach((test, index) => {
    setTimeout(() => {
      simulateCopilotMultiCommand(test.name, test.commands)
    }, index * 2000)
  })
}

// Test 6: Navigation only
function testNavigation() {
  const pages = ['dashboard', 'statistics', 'trades', 'journal']

  pages.forEach((page, index) => {
    setTimeout(() => {
      simulateCopilotMultiCommand(`Navigate to ${page}`, [
        { type: 'navigateToPage', payload: { page } }
      ])
    }, index * 1500)
  })
}

// State validation helpers
function validateStateChanges() {
  console.log('\n🔍 VALIDATION CHECKS:')

  // Check if action bridge is active
  if (!window.traderraActionBridge) {
    console.error('❌ Action bridge not found!')
    return
  }

  const status = window.traderraActionBridge.getStatus()
  console.log('📊 Bridge Status:', status)

  // Check current page
  console.log('🌐 Current Page:', window.location.pathname)

  // Try to detect current display mode (if UI buttons have test IDs)
  const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]')
  const rButton = document.querySelector('[data-testid="display-mode-r"]')
  const percentButton = document.querySelector('[data-testid="display-mode-percent"]')

  console.log('🎨 Display Mode Detection:')
  if (dollarButton) console.log('  Dollar button found:', dollarButton)
  if (rButton) console.log('  R button found:', rButton)
  if (percentButton) console.log('  Percent button found:', percentButton)

  // Check date range buttons
  const dateButtons = {
    'today': document.querySelector('[data-testid="date-range-today"]'),
    'week': document.querySelector('[data-testid="date-range-week"]'),
    'month': document.querySelector('[data-testid="date-range-month"]'),
    '90day': document.querySelector('[data-testid="date-range-90day"]'),
    'year': document.querySelector('[data-testid="date-range-year"]'),
    'all': document.querySelector('[data-testid="date-range-all"]')
  }

  console.log('📅 Date Range Detection:')
  Object.entries(dateButtons).forEach(([range, button]) => {
    console.log(`  ${range} button:`, button ? '✅ Found' : '❌ Not found')
  })

  return status
}

// Main test runner
function runMultiCommandValidation() {
  console.log('🚀 MULTI-COMMAND VALIDATION STARTING...')
  console.log('🎯 Testing actual state changes from CopilotKit commands')

  // Initial state check
  validateStateChanges()

  // Wait a bit, then start tests
  setTimeout(() => {
    console.log('\n🧪 STARTING TESTS...\n')

    // Test 1: Complex multi-command (the most important one)
    testComplexMultiCommand()

    // Test 2: Trades multi-command
    setTimeout(() => testTradesMultiCommand(), 4000)

    // Test 3: Dashboard + Dollar
    setTimeout(() => testDashboardDollarCommand(), 8000)

    // Test 4: Date ranges
    setTimeout(() => testDateRanges(), 12000)

    // Test 5: Display modes
    setTimeout(() => testDisplayModes(), 20000)

    // Test 6: Navigation only
    setTimeout(() => testNavigation(), 28000)

    // Final validation
    setTimeout(() => {
      console.log('\n✅ ALL TESTS COMPLETED')
      console.log('🔍 FINAL VALIDATION:')
      validateStateChanges()

      // Show action history
      const history = window.traderraActionBridge.getActionHistory()
      console.log('📚 Action History:', history.length, 'actions')
      console.log('📋 Recent Actions:', history.slice(-5))

      console.log('\n🎉 VALIDATION COMPLETE!')
      console.log('💡 Check if you see the page navigation, display mode changes, and date range filtering working in the UI')
    }, 36000)

  }, 2000)
}

// Global test functions
window.runMultiCommandValidation = runMultiCommandValidation
window.testComplexMultiCommand = testComplexMultiCommand
window.testTradesMultiCommand = testTradesMultiCommand
window.testDashboardDollarCommand = testDashboardDollarCommand
window.validateStateChanges = validateStateChanges

console.log('🎯 Multi-Command Validation Suite Loaded!')
console.log('Run runMultiCommandValidation() to start comprehensive testing')
console.log('Or run individual tests:')
console.log('  - testComplexMultiCommand()')
console.log('  - testTradesMultiCommand()')
console.log('  - testDashboardDollarCommand()')