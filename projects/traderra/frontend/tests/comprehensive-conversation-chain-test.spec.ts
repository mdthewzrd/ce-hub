import { test, expect } from '@playwright/test'

test('Comprehensive Conversation Chain - 15 Commands Test', async ({ page }) => {
  console.log('🧪 === COMPREHENSIVE CONVERSATION CHAIN TEST ===')
  console.log('🎯 Testing 15-command conversation to ensure timeout management works for extended conversations')

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const sendCommand = async (command: string, commandNumber: number) => {
    console.log(`\n🧪 Command ${commandNumber}: "${command}"`)

    // Ensure textarea is available
    await page.waitForSelector('textarea[placeholder*="Ask Renata"]', { timeout: 10000 })

    // Fill and send the command
    await page.fill('textarea[placeholder*="Ask Renata"]', command)
    await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

    // Wait for processing
    await sleep(6000)

    // Get the chat response
    const chatMessages = await page.locator('.space-y-4 > div').allTextContents()
    const lastMessage = chatMessages[chatMessages.length - 1]
    console.log(`Response: "${lastMessage?.substring(0, 150)}${lastMessage?.length > 150 ? '...' : ''}"`)

    // Check if it's giving demo/example responses (indicates failure)
    const isExampleResponse = lastMessage?.includes('Some examples:') ||
                             lastMessage?.includes('Try:') ||
                             lastMessage?.includes('I can help you navigate')

    if (isExampleResponse) {
      console.log(`❌ Command ${commandNumber} FAILED - Got example response instead of processing`)
      return false
    } else {
      console.log(`✅ Command ${commandNumber} SUCCESS - Got proper processing response`)
      return true
    }
  }

  console.log('\n📊 Starting extended conversation chain test...')

  // Start on statistics page (where user typically starts)
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')
  await sleep(2000)

  // Extended command sequence to test timeout management over long conversations
  const commands = [
    "Can we look at the dashboard over the last 90 days in dollars?",
    "Great, now let's switch it to net.",
    "Now show me the last 30 days",
    "Switch to R mode",
    "Show me all time data",
    "Go back to dollar view",
    "Switch to gross mode",
    "Show me last 7 days",
    "Switch to percentages",
    "Show last year data",
    "Switch back to R multiple view",
    "Show me last 6 months",
    "Switch to net view again",
    "Show me last quarter",
    "Switch to dollar view one more time"
  ]

  const results: boolean[] = []

  for (let i = 0; i < commands.length; i++) {
    const success = await sendCommand(commands[i], i + 1)
    results.push(success)

    // Brief pause between commands to simulate real user behavior
    await sleep(1000)
  }

  console.log(`\n📊 === COMPREHENSIVE CHAIN RESULTS ===`)
  console.log(`Total Commands Tested: ${commands.length}`)

  results.forEach((success, index) => {
    const status = success ? '✅ SUCCESS' : '❌ FAILED'
    console.log(`Command ${index + 1}: ${status} - "${commands[index]}"`)
  })

  const totalSuccess = results.filter(Boolean).length
  const successRate = (totalSuccess / commands.length) * 100

  console.log(`\n🎯 Overall Extended Chain Performance:`)
  console.log(`✅ Successful Commands: ${totalSuccess}/${commands.length}`)
  console.log(`📊 Success Rate: ${successRate.toFixed(1)}%`)

  if (successRate === 100) {
    console.log(`🏆 PERFECT - Extended conversation chain completely bulletproof!`)
    console.log(`🚀 Timeout management system handles ${commands.length} commands flawlessly`)
  } else if (successRate >= 90) {
    console.log(`✅ EXCELLENT - Minor issues but very strong performance`)
  } else if (successRate >= 75) {
    console.log(`✅ GOOD - Mostly stable but some degradation`)
  } else if (successRate >= 50) {
    console.log(`⚠️ PARTIAL - Significant degradation over extended conversation`)
  } else {
    console.log(`❌ BROKEN - System breaks down in extended conversations`)
  }

  // Analyze failure patterns
  const failurePoints = results.map((success, index) => success ? null : index + 1).filter(Boolean)
  if (failurePoints.length > 0) {
    console.log(`\n🔍 Failure Analysis:`)
    console.log(`Failed at commands: ${failurePoints.join(', ')}`)

    // Check for patterns
    if (failurePoints.length > 0 && failurePoints[0] <= 5) {
      console.log(`⚠️ Early failure detected - possible immediate timeout issues`)
    } else if (failurePoints.some(point => point >= 10)) {
      console.log(`⚠️ Late failure detected - possible timeout accumulation over time`)
    }
  }

  // Test timeout system health
  console.log(`\n🔧 Testing timeout management system health...`)

  // Check if we can still send commands after extended chain
  const healthCheckSuccess = await sendCommand("Show me the dashboard", commands.length + 1)

  if (healthCheckSuccess) {
    console.log(`✅ System Health: EXCELLENT - Chat system still responsive after ${commands.length} commands`)
  } else {
    console.log(`❌ System Health: DEGRADED - Chat system showing fatigue after extended use`)
  }

  // Take final screenshot for verification
  await page.screenshot({
    path: 'tests/screenshots/comprehensive-conversation-chain.png',
    fullPage: true
  })

  console.log('\n📸 Final screenshot saved: tests/screenshots/comprehensive-conversation-chain.png')

  // Final assessment
  console.log(`\n🎯 === FINAL BULLETPROOF ASSESSMENT ===`)
  if (successRate >= 95 && healthCheckSuccess) {
    console.log(`🛡️ BULLETPROOF CONFIRMED - System handles extended conversations perfectly`)
  } else if (successRate >= 85) {
    console.log(`🛡️ NEARLY BULLETPROOF - Minor improvements needed`)
  } else {
    console.log(`🔧 NEEDS WORK - System not ready for extended conversations`)
  }
})