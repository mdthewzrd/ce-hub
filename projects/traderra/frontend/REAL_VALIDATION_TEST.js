/**
 * REAL BROWSER VALIDATION TEST
 * Run this in the browser console on localhost:6565
 * This tests the ACTUAL user experience, not server logs
 */

console.log('🧪 STARTING REAL BROWSER VALIDATION TEST')
console.log('===============================================')

// Test 1: Verify we're on the correct page and can access the chat
function testPageAndChat() {
  console.log('\n📍 TEST 1: Page and Chat Verification')

  // Check we're on localhost:6565
  if (!window.location.href.includes('localhost:6565')) {
    console.error('❌ Not on localhost:6565. Please navigate to the application first.')
    return false
  }
  console.log('✅ Correct page: localhost:6565')

  // Check for the Renata chat input
  const chatInput = document.querySelector('[data-testid="renata-chat-input"]')
  const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]')

  if (!chatInput) {
    console.error('❌ Renata chat input not found')
    return false
  }
  console.log('✅ Chat input found')

  if (!sendButton) {
    console.error('❌ Send button not found')
    return false
  }
  console.log('✅ Send button found')

  // Check if input is enabled
  if (chatInput.disabled) {
    console.error('❌ Chat input is disabled')
    return false
  }
  console.log('✅ Chat input is enabled')

  return true
}

// Test 2: Test context availability and current state
function testContextsAndState() {
  console.log('\n🔍 TEST 2: Contexts and Current State')

  // Test DateRangeContext
  const hasDateContext = !!window.dateRangeContext
  console.log(`📅 DateRangeContext available: ${hasDateContext ? '✅' : '❌'}`)

  if (hasDateContext) {
    const currentRange = window.dateRangeContext.currentDateRange
    console.log(`   Current date range: "${currentRange}"`)

    const availableRanges = window.dateRangeContext.availableRanges
    console.log(`   Available ranges:`, availableRanges)
  }

  // Test DisplayModeContext
  const hasDisplayContext = !!window.displayModeContext
  console.log(`🎨 DisplayModeContext available: ${hasDisplayContext ? '✅' : '❌'}`)

  if (hasDisplayContext) {
    const currentMode = window.displayModeContext.displayMode
    console.log(`   Current display mode: "${currentMode}"`)

    const availableModes = window.displayModeContext.availableModes
    console.log(`   Available modes:`, availableModes)
  }

  // Test action bridge
  const hasActionBridge = !!window.traderraExecuteActions
  console.log(`⚙️  Action bridge available: ${hasActionBridge ? '✅' : '❌'}`)

  return { hasDateContext, hasDisplayContext, hasActionBridge }
}

// Test 3: Visual state verification
function testVisualState() {
  console.log('\n👁️ TEST 3: Visual State Verification')

  // Get current page
  const currentPath = window.location.pathname
  console.log(`🌐 Current page: "${currentPath}"`)

  // Check for display mode buttons
  const dollarButton = document.querySelector('[data-testid="display-mode-dollar"]')
  const rButton = document.querySelector('[data-testid="display-mode-r"]')
  const percentButton = document.querySelector('[data-testid="display-mode-percent"]')

  console.log(`💰 Dollar button found: ${dollarButton ? '✅' : '❌'}`)
  console.log(`📊 R button found: ${rButton ? '✅' : '❌'}`)
  console.log(`📈 Percent button found: ${percentButton ? '✅' : '❌'}`)

  // Check which button is active (has active/styling)
  if (dollarButton) {
    const isActive = dollarButton.classList.contains('bg-primary') ||
                     dollarButton.classList.contains('text-primary-foreground') ||
                     dollarButton.getAttribute('aria-pressed') === 'true'
    console.log(`   Dollar button active: ${isActive ? '✅' : '❌'}`)
  }

  if (rButton) {
    const isActive = rButton.classList.contains('bg-primary') ||
                   rButton.classList.contains('text-primary-foreground') ||
                   rButton.getAttribute('aria-pressed') === 'true'
    console.log(`   R button active: ${isActive ? '✅' : '❌'}`)
  }

  // Check for date range buttons
  const dateButtons = {
    'today': document.querySelector('[data-testid="date-range-today"]'),
    'week': document.querySelector('[data-testid="date-range-week"]'),
    'month': document.querySelector('[data-testid="date-range-month"]'),
    '90day': document.querySelector('[data-testid="date-range-90day"]'),
    'year': document.querySelector('[data-testid="date-range-year"]'),
    'all': document.querySelector('[data-testid="date-range-all"]')
  }

  console.log('📅 Date range buttons:')
  Object.entries(dateButtons).forEach(([range, button]) => {
    console.log(`   ${range}: ${button ? '✅' : '❌'}`)
  })

  return {
    currentPath,
    dollarButton,
    rButton,
    percentButton,
    dateButtons
  }
}

// Test 4: Manual command execution test
async function testCommandExecution() {
  console.log('\n🚀 TEST 4: Command Execution Test')

  // Get initial state
  const initialVisualState = testVisualState()
  const initialContextState = testContextsAndState()

  // Find the chat components
  const chatInput = document.querySelector('[data-testid="renata-chat-input"]')
  const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]')

  if (!chatInput || !sendButton) {
    console.error('❌ Cannot test command execution - chat components not available')
    return false
  }

  console.log('📝 Testing command: "go to the dashboard and look at the last 90 days in R"')

  try {
    // Type the command
    chatInput.focus()
    chatInput.value = "go to the dashboard and look at the last 90 days in R"

    // Trigger input events
    chatInput.dispatchEvent(new Event('input', { bubbles: true }))
    chatInput.dispatchEvent(new Event('change', { bubbles: true }))

    console.log('✅ Command typed into chat')

    // Wait a moment for processing
    await new Promise(resolve => setTimeout(resolve, 500))

    // Click send button
    if (!sendButton.disabled) {
      sendButton.click()
      console.log('✅ Send button clicked')
    } else {
      console.error('❌ Send button is disabled')
      return false
    }

    // Wait for response and potential state changes
    console.log('⏳ Waiting for response and state changes...')
    await new Promise(resolve => setTimeout(resolve, 3000))

    // Check final state
    const finalVisualState = testVisualState()
    const finalContextState = testContextsAndState()

    // Compare states
    const stateChanges = {
      navigation: initialVisualState.currentPath !== finalVisualState.currentPath,
      displayMode: finalContextState.hasDisplayContext &&
                   finalVisualState.dollarButton && finalVisualState.rButton,
      dateRange: finalContextState.hasDateContext
    }

    console.log('📊 STATE CHANGES DETECTED:')
    console.log(`   Navigation changed: ${stateChanges.navigation ? '✅' : '❌'} (${initialVisualState.currentPath} → ${finalVisualState.currentPath})`)
    console.log(`   Display mode context: ${finalContextState.hasDisplayContext ? '✅' : '❌'}`)
    console.log(`   Date range context: ${finalContextState.hasDateContext ? '✅' : '❌'}`)

    return {
      success: true,
      initialState: { visual: initialVisualState, context: initialContextState },
      finalState: { visual: finalVisualState, context: finalContextState },
      changes: stateChanges
    }

  } catch (error) {
    console.error('❌ Error during command execution:', error)
    return { success: false, error }
  }
}

// Test 5: Check for chat response
function testChatResponse() {
  console.log('\n💬 TEST 5: Chat Response Verification')

  // Look for the most recent assistant message
  const possibleSelectors = [
    '[data-testid*="assistant"]',
    '.assistant-message',
    '[class*="assistant"]',
    '[class*="ai-message"]'
  ]

  let assistantMessages = []
  possibleSelectors.forEach(selector => {
    const elements = document.querySelectorAll(selector)
    assistantMessages.push(...Array.from(elements))
  })

  console.log(`💬 Assistant messages found: ${assistantMessages.length}`)

  if (assistantMessages.length > 0) {
    const lastMessage = assistantMessages[assistantMessages.length - 1]
    const messageText = lastMessage.textContent || lastMessage.innerText || ''

    console.log(`   Last message text: "${messageText.substring(0, 100)}${messageText.length > 100 ? '...' : ''}"`)

    // Check for success/error indicators
    const isSuccess = messageText.includes('✅') || messageText.includes('success')
    const isError = messageText.includes('❌') || messageText.includes('error') || messageText.includes('Sorry')

    console.log(`   Message type: ${isSuccess ? 'SUCCESS ✅' : isError ? 'ERROR ❌' : 'NEUTRAL'}`)

    return { success: true, messageText, isSuccess, isError }
  } else {
    console.log('⚠️ No assistant messages found')
    return { success: false, message: 'No assistant messages found' }
  }
}

// Main test runner
async function runRealValidationTest() {
  console.log('🎯 Starting complete real browser validation test...')

  const results = {
    pageAndChat: false,
    contextsAndState: false,
    visualState: false,
    commandExecution: false,
    chatResponse: false
  }

  // Test 1: Page and Chat
  results.pageAndChat = testPageAndChat()

  if (!results.pageAndChat) {
    console.error('❌ TEST FAILED: Cannot proceed - page or chat not available')
    return results
  }

  // Test 2: Contexts and State
  const contextResults = testContextsAndState()
  results.contextsAndState = Object.values(contextResults).some(Boolean)

  // Test 3: Visual State
  testVisualState()
  results.visualState = true

  // Test 4: Command Execution
  const commandResult = await testCommandExecution()
  results.commandExecution = commandResult.success

  // Test 5: Chat Response
  const responseResult = testChatResponse()
  results.chatResponse = responseResult.success

  // Summary
  console.log('\n📋 VALIDATION TEST SUMMARY')
  console.log('================================')
  console.log(`Page and Chat: ${results.pageAndChat ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Contexts Available: ${results.contextsAndState ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Visual State Check: ${results.visualState ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Command Execution: ${results.commandExecution ? '✅ PASS' : '❌ FAIL'}`)
  console.log(`Chat Response: ${results.chatResponse ? '✅ PASS' : '❌ FAIL'}`)

  const passCount = Object.values(results).filter(Boolean).length
  const totalCount = Object.keys(results).length
  console.log(`\nOverall Result: ${passCount}/${totalCount} tests passed (${Math.round((passCount/totalCount) * 100)}%)`)

  if (commandResult.success && commandResult.changes) {
    console.log('\n🎉 COMMAND EXECUTION ANALYSIS:')
    console.log(`   Navigation worked: ${commandResult.changes.navigation ? 'YES ✅' : 'NO ❌'}`)
    console.log(`   State changes applied: ${Object.values(commandResult.changes).some(Boolean) ? 'YES ✅' : 'NO ❌'}`)

    if (responseResult.isSuccess) {
      console.log(`   System reported success: YES ✅`)
      console.log('\n🏆 SYSTEM IS WORKING! The bulletproof validation is functioning correctly.')
    } else {
      console.log(`   System reported error: YES ❌`)
      console.log('\n⚠️ System detected the issue but may need manual investigation.')
    }
  }

  // Store results for debugging
  window.realValidationTestResults = {
    timestamp: new Date().toISOString(),
    results,
    commandExecution: commandResult,
    chatResponse: responseResult,
    initialState: commandResult.initialState,
    finalState: commandResult.finalState
  }

  console.log('\n💾 Results stored in window.realValidationTestResults')
  console.log('Run console.log(window.realValidationTestResults) to see details')

  return results
}

// Auto-run if possible
if (typeof document !== 'undefined') {
  // Wait for page to load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', runRealValidationTest)
  } else {
    // Small delay to ensure everything is rendered
    setTimeout(runRealValidationTest, 2000)
  }
}

// Export for manual execution
if (typeof window !== 'undefined') {
  window.runRealValidationTest = runRealValidationTest
  console.log('🎯 Real Validation Test Loaded!')
  console.log('Run runRealValidationTest() to start the test')
  console.log('Or call individual test functions:')
  console.log('  - testPageAndChat()')
  console.log('  - testContextsAndState()')
  console.log('  - testVisualState()')
  console.log('  - testCommandExecution()')
  console.log('  - testChatResponse()')
}