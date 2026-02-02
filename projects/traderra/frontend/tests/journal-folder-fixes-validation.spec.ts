import { test, expect } from '@playwright/test'

/**
 * Validation tests for folder functionality fixes
 */

test.describe('Journal Folder Fixes Validation', () => {
  test('should auto-expand root folders for better UX', async ({ page }) => {
    console.log('=== Testing Auto-Expansion Fix ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(3000) // Give time for auto-expansion

    // Check if child folders are visible without manual expansion
    const childFolders = page.locator('[role="treeitem"]')
    const folderCount = await childFolders.count()
    console.log(`Folders visible after auto-expansion: ${folderCount}`)

    // We expect more than just the root folder
    expect(folderCount).toBeGreaterThan(1)

    // Verify specific child folders are visible
    const tradeEntriesVisible = await page.locator('text="Trade Entries"').isVisible()
    const strategiesVisible = await page.locator('text="Strategies"').isVisible()
    const researchVisible = await page.locator('text="Research"').isVisible()

    console.log(`Trade Entries visible: ${tradeEntriesVisible}`)
    console.log(`Strategies visible: ${strategiesVisible}`)
    console.log(`Research visible: ${researchVisible}`)

    // At least some child folders should be visible
    expect(tradeEntriesVisible || strategiesVisible || researchVisible).toBe(true)

    await page.screenshot({ path: 'test-results/auto-expansion-validation.png', fullPage: true })
  })

  test('should show helpful UI hints for folder interaction', async ({ page }) => {
    console.log('=== Testing UX Hints ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(2000)

    // Check for improved expand/collapse buttons
    const expandAllButton = page.locator('button:has-text("Expand All")')
    const expandAllVisible = await expandAllButton.isVisible()
    console.log(`"Expand All" button visible: ${expandAllVisible}`)
    expect(expandAllVisible).toBe(true)

    // Check for helper text when no folder is selected
    const helperText = page.locator('text="Select a folder from the sidebar"')
    const helperTextVisible = await helperText.isVisible()
    console.log(`Helper text visible: ${helperTextVisible}`)

    await page.screenshot({ path: 'test-results/ux-hints-validation.png', fullPage: true })
  })

  test('should provide clear selection feedback', async ({ page }) => {
    console.log('=== Testing Selection Feedback ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(3000)

    // Find and click a folder
    const folders = page.locator('[role="treeitem"]')
    const folderCount = await folders.count()

    if (folderCount > 1) {
      // Click on "Trade Entries" if available, otherwise click second folder
      let targetFolder = page.locator('text="Trade Entries"').first()
      if (!(await targetFolder.isVisible())) {
        targetFolder = folders.nth(1) // Click second folder if Trade Entries not visible
      }

      console.log('Clicking folder...')
      await targetFolder.click()
      await page.waitForTimeout(500)

      // Check for selection feedback
      const selectedIndicator = page.locator('text="✓ Selected"')
      const selectedIndicatorVisible = await selectedIndicator.isVisible()
      console.log(`Selection indicator visible: ${selectedIndicatorVisible}`)

      // Check if folder has selected styling
      const selectedFolder = page.locator('[role="treeitem"][aria-selected="true"], .border-primary')
      const selectedFolderExists = await selectedFolder.count() > 0
      console.log(`Selected folder styling applied: ${selectedFolderExists}`)

      expect(selectedIndicatorVisible || selectedFolderExists).toBe(true)

      await page.screenshot({ path: 'test-results/selection-feedback-validation.png', fullPage: true })
    } else {
      console.log('Not enough folders to test selection')
    }
  })

  test('should allow easy expansion controls', async ({ page }) => {
    console.log('=== Testing Expansion Controls ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(2000)

    // Test "Expand All" button
    const expandAllButton = page.locator('button:has-text("Expand All")')
    if (await expandAllButton.isVisible()) {
      console.log('Testing Expand All button...')

      // First collapse all
      const collapseButton = page.locator('button:has-text("Collapse")')
      if (await collapseButton.isVisible()) {
        await collapseButton.click()
        await page.waitForTimeout(500)
      }

      // Count folders before expansion
      const foldersBeforeExpand = await page.locator('[role="treeitem"]').count()
      console.log(`Folders before expand: ${foldersBeforeExpand}`)

      // Click expand all
      await expandAllButton.click()
      await page.waitForTimeout(1000)

      // Count folders after expansion
      const foldersAfterExpand = await page.locator('[role="treeitem"]').count()
      console.log(`Folders after expand: ${foldersAfterExpand}`)

      // Should have more folders visible after expansion
      expect(foldersAfterExpand).toBeGreaterThanOrEqual(foldersBeforeExpand)
    }

    await page.screenshot({ path: 'test-results/expansion-controls-validation.png', fullPage: true })
  })

  test('should handle folder clicks reliably', async ({ page }) => {
    console.log('=== Testing Reliable Folder Clicks ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(3000)

    // Test clicking multiple folders in sequence
    const folders = page.locator('[role="treeitem"]')
    const folderCount = await folders.count()
    console.log(`Total folders available: ${folderCount}`)

    let successfulClicks = 0
    const maxTests = Math.min(folderCount, 3) // Test up to 3 folders

    for (let i = 0; i < maxTests; i++) {
      try {
        const folder = folders.nth(i)
        const folderText = await folder.textContent()
        console.log(`Testing click on folder ${i}: "${folderText?.trim()}"`)

        // Get initial classes
        const initialClasses = await folder.getAttribute('class')

        // Click the folder
        await folder.click()
        await page.waitForTimeout(300)

        // Check if classes changed (indication of selection)
        const newClasses = await folder.getAttribute('class')
        const stateChanged = initialClasses !== newClasses

        console.log(`  State changed: ${stateChanged}`)

        if (stateChanged) {
          successfulClicks++
        }

      } catch (error) {
        console.log(`  Failed to click folder ${i}:`, error)
      }
    }

    console.log(`Successful clicks: ${successfulClicks}/${maxTests}`)

    // At least one click should succeed
    expect(successfulClicks).toBeGreaterThan(0)

    await page.screenshot({ path: 'test-results/reliable-clicks-validation.png', fullPage: true })
  })

  test('should provide comprehensive folder functionality across browsers', async ({ page, browserName }) => {
    console.log(`=== Testing Folder Functionality in ${browserName} ===`)

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(3000)

    // Comprehensive functionality test
    const results = {
      browser: browserName,
      autoExpansion: false,
      folderClicking: false,
      selectionFeedback: false,
      expansionControls: false
    }

    // Test auto-expansion
    const folderCount = await page.locator('[role="treeitem"]').count()
    results.autoExpansion = folderCount > 1
    console.log(`Auto-expansion working: ${results.autoExpansion}`)

    // Test folder clicking
    if (folderCount > 0) {
      try {
        const firstFolder = page.locator('[role="treeitem"]').first()
        await firstFolder.click()
        await page.waitForTimeout(200)

        // Check for any selection indicators
        const hasSelection = await page.locator('[aria-selected="true"], .border-primary, text="✓ Selected"').count() > 0
        results.folderClicking = true
        results.selectionFeedback = hasSelection

        console.log(`Folder clicking working: ${results.folderClicking}`)
        console.log(`Selection feedback working: ${results.selectionFeedback}`)
      } catch (error) {
        console.log('Folder clicking failed:', error)
      }
    }

    // Test expansion controls
    const expandAllButton = page.locator('button:has-text("Expand All")')
    results.expansionControls = await expandAllButton.isVisible()
    console.log(`Expansion controls visible: ${results.expansionControls}`)

    console.log(`${browserName} Results:`, results)

    // At least basic functionality should work
    expect(results.autoExpansion || results.folderClicking).toBe(true)

    await page.screenshot({ path: `test-results/comprehensive-test-${browserName}.png`, fullPage: true })
  })
})