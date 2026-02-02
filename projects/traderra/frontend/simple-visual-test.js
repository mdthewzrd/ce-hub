/**
 * Simple Visual Verification Test
 * Tests what the user ACTUALLY SEES changing on screen
 * Run this in browser console on localhost:6565
 */

function runVisualVerificationTest() {
  console.log('👁️ VISUAL VERIFICATION TEST')
  console.log('=============================')

  // Helper function to take a snapshot of current visual state
  function takeVisualSnapshot() {
    const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]')
    const rButton = document.querySelector('[data-testid="display-mode-r"]')
    const percentButton = document.querySelector('[data-testid="display-mode-percent"]')

    // Check which display mode button is visually active
    let activeDisplayMode = 'unknown'
    if (dollarButton && (dollarButton.classList.contains('bg-primary') || dollarButton.classList.contains('text-primary-foreground'))) {
      activeDisplayMode = 'dollar'
    } else if (rButton && (rButton.classList.contains('bg-primary') || rButton.classList.contains('text-primary-foreground'))) {
      activeDisplayMode = 'r'
    } else if (percentButton && (percentButton.classList.contains('bg-primary') || percentButton.classList.contains('text-primary-foreground'))) {
      activeDisplayMode = 'percent'
    }

    // Check date range buttons
    const dateButtons = {
      'today': document.querySelector('[data-testid="date-range-today"]'),
      'week': document.querySelector('[data-testid="date-range-week"]'),
      'month': document.querySelector('[data-testid="date-range-month"]'),
      '90day': document.querySelector('[data-testid="date-range-90day"]'),
      'year': document.querySelector('[data-testid="date-range-year"]'),
      'all': document.querySelector('[data-testid="date-range-all"]')
    }

    let activeDateRange = 'unknown'
    for (const [range, button] of Object.entries(dateButtons)) {
      if (button && (button.classList.contains('bg-primary') || button.classList.contains('text-primary-foreground') || button.classList.contains('ring-2'))) {
        activeDateRange = range
        break
      }
    }

    return {
      url: window.location.pathname,
      activeDisplayMode,
      activeDateRange,
      pageTitle: document.title,
      timestamp: Date.now()
    }
  }

  // Test function to verify state changes visually
  async function testVisualStateChange(testCommand, expectedChanges) {
    console.log(`\n🎯 Testing: "${testCommand}"`)
    console.log(`Expected changes:`, expectedChanges)

    // Take before snapshot
    const beforeSnapshot = takeVisualSnapshot()
    console.log('📸 BEFORE:', beforeSnapshot)

    // Find and use chat input
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]')
    const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]')

    if (!chatInput || !sendButton) {
      console.error('❌ Chat components not found')
      return { success: false, error: 'Chat components not found' }
    }

    try {
      // Type and send command
      chatInput.focus()
      chatInput.value = testCommand
      chatInput.dispatchEvent(new Event('input', { bubbles: true }))
      sendButton.click()

      console.log('✅ Command sent, waiting for changes...')

      // Wait for processing (longer wait for UI to update)
      await new Promise(resolve => setTimeout(resolve, 4000))

      // Take after snapshot
      const afterSnapshot = takeVisualSnapshot()
      console.log('📸 AFTER:', afterSnapshot)

      // Compare changes
      const changes = {
        navigation: beforeSnapshot.url !== afterSnapshot.url,
        displayMode: beforeSnapshot.activeDisplayMode !== afterSnapshot.activeDisplayMode,
        dateRange: beforeSnapshot.activeDateRange !== afterSnapshot.activeDateRange
      }

      console.log('📊 VISUAL CHANGES DETECTED:')
      console.log(`  Navigation: ${changes.navigation ? '✅ YES' : '❌ NO'} (${beforeSnapshot.url} → ${afterSnapshot.url})`)
      console.log(`  Display mode: ${changes.displayMode ? '✅ YES' : '❌ NO'} (${beforeSnapshot.activeDisplayMode} → ${afterSnapshot.activeDisplayMode})`)
      console.log(`  Date range: ${changes.dateRange ? '✅ YES' : '❌ NO'} (${beforeSnapshot.activeDateRange} → ${afterSnapshot.activeDateRange})`)

      // Check if expected changes happened
      const results = {
        navigation: {
          expected: expectedChanges.navigation || false,
          actual: changes.navigation,
          success: (expectedChanges.navigation ? changes.navigation : !changes.navigation)
        },
        displayMode: {
          expected: expectedChanges.displayMode || false,
          actual: changes.displayMode,
          success: (expectedChanges.displayMode ? changes.displayMode === expectedChanges.displayMode : !changes.displayMode)
        },
        dateRange: {
          expected: expectedChanges.dateRange || false,
          actual: changes.dateRange,
          success: (expectedChanges.dateRange ? changes.dateRange === expectedChanges.dateRange : !changes.dateRange)
        }
      }

      const successCount = Object.values(results).filter(r => r.success).length
      const totalCount = Object.keys(results).length

      console.log(`\n📋 VERDICT: ${successCount}/${totalCount} expected changes occurred`)

      return {
        success: successCount === totalCount,
        beforeSnapshot,
        afterSnapshot,
        changes,
        results
      }

    } catch (error) {
      console.error('❌ Error during test:', error)
      return { success: false, error: error.message }
    }
  }

  // Run the critical test
  async function runCriticalTest() {
    console.log('\n🚀 RUNNING CRITICAL TEST')
    console.log('========================')

    const result = await testVisualStateChange(
      'go to the dashboard and look at the last 90 days in R',
      {
        navigation: '/dashboard',
        displayMode: 'r',
        dateRange: '90day'
      }
    )

    if (result.success) {
      console.log('\n🎉 SUCCESS! All expected visual changes occurred!')
      console.log('✅ The system is working correctly - user can see the changes')
    } else {
      console.log('\n❌ FAILURE! Not all expected visual changes occurred!')
      console.log('⚠️ The system has issues - user cannot see expected changes')

      // Show what failed
      Object.entries(result.results).forEach(([changeType, result]) => {
        if (!result.success) {
          console.log(`  ❌ ${changeType}: Expected ${result.expected}, got ${result.actual}`)
        }
      })
    }

    return result
  }

  // Store results for debugging
  window.visualVerificationResults = null

  // Run the test
  runCriticalTest().then(result => {
    window.visualVerificationResults = result
    console.log('\n💾 Results stored in window.visualVerificationResults')

    console.log('\n🔧 ADDITIONAL VERIFICATION OPTIONS:')
    console.log('  - Check window.dateRangeContext?.currentDateRange')
    console.log('  - Check window.displayModeContext?.displayMode')
    console.log('  - Check window.location.pathname')

    // Show current state for manual verification
    console.log('\n📊 CURRENT STATE FOR MANUAL VERIFICATION:')
    console.log('  URL:', window.location.pathname)
    console.log('  Date context:', window.dateRangeContext?.currentDateRange)
    console.log('  Display context:', window.displayModeContext?.displayMode)
  })
}

// Auto-run if in browser
if (typeof window !== 'undefined') {
  window.runVisualVerificationTest = runVisualVerificationTest
  console.log('👁️ Visual Verification Test Loaded!')
  console.log('Run runVisualVerificationTest() to test what users actually see changing')
}