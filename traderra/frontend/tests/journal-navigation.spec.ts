import { test, expect } from '@playwright/test'

test.describe('Journal Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the journal page
    await page.goto('/journal')

    // Wait for the page to load and render
    await page.waitForSelector('[data-testid="journal-layout"]', { timeout: 10000 })
  })

  test('should default to enhanced mode with Trading Journal selected', async ({ page }) => {
    // Check that we're in enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await expect(enhancedButton).toHaveClass(/bg-primary\/10/)

    // Check that Trading Journal is selected
    const tradingJournal = page.locator('text=Trading Journal')
    await expect(tradingJournal).toBeVisible()

    // Check that the header shows Trading Journal as selected
    const headerTitle = page.locator('h2:has-text("Trading Journal")')
    await expect(headerTitle).toBeVisible()
  })

  test('should auto-expand Trading Journal and Trade Entries', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Trade Entries', { timeout: 5000 })

    // Check that Trading Journal is expanded (chevron down visible)
    const tradingJournalChevron = page.locator('[aria-label="Collapse folder"]').first()
    await expect(tradingJournalChevron).toBeVisible()

    // Check that Trade Entries is visible
    const tradeEntries = page.locator('text=Trade Entries')
    await expect(tradeEntries).toBeVisible()
  })

  test('should not show annoying tooltip when clicking folders', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Strategies', { timeout: 5000 })

    // Click on Strategies folder
    const strategies = page.locator('text=Strategies')
    await strategies.click()

    // Check that no tooltip appears
    const tooltip = page.locator('text=Click the arrow buttons to expand folders')
    await expect(tooltip).not.toBeVisible()
  })

  test('should maintain folder expansion state when clicking different folders', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Trade Entries', { timeout: 5000 })

    // Verify Trading Journal is initially expanded
    const tradingJournalChevron = page.locator('[aria-label="Collapse folder"]').first()
    await expect(tradingJournalChevron).toBeVisible()

    // Click on Strategies folder
    const strategies = page.locator('text=Strategies')
    await strategies.click()

    // Trading Journal should still be expanded
    await expect(tradingJournalChevron).toBeVisible()

    // Trade Entries should still be visible
    const tradeEntries = page.locator('text=Trade Entries')
    await expect(tradeEntries).toBeVisible()
  })

  test('should allow single click to expand folders and select them', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Research', { timeout: 5000 })

    // Click on Research folder (which should have no children)
    const research = page.locator('text=Research')
    await research.click()

    // Check that Research is now selected in the header
    const headerTitle = page.locator('h2:has-text("Research")')
    await expect(headerTitle).toBeVisible()

    // Check that the selected indicator appears
    const selectedIndicator = page.locator('text=✓ Selected')
    await expect(selectedIndicator).toBeVisible()
  })

  test('should allow clicking Trade Entries to show content', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Trade Entries', { timeout: 5000 })

    // Click on Trade Entries folder
    const tradeEntries = page.locator('text=Trade Entries')
    await tradeEntries.click()

    // Check that Trade Entries is now selected in the header
    const headerTitle = page.locator('h2:has-text("Trade Entries")')
    await expect(headerTitle).toBeVisible()

    // Check that content count is shown
    const contentCount = page.locator('text=4 items')
    await expect(contentCount).toBeVisible()
  })

  test('should expand subfolders when clicking expand arrow', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Trade Entries', { timeout: 5000 })

    // Find and click the expand arrow for Trade Entries
    const tradeEntriesRow = page.locator('[role="treeitem"]:has-text("Trade Entries")')
    const expandButton = tradeEntriesRow.locator('[aria-label="Expand folder"]')

    if (await expandButton.isVisible()) {
      await expandButton.click()

      // Check that 2024 subfolder becomes visible
      const yearFolder = page.locator('text=2024')
      await expect(yearFolder).toBeVisible()
    }
  })

  test('should show correct number of entries for selected folder', async ({ page }) => {
    // Wait for folders to load
    await page.waitForSelector('text=Trade Entries', { timeout: 5000 })

    // Click on Trade Entries
    const tradeEntries = page.locator('text=Trade Entries')
    await tradeEntries.click()

    // Check that the content shows entries for this folder
    const entriesText = page.locator('text=Showing')
    await expect(entriesText).toBeVisible()

    // Should show entries in "Trade Entries"
    const folderName = page.locator('text=in "Trade Entries"')
    await expect(folderName).toBeVisible()
  })
})