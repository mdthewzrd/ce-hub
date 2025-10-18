import { test, expect } from '@playwright/test'

/**
 * Focused debugging test for journal folder issues
 */

test.describe('Journal Folder Debug', () => {
  test('debug original journal folder issues', async ({ page }) => {
    // Navigate to journal
    await page.goto('/journal')
    await page.waitForLoadState('networkidle')

    // Take initial screenshot
    await page.screenshot({ path: 'test-results/debug-initial.png', fullPage: true })

    // Switch to enhanced mode
    console.log('Switching to enhanced mode...')
    const enhancedButton = page.locator('button:has-text("Enhanced")')
    await enhancedButton.click()
    await page.waitForTimeout(2000)

    await page.screenshot({ path: 'test-results/debug-enhanced-mode.png', fullPage: true })

    // Look for folder elements with different selectors
    console.log('Searching for folder elements...')

    const selectors = [
      '[role="treeitem"]',
      '.folder-tree',
      '.journal-layout',
      'text="Trade Entries"',
      'text="Trading Journal"',
      'div:has-text("Trade")',
      '[data-testid*="folder"]'
    ]

    for (const selector of selectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      console.log(`Selector "${selector}": ${count} elements found`)

      if (count > 0) {
        for (let i = 0; i < Math.min(count, 3); i++) {
          const element = elements.nth(i)
          const isVisible = await element.isVisible()
          const text = await element.textContent()
          console.log(`  Element ${i}: visible=${isVisible}, text="${text?.substring(0, 50)}..."`)
        }
      }
    }

    // Check for any folders specifically
    const folderElements = page.locator('[role="treeitem"]')
    const folderCount = await folderElements.count()
    console.log(`\nFound ${folderCount} folder elements`)

    if (folderCount > 0) {
      const firstFolder = folderElements.first()

      // Debug the first folder element
      const boundingBox = await firstFolder.boundingBox()
      const classes = await firstFolder.getAttribute('class')
      const innerHTML = await firstFolder.innerHTML()

      console.log('First folder details:')
      console.log('  Bounding box:', boundingBox)
      console.log('  Classes:', classes)
      console.log('  HTML (first 200 chars):', innerHTML.substring(0, 200))

      // Try to click it
      console.log('Attempting to click first folder...')
      try {
        await firstFolder.click()
        console.log('✓ Click successful')

        // Check if anything changed
        await page.waitForTimeout(500)
        const newClasses = await firstFolder.getAttribute('class')
        console.log('  Classes after click:', newClasses)
        console.log('  Classes changed:', classes !== newClasses)

      } catch (error) {
        console.log('✗ Click failed:', error)
      }
    }

    // Take final screenshot
    await page.screenshot({ path: 'test-results/debug-final.png', fullPage: true })
  })

  test('debug enhanced v2 journal folders', async ({ page }) => {
    console.log('Testing Enhanced V2...')

    await page.goto('/journal-enhanced-v2')
    await page.waitForLoadState('networkidle')

    await page.screenshot({ path: 'test-results/debug-v2-initial.png', fullPage: true })

    // Look for folder structure
    const folderSelectors = [
      'text="Trading Journal"',
      'text="Strategies"',
      '.space-y-1',
      '[data-testid*="folder"]',
      'div:has(svg):has-text("Trading")'
    ]

    for (const selector of folderSelectors) {
      const elements = page.locator(selector)
      const count = await elements.count()
      console.log(`V2 Selector "${selector}": ${count} elements found`)

      if (count > 0 && count < 10) { // Avoid too many elements
        for (let i = 0; i < count; i++) {
          const element = elements.nth(i)
          const isVisible = await element.isVisible()
          const text = await element.textContent()
          console.log(`  V2 Element ${i}: visible=${isVisible}, text="${text?.substring(0, 30)}..."`)

          if (isVisible && text?.includes('Trading')) {
            console.log('Attempting to click Trading folder...')
            try {
              await element.click()
              console.log('✓ V2 Click successful')
              await page.waitForTimeout(300)
            } catch (error) {
              console.log('✗ V2 Click failed:', error)
            }
            break
          }
        }
      }
    }

    await page.screenshot({ path: 'test-results/debug-v2-final.png', fullPage: true })
  })
})