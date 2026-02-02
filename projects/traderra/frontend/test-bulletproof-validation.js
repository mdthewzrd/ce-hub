/**
 * Bulletproof Validation Test for Traderra Renata Chat
 * Tests the actual state change verification system
 * Run this in browser console on localhost:6565
 */

// Test the bulletproof validation system
function testBulletproofValidation() {
  console.log('🧪 TESTING BULLETPROOF VALIDATION SYSTEM')
  console.log('=====================================')

  // Check if contexts are available
  console.log('📋 Context Availability Check:')
  console.log('  DateRangeContext:', !!window.dateRangeContext)
  console.log('  DisplayModeContext:', !!window.displayModeContext)

  if (window.dateRangeContext) {
    console.log('  Current date range:', window.dateRangeContext.currentDateRange)
  }
  if (window.displayModeContext) {
    console.log('  Current display mode:', window.displayModeContext.displayMode)
  }

  // Test state change verification
  console.log('\n🔍 Testing State Change Verification:')

  // Test 1: Check current state
  const initialState = {
    page: window.location.pathname,
    dateRange: window.dateRangeContext?.currentDateRange,
    displayMode: window.displayModeContext?.displayMode
  }
  console.log('📊 Initial State:', initialState)

  // Test 2: Simulate the user's command "go to the dashboard and look at the last 90 days in R"
  console.log('\n🎯 Testing User Command: "go to the dashboard and look at the last 90 days in R"')

  // Simulate the commands that should be executed
  const testCommands = [
    { action_type: 'navigation', parameters: { page: '/dashboard' } },
    { action_type: 'date_range', parameters: { date_range: '90day' } },
    { action_type: 'display_mode', parameters: { mode: 'r' } }
  ]

  console.log('📦 Commands to execute:', testCommands)

  // Test 3: Execute commands manually to test the system
  async function executeTestCommands() {
    const results = []

    for (const command of testCommands) {
      console.log(`\n🔄 Executing: ${command.action_type}`)

      try {
        switch (command.action_type) {
          case 'navigation':
            if (command.parameters.page) {
              window.location.href = command.parameters.page
              await new Promise(resolve => setTimeout(resolve, 1000))

              const currentUrl = window.location.pathname
              const success = currentUrl === command.parameters.page || currentUrl.endsWith(command.parameters.page)
              results.push({ command: command.action_type, success, actual: currentUrl })
              console.log(`  Navigation result: ${success ? '✅' : '❌'} ${currentUrl}`)
            }
            break

          case 'date_range':
            if (window.dateRangeContext && window.dateRangeContext.setDateRange) {
              window.dateRangeContext.setDateRange(command.parameters.date_range)
              await new Promise(resolve => setTimeout(resolve, 500))

              const actualRange = window.dateRangeContext.currentDateRange
              const success = actualRange === command.parameters.date_range
              results.push({ command: command.action_type, success, actual: actualRange })
              console.log(`  Date range result: ${success ? '✅' : '❌'} ${actualRange}`)
            } else {
              results.push({ command: command.action_type, success: false, error: 'DateRangeContext not available' })
              console.log(`  Date range result: ❌ Context not available`)
            }
            break

          case 'display_mode':
            if (window.displayModeContext && window.displayModeContext.setDisplayMode) {
              window.displayModeContext.setDisplayMode(command.parameters.mode)
              await new Promise(resolve => setTimeout(resolve, 500))

              const actualMode = window.displayModeContext.displayMode
              const success = actualMode === command.parameters.mode
              results.push({ command: command.action_type, success, actual: actualMode })
              console.log(`  Display mode result: ${success ? '✅' : '❌'} ${actualMode}`)
            } else {
              results.push({ command: command.action_type, success: false, error: 'DisplayModeContext not available' })
              console.log(`  Display mode result: ❌ Context not available`)
            }
            break
        }
      } catch (error) {
        results.push({ command: command.action_type, success: false, error: error.message })
        console.log(`  ${command.action_type} result: ❌ ${error.message}`)
      }
    }

    // Final state check
    const finalState = {
      page: window.location.pathname,
      dateRange: window.dateRangeContext?.currentDateRange,
      displayMode: window.displayModeContext?.displayMode
    }

    console.log('\n📊 Final State:', finalState)
    console.log('\n📋 EXECUTION SUMMARY:')
    results.forEach(result => {
      const status = result.success ? '✅' : '❌'
      console.log(`  ${status} ${result.command}: ${result.actual || result.error}`)
    })

    const successCount = results.filter(r => r.success).length
    const totalCount = results.length
    console.log(`\n🏆 OVERALL RESULT: ${successCount}/${totalCount} commands successful`)

    if (successCount === totalCount) {
      console.log('🎉 BULLETPROOF VALIDATION WORKING! All state changes verified.')
    } else {
      console.log('⚠️ VALIDATION ISSUES DETECTED. Some state changes failed.')
    }

    return { initialState, finalState, results }
  }

  // Execute the test
  executeTestCommands().then(result => {
    console.log('\n✅ Test completed. Check results above.')

    // Store results for debugging
    window.bulletproofTestResults = result

    console.log('\n💾 Results stored in window.bulletproofTestResults')
  })
}

// Enhanced verification function test
function testVerificationFunction() {
  console.log('\n🔍 TESTING VERIFICATION FUNCTION')

  // Test if we can detect state changes properly
  const testCases = [
    {
      name: 'Date Range Verification',
      command: { action_type: 'date_range', parameters: { date_range: '90day' } },
      check: () => window.dateRangeContext?.currentDateRange === '90day'
    },
    {
      name: 'Display Mode Verification',
      command: { action_type: 'display_mode', parameters: { mode: 'r' } },
      check: () => window.displayModeContext?.displayMode === 'r'
    },
    {
      name: 'Navigation Verification',
      command: { action_type: 'navigation', parameters: { page: '/dashboard' } },
      check: () => window.location.pathname.includes('dashboard')
    }
  ]

  testCases.forEach(testCase => {
    const result = testCase.check()
    console.log(`  ${testCase.name}: ${result ? '✅' : '❌'}`)
  })
}

// Run all tests
console.log('🎯 Starting bulletproof validation tests...')
testBulletproofValidation()
setTimeout(() => testVerificationFunction(), 2000)

console.log('\n📋 Test Functions Available:')
console.log('  - testBulletproofValidation() : Run full command execution test')
console.log('  - testVerificationFunction() : Test verification logic')
console.log('\n🔧 Available Contexts:')
console.log('  - window.dateRangeContext')
console.log('  - window.displayModeContext')