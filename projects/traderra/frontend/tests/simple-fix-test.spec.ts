import { test, expect } from '@playwright/test'

test('Simple test for parsing function fix', async ({ page }) => {
  console.log('🧪 === SIMPLE FIX TEST ===')

  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  // Record initial state
  const initialRActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const initialDollarActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  console.log(`Initial state - $ active: ${initialDollarActive}, R active: ${initialRActive}`)

  // Send simple R command
  console.log('\n💬 Sending simple "R" command...')
  await page.fill('textarea[placeholder*="Ask Renata"]', 'R')
  await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

  // Wait for processing
  await page.waitForTimeout(4000)

  // Check if parsing actually happened
  const finalRActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  const finalDollarActive = await page.evaluate(() => {
    const btn = document.querySelector('button[aria-label*="Switch to Dollar display mode"]')
    return btn?.classList.contains('bg-[#B8860B]')
  })

  console.log(`Final state - $ active: ${finalDollarActive}, R active: ${finalRActive}`)

  const rChanged = initialRActive !== finalRActive
  const dollarChanged = initialDollarActive !== finalDollarActive

  console.log(`R button changed: ${rChanged}, Dollar button changed: ${dollarChanged}`)

  if (rChanged || dollarChanged) {
    console.log('✅ SUCCESS - Parsing functions are now working!')
  } else {
    console.log('❌ STILL BROKEN - No button state changes detected')
  }
})