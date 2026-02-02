import { test, expect } from '@playwright/test'

test.describe('Calendar Page Buttons', () => {
  test('calendar page buttons are clickable', async ({ page }) => {
    await page.goto('http://localhost:6565/calendar')
    await page.waitForTimeout(3000)

    // Test date range buttons (7d, 30d, 90d, YTD, All)
    const button7d = page.getByText('7d').first()
    await button7d.waitFor({ state: 'visible' })

    const cursor = await button7d.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor
    })
    console.log(`Calendar page 7d button cursor: ${cursor}`)

    expect(cursor).toBe('pointer')

    // Click the 7d button
    await button7d.click({ timeout: 5000 })
    console.log('7d button clicked successfully')

    await page.waitForTimeout(500)

    // Test P&L mode buttons (G, N)
    const gButton = page.locator('#pnl-mode-gross-button').first()
    await gButton.waitFor({ state: 'visible' })

    const gCursor = await gButton.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor
    })
    console.log(`Calendar page G button cursor: ${gCursor}`)

    expect(gCursor).toBe('pointer')

    // Click the G button
    await gButton.click({ timeout: 5000 })
    console.log('G button clicked successfully')
  })
})
