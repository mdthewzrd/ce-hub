import { test, expect } from '@playwright/test'

test('Standalone Command Fixes Validation', async ({ page }) => {
  console.log('🧪 === STANDALONE COMMAND FIXES TEST ===')

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

      const btn7dActive = btn7d?.classList.contains('bg-[#B8860B]') || btn7d?.classList.contains('traderra-date-active') || false
      const btn30dActive = btn30d?.classList.contains('bg-[#B8860B]') || btn30d?.classList.contains('traderra-date-active') || false
      const btn90dActive = btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active') || false
      const btnAllActive = btnAll?.classList.contains('bg-[#B8860B]') || btnAll?.classList.contains('traderra-date-active') || false

      return {
        dollar: dollarActive,
        r: rActive,
        day7: btn7dActive,
        day30: btn30dActive,
        day90: btn90dActive,
        all: btnAllActive
      }
    })
  }

  const testStandaloneCommand = async (command: string, expectedChanges: any, testName: string) => {
    console.log(`\n🧪 Testing: ${testName}`)
    console.log(`Command: "${command}"`)

    // Go to statistics page for each test
    await page.goto('/statistics')
    await page.waitForSelector('textarea[placeholder*="Ask Renata"]')
    await sleep(2000)

    // Capture initial state
    const initialState = await captureButtonStates()
    console.log(`Initial state: ${JSON.stringify(initialState)}`)

    // Send command
    await page.fill('textarea[placeholder*="Ask Renata"]', command)
    await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

    // Wait for processing
    await sleep(4000)

    // Capture final state
    const finalState = await captureButtonStates()
    console.log(`Final state: ${JSON.stringify(finalState)}`)
    console.log(`Expected changes: ${JSON.stringify(expectedChanges)}`)

    // Check if expected changes occurred
    let success = true
    const changes: any = {}

    for (const [key, expectedValue] of Object.entries(expectedChanges)) {
      changes[key] = `${initialState[key]} → ${finalState[key]}`
      if (finalState[key] !== expectedValue) {
        success = false
      }
    }

    console.log('Changes observed:', JSON.stringify(changes))

    if (success) {
      console.log('✅ SUCCESS - Command worked correctly')
    } else {
      console.log('❌ FAILURE - Command did not produce expected changes')
    }

    return success
  }

  console.log('\n⚡ === TESTING STANDALONE COMMANDS ===')

  // Test 1: Standalone R command
  const rSuccess = await testStandaloneCommand(
    'R',
    { r: true, dollar: false },
    'Standalone R Command (Previously Timing Out)'
  )

  // Test 2: Standalone Dollar command
  const dollarSuccess = await testStandaloneCommand(
    'Dollar',
    { dollar: true, r: false },
    'Standalone Dollar Command'
  )

  // Test 3: Standalone All command
  const allSuccess = await testStandaloneCommand(
    'All',
    { all: true, day90: false, day30: false, day7: false },
    'Standalone All Time Command'
  )

  // Test 4: Standalone 90d command
  const ninetyDaySuccess = await testStandaloneCommand(
    '90d',
    { day90: true, all: false, day30: false, day7: false },
    'Standalone 90d Command'
  )

  console.log('\n📊 === STANDALONE COMMAND RESULTS ===')

  const totalTests = 4
  const successfulTests = [rSuccess, dollarSuccess, allSuccess, ninetyDaySuccess].filter(Boolean).length
  const successRate = Math.round((successfulTests / totalTests) * 100)

  console.log(`📈 Success Rate: ${successfulTests}/${totalTests} (${successRate}%)`)
  console.log(`✅ R Command: ${rSuccess ? 'FIXED' : 'STILL BROKEN'}`)
  console.log(`✅ Dollar Command: ${dollarSuccess ? 'WORKING' : 'BROKEN'}`)
  console.log(`✅ All Time Command: ${allSuccess ? 'WORKING' : 'BROKEN'}`)
  console.log(`✅ 90d Command: ${ninetyDaySuccess ? 'WORKING' : 'BROKEN'}`)

  console.log('\n🎯 === FINAL ASSESSMENT ===')
  if (successRate >= 100) {
    console.log('🏆 PERFECT - All standalone commands working!')
  } else if (successRate >= 75) {
    console.log('✅ EXCELLENT - Most standalone commands working')
  } else if (successRate >= 50) {
    console.log('⚠️ PROGRESS - Some standalone commands working')
  } else {
    console.log('❌ ISSUES - Most standalone commands still broken')
  }

  // Take final screenshot
  await page.screenshot({
    path: 'tests/screenshots/standalone-commands-results.png',
    fullPage: true
  })

  console.log('\n📸 Screenshot saved: tests/screenshots/standalone-commands-results.png')
})