import { test, expect } from '@playwright/test'

test('Multi-Command Conversation Chain Test', async ({ page }) => {
  console.log('🧪 === CONVERSATION CHAIN RESILIENCE TEST ===')

  const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms))

  const captureButtonStates = async () => {
    return await page.evaluate(() => {
      const dollarActive = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')?.classList.contains('bg-[#B8860B]') || false
      const rActive = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')?.classList.contains('bg-[#B8860B]') || false

      const allButtons = Array.from(document.querySelectorAll('button'))
      const btn7d = allButtons.find(btn => btn.textContent?.trim() === '7d')
      const btn30d = allButtons.find(btn => btn.textContent?.trim() === '30d')
      const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d')
      const btnAll = allButtons.find(btn => btn.textContent?.trim() === 'All')

      // Check for Net/Gross buttons
      const netBtn = allButtons.find(btn => btn.textContent?.includes('Net') || btn.title?.includes('Net'))
      const grossBtn = allButtons.find(btn => btn.textContent?.includes('Gross') || btn.title?.includes('Gross'))

      const btn7dActive = btn7d?.classList.contains('bg-[#B8860B]') || btn7d?.classList.contains('traderra-date-active') || false
      const btn30dActive = btn30d?.classList.contains('bg-[#B8860B]') || btn30d?.classList.contains('traderra-date-active') || false
      const btn90dActive = btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active') || false
      const btnAllActive = btnAll?.classList.contains('bg-[#B8860B]') || btnAll?.classList.contains('traderra-date-active') || false

      const netActive = netBtn?.classList.contains('bg-[#B8860B]') || netBtn?.classList.contains('active') || false
      const grossActive = grossBtn?.classList.contains('bg-[#B8860B]') || grossBtn?.classList.contains('active') || false

      return {
        dollar: dollarActive,
        r: rActive,
        day7: btn7dActive,
        day30: btn30dActive,
        day90: btn90dActive,
        all: btnAllActive,
        net: netActive,
        gross: grossActive
      }
    })
  }

  const sendCommand = async (command: string, commandNumber: number) => {
    console.log(`\n🧪 Command ${commandNumber}: "${command}"`)

    // Fill and send the command
    await page.fill('textarea[placeholder*="Ask Renata"]', command)
    await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

    // Wait for processing
    await sleep(4000)

    // Capture the chat response
    const chatMessages = await page.locator('.space-y-4 > div').allTextContents()
    const lastMessage = chatMessages[chatMessages.length - 1]
    console.log(`Response: "${lastMessage?.substring(0, 100)}${lastMessage?.length > 100 ? '...' : ''}"`)

    // Check if it's giving demo/example responses (indicates failure)
    const isExampleResponse = lastMessage?.includes('Some examples:') || lastMessage?.includes('Try:') || lastMessage?.includes('I can help you navigate')

    if (isExampleResponse) {
      console.log(`❌ Command ${commandNumber} FAILED - Got example response instead of processing command`)
      return false
    } else {
      console.log(`✅ Command ${commandNumber} SUCCESS - Got proper response`)
      return true
    }
  }

  const conversationChain = [
    "Can we look at the dashboard over the last 90 days in dollars?",
    "Great, now let's switch it to net.",
    "Actually, let's switch to R mode instead.",
    "Can we look at all time data?",
    "Switch back to gross P&L",
    "Let's look at the last 30 days",
    "Switch to the statistics page",
    "Show me in dollar view",
    "Let's see the last 7 days",
    "Switch to net results",
    "Go back to the dashboard",
    "Show all time data in R",
    "Switch to gross",
    "Let's see 90 days again",
    "Go to trades page",
    "Show in dollars",
    "Switch to net",
    "All time view please",
    "Back to dashboard in R",
    "Show me gross P&L for last 30 days"
  ]

  console.log(`\n📊 Testing ${conversationChain.length} commands in sequence...`)

  // Go to statistics page to start
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')
  await sleep(2000)

  let successfulCommands = 0
  let totalCommands = conversationChain.length

  // Execute conversation chain
  for (let i = 0; i < conversationChain.length; i++) {
    const success = await sendCommand(conversationChain[i], i + 1)
    if (success) {
      successfulCommands++
    } else {
      // If we get an example response, break the chain to see where it failed
      console.log(`\n🚨 CONVERSATION BREAKDOWN at command ${i + 1}`)
      break
    }

    // Small delay between commands to simulate real usage
    await sleep(1000)
  }

  console.log(`\n📊 === CONVERSATION CHAIN RESULTS ===`)
  console.log(`✅ Successful commands: ${successfulCommands}/${totalCommands}`)
  console.log(`📈 Success rate: ${Math.round((successfulCommands/totalCommands) * 100)}%`)

  if (successfulCommands < totalCommands) {
    console.log(`❌ Chain broke at command ${successfulCommands + 1}: "${conversationChain[successfulCommands]}"`)
  }

  // Capture final state
  const finalState = await captureButtonStates()
  console.log(`\n🎯 Final UI state: ${JSON.stringify(finalState)}`)

  console.log(`\n🔍 === ANALYSIS ===`)
  if (successfulCommands === totalCommands) {
    console.log(`🏆 PERFECT - All ${totalCommands} commands processed successfully!`)
  } else if (successfulCommands >= totalCommands * 0.8) {
    console.log(`✅ GOOD - Most commands worked, some late-chain issues`)
  } else if (successfulCommands >= totalCommands * 0.5) {
    console.log(`⚠️ MODERATE - System degraded mid-conversation`)
  } else if (successfulCommands >= 2) {
    console.log(`❌ POOR - System broke down after just a few commands`)
  } else {
    console.log(`💥 CRITICAL - System failed immediately`)
  }

  // Take final screenshot
  await page.screenshot({
    path: 'tests/screenshots/conversation-chain-results.png',
    fullPage: true
  })

  console.log('\n📸 Screenshot saved: tests/screenshots/conversation-chain-results.png')
})