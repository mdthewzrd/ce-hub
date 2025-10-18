import { test, expect } from '@playwright/test'

test.describe('Folder UX Validation', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6565/journal-enhanced-v2')
    await page.waitForLoadState('networkidle')
  })

  test('should document current broken behavior', async ({ page }) => {
    // Take screenshot of initial state
    await page.screenshot({
      path: 'test-results/01-initial-state.png',
      fullPage: true
    })

    // Find and click Trading Journal folder
    const tradingJournalFolder = page.locator('[data-testid="folder-trading-journal"], .group:has-text("Trading Journal")').first()
    await tradingJournalFolder.click()

    // Take screenshot after first click
    await page.screenshot({
      path: 'test-results/02-after-trading-journal-click.png',
      fullPage: true
    })

    // Wait a moment and click again to see if we need second click
    await page.waitForTimeout(500)
    await tradingJournalFolder.click()

    // Take screenshot after second click
    await page.screenshot({
      path: 'test-results/03-after-second-click.png',
      fullPage: true
    })

    // Try to find and click Trade Entries subfolder
    const tradeEntriesFolder = page.locator(':text("2024 Trades"), :text("Trade Entries")').first()
    if (await tradeEntriesFolder.isVisible()) {
      await tradeEntriesFolder.click()

      // Take screenshot after subfolder click
      await page.screenshot({
        path: 'test-results/04-after-subfolder-click.png',
        fullPage: true
      })
    }

    console.log('Screenshots saved to test-results/ directory')
  })

  test('should validate desired behavior after fix', async ({ page }) => {
    // Test the desired behavior:
    // 1. Single click should both highlight AND expand
    // 2. Parent folders should remain highlighted when navigating children

    // Click Trading Journal - should highlight AND expand in one action
    const tradingJournalFolder = page.locator('[data-testid="folder-trading-journal"]')
    await tradingJournalFolder.click()

    // Verify it's both selected (highlighted) and expanded (children visible)
    await expect(tradingJournalFolder).toHaveClass(/bg-primary\/15/)  // Direct selection styling

    // Look for child folders that should now be visible
    const subFolder = page.locator('[data-testid="folder-trades-2024"]')
    await expect(subFolder).toBeVisible()

    // Click a subfolder
    await subFolder.click()

    // Verify subfolder is now directly selected
    await expect(subFolder).toHaveClass(/bg-primary\/15/)

    // Verify parent folder is STILL highlighted but with path styling (maintaining hierarchy)
    await expect(tradingJournalFolder).toHaveClass(/bg-primary\/5/)

    // Take screenshot of final desired state
    await page.screenshot({
      path: 'test-results/05-desired-final-state.png',
      fullPage: true
    })

    console.log('✅ Folder hierarchy behavior validated successfully!')
  })
})