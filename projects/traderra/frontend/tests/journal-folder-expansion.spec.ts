import { test, expect } from '@playwright/test'

/**
 * Test specifically for folder expansion and child folder visibility
 */

test.describe('Journal Folder Expansion Issues', () => {
  test('debug folder expansion and child folder visibility', async ({ page }) => {
    console.log('=== DEBUGGING FOLDER EXPANSION ISSUES ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    console.log('Switching to enhanced mode...')
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(2000)

    // Look for folder tree structure
    console.log('\n1. Analyzing folder tree structure...')
    const folderTree = page.locator('.folder-tree')
    const isTreeVisible = await folderTree.isVisible()
    console.log(`Folder tree visible: ${isTreeVisible}`)

    if (isTreeVisible) {
      const treeHTML = await folderTree.innerHTML()
      console.log(`Tree HTML length: ${treeHTML.length} characters`)

      // Look for specific folder names in the HTML
      const expectedFolders = ['Trade Entries', 'Strategies', 'Research', 'Goals & Reviews']
      expectedFolders.forEach(folderName => {
        const hasFolder = treeHTML.includes(folderName)
        console.log(`HTML contains "${folderName}": ${hasFolder}`)
      })
    }

    // Look for expansion controls
    console.log('\n2. Checking expansion controls...')
    const expandButtons = page.locator('button[aria-label*="Expand"], button:has(svg[data-testid="chevron-right"]), button:has(svg[width="24"][height="24"][viewBox="0 0 24 24"])')
    const expandButtonCount = await expandButtons.count()
    console.log(`Found ${expandButtonCount} expand buttons`)

    // Try to find and click expand buttons
    for (let i = 0; i < expandButtonCount; i++) {
      const button = expandButtons.nth(i)
      const isVisible = await button.isVisible()
      const ariaLabel = await button.getAttribute('aria-label')
      console.log(`  Expand button ${i}: visible=${isVisible}, aria-label="${ariaLabel}"`)

      if (isVisible) {
        console.log(`  Attempting to click expand button ${i}...`)
        try {
          await button.click()
          await page.waitForTimeout(500)
          console.log(`  ✓ Clicked expand button ${i}`)
        } catch (error) {
          console.log(`  ✗ Failed to click expand button ${i}:`, error)
        }
      }
    }

    // After expansion attempts, recheck for folders
    console.log('\n3. Re-checking folders after expansion...')
    const allTreeItems = page.locator('[role="treeitem"]')
    const treeItemCount = await allTreeItems.count()
    console.log(`Tree items found after expansion: ${treeItemCount}`)

    for (let i = 0; i < treeItemCount; i++) {
      const item = allTreeItems.nth(i)
      const text = await item.textContent()
      const classes = await item.getAttribute('class')
      const level = classes?.includes('pl-') ? 'nested' : 'root'
      console.log(`  Item ${i}: "${text?.trim()}" (${level})`)
    }

    // Check if folders are in the data but not rendered
    console.log('\n4. Checking JavaScript state...')
    const jsState = await page.evaluate(() => {
      // Try to find React components or state
      const reactKeys = Object.keys(window).filter(key => key.startsWith('__REACT') || key.startsWith('_React'))
      const hasReact = reactKeys.length > 0

      // Look for folder data in window objects
      const folderData = {
        hasReact,
        reactKeys,
        windowKeys: Object.keys(window).filter(key =>
          key.toLowerCase().includes('folder') ||
          key.toLowerCase().includes('tree') ||
          key.toLowerCase().includes('journal')
        )
      }

      return folderData
    })

    console.log('JavaScript state:', jsState)

    // Take detailed screenshots
    await page.screenshot({ path: 'test-results/folder-expansion-full.png', fullPage: true })

    // Screenshot just the folder tree area
    if (isTreeVisible) {
      await folderTree.screenshot({ path: 'test-results/folder-tree-detail.png' })
    }

    // Test the mock data loading
    console.log('\n5. Checking mock data loading...')
    const mockDataCheck = await page.evaluate(() => {
      // Check if mockFolders data exists and is loaded
      const scripts = Array.from(document.scripts).map(script => script.textContent || '')
      const hasMockFolders = scripts.some(script => script.includes('mockFolders') || script.includes('Trade Entries'))

      return {
        hasMockFolders,
        scriptCount: scripts.length,
        hasJournalLayout: !!document.querySelector('.journal-layout')
      }
    })

    console.log('Mock data check:', mockDataCheck)
  })

  test('test manual folder tree expansion', async ({ page }) => {
    console.log('=== TESTING MANUAL FOLDER EXPANSION ===')

    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Switch to enhanced mode
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(2000)

    // Find the main folder (Trading Journal)
    const mainFolder = page.locator('[role="treeitem"]').first()
    const mainFolderText = await mainFolder.textContent()
    console.log(`Main folder: "${mainFolderText}"`)

    // Look for expand button within the main folder
    const expandButton = mainFolder.locator('button').first()
    const expandButtonExists = await expandButton.isVisible()
    console.log(`Expand button exists: ${expandButtonExists}`)

    if (expandButtonExists) {
      console.log('Clicking expand button...')
      await expandButton.click()
      await page.waitForTimeout(1000)

      // Check if child folders appeared
      const allFolders = page.locator('[role="treeitem"]')
      const folderCount = await allFolders.count()
      console.log(`Folders after expansion: ${folderCount}`)

      // List all visible folders
      for (let i = 0; i < folderCount; i++) {
        const folder = allFolders.nth(i)
        const text = await folder.textContent()
        const paddingLeft = await folder.evaluate(el => getComputedStyle(el).paddingLeft)
        console.log(`  Folder ${i}: "${text?.trim()}" (padding: ${paddingLeft})`)
      }
    }

    await page.screenshot({ path: 'test-results/manual-expansion-test.png', fullPage: true })
  })

  test('compare with working enhanced v2 structure', async ({ page }) => {
    console.log('=== COMPARING WITH ENHANCED V2 ===')

    await page.goto('/journal-enhanced-v2')
    await page.waitForLoadState('networkidle')

    // Find all folders in enhanced v2
    const v2Folders = page.locator('div:has(svg):has-text("Trading"), div:has(svg):has-text("Strategies"), div:has(svg):has-text("Research")')
    const v2FolderCount = await v2Folders.count()
    console.log(`Enhanced V2 folders found: ${v2FolderCount}`)

    // List folder structure
    for (let i = 0; i < Math.min(v2FolderCount, 10); i++) {
      const folder = v2Folders.nth(i)
      const text = await folder.textContent()
      const classes = await folder.getAttribute('class')
      const hasIcon = await folder.locator('svg').count() > 0
      console.log(`  V2 Folder ${i}: "${text?.substring(0, 30)}" (has icon: ${hasIcon})`)
    }

    // Test expansion in V2
    console.log('\nTesting V2 expansion...')
    const v2ExpandButtons = page.locator('button:has(svg[class*="chevron"])')
    const v2ExpandCount = await v2ExpandButtons.count()
    console.log(`V2 expand buttons: ${v2ExpandCount}`)

    if (v2ExpandCount > 0) {
      await v2ExpandButtons.first().click()
      await page.waitForTimeout(500)
      console.log('Clicked V2 expand button')
    }

    await page.screenshot({ path: 'test-results/v2-structure-comparison.png', fullPage: true })
  })
})