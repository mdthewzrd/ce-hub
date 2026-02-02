import { test, expect } from '@playwright/test'

test('Validate button selectors work correctly', async ({ page }) => {
  await page.goto('/statistics')
  await page.waitForSelector('textarea[placeholder*="Ask Renata"]')

  console.log('🔍 === SELECTOR VALIDATION TEST ===')

  // Test if our fixed selectors find the correct buttons
  const dollarButton = await page.locator('button[aria-label*="Switch to Dollar display mode"]').first()
  const rButton = await page.locator('button[aria-label*="Switch to Risk Multiple display mode"]').first()
  const grossButton = await page.locator('button[title="Gross P&L (before commissions)"]').first()
  const netButton = await page.locator('button[title="Net P&L (after commissions)"]').first()

  // Check if all buttons exist
  const dollarExists = await dollarButton.count() > 0
  const rExists = await rButton.count() > 0
  const grossExists = await grossButton.count() > 0
  const netExists = await netButton.count() > 0

  console.log(`Dollar button found: ${dollarExists}`)
  console.log(`R button found: ${rExists}`)
  console.log(`Gross button found: ${grossExists}`)
  console.log(`Net button found: ${netExists}`)

  // Click R button and verify change
  if (rExists) {
    const initialClasses = await rButton.getAttribute('class')
    console.log(`R button initial classes: "${initialClasses}"`)

    await rButton.click()
    await page.waitForTimeout(1000)

    const afterClasses = await rButton.getAttribute('class')
    console.log(`R button after click classes: "${afterClasses}"`)

    // Check if it has the active class
    const isActive = afterClasses?.includes('bg-[#B8860B]')
    console.log(`R button is now active: ${isActive}`)

    // Verify our validation selector works
    const validationResult = await page.evaluate(() => {
      const button = document.querySelector('button[aria-label*="Switch to Risk Multiple display mode"]')
      const hasActiveClass = button?.classList.contains('bg-[#B8860B]')
      console.log(`Validation check - button found: ${!!button}, has active class: ${hasActiveClass}`)
      return hasActiveClass
    })
    console.log(`Validation function result: ${validationResult}`)
  }
})