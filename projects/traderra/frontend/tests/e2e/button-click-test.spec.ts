import { test, expect } from '@playwright/test'

test.describe('Button Clickability Test', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:6565/trades')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000) // Wait for React hydration
  })

  test('should have pointer cursor on date selector buttons', async ({ page }) => {
    // Find the date selector buttons
    const dateButtons = page.locator('[data-testid^="date-range-"]').all()
    const count = (await dateButtons).length
    console.log(`Found ${count} date range buttons`)

    for (const button of await dateButtons) {
      const cursor = await button.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).cursor
      })
      const pointerEvents = await button.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).pointerEvents
      })
      const zIndex = await button.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).zIndex
      })

      console.log(`Button cursor: ${cursor}, pointer-events: ${pointerEvents}, z-index: ${zIndex}`)

      expect(cursor).toBe('pointer')
      expect(pointerEvents).toBe('auto')
    }
  })

  test('should have pointer cursor on P&L mode buttons', async ({ page }) => {
    // Find G and N buttons
    const gButton = page.locator('#pnl-mode-gross-button').first()
    const nButton = page.locator('#pnl-mode-net-button').first()

    for (const button of [gButton, nButton]) {
      const cursor = await button.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).cursor
      })
      const pointerEvents = await button.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).pointerEvents
      })

      console.log(`P&L Button cursor: ${cursor}, pointer-events: ${pointerEvents}`)

      expect(cursor).toBe('pointer')
      expect(pointerEvents).toBe('auto')
    }
  })

  test('should be clickable - 7d button', async ({ page }) => {
    const button = page.locator('[data-testid="date-range-week"]').first()
    await button.waitFor({ state: 'visible' })

    // Check if element is visible and enabled
    const isVisible = await button.isVisible()
    const isEnabled = await button.isEnabled()

    console.log(`7d button - visible: ${isVisible}, enabled: ${isEnabled}`)

    // Check if there's anything covering the button
    const boundingBox = await button.boundingBox()
    if (boundingBox) {
      const center = {
        x: boundingBox.x + boundingBox.width / 2,
        y: boundingBox.y + boundingBox.height / 2
      }

      // Check what element is at the center point
      const elementAtPoint = await page.evaluate((point) => {
        const el = document.elementFromPoint(point.x, point.y)
        return el?.tagName + (el?.id ? '#' + el.id : '') + (el?.className ? '.' + el.className.split(' ').join('.') : '')
      }, center)

      console.log(`Element at center of button: ${elementAtPoint}`)
    }

    // Try to click
    await button.click()
    await page.waitForTimeout(500)

    // Verify the click was registered by checking if the button became active
    const isActive = await button.getAttribute('data-active')
    console.log(`7d button data-active after click: ${isActive}`)
  })

  test('should be clickable - G button', async ({ page }) => {
    const button = page.locator('#pnl-mode-gross-button').first()
    await button.waitFor({ state: 'visible' })

    // Check if there's anything covering the button
    const boundingBox = await button.boundingBox()
    if (boundingBox) {
      const center = {
        x: boundingBox.x + boundingBox.width / 2,
        y: boundingBox.y + boundingBox.height / 2
      }

      const elementAtPoint = await page.evaluate((point) => {
        const el = document.elementFromPoint(point.x, point.y)
        return {
          tagName: el?.tagName,
          id: el?.id,
          className: el?.className,
          pointerEvents: el ? window.getComputedStyle(el).pointerEvents : null
        }
      }, center)

      console.log(`Element at center of G button:`, elementAtPoint)
    }

    // Try to click
    await button.click()
    await page.waitForTimeout(500)

    // Check if active
    const isActive = await button.evaluate((el: HTMLElement) => {
      return el.classList.contains('bg-[#B8860B]') || el.getAttribute('data-active') === 'true'
    })
    console.log(`G button active after click: ${isActive}`)
  })

  test('check for overlays covering the buttons', async ({ page }) => {
    const header = page.locator('.page-header, [class*="page-header"], header').first()
    const headerExists = await header.count()

    if (headerExists > 0) {
      const headerBox = await header.boundingBox()
      console.log(`Header bounding box:`, headerBox)

      // Check the header's z-index
      const zIndex = await header.evaluate((el: HTMLElement) => {
        return window.getComputedStyle(el).zIndex
      })
      console.log(`Header z-index: ${zIndex}`)
    }

    // Check for any fixed/absolute positioned elements that might be covering
    const overlays = await page.evaluate(() => {
      const allElements = document.querySelectorAll('*')
      const overlays: Array<{
        tag: string
        id: string
        classes: string
        position: string
        zIndex: string
        pointerEvents: string
        top: string
        left: string
        width: string
        height: string
      }> = []

      allElements.forEach(el => {
        const style = window.getComputedStyle(el)
        const position = style.position
        const pointerEvents = style.pointerEvents

        if ((position === 'fixed' || position === 'absolute') && pointerEvents !== 'none') {
          const rect = el.getBoundingClientRect()
          // Only include elements that are in the top area of the page
          if (rect.top < 200 && rect.left < window.innerWidth && rect.right > 0) {
            overlays.push({
              tag: el.tagName,
              id: el.id || '',
              classes: el.className || '',
              position: position,
              zIndex: style.zIndex,
              pointerEvents: pointerEvents,
              top: rect.top.toString(),
              left: rect.left.toString(),
              width: rect.width.toString(),
              height: rect.height.toString()
            })
          }
        }
      })

      return overlays
    })

    console.log(`Found ${overlays.length} potential overlay elements:`)
    overlays.forEach(o => {
      console.log(`  ${o.tag}${o.id ? '#' + o.id : ''}${o.classes ? '.' + o.classes.split(' ').slice(0, 2).join('.') : ''}`)
      console.log(`    position: ${o.position}, z-index: ${o.zIndex}, pointer-events: ${o.pointerEvents}`)
      console.log(`    rect: top=${o.top}, left=${o.left}, width=${o.width}, height=${o.height}`)
    })
  })

  test('compare dashboard vs trades page button styles', async ({ page }) => {
    // Test on dashboard
    await page.goto('http://localhost:6565')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const dashboardGButton = page.locator('#pnl-mode-gross-button').first()
    const dashboardGCursor = await dashboardGButton.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor
    })
    console.log(`Dashboard G button cursor: ${dashboardGCursor}`)

    // Test on trades page
    await page.goto('http://localhost:6565/trades')
    await page.waitForLoadState('networkidle')
    await page.waitForTimeout(2000)

    const tradesGButton = page.locator('#pnl-mode-gross-button').first()
    const tradesGCursor = await tradesGButton.evaluate((el: HTMLElement) => {
      return window.getComputedStyle(el).cursor
    })
    console.log(`Trades G button cursor: ${tradesGCursor}`)

    console.log(`Cursor match: ${dashboardGCursor === tradesGCursor}`)
  })
})
