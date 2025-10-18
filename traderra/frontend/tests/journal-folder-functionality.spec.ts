import { test, expect, Page, Locator } from '@playwright/test'

/**
 * Comprehensive test suite for Journal folder functionality
 * Tests both journal versions and identifies folder selection issues
 */

// Helper functions for common actions
async function navigateToJournal(page: Page, version: 'original' | 'enhanced-v2' = 'original') {
  const url = version === 'enhanced-v2' ? '/journal-enhanced-v2' : '/journal'
  await page.goto(url)
  await page.waitForLoadState('networkidle')
}

async function switchToEnhancedMode(page: Page) {
  // Click Enhanced mode toggle button
  const enhancedToggle = page.locator('button:has-text("Enhanced")')
  await enhancedToggle.click()
  await page.waitForTimeout(1000) // Wait for mode switch to complete
}

async function waitForFoldersToLoad(page: Page) {
  // Wait for either folder tree to be visible or loading states to resolve
  await page.waitForSelector('[role="tree"], .folder-tree, [data-testid="folder-tree"]', { timeout: 10000 })

  // Wait for any loading states to complete
  const loadingIndicator = page.locator('.animate-spin, [data-testid="loading"]')
  if (await loadingIndicator.isVisible()) {
    await loadingIndicator.waitFor({ state: 'hidden', timeout: 10000 })
  }
}

async function getFolderElements(page: Page): Promise<Locator[]> {
  // Try multiple selectors to find folder elements
  const selectors = [
    '[role="treeitem"]', // Standard tree item role
    '[data-testid="folder-item"]', // If data-testid is used
    '.folder-tree .group', // Class-based selector from FolderTree
    '.folder-tree [data-folder-id]', // If folder ID is stored as data attribute
    'div:has(svg):has-text("Trade Entries")', // Text-based selector for known folders
    'div:has(svg):has-text("Strategies")',
    'div:has(svg):has-text("Research")',
  ]

  let folderElements: Locator[] = []

  for (const selector of selectors) {
    const elements = page.locator(selector)
    const count = await elements.count()
    if (count > 0) {
      console.log(`Found ${count} elements with selector: ${selector}`)
      for (let i = 0; i < count; i++) {
        folderElements.push(elements.nth(i))
      }
      break // Use first successful selector
    }
  }

  return folderElements
}

async function debugElementState(page: Page, element: Locator, elementName: string) {
  console.log(`\n=== Debugging ${elementName} ===`)

  try {
    const isVisible = await element.isVisible()
    const isEnabled = await element.isEnabled()
    const boundingBox = await element.boundingBox()
    const innerHTML = await element.innerHTML()

    console.log(`Visible: ${isVisible}`)
    console.log(`Enabled: ${isEnabled}`)
    console.log(`Bounding Box:`, boundingBox)
    console.log(`HTML:`, innerHTML.substring(0, 200) + '...')

    // Check for event listeners by looking at onclick attributes
    const onclickAttr = await element.getAttribute('onclick')
    console.log(`Onclick attribute: ${onclickAttr}`)

  } catch (error) {
    console.log(`Error debugging element: ${error}`)
  }
}

async function captureConsoleLogs(page: Page) {
  const logs: string[] = []

  page.on('console', msg => {
    logs.push(`${msg.type()}: ${msg.text()}`)
  })

  page.on('pageerror', error => {
    logs.push(`PAGE ERROR: ${error.message}`)
  })

  return logs
}

test.describe('Journal Folder Functionality - Original Version', () => {
  test.beforeEach(async ({ page }) => {
    // Capture console logs for debugging
    await captureConsoleLogs(page)
  })

  test('should load journal page and display folders in enhanced mode', async ({ page }) => {
    await navigateToJournal(page)

    // Switch to enhanced mode
    await switchToEnhancedMode(page)

    // Wait for folders to load
    await waitForFoldersToLoad(page)

    // Verify folder tree is visible
    const folderTree = page.locator('.folder-tree, [role="tree"]')
    await expect(folderTree).toBeVisible()

    // Take screenshot for debugging
    await page.screenshot({ path: 'test-results/journal-enhanced-folders.png', fullPage: true })
  })

  test('should identify and interact with Trade Entries folder', async ({ page }) => {
    await navigateToJournal(page)
    await switchToEnhancedMode(page)
    await waitForFoldersToLoad(page)

    // Find Trade Entries folder using multiple strategies
    let tradeEntriesFolder: Locator | null = null

    // Strategy 1: Look for text content
    tradeEntriesFolder = page.locator('text="Trade Entries"').first()

    if (!(await tradeEntriesFolder.isVisible())) {
      // Strategy 2: Look for partial text match
      tradeEntriesFolder = page.locator('*:has-text("Trade")').first()
    }

    if (!(await tradeEntriesFolder.isVisible())) {
      // Strategy 3: Look for folder with trending-up icon
      tradeEntriesFolder = page.locator('div:has(svg[data-testid="trending-up"]):has-text("Trade")')
    }

    console.log('Trade Entries folder visibility:', await tradeEntriesFolder.isVisible())

    if (await tradeEntriesFolder.isVisible()) {
      await debugElementState(page, tradeEntriesFolder, 'Trade Entries Folder')

      // Attempt to click
      try {
        await tradeEntriesFolder.click()
        console.log('✓ Successfully clicked Trade Entries folder')
      } catch (error) {
        console.log('✗ Failed to click Trade Entries folder:', error)
      }
    } else {
      console.log('Trade Entries folder not found')

      // Debug: List all available elements
      const allFolders = await getFolderElements(page)
      console.log(`Found ${allFolders.length} potential folder elements`)

      for (let i = 0; i < allFolders.length; i++) {
        await debugElementState(page, allFolders[i], `Folder ${i}`)
      }
    }

    await page.screenshot({ path: 'test-results/trade-entries-interaction.png', fullPage: true })
  })

  test('should verify folder selection state changes', async ({ page }) => {
    await navigateToJournal(page)
    await switchToEnhancedMode(page)
    await waitForFoldersToLoad(page)

    // Get all folder elements
    const folderElements = await getFolderElements(page)

    if (folderElements.length === 0) {
      throw new Error('No folder elements found for testing')
    }

    // Test clicking each folder and verify state changes
    for (let i = 0; i < Math.min(folderElements.length, 3); i++) {
      const folder = folderElements[i]

      console.log(`\nTesting folder ${i}:`)
      await debugElementState(page, folder, `Folder ${i}`)

      // Check initial state
      const initialClasses = await folder.getAttribute('class')
      console.log(`Initial classes: ${initialClasses}`)

      // Click folder
      try {
        await folder.click()
        await page.waitForTimeout(500) // Wait for state change

        // Check if state changed
        const newClasses = await folder.getAttribute('class')
        console.log(`Classes after click: ${newClasses}`)

        const stateChanged = initialClasses !== newClasses
        console.log(`State changed: ${stateChanged}`)

        // Look for selected state indicators
        const hasSelectedClass = newClasses?.includes('selected') ||
                                 newClasses?.includes('bg-primary') ||
                                 newClasses?.includes('border-primary')
        console.log(`Has selection indicator: ${hasSelectedClass}`)

      } catch (error) {
        console.log(`Failed to click folder ${i}:`, error)
      }
    }

    await page.screenshot({ path: 'test-results/folder-selection-states.png', fullPage: true })
  })

  test('should test folder event handlers and JavaScript execution', async ({ page }) => {
    await navigateToJournal(page)
    await switchToEnhancedMode(page)
    await waitForFoldersToLoad(page)

    // Execute JavaScript to inspect event listeners
    const eventListenerInfo = await page.evaluate(() => {
      const folders = document.querySelectorAll('[role="treeitem"], .folder-tree .group')
      const info: any[] = []

      folders.forEach((folder, index) => {
        const element = folder as HTMLElement
        info.push({
          index,
          tagName: element.tagName,
          className: element.className,
          onclick: element.onclick ? 'present' : 'absent',
          hasClickListener: element.addEventListener ? 'method available' : 'method not available',
          textContent: element.textContent?.trim(),
          children: element.children.length
        })
      })

      return info
    })

    console.log('Event listener analysis:', JSON.stringify(eventListenerInfo, null, 2))

    // Test programmatic clicking vs user clicking
    const folderElements = await getFolderElements(page)

    if (folderElements.length > 0) {
      const testFolder = folderElements[0]

      // Test 1: Programmatic click via JavaScript
      console.log('\nTesting programmatic click...')
      await page.evaluate((element) => {
        if (element) element.click()
      }, await testFolder.elementHandle())

      await page.waitForTimeout(500)

      // Test 2: User simulation click
      console.log('Testing user simulation click...')
      await testFolder.click({ force: true })

      await page.waitForTimeout(500)

      // Test 3: Dispatch click event
      console.log('Testing dispatched click event...')
      await page.evaluate((element) => {
        if (element) {
          const event = new MouseEvent('click', {
            bubbles: true,
            cancelable: true,
            view: window
          })
          element.dispatchEvent(event)
        }
      }, await testFolder.elementHandle())
    }

    await page.screenshot({ path: 'test-results/event-handler-testing.png', fullPage: true })
  })

  test('should check for JavaScript errors and console issues', async ({ page }) => {
    const logs: string[] = []
    const errors: string[] = []

    page.on('console', msg => {
      logs.push(`${msg.type()}: ${msg.text()}`)
      if (msg.type() === 'error') {
        errors.push(msg.text())
      }
    })

    page.on('pageerror', error => {
      errors.push(`PAGE ERROR: ${error.message}`)
    })

    await navigateToJournal(page)
    await switchToEnhancedMode(page)
    await waitForFoldersToLoad(page)

    // Try to interact with folders and collect any errors
    const folderElements = await getFolderElements(page)

    for (let i = 0; i < Math.min(folderElements.length, 2); i++) {
      try {
        await folderElements[i].click()
        await page.waitForTimeout(300)
      } catch (error) {
        errors.push(`Click error on folder ${i}: ${error}`)
      }
    }

    console.log('\n=== CONSOLE LOGS ===')
    logs.forEach(log => console.log(log))

    console.log('\n=== ERRORS ===')
    errors.forEach(error => console.log(error))

    // Fail test if critical errors found
    const criticalErrors = errors.filter(error =>
      error.includes('TypeError') ||
      error.includes('ReferenceError') ||
      error.includes('Cannot read property') ||
      error.includes('undefined')
    )

    if (criticalErrors.length > 0) {
      throw new Error(`Critical JavaScript errors found: ${criticalErrors.join(', ')}`)
    }
  })
})

test.describe('Journal Folder Functionality - Enhanced V2 Version', () => {
  test('should load enhanced v2 and test folder interactions', async ({ page }) => {
    await navigateToJournal(page, 'enhanced-v2')

    // Wait for folders to load
    await page.waitForSelector('.space-y-1, [data-testid="enhanced-folder-tree"]', { timeout: 10000 })

    // Look for folders in enhanced v2
    const folderSelectors = [
      'text="Trading Journal"',
      'text="Strategies"',
      'text="Research"',
      'div:has(svg):has-text("Trading")',
      '[data-testid="folder-item"]'
    ]

    let foundFolders = 0
    for (const selector of folderSelectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      if (count > 0) {
        foundFolders += count
        console.log(`Found ${count} folders with selector: ${selector}`)

        // Test clicking the first one
        try {
          await elements.first().click()
          console.log(`✓ Successfully clicked folder: ${selector}`)
          await page.waitForTimeout(500)
        } catch (error) {
          console.log(`✗ Failed to click folder: ${selector}`, error)
        }
      }
    }

    console.log(`Total folders found in enhanced v2: ${foundFolders}`)

    await page.screenshot({ path: 'test-results/enhanced-v2-folders.png', fullPage: true })

    expect(foundFolders).toBeGreaterThan(0)
  })

  test('should test enhanced folder tree component interactions', async ({ page }) => {
    await navigateToJournal(page, 'enhanced-v2')

    // Wait for enhanced folder tree
    await page.waitForSelector('[data-testid="enhanced-folder-tree"], .space-y-1', { timeout: 10000 })

    // Look for expansion toggles (chevron buttons)
    const expandButtons = page.locator('button:has(svg[data-testid="chevron-right"]), button:has(svg[data-testid="chevron-down"])')
    const expandButtonCount = await expandButtons.count()

    console.log(`Found ${expandButtonCount} expand/collapse buttons`)

    // Test expansion
    if (expandButtonCount > 0) {
      await expandButtons.first().click()
      await page.waitForTimeout(500)
      console.log('✓ Tested folder expansion')
    }

    // Look for context menu triggers
    const contextMenuTriggers = page.locator('button[title="More options"], button:has(svg[data-testid="more-horizontal"])')
    const contextMenuCount = await contextMenuTriggers.count()

    console.log(`Found ${contextMenuCount} context menu triggers`)

    // Test context menu
    if (contextMenuCount > 0) {
      await contextMenuTriggers.first().click()
      await page.waitForTimeout(300)
      console.log('✓ Tested context menu trigger')
    }

    await page.screenshot({ path: 'test-results/enhanced-v2-interactions.png', fullPage: true })
  })
})

test.describe('Cross-Version Folder Functionality Comparison', () => {
  test('should compare folder behavior between versions', async ({ page }) => {
    const results = {
      original: { foldersFound: 0, clicksSuccessful: 0, errors: [] as string[] },
      enhancedV2: { foldersFound: 0, clicksSuccessful: 0, errors: [] as string[] }
    }

    // Test original version
    console.log('\n=== Testing Original Version ===')
    try {
      await navigateToJournal(page, 'original')
      await switchToEnhancedMode(page)
      await waitForFoldersToLoad(page)

      const originalFolders = await getFolderElements(page)
      results.original.foldersFound = originalFolders.length

      for (let i = 0; i < Math.min(originalFolders.length, 3); i++) {
        try {
          await originalFolders[i].click()
          results.original.clicksSuccessful++
          await page.waitForTimeout(200)
        } catch (error) {
          results.original.errors.push(`Click failed on folder ${i}: ${error}`)
        }
      }
    } catch (error) {
      results.original.errors.push(`Setup failed: ${error}`)
    }

    // Test enhanced v2 version
    console.log('\n=== Testing Enhanced V2 Version ===')
    try {
      await navigateToJournal(page, 'enhanced-v2')
      await page.waitForSelector('.space-y-1', { timeout: 10000 })

      const v2Folders = page.locator('div:has(svg):has-text("Trading"), div:has(svg):has-text("Strategies")')
      results.enhancedV2.foldersFound = await v2Folders.count()

      for (let i = 0; i < Math.min(await v2Folders.count(), 3); i++) {
        try {
          await v2Folders.nth(i).click()
          results.enhancedV2.clicksSuccessful++
          await page.waitForTimeout(200)
        } catch (error) {
          results.enhancedV2.errors.push(`Click failed on folder ${i}: ${error}`)
        }
      }
    } catch (error) {
      results.enhancedV2.errors.push(`Setup failed: ${error}`)
    }

    console.log('\n=== COMPARISON RESULTS ===')
    console.log(JSON.stringify(results, null, 2))

    // Generate comparison report
    const report = {
      summary: {
        originalFoldersWorking: results.original.clicksSuccessful > 0,
        enhancedV2FoldersWorking: results.enhancedV2.clicksSuccessful > 0,
        betterVersion: results.original.clicksSuccessful > results.enhancedV2.clicksSuccessful ? 'original' : 'enhanced-v2'
      },
      recommendations: [] as string[]
    }

    if (results.original.foldersFound === 0) {
      report.recommendations.push('Original version: No folders detected - check folder loading')
    }

    if (results.enhancedV2.foldersFound === 0) {
      report.recommendations.push('Enhanced V2: No folders detected - check folder loading')
    }

    if (results.original.clicksSuccessful === 0 && results.original.foldersFound > 0) {
      report.recommendations.push('Original version: Folders visible but clicks not working - check event handlers')
    }

    if (results.enhancedV2.clicksSuccessful === 0 && results.enhancedV2.foldersFound > 0) {
      report.recommendations.push('Enhanced V2: Folders visible but clicks not working - check event handlers')
    }

    console.log('\n=== DIAGNOSTIC REPORT ===')
    console.log(JSON.stringify(report, null, 2))

    await page.screenshot({ path: 'test-results/version-comparison.png', fullPage: true })
  })
})