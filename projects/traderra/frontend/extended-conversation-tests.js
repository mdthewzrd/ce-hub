/**
 * Extended Conversation Testing Suite for Traderra Renata
 * Tests multiple message sequences with mixed command types
 * Validates 100% state change accuracy across conversations
 * Builds Renata's understanding of successful command patterns
 */

// Advanced conversation sequences with mixed command types
const extendedTestSequences = [
  {
    name: "Complex Trading Analysis Workflow",
    sequence: [
      "show me my trading statistics for this year in R multiples",
      "what's my best performing trade this month?",
      "switch to dollar view to see the actual amounts",
      "show me only the last 90 days of trades",
      "navigate to the journal to see my trading notes",
      "go back to dashboard and show everything in percentage",
      "what was my total P&L for last quarter?"
    ],
    expectedStates: [
      { page: "statistics", range: "year", mode: "r" },
      { page: "statistics", range: "month", mode: "r" },
      { page: "statistics", range: "month", mode: "dollar" },
      { page: "statistics", range: "90day", mode: "dollar" },
      { page: "journal", range: "90day", mode: "dollar" },
      { page: "dashboard", range: "all", mode: "percent" },
      { page: "dashboard", range: "quarter", mode: "percent" }
    ]
  },
  {
    name: "Multi-Page Trading Review",
    sequence: [
      "take me to trades page",
      "show me today's trades only",
      "switch to R mode for analysis",
      "show me this week's performance",
      "go to statistics page",
      "keep the same date range but show in dollars",
      "what's my win rate for this period?"
    ],
    expectedStates: [
      { page: "trades", range: "all", mode: "dollar" },
      { page: "trades", range: "today", mode: "dollar" },
      { page: "trades", range: "today", mode: "r" },
      { page: "trades", range: "week", mode: "r" },
      { page: "statistics", range: "week", mode: "r" },
      { page: "statistics", range: "week", mode: "dollar" },
      { page: "statistics", range: "week", mode: "dollar" }
    ]
  },
  {
    name: "Data Analysis Conversation",
    sequence: [
      "show me my overall performance stats",
      "how many trades did I make this year?",
      "what's my average trade size?",
      "show me the last 30 days in dollar mode",
      "go to trades and filter for this month",
      "switch to percentage view",
      "navigate back to dashboard with all time data"
    ],
    expectedStates: [
      { page: "statistics", range: "all", mode: "dollar" },
      { page: "statistics", range: "all", mode: "dollar" },
      { page: "statistics", range: "all", mode: "dollar" },
      { page: "statistics", range: "month", mode: "dollar" },
      { page: "trades", range: "month", mode: "dollar" },
      { page: "trades", range: "month", mode: "percent" },
      { page: "dashboard", range: "all", mode: "percent" }
    ]
  }
]

// Test state validation and tracking
class ExtendedConversationValidator {
  constructor() {
    this.testResults = []
    this.currentState = { page: 'dashboard', range: 'all', mode: 'dollar' }
    this.actionHistory = []
    this.conversationHistory = []
  }

  // Get current application state
  getCurrentState() {
    const url = window.location.pathname
    const page = url.split('/')[1] || 'dashboard'

    // Try to get context state from window
    const dateRange = window.dateRangeContext?.currentDateRange || 'all'
    const displayMode = window.displayModeContext?.displayMode || 'dollar'

    return { page, range: dateRange, mode: displayMode }
  }

  // Validate state transition
  validateStateTransition(expectedState, actualState) {
    const matches = {
      page: expectedState.page === actualState.page,
      range: expectedState.range === actualState.range || this.isCompatibleRange(expectedState.range, actualState.range),
      mode: expectedState.mode === actualState.mode
    }

    const success = Object.values(matches).every(Boolean)

    return {
      success,
      matches,
      expected: expectedState,
      actual: actualState,
      details: success ? 'Perfect match' : `Page: ${matches.page ? '✅' : '❌'}, Range: ${matches.range ? '✅' : '❌'}, Mode: ${matches.mode ? '✅' : '❌'}`
    }
  }

  // Check date range compatibility
  isCompatibleRange(expected, actual) {
    const compatibilityMap = {
      'today': ['today'],
      'week': ['week', 'lastWeek'],
      'month': ['month', 'lastMonth'],
      '90day': ['90day', 'quarter'],
      'year': ['year', 'ytd'],
      'quarter': ['90day', 'quarter'],
      'ytd': ['year', 'ytd'],
      'all': ['all']
    }

    return compatibilityMap[expected]?.includes(actual) || false
  }

  // Send message to Renata chat
  async sendRenataMessage(message) {
    console.log(`🗣️ Sending message: "${message}"`)

    // First, wait for the chat to be fully open and visible
    await this.waitForChatToBeReady()

    // Find the chat input using the new data-testid attribute
    const chatInput = document.querySelector('[data-testid="renata-chat-input"]')

    if (!chatInput) {
      console.error('❌ Chat input not found with data-testid')
      // Fallback to broader search
      const fallbackInput = document.querySelector('input[placeholder*="Ask Renata"]')
      if (fallbackInput) {
        console.log('✅ Found chat input using fallback selector')
        return await this.sendMessageViaInput(fallbackInput, message)
      }
      console.error('❌ No chat input found at all')
      return false
    }

    console.log('✅ Found chat input with data-testid')
    return await this.sendMessageViaInput(chatInput, message)
  }

  // Wait for chat to be fully ready
  async waitForChatToBeReady() {
    let attempts = 0
    const maxAttempts = 10

    while (attempts < maxAttempts) {
      const chatInput = document.querySelector('[data-testid="renata-chat-input"]')
      if (chatInput && chatInput.offsetParent !== null && !chatInput.disabled) {
        console.log('✅ Chat input is ready')
        return
      }

      console.log(`⏳ Waiting for chat to be ready... attempt ${attempts + 1}/${maxAttempts}`)
      await this.delay(500)
      attempts++
    }

    console.warn('⚠️ Chat may not be fully ready, proceeding anyway')
  }

  // Send message via input element
  async sendMessageViaInput(chatInput, message) {
    try {
      // Focus and type message
      chatInput.focus()
      chatInput.value = message

      // Trigger React-specific events
      const inputEvent = new Event('input', { bubbles: true })
      const changeEvent = new Event('change', { bubbles: true })

      chatInput.dispatchEvent(inputEvent)
      chatInput.dispatchEvent(changeEvent)

      // Wait for React to process the input
      await this.delay(300)

      // Find the send button using data-testid
      const sendButton = document.querySelector('[data-testid="renata-chat-send-button"]')

      if (sendButton && !sendButton.disabled && sendButton.offsetParent !== null) {
        sendButton.click()
        console.log('✅ Message sent via send button')
        return true
      }

      // Fallback to form submission
      const form = chatInput.closest('form')
      if (form) {
        form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }))
        console.log('✅ Message sent via form submission')
        return true
      }

      console.error('❌ No send mechanism found')
      return false

    } catch (error) {
      console.error('❌ Error sending message:', error)
      return false
    }
  }

  // Wait for state changes after message
  async waitForStateChange(timeout = 3000) {
    const initialState = this.getCurrentState()
    let finalState = initialState

    const startTime = Date.now()
    while (Date.now() - startTime < timeout) {
      await this.delay(500)
      const currentState = this.getCurrentState()

      // Check if state changed
      if (JSON.stringify(currentState) !== JSON.stringify(initialState)) {
        finalState = currentState
        break
      }
    }

    return finalState
  }

  // Run complete test sequence
  async runTestSequence(testSequence) {
    console.log(`\n🧪 Starting Test: ${testSequence.name}`)
    console.log(`📋 Sequence length: ${testSequence.sequence.length} messages`)

    const sequenceResults = []

    for (let i = 0; i < testSequence.sequence.length; i++) {
      const message = testSequence.sequence[i]
      const expectedState = testSequence.expectedStates[i]

      console.log(`\n--- Step ${i + 1}/${testSequence.sequence.length} ---`)

      // Record state before
      const stateBefore = this.getCurrentState()

      // Send message
      const messageSent = await this.sendRenataMessage(message)
      if (!messageSent) {
        sequenceResults.push({
          message,
          expectedState,
          success: false,
          error: 'Failed to send message'
        })
        continue
      }

      // Wait for response and state changes
      await this.delay(2000) // Wait for AI response
      const stateAfter = await this.waitForStateChange()

      // Validate state
      const validation = this.validateStateTransition(expectedState, stateAfter)

      sequenceResults.push({
        message,
        expectedState,
        stateBefore,
        stateAfter,
        validation,
        success: validation.success
      })

      console.log(`📊 Validation: ${validation.details}`)

      // Update current state
      this.currentState = stateAfter

      // Wait between messages
      await this.delay(1000)
    }

    // Calculate sequence success rate
    const successCount = sequenceResults.filter(r => r.success).length
    const successRate = Math.round((successCount / sequenceResults.length) * 100)

    const testResult = {
      testName: testSequence.name,
      successRate,
      totalSteps: sequenceResults.length,
      successfulSteps: successCount,
      results: sequenceResults
    }

    this.testResults.push(testResult)

    console.log(`\n✅ Test "${testSequence.name}" completed: ${successRate}% success rate`)

    return testResult
  }

  // Test data awareness capabilities
  async testDataAwareness() {
    console.log('\n🔍 Testing Renata\'s Data Awareness...')

    const dataQuestions = [
      "How many trades do I have in total?",
      "What's my current P&L?",
      "When was my last trade?",
      "What's my win rate this month?",
      "Show me my biggest winner this year",
      "What's my average trade size?"
    ]

    const dataResults = []

    for (const question of dataQuestions) {
      console.log(`\n📊 Question: "${question}"`)

      const stateBefore = this.getCurrentState()
      await this.sendRenataMessage(question)
      await this.delay(3000) // Wait for data analysis
      const stateAfter = this.getCurrentState()

      // Check if Renata responded with data insights
      const hasDataResponse = this.checkForDataResponse()

      dataResults.push({
        question,
        hasDataResponse,
        stateChanged: JSON.stringify(stateBefore) !== JSON.stringify(stateAfter),
        responseDetected: hasDataResponse
      })

      await this.delay(1000)
    }

    return dataResults
  }

  // Check if Renata provided data-driven response
  checkForDataResponse() {
    // Look for indicators of data analysis in the chat
    const chatMessages = document.querySelectorAll('[data-testid*="ai-message"], .ai-message, [class*="assistant"]')
    const lastMessage = chatMessages[chatMessages.length - 1]

    if (!lastMessage) return false

    const messageText = lastMessage.textContent || ''

    // Indicators of data-aware responses
    const dataIndicators = [
      /\d+ trades?/i,
      /\$[\d,]+/i,
      /\d+%/i,
      /win rate/i,
      /profit/i,
      /loss/i,
      /average/i,
      /total/i,
      /P&L/i
    ]

    return dataIndicators.some(indicator => indicator.test(messageText))
  }

  // Delay helper
  delay(ms) {
    return new Promise(resolve => setTimeout(resolve, ms))
  }

  // Extract successful patterns for Renata learning
  extractSuccessfulPatterns() {
    const successfulPatterns = []

    this.testResults.forEach(result => {
      result.results.forEach(step => {
        if (step.success) {
          successfulPatterns.push({
            message: step.message,
            expectedState: step.expectedState,
            actualState: step.stateAfter,
            pattern: this.analyzePattern(step.message, step.expectedState)
          })
        }
      })
    })

    return successfulPatterns
  }

  // Analyze message pattern
  analyzePattern(message, expectedState) {
    const lowerMessage = message.toLowerCase()

    return {
      messageType: this.detectMessageType(lowerMessage),
      commands: this.extractCommands(lowerMessage),
      expectedChanges: Object.keys(expectedState),
      complexity: this.assessComplexity(message)
    }
  }

  // Detect message type
  detectMessageType(message) {
    if (message.includes('show') || message.includes('take me to')) return 'navigation'
    if (message.includes('switch') || message.includes('change')) return 'state_change'
    if (message.includes('what') || message.includes('how')) return 'question'
    return 'general'
  }

  // Extract commands from message
  extractCommands(message) {
    const commands = []

    if (message.includes('dashboard')) commands.push('navigate_dashboard')
    if (message.includes('statistics') || message.includes('stats')) commands.push('navigate_statistics')
    if (message.includes('trades')) commands.push('navigate_trades')
    if (message.includes('journal')) commands.push('navigate_journal')
    if (message.includes('r multiple') || message.includes('in r')) commands.push('set_r_mode')
    if (message.includes('dollar') || message.includes('actual amount')) commands.push('set_dollar_mode')
    if (message.includes('percent')) commands.push('set_percent_mode')

    const dateRanges = ['today', 'week', 'month', 'quarter', 'year', '90day', 'ytd']
    dateRanges.forEach(range => {
      if (message.includes(range)) commands.push(`set_date_${range}`)
    })

    return commands
  }

  // Assess message complexity
  assessComplexity(message) {
    const wordCount = message.split(' ').length
    const commandCount = this.extractCommands(message.toLowerCase()).length

    if (wordCount > 10 || commandCount > 2) return 'high'
    if (wordCount > 6 || commandCount > 1) return 'medium'
    return 'low'
  }

  // Generate comprehensive report
  generateReport() {
    console.log('\n📋 EXTENDED CONVERSATION TEST REPORT')
    console.log('=' .repeat(50))

    let totalSteps = 0
    let totalSuccessful = 0

    this.testResults.forEach(result => {
      console.log(`\n🧪 ${result.testName}`)
      console.log(`   Success Rate: ${result.successRate}% (${result.successfulSteps}/${result.totalSteps})`)

      result.results.forEach((step, index) => {
        const status = step.success ? '✅' : '❌'
        console.log(`   ${status} Step ${index + 1}: "${step.message.substring(0, 40)}..."`)
        if (!step.success && step.validation) {
          console.log(`      Expected: ${JSON.stringify(step.expectedState)}`)
          console.log(`      Actual: ${JSON.stringify(step.stateAfter)}`)
        }
      })

      totalSteps += result.totalSteps
      totalSuccessful += result.successfulSteps
    })

    const overallSuccessRate = Math.round((totalSuccessful / totalSteps) * 100)

    console.log('\n🏆 OVERALL RESULTS')
    console.log(`   Total Steps: ${totalSteps}`)
    console.log(`   Successful: ${totalSuccessful}`)
    console.log(`   Success Rate: ${overallSuccessRate}%`)

    if (overallSuccessRate >= 95) {
      console.log('   🎉 EXCELLENT: System is production-ready!')
    } else if (overallSuccessRate >= 80) {
      console.log('   ✅ GOOD: System works well with minor improvements needed')
    } else {
      console.log('   ⚠️ NEEDS WORK: Significant improvements required')
    }

    return {
      totalSteps,
      totalSuccessful,
      overallSuccessRate,
      testResults: this.testResults
    }
  }
}

// Main test runner
async function runExtendedConversationTests() {
  console.log('🚀 Starting Extended Conversation Testing Suite...')
  console.log('🎯 Goal: Validate 100% state change accuracy across conversations')

  const validator = new ExtendedConversationValidator()

  // Wait for app to fully load
  await validator.delay(2000)

  // Run all test sequences
  for (const sequence of extendedTestSequences) {
    await validator.runTestSequence(sequence)
    await validator.delay(2000) // Rest between sequences
  }

  // Test data awareness
  console.log('\n🔍 Testing Data Awareness Capabilities...')
  const dataResults = await validator.testDataAwareness()

  // Generate final report
  const report = validator.generateReport()

  console.log('\n💬 CONVERSATION ANALYSIS SUMMARY')
  const dataAwareCount = dataResults.filter(r => r.hasDataResponse).length
  console.log(`   Data-aware responses: ${dataAwareCount}/${dataResults.length} (${Math.round((dataAwareCount/dataResults.length) * 100)}%)`)

  console.log('\n🎯 RENATA COMMAND PATTERN ANALYSIS')
  console.log('   Building understanding of successful patterns...')

  // Store results for Renata learning
  window.extendedTestResults = {
    conversationTests: report,
    dataAwarenessTests: dataResults,
    successfulPatterns: validator.extractSuccessfulPatterns(),
    timestamp: new Date().toISOString()
  }

  console.log('✅ Extended conversation testing completed!')
  console.log('📊 Results stored in window.extendedTestResults for Renata learning')

  return report
}

// Export for use in browser console
window.runExtendedConversationTests = runExtendedConversationTests
window.ExtendedConversationValidator = ExtendedConversationValidator

console.log('🎯 Extended Conversation Testing Suite Loaded!')
console.log('🚀 Run runExtendedConversationTests() to start comprehensive testing')
console.log('📋 Features:')
console.log('   • Multiple conversation sequences with mixed commands')
console.log('   • State change validation across extended conversations')
console.log('   • Data awareness and analytical capability testing')
console.log('   • Pattern recognition for Renata learning')
console.log('   • 100% accuracy validation for production readiness')