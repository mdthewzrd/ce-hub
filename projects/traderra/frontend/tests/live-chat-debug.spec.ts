import { test, expect } from '@playwright/test'

test('Debug live chat command execution', async ({ page }) => {
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  console.log('🔍 === LIVE CHAT DEBUG TEST ===')

  // First, inspect initial state
  console.log('\n📊 === INITIAL STATE ===')
  const initialDollarActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const initialRActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const initialAllTimeActive = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const allTimeBtn = allButtons.find(btn => btn.textContent?.trim() === 'All')
    return allTimeBtn?.classList.contains('bg-[#B8860B]') || allTimeBtn?.classList.contains('traderra-date-active')
  })

  const initial90dActive = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d')
    return btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active')
  })

  console.log(`Initial $ button active: ${initialDollarActive}`)
  console.log(`Initial R button active: ${initialRActive}`)
  console.log(`Initial All Time active: ${initialAllTimeActive}`)
  console.log(`Initial 90d active: ${initial90dActive}`)

  // Send the same command from your screenshot
  console.log('\n💬 === SENDING CHAT COMMAND ===')
  await page.fill('textarea[placeholder*="Ask Renata"]', 'Can we look at the stats page for all time in dollars?')
  await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

  // Wait longer for chat processing
  console.log('Waiting for chat processing...')
  await page.waitForTimeout(5000)

  // Check if any button actually changed
  console.log('\n🔍 === AFTER CHAT COMMAND ===')
  const afterDollarActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const afterRActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const afterAllTimeActive = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const allTimeBtn = allButtons.find(btn => btn.textContent?.trim() === 'All')
    return allTimeBtn?.classList.contains('bg-[#B8860B]') || allTimeBtn?.classList.contains('traderra-date-active')
  })

  const after90dActive = await page.evaluate(() => {
    const allButtons = Array.from(document.querySelectorAll('button'))
    const btn90d = allButtons.find(btn => btn.textContent?.trim() === '90d')
    return btn90d?.classList.contains('bg-[#B8860B]') || btn90d?.classList.contains('traderra-date-active')
  })

  console.log(`After $ button active: ${afterDollarActive}`)
  console.log(`After R button active: ${afterRActive}`)
  console.log(`After All Time active: ${afterAllTimeActive}`)
  console.log(`After 90d active: ${after90dActive}`)

  // Check for changes
  const dollarChanged = initialDollarActive !== afterDollarActive
  const rChanged = initialRActive !== afterRActive
  const allTimeChanged = initialAllTimeActive !== afterAllTimeActive
  const btn90dChanged = initial90dActive !== after90dActive

  console.log('\n📈 === CHANGES DETECTED ===')
  console.log(`Dollar button changed: ${dollarChanged}`)
  console.log(`R button changed: ${rChanged}`)
  console.log(`All Time button changed: ${allTimeChanged}`)
  console.log(`90d button changed: ${btn90dChanged}`)

  // Look for chat response
  const chatResponse = await page.locator('[role="main"] div').filter({ hasText: /switched to dollar|all time|Everything is now updated/i }).last().textContent()
  console.log(`\nChat claimed: "${chatResponse}"`)

  // Manual button click test
  console.log('\n🖱️  === MANUAL BUTTON CLICK TEST ===')
  const dollarButton = page.locator('button[aria-label*="Switch to Dollar display mode"]')

  if (await dollarButton.count() > 0) {
    console.log('Manually clicking dollar button...')
    await dollarButton.click()
    await page.waitForTimeout(1000)

    const manualDollarActive = await page.evaluate(() => {
      const btn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
      return btn?.classList.contains('bg-[#B8860B]')
    })
    console.log(`After manual click - $ button active: ${manualDollarActive}`)
  }
})