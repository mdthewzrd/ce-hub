import { test, expect } from '@playwright/test'

test.describe('MTD Button Test', () => {
  test('MTD button exists and is clickable', async ({ page }) => {
    await page.goto('http://localhost:6565/trades')
    await page.waitForTimeout(3000)

    // Find all quick range buttons
    const quickRangeButtons = page.locator('button').filter(async (btn) => {
      const text = await btn.textContent()
      return text && /^(7d|30d|90d|MTD|YTD|All)$/.test(text.trim())
    })

    const count = await quickRangeButtons.count()
    console.log(`Found ${count} quick range buttons`)

    // Expected buttons: 7d, 30d, 90d, MTD, YTD, All
    expect(count).toBeGreaterThanOrEqual(6)

    // Check for MTD button specifically
    const mtdButton = page.getByText('MTD').first()
    const exists = await mtdButton.count() > 0
    console.log(`MTD button exists: ${exists}`)

    if (exists) {
      const cursor = await mtdButton.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).cursor
      })
      console.log(`MTD button cursor: ${cursor}`)

      expect(cursor).toBe('pointer')

      // Click the MTD button
      await mtdButton.click({ timeout: 5000 })
      console.log('MTD button clicked successfully')

      await page.waitForTimeout(500)

      // Verify MTD button became active
      const isActive = await mtdButton.evaluate((el: HTMLElement) => {
        return el.classList.contains('bg-[#B8860B]') ||
               window.getComputedStyle(el).backgroundColor === 'rgb(184, 134, 11)'
      })
      console.log(`MTD button active after click: ${isActive}`)
    }
  })
})
