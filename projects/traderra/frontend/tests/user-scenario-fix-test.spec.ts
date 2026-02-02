import { test, expect } from '@playwright/test'

test('User Scenario Fix - Dashboard Navigation + Follow-up Commands', async ({ page }) => {
  console.log('🧪 === USER SCENARIO REPRODUCTION TEST ===')

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

  console.log('\n📊 Testing the exact user scenario that was breaking...')

  // Start on statistics page (where user started)
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')
  await sleep(2000)

  // Command 1: User's first command that worked
  const command1Success = await sendCommand(
    "Can we look at the dashboard over the last 90 days in dollars?",
    1
  )

  // Command 2: User's second command that was giving examples instead of processing
  const command2Success = await sendCommand(
    "Great, now let's switch it to net.",
    2
  )

  // Command 3: Let's test a third command for good measure
  const command3Success = await sendCommand(
    "Now show me the last 30 days",
    3
  )

  // Command 4: Test another mode switch
  const command4Success = await sendCommand(
    "Switch to R mode",
    4
  )

  console.log(`\n📊 === SCENARIO RESULTS ===`)
  console.log(`✅ Command 1 (Navigation + settings): ${command1Success ? 'SUCCESS' : 'FAILED'}`)
  console.log(`✅ Command 2 (Follow-up net switch): ${command2Success ? 'SUCCESS' : 'FAILED'}`)
  console.log(`✅ Command 3 (Date range change): ${command3Success ? 'SUCCESS' : 'FAILED'}`)
  console.log(`✅ Command 4 (Display mode change): ${command4Success ? 'SUCCESS' : 'FAILED'}`)

  const totalSuccess = [command1Success, command2Success, command3Success, command4Success].filter(Boolean).length
  const successRate = (totalSuccess / 4) * 100

  console.log(`\n🎯 Overall success rate: ${totalSuccess}/4 (${successRate}%)`)

  if (successRate === 100) {
    console.log(`🏆 PERFECT - User scenario completely fixed!`)
  } else if (successRate >= 75) {
    console.log(`✅ GOOD - Major improvement, minor issues remain`)
  } else if (successRate >= 50) {
    console.log(`⚠️ PARTIAL - Some improvement but still issues`)
  } else {
    console.log(`❌ BROKEN - User scenario still not working`)
  }

  // Take screenshot of final state
  await page.screenshot({
    path: 'tests/screenshots/user-scenario-fix.png',
    fullPage: true
  })

  console.log('\n📸 Screenshot saved: tests/screenshots/user-scenario-fix.png')
})