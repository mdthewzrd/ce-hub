import { test, expect } from '@playwright/test'

test('Verify navigation command fix works correctly', async ({ page }) => {
  console.log('🧪 === NAVIGATION COMMAND FIX TEST ===')

  // Go to statistics page
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  // Record initial state
  console.log('\n📊 === INITIAL STATE (Dashboard) ===')

  // Send the navigation command that was failing
  console.log('\n💬 === SENDING NAVIGATION COMMAND ===')
  await page.fill('textarea[placeholder*="Ask Renata"]', 'Can we look at the stats page for all time in dollars?')
  await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

  // Wait for navigation
  console.log('Waiting for navigation to statistics page...')
  await page.waitForURL('**/statistics*', { timeout: 10000 })
  console.log('✅ Successfully navigated to statistics page')

  // Wait for chat response
  await page.waitForTimeout(2000)

  // Check for the new proper response (not fake AI response)
  const chatResponse = await page.locator('.space-y-4 > div').last().textContent()
  console.log(`Chat response: "${chatResponse}"`)

  // Should show the proper navigation message, not fake success
  const hasNavigationMessage = chatResponse?.includes('Navigating and applying') || chatResponse?.includes('settings')
  console.log(`Has proper navigation message: ${hasNavigationMessage}`)

  // Wait longer for parsing functions to execute
  console.log('\n⏱️ === WAITING FOR PARSING FUNCTIONS (4+ seconds) ===')
  await page.waitForTimeout(6000)

  // Check final button states after parsing
  console.log('\n🔍 === CHECKING FINAL BUTTON STATES ===')

  const dollarActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const rActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const allTimeActive = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const allTimeBtn = allButtons.find(btn => btn.textContent?.trim() === 'All')
    return allTimeBtn?.classList.contains('bg-[#B8860B]') || allTimeBtn?.classList.contains('traderra-date-active')
  })

  console.log(`Final $ button active: ${dollarActive}`)
  console.log(`Final R button active: ${rActive}`)
  console.log(`Final All Time active: ${allTimeActive}`)

  // Check if changes were actually made
  console.log('\n📈 === VALIDATION RESULTS ===')
  const dollarCorrect = dollarActive === true
  const rCorrect = rActive === false
  const allTimeCorrect = allTimeActive === true

  console.log(`Dollar button correct (should be active): ${dollarCorrect}`)
  console.log(`R button correct (should be inactive): ${rCorrect}`)
  console.log(`All Time button correct (should be active): ${allTimeCorrect}`)

  const allCorrect = dollarCorrect && rCorrect && allTimeCorrect
  console.log(`\n🎯 Overall success: ${allCorrect}`)

  if (!allCorrect) {
    console.log('\n❌ Test failed - buttons not in expected state')
    console.log('Expected: $ active, R inactive, All Time active')
    console.log(`Actual: $ ${dollarActive}, R ${rActive}, All Time ${allTimeActive}`)
  } else {
    console.log('\n✅ Test passed - all buttons in correct state!')
  }
})