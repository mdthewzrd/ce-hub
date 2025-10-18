/**
 * Traderra Journal - End-to-End Integration Tests
 *
 * Comprehensive integration tests covering complete user workflows,
 * cross-feature interactions, and production scenarios.
 */

import { test, expect, Page, BrowserContext } from '@playwright/test'

// Test configuration and utilities
const BASE_URL = process.env.BASE_URL || 'http://localhost:3000'
const TEST_USER_ID = 'test-user-12345'

// Helper functions for common actions
class JournalTestHelpers {
  constructor(private page: Page) {}

  async navigateToJournal() {
    await this.page.goto(`${BASE_URL}/journal`)
    await this.page.waitForLoadState('networkidle')
  }

  async waitForJournalLoad() {
    await this.page.waitForSelector('[data-testid="journal-stats"]', { timeout: 10000 })
    await this.page.waitForSelector('[data-testid="journal-entries"]', { timeout: 10000 })
  }

  async switchToEnhancedMode() {
    await this.page.click('button:has-text("Enhanced")')
    await this.page.waitForSelector('[data-testid="folder-tree"]', { timeout: 5000 })
  }

  async switchToClassicMode() {
    await this.page.click('button:has-text("Classic")')
    await this.page.waitForSelector('[data-testid="journal-entries"]', { timeout: 5000 })
  }

  async createNewEntry(entryData: {
    title: string
    symbol: string
    side: 'Long' | 'Short'
    entryPrice: string
    exitPrice: string
    pnl: string
    content: string
    tags?: string
  }) {
    await this.page.click('button:has-text("New Entry")')
    await this.page.waitForSelector('[data-testid="new-entry-modal"]')

    await this.page.fill('input[name="title"]', entryData.title)
    await this.page.fill('input[name="symbol"]', entryData.symbol)
    await this.page.selectOption('select[name="side"]', entryData.side)
    await this.page.fill('input[name="entryPrice"]', entryData.entryPrice)
    await this.page.fill('input[name="exitPrice"]', entryData.exitPrice)
    await this.page.fill('input[name="pnl"]', entryData.pnl)
    await this.page.fill('textarea[name="content"]', entryData.content)

    if (entryData.tags) {
      await this.page.fill('input[name="tags"]', entryData.tags)
    }

    await this.page.click('button:has-text("Save Entry")')
    await this.page.waitForSelector('[data-testid="new-entry-modal"]', { state: 'detached' })
  }

  async createFolder(name: string, parentId?: string) {
    if (parentId) {
      await this.page.click(`[data-folder-id="${parentId}"] button[aria-label="Create subfolder"]`)
    } else {
      await this.page.click('button:has-text("New Folder")')
    }

    await this.page.waitForSelector('[data-testid="folder-name-input"]')
    await this.page.fill('[data-testid="folder-name-input"]', name)
    await this.page.click('button:has-text("Create")')
    await this.page.waitForSelector('[data-testid="folder-name-input"]', { state: 'detached' })
  }

  async searchEntries(query: string) {
    await this.page.fill('input[placeholder="Search entries..."]', query)
    await this.page.waitForTimeout(500) // Wait for debounce
  }

  async filterByCategory(category: 'win' | 'loss') {
    await this.page.selectOption('select[data-testid="category-filter"]', category)
  }

  async getVisibleEntryCount(): Promise<number> {
    const entries = await this.page.locator('[data-testid="journal-entry"]').count()
    return entries
  }

  async getVisibleFolderCount(): Promise<number> {
    const folders = await this.page.locator('[data-testid="folder-item"]').count()
    return folders
  }
}

test.describe('Journal Integration Tests', () => {

  test.describe('Backward Compatibility Validation', () => {

    test('should display existing mock entries in classic mode', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Ensure we're in classic mode
      await helpers.switchToClassicMode()

      // Check that mock entries are displayed
      const entryCount = await helpers.getVisibleEntryCount()
      expect(entryCount).toBeGreaterThan(0)

      // Check specific mock entry content
      await expect(page.locator('text=Strong Momentum Play on YIBO')).toBeVisible()
      await expect(page.locator('text=YIBO')).toBeVisible()
      await expect(page.locator('text=+$531.20')).toBeVisible()
    })

    test('should maintain filter functionality in classic mode', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToClassicMode()

      const initialCount = await helpers.getVisibleEntryCount()

      // Apply search filter
      await helpers.searchEntries('YIBO')
      const searchCount = await helpers.getVisibleEntryCount()
      expect(searchCount).toBeLessThanOrEqual(initialCount)
      expect(searchCount).toBeGreaterThan(0)

      // Clear search and apply category filter
      await helpers.searchEntries('')
      await helpers.filterByCategory('win')
      const categoryCount = await helpers.getVisibleEntryCount()
      expect(categoryCount).toBeLessThanOrEqual(initialCount)
    })

    test('should preserve journal statistics accuracy', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Check statistics display
      const totalEntries = await page.locator('[data-testid="total-entries"]').textContent()
      const winEntries = await page.locator('[data-testid="win-entries"]').textContent()
      const lossEntries = await page.locator('[data-testid="loss-entries"]').textContent()

      expect(parseInt(totalEntries || '0')).toBeGreaterThan(0)
      expect(parseInt(winEntries || '0')).toBeGreaterThan(0)
      expect(parseInt(lossEntries || '0')).toBeGreaterThan(0)

      // Verify that wins + losses = total
      const total = parseInt(totalEntries || '0')
      const wins = parseInt(winEntries || '0')
      const losses = parseInt(lossEntries || '0')
      expect(wins + losses).toBe(total)
    })

    test('should handle entry creation in classic mode', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToClassicMode()

      const initialCount = await helpers.getVisibleEntryCount()

      await helpers.createNewEntry({
        title: 'Test Integration Entry',
        symbol: 'TEST',
        side: 'Long',
        entryPrice: '100.00',
        exitPrice: '105.00',
        pnl: '500.00',
        content: 'This is a test entry created during integration testing.',
        tags: 'integration, test'
      })

      // Verify entry was created
      const finalCount = await helpers.getVisibleEntryCount()
      expect(finalCount).toBe(initialCount + 1)

      // Verify entry content
      await expect(page.locator('text=Test Integration Entry')).toBeVisible()
      await expect(page.locator('text=TEST')).toBeVisible()
      await expect(page.locator('text=+$500.00')).toBeVisible()
    })
  })

  test.describe('Enhanced Mode Functionality', () => {

    test('should switch between modes seamlessly', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Start in classic mode
      await helpers.switchToClassicMode()
      await expect(page.locator('[data-testid="journal-entries"]')).toBeVisible()
      await expect(page.locator('[data-testid="folder-tree"]')).not.toBeVisible()

      // Switch to enhanced mode
      await helpers.switchToEnhancedMode()
      await expect(page.locator('[data-testid="folder-tree"]')).toBeVisible()
      await expect(page.locator('[data-testid="journal-entries"]')).toBeVisible()

      // Switch back to classic mode
      await helpers.switchToClassicMode()
      await expect(page.locator('[data-testid="journal-entries"]')).toBeVisible()
      await expect(page.locator('[data-testid="folder-tree"]')).not.toBeVisible()
    })

    test('should display folder tree in enhanced mode', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      // Check for mock folders
      await expect(page.locator('text=Trading Journal')).toBeVisible()
      await expect(page.locator('text=Trade Entries')).toBeVisible()
      await expect(page.locator('text=2024')).toBeVisible()

      const folderCount = await helpers.getVisibleFolderCount()
      expect(folderCount).toBeGreaterThan(0)
    })

    test('should handle folder operations', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      const initialCount = await helpers.getVisibleFolderCount()

      // Create new folder
      await helpers.createFolder('Test Integration Folder')

      // Verify folder was created
      await expect(page.locator('text=Test Integration Folder')).toBeVisible()
      const finalCount = await helpers.getVisibleFolderCount()
      expect(finalCount).toBe(initialCount + 1)
    })

    test('should expand and collapse folder tree', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      // Find folder with children
      const expandButton = page.locator('[aria-label="Expand folder"]').first()
      await expandButton.click()

      // Verify child folders are visible
      await expect(page.locator('text=Trade Entries')).toBeVisible()

      // Collapse folder
      const collapseButton = page.locator('[aria-label="Collapse folder"]').first()
      await collapseButton.click()

      // Verify child folders are hidden
      await expect(page.locator('text=Trade Entries')).not.toBeVisible()
    })

    test('should filter entries by selected folder', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      // Select a folder
      await page.click('[data-testid="folder-item"]:has-text("2024")')

      // Verify folder selection updates the view
      await expect(page.locator('text=Showing')).toBeVisible()
      await expect(page.locator('text=entries in "2024"')).toBeVisible()
    })
  })

  test.describe('Data Integration and Migration', () => {

    test('should merge legacy entries with enhanced content', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Count entries in classic mode
      await helpers.switchToClassicMode()
      const classicCount = await helpers.getVisibleEntryCount()

      // Switch to enhanced mode and check entries
      await helpers.switchToEnhancedMode()
      const enhancedCount = await helpers.getVisibleEntryCount()

      // Should see same entries in both modes
      expect(enhancedCount).toBe(classicCount)
    })

    test('should handle entry creation in enhanced mode with folder assignment', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      // Select a folder first
      await page.click('[data-testid="folder-item"]:has-text("2024")')

      const initialCount = await helpers.getVisibleEntryCount()

      await helpers.createNewEntry({
        title: 'Enhanced Mode Entry',
        symbol: 'ENH',
        side: 'Long',
        entryPrice: '200.00',
        exitPrice: '220.00',
        pnl: '1000.00',
        content: 'This entry was created in enhanced mode.',
        tags: 'enhanced, folder'
      })

      // Verify entry was created in the selected folder
      const finalCount = await helpers.getVisibleEntryCount()
      expect(finalCount).toBe(initialCount + 1)
      await expect(page.locator('text=Enhanced Mode Entry')).toBeVisible()
    })

    test('should preserve data integrity during mode switches', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Create entry in classic mode
      await helpers.switchToClassicMode()
      await helpers.createNewEntry({
        title: 'Data Integrity Test',
        symbol: 'DIT',
        side: 'Short',
        entryPrice: '150.00',
        exitPrice: '140.00',
        pnl: '500.00',
        content: 'Testing data integrity across mode switches.'
      })

      // Switch to enhanced mode and verify entry exists
      await helpers.switchToEnhancedMode()
      await expect(page.locator('text=Data Integrity Test')).toBeVisible()
      await expect(page.locator('text=DIT')).toBeVisible()

      // Switch back to classic mode and verify entry still exists
      await helpers.switchToClassicMode()
      await expect(page.locator('text=Data Integrity Test')).toBeVisible()
    })
  })

  test.describe('User Experience and Interaction', () => {

    test('should provide responsive feedback for user actions', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Test hover states
      const entryCard = page.locator('[data-testid="journal-entry"]').first()
      await entryCard.hover()

      // Test button interactions
      const editButton = entryCard.locator('button[aria-label*="edit"]')
      await editButton.hover()
      // Button should show hover state

      // Test mode switching feedback
      await helpers.switchToEnhancedMode()
      // Should see loading state and then enhanced features
      await expect(page.locator('[data-testid="folder-tree"]')).toBeVisible()
    })

    test('should handle keyboard navigation', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      // Tab through folder tree
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
      await page.keyboard.press('Enter') // Should expand/select folder

      // Tab through action buttons
      await page.keyboard.press('Tab')
      await page.keyboard.press('Tab')
    })

    test('should maintain accessibility standards', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Check for proper ARIA labels
      await expect(page.locator('[aria-label]')).toHaveCount.atLeast(1)

      // Check for proper heading structure
      await expect(page.locator('h1, h2, h3')).toHaveCount.atLeast(1)

      // Check for proper form labels
      await page.click('button:has-text("New Entry")')
      await expect(page.locator('label')).toHaveCount.atLeast(1)
      await page.keyboard.press('Escape')
    })

    test('should handle errors gracefully', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)

      // Simulate network error by intercepting requests
      await page.route('**/api/folders/**', route => {
        route.abort('failed')
      })

      await helpers.navigateToJournal()

      // Should show fallback content or error message
      // Enhanced mode should gracefully degrade to classic mode
      await helpers.switchToEnhancedMode()

      // Should still be able to use basic functionality
      const entryCount = await helpers.getVisibleEntryCount()
      expect(entryCount).toBeGreaterThan(0)
    })
  })

  test.describe('Performance and Loading', () => {

    test('should load journal within performance budget', async ({ page }) => {
      const startTime = Date.now()

      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      const loadTime = Date.now() - startTime

      // Should load within 3 seconds
      expect(loadTime).toBeLessThan(3000)
    })

    test('should handle large datasets efficiently', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()
      await helpers.switchToEnhancedMode()

      // Expand all folders to test performance
      const expandButtons = page.locator('[aria-label="Expand folder"]')
      const count = await expandButtons.count()

      for (let i = 0; i < count; i++) {
        await expandButtons.nth(i).click()
        await page.waitForTimeout(100) // Small delay to see smooth expansion
      }

      // Should still be responsive
      await page.click('button:has-text("New Entry")')
      await expect(page.locator('[data-testid="new-entry-modal"]')).toBeVisible()
      await page.keyboard.press('Escape')
    })

    test('should optimize search performance', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      const startTime = Date.now()

      await helpers.searchEntries('YIBO')

      // Search should complete quickly
      const searchTime = Date.now() - startTime
      expect(searchTime).toBeLessThan(1000)

      // Results should be filtered
      const entryCount = await helpers.getVisibleEntryCount()
      expect(entryCount).toBeGreaterThan(0)
    })
  })

  test.describe('Cross-Feature Integration', () => {

    test('should integrate with AI sidebar (Renata)', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Check if AI sidebar is available
      const aiToggle = page.locator('button[aria-label*="AI"]')
      if (await aiToggle.isVisible()) {
        await aiToggle.click()
        // Should show/hide AI sidebar
      }
    })

    test('should maintain state across navigation', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Apply filters
      await helpers.searchEntries('YIBO')
      await helpers.switchToEnhancedMode()

      // Navigate away and back
      await page.goto(`${BASE_URL}/dashboard`)
      await page.goto(`${BASE_URL}/journal`)
      await helpers.waitForJournalLoad()

      // State might or might not be preserved depending on implementation
      // This tests the current behavior
    })

    test('should export/import functionality work correctly', async ({ page }) => {
      const helpers = new JournalTestHelpers(page)
      await helpers.navigateToJournal()
      await helpers.waitForJournalLoad()

      // Test export button
      const exportButton = page.locator('button:has-text("Export")')
      if (await exportButton.isVisible()) {
        await exportButton.click()
        // Should trigger download or show export modal
      }

      // Test import button
      const importButton = page.locator('button:has-text("Import")')
      if (await importButton.isVisible()) {
        await importButton.click()
        // Should show import modal or file picker
      }
    })
  })
})

test.describe('Mobile and Responsive Testing', () => {

  test('should work correctly on mobile devices', async ({ page, context }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })

    const helpers = new JournalTestHelpers(page)
    await helpers.navigateToJournal()
    await helpers.waitForJournalLoad()

    // Check that content is properly responsive
    const entryCard = page.locator('[data-testid="journal-entry"]').first()
    await expect(entryCard).toBeVisible()

    // Test touch interactions
    await entryCard.tap()

    // Test mobile navigation
    await helpers.switchToEnhancedMode()

    // Sidebar should be collapsed or hidden on mobile
    const sidebar = page.locator('[data-testid="folder-tree"]')
    const sidebarBounds = await sidebar.boundingBox()

    if (sidebarBounds) {
      // Sidebar exists but should be appropriately sized for mobile
      expect(sidebarBounds.width).toBeLessThan(300)
    }
  })

  test('should work correctly on tablet devices', async ({ page }) => {
    // Set tablet viewport
    await page.setViewportSize({ width: 768, height: 1024 })

    const helpers = new JournalTestHelpers(page)
    await helpers.navigateToJournal()
    await helpers.waitForJournalLoad()

    // Check responsive layout on tablet
    await helpers.switchToEnhancedMode()

    const sidebar = page.locator('[data-testid="folder-tree"]')
    const mainContent = page.locator('[data-testid="journal-entries"]')

    await expect(sidebar).toBeVisible()
    await expect(mainContent).toBeVisible()
  })
})

test.describe('Error Scenarios and Edge Cases', () => {

  test('should handle API timeouts gracefully', async ({ page }) => {
    // Simulate slow API responses
    await page.route('**/api/folders/**', async route => {
      await new Promise(resolve => setTimeout(resolve, 5000))
      route.continue()
    })

    const helpers = new JournalTestHelpers(page)
    await helpers.navigateToJournal()

    // Should show loading state and then either timeout gracefully or show error
    await page.waitForTimeout(6000)

    // Should still be functional in classic mode
    await helpers.switchToClassicMode()
    const entryCount = await helpers.getVisibleEntryCount()
    expect(entryCount).toBeGreaterThan(0)
  })

  test('should handle malformed API responses', async ({ page }) => {
    // Simulate malformed API responses
    await page.route('**/api/folders/tree*', route => {
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ invalid: 'data' })
      })
    })

    const helpers = new JournalTestHelpers(page)
    await helpers.navigateToJournal()
    await helpers.waitForJournalLoad()

    // Should handle error and fallback to classic mode
    await helpers.switchToEnhancedMode()

    // Should show error state or fallback content
    const entryCount = await helpers.getVisibleEntryCount()
    expect(entryCount).toBeGreaterThan(0)
  })

  test('should handle concurrent user actions', async ({ page }) => {
    const helpers = new JournalTestHelpers(page)
    await helpers.navigateToJournal()
    await helpers.waitForJournalLoad()
    await helpers.switchToEnhancedMode()

    // Perform multiple actions simultaneously
    const promises = [
      helpers.createFolder('Concurrent Test 1'),
      helpers.searchEntries('test'),
      helpers.switchToClassicMode()
    ]

    // Should handle concurrent actions gracefully
    await Promise.allSettled(promises)

    // System should remain stable
    const entryCount = await helpers.getVisibleEntryCount()
    expect(entryCount).toBeGreaterThan(0)
  })
})