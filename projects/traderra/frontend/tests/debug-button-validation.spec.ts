import { test, expect } from '@playwright/test'

test('Debug button validation system', async ({ page }) => {
  // Navigate to statistics page
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  console.log('🔍 === DEBUGGING BUTTON STRUCTURE ===')

  // Inspect all buttons on the page
  const allButtons = await page.locator('button').all()
  console.log(`Found ${allButtons.length} total buttons`)

  // Look for display mode buttons ($ and R)
  console.log('\n🔍 === DISPLAY MODE BUTTONS ===')
  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i]
    const text = await button.textContent()
    const classes = await button.getAttribute('class')
    const title = await button.getAttribute('title')
    const ariaLabel = await button.getAttribute('aria-label')

    if (text?.trim() === '$' || text?.trim() === 'R') {
      console.log(`Button ${i}: "${text?.trim()}"`)
      console.log(`  Classes: "${classes}"`)
      console.log(`  Title: "${title}"`)
      console.log(`  Aria-label: "${ariaLabel}"`)

      // Check if this button appears active
      const hasActiveClass = classes?.includes('bg-[#B8860B]') || classes?.includes('active')
      console.log(`  Appears active: ${hasActiveClass}`)
    }
  }

  // Look for P&L mode buttons (G and N)
  console.log('\n🔍 === P&L MODE BUTTONS ===')
  for (let i = 0; i < allButtons.length; i++) {
    const button = allButtons[i]
    const text = await button.textContent()
    const classes = await button.getAttribute('class')
    const title = await button.getAttribute('title')

    if (text?.trim() === 'G' || text?.trim() === 'N') {
      console.log(`Button ${i}: "${text?.trim()}"`)
      console.log(`  Classes: "${classes}"`)
      console.log(`  Title: "${title}"`)

      // Check if this button appears active
      const hasActiveClass = classes?.includes('bg-[#B8860B]') || classes?.includes('active')
      console.log(`  Appears active: ${hasActiveClass}`)
    }
  }

  // Test clicking R button and inspect changes
  console.log('\n🔍 === TESTING R BUTTON CLICK ===')
  const rButton = page.locator('button', { hasText: 'R' }).first()
  if (await rButton.count() > 0) {
    console.log('Found R button, attempting click...')
    await rButton.click()
    await page.waitForTimeout(1000) // Wait for state change

    // Check if R button is now active
    const rClasses = await rButton.getAttribute('class')
    const rActive = rClasses?.includes('bg-[#B8860B]') || rClasses?.includes('active')
    console.log(`After click - R button classes: "${rClasses}"`)
    console.log(`After click - R button active: ${rActive}`)

    // Check $ button state too
    const dollarButton = page.locator('button', { hasText: '$' }).first()
    if (await dollarButton.count() > 0) {
      const dollarClasses = await dollarButton.getAttribute('class')
      const dollarActive = dollarClasses?.includes('bg-[#B8860B]') || dollarClasses?.includes('active')
      console.log(`After R click - $ button classes: "${dollarClasses}"`)
      console.log(`After R click - $ button active: ${dollarActive}`)
    }
  }

  // Test clicking N button and inspect changes
  console.log('\n🔍 === TESTING N BUTTON CLICK ===')
  const nButton = page.locator('button', { hasText: 'N' }).first()
  if (await nButton.count() > 0) {
    console.log('Found N button, attempting click...')
    await nButton.click()
    await page.waitForTimeout(1000) // Wait for state change

    // Check if N button is now active
    const nClasses = await nButton.getAttribute('class')
    const nActive = nClasses?.includes('bg-[#B8860B]') || nClasses?.includes('active')
    console.log(`After click - N button classes: "${nClasses}"`)
    console.log(`After click - N button active: ${nActive}`)

    // Check G button state too
    const gButton = page.locator('button', { hasText: 'G' }).first()
    if (await gButton.count() > 0) {
      const gClasses = await gButton.getAttribute('class')
      const gActive = gClasses?.includes('bg-[#B8860B]') || gClasses?.includes('active')
      console.log(`After N click - G button classes: "${gClasses}"`)
      console.log(`After N click - G button active: ${gActive}`)
    }
  }

  console.log('\n🔍 === DEBUG COMPLETE ===')
})

test('Test chat command with validation', async ({ page }) => {
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  // Test R command
  console.log('\n🧪 === TESTING R COMMAND VIA CHAT ===')
  await page.fill('textarea[placeholder*="Ask Renata"]', 'R')
  await page.press('textarea[placeholder*="Ask Renata"]', 'Enter')

  // Wait for processing
  await page.waitForTimeout(4000)

  // Check final button states
  const rButton = page.locator('button', { hasText: 'R' }).first()
  const dollarButton = page.locator('button', { hasText: '$' }).first()

  if (await rButton.count() > 0) {
    const rClasses = await rButton.getAttribute('class')
    const rActive = rClasses?.includes('bg-[#B8860B]')
    console.log(`After R command - R button active: ${rActive}`)
  }

  if (await dollarButton.count() > 0) {
    const dollarClasses = await dollarButton.getAttribute('class')
    const dollarActive = dollarClasses?.includes('bg-[#B8860B]')
    console.log(`After R command - $ button active: ${dollarActive}`)
  }

  // Check chat response
  const chatMessages = await page.locator('[class*="message"]').last().textContent()
  console.log(`Chat response: "${chatMessages}"`)
})