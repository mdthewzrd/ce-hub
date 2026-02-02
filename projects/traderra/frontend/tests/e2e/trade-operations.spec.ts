import { test, expect } from '@playwright/test'

test.describe('Trade Operations', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6565/trades')
    await page.waitForTimeout(3000)
  })

  test('delete button is clickable', async ({ page }) => {
    // Find the first delete button
    const deleteButtons = page.locator('button[title="Delete Trade"]')
    const count = await deleteButtons.count()

    console.log(`Found ${count} delete buttons`)

    if (count > 0) {
      const firstBtn = deleteButtons.first()

      // Check cursor
      const cursor = await firstBtn.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).cursor
      })
      console.log(`Delete button cursor: ${cursor}`)

      expect(cursor).toBe('pointer')
    }
  })

  test('table renders with proper structure', async ({ page }) => {
    // Wait for trades to load
    await page.waitForTimeout(3000)

    // Check if there are any trades
    const tableRows = page.locator('table tbody tr')
    const rowCount = await tableRows.count()

    console.log(`Found ${rowCount} trade rows`)

    if (rowCount > 0) {
      // Check for action buttons in the first row
      const firstRowActions = tableRows.first().locator('button').all()
      const actionCount = (await firstRowActions).length
      console.log(`Found ${actionCount} action buttons in first row`)

      // Check for Trash2 (delete) icon
      const deleteBtn = tableRows.first().locator('button[title="Delete Trade"]')
      const hasDeleteBtn = await deleteBtn.count() > 0
      console.log(`First row has delete button: ${hasDeleteBtn}`)
    }
  })

  test('check for console errors when clicking delete', async ({ page }) => {
    const errors: string[] = []

    page.on('console', msg => {
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      errors.push(error.toString())
    })

    await page.waitForTimeout(3000)

    // Try to click delete if there's a trade
    const deleteBtn = page.locator('button[title="Delete Trade"]').first()
    const count = await deleteBtn.count()

    if (count > 0) {
      // Dismiss the confirm dialog by mocking it
      page.on('dialog', dialog => dialog.accept())

      await deleteBtn.click({ timeout: 5000 })
      await page.waitForTimeout(1000)

      console.log('Console errors:', errors)
    } else {
      console.log('No delete buttons found - no trades to delete')
    }
  })
})
